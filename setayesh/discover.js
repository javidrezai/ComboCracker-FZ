'use strict';

// discover.js — find every device around this machine, on every transport,
// work out what it actually IS, and (with permission) drive it.
//
// Four transports, one shape of answer:
//
//   usb        what is physically plugged in       /sys, PnP, system_profiler
//   bluetooth  paired and nearby radios            bluetoothctl, PnP, sp
//   drive      disks, cards and USB sticks         lsblk, wmic, diskutil
//   network    everything on the LAN               SSDP + mDNS + ARP + ports
//
// Every probe is READ-ONLY and every one is optional: a machine with no
// Bluetooth simply reports none, it never fails the scan. Each transport is
// split into a pure PARSER plus a thin command runner, because the parsers are
// the part that can actually be tested without the hardware in the room.
//
// IDENTIFYING a device is the interesting half. A MAC prefix says who made it;
// SSDP hands over the manufacturer, model, firmware AND the exact list of
// services it exposes; mDNS names the protocol it speaks. Together that is
// "what is this, what software is it running, and what can I ask it to do" —
// which is what turns a row in a list into something Setayesh can control.
//
// CONSENT IS NOT OPTIONAL. Discovery is passive. Control is not, so:
//   * nothing is ever commanded that the owner has not allowed in the device
//     list (homedevices.js keeps that permission matrix);
//   * the device's own pairing is always honoured — a Samsung TV shows its
//     "allow this remote?" prompt, a Roku must have ECP enabled, a Bluetooth
//     speaker must already be paired by the operating system. Setayesh never
//     tries to get around any of that, and never guesses a PIN.

const os = require('os');
const fs = require('fs');
const path = require('path');
const dgram = require('dgram');
const http = require('http');
const { execFile } = require('child_process');

const IS_WIN = process.platform === 'win32';
const IS_MAC = process.platform === 'darwin';

// ---------------------------------------------------------------------------
// Running system commands, safely and briefly
// ---------------------------------------------------------------------------
// Never a shell: execFile with an argument array, so nothing a device NAME
// contains can ever become a command. Everything has a timeout, and a missing
// tool is a normal answer ({ ok:false }), not an exception.
function run(cmd, args, timeoutMs) {
  return new Promise((resolve) => {
    let done = false;
    const finish = (ok, out, err) => { if (!done) { done = true; resolve({ ok, out: out || '', err: err || '' }); } };
    try {
      const child = execFile(cmd, args, { timeout: timeoutMs || 8000, maxBuffer: 4 << 20, windowsHide: true },
        (e, stdout, stderr) => finish(!e, stdout, e ? String(stderr || e.message) : ''));
      child.on('error', (e) => finish(false, '', String(e.message)));
    } catch (e) { finish(false, '', String(e.message)); }
  });
}
function powershell(script) {
  return run('powershell.exe', ['-NoProfile', '-NonInteractive', '-Command', script], 15000);
}

// ---------------------------------------------------------------------------
// USB
// ---------------------------------------------------------------------------
// Linux exposes the whole tree in sysfs, which is both the most reliable
// source and the one that needs no tool installed.
function parseSysfsUsb(read) {
  const out = [];
  let names = [];
  try { names = read.list('/sys/bus/usb/devices'); } catch (e) { return out; }
  for (const name of names) {
    // usbN are root hubs and N-N.N:1.0 are interfaces, not devices.
    if (/:/.test(name) || /^usb\d+$/.test(name)) continue;
    const base = '/sys/bus/usb/devices/' + name;
    const get = (f) => { try { return (read.file(base + '/' + f) || '').trim(); } catch (e) { return ''; } };
    const vid = get('idVendor'), pid = get('idProduct');
    if (!vid && !pid) continue;
    const cls = get('bDeviceClass');
    out.push({
      transport: 'usb',
      id: 'usb:' + vid + ':' + pid + ':' + (get('serial') || name),
      name: get('product') || `USB ${vid}:${pid}`,
      vendor: get('manufacturer') || '',
      vendorId: vid, productId: pid,
      serial: get('serial') || '',
      usbClass: cls,
      kind: usbClassName(cls),
      speed: get('speed') ? get('speed') + ' Mb/s' : '',
      port: name,
    });
  }
  return out;
}
function usbClassName(hexClass) {
  const map = { '01': 'audio', '02': 'network/modem', '03': 'keyboard/mouse', '06': 'camera',
    '07': 'printer', '08': 'storage', '09': 'hub', '0a': 'data', '0e': 'webcam',
    'e0': 'wireless (Bluetooth/Wi-Fi)', 'ef': 'composite', 'ff': 'vendor-specific' };
  return map[String(hexClass || '').toLowerCase()] || 'unknown';
}

