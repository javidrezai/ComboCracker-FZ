'use strict';

// hwlink.js — talk to a device over Bluetooth or over a cable.
//
// discover.js answers "what is out there". This answers the next question:
// connect to it, read everything it will tell you, and where the device allows
// it, write back.
//
//   BLUETOOTH   adapters, paired and nearby radios, pair / connect / trust /
//               disconnect / forget, full info, and GATT read & write
//   CABLE       every USB device with its complete descriptor, every serial
//               port, and a real two-way serial link (open, send, read)
//   WATCH       what appeared or disappeared since the last look, so nothing
//               gets plugged in without Setayesh noticing
//
// Stdlib only, like the rest of the app. That is possible because every
// platform already ships the tools:
//   Linux    bluetoothctl / btmgmt / hciconfig, sysfs, stty on a tty
//   Windows  PowerShell — Get-PnpDevice for the full property set, and
//            System.IO.Ports.SerialPort for a real serial connection
//   macOS    system_profiler, blueutil when present, stty on a tty
// Where a platform genuinely cannot do something, it SAYS so and names what
// would make it work. It never reports an empty list as if it were a finding.
//
// TWO SAFETY RULES, enforced here rather than left to the caller:
//
//   1. Pairing is a handshake, not a break-in. Setayesh asks the operating
//      system to pair, which makes the device show ITS OWN confirmation — a
//      PIN on the screen, a button to hold. She never guesses a PIN, never
//      brute-forces one, and never pairs with something the owner did not name.
//   2. Writing to a device can brick it. Every write is explicit: a named
//      device, a named characteristic or port, and bytes the caller supplied.
//      Nothing is ever written speculatively, and the serial link refuses to
//      open a port that is not in the list the system reported.

const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFile, spawn } = require('child_process');
const discover = require('./discover');

const IS_WIN = process.platform === 'win32';
const IS_MAC = process.platform === 'darwin';

// ---------------------------------------------------------------------------
// Running tools
// ---------------------------------------------------------------------------
// Always execFile with an argument array — never a shell — so a device name
// containing a quote or a semicolon can never become part of a command.
function run(cmd, args, timeoutMs) {
  return new Promise((resolve) => {
    let done = false;
    const finish = (ok, out, err) => { if (!done) { done = true; resolve({ ok, out: out || '', err: err || '' }); } };
    try {
      const child = execFile(cmd, args, { timeout: timeoutMs || 10000, maxBuffer: 8 << 20, windowsHide: true },
        (e, stdout, stderr) => finish(!e, stdout, e ? String(stderr || e.message) : ''));
      child.on('error', (e) => finish(false, '', String(e.message)));
    } catch (e) { finish(false, '', String(e.message)); }
  });
}
function ps(script, timeoutMs) {
  return run('powershell.exe', ['-NoProfile', '-NonInteractive', '-Command', script], timeoutMs || 20000);
}
function have(cmd) {
  const exts = IS_WIN ? ['.exe', '.cmd', '.bat'] : [''];
  for (const dir of String(process.env.PATH || '').split(path.delimiter)) {
    if (!dir) continue;
    for (const e of exts) {
      try { fs.accessSync(path.join(dir, cmd + e), fs.constants.X_OK); return true; } catch (err) { /* keep looking */ }
    }
  }
  return false;
}

// bluetoothctl is interactive: it takes commands on stdin and prints as it
// goes. Feed it a script, give it a moment, read what it said.
function bluetoothctl(lines, waitMs) {
  return new Promise((resolve) => {
    let child;
    let out = '';
    let done = false;
    const finish = () => {
      if (done) return; done = true;
      try { child && child.kill(); } catch (e) {}
      resolve({ ok: true, out });
    };
    try { child = spawn('bluetoothctl', [], { stdio: ['pipe', 'pipe', 'pipe'] }); }
    catch (e) { return resolve({ ok: false, out: '', err: e.message }); }
    child.on('error', (e) => { done = true; resolve({ ok: false, out: '', err: e.message }); });
    child.stdout.on('data', (d) => { out += d.toString(); });
    child.stderr.on('data', (d) => { out += d.toString(); });
    for (const l of [].concat(lines)) {
      try { child.stdin.write(l + '\n'); } catch (e) {}
    }
    const timer = setTimeout(() => {
      try { child.stdin.write('quit\n'); } catch (e) {}
      setTimeout(finish, 400);
    }, waitMs || 2500);
    if (timer.unref) timer.unref();
    child.on('close', finish);
  });
}

// ---------------------------------------------------------------------------
// Bluetooth — parsers first, because they are the testable part
// ---------------------------------------------------------------------------
function parseBtDevices(text) {
  const out = [];
  for (const line of String(text).split(/\r?\n/)) {
    const m = line.match(/Device\s+((?:[0-9A-F]{2}:){5}[0-9A-F]{2})\s*(.*)$/i);
    if (!m) continue;
    const mac = m[1].toLowerCase();
    if (out.some((d) => d.mac === mac)) continue;
    out.push({ mac, name: (m[2] || '').trim() || mac });
  }
  return out;
}

