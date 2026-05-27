const CACHE_NAME = 'simple-pwa-cache-v2';
const urlsToCache = [
  '/project_frontend/html/logon.html',
  '/project_frontend/html/home.html',
  '/project_frontend/html/profile.html',
  '/project_frontend/html/progress.html',
  '/project_frontend/js/auth.js',
  '/project_frontend/js/index.js',
  '/project_frontend/js/service-worker.js',
  '/project_frontend/css/main.css',
  '/project_frontend/manifest.json',
  '/project_frontend/Screenshot_2026-04-13_104648-removebg-preview.png',
];

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(urlsToCache))
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) =>
      Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      )
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => response || fetch(event.request))
  );
});
