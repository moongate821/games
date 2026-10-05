// game.js — 武器のない純粋なレース(資料 shiryou.txt の「No Weapons Rule」)
// 8台で3周。スリップストリーム・ブーストと熱の管理・ドリフト(ミニターボ)・加速帯・冷却帯・狭いゲート。敵は攻撃せず、ブロックと抜き返しだけ
// 人のプレイヤーは P(自機)と cam(視点)を切り替えて処理する。AI も同じ物理で走る
let state = 'title', mode = 'grid', modeT = 0, paused = false, demo = false, god = false;
let TRANS = 'MT';                 // 1人のときの変速の設定('MT' クラッチとギア / 'AT' 自動)
let P = null, PLAYERS = [], RACERS = [], ents = [], parts = [], rings = [];
let hitStop = 0, whiteFlash = 0, simT = 0, raceT = 0, fpsAvg = 16.7, fpsN = 0, cdLast = 0, resultT = 0, RESULT = null;
const LAPS = 3, START_I = 20, N_RACERS = 8;
const pulse = { up: false, down: false };   // 1人用(キーボードで押した瞬間)
const GEAR_TOP = [0, 95, 150, 200, 245, 285, 322];   // 各ギアの、回転の上限(13000rpm)での速さ km/h(基準のマシン)
const ACC = [0, 72, 52, 38, 29, 22, 17];             // 各ギアの加速(km/h/秒、トルク最大のとき)
const IDLE = 1300, REDLINE = 12000, LIMIT = 13000, KMH = 40;   // KMH: 1km/h = 40単位/秒
const TWO = () => PLAYERS.length > 1;
const gTop = g => GEAR_TOP[g] * P.bk.stat.top * (P.aiTop || 1);
const gAcc = g => ACC[g] * P.bk.stat.acc * (P.bk.awd && P.kmh < 160 ? 1.12 : 1);
function use(pl) { P = pl; cam = pl.cam; }
const fmtT = t => { if (t == null || !isFinite(t)) return '--:--.--'; const m = Math.floor(t / 60), s = t - m * 60; return String(m).padStart(2, '0') + ':' + s.toFixed(2).padStart(5, '0'); };
const AI_NAMES = ['VEGA', 'ORION', 'RAVEN', 'KESTREL', 'NOVA', 'SABLE', 'ZERO', 'MIRAGE', 'TALON', 'ECHO', 'VIPER', 'HALO'];

// ---------- 進み具合・保存 ----------
const PROG = (() => { try { return Object.assign({ unlocked: 0, best: {}, bestLap: {} }, JSON.parse(localStorage.getItem('nr_prog') || '{}')); } catch (_) { return { unlocked: 0, best: {}, bestLap: {} }; } })();
function saveProg() { try { localStorage.setItem('nr_prog', JSON.stringify(PROG)); } catch (_) {} }

function torque(r) { return r < 2000 ? 0.35 : r < 6000 ? 0.35 + (r - 2000) / 4000 * 0.45 : r < 11000 ? 0.8 + (r - 6000) / 5000 * 0.2 : 1 - (r - 11000) / 2000 * 0.15; }
function newRacer(cfg, idx) {
  const bk = bikeById(cfg.bike);
  return { idx, name: cfg.name, human: !!cfg.human, bot: !cfg.human, bk, trans: cfg.trans || 'AT', cam: { z: 0, x: 0, y: 0, pct: 0, shake: 0, tilt: 0 }, pulse: { up: false, down: false },
    pal: cfg.pal || bk.pal, iri: cfg.iri || bk.iri, glow: cfg.glow || bk.hi, aiTop: cfg.aiTop || 1, skill: cfg.skill || 1, laneBias: cfg.laneBias || 0, blockK: cfg.block || 0, padIndex: null,
    z: 0, x: 0, vx: 0, y: 0, vy: 0, air: false, kmh: 0, rpm: IDLE, rpmFree: IDLE, gear: 0, clutch: 1, engine: true, stallT: 0, knock: 0, limT: 0, shiftT: 0,
    heat: 0, over: 0, boostOn: false, slip: 0, slipT: 0, turbo: 0, drifting: false, driftDir: 0, driftT: 0, spinT: 0, onCool: false,
    slideT: 0, slideMax: 0, slideDir: 1, lean: 0, yaw: 0, dist: 0, lap: 1, lapStart: 0, lapTimes: [], bestLap: null, finished: false, finishT: null, pos: idx + 1,
    trail: [], msgs: [], thr: 0, brk: 0, steer: 0, clutchIn: false, grind: 0, invuln: 0, hitFlash: 0 };
}
function msg(txt, col, big, t) { if (!P.human && !P.camFollow) return; P.msgs.push({ txt, col: col || [255, 255, 255], big: !!big, t: t || 1.6, max: t || 1.6 }); if (P.msgs.length > 4) P.msgs.shift(); }
function msgAll(txt, col, big, t) { const keep = P; for (const p of PLAYERS) { P = p; msg(txt, col, big, t); } P = keep; }

