// TERRARIUM GENESIS のルールと見た目。土・水・種・光のペア → 発芽待機 → 草 → 木 → 森(3つつながる)
(() => {
const DG = window.DG, { Sfx } = DG.Audio, { face, TAU } = DG.Art, { COLS, ROWS, CELL, BX, BY } = DG.C;
const N4 = [[0, -1], [1, 0], [0, 1], [-1, 0]];
const FOREST_MIN = 3;

// ---------- ブロックの絵(1x1 の単位空間に描く。四角ではなく、それぞれの生き物の形) ----------
function blob(ctx, pts) { ctx.beginPath(); ctx.moveTo(pts[0][0], pts[0][1]); for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]); ctx.closePath(); }
function grad(ctx, y0, y1, c0, c1) { const g = ctx.createLinearGradient(0, y0, 0, y1); g.addColorStop(0, c0); g.addColorStop(1, c1); return g; }
const F = (ctx, x, y, s, t, ph, col) => face(ctx, x, y, s, { min: 0, t, ph, color: col || '#3a2418' });
function mound(ctx, c0, c1) {
  ctx.fillStyle = grad(ctx, .45, 1, c0, c1); ctx.beginPath();
  ctx.moveTo(0.04, 1); ctx.quadraticCurveTo(0.02, .62, .3, .55); ctx.quadraticCurveTo(.5, .5, .7, .55); ctx.quadraticCurveTo(.98, .62, .96, 1); ctx.closePath(); ctx.fill();
}
const SPRITES = {
  soil(ctx, t, ph) {
    ctx.fillStyle = grad(ctx, .2, 1, '#b07a44', '#6e4220'); ctx.beginPath();
    ctx.moveTo(0, 1); ctx.lineTo(0, .3); ctx.quadraticCurveTo(.25, .12, .5, .27); ctx.quadraticCurveTo(.75, .42, 1, .26); ctx.lineTo(1, 1); ctx.closePath(); ctx.fill();
    ctx.fillStyle = 'rgba(60,30,10,.28)'; for (const [a, b, r] of [[.14, .5, .035], [.82, .62, .04], [.2, .86, .04], [.7, .9, .03], [.9, .42, .03]]) { ctx.beginPath(); ctx.arc(a, b, r, 0, TAU); ctx.fill(); }
    ctx.fillStyle = 'rgba(255,230,180,.35)'; ctx.beginPath(); ctx.ellipse(.3, .3, .1, .03, -.3, 0, TAU); ctx.fill();
    F(ctx, .5, .6, .5, t, ph);
  },
  water(ctx, t, ph) {
    ctx.fillStyle = grad(ctx, .05, 1, '#9fe0ff', '#2f86e6'); ctx.beginPath();
    ctx.moveTo(.5, .04); ctx.bezierCurveTo(.5, .04, .9, .44, .9, .66); ctx.bezierCurveTo(.9, .88, .72, .97, .5, .97); ctx.bezierCurveTo(.28, .97, .1, .88, .1, .66); ctx.bezierCurveTo(.1, .44, .5, .04, .5, .04); ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,.7)'; ctx.lineWidth = .03; ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,.75)'; ctx.beginPath(); ctx.ellipse(.3, .55, .05, .11, .35, 0, TAU); ctx.fill();
    F(ctx, .52, .68, .5, t, ph, '#0b3f78');
  },
  seed(ctx, t, ph) {
    ctx.fillStyle = grad(ctx, .25, .95, '#f0c25a', '#b98425'); ctx.beginPath(); ctx.ellipse(.5, .6, .3, .34, 0, 0, TAU); ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,.5)'; ctx.lineWidth = .03; ctx.stroke();
    ctx.fillStyle = '#4fbf5f'; ctx.beginPath(); ctx.moveTo(.5, .28); ctx.quadraticCurveTo(.7, .05, .82, .2); ctx.quadraticCurveTo(.68, .3, .5, .28); ctx.fill();
    ctx.strokeStyle = '#8a5a14'; ctx.lineWidth = .04; ctx.beginPath(); ctx.moveTo(.5, .3); ctx.lineTo(.5, .22); ctx.stroke();
    F(ctx, .5, .63, .5, t, ph, '#5a3a08');
  },
  light(ctx, t, ph) {
    const g = ctx.createRadialGradient(.5, .5, .05, .5, .5, .5); g.addColorStop(0, 'rgba(255,240,150,.9)'); g.addColorStop(1, 'rgba(255,220,80,0)'); ctx.fillStyle = g; ctx.fillRect(-.1, -.1, 1.2, 1.2);
    ctx.save(); ctx.translate(.5, .5); ctx.rotate(t * .8 + ph);
    ctx.fillStyle = '#ffd23f'; for (let i = 0; i < 8; i++) { ctx.rotate(TAU / 8); ctx.beginPath(); ctx.moveTo(-.07, -.28); ctx.lineTo(0, -.46); ctx.lineTo(.07, -.28); ctx.fill(); }
    ctx.restore();
    ctx.fillStyle = grad(ctx, .25, .75, '#fff7a8', '#ffc42e'); ctx.beginPath(); ctx.arc(.5, .5, .28, 0, TAU); ctx.fill();
    F(ctx, .5, .52, .5, t, ph, '#7a4a00');
  },
  sprout(ctx, t, ph) {
    mound(ctx, '#a8703c', '#6e4220');
    const sw = Math.sin(t * 2.4 + ph) * .03;
    ctx.fillStyle = '#58c968'; for (const d of [-1, 1]) { ctx.beginPath(); ctx.moveTo(.5, .55); ctx.quadraticCurveTo(.5 + d * .28 + sw, .2, .5 + d * .32 + sw, .3); ctx.quadraticCurveTo(.5 + d * .2, .5, .5, .55); ctx.fill(); }
    ctx.strokeStyle = '#3a9a4a'; ctx.lineWidth = .035; ctx.beginPath(); ctx.moveTo(.5, .6); ctx.lineTo(.5, .45); ctx.stroke();
    F(ctx, .5, .8, .38, t, ph);
  },
  grass(ctx, t, ph) {
    mound(ctx, '#a8703c', '#6e4220');
    ctx.lineCap = 'round';
    [[.22, .3, .4], [.36, .12, .52], [.5, .05, .55], [.64, .12, .52], [.78, .3, .4]].forEach(([x, y, b], i) => {
      const sw = Math.sin(t * 2 + ph + i) * .04;
      ctx.strokeStyle = i % 2 ? '#3fae4a' : '#5cd069'; ctx.lineWidth = .1; ctx.beginPath(); ctx.moveTo(x, b + .12); ctx.quadraticCurveTo(x + sw, (y + b) / 2, x + (x - .5) * .3 + sw * 1.5, y); ctx.stroke();
    });
    F(ctx, .5, .8, .38, t, ph);
  },
  tree(ctx, t, ph) {
    ctx.fillStyle = '#8a5a2e'; ctx.beginPath(); ctx.roundRect(.42, .55, .16, .42, .05); ctx.fill();
    const sw = Math.sin(t * 1.8 + ph) * .012;
    for (const [x, y, r, c] of [[.28, .5, .2, '#2f9a4a'], [.72, .5, .2, '#2f9a4a'], [.5, .3, .3, '#45b95c']]) { ctx.fillStyle = c; ctx.beginPath(); ctx.arc(x + sw, y, r, 0, TAU); ctx.fill(); }
    ctx.fillStyle = 'rgba(255,255,255,.25)'; ctx.beginPath(); ctx.ellipse(.38, .2, .09, .05, -.5, 0, TAU); ctx.fill();
    ctx.fillStyle = '#ff5a5a'; ctx.beginPath(); ctx.arc(.74 + sw, .28, .045, 0, TAU); ctx.fill(); ctx.beginPath(); ctx.arc(.22 + sw, .56, .04, 0, TAU); ctx.fill();
    F(ctx, .5 + sw, .38, .46, t, ph, '#12461f');
  },
  wild(ctx, t, ph) {
    const h = (t * 80 + ph * 40) % 360, g = ctx.createRadialGradient(.5, .5, .02, .5, .5, .55);
    g.addColorStop(0, `hsla(${h},100%,85%,.95)`); g.addColorStop(1, `hsla(${(h + 120) % 360},100%,70%,0)`); ctx.fillStyle = g; ctx.fillRect(-.2, -.2, 1.4, 1.4);
    ctx.save(); ctx.translate(.5, .5); ctx.rotate(Math.sin(t * 1.5) * .25);
    ctx.fillStyle = `hsl(${h},95%,72%)`; ctx.beginPath();
    for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4 - Math.PI / 2, r = i % 2 ? .13 : .44; ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r); }
    ctx.closePath(); ctx.fill(); ctx.strokeStyle = '#fff'; ctx.lineWidth = .03; ctx.stroke();
    ctx.restore();
    ctx.fillStyle = '#fff'; for (let i = 0; i < 3; i++) { const a = t * 2 + i * 2.1 + ph; ctx.beginPath(); ctx.arc(.5 + Math.cos(a) * .4, .5 + Math.sin(a) * .4, .03, 0, TAU); ctx.fill(); }
  },
  rock(ctx, t, ph) {
    ctx.fillStyle = grad(ctx, .15, 1, '#c3cbd2', '#8a949c'); ctx.beginPath();
    ctx.moveTo(.1, .9); ctx.quadraticCurveTo(.0, .5, .25, .3); ctx.quadraticCurveTo(.5, .08, .76, .3); ctx.quadraticCurveTo(1, .5, .9, .9); ctx.quadraticCurveTo(.5, 1, .1, .9); ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,.5)'; ctx.lineWidth = .03; ctx.stroke();
    ctx.fillStyle = 'rgba(70,80,90,.25)'; ctx.beginPath(); ctx.arc(.75, .72, .06, 0, TAU); ctx.arc(.22, .72, .04, 0, TAU); ctx.fill();
    face(ctx, .5, .6, .46, { min: 0, sleep: true, color: '#4a5560', cheeks: false });
  },
};

