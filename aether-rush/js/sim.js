// 機体の物理(ホバー・慣性・ドリフト・壁・ブースト)とAI。描画から独立
import * as THREE from '../lib/three.module.js';

export const CFG = {
  HOVER: 3.0, K: 320, DAMP: 24, GRAV: 150, FWD_DAMP: 0.9985, BOOST_COST: 20, ENERGY: 100,
  WALL_MARGIN: 1.9, SHIP_R: 2.6,
};

const _v = new THREE.Vector3(), _w = new THREE.Vector3(), _n = new THREE.Vector3(), _r = new THREE.Vector3(), _t = new THREE.Vector3();

export function makeShip(mach, opt = {}) {
  return {
    mach, name: opt.name || '', isPlayer: !!opt.isPlayer, color: opt.color || 0xffffff,
    pos: new THREE.Vector3(), vel: new THREE.Vector3(), hd: new THREE.Vector3(0, 0, -1), up: new THREE.Vector3(0, 1, 0),
    idx: 0, cum: 0, lap: 0, lapStart: 0, lapTimes: [], bestLap: 0, finished: false, finishTime: 0, rank: 0,
    energy: CFG.ENERGY, boostT: 0, boosting: false, drifting: false, grounded: false, air: 0, wallHit: 0, scrape: 0,
    u: 0, h: 0, steerS: 0, roll: 0, slip: 0, speed: 0, invul: 0, down: false, downT: 0, lastSafe: 0, jumpCool: 0, padFx: 0, hitFx: 0,
    skill: opt.skill || 1, lane: opt.lane || 0, laneTarget: opt.lane || 0, aiBoostT: 0, laneT: 0, padHint: '',
  };
}

// 機体をコース上に置く(位置サンプル i、横 lat)
export function placeShip(tr, s, i, lat = 0, speed = 0) {
  const k = ((i % tr.N) + tr.N) % tr.N;
  const P = tr.P, T = tr.T, R = tr.R, U = tr.U;
  s.up.set(U[k * 3], U[k * 3 + 1], U[k * 3 + 2]);
  s.pos.set(P[k * 3] + R[k * 3] * lat + s.up.x * CFG.HOVER, P[k * 3 + 1] + R[k * 3 + 1] * lat + s.up.y * CFG.HOVER, P[k * 3 + 2] + R[k * 3 + 2] * lat + s.up.z * CFG.HOVER);
  s.hd.set(T[k * 3], T[k * 3 + 1], T[k * 3 + 2]);
  s.vel.copy(s.hd).multiplyScalar(speed);
  s.idx = k; s.padHint = '';
}

// 最も近いサンプルを探し(ヒント付き)、その場のフレーム情報を ship.frame に入れる
export function locate(tr, s) {
  const { N, ds, P, T } = tr;
  let i = s.idx;
  const p = s.pos;
  for (let step = 0; step < 40; step++) {
    const along = (p.x - P[i * 3]) * T[i * 3] + (p.y - P[i * 3 + 1]) * T[i * 3 + 1] + (p.z - P[i * 3 + 2]) * T[i * 3 + 2];
    if (along > ds * 0.5) i = (i + 1) % N;
    else if (along < -ds * 0.5) i = (i - 1 + N) % N;
    else break;
  }
  s.idx = i;
  return i;
}

