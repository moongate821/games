// hud.js — 画面の組み立て(奥から手前へ)、マシンと光の帯、速さの演出、レースの計器(順位・周回・時間・熱)、車体選び・コース選び・結果の画面
const BK = []; for (let i = 0; i < 400; i++) BK.push([]);
function nOf(z) { const n = Math.floor((relZ(z, cam.z) + cam.pct * SEG_L) / SEG_L); return n >= 0 && n < DRAW_N ? n : -1; }
function put(z, item) { const n = nOf(z); if (n >= 0) { item.d = relZ(z, cam.z); BK[n].push(item); } }
const Q1 = [0, 0, 0, 0, 0], Q2 = [0, 0, 0, 0, 0], Q3 = [0, 0, 0, 0, 0], Q4 = [0, 0, 0, 0, 0];
const ORD = n => n + (n === 1 ? 'st' : n === 2 ? 'nd' : n === 3 ? 'rd' : 'th');

function drawWorld() {   // 今の P と cam から見た世界(視界の大きさは W×H)
  for (let i = 0; i < DRAW_N; i++) BK[i].length = 0;
  ctx.save();
  ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, H);
  if (cam.shake > 0.3) ctx.translate(rnd(-1, 1) * cam.shake, rnd(-1, 1) * cam.shake * 0.6);
  ctx.translate(CX, H * 0.8); ctx.rotate(cam.tilt); ctx.translate(-CX, -H * 0.8);
  drawSky(); project();
  for (const e of ents) put(e.z, { k: 'ent', e });
  for (const r of RACERS) {
    for (let i = 1; i < r.trail.length; i++) put(r.trail[i].z, { k: 'trail', a: r.trail[i - 1], b: r.trail[i], i, r });
    put(r.z, { k: 'racer', r });
  }
  for (const p of parts) put(p.z, { k: 'part2', p });
  for (const r of rings) put(r.z, { k: 'ring', r });
  for (let n = DRAW_N - 1; n >= 0; n--) {
    const v = VIS[n], clip = v.clip < H - 1;
    if (v.ok) drawRoadSeg(n);
    if (v.cz1 < 30 && !BK[n].length) continue;
    if (clip) { ctx.save(); ctx.beginPath(); ctx.rect(0, 0, W, v.clip); ctx.clip(); }
    if (v.cz1 > 30) drawDecoSeg(n);
    const b = BK[n]; if (b.length > 1) b.sort((p, q) => q.d - p.d);
    for (const it of b) drawItem(it);
    if (clip) ctx.restore();
  }
  speedLines();
  ctx.restore();
  drawWeather(P.kmh / 300);
  if (!TWO()) motionBlur();
  if (P.boostOn || P.turbo > 0) { const g = ctx.createRadialGradient(CX, HOR, 100 * H / SH, CX, HOR, W * 0.7); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, P.turbo > 0 && !P.boostOn ? 'rgba(255,170,60,0.18)' : 'rgba(60,200,255,0.2)'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H); }
  if (P.over > 0) { ctx.fillStyle = 'rgba(255,60,20,' + (0.08 + 0.06 * Math.sin(performance.now() / 80)) + ')'; ctx.fillRect(0, 0, W, H); }
  if (P.hitFlash > 0) { ctx.fillStyle = 'rgba(255,80,60,' + P.hitFlash + ')'; ctx.fillRect(0, 0, W, H); }
}
function motionBlur() {   // 速いときは、画面を少し拡大して重ね、奥から手前へ流れる残像にする
  const k = clamp((P.kmh - 220) / 160, 0, 1) + (P.boostOn || P.turbo > 0 ? 0.4 : 0); if (k <= 0 || lite) return;
  const c = ctx.canvas, s = 1 + 0.035 * k;
  ctx.save(); ctx.globalAlpha = Math.min(0.32, 0.2 * k); ctx.drawImage(c, 0, 0, c.width, c.height, CX - CX * s, HOR - HOR * s, W * s, H * s); ctx.restore();
}
function drawScene() {
  if (!TWO()) {
    drawWorld();
    if (whiteFlash > 0) { ctx.fillStyle = 'rgba(255,240,240,' + Math.min(0.8, whiteFlash) + ')'; ctx.fillRect(0, 0, W, H); }
    if (state === 'play' || state === 'result') drawHUD();
    drawCRT();
    if (state === 'play') drawTouchUI();
    return;
  }
  const keep = P;   // 2人: 上が P1、下が P2
  PLAYERS.forEach((pl, i) => {
    use(pl); setView(SH / 2, 0.5);
    ctx.save(); ctx.translate(0, i * SH / 2); ctx.beginPath(); ctx.rect(0, 0, SW, SH / 2); ctx.clip();
    drawWorld(); drawHUD2(i);
    ctx.restore();
  });
  setView(SH, 1); use(keep);
  ctx.fillStyle = '#000'; ctx.fillRect(0, SH / 2 - 2, SW, 4); ctx.fillStyle = 'rgba(255,255,255,0.35)'; ctx.fillRect(0, SH / 2 - 0.5, SW, 1);
  if (mode === 'grid') drawLights(CX, SH / 2, 0.8);
  if (whiteFlash > 0) { ctx.fillStyle = 'rgba(255,240,240,' + Math.min(0.8, whiteFlash) + ')'; ctx.fillRect(0, 0, SW, SH); }
  drawCRT();
}
function drawItem(it) {
  const t = performance.now() / 1000;
  switch (it.k) {
    case 'ent': return drawEnt(it.e, t);
    case 'racer': return drawRacer(it.r, t);
    case 'trail': return drawTrailPiece(it.a, it.b, it.i, it.r);
    case 'part2': { const p = it.p, a = proj(p.z, p.x, p.y, Q1), b = a && proj(wrapZ(p.z - p.vz * 0.012 + P.kmh * KMH * 0.012), p.x - p.vx * 0.012, p.y - p.vy * 0.012, Q2); if (!a || !b) return; ctx.strokeStyle = rgba(p.col, clamp(p.life / p.max, 0, 1)); ctx.lineWidth = Math.max(1, a[2] * (p.air ? 6 : 14)); ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.stroke(); return; }
    case 'ring': { const r = it.r, a = proj(r.z, r.x, r.y, Q1); if (!a) return; const al = 1 - r.t / 0.7; ctx.strokeStyle = rgba(r.col, al); ctx.lineWidth = Math.max(1, 30 * a[2] * al); ctx.beginPath(); ctx.ellipse(a[0], a[1], r.r * a[2], r.r * a[2] * 0.6, 0, 0, Math.PI * 2); ctx.stroke(); return; }
  }
}
function drawEnt(e, t) {
  if (e.t === 'ramp') drawMesh(MESH.ramp, e.z, e.x * ROAD_W, 0, {}, [60, 255, 120], { glowCol: [150, 255, 180] });
  else if (e.t === 'barrier') {   // 狭いゲートの壁(黄と黒の縞のブロックを並べる)
    const n = Math.max(1, Math.round(e.w * 2 / 0.37)), step = e.w * 2 / n;
    for (let i = 0; i < n; i++) drawMesh(MESH.barrier, e.z, (e.x - e.w + step * (i + 0.5)) * ROAD_W, 0, {}, [255, 210, 60], {});
    const c = proj(e.z, e.x * ROAD_W, 420, Q1); if (c && Math.sin(t * 8) > 0) { ctx.fillStyle = 'rgba(255,60,40,0.9)'; ctx.fillRect(c[0] - 4, c[1] - 4, 8, 8); }
  }
}
function drawTrailPiece(a, b, i, pl) {   // 光の帯: 低い光の幕と、テールランプの2本の残光(自分の帯は、カメラの手前で消える)
  const back = -relZ(a.z, pl.z), L = 1100 * (pl.bk.trailLen || 1), f = clamp(1 - back / L, 0, 1) * (pl === P ? clamp((back + 400) / 200, 0, 1) : 0.8); if (f <= 0.02) return;
  const col = pl.glow && pl.bk.id !== 'kai' ? pl.glow : pl.bk.trail, hi = pl.bk.hi;
  const pa = proj(a.z, a.x * ROAD_W, a.y + 70, Q1), pb = pa && proj(b.z, b.x * ROAD_W, b.y + 70, Q2); if (!pa || !pb) return;
  ctx.globalCompositeOperation = 'lighter';
  const ta = pa[1] - 140 * pa[2], tb = pb[1] - 140 * pb[2];
  fillQuad(pa[0], pa[1], pb[0], pb[1], pb[0], tb, pa[0], ta, rgba(col, 0.14 * f));
  const la = proj(a.z, a.x * ROAD_W - 100, a.y + 175, Q3), lb = la && proj(b.z, b.x * ROAD_W - 100, b.y + 175, Q4);
  if (la && lb) { ctx.strokeStyle = rgba(hi, f); ctx.lineWidth = Math.max(1, la[2] * 7); ctx.beginPath(); ctx.moveTo(la[0], la[1]); ctx.lineTo(lb[0], lb[1]); const dx = 200 * la[2], dx2 = 200 * lb[2]; ctx.moveTo(la[0] + dx, la[1]); ctx.lineTo(lb[0] + dx2, lb[1]); ctx.stroke(); }
  ctx.strokeStyle = rgba(col, f * 0.6); ctx.lineWidth = Math.max(1, pa[2] * 4); ctx.beginPath(); ctx.moveTo(pa[0], ta); ctx.lineTo(pb[0], tb); ctx.stroke();
  ctx.globalCompositeOperation = 'source-over';
}
// ---------- CGバイクのスプライト(2026-10-07) ----------
// assets/bikes/<id>.webp(向き yaw × 傾き roll の格子を1枚にしたアトラス)と <id>.json。素材制作フォルダの render_bike_sprites.py が、Meshy のテクスチャ付きモデルから作る。
// 自機・AI の yaw / roll に最も近い1コマを選んで描く。読めない・角度が大きすぎるときは、従来の多角形メッシュ(drawMesh)で描く。?sprite=0 で使わない。
const BIKE_SPR = {};
const QS = [0, 0, 0, 0, 0];
if (!/[?&]sprite=0/.test(location.search)) for (const id of ['kai', 'arc', 'nst', 'ngt']) {
  fetch('assets/bikes/' + id + '.json').then(r => r.json()).then(meta => { const img = new Image(); img.onload = () => { BIKE_SPR[id] = { img, m: meta }; }; img.src = 'assets/bikes/' + meta.file; }).catch(() => {});
}
function drawBikeSprite(r, bk, x, hov, rot, flash) {
  const S = BIKE_SPR[bk.mesh]; if (!S || (rot.pitch || 0) !== 0) return false;
  const m = S.m, y0 = m.yaws[0], ys = m.yaws[1] - m.yaws[0], r0 = m.rolls[0], rs = m.rolls[1] - m.rolls[0];
  if (rot.yaw < y0 - ys * 1.4 || rot.yaw > m.yaws[m.yaws.length - 1] + ys * 1.4 || rot.roll < r0 - rs * 1.4 || rot.roll > m.rolls[m.rolls.length - 1] + rs * 1.4) return false;   // 範囲外は旧メッシュ
  const yi = clamp(Math.round((rot.yaw - y0) / ys), 0, m.yaws.length - 1), ri = clamp(Math.round((rot.roll - r0) / rs), 0, m.rolls.length - 1);
  const a = proj(r.z, x, r.y + hov, QS); if (!a) return false;
  const k = a[2] / m.ppu, w = m.fw * k, h = m.fh * k, dx = a[0] - m.anchorX * k, dy = a[1] - m.anchorY * k;
  ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = lite ? 'low' : 'medium';
  ctx.drawImage(S.img, yi * m.fw, ri * m.fh, m.fw, m.fh, dx, dy, w, h);
  if (flash) { ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = 0.55; ctx.drawImage(S.img, yi * m.fw, ri * m.fh, m.fw, m.fh, dx, dy, w, h); ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over'; }
  return true;
}
function drawRacer(r, t) {
  if (r !== P && relZ(r.z, cam.z) < 820) return;   // カメラの横や後ろにいるマシンは描かない(巨大に映るため)
  const bk = r.bk, x = r.x * ROAD_W, hov = bk.hover ? 40 + Math.sin(t * 5 + r.idx) * 12 : 0;
  const rot = { yaw: r.yaw + r.vx * 0.13, roll: r.lean + (r.slideT > 0 ? -r.slideDir * 0.35 : 0), pitch: r.air ? clamp(-r.vy * 0.00012, -0.25, 0.25) : 0 };
  const lim = r.limT > 0 && Math.sin(t * 50) > 0;
  const sh = proj(r.z, x, 0, Q1);
  if (sh && sh[2] < 0.16 && r !== P) {   // 遠景でも機種固有の車輪・装甲・浮上船体を残す
    const mesh = MESH['distant_' + bk.mesh] || MESH[bk.mesh];
    if (!drawBikeSprite(r, bk, x, hov, rot, lim)) drawMesh(mesh, r.z, x, r.y + hov, rot, bk.col, { glowCol: r.glow || bk.hi, shade: true, pal: r.pal, iri: r.iri, tailCol: bk.tailCol, scale: 1.12 });
    if (sh[4] < 9000) txt(r.human ? r.name : r.pos + ' ' + r.name, sh[0], sh[1] - 335 * sh[2], clamp(Math.round(sh[2] * 60), 9, 16), r.human ? [120, 220, 255] : [210, 220, 230], 'center', 0.85);
    return;
  }
  if (sh) { ctx.fillStyle = 'rgba(0,0,0,0.5)'; ctx.beginPath(); ctx.ellipse(sh[0], sh[1], (bk.hover ? 200 : 140) * sh[2], 30 * sh[2], 0, 0, Math.PI * 2); ctx.fill(); }
  if (sh && sh[2] > 0.1 && !lite) {
    const shine = r.glow || bk.trail, rr = Math.max(18, 250 * sh[2]);
    const g = ctx.createRadialGradient(sh[0], sh[1] - 8 * sh[2], 0, sh[0], sh[1] - 8 * sh[2], rr);
    g.addColorStop(0, rgba(shine, bk.hover ? 0.28 : 0.18)); g.addColorStop(1, rgba(shine, 0));
    ctx.fillStyle = g; ctx.beginPath(); ctx.ellipse(sh[0], sh[1], rr, rr * 0.36, 0, 0, Math.PI * 2); ctx.fill();
  }
  if (r === P) { const hl = proj(wrapZ(r.z + 2200), x + r.vx * 300, 0, Q2); if (hl && sh) { ctx.globalCompositeOperation = 'lighter'; const g = ctx.createRadialGradient(hl[0], hl[1], 0, hl[0], hl[1], 420 * hl[2] * 3); g.addColorStop(0, 'rgba(255,250,220,0.16)'); g.addColorStop(1, 'rgba(255,250,220,0)'); ctx.fillStyle = g; ctx.beginPath(); ctx.ellipse(hl[0], hl[1], 1400 * hl[2], 300 * hl[2], 0, 0, Math.PI * 2); ctx.fill(); ctx.globalCompositeOperation = 'source-over'; } }
  if (bk.hover && sh) { ctx.globalCompositeOperation = 'lighter'; const g = ctx.createRadialGradient(sh[0], sh[1], 0, sh[0], sh[1], 260 * sh[2]); g.addColorStop(0, rgba(r.glow || bk.hi, 0.45)); g.addColorStop(1, rgba(r.glow || bk.hi, 0)); ctx.fillStyle = g; ctx.fillRect(sh[0] - 260 * sh[2], sh[1] - 120 * sh[2], 520 * sh[2], 240 * sh[2]); ctx.globalCompositeOperation = 'source-over'; }
  // ブースト・ミニターボの噴射
  if (r.boostOn || r.turbo > 0) { const e = proj(wrapZ(r.z - 340), x, r.y + 150 + hov, Q3); if (e) { const col = r.turbo > 0 && !r.boostOn ? [255, 170, 60] : [90, 220, 255]; ctx.globalCompositeOperation = 'lighter'; for (let i = 0; i < 3; i++) { const rr = (60 + Math.random() * 50) * e[2] * (1 + i * 0.6); const g = ctx.createRadialGradient(e[0], e[1] + rr * 0.3 * i, 0, e[0], e[1] + rr * 0.3 * i, rr); g.addColorStop(0, 'rgba(255,255,255,0.9)'); g.addColorStop(0.4, rgba(col, 0.6)); g.addColorStop(1, rgba(col, 0)); ctx.fillStyle = g; ctx.fillRect(e[0] - rr, e[1] - rr + rr * 0.3 * i, rr * 2, rr * 2); } ctx.globalCompositeOperation = 'source-over'; } }
  if (bk.id === 'kmi' && sh) { ctx.globalCompositeOperation = 'lighter'; const g = ctx.createRadialGradient(sh[0], sh[1] - 150 * sh[2], 0, sh[0], sh[1] - 150 * sh[2], 520 * sh[2]); g.addColorStop(0, 'rgba(255,220,120,0.22)'); g.addColorStop(1, 'rgba(255,200,80,0)'); ctx.fillStyle = g; ctx.fillRect(sh[0] - 520 * sh[2], sh[1] - 670 * sh[2], 1040 * sh[2], 1040 * sh[2]); ctx.globalCompositeOperation = 'source-over'; }
  if (drawBikeSprite(r, bk, x, hov, rot, lim)) {   // CGバイク(スプライト)。ブレーキの灯だけ上から足す
    if (r.brk > 0 && sh) { const tl = proj(wrapZ(r.z - 330), x, r.y + hov + (bk.hover ? 70 : 190), QS); if (tl) { ctx.globalCompositeOperation = 'lighter'; const g = ctx.createRadialGradient(tl[0], tl[1], 0, tl[0], tl[1], 90 * tl[2]); g.addColorStop(0, 'rgba(255,60,60,0.8)'); g.addColorStop(1, 'rgba(255,40,40,0)'); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(tl[0], tl[1], 90 * tl[2], 0, Math.PI * 2); ctx.fill(); ctx.globalCompositeOperation = 'source-over'; } }
  } else drawMesh(!r.human && MESH['rival_' + bk.mesh] || MESH[bk.mesh], r.z, x, r.y + hov, rot, lim ? [255, 30, 30] : bk.col, { glowCol: r.glow || bk.hi, brake: r.brk > 0, shade: true, pal: r.pal, iri: r.iri, tailCol: bk.tailCol });
  // 名前: AI は順位と名前、2人のときは P1 / P2
  if (sh && r !== P) { const tg = proj(r.z, x, r.y + 420, Q4); if (tg && tg[4] < 9000) { const lab = r.human ? r.name : r.pos + ' ' + r.name; txt(lab, tg[0], tg[1], clamp(Math.round(tg[2] * 60), 9, 18), r.human ? (r.idx === PLAYERS[0].idx ? [255, 120, 130] : [120, 220, 255]) : [210, 220, 230], 'center', 0.85); } }
}
function speedLines() {   // 画面の端を流れる集中線(速さの表現)
  const k = clamp((P.kmh - 200) / 140, 0, 1) + (P.boostOn || P.turbo > 0 ? 0.8 : 0) + P.slip * 0.4; if (k <= 0 || lite) return;
  ctx.globalCompositeOperation = 'lighter'; ctx.lineWidth = 1.5;
  const n = Math.floor(10 + k * 30);
  for (let i = 0; i < n; i++) {
    const an = Math.random() * Math.PI * 2, sc = H / SH, r0 = (320 + Math.random() * 260) * sc, r1 = r0 + (150 + Math.random() * 400 * k) * sc;
    const x0 = CX + Math.cos(an) * r0 * 1.6, y0 = HOR + Math.sin(an) * r0, x1 = CX + Math.cos(an) * r1 * 1.6, y1 = HOR + Math.sin(an) * r1;
    ctx.strokeStyle = P.boostOn ? 'rgba(140,230,255,' + (0.15 + 0.3 * Math.random()) * Math.min(1, k) + ')' : 'rgba(255,255,255,' + (0.08 + 0.18 * Math.random()) * Math.min(1, k) + ')';
    ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke();
  }
  ctx.globalCompositeOperation = 'source-over';
}

// ---------- 計器 ----------
function txt(s, x, y, size, col, align, a) { ctx.font = 'bold ' + size + 'px "Consolas","Courier New",monospace'; ctx.textAlign = align || 'left'; ctx.textBaseline = 'middle'; ctx.fillStyle = rgba(col, a == null ? 1 : a); ctx.fillText(s, x, y); }
function jtxt(s, x, y, size, col, align, a) { ctx.font = 'bold ' + size + 'px "Yu Gothic","Meiryo",sans-serif'; ctx.textAlign = align || 'left'; ctx.textBaseline = 'middle'; ctx.fillStyle = rgba(col, a == null ? 1 : a); ctx.fillText(s, x, y); }
function panel(x, y, w, h, col) { ctx.fillStyle = 'rgba(0,6,14,0.72)'; ctx.beginPath(); ctx.moveTo(x + 12, y); ctx.lineTo(x + w, y); ctx.lineTo(x + w, y + h - 12); ctx.lineTo(x + w - 12, y + h); ctx.lineTo(x, y + h); ctx.lineTo(x, y + 12); ctx.closePath(); ctx.fill(); ctx.strokeStyle = rgba(col, 0.8); ctx.lineWidth = 1.2; ctx.stroke(); }
function bar(x, y, w, h, v, col, lab) { ctx.strokeStyle = rgba(col, 0.8); ctx.lineWidth = 1; ctx.strokeRect(x, y, w, h); const n = 20, cw = (w - 4) / n; ctx.fillStyle = rgba(col, 0.95); for (let i = 0; i < Math.round(v * n); i++) ctx.fillRect(x + 2 + i * cw, y + 2, cw - 1.5, h - 4); if (lab) txt(lab, x - 8, y + h / 2, 12, col, 'right'); }
function heatCol(h) { return h > 85 ? [255, 60, 40] : h > 60 ? [255, 170, 40] : [80, 220, 255]; }
function drawLights(x, y, s) {   // スタートの信号(赤3つ → 緑)
  const n = Math.floor(modeT / 0.9), go = modeT > 2.7;
  ctx.fillStyle = 'rgba(0,0,0,0.75)'; ctx.fillRect(x - 110 * s, y - 34 * s, 220 * s, 68 * s);
  for (let i = 0; i < 3; i++) { const on = go || i < n + 1 && modeT > 0.05, c = go ? [60, 255, 120] : [255, 40, 40]; ctx.fillStyle = on ? rgba(c, 1) : 'rgba(60,20,20,0.9)'; ctx.beginPath(); ctx.arc(x + (i - 1) * 70 * s, y, 24 * s, 0, Math.PI * 2); ctx.fill(); }
}
function standings() { return [...RACERS].sort((a, b) => a.pos - b.pos); }
function drawHUD() {
  const sec = SEC(), t = performance.now() / 1000, RC = sec.road;
  // 左上: 順位と周回
  panel(16, 14, 250, 104, RC);
  txt(String(P.pos), 34, 62, 64, [255, 255, 255]); txt(ORD(P.pos).slice(-2) + ' / ' + RACERS.length, 34 + (P.pos > 9 ? 76 : 40), 78, 18, [180, 210, 230]);
  txt('LAP', 150, 38, 13, [150, 190, 220]); txt(Math.min(P.lap, LAPS) + '/' + LAPS, 150, 66, 30, P.lap === LAPS && !P.finished ? [255, 110, 110] : [255, 255, 255]);
  jtxt(sec.jp, 30, 104, 12, [255, 200, 120]);
  // 上の中央: 時間
  panel(CX - 170, 14, 340, 62, RC);
  txt('TIME', CX - 150, 32, 11, [150, 190, 220]); txt(fmtT(P.finished ? P.finishT : raceT), CX - 150, 56, 24, [255, 255, 255]);
  txt('LAP', CX + 30, 30, 11, [150, 190, 220]); txt(fmtT(P.finished ? (P.lapTimes[P.lapTimes.length - 1] || 0) : raceT - P.lapStart), CX + 70, 30, 14, [220, 235, 245]);
  txt('BEST', CX + 30, 54, 11, [150, 190, 220]); txt(fmtT(P.bestLap), CX + 70, 54, 14, [255, 220, 120]);
  // 右: 全体の順位
  const st = standings(); panel(W - 196, 14, 180, 26 + st.length * 21, RC);
  st.forEach((r, i) => { const y = 34 + i * 21, me = r === P, hu = r.human; if (me) { ctx.fillStyle = rgba(r.bk.col, 0.25); ctx.fillRect(W - 190, y - 10, 168, 20); } txt(String(r.pos), W - 182, y, 13, me ? [255, 255, 255] : [160, 180, 200]); ctx.fillStyle = rgba(r.glow && r.bk.id !== 'kai' ? r.glow : r.pal && r.pal.body ? r.pal.body : r.bk.col, 1); ctx.fillRect(W - 164, y - 5, 8, 10); txt(r.name + (r.finished ? ' ✓' : ''), W - 150, y, 13, hu ? [255, 230, 150] : [210, 220, 230]); });
  drawGauges(t);
  // 右下: 熱・ブースト・スリップストリーム・ドリフト
  const hx = touchMode ? CX + 170 : W - 300, hy = H - 150;
  panel(hx, hy, 280, 120, RC);
  txt('HEAT', hx + 16, hy + 20, 12, [150, 190, 220]);
  const hc = P.over > 0 ? (Math.sin(t * 20) > 0 ? [255, 60, 40] : [120, 20, 10]) : heatCol(P.heat);
  bar(hx + 70, hy + 12, 196, 16, P.heat / 100, hc);
  if (P.over > 0) txt('OVERHEAT', hx + 168, hy + 44, 16, [255, 80, 40], 'center', Math.sin(t * 16) > 0 ? 1 : 0.4);
  else txt(P.boostOn ? 'BOOST' : P.onCool ? 'COOLING' : 'BOOST READY', hx + 168, hy + 44, 13, P.boostOn ? [140, 240, 255] : P.onCool ? [120, 200, 255] : [120, 160, 180], 'center');
  txt('SLIP', hx + 16, hy + 72, 12, [150, 190, 220]); bar(hx + 70, hy + 64, 196, 12, P.slip, P.slip > 0.6 ? [220, 255, 255] : [120, 170, 200]);
  txt('DRIFT', hx + 16, hy + 98, 12, [150, 190, 220]);
  const lvl = P.drifting ? (P.driftT > 1.6 ? 2 : P.driftT > 0.7 ? 1 : 0) : -1;
  for (let i = 0; i < 3; i++) { ctx.fillStyle = lvl >= i ? rgba(i === 2 ? [255, 150, 40] : i === 1 ? [80, 180, 255] : [255, 230, 180], 1) : 'rgba(80,100,120,0.35)'; ctx.fillRect(hx + 70 + i * 66, hy + 92, 60, 12); }
  if (P.turbo > 0) txt('TURBO', hx + 168, hy + 98, 12, [255, 200, 120], 'center');
  // 知らせ
  let y = 222;
  for (const m of P.msgs) {
    const a = clamp(m.t / 0.3, 0, 1) * clamp((m.max - m.t) / 0.1 + 0.2, 0, 1);
    if (/[ぁ-んァ-ン一-龥]/.test(m.txt)) jtxt(m.txt, CX, y, m.big ? 30 : 20, m.col, 'center', a); else { if (m.big && !lite) { ctx.shadowColor = rgba(m.col, 0.8); ctx.shadowBlur = 16; } txt(m.txt, CX, y, m.big ? 44 : 22, m.col, 'center', a); ctx.shadowBlur = 0; }
    y += m.big ? 50 : 30;
  }
  if (mode === 'grid') {
    jtxt(sec.jp, CX, 160, 38, [255, 220, 150], 'center'); txt('COURSE ' + String(sec.no).padStart(2, '0') + '  ·  ' + sec.name, CX, 200, 18, [180, 220, 255], 'center');
    jtxt('♪ ' + sec.bgm.title + '  (' + sec.bgm.genre + ' / ' + sec.bgm.bpm + ' BPM)', CX, 232, 14, [200, 190, 255], 'center');
    drawLights(CX, 320, 1);
    if (P.trans === 'MT') jtxt('C(クラッチ)を押したまま A で1速 → ↑でアクセル → C を離す', CX, 262, 17, [160, 230, 255], 'center');
  }
}
function drawGauges(t, lay) {
  const small = !!lay || touchMode, cx = lay ? lay.cx : small ? CX - 120 : 128, cy = lay ? lay.cy : small ? H - 70 : H - 118, R = lay ? lay.R : small ? 60 : 96;
  ctx.fillStyle = 'rgba(0,4,10,0.78)'; ctx.beginPath(); ctx.arc(cx, cy, R + 12, 0, Math.PI * 2); ctx.fill();
  const a0 = Math.PI * 0.75, span = Math.PI * 1.5, ang = v => a0 + span * v / 14;
  ctx.lineWidth = small ? 5 : 7; ctx.strokeStyle = 'rgba(60,160,220,0.35)'; ctx.beginPath(); ctx.arc(cx, cy, R, a0, ang(12)); ctx.stroke();
  ctx.strokeStyle = 'rgba(255,40,50,0.9)'; ctx.beginPath(); ctx.arc(cx, cy, R, ang(12), ang(14)); ctx.stroke();
  ctx.lineWidth = 1.5;
  for (let i = 0; i <= 14; i++) { const a = ang(i), r1 = R - (small ? 8 : 12), c = i >= 12 ? [255, 60, 60] : [150, 220, 255]; ctx.strokeStyle = rgba(c, 1); ctx.beginPath(); ctx.moveTo(cx + Math.cos(a) * R, cy + Math.sin(a) * R); ctx.lineTo(cx + Math.cos(a) * r1, cy + Math.sin(a) * r1); ctx.stroke(); if (!small || i % 2 === 0) txt(String(i), cx + Math.cos(a) * (R - (small ? 17 : 24)), cy + Math.sin(a) * (R - (small ? 17 : 24)), small ? 9 : 11, c, 'center'); }
  const rv = clamp(P.rpm / 1000, 0, 14), na = ang(rv);
  ctx.strokeStyle = P.rpm >= REDLINE ? '#ff4050' : '#fff'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + Math.cos(na) * (R - 4), cy + Math.sin(na) * (R - 4)); ctx.stroke();
  const gtxt = !P.engine ? '-' : P.gear === 0 ? 'N' : String(P.gear);
  txt(gtxt, cx, cy + (small ? 8 : 10), small ? 34 : 50, P.gear === 0 ? [120, 255, 150] : P.rpm >= REDLINE ? [255, 70, 70] : [255, 255, 255], 'center');
  txt('x1000 RPM', cx, cy + R * 0.62, small ? 8 : 10, [120, 170, 200], 'center');
  const leds = 5; for (let i = 0; i < leds; i++) { const th = 9000 + i * 700, on = P.rpm >= th && (P.rpm < 12500 || Math.sin(t * 40) > 0), c = i < 2 ? [60, 255, 120] : i < 4 ? [255, 220, 60] : [255, 50, 60]; ctx.fillStyle = on ? rgba(c, 1) : rgba(c, 0.15); ctx.beginPath(); ctx.arc(cx - 36 + i * 18, cy - R - (small ? 18 : 26), small ? 4 : 6, 0, Math.PI * 2); ctx.fill(); }
  const lx = small ? cx + R + 20 : cx + R + 26, ly = small ? cy - 36 : cy - 60;
  const lamp = (label, on, col, yy) => { ctx.strokeStyle = rgba(col, on ? 1 : 0.3); ctx.lineWidth = 1; ctx.strokeRect(lx, yy, 78, 20); if (on) { ctx.fillStyle = rgba(col, 0.25); ctx.fillRect(lx, yy, 78, 20); } txt(label, lx + 39, yy + 10, 11, col, 'center', on ? 1 : 0.35); };
  lamp(P.trans, true, P.trans === 'MT' ? [255, 200, 120] : [140, 220, 255], ly);
  if (P.trans === 'MT') lamp('CLUTCH', P.clutch < 0.6, [120, 255, 200], ly + 24);
  lamp('ENGINE', !P.engine || P.knock > 0.05, [255, 70, 70], ly + (P.trans === 'MT' ? 48 : 24));
  const sx = lay ? cx + R + 110 : small ? CX + 40 : cx + R + 26, sy = lay ? cy + 14 : small ? H - 60 : cy + 38;
  txt(String(Math.round(P.kmh)).padStart(3, ' '), sx, sy, small ? 40 : 52, P.boostOn ? [140, 240, 255] : P.turbo > 0 ? [255, 200, 120] : [255, 255, 255]);
  txt('km/h', sx + (small ? 76 : 98), sy + 12, 13, [150, 190, 220]);
}
function drawHUD2(i) {   // 2人のときの計器(上下それぞれの視界に、小さく)
  const t = performance.now() / 1000, sec = SEC(), tag = i ? [120, 220, 255] : [255, 120, 130];
  panel(12, 10, 300, 62, tag);
  txt(P.name, 26, 30, 20, tag); txt(P.bk.no + ' ' + P.bk.name, 70, 30, 12, [200, 210, 220]);
  txt(ORD(P.pos), 26, 56, 22, [255, 255, 255]); txt('LAP ' + Math.min(P.lap, LAPS) + '/' + LAPS, 110, 56, 16, P.lap === LAPS ? [255, 120, 120] : [220, 230, 240]); txt(fmtT(P.finished ? P.finishT : raceT), 210, 56, 14, [200, 220, 235]);
  panel(W - 262, 10, 250, 58, tag);
  bar(W - 190, 18, 170, 11, P.heat / 100, P.over > 0 ? (Math.sin(t * 20) > 0 ? [255, 60, 40] : [120, 20, 10]) : heatCol(P.heat), 'HEAT');
  bar(W - 190, 34, 170, 11, P.slip, [180, 230, 255], 'SLIP');
  txt(P.over > 0 ? 'OVERHEAT' : P.boostOn ? 'BOOST' : P.turbo > 0 ? 'TURBO' : P.drifting ? 'DRIFT' : '', W - 20, 56, 11, [255, 200, 120], 'right');
  if (i === 0) jtxt(sec.jp, CX, 20, 12, [255, 200, 120], 'center');
  drawGauges(t, { cx: 70, cy: H - 60, R: 44 });
  let y = H * 0.36;
  for (const m of P.msgs) {
    const a = clamp(m.t / 0.3, 0, 1) * clamp((m.max - m.t) / 0.1 + 0.2, 0, 1);
    if (/[ぁ-んァ-ン一-龥]/.test(m.txt)) jtxt(m.txt, CX, y, m.big ? 20 : 14, m.col, 'center', a); else txt(m.txt, CX, y, m.big ? 26 : 15, m.col, 'center', a);
    y += m.big ? 28 : 20;
  }
  if (mode === 'grid' && i === 0) jtxt(sec.jp + '  ' + sec.name, CX, H * 0.22, 22, [255, 220, 150], 'center');
}
let crtPat = null;
function drawCRT() {   // ブラウン管風: 周辺を暗く、走査線
  const g = ctx.createRadialGradient(CX, H / 2, H * 0.45, CX, H / 2, W * 0.64);
  g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(0,0,0,0.5)'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  if (lite) return;
  if (!crtPat) { const c = document.createElement('canvas'); c.width = 4; c.height = 3; const x = c.getContext('2d'); x.fillStyle = 'rgba(0,0,0,0.12)'; x.fillRect(0, 2, 4, 1); crtPat = ctx.createPattern(c, 'repeat'); }
  ctx.fillStyle = crtPat; ctx.fillRect(0, 0, W, H);
}
function drawTouchUI() {
  if (!touchMode) return;
  const o = stickOrg || { x: 190, y: H - 200 }, k = stickPos || o;
  ctx.lineWidth = 2; ctx.strokeStyle = 'rgba(90,210,255,0.45)'; ctx.beginPath(); ctx.moveTo(o.x - 90, o.y); ctx.lineTo(o.x + 90, o.y); ctx.stroke();
  ctx.beginPath(); ctx.arc(o.x, o.y, 90, Math.PI, 0); ctx.stroke();
  ctx.strokeStyle = stickPos ? 'rgba(90,210,255,0.95)' : 'rgba(90,210,255,0.45)'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(k.x, k.y, 30, 0, Math.PI * 2); ctx.stroke();
  const B = TBTN();
  for (const key in B) {
    const b = B[key], on = touchHeld[key], c = key === 'boost' ? [120, 230, 255] : key === 'drift' ? [255, 200, 120] : key === 'clutch' ? [120, 255, 200] : key === 'brake' ? [255, 90, 90] : [200, 210, 255];
    ctx.strokeStyle = rgba(c, on ? 1 : 0.5); ctx.lineWidth = on ? 3.5 : 2; ctx.beginPath(); ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2); ctx.stroke();
    if (on) { ctx.fillStyle = rgba(c, 0.2); ctx.fill(); }
    txt(b.label, b.x, b.y, key === 'boost' ? 17 : 12, c, 'center', on ? 1 : 0.7);
  }
}

