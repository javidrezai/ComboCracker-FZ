'use strict';

// Setayesh AI — critical-path smoke tests.
//
// A safety net for refactoring: boots the real server on an ephemeral port
// with all state redirected to a throwaway temp dir (so no real account,
// memory, or config is touched), then exercises the flows that must never
// silently break — auth, config gating, memory CRUD, connectors status, and
// the SPA catch-all. Uses only Node's built-in test runner and fetch; no new
// dependencies. Run with: npm test

const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { spawn } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');
const PKG = require(path.join(ROOT, 'package.json'));
const PORT = 3900 + Math.floor(Math.random() * 900);
const BASE = `http://127.0.0.1:${PORT}`;
const ADMIN = { username: 'admin', password: 'setayesh123' };

let child;
let tmp;

function api(p, { method = 'GET', token, body } = {}) {
  const headers = {};
  if (token) headers.Authorization = 'Bearer ' + token;
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  return fetch(BASE + p, { method, headers, body: body !== undefined ? JSON.stringify(body) : undefined });
}

async function waitForHealth(timeoutMs = 20000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const r = await fetch(BASE + '/api/health');
      if (r.ok) return;
    } catch (e) { /* not up yet */ }
    await new Promise((r) => setTimeout(r, 250));
  }
  throw new Error('server did not become healthy in time');
}

before(async () => {
  tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'setayesh-test-'));
  const env = Object.assign({}, process.env, {
    PORT: String(PORT),
    SETAYESH_HOST: '127.0.0.1',
    // Redirect every piece of persistent state into the temp dir.
    SETAYESH_USERS_FILE: path.join(tmp, 'users.json'),
    SETAYESH_CONFIG_FILE: path.join(tmp, 'config'),
    SETAYESH_BACKUP_DIR: path.join(tmp, 'backups'),
    SETAYESH_NIGHT_FILE: path.join(tmp, 'night.json'),
    SETAYESH_BOARD_FILE: path.join(tmp, 'board.json'),
    SETAYESH_MEMORY_FILE: path.join(tmp, 'memory.json'),
    SETAYESH_DEVICES_FILE: path.join(tmp, 'devices.json'),
    SETAYESH_RAG_FILE: path.join(tmp, 'rag.json'),
    SETAYESH_HOMEDEV_FILE: path.join(tmp, 'homedevices.json'),
    SETAYESH_NOTIFY_FILE: path.join(tmp, 'notify.json'),
    SETAYESH_SYNC_FILE: path.join(tmp, 'sync.json'),
  });
  child = spawn(process.execPath, [path.join(ROOT, 'index.js')], { cwd: tmp, env, stdio: 'ignore' });
  child.on('error', (e) => { throw e; });
  await waitForHealth();
});

after(() => {
  try { child && child.kill('SIGKILL'); } catch (e) {}
  try { if (tmp) fs.rmSync(tmp, { recursive: true, force: true }); } catch (e) {}
  // A couple of files have no env override and land next to index.js; tidy them.
  for (const f of ['.setayesh-connectors.json', '.setayesh-sessions.json', '.setayesh-pending-verify.json']) {
    try { fs.rmSync(path.join(ROOT, f), { force: true }); } catch (e) {}
  }
  try { fs.rmSync(path.join(ROOT, 'code-library'), { recursive: true, force: true }); } catch (e) {}
});

test('health reports ok', async () => {
  const d = await (await api('/api/health')).json();
  assert.equal(d.ok, true);
});

test('version matches package.json', async () => {
  const d = await (await api('/api/version')).json();
  assert.equal(d.version, PKG.version);
});

test('login rejects a wrong password with 401', async () => {
  const r = await api('/api/login', { method: 'POST', body: { username: 'admin', password: 'wrong-pass' } });
  assert.equal(r.status, 401);
});

test('login accepts the seeded admin and returns a token', async () => {
  const r = await api('/api/login', { method: 'POST', body: ADMIN });
  assert.equal(r.status, 200);
  const d = await r.json();
  assert.ok(d.token, 'expected a token');
  assert.equal(d.username, 'admin');
});

test('config is gated behind auth', async () => {
  const r = await api('/api/config');
  assert.equal(r.status, 401);
});

test('config returns providers and admin flag for the admin', async () => {
  const token = (await (await api('/api/login', { method: 'POST', body: ADMIN })).json()).token;
  const d = await (await api('/api/config', { token })).json();
  assert.ok(Array.isArray(d.providers) && d.providers.length > 0, 'expected providers list');
  assert.equal(d.isAdmin, true);
});

