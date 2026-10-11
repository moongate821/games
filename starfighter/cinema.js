// 映像の雰囲気(宇宙戦の動画をお手本に): 背景で艦隊が撃ち合う / 大きな惑星と太陽の光 / 星雲 / 無線の字幕と作戦目標 / ミサイル警告 / 大爆発の火球と破片
// 既存の関数を包んで足すだけ(ゲームの動きは変えない)。確認用: #nocin で、この層を切る。
(function () {
  if (/nocin/.test(location.hash)) return;
  const rnd = (a, b) => a + Math.random() * (b - a);
  const vlerp = (a, b, k) => [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, a[2] + (b[2] - a[2]) * k];
  const vcross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
  const mul32 = s => () => { s = (s + 0x6D2B79F5) | 0; let t = Math.imul(s ^ (s >>> 15), 1 | s); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  const PAL = { empire: [255, 120, 70], machine: [70, 190, 255], bio: [110, 230, 120], ancient: [255, 205, 110], void: [190, 110, 255] };
  const WHO = { HQ: ['司令部', [120, 225, 255], 'HQ'], OP: ['オペレーター', [255, 225, 120], 'OPERATOR'], WING: ['僚機 ヴァイパー', [130, 255, 160], 'WINGMAN VIPER'] };
  const LINES = {
    start: [['HQ', '各機、作戦空域に到達。目標を確認しろ', "All wings, arrived in the combat zone. Confirm your target."], ['OP', '敵影を多数捕捉。油断するな', "Multiple hostiles detected. Stay sharp."], ['HQ', '味方艦隊と合流している。連携して叩け', "Allied fleet has joined. Fight as one."]],
    boss: [['OP', '大型の熱源反応! 旗艦だ、弱点を狙え', "Massive heat signature! It's the flagship. Hit its weak points."], ['HQ', '敵旗艦が出現。先に発生器を潰して、艦橋を狙え', "Enemy flagship incoming. Take out the generators first, then the bridge."]],
    fleet: [['OP', '敵艦隊がワープアウト! 大型艦が多数だ', "Enemy fleet warping in! Multiple capital ships!"], ['HQ', '敵の大型艦を全て撃破しろ', "Destroy every enemy capital ship."]],
    down: [['HQ', '撃破を確認。見事だ', "Kill confirmed. Well done."], ['WING', 'やったな! 全機、次の星系へ向かうぞ', "Nice work! All wings, on to the next system."]],
    low: [['OP', 'シールド残量、危険域! 距離を取れ', "Shields critical! Pull back!"], ['WING', '被弾が続いてる、一度離脱しろ!', "You're taking hits. Disengage!"]],
    missile: [['OP', 'ミサイル接近! 回避しろ', "Missile inbound! Evade!"], ['WING', '後ろにつかれてる! 振り切れ', "Someone's on your tail! Shake them off!"]],
    chain: [['WING', 'いい腕だ、その調子で頼む', "Nice flying. Keep it up."], ['WING', '連続撃破! 敵が崩れていくぞ', "Chain kills! The enemy line is collapsing!"]],
    core_enter: [['OP', '惑星の内部へ突入! 岩盤の熱に気をつけろ', "Entering the planet! Watch out for the heat."], ['HQ', '内部の通路を抜けて、最深部の中心核を叩け', "Fly through the inner tunnels and hit the core at the deepest point."]],
    core_found: [['OP', '最深部に巨大な熱源! これが中心核だ', "Huge heat source at the deepest point! That's the planetary core."], ['HQ', '中心核を確認。発生器を潰してから、核を撃て', "Core confirmed. Destroy the generators first, then the core."]],
    core_down: [['HQ', '中心核の破壊を確認! 惑星が崩れるぞ、離脱しろ', "Core destroyed! The planet is collapsing. Get out!"], ['WING', 'やったぞ! 惑星が崩れていく!', "We did it! The planet is coming apart!"]],
    belt_start: [['OP', '小惑星帯に入る。岩の流れに注意しろ', "Entering the asteroid belt. Watch the flow of rocks."], ['HQ', '岩をよけながら、出口まで突破しろ', "Dodge the rocks and break through to the exit."]],
    belt_rock: [['OP', '高速の岩塊が接近! 回避しろ', "Fast rock incoming! Evade!"], ['WING', '正面から岩が来るぞ、よけろ!', "Rock dead ahead! Break!"]],
    belt_exit: [['HQ', '小惑星帯を抜けた。よくやった', "We're through the belt. Good work."], ['WING', '出口だ! 全機、無事か?', "That's the exit! All wings, report in!"]],
    idle: [['HQ', '味方艦隊が正面で交戦中。援護しろ', "Allied fleet is engaging ahead. Give them support."], ['WING', 'こちらヴァイパー、右翼は任せろ', "This is Viper. Leave the right flank to me."], ['OP', '敵の増援を確認。警戒を続けろ', "Enemy reinforcements detected. Stay alert."]],
  };
  const S = { key: '', rng: mul32(1), groups: [], fighters: [], beams: [], booms: [], fire: [], debris: [], radio: [], sun: [0, 0.3, 1], neb: [], stars: [], cities: [],
    objT: 0, objTxt: '', objFn: () => '', warnT: 0, msT: 0, idleT: 900, gotFight: false, prev: { boss: false, fleet: 0, done: false, low: false, chain: 0 }, sndT: 0, noFire: false, err: 0 };
  const themeRgb = () => { try { return PAL[stageFaction()] || PAL.machine; } catch (e) { return PAL.machine; } };
  const inFight = () => state === 'play' && mode === 'fight';

  // ---- 準備(星系ごとに、配置を作り直す) ----
  function reset() {
    let f = [0, 0, 1]; try { f = travelDir; } catch (e) { }
    const b = basisDir(f, 0), rng = S.rng = mul32((stage * 977 + (campaign ? String(campaign.node).split('').reduce((a, c) => a * 31 + c.charCodeAt(0), 7) : 1)) | 0);
    const sg = rng() < 0.5 ? -1 : 1;
    S.sun = vnorm(vadd(vadd(vmul(f, 0.62), vmul(b.r, 0.78 * sg)), vmul(b.u, 0.42)));
    // 星雲
    S.neb = []; const th = themeRgb(), cols = [th, [150, 80, 230], [60, 120, 220], th];
    for (let i = 0; i < 6; i++) { const a = rng() * TWO_PI, e = (rng() - 0.5) * 1.2; S.neb.push({ d: vnorm([Math.cos(a) * Math.cos(e), Math.sin(e), Math.sin(a) * Math.cos(e)]), r: 0.32 + rng() * 0.5, a: 0.07 + rng() * 0.08, c: cols[i % cols.length] }); }
    // 惑星の夜側の街の灯り(緯度経度で持つ)
    S.cities = []; for (let k = 0; k < 14; k++) { const la = (rng() - 0.5) * 2.2, lo = rng() * TWO_PI; for (let j = 0; j < 9; j++) { const a = la + (rng() - 0.5) * 0.16, o = lo + (rng() - 0.5) * 0.2; S.cities.push([Math.cos(a) * Math.cos(o), Math.sin(a), Math.cos(a) * Math.sin(o)]); } }
    // 背景の艦隊(味方と敵が向き合って撃ち合う)
    S.groups = []; const fleetNode = (() => { try { return curNode().kind === 'fleet'; } catch (e) { return false; } })(), nG = lite ? 4 : fleetNode ? 8 : 6;
    for (let g = 0; g < nG; g++) {
      const ally = g % 2 === 0, az = (g + Math.floor(g / 2) * 0.35) * TWO_PI / (nG * 1.0) + (rng() - 0.5) * 0.25, el = -0.12 + rng() * 0.5, dist = 7500 + rng() * 3500;   // 正面に2つ、側面に残り
      S.groups.push({ ally, c: vmul(vnorm(vadd(vadd(vmul(f, Math.cos(az) * Math.cos(el)), vmul(b.r, Math.sin(az) * Math.cos(el))), vmul(b.u, Math.sin(el)))), dist), ships: [], seed: rng() });
    }
    for (const g of S.groups) {
      const foe = S.groups.filter(o => o.ally !== g.ally).sort((x, y) => vlen(vsub(x.c, g.c)) - vlen(vsub(y.c, g.c)))[0] || S.groups[0], fw = vnorm(vsub(foe.c, g.c)), bb = basisDir(fw, 0), n = (lite ? 3 : 5) + Math.floor(rng() * 4);
      for (let i = 0; i < n; i++) {
        const big = i === 0, sz = big ? 560 + rng() * 320 : 190 + rng() * 210;
        g.ships.push({ p: vadd(vadd(vadd(g.c, vmul(bb.r, (rng() - 0.5) * 7000)), vmul(bb.u, (rng() - 0.5) * 2600)), vmul(fw, (rng() - 0.5) * 5000)), fw, r: bb.r, u: bb.u, sz, hp: 3 + Math.floor(rng() * 3), boom: 0 });
      }
    }
    S.fighters = []; const nf = lite ? 8 : 22;
    for (let i = 0; i < nf; i++) { const a = S.groups[i % S.groups.length], bg = S.groups.filter(o => o.ally !== a.ally).sort((x, y) => vlen(vsub(x.c, a.c)) - vlen(vsub(y.c, a.c)))[0] || a; S.fighters.push({ a, b: bg, t: rng(), sp: 0.0016 + rng() * 0.003, w: [(rng() - 0.5) * 5000, (rng() - 0.5) * 2600, (rng() - 0.5) * 5000] }); }
    S.rings = []; const nr = lite ? 1 : 2;   // 軌道リング(宇宙ステーション)
    for (let i = 0; i < nr; i++) { const az = rng() * TWO_PI, el = -0.1 + rng() * 0.4, d = vnorm([Math.cos(az) * Math.cos(el), Math.sin(el), Math.sin(az) * Math.cos(el)]), nn = vnorm([rng() - 0.5, rng() * 0.6 + 0.4, rng() - 0.5]), a = vnorm(vcross(nn, [0, 1, 0.13])), b = vnorm(vcross(nn, a)); S.rings.push({ c: vmul(d, 9000 + rng() * 3000), a, b, R: 1500 + rng() * 900, ph: rng() * TWO_PI }); }
    S.beams = []; S.booms = []; S.beamT = 30; S.bigT = 260;
  }

  // ---- 背景: 星雲 → 太陽 → (元の背景) ----
  const _deep = drawDeepSpace;
  drawDeepSpace = function () {
    if (state === 'title' || lite) return _deep();
    const c = drawingContext; c.save(); c.globalCompositeOperation = 'lighter';
    for (const n of S.neb) {
      const z = dot(n.d, cam.f); if (z < 0.15) continue; const x = CX + dot(n.d, cam.r) / z * F, y = CY - dot(n.d, cam.u) / z * F, r = F * n.r / Math.max(0.5, z) * 1.4;
      if (x < -r || x > W + r || y < -r || y > H + r) continue;
      const g = c.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, `rgba(${n.c[0]},${n.c[1]},${n.c[2]},${n.a})`); g.addColorStop(0.55, `rgba(${n.c[0]},${n.c[1]},${n.c[2]},${n.a * 0.35})`); g.addColorStop(1, 'rgba(0,0,0,0)');
      c.fillStyle = g; c.fillRect(x - r, y - r, r * 2, r * 2);
    }
    const z = dot(S.sun, cam.f);
    if (z > 0.1) {   // 太陽: 大きな光の玉
      const x = CX + dot(S.sun, cam.r) / z * F, y = CY - dot(S.sun, cam.u) / z * F, r = F * 0.55 / Math.max(0.35, z);
      const g = c.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, 'rgba(255,246,225,.85)'); g.addColorStop(0.12, 'rgba(255,225,170,.4)'); g.addColorStop(0.5, 'rgba(255,170,110,.09)'); g.addColorStop(1, 'rgba(0,0,0,0)');
      c.fillStyle = g; c.fillRect(x - r, y - r, r * 2, r * 2);
    }
    c.restore(); _deep();
  };

  // ---- 惑星: 大気の縁の光・昼夜の陰影・夜側の街の灯り ----
  const _planet = drawPlanet;
  drawPlanet = function () {
    let info = null;
    if (!lite && state !== 'title') {
      const c = DEST, R = DEST_R, d = vlen(vsub(cam.p, c));
      if (d > R * 1.02) {
        const p = projW(c);
        if (p) {
          const rs = F * R / Math.sqrt(d * d - R * R), ctx = drawingContext, th = themeRgb(), sx = dot(S.sun, cam.r), sy = -dot(S.sun, cam.u), sl = Math.hypot(sx, sy) || 1;
          info = { p, rs, d };
          ctx.save();
          const h = ctx.createRadialGradient(p[0], p[1], rs * 0.94, p[0], p[1], rs * 1.22); h.addColorStop(0, `rgba(${th[0]},${th[1]},${th[2]},.34)`); h.addColorStop(1, 'rgba(0,0,0,0)');
          ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = h; ctx.beginPath(); ctx.arc(p[0], p[1], rs * 1.22, 0, TWO_PI); ctx.fill();
          ctx.globalCompositeOperation = 'source-over';
          const ox = sx / sl * rs * 0.42, oy = sy / sl * rs * 0.42, g = ctx.createRadialGradient(p[0] + ox, p[1] + oy, rs * 0.04, p[0] + ox * 0.3, p[1] + oy * 0.3, rs * 1.05);
          g.addColorStop(0, `rgba(${Math.round(th[0] * 0.5 + 60)},${Math.round(th[1] * 0.5 + 70)},${Math.round(th[2] * 0.5 + 70)},.62)`); g.addColorStop(0.55, `rgba(${th[0] * 0.12 | 0},${th[1] * 0.16 | 0},${th[2] * 0.22 | 0},.9)`); g.addColorStop(1, 'rgba(2,5,12,.97)');
          ctx.fillStyle = g; ctx.beginPath(); ctx.arc(p[0], p[1], rs, 0, TWO_PI); ctx.fill(); ctx.restore();
        }
      }
    }
    _planet();
    if (info) {   // 夜側の街の灯り
      const c = DEST, R = DEST_R, tc = vnorm(vsub(cam.p, c)), lim = R / info.d, cy = Math.cos(planetRot), sy = Math.sin(planetRot), ctx = drawingContext;
      ctx.save(); ctx.fillStyle = 'rgba(255,215,140,.85)';
      for (const dv of S.cities) {
        const rx = dv[0] * cy + dv[2] * sy, rz = -dv[0] * sy + dv[2] * cy; if (rx * tc[0] + dv[1] * tc[1] + rz * tc[2] < lim + 0.02) continue;
        if (rx * S.sun[0] + dv[1] * S.sun[1] + rz * S.sun[2] > -0.05) continue;
        const q = projW([c[0] + rx * R, c[1] + dv[1] * R, c[2] + rz * R]); if (q) ctx.fillRect(q[0], q[1], 1.6, 1.6);
      }
      ctx.restore();
    }
  };

  // ---- 背景の艦隊戦 ----
  const HULL = (() => {   // 細長い艦の、線のかたち(局所座標: x=右, y=上, z=前)
    const v = [[0, 0, 1.8], [-0.45, -0.16, 0.2], [0.45, -0.16, 0.2], [0.45, 0.16, 0.2], [-0.45, 0.16, 0.2], [-0.38, -0.14, -1.5], [0.38, -0.14, -1.5], [0.38, 0.14, -1.5], [-0.38, 0.14, -1.5], [0, 0.62, -0.9], [0, 0.16, -0.2], [0, 0.16, -1.3], [-0.95, 0, -0.5], [0.95, 0, -0.5], [-0.95, 0, -1.2], [0.95, 0, -1.2]];
    const e = [[0, 1], [0, 2], [0, 3], [0, 4], [1, 2], [2, 3], [3, 4], [4, 1], [1, 5], [2, 6], [3, 7], [4, 8], [5, 6], [6, 7], [7, 8], [8, 5], [10, 9], [9, 11], [1, 12], [4, 12], [12, 14], [14, 5], [14, 8], [2, 13], [3, 13], [13, 15], [15, 6], [15, 7]];
    return { v, e };
  })();
  const at = (s, l, k) => vadd(s.p, vadd(vadd(vmul(s.r, l[0] * s.sz * k), vmul(s.u, l[1] * s.sz * k)), vmul(s.fw, l[2] * s.sz * k)));
  const offP = o => projW(vadd(cam.p, o));
  function tickAmbient(dt) {
    if (!S.groups.length) return;
    for (const g of S.groups) for (const s of g.ships) s.p = vadd(s.p, vmul(s.fw, 0.22 * dt));
    for (const f of S.fighters) { f.t += f.sp * dt; if (f.t > 1) { f.t = 0; f.w = [(Math.random() - 0.5) * 5000, (Math.random() - 0.5) * 2600, (Math.random() - 0.5) * 5000]; } }
    S.beamT -= dt; S.bigT -= dt; S.sndT -= dt;
    const inView = g => dot(vnorm(g.c), cam.f) > 0.15, pick = ally => { let gs = S.groups.filter(g => g.ally === ally && inView(g)); if (!gs.length) gs = S.groups.filter(g => g.ally === ally); const g = gs[Math.floor(Math.random() * gs.length)]; return g.ships[Math.floor(Math.random() * g.ships.length)]; };
    if (S.beamT <= 0 && S.beams.length < 16) {
      S.beamT = rnd(6, 18) * (lite ? 2 : 1); const ally = Math.random() < 0.5, a = pick(ally), b = pick(!ally);
      if (a && b) S.beams.push({ a: vadd(a.p, vmul(a.fw, a.sz * 1.8)), b: b.p, t: 0, life: 30, ally, big: false, tgt: b });
    }
    if (S.bigT <= 0 && S.beams.length < 16) {
      S.bigT = rnd(260, 480); const ally = Math.random() < 0.55, a = pick(ally), b = pick(!ally);
      if (a && b) S.beams.push({ a: vadd(a.p, vmul(a.fw, a.sz * 1.8)), b: b.p, t: 0, life: 70, ally, big: true, tgt: b });
    }
    for (const bm of S.beams) {
      bm.t += dt;
      if (!bm.hit && bm.t >= bm.life * (bm.big ? 0.5 : 0.9)) {
        bm.hit = true; const s = bm.tgt; S.booms.push({ p: [...bm.b], t: 0, life: bm.big ? 46 : 22, sz: bm.big ? 1100 : 420, ally: !bm.ally });
        if (s) { s.hp--; if (s.hp <= 0) { s.hp = 3 + Math.floor(Math.random() * 3); s.boom = 1; S.booms.push({ p: [...s.p], t: 0, life: 60, sz: s.sz * 2.4, ally: !bm.ally }); } }
        if (S.sndT <= 0 && inFight() && !paused) { S.sndT = bm.big ? 1.6 * 60 : 2.4 * 60; try { SND.se(bm.big ? 'boomM' : 'boomS', vadd(cam.p, vsub(bm.b, [0, 0, 0]))); } catch (e) { } }
      }
    }
    S.beams = S.beams.filter(b => b.t < b.life + 8);
    for (const m of S.booms) m.t += dt; S.booms = S.booms.filter(m => m.t < m.life);
  }
  function drawAmbient() {
    if (!S.groups.length || !inFight() || zoneInside) return;
    const c = drawingContext, th = themeRgb(), allyC = [100, 185, 255];
    c.save(); c.lineJoin = 'round'; c.lineCap = 'round';
    for (const rg of S.rings || []) {   // 軌道リング: 二重の輪、ハブへの支柱、まわる灯り
      const ring = (k, n) => { const pts = []; for (let i = 0; i <= n; i++) { const th = i * TWO_PI / n; pts.push(offP(vadd(rg.c, vadd(vmul(rg.a, Math.cos(th) * rg.R * k), vmul(rg.b, Math.sin(th) * rg.R * k))))); } return pts; };
      const o = ring(1, 56), n2 = ring(0.86, 56); c.strokeStyle = 'rgba(160,225,255,.85)'; c.lineWidth = 1.6;
      for (const pts of [o, n2]) { c.beginPath(); let st = false; for (const q of pts) { if (!q) { st = false; continue; } if (!st) { c.moveTo(q[0], q[1]); st = true; } else c.lineTo(q[0], q[1]); } c.stroke(); }
      c.strokeStyle = 'rgba(110,170,210,.4)'; c.lineWidth = 1; c.beginPath(); for (let i = 0; i < 56; i += 2) { const q = o[i], w = n2[i]; if (q && w) { c.moveTo(q[0], q[1]); c.lineTo(w[0], w[1]); } } c.stroke();
      c.beginPath(); for (let i = 0; i < 56; i += 14) { const q = n2[i], h = offP(rg.c); if (q && h) { c.moveTo(q[0], q[1]); c.lineTo(h[0], h[1]); } } c.stroke();
      c.fillStyle = 'rgba(255,225,160,.9)'; const on = Math.floor((frameCount * 0.05 + rg.ph) * 3); for (let i = 0; i < 56; i += 3) { if ((i / 3 + on) % 4 === 0) continue; const q = o[i]; if (q) c.fillRect(q[0] - 1, q[1] - 1, 2.2, 2.2); }
    }
    for (const g of S.groups) {
      const col = g.ally ? allyC : th; c.strokeStyle = `rgba(${col[0]},${col[1]},${col[2]},.72)`; c.lineWidth = 1.2;
      for (const s of g.ships) {
        const pts = HULL.v.map(l => offP(at(s, l, 1))); if (!pts[0] && !pts[9]) continue;
        const pp = offP(s.p); if (!pp) continue;
        c.beginPath(); for (const [a, b] of HULL.e) { const p = pts[a], q = pts[b]; if (p && q) { c.moveTo(p[0], p[1]); c.lineTo(q[0], q[1]); } } c.stroke();
        const en = offP(at(s, [0, 0, -1.6], 1)); if (en) { const r = Math.max(1.5, en[2] * s.sz * 0.2); const gg = c.createRadialGradient(en[0], en[1], 0, en[0], en[1], r * 3); gg.addColorStop(0, `rgba(${col[0]},${col[1]},${col[2]},.55)`); gg.addColorStop(1, 'rgba(0,0,0,0)'); c.fillStyle = gg; c.fillRect(en[0] - r * 3, en[1] - r * 3, r * 6, r * 6); }
      }
    }
    // 艦載機の光の筋
    for (const f of S.fighters) {
      const p0 = vadd(vlerp(f.a.c, f.b.c, f.t), f.w), p1 = vadd(vlerp(f.a.c, f.b.c, Math.max(0, f.t - 0.03)), f.w), a = offP(p0), b = offP(p1); if (!a || !b) continue;
      const col = f.a.ally ? allyC : th; c.strokeStyle = `rgba(${col[0]},${col[1]},${col[2]},.55)`; c.beginPath(); c.moveTo(a[0], a[1]); c.lineTo(b[0], b[1]); c.stroke();
    }
    // 光線(細い曳光弾と、太い主砲)
    for (const bm of S.beams) {
      const col = bm.ally ? allyC : (th[0] > 200 ? [255, 90, 70] : th), k = Math.min(1, bm.t / bm.life);
      const A = offP(bm.a), B = offP(bm.b); if (!A || !B) continue;
      if (bm.big) {
        const al = k < 0.5 ? Math.min(1, k * 6) : Math.max(0, 1 - (k - 0.5) * 2.4);
        if (!lite) { c.shadowColor = `rgb(${col[0]},${col[1]},${col[2]})`; c.shadowBlur = 16; }
        c.strokeStyle = `rgba(${col[0]},${col[1]},${col[2]},${0.75 * al})`; c.lineWidth = 3.2; c.beginPath(); c.moveTo(A[0], A[1]); c.lineTo(B[0], B[1]); c.stroke();
        c.shadowBlur = 0; c.strokeStyle = `rgba(255,255,255,${0.8 * al})`; c.lineWidth = 1.1; c.beginPath(); c.moveTo(A[0], A[1]); c.lineTo(B[0], B[1]); c.stroke();
      } else {
        const h = vlerp(bm.a, bm.b, Math.min(1, k / 0.9)), t = vlerp(bm.a, bm.b, Math.max(0, k / 0.9 - 0.22)), H1 = offP(h), T1 = offP(t); if (!H1 || !T1) continue;
        c.strokeStyle = `rgba(${col[0]},${col[1]},${col[2]},.9)`; c.lineWidth = 1.8; c.beginPath(); c.moveTo(T1[0], T1[1]); c.lineTo(H1[0], H1[1]); c.stroke();
      }
    }
    // 着弾の閃光
    c.globalCompositeOperation = 'lighter';
    for (const m of S.booms) {
      const p = offP(m.p); if (!p) continue; const k = m.t / m.life, r = Math.min(260, p[2] * m.sz * (0.4 + 1.1 * k)), al = Math.pow(1 - k, 1.3);
      const g = c.createRadialGradient(p[0], p[1], 0, p[0], p[1], r); g.addColorStop(0, `rgba(255,245,215,${0.9 * al})`); g.addColorStop(0.35, `rgba(255,170,80,${0.5 * al})`); g.addColorStop(1, 'rgba(0,0,0,0)');
      c.fillStyle = g; c.fillRect(p[0] - r, p[1] - r, r * 2, r * 2);
    }
    c.restore();
  }
  const _dust = drawDust;
  drawDust = function () { try { drawAmbient(); } catch (e) { if (!S.err++) console.warn('cinema ambient', e); } _dust(); };

  // ---- 大爆発の火球と破片(近くで艦が沈むとき) ----
  const _asw = addShockwave;
  addShockwave = function (p, maxR, th, col) {
    _asw(p, maxR, th, col);
    if (maxR >= 260 && !S.noFire && !lite) fireball(p, maxR, col);
  };
  const _wa = warpArrive;
  warpArrive = function (e) { S.noFire = true; try { _wa(e); } finally { S.noFire = false; } };
  function fireball(p, R, col) {
    if (S.fire.length > 6) S.fire.shift();
    const tint = col || [255, 160, 80], seed = Math.random() * 1000, blobs = [];
    for (let i = 0; i < 8; i++) blobs.push([rnd(-1, 1), rnd(-1, 1), rnd(0.35, 0.8), rnd(0, 0.3)]);
    S.fire.push({ p: [...p], R: Math.min(R, 1400) * 0.9, t: 0, life: 70, blobs, tint, seed });
    for (let i = 0; i < 12; i++) { const d = randDir(); S.debris.push({ p: vadd(p, vmul(d, R * 0.15)), v: vmul(d, R * rnd(0.004, 0.014)), ax: randDir(), w: rnd(-0.12, 0.12), len: rnd(0.05, 0.16) * Math.min(R, 1200), t: 0, life: rnd(70, 130) }); }
    if (S.debris.length > 90) S.debris.splice(0, S.debris.length - 90);
  }
  const _shots = drawShots;
  drawShots = function () { _shots(); try { drawFire(); } catch (e) { if (!S.err++) console.warn('cinema fire', e); } };
  function drawFire() {
    if (!S.fire.length && !S.debris.length) return;
    const c = drawingContext; c.save();
    for (const d of S.debris) {
      const a = projW(d.p); if (!a) continue; const k = d.t / d.life, ang = d.w * d.t, ax = vadd(vmul(d.ax, Math.cos(ang)), vmul(vnorm(vcross(d.ax, [0, 1, 0.3])), Math.sin(ang))), p1 = projW(vadd(d.p, vmul(ax, d.len))), p2 = projW(vsub(d.p, vmul(ax, d.len))); if (!p1 || !p2) continue;
      c.strokeStyle = `rgba(${k < 0.3 ? '255,200,120' : '190,215,235'},${(1 - k) * 0.9})`; c.lineWidth = 1.4; c.beginPath(); c.moveTo(p1[0], p1[1]); c.lineTo(p2[0], p2[1]); c.stroke();
    }
    c.globalCompositeOperation = 'lighter';
    for (const f of S.fire) {
      const p = projW(f.p); if (!p) continue; const k = f.t / f.life, e = 1 - Math.pow(1 - Math.min(1, k * 1.4), 3), s = Math.min(760, p[2] * f.R), al = Math.pow(1 - k, 1.35);
      const disc = (x, y, r, a0, a1, a2) => { if (r < 1) return; const g = c.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, a0); g.addColorStop(0.45, a1); g.addColorStop(1, a2); c.fillStyle = g; c.fillRect(x - r, y - r, r * 2, r * 2); };
      disc(p[0], p[1], s * (0.9 + 1.5 * e), `rgba(255,150,60,${0.22 * al})`, `rgba(${f.tint[0]},${Math.min(170, f.tint[1] + 60)},60,${0.12 * al})`, 'rgba(0,0,0,0)');
      for (const b of f.blobs) { const q = k < b[3] ? 0 : (k - b[3]) / (1 - b[3]); disc(p[0] + b[0] * s * 0.9 * e, p[1] + b[1] * s * 0.7 * e, s * b[2] * (0.35 + 0.9 * e), `rgba(255,${210 - q * 90 | 0},${110 - q * 60 | 0},${0.55 * al})`, `rgba(255,110,40,${0.25 * al})`, 'rgba(0,0,0,0)'); }
      disc(p[0], p[1], s * 0.55 * (1 - k * 0.6), `rgba(255,250,235,${0.95 * Math.max(0, 1 - k * 2.2)})`, `rgba(255,220,150,${0.4 * Math.max(0, 1 - k * 2.2)})`, 'rgba(0,0,0,0)');
    }
    c.restore();
  }

  // ---- 無線・作戦目標・警告 ----
  function say(kind) { const l = LINES[kind]; if (!l) return; const [w, t, te] = l[Math.floor(Math.random() * l.length)]; S.radio.push({ who: w, txt: t, en: te, t: 0, life: 300 }); if (S.radio.length > 2) S.radio.shift(); try { SND.se('radio'); } catch (e) { } S.idleT = rnd(1500, 2400); }
  function objective(txt) { S.objFn = typeof txt === 'function' ? txt : () => txt; S.objT = 360; }   // 関数で渡すと、表示のたびに言語が決まる(ゲーム中に、言語を切り替えても、すぐ変わる)
  function events(dt) {
    if (!inFight()) { if (state !== 'play') { S.radio.length = 0; S.objT = 0; } return; }
    const key = stage + '|' + (campaign && campaign.node);
    if (key !== S.key) {
      S.key = key; S.gotFight = false; reset(); S.prev = { boss: false, fleet: 0, done: false, low: false, chain: 0 }; S.radio.length = 0; S.warnT = 0;
      let n = null; try { n = curNode(); } catch (e) { }
      objective(() => (window.__zoneObjText && window.__zoneObjText()) || (n && n.kind === 'fleet' ? TR('敵艦隊を殲滅せよ', 'Annihilate the enemy fleet') : TR('敵旗艦を撃破せよ', 'Destroy the enemy flagship'))); S.startT = 90; S.startKind = n && n.kind === 'belt' ? 'belt_start' : 'start';
    }
    if (S.startT > 0 && (S.startT -= dt) <= 0) say(S.startKind || 'start');
    let n = null; try { n = curNode(); } catch (e) { }
    const isFleet = n && n.kind === 'fleet', boss = !!bossSpawned && !!(isFleet ? fleetShips.length : bossShip), nf = isFleet ? fleetShips.filter(s => s.alive).length : 0;
    if (boss && !S.prev.boss) { if (n.kind !== 'core') say(isFleet ? 'fleet' : 'boss'); objective(() => isFleet ? TR(`敵艦隊を殲滅せよ  残り ${nf} 隻`, `Annihilate the enemy fleet: ${nf} left`) : n.kind === 'core' ? TR('中心核を破壊せよ: 発生器 → 核', 'Destroy the core: generators → core') : TR('弱点を狙え: 発生器 → 艦橋', 'Target the weak points: generators → bridge')); }
    if (isFleet && boss && nf !== S.prev.fleet && S.prev.fleet) objective(() => TR(`敵艦隊を殲滅せよ  残り ${nf} 隻`, `Annihilate the enemy fleet: ${nf} left`));
    const done = boss && (isFleet ? nf === 0 : bossShip && !bossShip.alive);
    if (done && !S.prev.done) say('down');
    const low = P.shield / maxSh() < 0.3 && !P.dead; if (low && !S.prev.low) say('low');
    if ((chain === 10 || chain === 25) && S.prev.chain < chain) say('chain');
    S.prev = { boss, fleet: nf, done, low, chain };
    // ミサイル
    let near = 0; for (const b of ebullets) if (b.homing && (b.kind === 'missile' || b.kind === 'swarm') && vlen(vsub(b.p, P.p)) < 1500) near++;
    if (near) { if (S.warnT <= 0) { say('missile'); S.warnT = 1; } S.warnT = Math.max(S.warnT, 60); } else if (S.warnT > 0) S.warnT -= dt;
    if ((S.idleT -= dt) <= 0 && !boss) say('idle'); else if (S.idleT <= 0) S.idleT = 1200;
  }
  const launchOK = !/demo|nocin|nolaunch/.test(location.hash);
  function launchFx() {   // 発進: 暗い格納庫の通路、カウントダウン、発進許可 → 光の筋になって、宇宙へ
    const L = S.launch, ctx = drawingContext, t = L.t, go = t > 150, a = t < 190 ? 1 : Math.max(0, 1 - (t - 190) / 60);
    if (t > 250) { S.launch = null; S.objT = 360; return; }
    ctx.save(); ctx.fillStyle = `rgba(2,5,9,${0.93 * a})`; ctx.fillRect(0, 0, W, H);
    const cx = CX, cy = CY - 20, off = go ? (t - 150) * 0.018 * (1 + (t - 150) / 25) : t * 0.0012;
    for (let i = 0; i < 16; i++) {
      const z = ((i / 16 + off) % 1 + 1) % 1, k = 0.05 + Math.pow(z, 2.4) * 1.5, w = W * k * 0.82, h = H * k * 0.78, al = Math.min(1, z * 3) * (1 - z * 0.3) * a;
      ctx.strokeStyle = `rgba(90,230,220,${0.55 * al})`; ctx.lineWidth = 1 + z * 2; ctx.strokeRect(cx - w / 2, cy - h / 2, w, h);
      const blink = go || Math.floor((t + i * 7) / 12) % 2 === 0, lc = go ? '120,255,220' : '255,70,50';
      ctx.fillStyle = `rgba(${lc},${(blink ? 0.9 : 0.25) * al})`; for (const [sx, sy] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) ctx.fillRect(cx + sx * w / 2 - 3, cy + sy * h / 2 - 3, 6 + z * 6, 6 + z * 6);
    }
    if (go) { ctx.strokeStyle = `rgba(200,245,255,${0.5 * a})`; ctx.lineWidth = 1.4; for (let i = 0; i < 40; i++) { const an = i * 2.399, r0 = 40 + ((i * 53 + t * 26) % 560), r1 = r0 + 30 + (t - 150); ctx.beginPath(); ctx.moveTo(cx + Math.cos(an) * r0, cy + Math.sin(an) * r0 * 0.62); ctx.lineTo(cx + Math.cos(an) * r1, cy + Math.sin(an) * r1 * 0.62); ctx.stroke(); } }
    // カウントダウン(上の中央)
    const n = t < 50 ? 0 : t < 100 ? 1 : t < 150 ? 2 : 3;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    for (let i = 0; i < 3; i++) { const x = CX - 60 + i * 60, on = i < n; ctx.fillStyle = `rgba(${on ? '120,255,220' : '30,60,70'},${a})`; ctx.fillRect(x - 24, 70, 48, 8); ctx.fillStyle = `rgba(180,230,235,${0.8 * a})`; ctx.font = '12px sans-serif'; ctx.fillText(String(i + 1), x, 94); }
    ctx.font = 'bold 26px sans-serif'; ctx.fillStyle = `rgba(${go ? '120,255,220' : '255,120,90'},${a})`; ctx.fillText(go ? 'LAUNCH' : 'WAIT FOR LAUNCH CLEARANCE', CX, 150);
    ctx.font = '13px sans-serif'; ctx.fillStyle = `rgba(200,225,235,${0.85 * a})`; ctx.fillText(go ? TR('発進!', 'LAUNCH!') : TR('カタパルト接続 ・ 発進許可を待て', 'Catapult connected · Wait for launch clearance'), CX, 180);
    ctx.restore();
    if (t === 2 || Math.floor(t) === 2) try { SND.se('warpCharge'); } catch (e) { }
  }
  function overlay() {
    const ctx = drawingContext, t = frameCount;
    if (S.launch && state === 'play') launchFx();
    ctx.save();
    // 太陽のレンズフレア(コックピットでは、窓の中だけ)
    const z = dot(S.sun, cam.f);
    if (z > 0.35 && !lite && state === 'play' && !zoneInside) {
      const x = CX + dot(S.sun, cam.r) / z * F, y = CY - dot(S.sun, cam.u) / z * F;
      if (x > -80 && x < W + 80 && y > -80 && y < H + 80) {
        ctx.save(); if (cockpit) { ctx.beginPath(); ckPath(ctx, CKWIN); ctx.clip(); }
        ctx.globalCompositeOperation = 'lighter'; const k = Math.min(1, (z - 0.35) * 2.5);
        ctx.strokeStyle = `rgba(255,235,200,${0.22 * k})`; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x - 520, y); ctx.lineTo(x + 520, y); ctx.stroke();
        ctx.strokeStyle = `rgba(160,200,255,${0.1 * k})`; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(x - 300, y - 80); ctx.lineTo(x + 300, y + 80); ctx.stroke();
        for (const [tt, r, a] of [[0.35, 26, 0.09], [0.7, 46, 0.07], [1.25, 20, 0.11], [1.75, 64, 0.06]]) { const gx = x + (CX - x) * tt, gy = y + (CY - y) * tt, g = ctx.createRadialGradient(gx, gy, r * 0.6, gx, gy, r); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(0.85, `rgba(120,190,255,${a * k})`); g.addColorStop(1, 'rgba(0,0,0,0)'); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(gx, gy, r, 0, TWO_PI); ctx.fill(); }
        ctx.restore();
      }
    }
    if (!inFight() || state !== 'play') { ctx.restore(); return; }
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    const shadowText = (s, x, y, size, col, al = 1, weight = '') => { ctx.font = `${weight} ${size}px sans-serif`; ctx.fillStyle = `rgba(0,0,0,${0.75 * al})`; ctx.fillText(s, x + 1.5, y + 1.5); ctx.fillStyle = `rgba(${col[0]},${col[1]},${col[2]},${al})`; ctx.fillText(s, x, y); };
    // 飛行モード(自動操縦)の表示
    const my = cockpit ? 16 : 14, mx = cockpit ? CX + 400 : CX; ctx.font = '11px sans-serif';
    shadowText('ASSIST', mx - 56, my, 11, P.fa ? [120, 235, 255] : [80, 100, 115], 1, P.fa ? 'bold' : ''); shadowText('|', mx, my, 11, [80, 110, 130]); shadowText('FREE', mx + 46, my, 11, !P.fa ? [255, 200, 110] : [80, 100, 115], 1, !P.fa ? 'bold' : '');
    // 作戦目標
    if (S.objT > 0 && !S.launch) {
      const a = Math.min(1, S.objT / 40, (360 - S.objT) / 25), y = cockpit ? 214 : 222;
      shadowText(TR('◆ 作戦目標', '◆ OBJECTIVE'), CX, y - 26, 12, [140, 220, 240], a); shadowText(S.objFn(), CX, y, 24, [235, 245, 250], a, 'bold');
    }
    // ミサイル警告
    if (S.warnT > 0) {
      const on = Math.floor(t / 8) % 2 === 0, y = cockpit ? 292 : 300, col = on ? [255, 90, 70] : [255, 170, 90];
      ctx.beginPath(); ctx.moveTo(CX, y - 46); ctx.lineTo(CX + 14, y - 22); ctx.lineTo(CX - 14, y - 22); ctx.closePath(); ctx.lineWidth = 2; ctx.strokeStyle = `rgb(${col[0]},${col[1]},${col[2]})`; ctx.stroke(); shadowText('!', CX, y - 31, 14, col, 1, 'bold');
      shadowText(TR('ミサイル接近', 'MISSILE INBOUND'), CX, y, 22, col, 1, 'bold');
      if (cockpit) {   // 計器盤の上に、黄色と黒の警告帯
        ctx.save(); ctx.beginPath(); ctx.rect(480, 462, 320, 20); ctx.clip(); ctx.fillStyle = on ? '#d9b400' : '#6a5800'; ctx.fillRect(480, 462, 320, 20); ctx.fillStyle = '#111'; for (let i = -2; i < 20; i++) { ctx.beginPath(); ctx.moveTo(480 + i * 26, 482); ctx.lineTo(480 + i * 26 + 13, 482); ctx.lineTo(480 + i * 26 + 33, 462); ctx.lineTo(480 + i * 26 + 20, 462); ctx.fill(); } ctx.restore();
        shadowText(TR('MISSILE  接近', 'MISSILE  INBOUND'), CX, 472, 12, on ? [255, 255, 255] : [255, 230, 120], 1, 'bold');
      }
    }
    // 無線の字幕
    const by = cockpit ? 438 : 530;
    S.radio.forEach((r, i) => {
      const a = Math.min(1, r.t / 8, (r.life - r.t) / 30), y = by - (S.radio.length - 1 - i) * 26, w = WHO[r.who]; ctx.font = 'bold 14px sans-serif'; const nw = ctx.measureText(TR(w[0], w[2]) + ' ').width; ctx.font = '14px sans-serif'; const tw = ctx.measureText(TR(r.txt, r.en)).width, x0 = cockpit ? CX - (nw + tw) / 2 : 24;
      ctx.textAlign = 'left'; ctx.fillStyle = `rgba(0,0,0,${0.4 * a})`; ctx.fillRect(x0 - 10, y - 12, nw + tw + 20, 24);
      ctx.font = 'bold 14px sans-serif'; ctx.fillStyle = `rgba(${w[1][0]},${w[1][1]},${w[1][2]},${a})`; ctx.fillText(TR(w[0], w[2]), x0, y); ctx.font = '14px sans-serif'; ctx.fillStyle = `rgba(240,248,252,${a})`; ctx.fillText(TR(r.txt, r.en), x0 + nw, y); ctx.textAlign = 'center';
    });
    ctx.restore();
  }
  let last = 0;
  const _hud = drawFlightHUD;
  drawFlightHUD = function () {
    if (!window.__cinNoDraw) _hud();
    try {
      const now = performance.now(), dt = Math.min(3, (now - last) / 16.667 || 1); last = now;
      if (state === 'play' && S.pst !== 'play' && launchOK && stage === 1 && campaign && campaign.node === 'p0' && !campaign.loop) { S.launch = { t: 0 }; S.launchSay = [40, 100, 160]; }
      S.pst = state;
      if (S.launch && !paused) {
        const was = S.launch.t; S.launch.t += dt; P.invuln = Math.max(P.invuln, 30);
        [[30, 'HQ', 'カタパルトに接続。発進準備を完了しろ', 'Catapult connected. Complete launch preparations.'], [95, 'OP', '発進許可を待て。全システム、異常なし', 'Wait for launch clearance. All systems nominal.'], [155, 'HQ', '発進を許可する。ご武運を!', 'Launch cleared. Good luck out there!']].forEach(([tm, who, txt, en]) => { if (was < tm && S.launch.t >= tm) { S.radio.push({ who, txt, en, t: 0, life: 260 }); if (S.radio.length > 2) S.radio.shift(); try { SND.se('radio'); } catch (e) { } if (tm === 155) { try { SND.se('warpJump'); } catch (e) { } whiteFlash = Math.max(whiteFlash, 0.6); } } });
      }
      if (!paused) {
        events(dt); tickAmbient(dt); if (S.objT > 0) S.objT -= dt; for (const r of S.radio) r.t += dt; S.radio = S.radio.filter(r => r.t < r.life);
        for (const f of S.fire) f.t += dt; S.fire = S.fire.filter(f => f.t < f.life); for (const d of S.debris) { d.t += dt; d.p = vadd(d.p, vmul(d.v, dt)); } S.debris = S.debris.filter(d => d.t < d.life);
      }
      if (!window.__cinNoDraw) overlay();
    } catch (e) { if (!S.err++) console.warn('cinema overlay', e); }
  };
  window.__cinObj = function () {   // コックピットの「目標」一覧
    if (!inFight()) return []; let n = null; try { n = curNode(); } catch (e) { return []; }
    if (!bossSpawned) return [[false, TR('目的地へ向かう  ', 'Head for the destination  ') + (vlen(vsub(DEST, P.p)) / 1000).toFixed(1) + ' K']];
    if (n.kind === 'fleet') { const tot = fleetShips.length, al = fleetShips.filter(s => s.alive).length; return [[al === 0, TR('敵艦隊を殲滅  ', 'Destroy the enemy fleet  ') + (tot - al) + '/' + tot]]; }
    const b = bossShip; if (!b) return []; const gs = b.gens ? b.gens.length : 0, ga = b.gensAlive ? b.gensAlive() : 0;
    return [[!b.alive, TR('敵旗艦を撃破', 'Destroy the flagship')], [gs > 0 && ga === 0, TR('発生器を破壊  ', 'Destroy generators  ') + (gs - ga) + '/' + gs]];
  };
  window.__cinSay = say;
  window.__cinLines = LINES;   // 確認用(全台詞を、順に出すため)
  window.__cin = S;
})();