// ---------- 結果 ----------
function drawResult() {
  if (!RESULT) return;
  const a = clamp(resultT / 0.5, 0, 1);
  ctx.fillStyle = 'rgba(0,0,0,' + (0.72 * a) + ')'; ctx.fillRect(0, 0, SW, SH);
  panel(CX - 380, 60, 760, 560, SEC().road);
  txt('RESULT', CX, 100, 40, [255, 230, 120], 'center'); jtxt(SEC().jp + '  (COURSE ' + SEC().no + ')', CX, 138, 16, [200, 220, 240], 'center');
  txt('POS', CX - 340, 176, 12, [150, 180, 200]); txt('RIDER', CX - 280, 176, 12, [150, 180, 200]); txt('MACHINE', CX - 120, 176, 12, [150, 180, 200]); txt('TIME', CX + 150, 176, 12, [150, 180, 200]); txt('BEST LAP', CX + 270, 176, 12, [150, 180, 200]);
  RESULT.forEach((x, i) => { const y = 206 + i * 34; if (x.human) { ctx.fillStyle = rgba(x.bike.col, 0.22); ctx.fillRect(CX - 360, y - 15, 720, 30); } txt(ORD(x.pos), CX - 340, y, 20, x.pos <= 3 ? [255, 220, 120] : [220, 230, 240]); txt(x.name, CX - 280, y, 18, x.human ? [255, 255, 255] : [200, 210, 220]); txt(x.bike.no + ' ' + x.bike.name, CX - 120, y, 14, x.bike.col); txt(fmtT(x.time), CX + 150, y, 18, [230, 240, 250]); txt(fmtT(x.best), CX + 270, y, 14, [200, 210, 220]); });
  const y0 = 206 + RESULT.length * 34 + 16;
  if (RESULT.secret) jtxt('封印が解けた: 隠しマシン NR-00 KAMUI が使えるようになった', CX, y0, 18, [255, 220, 120], 'center');
  else if (RESULT.newCourse) jtxt('次のコースが開いた: ' + COURSES[courseIdx + 1].jp, CX, y0, 18, [120, 255, 170], 'center');
  else if (!RESULT.cleared) jtxt('3位以内で、次のコースが開く', CX, y0, 16, [255, 170, 150], 'center');
  const labs = [RESULT.cleared && courseIdx < COURSES.length - 1 ? '次のコースへ' : 'もう一度', 'もう一度', 'コースを選ぶ'], keys = ['Enter / A', 'R / Y', 'Esc / B'];
  labs.forEach((l, i) => { const x = CX - 240 + i * 240; panel(x - 100, 560, 200, 44, [255, 120, 130]); jtxt(l, x, 576, 16, [255, 255, 255], 'center'); txt(keys[i], x, 596, 10, [160, 180, 200], 'center'); });
}
function resultTap(x, y) { if (y > 550 && y < 612) { const i = Math.round((x - (CX - 240)) / 240); if (i === 0) resultAction('next'); else if (i === 1) resultAction('retry'); else if (i === 2) resultAction('menu'); } }

