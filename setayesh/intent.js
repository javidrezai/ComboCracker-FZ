'use strict';
// Pure intent detectors, split out of index.js (no shared state): does this
// message ask to DRAW an image, does it want a live WEB search, and does it ask
// for a multi-model COUNCIL/cross-check. All are pure functions of the message
// text and are unit-tested in smoke.test.js.

// "make me a picture of…" — but NOT "what is this picture?" (that's vision).
function wantsImage(message) {
  const m = String(message || '').toLowerCase().trim();
  if (!m) return false;
  if (/(توضیح|چیست|چیه|describe|what('| i)s|analyze|read).{0,20}(این )?(عکس|تصویر|image|picture|photo)/.test(m)) return false;
  const fa = /(بکش|نقاشی(‌| )?کن|طراحی(‌| )?کن|تصویر(ی)?( از| بساز| درست)|عکس(ی)?( از| بساز| درست)|یه تصویر|یک تصویر|یه عکس|یک عکس|لوگو( بساز| طراحی)|پوستر( بساز| طراحی))/;
  const en = /\b(draw|paint|sketch|render|generate|create|make|design)\b.{0,24}\b(image|picture|photo|illustration|logo|poster|drawing|art|wallpaper|icon)\b/;
  const en2 = /\b(image|picture|photo|illustration) of\b/;
  return fa.test(m) || en.test(m) || en2.test(m);
}

// Fresh-info questions that benefit from live web grounding.
function wantsSearch(message) {
  const m = String(message || '').toLowerCase();
  if (!m) return false;
  const fa = /(امروز|الان|همین حالا|اخبار|خبر|جدیدترین|آخرین|تازه‌ترین|قیمت|نرخ|چند(م| است| شد)|هوا|آب و هوا|نتیجه|امسال|پارسال|دیروز|فردا|کی برنده|زنده)/;
  const en = /\b(today|right now|latest|newest|current|currently|news|price|stock|weather|score|this year|yesterday|tomorrow|who won|as of|202[4-9]|near me)\b/;
  return fa.test(m) || en.test(m);
}

// "ask several models and cross-check" — the council/consensus mode.
const COUNCIL_TRIGGERS = /(چند\s*مدل|چند\s*هوش\s*مصنوعی|چند\s*تا\s*ای‌?آی|مطمئن\s*شو|مطمئن\s*باش|با\s*هم\s*مشورت|مشورت\s*کن|حالت\s*شورا|دقیق‌?ترین\s*جواب|چک\s*کن\s*با|صحت\s*بسنج|consensus|multiple models|cross[- ]check|double[- ]check)/i;
function wantsCouncil(message) {
  return COUNCIL_TRIGGERS.test(message || '');
}

module.exports = { wantsImage, wantsSearch, wantsCouncil, COUNCIL_TRIGGERS };
