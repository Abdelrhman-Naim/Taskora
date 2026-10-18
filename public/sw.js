// Taskora Service Worker (P-501, P-502, P-506, P-507, P-510)
const CACHE_NAME = 'taskora-v1';
const IMMUTABLE_ASSETS = [
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/icons/icon-maskable-512.png',
  '/icons/apple-touch-icon.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(IMMUTABLE_ASSETS);
    })
  );
});

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const { request } = event;

  // P-506: Never cache non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  const url = new URL(request.url);

  // P-507: Scope caching to same-origin
  if (url.origin !== self.location.origin) {
    return;
  }

  // P-502: Network-first for navigation requests (HTML pages)
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(async () => {
        const cached = await caches.match(request);
        if (cached) return cached;
        // Offline fallback
        return new Response(
          '<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Taskora Offline</title><style>body{font-family:system-ui,sans-serif;background:#F8FAFC;color:#0F172A;display:flex;align-items:center;justify-content:center;min-height:100dvh;margin:0;padding:24px;text-align:center}h1{font-size:20px;margin-bottom:8px}p{color:#475569;font-size:14px;margin-bottom:24px}button{background:#0D5C5A;color:#fff;border:none;padding:10px 20px;border-radius:6px;font-size:14px;cursor:pointer}</style></head><body><div><h1>You are currently offline</h1><p>Please check your internet connection to continue syncing tasks.</p><button onclick="window.location.reload()">Retry Connection</button></div></body></html>',
          {
            headers: { 'Content-Type': 'text/html; charset=utf-8' },
            status: 200,
          }
        );
      })
    );
    return;
  }

  // Cache-first for hashed static assets (/_next/static/ or /icons/)
  if (url.pathname.startsWith('/_next/static/') || url.pathname.startsWith('/icons/')) {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse;
        }
        return fetch(request).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseClone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, responseClone);
            });
          }
          return networkResponse;
        });
      })
    );
    return;
  }

  // Stale-while-revalidate / Network-first for other same-origin assets
  event.respondWith(
    fetch(request).catch(() => caches.match(request))
  );
});