test('memory add, list, and delete round-trip', async () => {
  const token = (await (await api('/api/login', { method: 'POST', body: ADMIN })).json()).token;
  const text = 'یادداشت تست ' + Date.now();

  const created = await api('/api/memory', { method: 'POST', token, body: { text, kind: 'fact' } });
  assert.equal(created.status, 201);
  const id = (await created.json()).entry.id;
  assert.ok(id, 'expected a new memory id');

  const list1 = await (await api('/api/memory', { token })).json();
  assert.ok(list1.memory.some((m) => m.id === id), 'new memory should appear in the list');

  const del = await api('/api/memory/' + id, { method: 'DELETE', token });
  assert.equal(del.status, 200);

  const list2 = await (await api('/api/memory', { token })).json();
  assert.ok(!list2.memory.some((m) => m.id === id), 'deleted memory should be gone');
});

test('connectors report a clean not-configured Google state', async () => {
  const token = (await (await api('/api/login', { method: 'POST', body: ADMIN })).json()).token;
  const d = await (await api('/api/connectors', { token })).json();
  assert.equal(d.google.configured, false);
  assert.equal(d.google.connected, false);
  assert.match(d.redirectUri, /\/api\/oauth\/google\/callback$/);
});

test('unknown paths fall through to the SPA shell', async () => {
  const r = await api('/some/unknown/deep/link');
  assert.equal(r.status, 200);
  assert.match(r.headers.get('content-type') || '', /text\/html/);
});

test('self-heal incidents endpoint starts empty', async () => {
  const token = (await (await api('/api/login', { method: 'POST', body: ADMIN })).json()).token;
  const d = await (await api('/api/admin/incidents', { token })).json();
  assert.ok(Array.isArray(d.incidents), 'expected an incidents array');
  assert.equal(d.count, 0);
});

test('encrypted backup encrypts and decrypts back to a valid zip', async () => {
  const token = (await (await api('/api/login', { method: 'POST', body: ADMIN })).json()).token;
  const pass = 'test-passphrase-123';
  const made = await api('/api/admin/backups/encrypt', { method: 'POST', token, body: { passphrase: pass } });
  assert.equal(made.status, 200);
  const name = (await made.json()).backup.file;
  assert.match(name, /^backup-.*\.enc$/);

  // The encrypted file lands in the temp backup dir this test configured.
  const encPath = path.join(tmp, 'backups', name);
  assert.ok(fs.existsSync(encPath), 'encrypted backup should exist on disk');
  assert.equal(fs.readFileSync(encPath).slice(0, 5).toString('ascii'), 'STYS1');

  // Decrypt it with the shipped standalone tool (built-ins only) and confirm
  // we get a real zip back.
  const outZip = path.join(tmp, 'restored.zip');
  const dec = require('node:child_process').spawnSync(
    process.execPath, [path.join(ROOT, 'decrypt-backup.js'), encPath, outZip],
    { env: Object.assign({}, process.env, { SETAYESH_BACKUP_PASSPHRASE: pass }), encoding: 'utf8' });
  assert.equal(dec.status, 0, 'decrypt tool should succeed: ' + (dec.stderr || ''));
  assert.ok(fs.existsSync(outZip), 'decrypted zip should exist');
  assert.equal(fs.readFileSync(outZip).slice(0, 2).toString('ascii'), 'PK', 'output should be a zip');

  // Wrong passphrase must fail (authenticated encryption).
  const bad = require('node:child_process').spawnSync(
    process.execPath, [path.join(ROOT, 'decrypt-backup.js'), encPath, path.join(tmp, 'nope.zip')],
    { env: Object.assign({}, process.env, { SETAYESH_BACKUP_PASSPHRASE: 'wrong-pass' }), encoding: 'utf8' });
  assert.notEqual(bad.status, 0, 'wrong passphrase must not decrypt');
});

test('drive upload is refused until Google is connected', async () => {
  const token = (await (await api('/api/login', { method: 'POST', body: ADMIN })).json()).token;
  const r = await api('/api/admin/backups/encrypt-upload', { method: 'POST', token, body: { passphrase: 'test-passphrase-123' } });
  assert.equal(r.status, 400);
  assert.match((await r.json()).error, /گوگل|کانکتور/);
});

test('telegram reports a clean not-configured state', async () => {
  const token = (await (await api('/api/login', { method: 'POST', body: ADMIN })).json()).token;
  const d = await (await api('/api/admin/telegram', { token })).json();
  assert.equal(d.configured, false);
  assert.equal(d.polling, false);
});

