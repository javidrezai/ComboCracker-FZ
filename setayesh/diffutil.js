'use strict';
// A line-level diff, split out of index.js (pure: two strings in, an array of
// {t,n,s} change rows out). Enough for a human to judge a proposed edit at a
// glance — not a full Myers diff. Capped so a huge change can't blow up the UI.
function makeDiff(before, after) {
  const a = String(before).split('\n'), b = String(after).split('\n');
  const out = [];
  let i = 0, j = 0;
  while (i < a.length || j < b.length) {
    if (i < a.length && j < b.length && a[i] === b[j]) { i++; j++; continue; }
    const nextMatch = b.indexOf(a[i], j);
    if (i < a.length && nextMatch !== -1 && nextMatch - j < 40) {
      while (j < nextMatch) out.push({ t: '+', n: j + 1, s: b[j++] });
    } else if (j < b.length && a.indexOf(b[j], i) === -1) {
      out.push({ t: '+', n: j + 1, s: b[j++] });
    } else if (i < a.length) {
      out.push({ t: '-', n: i + 1, s: a[i++] });
    } else { out.push({ t: '+', n: j + 1, s: b[j++] }); }
    if (out.length > 400) { out.push({ t: '!', n: 0, s: '... (تفاوت خیلی بزرگ است — کوتاه شد)' }); break; }
  }
  return out;
}

module.exports = { makeDiff };