// `bluetoothctl info <mac>` prints an indented block; this turns it into the
// full picture of one device, including the service UUIDs that say what it
// can actually do.
function parseBtInfo(text) {
  const info = { uuids: [] };
  for (const raw of String(text).split(/\r?\n/)) {
    const line = raw.trim();
    const uuid = line.match(/^UUID:\s*(.+?)\s*\(([0-9a-f-]{36})\)/i);
    if (uuid) { info.uuids.push({ name: uuid[1].trim(), uuid: uuid[2].toLowerCase() }); continue; }
    const kv = line.match(/^([A-Za-z][A-Za-z ]*?):\s*(.*)$/);
    if (!kv) continue;
    const key = kv[1].trim();
    const val = kv[2].trim();
    switch (key) {
      case 'Name': info.name = val; break;
      case 'Alias': info.alias = val; break;
      case 'Class': info.class = val; break;
      case 'Icon': info.icon = val; break;
      case 'Paired': info.paired = val === 'yes'; break;
      case 'Bonded': info.bonded = val === 'yes'; break;
      case 'Trusted': info.trusted = val === 'yes'; break;
      case 'Blocked': info.blocked = val === 'yes'; break;
      case 'Connected': info.connected = val === 'yes'; break;
      case 'LegacyPairing': info.legacyPairing = val === 'yes'; break;
      case 'RSSI': info.rssi = Number(val); break;
      case 'TxPower': info.txPower = Number(val); break;
      case 'Battery Percentage': info.battery = val; break;
      case 'Modalias': info.modalias = val; break;
      case 'Appearance': info.appearance = val; break;
      default: break;
    }
  }
  // The class-of-device byte says what KIND of thing it is, which is more
  // useful to a person than the raw hex.
  if (info.icon) info.kind = btKindFromIcon(info.icon);
  return info;
}
function btKindFromIcon(icon) {
  const map = {
    'audio-card': 'اسپیکر یا هدفون', 'audio-headset': 'هدست', 'audio-headphones': 'هدفون',
    'input-keyboard': 'کیبورد', 'input-mouse': 'موس', 'input-gaming': 'دسته‌ی بازی',
    phone: 'موبایل', computer: 'کامپیوتر', printer: 'چاپگر', camera: 'دوربین',
    'video-display': 'نمایشگر', watch: 'ساعت هوشمند', 'network-wireless': 'دستگاه شبکه',
    scanner: 'اسکنر', 'multimedia-player': 'پخش‌کننده',
  };
  return map[icon] || icon;
}

function parseBtAdapters(text) {
  const out = [];
  for (const line of String(text).split(/\r?\n/)) {
    const m = line.match(/Controller\s+((?:[0-9A-F]{2}:){5}[0-9A-F]{2})\s*(.*?)(?:\s*\[default\])?\s*$/i);
    if (m) out.push({ mac: m[1].toLowerCase(), name: (m[2] || '').trim(), default: /\[default\]/.test(line) });
  }
  return out;
}

// Well-known GATT service UUIDs, so a characteristic list reads as something
// rather than as a wall of hex.
const GATT_NAMES = {
  '00001800': 'اطلاعات عمومی دستگاه', '00001801': 'تغییرات سرویس',
  '0000180a': 'اطلاعات سازنده و مدل', '0000180f': 'باتری',
  '0000180d': 'ضربان قلب', '00001802': 'هشدار فوری', '00001803': 'هشدار قطع ارتباط',
  '00001812': 'کیبورد/موس (HID)', '0000110b': 'پخش صدا', '0000111e': 'هندزفری',
  '00001105': 'انتقال فایل (OBEX)', '0000112f': 'دفترچه تلفن', '00001132': 'پیام',
  '0000fe59': 'به‌روزرسانی فریم‌ور (Nordic DFU)',
  '00002a00': 'نام دستگاه', '00002a01': 'ظاهر', '00002a19': 'درصد باتری',
  '00002a24': 'شماره مدل', '00002a25': 'شماره سریال', '00002a26': 'نسخه فریم‌ور',
  '00002a27': 'نسخه سخت‌افزار', '00002a28': 'نسخه نرم‌افزار', '00002a29': 'سازنده',
};
function gattLabel(uuid) {
  const u = String(uuid || '').toLowerCase();
  return GATT_NAMES[u.slice(0, 8)] || '';
}

// `bluetoothctl gatt.list-attributes` prints a path then its UUID on the next
// line, so the parser has to remember the path it just saw.
function parseGattAttributes(text) {
  const out = [];
  let pending = null;
  for (const raw of String(text).split(/\r?\n/)) {
    const line = raw.trim();
    const p = line.match(/^(?:Primary Service|Characteristic|Descriptor)?\s*(\/org\/bluez\/\S+)$/);
    if (p) { pending = { path: p[1] }; continue; }
    const u = line.match(/^([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})$/i);
    if (u && pending) {
      const kind = /char/.test(pending.path) ? (/desc/.test(pending.path) ? 'descriptor' : 'characteristic') : 'service';
      out.push({ path: pending.path, uuid: u[1].toLowerCase(), kind, label: gattLabel(u[1]) });
      pending = null;
    }
  }
  return out;
}

// `bluetoothctl gatt.read` prints the value as space-separated hex.
function parseGattValue(text) {
  const hex = [];
  for (const line of String(text).split(/\r?\n/)) {
    const m = line.match(/^\s*[0-9a-f]{2}:?\s+((?:[0-9a-f]{2}\s+){1,16})/i);
    if (m) hex.push(...m[1].trim().split(/\s+/));
  }
  if (!hex.length) return null;
  const buf = Buffer.from(hex.join(''), 'hex');
  const text8 = buf.toString('utf8');
  return {
    hex: buf.toString('hex'),
    bytes: buf.length,
    // Most of the interesting characteristics (model, serial, firmware) are
    // plain strings, so show that when it is readable.
    text: /^[\x20-\x7e\s]*$/.test(text8) ? text8.trim() : '',
    number: buf.length === 1 ? buf[0] : (buf.length === 2 ? buf.readUInt16LE(0) : null),
  };
}

// ---- the Bluetooth operations ---------------------------------------------
async function btSupport() {
  if (IS_WIN) return { ok: true, backend: 'windows', note: '' };
  if (IS_MAC) {
    return { ok: have('blueutil'), backend: 'macos',
      note: have('blueutil') ? '' : 'برای جفت‌کردن روی مک به blueutil نیاز است (brew install blueutil). فهرست دستگاه‌ها بدون آن هم کار می‌کند.' };
  }
  return { ok: have('bluetoothctl'), backend: 'bluez',
    note: have('bluetoothctl') ? '' : 'بلوتوث نیاز به bluez دارد (sudo apt install bluez).' };
}

