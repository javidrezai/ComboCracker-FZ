'use strict';

// devlibs.js — the household works in code and design, so it keeps its own
// stocked shelf of the best libraries for every language it touches.
//
// Three parts, and the boundaries between them are the point:
//
//   CATALOG      a curated "best of" per language — the big, proven libraries
//                a working dev actually reaches for. This is KNOWLEDGE: it is
//                data, it works offline, and Setayesh uses it to recommend and
//                scaffold even when nothing is downloaded.
//
//   toolchains() what is actually installed on THIS machine — node/npm, python/
//                pip, cargo, go, java+maven, dotnet, php/composer, ruby/gem —
//                so the app says plainly what is ready and what to install,
//                instead of guessing.
//
//   download()   fetches a chosen set into a local folder using whatever
//                manager is present. DOWNLOAD ONLY, never install: npm pack and
//                pip download fetch archives without running a single install
//                script, cargo/go fetch fill their read-only caches. A package
//                manager's own install hooks are the classic supply-chain
//                foothold, so nothing here ever executes them.
//
// Stdlib only. The managers do the fetching; this just drives them with
// argument arrays (never a shell), a timeout, and an honest per-item result —
// a manager that is missing, or a package that failed, is reported as exactly
// that, never smoothed over.

const fs = require('fs');
const path = require('path');
const { spawn, execFile } = require('child_process');

