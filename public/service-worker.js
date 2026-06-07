/**
 * Старые версии SW кэшировали index.html и несуществующие чанки → белый экран после деплоя.
 * Этот скрипт только удаляет себя и все кэши, сеть не перехватывает.
 */
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    Promise.all([
      caches.keys().then((keys) => Promise.all(keys.map((k) => caches.delete(k)))),
      self.registration.unregister(),
    ]).then(() => self.clients.matchAll()).then((clients) => {
      clients.forEach((client) => {
        if (client.url && 'navigate' in client) client.navigate(client.url);
      });
    }),
  );
});
