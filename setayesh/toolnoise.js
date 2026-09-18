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

module.exports = { toPlainText, parseTextToolCalls, stripToolNoise };