// 位置 p における路面フレーム(補間)。戻り値: {i, f, c, t, r, u, lat, h}
const FR = { i: 0, f: 0, cx: 0, cy: 0, cz: 0, rx: 0, ry: 0, rz: 0, ux: 0, uy: 0, uz: 0, tx: 0, ty: 0, tz: 0, lat: 0, h: 0, along: 0 };
export function frameAt(tr, s) {
  const { N, ds, P, T, R, U } = tr;
  const i = s.idx, a = i, b = (i + 1) % N, c = (i - 1 + N) % N;
  const p = s.pos;
  const along = (p.x - P[a * 3]) * T[a * 3] + (p.y - P[a * 3 + 1]) * T[a * 3 + 1] + (p.z - P[a * 3 + 2]) * T[a * 3 + 2];
  // along が正なら a と b の間、負なら c と a の間で補間
  const o = along >= 0 ? b : c, f = Math.min(1, Math.abs(along) / ds), g = 1 - f;
  FR.i = i; FR.f = along >= 0 ? f : -f; FR.along = along;
  FR.cx = P[a * 3] * g + P[o * 3] * f; FR.cy = P[a * 3 + 1] * g + P[o * 3 + 1] * f; FR.cz = P[a * 3 + 2] * g + P[o * 3 + 2] * f;
  let rx = R[a * 3] * g + R[o * 3] * f, ry = R[a * 3 + 1] * g + R[o * 3 + 1] * f, rz = R[a * 3 + 2] * g + R[o * 3 + 2] * f;
  let ux = U[a * 3] * g + U[o * 3] * f, uy = U[a * 3 + 1] * g + U[o * 3 + 1] * f, uz = U[a * 3 + 2] * g + U[o * 3 + 2] * f;
  let tx = T[a * 3] * g + T[o * 3] * f, ty = T[a * 3 + 1] * g + T[o * 3 + 1] * f, tz = T[a * 3 + 2] * g + T[o * 3 + 2] * f;
  let l = Math.hypot(rx, ry, rz); FR.rx = rx / l; FR.ry = ry / l; FR.rz = rz / l;
  l = Math.hypot(ux, uy, uz); FR.ux = ux / l; FR.uy = uy / l; FR.uz = uz / l;
  l = Math.hypot(tx, ty, tz); FR.tx = tx / l; FR.ty = ty / l; FR.tz = tz / l;
  const dx = p.x - FR.cx, dy = p.y - FR.cy, dz = p.z - FR.cz;
  FR.lat = dx * FR.rx + dy * FR.ry + dz * FR.rz;
  FR.h = dx * FR.ux + dy * FR.uy + dz * FR.uz;
  return FR;
}

