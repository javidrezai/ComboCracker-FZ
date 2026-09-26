'use strict';
// Rule-based fact / commitment / due-date extraction, split out of index.js.
// Pure functions (string in, data out), no shared state — used by autoLearn to
// distil durable facts from a chat message with no model call.

const TASK_PATTERNS = [
  /باید\s+(.{4,80}?)(?:\.|،|$)/,
  /یادم\s+باشه\s+(.{4,80}?)(?:\.|،|$)/,
  /فراموش\s+نکنم\s+(.{4,80}?)(?:\.|،|$)/,
  /قراره\s+(.{4,80}?)(?:\.|،|$)/,
  /\bI (?:have to|need to|must|should)\s+(.{4,80}?)(?:\.|,|$)/i,
  /\bremind me to\s+(.{4,80}?)(?:\.|,|$)/i,
  /\bdon'?t (?:let me )?forget to\s+(.{4,80}?)(?:\.|,|$)/i,
];

// Dates people actually write, mapped to a real day (YYYY-MM-DD) or null.
function guessDueDate(text) {
  const t = String(text);
  const now = new Date();
  const plus = (n) => new Date(now.getTime() + n * 86400000).toISOString().slice(0, 10);

  if (/پس\s*فردا/.test(t)) return plus(2);            // must be checked before "فردا"
  if (/فردا/.test(t) || /\btomorrow\b/i.test(t)) return plus(1);
  if (/امروز/.test(t) || /\btoday\b/i.test(t)) return plus(0);
  if (/هفته\s*(?:ی\s*)?(?:آینده|بعد)|next week/i.test(t)) return plus(7);

  let m = t.match(/\b(20\d{2})[-/.](\d{1,2})[-/.](\d{1,2})\b/);
  if (m) return `${m[1]}-${String(m[2]).padStart(2, '0')}-${String(m[3]).padStart(2, '0')}`;
  m = t.match(/\b(\d{1,2})[./](\d{1,2})[./](20\d{2})\b/);
  if (m) return `${m[3]}-${String(m[2]).padStart(2, '0')}-${String(m[1]).padStart(2, '0')}`;

  const days = { 'شنبه':6,'یکشنبه':0,'دوشنبه':1,'سه‌شنبه':2,'سه شنبه':2,'چهارشنبه':3,'پنجشنبه':4,'پنج‌شنبه':4,'جمعه':5,
                 'monday':1,'tuesday':2,'wednesday':3,'thursday':4,'friday':5,'saturday':6,'sunday':0 };
  for (const [name, dow] of Object.entries(days)) {
    if (new RegExp(name, 'i').test(t)) {
      let delta = (dow - now.getDay() + 7) % 7;
      if (delta === 0) delta = 7;
      return plus(delta);
    }
  }
  return null;
}

function detectCommitment(message) {
  const text = String(message || '');
  if (text.length > 400) return null;      // long pastes are not commitments
  for (const re of TASK_PATTERNS) {
    const m = text.match(re);
    if (m && m[1]) {
      const task = m[1].trim().replace(/\s+/g, ' ');
      if (task.length < 4) continue;
      return { text: task, due: guessDueDate(text) };
    }
  }
  return null;
}

const LEARN_PATTERNS = [
  { kind: 'fact', re: /(?:یادت\s*باشه|به\s*خاطر\s*بسپار|یادداشت\s*کن|حفظ\s*کن)\s*(?:که\s*)?(.{3,160}?)(?:[.،]|$)/ },
  { kind: 'fact', re: /\bremember(?:\s+that)?\s+(.{3,160}?)(?:[.,]|$)/i },
  { kind: 'fact', re: /اسم(?:م| من| منه)?\s*(?:هست\s*)?([آ-ی][آ-ی‌ ]{1,38}?)(?:\s*(?:است|هست|ه)|[.،]|$)/ },
  { kind: 'fact', re: /\bmy name is\s+([A-Za-z][A-Za-z ]{1,38})/i },
  { kind: 'fact', re: /(?:من\s+)?(?:در|تو)\s+([^.،\n]{2,50}?)\s+(?:کار\s*می[‌ ]?کنم|زندگی\s*می[‌ ]?کنم)/ },
  { kind: 'fact', re: /\bI (?:live|work)\b[^.,\n]{0,4}\b(?:in|at|as)\s+([^.,\n]{2,50}?)(?:[.,]|$)/i },
  { kind: 'preference', re: /([^.،\n]{2,60}?)\s*(?:رو|را)\s*(?:خیلی\s*)?(?:دوست\s*دارم|دوست\s*ندارم|ترجیح\s*می[‌ ]?دهم)/ },
  { kind: 'preference', re: /\bI (?:like|love|hate|prefer)\s+([^.,\n]{2,60}?)(?:[.,]|$)/i },
];

function extractFacts(message) {
  const text = String(message || '').trim();
  if (!text || text.length > 500) return [];   // long pastes aren't personal facts
  const out = [];
  for (const p of LEARN_PATTERNS) {
    const m = text.match(p.re);
    if (m && m[1]) {
      const v = m[1].trim().replace(/\s+/g, ' ');
      if (v.length < 2 || v.length > 170) continue;
      out.push({ text: v, kind: p.kind });
    }
  }
  const commit = detectCommitment(text);
  if (commit) out.push({ text: commit.text, kind: 'deadline', due: commit.due });
  return out;
}

module.exports = { guessDueDate, detectCommitment, extractFacts };
