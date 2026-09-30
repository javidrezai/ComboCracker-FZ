'use strict';

// User code libraries — extracted from index.js as another step of splitting
// the server monolith into modules (charter rule 3.4). Behavior is unchanged;
// this is the same code, now owned by one module.
//
// Each library is one file inside code-library/. The user can create, upload,
// download and delete them from the app, and in chat say e.g.
// «از کتابخانه‌ی پایتون استفاده کن» or «از کل کتابخانه استفاده کن». Files are
// re-read each time so edits apply without a restart. Names are never trusted
// as paths: every segment is sanitised and the resolved path is checked
// against the root.
//
// makeCodeLib() returns { register, codeLibrary, listLibs, readLib, safeLibName }.
// index.js keeps codeLibrary() for the chat prompt builder; register(app, deps)
// mounts the HTTP routes. code-library/ sits next to this file, exactly as it
// did next to index.js, so __dirname resolves identically.

const fs = require('fs');
const path = require('path');

function makeCodeLib() {
  const CODE_LIB_DIR = path.join(__dirname, 'code-library');
  const OLD_CODE_LIB_FILE = path.join(__dirname, 'code-library.md');
  const LIB_MAX_PER = 12000;   // chars injected per library
  const LIB_MAX_TOTAL = 28000; // chars injected total when using "all"

  function ensureLibDir() {
    try {
      if (!fs.existsSync(CODE_LIB_DIR)) fs.mkdirSync(CODE_LIB_DIR, { recursive: true });
      // one-time migration of the old single-file library
      if (fs.existsSync(OLD_CODE_LIB_FILE)) {
        const dest = path.join(CODE_LIB_DIR, 'general.md');
        if (!fs.existsSync(dest)) fs.renameSync(OLD_CODE_LIB_FILE, dest);
      }
    } catch (e) {}
  }
  ensureLibDir();

  // A library "name" is the file name without extension. Keep names filesystem-safe.
  // Subfolders are allowed so the library can be organised like a real folder
  // ("python/helpers", "website/layout"), but each segment is sanitised and the
  // resolved path is checked against the root — a name is never trusted as a
  // path.
  function safeLibName(name) {
    return String(name || '')
      .replace(/\\/g, '/')
      .split('/')
      .map((seg) => seg.trim().replace(/[^\p{L}\p{N}_\-. ]/gu, '').replace(/^\.+/, '').trim())
      .filter((seg) => seg && seg !== '.' && seg !== '..')
      .slice(0, 3)                       // at most 2 folders deep
      .join('/')
      .slice(0, 120);
  }

  function libFileFor(name) {
    const safe = safeLibName(name);
    if (!safe) return null;
    const dir = path.dirname(safe) === '.' ? CODE_LIB_DIR : path.join(CODE_LIB_DIR, path.dirname(safe));
    const stem = path.parse(safe).name;
    try {
      if (fs.existsSync(dir)) {
        const hit = fs.readdirSync(dir).find((f) => path.parse(f).name.toLowerCase() === stem.toLowerCase());
        if (hit) {
          const full = path.resolve(dir, hit);
          if (full.startsWith(path.resolve(CODE_LIB_DIR) + path.sep)) return full;
        }
      }
    } catch (e) {}
    // New file: keep an explicit extension if one was given, else .md
    const hasExt = /\.[A-Za-z0-9]{1,8}$/.test(safe);
    const full = path.resolve(CODE_LIB_DIR, hasExt ? safe : safe + '.md');
    if (!full.startsWith(path.resolve(CODE_LIB_DIR) + path.sep)) return null;
    return full;
  }
  // Language is inferred from the extension, so the library behaves like a real
  // folder: drop a file in, it is filed correctly without anyone tagging it.
  const LIB_LANGS = {
    js:'JavaScript', mjs:'JavaScript', ts:'TypeScript', jsx:'React', tsx:'React',
    py:'Python', java:'Java', kt:'Kotlin', c:'C', h:'C', cpp:'C++', cs:'C#',
    go:'Go', rs:'Rust', rb:'Ruby', php:'PHP', swift:'Swift',
    sh:'Shell', bash:'Shell', ps1:'PowerShell', bat:'Batch',
    html:'HTML', htm:'HTML', css:'CSS', scss:'CSS',
    sql:'SQL', json:'JSON', yml:'YAML', yaml:'YAML', xml:'XML',
    md:'Markdown', txt:'Text', csv:'Data', ini:'Config', env:'Config',
    dockerfile:'Docker', makefile:'Make',
  };
  function libLang(file) {
    const ext = path.extname(file).replace('.', '').toLowerCase();
    if (LIB_LANGS[ext]) return LIB_LANGS[ext];
    const base = path.parse(file).name.toLowerCase();
    if (LIB_LANGS[base]) return LIB_LANGS[base];
    return 'Other';
  }

  // Recursive listing, so subfolders work — "linux/", "python/", "website/".
  function listLibs() {
    const out = [];
    const walk = (dir, prefix) => {
      let entries = [];
      try { entries = fs.readdirSync(dir, { withFileTypes: true }); } catch (e) { return; }
      for (const e of entries) {
        if (e.name.startsWith('.')) continue;
        const full = path.join(dir, e.name);
        const rel = prefix ? prefix + '/' + e.name : e.name;
        if (e.isDirectory()) { walk(full, rel); continue; }
        let size = 0, mtime = null;
        try { const st = fs.statSync(full); size = st.size; mtime = st.mtime.toISOString(); } catch (e2) {}
        out.push({
          name: rel.replace(/\.[^.]+$/, ''),
          file: rel,
          folder: prefix || '',
          ext: path.extname(e.name).replace('.', '').toLowerCase(),
          lang: libLang(e.name),
          size, mtime,
        });
      }
    };
    walk(CODE_LIB_DIR, '');
    return out.sort((a, b) => (a.folder || '').localeCompare(b.folder || '') || a.name.localeCompare(b.name));
  }
  function readLib(name) {
    const fp = libFileFor(name);
    try { if (fp && fs.existsSync(fp)) return fs.readFileSync(fp, 'utf8'); } catch (e) {}
    return '';
  }

  // Decide which libraries to inject, honoring an explicit selection (from the UI)
  // and natural-language commands in the message.
  function pickLibraries(selection, message) {
    const libs = listLibs();
    if (!libs.length) return { mode: 'none', names: [] };
    const sel = String(selection || '').trim().toLowerCase();
    const msg = String(message || '').toLowerCase();

    const wantsAll = sel === 'all' || sel === '*' ||
      /(کل|همه(‌| )ی?|تمام).{0,12}(کتابخانه|لایبرری|library)/.test(msg) ||
      /(whole|entire|all).{0,12}(librar)/.test(msg) ||
      /(کتابخانه|library).{0,12}(کامل|whole|entire)/.test(msg);
    if (wantsAll) return { mode: 'all', names: libs.map(l => l.name) };

    if (sel === 'none') return { mode: 'none', names: [] };

    // explicit UI selection of a single library
    if (sel) {
      const hit = libs.find(l => l.name.toLowerCase() === sel);
      if (hit) return { mode: 'one', names: [hit.name] };
    }

    // natural-language: "از کتابخانه‌ی پایتون" / "use the python library"
    const named = libs.filter(l => {
      const n = l.name.toLowerCase();
      return n && msg.includes(n);
    });
    const mentionsLib = /(کتابخانه|لایبرری|library|libraries)/.test(msg);
    if (named.length && mentionsLib) return { mode: 'some', names: named.map(l => l.name) };

    // AUTO: match a library to the programming language of the request, even when
    // the user never says the word "library". e.g. a Python question + a "python"
    // library present -> load it automatically.
    const LANG_ALIASES = {
      python: ['python', 'پایتون', 'py', 'django', 'flask', 'pandas', 'numpy'],
      cpp: ['c++', 'cpp', 'سی پلاس', 'سی‌پلاس'],
      c: ['c '],
      csharp: ['c#', 'csharp', 'سی شارپ', '.net', 'dotnet'],
      java: ['java', 'جاوا'],
      javascript: ['javascript', 'js', 'جاوااسکریپت', 'node', 'react', 'vue'],
      typescript: ['typescript', 'ts'],
      css: ['css', 'استایل', 'tailwind'],
      html: ['html'],
      php: ['php'],
      go: ['golang', 'go '],
      rust: ['rust', 'راست'],
      ruby: ['ruby', 'rails'],
      sql: ['sql', 'دیتابیس', 'database', 'query'],
      swift: ['swift'],
      kotlin: ['kotlin'],
      bash: ['bash', 'shell', 'اسکریپت شل'],
    };
    const autoMatch = libs.filter(l => {
      const aliases = LANG_ALIASES[l.name.toLowerCase()];
      if (aliases && aliases.some(a => msg.includes(a))) return true;
      return l.name.toLowerCase().length >= 3 && msg.includes(l.name.toLowerCase());
    });
    if (autoMatch.length) return { mode: 'some', names: autoMatch.map(l => l.name) };

    // default: no heavy injection, but let the model know what's available
    return { mode: 'index', names: libs.map(l => l.name) };
  }

  function codeLibrary(selection, message) {
    const pick = pickLibraries(selection, message);
    if (pick.mode === 'none' || !pick.names.length) return '';

    if (pick.mode === 'index') {
      return `\n\n*** USER CODE LIBRARIES (available) ***\nThe user has saved these named code libraries: ${pick.names.join(', ')}.\nIf their request clearly relates to one, reuse its patterns. They can also say «از کتابخانه‌ی <نام> استفاده کن» or «از کل کتابخانه استفاده کن» to load them explicitly.`;
    }

    let budget = LIB_MAX_TOTAL;
    const chunks = [];
    for (const name of pick.names) {
      if (budget <= 0) break;
      let txt = readLib(name).trim();
      if (!txt) continue;
      const cap = Math.min(LIB_MAX_PER, budget);
      if (txt.length > cap) txt = txt.slice(0, cap) + '\n... (truncated)';
      budget -= txt.length;
      chunks.push(`### Library: ${name}\n${txt}`);
    }
    if (!chunks.length) return '';
    const header = pick.mode === 'one'
      ? `The user asked you to use their «${pick.names[0]}» code library.`
      : `The user asked you to use their code libraries: ${pick.names.join(', ')}.`;
    return `\n\n*** USER CODE LIBRARY ***\n${header}\nWhen you write code, prefer and reuse these saved patterns, helpers, and conventions where they fit:\n\n${chunks.join('\n\n')}`;
  }

  function register(app, deps) {
    const { requireAuth, requireAdmin, upload } = deps;

    // List all libraries (everyone can see names; used to build the chat selector too).
    app.get('/api/codelibs', requireAuth, (req, res) => {
      res.json({ libs: listLibs() });
    });
    // Read one library's content by name.
    app.get('/api/codelib', requireAuth, (req, res) => {
      const name = req.query.name;
      if (!name) return res.json({ libs: listLibs() });
      res.json({ name: safeLibName(name), text: readLib(name) });
    });
    // Create or update a library (admin). Body: { name, text }.
    app.post('/api/codelib', requireAuth, requireAdmin, (req, res) => {
      const name = safeLibName((req.body && req.body.name) || '');
      if (!name) return res.status(400).json({ error: 'نام کتابخانه لازم است.' });
      const text = ((req.body && req.body.text) || '').toString().slice(0, 200000);
      try {
        ensureLibDir();
        const fp = libFileFor(name);
        if (!fp) return res.status(400).json({ error: 'نام نامعتبر است.' });
        fs.mkdirSync(path.dirname(fp), { recursive: true });
        fs.writeFileSync(fp, text);
        res.json({ ok: true, libs: listLibs() });
      } catch (e) { res.status(500).json({ error: e.message }); }
    });
    // Delete a library (admin).
    app.delete('/api/codelib', requireAuth, requireAdmin, (req, res) => {
      const name = safeLibName(req.query.name || (req.body && req.body.name) || '');
      if (!name) return res.status(400).json({ error: 'نام کتابخانه لازم است.' });
      try {
        const fp = libFileFor(name);
        if (fp && fs.existsSync(fp)) fs.unlinkSync(fp);
        res.json({ ok: true, libs: listLibs() });
      } catch (e) { res.status(500).json({ error: e.message }); }
    });
    // Download a library as a file.
    app.get('/api/codelib/download', requireAuth, (req, res) => {
      const name = safeLibName(req.query.name || '');
      const fp = name ? libFileFor(name) : null;
      if (!fp || !fs.existsSync(fp)) return res.status(404).json({ error: 'کتابخانه پیدا نشد.' });
      res.download(fp, path.basename(fp));
    });
    // Upload a file as a library (admin). The file becomes a library named after it
    // (or after body.name if given). Extension is preserved.
    app.post('/api/codelib/upload', requireAuth, requireAdmin, upload.single('file'), (req, res) => {
      if (!req.file) return res.status(400).json({ error: 'فایلی ارسال نشد.' });
      const ext = (path.extname(req.file.originalname) || '.txt').toLowerCase();
      let name = safeLibName((req.body && req.body.name) || path.parse(req.file.originalname).name);
      if (!name) name = 'library';
      try {
        ensureLibDir();
        fs.writeFileSync(path.join(CODE_LIB_DIR, name + ext), req.file.buffer);
        res.json({ ok: true, name, libs: listLibs() });
      } catch (e) { res.status(500).json({ error: e.message }); }
    });
  }

  return { register, codeLibrary, listLibs, readLib, safeLibName };
}

module.exports = { makeCodeLib };
