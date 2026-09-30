// Setayesh service worker — intentionally NON-caching.
//
// Earlier builds registered /sw.js but never actually shipped the file, so
// registration failed on every load (the "unsupported MIME type" console
// error). This worker fixes that cleanly WITHOUT reintroducing a cache that
// could pin an old app.js / brainmap.js in the browser.
//
// It takes control immediately, deletes every existing cache, and then does
// nothing else: it has NO 'fetch' handler, so every request goes straight to
// the network (and the normal HTTP cache). Freshness is decided solely by the
// ?v= query strings on the asset URLs — assets are never pinned by a worker.
self.addEventListener('install', function () { self.skipWaiting(); });

self.addEventListener('activate', function (e) {
  e.waitUntil((async function () {
    try {
      var keys = await caches.keys();
      await Promise.all(keys.map(function (k) { return caches.delete(k); }));
    } catch (err) {}
    try { await self.clients.claim(); } catch (err) {}
  })());
});
