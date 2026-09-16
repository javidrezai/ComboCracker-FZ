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
       .replace(/<\|[^|]*\|>/g, ' ');       // harmony channel tokens <|...|>
  return t.replace(/[ \t]{2,}/g, ' ').replace(/\n{3,}/g, '\n\n').trim();
}

module.exports = { toPlainText, parseTextToolCalls, stripToolNoise };