test('family board post, list, and delete round-trip', async () => {
  const token = (await (await api('/api/login', { method: 'POST', body: ADMIN })).json()).token;
  const text = 'پیام تابلو تست ' + Date.now();

  const created = await api('/api/board', { method: 'POST', token, body: { text } });
  assert.equal(created.status, 201);
  const id = (await created.json()).message.id;
  assert.ok(id, 'expected a new board message id');

  const list1 = await (await api('/api/board', { token })).json();
  assert.ok(list1.messages.some((m) => m.id === id), 'new message should appear on the board');

  const del = await api('/api/board/' + id, { method: 'DELETE', token });
  assert.equal(del.status, 200);

  const list2 = await (await api('/api/board', { token })).json();
  assert.ok(!list2.messages.some((m) => m.id === id), 'deleted message should be gone');
});

test('code library create, list, read, and delete round-trip', async () => {
  const token = (await (await api('/api/login', { method: 'POST', body: ADMIN })).json()).token;
  const name = 'smoketest-' + Date.now();
  const text = 'print("hello from a smoke test")';

  const made = await api('/api/codelib', { method: 'POST', token, body: { name, text } });
  assert.equal(made.status, 200);
  const libs = (await made.json()).libs;
  assert.ok(libs.some((l) => l.name === name), 'new library should appear in the list');

  const read = await (await api('/api/codelib?name=' + encodeURIComponent(name), { token })).json();
  assert.equal(read.text, text);

  const del = await api('/api/codelib?name=' + encodeURIComponent(name), { method: 'DELETE', token });
  assert.equal(del.status, 200);
  const after = (await del.json()).libs;
  assert.ok(!after.some((l) => l.name === name), 'deleted library should be gone');
});

test('sync: status, exchange refused when off, and settings update', async () => {
  const token = (await (await api('/api/login', { method: 'POST', body: ADMIN })).json()).token;

  const st = await (await api('/api/admin/sync', { token })).json();
  assert.equal(st.enabled, false);
  assert.equal(st.keySet, false);
  assert.ok(Array.isArray(st.myAddresses), 'expected myAddresses');

  // The peer endpoint refuses everyone while sync is off (no shared key).
  const off = await api('/api/sync/exchange', { method: 'POST', body: { payload: 'x' } });
  assert.equal(off.status, 403);

  const upd = await api('/api/admin/sync/settings', { method: 'POST', token, body: { enabled: true, role: 'peer', sharedKey: 'test-shared-key' } });
  assert.equal(upd.status, 200);
  const s2 = await upd.json();
  assert.equal(s2.enabled, true);
  assert.equal(s2.keySet, true);

  // A wrong-key payload now fails to decrypt -> 401, proving the key gates it.
  const bad = await api('/api/sync/exchange', { method: 'POST', body: { payload: 'not-valid-base64-cipher' } });
  assert.equal(bad.status, 401);
});

test('night: read settings, update window, add and delete a task', async () => {
  const token = (await (await api('/api/login', { method: 'POST', body: ADMIN })).json()).token;

  const st = await (await api('/api/admin/night', { token })).json();
  assert.ok(st.settings && typeof st.settings.enabled === 'boolean', 'expected night settings');
  assert.equal(typeof st.inQuietHours, 'boolean');

  const upd = await api('/api/admin/night/settings', { method: 'POST', token, body: { startHour: 1, endHour: 6 } });
  assert.equal(upd.status, 200);
  const s2 = (await upd.json()).settings;
  assert.equal(s2.startHour, 1);
  assert.equal(s2.endHour, 6);

  const add = await api('/api/admin/night/tasks', { method: 'POST', token, body: { text: 'کار شب تست' } });
  assert.equal(add.status, 200);
  const tasks = (await add.json()).tasks;
  const id = tasks[tasks.length - 1].id;
  assert.ok(id, 'expected a task id');

  const del = await api('/api/admin/night/tasks/' + id, { method: 'DELETE', token });
  assert.equal(del.status, 200);
  assert.ok(!(await del.json()).tasks.some((t) => t.id === id), 'task should be gone');
});

test('notifications: clean list, notify-status, and mark-seen work', async () => {
  const token = (await (await api('/api/login', { method: 'POST', body: ADMIN })).json()).token;

  const list = await (await api('/api/notifications', { token })).json();
  assert.ok(Array.isArray(list.items), 'expected an items array');
  assert.equal(typeof list.unseen, 'number');

  const status = await (await api('/api/admin/notify-status', { token })).json();
  assert.equal(status.emailConfigured, false);

  const seen = await api('/api/notifications/seen', { method: 'POST', token });
  assert.equal(seen.status, 200);
  assert.equal((await seen.json()).ok, true);
});

