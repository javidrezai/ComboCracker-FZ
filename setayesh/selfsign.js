'use strict';
// selfsign.js — a self-signed TLS certificate, built with nothing but Node's
// own `crypto`. No OpenSSL, no new dependency (charter rule 2.1 / 3.1).
//
// Why this exists: the phone's Web Bluetooth and Web Serial APIs only run in a
// "secure context" — https, or localhost. Over plain http://192.168.x.x they
// are simply missing, with no button to press. A real certificate (Tailscale,
// mkcert) removes the browser warning, but بابا cannot run a command line. So
// Setayesh makes its own certificate: HTTPS turns on, the phone gets its secure
// context, and the only cost is a ONE-TIME "accept this certificate" tap in the
// browser (self-signed certs always warn — there is no way around that without
// a public CA). The honest trade-off is spelled out in the UI.
//
// The certificate is an EC P-256 leaf, valid ~2 years, with Subject Alternative
// Names for localhost, 127.0.0.1, ::1 and every LAN IP we can see — so the same
// file works whether the phone opens the app by name or by address.

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

// ---------- tiny ASN.1 / DER writer ----------
function len(n) {
  if (n < 0x80) return Buffer.from([n]);
  const bytes = [];
  let v = n;
  while (v > 0) { bytes.unshift(v & 0xff); v = Math.floor(v / 256); }
  return Buffer.from([0x80 | bytes.length, ...bytes]);
}
function tlv(tag, body) {
  return Buffer.concat([Buffer.from([tag]), len(body.length), body]);
}
const SEQ = (...xs) => tlv(0x30, Buffer.concat(xs));
const SET = (...xs) => tlv(0x31, Buffer.concat(xs));
function INT(buf) {
  let b = Buffer.isBuffer(buf) ? buf : Buffer.from([buf]);
  // strip leading zero bytes (but keep one digit)
  let i = 0;
  while (i < b.length - 1 && b[i] === 0) i++;
  b = b.slice(i);
  if (b[0] & 0x80) b = Buffer.concat([Buffer.from([0]), b]); // keep it positive
  return tlv(0x02, b);
}
function OID(str) {
  const p = str.split('.').map(Number);
  const out = [40 * p[0] + p[1]];
  for (let i = 2; i < p.length; i++) {
    let v = p[i];
    const stack = [v & 0x7f];
    v = Math.floor(v / 128);
    while (v > 0) { stack.unshift((v & 0x7f) | 0x80); v = Math.floor(v / 128); }
    out.push(...stack);
  }
  return tlv(0x06, Buffer.from(out));
}
const UTF8 = (s) => tlv(0x0c, Buffer.from(s, 'utf8'));
const BOOL_TRUE = tlv(0x01, Buffer.from([0xff]));
const NULL = Buffer.from([0x05, 0x00]);
function BITSTRING(buf, unused = 0) {
  return tlv(0x03, Buffer.concat([Buffer.from([unused]), buf]));
}
function OCTET(buf) { return tlv(0x04, buf); }
function ctx(n, explicit, body) {
  // context-specific tag; explicit=true → constructed (0xA0|n), else primitive (0x80|n)
  return tlv((explicit ? 0xa0 : 0x80) | n, body);
}
function utcTime(date) {
  // YYMMDDHHMMSSZ — valid for years 1950–2049, plenty for a 2-year leaf
  const s = date.toISOString().replace(/[-:T]/g, '').slice(2, 14) + 'Z';
  return tlv(0x17, Buffer.from(s, 'ascii'));
}

// ---------- IP / name helpers ----------
function ipv4Bytes(ip) {
  const m = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/.exec(ip);
  if (!m) return null;
  const b = [1, 2, 3, 4].map((i) => Number(m[i]));
  if (b.some((x) => x < 0 || x > 255)) return null;
  return Buffer.from(b);
}
function ipv6Bytes(ip) {
  // only the forms we actually emit (::1) and simple full/compressed addresses
  if (!/^[0-9a-fA-F:]+$/.test(ip) || ip.indexOf(':') === -1) return null;
  let head = ip, tail = '';
  if (ip.includes('::')) {
    const [h, t] = ip.split('::');
    head = h; tail = t;
  }
  const hp = head ? head.split(':') : [];
  const tp = tail ? tail.split(':') : [];
  const missing = 8 - hp.length - tp.length;
  if (missing < 0) return null;
  const groups = [...hp, ...Array(ip.includes('::') ? missing : 0).fill('0'), ...tp];
  if (groups.length !== 8) return null;
  const out = Buffer.alloc(16);
  for (let i = 0; i < 8; i++) {
    const v = parseInt(groups[i] || '0', 16);
    if (Number.isNaN(v) || v < 0 || v > 0xffff) return null;
    out[i * 2] = v >> 8; out[i * 2 + 1] = v & 0xff;
  }
  return out;
}

// dNSName [2] IA5String, iPAddress [7] OCTET STRING
function sanEntries(hostnames, ips) {
  const parts = [];
  for (const h of hostnames) parts.push(tlv(0x82, Buffer.from(String(h), 'ascii')));
  for (const ip of ips) {
    const v4 = ipv4Bytes(ip);
    if (v4) { parts.push(tlv(0x87, v4)); continue; }
    const v6 = ipv6Bytes(ip);
    if (v6) parts.push(tlv(0x87, v6));
  }
  return parts;
}

function dn(cn) {
  // one RDN: commonName
  return SEQ(SET(SEQ(OID('2.5.4.3'), UTF8(cn))));
}
function extension(oidStr, critical, valueDER) {
  const items = [OID(oidStr)];
  if (critical) items.push(BOOL_TRUE);
  items.push(OCTET(valueDER));
  return SEQ(...items);
}

