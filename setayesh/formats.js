'use strict';

// formats.js — the file-format registry and the converter.
//
// Two jobs:
//
//   1. KNOW the formats. FORMATS below is the single list of every extension
//      Setayesh recognises: what family it belongs to, whether it can be read
//      as text, and what it can be turned into. The root FORMATS.md and the
//      brain note are GENERATED from this table (see writeFormatDocs), so the
//      documentation can never drift from what the code actually does.
//
//   2. CONVERT between them. Everything goes through one of three
//      intermediates instead of writing N x N converters:
//
//         text   a plain string
//         table  { columns: [...], rows: [[...]] }
//         doc    { title, blocks: [{ type, ... }] }
//
//      A reader turns a source file into an intermediate; a writer turns an
//      intermediate into a target file. Adding a format means adding one
//      reader and/or one writer, not touching everything else.
//
// Dependency rule (charter 2.1): stdlib only. That is not as limiting as it
// sounds — .docx, .xlsx and .pptx are ZIP archives full of XML, and a PDF's
// text lives in zlib streams, so `zlib` gets us real Office and PDF reading
// with nothing to install. What genuinely needs codecs (video, audio, raster
// image transcoding) is handed to ffmpeg / ImageMagick IF the machine already
// has them, and reported honestly when it does not. We never pretend.

const fs = require('fs');
const os = require('os');
const path = require('path');
const zlib = require('zlib');
const { execFile } = require('child_process');

// ---------------------------------------------------------------------------
// The registry
// ---------------------------------------------------------------------------
// family:   text | code | data | document | spreadsheet | slides | image |
//           audio | video | archive | font | binary
// text:     true if the bytes are human-readable as they are
// reads:    intermediate this file can be read INTO (null = not readable yet)
// writes:   intermediate this file can be written FROM (null = not writable)
// note:     shown in the docs when there is something to warn about

function F(family, mime, opts) {
  return Object.assign({ family, mime, text: false, reads: null, writes: null, note: '' }, opts || {});
}
const T = { text: true, reads: 'text', writes: 'text' };          // plain text in and out
const CODE = Object.assign({}, T);                                 // same, but flagged as code

const FORMATS = {
  // ---- plain text ----------------------------------------------------------
  txt:  F('text', 'text/plain', T),
  text: F('text', 'text/plain', T),
  log:  F('text', 'text/plain', T),
  md:   F('text', 'text/markdown', { text: true, reads: 'doc', writes: 'doc' }),
  markdown: F('text', 'text/markdown', { text: true, reads: 'doc', writes: 'doc' }),
  rst:  F('text', 'text/x-rst', T),
  adoc: F('text', 'text/asciidoc', T),
  tex:  F('text', 'application/x-tex', T),
  srt:  F('text', 'application/x-subrip', { text: true, reads: 'table', writes: 'table' }),
  vtt:  F('text', 'text/vtt', { text: true, reads: 'table', writes: 'table' }),

  // ---- code ---------------------------------------------------------------
  js: F('code', 'text/javascript', CODE), mjs: F('code', 'text/javascript', CODE),
  cjs: F('code', 'text/javascript', CODE), ts: F('code', 'text/typescript', CODE),
  tsx: F('code', 'text/typescript', CODE), jsx: F('code', 'text/javascript', CODE),
  py: F('code', 'text/x-python', CODE), rb: F('code', 'text/x-ruby', CODE),
  php: F('code', 'text/x-php', CODE), java: F('code', 'text/x-java', CODE),
  kt: F('code', 'text/x-kotlin', CODE), swift: F('code', 'text/x-swift', CODE),
  c: F('code', 'text/x-c', CODE), h: F('code', 'text/x-c', CODE),
  cpp: F('code', 'text/x-c++', CODE), cc: F('code', 'text/x-c++', CODE),
  hpp: F('code', 'text/x-c++', CODE), cs: F('code', 'text/x-csharp', CODE),
  go: F('code', 'text/x-go', CODE), rs: F('code', 'text/x-rust', CODE),
  lua: F('code', 'text/x-lua', CODE), pl: F('code', 'text/x-perl', CODE),
  r: F('code', 'text/x-r', CODE), m: F('code', 'text/x-matlab', CODE),
  scala: F('code', 'text/x-scala', CODE), dart: F('code', 'text/x-dart', CODE),
  sh: F('code', 'application/x-sh', CODE), bash: F('code', 'application/x-sh', CODE),
  zsh: F('code', 'application/x-sh', CODE), ps1: F('code', 'application/x-powershell', CODE),
  bat: F('code', 'application/x-bat', CODE), cmd: F('code', 'application/x-bat', CODE),
  sql: F('code', 'application/sql', CODE), vue: F('code', 'text/x-vue', CODE),
  svelte: F('code', 'text/x-svelte', CODE), asm: F('code', 'text/x-asm', CODE),
  ipynb: F('code', 'application/x-ipynb+json', { text: true, reads: 'doc', writes: null,
    note: 'دفترچه‌ی Jupyter — سلول‌های کد و متن جدا خوانده می‌شوند.' }),

  // ---- data / config ------------------------------------------------------
  json: F('data', 'application/json', { text: true, reads: 'table', writes: 'table' }),
  jsonl: F('data', 'application/x-ndjson', { text: true, reads: 'table', writes: 'table' }),
  ndjson: F('data', 'application/x-ndjson', { text: true, reads: 'table', writes: 'table' }),
  csv:  F('data', 'text/csv', { text: true, reads: 'table', writes: 'table' }),
  tsv:  F('data', 'text/tab-separated-values', { text: true, reads: 'table', writes: 'table' }),
  xml:  F('data', 'application/xml', { text: true, reads: 'doc', writes: 'doc' }),
  html: F('data', 'text/html', { text: true, reads: 'doc', writes: 'doc' }),
  htm:  F('data', 'text/html', { text: true, reads: 'doc', writes: 'doc' }),
  yaml: F('data', 'application/yaml', { text: true, reads: 'table', writes: 'table',
    note: 'YAML ساده (کلید: مقدار و فهرست‌ها). YAML خیلی پیچیده به متن خوانده می‌شود.' }),
  yml:  F('data', 'application/yaml', { text: true, reads: 'table', writes: 'table' }),
  toml: F('data', 'application/toml', { text: true, reads: 'table', writes: null }),
  ini:  F('data', 'text/plain', { text: true, reads: 'table', writes: 'table' }),
  cfg:  F('data', 'text/plain', { text: true, reads: 'table', writes: null }),
  conf: F('data', 'text/plain', { text: true, reads: 'table', writes: null }),
  env:  F('data', 'text/plain', { text: true, reads: 'table', writes: 'table',
    note: 'ممکن است کلید و رمز داشته باشد — ستایش مقدارها را در خروجی می‌پوشاند.' }),
  properties: F('data', 'text/plain', { text: true, reads: 'table', writes: 'table' }),

  // ---- documents ----------------------------------------------------------
  pdf:  F('document', 'application/pdf', { reads: 'text', writes: 'doc',
    note: 'متن PDF استخراج می‌شود؛ PDFِ اسکن‌شده متن ندارد (برای آن فایل را به چت بده تا با چشم بخوانمش).' }),
  docx: F('document', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    { reads: 'doc', writes: 'doc' }),
  doc:  F('document', 'application/msword', { reads: null, writes: null,
    note: 'فرمت قدیمی Word (باینری). در خود Word به .docx ذخیره کن تا خوانده شود.' }),
  odt:  F('document', 'application/vnd.oasis.opendocument.text', { reads: 'doc', writes: null }),
  rtf:  F('document', 'application/rtf', { text: true, reads: 'text', writes: 'text' }),
  epub: F('document', 'application/epub+zip', { reads: 'doc', writes: null }),

  // ---- spreadsheets & slides ---------------------------------------------
  xlsx: F('spreadsheet', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    { reads: 'table', writes: 'table' }),
  xls:  F('spreadsheet', 'application/vnd.ms-excel', { reads: null, writes: null,
    note: 'فرمت قدیمی Excel (باینری). در Excel به .xlsx ذخیره کن.' }),
  ods:  F('spreadsheet', 'application/vnd.oasis.opendocument.spreadsheet', { reads: 'table', writes: null }),
  pptx: F('slides', 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    { reads: 'doc', writes: null }),
  ppt:  F('slides', 'application/vnd.ms-powerpoint', { reads: null, writes: null,
    note: 'فرمت قدیمی PowerPoint (باینری). به .pptx ذخیره کن.' }),

  // ---- images -------------------------------------------------------------
  png:  F('image', 'image/png', { note: 'ابعاد و اطلاعات خوانده می‌شود؛ تبدیل به فرمت دیگر به ImageMagick/ffmpeg نیاز دارد.' }),
  jpg:  F('image', 'image/jpeg', {}), jpeg: F('image', 'image/jpeg', {}),
  gif:  F('image', 'image/gif', {}), bmp: F('image', 'image/bmp', {}),
  webp: F('image', 'image/webp', {}), tiff: F('image', 'image/tiff', {}),
  ico:  F('image', 'image/x-icon', {}), heic: F('image', 'image/heic', {}),
  avif: F('image', 'image/avif', {}),
  svg:  F('image', 'image/svg+xml', { text: true, reads: 'text', writes: 'text',
    note: 'SVG در واقع XML است، پس مثل متن خوانده و ویرایش می‌شود.' }),

  // ---- audio / video ------------------------------------------------------
  mp3: F('audio', 'audio/mpeg', {}), wav: F('audio', 'audio/wav', {}),
  m4a: F('audio', 'audio/mp4', {}), flac: F('audio', 'audio/flac', {}),
  ogg: F('audio', 'audio/ogg', {}), opus: F('audio', 'audio/opus', {}),
  aac: F('audio', 'audio/aac', {}), wma: F('audio', 'audio/x-ms-wma', {}),
  mp4: F('video', 'video/mp4', {}), mkv: F('video', 'video/x-matroska', {}),
  mov: F('video', 'video/quicktime', {}), avi: F('video', 'video/x-msvideo', {}),
  webm: F('video', 'video/webm', {}), wmv: F('video', 'video/x-ms-wmv', {}),
  flv: F('video', 'video/x-flv', {}), m4v: F('video', 'video/x-m4v', {}),

  // ---- archives -----------------------------------------------------------
  zip: F('archive', 'application/zip', { reads: 'table', writes: null,
    note: 'فهرست و محتوای فایل‌های داخلش خوانده می‌شود.' }),
  gz:  F('archive', 'application/gzip', { reads: 'text', writes: null }),
  tgz: F('archive', 'application/gzip', { reads: 'table', writes: null }),
  tar: F('archive', 'application/x-tar', { reads: 'table', writes: null }),
  bz2: F('archive', 'application/x-bzip2', { reads: null, writes: null }),
  xz:  F('archive', 'application/x-xz', { reads: null, writes: null }),
  '7z': F('archive', 'application/x-7z-compressed', { reads: null, writes: null,
    note: 'برای باز کردن به 7-Zip روی سیستم نیاز است.' }),
  rar: F('archive', 'application/vnd.rar', { reads: null, writes: null }),

  // ---- other --------------------------------------------------------------
  ttf: F('font', 'font/ttf', {}), otf: F('font', 'font/otf', {}),
  woff: F('font', 'font/woff', {}), woff2: F('font', 'font/woff2', {}),
  exe: F('binary', 'application/x-msdownload', { note: 'اجرایی ویندوز — ستایش آن را فقط بررسی می‌کند، هرگز اجرا نمی‌کند.' }),
  dll: F('binary', 'application/x-msdownload', {}),
  so:  F('binary', 'application/x-sharedlib', {}),
  bin: F('binary', 'application/octet-stream', {}),
  db:  F('binary', 'application/vnd.sqlite3', { reads: 'table', writes: null,
    note: 'پایگاه‌داده‌ی SQLite — فهرست جدول‌ها خوانده می‌شود.' }),
  sqlite: F('binary', 'application/vnd.sqlite3', { reads: 'table', writes: null }),
  sqlite3: F('binary', 'application/vnd.sqlite3', { reads: 'table', writes: null }),
};