// ---------- 入力 ----------
const blankInput = () => ({ thr: 0, brk: 0, steer: 0, boost: false, clutch: false, up: false, down: false, drift: false });
function merge(r, g) { r.thr = Math.max(r.thr, g.thr); r.brk = Math.max(r.brk, g.brk); if (Math.abs(g.steer) > Math.abs(r.steer)) r.steer = g.steer; r.boost = r.boost || g.boost; r.clutch = r.clutch || g.clutch; r.up = r.up || g.up; r.down = r.down || g.down; r.drift = r.drift || g.drift; }
// 2人のときのキーボード: P1 は左側(WASD)、P2 は右側(矢印 + IJKLM)
const KEY2 = [
  { thr: 87, brk: 83, left: 65, right: 68, boost: 70, drift: 71, clutch: 82, up: 84, down: 86 },   // W S A D / F ブースト G ドリフト / R クラッチ T 上げ V 下げ
  { thr: 38, brk: 40, left: 37, right: 39, boost: 75, drift: 76, clutch: 74, up: 73, down: 77 },   // ↑ ↓ ← → / K ブースト L ドリフト / J クラッチ I 上げ M 下げ
];
function readInput(idx) {
  const r = blankInput();
  if (!TWO()) {
    r.up = pulse.up; r.down = pulse.down; pulse.up = pulse.down = false;
    if (keyIsDown(38)) r.thr = 1; if (keyIsDown(40)) r.brk = 1;
    if (keyIsDown(37)) r.steer -= 1; if (keyIsDown(39)) r.steer += 1;
    if (keyIsDown(66) || keyIsDown(16) || keyIsDown(32)) r.boost = true; if (keyIsDown(67)) r.clutch = true; if (keyIsDown(83) || keyIsDown(88)) r.drift = true;
    const g = readGamepad(); if (g.connected) { merge(r, g); P.padIndex = g.index; }
    const t = readTouch(); if (t.active) merge(r, t);
    return r;
  }
  const K = KEY2[idx], pl = P;
  r.up = pl.pulse.up; r.down = pl.pulse.down; pl.pulse.up = pl.pulse.down = false;
  if (keyIsDown(K.thr)) r.thr = 1; if (keyIsDown(K.brk)) r.brk = 1; if (keyIsDown(K.left)) r.steer -= 1; if (keyIsDown(K.right)) r.steer += 1;
  if (keyIsDown(K.boost)) r.boost = true; if (keyIsDown(K.drift)) r.drift = true; if (keyIsDown(K.clutch)) r.clutch = true;
  const pads = connectedPads(), pad = pads.length >= 2 ? pads[idx] : pads.length === 1 && idx === 1 ? pads[0] : null;   // コントローラーが2つなら1人1つ、1つなら P2 が使う
  if (pad) { const g = readPad(pad, 'p' + idx); merge(r, g); pl.padIndex = pad.index; }
  return r;
}
function aheadCurve(z, a, b) { let s = 0, n = 0; for (let d = a; d <= b; d += SEG_L * 2) { s += segAt(z + d).curve; n++; } return s / n; }
function aiInput() {   // AI(とデモの自機): 走行ライン・加速帯・障害物・スリップストリーム・追い越し・ブロック・ブースト・ドリフト
  const r = blankInput(), me = P; r.thr = 1;
  const c1 = aheadCurve(me.z, 1500, 5000), cNear = aheadCurve(me.z, 400, 2200);
  let target = clamp(c1 * 0.14 + me.laneBias, -0.75, 0.75);   // カーブの内側を通る
  for (let d = 1200; d < 5200; d += SEG_L) { const s = segAt(me.z + d); if (s.pad && me.skill > 0.9) { target = lerp(target, s.pad.x, 0.8); break; } }   // 加速帯を狙う
  // ほかのマシン: 後ろにつく(スリップストリーム)→ 近づいたら横へ出て抜く
  let ahead = null, ad = 1e9;
  for (const o of RACERS) { if (o === me) continue; const dz = relZ(o.z, me.z); if (dz > 0 && dz < 2000 && Math.abs(o.x - me.x) < 0.35 && dz < ad) { ad = dz; ahead = o; } }
  if (ahead) { if (ad > 900 && ahead.kmh > me.kmh - 15) target = lerp(target, ahead.x, 0.7); else { const l = ahead.x - 0.36, rr = ahead.x + 0.36; target = Math.abs(l) < Math.abs(rr) ? l : rr; } }   // 広い側から抜く
  // ブロック: 人のプレイヤーが真後ろに来たら、進路をふさぐ
  if (me.blockK > 0) for (const h of PLAYERS) { if (h === me || !h.human) continue; const dz = relZ(me.z, h.z); if (dz > 200 && dz < 1500 && Math.abs(h.x - me.x) < 0.4) target = lerp(target, h.x, me.blockK); }
  target = clamp(target, -0.88, 0.88);   // 壁に寄りすぎない
  const wantDrift = Math.abs(cNear) > 3.2 && me.kmh > 170 && me.skill > 0.95;   // 急なカーブでは、ドリフト
  { const g0 = me.bk.stat.grip, spd = me.kmh / 300, dr = me.drifting ? 0.3 : 1, ff = segAt(me.z).curve * spd * spd * 0.22 / g0 * dr / (1.9 * g0 * Math.min(1, 0.25 + spd));   // 遠心力を先に打ち消す(先読みの舵)
    if (Math.abs(cNear) > 2) target = lerp(target, clamp(cNear * 0.14, -0.7, 0.7), 0.4);   // 急なカーブでは、内側を優先
    for (const e of ents) {   // 障害物(ゲートの壁)をよける: 最後に決める。上手な AI は、内側の狭いゲート(加速帯)を狙う
      if (e.t !== 'barrier') continue; const dz = relZ(e.z, me.z); if (dz < -100 || dz > 3000 + me.kmh * KMH * 0.7) continue;
      const l = e.x - e.w - 0.15, rr = e.x + e.w + 0.15, gapIn = e.x > 0 ? rr : l, gapOut = e.x > 0 ? l : rr;
      if (Math.abs(target - e.x) < e.w + 0.12 || Math.abs(me.x - e.x) < e.w + 0.1) target = me.skill > 1.0 && Math.abs(gapIn) < 1.05 ? clamp(gapIn, -1.02, 1.02) : gapOut;
    }
    r.steer = clamp((target - me.x) * 4.5 + ff - (me.drifting ? me.driftDir * 0.28 : 0), -1, 1);
    if (wantDrift) { r.drift = true; if (!me.drifting && Math.abs(r.steer) < 0.35) r.steer = Math.sign(cNear) * 0.4; } }
  // ブーストと熱: 直線で使い、熱くなりすぎる前にやめる
  const straight = Math.abs(cNear) < 1.6 && Math.abs(c1) < 2.4;
  r.boost = mode === 'race' && straight && me.over <= 0 && me.kmh > 140 && me.heat < (me.boosting ? 84 : 52) * me.skill;
  me.boosting = r.boost;
  const gr = me.bk.stat.grip, need = Math.abs(cNear) * (me.kmh / 300) ** 2 * 0.22 / gr * (r.drift ? 0.3 : 1);   // このカーブを曲がり切れるか
  if (need > 1.55 * gr) { r.thr = 0.35; r.boost = false; } if (need > 1.85 * gr) r.brk = 0.5;
  // 大きく先行したら少し緩め、遅れたら少しだけ速く(ほどよい競り合い)
  const hp = PLAYERS.find(h => h.human && !h.finished);
  if (hp && !me.human) { const gap = me.dist - hp.dist; me.aiTop = me.baseTop * (gap > 12000 ? 0.88 : gap > 4000 ? 0.93 : gap > 1500 ? 0.97 : gap < -8000 ? 1.06 : 1); }
  if (me.trans === 'MT') {   // デモの自機が MT のとき
    const wr = me.gear ? me.kmh / gTop(me.gear) * LIMIT : 0, wantUp = me.engine && (me.gear === 0 || (wr > 12200 && me.gear < 6)), wantDown = me.engine && me.gear > 1 && wr < 4200;
    if (mode === 'grid') r.clutch = true;
    if (wantUp || wantDown) { r.clutch = true; if (me.clutch < 0.1) { if (wantUp) r.up = true; else r.down = true; } }
  } else if (me.gear === 0) r.up = true;
  return r;
}

