'use strict';
// Ollama helper for the Node local engine, split out of index.js. Mirrors what
// the Python brain already does: if the `ollama` binary is installed but the
// service isn't running, start it once so the local engine comes up on its own —
// the owner never has to run `ollama serve` by hand. Everything network here is
// pure over an injected fetch; process spawning is guarded to happen at most
// once per run. No app state, no config writes.
const { spawnSync, spawn } = require('child_process');

let _startedOnce = false;   // never spawn `ollama serve` more than once per process

// Is the ollama binary on PATH? (cheap, cached would be premature — it's rare.)
function installed() {
  try {
    const r = spawnSync('ollama', ['--version'], { timeout: 4000, windowsHide: true });
    return !!(r && !r.error && (r.status === 0 || r.stdout || r.stderr));
  } catch (e) { return false; }
}

// Ask the running service what models it has. Returns { running, models }.
async function probe(base, fetchWithTimeout) {
  try {
    const r = await fetchWithTimeout(base.replace(/\/v1\/?$/, '') + '/api/tags', { timeoutMs: 4000 });
    const d = await r.json();
    return { running: true, models: (d.models || []).map((m) => m.name).filter(Boolean) };
  } catch (e) { return { running: false, models: [] }; }
}

// Ensure the service is up: probe; if down but the binary exists, start
// `ollama serve` detached (once) and re-probe for a few seconds. Returns
// { installed, running, started, models }.
async function ensureUp(base, fetchWithTimeout) {
  let p = await probe(base, fetchWithTimeout);
  if (p.running) return { installed: true, running: true, started: false, models: p.models };
  const have = installed();
  if (!have) return { installed: false, running: false, started: false, models: [] };
  let started = false;
  if (!_startedOnce) {
    _startedOnce = true;
    try {
      const child = spawn('ollama', ['serve'], { detached: true, stdio: 'ignore', windowsHide: true });
      child.unref();
      started = true;
    } catch (e) { /* couldn't start — report as installed-but-down */ }
  }
  // give the service a moment to accept connections, re-probing a few times
  for (let i = 0; i < 6 && !p.running; i++) {
    await new Promise((r) => setTimeout(r, 1000));
    p = await probe(base, fetchWithTimeout);
  }
  return { installed: true, running: p.running, started, models: p.models };
}

// A short, honest Persian hint for the current state, with the install link.
function statusHint(state, platform) {
  if (state.running && state.models.length) return '🟢 اولاما متصل است.';
  if (state.running) return '🟡 اولاما بالا است ولی هیچ مدلی نصب نیست — یک مدل بکش، مثلاً: ollama pull qwen2.5';
  if (state.installed) return '🟡 اولاما نصب است ولی هنوز بالا نیامده — چند لحظه صبر کن یا یک‌بار «ollama serve» را اجرا کن.';
  const os = platform || process.platform;
  const how = os === 'win32' ? 'نصب برای ویندوز'
    : os === 'darwin' ? 'نصب برای مک'
    : 'نصب برای لینوکس (یک خط): curl -fsSL https://ollama.com/install.sh | sh';
  return '🔴 اولاما نصب نیست — ' + how + ' از https://ollama.com/download';
}

module.exports = { installed, probe, ensureUp, statusHint };
