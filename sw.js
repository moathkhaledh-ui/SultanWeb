// Service Worker for Clean Ops Web Admin Dashboard
const CACHE_NAME = 'clean-ops-admin-v6';
const ASSETS_TO_CACHE = [
  './',
  './web_admin_dashboard.html',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  './icon.svg'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    }).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const url = event.request.url;
  if (url.includes('firestore.googleapis.com') || url.includes('gstatic.com') || url.includes('jsdelivr.net')) {
    return;
  }

  // Network-first strategy for fresh dashboard and secrets
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        if (response && response.status === 200 && response.type === 'basic') {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone);
          });
        }
        return response;
      })
      .catch(() => {
        return caches.match(event.request).then((res) => {
          if (res) return res;
          if (event.request.mode === 'navigate') {
            return caches.match('./web_admin_dashboard.html');
          }
        });
      })
  );
});