// ---------------------------------------------------------------------------
// The catalog — the shelf
// ---------------------------------------------------------------------------
// Each language: the package MANAGER it installs from, and a curated list of
// { name, use }. Kept to the libraries that genuinely earn their place — the
// ones a professional reaches for — not an exhaustive dump.
const CATALOG = {
  python: {
    label: 'Python', manager: 'pip', ecosystem: 'PyPI',
    libs: [
      { name: 'requests', use: 'درخواست‌های HTTP، ساده و همه‌جا' },
      { name: 'httpx', use: 'HTTP مدرن با async' },
      { name: 'numpy', use: 'محاسبات عددی و آرایه' },
      { name: 'pandas', use: 'تحلیل داده و جدول' },
      { name: 'matplotlib', use: 'نمودار و رسم' },
      { name: 'pillow', use: 'کار با تصویر' },
      { name: 'fastapi', use: 'API وب سریع و مدرن' },
      { name: 'uvicorn', use: 'سرور اجرای FastAPI' },
      { name: 'flask', use: 'وب کوچک و کلاسیک' },
      { name: 'sqlalchemy', use: 'ORM و پایگاه‌داده' },
      { name: 'pydantic', use: 'اعتبارسنجی داده' },
      { name: 'rich', use: 'خروجی زیبای ترمینال' },
      { name: 'beautifulsoup4', use: 'خواندن HTML' },
      { name: 'openpyxl', use: 'خواندن/نوشتن اکسل' },
      { name: 'python-dotenv', use: 'خواندن فایل .env' },
      { name: 'pytest', use: 'تست' },
      { name: 'ruff', use: 'لینتر و فرمت‌کننده‌ی بسیار سریع' },
      { name: 'black', use: 'فرمت‌کننده‌ی کد' },
    ],
  },
  javascript: {
    label: 'JavaScript / Node', manager: 'npm', ecosystem: 'npm',
    libs: [
      { name: 'express', use: 'سرور وب' },
      { name: 'axios', use: 'درخواست HTTP' },
      { name: 'zod', use: 'اعتبارسنجی و تایپ' },
      { name: 'dayjs', use: 'کار با تاریخ، سبک' },
      { name: 'lodash', use: 'ابزارهای کار با داده' },
      { name: 'dotenv', use: 'خواندن .env' },
      { name: 'chalk', use: 'رنگ در ترمینال' },
      { name: 'commander', use: 'ساخت ابزار خط فرمان' },
      { name: 'ws', use: 'وب‌سوکت' },
      { name: 'node-fetch', use: 'fetch در نود قدیمی' },
      { name: 'vitest', use: 'تست سریع' },
      { name: 'eslint', use: 'لینتر' },
      { name: 'prettier', use: 'فرمت‌کننده' },
      { name: 'typescript', use: 'تایپ‌اسکریپت' },
      { name: 'nodemon', use: 'ری‌استارت خودکار هنگام توسعه' },
    ],
  },
  frontend: {
    label: 'Front-end / Design', manager: 'npm', ecosystem: 'npm',
    libs: [
      { name: 'react', use: 'کتابخانه‌ی UI' },
      { name: 'react-dom', use: 'رندر React در مرورگر' },
      { name: 'vue', use: 'فریم‌ورک UI' },
      { name: 'svelte', use: 'UI کامپایل‌شونده، سبک' },
      { name: 'vite', use: 'بیلد و دیو-سرور بسیار سریع' },
      { name: 'tailwindcss', use: 'CSS یوتیلیتی برای طراحی' },
      { name: 'sass', use: 'CSS پیشرفته' },
      { name: 'framer-motion', use: 'انیمیشن' },
      { name: 'three', use: 'گرافیک سه‌بعدی' },
      { name: 'd3', use: 'مصورسازی داده' },
      { name: 'gsap', use: 'انیمیشن حرفه‌ای' },
      { name: 'chart.js', use: 'نمودار' },
    ],
  },
  typescript: {
    label: 'TypeScript', manager: 'npm', ecosystem: 'npm',
    libs: [
      { name: 'typescript', use: 'کامپایلر TS' },
      { name: 'ts-node', use: 'اجرای مستقیم TS' },
      { name: 'tsx', use: 'اجرای سریع TS/ESM' },
      { name: '@types/node', use: 'تایپ‌های نود' },
      { name: 'type-fest', use: 'تایپ‌های کمکی' },
    ],
  },
  rust: {
    label: 'Rust', manager: 'cargo', ecosystem: 'crates.io',
    libs: [
      { name: 'serde', use: 'سریال‌سازی' },
      { name: 'serde_json', use: 'JSON' },
      { name: 'tokio', use: 'اجرای async' },
      { name: 'reqwest', use: 'HTTP' },
      { name: 'clap', use: 'ابزار خط فرمان' },
      { name: 'anyhow', use: 'مدیریت خطا' },
      { name: 'thiserror', use: 'تعریف خطا' },
      { name: 'rayon', use: 'موازی‌سازی' },
      { name: 'axum', use: 'سرور وب' },
      { name: 'sqlx', use: 'پایگاه‌داده async' },
    ],
  },
  go: {
    label: 'Go', manager: 'go', ecosystem: 'Go modules',
    libs: [
      { name: 'github.com/gin-gonic/gin', use: 'سرور وب سریع' },
      { name: 'github.com/labstack/echo/v4', use: 'فریم‌ورک وب' },
      { name: 'github.com/spf13/cobra', use: 'ابزار خط فرمان' },
      { name: 'github.com/stretchr/testify', use: 'تست' },
      { name: 'gorm.io/gorm', use: 'ORM' },
      { name: 'github.com/gorilla/websocket', use: 'وب‌سوکت' },
    ],
  },
  java: {
    label: 'Java / Kotlin', manager: 'maven', ecosystem: 'Maven Central',
    libs: [
      { name: 'org.springframework.boot:spring-boot-starter-web:3.3.2', use: 'وب Spring Boot' },
      { name: 'com.google.guava:guava:33.2.1-jre', use: 'ابزارهای گوگل' },
      { name: 'com.fasterxml.jackson.core:jackson-databind:2.17.2', use: 'JSON' },
      { name: 'org.junit.jupiter:junit-jupiter:5.10.3', use: 'تست' },
      { name: 'org.projectlombok:lombok:1.18.34', use: 'کاهش کد تکراری' },
      { name: 'com.squareup.okhttp3:okhttp:4.12.0', use: 'HTTP' },
    ],
  },
  csharp: {
    label: 'C# / .NET', manager: 'nuget', ecosystem: 'NuGet',
    libs: [
      { name: 'Newtonsoft.Json', use: 'JSON' },
      { name: 'Serilog', use: 'لاگ' },
      { name: 'Dapper', use: 'دسترسی سریع به دیتابیس' },
      { name: 'AutoMapper', use: 'نگاشت مدل‌ها' },
      { name: 'xunit', use: 'تست' },
      { name: 'Polly', use: 'تلاش مجدد و تاب‌آوری' },
    ],
  },
  php: {
    label: 'PHP', manager: 'composer', ecosystem: 'Packagist',
    libs: [
      { name: 'guzzlehttp/guzzle', use: 'HTTP' },
      { name: 'monolog/monolog', use: 'لاگ' },
      { name: 'symfony/console', use: 'ابزار خط فرمان' },
      { name: 'phpunit/phpunit', use: 'تست' },
      { name: 'vlucas/phpdotenv', use: 'خواندن .env' },
    ],
  },
  ruby: {
    label: 'Ruby', manager: 'gem', ecosystem: 'RubyGems',
    libs: [
      { name: 'rails', use: 'فریم‌ورک وب' },
      { name: 'sinatra', use: 'وب کوچک' },
      { name: 'rspec', use: 'تست' },
      { name: 'faraday', use: 'HTTP' },
      { name: 'rubocop', use: 'لینتر' },
    ],
  },
  cpp: {
    label: 'C / C++', manager: 'vcpkg', ecosystem: 'vcpkg',
    libs: [
      { name: 'fmt', use: 'قالب‌بندی متن' },
      { name: 'nlohmann-json', use: 'JSON' },
      { name: 'spdlog', use: 'لاگ سریع' },
      { name: 'catch2', use: 'تست' },
      { name: 'cli11', use: 'خط فرمان' },
    ],
  },
  swift: {
    label: 'Swift', manager: 'spm', ecosystem: 'Swift Package Manager',
    libs: [
      { name: 'https://github.com/Alamofire/Alamofire', use: 'HTTP' },
      { name: 'https://github.com/apple/swift-nio', use: 'شبکه‌ی async' },
      { name: 'https://github.com/vapor/vapor', use: 'سرور وب' },
    ],
  },
  dart: {
    label: 'Dart / Flutter', manager: 'pub', ecosystem: 'pub.dev',
    libs: [
      { name: 'http', use: 'HTTP' },
      { name: 'provider', use: 'مدیریت state' },
      { name: 'dio', use: 'HTTP پیشرفته' },
      { name: 'go_router', use: 'مسیریابی' },
    ],
  },
};