// ---------- マシン: エンジンと変速 ----------
function shift(dir) {
  if (!P.engine) return;
  const ng = clamp(P.gear + dir, 0, 6); if (ng === P.gear) return;
  if (P.trans === 'MT' && P.clutch > 0.35) {   // クラッチを切らずに変速: ギア鳴り、大きく減速
    P.kmh *= 0.72; P.grind = 0.35; cam.shake = Math.max(cam.shake, 14); SND.se('grind'); rumble(0.9, 0.6, 260); msg('MISS SHIFT', [255, 80, 60], true); return;
  }
  P.gear = ng; if (P.human) SND.se('shift');
  if (P.trans === 'AT') P.shiftT = 0.26;
  if (ng > 0) { const wr = P.kmh / gTop(ng) * LIMIT; if (wr > LIMIT * 1.12 && P.trans === 'MT') { P.kmh = gTop(ng) * 1.08; cam.shake = Math.max(cam.shake, 8); SND.se('overrev'); msg('OVER REV', [255, 140, 40]); } }
}
function stepEngine(dt, inp) {
  const racing = mode === 'race' || mode === 'finish', thr = mode === 'grid' ? inp.thr : racing ? inp.thr : 0;
  P.thr = thr; P.brk = inp.brk;
  let acc = 0;
  if (!P.engine) {   // エンスト: 少しすると N に戻して、再始動
    P.stallT += dt; P.rpm = Math.max(0, P.rpm - 9000 * dt); P.rpmFree = P.rpm;
    if (P.stallT > 0.9) { P.engine = true; P.gear = 0; P.rpm = P.rpmFree = IDLE; if (P.human) SND.se('start'); msg(P.trans === 'MT' ? 'RESTART — クラッチを押して1速へ' : 'RESTART', [120, 255, 200]); }
  } else if (P.trans === 'AT') {
    if (P.gear === 0 && thr > 0.1 && mode !== 'grid') P.gear = 1;
    P.shiftT = Math.max(0, P.shiftT - dt);
    const wr = P.gear ? P.kmh / gTop(P.gear) * LIMIT : 0;
    if (P.gear && wr > 12300 && P.gear < 6 && P.shiftT <= 0) shift(1);
    else if (P.gear > 1 && wr < 5200 && P.shiftT <= 0) shift(-1);
    const w2 = P.gear ? P.kmh / gTop(P.gear) * LIMIT : 0;
    if (P.gear === 0) { P.rpmFree += (IDLE + thr * 11000 - P.rpmFree) * Math.min(1, dt * 6); P.rpm = P.rpmFree; }
    else if (P.kmh < 30) { P.rpm = Math.max(w2, 3200 + thr * 3500); acc = gAcc(1) * torque(P.rpm) * thr; }   // 自動の半クラッチ発進
    else { P.rpm = w2; acc = P.shiftT > 0 ? 0 : gAcc(P.gear) * torque(P.rpm) * thr * 0.94; }
    P.clutch = 1;
  } else {
    // MT: クラッチの踏み込み(0=切れている、1=つながっている)
    P.clutchIn = inp.clutch;
    P.clutch = inp.clutch ? Math.max(0, P.clutch - dt / 0.08) : Math.min(1, P.clutch + dt / 0.35);
    P.rpmFree += (IDLE + thr * (LIMIT + 600 - IDLE) - P.rpmFree) * Math.min(1, dt * (thr > 0.1 ? 5 : 3));
    if (P.gear === 0 || P.clutch < 0.05) { P.rpm = P.rpmFree; }
    else {
      const wr = P.kmh / gTop(P.gear) * LIMIT, e = P.clutch;
      P.rpm = lerp(P.rpmFree, wr, e);
      const slipping = P.gear <= 2 && thr > 0.2 && wr < 3000 && e > 0.05;   // 発進: アクセルを開けていれば、クラッチが滑って回転を保つ(半クラッチ)
      if (slipping) { P.rpm = Math.max(wr, 2600 + thr * 3200 * Math.min(1, e + 0.3)); P.rpmFree = P.rpm; acc = gAcc(P.gear) * torque(P.rpm) * thr * e; }
      else {
        P.rpmFree = lerp(P.rpmFree, P.rpm, Math.min(1, e * dt * 12));
        const slipR = P.rpmFree > wr ? P.rpmFree : P.rpm;   // 半クラッチ: エンジンの方が速く回っていれば、その力で押し出す
        acc = gAcc(P.gear) * torque(slipR) * thr * e;
        if (thr < 0.1) acc -= (P.rpm / LIMIT) * gAcc(P.gear) * 0.4 * e;   // エンジンブレーキ
        if (e > 0.92 && P.rpm < 2100 && P.kmh > 1) { acc *= 0.3; P.knock += dt; if (P.knock > 0.14) { P.knock = 0; cam.shake = Math.max(cam.shake, 6); P.kmh *= 0.94; if (P.human) SND.se('knock'); } }   // ノッキング(ガックン)
        if (e > 0.95 && P.rpm < 900 && mode !== 'grid') { P.engine = false; P.stallT = 0; P.kmh *= 0.85; SND.se('stall'); rumble(0.7, 0.3, 300); msg('ENGINE STALL', [255, 70, 70], true); }
      }
    }
  }
  // 回転の上限(頭打ち): 点火を切って、加速しない
  if (P.rpm >= LIMIT && P.engine) { if (acc > 0) acc = 0; P.limT += dt; P.rpm = LIMIT - (Math.sin(P.limT * 60) > 0 ? 0 : 400); } else P.limT = 0;
  // ブーストと熱: 使うと熱がたまり、限界でオーバーヒート。アクセルを抜く・冷却帯を走ると冷える
  const S = P.bk.stat;
  P.boostOn = inp.boost && P.over <= 0 && P.engine && P.kmh > 40 && racing;
  let capAdd = 0;
  if (P.boostOn) { acc += 60 * S.boost; capAdd += 50 * S.boost; P.heat += 25 / S.heat * dt; cam.shake = Math.max(cam.shake, 2.5); }
  else P.heat -= (8 + (thr < 0.2 ? 18 : 0) + (P.onCool ? 50 : 0)) * dt;
  if (P.rpm > REDLINE && P.engine) P.heat += 4 / S.heat * dt;
  if (P.heat >= 100 && P.over <= 0) { P.over = 2.6; P.heat = 100; if (P.human) { SND.se('overheat'); rumble(0.6, 0.6, 400); } msg('OVERHEAT', [255, 80, 40], true, 2); }
  if (P.over > 0) { P.over -= dt; acc *= 0.55; capAdd -= 45; if (Math.random() < 0.5) smoke(P); if (P.over <= 0) P.heat = 55; }
  P.heat = clamp(P.heat, 0, 100);
  // ミニターボ(ドリフトの後・加速帯)とスリップストリーム
  if (P.turbo > 0) { P.turbo -= dt; acc += 70; capAdd += 45; }
  const top = S.top * (P.aiTop || 1), cap = 330 * top + capAdd + P.slip * 22;
  const drag = (1.25e-4 * P.kmh * P.kmh / (top * top)) * (1 - 0.38 * P.slip) + 2 + (Math.abs(P.x) > 1 && !P.air ? 60 : 0);
  if (P.air) acc *= 0.2;
  P.kmh += (acc - drag - inp.brk * 150 - (P.grind > 0 ? 60 : 0) - (P.drifting ? 16 : 0)) * dt;
  P.grind = Math.max(0, P.grind - dt);
  if (mode === 'grid') P.kmh = 0;
  if (P.kmh > cap) P.kmh = Math.max(cap, P.kmh - 80 * dt);   // 上限を超えた分は、少しずつ落ちる(ターボが切れた後など)
  P.kmh = Math.max(0, P.kmh);
}

// ---------- マシン: 移動・ドリフト・ジャンプ ----------
function stepBike(dt, inp) {
  const spd = P.kmh / 300, s = segAt(P.z), gr = P.bk.stat.grip;
  let steer = inp.steer;
  if (P.spinT > 0) { P.spinT -= dt; steer = 0; P.yaw = Math.sin(P.spinT * 18) * 0.5 * P.spinT; }
  // ドリフト: 押したまま曲がると、横に滑りながら鋭く曲がる。長く滑るほど、抜けたときのミニターボが強い
  if (!P.drifting && inp.drift && Math.abs(steer) > 0.3 && P.kmh > 110 && !P.air && P.spinT <= 0 && P.slideT <= 0) { P.drifting = true; P.driftDir = Math.sign(steer); P.driftT = 0; if (P.human) SND.se('slide'); }
  if (P.drifting) {
    P.driftT += dt;
    const lvl = P.driftT > 1.6 ? 2 : P.driftT > 0.7 ? 1 : 0;
    if (Math.random() < 0.7) sparks(P.z - 200, P.x * ROAD_W - P.driftDir * 90, 5, 1, lvl === 2 ? [255, 150, 40] : lvl === 1 ? [80, 180, 255] : [255, 230, 180], 0.3);
    if (!inp.drift || P.kmh < 90 || P.air) {
      P.drifting = false;
      if (lvl > 0) { P.turbo = Math.max(P.turbo, lvl === 2 ? 1.2 : 0.6); if (P.human) SND.se('turbo'); msg(lvl === 2 ? 'SUPER TURBO' : 'TURBO', lvl === 2 ? [255, 170, 60] : [120, 200, 255]); }
    }
  }
  const drift = P.drifting ? 1 : 0, grip = P.air ? 0.45 : 1;
  const tv = (steer * (drift ? 1.25 : 1) + (drift ? P.driftDir * 0.35 : 0)) * 1.9 * gr * Math.min(1, 0.25 + spd) * grip;
  P.vx += (tv - P.vx) * Math.min(1, dt * (P.air ? 2 : 7 * gr));
  P.x += P.vx * dt;
  if (!P.air) P.x -= s.curve * spd * spd * 0.22 / gr * (drift ? 0.3 : 1) * dt;   // カーブの遠心力(ドリフト中は弱い)
  const yawT = drift ? P.driftDir * (0.45 + 0.2 * Math.min(1, P.driftT)) : 0;
  if (P.slideT > 0) {   // 決勝線を越えた後の、金田のスライド停止
    P.slideT -= dt; const ph = 1 - P.slideT / P.slideMax;
    P.yaw = P.slideDir * 1.25 * Math.sin(Math.min(1, ph * 1.4) * Math.PI / 2) * (ph > 0.78 ? (1 - ph) / 0.22 : 1);
    P.x += P.slideDir * 0.5 * (1 - ph) * dt; P.kmh = Math.max(0, P.kmh - 220 * dt);
    if (Math.random() < 0.6) for (const [ox, oz] of [[-60, -210], [60, -210], [0, 210]]) sparks(P.z + oz * Math.cos(P.yaw), P.x * ROAD_W + ox + Math.sin(P.yaw) * oz, 5, 1, [255, 200, 120], 0.35);
    if (P.slideT <= 0) P.yaw = 0;
  } else if (P.spinT <= 0) P.yaw += (yawT - P.yaw) * Math.min(1, dt * 8);
  // 路面: 加速帯・冷却帯
  P.onCool = !!(s.cool && Math.abs(P.x - s.cool.x) < s.cool.w + 0.04 && !P.air);
  if (s.pad && Math.abs(P.x - s.pad.x) < s.pad.w + 0.05 && !P.air && P.padSeg !== s.i) { P.padSeg = s.i; P.turbo = Math.max(P.turbo, 0.8); P.kmh += 25; if (P.human) { SND.se('pad'); cam.shake = Math.max(cam.shake, 4); } }
  // 道の端の、光の壁
  if (Math.abs(P.x) > 1.2) {
    P.wall = (P.wall || 0) + 1; P.x = Math.sign(P.x) * 1.2; P.vx = -Math.sign(P.x) * 0.6; P.kmh *= P.bk.runflat ? 0.95 : 0.9; cam.shake = Math.max(cam.shake, 7); P.drifting = false;
    sparks(P.z + 100, P.x * ROAD_W, 60, 10, SEC().road, 0.5); if (P.human) { SND.se('scrape'); rumble(0.4, 0.4, 120); }
  }
  // ジャンプ
  if (P.air) { P.vy -= 4200 * dt; P.y += P.vy * dt; if (P.y <= 0) { P.y = 0; P.vy = 0; P.air = false; cam.shake = Math.max(cam.shake, 10); if (P.human) { SND.se('land'); rumble(0.5, 0.4, 150); } sparks(P.z - 200, P.x * ROAD_W, 20, 12, [255, 220, 150], 0.4); } }
  P.lean += ((-P.vx * 0.33 / Math.sqrt(gr) * (P.bk.hover ? 0.4 : 1) - (P.air ? 0 : s.curve * spd * 0.05)) - P.lean) * Math.min(1, dt * 8);
  const dz = P.kmh * KMH * dt;
  P.z = wrapZ(P.z + dz); P.dist += dz;
  // 光の帯(テールランプの残光)
  const last = P.trail[P.trail.length - 1];
  if (!last || relZ(wrapZ(P.z - 360), last.z) > 70) P.trail.push({ z: wrapZ(P.z - 360), x: P.x + Math.sin(P.yaw) * -0.2, y: P.y });
  while (P.trail.length && relZ(P.trail[0].z, P.z) < -2400 * (P.bk.trailLen || 1)) P.trail.shift();
}
function startSlide(dir, dur) { P.slideT = P.slideMax = dur; P.slideDir = Math.sign(dir) || 1; P.drifting = false; if (P.human) SND.se('slide'); }
function smoke(pl) { parts.push({ z: wrapZ(pl.z - 250), x: pl.x * ROAD_W + rnd(-60, 60), y: 200, vz: pl.kmh * KMH * 0.9, vx: rnd(-300, 300), vy: rnd(300, 800), life: 0.6, max: 0.6, col: [150, 150, 160] }); }