// Windows: Get-PnpDevice covers USB, Bluetooth and everything else, with the
// driver/service name — which is how we learn what SOFTWARE is driving it.
function parseWindowsPnp(json) {
  let rows;
  try { rows = JSON.parse(json); } catch (e) { return []; }
  if (!Array.isArray(rows)) rows = [rows];
  return rows.filter(Boolean).map((r) => {
    const id = String(r.InstanceId || r.DeviceID || '');
    const vid = (id.match(/VID_([0-9A-F]{4})/i) || [])[1] || '';
    const pid = (id.match(/PID_([0-9A-F]{4})/i) || [])[1] || '';
    const bt = /^BTHENUM|BTHLE/i.test(id);
    return {
      transport: bt ? 'bluetooth' : 'usb',
      id: (bt ? 'bt:' : 'usb:') + id,
      name: String(r.FriendlyName || r.Name || 'unknown'),
      vendor: String(r.Manufacturer || ''),
      vendorId: vid.toLowerCase(), productId: pid.toLowerCase(),
      kind: String(r.Class || '').toLowerCase(),
      driver: String(r.Service || ''),
      status: String(r.Status || ''),
      present: String(r.Status || '') === 'OK',
    };
  });
}

async function usbDevices() {
  if (IS_WIN) {
    const r = await powershell(
      "Get-PnpDevice -PresentOnly | Where-Object {$_.InstanceId -like 'USB*'} | "
      + 'Select-Object FriendlyName,Manufacturer,Class,Service,Status,InstanceId | ConvertTo-Json -Compress');
    return r.ok ? parseWindowsPnp(r.out) : [];
  }
  if (IS_MAC) {
    const r = await run('system_profiler', ['-json', 'SPUSBDataType'], 15000);
    return r.ok ? parseMacUsb(r.out) : [];
  }
  return parseSysfsUsb({
    list: (d) => fs.readdirSync(d),
    file: (f) => (fs.existsSync(f) ? fs.readFileSync(f, 'utf8') : ''),
  });
}

function parseMacUsb(json) {
  let data;
  try { data = JSON.parse(json); } catch (e) { return []; }
  const out = [];
  const walk = (nodes) => {
    for (const n of nodes || []) {
      if (n._name && (n.vendor_id || n.product_id)) {
        out.push({
          transport: 'usb',
          id: 'usb:' + (n.vendor_id || '') + ':' + (n.product_id || '') + ':' + (n.serial_num || n._name),
          name: n._name, vendor: n.manufacturer || n.vendor_id || '',
          vendorId: String(n.vendor_id || '').replace(/^0x/, ''),
          productId: String(n.product_id || '').replace(/^0x/, ''),
          serial: n.serial_num || '', kind: 'unknown', speed: n.device_speed || '',
        });
      }
      for (const k of Object.keys(n)) if (Array.isArray(n[k])) walk(n[k]);
    }
  };
  walk(data.SPUSBDataType || []);
  return out;
}

// ---------------------------------------------------------------------------
// Bluetooth
// ---------------------------------------------------------------------------
// `bluetoothctl devices` lists what the OS has paired; that is deliberate.
// Setayesh does not pair anything herself and does not scan for strangers'
// phones — the household pairs a device once, in the operating system, and
// that act IS the permission.
function parseBluetoothctl(text) {
  const out = [];
  for (const line of String(text).split(/\r?\n/)) {
    const m = line.match(/^Device\s+([0-9A-F:]{17})\s+(.*)$/i);
    if (!m) continue;
    out.push({
      transport: 'bluetooth',
      id: 'bt:' + m[1].toLowerCase(),
      mac: m[1].toLowerCase(),
      name: m[2].trim() || m[1],
      vendor: ouiVendor(m[1]),
      kind: 'bluetooth',
      paired: true,
    });
  }
  return out;
}
function parseMacBluetooth(json) {
  let data;
  try { data = JSON.parse(json); } catch (e) { return []; }
  const out = [];
  const walk = (v) => {
    if (Array.isArray(v)) { v.forEach(walk); return; }
    if (!v || typeof v !== 'object') return;
    for (const [k, val] of Object.entries(v)) {
      if (val && typeof val === 'object' && val.device_address) {
        out.push({ transport: 'bluetooth', id: 'bt:' + String(val.device_address).toLowerCase(),
          mac: String(val.device_address).toLowerCase(), name: k,
          vendor: val.device_manufacturer || ouiVendor(val.device_address),
          kind: val.device_minorType || val.device_majorType || 'bluetooth',
          paired: String(val.device_isPaired || '').toLowerCase() === 'yes' });
      } else walk(val);
    }
  };
  walk(data.SPBluetoothDataType || []);
  return out;
}

async function bluetoothDevices() {
  if (IS_WIN) {
    const r = await powershell(
      "Get-PnpDevice -PresentOnly | Where-Object {$_.InstanceId -like 'BTH*'} | "
      + 'Select-Object FriendlyName,Manufacturer,Class,Service,Status,InstanceId | ConvertTo-Json -Compress');
    return r.ok ? parseWindowsPnp(r.out) : [];
  }
  if (IS_MAC) {
    const r = await run('system_profiler', ['-json', 'SPBluetoothDataType'], 15000);
    return r.ok ? parseMacBluetooth(r.out) : [];
  }
  const r = await run('bluetoothctl', ['devices'], 6000);
  return r.ok ? parseBluetoothctl(r.out) : [];
}

