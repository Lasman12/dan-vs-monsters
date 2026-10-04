// Minimal service worker so the game can be installed as an app.
// Always goes to the network, so players get updates right away.
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', e => e.waitUntil(self.clients.claim()));
self.addEventListener('fetch', e => { e.respondWith(fetch(e.request)); });
