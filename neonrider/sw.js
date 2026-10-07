// 作る.py が、落ち物2作・シューティングの sw.js をこれに置きかえる(版名・接頭辞・ファイル一覧は、元の sw.js から引き継ぐ)。
// 以前の作りは「保存した版を先に使い、新しい版は古い画面がすべて閉じるまで使わない」ため、iPhone では更新が届かず古い版が出続けた。
// 今の作り: まず最新を取りに行く(取れないとき=電波がないときだけ保存した版を使う)。新しい版はすぐに引き継ぐ。
const CACHE = 'neon-rider-v4-20261007-garage-kenney-gh384b5070';
const PREFIX = 'neon-rider-';
const FILES = ['./shell.js', './', './index.html', './app.css', './app.js', './core.js', './audio.js', './models.js', './bikes.js', './blender_meshes.js', './kenney_meshes.js', './meshy_bike_meshes.js', './redesign.js', './courses.js', './game.js', './hud.js', './lib/p5.min.js', './manifest.webmanifest', './icons/icon-192.png', './icons/icon-512.png', './icons/maskable-512.png', './icons/apple-touch-icon.png', './assets/garage/kai.json', './assets/garage/kai.webp', './assets/garage/arc.json', './assets/garage/arc.webp', './assets/garage/nst.json', './assets/garage/nst.webp', './assets/garage/ngt.json', './assets/garage/ngt.webp', './assets/bikes/kai.json', './assets/bikes/arc.json', './assets/bikes/nst.json', './assets/bikes/ngt.json', './assets/bikes/kai.webp', './assets/bikes/arc.webp', './assets/bikes/nst.webp', './assets/bikes/ngt.webp'];
self.addEventListener('install', e => {
  self.skipWaiting();
  e.waitUntil(caches.open(CACHE).then(c => Promise.all(FILES.map(f => fetch(f, { cache: 'reload' }).then(r => r.ok && c.put(f, r)).catch(() => { })))));   // 1つ欠けても全体が失敗しないように、1つずつ
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k.startsWith(PREFIX) && k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET' || new URL(e.request.url).origin !== self.location.origin) return;
  e.respondWith((async () => {
    const c = await caches.open(CACHE);
    const cached = async () => (await c.match(e.request, { ignoreSearch: true })) || (e.request.mode === 'navigate' ? await c.match('./index.html') : undefined);
    const get = () => { try { return fetch(e.request, { cache: 'no-cache' }); } catch (err) { return fetch(e.request); } };
    const net = get().then(r => { if (r && r.status === 200 && r.type === 'basic') c.put(e.request, r.clone()); return r; });
    try {
      // 4秒たっても最新が取れないとき(電波が弱い)は、保存した版で先に始める
      return await Promise.race([net, new Promise(res => setTimeout(res, 4000)).then(async () => (await cached()) || net)]);
    } catch (err) {
      const hit = await cached();
      if (hit) return hit;
      throw err;
    }
  })());
});
