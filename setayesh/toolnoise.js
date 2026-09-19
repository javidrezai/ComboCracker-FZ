'use strict';
// ---------------------------------------------------------------------------
// Tool-call noise: parse & strip
// ---------------------------------------------------------------------------
// Some non-Anthropic models — gpt-oss "harmony" especially — emit a tool call
// as PLAIN TEXT, e.g. `<tool_call>{"name":"web_search","arguments":{…}}</tool_call>`,
// instead of the structured OpenAI `tool_calls` field. If that text reaches a
// person it looks like gibberish (the "茏 {"name":"web_search"…}" seen on
// Telegram). These pure helpers let the caller RUN such calls for real and
// guarantee no reply ever ships with raw tool-call / harmony tokens still in it.

const TOOL_CALL_TAG_RE = /<tool_call>\s*([\s\S]*?)\s*<\/tool_call>/gi;

function toPlainText(content) {
  if (typeof content === 'string') return content;
  if (Array.isArray(content)) return content.filter((p) => p && p.type === 'text').map((p) => p.text).join('\n');
  return content == null ? '' : String(content);
}

// Extract tool calls that a model wrote as text. Returns [{name, arguments}].
function parseTextToolCalls(content) {
  const text = toPlainText(content);
  const out = [];
  let m;
  TOOL_CALL_TAG_RE.lastIndex = 0;
  while ((m = TOOL_CALL_TAG_RE.exec(text))) {
    try {
      const obj = JSON.parse(m[1]);
      if (obj && obj.name) out.push({ name: String(obj.name), arguments: obj.arguments || obj.parameters || {} });
    } catch (e) { /* not valid JSON — leave it to the stripper */ }
  }
  // A reply that is ONLY a bare JSON tool object, with no wrapper tag.
  if (!out.length) {
    const t = text.trim();
    if (t[0] === '{' && /"name"\s*:/.test(t) && /"arguments"\s*:|"parameters"\s*:/.test(t)) {
      try {
        const obj = JSON.parse(t);
        if (obj && obj.name && (obj.arguments || obj.parameters)) out.push({ name: String(obj.name), arguments: obj.arguments || obj.parameters || {} });
      } catch (e) {}
    }
  }
  return out;
}

// Remove any leftover tool-call / harmony tokens so a reply reads as plain text.
function stripToolNoise(content) {
  let t = toPlainText(content);
  t = t.replace(TOOL_CALL_TAG_RE, ' ')      // whole <tool_call>…</tool_call> blocks
       .replace(/<\/?tool_call>/gi, ' ')    // stray, unbalanced tags
       .replace(/<\|[^|]*\|>/g, ' ')        // harmony channel tokens <|...|>
       // Bare tool-call JSON the model wrote as TEXT instead of calling the tool:
       //   {"name":"web_search","arguments":{"query":"…","count":5}}
       // parseTextToolCalls runs it; this makes sure the raw JSON never reaches a
       // person (the '诓 {"name":"web_search",…}' that leaked to جاوید on Telegram).
       // Handles one level of nesting in the arguments object, either field order.
       .replace(/\{\s*"(?:name|tool|function)"\s*:\s*"[^"]+"\s*,\s*"(?:arguments|parameters|args)"\s*:\s*(?:\{[^{}]*\}|\[[^\]]*\]|"[^"]*"|[^,}]+)\s*\}/gi, ' ')
       .replace(/\{\s*"(?:arguments|parameters|args)"\s*:\s*(?:\{[^{}]*\}|\[[^\]]*\]|"[^"]*"|[^,}]+)\s*,\s*"(?:name|tool|function)"\s*:\s*"[^"]+"\s*\}/gi, ' ');
  t = t.replace(/[ \t]{2,}/g, ' ').replace(/\n{3,}/g, '\n\n').trim();
  // A whole reply that is nothing but a bare tool name — a weak model emitted the
  // tool it meant to CALL as its answer (the "web_fetch" / "web_search" that
  // reached جاوید instead of a weather answer). A single snake_case identifier,
  // optionally with (), is never a real human reply, so drop it and let the
  // caller fail over to an engine that actually runs the tool.
  if (/^[a-z][a-z0-9]*_[a-z0-9_]*(\s*\(\s*\))?$/i.test(t) || /^[a-z][a-z0-9_]*\(\s*\)$/i.test(t)) return '';
  // What's left is only stray symbols / CJK garbage (e.g. a lone "诓" a broken
  // model prepended to the tool call) — not a real answer in this Persian/English
  // household, so drop it and let the caller fail over.
  if (t && !/[؀-ۿA-Za-z0-9]/.test(t)) return '';
  return t;
}