// ---------- コースの仕掛け(加速帯・冷却帯・狭いゲート・ジャンプ台) ----------
function placeFeatures(sec) {
  const R = mulberry(9000 + sec.no * 31), N = track.length;
  ents = [];
  track[START_I].start = track[START_I + 1].start = true;
  let lastPad = 0, lastCool = 0, lastGate = 0, lastRamp = 0;
  for (let i = START_I + 60; i < N - 40; i++) {
    let mc = 0; for (let k = 0; k < 14; k++) mc = Math.max(mc, Math.abs(track[(i + k) % N].curve));
    if (mc < 0.6 && i - lastPad > 110 && R() < 0.05) {   // 直線に、加速帯を3枚
      const x = pick([-0.5, 0, 0.5]); for (let k = 0; k < 3; k++) track[i + k * 4].pad = { x, w: 0.2 }; lastPad = i;
    } else if (mc < 0.9 && i - lastCool > 240 && R() < 0.04) {   // 長い直線の端に、冷却帯
      const x = R() < 0.5 ? -0.62 : 0.62; for (let k = 0; k < 40 && i + k < N - 20; k++) track[i + k].cool = { x, w: 0.22 }; lastCool = i;
    } else if (Math.abs(track[(i + 10) % N].curve) > 3.0 * Math.max(0.8, sec.curvy) && i - lastGate > 160 && R() < 0.25) {   // 急カーブの内側に、狭いゲート(加速帯つき)
      const inside = Math.sign(track[(i + 10) % N].curve);   // 遠心力が外へ押すので、内側は +curve の向き
      ents.push({ t: 'barrier', z: (i + 2) * SEG_L, x: inside * 0.32, w: 0.42 });
      for (let k = 0; k < 3; k++) track[i + 2 + k * 3].pad = { x: inside * 0.87, w: 0.11 };
      lastGate = i;
    } else if (mc < 0.5 && i - lastRamp > 400 && R() < 0.02) { ents.push({ t: 'ramp', z: i * SEG_L, x: pick([-0.5, 0.5]) }); lastRamp = i; }
  }
}

