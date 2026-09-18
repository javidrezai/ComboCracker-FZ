'use strict';
// The language runners for multi-file projects, split out of index.js. RUNNERS
// is the catalogue (which extensions map to which interpreter, and how to
// install it if missing); probeRunners() checks, at startup, which ones this
// machine actually has — so the answer is real rather than assumed. Pure data
// + a thin spawnSync probe; no app state.
const { spawnSync } = require('child_process');

const RUNNERS = {
  python: { label: 'Python', exts: ['.py'], probe: ['--version'],
            cmd: process.platform === 'win32' ? 'python' : 'python3',
            install: process.platform === 'win32' ? 'از python.org نصب کن و «Add to PATH» را بزن' : 'sudo apt install python3' },
  node:   { label: 'Node.js', exts: ['.js', '.mjs'], probe: ['--version'], cmd: 'node',
            install: 'از nodejs.org نصب کن' },
  bash:   { label: 'Shell', exts: ['.sh'], probe: ['--version'], cmd: 'bash',
            install: 'روی ویندوز از طریق WSL یا Git Bash' },
};

// key → version string (available) or null (not installed). Fills the given map
// in place so the caller keeps a stable reference.
function probeRunners(into) {
  const out = into || {};
  for (const [key, r] of Object.entries(RUNNERS)) {
    try {
      const res = spawnSync(r.cmd, r.probe, { timeout: 4000, windowsHide: true });
      out[key] = (res.status === 0)
        ? String(res.stdout || res.stderr || '').trim().split('\n')[0].slice(0, 40)
        : null;
    } catch (e) { out[key] = null; }
  }
  return out;
}

// Which runner handles a given file extension (e.g. '.py' → 'python'), or null.
function runnerForExt(ext) {
  const e = String(ext || '').toLowerCase();
  return Object.keys(RUNNERS).find((k) => RUNNERS[k].exts.includes(e)) || null;
}

module.exports = { RUNNERS, probeRunners, runnerForExt };
