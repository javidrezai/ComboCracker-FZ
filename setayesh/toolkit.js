'use strict';

// Setayesh AI — security & network toolkit backend.
//
// SAFETY STANCE (read before extending this file):
// This module is a DEFENSIVE, self-audit toolkit. Every network feature is
// hard-limited to private/local address space so the tool cannot be pointed at
// the public internet or third-party systems. There is intentionally NO code
// here that transmits RF, injects keystrokes, deauthenticates clients, clones
// access credentials, or cracks passwords against remote targets. The Sub-GHz /
// RFID / BadUSB surface is a SIMULATION scaffold plus a serial hardware
// abstraction stub — it models the workflow for owned hardware, it does not
// perform any attack. Keep it that way.

const net = require('net');
const os = require('os');
const crypto = require('crypto');

let QRCode = null;
try { QRCode = require('qrcode'); } catch (e) { QRCode = null; }

// ---------------- Address-space guard ----------------
function ipToInt(ip) {
  const p = ip.split('.').map(Number);
  if (p.length !== 4 || p.some(n => Number.isNaN(n) || n < 0 || n > 255)) return null;
  return ((p[0] << 24) >>> 0) + (p[1] << 16) + (p[2] << 8) + p[3];
}

// Only these ranges may ever be scanned. This is the core safe-execution
// boundary — do not widen it.
const PRIVATE_RANGES = [
  ['10.0.0.0', 8],
  ['172.16.0.0', 12],
  ['192.168.0.0', 16],
  ['127.0.0.0', 8],
  ['169.254.0.0', 16], // link-local
];

function isPrivateIp(ip) {
  const v = ipToInt(ip);
  if (v === null) return false;
  return PRIVATE_RANGES.some(([base, bits]) => {
    const mask = bits === 0 ? 0 : (~((1 << (32 - bits)) - 1)) >>> 0;
    return (v & mask) === (ipToInt(base) & mask);
  });
}

function intToIp(v) {
  return [(v >>> 24) & 255, (v >>> 16) & 255, (v >>> 8) & 255, v & 255].join('.');
}

// ---------------- Local interfaces ----------------
function localInterfaces() {
  const nets = os.networkInterfaces();
  const out = [];
  for (const name of Object.keys(nets)) {
    for (const ni of nets[name] || []) {
      if (ni.family === 'IPv4') {
        out.push({
          name,
          address: ni.address,
          netmask: ni.netmask,
          mac: ni.mac,
          internal: ni.internal,
          cidr: ni.cidr,
          private: isPrivateIp(ni.address),
        });
      }
    }
  }
  return out;
}

// Derive the /24 the app is most likely sitting on, for a sensible scan default.
function suggestedSubnet() {
  const ext = localInterfaces().find(i => !i.internal && i.private);
  if (!ext) return '192.168.1.0/24';
  const parts = ext.address.split('.');
  return `${parts[0]}.${parts[1]}.${parts[2]}.0/24`;
}

// ---------------- TCP port probe ----------------
// A single connect attempt. "open" = handshake completed; "closed" = the host
// actively refused (which still proves the host is alive); "filtered" = timeout.
function probePort(host, port, timeout) {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    let settled = false;
    const done = (state) => {
      if (settled) return;
      settled = true;
      socket.destroy();
      resolve(state);
    };
    socket.setTimeout(timeout);
    socket.once('connect', () => done('open'));
    socket.once('timeout', () => done('filtered'));
    socket.once('error', (err) => done(err.code === 'ECONNREFUSED' ? 'closed' : 'filtered'));
    try { socket.connect(port, host); } catch (e) { done('filtered'); }
  });
}

