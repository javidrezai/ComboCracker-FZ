'use strict';
// The outbound-privacy pattern tables, split out of index.js as pure static
// data. The scanning/redacting functions stay in index.js (they also consult
// the live protected-terms list); only these regex tables and label maps live
// here. Each pattern object is {name, re}; callers build a fresh RegExp from
// re.source/re.flags per use, so sharing the objects across modules is safe.

// Personal data that must never leave the machine on Setayesh's own initiative.
// Ordered longest-match-first so a broad pattern (card) can't consume half of a
// longer one (IBAN) and leave the rest visible.
const PII_PATTERNS = [
  { name: 'email', re: /[\w.+-]+@[\w-]+\.[\w.]{2,}/g },
  { name: 'iban', re: /\b[A-Z]{2}\d{2}[A-Z0-9]{10,30}\b/g },
  { name: 'phone', re: /(?:\+|00)\d[\d\s().-]{7,17}\d/g },
  { name: 'card', re: /\b(?:\d[ -]?){13,19}\b/g },
  { name: 'ip', re: /\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/g },
];

// High-value kinds — always stripped from a family member's message, never
// negotiable.
const HIGH_VALUE = ['card', 'iban', 'ssn', 'apikey', 'password'];

// Credentials/secrets in a typed message (an API key, a national ID, "my
// password is …"). Stripped before the message reaches any provider.
const SECRET_PATTERNS = [
  { name: 'apikey',   re: /\b(?:sk-[A-Za-z0-9_-]{20,}|gsk_[A-Za-z0-9]{20,}|AIza[A-Za-z0-9_-]{20,}|ghp_[A-Za-z0-9]{20,}|xox[baprs]-[A-Za-z0-9-]{10,})\b/g },
  { name: 'ssn',      re: /\b\d{3}-\d{2}-\d{4}\b/g },
  { name: 'password', re: /(?:رمز(?:\s*عبور)?|پسورد|password|passwd)\s*(?:من|هست|است|is|=|:)\s*\S{4,}/gi },
];

// Persian labels for each detected kind, shown to the user when something is held back.
const KIND_LABEL = {
  name: 'نام اعضای خانواده', email: 'ایمیل', phone: 'شماره تلفن',
  iban: 'شماره حساب بانکی', card: 'شماره کارت', ip: 'آدرس شبکه',
  apikey: 'کلید API', ssn: 'کد ملی/تأمین اجتماعی', password: 'رمز عبور',
};

module.exports = { PII_PATTERNS, HIGH_VALUE, SECRET_PATTERNS, KIND_LABEL };
