'use strict';
// RALLY X SURVIVORS ― 止まれない車で敵を引き連れ、煙幕でスピンさせ、玉突きで焼く(設計: 資料\面白さ設計_2026-10-04.md)
const VW = 960, VH = 540, T = 40, CELLS = 17, GW = CELLS * 3 + 1, GH = GW;
const WORLD = GW * T;
const cv = document.getElementById('c'), ctx = cv.getContext('2d');
const HASH = new URLSearchParams(location.hash.replace(/^#/, '').replace(/&/g, '&'));
let DEMO = HASH.has('bot'), demoIdle = 0; const BOT = HASH.has('bot'), FF = +(HASH.get('ff') || 0), DEV = HASH.has('dev');
let view = { s: 1, ox: 0, oy: 0 };
function resize() {
  const dpr = devicePixelRatio || 1;
  cv.width = innerWidth * dpr; cv.height = innerHeight * dpr;
  cv.style.width = innerWidth + 'px'; cv.style.height = innerHeight + 'px';
  const s = Math.min(cv.width / VW, cv.height / VH);
  view = { s, ox: (cv.width - VW * s) / 2, oy: (cv.height - VH * s) / 2 };
}
addEventListener('resize', resize); resize();

// ---- 乱数(テスト再現用に#seed=) ----
let seed = +(HASH.get('seed') || (Math.random() * 1e9 | 0)) >>> 0;
function rnd() { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; }
const ri = n => (rnd() * n) | 0, rr = (a, b) => a + rnd() * (b - a);

// ---- 音(最小。最初の入力後に鳴る) ----
let AC = null;
function sfx(f, d, type = 'square', v = 0.05, f2 = 0, delay = 0) {
  try {
    if (!AC) return;
    const o = AC.createOscillator(), g = AC.createGain(), t = AC.currentTime + delay;
    o.type = type; o.frequency.setValueAtTime(f, t);
    if (f2) o.frequency.exponentialRampToValueAtTime(f2, t + d);
    g.gain.setValueAtTime(v, t); g.gain.exponentialRampToValueAtTime(0.0001, t + d);
    o.connect(g); g.connect(AC.destination); o.start(t); o.stop(t + d);
  } catch (e) { }
}
function initAudio() { if (!AC) { try { AC = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { } } if (AC && AC.state === 'suspended') AC.resume(); if (AC && typeof bgmInit === 'function') bgmInit(); }

// ---- スプライト ----
const SP = {
  blue: carSprite('blue'), red: carSprite('red'), yellow: carSprite('yellow'),
  green: carSprite('green'), purple: carSprite('purple'),
  gemS: makeSprite([".yy.", "yYWy", "yYYy", ".yy."], { y: '#ffd400', Y: '#fff07a', W: '#fff' }),
  gemL: makeSprite(GEM, COMMON), flagS: makeSprite(FLAG_S, COMMON), flagY: makeSprite(FLAG_Y, COMMON),
  fuel: makeSprite(FUEL, COMMON), rock: makeSprite(ROCK, { ...COMMON, ...PAL2 }), crab: makeSprite(CRAB, COMMON),
  lance: makeSprite(["...Y.", "YYYYY", "YYYYY", "...Y."], COMMON),
};
// 長いリムジン(紫)は中ほどの行を増やして作る
{
  const rows = CAR.slice(0, 12).concat(Array(6).fill(CAR[12]), CAR.slice(12));
  SP.limo = makeSprite(rows, { ...COMMON, ...BODY.purple });
}
// 演出の道具: 光のテクスチャ(色ごとに1回だけ作る)と、スプライトの白抜き(被弾・撃破の白い光)
const GLOW = {};
function glowTex(c) {
  if (GLOW[c]) return GLOW[c];
  const t = document.createElement('canvas'); t.width = t.height = 64; const g = t.getContext('2d');
  const n = parseInt(c.slice(1), 16), r = n >> 16, gg = (n >> 8) & 255, b = n & 255, gr = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  gr.addColorStop(0, `rgba(${r},${gg},${b},1)`); gr.addColorStop(.35, `rgba(${r},${gg},${b},.45)`); gr.addColorStop(1, `rgba(${r},${gg},${b},0)`);
  g.fillStyle = gr; g.fillRect(0, 0, 64, 64); return GLOW[c] = t;
}
function glow(x, y, r, c, a) { ctx.globalAlpha = a; ctx.drawImage(glowTex(c), x - r, y - r, r * 2, r * 2); }
function whiteOf(s) {
  if (!s._w) { const c = document.createElement('canvas'); c.width = s.width; c.height = s.height; const g = c.getContext('2d'); g.drawImage(s, 0, 0); g.globalCompositeOperation = 'source-in'; g.fillStyle = '#fff'; g.fillRect(0, 0, c.width, c.height); s._w = c; }
  return s._w;
}
function drawSprite(s, x, y, ang, sc, alpha) {
  ctx.save(); ctx.translate(x | 0, y | 0); if (ang) ctx.rotate(ang);
  if (alpha != null) ctx.globalAlpha = alpha;
  ctx.drawImage(s, -s.width * sc / 2, -s.height * sc / 2, s.width * sc, s.height * sc); ctx.restore();
}

// ---- 迷路 ----
let grid, mapCv, wallCv;
const solid = (tx, ty) => tx < 0 || ty < 0 || tx >= GW || ty >= GH || grid[ty * GW + tx] === 1;
function genMaze(stage = 1) {
  activeField = fieldForStage(stage);
  grid = new Uint8Array(GW * GH).fill(1);
  const carve = (x0, y0, x1, y1) => { for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) grid[y * GW + x] = 0; };
  const seen = new Uint8Array(CELLS * CELLS), st = [[ri(CELLS), ri(CELLS)]];
  seen[st[0][1] * CELLS + st[0][0]] = 1;
  const link = (a, b, c, d) => { // セル(a,b)と(c,d)をつなぐ
    const x0 = 1 + 3 * Math.min(a, c), y0 = 1 + 3 * Math.min(b, d);
    if (a !== c) carve(x0, y0, x0 + 3, y0 + 1); else carve(x0, y0, x0 + 1, y0 + 3);
  };
  const D = [[1, 0], [-1, 0], [0, 1], [0, -1]];
  while (st.length) {
    const [cx, cy] = st[st.length - 1]; carve(1 + 3 * cx, 1 + 3 * cy, 2 + 3 * cx, 2 + 3 * cy);
    const nb = D.map(d => [cx + d[0], cy + d[1]]).filter(([x, y]) => x >= 0 && y >= 0 && x < CELLS && y < CELLS && !seen[y * CELLS + x]);
    if (!nb.length) { st.pop(); continue; }
    const [nx, ny] = nb[ri(nb.length)]; seen[ny * CELLS + nx] = 1; link(cx, cy, nx, ny); st.push([nx, ny]);
  }
  for (let i = 0; i < CELLS * CELLS * activeField.loops; i++) { // 輪の密度は区画ごとに違う
    const cx = ri(CELLS - 1), cy = ri(CELLS - 1);
    if (rnd() < 0.5) link(cx, cy, cx + 1, cy); else link(cx, cy, cx, cy + 1);
  }
  for (let i = 0; i < activeField.plazas; i++) { const cx = ri(CELLS - 1), cy = ri(CELLS - 1); carve(1 + 3 * cx, 1 + 3 * cy, 5 + 3 * cx, 5 + 3 * cy); } // 広場
  // 描画済み背景
  wallCv = document.createElement('canvas'); wallCv.width = wallCv.height = WORLD;
  const g = wallCv.getContext('2d');
  g.fillStyle = activeField.floor; g.fillRect(0, 0, WORLD, WORLD);
  g.strokeStyle = activeField.grid; g.globalAlpha = .13; g.lineWidth = 1;
  for (let i = 0; i <= GW; i++) { g.beginPath(); g.moveTo(i * T + .5, 0); g.lineTo(i * T + .5, WORLD); g.moveTo(0, i * T + .5); g.lineTo(WORLD, i * T + .5); g.stroke(); }
  g.globalAlpha = 1;
  for (let ty = 0; ty < GH; ty++) for (let tx = 0; tx < GW; tx++) if (grid[ty * GW + tx] === 1) paintWall(g, tx, ty); else fieldFloor(g, tx, ty);
  mapCv = document.createElement('canvas'); mapCv.width = GW; mapCv.height = GH;
  const m = mapCv.getContext('2d'); m.fillStyle = '#03040c'; m.fillRect(0, 0, GW, GH);
  for (let i = 0; i < GW * GH; i++) if (grid[i] === 1) { m.fillStyle = activeField.map; m.fillRect(i % GW, (i / GW) | 0, 1, 1); }
}
function paintTile(tx, ty, rubble) { // 1マスを描き直す(rubble=砕かれた跡)
  if (tx < 0 || ty < 0 || tx >= GW || ty >= GH) return;
  const g = wallCv.getContext('2d'), x = tx * T, y = ty * T;
  fieldFloor(g, tx, ty);
  if (grid[ty * GW + tx] === 1) paintWall(g, tx, ty);
  else if (rubble) { g.fillStyle = activeField.rubble; for (let k = 0; k < 7; k++) g.fillRect(x + ri(T - 6), y + ri(T - 6), 3 + ri(4), 3 + ri(4)); }
  const m = mapCv.getContext('2d'); m.fillStyle = grid[ty * GW + tx] === 1 ? activeField.map : '#03040c'; m.fillRect(tx, ty, 1, 1);
}
function paintWall(g, tx, ty) {
  {
    const x = tx * T, y = ty * T;
    g.fillStyle = activeField.wall; g.fillRect(x, y, T, T);
    g.fillStyle = activeField.face; g.fillRect(x + 4, y + 4, T - 8, T - 8);
    g.fillStyle = activeField.core; g.fillRect(x + 8, y + 8, T - 16, T - 16);
    const e = (dx, dy, rx, ry, w, h) => { if (!solid(tx + dx, ty + dy)) { g.fillStyle = activeField.edge; g.fillRect(x + rx, y + ry, w, h); g.fillStyle = activeField.shine; g.fillRect(x + rx + (w > h ? 0 : (dx > 0 ? 0 : 1)), y + ry + (h > w ? 0 : (dy > 0 ? 0 : 1)), w > h ? w : 1, h > w ? h : 1); } };
    e(0, -1, 0, 0, T, 3); e(0, 1, 0, T - 3, T, 3); e(-1, 0, 0, 0, 3, T); e(1, 0, T - 3, 0, 3, T);
  }
}
function blockedAt(x, y, r) {
  return solid(Math.floor((x - r) / T), Math.floor((y - r) / T)) || solid(Math.floor((x + r) / T), Math.floor((y - r) / T)) ||
    solid(Math.floor((x - r) / T), Math.floor((y + r) / T)) || solid(Math.floor((x + r) / T), Math.floor((y + r) / T));
}
function moveBody(e, dx, dy, r) {
  if (!blockedAt(e.x + dx, e.y, r)) e.x += dx;
  if (!blockedAt(e.x, e.y + dy, r)) e.y += dy;
}
function lineClear(x1, y1, x2, y2) {
  const d = Math.hypot(x2 - x1, y2 - y1), n = Math.ceil(d / 14);
  for (let i = 1; i < n; i++) { const t = i / n; if (blockedAt(x1 + (x2 - x1) * t, y1 + (y2 - y1) * t, 15)) return false; }
  return true;
}
function bfs(tx, ty) {
  const dist = new Int16Array(GW * GH).fill(-1), q = new Int32Array(GW * GH); let h = 0, t = 0;
  if (solid(tx, ty)) return dist;
  dist[ty * GW + tx] = 0; q[t++] = ty * GW + tx;
  while (h < t) {
    const i = q[h++], x = i % GW, y = (i / GW) | 0, d = dist[i] + 1;
    if (x > 0 && grid[i - 1] === 0 && dist[i - 1] < 0) { dist[i - 1] = d; q[t++] = i - 1; }
    if (x < GW - 1 && grid[i + 1] === 0 && dist[i + 1] < 0) { dist[i + 1] = d; q[t++] = i + 1; }
    if (y > 0 && grid[i - GW] === 0 && dist[i - GW] < 0) { dist[i - GW] = d; q[t++] = i - GW; }
    if (y < GH - 1 && grid[i + GW] === 0 && dist[i + GW] < 0) { dist[i + GW] = d; q[t++] = i + GW; }
  }
  return dist;
}
function randFloor(minD, from) {
  for (let k = 0; k < 400; k++) {
    const tx = ri(GW), ty = ri(GH); if (solid(tx, ty)) continue;
    const x = (tx + .5) * T, y = (ty + .5) * T;
    if (!from || Math.hypot(x - from.x, y - from.y) >= minD) return { x, y };
  }
  return { x: 1.5 * T, y: 1.5 * T };
}

// ---- ラリー式の運転(車は通路の中心線の上を走る。交差点=セルの中心。止まれない) ----
const L = k => (3 * k + 2) * T, cellOf = v => (v / T - 2) / 3;
const DIRS = [{ x: 1, y: 0 }, { x: -1, y: 0 }, { x: 0, y: 1 }, { x: 0, y: -1 }];
function openDir(cx, cy, d) {
  const nx = cx + d.x, ny = cy + d.y; if (nx < 0 || ny < 0 || nx >= CELLS || ny >= CELLS) return false;
  if (d.x === 1) return !solid(3 * cx + 3, 3 * cy + 1); if (d.x === -1) return !solid(3 * cx, 3 * cy + 1);
  if (d.y === 1) return !solid(3 * cx + 1, 3 * cy + 3); return !solid(3 * cx + 1, 3 * cy);
}
function randNode(minD, from, avoid) {
  for (let k = 0; k < 400; k++) {
    const x = L(ri(CELLS)), y = L(ri(CELLS));
    if (from && Math.hypot(x - from.x, y - from.y) < minD) continue;
    if (avoid && avoid.some(a => a.x === x && a.y === y)) continue;
    return { x, y };
  }
  return { x: L(0), y: L(0) };
}
function snapNode(x, y) { const c = v => Math.max(0, Math.min(CELLS - 1, Math.round(cellOf(v)))); return { x: L(c(x)), y: L(c(y)) }; }
function drive(p, dist) {
  for (let it = 0; it < 6 && dist > 1e-6; it++) {
    if (p.want && p.want.x === -p.dir.x && p.want.y === -p.dir.y) { p.dir = p.want; p.want = null; } // 反転はいつでも
    const fx = cellOf(p.x), fy = cellOf(p.y), rx = Math.round(fx), ry = Math.round(fy);
    if (Math.abs(fx - rx) < 1e-4 && Math.abs(fy - ry) < 1e-4) { // 交差点
      p.x = L(rx); p.y = L(ry);
      if (p.want && openDir(rx, ry, p.want)) { p.dir = p.want; p.want = null; }
      else if (!openDir(rx, ry, p.dir)) { // 突き当たりは自動で曲がる
        const side = [{ x: p.dir.y, y: p.dir.x }, { x: -p.dir.y, y: -p.dir.x }].filter(d => openDir(rx, ry, d));
        if (side.length === 2) p.dir = p.want ? (side[0].x * p.want.x + side[0].y * p.want.y >= side[1].x * p.want.x + side[1].y * p.want.y ? side[0] : side[1]) : side[ri(2)];
        else if (side.length === 1) p.dir = side[0];
        else p.dir = { x: -p.dir.x, y: -p.dir.y };
        if (!openDir(rx, ry, p.dir)) return;
      }
    }
    const hz = p.dir.x !== 0, pos = hz ? p.x : p.y, sg = hz ? p.dir.x : p.dir.y, f = cellOf(pos);
    const k = sg > 0 ? Math.floor(f + 1e-4) + 1 : Math.ceil(f - 1e-4) - 1, tgt = L(k), d = Math.abs(tgt - pos), mv = Math.min(dist, d);
    if (hz) p.x = mv >= d - 1e-6 ? tgt : p.x + sg * mv; else p.y = mv >= d - 1e-6 ? tgt : p.y + sg * mv;
    dist -= mv;
  }
}

// ---- 状態 ----
let state = 'title', G;
const KEYS = {};
const INFL = 250; // このレベルからインフレ(攻撃力・連射が急に伸び、武器の上限がLv10に)
const pw = () => (1 + .004 * Math.min(G.level, INFL) + (G.level > INFL ? .05 * (G.level - INFL) : 0)) * (1 + .05 * lv('power') + skillStat('damage'));
const cdMul = () => (G.level > INFL ? 1 + .02 * (G.level - INFL) : 1) * (1 + skillStat('rate'));
const WEAPONS = {
  lance: { name: 'フラッグ・ランス', desc: lv => `旗の槍を連射。${lv < 1 ? '' : ''}数が増え、Lv3から貫通` },
  mine: { name: 'ロック・マイン', desc: () => '後ろに岩を置く。敵が触れると爆発' },
  radar: { name: 'レーダー・スイーパー', desc: () => '回る走査線。触れた敵を弾き飛ばす' },
  speed: { name: 'スピードアップ', desc: () => '移動速度+6%', passive: 1 },
  antenna: { name: '広域アンテナ', desc: () => '宝石を引き寄せる範囲が広がる', passive: 1 },
  fuel: { name: 'ハイオク燃料', desc: () => '燃料の量と煙幕の持続が伸びる', passive: 1 },
  hpup: { name: '装甲強化', desc: () => '最大HP+10、HPを30回復', passive: 1, filler: 1 },
  power: { name: 'オーバークロック', desc: () => '全ての攻撃力+5%', passive: 1, filler: 1 },
  ...EXTRA_SKILLS,
};
const maxLv = k => WEAPONS[k].filler ? 999 : (G.level >= INFL ? 10 : 5);
function newGame() {
  genMaze(1);
  const p0 = randNode(0);
  G = {
    t: 0, stage: 1, score: 0, kills: 0, level: 1, xp: 0, need: 4, fever: 0, flags: 0, shake: 0, shakeA: 5, log: [], msg: '', msgT: 0,
    chain: 0, chainT: 0, best: 0, crashes: 0, pops: [], freeze: 0, lastPop: -9, lastKillSfx: -9,
    parts: [], nums: [], ghosts: [], flash: null, rocks: [], xpGlow: 0, chainBump: 0, luAt: 0,
    p: { x: p0.x, y: p0.y, hp: 100, maxhp: 100, fuel: 100, ang: -Math.PI / 2, tang: -Math.PI / 2, inv: 0, dir: { x: 0, y: -1 }, want: null, wantT: 0, smokeCD: 0, brake: 100, braking: false, lane: -16, lx: -16, ly: 0, cx: p0.x - 16, cy: p0.y },
    boss: null, bossWarn: 0, clearT: 0, hunter:null, camp:{x:p0.x,y:p0.y,t:0},
    w: { lance: 1 }, enemies: [], gems: [], items: [], shots: [], mines: [], puffs: [], fx: [], flagsList: [], acc: 0, spawnAcc: 0,
    wt: { lance: 0, mine: 1, radar: 0 }, sweep: 0, dist: null, dtile: -1, sFlag: null, sTimer: 40, opts: [], sel: 0, deadAt: 0, botPath: null, botTgt: null,
  };
  buildBuckets(); placeFlags(); say(['> 観測サイクル 第48,201回 を開始。', '> 煙幕で赤性プログラムをスピンさせ、玉突き事故を起こせ。', '> 旗(コード断片)を10本集め、次の階層へ。']);
}
function placeFlags() {
  G.flagsList = []; G.flags = 0;
  for (let i = 0; i < 10; i++) G.flagsList.push({ ...randNode(500, G.p, G.flagsList), s: false });
  placeRocks();
}
function placeRocks() {
  G.rocks = []; const n = 14 + 4 * G.stage;
  for (let k = 0; k < 400 && G.rocks.length < n; k++) {
    const cx = ri(CELLS), cy = ri(CELLS), d = DIRS[ri(4)]; if (!openDir(cx, cy, d)) continue;
    const mx = (L(cx) + L(cx + d.x)) / 2, my = (L(cy) + L(cy + d.y)) / 2, lane = rnd() < .5 ? -16 : 16;
    const x = mx + (d.y ? lane : 0), y = my + (d.x ? lane : 0);
    if (Math.hypot(x - G.p.x, y - G.p.y) < 300 || G.rocks.some(r => Math.hypot(r.x - x, r.y - y) < 60)) continue;
    G.rocks.push({ x, y, rot: rnd() * 6 });
  }
}
function say(lines) { G.log = lines; G.msgT = 5; }
function dropGem(x, y, big, mult) { if (G.gems.length > 500) G.gems.shift(); G.gems.push({ x, y, v: (big ? 5 : 1) * (mult || 1), big, mag: false }); }
function pop(x, y, s, c, size) { G.pops.push({ x, y, s, c, size, l: 1.1 }); }
const chainMult = () => 1 + Math.min(1, G.chain / 50);

// ---- 敵 ----
const ETYPES = {
  red: { sp: 'red', hp: 12, spd: 150, dmg: 8, xp: 0.06, sc: 3 },
  yellow: { sp: 'yellow', hp: 8, spd: 235, dmg: 11, xp: 0.1, sc: 3, kami: true },
  green: { sp: 'green', hp: 45, spd: 105, dmg: 13, xp: 1, sc: 2, big: true },
  purple: { sp: 'limo', hp: 24, spd: 140, dmg: 9, xp: 0.5, sc: 2, long: true },
};
function spawnEnemy(pos0, type0) {
  let pos = pos0 || null;
  for (let k = 0; k < 40 && !pos; k++) { const n = randNode(0), d = Math.hypot(n.x - G.p.x, n.y - G.p.y); if (d >= 520 && d <= 950) { pos = n; break; } }
  if (!pos) return;
  const cx = Math.round(cellOf(pos.x)), cy = Math.round(cellOf(pos.y)), outs = DIRS.filter(d => openDir(cx, cy, d));
  const t0 = G.t; let type = 'red', r = rnd();
  if (t0 > 12 && r < .25) type = 'yellow';
  if (t0 > 55 && r > .78) type = 'green';
  if (t0 > 85 && r > .66 && r <= .78) type = 'purple';
  if (type0) type = type0;
  const T0 = ETYPES[type], hpm = 1 + t0 / 100 + (t0 / 240) ** 2 + (G.stage - 1) * .15;
  G.enemies.push({
    x: pos.x, y: pos.y, r: { x: pos.x, y: pos.y, dir: outs[ri(outs.length)] || DIRS[0], want: null }, lane: rnd() < .5 ? -16 : 16, lx: 0, ly: 0, ox: 0, oy: 0, node: -1,
    type, hp: T0.hp * hpm, maxhp: T0.hp * hpm, ang: 0, vx: 0, vy: 0, flash: 0, swT: 0, spin: 0, gen: 0, imm: 0, crashCD: 0,
  });
}
function enemySteer(e) { // 次の交差点で、自機までの道のりが一番短い方へ曲がる(Uターンはしない。12%は気まぐれ)
  const r = e.r, fx = cellOf(r.x), fy = cellOf(r.y);
  let nx = Math.round(fx), ny = Math.round(fy);
  if (Math.abs(fx - nx) > 1e-4 || Math.abs(fy - ny) > 1e-4) { if (r.dir.x) nx = r.dir.x > 0 ? Math.floor(fx + 1e-4) + 1 : Math.ceil(fx - 1e-4) - 1; else ny = r.dir.y > 0 ? Math.floor(fy + 1e-4) + 1 : Math.ceil(fy - 1e-4) - 1; }
  nx = Math.max(0, Math.min(CELLS - 1, nx)); ny = Math.max(0, Math.min(CELLS - 1, ny));
  if (e.node === ny * CELLS + nx) return; e.node = ny * CELLS + nx;
  const outs = DIRS.filter(d => openDir(nx, ny, d) && !(d.x === -r.dir.x && d.y === -r.dir.y));
  let best = null, bv = 1e9;
  for (const d of outs) { const v = G.dist[(3 * (ny + d.y) + 1) * GW + 3 * (nx + d.x) + 1], vv = v < 0 ? 1e8 : v; if (vv < bv) { bv = vv; best = d; } }
  if (outs.length > 1 && rnd() < .12) best = outs[ri(outs.length)];
  r.want = best;
}
function killEnemy(e, i) {
  const T0 = ETYPES[e.type]; G.kills++;
  // 連鎖: 煙幕・玉突き・体当たり・S旗で2秒以内に倒し続けると、経験値とスコアが最大2倍
  if (e.src && e.src !== 'wpn') { G.chain++; G.chainT = 2.0; G.chainBump = .15; if (G.chain > G.best) G.best = G.chain; }
  const cm = chainMult(); G.score += Math.round(10 * cm * (G.fever > 0 ? 2 : 1));
  if (e.src && e.src !== 'wpn' && G.chain % 50 === 0) { pop(G.p.x, G.p.y - 50, `${G.chain} CHAIN!`, '#ff8cff', 24); sfx(660, .25, 'square', .05, 1320); }
  if (G.t - G.lastKillSfx > .045) { G.lastKillSfx = G.t; sfx(240 + Math.min(G.chain, 150) * 6, .05, 'square', .025); }
  dropGem(e.x, e.y, T0.big || rnd() < .06, cm);
  if (rnd() < .008) G.items.push({ x: e.x, y: e.y, k: 'fuel' });
  else if (rnd() < .01) G.items.push({ x: e.x, y: e.y, k: 'crab' });
  else if (!G.sFlag && rnd() < .012) G.sFlag = snapNode(e.x, e.y);
  if (G.ghosts.length < 160) G.ghosts.push({ x: e.x, y: e.y, ang: e.ang, spr: SP[T0.sp], sc: T0.sc, l: .25, m: .25 });
  burst(e.x, e.y, ECOL[e.type], 7, 230, 'shard'); burst(e.x, e.y, '#ffffff', 4, 340, 'spark'); glowFx(e.x, e.y, 46, ECOL[e.type], .25);
  e.dead = true;
}
function burst(x, y, col, n, spd, k) {
  for (let i = 0; i < n && G.parts.length < 1500; i++) { const a = rnd() * 6.283, v = spd * (.3 + rnd() * .9), l = rr(.25, .6); G.parts.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, l, m: l, c: col, k, s: rr(2, 4.5) }); }
}
function glowFx(x, y, r, col, l) { if (G.parts.length < 1500) G.parts.push({ x, y, vx: 0, vy: 0, l, m: l, c: col, k: 'glow', r }); }
function ring(x, y, r, l, c, w) { G.fx.push({ x, y, r, l, m: l, c: c || '#ffb43c', w: w || 4, k: 'ring' }); }
function flash(a, c) { if (!G.flash || G.flash.a < a) G.flash = { a, c: c || '#ffffff' }; }
function boom(x, y, col, n) { burst(x, y, col, n, 200, 'shard'); burst(x, y, '#ffffff', n >> 1, 300, 'spark'); }
const ECOL = { red: '#ff4a4a', yellow: '#ffd400', green: '#3fdf5f', purple: '#c070ff' };

