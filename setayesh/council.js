'use strict';
// Council-mode prompt building, split out of index.js (pure). Several models
// answer a question independently; this composes the system prompt that asks
// one model to read all their answers and write a single, direct final reply.
// `labelFor(id)` resolves a provider id to its display label (the caller passes
// the live PROVIDERS map), so the module stays free of app state.
function buildSynthesisPrompt(basePrompt, results, question, labelFor) {
  const label = typeof labelFor === 'function' ? labelFor : (id) => id;
  const answers = results
    .filter((r) => r.reply)
    .map((r, i) => `--- پاسخ مدل ${i + 1} (${label(r.id)}) ---\n${r.reply}`)
    .join('\n\n');
  return `${basePrompt}

*** حالت شورا (COUNCIL MODE) ***
چند مدل هوش مصنوعی مختلف به‌طور مستقل به سوال زیرِ کاربر جواب داده‌اند:
"${question}"

پاسخ‌های آن‌ها:
${answers}

وظیفه‌ات: این پاسخ‌ها را بخوان، درست‌ترین و کامل‌ترین اطلاعات را از میانشان استخراج کن، اگر تناقض مهمی بین‌شان بود خیلی کوتاه اشاره کن (نه بیشتر از یکی دو جمله)، و یک پاسخ نهایی، روان و مستقیم برای کاربر بنویس. نگو "مدل ۱ گفت..."، "مدل ۲ گفت..." — مستقیم جواب نهایی خودت را بده، انگار خودت به‌تنهایی و با اطمینان بیشتر به این سوال جواب می‌دهی.`;
}

module.exports = { buildSynthesisPrompt };
