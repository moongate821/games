// 絵: かわいい背景(手描きベクター・アニメーション)と顔の部品。画像ファイルなし。
(() => {
const DG = window.DG = window.DG || {};
const TAU = Math.PI * 2;
function rng(seed) { return () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }

// かわいい顔(ctx は顔の中心に平行移動済みを想定せず、座標で指定)
function face(ctx, x, y, s, o) {
  o = o || {};
  const blink = (o.t != null) && (Math.sin(o.t * 0.9 + (o.ph || 0)) > 0.985);
  ctx.save();
  ctx.fillStyle = o.color || '#3a2a2a'; ctx.strokeStyle = o.color || '#3a2a2a';
  const ex = s * 0.26, ey = -s * 0.02, er = s * 0.075;
  const mn = o.min == null ? 1 : o.min;
  if (blink || o.sleep) { ctx.lineWidth = Math.max(mn, s * 0.05); ctx.lineCap = 'round'; for (const sx of [-1, 1]) { ctx.beginPath(); ctx.arc(x + sx * ex, y + ey, er * 1.1, 0.15 * Math.PI, 0.85 * Math.PI); ctx.stroke(); } }
  else for (const sx of [-1, 1]) {
    ctx.beginPath(); ctx.arc(x + sx * ex, y + ey, er, 0, TAU); ctx.fill();
    ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(x + sx * ex - er * .3, y + ey - er * .3, er * .38, 0, TAU); ctx.fill(); ctx.fillStyle = o.color || '#3a2a2a';
  }
  if (o.cheeks !== false) { ctx.fillStyle = 'rgba(255,120,150,.45)'; for (const sx of [-1, 1]) { ctx.beginPath(); ctx.ellipse(x + sx * s * 0.4, y + s * 0.1, s * .09, s * .055, 0, 0, TAU); ctx.fill(); } }
  ctx.strokeStyle = o.color || '#3a2a2a'; ctx.lineWidth = Math.max(mn, s * 0.045); ctx.lineCap = 'round';
  ctx.beginPath();
  if (o.mood === 'o') ctx.arc(x, y + s * .16, s * .06, 0, TAU);
  else if (o.mood === 'flat') { ctx.moveTo(x - s * .08, y + s * .15); ctx.lineTo(x + s * .08, y + s * .15); }
  else ctx.arc(x, y + s * .08, s * .11, 0.15 * Math.PI, 0.85 * Math.PI);
  ctx.stroke();
  ctx.restore();
}

function cloud(ctx, x, y, s) {
  ctx.beginPath(); ctx.arc(x, y, s * .5, 0, TAU); ctx.arc(x + s * .55, y - s * .15, s * .6, 0, TAU); ctx.arc(x + s * 1.15, y, s * .5, 0, TAU);
  ctx.rect(x, y, s * 1.15, s * .5); ctx.fill();
}

// ---------- テラリウム: ぽかぽか草原 ----------
const TR = (() => {
  const r = rng(7), clouds = [], petals = [], flowers = [], mush = [];
  for (let i = 0; i < 6; i++) clouds.push({ x: r(), y: 40 + r() * 170, s: 36 + r() * 30, v: 4 + r() * 6, face: i % 2 === 0 });
  for (let i = 0; i < 26; i++) petals.push({ x: r(), y: r(), v: 8 + r() * 14, ph: r() * 9, c: ['#ffc2d6', '#fff0a8', '#ffffff'][i % 3] });
  for (let i = 0; i < 16; i++) flowers.push({ x: r(), l: 1 + (i % 3 === 0 ? 1 : 0), c: ['#ff8fb3', '#ffd34d', '#ffffff', '#c59bff'][i % 4], ph: r() * 9 });
  for (let i = 0; i < 5; i++) mush.push({ x: 0.1 + i * 0.2 + r() * 0.05, s: 20 + r() * 12 });
  return { clouds, petals, flowers, mush };
})();
function hill(ctx, w, h, base, amp, freq, ph, col, t) {
  ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(0, h);
  for (let x = 0; x <= w; x += 12) ctx.lineTo(x, base + Math.sin(x * freq + ph) * amp + Math.sin(t * .4 + x * .01) * 1.5);
  ctx.lineTo(w, h); ctx.closePath(); ctx.fill();
}
function bgTerrarium(ctx, t, w, h) {
  const g = ctx.createLinearGradient(0, 0, 0, h); g.addColorStop(0, '#9fdcff'); g.addColorStop(.55, '#d9f3ff'); g.addColorStop(.8, '#fff1d0');
  ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
  // おひさま(顔つき)
  const sx = w - 90, sy = 92;
  ctx.save(); ctx.translate(sx, sy); ctx.rotate(t * .15);
  ctx.fillStyle = 'rgba(255,224,120,.8)';
  for (let i = 0; i < 12; i++) { ctx.rotate(TAU / 12); ctx.beginPath(); ctx.moveTo(-7, -52); ctx.lineTo(0, -76); ctx.lineTo(7, -52); ctx.fill(); }
  ctx.restore();
  const sg = ctx.createRadialGradient(sx, sy, 5, sx, sy, 56); sg.addColorStop(0, '#fff3a8'); sg.addColorStop(1, '#ffc94a');
  ctx.fillStyle = sg; ctx.beginPath(); ctx.arc(sx, sy, 50, 0, TAU); ctx.fill();
  face(ctx, sx, sy + 2, 62, { t, ph: 1 });
  // くも
  ctx.fillStyle = 'rgba(255,255,255,.92)';
  for (const c of TR.clouds) { const x = ((c.x * 0 + (c.v * t + c.s * 9) % (w + 220)) - 120); cloud(ctx, x, c.y, c.s); if (c.face) face(ctx, x + c.s * .55, c.y + c.s * .12, c.s * .75, { t, ph: c.s }); ctx.fillStyle = 'rgba(255,255,255,.92)'; }
  // 丘
  hill(ctx, w, h, h - 190, 14, .012, 0, '#bdeaa4', t);
  hill(ctx, w, h, h - 140, 18, .017, 2, '#95d98d', t);
  hill(ctx, w, h, h - 82, 14, .022, 4, '#6cc579', t);
  // きのこ(顔つき)と花
  for (const m of TR.mush) {
    const x = m.x * w, y = h - 120 + Math.sin(x * .02) * 8 + 30, s = m.s, b = Math.sin(t * 2 + x) * 1.5;
    ctx.fillStyle = '#fff3e2'; ctx.beginPath(); ctx.roundRect(x - s * .22, y - s * .6, s * .44, s * .7, 6); ctx.fill();
    ctx.fillStyle = '#ff6b78'; ctx.beginPath(); ctx.ellipse(x, y - s * .6 + b, s * .62, s * .46, 0, Math.PI, TAU); ctx.fill();
    ctx.fillStyle = '#fff'; for (const [dx, dy, r] of [[-.3, -.82, .09], [.15, -.95, .11], [.38, -.74, .07]]) { ctx.beginPath(); ctx.arc(x + dx * s, y + dy * s + b, r * s, 0, TAU); ctx.fill(); }
    face(ctx, x, y - s * .22, s * .7, { t, ph: x });
  }
  for (const f of TR.flowers) {
    const x = f.x * w, y = h - 40 - (f.l - 1) * 30 + Math.sin(x * .03) * 6, sw = Math.sin(t * 1.6 + f.ph) * 3;
    ctx.strokeStyle = '#3f9a55'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x, y + 18); ctx.quadraticCurveTo(x + sw, y + 8, x + sw, y); ctx.stroke();
    ctx.fillStyle = f.c; for (let i = 0; i < 5; i++) { const a = i * TAU / 5; ctx.beginPath(); ctx.arc(x + sw + Math.cos(a) * 5, y + Math.sin(a) * 5, 4, 0, TAU); ctx.fill(); }
    ctx.fillStyle = '#ffb02e'; ctx.beginPath(); ctx.arc(x + sw, y, 3, 0, TAU); ctx.fill();
  }
  // ふわふわ花びら
  for (const p of TR.petals) {
    const x = ((p.x * w + t * p.v * 1.4) % (w + 40)) - 20, y = ((p.y * h + t * p.v) % h);
    ctx.fillStyle = p.c; ctx.globalAlpha = .8; ctx.beginPath(); ctx.ellipse(x + Math.sin(t + p.ph) * 12, y, 4, 2.5, t + p.ph, 0, TAU); ctx.fill();
  }
  ctx.globalAlpha = 1;
}

// ---------- 量子: やさしい夜空 ----------
const QD = (() => {
  const r = rng(13), stars = [], blobs = [];
  for (let i = 0; i < 120; i++) stars.push({ x: r(), y: r(), s: .6 + r() * 1.8, ph: r() * 9, sp: 1 + r() * 3 });
  for (let i = 0; i < 4; i++) blobs.push({ x: r(), y: 0.2 + r() * .7, s: 26 + r() * 14, v: 6 + r() * 8, c: ['#c9a0ff', '#8fd0ff', '#ffb0d9', '#9fffd8'][i], ph: r() * 9 });
  return { stars, blobs };
})();
function ghostBlob(ctx, x, y, s, col, t, ph) {
  const wob = Math.sin(t * 3 + ph) * 2;
  ctx.fillStyle = col; ctx.globalAlpha = .9; ctx.beginPath();
  ctx.moveTo(x - s, y + s * .8);
  ctx.lineTo(x - s, y); ctx.bezierCurveTo(x - s, y - s * 1.1, x + s, y - s * 1.1, x + s, y); ctx.lineTo(x + s, y + s * .8);
  for (let i = 0; i < 4; i++) { const px = x + s - (i + .5) * s * .5; ctx.quadraticCurveTo(px, y + s * 1.15 + wob, px - s * .25, y + s * .8); }
  ctx.closePath(); ctx.fill(); ctx.globalAlpha = 1;
  face(ctx, x, y + s * .05, s * 1.1, { t, ph, color: '#2a1a4a' });
}
const QCACHE = {};      // 動かない下地(グラデーションと星雲)は一度だけ描いて使い回す
function bgQuantum(ctx, t, w, h) {
  let base = QCACHE[w];
  if (!base) {
    base = QCACHE[w] = document.createElement('canvas'); base.width = w; base.height = h; const b = base.getContext('2d');
    const g = b.createLinearGradient(0, 0, 0, h); g.addColorStop(0, '#120a3a'); g.addColorStop(.5, '#2b1565'); g.addColorStop(1, '#4a1f7a');
    b.fillStyle = g; b.fillRect(0, 0, w, h);
    for (const [cx, cy, c] of [[.2, .3, 'rgba(255,120,200,.18)'], [.75, .55, 'rgba(90,160,255,.2)'], [.5, .9, 'rgba(160,120,255,.22)']]) {
      const rg = b.createRadialGradient(cx * w, cy * h, 10, cx * w, cy * h, 260); rg.addColorStop(0, c); rg.addColorStop(1, 'rgba(0,0,0,0)'); b.fillStyle = rg; b.fillRect(0, 0, w, h);
    }
  }
  ctx.drawImage(base, 0, 0);
  for (const s of QD.stars) { ctx.globalAlpha = .4 + .6 * Math.abs(Math.sin(t * s.sp + s.ph)); ctx.fillStyle = '#fff'; ctx.fillRect(s.x * w, s.y * h, s.s, s.s); }
  ctx.globalAlpha = 1;
  // 三日月(顔つき)
  const mx = w - 80, my = 90;
  ctx.fillStyle = '#fff2b8'; ctx.beginPath(); ctx.arc(mx, my, 44, 0, TAU); ctx.fill();
  ctx.fillStyle = '#2b1565'; ctx.beginPath(); ctx.arc(mx + 22, my - 10, 38, 0, TAU); ctx.fill();
  face(ctx, mx - 12, my + 4, 40, { t, ph: 2, cheeks: true });
  // わっか付きの星(顔つき)
  const px = 70, py = h - 150 + Math.sin(t * .8) * 6;
  ctx.fillStyle = '#ffb3d4'; ctx.beginPath(); ctx.arc(px, py, 34, 0, TAU); ctx.fill();
  ctx.strokeStyle = '#ffe3f0'; ctx.lineWidth = 5; ctx.beginPath(); ctx.ellipse(px, py, 58, 14, -.35, 0, TAU); ctx.stroke();
  ctx.fillStyle = '#ffb3d4'; ctx.beginPath(); ctx.arc(px, py, 34, .1 * Math.PI, .9 * Math.PI); ctx.fill();
  face(ctx, px, py, 46, { t, ph: 5 });
  // ふわふわおばけ(粒子)
  for (const b of QD.blobs) { const x = ((b.x * w + t * b.v) % (w + 100)) - 50, y = b.y * h + Math.sin(t * .9 + b.ph) * 14; ghostBlob(ctx, x, y, b.s, b.c, t, b.ph); }
  // 原子(顔つき)
  const ax = w * .5, ay = h * .12;
  ctx.strokeStyle = 'rgba(160,220,255,.6)'; ctx.lineWidth = 2;
  for (let i = 0; i < 3; i++) { ctx.save(); ctx.translate(ax, ay); ctx.rotate(i * Math.PI / 3 + t * .3); ctx.beginPath(); ctx.ellipse(0, 0, 40, 14, 0, 0, TAU); ctx.stroke(); ctx.restore(); }
  ctx.fillStyle = '#8fd0ff'; ctx.beginPath(); ctx.arc(ax, ay, 14, 0, TAU); ctx.fill(); face(ctx, ax, ay, 24, { t, ph: 8, cheeks: false });
  // 流れ星
  const k = (t * .25) % 4;
  if (k < 1) { const x = w * (1.1 - k * 1.3), y = 40 + k * 220; ctx.strokeStyle = `rgba(255,255,255,${1 - k})`; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + 70, y - 40); ctx.stroke(); }
}

// ---------- メニュー: 左右で2つの世界 ----------
function bgMenu(ctx, t, w, h) {
  ctx.save(); ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(w * .55, 0); ctx.lineTo(w * .45, h); ctx.lineTo(0, h); ctx.closePath(); ctx.clip(); bgTerrarium(ctx, t, w, h); ctx.restore();
  ctx.save(); ctx.beginPath(); ctx.moveTo(w * .55, 0); ctx.lineTo(w, 0); ctx.lineTo(w, h); ctx.lineTo(w * .45, h); ctx.closePath(); ctx.clip(); bgQuantum(ctx, t, w, h); ctx.restore();
  ctx.strokeStyle = 'rgba(255,255,255,.8)'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(w * .55, 0); ctx.lineTo(w * .45, h); ctx.stroke();
}
DG.Art = { face, bgTerrarium, bgQuantum, bgMenu, rng, TAU };
})();
