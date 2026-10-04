// 特殊な戦闘区域(2026-09-26 その8)
//  belt(小惑星帯): 進路に沿って岩の川が流れる。横へ漂う岩・こちらへ飛んでくる速い岩をよけながら戦い、出口まで突破する。
//  core(惑星の内部): 惑星まで飛び、地表の入口から内部へ突入。曲がりくねったトンネル(回転する柵・梁・レーザー網・壁の砲台・敵機)を抜け、
//                    最深部の部屋で、惑星の中心核(ボス)を壊す。
// 既存の関数を包んで足す。確認用: #node=a2(惑星の内部の面)、#node=p4(小惑星帯)、#inside(すぐ内部へ)、#chamber(中心核の部屋から)
(function () {
  const Z = { kind: null, inside: false, t: 0 };
  window.__zone = Z;
  const clamp = (x, a, b) => x < a ? a : x > b ? b : x;
  const cross3 = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
  const say = k => { try { if (window.__cinSay) window.__cinSay(k); } catch (e) { } };
  const rgbOf = () => FACTIONS[stageFaction()].rgb;

  // ---------- 中心核のボス(惑星の最深部。正二十面体の核) ----------
  const coreDef = (name, faction, S, hp, ph) => ({ name, shape: 'poly', S, hp, tr: ['spin'], faction, tier: 1, core: true, ph });
  [coreDef('FORGE_CORE', 'empire', 1.5, 3, [PH(250, 1, 'plasmaCannon', 'empireMissile'), PH(190, 1, 'megaCannon', 'plasmaCannon'), PH(140, 2, 'megaCannon', 'missileBattery', 'flakBurst', 'orbitalStrike')]),
   coreDef('HIVE_HEART', 'bio', 1.6, 3.2, [PH(250, 1, 'sporeCannon', 'acidShot'), PH(190, 1, 'parasiteMissile', 'sporeCannon'), PH(140, 2, 'sporeCannon', 'parasiteMissile', 'toxinCloud', 'tentacleLash')]),
   coreDef('ORACLE_CORE', 'ancient', 1.7, 3.6, [PH(250, 1, 'prismBeam', 'solarBeam'), PH(180, 1, 'gravitySphere', 'prismBeam'), PH(130, 2, 'solarBeam', 'ancientLance', 'novaBurst', 'starfall')]),
   coreDef('CRIMSON_HEART', 'empire', 1.8, 3.8, [PH(230, 1, 'megaCannon', 'plasmaCannon'), PH(170, 2, 'megaCannon', 'empireMissile'), PH(120, 2, 'megaCannon', 'missileBattery', 'flakBurst', 'orbitalStrike')]),
   coreDef('ORIGIN_HEART', 'ancient', 2, 4.2, [PH(220, 1, 'solarBeam', 'gravitySphere'), PH(160, 2, 'prismBeam', 'ancientLance'), PH(115, 2, 'solarBeam', 'gravitySphere', 'novaBurst', 'starfall')])].forEach(d => BOSS_LIST.push(d));

  // ---------- トンネル(惑星の内部) ----------
  const ORIGIN = [0, -260000, 0];   // 惑星の内部は、宇宙から遠く離れた場所に作る(背景・重力と混ざらない)
  function buildTunnel() {
    const n = lite ? 24 : 28, seg = 780, pts = [], dirs = [], rad = [];
    let yaw = Math.atan2(travelDir[0], travelDir[2]), pit = 0, yv = 0, pv = 0, p = [...ORIGIN];
    for (let i = 0; i <= n; i++) {
      const b = basisYP(yaw, pit, 0); pts.push(p); dirs.push(b.f);
      const th = [7, 8, 15, 16, 22].includes(i) ? 1 : [6, 9, 14, 17, 21, 23].includes(i) ? 0.45 : 0;   // くびれ
      rad.push(1050 - 470 * th + (i < 2 ? 150 : 0));
      if (i >= 2) { yv = clamp(yv + rnd(-0.045, 0.045), -0.085, 0.085); pv = clamp(pv + rnd(-0.035, 0.035), -0.06, 0.06); if (Math.abs(pit) > 0.4) pv -= Math.sign(pit) * 0.02; }
      yaw += yv; pit += pv; p = vadd(p, vmul(b.f, seg));
    }
    const fr = []; let r0 = basisDir(dirs[0], 0).r;   // リングの向き(ねじれないように、前のリングから運ぶ)
    for (let i = 0; i <= n; i++) { const f = dirs[i]; r0 = vnorm(vsub(r0, vmul(f, dot(r0, f)))); fr.push({ r: r0, u: vnorm(cross3(f, r0)) }); }
    const K = lite ? 10 : 12, ring = pts.map((c, i) => { const out = []; for (let k = 0; k < K; k++) { const a = k * TWO_PI / K; out.push(vadd(c, vadd(vmul(fr[i].r, Math.cos(a) * rad[i]), vmul(fr[i].u, Math.sin(a) * rad[i])))); } return out; });
    const Rch = 3500, cc = vadd(pts[n], vmul(dirs[n], Rch - 420));
    Object.assign(Z, { n, seg, pts, dirs, rad, fr, K, ring, Rch, cc, pi: 0, ev: [], turrets: [], gates: [], beams: [], embers: [] });
    // 仕掛け: 回転する柵・固定の梁・壁の砲台・敵機の群れ・レーザー網
    for (let i = 3; i < n - 1; i++) {
      const r = Math.random();
      if (i % 4 === 1) Z.gates.push({ i, sp: 2 + Math.floor(Math.random() * 3), w: rnd(0.008, 0.018) * (Math.random() < 0.5 ? -1 : 1), a0: Math.random() * TWO_PI });
      else if (r < 0.4) addTurrets(i, 2 + Math.floor(Math.random() * 2));
      else if (r < 0.62) Z.ev.push({ i, type: 'pack', done: false });
      else if (r < 0.78) Z.ev.push({ i, type: 'fence', done: false });
      else { const a = Math.random() * TWO_PI; Z.beams.push({ i, a: wallPt(i, a, 1), b: wallPt(i, a + 2.2, 1) }); }
      if (i % 5 === 0) Z.ev.push({ i, type: 'pack', done: false });
    }
    for (let i = 0; i < (lite ? 30 : 60); i++) Z.embers.push({ i: Math.random() * n, a: Math.random() * TWO_PI, k: Math.random() * 0.9, sp: rnd(0.002, 0.008) });
    // 部屋(最深部)の球の格子
    Z.chV = []; const L = 10, M = 16; for (let a = 1; a < L; a++) for (let b = 0; b < M; b++) { const la = PI * a / L - PI / 2, lo = TWO_PI * b / M; Z.chV.push(vadd(cc, vmul([Math.cos(la) * Math.cos(lo), Math.sin(la), Math.cos(la) * Math.sin(lo)], Rch))); } Z.chL = L - 1; Z.chM = M;
  }
  function wallPt(i, a, k) { const f = Z.fr[i]; return vadd(Z.pts[i], vadd(vmul(f.r, Math.cos(a) * Z.rad[i] * k), vmul(f.u, Math.sin(a) * Z.rad[i] * k))); }
  function addTurrets(i, cnt) {
    for (let c = 0; c < cnt; c++) {
      const a = Math.random() * TWO_PI, p = wallPt(i, a, 0.93), nrm = vnorm(vsub(Z.pts[i], p));
      const t = { kind: 'wturret', p, n: nrm, r: 75, hp: (4 + stage * 0.4) * DF().hp, pts: 300, dead: false, v: [0, 0, 0], mass: 1e9, fireT: rnd(40, 160), i, flash: 0 };
      t.hurt = d => { t.flash = 5; t.hp -= d; return t.hp <= 0; };
      t.die = () => { t.dead = true; burst(t.p, 24, 12, [255, 170, 90]); addShockwave(t.p, 380, 6, [255, 150, 80]); SND.se('boomM', t.p); shake = Math.max(shake, 6); };
      Z.turrets.push(t);
    }
  }
  function segOf(p, guess) {   // 近い区間(i)・区間内の位置(t)・中心線からの距離(d)・最寄りの中心点(c)・半径(R)
    let best = null;
    for (let i = Math.max(0, guess - 3); i <= Math.min(Z.n - 1, guess + 3); i++) {
      const a = Z.pts[i], b = Z.pts[i + 1], ab = vsub(b, a), t0 = dot(vsub(p, a), ab) / dot(ab, ab), t = clamp(t0, 0, 1), c = vadd(a, vmul(ab, t)), d = vlen(vsub(p, c));
      if (!best || d < best.d) best = { i, t, t0, c, d, R: Z.rad[i] + (Z.rad[i + 1] - Z.rad[i]) * t };
    }
    return best;
  }
  function bounceOff(n, lim, base, hurtIt) {   // 壁に当たった: 押し戻して、はね返す
    P.p = vadd(base, vmul(n, lim)); const vn = dot(P.vel, n);
    if (vn > 0) { P.vel = vsub(P.vel, vmul(n, 1.6 * vn)); P.v = P.vel; if (hurtIt && vn > 1.4) { hurtPlayer(Math.min(28, 4 + vn * 1.1), P.p); SND.se('clang', P.p); burst(vadd(base, vmul(n, lim + 40)), 8, 6, rgbOf()); shake = Math.max(shake, 6); } }
  }
  function constrain3(e, idx) {   // 物体(敵機・味方機)を、トンネルか部屋の中に留める
    const q = segOf(e.p, idx), dc = vlen(vsub(e.p, Z.cc));
    if (dc < Z.Rch - 80) return q.i; if (q.d < q.R - 70 && q.t0 > -0.05) return q.i;
    if (q.i >= Z.n - 2 && dc < Z.Rch + 1200) { e.p = vadd(Z.cc, vmul(vnorm(vsub(e.p, Z.cc)), Z.Rch - 90)); }
    else { const n = vnorm(vsub(e.p, q.c)); e.p = vadd(q.c, vmul(n, Math.max(0, q.R - 80))); }
    if (e.v) e.v = vmul(e.v, 0.6);
    return q.i;
  }
  function enterCore(toChamber) {   // 地表の入口から、内部へ
    buildTunnel();
    ships = []; fighters = []; asteroids = []; fences = []; allies = []; allyShips = []; ebullets = []; specialBullets = []; charges = []; missiles = []; beamFx = []; particles = []; shockwaves = [];
    bossShip = null; bossSpawned = false; fleetShips = []; P.locks = []; P.pending = [];
    Z.inside = true; zoneInside = true; Z.t = 0; Z.coreDown = false;
    START = [...Z.pts[0]]; DEST = [...Z.cc]; const tot = vsub(Z.cc, Z.pts[0]); destDist0 = vlen(tot); travelDir = vnorm(tot); ENC_AT = []; enc = 0;
    const k0 = toChamber ? Z.n - 1 : 0, f = Z.dirs[k0]; if (toChamber) for (const e of Z.ev) e.done = true;
    P.p = vadd(Z.pts[k0], vmul(f, 160)); P.yaw = Math.atan2(f[0], f[2]); P.pitch = Math.asin(clamp(f[1], -1, 1)); P.yawV = P.pitchV = 0; P.vel = vmul(f, 18); P.v = P.vel; Z.pi = k0;
    cam.yaw = P.yaw; cam.pitch = P.pitch; const cb = basisYP(cam.yaw, cam.pitch, 0); cam.p = vadd(vsub(P.p, vmul(cb.f, CAM_BACK)), vmul(cb.u, CAM_UP));
    whiteFlash = 1; shake = 14; SND.se('warpJump'); SND.se('boomM'); rumble(0.7, 0.8, 500); P.invuln = Math.max(P.invuln, 90);
    spawnT = 1e9; swarmT = 1e9; allyT = 1e9; say('core_enter');
  }
  function constrainPl(zi) {   // 自機を、トンネル・部屋の中に留める(壁・柵・梁ではね返る)。区間の番号を返す
      const q = segOf(P.p, zi); zi = q.i;
      const dc = vlen(vsub(P.p, Z.cc)), okCh = dc < Z.Rch - 60, okTube = q.d < q.R - 45 && q.t0 > -0.02;
      if (q.i === 0 && q.t0 < 0) bounceOff(Z.dirs[0], 20, Z.pts[0], false);   // 入口の側へは、戻れない
      else if (!okCh && !okTube) {
        if (q.i >= Z.n - 2 && dc < Z.Rch + 900) bounceOff(vnorm(vsub(Z.cc, P.p)), -(Z.Rch - 60), Z.cc, true);
        else bounceOff(vnorm(vsub(P.p, q.c)), q.R - 45, q.c, true);
      }
      // 回転する柵と、固定の梁
      const hitBar = (a, b, rr) => { const ab = vsub(b, a), t = clamp(dot(vsub(P.p, a), ab) / dot(ab, ab), 0, 1), c = vadd(a, vmul(ab, t)), d = vsub(P.p, c), l = vlen(d); if (l < rr) { const n = l > 1e-3 ? vmul(d, 1 / l) : Z.dirs[zi]; bounceOff(n, rr, c, true); } };
      for (const g of Z.gates) if (Math.abs(g.i - zi) <= 1) for (let k = 0; k < g.sp; k++) { const a = g.a0 + g.w * Z.t + k * TWO_PI / g.sp; hitBar(Z.pts[g.i], wallPt(g.i, a, 1), 62); }
      for (const bm of Z.beams) if (Math.abs(bm.i - zi) <= 1) hitBar(bm.a, bm.b, 58);
        return zi;
  }
  window.__zoneConstrainPl = () => { if (Z.inside && Z.ring && !P.dead) P._zi = constrainPl(P._zi !== undefined ? P._zi : Z.pi); };   // 2P用
  function coreTick(dt) {
    Z.t += dt; spawnT = 1e9; swarmT = 1e9; allyT = 1e9; allies = [];
    if (!P.dead) Z.pi = constrainPl(Z.pi);
    for (const f of fighters) if (vlen(vsub(f.p, P.p)) < 7000) f.zi = constrain3(f, f.zi !== undefined ? f.zi : Z.pi);
    // 先の仕掛けを、近づいたときに出す
    for (const e of Z.ev) if (!e.done && e.i - Z.pi <= 4) {
      e.done = true;
      if (e.type === 'pack') { for (let k = 0, nPk = Math.max(2, Math.round(((lite ? 3 : 5) + Math.floor(stage / 8)) * DF().count)); k < nPk; k++) { const p = wallPt(e.i, Math.random() * TWO_PI, rnd(0, 0.55)), fg = new Fighter(p, pickType(), stageFaction(), { warp: 30, delay: Math.random() * 40 }); fg.zi = e.i; fighters.push(fg); } SND.se('ping'); }
      if (e.type === 'fence') { const a = Math.random() * TWO_PI; fences.push(new LaserFence(wallPt(e.i, a, 0.98), wallPt(e.i, a + PI, 0.98))); announce('19'); }
    }
    // 壁の砲台
    for (const t of Z.turrets) {
      if (t.dead) continue; if (t.flash > 0) t.flash -= dt;
      const d = vsub(P.p, t.p), dist = vlen(d); if (P.dead || dist > 3800 || t.i < Z.pi - 1) continue;
      t.fireT -= dt;
      if (t.fireT <= 0) { t.fireT = rnd(80, 140) * (lite ? 1.3 : 1) * DF().fire; const lead = vadd(P.p, vmul(P.vel, dist / 24)); enemyShot(vadd(t.p, vmul(t.n, 80)), lead, 24, 7 + stage * 0.35); }
    }
    // 最深部に着いた: 中心核が目を覚ます
    if (!bossSpawned && Z.pi >= Z.n - 2) {
      bossSpawned = true; const def = bossFor(stage), f = travelDir;
      bossShip = new BossShip([...Z.cc], Math.atan2(-f[0], -f[2]), def); ships.push(bossShip); startWarp(bossShip, 80, FACTIONS[def.faction].rgb);
      announce('21'); warningT = 180; SND.se('warning'); say('core_found');
    }
    if (bossShip && !bossShip.alive && !Z.coreDown) { Z.coreDown = true; shake = 32; rumble(1, 1, 900); say('core_down'); for (let k = 0; k < 6; k++) addShockwave(vadd(Z.cc, vmul(randDir(), Z.Rch * 0.6)), 1400, 10, [255, 150, 70]); }
    if (Z.coreDown) shake = Math.max(shake, 5 + 4 * Math.random());   // 惑星が崩れていく
  }

  // ---------- 小惑星帯 ----------
  function beltRock(front, fast) {
    const f = travelDir, b = basisDir(f, 0), s = fast ? rnd(3000, 4200) : rnd(-2600, 7600);   // 自機のまわり(後ろにも)に、岩がある
    const a = Math.random() * TWO_PI, rr = fast ? rnd(300, 1600) : Math.pow(Math.random(), 0.7) * 3000;
    const p = vadd(vadd(P.p, vmul(f, s)), vadd(vmul(b.r, Math.cos(a) * rr), vmul(b.u, Math.sin(a) * rr * 0.7)));
    if (!fast && vlen(vsub(p, P.p)) < (front ? 3200 : 1100)) return;   // 補充は、遠くに出す(目の前に急に現れない)
    const big = !fast && Math.random() < 0.1, r = big ? rnd(650, 1300) : fast ? rnd(90, 200) : 90 + Math.pow(Math.random(), 1.6) * 330;
    const A = new Asteroid(p, r, big ? 'big' : 'small'); A.belt = true;
    if (Math.random() < 0.55) A.col = Z.rockCol;
    if (fast) { const hitT = rnd(70, 110), aim = vadd(P.p, vmul(P.vel, hitT)); A.v = vmul(vnorm(vsub(aim, p)), vlen(vsub(aim, p)) / hitT); A.fast = true; A.sy *= 4; A.sx *= 4; }
    else A.v = vadd(vmul(Z.drift, big ? 0.4 : 1), vmul(randDir(), rnd(0, 0.7)));
    asteroids.push(A);
  }
  function beltTick(dt) {
    const f = travelDir;
    asteroids = asteroids.filter(a => { if (!a.belt) return true; const d = vsub(a.p, P.p), s = dot(d, f); return s > -3400 && s < 9000 && vlen(vsub(d, vmul(f, s))) < 5200; });
    const cnt = asteroids.reduce((n, a) => n + (a.belt ? 1 : 0), 0), want = lite ? 58 : 105;
    for (let k = 0; k < 4 && cnt + k < want && !Z.exitReached; k++) beltRock(true, false);
    Z.fastT -= dt;
    if (Z.fastT <= 0 && !Z.exitReached) { Z.fastT = rnd(130, 240) / (1 + stage * 0.025) / DF().count; beltRock(false, true); if (!Z.saidRock) { Z.saidRock = true; say('belt_rock'); } }
    // 衝突の警告: 速い岩が、自機へ向かっている
    Z.alert = false;
    for (const a of asteroids) if (a.fast && !a.dead) { const rel = vsub(a.p, P.p), rv = vsub(a.v, P.vel), vv = dot(rv, rv); if (vv < 1e-6) continue; const tc = -dot(rel, rv) / vv; if (tc > 0 && tc < 110 && vlen(vadd(rel, vmul(rv, tc))) < a.r + 160) { Z.alert = true; break; } }
    if (Z.alert) Z.alertT = 40; else if (Z.alertT > 0) Z.alertT -= dt;
  }

  // ---------- 既存の関数を包む ----------
  const _reset = resetForStage;
  resetForStage = function () {
    Z.inside = false; zoneInside = false; Z.exitReached = false; Z.coreDown = false; Z.alertT = 0; Z.saidRock = false;
    _reset();
    Z.kind = curNode().kind;
    if (Z.kind === 'core') { destDist0 = 22000 + 1800 * Math.min(stage, 12); DEST = vmul(travelDir, destDist0); ENC_AT = [0.3, 0.62]; Z.entry = vadd(DEST, vmul(travelDir, -DEST_R)); }
    if (Z.kind === 'belt') {
      destDist0 = 30000 + 2500 * Math.min(stage, 12); DEST = vmul(travelDir, destDist0); ENC_AT = [0.22, 0.5, 0.78];
      const b = basisDir(travelDir, 0), a = Math.random() * TWO_PI; Z.drift = vadd(vmul(b.r, Math.cos(a) * rnd(1.2, 2.4)), vmul(b.u, Math.sin(a) * rnd(0.4, 1)));
      Z.rockCol = mkCol(215, 175, 135); Z.fastT = 300;
      asteroids = asteroids.filter(q => !q.belt); for (let k = 0; k < (lite ? 58 : 105); k++) beltRock(false, false);
      const nb = vnorm(vadd(b.u, vmul(b.r, rnd(-0.4, 0.4)))), e1 = vnorm(cross3(nb, travelDir)), e2 = vnorm(cross3(nb, e1));   // 遠くに続く、岩の帯
      Z.specks = []; for (let k = 0; k < (lite ? 260 : 520); k++) { const t = Math.random() * TWO_PI, h = (Math.random() + Math.random() + Math.random() - 1.5) * 0.09; Z.specks.push([vnorm(vadd(vadd(vmul(e1, Math.cos(t)), vmul(e2, Math.sin(t))), vmul(nb, h))), Math.random()]); }
      Z.nb = nb;
    }
  };
  const _spawnBoss = spawnBoss;
  spawnBoss = function () {
    const k = curNode().kind;
    if (k === 'core') return;   // 惑星の内部では、最深部で中心核が出る(coreTick)
    if (k === 'belt') { bossSpawned = true; Z.exitReached = true; say('belt_exit'); SND.se('coreOpen'); return; }   // 小惑星帯の出口に着いた
    _spawnBoss();
  };
  const _cleared = stageCleared;
  stageCleared = function () { const k = curNode().kind; if (k === 'belt') return !!Z.exitReached; return _cleared(); };
  const _upd = updateStage;
  updateStage = function (dt) {
    if (mode === 'fight' && state === 'play') {
      if (Z.kind === 'core' && !Z.inside && !P.dead && (vlen(vsub(P.p, Z.entry)) < 1800 || vlen(vsub(P.p, DEST)) < DEST_R + 900)) enterCore(false);
      if (Z.inside) coreTick(dt);
      if (Z.kind === 'belt') beltTick(dt);
    }
    _upd(dt);
  };
  const _grav = gravAt;
  gravAt = function (p) { return zoneInside ? [0, 0, 0] : _grav(p); };
  const _all = allTargets;
  allTargets = function () { const o = _all(); if (zoneInside) for (const t of Z.turrets) if (!t.dead) o.push(t); return o; };
  const _lock = lockTargets;
  lockTargets = function () { const o = _lock(); if (zoneInside) for (const t of Z.turrets) if (!t.dead && vlen(vsub(t.p, P.p)) < 5000) o.push(t); return o; };
  const _bot = botInput;
  botInput = function () {
    const r = _bot();
    if (!zoneInside || mode !== 'fight' || P.dead) return r;
    if (bossShip && bossShip.alive && Z.pi >= Z.n - 2) {   // 中心核の部屋: 発生器 → 核を狙い、近いときは速度を落とす
      if (fighters.some(f => vlen(vsub(f.p, P.p)) < 1200)) return r;
      const cand = bossShip.gensAlive() ? bossShip.gens.filter(g => g.alive) : [bossShip.bridge]; let tg = cand[0]; for (const c of cand) if (vlen(vsub(c.p, P.p)) < vlen(vsub(tg.p, P.p))) tg = c;
      const d = vsub(tg.p, P.p), l = vnorm(d), dist = vlen(d), ey = angDiff(Math.atan2(l[0], l[2]) - P.yaw), ep = Math.asin(clamp(l[1], -1, 1)) - P.pitch;
      r.mx = ey > 0.03 ? 1 : ey < -0.03 ? -1 : 0; r.my = ep > 0.03 ? 1 : ep < -0.03 ? -1 : 0; r.fire = Math.abs(ey) < 0.14 && Math.abs(ep) < 0.14 && dist < 3200; r.brake = dist < 1600; r.boost = false; r.uturn = Math.abs(ey) > 2.4 && simT % 120 < 2;
      return r;
    }
    const b = basisYP(P.yaw, P.pitch, 0); let tgt = null, bd = 1700;
    for (const t of [...Z.turrets.filter(q => !q.dead), ...fighters]) { const d = vsub(t.p, P.p), l = vlen(d); if (l < bd && dot(vnorm(d), b.f) > 0.75) { bd = l; tgt = t; } }
    const aim = tgt ? tgt.p : Z.pts[Math.min(Z.n, Z.pi + 2)], l = vnorm(vsub(aim, P.p)), ey = angDiff(Math.atan2(l[0], l[2]) - P.yaw), ep = Math.asin(clamp(l[1], -1, 1)) - P.pitch;
    r.mx = ey > 0.03 ? 1 : ey < -0.03 ? -1 : 0; r.my = ep > 0.03 ? 1 : ep < -0.03 ? -1 : 0; r.fire = !!tgt && Math.abs(ey) < 0.12 && Math.abs(ep) < 0.12; r.boost = false; r.uturn = false; r.brake = !!tgt;
    return r;
  };

  // ---------- 描画 ----------
  const _deep = drawDeepSpace;
  drawDeepSpace = function () {
    if (!zoneInside) {
      _deep();
      if (Z.kind === 'belt' && Z.specks && state === 'play') {   // 遠くに続く、岩の帯
        const c = drawingContext; c.save();
        for (const [d, k] of Z.specks) { const z = dot(d, cam.f); if (z < 0.05) continue; const x = CX + dot(d, cam.r) / z * F, y = CY - dot(d, cam.u) / z * F; if (x < 0 || x > W || y < 0 || y > H) continue; c.fillStyle = `rgba(${190 + k * 50 | 0},${160 + k * 40 | 0},${130 + k * 30 | 0},${0.25 + k * 0.45})`; const s = 0.8 + k * 1.8; c.fillRect(x, y, s, s); }
        if (!lite) for (let k = 0; k < 8; k++) { const d = Z.specks[k * 37 % Z.specks.length][0], z = dot(d, cam.f); if (z < 0.2) continue; const x = CX + dot(d, cam.r) / z * F, y = CY - dot(d, cam.u) / z * F, r = 260 / z; const g = c.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, 'rgba(150,110,80,.07)'); g.addColorStop(1, 'rgba(0,0,0,0)'); c.fillStyle = g; c.fillRect(x - r, y - r, r * 2, r * 2); }
        c.restore();
      }
      return;
    }
    const c = drawingContext, rgb = rgbOf();   // 惑星の内部: 暗い岩の色と、奥の中心核の光
    c.fillStyle = `rgb(${10 + rgb[0] * 0.03 | 0},${6 + rgb[1] * 0.02 | 0},${6 + rgb[2] * 0.02 | 0})`; c.fillRect(0, 0, W, H);
    const q = projW(Z.cc);
    if (q) { const r = Math.min(1400, 60 + q[2] * Z.Rch * 1.6), g = c.createRadialGradient(q[0], q[1], 0, q[0], q[1], r); g.addColorStop(0, `rgba(255,${150 + rgb[1] * 0.2 | 0},90,${Z.pi >= Z.n - 3 ? 0.35 : 0.22})`); g.addColorStop(0.4, 'rgba(160,60,30,.12)'); g.addColorStop(1, 'rgba(0,0,0,0)'); c.fillStyle = g; c.fillRect(q[0] - r, q[1] - r, r * 2, r * 2); }
  };
  const _stars = drawStars; drawStars = function () { if (!zoneInside) _stars(); };
  const _arena = drawArena; drawArena = function () { if (!zoneInside) _arena(); };
  const _planet = drawPlanet;
  drawPlanet = function () {
    if (zoneInside) return;
    _planet();
    if (Z.kind === 'core' && state === 'play' && Z.entry) {   // 地表の入口: 脈打つ光の輪
      const e = Z.entry, n = vnorm(vsub(START, DEST)), bb = basisDir(n, 0), rgb = rgbOf(), ctx = drawingContext, t = frameCount;
      ctx.save();
      for (const [R, al] of [[1300, 0.35], [900, 0.55], [520, 0.8]]) {
        const pts = []; for (let k = 0; k <= 28; k++) { const a = k * TWO_PI / 28; pts.push(projW(vadd(e, vadd(vmul(bb.r, Math.cos(a) * R), vmul(bb.u, Math.sin(a) * R))))); }
        ctx.strokeStyle = `rgba(255,${170 + rgb[1] * 0.2 | 0},90,${al * (0.6 + 0.4 * Math.sin(t * 0.1 + R))})`; ctx.lineWidth = 2; ctx.beginPath(); let st = false; for (const p of pts) { if (!p) { st = false; continue; } if (!st) { ctx.moveTo(p[0], p[1]); st = true; } else ctx.lineTo(p[0], p[1]); } ctx.stroke();
      }
      const p = projW(e); if (p) { ctx.fillStyle = 'rgba(255,200,120,.95)'; ctx.font = 'bold 13px sans-serif'; ctx.textAlign = 'center'; ctx.fillText('ENTRY  ' + (vlen(vsub(e, P.p)) / 1000).toFixed(1) + ' K', p[0], p[1] - 16); }
      ctx.restore();
    }
  };
  function drawTunnel() {
    const ctx = drawingContext, rgb = rgbOf(), t = frameCount, i0 = Math.max(0, Z.pi - 2), i1 = Math.min(Z.n, Z.pi + (lite ? 11 : 15));
    const P2 = []; for (let i = i0; i <= i1; i++) P2[i] = Z.ring[i].map(projW);
    ctx.save(); ctx.lineJoin = 'round';
    // 壁の面(奥から手前へ)
    for (let i = i1 - 1; i >= i0; i--) {
      const A = P2[i], B = P2[i + 1], dz = i - Z.pi, fog = clamp(1 - (dz - 4) / 12, 0.15, 1);
      for (let k = 0; k < Z.K; k++) {
        const a = A[k], b = A[(k + 1) % Z.K], c = B[(k + 1) % Z.K], d = B[k]; if (!a || !b || !c || !d) continue;
        const sh = 0.5 + 0.5 * Math.sin(k * 2.1 + i * 1.3);
        const lt = fog * (0.55 + 0.45 * sh) * (0.7 + 0.3 * Math.sin(k * TWO_PI / Z.K + 1.2)); ctx.fillStyle = `rgb(${18 + (rgb[0] * 0.16 + 26) * lt | 0},${12 + (rgb[1] * 0.12 + 14) * lt | 0},${12 + (rgb[2] * 0.12 + 12) * lt | 0})`;
        ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.lineTo(c[0], c[1]); ctx.lineTo(d[0], d[1]); ctx.closePath(); ctx.fill();
      }
    }
    // 格子の線(輪と、縦の筋)。3つ目ごとに、熱で光る輪
    for (let i = i0; i <= i1; i++) {
      const A = P2[i], B = P2[i + 1], dz = i - Z.pi, al = clamp(1 - (dz - 5) / 11, 0.1, 1), hot = i % 3 === 0;
      ctx.strokeStyle = hot ? `rgba(255,${120 + rgb[1] * 0.3 | 0},60,${(0.55 + 0.3 * Math.sin(t * 0.08 + i)) * al})` : `rgba(${rgb[0] * 0.6 + 90 | 0},${rgb[1] * 0.6 + 90 | 0},${rgb[2] * 0.6 + 100 | 0},${0.8 * al})`;
      ctx.lineWidth = hot ? 3 : 1.6; ctx.beginPath(); let st = false;
      for (let k = 0; k <= Z.K; k++) { const p = A[k % Z.K]; if (!p) { st = false; continue; } if (!st) { ctx.moveTo(p[0], p[1]); st = true; } else ctx.lineTo(p[0], p[1]); } ctx.stroke();
      if (B) { ctx.strokeStyle = `rgba(${rgb[0] * 0.5 + 80 | 0},${rgb[1] * 0.5 + 80 | 0},${rgb[2] * 0.5 + 90 | 0},${0.62 * al})`; ctx.lineWidth = 1.3; ctx.beginPath(); for (let k = 0; k < Z.K; k++) { const p = A[k], q = B[k]; if (p && q) { ctx.moveTo(p[0], p[1]); ctx.lineTo(q[0], q[1]); } } ctx.stroke(); }
      // 結晶: 壁から内側へ突き出た、光る棘
      for (let k = 0; k < Z.K; k++) if ((i * 7 + k * 3) % 11 === 0) { const w = Z.ring[i][k], tip = vadd(w, vmul(vnorm(vsub(Z.pts[i], w)), 170)), p = projW(w), q = projW(tip); if (p && q) { ctx.strokeStyle = `rgba(${Math.min(255, rgb[0] + 90)},${Math.min(255, rgb[1] + 90)},${Math.min(255, rgb[2] + 90)},${0.8 * al})`; ctx.lineWidth = 2.4; ctx.beginPath(); ctx.moveTo(p[0], p[1]); ctx.lineTo(q[0], q[1]); ctx.stroke(); } }
    }
    // 回転する柵・梁
    ctx.lineCap = 'round';
    for (const g of Z.gates) {
      if (g.i < i0 || g.i > i1) continue; const c = projW(Z.pts[g.i]); if (!c) continue;
      for (let k = 0; k < g.sp; k++) { const a = g.a0 + g.w * Z.t + k * TWO_PI / g.sp, q = projW(wallPt(g.i, a, 1)); if (!q) continue; ctx.strokeStyle = 'rgba(40,20,14,.95)'; ctx.lineWidth = Math.max(3, c[2] * 110); ctx.beginPath(); ctx.moveTo(c[0], c[1]); ctx.lineTo(q[0], q[1]); ctx.stroke(); ctx.strokeStyle = `rgba(255,${140 + rgb[1] * 0.3 | 0},80,.9)`; ctx.lineWidth = Math.max(1.2, c[2] * 14); ctx.stroke(); }
      ctx.fillStyle = 'rgba(255,190,110,.9)'; ctx.beginPath(); ctx.arc(c[0], c[1], Math.max(3, c[2] * 80), 0, TWO_PI); ctx.fill();
    }
    for (const bm of Z.beams) { if (bm.i < i0 || bm.i > i1) continue; const a = projW(bm.a), b = projW(bm.b); if (!a || !b) continue; const w = Math.max(3, Math.min(a[2], b[2]) * 100); ctx.strokeStyle = 'rgba(36,22,18,.96)'; ctx.lineWidth = w; ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.stroke(); ctx.strokeStyle = `rgba(${rgb[0] * 0.6 + 90 | 0},${rgb[1] * 0.6 + 90 | 0},${rgb[2] * 0.6 + 90 | 0},.8)`; ctx.lineWidth = Math.max(1, w * 0.12); ctx.stroke(); }
    // 火の粉: 奥から流れてくる
    for (const e of Z.embers) { e.i -= e.sp * (1 + P.speed * 0.05); if (e.i < Math.max(0, Z.pi - 1)) e.i = Math.min(Z.n - 0.01, Z.pi + 6 + Math.random() * 6); const k = Math.floor(e.i), fr = e.i - k, a = vadd(wallPt(k, e.a, e.k), vmul(Z.dirs[k], fr * Z.seg)), p = projW(a), q = projW(vadd(a, vmul(Z.dirs[k], 70))); if (p && q) { ctx.strokeStyle = `rgba(255,${150 + Math.random() * 80 | 0},80,.8)`; ctx.lineWidth = Math.max(1, p[2] * 9); ctx.beginPath(); ctx.moveTo(p[0], p[1]); ctx.lineTo(q[0], q[1]); ctx.stroke(); } }
    // 最深部の部屋: 球の格子
    if (Z.pi >= Z.n - 7) {
      const V = Z.chV.map(projW), L = Z.chL, M = Z.chM; ctx.strokeStyle = `rgba(255,${130 + rgb[1] * 0.3 | 0},80,.35)`; ctx.lineWidth = 1.2; ctx.beginPath();
      for (let a = 0; a < L; a++) for (let b = 0; b < M; b++) { const p = V[a * M + b], q = V[a * M + (b + 1) % M], r = a + 1 < L ? V[(a + 1) * M + b] : null; if (p && q) { ctx.moveTo(p[0], p[1]); ctx.lineTo(q[0], q[1]); } if (p && r) { ctx.moveTo(p[0], p[1]); ctx.lineTo(r[0], r[1]); } }
      ctx.stroke();
    }
    ctx.restore();
    // 壁の砲台(面で塗る)
    const list = [], col = mkCol(255, 120, 90);
    for (const tt of Z.turrets) { if (tt.dead || tt.i < i0 || tt.i > i1) continue; const bd = basisDir(tt.n, 0), bs = { r: bd.r, u: tt.n, f: vmul(bd.u, -1) }; pushFaces(list, worldToCamAll(bakeMesh(M.turretBase, tt.p, bs, 1.6)), M.turretBase.f, tt.flash > 0 ? C.white : col); }
    if (list.length) paintFaces(list);
    for (const tt of Z.turrets) { if (tt.dead || tt.i < i0 || tt.i > i1) continue; const a = projW(vadd(tt.p, vmul(tt.n, 50))), b = projW(vadd(vadd(tt.p, vmul(tt.n, 50)), vmul(vnorm(vsub(P.p, tt.p)), 110))); if (a && b) { neon([255, 120, 90], 230, lite ? 0 : 8, Math.max(1.5, a[2] * 26)); line(a[0], a[1], b[0], b[1]); noGlow(); } }
  }
  const _objs = drawObjects;
  drawObjects = function () { if (zoneInside && Z.ring) { try { drawTunnel(); } catch (e) { if (!Z.err++) console.warn('tunnel', e); } } _objs(); };
  Z.err = 0;

  // 画面の表示: 衝突警告・区域の目標
  const _hud = drawFlightHUD;
  drawFlightHUD = function () {
    _hud();
    if (state !== 'play' || mode !== 'fight' || window.__cinNoDraw) return;
    const ctx = drawingContext;
    if (Z.kind === 'belt' && Z.alertT > 0 && Math.floor(frameCount / 7) % 2 === 0) { ctx.save(); ctx.textAlign = 'center'; ctx.font = 'bold 20px sans-serif'; ctx.fillStyle = 'rgba(255,90,70,.95)'; ctx.fillText(TR('⚠ 衝突警告  COLLISION ALERT', '⚠ COLLISION ALERT'), CX, cockpit ? 262 : 270); ctx.restore(); }
    if (zoneInside && Z.pi < Z.n - 2) {   // トンネルの進み具合
      ctx.save(); const w = 220, x = CX - w / 2, y = cockpit ? 118 : 128, k = Z.pi / (Z.n - 2);
      ctx.fillStyle = 'rgba(0,0,0,.45)'; ctx.fillRect(x - 6, y - 14, w + 12, 26); ctx.fillStyle = 'rgba(255,170,90,.35)'; ctx.fillRect(x, y + 4, w, 3); ctx.fillStyle = 'rgba(255,190,110,.95)'; ctx.fillRect(x, y + 4, w * k, 3);
      ctx.font = '11px sans-serif'; ctx.textAlign = 'center'; ctx.fillStyle = 'rgba(255,210,150,.95)'; ctx.fillText(TR('中心核まで  ', 'To core  ') + Math.round((Z.n - 2 - Z.pi) * Z.seg / 100) / 10 + ' K', CX, y - 2); ctx.restore();
    }
  };
  // cinema.js の「目標」一覧と、最初の作戦目標
  window.__zoneObjText = () => Z.kind === 'core' ? TR('惑星の内部へ突入し、中心核を破壊せよ', 'Dive into the planet and destroy its core') : Z.kind === 'belt' ? TR('小惑星帯を突破せよ', 'Break through the asteroid belt') : null;
  const _obj = window.__cinObj;
  window.__cinObj = function () {
    if (state !== 'play' || mode !== 'fight') return _obj ? _obj() : [];
    if (Z.kind === 'belt') return [[!!Z.exitReached, TR('小惑星帯を突破  ', 'Break through the belt  ') + (Z.exitReached ? TR('完了', 'Done') : (Math.max(0, vlen(vsub(DEST, P.p)) - 9000) / 1000).toFixed(1) + ' K')], [false, TR('岩をよけて進め', 'Dodge the rocks')]];
    if (Z.kind === 'core') {
      if (!Z.inside) return [[false, TR('惑星の入口へ  ', 'Reach the planet entrance  ') + (vlen(vsub(Z.entry, P.p)) / 1000).toFixed(1) + ' K']];
      if (!bossShip) return [[true, TR('惑星の内部へ突入', 'Dive into the planet')], [false, TR('中心核を目指せ  ', 'Head for the core  ') + Math.round(Z.pi / (Z.n - 2) * 100) + '%']];
      const gs = bossShip.gens.length, ga = bossShip.gensAlive(); return [[!bossShip.alive, TR('中心核を破壊', 'Destroy the core')], [ga === 0, TR('発生器を破壊  ', 'Destroy generators  ') + (gs - ga) + '/' + gs]];
    }
    return _obj ? _obj() : [];
  };
  // 確認用: #inside(すぐ内部へ)、#chamber(部屋から)
  const _setup = setup;
  setup = function () { _setup(); if (Z.kind === 'core' && /inside|chamber/.test(location.hash)) enterCore(/chamber/.test(location.hash)); };
})();
