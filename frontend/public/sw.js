// Blue ridge Bank PWA Service Worker
const CACHE_NAME = 'blueridge-bank-pwa-v1';
const PRECACHE_ASSETS = [
  '/',
  '/manifest.json',
  '/logo.png',
  '/icon-192.png',
  '/icon-512.png',
  '/favicon.ico',
  '/apple-touch-icon.png'
];

// Install: Cache essential shell assets & skip waiting
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_ASSETS).catch((err) => {
        console.warn('[SW] Pre-caching warning:', err);
      });
    }).then(() => self.skipWaiting())
  );
});

// Activate: Clean up previous caches & claim clients
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch: Pass-through for dynamic API requests, network-first for navigation
self.addEventListener('fetch', (event) => {
  const req = event.request;
  const url = new URL(req.url);

  // Only handle HTTP/HTTPS GET requests
  if (req.method !== 'GET' || !url.protocol.startsWith('http')) {
    return;
  }

  // Never cache API calls, webhooks, or socket endpoints
  if (url.pathname.startsWith('/api') || url.pathname.startsWith('/socket.io')) {
    return;
  }

  // Navigation requests: Network-first with cache fallback
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req).catch(() => {
        return caches.match(req).then((cached) => cached || caches.match('/'));
      })
    );
    return;
  }

  // Static assets (images, fonts, styles): Cache-first with network fallback
  if (
    url.pathname.match(/\.(png|jpg|jpeg|svg|gif|webp|ico|woff|woff2|ttf|css|js)$/) ||
    url.pathname.startsWith('/_next/static/')
  ) {
    event.respondWith(
      caches.match(req).then((cached) => {
        if (cached) return cached;
        return fetch(req).then((response) => {
          if (response && response.status === 200 && response.type === 'basic') {
            const copy = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(req, copy));
          }
          return response;
        }).catch(() => caches.match('/logo.png'));
      })
    );
    return;
  }

  // Default: Network with fallback to cache
  event.respondWith(
    fetch(req).catch(() => caches.match(req))
  );
});