// ---- 更新 ----
let grid2 = [];
function buildBuckets() {
  if (grid2.length !== GW * GH) grid2 = Array.from({ length: GW * GH }, () => []);
  for (const b of grid2) b.length = 0;
  G.enemies.forEach((e, i) => { const tx = Math.min(GW - 1, Math.max(0, e.x / T | 0)), ty = Math.min(GH - 1, Math.max(0, e.y / T | 0)); grid2[ty * GW + tx].push(i); });
}
function near(x, y, r, cb) {
  const x0 = Math.max(0, (x - r) / T | 0), x1 = Math.min(GW - 1, (x + r) / T | 0), y0 = Math.max(0, (y - r) / T | 0), y1 = Math.min(GH - 1, (y + r) / T | 0);
  for (let ty = y0; ty <= y1; ty++) for (let tx = x0; tx <= x1; tx++) for (const i of grid2[ty * GW + tx]) { const e = G.enemies[i]; if (e && !e.dead) cb(e, i); }
}
function nearest(x, y, r) {
  let best = null, bd = r * r;
  near(x, y, r, e => { const d = (e.x - x) ** 2 + (e.y - y) ** 2; if (d < bd) { bd = d; best = e; } });
  return best;
}
function hurt(e, dmg, kx, ky, kb, src) {
  if (dmg < 9000) dmg *= pw();
  e.hp -= dmg; e.flash = .1; e.vx += kx * kb; e.vy += ky * kb; e.src = src || 'wpn';
  if (e.num && e.num.l > .45) e.num.v += dmg;
  else if (G.nums.length < 180) { e.num = { x: e.x + rr(-8, 8), y: e.y - 20, v: dmg, l: .75 }; G.nums.push(e.num); }
}
function lv(k) { return G.w[k] || 0; }
function input() {
  let dx = 0, dy = 0, smoke = false, brake = false;
  if (KEYS.ArrowLeft || KEYS.a) dx--; if (KEYS.ArrowRight || KEYS.d) dx++;
  if (KEYS.ArrowUp || KEYS.w) dy--; if (KEYS.ArrowDown || KEYS.s) dy++;
  if (KEYS[' '] || KEYS.Shift || KEYS.z) smoke = true;
  if (KEYS.x || KEYS.c || KEYS.Control) brake = true;
  const gp = navigator.getGamepads ? navigator.getGamepads()[0] : null;
  if (gp) { if (Math.abs(gp.axes[0]) > .3) dx += gp.axes[0]; if (Math.abs(gp.axes[1]) > .3) dy += gp.axes[1]; if (gp.buttons[0] && gp.buttons[0].pressed) smoke = true; if (gp.buttons[1] && gp.buttons[1].pressed) brake = true; }
  if (touch.on) { dx += touch.dx; dy += touch.dy; }
  if (touch.smoke) smoke = true;
  if (touch.brake) brake = true;
  return { dx, dy, smoke, brake };
}
function botInput() {
  const p = G.p; let tgt = null, bd = 1e9;
  if (!G.dist) { G.dist = bfs(p.x / T | 0, p.y / T | 0); G.dtile = (p.y / T | 0) * GW + (p.x / T | 0); }
  // 画面内の敵の数(S旗は敵を集めてから取る=密集ボーナス狙い)
  let onscr = 0; for (const e of G.enemies) if (Math.abs(e.x - p.x) < VW / 2 && Math.abs(e.y - p.y) < VH / 2) onscr++;
  // 一度S旗を狙うと決めたら、取るまで変えない(敵の数が境目で上下しても迷わない)
  if (G.sFlag && G.fever <= 0 && (onscr >= 22 || p.hp < 35)) G.botS = G.sFlag;
  if (G.botS && G.botS !== G.sFlag) G.botS = null;
  const cand = G.flagsList.slice(); if (G.botS) cand.push(G.botS);
  for (const f of cand) { const d = G.dist[(f.y / T | 0) * GW + (f.x / T | 0)]; const dd = (d < 0 ? 9999 : d) - (f === G.sFlag ? 30 : 0); if (dd < bd) { bd = dd; tgt = f; } }
  // 最後の1本は、レベルが足りないうちは取らずに走り回って経験値を稼ぐ(次の階層は敵が強いため)
  if (tgt && G.flagsList.length === 1 && tgt === G.flagsList[0] && G.level < 6 + 5 * G.stage) {
    if (!G.wander || G.t > G.wanderT || Math.hypot(G.wander.x - p.x, G.wander.y - p.y) < 50) { G.wander = randNode(350, p); G.wanderT = G.t + 10; }
    tgt = G.wander;
  }
  if ((G.boss || G.bossWarn > 0 || G.clearT > 0) && tgt !== G.botS) {
    const b = G.boss;
    if (!G.wander || G.t > G.wanderT || Math.hypot(G.wander.x - p.x, G.wander.y - p.y) < 60 || (b && Math.hypot(G.wander.x - b.x, G.wander.y - b.y) < 200)) {
      // ボスから220〜420pxの輪の上で、自機に近い交差点へ(射程に入れつつ、ぶつからない)
      let best = null;
      for (let k = 0; k < 40; k++) { const n = randNode(80, p), d = b ? Math.hypot(n.x - b.x, n.y - b.y) : 300, sc = (d < 220 || d > 420 ? 2000 : 0) + Math.hypot(n.x - p.x, n.y - p.y); if (!best || sc < best.sc) best = { x: n.x, y: n.y, sc }; }
      G.wander = { x: best.x, y: best.y }; G.wanderT = G.t + 2.5;
    }
    tgt = G.wander;
  }
  if (!tgt) return { dx: 0, dy: 0, smoke: false };
  if (G.botTgt !== tgt) { G.botTgt = tgt; G.botPath = bfs(tgt.x / T | 0, tgt.y / T | 0); }
  // 次に着く交差点で、どちらへ曲がるか: 目的地までの距離+その先の敵の多さ
  const fx = cellOf(p.x), fy = cellOf(p.y), at = Math.abs(fx - Math.round(fx)) < 1e-4 && Math.abs(fy - Math.round(fy)) < 1e-4;
  let nx = Math.round(fx), ny = Math.round(fy);
  if (!at) { if (p.dir.x) nx = p.dir.x > 0 ? Math.floor(fx + 1e-4) + 1 : Math.ceil(fx - 1e-4) - 1; else ny = p.dir.y > 0 ? Math.floor(fy + 1e-4) + 1 : Math.ceil(fy - 1e-4) - 1; }
  nx = Math.max(0, Math.min(CELLS - 1, nx)); ny = Math.max(0, Math.min(CELLS - 1, ny));
  G.botChk = (G.botChk || 0) + 1 / 60; if (G.botBrave > 0) G.botBrave -= 1 / 60;
  if (G.botChk >= 2) { G.botChk = 0; const still = G.botLp && Math.hypot(p.x - G.botLp.x, p.y - G.botLp.y) < 80; G.botStill = still ? (G.botStill || 0) + 1 : 0; if (G.botStill >= 2) { G.botBrave = 2; G.botStill = 0; } G.botLp = { x: p.x, y: p.y }; }
  const brave = G.botBrave > 0;
  const danger = (x, y, r) => {
    let c = 0; if (G.boss && G.boss.parts) for (const q of G.boss.parts) if ((q.x - x) ** 2 + (q.y - y) ** 2 < (r + 70) ** 2) c += 8;
    if (brave) return c; near(x, y, r, e => { if (e.spin <= 0 && (e.x - x) ** 2 + (e.y - y) ** 2 < r * r) c++; }); return c;
  };
  let best = null, bc = 1e9, rev = null;
  for (const d of DIRS) {
    if (!openDir(nx, ny, d)) continue;
    if (d.x === -p.dir.x && d.y === -p.dir.y) { rev = d; continue; }
    const mx = nx + d.x, my = ny + d.y; let pc = G.botPath[(3 * my + 1) * GW + 3 * mx + 1]; if (pc < 0) pc = 999;
    const deg = DIRS.filter(q => openDir(mx, my, q)).length, goal = Math.abs(L(mx) - tgt.x) < 2 && Math.abs(L(my) - tgt.y) < 2;
    const c = pc + (deg === 1 && !goal ? 25 : 0) + Math.min(30, danger(L(mx), L(my), 130) * 2 + danger((L(nx) + L(mx)) / 2, (L(ny) + L(my)) / 2, 80) * 2);
    if (c < bc) { bc = c; best = d; }
  }
  if (!best) best = at ? rev : null;
  // 目の前に敵の群れ → 反転(1.2秒に1回まで)
  let ahead = 0, close = 0;
  near(p.x, p.y, 200, e => { if (e.spin > 0) return; const dx = e.x - p.x, dy = e.y - p.y, d = Math.hypot(dx, dy); if (d < 150) close++; if (d < 190 && dx * p.dir.x + dy * p.dir.y > d * .75) ahead++; });
  G.botRevCD = (G.botRevCD || 0) - 1 / 60;
  let want = best;
  if (!brave && ahead >= 2 && G.botRevCD <= 0 && G.fever <= 0) { want = { x: -p.dir.x, y: -p.dir.y }; G.botRevCD = 1.2; }
  // 車線: 前方260pxの敵が少ない側へ
  let neg = 0, pos = 0;
  near(p.x, p.y, 260, e => { if (e.spin > 0) return; const dx = e.x - p.x, dy = e.y - p.y, al = dx * p.dir.x + dy * p.dir.y; if (al < 0 || al > 260) return; const off = -dx * p.dir.y + dy * p.dir.x; if (Math.abs(off) > 40) return; if (off < 0) neg++; else pos++; });
  for (const r of G.rocks) { const dx = r.x - p.x, dy = r.y - p.y, al = dx * p.dir.x + dy * p.dir.y; if (al < 0 || al > 260) continue; const off = -dx * p.dir.y + dy * p.dir.x; if (Math.abs(off) > 30) continue; if (off < 0) neg += 4; else pos += 4; }
  const lane = neg < pos ? -16 : pos < neg ? 16 : p.lane;
  const bossNear = G.boss && G.boss.parts && G.boss.parts.some(q => Math.hypot(q.x - p.x, q.y - p.y) < 260);
  return { dx: want ? want.x : 0, dy: want ? want.y : 0, lane, smoke: (close > 2 || brave || bossNear) && (p.fuel > 8 || G.fever > 0) };
}
function step(dt) {
  G.t += dt; G.chk = (G.chk || 0) + dt; if (G.chk >= 2) { G.chk = 0; const m = G.lp ? Math.hypot(G.p.x - G.lp.x, G.p.y - G.lp.y) : 999; if (m < 40 && G.lp && !G.p.hitStuckIgnore) { G.stk = (G.stk || 0) + 1; if (HASH.has('dbg')) console.log('STUCK ' + JSON.stringify({ t: +G.t.toFixed(1), x: G.p.x | 0, y: G.p.y | 0, tgt: G.botTgt && [G.botTgt.x | 0, G.botTgt.y | 0], fl: G.flags })); } G.lp = { x: G.p.x, y: G.p.y }; }
  const p = G.p, fev = G.fever > 0; const wdt = dt / (fev ? .4 : 1);
  if (G.fever > 0) G.fever -= dt;
  if (G.msgT > 0) G.msgT -= dt; if (G.shake > 0) G.shake -= dt;
  if (G.chainT > 0) { G.chainT -= dt; if (G.chainT <= 0) G.chain = 0; }
  for (let i = G.pops.length - 1; i >= 0; i--) { const q = G.pops[i]; q.l -= dt; q.y -= 32 * dt; if (q.l <= 0) G.pops.splice(i, 1); }
  // 運転: 押した方向は「次の交差点で曲がる予約」。逆方向は即反転
  const inp = DEMO ? botInput() : input();
  if (Math.abs(inp.dx) > .3 || Math.abs(inp.dy) > .3) { p.want = Math.abs(inp.dx) >= Math.abs(inp.dy) ? { x: Math.sign(inp.dx), y: 0 } : { x: 0, y: Math.sign(inp.dy) }; p.wantT = .6; }
  else if (p.wantT > 0) { p.wantT -= dt; if (p.wantT <= 0) p.want = null; }
  if (inp.lane) p.lane = inp.lane;
  else if (p.want && (p.want.x !== 0) !== (p.dir.x !== 0)) { const side = Math.sign(p.dir.x * p.want.y - p.dir.y * p.want.x); if (side && p.lane !== side * 16) { p.lane = side * 16; sfx(500, .04, 'triangle', .02); } }
  const spd = 305 * (1 + .06 * lv('speed') + skillStat('speed')) * (fev ? 1.15 : 1);
  p.braking = inp.brake && p.brake > 0;
  if (p.braking) {
    p.brake = Math.max(0, p.brake - 45 * dt);
    if (p.want && p.want.x === -p.dir.x && p.want.y === -p.dir.y) { p.dir = p.want; p.want = null; }
    const fx = cellOf(p.x), fy = cellOf(p.y), rx = Math.round(fx), ry = Math.round(fy);
    if (p.want && Math.abs(fx - rx) < 1e-4 && Math.abs(fy - ry) < 1e-4 && openDir(rx, ry, p.want)) { p.dir = p.want; p.want = null; }
  } else { p.brake = Math.min(100, p.brake + 14 * dt); drive(p, spd * dt); }
  p.tang = Math.atan2(p.dir.y, p.dir.x);
  { const kl = Math.min(1, dt * 12); p.lx += (-p.dir.y * p.lane - p.lx) * kl; p.ly += (p.dir.x * p.lane - p.ly) * kl; p.cx = p.x + p.lx; p.cy = p.y + p.ly; }
  let da = p.tang - p.ang; da = Math.atan2(Math.sin(da), Math.cos(da)); p.ang += da * Math.min(1, dt * 18);
  if (p.inv > 0) p.inv -= dt;
  updateHunter(dt);
  if(state!=='play')return;
  // 煙幕
  const fmax = 100 * (1 + .15 * lv('fuel') + skillStat('smoke')); p.maxfuel = fmax;
  p.smokeCD -= dt;
  if (inp.smoke && (p.fuel > 0 || fev)) {
    if (!fev) p.fuel = Math.max(0, p.fuel - 30 * dt); G.smokeT = (G.smokeT || 0) + dt;
    if (p.smokeCD <= 0) { p.smokeCD = .06; G.puffs.push({ x: p.cx - Math.cos(p.ang) * 26 + rr(-6, 6), y: p.cy - Math.sin(p.ang) * 26 + rr(-6, 6), l: 3 + .6 * lv('fuel') + skillStat('smoke'), m: 3 + .6 * lv('fuel') + skillStat('smoke'), r: rr(34, 44) }); }
  } else p.fuel = Math.min(fmax, p.fuel + 4 * dt);
  for (let i = G.puffs.length - 1; i >= 0; i--) { G.puffs[i].l -= dt; if (G.puffs[i].l <= 0) G.puffs.splice(i, 1); }
  // 流れ場
  const ptile = (p.y / T | 0) * GW + (p.x / T | 0);
  if (ptile !== G.dtile) { G.dtile = ptile; G.dist = bfs(p.x / T | 0, p.y / T | 0); }
  // 敵のわき
  G.spawnAcc += dt * (.25 + G.t * .03 + (G.t / 150) ** 2 * 2 + (G.stage - 1) * .3) * (G.boss ? .5 : 1);
  const cap = Math.min(15 + G.t * 1.3 + (G.stage - 1) * 20, 300);
  while (G.spawnAcc >= 1) { G.spawnAcc--; if (G.enemies.length < cap) spawnEnemy(); }
  buildBuckets();
  // 敵の動き
  for (let i = G.enemies.length - 1; i >= 0; i--) {
    const e = G.enemies[i], T0 = ETYPES[e.type];
    if (e.dead) continue;
    // 煙幕に触れるとスピン(原作どおり)。フィーバー中は煙で焼ける
    let inSmoke = false;
    for (const q of G.puffs) { if ((q.x - e.x) ** 2 + (q.y - e.y) ** 2 < q.r * q.r) { inSmoke = true; break; } }
    if (inSmoke) { if (e.spin <= 0) { e.spin = 1.4; e.gen = 2; } else { e.spin = Math.max(e.spin, .5); e.gen = 2; } if (fev) { e.hp -= 14 * dt; e.flash = .05; e.src = 'smoke'; } }
    if (e.spin > 0) { e.spin -= dt; if (e.spin <= 0) e.imm = 1; } else if (e.imm > 0) e.imm -= dt;
    if (e.crashCD > 0) e.crashCD -= dt;
    const spinning = e.spin > 0, r = e.r;
    if (!spinning) enemySteer(e);
    // ノックバック: 進行方向の成分は線に沿って押し戻し、横の成分は少しだけ横にずれる(壁に入らない範囲)
    const along = e.vx * r.dir.x + e.vy * r.dir.y;
    e.ox += (e.vx - along * r.dir.x) * dt; e.oy += (e.vy - along * r.dir.y) * dt;
    const ol = Math.hypot(e.ox, e.oy); if (ol > 20) { e.ox *= 20 / ol; e.oy *= 20 / ol; }
    const back = Math.pow(.004, dt); e.ox *= back; e.oy *= back;
    const mv = (spinning ? 0 : T0.spd) * dt + along * dt;
    if (mv >= 0) drive(r, mv);
    else { const w = r.want; r.want = null; r.dir = { x: -r.dir.x, y: -r.dir.y }; drive(r, -mv); r.dir = { x: -r.dir.x, y: -r.dir.y }; r.want = w; e.node = -1; }
    e.vx *= Math.pow(.02, dt); e.vy *= Math.pow(.02, dt);
    // 車線: 進行方向の左右どちらか(2列)。曲がる時はなめらかに入れ替わる
    const kl = Math.min(1, dt * 8); e.lx += (-r.dir.y * e.lane - e.lx) * kl; e.ly += (r.dir.x * e.lane - e.ly) * kl;
    e.x = r.x + e.lx + e.ox; e.y = r.y + e.ly + e.oy;
    // 玉突き: 走っている車がスピン中の車に当たる(重なってもよい。押し合いはしない)
    if (!spinning && e.crashCD <= 0) near(e.x, e.y, 36, o => { if (o === e || e.crashCD > 0 || !(o.spin > 0 && o.gen > 0)) return; const dd = Math.hypot(e.x - o.x, e.y - o.y); if (dd < 36) crash(e, o, dd); });
    if (e.spin > 0) e.ang += 15 * dt;
    else { const ta = Math.atan2(r.dir.y, r.dir.x); let dA = ta - e.ang; dA = Math.atan2(Math.sin(dA), Math.cos(dA)); e.ang += dA * Math.min(1, dt * 12); }
    if (e.flash > 0) e.flash -= dt;
    const d2 = (p.cx - e.x) ** 2 + (p.cy - e.y) ** 2;
    // 接触
    if (d2 < 26 * 26 && e.spin > 0) { // スピン中の車は体当たりで弾き飛ばせる(ボウリング)
      if (e.crashCD <= 0) { const dd = Math.sqrt(d2) || 1; hurt(e, 10 + 3 * G.stage, (e.x - p.cx) / dd, (e.y - p.cy) / dd, 420, 'ram'); e.crashCD = .3; sfx(180, .08, 'square', .04, 90); }
    } else if (d2 < 26 * 26) {
      if (p.inv <= 0) { G.hits = (G.hits || 0) + 1; p.hp -= T0.dmg * (1 + G.t / 400) / (1 + skillStat('guard')); p.inv = .9; shove(); G.shake = .15; G.shakeA = 5; sfx(120, .2, 'sawtooth', .07, 60); boom(p.cx, p.cy, '#6ab0ff', 6); if (p.hp <= 0) { die(); return; } }
      if (T0.kami) { e.hp = 0; }
      else { const L2 = Math.hypot(e.x - p.cx, e.y - p.cy) || 1; e.vx += (e.x - p.cx) / L2 * 150; e.vy += (e.y - p.cy) / L2 * 150; }
    }
    if (e.hp <= 0) killEnemy(e, i);
  }
  // 岩: 敵がぶつかるとスピン(後続が玉突き)、自機は大ダメージ。車線を変えてよける
  for (const r of G.rocks) {
    near(r.x, r.y, 30, e => { if (e.dead || e.spin > 0 || e.crashCD > 0 || Math.hypot(e.x - r.x, e.y - r.y) > 24) return; e.crashCD = .6; e.spin = 1.2; e.gen = 2; const d = Math.hypot(e.x - r.x, e.y - r.y) || 1; hurt(e, 25, (e.x - r.x) / d, (e.y - r.y) / d, 200, 'crash'); burst(r.x, r.y, '#a89a88', 5, 220, 'shard'); if (G.t - G.lastPop > .3) { G.lastPop = G.t; pop(r.x, r.y - 20, 'CRASH!', '#ffb040', 16); } });
    if (Math.hypot(p.cx - r.x, p.cy - r.y) < 26 && p.inv <= 0) { pop(r.x, r.y - 26, '岩に激突!', '#ff6040', 18); bossHitPlayer(15, r.x, r.y); if (state !== 'play') return; }
  }
  for (const e of G.enemies) if (e.hp <= 0 && !e.dead) killEnemy(e);
  if (G.enemies.some(e => e.dead)) G.enemies = G.enemies.filter(e => !e.dead);
  buildBuckets();
  weapons(wdt, dt);
  updateBoss(dt); if (state !== 'play' || G.stageJustCleared) { G.stageJustCleared = false; return; }
  // 宝石・アイテム
  const mag = 70 + 45 * lv('antenna') + 100 * skillStat('pickup');
  for (let i = G.gems.length - 1; i >= 0; i--) {
    const g = G.gems[i], d = Math.hypot(p.x - g.x, p.y - g.y);
    if (d < mag || g.mag) { g.mag = d < mag || g.mag; const k = Math.max(d, 1); const s = 560 * dt; g.x += (p.x - g.x) / k * Math.min(s, d); g.y += (p.y - g.y) / k * Math.min(s, d); }
    if (d < 26) { G.xp += g.v * (fev ? 2 : 1); G.xpGlow = .3; if (g.big) burst(p.x, p.y, '#7fd0ff', 5, 160, 'spark'); G.gems.splice(i, 1); G.score += 1; sfx(900 + Math.min(G.xp, 300), .05, 'triangle', .03); }
  }
  for (let i = G.items.length - 1; i >= 0; i--) {
    const it = G.items[i], d = Math.hypot(p.x - it.x, p.y - it.y);
    if (d < mag) { const s = 560 * dt; it.x += (p.x - it.x) / Math.max(d, 1) * Math.min(s, d); it.y += (p.y - it.y) / Math.max(d, 1) * Math.min(s, d); }
    if (d < 30) {
      if (it.k === 'fuel') { p.fuel = Math.min(p.maxfuel, p.fuel + 40); } else { p.hp = Math.min(p.maxhp, p.hp + 40); }
      sfx(600, .15, 'triangle', .05, 1000); G.items.splice(i, 1);
    }
  }
  // 旗
  for (let i = G.flagsList.length - 1; i >= 0; i--) {
    const f = G.flagsList[i];
    if (Math.hypot(p.x - f.x, p.y - f.y) < 46) {
      G.flagsList.splice(i, 1); G.flags++; G.score += 500 * (fev ? 2 : 1); sfx(520, .12, 'square', .05, 1040);
      if (G.flags >= 10) startBoss();
    }
  }
  G.sTimer -= dt; if (!G.sFlag && G.sTimer <= 0) { G.sFlag = randNode(600, p); G.sTimer = 60; }
  if (G.sFlag && Math.hypot(p.x - G.sFlag.x, p.y - G.sFlag.y) < 46) {
    // 密集ボーナス: 画面内の敵が多いほど大爆発。ギリギリまで引きつけてから取るのが正解
    let n = 0;
    for (const e of G.enemies) if (Math.abs(e.x - p.x) < VW / 2 + 40 && Math.abs(e.y - p.y) < VH / 2 + 40) {
      n++; const d = Math.hypot(e.x - p.x, e.y - p.y) || 1; hurt(e, 40 + 8 * G.stage, (e.x - p.x) / d, (e.y - p.y) / d, 320, 'bang'); e.spin = 2; e.gen = 1;
    }
    if (G.boss && Math.abs(G.boss.x - p.x) < VW / 2 + 60 && Math.abs(G.boss.y - p.y) < VH / 2 + 60) bossHurt(150 + 50 * G.stage, 'bang');
    const bonus = n * 100; G.score += bonus;
    pop(p.x, p.y - 56, `密集ボーナス ${n}台!  +${bonus}`, '#ffd400', n >= 30 ? 30 : 22);
    ring(p.x, p.y, 560, .6, '#ffffff', 10); ring(p.x, p.y, 420, .5, '#ff40ff', 8); ring(p.x, p.y, 300, .4, '#40ffff', 8);
    burst(p.x, p.y, '#ffe040', 70, 700, 'spark'); burst(p.x, p.y, '#ff60ff', 40, 500, 'spark'); glowFx(p.x, p.y, 300, '#ffffff', .5);
    flash(.9); G.freeze = .15; G.shake = .5; G.shakeA = 12;
    G.sFlag = null; G.fever = 12; G.sTimer = 45; for (const g of G.gems) g.mag = true; sfx(300, .6, 'sawtooth', .07, 1200); sfx(80, .5, 'square', .08, 40);
    say(['> コード[S]を取得。', '> システムの処理能力を一時的にジャックします。']);
  }
  // 位置が重なる効果
  for (let i = G.fx.length - 1; i >= 0; i--) { const f = G.fx[i]; f.l -= dt; if (f.l <= 0) G.fx.splice(i, 1); }
  const drag = Math.pow(.04, dt);
  for (let i = G.parts.length - 1; i >= 0; i--) { const q = G.parts[i]; q.l -= dt; q.x += q.vx * dt; q.y += q.vy * dt; q.vx *= drag; q.vy *= drag; if (q.l <= 0) { G.parts[i] = G.parts[G.parts.length - 1]; G.parts.pop(); } }
  for (let i = G.nums.length - 1; i >= 0; i--) { const q = G.nums[i]; q.l -= dt; q.y -= 38 * dt; if (q.l <= 0) G.nums.splice(i, 1); }
  for (let i = G.ghosts.length - 1; i >= 0; i--) { G.ghosts[i].l -= dt; if (G.ghosts[i].l <= 0) G.ghosts.splice(i, 1); }
  if (G.xpGlow > 0) G.xpGlow -= dt; if (G.chainBump > 0) G.chainBump -= dt;
  // レベルアップ
  // レベル: どんどん上がる(ヴァンサバ式)。武器を選ぶのは5レベルごと。Lv250まで1回の伸びは小さく、Lv250からインフレ
  if (G.xp >= G.need && state === 'play') {
    G.xp -= G.need; G.level++; G.need = Math.round(2 + G.level * .15);
    if (G.level === INFL) { flash(.9, '#ff60ff'); pop(p.cx, p.cy - 60, 'Lv250 インフレ解禁! 武器の上限Lv10', '#ff8cff', 26); say(['> 制限解除: 出力上限を撤廃。', '> 攻撃力と連射が、ここから一気に伸びます。']); [392, 523, 659, 784, 1047, 1319].forEach((f, i) => sfx(f, .3, 'sawtooth', .05, 0, i * .08)); }
    if (G.level % 5 === 0) openLevelUp();
    else { pop(p.cx, p.cy - 40, `LV ${G.level}`, '#ffe14a', 16); sfx(1046, .08, 'square', .03); sfx(1568, .1, 'square', .03, 0, .06); G.xpGlow = .4; }
  }
}
function crash(a, b, dd) { // 玉突き事故: ぶつかった車もスピンし、両方にダメージ
  const dmg = 5 + G.stage, d = dd || 1;
  a.crashCD = .5; if (a.imm <= 0) { a.spin = 1.0; a.gen = b.gen - 1; } hurt(a, dmg, (a.x - b.x) / d, (a.y - b.y) / d, 140, 'crash');
  if (b.crashCD <= 0) { b.crashCD = .3; hurt(b, dmg, (b.x - a.x) / d, (b.y - a.y) / d, 140, 'crash'); }
  G.crashes++; burst((a.x + b.x) / 2, (a.y + b.y) / 2, '#ffb040', 4, 260, 'spark');
  if (G.t - G.lastPop > .3) { G.lastPop = G.t; pop((a.x + b.x) / 2, (a.y + b.y) / 2 - 10, 'CRASH!', '#ffb040', 16); sfx(90 + rnd() * 40, .12, 'sawtooth', .04, 45); }
}
function shove() { // 被弾の衝撃波: 囲まれても抱きつかれ続けないよう、まわりの敵を弾き飛ばす
  const p = G.p; ring(p.cx, p.cy, 90, .25, '#6ab0ff', 5); flash(.25, '#ff2020');
  near(p.cx, p.cy, 90, o => { const dx = o.x - p.cx, dy = o.y - p.cy, d = Math.hypot(dx, dy) || 1; hurt(o, 6, dx / d, dy / d, 380); });
}
function updateHunter(dt) {
  const p=G.p,c=G.camp, moved=Math.hypot(p.x-c.x,p.y-c.y)>95;
  if(moved){c.x=p.x;c.y=p.y;c.t=0;if(G.hunter&&G.hunter.leave<0)G.hunter.leave=5;}
  else if(!G.hunter)c.t+=dt;
  if(!G.hunter&&c.t>=20){
    const a=p.ang+Math.PI,dist=240;
    G.hunter={x:Math.max(60,Math.min(WORLD-60,p.x+Math.cos(a)*dist)),y:Math.max(60,Math.min(WORLD-60,p.y+Math.sin(a)*dist)),leave:-1,carve:0,hit:0,ang:a};
    pop(p.x,p.y-80,'破壊者 接近！','#ff9448',24);flash(.45,'#ff6030');G.shake=.35;G.shakeA=8;
  }
  const h=G.hunter;if(!h)return;
  if(h.leave>=0){h.leave-=dt;if(h.leave<=0){G.hunter=null;return;}}
  const dx=p.cx-h.x,dy=p.cy-h.y,d=Math.hypot(dx,dy)||1,spd=220+Math.min(130,G.stage*5);
  h.x+=dx/d*spd*dt;h.y+=dy/d*spd*dt;h.ang=Math.atan2(dy,dx);h.carve-=dt;h.hit-=dt;
  if(h.carve<=0){h.carve=.18;carveCircle(h.x,h.y,36);G.dtile=-1;}
  if(d<36&&h.hit<=0&&p.inv<=0){h.hit=1.2;p.hp-=Math.max(40,p.maxhp*.42)/(1+skillStat('guard')*.5);p.inv=.65;
    shove();pop(p.cx,p.cy-40,'破壊者 -大ダメージ','#ff6040',20);G.shake=.45;G.shakeA=10;
    if(p.hp<=0)die();
  }
}
function weapons(wdt, dt) {
  const p = G.p; wdt *= cdMul();
  // Scan and blast modules emit a periodic local wave. Evolutions make it much stronger.
  const pulse=skillStat('pulse'), blast=skillStat('blast'), evolved=equippedSkills().filter(k=>WEAPONS[k].fusion);
  if(pulse+blast>0 || evolved.length){G.moduleT=(G.moduleT||0)-dt;
    if(G.moduleT<=0){G.moduleT=Math.max(.28,1.6/(1+pulse+blast));const r=110+95*pulse+50*blast+evolved.length*25;
      near(p.cx,p.cy,r,e=>{const d=Math.hypot(e.x-p.cx,e.y-p.cy)||1;if(d<r)hurt(e,4+22*blast+12*pulse+evolved.length*12,(e.x-p.cx)/d,(e.y-p.cy)/d,90+100*blast);});
      if(G.boss&&bossHit(p.cx,p.cy,r))bossHurt(3+18*blast+10*pulse+evolved.length*10,'module');
      ring(p.cx,p.cy,r,.26,evolved.length?'#ff9cec':blast?'#ff7752':'#61e9a5',2+Math.min(6,evolved.length));
    }
  }
  // ランス
  if (lv('lance')) {
    G.wt.lance -= wdt;
    if (G.wt.lance <= 0) {
      const L = lv('lance'); G.wt.lance = Math.max(.2, .8 - .07 * L);
      let tgt = nearest(p.x, p.y, 460);
      if (G.boss && G.boss.parts && G.boss.dying <= 0) { let bd = 460 * 460; for (const q of G.boss.parts) { const d = (q.x - p.x) ** 2 + (q.y - p.y) ** 2; if (d < bd) { bd = d; tgt = q; } } } // ボスが射程内なら優先
      const base = tgt ? Math.atan2(tgt.y - p.y, tgt.x - p.x) : p.ang, n = 1 + ((L + 1) >> 1);
      for (let i = 0; i < n; i++) { const a = base + (i - (n - 1) / 2) * .16; G.shots.push({ x: p.x, y: p.y, vx: Math.cos(a) * 760, vy: Math.sin(a) * 760, a, l: .8, dmg: 12 + 3 * L, pierce: L >= 3 ? 3 : 1, hit: new Set() }); }
      sfx(700, .06, 'square', .02, 400);
    }
  }
  for (let i = G.shots.length - 1; i >= 0; i--) {
    const s = G.shots[i]; s.x += s.vx * dt; s.y += s.vy * dt; s.l -= dt;
    let dead = s.l <= 0 || blockedAt(s.x, s.y, 4);
    if (!dead && !s.hitBoss && bossHit(s.x, s.y, 8)) { s.hitBoss = true; bossHurt(s.dmg, 'wpn'); burst(s.x, s.y, '#ffd040', 3, 200, 'spark'); if (--s.pierce <= 0) dead = true; }
    if (!dead) near(s.x, s.y, 22, e => { if (dead || s.hit.has(e) || e.hp <= 0) return; if (Math.hypot(e.x - s.x, e.y - s.y) < 22) { s.hit.add(e); hurt(e, s.dmg, s.vx / 760, s.vy / 760, 90); if (--s.pierce <= 0) dead = true; } });
    if (dead) G.shots.splice(i, 1);
  }
  // マイン
  if (lv('mine')) {
    const L = lv('mine'); G.wt.mine -= wdt;
    if (G.wt.mine <= 0 && G.mines.length < 6 + Math.max(0, L - 5) * 2) { G.wt.mine = Math.max(.5, 2.6 - .25 * L); G.mines.push({ x: p.x - Math.cos(p.ang) * 30, y: p.y - Math.sin(p.ang) * 30, l: 14 }); }
  }
  for (let i = G.mines.length - 1; i >= 0; i--) {
    const m = G.mines[i]; m.l -= dt; let go = m.l <= 0 ? 'x' : false;
    if (!go) near(m.x, m.y, 24, e => { if (Math.hypot(e.x - m.x, e.y - m.y) < 24) go = true; });
    if (!go && bossHit(m.x, m.y, 14)) go = true;
    if (go === true) {
      const L = lv('mine'), R = 62 + 8 * L;
      near(m.x, m.y, R, e => { const d = Math.hypot(e.x - m.x, e.y - m.y); if (d < R) hurt(e, 32 + 10 * L, (e.x - m.x) / (d || 1), (e.y - m.y) / (d || 1), 260); });
      if (bossHit(m.x, m.y, R)) bossHurt(32 + 10 * L, 'wpn');
      ring(m.x, m.y, R, .3, '#ffb43c', 5); glowFx(m.x, m.y, R * 1.4, '#ff8a20', .4); glowFx(m.x, m.y, R * .7, '#fff0a0', .2);
      burst(m.x, m.y, '#ffb040', 16, 380, 'spark'); burst(m.x, m.y, '#a89a88', 8, 220, 'shard'); sfx(160, .3, 'sawtooth', .07, 50);
      if (Math.abs(m.x - G.p.x) < VW / 2 && Math.abs(m.y - G.p.y) < VH / 2 && G.shake <= 0) { G.shake = .1; G.shakeA = 3; }
    }
    if (go) G.mines.splice(i, 1);
  }
  // レーダー
  if (lv('radar')) {
    const L = lv('radar'); G.sweep += dt * (2.2 + .2 * L); const len = 95 + 10 * L, n = L >= 8 ? 3 : L >= 4 ? 2 : 1;
    for (let b = 0; b < n; b++) {
      const a = G.sweep + b * Math.PI * 2 / n;
      near(p.x, p.y, len + 20, e => {
        const dx = e.x - p.x, dy = e.y - p.y, d = Math.hypot(dx, dy); if (d > len) return;
        let da = Math.atan2(dy, dx) - a; da = Math.atan2(Math.sin(da), Math.cos(da));
        if (Math.abs(da) < .4 && e.swT <= 0) { e.swT = .25; hurt(e, 6 + 2 * L, dx / (d || 1), dy / (d || 1), 220); }
      });
    }
    for (const e of G.enemies) if (e.swT > 0) e.swT -= dt;
  }
}
function die() {
  state = 'dead'; G.deadAt = performance.now();
  G.log = ['> 特異点(Blue)の反応が消失。', `> 観測サイクル終了。到達階層 ${G.stage} / 撃破 ${G.kills} / 生存 ${Math.floor(G.t)}秒`, `> 最大連鎖 ${G.best} / 玉突き ${G.crashes}回 / スコア ${G.score}`, '> 次のサイクルを準備中… [R / タップ]で再開'];
  sfx(300, .8, 'sawtooth', .08, 40);
}
function stageClear() {
  G.stageJustCleared = true; G.boss = null; G.bossWarn = 0; G.clearT = 0;
  G.stage++; const p = G.p; genMaze(G.stage); const s = randNode(0); p.x = s.x; p.y = s.y; p.want = null; G.pops.length = 0; G.enemies.length = 0; G.puffs.length = 0; G.mines.length = 0; G.shots.length = 0;
  G.hunter=null;G.camp={x:p.x,y:p.y,t:0};
  G.dtile = -1; G.sFlag = null; G.items.length = 0; placeFlags(); p.hp = p.maxhp; G.score += 3000; G.botTgt = null;
  say([`> 断片10/10を回収。階層 ${G.stage} へのアクセスを許可。`, '> 警告:赤性プログラムが強化されました。']); sfx(440, .5, 'square', .06, 1760);
}
function openLevelUp() {
  // 普通の武器・強化を優先。足りない分を「装甲強化」「オーバークロック」で埋める
  const owned = equippedSkills(), slots = SKILL_SLOTS - owned.length;
  const upgrades = owned.filter(k => lv(k) < maxLv(k));
  const newcomers = slots > 0 ? Object.keys(WEAPONS).filter(k => !WEAPONS[k].filler && !WEAPONS[k].fusion && !lv(k)) : [];
  const fusions = fusionOptions().map(r=>r.key);
  const opts = [];
  if (fusions.length) opts.push(fusions[ri(fusions.length)]);
  if (upgrades.length) opts.push(upgrades[ri(upgrades.length)]);
  const pool = [...newcomers, ...upgrades, ...fusions.filter(k=>!opts.includes(k))];
  while (opts.length < 3 && pool.length) { const k=pool.splice(ri(pool.length),1)[0]; if(!opts.includes(k)) opts.push(k); }
  const fill = ['hpup', 'power'];
  while (opts.length < 3 && fill.length) opts.push(fill.splice(ri(fill.length), 1)[0]);
  G.opts = opts; G.sel = 0; state = 'levelup'; G.luAt = performance.now(); flash(.7, '#fff7c0');
  [523, 659, 784, 1047].forEach((f, i) => sfx(f, .18, 'square', .05, 0, i * .07)); sfx(1568, .4, 'triangle', .04, 0, .28);
}
function pick(i) {
  const k = G.opts[i]; if (!k) return;
  const recipe=FUSION_RECIPES.find(r=>r.key===k);
  if(recipe){if(!lv(recipe.left)||!lv(recipe.right))return;delete G.w[recipe.left];delete G.w[recipe.right];G.w[k]=1;
    G.freeze=Math.max(G.freeze,.3);G.shake=.65;G.shakeA=12;pop(G.p.x,G.p.y-70,'FUSION!',EXTRA_LOOK[k].color,30);
  } else {if(!lv(k)&&!WEAPONS[k].filler&&equippedSkills().length>=SKILL_SLOTS)return;G.w[k]=lv(k)+1;}
  state = 'play';
  if (k === 'fuel') G.p.fuel = G.p.maxfuel || 100;
  if (k === 'hpup') { G.p.maxhp += 10; G.p.hp = Math.min(G.p.maxhp, G.p.hp + 30); }
  skillAcquire(k, lv(k), maxLv(k));
}