async function btAdapters() {
  const sup = await btSupport();
  if (IS_WIN) {
    const r = await ps("Get-PnpDevice -Class Bluetooth -PresentOnly | Where-Object {$_.FriendlyName -notlike '*Enumerator*'} | "
      + 'Select-Object FriendlyName,Manufacturer,Status,InstanceId | ConvertTo-Json -Compress');
    let rows = [];
    try { rows = JSON.parse(r.out || '[]'); } catch (e) { rows = []; }
    if (!Array.isArray(rows)) rows = [rows];
    const adapters = rows.filter((x) => x && /radio|adapter|bluetooth/i.test(String(x.FriendlyName)) && !/BTHENUM/i.test(String(x.InstanceId)));
    return { supported: true, adapters: adapters.map((a) => ({ name: a.FriendlyName, vendor: a.Manufacturer, status: a.Status })), note: sup.note };
  }
  if (!sup.ok) return { supported: false, adapters: [], note: sup.note };
  const r = await bluetoothctl(['list'], 1500);
  return { supported: true, adapters: parseBtAdapters(r.out), note: '' };
}

// Paired devices, plus whatever is advertising right now if asked to look.
async function btDevices(opts) {
  opts = opts || {};
  const sup = await btSupport();
  if (IS_WIN) {
    const r = await ps("Get-PnpDevice -PresentOnly | Where-Object {$_.InstanceId -like 'BTH*'} | "
      + 'Select-Object FriendlyName,Manufacturer,Class,Service,Status,InstanceId | ConvertTo-Json -Compress');
    let rows = [];
    try { rows = JSON.parse(r.out || '[]'); } catch (e) { rows = []; }
    if (!Array.isArray(rows)) rows = [rows];
    // Windows lists one row per PROFILE, not per device — see the long note in
    // discover.js. Grouping by the Bluetooth address turns seventy rows back
    // into the three things that are actually in the room, and the profiles
    // become what they really are: that device's list of abilities.
    const grouped = discover.groupWindowsBluetooth(rows);
    return { supported: true, devices: grouped.devices, scanned: false,
      rawRows: rows.length,
      note: 'ویندوز فقط دستگاه‌های جفت‌شده را نشان می‌دهد. برای جفت کردن یک دستگاه تازه، '
        + 'تنظیمات بلوتوث ویندوز را باز کن — تأیید جفت‌سازی کاری است که باید خودِ آدم انجام بدهد.' };
  }
  if (!sup.ok) return { supported: false, devices: [], note: sup.note };

  const script = ['power on', 'devices'];
  let waitMs = 1800;
  if (opts.scan) {
    // Looking around is passive: we listen to what devices are broadcasting
    // anyway. Nothing is contacted and nothing is paired.
    script.push('scan on');
    waitMs = Math.max(3000, Math.min(20000, Number(opts.seconds || 6) * 1000));
  }
  const r = await bluetoothctl(script, waitMs);
  if (opts.scan) await bluetoothctl(['scan off'], 600);
  const list = parseBtDevices(r.out);
  // Fill in paired/connected state per device.
  for (const d of list.slice(0, 40)) {
    const info = await bluetoothctl(['info ' + d.mac], 900);
    Object.assign(d, parseBtInfo(info.out));
  }
  return { supported: true, devices: list, scanned: !!opts.scan, note: '' };
}

async function btInfo(mac) {
  const sup = await btSupport();
  if (!/^([0-9a-f]{2}:){5}[0-9a-f]{2}$/i.test(String(mac || ''))) {
    return { error: 'آدرس بلوتوث معتبر نیست.' };
  }
  if (IS_WIN) {
    const r = await ps(`Get-PnpDevice -PresentOnly | Where-Object {$_.InstanceId -like '*${String(mac).replace(/:/g, '')}*'} | `
      + 'Select-Object FriendlyName,Manufacturer,Class,Service,Status,InstanceId | ConvertTo-Json -Compress');
    let rows = [];
    try { rows = JSON.parse(r.out || '[]'); } catch (e) { rows = []; }
    if (!Array.isArray(rows)) rows = [rows];
    return { mac, windows: rows, profiles: rows.map((x) => x && x.FriendlyName).filter(Boolean) };
  }
  if (!sup.ok) return { error: sup.note };
  const r = await bluetoothctl(['info ' + mac], 1200);
  const info = parseBtInfo(r.out);
  if (!info.name && !info.uuids.length) return { error: 'این دستگاه پیدا نشد. یک بار «گشتن» را بزن.' };
  return Object.assign({ mac }, info, {
    services: info.uuids.map((u) => ({ uuid: u.uuid, name: u.name, label: gattLabel(u.uuid) })),
  });
}