// 入力: {steer(-1..1), accel(0..1), brake(0..1), boost(bool), drift(bool)}
export function stepShip(tr, s, inp, dt, ev) {
  const m = s.mach, st = tr;
  if (s.down) { s.downT += dt; s.vel.multiplyScalar(0.96); s.pos.addScaledVector(s.vel, dt); return; }
  locate(tr, s);
  let fr = frameAt(tr, s);
  const gapHere = !!tr.gap[s.idx] || !!tr.gap[(s.idx + 1) % tr.N] || !!tr.gap[(s.idx - 1 + tr.N) % tr.N];
  const onRoad = !gapHere && Math.abs(fr.lat) < tr.halfW + 3.5;
  const n = _n.set(fr.ux, fr.uy, fr.uz);
  // 姿勢の「上」は路面法線へなめらかに
  const airborne = !onRoad || fr.h > CFG.HOVER * 3.2;
  if (!airborne) s.up.lerp(n, Math.min(1, dt * 14)).normalize(); else s.up.lerp(_v.set(0, 1, 0), Math.min(1, dt * 1.2)).normalize();
  s.grounded = !airborne;
  // 向きを面に射影
  const up = s.up;
  s.hd.addScaledVector(up, -s.hd.dot(up)).normalize();
  const right = _r.copy(s.hd).cross(up).normalize();

  // ---- ステアリング ----
  const vel = s.vel;
  let fs = vel.dot(s.hd);
  const topBase = m.top * s.skill;
  const speedRatio = Math.max(0, fs) / m.top;
  const pidx = onRoad ? tr.padAt[s.idx] : -1;
  s.slipping = pidx >= 0 && tr.pads[pidx].type === 'slip' && !airborne;
  s.drifting = !!inp.drift && s.grounded && fs > 90;
  let turnRate = m.turn / (1 + speedRatio * 0.85);
  if (s.slipping) turnRate *= 0.8;
  if (s.drifting) turnRate *= 1.42;
  if (!s.grounded) turnRate *= 0.35;
  const steerTarget = inp.steer;
  s.steerS += (steerTarget - s.steerS) * Math.min(1, dt * 11);
  const ang = s.steerS * turnRate * dt;
  { const ca = Math.cos(ang), sa = Math.sin(ang); _v.copy(s.hd).multiplyScalar(ca).addScaledVector(right, sa); s.hd.copy(_v).normalize(); }
  right.copy(s.hd).cross(up).normalize();

  // ---- 速度の分解 ----
  let vh = vel.dot(up);
  _w.copy(vel).addScaledVector(up, -vh); // 面内の速度
  fs = _w.dot(s.hd);
  let ss = _w.dot(right);

  // ブースト
  s.boostT = Math.max(0, s.boostT - dt);
  const wantBoost = inp.boost && s.energy > 6 && s.grounded;
  s.boosting = (wantBoost || s.boostT > 0);
  let top = topBase;
  if (wantBoost) { s.energy -= CFG.BOOST_COST * dt; if (s.isPlayer || true) s.boostUse = true; }
  if (s.boosting) top = topBase * (1.22 + 0.1 * m.boost);

  // 推進
  const accel = m.accel * (s.boosting ? 1.8 : 1);
  if (inp.accel > 0) {
    const r = Math.min(1.2, Math.max(0, fs) / top);
    fs += accel * inp.accel * (1 - Math.pow(r, 2.2)) * dt;
  }
  if (inp.brake > 0) fs -= (fs > 0 ? (s.slipping ? 90 : 260) : 80) * inp.brake * dt;
  if (fs > top) fs -= (fs - top) * Math.min(1, dt * 1.6); // 最高速を超えた分はゆっくり戻る
  fs *= Math.pow(CFG.FWD_DAMP, dt * 60);
  if (!inp.accel && !inp.brake) fs *= Math.pow(0.9965, dt * 60);

  // グリップ(横滑り)
  const grip = s.slipping ? 0.990 : (s.drifting ? 0.972 : m.grip);
  if (s.grounded) ss *= Math.pow(grip, dt * 60);
  else ss *= Math.pow(0.995, dt * 60);

  // ---- 垂直(ホバー or 空中) ----
  let landing = false;
  if (onRoad && fr.h < CFG.HOVER * 2.4) {
    const accV = (CFG.HOVER - fr.h) * CFG.K - vh * CFG.DAMP - CFG.GRAV; // GRAV: 路面に吸い付く力(つり合いで少し沈む)
    vh += accV * dt;
    if (fr.h < 0.4) { vh = Math.max(vh, 0); }
  } else if (!airborne) vh -= CFG.GRAV * dt; // ばねの届かない高さは路面へ引き戻す
  // 速度の再合成
  vel.copy(s.hd).multiplyScalar(fs).addScaledVector(right, ss).addScaledVector(up, vh);
  if (airborne) { vel.y -= CFG.GRAV * dt; s.air += dt; } else { if (s.air > 0.35) { landing = true; } s.air = 0; }

  s.pos.addScaledVector(vel, dt);

  // ---- 壁・路面の再判定 ----
  locate(tr, s);
  fr = frameAt(tr, s);
  const gap2 = !!tr.gap[s.idx] || !!tr.gap[(s.idx + 1) % tr.N];
  const onRoad2 = !gap2 && Math.abs(fr.lat) < tr.halfW + 3.5;
  if (onRoad2 && fr.h < 0.2) { // 沈み込み防止
    s.pos.x += fr.ux * (0.2 - fr.h); s.pos.y += fr.uy * (0.2 - fr.h); s.pos.z += fr.uz * (0.2 - fr.h);
    const vn = vel.x * fr.ux + vel.y * fr.uy + vel.z * fr.uz; if (vn < 0) vel.addScaledVector(_t.set(fr.ux, fr.uy, fr.uz), -vn);
  }
  s.wallHit = Math.max(0, s.wallHit - dt);
  s.scrape = 0;
  const lim = tr.halfW - CFG.WALL_MARGIN;
  if (!gap2 && Math.abs(fr.lat) > lim && fr.h < tr.wallH + 1.5 && Math.abs(fr.lat) < tr.halfW + 3) {
    const sg = Math.sign(fr.lat);
    const out = _t.set(fr.rx * sg, fr.ry * sg, fr.rz * sg);
    const over = Math.abs(fr.lat) - lim;
    s.pos.addScaledVector(out, -over);
    const vo = vel.dot(out);
    if (vo > 0) {
      vel.addScaledVector(out, -vo * 1.3);
      const spd = vel.length();
      vel.multiplyScalar(Math.max(0.55, 1 - vo * 0.0035));
      s.scrape = 1;
      if (vo > 12 && s.wallHit <= 0 && s.invul <= 0) {
        const dmg = vo * 0.075 / m.durab;
        s.energy -= dmg; s.wallHit = 0.25; s.wallHits = (s.wallHits || 0) + 1; s.hitFx = Math.min(1, vo / 80);
        if (ev) ev('wall', s, vo);
      }
    }
    vel.multiplyScalar(Math.pow(0.992, dt * 60)); // 擦りながらの減速
  }
  // 路面の上のパッド・回復
  s.padHint = '';
  if (onRoad2 && s.grounded) {
    const pi = tr.padAt[s.idx];
    if (pi >= 0) {
      const p = tr.pads[pi];
      if (fr.lat >= p.l0 && fr.lat <= p.l1) {
        if (p.type === 'boost') {
          if (s.boostT < 0.15) { if (ev) ev('boostpad', s); }
          s.boostT = 1.2;
          const f2 = vel.dot(s.hd);
          const want = m.top * s.skill * 1.3;
          if (f2 < want) vel.addScaledVector(s.hd, Math.min(want - f2, 520 * dt));
          s.padHint = 'boost';
        } else if (p.type === 'jump') {
          if (s.jumpCool <= 0 && vel.dot(up) < 40) { vel.addScaledVector(up, 46); s.jumpCool = 1.2; if (ev) ev('jump', s); }
          s.padHint = 'jump';
        } else if (p.type === 'recover') {
          s.energy = Math.min(CFG.ENERGY, s.energy + 28 * dt); s.padHint = 'recover';
          if (ev && !s._rec) ev('recover', s); s._rec = true;
        }
      }
    }
    if (s.padHint !== 'recover') s._rec = false;
    s.lastSafe = s.idx;
  }
  s.jumpCool = Math.max(0, s.jumpCool - dt);
  if (landing && ev) ev('land', s);
  s.invul = Math.max(0, s.invul - dt);
  s.hitFx = Math.max(0, s.hitFx - dt * 3);
  s.speed = vel.length();
  s.u = fr.lat; s.h = fr.h;

  // 落下(コース外・ギャップ): すぐ戻さず、しばらく本当に落ちていく(プレイヤーは約1.3秒、画面は暗転)。そのあとコースへ復帰する
  if (s.falling > 0) { s.falling -= dt; s.invul = Math.max(s.invul, 0.3); if (s.falling <= 0) { s.falling = 0; respawn(tr, s, ev); } }
  else if (fr.h < -70 || (!onRoad2 && fr.h < -22)) { s.falling = s.isPlayer ? 1.3 : 0.8; if (ev) ev('fall', s); }
  if (s.energy <= 0 && !s.isPlayer) s.energy = 6; // 相手は大破しない(ブーストが使えなくなるだけ)
  if (s.energy <= 0) { s.energy = 0; s.down = true; s.downT = 0; if (ev) ev('down', s); }
  s.energy = Math.min(CFG.ENERGY, s.energy);

  // 見た目用の傾き
  const rollT = -s.steerS * (s.drifting ? 0.62 : 0.4) * Math.min(1, s.speed / 150);
  s.roll += (rollT - s.roll) * Math.min(1, dt * 7);
  const slipT = Math.atan2(ss, Math.max(40, Math.abs(fs)));
  s.slip += (slipT - s.slip) * Math.min(1, dt * 8);
}