const COMMON_PORTS = [
  { p: 22, s: 'SSH' }, { p: 80, s: 'HTTP' }, { p: 443, s: 'HTTPS' },
  { p: 445, s: 'SMB' }, { p: 3389, s: 'RDP' }, { p: 3000, s: 'dev' },
  { p: 8080, s: 'HTTP-alt' }, { p: 5432, s: 'Postgres' }, { p: 3306, s: 'MySQL' },
  { p: 139, s: 'NetBIOS' }, { p: 62078, s: 'iOS-sync' }, { p: 5000, s: 'UPnP/dev' },
];

// A host is considered "up" if any probe returns open OR closed (a refusal is
// still a live host answering). We probe a few common ports to decide.
async function discoverHost(host, timeout) {
  const ports = [80, 443, 22, 445, 3389, 62078];
  const results = await Promise.all(ports.map(p => probePort(host, p, timeout)));
  const open = [];
  let alive = false;
  results.forEach((state, i) => {
    if (state === 'open') { alive = true; open.push(ports[i]); }
    else if (state === 'closed') { alive = true; }
  });
  return { host, alive, open };
}

// Scan a private /24 for live hosts. Bounded, throttled, private-only.
async function networkScan(cidr, opts = {}) {
  const timeout = Math.min(Math.max(opts.timeout || 400, 100), 2000);
  const m = String(cidr).match(/^(\d+\.\d+\.\d+\.\d+)\/(\d+)$/);
  if (!m) throw new Error('فرمت شبکه نامعتبر است (مثال: 192.168.1.0/24)');
  const [, base, bitsStr] = m;
  const bits = Number(bitsStr);
  if (bits < 24 || bits > 30) throw new Error('برای ایمنی فقط /24 تا /30 مجاز است.');
  if (!isPrivateIp(base)) throw new Error('فقط شبکه‌های محلی/خصوصی قابل اسکن هستند.');

  const baseInt = ipToInt(base) & (~((1 << (32 - bits)) - 1) >>> 0);
  const count = Math.pow(2, 32 - bits);
  const hosts = [];
  for (let i = 1; i < count - 1; i++) hosts.push(intToIp(baseInt + i));

  // Throttle to avoid hammering the NIC; 40 concurrent probes at a time.
  const CONC = 40;
  const found = [];
  for (let i = 0; i < hosts.length; i += CONC) {
    const batch = hosts.slice(i, i + CONC);
    const res = await Promise.all(batch.map(h => discoverHost(h, timeout)));
    res.forEach(r => { if (r.alive) found.push(r); });
  }
  return { cidr, scanned: hosts.length, hosts: found };
}

// Detailed port scan of ONE private host.
async function portScan(host, opts = {}) {
  if (!isPrivateIp(host)) throw new Error('فقط میزبان‌های محلی/خصوصی قابل بررسی هستند.');
  const timeout = Math.min(Math.max(opts.timeout || 500, 100), 2000);
  const list = Array.isArray(opts.ports) && opts.ports.length
    ? opts.ports.filter(p => Number.isInteger(p) && p > 0 && p < 65536).slice(0, 200).map(p => ({ p, s: '' }))
    : COMMON_PORTS;
  const CONC = 20;
  const results = [];
  for (let i = 0; i < list.length; i += CONC) {
    const batch = list.slice(i, i + CONC);
    const states = await Promise.all(batch.map(x => probePort(host, x.p, timeout)));
    batch.forEach((x, j) => results.push({ port: x.p, service: x.s, state: states[j] }));
  }
  results.sort((a, b) => a.port - b.port);
  return { host, ports: results, open: results.filter(r => r.state === 'open').map(r => r.port) };
}

// ---------------- Hash lab ----------------
function hashString(input, algos) {
  const list = (algos && algos.length ? algos : ['md5', 'sha1', 'sha256', 'sha512'])
    .filter(a => crypto.getHashes().includes(a));
  const out = {};
  for (const a of list) out[a] = crypto.createHash(a).update(input, 'utf8').digest('hex');
  return out;
}