// ---------------------------------------------------------------------------
// Drives
// ---------------------------------------------------------------------------
function parseLsblk(json) {
  let data;
  try { data = JSON.parse(json); } catch (e) { return []; }
  const out = [];
  const walk = (nodes, parent) => {
    for (const d of nodes || []) {
      // loop devices are squashfs images, not drives anybody cares about.
      if (/^loop/.test(d.name || '')) continue;
      out.push({
        transport: 'drive',
        id: 'drive:' + (d.uuid || d.name),
        name: d.label || d.model || d.name,
        device: '/dev/' + d.name,
        kind: d.type === 'part' ? 'partition' : (d.type || 'disk'),
        fs: d.fstype || '',
        size: d.size || '',
        mounted: d.mountpoint || (Array.isArray(d.mountpoints) ? d.mountpoints.filter(Boolean)[0] : '') || '',
        removable: String(d.rm) === '1' || d.rm === true || (parent && parent.removable) || false,
        vendor: (d.vendor || '').trim(),
        serial: d.serial || '',
      });
      if (d.children) walk(d.children, out[out.length - 1]);
    }
  };
  walk(data.blockdevices);
  return out;
}
function parseWindowsDrives(json) {
  let rows;
  try { rows = JSON.parse(json); } catch (e) { return []; }
  if (!Array.isArray(rows)) rows = [rows];
  const TYPE = { 2: 'removable (USB/card)', 3: 'fixed disk', 4: 'network drive', 5: 'CD/DVD' };
  return rows.filter(Boolean).map((r) => ({
    transport: 'drive',
    id: 'drive:' + String(r.DeviceID || r.Name || ''),
    name: String(r.VolumeName || r.DeviceID || ''),
    device: String(r.DeviceID || ''),
    kind: TYPE[Number(r.DriveType)] || 'disk',
    fs: String(r.FileSystem || ''),
    size: r.Size ? humanBytes(Number(r.Size)) : '',
    free: r.FreeSpace ? humanBytes(Number(r.FreeSpace)) : '',
    mounted: String(r.DeviceID || ''),
    removable: Number(r.DriveType) === 2,
  }));
}
function humanBytes(n) {
  const u = ['B', 'KB', 'MB', 'GB', 'TB'];
  let i = 0, v = Number(n) || 0;
  while (v >= 1024 && i < u.length - 1) { v /= 1024; i++; }
  return (i ? v.toFixed(1) : String(v)) + ' ' + u[i];
}

async function driveDevices() {
  if (IS_WIN) {
    const r = await powershell('Get-CimInstance Win32_LogicalDisk | Select-Object DeviceID,VolumeName,'
      + 'FileSystem,DriveType,Size,FreeSpace | ConvertTo-Json -Compress');
    return r.ok ? parseWindowsDrives(r.out) : [];
  }
  if (IS_MAC) {
    const r = await run('diskutil', ['list', '-plist'], 10000);
    if (!r.ok) return [];
    // Plist parsing would be a dependency; the human-readable form is enough.
    const plain = await run('diskutil', ['list'], 10000);
    return parseDiskutil(plain.out);
  }
  const r = await run('lsblk', ['-J', '-o', 'NAME,LABEL,MODEL,TYPE,FSTYPE,SIZE,MOUNTPOINT,RM,VENDOR,SERIAL,UUID'], 8000);
  return r.ok ? parseLsblk(r.out) : [];
}
function parseDiskutil(text) {
  const out = [];
  for (const line of String(text).split(/\r?\n/)) {
    const m = line.match(/^\s+\d+:\s+(\S+)\s+(.*?)\s{2,}([\d.]+\s+[KMGT]B)\s+(\S+)\s*$/);
    if (!m) continue;
    out.push({ transport: 'drive', id: 'drive:' + m[4], name: m[2].trim() || m[4],
      device: '/dev/' + m[4], kind: m[1], size: m[3], mounted: '', removable: false });
  }
  return out;
}

// ---------------------------------------------------------------------------
// Network: SSDP / UPnP
// ---------------------------------------------------------------------------
// This is the richest source by far. A TV, a speaker, a printer or a router
// answers an M-SEARCH with a LOCATION URL; fetching that URL returns an XML
// description with the manufacturer, model, firmware and — crucially — the
// list of SERVICES it implements. Those services ARE its command surface.
function parseSsdpResponse(text, rinfo) {
  const headers = {};
  for (const line of String(text).split(/\r?\n/).slice(1)) {
    const i = line.indexOf(':');
    if (i > 0) headers[line.slice(0, i).trim().toUpperCase()] = line.slice(i + 1).trim();
  }
  if (!headers.LOCATION) return null;
  return {
    address: rinfo && rinfo.address,
    location: headers.LOCATION,
    st: headers.ST || headers.NT || '',
    usn: headers.USN || '',
    server: headers.SERVER || '',
  };
}

function ssdpSearch(timeoutMs) {
  return new Promise((resolve) => {
    const found = new Map();
    let sock;
    try { sock = dgram.createSocket({ type: 'udp4', reuseAddr: true }); }
    catch (e) { return resolve([]); }
    const done = () => { try { sock.close(); } catch (e) {} resolve([...found.values()]); };
    const timer = setTimeout(done, timeoutMs || 3000);
    if (timer.unref) timer.unref();
    sock.on('error', () => { clearTimeout(timer); done(); });
    sock.on('message', (msg, rinfo) => {
      const r = parseSsdpResponse(msg.toString('latin1'), rinfo);
      if (r && !found.has(r.location)) found.set(r.location, r);
    });
    sock.bind(() => {
      try { sock.setBroadcast(true); } catch (e) {}
      const query = Buffer.from(
        'M-SEARCH * HTTP/1.1\r\nHOST: 239.255.255.250:1900\r\nMAN: "ssdp:discover"\r\n'
        + 'MX: 2\r\nST: ssdp:all\r\n\r\n');
      // Two sends: UDP multicast is lossy and one lost packet is one missing TV.
      for (const d of [0, 700]) {
        const t = setTimeout(() => { try { sock.send(query, 0, query.length, 1900, '239.255.255.250'); } catch (e) {} }, d);
        if (t.unref) t.unref();
      }
    });
  });
}