// ---------- コース選び ----------
function drawCourseSelect(t) {
  const c = COURSES[CSEL.idx], locked = CSEL.idx > PROG.unlocked && !god;
  const sk = ctx.createLinearGradient(0, 0, 0, SH); sk.addColorStop(0, c.sky[0]); sk.addColorStop(0.5, c.sky[1]); sk.addColorStop(1, c.sky[2]); ctx.fillStyle = sk; ctx.fillRect(0, 0, SW, SH);
  ctx.fillStyle = 'rgba(0,0,0,0.55)'; ctx.fillRect(0, 0, SW, SH);
  jtxt('コースを選ぶ', 50, 44, 22, [220, 235, 250]); txt((PROG.unlocked + 1) + ' / ' + COURSES.length + ' OPEN', 230, 46, 14, [150, 190, 220]);
  if (SEL_CFG) jtxt(SEL_CFG.map((s, i) => (SEL_CFG.length > 1 ? 'P' + (i + 1) + ': ' : '') + bikeById(s.bike).no + ' ' + bikeById(s.bike).name + ' (' + s.trans + ')').join('   '), SW - 50, 44, 14, [255, 210, 160], 'right');
  // 左: 選んでいるコースの説明
  panel(40, 80, 440, 470, c.road);
  txt('COURSE ' + String(c.no).padStart(2, '0'), 64, 112, 18, c.road); jtxt(c.jp, 64, 150, 26, [255, 255, 255]); txt(c.name, 64, 184, 15, [190, 210, 230]);
  jtxt('♪ ' + c.bgm.title, 64, 230, 17, [220, 200, 255]); txt(c.bgm.genre.toUpperCase() + ' / ' + c.bgm.bpm + ' BPM', 64, 256, 13, [170, 160, 220]);
  jtxt('カーブ', 64, 300, 14, [150, 185, 205]); for (let i = 0; i < 5; i++) { ctx.fillStyle = i < Math.round(c.curvy * 3.2) ? rgba(c.road, 0.95) : 'rgba(80,100,120,0.35)'; ctx.fillRect(140 + i * 34, 293, 28, 14); }
  jtxt('起伏', 64, 326, 14, [150, 185, 205]); for (let i = 0; i < 5; i++) { ctx.fillStyle = i < Math.round(c.hills * 3.4) ? rgba(c.road, 0.95) : 'rgba(80,100,120,0.35)'; ctx.fillRect(140 + i * 34, 319, 28, 14); }
  jtxt('1周', 64, 352, 14, [150, 185, 205]); txt((c.len * SEG_L / KMH / 3.6 / 1000).toFixed(1) + ' km × ' + LAPS, 140, 352, 14, [220, 230, 240]);   // 速さの単位(1km/h = 40単位/秒)に合わせた距離
  jtxt('記録', 64, 398, 14, [150, 185, 205]); txt(fmtT(PROG.best[c.no]), 140, 398, 20, [255, 220, 120]);
  jtxt('最速周', 64, 428, 14, [150, 185, 205]); txt(fmtT(PROG.bestLap[c.no]), 140, 428, 16, [220, 230, 240]);
  if (locked) jtxt('まだ走れない(前のコースで3位以内)', 64, 480, 15, [255, 150, 140]);
  else { panel(64, 470, 392, 52, [255, 120, 130]); jtxt('このコースで発進', 260, 496, 18, [255, 255, 255], 'center'); }
  // 右: 30コースの一覧(6×5)
  const gx = 510, gy = 86, cw = 118, ch = 86;
  COURSES.forEach((k, i) => {
    const x = gx + (i % 6) * (cw + 6), y = gy + Math.floor(i / 6) * (ch + 8), lk = i > PROG.unlocked && !god, on = i === CSEL.idx;
    const g = ctx.createLinearGradient(0, y, 0, y + ch); g.addColorStop(0, k.sky[1]); g.addColorStop(1, k.sky[2]); ctx.fillStyle = g; ctx.fillRect(x, y, cw, ch);
    ctx.strokeStyle = rgba(k.road, 0.8); ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(x + cw * 0.5, y + ch * 0.45); ctx.lineTo(x + cw * 0.15, y + ch); ctx.moveTo(x + cw * 0.5, y + ch * 0.45); ctx.lineTo(x + cw * 0.85, y + ch); ctx.stroke();
    if (lk) { ctx.fillStyle = 'rgba(0,0,0,0.65)'; ctx.fillRect(x, y, cw, ch); }
    txt(String(k.no).padStart(2, '0'), x + 8, y + 16, 16, lk ? [120, 120, 130] : [255, 255, 255]);
    ctx.save(); ctx.beginPath(); ctx.rect(x + 2, y, cw - 4, ch); ctx.clip(); jtxt(k.jp, x + 8, y + ch - 14, 11, lk ? [110, 110, 120] : [230, 235, 245]); ctx.restore();
    if (PROG.best[k.no]) { ctx.fillStyle = 'rgba(255,220,120,0.9)'; ctx.fillRect(x + cw - 16, y + 8, 8, 8); }
    if (lk) txt('LOCK', x + cw - 8, y + 16, 10, [150, 150, 160], 'right');
    ctx.strokeStyle = on ? 'rgba(255,255,255,0.95)' : rgba(k.road, 0.35); ctx.lineWidth = on ? 3 : 1; ctx.strokeRect(x, y, cw, ch);
  });
  jtxt('← → ↑ ↓ で選ぶ ・ Enter / A で発進 ・ Esc / B で車体選びへ', CX, SH - 30, 14, [150, 180, 200], 'center');
  drawCRT();
}
function courseTap(x, y) {
  const gx = 510, gy = 86, cw = 118, ch = 86;
  if (x >= gx && y >= gy) { const c = Math.floor((x - gx) / (cw + 6)), r = Math.floor((y - gy) / (ch + 8)), i = r * 6 + c; if (c < 6 && i < COURSES.length) { if (i === CSEL.idx) courseConfirm(); else { CSEL.idx = i; SND.se('tick'); } } return; }
  if (x > 64 && x < 456 && y > 470 && y < 522) courseConfirm();
}

