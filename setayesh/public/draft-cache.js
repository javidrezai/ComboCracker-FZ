/* ==========================================================================
   Setayesh AI — draft-cache.js
   A small user of secureStore: it keeps whatever you've typed in the chat box
   but not yet sent, encrypted on THIS device, with a 2-day expiry. If the
   window closes or reloads, your unsent message comes back; after you send it,
   or after 2 days, it's gone. Only the app can read it.
   ========================================================================== */
(function () {
  'use strict';
  var KEY = 'composer.draft';
  var TTL = 2 * 24 * 60 * 60 * 1000; // 2 days
  function box() { return document.getElementById('msgBox'); }

  function restore() {
    var b = box(); if (!b || !window.secureStore) return;
    window.secureStore.get(KEY).then(function (v) {
      if (v && !b.value) {
        b.value = v;
        try { b.dispatchEvent(new Event('input', { bubbles: true })); } catch (e) {}
      }
    });
  }
  var timer = null;
  function saveSoon() {
    var b = box(); if (!b || !window.secureStore) return;
    if (timer) clearTimeout(timer);
    timer = setTimeout(function () {
      var v = b.value || '';
      if (v.trim()) window.secureStore.set(KEY, v, TTL);
      else window.secureStore.del(KEY);
    }, 400);
  }
  function clearDraft() { if (window.secureStore) window.secureStore.del(KEY); }

  function wire() {
    var b = box();
    if (!b) { setTimeout(wire, 800); return; }   // the composer mounts after login
    restore();
    b.addEventListener('input', saveSoon);
    var send = document.getElementById('sendBtn');
    if (send) send.addEventListener('click', function () { setTimeout(clearDraft, 120); });
    // Enter-to-send clears it too (Shift+Enter is a newline, so keep the draft).
    b.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' && !e.shiftKey) setTimeout(clearDraft, 120);
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', wire);
  else wire();
})();
