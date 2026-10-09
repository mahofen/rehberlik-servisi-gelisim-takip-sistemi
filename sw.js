// Service Worker for Rehberlik Servisi Gelişim Takip Sistemi PWA
const CACHE_NAME = 'gelisim-takip-pwa-v1';
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './mobile_app.html',
  './ogrenci.html',
  './admin.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  './icon.svg',
  './supabase_client.js'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE).catch(() => {});
    })
  );
  self.skipWaiting();
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
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  // Supabase ve API isteklerini doğrudan ağa yönlendir
  if (event.request.url.includes('supabase.co') || event.request.url.includes('cdnjs') || event.request.url.includes('cdn.')) {
    return;
  }
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }
      return fetch(event.request).then((networkResponse) => {
        return networkResponse;
      }).catch(() => {
        if (event.request.mode === 'navigate') {
          return caches.match('./index.html');
        }
      });
    })
  );
});
