'use strict';
const fs = require('fs');
const os = require('os');
const path = require('path');
const crypto = require('crypto');
const { spawn } = require('child_process');

// Self-update guards, split out of index.js. Only Node built-ins, no shared
// server state — decides which files an update package may write, and checks
// that a JS file parses before it is ever installed.

// May an update package write this repo-relative path? Blocks traversal,
// absolute paths, node_modules/.git, runtime state, the owner's face, etc.
function isUpdatablePath(rel) {
  if (!rel) return false;
  const parts = rel.split('/');
  if (parts.some((p) => p === '..' || p === '')) return false;
  if (/^([a-zA-Z]:|\/|\\)/.test(rel)) return false;
  if (parts[0] === 'node_modules' || parts.includes('node_modules')) return false;
  if (parts[0] === '.git' || parts.includes('.git')) return false;
  const base = parts[parts.length - 1];
  if (base.startsWith('.setayesh')) return false;
  if (rel.startsWith('pybrain/libs/') && base !== '.gitkeep' && base.toUpperCase() !== 'README.MD') return false;
  if (rel.startsWith('pybrain/vault/logs/') && base.toUpperCase() !== 'README.MD') return false;
  if (rel.startsWith('public/faces/')) return false;   // the owner's chosen face is theirs, not ours
  if (rel === 'pybrain/vault/knowledge/app-memory.md') return false;
  return true;
}

// Resolve to null when `code` parses, or a "label: message" string when it does
// not — so a broken JS file in an update is caught before it is written.
function checkJsSyntax(code, label) {
  return new Promise((resolve) => {
    const tmp = path.join(os.tmpdir(), 'sy-' + crypto.randomBytes(4).toString('hex') + '.js');
    try { fs.writeFileSync(tmp, code); } catch (e) { return resolve('نوشتن فایل موقت ناموفق'); }
    const c = spawn(process.execPath, ['--check', tmp], { shell: false, windowsHide: true });
    let err = '';
    c.stderr.on('data', (d) => { err += d.toString(); });
    c.on('close', (code2) => {
      try { fs.unlinkSync(tmp); } catch (e) {}
      resolve(code2 === 0 ? null : `${label}: ${err.split('\n')[0] || 'خطای نحوی'}`);
    });
  });
}

module.exports = { isUpdatablePath, checkJsSyntax };