// Strip links from a reply for a channel where the owner asked for NONE (his
// standing Telegram rule: "هیچ‌وقت لینک نده تا ازت نخواستم"). A weak model kept
// dumping markdown links and even a hallucinated Google-Maps image URL with a
// fake API key; the prompt rule alone didn't stop it, so this removes them
// deterministically: image markdown gone, [text](url) → text, bare URLs dropped.
function stripLinks(content) {
  let t = toPlainText(content);
  t = t.replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')                 // ![alt](url) images — remove whole thing
       .replace(/\[([^\]]+)\]\((?:[^)]*)\)/g, '$1')           // [text](url) → text
       .replace(/\bhttps?:\/\/[^\s)]+/gi, ' ')                // bare URLs
       .replace(/\bwww\.[^\s)]+/gi, ' ')                      // bare www.… hosts
       // A leftover "Links / لینک‌ها:" heading and its "- WebFetch: X" / "- web_fetch(…)"
       // bullet lines — the model narrating a tool it wanted to use. Drop them.
       .replace(/^\s*(?:🔗\s*)?(?:لینک‌ها|links)\s*(?:\/\s*(?:لینک‌ها|links))?\s*:.*$/gim, '')
       .replace(/^\s*[-•]\s*(?:web[_ ]?fetch|web[_ ]?search)\b.*$/gim, '')
       .replace(/[ \t]{2,}/g, ' ')
       .replace(/[ \t]+([.,!؟?])/g, '$1')                     // tidy space left before punctuation
       .replace(/\(\s*\)/g, ' ')                              // empty () left by a removed url
       .replace(/^[\s\-–—•]+$/gm, '')                         // lines that were only a bullet + link
       .replace(/\n{3,}/g, '\n\n')
       .trim();
  return t;
}

// Does the user's own message ask for a link/site/address? Then links are fine.
function wantsLink(message) {
  return /لینک|نشانی|آدرس(?!\s*ایمیل)|سایت|وب\s*سایت|url|link|website/i.test(String(message || ''));
}

// Telegram brevity net. The owner's standing order: answers must be DIRECT and
// CLEAN — "not GPT/Claude-style rambling". The prompt asks for it, but weak
// models still open with a greeting/agreement throat-clear ("سلام! بله، البته…")
// and close with a meta-offer ("اگر سؤال دیگری داری بپرس"، "در خدمتم"). This
// removes ONLY those wrappers so the real answer stands on its own. Deliberately
// conservative — it strips known filler phrases at the very start/end, never
// touching the substance in between.
function tidyTelegram(content) {
  let t = toPlainText(content).trim();
  if (!t) return t;
  // Leading greeting / agreeable throat-clear, possibly a short run of them.
  const OPENERS = /^\s*(?:سلام(?:\s+عزیزم)?|درود|بله|آره|البته|حتماً|حتما|خب|خوب|باشه|اوکی|اوکِی|عالیه|چه\s+سؤال\s+خوبی|چه\s+سوال\s+خوبی|سؤال\s+خوبی(?:ه|\s+است)|سوال\s+خوبی(?:ه|\s+است)|خواهش\s+می‌کنم)\s*[!،.:؛]+\s*/;
  let prev;
  do { prev = t; t = t.replace(OPENERS, ''); } while (t !== prev && t);
  // Trailing GPT-style meta-offer sentence(s). Includes the specific
  // "آیا نیازی به توضیحات بیشتری داری؟" / "آیا توضیح بیشتری می‌خواهی؟" filler the
  // owner flagged — but NOT a genuine trailing "آیا …؟" question (e.g. "آیا این
  // زمان مناسب است؟"), which is left intact.
  const TAIL = /(?:^|[\n.!؟?،])\s*(?:اگر\s+(?:سؤال|سوال|چیز|کمک|مورد)[^.!؟?\n]*|(?:سؤال|سوال|کمک|چیز)\s+دیگری[^.!؟?\n]*|می‌?(?:توانم|تونم)\s+(?:بیشتر|کمکِ|کمک)[^.!؟?\n]*|باز(?:م|\s+هم)\s+(?:بپرس|سؤال|سوال)[^.!؟?\n]*|هر\s+(?:سؤال|سوال|وقت)[^.!؟?\n]*بپرس[^.!؟?\n]*|در\s+خدمتم[^.!؟?\n]*|خوشحال\s+می‌?ش(?:وم|م)[^.!؟?\n]*|آیا\s+نیازی?\s+به\s+(?:توضیح|اطلاعاتِ?\s+بیشتر|کمک)[^.!؟?\n]*|آیا\s+(?:توضیحِ?|چیزِ?|کمکِ?|سؤالِ?|سوالِ?)\s*(?:بیشتری?|دیگری)[^.!؟?\n]*|آیا\s+می‌?خواه(?:ی|ید)[^.!؟?\n]*بیشتر[^.!؟?\n]*)[.!؟?]?\s*$/;
  do { prev = t; t = t.replace(TAIL, '').trim(); } while (t !== prev && t);
  // A trailing "for more, see the … website / go to …" nudge (no real link, just
  // the suggestion) — the owner wants direct answers, not "go look it up".
  t = t.replace(/(?:^|[\n.!؟?])\s*برای\s+اطلاعاتِ?\s+بیشتر[^.!؟?\n]*(?:مراجعه|سر\s*بزن|ببین|نگاه\s*کن)[^.!؟?\n]*[.!؟?]?\s*$/, '').trim();
  // "As an AI / assistant …" disclaimers anywhere.
  t = t.replace(/به\s+عنوان\s+(?:یک\s+)?(?:هوش\s+مصنوعی|دستیار|مدلِ?\s+زبانی)[^.!؟?\n]*[.!؟?]?/g, '').trim();
  return t.replace(/[ \t]{2,}/g, ' ').replace(/\n{3,}/g, '\n\n').trim();
}

module.exports = { toPlainText, parseTextToolCalls, stripToolNoise, stripLinks, wantsLink, tidyTelegram };