// ---------- ガレージ・車体選び ----------
const GAR = { A: 1.17, phi: 0.2, D: 1500, ty: 150, Fg: 1000, sy: SH * 0.6, drag: null, auto: true };
const GAR_ART = {};
const GAR_ART_MASKED = {};
for (const id of ['kai', 'arc', 'nst', 'ngt']) {
  const im = new Image(); im.src = 'assets/garage/' + id + '.png'; GAR_ART[id] = im;
}
const GAR_TT = {};   // 車体の回転画像(Meshy のCGバイクを36方向から描いたもの。素材制作フォルダの render_garage_turntable.py)
if (!/[?&]sprite=0/.test(location.search)) for (const id of ['kai', 'arc', 'nst', 'ngt']) {
  fetch('assets/garage/' + id + '.json').then(r => r.json()).then(meta => { const img = new Image(); img.onload = () => { GAR_TT[id] = { img, m: meta }; }; img.src = 'assets/garage/' + meta.file; }).catch(() => {});
}
function drawGarageArt(bk) {
  const key = bk.id === 'kmi' ? 'kai' : bk.id, T = GAR_TT[key];
  if (!T) return false;
  const m = T.m, n = m.yaws.length, u = (((GAR.A / (Math.PI * 2)) % 1) + 1) % 1, f = u * n, i0 = Math.floor(f) % n, i1 = (i0 + 1) % n, fr = f - Math.floor(f);
  const dw = m.fw * 1.5, dh = m.fh * 1.5, dx = 825 - dw / 2, dy = 430 - dh / 2;
  const fx = i => [(i % m.cols) * m.fw, Math.floor(i / m.cols) * m.fh];
  ctx.save(); ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = 'high';
  if (bk.id === 'kmi') ctx.filter = 'hue-rotate(40deg) saturate(0.85) brightness(1.1)';
  let [sx, sy] = fx(i0); ctx.globalAlpha = 1; ctx.drawImage(T.img, sx, sy, m.fw, m.fh, dx, dy, dw, dh);
  if (fr > 0.02) { [sx, sy] = fx(i1); ctx.globalAlpha = fr; ctx.drawImage(T.img, sx, sy, m.fw, m.fh, dx, dy, dw, dh); }
  ctx.restore();
  return true;
}
function garageProj(z, wx, wy, out) {   // 車体の周りを回るカメラ
  const cA = Math.cos(GAR.A), sA = Math.sin(GAR.A), cP = Math.cos(GAR.phi), sP = Math.sin(GAR.phi);
  const x1 = wx * cA - z * sA, z1 = wx * sA + z * cA, dy = wy - GAR.ty;
  const depth = -dy * sP + z1 * cP + GAR.D, up = dy * cP + z1 * sP;
  if (depth < 50) return null;
  const k = GAR.Fg / depth, o = out || PJ; o[0] = CX + x1 * k; o[1] = GAR.sy - up * k; o[2] = k; o[3] = 0; o[4] = depth; return o;
}
function drawStage() {   // ガレージの床と光
  const wall = ctx.createLinearGradient(0, 0, 0, SH * 0.57);
  wall.addColorStop(0, '#0b1829'); wall.addColorStop(0.65, '#101c2d'); wall.addColorStop(1, '#05030a');
  ctx.fillStyle = wall; ctx.fillRect(0, 0, SW, SH);
  // 資料のデザイン検査室: 背面の発光モニター、柱、作業灯をシンプルな線で表現。
  for (let i = 0; i < 8; i++) {
    const x = 90 + i * 164, h = 190 + (i % 3) * 38;
    ctx.fillStyle = 'rgba(2,8,17,0.65)'; ctx.fillRect(x, 108, 124, h);
    ctx.strokeStyle = 'rgba(100,170,215,0.25)'; ctx.lineWidth = 2; ctx.strokeRect(x, 108, 124, h);
    if (i % 2 === 0) {
      ctx.strokeStyle = 'rgba(70,220,250,0.5)'; ctx.strokeRect(x + 12, 136, 100, 70);
      ctx.strokeStyle = 'rgba(70,220,250,0.22)';
      for (let k = 0; k < 4; k++) { ctx.beginPath(); ctx.moveTo(x + 22, 152 + k * 12); ctx.lineTo(x + 86 - k * 7, 152 + k * 12); ctx.stroke(); }
    } else {
      for (let k = 0; k < 7; k++) { ctx.fillStyle = k % 3 === 0 ? 'rgba(90,235,190,0.45)' : 'rgba(90,155,190,0.22)'; ctx.fillRect(x + 14, 124 + k * 22, 80, 4); }
    }
  }
  ctx.strokeStyle = 'rgba(90,150,205,0.22)'; ctx.lineWidth = 12;
  for (const x of [0, 325, 650, 975, 1270]) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x + 38, 352); ctx.stroke(); }
  for (const x of [160, 470, 780, 1090]) {
    ctx.fillStyle = 'rgba(175,235,255,0.45)'; ctx.fillRect(x - 86, 44, 172, 7);
    ctx.fillStyle = 'rgba(90,195,255,0.08)'; ctx.fillRect(x - 110, 51, 220, 140);
  }
  const scrim = ctx.createLinearGradient(0, 0, 520, 0);
  scrim.addColorStop(0, 'rgba(2,4,12,0.92)'); scrim.addColorStop(0.82, 'rgba(2,4,12,0.72)'); scrim.addColorStop(1, 'rgba(2,4,12,0)');
  ctx.fillStyle = scrim; ctx.fillRect(0, 0, 520, SH);
  const g = ctx.createRadialGradient(CX, SH * 0.62, 50, CX, SH * 0.62, SW * 0.6); g.addColorStop(0, 'rgba(120,20,40,0.35)'); g.addColorStop(1, 'rgba(0,0,0,0)'); ctx.fillStyle = g; ctx.fillRect(0, 0, SW, SH);
  ctx.lineWidth = 1;
  for (let i = -8; i <= 8; i++) for (const dir of [0, 1]) {
    const a = dir ? garageProj(i * 180, -1440, 0, Q1) : garageProj(-1440, i * 180, 0, Q1), b = a && (dir ? garageProj(i * 180, 1440, 0, Q2) : garageProj(1440, i * 180, 0, Q2));
    if (a && b) { ctx.strokeStyle = 'rgba(60,200,255,' + (i === 0 ? 0.45 : 0.18) + ')'; ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.stroke(); }
  }
  const sh = garageProj(0, 0, 0, Q3); if (sh) { ctx.fillStyle = 'rgba(0,0,0,0.6)'; ctx.beginPath(); ctx.ellipse(sh[0], sh[1], 380 * sh[2], 110 * sh[2], 0, 0, Math.PI * 2); ctx.fill(); }
}
function drawBikeModel(bk) { MESH_PROJ = garageProj; drawMesh(MESH[bk.mesh], 0, 0, bk.hover ? 30 : 0, {}, bk.col, { shade: true, pal: bk.pal, iri: bk.iri, glowCol: bk.hi, tailCol: bk.tailCol }); MESH_PROJ = null; }
function drawGarage(t, caption) {   // 紹介動画の最初の車体紹介(NR-01 KAI)
  drawStage(); drawBikeModel(BIKES[0]);
  txt('NR-01 "KAI"', 60, 70, 30, [255, 255, 255]); jtxt('金田型 ・ 高速二輪', 60, 104, 16, [255, 150, 150]);
  BIKES[0].spec.forEach(([k, v], i) => { jtxt(k, 60, 150 + i * 26, 12, [140, 170, 190]); txt(v, 170, 150 + i * 26, 14, [255, 220, 200]); });
  if (caption) jtxt(caption, CX, SH - 50, 18, [200, 230, 255], 'center');
  drawCRT();
}
function wrapText(s, x, y, w, lh, size, col) { ctx.font = 'bold ' + size + 'px "Yu Gothic","Meiryo",sans-serif'; let line = ''; for (const ch of s) { if (ctx.measureText(line + ch).width > w) { jtxt(line, x, y, size, col); ctx.font = 'bold ' + size + 'px "Yu Gothic","Meiryo",sans-serif'; line = ''; y += lh; } line += ch; } if (line) jtxt(line, x, y, size, col); return y; }
function drawSelect(t) {   // 車体を選ぶ画面(資料の仕様書の数値つき)
  const list = bikeList(), bk = list[SEL.idx[SEL.who] % list.length], two = SEL.mode === '2p';
  drawStage(); if (!drawGarageArt(bk)) drawBikeModel(bk);
  if (bk.hidden) { ctx.globalCompositeOperation = 'lighter'; const g = ctx.createRadialGradient(CX, SH * 0.55, 20, CX, SH * 0.55, 420); g.addColorStop(0, 'rgba(255,210,110,0.18)'); g.addColorStop(1, 'rgba(255,200,80,0)'); ctx.fillStyle = g; ctx.fillRect(0, 0, SW, SH); ctx.globalCompositeOperation = 'source-over'; }
  const head = SEL.mode === 'view' ? 'GARAGE — 車体を見る' : two ? 'PLAYER ' + (SEL.who + 1) + ' — 車体を選ぶ' : '車体を選ぶ';
  jtxt(head, 50, 40, 18, two ? (SEL.who ? [120, 220, 255] : [255, 120, 130]) : [200, 230, 255]);
  txt(bk.no + ' "' + bk.name + '"', 50, 82, 32, bk.col); txt('CLASS: ' + bk.cls, 52, 112, 11, [160, 180, 200]);
  const yEnd = wrapText(bk.desc, 50, 142, 390, 22, 14, [210, 225, 235]);
  const S = bk.stat, rows = [['最高速', S.top, 0.9, 1.25], ['加速', S.acc, 0.88, 1.4], ['旋回', S.grip, 0.8, 1.45], ['重さ', S.weight, 0.7, 1.7], ['耐熱', S.heat, 0.8, 1.75], ['ブースト', S.boost, 0.9, 1.35]];
  let y = Math.max(200, yEnd + 34);
  rows.forEach(([k, v, lo, hi], i) => { const yy = y + i * 24; jtxt(k, 50, yy, 13, [150, 185, 205]); const f = clamp((v - lo) / (hi - lo), 0.05, 1); ctx.strokeStyle = 'rgba(120,170,200,0.6)'; ctx.lineWidth = 1; ctx.strokeRect(130, yy - 6, 240, 12); ctx.fillStyle = rgba(bk.col, 0.9); ctx.fillRect(132, yy - 4, 236 * f, 8); });
  y += rows.length * 24 + 12;
  jtxt('特性: ' + bk.special, 50, y, 13, [255, 220, 150]); y += 30;
  bk.spec.forEach(([k, v], i) => { const yy = y + i * 19; jtxt(k, 50, yy, 11, [130, 160, 180]); txt(v, 130, yy, 11, [230, 235, 240]); });
  if (SEL.mode !== 'view') { jtxt('変速: ' + (SEL.trans[SEL.who] === 'MT' ? 'MT(クラッチ)' : 'AT(自動)'), SW - 60, 90, 16, SEL.trans[SEL.who] === 'MT' ? [255, 200, 120] : [140, 220, 255], 'right'); jtxt('T キー / Y ボタンで切り替え', SW - 60, 114, 11, [140, 160, 180], 'right'); }
  list.forEach((b, i) => { const x = CX + 60 - (list.length - 1) * 22 + i * 44, on = i === SEL.idx[SEL.who] % list.length; ctx.fillStyle = rgba(b.col, on ? 1 : 0.3); ctx.beginPath(); ctx.arc(x, SH - 118, on ? 9 : 6, 0, Math.PI * 2); ctx.fill(); });
  if (two && SEL.who === 1) { const p1 = bikeById(SEL.pick[0]); jtxt('P1: ' + p1.no + ' ' + p1.name, SW - 60, 140, 13, [255, 150, 160], 'right'); }
  ctx.strokeStyle = 'rgba(200,230,255,0.6)'; ctx.lineWidth = 3;
  for (const sd of [-1, 1]) { const x = sd < 0 ? 500 : SW - 70; ctx.beginPath(); ctx.moveTo(x - sd * 14, SH * 0.5 - 30); ctx.lineTo(x + sd * 14, SH * 0.5); ctx.lineTo(x - sd * 14, SH * 0.5 + 30); ctx.stroke(); }
  panel(CX + 60 - 120, SH - 92, 240, 48, [255, 120, 130]); jtxt(SEL.mode === 'view' ? '戻る' : two && SEL.who === 0 ? '決定 → P2 へ' : '決定 → コース選びへ', CX + 60, SH - 68, 17, [255, 255, 255], 'center');
  jtxt('← → で選ぶ ・ Enter / A で決定 ・ Esc / B で戻る ・ ドラッグで回す', CX + 60, SH - 22, 12, [140, 170, 190], 'center');
  if (SEL.flash > 0) { const a = Math.min(1, SEL.flash); ctx.fillStyle = 'rgba(255,230,150,' + (a * 0.25) + ')'; ctx.fillRect(0, 0, SW, SH); txt('SECRET MACHINE UNLOCKED', CX, 150, 40, [255, 230, 120], 'center', a); }
  drawCRT();
}
function selTap(x, y) {   // タッチ・マウスで車体を選ぶ
  if (y > SH - 100 && Math.abs(x - (CX + 60)) < 130) { selConfirm(); return; }
  if (y > SH * 0.25 && y < SH * 0.8) { if (x > 450 && x < 560) selMove(-1); else if (x > SW - 130) selMove(1); }
}
