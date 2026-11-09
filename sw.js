// --- T&C Space Hub Service Worker ---
const CACHE_NAME = 'tc-space-v1.0.0';

// Files to cache for offline access
const PRECACHE_ASSETS = [
  '/T-C-Space/',
  '/T-C-Space/index.html',
  '/T-C-Space/styles.css',
  '/T-C-Space/app.js',
  '/T-C-Space/manifest.webmanifest'
];

// 1. Force the new version to take over immediately
self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_ASSETS))
  );
});

// 2. Wipe old caches and claim all open tabs
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      );
    }).then(() => self.clients.claim())
  );
});

// 3. Network-First strategy (always fetch latest news/telemetry if online)
self.addEventListener('fetch', (event) => {
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() => caches.match('/T-C-Space/index.html'))
    );
    return;
  }
  event.respondWith(
    caches.match(event.request).then((cached) => cached || fetch(event.request))
  );
});

// 4. Handle incoming push notifications
self.addEventListener('push', (event) => {
  const data = event.data ? event.data.json() : {};
  const title = data.title || 'Space Hub Alert 🚀';
  const options = {
    body: data.body || 'New space telemetry available.',
    icon: '/T-C-Space/assets/space-hub-icon-192.png',
    badge: '/T-C-Space/assets/space-hub-icon-192.png'
  };
  event.waitUntil(self.registration.showNotification(title, options));
});