// Pair / connect / trust / disconnect / forget. Each one is a request to the
// operating system, which is what makes the DEVICE ask its owner to confirm.
async function btAction(mac, action) {
  if (!/^([0-9a-f]{2}:){5}[0-9a-f]{2}$/i.test(String(mac || ''))) {
    return { ok: false, error: 'آدرس بلوتوث معتبر نیست.' };
  }
  const sup = await btSupport();
  if (IS_WIN) {
    return { ok: false, manual: true,
      error: 'روی ویندوز جفت‌سازی باید از خود تنظیمات بلوتوث ویندوز انجام شود — '
        + 'این عمداً است: تأیید جفت‌سازی کاری است که باید خودِ آدم انجام بدهد. '
        + 'بعد از جفت شدن، ستایش دستگاه را می‌بیند و اطلاعاتش را می‌خواند.' };
  }
  if (!sup.ok) return { ok: false, error: sup.note };

  const MAP = {
    pair: ['power on', 'agent on', 'default-agent', 'pair ' + mac],
    trust: ['trust ' + mac],
    connect: ['connect ' + mac],
    disconnect: ['disconnect ' + mac],
    forget: ['remove ' + mac],
  };
  const script = MAP[String(action)];
  if (!script) return { ok: false, error: 'دستور شناخته نشد: ' + action };
  const r = await bluetoothctl(script, action === 'pair' ? 12000 : 5000);
  const text = r.out;
  const good = /Pairing successful|Connection successful|Device has been removed|trust succeeded|Changing .* succeeded/i.test(text);
  const failed = text.match(/Failed to [a-z]+:?\s*(.*)/i);
  return {
    ok: good && !failed,
    action, mac,
    detail: failed ? failed[1].trim() : (good ? '' : 'جواب روشنی نداد'),
    output: text.split('\n').filter((l) => l.trim()).slice(-8).join('\n'),
    hint: action === 'pair' && !good
      ? 'دستگاه باید در حالت جفت‌شدن باشد (معمولاً نگه‌داشتن دکمه تا چشمک زدن چراغ). '
        + 'اگر کد می‌خواهد، روی خود دستگاه تأییدش کن — ستایش کد را حدس نمی‌زند.'
      : '',
  };
}

// GATT: what the device exposes, then read one value, then write one.
async function gattList(mac) {
  const sup = await btSupport();
  if (!sup.ok) return { error: sup.note || 'GATT روی این سیستم در دسترس نیست.' };
  if (IS_WIN || IS_MAC) {
    return { error: 'خواندن مستقیم GATT فعلاً فقط روی لینوکس (bluez) کار می‌کند. '
      + 'روی ویندوز اطلاعات کلی دستگاه را می‌دهم ولی نه مقدار تک‌تک مشخصه‌ها.' };
  }
  const r = await bluetoothctl(['connect ' + mac, 'menu gatt', 'list-attributes'], 6000);
  const attrs = parseGattAttributes(r.out);
  return { mac, count: attrs.length, attributes: attrs,
    note: attrs.length ? '' : 'چیزی برنگشت — دستگاه باید وصل باشد و GATT داشته باشد (دستگاه‌های BLE).' };
}

async function gattRead(mac, attrPath) {
  const sup = await btSupport();
  if (!sup.ok || IS_WIN || IS_MAC) return { error: 'خواندن GATT فقط روی لینوکس (bluez).' };
  if (!/^\/org\/bluez\/[\w/]+$/.test(String(attrPath || ''))) return { error: 'مسیر مشخصه معتبر نیست.' };
  const r = await bluetoothctl(['connect ' + mac, 'menu gatt', 'select-attribute ' + attrPath, 'read'], 5000);
  const val = parseGattValue(r.out);
  if (!val) return { error: 'مقداری خوانده نشد (شاید این مشخصه خواندنی نیست).' };
  return Object.assign({ mac, path: attrPath }, val);
}

async function gattWrite(mac, attrPath, hex) {
  const sup = await btSupport();
  if (!sup.ok || IS_WIN || IS_MAC) return { error: 'نوشتن GATT فقط روی لینوکس (bluez).' };
  if (!/^\/org\/bluez\/[\w/]+$/.test(String(attrPath || ''))) return { error: 'مسیر مشخصه معتبر نیست.' };
  const clean = String(hex || '').replace(/[^0-9a-f]/gi, '');
  if (!clean || clean.length % 2) return { error: 'مقدار باید هگز باشد، مثل 01 یا 0a1b.' };
  if (clean.length > 1024) return { error: 'مقدار خیلی بلند است.' };
  const bytes = clean.match(/../g).join(' ');
  const r = await bluetoothctl(
    ['connect ' + mac, 'menu gatt', 'select-attribute ' + attrPath, 'write "' + bytes + '"'], 5000);
  const failed = /Failed to write|Invalid|not permitted/i.test(r.out);
  return { ok: !failed, mac, path: attrPath, wrote: clean,
    output: r.out.split('\n').filter((l) => l.trim()).slice(-6).join('\n') };
}

// ---------------------------------------------------------------------------
// Cable: USB in full detail
// ---------------------------------------------------------------------------
// The point of this one is "nothing unknown": every field the system will give
// us about a plugged-in device, not just its name.
function parseSysfsDetail(dir, read) {
  const get = (f) => { try { return (read(path.join(dir, f)) || '').trim(); } catch (e) { return ''; } };
  const vid = get('idVendor'), pid = get('idProduct');
  if (!vid && !pid) return null;
  const cls = get('bDeviceClass');
  return {
    port: path.basename(dir),
    vendorId: vid, productId: pid,
    id: vid && pid ? vid + ':' + pid : '',
    product: get('product'), manufacturer: get('manufacturer'), serial: get('serial'),
    usbClass: cls, usbSubClass: get('bDeviceSubClass'), usbProtocol: get('bDeviceProtocol'),
    usbVersion: get('version'), speed: get('speed') ? get('speed') + ' Mb/s' : '',
    maxPower: get('bMaxPower'), configurations: get('bNumConfigurations'),
    interfaces: get('bNumInterfaces'),
    busnum: get('busnum'), devnum: get('devnum'),
    removable: get('removable'),
    authorized: get('authorized') === '1',
  };
}

// A USB tree is mostly plumbing: root hubs, generic hubs, "Standard system
// devices". They are real and worth being able to look at, but they are not
// what a person means by "what is plugged in", so they get marked rather than
// hidden — the interface can fold them away and still let you open them.
const USB_PLUMBING = /root hub|generic (superspeed )?usb hub|usb hub|composite device|host controller|usb input device|standard system|billboard/i;
function markPlumbing(list) {
  for (const d of list) {
    const text = [d.name, d.product, d.manufacturer, d.busDescription].filter(Boolean).join(' ');
    d.plumbing = USB_PLUMBING.test(text) || d.usbClass === '09';
  }
  return list;
}

