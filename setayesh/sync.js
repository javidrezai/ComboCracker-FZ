'use strict';

// Sync between the family's own computers — extracted from index.js as a
// cautious, characterization-tested step of splitting the monolith (charter
// rule 3.4). The code is MOVED VERBATIM except for a few accessor calls: it
// registers late (after board/memory/devices/knowledge exist) and receives
// them from index.js. `knowledge` and `devices` are reassigned in index.js, so
// they are reached through getters/setters (a captured reference would go
// stale); `memory` and `boardRoutes` are stable references passed directly.
//
// Several machines (the mini-PC at home as hub, laptops as peers) share one
// picture: board, memory, devices, knowledge. So if the hub is off, a laptop
// still has what you need.
//
// Honest scope of the encryption: data is encrypted IN TRANSIT with a shared
// key only the owner sets, so anyone sniffing the network sees an opaque blob.
// It is NOT "only Setayesh can read it" at rest — the key lives on each
// machine, so physical access to a computer still means access.
//
// Talks only to peers the owner lists, over their Tailscale/LAN addresses.
// Never reaches anything outside that list.
//
// register(app, deps). deps: requireAuth, requireAdmin, loadJsonFile,
// saveJsonFile, DATA_DIR, fetchWithTimeout, localLanIps, boardRoutes, memory,
// saveMemory, saveDevices, saveKnowledge, getDevices, getKnowledge,
// setKnowledge.

const crypto = require('crypto');
const path = require('path');

