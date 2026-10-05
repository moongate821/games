// core.js — 擬似3D道路エンジン(区間式)と、背景・景色の描画
// 方式: 道を長さ SEG_L の区間に分け、区間ごとにカーブ量(curve)と高さ(y)を持たせる。
// カーブは、手前から奥へ、区間ごとの横ずれを足し合わせて表す(Lou's Pseudo 3D Page / Jake Gordon の javascript-racer の方式)。
// 座標: z = 道に沿った距離(奥が正)、x = 横(道の中心が0、道幅の端が ±1 になる正規化値。実寸は x*ROAD_W)、y = 高さ(上が正)。
// コースの一覧と見た目の設定は courses.js
const SW = 1280, SH = 720;                   // 画面(キャンバス)の大きさ
let W = 1280, H = 720, CX = W / 2;           // 今描いている視界の大きさ(2人のときは上下に分ける)
let HOR = H * 0.40;                          // 平らな道での地平線の高さ(視界の上から)
const SEG_L = 200, ROAD_W = 1500, LANES = 4;
const DEPTH = 1 / Math.tan(50 * Math.PI / 180);   // 視野角100度
let F = DEPTH * W / 2;                       // 焦点距離(px)
function setView(h, fs) { H = h; HOR = h * (fs < 1 ? 0.33 : 0.40); F = DEPTH * W / 2 * fs; }   // 視界の高さと、拡大率
const CAM_H = 760, PL_DIST = 1350;           // カメラの高さ、カメラから自機までの距離
let DRAW_N = 240;                            // 描く区間の数(軽量モードでは減らす)
const isTouchDev = ('ontouchstart' in window) || navigator.maxTouchPoints > 0;
const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
const TWO_P_OK = !isIOS && !(isTouchDev && window.matchMedia && !window.matchMedia('(pointer: fine)').matches);   // 2人プレイは PC だけ(iOS 版には出さない)
let lite = false;

// ---------- 小道具 ----------
const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
const lerp = (a, b, t) => a + (b - a) * t;
const rnd = (a, b) => a + Math.random() * (b - a);
const pick = a => a[Math.floor(Math.random() * a.length)];
function mulberry(seed) { return () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
const easeIn = (a, b, p) => a + (b - a) * p * p;
const easeInOut = (a, b, p) => a + (b - a) * ((-Math.cos(p * Math.PI) / 2) + 0.5);
const rgba = (c, a) => 'rgba(' + c[0] + ',' + c[1] + ',' + c[2] + ',' + a.toFixed(3) + ')';
const mixc = (a, b, t) => [Math.round(lerp(a[0], b[0], t)), Math.round(lerp(a[1], b[1], t)), Math.round(lerp(a[2], b[2], t))];
const hex2rgb = h => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];

// ---------- コース ----------
let track = [], trackLen = 0;
function lastY() { return track.length ? track[track.length - 1].y2 : 0; }
function addSeg(curve, y) { const n = track.length; track.push({ i: n, z: n * SEG_L, curve, y1: lastY(), y2: y, deco: [], tunnel: false, pad: null, cool: null, start: false }); }
function addRoad(enter, hold, leave, curve, dy) {
  const y0 = lastY(), y1 = y0 + dy * SEG_L, total = enter + hold + leave;
  for (let n = 0; n < enter; n++) addSeg(easeIn(0, curve, n / enter), easeInOut(y0, y1, n / total));
  for (let n = 0; n < hold; n++) addSeg(curve, easeInOut(y0, y1, (enter + n) / total));
  for (let n = 0; n < leave; n++) addSeg(easeInOut(curve, 0, n / leave), easeInOut(y0, y1, (enter + hold + n) / total));
}
function buildTrack(sec) {   // コースの形を作る(同じコースは、毎回同じ形)
  const R = mulberry(5000 + sec.no * 97), nSeg = sec.len, cv = sec.curvy, hl = sec.hills;
  track = [];
  addRoad(0, 50, 0, 0, 0);                             // スタートの直線
  while (track.length < nSeg - 110) {
    const k = R(), len = 22 + Math.floor(R() * 44), c = (1.2 + R() * 3.6) * cv * (R() < 0.5 ? -1 : 1), hill = (R() - 0.5) * 60 * hl;
    if (k < 0.22) addRoad(10, len, 10, 0, hill / 40);
    else if (k < 0.62) addRoad(14, len, 14, c, hill / 50);
    else if (k < 0.84) { addRoad(12, len >> 1, 12, c, 0); addRoad(12, len >> 1, 12, -c * 0.85, hill / 50); }   // S字
    else addRoad(18, 18, 18, 0, (R() < 0.5 ? 1 : -1) * (2.5 + R() * 4) * hl);   // 丘
  }
  addRoad(30, 36, 30, 0, -lastY() / SEG_L);   // 高さを0に戻して、一周をつなぐ
  track[track.length - 1].y2 = 0;
  while (track.length < nSeg) addSeg(0, 0);
  trackLen = track.length * SEG_L;
  decorate(sec, R);
}
function segAt(z) { const n = Math.floor(wrapZ(z) / SEG_L); return track[n % track.length]; }
function wrapZ(z) { z %= trackLen; return z < 0 ? z + trackLen : z; }
function roadY(z) { const s = segAt(z), t = (wrapZ(z) - s.z) / SEG_L; return lerp(s.y1, s.y2, t); }
function relZ(z, from) { let d = wrapZ(z) - wrapZ(from); if (d > trackLen / 2) d -= trackLen; if (d < -trackLen / 2) d += trackLen; return d; }