// ---- 描画 ----
function draw() {
  ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.fillStyle = '#000'; ctx.fillRect(0, 0, cv.width, cv.height);
  ctx.setTransform(view.s, 0, 0, view.s, view.ox, view.oy); ctx.imageSmoothingEnabled = false;
  ctx.save(); ctx.beginPath(); ctx.rect(0, 0, VW, VH); ctx.clip();
  if (!G) { ctx.restore(); return; }
  const p = G.p, shk = G.shake > 0 ? G.shakeA : 0;
  const cx = Math.min(WORLD - VW, Math.max(0, p.x - VW / 2)) + (shk ? rr(-shk, shk) : 0), cy = Math.min(WORLD - VH, Math.max(0, p.y - VH / 2)) + (shk ? rr(-shk, shk) : 0);
  ctx.drawImage(wallCv, cx, cy, VW, VH, 0, 0, VW, VH);
  ctx.save(); ctx.translate(-cx | 0, -cy | 0);
  const on = (x, y, m = 40) => x > cx - m && x < cx + VW + m && y > cy - m && y < cy + VH + m;
  // 煙幕
  for (const q of G.puffs) if (on(q.x, q.y, 60)) {
    const a = Math.max(0, q.l / q.m); ctx.globalAlpha = .5 * a;
    ctx.fillStyle = G.fever > 0 ? `hsl(${(G.t * 300 + q.x) % 360},90%,70%)` : '#d8dcec'; ctx.beginPath(); ctx.arc(q.x, q.y, q.r * (1.3 - .3 * a), 0, 7); ctx.fill();
  }
  ctx.globalAlpha = 1;
  ctx.globalCompositeOperation = 'lighter';
  for (const g of G.gems) if (g.big && on(g.x, g.y)) glow(g.x, g.y, 22 + 4 * Math.sin(G.t * 6 + g.x), '#40a8ff', .5);
  ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1;
  for (const g of G.gems) if (on(g.x, g.y)) drawSprite(g.big ? SP.gemL : SP.gemS, g.x, g.y, 0, (g.big ? 2 : 3) * (1 + .12 * Math.sin(G.t * 9 + g.y)));
  for (const it of G.items) if (on(it.x, it.y)) drawSprite(it.k === 'fuel' ? SP.fuel : SP.crab, it.x, it.y, 0, 3);
  for (const r of G.rocks) if (on(r.x, r.y)) { ctx.fillStyle = 'rgba(0,0,0,.45)'; ctx.beginPath(); ctx.ellipse(r.x + 3, r.y + 6, 17, 10, 0, 0, 7); ctx.fill(); drawSprite(SP.rock, r.x, r.y, r.rot, 3.6); }
  for (const m of G.mines) if (on(m.x, m.y)) drawSprite(SP.rock, m.x, m.y, 0, 3);
  const wob = Math.sin(G.t * 8);
  for (const f of G.flagsList) if (on(f.x, f.y)) drawSprite(SP.flagY, f.x + wob * 1.5, f.y, 0, 3);
  if (G.sFlag && on(G.sFlag.x, G.sFlag.y)) {
    ctx.fillStyle = `rgba(255,220,0,${.25 + .2 * Math.sin(G.t * 6)})`; ctx.beginPath(); ctx.arc(G.sFlag.x, G.sFlag.y, 30, 0, 7); ctx.fill();
    drawSprite(SP.flagS, G.sFlag.x + wob * 1.5, G.sFlag.y, 0, 3.2);
  }
  for (const e of G.enemies) if (on(e.x, e.y)) {
    const T0 = ETYPES[e.type]; drawSprite(SP[T0.sp], e.x, e.y, e.ang + Math.PI / 2, T0.sc);
    if (e.spin > 0) { ctx.fillStyle = '#fff59a'; for (let k = 0; k < 3; k++) { const a = G.t * 9 + k * 2.09; ctx.fillRect(e.x + Math.cos(a) * 18 - 2, e.y - 16 + Math.sin(a) * 6 - 2, 4, 4); } }
    if (e.flash > 0) drawSprite(whiteOf(SP[T0.sp]), e.x, e.y, e.ang + Math.PI / 2, T0.sc, Math.min(1, e.flash / .1));
  }
  if(G.hunter&&on(G.hunter.x,G.hunter.y,80)){
    const h=G.hunter;ctx.save();ctx.translate(h.x,h.y);ctx.rotate(h.ang);ctx.fillStyle='#101018';ctx.strokeStyle='#ff6b36';ctx.lineWidth=5;
    ctx.beginPath();ctx.moveTo(28,0);ctx.lineTo(6,-25);ctx.lineTo(-24,-20);ctx.lineTo(-32,0);ctx.lineTo(-24,20);ctx.lineTo(6,25);ctx.closePath();ctx.fill();ctx.stroke();
    ctx.fillStyle='#ffe27a';ctx.fillRect(0,-6,17,12);ctx.fillStyle='#ffffff';ctx.fillRect(19,-3,7,6);ctx.restore();
    glow(h.x,h.y,48,'#ff6833',.45);ctx.globalAlpha=1;
  }
  drawBoss();
  // 撃破の残像: 白く光りながら膨らんで消える
  ctx.globalCompositeOperation = 'lighter';
  for (const g of G.ghosts) if (on(g.x, g.y)) { const k = g.l / g.m; drawSprite(whiteOf(g.spr), g.x, g.y, g.ang + Math.PI / 2, g.sc * (1.35 - .35 * k), k); }
  ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1;
  // レーダー・スイーパー
  if (lv('radar')) {
    const L = lv('radar'), len = 95 + 10 * L, n = L >= 8 ? 3 : L >= 4 ? 2 : 1;
    ctx.globalCompositeOperation = 'lighter';
    for (let b = 0; b < n; b++) {
      const a = G.sweep + b * Math.PI * 2 / n;
      for (let j = 0; j < 5; j++) { ctx.fillStyle = `rgba(60,255,110,${.2 * (1 - j / 5)})`; ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.arc(p.x, p.y, len, a - .4 - j * .14, a + .1 - j * .14); ctx.fill(); }
      ctx.strokeStyle = '#c0ffd0'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(p.x + Math.cos(a) * len, p.y + Math.sin(a) * len); ctx.stroke();
      glow(p.x + Math.cos(a) * len, p.y + Math.sin(a) * len, 18, '#60ff90', .8); ctx.globalAlpha = 1;
    }
    ctx.globalCompositeOperation = 'source-over';
  }
  // ランス: 金色の光の尾
  ctx.globalCompositeOperation = 'lighter'; ctx.lineCap = 'round';
  for (const s of G.shots) if (on(s.x, s.y)) {
    ctx.strokeStyle = 'rgba(255,200,40,.55)'; ctx.lineWidth = 7; ctx.beginPath(); ctx.moveTo(s.x - s.vx * .06, s.y - s.vy * .06); ctx.lineTo(s.x, s.y); ctx.stroke();
    ctx.strokeStyle = 'rgba(255,255,220,.9)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(s.x - s.vx * .03, s.y - s.vy * .03); ctx.lineTo(s.x, s.y); ctx.stroke();
    glow(s.x, s.y, 14, '#ffd040', .7); ctx.globalAlpha = 1;
  }
  ctx.globalCompositeOperation = 'source-over'; ctx.lineCap = 'butt';
  for (const s of G.shots) if (on(s.x, s.y)) drawSprite(SP.lance, s.x, s.y, s.a, 3);
  // 自機
  if (!(p.inv > 0 && ((G.t * 20) | 0) % 2)) {
    if (G.fever > 0) { ctx.fillStyle = `hsla(${(G.t * 400) % 360},100%,60%,.35)`; ctx.beginPath(); ctx.arc(p.cx, p.cy, 34, 0, 7); ctx.fill(); }
    if (p.braking) { ctx.fillStyle = 'rgba(255,154,58,.5)'; ctx.beginPath(); ctx.arc(p.cx, p.cy, 26, 0, 7); ctx.fill(); }
    drawSprite(SP.blue, p.cx, p.cy, p.ang + Math.PI / 2, 3);
  }
  // 粒子(加算合成): 光・火花・破片・リング
  ctx.globalCompositeOperation = 'lighter'; ctx.lineCap = 'round';
  for (const q of G.parts) {
    if (!on(q.x, q.y, 80)) continue; const k = q.l / q.m;
    if (q.k === 'glow') glow(q.x, q.y, q.r * (1.2 - .4 * k), q.c, k * .9);
    else if (q.k === 'spark') { ctx.globalAlpha = k; ctx.strokeStyle = q.c; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(q.x, q.y); ctx.lineTo(q.x - q.vx * .045, q.y - q.vy * .045); ctx.stroke(); }
    else { ctx.globalAlpha = Math.min(1, k * 1.6); ctx.fillStyle = q.c; const z = q.s * (.5 + .5 * k); ctx.fillRect(q.x - z / 2, q.y - z / 2, z, z); }
  }
  for (const f of G.fx) if (f.k === 'ring') { const k = f.l / f.m; ctx.globalAlpha = k; ctx.strokeStyle = f.c; ctx.lineWidth = f.w * (.4 + k); ctx.beginPath(); ctx.arc(f.x, f.y, f.r * (1 - k * .7), 0, 7); ctx.stroke(); }
  ctx.globalCompositeOperation = 'source-over'; ctx.lineCap = 'butt'; ctx.globalAlpha = 1;
  // ダメージ数字(出た瞬間だけ大きく)
  for (const q of G.nums) {
    if (!on(q.x, q.y)) continue; const big = q.v >= 30, sz = (big ? 16 : 12) * (1 + Math.max(0, q.l - .6) * 3);
    ctx.globalAlpha = Math.min(1, q.l * 3); ctx.font = `bold ${sz | 0}px ${FONT}`; ctx.textAlign = 'center'; ctx.lineWidth = 3; ctx.strokeStyle = '#000';
    const v = String(Math.round(q.v)); ctx.strokeText(v, q.x, q.y); ctx.fillStyle = big ? '#ffe040' : '#ffffff'; ctx.fillText(v, q.x, q.y);
  }
  ctx.globalAlpha = 1;
  for (const q of G.pops) { ctx.globalAlpha = Math.min(1, q.l * 2); txt(q.s, q.x, q.y, q.size, q.c, 'center'); ctx.globalAlpha = 1; }
  ctx.restore();
  if (G.fever > 0) {
    ctx.fillStyle = `rgba(255,60,200,${.07 + .04 * Math.sin(G.t * 10)})`; ctx.fillRect(0, 0, VW, VH);
    // フィーバーの集中線
    ctx.globalCompositeOperation = 'lighter'; ctx.lineWidth = 3;
    for (let i = 0; i < 26; i++) { const a = i * .2417 + G.t * .6, r0 = 330 + 60 * Math.sin(G.t * 13 + i * 7); ctx.strokeStyle = `hsla(${(G.t * 300 + i * 40) % 360},100%,65%,.35)`; ctx.beginPath(); ctx.moveTo(VW / 2 + Math.cos(a) * r0, VH / 2 + Math.sin(a) * r0); ctx.lineTo(VW / 2 + Math.cos(a) * 700, VH / 2 + Math.sin(a) * 700); ctx.stroke(); }
    ctx.globalCompositeOperation = 'source-over';
  }
  if (G.flash && G.flash.a > 0) { ctx.globalAlpha = G.flash.a; ctx.fillStyle = G.flash.c; ctx.fillRect(0, 0, VW, VH); ctx.globalAlpha = 1; }
  drawHUD();
  if (state === 'play') drawSkillAward();
  ctx.restore();
}
const FONT = '"Meiryo","Yu Gothic","MS Gothic",monospace';
function txt(s, x, y, size, col = '#e8f0ff', align = 'left') { ctx.font = `bold ${size}px ${FONT}`; ctx.textAlign = align; ctx.fillStyle = '#000'; ctx.fillText(s, x + 1.5, y + 1.5); ctx.fillStyle = col; ctx.fillText(s, x, y); }
function bar(x, y, w, h, v, col, label) { ctx.fillStyle = 'rgba(0,0,0,.6)'; ctx.fillRect(x - 2, y - 2, w + 4, h + 4); ctx.fillStyle = col; ctx.fillRect(x, y, w * Math.max(0, Math.min(1, v)), h); if (label) txt(label, x + 4, y + h - 2, 11); }
function drawHUD() {
  const p = G.p;
  txt(`LEVEL ${G.level}`, 12, 24, 20, G.level >= INFL ? `hsl(${(G.t * 300) % 360},100%,70%)` : '#ffe14a');
  txt(G.level >= INFL ? `インフレ 攻撃×${pw().toFixed(1)}` : `Lv${INFL}でインフレ解禁`, 140, 24, 12, G.level >= INFL ? '#ff8cff' : '#8a90b8'); txt(`FLAGS ${G.flags}/10`, 12, 48, 16, '#ffd400'); txt(`SCORE ${G.score}`, 12, 70, 14);
  txt(`階層 ${G.stage}/20  ${activeField.name}`, 12, 90, 13, activeField.shine);
  txt(`装備 ${equippedSkills().length}/${SKILL_SLOTS}`, 12, 108, 12, '#ffffff');
  if(G.camp.t>10&&!G.hunter)txt(`停滞警報 ${Math.ceil(20-G.camp.t)}秒`,12,126,13,'#ff9a58');
  if(G.hunter)txt(`破壊者追跡中 ${G.hunter.leave>=0?G.hunter.leave.toFixed(1)+'秒':''}`,12,126,13,'#ff6a36');
  txt(`${Math.floor(G.t / 60)}:${String(Math.floor(G.t % 60)).padStart(2, '0')}`, VW / 2, 34, 28, '#ffffff', 'center');
  txt(`撃破 ${G.kills}`, VW / 2, 54, 13, '#ffb0b0', 'center');
  bar(12, VH - 22, 200, 10, p.hp / p.maxhp, '#e03a3a', 'HP'); bar(220, VH - 22, 200, 10, p.fuel / (p.maxfuel || 100), '#3ab0ff', 'FUEL'); bar(428, VH - 22, 120, 10, p.brake / 100, p.braking ? '#ffffff' : '#ff9a3a', 'BRAKE');
  bar(0, VH - 6, VW, 6, G.xp / G.need, '#ffd400');
  { const w = VW * Math.min(1, G.xp / G.need), sx = (G.t * 400) % (VW + 200) - 100; ctx.globalCompositeOperation = 'lighter';
    if (sx < w) { ctx.globalAlpha = .7; ctx.fillStyle = '#fff6c0'; ctx.fillRect(sx, VH - 6, Math.min(60, w - sx), 6); }
    if (G.xpGlow > 0) { ctx.globalAlpha = G.xpGlow * 2; ctx.fillStyle = '#ffe060'; ctx.fillRect(0, VH - 12, w, 12); }
    ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over'; }
  if (G.fever > 0) txt(`FEVER! ${G.fever.toFixed(1)}`, VW / 2, G.boss ? 122 : 92, 30 + 4 * Math.sin(G.t * 12), `hsl(${(G.t * 300) % 360},100%,70%)`, 'center');
  if (G.chain >= 5) {
    const big = Math.min(34, 20 + G.chain / 10) * (1 + Math.max(0, G.chainBump) * 2);
    txt(`${G.chain} CHAIN`, 12, 132, big, G.chain >= 100 ? `hsl(${(G.t * 300) % 360},100%,70%)` : '#ff8cff');
    txt(`経験値×${chainMult().toFixed(1)}`, 14, 154, 13, '#ffd0ff'); bar(14, 162, 120, 4, G.chainT / 2, '#ff8cff');
  }
  // レーダー
  const rx = VW - 172, ry = 10, rs = 160;
  ctx.fillStyle = 'rgba(0,0,0,.7)'; ctx.fillRect(rx - 3, ry - 3, rs + 6, rs + 6); ctx.globalAlpha = .9; ctx.drawImage(mapCv, rx, ry, rs, rs); ctx.globalAlpha = 1;
  const k = rs / WORLD; ctx.fillStyle = '#ff4040'; for (const e of G.enemies) ctx.fillRect(rx + e.x * k - 1, ry + e.y * k - 1, 2, 2);
  ctx.fillStyle = '#ffd400'; for (const f of G.flagsList) ctx.fillRect(rx + f.x * k - 2, ry + f.y * k - 2, 4, 4);
  if (G.sFlag && ((G.t * 4) | 0) % 2) { ctx.fillStyle = '#ff40ff'; ctx.fillRect(rx + G.sFlag.x * k - 3, ry + G.sFlag.y * k - 3, 6, 6); }
  drawBossRadar(rx, ry, k);
  ctx.fillStyle = '#4af'; ctx.fillRect(rx + p.x * k - 2, ry + p.y * k - 2, 5, 5);
  txt('RADAR', rx, ry + rs + 16, 11, '#7dff9a');
  drawSkillHud();
  drawBossHUD();
  if (G.msgT > 0 && state === 'play') { G.log.forEach((l, i) => txt(l, VW / 2, 140 + i * 22, 15, '#58ff7a', 'center')); }
  if (DEMO && state !== 'title') txt('AIデモ中 ― キー / タップでタイトルへ', VW / 2, VH - 30, 15, '#7dff9a', 'center');
  if (state === 'title') {
    ctx.fillStyle = 'rgba(0,0,10,.82)'; ctx.fillRect(0, 0, VW, VH);
    txt('RALLY X SURVIVORS', VW / 2, 150, 48, '#4aa8ff', 'center'); txt('青い特異点と赤い抗体', VW / 2, 190, 20, '#9fb4ff', 'center');
    txt('車は止まらずに直進。曲がりたい方向を先に押すと次の角で曲がる(逆方向は即反転)', VW / 2, 234, 15, '#fff', 'center');
    txt('止まれるのはブレーキだけ: X(長押し・ゲージ制)', VW / 2, 264, 15, '#ff9a3a', 'center');
    txt('煙幕(スペース長押し)で敵をスピン → 後ろの車が突っ込んで玉突き事故!', VW / 2, 294, 15, '#fff', 'center');
    txt('スピン中の車は体当たりで弾ける。玉突きで倒し続けると連鎖で経験値が最大2倍', VW / 2, 320, 15, '#fff', 'center');
    txt('S旗は画面の敵が多いほど大爆発。ギリギリまで引きつけてから取れ', VW / 2, 346, 15, '#ffd400', 'center');
    txt('道は2車線。曲がる方向を先に押すと、その側の車線へ(すれ違いで敵をよけられる)', VW / 2, 372, 14, '#9fe8ff', 'center');
    txt('全20体のボス。8枠のスキルを合成し、最後は全装備Lv10で撃破', VW / 2, 396, 14, '#ff8080', 'center');
    txt('[ キー / タップでスタート ]', VW / 2, 440, 22, '#ffd400', 'center');
    txt('[ D ] AIデモ(放っておいても8秒で始まります)   [ M ] BGM ' + (BGM.on ? 'ON' : 'OFF'), VW / 2, 470, 15, '#7dff9a', 'center');
  }
  if (state === 'levelup') {
    const tm = (performance.now() - G.luAt) / 1000;
    ctx.fillStyle = 'rgba(0,0,10,.75)'; ctx.fillRect(0, 0, VW, VH);
    // 回る光の筋
    ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 16; i++) { const a = i * Math.PI / 8 + tm * .5; ctx.fillStyle = `rgba(255,220,90,${.09 + .04 * Math.sin(tm * 3 + i)})`; ctx.beginPath(); ctx.moveTo(VW / 2, 100); ctx.arc(VW / 2, 100, 900, a, a + .12); ctx.fill(); }
    glow(VW / 2, 100, 160, '#ffd040', .6); ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
    const bounce = 1 + Math.max(0, .5 - tm) * 1.2 * Math.abs(Math.sin(tm * 14));
    txt('LEVEL UP!', VW / 2, 112, 42 * bounce, '#ffe14a', 'center');
    G.opts.forEach((k, i) => drawSkillCard(k, i, i === G.sel, tm));
  }
  if (state === 'dead' || state === 'win') {
    ctx.fillStyle = 'rgba(0,0,0,.85)'; ctx.fillRect(0, 0, VW, VH);
    if(state==='win')txt('ALL CLEAR!',VW/2,130,54,'#ffe081','center');
    G.log.forEach((l, i) => txt(l, 90, 190 + i * 30, 18, '#58ff7a'));
  }
}
function wrapText(s, x, y, w, size) {
  ctx.font = `bold ${size}px ${FONT}`; let line = '', yy = y;
  for (const ch of s) { if (ctx.measureText(line + ch).width > w) { txt(line, x, yy, size, '#cfe', 'center'); line = ch; yy += size + 6; } else line += ch; }
  txt(line, x, yy, size, '#cfe', 'center');
}