// ---------------------------------------------------------------------------
// What is installed on this machine
// ---------------------------------------------------------------------------
// One version probe per tool. A tool that is missing is a normal answer.
const TOOLS = {
  node: ['node', ['--version']],
  npm: ['npm', ['--version']],
  python: [process.platform === 'win32' ? 'python' : 'python3', ['--version']],
  pip: [process.platform === 'win32' ? 'python' : 'python3', ['-m', 'pip', '--version']],
  cargo: ['cargo', ['--version']],
  go: ['go', ['version']],
  java: ['java', ['-version']],
  maven: ['mvn', ['--version']],
  gradle: ['gradle', ['--version']],
  dotnet: ['dotnet', ['--version']],
  php: ['php', ['--version']],
  composer: ['composer', ['--version']],
  ruby: ['ruby', ['--version']],
  gem: ['gem', ['--version']],
  swift: ['swift', ['--version']],
  dart: ['dart', ['--version']],
  git: ['git', ['--version']],
};

// On Windows the package managers are `.cmd`/`.bat` shims (npm, cargo, mvn,
// gradle, composer, gem ...). Modern Node refuses to spawn a .cmd/.bat without
// a shell (EINVAL), so probes and downloads silently failed and every shelf
// showed «مدیرش نصب نیست». Running through the shell on Windows fixes both.
const WIN = process.platform === 'win32';

// shell:true means the command line is parsed by cmd.exe, so a crafted package
// name could inject commands. Package/module names never need anything beyond
// this charset, so we refuse the rest outright (defense-in-depth).
const SAFE_PKG = /^[A-Za-z0-9._@/+\-]+$/;
function sanitizePkgs(list) {
  return (list || []).filter((p) => typeof p === 'string' && SAFE_PKG.test(p));
}

function probe(cmd, args) {
  return new Promise((resolve) => {
    let done = false;
    const finish = (v) => { if (!done) { done = true; resolve(v); } };
    try {
      const child = execFile(cmd, args, { timeout: 6000, windowsHide: true, maxBuffer: 1 << 20, shell: WIN },
        (err, stdout, stderr) => {
          if (err && err.code === 'ENOENT') return finish(null);
          // Some tools (java) print the version to stderr; that is still found.
          const out = String(stdout || stderr || '').split('\n')[0].trim();
          finish(err && !out ? null : (out || 'installed'));
        });
      child.on('error', () => finish(null));
    } catch (e) { finish(null); }
  });
}