// ---------- 景色の配置(見た目の型ごと) ----------
const SIGNS = ['新東京', '電脳', '健康第一', '高速', '警告', '夜間工事', 'カプセル', '立入禁止', '光速', '未来', '暴走注意', '終点', '無限', '新宿', '渋谷', '環状線', '緊急', 'ネオン', '龍', '飯店', '両替', '電脳世界', '未来都市', '競走'];
function decorate(sec, R) {
  const N = track.length, x = sec.x, kit = sec.kit;
  for (let k = 0; k < (x.tunnels || 0); k++) { const a = 150 + Math.floor(R() * (N - 420)), len = 45 + Math.floor(R() * 70); for (let i = a; i < a + len && i < N - 40; i++) track[i].tunnel = true; }
  if (kit === 'tube') for (const s of track) s.tunnel = true;
  const bl = x.bld || {}, hR = bl.h || [900, 6000], near = bl.near || 1.55, signP = bl.sign == null ? 0.35 : bl.sign, sCols = bl.signCols || [[255, 60, 120], [60, 230, 255], [255, 200, 60]];
  const gridCol = sec.grid, pc = () => pick([sec.road, sec.lane, sec.grid]);
  for (let i = 0; i < N; i++) {
    const s = track[i], D = s.deco;
    if (s.tunnel) { if (i % 3 === 0) D.push({ t: 'ring', col: x.ringCol || [255, 140, 40], open: kit === 'tube' }); if (kit !== 'tube') continue; }
    if (x.float && i % 19 === 0) D.push({ t: 'cube', x: (R() < 0.5 ? -1 : 1) * (1.6 + R() * 5), y: 400 + R() * 2600, r: 120 + R() * 360, spin: R() * 6, col: pc() });
    if (kit === 'city') {
      if (i % 6 === 0) { D.push({ t: 'lamp', x: -1.18 }); D.push({ t: 'lamp', x: 1.18 }); }
      if (i % 4 === 0) for (const side of [-1, 1]) if (R() < 0.8) {
        const h = hR[0] + R() * (hR[1] - hR[0]), w = 700 + R() * 1400;
        D.push({ t: 'bldg', x: side * (near + R() * 2.2), w, h, d: 600 + R() * 900, win: R(), wc: bl.winCol, sign: R() < signP ? SIGNS[Math.floor(R() * SIGNS.length)] : null, sc: sCols[Math.floor(R() * sCols.length)], beacon: h > 4000 });
      }
      if (x.lantern && i % 5 === 2) D.push({ t: 'lantern', col: sCols[i % sCols.length] });
      if (x.holo && i % 55 === 20) D.push({ t: 'holo', col: sCols[i % sCols.length] });
      if (i % 170 === 90) D.push({ t: 'gantry', txt: pick(['新東京 12km', '湾岸線 出口', 'NEO BAY 5km', '環状 C1', '晴海 3km', 'ゴール 2km']) });
    } else if (kit === 'grid') {
      const every = x.servers ? 4 : 10;
      if (i % every === 0) for (const side of [-1, 1]) if (R() < 0.6) D.push({ t: x.crystal ? 'crystal' : 'pylon', x: side * (1.4 + R() * 4), h: (x.servers ? 1400 : 400) + R() * (x.servers ? 1800 : 2200), w: 150 + R() * (x.servers ? 500 : 300), col: x.quantum ? pc() : gridCol, lights: !!x.servers });
      if (i % (x.fractal ? 11 : 37) === 0) D.push({ t: 'cube', x: (R() < 0.5 ? -1 : 1) * (2 + R() * 5), y: 800 + R() * 2400, r: 200 + R() * 400, spin: R() * 6, col: x.fractal || x.quantum ? pc() : gridCol });
      if (x.junk && i % 7 === 0) D.push({ t: 'cube', x: (R() < 0.5 ? -1 : 1) * (1.4 + R() * 2.5), y: 60, r: 80 + R() * 140, spin: R() * 6, col: pick([[255, 80, 80], [255, 200, 80], [160, 60, 80]]) });
      if (x.hex && i % 6 === 0) D.push({ t: 'hex', x: (R() < 0.5 ? -1 : 1) * (1.5 + R() * 3), r: 200 + R() * 300 });
      if (i % (x.arena || x.holo ? 45 : 220) === 22) D.push({ t: x.holo ? 'holo' : 'gate', col: sec.road });
    } else if (kit === 'forest') {
      if (i % 3 === 0) for (const side of [-1, 1]) if (R() < 0.8) D.push({ t: 'tree', x: side * (1.35 + R() * 3.5), h: 1400 + R() * 3000, w: 140 + R() * 220, col: x.trees[Math.floor(R() * x.trees.length)], seed: Math.floor(R() * 9999) });
      if (i % 4 === 1) for (const side of [-1, 1]) if (R() < 0.6) D.push({ t: 'mush', x: side * (1.2 + R() * 1.4), h: 120 + R() * 380, col: x.trees[Math.floor(R() * x.trees.length)] });
    } else if (kit === 'industrial') {
      if (i % 5 === 0) for (const side of [-1, 1]) if (R() < 0.7) { const tk = R(); D.push(tk < 0.45 ? { t: 'tank', x: side * (1.5 + R() * 2.5), w: 700 + R() * 900, h: 500 + R() * 1200 } : tk < 0.75 ? { t: 'stack', x: side * (1.6 + R() * 3), w: 200 + R() * 200, h: 1800 + R() * 2600, fl: x.lava || R() < 0.4 } : { t: 'ruin', x: side * (1.5 + R() * 3), w: 600 + R() * 1200, h: 800 + R() * 2600, d: 500 + R() * 800, cut: 0.4 + R() * 0.6, win: R() }); }
      if (i % 60 === 30) D.push({ t: 'pipe', col: sec.road });
      if (x.laser && i % 4 === 0) for (const side of [-1, 1]) D.push({ t: 'laser', x: side * 1.3 });
      if (i % 8 === 0) D.push({ t: 'flare', x: (i % 16 === 0 ? -1 : 1) * 1.15 });
    } else if (kit === 'sea') {
      if (x.rigs && i % 40 === 12) D.push({ t: 'rig', x: (R() < 0.5 ? -1 : 1) * (2.5 + R() * 4), w: 900 + R() * 900, h: 900 + R() * 1400 });
      if (i % 10 === 0) for (const side of [-1, 1]) D.push({ t: 'buoy', x: side * (1.25 + R() * 0.3), col: sec.road });
      if (x.poly && i % 25 === 5) D.push({ t: 'cube', x: (R() < 0.5 ? -1 : 1) * (2 + R() * 5), y: 300 + R() * 1200, r: 150 + R() * 250, spin: R() * 6, col: sec.lane });
    } else if (kit === 'space') {
      if (i % 4 === 0) for (const side of [-1, 1]) if (R() < 0.6) D.push({ t: 'rock', x: side * (1.4 + R() * 4.5), h: 150 + R() * 700, w: 400 + R() * 900, col: [170, 175, 200] });
      if (i % 20 === 0) D.push({ t: 'post', x: (i % 40 === 0 ? -1 : 1) * 1.2 });
    } else if (kit === 'waste') {
      if (i % 5 === 0) for (const side of [-1, 1]) if (R() < 0.55) D.push({ t: 'rock', x: side * (1.4 + R() * 4.5), h: 300 + R() * 1600, w: 400 + R() * 900, col: [255, 90, 150] });
      if (x.panels && i % 3 === 0) for (const side of [-1, 1]) if (R() < 0.8) D.push({ t: 'panel', x: side * (1.35 + R() * 3.5), w: 500 + R() * 300 });
      if (i % 30 === 0) D.push({ t: 'post', x: (i % 60 === 0 ? -1 : 1) * 1.2 });
    } else if (kit === 'ruins') {
      if (i % 5 === 0) for (const side of [-1, 1]) if (R() < 0.6) D.push({ t: 'ruin', x: side * (1.5 + R() * 3), w: 600 + R() * 1200, h: 600 + R() * 3600, d: 500 + R() * 800, cut: 0.3 + R() * 0.6, win: R() });
      if (i % 9 === 0 && R() < 0.5) D.push({ t: 'debris', x: (R() < 0.5 ? -1 : 1) * (1.2 + R() * 1.5), r: 60 + R() * 140 });
      if (i % 8 === 0) D.push({ t: 'flare', x: (i % 16 === 0 ? -1 : 1) * 1.15 });
    } else if (kit === 'sky') {
      if (i % 5 === 0) for (const side of [-1, 1]) if (R() < 0.7) D.push({ t: 'cloud', x: side * (1.6 + R() * 6), y: -500 - R() * 1500, r: 500 + R() * 900 });
      if (i % 8 === 0) for (const side of [-1, 1]) D.push({ t: 'buoy', x: side * 1.2, col: sec.lane });
    }
  }
}

// ---------- 投影 ----------
// 毎フレーム、カメラから奥へ DRAW_N 区間ぶんの投影データを作る。物体も、このデータから投影する。
const VIS = []; for (let i = 0; i <= 400; i++) VIS.push({ seg: null, cz1: 0, off1: 0, off2: 0, y1: 0, y2: 0, sx1: 0, sy1: 0, w1: 0, sx2: 0, sy2: 0, w2: 0, clip: H, ok: false });
let cam = { z: 0, x: 0, y: 0, pct: 0, shake: 0, tilt: 0 };   // 今の視点(プレイヤーごとに持ち、切り替える)
let baseI = 0;
function project() {
  const N = track.length; baseI = Math.floor(wrapZ(cam.z) / SEG_L); cam.pct = (wrapZ(cam.z) % SEG_L) / SEG_L;
  const base = track[baseI];
  let x = 0, dx = -(base.curve * cam.pct), maxy = H;
  for (let n = 0; n < DRAW_N; n++) {
    const v = VIS[n], s = track[(baseI + n) % N];
    v.seg = s; v.cz1 = (n - cam.pct) * SEG_L; v.off1 = x; v.off2 = x + dx; v.y1 = s.y1; v.y2 = s.y2;
    x += dx; dx += s.curve;
    const cz2 = v.cz1 + SEG_L;
    v.ok = false; v.clip = maxy;
    if (v.cz1 < 30) { v.sx1 = v.sy1 = v.w1 = 0; }
    else { const k = F / v.cz1; v.sx1 = CX + (v.off1 - cam.x) * k; v.sy1 = HOR - (v.y1 - cam.y) * k; v.w1 = ROAD_W * k; }
    { const k = F / cz2; v.sx2 = CX + (v.off2 - cam.x) * k; v.sy2 = HOR - (v.y2 - cam.y) * k; v.w2 = ROAD_W * k; }
    if (v.cz1 < 30 || v.sy2 >= v.sy1 || v.sy2 >= maxy) continue;
    v.ok = true; maxy = v.sy2;
  }
}
// 任意の点を投影する: z は絶対位置、wx は実寸の横位置、wy は路面からの高さ。戻り値 [sx, sy, 1単位あたりのpx, 区間番号, 奥行き]
const PJ = [0, 0, 0, 0, 0];
function proj(z, wx, wy, out) {
  const r = relZ(z, cam.z) + cam.pct * SEG_L, n = Math.floor(r / SEG_L);
  if (n < 0 || n >= DRAW_N) return null;
  const v = VIS[n], t = r / SEG_L - n, cz = r - cam.pct * SEG_L;
  if (cz < 120) return null;
  const off = v.off1 + (v.off2 - v.off1) * t, y = v.y1 + (v.y2 - v.y1) * t, k = F / cz;
  const o = out || PJ; o[0] = CX + (wx + off - cam.x) * k; o[1] = HOR - (y + wy - cam.y) * k; o[2] = k; o[3] = n; o[4] = cz; return o;
}

