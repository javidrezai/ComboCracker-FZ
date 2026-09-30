'use strict';

// Light, local RAG — semantic-ish retrieval over the family's own notes and
// memories, with NO heavy dependency and NO external service (charter rules
// 3.1 + offline-first). It's a compact TF-IDF vector index with cosine
// similarity, in pure JS, persisted to one small JSON file. For a family-scale
// corpus (memories, notes, docs) this is fast and private; a neural embedder
// can be swapped in later behind the same add()/search() shape.
//
// Honest scope: this is lexical retrieval (matches shared/《related》terms,
// TF-IDF weighted), not a transformer embedding — good for "find what I saved
// about X", not for paraphrase-only matches. Persian and English both work
// (Unicode tokenizer, diacritics stripped).

const fs = require('fs');

function tokenize(s) {
  return String(s == null ? '' : s)
    .toLowerCase()
    .replace(/[ً-ٰٟـ]/g, '')   // Arabic/Persian diacritics + tatweel
    .replace(/[^\p{L}\p{N}]+/gu, ' ')              // keep letters & numbers (any script)
    .split(/\s+/)
    .filter((w) => w.length >= 2);
}

function makeRag(opts) {
  opts = opts || {};
  const STORE = opts.storeFile;
  const MAX_DOCS = opts.maxDocs || 5000;
  const SNIPPET = opts.snippetChars || 2000;

  let docs = new Map();          // id -> { id, user, source, text, at, tf:{term:count}, terms:[uniq] }
  const df = new Map();          // term -> number of docs containing it
  let dirty = false;

  load();
  function load() {
    try {
      const raw = JSON.parse(fs.readFileSync(STORE, 'utf8'));
      for (const d of (raw.docs || [])) indexDoc(d, false);
    } catch (e) { /* fresh index */ }
  }
  function save() {
    try { fs.writeFileSync(STORE, JSON.stringify({ docs: Array.from(docs.values()) }), { mode: 0o600 }); dirty = false; }
    catch (e) {}
  }
  function bumpDf(terms, delta) {
    for (const t of terms) {
      const n = (df.get(t) || 0) + delta;
      if (n <= 0) df.delete(t); else df.set(t, n);
    }
  }
  function indexDoc(d, persist) {
    if (!d || !d.id || docs.has(d.id)) return;
    if (!d.tf) {
      const toks = tokenize(d.text);
      const tf = {}; for (const t of toks) tf[t] = (tf[t] || 0) + 1;
      d.tf = tf; d.terms = Object.keys(tf);
    }
    docs.set(d.id, d);
    bumpDf(d.terms, 1);
    if (persist) { save(); }
  }

  function add(o) {
    o = o || {};
    const text = String(o.text || '').trim();
    if (!text) throw new Error('متن لازم است.');
    const id = o.id || (Date.now().toString(36) + Math.random().toString(36).slice(2, 8));
    const toks = tokenize(text);
    if (!toks.length) return null;
    const tf = {}; for (const t of toks) tf[t] = (tf[t] || 0) + 1;
    const doc = {
      id, user: o.user || '', source: (o.source || 'note').slice(0, 40),
      text: text.slice(0, SNIPPET), at: o.at || new Date().toISOString(),
      tf, terms: Object.keys(tf),
    };
    docs.set(id, doc);
    bumpDf(doc.terms, 1);
    // Rolling cap — drop the oldest when we exceed the ceiling.
    if (docs.size > MAX_DOCS) {
      const oldest = Array.from(docs.values()).sort((a, b) => (a.at < b.at ? -1 : 1))[0];
      if (oldest) remove(oldest.id, false);
    }
    save();
    return { id: doc.id };
  }
  function remove(id, persist) {
    const d = docs.get(id);
    if (!d) return false;
    bumpDf(d.terms, -1);
    docs.delete(id);
    if (persist !== false) save();
    return true;
  }

  function idf(term) { return Math.log((docs.size + 1) / ((df.get(term) || 0) + 1)) + 1; }
  function weightVec(tf) {
    const v = {}; let norm = 0;
    for (const t in tf) { const w = tf[t] * idf(t); v[t] = w; norm += w * w; }
    return { v, norm: Math.sqrt(norm) || 1 };
  }

  function search(query, k, scope) {
    scope = scope || {};
    const qToks = tokenize(query);
    if (!qToks.length) return [];
    const qtf = {}; for (const t of qToks) qtf[t] = (qtf[t] || 0) + 1;
    const q = weightVec(qtf);
    const out = [];
    for (const d of docs.values()) {
      if (!scope.all && scope.user != null && d.user !== scope.user) continue;
      // dot product over the query terms only (sparse & fast)
      let dot = 0; const dv = weightVec(d.tf);
      for (const t in q.v) { const dw = dv.v[t]; if (dw) dot += q.v[t] * dw; }
      if (dot <= 0) continue;
      const score = dot / (q.norm * dv.norm);
      out.push({ id: d.id, source: d.source, at: d.at, score: Math.round(score * 1000) / 1000, snippet: d.text.slice(0, 240) });
    }
    out.sort((a, b) => b.score - a.score);
    return out.slice(0, Math.max(1, Math.min(20, k || 5)));
  }

  function stats() {
    const bySource = {};
    for (const d of docs.values()) bySource[d.source] = (bySource[d.source] || 0) + 1;
    return { docs: docs.size, terms: df.size, bySource };
  }
  function clearUser(user) {
    for (const d of Array.from(docs.values())) if (d.user === user) remove(d.id, false);
    save();
  }

  return { add, remove: (id) => remove(id, true), search, stats, clearUser, tokenize };
}

module.exports = { makeRag, tokenize };
