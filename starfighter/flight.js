// Visual layer: vector geometry only; no external images, fonts or network requests.
let flightTrails = [];
function updateFlightTrails(dt) {
  for (const t of flightTrails) t.life -= dt;
  flightTrails = flightTrails.filter(t => t.life > 0);
  if (P.dead || cockpit) return;
  const b = basisYP(P.yaw, P.pitch, P.roll), wing = (22 + 50 * P.foldV) * 0.8;
  flightTrails.push({ life: 26, points: [-1, 1].map(k => vadd(P.p, vadd(vmul(b.r, wing * k), vmul(b.f, -40)))), boost: P.boosting });
  if (flightTrails.length > 32) flightTrails.shift();
}
function drawFlightTrails() {
  if (cockpit || P.dead) return;
  push(); noFill();
  for (let i = 1; i < flightTrails.length; i++) {
    const a = flightTrails[i - 1], b = flightTrails[i];
    neon(b.boost ? [255, 190, 85] : [70, 215, 255], b.life / 26 * 135, lite ? 0 : 7, b.boost ? 2.4 : 1.3);
    for (let k = 0; k < 2; k++) { const p = projW(a.points[k]), q = projW(b.points[k]); if (p && q) line(p[0], p[1], q[0], q[1]); }
  }
  noGlow(); pop();
}
function drawDeepSpace() {
  const c = drawingContext;
  if (!lite) {
    const g = c.createRadialGradient(W * .72, H * .25, 0, W * .6, H * .35, W * .65);
    g.addColorStop(0, 'rgba(12,44,67,.38)'); g.addColorStop(.5, 'rgba(20,13,40,.16)'); g.addColorStop(1, 'rgba(0,0,0,0)');
    c.fillStyle = g; c.fillRect(0, 0, W, H);
  }
  const p = projW(DEST); if (!p) return;
  const r = Math.min(900, p[2] * DEST_R * 1.2);
  push(); noFill(); noGlow(); stroke(67, 170, 210, 35); strokeWeight(1);
  ellipse(p[0], p[1], r * 2.45, r * .76);
  stroke(100, 208, 233, 24); ellipse(p[0], p[1], r * 2.6, r * .81);
  pop();
}
function flightPanel(x, y, w, h, accent = [91, 213, 228]) {
  noGlow(); stroke(63, 107, 129, 170); strokeWeight(1); fill(4, 13, 23, 215);
  beginShape(); vertex(x + 10, y); vertex(x + w, y); vertex(x + w, y + h - 10); vertex(x + w - 10, y + h); vertex(x, y + h); vertex(x, y + 10); endShape(CLOSE);
  stroke(...accent); line(x + 11, y, x + 44, y); line(x + w - 32, y + h, x + w - 11, y + h); noStroke();
}
function flightText(str, x, y, size, col = [173, 202, 215], align = LEFT) {
  noGlow(); noStroke(); fill(...col); textAlign(align, TOP); textSize(size); text(str, x, y);
}
function segmentedBar(x, y, w, frac, col) {
  frac = constrain(frac, 0, 1); noStroke();
  for (let i = 0; i < 20; i++) { fill(...col, i / 20 < frac ? 230 : 28); rect(x + w * i / 20, y, w / 20 - 3, 6); }
}
function drawFlightHUD() {
  push(); const ice = [111, 234, 242], gold = [255, 194, 108], white = [227, 241, 247];
  if (!cockpit) {   // コックピット画面では、四隅のパネルは出さない(計器盤に、同じ情報がある)
  flightPanel(24, 22, 250, 98);
  flightText('FLIGHT RECORD', 40, 34, 12, ice);
  flightText(String(P.score).padStart(7, '0'), 38, 53, 32, white);
  flightText('CR ' + P.credits + '   /   KILLS ' + P.kills, 40, 94, 13);
  if (chain >= 2) {   // 連続撃破(4回ごとに倍率が上がる。最大 ×8)
    const cm = chainMul(); flightText('CHAIN ' + chain + '   ×' + cm, 28, 128, 20, cm >= 4 ? [255, 150, 100] : gold); segmentedBar(28, 156, 200, chainT / 160, cm >= 4 ? [255, 150, 100] : gold);
  }
  }
  if (cockpit) {   // 窓を広く使うため、上の枠に、細く出す
    flightText(sectorName() + '   /   SECTOR ' + String(stage).padStart(2, '0') + '   /   ' + FACTIONS[stageFaction()].name, CX, 8, 14, white, CENTER);
    const pg = constrain(dot(vsub(P.p, START), travelDir) / destDist0, 0, 1); noStroke(); fill(43, 76, 92); rect(440, 28, 400, 2); fill(...gold); rect(440, 28, 400 * pg, 2); for (const e of ENC_AT) { fill(e < pg ? color(...ice) : color(102, 116, 130)); rect(440 + 400 * e, 25, 2, 8); }
  } else {
  flightPanel(420, 22, 440, 76);
  flightText('SECTOR ' + String(stage).padStart(2,'0') + '  /  ' + (curNode().route ? curNode().route + '  /  ' : '') + FACTIONS[stageFaction()].name, CX, 33, 12, ice, CENTER);
  flightText(sectorName(), CX, 52, 25, white, CENTER);
  const progress = constrain(dot(vsub(P.p, START), travelDir) / destDist0, 0, 1);
  noStroke(); fill(43, 76, 92); rect(440, 87, 400, 2); fill(...gold); rect(440, 87, 400 * progress, 2);
  for (const e of ENC_AT) { fill(e < progress ? color(...ice) : color(102, 116, 130)); rect(440 + 400 * e, 84, 2, 8); }
  }
  if (!cockpit) {
  const shield = constrain(P.shield / maxSh(), 0, 1), sc = shield > .35 ? ice : [255, 103, 94];
  flightPanel(W - 274, 22, 250, 98, sc);
  flightText('SHIELD', W - 258, 35, 12, sc);
  flightText(Math.ceil(shield * 100) + '%', W - 40, 30, 30, white, RIGHT);
  segmentedBar(W - 258, 72, 218, shield, sc);
  flightText('LIVES ' + P.lives + '   /   WINGMEN ' + allies.length, W - 258, 95, 13);
  }
  if (!cockpit && !(touchMode || location.hash.includes('touch'))) {
    flightPanel(24, H - 130, 250, 104);
    flightText(P.form === 'combat' ? '01 / COMBAT MODE' : '02 / CRUISE MODE', 40, H - 117, 15, ice);
    flightText(String(Math.round(P.speed * 40)).padStart(4,'0') + ' KM/H', 40, H - 91, 24, white);
    flightText('BOOST', 40, H - 57, 11); segmentedBar(100, H - 53, 157, P.boost / boostMax(), ice);
    flightPanel(W - 274, H - 130, 250, 104, gold);
    flightText('TACTICAL SYSTEMS', W - 258, H - 117, 12, gold);
    flightText('LOCK ' + P.locks.length + ' / ' + lockMax(), W - 258, H - 90, 23, white); flightText('FA ' + (P.fa ? 'ON' : 'OFF') + ' [G]', W - 100, H - 116, 11, P.fa ? ice : [255, 144, 102], RIGHT);
    flightText('WIDE', W - 258, H - 57, 11); segmentedBar(W - 201, H - 53, 158, P.energy / 100, gold);
  }
  if (touchMode) {
    flightText(P.form.toUpperCase() + '   BOOST ' + Math.round(P.boost / boostMax() * 100) + '%   WIDE ' + Math.round(P.energy) + '%', CX, 112, 15, ice, CENTER);
  } else if (!cockpit) flightText('DEST ' + (vlen(vsub(DEST,P.p))/1000).toFixed(1) + 'K   /   CONTACTS ' + fighters.length, CX, 107, 13, ice, CENTER);
  drawRadar();
  // Brackets and a short action cue keep the battlefield readable.
  const target = ships.find(s => s.alive && s.gensAlive() > 0 && vlen(vsub(s.p,P.p)) < 4000);
  if (target) flightText('SHIELD GENERATORS  →  BRIDGE', CX, cockpit ? 462 : H - 189, 14, gold, CENTER);
  if (announceT > 0 && !bossSpawned) flightText(announceName(), CX, 144, 16, gold, CENTER);
  if (bossSpawned && bossShip && bossShip.alive && bossShip.def) {
    const b = bossShip;
    flightPanel(410, 141, 460, 46, [255, 113, 110]);
    flightText(b.def.name.replaceAll('_',' ') + '  /  PHASE ' + (b.phase + 1), CX, 149, 13, [255,164,151], CENTER);
    segmentedBar(425, 174, 430, b.critFrac(), [255,113,110]);
  }
  if (warningT > 0) { flightPanel(420, 211, 440, 72, [255,113,110]); flightText('WARNING / CAPITAL SHIP', CX, 223, 24, [255,150,123], CENTER); flightText('LOCK GENERATORS · EVADE HEAVY FIRE', CX, 255, 12, white, CENTER); }
  const effects = [P.acidT > 0 ? 'CORROSION' : '', P.slowT > 0 ? 'SLOWED' : '', P.confT > 0 ? 'CONTROLS INVERTED' : ''].filter(Boolean);
  if (effects.length && !cockpit) flightText(effects.join(' / '), 40, chain >= 2 ? 178 : 139, 14, [255,144,102]);
  if (mode === 'hangar') drawHangar(); if (mode === 'ending') drawEnding(); if (mode === 'map') drawGalaxyMap();
  if (mode === 'clear') { flightPanel(365, 245, 550, 160); centerText('SECTOR CLEAR', 282, 44, ice); centerText('SHIELD BONUS  ' + Math.round(P.shield * 10), 340, 20, gold); centerText('HANGAR ACCESS GRANTED', 376, 14, white, false); }
  if (window.sfSaveFailed) flightText('SAVE UNAVAILABLE — STORAGE FULL OR BLOCKED', CX, H - 20, 12, [255,144,102], CENTER);
  pop();
}

