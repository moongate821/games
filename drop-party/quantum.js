// QUANTUM DROP のルールと見た目。
// 落下中は色が未確定。着地の3マス手前で自動的に「実体化」して色が決まる(Space で早めに観測もできる)。
// もつれペアは片方が決まると相方も決まる(= 同じ色 / ≠ 次の色)。同色4つ以上で消える。盤面に少ない色ほど出やすい。
(() => {
const DG = window.DG, { Sfx } = DG.Audio, { face, TAU } = DG.Art, { COLS, ROWS, CELL, BX, BY } = DG.C;
const MATCH = 4;
// 4段階のモード: 着地の何マス手前で「実体化」(色が決まる)か。難しいほど直前まで見えず、得点は倍率で増える
const LV = [
  { name: 'やさしい', ahead: 3, bonus: 1, line: true, desc: '3マス手前' },
  { name: 'ふつう', ahead: 2, bonus: 1.25, line: true, desc: '2マス手前' },
  { name: 'むずかしい', ahead: 1, bonus: 1.5, line: true, desc: '1マス手前' },
  { name: 'カオス', ahead: 0, bonus: 2, line: false, chaos: true, desc: 'ランダム(1〜4)' },   // ペアごとに距離がバラバラ。軸と副も別々の瞬間に決まる。ラインも出ない
];
let LEVEL = 0;
const lvOf = P => LV[(P.stat && P.stat.qd) || 0];
const COL = ['#ff5a7e', '#4d9bff', '#3fe0a4'], DK = ['#ff9ab0', '#9cc8ff', '#9af0cf'], DEEP = ['#a3153a', '#1b4fae', '#0f8a62'];
const NAMES = ['クォーク', '電子', 'フォトン'];
const N4 = [[0, -1], [1, 0], [0, 1], [-1, 0]];

function counts(P) {
  const n = [0, 0, 0];
  for (const r of P.grid) for (const c of r) if (c && c.c >= 0 && c.c < 3) n[c.c]++;
  if (P.piece) for (const b of P.piece.b) if (b.c >= 0 && b.c < 3) n[b.c]++;
  return n;
}
function probs(P) { const n = counts(P), w = n.map(v => 1 / Math.sqrt(v + 1.5)), s = w[0] + w[1] + w[2]; return w.map(v => v / s); }
function pickColor(P) { const p = probs(P); let r = Math.random(); for (let i = 0; i < 3; i++) { if (r < p[i]) return i; r -= p[i]; } return 2; }
// i: 0=軸 1=副。もつれていれば相方も同時に確定
function collapse(P, i) {
  const p = P.piece; if (!p || p.b[i].c >= 0) return false;
  const col = pickColor(P); p.b[i].c = col;
  if (p.ent && p.b[1 - i].c < 0) p.b[1 - i].c = p.ent === 'same' ? col : (col + (i === 0 ? 1 : 2)) % 3;
  return true;
}
function materialize(P, why) {
  const p = P.piece, [sx, sy] = P.satPos(p.px, p.py, p.rot);
  P.burst(p.px, p.py, '#fff', 8); P.burst(sx, sy, '#fff', 8);
  if (why === 'auto') { Sfx.materialize(); P.say(p.ent ? 'もつれ解除。色がきまったよ。' : '実体化。ここから先は変えられないよ。', 2.5, 2); }
}

function randPair() { return { b: [{ c: -1 }, { c: -1 }], ent: Math.random() < 0.5 ? (Math.random() < 0.5 ? 'same' : 'shift') : null }; }

// ---- 特殊ブロック(7つ目のペアごとに1つ。NEXT に出るので事前にわかる) ----
//   BOMB(4)   = 崩壊弾: 落ちた先(真下)の色を、盤面から全部消す
//   WILD(5)   = 重ね合わせ: どの色にもなる万能ブロック(つながった色の仲間に数える)
const BOMB = 4, WILD = 5, SPECIAL_EVERY = 7;
function makePiece(P) {
  const st = P.stat; st.gen = (st.gen || 0) + 1;
  if (st.gen % SPECIAL_EVERY === 0) { const kind = (st.gen / SPECIAL_EVERY) % 2 === 1 ? BOMB : WILD; return { b: [{ c: kind }, { c: -1 }], ent: null, special: kind }; }
  return randPair();
}
const SPECIAL_NAME = { 4: '崩壊弾', 5: '万能' };
// 特殊ペアが何手あとに落ちてくるか(1=次のペア)
function untilSpecial(P) { const cur = (P.stat.gen || 0) - 2; return (Math.floor(cur / SPECIAL_EVERY) + 1) * SPECIAL_EVERY - cur; }

function findMatches(P) {
  const out = [], g = P.grid;
  for (let col = 0; col < 3; col++) {
    const seen = Array.from({ length: ROWS }, () => Array(COLS).fill(false));
    for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++) {
      const c = g[y][x]; if (!c || c.c !== col || seen[y][x]) continue;
      const grp = [[x, y]]; seen[y][x] = true;
      for (let i = 0; i < grp.length; i++) for (const [dx, dy] of N4) {
        const nx = grp[i][0] + dx, ny = grp[i][1] + dy; if (nx < 0 || nx >= COLS || ny < 0 || ny >= ROWS || seen[ny][nx]) continue;
        const nc = g[ny][nx]; if (nc && (nc.c === col || nc.c === WILD)) { seen[ny][nx] = true; grp.push([nx, ny]); }   // 万能は どの色のつながりにも入れる
      }
      if (grp.length >= MATCH) out.push(grp);
    }
  }
  return out;
}
// 崩壊弾が消す色: 真下 → 左右上 → 盤面で一番多い色
function bombTarget(P, x, y) {
  const at = (a, b) => (P.grid[b] && P.grid[b][a]) || null;
  for (const [dx, dy] of [[0, 1], [-1, 0], [1, 0], [0, -1]]) { const c = at(x + dx, y + dy); if (c && c.c >= 0 && c.c < 3) return c.c; }
  const n = counts(P); const m = Math.max(...n); return m > 0 ? n.indexOf(m) : -1;
}
function noiseAround(P, groups) {
  const set = new Map();
  for (const g of groups) for (const [x, y] of g) for (const [dx, dy] of N4) { const c = P.grid[y + dy] && P.grid[y + dy][x + dx]; if (c && c.c === 3) set.set((y + dy) * COLS + x + dx, [x + dx, y + dy]); }
  return [...set.values()];
}

// ---------- 見た目 ----------
function glyph(ctx, c, cx, cy, r) {
  ctx.beginPath();
  if (c === 0) ctx.arc(cx, cy, r, 0, TAU);
  else if (c === 1) { ctx.moveTo(cx, cy - r); ctx.lineTo(cx + r, cy); ctx.lineTo(cx, cy + r); ctx.lineTo(cx - r, cy); ctx.closePath(); }
  else { ctx.moveTo(cx, cy - r); ctx.lineTo(cx + r, cy + r * .8); ctx.lineTo(cx - r, cy + r * .8); ctx.closePath(); }
}
// かわいい素粒子。色だけでなく形も違う: 赤=クォーク(ふわふわ+3色の点) 青=電子(軌道の輪) 緑=フォトン(光のきらめき)
const ORBIT = { rx: .46, ry: .17, rot: -.55 };
function paintParticle(ctx, c, s, flashOn) {
  const cx = s / 2, cy = s / 2, r = s * .34, flash = flashOn;
  const body = (rad) => { const g = ctx.createRadialGradient(cx - rad * .35, cy - rad * .4, rad * .1, cx, cy, rad * 1.1); g.addColorStop(0, flash ? '#fff' : DK[c]); g.addColorStop(.55, COL[c]); g.addColorStop(1, DEEP[c]); return g; };
  ctx.shadowColor = COL[c]; ctx.shadowBlur = flash ? s * .6 : s * .22;
  if (c === 0) {                                // クォーク: ふわふわの縁
    ctx.fillStyle = body(r * 1.2);
    for (let i = 0; i < 9; i++) { const a = i * TAU / 9; ctx.beginPath(); ctx.arc(cx + Math.cos(a) * r * .86, cy + Math.sin(a) * r * .86, r * .38, 0, TAU); ctx.fill(); }
    ctx.beginPath(); ctx.arc(cx, cy, r * .95, 0, TAU); ctx.fill();
    ctx.shadowBlur = 0;
    for (const [dx, col] of [[-1, '#ff6b8a'], [0, '#5cf0b0'], [1, '#6aa8ff']]) { ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(cx + dx * s * .1, cy - r * .66, s * .052, 0, TAU); ctx.fill(); ctx.fillStyle = col; ctx.beginPath(); ctx.arc(cx + dx * s * .1, cy - r * .66, s * .036, 0, TAU); ctx.fill(); }
  } else if (c === 1) {                         // 電子: まるい体と、まわる軌道
    ctx.fillStyle = body(r); ctx.beginPath(); ctx.arc(cx, cy, r * .92, 0, TAU); ctx.fill(); ctx.shadowBlur = 0;
    ctx.strokeStyle = 'rgba(210,235,255,.95)'; ctx.lineWidth = s * .04; ctx.beginPath(); ctx.ellipse(cx, cy, s * ORBIT.rx, s * ORBIT.ry, ORBIT.rot, 0, TAU); ctx.stroke();
    ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(cx + s * .13, cy - s * .27, s * .075, 0, TAU); ctx.fill();     // 「−」の電荷バッジ
    ctx.fillStyle = DEEP[1]; ctx.fillRect(cx + s * .13 - s * .04, cy - s * .27 - s * .01, s * .08, s * .02);
  } else {                                      // フォトン: やわらかい4方向のきらめき
    const R = s * .46, k = .26; ctx.fillStyle = body(R);
    ctx.beginPath(); ctx.moveTo(cx, cy - R); ctx.quadraticCurveTo(cx + k * R, cy - k * R, cx + R, cy); ctx.quadraticCurveTo(cx + k * R, cy + k * R, cx, cy + R);
    ctx.quadraticCurveTo(cx - k * R, cy + k * R, cx - R, cy); ctx.quadraticCurveTo(cx - k * R, cy - k * R, cx, cy - R); ctx.fill();
    ctx.beginPath(); ctx.arc(cx, cy, r * .86, 0, TAU); ctx.fill(); ctx.shadowBlur = 0;
    ctx.strokeStyle = 'rgba(255,255,255,.75)'; ctx.lineWidth = s * .03; ctx.beginPath(); ctx.arc(cx, cy, r * .86, 0, TAU); ctx.stroke();
  }
  ctx.fillStyle = 'rgba(255,255,255,.6)'; ctx.beginPath(); ctx.ellipse(cx - r * .42, cy - r * .5, r * .2, r * .1, -.6, 0, TAU); ctx.fill();
  face(ctx, cx, cy + s * (c === 0 ? .08 : .06), s * .44, { min: 0, color: '#2a1030' });
}
// 確定ブロック・ノイズは見た目が変わらないので、一度だけ描いて使い回す(shadowBlur は重いので毎フレームは使わない)
const SPR = new Map();
function sprite(c, flash, s) {
  const S = Math.round(s), key = c + '|' + (flash ? 1 : 0) + '|' + S;
  let cv = SPR.get(key); if (cv) return cv;
  const dpr = 2, pad = Math.ceil(S * .3);
  cv = document.createElement('canvas'); cv.width = (S + pad * 2) * dpr; cv.height = (S + pad * 2) * dpr; cv.pad = pad;
  const g = cv.getContext('2d'); g.scale(dpr, dpr); g.translate(pad, pad);
  paintCell(g, c, flash, 0, 0, S, 0);
  SPR.set(key, cv); return cv;
}
function drawCell(ctx, cell, x, y, s, scale, t, idx) {
  const c = cell.c;
  if (c >= 4) { paintSpecial(ctx, cell, x, y, s, scale || 1, t || 0); return; }
  if (c >= 0) {
    const flash = !!cell.clr && Math.sin(t * 40) > 0, cv = sprite(c, flash, s), sc = scale || 1, sz = cv.width / 2;
    ctx.drawImage(cv, x + s / 2 - sz / 2 * sc, y + s / 2 - sz / 2 * sc, sz * sc, sz * sc);
    if (c === 1) {         // 電子は軌道の上を小さな電子がくるくる回る
      const a = (t || 0) * 5 + (x + y) * .05, ox = Math.cos(a) * s * ORBIT.rx, oy = Math.sin(a) * s * ORBIT.ry, cr = Math.cos(ORBIT.rot), sr = Math.sin(ORBIT.rot);
      ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(x + s / 2 + (ox * cr - oy * sr) * sc, y + s / 2 + (ox * sr + oy * cr) * sc, s * .06 * sc, 0, TAU); ctx.fill();
    }
    return;
  }
  paintCell(ctx, c, false, x, y, s, scale, t, idx);
}
function paintCell(ctx, c, flashOn, x, y, s, scale, t, idx) {
  ctx.save(); ctx.translate(x + s / 2, y + s / 2); ctx.scale(scale || 1, scale || 1); ctx.translate(-s / 2, -s / 2);
  const m = s * .06, w = s - m * 2, rad = s * .3;
  if (c < 0) {                                  // 未確定: ぼんやり揺れる「確率の雲」(どの粒子か決まっていない)
    const tt = t * 9 + (idx || 0) * 7, cx = s / 2, cy = s / 2;
    for (let i = 0; i < 5; i++) {               // 重なった淡い玉が3色にゆらぐ
      const a = tt * (.6 + i * .15) + i * 1.3, rr = s * (.2 + .03 * Math.sin(tt * 1.3 + i)), col = COL[i % 3];
      ctx.globalAlpha = .55; ctx.fillStyle = col; ctx.beginPath(); ctx.arc(cx + Math.cos(a) * s * .1, cy + Math.sin(a * 1.2) * s * .1, rr, 0, TAU); ctx.fill();
    }
    ctx.globalAlpha = 1; ctx.fillStyle = 'rgba(235,240,255,.55)'; ctx.beginPath(); ctx.arc(cx, cy, s * .27, 0, TAU); ctx.fill();
    ctx.strokeStyle = 'rgba(210,225,255,.9)'; ctx.setLineDash([s * .08, s * .07]); ctx.lineDashOffset = -tt * s * .3; ctx.lineWidth = s * .035; ctx.beginPath(); ctx.arc(cx, cy, s * .4, 0, TAU); ctx.stroke(); ctx.setLineDash([]);
    ctx.fillStyle = 'rgba(255,255,255,.9)'; ctx.font = `bold ${s * .42}px sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('?', cx, cy + s * .03);
    for (let i = 0; i < 3; i++) { const a = tt * 1.4 + i * 2.1; ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(cx + Math.cos(a) * s * .38, cy + Math.sin(a) * s * .38, s * .03, 0, TAU); ctx.fill(); }
  } else if (c === 3) {                          // おじゃま(ノイズ)
    ctx.fillStyle = '#3b3f55'; ctx.beginPath(); ctx.roundRect(m, m, w, w, rad * .8); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,.12)'; for (let i = 0; i < 5; i++) for (let j = 0; j < 5; j++) if ((i + j) % 2 === 0) ctx.fillRect(m + i * w / 5, m + j * w / 5, w / 5, w / 5);
    ctx.strokeStyle = '#8a90b0'; ctx.lineWidth = s * .035; ctx.beginPath(); ctx.roundRect(m, m, w, w, rad * .8); ctx.stroke();
    face(ctx, s / 2, s * .52, s * .55, { min: 0, sleep: true, color: '#cdd2ee', cheeks: false });
  } else paintParticle(ctx, c, s, flashOn);
  ctx.restore();
}
// 特殊ブロック。金色の輪が脈打つので、ふつうのブロックと見分けがつく
function paintSpecial(ctx, cell, x, y, s, scale, t) {
  ctx.save(); ctx.translate(x + s / 2, y + s / 2); ctx.scale(scale, scale);
  if (cell.clr && Math.sin(t * 40) > 0) ctx.globalAlpha = .4;
  const r = s * .4, pulse = .6 + .4 * Math.sin(t * 7);
  if (cell.c === BOMB) {
    const g = ctx.createRadialGradient(-r * .3, -r * .4, r * .1, 0, 0, r); g.addColorStop(0, '#6a5a9a'); g.addColorStop(.6, '#2a1f4a'); g.addColorStop(1, '#0a0618');
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, s * .04, r, 0, TAU); ctx.fill();
    ctx.strokeStyle = '#c9b48a'; ctx.lineWidth = s * .05; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(s * .08, -r * .85); ctx.quadraticCurveTo(s * .2, -r * 1.25, s * .3, -r * 1.2); ctx.stroke();
    ctx.fillStyle = `rgba(255,${150 + 80 * pulse | 0},60,1)`; ctx.beginPath(); ctx.arc(s * .3, -r * 1.2, s * (.07 + .03 * pulse), 0, TAU); ctx.fill();
    ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.ellipse(-r * .45, -r * .35, r * .18, r * .1, -.6, 0, TAU); ctx.fill();
    face(ctx, 0, s * .06, s * .52, { min: 0, t, color: '#fff', mood: 'o', cheeks: false });
  } else {
    const h = (t * 120) % 360, g = ctx.createRadialGradient(-r * .3, -r * .4, r * .1, 0, 0, r);
    g.addColorStop(0, `hsl(${h},100%,88%)`); g.addColorStop(.6, `hsl(${(h + 90) % 360},95%,65%)`); g.addColorStop(1, `hsl(${(h + 200) % 360},90%,50%)`);
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, r, 0, TAU); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,.85)'; ctx.beginPath(); ctx.ellipse(-r * .4, -r * .45, r * .2, r * .1, -.6, 0, TAU); ctx.fill();
    face(ctx, 0, s * .04, s * .5, { min: 0, t, color: '#3a1a4a' });
  }
  ctx.globalAlpha = 1; ctx.strokeStyle = `rgba(255,214,90,${.55 + .45 * pulse})`; ctx.lineWidth = s * .06; ctx.setLineDash([s * .12, s * .08]); ctx.lineDashOffset = -t * 20;
  ctx.beginPath(); ctx.arc(0, 0, s * .47, 0, TAU); ctx.stroke(); ctx.setLineDash([]);
  ctx.restore();
}
function drawThread(ctx, x1, y1, x2, y2, ent, t) {
  ctx.save(); ctx.strokeStyle = `rgba(215,175,255,${.6 + .35 * Math.sin(t * 10)})`; ctx.lineWidth = 3; ctx.shadowColor = '#c9a0ff'; ctx.shadowBlur = 8;
  ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke(); ctx.shadowBlur = 0;
  const mx = (x1 + x2) / 2, my = (y1 + y2) / 2;
  ctx.fillStyle = '#2a1458'; ctx.beginPath(); ctx.arc(mx, my, 10, 0, TAU); ctx.fill(); ctx.strokeStyle = '#d9bfff'; ctx.lineWidth = 1.5; ctx.stroke();
  DG.text(ctx, ent === 'same' ? '=' : '≠', mx, my + 6, 16, '#efe0ff', 'center'); ctx.restore();
}

// ---- CPU 用の盤面評価(高いほどよい) ----
function aiEval(g) {
  const seen = new Set(), N = [[0, -1], [1, 0], [0, 1], [-1, 0]]; let s = 0;
  const at = (x, y) => (x >= 0 && x < COLS && y >= 0 && y < ROWS) ? g[y][x] : null;
  const clear = [];
  for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++) {
    const k = g[y][x];
    if (k === BOMB) { const b = at(x, y + 1); if (b != null && b >= 0 && b < 3) s += 30; continue; }     // 崩壊弾は色の上に置くと得
    if (k === WILD) { s += 8; continue; }
    if (k == null || k < 0 || k > 2 || seen.has(y * COLS + x)) continue;
    const grp = [[x, y]]; seen.add(y * COLS + x);
    for (let i = 0; i < grp.length; i++) for (const [dx, dy] of N) { const nx = grp[i][0] + dx, ny = grp[i][1] + dy; if (at(nx, ny) === k && !seen.has(ny * COLS + nx)) { seen.add(ny * COLS + nx); grp.push([nx, ny]); } }
    if (grp.length >= MATCH) { s += 60 + grp.length * 12; clear.push(...grp); } else s += grp.length === 3 ? 16 : grp.length === 2 ? 5 : 0;
  }
  const h = Array(COLS).fill(0), cut = new Set(clear.map(([x, y]) => y * COLS + x));
  for (let x = 0; x < COLS; x++) { for (let y = 0; y < ROWS; y++) if (g[y][x] != null && !cut.has(y * COLS + x)) { h[x] = ROWS - y; break; } }
  for (let x = 0; x < COLS; x++) { s -= h[x] * h[x] * 0.55; if (x === 2 && h[x] >= 9) s -= 60; if (x === 2 && h[x] >= 7) s -= 12; }
  for (let x = 0; x < COLS; x++) for (let y = 1; y < ROWS; y++) if (g[y][x] == null && g[y - 1][x] != null && !cut.has((y - 1) * COLS + x)) s -= 4;
  return s;
}

const R = DG.quantum = {
  aiKey: c => c.c, aiEval,
  // AIは色を知らないまま置き場所を決める: 確率で重みづけした色の組み合わせごとに評価して平均する
  aiVariants(P) {
    const p = P.piece, pr = probs(P), [a, b] = p.b, out = [];
    if (a.c >= 0 && b.c >= 0) return [{ w: 1, keys: [a.c, b.c] }];
    if (a.c >= 0) { for (let k = 0; k < 3; k++) out.push({ w: pr[k], keys: [a.c, k] }); return out; }
    if (p.ent) { for (let k = 0; k < 3; k++) out.push({ w: pr[k], keys: [k, p.ent === 'same' ? k : (k + 1) % 3] }); return out; }
    for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) out.push({ w: pr[i] * pr[j], keys: [i, j] });
    return out;
  },
  id: 'quantum', title: 'QUANTUM DROP', actLabel: '観測', nav: 'エル', bgm: 'quantum', garbageDiv: 120, ghost: 'outline',
  hello: 'あー、観測者くん。宇宙が崩れる前に、ひとつよろしく。', overMsg: '真空崩壊、進行中。…もう一回、ループしてみる?(Enter)',
  levels: LV, setOptions(o) { LEVEL = o.level || 0; }, levelName: () => LV[LEVEL].name, levelCount: 4,
  tagline: ['ふわふわ「確率の雲」の素粒子が', '直前に「実体化」!(4段階)'],
  howto: ['同じ粒子を4つつなげて消そう', 'もつれペアは 片方が決まると 相方も決まる'],
  sampleTypes: [{ c: 0 }, { c: 1 }, { c: 2 }, { c: -1 }, { c: 3 }],
  theme: { title: '#d8e4ff', titleStroke: '#3a1a7a', glass: 'rgba(25,15,80,.5)', line: 'rgba(170,195,255,.9)', grid: 'rgba(170,195,255,.1)', danger: 'rgba(255,90,140,.14)', card: 'rgba(22,12,66,.72)', msgBg: 'rgba(22,12,66,.78)', msgText: '#bcd8ff', flash: 'rgba(150,180,255,A)' },
  init(P) { P.stat = { cleared: 0, seenEnt: false, qd: LEVEL }; },
  makePiece, drawCell, drawThread,
  onSpawn(P) {
    const p = P.piece, lv = lvOf(P);
    // このペアが実体化する距離(カオスはペアごとにランダム。副は軸より1マス遅れる)
    p.ahead = lv.chaos ? 1 + Math.floor(Math.random() * 4) : lv.ahead; p.aheadB = lv.chaos ? p.ahead - 1 : p.ahead;
    if (p.ent && !P.stat.seenEnt) { P.stat.seenEnt = true; P.say('そことそこ、もつれてる。片方が決まれば、もう片方も決まるよ。', 5, 4); }
    const nx = P.next[0];      // 次が特殊ブロックなら、落ちてくる前に知らせる
    if (nx && nx.special) P.say(nx.special === BOMB ? '次は特殊「崩壊弾」。落ちた先の色が全部消えるよ。' : '次は特殊「万能」。どの色にもなれるよ。', 4, 4);
    if (p.special) P.say(p.special === BOMB ? '崩壊弾だ。消したい色の上に落としてごらん。' : '万能ブロックだ。色をつなげてみて。', 3, 3);
  },
  act(P) {   // 観測: 1回目=軸、2回目=副(もつれは同時)
    if (P.phase !== 'play') return;
    if (collapse(P, 0) || collapse(P, 1)) { P.stat.obs = (P.stat.obs || 0) + 1; Sfx.zap(); materialize(P, 'manual'); P.say(P.piece.ent ? 'そこはもつれてる。片方を確定させたら、もう片方も収束したろ?' : '今の観測タイミング、悪くないね。', 2.5, 2); }
  },
  update(P) {   // 着地の p.ahead マス手前で実体化(モードで 3/2/1/ランダム)
    const p = P.piece; if (!p || (p.b[0].c >= 0 && p.b[1].c >= 0) || (p.age || 0) < .6) return;     // 出現直後は雲のまま
    const d = P.landing() - p.py; let did = false;
    if (d <= p.ahead && collapse(P, 0)) did = true;
    if (d <= p.aheadB && collapse(P, 1)) did = true;
    if (did) materialize(P, 'auto');
  },
  finalize(P, p) { const [, sy] = P.satPos(p.px, p.py, p.rot); for (const i of (sy > p.py ? [1, 0] : [0, 1])) collapse(P, i); },
  garbageCell() { return { c: 3 }; },
  step(P) {
    // 崩壊弾が先に爆発する
    const bombs = []; for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++) { const c = P.grid[y][x]; if (c && c.c === BOMB) bombs.push([x, y]); }
    if (bombs.length) {
      const colors = new Set(bombs.map(([x, y]) => bombTarget(P, x, y)).filter(v => v >= 0));
      const targets = []; for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++) { const c = P.grid[y][x]; if (c && colors.has(c.c)) targets.push([x, y]); }
      return {
        pre: .5, post: .15,
        mark() { for (const [x, y] of bombs.concat(targets)) P.grid[y][x].clr = 1; Sfx.zap(); },
        apply() {
          const mult = DG.chainMult(P.chain) * lvOf(P).bonus;
          for (const [x, y] of bombs.concat(targets)) { const c = P.grid[y][x]; P.burst(x, y, c.c < 3 ? COL[c.c] : '#ffd34d', 9); P.grid[y][x] = null; }
          P.stat.bombs = (P.stat.bombs || 0) + bombs.length; P.stat.cleared += targets.length; P.score += 80 * targets.length * mult + 200 * bombs.length; P.flash = 1; P.shake = Math.max(P.shake, 9); Sfx.clear(P.chain + 3);
          P.say(targets.length ? `崩壊弾! ${[...colors].map(c => NAMES[c]).join('と')}を ${targets.length}こ 消した` : '崩壊弾は不発だったよ', 3, 5);
        },
      };
    }
    const groups = findMatches(P); if (!groups.length) return null;
    const noise = noiseAround(P, groups);
    return {
      pre: .35, post: 0,
      mark() { for (const g of groups) for (const [x, y] of g) P.grid[y][x].clr = 1; },
      apply() {
        const mult = DG.chainMult(P.chain) * lvOf(P).bonus; let n = 0;
        for (const g of groups) { let m = 0; for (const [x, y] of g) { const c = P.grid[y][x]; if (!c) continue; P.burst(x, y, c.c < 3 ? COL[c.c] : '#fff', 8); P.grid[y][x] = null; m++; } n += m; P.score += 100 * m * mult + Math.max(0, m - MATCH) * 50; }
        for (const [x, y] of noise) { P.burst(x, y, '#9aa0c0', 6); P.grid[y][x] = null; }
        P.stat.cleared += n; P.flash = .6; Sfx.clear(P.chain);
        P.say(P.chain >= 2 ? '連鎖崩壊…君、宇宙の寿命を延ばしてるよ。' : 'このセクターの物理法則は保たれた。', 3, P.chain >= 2 ? 5 : 3);
      },
    };
  },
  drawPieceExtra(ctx, P, gy, t) {
    const p = P.piece; if (p.b[0].c >= 0 && p.b[1].c >= 0 || !lvOf(P).line) return;      // カオスはラインを出さない
    const ly = BY + (gy - p.ahead) * CELL;
    if (gy - p.ahead <= p.py) return;
    ctx.save(); ctx.strokeStyle = 'rgba(255,230,140,.7)'; ctx.setLineDash([6, 6]); ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(BX, ly); ctx.lineTo(BX + COLS * CELL, ly); ctx.stroke(); ctx.setLineDash([]);
    DG.text(ctx, '実体化ライン', BX + COLS * CELL - 4, ly - 3, 11, 'rgba(255,230,140,.85)', 'right'); ctx.restore();
  },
  drawBG: (ctx, t, w, h) => DG.Art.bgQuantum(ctx, t, w, h),
  drawPanel(ctx, P, px, t) {
    const T = (cx, s, x, y, size, col, al) => DG.text(cx, s, x, y, size, col, al, { maxW: al === 'center' ? 150 : 468 - x }), c = '#e6eeff', sub = '#9db4ee', n = counts(P), pr = probs(P);
    T(ctx, 'SCORE', px, 84, 13, sub); T(ctx, String(P.score), px, 110, 26, '#fff');
    T(ctx, 'BEST', px, 132, 12, sub); T(ctx, String(Math.max(P.best, P.score)), px + 44, 132, 14, c);
    T(ctx, `消去 ${P.stat.cleared}  最大連鎖 ${P.maxChain}`, px, 154, 13, c);
    T(ctx, 'NEXT', px, 182, 13, sub);
    P.next.forEach((nx, i) => { const x = px + 4 + i * 68; drawCell(ctx, nx.b[1], x, 190, 36, 1, t, i * 2 + 1); drawCell(ctx, nx.b[0], x, 232, 36, 1, t, i * 2); if (nx.ent) drawThread(ctx, x + 18, 226, x + 18, 232, nx.ent, t); if (nx.special) T(ctx, '特殊!', x + 18, 284, 12, '#ffd34d', 'center'); });
    T(ctx, 'COLLAPSE PROBABILITY', px, 296, 12, sub);
    for (let i = 0; i < 3; i++) {
      const y = 306 + i * 26;
      ctx.fillStyle = 'rgba(255,255,255,.12)'; DG.rr(ctx, px, y, 150, 19, 6); ctx.fill();
      ctx.fillStyle = COL[i]; DG.rr(ctx, px, y, Math.max(8, 150 * pr[i]), 19, 6); ctx.fill();
      T(ctx, `${NAMES[i]} ${Math.round(pr[i] * 100)}%  (${n[i]})`, px + 7, y + 14, 12, '#fff');
    }
    T(ctx, 'すくない粒子ほど出やすい', px, 396, 12, sub);
    const u = untilSpecial(P), G = ((P.stat.gen || 0) - 2) + u, kind = (G / SPECIAL_EVERY) % 2 === 1 ? BOMB : WILD;
    T(ctx, `★${SPECIAL_NAME[kind]} ${u === 1 ? 'つぎ!' : 'あと' + u + '手'}`, px, 418, 13, '#ffd34d');
    T(ctx, kind === BOMB ? '落ちた先の色を全部消す' : 'どの色にもなる万能', px, 434, 11, sub);
    const lv = lvOf(P);
    T(ctx, `【${lv.name}】得点×${lv.bonus}`, px, 454, 12, '#ffe38a');
    T(ctx, `${lv.desc}で実体化`, px, 470, 12, '#ffe38a');
    T(ctx, '観測キーで先に実体化', px, 488, 12, c);
    P.hints.forEach((h, i) => T(ctx, h, px, 510 + i * 17, 12, sub)); T(ctx, 'P 停止  M ミュート', px, 566, 12, sub);
  },
};
DG.quantumTest = { findMatches, collapse, probs, counts };
})();
