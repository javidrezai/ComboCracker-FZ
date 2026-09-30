'use strict';

// language.js — which language is this, is the grammar right, and how does a
// letter in that language actually have to look.
//
// Three languages, because those are the three this family lives in: Persian
// at home, English by default, German for school, work and every Amt letter.
//
//   detect(text)                  fa / en / de, with a reason for the guess
//   check(text, lang)             concrete mistakes, with position and a fix
//   letterConventions(...)        how a letter is really written in that
//                                 language at that level of formality
//
// WHAT THIS IS. A deterministic checker for the mistakes people actually make
// and that a rule can catch reliably: Persian half-spaces and Arabic letters
// slipped into Persian words, English homophone mix-ups, German das/dass and
// noun capitalisation. It runs offline, instantly, and gives an exact
// character range so the app can underline the word.
//
// WHAT IT IS NOT. A parser. It does not know sentence structure, so it will
// not catch a wrong case ending in German or a mangled clause in Persian —
// that part is the model's job, and the model does it better with this list in
// front of it than without. Every issue carries a confidence, and anything
// below `sure` is offered as a question, never as a correction.

const ZWNJ = '‌';

// ---------------------------------------------------------------------------
// Detection
// ---------------------------------------------------------------------------
const DE_WORDS = ['der', 'die', 'das', 'und', 'ist', 'nicht', 'ich', 'sie', 'mit', 'für', 'auf',
  'ein', 'eine', 'einen', 'dem', 'den', 'des', 'zu', 'von', 'auch', 'aber', 'wenn', 'wird',
  'werden', 'haben', 'hat', 'sind', 'bitte', 'sehr', 'kann', 'noch', 'schon', 'nach', 'über',
  'dass', 'wie', 'was', 'wir', 'ihr', 'mir', 'mich', 'dich', 'sich', 'im', 'am', 'beim'];
const EN_WORDS = ['the', 'and', 'is', 'to', 'of', 'in', 'it', 'you', 'that', 'for', 'on', 'with',
  'as', 'are', 'this', 'be', 'have', 'not', 'but', 'they', 'from', 'or', 'we', 'can', 'will',
  'would', 'there', 'their', 'what', 'when', 'please', 'thanks', 'about', 'your', 'my'];

