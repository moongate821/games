// RALLY DROP SURVIVORS(スモーク・チェーン)のルールと見た目。
// 落ちてくるのは「車」(青・黄・緑・紫)。同色5つ以上で消える(連鎖)。赤い敵の車が行進してきて、盤を埋めていく。
//   煙幕ブロック: 着地すると、まわりの敵がスピン → 次の手順で「玉突き」(ぶつかって両方ダメージ、となりもスピン)
//   S旗(Space): 溜めておいて、敵が密集したときに使う。全敵に大ダメージ+スピン(敵が多いほど得点)
//   旗10本(敵を5台倒すごとに1本)でボス「ギガ・レッド」。倒すと次の階層(迷路のテーマが変わる)
//   経験値 → レベルアップでスキルを3択(ランス・煙幕タンク・ドリフト・ガード)
(() => {
const DG = window.DG, { Sfx } = DG.Audio, { TAU } = DG.Art, { COLS, ROWS, CELL, BX, BY, PW } = DG.C;
const MATCH = 5;   // ななめもつながるので5つ
const N4 = [[0, -1], [1, 0], [0, 1], [-1, 0], [1, -1], [1, 1], [-1, 1], [-1, -1]];   // 8角形の駒: 縦横+ななめ(8方向)がつながる。名前は昔のまま
const KIND = ['blue', 'yellow', 'green', 'purple'];                    // c = 0..3 は車の色
const TILE = ['#3d7bff', '#ffd21a', '#35d36a', '#b45cff'];
const NAMES = ['青', '黄', '緑', '紫'];
const ENEMY = 4, SMOKE = 5, BOSS = 7;

// 迷路のテーマ(ラリーX SURVIVORS の fields.js と同じ配色)。階層ごとに巡る
const THEMES = [
  { name: 'ネオン・グリッド', floor: '#0a0d24', wall: '#141a4a', edge: '#2f8cff', shine: '#9fd0ff' },
  { name: '地下工事区画', floor: '#18120b', wall: '#4c3020', edge: '#ffab36', shine: '#ffe3a1' },
  { name: 'ミッドナイト・ストリート', floor: '#100b25', wall: '#302050', edge: '#a176ff', shine: '#e6d5ff' },
  { name: 'グリッチ・キャンバス', floor: '#14091d', wall: '#481d52', edge: '#ff52de', shine: '#ffe0fb' },
  { name: 'ボルカニック・ロード', floor: '#210d0b', wall: '#572019', edge: '#ff653b', shine: '#ffc08a' },
  { name: 'フロスト・サーキット', floor: '#091d28', wall: '#1a4c60', edge: '#70eaff', shine: '#d8ffff' },
  { name: 'モス・ガーデン', floor: '#171a19', wall: '#353d38', edge: '#b3d674', shine: '#f0ffd2' },
  { name: 'ゼロ・アーク', floor: '#050711', wall: '#242233', edge: '#ffffff', shine: '#ffcf61' },
];
const themeOfFloor = f => THEMES[(Math.max(1, f) - 1) % THEMES.length];

// ---------- スキル ----------
const SKILL_ORDER = ['lance', 'smoke', 'drift', 'guard'];
const SK = {
  lance: { name: 'フラッグ・ランス', color: '#ffd45a', dark: '#654514', desc: lv => `${lanceSec(lv)}秒ごとに、敵1台へ自動ダメージ`, short: '自動攻撃' },
  smoke: { name: '煙幕タンク', color: '#c78cff', dark: '#4a2870', desc: lv => `燃料がたまる速さ +${lv * 40}%` + (lv >= 3 ? '・スピンが3段階に' : '') + (lv >= 4 ? '・範囲が広がる' : ''), short: '煙幕' },
  drift: { name: 'ドリフト・タイヤ', color: '#58caff', dark: '#18476d', desc: lv => `車の落ちる速さが ${lv * 12}% ゆっくり`, short: '落下' },
  guard: { name: 'ガード・バンパー', color: '#a0ed6d', dark: '#3b662b', desc: lv => `負けそうな時、上の敵と車を一掃(合計${lv}回)`, short: '救済' },
};
const lanceSec = lv => 14 - lv * 2;                                  // Lv1=12秒 … Lv5=4秒
const MAXLV = 5;
const need = lv => 7 + 3 * lv;                                        // レベルアップに必要な経験値

// ---------- 盤の見かた ----------
const at = (P, x, y) => (x >= 0 && x < COLS && y >= 0 && y < ROWS) ? P.grid[y][x] : null;
const isEnemy = c => !!c && (c.c === ENEMY || c.c === BOSS);
function enemies(P) { const o = []; for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++) if (isEnemy(P.grid[y][x])) o.push([x, y]); return o; }
// 難しさの数値(1か所にまとめる。テストで書きかえて試せる: DG.smokechainTune)
const TUNE = DG.smokechainTune = { first: 6, w0: 4, wPer: 0.8, wFloor: 3, wMax: 20, i0: 8.5, iDec: 0.3, iFloor: 1.0, iMin: 3.4, hpFloor: 2, hpWave: 8 };
function enemyHp(P) { return 1 + Math.floor((P.stat.floor - 1) / TUNE.hpFloor) + Math.floor(P.stat.waveNo / TUNE.hpWave); }
function makeEnemy(P) { const hp = enemyHp(P); return { c: ENEMY, hp, maxhp: hp, spin: 0 }; }
function makeBoss(P) { const hp = 14 + 6 * (P.stat.floor - 1); return { c: BOSS, hp, maxhp: hp, spin: 0 }; }

function gainXp(P, n) {
  const st = P.stat; st.xp += n;
  while (st.xp >= need(st.lv)) { st.xp -= need(st.lv); st.lv++; st.pendingLv++; }
}
function waveSize(P) { const st = P.stat; return Math.min(TUNE.wMax, Math.round(TUNE.w0 + st.waveNo * TUNE.wPer + (st.floor - 1) * TUNE.wFloor)); }
function waveInterval(P) { const st = P.stat; return Math.max(TUNE.iMin, TUNE.i0 - st.waveNo * TUNE.iDec - (st.floor - 1) * TUNE.iFloor); }

// 敵にダメージ。倒したら true。倒した敵は経験値・得点・旗に
function damageEnemy(P, x, y, dmg, mult) {
  const c = at(P, x, y); if (!isEnemy(c)) return false;
  const st = P.stat; c.hp -= dmg; c.pop = 1;
  if (c.hp > 0) { P.burst(x, y, '#ff9a9a', 4); return false; }
  const boss = c.c === BOSS;
  P.grid[y][x] = null; P.burst(x, y, '#ff5050', boss ? 24 : 10); st.kills++; st.killsFloor++;
  gainXp(P, boss ? 12 : 1 + (P.chain >= 2 ? 1 : 0));
  P.score += Math.round((boss ? 3000 : 100) * mult);
  const nf = Math.min(10, Math.floor(st.killsFloor / 5));
  if (nf > st.flags) { st.flags = nf; Sfx.grow(); P.say(`旗ゲット! ${nf}/10`, 1.6, 3); }
  if (boss) bossDown(P);
  return true;
}
function bossDown(P) {
  const st = P.stat; st.bossAlive = false; st.bossQueued = false;
  const cleared = st.floor; st.floor++; st.flags = 0; st.killsFloor = 0; st.waveNo = 0; st.waveT = TUNE.first + 6; P.pending = 0;
  st.sflags = Math.min(3, st.sflags + 1); st.pendingLv++; P.score += 5000 * cleared;
  P.flash = 1.2; P.shake = 16; Sfx.win();
  P.say(`FLOOR ${cleared} クリア! ギガ・レッド撃破! 次は ${themeOfFloor(st.floor).name}`, 5, 9);
}

// ---------- 駒 ----------
function rc() { return Math.floor(Math.random() * 4); }
function makePiece(P) {
  const st = P.stat; st.gen = (st.gen || 0) + 1;
  st.fuel += 8 * (1 + 0.4 * st.skills.smoke);              // 燃料: 駒がひとつ出るたびにたまる。満タンで煙幕の駒
  if (st.fuel >= 100) { st.fuel -= 100; return { b: [{ c: SMOKE }, { c: rc() }], ent: null, special: SMOKE }; }
  return { b: [{ c: rc() }, { c: rc() }], ent: null };
}

// ---------- 消去・連鎖の判定 ----------
function findMatches(P) {
  const out = [], g = P.grid, seen = Array.from({ length: ROWS }, () => Array(COLS).fill(false));
  for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++) {
    const c = g[y][x]; if (!c || c.c > 3 || seen[y][x]) continue;
    const grp = [[x, y]]; seen[y][x] = true;
    for (let i = 0; i < grp.length; i++) for (const [dx, dy] of N4) {
      const nx = grp[i][0] + dx, ny = grp[i][1] + dy; if (nx < 0 || nx >= COLS || ny < 0 || ny >= ROWS || seen[ny][nx]) continue;
      const nc = g[ny][nx]; if (nc && nc.c === c.c) { seen[ny][nx] = true; grp.push([nx, ny]); }
    }
    if (grp.length >= MATCH) out.push(grp);
  }
  return out;
}
function enemiesAround(P, groups) {
  const set = new Map();
  for (const g of groups) for (const [x, y] of g) for (const [dx, dy] of N4) { const c = at(P, x + dx, y + dy); if (isEnemy(c)) set.set((y + dy) * COLS + x + dx, [x + dx, y + dy]); }
  return [...set.values()];
}

