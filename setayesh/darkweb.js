'use strict';
// ---------------------------------------------------------------------------
// darkweb.js — pure helpers for the "دیده‌بانِ دارک‌وب" (dark-web watch).
// ---------------------------------------------------------------------------
// This is the SAFE, defensive side of the dark web: Setayesh watches whether
// the FAMILY'S OWN emails show up in known dark-web / breach dumps, and alerts
// the owner so they can change the exposed passwords. It does NOT browse .onion
// sites, buy or sell anything, or touch anyone else's data — it only asks the
// legitimate Have I Been Pwned service about addresses the owner explicitly
// added. The actual network call lives in breachcheck.js; this file is the
// pure decision logic (which breaches are NEW, how to clean the watch list),
// kept separate so it can be unit-tested without a network.

// Validate + normalize + dedupe a list of watched emails. Lower-cases, trims,
// drops anything that is not a plausible address, and caps the list so the
// daily scan can never hammer HIBP. Returns a clean array.
function cleanEmails(list, max) {
  const cap = Number.isFinite(max) ? max : 50;
  const re = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
  const out = [];
  const seen = new Set();
  for (const raw of Array.isArray(list) ? list : []) {
    const e = String(raw || '').trim().toLowerCase();
    if (!e || !re.test(e) || seen.has(e)) continue;
    seen.add(e);
    out.push(e);
    if (out.length >= cap) break;
  }
  return out;
}

// Given the breach names we have ALREADY told the owner about (prevSeen) and
// the breaches HIBP reports now, return the names that are NEW. This is what
// turns a repeated scan into an alert-only-on-change watch: an email that was
// already known to be in "Adobe" does not re-alert every day.
function diffNew(prevSeen, breaches) {
  const known = new Set((Array.isArray(prevSeen) ? prevSeen : []).map((x) => String(x)));
  const out = [];
  for (const b of Array.isArray(breaches) ? breaches : []) {
    const name = b && (b.Name || b.Title);
    if (name && !known.has(String(name))) out.push(String(name));
  }
  return out;
}

// The full set of breach names currently reported for an email — what we store
// as "seen" after a scan so the next scan can diff against it.
function namesOf(breaches) {
  return (Array.isArray(breaches) ? breaches : [])
    .map((b) => b && (b.Name || b.Title))
    .filter(Boolean)
    .map(String);
}

module.exports = { cleanEmails, diffNew, namesOf };
