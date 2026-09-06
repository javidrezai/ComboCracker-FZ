'use strict';

// Device routes (screen/layout registration, per-device prefs, admin list +
// revoke) — extracted from index.js (charter rule 3.4). The route handlers and
// the two pure helpers (classifyDevice, deviceLabel, used only here) are moved
// verbatim EXCEPT that the shared `devices` map is reached through getDevices()
// on every access: index.js reassigns `devices` when it trims to the 60 most
// recent, so a captured reference would go stale. The state (`devices`,
// saveDevices) and the security-critical trusted-device LOGIN flow stay in
// index.js, untouched — only these endpoints move.
//
// register(app, deps). deps: requireAuth, requireAdmin, getDevices, saveDevices.

function register(app, deps) {
  const { requireAuth, requireAdmin, getDevices, saveDevices } = deps;

  // Work out a friendly device class from screen size + touch, so the UI can
  // pick a layout without guessing from the user agent alone (which lies).
  function classifyDevice(d) {
    const w = Number(d.screenW) || 0;
    const touch = !!d.touch;
    if (touch && w <= 500) return 'phone';
    if (touch && w <= 1100) return 'tablet';
    if (touch) return 'touch-desktop';
    return 'desktop';
  }

  function deviceLabel(d, kind) {
    const os = String(d.platform || '').slice(0, 24) || 'دستگاه';
    const map = { phone: 'موبایل', tablet: 'تبلت', 'touch-desktop': 'لپ‌تاپ لمسی', desktop: 'کامپیوتر' };
    return (map[kind] || 'دستگاه') + ' · ' + os;
  }

  app.post('/api/device', requireAuth, (req, res) => {
    const b = req.body || {};
    const id = String(b.id || '').replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 40);
    if (!id) return res.status(400).json({ error: 'device id required' });

    const info = {
      screenW: Math.max(0, Math.min(10000, Number(b.screenW) || 0)),
      screenH: Math.max(0, Math.min(10000, Number(b.screenH) || 0)),
      touch: !!b.touch,
      platform: String(b.platform || '').slice(0, 40),
      browser: String(b.browser || '').slice(0, 40),
      lang: String(b.lang || '').slice(0, 12),
      tz: String(b.tz || '').slice(0, 48),
    };
    const kind = classifyDevice(info);
    const devices = getDevices();
    const prev = devices[id] || {};
    devices[id] = Object.assign({}, prev, info, {
      kind,
      label: prev.label || deviceLabel(info, kind),
      user: req.username,
      firstSeen: prev.firstSeen || new Date().toISOString(),
      lastSeen: new Date().toISOString(),
      visits: (prev.visits || 0) + 1,
      prefs: prev.prefs || {},
    });
    saveDevices();

    const cur = getDevices()[id] || devices[id];
    res.json({
      kind,
      label: cur.label,
      known: !!prev.firstSeen,
      prefs: cur.prefs,
      // What the UI should do for this device, decided server-side so the rule
      // lives in one place.
      layout: {
        compact: kind === 'phone',
        bottomSheet: kind === 'phone' || kind === 'tablet',
        effects: kind === 'desktop',
        fontScale: kind === 'phone' ? 1.02 : 1,
      },
    });
  });

  // Remember a per-device preference (chosen engine, mode, speech on/off...).
  app.post('/api/device/prefs', requireAuth, (req, res) => {
    const id = String((req.body || {}).id || '').replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 40);
    const devices = getDevices();
    if (!id || !devices[id]) return res.status(404).json({ error: 'device not registered' });
    const prefs = (req.body || {}).prefs || {};
    const clean = {};
    for (const [k, v] of Object.entries(prefs)) {
      if (typeof k !== 'string' || k.length > 32) continue;
      if (typeof v === 'string' && v.length > 120) continue;
      if (['string', 'number', 'boolean'].includes(typeof v)) clean[k] = v;
    }
    devices[id].prefs = Object.assign({}, devices[id].prefs, clean);
    devices[id].lastSeen = new Date().toISOString();
    saveDevices();
    res.json({ ok: true, prefs: devices[id].prefs });
  });

  app.get('/api/admin/devices', requireAuth, requireAdmin, (req, res) => {
    const list = Object.entries(getDevices()).map(([id, d]) => ({
      id, label: d.label, kind: d.kind, user: d.user,
      screen: (d.screenW || '?') + '×' + (d.screenH || '?'),
      browser: d.browser, platform: d.platform, tz: d.tz,
      firstSeen: d.firstSeen, lastSeen: d.lastSeen, visits: d.visits,
    })).sort((a, b) => new Date(b.lastSeen) - new Date(a.lastSeen));
    res.json({ devices: list });
  });

  app.delete('/api/admin/devices/:id', requireAuth, requireAdmin, (req, res) => {
    const id = String(req.params.id || '');
    const devices = getDevices();
    if (!devices[id]) return res.status(404).json({ error: 'پیدا نشد' });
    // Deleting the record also destroys its stored trust hash, so that device
    // can no longer sign itself in — this is the revoke button.
    delete devices[id];
    saveDevices();
    res.json({ ok: true });
  });
}

module.exports = { register };