async function toolchains() {
  const names = Object.keys(TOOLS);
  const versions = await Promise.all(names.map((n) => probe(TOOLS[n][0], TOOLS[n][1])));
  const out = {};
  names.forEach((n, i) => { out[n] = versions[i]; });
  // Which language shelves are actually installable right now.
  const managerReady = {
    pip: !!out.pip, npm: !!out.npm, cargo: !!out.cargo, go: !!out.go,
    maven: !!out.maven, gradle: !!out.gradle, nuget: !!out.dotnet,
    composer: !!out.composer, gem: !!out.gem, spm: !!out.swift, pub: !!out.dart,
    vcpkg: false, // vcpkg is a checkout, not a version-probe tool
  };
  return { tools: out, managerReady };
}

// ---------------------------------------------------------------------------
// Download — fetch archives, never install, never run a script
// ---------------------------------------------------------------------------
// Each manager gets the ONE command that downloads without executing anything.
// Where a manager has no clean download-only command, we say so and hand over
// the exact line to run by hand rather than pretend.
function pipCmd() { return process.platform === 'win32' ? 'python' : 'python3'; }

function plan(lang, dir, names) {
  const entry = CATALOG[lang];
  if (!entry) return { error: 'زبان ناشناخته: ' + lang };
  // Custom names are sanitized (shell:true on Windows); the built-in catalog
  // names are already safe. An all-bad custom list falls back to the catalog.
  let pkgs = names && names.length ? sanitizePkgs(names) : entry.libs.map((l) => l.name);
  if (names && names.length && !pkgs.length) return { error: 'نام بسته‌ی نامعتبر' };
  const m = entry.manager;
  switch (m) {
    case 'pip':
      return { manager: m, mode: 'batch',
        cmd: pipCmd(), args: ['-m', 'pip', 'download', '--dest', dir, ...pkgs] };
    case 'npm':
      // `npm pack` downloads the tarball into cwd and runs NO scripts.
      return { manager: m, mode: 'batch', cwd: dir, cmd: 'npm', args: ['pack', ...pkgs] };
    case 'gem':
      return { manager: m, mode: 'batch', cwd: dir, cmd: 'gem', args: ['fetch', ...pkgs] };
    case 'maven':
      // dependency:get fetches one artifact at a time into the local repo.
      return { manager: m, mode: 'each',
        each: (p) => ({ cmd: 'mvn', args: ['-q', 'dependency:get', '-Dartifact=' + p] }) };
    case 'go':
      // Scaffold a throwaway module, then `go mod download` fills the cache.
      return { manager: m, mode: 'go', dir, pkgs };
    case 'cargo':
      // Scaffold a Cargo.toml, then `cargo fetch` fills the registry cache.
      return { manager: m, mode: 'cargo', dir, pkgs };
    default:
      return { manager: m, mode: 'manual', pkgs,
        note: 'برای این مدیر بسته دستورِ «فقط دانلود» تمیز وجود ندارد؛ دستورش را می‌دهم تا دستی اجرا کنی.' };
  }
}

function runOnce(cmd, args, opts, onData) {
  return new Promise((resolve) => {
    let out = '';
    let child;
    const cap = (d) => { out = (out + d.toString('utf8')).slice(-8000); if (onData) onData(d.toString('utf8')); };
    try { child = spawn(cmd, args, { cwd: (opts && opts.cwd) || undefined, windowsHide: true, shell: WIN }); }
    catch (e) { return resolve({ ok: false, code: -1, out: 'اجرا نشد: ' + e.message }); }
    child.stdout.on('data', cap); child.stderr.on('data', cap);
    const timer = setTimeout(() => { try { child.kill('SIGKILL'); } catch (e) {} }, (opts && opts.timeout) || 300000);
    child.on('close', (code) => { clearTimeout(timer); resolve({ ok: code === 0, code, out }); });
    child.on('error', (e) => { clearTimeout(timer); resolve({ ok: false, code: -1, out: 'خطا: ' + e.message }); });
  });
}