// ---------- 自動攻撃(ランス)・救済(ガード) ----------
function fireLance(P) {
  const list = enemies(P); if (!list.length) return false;
  // いちばん高い所にいる敵(=天井に近い敵)を狙う
  list.sort((a, b) => a[1] - b[1]); const [x, y] = list[0], mult = DG.chainMult(0);
  Sfx.zap(); P.burst(x, y, '#ffd45a', 8);
  const killed = damageEnemy(P, x, y, 1, mult);
  P.say(killed ? 'ランス命中! 敵を撃破' : 'ランス命中!', 1.6, 3);
  return killed;
}
function guardWipe(P) {
  let n = 0;
  for (let y = 0; y < 6; y++) for (let x = 0; x < COLS; x++) { const c = P.grid[y][x]; if (!c) continue; P.burst(x, y, '#a0ed6d', 6); if (isEnemy(c)) { P.stat.kills++; P.stat.killsFloor++; gainXp(P, 1); if (c.c === BOSS) { c.hp = Math.max(1, c.hp - 6); P.burst(x, y, '#ff5050', 12); continue; } } P.grid[y][x] = null; n++; }
  P.applyGravity(); P.flash = 1; P.shake = 14; Sfx.zap();
  P.say(`ガード・バンパー発動! 上の ${n}こ を一掃`, 4, 9);
  P.phase = 'resolve'; P.res = { stage: 'settle', t: 0 };
}

// ---------- レベルアップの選択 ----------
function startPick(P) {
  const st = P.stat, pool = SKILL_ORDER.filter(k => st.skills[k] < MAXLV);
  if (!pool.length) { st.pendingLv = 0; P.score += 2000; P.say('全スキルが最大! ボーナス +2000', 3, 5); return false; }
  const opts = pool.sort(() => Math.random() - .5).slice(0, 3);
  P.phase = 'pick'; st.pick = { opts, sel: 0, t: 0 }; Sfx.chime(4);
  P.say(`LEVEL UP! Lv${st.lv}。スキルを選ぼう`, 3, 7);
  return true;
}
function choosePick(P, i) {
  const st = P.stat, pk = st.pick; if (!pk || i < 0 || i >= pk.opts.length) return;
  const k = pk.opts[i]; st.skills[k]++; st.pick = null; Sfx.start(); P.flash = .8;
  P.say(`${SK[k].name} Lv${st.skills[k]}! ${SK[k].desc(st.skills[k])}`, 3.5, 7);
  if (st.pendingLv > 0) st.pendingLv--;
  if (st.pendingLv > 0 && startPick(P)) return;
  P.phase = 'resolve'; P.res = { stage: 'settle', t: 0 };       // 盤の整理をしてから次の駒へ
}
// 日本語の折り返し: 「・」で区切り、長ければ「、」や空白のところで折る(数字の途中では切らない)
function wrapJa(s, n) {
  const out = [];
  for (let seg of s.split('・')) {
    while (seg.length > n) {
      let k = -1; for (const b of ['、', ' ', '(']) { const i = seg.lastIndexOf(b, n); if (i > 2) k = Math.max(k, b === '(' ? i - 1 : i); }
      if (k < 0) k = n - 1; out.push(seg.slice(0, k + 1).trim()); seg = seg.slice(k + 1).trim();
    }
    if (seg) out.push(seg);
  }
  return out;
}
const PICK_CARD = i => ({ x: 25 + i * 200, y: 170, w: 190, h: 290 });

