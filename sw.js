// Service worker: lets the game be installed as an app, and always loads the newest files
// from the network (skipping the browser cache) so phones get updates right away.
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', e => e.waitUntil(self.clients.claim()));
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== self.location.origin) return;
  e.respondWith(fetch(req.url, { cache: 'no-cache', credentials: 'same-origin' }).catch(() => fetch(req)));
});
