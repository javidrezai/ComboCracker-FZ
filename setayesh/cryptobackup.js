'use strict';
// Encrypted-backup envelope, split out of index.js (pure over Node crypto).
// A backup is encrypted HERE with a passphrase only the owner knows, before it
// ever leaves the machine, so a cloud drive only ever stores an opaque blob.
// Layout: marker | salt(16) | iv(12) | tag(16) | ciphertext. scrypt derives the
// key; AES-256-GCM authenticates, so a wrong passphrase or tampered blob throws.
const crypto = require('crypto');

const CLOUD_MARKER = 'SETAYESH-ENC-V1';
// The auto/Drive backup path (runEncryptedBackup) writes the same body under a
// shorter legacy magic. Same salt/iv/tag/cipher layout, so decryptBuffer accepts
// either header — an exported backup and a Drive backup both open here and with
// the standalone decrypt-backup.js.
const LEGACY_MARKER = 'STYS1';

function encryptBuffer(plain, passphrase) {
  const salt = crypto.randomBytes(16);
  const key = crypto.scryptSync(String(passphrase), salt, 32, { N: 16384, r: 8, p: 1 });
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const enc = Buffer.concat([cipher.update(plain), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([Buffer.from(CLOUD_MARKER, 'utf8'), salt, iv, tag, enc]);
}

function decryptBuffer(blob, passphrase) {
  let o;
  if (blob.slice(0, CLOUD_MARKER.length).equals(Buffer.from(CLOUD_MARKER, 'utf8'))) o = CLOUD_MARKER.length;
  else if (blob.slice(0, LEGACY_MARKER.length).equals(Buffer.from(LEGACY_MARKER, 'utf8'))) o = LEGACY_MARKER.length;
  else throw new Error('این فایل پشتیبان ستایش نیست.');
  const salt = blob.slice(o, o += 16);
  const iv   = blob.slice(o, o += 12);
  const tag  = blob.slice(o, o += 16);
  const data = blob.slice(o);
  const key = crypto.scryptSync(String(passphrase), salt, 32, { N: 16384, r: 8, p: 1 });
  const d = crypto.createDecipheriv('aes-256-gcm', key, iv);
  d.setAuthTag(tag);
  return Buffer.concat([d.update(data), d.final()]);   // throws if the passphrase is wrong
}

module.exports = { CLOUD_MARKER, LEGACY_MARKER, encryptBuffer, decryptBuffer };