// ---------- 描画の小道具 ----------
let ctx;
function glowLine(pts, col, a, w, close) {   // 太く薄い線と細く明るい線を重ねて、光って見せる(shadowBlur より軽い)
  if (!lite && w > 0) { ctx.strokeStyle = rgba(col, a * 0.22); ctx.lineWidth = w * 3.2; path(pts, close); ctx.stroke(); }
  ctx.strokeStyle = rgba(col, a); ctx.lineWidth = Math.max(0.6, w); path(pts, close); ctx.stroke();
}
function path(pts, close) { ctx.beginPath(); ctx.moveTo(pts[0], pts[1]); for (let i = 2; i < pts.length; i += 2) ctx.lineTo(pts[i], pts[i + 1]); if (close) ctx.closePath(); }
function fillQuad(x1, y1, x2, y2, x3, y3, x4, y4, fill) { ctx.fillStyle = fill; ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.lineTo(x3, y3); ctx.lineTo(x4, y4); ctx.closePath(); ctx.fill(); }
function fogA(n) { const t = n / DRAW_N; return t < 0.35 ? 1 : Math.max(0, 1 - (t - 0.35) / 0.65); }

// ---------- 空と遠景 ----------
let skyX = 0;
const SKYCACHE = {};
function makeSkyline(seed, hMin, hMax) { const R = mulberry(seed), a = []; let x = 0; while (x < 4000) { const w = 30 + R() * 90, h = hMin + R() * (hMax - hMin); a.push({ x, w, h, win: R(), ant: R() < 0.15 }); x += w + R() * 8; } return a; }
function groundCol() {   // 道の外の地面の色(遠くの物を隠すため、区間ごとに塗る)
  const s = SEC(), k = s.kit, x = s.x;
  return k === 'sky' ? '#8ea6cc' : k === 'sea' || x.water ? '#010a12' : k === 'space' ? '#18181e' : x.lava ? '#1a0400' : k === 'grid' ? '#000306' : k === 'forest' ? '#01080a' : '#030208';
}
function drawSky() {
  const sec = SEC(), x = sec.x, k = sec.kit, g = ctx.createLinearGradient(0, 0, 0, HOR);
  g.addColorStop(0, sec.sky[0]); g.addColorStop(0.6, sec.sky[1]); g.addColorStop(1, sec.sky[2]);
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, HOR + 2);
  if (k === 'sky') { const cg = ctx.createLinearGradient(0, HOR, 0, H); cg.addColorStop(0, '#5a78b0'); cg.addColorStop(1, '#e8eef8'); ctx.fillStyle = cg; } else ctx.fillStyle = groundCol();
  ctx.fillRect(0, HOR, W, H - HOR);
  const t = performance.now() / 1000;
  if (x.stars) starField(x.stars, 0.5);
  if (x.earth) earth(W * 0.7 - skyX * 0.03, HOR - (k === 'tube' ? 60 : 30), k === 'tube' ? 260 : 150);
  if (x.moon) moon(W * 0.78 - skyX * 0.05, HOR - 190 * H / SH, 46 * H / SH, x.moon);
  if (x.sun) synthSun(W * 0.5 - skyX * 0.04, HOR - 70 * H / SH, 150 * H / SH, x.sun, sec.sky[2], t);
  if (x.dome) glowDome(W * 0.35 - skyX * 0.05, x.dome, t);
  if (x.beam) { const bx = W * 0.5 - skyX * 0.08; for (let q = 0; q < 3; q++) { ctx.fillStyle = rgba(x.beam, 0.05 + q * 0.03); ctx.fillRect(((bx % W) + W) % W - 6 + q * 2, 0, 12 - q * 4, HOR); } }
  if (x.search) for (let q = 0; q < 3; q++) { const a0 = Math.sin(t * 0.4 + q * 2) * 0.5, bx = W * (0.2 + q * 0.3); ctx.fillStyle = 'rgba(200,220,255,0.06)'; ctx.beginPath(); ctx.moveTo(bx, HOR); ctx.lineTo(bx + Math.sin(a0) * 900 - 40, 0); ctx.lineTo(bx + Math.sin(a0) * 900 + 40, 0); ctx.closePath(); ctx.fill(); }
  const sk = hex2rgb(sec.sky[2]), dark = mixc(sk, [0, 0, 0], 0.55), darker = mixc(sk, [0, 0, 0], 0.8);
  if (k === 'city' || k === 'industrial') {
    const haze = ctx.createRadialGradient(CX, HOR * 0.95, 0, CX, HOR * 0.95, W * 0.62);
    haze.addColorStop(0, rgba(k === 'city' ? [195, 35, 115] : [235, 85, 25], 0.16));
    haze.addColorStop(1, 'rgba(0,0,0,0)'); ctx.fillStyle = haze; ctx.fillRect(0, 0, W, HOR + 30);
  }
  if (k === 'city') skyline(SKYCACHE['c' + sec.no] || (SKYCACHE['c' + sec.no] = [makeSkyline(7 + sec.no, 60 * (x.bld && x.bld.h[1] > 8000 ? 2 : 1), 170 * (x.bld && x.bld.h[1] > 8000 ? 2 : 1)), makeSkyline(11 + sec.no, 30, 90)]), [darker, dark], (x.bld && x.bld.winCol) || [255, 200, 90]);
  else if (k === 'industrial') { skyline(SKYCACHE['i' + sec.no] || (SKYCACHE['i' + sec.no] = [makeSkyline(31 + sec.no, 40, 150), makeSkyline(37, 20, 70)]), [darker, dark], [255, 150, 60], true); if (x.smoke) smokeClouds(x.smoke, t); }
  else if (k === 'ruins') { skyline(SKYCACHE['r' + sec.no] || (SKYCACHE['r' + sec.no] = [makeSkyline(23 + sec.no, 20, 140), makeSkyline(29, 10, 60)]), [darker, dark], [255, 70, 60], true); if (x.wall) bigWall(sec, t); }
  else if (k === 'grid' || k === 'waste' || k === 'forest' || k === 'space') {
    const mt = x.mtn || (k === 'forest' ? [[40, 160, 120], [30, 110, 90]] : k === 'space' ? [[160, 165, 190], [120, 125, 150]] : [sec.grid]);
    mountains(33 + sec.no, mt[0], 0.12, k === 'space' ? 90 : 140, 0.55); if (mt[1]) mountains(19 + sec.no, mt[1], 0.2, 80, 0.8);
  }
  if (k === 'sea' || x.water) { ctx.strokeStyle = rgba(sec.grid, 0.35); ctx.lineWidth = 1; for (let i = 0; i < 12; i++) { const yy = HOR + 2 + i * i * 1.6; ctx.beginPath(); ctx.moveTo(0, yy); ctx.lineTo(W, yy); ctx.stroke(); } }
}
function starField(n, a) { const R = mulberry(3); ctx.fillStyle = 'rgba(255,255,255,' + a + ')'; for (let i = 0; i < n; i++) { const x = ((R() * W * 2 - skyX * 0.02) % W + W) % W, y = R() * (HOR - 20); ctx.fillRect(x, y, 1.5, 1.5); } }
function wrapX(x, span) { return ((x % span) + span) % span - (span - W) / 2; }
function moon(x, y, r, col) { x = wrapX(x, W * 1.5); const g = ctx.createRadialGradient(x, y, 0, x, y, r * 3); g.addColorStop(0, rgba(col, 0.9)); g.addColorStop(0.33, rgba(col, 0.35)); g.addColorStop(1, rgba(col, 0)); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r * 3, 0, Math.PI * 2); ctx.fill(); }
function synthSun(x, y, r, col, band, t) {   // 横縞で切れた太陽(80年代風)
  x = wrapX(x, W * 1.5); const sg = ctx.createLinearGradient(0, y - r, 0, y + r); sg.addColorStop(0, rgba(col, 1)); sg.addColorStop(0.5, '#ff5a78'); sg.addColorStop(1, '#a0187a');
  ctx.save(); ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.clip(); ctx.fillStyle = sg; ctx.fillRect(x - r, y - r, r * 2, r * 2);
  ctx.fillStyle = band; for (let i = 0; i < 7; i++) { const yy = y + 10 + i * 17 * r / 150 + ((t * 12) % 17); ctx.fillRect(x - r, yy, r * 2, 2 + i * 1.4); } ctx.restore();
}
function earth(x, y, r) {   // 地平線の向こうの、青い地球
  x = wrapX(x, W * 1.8); const g = ctx.createRadialGradient(x - r * 0.3, y - r * 0.4, r * 0.1, x, y, r);
  g.addColorStop(0, '#9fd8ff'); g.addColorStop(0.5, '#2a6ab8'); g.addColorStop(1, '#061a40'); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = 'rgba(160,220,255,0.6)'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(x, y, r + 3, 0, Math.PI * 2); ctx.stroke();
  ctx.fillStyle = 'rgba(40,120,60,0.55)'; const R = mulberry(9); for (let i = 0; i < 7; i++) { ctx.beginPath(); ctx.ellipse(x + (R() - 0.5) * r * 1.2, y + (R() - 0.5) * r * 1.2, r * (0.1 + R() * 0.2), r * (0.05 + R() * 0.12), R() * 3, 0, Math.PI * 2); ctx.fill(); }
}
function glowDome(x, col, t) {   // 遠くの、白く光る巨大なドーム
  const dxx = wrapX(x, W * 1.6), pulse = 0.8 + 0.2 * Math.sin(t * 1.3), r = 330 * H / SH;
  const dg = ctx.createRadialGradient(dxx, HOR, 10, dxx, HOR, r);
  dg.addColorStop(0, rgba([255, 255, 255], 0.95 * pulse)); dg.addColorStop(0.35, rgba(col, 0.55 * pulse)); dg.addColorStop(1, rgba(col, 0));
  ctx.fillStyle = dg; ctx.beginPath(); ctx.arc(dxx, HOR, r, Math.PI, 0); ctx.fill();
}
function smokeClouds(col, t) { const R = mulberry(77); for (let i = 0; i < 9; i++) { const x = wrapX(R() * W * 2 - skyX * 0.06 + t * 8, W * 2), y = HOR - 40 - R() * 140, r = 60 + R() * 120; ctx.fillStyle = rgba(col, 0.12); ctx.beginPath(); ctx.ellipse(x, y, r * 1.8, r * 0.6, 0, 0, Math.PI * 2); ctx.fill(); } }
function bigWall(sec, t) {   // 最終防衛ラインの巨大な壁
  const top = HOR - 200 * H / SH; ctx.fillStyle = '#120204'; ctx.fillRect(0, top, W, HOR - top);
  ctx.strokeStyle = rgba(sec.road, 0.5); ctx.lineWidth = 1; ctx.beginPath(); for (let i = 0; i < 8; i++) { const y = top + i * (HOR - top) / 8; ctx.moveTo(0, y); ctx.lineTo(W, y); } ctx.stroke();
  for (let i = 0; i < 20; i++) { const x = wrapX(i * 140 - skyX * 0.1, W * 2); if (Math.sin(t * 3 + i) > 0.2) { ctx.fillStyle = rgba([255, 40, 40], 0.9); ctx.fillRect(x, top + 6, 6, 4); } }
}
function skyline(layers, cols, winCol, broken) {
  layers.forEach((L, li) => {
    const par = li === 0 ? 0.12 : 0.25, off = ((-skyX * par) % 4000 + 4000) % 4000, sc = H / SH;
    ctx.fillStyle = rgba(cols[li], 1);
    for (const b of L) for (const rep of [0, 4000]) {
      const x = b.x - off + rep; if (x > W || x + b.w < 0) continue;
      const top = HOR - b.h * (li === 0 ? 1 : 0.8) * sc;
      if (broken && b.win < 0.4) { ctx.beginPath(); ctx.moveTo(x, HOR); ctx.lineTo(x, top + 15); ctx.lineTo(x + b.w * 0.4, top); ctx.lineTo(x + b.w * 0.7, top + 30); ctx.lineTo(x + b.w, top + 10); ctx.lineTo(x + b.w, HOR); ctx.fill(); }
      else ctx.fillRect(x, top, b.w, HOR - top);
      if (li === 0 && !lite) { ctx.fillStyle = rgba(winCol, 0.5); const R = mulberry(Math.floor(b.x)); for (let yy = top + 6; yy < HOR - 4; yy += 7) for (let xx = x + 4; xx < x + b.w - 3; xx += 6) if (R() < b.win * 0.35) ctx.fillRect(xx, yy, 2, 2); ctx.fillStyle = rgba(cols[li], 1); }
      if (b.ant && li === 0) { const on = Math.sin(performance.now() / 300 + b.x) > 0; if (on) { ctx.fillStyle = 'rgba(255,40,40,0.9)'; ctx.fillRect(x + b.w / 2 - 1.5, top - 3, 3, 3); ctx.fillStyle = rgba(cols[li], 1); } }
    }
  });
}
function mountains(seed, col, par, hmax, a) {
  const R = mulberry(seed), pts = []; for (let i = 0; i <= 40; i++) pts.push(R());
  const off = ((-skyX * par) % 2000 + 2000) % 2000, arr = [], sc = H / SH;
  for (let rep = -1; rep < 2; rep++) for (let i = 0; i <= 40; i++) { const x = i * 50 - off + rep * 2000; if (x < -60 || x > W + 60) continue; arr.push(x, HOR - pts[i] * hmax * sc * (0.4 + 0.6 * Math.abs(Math.sin(i * 0.7)))); }
  if (arr.length < 4) return;
  ctx.fillStyle = 'rgba(0,0,0,0.85)'; ctx.beginPath(); ctx.moveTo(arr[0], HOR); for (let i = 0; i < arr.length; i += 2) ctx.lineTo(arr[i], arr[i + 1]); ctx.lineTo(arr[arr.length - 2], HOR); ctx.fill();
  glowLine(arr, col, a, 1.2);
  ctx.strokeStyle = rgba(col, a * 0.25); ctx.lineWidth = 1; ctx.beginPath();   // 山の中の斜線(ワイヤーフレーム)
  for (let i = 0; i < arr.length - 2; i += 2) { ctx.moveTo(arr[i], arr[i + 1]); ctx.lineTo((arr[i] + arr[i + 2]) / 2, HOR); }
  ctx.stroke();
}
// 天気(雨・雪・かすみ・胞子・蛍・乱れ)。視界全体に重ねる
function drawWeather(speed) {
  const x = SEC().x, t = performance.now() / 1000;
  if (x.rain) { ctx.strokeStyle = rgba(x.rain, 0.35); ctx.lineWidth = 1; ctx.beginPath(); for (let i = 0; i < 70; i++) { const px = Math.random() * W, py = Math.random() * H, l = 18 + speed * 30; ctx.moveTo(px, py); ctx.lineTo(px - 4 - speed * 10, py + l); } ctx.stroke(); }
  if (x.snow) { ctx.fillStyle = 'rgba(230,245,255,0.7)'; for (let i = 0; i < 50; i++) { const px = (i * 97 + t * (40 + i % 7 * 10)) % W, py = (i * 53 + t * (60 + speed * 400)) % H; ctx.fillRect(px, py, 2, 2); } }
  if (x.fireflies || x.spores) { const col = x.spores ? [160, 255, 90] : [200, 255, 140]; for (let i = 0; i < 26; i++) { const px = (i * 131 + Math.sin(t * 0.7 + i) * 40) % W, py = HOR * 0.5 + ((i * 71) % (H - HOR * 0.5)) + Math.sin(t + i * 3) * 20; ctx.fillStyle = rgba(col, 0.4 + 0.4 * Math.sin(t * 3 + i)); ctx.fillRect(px, py, 3, 3); } }
  if (x.haze) { ctx.fillStyle = rgba(x.haze, 0.12); ctx.fillRect(0, 0, W, H); }
  if (x.glitch && Math.random() < 0.06) { const y = Math.random() * H, h = 4 + Math.random() * 20; ctx.drawImage(ctx.canvas, 0, y * (ctx.canvas.height / SH), ctx.canvas.width, h * (ctx.canvas.height / SH), (Math.random() - 0.5) * 40, y, W, h); }
  if (x.overdrive) { ctx.fillStyle = rgba([255, 200, 120], 0.05 + 0.04 * Math.sin(t * 20)); ctx.fillRect(0, 0, W, H); }
}