function drawCell(ctx, c, x, y, s, scale, t, idx) {
  const draw = SPRITES[c.t]; if (!draw) return;
  const ph = (x * .031 + y * .017 + (idx || 0)), sq = 1 + 0.03 * Math.sin(t * 3 + ph * 5), sc = s * (scale || 1);
  ctx.save(); ctx.translate(x + s / 2, y + s - (s - sc) / 2 * 0); ctx.scale(sc / sq, sc * sq); ctx.translate(-.5, -1);
  if (c.clr && Math.sin(t * 40) > 0) ctx.globalAlpha = .35;          // 還元されるブロックは点滅
  draw(ctx, t, ph);
  if (c.warn) {          // もうすぐ枯れる: 赤い「!」がぴくぴく
    const p = .5 + .5 * Math.sin(t * 9);
    ctx.fillStyle = `rgba(255,70,70,${.7 + .3 * p})`; ctx.beginPath(); ctx.arc(.84, .16, .15, 0, TAU); ctx.fill();
    ctx.fillStyle = '#fff'; ctx.fillRect(.82, .07, .04, .12); ctx.fillRect(.82, .22, .04, .04);
  }
  ctx.restore();
}

// ---------- 4段階のモード(季節) ----------
// なつ以上は、育てている芽(発芽待機)や草を放っておくと「手」(ペアを置いた回数)で枯れて土に戻る。あらしは予告つきの嵐が来る。
const LV = [
  { name: 'やさしい', season: 'はる', bonus: 1, wither: null, nextN: 2, storm: false, desc: ['ふつうに育てよう'] },
  { name: 'ふつう', season: 'なつ', bonus: 1.25, wither: { sprout: 10, grass: 9 }, nextN: 2, storm: false, desc: ['芽は10手、草は9手で枯れる'] },
  { name: 'むずかしい', season: 'あき', bonus: 1.5, wither: { sprout: 7, grass: 6 }, nextN: 1, storm: false, desc: ['芽7手・草6手で枯れる', 'NEXTは1つだけ'] },
  { name: 'カオス', season: 'あらし', bonus: 2, wither: { sprout: 8, grass: 7 }, nextN: 1, storm: true, desc: ['芽8手・草7手で枯れる', '8手ごとに嵐(予告あり)'] },
];
let LEVEL = 0;
const lvOf = P => LV[(P.stat && P.stat.lv) || 0];
const STORM_EVERY = 8;
function nextStorm(P, from) { P.stat.storm = { turn: from + STORM_EVERY, kind: Math.random() < 0.55 ? 'rock' : 'wild' }; }
// 1手(ペアを置いて連鎖が終わる)ごとに呼ばれる。盤面が変わったら true
function onTurn(P) {
  const lv = lvOf(P), st = P.stat; st.turn = (st.turn || 0) + 1; let changed = false;
  if (lv.wither) {
    for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++) {
      const c = P.grid[y][x]; if (!c || (c.t !== 'sprout' && c.t !== 'grass')) continue;
      const limit = c.t === 'sprout' ? lv.wither.sprout : lv.wither.grass; c.age = (c.age || 0) + 1; c.warn = limit - c.age <= 2;
      if (c.age >= limit) { c.t = 'soil'; c.age = 0; c.warn = false; c.pop = .8; P.burst(x, y, '#b9a27a', 8); changed = true; P.say('育てきれず、枯れてしまいました…', 3, 3); Sfx.lock(); }
    }
  }
  if (lv.storm && st.storm && st.turn >= st.storm.turn) {
    const kind = st.storm.kind; nextStorm(P, st.turn);
    P.rainCells(kind === 'rock' ? 3 : 2, () => ({ t: kind === 'rock' ? 'rock' : 'wild' }), false);
    P.say(kind === 'rock' ? '嵐です! 石が降ってきました。' : '恵みの雨です。命のエネルギーが降ってきました。', 4, 5); changed = true;
  }
  return changed;
}

