'use strict';
// Web-search providers, split out of index.js. The per-engine HTTP fetchers are
// pure over their injected deps (a fetch function, the engine's API key, and an
// html→text helper): query in, a normalized [{title,url,snippet}] list (or null)
// out — no app state. index.js keeps the enabled-engines list, key lookup, the
// fallback loop and the settings route, and calls searchOne() for each engine.

const SEARCH_LABELS = { duckduckgo: 'DuckDuckGo (رایگان)', brave: 'Brave Search', tavily: 'Tavily' };

// The built-in engines, with each one's enabled state derived from whether its
// key is present in the given config (DuckDuckGo is keyless, always on).
function defaultSearchEngines(cfg) {
  cfg = cfg || {};
  return [
    { id: 'duckduckgo', label: SEARCH_LABELS.duckduckgo, enabled: true, keyless: true },
    { id: 'brave', label: SEARCH_LABELS.brave, enabled: !!cfg.KEY_BRAVE, keyless: false },
    { id: 'tavily', label: SEARCH_LABELS.tavily, enabled: !!cfg.KEY_TAVILY, keyless: false },
  ];
}

// One engine → results or null. deps: { key, fetchWithTimeout, htmlToText }.
async function searchOne(id, q, n, deps) {
  const { key, fetchWithTimeout, htmlToText } = deps || {};
  try {
    if (id === 'brave') {
      if (!key) return null;
      const r = await fetchWithTimeout('https://api.search.brave.com/res/v1/web/search?q=' + encodeURIComponent(q) + '&count=' + n,
        { headers: { Accept: 'application/json', 'X-Subscription-Token': key } });
      if (!r.ok) return null;
      const d = await r.json();
      const items = ((d.web && d.web.results) || []).slice(0, n).map((x) => ({ title: x.title, url: x.url, snippet: x.description || '' }));
      return items.length ? items : null;
    }
    if (id === 'tavily') {
      if (!key) return null;
      const r = await fetchWithTimeout('https://api.tavily.com/search', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ api_key: key, query: q, max_results: n }),
      });
      if (!r.ok) return null;
      const d = await r.json();
      const items = (d.results || []).slice(0, n).map((x) => ({ title: x.title, url: x.url, snippet: x.content || '' }));
      return items.length ? items : null;
    }
    if (id === 'duckduckgo') {
      const r = await fetchWithTimeout('https://html.duckduckgo.com/html/?q=' + encodeURIComponent(q),
        { headers: { 'User-Agent': 'Mozilla/5.0 (compatible; SetayeshAI/1.0)' } });
      if (!r.ok) return null;
      const html = await r.text();
      const out = [];
      const re = /<a[^>]+class="result__a"[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi;
      let m;
      while ((m = re.exec(html)) && out.length < n) {
        let link = m[1];
        const dd = link.match(/uddg=([^&]+)/);
        if (dd) { try { link = decodeURIComponent(dd[1]); } catch (e) {} }
        out.push({ title: htmlToText(m[2]).slice(0, 200), url: link, snippet: '' });
      }
      return out.length ? out : null;
    }
  } catch (e) { /* try the next engine */ }
  return null;
}

module.exports = { SEARCH_LABELS, defaultSearchEngines, searchOne };