function drawShowroom() {
  background(3,8,16);drawDeepSpace();
  const ship=ships[0];
  if(ship) {
    const R=ship.hullR,a=Number(document.getElementById('yard-angle').value)*Math.PI/180;
    const local=[Math.sin(a)*R*1.9,R*.9,Math.cos(a)*R*1.9];
    cam.p=ship.toWorld(local);const b=basisDir(vnorm(vsub(vadd(ship.p,[0,R*.08,0]),cam.p)),0);cam.f=b.f;cam.r=b.r;cam.u=b.u;
    drawStars();const list=[];ship.faces(list,R*2);paintFaces(list);drawEngineGlow(ship);drawCapitalAccents(ship,R*2);
    flightText(ship.design.name+' / '+ship.variant.toUpperCase(),48,H-83,23,[219,239,244]);
    flightText('FACETED ARMOR  /  RADIATOR ARRAYS  /  VECTOR THRUST',48,H-48,12,[119,201,214]);
    flightText('WIRE GEOMETRY · NEON FRONTIER',W-40,H-48,12,[225,179,116],RIGHT);
  } else {
    cam.p=[0,0,-380];cam.f=[0,0,1];cam.r=[1,0,0];cam.u=[0,1,0];drawStars();
    for(const f of fighters){const list=[];f.faces(list);paintFaces(list);}
    flightText('AIR WING / 18 DESIGNS',48,H-73,23,[219,239,244]);flightText('10 FIGHTERS · 4 HEAVY AIRCRAFT · 4 DRONES',48,H-40,12,[119,201,214]);
  }
  drawCRT();
}

