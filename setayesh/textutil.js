'use strict';
// Small pure text helpers, split out of index.js as part of the incremental
// modularization. No shared server state.

// Normalize a chat history (string JSON or array) into the last 24 clean
// {role, content} turns — user/assistant only, string content only.
function sanitizeHistory(raw) {
  let history = [];
  if (typeof raw === 'string') { try { history = JSON.parse(raw); } catch (e) { history = []; } }
  else if (Array.isArray(raw)) history = raw;
  return Array.isArray(history)
    ? history
        .filter((m) => m && (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string')
        .slice(-24)
        .map((m) => ({ role: m.role, content: m.content }))
    : [];
}

// Mask a secret for display: keep the first/last few chars, hide the middle.
function maskSecret(v) {
  const s = String(v || '');
  if (!s) return '';
  return s.length <= 8 ? '••••' : s.slice(0, 4) + '••••••' + s.slice(-4);
}

module.exports = { sanitizeHistory, maskSecret };
