'use strict';
// ボス「ギガ・レッド」(資料\資料.txt の案): 旗を10本集めると出現。壁を砕きながら迫る多関節トレーラー。
// 第1段階: 車を射出 / 第2段階: 岩を投げる(煙幕で遅くなる) / 第3段階: 装甲が剥がれ、ワイヤーフレームのコアがレーザーを撃つ
// 弱点の作り: 煙幕に入るとセンサーが乱れて遅くなる。体当たりで弾いた敵をぶつけると大ダメージ(STRIKE)。S旗の爆発も効く。
const BOSS_PAL = { o: '#101018', S: '#c8c8d8', k: '#202028', R: '#c01818', h: '#ff5a5a', g: '#9fe8ff', w: '#222230', M: '#7a1010', r: '#e0b0b0', d: '#300808', Y: '#ffd400', l: '#ffee88' };
const BOSS_CAB = makeSprite([
  "..oooooooooooo..",
  ".olSSSSSSSSSSlo.",
  ".oSkSkSkSkSkSSo.",
  "woRRRRRRRRRRRRow",
  "woRggggggggggRow",
  "woRggggggggggRow",
  "woRRRRRRRRRRRRow",
  "ooRhhhhhhhhhhRoo",
  "ooRRRRRRRRRRRRoo",
  "ooRRkRRRRRRkRRoo",
  "ooRRkRRRRRRkRRoo",
  "ooRRRRRRRRRRRRoo",
  "woRRRRRRRRRRRRow",
  "woRRRRRRRRRRRRow",
  "woRhhhhhhhhhhRow",
  "woRRRRRRRRRRRRow",
  ".oRRRRRRRRRRRRo.",
  ".oooooooooooooo.",
], BOSS_PAL);
const BOSS_BOX = makeSprite([
  ".oooooooooooooo.",
  "ooMMMMMMMMMMMMoo",
  "oMrMMMMMMMMMMrMo",
  "oMMMMMMMMMMMMMMo",
  "oMMddddddddddMMo",
  "oMMdYkYkYkYkdMMo",
  "oMMddddddddddMMo",
  "wMMMMMMMMMMMMMMw",
  "wMrMMMMMMMMMMrMw",
  "wMMMMMMMMMMMMMMw",
  "oMMddddddddddMMo",
  "oMMdYkYkYkYkdMMo",
  "oMMddddddddddMMo",
  "wMrMMMMMMMMMMrMw",
  "wMMMMMMMMMMMMMMw",
  "ooMMMMMMMMMMMMoo",
  ".oooooooooooooo.",
], BOSS_PAL);
const BOSS_ROSTER = [
  ['ギガ・レッド','#ff5555','rush'],['鉄骨グラップル','#ffb14a','rock'],['夜光ジャガー','#9c7bff','rush'],['ノイズ・バグ','#ff63d7','swarm'],
  ['溶岩キャリア','#ff693b','rock'],['氷結ゼロ号','#7feaff','laser'],['スクラップ・キング','#b6d67b','swarm'],['紅蓮マグナム','#ff417c','laser'],
  ['ミラージュ・ロード','#b4a0ff','rush'],['サンダー・ランナー','#f5df62','laser'],['砲台エクスプレス','#ff9457','rock'],['緑鋼ヘラクレス','#79f5a1','swarm'],
  ['ファントム・トレイン','#bc8cfa','rush'],['プラズマ・ワーム','#67caff','laser'],['マグマ・ブルドーザー','#ff542e','rock'],['マザー・ハイブ','#f583bd','swarm'],
  ['流星ブレイカー','#f6cc72','rush'],['クロノ・タイタン','#85dfdf','laser'],['終端ギガ・ブラック','#dad7e8','rock'],['ゼロ・アーク','#ffffff','final']
].map(([name,color,mode],i)=>({name,color,mode,segments:3+i%4, speed:1+i%5*.07, spawn:1+i%3, laser:mode==='laser'||mode==='final', rock:mode==='rock'||mode==='final'}));
function bossProfile(){return BOSS_ROSTER[Math.min(19,Math.max(0,G.stage-1))];}
function bossTint(sprite,color){
  const c=document.createElement('canvas');c.width=sprite.width;c.height=sprite.height;
  const g=c.getContext('2d');g.drawImage(sprite,0,0);g.globalCompositeOperation='source-atop';g.fillStyle=color;g.globalAlpha=.52;g.fillRect(0,0,c.width,c.height);return c;
}
for(const b of BOSS_ROSTER){b.cab=bossTint(BOSS_CAB,b.color);b.box=bossTint(BOSS_BOX,b.color);}
const BOSS_SC = 4, BOSS_R = 36, BOSS_SEGS = 4, BOSS_STEP = 16; // 軌跡は4pxごと、16点=64px間隔でトレーラーが続く