export function respawn(tr, s, ev) {
  let i = (s.lastSafe - 8 + tr.N * 2) % tr.N, speed = 90;
  // ジャンプ台のすぐ先なら、台の手前から助走をつけてやり直す
  for (const g of tr.gaps) {
    const d = (g.i0 - i + tr.N) % tr.N;
    if (d < 36) { i = (g.i0 - 46 + tr.N) % tr.N; speed = 200; break; }
  }
  s.respawns = (s.respawns || 0) + 1;
  placeShip(tr, s, i, 0, speed);
  s.energy = Math.max(12, s.energy - 12);
  s.invul = 2.2; s.air = 0; s.boostT = 0; s.steerS = 0; s.falling = 0;
  if (ev) ev('respawn', s);
}

// 進捗(周回カウント)。cum はコース上の通し距離(サンプル数)
export function updateProgress(tr, s, time, totalLaps, ev) {
  const N = tr.N;
  let d = s.idx - s.prevIdx;
  if (s.prevIdx === undefined) { s.prevIdx = s.idx; return; }
  if (d > N / 2) d -= N; else if (d < -N / 2) d += N;
  s.prevIdx = s.idx;
  s.cum += d;
  const lapNow = Math.floor(s.cum / N);
  if (lapNow > s.lap && !s.finished) {
    const lt = time - s.lapStart; s.lapStart = time;
    if (s.lap >= 0) { s.lapTimes.push(lt); if (!s.bestLap || lt < s.bestLap) s.bestLap = lt; }
    s.lap = lapNow;
    if (s.lap >= totalLaps) { s.finished = true; s.finishTime = time; if (ev) ev('finish', s); }
    else if (ev && s.lap >= 1) ev('lap', s, lt);
  } else if (lapNow < s.lap && !s.finished) {
    s.lap = lapNow; // 逆走で戻った
  }
}