async function usbDetailed() {
  if (IS_WIN) {
    // Get-PnpDeviceProperty gives the real descriptor fields Windows keeps —
    // driver, class GUID, location, power state, install date — which is what
    // "complete specifications" actually means on Windows.
    const script = `
$ErrorActionPreference='SilentlyContinue'
Get-PnpDevice -PresentOnly | Where-Object {$_.InstanceId -like 'USB*'} | ForEach-Object {
  $d=$_
  $p=@{}
  foreach($n in 'DEVPKEY_Device_BusReportedDeviceDesc','DEVPKEY_Device_DriverVersion','DEVPKEY_Device_DriverProvider','DEVPKEY_Device_LocationInfo','DEVPKEY_Device_Manufacturer','DEVPKEY_Device_Class','DEVPKEY_Device_FriendlyName','DEVPKEY_Device_DriverDate'){
    $v=(Get-PnpDeviceProperty -InstanceId $d.InstanceId -KeyName $n).Data
    if($v){$p[$n.Replace('DEVPKEY_Device_','')]="$v"}
  }
  [pscustomobject]@{
    Name=$d.FriendlyName; Class=$d.Class; Status=$d.Status; Service=$d.Service
    InstanceId=$d.InstanceId; Props=$p
  }
} | ConvertTo-Json -Depth 4 -Compress`;
    const r = await ps(script, 30000);
    let rows = [];
    try { rows = JSON.parse(r.out || '[]'); } catch (e) { rows = []; }
    if (!Array.isArray(rows)) rows = [rows];
    return markPlumbing(rows.filter(Boolean).map((x) => {
      const id = String(x.InstanceId || '');
      const p = x.Props || {};
      return {
        transport: 'usb',
        name: x.Name || p.BusReportedDeviceDesc || 'USB device',
        vendorId: ((id.match(/VID_([0-9A-F]{4})/i) || [])[1] || '').toLowerCase(),
        productId: ((id.match(/PID_([0-9A-F]{4})/i) || [])[1] || '').toLowerCase(),
        serial: (id.split('\\').pop() || '').split('&')[0],
        manufacturer: p.Manufacturer || '', usbClass: x.Class || p.Class || '',
        driver: x.Service || '', driverVersion: p.DriverVersion || '',
        driverProvider: p.DriverProvider || '', driverDate: p.DriverDate || '',
        location: p.LocationInfo || '', busDescription: p.BusReportedDeviceDesc || '',
        status: x.Status || '', instanceId: id,
      };
    }));
  }
  if (IS_MAC) {
    const r = await run('system_profiler', ['-json', 'SPUSBDataType'], 20000);
    let data = {};
    try { data = JSON.parse(r.out || '{}'); } catch (e) { data = {}; }
    const out = [];
    const walk = (nodes) => {
      for (const n of nodes || []) {
        if (n && n._name && (n.vendor_id || n.product_id)) {
          out.push({ transport: 'usb', name: n._name,
            vendorId: String(n.vendor_id || '').replace(/^0x/, '').split(' ')[0],
            productId: String(n.product_id || '').replace(/^0x/, '').split(' ')[0],
            serial: n.serial_num || '', manufacturer: n.manufacturer || '',
            speed: n.device_speed || '', maxPower: n.extra_current_used || '' });
        }
        for (const k of Object.keys(n || {})) if (Array.isArray(n[k])) walk(n[k]);
      }
    };
    walk(data.SPUSBDataType || []);
    return markPlumbing(out);
  }
  const base = '/sys/bus/usb/devices';
  const out = [];
  let names = [];
  try { names = fs.readdirSync(base); } catch (e) { return out; }
  for (const n of names) {
    if (/:/.test(n) || /^usb\d+$/.test(n)) continue;
    const d = parseSysfsDetail(path.join(base, n), (f) => (fs.existsSync(f) ? fs.readFileSync(f, 'utf8') : ''));
    if (d) out.push(Object.assign({ transport: 'usb', name: d.product || ('USB ' + d.id) }, d));
  }
  return markPlumbing(out);
}

// ---------------------------------------------------------------------------
// Cable: serial ports and a real two-way link
// ---------------------------------------------------------------------------
function parseWinSerial(json) {
  let rows = [];
  try { rows = JSON.parse(json || '[]'); } catch (e) { return []; }
  if (!Array.isArray(rows)) rows = [rows];
  return rows.filter(Boolean).map((x) => {
    const name = String(x.Name || x.Caption || '');
    const port = (name.match(/\((COM\d+)\)/) || [])[1] || String(x.DeviceID || '');
    return { port, name, vendor: x.Manufacturer || '', description: x.Description || '',
      instanceId: String(x.PNPDeviceID || x.DeviceID || '') };
  }).filter((x) => x.port);
}