function startBoss() {
  G.flagsList.length = 0; G.bossWarn = 3;
  say([`> 警告: 第${G.stage}管理体「${bossProfile().name}」が起動。`, G.stage===20?'> 全8装備を究極MAXにするとコアを破壊できる。':'> 壁を破壊しながら接近中。煙幕でセンサーを乱せ。']);
}
function spawnBoss() {
  const p = G.p; let pos = null;
  for (let k = 0; k < 80; k++) { const n = randNode(0), d = Math.hypot(n.x - p.x, n.y - p.y); if (d > 650 && d < 1000) { pos = n; break; } }
  if (!pos) pos = randNode(500, p);
  const hp = 450 + 650 * (G.stage - 1) + 300 * G.stage * G.stage * .5 + 4 * G.level; // 1体目は弱め、階層ごとに硬く
  G.boss = { x: pos.x, y: pos.y, profile:bossProfile(), ang: Math.atan2(p.y - pos.y, p.x - pos.x), trail: [], hp, max: hp, phase: 1, lastPhase: 1, t: 0, spawnT: 1, rockT: 2, laserT: 2, rocks: [], lasers: [], flash: 0, dying: 0, boomT: 0, swT: 0, num: null, lastCrunch: -9 };
  for (let i = 0; i < G.boss.profile.segments * BOSS_STEP + 4; i++) G.boss.trail.push({ x: pos.x, y: pos.y });
  G.boss.parts = bossParts();
  flash(.5, '#ff2020'); G.shake = .6; G.shakeA = 10; sfx(60, 1.2, 'sawtooth', .1, 30);
}
function bossParts() {
  const b = G.boss, out = [{ x: b.x, y: b.y, head: true }];
  for (let i = 1; i <= b.profile.segments; i++) { const q = b.trail[Math.min(b.trail.length - 1, i * BOSS_STEP)]; out.push({ x: q.x, y: q.y, i }); }
  return out;
}
function bossHit(x, y, r) {
  const b = G.boss; if (!b || b.dying > 0 || !b.parts) return false;
  for (const q of b.parts) if ((q.x - x) ** 2 + (q.y - y) ** 2 < (BOSS_R + r) ** 2) return true;
  return false;
}
function bossHurt(dmg, src) {
  const b = G.boss; if (!b || b.dying > 0) return;
  dmg *= pw(); b.hp -= dmg; b.flash = .08;
  if(G.stage===20 && !allEquippedMax() && b.hp<=1){b.hp=1;if(G.t-(b.gateMsg||-9)>2){b.gateMsg=G.t;pop(b.x,b.y-90,`封印: 装備${equippedSkills().length}/8 全てLv10`, '#ffffff',20);}}
  if (b.num && b.num.l > .45) b.num.v += dmg; else if (G.nums.length < 180) { b.num = { x: b.x + rr(-20, 20), y: b.y - 50, v: dmg, l: .75 }; G.nums.push(b.num); }
  if (b.hp <= 0) { b.hp = 0; b.dying = 2.2; b.rocks.length = 0; b.lasers.length = 0; sfx(50, 2, 'sawtooth', .09, 25); }
}
function bossHitPlayer(dmg, sx, sy) {
  const p = G.p; if (p.inv > 0) return;
  G.hits = (G.hits || 0) + 1; p.hp -= dmg * (1 + G.t / 400) * (G.boss && G.stage === 1 ? .7 : 1); p.inv = .9; shove(); G.shake = .2; G.shakeA = 7;
  sfx(100, .25, 'sawtooth', .08, 50); boom(p.cx, p.cy, '#6ab0ff', 8);
  if (p.hp <= 0) die();
}
// 1マスを床にして描き直す(壁を砕いた跡)
function carveCircle(x, y, r) {
  let n = 0;
  const x0 = Math.max(1, Math.floor((x - r) / T)), x1 = Math.min(GW - 2, Math.floor((x + r) / T)), y0 = Math.max(1, Math.floor((y - r) / T)), y1 = Math.min(GH - 2, Math.floor((y + r) / T));
  for (let ty = y0; ty <= y1; ty++) for (let tx = x0; tx <= x1; tx++) {
    if (grid[ty * GW + tx] !== 1) continue;
    const cx = (tx + .5) * T, cy = (ty + .5) * T; if (Math.hypot(cx - x, cy - y) > r + T * .35) continue;
    grid[ty * GW + tx] = 0; n++;
    burst(cx, cy, '#2f8cff', 4, 220, 'shard'); burst(cx, cy, '#5a6aa8', 4, 160, 'shard');
    for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) paintTile(tx + dx, ty + dy, dx === 0 && dy === 0);
  }
  return n;
}
function updateBoss(dt) {
  if (G.bossWarn > 0) {
    const before = G.bossWarn; G.bossWarn -= dt;
    if (Math.floor(before * 2) !== Math.floor(G.bossWarn * 2)) sfx(880, .3, 'square', .05, 440);
    if (G.bossWarn <= 0) spawnBoss();
    return;
  }
  if (G.clearT > 0) { G.clearT -= dt; if (G.clearT <= 0) stageClear(); return; }
  const b = G.boss; if (!b) return;
  const p = G.p, cx = p.cx, cy = p.cy;
  b.t += dt; if (b.flash > 0) b.flash -= dt;
  if (b.dying > 0) {
    b.dying -= dt; b.boomT -= dt;
    if (b.boomT <= 0) {
      b.boomT = .1; const q = b.parts[ri(b.parts.length)], x = q.x + rr(-30, 30), y = q.y + rr(-30, 30);
      glowFx(x, y, 90, '#ff8a20', .4); burst(x, y, '#ffb040', 20, 420, 'spark'); burst(x, y, '#7a1010', 8, 260, 'shard'); ring(x, y, 80, .3, '#ffb43c', 5);
      sfx(90 + rnd() * 60, .25, 'sawtooth', .07, 40); G.shake = .15; G.shakeA = 6;
    }
    if (b.dying <= 0) bossDefeated();
    return;
  }
  b.phase = b.hp > b.max * .66 ? 1 : b.hp > b.max * .33 ? 2 : 3;
  if (b.phase !== b.lastPhase) {
    b.lastPhase = b.phase; flash(.5); G.shake = .4; G.shakeA = 8;
    pop(b.x, b.y - 70, b.phase === 2 ? '装甲変形! 岩を投げてくる' : 'コア露出! レーザーに注意', '#ff4040', 24);
    burst(b.x, b.y, '#ff6040', 40, 500, 'spark'); burst(b.x, b.y, '#c01818', 20, 300, 'shard'); sfx(150, .8, 'sawtooth', .08, 600);
  }
  // 煙幕でセンサーが乱れて遅くなる
  let slow = 1; for (const q of G.puffs) if ((q.x - b.x) ** 2 + (q.y - b.y) ** 2 < (q.r + 30) ** 2) { slow = .4; break; }
  b.slowed = slow < 1;
  const spd = [0, 95, 115, 140][b.phase] * slow * (1 + (G.stage - 1) * .04) * b.profile.speed * (b.profile.mode==='rush'?1.23:1);
  const ta = Math.atan2(cy - b.y, cx - b.x), da = Math.atan2(Math.sin(ta - b.ang), Math.cos(ta - b.ang));
  b.ang += Math.max(-1.6 * dt, Math.min(1.6 * dt, da));
  b.x = Math.max(T * 1.5, Math.min(WORLD - T * 1.5, b.x + Math.cos(b.ang) * spd * dt));
  b.y = Math.max(T * 1.5, Math.min(WORLD - T * 1.5, b.y + Math.sin(b.ang) * spd * dt));
  const last = b.trail[0]; if (Math.hypot(b.x - last.x, b.y - last.y) >= 4) { b.trail.unshift({ x: b.x, y: b.y }); if (b.trail.length > b.profile.segments * BOSS_STEP + 4) b.trail.pop(); }
  b.parts = bossParts();
  // 壁を砕く
  let broke = 0; for (const q of b.parts) broke += carveCircle(q.x, q.y, BOSS_R - 2);
  if (broke) {
    G.dtile = -1;
    if (G.t - b.lastCrunch > .15) { b.lastCrunch = G.t; sfx(70 + rnd() * 30, .15, 'sawtooth', .05, 40); if (Math.abs(b.x - cx) < VW && Math.abs(b.y - cy) < VH) { G.shake = Math.max(G.shake, .08); G.shakeA = Math.max(3, G.shake > .1 ? G.shakeA : 3); } }
  }
  // 体当たり
  for (const q of b.parts) if (Math.hypot(cx - q.x, cy - q.y) < BOSS_R + 14) { bossHitPlayer(18, q.x, q.y); if (state !== 'play') return; break; }
  // 弾き飛ばされた敵がボスに当たるとストライク
  for (const q of b.parts) near(q.x, q.y, BOSS_R + 20, e => {
    if (e.dead || Math.hypot(e.vx, e.vy) < 200 || Math.hypot(e.x - q.x, e.y - q.y) > BOSS_R + 16) return;
    bossHurt(30 + 5 * G.stage, 'strike'); e.src = 'crash'; killEnemy(e); pop(q.x, q.y - 34, 'STRIKE!', '#ffe040', 20); burst(e.x, e.y, '#ffe040', 12, 400, 'spark'); sfx(250, .15, 'square', .06, 120);
  });
  // レーダー・スイーパーも当たる
  if (lv('radar') && b.swT <= 0) {
    const L = lv('radar'), len = 95 + 10 * L, n = L >= 4 ? 2 : 1;
    for (let k = 0; k < n && b.swT <= 0; k++) { const a = G.sweep + k * Math.PI; for (const q of b.parts) { const dx = q.x - p.x, dy = q.y - p.y, d = Math.hypot(dx, dy); if (d > len + BOSS_R) continue; const dA = Math.atan2(Math.sin(Math.atan2(dy, dx) - a), Math.cos(Math.atan2(dy, dx) - a)); if (Math.abs(dA) < .5) { bossHurt(6 + 2 * L, 'wpn'); b.swT = .25; break; } } }
  }
  if (b.swT > 0) b.swT -= dt;
  // 第1〜3段階: 後ろのハッチから赤い車を射出(だんだん間隔が空く)
  b.spawnT -= dt;
  if (b.spawnT <= 0) {
    b.spawnT = [0, 1.3, 2.4, 3.2][b.phase] * (b.profile.mode==='swarm'?.55:1); const tail = b.parts[b.parts.length - 1];
    for (let k = 0; k < b.profile.spawn; k++) spawnEnemy(snapNode(tail.x + rr(-30, 30), tail.y + rr(-30, 30)), 'red');
    burst(tail.x, tail.y, '#ff5050', 10, 260, 'spark'); sfx(300, .1, 'square', .04, 150);
  }
  // 第2段階: 岩を投げる(自機の少し先を狙う。煙幕の中では遅くなる)
  if (b.phase === 2 || (b.profile.rock && b.phase>=2)) {
    b.rockT -= dt;
    if (b.rockT <= 0) {
      b.rockT = 1.5; const tx = cx + p.dir.x * 305 * .35, ty = cy + p.dir.y * 305 * .35, a = Math.atan2(ty - b.y, tx - b.x);
      b.rocks.push({ x: b.x, y: b.y, vx: Math.cos(a) * 300, vy: Math.sin(a) * 300, l: 3.5, rot: 0 }); sfx(120, .2, 'triangle', .06, 60);
    }
  }
  for (let i = b.rocks.length - 1; i >= 0; i--) {
    const r = b.rocks[i]; let k = 1; for (const q of G.puffs) if ((q.x - r.x) ** 2 + (q.y - r.y) ** 2 < q.r * q.r) { k = .35; break; }
    r.x += r.vx * dt * k; r.y += r.vy * dt * k; r.rot += dt * 6; r.l -= dt;
    if (Math.hypot(r.x - cx, r.y - cy) < 30) { bossHitPlayer(15, r.x, r.y); if (state !== 'play') return; r.l = 0; }
    if (r.l <= 0) { burst(r.x, r.y, '#a89a88', 10, 240, 'shard'); b.rocks.splice(i, 1); }
  }
  // 第3段階: コアからレーザー(0.8秒の予告線 → 0.35秒の照射。壁を無視する)
  if (b.phase === 3 || (b.profile.laser && b.phase>=2)) {
    b.laserT -= dt;
    if (b.laserT <= 0) {
      b.laserT = 2.0; const n = G.stage >= 2 ? 3 : 1, a0 = Math.atan2(cy - b.y, cx - b.x);
      for (let k = 0; k < n; k++) b.lasers.push({ a: a0 + (k - (n - 1) / 2) * .35, warn: .8, fire: .35, hit: false, snd: false });
      sfx(1200, .6, 'sine', .04, 300);
    }
  }
  for (let i = b.lasers.length - 1; i >= 0; i--) {
    const L = b.lasers[i];
    if (L.warn > 0) { L.warn -= dt; continue; }
    if (!L.snd) { L.snd = true; sfx(200, .35, 'sawtooth', .07, 80); G.shake = Math.max(G.shake, .15); G.shakeA = Math.max(G.shakeA, 4); }
    L.fire -= dt;
    const c = Math.cos(L.a), s = Math.sin(L.a), along = (cx - b.x) * c + (cy - b.y) * s, perp = Math.abs(-(cx - b.x) * s + (cy - b.y) * c);
    if (!L.hit && along > 0 && perp < 18) { L.hit = true; bossHitPlayer(22, cx, cy); if (state !== 'play') return; }
    if (L.fire <= 0) b.lasers.splice(i, 1);
  }
}
function bossDefeated() {
  const b = G.boss;
  flash(1); ring(b.x, b.y, 700, .8, '#ffffff', 12); ring(b.x, b.y, 500, .7, '#ff4040', 10); ring(b.x, b.y, 300, .6, '#ffe040', 8);
  burst(b.x, b.y, '#ffe040', 120, 800, 'spark'); burst(b.x, b.y, '#ff6060', 60, 600, 'spark'); glowFx(b.x, b.y, 400, '#ffffff', .6);
  for (const e of G.enemies) if (Math.abs(e.x - G.p.x) < VW / 2 + 60 && Math.abs(e.y - G.p.y) < VH / 2 + 60) { const d = Math.hypot(e.x - b.x, e.y - b.y) || 1; hurt(e, 9999, (e.x - b.x) / d, (e.y - b.y) / d, 300, 'bang'); }
  for (let i = 0; i < 30; i++) dropGem(b.x + rr(-140, 140), b.y + rr(-140, 140), true, 1);
  for (const g of G.gems) g.mag = true;
  const bonus = 20000 * G.stage; G.score += bonus;
  pop(b.x, b.y - 90, `${b.profile.name}撃破!  +${bonus}`, '#ffe040', 30);
  say(['> 階層管理プログラムを停止。', '> 次の階層への経路を開きます。']);
  [523, 659, 784, 1047, 1319].forEach((f, i) => sfx(f, .25, 'square', .06, 0, i * .1)); sfx(1568, .8, 'triangle', .05, 0, .5);
  G.boss = null; G.clearT = G.stage===20?0:3; G.freeze = .25; G.shake = .8; G.shakeA = 14; G.bossKills = (G.bossKills || 0) + 1;
  if(G.stage===20){state='win';G.log=['> ゼロ・アークのコアを停止。','> 全20体の管理体を突破しました。',`> 最終スコア ${G.score} / 生存 ${Math.floor(G.t)}秒`,'> [R / タップ]で新しい観測サイクルへ'];}
}

