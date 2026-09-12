'use strict';

// identify.js — turn "دستگاه ناشناس · 192.168.2.86" into something a person
// can actually recognise.
//
// The home scanner used to know four brands, so anything else on the Wi-Fi
// came back as "unknown device" with a bare MAC address next to it. That is
// not a scan result, it is a shrug. Three things fix it, and they stack:
//
//   1. THE REAL REGISTRY. oui.dat.gz holds the whole IEEE manufacturer list
//      (52 085 prefixes, 29 thousand companies) gzipped to ~440 KB and loaded
//      once, lazily. cc:4d:75 stops being a mystery and becomes Xiaomi.
//
//   2. RANDOMISED ADDRESSES. Most "unknown" devices in a modern house are not
//      unknown at all — they are phones. iOS and Android invent a fresh MAC
//      per network for privacy, and an invented MAC is in no registry by
//      definition. Those are detectable from a single bit, and saying
//      "a phone or laptop hiding its address" is both true and useful, where
//      "unknown" is neither.
//
//   3. THE DEVICE'S OWN NAME. Almost everything answers to one of mDNS
//      reverse lookup, NetBIOS, or plain DNS — and the answer is usually the
//      name its owner gave it ("Javid-iPhone", "DESKTOP-A1B2"). That beats any
//      amount of guessing from ports.
//
// Everything here is passive and read-only: three small UDP questions and a
// DNS lookup, the same ones any device on the network asks constantly.

const fs = require('fs');
const os = require('os');
const dns = require('dns');
const path = require('path');
const zlib = require('zlib');
const dgram = require('dgram');

// ---------------------------------------------------------------------------
// The manufacturer registry
// ---------------------------------------------------------------------------
let OUI = null;                     // Map: prefix (hex, no separators) -> vendor

function loadOui() {
  if (OUI) return OUI;
  OUI = new Map();
  try {
    const raw = zlib.gunzipSync(fs.readFileSync(path.join(__dirname, 'oui.dat.gz'))).toString('utf8');
    const sep = raw.indexOf('\n\x00\n');
    if (sep === -1) return OUI;
    const names = raw.slice(0, sep).split('\n');
    for (const line of raw.slice(sep + 3).split('\n')) {
      const sp = line.indexOf(' ');
      if (sp <= 0) continue;
      const name = names[Number(line.slice(sp + 1))];
      if (name) OUI.set(line.slice(0, sp), name);
    }
  } catch (e) { /* a trimmed install without the data file still works */ }
  return OUI;
}

function cleanMac(mac) {
  return String(mac || '').toUpperCase().replace(/[^0-9A-F]/g, '');
}

// IEEE allocates blocks of three different sizes, so the lookup has to try the
// most specific first: a 36-bit block beats the 24-bit block it sits inside.
function vendorOf(mac) {
  const hex = cleanMac(mac);
  if (hex.length < 6) return '';
  const table = loadOui();
  for (const len of [9, 7, 6]) {
    const hit = table.get(hex.slice(0, len));
    if (hit) return hit;
  }
  return '';
}

// Bit 1 of the first octet is the "locally administered" flag. A real factory
// MAC never has it set, so when it IS set the address was invented — which in
// a house means a phone, tablet or laptop with MAC privacy switched on.
function macKind(mac) {
  const hex = cleanMac(mac);
  if (hex.length < 2) return { valid: false };
  const first = parseInt(hex.slice(0, 2), 16);
  return {
    valid: true,
    local: (first & 0x02) === 0x02,
    multicast: (first & 0x01) === 0x01,
  };
}

// Names that give the game away even when the vendor does not.
const NAME_HINTS = [
  [/iphone|ipad|macbook|imac|apple[- ]?tv|airpods/i, 'apple', 'دستگاه اپل'],
  [/galaxy|samsung|sm-[a-z]\d/i, 'samsung', 'سامسونگ'],
  [/pixel|nexus|chromecast|google[- ]?home|nest/i, 'google', 'گوگل'],
  [/xiaomi|redmi|poco|mi[- ]?\d|miio/i, 'xiaomi', 'شیائومی'],
  [/huawei|honor/i, 'huawei', 'هواوی'],
  [/desktop-|laptop-|win-|pc-/i, 'windows', 'کامپیوتر ویندوز'],
  [/raspberry|raspberrypi|rpi/i, 'raspberrypi', 'رزبری‌پای'],
  [/printer|drucker|hp[a-f0-9]{6}|brother|epson|canon/i, 'printer', 'چاپگر'],
  [/fritz|speedport|easybox|router|gateway|modem/i, 'router', 'مودم/روتر'],
  [/tv|bravia|philips|lg[- ]?webos|tizen|roku|firetv|shield/i, 'tv', 'تلویزیون'],
  [/echo|alexa|sonos|bose|jbl|speaker/i, 'speaker', 'اسپیکر'],
  [/cam|kamera|doorbell|ring|eufy|reolink/i, 'camera', 'دوربین'],
  [/nas|synology|qnap|diskstation/i, 'nas', 'ذخیره‌ساز شبکه (NAS)'],
];