function words(text) {
  return String(text).toLowerCase().match(/[\p{L}']+/gu) || [];
}

function detect(text) {
  const s = String(text || '');
  if (!s.trim()) return { lang: '', confidence: 0, reason: 'متنی داده نشد.' };

  const persian = (s.match(/[؀-ۿ]/g) || []).length;
  const latin = (s.match(/[A-Za-zÄÖÜäöüß]/g) || []).length;
  const total = persian + latin;
  if (!total) return { lang: '', confidence: 0, reason: 'حرفی پیدا نشد.' };

  // Script settles Persian instantly; nothing else in this house uses it.
  if (persian / total > 0.5) {
    return { lang: 'fa', confidence: Math.min(0.99, 0.6 + persian / total * 0.4),
      script: 'arabic', mixed: latin > 0, reason: 'حروف فارسی' };
  }

  // Latin: decide between German and English on stop words, then on the
  // letters only German has. Counting distinct matches rather than total
  // stops one repeated word from deciding the whole text.
  const w = words(s);
  const de = new Set(), en = new Set();
  for (const x of w) {
    if (DE_WORDS.includes(x)) de.add(x);
    if (EN_WORDS.includes(x)) en.add(x);
  }
  let deScore = de.size, enScore = en.size;
  const umlauts = (s.match(/[äöüßÄÖÜ]/g) || []).length;
  if (umlauts) deScore += Math.min(6, umlauts);
  // A capitalised word in mid-sentence is normal German and odd English.
  const midCaps = (s.match(/[a-zäöü]\s+[A-ZÄÖÜ][a-zäöüß]{2,}/g) || []).length;
  if (midCaps >= 2) deScore += 2;
  if (/\b(ing|tion|ly)\b|\w+ing\b/.test(s.toLowerCase())) enScore += 1;

  if (deScore === 0 && enScore === 0) {
    return { lang: 'en', confidence: 0.3, script: 'latin', reason: 'حروف لاتین، ولی کلمه‌ی شاخصی نبود — انگلیسی فرض شد.' };
  }
  const lang = deScore > enScore ? 'de' : 'en';
  const gap = Math.abs(deScore - enScore);
  return {
    lang, script: 'latin',
    confidence: Math.min(0.98, 0.5 + gap / Math.max(4, deScore + enScore) * 0.5),
    mixed: persian > 0,
    reason: lang === 'de'
      ? `کلمه‌های آلمانی: ${[...de].slice(0, 6).join('، ') || '—'}${umlauts ? ' + حروف ä/ö/ü/ß' : ''}`
      : `کلمه‌های انگلیسی: ${[...en].slice(0, 6).join(', ') || '—'}`,
  };
}

// ---------------------------------------------------------------------------
// The rules
// ---------------------------------------------------------------------------
// Each rule: { re, fix, why, confidence, kind }. `fix` may be a string with $1
// style back-references or a function. `confidence`: 'sure' means apply it,
// 'likely' means suggest it, 'maybe' means ask.

// ---- Persian --------------------------------------------------------------
// The half-space (ZWNJ) is the single most common Persian writing mistake, and
// the one people most want fixed: «می رود» is wrong, «میرود» is wrong,
// «می‌رود» is right. Same for the plural «ها» and the comparative «تر/ترین».
const FA_RULES = [
  { kind: 'نیم‌فاصله',
    re: /(^|[\s(«"])(ن?می)\s+([؀-ۿ]{2,})/g,
    fix: (m, p, a, b) => p + a + ZWNJ + b,
    why: 'پیشوند «می/نمی» با نیم‌فاصله به فعل می‌چسبد.', confidence: 'sure' },

  { kind: 'نیم‌فاصله',
    re: /([؀-ۿ]{2,})\s+(ها|های|هایی|هایم|هایت|هایش|هایمان|هایتان|هایشان)(?=$|[\s.،؛:!؟)»"])/g,
    fix: (m, a, b) => a + ZWNJ + b,
    why: 'نشانه‌ی جمع «ها» با نیم‌فاصله می‌چسبد.', confidence: 'sure' },

  { kind: 'نیم‌فاصله',
    re: /([؀-ۿ]{2,})\s+(تر|تری|ترین)(?=$|[\s.،؛:!؟)»"])/g,
    fix: (m, a, b) => a + ZWNJ + b,
    why: '«تر» و «ترین» با نیم‌فاصله می‌چسبند.', confidence: 'likely' },

  { kind: 'حرف عربی',
    re: /ي/g, fix: 'ی',
    why: '«ي» عربی است؛ در فارسی «ی» درست است.', confidence: 'sure' },
  { kind: 'حرف عربی',
    re: /ك/g, fix: 'ک',
    why: '«ك» عربی است؛ در فارسی «ک» درست است.', confidence: 'sure' },
  { kind: 'رقم عربی',
    re: /[٠١٢٣٤٥٦٧٨٩]/g,
    fix: (m) => '۰۱۲۳۴۵۶۷۸۹'['٠١٢٣٤٥٦٧٨٩'.indexOf(m)],
    why: 'رقم‌های عربی با رقم‌های فارسی جایگزین شدند.', confidence: 'likely' },

  { kind: 'املا', re: /(?<![؀-ۿ])بخاطر(?![؀-ۿ])/g, fix: 'به خاطر', why: '«به خاطر» جداست.', confidence: 'sure' },
  { kind: 'املا', re: /(?<![؀-ۿ])بدلیل(?![؀-ۿ])/g, fix: 'به دلیل', why: '«به دلیل» جداست.', confidence: 'sure' },
  { kind: 'املا', re: /(?<![؀-ۿ])بعلت(?![؀-ۿ])/g, fix: 'به علت', why: '«به علت» جداست.', confidence: 'sure' },
  { kind: 'املا', re: /(?<![؀-ۿ])درصورتیکه(?![؀-ۿ])/g, fix: 'در صورتی که', why: 'جدا نوشته می‌شود.', confidence: 'sure' },
  { kind: 'املا', re: /(?<![؀-ۿ])هیچگونه(?![؀-ۿ])/g, fix: 'هیچ‌گونه', why: 'با نیم‌فاصله.', confidence: 'likely' },
  { kind: 'املا', re: /(?<![؀-ۿ])خوشحال\s*کننده(?![؀-ۿ])/g, fix: 'خوشحال‌کننده', why: 'با نیم‌فاصله.', confidence: 'likely' },
  { kind: 'املا', re: /گزاشت(ن|م|ی|ه|)/g, fix: (m, t) => 'گذاشت' + t,
    why: '«گذاشتن» با «ذ» است (قرار دادن).', confidence: 'likely' },
  { kind: 'املا', re: /(?<![؀-ۿ])ذخیم(?![؀-ۿ])/g, fix: 'ضخیم', why: '«ضخیم» با «ض».', confidence: 'sure' },
  { kind: 'املا', re: /(?<![؀-ۿ])اطاق(?![؀-ۿ])/g, fix: 'اتاق', why: '«اتاق» با «ت».', confidence: 'sure' },
  { kind: 'املا', re: /(?<![؀-ۿ])انشاالله(?![؀-ۿ])/g, fix: 'ان‌شاءالله', why: 'املای رایج‌تر.', confidence: 'maybe' },

  { kind: 'فاصله‌گذاری',
    re: /\s+([،؛:!؟.])/g, fix: (m, p) => p,
    why: 'قبل از نقطه و ویرگول فاصله نمی‌گذاریم.', confidence: 'sure' },
  { kind: 'فاصله‌گذاری',
    re: /([،؛:])(?=[^\s\d])/g, fix: (m, p) => p + ' ',
    why: 'بعد از ویرگول یک فاصله لازم است.', confidence: 'sure' },
  { kind: 'فاصله‌گذاری', re: /  +/g, fix: ' ', why: 'فاصله‌ی اضافی.', confidence: 'sure' },
  { kind: 'علامت',
    re: /([؀-ۿ])\s*,\s*/g, fix: (m, a) => a + '، ',
    why: 'در فارسی ویرگول «،» است، نه «,».', confidence: 'sure' },
  { kind: 'علامت',
    re: /([؀-ۿ])\s*\?/g, fix: (m, a) => a + '؟',
    why: 'در فارسی علامت سؤال «؟» است.', confidence: 'likely' },
  { kind: 'تکرار',
    re: /(?<![؀-ۿ])([؀-ۿ]{2,})\\s+\\1(?![؀-ۿ])/g, fix: (m, a) => a,
    why: 'این کلمه دو بار پشت سر هم آمده.', confidence: 'likely' },
];

// ---- English --------------------------------------------------------------
const EN_RULES = [
  { kind: 'homophone', re: /\bits\s+(a|the|been|not|very|too|so)\b/gi,
    fix: (m, w) => "it's " + w, why: "“it’s” = it is. “its” is possessive.", confidence: 'likely' },
  { kind: 'homophone', re: /\bit's\s+(own|color|name|size|place|value)\b/gi,
    fix: (m, w) => 'its ' + w, why: '“its” is the possessive; “it’s” means “it is”.', confidence: 'sure' },
  { kind: 'homophone', re: /\bthere\s+(is\s+)?(own|car|house|job|name|children|parents)\b/gi,
    fix: (m, a, b) => 'their ' + (a || '') + b, why: '“their” shows possession.', confidence: 'likely' },
  { kind: 'homophone', re: /\byour\s+(welcome|right|wrong|going|coming|the\s+best)\b/gi,
    fix: (m, w) => "you're " + w, why: '“you’re” = you are.', confidence: 'likely' },
  { kind: 'grammar', re: /\b(could|should|would|must|might)\s+of\b/gi,
    fix: (m, v) => v + ' have', why: '“could have”, never “could of”.', confidence: 'sure' },
  { kind: 'grammar', re: /\ba\s+([aeiouAEIOU]\w+)/g,
    fix: (m, w) => 'an ' + w, why: '“an” before a vowel sound.', confidence: 'likely' },
  { kind: 'grammar', re: /\ban\s+([^aeiouAEIOU\W]\w+)/g,
    fix: (m, w) => 'a ' + w, why: '“a” before a consonant sound.', confidence: 'likely' },
  { kind: 'capital', re: /(^|[.!?]\s+)([a-z])/g,
    fix: (m, p, c) => p + c.toUpperCase(), why: 'A sentence starts with a capital letter.', confidence: 'likely' },
  { kind: 'capital', re: /\bi\b/g, fix: 'I', why: '“I” is always capitalised.', confidence: 'sure' },
  { kind: 'repeat', re: /\b(\w+)\s+\1\b/gi, fix: (m, w) => w, why: 'This word is repeated.', confidence: 'likely' },
  { kind: 'spacing', re: /\s+([,.;:!?])/g, fix: (m, p) => p, why: 'No space before punctuation.', confidence: 'sure' },
  { kind: 'spacing', re: /([,;:])(?=[^\s\d])/g, fix: (m, p) => p + ' ', why: 'A space is needed after a comma.', confidence: 'sure' },
  { kind: 'spacing', re: /  +/g, fix: ' ', why: 'Double space.', confidence: 'sure' },
  { kind: 'spelling', re: /\brecieve(d|s|)\b/gi, fix: (m, t) => 'receive' + t, why: '“receive” — i before e except after c.', confidence: 'sure' },
  { kind: 'spelling', re: /\bseperate(d|s|ly|)\b/gi, fix: (m, t) => 'separate' + t, why: '“separate”.', confidence: 'sure' },
  { kind: 'spelling', re: /\bdefinately\b/gi, fix: 'definitely', why: '“definitely”.', confidence: 'sure' },
  { kind: 'spelling', re: /\boccured\b/gi, fix: 'occurred', why: '“occurred” — double r.', confidence: 'sure' },
  { kind: 'spelling', re: /\bteh\b/gi, fix: 'the', why: 'Typo.', confidence: 'sure' },
];

// ---- German ---------------------------------------------------------------
// das/dass is THE German mistake. The reliable half of the rule: after a comma,
// a subordinating "dass" is spelled with two s. The other direction (dass used
// where the article das belongs) needs real parsing, so it is only flagged as
// a question.
const DE_RULES = [
  { kind: 'das/dass', re: /(,\s*)das(?=\s+(?:ich|du|er|sie|es|wir|ihr|man|der|die|das|ein|eine|dieser|diese|alles|nichts)\b)/g,
    fix: (m, p) => p + 'dass',
    why: 'Nach einem Komma leitet „dass“ einen Nebensatz ein (mit zwei s).', confidence: 'likely' },
  { kind: 'das/dass', re: /\bdass\s+(Haus|Auto|Kind|Buch|Problem|Jahr|Thema)\b/g,
    fix: (m, w) => 'das ' + w,
    why: 'Vor einem Nomen steht der Artikel „das“ (ein s).', confidence: 'sure' },
  // Keep whatever case the writer used — at the start of a sentence the fix
  // has to stay capitalised, or correcting the spelling breaks the sentence.
  { kind: 'seit/seid', re: /\b(s)(eit)\s+(ihr)\b/gi, fix: (m, s1, rest, w) => s1 + 'eid ' + w,
    why: '„seid“ ist das Verb (ihr seid); „seit“ ist die Zeit.', confidence: 'sure' },
  { kind: 'seit/seid', re: /\b(s)eid\s+(gestern|heute|Montag|einem|einer|Jahren|Wochen|Tagen|langem)\b/gi,
    fix: (m, s1, w) => s1 + 'eit ' + w, why: '„seit“ für Zeitangaben.', confidence: 'sure' },
  { kind: 'wieder/wider', re: /\bwider\s+(sehen|kommen|holen|mal)\b/gi,
    fix: (m, w) => 'wieder' + w, why: '„wieder“ = noch einmal; „wider“ = gegen.', confidence: 'likely' },
  { kind: 'Groß-/Kleinschreibung',
    re: /\b(der|die|das|ein|eine|einen|einem|einer|dem|den|des|mein|meine|dein|deine|ihr|ihre|unser|unsere)\s+([a-zäöü][a-zäöüß]{3,})\b/gi,
    fix: (m, art, noun) => art + ' ' + noun[0].toUpperCase() + noun.slice(1),
    why: 'Nomen werden großgeschrieben.', confidence: 'maybe' },
  { kind: 'Rechtschreibung', re: /\b[Ss]trasse\b/g, fix: 'Straße', why: 'Nach langem Vokal steht ß (und Nomen groß).', confidence: 'likely' },
  { kind: 'Rechtschreibung', re: /\bgrüsse\b/gi, fix: 'Grüße', why: 'Mit ß und groß als Nomen.', confidence: 'likely' },
  { kind: 'Rechtschreibung', re: /\bStandart\b/g, fix: 'Standard', why: '„Standard“ mit d.', confidence: 'sure' },
  { kind: 'Rechtschreibung', re: /\bnähmlich\b/gi, fix: 'nämlich', why: '„nämlich“ ohne h.', confidence: 'sure' },
  { kind: 'Rechtschreibung', re: /\bzumindestens\b/gi, fix: 'zumindest', why: '„zumindest“ oder „mindestens“.', confidence: 'sure' },
  { kind: 'Rechtschreibung', re: /\bim\s+Moment\s+gerade\b/gi, fix: 'gerade', why: 'Doppelt gemoppelt.', confidence: 'maybe' },
  { kind: 'Wiederholung', re: /\b(\w{3,})\s+\1\b/gi, fix: (m, w) => w, why: 'Dieses Wort steht doppelt.', confidence: 'likely' },
  { kind: 'Abstand', re: /\s+([,.;:!?])/g, fix: (m, p) => p, why: 'Kein Leerzeichen vor dem Satzzeichen.', confidence: 'sure' },
  { kind: 'Abstand', re: /([,;:])(?=[^\s\d])/g, fix: (m, p) => p + ' ', why: 'Nach dem Komma ein Leerzeichen.', confidence: 'sure' },
  { kind: 'Abstand', re: /  +/g, fix: ' ', why: 'Doppeltes Leerzeichen.', confidence: 'sure' },
];

const RULES = { fa: FA_RULES, en: EN_RULES, de: DE_RULES };

// ---------------------------------------------------------------------------
// check()
// ---------------------------------------------------------------------------
// Runs every rule for the language and returns the issues WITH positions, plus
// a corrected version built from the ones we are sure about. Overlapping hits
// are dropped (first rule wins) so two rules never fight over the same words.
function check(text, lang, opts) {
  opts = opts || {};
  const src = String(text || '');
  if (!src.trim()) return { lang: '', issues: [], corrected: src, note: 'متنی داده نشد.' };

  const det = lang ? { lang, confidence: 1, reason: 'زبان دستی انتخاب شد.' } : detect(src);
  const rules = RULES[det.lang];
  if (!rules) {
    return { lang: det.lang || '', detection: det, issues: [], corrected: src,
      note: 'برای این زبان قانون گرامری تعریف نشده — فقط فارسی، انگلیسی و آلمانی.' };
  }

  // Arabic letters that Persian spells differently (ي/ك and the Arabic digits)
  // are ONE-FOR-ONE replacements, so normalising a copy for matching keeps
  // every character position valid while letting the later rules see the word
  // as it should be spelled. Without this, «مي خرم» never matches the «می»
  // rule and only half the sentence gets fixed.
  const norm = det.lang === 'fa'
    ? src.replace(/ي/g, 'ی').replace(/ك/g, 'ک')
        .replace(/[٠١٢٣٤٥٦٧٨٩]/g, (c) => '۰۱۲۳۴۵۶۷۸۹'['٠١٢٣٤٥٦٧٨٩'.indexOf(c)])
    : src;

  const issues = [];
  const taken = [];                // [start, end) ranges already claimed
  const overlaps = (a, b) => taken.some(([s, e]) => a < e && b > s);

  // Certain fixes claim their text before speculative ones do. Otherwise a
  // "maybe" rule that happens to sit earlier in the list wins the range and
  // the reliable correction never runs.
  const ORDER = { sure: 0, likely: 1, maybe: 2 };
  const ordered = rules.slice().sort((a, b) => ORDER[a.confidence] - ORDER[b.confidence]);

  for (const rule of ordered) {
    const re = new RegExp(rule.re.source, rule.re.flags.includes('g') ? rule.re.flags : rule.re.flags + 'g');
    let m;
    let guard = 0;
    while ((m = re.exec(norm)) !== null && guard++ < 4000) {
      if (m[0] === '') { re.lastIndex++; continue; }
      const start = m.index, end = m.index + m[0].length;
      if (overlaps(start, end)) continue;
      const replacement = typeof rule.fix === 'function' ? rule.fix(...m) : m[0].replace(rule.re, rule.fix);
      if (replacement === m[0]) continue;             // nothing would change
      taken.push([start, end]);
      issues.push({
        kind: rule.kind, confidence: rule.confidence, why: rule.why,
        start, end, found: src.slice(start, end), suggestion: replacement,
        line: src.slice(0, start).split('\n').length,
      });
    }
  }

  issues.sort((a, b) => a.start - b.start);

  // Build the corrected text. Only `sure` fixes are applied by default: a
  // "likely" fix that turns out wrong is worse than leaving the sentence as
  // the person wrote it, because they will not re-read what looks finished.
  const apply = opts.apply === 'all' ? ['sure', 'likely', 'maybe']
    : opts.apply === 'likely' ? ['sure', 'likely'] : ['sure'];
  let corrected = '';
  let cursor = 0;
  for (const it of issues) {
    if (!apply.includes(it.confidence)) continue;
    if (it.start < cursor) continue;
    corrected += src.slice(cursor, it.start) + it.suggestion;
    cursor = it.end;
  }
  corrected += src.slice(cursor);

  const counts = {};
  for (const it of issues) counts[it.kind] = (counts[it.kind] || 0) + 1;

  return {
    lang: det.lang,
    detection: det,
    issues,
    counts,
    applied: issues.filter((i) => apply.includes(i.confidence)).length,
    corrected,
    changed: corrected !== src,
    note: 'این بررسی قانون‌محور است: غلط‌های رایج و قابل‌اطمینان را می‌گیرد، '
      + 'ولی ساختار جمله را تحلیل نمی‌کند. برای بازنویسی روان‌تر، متن را به خود ستایش بده.',
  };
}

// ---------------------------------------------------------------------------
// Letters and e-mail
// ---------------------------------------------------------------------------
// A German formal letter is not an English one with German words in it. The
// salutation, the closing, where the date goes and whether you say Sie or du
// are fixed conventions, and getting them wrong is what makes a letter read as
// foreign. This hands the model the real conventions so the letter comes out
// right the first time.
const LETTER = {
  de: {
    name: 'آلمانی',
    formal: {
      salutationKnown: 'Sehr geehrte Frau {last}, / Sehr geehrter Herr {last},',
      salutationUnknown: 'Sehr geehrte Damen und Herren,',
      closing: 'Mit freundlichen Grüßen',
      address: 'du/Sie: immer **Sie**, groß geschrieben',
      notes: [
        'Nach der Anrede folgt ein KOMMA, und der erste Satz beginnt klein.',
        'Betreff ohne das Wort „Betreff:“ — nur die Sache, fett oder normal.',
        'Datum rechts oben: Ort, TT.MM.JJJJ (z. B. Berlin, 11.09.2026).',
        'Kurze Absätze, ein Gedanke pro Absatz, keine Ausrufezeichen.',
        'Am Ende: Grußformel, Leerzeile, Name. Bei Anhängen: „Anlagen:“.',
      ],
      amt: 'Bei Behörden (Amt, Jobcenter, Ausländerbehörde): Aktenzeichen/Kundennummer '
        + 'IMMER oben nennen, sachlich bleiben, eine konkrete Bitte oder Frage pro Brief, '
        + 'und eine Frist nennen, wenn es eine gibt.',
    },
    informal: {
      salutationKnown: 'Hallo {first}, / Liebe(r) {first},',
      salutationUnknown: 'Hallo,',
      closing: 'Viele Grüße / Liebe Grüße',
      address: 'du, klein geschrieben',
      notes: ['Nach der Anrede Komma, erster Satz klein.', 'Locker, aber keine Abkürzungen wie „lg“ in einer ersten Mail.'],
    },
  },
  en: {
    name: 'انگلیسی',
    formal: {
      salutationKnown: 'Dear Mr/Ms {last},',
      salutationUnknown: 'Dear Sir or Madam,',
      closing: 'Yours sincerely (named person) / Yours faithfully (unnamed)',
      address: 'formal, no contractions',
      notes: [
        'Subject line: short and specific, no “Hello” in it.',
        'One idea per paragraph; say what you want in the first three lines.',
        'Date format for the UK: 11 September 2026. For the US: September 11, 2026.',
      ],
    },
    informal: {
      salutationKnown: 'Hi {first},',
      salutationUnknown: 'Hi there,',
      closing: 'Best / Thanks / Cheers',
      address: 'relaxed, contractions are fine',
      notes: ['Get to the point in the first line.', 'Short sentences read as confident, not curt.'],
    },
  },
  fa: {
    name: 'فارسی',
    formal: {
      salutationKnown: 'جناب آقای {last} / سرکار خانم {last}،',
      salutationUnknown: 'با سلام و احترام،',
      closing: 'با تشکر و احترام',
      address: 'شما، با فعل جمع',
      notes: [
        'با «با سلام و احترام» شروع کن، بعد یک خط خالی.',
        'موضوع را در دو خط اول روشن بگو؛ مقدمه‌ی طولانی ننویس.',
        'تاریخ بالا سمت راست. اگر شماره‌ی پرونده هست، همان اول بیاور.',
        'در پایان: «با تشکر و احترام»، خط خالی، نام و نام خانوادگی.',
      ],
    },
    informal: {
      salutationKnown: 'سلام {first} جان،',
      salutationUnknown: 'سلام،',
      closing: 'قربانت / مرسی',
      address: 'تو، خودمانی',
      notes: ['راحت بنویس، همان‌طور که حرف می‌زنی.'],
    },
  },
};

function letterConventions(lang, formality, opts) {
  opts = opts || {};
  const L = LETTER[lang] || LETTER.en;
  const level = formality === 'informal' ? 'informal' : 'formal';
  const c = L[level] || L.formal;
  const known = opts.recipientName ? 'salutationKnown' : 'salutationUnknown';
  let salutation = c[known];
  if (opts.recipientName) {
    const parts = String(opts.recipientName).trim().split(/\s+/);
    salutation = salutation
      .replace(/\{last\}/g, parts[parts.length - 1])
      .replace(/\{first\}/g, parts[0]);
  }
  const notes = [...(c.notes || [])];
  if (level === 'formal' && lang === 'de' && opts.authority) notes.push(L.formal.amt);
  return {
    language: lang, languageName: L.name, formality: level,
    salutation, closing: c.closing, addressForm: c.address,
    rules: notes,
    reminder: lang === 'de'
      ? 'اگر مطمئن نیستی، رسمی بنویس — در آلمان نامه‌ی زیادی رسمی مشکلی ندارد، نامه‌ی زیادی خودمانی دارد.'
      : '',
  };
}

module.exports = {
  detect, check, letterConventions,
  FA_RULES, EN_RULES, DE_RULES, LETTER, ZWNJ,
};