async function serialPorts() {
  if (IS_WIN) {
    const r = await ps('Get-CimInstance Win32_PnPEntity | Where-Object {$_.Name -match "\\(COM\\d+\\)"} | '
      + 'Select-Object Name,Caption,Manufacturer,Description,PNPDeviceID,DeviceID | ConvertTo-Json -Compress', 20000);
    const ports = parseWinSerial(r.out);
    return { supported: true, ports, note: ports.length ? '' : 'هیچ پورت COM دیده نشد — کابل وصل است؟' };
  }
  const dirs = ['/dev'];
  const out = [];
  for (const d of dirs) {
    let names = [];
    try { names = fs.readdirSync(d); } catch (e) { continue; }
    for (const n of names) {
      // The device families that are actually a cable to something: USB
      // serial bridges, Arduino-style ACM devices, and macOS callout devices.
      if (!/^(ttyUSB\d+|ttyACM\d+|ttyS\d+|cu\.|tty\.usb)/.test(n)) continue;
      if (/^ttyS\d+$/.test(n) && !IS_MAC) {
        // Most ttyS* are legacy motherboard ports that do not exist; only list
        // one if it is real.
        try { if (!fs.statSync(path.join(d, n)).isCharacterDevice()) continue; } catch (e) { continue; }
      }
      out.push({ port: path.join(d, n), name: n });
    }
  }
  // Enrich from sysfs so a port says WHICH device it belongs to.
  for (const p of out) {
    try {
      const base = '/sys/class/tty/' + path.basename(p.port) + '/device';
      const real = fs.realpathSync(base);
      const up = fs.realpathSync(path.join(real, '..', '..'));
      const rd = (f) => { try { return fs.readFileSync(path.join(up, f), 'utf8').trim(); } catch (e) { return ''; } };
      p.vendor = rd('manufacturer');
      p.description = rd('product');
      p.serial = rd('serial');
      p.usbId = rd('idVendor') && rd('idProduct') ? rd('idVendor') + ':' + rd('idProduct') : '';
    } catch (e) { /* a plain port with no USB parent */ }
  }
  return { supported: true, ports: out,
    note: out.length ? '' : 'پورت سریالی پیدا نشد. کابل USB-to-Serial وصل است؟ (روی لینوکس معمولاً /dev/ttyUSB0)' };
}

// Only a port the system actually reported can be opened. Without this, a path
// from a chat message could point anywhere on disk.
async function assertKnownPort(port) {
  const list = await serialPorts();
  const hit = (list.ports || []).find((p) => p.port === port || p.name === port);
  if (!hit) throw new Error('این پورت در فهرست پورت‌های سیستم نیست: ' + port);
  return hit;
}

// A serial exchange: configure the line, write what was given, read what comes
// back for a moment, close. Short-lived on purpose — holding a port open across
// requests would block whatever else the household wants to use it for.
async function serialTalk(port, opts) {
  opts = opts || {};
  const baud = Math.max(300, Math.min(921600, Number(opts.baud) || 115200));
  const waitMs = Math.max(200, Math.min(15000, Number(opts.waitMs) || 1500));
  await assertKnownPort(port);

  const payload = opts.hex
    ? Buffer.from(String(opts.hex).replace(/[^0-9a-f]/gi, ''), 'hex')
    : Buffer.from(String(opts.send == null ? '' : opts.send) + (opts.newline === false ? '' : '\r\n'), 'utf8');

  if (IS_WIN) {
    // .NET's SerialPort is already on every Windows machine, so a real serial
    // conversation needs no dependency at all.
    const hex = payload.toString('hex');
    const script = `
$ErrorActionPreference='Stop'
$p = New-Object System.IO.Ports.SerialPort '${port}',${baud},'None',8,'One'
$p.ReadTimeout = ${waitMs}
$p.WriteTimeout = 2000
$p.Open()
if('${hex}'.Length -gt 0){
  $b = [byte[]]::new('${hex}'.Length/2)
  for($i=0;$i -lt $b.Length;$i++){ $b[$i]=[Convert]::ToByte('${hex}'.Substring($i*2,2),16) }
  $p.Write($b,0,$b.Length)
}
Start-Sleep -Milliseconds ${waitMs}
$n = $p.BytesToRead
$out = ''
if($n -gt 0){ $r=[byte[]]::new($n); $p.Read($r,0,$n) | Out-Null; $out=($r | ForEach-Object { $_.ToString('x2') }) -join '' }
$p.Close()
Write-Output $out`;
    const r = await ps(script, waitMs + 15000);
    if (!r.ok) return { ok: false, error: 'پورت باز نشد: ' + (r.err || '').split('\n')[0] };
    const hexOut = (r.out || '').trim().replace(/[^0-9a-f]/gi, '');
    return formatSerialReply(port, baud, payload, Buffer.from(hexOut, 'hex'));
  }

  // POSIX: stty configures the line, then the tty is just a file.
  const sttyArgs = IS_MAC ? ['-f', port] : ['-F', port];
  const cfg = await run('stty', [...sttyArgs, String(baud), 'cs8', '-cstopb', '-parenb', 'raw', '-echo', '-ixon'], 4000);
  if (!cfg.ok) return { ok: false, error: 'تنظیم پورت ناموفق بود: ' + (cfg.err || '').split('\n')[0] };

  return await new Promise((resolve) => {
    let fd;
    try { fd = fs.openSync(port, 'r+'); }
    catch (e) { return resolve({ ok: false, error: 'باز کردن پورت ناموفق: ' + e.message }); }
    try { if (payload.length) fs.writeSync(fd, payload); } catch (e) { /* write-only device */ }
    const chunks = [];
    const stream = fs.createReadStream('', { fd, autoClose: false });
    stream.on('data', (c) => chunks.push(c));
    stream.on('error', () => {});
    const timer = setTimeout(() => {
      try { stream.destroy(); } catch (e) {}
      try { fs.closeSync(fd); } catch (e) {}
      resolve(formatSerialReply(port, baud, payload, Buffer.concat(chunks)));
    }, waitMs);
    if (timer.unref) timer.unref();
  });
}

function formatSerialReply(port, baud, sent, got) {
  const text = got.toString('utf8');
  return {
    ok: true, port, baud,
    sentBytes: sent.length, sentHex: sent.toString('hex'),
    receivedBytes: got.length,
    hex: got.toString('hex').slice(0, 8000),
    // Most devices answer in plain text; show it when it is readable, and fall
    // back to hex when it is not, instead of printing control characters.
    text: /^[\x09\x0a\x0d\x20-\x7e]*$/.test(text) ? text : '',
    note: got.length ? '' : 'دستگاه چیزی نفرستاد. شاید سرعت (baud) فرق دارد یا منتظر دستور دیگری است.',
  };
}

