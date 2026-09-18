'use strict';
// GitHub read helpers, split out of index.js. Network-only and pure over their
// injected deps ({ fetchWithTimeout, clampText }) — no app state. index.js keeps
// thin wrappers that supply the shared fetch + text-clamp helpers.
const GH_HEADERS = { 'User-Agent': 'SetayeshAI/1.0', 'Accept': 'application/vnd.github+json' };

// Search public repositories by stars. deps: { fetchWithTimeout }.
async function githubSearchRepos(query, count, deps) {
  const { fetchWithTimeout } = deps || {};
  const q = String(query || '').trim();
  if (!q) throw new Error('عبارت جستجو لازم است.');
  const n = Math.max(1, Math.min(8, Number(count) || 5));
  const r = await fetchWithTimeout('https://api.github.com/search/repositories?per_page=' + n
    + '&sort=stars&order=desc&q=' + encodeURIComponent(q), { headers: GH_HEADERS });
  if (r.status === 403) throw new Error('سقف نرخ گیت‌هاب پر شد — کمی بعد دوباره امتحان کن.');
  if (!r.ok) throw new Error('جستجوی گیت‌هاب ناموفق بود (' + r.status + ').');
  const d = await r.json();
  const items = (d.items || []).slice(0, n).map((x) => ({
    repo: x.full_name, stars: x.stargazers_count, lang: x.language || '',
    description: x.description || '', url: x.html_url, defaultBranch: x.default_branch || 'HEAD',
  }));
  if (!items.length) throw new Error('مخزنی پیدا نشد.');
  return { count: items.length, results: items };
}

// Fetch one raw file from a repo. deps: { fetchWithTimeout, clampText }.
async function githubGetFile(repo, filePath, ref, deps) {
  const { fetchWithTimeout, clampText } = deps || {};
  const rp = String(repo || '').trim().replace(/^https?:\/\/github\.com\//i, '').replace(/\/+$/, '');
  if (!/^[\w.-]+\/[\w.-]+$/.test(rp)) throw new Error('نام مخزن باید به‌صورت «owner/name» باشد.');
  const path_ = String(filePath || '').trim().replace(/^\/+/, '');
  if (!path_) throw new Error('مسیر فایل لازم است.');
  const branch = String(ref || 'HEAD').trim() || 'HEAD';
  const url = 'https://raw.githubusercontent.com/' + rp + '/' + encodeURI(branch) + '/' + encodeURI(path_);
  const r = await fetchWithTimeout(url, { headers: { 'User-Agent': 'SetayeshAI/1.0' } });
  if (r.status === 404) throw new Error('فایل پیدا نشد (مخزن/مسیر/شاخه را بررسی کن).');
  if (!r.ok) throw new Error('خواندن فایل ناموفق بود (' + r.status + ').');
  const text = await r.text();
  return { repo: rp, path: path_, branch, url, content: clampText(text, rp + '/' + path_) };
}

module.exports = { GH_HEADERS, githubSearchRepos, githubGetFile };
