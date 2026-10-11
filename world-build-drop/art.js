// 絵: 「概念の海」の背景(星空・海・漂う言葉・うっすら浮かぶ部屋の輪郭)。画像ファイルなし。
(() => {
const DG = window.DG = window.DG || {};
const TAU = Math.PI * 2;
function rng(seed) { return () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
const SERIF = '"Yu Mincho","Hiragino Mincho ProN","MS Mincho","Noto Serif JP",serif';

const R = rng(21), STARS = [], WORDS = [], MOTES = [];
for (let i = 0; i < 140; i++) STARS.push({ x: R(), y: R() * .8, s: .6 + R() * 1.7, ph: R() * 9, sp: 1 + R() * 3 });
const FLOAT = ['人', '死', '時間', '魔法', '機械', '帝国', '恋', '土', '水', '空間', '剣', '星', '毒', '夢', '海', '竜', '物語', '章', '詩', '世界'];
for (let i = 0; i < 16; i++) WORDS.push({ w: FLOAT[i % FLOAT.length], x: R(), y: R(), s: 24 + R() * 26, v: 6 + R() * 10, a: .08 + R() * .14, ph: R() * 9 });
for (let i = 0; i < 40; i++) MOTES.push({ x: R(), y: R(), v: 5 + R() * 14, ph: R() * 9, s: 1 + R() * 2 });

const CACHE = {};      // 動かない下地(グラデーション・星雲・部屋の輪郭)は一度だけ描く
function base(w, h) {
  const k = w + 'x' + h; if (CACHE[k]) return CACHE[k];
  const c = CACHE[k] = document.createElement('canvas'); c.width = w; c.height = h; const g = c.getContext('2d');
  const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#080c2a'); gr.addColorStop(.5, '#141c4a'); gr.addColorStop(1, '#2a1f48');
  g.fillStyle = gr; g.fillRect(0, 0, w, h);
  for (const [cx, cy, col] of [[.25, .25, 'rgba(120,150,255,.16)'], [.8, .5, 'rgba(255,190,120,.10)'], [.45, .95, 'rgba(180,120,255,.18)']]) {
    const rg = g.createRadialGradient(cx * w, cy * h, 10, cx * w, cy * h, 320); rg.addColorStop(0, col); rg.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = rg; g.fillRect(0, 0, w, h);
  }
  // うっすら浮かぶ生活空間の輪郭: 窓・ぶら下がるランプ・本棚・机
  g.strokeStyle = 'rgba(255,230,180,.10)'; g.lineWidth = 3; g.fillStyle = 'rgba(255,230,180,.04)';
  const wx = w * .70, wy = h * .08, ww = Math.min(260, w * .28), wh = ww * 1.15;
  g.strokeRect(wx, wy, ww, wh); g.beginPath(); g.moveTo(wx + ww / 2, wy); g.lineTo(wx + ww / 2, wy + wh); g.moveTo(wx, wy + wh / 2); g.lineTo(wx + ww, wy + wh / 2); g.stroke();
  g.fillRect(wx, wy, ww, wh);
  const lx = w * .50, ly = h * .02; g.beginPath(); g.moveTo(lx, 0); g.lineTo(lx, ly + 60); g.stroke();
  g.beginPath(); g.moveTo(lx - 34, ly + 100); g.quadraticCurveTo(lx, ly + 40, lx + 34, ly + 100); g.closePath(); g.stroke();
  const lg = g.createRadialGradient(lx, ly + 104, 4, lx, ly + 104, 190); lg.addColorStop(0, 'rgba(255,220,150,.22)'); lg.addColorStop(1, 'rgba(255,220,150,0)'); g.fillStyle = lg; g.fillRect(lx - 200, ly, 400, 330);
  g.strokeStyle = 'rgba(255,230,180,.09)';
  const bx = w * .03, by = h * .30, bw = Math.min(190, w * .2), bh = h * .46;      // 本棚
  g.strokeRect(bx, by, bw, bh); for (let i = 1; i < 5; i++) { g.beginPath(); g.moveTo(bx, by + bh * i / 5); g.lineTo(bx + bw, by + bh * i / 5); g.stroke(); }
  for (let i = 0; i < 5; i++) for (let j = 0; j < 6; j++) { if ((i * 7 + j * 3) % 4 === 0) continue; g.strokeRect(bx + 8 + j * (bw - 16) / 6, by + bh * i / 5 + 8, (bw - 16) / 6 - 3, bh / 5 - 8); }
  g.beginPath(); g.moveTo(0, h * .88); g.lineTo(w, h * .88); g.stroke();                // 机
  return c;
}
function wave(ctx, w, h, y0, amp, freq, ph, col, t) {
  ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(0, h);
  for (let x = 0; x <= w; x += 10) ctx.lineTo(x, y0 + Math.sin(x * freq + ph + t * .5) * amp + Math.sin(x * freq * 2.3 + t * .8) * amp * .3);
  ctx.lineTo(w, h); ctx.closePath(); ctx.fill();
}
function bgWorld(ctx, t, w, h) {
  ctx.drawImage(base(w, h), 0, 0);
  for (const s of STARS) { ctx.globalAlpha = .35 + .65 * Math.abs(Math.sin(t * s.sp + s.ph)); ctx.fillStyle = '#fff'; ctx.fillRect(s.x * w, s.y * h, s.s, s.s); }
  ctx.globalAlpha = 1;
  // 漂う言葉(概念の海から浮かぶ)
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  for (const o of WORDS) {
    const y = h - ((o.y * h + t * o.v) % (h + 80)) + 40, x = o.x * w + Math.sin(t * .4 + o.ph) * 26;
    ctx.globalAlpha = o.a * Math.min(1, y / 120) ; ctx.fillStyle = '#cfe0ff'; ctx.font = `${o.s}px ${SERIF}`; ctx.fillText(o.w, x, y);
  }
  ctx.globalAlpha = 1;
  // 流れ星
  const k = (t * .22) % 5; if (k < 1) { const x = w * (1.05 - k * 1.2), y = 30 + k * 200; ctx.strokeStyle = `rgba(255,255,255,${1 - k})`; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + 80, y - 36); ctx.stroke(); }
  // 概念の海
  wave(ctx, w, h, h * .86, 7, .012, 0, 'rgba(70,130,190,.22)', t); wave(ctx, w, h, h * .91, 6, .017, 2, 'rgba(90,110,200,.25)', t * 1.2); wave(ctx, w, h, h * .96, 5, .022, 4, 'rgba(60,70,150,.35)', t * 1.5);
  for (const m of MOTES) { const y = h * .86 + ((m.y * 120 + t * 4) % 120), x = m.x * w + Math.sin(t + m.ph) * 8; ctx.globalAlpha = .25 + .25 * Math.sin(t * 2 + m.ph); ctx.fillStyle = '#bfe4ff'; ctx.beginPath(); ctx.arc(x, y, m.s, 0, TAU); ctx.fill(); }
  ctx.globalAlpha = 1;
}
const bgMenu = bgWorld;
DG.Art = { bgWorld, bgMenu, rng, TAU, SERIF };
})();