// ---------------------------------------------------------------------------
// Watch: nothing gets plugged in unnoticed
// ---------------------------------------------------------------------------
let lastSnapshot = null;

function snapshotKey(d) {
  return [d.transport || 'usb', d.vendorId || '', d.productId || '', d.serial || '', d.port || '', d.mac || ''].join('|');
}

// Compare what is attached now with the last look and report the difference.
async function watch() {
  const [usb, serial, bt] = await Promise.all([
    usbDetailed().catch(() => []),
    serialPorts().then((r) => (r.ports || []).map((p) => Object.assign({ transport: 'serial' }, p))).catch(() => []),
    btDevices({}).then((r) => (r.devices || []).map((d) => Object.assign({ transport: 'bluetooth' }, d))).catch(() => []),
  ]);
  const now = [...usb, ...serial, ...bt];
  const nowKeys = new Map(now.map((d) => [snapshotKey(d), d]));

  if (!lastSnapshot) {
    lastSnapshot = nowKeys;
    return { first: true, attached: [], removed: [], total: now.length,
      note: 'اولین نگاه — از این به بعد هر چیزی که وصل یا جدا شود گزارش می‌شود.' };
  }
  const attached = [...nowKeys.entries()].filter(([k]) => !lastSnapshot.has(k)).map(([, d]) => d);
  const removed = [...lastSnapshot.entries()].filter(([k]) => !nowKeys.has(k)).map(([, d]) => d);
  lastSnapshot = nowKeys;
  return { first: false, attached, removed, total: now.length };
}

// ---------------------------------------------------------------------------
// Going INTO one device
// ---------------------------------------------------------------------------
// The list answers "what is there". This answers "what IS this, and what can I
// do with it" — every property the system will give up, plus the actions that
// actually apply to this particular thing. A row in a list with no way in is
// just a label; this is what makes each one a door.
async function deviceDetail(key) {
  const k = String(key || '');
  const all = await everything();

  // Bluetooth --------------------------------------------------------------
  if (/^bt:/.test(k) || /^([0-9a-f]{2}:){5}[0-9a-f]{2}$/i.test(k)) {
    const mac = k.replace(/^bt:/, '').toLowerCase();
    const listed = (all.bluetooth || []).find((d) => (d.mac || '').toLowerCase() === mac) || {};
    const deep = await btInfo(mac).catch(() => ({}));
    const info = Object.assign({}, listed, deep.error ? {} : deep);
    const actions = [];
    // Only offer what this device can really do.
    if (info.connected) actions.push({ id: 'disconnect', label: 'قطع کن', level: 2 });
    else actions.push({ id: 'connect', label: 'وصل شو', level: 2 });
    if (!info.paired) actions.push({ id: 'pair', label: 'جفت کن', level: 2 });
    else actions.push({ id: 'forget', label: 'فراموش کن', level: 2, confirm: true });
    if (!info.trusted) actions.push({ id: 'trust', label: 'مورد اعتماد کن', level: 2 });
    const caps = (listed.capabilities && listed.capabilities.list) || [];
    if (caps.includes('gatt') || (info.uuids || []).some((u) => /^0000(18|2a)/.test(u.uuid))) {
      actions.push({ id: 'gatt', label: 'مقدارهای داخلی', level: 1 });
    }
    for (const com of listed.serialPorts || []) {
      actions.push({ id: 'serial:' + com, label: 'کنسول سریال ' + com, level: 2 });
    }
    return {
      key: 'bt:' + mac, transport: 'bluetooth',
      title: info.name || info.alias || mac,
      subtitle: [info.kind, info.vendor, mac].filter(Boolean).join(' · '),
      properties: prettyProps([
        ['نام', info.name || info.alias], ['نوع', info.kind], ['سازنده', info.vendor],
        ['آدرس', mac], ['جفت‌شده', boolFa(info.paired)], ['وصل', boolFa(info.connected)],
        ['مورد اعتماد', boolFa(info.trusted)], ['مسدود', boolFa(info.blocked)],
        ['باتری', info.battery], ['سیگنال', info.rssi != null ? info.rssi + ' dBm' : ''],
        ['توان فرستنده', info.txPower != null ? info.txPower + ' dBm' : ''],
        ['کلاس', info.class], ['مدل داخلی', info.modalias], ['وضعیت', info.status],
        ['پورت سریال', (listed.serialPorts || []).join('، ')],
      ]),
      abilities: (listed.roles || []).concat(
        (info.uuids || []).map((u) => u.name).filter(Boolean)).filter((v, i, a) => a.indexOf(v) === i),
      profiles: listed.profiles || [],
      actions,
    };
  }

  // Serial port ------------------------------------------------------------
  if (/^(COM\d+|\/dev\/)/i.test(k)) {
    const sp = (all.serial || []).find((x) => x.port === k) || { port: k };
    return {
      key: sp.port, transport: 'serial',
      title: sp.port,
      subtitle: [sp.description, sp.vendor].filter(Boolean).join(' · '),
      properties: prettyProps([
        ['پورت', sp.port], ['نام', sp.name], ['توضیح', sp.description],
        ['سازنده', sp.vendor], ['شماره سریال', sp.serial], ['شناسه USB', sp.usbId],
        ['شناسه ویندوز', sp.instanceId],
      ]),
      abilities: ['گفتگوی دوطرفه (ارسال دستور و خواندن جواب)'],
      actions: [{ id: 'serial:' + sp.port, label: 'باز کن و حرف بزن', level: 2 }],
    };
  }

  // Drive ------------------------------------------------------------------
  if (/^drive:/.test(k)) {
    const dr = (all.drives || []).find((d) => d.id === k);
    if (dr) {
      return {
        key: k, transport: 'drive',
        title: dr.name || dr.device,
        subtitle: [dr.kind, dr.size, dr.fs].filter(Boolean).join(' · '),
        properties: prettyProps([
          ['نام', dr.name], ['مسیر', dr.device], ['نوع', dr.kind],
          ['سیستم فایل', dr.fs], ['اندازه', dr.size], ['فضای آزاد', dr.free],
          ['وصل‌شده در', dr.mounted], ['جداشدنی', boolFa(dr.removable)],
          ['سازنده', dr.vendor], ['شماره سریال', dr.serial],
        ]),
        abilities: dr.mounted ? ['خواندن فایل‌ها از ' + dr.mounted] : [],
        actions: [],
      };
    }
  }

  // USB --------------------------------------------------------------------
  // Keys are built from what a device IS, but the same device reached through
  // a different scan can present a slightly different identity string, so an
  // exact match is tried first and then the parts that really identify it.
  const usb = (all.usb || []).find((u) => usbKey(u) === k)
    || (all.usb || []).find((u) => u.instanceId && k.includes(u.instanceId))
    || (all.usb || []).find((u) => {
      const m = k.match(/^usb:([0-9a-f]{0,4}):([0-9a-f]{0,4}):(.*)$/i);
      if (!m || !m[1]) return false;
      return (u.vendorId || '').toLowerCase() === m[1].toLowerCase()
        && (u.productId || '').toLowerCase() === m[2].toLowerCase()
        && (!m[3] || (u.serial || '') === m[3] || (u.instanceId || '').includes(m[3]));
    });
  if (usb) {
    return {
      key: k, transport: 'usb',
      title: usb.name || usb.product || 'USB',
      subtitle: [usb.manufacturer, [usb.vendorId, usb.productId].filter(Boolean).join(':')].filter(Boolean).join(' · '),
      properties: prettyProps([
        ['نام', usb.name || usb.product], ['سازنده', usb.manufacturer],
        ['شناسه سازنده', usb.vendorId], ['شناسه محصول', usb.productId],
        ['شماره سریال', usb.serial], ['کلاس USB', usb.usbClass],
        ['زیرکلاس', usb.usbSubClass], ['پروتکل', usb.usbProtocol],
        ['نسخه USB', usb.usbVersion], ['سرعت', usb.speed],
        ['بیشترین مصرف', usb.maxPower], ['تعداد رابط', usb.interfaces],
        ['درایور', usb.driver], ['نسخه درایور', usb.driverVersion],
        ['سازنده درایور', usb.driverProvider], ['تاریخ درایور', usb.driverDate],
        ['محل روی پورت', usb.location], ['توضیح گذرگاه', usb.busDescription],
        ['وضعیت', usb.status], ['شناسه ویندوز', usb.instanceId],
        ['شناسه پورت', usb.port], ['گذرگاه/شماره', [usb.busnum, usb.devnum].filter(Boolean).join('/')],
      ]),
      abilities: usb.plumbing ? ['هاب/زیرساخت USB — خودش کاری نمی‌کند، چیزهای دیگر را وصل می‌کند.'] : [],
      actions: [],
      plumbing: !!usb.plumbing,
    };
  }
  return { error: 'این دستگاه در آخرین خواندن نبود. یک بار دوباره «بخوان» را بزن.' };
}

