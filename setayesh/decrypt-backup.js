#!/usr/bin/env node
'use strict';

// Setayesh AI — decrypt an encrypted backup (.enc) produced by the app.
// Zero dependencies: Node's built-in crypto only, so it runs anywhere.
//
// Usage:
//   node decrypt-backup.js backup-YYYY-....enc [output.zip]
// The passphrase is read from the SETAYESH_BACKUP_PASSPHRASE env var, or
// prompted for. The result is a normal .zip you can open.
//
// Format (must match runEncryptedBackup in index.js):
//   magic "STYS1"(5) | salt(16) | iv(12) | authTag(16) | ciphertext (AES-256-GCM)

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

function die(msg) { console.error('  ✗ ' + msg); process.exit(1); }

const inPath = process.argv[2];
if (!inPath) die('Usage: node decrypt-backup.js <file.enc> [output.zip]');
if (!fs.existsSync(inPath)) die('File not found: ' + inPath);
const outPath = process.argv[3] || inPath.replace(/\.enc$/i, '') + '.zip';

const blob = fs.readFileSync(inPath);
// Two backup formats exist, with the same AES-256-GCM + scrypt body but a
// different magic header: 'STYS1' (auto/Drive backups) and 'SETAYESH-ENC-V1'
// (the "cloud export" download). Accept EITHER, skipping the right header.
let hdr = 0;
if (blob.slice(0, 5).toString('ascii') === 'STYS1') hdr = 5;
else if (blob.slice(0, 15).toString('ascii') === 'SETAYESH-ENC-V1') hdr = 15;
if (!hdr || blob.length < hdr + 44) {
  die('Not a Setayesh encrypted backup (bad header).');
}
const salt = blob.slice(hdr, hdr + 16);
const iv = blob.slice(hdr + 16, hdr + 28);
const tag = blob.slice(hdr + 28, hdr + 44);
const ciphertext = blob.slice(hdr + 44);

function withPass(pass) {
  if (!pass || pass.length < 1) die('No passphrase given.');
  let out;
  try {
    const key = crypto.scryptSync(pass, salt, 32);
    const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
    decipher.setAuthTag(tag);
    out = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
  } catch (e) {
    die('Wrong passphrase, or the file is corrupted.');
  }
  fs.writeFileSync(outPath, out);
  console.log('  ✓ Decrypted → ' + path.resolve(outPath) + '  (' + out.length + ' bytes)');
}

const envPass = process.env.SETAYESH_BACKUP_PASSPHRASE;
if (envPass) { withPass(envPass); }
else {
  const rl = require('readline').createInterface({ input: process.stdin, output: process.stdout });
  rl.question('Passphrase: ', (answer) => { rl.close(); withPass((answer || '').trim()); });
}