// ---------- ルール ----------
function weightedType() { const r = Math.random(); return r < .32 ? 'soil' : r < .58 ? 'water' : r < .84 ? 'seed' : 'light'; }
function makePiece() { return { b: [{ t: weightedType() }, { t: weightedType() }], ent: null }; }

function canEvolve(P) {
  const g = P.grid, at = (x, y) => (x >= 0 && x < COLS && y >= 0 && y < ROWS) ? g[y][x] : null;
  const near = (x, y, k) => N4.some(([dx, dy]) => { const c = at(x + dx, y + dy); return c && (c.t === k || c.t === 'wild'); });
  for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++) {
    const c = g[y][x]; if (!c) continue;
    if (c.t === 'grass' && near(x, y, 'light')) return true;
    if (c.t === 'sprout' && near(x, y, 'water')) return true;
    if (c.t === 'seed') { const b = at(x, y + 1); if (b && (b.t === 'soil' || b.t === 'wild')) return true; }
    if (c.t === 'tree') { // 3つ以上つながる?
      let n = 1; const seen = new Set([y * COLS + x]), q = [[x, y]];
      for (let i = 0; i < q.length && n < FOREST_MIN; i++) for (const [dx, dy] of N4) { const nx = q[i][0] + dx, ny = q[i][1] + dy, k = ny * COLS + nx, nc = at(nx, ny); if (nc && nc.t === 'tree' && !seen.has(k)) { seen.add(k); q.push([nx, ny]); n++; } }
      if (n >= FOREST_MIN) return true;
    }
  }
  return false;
}

