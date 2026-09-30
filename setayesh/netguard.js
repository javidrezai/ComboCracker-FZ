'use strict';

// netguard.js — is this device safe, is this file safe, is this network safe,
// and how do we stay reachable and private when it is not.
//
//   assessDevice     risk score for something found on the network or a port
//   scanFile         heuristic check of a file for malicious code
//   networkStatus    what we are connected to, and whether it looks honest
//   wifiNetworks     what is in range (read-only)
//   connectWifi      join a network — only ever with an explicit yes
//   seal / unseal    X25519 + AES-256-GCM so a hostile network learns nothing
//
// TWO THINGS THIS IS NOT.
//
//   It is not an antivirus. The file scanner is heuristics — patterns that
//   malicious files usually have — so it will miss things a real engine
//   catches, and it will sometimes flag an installer that is perfectly fine.
//   Every result says so. Telling the household "clean" with the authority of
//   a scanner we do not have would be worse than useless.
//
//   It is not an attack tool. It reads: it lists what is in range, asks
//   devices what they are, and looks at files. It never guesses a password,
//   never tries to get onto a network it was not given the key for, and never
//   joins anything without the owner saying yes to that specific network.

const os = require('os');
const fs = require('fs');
const net = require('net');
const dns = require('dns');
const tls = require('tls');
const path = require('path');
const crypto = require('crypto');
const { execFile } = require('child_process');

const IS_WIN = process.platform === 'win32';
const IS_MAC = process.platform === 'darwin';

function run(cmd, args, timeoutMs) {
  return new Promise((resolve) => {
    let done = false;
    const finish = (ok, out, err) => { if (!done) { done = true; resolve({ ok, out: out || '', err: err || '' }); } };
    try {
      const child = execFile(cmd, args, { timeout: timeoutMs || 10000, maxBuffer: 4 << 20, windowsHide: true },
        (e, stdout, stderr) => finish(!e, stdout, e ? String(stderr || e.message) : ''));
      child.on('error', (e) => finish(false, '', String(e.message)));
    } catch (e) { finish(false, '', String(e.message)); }
  });
}

// ---------------------------------------------------------------------------
// 1. Is this device dangerous?
// ---------------------------------------------------------------------------
// Ports that should simply not be open to a home LAN in 2026. Each carries the
// reason, because "port 23 open" means nothing to the person reading it and
// "anyone on your Wi-Fi can log into this with no encryption" means everything.
const RISKY_PORTS = {
  23:   { risk: 'high',   what: 'Telnet', why: 'ورود بدون هیچ رمزنگاری — هر کسی روی همین وای‌فای می‌تواند رمز را بخواند.' },
  21:   { risk: 'medium', what: 'FTP', why: 'انتقال فایل بدون رمزنگاری.' },
  445:  { risk: 'high',   what: 'SMB', why: 'اشتراک فایل ویندوز؛ هدف اصلی باج‌افزارها است.' },
  139:  { risk: 'medium', what: 'NetBIOS', why: 'اشتراک قدیمی ویندوز.' },
  3389: { risk: 'high',   what: 'ریموت دسکتاپ', why: 'کنترل کامل کامپیوتر از راه دور.' },
  5900: { risk: 'high',   what: 'VNC', why: 'کنترل صفحه از راه دور، اغلب بدون رمز.' },
  1900: { risk: 'low',    what: 'UPnP', why: 'طبیعی برای تلویزیون و روتر.' },
  111:  { risk: 'medium', what: 'RPC', why: 'سرویس قدیمی که معمولاً لازم نیست باز باشد.' },
  2323: { risk: 'high',   what: 'Telnet جایگزین', why: 'پورت محبوب بات‌نت‌های اینترنت اشیا (Mirai).' },
  6668: { risk: 'low',    what: 'Tuya', why: 'کنترل محلی وسایل هوشمند Tuya/LSC.' },
  22:   { risk: 'low',    what: 'SSH', why: 'ورود امن — اگر عمداً روشن است ایرادی ندارد.' },
};

// A camera or a microphone on the network that nobody recognises is a
// different kind of problem from a printer nobody recognises.
const SENSITIVE_ROLE = /camera|webcam|دوربین|microphone|میکروفون|doorbell|baby/i;

