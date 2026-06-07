/**
 * Legacy cleanup: remove stale caches and unregister (no fetch interception).
 */
self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    Promise.all([
      caches.keys().then((keys) => Promise.all(keys.map((k) => caches.delete(k)))),
      self.registration.unregister(),
    ]),
  );
});
