'use strict';
const os = require('os');

// Small, dependency-free network/version helpers, split out of index.js as part
// of the ongoing "break the monolith into modules" work. Pure functions only —
// no shared server state — so they are safe to move and easy to test.

// Is version string a strictly newer than b (semantic-ish, 3 parts)?
function versionGreater(a, b) {
  const pa = String(a).split('.').map(Number), pb = String(b).split('.').map(Number);
  for (let i = 0; i < 3; i++) {
    if ((pa[i] || 0) > (pb[i] || 0)) return true;
    if ((pa[i] || 0) < (pb[i] || 0)) return false;
  }
  return false;
}

// This machine's LAN IPv4 addresses, best-first. Real home-network (RFC1918)
// addresses rank ahead of VPN/virtual adapters (e.g. Radmin/Hamachi 25.x/26.x)
// so the QR / phone link uses the Wi-Fi IP.
function localLanIps() {
  const nets = os.networkInterfaces();
  const out = [];
  for (const name of Object.keys(nets)) {
    for (const ni of nets[name] || []) {
      if (ni.family === 'IPv4' && !ni.internal && !ni.address.startsWith('169.')) {
        out.push(ni.address);
      }
    }
  }
  const rank = (ip) => ip.startsWith('192.168.') ? 0
    : ip.startsWith('10.') ? 1
    : /^172\.(1[6-9]|2\d|3[01])\./.test(ip) ? 2 : 3;
  return out.sort((a, b) => rank(a) - rank(b));
}

module.exports = { versionGreater, localLanIps };