function kindFromName(name) {
  for (const [re, key, label] of NAME_HINTS) if (re.test(String(name || ''))) return { key, label };
  return null;
}

// ---------------------------------------------------------------------------
// Ask the device what it is called
// ---------------------------------------------------------------------------
// 1) NetBIOS (UDP 137). Every Windows machine, and most NAS boxes, answer this
//    with their own name. The query is a fixed 50-byte packet asking for the
//    node's name table.
const NBSTAT_QUERY = Buffer.from([
  0x00, 0x00,                    // transaction id
  0x00, 0x10,                    // flags: broadcast
  0x00, 0x01, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
  0x20,                          // name length (encoded '*' padded)
  0x43, 0x4b,                    // 'CK' = encoded '*'
  ...Array(30).fill(0x41),       // 'A' x30 = the 15 padding NULs, encoded
  0x00,
  0x00, 0x21,                    // type NBSTAT
  0x00, 0x01,                    // class IN
]);

function netbiosName(ip, timeoutMs) {
  return new Promise((resolve) => {
    let sock;
    try { sock = dgram.createSocket('udp4'); } catch (e) { return resolve(null); }
    let done = false;
    const finish = (v) => { if (done) return; done = true; try { sock.close(); } catch (e) {} resolve(v); };
    const timer = setTimeout(() => finish(null), timeoutMs || 1200);
    if (timer.unref) timer.unref();
    sock.on('error', () => { clearTimeout(timer); finish(null); });
    sock.on('message', (msg) => {
      clearTimeout(timer);
      try {
        // The answer starts with the same header; the name table follows the
        // 56-byte question echo, one 18-byte entry per name.
        if (msg.length < 57) return finish(null);
        const count = msg[56];
        const names = [];
        for (let i = 0; i < count && 57 + i * 18 + 15 <= msg.length; i++) {
          const off = 57 + i * 18;
          const name = msg.slice(off, off + 15).toString('latin1').trim();
          const type = msg[off + 15];
          const flags = msg.readUInt16BE(off + 16);
          const group = (flags & 0x8000) !== 0;
          // type 0x00 with the group bit clear is the machine's own name;
          // type 0x20 is the file-server name. Both are what a person calls it.
          if (!group && (type === 0x00 || type === 0x20) && /^[\x20-\x7e]+$/.test(name)) names.push(name);
        }
        finish(names[0] || null);
      } catch (e) { finish(null); }
    });
    try { sock.send(NBSTAT_QUERY, 0, NBSTAT_QUERY.length, 137, ip); }
    catch (e) { clearTimeout(timer); finish(null); }
  });
}

// 2) mDNS reverse lookup (UDP 5353): ask 86.2.168.192.in-addr.arpa for a PTR.
//    Apple devices, printers, Chromecasts and anything running Avahi answer.
function encodeName(name) {
  const parts = String(name).split('.').filter(Boolean);
  return Buffer.concat([
    ...parts.map((p) => Buffer.concat([Buffer.from([p.length]), Buffer.from(p, 'utf8')])),
    Buffer.from([0]),
  ]);
}
function readDnsName(buf, offset) {
  const parts = [];
  let jumped = false, next = offset, guard = 0;
  while (offset < buf.length && guard++ < 64) {
    const len = buf[offset];
    if (len === 0) { offset++; break; }
    if ((len & 0xc0) === 0xc0) {
      if (!jumped) next = offset + 2;
      jumped = true;
      offset = ((len & 0x3f) << 8) | buf[offset + 1];
      continue;
    }
    parts.push(buf.slice(offset + 1, offset + 1 + len).toString('utf8'));
    offset += 1 + len;
  }
  return { name: parts.join('.'), offset: jumped ? next : offset };
}

