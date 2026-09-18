'use strict';
// Pure engine-selection policy, split out of index.js (no shared state):
//   classifyQuestion — tag a question so routing can pick a fitting engine
//   cooldownFor       — how long an engine rests after a failure, and whether
//                       the failure was a rate limit (which must never quarantine)
// Both are pure functions of their arguments and are unit-tested in smoke.test.js.

// Tag a question. The tags drive rankEngines(): a code question wants a code
// model, a "current" question (weather/news/prices) wants a tool-capable engine
// that can web-search, a "tools" question needs mail/calendar/file access, etc.
function classifyQuestion(text, opts) {
  opts = opts || {};
  const s = String(text || '');
  const tags = [];
  if (opts.needsVision) tags.push('vision');
  if (/```|\bfunction\b|\bclass\b|\bimport\b|\bconst \b|\bdef \b|<\/?[a-z]+>|\bnpm\b|\bgit\b|\bsql\b|\bregex\b|\bbug\b|\berror\b|کد|برنامه‌?نویس|اسکریپت|باگ|خطای|دیباگ/i.test(s)) tags.push('code');
  if (/\bwhy\b|\bprove\b|\bdesign\b|\barchitect|\bcompare\b|\btrade-?off|\bstrategy\b|چرا|تحلیل|مقایسه|طراحی|استدلال|اثبات/i.test(s)) tags.push('reasoning');
  if (/\btoday\b|\btomorrow\b|\bnews\b|\bprice\b|\blatest\b|\bweather\b|\bforecast\b|\b20\d\d\b|امروز|فردا|دیروز|اخبار|قیمت|جدیدترین|الان|هوا|آب.?و.?هوا|دما|هواشناسی|بارون|باران|برف|نرخ|دلار|بورس/i.test(s)) tags.push('current');
  if (s.length > 4000) tags.push('long');
  // Things only a tool can answer — mail, calendar, files, the house itself.
  if (/\bemail\b|\bmail\b|\binbox\b|\bcalendar\b|ایمیل|میل|صندوق|تقویم|قرار|یادآور|فایل|زیپ|pdf/i.test(s)) tags.push('tools');
  if (!tags.length && s.length < 220) tags.push('fast', 'chat');
  if (!tags.length) tags.push('general');
  return tags;
}

// How long an engine sits out after a failure. Repeated REAL failures of the
// same kind double the wait (capped). A 429/413 is RATE LIMITING, not a broken
// engine — the limit resets on its own in seconds, so it gets a short, flat
// rest and never grows toward the 6-hour quarantine, otherwise a short burst of
// questions would park every engine for the rest of the day.
function cooldownFor(status, detail, streak) {
  const noCredit = status === 402 || status === 401
    || (status === 400 && /credit balance|insufficient|quota|billing|exceeded/i.test(String(detail || '')));
  const rateLimited = status === 429 || status === 413;
  let base;
  if (noCredit) base = 3600000;                       // an hour — needs the owner
  else if (status === 404) base = 1800000;            // retired model — not coming back on its own
  else if (rateLimited) base = 20000;                 // 20s — the per-minute cap clears itself
  else if (!status || status >= 500) base = 30000;
  else base = 45000;
  const grow = rateLimited ? 1 : Math.min(8, Math.pow(2, Math.max(0, streak - 1)));
  return { ms: Math.min(rateLimited ? 120000 : 6 * 3600000, base * grow), noCredit, rateLimited };
}

module.exports = { classifyQuestion, cooldownFor };
