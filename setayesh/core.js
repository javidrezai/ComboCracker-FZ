'use strict';
// ---------------------------------------------------------------------------
// The internal fast engine — "موتور خوب و سریع و قوی داخلی، حجم کم کارایی بالا".
// ---------------------------------------------------------------------------
// This is the small, dependency-free reasoning core that rides ON TOP of the
// brains/engines and answers the everyday, deterministic asks INSTANTLY — no
// LLM call, works fully offline, sub-millisecond. Only the things that genuinely
// need a large model (open reasoning, writing, code) fall through to the engine
// layer. That is how "whole Setayesh, small size, high performance" is real:
// most turns never touch a model at all.
//
// HONEST SCOPE: this is not a bundled LLM (a strong LLM can't be a few KB of JS).
// Deep intelligence still comes from an engine (local Ollama or cloud). What the
// core does is make Setayesh feel instant and keep working when every engine is
// down, by handling maths, dates, conversions and self-facts on-device.

const { tryCompute, convertUnit } = require('./mathutil');

const FA_WEEK = ['یکشنبه', 'دوشنبه', 'سه‌شنبه', 'چهارشنبه', 'پنجشنبه', 'جمعه', 'شنبه']; // JS getDay: 0=Sun
const FA_MONTHS = ['فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور', 'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند'];
const EN_MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

// Gregorian → Jalali (Persian calendar). Standard Borkowski-style algorithm, no
// dependency. Returns { jy, jm, jd }.
function toJalali(gy, gm, gd) {
  const gdm = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334];
  let jy = (gy <= 1600) ? 0 : 979;
  gy -= (gy <= 1600) ? 621 : 1600;
  const gy2 = (gm > 2) ? (gy + 1) : gy;
  let days = (365 * gy) + Math.floor((gy2 + 3) / 4) - Math.floor((gy2 + 99) / 100)
    + Math.floor((gy2 + 399) / 400) - 80 + gd + gdm[gm - 1];
  jy += 33 * Math.floor(days / 12053); days %= 12053;
  jy += 4 * Math.floor(days / 1461); days %= 1461;
  if (days > 365) { jy += Math.floor((days - 1) / 365); days = (days - 1) % 365; }
  const jm = (days < 186) ? 1 + Math.floor(days / 31) : 7 + Math.floor((days - 186) / 30);
  const jd = 1 + ((days < 186) ? (days % 31) : ((days - 186) % 30));
  return { jy, jm, jd };
}

function persianDate(d) {
  const j = toJalali(d.getFullYear(), d.getMonth() + 1, d.getDate());
  const wd = FA_WEEK[d.getDay()];
  return `${wd} ${j.jd} ${FA_MONTHS[j.jm - 1]} ${j.jy}`;
}
function gregorianDate(d) {
  return `${d.getDate()} ${EN_MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

// The one entry point. Returns { text, kind } for a deterministic instant answer,
// or null to mean "this needs a real engine — pass it on". Deliberately narrow:
// it only claims a message it is CERTAIN about, so it never hijacks a real
// question. `ctx` may carry { version, now } (now defaults to the server clock).
function fastAnswer(message, ctx) {
  ctx = ctx || {};
  const raw = String(message || '').trim();
  if (!raw || raw.length > 200) return null;      // long text is never a fast-path
  const s = raw.toLowerCase();
  const now = ctx.now instanceof Date ? ctx.now : new Date();

  // 1) App version — "نسخه چنده؟ / آخرین آپدیت / what version".
  if (ctx.version && /^(?:نسخه|ورژن|version|build)\b|چه\s*نسخه|نسخه[‌ ]?ی?\s*(?:چنده|چند|فعلی)|آخرین\s*(?:آپدیت|نسخه|بروزرسانی)|what\s+version|which\s+version/i.test(raw)) {
    return { kind: 'version', text: `نسخهٔ فعلیِ ستایش: ${ctx.version}` };
  }

  // 2) Date — "امروز چندمه / تاریخ امروز / چه روزیه / چندشنبه / today's date".
  if (/امروز\s*(?:چندم|چند\s*شنبه|چه\s*روزی|تاریخ)|تاریخِ?\s*امروز|چند\s*شنبه|روزِ?\s*چندم|(?:what|which).*(?:day|date).*(?:today|is\s+it)|today'?s?\s+date|date\s+today/i.test(s)) {
    return { kind: 'date', text: `امروز ${persianDate(now)} است (میلادی: ${gregorianDate(now)}).` };
  }

  // 3) Time — "ساعت چنده / what time".
  if (/ساعت\s*چند|چه\s*ساعتی|what\s*time|time\s+now|current\s+time/i.test(s)) {
    const hh = String(now.getHours()).padStart(2, '0'), mm = String(now.getMinutes()).padStart(2, '0');
    return { kind: 'time', text: `ساعتِ این کامپیوتر: ${hh}:${mm}` };
  }

  // 4) Unit conversion — "۲ کیلومتر چند متر / 5 kg to g" (mathutil handles units).
  const conv = tryConvert(raw);
  if (conv != null) return { kind: 'convert', text: conv };

  // 5) A pure arithmetic expression — "۲+۲*۳ / (12/4)^2". Only when the message
  //    is essentially just the sum, so a sentence that merely contains a number
  //    is left to the engine. Persian/Arabic digits are folded to ASCII first.
  if (/^[-+()0-9.,%×÷*/^\s٠-٩۰-۹]+$/.test(raw) && /[0-9٠-٩۰-۹]/.test(raw) && /[-+×÷*/^%]/.test(raw)) {
    const ascii = foldDigits(raw);
    const r = tryCompute(ascii);
    if (r != null && r !== '') return { kind: 'math', text: String(r) };
  }

  return null;
}

// Fold Persian (۰-۹) and Arabic (٠-٩) digits to ASCII so the maths core works
// whichever keyboard the family typed on.
function foldDigits(s) {
  return String(s || '')
    .replace(/[۰-۹]/g, (d) => String(d.charCodeAt(0) - 0x06F0))
    .replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 0x0660));
}

function tryConvert(text) {
  try {
    const m = /(-?\d+(?:[.,]\d+)?)\s*([a-zA-Zµ°]+|کیلو\w*|متر|گرم|کیلوگرم)\s*(?:به|to|در|=)\s*([a-zA-Zµ°]+|متر|گرم|سانتی\w*)/i.exec(String(text || ''));
    if (!m) return null;
    const out = convertUnit(parseFloat(String(m[1]).replace(',', '.')), m[2], m[3]);
    if (out == null || Number.isNaN(out)) return null;
    return `${m[1]} ${m[2]} = ${out} ${m[3]}`;
  } catch (e) { return null; }
}

module.exports = { fastAnswer, toJalali, persianDate };