// Best-effort hash-type identification by length + charset. Defensive use:
// helps you recognise what a leaked/stored hash in YOUR data is.
function identifyHash(h) {
  const s = String(h).trim();
  const hex = /^[a-fA-F0-9]+$/.test(s);
  const guesses = [];
  if (hex) {
    ({
      32: () => guesses.push('MD5', 'MD4', 'NTLM'),
      40: () => guesses.push('SHA-1', 'RIPEMD-160'),
      56: () => guesses.push('SHA-224'),
      64: () => guesses.push('SHA-256', 'SHA3-256'),
      96: () => guesses.push('SHA-384'),
      128: () => guesses.push('SHA-512', 'SHA3-512'),
    }[s.length] || (() => {}))();
  }
  if (/^\$2[aby]\$/.test(s)) guesses.push('bcrypt');
  if (/^\$argon2/.test(s)) guesses.push('Argon2');
  if (/^\$6\$/.test(s)) guesses.push('sha512crypt');
  if (/^\$5\$/.test(s)) guesses.push('sha256crypt');
  if (/^[A-Za-z0-9+/]+={0,2}$/.test(s) && s.length % 4 === 0 && !hex) guesses.push('Base64 (not a hash)');
  return { input: s, length: s.length, hex, guesses: guesses.length ? guesses : ['unknown'] };
}

// Password strength estimate for the user's OWN password — pure local math,
// nothing leaves the machine. Reports entropy + rough offline-crack time.
function passwordStrength(pw) {
  const s = String(pw);
  let pool = 0;
  if (/[a-z]/.test(s)) pool += 26;
  if (/[A-Z]/.test(s)) pool += 26;
  if (/[0-9]/.test(s)) pool += 10;
  if (/[^A-Za-z0-9]/.test(s)) pool += 33;
  const entropy = s.length ? +(s.length * Math.log2(pool || 1)).toFixed(1) : 0;
  // assume a strong offline attacker at 1e11 guesses/sec
  const seconds = Math.pow(2, entropy) / 1e11;
  let human;
  if (seconds < 1) human = 'instant';
  else if (seconds < 60) human = `${Math.max(1, Math.round(seconds))} sec`;
  else if (seconds < 3600) human = `${Math.round(seconds / 60)} min`;
  else if (seconds < 86400) human = `${Math.round(seconds / 3600)} hours`;
  else if (seconds < 31536000) human = `${Math.round(seconds / 86400)} days`;
  else if (seconds < 31536000 * 1000) human = `${Math.round(seconds / 31536000)} years`;
  else human = 'centuries+';
  let verdict = 'weak';
  if (entropy >= 60) verdict = 'ok';
  if (entropy >= 80) verdict = 'strong';
  if (entropy >= 100) verdict = 'excellent';
  return { length: s.length, poolSize: pool, entropyBits: entropy, crackTime: human, verdict };
}

// ---------------- QR for the mobile companion ----------------
async function qrForUrl(url) {
  if (!QRCode) return { url, svg: null, note: 'qrcode module not available' };
  const svg = await QRCode.toString(url, {
    type: 'svg', margin: 1, errorCorrectionLevel: 'M',
    color: { dark: '#e8e9f2', light: '#00000000' },
  });
  return { url, svg };
}

// ---------------- Web security scanner (PASSIVE) ----------------
// Fetches a website the user owns and inspects the RESPONSE for common
// misconfigurations: missing security headers, weak cookie flags, no HTTPS,
// version disclosure, mixed content. It is passive — one GET (plus one HTTP->
// HTTPS redirect probe). It sends no injection, no auth attempts, no path
// brute-forcing. This is the same class of check a browser or securityheaders.com
// performs; it helps you understand and fix issues on your own site.