function parseUpnpDescription(xml, location) {
  const pick = (tag) => {
    const m = String(xml).match(new RegExp('<' + tag + '[^>]*>([\\s\\S]*?)</' + tag + '>', 'i'));
    return m ? m[1].replace(/<[^>]+>/g, '').trim() : '';
  };
  const services = [...String(xml).matchAll(/<serviceType>([\s\S]*?)<\/serviceType>/gi)]
    .map((m) => m[1].trim());
  const controlUrls = {};
  for (const m of String(xml).matchAll(/<service>([\s\S]*?)<\/service>/gi)) {
    const st = (m[1].match(/<serviceType>([\s\S]*?)<\/serviceType>/i) || [])[1];
    const cu = (m[1].match(/<controlURL>([\s\S]*?)<\/controlURL>/i) || [])[1];
    if (st && cu) controlUrls[st.trim()] = cu.trim();
  }
  return {
    name: pick('friendlyName'),
    vendor: pick('manufacturer'),
    model: pick('modelName'),
    modelNumber: pick('modelNumber'),
    description: pick('modelDescription'),
    serial: pick('serialNumber'),
    udn: pick('UDN'),
    deviceType: pick('deviceType'),
    services,
    controlUrls,
    location,
  };
}

function httpGet(url, timeoutMs) {
  return new Promise((resolve) => {
    let req;
    const finish = (body) => { try { req && req.destroy(); } catch (e) {} resolve(body); };
    try {
      req = http.get(url, { timeout: timeoutMs || 4000 }, (res) => {
        let data = '';
        res.setEncoding('utf8');
        res.on('data', (c) => { data += c; if (data.length > 512 * 1024) finish(data); });
        res.on('end', () => finish(data));
      });
      req.on('error', () => finish(''));
      req.on('timeout', () => finish(''));
    } catch (e) { finish(''); }
  });
}

// UPnP service types -> what a person can actually ask the device to do.
const SERVICE_CAPABILITIES = [
  [/AVTransport/i, ['play', 'pause', 'stop', 'next', 'previous', 'play_url'], 'پخش‌کننده (تلویزیون، اسپیکر، گیرنده)'],
  [/RenderingControl/i, ['volume', 'mute', 'unmute'], 'کنترل صدا'],
  [/ContentDirectory/i, ['browse'], 'کتابخانه‌ی رسانه'],
  [/WANIPConnection|WANPPPConnection|Layer3Forwarding/i, ['router_info'], 'مودم/روتر'],
  [/PrintBasic|Printer/i, ['print_status'], 'چاپگر'],
  [/ScanService/i, ['scan_status'], 'اسکنر'],
  [/SwitchPower|BinaryLight/i, ['on', 'off'], 'کلید یا لامپ هوشمند'],
];
function capabilitiesFromServices(services) {
  const caps = new Set();
  const roles = new Set();
  for (const s of services || []) {
    for (const [re, c, role] of SERVICE_CAPABILITIES) {
      if (re.test(s)) { c.forEach((x) => caps.add(x)); roles.add(role); }
    }
  }
  return { capabilities: [...caps], roles: [...roles] };
}