// 1パス分の進化。1セルは1パスで1回しか変化しない。
function evolve(P) {
  const g = P.grid, used = new Set(), K = (x, y) => y * COLS + x;
  const at = (x, y) => (x >= 0 && x < COLS && y >= 0 && y < ROWS) ? g[y][x] : null;
  const mult = DG.chainMult(P.chain) * lvOf(P).bonus;
  // 1) 森
  const seen = new Set();
  for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++) {
    const c = g[y][x]; if (!c || c.t !== 'tree' || seen.has(K(x, y))) continue;
    const grp = [[x, y]]; seen.add(K(x, y));
    for (let i = 0; i < grp.length; i++) for (const [dx, dy] of N4) { const nx = grp[i][0] + dx, ny = grp[i][1] + dy, nc = at(nx, ny); if (nc && nc.t === 'tree' && !seen.has(K(nx, ny))) { seen.add(K(nx, ny)); grp.push([nx, ny]); } }
    if (grp.length < FOREST_MIN) continue;
    const wilds = Math.ceil(grp.length / 2); grp.sort((a, b) => a[1] - b[1]);
    grp.forEach(([gx, gy], i) => { used.add(K(gx, gy)); if (i < wilds) { g[gy][gx] = P.mk({ t: 'wild' }); g[gy][gx].pop = 1; } else g[gy][gx] = null; P.burst(gx, gy, '#7dff9a', 9); });
    for (const [gx, gy] of grp) for (const [dx, dy] of N4) { const sc = at(gx + dx, gy + dy); if (sc && (sc.t === 'soil' || sc.t === 'rock') && !used.has(K(gx + dx, gy + dy))) { g[gy + dy][gx + dx] = null; P.burst(gx + dx, gy + dy, sc.t === 'rock' ? '#c3cbd2' : '#c48a54', 6); } }
    P.stat.forests++; P.score += Math.round(600 * grp.length * mult); P.flash = 1;
    Sfx.forest(); P.say('見事な森の構築、お見事です、創造主様。', 4, 5);
  }
  function consume(x, y, kind, newType, pts) {
    for (const want of [kind, 'wild']) for (const [dx, dy] of N4) {
      const sx = x + dx, sy = y + dy, s = at(sx, sy);
      if (s && s.t === want && !used.has(K(sx, sy))) { g[sy][sx] = null; used.add(K(sx, sy)); const c = g[y][x]; c.t = newType; c.pop = 1; c.age = 0; c.warn = false; used.add(K(x, y)); P.score += Math.round(pts * mult); P.burst(x, y, '#fff6a0', 6); return true; }
    }
    return false;
  }
  for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++) { const c = g[y][x]; if (c && c.t === 'grass' && !used.has(K(x, y)) && consume(x, y, 'light', 'tree', 100)) { Sfx.grow(); P.say('光合成を確認。木になりました。', 3, 3); } }
  for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++) { const c = g[y][x]; if (c && c.t === 'sprout' && !used.has(K(x, y)) && consume(x, y, 'water', 'grass', 40)) { Sfx.chime(0, 69); P.say('土壌の水分量が規定値に達しました。', 3, 2); } }
  for (let y = 0; y < ROWS - 1; y++) for (let x = 0; x < COLS; x++) {
    const c = g[y][x], b = g[y + 1][x];
    if (c && c.t === 'seed' && !used.has(K(x, y)) && b && (b.t === 'soil' || b.t === 'wild') && !used.has(K(x, y + 1))) { c.t = 'sprout'; c.pop = 1; c.age = 0; c.warn = false; used.add(K(x, y)); P.score += Math.round(10 * mult); Sfx.chime(0, 64); P.say('発芽プロセスに移行します。', 3, 1); }
  }
}

