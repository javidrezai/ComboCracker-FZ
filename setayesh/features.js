'use strict';
// ---------------------------------------------------------------------------
// features.js — the Customization Center's permission math (pure + testable).
// ---------------------------------------------------------------------------
// Which UI features are DISABLED for a given member. Two layers, exactly as the
// owner asked ("both"): an access-LEVEL default, plus a per-USER override that
// can turn something off even if the level allows it, or turn it back on even if
// the level disabled it.
//
//   effectiveDisabled(accessLevel, levelMap, userOverride) -> [featureId, ...]
//
// accessLevel: 0 = admin (NEVER restricted — the owner has everything),
//              1 = adult, 2 = child (from accessLevelOf in index.js).
// levelMap:    { "1": ["id", ...], "2": ["id", ...] }  — disabled per level.
// userOverride:{ off: ["id", ...], on: ["id", ...] }   — this member's exceptions.
function effectiveDisabled(accessLevel, levelMap, userOverride) {
  if (Number(accessLevel) === 0) return [];             // admin: no restrictions ever
  const set = new Set((levelMap && levelMap[String(accessLevel)]) || []);
  const ov = userOverride || {};
  (Array.isArray(ov.off) ? ov.off : []).forEach((id) => set.add(String(id)));
  (Array.isArray(ov.on) ? ov.on : []).forEach((id) => set.delete(String(id)));
  return [...set];
}

// Sanitize a stored/incoming config against the known feature ids, so a stray or
// stale id can never be written or enforced.
function cleanConfig(cfg, validIds) {
  const valid = new Set(validIds || []);
  const keep = (arr) => (Array.isArray(arr) ? arr.map(String).filter((x) => valid.has(x)) : []);
  const out = { levels: {}, users: {} };
  const L = (cfg && cfg.levels) || {};
  for (const k of ['1', '2']) if (L[k]) out.levels[k] = keep(L[k]);
  const U = (cfg && cfg.users) || {};
  for (const u of Object.keys(U)) {
    const off = keep(U[u] && U[u].off), on = keep(U[u] && U[u].on);
    if (off.length || on.length) out.users[u] = { off, on };
  }
  return out;
}

module.exports = { effectiveDisabled, cleanConfig };
