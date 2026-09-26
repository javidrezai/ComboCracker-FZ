/* ==========================================================================
   Setayesh AI — secure-store.js
   Encrypted, expiring, device-local storage. Data lives only in THIS browser
   (localStorage, origin-scoped so no other site can read it), is encrypted at
   rest with AES-256-GCM via the Web Crypto API, and each entry carries an
   expiry after which it self-purges. Values are opaque in DevTools, so casual
   inspection reveals nothing — only the app reads them back.

   Honest limits: a browser has no true secure keystore for JS, so the key is
   derived (PBKDF2) from a per-device secret kept in this same browser. This
   defeats casual inspection, cross-site reading, and stale data — not an
   attacker with full control of the device. Never put a password or a
   long-lived server token here; use it for drafts, caches, and preferences.

   API (all async except del):
     await secureStore.set(key, value, ttlMs)   // ttlMs 0/omitted = no expiry
     await secureStore.get(key)                 // returns value or null (purges if expired)
     secureStore.del(key)
     await secureStore.purgeExpired()
   ========================================================================== */
(function () {
  'use strict';
  var NS = 'setayesh.sec.';
  var enc = new TextEncoder(), dec = new TextDecoder();

  function b64(buf) { var b = new Uint8Array(buf), s = ''; for (var i = 0; i < b.length; i++) s += String.fromCharCode(b[i]); return btoa(s); }
  function unb64(str) { var s = atob(str), b = new Uint8Array(s.length); for (var i = 0; i < s.length; i++) b[i] = s.charCodeAt(i); return b; }
  function has() { try { return !!(window.crypto && window.crypto.subtle && window.localStorage); } catch (e) { return false; } }

  function deviceSecret() {
    try {
      var k = localStorage.getItem('setayesh.devsecret') || localStorage.getItem('setayesh.sec.k');
      if (!k) { k = b64(crypto.getRandomValues(new Uint8Array(32))); localStorage.setItem('setayesh.sec.k', k); }
      return k;
    } catch (e) { return 'setayesh-fallback-device-key'; }
  }

  var _key = null;
  function getKey() {
    if (_key) return _key;
    _key = crypto.subtle.importKey('raw', enc.encode(deviceSecret()), 'PBKDF2', false, ['deriveKey'])
      .then(function (base) {
        return crypto.subtle.deriveKey(
          { name: 'PBKDF2', salt: enc.encode('setayesh.secure.store.v1'), iterations: 100000, hash: 'SHA-256' },
          base, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']);
      });
    return _key;
  }

  function setItem(key, value, ttlMs) {
    if (!has()) return Promise.resolve(false);
    return getKey().then(function (k) {
      var iv = crypto.getRandomValues(new Uint8Array(12));
      var payload = enc.encode(JSON.stringify({ v: value, exp: ttlMs ? Date.now() + ttlMs : 0 }));
      return crypto.subtle.encrypt({ name: 'AES-GCM', iv: iv }, k, payload).then(function (ct) {
        try { localStorage.setItem(NS + key, b64(iv) + '.' + b64(ct)); return true; } catch (e) { return false; }
      });
    }).catch(function () { return false; });
  }

  function getItem(key) {
    if (!has()) return Promise.resolve(null);
    var raw; try { raw = localStorage.getItem(NS + key); } catch (e) { return Promise.resolve(null); }
    if (!raw) return Promise.resolve(null);
    var parts = raw.split('.'); if (parts.length !== 2) return Promise.resolve(null);
    return getKey().then(function (k) {
      return crypto.subtle.decrypt({ name: 'AES-GCM', iv: unb64(parts[0]) }, k, unb64(parts[1]));
    }).then(function (pt) {
      var obj = JSON.parse(dec.decode(pt));
      if (obj.exp && Date.now() > obj.exp) { try { localStorage.removeItem(NS + key); } catch (e) {} return null; }
      return obj.v;
    }).catch(function () { return null; });
  }

  function delItem(key) { try { localStorage.removeItem(NS + key); } catch (e) {} }

  function purgeExpired() {
    if (!has()) return Promise.resolve();
    var names = [];
    try { for (var i = 0; i < localStorage.length; i++) { var k = localStorage.key(i); if (k && k.indexOf(NS) === 0 && k !== NS + 'k') names.push(k.slice(NS.length)); } } catch (e) {}
    return Promise.all(names.map(function (n) { return getItem(n); })).then(function () {});
  }

  window.secureStore = { set: setItem, get: getItem, del: delItem, purgeExpired: purgeExpired };
  try { purgeExpired(); } catch (e) {}
})();
