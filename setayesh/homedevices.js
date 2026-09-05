'use strict';

// Home devices (smart-home control) — extracted from index.js as a cautious,
// characterization-tested step of splitting the server monolith (charter rule
// 3.4). The code below is MOVED VERBATIM from index.js; only the module wrapper
// and the deps destructure are new, so behavior is identical.
//
// This subsystem owns: the LAN scanner and device drivers (Samsung TV, Canon
// printer over IPP, Tuya/LSC cloud, Xiaomi miio), the device registry and the
// per-user permission matrix (with grants and step-up-guarded edits), the
// hardware command dispatch, and the /api/home/* endpoints. It keeps its own
// state file (.setayesh-homedevices.json) and is self-contained: nothing here
// is referenced elsewhere in index.js.
//
// net/dgram/http/https are required inside the moved body (as before); the
// other Node built-ins it uses are required here at module top. register(app,
// deps) mounts every /api/home/* route. deps: requireAuth, requireAdmin,
// requireStepUp, isAdmin, rateLimit, loadJsonFile, saveJsonFile, DATA_DIR,
// cfg, users.

const crypto = require('crypto');
const tls = require('tls');
const os = require('os');
const path = require('path');
const { spawn } = require('child_process');

function register(app, deps) {
  const { requireAuth, requireAdmin, requireStepUp, isAdmin, rateLimit,
          loadJsonFile, saveJsonFile, DATA_DIR, cfg, users } = deps;

// ---------------- Home devices ----------------
//
// Setayesh talks to the things in the house herself — no bridge, no cloud
// account, no second app. The layer has three parts:
//
//   1. A scanner that walks the local network and guesses what each address
//      is, from its open ports and its MAC prefix.
//   2. One small driver per device family. A driver is a plain object with
//      { probe, capabilities, command }. Adding support for a new brand later
//      means adding one object here — nothing else changes.
//   3. A permission matrix: user x device. Only the owners edit it, it takes
//      effect immediately, and a device that was just discovered starts
//      closed to everyone until someone opens it.
//
// Nothing here reaches the internet. Every command goes out on the LAN the
// server itself sits on, which is why the server has to be the thing at home:
// Fardin's phone can be anywhere, the command still lands in the living room.

const net = require('net');
const dgram = require('dgram');
const http = require('http');

// ---- minimal WebSocket client -------------------------------------------
// Samsung's remote protocol is WebSocket, and pulling in `ws` would mean the
// family has to run npm install after every update. The client below is the
// ~5% of RFC 6455 this app actually needs: handshake, masked text frames out,
// unmasked frames in, ping/pong. Dependency-free, like the rest of the app.

function wsFrame(payload) {
  const data = Buffer.from(payload, 'utf8');
  const mask = crypto.randomBytes(4);
  const len = data.length;
  let head;
  if (len < 126) {
    head = Buffer.alloc(2);
    head[1] = 0x80 | len;
  } else if (len < 65536) {
    head = Buffer.alloc(4);
    head[1] = 0x80 | 126;
    head.writeUInt16BE(len, 2);
  } else {
    head = Buffer.alloc(10);
    head[1] = 0x80 | 127;
    head.writeUInt32BE(0, 2);
    head.writeUInt32BE(len, 6);
  }
  head[0] = 0x81;                                  // FIN + text frame
  const masked = Buffer.alloc(len);
  for (let i = 0; i < len; i++) masked[i] = data[i] ^ mask[i % 4];
  return Buffer.concat([head, mask, masked]);
}

// Pull whole frames out of a growing buffer. Returns { messages, rest }.
function wsParse(buf) {
  const messages = [];
  let off = 0;
  while (buf.length - off >= 2) {
    const b0 = buf[off], b1 = buf[off + 1];
    const opcode = b0 & 0x0f;
    const masked = !!(b1 & 0x80);
    let len = b1 & 0x7f;
    let p = off + 2;
    if (len === 126) {
      if (buf.length - off < 4) break;
      len = buf.readUInt16BE(p); p += 2;
    } else if (len === 127) {
      if (buf.length - off < 10) break;
      p += 4;                                       // ignore the high 32 bits
      len = buf.readUInt32BE(p); p += 4;
    }
    if (masked) p += 4;
    if (buf.length - p < len) break;                // frame still arriving
    const payload = buf.slice(p, p + len);
    off = p + len;
    if (opcode === 0x1 || opcode === 0x0) messages.push(payload.toString('utf8'));
    else if (opcode === 0x8) messages.push({ __close: true });
  }
  return { messages, rest: buf.slice(off) };
}

// Open a socket, do the upgrade, hand back a tiny client.
// url: ws://host:port/path  or  wss://host:port/path
function wsOpen(url, timeoutMs) {
  return new Promise((resolve, reject) => {
    let u;
    try { u = new URL(url); } catch (e) { return reject(new Error('نشانی نامعتبر')); }
    const secure = u.protocol === 'wss:';
    const port = Number(u.port) || (secure ? 443 : 80);
    const key = crypto.randomBytes(16).toString('base64');
    const opts = { host: u.hostname, port, servername: undefined };
    // Televisions ship self-signed certificates. Refusing them would mean
    // refusing every Samsung TV ever made, so the check is off here — the
    // connection never leaves the house and carries no secret worth stealing.
    if (secure) opts.rejectUnauthorized = false;

    const sock = secure ? tls.connect(opts) : net.connect(opts);
    let done = false;
    const fail = (e) => { if (!done) { done = true; try { sock.destroy(); } catch (x) {} reject(e); } };
    const timer = setTimeout(() => fail(new Error('دستگاه جواب نداد')), timeoutMs || 8000);

    sock.setTimeout(0);
    sock.on('error', fail);

    sock.on(secure ? 'secureConnect' : 'connect', () => {
      sock.write(
        `GET ${u.pathname}${u.search} HTTP/1.1\r\n` +
        `Host: ${u.hostname}:${port}\r\n` +
        'Upgrade: websocket\r\n' +
        'Connection: Upgrade\r\n' +
        `Sec-WebSocket-Key: ${key}\r\n` +
        'Sec-WebSocket-Version: 13\r\n\r\n'
      );
    });

    let buf = Buffer.alloc(0);
    let upgraded = false;
    const listeners = [];

    sock.on('data', (chunk) => {
      buf = Buffer.concat([buf, chunk]);
      if (!upgraded) {
        const end = buf.indexOf('\r\n\r\n');
        if (end === -1) return;
        const head = buf.slice(0, end).toString('utf8');
        if (!/^HTTP\/1\.1 101/i.test(head)) return fail(new Error('دستگاه اتصال را نپذیرفت'));
        buf = buf.slice(end + 4);
        upgraded = true;
        clearTimeout(timer);
        done = true;
        resolve({
          send: (obj) => sock.write(wsFrame(typeof obj === 'string' ? obj : JSON.stringify(obj))),
          onMessage: (fn) => listeners.push(fn),
          close: () => { try { sock.destroy(); } catch (e) {} },
          socket: sock,
        });
      }
      const out = wsParse(buf);
      buf = out.rest;
      for (const m of out.messages) for (const fn of listeners) { try { fn(m); } catch (e) {} }
    });

    sock.on('close', () => {
      for (const fn of listeners) { try { fn({ __close: true }); } catch (e) {} }
      fail(new Error('اتصال بسته شد'));
    });
  });
}

// ---- small network helpers ----------------------------------------------

function probeTcp(ip, port, timeoutMs) {
  return new Promise((resolve) => {
    const s = new net.Socket();
    let settled = false;
    const finish = (ok) => { if (!settled) { settled = true; try { s.destroy(); } catch (e) {} resolve(ok); } };
    s.setTimeout(timeoutMs || 400);
    s.once('connect', () => finish(true));
    s.once('timeout', () => finish(false));
    s.once('error', () => finish(false));
    try { s.connect(port, ip); } catch (e) { finish(false); }
  });
}

// Which /24 networks is this machine actually on? Anything larger is not
// worth sweeping address by address, so only /24 and smaller are scanned.
function localSubnets() {
  const out = [];
  const ifs = os.networkInterfaces();
  for (const name of Object.keys(ifs)) {
    for (const a of ifs[name] || []) {
      if (a.family !== 'IPv4' || a.internal) continue;
      const parts = a.address.split('.').map(Number);
      if (parts.length !== 4) continue;
      const mask = String(a.netmask || '');
      if (mask && mask !== '255.255.255.0' && mask !== '255.255.254.0') continue;
      out.push({ iface: name, address: a.address, mac: (a.mac || '').toLowerCase(),
                 base: parts.slice(0, 3).join('.') });
    }
  }
  return out;
}

// The ARP cache is how we learn MAC addresses without root: anything the
// machine has spoken to recently is in there, and a MAC prefix names the
// manufacturer far more reliably than an open port does.
function arpTable() {
  return new Promise((resolve) => {
    const map = {};
    let out = '';
    let child;
    try {
      child = spawn(process.platform === 'win32' ? 'arp' : '/usr/sbin/arp', ['-a'],
                    { shell: false, windowsHide: true });
    } catch (e) { return resolve(map); }
    const done = () => {
      const re = /(\d+\.\d+\.\d+\.\d+)[^\da-f]+([0-9a-f]{2}[:-][0-9a-f]{2}[:-][0-9a-f]{2}[:-][0-9a-f]{2}[:-][0-9a-f]{2}[:-][0-9a-f]{2})/gi;
      let m;
      while ((m = re.exec(out))) map[m[1]] = m[2].replace(/-/g, ':').toLowerCase();
      resolve(map);
    };
    child.stdout.on('data', (d) => { out += d.toString(); });
    child.on('error', () => resolve(map));
    child.on('close', done);
    setTimeout(() => { try { child.kill(); } catch (e) {} resolve(map); }, 6000);
  });
}

// Manufacturer prefixes for the hardware this house actually owns. Short on
// purpose: a guess that names the right brand is useful, a guess that names
// the wrong one is worse than no guess.
const OUI = {
  samsung: ['00:12:fb', '00:15:b9', '00:16:32', '00:17:c9', '00:1a:8a', '00:1d:25', '00:21:19',
            '00:23:39', '00:24:54', '08:08:c2', '10:1d:c0', '18:3f:47', '1c:5a:3e', '24:4b:03',
            '28:39:26', '2c:44:01', '30:cd:a7', '34:23:87', '38:16:d1', '3c:8b:fe', '40:16:3b',
            '4c:3c:16', '50:32:75', '54:88:0e', '5c:49:7d', '68:27:37', '6c:2f:2c', '70:2a:d5',
            '78:1f:db', '7c:64:56', '84:25:db', '88:36:5f', '8c:71:f8', '94:51:03', '9c:02:98',
            'a0:07:98', 'a4:ff:d0', 'b4:79:a7', 'bc:14:85', 'c0:97:27', 'cc:07:ab', 'd0:66:7b',
            'd8:57:ef', 'e4:7c:f9', 'e8:50:8b', 'f0:72:8c', 'fc:03:9f'],
  canon:   ['00:00:85', '00:1e:8f', '00:bb:c1', '18:0c:ac', '2c:9e:fc', '34:5c:c3', '3c:2a:f4',
            '48:9c:29', '68:9a:b7', '88:87:17', 'a4:8c:db', 'c8:0c:c8', 'e4:8f:34', 'f4:81:39'],
  tuya:    ['10:d5:61', '18:69:d8', '1c:90:ff', '24:a1:60', '2c:f4:32', '38:1f:8d', '48:e1:e9',
            '50:8a:06', '54:ef:44', '68:57:2d', '70:03:9f', '7c:f6:66', '84:e3:42', '98:f4:ab',
            'a4:c1:38', 'b4:e6:2d', 'bc:dd:c2', 'cc:8c:bf', 'd4:a6:51', 'dc:4f:22', 'e0:98:06',
            'ec:fa:bc'],
  xiaomi:  ['00:9e:c8', '04:cf:8c', '0c:1d:af', '10:2a:b3', '14:f6:5a', '18:59:36', '20:82:c0',
            '28:6c:07', '34:80:b3', '38:a4:ed', '3c:bd:3e', '50:8f:4c', '54:48:e6', '58:44:98',
            '64:09:80', '64:b4:73', '68:df:dd', '74:23:44', '78:11:dc', '7c:1d:d9', '8c:be:be',
            '98:fa:e3', 'a4:50:46', 'ac:c1:ee', 'b0:e2:35', 'c4:0b:cb', 'd4:97:0b', 'f0:b4:29',
            'f8:a4:5f', 'fc:64:ba'],
};

function vendorFromMac(mac) {
  if (!mac) return null;
  const p = mac.slice(0, 8).toLowerCase();
  for (const [name, list] of Object.entries(OUI)) if (list.includes(p)) return name;
  return null;
}

// ---- device drivers ------------------------------------------------------
// Contract:
//   id            short key stored on each device record
//   label         shown in the interface
//   ports         ports that hint at this family during a scan
//   identify(c)   -> null, or { name, model, extra } when this really is one
//   capabilities  list of command names the interface should offer
//   command(dev, cmd, arg) -> { ok, ... }
//
// Everything a driver needs about a device lives in the device record, so a
// driver holds no state of its own and can be replaced without a migration.

const DRIVERS = {};

// -- Samsung television ----------------------------------------------------
// Modern sets answer an unauthenticated description request on 8001, which
// gives us the real name and model before anything is paired. Control runs
// over 8002 with a token the TV issues the first time, after someone accepts
// the on-screen prompt with the physical remote.

DRIVERS.samsung_tv = {
  id: 'samsung_tv',
  label: 'تلویزیون سامسونگ',
  ports: [8001, 8002],
  capabilities: ['on', 'off', 'volume_up', 'volume_down', 'mute', 'home', 'source', 'info'],

  async identify(c) {
    if (!c.open.includes(8001)) return null;
    const info = await httpJson(`http://${c.ip}:8001/api/v2/`, 3000).catch(() => null);
    const d = info && info.device;
    if (!d) return null;
    if (!/samsung/i.test(String(d.name || '') + String(info.name || '') + String(d.type || ''))) {
      if (c.vendor !== 'samsung') return null;
    }
    return {
      name: String(info.name || d.name || 'Samsung TV').slice(0, 60),
      model: String(d.modelName || '').slice(0, 40),
      extra: { wifiMac: String(d.wifiMac || '').toLowerCase(), tokenSupport: d.TokenAuthSupport !== 'false' },
    };
  },

  async command(dev, cmd, arg) {
    // Power on is the one thing the remote protocol cannot do: a TV that is
    // off has no WebSocket server listening. Wake-on-LAN is the only route,
    // and it needs "Power On with Mobile" enabled on the set itself.
    if (cmd === 'on') {
      const mac = (dev.extra && dev.extra.wifiMac) || dev.mac;
      if (!mac) throw new Error('برای روشن کردن، نشانی MAC تلویزیون لازم است.');
      await wakeOnLan(mac, dev.ip);
      return { ok: true, note: 'بسته‌ی بیدارباش فرستاده شد. اگر روشن نشد، در تنظیمات تلویزیون گزینه‌ی روشن شدن با موبایل را فعال کنید.' };
    }

    const keys = {
      off: 'KEY_POWER', volume_up: 'KEY_VOLUP', volume_down: 'KEY_VOLDOWN',
      mute: 'KEY_MUTE', home: 'KEY_HOME', source: 'KEY_SOURCE',
    };
    if (cmd === 'info') {
      const info = await httpJson(`http://${dev.ip}:8001/api/v2/`, 4000);
      return { ok: true, info: info && info.device ? { name: info.name, model: info.device.modelName } : null };
    }
    const key = keys[cmd];
    if (!key) throw new Error('این فرمان برای تلویزیون تعریف نشده.');

    const res = await samsungSend(dev, {
      method: 'ms.remote.control',
      params: { Cmd: 'Click', DataOfCmd: key, Option: 'false', TypeOfRemote: 'SendRemoteKey' },
    });
    return { ok: true, token: res.token || null };
  },
};

// Open the remote channel, wait for the TV to say it is connected, send one
// command, close. A token that comes back is new and must be stored.
function samsungSend(dev, payload) {
  return new Promise(async (resolve, reject) => {
    const name = Buffer.from('Setayesh').toString('base64');
    const tok = dev.token ? `&token=${encodeURIComponent(dev.token)}` : '';
    const url = `wss://${dev.ip}:8002/api/v2/channels/samsung.remote.control?name=${name}${tok}`;
    let client;
    let finished = false;
    const end = (err, out) => {
      if (finished) return;
      finished = true;
      try { client && client.close(); } catch (e) {}
      err ? reject(err) : resolve(out || {});
    };
    const guard = setTimeout(() => end(new Error('تلویزیون جواب نداد — شاید خاموش است.')), 10000);

    try { client = await wsOpen(url, 8000); }
    catch (e) { clearTimeout(guard); return end(e); }

    client.onMessage((raw) => {
      if (raw && raw.__close) return;
      let msg;
      try { msg = JSON.parse(raw); } catch (e) { return; }
      if (msg.event === 'ms.channel.connect') {
        const newToken = msg.data && msg.data.token ? String(msg.data.token) : null;
        try { client.send(payload); } catch (e) { clearTimeout(guard); return end(e); }
        setTimeout(() => { clearTimeout(guard); end(null, { token: newToken }); }, 600);
      } else if (msg.event === 'ms.channel.unauthorized') {
        clearTimeout(guard);
        end(new Error('تلویزیون اجازه نداد. روی صفحه‌ی تلویزیون درخواست را قبول کنید و دوباره بزنید.'));
      }
    });
  });
}

// A magic packet: six 0xFF bytes, then the MAC sixteen times. Broadcast on
// the device's own subnet, because a router will not forward it.
function wakeOnLan(mac, ip) {
  return new Promise((resolve, reject) => {
    const clean = String(mac).replace(/[^0-9a-f]/gi, '');
    if (clean.length !== 12) return reject(new Error('نشانی MAC نامعتبر است.'));
    const bytes = Buffer.from(clean, 'hex');
    const packet = Buffer.concat([Buffer.alloc(6, 0xff), Buffer.alloc(16 * 6)]);
    for (let i = 0; i < 16; i++) bytes.copy(packet, 6 + i * 6);

    const targets = ['255.255.255.255'];
    if (ip) targets.push(ip.split('.').slice(0, 3).join('.') + '.255');

    const sock = dgram.createSocket('udp4');
    sock.once('error', (e) => { try { sock.close(); } catch (x) {} reject(e); });
    sock.bind(() => {
      sock.setBroadcast(true);
      let left = targets.length * 2;
      const tick = () => { if (--left <= 0) { try { sock.close(); } catch (e) {} resolve(true); } };
      for (const t of targets) {
        sock.send(packet, 0, packet.length, 9, t, tick);
        sock.send(packet, 0, packet.length, 7, t, tick);
      }
    });
  });
}

// -- Canon printer (IPP / AirPrint) ---------------------------------------
// IPP is a binary protocol over plain HTTP, which is a gift: no driver, no
// vendor software, works from any network as long as the server is home.

DRIVERS.canon_printer = {
  id: 'canon_printer',
  label: 'پرینتر',
  ports: [631, 9100],
  capabilities: ['status', 'print'],

  async identify(c) {
    if (!c.open.includes(631)) return null;
    const attrs = await ippAttributes(c.ip).catch(() => null);
    if (!attrs) return c.vendor === 'canon'
      ? { name: 'Canon printer', model: '', extra: { path: '/ipp/print' } }
      : null;
    return {
      name: (attrs['printer-name'] || attrs['printer-make-and-model'] || 'Printer').slice(0, 60),
      model: (attrs['printer-make-and-model'] || '').slice(0, 60),
      extra: { path: '/ipp/print', formats: attrs['document-format-supported'] || [] },
    };
  },

  async command(dev, cmd, arg) {
    if (cmd === 'status') {
      const attrs = await ippAttributes(dev.ip);
      const state = { 3: 'آماده', 4: 'در حال چاپ', 5: 'متوقف' }[attrs['printer-state']] || 'نامشخص';
      return { ok: true, state, model: attrs['printer-make-and-model'] || '', raw: attrs };
    }
    if (cmd === 'print') {
      if (!arg || !arg.data) throw new Error('فایلی برای چاپ داده نشد.');
      const buf = Buffer.from(arg.data, 'base64');
      if (buf.length > 20 * 1024 * 1024) throw new Error('فایل برای چاپ خیلی بزرگ است (حداکثر ۲۰ مگابایت).');
      const job = await ippPrint(dev.ip, buf, arg.format || 'application/pdf', arg.name || 'setayesh', arg.user || 'setayesh');
      return { ok: true, job };
    }
    throw new Error('این فرمان برای پرینتر تعریف نشده.');
  },
};

// --- IPP encoding ---------------------------------------------------------
function ippString(tag, name, value) {
  const n = Buffer.from(name, 'utf8'), v = Buffer.from(value, 'utf8');
  const b = Buffer.alloc(1 + 2 + n.length + 2 + v.length);
  let o = 0;
  b[o++] = tag;
  b.writeUInt16BE(n.length, o); o += 2; n.copy(b, o); o += n.length;
  b.writeUInt16BE(v.length, o); o += 2; v.copy(b, o);
  return b;
}

function ippRequest(ip, opId, extraAttrs, body) {
  const uri = `ipp://${ip}:631/ipp/print`;
  const head = Buffer.alloc(8);
  head.writeUInt16BE(0x0200, 0);                       // IPP 2.0
  head.writeUInt16BE(opId, 2);
  head.writeUInt32BE(Math.floor(Math.random() * 0xffff) + 1, 4);

  const parts = [head, Buffer.from([0x01])];           // operation-attributes-tag
  parts.push(ippString(0x47, 'attributes-charset', 'utf-8'));
  parts.push(ippString(0x48, 'attributes-natural-language', 'en'));
  parts.push(ippString(0x45, 'printer-uri', uri));
  for (const a of extraAttrs || []) parts.push(a);
  parts.push(Buffer.from([0x03]));                     // end-of-attributes-tag
  if (body) parts.push(body);
  return Buffer.concat(parts);
}

function ippPost(ip, payload, timeoutMs) {
  return new Promise((resolve, reject) => {
    const req = http.request({
      host: ip, port: 631, path: '/ipp/print', method: 'POST',
      headers: { 'Content-Type': 'application/ipp', 'Content-Length': payload.length },
      timeout: timeoutMs || 8000,
    }, (res) => {
      const chunks = [];
      res.on('data', (d) => chunks.push(d));
      res.on('end', () => resolve(Buffer.concat(chunks)));
    });
    req.on('timeout', () => { req.destroy(new Error('پرینتر جواب نداد')); });
    req.on('error', reject);
    req.end(payload);
  });
}

// Walk the response and pull out the handful of attributes worth showing.
// A full IPP parser is not needed — names and values are length-prefixed, so
// a linear pass is enough and cannot run away on malformed input.
function ippParse(buf) {
  const out = {};
  let o = 8, lastName = null;
  while (o < buf.length) {
    const tag = buf[o++];
    if (tag === 0x03) break;
    if (tag < 0x10) continue;                          // delimiter, new group
    if (o + 2 > buf.length) break;
    const nlen = buf.readUInt16BE(o); o += 2;
    const name = nlen ? buf.slice(o, o + nlen).toString('utf8') : lastName;
    o += nlen;
    if (o + 2 > buf.length) break;
    const vlen = buf.readUInt16BE(o); o += 2;
    const raw = buf.slice(o, o + vlen); o += vlen;
    if (!name) continue;
    lastName = name;
    let value;
    if (tag === 0x21 || tag === 0x23) value = vlen === 4 ? raw.readInt32BE(0) : null;
    else if (tag === 0x22) value = raw[0] === 1;
    else value = raw.toString('utf8');
    if (out[name] === undefined) out[name] = value;
    else if (Array.isArray(out[name])) out[name].push(value);
    else out[name] = [out[name], value];
  }
  return out;
}

async function ippAttributes(ip) {
  const payload = ippRequest(ip, 0x000b, [
    ippString(0x42, 'requesting-user-name', 'setayesh'),
  ]);
  return ippParse(await ippPost(ip, payload, 6000));
}

async function ippPrint(ip, data, format, jobName, user) {
  const payload = ippRequest(ip, 0x0002, [
    ippString(0x42, 'requesting-user-name', String(user).slice(0, 40)),
    ippString(0x42, 'job-name', String(jobName).slice(0, 60)),
    ippString(0x49, 'document-format', format),
  ], data);
  const attrs = ippParse(await ippPost(ip, payload, 60000));
  return { id: attrs['job-id'] || null, state: attrs['job-state'] || null };
}

// -- families we can see but not yet drive --------------------------------
// Listed so a scan names them honestly instead of showing "unknown device".
// Their drivers land in the next release; until then the record is created
// and the interface says so plainly rather than offering buttons that fail.

DRIVERS.tuya_device = {
  id: 'tuya_device', label: 'دستگاه Tuya / LSC', ports: [6668], capabilities: [],
  async identify(c) {
    if (c.vendor === 'tuya' || c.open.includes(6668)) {
      return { name: 'LSC / Tuya device', model: '', extra: { pending: true } };
    }
    return null;
  },
  async command() { throw new Error('درایور Tuya در نسخه‌ی بعدی می‌آید.'); },
};

DRIVERS.xiaomi_device = {
  id: 'xiaomi_device', label: 'دستگاه شیائومی', ports: [54321], capabilities: [],
  async identify(c) {
    if (c.vendor === 'xiaomi') return { name: 'Xiaomi device', model: '', extra: { pending: true } };
    return null;
  },
  async command() { throw new Error('درایور شیائومی در نسخه‌ی بعدی می‌آید.'); },
};

// A tiny JSON fetch with a hard timeout — used by identify().
function httpJson(url, timeoutMs) {
  return new Promise((resolve, reject) => {
    const req = http.get(url, { timeout: timeoutMs || 4000 }, (res) => {
      let s = '';
      res.setEncoding('utf8');
      res.on('data', (d) => { s += d; if (s.length > 200000) req.destroy(); });
      res.on('end', () => { try { resolve(JSON.parse(s)); } catch (e) { reject(e); } });
    });
    req.on('timeout', () => req.destroy(new Error('timeout')));
    req.on('error', reject);
  });
}

// ---- the scan ------------------------------------------------------------

const SCAN_PORTS = [8001, 8002, 631, 9100, 6668, 554, 80];
let scanState = { running: false, startedAt: 0, found: [], progress: 0, total: 0, error: null };

async function scanNetwork() {
  if (scanState.running) return scanState;
  const subnets = localSubnets();
  scanState = { running: true, startedAt: Date.now(), found: [], progress: 0, error: null,
                total: subnets.length * 254 };
  const arp = await arpTable();

  const targets = [];
  for (const sn of subnets) {
    for (let i = 1; i <= 254; i++) {
      const ip = `${sn.base}.${i}`;
      if (ip === sn.address) continue;
      targets.push(ip);
    }
  }

  scanState.total = targets.length;
  const candidates = [];
  const CONCURRENCY = 120;
  let cursor = 0;

  async function worker() {
    while (cursor < targets.length) {
      const ip = targets[cursor++];
      const open = [];
      for (const p of SCAN_PORTS) {
        if (await probeTcp(ip, p, 350)) open.push(p);
      }
      scanState.progress++;
      const mac = arp[ip] || null;
      if (!open.length && !mac) continue;
      candidates.push({ ip, open, mac, vendor: vendorFromMac(mac) });
    }
  }
  await Promise.all(Array.from({ length: CONCURRENCY }, worker));

  // Ask each driver whether a candidate is one of its own. First claim wins,
  // and the order below puts the specific families ahead of the generic ones.
  const order = ['samsung_tv', 'canon_printer', 'tuya_device', 'xiaomi_device'];
  const found = [];
  for (const c of candidates) {
    let claimed = null;
    for (const key of order) {
      try {
        const hit = await DRIVERS[key].identify(c);
        if (hit) { claimed = Object.assign({ driver: key }, hit); break; }
      } catch (e) { /* a driver that throws simply does not claim it */ }
    }
    found.push({
      ip: c.ip, mac: c.mac, open: c.open, vendor: c.vendor,
      driver: claimed ? claimed.driver : null,
      name: claimed ? claimed.name : (c.vendor ? c.vendor + ' device' : 'دستگاه ناشناس'),
      model: claimed ? claimed.model : '',
      extra: claimed ? claimed.extra : {},
      known: !!Object.values(homedev.devices).find((d) => d.mac === c.mac || d.ip === c.ip),
    });
  }

  scanState.running = false;
  scanState.found = found;
  scanState.finishedAt = Date.now();
  return scanState;
}

// ---- registry and the permission matrix ---------------------------------

const HOMEDEV_FILE = process.env.SETAYESH_HOMEDEV_FILE || path.join(DATA_DIR, '.setayesh-homedevices.json');
let homedev = loadJsonFile(HOMEDEV_FILE, { devices: {}, perms: {}, grants: [] });
if (!homedev.devices) homedev.devices = {};
if (!homedev.perms) homedev.perms = {};
if (!Array.isArray(homedev.grants)) homedev.grants = [];
function saveHomedev() { saveJsonFile(HOMEDEV_FILE, homedev); }

// A newly added device is closed to everyone but the owners. Opening it is a
// deliberate act, never a side effect of discovery.
function canUseDevice(username, devId) {
  if (isAdmin(username)) return true;
  const d = homedev.devices[devId];
  if (!d || d.enabled === false) return false;
  if (homedev.perms[username] && homedev.perms[username][devId]) return true;
  const now = Date.now();
  return homedev.grants.some((g) => g.user === username && g.dev === devId && g.until > now);
}

function pruneGrants() {
  const now = Date.now();
  const before = homedev.grants.length;
  homedev.grants = homedev.grants.filter((g) => g.until > now);
  if (homedev.grants.length !== before) saveHomedev();
}
setInterval(pruneGrants, 5 * 60 * 1000).unref();

function deviceView(d, username) {
  return {
    id: d.id, name: d.name, driver: d.driver, driverLabel: (DRIVERS[d.driver] || {}).label || '—',
    model: d.model || '', ip: d.ip, mac: d.mac || '', room: d.room || '',
    enabled: d.enabled !== false, paired: !!d.token,
    pending: !!(d.extra && d.extra.pending),
    capabilities: (DRIVERS[d.driver] || {}).capabilities || [],
    allowed: canUseDevice(username, d.id),
    lastSeen: d.lastSeen || null, addedAt: d.addedAt,
  };
}

// ---- endpoints -----------------------------------------------------------

// Everyone sees the devices they are allowed to use, and nothing else. The
// full list, the matrix, and the scanner are owner-only.
app.get('/api/home/devices', requireAuth, (req, res) => {
  pruneGrants();
  const all = Object.values(homedev.devices);
  const mine = isAdmin(req.username) ? all : all.filter((d) => canUseDevice(req.username, d.id));
  res.json({ devices: mine.map((d) => deviceView(d, req.username)), admin: isAdmin(req.username) });
});

app.post('/api/home/scan', requireAuth, requireAdmin, async (req, res) => {
  if (scanState.running) return res.json({ running: true, progress: scanState.progress, total: scanState.total });
  scanNetwork().catch((e) => { scanState.running = false; scanState.error = e.message; });
  res.json({ started: true });
});

app.get('/api/home/scan', requireAuth, requireAdmin, (req, res) => {
  res.json({
    running: scanState.running, progress: scanState.progress, total: scanState.total,
    error: scanState.error, found: scanState.running ? [] : scanState.found,
    finishedAt: scanState.finishedAt || null,
  });
});

app.post('/api/home/devices', requireAuth, requireAdmin, (req, res) => {
  const b = req.body || {};
  const ip = String(b.ip || '').trim();
  if (!/^\d+\.\d+\.\d+\.\d+$/.test(ip)) return res.status(400).json({ error: 'نشانی IP معتبر نیست.' });
  const driver = String(b.driver || '');
  if (!DRIVERS[driver]) return res.status(400).json({ error: 'این نوع دستگاه شناخته نشد.' });
  if (Object.keys(homedev.devices).length >= 60) return res.status(400).json({ error: 'حداکثر ۶۰ دستگاه.' });

  const id = crypto.randomBytes(6).toString('hex');
  homedev.devices[id] = {
    id, driver, ip,
    name: String(b.name || DRIVERS[driver].label).slice(0, 60),
    model: String(b.model || '').slice(0, 60),
    mac: String(b.mac || '').toLowerCase().slice(0, 20),
    room: String(b.room || '').slice(0, 40),
    extra: b.extra && typeof b.extra === 'object' ? b.extra : {},
    enabled: true, token: null,
    addedAt: new Date().toISOString(),
  };
  saveHomedev();
  res.json({ ok: true, device: deviceView(homedev.devices[id], req.username) });
});

app.put('/api/home/devices/:id', requireAuth, requireAdmin, (req, res) => {
  const d = homedev.devices[req.params.id];
  if (!d) return res.status(404).json({ error: 'دستگاه پیدا نشد.' });
  const b = req.body || {};
  if (b.name !== undefined) d.name = String(b.name).slice(0, 60);
  if (b.room !== undefined) d.room = String(b.room).slice(0, 40);
  if (b.ip !== undefined && /^\d+\.\d+\.\d+\.\d+$/.test(String(b.ip))) d.ip = String(b.ip);
  if (b.mac !== undefined) d.mac = String(b.mac).toLowerCase().slice(0, 20);
  if (b.enabled !== undefined) d.enabled = !!b.enabled;
  saveHomedev();
  res.json({ ok: true, device: deviceView(d, req.username) });
});

// Removing a device is one of the actions that asks for the password again.
app.delete('/api/home/devices/:id', requireAuth, requireAdmin, requireStepUp, (req, res) => {
  const d = homedev.devices[req.params.id];
  if (!d) return res.status(404).json({ error: 'دستگاه پیدا نشد.' });
  delete homedev.devices[req.params.id];
  for (const u of Object.keys(homedev.perms)) delete homedev.perms[u][req.params.id];
  homedev.grants = homedev.grants.filter((g) => g.dev !== req.params.id);
  saveHomedev();
  res.json({ ok: true });
});

// The matrix, as the interface draws it: one row per account, one column per
// device, plus whatever temporary grants are live right now.
app.get('/api/home/permissions', requireAuth, requireAdmin, (req, res) => {
  pruneGrants();
  res.json({
    users: [...users.keys()],
    devices: Object.values(homedev.devices).map((d) => ({ id: d.id, name: d.name, room: d.room || '' })),
    perms: homedev.perms,
    grants: homedev.grants,
    admins: [...users.keys()].filter((u) => isAdmin(u)),
  });
});

// One cell of the matrix. Takes effect on the next command — no restart, and
// the user does not have to sign in again.
app.post('/api/home/permissions', requireAuth, requireAdmin, requireStepUp, (req, res) => {
  const b = req.body || {};
  const user = String(b.user || '');
  const dev = String(b.device || '');
  if (!users.has(user)) return res.status(400).json({ error: 'این حساب وجود ندارد.' });
  if (!homedev.devices[dev]) return res.status(400).json({ error: 'این دستگاه وجود ندارد.' });

  if (b.until) {
    const until = new Date(b.until).getTime();
    if (!until || until < Date.now()) return res.status(400).json({ error: 'زمان پایان معتبر نیست.' });
    if (until > Date.now() + 30 * 24 * 3600 * 1000) return res.status(400).json({ error: 'حداکثر ۳۰ روز.' });
    homedev.grants = homedev.grants.filter((g) => !(g.user === user && g.dev === dev));
    homedev.grants.push({ user, dev, until, by: req.username });
  } else {
    homedev.perms[user] = homedev.perms[user] || {};
    if (b.allowed) homedev.perms[user][dev] = true;
    else delete homedev.perms[user][dev];
    homedev.grants = homedev.grants.filter((g) => !(g.user === user && g.dev === dev));
  }
  saveHomedev();
  res.json({ ok: true, perms: homedev.perms, grants: homedev.grants });
});

// Back to the sensible default: owners get everything, and an account whose
// name matches a device gets that device and nothing else.
app.post('/api/home/permissions/reset', requireAuth, requireAdmin, requireStepUp, (req, res) => {
  homedev.perms = {};
  homedev.grants = [];
  for (const u of users.keys()) {
    if (isAdmin(u)) continue;
    homedev.perms[u] = {};
    for (const d of Object.values(homedev.devices)) {
      const label = (d.name + ' ' + (d.room || '')).toLowerCase();
      if (label.includes(u.toLowerCase())) homedev.perms[u][d.id] = true;
      if (d.driver === 'canon_printer') homedev.perms[u][d.id] = true;
    }
  }
  saveHomedev();
  res.json({ ok: true, perms: homedev.perms });
});

// The one endpoint that actually touches the house.
const deviceLimiter = rateLimit({ windowMs: 60 * 1000, max: 60 });
app.post('/api/home/devices/:id/command', requireAuth, deviceLimiter, async (req, res) => {
  const d = homedev.devices[req.params.id];
  if (!d) return res.status(404).json({ error: 'دستگاه پیدا نشد.' });
  if (d.enabled === false) return res.status(403).json({ error: 'این دستگاه خاموش شده است.' });
  if (!canUseDevice(req.username, d.id)) {
    return res.status(403).json({ error: 'به این دستگاه دسترسی ندارید.' });
  }
  const driver = DRIVERS[d.driver];
  if (!driver) return res.status(400).json({ error: 'درایور این دستگاه موجود نیست.' });

  const cmd = String((req.body || {}).command || '');
  if (!driver.capabilities.includes(cmd)) return res.status(400).json({ error: 'این فرمان پشتیبانی نمی‌شود.' });

  try {
    const out = await driver.command(d, cmd, Object.assign({}, (req.body || {}).arg, { user: req.username }));
    // A television hands back a pairing token the first time it is used.
    if (out && out.token && out.token !== d.token) { d.token = out.token; }
    d.lastSeen = new Date().toISOString();
    saveHomedev();
    noteDeviceAction(req.username, cmd, d);
    res.json(out);
  } catch (e) {
    res.status(400).json({ error: e.message || 'فرمان اجرا نشد.' });
  }
});

app.get('/api/home/drivers', requireAuth, requireAdmin, (req, res) => {
  res.json({
    drivers: Object.values(DRIVERS).map((d) => ({
      id: d.id, label: d.label, capabilities: d.capabilities, ports: d.ports,
    })),
  });
});

// A short, readable record of who told what to do — kept in memory and in the
// device file, so the owners can look back at "who turned the TV off" without
// anyone needing to watch anyone.
function noteDeviceAction(username, cmd, dev) {
  homedev.log = homedev.log || [];
  homedev.log.push({ at: new Date().toISOString(), user: username, cmd, device: dev.name });
  if (homedev.log.length > 200) homedev.log = homedev.log.slice(-200);
}

app.get('/api/home/log', requireAuth, requireAdmin, (req, res) => {
  res.json({ log: (homedev.log || []).slice(-60).reverse() });
});


const https = require('https');

// ---------------- Tuya / LSC devices ----------------
//
// LSC Smart Connect is Tuya underneath, so one driver covers the cameras and
// anything else from that shelf bought later. Two credentials are needed once
// (a free developer account at iot.tuya.com, linked to the LSC app account),
// after which everything runs through Tuya's own API — no scraping, nothing
// that breaks when they change their app.
//
// Region matters: the account lives in the EU data centre, so the EU endpoint
// is the default. A wrong region looks exactly like a wrong key, which is why
// the error message below says so out loud.

const TUYA_HOSTS = {
  eu: 'openapi.tuyaeu.com', us: 'openapi.tuyaus.com',
  cn: 'openapi.tuyacn.com', in: 'openapi.tuyain.com',
};

let tuyaToken = { value: null, expires: 0, uid: null };

function tuyaHost() { return TUYA_HOSTS[(cfg.TUYA_REGION || 'eu').toLowerCase()] || TUYA_HOSTS.eu; }

function tuyaSign(method, pathWithQuery, body, token, t, nonce) {
  const secret = cfg.TUYA_SECRET || '';
  const bodyHash = crypto.createHash('sha256').update(body || '').digest('hex');
  const stringToSign = [method, bodyHash, '', pathWithQuery].join('\n');
  const base = (cfg.TUYA_CLIENT_ID || '') + (token || '') + t + nonce + stringToSign;
  return crypto.createHmac('sha256', secret).update(base).digest('hex').toUpperCase();
}

function tuyaCall(method, pathWithQuery, bodyObj, useToken) {
  return new Promise((resolve, reject) => {
    if (!cfg.TUYA_CLIENT_ID || !cfg.TUYA_SECRET) {
      return reject(new Error('کلیدهای Tuya تنظیم نشده‌اند. از تنظیمات، TUYA_CLIENT_ID و TUYA_SECRET را وارد کنید.'));
    }
    const body = bodyObj ? JSON.stringify(bodyObj) : '';
    const t = String(Date.now());
    const nonce = crypto.randomBytes(8).toString('hex');
    const token = useToken ? (tuyaToken.value || '') : '';
    const headers = {
      client_id: cfg.TUYA_CLIENT_ID,
      sign: tuyaSign(method, pathWithQuery, body, token, t, nonce),
      t, nonce, sign_method: 'HMAC-SHA256',
      'Content-Type': 'application/json',
    };
    if (token) headers.access_token = token;

    const req = https.request({
      host: tuyaHost(), port: 443, path: pathWithQuery, method, headers, timeout: 12000,
    }, (res) => {
      let s = '';
      res.setEncoding('utf8');
      res.on('data', (d) => { s += d; if (s.length > 2000000) req.destroy(); });
      res.on('end', () => {
        let d;
        try { d = JSON.parse(s); } catch (e) { return reject(new Error('پاسخ Tuya خوانده نشد.')); }
        if (d.success) return resolve(d.result);
        const msg = String(d.msg || 'خطای نامشخص');
        if (/sign invalid|token invalid|permission/i.test(msg)) {
          return reject(new Error('Tuya کلید را نپذیرفت: ' + msg +
            ' — کلیدها یا منطقه (TUYA_REGION) را بررسی کنید.'));
        }
        reject(new Error('Tuya: ' + msg));
      });
    });
    req.on('timeout', () => req.destroy(new Error('Tuya جواب نداد')));
    req.on('error', reject);
    req.end(body);
  });
}

async function tuyaAuth() {
  if (tuyaToken.value && tuyaToken.expires > Date.now() + 60000) return tuyaToken.value;
  const r = await tuyaCall('GET', '/v1.0/token?grant_type=1', null, false);
  tuyaToken = {
    value: r.access_token,
    expires: Date.now() + (Number(r.expire_time || 7200) * 1000),
    uid: r.uid || tuyaToken.uid,
  };
  return tuyaToken.value;
}

async function tuyaDevices() {
  await tuyaAuth();
  // The linked-app listing is the one that returns the family's own devices
  // rather than everything on the developer project.
  const r = await tuyaCall('GET', '/v1.0/iot-01/associated-users/devices?size=100', null, true);
  return (r && r.devices) ? r.devices : [];
}

async function tuyaStatus(deviceId) {
  await tuyaAuth();
  return tuyaCall('GET', `/v1.0/iot-03/devices/${encodeURIComponent(deviceId)}/status`, null, true);
}

async function tuyaCommand(deviceId, commands) {
  await tuyaAuth();
  return tuyaCall('POST', `/v1.0/iot-03/devices/${encodeURIComponent(deviceId)}/commands`,
                  { commands }, true);
}

DRIVERS.tuya_device = {
  id: 'tuya_device',
  label: 'دستگاه Tuya / LSC',
  ports: [6668],
  capabilities: ['status', 'privacy_on', 'privacy_off', 'motion_on', 'motion_off',
                 'pan_left', 'pan_right', 'tilt_up', 'tilt_down', 'siren_off'],

  async identify(c) {
    if (c.vendor === 'tuya' || c.open.includes(6668)) {
      return { name: 'LSC / Tuya device', model: '',
               extra: { needsCloudId: true, note: 'برای کنترل، از «واکشی از Tuya» استفاده کنید.' } };
    }
    return null;
  },

  async command(dev, cmd, arg) {
    const id = dev.extra && dev.extra.tuyaId;
    if (!id) {
      throw new Error('این دستگاه هنوز به حساب Tuya وصل نشده. از دکمه‌ی «واکشی از Tuya» استفاده کنید.');
    }
    if (cmd === 'status') {
      const st = await tuyaStatus(id);
      const map = {};
      for (const s of st || []) map[s.code] = s.value;
      return { ok: true, state: map.basic_private ? 'حالت حریم خصوصی روشن' : 'در حال دیدن', raw: map };
    }

    // Privacy mode physically turns the lens away or blanks the sensor on
    // these cameras. It is the switch that matters most in a home, so it gets
    // its own two buttons rather than hiding inside a settings list.
    const simple = {
      privacy_on:  [{ code: 'basic_private', value: true }],
      privacy_off: [{ code: 'basic_private', value: false }],
      motion_on:   [{ code: 'motion_switch', value: true }],
      motion_off:  [{ code: 'motion_switch', value: false }],
      siren_off:   [{ code: 'siren_switch', value: false }],
    };
    if (simple[cmd]) { await tuyaCommand(id, simple[cmd]); return { ok: true }; }

    const ptz = { pan_left: '6', pan_right: '2', tilt_up: '0', tilt_down: '4' };
    if (ptz[cmd]) {
      await tuyaCommand(id, [{ code: 'ptz_control', value: ptz[cmd] }]);
      setTimeout(() => { tuyaCommand(id, [{ code: 'ptz_stop', value: true }]).catch(() => {}); }, 700);
      return { ok: true };
    }
    throw new Error('این فرمان برای دوربین تعریف نشده.');
  },
};

// Pull the real device list from the account and match it to what the scan
// already saw on the network, so a camera ends up as one record rather than
// two half-records.
app.post('/api/home/tuya/import', requireAuth, requireAdmin, async (req, res) => {
  try {
    const list = await tuyaDevices();
    let added = 0, linked = 0;
    for (const t of list) {
      const existing = Object.values(homedev.devices).find(
        (d) => (d.extra && d.extra.tuyaId === t.id) || (t.ip && d.ip === t.ip));
      if (existing) {
        existing.extra = Object.assign({}, existing.extra, { tuyaId: t.id, product: t.product_name || '' });
        existing.driver = 'tuya_device';
        delete existing.extra.pending;
        delete existing.extra.needsCloudId;
        if (t.name) existing.name = String(t.name).slice(0, 60);
        linked++;
        continue;
      }
      const id = crypto.randomBytes(6).toString('hex');
      homedev.devices[id] = {
        id, driver: 'tuya_device',
        name: String(t.name || 'Tuya device').slice(0, 60),
        model: String(t.product_name || '').slice(0, 60),
        ip: String(t.ip || ''), mac: '', room: '',
        extra: { tuyaId: t.id, product: t.product_name || '', online: !!t.online },
        enabled: true, token: null, addedAt: new Date().toISOString(),
      };
      added++;
    }
    saveHomedev();
    res.json({ ok: true, added, linked, total: list.length });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

// ---------------- Xiaomi (miio) ----------------
//
// Xiaomi speaks a binary UDP protocol on 54321. Every device has a token that
// is baked in at pairing; without it nothing can be said to the device at all,
// which is a sane design and the reason this driver asks for one.
//
// The air fryer is the one appliance here that can start a fire, so it does
// not get a plain on/off button. See the guard below.

function miioPacket(deviceId, stamp, token, payloadObj) {
  const tokenBuf = Buffer.from(token, 'hex');
  const key = crypto.createHash('md5').update(tokenBuf).digest();
  const iv = crypto.createHash('md5').update(Buffer.concat([key, tokenBuf])).digest();
  const cipher = crypto.createCipheriv('aes-128-cbc', key, iv);
  const body = Buffer.concat([cipher.update(Buffer.from(JSON.stringify(payloadObj), 'utf8')), cipher.final()]);

  const head = Buffer.alloc(32);
  head.writeUInt16BE(0x2131, 0);
  head.writeUInt16BE(32 + body.length, 2);
  head.writeUInt32BE(0, 4);
  head.writeUInt32BE(deviceId, 8);
  head.writeUInt32BE(stamp, 12);
  tokenBuf.copy(head, 16);                       // token stands in for the checksum
  const sum = crypto.createHash('md5').update(Buffer.concat([head, body])).digest();
  sum.copy(head, 16);
  return Buffer.concat([head, body]);
}

function miioDecrypt(buf, token) {
  if (buf.length <= 32) return null;
  const tokenBuf = Buffer.from(token, 'hex');
  const key = crypto.createHash('md5').update(tokenBuf).digest();
  const iv = crypto.createHash('md5').update(Buffer.concat([key, tokenBuf])).digest();
  const d = crypto.createDecipheriv('aes-128-cbc', key, iv);
  const out = Buffer.concat([d.update(buf.slice(32)), d.final()]);
  try { return JSON.parse(out.toString('utf8').replace(/\0+$/, '')); } catch (e) { return null; }
}

// Hello packet: all-0xff where the id, stamp and checksum will be. The device
// answers with its own id and clock, which every later packet must echo.
function miioHandshake(ip, timeoutMs) {
  return new Promise((resolve, reject) => {
    const hello = Buffer.alloc(32, 0xff);
    hello.writeUInt16BE(0x2131, 0);
    hello.writeUInt16BE(32, 2);
    hello.writeUInt32BE(0, 4);
    const sock = dgram.createSocket('udp4');
    const timer = setTimeout(() => { try { sock.close(); } catch (e) {} reject(new Error('دستگاه شیائومی جواب نداد.')); }, timeoutMs || 5000);
    sock.on('error', (e) => { clearTimeout(timer); try { sock.close(); } catch (x) {} reject(e); });
    sock.on('message', (msg) => {
      clearTimeout(timer);
      try { sock.close(); } catch (e) {}
      if (msg.length < 32) return reject(new Error('پاسخ نامعتبر.'));
      resolve({ deviceId: msg.readUInt32BE(8), stamp: msg.readUInt32BE(12), at: Date.now() });
    });
    sock.send(hello, 0, hello.length, 54321, ip, (e) => { if (e) { clearTimeout(timer); reject(e); } });
  });
}

async function miioSend(dev, method, params) {
  const token = dev.extra && dev.extra.token;
  if (!token || !/^[0-9a-f]{32}$/i.test(token)) {
    throw new Error('توکن این دستگاه شیائومی وارد نشده (۳۲ رقم هگز).');
  }
  const hs = await miioHandshake(dev.ip, 5000);
  const stamp = hs.stamp + Math.floor((Date.now() - hs.at) / 1000) + 1;
  const payload = { id: Math.floor(Math.random() * 9000) + 100, method, params: params || [] };
  const packet = miioPacket(hs.deviceId, stamp, token, payload);

  return new Promise((resolve, reject) => {
    const sock = dgram.createSocket('udp4');
    const timer = setTimeout(() => { try { sock.close(); } catch (e) {} reject(new Error('دستگاه فرمان را جواب نداد.')); }, 6000);
    sock.on('error', (e) => { clearTimeout(timer); try { sock.close(); } catch (x) {} reject(e); });
    sock.on('message', (msg) => {
      clearTimeout(timer);
      try { sock.close(); } catch (e) {}
      const d = miioDecrypt(msg, token);
      if (!d) return reject(new Error('پاسخ رمزگشایی نشد — توکن احتمالاً درست نیست.'));
      if (d.error) return reject(new Error('دستگاه: ' + (d.error.message || JSON.stringify(d.error))));
      resolve(d.result);
    });
    sock.send(packet, 0, packet.length, 54321, dev.ip, (e) => { if (e) { clearTimeout(timer); reject(e); } });
  });
}

// --- the air fryer guard -------------------------------------------------
//
// Turning on a heating element in an empty house is the one command in this
// whole app that can burn it down. So switching it on is fenced three ways:
//
//   * somebody has to be near home — the phone says how far, and stale
//     positions do not count;
//   * a hard time limit is set at the same moment the element is switched on,
//     and the server turns it off when that limit runs out, whether or not
//     anyone remembers;
//   * switching OFF is never fenced by anything.
//
// If the phone has no position, the answer is no. That is deliberate: the
// failure mode of "assume it is fine" is a fire.

const FRYER_MAX_MINUTES = 40;
const FRYER_NEAR_KM = 12;
const FRYER_FRESH_MS = 15 * 60 * 1000;
const positions = new Map();               // username -> { lat, lon, at }
const fryerTimers = new Map();             // device id -> timeout

app.post('/api/home/position', requireAuth, (req, res) => {
  const b = req.body || {};
  const lat = Number(b.lat), lon = Number(b.lon);
  if (!isFinite(lat) || !isFinite(lon) || Math.abs(lat) > 90 || Math.abs(lon) > 180) {
    return res.status(400).json({ error: 'موقعیت معتبر نیست.' });
  }
  // Kept in memory only, and only the newest one: this exists to answer "is
  // someone nearly home", not to build a history of where anyone has been.
  positions.set(req.username, { lat, lon, at: Date.now() });
  res.json({ ok: true });
});

function kmBetween(a, b) {
  const R = 6371, rad = (x) => x * Math.PI / 180;
  const dLat = rad(b.lat - a.lat), dLon = rad(b.lon - a.lon);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

function someoneNearHome() {
  const home = (cfg.HOME_LAT && cfg.HOME_LON)
    ? { lat: Number(cfg.HOME_LAT), lon: Number(cfg.HOME_LON) } : null;
  if (!home || !isFinite(home.lat) || !isFinite(home.lon)) {
    return { ok: false, why: 'موقعیت خانه تنظیم نشده (HOME_LAT و HOME_LON در تنظیمات).' };
  }
  const now = Date.now();
  for (const [user, p] of positions) {
    if (now - p.at > FRYER_FRESH_MS) continue;
    const km = kmBetween(home, p);
    if (km <= FRYER_NEAR_KM) return { ok: true, user, km: Math.round(km * 10) / 10 };
  }
  return { ok: false, why: 'هیچ‌کس نزدیک خانه نیست یا موقعیت گوشی تازه نیست.' };
}

// -- Xiaomi air fryer (MIoT) ----------------------------------------------
//
// The 6.5 L is careli.fryer.maf10a. Its MIoT layout puts everything on
// service 2: properties for state, target time and target temperature, and
// five actions for start / cancel / pause / resume. The sibling models are
// listed too because they share the shape and cost nothing to carry.
//
// One quirk worth knowing: this device answers get_properties for a single
// property at a time, so reads are sequential rather than batched.

const FRYER_SPECS = {
  'careli.fryer.maf10a': {
    props: { status: [2, 1], fault: [2, 2], targetTime: [2, 3], targetTemp: [2, 4],
             leftTime: [2, 5], keepWarm: [2, 6], mode: [2, 8], preheat: [2, 9] },
    actions: { start: [2, 1], cancel: [2, 2], pause: [2, 3], resume: [2, 4] },
  },
  'careli.fryer.maf02': {
    props: { status: [2, 1], fault: [2, 2], targetTime: [2, 3], targetTemp: [2, 4], leftTime: [2, 5] },
    actions: { start: [2, 1], cancel: [2, 2], pause: [2, 3], resume: [3, 2] },
  },
  'careli.fryer.maf05a': {
    props: { status: [2, 1], fault: [2, 2], targetTime: [2, 3], targetTemp: [2, 4], leftTime: [2, 5] },
    actions: { start: [2, 1], cancel: [2, 2], pause: [2, 3], resume: [3, 2] },
  },
  'xiaomi.fryer.maf14': {
    props: { status: [2, 1], fault: [2, 2], targetTime: [2, 3], targetTemp: [2, 4],
             mode: [2, 5], leftTime: [2, 6] },
    actions: { start: [2, 1], cancel: [2, 2], pause: [2, 3], resume: [2, 5] },
  },
};
const FRYER_DEFAULT = FRYER_SPECS['careli.fryer.maf10a'];

// Status codes, in the device's own numbering.
const FRYER_STATUS = {
  0: 'خاموش', 1: 'آماده', 2: 'مکث', 3: 'زمان‌بندی‌شده', 4: 'در حال پخت',
  5: 'پیش‌گرم', 6: 'پخت تمام شد', 7: 'پیش‌گرم تمام شد', 8: 'مکث پیش‌گرم',
  9: 'مکث', 10: 'گرم نگه‌داشتن', 11: 'مکث گرم‌نگه‌داری', 12: 'گرم‌نگه‌داری تمام شد',
  13: 'برشته کردن', 14: 'چربی‌گیری',
};

function fryerSpec(dev) {
  const m = String((dev.extra && dev.extra.model) || dev.model || '').toLowerCase();
  return FRYER_SPECS[m] || FRYER_DEFAULT;
}

// Anything that calls itself a fryer, oven or cooker heats food, and the
// guard below is not optional for those. A flag can turn the guard ON for
// something else, but nothing turns it OFF for a real fryer — an appliance
// that reaches 200°C in an empty house is not a preference setting.
function isHeater(dev) {
  const m = String((dev.extra && dev.extra.model) || dev.model || '') + ' ' + String(dev.name || '');
  if (/fryer|oven|cooker|kettle|heater|airfry/i.test(m)) return true;
  return !!(dev.extra && dev.extra.heating);
}

async function miotGet(dev, spec, keys) {
  const out = {};
  for (const k of keys) {
    const p = spec.props[k];
    if (!p) { out[k] = null; continue; }
    try {
      const r = await miioSend(dev, 'get_properties', [{ did: k, siid: p[0], piid: p[1] }]);
      out[k] = (r && r[0] && r[0].code === 0) ? r[0].value : null;
    } catch (e) { out[k] = null; }
  }
  return out;
}

async function miotSet(dev, spec, key, value) {
  const p = spec.props[key];
  if (!p) throw new Error('این ویژگی روی این مدل نیست: ' + key);
  const r = await miioSend(dev, 'set_properties', [{ did: key, siid: p[0], piid: p[1], value }]);
  if (r && r[0] && r[0].code !== 0) throw new Error('دستگاه مقدار را نپذیرفت (' + key + ').');
  return r;
}

async function miotAction(dev, spec, key, args) {
  const a = spec.actions[key];
  if (!a) throw new Error('این فرمان روی این مدل نیست: ' + key);
  return miioSend(dev, 'action', { did: key, siid: a[0], aiid: a[1], in: args || [] });
}

DRIVERS.xiaomi_device = {
  id: 'xiaomi_device',
  label: 'ایرفرایر / دستگاه شیائومی',
  ports: [54321],
  capabilities: ['info', 'status', 'cook', 'off', 'pause', 'resume'],

  async identify(c) {
    if (c.vendor === 'xiaomi') {
      return { name: 'Xiaomi device', model: '', extra: { needsToken: true } };
    }
    return null;
  },

  async command(dev, cmd, arg) {
    const spec = fryerSpec(dev);

    if (cmd === 'info') {
      const r = await miioSend(dev, 'miIO.info', []);
      if (r && r.model) {
        dev.extra = Object.assign({}, dev.extra, { model: r.model });
        if (!dev.model) dev.model = r.model;
        saveHomedev();
      }
      const known = r && FRYER_SPECS[String(r.model || '').toLowerCase()];
      return { ok: true, info: r,
        state: (r && r.model ? r.model : 'شناسایی شد') + (known ? ' ✓ پشتیبانی کامل' : ' — نگاشت پیش‌فرض') };
    }

    if (cmd === 'status') {
      const s = await miotGet(dev, spec, ['status', 'leftTime', 'targetTemp', 'targetTime', 'fault']);
      const name = FRYER_STATUS[s.status] || 'نامشخص';
      const bits = [name];
      if (s.targetTemp) bits.push(s.targetTemp + '°C');
      if (s.leftTime) bits.push(s.leftTime + ' دقیقه مانده');
      if (s.fault) bits.push('خطای دستگاه: E' + s.fault);
      return { ok: true, state: bits.join(' · '), raw: s };
    }

    // Cancelling is never fenced by anything: no distance check, no time
    // limit, no flag. Whatever else is true, stopping must always work.
    if (cmd === 'off') {
      const t = fryerTimers.get(dev.id);
      if (t) { clearTimeout(t); fryerTimers.delete(dev.id); }
      await miotAction(dev, spec, 'cancel');
      return { ok: true, note: 'پخت متوقف شد.' };
    }

    if (cmd === 'pause') { await miotAction(dev, spec, 'pause'); return { ok: true, note: 'مکث.' }; }

    if (cmd === 'resume') {
      if (isHeater(dev)) {
        const near = someoneNearHome();
        if (!near.ok) throw new Error('برای ایمنی ادامه داده نشد: ' + near.why);
      }
      await miotAction(dev, spec, 'resume');
      return { ok: true, note: 'ادامه یافت.' };
    }

    if (cmd === 'cook') {
      const minutes = Math.max(1, Math.min(Number(arg && arg.minutes) || 20, FRYER_MAX_MINUTES));
      const temp = Math.max(40, Math.min(Number(arg && arg.temp) || 180, 200));

      if (isHeater(dev)) {
        const near = someoneNearHome();
        if (!near.ok) {
          throw new Error('برای ایمنی روشن نشد: ' + near.why +
            ' — گرم شدن در خانه‌ی خالی خطر آتش دارد.');
        }
        // The device's own timer is the real safety: it stops itself even if
        // the network, the server or the house wifi disappears mid-cook.
        await miotSet(dev, spec, 'targetTemp', temp);
        await miotSet(dev, spec, 'targetTime', minutes);
        await miotAction(dev, spec, 'start');

        // A second, independent stop on the server — belt and braces, because
        // a target_time the device silently rejected would otherwise run on.
        const old = fryerTimers.get(dev.id);
        if (old) clearTimeout(old);
        fryerTimers.set(dev.id, setTimeout(() => {
          miotAction(dev, spec, 'cancel').catch(() => {});
          fryerTimers.delete(dev.id);
        }, (minutes + 2) * 60000));

        return { ok: true, note: `${temp}°C برای ${minutes} دقیقه شروع شد. ` +
          `${near.user} در ${near.km} کیلومتری خانه است. دستگاه خودش در پایان خاموش می‌شود.` };
      }

      await miotSet(dev, spec, 'targetTemp', temp);
      await miotSet(dev, spec, 'targetTime', minutes);
      await miotAction(dev, spec, 'start');
      return { ok: true, note: `${temp}°C برای ${minutes} دقیقه.` };
    }

    throw new Error('این فرمان تعریف نشده.');
  },
};

// Marking a device as a heater is what switches the guard on, and it is an
// owner-only decision that asks for the password again — turning the guard
// OFF is exactly the change that should be hard to make by accident.
app.post('/api/home/devices/:id/flags', requireAuth, requireAdmin, requireStepUp, (req, res) => {
  const d = homedev.devices[req.params.id];
  if (!d) return res.status(404).json({ error: 'دستگاه پیدا نشد.' });
  const b = req.body || {};
  d.extra = d.extra || {};
  if (b.heating !== undefined) d.extra.heating = !!b.heating;
  if (b.token !== undefined) {
    const t = String(b.token).trim().toLowerCase();
    if (t && !/^[0-9a-f]{32}$/.test(t)) return res.status(400).json({ error: 'توکن باید ۳۲ رقم هگز باشد.' });
    d.extra.token = t || undefined;
  }
  if (b.tuyaId !== undefined) d.extra.tuyaId = String(b.tuyaId).slice(0, 40) || undefined;
  saveHomedev();
  res.json({ ok: true, device: deviceView(d, req.username) });
});



}

module.exports = { register };
