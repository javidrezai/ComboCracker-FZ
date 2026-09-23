'use strict';

// privacyshield.js — the pure text side of the family privacy shield.
//
// Part of the ongoing "break the monolith into modules" work (see WORK-LOG).
// These three functions are the only privacy logic that is genuinely pure:
// text in, redacted text (or a hit list) out. They depend on nothing but the
// pattern tables in ./privacydata and the caller-supplied list of protected
// terms — so they are trivial to unit-test and can't drift silently.
//
// The STATEFUL parts of the shield stay in index.js on purpose: loading and
// saving .setayesh-privacy.json, deriving the protected-term list from the
// account names, recording a blocked-send audit entry, and deciding whether
// the shield is active for a given user (the admin/father is exempt). Those
// touch disk and live state; only the matching lives here.
//
// The redaction placeholder is Persian ("[حذف‌شده]" = "[removed]") to match the
// rest of the UI the family sees.

const { PII_PATTERNS, SECRET_PATTERNS, HIGH_VALUE, KIND_LABEL } = require('./privacydata');

const REDACTED = '[حذف‌شده]';

// Build a fresh RegExp from a pattern-table entry. The tables are shared
// module-level data, and a RegExp with the /g flag carries mutable lastIndex
// state, so reusing p.re across test()/replace() calls would skip matches.
// Cloning per use keeps every call independent.
function reOf(p) { return new RegExp(p.re.source, p.re.flags); }

// Escape a protected term so it is matched literally inside a RegExp.
function escapeTerm(term) { return String(term).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }

// Returns { clean, hits } — hits is what would leave the machine.
// `terms` is the caller's protected-term list (account names + manual terms).
function scanOutbound(text, terms = []) {
  const s = String(text == null ? '' : text);
  const lower = s.toLowerCase();
  const hits = [];
  for (const term of terms) {
    if (term && lower.includes(String(term).toLowerCase())) hits.push({ kind: 'name', term });
  }
  for (const p of PII_PATTERNS) {
    if (reOf(p).test(s)) hits.push({ kind: p.name });
  }
  return { clean: hits.length === 0, hits };
}

// The message shield for what the FAMILY types. It removes only the genuinely
// sensitive fragment (never the whole message) and reports what it held back.
// Secrets first, then PII, then protected names — longer/more-specific formats
// are ordered ahead in the tables so a broad pattern can't eat half of a
// longer one. Returns { text, removed:[kinds], blockedHighValue, labels }.
function shieldMessage(raw, terms = []) {
  let s = String(raw == null ? '' : raw);
  const removed = new Set();

  for (const p of SECRET_PATTERNS) {
    if (reOf(p).test(s)) { removed.add(p.name); s = s.replace(reOf(p), REDACTED); }
  }
  for (const p of PII_PATTERNS) {
    if (reOf(p).test(s)) { removed.add(p.name); s = s.replace(reOf(p), REDACTED); }
  }
  for (const term of terms) {
    if (!term) continue;
    const esc = escapeTerm(term);
    const re = new RegExp(esc, 'gi');
    if (re.test(s)) { removed.add('name'); s = s.replace(new RegExp(esc, 'gi'), REDACTED); }
  }

  const list = [...removed];
  return {
    text: s,
    removed: list,
    blockedHighValue: list.some((k) => HIGH_VALUE.includes(k)),
    labels: list.map((k) => KIND_LABEL[k] || k),
  };
}

// Strip protected names and PII from text Setayesh is about to send/store.
// Unlike shieldMessage this is a quiet redaction (no reporting), used on the
// model's own output, memory snippets, and profile fields.
function redactOutbound(text, terms = []) {
  let s = String(text == null ? '' : text);
  for (const term of terms) {
    if (!term) continue;
    s = s.replace(new RegExp(escapeTerm(term), 'gi'), REDACTED);
  }
  for (const p of PII_PATTERNS) s = s.replace(reOf(p), REDACTED);
  return s;
}

module.exports = { scanOutbound, shieldMessage, redactOutbound, REDACTED };