function boolFa(v) { return v === true ? 'بله' : (v === false ? 'خیر' : ''); }
function prettyProps(pairs) {
  return pairs.filter(([, v]) => v !== undefined && v !== null && String(v).trim() !== '')
    .map(([k, v]) => ({ key: k, value: String(v) }));
}
// A stable identity for a USB device across scans: what it IS, not where it
// happens to sit in the tree this time.
function usbKey(u) {
  return 'usb:' + [u.vendorId || '', u.productId || '', u.serial || u.instanceId || u.port || u.name || ''].join(':');
}

// Everything about everything, in one call — the "nothing unknown" answer.
async function everything() {
  const identify = (() => { try { return require('./identify'); } catch (e) { return null; } })();
  const [usb, serial, bt, adapters, drives] = await Promise.all([
    usbDetailed().catch(() => []),
    serialPorts().catch(() => ({ ports: [] })),
    btDevices({}).catch(() => ({ devices: [], supported: false })),
    btAdapters().catch(() => ({ adapters: [] })),
    discover.driveDevices().catch(() => []),
  ]);
  // Give every Bluetooth device its manufacturer from the full IEEE registry
  // too — a Bluetooth MAC comes out of the same allocation.
  if (identify) {
    for (const d of bt.devices || []) {
      if (d.mac && !d.vendor) d.vendor = identify.vendorOf(d.mac) || '';
    }
  }
  for (const u of usb) u.key = usbKey(u);
  for (const b of bt.devices || []) b.key = 'bt:' + (b.mac || b.id || '');
  for (const sp of serial.ports || []) sp.key = sp.port;
  for (const dr of drives) dr.key = dr.id;
  return {
    at: new Date().toISOString(),
    drives,
    usb, serial: serial.ports || [], serialNote: serial.note || '',
    bluetooth: bt.devices || [], bluetoothSupported: bt.supported !== false,
    bluetoothNote: bt.note || '', adapters: adapters.adapters || [],
    counts: { usb: usb.length, serial: (serial.ports || []).length,
              bluetooth: (bt.devices || []).length, drive: drives.length },
    platform: process.platform,
  };
}

module.exports = {
  btSupport, btAdapters, btDevices, btInfo, btAction,
  gattList, gattRead, gattWrite,
  usbDetailed, serialPorts, serialTalk, assertKnownPort,
  watch, everything, gattLabel, deviceDetail, usbKey, markPlumbing,
  // exported for tests
  parseBtDevices, parseBtInfo, parseBtAdapters, parseGattAttributes, parseGattValue,
  parseWinSerial, parseSysfsDetail, btKindFromIcon, formatSerialReply, snapshotKey,
  GATT_NAMES,
};