// ---------------------------------------------------------------------------
// Network: mDNS / Bonjour
// ---------------------------------------------------------------------------
// Apple TVs, Chromecasts, printers, NAS boxes and most modern speakers announce
// themselves here. A minimal DNS message writer and reader — no dependency.
function encodeName(name) {
  const parts = String(name).split('.').filter(Boolean);
  const bufs = parts.map((p) => {
    const b = Buffer.from(p, 'utf8');
    return Buffer.concat([Buffer.from([b.length]), b]);
  });
  return Buffer.concat([...bufs, Buffer.from([0])]);
}
function mdnsQuery(name, type) {
  const header = Buffer.alloc(12);
  header.writeUInt16BE(0, 0);      // id 0 = multicast DNS
  header.writeUInt16BE(0, 2);      // standard query
  header.writeUInt16BE(1, 4);      // one question
  const q = encodeName(name);
  const tail = Buffer.alloc(4);
  tail.writeUInt16BE(type || 12, 0);   // PTR
  tail.writeUInt16BE(1, 2);            // IN
  return Buffer.concat([header, q, tail]);
}
// Reading a name means following compression pointers, which is the one part
// of DNS parsing that cannot be skipped.
function readName(buf, offset) {
  const parts = [];
  let jumped = false, next = offset, guard = 0;
  while (offset < buf.length && guard++ < 128) {
    const len = buf[offset];
    if (len === 0) { offset++; break; }
    if ((len & 0xc0) === 0xc0) {
      const ptr = ((len & 0x3f) << 8) | buf[offset + 1];
      if (!jumped) next = offset + 2;
      jumped = true;
      offset = ptr;
      continue;
    }
    parts.push(buf.slice(offset + 1, offset + 1 + len).toString('utf8'));
    offset += 1 + len;
  }
  return { name: parts.join('.'), offset: jumped ? next : offset };
}
function parseMdnsPacket(buf) {
  const out = { answers: [] };
  if (buf.length < 12) return out;
  const counts = [buf.readUInt16BE(4), buf.readUInt16BE(6), buf.readUInt16BE(8), buf.readUInt16BE(10)];
  let off = 12;
  for (let i = 0; i < counts[0]; i++) {          // skip the questions
    const r = readName(buf, off);
    off = r.offset + 4;
  }
  const total = counts[1] + counts[2] + counts[3];
  for (let i = 0; i < total && off + 10 <= buf.length; i++) {
    const r = readName(buf, off);
    off = r.offset;
    const type = buf.readUInt16BE(off);
    const rdlen = buf.readUInt16BE(off + 8);
    const rdStart = off + 10;
    if (rdStart + rdlen > buf.length) break;
    const rec = { name: r.name, type };
    if (type === 12) rec.ptr = readName(buf, rdStart).name;                       // PTR
    else if (type === 1 && rdlen === 4) rec.a = [...buf.slice(rdStart, rdStart + 4)].join('.');   // A
    else if (type === 33 && rdlen >= 6) {                                          // SRV
      rec.port = buf.readUInt16BE(rdStart + 4);
      rec.target = readName(buf, rdStart + 6).name;
    } else if (type === 16) {                                                      // TXT
      const txt = [];
      let p = rdStart;
      while (p < rdStart + rdlen && p < buf.length) {
        const l = buf[p];
        if (!l) break;
        txt.push(buf.slice(p + 1, p + 1 + l).toString('utf8'));
        p += 1 + l;
      }
      rec.txt = txt;
    }
    out.answers.push(rec);
    off = rdStart + rdlen;
  }
  return out;
}

const MDNS_SERVICE_ROLE = {
  '_googlecast._tcp': 'Chromecast / Google TV',
  '_airplay._tcp': 'AirPlay (Apple TV، اسپیکر)',
  '_raop._tcp': 'AirPlay Audio',
  '_spotify-connect._tcp': 'Spotify Connect',
  '_ipp._tcp': 'چاپگر (IPP)', '_ipps._tcp': 'چاپگر (IPP امن)', '_printer._tcp': 'چاپگر',
  '_smb._tcp': 'اشتراک فایل ویندوز', '_afpovertcp._tcp': 'اشتراک فایل اپل',
  '_nfs._tcp': 'اشتراک فایل NFS', '_ssh._tcp': 'SSH', '_sftp-ssh._tcp': 'SFTP',
  '_http._tcp': 'وب', '_https._tcp': 'وب امن',
  '_hap._tcp': 'HomeKit', '_matter._tcp': 'Matter', '_matterc._udp': 'Matter (جفت‌سازی)',
  '_hue._tcp': 'Philips Hue', '_sonos._tcp': 'Sonos', '_miio._udp': 'شیائومی',
  '_homekit._tcp': 'HomeKit', '_companion-link._tcp': 'Apple Companion',
  '_rdlink._tcp': 'Apple Remote', '_workstation._tcp': 'کامپیوتر',
  '_device-info._tcp': 'اطلاعات دستگاه',
};

function mdnsBrowse(timeoutMs) {
  return new Promise((resolve) => {
    let sock;
    try { sock = dgram.createSocket({ type: 'udp4', reuseAddr: true }); }
    catch (e) { return resolve({ services: [], records: [] }); }
    const records = [];
    const done = () => { try { sock.close(); } catch (e) {} resolve(collateMdns(records)); };
    const timer = setTimeout(done, timeoutMs || 3500);
    if (timer.unref) timer.unref();
    sock.on('error', () => { clearTimeout(timer); done(); });
    sock.on('message', (msg) => {
      try { records.push(...parseMdnsPacket(msg).answers); } catch (e) {}
    });
    sock.bind(5353, () => {
      try { sock.addMembership('224.0.0.251'); } catch (e) { /* no multicast here */ }
      const asks = ['_services._dns-sd._udp.local', ...Object.keys(MDNS_SERVICE_ROLE).map((s) => s + '.local')];
      asks.slice(0, 14).forEach((name, i) => {
        const t = setTimeout(() => {
          const q = mdnsQuery(name, 12);
          try { sock.send(q, 0, q.length, 5353, '224.0.0.251'); } catch (e) {}
        }, i * 60);
        if (t.unref) t.unref();
      });
    });
  });
}

