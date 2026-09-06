'use strict';

// Setayesh AI — external connectors.
//
// First connector: Google (Gmail + Calendar) over OAuth2. No new dependency —
// Google's REST APIs are plain HTTPS and Node 18+ ships a global fetch.
//
// The owner registers a Google OAuth client (Google Cloud Console → APIs &
// Services → Credentials → OAuth client, type "Web application") and pastes the
// Client ID and Secret in the Connectors panel. The one redirect URI to add
// there is shown in the panel (…/api/oauth/google/callback). After a one-time
// consent, a refresh token is stored locally (0600, never committed) and the
// app mints short-lived access tokens itself from then on.
//
// SECURITY: tokens live only in the local store file next to the app. The
// scopes are the minimum for read + send mail and creating calendar events.

const fs = require('fs');

const GOOGLE_SCOPES = [
  'https://www.googleapis.com/auth/gmail.readonly',
  'https://www.googleapis.com/auth/gmail.send',
  'https://www.googleapis.com/auth/calendar.events',
  'https://www.googleapis.com/auth/calendar.readonly',
  // drive.file = least privilege: the app can only see/manage files IT created
  // (used to upload encrypted backups), never the rest of the owner's Drive.
  'https://www.googleapis.com/auth/drive.file',
  'openid', 'email', 'profile',
];