// Run a download plan, streaming progress to onLog. Returns the outcome.
async function download(lang, dir, names, onLog) {
  const p = plan(lang, dir, names);
  if (p.error) return p;
  fs.mkdirSync(dir, { recursive: true });
  const log = (t) => { if (onLog) onLog(t); };

  if (p.mode === 'manual') {
    const entry = CATALOG[lang];
    const line = manualLine(entry.manager, p.pkgs, dir);
    log(p.note + '\n' + line + '\n');
    return { ok: false, manual: true, note: p.note, command: line };
  }
  if (p.mode === 'go') {
    fs.writeFileSync(path.join(dir, 'go.mod'), 'module setayesh/shelf\n\ngo 1.21\n');
    let allOk = true;
    for (const pkg of p.pkgs) {
      log('go mod download ' + pkg + '\n');
      const r = await runOnce('go', ['mod', 'download', pkg], { cwd: dir }, log);
      if (!r.ok) allOk = false;
    }
    return { ok: allOk, manager: 'go' };
  }
  if (p.mode === 'cargo') {
    const deps = p.pkgs.map((n) => `${n} = "*"`).join('\n');
    fs.writeFileSync(path.join(dir, 'Cargo.toml'),
      `[package]\nname = "shelf"\nversion = "0.0.0"\nedition = "2021"\n\n[dependencies]\n${deps}\n`);
    fs.mkdirSync(path.join(dir, 'src'), { recursive: true });
    fs.writeFileSync(path.join(dir, 'src', 'main.rs'), 'fn main() {}\n');
    log('cargo fetch\n');
    const r = await runOnce('cargo', ['fetch'], { cwd: dir }, log);
    return { ok: r.ok, manager: 'cargo' };
  }
  if (p.mode === 'each') {
    const entry = CATALOG[lang];
    const pkgs = (names && names.length ? sanitizePkgs(names) : entry.libs.map((l) => l.name));
    let allOk = true;
    for (const pkg of pkgs) {
      const c = p.each(pkg);
      log('$ ' + c.cmd + ' ' + c.args.join(' ') + '\n');
      const r = await runOnce(c.cmd, c.args, { cwd: dir }, log);
      if (!r.ok) allOk = false;
    }
    return { ok: allOk, manager: p.manager };
  }
  // batch
  log('$ ' + p.cmd + ' ' + p.args.join(' ') + '\n');
  const r = await runOnce(p.cmd, p.args, { cwd: p.cwd || dir }, log);
  return { ok: r.ok, code: r.code, manager: p.manager };
}

function manualLine(manager, pkgs, dir) {
  if (manager === 'nuget') return pkgs.map((p) => `dotnet add package ${p}`).join(' ; ');
  if (manager === 'composer') return 'composer require ' + pkgs.join(' ');
  if (manager === 'vcpkg') return 'vcpkg install ' + pkgs.join(' ');
  if (manager === 'spm') return 'به Package.swift اضافه کن: ' + pkgs.join(' , ');
  if (manager === 'pub') return 'dart pub add ' + pkgs.join(' ');
  return pkgs.join(' ');
}

// What is on the shelf already (files downloaded per language).
function installed(baseDir) {
  const out = {};
  for (const lang of Object.keys(CATALOG)) {
    const d = path.join(baseDir, lang);
    let count = 0;
    try {
      const walk = (p) => {
        for (const e of fs.readdirSync(p, { withFileTypes: true })) {
          if (e.isDirectory()) { if (!/node_modules|target|\.git/.test(e.name)) walk(path.join(p, e.name)); }
          else count++;
        }
      };
      if (fs.existsSync(d)) walk(d);
    } catch (e) {}
    out[lang] = count;
  }
  return out;
}

// ---------------------------------------------------------------------------
// The generated shelf note — so the catalog lives in the brain too
// ---------------------------------------------------------------------------
function catalogMarkdown() {
  const lines = [
    '# قفسه‌ی کتابخانه‌های برنامه‌نویسی',
    '',
    '> این فایل **خودکار** از جدول `CATALOG` در `devlibs.js` ساخته می‌شود.',
    '> بهترین و پرکاربردترین کتابخانه‌ها برای هر زبان — چه دانلود شده باشند چه نه.',
    '',
  ];
  for (const [lang, e] of Object.entries(CATALOG)) {
    lines.push(`## ${e.label}  ·  ${e.ecosystem} (${e.manager})`, '');
    lines.push('| کتابخانه | برای چه کاری |', '| --- | --- |');
    for (const l of e.libs) lines.push(`| \`${l.name}\` | ${l.use} |`);
    lines.push('');
  }
  lines.push('## استفاده', '',
    '- در چت بگو «کتابخانه‌های پایتون را دانلود کن» یا از تبِ «کتابخانه‌ها» انتخاب کن.',
    '- فقط از مدیرهای بسته‌ای که روی این کامپیوتر نصب‌اند دانلود می‌شود؛ بقیه دستورشان داده می‌شود.',
    '- دانلود فقط آرشیو را می‌گیرد و هیچ اسکریپت نصبی اجرا نمی‌کند (امنیت زنجیره‌ی تأمین).',
    '');
  return lines.join('\n');
}