// Turn a pile of DNS records into one row per device.
function collateMdns(records) {
  const byTarget = new Map();
  const addrs = new Map();
  const services = new Set();
  for (const r of records) {
    if (r.type === 1 && r.a) addrs.set(r.name, r.a);
  }
  for (const r of records) {
    if (r.type === 12 && r.ptr) {
      const svc = r.name.replace(/\.local$/, '');
      if (/^_/.test(svc)) services.add(svc);
      const inst = r.ptr;
      const rec = byTarget.get(inst) || { instance: inst, services: new Set(), txt: [] };
      rec.services.add(svc);
      byTarget.set(inst, rec);
    }
  }
  for (const r of records) {
    if (r.type === 33 && r.target) {
      const rec = byTarget.get(r.name) || { instance: r.name, services: new Set(), txt: [] };
      rec.host = r.target; rec.port = r.port;
      rec.address = addrs.get(r.target) || rec.address;
      byTarget.set(r.name, rec);
    }
    if (r.type === 16 && r.txt && r.txt.length) {
      const rec = byTarget.get(r.name) || { instance: r.name, services: new Set(), txt: [] };
      rec.txt = rec.txt.concat(r.txt).slice(0, 20);
      byTarget.set(r.name, rec);
    }
  }
  const out = [];
  for (const rec of byTarget.values()) {
    const svcList = [...rec.services];
    const label = rec.instance.split('.')[0].replace(/\\032/g, ' ');
    const roles = svcList.map((s) => MDNS_SERVICE_ROLE[s]).filter(Boolean);
    if (!rec.host && !rec.address && !svcList.length) continue;
    out.push({
      transport: 'network', via: 'mdns',
      id: 'mdns:' + rec.instance,
      name: label || rec.host || rec.instance,
      host: rec.host || '', address: rec.address || '', port: rec.port || 0,
      services: svcList, roles,
      txt: rec.txt,
    });
  }
  return { services: [...services], devices: out };
}

// ---------------------------------------------------------------------------
// MAC vendor lookup
// ---------------------------------------------------------------------------
// The full IEEE registry is 4 MB and would have to be shipped and kept fresh.
// This is the short list that actually turns up in a house — enough to say
// "that is a Samsung" instead of "unknown device", and honest about the rest.
const OUI = {
  '00:1a:11': 'Google', 'f4:f5:d8': 'Google', '1c:f2:9a': 'Google', 'd8:6c:63': 'Google',
  '00:17:88': 'Philips Hue', 'ec:b5:fa': 'Philips Hue',
  '00:16:6c': 'Samsung', '00:1d:25': 'Samsung', '5c:49:7d': 'Samsung', '8c:71:f8': 'Samsung',
  'bc:14:85': 'Samsung', 'd0:66:7b': 'Samsung', '00:12:fb': 'Samsung',
  '00:1e:c2': 'Apple', '3c:07:54': 'Apple', 'a4:83:e7': 'Apple', 'f0:18:98': 'Apple',
  '00:0c:29': 'VMware', '08:00:27': 'VirtualBox',
  '00:50:f2': 'Microsoft', '7c:1e:52': 'Microsoft',
  'b8:27:eb': 'Raspberry Pi', 'dc:a6:32': 'Raspberry Pi', 'e4:5f:01': 'Raspberry Pi',
  '00:04:20': 'Slim Devices/Sonos', '94:9f:3e': 'Sonos', '5c:aa:fd': 'Sonos',
  '00:1b:63': 'Apple', '18:b4:30': 'Nest', '64:16:66': 'Nest',
  'd0:73:d5': 'LIFX', '68:c6:3a': 'Espressif (ESP8266)', '24:0a:c4': 'Espressif (ESP32)',
  '7c:df:a1': 'Espressif', 'cc:50:e3': 'Espressif',
  '00:1f:3f': 'AVM FRITZ!Box', 'e0:28:6d': 'AVM FRITZ!Box', '3c:a6:2f': 'AVM FRITZ!Box',
  '00:09:0f': 'Fortinet', '00:1c:c4': 'HP', '3c:d9:2b': 'HP', '00:21:5a': 'HP',
  '00:80:77': 'Brother', '00:1b:a9': 'Brother', '00:00:85': 'Canon', '00:1e:8f': 'Canon',
  '00:26:ab': 'Seiko Epson', '00:1b:78': 'HP', 'b0:95:8e': 'Tuya', '10:d5:61': 'Tuya',
  '68:57:2d': 'Xiaomi', '78:11:dc': 'Xiaomi', '04:cf:8c': 'Xiaomi', '50:ec:50': 'Xiaomi',
  'ac:84:c6': 'TP-Link', '50:c7:bf': 'TP-Link', 'd8:07:b6': 'TP-Link',
  '00:1d:0f': 'TP-Link', '74:da:88': 'TP-Link', 'b0:be:76': 'TP-Link',
};
function ouiVendor(mac) {
  const m = String(mac || '').toLowerCase().replace(/-/g, ':');
  return OUI[m.slice(0, 8)] || '';
}
// A locally-administered MAC (bit 1 of the first octet) is either a privacy
// address from a phone or something deliberately spoofing. Worth saying.
function isRandomMac(mac) {
  const first = parseInt(String(mac || '').replace(/[^0-9a-f]/gi, '').slice(0, 2), 16);
  return Number.isFinite(first) && (first & 0x02) === 0x02;
}

