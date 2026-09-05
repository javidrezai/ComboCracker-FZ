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
