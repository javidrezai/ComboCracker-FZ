'use strict';

// bigfile.js — read and analyse files that are too big to hold in memory.
//
// The problem this solves: the chat used to need the whole file pasted in, so
// a 300 MB log or a 40 000-line source file simply could not be looked at. A
// model does not need the whole file either — it needs the SHAPE of it, then
// the few hundred lines that matter. So everything here streams:
//
//   stat/probe   what this file is, how big, what encoding, how many lines
//   outline      the map — functions, classes, headings, sections
//   head/tail    the ends, without reading the middle
//   slice        an exact line or byte range
//   search       streaming grep with context, bounded results
//   profile      per-column statistics for CSV/TSV, shape for JSON/JSONL
//   hexdump      for binaries
//
// Memory is bounded everywhere: nothing loads more than a window at a time,
// and every result is capped before it is returned. A 2 GB file costs the same
// RAM as a 2 KB one.
//
// SAFETY. These run on the owner's own machine, on his own files, which is the
// whole point — but two rules are absolute and enforced here rather than left
// to the caller:
//   1. Only the admin may read arbitrary paths. Family and child accounts are
//      refused at the tool gate.
//   2. Setayesh's OWN secret files are never readable through this, at all.
//      A chat can be answered by a cloud engine, so "read .setayesh-config"
//      would be a one-step path from a careless question to the family's API
//      keys and password hashes leaving the house.

const fs = require('fs');
const os = require('os');
const path = require('path');
const crypto = require('crypto');
const formats = require('./formats');

const MAX_RETURN_BYTES = 240 * 1024;        // never hand back more than this
const WINDOW = 1 << 20;                      // 1 MB read window

// ---------------------------------------------------------------------------
// The refusal list — secrets, never readable
// ---------------------------------------------------------------------------
// Matched on the BASENAME so it holds wherever the install lives, and on a few
// path fragments for whole directories of state.
const SECRET_NAMES = [
  /^\.setayesh-/i,                 // config, users, sessions, health, devices…
  /^\.env(\..*)?$/i,
  /^id_(rsa|ed25519|ecdsa|dsa)$/i,
  /^\.npmrc$/i, /^\.git-credentials$/i, /^\.htpasswd$/i,
  /^(shadow|gshadow|sudoers)$/i,
  /\.(pem|key|pfx|p12|keystore|jks)$/i,
];
const SECRET_DIRS = [
  /[\\/]\.setayesh-(chats|prefs|memory|backups)[\\/]/i,
  /[\\/]\.ssh[\\/]/i,
  /[\\/]\.gnupg[\\/]/i,
  /[\\/]\.aws[\\/]/i,
];

// The name patterns above are a good default, but they are still GUESSES. The
// server knows exactly which files hold its accounts, config and sessions —
// those paths are configurable, so on a install where the users file is called
// something else the pattern would miss it. index.js registers the real paths
// here at boot; this exact list is what actually protects the secrets.
const PROTECTED = new Set();
function protect(paths) {
  for (const p of [].concat(paths || [])) {
    if (p && typeof p === 'string') PROTECTED.add(path.resolve(p));
  }
  return PROTECTED.size;
}

function isSecretPath(p) {
  const norm = path.resolve(p);
  if (PROTECTED.has(norm)) return true;
  // A registered DIRECTORY protects everything under it (chats, prefs…).
  for (const prot of PROTECTED) {
    if (norm.startsWith(prot + path.sep)) return true;
  }
  if (SECRET_NAMES.some((re) => re.test(path.basename(p)))) return true;
  return SECRET_DIRS.some((re) => re.test(norm));
}

function resolveReadable(p) {
  if (!p || typeof p !== 'string') throw new Error('مسیر فایل داده نشد.');
  // ~ is what a person actually types.
  let full = p.trim().replace(/^~(?=[\\/]|$)/, os.homedir());
  full = path.resolve(full);
  if (isSecretPath(full)) {
    throw new Error('این فایل جزو فایل‌های محرمانه است (کلید، رمز یا تنظیمات خود ستایش) و خوانده نمی‌شود — '
      + 'حتی برای تو، چون جواب چت ممکن است از یک موتور ابری بیاید.');
  }
  let st;
  try { st = fs.statSync(full); }
  catch (e) { throw new Error('فایل پیدا نشد: ' + full); }
  if (st.isDirectory()) throw new Error('این یک پوشه است، نه فایل: ' + full);
  return { full, st };
}

// ---------------------------------------------------------------------------
// stat / probe
// ---------------------------------------------------------------------------
function human(n) {
  const u = ['B', 'KB', 'MB', 'GB', 'TB'];
  let i = 0, v = Number(n) || 0;
  while (v >= 1024 && i < u.length - 1) { v /= 1024; i++; }
  return (i ? v.toFixed(1) : String(v)) + ' ' + u[i];
}

