'use strict';

// Long-term memory (per user) + local RAG routes — extracted from index.js as a
// cautious, characterization-tested step of splitting the monolith (charter
// rule 3.4). The code is MOVED VERBATIM; only the module wrapper and the deps
// destructure are new, so behavior is identical (the existing memory-CRUD and
// RAG-search smoke tests already lock it in).
//
// The module owns the `memory` map (username -> entries) and saveMemory, and
// exposes memoryFor / addMemory / memoryBlock so index.js (chat tools, prompt
// builder, sync, suggestions) keeps calling them unchanged via thin wrappers.
// MEMORY_FILE stays defined in index.js (the backup file-list references it)
// and is passed in. deps: requireAuth, requireAdmin, isAdmin, users, rag,
// privacy, redactOutbound, loadJsonFile, saveJsonFile, MEMORY_FILE.

const crypto = require('crypto');

function register(app, deps) {
  const { requireAuth, requireAdmin, isAdmin, users, rag, privacy, redactOutbound,
          loadJsonFile, saveJsonFile, MEMORY_FILE } = deps;

let memory = loadJsonFile(MEMORY_FILE, {});   // username -> [entries]
function saveMemory() { saveJsonFile(MEMORY_FILE, memory); }

const MEMORY_MAX_PER_USER = 200;
const MEMORY_INJECT_CHARS = 2200;

function memoryFor(username) { return memory[username] || []; }

function addMemory(username, entry) {
  const list = memory[username] || (memory[username] = []);
  const item = {
    id: crypto.randomBytes(6).toString('hex'),
    text: String(entry.text || '').slice(0, 600),
    kind: ['fact', 'preference', 'project', 'document', 'deadline'].includes(entry.kind) ? entry.kind : 'fact',
    due: entry.due ? String(entry.due).slice(0, 30) : null,
    createdAt: new Date().toISOString(),
  };
  if (!item.text) throw new Error('متن حافظه لازم است.');
  list.push(item);
  if (list.length > MEMORY_MAX_PER_USER) memory[username] = list.slice(-MEMORY_MAX_PER_USER);
  saveMemory();
  // Index it for local semantic search (best-effort — never block a save).
  try { rag.add({ id: item.id, text: item.text, user: username, source: 'memory' }); } catch (e) {}
  return item;
}

// What gets pushed into the system prompt each turn.
//
// IMPORTANT: memory is redacted on the way out, exactly like a typed message.
// Memory is only useful because it holds context, but that context goes to a
// cloud provider on every single turn — so the same shield applies. Names and
// identifiers are stripped; the useful shape ("works in road construction",
// "has a letter due 14 March") survives, which is what actually helps.
function memoryBlock(username) {
  const list = memoryFor(username);
  if (!list.length) return '';
  const today = new Date().toISOString().slice(0, 10);

  const open = list.filter((m) => m.due && m.due >= today).sort((a, b) => a.due.localeCompare(b.due));
  const overdue = list.filter((m) => m.due && m.due < today);
  const rest = list.filter((m) => !m.due).slice(-30).reverse();

  let out = '';
  const push = (line) => { if (out.length + line.length < MEMORY_INJECT_CHARS) out += line + '\n'; };
  for (const m of overdue) push(`• [مهلت گذشته: ${m.due}] ${m.text}`);
  for (const m of open) push(`• [مهلت: ${m.due}] ${m.text}`);
  for (const m of rest) push(`• ${m.text}`);
  if (!out.trim()) return '';

  const safe = privacy.enabled ? redactOutbound(out) : out;
  return `\n\n*** آنچه درباره‌ی این کاربر می‌دانی ***\nاین‌ها را قبلاً یاد گرفته‌ای. طبیعی استفاده کن، فهرست‌وار تکرارشان نکن. اگر مهلتی نزدیک یا گذشته است، یک‌بار کوتاه یادآوری کن:\n${safe.trim()}`;
}

app.get('/api/memory', requireAuth, (req, res) => {
  res.json({ memory: memoryFor(req.username).slice().reverse() });
});

app.post('/api/memory', requireAuth, (req, res) => {
  try { res.status(201).json({ ok: true, entry: addMemory(req.username, req.body || {}) }); }
  catch (e) { res.status(400).json({ error: e.message }); }
});

app.delete('/api/memory/:id', requireAuth, (req, res) => {
  const list = memoryFor(req.username);
  const next = list.filter((m) => m.id !== req.params.id);
  if (next.length === list.length) return res.status(404).json({ error: 'پیدا نشد' });
  memory[req.username] = next;
  saveMemory();
  try { rag.remove(req.params.id); } catch (e) {}
  res.json({ ok: true });
});

// Local RAG: semantic-ish search over the caller's own notes/memories (admin
// may search across everyone). Also the backing for the `recall` AI tool.
app.get('/api/rag/search', requireAuth, (req, res) => {
  const q = String(req.query.q || '');
  if (!q.trim()) return res.json({ results: [] });
  res.json({ results: rag.search(q, Number(req.query.limit) || 5, { user: req.username, all: isAdmin(req.username) }) });
});
app.get('/api/admin/rag', requireAuth, requireAdmin, (req, res) => res.json(rag.stats()));
app.post('/api/admin/rag/reindex', requireAuth, requireAdmin, (req, res) => {
  let n = 0;
  for (const [user, list] of Object.entries(memory)) {
    for (const m of (list || [])) { try { rag.add({ id: m.id, text: m.text, user, source: 'memory' }); n++; } catch (e) {} }
  }
  res.json({ ok: true, indexed: n, stats: rag.stats() });
});

// Admin oversight: see every account's memory in one place.
app.get('/api/admin/memory', requireAuth, requireAdmin, (req, res) => {
  const out = {};
  for (const u of users.keys()) out[u] = memoryFor(u).slice().reverse();
  res.json({ memory: out });
});

  return { memory, saveMemory, memoryFor, addMemory, memoryBlock };
}

module.exports = { register };
