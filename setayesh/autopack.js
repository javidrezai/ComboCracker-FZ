'use strict';
// ---------------------------------------------------------------------------
// Auto-package: turn code the model WROTE into a real downloadable file.
// ---------------------------------------------------------------------------
// The problem this solves: when the owner asks for a zip/file, a weak engine
// (Codestral, a local model, …) that cannot CALL the make_files tool just prints
// the code as text and never produces a download — "میسازم" forever, no file.
// So the server does it deterministically: if the reply contains fenced code
// blocks and the owner asked for a file/zip, we extract the blocks into real
// files and the caller zips them. Engine-independent — works no matter which
// model answered, or whether it can call tools at all.
//
// Both functions here are PURE (no fs, no state) so they unit-test cleanly; the
// caller (index.js) writes the files and builds the zip.

// Does the user's message actually ask for a file/zip/download/app/project?
function wantsFileDelivery(message) {
  const s = String(message || '');
  return /زیپ|zip|فایل|\bfiles?\b|دانلود|download|پروژه|project|\bاپ\b|\bapp\b|اپلیکیشن|application|بسته‌?ای?|package|export|خروجی|بهم بده|تحویل/i.test(s);
}

// Map a fenced-block language tag to a file extension.
const LANG_EXT = {
  js: 'js', javascript: 'js', jsx: 'jsx', mjs: 'mjs', cjs: 'cjs',
  ts: 'ts', typescript: 'ts', tsx: 'tsx',
  py: 'py', python: 'py',
  html: 'html', htm: 'html', xml: 'xml', svg: 'svg',
  css: 'css', scss: 'scss', less: 'less',
  json: 'json', yaml: 'yml', yml: 'yml', toml: 'toml', ini: 'ini',
  sh: 'sh', bash: 'sh', shell: 'sh', zsh: 'sh', bat: 'bat', ps1: 'ps1',
  java: 'java', kotlin: 'kt', kt: 'kt', swift: 'swift',
  c: 'c', h: 'h', cpp: 'cpp', 'c++': 'cpp', cs: 'cs', csharp: 'cs',
  go: 'go', rust: 'rs', rs: 'rs', php: 'php', rb: 'rb', ruby: 'rb',
  dart: 'dart', sql: 'sql', md: 'md', markdown: 'md', txt: 'txt', text: 'txt',
  dockerfile: 'dockerfile', makefile: 'mk', gradle: 'gradle',
};

// A sensible default filename for a lone block of a common type.
const LANG_DEFAULT_NAME = {
  html: 'index.html', css: 'style.css', js: 'script.js', py: 'main.py',
  ts: 'main.ts', json: 'data.json', sql: 'query.sql', sh: 'run.sh', md: 'README.md',
};

function extFor(lang) {
  const l = String(lang || '').trim().toLowerCase();
  return LANG_EXT[l] || (/^[a-z0-9+#.]{1,10}$/.test(l) ? (LANG_EXT[l] || 'txt') : 'txt');
}

// Pull a filename the model may have named — either on the fence line
// (```js src/app.js) or as the first-line comment (// file: src/app.js,
// # file: x.py, <!-- file: x.html -->, /* file: x.css */).
function nameFromInfo(info) {
  const m = String(info || '').trim().match(/([\w./-]+\.[A-Za-z0-9]{1,8})\s*$/);
  return m ? m[1] : '';
}
function nameFromFirstLine(body) {
  const first = String(body || '').split('\n', 1)[0] || '';
  const m = first.match(/(?:\/\/|#|<!--|\/\*|--)\s*(?:file|filename|path)\s*[:=]\s*([\w./-]+\.[A-Za-z0-9]{1,8})/i);
  return m ? m[1] : '';
}

// Extract downloadable files from fenced code blocks in a reply.
// Returns [{ name, content }]; empty if there is no real code to package.
// `minChars` guards against packaging a tiny inline snippet as a "project".
function extractCodeFiles(reply, opts) {
  opts = opts || {};
  const minChars = opts.minChars != null ? opts.minChars : 15;
  const text = String(reply || '');
  const re = /```([^\n`]*)\n([\s\S]*?)```/g;
  const out = [];
  const used = new Set();
  let m, i = 0;
  while ((m = re.exec(text))) {
    const info = (m[1] || '').trim();
    let body = m[2] || '';
    if (body.replace(/\s/g, '').length < minChars) continue;   // too small to be a file
    const lang = info.split(/\s+/)[0] || '';
    let name = nameFromInfo(info) || nameFromFirstLine(body);
    if (name) {
      // Drop a leading "// file: …" hint line from the content once we've used it.
      body = body.replace(/^[^\n]*(?:file|filename|path)\s*[:=][^\n]*\n/i, '');
    } else {
      const ext = extFor(lang);
      name = LANG_DEFAULT_NAME[ext] || ('file' + (i + 1) + '.' + ext);
    }
    // Keep names unique.
    let unique = name, n = 2;
    while (used.has(unique.toLowerCase())) {
      const dot = name.lastIndexOf('.');
      unique = dot > 0 ? name.slice(0, dot) + '-' + n + name.slice(dot) : name + '-' + n;
      n++;
    }
    used.add(unique.toLowerCase());
    out.push({ name: unique, content: body.replace(/\s+$/, '') + '\n' });
    i++;
  }
  return out;
}

module.exports = { wantsFileDelivery, extractCodeFiles, extFor };