// Shannon entropy over a sample — high entropy means compressed or encrypted
// (or, for a file that claims to be text, something worth a second look).
function entropy(buf) {
  if (!buf.length) return 0;
  const counts = new Uint32Array(256);
  for (const b of buf) counts[b]++;
  let h = 0;
  for (const c of counts) if (c) { const p = c / buf.length; h -= p * Math.log2(p); }
  return Math.round(h * 100) / 100;
}

function readAt(fd, position, length) {
  const buf = Buffer.alloc(Math.max(0, length));
  if (!buf.length) return buf;
  const n = fs.readSync(fd, buf, 0, buf.length, position);
  return buf.slice(0, n);
}

// Setayesh is a single-threaded server, so a scan that walks a few hundred
// megabytes without stopping freezes EVERYTHING — the chat, the other members'
// devices, the whole house — for as long as it runs. So every long walk yields
// back to the event loop every few windows. It costs almost nothing in total
// time and the app stays alive while she reads a huge file.
const YIELD_EVERY = 8;                        // windows between breaths
const breathe = () => new Promise((r) => setImmediate(r));

// Encoding sniff without a dependency: BOMs first, then UTF-8 validity, then
// the UTF-16 tell (lots of interleaved NUL bytes).
function sniffEncoding(sample) {
  if (sample.length >= 3 && sample[0] === 0xef && sample[1] === 0xbb && sample[2] === 0xbf) return { encoding: 'utf8', bom: true };
  if (sample.length >= 2 && sample[0] === 0xff && sample[1] === 0xfe) return { encoding: 'utf16le', bom: true };
  if (sample.length >= 2 && sample[0] === 0xfe && sample[1] === 0xff) return { encoding: 'utf16be', bom: true };
  const nuls = sample.filter((b) => b === 0).length;
  if (sample.length > 16 && nuls / sample.length > 0.25) {
    const evenNul = sample.filter((b, i) => b === 0 && i % 2 === 1).length;
    return { encoding: evenNul > nuls * 0.7 ? 'utf16le' : 'binary', bom: false };
  }
  // Does it decode as UTF-8 without replacement characters?
  const asUtf8 = sample.toString('utf8');
  const bad = (asUtf8.match(/�/g) || []).length;
  if (nuls === 0 && bad === 0) return { encoding: 'utf8', bom: false };
  if (nuls === 0 && bad / Math.max(1, asUtf8.length) < 0.01) return { encoding: 'utf8', bom: false, lossy: true };
  const ctrl = sample.filter((b) => b < 9 || (b > 13 && b < 32)).length;
  if (ctrl / Math.max(1, sample.length) > 0.05) return { encoding: 'binary', bom: false };
  return { encoding: 'latin1', bom: false };
}

function decode(buf, encoding) {
  if (encoding === 'utf16le') return buf.toString('utf16le');
  if (encoding === 'utf16be') {
    const swapped = Buffer.from(buf);
    for (let i = 0; i + 1 < swapped.length; i += 2) { const t = swapped[i]; swapped[i] = swapped[i + 1]; swapped[i + 1] = t; }
    return swapped.toString('utf16le');
  }
  if (encoding === 'latin1') return buf.toString('latin1');
  return buf.toString('utf8');
}

async function probe(p) {
  const { full, st } = resolveReadable(p);
  const ext = formats.extOf(full);
  const fmt = formats.describe(ext);
  const fd = fs.openSync(full, 'r');
  try {
    const head = readAt(fd, 0, Math.min(st.size, 64 * 1024));
    const enc = sniffEncoding(head);
    const info = {
      path: full,
      name: path.basename(full),
      ext,
      family: fmt ? fmt.family : 'unknown',
      mime: fmt ? fmt.mime : 'application/octet-stream',
      bytes: st.size,
      size: human(st.size),
      modified: st.mtime.toISOString(),
      encoding: enc.encoding,
      bom: enc.bom,
      entropy: entropy(head.slice(0, 16384)),
      binary: enc.encoding === 'binary',
      convertsTo: formats.conversionsFor(ext),
      note: fmt ? fmt.note : '',
    };
    if (info.binary) {
      info.preview = head.slice(0, 96).toString('hex').replace(/(..)/g, '$1 ').trim();
      if (info.entropy > 7.5) info.hint = 'انتروپی بالا — فایل فشرده یا رمزنگاری‌شده است.';
      return info;
    }
    // Line endings and an honest line count. Under 64 MB we count exactly;
    // above that we sample, because counting 4 GB to answer "how big is it"
    // is not worth the minutes.
    const text = decode(head, enc.encoding);
    info.lineEnding = /\r\n/.test(text) ? 'CRLF' : (/\r/.test(text) ? 'CR' : 'LF');
    if (st.size <= 64 * 1024 * 1024) {
      info.lines = await countLines(fd, st.size, enc.encoding);
      info.linesExact = true;
    } else {
      const sampleLines = (text.match(/\n/g) || []).length;
      info.lines = Math.round((sampleLines / Math.max(1, head.length)) * st.size);
      info.linesExact = false;
    }
    info.longestLineHint = Math.max(...text.split(/\r?\n/).slice(0, 500).map((l) => l.length), 0);
    return info;
  } finally { fs.closeSync(fd); }
}

