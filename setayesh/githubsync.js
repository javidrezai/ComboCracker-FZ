'use strict';
// Pure helpers for GitHub-based auto-update and encrypted settings sync.
// جاوید: «آپدیت‌ها و تنظیمات از طریقِ گیت‌هاب منتقل شوند و خودش را بزرگ کند.»
// No network / no fs here (index.js does the I/O), so every branch is unit-testable.

// Accept a full URL ("https://github.com/owner/repo(.git)") or a plain
// "owner/repo" slug and return the normalized "owner/repo" (or '' if invalid).
function normalizeRepo(s) {
  s = String(s || '').trim().replace(/\.git$/i, '');
  const m = /github\.com[/:]([^/\s]+\/[^/\s]+)/i.exec(s);
  if (m) return m[1];
  return /^[^/\s]+\/[^/\s]+$/.test(s) ? s : '';
}

// Extract a dotted x.y.z version out of a release tag/name ("v9.9.220" → "9.9.220").
function versionFromTag(tag) {
  const m = /(\d+\.\d+\.\d+)/.exec(String(tag || ''));
  return m ? m[1] : '';
}

// Is dotted version `remote` strictly newer than `local`? Missing parts = 0.
function isNewer(remote, local) {
  const a = String(remote || '').split('.').map((n) => parseInt(n, 10) || 0);
  const b = String(local || '').split('.').map((n) => parseInt(n, 10) || 0);
  for (let i = 0; i < Math.max(a.length, b.length); i++) {
    const x = a[i] || 0, y = b[i] || 0;
    if (x !== y) return x > y;
  }
  return false;
}

// From a GitHub /releases/latest JSON, pick the install .zip asset. Prefers an
// asset whose name looks like a full install package; falls back to any .zip.
// Returns { version, assetName, downloadUrl } or null when there is nothing to install.
function pickReleaseZip(release) {
  if (!release || typeof release !== 'object') return null;
  const version = versionFromTag(release.tag_name || release.name);
  const assets = Array.isArray(release.assets) ? release.assets : [];
  const zips = assets.filter((a) => a && /\.zip$/i.test(a.name || '') && a.browser_download_url);
  if (!zips.length) return null;
  const pick = zips.find((a) => /(full|setayesh|install|clean)/i.test(a.name)) || zips[0];
  return { version, assetName: pick.name, downloadUrl: pick.browser_download_url };
}

// Build the GitHub Contents API URL for a settings file in a repo (for sync).
function contentsUrl(repo, filePath, branch) {
  const r = normalizeRepo(repo);
  if (!r) return '';
  let u = 'https://api.github.com/repos/' + r + '/contents/' + String(filePath || '').replace(/^\/+/, '');
  if (branch) u += '?ref=' + encodeURIComponent(branch);
  return u;
}

module.exports = { normalizeRepo, versionFromTag, isNewer, pickReleaseZip, contentsUrl };