const ckR = n => { const x = Math.sin(n * 127.1) * 43758.5453; return x - Math.floor(x); };
// ---------- コックピット画面(C キー): キャノピーの枠、ガラスに映るHUD、計器盤(左=機体、中央=レーダー、右=目標)、警告灯 ----------
const CKWIN = [[0, 0], [1280, 0], [1280, 594], [1090, 560], [880, 522], [830, 488], [450, 488], [400, 522], [190, 560], [0, 594]];   // 窓(外の景色が見える部分)
const CKDASH = [[0, 594], [190, 560], [400, 522], [450, 488], [830, 488], [880, 522], [1090, 560], [1280, 594], [1280, 720], [0, 720]];   // 計器盤
function ckPath(ctx, pts) { ctx.moveTo(pts[0][0], pts[0][1]); for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]); ctx.closePath(); }
function ckRoundRect(ctx, x, y, w, h, r) { ctx.moveTo(x + r, y); ctx.lineTo(x + w - r, y); ctx.quadraticCurveTo(x + w, y, x + w, y + r); ctx.lineTo(x + w, y + h - r); ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h); ctx.lineTo(x + r, y + h); ctx.quadraticCurveTo(x, y + h, x, y + h - r); ctx.lineTo(x, y + r); ctx.quadraticCurveTo(x, y, x + r, y); ctx.closePath(); }
function ckArc(cx, cy, r, frac, col, label, val) {   // 円弧のゲージ(270度)
  const a0 = PI * 0.75, a1 = PI * 2.25, ctx = drawingContext; frac = constrain(frac, 0, 1);
  ctx.lineCap = 'round'; ctx.lineWidth = 7; ctx.strokeStyle = 'rgba(70,100,120,.35)'; ctx.beginPath(); ctx.arc(cx, cy, r, a0, a1); ctx.stroke();
  ctx.strokeStyle = `rgb(${col[0]},${col[1]},${col[2]})`; ctx.beginPath(); ctx.arc(cx, cy, r, a0, a0 + (a1 - a0) * frac); ctx.stroke();
  ctx.lineWidth = 1; ctx.strokeStyle = 'rgba(160,200,220,.4)'; for (let i = 0; i <= 10; i++) { const a = a0 + (a1 - a0) * i / 10; ctx.beginPath(); ctx.moveTo(cx + Math.cos(a) * (r + 7), cy + Math.sin(a) * (r + 7)); ctx.lineTo(cx + Math.cos(a) * (r + (i % 5 ? 10 : 13)), cy + Math.sin(a) * (r + (i % 5 ? 10 : 13))); ctx.stroke(); }
  ctx.lineCap = 'butt'; noStroke(); fill(col[0], col[1], col[2]); textAlign(CENTER, CENTER); textSize(r * 0.5); text(val, cx, cy - 2); textSize(10); fill(150, 190, 205); text(label, cx, cy + r * 0.55);
}
function ckTarget() {   // 目標: ロックした物、なければ、近い敵機・艦
  let best = null, bd = 1e9;
  const cand = P.locks.length ? [P.locks[0]] : [...fighters.filter(f => !f.cloaked && !(f.wt > 0)), ...ships.filter(s => s.alive && !(s.wt > 0))];
  for (const e of cand) { if (e.dead) continue; const d = vlen(vsub(e.p, P.p)); if (d < bd && d < (e.hullR ? 12000 : 6000)) { bd = d; best = e; } }
  return best ? { e: best, d: bd } : null;
}
function ckName(e) {
  if (e.kind === 'part') return (e.part === 'bridge' ? 'CORE' : e.part === 'gen' ? 'GENERATOR' : 'TURRET') + ' / ' + (e.ship.def ? e.ship.def.name.replaceAll('_', ' ') : (e.ship.design ? e.ship.design.name : 'CAPITAL'));
  if (e.def) return e.def.name.replaceAll('_', ' '); if (e.hullR && e.design) return e.design.name + ' ' + e.variant.toUpperCase(); if (e.design) return e.design.name; return 'CONTACT';
}
function drawGlassHUD() {   // ガラスに映る、照準・ピッチ目盛り・方位
  const ctx = drawingContext, low = P.shield / maxSh() < 0.3, col = low ? [255, 170, 90] : [95, 255, 190];
  ctx.save(); ctx.beginPath(); ckPath(ctx, CKWIN); ctx.clip(); noFill(); neon(col, 190, lite ? 0 : 5, 1.3);
  // 方位のテープ
  const hd = ((P.yaw * 180 / PI) % 360 + 360) % 360;
  for (let d = Math.floor(hd / 5) * 5 - 40; d <= hd + 40; d += 5) { const x = CX + (d - hd) * 8.5, major = (((d % 360) + 360) % 360) % 10 === 0; line(x, 78, x, major ? 90 : 84); }
  noStroke(); fill(...col); textAlign(CENTER, TOP); textSize(11); for (let d = Math.floor(hd / 10) * 10 - 40; d <= hd + 40; d += 10) { const n = ((d % 360) + 360) % 360; if (n % 30 === 0) text(n === 0 ? 'N' : n === 90 ? 'E' : n === 180 ? 'S' : n === 270 ? 'W' : n, CX + (d - hd) * 8.5, 94); }
  noFill(); neon(col, 220, lite ? 0 : 5, 1.5); triangle(CX - 5, 74, CX + 5, 74, CX, 80);
  // ピッチ目盛り(機体が傾くと、水平線が反対に傾く)
  push(); translate(CX, CY); rotate(P.roll); neon(col, 150, 0, 1.1);
  for (let a = -40; a <= 40; a += 10) {
    const ang = a * PI / 180 - P.pitch; if (Math.abs(ang) > 1.05) continue;
    const y = -F * Math.tan(ang); if (Math.abs(y) > 240) continue;
    if (a === 0) { line(-230, y, -60, y); line(60, y, 230, y); } else { const dd = a > 0 ? 6 : -6; line(-110, y, -50, y); line(50, y, 110, y); line(-110, y, -110, y + dd); line(110, y, 110, y + dd); }
    noStroke(); fill(...col, 190); textSize(10); textAlign(RIGHT, CENTER); text(Math.abs(a), -118, y); textAlign(LEFT, CENTER); text(Math.abs(a), 118, y); noFill(); neon(col, 150, 0, 1.1);
  }
  pop();
  // 照準(機首の向き)
  neon(col, 235, lite ? 0 : 7, 1.6); ellipse(CX, CY, 74); ellipse(CX, CY, 4);
  for (let k = 0; k < 4; k++) { const a = k * PI / 2 + PI / 4; line(CX + Math.cos(a) * 37, CY + Math.sin(a) * 37, CX + Math.cos(a) * 47, CY + Math.sin(a) * 47); }
  // 速度と目的地までの距離
  noStroke(); fill(...col); textSize(15); textAlign(RIGHT, CENTER); text(String(Math.round(P.speed * 40)).padStart(4, '0'), CX - 300, CY + 96); textAlign(LEFT, CENTER); text((vlen(vsub(DEST, P.p)) / 1000).toFixed(1) + ' K', CX + 300, CY + 96);
  textSize(9); fill(...col, 150); textAlign(RIGHT, CENTER); text('KM/H', CX - 300, CY + 112); textAlign(LEFT, CENTER); text('DEST', CX + 300, CY + 112);
  noGlow(); ctx.restore();
}
function drawCockpit() {
  const ctx = drawingContext, low = P.shield / maxSh() < 0.3, t = frameCount;
  ctx.save(); noGlow();
  // 1. ガラスの反射と、周辺の暗がり
  ctx.save(); ctx.beginPath(); ckPath(ctx, CKWIN); ctx.clip();
  ctx.fillStyle = 'rgba(255,255,255,0.028)'; ctx.beginPath(); ctx.moveTo(260, 58); ctx.lineTo(420, 58); ctx.lineTo(300, 486); ctx.lineTo(170, 486); ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.02)'; ctx.beginPath(); ctx.moveTo(520, 58); ctx.lineTo(590, 58); ctx.lineTo(470, 486); ctx.lineTo(420, 486); ctx.fill();
  const vg = ctx.createRadialGradient(CX, CY, 220, CX, CY, 620); vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,0,0.42)'); ctx.fillStyle = vg; ctx.fillRect(0, 0, W, H);
  if (P.shield / maxSh() < 0.25) {   // シールドが少ないと、ガラスにひびが入る
    const k = 1 - P.shield / maxSh() / 0.25; ctx.strokeStyle = `rgba(220,240,255,${0.55 * k})`; ctx.lineWidth = 1;
    for (let c = 0; c < 3; c++) { let x = 220 + ckR(c * 7) * 840, y = 90 + ckR(c * 7 + 1) * 360; for (let s = 0; s < 8; s++) { ctx.beginPath(); ctx.moveTo(x, y); const nx = x + (ckR(c * 31 + s) - 0.5) * 120, ny = y + (ckR(c * 17 + s + 3) - 0.3) * 90; ctx.lineTo(nx, ny); ctx.stroke(); if (s % 3 === 0) { ctx.beginPath(); ctx.moveTo(nx, ny); ctx.lineTo(nx + (ckR(s + c) - 0.5) * 70, ny + (ckR(s * 2 + c) - 0.5) * 60); ctx.stroke(); } x = nx; y = ny; }
    }
  }
  ctx.restore();
  // 2. 枠(窓の外側を、暗い金属で塗る)
  const g = ctx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#0b1420'); g.addColorStop(0.5, '#070c14'); g.addColorStop(1, '#03060a');
  ctx.beginPath(); ctx.rect(0, 0, W, H); ckPath(ctx, CKWIN); ctx.fillStyle = g; ctx.fill('evenodd');
  ctx.lineWidth = 1; ctx.strokeStyle = 'rgba(58,92,118,.55)';   // 装甲板の継ぎ目
  for (const [a, b, c, d] of [[150, 58, 0, 0], [1130, 58, 1280, 0], [44, 486, 0, 532], [1236, 486, 1280, 532], [640, 58, 640, 0], [70, 58, 150, 58], [1210, 58, 1130, 58], [78, 300, 22, 486], [1202, 300, 1258, 486]]) { ctx.beginPath(); ctx.moveTo(a, b); ctx.lineTo(c, d); ctx.stroke(); }
  ctx.fillStyle = 'rgba(30,52,72,.5)'; ctx.beginPath(); ctx.moveTo(0, 30); ctx.lineTo(150, 58); ctx.lineTo(44, 486); ctx.lineTo(0, 532); ctx.fill(); ctx.beginPath(); ctx.moveTo(1280, 30); ctx.lineTo(1130, 58); ctx.lineTo(1236, 486); ctx.lineTo(1280, 532); ctx.fill();
  const edge = low ? 'rgba(255,90,80,' : 'rgba(110,205,235,';   // 窓の縁の発光(シールドが少ないと、赤)
  ctx.beginPath(); ckPath(ctx, CKWIN); ctx.strokeStyle = edge + (0.5 + 0.2 * Math.sin(t * 0.08)) + ')'; ctx.lineWidth = 2.5; ctx.stroke();
  ctx.beginPath(); ckPath(ctx, CKWIN.map(([x, y]) => [x + (x < 640 ? -9 : 9), y + (y < 300 ? -8 : 9)])); ctx.strokeStyle = 'rgba(70,120,150,.5)'; ctx.lineWidth = 1; ctx.stroke();
  ctx.fillStyle = 'rgba(120,170,200,.55)'; for (const [x, y] of [[40, 22], [1240, 22], [200, 30], [1080, 30], [640, 34], [14, 506], [1266, 506], [30, 524], [1250, 524]]) { ctx.beginPath(); ctx.arc(x, y, 2.4, 0, TWO_PI); ctx.fill(); }   // リベット
  for (const sx of [22, 1258]) for (let i = 0; i < 9; i++) { const on = (i + Math.floor(t / 20)) % 4 === 0; ctx.fillStyle = on ? 'rgba(110,235,255,.9)' : 'rgba(40,70,90,.8)'; ctx.fillRect(sx - 4, 100 + i * 40, 8, 14); }   // 側面の表示灯
  // 3. 計器盤
  const dg = ctx.createLinearGradient(0, 486, 0, 720); dg.addColorStop(0, '#111e2c'); dg.addColorStop(1, '#04080d');
  ctx.beginPath(); ckPath(ctx, CKDASH); ctx.fillStyle = dg; ctx.fill(); ctx.strokeStyle = 'rgba(130,190,215,.5)'; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(0, 532); ctx.lineTo(44, 486); ctx.lineTo(1236, 486); ctx.lineTo(1280, 532); ctx.stroke();
  // 警告灯
  const lamps = [['SHLD', low, [255, 90, 80]], ['HIT', P.hitT > 0, [255, 90, 80]], ['ACID', P.acidT > 0, [120, 255, 90]], ['SLOW', P.slowT > 0, [255, 190, 90]], ['CHAOS', P.confT > 0, [220, 110, 255]], ['FA OFF', !P.fa, [255, 190, 90]], ['LOCK', P.locks.length > 0, [255, 210, 90]], ['BOSS', !!(bossSpawned && bossShip && bossShip.alive), [255, 100, 90]], ['WARP', mode === 'warp', [110, 220, 255]]];
  lamps.forEach(([n, on, c], i) => { const x = 196 + i * 100, y = 493; ctx.beginPath(); ckRoundRect(ctx, x, y, 90, 18, 4); ctx.fillStyle = on ? `rgba(${c[0]},${c[1]},${c[2]},${0.25 + 0.2 * Math.abs(Math.sin(t * 0.25))})` : 'rgba(10,20,30,.9)'; ctx.fill(); ctx.strokeStyle = on ? `rgb(${c[0]},${c[1]},${c[2]})` : 'rgba(70,100,120,.6)'; ctx.stroke(); noStroke(); fill(on ? color(c[0], c[1], c[2]) : color(80, 110, 130)); textAlign(CENTER, CENTER); textSize(10); text(n, x + 45, y + 9.5); });
  // 左: 機体(SYSTEMS)
  const bay = (x, y, w, h, title) => { ctx.beginPath(); ckRoundRect(ctx, x, y, w, h, 8); ctx.fillStyle = 'rgba(2,10,17,.94)'; ctx.fill(); ctx.strokeStyle = 'rgba(95,165,195,.65)'; ctx.lineWidth = 1.5; ctx.stroke(); ctx.beginPath(); ckRoundRect(ctx, x - 6, y - 6, w + 12, h + 12, 12); ctx.strokeStyle = 'rgba(45,75,98,.7)'; ctx.lineWidth = 1; ctx.stroke(); noStroke(); fill(110, 190, 215); textAlign(LEFT, TOP); textSize(10); text(title, x + 12, y + 8); };
  bay(50, 526, 372, 172, 'SYSTEMS');
  ckArc(140, 626, 46, P.shield / maxSh(), P.shield / maxSh() > 0.35 ? [110, 235, 245] : [255, 100, 90], 'SHIELD', Math.ceil(constrain(P.shield / maxSh(), 0, 1) * 100));
  ckArc(262, 630, 36, P.boost / boostMax(), [255, 200, 110], 'BOOST', Math.round(P.boost / boostMax() * 100));
  noStroke(); fill(230, 245, 250); textAlign(RIGHT, TOP); textSize(24); text(String(Math.round(P.speed * 40)).padStart(4, '0'), 408, 544); textSize(9); fill(140, 180, 195); text('KM/H  ' + (P.form === 'combat' ? 'COMBAT' : 'CRUISE'), 408, 572);
  fill(150, 190, 205); textAlign(LEFT, CENTER); textSize(9); text('WIDE', 320, 606); for (let i = 0; i < 10; i++) { fill(255, 200, 110, i / 10 < P.energy / 100 ? 230 : 40); rect(320 + i * 9, 616, 7, 8); }
  fill(150, 190, 205); text('LIVES ' + P.lives + '   CR ' + P.credits, 320, 642); text('SCORE ' + String(P.score).padStart(7, '0'), 320, 658);
  if (chain >= 2) { fill(255, 170, 110); textSize(13); text('CHAIN ' + chain + ' ×' + chainMul(), 320, 678); }
  // 中央: レーダーの枠
  ctx.beginPath(); ckRoundRect(ctx, 468, 500, 344, 210, 10); ctx.strokeStyle = 'rgba(70,120,150,.6)'; ctx.lineWidth = 1.2; ctx.stroke();
  // 右: 目標(TARGET)
  bay(858, 526, 372, 172, 'TARGET / TACTICAL');
  const tg = ckTarget();
  if (tg) {
    const e = tg.e, dv = vsub(e.p, cam.p), lx = dot(dv, cam.r), ly = dot(dv, cam.u), lz = dot(dv, cam.f), name = ckName(e);
    noStroke(); fill(255, 220, 140); textAlign(LEFT, TOP); textSize(13); text(name.length > 26 ? name.slice(0, 26) : name, 874, 548);
    fill(150, 200, 215); textSize(11); text('RANGE  ' + (tg.d / 1000).toFixed(2) + ' KM', 874, 570);
    const hpf = e.maxHp ? e.hp / e.maxHp : e.kind === 'part' ? e.hp / e.maxhp : e.gensAlive ? (e.gensAlive() ? 1 : e.bridge.hp / e.bridge.maxhp) : 1;
    for (let i = 0; i < 20; i++) { fill(255, 100, 90, i / 20 < hpf ? 230 : 40); rect(874 + i * 9, 592, 7, 8); }
    fill(150, 200, 215); textSize(9); text('HULL', 874, 604);
    const bx = 1150, by = 604, R0 = 40; ctx.strokeStyle = 'rgba(90,160,190,.7)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(bx, by, R0, 0, TWO_PI); ctx.stroke(); ctx.beginPath(); ctx.arc(bx, by, R0 * 0.5, 0, TWO_PI); ctx.stroke(); ctx.beginPath(); ctx.moveTo(bx - R0, by); ctx.lineTo(bx + R0, by); ctx.moveTo(bx, by - R0); ctx.lineTo(bx, by + R0); ctx.stroke();
    let ox = lz > 1 ? lx / lz * 260 : (lx >= 0 ? R0 : -R0) * 3, oy = lz > 1 ? -ly / lz * 260 : (ly >= 0 ? -R0 : R0) * 3; const ml = Math.hypot(ox, oy); if (ml > R0 - 4) { ox *= (R0 - 4) / ml; oy *= (R0 - 4) / ml; }
    noStroke(); fill(lz > 0 ? color(255, 90, 80) : color(255, 190, 90)); ellipse(bx + ox, by + oy, 8);
  } else { noStroke(); fill(90, 130, 150); textAlign(LEFT, TOP); textSize(12); text('NO CONTACT', 874, 552); }
  noStroke(); fill(150, 190, 205); textAlign(LEFT, CENTER); textSize(10); text('LOCK  ' + P.locks.length + ' / ' + lockMax(), 874, 636); text('CONTACTS  ' + fighters.length, 874, 652); text('FA  ' + (P.fa ? 'ON' : 'OFF') + '   [G]', 874, 668); text('KILLS  ' + P.kills, 874, 684);
  ctx.restore();
  drawGlassHUD();
}