function assessDevice(device, opts) {
  opts = opts || {};
  const known = opts.known || [];          // ids the household has already accepted
  const reasons = [];
  let score = 0;

  const openPorts = device.openPorts || device.ports || [];
  for (const p of openPorts) {
    const info = RISKY_PORTS[Number(p)];
    if (!info) continue;
    const add = info.risk === 'high' ? 35 : (info.risk === 'medium' ? 18 : 2);
    score += add;
    if (info.risk !== 'low') {
      reasons.push({ level: info.risk, text: `پورت ${p} (${info.what}) باز است — ${info.why}` });
    }
  }

  // A MAC that is not from any real manufacturer block is either a phone using
  // a privacy address (normal, and worth explaining) or something hiding.
  if (device.randomMac) {
    score += 8;
    reasons.push({ level: 'info',
      text: 'آدرس سخت‌افزاری این دستگاه تصادفی است. برای موبایل‌های امروزی طبیعی است (حریم خصوصی)، ولی یعنی نمی‌شود مطمئن شد سازنده‌اش کیست.' });
  }

  const firstSeen = !known.includes(device.id);
  if (firstSeen && opts.haveBaseline) {
    score += 12;
    reasons.push({ level: 'medium', text: 'این دستگاه قبلاً در خانه دیده نشده بود.' });
  }

  if (!device.vendor && device.transport === 'network' && (device.services || []).length) {
    score += 6;
    reasons.push({ level: 'info', text: 'سازنده‌اش شناخته نشد ولی روی شبکه سرویس ارائه می‌دهد.' });
  }

  const roleText = [device.kind, ...(device.roles || []), device.name].join(' ');
  if (SENSITIVE_ROLE.test(roleText)) {
    score += firstSeen ? 25 : 5;
    reasons.push({ level: firstSeen ? 'high' : 'info',
      text: 'این دستگاه دوربین یا میکروفون دارد' + (firstSeen ? ' و ناشناس است — حتماً بررسی کن.' : '.') });
  }

  // Two devices claiming the same address, or one MAC on two addresses, is the
  // signature of ARP spoofing — someone putting themselves in the middle.
  if (device.duplicateAddress) {
    score += 50;
    reasons.push({ level: 'high', text: 'دو دستگاه با یک آدرس IP دیده شدند — نشانه‌ی جعل ARP و شنود در میانه.' });
  }
  if (device.macOnManyIps) {
    score += 30;
    reasons.push({ level: 'high', text: 'یک دستگاه خودش را جای چند آدرس جا زده — نشانه‌ی حمله‌ی میانی.' });
  }

  // Old, unpatched firmware announced in the SSDP SERVER header.
  const sw = String(device.software || '');
  const oldLinux = sw.match(/Linux\/(2|3)\.\d+/);
  if (oldLinux) {
    score += 10;
    reasons.push({ level: 'medium', text: `نرم‌افزار داخلی‌اش قدیمی است (${oldLinux[0]}) — احتمالاً وصله‌ی امنیتی نمی‌گیرد.` });
  }

  const level = score >= 45 ? 'high' : (score >= 20 ? 'medium' : (score >= 8 ? 'low' : 'ok'));
  return {
    id: device.id, name: device.name, score,
    level,
    summary: level === 'ok' ? 'مشکلی دیده نشد.'
      : level === 'low' ? 'چیز خاصی نیست، ولی یک نکته هست.'
      : level === 'medium' ? 'ارزش نگاه کردن دارد.'
      : 'این را جدی بگیر.',
    reasons,
    advice: adviceFor(level, reasons),
  };
}
function adviceFor(level, reasons) {
  if (level === 'ok') return '';
  const tips = [];
  if (reasons.some((r) => /Telnet|SMB|ریموت|VNC/.test(r.text))) {
    tips.push('در تنظیمات خود دستگاه آن سرویس را خاموش کن، یا دستگاه را روی شبکه‌ی مهمان بگذار.');
  }
  if (reasons.some((r) => /دوربین|میکروفون/.test(r.text))) {
    tips.push('اگر این دستگاه مال خانه نیست، همین حالا از روتر مسدودش کن و رمز وای‌فای را عوض کن.');
  }
  if (reasons.some((r) => /جعل ARP|میانی/.test(r.text))) {
    tips.push('تا روشن شدن ماجرا از این شبکه کار حساس (بانک، ایمیل) انجام نده.');
  }
  if (reasons.some((r) => /قدیمی/.test(r.text))) tips.push('دنبال به‌روزرسانی فریم‌ور دستگاه بگرد.');
  return tips.join(' ');
}

// Cross-check a whole scan for the patterns that only show up between devices.
function assessScan(devices, opts) {
  opts = opts || {};
  const byAddress = new Map(), byMac = new Map();
  const push = (map, key, value) => {
    if (!key) return;
    if (!map.has(key)) map.set(key, []);
    map.get(key).push(value);
  };
  for (const d of devices) { push(byAddress, d.address, d); push(byMac, d.mac, d); }
  for (const [addr, list] of byAddress) {
    const macs = new Set(list.map((d) => d.mac).filter(Boolean));
    if (macs.size > 1) list.forEach((d) => { d.duplicateAddress = true; });
  }
  for (const [mac, list] of byMac) {
    const addrs = new Set(list.map((d) => d.address).filter(Boolean));
    if (addrs.size > 2) list.forEach((d) => { d.macOnManyIps = true; });
  }
  const findings = devices.map((d) => assessDevice(d, opts));
  const worst = findings.reduce((a, b) => (b.score > a.score ? b : a), findings[0] || { level: 'ok', score: 0 });
  return {
    checked: devices.length,
    high: findings.filter((f) => f.level === 'high').length,
    medium: findings.filter((f) => f.level === 'medium').length,
    worst: worst && worst.level !== 'ok' ? worst : null,
    findings: findings.filter((f) => f.level !== 'ok'),
    note: 'این بررسی بر پایه‌ی نشانه‌هاست، نه آنتی‌ویروس. چیزی که اینجا تمیز است لزوماً امن نیست.',
  };
}

