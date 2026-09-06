'use strict';

// Step-up re-authentication — extracted from index.js as another cautious step
// of splitting the server monolith (charter rule 3.4). Behavior is unchanged.
//
// Being signed in is enough for ordinary use. It is not enough to delete an
// account, change who may control the television, or remove a device: those
// are the actions someone would take with a phone that was left unlocked on a
// table. So they ask for the password again, once, and the answer is good for
// five minutes of work rather than for the whole session.
//
// The proof is a separate short-lived token bound to the session that earned
// it. A stolen session token alone cannot perform any of these actions.
//
// register(app, deps) mounts POST /api/reauth and returns { requireStepUp } so
// index.js can guard the sensitive routes. It is registered EARLY (before those
// routes are defined) because Express evaluates route middleware at
// registration time, so requireStepUp must already be a value by then.
// deps: requireAuth, loginLimiter, users, bcrypt, DUMMY_HASH.

const crypto = require('crypto');

function register(app, deps) {
  const { requireAuth, loginLimiter, users, bcrypt, DUMMY_HASH } = deps;

  const STEPUP_TTL_MS = 5 * 60 * 1000;
  const stepUps = new Map();               // step-up token -> { session, username, expires }

  function issueStepUp(sessionToken, username) {
    const t = crypto.randomBytes(24).toString('hex');
    stepUps.set(t, { session: sessionToken, username, expires: Date.now() + STEPUP_TTL_MS });
    return t;
  }

  setInterval(() => {
    const now = Date.now();
    for (const [t, v] of stepUps) if (v.expires < now) stepUps.delete(t);
  }, 60 * 1000).unref();

  function requireStepUp(req, res, next) {
    const t = String(req.headers['x-stepup'] || '');
    const v = t ? stepUps.get(t) : null;
    if (!v || v.expires < Date.now() || v.session !== req.token || v.username !== req.username) {
      return res.status(401).json({ error: 'برای این کار رمز را دوباره وارد کنید.', stepUpRequired: true });
    }
    next();
  }

  app.post('/api/reauth', requireAuth, loginLimiter, async (req, res) => {
    const password = String((req.body || {}).password || '');
    const stored = users.get(req.username);
    const ok = stored ? await bcrypt.compare(password, stored) : await bcrypt.compare(password, DUMMY_HASH);
    if (!ok) return res.status(401).json({ error: 'رمز درست نیست.' });
    res.json({ stepUp: issueStepUp(req.token, req.username), validForMinutes: STEPUP_TTL_MS / 60000 });
  });

  return { requireStepUp };
}

module.exports = { register };
