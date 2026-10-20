// ==========================================================================
// realism.js — フィールドの実写化(2026-10-20)。#noreal をURLに付けると無効。
//   1) 地面: 生成画像を高品質に縮小して滑らかに敷き、草・砂粒・小石・雪の煌めきを重ねる
//   2) 置物: 木・松・岩・ヤシ・サボテン・氷を、輪郭線なしの陰影つきで描く(初回だけ生成して使い回す)
//   3) 影: 接地の暗がり(AO)と、太陽の向きに伸びる柔らかい影
//   4) 仕上げ: 雲の影・ブルーム・コントラスト・周辺減光・フィルムグレイン・木漏れ日・上下のボケ
// game.js の関数(propAt / sunShadow / propGround / shadow / drawFieldTexture / drawRoadTile / drawRadarFog)を
// 後から差し替える。重いときは自動で品質を下げる(REAL.q)。
// ==========================================================================
(function () {
  if (location.hash.includes('noreal')) return;
  const R = window.REAL = { q: 2, on: true };
  const mk = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };
  const rng = seed => { let a = seed >>> 0; return () => { a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; };
  const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
  const mix = (a, b, k) => [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, a[2] + (b[2] - a[2]) * k];
  const rgb = (c, a) => a == null ? `rgb(${c[0] | 0},${c[1] | 0},${c[2] | 0})` : `rgba(${c[0] | 0},${c[1] | 0},${c[2] | 0},${a})`;
  const ramp = (p, k) => k < .5 ? mix(p[0], p[1], k * 2) : mix(p[1], p[2], (k - .5) * 2);   // 暗→中→明

  // ---------------- 柔らかい影の素材 ----------------
  const soft = mk(128, 128);
  { const g = soft.getContext('2d'), gr = g.createRadialGradient(64, 64, 0, 64, 64, 64); gr.addColorStop(0, 'rgba(0,0,0,1)'); gr.addColorStop(.45, 'rgba(0,0,0,.62)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.fillRect(0, 0, 128, 128); }

  // ---------------- 置物の生成 ----------------
  const sprites = {};
  const ctxOf = c => c.getContext('2d');

  // 広葉樹: 幹+葉の塊を陰影つきで重ねる。光は右上から。v=色違い、blossom=花の咲いた木
  function genTree(v, blossom) {
    const r = rng(1000 + v * 91 + (blossom ? 7 : 0)), c = mk(240, 320), g = ctxOf(c);
    const pals = [[[30, 78, 36], [74, 138, 56], [170, 208, 88]], [[28, 70, 46], [58, 120, 66], [132, 184, 100]], [[44, 90, 30], [98, 150, 46], [194, 210, 92]], [[34, 80, 48], [68, 128, 74], [148, 196, 116]]];
    const pal = pals[v % 4];
    // 幹: 根元が広がって先細り。左が暗く右が明るい
    g.save(); g.beginPath(); g.moveTo(104, 316); g.quadraticCurveTo(110, 300, 112, 270); g.quadraticCurveTo(113, 220, 110, 170); g.lineTo(130, 170); g.quadraticCurveTo(128, 222, 130, 270); g.quadraticCurveTo(134, 300, 142, 316); g.closePath(); g.clip();
    const tg = g.createLinearGradient(100, 0, 146, 0); tg.addColorStop(0, '#2a1c12'); tg.addColorStop(.5, '#5e4128'); tg.addColorStop(1, '#a07850'); g.fillStyle = tg; g.fillRect(90, 160, 70, 170);
    for (let i = 0; i < 46; i++) { const x = 102 + r() * 40, y0 = 170 + r() * 140; g.strokeStyle = r() < .6 ? 'rgba(20,12,6,.35)' : 'rgba(210,170,120,.22)'; g.lineWidth = .8 + r() * 1.6; g.beginPath(); g.moveTo(x, y0); g.lineTo(x + (r() - .5) * 4, y0 + 10 + r() * 24); g.stroke(); }
    g.restore();
    // 葉冠は別レイヤーで作り、あとで幹に重ねる
    const cc = mk(240, 320), q = ctxOf(cc), cx = 120, cy = 118, rx = 104, ry = 96;
    const inside = (m) => { for (; ;) { const a = r() * 6.283, d = Math.sqrt(r()); const x = cx + Math.cos(a) * d * rx * m, y = cy + Math.sin(a) * d * ry * m; return [x, y]; } };
    const lobes = []; for (let i = 0; i < 26; i++) { const p = inside(.82); lobes.push({ x: p[0], y: p[1], rad: 28 + r() * 22 }); } lobes.sort((a, b) => b.y - a.y);
    for (const l of lobes) { const gr = q.createRadialGradient(l.x + l.rad * .35, l.y - l.rad * .4, 1, l.x, l.y, l.rad * 1.08); gr.addColorStop(0, rgb(ramp(pal, .86))); gr.addColorStop(.5, rgb(ramp(pal, .45))); gr.addColorStop(1, rgb(ramp(pal, .05))); q.fillStyle = gr; q.beginPath(); q.arc(l.x, l.y, l.rad, 0, 7); q.fill(); }
    q.globalCompositeOperation = 'source-atop';
    for (let i = 0; i < 16; i++) { const p = inside(.9), rr = 10 + r() * 14; const gr = q.createRadialGradient(p[0], p[1], 0, p[0], p[1], rr); gr.addColorStop(0, 'rgba(4,16,8,.34)'); gr.addColorStop(1, 'rgba(4,16,8,0)'); q.fillStyle = gr; q.fillRect(p[0] - rr, p[1] - rr, rr * 2, rr * 2); }
    q.globalCompositeOperation = 'source-over';
    for (let i = 0; i < 1500; i++) {
      const edge = r() < .1, p = inside(edge ? 1.05 : .98), lit = clamp(.5 + (p[0] - cx) / rx * .32 - (p[1] - cy) / ry * .34 + (r() - .5) * .5, 0, 1), col = ramp(pal, lit);
      q.fillStyle = rgb(col, .55 + r() * .4); q.save(); q.translate(p[0], p[1]); q.rotate(r() * 3.14); q.beginPath(); q.ellipse(0, 0, 2 + r() * 3.4, 1.2 + r() * 1.8, 0, 0, 7); q.fill(); q.restore();
    }
    for (let i = 0; i < 170; i++) { const p = inside(.9); if (p[0] < cx - rx * .2 || p[1] > cy + ry * .1) { i--; if (r() < .02) break; continue; } q.fillStyle = `rgba(222,238,130,${.16 + r() * .26})`; q.beginPath(); q.ellipse(p[0], p[1], 1.6 + r() * 2, 1 + r(), r() * 3, 0, 7); q.fill(); }
    if (blossom) for (let i = 0; i < 150; i++) { const p = inside(.95); q.fillStyle = r() < .5 ? '#f6c9d8' : '#fff1f5'; q.globalAlpha = .75 + r() * .25; q.beginPath(); q.arc(p[0], p[1], 1.8 + r() * 2.2, 0, 7); q.fill(); } q.globalAlpha = 1;
    q.globalCompositeOperation = 'source-atop';
    const sh = q.createLinearGradient(0, cy - ry * .3, 0, cy + ry); sh.addColorStop(0, 'rgba(0,10,4,0)'); sh.addColorStop(1, 'rgba(0,10,4,.36)'); q.fillStyle = sh; q.fillRect(0, 0, 240, 320);
    const sd = q.createLinearGradient(cx - rx, 0, cx + rx, 0); sd.addColorStop(0, 'rgba(0,10,4,.2)'); sd.addColorStop(.6, 'rgba(0,10,4,0)'); q.fillStyle = sd; q.fillRect(0, 0, 240, 320);
    g.drawImage(cc, 0, 0);
    // 幹と葉の境目の影
    g.globalCompositeOperation = 'destination-over'; g.globalCompositeOperation = 'source-over';
    return { c, base: 312 / 320 };
  }

  // 針葉樹: 段々の枝。snow=雪が積もる
  function genPine(v, snow) {
    const r = rng(3000 + v * 53 + (snow ? 5 : 0)), c = mk(200, 340), g = ctxOf(c);
    const pals = [[[12, 44, 32], [30, 86, 58], [96, 154, 108]], [[16, 50, 40], [38, 96, 66], [104, 160, 116]], [[18, 52, 30], [44, 100, 52], [118, 166, 84]]], pal = pals[v % 3];
    g.fillStyle = '#3c2a1a'; g.fillRect(93, 280, 14, 56); const tg = g.createLinearGradient(90, 0, 110, 0); tg.addColorStop(0, 'rgba(0,0,0,.45)'); tg.addColorStop(1, 'rgba(255,220,170,.2)'); g.fillStyle = tg; g.fillRect(93, 280, 14, 56);
    const tiers = 7;
    for (let i = 0; i < tiers; i++) {
      const yb = 308 - i * 38, w = 80 - i * 9.5, top = yb - 82 + i * 4, pts = [[100, top]];
      for (let k = 0; k <= 8; k++) { const f = k / 8, x = 100 - w + f * 2 * w, dr = (k % 2 ? 7 : -3) + r() * 5; pts.push([x, yb + dr + Math.sin(f * 3.14) * 6]); }
      g.save(); g.beginPath(); g.moveTo(pts[0][0], pts[0][1]); for (let k = 1; k < pts.length; k++) g.lineTo(pts[k][0], pts[k][1]); g.closePath(); g.clip();
      const gr = g.createLinearGradient(100 - w, 0, 100 + w, 0); gr.addColorStop(0, rgb(pal[0])); gr.addColorStop(.55, rgb(pal[1])); gr.addColorStop(1, rgb(pal[2])); g.fillStyle = gr; g.fillRect(0, top - 4, 200, yb - top + 24);
      for (let k = 0; k < 210; k++) { const x = 100 - w + r() * 2 * w, y = top + r() * (yb - top + 10), spread = (y - top) / (yb - top + 10); if (Math.abs(x - 100) > w * spread + 6) continue; const lit = clamp(.5 + (x - 100) / w * .45 - .12 + (r() - .5) * .45, 0, 1); g.strokeStyle = rgb(ramp(pal, lit), .75); g.lineWidth = 1 + r() * .9; g.beginPath(); g.moveTo(x, y); g.lineTo(x + (x < 100 ? -1 : 1) * (2 + r() * 5), y + 5 + r() * 6); g.stroke(); }
      const sg = g.createLinearGradient(0, yb - 22, 0, yb + 10); sg.addColorStop(0, 'rgba(0,12,8,0)'); sg.addColorStop(1, 'rgba(0,12,8,.5)'); g.fillStyle = sg; g.fillRect(0, yb - 22, 200, 40);
      if (snow) { g.fillStyle = 'rgba(244,250,255,.96)'; g.beginPath(); g.moveTo(100, top - 2); for (let k = 0; k <= 10; k++) { const f = k / 10, x = 100 + (f * 2 - 1) * w * .8; g.lineTo(x, top + (yb - top) * (.42 + Math.abs(f - .5) * .3) + (r() - .5) * 8); } g.closePath(); g.fill(); const wg = g.createLinearGradient(100 - w, 0, 100 + w, 0); wg.addColorStop(0, 'rgba(150,180,215,.5)'); wg.addColorStop(.7, 'rgba(150,180,215,0)'); g.fillStyle = wg; g.fillRect(0, top, 200, yb - top); }
      g.restore();
    }
    return { c, base: 334 / 340 };
  }

  // 岩: 面ごとに明るさを変え、粒・ひび・苔(または雪・砂の地層)を載せる
  function genRock(v, kind) {
    const r = rng(5000 + v * 37 + (kind === 'snow' ? 1 : kind === 'sand' ? 2 : 0)), c = mk(220, 210), g = ctxOf(c);
    const base = kind === 'sand' ? [[110, 70, 38], [176, 124, 70], [226, 178, 112]] : kind === 'snow' ? [[78, 86, 100], [128, 138, 152], [196, 206, 218]] : v % 3 === 0 ? [[56, 56, 60], [112, 112, 114], [188, 186, 180]] : v % 3 === 1 ? [[62, 58, 54], [120, 112, 102], [196, 186, 168]] : [[48, 54, 58], [100, 108, 112], [176, 184, 186]];
    const cx = 110, cy = 128, n = 11, pts = []; for (let i = 0; i < n; i++) { const a = i / n * 6.283 - 1.57; let x = cx + Math.cos(a) * 92 * (.8 + r() * .28), y = cy + Math.sin(a) * 74 * (.78 + r() * .3); if (y > 188) y = 188 - r() * 4; pts.push([x, y]); }
    g.save(); g.beginPath(); g.moveTo(pts[0][0], pts[0][1]); for (let i = 1; i <= n; i++) { const p = pts[i % n], q0 = pts[i - 1]; g.quadraticCurveTo(q0[0] + (p[0] - q0[0]) * .3 + (r() - .5) * 8, q0[1] + (p[1] - q0[1]) * .3 + (r() - .5) * 8, p[0], p[1]); } g.closePath(); g.clip();
    const bg = g.createLinearGradient(cx - 70, cy + 70, cx + 70, cy - 70); bg.addColorStop(0, rgb(base[0])); bg.addColorStop(.5, rgb(base[1])); bg.addColorStop(1, rgb(base[2])); g.fillStyle = bg; g.fillRect(0, 0, 220, 210);
    const fc = [cx + 14, cy - 30];
    for (let i = 0; i < n; i++) { const a = pts[i], b = pts[(i + 1) % n], mx = (a[0] + b[0]) / 2 - fc[0], my = (a[1] + b[1]) / 2 - fc[1], m = Math.hypot(mx, my) || 1, lit = clamp(.5 + (mx / m) * .42 - (my / m) * .5, 0, 1); g.fillStyle = lit > .5 ? `rgba(255,248,230,${(lit - .5) * .5})` : `rgba(10,12,20,${(.5 - lit) * .6})`; g.beginPath(); g.moveTo(fc[0], fc[1]); g.lineTo(a[0], a[1]); g.lineTo(b[0], b[1]); g.closePath(); g.fill(); }
    for (let i = 0; i < 900; i++) { const x = 20 + r() * 180, y = 40 + r() * 150; g.fillStyle = r() < .5 ? `rgba(0,0,0,${.08 + r() * .16})` : `rgba(255,255,255,${.05 + r() * .12})`; g.fillRect(x, y, 1 + r() * 2.2, 1 + r() * 1.6); }
    g.strokeStyle = 'rgba(8,8,12,.5)'; g.lineWidth = 1.2; for (let k = 0; k < 4; k++) { let x = 50 + r() * 120, y = 70 + r() * 90; g.beginPath(); g.moveTo(x, y); for (let j = 0; j < 5; j++) { x += (r() - .5) * 16; y += 6 + r() * 8; g.lineTo(x, y); } g.stroke(); }
    if (kind === 'sand') { g.strokeStyle = 'rgba(70,40,18,.35)'; g.lineWidth = 2; for (let k = 0; k < 6; k++) { const y = 70 + k * 20 + r() * 6; g.beginPath(); g.moveTo(10, y); g.bezierCurveTo(70, y + 5, 150, y - 5, 210, y + 4); g.stroke(); } }
    else if (kind === 'snow') { g.fillStyle = 'rgba(246,251,255,.97)'; g.beginPath(); g.moveTo(20, 118); g.bezierCurveTo(40, 52, 150, 40, 200, 112); g.bezierCurveTo(170, 98, 150, 102, 128, 92); g.bezierCurveTo(100, 108, 60, 96, 20, 118); g.fill(); }
    else { for (let i = 0; i < 260; i++) { const x = 30 + r() * 150, y = 52 + r() * 70 + r() * 14; g.fillStyle = `rgba(${60 + r() * 40 | 0},${96 + r() * 50 | 0},${34 + r() * 24 | 0},${.18 + r() * .4})`; g.beginPath(); g.arc(x, y, 1.4 + r() * 2.6, 0, 7); g.fill(); } }
    const ao = g.createLinearGradient(0, 150, 0, 192); ao.addColorStop(0, 'rgba(0,0,0,0)'); ao.addColorStop(1, 'rgba(0,0,0,.5)'); g.fillStyle = ao; g.fillRect(0, 140, 220, 60);
    g.restore();
    return { c, base: 190 / 210 };
  }

  function genPalm(v) {
    const r = rng(7000 + v * 11), c = mk(280, 340), g = ctxOf(c), lean = (v % 2 ? 1 : -1) * 24;
    const P0 = [140, 330], P1 = [140 + lean * .3, 220], P2 = [140 + lean, 70];
    const at = t => { const a = (1 - t) * (1 - t), b = 2 * (1 - t) * t, d = t * t; return [a * P0[0] + b * P1[0] + d * P2[0], a * P0[1] + b * P1[1] + d * P2[1]]; };
    for (let i = 0; i < 60; i++) { const t0 = i / 60, t1 = (i + 1) / 60, a = at(t0), b = at(t1), w = 17 - t0 * 7; g.strokeStyle = i % 4 === 0 ? '#4a3420' : '#8a6842'; g.lineWidth = w; g.lineCap = 'butt'; g.beginPath(); g.moveTo(a[0], a[1]); g.lineTo(b[0], b[1]); g.stroke(); g.strokeStyle = 'rgba(255,230,190,.28)'; g.lineWidth = w * .3; g.beginPath(); g.moveTo(a[0] + w * .22, a[1]); g.lineTo(b[0] + w * .22, b[1]); g.stroke(); g.strokeStyle = 'rgba(0,0,0,.3)'; g.lineWidth = w * .3; g.beginPath(); g.moveTo(a[0] - w * .3, a[1]); g.lineTo(b[0] - w * .3, b[1]); g.stroke(); }
    const top = P2;
    for (let f = 0; f < 10; f++) {
      const a = f / 10 * 6.283 + r() * .3, len = 110 + r() * 34, ex = top[0] + Math.cos(a) * len, ey = top[1] + Math.sin(a) * len * .35 + 34 + Math.abs(Math.cos(a)) * 26, mx = top[0] + Math.cos(a) * len * .5, my = top[1] - 30 - r() * 12;
      const pt = t => { const aa = (1 - t) * (1 - t), bb = 2 * (1 - t) * t, dd = t * t; return [aa * top[0] + bb * mx + dd * ex, aa * top[1] + bb * my + dd * ey]; };
      const lit = clamp(.5 + Math.cos(a) * .35 - Math.sin(a) * .15, 0, 1), col = mix([20, 70, 34], [130, 190, 70], lit);
      g.strokeStyle = rgb(mix(col, [0, 0, 0], .25)); g.lineWidth = 2.4; g.beginPath(); const s0 = pt(0); g.moveTo(s0[0], s0[1]); for (let t = .05; t <= 1.001; t += .05) { const p = pt(t); g.lineTo(p[0], p[1]); } g.stroke();
      for (let t = .08; t < .98; t += .045) { const p = pt(t), p2 = pt(t + .02), dx = p2[0] - p[0], dy = p2[1] - p[1], m = Math.hypot(dx, dy) || 1, nx = -dy / m, ny = dx / m, ll = 26 * (1 - t * .7) + 4; for (const sd of [-1, 1]) { g.strokeStyle = rgb(mix(col, [200, 230, 120], (sd > 0 ? .12 : 0) + r() * .15), .9); g.lineWidth = 2.2 - t; g.beginPath(); g.moveTo(p[0], p[1]); g.lineTo(p[0] + nx * sd * ll * .8 + dx / m * 6, p[1] + ny * sd * ll * .8 + dy / m * 6 + 9 * (1 - t)); g.stroke(); } }
    }
    for (let i = 0; i < 4; i++) { const x = top[0] + (r() - .5) * 18, y = top[1] + 6 + r() * 12; const gr = g.createRadialGradient(x - 2, y - 2, 1, x, y, 8); gr.addColorStop(0, '#9a7040'); gr.addColorStop(1, '#3a2410'); g.fillStyle = gr; g.beginPath(); g.arc(x, y, 7.5, 0, 7); g.fill(); }
    return { c, base: 330 / 340 };
  }

  function genCactus(v) {
    const r = rng(9000 + v * 17), c = mk(170, 290), g = ctxOf(c);
    const tube = (pts, w) => {
      const path = () => { g.beginPath(); g.moveTo(pts[0][0], pts[0][1]); for (let i = 1; i < pts.length; i++) g.lineTo(pts[i][0], pts[i][1]); };
      g.lineCap = 'round'; g.lineJoin = 'round'; g.strokeStyle = '#1f5a30'; g.lineWidth = w; path(); g.stroke();
      g.save(); g.translate(w * .1, 0); g.strokeStyle = '#3c8c4a'; g.lineWidth = w * .72; path(); g.stroke(); g.restore();
      g.save(); g.translate(w * .22, -1); g.strokeStyle = '#7fc36e'; g.lineWidth = w * .26; path(); g.stroke(); g.restore();
    };
    tube([[86, 276], [86, 70]], 46); tube([[86, 196], [40, 190], [34, 120]], 24); tube([[86, 160], [132, 156], [136, 98]], 22);
    g.strokeStyle = 'rgba(8,40,18,.5)'; g.lineWidth = 1.3; for (let k = -1; k <= 1; k++) { g.beginPath(); g.moveTo(86 + k * 10, 272); g.lineTo(86 + k * 10, 80); g.stroke(); }
    g.fillStyle = 'rgba(250,250,236,.85)'; for (let i = 0; i < 90; i++) { const x = 66 + r() * 40, y = 80 + r() * 190; g.fillRect(x, y, 1.3, 3.2); }
    g.fillStyle = 'rgba(250,250,236,.8)'; for (let i = 0; i < 24; i++) { g.fillRect(28 + r() * 14, 124 + r() * 66, 1.2, 3); g.fillRect(126 + r() * 14, 100 + r() * 54, 1.2, 3); }
    g.fillStyle = '#f08aa8'; for (let k = 0; k < 6; k++) { const a = k / 6 * 6.283; g.beginPath(); g.ellipse(86 + Math.cos(a) * 7, 66 + Math.sin(a) * 4, 6, 3.6, a, 0, 7); g.fill(); } g.fillStyle = '#ffd35e'; g.beginPath(); g.arc(86, 66, 3.4, 0, 7); g.fill();
    const ao = g.createLinearGradient(0, 240, 0, 282); ao.addColorStop(0, 'rgba(0,0,0,0)'); ao.addColorStop(1, 'rgba(0,0,0,.35)'); g.globalCompositeOperation = 'source-atop'; g.fillStyle = ao; g.fillRect(0, 230, 170, 60);
    return { c, base: 278 / 290 };
  }

  function genIce(v) {
    const r = rng(11000 + v * 23), c = mk(220, 270), g = ctxOf(c);
    const prism = (x, y, w, h, tilt, a) => {
      const tipx = x + tilt, tipy = y - h, shoulder = h * .72, lx = x - w / 2, rx = x + w / 2;
      g.globalAlpha = a;
      let gr = g.createLinearGradient(lx, 0, x, 0); gr.addColorStop(0, '#1c5f8e'); gr.addColorStop(1, '#4ea8d0'); g.fillStyle = gr; g.beginPath(); g.moveTo(lx, y); g.lineTo(lx, y - shoulder); g.lineTo(tipx, tipy); g.lineTo(x, y - shoulder * .78); g.lineTo(x, y); g.closePath(); g.fill();
      gr = g.createLinearGradient(x, 0, rx, 0); gr.addColorStop(0, '#9ad8ee'); gr.addColorStop(1, '#e8f8ff'); g.fillStyle = gr; g.beginPath(); g.moveTo(x, y); g.lineTo(x, y - shoulder * .78); g.lineTo(tipx, tipy); g.lineTo(rx, y - shoulder); g.lineTo(rx, y); g.closePath(); g.fill();
      g.globalAlpha = 1; g.strokeStyle = 'rgba(255,255,255,.8)'; g.lineWidth = 1.6; g.beginPath(); g.moveTo(tipx, tipy); g.lineTo(x, y - shoulder * .78); g.lineTo(x, y); g.moveTo(tipx, tipy); g.lineTo(rx, y - shoulder); g.stroke();
      g.strokeStyle = 'rgba(255,255,255,.35)'; g.lineWidth = 1; for (let i = 0; i < 4; i++) { const yy = y - h * (.15 + i * .17); g.beginPath(); g.moveTo(x - w * .4 + r() * 6, yy); g.lineTo(x + w * .45, yy - 8 - r() * 8); g.stroke(); }
    };
    prism(70, 252, 56, 120, -8, .9); prism(150, 254, 50, 150, 6, .9); prism(108, 262, 72, 196, 2, .92);
    const ao = g.createLinearGradient(0, 230, 0, 266); ao.addColorStop(0, 'rgba(0,30,60,0)'); ao.addColorStop(1, 'rgba(0,30,60,.35)'); g.globalCompositeOperation = 'source-atop'; g.fillStyle = ao; g.fillRect(0, 220, 220, 50);
    return { c, base: 264 / 270 };
  }

  function biomeNow() { const S = STAGES[stageNo - 1]; return S ? S.biome : 'spring'; }
  function getSprite(id, v, filt) {
    const k = id === 'tree' ? 'tree' + (v & 3) + (biomeNow() === 'spring' ? 'b' : '')
      : id === 'pine' ? 'pine' + (v % 3) : id === 'snowpine' ? 'spine' + (v % 3)
        : id === 'rock' ? 'rock' + (v % 3) + (filt && filt.includes('brightness(1.5)') ? 's' : filt && filt.includes('sepia') ? 'd' : '')
          : id === 'palm' ? 'palm' + (v & 1) : id === 'cactus' ? 'cactus' + (v & 1) : id === 'icecrystal' ? 'ice' + (v % 3) : null;
    if (!k) return null;
    let s = sprites[k]; if (s) return s;
    if (id === 'tree') s = genTree(v & 3, biomeNow() === 'spring');
    else if (id === 'pine') s = genPine(v % 3, false);
    else if (id === 'snowpine') s = genPine(v % 3, true);
    else if (id === 'rock') s = genRock(v % 3, k.endsWith('s') ? 'snow' : k.endsWith('d') ? 'sand' : 'grass');
    else if (id === 'palm') s = genPalm(v & 1);
    else if (id === 'cactus') s = genCactus(v & 1);
    else s = genIce(v % 3);
    return sprites[k] = s;
  }

  // ---------------- game.js の描画関数を差し替える ----------------
  const origPropAt = window.propAt;
  window.propAt = function (id, X, Y, s, hm, v, filt) {
    const sp = getSprite(id, v | 0, filt); if (!sp) return origPropAt(id, X, Y, s, hm, v, filt);
    const h = s * hm * (id === 'rock' ? 1.0 : 1), w = sp.c.width * h / sp.c.height * (id === 'rock' ? 1.25 : 1), top = Y - h * sp.base, flip = sunInfo().vx > .25;
    ctx.save(); ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = 'high';
    if (flip) { ctx.translate(X, 0); ctx.scale(-1, 1); ctx.translate(-X, 0); }
    ctx.drawImage(sp.c, X - w / 2, top, w, h); ctx.restore(); return true;
  };

  // 柔らかい影: 接地の暗がり + 太陽と反対側へ伸びる影
  window.sunShadow = function (X, Y, w, hgt) {
    const sv = sunInfo(), L = Math.max(w * 1.2, hgt * sv.len), a = Math.atan2(sv.vy * .55, sv.vx), al = sv.alpha;
    ctx.save(); ctx.imageSmoothingEnabled = true;
    ctx.globalAlpha = Math.min(.8, al * 1.25 + .12); ctx.drawImage(soft, X - w * 1.25, Y - w * .5, w * 2.5, w);
    ctx.globalAlpha = Math.min(.75, al * 1.45); ctx.translate(X, Y); ctx.rotate(a); ctx.drawImage(soft, -w * .2, -w * .62, L + w * .9, w * 1.24);
    ctx.restore();
  };
  window.propGround = function (X, Y, s, v, kind) {
    ctx.save(); ctx.imageSmoothingEnabled = true; ctx.globalAlpha = kind === 'snow' ? .22 : .34; ctx.drawImage(soft, X - s * .5, Y - s * .17, s, s * .3); ctx.restore();
  };
  window.shadow = function (x, y, r, fo) {
    const X = sx(x), Y = sy(y) + (fo == null ? 9 : fo) * cam.z; if (r >= 9) sunShadow(X, Y, r * .55 * cam.z, r * 3.2 * cam.z);
    ctx.save(); ctx.imageSmoothingEnabled = true; ctx.globalAlpha = .55; ctx.drawImage(soft, X - r * cam.z * .95, Y - r * cam.z * .4, r * cam.z * 1.9, r * cam.z * .8); ctx.restore();
  };

  // ---------------- 地面 ----------------
  const baked = new WeakMap(), details = {};
  function bake(im, kind) {   // 1254px の絵を、1マス=64px・8x8マスに高品質で縮小し、鏡写しで2x2に並べる(16マス周期・継ぎ目なし)
    const m = mk(512, 512), mg = ctxOf(m); mg.imageSmoothingEnabled = true; mg.imageSmoothingQuality = 'high';
    const h = mk(627, 627), hg = ctxOf(h); hg.imageSmoothingEnabled = true; hg.imageSmoothingQuality = 'high'; hg.drawImage(im, 0, 0, 627, 627);   // 2段階で縮小するとちらつきにくい
    // 絵っぽさを抑える: ごく軽くぼかしてドットの角を消し、彩度を落として自然な色に
    const grade = { spring: 'saturate(.8) contrast(.96)', forest: 'saturate(.78) contrast(.96) brightness(1.03)', pine: 'saturate(.8)', sand: 'saturate(.78) brightness(1.02)', rock: 'saturate(.75)', snow: 'saturate(.72)', dirt: 'saturate(.8)', sanddirt: 'saturate(.78)', snowroad: 'saturate(.75)', plank: 'saturate(.82) contrast(1.04)' }[kind] || 'saturate(.85)';
    mg.filter = 'blur(.55px) ' + grade; mg.drawImage(h, 0, 0, 512, 512); mg.filter = 'none';
    const c = mk(1024, 1024), g = ctxOf(c);
    for (const [ox, oy, fx, fy] of [[0, 0, 1, 1], [1, 0, -1, 1], [0, 1, 1, -1], [1, 1, -1, -1]]) { g.save(); g.translate(fx < 0 ? 512 * (ox + 1) : 512 * ox, fy < 0 ? 512 * (oy + 1) : 512 * oy); g.scale(fx, fy); g.drawImage(m, 0, 0); g.restore(); }
    return c;
  }
  function kindOf(name) {
    if (/^road_earth/.test(name)) return 'dirt'; if (/^road_desert/.test(name)) return 'sanddirt'; if (/^road_snow/.test(name)) return 'snowroad'; if (/^road_plank/.test(name)) return 'plank';
    if (/^(spring|forest|pine)$/.test(name)) return name; if (/^(beach|cove|desert)$/.test(name)) return 'sand'; if (/^(mountain)$/.test(name)) return 'rock'; if (/^(snow|glacier|summit)$/.test(name)) return 'snow'; return null;
  }
  function genDetail(kind) {
    const r = rng(kind.length * 977 + kind.charCodeAt(0) * 31), c = mk(512, 512), g = ctxOf(c), N = 512;
    const wrap = fn => { for (const dx of [-N, 0, N]) for (const dy of [-N, 0, N]) { g.save(); g.translate(dx, dy); fn(); g.restore(); } };   // 端をまたぐ筆致も継ぎ目が出ないよう9回描く…重いので端付近だけ
    const dot = (x, y, fn) => { fn(x, y); if (x < 14) fn(x + N, y); if (x > N - 14) fn(x - N, y); if (y < 14) fn(x, y + N); if (y > N - 14) fn(x, y - N); };
    const blades = (n, dark, light, len, alpha, ang) => { for (let i = 0; i < n; i++) { const x = r() * N, y = r() * N, l = len * (.5 + r() * .8), a = -1.57 + (r() - .5) * (ang || 1.2), col = mix(dark, light, Math.pow(r(), .8)); dot(x, y, (X, Y) => { g.strokeStyle = rgb(col, alpha * (.6 + r() * .5)); g.lineWidth = .9 + r() * .8; g.beginPath(); g.moveTo(X, Y); g.quadraticCurveTo(X + Math.cos(a) * l * .5 + (r() - .5) * 3, Y + Math.sin(a) * l * .5, X + Math.cos(a + (r() - .5) * .5) * l, Y + Math.sin(a) * l); g.stroke(); }); } };
    const specks = (n, col, sz, alpha) => { for (let i = 0; i < n; i++) { const x = r() * N, y = r() * N; g.fillStyle = rgb(col(), alpha * (.5 + r() * .6)); g.fillRect(x, y, sz * (.6 + r()), sz * (.6 + r())); } };
    const pebbles = (n, base, szr) => { for (let i = 0; i < n; i++) { const x = r() * (N - 20) + 10, y = r() * (N - 20) + 10, rr = szr[0] + r() * (szr[1] - szr[0]), tone = base(); g.fillStyle = 'rgba(0,0,0,.28)'; g.beginPath(); g.ellipse(x + rr * .3, y + rr * .45, rr * 1.05, rr * .6, 0, 0, 7); g.fill(); const gr = g.createRadialGradient(x - rr * .3, y - rr * .4, 0, x, y, rr); gr.addColorStop(0, rgb(mix(tone, [255, 255, 245], .35))); gr.addColorStop(1, rgb(mix(tone, [0, 0, 0], .25))); g.fillStyle = gr; g.beginPath(); g.ellipse(x, y, rr, rr * .74, 0, 0, 7); g.fill(); } };
    if (kind === 'spring' || kind === 'forest' || kind === 'pine') {
      const pal = kind === 'spring' ? [[40, 96, 36], [150, 200, 86]] : kind === 'forest' ? [[22, 62, 34], [108, 160, 76]] : [[28, 62, 44], [100, 140, 90]];
      blades(kind === 'pine' ? 2200 : 4200, pal[0], pal[1], kind === 'spring' ? 10 : 8, .62, 1.3);
      if (kind !== 'spring') specks(380, () => mix([60, 40, 22], [140, 96, 52], r()), 2.2, .5);
      if (kind === 'pine') for (let i = 0; i < 1100; i++) { const x = r() * N, y = r() * N, a = r() * 6.283; g.strokeStyle = rgb(mix([96, 62, 34], [168, 118, 66], r()), .5); g.lineWidth = .9; g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.cos(a) * 5, y + Math.sin(a) * 5); g.stroke(); }
      if (kind === 'forest') for (let i = 0; i < 70; i++) { const x = r() * N, y = r() * N; g.fillStyle = rgb(mix([120, 70, 24], [196, 150, 44], r()), .6); g.beginPath(); g.ellipse(x, y, 3 + r() * 3, 1.6 + r() * 1.4, r() * 3, 0, 7); g.fill(); }
      pebbles(22, () => mix([90, 88, 82], [150, 146, 136], r()), [2.4, 4.6]);
    } else if (kind === 'dirt' || kind === 'sanddirt') {
      const tone = kind === 'dirt' ? [[88, 60, 36], [182, 140, 96]] : [[140, 96, 52], [226, 184, 120]];
      specks(5200, () => mix(tone[0], tone[1], r()), 1.6, .55); pebbles(70, () => mix(tone[0], tone[1], .3 + r() * .5), [2.2, 5.6]);
      g.strokeStyle = 'rgba(0,0,0,.2)'; g.lineWidth = 1; for (let i = 0; i < 18; i++) { let x = r() * N, y = r() * N; g.beginPath(); g.moveTo(x, y); for (let j = 0; j < 5; j++) { x += (r() - .5) * 14; y += (r() - .5) * 10; g.lineTo(x, y); } g.stroke(); }
      if (kind === 'dirt') blades(260, [50, 90, 40], [120, 160, 70], 7, .5, 1.3);
    } else if (kind === 'sand') {
      specks(9000, () => r() < .5 ? mix([120, 96, 60], [170, 140, 96], r()) : mix([230, 214, 170], [255, 244, 214], r()), 1.2, .45);
      for (let i = 0; i < 34; i++) { const y = r() * N, x0 = r() * N, len = 90 + r() * 170, amp = 3 + r() * 5; for (const [off, col] of [[0, 'rgba(60,40,18,.1)'], [2.4, 'rgba(255,248,224,.17)']]) { g.strokeStyle = col; g.lineWidth = 1.6; g.beginPath(); for (let k = 0; k <= 12; k++) { const x = x0 + k / 12 * len, yy = y + off + Math.sin(k * .9 + i) * amp; k ? g.lineTo(x, yy) : g.moveTo(x, yy); } g.stroke(); } }
      pebbles(30, () => mix([140, 128, 110], [214, 200, 176], r()), [1.8, 4.2]);
      for (let i = 0; i < 9; i++) { const x = r() * N, y = r() * N; g.fillStyle = 'rgba(0,0,0,.2)'; g.beginPath(); g.ellipse(x + 2, y + 2.5, 6, 3.4, .3, 0, 7); g.fill(); const gr = g.createLinearGradient(x - 6, y - 4, x + 6, y + 4); gr.addColorStop(0, '#fff6ea'); gr.addColorStop(1, '#d9b8a4'); g.fillStyle = gr; g.beginPath(); g.ellipse(x, y, 6, 3.6, .3, 0, 7); g.fill(); g.strokeStyle = 'rgba(150,110,90,.5)'; g.lineWidth = .8; g.beginPath(); g.moveTo(x - 4, y); g.lineTo(x + 4, y); g.stroke(); }
    } else if (kind === 'rock') {
      specks(7000, () => r() < .55 ? mix([30, 30, 34], [90, 90, 90], r()) : mix([170, 168, 158], [230, 226, 214], r()), 1.5, .45);
      g.strokeStyle = 'rgba(10,10,14,.4)'; g.lineWidth = 1.2; for (let i = 0; i < 30; i++) { let x = r() * N, y = r() * N; g.beginPath(); g.moveTo(x, y); for (let j = 0; j < 7; j++) { x += (r() - .5) * 18; y += (r() - .3) * 14; g.lineTo(x, y); } g.stroke(); }
      pebbles(46, () => mix([86, 84, 82], [170, 166, 156], r()), [2.4, 6]); blades(160, [60, 90, 40], [120, 150, 70], 6, .5, 1.3);
    } else if (kind === 'snow' || kind === 'snowroad') {
      for (let i = 0; i < 26; i++) { const x = r() * N, y = r() * N, w = 40 + r() * 90; const gr = g.createRadialGradient(x, y, 0, x, y, w); gr.addColorStop(0, i % 2 ? 'rgba(120,150,200,.12)' : 'rgba(255,255,255,.16)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(x - w, y - w, w * 2, w * 2); }
      for (let i = 0; i < 40; i++) { const y = r() * N, x0 = r() * N, len = 70 + r() * 140; g.strokeStyle = 'rgba(120,150,200,.12)'; g.lineWidth = 2; g.beginPath(); for (let k = 0; k <= 10; k++) { const x = x0 + k / 10 * len, yy = y + Math.sin(k * .7 + i) * 4; k ? g.lineTo(x, yy) : g.moveTo(x, yy); } g.stroke(); }
      for (let i = 0; i < 900; i++) { const x = r() * N, y = r() * N, a = .3 + r() * .6; g.fillStyle = `rgba(255,255,255,${a})`; g.fillRect(x, y, 1.2, 1.2); if (r() < .06) { g.strokeStyle = `rgba(255,255,255,${a})`; g.lineWidth = .8; g.beginPath(); g.moveTo(x - 3, y + .6); g.lineTo(x + 4, y + .6); g.moveTo(x + .6, y - 3); g.lineTo(x + .6, y + 4); g.stroke(); } }
      if (kind === 'snowroad') { specks(1500, () => mix([90, 90, 100], [200, 200, 210], r()), 1.4, .4); pebbles(24, () => mix([120, 120, 126], [190, 190, 196], r()), [2, 4]); }
    } else if (kind === 'plank') {
      for (let i = 0; i < 700; i++) { const x = r() * N, y = r() * N, l = 14 + r() * 40; g.strokeStyle = r() < .6 ? 'rgba(40,24,10,.22)' : 'rgba(255,230,190,.14)'; g.lineWidth = .8; g.beginPath(); g.moveTo(x, y); g.lineTo(x + l, y + (r() - .5) * 1.4); g.stroke(); }
      for (let i = 0; i < 40; i++) { const x = r() * N, y = r() * N; g.strokeStyle = 'rgba(30,18,8,.4)'; g.lineWidth = 1; g.beginPath(); g.ellipse(x, y, 4 + r() * 3, 2.2, 0, 0, 7); g.stroke(); }
    }
    return c;
  }
  const oDrawFieldTexture = window.drawFieldTexture;
  window.drawFieldTexture = function (im, x, y, X, Y, size) {
    if (!im.complete || !im.naturalWidth) return false;
    let b = baked.get(im); if (!b) { const m = /([a-z_]+)\.png/.exec(im.src); im._kind = m ? kindOf(m[1]) : null; b = bake(im, im._kind); baked.set(im, b); }
    const cell = b.width / 16, sx0 = ((x % 16 + 16) % 16) * cell, sy0 = ((y % 16 + 16) % 16) * cell;
    ctx.imageSmoothingEnabled = true; ctx.drawImage(b, sx0, sy0, cell, cell, X, Y, size, size);
    if (im._kind && R.q >= 1) { const d = details[im._kind] || (details[im._kind] = genDetail(im._kind)); ctx.drawImage(d, ((x * 3 + 1) % 8 + 8) % 8 * cell, ((y * 5 + 2) % 8 + 8) % 8 * cell, cell, cell, X, Y, size, size); }
    ctx.imageSmoothingEnabled = false; return true;
  };

  // 道: 縁のくっきりした帯をやめ、土の縁を草になじませる
  window.drawRoadTile = function (x, y, S) {
    const B = BIOME[S.biome], X = Math.floor(sx(x * T)), Y = Math.floor(sy(y * T)), s = Math.ceil(T * cam.z) + 1, h = hashT(x, y), z = cam.z;
    const painted = drawFieldTexture(fieldImage(roadTextureName(S)), x, y, X, Y, s);
    if (!painted) { ctx.fillStyle = B.path; ctx.fillRect(X, Y, s, s); }
    const Rd = (a, b) => tiles[b * MW + a] === 2, up = Rd(x, y - 1), dn = Rd(x, y + 1), lf = Rd(x - 1, y), rt = Rd(x + 1, y);
    const gim = fieldImage(S.biome), bk = baked.get(gim);
    if (bk) {   // 道の縁: まわりの地面を少しずつ薄くかぶせて、境目をにじませる
      const cell = bk.width / 16, c0x = ((x % 16 + 16) % 16) * cell, c0y = ((y % 16 + 16) % 16) * cell, n = 5, wd = .075 + (h & 3) * .012; ctx.imageSmoothingEnabled = true;
      for (let k = 0; k < n; k++) {
        const a = .96 - k * .2, f0 = k * wd, f1 = (k + 1) * wd; ctx.globalAlpha = Math.max(.05, a);
        if (!up) ctx.drawImage(bk, c0x, c0y + f0 * cell, cell, wd * cell, X, Y + f0 * s, s, wd * s + 1);
        if (!dn) ctx.drawImage(bk, c0x, c0y + (1 - f1) * cell, cell, wd * cell, X, Y + (1 - f1) * s, s, wd * s + 1);
        if (!lf) ctx.drawImage(bk, c0x + f0 * cell, c0y, wd * cell, cell, X + f0 * s, Y, wd * s + 1, s);
        if (!rt) ctx.drawImage(bk, c0x + (1 - f1) * cell, c0y, wd * cell, cell, X + (1 - f1) * s, Y, wd * s + 1, s);
      }
      ctx.globalAlpha = 1; ctx.imageSmoothingEnabled = false;
    }
    if (R.q >= 1 && !B.plank) { ctx.strokeStyle = 'rgba(60,110,40,.6)'; ctx.lineWidth = Math.max(1, z * .8); ctx.beginPath(); const bl = (px, py, dx, dy) => { ctx.moveTo(px, py); ctx.lineTo(px + dx, py + dy); }; if (!up) for (let i = 0; i < 3; i++) bl(X + ((h >> (i * 4)) & 31) / 31 * s, Y + 1, (i - 1) * 1.5 * z, -5 * z); if (!dn) for (let i = 0; i < 3; i++) bl(X + ((h >> (i * 4 + 2)) & 31) / 31 * s, Y + s - 1, (i - 1) * 1.5 * z, -4 * z); ctx.stroke(); }
    if (routeTier[y * MW + x] === 2 && h % 3 === 0) { ctx.fillStyle = 'rgba(255,255,225,.5)'; ctx.fillRect(X + s * .4, Y + s * .4, Math.max(2, z * 2), Math.max(2, z * 2)); ctx.fillRect(X + s * .57, Y + s * .57, Math.max(2, z * 2), Math.max(2, z * 2)); }
  };

  // ---------------- 仕上げ(画面全体) ----------------
  const cloudC = mk(256, 256);
  { // 雲の影: 端がつながる値ノイズ
    const g = ctxOf(cloudC), im = g.createImageData(256, 256), r = rng(424242), L = [];
    for (const f of [4, 8, 16]) { const a = []; for (let i = 0; i < f * f; i++) a.push(r()); L.push([f, a]); }
    const sm = u => u * u * (3 - 2 * u), val = (f, a, x, y) => { const fx = x / 256 * f, fy = y / 256 * f, x0 = Math.floor(fx), y0 = Math.floor(fy), tx = sm(fx - x0), ty = sm(fy - y0), g2 = (i, j) => a[((j % f) * f) + (i % f)]; return (g2(x0, y0) * (1 - tx) + g2(x0 + 1, y0) * tx) * (1 - ty) + (g2(x0, y0 + 1) * (1 - tx) + g2(x0 + 1, y0 + 1) * tx) * ty; };
    for (let y = 0; y < 256; y++) for (let x = 0; x < 256; x++) { const n = val(4, L[0][1], x, y) * .55 + val(8, L[1][1], x, y) * .3 + val(16, L[2][1], x, y) * .15, a = clamp((n - .5) * 3.2, 0, 1); const i = (y * 256 + x) * 4; im.data[i] = 6; im.data[i + 1] = 14; im.data[i + 2] = 30; im.data[i + 3] = a * 255; }
    g.putImageData(im, 0, 0);
  }
  const grains = []; for (let k = 0; k < 3; k++) { const c = mk(200, 200), g = ctxOf(c), im = g.createImageData(200, 200), r = rng(77 + k); for (let i = 0; i < 40000; i++) { const v = 128 + (r() - .5) * 200; im.data[i * 4] = v; im.data[i * 4 + 1] = v; im.data[i * 4 + 2] = v; im.data[i * 4 + 3] = 255; } g.putImageData(im, 0, 0); grains.push(c); }
  const tmp = mk(W, H), tg = ctxOf(tmp), mid = mk(240, 135), mgx = ctxOf(mid), tiny = mk(80, 45), tnx = ctxOf(tiny), blurC = mk(W, H), bg = ctxOf(blurC);
  const daylight = () => { const h = clock.h; return clamp(Math.sin(Math.PI * (h - 5.5) / 14.5), 0, 1); };

  // ---------------- 水: 揺らぐ光の網目(コースティクス)・岸の白い泡・深い所ほど暗く・日の照り返し ----------------
  const caus = mk(256, 256);
  { const g = ctxOf(caus), im = g.createImageData(256, 256), P2 = Math.PI * 2 / 256;
    for (let y = 0; y < 256; y++) for (let x = 0; x < 256; x++) {
      const c1 = Math.sin(P2 * (3 * x + y) + 1.7 * Math.sin(P2 * (2 * y - x))), c2 = Math.sin(P2 * (-2 * x + 3 * y) + 1.3 * Math.sin(P2 * (x + 2 * y)) + 1), c = (c1 + c2) * .5, l = Math.pow(1 - Math.abs(c), 7);
      const i = (y * 256 + x) * 4; im.data[i] = 220; im.data[i + 1] = 246; im.data[i + 2] = 255; im.data[i + 3] = l * 255;
    }
    g.putImageData(im, 0, 0); }
  let causPat = null;
  const oWater = window.drawWaterTile;
  window.drawWaterTile = function (x, y, S) {
    if (R.q < 1) return oWater(x, y, S);
    const B = BIOME[S.biome], X = Math.floor(sx(x * T)), Y = Math.floor(sy(y * T)), s = Math.ceil(T * cam.z) + 1, z = cam.z, h = hashT(x, y);
    const Wt = (a, b) => tiles[b * MW + a] === 3, up = Wt(x, y - 1), dn = Wt(x, y + 1), lf = Wt(x - 1, y), rt = Wt(x + 1, y), deep = (up && dn && lf && rt) ? (Wt(x - 2, y) && Wt(x + 2, y) && Wt(x, y - 2) && Wt(x, y + 2) ? 2 : 1) : 0;
    if (!drawFieldTexture(fieldImage('water'), x, y, X, Y, s)) { ctx.fillStyle = B.water[0]; ctx.fillRect(X, Y, s, s); }
    ctx.fillStyle = B.water[0]; ctx.globalAlpha = .38 + deep * .1; ctx.fillRect(X, Y, s, s); ctx.globalAlpha = 1;
    if (deep) { ctx.fillStyle = 'rgba(4,18,40,' + (deep * .1) + ')'; ctx.fillRect(X, Y, s, s); }
    if (!causPat) causPat = ctx.createPattern(caus, 'repeat');
    const wx = sx(0), wy = sy(0);
    ctx.save(); ctx.globalCompositeOperation = 'screen'; ctx.fillStyle = causPat;
    for (const [sp, a, sc] of [[14, .28, 1.1], [-10, .2, .8]]) { causPat.setTransform(new DOMMatrix().translate(wx + t * sp * z, wy + t * sp * .6 * z).scale(z * sc)); ctx.globalAlpha = a * (1 - deep * .2); ctx.fillRect(X, Y, s, s); }
    ctx.restore();
    // 岸の角を丸める: 縦横とも陸の角は、陸の地面を四分円でかぶせて階段状の岸をなめらかに
    { const gim = fieldImage(S.biome), bk = baked.get(gim); if (bk) { const cell = bk.width / 16, c0x = ((x % 16 + 16) % 16) * cell, c0y = ((y % 16 + 16) % 16) * cell, rr = s * .92;
      const corner = (cx, cy, a0) => { ctx.save(); ctx.beginPath(); ctx.rect(cx - rr, cy - rr, rr * 2, rr * 2); ctx.clip(); ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + Math.cos(a0) * rr, cy + Math.sin(a0) * rr); ctx.lineTo(cx + Math.cos(a0) * rr + Math.cos(a0 + Math.PI / 2) * rr, cy + Math.sin(a0) * rr + Math.sin(a0 + Math.PI / 2) * rr); ctx.lineTo(cx + Math.cos(a0 + Math.PI / 2) * rr, cy + Math.sin(a0 + Math.PI / 2) * rr); ctx.closePath();
        const ox = cx + (Math.cos(a0) + Math.cos(a0 + Math.PI / 2)) * rr, oy = cy + (Math.sin(a0) + Math.sin(a0 + Math.PI / 2)) * rr; ctx.moveTo(ox + rr, oy); ctx.arc(ox, oy, rr, 0, Math.PI * 2, true); ctx.clip('evenodd');
        ctx.imageSmoothingEnabled = true; ctx.drawImage(bk, c0x, c0y, cell, cell, X, Y, s, s); ctx.imageSmoothingEnabled = false;
        ctx.strokeStyle = 'rgba(255,255,255,.55)'; ctx.lineWidth = 2 * z; ctx.beginPath(); ctx.arc(ox, oy, rr, 0, 7); ctx.stroke(); ctx.restore(); };
      if (!up && !lf) corner(X, Y, 0); if (!up && !rt) corner(X + s, Y, Math.PI / 2); if (!dn && !rt) corner(X + s, Y + s, Math.PI); if (!dn && !lf) corner(X, Y + s, Math.PI * 1.5); } }
    // 岸: 泡の帯(揺れる)
    const fw = (5 + Math.sin(t * 1.8 + x * .7 + y * .5) * 1.5) * z;
    const foam = (x0, y0, x1, y1, rx, ry, rw, rh) => { const g = ctx.createLinearGradient(x0, y0, x1, y1); g.addColorStop(0, 'rgba(255,255,255,.75)'); g.addColorStop(.35, 'rgba(235,250,255,.3)'); g.addColorStop(1, 'rgba(235,250,255,0)'); ctx.fillStyle = g; ctx.fillRect(rx, ry, rw, rh); };
    if (!up) foam(0, Y, 0, Y + fw * 2, X, Y, s, fw * 2); if (!dn) foam(0, Y + s, 0, Y + s - fw * 2, X, Y + s - fw * 2, s, fw * 2);
    if (!lf) foam(X, 0, X + fw * 2, 0, X, Y, fw * 2, s); if (!rt) foam(X + s, 0, X + s - fw * 2, 0, X + s - fw * 2, Y, fw * 2, s);
    if (!dn) { const g = ctx.createLinearGradient(0, Y + s, 0, Y + s + 6 * z); g.addColorStop(0, 'rgba(20,30,20,.28)'); g.addColorStop(1, 'rgba(20,30,20,0)'); ctx.fillStyle = g; ctx.fillRect(X, Y + s, s, 6 * z); }
    // 日の照り返し(昼だけ・まばらに瞬く)
    const day = daylight(); if (day > .2) { const ph = Math.sin(t * 2.3 + (h & 255)); if (ph > .9) { const gx = X + ((h >> 4) & 31) / 31 * s, gy = Y + ((h >> 9) & 31) / 31 * s, k = (ph - .9) * 10 * day; ctx.fillStyle = `rgba(255,252,235,${k})`; ctx.fillRect(gx - 3 * z * k, gy - .5, 6 * z * k, 1.2); ctx.fillRect(gx - .5, gy - 2 * z * k, 1.2, 4 * z * k); } }
  };
  let lastT = 0, slow = 0;
  function post() {
    const now = performance.now(), dt = now - lastT; lastT = now;
    if (dt > 0 && dt < 200) { if (dt > 24) slow++; else if (slow > 0) slow -= .5; if (slow > 150 && R.q > 0) { R.q--; slow = 0; } }
    const day = daylight(), S = STAGES[stageNo - 1] || STAGES[0], cv = ctx.canvas;
    // 雲の影(世界に固定して流れる)
    if (day > .05) {
      ctx.save(); ctx.imageSmoothingEnabled = true; ctx.globalAlpha = .34 * day; const sz = 1500, ox = -((cam.x * cam.z * .94 + t * 9) % sz + sz) % sz, oy = -((cam.y * cam.z * .94 + t * 4) % sz + sz) % sz;
      for (let yy = oy - sz; yy < H; yy += sz) for (let xx = ox - sz; xx < W; xx += sz) if (xx + sz > 0 && yy + sz > 0) ctx.drawImage(cloudC, xx, yy, sz, sz);
      ctx.restore();
    }
    if (R.q >= 1) {
      // コントラストと彩度: 画面を自分に重ねる
      tg.globalCompositeOperation = 'copy'; tg.drawImage(cv, 0, 0); ctx.save(); ctx.globalCompositeOperation = 'overlay'; ctx.globalAlpha = .26; ctx.drawImage(tmp, 0, 0); ctx.restore();
      // ブルーム: 縮小→明るい所を強調→引き伸ばして加算
      mgx.imageSmoothingEnabled = true; mgx.globalCompositeOperation = 'copy'; mgx.drawImage(tmp, 0, 0, 240, 135); tnx.imageSmoothingEnabled = true; tnx.globalCompositeOperation = 'copy'; tnx.drawImage(mid, 0, 0, 80, 45);
      tnx.globalCompositeOperation = 'multiply'; tnx.drawImage(tiny, 0, 0);
      ctx.save(); ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = 'high'; ctx.globalCompositeOperation = 'screen'; ctx.globalAlpha = .46 * (.4 + .6 * day); ctx.drawImage(tiny, 0, 0, W, H); ctx.restore();
    }
    // 暖かい日差し(昼)・冷たい影
    if (day > .02) { ctx.save(); ctx.globalCompositeOperation = 'soft-light'; const sv = sunInfo(), gx = W / 2 - sv.vx * W * .6, gy = H / 2 - sv.vy * H * .6, gr = ctx.createRadialGradient(gx, gy, 20, W / 2, H / 2, W * .85); gr.addColorStop(0, `rgba(255,214,150,${.5 * day})`); gr.addColorStop(1, 'rgba(120,150,220,.12)'); ctx.fillStyle = gr; ctx.fillRect(0, 0, W, H); ctx.restore(); }
    // 木漏れ日の光の筋(森系・昼のみ)
    if (R.q >= 1 && day > .25 && /^(spring|forest|pine|cove|beach)$/.test(S.biome)) {
      ctx.save(); ctx.globalCompositeOperation = 'screen'; const sv = sunInfo(), a = Math.atan2(-sv.vy * .8, -sv.vx);
      for (let i = 0; i < 5; i++) { const px = ((i * 211 + cam.x * cam.z * .15 + t * 5) % (W + 400)) - 200, w = 50 + (i * 37) % 60, gr = ctx.createLinearGradient(px, 0, px - 160 * Math.cos(a), H); gr.addColorStop(0, `rgba(255,236,170,${.1 * day})`); gr.addColorStop(1, 'rgba(255,236,170,0)'); ctx.fillStyle = gr; ctx.beginPath(); ctx.moveTo(px, -20); ctx.lineTo(px + w, -20); ctx.lineTo(px + w - 220, H + 20); ctx.lineTo(px - 220, H + 20); ctx.closePath(); ctx.fill(); }
      ctx.restore();
    }
    // 上下の縁をぼかす(ミニチュア風の被写界深度)
    if (R.q >= 2) {
      bg.imageSmoothingEnabled = true; bg.globalCompositeOperation = 'copy'; bg.drawImage(mid, 0, 0, W, H);
      bg.globalCompositeOperation = 'destination-in'; const m = bg.createLinearGradient(0, 0, 0, H); m.addColorStop(0, 'rgba(0,0,0,.9)'); m.addColorStop(.14, 'rgba(0,0,0,0)'); m.addColorStop(.86, 'rgba(0,0,0,0)'); m.addColorStop(1, 'rgba(0,0,0,.9)'); bg.fillStyle = m; bg.fillRect(0, 0, W, H); bg.globalCompositeOperation = 'source-over';
      ctx.drawImage(blurC, 0, 0);
    }
    // 周辺減光
    const vg = ctx.createRadialGradient(W / 2, H / 2, H * .42, W / 2, H / 2, H * 1.02); vg.addColorStop(0, 'rgba(6,10,20,0)'); vg.addColorStop(1, 'rgba(6,10,20,.5)'); ctx.fillStyle = vg; ctx.fillRect(0, 0, W, H);
    // フィルムグレイン
    ctx.save(); ctx.globalCompositeOperation = 'overlay'; ctx.globalAlpha = .075; const gc = grains[(t * 24 | 0) % 3], gx = (Math.random() * 200) | 0, gy = (Math.random() * 200) | 0; for (let yy = -gy; yy < H; yy += 200) for (let xx = -gx; xx < W; xx += 200) ctx.drawImage(gc, xx, yy); ctx.restore();
  }
  const oFog = window.drawRadarFog;
  window.drawRadarFog = function () { if (R.on && scene !== 'title' && tiles) { try { post(); } catch (e) { R.on = false; console.warn('realism post off', e); } } return oFog.apply(this, arguments); };

  // ---------------- キャラ・敵・小物: 輪郭のギザギザをなめらかにし、上からの光・足元の陰・逆光の縁を足す ----------------
  // 立体の陰影: 輪郭(不透明度)をぼかした「厚み」から面の向きを推定し、右上からの光で丸みをつける。
  // あわせて、ドット絵の黒い輪郭線を内側の色になじませ、彩度を少し落とし、布や毛の細かなムラを足す。
  function boxBlur(src, w, h, r) {
    const tmp = new Float32Array(w * h), out = new Float32Array(w * h);
    for (let y = 0; y < h; y++) { let acc = 0; const o = y * w; for (let x = -r; x <= r; x++) acc += src[o + clamp(x, 0, w - 1)]; for (let x = 0; x < w; x++) { tmp[o + x] = acc / (2 * r + 1); acc += src[o + Math.min(w - 1, x + r + 1)] - src[o + Math.max(0, x - r)]; } }
    for (let x = 0; x < w; x++) { let acc = 0; for (let y = -r; y <= r; y++) acc += tmp[clamp(y, 0, h - 1) * w + x]; for (let y = 0; y < h; y++) { out[y * w + x] = acc / (2 * r + 1); acc += tmp[Math.min(h - 1, y + r + 1) * w + x] - tmp[Math.max(0, y - r) * w + x]; } }
    return out;
  }
  function shade3d(g, w, h) {
    const im = g.getImageData(0, 0, w, h), d = im.data, n = w * h, A = new Float32Array(n), CR = new Float32Array(n), CG = new Float32Array(n), CB = new Float32Array(n);
    for (let i = 0; i < n; i++) { const a = d[i * 4 + 3] / 255; A[i] = a; CR[i] = d[i * 4] * a; CG[i] = d[i * 4 + 1] * a; CB[i] = d[i * 4 + 2] * a; }
    const T1 = boxBlur(boxBlur(A, w, h, 3), w, h, 3), T2 = boxBlur(T1, w, h, 4), Ab = boxBlur(A, w, h, 2), Rb = boxBlur(CR, w, h, 2), Gb = boxBlur(CG, w, h, 2), Bb = boxBlur(CB, w, h, 2);
    const lx = .5, ly = -.62, lz = .6, ll = Math.hypot(lx, ly, lz), r = rng(w * 31 + h);
    for (let y = 1; y < h - 1; y++) for (let x = 1; x < w - 1; x++) {
      const i = y * w + x, a = A[i]; if (a < .02) continue;
      let R = d[i * 4], G = d[i * 4 + 1], B = d[i * 4 + 2];
      const thick = T1[i] * .6 + T2[i] * .4, lum = (R * .3 + G * .59 + B * .11) / 255, edge = clamp((.9 - Ab[i]) / .5, 0, 1);
      if (lum < .24 && edge > .15) { const ab = Ab[i] || 1, k = .65 * edge; R += (Rb[i] / ab * .72 - R) * k; G += (Gb[i] / ab * .72 - G) * k; B += (Bb[i] / ab * .72 - B) * k; }   // 黒い輪郭線を和らげる
      const gx = (T1[i + 1] - T1[i - 1]) * .5 + (T2[i + 1] - T2[i - 1]) * .5, gy = (T1[i + w] - T1[i - w]) * .5 + (T2[i + w] - T2[i - w]) * .5;
      let nx = -gx * 9, ny = -gy * 9, nz = .55; const nl = Math.hypot(nx, ny, nz); nx /= nl; ny /= nl; nz /= nl;
      const diff = (nx * lx + ny * ly + nz * lz) / ll, ao = .78 + .22 * clamp(thick * 1.25, 0, 1), down = 1 - .16 * (y / h);
      let k = (.5 + .72 * clamp(diff, -.25, 1)) * ao * down * (1 + (r() - .5) * .07);
      const spec = Math.pow(clamp(diff, 0, 1), 12) * 46;
      const gray = R * .3 + G * .59 + B * .11; R = gray + (R - gray) * .86; G = gray + (G - gray) * .86; B = gray + (B - gray) * .86;   // 彩度を少し落とす
      d[i * 4] = clamp(R * k + spec, 0, 255); d[i * 4 + 1] = clamp(G * k + spec, 0, 255); d[i * 4 + 2] = clamp(B * k * 1.02 + spec, 0, 255);
    }
    g.putImageData(im, 0, 0);
  }
  const lit = new WeakMap(), SC = 2;
  function litOf(im) {
    let c = lit.get(im); if (c) return c;
    const w = im.width, h = im.height; if (!w || !h) return null;
    c = mk(w * SC, h * SC); const g = ctxOf(c); g.imageSmoothingEnabled = false; g.drawImage(im, 0, 0, w * SC, h * SC);
    const b = mk(w * SC, h * SC), bg2 = ctxOf(b); bg2.filter = 'blur(.9px)'; bg2.drawImage(c, 0, 0); bg2.filter = 'none';   // 3倍に拡大してから少しぼかす=縁がなめらかに
    g.globalCompositeOperation = 'copy'; g.drawImage(b, 0, 0); g.globalCompositeOperation = 'source-over';
    try { shade3d(g, w * SC, h * SC); } catch (e) { }
    g.globalCompositeOperation = 'source-atop';
    const vg = g.createLinearGradient(0, 0, 0, h * SC); vg.addColorStop(0, 'rgba(255,246,224,.08)'); vg.addColorStop(.55, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(8,16,36,.22)'); g.fillStyle = vg; g.fillRect(0, 0, w * SC, h * SC);
    const hg = g.createLinearGradient(0, 0, w * SC, 0); hg.addColorStop(0, 'rgba(8,16,36,.14)'); hg.addColorStop(.6, 'rgba(0,0,0,0)'); hg.addColorStop(1, 'rgba(255,240,210,.08)'); g.fillStyle = hg; g.fillRect(0, 0, w * SC, h * SC);
    // 逆光の縁: 元の絵を左下へずらして引いた残り=右上の縁だけが残る
    const r = mk(w * SC, h * SC), rg = ctxOf(r); rg.drawImage(b, 0, 0); rg.globalCompositeOperation = 'destination-out'; rg.drawImage(b, -SC * .9, SC * .9); rg.globalCompositeOperation = 'source-in'; rg.fillStyle = 'rgba(255,236,190,.75)'; rg.fillRect(0, 0, w * SC, h * SC);
    g.globalCompositeOperation = 'screen'; g.globalAlpha = .5; g.drawImage(r, 0, 0); g.globalAlpha = 1; g.globalCompositeOperation = 'source-over';
    lit.set(im, c); return c;
  }
  R.litOf = litOf;
  // 初めて出てきた敵の加工で一瞬止まらないよう、空き時間に先に作っておく
  (function prewarm() {
    const q = [], seen = new Set(), walk = (o, d) => { if (!o || d > 4 || seen.has(o)) return; seen.add(o); if ((o instanceof HTMLImageElement || o instanceof HTMLCanvasElement) ) { if (o.width && o.width <= 400 && o.height <= 400) q.push(o); return; } if (typeof o === 'object') for (const k in o) walk(o[k], d + 1); };
    const go = () => { if (!window.SPR || !SPR.en) return setTimeout(go, 1000); for (const k of ['char', 'en', 'stance', 'prop']) walk(SPR[k], 0); step(); };
    const step = (dl) => { const end = performance.now() + 6; while (q.length && performance.now() < end) { const im = q.shift(); if (im.complete === false) continue; try { litOf(im); } catch (e) { } } if (q.length) (window.requestIdleCallback || setTimeout)(step, 50); };
    setTimeout(go, 1500);
  })();
  if (!location.hash.includes('nochar')) {
    window.spr = function (img, x, y, flip, bob, k) {
      k = k || 1; const L = litOf(img); if (!L) return;
      const w = img.width * cam.z * k, h = img.height * cam.z * k, X = Math.round(sx(x)), Y = Math.round(sy(y) + h / 2 - (bob || 0) * cam.z);
      ctx.save(); if (flip) { ctx.translate(X, 0); ctx.scale(-1, 1); ctx.translate(-X, 0); } ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = 'medium'; ctx.drawImage(L, X - w / 2, Y - h, w, h); ctx.restore();
    };
    window.propAt = (function (prev) {
      return function (id, X, Y, s, hm, v, filt) {
        if (getSprite(id, v | 0, filt)) return prev(id, X, Y, s, hm, v, filt);
        const im = SPR.prop && SPR.prop[id], L = im && litOf(im); if (!L) return prev(id, X, Y, s, hm, v, filt);
        const h = s * hm, w = im.width * h / im.height;
        ctx.save(); if (filt) ctx.filter = filt; if (v & 1) { ctx.translate(X, 0); ctx.scale(-1, 1); ctx.translate(-X, 0); } ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = 'high'; ctx.drawImage(L, X - w / 2, Y - h, w, h); ctx.restore(); return true;
      };
    })(window.propAt);
  }
  R.post = post; R.sprites = sprites;
})();
