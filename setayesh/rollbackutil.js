'use strict';

// Pure decision for pruning the self-update "rollback" folder.
//
// A rollback entry is only ever a SINGLE FILE — the copy of one source file
// taken just before a self-edit or an update overwrites it. The newest `keep`
// of those files are retained (they are what an undo would reach for); older
// files are dropped.
//
// A DIRECTORY must never live in the rollback folder. One used to slip in — a
// stray "Setayesh-Portable" whole-tree copy that carries node_modules — and the
// old prune (fs.unlinkSync) threw on it and silently left it forever, so the
// folder ballooned to tens of GB. So: every directory is always removed.
//
// entries: [{ name, mtime, dir }]  →  returns the names to remove.
function prunePlan(entries, keep) {
  const k = Math.max(0, keep | 0);
  const sorted = entries.slice().sort((a, b) => b.mtime - a.mtime);
  const remove = [];
  let keptFiles = 0;
  for (const e of sorted) {
    if (e.dir) { remove.push(e.name); continue; }   // directories: always out
    keptFiles += 1;
    if (keptFiles > k) remove.push(e.name);          // beyond the newest `keep`
  }
  return remove;
}

module.exports = { prunePlan };