// Which intermediates can be rendered into which target extensions.
const WRITERS = {
  text:  ['txt', 'md', 'html', 'rtf', 'csv', 'json', 'xml', 'pdf'],
  table: ['csv', 'tsv', 'json', 'jsonl', 'xlsx', 'md', 'html', 'txt', 'xml', 'yaml', 'ini', 'pdf'],
  doc:   ['md', 'html', 'txt', 'docx', 'rtf', 'json', 'pdf'],
};

function extOf(name) {
  const m = String(name || '').toLowerCase().match(/\.([a-z0-9]+)$/);
  return m ? m[1] : '';
}
function describe(ext) {
  ext = String(ext || '').toLowerCase().replace(/^\./, '');
  return FORMATS[ext] ? Object.assign({ ext }, FORMATS[ext]) : null;
}
// Every target this extension can become, using only what this machine has.
function conversionsFor(ext) {
  const f = describe(ext);
  if (!f) return [];
  const out = new Set();
  if (f.reads) for (const t of WRITERS[f.reads] || []) out.add(t);
  // Same-family media conversions are possible when a codec tool is installed.
  if (['image', 'audio', 'video'].includes(f.family)) {
    for (const [k, v] of Object.entries(FORMATS)) if (v.family === f.family) out.add(k);
  }
  out.delete(ext);
  return [...out].sort();
}

// ---------------------------------------------------------------------------
// A self-contained ZIP reader — .docx/.xlsx/.pptx/.odt/.epub are all ZIPs
// ---------------------------------------------------------------------------
function unzip(buf) {
  const files = {};
  let eocd = -1;
  for (let i = buf.length - 22; i >= 0 && i > buf.length - 66000; i--) {
    if (buf.readUInt32LE(i) === 0x06054b50) { eocd = i; break; }
  }
  if (eocd === -1) throw new Error('این فایل ZIP معتبر نیست.');
  const count = buf.readUInt16LE(eocd + 10);
  let p = buf.readUInt32LE(eocd + 16);
  for (let i = 0; i < count && p + 46 <= buf.length; i++) {
    if (buf.readUInt32LE(p) !== 0x02014b50) break;
    const method = buf.readUInt16LE(p + 10);
    const compSize = buf.readUInt32LE(p + 20);
    const nameLen = buf.readUInt16LE(p + 28);
    const extraLen = buf.readUInt16LE(p + 30);
    const commentLen = buf.readUInt16LE(p + 32);
    const localOff = buf.readUInt32LE(p + 42);
    const name = buf.slice(p + 46, p + 46 + nameLen).toString('utf8');
    if (!name.endsWith('/') && localOff + 30 <= buf.length) {
      const lNameLen = buf.readUInt16LE(localOff + 26);
      const lExtraLen = buf.readUInt16LE(localOff + 28);
      const start = localOff + 30 + lNameLen + lExtraLen;
      const raw = buf.slice(start, start + compSize);
      try { files[name] = method === 0 ? raw : zlib.inflateRawSync(raw); } catch (e) { /* skip */ }
    }
    p += 46 + nameLen + extraLen + commentLen;
  }
  return files;
}

const CRC = (() => {
  const t = new Int32Array(256);
  for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1); t[n] = c; }
  return t;
})();
function crc32(buf) {
  let c = -1;
  for (let i = 0; i < buf.length; i++) c = (c >>> 8) ^ CRC[(c ^ buf[i]) & 0xFF];
  return (c ^ -1) >>> 0;
}
// Deflated ZIP writer — needed to BUILD .docx and .xlsx, which Word and Excel
// will refuse to open if the archive is malformed.
function zip(entries) {
  const chunks = [], central = [];
  let offset = 0;
  for (const e of entries) {
    const nameBuf = Buffer.from(e.name, 'utf8');
    const data = Buffer.isBuffer(e.data) ? e.data : Buffer.from(String(e.data), 'utf8');
    const comp = zlib.deflateRawSync(data);
    const crc = crc32(data);
    const local = Buffer.alloc(30);
    local.writeUInt32LE(0x04034b50, 0); local.writeUInt16LE(20, 4); local.writeUInt16LE(0x0800, 6);
    local.writeUInt16LE(8, 8); local.writeUInt32LE(crc, 14);
    local.writeUInt32LE(comp.length, 18); local.writeUInt32LE(data.length, 22);
    local.writeUInt16LE(nameBuf.length, 26);
    chunks.push(local, nameBuf, comp);
    const cen = Buffer.alloc(46);
    cen.writeUInt32LE(0x02014b50, 0); cen.writeUInt16LE(20, 4); cen.writeUInt16LE(20, 6);
    cen.writeUInt16LE(0x0800, 8); cen.writeUInt16LE(8, 10); cen.writeUInt32LE(crc, 16);
    cen.writeUInt32LE(comp.length, 20); cen.writeUInt32LE(data.length, 24);
    cen.writeUInt16LE(nameBuf.length, 28); cen.writeUInt32LE(offset, 42);
    central.push(cen, nameBuf);
    offset += local.length + nameBuf.length + comp.length;
  }
  const centralBuf = Buffer.concat(central);
  const end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0);
  end.writeUInt16LE(entries.length, 8); end.writeUInt16LE(entries.length, 10);
  end.writeUInt32LE(centralBuf.length, 12); end.writeUInt32LE(offset, 16);
  return Buffer.concat([...chunks, centralBuf, end]);
}

// ---------------------------------------------------------------------------
// Small shared helpers
// ---------------------------------------------------------------------------
const xesc = (s) => String(s == null ? '' : s)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;').replace(/'/g, '&apos;');

function stripTags(html) {
  return String(html)
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(p|div|h[1-6]|li|tr)>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'")
    .replace(/\n{3,}/g, '\n\n').trim();
}

