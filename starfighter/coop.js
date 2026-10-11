// 機体の選択(3機+隠し機体)と、2人プレイ(上下の分割画面の協力プレイ。2026-09-27 その10)
//  ・出撃の前に、機体を選ぶ(← → で選び、Space / Enter / A で決定、Esc で戻る)
//  ・隠し機体 PHANTOM: エンディングに着くか、選択画面で ↑↑↓↓←→←→ B A を押すと、使えるようになる(ブラウザに保存)
//  ・2人プレイ: パソコン版だけ(iPhone・iPad・タッチの端末では、ボタンを出さない)。上が1P、下が2P。
//    1P = 矢印キーほか(いつもの操作)/ 2P = ゲームパッド(2台あれば2台目)または W A S D + R 射撃・T ロック・Y ブースト・H ブレーキ・1/2 ロール・3 ワイド・4 変形・5 Uターン
//    敵は、近い方の自機を狙う。得点は別々、お金と強化は共通。残機がなくなった人は、相手の画面を見る(2人とも無くなると、ゲームオーバー)。保存はしない。
// 確認用: #select(選択画面)、#fighter=raptor、#coop(2人プレイ。#demo と一緒なら、2人とも自動操縦)
(function () {
  const NO_COOP = isTouchDev || !!window.SF_NO_COOP;   // iPhone・iPad・Android では、2人プレイを出さない。iOS版のビルドは、index.html で SF_NO_COOP を立てて、確実に外す
  const LS = (k, v) => { try { if (v === undefined) return localStorage.getItem(k); localStorage.setItem(k, v); } catch (e) { return null; } };
  let unlocked = LS('sf_phantom') === '1';
  const choice = (LS('sf_ships') || 'valkyrie,valkyrie').split(',').map(id => SHIPS[id] && (!SHIPS[id].hidden || unlocked) ? id : 'valkyrie');
  function unlock(silent) {
    if (unlocked) return; unlocked = true; LS('sf_phantom', '1');
    if (!silent) { SND.se('coreOpen'); SEL.flash = 90; }
  }
  window.__phantomUnlocked = () => unlocked;
  let cams = [cam];
  const isOut = pl => pl.dead && pl.lives <= 0;
  const leadIdx = () => (players.length > 1 && isOut(players[0]) && !isOut(players[1])) ? 1 : 0;

  // ---------- 機体の選択 ----------
  const SEL = { n: 1, picks: [], idx: 0, t: 0, flash: 0, code: [], pad: {}, preview: null };
  const avail = () => SHIP_ORDER.filter(id => !SHIPS[id].hidden || unlocked);
  function openSelect(n) {
    if (n === 2 && NO_COOP) n = 1;
    SEL.n = n; SEL.picks = []; SEL.idx = Math.max(0, avail().indexOf(choice[0])); SEL.t = 0; SEL.code = [];
    state = 'select'; paused = false; SND.resume(); SND.se('ok'); syncAppUI(true);
  }
  window.openSelect = openSelect;
  function selMove(d) { const a = avail(); SEL.idx = (SEL.idx + d + a.length) % a.length; SND.se('tick'); }
  function selConfirm() {
    const id = avail()[SEL.idx]; SEL.picks.push(id); SND.se('ok');
    if (SEL.picks.length < SEL.n) { SEL.idx = Math.max(0, avail().indexOf(choice[1])); return; }
    SEL.picks.forEach((p, i) => choice[i] = p); LS('sf_ships', choice.join(','));
    coop = SEL.n === 2; rawStart();
  }
  function selBack() { if (SEL.picks.length) { SEL.picks.pop(); SND.se('tick'); return; } state = 'title'; coop = false; syncAppUI(true); }
  function selStep() {
    SEL.t++; if (SEL.flash > 0) SEL.flash--;
    for (const [i, gp] of padList().entries()) {   // ゲームパッド(どれでも)
      const pv = SEL.pad[i] || (SEL.pad[i] = {}), x = gp.axes[0] || 0, B = k => !!(gp.buttons[k] && gp.buttons[k].pressed);
      const l = x < -0.6 || B(14), r = x > 0.6 || B(15), a = B(0) || B(9), b = B(1);
      if (l && !pv.l) selMove(-1); if (r && !pv.r) selMove(1); if (a && !pv.a && SEL.t > 20) selConfirm(); if (b && !pv.b) selBack();
      Object.assign(pv, { l, r, a, b });
    }
    SND.update({ thrust: 0, alarm: false, bgm: 'hangar', intense: false });
  }
  const cards = () => { const a = avail(), n = SHIP_ORDER.length, w = 272, gap = 18, x0 = (W - (n * w + (n - 1) * gap)) / 2; return SHIP_ORDER.map((id, i) => ({ id, x: x0 + i * (w + gap), y: 150, w, h: 430, ok: a.includes(id), k: a.indexOf(id) })); };
  const STAT = [['SPEED', 'speed', 0.5, 1.45], ['MOBILITY', 'turn', 0.5, 1.45], ['ARMOR', 'armor', 0, 2.3], ['FIREPOWER', s => Math.sqrt(s.power * s.rate * s.guns.length / 2 / 7.2), 0, 1], ['LOCK-ON', s => 6 + s.lock, 0, 10]];
  function drawSelect() {
    const ctx = drawingContext, t = SEL.t, who = SEL.picks.length, a = avail(), sel = a[SEL.idx];
    background(3, 7, 14);
    cam.p = [0, 0, 0]; cam.f = vnorm([Math.sin(t * 0.0015), -0.1, 1]); const bb = basisDir(cam.f, 0); cam.r = bb.r; cam.u = bb.u; drawStars();
    centerText('SELECT YOUR FIGHTER', 62, 34, [120, 230, 255]);
    centerText(SEL.n === 2 ? (who === 0 ? TR('1P の機体を選んでください', 'Player 1: choose your fighter') : TR('2P の機体を選んでください', 'Player 2: choose your fighter')) : TR('出撃する機体を選んでください', 'Choose the fighter to launch'), 104, 16, who ? [255, 150, 210] : [255, 210, 120], false);
    if (SEL.n === 2 && who) { noStroke(); fill(120, 230, 255); textAlign(LEFT, CENTER); textSize(13); text('1P: ' + SHIPS[SEL.picks[0]].name + '  ✓', 40, 104); }
    for (const c of cards()) {
      const on = c.ok && c.id === sel, sp = SHIPS[c.id], col = on ? (who ? [255, 150, 210] : [120, 230, 255]) : [70, 100, 125];
      noStroke(); fill(on ? color(col[0], col[1], col[2], 38) : color(255, 255, 255, 8)); rect(c.x, c.y, c.w, c.h, 10);
      neon(col, on ? 240 : 130, on && !lite ? 10 : 0, on ? 2 : 1); noFill(); rect(c.x, c.y, c.w, c.h, 10); noGlow();
      if (!c.ok) {   // 隠し機体(まだ使えない)
        noStroke(); fill(90, 110, 130); textAlign(CENTER, CENTER); textSize(64); text('?', c.x + c.w / 2, c.y + 150); textSize(18); text('???', c.x + c.w / 2, c.y + 262);
        fill(120, 140, 160); textSize(12); text(TR('条件を満たすと、現れる', 'Appears when a condition is met'), c.x + c.w / 2, c.y + 300); text(TR('(エンディングに到達)', '(Reach the ending)'), c.x + c.w / 2, c.y + 320); continue;
      }
      // 回る機体
      const tp = newPlayer(); tp.ship = sp; tp.pno = SEL.n === 2 && who ? 2 : 0; tp.p = [0, 0, 0]; tp.yaw = t * 0.02 + c.k; tp.pitch = 0.15; tp.roll = Math.sin(t * 0.03) * 0.3; tp.invuln = 0;
      const oc = { p: cam.p, f: cam.f, r: cam.r, u: cam.u }, cp = [0, 120, -470], cf = vnorm(vsub([0, 0, 0], cp)), cb = basisDir(cf, 0);
      cam.p = cp; cam.f = cf; cam.r = cb.r; cam.u = cb.u;
      ctx.save(); ctx.beginPath(); ctx.rect(c.x, c.y, c.w, 230); ctx.clip(); ctx.translate(c.x + c.w / 2 - CX, c.y + 125 - CY);
      if (on && !lite) { const g = ctx.createRadialGradient(CX, CY, 0, CX, CY, 130); g.addColorStop(0, `rgba(${col[0]},${col[1]},${col[2]},.16)`); g.addColorStop(1, 'rgba(0,0,0,0)'); ctx.fillStyle = g; ctx.fillRect(CX - 140, CY - 140, 280, 280); }
      withP(tp, () => { const l = []; playerFaces(l); paintFaces(l); window.__exSkip = true; drawPlayerFlame(); window.__exSkip = false; });
      ctx.restore(); Object.assign(cam, oc);
      noStroke(); fill(sp.hidden ? color(255, 214, 120) : color(235, 245, 250)); textAlign(CENTER, TOP); textSize(24); text(sp.name, c.x + c.w / 2, c.y + 234);
      fill(sp.hidden ? color(255, 190, 110) : color(150, 200, 215)); textSize(12); text(TR(sp.role, sp.roleEn), c.x + c.w / 2, c.y + 264);
      STAT.forEach(([nm, k, lo, hi], i) => {
        const v = typeof k === 'function' ? k(sp) : sp[k], fr = Math.max(0.05, Math.min(1, (v - lo) / (hi - lo))), y = c.y + 294 + i * 24;
        fill(150, 190, 205); textAlign(LEFT, CENTER); textSize(10); text(nm, c.x + 18, y);
        for (let s = 0; s < 12; s++) { fill(sp.hidden ? color(255, 214, 120, s / 12 < fr ? 235 : 35) : color(col[0], col[1], col[2], s / 12 < fr ? (on ? 235 : 150) : 30)); rect(c.x + 100 + s * 13, y - 4, 10, 8); }
      });
      if (on) { fill(col[0], col[1], col[2]); textAlign(CENTER, CENTER); textSize(12); text(Math.floor(t / 20) % 2 ? TR('▶  決定  ◀', '▶  SELECT  ◀') : TR('▷  決定  ◁', '▷  SELECT  ◁'), c.x + c.w / 2, c.y + c.h - 18); }
    }
    centerText(TR('← →  選ぶ      SPACE / ENTER / A  決定      ESC / B  戻る', '← →  Choose      SPACE / ENTER / A  Confirm      ESC / B  Back'), 614, 13, [150, 200, 190], false);
    if (unlocked) centerText(TR('隠し機体 PHANTOM を使えます', 'Hidden fighter PHANTOM unlocked'), 640, 12, [255, 214, 120], false);
    if (SEL.flash > 0) { noStroke(); fill(255, 230, 160, SEL.flash * 2); rect(0, 0, W, H); centerText('HIDDEN FIGHTER UNLOCKED — PHANTOM', CY, 30, [255, 214, 120]); }
    drawCRT();
  }

  // ---------- 開始(機体を持たせる。2人なら、2P を作る) ----------
  const rawStart = startGame;
  startGame = function () { if (state === 'select') return; openSelect(state === 'over' && coop ? 2 : SEL.n || 1); };   // 出撃ボタン・Enter・Start は、まず機体の選択へ
  const _cg = continueGame;
  continueGame = function () { coop = false; _cg(); };   // 続きからは、1人プレイ
  const _newGame = newGame;
  newGame = function () {
    _newGame();
    P.ship = SHIPS[choice[0]] || SHIPS.valkyrie; P.pno = coop ? 1 : 0; P.shield = maxSh(); P.boost = boostMax();
    if (coop) {
      const q = newPlayer(); q.ship = SHIPS[choice[1]] || SHIPS.valkyrie; q.pno = 2; q.up = P.up; q.invuln = 180; withP(q, () => { q.shield = maxSh(); q.boost = boostMax(); });
      players = [P, q]; cams = [cam, { p: [...cam.p], r: [1, 0, 0], u: [0, 1, 0], f: [0, 0, 1], yaw: 0, pitch: 0 }]; place(q, P); cockpit = false;
    } else { players = [P]; cams = [cam]; }
  };
  function place(q, lead) {   // 2P を、リーダーの右うしろへ
    const b = basisYP(lead.yaw, lead.pitch, 0), k = q.pno === 2 ? 1 : -1;
    q.p = vadd(vadd(lead.p, vmul(b.r, 260 * k)), vmul(b.f, -150)); q.yaw = lead.yaw; q.pitch = lead.pitch; q.vel = [...lead.vel]; q.v = q.vel; q.yawV = q.pitchV = 0; q.locks = []; q.pending = []; q._zi = undefined;
    const c = cams[players.indexOf(q)]; if (c) { c.yaw = q.yaw; c.pitch = q.pitch; }
  }

  // ---------- 2P の入力 ----------
  const pulse2 = { roll: 0, wide: false, form: false, uturn: false, release: false };
  p1PadSlot = () => !coop ? 0 : padList().length >= 2 ? 0 : -1;   // パッドが1台なら、それは2P用(1Pはキーボード)
  readInput2 = function () {
    if (demo) return withP(players[1], () => botInput());
    const pads = padList(), g = readGamepad(pads.length >= 2 ? 1 : pads.length === 1 ? 0 : -1);
    const r = {
      mx: Math.max(-1, Math.min(1, (keyIsDown(68) ? 1 : 0) - (keyIsDown(65) ? 1 : 0) + g.mx)), my: Math.max(-1, Math.min(1, ((keyIsDown(87) ? 1 : 0) - (keyIsDown(83) ? 1 : 0)) * (invertY ? -1 : 1) + g.my * (invertY ? -1 : 1))),
      fire: keyIsDown(82) || g.fire, lock: keyIsDown(84) || g.lock, boost: keyIsDown(89) || g.boost, brake: keyIsDown(72) || g.brake,
      roll: pulse2.roll || g.roll, release: pulse2.release || g.release, uturn: pulse2.uturn || g.uturn, wide: pulse2.wide || g.wide, form: pulse2.form || g.form,
    };
    if (g.start && state === 'play' && mode === 'fight') togglePause();
    pulse2.roll = 0; pulse2.release = false; pulse2.uturn = false; pulse2.wide = false; pulse2.form = false;
    return r;
  };
  const _kp = keyPressed;
  keyPressed = function (event) {
    if (state === 'select') {
      if (event && event.target && /^(BUTTON|INPUT|SELECT|TEXTAREA)$/.test(event.target.tagName)) return;
      SND.resume();
      SEL.code.push(keyCode); if (SEL.code.length > 10) SEL.code.shift();
      if (SEL.code.join(',') === '38,38,40,40,37,39,37,39,66,65') { SEL.code = []; unlock(false); return false; }   // ↑↑↓↓←→←→ B A
      if (keyCode === LEFT_ARROW || keyCode === 65) selMove(-1); else if (keyCode === RIGHT_ARROW || keyCode === 68) selMove(1);
      else if ((keyCode === ENTER || keyCode === 32) && SEL.t > 10) selConfirm(); else if (keyCode === 27 || keyCode === 8) selBack();
      return false;
    }
    if (coop && state === 'play') {   // 2P のキー(1回ごとの操作)
      if (keyCode === 49) pulse2.roll = -1; if (keyCode === 50) pulse2.roll = 1; if (keyCode === 51) pulse2.wide = true; if (keyCode === 52) pulse2.form = true; if (keyCode === 53) pulse2.uturn = true;
      if (keyCode === 67) return false;   // 2人プレイでは、コックピット視点にしない
    }
    return _kp(event);
  };
  const _kr = keyReleased;
  keyReleased = function (event) { if (coop && keyCode === 84) pulse2.release = true; return _kr(event); };
  function tapSelect(x, y) {
    for (const c of cards()) if (c.ok && x >= c.x && x <= c.x + c.w && y >= c.y && y <= c.y + c.h) { if (avail()[SEL.idx] === c.id) selConfirm(); else { SEL.idx = c.k; SND.se('tick'); } return true; }
    return false;
  }
  const canvasXY = e => { const cv = document.querySelector('canvas'), r = cv.getBoundingClientRect(), pt = e.touches && e.touches[0] ? e.touches[0] : e; return [(pt.clientX - r.left) * W / r.width, (pt.clientY - r.top) * H / r.height]; };
  document.addEventListener('pointerdown', e => { if (state !== 'select' || (e.target && e.target.closest && e.target.closest('#app-ui, #toolbar'))) return; SND.resume(); const [x, y] = canvasXY(e); tapSelect(x, y); });

  // ---------- 1フレームの進行 ----------
  const _up = updatePlayer;
  updatePlayer = function (dt, inp) {   // 撃った弾に、撃った人の印をつける(得点を分ける)
    const n0 = pbullets.length, m0 = missiles.length; _up(dt, inp);
    for (let i = n0; i < pbullets.length; i++) pbullets[i].pl = P; for (let i = m0; i < missiles.length; i++) missiles[i].pl = P;
  };
  forPlayers = function (fn) { if (!coop) return fn(P, 0); const oc = cam; players.forEach((pl, k) => { cam = cams[k]; withP(pl, () => fn(pl, k)); }); cam = oc; };
  withNear = function (p, fn) {   // 敵は、近い方の自機を狙う
    if (!coop) return fn(); let best = null, bd = Infinity;
    for (const pl of players) { if (pl.dead) continue; const d = vsub(pl.p, p), l = d[0] * d[0] + d[1] * d[1] + d[2] * d[2]; if (l < bd) { bd = l; best = pl; } }
    return best ? withP(best, fn) : fn();
  };
  camStep = function (dt) {
    if (!coop) return updateCamera(dt);
    const oc = cam; players.forEach((pl, k) => { cam = cams[k]; withP(isOut(pl) ? players[1 - k] : pl, () => updateCamera(dt)); }); cam = oc;
  };
  allOut = () => !coop || players.every(isOut);
  const _us = updateSpecial;
  updateSpecial = function (dt) {   // 特殊弾は、2P にも当たる
    _us(dt); if (!coop) return;
    for (const pl of players) if (pl !== P && !pl.dead) for (const b of specialBullets) if (b.owner === 'e' && b.life > 0 && b.kind !== 'rift' && !(b.kind === 'gravity' && b.w.dot) && segSphere(b.pp, b.p, pl.p, 24 + b.radius * 0.6)) withP(pl, () => { hitPlayerSpecial(b); b.life = 0; });
  };
  const _step = step;
  step = function (dt) {
    if (state === 'select') { selStep(); return; }
    if (!coop) return _step(dt);
    const li = leadIdx(); P = players[li]; cam = cams[li];
    const wasDead = players.map(p => p.dead), zin = zoneInside, st0 = stage;
    _step(dt);
    if (state === 'play' && (mode === 'fight' || mode === 'warp')) {
      const L = players[li];
      players.forEach((pl, k) => {
        if (k === li || isOut(pl)) return;
        if (!pl.dead && ((wasDead[k] && !pl.dead) || zoneInside !== zin || stage !== st0 || vlen(vsub(pl.p, L.p)) > 7000)) { place(pl, L); pl._zi = zoneInside ? __zone.pi : undefined; }   // 離れすぎ・復活・区域の出入り → リーダーのそばへ
        if (zoneInside && window.__zoneConstrainPl) withP(pl, () => window.__zoneConstrainPl());
        L.credits += pl.credits; pl.credits = 0;   // お金は共通
      });
    }
    P = players[leadIdx()]; cam = cams[leadIdx()];
  };
  const _objs = drawObjects;
  drawObjects = function () {   // もう1人の自機も描く
    if (coop && state === 'play') for (const pl of players) if (pl !== P && !pl.dead) withP(pl, () => { const l = []; playerFaces(l); paintFaces(l); window.__exSkip = true; drawPlayerFlame(); window.__exSkip = false; });
    _objs();
  };
  const _us2 = updateStage;
  updateStage = function (dt) { if (mode === 'ending' && !demo) unlock(true); _us2(dt); };   // エンディングに着くと、隠し機体が使えるようになる

  // ---------- 描画: 選択画面と、上下の分割画面 ----------
  const _drawScene = drawScene;
  drawScene = function () {
    if (state === 'select') return drawSelect();
    if (!coop || state !== 'play' || !(mode === 'fight' || mode === 'warp')) return _drawScene();
    draw2P();
  };
  function miniRadar(x, y, w, h, me, mate) {
    const b = basisYP(me.yaw, me.pitch, 0), RNG = 7000, cx = x + w / 2, cy = y + h / 2, rel = p => { const d = vsub(p, me.p); return [cx + dot(d, b.r) / RNG * w / 2, cy - dot(d, b.f) / RNG * h / 2]; };
    noStroke(); fill(0, 12, 24, 190); rect(x, y, w, h, 6); noFill(); stroke(60, 150, 255, 150); strokeWeight(1); rect(x, y, w, h, 6); ellipse(cx, cy, w * 0.9, h * 0.9); line(cx, y + 4, cx, y + h - 4); line(x + 4, cy, x + w - 4, cy);
    noStroke();
    const dotAt = (p, c, s) => { const [px, py] = rel(p); if (px < x + 2 || px > x + w - 2 || py < y + 2 || py > y + h - 2) return; fill(...c); rect(px - s / 2, py - s / 2, s, s); };
    for (const s of ships) if (s.alive) dotAt(s.p, [255, 80, 80], 6); for (const f of fighters) if (!f.cloaked) dotAt(f.p, f.col.rgb, 3);
    const q = rel(DEST); fill(90, 255, 130); ellipse(Math.max(x + 6, Math.min(x + w - 6, q[0])), Math.max(y + 6, Math.min(y + h - 6, q[1])), 7);
    if (mate && !mate.dead) { const [mx, my] = rel(mate.p), c = mate.pno === 2 ? [255, 150, 210] : [120, 230, 255]; fill(...c); const px = Math.max(x + 6, Math.min(x + w - 6, mx)), py = Math.max(y + 6, Math.min(y + h - 6, my)); triangle(px, py - 5, px - 4, py + 4, px + 4, py + 4); }
    fill(255); triangle(cx, cy - 5, cx - 4, cy + 4, cx + 4, cy + 4);
  }
  function miniHUD(pl, view, k) {   // 分割画面の1画面ぶんの表示(座標は、その帯の中: 幅1280 × 高さ360)
    const col = pl.pno === 2 ? [255, 150, 210] : [120, 230, 255], white = [230, 242, 248], gold = [255, 200, 110], mate = players[1 - k];
    withP(pl, () => {
      noStroke(); fill(0, 10, 20, 170); rect(14, 12, 300, 78, 6);
      fill(...col); textAlign(LEFT, TOP); textSize(20); text(pl.pno + 'P', 24, 18); fill(...white); textSize(13); text((pl.ship || SHIPS.valkyrie).name, 62, 22);
      textAlign(RIGHT, TOP); textSize(18); text(String(pl.score).padStart(7, '0'), 304, 18);
      const sh = Math.max(0, Math.min(1, pl.shield / maxSh())), bo = pl.boost / boostMax();
      textAlign(LEFT, CENTER); textSize(10); fill(150, 190, 205); text('SHIELD', 24, 55); text('BOOST', 24, 72);
      for (let i = 0; i < 20; i++) { fill(...(sh > 0.35 ? col : [255, 100, 90]), i / 20 < sh ? 230 : 35); rect(78 + i * 11, 51, 9, 7); fill(...gold, i / 20 < bo ? 220 : 30); rect(78 + i * 11, 68, 9, 5); }
      fill(150, 190, 205); textAlign(RIGHT, CENTER); textSize(11); text('LIVES ' + Math.max(0, pl.lives) + '   LOCK ' + pl.locks.length + '/' + lockMax(), 304, 84);
    });
    miniRadar(W - 214, 360 - 108, 200, 96, view, mate);
    if (isOut(pl)) centerText(pl.pno + TR('P  GAME OVER — 観戦中', 'P  GAME OVER — spectating'), 180, 26, [255, 110, 110]);
    else if (pl.dead) centerText(pl.pno + 'P  RESPAWN', 180, 22, [255, 200, 110]);
    if (pl.hitT > 0) { noStroke(); fill(255, 40, 40, 40 * Math.min(1, pl.hitT / 12)); rect(0, 0, W, 360); }
    if (warningT > 0 && Math.floor(frameCount / 8) % 2 === 0) centerText('WARNING', 130, 26, [255, 110, 100]);
    if (window.__zone && __zone.kind === 'belt' && __zone.alertT > 0 && Math.floor(frameCount / 7) % 2 === 0) centerText(TR('⚠ 衝突警告', '⚠ COLLISION ALERT'), 100, 18, [255, 90, 70]);
  }
  function draw2P() {
    const ctx = drawingContext, oP = P, oC = cam; cockpit = false;
    background(2, 5, 12);
    players.forEach((pl, k) => {
      const view = isOut(pl) ? players[1 - k] : pl;
      P = view; cam = cams[k];
      ctx.save(); ctx.beginPath(); ctx.rect(0, k * 360, W, 360); ctx.clip();
      push(); translate(0, k * 360 + 180 - CY); if (shake > 0.3) translate(random(-shake, shake) * 0.6, random(-shake, shake) * 0.6);
      drawDeepSpace(); drawStars(); drawPlanet(); drawDust(); drawFlightTrails(); drawObjects(); drawShots(); drawWeakPoints(); drawReticle(); if (mode === 'warp') drawWarpFX();
      pop(); noGlow();
      ctx.restore(); ctx.save(); ctx.beginPath(); ctx.rect(0, k * 360, W, 360); ctx.clip(); ctx.translate(0, k * 360);
      miniHUD(pl, view, k);
      ctx.restore();
    });
    P = oP; cam = oC;
    // 共通の表示: 区切りの線・星系と目標・ボス・無線
    noGlow(); stroke(120, 200, 255, 160); strokeWeight(2); line(0, 360, W, 360); noStroke();
    fill(0, 10, 20, 200); rect(CX - 250, 348, 500, 24, 6);
    const ob = window.__cinObj ? window.__cinObj() : [], n = curNode();
    fill(150, 215, 235); textAlign(CENTER, CENTER); textSize(12); text('SECTOR ' + String(stage).padStart(2, '0') + '  ' + n.name + (ob[0] ? '   ◆ ' + ob[0][1] : ''), CX, 360);
    if (bossSpawned && bossShip && bossShip.alive && bossShip.def) { fill(0, 10, 20, 190); rect(CX - 230, 8, 460, 34, 6); fill(255, 164, 151); textSize(12); text(bossShip.def.name.replaceAll('_', ' ') + '  /  PHASE ' + (bossShip.phase + 1), CX, 18); for (let i = 0; i < 30; i++) { fill(255, 113, 110, i / 30 < bossShip.critFrac() ? 230 : 35); rect(CX - 210 + i * 14, 30, 11, 6); } }
    window.__cinNoDraw = true; drawFlightHUD(); window.__cinNoDraw = false;   // 無線・背景の艦隊などを進める(1人用の画面は描かない)
    const S = window.__cin; if (S && S.radio.length) { const r = S.radio[S.radio.length - 1]; fill(0, 0, 0, 150); rect(CX - 300, 380, 600, 22, 5); fill(240, 248, 252); textSize(13); text(TR(r.txt, r.en), CX, 391); }
    if (flash > 0.05) { fill(255, 40, 40, 40 * flash); rect(0, 0, W, H); }
    if (whiteFlash > 0.02) { fill(255, 255, 255, 255 * whiteFlash); rect(0, 0, W, H); }
    drawCRT();
  }

  // ---------- タイトルの「2人で出撃」ボタン(パソコンだけ) ----------
  const btn = document.getElementById('coop-button');
  if (btn) { btn.hidden = NO_COOP; btn.addEventListener('click', () => { openSelect(2); btn.blur(); }); }
  // 確認用
  const _setup = setup;
  setup = function () {
    const fm = /fighter=(\w+)/.exec(location.hash); if (fm && SHIPS[fm[1]]) { choice[0] = fm[1]; if (SHIPS[fm[1]].hidden) unlock(true); }
    if (/coop/.test(location.hash) && !NO_COOP) { coop = true; if (!fm) choice[1] = 'raptor'; }
    _setup();
    if (/select/.test(location.hash)) openSelect(/coop/.test(location.hash) ? 2 : 1);
  };
})();
