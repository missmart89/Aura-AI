self.addEventListener('install', (e) => {
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  return self.clients.claim();
});

self.addEventListener('fetch', (e) => {
  // Minimal fetch handler to pass PWA installation requirements
  e.respondWith(fetch(e.request).catch(() => new Response('Offline')));
});