// ---- 描画 ----
function bossSegAngle(b, idx) { const a = b.trail[Math.max(0, idx - 3)], c = b.trail[Math.min(b.trail.length - 1, idx + 3)]; return Math.atan2(a.y - c.y, a.x - c.x); }
function drawWireCore(x, y, t, sc) { // 3Dワイヤーフレームの立方体+八面体(2Dの世界に混ざる異物)
  const V = [], E = [], ax = t * .9, ay = t * 1.3, P = (px, py, pz) => {
    let X = px * Math.cos(ay) + pz * Math.sin(ay), Z = -px * Math.sin(ay) + pz * Math.cos(ay), Y = py * Math.cos(ax) - Z * Math.sin(ax); Z = py * Math.sin(ax) + Z * Math.cos(ax);
    const k = 3 / (3 + Z); return [x + X * sc * k, y + Y * sc * k];
  };
  for (let i = 0; i < 8; i++) V.push(P(i & 1 ? 1 : -1, i & 2 ? 1 : -1, i & 4 ? 1 : -1));
  for (let i = 0; i < 8; i++) for (const bit of [1, 2, 4]) if (!(i & bit)) E.push([i, i | bit]);
  ctx.globalCompositeOperation = 'lighter'; glow(x, y, sc * 2.4, '#ff2040', .5 + .2 * Math.sin(t * 8)); ctx.globalAlpha = 1;
  for (const [w, c] of [[5, 'rgba(255,40,70,.6)'], [1.5, '#ffffff']]) { ctx.lineWidth = w; ctx.strokeStyle = c; ctx.beginPath(); for (const [a, bb] of E) { ctx.moveTo(V[a][0], V[a][1]); ctx.lineTo(V[bb][0], V[bb][1]); } ctx.stroke(); }
  const O = [[0, 0, 1.4], [0, 0, -1.4], [1.4, 0, 0], [-1.4, 0, 0], [0, 1.4, 0], [0, -1.4, 0]].map(v => P(v[0] * .55, v[1] * .55, v[2] * .55));
  ctx.strokeStyle = 'rgba(80,255,140,.9)'; ctx.lineWidth = 2; ctx.beginPath();
  for (const a of [0, 1]) for (const c of [2, 3, 4, 5]) { ctx.moveTo(O[a][0], O[a][1]); ctx.lineTo(O[c][0], O[c][1]); }
  for (const [a, c] of [[2, 4], [4, 3], [3, 5], [5, 2]]) { ctx.moveTo(O[a][0], O[a][1]); ctx.lineTo(O[c][0], O[c][1]); }
  ctx.stroke(); ctx.globalCompositeOperation = 'source-over';
}
function drawBoss() {
  const b = G.boss; if (!b) return;
  // 予告線とレーザー
  for (const L of b.lasers) {
    const x2 = b.x + Math.cos(L.a) * 1500, y2 = b.y + Math.sin(L.a) * 1500;
    if (L.warn > 0) { ctx.strokeStyle = `rgba(255,40,40,${.35 + .3 * Math.sin(G.t * 40)})`; ctx.lineWidth = 2; ctx.setLineDash([14, 8]); ctx.beginPath(); ctx.moveTo(b.x, b.y); ctx.lineTo(x2, y2); ctx.stroke(); ctx.setLineDash([]); }
    else {
      ctx.globalCompositeOperation = 'lighter'; ctx.lineCap = 'round';
      for (const [w, c] of [[30, 'rgba(255,30,80,.35)'], [12, 'rgba(255,150,180,.8)'], [4, '#ffffff']]) { ctx.lineWidth = w * (.6 + L.fire / .35 * .4); ctx.strokeStyle = c; ctx.beginPath(); ctx.moveTo(b.x, b.y); ctx.lineTo(x2, y2); ctx.stroke(); }
      ctx.globalCompositeOperation = 'source-over'; ctx.lineCap = 'butt';
    }
  }
  const parts = b.parts || bossParts();
  // トレーラー(後ろから描く)
  for (let i = parts.length - 1; i >= 1; i--) {
    const q = parts[i], a = bossSegAngle(b, i * BOSS_STEP);
    drawSprite(b.profile.box, q.x, q.y, a + Math.PI / 2, BOSS_SC);
    if (b.flash > 0) drawSprite(whiteOf(BOSS_BOX), q.x, q.y, a + Math.PI / 2, BOSS_SC, b.flash / .08);
    if (b.phase === 1 && i === parts.length - 1 && b.spawnT < .4) { ctx.globalCompositeOperation = 'lighter'; glow(q.x, q.y, 50, '#ff3030', (.4 - b.spawnT) * 2); ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over'; }
  }
  // 頭: 第3段階(と撃破中)はワイヤーフレームのコア
  if (b.phase < 3) {
    drawSprite(b.profile.cab, b.x, b.y, b.ang + Math.PI / 2, BOSS_SC);
    if (b.flash > 0) drawSprite(whiteOf(BOSS_CAB), b.x, b.y, b.ang + Math.PI / 2, BOSS_SC, b.flash / .08);
  } else drawWireCore(b.x, b.y, b.t, 30 + (b.flash > 0 ? 6 : 0));
  if (b.slowed && b.dying <= 0) txt('センサー妨害中', b.x, b.y - 58, 13, '#c0c8ff', 'center');
  for (const r of b.rocks) drawSprite(SP.rock, r.x, r.y, r.rot, 4.5);
}
function drawBossHUD() {
  if (G.bossWarn > 0) {
    const a = .55 + .45 * Math.sin(G.t * 14);
    ctx.fillStyle = `rgba(160,0,0,${.35 * a})`; ctx.fillRect(0, VH / 2 - 48, VW, 96);
    ctx.fillStyle = `rgba(255,210,0,${a})`; for (let x = -40 + (G.t * 120) % 40; x < VW; x += 40) { ctx.beginPath(); ctx.moveTo(x, VH / 2 - 48); ctx.lineTo(x + 20, VH / 2 - 48); ctx.lineTo(x + 10, VH / 2 - 40); ctx.lineTo(x - 10, VH / 2 - 40); ctx.fill(); ctx.beginPath(); ctx.moveTo(x, VH / 2 + 48); ctx.lineTo(x + 20, VH / 2 + 48); ctx.lineTo(x + 10, VH / 2 + 40); ctx.lineTo(x - 10, VH / 2 + 40); ctx.fill(); }
    txt('WARNING', VW / 2, VH / 2 + 4, 54, `rgba(255,60,60,${.6 + .4 * a})`, 'center');
    txt(`第${G.stage}管理体「${bossProfile().name}」接近`, VW / 2, VH / 2 + 32, 16, '#ffd0d0', 'center');
  }
  const b = G.boss; if (!b) return;
  const w = 420, x = VW / 2 - w / 2, y = 80;
  txt(`${G.stage}/20  ${b.profile.name}`, VW / 2, y - 4, 14, b.profile.color, 'center');
  if(G.stage===20&&!allEquippedMax())txt(`封印解除: 装備 ${equippedSkills().length}/8 を全てLv10へ`, VW/2,y+29,13,'#fff3a0','center');
  ctx.fillStyle = 'rgba(0,0,0,.7)'; ctx.fillRect(x - 3, y - 1, w + 6, 12);
  ctx.fillStyle = b.phase === 3 ? `hsl(${(G.t * 300) % 360},90%,55%)` : '#e02828'; ctx.fillRect(x, y + 1, w * b.hp / b.max, 8);
  ctx.fillStyle = '#ffffff'; ctx.fillRect(x + w * .33, y - 1, 2, 12); ctx.fillRect(x + w * .66, y - 1, 2, 12);
}
function drawBossRadar(rx, ry, k) {
  const b = G.boss; if (!b) return;
  if (((G.t * 6) | 0) % 2) { ctx.fillStyle = '#ff2020'; for (const q of b.parts || []) ctx.fillRect(rx + q.x * k - 3, ry + q.y * k - 3, 6, 6); }
}