// 同じ種類が4つ以上つながると「還元」されて消える(土・水・種・光だけ)。消えた隣の石も消える。
const REDUCIBLE = new Set(['soil', 'water', 'seed', 'light']);
function findGroups(P) {
  const seen = new Set(), out = [], g = P.grid;
  for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++) {
    const c = g[y][x]; if (!c || !REDUCIBLE.has(c.t) || seen.has(y * COLS + x)) continue;
    const grp = [[x, y]]; seen.add(y * COLS + x);
    for (let i = 0; i < grp.length; i++) for (const [dx, dy] of N4) {
      const nx = grp[i][0] + dx, ny = grp[i][1] + dy; if (nx < 0 || nx >= COLS || ny < 0 || ny >= ROWS || seen.has(ny * COLS + nx)) continue;
      const nc = g[ny][nx]; if (nc && nc.t === c.t) { seen.add(ny * COLS + nx); grp.push([nx, ny]); }
    }
    if (grp.length >= 4) out.push(grp);
  }
  return out;
}
function rocksAround(P, groups) {
  const m = new Map();
  for (const gr of groups) for (const [x, y] of gr) for (const [dx, dy] of N4) { const c = P.grid[y + dy] && P.grid[y + dy][x + dx]; if (c && c.t === 'rock') m.set((y + dy) * COLS + x + dx, [x + dx, y + dy]); }
  return [...m.values()];
}

