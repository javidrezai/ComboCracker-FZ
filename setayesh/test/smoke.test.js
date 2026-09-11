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
