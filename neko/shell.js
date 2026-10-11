// 全ゲーム共通の「ホームへ戻る」「全画面」ボタン(作る.py が各ゲームの index.html に注入する)
//  ⌂ : セーブしてから入口ページ(../)へ戻る。ブラウザの戻るボタンを使わなくてよい(ホーム画面アプリ版には戻るボタンが無い)
//  ⛶ : 全画面(URL欄・タブを隠す)。iPhone の Safari は全画面APIが無いので「ホーム画面に追加」の案内を出す
// セーブ: ゲームが window.__flushSave を持っていれば呼ぶ。GALAXY(stellar)は saveGame() を呼ぶ。他は、ゲーム側が区切りごとに保存済み
(function () {
  'use strict';
  if (window.__shellBtn) return; window.__shellBtn = true;
  const ua = navigator.userAgent;
  const ios = /iPad|iPhone|iPod/.test(ua) || (navigator.maxTouchPoints > 1 && /Mac/.test(navigator.platform));
  const standalone = () => (window.matchMedia && matchMedia('(display-mode: standalone)').matches) || navigator.standalone === true;
  const fsEl = () => document.fullscreenElement || document.webkitFullscreenElement;
  const canFs = !!(document.documentElement.requestFullscreen || document.documentElement.webkitRequestFullscreen);

  const css = document.createElement('style');
  css.textContent = `
.shl-b{position:fixed;top:calc(env(safe-area-inset-top,0px) + 6px);z-index:2147483000;width:38px;height:38px;border-radius:50%;
 border:1px solid rgba(255,255,255,.55);background:rgba(10,12,24,.55);color:#fff;font:700 20px/36px system-ui,sans-serif;text-align:center;
 opacity:.5;cursor:pointer;padding:0;touch-action:manipulation;-webkit-tap-highlight-color:transparent;user-select:none;-webkit-user-select:none}
.shl-b:hover,.shl-b:active{opacity:1}
#shl-home{left:calc(env(safe-area-inset-left,0px) + 6px)}
#shl-fs{left:calc(env(safe-area-inset-left,0px) + 50px);font-size:18px}
.shl-m{position:fixed;inset:0;z-index:2147483001;background:rgba(0,0,0,.6);display:flex;align-items:center;justify-content:center;font-family:system-ui,-apple-system,"Hiragino Sans","Yu Gothic UI",sans-serif}
.shl-m div{background:#14172b;color:#fff;border:1px solid #6c76c8;border-radius:14px;padding:18px 20px;max-width:min(86vw,360px);text-align:center;line-height:1.6;white-space:pre-line}
.shl-m p{margin:0 0 14px;font-size:15px}
.shl-m button{font:700 15px system-ui,sans-serif;margin:4px;padding:10px 16px;border-radius:10px;border:0;background:#4a5ae8;color:#fff;cursor:pointer}
.shl-m button.g{background:#3a3f5c}`;
  document.head.appendChild(css);

  function mk(id, txt, title, fn) {
    const b = document.createElement('button'); b.id = id; b.className = 'shl-b'; b.type = 'button'; b.textContent = txt; b.title = title; b.setAttribute('aria-label', title);
    for (const ev of ['pointerdown', 'pointerup', 'touchstart', 'touchend', 'mousedown', 'mouseup', 'keydown', 'keyup']) b.addEventListener(ev, e => e.stopPropagation());
    b.addEventListener('click', e => { e.stopPropagation(); e.preventDefault(); fn(); b.blur(); });
    document.body.appendChild(b); return b;
  }
  function dialog(msg, buttons) {
    const m = document.createElement('div'); m.className = 'shl-m';
    const box = document.createElement('div'), p = document.createElement('p'); p.textContent = msg; box.appendChild(p);
    for (const [label, cls, fn] of buttons) { const b = document.createElement('button'); b.textContent = label; if (cls) b.className = cls; b.onclick = () => { m.remove(); fn && fn(); }; box.appendChild(b); }
    m.appendChild(box);
    for (const ev of ['pointerdown', 'touchstart', 'mousedown', 'keydown']) m.addEventListener(ev, e => e.stopPropagation());
    document.body.appendChild(m);
  }

  function flush() {
    try { if (typeof window.__flushSave === 'function') window.__flushSave(); } catch (e) {}
    try { if (/\/stellar\//.test(location.pathname) && typeof saveGame === 'function' && typeof GAME !== 'undefined' && GAME) saveGame(); } catch (e) {}
  }
  function goHome() {
    flush();
    setTimeout(() => { location.href = new URL('../', location.href).href; }, 120);
  }

  const home = mk('shl-home', '⌂', 'ホームへ戻る', () => dialog('セーブして、ゲーム選択へ戻ります。', [['戻る', '', goHome], ['つづける', 'g']]));
  const fs = mk('shl-fs', '⛶', '全画面', () => {
    if (fsEl()) { (document.exitFullscreen || document.webkitExitFullscreen).call(document); return; }
    if (canFs && !ios) { const r = document.documentElement; (r.requestFullscreen || r.webkitRequestFullscreen).call(r, { navigationUI: 'hide' }); return; }
    dialog('iPhone・iPad の Safari では、アドレス欄を消せません。\n共有ボタン(□に↑)→「ホーム画面に追加」で追加し、そのアイコンから開くと全画面で遊べます。', [['とじる']]);
  });
  const sync = () => { fs.style.display = (standalone() || (!canFs && !ios)) ? 'none' : ''; fs.textContent = fsEl() ? '✕' : '⛶'; };
  ['fullscreenchange', 'webkitfullscreenchange', 'resize'].forEach(ev => document.addEventListener(ev, sync)); sync();
  addEventListener('pagehide', flush);
})();
