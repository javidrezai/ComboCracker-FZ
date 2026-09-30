'use strict';
// Owner directives — the admin's standing instructions/notes that are injected
// into EVERY engine's system prompt at top priority (the "direct line to the
// brain"). Split out of index.js so the formatting/clamping is pure and
// unit-tested; index.js keeps the file I/O and wires reindexInsight around it.

// Cap so a runaway paste can't blow up every prompt.
function clampDirectives(text) {
  return String(text == null ? '' : text).slice(0, 8000);
}

// Build the system-prompt block. Empty in → empty out (nothing injected).
function directivesBlock(text) {
  const t = (text || '').trim();
  if (!t) return '';
  return '\n\n*** دستورهای همیشگیِ صاحبِ خانه (بالاترین اولویت) ***\n'
    + 'این‌ها را خودِ ادمین نوشته و همیشه رعایتشان کن، مگر با ایمنی در تضاد باشد:\n'
    + t;
}

module.exports = { clampDirectives, directivesBlock };
