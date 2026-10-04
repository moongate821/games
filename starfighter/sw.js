const CACHE = 'starfighter-neon-v2-20261002-1';
const FILES = ['./', './index.html', './app.css', './i18n.js', './app.js', './models.js', './flight.js', './cinema.js', './cockpit2.js', './ship.js', './zones.js', './coop.js', './sketch.js', './assets.js', './audio.js', './tune.js', './lib/p5.min.js', './manifest.webmanifest', './icons/icon-192.png', './icons/icon-512.png', './icons/maskable-512.png', './icons/apple-touch-icon.png'];
self.addEventListener('install', e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES))); });
// New releases wait until all old windows close, preventing mixed game versions.
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k.startsWith('starfighter-neon-') && k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET' || new URL(e.request.url).origin !== self.location.origin) return;
  e.respondWith(caches.open(CACHE).then(async c => {
    const hit = await c.match(e.request, { ignoreSearch: true });
    if (hit) return hit;
    if (e.request.mode === 'navigate') return (await c.match('./index.html')) || fetch(e.request);
    return fetch(e.request);
  }));
});