// opts.storeFile: absolute path for the token store (should be gitignored).
// opts.getCfg():  returns the live config object (GOOGLE_CLIENT_ID/SECRET).
function makeConnectors(opts) {
  const STORE = opts.storeFile;
  const getCfg = opts.getCfg || (() => ({}));
  let state = load();

  function load() { try { return JSON.parse(fs.readFileSync(STORE, 'utf8')); } catch (e) { return {}; } }
  function save() { try { fs.writeFileSync(STORE, JSON.stringify(state), { mode: 0o600 }); } catch (e) {} }

  function creds() { const c = getCfg() || {}; return { id: c.GOOGLE_CLIENT_ID || '', secret: c.GOOGLE_CLIENT_SECRET || '' }; }
  function configured() { const c = creds(); return !!(c.id && c.secret); }
  function connected() { return !!(state.google && state.google.refresh_token); }

  function authUrl(redirectUri, stateTok) {
    const c = creds();
    const p = new URLSearchParams({
      client_id: c.id,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: GOOGLE_SCOPES.join(' '),
      access_type: 'offline',
      include_granted_scopes: 'true',
      prompt: 'consent',
      state: stateTok || '',
    });
    return 'https://accounts.google.com/o/oauth2/v2/auth?' + p.toString();
  }

  async function exchangeCode(code, redirectUri) {
    const c = creds();
    const body = new URLSearchParams({
      code, client_id: c.id, client_secret: c.secret,
      redirect_uri: redirectUri, grant_type: 'authorization_code',
    });
    const r = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body,
    });
    const d = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(d.error_description || d.error || 'token exchange failed');
    state.google = state.google || {};
    if (d.refresh_token) state.google.refresh_token = d.refresh_token;
    state.google.access_token = d.access_token;
    state.google.expiry = Date.now() + ((d.expires_in || 3500) * 1000);
    state.google.connectedAt = new Date().toISOString();
    save();
    // Best-effort: record which mailbox this is, for display.
    try { const who = await apiGet('https://www.googleapis.com/oauth2/v2/userinfo'); state.google.email = who.email || ''; save(); } catch (e) {}
    return true;
  }

  async function accessToken() {
    if (!connected()) throw new Error('Google متصل نیست — از پنل کانکتورها وصل کن.');
    const g = state.google;
    if (g.access_token && g.expiry && Date.now() < g.expiry - 30000) return g.access_token;
    const c = creds();
    const body = new URLSearchParams({
      client_id: c.id, client_secret: c.secret,
      refresh_token: g.refresh_token, grant_type: 'refresh_token',
    });
    const r = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body,
    });
    const d = await r.json().catch(() => ({}));
    if (!r.ok) {
      // A revoked/expired refresh token means the owner must reconnect.
      if (/invalid_grant/.test(d.error || '')) { state.google = null; save(); }
      throw new Error(d.error_description || d.error || 'token refresh failed');
    }
    g.access_token = d.access_token;
    g.expiry = Date.now() + ((d.expires_in || 3500) * 1000);
    save();
    return g.access_token;
  }

  async function apiGet(url) {
    const t = await accessToken();
    const r = await fetch(url, { headers: { Authorization: 'Bearer ' + t } });
    const d = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error((d.error && (d.error.message || d.error)) || ('HTTP ' + r.status));
    return d;
  }
  async function apiPost(url, payload) {
    const t = await accessToken();
    const r = await fetch(url, {
      method: 'POST',
      headers: { Authorization: 'Bearer ' + t, 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const d = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error((d.error && (d.error.message || d.error)) || ('HTTP ' + r.status));
    return d;
  }

  // ---------------- Gmail ----------------
  function b64urlDecode(s) {
    try { return Buffer.from(String(s).replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf8'); }
    catch (e) { return ''; }
  }
  function extractBody(payload) {
    if (!payload) return '';
    if (payload.body && payload.body.data && (payload.mimeType || '').startsWith('text/')) return b64urlDecode(payload.body.data);
    for (const p of payload.parts || []) if (p.mimeType === 'text/plain' && p.body && p.body.data) return b64urlDecode(p.body.data);
    for (const p of payload.parts || []) { const b = extractBody(p); if (b) return b; }
    return '';
  }

  async function gmailList(limit) {
    const n = Math.max(1, Math.min(25, Number(limit) || 10));
    const d = await apiGet('https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=' + n + '&q=' + encodeURIComponent('in:inbox'));
    const out = [];
    for (const m of (d.messages || []).slice(0, n)) {
      try {
        const msg = await apiGet('https://gmail.googleapis.com/gmail/v1/users/me/messages/' + m.id +
          '?format=metadata&metadataHeaders=From&metadataHeaders=Subject&metadataHeaders=Date');
        const h = {}; (msg.payload && msg.payload.headers || []).forEach((x) => { h[x.name.toLowerCase()] = x.value; });
        out.push({
          id: m.id, from: h.from || '', subject: h.subject || '(بدون موضوع)',
          date: h.date || '', snippet: (msg.snippet || '').slice(0, 240),
          unread: (msg.labelIds || []).includes('UNREAD'),
        });
      } catch (e) { /* skip a single unreadable message */ }
    }
    return { messages: out };
  }

  async function gmailGet(id) {
    const msg = await apiGet('https://gmail.googleapis.com/gmail/v1/users/me/messages/' + encodeURIComponent(id) + '?format=full');
    const h = {}; (msg.payload && msg.payload.headers || []).forEach((x) => { h[x.name.toLowerCase()] = x.value; });
    return {
      id, from: h.from || '', to: h.to || '', subject: h.subject || '',
      date: h.date || '', body: (extractBody(msg.payload) || msg.snippet || '').slice(0, 8000),
    };
  }

  function encodeSubject(s) {
    if (/^[\x00-\x7F]*$/.test(s)) return s;               // ASCII stays as-is
    return '=?UTF-8?B?' + Buffer.from(s, 'utf8').toString('base64') + '?=';   // RFC 2047
  }
  async function gmailSend(o) {
    o = o || {};
    if (!o.to) throw new Error('گیرنده (to) لازم است.');
    const lines = [
      'To: ' + o.to,
      'Subject: ' + encodeSubject(o.subject || ''),
      'Content-Type: text/plain; charset=UTF-8',
      'MIME-Version: 1.0',
      '',
      o.body || '',
    ];
    const raw = Buffer.from(lines.join('\r\n'), 'utf8').toString('base64')
      .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    const d = await apiPost('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', { raw });
    return { id: d.id, sent: true };
  }

  // ---------------- Calendar ----------------
  function whenPart(v) {
    if (!v) return null;
    if (/^\d{4}-\d{2}-\d{2}$/.test(v)) return { date: v };           // all-day
    const dt = new Date(v);
    if (isNaN(dt.getTime())) throw new Error('زمان نامعتبر: ' + v);
    return { dateTime: dt.toISOString() };
  }
  async function calendarList(max) {
    const n = Math.max(1, Math.min(25, Number(max) || 10));
    const now = new Date().toISOString();
    const d = await apiGet('https://www.googleapis.com/calendar/v3/calendars/primary/events?singleEvents=true&orderBy=startTime&timeMin=' +
      encodeURIComponent(now) + '&maxResults=' + n);
    return {
      events: (d.items || []).map((e) => ({
        id: e.id, title: e.summary || '(بدون عنوان)',
        start: (e.start && (e.start.dateTime || e.start.date)) || '',
        end: (e.end && (e.end.dateTime || e.end.date)) || '',
        location: e.location || '', link: e.htmlLink || '',
      })),
    };
  }
  async function calendarAdd(o) {
    o = o || {};
    if (!o.title || !o.start) throw new Error('عنوان و زمان شروع لازم است.');
    const start = whenPart(o.start);
    let end = o.end ? whenPart(o.end) : null;
    if (!end) {
      end = start.dateTime
        ? { dateTime: new Date(new Date(start.dateTime).getTime() + 3600000).toISOString() }   // +1h default
        : { date: start.date };
    }
    const d = await apiPost('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
      summary: o.title, description: o.description || '', location: o.location || '', start, end,
    });
    return { id: d.id, link: d.htmlLink || '', created: true };
  }

  // ---------------- Drive (encrypted-backup upload) ----------------
  async function driveEnsureFolder(name) {
    const q = `name='${String(name).replace(/'/g, "\\'")}' and mimeType='application/vnd.google-apps.folder' and trashed=false`;
    const found = await apiGet('https://www.googleapis.com/drive/v3/files?spaces=drive&fields=files(id)&q=' + encodeURIComponent(q));
    if (found.files && found.files.length) return found.files[0].id;
    const created = await apiPost('https://www.googleapis.com/drive/v3/files', { name, mimeType: 'application/vnd.google-apps.folder' });
    return created.id;
  }
  async function driveUpload(o) {
    o = o || {};
    const name = o.name || 'backup';
    const data = Buffer.isBuffer(o.data) ? o.data : Buffer.from(o.data || '');
    if (!data.length) throw new Error('دادهٔ فایل خالی است.');
    const mime = o.mimeType || 'application/octet-stream';
    const t = await accessToken();
    let parents;
    try { const fid = await driveEnsureFolder(o.folder || 'Setayesh Backups'); if (fid) parents = [fid]; } catch (e) { /* upload to root if the folder step fails */ }
    const meta = parents ? { name, parents } : { name };
    const boundary = '----setayesh' + Date.now().toString(36) + Math.random().toString(36).slice(2);
    const body = Buffer.concat([
      Buffer.from(`--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n`),
      Buffer.from(JSON.stringify(meta)),
      Buffer.from(`\r\n--${boundary}\r\nContent-Type: ${mime}\r\n\r\n`),
      data,
      Buffer.from(`\r\n--${boundary}--\r\n`),
    ]);
    const r = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,webViewLink,size', {
      method: 'POST',
      headers: { Authorization: 'Bearer ' + t, 'Content-Type': `multipart/related; boundary=${boundary}` },
      body,
    });
    const d = await r.json().catch(() => ({}));
    if (!r.ok) {
      if (r.status === 403 || /insufficient|scope/i.test(JSON.stringify(d))) {
        throw new Error('دسترسی Drive داده نشده — از پنل کانکتورها یک بار دوباره «اتصال به گوگل» را بزن تا دسترسی درایو اضافه شود.');
      }
      throw new Error((d.error && (d.error.message || d.error)) || ('HTTP ' + r.status));
    }
    return { id: d.id, name: d.name, link: d.webViewLink || '', bytes: data.length };
  }

  function status() {
    return {
      id: 'google',
      configured: configured(),
      connected: connected(),
      email: (state.google && state.google.email) || '',
      connectedAt: (state.google && state.google.connectedAt) || '',
      scopes: GOOGLE_SCOPES,
    };
  }
  function disconnect() { state.google = null; save(); return true; }

  return {
    GOOGLE_SCOPES,
    configured, connected, status, disconnect,
    authUrl, exchangeCode,
    gmailList, gmailGet, gmailSend,
    calendarList, calendarAdd,
    driveUpload,
  };
}

module.exports = { makeConnectors, GOOGLE_SCOPES };
