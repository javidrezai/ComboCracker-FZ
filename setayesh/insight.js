'use strict';
// insight.js — Setayesh's own internal search engine and memory fabric.
//
// This is the "awareness" جاوید asked for: one strong, private search index over
// EVERYTHING Setayesh knows about herself and this family — long-term memories,
// past conversations, the knowledge vault, and her own repositories (source,
// docs, the module map). It is fully local (no external service), and it is
// meant to be driven by the brain itself: a tool the model calls before it
// answers, plus automatic grounding that pulls the few most relevant things into
// context every single turn.
//
// Ranking is BM25 (Okapi) — markedly better than plain TF-IDF cosine for "find
// the note/among-many that is actually about X", with length normalisation so a
// long document doesn't drown a short precise one. The tokenizer is shared with
// rag.js (Persian + English, diacritics stripped). Short-term memory is the live
// conversation (already in the messages); this engine is the long-term half.

const { tokenize } = require('./rag');

function makeInsight(opts) {
  opts = opts || {};
  const MAX_TEXT = opts.maxTextChars || 4000;
  const k1 = 1.5, b = 0.75;

  const providers = [];        // { name, load: () => [{id,user,source,title,path,text,at}] }
  let docs = [];               // indexed docs
  const df = new Map();        // term -> #docs
  let N = 0, avgdl = 1;
  let lastIndexed = 0;

  // A source is a named loader that returns documents. Registered from index.js
  // so this module stays generic and depends on nothing in the app.
  function register(name, load) { providers.push({ name, load }); }

  function reindex() {
    const next = [];
    const ndf = new Map();
    let totalLen = 0;
    for (const p of providers) {
      let items = [];
      try { items = p.load() || []; } catch (e) { items = []; }
      for (const it of items) {
        if (!it) continue;
        const title = String(it.title || '').slice(0, 200);
        const text = String(it.text || '').slice(0, MAX_TEXT);
        const toks = tokenize(title + ' ' + title + ' ' + text); // title counts double
        if (!toks.length) continue;
        const tf = new Map();
        for (const t of toks) tf.set(t, (tf.get(t) || 0) + 1);
        const d = {
          id: String(it.id || (p.name + ':' + next.length)),
          user: it.user || '',                 // '' = shared/visible to everyone
          source: it.source || p.name,
          title, path: it.path || '', at: it.at || '',
          snippet: (text || title).slice(0, 320),
          tf, len: toks.length,
        };
        next.push(d);
        totalLen += d.len;
        const seen = new Set(tf.keys());
        for (const t of seen) ndf.set(t, (ndf.get(t) || 0) + 1);
      }
    }
    docs = next;
    df.clear(); for (const [t, n] of ndf) df.set(t, n);
    N = docs.length;
    avgdl = N ? totalLen / N : 1;
    lastIndexed = Date.now();
    return { docs: N, terms: df.size };
  }

  function idf(t) {
    const n = df.get(t) || 0;
    return Math.max(0, Math.log(1 + (N - n + 0.5) / (n + 0.5)));
  }

  // search(query, { user, all, limit, sources })
  //   - user: only this user's private docs (plus all shared docs) are visible
  //   - all:  admin — see every private doc too
  //   - sources: optional whitelist of source names
  function search(query, o) {
    o = o || {};
    const qToks = tokenize(query);
    if (!qToks.length || !N) return [];
    const qterms = new Set(qToks);
    const phrase = String(query || '').toLowerCase().trim();
    const srcFilter = o.sources && o.sources.length ? new Set(o.sources) : null;
    const out = [];
    for (const d of docs) {
      if (srcFilter && !srcFilter.has(d.source)) continue;
      // privacy scope: shared docs (no owner) are always visible; a private doc
      // is visible only to its owner, or to an admin doing an all-scope search.
      if (d.user && !o.all && d.user !== o.user) continue;
      let score = 0;
      for (const t of qterms) {
        const f = d.tf.get(t);
        if (!f) continue;
        score += idf(t) * (f * (k1 + 1)) / (f + k1 * (1 - b + b * (d.len / avgdl)));
      }
      if (score <= 0) continue;
      // exact-phrase / title boosts — a literal hit is what the user usually means
      if (phrase.length >= 3) {
        if ((d.title || '').toLowerCase().includes(phrase)) score *= 1.8;
        else if (d.snippet.toLowerCase().includes(phrase)) score *= 1.4;
      }
      out.push({ id: d.id, source: d.source, title: d.title, path: d.path, at: d.at,
                 score: Math.round(score * 1000) / 1000, snippet: d.snippet });
    }
    out.sort((a, b) => b.score - a.score);
    return out.slice(0, Math.max(1, Math.min(20, o.limit || 6)));
  }

  function stats() {
    const bySource = {};
    for (const d of docs) bySource[d.source] = (bySource[d.source] || 0) + 1;
    return { docs: N, terms: df.size, sources: providers.map((p) => p.name), bySource, lastIndexed };
  }

  return { register, reindex, search, stats };
}

module.exports = { makeInsight };