function mdnsReverse(ip, timeoutMs) {
  return new Promise((resolve) => {
    const arpa = ip.split('.').reverse().join('.') + '.in-addr.arpa';
    let sock;
    try { sock = dgram.createSocket({ type: 'udp4', reuseAddr: true }); }
    catch (e) { return resolve(null); }
    let done = false;
    const finish = (v) => { if (done) return; done = true; try { sock.close(); } catch (e) {} resolve(v); };
    const timer = setTimeout(() => finish(null), timeoutMs || 1200);
    if (timer.unref) timer.unref();
    sock.on('error', () => { clearTimeout(timer); finish(null); });
    sock.on('message', (msg) => {
      try {
        if (msg.length < 12) return;
        const qd = msg.readUInt16BE(4), an = msg.readUInt16BE(6);
        if (!an) return;
        let off = 12;
        for (let i = 0; i < qd; i++) off = readDnsName(msg, off).offset + 4;
        for (let i = 0; i < an && off + 10 <= msg.length; i++) {
          const r = readDnsName(msg, off);
          off = r.offset;
          const type = msg.readUInt16BE(off);
          const rdlen = msg.readUInt16BE(off + 8);
          if (type === 12) {                         // PTR
            const name = readDnsName(msg, off + 10).name;
            if (name) return finish(name.replace(/\.local$/, ''));
          }
          off = off + 10 + rdlen;
        }
      } catch (e) { /* malformed answer, keep waiting */ }
    });
    const header = Buffer.alloc(12);
    header.writeUInt16BE(1, 4);                      // one question
    const tail = Buffer.alloc(4);
    tail.writeUInt16BE(12, 0);                       // PTR
    tail.writeUInt16BE(1, 2);                        // IN
    const query = Buffer.concat([header, encodeName(arpa), tail]);
    sock.bind(() => {
      // Ask the device directly as well as the multicast group: a unicast
      // question gets an answer from things that ignore multicast queries.
      try { sock.send(query, 0, query.length, 5353, ip); } catch (e) {}
      try { sock.send(query, 0, query.length, 5353, '224.0.0.251'); } catch (e) {}
    });
  });
}

// 3) Plain reverse DNS — the router often knows the name from its DHCP leases.
function reverseDns(ip, timeoutMs) {
  return new Promise((resolve) => {
    const timer = setTimeout(() => resolve(null), timeoutMs || 1500);
    if (timer.unref) timer.unref();
    dns.reverse(ip, (err, names) => {
      clearTimeout(timer);
      if (err || !names || !names.length) return resolve(null);
      resolve(String(names[0]).replace(/\.(local|lan|home|fritz\.box)$/i, ''));
    });
  });
}

// Ask all three at once and take the first real answer. Worst case is one
// short timeout, not three.
async function hostnameOf(ip, opts) {
  opts = opts || {};
  const t = opts.timeoutMs || 1400;
  const results = await Promise.all([
    mdnsReverse(ip, t).catch(() => null),
    netbiosName(ip, t).catch(() => null),
    reverseDns(ip, t).catch(() => null),
  ]);
  const [mdns, netbios, rdns] = results;
  const name = mdns || netbios || rdns || '';
  return { name, mdns: mdns || '', netbios: netbios || '', dns: rdns || '' };
}

// ---------------------------------------------------------------------------
// The ARP cache — MAC addresses without needing root
// ---------------------------------------------------------------------------
// Anything this machine has spoken to recently is in the ARP table, and a MAC
// is what unlocks the manufacturer. Lives here rather than inside one feature
// because every part that identifies a device wants it.
//
// The separator between the address and the MAC differs per platform: Windows
// uses spaces, Linux and macOS write "? (1.2.3.4) at aa:bb:...". A pattern
// that excludes the letters a-f from the separator cannot cross the word "at"
// and finds nothing at all on Linux and macOS.
const ARP_RE = /(\d+\.\d+\.\d+\.\d+)\D{1,12}?([0-9a-f]{1,2}[:-][0-9a-f]{1,2}[:-][0-9a-f]{1,2}[:-][0-9a-f]{1,2}[:-][0-9a-f]{1,2}[:-][0-9a-f]{1,2})/gi;

function parseArp(text) {
  const map = {};
  let m;
  ARP_RE.lastIndex = 0;
  while ((m = ARP_RE.exec(String(text || '')))) {
    map[m[1]] = m[2].replace(/-/g, ':').toLowerCase()
      .split(':').map((o) => (o.length === 1 ? '0' + o : o)).join(':');
  }
  return map;
}

function arpTable() {
  return new Promise((resolve) => {
    const { execFile } = require('child_process');
    const bin = process.platform === 'win32' ? 'arp' : '/usr/sbin/arp';
    let done = false;
    const finish = (v) => { if (!done) { done = true; resolve(v); } };
    try {
      const child = execFile(bin, ['-a'], { timeout: 6000, windowsHide: true, maxBuffer: 4 << 20 },
        (err, stdout) => finish(parseArp(stdout || '')));
      child.on('error', () => finish({}));
    } catch (e) { finish({}); }
  });
}