test('home devices: drivers, scan state, empty registry, and step-up guard', async () => {
  const token = (await (await api('/api/login', { method: 'POST', body: ADMIN })).json()).token;

  // Registry starts empty for the admin.
  const list = await (await api('/api/home/devices', { token })).json();
  assert.ok(Array.isArray(list.devices), 'expected a devices array');
  assert.equal(list.admin, true);

  // Drivers are enumerable (Samsung TV, Canon printer, Tuya, Xiaomi, ...).
  const drv = await (await api('/api/home/drivers', { token })).json();
  assert.ok(Array.isArray(drv.drivers) && drv.drivers.length > 0, 'expected a drivers list');
  assert.ok(drv.drivers.every((d) => d.id && d.label), 'each driver has an id and label');

  // Scanner reports an idle state before any scan.
  const scan = await (await api('/api/home/scan', { token })).json();
  assert.equal(scan.running, false);
  assert.ok('found' in scan, 'scan state exposes a found array');

  // The permission matrix and the log are readable.
  const perms = await (await api('/api/home/permissions', { token })).json();
  assert.ok(perms.perms && Array.isArray(perms.grants), 'expected perms and grants');
  const log = await (await api('/api/home/log', { token })).json();
  assert.ok(Array.isArray(log.log), 'expected a log array');

  // Deleting a device is a sensitive action — refused without a step-up token.
  const del = await api('/api/home/devices/anything', { method: 'DELETE', token });
  assert.equal(del.status, 401);
  assert.equal((await del.json()).stepUpRequired, true);
});

test('step-up re-auth issues a token and guards sensitive routes', async () => {
  const token = (await (await api('/api/login', { method: 'POST', body: ADMIN })).json()).token;

  // Wrong password is refused.
  const bad = await api('/api/reauth', { method: 'POST', token, body: { password: 'nope' } });
  assert.equal(bad.status, 401);

  // Correct password mints a short-lived step-up token.
  const good = await api('/api/reauth', { method: 'POST', token, body: { password: ADMIN.password } });
  assert.equal(good.status, 200);
  assert.ok((await good.json()).stepUp, 'expected a step-up token');

  // A step-up-guarded route rejects a normal session with a clear signal.
  const guarded = await api('/api/admin/delete', { method: 'POST', token, body: { username: 'nobody' } });
  assert.equal(guarded.status, 401);
  assert.equal((await guarded.json()).stepUpRequired, true);
});

test('plugins endpoint reports a clean list and reloads', async () => {
  const token = (await (await api('/api/login', { method: 'POST', body: ADMIN })).json()).token;

  const d = await (await api('/api/plugins', { token })).json();
  assert.ok(Array.isArray(d.plugins), 'expected a plugins array');
  assert.equal(d.version, PKG.version);

  const reloaded = await api('/api/plugins/reload', { method: 'POST', token });
  assert.equal(reloaded.status, 200);
  assert.ok(Array.isArray((await reloaded.json()).plugins), 'reload should return a plugins array');

  const missing = await api('/api/plugin/run', { method: 'POST', token, body: { id: 'does-not-exist', input: 'x' } });
  assert.equal(missing.status, 404);
});

test('utility tool routes: interfaces list and hashing work', async () => {
  const token = (await (await api('/api/login', { method: 'POST', body: ADMIN })).json()).token;

  const ifaces = await (await api('/api/tool/interfaces', { token })).json();
  assert.ok(Array.isArray(ifaces.interfaces), 'expected an interfaces array');

  const hashed = await api('/api/tool/hash', { method: 'POST', token, body: { value: 'setayesh', action: 'hash' } });
  assert.equal(hashed.status, 200);
  const d = await hashed.json();
  assert.ok(d.hashes && typeof d.hashes === 'object', 'expected a hashes object');
  assert.ok(Object.keys(d.hashes).length > 0, 'expected at least one hash algorithm');
});

test('local RAG indexes a memory and finds it by search', async () => {
  const token = (await (await api('/api/login', { method: 'POST', body: ADMIN })).json()).token;
  const needle = 'قرار دندانپزشکی سه‌شنبه با دکتر رضایی ' + Date.now();
  const created = await api('/api/memory', { method: 'POST', token, body: { text: needle, kind: 'deadline' } });
  assert.equal(created.status, 201);

  const res = await (await api('/api/rag/search?q=' + encodeURIComponent('دندانپزشک دکتر') + '&limit=5', { token })).json();
  assert.ok(Array.isArray(res.results) && res.results.length > 0, 'expected a RAG hit');
  assert.match(res.results[0].snippet, /دندانپزشک/);
  assert.ok(res.results[0].score > 0, 'expected a positive relevance score');
});
