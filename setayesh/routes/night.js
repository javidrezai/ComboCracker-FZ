'use strict';

// Night / overnight-assistant routes — extracted from index.js (charter rule
// 3.4). Behavior is unchanged: the route handlers and the pure inQuietHours()
// helper are moved verbatim; the state (`night`, saveNight, nightLog) and the
// whole self-heal / verify / rollback / auto-update ENGINE deliberately stay in
// index.js — that machinery calls process.exit and restarts the server, so it
// is not something to relocate casually. Only the small, testable settings and
// task-list endpoints move here, receiving the shared `night` object (mutated
// in place) and saveNight by reference.
//
// register(app, deps) mounts the routes. deps: requireAuth, requireAdmin,
// night, saveNight, RESTART_SUPPORTED, VERIFY_FILE.

const fs = require('fs');
const crypto = require('crypto');

function register(app, deps) {
  const { requireAuth, requireAdmin, night, saveNight, RESTART_SUPPORTED, VERIFY_FILE } = deps;

  function inQuietHours() {
    const h = new Date().getHours();
    return night.startHour <= night.endHour
      ? (h >= night.startHour && h < night.endHour)
      : (h >= night.startHour || h < night.endHour);   // window crossing midnight
  }

  app.get('/api/admin/night', requireAuth, requireAdmin, (req, res) => {
    res.json({
      settings: night,
      inQuietHours: inQuietHours(),
      restartSupported: RESTART_SUPPORTED,
      pendingVerification: fs.existsSync(VERIFY_FILE),
    });
  });

  app.post('/api/admin/night/settings', requireAuth, requireAdmin, (req, res) => {
    const b = req.body || {};
    if (typeof b.enabled === 'boolean') night.enabled = b.enabled;
    if (Number.isFinite(Number(b.startHour))) night.startHour = Math.max(0, Math.min(23, Number(b.startHour)));
    if (Number.isFinite(Number(b.endHour)))   night.endHour   = Math.max(0, Math.min(23, Number(b.endHour)));
    saveNight();
    res.json({ ok: true, settings: night });
  });

  app.post('/api/admin/night/tasks', requireAuth, requireAdmin, (req, res) => {
    const text = String((req.body || {}).text || '').trim().slice(0, 400);
    if (!text) return res.status(400).json({ error: 'دستور لازم است.' });
    night.tasks.push({ id: crypto.randomBytes(4).toString('hex'), text, at: new Date().toISOString(), done: false });
    saveNight();
    res.json({ ok: true, tasks: night.tasks });
  });

  app.delete('/api/admin/night/tasks/:id', requireAuth, requireAdmin, (req, res) => {
    night.tasks = night.tasks.filter((t) => t.id !== req.params.id);
    saveNight();
    res.json({ ok: true, tasks: night.tasks });
  });
}

module.exports = { register };
