const CACHE = 'world-build-drop-v1-20261003-1-gh67e57b5d';
const FILES = ['./pad.js', './vpad.js', './', './index.html', './i18n.js', './audio.js', './art.js', './engine.js', './ai.js', './rank.js', './kanji.js', './worldbuild.js', './manifest.webmanifest', './icons/icon-192.png', './icons/icon-512.png', './icons/maskable-512.png', './icons/apple-touch-icon.png'];
// 注意: cache.addAll ではなく1つずつ取りに行く(1つ欠けても全体が失敗しないように)
self.addEventListener('install', e => { e.waitUntil(caches.open(CACHE).then(c => Promise.all(FILES.map(f => fetch(f).then(r => r.ok && c.put(f, r)).catch(() => {}))))); });
// 新しい版は、古い画面がすべて閉じてから使う(版が混ざらないように)
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k.startsWith('world-build-drop-') && k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET' || new URL(e.request.url).origin !== self.location.origin) return;
  e.respondWith(caches.open(CACHE).then(async c => {
    const hit = await c.match(e.request, { ignoreSearch: true });
    if (hit) return hit;
    if (e.request.mode === 'navigate') return (await c.match('./index.html')) || fetch(e.request);
    return fetch(e.request);
  }));
});
