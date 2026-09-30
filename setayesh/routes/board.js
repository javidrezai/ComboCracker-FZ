'use strict';

// Family board (one shared room) — extracted from index.js as the next step of
// splitting the server monolith into routes/ modules (charter rule 3.4).
// Behavior is unchanged: this is the same code, now registered via register().
//
// The board is the shared family feed: short messages, pinned notices, photos
// and other attachments, and optional one-tap location. Attachments live on
// disk next to the app (never base64'd into the JSON), and stored names are
// generated here so a client filename can never walk out of the folder.
//
// The module OWNS the board array and saveBoard(), because both the routes and
// a few callers in index.js (login notice, sync merge, urgent notify, the
// home summary) read and rewrite it. Those callers use the small API returned
// by register(): add(), getBoard(), setBoard(), saveBoard().

const crypto = require('crypto');
const path = require('path');
const fs = require('fs');

function register(app, deps) {
  const { requireAuth, requireAdmin, isAdmin, multer, DATA_DIR, loadJsonFile, saveJsonFile, usersMap } = deps;

  const BOARD_FILE = process.env.SETAYESH_BOARD_FILE || path.join(DATA_DIR, '.setayesh-board.json');
  let board = loadJsonFile(BOARD_FILE, []);
  const BOARD_MAX = 500;

  function saveBoard() {
    if (board.length > BOARD_MAX) board = board.slice(-BOARD_MAX);
    saveJsonFile(BOARD_FILE, board);
  }

  app.get('/api/board', requireAuth, (req, res) => {
    const since = String(req.query.since || '');
    const list = since ? board.filter((m) => m.at > since) : board.slice(-120);
    // Track what each person has seen, so the unread badge is per-person.
    res.json({
      messages: list,
      unread: board.filter((m) => m.by !== req.username && !(m.seenBy || []).includes(req.username)).length,
    });
  });

  // Attachments live on disk next to the app, not inside the JSON — a photo
  // base64'd into a message file would bloat it until the board stopped loading.
  const BOARD_FILES_DIR = process.env.SETAYESH_BOARD_FILES || path.join(DATA_DIR, 'board-files');
  const BOARD_MAX_FILE = 250 * 1024 * 1024;   // 250MB

  const boardUpload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: BOARD_MAX_FILE, files: 4 },
  });

  function boardKind(mime, name) {
    const m = String(mime || '').toLowerCase();
    if (m.startsWith('image/')) return 'image';
    if (m.startsWith('audio/')) return 'audio';
    if (m.startsWith('video/')) return 'video';
    if (m === 'application/pdf' || /\.pdf$/i.test(name || '')) return 'pdf';
    return 'file';
  }

  app.post('/api/board', requireAuth, boardUpload.array('files', 4), (req, res) => {
    const text = String((req.body || {}).text || '').trim().slice(0, 2000);
    const pinned = String((req.body || {}).pinned) === 'true' && isAdmin(req.username);
    const files = req.files || [];
    if (!text && !files.length) return res.status(400).json({ error: 'پیام خالی است.' });

    const id = crypto.randomBytes(6).toString('hex');
    const attachments = [];
    try {
      if (files.length) fs.mkdirSync(BOARD_FILES_DIR, { recursive: true });
      for (const f of files) {
        // The original filename comes from the client, so it is never used as a
        // path — only stored as a label. The stored name is generated here.
        const ext = (path.extname(f.originalname || '').match(/^\.[A-Za-z0-9]{1,8}$/) || [''])[0].toLowerCase();
        const stored = id + '_' + crypto.randomBytes(4).toString('hex') + ext;
        fs.writeFileSync(path.join(BOARD_FILES_DIR, stored), f.buffer, { mode: 0o600 });
        attachments.push({
          stored,
          name: String(f.originalname || 'file').slice(0, 120),
          size: f.size,
          mime: f.mimetype,
          kind: boardKind(f.mimetype, f.originalname),
        });
      }
    } catch (e) {
      return res.status(500).json({ error: 'ذخیره‌ی فایل ناموفق بود: ' + e.message });
    }

    // Optional location. Sent only when someone taps the button — never
    // collected in the background, and never stored beyond the message itself.
    let location = null;
    const lat = Number((req.body || {}).lat), lon = Number((req.body || {}).lon);
    if (Number.isFinite(lat) && Number.isFinite(lon) && Math.abs(lat) <= 90 && Math.abs(lon) <= 180) {
      location = {
        lat: Math.round(lat * 1e5) / 1e5,
        lon: Math.round(lon * 1e5) / 1e5,
        acc: Math.max(0, Math.min(100000, Number((req.body || {}).acc) || 0)),
      };
    }

    // A shared answer from Setayesh, so the family can see where it came from
    // rather than it looking like something a person wrote.
    const shared = String((req.body || {}).shared || '').slice(0, 60) || null;

    const msg = {
      id, by: req.username, text, pinned,
      attachments,
      location,
      shared,
      at: new Date().toISOString(),
      seenBy: [req.username],
    };
    board.push(msg);
    saveBoard();
    res.status(201).json({ ok: true, message: msg });
  });

  // Serve an attachment. The stored name is validated and resolved inside the
  // folder, so a crafted name cannot walk out of it.
  app.get('/api/board/file/:name', requireAuth, (req, res) => {
    const name = String(req.params.name || '');
    if (!/^[a-f0-9]{12}_[a-f0-9]{8}(\.[A-Za-z0-9]{1,8})?$/.test(name)) return res.status(400).json({ error: 'نامعتبر' });
    const full = path.resolve(BOARD_FILES_DIR, name);
    if (!full.startsWith(path.resolve(BOARD_FILES_DIR) + path.sep) || !fs.existsSync(full)) {
      return res.status(404).json({ error: 'پیدا نشد' });
    }
    const msg = board.find((m) => (m.attachments || []).some((a) => a.stored === name));
    const att = msg && (msg.attachments || []).find((a) => a.stored === name);
    if (att) {
      // Never let the browser execute an attachment as a page.
      const safeMime = /^(image|audio|video)\//.test(att.mime) || att.mime === 'application/pdf'
        ? att.mime : 'application/octet-stream';
      res.type(safeMime);
      res.setHeader('Content-Security-Policy', "default-src 'none'; sandbox");
      res.setHeader('X-Content-Type-Options', 'nosniff');
      if (safeMime === 'application/octet-stream') {
        res.setHeader('Content-Disposition', 'attachment; filename="' + att.name.replace(/[^\w.\- ]/g, '_') + '"');
      }
    }
    res.sendFile(full);
  });

  // Mark everything currently on the board as seen by this person.
  app.post('/api/board/seen', requireAuth, (req, res) => {
    let n = 0;
    for (const m of board) {
      if (!m.seenBy) m.seenBy = [];
      if (!m.seenBy.includes(req.username)) { m.seenBy.push(req.username); n++; }
    }
    if (n) saveBoard();
    res.json({ ok: true, marked: n });
  });

  app.delete('/api/board/:id', requireAuth, (req, res) => {
    const m = board.find((x) => x.id === req.params.id);
    if (!m) return res.status(404).json({ error: 'پیدا نشد' });
    // Your own message, or anything if you are the admin.
    if (m.by !== req.username && !isAdmin(req.username)) {
      return res.status(403).json({ error: 'فقط پیام خودت را می‌توانی حذف کنی.' });
    }
    for (const a of (m.attachments || [])) {
      try { fs.unlinkSync(path.join(BOARD_FILES_DIR, a.stored)); } catch (e) {}
    }
    board = board.filter((x) => x.id !== req.params.id);
    saveBoard();
    res.json({ ok: true });
  });

  // Clear the board. Everyone can clear their own messages; the admin can wipe
  // the whole board when it has served its purpose.
  app.post('/api/board/clear', requireAuth, (req, res) => {
    const scope = String((req.body || {}).scope || 'mine');
    const before = board.length;
    if (scope === 'all' || scope === 'everything') {
      if (!isAdmin(req.username)) return res.status(403).json({ error: 'پاک کردن کل تابلو فقط برای مدیر است.' });
      const keepPinned = scope === 'all';   // 'all' spares pins; 'everything' wipes them too
      for (const m of board) {
        if (keepPinned && m.pinned) continue;
        for (const a of (m.attachments || [])) {
          try { fs.unlinkSync(path.join(BOARD_FILES_DIR, a.stored)); } catch (e) {}
        }
      }
      board = keepPinned ? board.filter((m) => m.pinned) : [];
    } else if (scope === 'read') {
      // Tidy up: drop everything everyone has already seen, keep pins.
      const users_ = Array.from(usersMap.keys());
      board = board.filter((m) => m.pinned || !users_.every((u) => (m.seenBy || []).includes(u)));
    } else {
      board = board.filter((m) => m.by !== req.username || m.pinned);
    }
    saveBoard();
    res.json({ ok: true, removed: before - board.length, remaining: board.length });
  });

  // Pin a notice to the top — the "read this" slot for the whole house.
  app.post('/api/board/:id/pin', requireAuth, requireAdmin, (req, res) => {
    const m = board.find((x) => x.id === req.params.id);
    if (!m) return res.status(404).json({ error: 'پیدا نشد' });
    m.pinned = !m.pinned;
    saveBoard();
    res.json({ ok: true, pinned: m.pinned });
  });

  // Small API for the few index.js callers that also read/rewrite the board
  // (login notice, sync merge, urgent notify, home summary). getBoard() always
  // returns the current array reference, since the routes above reassign it.
  return {
    saveBoard,
    getBoard: () => board,
    setBoard: (arr) => { board = arr; saveBoard(); },
    add: (msg) => { board.push(msg); saveBoard(); },
  };
}

module.exports = { register };