// ---------- 見た目 ----------
// 駒は8角形(幾何学ふう)。外枠+内側の細い8角形+角の光点
function oct(ctx, r, cut) {
  const h = r - cut; ctx.beginPath();
  ctx.moveTo(-h, -r); ctx.lineTo(h, -r); ctx.lineTo(r, -h); ctx.lineTo(r, h); ctx.lineTo(h, r); ctx.lineTo(-h, r); ctx.lineTo(-r, h); ctx.lineTo(-r, -h); ctx.closePath();
}
function tile(ctx, s, col, alpha) {
  const a0 = ctx.globalAlpha, r = s / 2 - 2, cut = r * .34;       // 呼び出し側の透明度(着地予告の半透明など)を引き継ぐ
  ctx.fillStyle = col; ctx.globalAlpha = a0 * alpha * .35; oct(ctx, r, cut); ctx.fill();
  ctx.globalAlpha = a0 * Math.min(1, alpha * .9); ctx.strokeStyle = col; ctx.lineWidth = 2.4; ctx.lineJoin = 'miter'; ctx.stroke();
  ctx.globalAlpha = a0 * Math.min(1, alpha) * .45; ctx.lineWidth = 1; oct(ctx, r - 5, cut * .8); ctx.stroke();
  ctx.globalAlpha = a0;
}
function drawCell(ctx, c, x, y, s, scale, t) {
  const k = c.c; ctx.save(); ctx.translate(x + s / 2, y + s / 2); if (scale !== 1) ctx.scale(scale, scale);
  if (k >= 0 && k < 4) {
    tile(ctx, s, TILE[k], 1); DG.Sprites.drawCar(ctx, KIND[k], 0, 0, s * .8, Math.PI);
  } else if (k === ENEMY || k === BOSS) {
    const boss = k === BOSS, spin = c.spin > 0;
    tile(ctx, s, '#ff3b3b', boss ? 1.4 : .9);
    ctx.save(); if (spin) ctx.rotate(t * 11);
    DG.Sprites.drawCar(ctx, 'red', 0, 0, s * (boss ? .94 : .8), Math.PI); ctx.restore();
    if (spin) {                                                  // めまいの星
      ctx.fillStyle = '#ffe36b'; for (let i = 0; i < 3; i++) { const a = t * 6 + i * TAU / 3; ctx.beginPath(); ctx.arc(Math.cos(a) * s * .36, -s * .3 + Math.sin(a) * s * .1, 3, 0, TAU); ctx.fill(); }
    }
    if (boss) {                                                  // 王冠と体力
      ctx.fillStyle = '#ffd34d'; ctx.beginPath(); ctx.moveTo(-9, -s * .36); ctx.lineTo(-11, -s * .5); ctx.lineTo(-4, -s * .43); ctx.lineTo(0, -s * .52); ctx.lineTo(4, -s * .43); ctx.lineTo(11, -s * .5); ctx.lineTo(9, -s * .36); ctx.closePath(); ctx.fill();
      ctx.fillStyle = 'rgba(0,0,0,.65)'; ctx.fillRect(-s / 2 + 3, s / 2 - 8, s - 6, 5); ctx.fillStyle = '#ff5a5a'; ctx.fillRect(-s / 2 + 3, s / 2 - 8, (s - 6) * Math.max(0, c.hp / c.maxhp), 5);
    } else if (c.maxhp > 1) {                                    // 体力の点
      for (let i = 0; i < c.maxhp; i++) { ctx.fillStyle = i < c.hp ? '#fff' : 'rgba(0,0,0,.6)'; ctx.beginPath(); ctx.arc(-(c.maxhp - 1) * 4 + i * 8, s / 2 - 6, 2.6, 0, TAU); ctx.fill(); }
    }
  } else if (k === SMOKE) {                                      // 紫の煙(燃料のタンクから出る)
    const p = 1 + Math.sin(t * 5) * .08;
    for (const [dx, dy, r, a] of [[-.14, .08, .26, .85], [.14, .1, .24, .8], [0, -.1, .3, .9], [.02, .16, .22, .7]]) {
      ctx.fillStyle = `rgba(190,130,255,${a})`; ctx.beginPath(); ctx.arc(dx * s, dy * s, r * s * p, 0, TAU); ctx.fill();
    }
    ctx.fillStyle = 'rgba(255,255,255,.55)'; ctx.beginPath(); ctx.arc(-s * .1, -s * .16, s * .07, 0, TAU); ctx.fill();
    DG.text(ctx, '煙', 0, s * .12, s * .3, '#3a1566', 'center');
  }
  if (c.clr) { ctx.fillStyle = `rgba(255,255,255,${.35 + .45 * Math.abs(Math.sin(t * 30))})`; DG.rr(ctx, -s / 2 + 2, -s / 2 + 2, s - 4, s - 4, 8); ctx.fill(); }
  ctx.restore();
}

