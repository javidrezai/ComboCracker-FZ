'use strict';

// Utility tool routes — extracted from index.js as another cautious step of
// splitting the server monolith (charter rule 3.4). Behavior is unchanged.
//
// These are the self-contained tools that only wrap toolkit.js (network scan,
// port scan, web scan, hashing) or do a direct read-only TLS handshake (SSL
// inspector) plus the QR helper and the hardware stubs. The image generator
// (/api/tool/genimage) is deliberately NOT here: it is woven into the Gemini
// engine internals and stays in index.js.
//
// register(app, deps) mounts the routes. deps: requireAuth, toolLimiter,
// toolkit, tls, localLanIps, PORT.

function register(app, deps) {
  const { requireAuth, toolLimiter, toolkit, tls, localLanIps, PORT } = deps;

  app.get('/api/tool/interfaces', requireAuth, (req, res) => {
    res.json({ interfaces: toolkit.localInterfaces(), suggested: toolkit.suggestedSubnet() });
  });

  app.post('/api/tool/netscan', requireAuth, toolLimiter, async (req, res) => {
    try {
      const cidr = (req.body && req.body.cidr) || toolkit.suggestedSubnet();
      const result = await toolkit.networkScan(cidr, { timeout: req.body && req.body.timeout });
      res.json(result);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  });

  app.post('/api/tool/ports', requireAuth, toolLimiter, async (req, res) => {
    try {
      const host = req.body && req.body.host;
      if (!host) return res.status(400).json({ error: 'میزبان را وارد کنید' });
      const result = await toolkit.portScan(host, { ports: req.body.ports, timeout: req.body.timeout });
      res.json(result);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  });

  app.post('/api/tool/webscan', requireAuth, toolLimiter, async (req, res) => {
    try {
      const url = req.body && req.body.url;
      if (!url) return res.status(400).json({ error: 'آدرس سایت را وارد کنید' });
      const result = await toolkit.webScan(url);
      res.json(result);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  });

  // SSL/TLS certificate inspector — read-only TLS handshake to your own site,
  // reports issuer, validity window, and days until expiry. Defensive only.
  app.post('/api/tool/ssl', requireAuth, toolLimiter, (req, res) => {
    let host = ((req.body && req.body.host) || '').trim()
      .replace(/^https?:\/\//i, '').replace(/\/.*$/, '').split(':')[0];
    if (!host) return res.status(400).json({ error: 'دامنه را وارد کنید' });
    if (!/^[a-z0-9.-]+$/i.test(host) || host.length > 253) {
      return res.status(400).json({ error: 'دامنه نامعتبر است' });
    }
    let done = false;
    const finish = (code, body) => { if (done) return; done = true; try { socket.destroy(); } catch (e) {} res.status(code).json(body); };
    const socket = tls.connect({ host, port: 443, servername: host, timeout: 9000, rejectUnauthorized: false }, () => {
      const cert = socket.getPeerCertificate();
      if (!cert || !cert.valid_to) return finish(502, { error: 'گواهی دریافت نشد' });
      const now = Date.now();
      const to = new Date(cert.valid_to).getTime();
      const daysLeft = Math.floor((to - now) / 86400000);
      finish(200, {
        host,
        subject: (cert.subject && cert.subject.CN) || host,
        issuer: (cert.issuer && (cert.issuer.O || cert.issuer.CN)) || '—',
        validFrom: cert.valid_from,
        validTo: cert.valid_to,
        daysLeft,
        authorized: !!socket.authorized,
        authError: socket.authorized ? '' : String(socket.authorizationError || ''),
      });
    });
    socket.on('timeout', () => finish(504, { error: 'زمان اتصال تمام شد' }));
    socket.on('error', (e) => finish(502, { error: 'اتصال ناموفق: ' + (e.code || e.message) }));
  });

  app.post('/api/tool/hash', requireAuth, (req, res) => {
    // Accept `value` (what the UI sends) or `text` (what the native tool-use
    // path sends) so both callers work, and default to hashing when no action
    // is given rather than rejecting the request.
    const body = req.body || {};
    const value = typeof body.value === 'string' ? body.value
                : typeof body.text === 'string' ? body.text : null;
    const action = body.action || 'hash';
    const algos = body.algos;
    if (value === null) return res.status(400).json({ error: 'value required' });
    if (action === 'hash') return res.json({ hashes: toolkit.hashString(value, algos) });
    if (action === 'identify') return res.json(toolkit.identifyHash(value));
    if (action === 'strength') return res.json(toolkit.passwordStrength(value));
    return res.status(400).json({ error: 'unknown action' });
  });

  app.get('/api/tool/qr', requireAuth, async (req, res) => {
    const host = (localLanIps()[0]) || 'localhost';
    const url = `http://${host}:${PORT}`;
    try { res.json(await toolkit.qrForUrl(url)); }
    catch (e) { res.json({ url, svg: null }); }
  });

  app.get('/api/tool/hardware', requireAuth, (req, res) => {
    res.json({
      serial: toolkit.listSerialPortsStub(),
      subghz: toolkit.simulateSubGhz(),
      rfid: toolkit.simulateRfid(),
    });
  });
}

module.exports = { register };