// ---------------------------------------------------------------------------
// The whole sweep
// ---------------------------------------------------------------------------
async function scanAll(opts) {
  opts = opts || {};
  const started = Date.now();
  const want = opts.transports || ['usb', 'bluetooth', 'drive', 'network'];
  const jobs = {};
  if (want.includes('usb')) jobs.usb = usbDevices().catch(() => []);
  if (want.includes('bluetooth')) jobs.bluetooth = bluetoothDevices().catch(() => []);
  if (want.includes('drive')) jobs.drive = driveDevices().catch(() => []);
  if (want.includes('network')) {
    jobs.ssdp = ssdpSearch(opts.timeoutMs || 3000).catch(() => []);
    jobs.mdns = mdnsBrowse(opts.timeoutMs || 3500).catch(() => ({ services: [], devices: [] }));
  }
  const keys = Object.keys(jobs);
  const settled = await Promise.all(keys.map((k) => jobs[k]));
  const res = {};
  keys.forEach((k, i) => { res[k] = settled[i]; });

  const devices = [];
  for (const d of res.usb || []) devices.push(d);
  for (const d of res.bluetooth || []) devices.push(d);
  for (const d of res.drive || []) devices.push(d);
  for (const d of ((res.mdns && res.mdns.devices) || [])) devices.push(d);

  // Fetch each SSDP device's description: this is what upgrades a bare IP into
  // "Samsung UE50 running Tizen, and here is what it will let me do".
  const upnp = [];
  for (const hit of (res.ssdp || []).slice(0, 40)) {
    const xml = await httpGet(hit.location, 3500);
    if (!xml) {
      upnp.push({ transport: 'network', via: 'ssdp', id: 'ssdp:' + hit.usn || hit.location,
        name: hit.address || hit.location, address: hit.address, software: hit.server, capabilities: [] });
      continue;
    }
    const desc = parseUpnpDescription(xml, hit.location);
    const { capabilities, roles } = capabilitiesFromServices(desc.services);
    upnp.push({
      transport: 'network', via: 'ssdp',
      id: 'ssdp:' + (desc.udn || hit.usn || hit.location),
      name: desc.name || hit.address || 'UPnP device',
      address: hit.address,
      vendor: desc.vendor, model: desc.model || desc.modelNumber,
      serial: desc.serial,
      software: hit.server,                 // e.g. "Linux/4.1 UPnP/1.0 Tizen/3.0"
      deviceType: desc.deviceType,
      services: desc.services, controlUrls: desc.controlUrls, location: hit.location,
      roles, capabilities,
    });
  }
  // The same physical box often answers on both SSDP and mDNS; merge by IP so
  // the owner sees one television, not two.
  for (const u of upnp) {
    const same = devices.find((d) => d.transport === 'network' && d.address && u.address && d.address === u.address);
    if (same) {
      same.via = same.via + '+ssdp';
      same.vendor = same.vendor || u.vendor;
      same.model = same.model || u.model;
      same.software = same.software || u.software;
      same.services = [...new Set([...(same.services || []), ...(u.services || [])])];
      same.roles = [...new Set([...(same.roles || []), ...(u.roles || [])])];
      same.capabilities = [...new Set([...(same.capabilities || []), ...(u.capabilities || [])])];
      same.controlUrls = Object.assign({}, same.controlUrls, u.controlUrls);
      same.location = same.location || u.location;
      if (!same.name || /^\d+\.\d+\.\d+\.\d+$/.test(same.name)) same.name = u.name;
    } else devices.push(u);
  }

  for (const d of devices) {
    if (d.mac && !d.vendor) d.vendor = ouiVendor(d.mac);
    if (d.mac) d.randomMac = isRandomMac(d.mac);
  }

  return {
    scannedAt: new Date().toISOString(),
    tookMs: Date.now() - started,
    counts: {
      usb: (res.usb || []).length,
      bluetooth: (res.bluetooth || []).length,
      drive: (res.drive || []).length,
      network: devices.filter((d) => d.transport === 'network').length,
    },
    mdnsServices: (res.mdns && res.mdns.services) || [],
    devices,
    platform: process.platform,
    notes: platformNotes(res),
  };
}

// Say plainly when a transport could not be looked at, instead of reporting an
// empty list as if it were a finding.
function platformNotes(res) {
  const notes = [];
  if (!IS_WIN && !IS_MAC) {
    if (!(res.bluetooth || []).length) notes.push('بلوتوث: اگر bluetoothctl نصب نباشد چیزی دیده نمی‌شود (bluez).');
    if (!(res.usb || []).length && !fs.existsSync('/sys/bus/usb/devices')) {
      notes.push('USB: این سیستم /sys/bus/usb ندارد (احتمالاً داخل کانتینر است).');
    }
  }
  return notes;
}