// ---------- レースの開始・順位・周回 ----------
function startRace(cfgs, cIdx, isDemo) {
  courseIdx = cIdx; demo = !!isDemo;
  buildTrack(SEC()); placeFeatures(SEC());
  parts = []; rings = [];
  // 出走表: 人のプレイヤーは後ろの方から、AI は色違いのマシンで
  const humans = cfgs.map((c, i) => Object.assign({ human: !isDemo, name: 'P' + (i + 1), me: true }, c));
  const R = mulberry(777 + cIdx), diffK = 0.93 + cIdx * 0.0035, list = [];
  const aiBikes = ['kai', 'arc', 'nst', 'ngt'];
  let nameI = Math.floor(R() * AI_NAMES.length);
  for (let i = 0; i < N_RACERS - humans.length; i++) {
    const b = aiBikes[(i + cIdx) % 4], pv = AI_PALS[b], k = Math.floor(R() * 10);
    list.push({ bike: b, name: AI_NAMES[(nameI++) % AI_NAMES.length], trans: 'AT', pal: Object.assign({}, bikeById(b).pal || {}, pv[k % pv.length]), iri: b === 'ngt' ? AI_IRI[k % 2] : null, glow: AI_GLOW[b] ? AI_GLOW[b][k % 2] : null,
      aiTop: diffK * (0.985 + R() * 0.03) - (i > 4 ? 0.01 : 0), skill: 0.88 + R() * 0.2, laneBias: (R() - 0.5) * 0.4, block: R() < 0.5 ? 0.35 + R() * 0.3 : 0 });
  }
  const order = [...list.slice(0, 5), ...humans, ...list.slice(5)];
  RACERS = order.map((c, i) => { const r = newRacer(c, i); r.baseTop = r.aiTop; r.me = !!c.me; return r; });
  PLAYERS = RACERS.filter(r => r.me);
  if (isDemo) PLAYERS[0].camFollow = true;
  RACERS.forEach((r, i) => { const row = Math.floor(i / 2), col = i % 2; r.dist = -(420 + (N_RACERS / 2 - 1 - row) * 620); r.z = wrapZ(START_I * SEG_L + r.dist); r.x = col ? 0.36 : -0.36; r.cam.x = r.x * ROAD_W * 0.72; r.cam.z = wrapZ(r.z - PL_DIST); });
  use(PLAYERS[0]);
  mode = 'grid'; modeT = 0; raceT = 0; cdLast = -1; skyX = 0; RESULT = null;
  DRAW_N = lite ? 150 : TWO() ? 170 : 240;
  SND.setBgm('c' + SEC().no);
}
function updatePositions() {
  const sorted = [...RACERS].sort((a, b) => a.finished && b.finished ? a.finishT - b.finishT : a.finished ? -1 : b.finished ? 1 : b.dist - a.dist);
  sorted.forEach((r, i) => r.pos = i + 1);
  return sorted;
}
function lapCheck(r) {
  if (r.finished) return;
  const lapNow = Math.floor(r.dist / trackLen) + 1;
  if (lapNow > r.lap && r.dist > 0) {
    const lt = raceT - r.lapStart; r.lapTimes.push(lt); r.lapStart = raceT; if (r.bestLap == null || lt < r.bestLap) r.bestLap = lt;
    if (lapNow > LAPS) {
      r.finished = true; r.finishT = raceT; r.bot = true;
      const keep = P; use(r);
      if (r.human) { SND.se('finish'); msg('FINISH', [255, 230, 120], true, 3); msg(r.pos + (r.pos === 1 ? 'st' : r.pos === 2 ? 'nd' : r.pos === 3 ? 'rd' : 'th') + ' PLACE', [255, 255, 255], true, 3); startSlide(r.vx < 0 ? -1 : 1, 2.2); }
      use(keep);
    } else { r.lap = lapNow; if (r.human) { const keep = P; use(r); if (lapNow === LAPS) { msg('FINAL LAP', [255, 90, 90], true, 2.2); SND.se('finallap'); } else msg('LAP ' + lapNow + '   ' + fmtT(lt), [200, 240, 255], true, 2); use(keep); } }
  }
}
function slipstreams(dt) {   // 前のマシンの真後ろにつくと、空気の抵抗が減る
  for (const r of RACERS) {
    let best = 0;
    for (const o of RACERS) { if (o === r) continue; const dz = relZ(o.z, r.z); if (dz > 200 && dz < 1800 && Math.abs(o.x - r.x) < 0.13 && o.kmh > 120) best = Math.max(best, 1 - (dz - 200) / 1600); }
    if (best > 0) { r.slipT += dt; r.slip = Math.min(1, r.slip + dt * 1.2) * Math.min(1, best + 0.3); } else { r.slipT = 0; r.slip = Math.max(0, r.slip - dt * 2); }
    if (r.human && r.slip > 0.6 && Math.random() < 0.3) parts.push({ z: wrapZ(r.z + rnd(200, 900)), x: r.x * ROAD_W + rnd(-150, 150), y: rnd(80, 400), vz: r.kmh * KMH * 0.8, vx: 0, vy: 0, life: 0.25, max: 0.25, col: [200, 230, 255], air: true });
  }
}
function bumps() {   // マシンどうしのぶつかり合い(重いほど強い)。ダメージはない
  for (let i = 0; i < RACERS.length; i++) for (let j = i + 1; j < RACERS.length; j++) {
    const a = RACERS[i], b = RACERS[j], dz = relZ(b.z, a.z);
    if (Math.abs(dz) > 330 || Math.abs(a.x - b.x) > 0.11 || a.air || b.air) continue;
    const wa = a.bk.stat.weight, wb = b.bk.stat.weight, sd = Math.sign(a.x - b.x) || 1, k = wb / (wa + wb);
    if (Math.abs(dz) < 200 || Math.abs(a.x - b.x) > 0.06) { a.vx = sd * 0.9 * k * 2; b.vx = -sd * 0.9 * (1 - k) * 2; a.x += sd * 0.018 * k * 2; b.x -= sd * 0.018 * (1 - k) * 2; }
    else { const back = dz > 0 ? a : b, front = dz > 0 ? b : a; back.kmh = Math.min(back.kmh, front.kmh); back.vx += (back.x > front.x ? 1 : -1) * 0.9; }   // 追突: 後ろは前と同じ速さに落ち、横へ逃げる
    a.drifting = b.drifting = false;
    for (const r of [a, b]) if (r.human) { r.cam.shake = Math.max(r.cam.shake, 7); const k2 = P; P = r; rumble(0.5, 0.5, 120); P = k2; }
    if (a.human || b.human) { SND.se('clang', a); const k2 = P; P = a; sparks(a.z, (a.x + b.x) / 2 * ROAD_W, 150, 10, [255, 230, 180], 0.3); P = k2; }
  }
}
function contacts() {   // P と、コースの仕掛け
  for (const e of ents) {
    const dz = relZ(e.z, P.z), dx = Math.abs(e.x - P.x);
    if (e.t === 'ramp') { if (dz > -120 && dz < 200 && dx < 0.24 && !P.air && P.kmh > 60 && !P.bk.hover) { P.air = true; P.vy = 700 + P.kmh * 5; P.drifting = false; if (P.human) SND.se('jump'); } continue; }
    if (e.t === 'barrier') {
      if (Math.abs(dz) > 170 || dx > e.w + 0.06 || (P.air && P.y > 260) || P.spinT > 0) continue;
      P.crash = (P.crash || 0) + 1; P.kmh *= P.bk.runflat ? 0.72 : 0.5; P.spinT = P.bk.runflat ? 0.35 : 0.7; P.drifting = false; P.vx = Math.sign(P.x - e.x || 1) * 1.2; P.x = e.x + Math.sign(P.x - e.x || 1) * (e.w + 0.07);
      cam.shake = Math.max(cam.shake, 14); sparks(P.z, P.x * ROAD_W, 120, 24, [255, 210, 120], 0.5);
      if (P.human) { SND.se('crash'); rumble(1, 0.8, 300); msg('CRASH', [255, 90, 60], true); P.hitFlash = 0.3; }
    }
  }
}
function stepRace(dt) {
  modeT += dt;
  if (mode === 'grid') {   // 3つの赤いランプ → 緑で発進
    const n = Math.floor(modeT / 0.9);
    if (n !== cdLast && n <= 3) { cdLast = n; if (n < 3) SND.se('tick'); else SND.se('go'); }
    if (modeT > 3.6) { mode = 'race'; modeT = 0; raceT = 0; msgAll('GO!', [120, 255, 200], true, 1); if (!demo) for (const pl of PLAYERS) if (pl.trans === 'MT' && pl.gear === 0) { const k = P; P = pl; msg(TWO() ? 'クラッチを押しながら1速 → アクセル → クラッチを離す' : 'C を押しながら A で1速 → アクセル → C を離す', [180, 230, 255], false, 3.5); P = k; } }
  } else raceT += dt;
  for (const r of RACERS) lapCheck(r);
  updatePositions();
  if (mode === 'race' && PLAYERS.every(p => p.finished)) { mode = 'finish'; modeT = 0; }
  if (mode === 'finish' && modeT > 4.2 && !RESULT) endRace();
}
function endRace() {   // 結果: 走り終えていないマシンは、今の差から時間を見積もる
  const sorted = updatePositions();
  RESULT = sorted.map(r => ({ name: r.name, bike: r.bk, human: r.human, time: r.finished ? r.finishT : raceT + Math.max(0, (LAPS * trackLen - r.dist)) / Math.max(1, r.kmh * KMH), best: r.bestLap, pos: r.pos, idx: r.idx }));
  RESULT.sort((a, b) => a.time - b.time); RESULT.forEach((x, i) => x.pos = i + 1);
  if (!demo) {
    const key = SEC().no;
    for (const x of RESULT) if (x.human) {
      if (!PROG.best[key] || x.time < PROG.best[key]) PROG.best[key] = x.time;
      const r = RACERS[x.idx]; if (r.bestLap && (!PROG.bestLap[key] || r.bestLap < PROG.bestLap[key])) PROG.bestLap[key] = r.bestLap;
    }
    const bestHuman = Math.min(...RESULT.filter(x => x.human).map(x => x.pos));
    RESULT.cleared = bestHuman <= 3;
    if (RESULT.cleared && courseIdx >= PROG.unlocked && courseIdx < COURSES.length - 1) { PROG.unlocked = courseIdx + 1; RESULT.newCourse = true; }
    if (courseIdx === COURSES.length - 1 && bestHuman === 1 && unlockHidden('win30')) RESULT.secret = true;
    saveProg();
    state = 'result'; resultT = 0; SND.setBgm('result'); SND.se(RESULT.cleared ? 'clear' : 'over');
  } else if (state === 'title') titleDemo();
}
function step(dt) {
  simT += dt;
  for (const r of RACERS) {
    use(r);
    const inp = r.bot || demo ? aiInput() : readInput(PLAYERS.indexOf(r));
    if (inp.up && (mode !== 'grid' || P.trans === 'MT')) shift(1);
    if (inp.down) shift(-1);
    stepEngine(dt, inp); stepBike(dt, inp); contacts();
    P.hitFlash = Math.max(0, P.hitFlash - dt);
  }
  slipstreams(dt); bumps(); stepParts(dt); stepRace(dt);
  whiteFlash = Math.max(0, whiteFlash - dt * 1.5);
  // カメラ: 自機の後ろ上。横は少し遅れて追う
  PLAYERS.forEach((pl, i) => {
    for (const m of pl.msgs) m.t -= dt; pl.msgs = pl.msgs.filter(m => m.t > 0);
    const c = pl.cam; c.shake *= Math.pow(0.02, dt);
    c.z = wrapZ(pl.z - PL_DIST); c.x += (pl.x * ROAD_W * 0.72 - c.x) * Math.min(1, dt * 6);
    c.y = roadY(pl.z) + CAM_H + pl.y * 0.5; c.tilt += ((-pl.lean * 0.12) - c.tilt) * Math.min(1, dt * 4);
    SND.update({ rpm: pl.rpm, thr: pl.thr, engine: pl.engine, nitro: pl.boostOn || pl.turbo > 0, kmh: pl.kmh, limit: pl.limT > 0, slide: pl.drifting || pl.slideT > 0, vol: TWO() ? 0.7 : 1, intense: mode === 'race' && pl.lap === LAPS }, i);
  });
  // 近くのAIのエンジン音(ドップラー効果: 近づくと高く、離れると低く)と、すれ違いの風切り音
  if (PLAYERS[0]) {
    const me = PLAYERS[0]; let near = null, nd = 1e9;
    for (const r of RACERS) { if (PLAYERS.includes(r)) continue; const dz = relZ(r.z, me.z); if (Math.abs(dz) < nd) { nd = Math.abs(dz); near = r; } if (r._dzp != null && Math.sign(r._dzp) !== Math.sign(dz) && Math.abs(r.x - me.x) < 0.45 && Math.abs(dz) < 600 && mode !== 'grid') SND.se('whoosh', { z: r.z, x: r.x }); r._dzp = dz; }
    if (near) { const dz = relZ(near.z, me.z), v = (near.kmh - me.kmh) / 3.6 * (dz < 0 ? 1 : -1), dop = clamp(340 / (340 - clamp(v, -200, 200)), 0.6, 1.7); SND.update({ rpm: near.rpm * dop, thr: near.thr, engine: true, nitro: near.boostOn, kmh: 0, limit: false, slide: false, vol: clamp(1 - nd / 7000, 0, 1) * 0.55, pan: clamp((near.x - me.x) * 0.8, -1, 1) }, 2); }
  }
  use(PLAYERS[0] || RACERS[0]);
  skyX += segAt(P.z).curve * P.kmh * dt * 0.6;
}

