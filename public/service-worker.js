/**
 * Раньше здесь кэшировались "/" и "/static/js/bundle.js".
 * В production CRA отдаёт main.[hash].js — после нового деплоя старый index.html из кэша
 * тянул несуществующие чанки → белый экран.
 *
 * Сервис-воркер только очищает старые кэши и не перехватывает сеть.
 */
const CACHE_NAMES_PREFIX = 'svoi-mastera-';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((k) => k.startsWith(CACHE_NAMES_PREFIX) || k.includes('svoi-mastera'))
          .map((k) => caches.delete(k)),
      ),
    ).then(() => self.clients.claim()),
  );
});

// Не кэшируем HTML/чанки — SPA всегда получает актуальные файлы с CDN Vercel.