// ---- 入力 ----
const touch = { on: false, dx: 0, dy: 0, smoke: false, id: null, sx: 0, sy: 0 };
function startDemo() { initAudio(); newGame(); DEMO = true; state = 'play'; }
function leaveDemo() { DEMO = false; demoIdle = 0; newGame(); state = 'title'; }
function startOrRestart() { initAudio(); if (state === 'title' || state === 'dead' || state === 'win') { newGame(); state = 'play'; } }
addEventListener('keydown', e => {
  if (e.key === 'm' || e.key === 'M') { BGM.on = !BGM.on; initAudio(); return; } // BGMの消音
  demoIdle = 0; if (DEMO && !BOT) { leaveDemo(); return; }
  if (state === 'title' && (e.key === 'd' || e.key === 'D')) { startDemo(); return; }
  KEYS[e.key.length === 1 ? e.key.toLowerCase() : e.key] = true; initAudio();
  if (e.key === ' ' || e.key.startsWith('Arrow')) e.preventDefault();
  if (state === 'title' || ((state === 'dead'||state==='win') && (e.key === 'r' || e.key === 'R' || e.key === 'Enter'))) startOrRestart();
  else if (state === 'levelup') {
    if (e.key >= '1' && e.key <= '3') pick(+e.key - 1);
    if (e.key === 'ArrowLeft' || e.key === 'a') G.sel = (G.sel + G.opts.length - 1) % G.opts.length;
    if (e.key === 'ArrowRight' || e.key === 'd') G.sel = (G.sel + 1) % G.opts.length;
    if (e.key === 'Enter' || e.key === ' ') pick(G.sel);
  }
});
addEventListener('keyup', e => { KEYS[e.key.length === 1 ? e.key.toLowerCase() : e.key] = false; });
function toLogical(ev) { return { x: (ev.clientX * (devicePixelRatio || 1) - view.ox) / view.s, y: (ev.clientY * (devicePixelRatio || 1) - view.oy) / view.s }; }
cv.addEventListener('pointerdown', ev => {
  demoIdle = 0; if (DEMO && !BOT) { leaveDemo(); return; }
  initAudio(); const q = toLogical(ev);
  if (state === 'title' || state === 'dead' || state==='win') return startOrRestart();
  if (state === 'levelup') { G.opts.forEach((k, i) => { const x = 90 + i * 270; if (q.x > x && q.x < x + 250 && q.y > 160 && q.y < 400) pick(i); }); return; }
  if (ev.pointerType === 'touch' && q.x > VW - 150 && q.y > VH - 150) { touch.smoke = true; touch.sid = ev.pointerId; return; }
  if (ev.pointerType === 'touch' && q.x < 150 && q.y > VH - 150) { touch.brake = true; touch.bid = ev.pointerId; return; }
  touch.on = true; touch.id = ev.pointerId; touch.sx = ev.clientX; touch.sy = ev.clientY; touch.dx = touch.dy = 0;
});
cv.addEventListener('pointermove', ev => {
  if (ev.pointerId !== touch.id) return; const dx = ev.clientX - touch.sx, dy = ev.clientY - touch.sy, l = Math.hypot(dx, dy);
  touch.dx = l > 12 ? dx / Math.max(l, 40) : 0; touch.dy = l > 12 ? dy / Math.max(l, 40) : 0;
});
const up = ev => { if (ev.pointerId === touch.id) { touch.on = false; touch.id = null; touch.dx = touch.dy = 0; } if (ev.pointerId === touch.sid) { touch.smoke = false; touch.sid = null; } if (ev.pointerId === touch.bid) { touch.brake = false; touch.bid = null; } };
cv.addEventListener('pointerup', up); cv.addEventListener('pointercancel', up);