// ---------- 火花 ----------
function sparks(z, wx, wy, n, col, life) {
  if (lite || TWO()) n = Math.ceil(n / 2);
  for (let i = 0; i < n; i++) parts.push({ z, x: wx, y: wy, vz: P.kmh * KMH * rnd(0.6, 1.0) + rnd(-2500, 2500), vx: rnd(-1800, 1800), vy: rnd(200, 2200), life: life * rnd(0.5, 1), max: life, col });
}
function stepParts(dt) {
  for (const p of parts) { p.z = wrapZ(p.z + p.vz * dt); p.x += p.vx * dt; p.y += p.vy * dt; if (!p.air) p.vy -= 3500 * dt; if (p.y < 0) { p.y = 0; p.vy *= -0.35; p.vx *= 0.6; } p.life -= dt; }
  parts = parts.filter(p => p.life > 0); if (parts.length > 700) parts.splice(0, parts.length - 700);
  for (const r of rings) { r.t += dt; r.r += (r.max - r.r) * Math.min(1, dt * 5); }
  rings = rings.filter(r => r.t < 0.7);
}

// ---------- 画面の流れ(車体 → コース → レース → 結果) ----------
let SEL_CFG = null;   // 選んだマシン(1人または2人)
function startFromSelect(cfgs) { SEL_CFG = cfgs; openCourse(); }
function beginRace(cIdx) { SND.resume(); SND.se('coin'); paused = false; startRace(SEL_CFG, cIdx, false); state = 'play'; clearFlightInput(); syncAppUI(true); }
function titleDemo() { const c = Math.floor(Math.random() * Math.min(COURSES.length, Math.max(3, PROG.unlocked + 1))); startRace([{ bike: pick(bikeList()).id, trans: 'AT' }], c, true); }
function resultAction(k) {   // 結果画面: next 次のコース / retry もう一度 / menu コース選び
  if (!RESULT) return;
  if (k === 'next' && RESULT.cleared && courseIdx < COURSES.length - 1) beginRace(courseIdx + 1);
  else if (k === 'retry' || k === 'next') beginRace(courseIdx);
  else openCourse();
}

// ---------- 車体選び(1人・2人・見るだけ) ----------
const SEL = { mode: 'view', who: 0, idx: [0, 0], pick: ['kai', 'kai'], trans: ['MT', 'MT'], code: [] };
const KONAMI = [38, 38, 40, 40, 37, 39, 37, 39];   // 隠しコマンド: ↑↑↓↓←→←→
function openSelect(m) {
  SEL.mode = m; SEL.who = 0; SEL.code = []; SEL.trans = [TRANS, TWO_P_OK ? 'AT' : TRANS];
  SEL.idx = [0, 1 % bikeList().length];
  state = 'select'; GAR.auto = true; GAR.A = 0.9; SND.resume(); SND.se('tick'); syncAppUI(true);
}
function selMove(d) { const n = bikeList().length; SEL.idx[SEL.who] = (SEL.idx[SEL.who] + d + n) % n; SND.se('tick'); GAR.A = 0.9; }
function selConfirm() {
  const b = bikeList()[SEL.idx[SEL.who]];
  if (SEL.mode === 'view') { exitSelect(); return; }
  SEL.pick[SEL.who] = b.id; SND.se('coin');
  if (SEL.mode === '2p' && SEL.who === 0) { SEL.who = 1; GAR.A = 0.9; return; }
  if (SEL.mode === '2p') startFromSelect([{ bike: SEL.pick[0], trans: SEL.trans[0] }, { bike: SEL.pick[1], trans: SEL.trans[1] }]);
  else { TRANS = SEL.trans[0]; saveSettings(); startFromSelect([{ bike: SEL.pick[0], trans: SEL.trans[0] }]); }
}
function selBack() { if (SEL.mode === '2p' && SEL.who === 1) { SEL.who = 0; SND.se('tick'); return; } exitSelect(); }
function exitSelect() { state = 'title'; titleDemo(); SND.setBgm('title'); syncAppUI(true); }
function selKey(k) {
  SEL.code.push(k); if (SEL.code.length > KONAMI.length) SEL.code.shift();
  if (SEL.code.join() === KONAMI.join() && unlockHidden('code')) { SEL.flash = 2.5; SEL.idx[SEL.who] = bikeList().length - 1; return true; }
  return false;
}
// ---------- コース選び ----------
const CSEL = { idx: 0 };
function openCourse() { CSEL.idx = Math.min(PROG.unlocked, COURSES.length - 1); state = 'course'; SND.resume(); SND.se('tick'); SND.setBgm('title'); syncAppUI(true); }
function courseMove(d) { CSEL.idx = clamp(CSEL.idx + d, 0, COURSES.length - 1); SND.se('tick'); }
function courseConfirm() { if (CSEL.idx > PROG.unlocked && !god) { SND.se('deflect'); return; } beginRace(CSEL.idx); }
function courseBack() { openSelect(SEL_CFG && SEL_CFG.length > 1 ? '2p' : '1p'); }
const menuPrev = {};
function stepMenus(dt) {   // コントローラーでのメニュー操作
  GAR.A += dt * (GAR.auto ? 0.5 : 0); SEL.flash = Math.max(0, (SEL.flash || 0) - dt);
  const pads = connectedPads(); const gp = state === 'select' && SEL.mode === '2p' && pads.length >= 2 ? pads[SEL.who] : pads[0]; if (!gp) return;
  const B = i => !!(gp.buttons[i] && gp.buttons[i].pressed), ax = gp.axes[0] || 0, ay = gp.axes[1] || 0;
  const edge = (k, v) => { const e = v && !menuPrev[k]; menuPrev[k] = v; return e; };
  const L = edge('l', B(14) || ax < -0.6), Rr = edge('r', B(15) || ax > 0.6), U = edge('u', B(12) || ay < -0.6), D = edge('d', B(13) || ay > 0.6), A = edge('a', B(0) || B(9)), Bk = edge('b', B(1)), Y = edge('y', B(3));
  if (state === 'select') {
    if (L) selKey(37) || selMove(-1); if (Rr) selKey(39) || selMove(1); if (U) selKey(38); if (D) selKey(40);
    if (A) selConfirm(); if (Bk) selBack(); if (Y) { SEL.trans[SEL.who] = SEL.trans[SEL.who] === 'MT' ? 'AT' : 'MT'; SND.se('tick'); }
  } else if (state === 'course') { if (L) courseMove(-1); if (Rr) courseMove(1); if (U) courseMove(-6); if (D) courseMove(6); if (A) courseConfirm(); if (Bk) courseBack(); }
  else if (state === 'result' && resultT > 1) { if (A) resultAction('next'); if (Y) resultAction('retry'); if (Bk) resultAction('menu'); }
}