// 迷路の背景(固定の乱数)
const WALLS = {};
function wallsFor(i, w, h) {
  const key = i + '|' + w; if (WALLS[key]) return WALLS[key];
  let seed = 1234 + i * 77; const rnd = () => (seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296, list = [], U = 40;
  for (let gy = 0; gy < Math.ceil(h / U); gy++) for (let gx = 0; gx < Math.ceil(w / U); gx++) {
    if (rnd() < .30) { const long = rnd() < .5, len = 1 + Math.floor(rnd() * 3); list.push(long ? [gx * U, gy * U, len * U - 6, U - 6] : [gx * U, gy * U, U - 6, len * U - 6]); }
  }
  return (WALLS[key] = list);
}
function bgNeon(ctx, t, w, h, th, idx) {
  th = th || THEMES[0]; idx = idx || 0;
  ctx.fillStyle = th.floor; ctx.fillRect(0, 0, w, h);
  ctx.strokeStyle = th.edge; ctx.fillStyle = th.wall; ctx.lineWidth = 2;
  for (const [x, y, ww, hh] of wallsFor(idx, w, h)) { ctx.globalAlpha = .5; DG.rr(ctx, x + 3, y + 3, ww, hh, 5); ctx.fill(); ctx.globalAlpha = .28; ctx.stroke(); }
  ctx.globalAlpha = 1;
  for (let i = 0; i < 16; i++) {                                // 止まらずに走る光(ラリーXの車の残光)
    const x = ((i * 59 + 23) % Math.max(1, w)), y = ((t * (70 + (i % 5) * 22) + i * 113) % (h + 120)) - 60;
    const g = ctx.createLinearGradient(0, y - 56, 0, y); g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(1, th.edge);
    ctx.globalAlpha = .38; ctx.fillStyle = g; ctx.fillRect(x - 1.5, y - 56, 3, 56); ctx.globalAlpha = 1;
  }
  const v = ctx.createRadialGradient(w / 2, h / 2, h * .25, w / 2, h / 2, h * .85); v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(0,0,0,.6)');
  ctx.fillStyle = v; ctx.fillRect(0, 0, w, h);
}
DG.Art.bgMenu = (ctx, t, w, h) => bgNeon(ctx, t, w, h, THEMES[0], 0);      // メニュー・ランキング・設定も同じネオン

function flagIcon(ctx, x, y, s, on) {
  ctx.fillStyle = on ? '#ffd400' : 'rgba(255,255,255,.18)'; ctx.fillRect(x, y, 2, s); ctx.beginPath(); ctx.moveTo(x + 2, y); ctx.lineTo(x + s * .9, y + s * .3); ctx.lineTo(x + 2, y + s * .6); ctx.closePath(); ctx.fill();
}

// ---------- パネル ----------
function drawPanel(ctx, P, px, t) {
  const st = P.stat, T = (s, x, y, size, col, al, mw) => DG.text(ctx, s, x, y, size, col, al, mw ? { maxW: mw } : undefined), c = '#e6eeff', sub = '#8fb2ee', W = PW - 12 - px;
  const th = themeOfFloor(st.floor);
  T('SCORE', px, 84, 13, sub); T(String(P.score), px, 112, 28, '#fff');
  T('BEST', px + 150, 84, 12, sub); T(String(Math.max(P.best, P.score)), px + 150, 104, 16, c);
  T(`FLOOR ${st.floor}`, px, 140, 17, th.shine); T(th.name, px + 84, 140, 12, sub, 'left', 200);
  for (let i = 0; i < 10; i++) flagIcon(ctx, px + i * 17, 148, 14, i < st.flags);
  T(`LV ${st.lv}`, px, 188, 15, '#ffe38a'); ctx.fillStyle = 'rgba(255,255,255,.14)'; DG.rr(ctx, px + 52, 175, W - 56, 12, 6); ctx.fill();
  ctx.fillStyle = '#ffd45a'; DG.rr(ctx, px + 52, 175, Math.max(6, (W - 56) * Math.min(1, st.xp / need(st.lv))), 12, 6); ctx.fill();
  T('FUEL', px, 210, 13, '#d9b6ff'); ctx.fillStyle = 'rgba(255,255,255,.14)'; DG.rr(ctx, px + 52, 197, W - 56, 12, 6); ctx.fill();
  ctx.fillStyle = st.fuel > 78 ? '#ff9af0' : '#b45cff'; DG.rr(ctx, px + 52, 197, Math.max(6, (W - 56) * Math.min(1, st.fuel / 100)), 12, 6); ctx.fill();
  T(st.fuel > 78 ? '次の駒は 煙幕!' : '満タンで 煙幕の駒', px + 52, 224, 11, '#d9b6ff');
  // S旗
  T('S旗', px, 252, 14, '#ffd400');
  for (let i = 0; i < 3; i++) { const on = i < st.sflags, sp = DG.Sprites.flagS(); ctx.save(); ctx.globalAlpha = on ? 1 : .2; ctx.imageSmoothingEnabled = false; ctx.drawImage(sp, px + 36 + i * 34, 238, 28, 28 * sp.height / sp.width); ctx.restore(); }
  T(st.sflags ? 'Space で爆発(敵が多いほど得)' : '3連鎖以上でもらえる', px + 140, 254, 11, st.sflags ? '#ffe9a0' : sub);
  // NEXT
  T('NEXT', px, 290, 13, sub);
  P.next.forEach((nx, i) => { const x = px + 4 + i * 56; drawCell(ctx, nx.b[1], x, 296, 32, 1, t); drawCell(ctx, nx.b[0], x, 330, 32, 1, t); if (nx.special) T('煙幕!', x + 16, 378, 11, '#ffd34d', 'center'); });
  // レーダー: 敵の数と、次の増援
  const rx = px + 124, ry = 286, rw = W - 124, rh = 90;
  ctx.fillStyle = 'rgba(0,10,30,.7)'; DG.rr(ctx, rx, ry, rw, rh, 8); ctx.fill(); ctx.strokeStyle = 'rgba(80,200,255,.6)'; ctx.lineWidth = 1.5; ctx.stroke();
  T('RADAR', rx + 8, ry + 14, 11, '#6fe0ff');
  const n = enemies(P).length; T(`敵 ${n}台`, rx + rw - 8, ry + 14, 13, n >= 10 ? '#ff7a7a' : '#fff', 'right');
  for (let x = 0; x < COLS; x++) { let h = 0; for (let y = 0; y < ROWS; y++) if (isEnemy(P.grid[y][x])) h++; ctx.fillStyle = '#ff5a5a'; const bh = Math.min(34, h * 6); ctx.fillRect(rx + 12 + x * ((rw - 24) / COLS), ry + 56 - bh, 14, bh); }
  const wt = Math.max(0, st.waveT), soon = wt < 3 && P.pending === 0;
  T(`増援 ${Math.ceil(wt)}秒 (+${waveSize(P)})`, rx + 8, ry + 82, 12, soon ? '#ff8a8a' : '#9fe8ff');
  if (st.bossAlive) T('BOSS 出現中!', rx + rw - 8, ry + 82, 12, '#ff6a6a', 'right');
  else if (st.flags >= 10) T('次はボス!', rx + rw - 8, ry + 82, 12, '#ff6a6a', 'right');
  // スキル
  T('SKILLS', px, 408, 13, sub);
  SKILL_ORDER.forEach((k, i) => {
    const y = 416 + i * 22, lv = st.skills[k], s = SK[k];
    ctx.fillStyle = s.dark; DG.rr(ctx, px, y, W, 19, 6); ctx.fill(); ctx.fillStyle = s.color; ctx.fillRect(px + 6, y + 6, 7, 7);
    T(s.name, px + 20, y + 14, 12, '#fff', 'left', 150);
    for (let j = 0; j < MAXLV; j++) { ctx.fillStyle = j < lv ? s.color : 'rgba(255,255,255,.2)'; ctx.fillRect(px + W - 8 - (MAXLV - j) * 12, y + 5, 9, 9); }
  });
  T(`消去 ${st.cleared || 0}  撃破 ${st.kills}  玉突き ${st.crashes}  最大連鎖 ${P.maxChain}`, px, 524, 12, c, 'left', W);
  P.hints.forEach((h, i) => T(h, px, 544 + i * 15, 11, sub));
  T('P 停止  M ミュート', px + 150, 575, 11, sub);
}

function drawPick(ctx, P, t) {
  const st = P.stat, pk = st.pick; if (!pk) return;
  ctx.fillStyle = 'rgba(2,4,16,.84)'; ctx.fillRect(0, 0, PW, 640);
  DG.text(ctx, 'LEVEL UP!', PW / 2, 100, 48, '#ffe36b', 'center', { stroke: '#4a2a00', sw: 8 });
  DG.text(ctx, `Lv ${st.lv}  ─  スキルを1つ えらぼう`, PW / 2, 138, 18, '#fff', 'center', { stroke: '#000', sw: 4 });
  pk.opts.forEach((k, i) => {
    const b = PICK_CARD(i), sel = pk.sel === i, s = SK[k], lv = st.skills[k];
    ctx.save(); ctx.translate(b.x + b.w / 2, b.y + b.h / 2 + (sel ? Math.sin(t * 5) * 3 : 0)); const sc = sel ? 1.05 : .96; ctx.scale(sc, sc); ctx.translate(-b.w / 2, -b.h / 2);
    ctx.shadowColor = sel ? s.color : 'rgba(0,0,0,.5)'; ctx.shadowBlur = sel ? 26 : 8;
    ctx.fillStyle = s.dark; DG.rr(ctx, 0, 0, b.w, b.h, 18); ctx.fill(); ctx.shadowBlur = 0;
    ctx.lineWidth = sel ? 5 : 2.5; ctx.strokeStyle = sel ? '#fff' : s.color; ctx.stroke();
    ctx.fillStyle = s.color; ctx.beginPath(); ctx.arc(b.w / 2, 56, 30, 0, TAU); ctx.fill();
    if (k === 'lance') { ctx.fillStyle = '#654514'; ctx.beginPath(); ctx.moveTo(b.w / 2, 36); ctx.lineTo(b.w / 2 + 11, 74); ctx.lineTo(b.w / 2, 66); ctx.lineTo(b.w / 2 - 11, 74); ctx.closePath(); ctx.fill(); }
    else if (k === 'smoke') { ctx.fillStyle = '#4a2870'; for (const [dx, dy, r] of [[-9, 6, 11], [9, 6, 10], [0, -6, 13]]) { ctx.beginPath(); ctx.arc(b.w / 2 + dx, 56 + dy, r, 0, TAU); ctx.fill(); } }
    else if (k === 'drift') { ctx.strokeStyle = '#18476d'; ctx.lineWidth = 5; ctx.beginPath(); ctx.arc(b.w / 2, 56, 15, .4, TAU - .4); ctx.stroke(); ctx.beginPath(); ctx.moveTo(b.w / 2 + 18, 44); ctx.lineTo(b.w / 2 + 6, 46); ctx.lineTo(b.w / 2 + 14, 56); ctx.closePath(); ctx.fillStyle = '#18476d'; ctx.fill(); }
    else { ctx.fillStyle = '#3b662b'; ctx.beginPath(); ctx.moveTo(b.w / 2, 34); ctx.lineTo(b.w / 2 + 17, 44); ctx.lineTo(b.w / 2 + 13, 70); ctx.lineTo(b.w / 2, 78); ctx.lineTo(b.w / 2 - 13, 70); ctx.lineTo(b.w / 2 - 17, 44); ctx.closePath(); ctx.fill(); }
    DG.text(ctx, s.name, b.w / 2, 112, 19, '#fff', 'center', { maxW: b.w - 16 });
    DG.text(ctx, s.short, b.w / 2, 134, 12, s.color, 'center');
    for (let j = 0; j < MAXLV; j++) { ctx.fillStyle = j < lv ? s.color : (j === lv ? '#fff' : 'rgba(255,255,255,.2)'); ctx.fillRect(b.w / 2 - 36 + j * 15, 148, 12, 12); }
    DG.text(ctx, `Lv ${lv} → ${lv + 1}`, b.w / 2, 182, 16, '#ffe9a0', 'center');
    const lines = wrapJa(s.desc(lv + 1), 12);                                  // 説明を折り返す
    lines.forEach((l, q) => DG.text(ctx, l, b.w / 2, 212 + q * 20, 13, '#fff', 'center'));
    ctx.restore();
  });
  DG.text(ctx, '← → えらぶ    Space / ↑ で決定    (タップでも)', PW / 2, 508, 15, '#cfe', 'center', { stroke: '#000', sw: 4 });
}
function pickKey(P, a) {
  const pk = P.stat.pick; if (!pk || pk.t < .25) return;                      // 出た直後は、落下中の連打で誤って決めないよう少し待つ
  if (a === 'left') { pk.sel = (pk.sel + pk.opts.length - 1) % pk.opts.length; Sfx.select(); }
  else if (a === 'right') { pk.sel = (pk.sel + 1) % pk.opts.length; Sfx.select(); }
  else if (a === 'act' || a === 'rot' || a === 'rotL') choosePick(P, pk.sel);
}
function tapPick(P, x, y) {
  const pk = P.stat.pick; if (!pk || pk.t < .25) return;
  pk.opts.forEach((k, i) => { const b = PICK_CARD(i); if (x >= b.x && x <= b.x + b.w && y >= b.y && y <= b.y + b.h) { if (pk.sel === i) choosePick(P, i); else { pk.sel = i; Sfx.select(); } } });
}
function updatePick(P, dt) {
  const pk = P.stat.pick; if (!pk) return; pk.t += dt;
  if (P.ai && pk.t > .35) choosePick(P, Math.floor(Math.random() * pk.opts.length));      // CPU・デモは、ランダムに選ぶ
}

// ---------- メニュー ----------
function drawMenu(ctx, t, o) {
  const th = THEMES[Math.floor(t / 9) % THEMES.length];
  bgNeon(ctx, t, 960, 640, th, Math.floor(t / 9) % THEMES.length);
  for (let i = 0; i < 6; i++) {                                        // 走る車(赤い群れを、青い車が引き連れる)
    const lane = 70 + i * 150, y = ((t * (90 + i * 14) + i * 170) % 760) - 60;
    DG.Sprites.drawCar(ctx, i % 3 === 1 ? 'blue' : 'red', lane, y, 52, Math.PI);
    if (i % 3 === 1) { ctx.fillStyle = 'rgba(190,130,255,.35)'; for (let k = 1; k < 5; k++) { ctx.beginPath(); ctx.arc(lane, y - k * 22, 9 + k * 2, 0, TAU); ctx.fill(); } }
  }
  DG.text(ctx, 'RALLY DROP', 480, 140, 76, '#7fd4ff', 'center', { stroke: '#0a1c4a', sw: 14 });
  DG.text(ctx, 'SURVIVORS', 480, 204, 46, '#ff6a8a', 'center', { stroke: '#3a0a1a', sw: 10 });
  DG.text(ctx, '煙幕で固めて、玉突きで焼く。落ち物 × ラリーX', 480, 248, 20, '#fff', 'center', { stroke: '#000', sw: 5 });
  const how = ['同じ色の車を5つ つなげて消す(ななめもつながる)(連鎖で大ダメージ)。赤い敵の車は、となりを消すと倒せる',
    '煙幕の駒が落ちると、まわりの敵がスピン。そこから玉突きで連鎖!   Space で S旗の大爆発',
    '敵を倒して旗を10本あつめると ボス「ギガ・レッド」。レベルアップでスキルを選ぼう'];
  how.forEach((s, i) => DG.text(ctx, s, 480, 310 + i * 28, 16, '#dfeaff', 'center', { stroke: '#000', sw: 4, maxW: 900 }));
  const p = 1 + Math.sin(t * 4) * .03, b = o.STARTBTN;
  ctx.save(); ctx.translate(b.x + b.w / 2, b.y + b.h / 2); ctx.scale(p, p); ctx.translate(-b.w / 2, -b.h / 2);
  ctx.shadowColor = '#ffd34d'; ctx.shadowBlur = 24; ctx.fillStyle = '#ffd34d'; DG.rr(ctx, 0, 0, b.w, b.h, 30); ctx.fill(); ctx.shadowBlur = 0;
  ctx.lineWidth = 4; ctx.strokeStyle = '#b57a00'; ctx.stroke(); DG.text(ctx, '▶ スタート', b.w / 2, 44, 32, '#4a2e00', 'center'); ctx.restore();
  const d = o.DEMOBTN; ctx.fillStyle = 'rgba(230,240,255,.9)'; DG.rr(ctx, d.x, d.y, d.w, d.h, 22); ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = '#5a8aff'; ctx.stroke();
  DG.text(ctx, '👀 デモ観戦 (D)', d.x + d.w / 2, d.y + 30, 19, '#1a2a5a', 'center');
  for (const [bb, lab, col, ink] of [[o.RANKBTN, '🏆 ランキング (R)', '#ffb02e', '#6a4a00'], [o.SETBTN, '⚙ 設定 (O)', '#8a7aff', '#3a2a7a']]) {
    ctx.fillStyle = 'rgba(255,255,255,.88)'; DG.rr(ctx, bb.x, bb.y, bb.w, bb.h, 17); ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = col; ctx.stroke();
    DG.text(ctx, lab, bb.x + bb.w / 2, bb.y + 23, 15, ink, 'center');
  }
  const bt = DG.Rank.bestTitle();
  if (bt) { DG.Rank.drawBadge(ctx, bt.game, bt.tier, 44, 44, 24, t); DG.text(ctx, 'あなたの称号', 84, 32, 11, '#fff', 'left', { stroke: '#000', sw: 3 }); DG.text(ctx, bt.title, 84, 54, 18, '#fff', 'left', { stroke: '#000', sw: 5 }); }
  DG.text(ctx, '← → ↓ 移動・加速   ↑ / Z 回転   Space S旗   Enter / タップで スタート   M ミュート   20秒放置でデモ', 480, 618, 13, '#fff', 'center', { stroke: '#000', sw: 4 });
}

// ---------- CPU 用の盤面評価(高いほどよい) ----------
function aiEval(g) {
  const seen = new Set(), at2 = (x, y) => (x >= 0 && x < COLS && y >= 0 && y < ROWS) ? g[y][x] : null, isE = k => k === ENEMY || k === BOSS; let s = 0;
  const clear = [], N8 = [[0, -1], [1, 0], [0, 1], [-1, 0], [1, 1], [1, -1], [-1, 1], [-1, -1]];
  for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++) {
    const k = g[y][x]; if (k == null || seen.has(y * COLS + x)) continue;
    if (k === SMOKE) { let n = 0; for (const [dx, dy] of N8) if (isE(at2(x + dx, y + dy))) n++; s += n * 24 - (n === 0 ? 16 : 0); continue; }
    if (k > 3) continue;
    const grp = [[x, y]]; seen.add(y * COLS + x);
    for (let i = 0; i < grp.length; i++) for (const [dx, dy] of N4) { const nx = grp[i][0] + dx, ny = grp[i][1] + dy; if (at2(nx, ny) === k && !seen.has(ny * COLS + nx)) { seen.add(ny * COLS + nx); grp.push([nx, ny]); } }
    if (grp.length >= MATCH) { s += 60 + grp.length * 12; clear.push(...grp); const en = new Set(); for (const [gx, gy] of grp) for (const [dx, dy] of N4) if (isE(at2(gx + dx, gy + dy))) en.add((gy + dy) * COLS + gx + dx); s += en.size * 26; }
    else s += grp.length === 3 ? 16 : grp.length === 2 ? 5 : 0;
  }
  const h = Array(COLS).fill(0), cut = new Set(clear.map(([x, y]) => y * COLS + x));
  for (let x = 0; x < COLS; x++) { for (let y = 0; y < ROWS; y++) if (g[y][x] != null && !cut.has(y * COLS + x)) { h[x] = ROWS - y; break; } }
  for (let x = 0; x < COLS; x++) { s -= h[x] * h[x] * 0.55; if (x === 2 && h[x] >= 9) s -= 60; if (x === 2 && h[x] >= 7) s -= 12; }
  for (let x = 0; x < COLS; x++) for (let y = 1; y < ROWS; y++) if (g[y][x] == null && g[y - 1][x] != null && !cut.has((y - 1) * COLS + x)) s -= 4;
  return s;
}

