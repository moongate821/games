/* 霧の灯台 render.js  Canvas描画(06 かわいい改修版)。engineの状態を読むだけ(e.vv など見た目用フィールドのみ書く) */
(function (root) {
'use strict';
var DATA = root.Fog.DATA, T = DATA.TOWERS, EN = DATA.ENEMIES, BO = DATA.BOSSES, B = DATA.BALANCE;
var TS = B.tileSize, W = DATA.W * TS, H = DATA.H * TS, TAU = Math.PI * 2;
var VT = 1.55, VEn = 2.2, VEfly = 2.1, VEbig = 1.8, VEboss = 1.6;
var C = { warm: '#ffc77a', core: '#fff6d6', edge: '#ff9a6a', oil: '#ffb84a', eye: '#b6f4ff', red: '#ff7a8a', jade: '#6fe3b8', ice: '#8fd8ff', text: '#fbf8ff', rock: '#4a5290', rockE: '#7a85c8', sand: '#8d93c9', sandE: '#aab0e0', out: '#2b2f66', mint: '#a8f0d4', peach: '#ffc4b5', star: '#fff3b0' };
var OUT = C.out, CHEEK = 'rgba(255,143,166,0.55)';

function mkCanvas(w, h) { var c = document.createElement('canvas'); c.width = w; c.height = h; return c; }
function tear(ctx, x, y, w, h) { ctx.beginPath(); ctx.moveTo(x, y - h); ctx.quadraticCurveTo(x + w, y - h * 0.3, x, y); ctx.quadraticCurveTo(x - w, y - h * 0.3, x, y - h); ctx.closePath(); }
function rr(ctx, x, y, w, h, r) { ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath(); }
function lerp(a, b, t) { return a + (b - a) * t; }
function rnd(seed) { var s = seed >>> 0; return function () { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; }
function fs(c, fill, lw) { c.fillStyle = fill; c.fill(); c.lineWidth = lw || 2; c.strokeStyle = OUT; c.lineJoin = 'round'; c.stroke(); }
function bigEye(c, x, y, r, open, look) {
  var ry = r * Math.max(0.12, open); c.fillStyle = OUT; c.beginPath(); c.ellipse(x + (look || 0) * r * 0.2, y, r, ry, 0, 0, TAU); c.fill();
  if (open > 0.5 && r > 1.6) { c.fillStyle = '#fff'; c.beginPath(); c.arc(x + r * 0.3, y - r * 0.32, r * 0.34, 0, TAU); c.fill(); c.beginPath(); c.arc(x - r * 0.28, y + r * 0.3, r * 0.16, 0, TAU); c.fill(); }
}
function cheek(c, x, y, r) { if (r < 1.2) return; c.fillStyle = CHEEK; c.beginPath(); c.ellipse(x, y, r, r * 0.65, 0, 0, TAU); c.fill(); }
function smile(c, x, y, w) { if (w < 1.5) return; c.strokeStyle = OUT; c.lineWidth = 1.6; c.lineCap = 'round'; c.beginPath(); c.arc(x, y, w, 0.2, Math.PI - 0.2); c.stroke(); }
function face(c, y, sp, er, open, t, id) {
  var op = open == null ? blink(t || 0, id || 0) : open; bigEye(c, -sp, y, er, op, 0); bigEye(c, sp, y, er, op, 0); cheek(c, -sp * 1.75, y + er * 1.5, er * 0.9); cheek(c, sp * 1.75, y + er * 1.5, er * 0.9); smile(c, 0, y + er * 1.2, er * 0.8);
}
function blink(t, id) { var k = (t * 0.9 + id * 0.37) % 3.4; return k < 0.14 ? (k / 0.14 > 0.5 ? (k / 0.14 - 0.5) * 2 : 1 - k / 0.07) : 1; }
function hop(t, id, f) { return Math.abs(Math.sin(t * f + id)); }
function squash(c, y0, a) { c.translate(0, y0); c.scale(1 + a, 1 - a); c.translate(0, -y0); }
function star5(c, x, y, r) { c.beginPath(); for (var i = 0; i < 10; i++) { var a = -Math.PI / 2 + i * Math.PI / 5, r2 = i % 2 ? r * 0.45 : r; c.lineTo(x + Math.cos(a) * r2, y + Math.sin(a) * r2); } c.closePath(); }
function engLV(tw) { return (tw.br === 'b' && tw.lv === 3 && T[tw.def].lv3b) ? T[tw.def].lv3b : T[tw.def].lv[tw.lv]; }

/* ---- スプライト ---- */
var lightSprite, glowSprite, fogTile, vignetteSprite;
function buildSprites() {
  lightSprite = mkCanvas(128, 128); var c = lightSprite.getContext('2d'), g = c.createRadialGradient(64, 64, 0, 64, 64, 64);
  g.addColorStop(0, 'rgba(0,0,0,1)'); g.addColorStop(0.7, 'rgba(0,0,0,0.92)'); g.addColorStop(1, 'rgba(0,0,0,0)'); c.fillStyle = g; c.fillRect(0, 0, 128, 128);
  glowSprite = mkCanvas(128, 128); c = glowSprite.getContext('2d'); g = c.createRadialGradient(64, 64, 0, 64, 64, 64);
  g.addColorStop(0, 'rgba(255,214,150,0.55)'); g.addColorStop(0.35, 'rgba(255,170,130,0.22)'); g.addColorStop(1, 'rgba(255,150,120,0)'); c.fillStyle = g; c.fillRect(0, 0, 128, 128);
  fogTile = mkCanvas(256, 256); c = fogTile.getContext('2d'); var r = rnd(7); c.globalCompositeOperation = 'lighter';
  for (var i = 0; i < 40; i++) {
    var x = r() * 256, y = r() * 256, rad = 30 + r() * 50, a = 0.05 + r() * 0.07;
    for (var dx = -256; dx <= 256; dx += 256) for (var dy = -256; dy <= 256; dy += 256) {
      var gg = c.createRadialGradient(x + dx, y + dy, 0, x + dx, y + dy, rad); gg.addColorStop(0, 'rgba(255,255,255,' + a + ')'); gg.addColorStop(1, 'rgba(255,255,255,0)'); c.fillStyle = gg; c.fillRect(x + dx - rad, y + dy - rad, rad * 2, rad * 2);
    }
  }
  vignetteSprite = mkCanvas(240, 135); c = vignetteSprite.getContext('2d'); g = c.createRadialGradient(120, 67, 40, 120, 67, 130);
  g.addColorStop(0, 'rgba(255,122,138,0)'); g.addColorStop(1, 'rgba(255,122,138,0.8)'); c.fillStyle = g; c.fillRect(0, 0, 240, 135);
}

var S = { canvas: null, ctx: null, fog: null, fctx: null, bg: null, stageId: 0, pal: null, fx: [], aim: {}, fireT: {}, shake: 0, hitFlash: 0, fogDensity: 0.72, fogTarget: 0.72, t: 0, deco: { dyn: [] }, grow: {}, band: 0, q: 1, fxCap: 300, fxLevel: 1, dawnT: -1, bossDark: 0, popFx: 0, warns: [], flashW: 0, rain: [] };
function setFxLevel(l) { S.fxLevel = l; S.fxCap = [60, 300, 500][l]; if (S.lowEnd) S.fxCap = Math.min(S.fxCap, [60, 150, 200][l]); }

function init(canvas) {
  try { var lowEnd = (window.devicePixelRatio || 1) >= 3 || (navigator.hardwareConcurrency || 8) <= 4; if (lowEnd) { S.q = 1; S.lowEnd = true; S.fxCap = 150; } } catch (e) { }
  S.canvas = canvas; S.ctx = canvas.getContext('2d'); buildSprites(); S.fog = mkCanvas(W / 2, H / 2); S.fctx = S.fog.getContext('2d');
  S.pat1 = S.fctx.createPattern(fogTile, 'repeat'); S.pat2 = S.fctx.createPattern(fogTile, 'repeat');
}
function resize(cssW, cssH) {
  var dpr = Math.min(window.devicePixelRatio || 1, 2); S.canvas.width = Math.round(cssW * dpr); S.canvas.height = Math.round(cssH * dpr);
  S.canvas.style.width = cssW + 'px'; S.canvas.style.height = cssH + 'px'; S.scale = S.canvas.width / W;
}

/* ---- 背景(静的キャッシュ) ---- */
var THEME = {};
function buildBg(stage) {
  var pal = DATA.PALETTES[stage.pal] || DATA.PALETTES.std; S.pal = pal; S.stageId = stage.id; S.deco = { dyn: [] };
  var bg = mkCanvas(W, H), c = bg.getContext('2d'), r = rnd(stage.id * 977 + 13), i;
  var g = c.createLinearGradient(0, 0, 0, H); g.addColorStop(0, pal.sea0); g.addColorStop(1, pal.sea1); c.fillStyle = g; c.fillRect(0, 0, W, H);
  c.fillStyle = pal.sea2; for (i = 0; i < 7; i++) { c.globalAlpha = 0.16; c.beginPath(); var wy = 60 + i * 70; c.moveTo(0, wy); for (var x = 0; x <= W; x += 30) c.lineTo(x, wy + Math.sin(x * 0.02 + i * 2) * 5); c.lineTo(W, wy + 14); c.lineTo(0, wy + 14); c.closePath(); c.fill(); } c.globalAlpha = 1;
  var minY = 1e9; stage.slots.forEach(function (s) { minY = Math.min(minY, s.y * TS - 30); }); stage.paths.forEach(function (p) { p.pts.forEach(function (q) { minY = Math.min(minY, q[1] * TS - 34); }); });
  var band = minY >= 70 ? 58 : minY >= 40 ? 32 : 0;
  if (band) {
    var sg = c.createLinearGradient(0, 0, 0, band); sg.addColorStop(0, pal.sky0); sg.addColorStop(1, pal.sky1); c.fillStyle = sg; c.fillRect(0, 0, W, band);
    c.fillStyle = C.star; for (i = 0; i < (stage.id === 11 ? 40 : 20); i++) { var sx = r() * W, sy = r() * (band - 8); c.globalAlpha = 0.5 + r() * 0.5; c.fillRect(sx, sy, 2, 2); c.fillRect(sx - 2, sy + 0.5, 6, 1); c.fillRect(sx + 0.5, sy - 2, 1, 6); } c.globalAlpha = 1;
    for (i = 0; i < 4; i++) { var cx = r() * W, cy = band * (0.3 + r() * 0.5); c.fillStyle = pal.cloud; c.globalAlpha = 0.7; [[0, 0, 12], [14, 4, 10], [-14, 4, 9], [26, 7, 7], [-24, 7, 7]].forEach(function (b) { c.beginPath(); c.arc(cx + b[0], cy + b[1], b[2], 0, TAU); c.fill(); }); } c.globalAlpha = 1;
    if (stage.id === 2 || stage.id === 5) { var mg = c.createRadialGradient(W - 70, 22, 4, W - 70, 22, 34); mg.addColorStop(0, 'rgba(255,243,176,0.5)'); mg.addColorStop(1, 'rgba(255,243,176,0)'); c.fillStyle = mg; c.fillRect(W - 110, 0, 80, 60); c.fillStyle = C.star; c.beginPath(); c.arc(W - 70, 22, 11, 0, TAU); c.fill(); }
    if (stage.id === 12) { var dg = c.createLinearGradient(0, 0, 0, band); dg.addColorStop(0, 'rgba(255,170,120,0)'); dg.addColorStop(1, 'rgba(255,170,150,0.55)'); c.fillStyle = dg; c.fillRect(0, 0, W, band); }
  }
  S.band = band;
  var lp = new Path2D(); stage.paths.forEach(function (pp) { pp.pts.forEach(function (q, j) { j ? lp.lineTo(q[0] * TS, q[1] * TS) : lp.moveTo(q[0] * TS, q[1] * TS); }); });
  var lc = mkCanvas(W, H), l = lc.getContext('2d'); l.lineCap = 'round'; l.lineJoin = 'round';
  l.strokeStyle = '#d9d4f5'; l.lineWidth = TS * 5.6 + 16; l.stroke(lp); l.fillStyle = '#d9d4f5'; stage.slots.forEach(function (s) { l.beginPath(); l.arc(s.x * TS, s.y * TS, TS * 1.2 + 8, 0, TAU); l.fill(); }); l.beginPath(); l.arc(stage.base.x * TS, stage.base.y * TS, TS * 2.2 + 8, 0, TAU); l.fill();
  l.strokeStyle = pal.land; l.lineWidth = TS * 5.6; l.stroke(lp); l.fillStyle = pal.land; stage.slots.forEach(function (s) { l.beginPath(); l.arc(s.x * TS, s.y * TS, TS * 1.2, 0, TAU); l.fill(); }); l.beginPath(); l.arc(stage.base.x * TS, stage.base.y * TS, TS * 2.2, 0, TAU); l.fill();
  l.globalCompositeOperation = 'source-atop'; l.fillStyle = 'rgba(168,240,212,0.22)'; for (i = 0; i < 40; i++) { l.beginPath(); l.arc(r() * W, r() * H, 6 + r() * 14, 0, TAU); l.fill(); }
  l.fillStyle = 'rgba(255,255,255,0.07)'; for (i = 0; i < 30; i++) { l.beginPath(); l.arc(r() * W, r() * H, 10 + r() * 24, 0, TAU); l.fill(); }
  c.save(); c.shadowColor = 'rgba(255,255,255,0.35)'; c.shadowBlur = 12; c.drawImage(lc, 0, 0); c.restore();
  c.lineCap = 'round'; c.lineJoin = 'round';
  stage.paths.forEach(function (pp) { var pth = new Path2D(); pp.pts.forEach(function (q, j) { j ? pth.lineTo(q[0] * TS, q[1] * TS) : pth.moveTo(q[0] * TS, q[1] * TS); }); pp._p = pth; c.strokeStyle = C.sandE; c.lineWidth = TS * 1.78; c.stroke(pth); });
  stage.paths.forEach(function (pp) { c.strokeStyle = C.sand; c.lineWidth = TS * 1.5; c.stroke(pp._p); });
  stage.paths.forEach(function (pp) { c.strokeStyle = 'rgba(255,255,255,0.45)'; c.lineWidth = 3; c.setLineDash([2, 14]); c.stroke(pp._p); c.setLineDash([]); });
  stage.paths.forEach(function (pp) { var q = pp.pts[0]; c.strokeStyle = 'rgba(160,210,255,0.8)'; c.lineWidth = 2; c.beginPath(); c.arc(Math.max(10, q[0] * TS), q[1] * TS, 12, 0.5, 4.5); c.stroke(); c.beginPath(); c.arc(Math.max(10, q[0] * TS), q[1] * TS, 7, 2, 6); c.stroke(); });
  function okPos(x, y, margin) {
    if (x < 14 || x > W - 14 || y < (band || 0) + 8 || y > H - 12) return false;
    var m = 1e9; stage.paths.forEach(function (p) { for (var q = 1; q < p.pts.length; q++) m = Math.min(m, DATA.geom.segDist(x, y, p.pts[q - 1][0] * TS, p.pts[q - 1][1] * TS, p.pts[q][0] * TS, p.pts[q][1] * TS)); });
    if (m < TS * 0.9 + (margin || 0)) return false;
    for (var s = 0; s < stage.slots.length; s++) if (Math.hypot(x - stage.slots[s].x * TS, y - stage.slots[s].y * TS) < 36 + (margin || 0)) return false;
    if (Math.hypot(x - stage.base.x * TS, y - stage.base.y * TS) < 70) return false; return true;
  }
  function place(n, want, fn, margin) { var got = 0, tries = 0; while (got < n && tries < n * 14) { tries++; var x = r() * W, y = r() * H; c.lineWidth = TS * 5.4; var land = c.isPointInStroke(lp, x, y); if (want === 'land' ? !land : land) continue; if (!okPos(x, y, margin)) continue; fn(x, y); got++; } }
  var FL = ['#ffd6e8', '#fff3b0', '#cfeeff'];
  place(28, 'land', function (x, y) { var col = FL[Math.floor(r() * 3)], sz = 6 + r() * 4; if (r() < 0.4) { c.strokeStyle = C.mint; c.lineWidth = 1.5; for (var q = -1; q <= 1; q++) { c.beginPath(); c.moveTo(x, y + 3); c.quadraticCurveTo(x + q * 3, y - 3, x + q * 5, y - 6); c.stroke(); } } else { c.fillStyle = col; for (var q2 = 0; q2 < 5; q2++) { c.beginPath(); c.arc(x + Math.cos(q2 * 1.256) * sz * 0.5, y + Math.sin(q2 * 1.256) * sz * 0.5, sz * 0.35, 0, TAU); c.fill(); } c.fillStyle = C.oil; c.beginPath(); c.arc(x, y, sz * 0.22, 0, TAU); c.fill(); } });
  place(14, 'land', function (x, y) { c.fillStyle = '#8f94d8'; c.beginPath(); c.ellipse(x, y, 5 + r() * 4, 3 + r() * 2, r(), 0, TAU); c.fill(); c.fillStyle = 'rgba(255,255,255,0.4)'; c.beginPath(); c.ellipse(x - 1, y - 1, 2, 1, 0, 0, TAU); c.fill(); });
  place(12, 'land', function (x, y) { c.save(); c.translate(x, y); c.rotate(r() * 6); c.beginPath(); c.moveTo(0, 5); c.arc(0, 5, 9, Math.PI * 1.15, Math.PI * 1.85); c.closePath(); fs(c, r() < 0.5 ? '#ffd6cc' : '#fff1ea', 1); c.restore(); }, 6);
  place(10, 'land', function (x, y) { star5(c, x, y, 8); fs(c, '#ff9fb0', 1); });
  place(4, 'sea', function (x, y) { c.fillStyle = '#fff'; c.beginPath(); c.arc(x, y, 6, 0, TAU); c.fill(); c.strokeStyle = '#ff7a8a'; c.lineWidth = 3; c.setLineDash([5, 5]); c.stroke(); c.setLineDash([]); S.deco.dyn.push({ k: 'buoy', x: x, y: y, ph: r() * 6 }); }, 30);
  place(6, 'sea', function (x, y) { star5(c, x, y, 7); c.fillStyle = '#ff9fb0'; c.fill(); }, 20);
  for (i = 0; i < 14; i++) { var kx = r() * W, ky = (band || 0) + 10 + r() * (H - 20); c.fillStyle = 'rgba(255,255,255,0.7)'; c.fillRect(kx - 2, ky, 5, 1); c.fillRect(kx, ky - 2, 1, 5); }
  place(3, 'sea', function (x, y) { S.deco.dyn.push({ k: 'boat', x: x, y: y, ph: r() * 6 }); }, 40);
  place(1, 'land', function (x, y) { rr(c, x - 10, y - 4, 20, 14, 3); fs(c, '#fff6ee', 1.5); c.beginPath(); c.moveTo(x - 12, y - 4); c.lineTo(x, y - 14); c.lineTo(x + 12, y - 4); c.closePath(); fs(c, '#ff9fb0', 1.5); c.fillStyle = '#ffd770'; c.fillRect(x - 3, y, 6, 5); S.deco.dyn.push({ k: 'win', x: x, y: y + 2 }); }, 10);
  for (i = 0; i < 2; i++) S.deco.dyn.push({ k: 'gull', y: (band || 40) * 0.5 + 6, ph: i * 40, sp: 30 });
  var th = THEME[stage.id]; if (th) th(c, r, stage, place);
  stage.slots.forEach(function (s) {
    var x = s.x * TS, y = s.y * TS; rr(c, x - 24, y - 24, 48, 48, 14); fs(c, s.kind === 'wreck' ? '#d8b087' : s.kind === 'rock' ? '#8f94d8' : '#ffe9d6', 2);
    c.strokeStyle = 'rgba(180,150,130,0.4)'; c.lineWidth = 2; c.beginPath(); c.moveTo(x, y - 20); c.lineTo(x, y + 20); c.moveTo(x - 20, y); c.lineTo(x + 20, y); c.stroke();
    if (s.kind === 'sky' || s.kind === 'prime') { c.fillStyle = 'rgba(207,238,255,0.85)'; [[-8, 6, 7], [2, 3, 9], [11, 7, 6]].forEach(function (b) { c.beginPath(); c.arc(x + b[0], y + b[1], b[2], 0, TAU); c.fill(); }); }
    c.fillStyle = 'rgba(255,255,255,0.55)'; c.beginPath(); c.arc(x, y, 4, 0, TAU); c.fill();
  });
  for (i = 0; i < 3; i++) { rr(c, stage.base.x * TS - 30 + i * 20, stage.base.y * TS + 18, 18, 8, 3); fs(c, '#c9a07a', 1); }
  S.bg = bg; S.fx.length = 0; S.aim = {}; S.fireT = {}; S.grow = {};
  if (stage.id === 1) for (i = 0; i < 8; i++) S.deco.dyn.push({ k: 'firefly', x: r() * W, y: 80 + r() * (H - 100), ph: r() * 6 });
}
THEME[2] = function (c, r, st, place) { place(5, 'land', function (x, y) { c.beginPath(); c.arc(x, y, 5, 0, TAU); fs(c, '#ff9fb0', 1); S.deco.dyn.push({ k: 'lamp', x: x, y: y }); }, 4); };
THEME[3] = function (c, r, st, place) { place(2, 'sea', function (x, y) { S.deco.dyn.push({ k: 'crab', x: x, y: y, ph: r() * 6 }); }, 20); place(6, 'sea', function (x, y) { c.fillStyle = '#8f94d8'; c.beginPath(); c.arc(x, y, 9, Math.PI, 0); c.fill(); c.strokeStyle = C.mint; c.lineWidth = 2; c.beginPath(); c.moveTo(x + 3, y); c.quadraticCurveTo(x + 6, y - 10, x + 2, y - 16); c.stroke(); }, 16); };
THEME[4] = function (c, r, st, place) { place(4, 'land', function (x, y) { c.beginPath(); c.arc(x, y, 12, 0, TAU); fs(c, '#8f94d8', 1.5); c.fillStyle = 'rgba(255,255,255,0.4)'; c.beginPath(); c.ellipse(x - 4, y - 5, 4, 2, -0.5, 0, TAU); c.fill(); }, 8); };
THEME[5] = function (c, r, st, place) { place(2, 'sea', function (x, y) { c.strokeStyle = '#d8b087'; c.lineWidth = 3; c.beginPath(); c.moveTo(x, y + 10); c.lineTo(x, y - 14); c.stroke(); c.beginPath(); c.moveTo(x, y - 14); c.lineTo(x + 12, y - 6); c.lineTo(x, y - 3); c.closePath(); fs(c, '#fff6ee', 1); }, 24); };
THEME[6] = function (c, r, st, place) { place(1, 'land', function (x, y) { c.beginPath(); c.moveTo(x - 8, y + 6); c.quadraticCurveTo(x - 8, y - 8, x, y - 9); c.quadraticCurveTo(x + 8, y - 8, x + 8, y + 6); c.closePath(); fs(c, '#ffd770', 1.5); }, 10); };
THEME[7] = function (c, r, st, place) { st.paths.forEach(function (pp) { for (var q = 1; q < pp.pts.length; q++) { var a = pp.pts[q - 1], b = pp.pts[q], L = Math.hypot(b[0] - a[0], b[1] - a[1]), n = Math.floor(L / 3); for (var k = 0; k < n; k++) S.deco.dyn.push({ k: 'flow', x: (a[0] + (b[0] - a[0]) * k / n) * TS, y: (a[1] + (b[1] - a[1]) * k / n) * TS, dx: (b[0] - a[0]) / L, dy: (b[1] - a[1]) / L, ph: k * 17 }); } }); place(2, 'sea', function (x, y) { S.deco.dyn.push({ k: 'whirl', x: x, y: y, ph: r() * 6 }); }, 30); };
THEME[8] = function (c, r, st, place) { place(8, 'land', function (x, y) { c.beginPath(); c.arc(x, y, 6, Math.PI, 0); c.lineTo(x + 6, y + 5); c.lineTo(x - 6, y + 5); c.closePath(); fs(c, '#ffb3b3', 1); }, 4); place(2, 'sea', function (x, y) { rr(c, x - 16, y - 4, 32, 10, 4); fs(c, '#d8b087', 1.5); }, 24); };
THEME[10] = function (c, r, st, place) { place(3, 'land', function (x, y) { c.fillStyle = 'rgba(255,196,181,0.25)'; c.beginPath(); c.ellipse(x, y, 11, 6, 0.3, 0, TAU); c.fill(); }, 6); };
THEME[11] = function (c, r, st, place) { place(3, 'sea', function (x, y) { S.deco.dyn.push({ k: 'jelly', x: x, y: y, ph: r() * 6 }); }, 20); };
THEME[12] = function (c) { var cols = ['#ff9aa8', '#ffc77a', '#fff3b0', '#a8f0d4', '#8fd8ff', '#a9a0ff']; c.globalAlpha = 0.22; c.lineWidth = 5; cols.forEach(function (col, i) { c.strokeStyle = col; c.beginPath(); c.arc(W * 0.5, H * 0.95, 330 - i * 5, Math.PI * 1.1, Math.PI * 1.9); c.stroke(); }); c.globalAlpha = 1; };
function setStage(stage) { buildBg(stage); S.fogDensity = 0.72; S.fogTarget = 0.72; S.dawnT = -1; S.bossDark = 0; }

/* ---- タワー描画(s=62px 基準) ---- */
function drawBase(c, s, lv, t, id) {
  c.fillStyle = 'rgba(43,47,102,0.28)'; c.beginPath(); c.ellipse(0, s * 0.32, s * 0.40, s * 0.13, 0, 0, TAU); c.fill();
  rr(c, -s * 0.34, s * 0.12, s * 0.68, s * 0.2, s * 0.1); fs(c, '#fff1ea', 2);
  c.strokeStyle = 'rgba(255,255,255,0.7)'; c.lineWidth = 2; c.beginPath(); c.moveTo(-s * 0.22, s * 0.16); c.lineTo(s * 0.22, s * 0.16); c.stroke();
  for (var i = 0; i < lv; i++) { c.beginPath(); c.arc(-s * 0.12 * (lv - 1) + i * s * 0.24, s * 0.25, s * 0.045, 0, TAU); fs(c, '#ff9fb0', 1); }
  if (lv >= 3) { c.save(); c.translate(0, -s * 0.56 + Math.sin(t * 5 + id) * 1.5); star5(c, 0, 0, s * 0.09); fs(c, '#ffd770', 1.2); c.restore(); }
}
function flame(c, x, y, h, w, t, col1, col2, k) {
  var f = (1 + 0.12 * Math.sin(t * 9 + x)) * (k || 1);
  tear(c, x, y, w * f, h * f); c.fillStyle = col1; c.fill(); tear(c, x, y, w * 0.5 * f, h * 0.6 * f); c.fillStyle = col2; c.fill();
}
var TOWER_DRAW = {
  T1: function (c, s, lv, t, tw, aim, fk) {
    c.beginPath(); c.ellipse(0, -s * 0.12, s * 0.30, s * 0.32, 0, 0, TAU); fs(c, '#ffd9a0');
    c.beginPath(); c.arc(0, -s * 0.2, s * 0.3, Math.PI * 1.02, Math.PI * 1.98); c.closePath(); fs(c, '#ff9fb0'); c.beginPath(); c.arc(0, -s * 0.5, s * 0.05, 0, TAU); fs(c, '#ff9fb0', 1.5);
    var g = c.createLinearGradient(0, -s * 0.34, 0, -s * 0.08); g.addColorStop(0, '#fff6d6'); g.addColorStop(1, '#ffc77a'); c.beginPath(); c.ellipse(0, -s * 0.2, s * 0.17, s * 0.15, 0, 0, TAU); fs(c, g, 1.5);
    flame(c, 0, -s * 0.12, s * 0.2, s * 0.08, t, '#fff6d6', '#ffffff', fk);
    face(c, s * 0.04, s * 0.1, s * 0.05, null, t, tw ? tw.id : 0);
  },
  T4: function (c, s, lv, t, tw) {
    c.beginPath(); c.arc(0, -s * 0.02, s * 0.26, 0, TAU); fs(c, '#e6f6ff'); c.beginPath(); c.arc(0, -s * 0.32, s * 0.2, 0, TAU); fs(c, '#cfeeff');
    c.beginPath(); c.moveTo(0, -s * 0.66); c.lineTo(s * 0.07, -s * 0.57); c.lineTo(0, -s * 0.48); c.lineTo(-s * 0.07, -s * 0.57); c.closePath(); fs(c, '#8fd8ff', 1.5);
    face(c, -s * 0.32, s * 0.08, s * 0.045, null, t, tw ? tw.id : 0); c.fillStyle = OUT; c.beginPath(); c.arc(0, -s * 0.24, s * 0.025, 0, TAU); c.fill();
    c.fillStyle = 'rgba(255,255,255,0.85)'; for (var i = 0; i < 3; i++) { var a = t * 1.2 + i * 2.1, px = Math.cos(a) * s * 0.42, py = -s * 0.15 + Math.sin(a) * s * 0.18; c.fillRect(px - 1, py - 1, 3, 3); c.fillRect(px - 2.5, py - 0.5, 6, 1); }
  },
  T2: function (c, s, lv, t, tw, aim, fk) {
    c.beginPath(); c.ellipse(0, -s * 0.06, s * 0.3, s * 0.24, 0, 0, TAU); fs(c, '#cfe0f7'); face(c, -s * 0.02, s * 0.1, s * 0.05, null, t, tw ? tw.id : 0);
    c.save(); c.translate(0, -s * 0.26); c.rotate(aim == null ? -0.8 : aim); var rc = fk > 1 ? -s * 0.06 : 0; rr(c, -s * 0.1 + rc, -s * 0.06, s * 0.62, s * 0.12, s * 0.05); fs(c, '#a9c4e8', 1.8);
    c.beginPath(); c.arc(s * 0.52 + rc, 0, s * 0.06, 0, TAU); fs(c, '#a9c4e8', 1.5);
    c.beginPath(); c.moveTo(s * 0.46 + rc, 0); c.quadraticCurveTo(s * 0.24 + rc, -s * 0.09, s * 0.04 + rc, 0); c.quadraticCurveTo(s * 0.24 + rc, s * 0.09, s * 0.46 + rc, 0); fs(c, '#fff', 1.5); c.restore();
  },
  T3: function (c, s, lv, t, tw, aim) {
    c.beginPath(); c.arc(0, -s * 0.02, s * 0.26, 0, TAU); fs(c, '#9ff0cd'); c.beginPath(); c.arc(0, -s * 0.3, s * 0.2, 0, TAU); fs(c, '#9ff0cd');
    face(c, -s * 0.02, s * 0.1, s * 0.05, null, t, tw ? tw.id : 0);
    c.save(); c.translate(0, -s * 0.3); c.rotate(aim == null ? -1.2 : aim); c.beginPath(); c.moveTo(s * 0.1, -s * 0.07); c.lineTo(s * 0.42, -s * 0.2); c.lineTo(s * 0.42, s * 0.2); c.lineTo(s * 0.1, s * 0.07); c.closePath(); fs(c, '#6fe3b8', 1.8); c.beginPath(); c.ellipse(s * 0.42, 0, s * 0.05, s * 0.2, 0, 0, TAU); fs(c, '#3a9a7a', 1.5); c.restore();
    c.fillStyle = 'rgba(111,227,184,' + (0.1 + 0.07 * Math.sin(t * 2)) + ')'; c.beginPath(); c.arc(0, -s * 0.1, s * 0.4, 0, TAU); c.fill();
  },
  T5: function (c, s, lv, t, tw, aim, fk) {
    var ex = fk > 1 ? 1.25 : 1; c.lineCap = 'round'; for (var i = -1; i <= 1; i++) { c.beginPath(); c.moveTo(i * s * 0.16, -s * 0.08); c.quadraticCurveTo(i * s * 0.16 * ex + Math.sin(t * 3 + i) * 3, s * 0.02, i * s * 0.16 * ex, s * 0.1); c.lineWidth = 4; c.strokeStyle = OUT; c.stroke(); c.lineWidth = 2; c.strokeStyle = '#e6dcff'; c.stroke(); }
    c.beginPath(); c.arc(0, -s * 0.12, s * 0.3, Math.PI, 0); c.quadraticCurveTo(s * 0.2, -s * 0.04, 0, -s * 0.06); c.quadraticCurveTo(-s * 0.2, -s * 0.04, -s * 0.3, -s * 0.12); fs(c, '#e6dcff');
    c.strokeStyle = '#fff3b0'; c.lineWidth = 3; c.globalAlpha = 0.6 + 0.4 * Math.sin(t * 14); c.beginPath(); c.moveTo(-s * 0.04, -s * 0.46); c.lineTo(s * 0.04, -s * 0.38); c.lineTo(-s * 0.03, -s * 0.34); c.lineTo(s * 0.05, -s * 0.28); c.stroke(); c.globalAlpha = 1;
    face(c, -s * 0.16, s * 0.1, s * 0.05, null, t, tw ? tw.id : 0);
  },
  T6: function (c, s, lv, t, tw) {
    rr(c, -s * 0.03, -s * 0.2, s * 0.06, s * 0.3, 3); fs(c, '#c9d4f5', 1.5);
    c.save(); c.translate(0, -s * 0.3); c.rotate(tw ? tw.aim * Math.PI / 4 : -0.4); var g = c.createRadialGradient(0, 0, 0, 0, 0, s * 0.3); g.addColorStop(0, '#ffffff'); g.addColorStop(1, '#b9e0ff');
    c.beginPath(); c.ellipse(0, 0, s * 0.12, s * 0.28, 0, 0, TAU); c.fillStyle = g; c.fill(); c.lineWidth = 3; c.strokeStyle = '#cfeeff'; c.stroke(); c.lineWidth = 1.5; c.strokeStyle = OUT; c.beginPath(); c.ellipse(0, 0, s * 0.13, s * 0.29, 0, 0, TAU); c.stroke();
    c.fillStyle = 'rgba(255,255,255,0.7)'; c.beginPath(); c.ellipse(-s * 0.03, -s * 0.08, s * 0.02, s * 0.1, 0, 0, TAU); c.fill(); c.fillStyle = OUT; c.beginPath(); c.moveTo(s * 0.13, 0); c.lineTo(s * 0.2, -s * 0.05); c.lineTo(s * 0.2, s * 0.05); c.closePath(); c.fill(); c.restore();
    c.save(); c.translate(0, s * 0.2); face(c, 0, s * 0.07, s * 0.035, null, t, tw ? tw.id : 0); c.restore();
  },
  T7: function (c, s, lv, t, tw) {
    c.beginPath(); c.ellipse(0, -s * 0.1, s * 0.3, s * 0.3, 0, 0, TAU); fs(c, '#ffd9a0'); c.strokeStyle = '#e8a650'; c.lineWidth = 2; c.beginPath(); c.arc(0, -s * 0.1, s * 0.27, 0.2, Math.PI - 0.2); c.stroke(); c.beginPath(); c.arc(0, -s * 0.1, s * 0.27, Math.PI + 0.2, TAU - 0.2); c.stroke();
    face(c, -s * 0.1, s * 0.1, s * 0.05, null, t, tw ? tw.id : 0);
    c.save(); c.translate(s * 0.12, -s * 0.38); c.rotate(-0.4 + Math.sin(t * 2.4) * 0.3); rr(c, -s * 0.03, -s * 0.28, s * 0.06, s * 0.3, 3); fs(c, '#a9c4e8', 1.5); c.restore();
    var ph = (t * 1.6) % 1; c.fillStyle = C.oil; tear(c, s * 0.2, -s * 0.14 + ph * s * 0.34, s * 0.04, s * 0.09); c.fill();
  },
  T8: function (c, s, lv, t, tw) {
    c.beginPath(); c.arc(0, -s * 0.16, s * 0.3, 0, TAU); fs(c, '#ffe08a', 3);
    var g = c.createRadialGradient(0, -s * 0.16, 0, 0, -s * 0.16, s * 0.26); g.addColorStop(0, '#fff'); g.addColorStop(0.6, '#ffe9a8'); g.addColorStop(1, '#ffc77a'); c.beginPath(); c.arc(0, -s * 0.16, s * 0.25, 0, TAU); c.fillStyle = g; c.fill();
    c.save(); c.translate(0, -s * 0.16); c.rotate(tw ? tw.angle : t); c.strokeStyle = 'rgba(255,150,90,0.5)'; c.lineWidth = 1.5; for (var i = 0; i < 4; i++) { c.rotate(Math.PI / 4); c.beginPath(); c.moveTo(-s * 0.24, 0); c.lineTo(s * 0.24, 0); c.stroke(); } c.restore();
    c.save(); c.translate(0, s * 0.2); face(c, 0, s * 0.09, s * 0.04, null, t, tw ? tw.id : 0); c.restore();
  }
};
function drawTower(c, defId, x, y, s, lv, t, tw, aim, alpha, fk) {
  c.save(); c.translate(x, y); if (alpha != null) c.globalAlpha = alpha;
  var id = tw ? tw.id : 0, hp = (defId === 'T6' || defId === 'T2' || defId === 'T8') ? 0 : Math.sin(t * 3 + id) * 0.02 * s;
  drawBase(c, s, lv, t, id); c.translate(0, hp); if (fk > 1) { c.translate(0, s * 0.3); c.scale(1, fk); c.translate(0, -s * 0.3); }
  TOWER_DRAW[defId](c, s, lv, t, tw, aim, fk); c.restore();
}

/* ---- 敵描画(原点中心, r=描画半径px。足元は y≒+0.95r) ---- */
var ESIZE = { E01: 9, E02: 11, E03: 8, E04: 12, E05: 11, E06: 10, E07: 10, E08: 12, E09: 11, E10: 11, E11: 12, E12: 10, E13: 18, B1: 20, B2: 20, B3: 24, B4: 24 };
var ESIZE_V = {}; Object.keys(ESIZE).forEach(function (k) { ESIZE_V[k] = ESIZE[k] * (k[0] === 'B' ? VEboss : k === 'E13' ? VEbig : k === 'E06' ? VEfly : VEn); });
function fcE(c, r, y, sp, er, e, t, open) { face(c, y, sp, er, open, t, e ? e.id : 0); }
var ENEMY_DRAW = {
  E01: function (c, r, t, e) { tear(c, 0, r * 0.95, r * 1.0, r * 2.3 + Math.sin(t * 8 + e.id) * r * 0.15); fs(c, '#8fd0ff'); tear(c, 0, r * 0.85, r * 0.55, r * 1.4); c.fillStyle = '#e6f6ff'; c.fill(); fcE(c, r, r * 0.12, r * 0.3, r * 0.22, e, t); c.fillStyle = '#ffd6a0'; c.beginPath(); c.arc(Math.cos(t * 4) * r * 0.9, -r * 1.2 + Math.sin(t * 4) * r * 0.3, r * 0.1, 0, TAU); c.fill(); },
  E02: function (c, r, t, e) { c.beginPath(); c.ellipse(0, r * 0.25, r * 0.85, r * 0.75, 0, 0, TAU); fs(c, '#b6c5de'); c.beginPath(); c.arc(0, -r * 0.35, r * 0.62, Math.PI, 0); c.lineTo(r * 0.95, -r * 0.35); c.lineTo(-r * 0.95, -r * 0.35); c.closePath(); fs(c, '#ffd27a'); rr(c, r * 0.5, r * 0.2, r * 0.6, r * 0.5, 3); fs(c, '#d8b87a', 1.5); fcE(c, r, r * 0.05, r * 0.3, r * 0.22, e, t); },
  E03: function (c, r, t, e) { c.rotate(-0.08); c.beginPath(); c.moveTo(-r * 0.85, r * 0.9); for (var i = 0; i <= 6; i++) c.lineTo(-r * 0.85 + i * r * 0.283, r * 0.9 + (i % 2 ? r * 0.2 : 0) + Math.sin(t * 14 + i) * r * 0.06); c.lineTo(r * 0.85, -r * 0.1); c.arc(0, -r * 0.1, r * 0.85, 0, Math.PI, true); c.closePath(); fs(c, '#f4f6ff'); c.beginPath(); c.arc(-r * 0.55, -r * 0.85, r * 0.22, 0, TAU); c.arc(r * 0.55, -r * 0.85, r * 0.22, 0, TAU); fs(c, '#ffffff', 1.5); fcE(c, r, r * 0.05, r * 0.3, r * 0.26, e, t); },
  E04: function (c, r, t, e) { c.beginPath(); c.moveTo(-r * 0.9, r); c.lineTo(r * 0.9, r); c.lineTo(r * 0.65, -r * 0.1); c.lineTo(-r * 0.65, -r * 0.1); c.closePath(); fs(c, '#9fb0ca'); c.beginPath(); c.arc(0, -r * 0.35, r * 0.75, Math.PI, 0); c.lineTo(r * 0.75, -r * 0.1); c.lineTo(-r * 0.75, -r * 0.1); c.closePath(); fs(c, '#b8c8e2'); rr(c, -r * 0.5, -r * 0.45, r, r * 0.28, r * 0.12); c.fillStyle = OUT; c.fill(); c.fillStyle = '#b6f4ff'; c.beginPath(); c.arc(-r * 0.22, -r * 0.31, r * 0.1, 0, TAU); c.arc(r * 0.22, -r * 0.31, r * 0.1, 0, TAU); c.fill(); smile(c, 0, r * 0.35, r * 0.2); c.fillStyle = '#cfeeff'; tear(c, r * 0.7, -r * 0.1, r * 0.1, r * 0.25); c.fill(); },
  E05: function (c, r, t, e) { c.strokeStyle = 'rgba(190,225,245,0.95)'; c.lineWidth = 3; c.lineCap = 'round'; for (var i = -2; i <= 2; i++) { c.beginPath(); c.moveTo(i * r * 0.38, r * 0.2); c.quadraticCurveTo(i * r * 0.38 + Math.sin(t * 4 + i) * r * 0.2, r * 0.7, i * r * 0.38, r * 1.15); c.stroke(); } c.beginPath(); c.arc(0, r * 0.1, r * 1.0, Math.PI, 0); c.quadraticCurveTo(r * 0.5, r * 0.45, 0, r * 0.3); c.quadraticCurveTo(-r * 0.5, r * 0.45, -r, r * 0.1); fs(c, 'rgba(190,225,245,0.92)'); c.fillStyle = 'rgba(255,255,255,0.5)'; [[-0.5, -0.3], [0.45, -0.45], [0.1, -0.7]].forEach(function (p) { c.beginPath(); c.arc(p[0] * r, p[1] * r, r * 0.1, 0, TAU); c.fill(); }); fcE(c, r, -r * 0.1, r * 0.3, r * 0.2, e, t); },
  E06: function (c, r, t, e) { var w = Math.sin(t * 18 + e.id) * r * 0.5; [-1, 1].forEach(function (d) { c.beginPath(); c.moveTo(d * r * 0.3, 0); c.quadraticCurveTo(d * r * 1.3, -r * 0.9 - w, d * r * 1.7, -r * 0.1 - w); c.quadraticCurveTo(d * r * 1.2, r * 0.5, d * r * 0.3, r * 0.3); fs(c, '#8a9ad8', 1.8); }); c.beginPath(); c.ellipse(0, 0, r * 0.75, r * 0.65, 0, 0, TAU); fs(c, '#6b7bb8'); c.beginPath(); c.moveTo(-r * 0.12, r * 0.12); c.lineTo(r * 0.12, r * 0.12); c.lineTo(0, r * 0.4); c.closePath(); fs(c, '#ffd27a', 1.2); fcE(c, r, -r * 0.12, r * 0.3, r * 0.25, e, t); },
  E07: function (c, r, t, e) { rr(c, -r * 0.6, -r * 0.3, r * 1.2, r * 1.3, r * 0.3); fs(c, '#fff1dc'); c.fillStyle = '#ffe3b0'; tear(c, -r * 0.35, -r * 0.2, r * 0.12, r * 0.35); c.fill(); tear(c, r * 0.4, -r * 0.2, r * 0.1, r * 0.28); c.fill(); var up = e.lit ? 1 : -1; c.save(); c.translate(0, -r * 0.3); c.scale(1, up < 0 ? -1 : 1); flame(c, 0, 0, r * 0.7, r * 0.22, t, '#ffc77a', '#fff6d6'); c.restore(); fcE(c, r, r * 0.25, r * 0.3, r * 0.25, e, t); c.strokeStyle = OUT; c.lineWidth = 1.4; c.beginPath(); c.moveTo(-r * 0.5, r * 0.0); c.lineTo(-r * 0.2, r * 0.06); c.moveTo(r * 0.5, r * 0.0); c.lineTo(r * 0.2, r * 0.06); c.stroke(); },
  E08: function (c, r, t, e) { var tw2 = Math.sin(t * 6) * r * 0.25; c.beginPath(); c.moveTo(-r * 1.0, 0); c.lineTo(-r * 1.7, -r * 0.7 + tw2); c.lineTo(-r * 1.7, r * 0.7 + tw2); c.closePath(); fs(c, '#79c2d6'); c.beginPath(); c.moveTo(-r * 0.3, -r * 0.75); c.lineTo(r * 0.1, -r * 1.3); c.lineTo(r * 0.5, -r * 0.75); fs(c, '#5aa4ba', 1.5); c.beginPath(); c.ellipse(0, 0, r * 1.15, r * 0.85, 0, 0, TAU); fs(c, '#79c2d6'); bigEye(c, r * 0.55, -r * 0.2, r * 0.3, blink(t, e.id)); cheek(c, r * 0.3, r * 0.25, r * 0.2); c.strokeStyle = OUT; c.lineWidth = 1.6; c.beginPath(); c.arc(r * 0.9, r * 0.1, r * 0.1, 0, TAU); c.stroke(); if (!e.lit) { c.fillStyle = 'rgba(255,255,255,0.7)'; c.beginPath(); c.arc(r * 0.8, -r * 1.0 - ((t * 20) % (r * 0.8)), r * 0.12, 0, TAU); c.fill(); } },
  E09: function (c, r, t, e) { rr(c, -r * 0.55, r * 0.3, r * 1.1, r * 0.7, 4); fs(c, '#c9b2e8'); c.beginPath(); c.arc(0, -r * 0.2, r * 0.82, 0, TAU); fs(c, '#ffe3c8'); c.beginPath(); c.arc(0, -r * 0.95, r * 0.18, 0, TAU); fs(c, '#ff9fb0', 1.5); c.strokeStyle = OUT; c.lineWidth = 1.6; c.beginPath(); c.moveTo(r * 0.1, -r * 1.0); c.lineTo(-r * 0.05, -r * 0.6); c.lineTo(r * 0.1, -r * 0.3); c.stroke(); flame(c, r * 0.25, -r * 0.6, r * 0.5, r * 0.15, t, '#8fd0ff', '#e6f6ff'); [-1, 1].forEach(function (d) { c.fillStyle = OUT; c.beginPath(); c.arc(d * r * 0.3, -r * 0.2, r * 0.17, 0, TAU); c.fill(); c.strokeStyle = '#fff'; c.lineWidth = 1; c.beginPath(); c.moveTo(d * r * 0.3 - r * 0.08, -r * 0.28); c.lineTo(d * r * 0.3 + r * 0.08, -r * 0.12); c.moveTo(d * r * 0.3 + r * 0.08, -r * 0.28); c.lineTo(d * r * 0.3 - r * 0.08, -r * 0.12); c.stroke(); }); cheek(c, -r * 0.55, r * 0.1, r * 0.17); cheek(c, r * 0.55, r * 0.1, r * 0.17); },
  E10: function (c, r, t, e) { c.beginPath(); c.moveTo(-r * 1.2, r * 0.3); c.quadraticCurveTo(-r * 0.2, -r * 1.2, r * 1.2, -r * 0.1); c.quadraticCurveTo(r * 0.3, r * 0.7, -r * 1.2, r * 0.3); fs(c, '#7fc2e8'); c.beginPath(); c.moveTo(-r * 0.2, -r * 0.55); c.lineTo(0, -r * 1.15); c.lineTo(r * 0.3, -r * 0.45); fs(c, '#5aa0c8', 1.5); c.beginPath(); c.moveTo(-r * 1.2, r * 0.3); c.lineTo(-r * 1.75, -r * 0.1 + Math.sin(t * 9) * r * 0.2); c.lineTo(-r * 1.6, r * 0.75); fs(c, '#5aa0c8', 1.5); c.fillStyle = '#fff'; c.beginPath(); c.ellipse(-r * 0.1, r * 0.3, r * 0.7, r * 0.18, -0.1, 0, TAU); c.fill(); bigEye(c, r * 0.6, -r * 0.12, r * 0.26, blink(t, e.id)); cheek(c, r * 0.35, r * 0.2, r * 0.2); },
  E11: function (c, r, t, e) { c.beginPath(); c.moveTo(-r * 0.4, -r * 1.0); c.quadraticCurveTo(0, -r * 1.5, r * 0.4, -r * 1.0); c.quadraticCurveTo(r * 1.3, r * 0.2, r * 1.15, r * 0.95); c.lineTo(-r * 1.15, r * 0.95); c.quadraticCurveTo(-r * 1.3, r * 0.2, -r * 0.4, -r * 1.0); fs(c, '#e4dcff'); c.beginPath(); c.arc(0, -r * 1.25, r * 0.17, 0, TAU); fs(c, '#ffd770', 1.5); fcE(c, r, -r * 0.1, r * 0.33, r * 0.25, e, t, 0.7); if (e.shield > 0) { c.strokeStyle = 'rgba(255,246,214,' + (0.5 + 0.3 * Math.sin(t * 6)) + ')'; c.lineWidth = 2; c.beginPath(); c.arc(0, 0, r * 1.5, 0, TAU); c.stroke(); c.lineWidth = 1; c.beginPath(); c.arc(0, 0, r * 1.62, 0, TAU); c.stroke(); } },
  E12: function (c, r, t, e) { c.strokeStyle = 'rgba(159,224,200,0.9)'; c.lineWidth = 2; for (var i = 0; i < 3; i++) { c.beginPath(); c.arc(0, 0, r * (1.1 + i * 0.22), t * 3 + i * 2, t * 3 + i * 2 + 2.2); c.stroke(); } [[-0.55, 0.15, 0.55], [0.5, 0.2, 0.5], [0, -0.35, 0.65]].forEach(function (b) { c.beginPath(); c.arc(b[0] * r, b[1] * r, b[2] * r, 0, TAU); fs(c, '#cfe0ff', 1.8); }); fcE(c, r, r * 0.05, r * 0.3, r * 0.24, e, t); c.strokeStyle = '#ffd770'; c.lineWidth = 1.5; c.beginPath(); c.moveTo(r * 0.72, r * 0.2); c.lineTo(r * 0.62, r * 0.35); c.lineTo(r * 0.76, r * 0.38); c.lineTo(r * 0.64, r * 0.55); c.stroke(); },
  E13: function (c, r, t, e) { [-1, 1].forEach(function (d) { rr(c, d * r * 0.55 - r * 0.25, r * 0.6, r * 0.5, r * 0.4, 5); fs(c, '#8493b0'); }); rr(c, -r * 1.0, -r * 0.4, r * 2.0, r * 1.5, r * 0.5); fs(c, '#9fb0ca'); c.beginPath(); c.arc(0, -r * 0.5, r * 0.85, Math.PI, 0); c.closePath(); fs(c, '#b8c8e2'); [-1, 1].forEach(function (d) { c.beginPath(); c.arc(d * r * 1.05, -r * 0.15, r * 0.3, 0, TAU); fs(c, '#ffc4b5', 1.8); c.strokeStyle = OUT; c.lineWidth = 1.2; c.beginPath(); c.arc(d * r * 1.05, -r * 0.15, r * 0.14, 0, 4.5); c.stroke(); }); fcE(c, r, -r * 0.1, r * 0.34, r * 0.17, e, t, 0.55); },
  B1: function (c, r, t, e) { c.beginPath(); c.moveTo(0, -r * 1.3); c.quadraticCurveTo(r * 1.2, -r * 0.5, r * 1.25, r * 1.0); for (var i = 0; i <= 5; i++) c.lineTo(r * 1.25 - i * r * 0.5, r * 1.0 + (i % 2 ? r * 0.15 : 0)); c.quadraticCurveTo(-r * 1.2, -r * 0.5, 0, -r * 1.3); fs(c, '#6a78b8'); c.beginPath(); c.ellipse(0, -r * 0.45, r * 0.6, r * 0.55, 0, 0, TAU); c.fillStyle = '#2b2f66'; c.fill(); c.fillStyle = '#ffd0a0'; c.beginPath(); c.arc(-r * 0.25, -r * 0.45, r * 0.18, 0, TAU); c.arc(r * 0.25, -r * 0.45, r * 0.18, 0, TAU); c.fill(); c.fillStyle = OUT; c.beginPath(); c.arc(-r * 0.25, -r * 0.45, r * 0.08, 0, TAU); c.arc(r * 0.25, -r * 0.45, r * 0.08, 0, TAU); c.fill(); star5(c, 0, -r * 1.12, r * 0.12); c.fillStyle = '#fff3b0'; c.fill(); c.strokeStyle = '#a9b3ee'; c.lineWidth = 3; c.beginPath(); c.moveTo(r * 1.0, -r * 0.4); c.lineTo(r * 1.0, r * 1.0); c.stroke(); flame(c, r * 1.0, -r * 0.4, r * 0.6, r * 0.2, t, '#ffc77a', '#fff6d6'); },
  B2: function (c, r, t, e) { rr(c, -r * 0.95, 0, r * 1.9, r * 1.0, r * 0.4); fs(c, '#6a78b8'); c.beginPath(); c.arc(0, -r * 0.35, r * 0.75, 0, TAU); fs(c, '#e8c9a0'); [[-0.5, 0.15], [0.5, 0.15], [-0.25, 0.4], [0.25, 0.4], [0, 0.25]].forEach(function (p) { c.beginPath(); c.arc(p[0] * r, p[1] * r, r * 0.3, 0, TAU); fs(c, '#fbf8ff', 1.5); }); c.beginPath(); c.moveTo(-r * 0.95, -r * 0.55); c.lineTo(r * 0.95, -r * 0.55); c.lineTo(r * 0.55, -r * 1.2); c.lineTo(-r * 0.55, -r * 1.2); c.closePath(); fs(c, '#2b2f66'); c.fillStyle = '#ffd770'; c.beginPath(); c.arc(0, -r * 0.88, r * 0.12, 0, TAU); c.fill(); bigEye(c, -r * 0.28, -r * 0.4, r * 0.2, blink(t, e.id)); bigEye(c, r * 0.28, -r * 0.4, r * 0.2, blink(t, e.id)); c.strokeStyle = '#a9b3ee'; c.lineWidth = 3; c.beginPath(); c.arc(r * 1.15, r * 0.5, r * 0.28, Math.PI * 0.2, Math.PI * 1.5); c.stroke(); c.beginPath(); c.arc(-r * 0.7, -r * 0.95 + Math.sin(t * 6) * 2, r * 0.17, 0, TAU); fs(c, '#fff', 1.2); },
  B3: function (c, r, t, e) { c.beginPath(); c.arc(0, 0, r * 1.15, 0, TAU); fs(c, '#6a9ae0'); c.fillStyle = '#fbf8ff'; for (var i = 0; i < 6; i++) { c.beginPath(); c.arc(-r * 0.85 + i * r * 0.34, r * 0.9 + Math.sin(t * 3 + i) * 2, r * 0.2, Math.PI, 0); c.fill(); } c.beginPath(); c.arc(0, -r * 1.15, r * 0.18, 0, TAU); fs(c, '#ffc4b5', 1.5); fcE(c, r, -r * 0.1, r * 0.4, r * 0.22, e, t); c.fillStyle = 'rgba(255,255,255,0.6)'; for (var j = 0; j < 4; j++) { var a = t * 1.5 + j * 1.57; c.beginPath(); c.arc(Math.cos(a) * r * 1.4, Math.sin(a) * r * 0.9, r * 0.08, 0, TAU); c.fill(); } },
  B4: function (c, r, t, e) { var p2 = e && e.phase2, col = p2 ? '#a08cf0' : '#7a86e0'; c.beginPath(); c.moveTo(-r * 1.5, r * 0.2); c.lineTo(-r * 2.2, -r * 0.5 + Math.sin(t * 2) * r * 0.15); c.lineTo(-r * 2.1, r * 0.8); c.closePath(); fs(c, col); c.beginPath(); c.ellipse(0, 0, r * 1.7, r * 1.1, 0, 0, TAU); fs(c, col); c.beginPath(); c.ellipse(0, r * 0.4, r * 1.4, r * 0.55, 0, 0, Math.PI); c.fillStyle = '#eef0ff'; c.fill(); c.fillStyle = '#fff6d6'; for (var i = 0; i < 5; i++) { c.beginPath(); c.arc(-r * 0.9 + i * r * 0.4, -r * 0.5 + Math.sin(i * 2) * r * 0.2, 2, 0, TAU); c.fill(); } bigEye(c, r * 0.8, -r * 0.1, r * 0.3, 1); cheek(c, r * 0.55, r * 0.3, r * 0.2); if (p2) { c.fillStyle = '#b6f4ff'; tear(c, r * 0.8, r * 0.2 + (t % 1) * r * 0.7, r * 0.08, r * 0.2); c.fill(); } c.fillStyle = 'rgba(207,238,255,0.9)'; for (var j = 0; j < 4; j++) { c.beginPath(); c.arc(-r * 0.2 + Math.sin(j) * r * 0.25, -r * 1.2 - ((t * 0.8 + j * 0.25) % 1) * r * 0.7, r * 0.1, 0, TAU); c.fill(); } }
};
var ECOL = { E01: '#8fd0ff', E02: '#b6c5de', E03: '#f4f6ff', E04: '#9fb0ca', E05: '#bee1f5', E06: '#6b7bb8', E07: '#fff1dc', E08: '#79c2d6', E09: '#ffe3c8', E10: '#7fc2e8', E11: '#e4dcff', E12: '#cfe0ff', E13: '#9fb0ca', B1: '#6a78b8', B2: '#e8c9a0', B3: '#6a9ae0', B4: '#7a86e0' };
var HEAVY = { E04: 1, E08: 1, E13: 1, B1: 1, B2: 1, B3: 1, B4: 1 }, FAST = { E03: 1, E10: 1 };
function drawEnemy(c, e, t, alpha, x, y) {
  var r = ESIZE_V[e.def], heavy = HEAVY[e.def], f = e.flying ? 3 : 7 * (heavy ? 0.5 : 1) * (FAST[e.def] ? 1.8 : 1);
  var h = hop(t, e.id, f), jump = h * r * (heavy ? 0.14 : 0.28) * (e.flying ? 0.6 : 1);
  c.save(); c.translate(x, y);
  c.fillStyle = 'rgba(43,47,102,' + (0.3 - h * 0.1) + ')'; c.beginPath(); c.ellipse(0, r * 0.95 + (e.flying ? 12 : 0), r * 0.9 * (1 - h * 0.25), r * 0.28, 0, 0, TAU); c.fill();
  c.translate(0, -jump - (e.flying ? 12 : 0)); squash(c, r * 0.95, (1 - h) * 0.07 - h * 0.03); if (e.stunT > 0) c.rotate(Math.sin(t * 30) * 0.15);
  c.globalAlpha = alpha; ENEMY_DRAW[e.def](c, r, t, e);
  if (e.flash > 0) { c.globalAlpha = Math.min(1, alpha) * 0.5; c.fillStyle = '#fff'; c.beginPath(); c.ellipse(0, 0, r * 0.95, r * 0.95, 0, 0, TAU); c.fill(); }
  c.restore();
}

/* ---- 灯台 ---- */
function drawLighthouse(c, x, y, t, hpRatio) {
  c.save(); c.translate(x, y); c.scale(1.35, 1.35);
  c.fillStyle = 'rgba(43,47,102,0.3)'; c.beginPath(); c.ellipse(0, 16, 22, 7, 0, 0, TAU); c.fill();
  c.beginPath(); c.moveTo(-15, 16); c.quadraticCurveTo(-13, -10, -8, -30); c.lineTo(8, -30); c.quadraticCurveTo(13, -10, 15, 16); c.closePath(); fs(c, '#fff6ee', 1.8);
  c.fillStyle = '#ff9fb0'; [4, -14].forEach(function (b) { c.beginPath(); c.moveTo(-12, b); c.lineTo(12, b); c.lineTo(11, b - 8); c.lineTo(-11, b - 8); c.closePath(); c.fill(); });
  for (var i = 0; i < 3; i++) { c.fillStyle = '#ffd770'; c.globalAlpha = hpRatio < 0.3 ? 0.4 + 0.6 * Math.abs(Math.sin(t * 7 + i)) : 1; c.beginPath(); c.arc(0, 10 - i * 10, 2.6, 0, TAU); c.fill(); } c.globalAlpha = 1;
  rr(c, -10, -36, 20, 6, 3); fs(c, '#ffc4b5', 1.5);
  var g = c.createLinearGradient(0, -50, 0, -36); g.addColorStop(0, '#ffc77a'); g.addColorStop(1, '#fff6d6'); c.beginPath(); c.arc(0, -43, 8, 0, TAU); fs(c, g, 1.5);
  c.beginPath(); c.arc(0, -47, 10, Math.PI, 0); c.closePath(); fs(c, '#ff9fb0', 1.5);
  bigEye(c, -3, -43, 1.8, hpRatio < 0.3 ? 0.6 : 1, 0); bigEye(c, 3, -43, 1.8, hpRatio < 0.3 ? 0.6 : 1, 0); if (hpRatio < 0.3) { c.fillStyle = '#b6f4ff'; tear(c, 7, -40, 1.5, 4); c.fill(); }
  c.restore();
}

/* ---- イベント → 演出 ---- */
function confetti(n) { if (S.fxLevel === 0) return; n = Math.round(n * (S.fxLevel === 2 ? 1.3 : 1)); for (var i = 0; i < n; i++) fxAdd({ k: 'conf', x: Math.random() * W, y: -10 - Math.random() * 60, vx: (Math.random() - 0.5) * 40, vy: 60 + Math.random() * 60, col: ['#ffd770', '#ff9fb0', '#a8f0d4', '#cfeeff', '#fff3b0'][i % 5], t: 0, life: 2.2 + Math.random() }); }
function fxAdd(o) { if (S.fx.length < S.fxCap) S.fx.push(o); return o; }
function onEvents(evs) {
  for (var i = 0; i < evs.length; i++) {
    var e = evs[i];
    switch (e.t) {
      case 'fire':
        S.aim[e.tid] = Math.atan2(e.ty - e.y, e.tx - e.x); S.fireT[e.tid] = S.t;
        if (e.def === 'T1') fxAdd({ k: 'orb', x: e.x * TS, y: (e.y - 0.2) * TS, x2: e.tx * TS, y2: e.ty * TS, t: 0, life: 0.16, col: '#ffe9a8', r: 5 });
        else if (e.def === 'T2') fxAdd({ k: 'orb', x: e.x * TS, y: (e.y - 0.2) * TS, x2: e.tx * TS, y2: e.ty * TS, t: 0, life: 0.2, col: '#ffffff', r: 5, rope: true });
        else if (e.def === 'T4') fxAdd({ k: 'orb', x: e.x * TS, y: (e.y - 0.3) * TS, x2: e.tx * TS, y2: e.ty * TS, t: 0, life: 0.18, col: '#bfe9ff', r: 5 });
        break;
      case 'blast': S.shake = Math.max(S.shake, 0.06); fxAdd({ k: 'ring', x: e.x * TS, y: e.y * TS, r: e.r * TS, t: 0, life: 0.45, col: '#a8f0d4', w: 4 }); for (var q = 0; q < 3; q++) fxAdd({ k: 'bubble', x: e.x * TS + (q - 1) * 14, y: e.y * TS, t: 0, life: 0.7 }); break;
      case 'chain': fxAdd({ k: 'zap', pts: e.pts, t: 0, life: 0.18 }); break;
      case 'hit': if (!e.nodmg) for (var k = 0; k < 3; k++) fxAdd({ k: 'spark', x: e.x * TS, y: e.y * TS, a: Math.random() * TAU, t: 0, life: 0.18 }); break;
      case 'kill': fxAdd({ k: 'killpop', def: e.def, x: e.x * TS, y: e.y * TS, boss: e.boss, t: 0, life: e.boss ? 0.5 : 0.22 }); for (var j = 0; j < (e.boss ? 18 : 6); j++) fxAdd({ k: 'mote', x: e.x * TS + (Math.random() - 0.5) * 14, y: e.y * TS, vy: -30 - Math.random() * 40, t: 0, life: 0.6 + Math.random() * 0.3, star: j < 2 });
        if (e.oil) fxAdd({ k: 'text', x: e.x * TS, y: e.y * TS - 14, s: '+' + e.oil, col: '#ffd27a', t: 0, life: 0.9 });
        if (e.boss) { S.shake = 0.5; S.flashW = 0.6; fxAdd({ k: 'ring', x: e.x * TS, y: e.y * TS, r: 140, t: 0, life: 1.0, col: '#fff6d6', w: 8 }); for (var bq = 0; bq < 24; bq++) fxAdd({ k: 'mote', x: e.x * TS + (Math.random() - 0.5) * 60, y: e.y * TS + (Math.random() - 0.5) * 40, vy: -60 - Math.random() * 60, t: 0, life: 1.0, star: bq % 2 === 0, gold: bq % 3 === 0 }); } break;
      case 'leak': S.hitFlash = 0.6; S.shake = 0.25; break;
      case 'build': fxAdd({ k: 'soft', x: e.x * TS, y: e.y * TS, t: 0, life: 0.45 }); fxAdd({ k: 'ring', x: e.x * TS, y: e.y * TS, r: 40, t: 0, life: 0.35, col: '#ffffff', w: 3 }); for (var s2 = 0; s2 < 6; s2++) fxAdd({ k: 'mote', x: e.x * TS, y: e.y * TS, vy: -25 - Math.random() * 25, t: 0, life: 0.6, star: true }); S.grow[e.id] = S.t; break;
      case 'upgrade': fxAdd({ k: 'text', x: e.x * TS, y: e.y * TS - 30, s: 'Lv' + (e.lv + 1) + '!', col: '#fff3b0', t: 0, life: 1.0 }); fxAdd({ k: 'beam', x: e.x * TS, y: e.y * TS, t: 0, life: 0.5 }); fxAdd({ k: 'ring', x: e.x * TS, y: e.y * TS, r: 54, t: 0, life: 0.5, col: '#ffd770', w: 5 }); for (var q2 = 0; q2 < 10; q2++) fxAdd({ k: 'mote', x: e.x * TS + (Math.random() - 0.5) * 36, y: e.y * TS + 10, vy: -40 - Math.random() * 30, t: 0, life: 0.7, gold: true }); break;
      case 'sell': fxAdd({ k: 'text', x: e.x * TS, y: e.y * TS - 18, s: '+' + e.value, col: '#ffd27a', t: 0, life: 0.9 }); break;
      case 'freeze': fxAdd({ k: 'ring', x: e.x * TS, y: e.y * TS, r: 22, t: 0, life: 0.4, col: '#8fd8ff', w: 3 }); break;
      case 'split': fxAdd({ k: 'ring', x: e.x * TS, y: e.y * TS, r: 28, t: 0, life: 0.3, col: '#cfeeff', w: 3 }); break;
      case 'summon': fxAdd({ k: 'ring', x: e.x * TS, y: e.y * TS, r: 44, t: 0, life: 0.5, col: '#b6f4ff', w: 3 }); break;
      case 'bell': S.shake = 0.15; fxAdd({ k: 'ring', x: S.bellX || 480, y: S.bellY || 270, r: 400, t: 0, life: 1.0, col: '#ffd770', w: 6 }); break;
      case 'upkeep': if (S.baseXY) fxAdd({ k: 'text', x: S.baseXY[0], y: S.baseXY[1] - 70, s: '維持費 -' + e.total, col: '#ffb3c0', t: 0, life: 1.4 }); break;
      case 'wave': if (e.last) S.fogTarget = 0.8; break;
      case 'win': S.fogTarget = 0; S.dawnT = 0; confetti(60); break;
      case 'waveClear': confetti(18); break;
      case 'bossWarn': S.warns.push({ x: e.x * TS, y: e.y * TS, kind: e.kind, t: 0, life: 1.8 }); break;
      case 'roar': S.shake = 0.35; S.flashW = 0.35; fxAdd({ k: 'ring', x: e.x * TS, y: e.y * TS, r: 4.5 * TS, t: 0, life: 0.6, col: '#ff9fb0', w: 8 }); break;
      case 'dash': S.shake = 0.2; break;
      case 'ambushWarn': S.warns.push({ x: e.x * TS, y: e.y * TS, kind: 'ambush', t: 0, life: 4 }); break;
      case 'ambush': fxAdd({ k: 'ring', x: e.x * TS, y: e.y * TS, r: 50, t: 0, life: 0.5, col: '#b6f4ff', w: 5 }); break;
      case 'gust': fxAdd({ k: 'ring', x: e.x * TS, y: e.y * TS, r: 40, t: 0, life: 0.5, col: '#cfe0ff', w: 3 }); break;
      case 'picked': for (var pq = 0; pq < 10; pq++) fxAdd({ k: 'mote', x: e.x * TS + (Math.random() - 0.5) * 20, y: e.y * TS, vy: -50 - Math.random() * 40, t: 0, life: 0.8, star: pq < 5, gold: pq >= 5 }); fxAdd({ k: 'text', x: e.x * TS, y: e.y * TS - 14, s: e.kind === 'star' ? '+' + e.v : '力がわく!', col: '#fff3b0', t: 0, life: 1.1 }); break;
      case 'combo': fxAdd({ k: 'text', x: e.x * TS, y: e.y * TS - 30, s: '連鎖×' + e.n + ' +' + e.bonus, col: '#ffe08a', t: 0, life: 1.2 }); break;
      case 'reveal': if (S.stageId === 3 && S.fxLevel > 0) fxAdd({ k: 'ring', x: e.x * TS, y: e.y * TS + 12, r: 22, t: 0, life: 0.6, col: '#cfeeff', w: 2 }); break;
      case 'flash': fxAdd({ k: 'ring', x: e.x * TS, y: e.y * TS, r: 100, t: 0, life: 0.5, col: '#fff6d6', w: 5 }); break;
      case 'undo': fxAdd({ k: 'text', x: e.x * TS, y: e.y * TS - 26, s: '取り消し', col: '#cfeeff', t: 0, life: 0.9 }); break;
      case 'lose': S.fogTarget = 1.0; break;
      case 'bossPhase': S.shake = 0.3; break;
      case 'spawn': if (e.def[0] === 'B') { S.bossDark = 0.6; S.fogTarget = 0.86; setTimeout(function () { if (S.fogTarget > 0.8 && S.fogTarget < 0.9) S.fogTarget = 0.72; }, 3000); } break;
    }
  }
}

/* ---- メイン描画 ---- */
function fanPath(c, x, y, len, ang, half) { c.beginPath(); c.moveTo(x, y); c.arc(x, y, len, ang - half, ang + half); c.closePath(); }
function draw(g, ui, dt, opts) {
  opts = opts || {}; var c = S.ctx, t = S.t += dt, i, j, e, tw, stage = g.stage; S.baseXY = [g.base.x * TS, g.base.y * TS];
  c.setTransform(S.scale, 0, 0, S.scale, 0, 0);
  var sx = 0, sy = 0; if (S.shake > 0 && !opts.reduced) { S.shake -= dt; var a = S.shake * 8; sx = (Math.random() - 0.5) * a; sy = (Math.random() - 0.5) * a; }
  c.save(); c.translate(sx, sy); c.drawImage(S.bg, 0, 0);
  c.strokeStyle = '#fff'; c.globalAlpha = 0.3; c.lineWidth = 2; c.lineCap = 'round';
  for (i = 0; i < 5; i++) { var wy = 90 + i * 100; c.beginPath(); for (var xx = 20; xx < W; xx += 70) { c.moveTo(xx + Math.sin(t * 0.6 + i) * 6 - 10, wy); c.arc(xx + Math.sin(t * 0.6 + i) * 6, wy, 10, Math.PI, 0); } c.stroke(); }
  c.globalAlpha = 1;
  drawDyn(c, t, false);
  if (g.air) { var ax = Math.min(W - 12, Math.max(12, g.air.x * TS)), ay = Math.min(H - 12, Math.max(12, g.air.y * TS)); c.fillStyle = 'rgba(182,244,255,0.45)'; c.beginPath(); c.arc(ax, ay, 8 + Math.sin(t * 4) * 1.5, 0, TAU); c.fill(); c.strokeStyle = 'rgba(182,244,255,0.28)'; c.lineWidth = 2; c.setLineDash([4, 7]); c.beginPath(); c.moveTo(g.air.x * TS, g.air.y * TS); c.lineTo(g.base.x * TS, g.base.y * TS); c.stroke(); c.setLineDash([]); }
  if (stage.tide) { var sp = g.paths[1]; if (sp) { var open = (g.wave + 1) % 2 === 0; c.fillStyle = open ? 'rgba(255,199,122,0.7)' : 'rgba(200,210,240,0.3)'; c.beginPath(); c.arc(sp.pts[0][0] * TS - 14, sp.pts[0][1] * TS, 10, 0, TAU); c.fill(); } }
  if (g.paths.length > 1 && !stage.tide) { var rt = g.route; g.paths.forEach(function (p) { var on = rt === p.id; if (rt !== 'mix' && !on) return; c.strokeStyle = on ? 'rgba(255,214,150,0.55)' : 'rgba(255,255,255,0.12)'; c.lineWidth = on ? 10 : 5; c.lineJoin = 'round'; c.beginPath(); p.pts.forEach(function (q, k) { k ? c.lineTo(q[0] * TS, q[1] * TS) : c.moveTo(q[0] * TS, q[1] * TS); }); c.stroke(); }); }
  var placing = ui && ui.placing, selSlot = ui && ui.selSlot != null ? ui.selSlot : -1, hi = ui && ui.hiSlot != null ? ui.hiSlot : -1;
  for (i = 0; i < g.slots.length; i++) {
    var s = g.slots[i]; if (s.blocked) { c.beginPath(); c.ellipse(s.x * TS, s.y * TS + 2, 20, 17, 0, 0, TAU); fs(c, '#8f94d8', 2); c.fillStyle = 'rgba(255,255,255,0.4)'; c.beginPath(); c.ellipse(s.x * TS - 6, s.y * TS - 6, 6, 3, -0.5, 0, TAU); c.fill(); continue; } if (s.tower) continue; var px = s.x * TS, py = s.y * TS, pulse = 0.5 + 0.5 * Math.sin(t * 5);
    var on = (placing && !opts.noHints) || i === selSlot || i === hi;
    if (on) { c.fillStyle = 'rgba(255,214,150,' + (0.16 + 0.22 * pulse * (i === hi ? 2 : 1)) + ')'; rr(c, px - 25, py - 25, 50, 50, 15); c.fill(); }
    if (i === selSlot) { c.strokeStyle = C.warm; c.lineWidth = 3.5; rr(c, px - 27, py - 27, 54, 54, 16); c.stroke(); }
    if (i === hi) { c.strokeStyle = C.warm; c.lineWidth = 4; c.globalAlpha = 0.5 + 0.5 * pulse; rr(c, px - 29, py - 29, 58, 58, 17); c.stroke(); c.globalAlpha = 1; }
    var lab = s.bonus > 0 ? '+' + s.bonus.toFixed(1) : s.kind === 'prime' ? '特等' : null;
    if (lab) { c.font = 'bold 13px sans-serif'; c.textAlign = 'center'; c.lineWidth = 3; c.strokeStyle = OUT; c.strokeText(lab, px, py + 5); c.fillStyle = C.core; c.fillText(lab, px, py + 5); }
  }
  for (i = 0; i < g.towers.length; i++) { tw = g.towers[i]; if (tw.def !== 'T6') continue; var ML = T.T6.lv[tw.lv], sel = ui && ui.selTower === tw; fanPath(c, tw.x * TS, tw.y * TS - 8, (ML.infl + (tw.rel || 0)) * TS, tw.aim * Math.PI / 4, ML.cone * Math.PI / 180); c.fillStyle = sel ? 'rgba(207,238,255,0.28)' : 'rgba(207,238,255,0.10)'; c.fill(); c.strokeStyle = sel ? 'rgba(255,255,255,0.8)' : 'rgba(255,255,255,0.25)'; c.lineWidth = sel ? 2 : 1; c.stroke(); }
  for (i = 0; i < g.enemies.length; i++) {
    e = g.enemies[i]; var tgt = e.vis ? 1 : 0; e.vv = e.vv == null ? tgt : e.vv + (tgt - e.vv) * Math.min(1, dt * 10);
    if (e.vv < 0.95) { var rx = ESIZE_V[e.def] * 0.95, ry = ESIZE_V[e.def] * 0.7, ex0 = e.x * TS, ey0 = e.y * TS + 3 - (e.flying ? 12 : 0); c.fillStyle = 'rgba(60,64,130,' + (0.4 * (1 - e.vv)) + ')'; c.beginPath(); c.ellipse(ex0, ey0, rx, ry, 0, 0, TAU); c.fill(); c.beginPath(); c.arc(ex0 - rx * 0.55, ey0 - ry * 0.8, rx * 0.28, 0, TAU); c.arc(ex0 + rx * 0.55, ey0 - ry * 0.8, rx * 0.28, 0, TAU); c.fill(); }
  }
  drawFog(g, ui, dt, t);
  var bx = g.base.x * TS, by = g.base.y * TS;
  c.globalCompositeOperation = 'lighter';
  for (i = 0; i < g.towers.length; i++) { tw = g.towers[i]; if (!tw.R) continue; var gr = tw.R * TS * 0.75 * (1 + 0.03 * Math.sin(t * 3 + tw.id)); c.globalAlpha = 0.8; c.drawImage(glowSprite, tw.x * TS - gr, tw.y * TS - gr, gr * 2, gr * 2); }
  for (i = 0; i < g.flashes.length; i++) { var fl2 = g.flashes[i], fr = fl2.r * TS * 0.8; c.globalAlpha = Math.max(0, Math.min(1, fl2.t / 0.2, (fl2.dur - fl2.t) / 0.6)); c.drawImage(glowSprite, fl2.x * TS - fr, fl2.y * TS - fr, fr * 2, fr * 2); }
  c.globalAlpha = 0.9; c.drawImage(glowSprite, bx - 80, by - 80, 160, 160);
  c.globalAlpha = 0.18; c.save(); c.translate(bx, by - 50); c.rotate(t * 0.6); var lg = c.createLinearGradient(0, 0, 500, 0); lg.addColorStop(0, 'rgba(255,246,214,0.9)'); lg.addColorStop(1, 'rgba(255,246,214,0)'); c.fillStyle = lg; c.beginPath(); c.moveTo(0, 0); c.lineTo(500, -22); c.lineTo(500, 22); c.closePath(); c.fill(); c.restore();
  c.globalAlpha = 1; c.globalCompositeOperation = 'source-over';
  drawLighthouse(c, bx, by, t, g.base.hp / g.base.hpMax);
  c.lineWidth = 1.4; c.setLineDash([3, 5]);
  for (i = 0; i < g.towers.length; i++) { tw = g.towers[i]; if (!tw.R) continue; c.strokeStyle = 'rgba(255,214,150,0.35)'; c.beginPath(); c.arc(tw.x * TS, tw.y * TS, tw.R * TS, 0, TAU); c.stroke(); }
  c.setLineDash([]);
  for (i = 0; i < g.towers.length; i++) { tw = g.towers[i]; if (tw.def !== 'T8' || tw.off || tw.auto) continue; var L = engLV(tw).beamLen * TS; c.save(); c.translate(tw.x * TS, (tw.y - 0.2) * TS); c.rotate(tw.angle); c.globalCompositeOperation = 'lighter'; var bg2 = c.createLinearGradient(0, 0, L, 0); bg2.addColorStop(0, 'rgba(255,246,214,0.75)'); bg2.addColorStop(1, 'rgba(255,246,214,0.1)'); c.fillStyle = bg2; c.fillRect(0, -8, L, 16); c.restore(); }
  c.globalCompositeOperation = 'source-over';
  var ghost = ui && ui.ghost, TSZ = TS * VT;
  for (i = 0; i < g.towers.length; i++) {
    tw = g.towers[i]; var gs = 1; if (S.grow[tw.id] != null) { var gt = (t - S.grow[tw.id]) / 0.3; if (gt < 1) gs = 0.6 + 0.4 * (1 + 2.7 * Math.pow(gt - 1, 3) + 1.7 * Math.pow(gt - 1, 2)); }
    var fk = (S.fireT[tw.id] != null && t - S.fireT[tw.id] < 0.12) ? 1.1 : 1, dimA = (tw.off || tw.auto) ? 0.5 : 1;
    drawTower(c, tw.def, tw.x * TS, tw.y * TS + 6, TSZ * gs, tw.lv, t, tw, S.aim[tw.id], dimA, fk);
    if (tw.off || tw.auto) { var tx2 = tw.auto ? '油切れ' : '休灯'; c.font = 'bold 12px sans-serif'; c.textAlign = 'center'; c.lineWidth = 3; c.strokeStyle = OUT; c.strokeText(tx2, tw.x * TS, tw.y * TS - 26); c.fillStyle = tw.auto ? C.red : '#fff'; c.fillText(tx2, tw.x * TS, tw.y * TS - 26); }
    if (tw.br === 'b') { c.font = 'bold 10px sans-serif'; c.textAlign = 'center'; c.lineWidth = 2.5; c.strokeStyle = OUT; c.strokeText('B', tw.x * TS + 22, tw.y * TS - 12); c.fillStyle = '#fff'; c.fillText('B', tw.x * TS + 22, tw.y * TS - 12); }
  }
  if (ghost) { var gsl = g.slots[ghost.slot]; if (gsl && !gsl.tower) drawTower(c, ghost.def, gsl.x * TS, gsl.y * TS + 6, TSZ, 0, t, null, null, ghost.ok ? 0.7 : 0.38); }
  var order = g.enemies.slice().sort(function (a, b) { return a.y - b.y; });
  for (i = 0; i < order.length; i++) {
    e = order[i]; if (!e.alive) continue; var ex = e.x * TS, ey = e.y * TS; if (ex < -40 || ex > W + 40) continue; var er = ESIZE_V[e.def];
    if (e.vv > 0.05) {
      if (e.vv >= 0.5 && !e.shown) { e.shown = true; e.popT = t; if (S.q > 0) { fxAdd({ k: 'ring', x: ex, y: ey + er * 0.9, r: e.boss ? 42 : 18, t: 0, life: 0.25, col: '#ffffff', w: 3 }); fxAdd({ k: 'mote', x: ex - 6, y: ey - er, vy: -30, t: 0, life: 0.5, star: true }); fxAdd({ k: 'mote', x: ex + 6, y: ey - er, vy: -36, t: 0, life: 0.5, star: true }); } } else if (e.vv < 0.3) e.shown = false;
      var pk = e.popT != null ? (t - e.popT) / 0.18 : 2; if (pk < 1) { c.save(); c.translate(ex, ey + er * 0.95); var ps2 = 1 + 0.18 * Math.sin(pk * Math.PI); c.scale(ps2, ps2); c.translate(-ex, -(ey + er * 0.95)); drawEnemy(c, e, t, 0.3 + 0.7 * e.vv, ex, ey); c.restore(); } else
      drawEnemy(c, e, t, 0.3 + 0.7 * e.vv, ex, ey);
      if (e.lit && e.vv > 0.6) { c.strokeStyle = 'rgba(255,199,122,0.6)'; c.lineWidth = 1.5; c.beginPath(); c.ellipse(ex, ey + er * 0.95, er * 0.9, er * 0.3, 0, 0, TAU); c.stroke(); }
      if (e.slowT > 0) { c.fillStyle = 'rgba(143,216,255,0.9)'; for (j = 0; j < 3; j++) { var aa = t * 3 + j * 2.1; c.fillRect(ex + Math.cos(aa) * er - 1.5, ey - er * 0.5 + Math.sin(aa) * 6 - 1.5, 3, 3); } }
      if (e.stunT > 0) { c.strokeStyle = '#cfeeff'; c.lineWidth = 2; c.beginPath(); c.arc(ex, ey, er * 1.1, 0, TAU); c.stroke(); }
      if (e.vv > 0.3 && !e.boss) { var bw = (18 + ESIZE[e.def] * 0.5) * 1.4, yy = ey - er - 8 - (e.flying ? 14 : 0); rr(c, ex - bw / 2, yy, bw, 5, 2.5); c.fillStyle = 'rgba(43,47,102,0.7)'; c.fill(); var fr = Math.max(0, e.hp / e.hpMax); if (fr > 0) { rr(c, ex - bw / 2, yy, Math.max(5, bw * fr), 5, 2.5); c.fillStyle = fr > 0.5 ? '#6fe3b8' : fr > 0.25 ? '#ffd27a' : C.red; c.fill(); } if (e.shield > 0) { c.fillStyle = '#fff6d6'; c.fillRect(ex - bw / 2, yy - 3, bw * Math.max(0, e.shield / e.hpMax), 2); } }
      if (e.boss && e.vv > 0.3) { var bw2 = 70, yb = ey - er - 14; rr(c, ex - bw2 / 2, yb, bw2, 7, 3.5); c.fillStyle = 'rgba(43,47,102,0.75)'; c.fill(); rr(c, ex - bw2 / 2, yb, Math.max(6, bw2 * Math.max(0, e.hp / e.hpMax)), 7, 3.5); c.fillStyle = '#ff9fb0'; c.fill(); }
      if (e.boss && e.phase2 && e.litCount < 2) { var msg = e.litCount < 1 ? '光が足りない' : '光をもう1つ'; c.font = 'bold 12px sans-serif'; c.textAlign = 'center'; c.lineWidth = 3; c.strokeStyle = OUT; c.strokeText(msg, ex, ey - er - 24); c.fillStyle = C.red; c.fillText(msg, ex, ey - er - 24); }
    }
    if (e.vv < 0.5) {
      var bk = blink(t, e.id), er2 = ESIZE[e.def] * 0.2 + 1.2, es = ESIZE_V[e.def] * 0.28 + 1, eyY = ey - (e.flying ? 15 : 2) + (e.id % 3 - 1) * 2; if (e.boss) er2 *= 1.6;
      c.globalAlpha = (0.55 + 0.35 * (0.5 + 0.5 * Math.sin(t * 3 + e.id))) * (1 - e.vv * 2); c.fillStyle = e.boss ? '#ff9fb0' : C.eye;
      c.beginPath(); c.ellipse(ex - es, eyY, er2, er2 * Math.max(0.15, bk), 0, 0, TAU); c.ellipse(ex + es, eyY, er2, er2 * Math.max(0.15, bk), 0, 0, TAU); c.fill();
      c.fillStyle = '#fff'; c.beginPath(); c.arc(ex - es + er2 * 0.35, eyY - er2 * 0.35, 0.9, 0, TAU); c.arc(ex + es + er2 * 0.35, eyY - er2 * 0.35, 0.9, 0, TAU); c.fill();
      c.fillStyle = 'rgba(255,196,181,0.35)'; c.beginPath(); c.arc(ex - es * 1.5, eyY + er2 * 1.4, 2.2, 0, TAU); c.arc(ex + es * 1.5, eyY + er2 * 1.4, 2.2, 0, TAU); c.fill(); c.globalAlpha = 1;
    }
  }
  drawDyn(c, t, true);
  drawPickups(c, g, t); drawWarns(c, g, dt, t);
  if (S.stageId === 9 && S.fxLevel > 0 && S.q > 0) drawRain(c, t, dt);
  drawFx(c, dt);
  drawOverlay(c, g, ui, t, opts);
  c.restore();
  if (S.dawnT >= 0) drawDawn(c, g, dt, opts);
  if (S.flashW > 0) { c.fillStyle = 'rgba(255,255,255,' + Math.min(opts.reduced ? 0.15 : 0.5, S.flashW) + ')'; c.fillRect(0, 0, W, H); S.flashW -= dt * 1.6; }
  if (opts.danger > 0 && !opts.reduced) { var dv = opts.danger, pul = 0.5 + 0.5 * Math.sin(t * (4 + dv * 6)); c.globalAlpha = Math.min(0.85, dv * (0.25 + 0.45 * pul)); c.drawImage(vignetteSprite, 0, 0, W, H); c.globalAlpha = 1; }
  if (g.surge && !g.dawn) { var sw = g.surge.t < g.surge.warn; if (sw) { var bl = 0.5 + 0.5 * Math.sin(t * 12); c.strokeStyle = 'rgba(255,199,122,' + (0.35 + 0.5 * bl) + ')'; c.lineWidth = 10; c.strokeRect(5, 5, W - 10, H - 10); c.font = 'bold 30px sans-serif'; c.textAlign = 'center'; c.lineWidth = 5; c.strokeStyle = OUT; c.strokeText('濃霧警報!', W / 2, 96); c.fillStyle = '#ffd27a'; c.fillText('濃霧警報!', W / 2, 96); } }
  if (S.stageId === 12 && g.totalWaves) { c.fillStyle = 'rgba(255,200,170,' + (0.14 * g.wave / g.totalWaves) + ')'; c.fillRect(0, 0, W, H * 0.4); }
  if (S.bossDark > 0) { S.bossDark -= dt; c.fillStyle = 'rgba(20,18,60,' + Math.min(0.5, S.bossDark * 1.2) + ')'; c.fillRect(0, 0, W, H); }
  if (S.hitFlash > 0) { c.globalAlpha = Math.min(1, S.hitFlash / 0.6) * (opts.reduced ? 0.4 : 0.9); c.drawImage(vignetteSprite, 0, 0, W, H); c.globalAlpha = 1; S.hitFlash -= dt; }
  if (g.base.hp / g.base.hpMax <= 0.25 && g.phase !== 'LOSE' && !opts.reduced) { c.globalAlpha = 0.25 + 0.2 * Math.sin(t * 4); c.drawImage(vignetteSprite, 0, 0, W, H); c.globalAlpha = 1; }
}

function drawDawn(c, g, dt, opts) {
  S.dawnT += dt; var t = S.dawnT, fl = opts.reduced ? 0.3 : 1;
  var a1 = Math.min(1, Math.max(0, (t - 1.0) / 2.5)) * 0.55;
  var gr = c.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, 'rgba(255,185,176,' + a1 + ')'); gr.addColorStop(0.55, 'rgba(255,214,170,' + a1 * 0.55 + ')'); gr.addColorStop(1, 'rgba(255,240,214,' + a1 * 0.25 + ')'); c.fillStyle = gr; c.fillRect(0, 0, W, H);
  var sp = Math.min(1, Math.max(0, (t - 2.0) / 1.5)), sy = lerp(H * 0.34, H * 0.1, 1 - Math.pow(1 - sp, 2)); if (sp > 0) {
    c.globalCompositeOperation = 'lighter'; var sg = c.createRadialGradient(W * 0.5, sy, 6, W * 0.5, sy, 150); sg.addColorStop(0, 'rgba(255,243,176,' + 0.55 * sp * fl + ')'); sg.addColorStop(1, 'rgba(255,243,176,0)'); c.fillStyle = sg; c.fillRect(0, 0, W, H);
    c.fillStyle = 'rgba(255,246,214,' + 0.16 * sp * fl + ')'; for (var i = -3; i <= 3; i++) { c.beginPath(); c.ellipse(W * 0.5 + i * 22 + Math.sin(t * 2 + i) * 4, H * 0.42 + Math.abs(i) * 18, 6, 70, 0, 0, TAU); c.fill(); }
    c.globalCompositeOperation = 'source-over'; c.fillStyle = '#fff3b0'; c.beginPath(); c.arc(W * 0.5, sy, 26, 0, TAU); c.fill(); }
  if (t > 2.5 && t < 4.0) { c.fillStyle = 'rgba(43,47,102,' + 0.25 * Math.min(1, (t - 2.5) / 1.5) + ')'; /* 灯台の灯が静かに落ちる */ }
}
function drawPickups(c, g, t) {
  for (var i = 0; i < g.pickups.length; i++) {
    var p = g.pickups[i], x = p.x * TS, y = p.y * TS, left = Math.max(0, 1 - p.t / p.dur);
    if (p.kind === 'star') { c.globalCompositeOperation = 'lighter'; var tl = c.createLinearGradient(x, y, x - p.vx * 40, y - p.vy * 40); tl.addColorStop(0, 'rgba(255,243,176,0.9)'); tl.addColorStop(1, 'rgba(255,243,176,0)'); c.strokeStyle = tl; c.lineWidth = 6; c.lineCap = 'round'; c.beginPath(); c.moveTo(x, y); c.lineTo(x - p.vx * 40, y - p.vy * 40); c.stroke(); c.drawImage(glowSprite, x - 28, y - 28, 56, 56); c.globalCompositeOperation = 'source-over'; star5(c, x, y, 13 + Math.sin(t * 8) * 2); fs(c, '#fff3b0', 1.8); }
    else { var by = y + Math.sin(t * 2 + p.id) * 3; c.fillStyle = 'rgba(43,47,102,0.3)'; c.beginPath(); c.ellipse(x, by + 16, 18, 6, 0, 0, TAU); c.fill(); rr(c, x - 16, by - 10, 32, 24, 5); fs(c, '#c9a07a', 2); c.beginPath(); c.moveTo(x - 16, by - 2); c.lineTo(x + 16, by - 2); c.strokeStyle = OUT; c.lineWidth = 1.5; c.stroke(); c.fillStyle = '#ffd770'; c.beginPath(); c.arc(x, by + 4, 3.5, 0, TAU); c.fill(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.5 + 0.4 * Math.sin(t * 5); c.drawImage(glowSprite, x - 30, by - 30, 60, 60); c.globalAlpha = 1; c.globalCompositeOperation = 'source-over'; }
    c.strokeStyle = 'rgba(255,255,255,0.7)'; c.lineWidth = 2.5; c.beginPath(); c.arc(x, y, 24, -Math.PI / 2, -Math.PI / 2 + TAU * left); c.stroke();
  }
}
function drawWarns(c, g, dt, t) {
  for (var i = S.warns.length - 1; i >= 0; i--) {
    var w = S.warns[i]; w.t += dt; if (w.t >= w.life) { S.warns.splice(i, 1); continue; }
    var pu = 0.5 + 0.5 * Math.sin(w.t * 14), rad = w.kind === 'roar' ? 4.5 * TS : w.kind === 'ambush' ? 38 : 56;
    c.fillStyle = 'rgba(255,90,110,' + (0.10 + 0.14 * pu) + ')'; c.beginPath(); c.arc(w.x, w.y, rad, 0, TAU); c.fill(); c.strokeStyle = 'rgba(255,122,138,' + (0.5 + 0.4 * pu) + ')'; c.lineWidth = 3; c.setLineDash([8, 6]); c.lineDashOffset = -t * 40; c.beginPath(); c.arc(w.x, w.y, rad, 0, TAU); c.stroke(); c.setLineDash([]);
    c.font = 'bold 24px sans-serif'; c.textAlign = 'center'; c.lineWidth = 4; c.strokeStyle = OUT; c.strokeText('!', w.x, w.y + 8); c.fillStyle = '#fff'; c.fillText('!', w.x, w.y + 8);
  }
}
function drawRain(c, t, dt) {
  if (!S.rain.length) for (var i = 0; i < 30; i++) S.rain.push({ x: Math.random() * W, y: Math.random() * H, v: 500 + Math.random() * 200 });
  c.strokeStyle = 'rgba(220,230,255,0.45)'; c.lineWidth = 1.2; c.beginPath();
  for (var k = 0; k < S.rain.length; k++) { var r = S.rain[k]; r.y += r.v * dt; r.x -= r.v * 0.25 * dt; if (r.y > H) { r.y = -10; r.x = Math.random() * W + 100; } c.moveTo(r.x, r.y); c.lineTo(r.x + 6, r.y - 18); } c.stroke();
}
function drawDyn(c, t, top) {
  if (S.q === 0) return; var d = S.deco.dyn, i, o;
  for (i = 0; i < d.length; i++) {
    o = d[i];
    if (!top) {
      if (o.k === 'flow') { var fo = (t * 30 + o.ph) % 100 / 100; c.fillStyle = 'rgba(255,240,200,0.35)'; c.beginPath(); c.moveTo(o.x + o.dx * fo * 60, o.y + o.dy * fo * 60); c.lineTo(o.x + o.dx * fo * 60 - o.dy * 5 - o.dx * 8, o.y + o.dy * fo * 60 + o.dx * 5 - o.dy * 8); c.lineTo(o.x + o.dx * fo * 60 + o.dy * 5 - o.dx * 8, o.y + o.dy * fo * 60 - o.dx * 5 - o.dy * 8); c.closePath(); c.fill(); }
      else if (o.k === 'boat') { c.save(); c.translate(o.x, o.y + Math.sin(t * 0.9 + o.ph) * 2); c.rotate(Math.sin(t * 0.9 + o.ph) * 0.06); c.beginPath(); c.moveTo(-12, 0); c.quadraticCurveTo(0, 12, 12, 0); c.closePath(); fs(c, '#ffc4b5', 1.5); c.beginPath(); c.moveTo(0, -2); c.lineTo(0, -16); c.lineTo(9, -4); c.closePath(); fs(c, '#fff6ee', 1.2); c.fillStyle = '#ff9fb0'; c.beginPath(); c.moveTo(0, -16); c.lineTo(6, -18); c.lineTo(0, -20); c.fill(); c.restore(); }
      else if (o.k === 'buoy') { c.fillStyle = '#fff'; c.beginPath(); c.arc(o.x, o.y + Math.sin(t * 2 + o.ph) * 1.5, 6, 0, TAU); c.fill(); }
      else if (o.k === 'crab') { var cx = o.x + Math.sin(t * 0.7 + o.ph) * 14; c.beginPath(); c.ellipse(cx, o.y, 7, 5, 0, 0, TAU); fs(c, '#ff9fb0', 1.2); c.fillStyle = '#ff9fb0'; c.beginPath(); c.arc(cx - 8, o.y - 5, 3, 0, TAU); c.arc(cx + 8, o.y - 5, 3, 0, TAU); c.fill(); }
      else if (o.k === 'whirl') { c.strokeStyle = 'rgba(255,255,255,0.45)'; c.lineWidth = 2; c.beginPath(); c.arc(o.x, o.y, 14, t * 2, t * 2 + 4); c.stroke(); c.beginPath(); c.arc(o.x, o.y, 8, -t * 2.5, -t * 2.5 + 4); c.stroke(); }
      else if (o.k === 'gull') { var gx = ((t * o.sp + o.ph * 20) % (W + 80)) - 40; c.strokeStyle = '#fff'; c.lineWidth = 2; var wf = Math.sin(t * 6) * 3; c.beginPath(); c.moveTo(gx - 8, o.y + wf); c.quadraticCurveTo(gx - 4, o.y - 4, gx, o.y); c.quadraticCurveTo(gx + 4, o.y - 4, gx + 8, o.y + wf); c.stroke(); }
    } else {
      if (o.k === 'firefly') { var fx = o.x + Math.sin(t * 0.6 + o.ph) * 20, fy = o.y + Math.cos(t * 0.8 + o.ph) * 14; c.fillStyle = 'rgba(255,243,176,' + (0.4 + 0.5 * Math.sin(t * 3 + o.ph)) + ')'; c.beginPath(); c.arc(fx, fy, 2.5, 0, TAU); c.fill(); }
      else if (o.k === 'jelly') { var jy = o.y + Math.sin(t * 0.8 + o.ph) * 6; c.fillStyle = 'rgba(182,244,255,0.5)'; c.beginPath(); c.arc(o.x, jy, 8, Math.PI, 0); c.fill(); c.strokeStyle = 'rgba(182,244,255,0.5)'; c.lineWidth = 1.5; for (var q = -1; q <= 1; q++) { c.beginPath(); c.moveTo(o.x + q * 4, jy); c.lineTo(o.x + q * 4 + Math.sin(t * 3 + q) * 2, jy + 9); c.stroke(); } }
      else if (o.k === 'win' || o.k === 'lamp') { c.fillStyle = 'rgba(255,214,150,0.65)'; c.beginPath(); c.arc(o.x, o.y, 3.5, 0, TAU); c.fill(); }
    }
  }
}

function drawFog(g, ui, dt, t) {
  var f = S.fctx, fw = W / 2, fh = H / 2, i, tw;
  var ftg = S.fogTarget; if (ftg > 0.1 && ftg < 0.95) ftg += (g.surgeOn ? 0.12 : 0) + 0.025 * Math.sin(t * 0.5);
  S.fogDensity += (ftg - S.fogDensity) * Math.min(1, dt * 1.2);
  f.globalCompositeOperation = 'source-over'; f.clearRect(0, 0, fw, fh); f.globalAlpha = S.fogDensity; f.fillStyle = S.pal.fogD; f.fillRect(0, 0, fw, fh);
  f.globalAlpha = S.fogDensity * 0.28; f.save(); f.translate((t * 6) % 256, (t * 2) % 256); f.fillStyle = S.pat1; f.fillRect(-256, -256, fw + 512, fh + 512); f.restore();
  f.save(); f.translate((-t * 4) % 256, (t * 3) % 256); f.fillStyle = S.pat2; f.fillRect(-256, -256, fw + 512, fh + 512); f.restore();
  f.globalAlpha = S.fogDensity * 0.14; f.fillStyle = S.pal.fog; f.fillRect(0, 0, fw, fh);
  f.globalCompositeOperation = 'destination-out'; f.globalAlpha = 1;
  function hole(x, y, r) { f.drawImage(lightSprite, x * TS / 2 - r * TS / 2, y * TS / 2 - r * TS / 2, r * TS, r * TS); }
  var breath = 1 + 0.03 * Math.sin(t * 3);
  for (i = 0; i < g.towers.length; i++) {
    tw = g.towers[i]; if (!tw.R) continue; hole(tw.x, tw.y, tw.R * breath * 2);
    if (tw.def === 'T8') { var L = engLV(tw).beamLen * TS / 2; f.save(); f.translate(tw.x * TS / 2, tw.y * TS / 2); f.rotate(tw.angle); var lg = f.createLinearGradient(0, 0, L, 0); lg.addColorStop(0, 'rgba(0,0,0,1)'); lg.addColorStop(1, 'rgba(0,0,0,0.5)'); f.fillStyle = lg; f.fillRect(0, -8, L, 16); f.restore(); }
  }
  for (i = 0; i < g.flashes.length; i++) { var fl = g.flashes[i], fa = Math.min(1, fl.t / 0.2, (fl.dur - fl.t) / 0.6); f.globalAlpha = Math.max(0, fa); hole(fl.x, fl.y, fl.r * 2 * breath); f.globalAlpha = 1; }
  hole(g.base.x, g.base.y, B.baseLight * 2 * breath);
  if (ui && ui.ghost && ui.ghost.R) { var gsl = g.slots[ui.ghost.slot]; if (gsl) { f.globalAlpha = 0.55; hole(gsl.x, gsl.y, ui.ghost.R * 2); f.globalAlpha = 1; } }
  f.globalCompositeOperation = 'source-over';
  S.ctx.drawImage(S.fog, 0, 0, W, H);
}

function drawFx(c, dt) {
  var arr = S.fx, w = 0, i, f;
  for (i = 0; i < arr.length; i++) {
    f = arr[i]; f.t += dt; if (f.t >= f.life) continue; arr[w++] = f; var p = f.t / f.life;
    switch (f.k) {
      case 'orb': var q = Math.min(1, p * 1.2), ox = lerp(f.x, f.x2, q), oy = lerp(f.y, f.y2, q); if (f.rope) { c.globalAlpha = 0.6 * (1 - p); c.strokeStyle = '#fff'; c.lineWidth = 1.5; c.beginPath(); c.moveTo(f.x, f.y); c.lineTo(ox, oy); c.stroke(); }
        for (var k2 = 3; k2 >= 1; k2--) { var qq = Math.max(0, q - k2 * 0.08); c.globalAlpha = 0.5 / k2 * (1 - p * 0.5); c.fillStyle = f.col; c.beginPath(); c.arc(lerp(f.x, f.x2, qq), lerp(f.y, f.y2, qq), f.r * (1 - k2 * 0.18), 0, TAU); c.fill(); }
        c.globalAlpha = 1 - p * 0.4; c.fillStyle = f.col; c.beginPath(); c.arc(ox, oy, f.r, 0, TAU); c.fill(); c.fillStyle = '#fff'; c.beginPath(); c.arc(ox, oy, f.r * 0.45, 0, TAU); c.fill(); c.globalAlpha = 1; break;
      case 'ring': c.globalAlpha = 1 - p; c.strokeStyle = f.col; c.lineWidth = f.w * (1 - p) + 1; c.beginPath(); c.arc(f.x, f.y, f.r * (1 - Math.pow(1 - p, 2)), 0, TAU); c.stroke(); c.globalAlpha = 1; break;
      case 'zap': c.globalAlpha = 1 - p; c.strokeStyle = '#fff3b0'; c.lineWidth = 3; c.beginPath(); for (var k = 0; k < f.pts.length; k += 2) { var zx = f.pts[k] * TS + (k ? (Math.random() - 0.5) * 6 : 0), zy = f.pts[k + 1] * TS + (k ? (Math.random() - 0.5) * 6 : 0); k ? c.lineTo(zx, zy) : c.moveTo(zx, zy - 14); } c.stroke(); c.globalAlpha = 1; break;
      case 'spark': c.globalAlpha = 1 - p; c.fillStyle = '#fff'; for (var s2 = 0; s2 < 2; s2++) { c.beginPath(); c.arc(f.x + Math.cos(f.a + s2 * 2) * p * 14, f.y + Math.sin(f.a + s2 * 2) * p * 14, 1.6, 0, TAU); c.fill(); } c.globalAlpha = 1; break;
      case 'mote': c.globalAlpha = 1 - p; c.fillStyle = f.gold ? '#ffd770' : f.star ? '#fff3b0' : '#cfeeff'; if (f.star) { star5(c, f.x, f.y + f.vy * f.t, 4); c.fill(); } else { c.beginPath(); c.arc(f.x, f.y + f.vy * f.t, 2.2, 0, TAU); c.fill(); } c.globalAlpha = 1; break;
      case 'killpop': { var sc = p < 0.35 ? 1 + 0.25 * (p / 0.35) : 1.25 * (1 - (p - 0.35) / 0.65 * 0.5), rr0 = ESIZE_V[f.def]; c.save(); c.translate(f.x, f.y); c.scale(sc, sc); c.globalAlpha = p < 0.35 ? 1 : Math.max(0, 1 - (p - 0.35) / 0.65); try { ENEMY_DRAW[f.def](c, rr0, S.t, { def: f.def, id: 1, shield: 0, flash: 0, lit: true, flying: false, phase2: false }); } catch (er) { } c.restore(); c.globalAlpha = 1; if (p > 0.3) { c.fillStyle = ECOL[f.def] || '#cfeeff'; for (var q3 = 0; q3 < 6; q3++) { var aa3 = q3 * 1.047 + 0.3, d3 = (p - 0.3) * 40; c.globalAlpha = 1 - p; c.beginPath(); c.arc(f.x + Math.cos(aa3) * d3, f.y + Math.sin(aa3) * d3, 3, 0, TAU); c.fill(); } c.globalAlpha = 1; } break; }
      case 'conf': c.globalAlpha = Math.min(1, (f.life - f.t) / 0.6); c.fillStyle = f.col; star5(c, f.x + f.vx * f.t + Math.sin(f.t * 5) * 6, f.y + f.vy * f.t, 5); c.fill(); c.globalAlpha = 1; break;
      case 'beam': c.globalCompositeOperation = 'lighter'; c.globalAlpha = (1 - p) * 0.8; var bg3 = c.createLinearGradient(0, f.y - 120 * p - 40, 0, f.y); bg3.addColorStop(0, 'rgba(255,240,170,0)'); bg3.addColorStop(1, 'rgba(255,240,170,0.9)'); c.fillStyle = bg3; c.fillRect(f.x - 14 * (1 - p), f.y - 120 * p - 40, 28 * (1 - p), 120 * p + 40); c.globalCompositeOperation = 'source-over'; c.globalAlpha = 1; break;
      case 'soft': c.globalCompositeOperation = 'lighter'; c.globalAlpha = (1 - p) * 0.8; var sr = 20 + 50 * p; c.drawImage(glowSprite, f.x - sr, f.y - sr, sr * 2, sr * 2); c.globalCompositeOperation = 'source-over'; c.globalAlpha = 1; break;
      case 'bubble': c.globalAlpha = 0.7 * (1 - p); c.strokeStyle = '#d7fff0'; c.lineWidth = 2; c.beginPath(); c.arc(f.x + Math.sin(p * 8) * 3, f.y - p * 34, 4 + p * 3, 0, TAU); c.stroke(); c.globalAlpha = 1; break;
      case 'text': c.globalAlpha = 1 - p * p; c.font = 'bold 14px Consolas,monospace'; c.textAlign = 'center'; c.lineWidth = 3; c.strokeStyle = OUT; c.strokeText(f.s, f.x, f.y - p * 22); c.fillStyle = f.col; c.fillText(f.s, f.x, f.y - p * 22); c.globalAlpha = 1; break;
    }
  }
  arr.length = w;
}

function drawOverlay(c, g, ui, t, opts) {
  if (!ui) return; var tw = ui.selTower;
  var cb = opts.cb, rangeCol = cb ? '#ff9a2a' : '#8fb0ff', lightCol = cb ? '#3aa0ff' : '#ffd27a';
  function ring(x, y, r, col, fill, dash, lw) { c.save(); if (fill) { c.fillStyle = fill; c.beginPath(); c.arc(x * TS, y * TS, r * TS, 0, TAU); c.fill(); } c.strokeStyle = col; c.lineWidth = lw || 1.8; if (dash) { c.setLineDash([6, 5]); c.lineDashOffset = -t * 10; } c.beginPath(); c.arc(x * TS, y * TS, r * TS, 0, TAU); c.stroke(); c.restore(); }
  if (tw) {
    var d = T[tw.def], L = engLV(tw);
    c.strokeStyle = C.warm; c.lineWidth = 3; c.beginPath(); c.arc(tw.x * TS, tw.y * TS + 4, 34, 0, TAU); c.stroke();
    if (L.range) ring(tw.x, tw.y, L.range + (g.cardRange && (tw.def === 'T1' || tw.def === 'T4') ? g.cardRange : 0), rangeCol, 'rgba(143,176,255,0.08)', false, cb ? 3 : 1.8);
    if (tw.R) ring(tw.x, tw.y, tw.R, lightCol, 'rgba(255,210,122,0.06)', true);
    if (tw.def === 'T6') g.towers.forEach(function (o) { if (T[o.def].light) { var inn = root.Fog.Engine.inFan(tw, o.x, o.y); c.font = 'bold 14px sans-serif'; c.textAlign = 'center'; c.lineWidth = 3; c.strokeStyle = OUT; c.strokeText(inn ? '○' : '×', o.x * TS + 22, o.y * TS - 22); c.fillStyle = inn ? C.jade : C.red; c.fillText(inn ? '○' : '×', o.x * TS + 22, o.y * TS - 22); } });
    if (d.beam) ring(tw.x, tw.y, L.beamLen, '#fff6d6', null, true);
  }
  var gh = ui.ghost; if (gh) {
    var s = g.slots[gh.slot]; if (s) { var dd = T[gh.def], LL = dd.lv[0], okc = gh.ok ? rangeCol : '#ff7a8a';
      if (LL.range) ring(s.x, s.y, LL.range, okc, gh.ok ? 'rgba(143,176,255,0.08)' : 'rgba(255,122,138,0.1)', false);
      if (gh.R) ring(s.x, s.y, gh.R, lightCol, 'rgba(255,210,122,0.07)', true);
      if (gh.def === 'T6') { var aim = ((Math.round(Math.atan2(g.base.y - s.y, g.base.x - s.x) / (Math.PI / 4)) % 8) + 8) % 8; fanPath(c, s.x * TS, s.y * TS - 8, dd.lv[0].infl * TS, aim * Math.PI / 4, dd.lv[0].cone * Math.PI / 180); c.fillStyle = 'rgba(207,238,255,0.25)'; c.fill(); }
      if (dd.beam) ring(s.x, s.y, dd.lv[0].beamLen, '#fff6d6', null, true);
    }
  }
  if (ui.synLines) ui.synLines.forEach(function (l) { c.strokeStyle = l.dir === 'give' ? 'rgba(255,214,150,0.95)' : 'rgba(168,240,212,0.95)'; c.lineWidth = 2.5; c.setLineDash([3, 6]); c.lineDashOffset = -t * 12; c.beginPath(); c.moveTo(l.x1 * TS, l.y1 * TS); c.lineTo(l.x2 * TS, l.y2 * TS); c.stroke(); c.setLineDash([]); var mx = (l.x1 + l.x2) / 2 * TS, my = (l.y1 + l.y2) / 2 * TS; c.font = 'bold 12px sans-serif'; c.textAlign = 'center'; c.lineWidth = 3; c.strokeStyle = OUT; c.strokeText(l.name, mx, my - 4); c.fillStyle = '#fff'; c.fillText(l.name, mx, my - 4); });
  if (ui.hoverEnemy && ui.hoverEnemy.alive) { var he = ui.hoverEnemy; c.strokeStyle = '#fff'; c.lineWidth = 2; c.beginPath(); c.arc(he.x * TS, he.y * TS, ESIZE_V[he.def] + 6, 0, TAU); c.stroke(); }
}

/* ---- 他画面向け ---- */
function drawBackdrop(c, w, h, t, palName) {
  var pal = DATA.PALETTES[palName || 'std'] || DATA.PALETTES.std, g = c.createLinearGradient(0, 0, 0, h); g.addColorStop(0, pal.sky0); g.addColorStop(0.6, pal.sky1); g.addColorStop(0.6, pal.sea0); g.addColorStop(1, pal.sea1);
  c.fillStyle = g; c.fillRect(0, 0, w, h); var r = rnd(5), i; c.fillStyle = '#fff3b0'; for (i = 0; i < 60; i++) { c.globalAlpha = 0.25 + 0.5 * Math.abs(Math.sin(t * 0.7 + i)); c.fillRect(r() * w, r() * h * 0.56, 2, 2); } c.globalAlpha = 1;
  c.fillStyle = pal.cloud; c.globalAlpha = 0.6; for (i = 0; i < 4; i++) { var cx = ((t * (5 + i * 2) + i * 300) % (w + 200)) - 100, cy = h * (0.1 + i * 0.1); [[0, 0, 22], [26, 7, 17], [-26, 7, 16]].forEach(function (b) { c.beginPath(); c.arc(cx + b[0], cy + b[1], b[2], 0, TAU); c.fill(); }); } c.globalAlpha = 1;
  c.strokeStyle = pal.wave; c.globalAlpha = 0.5; c.lineWidth = 2; for (i = 0; i < 7; i++) { c.beginPath(); var wy = h * 0.62 + i * (h * 0.05); for (var x = 0; x <= w; x += 20) { var y = wy + Math.sin(t + x * 0.02 + i) * 2; x ? c.lineTo(x, y) : c.moveTo(x, y); } c.stroke(); } c.globalAlpha = 1;
  var lx = w * 0.5, ly = h * 0.62; c.fillStyle = pal.land; c.beginPath(); c.ellipse(lx, ly + 10, w * 0.16, h * 0.05, 0, 0, TAU); c.fill();
  c.save(); c.translate(lx, ly); c.scale(h / 380, h / 380); c.translate(0, -8); drawLighthouse(c, 0, 0, t, 1); c.restore();
  c.save(); c.translate(lx, ly - 70 * h / 380); c.rotate(Math.sin(t * 0.6) * 1.4); c.globalCompositeOperation = 'lighter'; var lg = c.createLinearGradient(0, 0, w, 0); lg.addColorStop(0, 'rgba(255,246,214,0.5)'); lg.addColorStop(1, 'rgba(255,246,214,0)'); c.fillStyle = lg; c.beginPath(); c.moveTo(0, 0); c.lineTo(w, -h * 0.07); c.lineTo(w, h * 0.07); c.closePath(); c.fill(); c.restore(); c.globalCompositeOperation = 'source-over';
  for (i = 0; i < 4; i++) { var fx = ((t * (6 + i * 3) + i * 300) % (w + 400)) - 200; c.fillStyle = 'rgba(196,207,245,0.14)'; c.beginPath(); c.ellipse(fx, h * (0.55 + i * 0.1), 220, 26, 0, 0, TAU); c.fill(); }
}
function drawTowerIcon(c, defId, cx, cy, size, lv) { c.save(); c.translate(cx, cy + size * 0.06); drawTower(c, defId, 0, 0, size * 0.92, lv || 0, 0.4, null, null); c.restore(); }
function drawEnemyIcon(c, id, cx, cy, size, t) {
  var d = EN[id] || BO[id]; var fake = { def: id, id: 1, shield: 0, flash: 0, flying: false, boss: !!d.boss, phase2: false, lit: true }; var r = ESIZE[id]; var k = size / (r * 3.4);
  c.save(); c.translate(cx, cy); c.scale(k, k); c.fillStyle = 'rgba(43,47,102,0.3)'; c.beginPath(); c.ellipse(0, r * 0.95, r * 0.9, r * 0.28, 0, 0, TAU); c.fill(); ENEMY_DRAW[id](c, r * 1.2, t || 0.5, fake); c.restore();
}
function resetDawn() { S.dawnT = -1; S.bossDark = 0; }
function setFogTarget(v) { S.fogTarget = v; }
function resetFog(v) { S.fogDensity = v; S.fogTarget = v; }

root.Fog.Render = { init: init, resize: resize, setStage: setStage, draw: draw, onEvents: onEvents, drawBackdrop: drawBackdrop, drawTowerIcon: drawTowerIcon, drawEnemyIcon: drawEnemyIcon, setFogTarget: setFogTarget, setFxLevel: setFxLevel, resetFog: resetFog, resetDawn: resetDawn, state: S, TS: TS, W: W, H: H, ESIZE: ESIZE, ESIZE_V: ESIZE_V };
})(typeof window !== 'undefined' ? window : this);