// ---------------------------------------------------------------------------
// Control — only what the device itself agreed to expose
// ---------------------------------------------------------------------------
function soap(url, serviceType, action, args, timeoutMs) {
  const body = `<?xml version="1.0"?>
<s:Envelope xmlns:s="http://schemas.xmlsoap.org/soap/envelope/" s:encodingStyle="http://schemas.xmlsoap.org/soap/encoding/">
<s:Body><u:${action} xmlns:u="${serviceType}">${
    Object.entries(args || {}).map(([k, v]) =>
      `<${k}>${String(v).replace(/[<>&]/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;' }[c]))}</${k}>`).join('')
  }</u:${action}></s:Body></s:Envelope>`;
  return new Promise((resolve) => {
    let u;
    try { u = new URL(url); } catch (e) { return resolve({ ok: false, error: 'آدرس کنترل نامعتبر است.' }); }
    const req = http.request({
      hostname: u.hostname, port: u.port || 80, path: u.pathname + u.search, method: 'POST',
      timeout: timeoutMs || 5000,
      headers: {
        'Content-Type': 'text/xml; charset="utf-8"',
        SOAPACTION: `"${serviceType}#${action}"`,
        'Content-Length': Buffer.byteLength(body),
      },
    }, (res) => {
      let data = '';
      res.setEncoding('utf8');
      res.on('data', (c) => { data += c; });
      res.on('end', () => resolve({ ok: res.statusCode >= 200 && res.statusCode < 300, status: res.statusCode, body: data.slice(0, 4000) }));
    });
    req.on('error', (e) => resolve({ ok: false, error: e.message }));
    req.on('timeout', () => { req.destroy(); resolve({ ok: false, error: 'دستگاه جواب نداد.' }); });
    req.end(body);
  });
}

const AVT = 'urn:schemas-upnp-org:service:AVTransport:1';
const RC = 'urn:schemas-upnp-org:service:RenderingControl:1';

// device: a row from scanAll() with controlUrls filled in by SSDP.
async function command(device, action, value) {
  if (!device || !device.location) return { ok: false, error: 'این دستگاه رابط کنترل اعلام‌شده ندارد.' };
  const base = new URL(device.location);
  const abs = (u) => (/^https?:/i.test(u) ? u : base.origin + (u.startsWith('/') ? u : '/' + u));
  const find = (re) => {
    const key = Object.keys(device.controlUrls || {}).find((k) => re.test(k));
    return key ? { type: key, url: abs(device.controlUrls[key]) } : null;
  };
  const av = find(/AVTransport/i);
  const rc = find(/RenderingControl/i);

  switch (String(action)) {
    case 'play':
      if (!av) return { ok: false, error: 'این دستگاه پخش را پشتیبانی نمی‌کند.' };
      return await soap(av.url, av.type, 'Play', { InstanceID: 0, Speed: 1 });
    case 'pause':
      if (!av) return { ok: false, error: 'این دستگاه Pause ندارد.' };
      return await soap(av.url, av.type, 'Pause', { InstanceID: 0 });
    case 'stop':
      if (!av) return { ok: false, error: 'این دستگاه Stop ندارد.' };
      return await soap(av.url, av.type, 'Stop', { InstanceID: 0 });
    case 'next':
      if (!av) return { ok: false, error: 'پشتیبانی نمی‌شود.' };
      return await soap(av.url, av.type, 'Next', { InstanceID: 0 });
    case 'previous':
      if (!av) return { ok: false, error: 'پشتیبانی نمی‌شود.' };
      return await soap(av.url, av.type, 'Previous', { InstanceID: 0 });
    case 'play_url': {
      if (!av) return { ok: false, error: 'این دستگاه پخش از آدرس را پشتیبانی نمی‌کند.' };
      if (!/^https?:\/\//i.test(String(value || ''))) return { ok: false, error: 'آدرس پخش باید http یا https باشد.' };
      const set = await soap(av.url, av.type, 'SetAVTransportURI',
        { InstanceID: 0, CurrentURI: value, CurrentURIMetaData: '' });
      if (!set.ok) return set;
      return await soap(av.url, av.type, 'Play', { InstanceID: 0, Speed: 1 });
    }
    case 'volume': {
      if (!rc) return { ok: false, error: 'این دستگاه کنترل صدا ندارد.' };
      const v = Math.max(0, Math.min(100, Number(value)));
      if (!Number.isFinite(v)) return { ok: false, error: 'مقدار صدا باید عددی بین ۰ تا ۱۰۰ باشد.' };
      return await soap(rc.url, rc.type, 'SetVolume', { InstanceID: 0, Channel: 'Master', DesiredVolume: v });
    }
    case 'mute': case 'unmute':
      if (!rc) return { ok: false, error: 'این دستگاه کنترل صدا ندارد.' };
      return await soap(rc.url, rc.type, 'SetMute', { InstanceID: 0, Channel: 'Master', DesiredMute: action === 'mute' ? 1 : 0 });
    case 'status': {
      if (!av) return { ok: false, error: 'وضعیتی اعلام نمی‌کند.' };
      const r = await soap(av.url, av.type, 'GetTransportInfo', { InstanceID: 0 });
      if (!r.ok) return r;
      const state = (r.body.match(/<CurrentTransportState>([^<]+)</) || [])[1] || '';
      return { ok: true, state };
    }
    default:
      return { ok: false, error: `دستور «${action}» شناخته نشد. دستورهای این دستگاه: ` + (device.capabilities || []).join('، ') };
  }
}

module.exports = {
  scanAll, usbDevices, bluetoothDevices, driveDevices,
  ssdpSearch, mdnsBrowse, command, httpGet,
  // exported for tests — these are the parts worth testing without hardware
  parseSysfsUsb, parseWindowsPnp, parseMacUsb, parseBluetoothctl, parseMacBluetooth,
  parseLsblk, parseWindowsDrives, parseDiskutil, parseSsdpResponse, parseUpnpDescription,
  parseMdnsPacket, collateMdns, mdnsQuery, readName, encodeName,
  capabilitiesFromServices, ouiVendor, isRandomMac, usbClassName, humanBytes,
  MDNS_SERVICE_ROLE, SERVICE_CAPABILITIES,
};