function register(app, deps) {
  const { requireAuth, requireAdmin, loadJsonFile, saveJsonFile, DATA_DIR,
          fetchWithTimeout, localLanIps, boardRoutes, memory, saveMemory,
          saveDevices, saveKnowledge, getDevices, getKnowledge, setKnowledge } = deps;

  const SYNC_FILE = process.env.SETAYESH_SYNC_FILE || path.join(DATA_DIR, '.setayesh-sync.json');
  let sync = Object.assign({
    enabled: false,
    role: 'peer',            // 'hub' or 'peer'
    sharedKey: '',           // set once by the owner, same on every machine
    hubUrl: '',              // peers point here, e.g. http://minipc:3000
    peers: [],               // hub lists its peers' urls
    what: { board: true, memory: true, devices: true, knowledge: true },
    lastSync: null,
    lastError: null,
  }, loadJsonFile(SYNC_FILE, {}));
  function saveSync() { saveJsonFile(SYNC_FILE, sync); }

  // AES-256-GCM with a key derived from the shared secret. The same secret on
  // two machines produces the same key, so they can read each other's payloads
  // and nobody in between can.
  function syncKey() {
    return crypto.createHash('sha256').update('setayesh-sync:' + String(sync.sharedKey)).digest();
  }
  function syncEncrypt(obj) {
    const iv = crypto.randomBytes(12);
    const c = crypto.createCipheriv('aes-256-gcm', syncKey(), iv);
    const data = Buffer.concat([c.update(Buffer.from(JSON.stringify(obj), 'utf8')), c.final()]);
    return Buffer.concat([iv, c.getAuthTag(), data]).toString('base64');
  }
  function syncDecrypt(b64) {
    const buf = Buffer.from(b64, 'base64');
    const iv = buf.slice(0, 12), tag = buf.slice(12, 28), data = buf.slice(28);
    const d = crypto.createDecipheriv('aes-256-gcm', syncKey(), iv);
    d.setAuthTag(tag);
    return JSON.parse(Buffer.concat([d.update(data), d.final()]).toString('utf8'));
  }

  // The shared state this machine currently holds.
  function syncSnapshot() {
    const snap = {};
    if (sync.what.board) snap.board = boardRoutes.getBoard();
    if (sync.what.memory) snap.memory = memory;
    if (sync.what.devices) snap.devices = getDevices();
    if (sync.what.knowledge) snap.knowledge = getKnowledge();
    return snap;
  }

  // Merge an incoming snapshot into ours. Union by id, newest wins — so nothing
  // a machine had is lost, and the two converge.
  function mergeSnapshot(incoming) {
    let changed = false;
    const mergeById = (mine, theirs, timeField) => {
      const byId = {};
      for (const m of mine) byId[m.id] = m;
      for (const t of theirs) {
        const cur = byId[t.id];
        if (!cur) { byId[t.id] = t; changed = true; }
        else if (timeField && new Date(t[timeField] || 0) > new Date(cur[timeField] || 0)) { byId[t.id] = t; changed = true; }
      }
      return Object.values(byId);
    };
    if (sync.what.board && incoming.board) {
      boardRoutes.setBoard(mergeById(boardRoutes.getBoard(), incoming.board, 'at').sort((a, b) => new Date(a.at) - new Date(b.at)));
    }
    if (sync.what.knowledge && incoming.knowledge) {
      setKnowledge(mergeById(getKnowledge(), incoming.knowledge, 'createdAt'));
      saveKnowledge && saveKnowledge();
    }
    if (sync.what.devices && incoming.devices) {
      const dev = getDevices();
      for (const [id, d] of Object.entries(incoming.devices)) {
        if (!dev[id] || new Date(d.lastSeen || 0) > new Date(dev[id].lastSeen || 0)) { dev[id] = d; changed = true; }
      }
      saveDevices();
    }
    if (sync.what.memory && incoming.memory) {
      for (const [user, list] of Object.entries(incoming.memory)) {
        const mine = memory[user] || [];
        memory[user] = mergeById(mine, list, 'createdAt');
        changed = true;
      }
      saveMemory();
    }
    return changed;
  }

  // Peer endpoint: another of our machines posts its encrypted snapshot; we
  // merge and return ours, encrypted. The shared key is the authentication —
  // a wrong key fails to decrypt, so an outsider cannot talk to us.
  app.post('/api/sync/exchange', (req, res) => {
    if (!sync.enabled || !sync.sharedKey) return res.status(403).json({ error: 'sync off' });
    const payload = (req.body || {}).payload;
    if (!payload) return res.status(400).json({ error: 'no payload' });
    let incoming;
    try { incoming = syncDecrypt(payload); }
    catch (e) { return res.status(401).json({ error: 'bad key' }); }   // wrong shared key
    try {
      mergeSnapshot(incoming);
      sync.lastSync = new Date().toISOString(); sync.lastError = null; saveSync();
      res.json({ ok: true, payload: syncEncrypt(syncSnapshot()) });
    } catch (e) { res.status(500).json({ error: e.message }); }
  });

  async function syncWithPeer(url) {
    const body = JSON.stringify({ payload: syncEncrypt(syncSnapshot()) });
    const r = await fetchWithTimeout(url.replace(/\/$/, '') + '/api/sync/exchange', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body,
    });
    if (!r.ok) throw new Error('peer ' + r.status);
    const data = await r.json();
    if (data.payload) mergeSnapshot(syncDecrypt(data.payload));
  }

  async function runSync() {
    if (!sync.enabled || !sync.sharedKey) return;
    const targets = sync.role === 'hub' ? (sync.peers || []) : (sync.hubUrl ? [sync.hubUrl] : []);
    if (!targets.length) return;
    let okCount = 0, lastErr = null;
    for (const url of targets) {
      try { await syncWithPeer(url); okCount++; }
      catch (e) { lastErr = url + ': ' + e.message; }
    }
    sync.lastSync = new Date().toISOString();
    sync.lastError = okCount ? null : lastErr;
    saveSync();
  }
  setInterval(runSync, 90000).unref();   // every 90s; hub-off just means peers wait

  app.get('/api/admin/sync', requireAuth, requireAdmin, (req, res) => {
    res.json({
      enabled: sync.enabled, role: sync.role,
      hubUrl: sync.hubUrl, peers: sync.peers, what: sync.what,
      keySet: !!sync.sharedKey,
      lastSync: sync.lastSync, lastError: sync.lastError,
      myAddresses: localLanIps(),
    });
  });
  app.post('/api/admin/sync/settings', requireAuth, requireAdmin, (req, res) => {
    const b = req.body || {};
    if (typeof b.enabled === 'boolean') sync.enabled = b.enabled;
    if (b.role === 'hub' || b.role === 'peer') sync.role = b.role;
    if (typeof b.hubUrl === 'string') sync.hubUrl = b.hubUrl.trim();
    if (Array.isArray(b.peers)) sync.peers = b.peers.map((p) => String(p).trim()).filter(Boolean).slice(0, 10);
    if (typeof b.sharedKey === 'string' && b.sharedKey.length >= 8) sync.sharedKey = b.sharedKey;
    if (b.what && typeof b.what === 'object') {
      for (const k of ['board', 'memory', 'devices', 'knowledge']) if (typeof b.what[k] === 'boolean') sync.what[k] = b.what[k];
    }
    saveSync();
    res.json({ ok: true, enabled: sync.enabled, role: sync.role, keySet: !!sync.sharedKey });
  });
  app.post('/api/admin/sync/now', requireAuth, requireAdmin, async (req, res) => {
    if (!sync.enabled) return res.status(400).json({ error: 'همگام‌سازی خاموش است.' });
    if (!sync.sharedKey) return res.status(400).json({ error: 'کلید مشترک تنظیم نشده.' });
    try { await runSync(); res.json({ ok: true, lastSync: sync.lastSync, lastError: sync.lastError }); }
    catch (e) { res.status(500).json({ error: e.message }); }
  });
}

module.exports = { register };