const SEC_HEADERS = [
  { key: 'content-security-policy', name: 'Content-Security-Policy', sev: 'high',
    why: 'بدون CSP، حملات XSS و تزریق اسکریپت بسیار ساده‌تر می‌شوند.',
    fix: "یک هدر Content-Security-Policy اضافه کنید، مثلاً: default-src 'self'; script-src 'self'" },
  { key: 'strict-transport-security', name: 'Strict-Transport-Security', sev: 'high', httpsOnly: true,
    why: 'بدون HSTS مرورگر ممکن است به نسخه‌ی ناامن http وصل شود (downgrade).',
    fix: 'Strict-Transport-Security: max-age=31536000; includeSubDomains' },
  { key: 'x-frame-options', name: 'X-Frame-Options', sev: 'medium', altKey: 'frame-ancestors',
    why: 'بدون این، سایت شما در iframe قابل‌جاسازی و در معرض clickjacking است.',
    fix: "X-Frame-Options: DENY  (یا در CSP از frame-ancestors 'none' استفاده کنید)" },
  { key: 'x-content-type-options', name: 'X-Content-Type-Options', sev: 'medium',
    why: 'بدون nosniff مرورگر ممکن است نوع فایل را حدس بزند و منجر به اجرای محتوای خطرناک شود.',
    fix: 'X-Content-Type-Options: nosniff' },
  { key: 'referrer-policy', name: 'Referrer-Policy', sev: 'low',
    why: 'ممکن است آدرس صفحات داخلی از طریق هدر Referer به سایت‌های دیگر لو برود.',
    fix: 'Referrer-Policy: strict-origin-when-cross-origin' },
  { key: 'permissions-policy', name: 'Permissions-Policy', sev: 'low',
    why: 'دسترسی به دوربین/میکروفون/موقعیت محدود نشده است.',
    fix: 'Permissions-Policy: geolocation=(), camera=(), microphone=()' },
];

function analyzeCookies(setCookie, isHttps) {
  const findings = [];
  const cookies = Array.isArray(setCookie) ? setCookie : (setCookie ? [setCookie] : []);
  for (const c of cookies) {
    const name = (c.split('=')[0] || 'cookie').trim();
    const low = c.toLowerCase();
    if (isHttps && !low.includes('secure')) {
      findings.push({ sev: 'high', title: `کوکی «${name}» بدون Secure`,
        detail: 'این کوکی می‌تواند روی اتصال ناامن ارسال و شنود شود.', fix: 'پرچم Secure را به کوکی اضافه کنید.' });
    }
    if (!low.includes('httponly')) {
      findings.push({ sev: 'medium', title: `کوکی «${name}» بدون HttpOnly`,
        detail: 'جاوااسکریپت به این کوکی دسترسی دارد؛ در صورت XSS قابل سرقت است.', fix: 'پرچم HttpOnly را اضافه کنید.' });
    }
    if (!low.includes('samesite')) {
      findings.push({ sev: 'medium', title: `کوکی «${name}» بدون SameSite`,
        detail: 'در برابر CSRF محافظت کامل ندارد.', fix: 'SameSite=Lax یا SameSite=Strict را اضافه کنید.' });
    }
  }
  return findings;
}

async function fetchOnce(url, opts = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), opts.timeout || 12000);
  try {
    const res = await fetch(url, {
      method: opts.method || 'GET',
      redirect: opts.redirect || 'follow',
      signal: controller.signal,
      headers: { 'User-Agent': 'SetayeshAI-WebScan/1.0 (defensive self-audit)' },
    });
    return res;
  } finally {
    clearTimeout(timer);
  }
}

