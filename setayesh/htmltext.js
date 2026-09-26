'use strict';
// Pure HTML/XML → plain-text converters, split out of index.js. No shared
// state. xmlToText feeds the Office/ODF extractors; htmlToText feeds webFetch
// and the website reader.

function xmlToText(xml) {
  return String(xml)
    .replace(/<w:br[^>]*\/?>/g, '\n')
    .replace(/<\/w:p>/g, '\n')
    .replace(/<\/a:p>/g, '\n')
    .replace(/<\/text:p>/g, '\n')
    .replace(/<\/row>/gi, '\n')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&#x([0-9a-fA-F]+);/g, (m, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (m, d) => String.fromCodePoint(parseInt(d, 10)))
    .replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"').replace(/&apos;/g, "'")
    .replace(/&amp;/g, '&')
    .replace(/[ \t ]+/g, ' ')
    .replace(/\n\s*\n\s*\n+/g, '\n\n')
    .trim();
}

function htmlToText(html) {
  return String(html)
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, ' ')
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/<\/(p|div|h[1-6]|li|tr|section|article|br)>/gi, '\n')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'")
    .replace(/[ \t]+/g, ' ')
    .replace(/\n\s*\n\s*\n+/g, '\n\n')
    .trim();
}

// The reverse direction: a plain/Markdown-ish text → a self-contained printable
// HTML page (so Ctrl+P yields a PDF with no PDF library). RTL is auto-detected
// from Arabic-script characters.
function textToPrintableHtml(text, title) {
  const esc = (x) => String(x).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const body = esc(text)
    .replace(/^### (.*)$/gm, '<h3>$1</h3>')
    .replace(/^## (.*)$/gm, '<h2>$1</h2>')
    .replace(/^# (.*)$/gm, '<h1>$1</h1>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\n{2,}/g, '</p><p>').replace(/\n/g, '<br>');
  const rtl = /[؀-ۿ]/.test(text);
  return `<!doctype html><html lang="${rtl ? 'fa' : 'en'}" dir="${rtl ? 'rtl' : 'ltr'}"><meta charset="utf-8">
<title>${esc(title || 'document')}</title><style>
body{font-family:"Segoe UI",Tahoma,sans-serif;line-height:1.9;max-width:800px;margin:40px auto;padding:0 24px;color:#111}
h1,h2,h3{margin:1.4em 0 .5em} code{background:#f3f4f6;padding:2px 6px;border-radius:4px;font-family:Consolas,monospace}
@media print{body{margin:0;max-width:none}} @page{margin:2cm}
</style><body><p>${body}</p></body></html>`;
}

module.exports = { xmlToText, htmlToText, textToPrintableHtml };
