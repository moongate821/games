// コックピット v2(2026-09-26 その7): 宇宙戦の操縦席視点の動画をお手本に、窓は画面いっぱい、計器盤は低い帯、細い曲線の枠、
// ガラスに映る大きな点線の照準リング・目標の枠・目標の一覧、揺れる計器盤、操縦桿とスロットルに手。
// 窓と計器盤の形は flight.js の CKWIN / CKDASH。旧版は flight.js の drawCockpit(#oldcockpit で戻す)。
(function () {
  if (/oldcockpit/.test(location.hash)) return;
  const ck = { sx: 0, sy: 0, py: 0, pp: 0, ready: false };
  const TEAL = [70, 225, 215], RING = 34;

  function sway() {   // 計器盤の揺れ: 機首を振ると遅れてついてくる。ブーストで小刻みに震える
    if (!ck.ready) { ck.py = P.yaw; ck.pp = P.pitch; ck.ready = true; }
    const dy = angDiff(P.yaw - ck.py), dp = P.pitch - ck.pp; ck.py = P.yaw; ck.pp = P.pitch;
    const t = frameCount, tx = constrain(-dy * 520, -16, 16), ty = constrain(dp * 520, -12, 12) + Math.sin(t * 0.045) * 1.2 + (P.boosting ? Math.sin(t * 1.7) * 1.4 : 0);
    ck.sx += (tx - ck.sx) * 0.16; ck.sy += (ty - ck.sy) * 0.16;
  }

  drawCockpit = function () {
    const ctx = drawingContext, low = P.shield / maxSh() < 0.3, t = frameCount;
    sway();
    ctx.save(); noGlow();
    // 1. ガラス: 周辺の暗がり・映り込み・ひび
    ctx.save(); ctx.beginPath(); ckPath(ctx, CKWIN); ctx.clip();
    const vg = ctx.createRadialGradient(CX, CY, 260, CX, CY, 760); vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,4,8,0.5)'); ctx.fillStyle = vg; ctx.fillRect(0, 0, W, H);
    const tg = ctx.createLinearGradient(0, 0, 0, 140); tg.addColorStop(0, 'rgba(0,6,12,.55)'); tg.addColorStop(1, 'rgba(0,0,0,0)'); ctx.fillStyle = tg; ctx.fillRect(0, 0, W, 140);
    ctx.fillStyle = 'rgba(255,255,255,0.022)'; ctx.beginPath(); ctx.moveTo(300, 0); ctx.lineTo(470, 0); ctx.lineTo(330, 520); ctx.lineTo(200, 520); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.016)'; ctx.beginPath(); ctx.moveTo(560, 0); ctx.lineTo(620, 0); ctx.lineTo(500, 520); ctx.lineTo(450, 520); ctx.fill();
    if (P.shield / maxSh() < 0.25) {
      const k = 1 - P.shield / maxSh() / 0.25; ctx.strokeStyle = `rgba(220,240,255,${0.55 * k})`; ctx.lineWidth = 1;
      for (let c = 0; c < 3; c++) { let x = 200 + ckR(c * 7) * 880, y = 60 + ckR(c * 7 + 1) * 380; for (let s = 0; s < 8; s++) { ctx.beginPath(); ctx.moveTo(x, y); const nx = x + (ckR(c * 31 + s) - 0.5) * 120, ny = y + (ckR(c * 17 + s + 3) - 0.3) * 90; ctx.lineTo(nx, ny); ctx.stroke(); if (s % 3 === 0) { ctx.beginPath(); ctx.moveTo(nx, ny); ctx.lineTo(nx + (ckR(s + c) - 0.5) * 70, ny + (ckR(s * 2 + c) - 0.5) * 60); ctx.stroke(); } x = nx; y = ny; } }
    }
    ctx.restore();
    // 2. 細い曲線の枠(左右の柱と、屋根の梁)。計器盤といっしょに揺れる
    ctx.save(); ctx.translate(ck.sx, ck.sy);
    const bow = (x0, y0, cx1, cy1, x1, y1, w) => {
      ctx.lineCap = 'round'; ctx.strokeStyle = '#070d14'; ctx.lineWidth = w; ctx.beginPath(); ctx.moveTo(x0, y0); ctx.quadraticCurveTo(cx1, cy1, x1, y1); ctx.stroke();
      ctx.strokeStyle = low ? 'rgba(255,110,90,.75)' : 'rgba(150,215,235,.65)'; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(x0 + (x0 < 640 ? w * 0.36 : -w * 0.36), y0); ctx.quadraticCurveTo(cx1 + (x0 < 640 ? w * 0.36 : -w * 0.36), cy1, x1, y1 + w * 0.3); ctx.stroke();
      ctx.lineCap = 'butt';
    };
    bow(-40, 380, 40, 70, 430, -30, 22); bow(1320, 380, 1240, 70, 850, -30, 22);   // 左右の柱
    bow(400, -20, 640, 30, 880, -20, 12);                                            // 屋根の梁
    ctx.strokeStyle = 'rgba(70,110,135,.55)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(150, 190); ctx.lineTo(110, 250); ctx.moveTo(1130, 190); ctx.lineTo(1170, 250); ctx.stroke();
    // 3. 計器盤(低い帯。中央が盛り上がる)
    const dg = ctx.createLinearGradient(0, 488, 0, 730); dg.addColorStop(0, '#12212b'); dg.addColorStop(0.35, '#0a141c'); dg.addColorStop(1, '#03070b');
    ctx.beginPath(); ctx.moveTo(-40, 740); ctx.lineTo(-40, 594); for (const [x, y] of CKDASH.slice(1, -2)) ctx.lineTo(x, y); ctx.lineTo(1320, 594); ctx.lineTo(1320, 740); ctx.closePath(); ctx.fillStyle = dg; ctx.fill();
    const rim = low ? '255,110,90' : '80,235,225';   // 縁の光(シールドが少ないと赤)
    ctx.strokeStyle = `rgba(${rim},${0.55 + 0.2 * Math.sin(t * 0.08)})`; ctx.lineWidth = 2.4; ctx.beginPath(); ctx.moveTo(-40, 594); for (const [x, y] of CKDASH.slice(1, -2)) ctx.lineTo(x, y); ctx.lineTo(1320, 594); ctx.stroke();
    ctx.strokeStyle = 'rgba(60,100,120,.55)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(-40, 606); for (const [x, y] of CKDASH.slice(1, -2)) ctx.lineTo(x, y + 12); ctx.lineTo(1320, 606); ctx.stroke();
    for (const [x, y] of [[60, 640], [1220, 640], [330, 560], [950, 560], [420, 520], [860, 520]]) { ctx.fillStyle = 'rgba(120,170,195,.5)'; ctx.beginPath(); ctx.arc(x, y, 2, 0, TWO_PI); ctx.fill(); }   // リベット
    // 警告灯(盛り上がりの上に一列)
    const lamps = [['SHLD', low, [255, 90, 80]], ['HIT', P.hitT > 0, [255, 90, 80]], ['ACID', P.acidT > 0, [120, 255, 90]], ['SLOW', P.slowT > 0, [255, 190, 90]], ['CHAOS', P.confT > 0, [220, 110, 255]], ['FA OFF', !P.fa, [255, 190, 90]], ['LOCK', P.locks.length > 0, [255, 210, 90]], ['BOSS', !!(bossSpawned && bossShip && bossShip.alive), [255, 100, 90]], ['WARP', mode === 'warp', [110, 220, 255]]];
    lamps.forEach(([n, on, c], i) => { const x = 452 + i * 42, y = 494; ctx.beginPath(); ckRoundRect(ctx, x, y, 39, 14, 3); ctx.fillStyle = on ? `rgba(${c[0]},${c[1]},${c[2]},${0.3 + 0.25 * Math.abs(Math.sin(t * 0.25))})` : 'rgba(6,14,20,.92)'; ctx.fill(); ctx.strokeStyle = on ? `rgb(${c[0]},${c[1]},${c[2]})` : 'rgba(60,95,115,.6)'; ctx.lineWidth = 1; ctx.stroke(); noStroke(); fill(on ? color(c[0], c[1], c[2]) : color(70, 100, 120)); textAlign(CENTER, CENTER); textSize(8); text(n, x + 19.5, y + 7.5); });
    // 小さな画面(左=機体、右=目標)。青緑に光る
    const bay = (x, y, w, h, title) => { ctx.beginPath(); ckRoundRect(ctx, x, y, w, h, 7); ctx.fillStyle = 'rgba(2,12,16,.95)'; ctx.fill(); ctx.strokeStyle = `rgba(${TEAL[0]},${TEAL[1]},${TEAL[2]},.7)`; ctx.lineWidth = 1.4; ctx.stroke(); ctx.beginPath(); ckRoundRect(ctx, x - 5, y - 5, w + 10, h + 10, 10); ctx.strokeStyle = 'rgba(40,80,95,.7)'; ctx.lineWidth = 1; ctx.stroke(); noStroke(); fill(90, 200, 200); textAlign(LEFT, TOP); textSize(9); text(title, x + 10, y + 7); };
    bay(46, 606, 300, 100, 'SYSTEMS');
    ckArc(112, 660, 30, P.shield / maxSh(), P.shield / maxSh() > 0.35 ? [110, 235, 245] : [255, 100, 90], 'SHIELD', Math.ceil(constrain(P.shield / maxSh(), 0, 1) * 100));
    ckArc(202, 664, 24, P.boost / boostMax(), [255, 200, 110], 'BOOST', Math.round(P.boost / boostMax() * 100));
    noStroke(); fill(230, 245, 250); textAlign(RIGHT, TOP); textSize(22); text(String(Math.round(P.speed * 40)).padStart(4, '0'), 334, 620); textSize(8); fill(140, 190, 200); text('KM/H  ' + (P.form === 'combat' ? 'COMBAT' : 'CRUISE'), 334, 644);
    fill(150, 195, 205); textAlign(LEFT, CENTER); textSize(8); text('LIVES ' + P.lives + '  CR ' + P.credits, 246, 668); text('SCORE ' + String(P.score).padStart(7, '0'), 246, 680); if (chain >= 2) { fill(255, 170, 110); textSize(10); text('CHAIN ' + chain + ' ×' + chainMul(), 246, 693); }
    bay(936, 606, 300, 100, 'TARGET');
    const tg2 = ckTarget();
    if (tg2) {
      const e = tg2.e, dv = vsub(e.p, cam.p), lx = dot(dv, cam.r), ly = dot(dv, cam.u), lz = dot(dv, cam.f), name = ckName(e);
      noStroke(); fill(255, 220, 140); textAlign(LEFT, TOP); textSize(12); text(name.length > 22 ? name.slice(0, 22) : name, 950, 626);
      fill(150, 205, 215); textSize(10); text('RANGE  ' + (tg2.d / 1000).toFixed(2) + ' KM', 950, 646);
      const hpf = e.maxHp ? e.hp / e.maxHp : e.kind === 'part' ? e.hp / e.maxhp : e.gensAlive ? (e.gensAlive() ? 1 : e.bridge.hp / e.bridge.maxhp) : 1;
      for (let i = 0; i < 16; i++) { fill(255, 100, 90, i / 16 < hpf ? 230 : 40); rect(950 + i * 9, 664, 7, 7); } fill(150, 205, 215); textSize(8); text('HULL', 950, 676);
      const bx = 1196, by = 662, R0 = 28; ctx.strokeStyle = 'rgba(90,170,190,.7)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(bx, by, R0, 0, TWO_PI); ctx.stroke(); ctx.beginPath(); ctx.arc(bx, by, R0 * 0.5, 0, TWO_PI); ctx.stroke(); ctx.beginPath(); ctx.moveTo(bx - R0, by); ctx.lineTo(bx + R0, by); ctx.moveTo(bx, by - R0); ctx.lineTo(bx, by + R0); ctx.stroke();
      let ox = lz > 1 ? lx / lz * 180 : (lx >= 0 ? R0 : -R0) * 3, oy = lz > 1 ? -ly / lz * 180 : (ly >= 0 ? -R0 : R0) * 3; const ml = Math.hypot(ox, oy); if (ml > R0 - 3) { ox *= (R0 - 3) / ml; oy *= (R0 - 3) / ml; }
      noStroke(); fill(lz > 0 ? color(255, 90, 80) : color(255, 190, 90)); ellipse(bx + ox, by + oy, 6);
    } else { noStroke(); fill(90, 135, 150); textAlign(LEFT, TOP); textSize(11); text('NO CONTACT', 950, 628); }
    noStroke(); fill(150, 195, 205); textAlign(LEFT, CENTER); textSize(8); text('LOCK ' + P.locks.length + '/' + lockMax() + '   CONTACTS ' + fighters.length + '   KILLS ' + P.kills, 950, 694);
    // 手: 左=スロットル(ブーストで前へ)、右=操縦桿(機首の振りに合わせて傾く)
    const gl = (x, y, w, h) => { ctx.beginPath(); ckRoundRect(ctx, x, y, w, h, 12); ctx.fillStyle = '#0c151c'; ctx.fill(); ctx.strokeStyle = 'rgba(120,200,210,.6)'; ctx.lineWidth = 1.4; ctx.stroke(); };
    { const tl = P.boosting ? -26 : -8 - (P.boost / boostMax()) * 6, x = 408;   // スロットル
      ctx.strokeStyle = '#15242e'; ctx.lineWidth = 10; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(x, 730); ctx.lineTo(x + 4, 668 + tl); ctx.stroke(); ctx.lineCap = 'butt';
      gl(x - 30, 650 + tl, 68, 46); ctx.strokeStyle = 'rgba(120,200,210,.5)'; ctx.lineWidth = 1; for (let i = 0; i < 4; i++) { ctx.beginPath(); ctx.moveTo(x - 24 + i * 15, 654 + tl); ctx.lineTo(x - 22 + i * 15, 674 + tl); ctx.stroke(); } }
    { const tx = constrain(ck.sx * 1.6, -22, 22), ty = constrain(ck.sy * 1.2, -12, 12), x = 872;   // 操縦桿
      ctx.strokeStyle = '#15242e'; ctx.lineWidth = 10; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(x, 730); ctx.lineTo(x + tx, 660 + ty); ctx.stroke(); ctx.lineCap = 'butt';
      gl(x + tx - 34, 638 + ty, 68, 52); ctx.strokeStyle = 'rgba(120,200,210,.5)'; ctx.lineWidth = 1; for (let i = 0; i < 4; i++) { ctx.beginPath(); ctx.moveTo(x + tx - 26 + i * 16, 644 + ty); ctx.lineTo(x + tx - 24 + i * 16, 668 + ty); ctx.stroke(); }
      ctx.fillStyle = P.locks.length ? 'rgb(255,120,90)' : 'rgb(255,190,90)'; ctx.beginPath(); ctx.arc(x + tx + 24, 644 + ty, 4, 0, TWO_PI); ctx.fill(); }
    ctx.restore();
    ctx.restore();
    drawGlassHUD();
  };

  // ---- ガラスに映るHUD ----
  drawGlassHUD = function () {
    const ctx = drawingContext, low = P.shield / maxSh() < 0.3, col = low ? [255, 170, 90] : [95, 255, 190], t = frameCount;
    ctx.save(); ctx.beginPath(); ckPath(ctx, CKWIN); ctx.clip(); noFill(); neon(col, 190, lite ? 0 : 5, 1.3);
    // 方位のテープ(上)と、左右の小さな表示
    const hd = ((P.yaw * 180 / PI) % 360 + 360) % 360, ty = 46;
    for (let d = Math.floor(hd / 5) * 5 - 40; d <= hd + 40; d += 5) { const x = CX + (d - hd) * 8.5, major = (((d % 360) + 360) % 360) % 10 === 0; line(x, ty, x, ty + (major ? 11 : 6)); }
    noStroke(); fill(...col); textAlign(CENTER, TOP); textSize(10); for (let d = Math.floor(hd / 10) * 10 - 40; d <= hd + 40; d += 10) { const n = ((d % 360) + 360) % 360; if (n % 30 === 0) text(n === 0 ? 'N' : n === 90 ? 'E' : n === 180 ? 'S' : n === 270 ? 'W' : n, CX + (d - hd) * 8.5, ty + 14); }
    noFill(); neon(col, 220, lite ? 0 : 5, 1.5); triangle(CX - 5, ty - 6, CX + 5, ty - 6, CX, ty);
    neon(col, 170, 0, 1.1); rect(CX - 350, ty - 4, 64, 20, 3); rect(CX + 286, ty - 4, 64, 20, 3);
    noStroke(); fill(...col); textAlign(CENTER, CENTER); textSize(10); text('LOCK ' + P.locks.length + '/' + lockMax(), CX - 318, ty + 6); text('WIDE ' + Math.round(P.energy) + '%', CX + 318, ty + 6);
    // ピッチ目盛り(控えめ)
    push(); translate(CX, CY); rotate(P.roll); neon(col, 110, 0, 1);
    for (let a = -40; a <= 40; a += 10) {
      const ang = a * PI / 180 - P.pitch; if (Math.abs(ang) > 1.05) continue; const y = -F * Math.tan(ang); if (Math.abs(y) > 250) continue;
      if (a === 0) { line(-330, y, -170, y); line(170, y, 330, y); } else { const dd = a > 0 ? 6 : -6; line(-250, y, -190, y); line(190, y, 250, y); line(-250, y, -250, y + dd); line(250, y, 250, y + dd); }
      noStroke(); fill(...col, 140); textSize(9); textAlign(RIGHT, CENTER); text(Math.abs(a), -258, y); textAlign(LEFT, CENTER); text(Math.abs(a), 258, y); noFill(); neon(col, 110, 0, 1);
    }
    pop();
    // 大きな点線の照準リング(ロックがあると、琥珀色で回る)
    const lk = P.locks.length > 0, rc = lk ? [255, 200, 100] : col, rot = lk ? t * 0.02 : 0, RR = 118;
    neon(rc, 200, lite ? 0 : 5, 2.2);
    for (let i = 0; i < 48; i++) { const a = i * TWO_PI / 48 + rot; if (i % 12 >= 10) continue; line(CX + Math.cos(a) * RR, CY + Math.sin(a) * RR, CX + Math.cos(a) * (RR + 9), CY + Math.sin(a) * (RR + 9)); }
    neon(col, 200, lite ? 0 : 5, 1.5); ellipse(CX, CY, RING * 2); ellipse(CX, CY, 3);
    for (let k = 0; k < 4; k++) { const a = k * PI / 2; line(CX + Math.cos(a) * (RING + 4), CY + Math.sin(a) * (RING + 4), CX + Math.cos(a) * (RING + 14), CY + Math.sin(a) * (RING + 14)); }
    // 目標の枠(いちばん近い敵): 名前と距離
    const tg = ckTarget();
    if (tg) {
      const e = tg.e, p = projW(e.p);
      if (p && p[0] > 60 && p[0] < W - 60 && p[1] > 90 && p[1] < 500) {
        const r = constrain(p[2] * (e.hullR || e.r || 40) * 1.1, 16, 110), locked = P.locks.includes(e), c2 = locked ? [255, 200, 100] : [255, 100, 90], L = r * 0.45;
        neon(c2, 230, lite ? 0 : 5, 1.6);
        for (const [sx, sy] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) { line(p[0] + sx * r, p[1] + sy * r, p[0] + sx * (r - L), p[1] + sy * r); line(p[0] + sx * r, p[1] + sy * r, p[0] + sx * r, p[1] + sy * (r - L)); }
        noStroke(); fill(...c2); textSize(10); textAlign(LEFT, BOTTOM); const nm = ckName(e); text(nm.length > 24 ? nm.slice(0, 24) : nm, p[0] + r + 6, p[1] - r + 12); textAlign(LEFT, TOP); text((tg.d / 1000).toFixed(2) + ' KM' + (locked ? '   LOCK ON' : ''), p[0] + r + 6, p[1] - r + 14);
      }
    }
    // 目標の一覧(右上)
    const ol = typeof window.__cinObj === 'function' ? window.__cinObj() : [];
    if (ol.length) {
      const bx = W - 300, by = 84, h = 22 + ol.length * 18; noStroke(); fill(0, 10, 16, 150); rect(bx, by, 250, h); fill(...col); rect(bx + 244, by, 3, h);
      noStroke(); fill(...col); textAlign(LEFT, TOP); textSize(12); text(TR('目標', 'TARGETS'), bx + 10, by + 5);
      ol.forEach(([done, txt], i) => { noFill(); neon(col, 200, 0, 1.2); rect(bx + 12, by + 28 + i * 18, 9, 9); if (done) { line(bx + 14, by + 32 + i * 18, bx + 17, by + 36 + i * 18); line(bx + 17, by + 36 + i * 18, bx + 23, by + 27 + i * 18); } noStroke(); fill(...col, done ? 130 : 240); textSize(11); text(txt, bx + 28, by + 27 + i * 18); });
    }
    // 速度と目的地までの距離
    noStroke(); fill(...col); textSize(15); textAlign(RIGHT, CENTER); text(String(Math.round(P.speed * 40)).padStart(4, '0'), CX - 300, CY + 96); textAlign(LEFT, CENTER); text((vlen(vsub(DEST, P.p)) / 1000).toFixed(1) + ' K', CX + 300, CY + 96);
    textSize(9); fill(...col, 150); textAlign(RIGHT, CENTER); text('KM/H', CX - 300, CY + 112); textAlign(LEFT, CENTER); text('DEST', CX + 300, CY + 112);
    // 武装の表示(計器盤の縁の上)
    const wy = 528; noFill(); neon(col, 150, 0, 1.2); line(140, wy + 16, 400, wy + 2); line(1140, wy + 16, 880, wy + 2);
    noStroke(); fill(...col, 220); textSize(11); textAlign(LEFT, BOTTOM); text('PULSE LASER', 146, wy + 8); textAlign(RIGHT, BOTTOM); text('WIDE CANNON', 1134, wy + 8);
    for (let i = 0; i < 10; i++) { fill(...col, i / 10 < P.energy / 100 ? 220 : 40); rect(1134 - 90 + i * 9, wy + 11, 7, 3); }
    noGlow(); ctx.restore();
  };
})();
