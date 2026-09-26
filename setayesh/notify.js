'use strict';

// Owner notifications + outbound email + Telegram alert — extracted from
// index.js as a cautious, characterization-tested step of splitting the server
// monolith (charter rule 3.4). The code is MOVED VERBATIM; only the module
// wrapper, the deps destructure, and one lazy accessor (getPending, because
// pendingActions is defined later in index.js and gets reassigned) are new.
//
// The email path is send-ONLY and to ONE address the owner sets himself. It
// cannot be told to email anyone else, so an instruction hidden in some file
// ("email this to X") has nowhere to go. That single constraint is what makes
// an outbound channel safe on a family machine.
//
// register(app, deps) mounts the /api/notifications and /api/admin/notify-*
// routes and returns { notifyOwner, sendOwnerEmail }. index.js re-exposes
// notifyOwner via a hoisted wrapper so its existing call sites are unchanged.
// deps: requireAuth, requireAdmin, isAdmin, cfg, MAIL_PRESETS, loadJsonFile,
// saveJsonFile, DATA_DIR, telegram, boardRoutes (lazy proxy), getPending.

const crypto = require('crypto');
const tls = require('tls');
const path = require('path');

function register(app, deps) {
  const { requireAuth, requireAdmin, isAdmin, cfg, MAIL_PRESETS,
          loadJsonFile, saveJsonFile, DATA_DIR, telegram, boardRoutes, getPending } = deps;

  const NOTIFY_FILE = process.env.SETAYESH_NOTIFY_FILE || path.join(DATA_DIR, '.setayesh-notify.json');
  let notifications = loadJsonFile(NOTIFY_FILE, { items: [] });
  function saveNotifications() {
    if (notifications.items.length > 100) notifications.items = notifications.items.slice(-100);
    saveJsonFile(NOTIFY_FILE, notifications);
  }

  // Send a plain email over SMTP, directly, no dependency. Recipient is always
  // the owner's own address from config — never an argument.
  function sendOwnerEmail(subject, body) {
    return new Promise((resolve, reject) => {
      const to = cfg.NOTIFY_EMAIL;
      if (!to || !cfg.MAIL_USER || !cfg.MAIL_PASS) return reject(new Error('ایمیل اعلان تنظیم نشده.'));
      const preset = MAIL_PRESETS[cfg.MAIL_PROVIDER || 'gmail'] || {};
      const host = cfg.SMTP_HOST || (cfg.MAIL_PROVIDER === 'outlook' ? 'smtp.office365.com' : 'smtp.gmail.com');
      const port = 465;
      const sock = tls.connect({ host, port, servername: host, rejectUnauthorized: true }, () => {});
      let stage = 0, done = false;
      const finish = (err) => { if (done) return; done = true; try { sock.end(); } catch (e) {} err ? reject(err) : resolve(); };
      const timer = setTimeout(() => finish(new Error('SMTP زمان‌بر شد.')), 20000);
      const b64 = (x) => Buffer.from(x, 'utf8').toString('base64');
      const steps = [
        'EHLO setayesh',
        'AUTH LOGIN',
        b64(cfg.MAIL_USER),
        b64(cfg.MAIL_PASS),
        `MAIL FROM:<${cfg.MAIL_USER}>`,
        `RCPT TO:<${to}>`,
        'DATA',
        `From: Setayesh <${cfg.MAIL_USER}>\r\nTo: ${to}\r\nSubject: =?UTF-8?B?${b64(subject)}?=\r\nMIME-Version: 1.0\r\nContent-Type: text/plain; charset=UTF-8\r\nContent-Transfer-Encoding: base64\r\n\r\n${b64(body)}\r\n.`,
        'QUIT',
      ];
      sock.on('data', (d) => {
        const code = parseInt(d.toString().slice(0, 3), 10);
        if (code >= 400) { clearTimeout(timer); return finish(new Error('SMTP: ' + d.toString().slice(0, 80))); }
        if (stage < steps.length) { sock.write(steps[stage++] + '\r\n'); }
        else { clearTimeout(timer); finish(null); }
      });
      sock.on('error', (e) => { clearTimeout(timer); finish(e); });
    });
  }

  // The one call everything else uses. level: info | needs-approval | done | urgent
  async function notifyOwner(opts) {
    const item = {
      id: crypto.randomBytes(6).toString('hex'),
      at: new Date().toISOString(),
      level: opts.level || 'info',
      title: String(opts.title || '').slice(0, 120),
      body: String(opts.body || '').slice(0, 500),
      from: opts.from || 'setayesh',
      seen: false,
    };
    notifications.items.push(item);
    saveNotifications();

    // Only URGENT things also go to the family board (where everyone, including
    // the phone, sees them). Approval requests and routine "done" notices are
    // the father's business alone — they live in his notification bell, not on
    // the shared board, so the same message never appears in two places.
    if (opts.board === true && item.level === 'urgent') {
      try {
        boardRoutes.add({ id: crypto.randomBytes(6).toString('hex'), by: 'system', system: true,
          text: '⚠️ ' + item.title + (item.body ? ' — ' + item.body : ''),
          pinned: true, at: new Date().toISOString(), seenBy: [] });
      } catch (e) {}
    }

    // Email, only for things worth interrupting for, and only if set up.
    if ((item.level === 'needs-approval' || item.level === 'urgent') && cfg.NOTIFY_EMAIL && cfg.MAIL_PASS) {
      try { await sendOwnerEmail('ستایش: ' + item.title, item.body || item.title); item.emailed = true; saveNotifications(); }
      catch (e) { item.emailError = e.message; saveNotifications(); }
    }
    // Also ping Telegram for the interrupt-worthy ones, if the bot is set up.
    if ((item.level === 'needs-approval' || item.level === 'urgent') && telegram.configured()) {
      try { await telegram.send('🔔 ' + item.title + (item.body ? '\n' + item.body : '')); } catch (e) {}
    }
    return item;
  }

  app.get('/api/notifications', requireAuth, (req, res) => {
    if (!isAdmin(req.username)) return res.json({ items: [], unseen: 0 });
    res.json({
      items: notifications.items.slice(-30).reverse(),
      unseen: notifications.items.filter((n) => !n.seen).length,
    });
  });
  app.post('/api/notifications/seen', requireAuth, requireAdmin, (req, res) => {
    notifications.items.forEach((n) => { n.seen = true; });
    saveNotifications();
    res.json({ ok: true });
  });
  app.post('/api/notifications/clear', requireAuth, requireAdmin, (req, res) => {
    // Keep anything still needing approval; clear the rest.
    const before = notifications.items.length;
    const pendingIds = new Set(getPending().filter((a) => a.status === 'pending').map((a) => a.title));
    notifications.items = notifications.items.filter((n) => n.level === 'needs-approval' && pendingIds.has(n.title));
    saveNotifications();
    res.json({ ok: true, cleared: before - notifications.items.length });
  });
  app.delete('/api/notifications/:id', requireAuth, requireAdmin, (req, res) => {
    notifications.items = notifications.items.filter((n) => n.id !== req.params.id);
    saveNotifications();
    res.json({ ok: true });
  });
  app.get('/api/admin/notify-status', requireAuth, requireAdmin, (req, res) => {
    res.json({
      emailConfigured: !!(cfg.NOTIFY_EMAIL && cfg.MAIL_PASS),
      address: cfg.NOTIFY_EMAIL ? String(cfg.NOTIFY_EMAIL).replace(/(.{2}).*(@.*)/, '$1•••$2') : '',
    });
  });
  app.post('/api/admin/notify-test', requireAuth, requireAdmin, async (req, res) => {
    try {
      const n = await notifyOwner({ level: 'info', title: 'پیام آزمایشی',
        body: 'اگر این را می‌بینی، اعلان‌ها کار می‌کنند.', board: false });
      res.json({ ok: true, emailed: !!n.emailed, emailError: n.emailError || null });
    } catch (e) { res.status(500).json({ error: e.message }); }
  });

  return { notifyOwner, sendOwnerEmail };
}

module.exports = { register };