// ---------------------------------------------------------------------------
// Put it together
// ---------------------------------------------------------------------------
// Returns a label a person can read, plus WHY we think so, so nothing here is
// a bare assertion the household has to take on faith.
function describe(input) {
  const mac = input.mac || '';
  const kind = macKind(mac);
  const vendor = vendorOf(mac);
  const host = String(input.hostname || '').replace(/\.(local|lan|home)$/i, '');
  const hint = kindFromName(host) || kindFromName(vendor);
  const why = [];

  let label = '';
  let confident = false;

  if (host) { label = host; confident = true; why.push('خودش را «' + host + '» معرفی کرد.'); }

  if (vendor) {
    why.push('سازنده از روی آدرس سخت‌افزاری: ' + vendor + '.');
    if (!label) { label = vendor + (hint ? ' — ' + hint.label : ''); confident = true; }
    else if (!new RegExp(vendor.split(/\s+/)[0], 'i').test(label)) label += ' · ' + vendor;
  }

  // No vendor AND an invented address: this is a phone being private, not an
  // intruder. Saying so is the whole point — it is the commonest case in a
  // house full of iPhones and it used to read as "unknown".
  let randomised = false;
  if (!vendor && kind.valid && kind.local) {
    randomised = true;
    confident = true;
    if (!label) label = 'موبایل یا لپ‌تاپ (آدرس تصادفی)';
    why.push('آدرس سخت‌افزاری‌اش ساختگی است — آیفون و اندروید برای حریم خصوصی روی هر وای‌فای '
      + 'یک آدرس تازه می‌سازند، برای همین در فهرست هیچ سازنده‌ای نیست. یعنی این تقریباً حتماً '
      + 'موبایل یا لپ‌تاپ یکی از خودتان است.');
  }

  if (!vendor && kind.valid && !kind.local && !kind.multicast && !label) {
    why.push('آدرس سخت‌افزاری واقعی است ولی در فهرست سازنده‌ها پیدا نشد (بلوک ثبت‌نشده یا خیلی تازه).');
  }
  if (kind.valid && kind.multicast) {
    why.push('بیت گروهی این آدرس روشن است؛ یک کارت شبکه‌ی واقعی چنین آدرسی ندارد — '
      + 'یا جدول ARP بد خوانده شده یا دستگاه آدرسش را خودش دست‌کاری کرده.');
  }

  // Ports still add the role even when the name is already known.
  const ports = input.ports || [];
  const PORT_ROLE = [
    // 62078 is iOS "lockdownd" — an iPhone or iPad answers on it and almost
    // nothing else does, which names a device that has no vendor at all
    // because its MAC is a privacy address.
    [[62078], 'آیفون یا آیپد'],
    [[9100, 631, 515], 'چاپگر'], [[8009], 'Chromecast'], [[7000, 5000], 'AirPlay'],
    [[1400], 'Sonos'], [[6668], 'وسیله‌ی هوشمند Tuya/LSC'], [[54321], 'دستگاه شیائومی'],
    [[8008, 8443, 8001, 8002], 'تلویزیون هوشمند'], [[445, 139], 'کامپیوتر ویندوز'],
    [[548, 5009], 'دستگاه اپل'], [[5353], 'اعلام‌کننده‌ی mDNS'],
    [[22], 'کامپیوتر/سرور'], [[80, 443], 'دارای پنل وب'],
  ];
  const roles = [];
  for (const [list, role] of PORT_ROLE) {
    if (list.some((p) => ports.includes(p))) roles.push(role);
  }
  if (hint && !roles.includes(hint.label)) roles.unshift(hint.label);

  // A port that identifies the device is a real conclusion, not a shrug — an
  // iPhone found by its lockdown port is identified even though its
  // randomised MAC belongs to no manufacturer.
  const NAMING_PORTS = { 62078: 'آیفون یا آیپد', 8009: 'Chromecast', 1400: 'Sonos',
    6668: 'وسیله‌ی هوشمند Tuya/LSC', 54321: 'دستگاه شیائومی', 9100: 'چاپگر', 631: 'چاپگر' };
  const named = ports.map((p) => NAMING_PORTS[Number(p)]).filter(Boolean)[0];
  if (named) {
    confident = true;
    if (!label || randomised) label = named;
    why.push(`از روی پورت باز ${ports.find((p) => NAMING_PORTS[Number(p)])} فهمیده شد که ${named} است.`);
  }
  if (!label) {
    label = roles.length ? roles[0] : 'دستگاه ناشناس';
  }

  return {
    label,
    vendor,
    hostname: host,
    randomised,
    roles,
    confident,
    why,
  };
}

module.exports = {
  describe, vendorOf, macKind, hostnameOf, kindFromName,
  netbiosName, mdnsReverse, reverseDns, loadOui, cleanMac, arpTable, parseArp,
};
