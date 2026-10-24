/* 霧の灯台 engine.js  ゲームロジック。DOM・Canvas・Audio・乱数の直接呼び出しに依存しない。Nodeでrequire可 */
(function (root) {
'use strict';
function factory(DATA) {
var B = DATA.BALANCE, T = DATA.TOWERS, EN = DATA.ENEMIES, BO = DATA.BOSSES;
function def(id) { return EN[id] || BO[id]; }
function LV(tw) { var d = T[tw.def]; return (tw.br === 'b' && tw.lv === 3 && d.lv3b) ? d.lv3b : d.lv[tw.lv]; }
function angDiff(a, b) { var d = Math.abs(a - b) % (2 * Math.PI); return d > Math.PI ? 2 * Math.PI - d : d; }
function mulberry32(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; var t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }

/* ---- 経路 ---- */
function prepPath(p) {
  var len = [], cum = [0], i; for (i = 1; i < p.pts.length; i++) { len.push(Math.hypot(p.pts[i][0] - p.pts[i - 1][0], p.pts[i][1] - p.pts[i - 1][1])); cum.push(cum[i - 1] + len[i - 1]); }
  return { id: p.id, pts: p.pts, len: len, cum: cum, total: cum[cum.length - 1] };
}
function posAt(path, d, out) {
  if (d < 0) d = 0; if (d > path.total) d = path.total; var i = 0, n = path.len.length;
  while (i < n - 1 && d > path.cum[i + 1]) i++;
  var t = path.len[i] ? (d - path.cum[i]) / path.len[i] : 0, a = path.pts[i], b = path.pts[i + 1];
  out.x = a[0] + (b[0] - a[0]) * t; out.y = a[1] + (b[1] - a[1]) * t; return out;
}

/* ---- ゲーム生成 ---- */
function createGame(stageId, opts) {
  opts = opts || {}; var st = DATA.STAGES[stageId - 1], seed = opts.seed != null ? opts.seed : 1, mods = opts.mods || {};
  if (opts.waveIdx) { var st0 = st; st = Object.assign({}, st0, { waves: opts.waveIdx.map(function (i) { return st0.waves[i]; }), fogWaves: null, storm: null }); }
  var g = {
    seed: seed, rng: mulberry32(seed), time: 0, tick: 0, phase: 'PREP', stageId: stageId, stage: st, dawn: !!opts.dawn,
    oil: opts.oil0 != null ? opts.oil0 : st.oil, base: { x: st.base.x, y: st.base.y, hp: opts.hp0 || B.hpLife, hpMax: B.hpLife }, wave: 0, mods: mods, banned: opts.banned || [], adapt: !!opts.adapt, run: !!opts.run, safe: stageId === 1 && !opts.run, hpRun: opts.hpRun || 1, synR: B.synR + (mods.synRAdd || 0), flashCd: 0, flashes: [], adaptDef: null, lastUp: null, rngEvent: mulberry32((seed + 104729) | 0), pickups: [], surge: null, surgeOn: false, ambushQ: [], buffT: 0, combo: { n: 0, t: -9 }, nextGust: 0, bossWarn: null, totalWaves: st.waves.length,
    nextWaveAt: Infinity, spawnQ: [], waveInfo: [null], slots: [], towers: [], enemies: [], events: [], emitOn: opts.emit !== false,
    paths: st.paths.map(prepPath), air: st.air, altIdx: 0, nextId: 1, lightMul: 1, lightMinus: 0, dmgBuff: 1, bellT: 0, bellWave: -1,
    surgeAll: 0, whale: null, rngCard: mulberry32((seed + 7919) | 0), offer: null, pick: null, card: null, route: 'mix', routeCur: 'mix', cardSpeed: 1, cardAtk: {}, cardAir: 1, lightPlus: 0, cardRange: 0, cardBlast: 0, kidsLeft: 0, cheatInvuln: false, scratch: { x: 0, y: 0 },
    stats: { kills: 0, killsLit: 0, oilEarned: 0, leaks: 0, freezes: 0, maxChain: 0, maxBeam: 0, earlyCalls: 0, lightSumMax: 0, pumpLv3: 0, oilSpent: 0, dmg: {}, bossKilled: {}, killsBy: {}, leakBy: {}, upkeep: 0, built: {} }
  };
  g.slots = st.slots.map(function (s) { return { id: s.id, x: s.x, y: s.y, bonus: s.bonus, noPump: s.noPump, kind: s.kind, tower: null }; });
  if (opts.blockN) { var rb = mulberry32((seed ^ 0x5151) | 0), cand = g.slots.filter(function (s) { return s.kind === 'land'; }); for (var bi = 0; bi < opts.blockN && cand.length; bi++) { var kk = Math.floor(rb() * cand.length); cand[kk].blocked = true; cand.splice(kk, 1); } }
  makeOffer(g);
  return g;
}
function emit(g, e) { if (g.emitOn) g.events.push(e); }

/* ---- 敵 ---- */
function hpScale(g) { return g.stage.hpMul * (g.dawn ? 0.9 : 1) * g.hpRun; }
function effHp(g, id) { var d = def(id); return d.boss ? d.hp * (g.dawn ? 0.9 : 1) * (g.stage.bossMul || 1) * g.hpRun : d.hp * hpScale(g); }
function mkEnemy(g, id, o) {
  o = o || {}; var d = def(id), hp = o.hp != null ? o.hp : Math.round(effHp(g, id));
  var oilM = g.stage.oilMul * (g.mods.oilMul || 1), wv = o.wave;
  var oil = d.boss ? d.oil : Math.round(d.oil * oilM);
  if (!d.boss && !g.dawn) { if (g.stage.storm && g.stage.storm.indexOf(wv) >= 0) oil = Math.round(oil * 1.3); if (g.stage.tide && wv % 2 === 0) oil = Math.round(oil * 1.15); }
  if (g.card && g.card.id === 'C7' && wv === g.card.forWave && !d.boss) { oil = Math.round(oil * 1.3); hp = Math.round(hp * 1.1); }
  if (o.rb && !d.boss) oil = Math.round(oil * B.routeOil);
  if (o.noOil) oil = 0;
  var e = { id: g.nextId++, def: id, boss: !!d.boss, wave: wv, pathIdx: o.pathIdx || 0, d: o.d || 0, x: 0, y: 0, px: 0, py: 0, flying: !!d.flying,
    hp: hp, hpMax: hp, shield: d.shield ? Math.min(d.shield, hp) : 0, armor: d.armor || 0, minFrac: d.boss ? B.minArmorFracBoss : B.minArmorFrac,
    leak: d.leak, oil: oil, res: d.res, lit: false, litCount: 0, strong: false, revealT: 0, vis: false, slowM: 1, slowT: 0, stunT: 0, surgeT: 0, surged: false,
    splitDone: false, half: false, alive: true, phase2: false, flash: 0, bt: 0, sumT: 0, remain: 0, age: 0, stunImmune: !!(d.stunImmune || d.boss), kid: !!o.kid, sp: 0 };
  if (e.flying) { e.x = g.air.x; e.y = g.air.y; } else posAt(g.paths[e.pathIdx], e.d, e);
  e.px = e.x; e.py = e.y; e.remain = e.flying ? Math.hypot(g.base.x - e.x, g.base.y - e.y) : g.paths[e.pathIdx].total - e.d; return e;
}
function addEnemy(g, id, o) {
  var e = mkEnemy(g, id, o); g.enemies.push(e);
  if (o.counted !== false && g.waveInfo[e.wave]) g.waveInfo[e.wave].remaining++;
  emit(g, { t: 'spawn', def: id, id: e.id }); return e;
}

/* ---- 波 ---- */
function pickPath(g, wave) {
  var st = g.stage, n = g.paths.length; if (n === 1) return 0;
  if (st.tide) { var want = (wave % 2 === 0 && !g.dawnNoTide) ? 'S' : 'L'; for (var i = 0; i < n; i++) if (g.paths[i].id === want) return i; return 0; }
  if (g.routeCur && g.routeCur !== 'mix') { for (var q = 0; q < n; q++) if (g.paths[q].id === g.routeCur) return q; }
  var k = g.altIdx++ % n; return k;
}
function startWave(g) {
  var wi = g.wave, st = g.stage; g.wave++; var n = g.wave, list = [], grp, k, i;
  st.waves[wi].forEach(function (gp) { for (k = 0; k < gp.n; k++) list.push(gp.id); });
  var hp = function (id) { return effHp(g, id); };
  list.sort(function (a, b) { return hp(b) - hp(a); });
  g.routeCur = g.route; g.card = (g.pick && g.pick.forWave === n && g.pick.id !== 'C8') ? { id: g.pick.id, forWave: n } : null; g.pick = null; g.offer = null;
  var t = 0, last = 0, hasBoss = list.some(function (x) { return x[0] === 'B'; }); if (hasBoss) { t = 3; emit(g, { t: 'bossComing', def: list.filter(function (x) { return x[0] === 'B'; })[0] }); }
  for (i = 0; i < list.length; i++) {
    var d = def(list[i]); last = t;
    g.spawnQ.push({ at: g.time + t, id: list[i], wave: n, pathIdx: d.flying ? 0 : pickPath(g, n), rb: !d.flying && g.routeCur !== 'mix' && g.paths.length > 1 });
    t += d.gap || B.spawnGap;
  }
  g.waveInfo[n] = { remaining: list.length, lastAt: g.time + last, paid: false, n: n, offered: false };
  g.nextWaveAt = n < g.totalWaves ? g.time + last + B.waveGap : Infinity;
  var inc = 0; g.towers.forEach(function (tw) { if (tw.def === 'T7') inc += T.T7.lv[tw.lv].income; });
  if (inc) { g.oil += inc; g.stats.oilEarned += inc; emit(g, { t: 'oil', delta: inc, pump: true }); }
  payUpkeep(g);
  if (g.mods.bellEvery && n % g.mods.bellEvery === 0) g.bellT = Math.max(g.bellT, 3);
  g.adaptDef = null; if (g.adapt && n >= 3) { var tot = 0, top = null, tv = 0; for (var kk in g.stats.dmg) { tot += g.stats.dmg[kk]; if (g.stats.dmg[kk] > tv) { tv = g.stats.dmg[kk]; top = kk; } } if (tot > 0 && tv / tot > 0.6) { g.adaptDef = top; emit(g, { t: 'adapt', def: top }); } }
  rollEvents(g, n, hasBoss);
  g.phase = 'RUN'; emit(g, { t: 'wave', n: n, last: n === g.totalWaves });
}
function cardPool(g) { var out = [], id; if (g.stage.id < 3 && !g.run) return out; for (id in DATA.CARDS) if (g.stage.id >= DATA.CARDS[id].min) out.push(id); return out; }
function makeOffer(g) {
  var fw = g.wave + 1; if (fw > g.totalWaves) { g.offer = null; return; }
  var pool = cardPool(g), ids = [], k; while (ids.length < 3 && pool.length) { k = Math.floor(g.rngCard() * pool.length); ids.push(pool[k]); pool.splice(k, 1); }
  if (!ids.length) { g.offer = null; return; } g.offer = { forWave: fw, ids: ids }; if (g.pick && g.pick.forWave !== fw) g.pick = null;
}
function upkeepOf(g, tw) {
  var u = LV(tw).upkeep; if (!u) return 0; var m = g.stage.upkeepMul * (g.dawn ? 0.5 : 1); if (m <= 0) return 0;
  m *= (g.mods.upkeepMul || 1); var c = Math.max(1, Math.round(u * m)); if (tw.upDisc) c = Math.max(1, c - 1); if (g.mods.upkeepMinus) c = Math.max(1, c - g.mods.upkeepMinus); return c;
}
function payUpkeep(g) {
  var tot = 0, dim = 0, i, tw, c; g.towers.forEach(function (t) { t.auto = false; });
  var free = g.card && g.card.id === 'C6';
  for (i = 0; i < g.towers.length; i++) {
    tw = g.towers[i]; if (!T[tw.def].light || tw.off) continue; c = free ? 0 : upkeepOf(g, tw);
    if (g.oil >= c) { g.oil -= c; tot += c; } else { tw.auto = true; dim++; }
  }
  g.stats.upkeep += tot; g.stats.oilSpent += tot; if (tot || dim) emit(g, { t: 'upkeep', total: tot, dimmed: dim });
}
function nextUpkeep(g) {
  var tot = 0; if (g.pick && g.pick.id === 'C6' && g.pick.forWave === g.wave + 1) return 0;
  g.towers.forEach(function (tw) { if (T[tw.def].light && !tw.off) tot += upkeepOf(g, tw); }); return tot;
}
function rollEvents(g, n, hasBoss) {
  var ev = g.rngEvent, sid = g.stage.id, r1 = ev(), r2 = ev(), r3 = ev(), r4 = ev(), r5 = ev(), r6 = ev(), r7 = ev();
  if (g.dawn) return;
  if ((sid === 1 ? n >= 2 : sid === 11 ? true : (sid >= 2 && r1 < 0.55))) g.pickups.push({ id: g.nextId++, kind: 'star', x: 2 + r5 * 20, y: -0.5, vx: (r6 < 0.5 ? 1 : -1) * (1.2 + r7), vy: 1.0, t: 0, dur: 6.5 + (g.mods.pickupDurAdd || 0) });
  if (sid >= 4 && r2 < 0.22) g.pickups.push({ id: g.nextId++, kind: 'chest', x: 4 + r5 * 16, y: 3 + r6 * 8, vx: 0, vy: 0, t: 0, dur: 12 + (g.mods.pickupDurAdd || 0) });
  if (sid >= 3 && n >= 3 && !hasBoss && r3 < 0.4 && !g.surge) { g.surge = { t: 0, warn: 3, dur: 7 }; emit(g, { t: 'surgeWarn' }); }
  if (sid >= 5 && n >= 4 && !hasBoss && r4 < 0.3) { var pi = g.paths.length > 1 ? Math.floor(r5 * g.paths.length) : 0, P = g.paths[pi], d = P.total * 0.5, pos = posAt(P, d, { x: 0, y: 0 }); g.ambushQ.push({ t: 4, n: 3, pathIdx: pi, d: d, x: pos.x, y: pos.y, wave: n }); emit(g, { t: 'ambushWarn', x: pos.x, y: pos.y }); }
}
function updateEvents(g, dt) {
  var i, p;
  for (i = g.pickups.length - 1; i >= 0; i--) { p = g.pickups[i]; p.t += dt; p.x += p.vx * dt; p.y += p.vy * dt; if (p.t >= p.dur || p.y > 14) { g.pickups.splice(i, 1); emit(g, { t: 'pickupLost', kind: p.kind, x: p.x, y: p.y }); } }
  if (g.surge) { var sg = g.surge; sg.t += dt; var on = sg.t >= sg.warn && sg.t < sg.warn + sg.dur; if (on && !g.surgeOn) emit(g, { t: 'surgeOn' }); g.surgeOn = on; if (sg.t >= sg.warn + sg.dur) { g.surge = null; g.surgeOn = false; emit(g, { t: 'surgeEnd' }); } }
  for (i = g.ambushQ.length - 1; i >= 0; i--) { var a = g.ambushQ[i]; a.t -= dt; if (a.t <= 0) { for (var k = 0; k < a.n; k++) addEnemy(g, 'E01', { wave: a.wave, pathIdx: a.pathIdx, d: Math.max(0, a.d - k * 0.5), hp: Math.round(30 * hpScale(g)) }); emit(g, { t: 'ambush', x: a.x, y: a.y }); g.ambushQ.splice(i, 1); } }
  if (g.buffT > 0) g.buffT -= dt;
  if (g.stage.storm && !g.dawn && g.stage.storm.indexOf(g.wave) >= 0 && g.time >= g.nextGust) { var ls = g.towers.filter(function (t) { return T[t.def].light; }); if (ls.length) { var tg = ls[Math.floor(g.rngEvent() * ls.length)]; tg.gustT = 3; emit(g, { t: 'gust', x: tg.x, y: tg.y }); } g.nextGust = g.time + 6; }
  for (i = 0; i < g.towers.length; i++) { if (g.towers[i].snuffT > 0) g.towers[i].snuffT -= dt; if (g.towers[i].gustT > 0) g.towers[i].gustT -= dt; }
}
function updateSpawns(g) {
  var q = g.spawnQ;
  if (g.wave > 0 && g.wave < g.totalWaves && g.waveInfo[g.wave] && !g.waveInfo[g.wave].offered && g.time >= g.waveInfo[g.wave].lastAt) { g.waveInfo[g.wave].offered = true; makeOffer(g); }
  for (var i = 0; i < q.length;) { if (q[i].at <= g.time) { var s = q[i]; q.splice(i, 1); addEnemy(g, s.id, { wave: s.wave, pathIdx: s.pathIdx, counted: false, rb: s.rb }); } else i++; }
  if (g.phase === 'RUN' && g.wave < g.totalWaves && g.time >= g.nextWaveAt) startWave(g);
}

/* ---- 光 ---- */
function computeGlobals(g) {
  var st = g.stage, w = g.wave, m = 1, dm = 1, dawn = g.dawn;
  if (!dawn) {
    if (st.fogWaves && st.fogWaves[w]) m *= st.fogWaves[w];
    if (st.storm && st.storm.indexOf(w) >= 0) m *= 0.9;
    if (st.newMoon) { m *= 0.85; dm = 1.1; }
    if (st.deepen) m *= 1 - Math.min(0.22, 0.015 * w);
  }
  if (g.surgeOn) m *= 0.85;
  g.lightMul = m * (g.mods.lightAllMul || 1); g.dmgBuff = dm * (g.buffT > 0 ? 1.15 + (g.mods.chestDmgAdd || 0) : 1);
  var minus = 0, i, e;
  for (i = 0; i < g.enemies.length; i++) {
    e = g.enemies[i]; if (!e.alive || !e.boss) continue;
    if (e.def === 'B1' && (e.bt % 25) >= 19) minus += 1.0;
    if (e.def === 'B4' && !e.phase2) minus += Math.min(DATA.BALANCE.whaleMinusMax, 0.5 * Math.floor(e.bt / 10));
  }
  g.lightMinus = minus; g.cardSpeed = 1; g.cardAtk = {}; g.cardAir = 1; g.lightPlus = 0; g.cardRange = 0; g.cardBlast = 0;
  if (g.card && g.card.forWave === w) {
    var cid = g.card.id, A25 = B.cardAtk;
    if (cid === 'C1') g.lightPlus = B.cardLight; else if (cid === 'C2') g.cardSpeed = B.cardSlow; else if (cid === 'C3') { g.cardAtk.T2 = A25; g.cardAtk.T5 = A25; }
    else if (cid === 'C4') { g.cardAtk.T3 = A25; g.cardAtk.T8 = A25; g.cardBlast = 0.15; } else if (cid === 'C5') { g.cardAir = B.cardAir; g.cardRange = B.cardRange; }
  }
  var sg = 0; for (i = 0; i < g.enemies.length; i++) { e = g.enemies[i]; if (e.alive && e.def === 'B3' && (e.bt % 20) >= 16) sg = 1; }
  g.surgeAll = sg;
}
function inFan(m, x, y) {
  var ML = T.T6.lv[m.lv], len = ML.infl + (m.rel || 0); if (Math.hypot(x - m.x, y - m.y) > len) return false;
  return angDiff(Math.atan2(y - m.y, x - m.x), m.aim * Math.PI / 4) <= ML.cone * Math.PI / 180;
}
function computeLights(g, dt) {
  var i, j, tw, d, L, sum = 0, mirrors = [], snuff = [], e;
  for (i = 0; i < g.towers.length; i++) { tw = g.towers[i]; if (tw.def === 'T6') { mirrors.push(tw); tw.rel = 0; } }
  for (var pass = 0; pass < 2; pass++) for (i = 0; i < mirrors.length; i++) for (j = 0; j < mirrors.length; j++) if (i !== j && inFan(mirrors[i], mirrors[j].x, mirrors[j].y)) mirrors[j].rel = Math.max(mirrors[j].rel, Math.min(2 * B.mirrorRelay, mirrors[i].rel + B.mirrorRelay));
  for (i = 0; i < g.enemies.length; i++) { e = g.enemies[i]; if (e.alive && e.def === 'E07') snuff.push(e); }
  for (i = 0; i < g.towers.length; i++) {
    tw = g.towers[i]; d = T[tw.def]; L = LV(tw); tw.buff = 1; var add = 0;
    for (j = 0; j < mirrors.length; j++) {
      var m = mirrors[j], ML = T.T6.lv[m.lv];
      if (m !== tw && inFan(m, tw.x, tw.y)) { if (d.light) add += ML.add * B.mirrorGain; if (ML.buff && !d.support) tw.buff = Math.max(tw.buff, 1 + ML.buff); }
    }
    if (add > 2) add = 2; tw.mAdd = add;
    var syn = 0, hasT7 = false;
    for (j = 0; j < g.towers.length; j++) {
      var o = g.towers[j]; if (o === tw || Math.hypot(o.x - tw.x, o.y - tw.y) > g.synR) continue;
      if (tw.def === 'T2' && o.def === 'T1') syn |= 1; if (tw.def === 'T3' && o.def === 'T4') syn |= 2; if (tw.def === 'T5' && o.def === 'T4') syn |= 4; if (tw.def === 'T1' && o.def === 'T1') syn |= 8; if (o.def === 'T7') hasT7 = true;
    }
    if (d.light && hasT7) syn |= 16; tw.syn = syn; tw.upDisc = (syn & 16) ? 1 : 0;
    if (d.light && !tw.off && !tw.auto && !(tw.snuffT > 0)) {
      var r = (L.light + tw.slot.bonus + add + ((syn & 8) ? B.synLight : 0) + (tw.def === 'T1' ? (g.mods.lightT1 || 0) : 0)) * g.lightMul + g.lightPlus;
      for (j = 0; j < snuff.length; j++) if (Math.hypot(snuff[j].x - tw.x, snuff[j].y - tw.y) <= 2) { r *= 0.7; break; }
      if (tw.gustT > 0) r *= 0.6; r -= g.lightMinus; if (r < 0.3) r = 0.3; tw.R = r; sum += r;
    } else tw.R = 0;
    if (d.beam && !tw.off && !tw.auto) tw.angle += B.beamRot * dt;
  }
  if (sum > g.stats.lightSumMax) g.stats.lightSumMax = sum;
}
function evalLit(g, dt) {
  var i, j, e, tw, any, bx = g.base.x, by = g.base.y, lights = [];
  for (j = 0; j < g.towers.length; j++) if (T[g.towers[j].def].light && g.towers[j].R > 0) lights.push(g.towers[j]);
  for (i = 0; i < g.enemies.length; i++) {
    e = g.enemies[i]; if (!e.alive) continue;
    var cnt = 0, strong = false;
    for (j = 0; j < lights.length; j++) {
      tw = lights[j]; var dx = e.x - tw.x, dy = e.y - tw.y, d = T[tw.def], inL = dx * dx + dy * dy <= tw.R * tw.R, inB = d.beam && inBeam(tw, dx, dy);
      if (inL || inB) { cnt++; if (LV(tw).strong && (d.beam ? inB : inL)) strong = true; }
    }
    // 大レンズの光線は半径内でも strong 判定は光線上のみ(上で処理)
    for (j = 0; j < g.flashes.length; j++) { var fl = g.flashes[j]; if (Math.hypot(e.x - fl.x, e.y - fl.y) <= fl.r) cnt++; }
    e.litCount = cnt; var wasVis = e.vis, wasLit = e.lit; e.lit = cnt > 0; e.strong = strong;
    if (e.lit) e.revealT = (def(e.def).afterimage || B.afterimage) + (g.mods.afterAdd || 0); else if (e.revealT > 0) e.revealT -= dt;
    var near = Math.hypot(e.x - bx, e.y - by) <= B.baseLight;
    e.vis = e.lit || e.revealT > 0 || near;
    if (e.vis && !wasVis) emit(g, { t: 'reveal', id: e.id, x: e.x, y: e.y });
    if (e.lit && !wasLit && e.def === 'E10' && !e.surged) { e.surged = true; e.surgeT = 2; }
    if (!e.lit) { // 回復
      if (e.def === 'E08') e.hp = Math.min(e.hpMax, e.hp + e.hpMax * 0.03 * dt);
      if (e.def === 'B3') e.hp = Math.min(e.hpMax, e.hp + e.hpMax * 0.01 * dt);
    }
  }
}
function inBeam(tw, dx, dy) {
  var L = LV(tw).beamLen, c = Math.cos(tw.angle), s = Math.sin(tw.angle), a = dx * c + dy * s, p = Math.abs(-dx * s + dy * c);
  return a >= 0 && a <= L && p <= B.beamWidth;
}

/* ---- 敵の移動 ---- */
function moveEnemies(g, dt) {
  var i, j, e, auras = [];
  for (i = 0; i < g.enemies.length; i++) { e = g.enemies[i]; if (e.alive && e.def === 'E12') auras.push(e); }
  var st = g.stage;
  for (i = 0; i < g.enemies.length; i++) {
    e = g.enemies[i]; if (!e.alive) continue; e.age += dt; e.px = e.x; e.py = e.y;
    if (e.slowT > 0) e.slowT -= dt; if (e.stunT > 0) e.stunT -= dt; if (e.surgeT > 0) e.surgeT -= dt; if (e.flash > 0) e.flash -= dt;
    if (e.boss) bossUpdate(g, e, dt);
    if (!e.alive) continue;
    var d = def(e.def), m = 1;
    if (e.lit) m *= 1 - (e.strong ? B.strongSlow : B.litSlow) * (1 - e.res);
    if (e.slowT > 0) m *= e.slowM;
    m *= g.cardSpeed;
    if (g.bellT > 0) m *= 1 - B.bellSlow;
    if (m < B.minSpeedFrac) m = B.minSpeedFrac;
    var boost = 1;
    if (!g.dawn && st.storm && st.storm.indexOf(e.wave) >= 0) boost *= 1.2;
    if (e.surgeT > 0) boost *= 1.6;
    if (g.surgeAll) boost *= 1.4;
    for (j = 0; j < auras.length; j++) if (auras[j] !== e && Math.hypot(auras[j].x - e.x, auras[j].y - e.y) <= 2) { boost *= 1.3; break; }
    if (e.half) boost *= 0.85; if (e.dashT > 0) { boost *= 2.2; e.dashT -= dt; }
    if (e.def === 'E07') for (j = 0; j < g.towers.length; j++) { var tq = g.towers[j]; if (T[tq.def].light && Math.hypot(tq.x - e.x, tq.y - e.y) <= 1.4) tq.snuffT = Math.max(tq.snuffT, 0.8); }
    var sp = e.stunT > 0 ? 0 : d.speed * m * boost; e.sp = sp; var mv = sp * dt;
    if (e.flying) {
      var dx = g.base.x - e.x, dy = g.base.y - e.y, dist = Math.hypot(dx, dy);
      if (dist <= mv) { leak(g, e); continue; } e.x += dx / dist * mv; e.y += dy / dist * mv; e.remain = dist - mv;
    } else {
      var P = g.paths[e.pathIdx]; e.d += mv; if (e.d >= P.total) { leak(g, e); continue; }
      posAt(P, e.d, e); e.remain = P.total - e.d;
    }
  }
}
function bossActions(g, e, dt) {
  var P = { B1: [18, 'roar'], B2: [14, 'dash'], B3: [20, 'call'], B4: [20, 'roar'] }[e.def]; if (!P || e.phase2) return;
  if (e.warn) { e.warn.t -= dt; if (e.warn.t <= 0) { var k = e.warn.kind, j;
    if (k === 'roar') { for (j = 0; j < g.towers.length; j++) { var tq = g.towers[j]; if (T[tq.def].light && Math.hypot(tq.x - e.x, tq.y - e.y) <= 4.5) tq.snuffT = 3.5; } emit(g, { t: 'roar', x: e.x, y: e.y }); }
    else if (k === 'dash') { e.dashT = 2.2; emit(g, { t: 'dash', x: e.x, y: e.y }); }
    else if (k === 'call') { for (j = 0; j < 3; j++) addEnemy(g, 'E01', { wave: e.wave, pathIdx: e.pathIdx, d: Math.max(0, e.d - j * 0.5), hp: Math.round(30 * hpScale(g)) }); emit(g, { t: 'summon', x: e.x, y: e.y }); }
    e.warn = null; e.actT = P[0]; } return; }
  e.actT = (e.actT == null ? P[0] * 0.6 : e.actT) - dt; if (e.actT <= 0) { e.warn = { kind: P[1], t: 1.8 }; emit(g, { t: 'bossWarn', kind: P[1], x: e.x, y: e.y, def: e.def }); }
}
function bossUpdate(g, e, dt) {
  e.bt += dt; bossActions(g, e, dt);
  if (e.def === 'B2') {
    if (!e.half && e.hp <= e.hpMax / 2) { e.half = true; e.armor += 2; emit(g, { t: 'bossPhase', def: 'B2' }); }
    e.sumT += dt; if (e.sumT >= 8) { e.sumT -= 8; for (var k = 0; k < 2; k++) addEnemy(g, 'E01', { wave: e.wave, pathIdx: e.pathIdx, d: Math.max(0, e.d - k * 0.4), hp: Math.round(30 * 1.7) }); emit(g, { t: 'summon', x: e.x, y: e.y }); }
  } else if (e.def === 'B4' && !e.phase2) {
    e.sumT += dt; if (e.sumT >= 15) { e.sumT -= 15; for (var q = 0; q < 5; q++) addEnemy(g, 'E01', { wave: e.wave, pathIdx: e.pathIdx, d: Math.max(0, e.d - q * 0.5) }); emit(g, { t: 'summon', x: e.x, y: e.y }); }
  }
}

/* ---- ダメージ ---- */
var SHIELD_K = { T2: 0.5, T3: 0.5, T5: 2, T8: 2 };
function damage(g, e, raw, o) {
  if (!e.alive) return 0; o = o || {};
  if (e.phase2 && e.litCount < 1) { emit(g, { t: 'hit', x: e.x, y: e.y, id: e.id, nodmg: true }); return 0; }
  var d = raw * g.dmgBuff; if (e.phase2 && e.litCount < 2) d *= B.whaleSingleLight;
  if (e.lit) d *= 1 + (e.strong ? B.strongExpose : B.litExpose) * (1 - e.res);
  if (e.litCount >= 2) d *= 1.08;
  if (e.armor > 0 && !o.pierce) d = Math.max(d * e.minFrac, d - e.armor);
  if (e.shield > 0 && SHIELD_K[o.k] && !(o.k === 'T2' && o.sp)) d *= SHIELD_K[o.k];
  if (e.flying) d *= g.cardAir * (g.mods.airMul || 1);
  if (g.adaptDef && o.k === g.adaptDef) d *= 0.85;
  if (g.cheatInvuln === 'oneshot') d = 1e9;
  e.hp -= d; e.flash = 0.1; if (e.shield > 0) e.shield = Math.max(0, Math.min(e.shield, e.hp));
  g.stats.dmg[o.k || '?'] = (g.stats.dmg[o.k || '?'] || 0) + d;
  emit(g, { t: 'hit', x: e.x, y: e.y, id: e.id });
  if (e.hp <= 0) { kill(g, e); return d; }
  if (e.def === 'E09' && !e.splitDone && e.hp <= e.hpMax / 2) {
    e.splitDone = true; for (var k = 0; k < 2; k++) addEnemy(g, 'E01', { wave: e.wave, pathIdx: e.pathIdx, d: Math.max(0, e.d - k * 0.3), hp: Math.round(20 * hpScale(g)), noOil: true });
    emit(g, { t: 'split', x: e.x, y: e.y });
  }
  if (e.def === 'B2' && !e.half && e.hp <= e.hpMax / 2) { e.half = true; e.armor += 2; emit(g, { t: 'bossPhase', def: 'B2' }); }
  return d;
}
function waveDone(g, e) { var wi = g.waveInfo[e.wave]; if (wi) wi.remaining--; }
function kill(g, e) {
  if (!e.alive) return; e.alive = false; e.hp = 0;
  if (e.def === 'B4' && !e.phase2) { // 第1形態: ほどけた霧
    waveDone(g, e); g.kidsLeft = 12; g.whale = 'kids';
    for (var k = 0; k < 12; k++) addEnemy(g, 'E03', { wave: e.wave, pathIdx: e.pathIdx, d: Math.max(0, e.d - k * 0.35), kid: true, noOil: true, hp: Math.round(20 * hpScale(g)) });
    emit(g, { t: 'bossPhase', def: 'B4', form: 'kids', x: e.x, y: e.y }); return;
  }
  var gain = e.oil; if (gain) { g.oil += gain; g.stats.oilEarned += gain; }
  var cb = g.combo; if (g.time - cb.t <= 2) cb.n++; else cb.n = 1; cb.t = g.time; if (cb.n > (g.stats.maxCombo || 0)) g.stats.maxCombo = cb.n;
  if (cb.n >= 5 && cb.n % 5 === 0) { var bn = 2 + Math.floor(cb.n / 5) + (g.mods.comboOilAdd || 0); g.oil += bn; g.stats.oilEarned += bn; emit(g, { t: 'combo', n: cb.n, bonus: bn, x: e.x, y: e.y }); }
  g.stats.kills++; if (e.lit || e.vis) g.stats.killsLit++; g.stats.killsBy[e.def] = (g.stats.killsBy[e.def] || 0) + 1;
  if (e.boss) g.stats.bossKilled[e.def] = 1;
  emit(g, { t: 'kill', def: e.def, x: e.x, y: e.y, lit: e.vis, oil: gain, boss: e.boss, id: e.id });
  waveDone(g, e); kidDone(g, e);
}
function kidDone(g, e) {
  if (!e.kid) return; g.kidsLeft--;
  if (g.kidsLeft <= 0 && g.whale === 'kids') {
    g.whale = 'p2'; var b = addEnemy(g, 'B4', { wave: e.wave, pathIdx: e.pathIdx, d: 0, hp: Math.round(DATA.BALANCE.whaleP2 * (g.dawn ? 0.9 : 1)) });
    b.phase2 = true; b.bt = 0; emit(g, { t: 'bossPhase', def: 'B4', form: 'p2', x: b.x, y: b.y });
  }
}
function leak(g, e) {
  if (!e.alive) return; e.alive = false; g.stats.leaks++; g.stats.leakBy[e.def] = (g.stats.leakBy[e.def] || 0) + 1; waveDone(g, e); kidDone(g, e);
  var dmg = g.safe ? 0 : e.leak; if (!g.cheatInvuln) g.base.hp -= dmg;
  emit(g, { t: 'leak', dmg: dmg, def: e.def, x: e.x, y: e.y });
  if (g.base.hp <= 0) { g.base.hp = 0; g.phase = 'LOSE'; emit(g, { t: 'lose' }); }
}

/* ---- タワー ---- */
function pick(g, tw, L, d) {
  var best = null, bs = 0, i, e, rg = L.range + ((g.cardRange && (tw.def === 'T1' || tw.def === 'T4')) ? g.cardRange : 0), r2 = rg * rg;
  for (i = 0; i < g.enemies.length; i++) {
    e = g.enemies[i]; if (!e.alive || !e.vis) continue; if (e.flying && !d.air) continue;
    var dx = e.x - tw.x, dy = e.y - tw.y; if (dx * dx + dy * dy > r2) continue;
    var s = tw.prio === 'weak' ? -e.hp : tw.prio === 'strong' ? e.hp : -e.remain;
    if (!best || s > bs) { best = e; bs = s; }
  }
  return best;
}
function fireTower(g, tw, dt) {
  var d = T[tw.def], L = LV(tw), i, e, k;
  if (d.support || tw.off || tw.auto) return;
  if (d.beam) {
    tw.hitT -= dt; if (tw.hitT > 0) return; tw.hitT += B.beamIv; var hits = 0, list = [];
    for (i = 0; i < g.enemies.length; i++) { e = g.enemies[i]; if (e.alive && inBeam(tw, e.x - tw.x, e.y - tw.y)) list.push(e); }
    for (i = 0; i < list.length; i++) { hits++; damage(g, list[i], L.atk * tw.buff * (g.cardAtk.T8 || 1), { k: 'T8' }); }
    if (hits > g.stats.maxBeam) g.stats.maxBeam = hits; if (hits) emit(g, { t: 'beam', x: tw.x, y: tw.y, n: hits }); return;
  }
  tw.cd -= dt; if (tw.cd > 0) return;
  var tg = pick(g, tw, L, d); if (!tg) { tw.cd = 0; return; }
  tw.cd = Math.max(tw.cd, -dt) + L.iv * ((tw.def === 'T2' && (tw.syn & 1)) ? B.synIv : 1); var atk = L.atk * tw.buff * (g.cardAtk[tw.def] || 1), tx = tg.x, ty = tg.y; if (g.mods.braveAtk && g.base.hp <= 5) atk *= 1.15; if (tw.def === 'T2' && g.mods.t2First && !tw.fd) { tw.fd = true; atk *= 2; }
  emit(g, { t: 'fire', def: tw.def, x: tw.x, y: tw.y, tx: tx, ty: ty, lv: tw.lv, tid: tw.id });
  if (tw.def === 'T1') damage(g, tg, atk, { k: 'T1' });
  else if (tw.def === 'T2') {
    damage(g, tg, atk, { k: 'T2', pierce: true, sp: L.shieldPierce });
    if (L.pierce > 1) {
      var ang = Math.atan2(ty - tw.y, tx - tw.x), c = Math.cos(ang), s = Math.sin(ang), bestE = null, bd = 1e9;
      for (i = 0; i < g.enemies.length; i++) { e = g.enemies[i]; if (!e.alive || !e.vis || e === tg) continue; if (e.flying && !d.air) continue;
        var dx = e.x - tw.x, dy = e.y - tw.y, a = dx * c + dy * s, p = Math.abs(-dx * s + dy * c);
        if (a > 0 && a <= L.range + 1 && p <= 0.5) { var dd = Math.abs(a - Math.hypot(tx - tw.x, ty - tw.y)); if (dd < bd) { bd = dd; bestE = e; } } }
      if (bestE) { damage(g, bestE, atk * 0.85, { k: 'T2', pierce: true, sp: L.shieldPierce }); emit(g, { t: 'fire', def: 'T2', x: tx, y: ty, tx: bestE.x, ty: bestE.y, lv: tw.lv, tid: tw.id, sub: true }); }
    }
  } else if (tw.def === 'T3') {
    var br = L.blast + g.cardBlast, list2 = [];
    for (i = 0; i < g.enemies.length; i++) { e = g.enemies[i]; if (e.alive && !e.flying && Math.hypot(e.x - tx, e.y - ty) <= br) list2.push(e); }
    emit(g, { t: 'blast', x: tx, y: ty, r: br });
    for (i = 0; i < list2.length; i++) { e = list2[i]; damage(g, e, atk * (((tw.syn & 2) && e.slowT > 0) ? B.synBlast : 1), { k: 'T3' }); if (e.alive && L.stun && !e.stunImmune) e.stunT = Math.max(e.stunT, L.stun); }
  } else if (tw.def === 'T4') {
    damage(g, tg, atk, { k: 'T4' });
    if (tg.alive) {
      var mm = 1 - L.slow; if (tg.slowT <= 0 || mm <= tg.slowM) { tg.slowM = mm; tg.slowT = (L.slowDur || 2) + (g.mods.slowDurAdd || 0); }
      if (L.freeze && !tg.stunImmune && g.rng() < L.freeze) { tg.stunT = Math.max(tg.stunT, 1); g.stats.freezes++; emit(g, { t: 'freeze', x: tg.x, y: tg.y }); }
    }
  } else if (tw.def === 'T5') {
    var hit = [tg], cur = tg, mult = 1, dmgTo = [];
    var chN = L.chain + ((tw.syn & 4) ? 1 : 0), chD = B.chainDist + ((tw.syn & 4) ? B.synChainD : 0);
    while (hit.length < chN) {
      var nb = null, nd = chD + 1e-9;
      for (i = 0; i < g.enemies.length; i++) { e = g.enemies[i]; if (!e.alive || !e.vis || hit.indexOf(e) >= 0) continue; if (e.flying && !d.air) continue;
        var dd2 = Math.hypot(e.x - cur.x, e.y - cur.y); if (dd2 < nd) { nd = dd2; nb = e; } }
      if (!nb) break; hit.push(nb); cur = nb;
    }
    if (hit.length > g.stats.maxChain) g.stats.maxChain = hit.length;
    var pts = []; for (k = 0; k < hit.length; k++) pts.push(hit[k].x, hit[k].y);
    emit(g, { t: 'chain', pts: [tw.x, tw.y].concat(pts) });
    for (k = 0; k < hit.length; k++) { damage(g, hit[k], atk * mult, { k: 'T5' }); mult *= B.chainFalloff; }
  }
}

/* ---- 勝敗・波の締め ---- */
function checkWaves(g) {
  var n, wi, done = true;
  for (n = 1; n <= g.wave; n++) {
    wi = g.waveInfo[n]; if (!wi) continue;
    if (!wi.paid && wi.remaining <= 0 && g.time >= wi.lastAt) {
      wi.paid = true; var b = g.stage.waveBonus; g.oil += b; g.stats.oilEarned += b; emit(g, { t: 'waveClear', n: n, bonus: b });
    }
    if (!wi.paid) done = false;
  }
  if (g.phase === 'RUN' && g.wave >= g.totalWaves && done && g.spawnQ.length === 0 && g.kidsLeft <= 0 && g.whale !== 'kids' && g.enemies.every(function (e) { return !e.alive; })) {
    g.phase = 'WIN'; emit(g, { t: 'win' });
  }
}

/* ---- ステップ ---- */
function step(g, dt) {
  if (g.phase === 'WIN' || g.phase === 'LOSE') return;
  g.tick++;
  if (g.phase !== 'PREP') g.time += dt;
  if (g.bellT > 0) g.bellT -= dt; if (g.flashCd > 0) g.flashCd -= dt; for (var fi = g.flashes.length - 1; fi >= 0; fi--) { g.flashes[fi].t += dt; if (g.flashes[fi].t >= g.flashes[fi].dur) g.flashes.splice(fi, 1); }
  if (g.phase === 'RUN') updateSpawns(g);
  updateEvents(g, dt); computeGlobals(g); computeLights(g, dt);
  moveEnemies(g, dt);
  if (g.phase === 'LOSE') return;
  evalLit(g, dt);
  for (var i = 0; i < g.towers.length; i++) fireTower(g, g.towers[i], dt);
  if (g.phase === 'RUN') checkWaves(g);
  // 掃除
  var arr = g.enemies, w = 0; for (i = 0; i < arr.length; i++) if (arr[i].alive) arr[w++] = arr[i]; arr.length = w;
}

/* ---- コマンド ---- */
function sellValue(g, tw) { return Math.floor(tw.invested * ((g.time - tw.built) <= B.sellFullSec ? 1 : B.sellRate)); }
function upgradeCost(tw) { return tw.lv >= 3 ? null : T[tw.def].lv[tw.lv + 1].up; }
function exec(g, c) {
  var tw, i, d;
  if (g.phase === 'WIN' || g.phase === 'LOSE') return { ok: false, reason: 'end' };
  switch (c.c) {
    case 'build': {
      var slot = g.slots[c.slot]; d = T[c.def];
      if (!slot || !d) return { ok: false, reason: 'slot' }; if (slot.tower) return { ok: false, reason: 'occupied' }; if (slot.blocked) return { ok: false, reason: 'blocked' };
      if (g.stage.towers.indexOf(c.def) < 0) return { ok: false, reason: 'locked' };
      if (g.banned.indexOf(c.def) >= 0) return { ok: false, reason: 'banned' };
      if (c.def === 'T7') { if (slot.noPump) return { ok: false, reason: 'nopump' }; var n7 = 0; g.towers.forEach(function (t) { if (t.def === 'T7') n7++; }); if (n7 >= B.pumpMax) return { ok: false, reason: 'pumpmax' }; }
      if (g.oil < d.cost) return { ok: false, reason: 'oil' };
      g.oil -= d.cost; g.stats.oilSpent += d.cost;
      tw = { id: g.nextId++, def: c.def, lv: 0, slot: slot, x: slot.x, y: slot.y, cd: 0, hitT: B.beamIv, angle: (g.towers.length * 1.3) % 6.28, invested: d.cost, built: g.time, prio: 'first', R: 0, buff: 1, mAdd: 0, off: false, auto: false, snuffT: 0, gustT: 0, br: null, syn: 0, upDisc: 0, aim: 0, rel: 0 };
      if (c.def === 'T6') tw.aim = ((Math.round(Math.atan2(g.base.y - slot.y, g.base.x - slot.x) / (Math.PI / 4)) % 8) + 8) % 8;
      slot.tower = tw; g.towers.push(tw); g.stats.built[c.def] = (g.stats.built[c.def] || 0) + 1;
      emit(g, { t: 'build', def: c.def, x: slot.x, y: slot.y, id: tw.id }); computeLights(g, 0); return { ok: true, tower: tw };
    }
    case 'upgrade': {
      tw = g.towers.filter(function (t) { return t.id === c.id; })[0]; if (!tw) return { ok: false, reason: 'none' };
      var cost = upgradeCost(tw); if (cost == null) return { ok: false, reason: 'max' }; if (g.oil < cost) return { ok: false, reason: 'oil' };
      if (tw.lv === 2 && T[tw.def].lv3b) { if (c.br !== 'a' && c.br !== 'b') return { ok: false, reason: 'branch' }; tw.br = c.br; }
      g.lastUp = { id: tw.id, cost: cost, lv: tw.lv, br: tw.br, t: g.time }; if (!(tw.lv === 2 && T[tw.def].lv3b)) g.lastUp.br = tw.br;
      g.oil -= cost; g.stats.oilSpent += cost; tw.lv++; tw.invested += cost;
      if (tw.def === 'T7' && tw.lv === 3) { var p3 = 0; g.towers.forEach(function (t) { if (t.def === 'T7' && t.lv === 3) p3++; }); if (p3 > g.stats.pumpLv3) g.stats.pumpLv3 = p3; }
      emit(g, { t: 'upgrade', def: tw.def, x: tw.x, y: tw.y, lv: tw.lv, id: tw.id }); computeLights(g, 0); return { ok: true };
    }
    case 'sell': {
      tw = g.towers.filter(function (t) { return t.id === c.id; })[0]; if (!tw) return { ok: false, reason: 'none' };
      var v = sellValue(g, tw); g.oil += v; tw.slot.tower = null; g.towers.splice(g.towers.indexOf(tw), 1);
      emit(g, { t: 'sell', def: tw.def, x: tw.x, y: tw.y, value: v }); return { ok: true, value: v };
    }
    case 'prio': { tw = g.towers.filter(function (t) { return t.id === c.id; })[0]; if (!tw) return { ok: false }; tw.prio = c.mode; return { ok: true }; }
    case 'start': {
      if (g.phase === 'PREP') { startWave(g); return { ok: true }; }
      if (g.phase === 'RUN' && g.wave < g.totalWaves) {
        var wi = g.waveInfo[g.wave]; if (g.time < wi.lastAt) return { ok: false, reason: 'spawning' };
        if (g.time < g.nextWaveAt) { var early = B.earlyOil + (g.mods.earlyOilAdd || 0); g.oil += early; g.stats.oilEarned += early; g.stats.earlyCalls++; emit(g, { t: 'oil', delta: early, early: true }); }
        startWave(g); return { ok: true };
      }
      return { ok: false, reason: 'none' };
    }
    case 'undo': { var lu = g.lastUp; if (!lu) return { ok: false, reason: 'none' }; tw = g.towers.filter(function (t) { return t.id === lu.id; })[0]; if (!tw || tw.lv !== lu.lv + 1) { g.lastUp = null; return { ok: false, reason: 'none' }; }
      g.oil += lu.cost; g.stats.oilSpent -= lu.cost; tw.invested -= lu.cost; tw.lv = lu.lv; if (lu.lv === 2) tw.br = null; g.lastUp = null; computeLights(g, 0); emit(g, { t: 'undo', x: tw.x, y: tw.y }); return { ok: true }; }
    case 'flash': { if (g.phase !== 'RUN') return { ok: false, reason: 'none' }; if (g.flashCd > 0) return { ok: false, reason: 'cd' };
      g.flashes.push({ x: c.x, y: c.y, t: 0, dur: B.flashDur, r: B.flashR }); g.flashCd = B.flashCd - (g.mods.flashCdMinus || 0); g.stats.flashes = (g.stats.flashes || 0) + 1; emit(g, { t: 'flash', x: c.x, y: c.y }); return { ok: true }; }
    case 'pick': { var pk = g.pickups.filter(function (q) { return q.id === c.id; })[0]; if (!pk) return { ok: false, reason: 'none' }; g.pickups.splice(g.pickups.indexOf(pk), 1);
      if (pk.kind === 'star') { var gb = 8 + 2 * g.stage.id + (g.mods.starOilAdd || 0); g.oil += gb; g.stats.oilEarned += gb; g.stats.starsGot = (g.stats.starsGot || 0) + 1; emit(g, { t: 'picked', kind: 'star', x: pk.x, y: pk.y, v: gb }); }
      else { g.buffT = 20 + (g.mods.chestDurAdd || 0); g.stats.chests = (g.stats.chests || 0) + 1; emit(g, { t: 'picked', kind: 'chest', x: pk.x, y: pk.y }); } return { ok: true }; }
    case 'dim': { tw = g.towers.filter(function (t) { return t.id === c.id; })[0]; if (!tw || !T[tw.def].light) return { ok: false, reason: 'none' }; tw.off = !!c.on; if (!tw.off) tw.auto = false; computeLights(g, 0); return { ok: true }; }
    case 'aim': { tw = g.towers.filter(function (t) { return t.id === c.id; })[0]; if (!tw || tw.def !== 'T6') return { ok: false, reason: 'none' };
      tw.aim = c.rel != null ? (((tw.aim + c.rel) % 8) + 8) % 8 : ((c.dir % 8) + 8) % 8; computeLights(g, 0); return { ok: true }; }
    case 'card': {
      if (!g.offer || g.offer.ids.indexOf(c.id) < 0) return { ok: false, reason: 'offer' };
      if (g.pick && g.pick.id === 'C8' && g.pick.forWave === g.offer.forWave) return { ok: false, reason: 'locked' };
      if (g.pick && g.pick.id === c.id && g.pick.forWave === g.offer.forWave) { g.pick = null; return { ok: true, cleared: true }; }
      g.pick = { id: c.id, forWave: g.offer.forWave }; if (c.id === 'C8') { g.oil += B.cardOil8; g.stats.oilEarned += B.cardOil8; emit(g, { t: 'oil', delta: B.cardOil8 }); } return { ok: true };
    }
    case 'route': {
      if (g.paths.length < 2 || g.stage.tide) return { ok: false, reason: 'none' }; var okm = c.mode === 'mix'; for (i = 0; i < g.paths.length; i++) if (g.paths[i].id === c.mode) okm = true;
      if (!okm) return { ok: false, reason: 'none' }; g.route = c.mode; return { ok: true };
    }
    case 'bell': {
      if (!g.stage.bell) return { ok: false, reason: 'none' }; if (g.phase !== 'RUN') return { ok: false, reason: 'none' };
      if (g.bellWave === g.wave) return { ok: false, reason: 'used' }; if (g.oil < B.bellCost) return { ok: false, reason: 'oil' };
      g.oil -= B.bellCost; g.stats.oilSpent += B.bellCost; g.bellT = B.bellTime; g.bellWave = g.wave; emit(g, { t: 'bell' }); return { ok: true };
    }
  }
  return { ok: false, reason: 'cmd' };
}

/* ---- 照会ヘルパー ---- */
function lightPreview(g, defId, slot, lv) {
  var d = T[defId]; if (!d.light) return 0; var L = d.lv[lv || 0], add = 0, syn = 0;
  g.towers.forEach(function (t) { if (t.def === 'T6' && inFan(t, slot.x, slot.y)) add += T.T6.lv[t.lv].add * B.mirrorGain; if (defId === 'T1' && t.def === 'T1' && Math.hypot(t.x - slot.x, t.y - slot.y) <= g.synR) syn = 1; });
  if (add > 2) add = 2; return Math.max(0.3, (L.light + slot.bonus + add + (syn ? B.synLight : 0)) * g.lightMul + g.lightPlus - g.lightMinus);
}
function synPreview(g, defId, slot) {
  var out = { recv: [], give: [] }; g.towers.forEach(function (t) {
    if (Math.hypot(t.x - slot.x, t.y - slot.y) > g.synR) return;
    DATA.SYN.forEach(function (sy) {
      if (sy.from === t.def && (sy.recv === defId || (sy.recv === '*light' && T[defId].light))) out.recv.push({ id: t.id, name: sy.name });
      if (sy.from === defId && (sy.recv === t.def || (sy.recv === '*light' && T[t.def].light))) out.give.push({ id: t.id, name: sy.name });
    });
  }); return out;
}
function synList(g, tw) {
  var out = []; g.towers.forEach(function (o) {
    if (o === tw || Math.hypot(o.x - tw.x, o.y - tw.y) > g.synR) return;
    DATA.SYN.forEach(function (sy) {
      if (sy.from === o.def && (sy.recv === tw.def || (sy.recv === '*light' && T[tw.def].light))) out.push({ id: o.id, name: sy.name, dir: 'recv', x: o.x, y: o.y });
      if (sy.from === tw.def && (sy.recv === o.def || (sy.recv === '*light' && T[o.def].light))) out.push({ id: o.id, name: sy.name, dir: 'give', x: o.x, y: o.y });
    });
  }); return out;
}
function snapshot(g) {
  return JSON.stringify({ t: g.tick, oil: g.oil, hp: g.base.hp, w: g.wave, ph: g.phase, e: g.enemies.map(function (e) { return [e.id, Math.round(e.hp * 100), Math.round(e.x * 100), Math.round(e.y * 100)]; }), k: g.stats.kills });
}
function aliveCount(g) { var n = 0; for (var i = 0; i < g.enemies.length; i++) if (g.enemies[i].alive) n++; return n; }
function stars(hp) { return hp >= 16 ? 3 : hp >= 10 ? 2 : hp >= 1 ? 1 : 0; }

return { updateEvents: updateEvents, LV: LV, upkeepOf: upkeepOf, nextUpkeep: nextUpkeep, synPreview: synPreview, synList: synList, inFan: inFan, createGame: createGame, step: step, exec: exec, def: def, posAt: posAt, sellValue: sellValue, upgradeCost: upgradeCost, lightPreview: lightPreview,
  snapshot: snapshot, aliveCount: aliveCount, stars: stars, effHp: effHp, mulberry32: mulberry32, DT: B.DT };
}
if (typeof module !== 'undefined' && module.exports) module.exports = factory;
else { root.Fog = root.Fog || {}; root.Fog.Engine = factory(root.Fog.DATA); }
})(typeof window !== 'undefined' ? window : this);