/**
 * Build a self-signed certificate + its private key, in PEM.
 * @param {{hostnames?:string[], ips?:string[], days?:number, cn?:string, now?:Date}} opts
 * @returns {{certPem:string, keyPem:string, notBefore:Date, notAfter:Date, subjects:string[]}}
 */
function generate(opts = {}) {
  const hostnames = Array.from(new Set(['localhost', ...(opts.hostnames || [])])).filter(Boolean);
  const ipsIn = Array.from(new Set(['127.0.0.1', '::1', ...(opts.ips || [])])).filter(Boolean);
  const validIps = ipsIn.filter((ip) => ipv4Bytes(ip) || ipv6Bytes(ip));
  const days = Math.max(1, Math.min(3650, opts.days || 825)); // ~27 months, under the 825-day browser cap
  const cn = opts.cn || 'Setayesh';
  const now = opts.now || new Date();
  const notBefore = new Date(now.getTime() - 60 * 60 * 1000);     // 1h back for clock skew
  const notAfter = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);

  const { publicKey, privateKey } = crypto.generateKeyPairSync('ec', { namedCurve: 'prime256v1' });
  const spki = publicKey.export({ type: 'spki', format: 'der' }); // this IS SubjectPublicKeyInfo

  // ecdsa-with-SHA256 : 1.2.840.10045.4.3.2  (no parameters)
  const sigAlg = SEQ(OID('1.2.840.10045.4.3.2'));

  const exts = [
    extension('2.5.29.19', true, SEQ()),                                  // basicConstraints: CA:FALSE
    extension('2.5.29.15', true, BITSTRING(Buffer.from([0x80]), 7)),      // keyUsage: digitalSignature
    extension('2.5.29.37', false, SEQ(OID('1.3.6.1.5.5.7.3.2'))),         // extKeyUsage: serverAuth
    extension('2.5.29.17', false, SEQ(...sanEntries(hostnames, validIps))), // subjectAltName
  ];

  const serial = crypto.randomBytes(16);
  serial[0] &= 0x7f; // keep the serial positive

  const tbs = SEQ(
    ctx(0, true, INT(2)),        // version v3 (value 2), [0] EXPLICIT
    INT(serial),                 // serialNumber
    sigAlg,                      // signature algorithm
    dn(cn),                      // issuer == subject (self-signed)
    SEQ(utcTime(notBefore), utcTime(notAfter)), // validity
    dn(cn),                      // subject
    spki,                        // subjectPublicKeyInfo
    ctx(3, true, SEQ(...exts)),  // extensions [3] EXPLICIT
  );

  // crypto.sign with an EC key yields a DER-encoded ECDSA signature (SEQ{r,s}),
  // which is exactly what goes inside the signatureValue BIT STRING.
  const sig = crypto.sign('SHA256', tbs, privateKey);
  const cert = SEQ(tbs, sigAlg, BITSTRING(sig, 0));

  const certPem = pem('CERTIFICATE', cert);
  const keyPem = privateKey.export({ type: 'pkcs8', format: 'pem' });

  return { certPem, keyPem, notBefore, notAfter, subjects: [...hostnames, ...validIps] };
}

function pem(label, der) {
  const b64 = der.toString('base64').replace(/(.{64})/g, '$1\n').replace(/\n$/, '');
  return `-----BEGIN ${label}-----\n${b64}\n-----END ${label}-----\n`;
}

/**
 * Make sure a usable cert+key pair exists on disk, generating one if it is
 * missing, unreadable, expiring within 30 days, or no longer covers the
 * current set of LAN IPs. Returns {created, reason, notAfter, subjects} or null
 * when nothing had to change.
 */
function ensure(opts = {}) {
  const certPath = opts.certPath || path.join(opts.dir || '.', 'tls-cert.pem');
  const keyPath = opts.keyPath || path.join(opts.dir || '.', 'tls-key.pem');
  const wantIps = Array.from(new Set(['127.0.0.1', '::1', ...(opts.ips || [])]));
  const wantNames = Array.from(new Set(['localhost', ...(opts.hostnames || [])]));

  let reason = null;
  try {
    if (!fs.existsSync(certPath) || !fs.existsSync(keyPath)) {
      reason = 'missing';
    } else {
      const x = new crypto.X509Certificate(fs.readFileSync(certPath));
      const exp = new Date(x.validTo);
      if (!(exp.getTime() > Date.now() + 30 * 24 * 60 * 60 * 1000)) reason = 'expiring';
      else {
        // Does the existing cert still cover every LAN IP we can see?
        const san = String(x.subjectAltName || '');
        const covered = (v) => san.includes(v);
        const miss = [...wantIps.filter((ip) => !covered(ip)),
                      ...wantNames.filter((n) => !covered(n))];
        // only regenerate for a *new real* LAN ip, not for cosmetic name gaps
        const missingRealIp = wantIps.some((ip) => ip !== '127.0.0.1' && ip !== '::1' && !covered(ip));
        if (missingRealIp && miss.length) reason = 'new-address';
      }
    }
  } catch (e) {
    reason = 'unreadable';
  }
  if (!reason) return null;

  const { certPem, keyPem, notAfter, subjects } = generate({ hostnames: wantNames, ips: wantIps, days: opts.days });
  fs.writeFileSync(certPath, certPem, { mode: 0o600 });
  fs.writeFileSync(keyPath, keyPem, { mode: 0o600 });
  try { fs.chmodSync(certPath, 0o600); fs.chmodSync(keyPath, 0o600); } catch (_) {}
  return { created: true, reason, notAfter, subjects, certPath, keyPath };
}

module.exports = { generate, ensure, _der: { OID, INT, SEQ, ipv4Bytes, ipv6Bytes } };