// ---------------------------------------------------------------------------
// 2. Is this FILE dangerous?
// ---------------------------------------------------------------------------
// Patterns that malicious scripts and documents keep using. Each one alone can
// appear in innocent code, which is exactly why they are weighted and reported
// with the matching line rather than used as a verdict.
const CODE_SIGNS = [
  [/powershell(\.exe)?\s+[^\n]*-e(nc|ncodedcommand)\b/i, 40, 'دستور PowerShell پنهان‌شده با Base64'],
  [/(?:curl|wget)\s+[^\n|]*\|\s*(?:ba)?sh\b/i, 40, 'دانلود از اینترنت و اجرای مستقیم آن'],
  [/Invoke-Expression|IEX\s*\(/i, 25, 'اجرای متن به‌عنوان دستور (Invoke-Expression)'],
  [/New-Object\s+Net\.WebClient[^\n]*DownloadString/i, 35, 'دانلود و اجرای کد از راه دور'],
  [/eval\s*\(\s*(?:atob|base64_decode|Buffer\.from)/i, 35, 'اجرای کد رمزگذاری‌شده'],
  [/\bnc\b[^\n]*\s-e\s+\/bin\/(ba)?sh/i, 45, 'شل معکوس (reverse shell)'],
  [/socket\.socket\([^\n]*\)[\s\S]{0,200}subprocess\.(call|Popen)/i, 40, 'شل معکوس پایتونی'],
  [/\/dev\/tcp\/\d+\.\d+\.\d+\.\d+\//, 40, 'اتصال خام به یک آدرس اینترنتی از داخل اسکریپت'],
  [/(?:vssadmin|wbadmin)[^\n]*delete[^\n]*(?:shadows|catalog)/i, 50, 'پاک کردن نسخه‌های پشتیبان ویندوز — کار باج‌افزار'],
  [/bcdedit[^\n]*(?:recoveryenabled\s+no|bootstatuspolicy\s+ignoreallfailures)/i, 45, 'از کار انداختن بازیابی ویندوز — کار باج‌افزار'],
  [/cipher\s+\/w|\bshred\b[^\n]*-u/i, 20, 'پاک کردن غیرقابل‌بازگشت فایل'],
  [/schtasks[^\n]*\/create|crontab\s+-|\bsystemctl\s+enable\b/i, 12, 'ماندگار کردن خودش روی سیستم'],
  [/reg(\.exe)?\s+add[^\n]*\\(?:Run|RunOnce)\b/i, 30, 'اجرای خودکار در هر بار روشن شدن ویندوز'],
  [/AutoOpen|Document_Open|Workbook_Open|Auto_Open/i, 30, 'ماکرویی که خودش هنگام باز شدن سند اجرا می‌شود'],
  [/Shell\s*\(|WScript\.Shell|CreateObject\s*\(\s*["']WScript/i, 30, 'اجرای برنامه از داخل سند Office'],
  [/-nop\b[^\n]*-w\s+hidden|-WindowStyle\s+Hidden/i, 30, 'اجرای پنهان بدون نمایش پنجره'],
  [/(?:chmod|attrib)\s+\+?[sx][^\n]*\$(?:TMP|HOME)|\+h\s/i, 10, 'مخفی یا اجرایی کردن فایل'],
  [/\bmimikatz\b|\bsekurlsa\b|lsass\.dmp/i, 55, 'ابزار سرقت رمز ویندوز'],
  [/(?:BEGIN|END)\s+RSA\s+PRIVATE\s+KEY/i, 15, 'کلید خصوصی داخل فایل'],
  [/onion\b[^\n]{0,40}(?:bitcoin|monero|wallet)|bc1[a-z0-9]{25,}/i, 30, 'آدرس پرداخت باج'],
];

const DANGEROUS_EXT = {
  exe: 'برنامه‌ی اجرایی ویندوز', scr: 'اسکرین‌سیور — در واقع برنامه‌ی اجرایی',
  bat: 'اسکریپت ویندوز', cmd: 'اسکریپت ویندوز', com: 'برنامه‌ی قدیمی DOS',
  ps1: 'اسکریپت PowerShell', vbs: 'اسکریپت VBScript', js: 'اسکریپت (اگر تنهاست و از ایمیل آمده مشکوک است)',
  jar: 'برنامه‌ی جاوا', msi: 'نصب‌کننده‌ی ویندوز', hta: 'برنامه‌ی HTML ویندوز',
  lnk: 'میان‌بر — می‌تواند دستور پنهان اجرا کند', reg: 'تغییر رجیستری ویندوز',
  docm: 'سند Word با ماکرو', xlsm: 'اکسل با ماکرو', pptm: 'پاورپوینت با ماکرو',
  dll: 'کتابخانه‌ی ویندوز', sh: 'اسکریپت لینوکس/مک', apk: 'برنامه‌ی اندروید',
};

function magicOf(buf) {
  if (buf.length >= 2 && buf[0] === 0x4d && buf[1] === 0x5a) return 'PE (ویندوز)';
  if (buf.length >= 4 && buf[0] === 0x7f && buf.slice(1, 4).toString('latin1') === 'ELF') return 'ELF (لینوکس)';
  if (buf.length >= 4) {
    const m = buf.readUInt32BE(0);
    if ([0xfeedface, 0xfeedfacf, 0xcafebabe].includes(m) || [0xcefaedfe, 0xcffaedfe].includes(buf.readUInt32LE(0))) return 'Mach-O (مک)';
  }
  if (buf.slice(0, 2).toString('latin1') === 'PK') return 'ZIP (شاید Office یا jar)';
  if (buf.slice(0, 4).toString('latin1') === '%PDF') return 'PDF';
  return '';
}
function entropy(buf) {
  if (!buf.length) return 0;
  const c = new Uint32Array(256);
  for (const b of buf) c[b]++;
  let h = 0;
  for (const n of c) if (n) { const p = n / buf.length; h -= p * Math.log2(p); }
  return Math.round(h * 100) / 100;
}

// Reads at most the first and last few MB — enough for the signs above, and
// bounded so scanning a 4 GB file is still instant.
function scanFile(filePath, opts) {
  opts = opts || {};
  const full = path.resolve(String(filePath || '').replace(/^~(?=[\\/]|$)/, os.homedir()));
  const st = fs.statSync(full);
  if (st.isDirectory()) throw new Error('این یک پوشه است، نه فایل.');
  const ext = (full.toLowerCase().match(/\.([a-z0-9]+)$/) || [])[1] || '';
  const findings = [];
  let score = 0;

  const fd = fs.openSync(full, 'r');
  let headBuf, tailBuf;
  try {
    const take = Math.min(st.size, 4 * 1024 * 1024);
    headBuf = Buffer.alloc(take);
    fs.readSync(fd, headBuf, 0, take, 0);
    const tailStart = Math.max(take, st.size - 1024 * 1024);
    const tailLen = Math.max(0, Math.min(1024 * 1024, st.size - tailStart));
    tailBuf = Buffer.alloc(tailLen);
    if (tailLen) fs.readSync(fd, tailBuf, 0, tailLen, tailStart);
  } finally { fs.closeSync(fd); }

  const magic = magicOf(headBuf);
  const ent = entropy(headBuf.slice(0, 256 * 1024));

  if (DANGEROUS_EXT[ext]) {
    const weight = ['exe', 'scr', 'com', 'hta', 'lnk', 'msi', 'vbs', 'docm', 'xlsm', 'pptm'].includes(ext) ? 20 : 8;
    score += weight;
    findings.push({ level: weight >= 20 ? 'medium' : 'info',
      text: `پسوند ${ext}: ${DANGEROUS_EXT[ext]}.` });
  }
  // A file whose real type does not match its name is the oldest trick there
  // is — invoice.pdf.exe, or a "PDF" that is actually a Windows program.
  if (magic && ext) {
    const mismatch =
      (magic.startsWith('PE') && !['exe', 'dll', 'scr', 'com', 'msi', 'sys', 'ocx'].includes(ext)) ||
      (magic === 'PDF' && ext !== 'pdf') ||
      (magic.startsWith('ELF') && !['so', 'bin', 'o', 'elf', ''].includes(ext));
    if (mismatch) {
      score += 45;
      findings.push({ level: 'high',
        text: `نوع واقعی این فایل «${magic}» است ولی پسوندش .${ext} است — این جا زدن عمدی است.` });
    }
  }
  if (/\.(pdf|jpg|jpeg|png|docx?|xlsx?|txt)\.(exe|scr|bat|cmd|com|vbs|js|jar|ps1)$/i.test(path.basename(full))) {
    score += 50;
    findings.push({ level: 'high', text: 'اسم فایل دو پسوند دارد تا شبیه سند بی‌خطر به نظر برسد.' });
  }

  // Text-ish content: run the pattern list over it.
  const nonPrintable = headBuf.slice(0, 8192).filter((b) => b < 9 || (b > 13 && b < 32)).length;
  const looksText = headBuf.length ? nonPrintable / Math.min(8192, headBuf.length) < 0.05 : false;
  if (looksText || ['ps1', 'bat', 'cmd', 'sh', 'js', 'vbs', 'py', 'hta', 'reg'].includes(ext)) {
    const text = headBuf.toString('utf8') + '\n' + tailBuf.toString('utf8');
    for (const [re, weight, label] of CODE_SIGNS) {
      const m = text.match(re);
      if (!m) continue;
      score += weight;
      const line = text.slice(0, m.index).split('\n').length;
      findings.push({ level: weight >= 35 ? 'high' : (weight >= 20 ? 'medium' : 'info'),
        text: label, line, sample: String(m[0]).replace(/\s+/g, ' ').slice(0, 160) });
    }
    // A long unbroken base64 blob inside a script is how payloads travel.
    const b64 = text.match(/[A-Za-z0-9+/]{600,}={0,2}/);
    if (b64) {
      score += 20;
      findings.push({ level: 'medium', text: 'یک بلوک بسیار طولانی Base64 داخل اسکریپت — معمولاً محتوای پنهان‌شده است.',
        sample: b64[0].slice(0, 60) + '…' });
    }
  }

  // A macro-enabled Office file: look inside the ZIP for the macro part.
  if (['docm', 'xlsm', 'pptm', 'docx', 'xlsx', 'pptx'].includes(ext) && headBuf.slice(0, 2).toString('latin1') === 'PK') {
    try {
      const zipText = fs.readFileSync(full).toString('latin1');
      if (/vbaProject\.bin/.test(zipText)) {
        score += 30;
        findings.push({ level: 'medium', text: 'این سند ماکرو (VBA) دارد. اگر از کسی ناشناس آمده بازش نکن.' });
      }
      if (/oleObject|\.dll|cmd\.exe/i.test(zipText)) {
        score += 20;
        findings.push({ level: 'medium', text: 'داخل سند شیء جاسازی‌شده یا ارجاع به برنامه هست.' });
      }
    } catch (e) { /* too big to hold; the header findings still stand */ }
  }

  if (magic.startsWith('PE') && ent > 7.2) {
    score += 15;
    findings.push({ level: 'medium',
      text: `برنامه‌ی اجرایی با انتروپی ${ent} — یعنی فشرده یا مبهم‌سازی شده تا دیده نشود (packed).` });
  }

  const level = score >= 45 ? 'high' : (score >= 20 ? 'medium' : (score >= 8 ? 'low' : 'ok'));
  return {
    path: full, bytes: st.size, ext, realType: magic || 'متن/نامشخص', entropy: ent,
    score, level,
    verdict: level === 'ok' ? 'نشانه‌ی بدی پیدا نشد.'
      : level === 'low' ? 'یک نکته‌ی کوچک هست، احتمالاً بی‌خطر.'
      : level === 'medium' ? 'چند نشانه‌ی مشکوک دارد — بدون اطمینان بازش نکن.'
      : 'نشانه‌های جدی دارد. بازش نکن و اجرایش نکن.',
    findings,
    limitation: 'این آنتی‌ویروس نیست — بررسی بر پایه‌ی نشانه‌هاست. برای فایل مهم حتماً با یک آنتی‌ویروس واقعی هم چک کن.',
  };
}

// ---------------------------------------------------------------------------
// 3. What network are we on, and is it honest?
// ---------------------------------------------------------------------------
function interfaces() {
  const out = [];
  for (const [name, addrs] of Object.entries(os.networkInterfaces())) {
    for (const a of addrs || []) {
      if (a.internal) continue;
      out.push({ name, address: a.address, family: a.family, mac: a.mac, cidr: a.cidr });
    }
  }
  return out;
}

function tcpReachable(host, port, timeoutMs) {
  return new Promise((resolve) => {
    const started = Date.now();
    const sock = new net.Socket();
    const done = (ok) => { try { sock.destroy(); } catch (e) {} resolve({ ok, ms: Date.now() - started }); };
    sock.setTimeout(timeoutMs || 3000);
    sock.once('connect', () => done(true));
    sock.once('timeout', () => done(false));
    sock.once('error', () => done(false));
    try { sock.connect(port, host); } catch (e) { done(false); }
  });
}

// A captive portal (hotel, airport, café) answers a known "should be empty"
// URL with a login page instead. That is the reliable way to detect one.
function captivePortalCheck(timeoutMs) {
  return new Promise((resolve) => {
    const http = require('http');
    const req = http.get('http://connectivitycheck.gstatic.com/generate_204',
      { timeout: timeoutMs || 4000 }, (res) => {
        let body = '';
        res.on('data', (c) => { body += c.toString('latin1').slice(0, 2000); });
        res.on('end', () => {
          if (res.statusCode === 204 && !body.trim()) return resolve({ captive: false });
          resolve({ captive: true, status: res.statusCode,
            redirect: res.headers.location || '',
            note: 'این شبکه جلوی اینترنت یک صفحه‌ی ورود گذاشته است.' });
        });
      });
    req.on('error', () => resolve({ captive: false, offline: true }));
    req.on('timeout', () => { req.destroy(); resolve({ captive: false, offline: true }); });
  });
}

// If the certificate for a well-known site is not issued by a public CA, some
// box on this network is opening the traffic and re-signing it. On a corporate
// laptop that is expected; on a café Wi-Fi it means someone is reading.
function tlsInspection(host, timeoutMs) {
  return new Promise((resolve) => {
    let settled = false;
    const finish = (v) => { if (!settled) { settled = true; resolve(v); } };
    const sock = tls.connect({ host: host || 'www.google.com', port: 443, servername: host || 'www.google.com',
      timeout: timeoutMs || 5000, rejectUnauthorized: false }, () => {
      let cert = sock.getPeerCertificate(true);
      const chain = [];
      const seen = new Set();
      while (cert && cert.subject && !seen.has(cert.fingerprint256)) {
        seen.add(cert.fingerprint256);
        chain.push({ subject: cert.subject.CN || '', issuer: (cert.issuer && cert.issuer.CN) || '', o: (cert.issuer && cert.issuer.O) || '' });
        cert = cert.issuerCertificate === cert ? null : cert.issuerCertificate;
      }
      const rootIssuer = chain.length ? chain[chain.length - 1] : null;
      const authorized = sock.authorized;
      try { sock.end(); } catch (e) {}
      const knownPublic = /DigiCert|GlobalSign|Let's Encrypt|ISRG|Sectigo|Amazon|Google Trust|GTS|Entrust|Baltimore|USERTrust|Certum|Buypass/i;
      const inspected = !!(rootIssuer && !knownPublic.test(rootIssuer.o + ' ' + rootIssuer.issuer));
      finish({ ok: true, authorized, chain, inspected,
        note: inspected
          ? `گواهی این سایت را «${rootIssuer.issuer || rootIssuer.o}» امضا کرده، نه یک مرجع عمومی — یعنی چیزی روی این شبکه ترافیک را باز می‌کند و می‌خواند.`
          : '' });
    });
    sock.on('error', (e) => finish({ ok: false, error: e.message }));
    sock.on('timeout', () => { try { sock.destroy(); } catch (e) {} finish({ ok: false, error: 'timeout' }); });
  });
}

// Does DNS give the answer it should? A hijacked resolver sends you elsewhere.
function dnsCheck(timeoutMs) {
  return new Promise((resolve) => {
    const timer = setTimeout(() => resolve({ ok: false, error: 'timeout' }), timeoutMs || 4000);
    dns.resolve4('dns.google', (err, addrs) => {
      clearTimeout(timer);
      if (err) return resolve({ ok: false, error: err.code || err.message });
      const expected = ['8.8.8.8', '8.8.4.4'];
      const got = addrs || [];
      const hijacked = got.length > 0 && !got.some((a) => expected.includes(a));
      resolve({ ok: true, addresses: got, hijacked,
        note: hijacked ? 'پاسخ DNS این شبکه با جواب واقعی نمی‌خواند — ممکن است ترافیک را جای دیگری ببرد.' : '' });
    });
  });
}

async function networkStatus(opts) {
  opts = opts || {};
  const nics = interfaces();
  const [portal, dnsRes, inet] = await Promise.all([
    captivePortalCheck(4000),
    dnsCheck(4000),
    tcpReachable('1.1.1.1', 443, 3000),
  ]);
  const online = !!inet.ok && !portal.offline;
  let tlsRes = { ok: false, skipped: true };
  if (online && opts.deep !== false) tlsRes = await tlsInspection('www.google.com', 5000);

  const warnings = [];
  if (portal.captive) warnings.push({ level: 'medium', text: portal.note });
  if (dnsRes.hijacked) warnings.push({ level: 'high', text: dnsRes.note });
  if (tlsRes.inspected) warnings.push({ level: 'high', text: tlsRes.note });
  if (!online) warnings.push({ level: 'high', text: 'اینترنت در دسترس نیست.' });

  const trust = warnings.some((w) => w.level === 'high') ? 'untrusted'
    : warnings.length ? 'caution' : 'ok';

  return {
    checkedAt: new Date().toISOString(),
    online, latencyMs: inet.ms,
    interfaces: nics,
    captivePortal: portal.captive || false,
    dns: dnsRes,
    tls: tlsRes,
    trust,
    warnings,
    advice: trust === 'untrusted'
      ? 'روی این شبکه کار حساس (بانک، ایمیل، رمز) انجام نده. اگر مجبوری، از اتصال رمزنگاری‌شده‌ی خود ستایش استفاده کن.'
      : (trust === 'caution' ? 'شبکه کار می‌کند ولی کاملاً معمولی نیست — حواست باشد.' : ''),
  };
}

// ---------------------------------------------------------------------------
// 4. Emergency connectivity — find a way online, but never sneak onto one
// ---------------------------------------------------------------------------
function parseNmcliWifi(text) {
  const out = [];
  for (const line of String(text).split(/\r?\n/)) {
    if (!line.trim()) continue;
    const f = line.split(':');
    if (f.length < 4) continue;
    const ssid = f[0].trim();
    if (!ssid) continue;
    out.push({ ssid, signal: Number(f[1]) || 0, security: (f[2] || '').trim() || 'open',
      known: /yes/i.test(f[3] || ''), open: !(f[2] || '').trim() });
  }
  return out;
}
function parseNetshWifi(text) {
  const out = [];
  let cur = null;
  for (const line of String(text).split(/\r?\n/)) {
    const ssid = line.match(/^\s*SSID\s+\d+\s*:\s*(.*)$/i);
    if (ssid) { if (cur) out.push(cur); cur = { ssid: ssid[1].trim(), signal: 0, security: 'open', open: true }; continue; }
    if (!cur) continue;
    const auth = line.match(/^\s*Authentication\s*:\s*(.*)$/i);
    if (auth) { cur.security = auth[1].trim(); cur.open = /open/i.test(auth[1]); }
    const sig = line.match(/^\s*Signal\s*:\s*(\d+)%/i);
    if (sig) cur.signal = Math.max(cur.signal, Number(sig[1]));
  }
  if (cur) out.push(cur);
  return out.filter((n) => n.ssid);
}
function parseAirportScan(text) {
  const out = [];
  const lines = String(text).split(/\r?\n/).slice(1);
  for (const line of lines) {
    const m = line.match(/^\s*(.+?)\s+([0-9a-f:]{17})\s+(-?\d+)\s+\S+\s+\S+\s+(.*)$/i);
    if (!m) continue;
    out.push({ ssid: m[1].trim(), signal: Math.max(0, Math.min(100, 2 * (Number(m[3]) + 100))),
      security: m[4].trim() || 'open', open: /none/i.test(m[4]) });
  }
  return out;
}

async function wifiNetworks() {
  if (IS_WIN) {
    const r = await run('netsh', ['wlan', 'show', 'networks', 'mode=Bssid'], 12000);
    if (!r.ok) return { supported: false, networks: [], note: 'وای‌فای در دسترس نیست یا netsh جواب نداد.' };
    return { supported: true, networks: parseNetshWifi(r.out) };
  }
  if (IS_MAC) {
    const air = '/System/Library/PrivateFrameworks/Apple80211.framework/Versions/Current/Resources/airport';
    const r = await run(air, ['-s'], 12000);
    if (!r.ok) return { supported: false, networks: [], note: 'ابزار airport در دسترس نیست.' };
    return { supported: true, networks: parseAirportScan(r.out) };
  }
  const r = await run('nmcli', ['-t', '-f', 'SSID,SIGNAL,SECURITY,IN-USE', 'device', 'wifi', 'list'], 12000);
  if (!r.ok) return { supported: false, networks: [], note: 'nmcli نصب نیست — فهرست وای‌فای خوانده نشد.' };
  return { supported: true, networks: parseNmcliWifi(r.out) };
}

// What to do when the house is offline. This RANKS options and explains them;
// it does not act. Joining a network is a decision with legal and privacy
// weight (someone else's Wi-Fi is someone else's), so it stays a decision.
async function emergencyPlan() {
  const status = await networkStatus({ deep: false });
  if (status.online) {
    return { needed: false, online: true, status,
      note: 'اینترنت وصل است — کاری لازم نیست.' };
  }
  const wifi = await wifiNetworks();
  const ranked = (wifi.networks || [])
    .map((n) => Object.assign({}, n, {
      rank: (n.known ? 1000 : 0) + (n.open ? 100 : 0) + (n.signal || 0),
      why: n.known ? 'قبلاً به این شبکه وصل شده‌ای — رمزش ذخیره است.'
        : (n.open ? 'باز است و رمز نمی‌خواهد؛ ولی شبکه‌ی باز یعنی هر کسی می‌تواند ترافیک را ببیند.'
          : 'رمز لازم دارد.'),
    }))
    .sort((a, b) => b.rank - a.rank)
    .slice(0, 12);

  return {
    needed: true, online: false, status,
    wifiSupported: wifi.supported !== false,
    options: ranked,
    note: wifi.supported === false ? wifi.note : '',
    // Said plainly so nobody, model included, treats this as permission.
    consent: 'ستایش خودش به هیچ شبکه‌ای وصل نمی‌شود. یکی از این‌ها را انتخاب کن تا وصل کند، '
      + 'و رمز شبکه‌ی رمزدار را خودت بده — هیچ رمزی حدس زده نمی‌شود.',
    advice: ranked.length
      ? 'اگر مجبوری از شبکه‌ی باز استفاده کنی، فقط با اتصال رمزنگاری‌شده‌ی ستایش کار کن.'
      : 'شبکه‌ای در دسترس نیست. اتصال موبایل (هات‌اسپات) را روشن کن.',
  };
}

// The one place that joins a network. It refuses unless the caller passes an
// explicit approval for THIS ssid, and it never invents a password.
async function connectWifi(ssid, opts) {
  opts = opts || {};
  if (!ssid) return { ok: false, error: 'نام شبکه داده نشد.' };
  if (opts.approvedSsid !== ssid) {
    return { ok: false, needsApproval: true, ssid,
      error: 'برای وصل شدن به این شبکه باید خودت تأیید کنی. ستایش خودسرانه به شبکه وصل نمی‌شود.' };
  }
  if (IS_WIN) {
    // Windows connects only to a profile that already exists — Setayesh does
    // not write Wi-Fi profiles or handle the password itself.
    const r = await run('netsh', ['wlan', 'connect', 'name=' + ssid], 20000);
    return { ok: r.ok, output: (r.out || r.err).slice(0, 400),
      note: r.ok ? '' : 'اگر این شبکه از قبل در ویندوز ذخیره نشده باشد، یک بار دستی وصل شو تا ذخیره شود.' };
  }
  if (IS_MAC) {
    const args = ['-setairportnetwork', opts.device || 'en0', ssid];
    if (opts.password) args.push(String(opts.password));
    const r = await run('networksetup', args, 20000);
    return { ok: r.ok && !/failed|error/i.test(r.out), output: (r.out || r.err).slice(0, 400) };
  }
  const args = ['device', 'wifi', 'connect', ssid];
  if (opts.password) args.push('password', String(opts.password));
  const r = await run('nmcli', args, 25000);
  return { ok: r.ok, output: (r.out || r.err).slice(0, 400) };
}

// ---------------------------------------------------------------------------
// 5. Encryption for a network we do not trust
// ---------------------------------------------------------------------------
// X25519 to agree a key, HKDF to derive it, AES-256-GCM to seal. The envelope
// carries an ephemeral public key, so every message uses a fresh shared secret
// and capturing one tells an eavesdropper nothing about the next — and nothing
// about the past even if a long-term key later leaks.
function newKeypair() {
  const { publicKey, privateKey } = crypto.generateKeyPairSync('x25519');
  return {
    publicKey: publicKey.export({ type: 'spki', format: 'der' }).toString('base64'),
    privateKey: privateKey.export({ type: 'pkcs8', format: 'der' }).toString('base64'),
  };
}
function importPublic(b64) {
  return crypto.createPublicKey({ key: Buffer.from(b64, 'base64'), type: 'spki', format: 'der' });
}
function importPrivate(b64) {
  return crypto.createPrivateKey({ key: Buffer.from(b64, 'base64'), type: 'pkcs8', format: 'der' });
}
function deriveKey(shared, salt, info) {
  return Buffer.from(crypto.hkdfSync('sha256', shared, salt, Buffer.from(info || 'setayesh-netguard-v1'), 32));
}

// seal(plaintext, recipientPublicKey) -> a self-contained envelope
function seal(plaintext, recipientPublicKeyB64, aad) {
  const eph = crypto.generateKeyPairSync('x25519');
  const shared = crypto.diffieHellman({ privateKey: eph.privateKey, publicKey: importPublic(recipientPublicKeyB64) });
  const salt = crypto.randomBytes(16);
  const key = deriveKey(shared, salt, 'setayesh-netguard-v1');
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  if (aad) cipher.setAAD(Buffer.from(String(aad), 'utf8'));
  const data = Buffer.concat([
    cipher.update(Buffer.isBuffer(plaintext) ? plaintext : Buffer.from(String(plaintext), 'utf8')),
    cipher.final(),
  ]);
  return {
    v: 1, alg: 'x25519-aes-256-gcm',
    epk: eph.publicKey.export({ type: 'spki', format: 'der' }).toString('base64'),
    salt: salt.toString('base64'),
    iv: iv.toString('base64'),
    tag: cipher.getAuthTag().toString('base64'),
    data: data.toString('base64'),
    aad: aad ? String(aad) : undefined,
  };
}
function unseal(envelope, recipientPrivateKeyB64) {
  if (!envelope || envelope.alg !== 'x25519-aes-256-gcm') throw new Error('پاکت رمزنگاری‌شده معتبر نیست.');
  const shared = crypto.diffieHellman({
    privateKey: importPrivate(recipientPrivateKeyB64),
    publicKey: importPublic(envelope.epk),
  });
  const key = deriveKey(shared, Buffer.from(envelope.salt, 'base64'), 'setayesh-netguard-v1');
  const decipher = crypto.createDecipheriv('aes-256-gcm', key, Buffer.from(envelope.iv, 'base64'));
  if (envelope.aad) decipher.setAAD(Buffer.from(String(envelope.aad), 'utf8'));
  decipher.setAuthTag(Buffer.from(envelope.tag, 'base64'));
  // Any tampering fails here, loudly, instead of returning wrong plaintext.
  return Buffer.concat([decipher.update(Buffer.from(envelope.data, 'base64')), decipher.final()]);
}

module.exports = {
  assessDevice, assessScan, RISKY_PORTS,
  scanFile, CODE_SIGNS, DANGEROUS_EXT, magicOf, entropy,
  networkStatus, interfaces, captivePortalCheck, tlsInspection, dnsCheck, tcpReachable,
  wifiNetworks, emergencyPlan, connectWifi,
  newKeypair, seal, unseal, deriveKey,
  parseNmcliWifi, parseNetshWifi, parseAirportScan,
};