// A CSV parser that survives real files: quotes, embedded commas and newlines,
// doubled quotes, and CRLF.
function parseCsv(text, delim) {
  const d = delim || ',';
  const rows = [];
  let row = [], field = '', inQ = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQ) {
      if (c === '"') { if (text[i + 1] === '"') { field += '"'; i++; } else inQ = false; }
      else field += c;
    } else if (c === '"') inQ = true;
    else if (c === d) { row.push(field); field = ''; }
    else if (c === '\n') { row.push(field); rows.push(row); row = []; field = ''; }
    else if (c !== '\r') field += c;
  }
  if (field !== '' || row.length) { row.push(field); rows.push(row); }
  return rows.filter((r) => r.length && !(r.length === 1 && r[0] === ''));
}
function csvCell(v) {
  const s = v == null ? '' : String(v);
  return /[",\n\r]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
}

// Rows-of-objects <-> { columns, rows } — the table intermediate.
function tableFromObjects(list) {
  const cols = [];
  for (const o of list) for (const k of Object.keys(o || {})) if (!cols.includes(k)) cols.push(k);
  return {
    columns: cols,
    rows: list.map((o) => cols.map((c) => {
      const v = o ? o[c] : '';
      return v == null ? '' : (typeof v === 'object' ? JSON.stringify(v) : String(v));
    })),
  };
}
function tableToObjects(t) {
  return t.rows.map((r) => {
    const o = {};
    t.columns.forEach((c, i) => { o[c] = r[i] == null ? '' : r[i]; });
    return o;
  });
}

// ---------------------------------------------------------------------------
// READERS — source file -> intermediate
// ---------------------------------------------------------------------------

// Word: text lives in word/document.xml, one <w:p> per paragraph and the
// actual characters in <w:t>. Headings are named in <w:pStyle w:val="Heading1">.
function readDocx(buf) {
  const files = unzip(buf);
  const xml = (files['word/document.xml'] || Buffer.alloc(0)).toString('utf8');
  const blocks = [];
  const paras = xml.split(/<w:p[\s>]/).slice(1);
  for (const p of paras) {
    const runs = [...p.matchAll(/<w:t[^>]*>([\s\S]*?)<\/w:t>/g)].map((m) => m[1]);
    const txt = runs.join('')
      .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"')
      .replace(/&apos;/g, "'").replace(/&amp;/g, '&').trim();
    if (!txt) continue;
    const style = (p.match(/<w:pStyle\s+w:val="([^"]+)"/) || [])[1] || '';
    const h = style.match(/^Heading(\d)/i);
    if (h) blocks.push({ type: 'h' + Math.min(6, Number(h[1])), text: txt });
    // Word has no real bullet character in the text — Setayesh writes one when
    // it CREATES a .docx, so strip it again on the way back in or a round trip
    // grows a bullet every time.
    else if (/ListParagraph/i.test(style)) blocks.push({ type: 'li', text: txt.replace(/^[•·−–-]\s*/, '') });
    else blocks.push({ type: 'p', text: txt });
  }
  return { kind: 'doc', title: '', blocks };
}

// Excel: strings are pooled in sharedStrings.xml and referenced by index from
// each sheet's cells (t="s"). Cell refs are A1-style, so a row can skip
// columns and we have to place values by column letter, not by order.
function colIndex(ref) {
  const m = String(ref).match(/^([A-Z]+)/);
  if (!m) return 0;
  let n = 0;
  for (const ch of m[1]) n = n * 26 + (ch.charCodeAt(0) - 64);
  return n - 1;
}
function readXlsx(buf, opts) {
  const files = unzip(buf);
  const shared = [];
  const ss = files['xl/sharedStrings.xml'];
  if (ss) {
    for (const m of ss.toString('utf8').matchAll(/<si>([\s\S]*?)<\/si>/g)) {
      shared.push([...m[1].matchAll(/<t[^>]*>([\s\S]*?)<\/t>/g)].map((x) => x[1]).join('')
        .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&'));
    }
  }
  const sheetNames = Object.keys(files).filter((f) => /^xl\/worksheets\/sheet\d+\.xml$/.test(f)).sort();
  const wanted = opts && opts.sheet ? sheetNames.filter((s) => s.includes(String(opts.sheet))) : sheetNames;
  const pick = (wanted.length ? wanted : sheetNames)[0];
  if (!pick) return { kind: 'table', columns: [], rows: [], sheets: sheetNames.length };
  const xml = files[pick].toString('utf8');
  const grid = [];
  for (const rm of xml.matchAll(/<row[^>]*>([\s\S]*?)<\/row>/g)) {
    const cells = [];
    for (const cm of rm[1].matchAll(/<c([^>]*)>([\s\S]*?)<\/c>/g)) {
      const attrs = cm[1], inner = cm[2];
      const ref = (attrs.match(/r="([A-Z]+\d+)"/) || [])[1] || '';
      const type = (attrs.match(/t="([^"]+)"/) || [])[1] || '';
      const vm = inner.match(/<v>([\s\S]*?)<\/v>/);
      const im = inner.match(/<t[^>]*>([\s\S]*?)<\/t>/);
      let val = '';
      if (type === 's' && vm) val = shared[Number(vm[1])] || '';
      else if (type === 'inlineStr' && im) val = im[1];
      else if (vm) val = vm[1];
      cells[ref ? colIndex(ref) : cells.length] = val;
    }
    grid.push([...cells].map((v) => (v == null ? '' : v)));
  }
  if (!grid.length) return { kind: 'table', columns: [], rows: [], sheets: sheetNames.length };
  const width = Math.max(...grid.map((r) => r.length));
  const norm = grid.map((r) => { const c = r.slice(); while (c.length < width) c.push(''); return c; });
  return { kind: 'table', columns: norm[0], rows: norm.slice(1), sheets: sheetNames.length };
}

// PowerPoint: one XML per slide, text in <a:t>.
function readPptx(buf) {
  const files = unzip(buf);
  const slides = Object.keys(files).filter((f) => /^ppt\/slides\/slide\d+\.xml$/.test(f))
    .sort((a, b) => Number(a.match(/(\d+)/)[1]) - Number(b.match(/(\d+)/)[1]));
  const blocks = [];
  slides.forEach((s, i) => {
    blocks.push({ type: 'h2', text: `اسلاید ${i + 1}` });
    const xml = files[s].toString('utf8');
    for (const m of xml.matchAll(/<a:t>([\s\S]*?)<\/a:t>/g)) {
      const t = m[1].replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&').trim();
      if (t) blocks.push({ type: 'li', text: t });
    }
  });
  return { kind: 'doc', title: '', blocks, slides: slides.length };
}

// OpenDocument (.odt/.ods) — also a ZIP; the whole body is in content.xml.
function readOdf(buf, kind) {
  const files = unzip(buf);
  const xml = (files['content.xml'] || Buffer.alloc(0)).toString('utf8');
  if (kind === 'table') {
    const grid = [];
    for (const rm of xml.matchAll(/<table:table-row[^>]*>([\s\S]*?)<\/table:table-row>/g)) {
      const cells = [...rm[1].matchAll(/<table:table-cell[\s\S]*?(?:\/>|<\/table:table-cell>)/g)]
        .map((c) => stripTags(c[0]));
      if (cells.length) grid.push(cells);
    }
    if (!grid.length) return { kind: 'table', columns: [], rows: [] };
    return { kind: 'table', columns: grid[0], rows: grid.slice(1) };
  }
  const blocks = [];
  for (const m of xml.matchAll(/<text:(h|p)[^>]*>([\s\S]*?)<\/text:\1>/g)) {
    const t = stripTags(m[2]);
    if (t) blocks.push({ type: m[1] === 'h' ? 'h2' : 'p', text: t });
  }
  return { kind: 'doc', title: '', blocks };
}

function readEpub(buf) {
  const files = unzip(buf);
  const blocks = [];
  for (const name of Object.keys(files).filter((f) => /\.x?html?$/i.test(f)).sort()) {
    const t = stripTags(files[name].toString('utf8'));
    if (t) { blocks.push({ type: 'h2', text: path.basename(name) }); blocks.push({ type: 'p', text: t }); }
  }
  return { kind: 'doc', title: '', blocks };
}

// ---- PDF ------------------------------------------------------------------
// A PDF is a bag of objects; page text lives in content streams as Tj/TJ
// show-text operators. Getting at it needs three things, and skipping any one
// of them is why naive extractors come back empty:
//
//   1. The FILTER CHAIN. /Filter is often an array — [ /ASCII85Decode
//      /FlateDecode ] is very common — so decoders must run in order. Only
//      handling Flate silently loses every page of such a file.
//   2. The show-text operators, including the array form used for kerning.
//   3. The ToUnicode CMap. Subset fonts encode text as glyph ids, so the raw
//      bytes are meaningless until they are mapped back to real characters.
//
// A SCANNED page has no characters at all, only a picture. That is reported
// plainly rather than returned as an empty string.

function ascii85Decode(str) {
  let s = String(str).replace(/^<~/, '').replace(/~>[\s\S]*$/, '').replace(/\s+/g, '');
  const out = [];
  let tuple = [];
  for (const ch of s) {
    if (ch === 'z' && tuple.length === 0) { out.push(0, 0, 0, 0); continue; }
    const v = ch.charCodeAt(0) - 33;
    if (v < 0 || v > 84) continue;
    tuple.push(v);
    if (tuple.length === 5) {
      let n = 0;
      for (const t of tuple) n = n * 85 + t;
      out.push((n >>> 24) & 255, (n >>> 16) & 255, (n >>> 8) & 255, n & 255);
      tuple = [];
    }
  }
  if (tuple.length > 1) {
    const k = tuple.length;
    while (tuple.length < 5) tuple.push(84);
    let n = 0;
    for (const t of tuple) n = n * 85 + t;
    const bytes = [(n >>> 24) & 255, (n >>> 16) & 255, (n >>> 8) & 255, n & 255];
    out.push(...bytes.slice(0, k - 1));
  }
  return Buffer.from(out);
}
function asciiHexDecode(str) {
  const hex = String(str).replace(/>[\s\S]*$/, '').replace(/[^0-9a-fA-F]/g, '');
  return Buffer.from(hex.length % 2 ? hex + '0' : hex, 'hex');
}
function runLengthDecode(buf) {
  const out = [];
  for (let i = 0; i < buf.length; ) {
    const n = buf[i++];
    if (n === 128) break;
    if (n < 128) { for (let k = 0; k <= n; k++) out.push(buf[i++]); }
    else { const b = buf[i++]; for (let k = 0; k < 257 - n; k++) out.push(b); }
  }
  return Buffer.from(out);
}
// LZW as PDF uses it (early change = 1 by default). Rare next to Flate, but
// old scanners and some generators still emit it.
function lzwDecode(buf) {
  const out = [];
  let dict = [], next = 258, bits = 9, prev = null, acc = 0, accBits = 0;
  const reset = () => { dict = []; for (let i = 0; i < 256; i++) dict[i] = [i]; next = 258; bits = 9; prev = null; };
  reset();
  for (let i = 0; i < buf.length; i++) {
    acc = (acc << 8) | buf[i]; accBits += 8;
    while (accBits >= bits) {
      const code = (acc >> (accBits - bits)) & ((1 << bits) - 1);
      accBits -= bits;
      if (code === 256) { reset(); continue; }
      if (code === 257) return Buffer.from(out);
      let entry;
      if (dict[code]) entry = dict[code];
      else if (prev) entry = prev.concat(prev[0]);
      else continue;
      out.push(...entry);
      if (prev) dict[next++] = prev.concat(entry[0]);
      prev = entry;
      if (next + 1 >= (1 << bits) && bits < 12) bits++;
    }
  }
  return Buffer.from(out);
}
function applyPdfFilters(raw, filters) {
  let data = raw;
  for (const f of filters) {
    try {
      if (/ASCII85/i.test(f)) data = ascii85Decode(data.toString('latin1'));
      else if (/ASCIIHex/i.test(f)) data = asciiHexDecode(data.toString('latin1'));
      else if (/Flate/i.test(f)) {
        try { data = zlib.inflateSync(data); } catch (e) { data = zlib.inflateRawSync(data); }
      } else if (/LZW/i.test(f)) data = lzwDecode(data);
      else if (/RunLength/i.test(f)) data = runLengthDecode(data);
      else return null;        // DCT/JPX/CCITT = an image, not text
    } catch (e) { return null; }
  }
  return data;
}

// Walk every `<<dict>> stream ... endstream` in the file.
function pdfStreams(buf) {
  const found = [];
  let i = 0;
  while (i < buf.length) {
    const s = buf.indexOf('stream', i, 'latin1');
    if (s === -1) break;
    // "endstream" also contains "stream" — skip that match outright.
    if (s >= 3 && buf.slice(s - 3, s).toString('latin1') === 'end') { i = s + 6; continue; }
    let ds = s + 6;
    if (buf[ds] === 0x0d) ds++;
    if (buf[ds] === 0x0a) ds++;
    const e = buf.indexOf('endstream', ds, 'latin1');
    if (e === -1) break;
    const dict = buf.slice(Math.max(0, s - 700), s).toString('latin1');
    const fm = dict.match(/\/Filter\s*(\[[^\]]*\]|\/[A-Za-z0-9]+)\s*(?:\/|>|$)/);
    const filters = fm ? (fm[1].match(/\/([A-Za-z0-9]+)/g) || []).map((x) => x.slice(1)) : [];
    found.push({ raw: buf.slice(ds, e), filters, dict });
    i = e + 9;
  }
  return found;
}

// /ToUnicode CMaps: beginbfchar <src> <dst>  and  beginbfrange <lo> <hi> <dst>
function parseCMap(text, into) {
  const hexToStr = (h) => {
    let s = '';
    for (let i = 0; i + 3 < h.length + 1; i += 4) s += String.fromCharCode(parseInt(h.slice(i, i + 4), 16) || 0);
    return s;
  };
  for (const blk of text.matchAll(/beginbfchar([\s\S]*?)endbfchar/g)) {
    for (const m of blk[1].matchAll(/<([0-9A-Fa-f]+)>\s*<([0-9A-Fa-f]+)>/g)) {
      into.set(parseInt(m[1], 16), hexToStr(m[2]));
    }
  }
  for (const blk of text.matchAll(/beginbfrange([\s\S]*?)endbfrange/g)) {
    for (const m of blk[1].matchAll(/<([0-9A-Fa-f]+)>\s*<([0-9A-Fa-f]+)>\s*<([0-9A-Fa-f]+)>/g)) {
      const lo = parseInt(m[1], 16), hi = parseInt(m[2], 16), dst = parseInt(m[3], 16);
      for (let c = lo; c <= hi && c - lo < 65535; c++) into.set(c, String.fromCharCode(dst + (c - lo)));
    }
  }
  return into;
}

function readPdf(buf) {
  const streams = pdfStreams(buf);
  const toUnicode = new Map();
  const contents = [];
  for (const st of streams) {
    const data = applyPdfFilters(st.raw, st.filters);
    if (!data) continue;
    const txt = data.toString('latin1');
    if (/begincmap/.test(txt)) { parseCMap(txt, toUnicode); continue; }
    // A content stream is the one that positions and shows text.
    if (/\b(Tj|TJ)\b/.test(txt) && /\b(BT|Td|TD|Tf|Tm)\b/.test(txt)) contents.push(txt);
  }

  const runs = [];
  for (const stream of contents) {
    let last = null;
    // ( ... ) Tj   |   [ (a) -3 (b) ] TJ   |   <hex> Tj
    for (const m of stream.matchAll(
      /\[((?:[^\[\]\\]|\\.)*)\]\s*TJ|\(((?:[^()\\]|\\.)*)\)\s*Tj|<([0-9A-Fa-f\s]+)>\s*Tj|\bT[*]|\bTd\b|\bTD\b/g)) {
      if (m[1] != null) {
        // The numbers inside a TJ array are kerning; a big negative one is a
        // word space, which is how many PDFs encode spaces at all.
        let s = '';
        for (const p of m[1].matchAll(/\(((?:[^()\\]|\\.)*)\)|(-?\d+(?:\.\d+)?)/g)) {
          if (p[1] != null) s += p[1];
          else if (Number(p[2]) <= -120) s += ' ';
        }
        runs.push({ t: s });
      } else if (m[2] != null) runs.push({ t: m[2] });
      else if (m[3] != null) runs.push({ hex: m[3].replace(/\s+/g, '') });
      // Td moves the cursor and is used between every glyph by some
      // generators, so only the real line operators start a new line —
      // treating Td as a break puts one character on each line.
      else if (/T[*]|TD/.test(m[0])) runs.push({ br: true });
      last = m;
    }
    runs.push({ br: true });
  }

  const unesc = (s) => s.replace(/\\n/g, '\n').replace(/\\r/g, '').replace(/\\t/g, '\t')
    .replace(/\\(\d{1,3})/g, (_, o) => String.fromCharCode(parseInt(o, 8)))
    .replace(/\\([()\\])/g, '$1');

  const build = (useMap) => runs.map((r) => {
    if (r.br) return '\n';
    if (r.hex != null) {
      let s = '';
      for (let i = 0; i + 1 < r.hex.length + 1; i += 4) {
        const code = parseInt(r.hex.slice(i, i + 4), 16);
        if (Number.isNaN(code)) break;
        s += useMap && toUnicode.has(code) ? toUnicode.get(code) : String.fromCharCode(code);
      }
      return s;
    }
    const raw = unesc(r.t);
    if (!useMap) return raw;
    let s = '';
    for (const ch of raw) {
      const c = ch.charCodeAt(0);
      s += toUnicode.has(c) ? toUnicode.get(c) : ch;
    }
    return s;
  }).join('');

  // Prefer whichever pass reads like real language. Applying the CMap to text
  // that was already fine can wreck it, and not applying it to glyph ids gives
  // mojibake — so score both and keep the better one.
  const score = (s) => {
    if (!s) return -1;
    const letters = (s.match(/[\p{L}\p{N}]/gu) || []).length;
    const junk = (s.match(/[ --�]/g) || []).length;
    return letters / Math.max(1, s.length) - junk / Math.max(1, s.length) * 3;
  };
  const plain = build(false);
  const mapped = toUnicode.size ? build(true) : '';
  let text = (score(mapped) > score(plain) ? mapped : plain);

  // Arabic/Persian PDFs arrive as PRESENTATION FORMS (U+FB50..U+FEFF) — the
  // shaped glyph for a letter in a particular position, not the letter itself.
  // NFKC folds them back to the real letters, which is the difference between
  // "ﺶﯾﺎﺘﺳ" and "ستایش".
  if (/[ﭐ-﷿ﹰ-﻿]/.test(text)) {
    text = text.normalize('NFKC').replace(/‌{2,}/g, '‌');
  }

  // Generators that lay Persian out VISUALLY emit one glyph per show-operator,
  // right to left, so the characters come out backwards. When a line is mostly
  // Arabic script AND the glyphs arrived one at a time, reversing it restores
  // the logical order. Both conditions must hold — reversing correctly-ordered
  // text would be worse than leaving it alone.
  const glyphRuns = runs.filter((r) => r.t != null || r.hex != null);
  const avgRun = glyphRuns.length
    ? glyphRuns.reduce((n, r) => n + (r.t != null ? r.t.length : r.hex.length / 4), 0) / glyphRuns.length
    : 99;
  if (avgRun < 1.6) {
    text = text.split('\n').map((line) => {
      const letters = (line.match(/[\p{L}]/gu) || []).length;
      const arabic = (line.match(/[؀-ۿ]/g) || []).length;
      if (letters < 3 || arabic / letters < 0.5) return line;
      // Reverse the line, then un-reverse each Latin/number run inside it:
      // reversing the whole line fixes the Persian, but would leave embedded
      // words like "Express" and "9.9.16" backwards.
      return [...line].reverse().join('')
        .replace(/[()\[\]{}<>]/g, (c) => ({ '(': ')', ')': '(', '[': ']', ']': '[', '{': '}', '}': '{', '<': '>', '>': '<' }[c]))
        .replace(/[A-Za-z0-9][A-Za-z0-9._+@/-]*/g, (w) => [...w].reverse().join(''));
    }).join('\n');
  }

  text = text.replace(/[ \t]{2,}/g, ' ').replace(/\n{3,}/g, '\n\n').trim();

  if (!text) {
    return { kind: 'text', text: '',
      warning: 'این PDF متن قابل استخراج ندارد — احتمالاً اسکن‌شده است (عکسِ صفحه). خودِ فایل را در چت بفرست تا با چشم بخوانمش.' };
  }
  // Some PDFs embed a subset font with no /ToUnicode at all. The characters
  // then map to arbitrary code points and the "text" is nonsense. Better to
  // say so than to hand nonsense to the model as if it were the document.
  const usable = (text.match(/[\p{Script=Latin}\p{Script=Arabic}\p{N}\s.,;:!?()\-«»]/gu) || []).length / text.length;
  if (usable < 0.6) {
    return { kind: 'text', text, lowQuality: true,
      warning: 'متن این PDF با فونتی جاسازی شده که جدول حروفش (ToUnicode) را ندارد، '
        + 'پس چیزی که استخراج شد خوانا نیست. خودِ فایل را در چت بفرست تا با چشم بخوانمش.' };
  }
  return { kind: 'text', text, pages: contents.length };
}

function readRtf(text) {
  return { kind: 'text', text: String(text)
    .replace(/\\'([0-9a-f]{2})/gi, (_, h) => String.fromCharCode(parseInt(h, 16)))
    .replace(/\\u(-?\d+)\s?\??/g, (_, n) => String.fromCharCode(Number(n) < 0 ? Number(n) + 65536 : Number(n)))
    .replace(/\\par[d]?\b/g, '\n').replace(/\\line\b/g, '\n')
    .replace(/\{\\\*[\s\S]*?\}/g, '').replace(/\\[a-z]+-?\d*\s?/gi, '')
    .replace(/[{}]/g, '').replace(/\n{3,}/g, '\n\n').trim() };
}

function readMarkdown(text) {
  const blocks = [];
  const lines = String(text).split(/\r?\n/);
  let code = null;
  for (const line of lines) {
    const fence = line.match(/^\s*```(\w*)/);
    if (fence) {
      if (code) { blocks.push(code); code = null; }
      else code = { type: 'code', lang: fence[1] || '', text: '' };
      continue;
    }
    if (code) { code.text += (code.text ? '\n' : '') + line; continue; }
    const h = line.match(/^(#{1,6})\s+(.*)$/);
    if (h) { blocks.push({ type: 'h' + h[1].length, text: h[2].trim() }); continue; }
    const li = line.match(/^\s*([-*+]|\d+\.)\s+(.*)$/);
    if (li) { blocks.push({ type: 'li', text: li[2].trim() }); continue; }
    if (line.trim()) blocks.push({ type: 'p', text: line.trim() });
  }
  if (code) blocks.push(code);
  return { kind: 'doc', title: '', blocks };
}

function readHtml(text) {
  const title = (String(text).match(/<title[^>]*>([\s\S]*?)<\/title>/i) || [])[1] || '';
  const blocks = [];
  const body = String(text).replace(/<script[\s\S]*?<\/script>/gi, '').replace(/<style[\s\S]*?<\/style>/gi, '');
  for (const m of body.matchAll(/<(h[1-6]|p|li|pre)[^>]*>([\s\S]*?)<\/\1>/gi)) {
    const t = stripTags(m[2]);
    if (!t) continue;
    const tag = m[1].toLowerCase();
    blocks.push({ type: tag === 'pre' ? 'code' : (tag === 'p' ? 'p' : tag), text: t });
  }
  if (!blocks.length) { const t = stripTags(body); if (t) blocks.push({ type: 'p', text: t }); }
  return { kind: 'doc', title: title.trim(), blocks };
}

function readXml(text) {
  const blocks = [];
  const t = stripTags(text);
  if (t) blocks.push({ type: 'p', text: t });
  return { kind: 'doc', title: '', blocks, raw: String(text) };
}

function readIni(text) {
  const rows = [];
  let section = '';
  for (const line of String(text).split(/\r?\n/)) {
    const s = line.trim();
    if (!s || /^[#;]/.test(s)) continue;
    const sec = s.match(/^\[(.+)\]$/);
    if (sec) { section = sec[1]; continue; }
    const kv = s.match(/^([^=:]+)[=:]([\s\S]*)$/);
    if (kv) rows.push([section, kv[1].trim(), kv[2].trim().replace(/^["']|["']$/g, '')]);
  }
  return { kind: 'table', columns: ['بخش', 'کلید', 'مقدار'], rows };
}

// .env files routinely hold real secrets. Reading one is legitimate — leaking
// its values into a chat, a converted file or a log is not — so the values are
// masked here, at the reader, where it cannot be forgotten downstream.
function readEnv(text) {
  const rows = [];
  for (const line of String(text).split(/\r?\n/)) {
    const s = line.trim();
    if (!s || s.startsWith('#')) continue;
    const kv = s.match(/^(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=\s*([\s\S]*)$/);
    if (!kv) continue;
    const val = kv[2].trim().replace(/^["']|["']$/g, '');
    const masked = val.length <= 4 ? '•'.repeat(val.length) : val.slice(0, 2) + '•'.repeat(Math.min(12, val.length - 2));
    rows.push([kv[1], masked, String(val.length)]);
  }
  return { kind: 'table', columns: ['کلید', 'مقدار (پوشانده)', 'طول'], rows,
    warning: 'مقدارها عمداً پوشانده شدند — فایل .env معمولاً رمز و کلید واقعی دارد.' };
}

// Deliberately a SIMPLE YAML reader: key/value, nesting by indent, and plain
// lists. Anchors, multi-document streams and flow style are not supported and
// fall back to plain text rather than being guessed at wrongly.
function readYaml(text) {
  const rows = [];
  const stack = [];
  for (const line of String(text).split(/\r?\n/)) {
    if (!line.trim() || /^\s*#/.test(line)) continue;
    const indent = line.match(/^\s*/)[0].length;
    while (stack.length && stack[stack.length - 1].indent >= indent) stack.pop();
    const item = line.match(/^\s*-\s+(.*)$/);
    if (item) { rows.push([stack.map((s) => s.key).join('.'), '-', item[1].trim()]); continue; }
    const kv = line.match(/^\s*([^:#]+):\s*(.*)$/);
    if (!kv) continue;
    const key = kv[1].trim(), val = kv[2].trim();
    if (val === '') { stack.push({ key, indent }); continue; }
    rows.push([stack.map((s) => s.key).join('.'), key, val.replace(/^["']|["']$/g, '')]);
  }
  return { kind: 'table', columns: ['مسیر', 'کلید', 'مقدار'], rows };
}

function readToml(text) {
  return readIni(text);   // close enough for the key/value shape we report
}

function readJson(text) {
  let data;
  try { data = JSON.parse(text); }
  catch (e) { return { kind: 'text', text: String(text), warning: 'JSON معتبر نبود؛ به‌صورت متن خوانده شد: ' + e.message }; }
  if (Array.isArray(data) && data.length && typeof data[0] === 'object' && !Array.isArray(data[0])) {
    return Object.assign({ kind: 'table' }, tableFromObjects(data));
  }
  if (data && typeof data === 'object' && !Array.isArray(data)) {
    const rows = Object.entries(data).map(([k, v]) => [k, typeof v === 'object' ? JSON.stringify(v) : String(v)]);
    return { kind: 'table', columns: ['کلید', 'مقدار'], rows };
  }
  return { kind: 'text', text: JSON.stringify(data, null, 2) };
}

function readJsonl(text) {
  const objs = [];
  for (const line of String(text).split(/\r?\n/)) {
    if (!line.trim()) continue;
    try { objs.push(JSON.parse(line)); } catch (e) { /* skip a bad line */ }
  }
  return Object.assign({ kind: 'table' }, tableFromObjects(objs));
}

function readSubs(text, kind) {
  const rows = [];
  const blocks = String(text).replace(/^WEBVTT.*\n/i, '').split(/\r?\n\r?\n/);
  for (const b of blocks) {
    const lines = b.split(/\r?\n/).filter(Boolean);
    if (!lines.length) continue;
    const timeIdx = lines.findIndex((l) => l.includes('-->'));
    if (timeIdx === -1) continue;
    const [start, end] = lines[timeIdx].split('-->').map((s) => s.trim());
    rows.push([start, end, lines.slice(timeIdx + 1).join(' ')]);
  }
  return { kind: 'table', columns: ['از', 'تا', 'متن'], rows };
}

function readIpynb(text) {
  let nb;
  try { nb = JSON.parse(text); } catch (e) { return { kind: 'text', text: String(text) }; }
  const blocks = [];
  (nb.cells || []).forEach((c, i) => {
    const src = Array.isArray(c.source) ? c.source.join('') : String(c.source || '');
    if (!src.trim()) return;
    if (c.cell_type === 'code') blocks.push({ type: 'code', lang: 'python', text: src });
    else blocks.push({ type: 'p', text: src });
    for (const o of c.outputs || []) {
      const t = Array.isArray(o.text) ? o.text.join('') : (o.text || '');
      if (t) blocks.push({ type: 'code', lang: 'output', text: String(t).slice(0, 2000) });
    }
  });
  return { kind: 'doc', title: '', blocks };
}

function readZipListing(buf) {
  const files = unzip(buf);
  const rows = Object.entries(files).map(([name, data]) => {
    const e = extOf(name);
    const f = describe(e);
    return [name, String(data.length), f ? f.family : '—'];
  });
  return { kind: 'table', columns: ['فایل', 'اندازه (بایت)', 'نوع'], rows };
}

// TAR is fixed 512-byte headers; enough to list what is inside.
function readTar(buf) {
  const rows = [];
  for (let o = 0; o + 512 <= buf.length; ) {
    const name = buf.slice(o, o + 100).toString('utf8').replace(/\0.*$/, '');
    if (!name) { o += 512; if (rows.length) break; continue; }
    const size = parseInt(buf.slice(o + 124, o + 136).toString('utf8').replace(/\0.*$/, '').trim(), 8) || 0;
    rows.push([name, String(size)]);
    o += 512 + Math.ceil(size / 512) * 512;
    if (rows.length > 5000) break;
  }
  return { kind: 'table', columns: ['فایل', 'اندازه (بایت)'], rows };
}

// SQLite: the header names the format and the schema lives in table sqlite_master.
// Listing the tables is genuinely useful and needs no SQL engine.
function readSqlite(buf) {
  if (buf.slice(0, 15).toString('latin1') !== 'SQLite format 3') {
    return { kind: 'table', columns: ['خطا'], rows: [['این فایل پایگاه‌داده‌ی SQLite نیست.']] };
  }
  const text = buf.toString('latin1');
  const rows = [];
  for (const m of text.matchAll(/CREATE TABLE ["'`]?([A-Za-z_][A-Za-z0-9_]*)["'`]?\s*\(([^)]*)\)/gi)) {
    const cols = m[2].split(',').map((c) => c.trim().split(/\s+/)[0].replace(/["'`]/g, '')).filter(Boolean);
    rows.push([m[1], String(cols.length), cols.slice(0, 12).join('، ')]);
  }
  return { kind: 'table', columns: ['جدول', 'تعداد ستون', 'ستون‌ها'], rows,
    warning: 'فقط ساختار جدول‌ها خوانده شد؛ برای خواندن سطرها به موتور SQL نیاز است.' };
}

// Image headers: dimensions and colour depth with no image library at all.
function imageInfo(buf, ext) {
  try {
    if (buf.slice(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) {
      return { format: 'PNG', width: buf.readUInt32BE(16), height: buf.readUInt32BE(20), bitDepth: buf[24] };
    }
    if (buf[0] === 0xff && buf[1] === 0xd8) {
      for (let i = 2; i + 9 < buf.length; ) {
        if (buf[i] !== 0xff) { i++; continue; }
        const marker = buf[i + 1];
        if (marker >= 0xc0 && marker <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(marker)) {
          return { format: 'JPEG', height: buf.readUInt16BE(i + 5), width: buf.readUInt16BE(i + 7) };
        }
        i += 2 + buf.readUInt16BE(i + 2);
      }
      return { format: 'JPEG' };
    }
    if (buf.slice(0, 3).toString('latin1') === 'GIF') {
      return { format: 'GIF', width: buf.readUInt16LE(6), height: buf.readUInt16LE(8) };
    }
    if (buf.slice(0, 2).toString('latin1') === 'BM') {
      return { format: 'BMP', width: buf.readInt32LE(18), height: Math.abs(buf.readInt32LE(22)) };
    }
    if (buf.slice(0, 4).toString('latin1') === 'RIFF' && buf.slice(8, 12).toString('latin1') === 'WEBP') {
      return { format: 'WebP' };
    }
  } catch (e) { /* truncated file */ }
  return { format: (ext || '').toUpperCase() || 'unknown' };
}

// ---------------------------------------------------------------------------
// WRITERS — intermediate -> target bytes
// ---------------------------------------------------------------------------
function docToText(doc) {
  return doc.blocks.map((b) => {
    if (b.type === 'code') return b.text;
    if (b.type === 'li') return '• ' + b.text;
    return b.text;
  }).join('\n\n');
}
function docToMarkdown(doc) {
  const out = [];
  if (doc.title) out.push('# ' + doc.title, '');
  for (const b of doc.blocks) {
    if (/^h[1-6]$/.test(b.type)) out.push('#'.repeat(Number(b.type[1])) + ' ' + b.text, '');
    else if (b.type === 'li') out.push('- ' + b.text);
    else if (b.type === 'code') out.push('```' + (b.lang || ''), b.text, '```', '');
    else out.push(b.text, '');
  }
  return out.join('\n').replace(/\n{3,}/g, '\n\n').trim() + '\n';
}
function docToHtml(doc, title) {
  const body = doc.blocks.map((b) => {
    if (/^h[1-6]$/.test(b.type)) return `<${b.type}>${xesc(b.text)}</${b.type}>`;
    if (b.type === 'li') return `<li>${xesc(b.text)}</li>`;
    if (b.type === 'code') return `<pre><code>${xesc(b.text)}</code></pre>`;
    return `<p>${xesc(b.text)}</p>`;
  }).join('\n');
  return htmlPage(title || doc.title || 'سند', body);
}
function htmlPage(title, body) {
  // RTL by default because this household writes Persian; Latin text still
  // renders correctly inside an RTL page.
  return `<!doctype html>
<html lang="fa" dir="rtl">
<meta charset="utf-8">
<title>${xesc(title)}</title>
<style>
 body{font-family:"Vazirmatn","Segoe UI",Tahoma,system-ui,sans-serif;line-height:1.9;
      max-width:820px;margin:36px auto;padding:0 18px;color:#14181f;background:#fff}
 h1,h2,h3,h4{line-height:1.4;margin:1.4em 0 .5em}
 pre{background:#f4f5f7;padding:12px 14px;border-radius:10px;overflow-x:auto;direction:ltr;text-align:left}
 code{font-family:"Cascadia Mono",Consolas,monospace;font-size:.92em}
 table{border-collapse:collapse;width:100%;margin:1em 0}
 th,td{border:1px solid #d8dbe2;padding:7px 10px;text-align:right;font-size:.95em}
 th{background:#f4f5f7}
 @media print{body{margin:0;max-width:none}}
</style>
${body}
</html>`;
}
function tableToHtml(t, title) {
  const head = '<tr>' + t.columns.map((c) => `<th>${xesc(c)}</th>`).join('') + '</tr>';
  const body = t.rows.map((r) => '<tr>' + t.columns.map((_, i) => `<td>${xesc(r[i])}</td>`).join('') + '</tr>').join('\n');
  return htmlPage(title || 'جدول', `<table>${head}\n${body}</table>`);
}
function tableToMarkdown(t) {
  const esc = (v) => String(v == null ? '' : v).replace(/\|/g, '\\|').replace(/\n/g, ' ');
  return [
    '| ' + t.columns.map(esc).join(' | ') + ' |',
    '| ' + t.columns.map(() => '---').join(' | ') + ' |',
    ...t.rows.map((r) => '| ' + t.columns.map((_, i) => esc(r[i])).join(' | ') + ' |'),
  ].join('\n') + '\n';
}
function tableToCsv(t, delim) {
  const d = delim || ',';
  const line = (arr) => arr.map(csvCell).join(d);
  return [line(t.columns), ...t.rows.map((r) => line(t.columns.map((_, i) => r[i] == null ? '' : r[i])))].join('\n') + '\n';
}
function tableToXml(t) {
  const tag = (s) => String(s || 'field').replace(/[^A-Za-z0-9_]/g, '_').replace(/^(\d)/, '_$1');
  return '<?xml version="1.0" encoding="UTF-8"?>\n<rows>\n' + t.rows.map((r) =>
    '  <row>\n' + t.columns.map((c, i) => `    <${tag(c)}>${xesc(r[i])}</${tag(c)}>`).join('\n') + '\n  </row>'
  ).join('\n') + '\n</rows>\n';
}
function tableToYaml(t) {
  const q = (v) => (/^[\w.@/-]+$/.test(String(v)) ? String(v) : JSON.stringify(String(v == null ? '' : v)));
  return t.rows.map((r) => '- ' + t.columns.map((c, i) => `${q(c)}: ${q(r[i])}`).join('\n  ')).join('\n') + '\n';
}
function tableToIni(t) {
  return t.rows.map((r) => `${r[0]}=${r[1] == null ? '' : r[1]}`).join('\n') + '\n';
}
function textToDoc(text) {
  return { kind: 'doc', title: '', blocks: String(text).split(/\n{2,}/).filter((p) => p.trim())
    .map((p) => ({ type: 'p', text: p.trim() })) };
}
function textToRtf(text) {
  // \uN escapes keep Persian intact in a format that is otherwise ASCII-only.
  const esc = [...String(text)].map((ch) => {
    const c = ch.codePointAt(0);
    if (ch === '\n') return '\\par\n';
    if (ch === '\\' || ch === '{' || ch === '}') return '\\' + ch;
    return c > 127 ? `\\u${c > 32767 ? c - 65536 : c}?` : ch;
  }).join('');
  return '{\\rtf1\\ansi\\deff0{\\fonttbl{\\f0 Tahoma;}}\\rtlch\\f0\\fs24 ' + esc + '}';
}

// ---- minimal but VALID .docx and .xlsx ------------------------------------
// Word and Excel reject anything malformed, so these write the full part set
// (content types, the two rels files, and the document itself), not a stub.
const DOCX_CT = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
<Default Extension="xml" ContentType="application/xml"/>
<Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
</Types>`;
const ROOT_RELS = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>`;
function docToDocx(doc) {
  const para = (text, style) => {
    const props = `<w:pPr><w:bidi/>${style ? `<w:pStyle w:val="${style}"/>` : ''}</w:pPr>`;
    return `<w:p>${props}<w:r><w:rPr><w:rtl/></w:rPr><w:t xml:space="preserve">${xesc(text)}</w:t></w:r></w:p>`;
  };
  const body = doc.blocks.map((b) => {
    if (/^h[1-6]$/.test(b.type)) return para(b.text, 'Heading' + b.type[1]);
    if (b.type === 'li') return para('• ' + b.text, 'ListParagraph');
    if (b.type === 'code') return b.text.split('\n').map((l) => para(l)).join('');
    return para(b.text);
  }).join('');
  const document = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
<w:body>${doc.title ? para(doc.title, 'Heading1') : ''}${body}</w:body></w:document>`;
  return zip([
    { name: '[Content_Types].xml', data: DOCX_CT },
    { name: '_rels/.rels', data: ROOT_RELS },
    { name: 'word/document.xml', data: document },
  ]);
}

const XLSX_CT = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
<Default Extension="xml" ContentType="application/xml"/>
<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>
<Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>
</Types>`;
function colLetter(n) {
  let s = '';
  n += 1;
  while (n > 0) { const r = (n - 1) % 26; s = String.fromCharCode(65 + r) + s; n = Math.floor((n - 1) / 26); }
  return s;
}
function tableToXlsx(t) {
  const cell = (v, ref) => {
    const s = v == null ? '' : String(v);
    // Write numbers as numbers so Excel can sum them; everything else inline.
    if (s !== '' && /^-?\d+(\.\d+)?$/.test(s) && Math.abs(Number(s)) < 1e15) {
      return `<c r="${ref}"><v>${s}</v></c>`;
    }
    return `<c r="${ref}" t="inlineStr"><is><t xml:space="preserve">${xesc(s)}</t></is></c>`;
  };
  const rowXml = (vals, n) => `<row r="${n}">` + vals.map((v, i) => cell(v, colLetter(i) + n)).join('') + '</row>';
  const rows = [rowXml(t.columns, 1), ...t.rows.map((r, i) => rowXml(t.columns.map((_, c) => r[c]), i + 2))];
  const sheet = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetData>${rows.join('')}</sheetData></worksheet>`;
  const workbook = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
<sheets><sheet name="Sheet1" sheetId="1" r:id="rId1"/></sheets></workbook>`;
  const wbRels = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>
</Relationships>`;
  const rootRels = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>
</Relationships>`;
  return zip([
    { name: '[Content_Types].xml', data: XLSX_CT },
    { name: '_rels/.rels', data: rootRels },
    { name: 'xl/workbook.xml', data: workbook },
    { name: 'xl/_rels/workbook.xml.rels', data: wbRels },
    { name: 'xl/worksheets/sheet1.xml', data: sheet },
  ]);
}

// ---------------------------------------------------------------------------
// Media: hand off to whatever the machine already has, never pretend
// ---------------------------------------------------------------------------
function which(cmd) {
  const exts = process.platform === 'win32' ? ['.exe', '.cmd', '.bat'] : [''];
  for (const dir of String(process.env.PATH || '').split(path.delimiter)) {
    if (!dir) continue;
    for (const e of exts) {
      const p = path.join(dir, cmd + e);
      try { fs.accessSync(p, fs.constants.X_OK); return p; } catch (err) { /* keep looking */ }
    }
  }
  return null;
}
function mediaTool(family) {
  if (family === 'image') return which('magick') || which('convert') || which('ffmpeg');
  return which('ffmpeg');
}
function runTool(bin, args, timeoutMs) {
  return new Promise((resolve) => {
    execFile(bin, args, { timeout: timeoutMs || 120000, maxBuffer: 8 << 20 }, (err, stdout, stderr) => {
      resolve({ ok: !err, err: err ? String((stderr || err.message)).slice(0, 400) : '' });
    });
  });
}

// ---------------------------------------------------------------------------
// read() — any supported file into an intermediate
// ---------------------------------------------------------------------------
function read(buf, name, opts) {
  opts = opts || {};
  const ext = extOf(name) || String(opts.ext || '').toLowerCase();
  const f = describe(ext);
  const asText = () => buf.toString('utf8');

  switch (ext) {
    case 'docx': return readDocx(buf);
    case 'xlsx': return readXlsx(buf, opts);
    case 'pptx': return readPptx(buf);
    case 'odt':  return readOdf(buf, 'doc');
    case 'ods':  return readOdf(buf, 'table');
    case 'epub': return readEpub(buf);
    case 'pdf':  return readPdf(buf);
    case 'rtf':  return readRtf(asText());
    case 'md': case 'markdown': return readMarkdown(asText());
    case 'html': case 'htm': return readHtml(asText());
    case 'xml': return readXml(asText());
    case 'json': return readJson(asText());
    case 'jsonl': case 'ndjson': return readJsonl(asText());
    case 'ipynb': return readIpynb(asText());
    case 'csv': return (() => { const g = parseCsv(asText(), ','); return { kind: 'table', columns: g[0] || [], rows: g.slice(1) }; })();
    case 'tsv': return (() => { const g = parseCsv(asText(), '\t'); return { kind: 'table', columns: g[0] || [], rows: g.slice(1) }; })();
    case 'yaml': case 'yml': return readYaml(asText());
    case 'toml': return readToml(asText());
    case 'ini': case 'cfg': case 'conf': case 'properties': return readIni(asText());
    case 'env': return readEnv(asText());
    case 'srt': case 'vtt': return readSubs(asText(), ext);
    case 'zip': return readZipListing(buf);
    case 'tar': return readTar(buf);
    case 'tgz': return readTar(zlib.gunzipSync(buf));
    case 'gz': return { kind: 'text', text: zlib.gunzipSync(buf).toString('utf8') };
    case 'db': case 'sqlite': case 'sqlite3': return readSqlite(buf);
    default: break;
  }
  if (f && f.text) return { kind: 'text', text: asText() };
  if (f && f.family === 'image') return { kind: 'meta', meta: imageInfo(buf, ext), bytes: buf.length };
  if (f && ['audio', 'video'].includes(f.family)) return { kind: 'meta', meta: { format: ext.toUpperCase() }, bytes: buf.length };
  // Unknown extension: if it looks like text, treat it as text. A file having
  // no entry in the table is not a reason to refuse it.
  const probe = buf.slice(0, 8000);
  const nonPrintable = probe.filter((b) => b < 9 || (b > 13 && b < 32)).length;
  if (probe.length && nonPrintable / probe.length < 0.05) {
    return { kind: 'text', text: asText(), guessed: true };
  }
  return { kind: 'binary', bytes: buf.length, head: buf.slice(0, 64).toString('hex') };
}

// ---------------------------------------------------------------------------
// convert() — bytes in, bytes out
// ---------------------------------------------------------------------------
// Returns { data, ext, mime, note } or throws a message the user can act on.
async function convert(buf, fromName, toExt, opts) {
  opts = opts || {};
  const from = extOf(fromName);
  const to = String(toExt || '').toLowerCase().replace(/^\./, '');
  if (!to) throw new Error('فرمت مقصد داده نشد.');
  if (from === to) throw new Error('فرمت مبدأ و مقصد یکی است.');
  const srcFmt = describe(from), dstFmt = describe(to);

  // Media -> media: only a real codec can do this honestly.
  const mediaFamilies = ['image', 'audio', 'video'];
  if (srcFmt && dstFmt && mediaFamilies.includes(srcFmt.family)) {
    if (!mediaFamilies.includes(dstFmt.family)) {
      throw new Error(`تبدیل ${from} به ${to} معنی ندارد — ${from} یک فایل ${srcFmt.family} است.`);
    }
    const bin = mediaTool(srcFmt.family);
    if (!bin) {
      throw new Error(`برای تبدیل ${from} به ${to} به ffmpeg یا ImageMagick روی این کامپیوتر نیاز است و نصب نیست. `
        + 'نصبش کن و دوباره امتحان کن — بقیه‌ی فرمت‌ها (متن، داده، Office، PDF) بدون هیچ نصبی کار می‌کنند.');
    }
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'setayesh-conv-'));
    const inPath = path.join(tmp, 'in.' + from), outPath = path.join(tmp, 'out.' + to);
    try {
      fs.writeFileSync(inPath, buf);
      const args = /ffmpeg/.test(bin) ? ['-y', '-i', inPath, outPath] : [inPath, outPath];
      const r = await runTool(bin, args, opts.timeoutMs || 180000);
      if (!r.ok || !fs.existsSync(outPath)) throw new Error('تبدیل ناموفق بود: ' + (r.err || 'خروجی ساخته نشد'));
      return { data: fs.readFileSync(outPath), ext: to, mime: (dstFmt || {}).mime || 'application/octet-stream',
        note: 'با ' + path.basename(bin) + ' تبدیل شد.' };
    } finally {
      try { fs.rmSync(tmp, { recursive: true, force: true }); } catch (e) {}
    }
  }

  const src = read(buf, fromName, opts);
  if (src.kind === 'binary') throw new Error(`فایل ${from} باینری است و هنوز خوانده نمی‌شود.`);
  if (src.kind === 'meta') throw new Error(`از فایل ${from} فقط اطلاعات کلی خوانده می‌شود، نه محتوایی که به ${to} تبدیل شود.`);

  const base = String(opts.name || fromName || 'file').replace(/\.[a-z0-9]+$/i, '') || 'file';
  const out = (data, note) => ({ data: Buffer.isBuffer(data) ? data : Buffer.from(String(data), 'utf8'),
    ext: to, mime: (dstFmt || {}).mime || 'text/plain', note: note || src.warning || '' });

  // Normalise whatever we read into the shape the target needs.
  const asText = () => src.kind === 'text' ? src.text
    : src.kind === 'doc' ? docToText(src)
    : tableToCsv(src, '\t');
  const asDoc = () => src.kind === 'doc' ? src
    : src.kind === 'text' ? textToDoc(src.text)
    : { kind: 'doc', title: '', blocks: [{ type: 'code', text: tableToMarkdown(src) }] };
  const asTable = () => {
    if (src.kind === 'table') return src;
    const lines = asText().split(/\r?\n/).filter((l) => l.trim());
    return { columns: ['خط', 'متن'], rows: lines.map((l, i) => [String(i + 1), l]) };
  };

  switch (to) {
    case 'txt': case 'text': case 'log': return out(asText());
    case 'md': case 'markdown':
      return out(src.kind === 'table' ? tableToMarkdown(src) : docToMarkdown(asDoc()));
    case 'html': case 'htm':
      return out(src.kind === 'table' ? tableToHtml(src, base) : docToHtml(asDoc(), base));
    case 'pdf':
      // A print-ready HTML page, not a fake PDF: the user opens it and presses
      // Ctrl+P > Save as PDF. A bundled PDF writer would need an embedded
      // Persian font and would shape Persian wrongly, which is worse than
      // honest. The note says exactly that.
      return { data: Buffer.from(src.kind === 'table' ? tableToHtml(src, base) : docToHtml(asDoc(), base), 'utf8'),
        ext: 'html', mime: 'text/html',
        note: 'برای PDF: این فایل را باز کن و Ctrl+P بزن و «Save as PDF» را انتخاب کن — این‌طور فارسی درست و راست‌به‌چپ چاپ می‌شود.' };
    case 'rtf': return out(textToRtf(asText()));
    case 'docx': return out(docToDocx(asDoc()));
    case 'xlsx': return out(tableToXlsx(asTable()));
    case 'csv': return out(tableToCsv(asTable(), ','));
    case 'tsv': return out(tableToCsv(asTable(), '\t'));
    case 'json': {
      const t = asTable();
      return out(JSON.stringify(tableToObjects(t), null, 2));
    }
    case 'jsonl': case 'ndjson': {
      const t = asTable();
      return out(tableToObjects(t).map((o) => JSON.stringify(o)).join('\n') + '\n');
    }
    case 'xml': return out(tableToXml(asTable()));
    case 'yaml': case 'yml': return out(tableToYaml(asTable()));
    case 'ini': return out(tableToIni(asTable()));
    default:
      throw new Error(`هنوز نمی‌توانم به ${to} تبدیل کنم. فرمت‌های مقصد: `
        + [...new Set([].concat(...Object.values(WRITERS)))].sort().join('، '));
  }
}

// ---------------------------------------------------------------------------
// The generated documentation — the "file at the root and in the brain"
// ---------------------------------------------------------------------------
const FAMILY_FA = {
  text: 'متن', code: 'کد برنامه', data: 'داده و تنظیمات', document: 'سند',
  spreadsheet: 'صفحه‌گسترده', slides: 'ارائه', image: 'تصویر', audio: 'صدا',
  video: 'ویدیو', archive: 'فایل فشرده', font: 'فونت', binary: 'باینری',
};

function formatsMarkdown() {
  const byFamily = {};
  for (const [ext, f] of Object.entries(FORMATS)) (byFamily[f.family] = byFamily[f.family] || []).push([ext, f]);
  const lines = [
    '# پسوندها و کانورتر ستایش',
    '',
    '> این فایل **خودکار ساخته می‌شود** از جدول `FORMATS` در `formats.js`.',
    '> دست‌نویسش نکن — کد را عوض کن، فایل خودش به‌روز می‌شود.',
    '',
    `تعداد پسوندهای شناخته‌شده: **${Object.keys(FORMATS).length}**`,
    '',
    '## این‌ها بدون هیچ نصبی کار می‌کنند',
    'متن، کد، داده (CSV/JSON/XML/YAML/INI)، اسناد Office جدید (.docx / .xlsx / .pptx)،',
    'OpenDocument، PDF (استخراج متن)، RTF، EPUB، فایل‌های فشرده و SQLite.',
    '',
    '## این‌ها به ابزار سیستم نیاز دارند',
    'تبدیل تصویر، صدا و ویدیو به همدیگر با **ffmpeg** یا **ImageMagick** انجام می‌شود.',
    'اگر روی این کامپیوتر نصب نباشند، ستایش صریح می‌گوید نصب نیست — الکی وانمود نمی‌کند.',
    '',
  ];
  for (const fam of Object.keys(FAMILY_FA)) {
    const list = (byFamily[fam] || []).sort((a, b) => a[0].localeCompare(b[0]));
    if (!list.length) continue;
    lines.push(`## ${FAMILY_FA[fam]}`, '', '| پسوند | خواندن | تبدیل به | توضیح |', '| --- | --- | --- | --- |');
    for (const [ext, f] of list) {
      const targets = conversionsFor(ext);
      const shown = targets.length > 10 ? targets.slice(0, 10).join('، ') + ' …' : (targets.join('، ') || '—');
      lines.push(`| \`.${ext}\` | ${f.reads || f.text ? '✅' : '—'} | ${shown} | ${f.note || ''} |`);
    }
    lines.push('');
  }
  lines.push('## چطور استفاده کنم',
    '',
    '- در چت بگو: «این فایل را به اکسل تبدیل کن» و فایل را بفرست.',
    '- برای فایل بزرگ لازم نیست کل فایل را بفرستی — مسیرش را بده،',
    '  ستایش تکه‌تکه می‌خواند و تحلیل می‌کند (`open_file` / `file_search` / `file_slice`).',
    '- فهرست زنده‌ی همین جدول از `GET /api/formats` هم می‌آید.',
    '');
  return lines.join('\n');
}

// Writes the root FORMATS.md and the brain's own copy. Called at boot, so the
// documentation is always what the code actually supports.
function writeFormatDocs(rootDir) {
  const md = formatsMarkdown();
  const targets = [
    path.join(rootDir, 'FORMATS.md'),
    path.join(rootDir, 'pybrain', 'vault', 'knowledge', 'file-formats.md'),
  ];
  const written = [];
  for (const t of targets) {
    try {
      fs.mkdirSync(path.dirname(t), { recursive: true });
      // Only rewrite when it actually changed, so the vault's file dates stay
      // meaningful and the brain does not re-index an identical note.
      let prev = '';
      try { prev = fs.readFileSync(t, 'utf8'); } catch (e) {}
      if (prev !== md) fs.writeFileSync(t, md);
      written.push(t);
    } catch (e) { /* read-only install: not worth failing boot over */ }
  }
  return { files: written, extensions: Object.keys(FORMATS).length };
}

module.exports = {
  FORMATS, WRITERS, describe, conversionsFor, extOf, formatsMarkdown, writeFormatDocs,
  read, convert, unzip, zip, parseCsv, tableFromObjects, tableToObjects,
  tableToCsv, tableToMarkdown, tableToHtml, tableToXlsx, docToMarkdown, docToText,
  docToDocx, htmlPage, stripTags, imageInfo, mediaTool, which,
};