async function webScan(rawUrl) {
  let url = String(rawUrl || '').trim();
  if (!/^https?:\/\//i.test(url)) url = 'https://' + url;
  let parsed;
  try { parsed = new URL(url); } catch (e) { throw new Error('آدرس نامعتبر است.'); }
  if (!/^https?:$/.test(parsed.protocol)) throw new Error('فقط http/https پشتیبانی می‌شود.');

  let res;
  try {
    res = await fetchOnce(parsed.href, { redirect: 'follow', timeout: 12000 });
  } catch (err) {
    // If https failed, try http so the user still gets feedback.
    if (parsed.protocol === 'https:') {
      try { res = await fetchOnce('http://' + parsed.host + parsed.pathname, { timeout: 12000 }); }
      catch (e2) { throw new Error('سایت در دسترس نبود یا پاسخ نداد: ' + err.message); }
    } else {
      throw new Error('سایت در دسترس نبود یا پاسخ نداد: ' + err.message);
    }
  }

  const finalUrl = res.url || parsed.href;
  const isHttps = finalUrl.startsWith('https:');
  const h = {};
  res.headers.forEach((v, k) => { h[k.toLowerCase()] = v; });

  // read a bounded slice of the body for passive body checks
  let body = '';
  try {
    const reader = res.body ? res.body.getReader() : null;
    if (reader) {
      let total = 0;
      const dec = new TextDecoder();
      while (total < 500000) {
        const { done, value } = await reader.read();
        if (done) break;
        total += value.length;
        body += dec.decode(value, { stream: true });
      }
      try { await reader.cancel(); } catch (e) {}
    } else {
      body = (await res.text()).slice(0, 500000);
    }
  } catch (e) { body = ''; }

  const findings = [];

  // 1) HTTPS itself
  if (!isHttps) {
    findings.push({ sev: 'critical', title: 'سایت روی HTTPS نیست',
      detail: 'ترافیک رمزنگاری نشده و قابل شنود/دستکاری است.',
      fix: 'یک گواهی TLS نصب کنید (Let\'s Encrypt رایگان است) و همه‌ی ترافیک را به https هدایت کنید.' });
  }

  // 2) security headers
  for (const sh of SEC_HEADERS) {
    if (sh.httpsOnly && !isHttps) continue;
    const present = h[sh.key] || (sh.altKey && (h['content-security-policy'] || '').toLowerCase().includes(sh.altKey));
    if (!present) {
      findings.push({ sev: sh.sev, title: `هدر ${sh.name} تنظیم نشده`, detail: sh.why, fix: sh.fix });
    }
  }

  // 3) version / tech disclosure
  if (h['server'] && /[0-9]/.test(h['server'])) {
    findings.push({ sev: 'low', title: 'نسخه‌ی سرور فاش شده', detail: `هدر Server: ${h['server']}`,
      fix: 'شماره‌ی نسخه را از هدر Server حذف یا مخفی کنید.' });
  }
  if (h['x-powered-by']) {
    findings.push({ sev: 'low', title: 'فناوری بک‌اند فاش شده', detail: `X-Powered-By: ${h['x-powered-by']}`,
      fix: 'هدر X-Powered-By را غیرفعال کنید (در Express: app.disable(\'x-powered-by\')).' });
  }

  // 4) cookies
  const rawSetCookie = (res.headers.getSetCookie && res.headers.getSetCookie()) || h['set-cookie'];
  findings.push(...analyzeCookies(rawSetCookie, isHttps));

  // 5) mixed content on an https page — only flag actual resource loads
  // (src=/href= on script/img/link/iframe), not any http:// text in the body.
  if (isHttps && /(?:src|href)\s*=\s*["']http:\/\/[^"']+["']/i.test(body)) {
    findings.push({ sev: 'medium', title: 'محتوای ترکیبی (mixed content)',
      detail: 'صفحه‌ی https به منابع http (اسکریپت/تصویر/استایل) ارجاع می‌دهد که امنیت را می‌شکند.',
      fix: 'همه‌ی لینک‌های منابع را به https تغییر دهید.' });
  }

  // 6) forms — informational nudge toward CSRF review
  const forms = (body.match(/<form/gi) || []).length;
  if (forms) {
    findings.push({ sev: 'info', title: `${forms} فرم در صفحه`,
      detail: 'فرم‌ها را از نظر توکن CSRF و اعتبارسنجی سمت سرور بررسی کنید.',
      fix: 'برای هر فرمِ تغییردهنده‌ی وضعیت، توکن CSRF و اعتبارسنجی ورودی بگذارید.' });
  }

  // 7) HTTP -> HTTPS redirect probe (best-effort)
  let httpRedirect = null;
  if (isHttps) {
    try {
      const r2 = await fetchOnce('http://' + parsed.host + '/', { redirect: 'manual', timeout: 8000 });
      const loc = r2.headers.get('location') || '';
      const redirects = r2.status >= 300 && r2.status < 400 && loc.startsWith('https:');
      httpRedirect = redirects;
      if (!redirects) {
        findings.push({ sev: 'medium', title: 'http به https هدایت نمی‌شود',
          detail: 'نسخه‌ی ناامن سایت هنوز مستقیماً سرو می‌شود.',
          fix: 'همه‌ی درخواست‌های http را با 301 به https هدایت کنید.' });
      }
    } catch (e) { httpRedirect = null; }
  }

  // score: start at 100, subtract by severity
  const weight = { critical: 30, high: 18, medium: 9, low: 4, info: 0 };
  let score = 100;
  findings.forEach(f => { score -= (weight[f.sev] || 0); });
  score = Math.max(0, score);
  const grade = score >= 90 ? 'A' : score >= 75 ? 'B' : score >= 55 ? 'C' : score >= 35 ? 'D' : 'F';

  const order = { critical: 0, high: 1, medium: 2, low: 3, info: 4 };
  findings.sort((a, b) => (order[a.sev] - order[b.sev]));

  return {
    url: parsed.href,
    finalUrl,
    status: res.status,
    https: isHttps,
    server: h['server'] || null,
    httpRedirect,
    score,
    grade,
    counts: findings.reduce((m, f) => { m[f.sev] = (m[f.sev] || 0) + 1; return m; }, {}),
    findings,
  };
}

// ---------------- Hardware bridge (SIMULATION) ----------------
// This is a scaffold for expansion via USB/serial to owned hardware (e.g. an
// SDR, a Proxmark, an Arduino). It returns STRUCTURED SAMPLE data so the UI and
// data model can be built now; it performs no RF, RFID, NFC, or USB-HID action.
// A real integration would replace `simulate*` with serialport reads/writes,
// gated behind an explicit "I own this hardware / I am authorized" confirmation.
function listSerialPortsStub() {
  // Real impl: require('serialport').SerialPort.list()
  return { available: false, note: 'اتصال سریال در این نسخه شبیه‌سازی است — برای سخت‌افزار واقعی ماژول serialport اضافه شود.', ports: [] };
}

function simulateSubGhz() {
  return {
    simulated: true,
    band: '433.92 MHz (ISM)',
    note: 'داده‌ی نمونه برای طراحی رابط — هیچ سیگنالی ارسال/دریافت نمی‌شود.',
    captures: [
      { t: '+0.00s', proto: 'OOK', rssi: -62, bits: 24, note: 'sample frame' },
      { t: '+1.20s', proto: 'FSK', rssi: -71, bits: 40, note: 'sample frame' },
    ],
  };
}

function simulateRfid() {
  return {
    simulated: true,
    note: 'داده‌ی نمونه — خواندن/شبیه‌سازی کارت واقعی انجام نمی‌شود.',
    tags: [
      { type: 'EM4100 (125kHz)', uid: '—', status: 'demo' },
      { type: 'MIFARE Classic 1K (13.56MHz)', uid: '—', status: 'demo' },
    ],
  };
}

module.exports = {
  isPrivateIp,
  localInterfaces,
  suggestedSubnet,
  networkScan,
  portScan,
  webScan,
  hashString,
  identifyHash,
  passwordStrength,
  qrForUrl,
  listSerialPortsStub,
  simulateSubGhz,
  simulateRfid,
};