// ---- AI ----
export function aiInput(tr, s, race, dt) {
  const N = tr.N, m = s.mach;
  const spdLook = Math.max(7, Math.min(28, s.speed * 0.075)); // 先を見る距離(サンプル)
  const look = Math.round(spdLook * s.skill);
  const ti = (s.idx + look) % N;
  const P = tr.P, R = tr.R, U = tr.U;
  // レーン(電車を避ける): ゆっくり目標を変える
  s.laneT -= dt;
  if (s.laneT <= 0) {
    s.laneT = 1.2 + Math.random() * 2.2;
    s.laneTarget = s.lane + (Math.random() - 0.5) * 10;
  }
  { // 前をふさぐ機体をよける(短い間隔で見直す)
    const rgt = _t.copy(s.hd).cross(s.up).normalize();
    for (const o of race.ships) {
      if (o === s || o.down) continue;
      _v.copy(o.pos).sub(s.pos);
      const fwd = _v.dot(s.hd), side = _v.dot(rgt);
      if (fwd > 0 && fwd < 50 && Math.abs(side) < 9) { s.laneTarget = s.u - (side >= 0 ? 1 : -1) * 11; s.laneT = Math.max(s.laneT, 0.8); break; }
    }
  }
  let lat = Math.max(-tr.halfW + 13, Math.min(tr.halfW - 13, s.laneTarget));
  let gapAhead = -1; // 先にギャップがあるなら、ジャンプ台の真ん中を狙う
  for (let k = 0; k < 60; k += 2) if (tr.gap[(s.idx + k) % N]) { gapAhead = k; break; }
  if (gapAhead >= 0) lat *= 0.15;
  const tx = P[ti * 3] + R[ti * 3] * lat, ty = P[ti * 3 + 1] + R[ti * 3 + 1] * lat, tz = P[ti * 3 + 2] + R[ti * 3 + 2] * lat;
  _v.set(tx - s.pos.x, ty - s.pos.y, tz - s.pos.z);
  // 面内へ射影
  _v.addScaledVector(s.up, -_v.dot(s.up)).normalize();
  const crossY = _w.copy(_v).cross(s.hd).dot(s.up); // 右が正
  const dotv = s.hd.dot(_v);
  let steer = Math.atan2(crossY, dotv) * 2.4;
  steer += Math.max(-0.5, Math.min(0.5, (lat - s.u) * 0.035)); // 横位置のずれを直す
  steer = Math.max(-1, Math.min(1, steer));
  // 曲がりの強さを先読みして速度を決める
  let curv = 0;
  for (let k = 8; k <= 48; k += 8) {
    const a = (s.idx + k) % N, b = (s.idx + k + 6) % N;
    const dx = tr.T[a * 3] - tr.T[b * 3], dz = tr.T[a * 3 + 2] - tr.T[b * 3 + 2];
    curv = Math.max(curv, Math.hypot(dx, dz) / (6 * tr.ds));
  }
  const maxTurnAtSpeed = m.turn / (1 + 0.85 * s.speed / m.top);
  const need = curv * s.speed;
  let accel = 1, brake = 0;
  if (need > maxTurnAtSpeed * 1.05) { accel = 0; if (need > maxTurnAtSpeed * 1.4) brake = Math.min(1, (need / maxTurnAtSpeed - 1.3)); }
  let slipAhead = false;
  for (let k = 0; k < 34; k += 3) { const pi = tr.padAt[(s.idx + k) % N]; if (pi >= 0 && tr.pads[pi].type === 'slip') { slipAhead = true; break; } }
  if ((slipAhead || s.slipping) && s.speed > 215) { accel = 0; brake = Math.max(brake, s.slipping ? 0 : 0.5); }
  if (s.slipping) steer *= 0.75;
  const drift = need > maxTurnAtSpeed * 0.85 && s.speed > 160 && gapAhead < 0 && !s.slipping;
  // ブースト: 直線でエネルギーに余裕があるときだけ。最終周は積極的に
  let boost = false;
  if (s.energy > 45 && curv * s.speed < maxTurnAtSpeed * 0.35 && race.time > 4) {
    const wantMore = s.lap >= race.laps - 1 ? 0.6 : 0.2;
    s.aiBoostT -= dt; if (s.aiBoostT <= 0) { s.aiBoostT = 1.5 + Math.random() * 3; s._aiB = Math.random() < wantMore; }
    boost = !!s._aiB;
  }
  return { steer, accel, brake, boost, drift };
}

// 機体どうしの衝突(球)
export function collideShips(ships) {
  const R2 = CFG.SHIP_R * 2;
  for (let a = 0; a < ships.length; a++) for (let b = a + 1; b < ships.length; b++) {
    const A = ships[a], B = ships[b];
    if (A.down || B.down) continue;
    _v.copy(A.pos).sub(B.pos);
    const d = _v.length();
    if (d > 0 && d < R2) {
      _v.multiplyScalar(1 / d);
      const push = (R2 - d) * 0.5;
      A.pos.addScaledVector(_v, push); B.pos.addScaledVector(_v, -push);
      const rv = _w.copy(A.vel).sub(B.vel).dot(_v);
      if (rv < 0) { const imp = -rv * 0.6; A.vel.addScaledVector(_v, imp); B.vel.addScaledVector(_v, -imp); if (-rv > 25) { A.energy -= (-rv) * 0.02 / A.mach.durab; B.energy -= (-rv) * 0.02 / B.mach.durab; A.hitFx = B.hitFx = 0.5; } }
    }
  }
}
