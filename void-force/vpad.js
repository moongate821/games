// 仮想スティック+ボタン(iPhone・iPad 用)。見た目と動きは 1980s GALAXY SHOOTER のタッチ操作に合わせてある:
//   画面の左下(左 45%・下 70%)に触れた場所がスティックの中心になる / 右下に丸いボタン / 光る輪の線で描く
// 使い方(各ゲームの pad.js から):
//   VPad.setup({
//     active: () => ゲーム中なら true,            // false の間は何も描かず、タッチもゲームにそのまま渡す
//     stick: { onMove(x, y, on) {...} },             // x,y = -1..1(右・下が +)。on = 触れているか
//     dir4:  { onDir(dir|null) {...} },              // 'up'|'down'|'left'|'right'|null(4方向のゲーム用。stick と併用可)
//     buttons: [{ id, label, sub, color: 'cyan'|'yellow'|'red', r, x, y, at }],   // x,y = 画面の右端・下端からの距離(CSS px)。at(s,W,H) → {x,y} でも可
//     onPress(id) {...}, onRelease(id) {...},
//   });
(function () {
  'use strict';
  const touchDev = /iPad|iPhone|iPod|Android/.test(navigator.userAgent) || (navigator.maxTouchPoints > 1 && /Mac/.test(navigator.platform));
  const force = /[?&#]vpad/.test(location.href);            // PC で見た目を確かめる用(?vpad)
  const COL = { cyan: [90, 210, 255], yellow: [255, 225, 80], red: [255, 90, 90] };
  const R_BASE = 80, R_KNOB = 32;                          // シューティングと同じ大きさ(直径 160 / 64)
  let cfg = null, cv = null, cx = null, dpr = 1, W = 0, H = 0;
  let stick = null;                                        // {id, ox, oy, x, y}
  const held = new Map();                                  // pointerId -> button id
  let curDir = null, wasActive = false, dirty = true, used = force;

  function scale() { return Math.max(0.72, Math.min(1.15, Math.min(W, H) / 430)); }   // 小さい画面では少し縮める
  function btnPos(b) { const s = scale(); if (b.at) { const p = b.at(s, W, H); return { x: p.x, y: p.y, r: b.r * s }; } return { x: W - b.x * s - safe('right'), y: H - b.y * s - safe('bottom'), r: b.r * s }; }   // at: ゲームの画面に合わせて置き場所を決める(画面座標)
  function home() { const s = scale(); return { x: 30 + R_BASE * s + safe('left'), y: H - 30 - R_BASE * s - safe('bottom') }; }
  let probe = null;
  function safe(side) { if (!probe) return 0; const v = parseFloat(getComputedStyle(probe)['padding' + side[0].toUpperCase() + side.slice(1)]); return isNaN(v) ? 0 : v; }   // iPhone の切り欠き・ホームバーをよける

  function resize() {
    dpr = Math.min(3, window.devicePixelRatio || 1); W = innerWidth; H = innerHeight;
    cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
    cv.style.width = W + 'px'; cv.style.height = H + 'px'; dirty = true;
  }

  function ring(x, y, r, c, a, glow, lw) {
    cx.save(); cx.strokeStyle = `rgba(${c[0]},${c[1]},${c[2]},${a / 255})`; cx.lineWidth = lw;
    cx.shadowColor = `rgba(${c[0]},${c[1]},${c[2]},${Math.min(1, a / 255 + .2)})`; cx.shadowBlur = glow;
    cx.beginPath(); cx.arc(x, y, r, 0, Math.PI * 2); cx.stroke(); cx.restore();
  }

  function draw() {
    dirty = false;
    cx.setTransform(dpr, 0, 0, dpr, 0, 0); cx.clearRect(0, 0, W, H);
    if (!isActive()) return;
    const s = scale(), h = stick ? { x: stick.ox, y: stick.oy } : home();
    ring(h.x, h.y, R_BASE * s, COL.cyan, 130, 8, 2); ring(h.x, h.y, 30 * s, COL.cyan, 130, 8, 2);
    const k = stick ? { x: stick.x, y: stick.y } : h;
    ring(k.x, k.y, R_KNOB * s, COL.cyan, stick ? 230 : 120, 10, 3);
    const lab = (t, x, y, size, a) => { cx.fillStyle = `rgba(255,255,255,${a})`; cx.font = `${Math.round(size)}px "Share Tech Mono", ui-monospace, "Hiragino Sans", sans-serif`; cx.textAlign = 'center'; cx.textBaseline = 'middle'; cx.fillText(t, x, y); };
    for (const b of cfg.buttons || []) {
      const p = btnPos(b), on = [...held.values()].includes(b.id), c = COL[b.color] || COL.cyan;
      ring(p.x, p.y, p.r, c, on ? 255 : 130, on ? 14 : 8, on ? 3.5 : 2);
      if (on) { cx.fillStyle = `rgba(${c[0]},${c[1]},${c[2]},.12)`; cx.beginPath(); cx.arc(p.x, p.y, p.r, 0, Math.PI * 2); cx.fill(); }
      const label = typeof b.label === 'function' ? b.label() : b.label, sub = typeof b.sub === 'function' ? b.sub() : b.sub;
      lab(label, p.x, p.y - (sub ? p.r * 0.16 : 0), (b.big ? 18 : 14) * s * (label.length <= 2 ? 1.5 : 1), on ? .95 : .62);
      if (sub) lab(sub, p.x, p.y + p.r * 0.42, 10 * s, on ? .9 : .5);
    }
  }

  function isActive() { try { return !!(cfg && (touchDev || force) && cfg.active()); } catch (e) { return false; } }
  function hitButton(x, y) {
    for (const b of cfg.buttons || []) { const p = btnPos(b); if (Math.hypot(x - p.x, y - p.y) < p.r * 1.15) return b.id; }
    return null;
  }
  function inStickZone(x, y) { return x < W * 0.45 && y > H * 0.3 && !(cfg.exclude && cfg.exclude(x, y)); }   // exclude: ゲーム側で触らせたい場所(盤のタップなど)

  function setDir(d) {
    if (d === curDir) return;
    curDir = d; if (cfg.dir4) cfg.dir4.onDir(d);
  }
  function updStick() {
    if (!stick) { if (cfg.stick) cfg.stick.onMove(0, 0, false); setDir(null); return; }
    const s = scale(), dx = stick.rx - stick.ox, dy = stick.ry - stick.oy, len = Math.hypot(dx, dy), a = Math.atan2(dy, dx);
    const m = Math.min(1, len / (R_BASE * s));
    stick.x = stick.ox + Math.cos(a) * Math.min(R_BASE * s, len); stick.y = stick.oy + Math.sin(a) * Math.min(R_BASE * s, len);
    const vx = Math.cos(a) * m, vy = Math.sin(a) * m;
    if (cfg.stick) cfg.stick.onMove(vx, vy, true);
    if (m < 0.35) setDir(null);
    else if (Math.abs(vx) > Math.abs(vy)) setDir(vx < 0 ? 'left' : 'right');
    else setDir(vy < 0 ? 'up' : 'down');
  }

  function down(e) {
    if (e.pointerType === 'mouse' && !force) return;
    if (!isActive()) return;
    if (e.target && e.target.closest && e.target.closest('button, a, input, select, textarea, label, [data-vpad-pass]')) return;   // 画面のボタンはそのまま押せる
    const x = e.clientX, y = e.clientY, b = hitButton(x, y);
    if (b) { held.set(e.pointerId, b); cfg.onPress && cfg.onPress(b); }
    else if (!stick && inStickZone(x, y)) { stick = { id: e.pointerId, ox: x, oy: y, rx: x, ry: y, x, y }; updStick(); }
    else return;                                           // スティックでもボタンでもない所は、ゲームにそのまま渡す
    used = true; dirty = true;
    e.stopImmediatePropagation(); e.preventDefault();
  }
  function move(e) {
    if (stick && e.pointerId === stick.id) { stick.rx = e.clientX; stick.ry = e.clientY; updStick(); dirty = true; e.stopImmediatePropagation(); e.preventDefault(); return; }
    if (held.has(e.pointerId)) {                           // 指をすべらせて隣のボタンへ
      const nb = hitButton(e.clientX, e.clientY), ob = held.get(e.pointerId);
      if (nb && nb !== ob) { cfg.onRelease && cfg.onRelease(ob); held.set(e.pointerId, nb); cfg.onPress && cfg.onPress(nb); dirty = true; }
      e.stopImmediatePropagation(); e.preventDefault();
    }
  }
  function up(e) {
    let mine = false;
    if (stick && e.pointerId === stick.id) { stick = null; updStick(); mine = true; }
    if (held.has(e.pointerId)) { const b = held.get(e.pointerId); held.delete(e.pointerId); cfg.onRelease && cfg.onRelease(b); mine = true; }
    if (mine) { dirty = true; e.stopImmediatePropagation(); e.preventDefault(); }
  }
  function releaseAll() {
    if (stick) { stick = null; updStick(); }
    for (const b of held.values()) cfg.onRelease && cfg.onRelease(b);
    held.clear(); dirty = true;
  }

  function loop() {
    const a = isActive();
    if (a !== wasActive) { if (!a) releaseAll(); wasActive = a; dirty = true; }
    if (dirty) draw();
    requestAnimationFrame(loop);
  }

  window.VPad = {
    setup(c) {
      cfg = c;
      if (!touchDev && !force) return;
      cv = document.createElement('canvas'); cv.id = 'vpad';
      // 重ねる層は、ゲームのページの canvas 用の CSS(背景色・最大幅など)に影響されないよう、すべて !important で固定する。
      // (落ち物のページに canvas{background:#000} があり、この層が真っ黒に塗られて、ゲーム全体が隠れたことがある)
      cv.style.cssText = 'position:fixed!important;left:0!important;top:0!important;pointer-events:none!important;z-index:2147483000!important;background:none transparent!important;'
        + 'max-width:none!important;max-height:none!important;min-width:0!important;min-height:0!important;margin:0!important;padding:0!important;border:0!important;box-shadow:none!important;opacity:1!important;display:block!important;';
      document.body.appendChild(cv); cx = cv.getContext('2d');
      probe = document.createElement('div'); probe.style.cssText = 'position:fixed;visibility:hidden;pointer-events:none;padding:env(safe-area-inset-top) env(safe-area-inset-right) env(safe-area-inset-bottom) env(safe-area-inset-left)'; document.body.appendChild(probe);
      resize(); addEventListener('resize', resize); addEventListener('orientationchange', () => setTimeout(resize, 200));
      for (const [t, f] of [['pointerdown', down], ['pointermove', move], ['pointerup', up], ['pointercancel', up]]) addEventListener(t, f, { capture: true, passive: false });
      // スティック・ボタンの上ではスクロールや拡大をさせない
      addEventListener('touchstart', e => { if (isActive() && (stick || held.size)) e.preventDefault(); }, { capture: true, passive: false });
      addEventListener('touchmove', e => { if (isActive() && (stick || held.size)) e.preventDefault(); }, { capture: true, passive: false });
      addEventListener('blur', releaseAll);
      document.documentElement.classList.add('vpad-on');
      requestAnimationFrame(loop);
    },
    redraw() { dirty = true; },
    get used() { return used; },
    get touch() { return touchDev || force; },
  };
})();