// ---- CPU 用の盤面評価(高いほどよい) ----
function aiEval(g) {
  const at = (x, y) => (x >= 0 && x < COLS && y >= 0 && y < ROWS) ? g[y][x] : null;
  const nb = (x, y, k) => N4.some(([dx, dy]) => { const c = at(x + dx, y + dy); return c === k || c === 'wild'; });
  let s = 0; const heights = Array(COLS).fill(0), seen = new Set();
  for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++) {
    const k = g[y][x]; if (!k) continue;
    if (!heights[x]) heights[x] = ROWS - y;
    if (k === 'seed') { const b = at(x, y + 1); s += (b === 'soil' || b === 'wild') ? 8 : -1; }
    else if (k === 'sprout') { s += 4; if (nb(x, y, 'water')) s += 14; }
    else if (k === 'water') { if (nb(x, y, 'sprout')) s += 10; }
    else if (k === 'grass') { s += 6; if (nb(x, y, 'light')) s += 16; }
    else if (k === 'light') { if (nb(x, y, 'grass')) s += 12; }
    else if (k === 'tree') { s += 14; for (const [dx, dy] of N4) if (at(x + dx, y + dy) === 'tree') s += 10; }
    else if (k === 'rock') s -= 3;
    if (REDUCIBLE.has(k) && !seen.has(y * COLS + x)) {            // 同じ物が4つ以上つながると消える
      const grp = [[x, y]]; seen.add(y * COLS + x);
      for (let i = 0; i < grp.length; i++) for (const [dx, dy] of N4) { const nx = grp[i][0] + dx, ny = grp[i][1] + dy; if (at(nx, ny) === k && !seen.has(ny * COLS + nx)) { seen.add(ny * COLS + nx); grp.push([nx, ny]); } }
      if (grp.length >= 4) s += 14 + grp.length * 3; else if (grp.length === 3 && k !== 'soil') s += 2;
    }
    if (y > 0 && !g[y - 1][x]) { /* 上が空 */ } else if (y < ROWS - 1 && !g[y + 1][x] && false) { /* 浮き */ }
  }
  for (let x = 0; x < COLS; x++) { const h = heights[x]; s -= h * h * 0.55; if (x === 2 && h >= 9) s -= 60; if (x === 2 && h >= 7) s -= 12; }
  for (let x = 0; x < COLS; x++) for (let y = 1; y < ROWS; y++) if (!g[y][x] && g[y - 1][x]) s -= 4;     // 穴
  return s;
}

