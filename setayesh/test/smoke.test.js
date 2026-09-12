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
    SETAYESH_CHATS_DIR: path.join(tmp, 'chats'),
    SETAYESH_HEALTH_FILE: path.join(tmp, 'engine-health.json'),
    // Keep any generated TLS material inside the temp dir, never the repo.
    SETAYESH_TLS_CERT: path.join(tmp, 'tls-cert.pem'),
    SETAYESH_TLS_KEY: path.join(tmp, 'tls-key.pem'),
  });
  child = spawn(process.execPath, [path.join(ROOT, 'index.js')], { cwd: tmp, env, stdio: 'ignore' });
  child.on('error', (e) => { throw e; });
  await waitForHealth();
});

after(() => {
  try { child && child.kill('SIGKILL'); } catch (e) {}
  try { if (tmp) fs.rmSync(tmp, { recursive: true, force: true }); } catch (e) {}
  // A couple of files have no env override and land next to index.js; tidy them.
  for (const f of ['.setayesh-connectors.json', '.setayesh-sessions.json', '.setayesh-pending-verify.json',
                   '.setayesh-engine-health.json']) {
    try { fs.rmSync(path.join(ROOT, f), { force: true }); } catch (e) {}
  }
  try { fs.rmSync(path.join(ROOT, 'code-library'), { recursive: true, force: true }); } catch (e) {}
  for (const f of ['tls-cert.pem', 'tls-key.pem']) {
    try { fs.rmSync(path.join(ROOT, f), { force: true }); } catch (e) {}
  }
});

test('health reports ok', async () => {
  const d = await (await api('/api/health')).json();
  assert.equal(d.ok, true);
});

test('version matches package.json', async () => {
  const d = await (await api('/api/version')).json();
  assert.equal(d.version, PKG.version);
});

// The frontend build markers are the single guard against a silent partial
// install (index.html/index.js updating while app.js/brainmap.js stay old).
// If these drift from the package version, the integrity check would false-
// positive forever, so the tests refuse to let them fall out of sync.
test('frontend build markers match the package version', () => {
  const files = ['public/app.js', 'public/brainmap.js', 'public/index.html'];
  for (const rel of files) {
    const head = fs.readFileSync(path.join(ROOT, rel), 'utf8').slice(0, 600);
    const m = head.match(/SETAYESH_BUILD\s+([0-9]+\.[0-9]+\.[0-9]+)/);
    assert.ok(m, `missing SETAYESH_BUILD marker in ${rel}`);
    assert.equal(m[1], PKG.version, `stale build marker in ${rel}`);
  }
});

test('served shell injects the version into asset URLs (no __VER__ left)', async () => {
  const html = await (await fetch(BASE + '/')).text();
  assert.ok(!html.includes('__VER__'), 'shell still contains the __VER__ placeholder');
  assert.ok(html.includes('?v=' + PKG.version), 'shell asset URLs are not stamped with the version');
});

