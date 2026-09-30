'use strict';
// Read-only IMAP mail client, split out of index.js. A tiny hand-rolled IMAP
// client over TLS (connect → login → SELECT INBOX → fetch header fields) —
// enough for "check my email", nothing more; it can never send. Built as a
// factory so it reads the live config through getCfg() and keeps no state.
const tls = require('tls');

const MAIL_PRESETS = {
  gmail:   { host: 'imap.gmail.com',       port: 993, label: 'Gmail',   help: 'https://myaccount.google.com/apppasswords' },
  outlook: { host: 'outlook.office365.com',port: 993, label: 'Outlook', help: 'https://account.live.com/proofs/AppPassword' },
  yahoo:   { host: 'imap.mail.yahoo.com',  port: 993, label: 'Yahoo',   help: 'https://login.yahoo.com/account/security' },
};

function makeMail(deps) {
  const getCfg = (deps && deps.getCfg) || (() => ({}));

  function mailConfigured() {
    const cfg = getCfg() || {};
    return Boolean(cfg.MAIL_USER && cfg.MAIL_PASS && (cfg.MAIL_HOST || MAIL_PRESETS[cfg.MAIL_PROVIDER || '']));
  }

  function mailHost() {
    const cfg = getCfg() || {};
    if (cfg.MAIL_HOST) return { host: cfg.MAIL_HOST, port: Number(cfg.MAIL_PORT) || 993 };
    const p = MAIL_PRESETS[cfg.MAIL_PROVIDER || 'gmail'];
    return { host: p.host, port: p.port };
  }

  function imapFetch(opts) {
    return new Promise((resolve, reject) => {
      const cfg = getCfg() || {};
      const { host, port } = mailHost();
      const limit = Math.max(1, Math.min(25, Number(opts.limit) || 10));
      let tag = 0, buf = '', step = 'greet', done = false;
      const results = [];
      const nextTag = () => 'A' + (++tag).toString().padStart(3, '0');
      let curTag = '';

      const sock = tls.connect({ host, port, servername: host, rejectUnauthorized: true }, () => {});
      const finish = (err, data) => {
        if (done) return; done = true;
        try { sock.end(); } catch (e) {}
        err ? reject(err) : resolve(data);
      };
      const timer = setTimeout(() => finish(new Error('اتصال به سرور ایمیل زمان‌بر شد.')), 20000);

      const send = (cmd) => { curTag = nextTag(); sock.write(curTag + ' ' + cmd + '\r\n'); };

      sock.on('error', (e) => { clearTimeout(timer); finish(new Error('اتصال ناموفق: ' + e.message)); });
      sock.on('data', (chunk) => {
        buf += chunk.toString('utf8');
        if (step === 'greet' && /^\* OK/m.test(buf)) {
          buf = ''; step = 'login';
          send('LOGIN "' + String(cfg.MAIL_USER).replace(/"/g, '') + '" "' + String(cfg.MAIL_PASS).replace(/"/g, '') + '"');
          return;
        }
        if (!buf.includes(curTag + ' ')) return;      // wait for this command to complete

        const okLine = new RegExp('^' + curTag + ' OK', 'm').test(buf);
        if (step === 'login') {
          if (!okLine) { clearTimeout(timer); return finish(new Error('ورود به ایمیل رد شد — App Password را بررسی کن.')); }
          buf = ''; step = 'select'; send('SELECT INBOX'); return;
        }
        if (step === 'select') {
          if (!okLine) { clearTimeout(timer); return finish(new Error('صندوق ورودی باز نشد.')); }
          const m = buf.match(/^\* (\d+) EXISTS/m);
          const total = m ? Number(m[1]) : 0;
          if (!total) { clearTimeout(timer); return finish(null, { total: 0, messages: [] }); }
          const from = Math.max(1, total - limit + 1);
          buf = ''; step = 'fetch';
          send(`FETCH ${from}:${total} (FLAGS BODY.PEEK[HEADER.FIELDS (FROM SUBJECT DATE)])`);
          return;
        }
        if (step === 'fetch') {
          clearTimeout(timer);
          // Parse the fetch blocks into something usable.
          const blocks = buf.split(/^\* \d+ FETCH /m).slice(1);
          for (const b of blocks) {
            const seen = /\\Seen/.test(b);
            const get = (k) => {
              const mm = b.match(new RegExp('^' + k + ':\\s*(.+)$', 'im'));
              return mm ? mm[1].trim().slice(0, 200) : '';
            };
            const subj = get('Subject'), fromH = get('From'), date = get('Date');
            if (!subj && !fromH) continue;
            results.push({ from: fromH, subject: subj, date, unread: !seen });
          }
          return finish(null, { total: results.length, messages: results.reverse() });
        }
      });
    });
  }

  return { MAIL_PRESETS, mailConfigured, mailHost, imapFetch };
}

module.exports = { makeMail, MAIL_PRESETS };