function writeCatalogDocs(rootDir) {
  const md = catalogMarkdown();
  const targets = [
    path.join(rootDir, 'DEV-LIBRARIES.md'),
    path.join(rootDir, 'pybrain', 'vault', 'knowledge', 'dev-libraries.md'),
  ];
  for (const t of targets) {
    try {
      fs.mkdirSync(path.dirname(t), { recursive: true });
      let prev = '';
      try { prev = fs.readFileSync(t, 'utf8'); } catch (e) {}
      if (prev !== md) fs.writeFileSync(t, md);
    } catch (e) { /* read-only install */ }
  }
  return { languages: Object.keys(CATALOG).length,
    total: Object.values(CATALOG).reduce((n, e) => n + e.libs.length, 0) };
}

// ---------------------------------------------------------------------------
// HTTP + a small run registry so the UI can watch a download
// ---------------------------------------------------------------------------
function register(app, deps) {
  const { requireAuth, requireAdmin, DATA_DIR, nightLog } = deps;
  const SHELF_DIR = process.env.SETAYESH_DEVLIBS_DIR || path.join(DATA_DIR, 'devlibs');
  const runs = {};   // lang -> { running, log, ok, finishedAt }

  app.get('/api/admin/devlibs', requireAuth, requireAdmin, async (req, res) => {
    const chains = await toolchains();
    res.json({
      catalog: Object.entries(CATALOG).map(([id, e]) => ({
        id, label: e.label, manager: e.manager, ecosystem: e.ecosystem,
        count: e.libs.length, libs: e.libs,
        ready: chains.managerReady[e.manager] === true,
      })),
      tools: chains.tools,
      installed: installed(SHELF_DIR),
      running: Object.keys(runs).filter((k) => runs[k] && runs[k].running),
    });
  });

  app.post('/api/admin/devlibs/download', requireAuth, requireAdmin, (req, res) => {
    const lang = String((req.body || {}).lang || '');
    const names = Array.isArray((req.body || {}).names) ? (req.body).names.map(String) : null;
    if (!CATALOG[lang]) return res.status(400).json({ error: 'زبان ناشناخته.' });
    if (runs[lang] && runs[lang].running) return res.json({ ok: true, running: true });
    runs[lang] = { running: true, log: '', ok: null, finishedAt: 0 };
    const dir = path.join(SHELF_DIR, lang);
    download(lang, dir, names, (t) => { runs[lang].log = (runs[lang].log + t).slice(-6000); })
      .then((r) => {
        runs[lang].running = false; runs[lang].ok = !!r.ok; runs[lang].finishedAt = Date.now();
        runs[lang].result = r;
        nightLog(`دانلود کتابخانه‌های ${CATALOG[lang].label} ${r.ok ? 'تمام شد' : 'با مشکل تمام شد'}.`,
          r.ok ? 'ok' : 'info', `dev library download for ${lang} ${r.ok ? 'done' : 'finished with issues'}`);
      })
      .catch((e) => { runs[lang].running = false; runs[lang].ok = false; runs[lang].log += '\nخطا: ' + e.message; });
    res.json({ ok: true, started: true, lang });
  });

  app.get('/api/admin/devlibs/log', requireAuth, requireAdmin, (req, res) => {
    const lang = String(req.query.lang || '');
    res.json(runs[lang] || { running: false, log: '', ok: null });
  });

  return { SHELF_DIR };
}

module.exports = {
  CATALOG, TOOLS, toolchains, download, plan, installed,
  catalogMarkdown, writeCatalogDocs, register, probe,
};