// ---------- 道路 ----------
function drawRoadSeg(n) {
  const v = VIS[n], sec = SEC(), a = fogA(n), s = v.seg, X = sec.x;
  const x1 = v.sx1, y1 = v.sy1, w1 = v.w1, x2 = v.sx2, y2 = v.sy2, w2 = v.w2;
  // 地面(遠くの物を隠すために塗る)
  ctx.fillStyle = sec.kit === 'sky' ? '#9db4d8' : groundCol(); ctx.fillRect(0, y2, W, y1 - y2 + 1);
  if (X.lava && s.i % 3 === 0) { ctx.strokeStyle = rgba([255, 90 + (s.i * 37) % 80, 0], a * 0.6); ctx.lineWidth = Math.max(1, w1 / 400); ctx.beginPath(); ctx.moveTo(0, y1); ctx.lineTo(x1 - w1 * 1.3, y1); ctx.moveTo(x1 + w1 * 1.3, y1); ctx.lineTo(W, y1); ctx.stroke(); }
  if ((sec.kit === 'sea' || X.water) && s.i % 3 === 0) { ctx.strokeStyle = rgba(sec.grid, a * (0.25 + 0.2 * Math.sin(s.i * 0.7 + performance.now() / 400))); ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(0, y1); ctx.lineTo(x1 - w1 * 1.2, y1); ctx.moveTo(x1 + w1 * 1.2, y1); ctx.lineTo(W, y1); ctx.stroke(); }
  const gnd = sec.ground;
  if (gnd && (s.i % 4 === 0) && sec.kit !== 'sky') { ctx.strokeStyle = rgba(gnd, a * 0.45); ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(0, y1); ctx.lineTo(W, y1); ctx.stroke(); }
  if (gnd && sec.kit !== 'sky') {   // 道の外の、奥へ伸びる線
    ctx.strokeStyle = rgba(gnd, a * 0.35); ctx.lineWidth = 1; ctx.beginPath();
    for (let k = 1; k <= 8; k++) for (const sd of [-1, 1]) { const o = sd * (1 + k * 0.9); ctx.moveTo(x1 + w1 * o, y1); ctx.lineTo(x2 + w2 * o, y2); }
    ctx.stroke();
  }
  // 路肩の帯と路面
  const rum = 1.12, fill = sec.kit === 'sky' ? 'rgba(10,20,40,0.92)' : 'rgba(' + hex2rgb(sec.sky[0]).map(c => Math.round(c * 0.8)).join(',') + ',0.94)';
  fillQuad(x1 - w1 * rum, y1, x1 + w1 * rum, y1, x2 + w2 * rum, y2, x2 - w2 * rum, y2, s.i % 2 ? 'rgba(20,6,30,0.9)' : 'rgba(6,14,30,0.9)');
  fillQuad(x1 - w1, y1, x1 + w1, y1, x2 + w2, y2, x2 - w2, y2, s.tunnel && sec.kit !== 'tube' ? 'rgba(18,10,4,0.95)' : fill);
  const rc = sec.road, lc = sec.lane;
  // 雨に濡れたような路面の細い反射。遠景には置かず、2人プレイ時も軽く保つ。
  if (!lite && n < 64 && s.i % 5 === 0) {
    const shimmer = 0.15 + 0.07 * Math.sin(s.i * 1.7 + performance.now() / 500);
    for (const sd of [-1, 1]) {
      const o = sd * 0.81;
      fillQuad(x1 + w1 * (o - 0.012), y1, x1 + w1 * (o + 0.012), y1,
        x2 + w2 * (o + 0.008), y2, x2 + w2 * (o - 0.008), y2, rgba(rc, a * shimmer));
    }
  }
  // 路面の印: 冷却帯(青)、加速帯(矢印)、スタートの線(市松)
  if (s.cool) { const L = s.cool.x - s.cool.w, R2 = s.cool.x + s.cool.w; fillQuad(x1 + w1 * L, y1, x1 + w1 * R2, y1, x2 + w2 * R2, y2, x2 + w2 * L, y2, rgba([60, 170, 255], a * 0.35)); ctx.strokeStyle = rgba([150, 220, 255], a * 0.9); ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(x1 + w1 * L, y1); ctx.lineTo(x2 + w2 * L, y2); ctx.moveTo(x1 + w1 * R2, y1); ctx.lineTo(x2 + w2 * R2, y2); ctx.stroke(); }
  if (s.pad) { const L = s.pad.x - s.pad.w, R2 = s.pad.x + s.pad.w, on = 0.55 + 0.45 * Math.sin(performance.now() / 90 - s.i * 1.3); fillQuad(x1 + w1 * L, y1, x1 + w1 * R2, y1, x2 + w2 * R2, y2, x2 + w2 * L, y2, rgba([40, 255, 190], a * 0.25 * on)); const mx1 = x1 + w1 * s.pad.x, mx2 = x2 + w2 * s.pad.x; glowLine([x1 + w1 * L, y1, (mx1 + mx2) / 2, y2 + (y1 - y2) * 0.2, x1 + w1 * R2, y1], [120, 255, 220], a * on, Math.max(1, w1 / 250)); }
  if (s.start) { const cells = 10; for (let c = 0; c < cells; c++) { if ((c + s.i) % 2) continue; const o1 = -1 + 2 * c / cells, o2 = -1 + 2 * (c + 1) / cells; fillQuad(x1 + w1 * o1, y1, x1 + w1 * o2, y1, x2 + w2 * o2, y2, x2 + w2 * o1, y2, rgba([255, 255, 255], a * 0.85)); } }
  // 横線(手前に流れて、速さを見せる)
  if (s.i % 2 === 0) { ctx.strokeStyle = rgba(sec.grid, a * (s.i % 8 === 0 ? 0.95 : 0.53)); ctx.lineWidth = s.i % 8 === 0 ? 2 : 1; ctx.beginPath(); ctx.moveTo(x1 - w1, y1); ctx.lineTo(x1 + w1, y1); ctx.stroke(); }
  // 車線(破線)と、縦のグリッド
  ctx.strokeStyle = rgba(sec.grid, a * 0.28); ctx.lineWidth = 1; ctx.beginPath();
  for (let k = 1; k < 8; k++) { if (k % 2 === 0) continue; const o = -1 + k / 4; ctx.moveTo(x1 + w1 * o, y1); ctx.lineTo(x2 + w2 * o, y2); }
  ctx.stroke();
  if ((s.i >> 2) % 2 === 0) { ctx.strokeStyle = rgba(lc, a * 0.8); ctx.lineWidth = Math.max(1, w1 / 260); ctx.beginPath(); for (let k = 1; k < LANES; k++) { const o = -1 + 2 * k / LANES; ctx.moveTo(x1 + w1 * o, y1); ctx.lineTo(x2 + w2 * o, y2); } ctx.stroke(); }
  // 道の縁(光の壁)
  const ew = Math.max(1, Math.min(4, w1 / 180));
  if (!lite && n < 90) { ctx.strokeStyle = rgba(rc, a * 0.2); ctx.lineWidth = ew * 4; ctx.beginPath(); ctx.moveTo(x1 - w1, y1); ctx.lineTo(x2 - w2, y2); ctx.moveTo(x1 + w1, y1); ctx.lineTo(x2 + w2, y2); ctx.stroke(); }
  ctx.strokeStyle = rgba(rc, a); ctx.lineWidth = ew; ctx.beginPath(); ctx.moveTo(x1 - w1, y1); ctx.lineTo(x2 - w2, y2); ctx.moveTo(x1 + w1, y1); ctx.lineTo(x2 + w2, y2);
  ctx.moveTo(x1 - w1 * rum, y1); ctx.lineTo(x2 - w2 * rum, y2); ctx.moveTo(x1 + w1 * rum, y1); ctx.lineTo(x2 + w2 * rum, y2); ctx.stroke();
}