// ---------- キー ----------
function keyPressed(event) {
  if (!document.getElementById('help-screen').hidden || !document.getElementById('install-screen').hidden) return;
  if (event && event.target && /^(BUTTON|INPUT|SELECT|TEXTAREA)$/.test(event.target.tagName)) return;
  if (keyCode === 27 && state === 'select') { selBack(); return false; }
  if (keyCode === 27 && state === 'course') { courseBack(); return false; }
  if (keyCode === 27 && state === 'result') { resultAction('menu'); return false; }
  if (keyCode === 27 || keyCode === 80) { if (!event || !event.repeat) togglePause(); return false; }
  if (paused) return false;
  if (event && event.repeat && [65, 90, 77, 76, 84, 86, 73].includes(keyCode)) return false;
  SND.resume();
  if (state === 'select') {
    if (keyCode >= 37 && keyCode <= 40) { const hit = selKey(keyCode); if (!hit && (keyCode === 37 || keyCode === 39)) selMove(keyCode === 37 ? -1 : 1); return false; }
    if (keyCode === 65 || keyCode === 68) { selMove(keyCode === 65 ? -1 : 1); return false; }
    if (keyCode === ENTER || keyCode === 32) { selConfirm(); return false; }
    if (keyCode === 84) { SEL.trans[SEL.who] = SEL.trans[SEL.who] === 'MT' ? 'AT' : 'MT'; SND.se('tick'); return false; }
    return false;
  }
  if (state === 'course') { if (keyCode === 37) courseMove(-1); if (keyCode === 39) courseMove(1); if (keyCode === 38) courseMove(-6); if (keyCode === 40) courseMove(6); if (keyCode === ENTER || keyCode === 32) courseConfirm(); return false; }
  if (state === 'result') { if (resultT < 1) return false; if (keyCode === ENTER || keyCode === 32) resultAction('next'); if (keyCode === 82) resultAction('retry'); return false; }
  const two = state === 'play' && TWO();
  if (!two && keyCode === 77) { SND.toggle(); return false; }
  if (!two && keyCode === 76) { lite = !lite; DRAW_N = lite ? 150 : 240; saveSettings(); return false; }
  if (state === 'title') { if (keyCode === ENTER || keyCode === 32) { openSelect('1p'); return false; } if (keyCode === 84) { setTrans(TRANS === 'MT' ? 'AT' : 'MT'); return false; } }
  if (state === 'play') {
    if (!two) { if (keyCode === 65) pulse.up = true; if (keyCode === 90) pulse.down = true; }
    else PLAYERS.forEach((pl, i) => { const K = KEY2[i]; if (keyCode === K.up) pl.pulse.up = true; if (keyCode === K.down) pl.pulse.down = true; });
  }
  if ([32, 37, 38, 39, 40].includes(keyCode)) return false;
}