async function countLines(fd, size, encoding) {
  let count = 0, pos = 0, lastByte = 0, windows = 0;
  const buf = Buffer.alloc(WINDOW);
  while (pos < size) {
    const n = fs.readSync(fd, buf, 0, Math.min(WINDOW, size - pos), pos);
    if (n <= 0) break;
    for (let i = 0; i < n; i++) if (buf[i] === 10) count++;
    lastByte = buf[n - 1];
    pos += n;
    if (++windows % YIELD_EVERY === 0) await breathe();
  }
  if (size > 0 && lastByte !== 10) count++;      // a final line without a newline
  return count;
}

// ---------------------------------------------------------------------------
// head / tail / slice
// ---------------------------------------------------------------------------
function cap(text) {
  const buf = Buffer.from(text, 'utf8');
  if (buf.length <= MAX_RETURN_BYTES) return { text, truncated: false };
  return { text: buf.slice(0, MAX_RETURN_BYTES).toString('utf8') + '\n…[بریده شد]', truncated: true };
}

async function head(p, lines) {
  const { full, st } = resolveReadable(p);
  const want = Math.max(1, Math.min(5000, Number(lines) || 200));
  const fd = fs.openSync(full, 'r');
  try {
    const enc = sniffEncoding(readAt(fd, 0, Math.min(st.size, 8192))).encoding;
    let out = '', pos = 0, got = 0, windows = 0;
    while (pos < st.size && got < want && Buffer.byteLength(out) < MAX_RETURN_BYTES) {
      const chunk = decode(readAt(fd, pos, Math.min(WINDOW, st.size - pos)), enc);
      pos += WINDOW;
      if (++windows % YIELD_EVERY === 0) await breathe();
      for (const line of chunk.split('\n')) {
        if (got >= want) break;
        out += line + '\n'; got++;
      }
    }
    return Object.assign({ path: full, from: 1, to: got }, cap(out));
  } finally { fs.closeSync(fd); }
}

async function tail(p, lines) {
  const { full, st } = resolveReadable(p);
  const want = Math.max(1, Math.min(5000, Number(lines) || 200));
  const fd = fs.openSync(full, 'r');
  try {
    const enc = sniffEncoding(readAt(fd, 0, Math.min(st.size, 8192))).encoding;
    // Walk backwards a window at a time until enough newlines are behind us.
    let pos = st.size, collected = Buffer.alloc(0), newlines = 0;
    while (pos > 0 && newlines <= want && collected.length < MAX_RETURN_BYTES * 2) {
      const take = Math.min(WINDOW, pos);
      pos -= take;
      const chunk = readAt(fd, pos, take);
      collected = Buffer.concat([chunk, collected]);
      for (const b of chunk) if (b === 10) newlines++;
    }
    const all = decode(collected, enc).split('\n');
    const out = all.slice(Math.max(0, all.length - want - 1)).join('\n');
    return Object.assign({ path: full, lines: want }, cap(out));
  } finally { fs.closeSync(fd); }
}

// An exact line range — how the model reads "the part that matters" after a
// search or an outline points at it.
async function slice(p, fromLine, toLine) {
  const { full, st } = resolveReadable(p);
  const from = Math.max(1, Number(fromLine) || 1);
  const to = Math.max(from, Math.min(from + 4000, Number(toLine) || from + 200));
  const fd = fs.openSync(full, 'r');
  try {
    const enc = sniffEncoding(readAt(fd, 0, Math.min(st.size, 8192))).encoding;
    let pos = 0, lineNo = 0, carry = '', out = [], windows = 0;
    while (pos < st.size && lineNo < to) {
      const chunk = carry + decode(readAt(fd, pos, Math.min(WINDOW, st.size - pos)), enc);
      pos += WINDOW;
      if (++windows % YIELD_EVERY === 0) await breathe();
      const parts = chunk.split('\n');
      carry = pos < st.size ? parts.pop() : '';
      for (const line of parts) {
        lineNo++;
        if (lineNo >= from && lineNo <= to) out.push(lineNo + ': ' + line);
        if (lineNo > to) break;
      }
    }
    if (carry && lineNo < to) { lineNo++; if (lineNo >= from) out.push(lineNo + ': ' + carry); }
    return Object.assign({ path: full, from, to: Math.min(to, lineNo) }, cap(out.join('\n')));
  } finally { fs.closeSync(fd); }
}