const R = DG.terrarium = {
  aiKey: c => c.t, aiEval,
  id: 'terrarium', title: 'TERRARIUM GENESIS', actLabel: '即落下', bonusScale: 0.6, nav: 'θ', bgm: 'terrarium', garbageDiv: 150, ghost: 'cell',
  hello: '管理室、起動しました。創造主様、まずは土を。', overMsg: '土が天井に達しました。再構築しますか?(Enter)',
  tagline: ['育てて進化! 土・水・種・光で', '小さな森をつくろう(4つの季節)'],
  howto: ['種を土にのせる→水→光で木に。木3つで「森」', '同じものが4つつながっても消える'],
  sampleTypes: [{ t: 'soil' }, { t: 'water' }, { t: 'seed' }, { t: 'light' }, { t: 'tree' }],
  theme: { title: '#2f7a45', titleStroke: '#fff', glass: 'rgba(40,80,70,.38)', line: 'rgba(255,255,255,.95)', grid: 'rgba(255,255,255,.13)', danger: 'rgba(255,90,90,.16)', card: 'rgba(30,72,56,.66)', msgBg: 'rgba(30,72,56,.75)', msgText: '#c8ffd8', flash: 'rgba(160,255,190,A)' },
  levels: LV, levelName: () => LV[LEVEL].name, levelBtn: i => `${LV[i].name} ${LV[i].season}`, onTurn,
  setOptions(o) { LEVEL = o.level || 0; },
  init(P) { P.stat = { forests: 0, lv: LEVEL, turn: 0 }; if (LV[LEVEL].storm) nextStorm(P, 0); },
  makePiece, drawCell,
  act(P) { P.hardDrop(); },
  garbageCell() { return { t: 'rock' }; },
  step(P) {
    if (canEvolve(P)) return { pre: 0, post: 0.4, apply() { evolve(P); } };     // 進化が先
    const groups = findGroups(P); if (!groups.length) return null;               // なければ「還元」
    const rocks = rocksAround(P, groups);
    return {
      pre: .3, post: .2,
      mark() { for (const g of groups) for (const [x, y] of g) P.grid[y][x].clr = 1; },
      apply() {
        const mult = DG.chainMult(P.chain) * lvOf(P).bonus; let n = 0;
        for (const g of groups) { for (const [x, y] of g) { P.burst(x, y, '#fff6a0', 7); P.grid[y][x] = null; } n += g.length; }
        for (const [x, y] of rocks) { P.burst(x, y, '#c3cbd2', 6); P.grid[y][x] = null; }
        P.score += Math.round(50 * n * mult); P.stat.reduced = (P.stat.reduced || 0) + n; Sfx.clear(P.chain);
        P.say('余った物質を還元しました。', 3, 3);
      },
    };
  },
  drawBG: (ctx, t, w, h) => DG.Art.bgTerrarium(ctx, t, w, h),
  drawPanel(ctx, P, px, t) {
    const T = (cx, s, x, y, size, col, al) => DG.text(cx, s, x, y, size, col, al, { maxW: al === 'center' ? 150 : 468 - x }), c = '#e8fff0', sub = '#9fd8b4';
    T(ctx, 'SCORE', px, 84, 13, sub); T(ctx, String(P.score), px, 110, 26, '#fff');
    T(ctx, 'BEST', px, 132, 12, sub); T(ctx, String(Math.max(P.best, P.score)), px + 44, 132, 14, c);
    T(ctx, `森 ${P.stat.forests}   最大連鎖 ${P.maxChain}`, px, 154, 13, c);
    T(ctx, 'NEXT', px, 182, 13, sub);
    const lv = lvOf(P);
    P.next.slice(0, lv.nextN).forEach((n, i) => { const x = px + 4 + i * 68; drawCell(ctx, n.b[1], x, 190, 38, 1, t, 1); drawCell(ctx, n.b[0], x, 232, 38, 1, t, 0); });
    T(ctx, 'EVOLUTION', px, 298, 13, sub);
    const row = (y, items) => { let x = px; for (const it of items) { if (!SPRITES[it]) { T(ctx, it, x + 2, y + 18, 15, c); x += it.length > 1 ? 24 : 18; } else { drawCell(ctx, { t: it }, x, y, 26, 1, t, 0); x += 28; } } };
    row(314, ['seed', '+', 'soil', '→', 'sprout']);
    row(346, ['sprout', '+', 'water', '→', 'grass']);
    row(378, ['grass', '+', 'light', '→', 'tree']);
    row(410, ['tree', '×3', '→', 'wild']);
    T(ctx, '同じ4つつなげても きえる', px, 444, 12, '#ffe38a');
    T(ctx, `【${lv.season}】${lv.name} 得点×${lv.bonus}`, px, 462, 12, '#ffe38a');
    lv.desc.forEach((d, i) => T(ctx, d, px, 478 + i * 15, 11, sub));
    if (lv.storm && P.stat.storm) { const left = P.stat.storm.turn - (P.stat.turn || 0); T(ctx, `⛈ あと${left}手: ${P.stat.storm.kind === 'rock' ? '石の雨' : '命の雨'}`, px, 512, 12, P.stat.storm.kind === 'rock' ? '#ffb0b0' : '#b0ffd0'); }
    P.hints.forEach((h, i) => T(ctx, h, px, 530 + i * 15, 11, sub)); T(ctx, 'P 停止  M ミュート', px, 582, 11, sub);
  },
};
DG.terrariumTest = { evolve, canEvolve };
})();
