'use strict';
// Safe, conservative housekeeping — the "delete the junk, keep what matters"
// helper جاوید asked for. It is DELIBERATELY narrow: it only ever names
// throwaway files for deletion, and NEVER source code, config, user data,
// memory, chats, knowledge, the Python brain, or node_modules. Everything here
// is pure (no fs, no I/O) so it can be unit-tested; index.js does the walking
// and the actual removal against this plan.
//
// Why an allow-list of junk rather than a block-list of "important": a
// block-list is one forgotten pattern away from deleting something real. An
// allow-list can only ever remove what we explicitly recognise as garbage, so
// the worst case is that it misses some junk — never that it eats real data.

// Files that are ALWAYS safe to delete, matched by their exact base name.
const JUNK_EXACT = new Set([
  '.DS_Store',        // macOS folder metadata
  'Thumbs.db',        // Windows thumbnail cache
  'ehthumbs.db',
  'desktop.ini',      // Windows folder settings
  'npm-debug.log',
  'error.log.old',    // the rotated error log (the live one is capped separately)
]);

// Directory base names that are throwaway caches and can be removed whole.
const JUNK_DIRS = new Set(['__pycache__', '.pytest_cache']);

// True when a file (by base name) is throwaway junk.
function isJunkFile(name) {
  const n = String(name || '');
  if (!n) return false;
  if (JUNK_EXACT.has(n)) return true;
  if (/\.failed$/i.test(n)) return true;          // failed self-update restore copies
  if (/\.pyc$/i.test(n)) return true;             // compiled python
  if (/^error\.log\.\d+$/i.test(n)) return true;  // numbered rotated logs
  if (/^npm-debug\.log\.\d+$/i.test(n)) return true;
  if (/~$/.test(n)) return true;                  // editor backup files (foo.js~)
  if (/^\._/.test(n)) return true;                // macOS AppleDouble sidecars
  return false;
}

// True when a directory (by base name) is a throwaway cache.
function isJunkDir(name) {
  return JUNK_DIRS.has(String(name || ''));
}

// From a flat list of {name, mtime} keep the newest `keep`, and return the
// names of the rest (oldest) to delete. Used for a folder where only recent
// items matter (e.g. an ad-hoc dump dir). Ties and missing mtimes sort last.
function keepNewest(entries, keep) {
  const list = Array.isArray(entries) ? entries.filter((e) => e && e.name != null) : [];
  const sorted = [...list].sort((a, b) => (Number(b.mtime) || 0) - (Number(a.mtime) || 0));
  return sorted.slice(Math.max(0, keep | 0)).map((e) => e.name);
}

// Build a deletion plan from a flat list of directory entries.
//   entries: [{ name, isDir, size, mtime }]  (name is the base name)
// Returns { remove:[{name,isDir,size}], freed:<bytes> } naming ONLY junk.
function cleanupPlan(entries) {
  const list = Array.isArray(entries) ? entries : [];
  const remove = [];
  let freed = 0;
  for (const e of list) {
    if (!e || e.name == null) continue;
    const junk = e.isDir ? isJunkDir(e.name) : isJunkFile(e.name);
    if (!junk) continue;
    remove.push({ name: e.name, isDir: !!e.isDir, size: Number(e.size) || 0 });
    freed += Number(e.size) || 0;
  }
  return { remove, freed };
}

// A human byte size, for the "freed 12.3 MB" message.
function humanBytes(n) {
  n = Number(n) || 0;
  if (n < 1024) return n + ' B';
  const u = ['KB', 'MB', 'GB', 'TB'];
  let i = -1;
  do { n /= 1024; i++; } while (n >= 1024 && i < u.length - 1);
  return n.toFixed(1) + ' ' + u[i];
}

module.exports = { isJunkFile, isJunkDir, keepNewest, cleanupPlan, humanBytes, JUNK_EXACT, JUNK_DIRS };