// ---------------------------------------------------------------------------
// search — streaming grep with context
// ---------------------------------------------------------------------------
async function search(p, pattern, opts) {
  opts = opts || {};
  const { full, st } = resolveReadable(p);
  if (!pattern) throw new Error('چیزی برای جست‌وجو داده نشد.');
  const max = Math.max(1, Math.min(500, Number(opts.max) || 60));
  const ctx = Math.max(0, Math.min(10, Number(opts.context) == null ? 2 : Number(opts.context)));
  let re;
  if (opts.regex) {
    try { re = new RegExp(pattern, opts.ignoreCase ? 'i' : ''); }
    catch (e) { throw new Error('الگوی جست‌وجو معتبر نیست: ' + e.message); }
  } else {
    re = new RegExp(String(pattern).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), opts.ignoreCase === false ? '' : 'i');
  }
  // Match against a WHOLE WINDOW at a time, not line by line. The obvious
  // implementation — split each megabyte into lines and test every one — makes
  // one short-lived string per line, which is five and a half MILLION of them
  // for a 231 MB log. Inside a long-running server, where the heap is already
  // full of real objects, that garbage made the same search take ten times
  // longer than it does in a fresh process. Scanning the window and slicing out
  // only the lines around an actual hit keeps the allocations proportional to
  // the number of results instead of the size of the file.
  const g = new RegExp(re.source, re.flags.includes('g') ? re.flags : re.flags + 'g');

  const fd = fs.openSync(full, 'r');
  try {
    const enc = sniffEncoding(readAt(fd, 0, Math.min(st.size, 8192))).encoding;
    const hits = [];
    let pos = 0, total = 0, windows = 0;
    let carry = '';            // trailing partial line from the previous window
    let baseLine = 1;          // line number of the first character in `carry`
    let pendingAfter = [];     // hits still collecting their trailing context

    // Count newlines in text[0..end) — used to turn an offset into a line no.
    const lineAt = (text, end) => {
      let n = 0;
      for (let i = 0; i < end; i++) if (text.charCodeAt(i) === 10) n++;
      return n;
    };
    const lineBounds = (text, at) => {
      let s = text.lastIndexOf('\n', at) + 1;
      let e = text.indexOf('\n', at);
      if (e === -1) e = text.length;
      return [s, e];
    };
    const clip = (s, n) => (s.length > n ? s.slice(0, n) + '…' : s);

    const scanWindow = (text, isLast) => {
      // Keep the last partial line for the next window so a match that spans
      // the boundary is not missed and line numbers stay right.
      let usable = text;
      let keep = '';
      if (!isLast) {
        const cut = text.lastIndexOf('\n');
        if (cut === -1) { carry = text; return; }       // no newline at all yet
        usable = text.slice(0, cut + 1);
        keep = text.slice(cut + 1);
      }
      g.lastIndex = 0;
      let m;
      while ((m = g.exec(usable)) !== null) {
        total++;
        if (hits.length < max) {
          const [ls, le] = lineBounds(usable, m.index);
          const lineNo = baseLine + lineAt(usable, ls);
          const before = [];
          let s = ls;
          for (let k = 0; k < ctx && s > 0; k++) {
            const ps = usable.lastIndexOf('\n', s - 2) + 1;
            before.unshift((lineNo - k - 1) + ': ' + clip(usable.slice(ps, s - 1).replace(/\r$/, ''), 300));
            s = ps;
          }
          const hit = { line: lineNo, text: clip(usable.slice(ls, le).replace(/\r$/, ''), 600), before, after: [] };
          // Trailing context may continue past this window, so collect what is
          // here and let the next window finish it.
          let e = le;
          for (let k = 0; k < ctx && e < usable.length; k++) {
            const ne = usable.indexOf('\n', e + 1);
            const stop = ne === -1 ? usable.length : ne;
            hit.after.push((lineNo + k + 1) + ': ' + clip(usable.slice(e + 1, stop).replace(/\r$/, ''), 300));
            e = stop;
            if (ne === -1) break;
          }
          hits.push(hit);
          if (hit.after.length < ctx) pendingAfter.push(hit);
        }
        if (m.index === g.lastIndex) g.lastIndex++;      // zero-width match guard
      }
      // Finish the trailing context of hits from the previous window.
      if (pendingAfter.length) {
        for (const h of pendingAfter) {
          let e = -1;
          for (let k = h.after.length; k < ctx; k++) {
            const ne = usable.indexOf('\n', e + 1);
            const stop = ne === -1 ? usable.length : ne;
            if (stop <= e + 1) break;
            h.after.push((h.line + k + 1) + ': ' + clip(usable.slice(e + 1, stop).replace(/\r$/, ''), 300));
            e = stop;
            if (ne === -1) break;
          }
        }
        pendingAfter = pendingAfter.filter((h) => h.after.length < ctx);
      }
      baseLine += lineAt(usable, usable.length);
      carry = keep;
    };

    while (pos < st.size) {
      const raw = readAt(fd, pos, Math.min(WINDOW, st.size - pos));
      pos += WINDOW;
      scanWindow(carry + decode(raw, enc), pos >= st.size);
      if (++windows % YIELD_EVERY === 0) await breathe();
      if (total > 20000) break;      // plenty; stop rather than grind on
    }
    if (carry) scanWindow(carry, true);

    return { path: full, pattern: String(pattern), matches: total, shown: hits.length, hits,
      note: total > hits.length ? `${total} مورد پیدا شد، ${hits.length} تای اول نشان داده شد.` : '' };
  } finally { fs.closeSync(fd); }
}