// ---- ループ ----
let last = performance.now(), acc = 0;
function frame(now) {
  const dt = Math.min(.1, (now - last) / 1000); last = now;
  if (G && G.flash && G.flash.a > 0) G.flash.a = Math.max(0, G.flash.a - dt * 2.8);
  if (state === 'play') {
    if (G.freeze > 0) { G.freeze -= dt; acc = 0; } // ヒットストップ
    else { acc += dt; while (acc >= 1 / 60) { step(1 / 60); acc -= 1 / 60; if (state !== 'play' || G.freeze > 0) break; } }
  }
  if (DEMO) {
    if (state === 'levelup') pick(G.opts.findIndex(k => !WEAPONS[k].passive) >= 0 && rnd() < .7 ? G.opts.findIndex(k => !WEAPONS[k].passive) : ri(G.opts.length));
    if (state === 'dead' && performance.now() - G.deadAt > 2500) { console.log('BOTDEAD ' + JSON.stringify(stats())); newGame(); state = 'play'; }
  } else if (state === 'title') { demoIdle += dt; if (demoIdle > 8) startDemo(); }
  draw(); requestAnimationFrame(frame);
}
function stats() { return G ? { t: +G.t.toFixed(1), lv: G.level, kills: G.kills, flags: G.flags, stage: G.stage, hp: Math.round(G.p.hp), n: G.enemies.length, fever: +G.fever.toFixed(1), best: G.best, crash: G.crashes, hits: G.hits || 0, smk: Math.round(G.smokeT || 0), spinNear: G.enemies.filter(e => Math.hypot(e.x - G.p.x, e.y - G.p.y) < 200).map(e => e.spin > 0 ? 1 : 0).join(''), w: G.w, stk: G.stk || 0, state, boss: G.boss ? Math.round(G.boss.hp) + '/' + Math.round(G.boss.max) + ' p' + G.boss.phase : (G.bossKills || 0) + 'k' } : {}; }
newGame();
if (BOT || HASH.has('start')) state = 'play';
if (HASH.has('fever')) { newGame(); state = 'play'; G.fever = 12; }
if (HASH.has('boss')) { G.flagsList.length = 0; G.flags = 10; startBoss(); }
if (FF) { // 早送り(テスト用)
  if (!G) { newGame(); state = 'play'; }
  for (let i = 0; i < FF * 60 && state !== 'dead'; i++) { if (state === 'levelup') pick(ri(G.opts.length)); if (state === 'play') step(1 / 60); }
}
if (HASH.has('lvl')) openLevelUp();
if (DEV || BOT) { window.__G = () => G; setInterval(() => { console.log('STATE ' + JSON.stringify(stats())); if (HASH.has('dbg') && G) console.log('DBG ' + JSON.stringify({ t: G.t | 0, p: [G.p.x | 0, G.p.y | 0], dir: G.p.dir, tgt: G.botTgt && [G.botTgt.x, G.botTgt.y], flags: G.flagsList.map(f => [f.x, f.y]), lv: G.level })); }, 2000); }
requestAnimationFrame(frame);
