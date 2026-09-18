'use strict';
// Pure input sanitizers, split out of index.js (no shared state). Each validates
// untrusted client input and returns only clean, bounded values — a bad value
// falls back to a default rather than being written through. Unit-tested.
const path = require('path');

// Theme: only these keys exist, each validated; a bad value falls back.
const THEME_DEFAULTS = {
  appName: 'Setayesh AI',
  greeting: '',
  accent: '#38bdf8',
  accent2: '#7b5cff',
  bg: '#0a0e1a',
  fontScale: 100,
  radius: 16,
  effects: true,
};
function sanitizeTheme(input) {
  input = input || {};
  const out = {};
  const hex = (v) => (/^#[0-9a-fA-F]{6}$/.test(String(v || '')) ? String(v) : null);
  if (typeof input.appName === 'string') out.appName = input.appName.trim().slice(0, 40) || THEME_DEFAULTS.appName;
  if (typeof input.greeting === 'string') out.greeting = input.greeting.trim().slice(0, 120);
  for (const k of ['accent', 'accent2', 'bg']) if (hex(input[k])) out[k] = hex(input[k]);
  if (Number.isFinite(Number(input.fontScale))) out.fontScale = Math.max(80, Math.min(140, Math.round(Number(input.fontScale))));
  if (Number.isFinite(Number(input.radius))) out.radius = Math.max(0, Math.min(28, Math.round(Number(input.radius))));
  if (typeof input.effects === 'boolean') out.effects = input.effects;
  return out;
}

// Member profile fields (age / interests / tone), bounded.
function sanitizeProfileFields(body) {
  body = body || {};
  const out = {};
  if (body.age === null || body.age === '') out.age = null;
  else if (Number.isFinite(Number(body.age))) out.age = Math.max(1, Math.min(120, Math.round(Number(body.age))));
  if (typeof body.interests === 'string') out.interests = body.interests.slice(0, 300);
  if (typeof body.tone === 'string') out.tone = body.tone.slice(0, 200);
  return out;
}

// A client-supplied script name → a safe basename with a .py extension, or null.
// The caller still resolves it under SCRIPTS_DIR and checks containment.
function safeScriptName(name) {
  const base = path.basename(String(name || '').replace(/\\/g, '/'));
  const clean = base.replace(/[^\p{L}\p{N}_\-. ]/gu, '').replace(/^\.+/, '').trim();
  if (!clean) return null;
  const withExt = /\.py$/i.test(clean) ? clean : clean + '.py';
  return withExt.slice(0, 80);
}

module.exports = { THEME_DEFAULTS, sanitizeTheme, sanitizeProfileFields, safeScriptName };