// ---------- 全体 ----------
function setup() {
  const surface = createCanvas(SW, SH); if (document.getElementById('game-stage')) surface.parent('game-stage'); frameRate(60);
  pixelDensity(isTouchDev ? 1 : Math.min(2, window.devicePixelRatio || 1));
  ctx = drawingContext; fitCanvas();
  for (const ev of ['touchend', 'pointerup', 'click', 'keydown', 'mousedown']) window.addEventListener(ev, () => { if (!paused) SND.resume(); }, { passive: true });   // iOS は touchend か click でないと音が出ない
  document.addEventListener('gesturestart', e => e.preventDefault());
  window.addEventListener('orientationchange', () => setTimeout(fitCanvas, 250));
  if (window.visualViewport) window.visualViewport.addEventListener('resize', fitCanvas);
  initMeshes(); initRedesignMeshes();
  const h = location.hash;
  god = h.includes('god');
  const cm = /course=(\d+)/.exec(h), bm = /bike=(\w+)/.exec(h), b2 = /bike2=(\w+)/.exec(h);
  const tm = /(?:^#|,)(mt|at)(?=,|$)/.exec(h); if (tm) TRANS = tm[1].toUpperCase();
  if (h.includes('unlock')) { hiddenUnlocked = true; PROG.unlocked = COURSES.length - 1; }
  const cfgs = [{ bike: bm ? bm[1] : 'kai', trans: TRANS }]; if (h.includes('2p')) cfgs.push({ bike: b2 ? b2[1] : 'arc', trans: TRANS });
  if (h.startsWith('#demo')) { startRace(cfgs, cm ? (+cm[1] - 1) : 0, false); for (const pl of PLAYERS) pl.bot = true; demo = true; state = 'play'; }
  else titleDemo();
  if (h.includes('race') && state === 'play') { mode = 'race'; for (const r of RACERS) { r.gear = 3; r.kmh = 180; } }
  if (h.includes('garage') || h.includes('select')) { openSelect(h.includes('select2') ? '2p' : h.includes('select') ? '1p' : 'view'); const ga = /ga=(-?[\d.]+)/.exec(h); if (ga) { GAR.A = +ga[1]; GAR.auto = false; } const si = /si=(\d)/.exec(h); if (si) SEL.idx[0] = +si[1] % bikeList().length; }
  if (h.includes('coursesel')) { SEL_CFG = cfgs; openCourse(); const ci = /ci=(\d+)/.exec(h); if (ci) CSEL.idx = +ci[1]; }
  if (h.includes('audio')) SND.resume();   // 確認用: 起動と同時に音を鳴らす(要 --autoplay-policy=no-user-gesture-required)
  if (h.includes('sndtest')) { SND.resume(); const names = SND.seNames; let n = 0; const tick = () => { SND.se(names[n % names.length]); SND.update({ rpm: 2000 + (n * 700) % 11000, thr: 1, engine: true, nitro: n % 10 < 3, kmh: 200, limit: false, slide: false }, n % 3); if (n % 6 === 0) SND.setBgm(SND.tracks[(n / 6) % SND.tracks.length | 0]); n++; if (n < 220) setTimeout(tick, 60); else document.title = 'sndtest ok errors=' + SND.errors; }; setTimeout(tick, 200); }
  const sim = /sim=(\d+)/.exec(h);
  if (sim) {
    const t0 = performance.now();
    for (let i = 0; i < +sim[1]; i++) { step(1 / 60); if (RESULT) break; }
    const simMs = performance.now() - t0, t1 = performance.now(); for (let i = 0; i < 10; i++) drawScene(); const dms = (performance.now() - t1) / 10;
    document.title = JSON.stringify({ state, mode, course: courseIdx + 1, raceT: +raceT.toFixed(1), trackLen, players: PLAYERS.map(p => ({ bike: p.bk.id, pos: p.pos, lap: p.lap, kmh: Math.round(p.kmh), heat: Math.round(p.heat), finished: p.finished, time: p.finishT && +p.finishT.toFixed(1) })), order: updatePositions().map(r => r.name + ':' + r.lap), result: RESULT && RESULT.map(x => x.name + ' ' + x.time.toFixed(1)), drawMs: +dms.toFixed(1), simMs: Math.round(simMs) });
  }
}
function draw() {
  let dt = Math.min(deltaTime / 1000, 1 / 20);
  if (hitStop > 0) { hitStop--; dt *= 0.15; }
  if (paused) { const g = readGamepad(); if (g.start) togglePause(); syncAppUI(); return; }
  fpsAvg += (deltaTime - fpsAvg) * 0.05; if (!lite && ++fpsN > 150 && fpsAvg > 34) { lite = true; DRAW_N = 150; }
  if (state === 'select' || state === 'course' || state === 'result') { stepMenus(dt); simT += dt; resultT += dt; }
  if (state === 'select') { drawSelect(simT); syncAppUI(); return; }
  if (state === 'course') { drawCourseSelect(simT); syncAppUI(); return; }
  if (location.hash.includes('still')) { drawScene(); syncAppUI(); return; }
  if (state === 'title') { const g0 = readGamepad(); if (g0.start) { openSelect('1p'); return; } }
  if (state === 'result') { drawScene(); drawResult(); syncAppUI(); return; }
  step(dt); drawScene(); syncAppUI();
}
function fitCanvas() {   // 画面に合わせて 16:9 の大きさを計算する(古い iPadOS でも動く)
  const c = document.querySelector('canvas'); if (!c) return;
  const area = document.getElementById('game-stage');
  const vw = area ? area.clientWidth : window.innerWidth, vh = area ? area.clientHeight : window.innerHeight, k = Math.min(vw / SW, vh / SH);
  c.style.width = Math.floor(SW * k) + 'px'; c.style.height = Math.floor(SH * k) + 'px';
}
function windowResized() { fitCanvas(); }
function mouseDragged() { if (state === 'select') { GAR.auto = false; GAR.A += movedX * 0.01; } }
function setTrans(t) { TRANS = t; saveSettings(); SND.se('tick'); syncAppUI(true); }

// ---------- ゲームパッド(Gamepad API、標準配置) ----------
const gpPrev = {};
let rumbleLast = 0;
const connectedPads = () => (navigator.getGamepads ? Array.from(navigator.getGamepads()) : []).filter(p => p && p.connected);
function rumble(strong, weak, ms) {
  const now = performance.now(); if (now - rumbleLast < 60 || demo || (P && !P.human)) return; rumbleLast = now;
  try {
    const pads = connectedPads(), gp = (P && P.padIndex != null && pads.find(p => p.index === P.padIndex)) || (!TWO() && pads[0]);
    if (gp && gp.vibrationActuator && gp.vibrationActuator.playEffect) gp.vibrationActuator.playEffect('dual-rumble', { duration: ms, strongMagnitude: strong, weakMagnitude: weak });
    else if (isTouchDev && navigator.vibrate) navigator.vibrate(Math.round(ms / 2));
  } catch (e) { }
}
function readPad(gp, key) {   // 1つのコントローラーを読む(key ごとに「押した瞬間」を覚える)
  const r = { connected: true, index: gp.index, thr: 0, brk: 0, steer: 0, boost: false, clutch: false, up: false, down: false, drift: false, start: false };
  const pv = gpPrev[key] || (gpPrev[key] = {});
  const dz = v => Math.abs(v) < 0.15 ? 0 : v, B = i => !!(gp.buttons[i] && gp.buttons[i].pressed), V = i => gp.buttons[i] ? gp.buttons[i].value || (gp.buttons[i].pressed ? 1 : 0) : 0;
  const edge = (k, i) => { const now = B(i); const e = now && !pv[k]; pv[k] = now; return e; };
  r.steer = dz(gp.axes[0] || 0); if (B(14)) r.steer = -1; if (B(15)) r.steer = 1;
  r.thr = Math.max(V(7), B(12) ? 1 : 0); r.brk = Math.max(V(6), B(13) ? 1 : 0);   // R2 アクセル、L2 ブレーキ(アナログ)
  r.boost = B(0) || B(1); r.clutch = B(4); r.drift = B(5);                      // A・B ブースト、L1 クラッチ、R1 ドリフト
  r.up = edge('y', 3); r.down = edge('x', 2);                                   // Y シフトアップ、X シフトダウン
  r.start = edge('start', 9);
  return r;
}
function readGamepad() {   // 1人のとき・メニュー: 最初のコントローラー
  const pads = connectedPads(); if (!pads.length) return { connected: false, thr: 0, brk: 0, steer: 0, boost: false, clutch: false, up: false, down: false, drift: false, start: false };
  if (TWO() && state === 'play') { let st = false; pads.forEach((p, i) => { const pv = gpPrev['st' + i] || (gpPrev['st' + i] = {}); const now = !!(p.buttons[9] && p.buttons[9].pressed); if (now && !pv.s) st = true; pv.s = now; }); return { connected: false, start: st }; }
  return readPad(pads[0], 'g0');
}

// ---------- タッチ: 左に仮想スティック(ハンドル)、右にボタン ----------
let touchMode = isTouchDev || location.hash.includes('touch'), stickId = null, stickOrg = null, stickPos = null, touchPrev = {}, touchHeld = {};
const TBTN_AT = { boost: { x: 1165, y: 560, r: 70, label: 'BOOST' }, brake: { x: 1000, y: 610, r: 50, label: 'BRAKE' }, drift: { x: 1040, y: 440, r: 56, label: 'DRIFT' } };
const TBTN_MT = { boost: { x: 1165, y: 560, r: 64, label: 'BOOST' }, thr: { x: 1010, y: 600, r: 56, label: 'ACCEL' }, brake: { x: 870, y: 640, r: 42, label: 'BRAKE' }, drift: { x: 1110, y: 420, r: 48, label: 'DRIFT' },
  clutch: { x: 330, y: 610, r: 50, label: 'CLUTCH' }, up: { x: 90, y: 360, r: 44, label: 'UP' }, down: { x: 205, y: 360, r: 44, label: 'DOWN' } };
const TBTN = () => (P && P.human ? P.trans : TRANS) === 'MT' ? TBTN_MT : TBTN_AT;
function readTouch() {
  const r = { active: false, steer: 0, thr: 0, brk: 0, boost: false, clutch: false, up: false, down: false, drift: false };
  if (!touchMode) return r;
  r.active = true; const held = {}; let seen = false; const B = TBTN();
  for (const t of touches) {
    if (t.id === stickId && stickOrg) { seen = true; const dx = t.x - stickOrg.x; stickPos = { x: stickOrg.x + clamp(dx, -90, 90), y: stickOrg.y }; r.steer = clamp(dx / 90, -1, 1); continue; }
    for (const k in B) if (Math.hypot(t.x - B[k].x, t.y - B[k].y) < B[k].r * 1.2) held[k] = true;
  }
  if (!seen) { stickId = null; stickPos = null; }
  r.thr = P.trans === 'AT' ? (held.brake ? 0 : 1) : held.thr ? 1 : 0;   // AT は自動でアクセル
  r.brk = held.brake ? 1 : 0; r.boost = !!held.boost; r.clutch = !!held.clutch; r.drift = !!held.drift;
  r.up = !!held.up && !touchPrev.up; r.down = !!held.down && !touchPrev.down;
  if (touches.length === 0) r.active = false, r.thr = 0;
  touchPrev = held; touchHeld = held;
  return r;
}
function touchStarted(event) {
  if (event && event.target && event.target.closest && event.target.closest('#app-ui, #toolbar, #garage-ui')) return;
  if (paused) return false;
  SND.resume(); touchMode = true;
  const t = touches[touches.length - 1];
  if (state === 'select') { if (t) selTap(t.x, t.y); return false; }
  if (state === 'course') { if (t) courseTap(t.x, t.y); return false; }
  if (state === 'result') { if (t && resultT > 1) resultTap(t.x, t.y); return false; }
  const B = TBTN();
  for (const q of touches) if (stickId === null && q.x < SW * 0.45 && q.y > SH * 0.35 && !Object.values(B).some(b => Math.hypot(q.x - b.x, q.y - b.y) < b.r * 1.2)) { stickId = q.id; stickOrg = { x: q.x, y: q.y }; stickPos = { x: q.x, y: q.y }; }
  return false;
}
function mousePressed(event) {
  if (touchMode || (event && event.target && event.target.closest && event.target.closest('#app-ui, #garage-ui'))) return;
  if (state === 'select') selTap(mouseX, mouseY); else if (state === 'course') courseTap(mouseX, mouseY); else if (state === 'result' && resultT > 1) resultTap(mouseX, mouseY);
}
function touchEnded() { GAR.tx = null; SND.resume(); return false; }
function touchMoved() { if (state === 'select' && touches.length) { GAR.A += (touches[0].x - (GAR.tx == null ? touches[0].x : GAR.tx)) * 0.01; GAR.tx = touches[0].x; GAR.auto = false; } return false; }