// ---------- ルール本体 ----------
const R = DG.smokechain = {
  aiKey: c => c.c, aiEval,
  id: 'smokechain', title: 'RALLY DROP', ghostAlpha: .42,        // 落ちる先(着地の予告)は半透明
  actLabel: 'S旗', nav: '本部', bgm: 'smoke', survivor: true,
  hello: 'ラリーX本部より入電。赤い車の群れが、この道を進軍中。引き連れて、煙幕で焼け!', garbageMsg: '敵の車が 行進してきた!',
  overMsg: '車は囲まれた…。もう一回、走る?(Enter)',
  levels: [{ name: 'ふつう', bonus: 1 }], levelCount: 1, setOptions() {}, levelName: P => 'FLOOR ' + ((P && P.stat && P.stat.floor) || 1),
  tagline: ['', ''], howto: ['', ''], sampleTypes: [{ c: 0 }],
  theme: { title: '#7fd4ff', titleStroke: '#0a1c4a', glass: 'rgba(4,8,28,.68)', line: 'rgba(90,180,255,.95)', grid: 'rgba(110,170,255,.12)', danger: 'rgba(255,60,90,.15)', card: 'rgba(6,10,34,.82)', msgBg: 'rgba(6,10,34,.82)', msgText: '#bfe0ff', flash: 'rgba(200,170,255,A)' },
  init(P) {
    P.stat = { floor: 1, flags: 0, kills: 0, killsFloor: 0, xp: 0, lv: 1, pendingLv: 0, skills: { lance: 0, smoke: 0, drift: 0, guard: 0 }, fuel: 0, sflags: 1, sblasts: 0, crashes: 0, cleared: 0,
      waveNo: 0, waveT: TUNE.first, lanceT: 0, guardUsed: 0, bossAlive: false, bossQueued: false, bossT: 0, gen: 0, blast: false, chainTurn: 0, pick: null };
  },
  makePiece, drawCell, drawPanel, drawPick, drawMenu, pickKey, tapPick, updatePick,
  drawBG: (ctx, t, w, h) => { const P = DG.engine && DG.engine.S.players[0], f = P && P.stat ? P.stat.floor : 1; bgNeon(ctx, t, w, h, themeOfFloor(f), (f - 1) % THEMES.length); },
  garbageCell(P) {
    const st = P && P.stat;
    if (st && st.bossQueued && !st.bossAlive) { st.bossQueued = false; st.bossAlive = true; st.bossT = 0; P.say('ボス「ギガ・レッド」出現!', 4, 9); P.shake = 14; return makeBoss(P); }
    return P ? makeEnemy(P) : { c: ENEMY, hp: 1, maxhp: 1, spin: 0 };
  },
  baseInterval: P => Math.max(0.16, 0.82 - (P.stat.floor - 1) * 0.045 - Math.min(0.2, P.time / 900)),
  fallScale: P => 1 + 0.12 * P.stat.skills.drift,
  onSpawn(P) {
    const nx = P.next[0];
    if (nx && nx.special && !P.stat.seenSmoke) { P.stat.seenSmoke = true; P.say('次は煙幕の駒。敵のとなりに落とすと、まわりの敵がスピンするよ。', 4, 4); }
    if (P.piece.special) P.say('煙幕だ! 敵がかたまっている所へ。', 3, 3);
  },
  update(P, dt) {
    const st = P.stat, nE = enemies(P).length;
    st.waveT -= dt; st.lanceT += dt;
    if (st.bossAlive) { st.bossT += dt; if (st.bossT >= 6 && P.pending === 0) { st.bossT = 0; P.pending = 2; } }
    if (st.waveT <= 0 && P.pending === 0) {
      if (st.flags >= 10 && !st.bossAlive && !st.bossQueued) { st.bossQueued = true; P.pending = 1 + 3; }       // 旗10本 → ボスと取り巻き
      else if (!st.bossAlive || st.waveNo % 2 === 0) { P.pending = waveSize(P); }
      st.waveNo++; st.waveT = waveInterval(P);
    }
    if (P.ai && st.sflags > 0 && P.piece && (P.piece.age || 0) > .8 && (nE >= 7 || P.dangerRow() <= 3)) R.act(P);     // CPU・デモは、敵が多いときに S旗を使う
  },
  act(P) {   // S旗を使う: 全敵に大ダメージ+スピン。落ちている駒はいったんしまって、爆発のあとに戻す
    const st = P.stat; if (P.phase !== 'play' || !P.piece) return;
    if (st.sflags <= 0) { P.say('S旗がない。3連鎖以上でもらえるよ。', 2, 3); return; }
    st.sflags--; st.blast = true; P.stashPiece(); P.chain = 0; P.turnDone = false; P.lockScore = P.score;
    P.phase = 'resolve'; P.res = { stage: 'settle', t: 0 }; Sfx.zap();
  },
  beforeSpawn(P) {
    const st = P.stat;
    if (st.chainTurn >= 3 && st.sflags < 3) { st.sflags++; Sfx.grow(); P.say(`${st.chainTurn}連鎖! S旗をゲット(${st.sflags}/3)`, 2.5, 6); }
    st.chainTurn = 0;
    if (st.skills.lance > 0 && st.lanceT >= lanceSec(st.skills.lance) && enemies(P).length) {      // 自動攻撃
      st.lanceT = 0; const killed = fireLance(P);
      if (killed) { P.applyGravity(); P.phase = 'resolve'; P.res = { stage: 'settle', t: 0 }; return true; }
    }
    if (st.pendingLv > 0 && P.phase !== 'over') { if (startPick(P)) return true; }
    return false;
  },
  onGameOver(P) {
    const st = P.stat;
    if (st.skills.guard > st.guardUsed) { st.guardUsed++; guardWipe(P); return true; }
    return false;
  },
  step(P) {
    const st = P.stat;
    if (st.blast) {                                                             // S旗の爆発(いちばん先)
      st.blast = false;
      return {
        pre: .55, post: .2,
        mark() { for (const [x, y] of enemies(P)) P.grid[y][x].clr = 1; Sfx.zap(); P.flash = .9; },
        apply() {
          const list = enemies(P), n = list.length, mult = DG.chainMult(P.chain); st.sblasts++;
          P.score += Math.round(n * 100 * mult * (1 + n / 8));
          for (const [x, y] of list) { const c = P.grid[y][x]; if (!c) continue; c.clr = 0; P.burst(x, y, '#ffd400', 8); if (!damageEnemy(P, x, y, 2, mult)) { const o = P.grid[y][x]; if (o) o.spin = Math.max(o.spin, 1); } }
          P.flash = 1.2; P.shake = 16; Sfx.clear(P.chain + 4);
          P.say(n ? `S旗 大爆発! ${n}台に大ダメージ(密集ボーナス)` : 'S旗… でも敵がいなかった', 3.5, 8);
        },
      };
    }
    const smokes = []; for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++) { const c = P.grid[y][x]; if (c && c.c === SMOKE) smokes.push([x, y]); }
    if (smokes.length) {                                                         // 煙幕: まわりの敵をスピンさせる
      return {
        pre: .35, post: .1,
        mark() { for (const [x, y] of smokes) P.grid[y][x].clr = 1; },
        apply() {
          const gen = 2 + (st.skills.smoke >= 3 ? 1 : 0), rad = 1 + (st.skills.smoke >= 4 ? 1 : 0); let hit = 0;
          for (const [x, y] of smokes) {
            P.grid[y][x] = null; P.burst(x, y, '#c78cff', 12);
            for (let dy = -rad; dy <= rad; dy++) for (let dx = -rad; dx <= rad; dx++) { const c = at(P, x + dx, y + dy); if (isEnemy(c)) { if (!(c.spin > 0)) hit++; c.spin = Math.max(c.spin, gen); } }
          }
          P.score += 20 * hit; Sfx.materialize();
          P.say(hit ? `煙幕! ${hit}台がスピン。ここから玉突き…` : '煙幕は空振り。敵のとなりに落とそう', 3, hit ? 5 : 3);
        },
      };
    }
    const spinners = []; for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++) { const c = P.grid[y][x]; if (isEnemy(c) && c.spin > 0) spinners.push([x, y]); }
    if (spinners.length) {                                                       // 玉突き: スピン中の敵がぶつかって、となりにダメージ+スピンが伝わる
      return {
        pre: .32, post: .08,
        mark() { for (const [x, y] of spinners) P.grid[y][x].clr = 1; },
        apply() {
          const mult = DG.chainMult(P.chain); st.crashes += spinners.length; let n = 0;
          for (const [x, y] of spinners) {
            const c = P.grid[y][x]; if (!c) continue; const g = c.spin; c.spin = 0; c.clr = 0; P.burst(x, y, '#ffe36b', 8); n++;
            damageEnemy(P, x, y, 1, mult);
            for (const [dx, dy] of N4) { const o = at(P, x + dx, y + dy); if (isEnemy(o) && !(o.spin > 0)) { damageEnemy(P, x + dx, y + dy, 1, mult); const o2 = at(P, x + dx, y + dy); if (o2 && g > 1) o2.spin = g - 1; } }
          }
          P.shake = Math.max(P.shake, 7); Sfx.clear(P.chain + 1);
          P.say(`CRASH! 玉突き ${n}台`, 2.5, 5);
        },
      };
    }
    const groups = findMatches(P); if (!groups.length) return null;
    const near = enemiesAround(P, groups);
    return {
      pre: .35, post: 0,
      mark() { for (const g of groups) for (const [x, y] of g) P.grid[y][x].clr = 1; },
      apply() {
        const mult = DG.chainMult(P.chain); let n = 0;
        for (const g of groups) { let m = 0; for (const [x, y] of g) { const c = P.grid[y][x]; if (!c) continue; P.burst(x, y, TILE[c.c] || '#fff', 8); P.grid[y][x] = null; m++; } n += m; P.score += Math.round(10 * m * mult * (1 + (m - MATCH) * .25)); st.fuel = Math.min(100, st.fuel + 3); }
        st.cleared += n; gainXp(P, groups.length);
        for (const [x, y] of near) { const c = P.grid[y][x]; damageEnemy(P, x, y, c && c.spin > 0 ? 2 : 1, mult); }          // となりの敵に、ダメージ(スピン中は2倍)
        st.chainTurn = Math.max(st.chainTurn, P.chain + 1); P.flash = .5; Sfx.clear(P.chain);
        if (near.length) P.say(`${near.length}台に ダメージ!`, 1.6, 3); else if (P.chain >= 1) P.say(`${P.chain + 1}連鎖!`, 1.6, 3);
      },
    };
  },
  drawBoardExtra(ctx, P, t) {
    const st = P.stat;
    if (st.waveT < 2.6 && P.pending === 0 && P.phase !== 'over') { ctx.globalAlpha = .5 + .5 * Math.abs(Math.sin(t * 8)); DG.text(ctx, '▼ 増援が来る! ▼', BX + COLS * CELL / 2, BY + 22, 17, '#ff7a7a', 'center', { stroke: '#300', sw: 4 }); ctx.globalAlpha = 1; }
  },
};
DG.smokechainTest = { findMatches, enemies, damageEnemy, THEMES, SK, need, waveSize, waveInterval };
})();
