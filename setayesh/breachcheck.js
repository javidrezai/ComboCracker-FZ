'use strict';
// ---------------------------------------------------------------------------
// breachcheck.js — "آیا اطلاعاتم لو رفته؟" با سرویس‌های قانونیِ عمومی.
// ---------------------------------------------------------------------------
// Two safe, legitimate checks — no dark web, no scraping, nothing illegal:
//
//  1) Password exposure via Have I Been Pwned's *Pwned Passwords* range API.
//     It is PRIVACY-PRESERVING (k-anonymity): we SHA-1 the password, send only
//     the FIRST 5 characters of the hash to the server, and match the rest
//     locally. The real password — and even its full hash — never leaves the
//     machine. Keyless and free.
//
//  2) Email breach lookup via the HIBP v3 API. This one needs the owner's own
//     HIBP API key (a paid key); without it we say so honestly rather than
//     pretending. Only the email is sent, over HTTPS, to HIBP.
//
// Networking is done with the global fetch (Node 18+), so no new dependency.
// The parsing is pure and unit-tested; the network wrappers are thin.

const crypto = require('crypto');

function sha1Upper(s) {
  return crypto.createHash('sha1').update(String(s), 'utf8').digest('hex').toUpperCase();
}

// Pure: given the range-endpoint body ("SUFFIX:COUNT\r\n…") and the 35-char
// suffix we are looking for, return how many times that password was seen (0 if
// it does not appear). Case-insensitive on the suffix; tolerant of \r\n or \n.
function parseRange(body, suffix) {
  const want = String(suffix || '').toUpperCase();
  const lines = String(body || '').split(/\r?\n/);
  for (const line of lines) {
    const idx = line.indexOf(':');
    if (idx < 0) continue;
    const suf = line.slice(0, idx).trim().toUpperCase();
    if (suf === want) {
      const n = parseInt(line.slice(idx + 1).replace(/[^0-9]/g, ''), 10);
      return Number.isFinite(n) ? n : 0;
    }
  }
  return 0;
}

// Check a password against Pwned Passwords (k-anonymity). Returns
// { count, prefix }. count>0 means it has appeared in known breaches.
async function pwnedPassword(password, opts) {
  opts = opts || {};
  const fetchFn = opts.fetch || (typeof fetch === 'function' ? fetch : null);
  if (!fetchFn) throw new Error('fetch در دسترس نیست');
  if (!password) return { count: 0, prefix: '' };
  const hash = sha1Upper(password);
  const prefix = hash.slice(0, 5), suffix = hash.slice(5);
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), opts.timeoutMs || 12000);
  try {
    const r = await fetchFn('https://api.pwnedpasswords.com/range/' + prefix, {
      headers: { 'Add-Padding': 'true', 'User-Agent': 'Setayesh-Family-Assistant' },
      signal: ctrl.signal,
    });
    if (!r.ok) throw new Error('سرویسِ بررسیِ رمز جواب نداد (' + r.status + ')');
    const body = await r.text();
    return { count: parseRange(body, suffix), prefix };
  } finally { clearTimeout(timer); }
}

// Look up an email in HIBP breaches. Needs the owner's HIBP API key. Returns
// { breaches:[{Name,Domain,BreachDate,PwnCount,DataClasses}], count } or
// { needsKey:true } when no key is set, or { notFound:true } when clean.
async function emailBreaches(email, apiKey, opts) {
  opts = opts || {};
  const fetchFn = opts.fetch || (typeof fetch === 'function' ? fetch : null);
  if (!fetchFn) throw new Error('fetch در دسترس نیست');
  const acct = String(email || '').trim();
  if (!acct || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(acct)) throw new Error('ایمیل معتبر نیست');
  if (!apiKey) return { needsKey: true };
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), opts.timeoutMs || 12000);
  try {
    const url = 'https://haveibeenpwned.com/api/v3/breachedaccount/' +
      encodeURIComponent(acct) + '?truncateResponse=false';
    const r = await fetchFn(url, { headers: {
      'hibp-api-key': String(apiKey), 'User-Agent': 'Setayesh-Family-Assistant', 'Accept': 'application/json',
    }, signal: ctrl.signal });
    if (r.status === 404) return { notFound: true, count: 0, breaches: [] };
    if (r.status === 401) throw new Error('کلیدِ HIBP نامعتبر است');
    if (r.status === 429) throw new Error('سقفِ درخواستِ HIBP پر شده — کمی بعد دوباره امتحان کن');
    if (!r.ok) throw new Error('HIBP جواب نداد (' + r.status + ')');
    const arr = await r.json().catch(() => []);
    const breaches = (Array.isArray(arr) ? arr : []).map((b) => ({
      Name: b.Name, Title: b.Title || b.Name, Domain: b.Domain || '',
      BreachDate: b.BreachDate || '', PwnCount: b.PwnCount || 0,
      DataClasses: Array.isArray(b.DataClasses) ? b.DataClasses : [],
    }));
    return { count: breaches.length, breaches };
  } finally { clearTimeout(timer); }
}

module.exports = { sha1Upper, parseRange, pwnedPassword, emailBreaches };
