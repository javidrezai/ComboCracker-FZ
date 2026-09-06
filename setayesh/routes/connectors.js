'use strict';

// Connectors: Google (Gmail + Calendar) — extracted from index.js as the first
// step of splitting the server monolith into routes/ modules (charter rule 3.4).
// Behavior is unchanged: this is the same code, now registered via register().
//
// OAuth2 web flow. The owner registers a Google OAuth client and the one
// redirect URI shown by /api/connectors, connects once, and from then on the
// assistant can read/send mail and add calendar events via the AI tools too.

const crypto = require('crypto');

function register(app, deps) {
  const { requireAuth, requireAdmin, connectors, isAdmin } = deps;

  const _pendingOAuth = new Map();   // state -> { redirectUri, exp }
  const oauthRedirectUri = (req) => `${req.protocol}://${req.get('host')}/api/oauth/google/callback`;
  function connectorsPage(title, msg, ok) {
    return `<!doctype html><meta charset="utf8"><meta name="viewport" content="width=device-width,initial-scale=1">` +
      `<body style="font-family:system-ui;background:#0a0d1e;color:#e8ecf7;display:flex;align-items:center;justify-content:center;height:100vh;margin:0">` +
      `<div style="text-align:center;max-width:420px;padding:24px"><div style="font-size:44px">${ok ? '✅' : '⚠️'}</div>` +
      `<h2>${title}</h2><p style="color:#8ea0c8">${String(msg).replace(/[<>]/g, '')}</p>` +
      `<p><a href="/" style="color:#7b5cff">بازگشت به ستایش</a></p></div></body>`;
  }

  app.get('/api/connectors', requireAuth, (req, res) => {
    res.json({ google: connectors.status(), redirectUri: oauthRedirectUri(req), isAdmin: isAdmin(req.username) });
  });

  app.get('/api/admin/connectors/google/auth-url', requireAuth, requireAdmin, (req, res) => {
    if (!connectors.configured()) return res.status(400).json({ error: 'ابتدا Client ID و Secret گوگل را در تنظیمات ذخیره کن.' });
    const stateTok = crypto.randomBytes(16).toString('hex');
    const redirectUri = oauthRedirectUri(req);
    _pendingOAuth.set(stateTok, { redirectUri, exp: Date.now() + 10 * 60000 });
    res.json({ url: connectors.authUrl(redirectUri, stateTok), redirectUri });
  });

  app.get('/api/oauth/google/callback', async (req, res) => {
    const { code, state, error } = req.query;
    if (error) return res.status(400).send(connectorsPage('اتصال لغو شد', String(error).slice(0, 120), false));
    const pend = state && _pendingOAuth.get(String(state));
    if (!pend || pend.exp < Date.now()) return res.status(400).send(connectorsPage('درخواست نامعتبر یا منقضی', 'دوباره از پنل کانکتورها تلاش کن.', false));
    _pendingOAuth.delete(String(state));
    try {
      await connectors.exchangeCode(String(code || ''), pend.redirectUri);
      res.send(connectorsPage('گوگل متصل شد', 'حالا ستایش می‌تواند ایمیل بخواند و بفرستد و در تقویم قرار ثبت کند.', true));
    } catch (e) {
      res.status(502).send(connectorsPage('اتصال ناموفق', e.message, false));
    }
  });

  app.post('/api/admin/connectors/google/disconnect', requireAuth, requireAdmin, (req, res) => {
    connectors.disconnect();
    res.json({ ok: true });
  });

  // Direct actions (admin) — these also back the AI tools, so the feature works
  // regardless of which engine is active.
  app.get('/api/connectors/gmail', requireAuth, requireAdmin, async (req, res) => {
    try { res.json(await connectors.gmailList(req.query.limit)); } catch (e) { res.status(502).json({ error: e.message }); }
  });
  app.get('/api/connectors/gmail/:id', requireAuth, requireAdmin, async (req, res) => {
    try { res.json(await connectors.gmailGet(req.params.id)); } catch (e) { res.status(502).json({ error: e.message }); }
  });
  app.post('/api/connectors/gmail/send', requireAuth, requireAdmin, async (req, res) => {
    try { res.json(await connectors.gmailSend(req.body || {})); } catch (e) { res.status(502).json({ error: e.message }); }
  });
  app.get('/api/connectors/calendar', requireAuth, requireAdmin, async (req, res) => {
    try { res.json(await connectors.calendarList(req.query.limit)); } catch (e) { res.status(502).json({ error: e.message }); }
  });
  app.post('/api/connectors/calendar/add', requireAuth, requireAdmin, async (req, res) => {
    try { res.json(await connectors.calendarAdd(req.body || {})); } catch (e) { res.status(502).json({ error: e.message }); }
  });
}

module.exports = { register };