// ---------------------------------------------------------------------------
// outline — the map of a file
// ---------------------------------------------------------------------------
// Deliberately regex-based rather than a parser per language: it has to work
// on 30 languages, on a truncated file, and on code that does not compile.
// Being approximately right on everything beats being exactly right on one.
const OUTLINE_RULES = [
  { ext: ['js', 'mjs', 'cjs', 'ts', 'tsx', 'jsx', 'vue', 'svelte'], rules: [
    [/^\s*(?:export\s+)?(?:default\s+)?(?:async\s+)?function\s*\*?\s*([A-Za-z0-9_$]+)/, 'function'],
    [/^\s*(?:export\s+)?class\s+([A-Za-z0-9_$]+)/, 'class'],
    [/^\s*(?:export\s+)?(?:const|let|var)\s+([A-Za-z0-9_$]+)\s*=\s*(?:async\s*)?(?:\([^)]*\)|[A-Za-z0-9_$]+)\s*=>/, 'function'],
    [/^\s*(?:export\s+)?(?:const|let|var)\s+([A-Za-z0-9_$]+)\s*=\s*(?:async\s+)?function/, 'function'],
    // A bare `name(...) {` is a method — but `if (...) {` and friends look
    // exactly the same, so the keywords are excluded or the map fills up with
    // hundreds of "if"s.
    [/^\s*(?!(?:if|for|while|switch|catch|do|else|return|try|function|class|with)\b)([A-Za-z0-9_$]+)\s*\([^)]*\)\s*\{\s*$/, 'method'],
    [/^\s*(?:import|export)\s.*from\s+['"]([^'"]+)['"]/, 'import'],
    [/^\s*(?:const|let|var)\s+.*=\s*require\(['"]([^'"]+)['"]\)/, 'import'],
    [/^\s*app\.(get|post|put|patch|delete|use)\(\s*['"`]([^'"`]+)/, 'route'],
  ] },
  { ext: ['py'], rules: [
    [/^\s*def\s+([A-Za-z0-9_]+)/, 'function'],
    [/^\s*class\s+([A-Za-z0-9_]+)/, 'class'],
    [/^\s*(?:from\s+([A-Za-z0-9_.]+)\s+import|import\s+([A-Za-z0-9_.]+))/, 'import'],
    [/^\s*@([A-Za-z0-9_.]+)/, 'decorator'],
  ] },
  { ext: ['java', 'kt', 'cs', 'scala', 'swift', 'dart'], rules: [
    [/^\s*(?:public|private|protected|internal|open|final|abstract|static|\s)*(?:class|interface|enum|struct|object)\s+([A-Za-z0-9_]+)/, 'class'],
    [/^\s*(?:public|private|protected|internal|static|override|fun|func|\s)+[A-Za-z0-9_<>\[\],.?]+\s+([A-Za-z0-9_]+)\s*\(/, 'method'],
    [/^\s*(?:import|using)\s+([A-Za-z0-9_.*]+)/, 'import'],
  ] },
  { ext: ['go'], rules: [
    [/^\s*func\s+(?:\([^)]*\)\s*)?([A-Za-z0-9_]+)/, 'function'],
    [/^\s*type\s+([A-Za-z0-9_]+)\s+(?:struct|interface)/, 'type'],
    [/^\s*"([^"]+)"\s*$/, 'import'],
  ] },
  { ext: ['rs'], rules: [
    [/^\s*(?:pub\s+)?(?:async\s+)?fn\s+([A-Za-z0-9_]+)/, 'function'],
    [/^\s*(?:pub\s+)?(?:struct|enum|trait|impl)\s+([A-Za-z0-9_]+)/, 'type'],
    [/^\s*use\s+([A-Za-z0-9_:{}, ]+);/, 'import'],
  ] },
  { ext: ['c', 'h', 'cpp', 'cc', 'hpp'], rules: [
    [/^[A-Za-z_][A-Za-z0-9_ \t*&:<>]*\s+\*?([A-Za-z0-9_]+)\s*\([^;]*\)\s*\{?\s*$/, 'function'],
    [/^\s*(?:class|struct|union|enum)\s+([A-Za-z0-9_]+)/, 'type'],
    [/^\s*#include\s+[<"]([^>"]+)[>"]/, 'import'],
  ] },
  { ext: ['php', 'rb'], rules: [
    [/^\s*(?:public|private|protected|static|\s)*function\s+([A-Za-z0-9_]+)/, 'function'],
    [/^\s*(?:def)\s+([A-Za-z0-9_?!]+)/, 'function'],
    [/^\s*(?:class|module|trait|interface)\s+([A-Za-z0-9_:]+)/, 'class'],
    [/^\s*(?:require|require_relative|include|use)\s+['"]?([A-Za-z0-9_./\\]+)/, 'import'],
  ] },
  { ext: ['sh', 'bash', 'zsh'], rules: [
    [/^\s*(?:function\s+)?([A-Za-z0-9_]+)\s*\(\)\s*\{/, 'function'],
  ] },
  { ext: ['sql'], rules: [
    [/^\s*CREATE\s+(?:OR\s+REPLACE\s+)?(?:TABLE|VIEW|INDEX|FUNCTION|PROCEDURE)\s+[`"'\[]?([A-Za-z0-9_.]+)/i, 'object'],
  ] },
  { ext: ['css', 'scss', 'less'], rules: [
    [/^\s*([.#][A-Za-z0-9_-]+[^{]*)\{/, 'rule'],
    [/^\s*@(media|keyframes|import)\b(.*)$/, 'at-rule'],
  ] },
  { ext: ['md', 'markdown', 'rst', 'adoc'], rules: [
    [/^(#{1,6})\s+(.*)$/, 'heading'],
  ] },
  { ext: ['html', 'htm'], rules: [
    [/^\s*<(h[1-6])[^>]*>([^<]+)/, 'heading'],
    [/\bid="([A-Za-z0-9_-]+)"/, 'id'],
  ] },
  { ext: ['yaml', 'yml'], rules: [
    [/^([A-Za-z0-9_-]+):\s*$/, 'section'],
  ] },
  { ext: ['ini', 'cfg', 'conf', 'toml'], rules: [
    [/^\s*\[([^\]]+)\]/, 'section'],
  ] },
];

function rulesFor(ext) {
  const r = OUTLINE_RULES.find((x) => x.ext.includes(ext));
  return r ? r.rules : null;
}

async function outline(p, opts) {
  opts = opts || {};
  const { full, st } = resolveReadable(p);
  const ext = formats.extOf(full);
  const rules = rulesFor(ext);
  const max = Math.max(10, Math.min(4000, Number(opts.max) || 600));
  const fd = fs.openSync(full, 'r');
  try {
    const enc = sniffEncoding(readAt(fd, 0, Math.min(st.size, 8192))).encoding;
    if (enc === 'binary') {
      return { path: full, binary: true, items: [],
        note: 'این فایل باینری است — به‌جای نقشه، اطلاعات کلی و hexdump بگیر.' };
    }
    if (!rules) {
      // No language rules: fall back to blank-line-separated sections, which
      // is still a usable map of a big log or a plain text file.
      const h = await head(full, 40);
      return { path: full, items: [], unmapped: true, preview: h.text,
        note: `برای پسوند .${ext} نقشه‌ی ساختاری تعریف نشده — اول چند خط را نگاه کن، بعد با file_search بگرد.` };
    }
    const items = [];
    const counts = {};
    let pos = 0, lineNo = 0, carry = '', windows = 0;
    const scan = (line) => {
      lineNo++;
      if (items.length >= max) return;
      for (const [re, kind] of rules) {
        const m = line.match(re);
        if (!m) continue;
        const name = (m[2] != null && kind !== 'heading' ? m[2] : m[1]) || '';
        if (!name || !String(name).trim()) continue;
        const item = { line: lineNo, kind, name: String(name).trim().slice(0, 120) };
        if (kind === 'heading' && m[1] && /^#+$/.test(m[1])) { item.level = m[1].length; item.name = String(m[2]).trim().slice(0, 120); }
        if (kind === 'route' && m[2]) item.name = m[1].toUpperCase() + ' ' + m[2];
        items.push(item);
        counts[kind] = (counts[kind] || 0) + 1;
        break;      // one classification per line
      }
    };
    while (pos < st.size) {
      const chunk = carry + decode(readAt(fd, pos, Math.min(WINDOW, st.size - pos)), enc);
      pos += WINDOW;
      const parts = chunk.split('\n');
      carry = pos < st.size ? parts.pop() : '';
      for (const line of parts) scan(line.replace(/\r$/, ''));
      if (++windows % YIELD_EVERY === 0) await breathe();
    }
    if (carry) scan(carry);
    return { path: full, lines: lineNo, items, counts,
      truncated: items.length >= max,
      note: items.length >= max ? `فقط ${max} مورد اول نشان داده شد.` : '' };
  } finally { fs.closeSync(fd); }
}

// ---------------------------------------------------------------------------
// profile — statistics, without loading the file
// ---------------------------------------------------------------------------
function guessType(values) {
  let num = 0, date = 0, bool = 0, empty = 0;
  for (const v of values) {
    const s = String(v == null ? '' : v).trim();
    if (!s) { empty++; continue; }
    if (/^-?\d{1,15}(\.\d+)?$/.test(s)) num++;
    else if (/^(true|false|yes|no|بله|خیر)$/i.test(s)) bool++;
    else if (/^\d{4}-\d{2}-\d{2}([T ]\d{2}:\d{2})?/.test(s) || /^\d{1,2}[/.]\d{1,2}[/.]\d{2,4}$/.test(s)) date++;
  }
  const filled = values.length - empty;
  if (!filled) return 'empty';
  if (num / filled > 0.9) return 'number';
  if (date / filled > 0.9) return 'date';
  if (bool / filled > 0.9) return 'boolean';
  return 'text';
}

async function profile(p, opts) {
  opts = opts || {};
  const { full, st } = resolveReadable(p);
  const ext = formats.extOf(full);
  const sampleRows = Math.max(50, Math.min(20000, Number(opts.rows) || 5000));

  if (['csv', 'tsv'].includes(ext)) {
    const delim = ext === 'tsv' ? '\t' : ',';
    const fd = fs.openSync(full, 'r');
    let text;
    try {
      // Read enough for the sample; a huge CSV is profiled from its first MBs,
      // which is honest as long as we say so.
      const take = Math.min(st.size, 12 * 1024 * 1024);
      text = decode(readAt(fd, 0, take), sniffEncoding(readAt(fd, 0, 8192)).encoding);
    } finally { fs.closeSync(fd); }
    const grid = formats.parseCsv(text, delim);
    if (!grid.length) return { path: full, error: 'فایل خالی است یا ستونی پیدا نشد.' };
    const columns = grid[0];
    const rows = grid.slice(1, sampleRows + 1);
    const stats = columns.map((name, i) => {
      const vals = rows.map((r) => r[i]);
      const nonEmpty = vals.filter((v) => String(v == null ? '' : v).trim() !== '');
      const type = guessType(vals);
      const col = { name, type, filled: nonEmpty.length, empty: vals.length - nonEmpty.length,
        unique: new Set(nonEmpty.map(String)).size };
      if (type === 'number') {
        const nums = nonEmpty.map(Number).filter((n) => Number.isFinite(n));
        if (nums.length) {
          col.min = Math.min(...nums); col.max = Math.max(...nums);
          col.mean = Math.round((nums.reduce((a, b) => a + b, 0) / nums.length) * 1000) / 1000;
        }
      } else {
        col.examples = [...new Set(nonEmpty.map(String))].slice(0, 3);
      }
      return col;
    });
    return { path: full, kind: 'table', columns: stats, sampledRows: rows.length,
      complete: st.size <= 12 * 1024 * 1024,
      note: st.size > 12 * 1024 * 1024 ? 'فایل بزرگ است — آمار از روی چند مگابایت اول محاسبه شد.' : '' };
  }

  if (['json', 'jsonl', 'ndjson'].includes(ext)) {
    const fd = fs.openSync(full, 'r');
    let text;
    try { text = decode(readAt(fd, 0, Math.min(st.size, 8 * 1024 * 1024)), 'utf8'); }
    finally { fs.closeSync(fd); }
    if (ext === 'json') {
      let data;
      try { data = JSON.parse(text); }
      catch (e) { return { path: full, error: 'JSON کامل خوانده نشد (شاید فایل بزرگ‌تر از نمونه است): ' + e.message }; }
      return { path: full, kind: 'json', shape: shapeOf(data) };
    }
    const objs = [];
    for (const line of text.split('\n')) {
      if (objs.length >= sampleRows) break;
      if (!line.trim()) continue;
      try { objs.push(JSON.parse(line)); } catch (e) { /* skip */ }
    }
    return { path: full, kind: 'jsonl', records: objs.length, shape: shapeOf(objs.slice(0, 200)) };
  }

  // Anything else: line-length and word statistics, which is what you want for
  // a log file.
  const pr = await probe(full);
  if (pr.binary) return Object.assign({ kind: 'binary' }, pr);
  const h = await head(full, 2000);
  const lines = h.text.split('\n');
  const lens = lines.map((l) => l.length);
  return { path: full, kind: 'text', lines: pr.lines, linesExact: pr.linesExact,
    avgLineLength: Math.round(lens.reduce((a, b) => a + b, 0) / Math.max(1, lens.length)),
    longestLine: Math.max(0, ...lens), encoding: pr.encoding, size: pr.size };
}

function shapeOf(v, depth) {
  depth = depth || 0;
  if (depth > 4) return '…';
  if (Array.isArray(v)) return v.length ? [shapeOf(v[0], depth + 1), `×${v.length}`] : [];
  if (v === null) return 'null';
  if (typeof v === 'object') {
    const o = {};
    for (const k of Object.keys(v).slice(0, 40)) o[k] = shapeOf(v[k], depth + 1);
    return o;
  }
  return typeof v;
}

// ---------------------------------------------------------------------------
// hexdump + checksum
// ---------------------------------------------------------------------------
function hexdump(p, offset, length) {
  const { full, st } = resolveReadable(p);
  const off = Math.max(0, Math.min(st.size, Number(offset) || 0));
  const len = Math.max(16, Math.min(4096, Number(length) || 512));
  const fd = fs.openSync(full, 'r');
  try {
    const buf = readAt(fd, off, Math.min(len, st.size - off));
    const lines = [];
    for (let i = 0; i < buf.length; i += 16) {
      const row = buf.slice(i, i + 16);
      const hex = [...row].map((b) => b.toString(16).padStart(2, '0')).join(' ').padEnd(47);
      const ascii = [...row].map((b) => (b >= 32 && b < 127 ? String.fromCharCode(b) : '.')).join('');
      lines.push((off + i).toString(16).padStart(8, '0') + '  ' + hex + '  |' + ascii + '|');
    }
    return { path: full, offset: off, bytes: buf.length, dump: lines.join('\n') };
  } finally { fs.closeSync(fd); }
}

async function checksum(p) {
  const { full } = resolveReadable(p);
  const sha = crypto.createHash('sha256');
  const md5 = crypto.createHash('md5');
  const fd = fs.openSync(full, 'r');
  try {
    const st = fs.fstatSync(fd);
    const buf = Buffer.alloc(WINDOW);
    let pos = 0, windows = 0;
    while (pos < st.size) {
      const n = fs.readSync(fd, buf, 0, Math.min(WINDOW, st.size - pos), pos);
      if (n <= 0) break;
      sha.update(buf.slice(0, n)); md5.update(buf.slice(0, n));
      pos += n;
      if (++windows % YIELD_EVERY === 0) await breathe();
    }
    return { path: full, bytes: st.size, sha256: sha.digest('hex'), md5: md5.digest('hex') };
  } finally { fs.closeSync(fd); }
}

// ---------------------------------------------------------------------------
// open — the one call that starts every conversation about a file
// ---------------------------------------------------------------------------
// Gives the model everything it needs to decide what to do next: what the file
// is, its map, and the beginning of it — without ever loading the whole thing.
async function open(p, opts) {
  opts = opts || {};
  const info = await probe(p);
  const out = { file: info };
  if (info.binary) {
    out.hex = hexdump(info.path, 0, 256).dump;
    out.advice = 'باینری است. برای فایل‌های Office/PDF/ZIP از convert_file یا read استفاده کن.';
    return out;
  }
  // A document format has structure worth reading properly instead of as raw
  // bytes — hand it to the format reader and give back real content.
  if (['pdf', 'docx', 'xlsx', 'pptx', 'odt', 'ods', 'epub'].includes(info.ext)) {
    try {
      const parsed = formats.read(fs.readFileSync(info.path), info.path);
      if (parsed.kind === 'text') Object.assign(out, cap(parsed.text), { warning: parsed.warning });
      else if (parsed.kind === 'table') {
        out.columns = parsed.columns;
        out.rows = parsed.rows.slice(0, 200);
        out.totalRows = parsed.rows.length;
      } else if (parsed.kind === 'doc') {
        Object.assign(out, cap(formats.docToMarkdown(parsed)));
      }
      if (parsed.lowQuality) out.lowQuality = true;
      return out;
    } catch (e) { out.parseError = e.message; }
  }
  const map = await outline(info.path, { max: Number(opts.outline) || 300 });
  out.outline = map.items || [];
  out.outlineCounts = map.counts || {};
  if (map.note) out.outlineNote = map.note;
  const h = await head(info.path, Number(opts.lines) || 120);
  out.head = h.text;
  out.advice = info.lines > 400
    ? 'فایل بزرگ است: از file_search برای پیدا کردن جای موضوع و از file_slice برای خواندن همان تکه استفاده کن.'
    : '';
  return out;
}

module.exports = {
  probe, open, head, tail, slice, search, outline, profile, hexdump, checksum,
  isSecretPath, resolveReadable, protect, human, entropy, sniffEncoding,
};