test('integrity endpoint reports a healthy install', async () => {
  const token = (await (await api('/api/login', { method: 'POST', body: ADMIN })).json()).token;
  const d = await (await api('/api/admin/integrity', { token })).json();
  assert.equal(d.ok, true, 'integrity should be ok: ' + JSON.stringify(d.stale || []));
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

test('devices: register (phone layout), set prefs, list, and revoke', async () => {
  const token = (await (await api('/api/login', { method: 'POST', body: ADMIN })).json()).token;
  const id = 'testdev-' + Date.now();

  const reg = await api('/api/device', { method: 'POST', token, body: { id, screenW: 400, screenH: 800, touch: true, platform: 'TestOS' } });
  assert.equal(reg.status, 200);
  const d = await reg.json();
  assert.equal(d.kind, 'phone');
  assert.equal(d.layout.compact, true);
  assert.equal(d.known, false);

  const prefs = await api('/api/device/prefs', { method: 'POST', token, body: { id, prefs: { engine: 'anthropic' } } });
  assert.equal(prefs.status, 200);
  assert.equal((await prefs.json()).prefs.engine, 'anthropic');

  const list = await (await api('/api/admin/devices', { token })).json();
  assert.ok(list.devices.some((x) => x.id === id), 'registered device should be listed');

  const del = await api('/api/admin/devices/' + id, { method: 'DELETE', token });
  assert.equal(del.status, 200);
  const list2 = await (await api('/api/admin/devices', { token })).json();
  assert.ok(!list2.devices.some((x) => x.id === id), 'revoked device should be gone');
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

// ---- Chat memory ----
// The rule the owner set: a conversation is kept until HE deletes it. The bug
// this guards is the old replace-the-whole-file sync, where a device holding
// only the newest conversations silently deleted every older one on its next
// save. Merge semantics are what make "keep them all" true, so they are tested.
test('chats are merged, never replaced — an old device cannot wipe the archive', async () => {
  const token = (await (await api('/api/login', { method: 'POST', body: ADMIN })).json()).token;

  const first = { id: 'chat-old', title: 'قدیمی', updated: 1000, messages: [{ role: 'user', text: 'یک' }] };
  await api('/api/chats', { method: 'PUT', token, body: { t: 1000, chats: [first] } });

  // A second device pushes only its own newer conversation — it must not
  // delete the one it has never seen.
  const second = { id: 'chat-new', title: 'تازه', updated: 2000, messages: [{ role: 'user', text: 'دو' }] };
  await api('/api/chats', { method: 'PUT', token, body: { t: 2000, chats: [second] } });

  const after = await (await api('/api/chats', { token })).json();
  const ids = after.chats.map((c) => c.id).sort();
  assert.deepEqual(ids, ['chat-new', 'chat-old'], 'both conversations must survive the merge');
});

test('an older copy of a chat never overwrites a newer one', async () => {
  const token = (await (await api('/api/login', { method: 'POST', body: ADMIN })).json()).token;
  await api('/api/chats', { method: 'PUT', token, body: { t: 5000, chats: [{ id: 'c-race', title: 'جدید', updated: 5000 }] } });
  await api('/api/chats', { method: 'PUT', token, body: { t: 5001, chats: [{ id: 'c-race', title: 'کهنه', updated: 100 }] } });
  const d = await (await api('/api/chats', { token })).json();
  const row = d.chats.find((c) => c.id === 'c-race');
  assert.equal(row.title, 'جدید', 'a stale device copy must not clobber the newer one');
});

test('deleting a chat removes it for good and it cannot come back on the next sync', async () => {
  const token = (await (await api('/api/login', { method: 'POST', body: ADMIN })).json()).token;
  await api('/api/chats', { method: 'PUT', token, body: { t: 7000, chats: [{ id: 'c-gone', title: 'حذفی', updated: 7000 }] } });

  const del = await api('/api/chats/c-gone', { method: 'DELETE', token });
  assert.equal(del.status, 200);

  // Another device that still has the chat re-pushes it — the tombstone wins.
  await api('/api/chats', { method: 'PUT', token, body: { t: 8000, chats: [{ id: 'c-gone', title: 'حذفی', updated: 8000 }] } });
  const d = await (await api('/api/chats', { token })).json();
  assert.equal(d.chats.filter((c) => c.id === 'c-gone').length, 0, 'a deleted chat must stay deleted');
});

// ---- Engine routing & health ----
test('engine health reports what each engine is good at, and can be reset', async () => {
  const token = (await (await api('/api/login', { method: 'POST', body: ADMIN })).json()).token;
  const d = await (await api('/api/admin/engine-health', { token })).json();
  assert.ok(Array.isArray(d.engines), 'expected an engines array');
  for (const e of d.engines) {
    assert.ok(Array.isArray(e.strong), 'every engine must carry routing hints');
    assert.equal(typeof e.quarantined, 'boolean');
  }
  const reset = await api('/api/admin/engine-health/reset', { method: 'POST', token, body: {} });
  assert.equal(reset.status, 200);
  const bad = await api('/api/admin/engine-health/reset', { method: 'POST', token, body: { id: 'nope' } });
  assert.equal(bad.status, 400);
});

test('every engine carries the routing metadata the router needs', () => {
  const { PROVIDERS } = require(path.join(ROOT, 'providers.js'));
  for (const [id, p] of Object.entries(PROVIDERS)) {
    assert.ok(Number.isFinite(p.speed), `${id} is missing a speed hint`);
    assert.ok(Array.isArray(p.strong) && p.strong.length, `${id} is missing its strengths`);
  }
});

// ---- Automatic failover ----
// The regression this guards is subtle and was live for a long time: the
// failover in /api/chat referenced a `const` declared INSIDE the try block it
// was catching for, so every substitute engine threw ReferenceError before it
// ever reached the network. The failover looked implemented, marked each
// engine as broken, and always showed the first engine's error. This test
// stands up two fake engines — one that always rate-limits, one that answers —
// and insists the answer comes back from the healthy one.
test('a rate-limited engine fails over to a healthy one and still answers', async (t) => {
  const http = require('node:http');
  const stub = http.createServer((req, res) => {
    let body = '';
    req.on('data', (c) => { body += c; });
    req.on('end', () => {
      if (req.url.startsWith('/bad/')) {
        res.writeHead(429, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ error: { message: 'rate limit exceeded' } }));
      }
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(req.url.endsWith('/chat/completions')
        ? { choices: [{ message: { content: 'پاسخ از موتور سالم' } }] }
        : { data: [] }));
    });
  });
  await new Promise((r) => stub.listen(0, '127.0.0.1', r));
  const sp = stub.address().port;
  t.after(() => stub.close());

  const token = (await (await api('/api/login', { method: 'POST', body: ADMIN })).json()).token;
  for (const [id, label, url] of [
    ['failtest', 'Always Rate Limited', `http://127.0.0.1:${sp}/bad/v1`],
    ['worktest', 'Always Works', `http://127.0.0.1:${sp}/good/v1`],
  ]) {
    const r = await api('/api/admin/providers/custom', { method: 'POST', token, body: { id, label, baseUrl: url, models: 'm1', key: 'k' } });
    assert.equal(r.status, 200, `could not register ${id}`);
  }

  const r = await api('/api/chat', { method: 'POST', token, body: { message: 'سلام', provider: 'failtest', model: 'm1', auto: 'false' } });
  assert.equal(r.status, 200, 'a rate-limited engine must not surface as an HTTP error');
  const d = await r.json();
  assert.ok(!d.error, 'the user must not be shown a provider error: ' + d.error);
  assert.ok(d.reply, 'expected an actual answer');
  assert.notEqual(d.provider, 'failtest', 'the answer must come from a different engine');
  assert.ok(d.failedOver, 'the response must say which engine was substituted');

  // Clean up so the fakes do not linger in the engine list for other tests.
  for (const id of ['failtest', 'worktest']) {
    await api('/api/admin/providers/custom/' + id, { method: 'DELETE', token });
  }
});

// ---- Formats and the converter ----
test('the format registry is served and every entry is well formed', async () => {
  const token = (await (await api('/api/login', { method: 'POST', body: ADMIN })).json()).token;
  const d = await (await api('/api/formats', { token })).json();
  assert.ok(d.count > 80, 'expected a real registry, got ' + d.count);
  for (const f of d.formats) {
    assert.ok(f.ext && f.family && f.mime, 'incomplete entry: ' + JSON.stringify(f));
    assert.ok(!f.convertsTo.includes(f.ext), f.ext + ' lists itself as a conversion target');
  }
});

test('CSV converts to a real .xlsx and reads back with the same cells', async () => {
  const formats = require(path.join(ROOT, 'formats.js'));
  const csv = 'name,age,city\nJavid,44,Berlin\n"Setayesh, S",12,Berlin\nفردین,8,برلین\n';
  const out = await formats.convert(Buffer.from(csv), 'people.csv', 'xlsx');
  assert.equal(out.data.slice(0, 2).toString('latin1'), 'PK', 'not a zip');
  const back = formats.read(out.data, 'people.xlsx');
  assert.deepEqual(back.columns, ['name', 'age', 'city']);
  assert.deepEqual(back.rows[1], ['Setayesh, S', '12', 'Berlin'], 'a quoted comma must survive the round trip');
  assert.deepEqual(back.rows[2], ['فردین', '8', 'برلین'], 'Persian must survive the round trip');
});

test('Markdown converts to a real .docx and reads back with its structure', async () => {
  const formats = require(path.join(ROOT, 'formats.js'));
  const out = await formats.convert(Buffer.from('# عنوان\n\nیک پاراگراف.\n\n- یک\n- دو\n'), 'n.md', 'docx');
  const back = formats.read(out.data, 'n.docx');
  const kinds = back.blocks.map((b) => b.type);
  assert.ok(kinds.includes('h1'), 'heading lost');
  assert.ok(kinds.includes('li'), 'list item lost');
  // A bullet must not accumulate on every round trip.
  assert.ok(!back.blocks.some((b) => /^[•·]/.test(b.text)), 'bullet character leaked into the text');
});

test('.env values are masked when the file is read', () => {
  const formats = require(path.join(ROOT, 'formats.js'));
  const r = formats.read(Buffer.from('API_KEY=supersecretvalue123\nPORT=3000\n'), '.env');
  const joined = JSON.stringify(r);
  assert.ok(!joined.includes('supersecretvalue123'), 'a secret leaked out of the .env reader');
  assert.ok(r.warning, 'the masking must be stated');
});

// ---- Big files ----
test('a file is analysed by path, and secrets are refused', async () => {
  const token = (await (await api('/api/login', { method: 'POST', body: ADMIN })).json()).token;
  const ok = await api('/api/files/analyze', { method: 'POST', token, body: { path: path.join(ROOT, 'package.json') } });
  assert.equal(ok.status, 200);
  const d = await ok.json();
  assert.equal(d.file.ext, 'json');
  assert.ok(d.file.lines > 0);

  // The accounts file holds password hashes; it must never be readable here,
  // because a chat answer can be produced by a cloud engine.
  const bad = await api('/api/files/analyze', { method: 'POST', token, body: { path: path.join(tmp, 'users.json') } });
  assert.equal(bad.status, 400, 'the users file must be refused');
  assert.match((await bad.json()).error, /محرمانه/);
});

test('search finds a line in the middle of a file with correct context', async () => {
  const bigfile = require(path.join(ROOT, 'bigfile.js'));
  const p = path.join(tmp, 'lines.txt');
  const lines = [];
  for (let i = 1; i <= 5000; i++) lines.push(i === 3200 ? 'here is the NEEDLE we want' : 'filler line ' + i);
  fs.writeFileSync(p, lines.join('\n') + '\n');
  const r = await bigfile.search(p, 'NEEDLE', { context: 2 });
  assert.equal(r.matches, 1);
  assert.equal(r.hits[0].line, 3200, 'wrong line number');
  assert.match(r.hits[0].before[1], /^3199: /);
  assert.match(r.hits[0].after[0], /^3201: /);
  const sl = await bigfile.slice(p, 3200, 3200);
  assert.match(sl.text, /^3200: here is the NEEDLE/);
});

// ---- Language ----
test('grammar check fixes Persian half-spaces and Arabic letters', async () => {
  const token = (await (await api('/api/login', { method: 'POST', body: ADMIN })).json()).token;
  const r = await (await api('/api/language/check', { method: 'POST', token,
    body: { text: 'من می روم و کتاب ها را مي خرم' } })).json();
  assert.equal(r.lang, 'fa');
  assert.equal(r.corrected, 'من می‌روم و کتاب‌ها را می‌خرم');
});

test('grammar check tells German from English and fixes each one', async () => {
  const token = (await (await api('/api/login', { method: 'POST', body: ADMIN })).json()).token;
  const de = await (await api('/api/language/check', { method: 'POST', token,
    body: { text: 'Seit ihr schon da? Die strasse ist lang.', apply: 'likely' } })).json();
  assert.equal(de.lang, 'de');
  assert.match(de.corrected, /Seid ihr/, 'seit/seid not corrected, or capital lost');
  assert.match(de.corrected, /Straße/);

  const en = await (await api('/api/language/check', { method: 'POST', token,
    body: { text: 'i recieve teh letter and they should of told me .' } })).json();
  assert.equal(en.lang, 'en');
  assert.match(en.corrected, /^I receive the letter/);
  assert.match(en.corrected, /should have told me\./);
});

test('letter conventions are language-specific, not translated English', async () => {
  const token = (await (await api('/api/login', { method: 'POST', body: ADMIN })).json()).token;
  const de = await (await api('/api/language/letter?language=de&formality=formal&authority=1', { token })).json();
  assert.match(de.salutation, /Sehr geehrte/);
  assert.match(de.closing, /Mit freundlichen Grüßen/);
  assert.ok(de.rules.some((r) => /Aktenzeichen/.test(r)), 'the authority rule is missing');
  const fa = await (await api('/api/language/letter?language=fa&formality=formal', { token })).json();
  assert.match(fa.closing, /با تشکر/);
});

// ---- Devices and the network ----
test('device discovery returns a structured answer even with no hardware', async () => {
  const token = (await (await api('/api/login', { method: 'POST', body: ADMIN })).json()).token;
  const r = await api('/api/devices/scan?transports=usb,drive', { token });
  assert.equal(r.status, 200);
  const d = await r.json();
  assert.ok(d.counts && typeof d.counts.usb === 'number');
  assert.ok(Array.isArray(d.devices));
  assert.ok(d.safety && Array.isArray(d.safety.findings));
});

test('a device cannot be commanded until the owner allows it', async () => {
  const token = (await (await api('/api/login', { method: 'POST', body: ADMIN })).json()).token;
  const r = await api('/api/devices/command', { method: 'POST', token, body: { id: 'ssdp:whatever', action: 'play' } });
  assert.equal(r.status, 403, 'an unallowed device must be refused');
  assert.equal((await r.json()).needsPermission, true);
});

test('network status is visible to every member, not just the admin', async () => {
  const token = (await (await api('/api/login', { method: 'POST', body: ADMIN })).json()).token;
  const d = await (await api('/api/network/status?deep=0', { token })).json();
  assert.equal(typeof d.online, 'boolean');
  assert.ok(['ok', 'caution', 'untrusted'].includes(d.trust));
  assert.ok(Array.isArray(d.interfaces));
});

test('joining a network needs the owner to name the network he approves', async () => {
  const token = (await (await api('/api/login', { method: 'POST', body: ADMIN })).json()).token;
  const netguard = require(path.join(ROOT, 'netguard.js'));
  const no = await netguard.connectWifi('SomeCafe', {});
  assert.equal(no.ok, false);
  assert.equal(no.needsApproval, true, 'must refuse without an explicit approval for that ssid');
  const wrong = await netguard.connectWifi('SomeCafe', { approvedSsid: 'OtherNetwork' });
  assert.equal(wrong.needsApproval, true, 'approving one network must not approve another');
});

test('the file threat scanner catches a program disguised as a document', () => {
  const netguard = require(path.join(ROOT, 'netguard.js'));
  const p = path.join(tmp, 'invoice.pdf');
  fs.writeFileSync(p, Buffer.concat([Buffer.from([0x4d, 0x5a]), Buffer.alloc(2048)]));
  const r = netguard.scanFile(p);
  assert.equal(r.level, 'high');
  assert.ok(r.findings.some((f) => /نوع واقعی/.test(f.text)), 'the type mismatch was not reported');
  assert.ok(r.limitation, 'the scanner must always state that it is not an antivirus');

  const clean = path.join(tmp, 'note.txt');
  fs.writeFileSync(clean, 'خرید نان و شیر برای فردا\n');
  assert.equal(netguard.scanFile(clean).level, 'ok');
});

test('the encrypted envelope round-trips and rejects tampering', () => {
  const netguard = require(path.join(ROOT, 'netguard.js'));
  const me = netguard.newKeypair();
  const secret = 'شماره حساب و رمز — روی شبکه‌ی عمومی';
  const env = netguard.seal(secret, me.publicKey, 'test');
  assert.ok(!JSON.stringify(env).includes('حساب'), 'the plaintext must not be in the envelope');
  assert.equal(netguard.unseal(env, me.privateKey).toString('utf8'), secret);

  const tampered = Object.assign({}, env, { data: Buffer.from('x'.repeat(32)).toString('base64') });
  assert.throws(() => netguard.unseal(tampered, me.privateKey), 'tampering must fail loudly');
  const other = netguard.newKeypair();
  assert.throws(() => netguard.unseal(env, other.privateKey), 'the wrong key must fail');
});

// ---- Device identification ----
// The complaint this answers: the home scan listed five devices as
// "دستگاه ناشناس" with nothing but a MAC next to them. Four of those five were
// phones using a privacy address and one was a Xiaomi — all knowable.
test('the full IEEE registry names real manufacturers', () => {
  const identify = require(path.join(ROOT, 'identify.js'));
  assert.ok(identify.loadOui().size > 50000, 'the OUI registry did not load');
  const cases = [
    ['cc:4d:75:78:6a:11', /Xiaomi/i],     // the one real device in the screenshot
    ['5c:49:7d:aa:bb:cc', /Samsung/i],
    ['b8:27:eb:11:22:33', /Raspberry/i],
    ['a4:83:e7:00:00:01', /Apple/i],
    ['00:1f:3f:11:22:33', /AVM|FRITZ/i],
  ];
  for (const [mac, re] of cases) {
    assert.match(identify.vendorOf(mac), re, mac + ' was not identified');
  }
});

test('a randomised MAC is explained as a phone, not reported as unknown', () => {
  const identify = require(path.join(ROOT, 'identify.js'));
  for (const mac of ['0e:ab:c3:d9:95:5b', '16:47:6a:23:43:3e', 'e2:43:78:2b:89:d1']) {
    const k = identify.macKind(mac);
    assert.equal(k.local, true, mac + ' should be locally administered');
    const d = identify.describe({ mac });
    assert.equal(d.randomised, true);
    assert.equal(d.confident, true, 'a privacy address is a conclusion, not a shrug');
    assert.ok(!/ناشناس/.test(d.label), 'still labelled unknown: ' + d.label);
    assert.ok(d.why.join(' ').includes('حریم خصوصی'), 'the reason must be explained');
  }
  // A factory MAC is NOT a privacy address.
  assert.equal(identify.macKind('cc:4d:75:78:6a:11').local, false);
});

test("a device's own name wins over every guess", () => {
  const identify = require(path.join(ROOT, 'identify.js'));
  const d = identify.describe({ mac: '0e:ab:c3:d9:95:5b', hostname: 'Javid-iPhone' });
  assert.equal(d.label, 'Javid-iPhone');
  assert.ok(d.roles.includes('دستگاه اپل'), 'the name should also settle what kind of thing it is');
});

test('the ARP table parses on Linux and macOS, not only Windows', () => {
  // The old pattern excluded a-f from the separator, so it could not cross the
  // word "at" and returned NOTHING on Linux/macOS — the bug this locks down.
  const re = /(\d+\.\d+\.\d+\.\d+)\D{1,12}?([0-9a-f]{1,2}[:-][0-9a-f]{1,2}[:-][0-9a-f]{1,2}[:-][0-9a-f]{1,2}[:-][0-9a-f]{1,2}[:-][0-9a-f]{1,2})/gi;
  const parse = (txt) => {
    const map = {}; let m; re.lastIndex = 0;
    while ((m = re.exec(txt))) {
      map[m[1]] = m[2].replace(/-/g, ':').toLowerCase()
        .split(':').map((o) => (o.length === 1 ? '0' + o : o)).join(':');
    }
    return map;
  };
  assert.equal(parse('? (192.168.2.31) at cc:4d:75:78:6a:11 [ether] on wlan0')['192.168.2.31'],
    'cc:4d:75:78:6a:11', 'Linux arp output');
  assert.equal(parse('  192.168.2.31          cc-4d-75-78-6a-11     dynamic')['192.168.2.31'],
    'cc:4d:75:78:6a:11', 'Windows arp output');
  // macOS drops leading zeros in each octet.
  assert.equal(parse('router (192.168.2.1) at e0:28:6d:a:b:c on en0')['192.168.2.1'],
    'e0:28:6d:0a:0b:0c', 'macOS arp output');
});

// ---- Hardware access levels ----
// The owner asked for two grades besides his own account. The whole point is
// that the SERVER decides, so these tests go through HTTP as each user rather
// than checking the interface.
async function mkUser(token, username, password) {
  await api('/api/admin/users', { method: 'POST', token, body: { username, password } });
  const r = await (await api('/api/login', { method: 'POST', body: { username, password } })).json();
  return r.token;
}

test('a new account starts with no hardware access at all', async () => {
  const token = (await (await api('/api/login', { method: 'POST', body: ADMIN })).json()).token;
  const kid = await mkUser(token, 'lvltest0', 'pass12345');
  assert.ok(kid, 'could not create the test account');

  for (const p of ['/api/hw/all', '/api/hw/serial', '/api/hw/usb', '/api/hw/bluetooth', '/api/hw/watch']) {
    const r = await api(p, { token: kid });
    assert.equal(r.status, 403, p + ' should be closed by default');
  }
  const cfg = await (await api('/api/config', { token: kid })).json();
  assert.equal(cfg.deviceLevel, 0);
});

test('level 1 may look but never touch', async () => {
  const token = (await (await api('/api/login', { method: 'POST', body: ADMIN })).json()).token;
  const u = await mkUser(token, 'lvltest1', 'pass12345');
  const set = await api('/api/admin/device-level', { method: 'POST', token, body: { username: 'lvltest1', level: 1 } });
  assert.equal(set.status, 200);

  // Looking works.
  assert.equal((await api('/api/hw/serial', { token: u })).status, 200);
  assert.equal((await api('/api/hw/usb', { token: u })).status, 200);
  assert.equal((await api('/api/hw/bluetooth', { token: u })).status, 200);

  // Touching does not.
  const pair = await api('/api/hw/bluetooth/action', { method: 'POST', token: u,
    body: { mac: 'aa:bb:cc:dd:ee:ff', action: 'pair' } });
  assert.equal(pair.status, 403, 'level 1 must not be able to pair');
  assert.match((await pair.json()).error, /درجه/);

  const talk = await api('/api/hw/serial/talk', { method: 'POST', token: u, body: { port: 'COM1', send: 'AT' } });
  assert.equal(talk.status, 403, 'level 1 must not be able to send down a cable');
});

test('level 2 may touch, and the level is what decides — not the admin flag', async () => {
  const token = (await (await api('/api/login', { method: 'POST', body: ADMIN })).json()).token;
  const u = await mkUser(token, 'lvltest2', 'pass12345');
  await api('/api/admin/device-level', { method: 'POST', token, body: { username: 'lvltest2', level: 2 } });

  const cfg = await (await api('/api/config', { token: u })).json();
  assert.equal(cfg.deviceLevel, 2);
  assert.equal(cfg.isAdmin, false, 'granting hardware access must NOT make someone an admin');

  // It gets past the permission gate; what comes back then depends on the
  // hardware, so anything except 403 proves the gate opened.
  const talk = await api('/api/hw/serial/talk', { method: 'POST', token: u, body: { port: 'COM-nope', send: 'AT' } });
  assert.notEqual(talk.status, 403, 'level 2 should get past the gate');

  // And it is still not an admin of anything else.
  assert.equal((await api('/api/admin/users', { token: u })).status, 403);
});

test('the father cannot be demoted out of his own permission system', async () => {
  const token = (await (await api('/api/login', { method: 'POST', body: ADMIN })).json()).token;
  const r = await api('/api/admin/device-level', { method: 'POST', token, body: { username: 'admin', level: 0 } });
  assert.equal(r.status, 400);
  const cfg = await (await api('/api/config', { token })).json();
  assert.equal(cfg.deviceLevel, 2, 'the admin must stay at level 2');
});

test('only the father may hand out levels', async () => {
  const token = (await (await api('/api/login', { method: 'POST', body: ADMIN })).json()).token;
  const u = await mkUser(token, 'lvltest3', 'pass12345');
  await api('/api/admin/device-level', { method: 'POST', token, body: { username: 'lvltest3', level: 2 } });
  // Even at the highest hardware level, a member cannot promote anyone.
  const r = await api('/api/admin/device-level', { method: 'POST', token: u,
    body: { username: 'lvltest3', level: 2 } });
  assert.equal(r.status, 403);
});

test('an invalid level is refused', async () => {
  const token = (await (await api('/api/login', { method: 'POST', body: ADMIN })).json()).token;
  await mkUser(token, 'lvltest4', 'pass12345');
  for (const level of [3, -1, 'two', null]) {
    const r = await api('/api/admin/device-level', { method: 'POST', token, body: { username: 'lvltest4', level } });
    assert.equal(r.status, 400, 'level ' + level + ' should be refused');
  }
});

// ---- Bluetooth and serial parsing ----
test('bluetoothctl output is parsed into a full device picture', () => {
  const hw = require(path.join(ROOT, 'hwlink.js'));
  const list = hw.parseBtDevices('Device AC:BC:32:11:22:33 JBL Flip 5\nDevice 5C:49:7D:AA:BB:CC Soundbar\nnoise');
  assert.equal(list.length, 2);
  assert.equal(list[0].mac, 'ac:bc:32:11:22:33');

  const info = hw.parseBtInfo([
    '        Name: JBL Flip 5', '        Icon: audio-card', '        Paired: yes',
    '        Connected: yes', '        RSSI: -52',
    '        UUID: Audio Sink                (0000110b-0000-1000-8000-00805f9b34fb)',
  ].join('\n'));
  assert.equal(info.paired, true);
  assert.equal(info.connected, true);
  assert.equal(info.rssi, -52);
  assert.equal(info.kind, 'اسپیکر یا هدفون');
  assert.equal(info.uuids.length, 1);
});

test('GATT attributes get a readable label, and values decode', () => {
  const hw = require(path.join(ROOT, 'hwlink.js'));
  const attrs = hw.parseGattAttributes([
    'Primary Service', '/org/bluez/hci0/dev_AA/service000a',
    '0000180a-0000-1000-8000-00805f9b34fb',
    'Characteristic', '/org/bluez/hci0/dev_AA/service000a/char000b',
    '00002a29-0000-1000-8000-00805f9b34fb',
  ].join('\n'));
  assert.equal(attrs.length, 2);
  assert.equal(attrs[1].kind, 'characteristic');
  assert.equal(attrs[1].label, 'سازنده');

  const v = hw.parseGattValue('  00: 4a 42 4c    JBL');
  assert.equal(v.text, 'JBL');
  assert.equal(v.hex, '4a424c');
});

test('a serial port must be one the system actually reported', async () => {
  const hw = require(path.join(ROOT, 'hwlink.js'));
  await assert.rejects(() => hw.assertKnownPort('/etc/passwd'),
    /فهرست پورت/, 'an arbitrary path must never be opened as a serial port');
  await assert.rejects(() => hw.serialTalk('../../etc/shadow', { send: 'x' }), /فهرست پورت/);
});

test('Windows COM ports are parsed, and non-ports ignored', () => {
  const hw = require(path.join(ROOT, 'hwlink.js'));
  const ports = hw.parseWinSerial(JSON.stringify([
    { Name: 'USB-SERIAL CH340 (COM3)', Manufacturer: 'wch.cn', PNPDeviceID: 'USB\\VID_1A86&PID_7523\\5' },
    { Name: 'Some other device' },
  ]));
  assert.equal(ports.length, 1);
  assert.equal(ports[0].port, 'COM3');
  assert.equal(ports[0].vendor, 'wch.cn');
});

// ---- Windows Bluetooth: one device, not one row per profile ----
// The screenshot showed 70 "Bluetooth devices" on a machine that has three.
// Windows lists one PnP entry per PROFILE, and they all carry the same
// address, so grouping by address puts each device back together.
test('Windows Bluetooth profile rows group into real devices', () => {
  const discover = require(path.join(ROOT, 'discover.js'));
  const rows = [
    { FriendlyName: 'Andrew Hands-Free HF Audio', Service: 'BthHFEnum', Status: 'OK',
      InstanceId: 'BTHENUM\\{0000111e-0000-1000-8000-00805f9b34fb}_LOCALMFG&000a\\7&2a4e&0&C0288D4A5B6C_C00000000' },
    { FriendlyName: 'Andrew Avrcp Transport', Service: 'BthAvrcpTg', Status: 'OK',
      InstanceId: 'BTHENUM\\{0000110c-0000-1000-8000-00805f9b34fb}_LOCALMFG&000a\\7&2a4e&0&C0288D4A5B6C_C00000000' },
    { FriendlyName: 'Standard Serial over Bluetooth link (COM4)', Service: 'BthModem', Status: 'OK',
      InstanceId: 'BTHENUM\\{00001101-0000-1000-8000-00805f9b34fb}_LOCALMFG&0000\\7&2a4e&0&C0288D4A5B6C_C00000000' },
    { FriendlyName: 'Generic Attribute Profile', Status: 'OK',
      InstanceId: 'BTHLEDEVICE\\{00001801-0000-1000-8000-00805f9b34fb}_DEV_AABBCCDDEEFF\\9&abc&0&0001' },
    { FriendlyName: 'Xbox Wireless Controller', Status: 'OK',
      InstanceId: 'BTHLE\\DEV_AABBCCDDEEFF\\8&31b2&0&AABBCCDDEEFF' },
    { FriendlyName: 'Bluetooth Device (Personal Area Network)', Status: 'OK',
      InstanceId: 'BTH\\MS_BTHPAN\\6&1a2b&0&2' },
  ];
  const g = discover.groupWindowsBluetooth(rows);
  assert.equal(g.devices.length, 2, 'six rows are two devices, not six');

  const andrew = g.devices.find((d) => d.mac === 'c0:28:8d:4a:5b:6c');
  assert.ok(andrew, 'the address was not extracted from the BTHENUM shape');
  assert.equal(andrew.name, 'Andrew', 'the profile suffix should be stripped off the name');
  assert.equal(andrew.profiles.length, 3);
  // A Bluetooth device that exposes a COM port is a real serial link to it.
  assert.deepEqual(andrew.serialPorts, ['COM4']);
  assert.ok(andrew.roles.includes('پخش صدا'));
  assert.ok(andrew.capabilities.list.includes('serial'));

  const xbox = g.devices.find((d) => d.mac === 'aa:bb:cc:dd:ee:ff');
  assert.ok(xbox, 'the address was not extracted from the DEV_ shape');
  assert.ok(xbox.capabilities.list.includes('gatt'));
});

test('everything under the Bluetooth bus counts as Bluetooth, not USB', () => {
  const discover = require(path.join(ROOT, 'discover.js'));
  // The USB card used to show more devices than the USB scan found, because
  // BTH\\... rows that are not BTHENUM/BTHLE landed in the USB bucket.
  const rows = discover.parseWindowsPnp(JSON.stringify([
    { FriendlyName: 'PAN', InstanceId: 'BTH\\MS_BTHPAN\\6&1a&0&2' },
    { FriendlyName: 'LE dev', InstanceId: 'BTHLE\\DEV_AABBCCDDEEFF\\8&31&0&AA' },
    { FriendlyName: 'Intel Wireless Bluetooth', InstanceId: 'USB\\VID_8087&PID_0026\\5&1e&0&10' },
  ]));
  assert.equal(rows[0].transport, 'bluetooth');
  assert.equal(rows[1].transport, 'bluetooth');
  assert.equal(rows[2].transport, 'usb', 'the radio itself really is a USB device');
});

test('hubs are marked as plumbing so they do not bury the real devices', () => {
  const hwlink = require(path.join(ROOT, 'hwlink.js'));
  const marked = hwlink.markPlumbing([
    { name: 'Generic SuperSpeed USB Hub' },
    { name: 'USB Root Hub (USB 3.0)' },
    { name: 'USB Input Device' },
    { name: 'Xbox Wireless Adapter for Windows' },
    { name: 'SanDisk Ultra', usbClass: '08' },
  ]);
  assert.deepEqual(marked.map((m) => !!m.plumbing), [true, true, true, false, false]);
});

// ---- Going into a device ----
test('every device can be opened, and the actions match what it is', async () => {
  const token = (await (await api('/api/login', { method: 'POST', body: ADMIN })).json()).token;
  const all = await (await api('/api/hw/all', { token })).json();

  // Whatever this machine has, each listed thing must open.
  const keys = []
    .concat((all.serial || []).map((x) => x.key))
    .concat((all.drives || []).map((x) => x.key))
    .concat((all.usb || []).map((x) => x.key))
    .filter(Boolean).slice(0, 6);
  assert.ok(keys.length, 'nothing at all was listed to open');

  for (const key of keys) {
    const r = await api('/api/hw/device?key=' + encodeURIComponent(key), { token });
    assert.equal(r.status, 200, 'could not open ' + key);
    const d = await r.json();
    assert.ok(d.title, 'no title for ' + key);
    assert.ok(Array.isArray(d.properties) && d.properties.length, 'no properties for ' + key);
    for (const a of d.actions || []) assert.equal(typeof a.allowed, 'boolean');
  }

  // A serial port offers a console; a drive does not pretend to.
  if ((all.serial || []).length) {
    const d = await (await api('/api/hw/device?key=' + encodeURIComponent(all.serial[0].key), { token })).json();
    assert.ok((d.actions || []).some((a) => a.id.startsWith('serial:')), 'a serial port must offer its console');
  }
  const unknown = await api('/api/hw/device?key=usb:dead:beef:nothing', { token });
  assert.equal(unknown.status, 404);
});

test('a device can be renamed and the name comes back with it', async () => {
  const token = (await (await api('/api/login', { method: 'POST', body: ADMIN })).json()).token;
  const all = await (await api('/api/hw/all', { token })).json();
  const key = ((all.drives || [])[0] || (all.serial || [])[0] || {}).key;
  assert.ok(key, 'no device to rename');

  const saved = await api('/api/hw/device/note', { method: 'POST', token,
    body: { key, label: 'هارد بابا', owner: 'javid', note: 'پشتیبان هفتگی' } });
  assert.equal(saved.status, 200);

  const opened = await (await api('/api/hw/device?key=' + encodeURIComponent(key), { token })).json();
  assert.equal(opened.givenName, 'هارد بابا');
  assert.equal(opened.title, 'هارد بابا', 'the name we gave it must win over the manufacturer name');
  assert.equal(opened.note.owner, 'javid');
  assert.equal(opened.note.updatedBy, 'admin', 'who wrote it is recorded');

  // Clearing every field removes the record rather than leaving an empty one.
  await api('/api/hw/device/note', { method: 'POST', token,
    body: { key, label: '', owner: '', note: '', favourite: false } });
  const notes = await (await api('/api/hw/notes', { token })).json();
  assert.ok(!notes.notes[key], 'an emptied note should be deleted, not kept');
});

test('opening a device still obeys the access levels', async () => {
  const token = (await (await api('/api/login', { method: 'POST', body: ADMIN })).json()).token;
  const closed = await mkUser(token, 'openlvl0', 'pass12345');
  assert.equal((await api('/api/hw/device?key=drive:whatever', { token: closed })).status, 403);
  assert.equal((await api('/api/hw/device/note', { method: 'POST', token: closed,
    body: { key: 'x', label: 'y' } })).status, 403);

  const looker = await mkUser(token, 'openlvl1', 'pass12345');
  await api('/api/admin/device-level', { method: 'POST', token, body: { username: 'openlvl1', level: 1 } });
  const all = await (await api('/api/hw/all', { token: looker })).json();
  const key = ((all.serial || [])[0] || (all.drives || [])[0] || {}).key;
  if (key) {
    const d = await (await api('/api/hw/device?key=' + encodeURIComponent(key), { token: looker })).json();
    assert.equal(d.yourLevel, 1);
    // It may look, so level-2 actions come back marked as not allowed rather
    // than being offered as buttons that would be refused.
    for (const a of d.actions || []) {
      if ((a.level || 1) >= 2) assert.equal(a.allowed, false, a.id + ' should be closed at level 1');
    }
  }
});

// ---- The real device names from the household's own machine ----
// These are the exact strings Windows showed on Javid's Surface. The earlier
// suffix list handled "Avrcp Transport" but not the short profile names his
// devices actually use, so "Andrew A2DP SNK" and "BT Receiver Hands-Free AG"
// kept their profile stuck to the name.
test('every real Bluetooth name from the screenshots resolves correctly', () => {
  const discover = require(path.join(ROOT, 'discover.js'));
  const cases = [
    ['Andrew A2DP SNK', 'Andrew'],
    ['Andrew Hands-Free HF Audio', 'Andrew'],
    ['Andrew Avrcp Transport', 'Andrew'],
    ['BT Receiver Hands-Free AG', 'BT Receiver'],
    ['ROCKSTER GO 2 Avrcp Transport', 'ROCKSTER GO 2'],
    ['Surface Pen', 'Surface Pen'],
    ['Javid', 'Javid'],
    // These are pure profile descriptions with no device name in them. They
    // must resolve to nothing, or the shortest-name rule would call his phone
    // "GATT" instead of "Javid".
    ['GATT', ''],
    ['Generic Attribute Profile', ''],
    ['Service Discovery Service', ''],
    ['Device Information Service', ''],
    ['Bluetooth LE Generic Attribute Service', ''],
    ['Personal Area Network NAP Service', ''],
    ['Bluetooth Low Energy GATT compliant HID device', ''],
    ['Standard Serial over Bluetooth link (COM4)', ''],
  ];
  for (const [input, expected] of cases) {
    assert.equal(discover.winBtBaseName(input), expected, JSON.stringify(input));
  }
});

test('a device whose rows are all generic profiles is never named "GATT"', () => {
  const discover = require(path.join(ROOT, 'discover.js'));
  const addr = '\\7&2a4e&0&C0288D4A5B6C_C00000000';
  const g = discover.groupWindowsBluetooth([
    { FriendlyName: 'GATT', InstanceId: 'BTHENUM\\{1}_LOCALMFG&0002' + addr },
    { FriendlyName: 'Generic Attribute Profile', InstanceId: 'BTHENUM\\{2}_LOCALMFG&0002' + addr },
    { FriendlyName: 'Javid', InstanceId: 'BTHENUM\\{3}_LOCALMFG&0002' + addr },
    { FriendlyName: 'Device Information Service', InstanceId: 'BTHENUM\\{4}_LOCALMFG&0002' + addr },
  ]);
  assert.equal(g.devices.length, 1);
  assert.equal(g.devices[0].name, 'Javid', 'the real name must beat the shorter profile names');
  assert.equal(g.devices[0].profiles.length, 4);
});

// ---- Hosts on the network get named, not just listed ----
test('an open lockdown port identifies an iPhone even with a privacy MAC', () => {
  const identify = require(path.join(ROOT, 'identify.js'));
  // Both hosts in the scan had a randomised MAC (so no manufacturer at all)
  // and port 62078 open — iOS lockdownd, which essentially nothing else uses.
  const d = identify.describe({ mac: '0e:ab:c3:d9:95:5b', ports: [62078] });
  assert.equal(d.label, 'آیفون یا آیپد');
  assert.equal(d.confident, true);
  assert.ok(d.why.some((w) => /62078/.test(w)), 'the reason should name the port it used');

  // A MAC that IS in the registry still wins on the manufacturer.
  const x = identify.describe({ mac: 'cc:4d:75:78:6a:11', ports: [] });
  assert.match(x.label, /Xiaomi/i);
});

test('the ARP table is parsed the same way everywhere', () => {
  const identify = require(path.join(ROOT, 'identify.js'));
  assert.equal(identify.parseArp('? (192.168.2.31) at cc:4d:75:78:6a:11 [ether] on wlan0')['192.168.2.31'],
    'cc:4d:75:78:6a:11');
  assert.equal(identify.parseArp('  192.168.2.31   cc-4d-75-78-6a-11  dynamic')['192.168.2.31'],
    'cc:4d:75:78:6a:11');
  assert.equal(identify.parseArp('r (192.168.2.1) at e0:28:6d:a:b:c on en0')['192.168.2.1'],
    'e0:28:6d:0a:0b:0c', 'macOS drops leading zeros');
});

test('a network scan says what each host is, not only where', async () => {
  const token = (await (await api('/api/login', { method: 'POST', body: ADMIN })).json()).token;
  const r = await api('/api/tool/netscan', { method: 'POST', token, body: { cidr: '127.0.0.0/30', timeout: 150 } });
  // The subnet may legitimately have nothing in it; what matters is the shape.
  if (r.status === 200) {
    const d = await r.json();
    assert.ok(Array.isArray(d.hosts));
    for (const h of d.hosts) {
      assert.equal(typeof h.label, 'string', 'every host must carry a label field');
      assert.ok('mac' in h, 'every host must carry a mac field, even an empty one');
    }
  } else {
    assert.equal(r.status, 400, 'a refused scan must be a clean 400');
  }
});

// ---- Dev library shelf ----
test('the dev-library catalog is well formed and comprehensive', () => {
  const devlibs = require(path.join(ROOT, 'devlibs.js'));
  const langs = Object.keys(devlibs.CATALOG);
  assert.ok(langs.length >= 10, 'expected a shelf for many languages, got ' + langs.length);
  let total = 0;
  for (const [lang, e] of Object.entries(devlibs.CATALOG)) {
    assert.ok(e.label && e.manager && e.ecosystem, 'incomplete language entry: ' + lang);
    assert.ok(Array.isArray(e.libs) && e.libs.length, lang + ' has no libraries');
    for (const l of e.libs) {
      assert.ok(l.name, lang + ' has a nameless library');
      assert.ok(l.use, l.name + ' has no description');
    }
    total += e.libs.length;
  }
  assert.ok(total >= 80, 'expected a real shelf, got ' + total + ' libraries');
  // The staples must be there.
  assert.ok(devlibs.CATALOG.python.libs.some((l) => l.name === 'numpy'));
  assert.ok(devlibs.CATALOG.javascript.libs.some((l) => l.name === 'express'));
  assert.ok(devlibs.CATALOG.frontend.libs.some((l) => l.name === 'tailwindcss'));
});

test('the shelf is served with which managers are installed here', async () => {
  const token = (await (await api('/api/login', { method: 'POST', body: ADMIN })).json()).token;
  const d = await (await api('/api/admin/devlibs', { token })).json();
  assert.ok(Array.isArray(d.catalog) && d.catalog.length >= 10);
  for (const c of d.catalog) {
    assert.ok(c.id && c.label && c.manager);
    assert.equal(typeof c.ready, 'boolean', c.id + ' must say whether its manager is installed');
  }
  assert.ok(d.tools && 'node' in d.tools, 'the toolchain probe must report node');
});

test('the download planner never runs an install script', () => {
  const devlibs = require(path.join(ROOT, 'devlibs.js'));
  // npm goes through `npm pack` (no scripts), pip through `pip download`
  // (no install). Assert the commands are the download-only ones.
  const npm = devlibs.plan('javascript', '/tmp/x', ['express']);
  assert.equal(npm.cmd, 'npm');
  assert.equal(npm.args[0], 'pack', 'npm must use pack, never install');
  const pip = devlibs.plan('python', '/tmp/x', ['requests']);
  assert.equal(pip.args[0], '-m');
  assert.deepEqual(pip.args.slice(1, 3), ['pip', 'download'], 'pip must download, never install');
  assert.ok(!pip.args.includes('install'));
});

test('an unknown language is refused, not guessed', async () => {
  const token = (await (await api('/api/login', { method: 'POST', body: ADMIN })).json()).token;
  const r = await api('/api/admin/devlibs/download', { method: 'POST', token, body: { lang: 'cobol' } });
  assert.equal(r.status, 400);
});

test('the shelf is admin-only', async () => {
  const token = (await (await api('/api/login', { method: 'POST', body: ADMIN })).json()).token;
  const kid = await mkUser(token, 'shelfkid', 'pass12345');
  assert.equal((await api('/api/admin/devlibs', { token: kid })).status, 403);
  assert.equal((await api('/api/admin/devlibs/download', { method: 'POST', token: kid, body: { lang: 'python' } })).status, 403);
});

// ---- Local HTTPS: the self-signed certificate (selfsign.js) ----
// The phone's Web Bluetooth / Web Serial need a "secure context" (https or
// localhost). Over http://192.168.x.x they are simply absent. selfsign.js makes
// a certificate with pure Node so HTTPS can turn on without OpenSSL or any new
// dependency. These assert the cert is real: Node parses it, it self-verifies,
// the key matches, and the LAN IPs are in the SAN.
test('selfsign builds a cert Node can parse, that self-verifies and matches its key', () => {
  const crypto = require('node:crypto');
  const selfsign = require(path.join(ROOT, 'selfsign.js'));
  const g = selfsign.generate({ hostnames: ['setayesh.local'], ips: ['192.168.1.50'], days: 825 });
  const x = new crypto.X509Certificate(g.certPem);
  assert.match(x.subject, /CN=Setayesh/);
  assert.equal(x.subject, x.issuer, 'self-signed: subject must equal issuer');
  assert.equal(x.verify(x.publicKey), true, 'the cert must verify against its own key');
  assert.equal(x.checkPrivateKey(crypto.createPrivateKey(g.keyPem)), true, 'the private key must match the cert');
  // SANs cover localhost, loopback and the real LAN IP.
  assert.match(x.subjectAltName, /192\.168\.1\.50/);
  assert.match(x.subjectAltName, /127\.0\.0\.1/);
  assert.match(x.subjectAltName, /localhost/);
  assert.ok(new Date(x.validTo).getTime() > Date.now(), 'cert must not be pre-expired');
});

test('selfsign.ensure writes files once, then leaves a valid cert alone but renews for a new LAN IP', () => {
  const crypto = require('node:crypto');
  const selfsign = require(path.join(ROOT, 'selfsign.js'));
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'setayesh-tls-'));
  const certPath = path.join(dir, 'tls-cert.pem');
  const keyPath = path.join(dir, 'tls-key.pem');
  try {
    // first call creates the files
    const first = selfsign.ensure({ certPath, keyPath, ips: ['10.0.0.5'] });
    assert.ok(first && first.created, 'first call must generate');
    assert.equal(first.reason, 'missing');
    assert.ok(fs.existsSync(certPath) && fs.existsSync(keyPath));
    const serial1 = new crypto.X509Certificate(fs.readFileSync(certPath)).serialNumber;
    // second call with the same IPs must NOT regenerate (no churn on every boot)
    const second = selfsign.ensure({ certPath, keyPath, ips: ['10.0.0.5'] });
    assert.equal(second, null, 'a still-valid cert that covers the IPs is left untouched');
    const serial2 = new crypto.X509Certificate(fs.readFileSync(certPath)).serialNumber;
    assert.equal(serial1, serial2, 'the cert file must be unchanged');
    // a NEW real LAN ip must trigger a fresh cert that covers it
    const third = selfsign.ensure({ certPath, keyPath, ips: ['10.0.0.5', '192.168.8.8'] });
    assert.ok(third && third.created, 'a new address must renew the cert');
    assert.match(new crypto.X509Certificate(fs.readFileSync(certPath)).subjectAltName, /192\.168\.8\.8/);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test('selfsign rejects a bogus IP but still emits a usable cert', () => {
  const crypto = require('node:crypto');
  const selfsign = require(path.join(ROOT, 'selfsign.js'));
  const g = selfsign.generate({ ips: ['999.1.1.1', '192.168.2.2'] });
  const x = new crypto.X509Certificate(g.certPem);
  assert.doesNotMatch(x.subjectAltName, /999\.1\.1\.1/, 'an invalid IP must not land in the SAN');
  assert.match(x.subjectAltName, /192\.168\.2\.2/);
});

test('secure-link: admin can read state and turn on HTTPS, family cannot', async () => {
  const token = (await (await api('/api/login', { method: 'POST', body: ADMIN })).json()).token;
  // admin reads current state
  const st = await (await api('/api/admin/secure-link', { token })).json();
  assert.equal(typeof st.on, 'boolean');
  assert.ok(Array.isArray(st.urls));
  // family account is refused on both verbs
  const kid = await mkUser(token, 'securekid', 'pass12345');
  assert.equal((await api('/api/admin/secure-link', { token: kid })).status, 403);
  assert.equal((await api('/api/admin/secure-link', { method: 'POST', token: kid, body: { on: true } })).status, 403);
  // admin turns it on — the cert is generated on the spot, into the temp dir
  const on = await (await api('/api/admin/secure-link', { method: 'POST', token, body: { on: true } })).json();
  assert.equal(on.ok, true);
  assert.equal(on.on, true);
  assert.equal(on.generated, true, 'enabling must generate the cert immediately');
  const crypto = require('node:crypto');
  const x = new crypto.X509Certificate(fs.readFileSync(path.join(tmp, 'tls-cert.pem')));
  assert.match(x.subject, /CN=Setayesh/);
  // turning it back off must not throw
  const off = await (await api('/api/admin/secure-link', { method: 'POST', token, body: { on: false } })).json();
  assert.equal(off.ok, true);
  assert.equal(off.on, false);
});

// ---- App icon = the owner's face (v9.9.91) ----
// The shell referenced /manifest.webmanifest and /icon-*.png but the files
// never existed, so the phone's "add to home screen" fell back to a generic
// "S". These assert the manifest and icon endpoints answer, and that the
// bundled default star tiles are real PNGs (the fallback when no face is set).
test('the web manifest is served with icons', async () => {
  const r = await fetch(BASE + '/manifest.webmanifest');
  assert.equal(r.ok, true);
  const m = await r.json();
  assert.equal(m.name, 'Setayesh AI');
  assert.ok(Array.isArray(m.icons) && m.icons.length >= 2);
  assert.ok(m.icons.some((i) => i.src === '/icon-192.png'));
  assert.ok(m.icons.some((i) => i.src === '/icon-512.png'));
});

test('the app icon endpoints serve a PNG (the star default when no face is set)', async () => {
  for (const size of ['192', '512']) {
    const r = await fetch(BASE + `/icon-${size}.png`);
    assert.equal(r.ok, true, `icon-${size} must be served`);
    assert.match(r.headers.get('content-type') || '', /image\/png/);
    const buf = Buffer.from(await r.arrayBuffer());
    // PNG magic number
    assert.deepEqual(buf.slice(0, 4), Buffer.from([0x89, 0x50, 0x4e, 0x47]), `icon-${size} must be a real PNG`);
  }
});

test('the bundled default icon files exist on disk and are PNGs', () => {
  for (const f of ['public/icon-192.png', 'public/icon-512.png']) {
    const p = path.join(ROOT, f);
    assert.ok(fs.existsSync(p), `${f} must be committed`);
    const head = fs.readFileSync(p).slice(0, 4);
    assert.deepEqual(head, Buffer.from([0x89, 0x50, 0x4e, 0x47]), `${f} must be a PNG`);
  }
});

// ---- Routing: chat must not be forced onto the code-completion model ----
// Mistral's first-listed model is Codestral (code-only); sending Persian chat
// there produced English, tool-refusing answers. The fix picks the engine's
// GENERAL model for non-code questions, so the provider must actually offer one.
test('the Mistral engine offers a general (non-code) model for chat', () => {
  const providers = require(path.join(ROOT, 'providers.js')).PROVIDERS;
  const mistral = providers.mistral;
  assert.ok(mistral, 'mistral provider must exist');
  const general = (mistral.models || []).find((m) => m.best !== 'code');
  assert.ok(general, 'mistral must list a non-code model so chat is not stuck on Codestral');
});

// ---- Internal search engine (insight.js): Setayesh's memory/repos search ----
// جاوید asked for a strong internal search engine fully at the brain's disposal,
// with short- and long-term memory. These assert BM25 ranking finds the right
// item and that privacy scoping holds (one member never sees another's private
// notes; shared repo/knowledge is visible to all; admin sees everything).
test('insight ranks the on-topic document first (BM25)', () => {
  const { makeInsight } = require(path.join(ROOT, 'insight.js'));
  const ix = makeInsight();
  ix.register('docs', () => ([
    { id: 'a', user: '', source: 'knowledge', title: 'خرید نان', text: 'یادداشت درباره خرید نان و شیر از مغازه' },
    { id: 'b', user: '', source: 'knowledge', title: 'قرار دندانپزشک', text: 'قرار ملاقات دندانپزشکی برای پنجشنبه' },
    { id: 'c', user: '', source: 'docs', title: 'راهنما', text: 'متن بی‌ربط درباره چیز دیگری' },
  ]));
  ix.reindex();
  const hits = ix.search('دندانپزشک پنجشنبه', { limit: 3 });
  assert.ok(hits.length >= 1);
  assert.equal(hits[0].id, 'b', 'the dentist note must rank first');
});

test('insight keeps private docs private but shares repo/knowledge', () => {
  const { makeInsight } = require(path.join(ROOT, 'insight.js'));
  const ix = makeInsight();
  ix.register('mem', () => ([
    { id: 'ja', user: 'javid', source: 'memory', title: '', text: 'راز مالیات جاوید' },
    { id: 'sa', user: 'sara',  source: 'memory', title: '', text: 'راز مدرسه سارا' },
    { id: 'sh', user: '',      source: 'knowledge', title: 'راز', text: 'دانش مشترک خانواده راز' },
  ]));
  ix.reindex();
  // sara searching "راز": sees her own + the shared one, never javid's
  const sara = ix.search('راز', { user: 'sara', limit: 10 }).map((h) => h.id);
  assert.ok(sara.includes('sa') && sara.includes('sh'), 'sara sees her own + shared');
  assert.ok(!sara.includes('ja'), 'sara must NOT see javid\'s private memory');
  // admin (all) sees everything
  const admin = ix.search('راز', { all: true, limit: 10 }).map((h) => h.id);
  assert.ok(admin.includes('ja') && admin.includes('sa') && admin.includes('sh'), 'admin sees all');
});

test('insight can filter by source and reindexes live changes', () => {
  const { makeInsight } = require(path.join(ROOT, 'insight.js'));
  const ix = makeInsight();
  let extra = [];
  ix.register('self', () => ([{ id: 's1', user: '', source: 'self', title: 'index.js', text: 'سرور اصلی و مسیرها' }]));
  ix.register('mem', () => extra);
  ix.reindex();
  assert.equal(ix.search('سرور', { sources: ['self'], limit: 5 })[0].source, 'self');
  assert.equal(ix.search('سرور', { sources: ['mem'], limit: 5 }).length, 0, 'source filter excludes other sources');
  // a newly added memory becomes searchable after reindex
  extra = [{ id: 'm9', user: 'javid', source: 'memory', title: '', text: 'قرار مهم فردا ساعت ده' }];
  ix.reindex();
  assert.ok(ix.search('قرار فردا', { user: 'javid', limit: 5 }).some((h) => h.id === 'm9'));
});

// ---- Local models: add a name → local engine auto-connects (v9.9.95) ----
// جاوید wanted to just type his Ollama model name and have it work with no
// other settings. Saving a model must flip the local engine ON by itself.
test('adding a local model name auto-enables the local engine', async () => {
  const token = (await (await api('/api/login', { method: 'POST', body: ADMIN })).json()).token;
  // before: local not configured
  let cfg = await (await api('/api/config', { token })).json();
  const localBefore = (cfg.providers || []).find((p) => p.id === 'local');
  assert.ok(localBefore && !localBefore.configured, 'local starts not configured');
  // add a model name (as the UI does)
  const r = await (await api('/api/admin/local-models', { method: 'POST', token, body: { models: ['qwen2.5'] } })).json();
  assert.equal(r.ok, true);
  assert.deepEqual(r.active, ['qwen2.5']);
  assert.equal(r.localEnabled, true, 'saving a model must auto-enable local');
  // after: /api/config now shows local configured, with the model listed
  cfg = await (await api('/api/config', { token })).json();
  const localAfter = (cfg.providers || []).find((p) => p.id === 'local');
  assert.ok(localAfter && localAfter.configured, 'local must be configured now');
  assert.ok((localAfter.models || []).some((m) => m.id === 'qwen2.5'), 'the model must be listed');
});

// ---- Full-app audit fix (v9.9.97): connector precondition status ----
// A "Google isn't connected yet" call must read as a clean precondition (409),
// not a scary upstream failure (502) or a crash (500). Found in the route sweep.
test('gmail/calendar endpoints answer 409 (not 502/500) when Google is not connected', async () => {
  const token = (await (await api('/api/login', { method: 'POST', body: ADMIN })).json()).token;
  for (const p of ['/api/connectors/gmail', '/api/connectors/calendar']) {
    const r = await api(p, { token });
    assert.equal(r.status, 409, `${p} must be 409 when not connected`);
    const d = await r.json();
    assert.equal(d.connected, false);
  }
});

// ---- Automatic self-learning (v9.9.98): grow from conversation ----
// A message that clearly states something durable should be filed in long-term
// memory on its own — no tool call, no engine needed (it runs before the engine
// and survives even the no-engine degraded path). This is the "grows every
// moment" behaviour جاوید asked for.
test('an explicit "remember ..." message is auto-learned into memory', async () => {
  const token = (await (await api('/api/login', { method: 'POST', body: ADMIN })).json()).token;
  const before = (await (await api('/api/memory', { token })).json()).memory || [];
  // no engine configured in tests → chat returns a graceful 200; autoLearn still runs.
  // Use multipart (FormData), exactly like the real client, so req.body.message is read.
  const form = new FormData();
  form.set('message', 'یادت باشه قرار مهم من پنجشنبه ساعت ده است');
  form.set('history', '[]'); form.set('mode', 'chat');
  await fetch(BASE + '/api/chat', { method: 'POST', headers: { Authorization: 'Bearer ' + token }, body: form });
  // give the setImmediate hook a moment, then read memory back
  await new Promise((r) => setTimeout(r, 400));
  const after = (await (await api('/api/memory', { token })).json()).memory || [];
  assert.ok(after.length > before.length, 'a new memory should have been learned automatically');
  assert.ok(after.some((m) => /پنجشنبه|قرار مهم/.test(m.text)), 'the learned fact should be the stated commitment');
});
