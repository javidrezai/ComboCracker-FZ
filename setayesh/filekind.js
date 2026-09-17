'use strict';
const path = require('path');

// File-type classification + text clamping, split out of index.js. Pure helpers
// and the constant sets they need; no shared server state. index.js re-imports
// the constants it still references elsewhere.

const ALLOWED_IMAGE_TYPES = new Set(['image/png', 'image/jpeg', 'image/webp', 'image/gif']);
const MAX_FILE_BYTES = 250 * 1024 * 1024;
const MAX_TEXT_CHARS = 120000;
const TEXT_EXTENSIONS = new Set([
  '.txt', '.md', '.markdown', '.csv', '.tsv', '.json', '.yaml', '.yml', '.xml', '.toml',
  '.js', '.jsx', '.ts', '.tsx', '.mjs', '.cjs', '.vue', '.svelte',
  '.py', '.rb', '.go', '.rs', '.java', '.kt', '.swift', '.dart', '.scala',
  '.c', '.h', '.cpp', '.hpp', '.cc', '.cs', '.php', '.pl', '.lua', '.r',
  '.sh', '.bash', '.zsh', '.bat', '.ps1', '.sql', '.graphql', '.proto',
  '.html', '.htm', '.css', '.scss', '.sass', '.less',
  '.ini', '.conf', '.cfg', '.env', '.log', '.lock', '.gradle', '.dockerfile',
]);
const OFFICE_EXTENSIONS = new Set([
  '.docx', '.docm', '.xlsx', '.xlsm', '.pptx', '.pptm', '.odt', '.ods', '.odp',
]);

// What kind of upload is this — image / pdf / office / zip / text / null?
function classifyFile(file) {
  if (ALLOWED_IMAGE_TYPES.has(file.mimetype)) return 'image';
  if (file.mimetype === 'application/pdf' || /\.pdf$/i.test(file.originalname)) return 'pdf';
  const ext = path.extname(file.originalname).toLowerCase();
  if (OFFICE_EXTENSIONS.has(ext)) return 'office';
  if (ext === '.zip' || file.mimetype === 'application/zip') return 'zip';
  const noExtOk = /^(dockerfile|makefile|gemfile|rakefile|procfile)$/i.test(file.originalname);
  if (TEXT_EXTENSIONS.has(ext) || noExtOk || file.mimetype.startsWith('text/')) return 'text';
  return null;
}

// Wrap file text with a labelled header, truncating past MAX_TEXT_CHARS.
function clampText(text, label) {
  let out = text;
  let truncated = false;
  if (out.length > MAX_TEXT_CHARS) { out = out.slice(0, MAX_TEXT_CHARS); truncated = true; }
  return `--- file: ${label} ---\n${out}${truncated ? '\n... (truncated)' : ''}`;
}

module.exports = {
  ALLOWED_IMAGE_TYPES, MAX_FILE_BYTES, MAX_TEXT_CHARS, TEXT_EXTENSIONS, OFFICE_EXTENSIONS,
  classifyFile, clampText,
};
