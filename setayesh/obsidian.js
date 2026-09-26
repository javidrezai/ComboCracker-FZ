'use strict';
// Obsidian vault reader, split out of index.js. An Obsidian vault is just a
// folder of markdown with a ".obsidian" directory inside — no API, no account.
// This finds likely vaults, resolves the chosen one from config, and lists its
// notes. READ-ONLY: nothing in the vault is ever written or deleted from here.
// A factory so it reads the live config through getCfg() and keeps no state.
const fs = require('fs');
const os = require('os');
const path = require('path');

function makeObsidian(deps) {
  const getCfg = (deps && deps.getCfg) || (() => ({}));

  // Look in the usual places for folders that contain a .obsidian directory.
  function obsidianCandidates() {
    const home = os.homedir();
    const roots = [home, path.join(home, 'Documents'), path.join(home, 'OneDrive'),
                   path.join(home, 'OneDrive', 'Documents'), path.join(home, 'Desktop')];
    const found = [];
    const seen = new Set();
    for (const root of roots) {
      let entries = [];
      try { entries = fs.readdirSync(root, { withFileTypes: true }); } catch (e) { continue; }
      try { if (fs.existsSync(path.join(root, '.obsidian')) && !seen.has(root)) { seen.add(root); found.push(root); } } catch (e) {}
      for (const d of entries) {
        if (!d.isDirectory() || d.name.startsWith('.')) continue;
        const p = path.join(root, d.name);
        try { if (fs.existsSync(path.join(p, '.obsidian')) && !seen.has(p)) { seen.add(p); found.push(p); } } catch (e) {}
        if (found.length >= 12) return found;
      }
    }
    return found;
  }

  function obsidianVault() { return String((getCfg() || {}).OBSIDIAN_VAULT || '').trim(); }

  // Every .md file under the chosen vault, up to a depth/count cap.
  function obsidianNotes(limit) {
    const root = obsidianVault();
    if (!root) return [];
    const out = [];
    (function walk(dir, depth) {
      if (depth > 4 || out.length >= (limit || 500)) return;
      let entries = [];
      try { entries = fs.readdirSync(dir, { withFileTypes: true }); } catch (e) { return; }
      for (const d of entries) {
        if (out.length >= (limit || 500)) return;
        if (d.name.startsWith('.')) continue;
        const p = path.join(dir, d.name);
        if (d.isDirectory()) walk(p, depth + 1);
        else if (/\.md$/i.test(d.name)) out.push(p);
      }
    })(root, 0);
    return out;
  }

  return { obsidianCandidates, obsidianVault, obsidianNotes };
}

module.exports = { makeObsidian };