// ---------- 景色(区間ごと) ----------
const P3 = [0, 0, 0, 0, 0], P4 = [0, 0, 0, 0, 0];
function boxPts(z, x, y, w, h, d) {   // 直方体の8頂点を投影(手前の面4点・奥の面4点)。x は実寸
  const out = [];
  for (const dz of [0, d]) for (const [ox, oy] of [[-w / 2, 0], [w / 2, 0], [w / 2, h], [-w / 2, h]]) { const p = proj(z + dz, x + ox, y + oy); if (!p) return null; out.push(p[0], p[1]); }
  return out;
}
function drawBox(b, col, a, fill, extra) {   // 奥の面から順に塗り、縁を光らせる(塗りで後ろの線が隠れる)
  const cxm = (b[0] + b[2]) / 2, topVis = b[5] > b[13];   // 手前の上辺が奥の上辺より下なら、上面が見える
  const L = [0, 4, 7, 3], Rr = [1, 5, 6, 2], T = [3, 2, 6, 7];
  const order = [[4, 5, 6, 7]]; if (!topVis) order.push(T);
  if (cxm < CX) order.push(L, Rr); else order.push(Rr, L);
  if (topVis) order.push(T); order.push([0, 1, 2, 3]);
  for (const fc of order) {
    ctx.fillStyle = fill; ctx.beginPath(); ctx.moveTo(b[fc[0] * 2], b[fc[0] * 2 + 1]); for (let i = 1; i < 4; i++) ctx.lineTo(b[fc[i] * 2], b[fc[i] * 2 + 1]); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = rgba(col, a * (fc[0] === 0 ? 1 : 0.6)); ctx.lineWidth = 1; ctx.stroke();
  }
  if (extra) extra(b);
}
function arcPts(z, rx, ry, cy, n) { const pts = []; for (let i = 0; i <= n; i++) { const an = Math.PI * i / n, p = proj(z, -Math.cos(an) * rx, cy + Math.sin(an) * ry, P3); if (!p) return null; pts.push(p[0], p[1]); } return pts; }
function drawLightBridge(s, a, sec) {
  if (s.tunnel || s.i % 24 !== 0 || !['city', 'industrial', 'grid', 'forest'].includes(sec.kit)) return;
  const z = s.z + 1, left = proj(z, -ROAD_W * 1.25, 0), right = proj(z, ROAD_W * 1.25, 0);
  const lt = proj(z, -ROAD_W * 1.25, 1100), rt = proj(z, ROAD_W * 1.25, 1100);
  if (!left || !right || !lt || !rt) return;
  const c = sec.kit === 'forest' ? [80, 255, 195] : sec.kit === 'industrial' ? [255, 145, 55] : sec.road;
  ctx.strokeStyle = rgba([24, 34, 55], a * 0.95); ctx.lineWidth = Math.max(3, left[2] * 65);
  ctx.beginPath(); ctx.moveTo(left[0], left[1]); ctx.lineTo(lt[0], lt[1]); ctx.lineTo(rt[0], rt[1]); ctx.lineTo(right[0], right[1]); ctx.stroke();
  ctx.strokeStyle = rgba(c, a * 0.7); ctx.lineWidth = Math.max(1, left[2] * 12); ctx.stroke();
  const mid = (lt[0] + rt[0]) / 2, yy = (lt[1] + rt[1]) / 2;
  ctx.fillStyle = 'rgba(3,10,22,0.88)'; ctx.fillRect(mid - 190 * left[2], yy + 14 * left[2], 380 * left[2], 95 * left[2]);
  if (left[2] > 0.09) {
    ctx.fillStyle = rgba(c, a); ctx.font = 'bold ' + Math.max(8, Math.round(52 * left[2])) + 'px Consolas,monospace'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(sec.kit === 'forest' ? 'BIO-LUMEN' : sec.kit === 'industrial' ? 'POWER ZONE' : 'NEON RIDER', mid, yy + 59 * left[2]);
  }
}
function drawRoadBeacons(s, a, sec) {
  if (s.tunnel || s.i % 8 !== 0 || !['city', 'grid', 'forest', 'industrial'].includes(sec.kit)) return;
  const z = s.z + 1, col = sec.kit === 'forest' ? [60, 255, 180] : sec.kit === 'industrial' ? [255, 160, 55] : [80, 215, 255];
  for (const sd of [-1, 1]) {
    const x = sd * ROAD_W * 1.15, p = proj(z, x, 0), q = proj(z, x, 580);
    if (!p || !q) continue;
    ctx.strokeStyle = rgba([20, 37, 62], a * 0.95); ctx.lineWidth = Math.max(2, 34 * p[2]);
    ctx.beginPath(); ctx.moveTo(p[0], p[1]); ctx.lineTo(q[0], q[1]); ctx.stroke();
    ctx.strokeStyle = rgba(col, a * 0.9); ctx.lineWidth = Math.max(1, 8 * p[2]); ctx.stroke();
    const w = Math.max(2, 70 * p[2]); ctx.fillStyle = rgba(col, a * 0.8); ctx.fillRect(q[0] - w / 2, q[1], w, Math.max(2, 25 * p[2]));
  }
}
function drawDecoSeg(n) {
  const v = VIS[n], s = v.seg, a = fogA(n), sec = SEC(), z = s.z + 1, t = performance.now() / 1000;
  if (v.cz1 >= 260) { drawRoadBeacons(s, a, sec); drawLightBridge(s, a, sec); }
  if (!s.deco.length || v.cz1 < 260) return;
  for (const d of s.deco) {
    if (d.t === 'bldg' || d.t === 'ruin') {
      const wx = d.x * ROAD_W + Math.sign(d.x) * d.w / 2, b = boxPts(z, wx, d.t === 'ruin' ? -40 : 0, d.w, d.h * (d.t === 'ruin' ? d.cut : 1), d.d); if (!b) continue;
      const col = d.t === 'ruin' ? [150, 90, 140] : [80, 145, 220];
      drawBox(b, col, a * 0.8, 'rgba(3,4,10,0.97)', bb => {
        const fx = [bb[0], bb[2], bb[4], bb[6]], fy = [bb[1], bb[3], bb[5], bb[7]];   // 手前の面
        const L = Math.min(fx[0], fx[3]), R = Math.max(fx[1], fx[2]), T = Math.min(fy[2], fy[3]), B = Math.max(fy[0], fy[1]), ww = R - L, hh = B - T;
        if (ww > 12 && hh > 12 && !lite) {   // 窓
          const Rn = mulberry(Math.floor(d.w * 7 + d.h)), cols = clamp(Math.floor(ww / 9), 2, 22), rows = clamp(Math.floor(hh / 9), 2, 36), cw = ww / cols, rh = hh / rows;
          const wc = d.t === 'ruin' ? [255, 120, 60] : d.wc || [255, 210, 120];
          ctx.fillStyle = rgba(wc, a * 0.55);
          for (let r = 1; r < rows && r < 60; r++) for (let c = 0; c < cols && c < 40; c++) if (Rn() < d.win * (d.t === 'ruin' ? 0.12 : 0.4)) ctx.fillRect(L + c * cw + cw * 0.25, T + r * rh, Math.max(1, cw * 0.4), Math.max(1, rh * 0.35));
        }
        if (d.sign && ww > 18) {   // ネオン看板(縦書き)
          const sx = d.x < 0 ? R - ww * 0.18 : L + ww * 0.18, fs = Math.min(60, Math.max(7, ww * 0.16)), flick = Math.sin(t * 7 + d.w) > -0.85 ? 1 : 0.2;
          ctx.fillStyle = rgba([0, 0, 0], 0.8); ctx.fillRect(sx - fs * 0.65, T + hh * 0.08, fs * 1.3, fs * d.sign.length * 1.08 + fs * 0.4);
          ctx.strokeStyle = rgba(d.sc, a * flick); ctx.lineWidth = 1; ctx.strokeRect(sx - fs * 0.65, T + hh * 0.08, fs * 1.3, fs * d.sign.length * 1.08 + fs * 0.4);
          ctx.fillStyle = rgba(d.sc, a * flick); ctx.font = 'bold ' + fs.toFixed(0) + 'px "Yu Gothic",Meiryo,sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'top';
          for (let i = 0; i < d.sign.length; i++) ctx.fillText(d.sign[i], sx, T + hh * 0.08 + fs * 0.25 + i * fs * 1.08);
        }
        if (d.beacon && Math.sin(t * 3 + d.h) > 0.3) { ctx.fillStyle = rgba([255, 40, 40], a); ctx.fillRect((L + R) / 2 - 2, T - 4, 4, 4); }
      });
    } else if (d.t === 'lamp') {
      const p = proj(z, d.x * ROAD_W, 0, P3); if (!p) continue; const x0 = p[0], y0 = p[1], k = p[2];
      const top = y0 - 700 * k, arm = -Math.sign(d.x) * 260 * k;
      glowLine([x0, y0, x0, top, x0 + arm, top + 30 * k], [110, 120, 160], a * 0.8, 1);
      ctx.fillStyle = rgba([255, 170, 60], a); ctx.fillRect(x0 + arm - 30 * k, top + 26 * k, 60 * k, 10 * k + 1);
      if (!lite && n < 120) { const g = ctx.createRadialGradient(x0 + arm, top + 30 * k, 0, x0 + arm, top + 30 * k, 200 * k); g.addColorStop(0, rgba([255, 160, 60], 0.35 * a)); g.addColorStop(1, 'rgba(255,160,60,0)'); ctx.fillStyle = g; ctx.fillRect(x0 + arm - 200 * k, top - 170 * k, 400 * k, 400 * k); }
    } else if (d.t === 'ring') {   // トンネルの輪。open(筒のコース)は、外の宇宙が見える
      const pts = d.open ? (() => { const q = []; for (let i = 0; i <= 16; i++) { const an = Math.PI * 2 * i / 16 - Math.PI / 2, p = proj(z, Math.sin(an) * ROAD_W * 1.35, 1300 - Math.cos(an) * 1400, P3); if (!p) return null; q.push(p[0], p[1]); } return q; })() : arcPts(z, ROAD_W * 1.3, 1300, 0, 12);
      if (!pts) continue;
      if (!d.open) {
        ctx.fillStyle = 'rgba(8,4,2,0.97)'; ctx.beginPath(); ctx.moveTo(0, pts[1]); ctx.lineTo(0, 0); ctx.lineTo(W, 0); ctx.lineTo(W, pts[pts.length - 1]);
        for (let i = pts.length - 2; i >= 0; i -= 2) ctx.lineTo(pts[i], pts[i + 1]); ctx.closePath(); ctx.fill();
        ctx.fillRect(0, pts[1], Math.max(0, pts[0]), H - pts[1]); ctx.fillRect(pts[pts.length - 2], pts[pts.length - 1], W, H);
        glowLine(pts, d.col, a * 0.9, 1.4);
        const lw = Math.abs(pts[14] - pts[10]) * 0.35; ctx.fillStyle = rgba([255, 210, 140], a); ctx.fillRect(pts[12] - lw / 2, pts[13], lw, Math.max(1, lw * 0.03));
      } else glowLine(pts, d.col, a * 0.8, 1.2, true);
    } else if (d.t === 'gantry') {
      const a2 = proj(z, -ROAD_W * 1.2, 0, P3), b1 = a2 && proj(z, ROAD_W * 1.2, 0, P4); if (!a2 || !b1) continue;
      const k = a2[2], top = a2[1] - 900 * k;
      glowLine([a2[0], a2[1], a2[0], top, b1[0], top, b1[0], b1[1]], [120, 140, 170], a, 1.3);
      const bw = (b1[0] - a2[0]) * 0.36, bx = a2[0] + (b1[0] - a2[0]) * 0.55, bh = 190 * k;
      ctx.fillStyle = rgba([0, 90, 50], 0.95 * a); ctx.fillRect(bx, top + 10 * k, bw, bh); ctx.strokeStyle = rgba([220, 255, 230], a); ctx.lineWidth = 1; ctx.strokeRect(bx + 3, top + 13 * k, bw - 6, bh - 6);
      if (bh > 8) { ctx.fillStyle = rgba([235, 255, 240], a); ctx.font = 'bold ' + Math.round(bh * 0.42) + 'px "Yu Gothic",Meiryo,sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(d.txt, bx + bw / 2, top + 10 * k + bh / 2); }
    } else if (d.t === 'pylon' || d.t === 'crystal') {
      const wx = d.x * ROAD_W, col = d.col || [0, 220, 255];
      if (d.t === 'crystal') { const c = proj(z, wx, 0, P3); if (!c) continue; const k = c[2], w = d.w * k, h = d.h * k; const pts = [c[0] - w / 2, c[1], c[0] - w * 0.3, c[1] - h * 0.8, c[0], c[1] - h, c[0] + w * 0.3, c[1] - h * 0.8, c[0] + w / 2, c[1]]; ctx.fillStyle = 'rgba(10,30,50,0.85)'; path(pts, true); ctx.fill(); glowLine(pts, [190, 240, 255], a * 0.9, 1, true); ctx.strokeStyle = rgba([190, 240, 255], a * 0.35); ctx.beginPath(); ctx.moveTo(c[0], c[1]); ctx.lineTo(c[0], c[1] - h); ctx.stroke(); continue; }
      const b = boxPts(z, wx, 0, d.w, d.h, d.w); if (!b) continue;
      drawBox(b, col, a * 0.9, 'rgba(0,6,12,0.95)', d.lights ? bb => { const L = Math.min(bb[0], bb[6]), R = Math.max(bb[2], bb[4]), T = Math.min(bb[5], bb[7]), B = Math.max(bb[1], bb[3]); if (R - L > 6) for (let r = 0; r < 12; r++) for (let c = 0; c < 3; c++) if (Math.sin(t * (2 + c) + r * 1.7 + d.h) > 0.5) { ctx.fillStyle = rgba(c === 1 ? [80, 255, 120] : col, a); ctx.fillRect(L + (R - L) * (0.2 + c * 0.3), T + (B - T) * (0.05 + r * 0.075), 2, 2); } } : null);
      const tp = proj(z, wx, d.h + 60, P3); if (tp && Math.sin(t * 4 + d.h) > 0) { ctx.fillStyle = rgba([180, 255, 255], a); ctx.fillRect(tp[0] - 2, tp[1] - 2, 4, 4); }
    } else if (d.t === 'cube') {
      const c = proj(z, d.x * ROAD_W, d.y, P3); if (!c) continue; const r = d.r * c[2], an = t * 0.6 + d.spin, col = d.col || [0, 200, 255];
      const pts = []; for (let i = 0; i < 6; i++) { const q = an + i * Math.PI / 3; pts.push(c[0] + Math.cos(q) * r, c[1] + Math.sin(q) * r * 0.9); }
      glowLine(pts, col, a * 0.8, 1.2, true);
      ctx.strokeStyle = rgba(col, a * 0.4); ctx.beginPath(); for (let i = 0; i < 6; i += 2) { ctx.moveTo(c[0], c[1]); ctx.lineTo(pts[i * 2], pts[i * 2 + 1]); } ctx.stroke();
    } else if (d.t === 'gate' || d.t === 'holo') {   // 光のゲート / ホログラムの輪
      const pts = arcPts(z, ROAD_W * 1.4, 1600, 0, 12); if (!pts) continue;
      if (d.t === 'holo') { const hue = (t * 60 + s.i * 7) % 360; ctx.strokeStyle = 'hsla(' + hue + ',100%,65%,' + (a * 0.8) + ')'; ctx.lineWidth = 3; path(pts); ctx.stroke(); const c = proj(z, 0, 1900, P4); if (c) { ctx.fillStyle = 'hsla(' + hue + ',100%,70%,' + (a * 0.25) + ')'; ctx.beginPath(); ctx.ellipse(c[0], c[1], 500 * c[2], 250 * c[2], 0, 0, Math.PI * 2); ctx.fill(); } }
      else glowLine(pts, d.col || [120, 255, 255], a, 3);
    } else if (d.t === 'rock') {
      const c = proj(z, d.x * ROAD_W, 0, P3); if (!c) continue; const k = c[2], w = d.w * k, h = d.h * k, Rn = mulberry(Math.floor(d.w)), col = d.col || [255, 90, 150];
      const pts = [c[0] - w / 2, c[1]]; for (let i = 1; i < 6; i++) pts.push(c[0] - w / 2 + w * i / 6 + (Rn() - 0.5) * w * 0.1, c[1] - h * (0.55 + Rn() * 0.45)); pts.push(c[0] + w / 2, c[1]);
      ctx.fillStyle = 'rgba(10,6,14,0.96)'; path(pts, true); ctx.fill();
      glowLine(pts, col, a * 0.8, 1, true);
      ctx.strokeStyle = rgba(col, a * 0.25); ctx.beginPath(); for (let i = 2; i < pts.length - 2; i += 2) { ctx.moveTo(pts[i], pts[i + 1]); ctx.lineTo(pts[i] + (Rn() - 0.5) * w * 0.2, c[1]); } ctx.stroke();
    } else if (d.t === 'post') {
      const c = proj(z, d.x * ROAD_W, 0, P3); if (!c) continue; const k = c[2];
      glowLine([c[0], c[1], c[0], c[1] - 220 * k], [255, 200, 120], a, 1.2);
      ctx.fillStyle = rgba([255, 120, 40], a); ctx.fillRect(c[0] - 12 * k, c[1] - 220 * k, 24 * k, 30 * k);
    } else if (d.t === 'debris') {
      const c = proj(z, d.x * ROAD_W, 0, P3); if (!c) continue; const r = d.r * c[2];
      glowLine([c[0] - r, c[1], c[0] - r * 0.3, c[1] - r * 0.8, c[0] + r * 0.6, c[1] - r * 0.4, c[0] + r, c[1]], [160, 120, 140], a * 0.7, 1, true);
    } else if (d.t === 'flare') {   // 非常灯(赤く点滅)
      const c = proj(z, d.x * ROAD_W, 0, P3); if (!c) continue; const k = c[2], on = Math.sin(t * 5 + s.i) > 0;
      glowLine([c[0], c[1], c[0], c[1] - 160 * k], [150, 80, 90], a, 1);
      if (on) { ctx.fillStyle = rgba([255, 40, 30], a); ctx.beginPath(); ctx.arc(c[0], c[1] - 170 * k, Math.max(1.5, 16 * k), 0, Math.PI * 2); ctx.fill(); }
    } else if (d.t === 'lantern') {   // 道の上に渡した、提灯のような灯りの列
      const pts = []; for (let i = 0; i <= 8; i++) { const u = i / 8, p = proj(z, (u * 2 - 1) * ROAD_W * 1.25, 950 - Math.sin(u * Math.PI) * 260, P3); if (!p) { pts.length = 0; break; } pts.push(p[0], p[1]); }
      if (!pts.length) continue; ctx.strokeStyle = rgba([90, 70, 60], a * 0.8); ctx.lineWidth = 1; path(pts); ctx.stroke();
      const k = proj(z, 0, 700, P4); const r = k ? Math.max(1.5, 34 * k[2]) : 2; for (let i = 2; i < pts.length - 2; i += 2) { ctx.fillStyle = rgba(d.col, a * 0.95); ctx.beginPath(); ctx.ellipse(pts[i], pts[i + 1] + r, r * 0.8, r, 0, 0, Math.PI * 2); ctx.fill(); }
    } else if (d.t === 'tree') {   // 光る植物の森の木
      const c = proj(z, d.x * ROAD_W, 0, P3); if (!c) continue; const k = c[2], h = d.h * k, w = d.w * k, Rn = mulberry(d.seed);
      ctx.fillStyle = 'rgba(4,10,8,0.97)'; ctx.beginPath(); ctx.moveTo(c[0] - w, c[1]); ctx.lineTo(c[0] - w * 0.35, c[1] - h); ctx.lineTo(c[0] + w * 0.35, c[1] - h); ctx.lineTo(c[0] + w, c[1]); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = rgba(d.col, a * 0.6); ctx.lineWidth = Math.max(1, w * 0.06); ctx.beginPath(); for (let i = 0; i < 3; i++) { const ox = (Rn() - 0.5) * w * 0.8; ctx.moveTo(c[0] + ox, c[1]); ctx.quadraticCurveTo(c[0] + ox * 0.4 + (Rn() - 0.5) * w, c[1] - h * 0.5, c[0] + ox * 0.3, c[1] - h); } ctx.stroke();
      if (!lite) for (let i = 0; i < 5; i++) { const px = c[0] + (Rn() - 0.5) * w * 6, py = c[1] - h * (0.75 + Rn() * 0.35), r = w * (1 + Rn() * 1.8); const g = ctx.createRadialGradient(px, py, 0, px, py, r); g.addColorStop(0, rgba(d.col, a * 0.35)); g.addColorStop(1, rgba(d.col, 0)); ctx.fillStyle = g; ctx.fillRect(px - r, py - r, r * 2, r * 2); }
    } else if (d.t === 'mush') {   // 光るキノコ
      const c = proj(z, d.x * ROAD_W, 0, P3); if (!c) continue; const k = c[2], h = d.h * k;
      ctx.strokeStyle = rgba([200, 220, 210], a * 0.7); ctx.lineWidth = Math.max(1, h * 0.12); ctx.beginPath(); ctx.moveTo(c[0], c[1]); ctx.lineTo(c[0], c[1] - h); ctx.stroke();
      ctx.fillStyle = rgba(d.col, a * 0.85); ctx.beginPath(); ctx.ellipse(c[0], c[1] - h, h * 0.7, h * 0.32, 0, Math.PI, 0); ctx.fill();
    } else if (d.t === 'tank') {
      const wx = d.x * ROAD_W + Math.sign(d.x) * d.w / 2, b = boxPts(z, wx, 0, d.w, d.h, d.w); if (!b) continue;
      drawBox(b, [255, 150, 70], a * 0.75, 'rgba(10,6,4,0.96)', bb => { ctx.strokeStyle = rgba([255, 150, 70], a * 0.35); ctx.lineWidth = 1; ctx.beginPath(); for (let i = 1; i < 4; i++) { const y = lerp(bb[5], bb[1], i / 4); ctx.moveTo(bb[0], y); ctx.lineTo(bb[2], y); } ctx.stroke(); });
    } else if (d.t === 'stack') {   // 煙突(先端に炎)
      const wx = d.x * ROAD_W, b = boxPts(z, wx, 0, d.w, d.h, d.w); if (!b) continue;
      drawBox(b, [200, 120, 80], a * 0.7, 'rgba(8,5,4,0.96)');
      const tp = proj(z, wx, d.h + 40, P3); if (tp && d.fl) { const r = Math.max(2, 120 * tp[2]) * (0.8 + 0.3 * Math.sin(t * 13 + d.h)); const g = ctx.createRadialGradient(tp[0], tp[1] - r * 0.5, 0, tp[0], tp[1] - r * 0.5, r * 1.5); g.addColorStop(0, 'rgba(255,240,180,0.9)'); g.addColorStop(0.4, 'rgba(255,120,30,0.6)'); g.addColorStop(1, 'rgba(255,60,0,0)'); ctx.fillStyle = g; ctx.fillRect(tp[0] - r * 1.5, tp[1] - r * 2, r * 3, r * 3); }
    } else if (d.t === 'pipe') {   // 道の上を渡る配管
      const a2 = proj(z, -ROAD_W * 1.5, 1100, P3), b1 = a2 && proj(z, ROAD_W * 1.5, 1100, P4); if (!a2 || !b1) continue; const th = Math.max(2, 90 * a2[2]);
      ctx.fillStyle = 'rgba(12,8,6,0.95)'; ctx.fillRect(a2[0], a2[1] - th, b1[0] - a2[0], th * 2); ctx.strokeStyle = rgba(d.col, a * 0.8); ctx.lineWidth = 1; ctx.strokeRect(a2[0], a2[1] - th, b1[0] - a2[0], th * 2);
      const f1 = proj(z, -ROAD_W * 1.5, 0, P3), f2 = proj(z, ROAD_W * 1.5, 0, P4); if (f1 && f2) glowLine([f1[0], f1[1], a2[0], a2[1], b1[0], b1[1], f2[0], f2[1]], [150, 110, 90], a * 0.7, 1);
    } else if (d.t === 'laser') {   // 光の柵(道の横)
      const c = proj(z, d.x * ROAD_W, 0, P3), c2 = c && proj(z + 800, d.x * ROAD_W, 0, P4); if (!c || !c2) continue; const k = c[2], k2 = c2[2];
      glowLine([c[0], c[1], c[0], c[1] - 400 * k], [120, 120, 130], a, 1);
      if (Math.sin(t * 9 + s.i) > -0.6) for (let i = 1; i <= 3; i++) glowLine([c[0], c[1] - 120 * i * k, c2[0], c2[1] - 120 * i * k2], [255, 30, 30], a * 0.9, 1.4);
    } else if (d.t === 'rig') {   // 海上の工業施設
      const wx = d.x * ROAD_W, b = boxPts(z, wx, d.h * 0.6, d.w, d.h * 0.25, d.w * 0.8); if (!b) continue;
      const l1 = proj(z, wx - d.w * 0.4, 0, P3), l2 = l1 && proj(z, wx + d.w * 0.4, 0, P4);
      if (l1 && l2) { const k1 = l1[2], k2 = l2[2]; glowLine([l1[0], l1[1], l1[0], l1[1] - d.h * 0.6 * k1], [120, 160, 170], a, 1.2); glowLine([l2[0], l2[1], l2[0], l2[1] - d.h * 0.6 * k2], [120, 160, 170], a, 1.2); }
      drawBox(b, [0, 220, 200], a * 0.8, 'rgba(2,10,14,0.96)');
      const tp = proj(z, wx, d.h * 1.3, P3); if (tp) { glowLine([tp[0], tp[1], tp[0], tp[1] + d.h * 0.45 * tp[2]], [150, 200, 210], a, 1); if (Math.sin(t * 2 + d.w) > 0) { ctx.fillStyle = rgba([255, 60, 40], a); ctx.fillRect(tp[0] - 2, tp[1] - 2, 4, 4); } }
    } else if (d.t === 'buoy') {
      const c = proj(z, d.x * ROAD_W, 0, P3); if (!c) continue; const k = c[2], on = Math.sin(t * 4 + s.i * 0.7) > 0;
      glowLine([c[0], c[1], c[0], c[1] - 90 * k], d.col, a * 0.6, 1); if (on) { ctx.fillStyle = rgba(d.col, a); ctx.fillRect(c[0] - Math.max(1.5, 10 * k), c[1] - 100 * k, Math.max(3, 20 * k), Math.max(3, 20 * k)); }
    } else if (d.t === 'panel') {   // ソーラーパネル
      const c = proj(z, d.x * ROAD_W, 0, P3), c2 = c && proj(z + 300, d.x * ROAD_W, 260, P4); if (!c || !c2) continue; const w = d.w * c[2], w2 = d.w * c2[2];
      fillQuad(c[0] - w / 2, c[1], c[0] + w / 2, c[1], c2[0] + w2 / 2, c2[1], c2[0] - w2 / 2, c2[1], 'rgba(20,40,90,0.9)');
      ctx.strokeStyle = rgba([255, 200, 120], a * 0.7); ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(c[0] - w / 2, c[1]); ctx.lineTo(c[0] + w / 2, c[1]); ctx.lineTo(c2[0] + w2 / 2, c2[1]); ctx.lineTo(c2[0] - w2 / 2, c2[1]); ctx.closePath(); ctx.moveTo(c[0], c[1]); ctx.lineTo(c2[0], c2[1]); ctx.stroke();
    } else if (d.t === 'hex') {   // 地面の六角形
      const c = proj(z, d.x * ROAD_W, 2, P3); if (!c) continue; const r = d.r * c[2], pts = []; for (let i = 0; i < 6; i++) { const an = i * Math.PI / 3; pts.push(c[0] + Math.cos(an) * r, c[1] + Math.sin(an) * r * 0.25); }
      glowLine(pts, [120, 255, 200], a * 0.6, 1, true);
    } else if (d.t === 'cloud') {   // 雲海(道より下)
      const c = proj(z, d.x * ROAD_W, d.y, P3); if (!c) continue; const r = d.r * c[2];
      ctx.fillStyle = 'rgba(240,245,255,0.55)'; ctx.beginPath(); ctx.ellipse(c[0], c[1], r * 1.6, r * 0.5, 0, 0, Math.PI * 2); ctx.fill();
    }
  }
}
