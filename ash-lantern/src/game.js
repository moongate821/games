'use strict';
/* 灰の灯火と、約束の旅 — 序章「声の残る村」 */
const W = 960, H = 540;
const cv = document.getElementById('c'), ctx = cv.getContext('2d');
cv.width = W; cv.height = H;
const IMG = {};
const FONT = '"Yu Gothic UI","Meiryo","Hiragino Sans","Noto Sans JP",sans-serif';

/* ================= 入力 ================= */
const src = { kb: new Set(), gp: new Set(), tc: new Set() };
let edge = new Set();
const isHeld = k => src.kb.has(k) || src.gp.has(k) || src.tc.has(k);
function setKey(source, k, down) {
  const was = isHeld(k);
  if (down) src[source].add(k); else src[source].delete(k);
  if (!was && isHeld(k)) edge.add(k);
}
const KEYMAP = { ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right', w: 'up', s: 'down', a: 'left', d: 'right',
  W: 'up', S: 'down', A: 'left', D: 'right', z: 'ok', Z: 'ok', Enter: 'ok', ' ': 'ok', x: 'cancel', X: 'cancel', Escape: 'cancel', m: 'cancel', M: 'cancel' };
addEventListener('keydown', e => { const k = KEYMAP[e.key]; if (k) { e.preventDefault(); if (!e.repeat) setKey('kb', k, true); } });
addEventListener('keyup', e => { const k = KEYMAP[e.key]; if (k) { e.preventDefault(); setKey('kb', k, false); } });
addEventListener('blur', () => src.kb.clear());
document.querySelectorAll('#pad .b').forEach(b => {
  const k = b.dataset.k;
  const down = e => { e.preventDefault(); b.classList.add('on'); setKey('tc', k, true); };
  const up = e => { e.preventDefault(); b.classList.remove('on'); setKey('tc', k, false); };
  b.addEventListener('pointerdown', down); b.addEventListener('pointerup', up);
  b.addEventListener('pointercancel', up); b.addEventListener('pointerleave', up);
});
function pollPad() {
  const pads = navigator.getGamepads ? navigator.getGamepads() : [];
  const on = new Set();
  for (const p of pads) {
    if (!p) continue;
    const b = i => p.buttons[i] && p.buttons[i].pressed;
    const ax = p.axes[0] || 0, ay = p.axes[1] || 0;
    if (b(12) || ay < -0.5) on.add('up'); if (b(13) || ay > 0.5) on.add('down');
    if (b(14) || ax < -0.5) on.add('left'); if (b(15) || ax > 0.5) on.add('right');
    if (b(0)) on.add('ok'); if (b(1) || b(9)) on.add('cancel');
  }
  for (const k of ['up', 'down', 'left', 'right', 'ok', 'cancel']) setKey('gp', k, on.has(k));
}

/* ================= 状態 ================= */
const DIRS = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] };
let G = { mode: 'title', t: 0, busy: false, fade: 0, fadeTo: 0, fadeSpeed: 0.04, shake: 0, tint: 0, flash: 0 };
let S = null; // セーブ対象
const tweens = [];
let okWait = null;
let map = null, actors = [], statics = [], solid = null, warps = [], zones = [], inters = [];

function newState() {
  return { gold: 180, shopStock: {}, st: 'start', flags: {}, items: { potion: 0, kit: 0, bread: 0, ether: 0 }, hp: 50, mhp: 50, lv: 0, allies: [], gear: {}, equip: {}, map: 'W', x: 7, y: 5, dir: 'down' };
}
const stIdx = s => STAGES.indexOf(S.st);
const atLeast = s => stIdx() >= STAGES.indexOf(s);
function setStage(s) { S.st = s; G.obj = OBJECTIVE[s]; }

/* ================= スクリプト用ユーティリティ ================= */
function sleep(frames) { return new Promise(r => tweens.push({ t: 0, d: frames, step() { }, done: r })); }
function tween(d, fn) { return new Promise(r => tweens.push({ t: 0, d, step: fn, done: r })); }
function waitOk() { return new Promise(r => { okWait = r; }); }
async function fade(to, speed) { G.fadeTo = to; G.fadeSpeed = speed || 0.04; while (Math.abs(G.fade - G.fadeTo) > 0.001) await sleep(1); }
async function moveActor(a, tx, ty, speed) {
  speed = speed || 0.09;
  while (Math.abs(a.x - tx) > 1e-3 || Math.abs(a.y - ty) > 1e-3) {
    const dx = tx - a.x, dy = ty - a.y;
    if (Math.abs(dx) >= Math.abs(dy)) a.dir = dx > 0 ? 'right' : 'left'; else a.dir = dy > 0 ? 'down' : 'up';
    const d = Math.hypot(dx, dy), s = Math.min(speed, d);
    a.x += dx / d * s; a.y += dy / d * s; a.walk = (a.walk || 0) + s;
    await sleep(1);
  }
  a.walk = 0;
}
async function walkPath(a, pts, speed) { for (const p of pts) await moveActor(a, p[0], p[1], speed); }
function face(a, tx, ty) { const dx = tx - a.x, dy = ty - a.y; a.dir = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : (dy > 0 ? 'down' : 'up'); }
function getActor(id) { return actors.find(a => a.id === id); }
function addActor(o) { const a = Object.assign({ dir: 'down', solid: true, scale: 1.0, walk: 0 }, o); if (a.scale == null) a.scale = 1.0; if (!a.sheet && a.img) a.sheet = 'walk_' + a.img.replace(/^npc_/, ''); actors.push(a); return a; }
function removeActor(id) { actors = actors.filter(a => a.id !== id); }
function shake(n) { G.shake = n; }
function setTint(v) { G.tint = v; }

/* 会話 */
function wrapText(text, maxW) {
  ctx.font = '25px ' + FONT;
  const lines = [];
  for (const para of String(text).split('\n')) {
    let cur = '';
    for (const ch of para) {
      if (ctx.measureText(cur + ch).width > maxW) { lines.push(cur); cur = ch; } else cur += ch;
    }
    lines.push(cur);
  }
  return lines;
}
function say(name, text) {
  return new Promise(r => {
    const lines = wrapText(text, W - 120);
    G.dlg = { name, lines, full: lines.join('').length, shown: 0, resolve: r };
  });
}
function narrate(text) { return say('', text); }
function choose(list, prompt, opts) {   // opts: { cancel: true → Xキーで -1 を返す, desc: i => 選択中の説明文 }
  return new Promise(r => { G.choice = { list, idx: 0, prompt: prompt || '', resolve: r, cancel: !!(opts && opts.cancel), desc: opts && opts.desc, icons: opts && opts.icons }; });
}
function toast(text) { G.toast = { text, t: 150 }; }

/* ================= マップ構築 ================= */
function isSolidTile(x, y) {
  if (x < 0 || y < 0 || x >= map.w || y >= map.h) return true;
  if (solid[y][x]) return true;
  return false;
}
function actorAt(x, y) { return actors.find(a => a.solid && a.vis !== false && Math.round(a.x) === x && Math.round(a.y) === y && !a.moving); }
// A map's nominal start can itself be occupied by a stage-specific actor.
function safeLoadPosition(preferred) {
  const [sx, sy] = preferred;
  for (let r = 0; r <= map.w + map.h; r++) {
    for (let dy = -r; dy <= r; dy++) {
      const dx = r - Math.abs(dy);
      for (const x of dx ? [sx - dx, sx + dx] : [sx]) {
        const y = sy + dy;
        if (!isSolidTile(x, y) && !actorAt(x, y)) return [x, y];
      }
    }
  }
  return null;
}

function setMapData(id) {
  const m = MAPS[id];
  map = { id, name: m.name, indoor: m.indoor, tiles: m.tiles, w: m.tiles[0].length, h: m.tiles.length, tileArt: m.tileArt, skin: m.skin, dim: m.dim, bgm: m.bgm, points: m.points || {} };
  const solidChars = m.solid || 'wx';
  solid = Array.from({ length: map.h }, (_, y) => Array.from({ length: map.w }, (_, x) => solidChars.includes(m.tiles[y][x])));
  statics = []; warps = []; zones = []; inters = [];
  if (m.indoor) buildWorkshopStatics(id); else buildOutdoorStatics(id);
  applyRegistry(id);
}
function block(x, y, w, h) { for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) if (solid[y + j]) solid[y + j][x + i] = true; }

function buildOutdoorStatics(id) {   // 灯守村(V)・川霧の町(K)。配置は layout.js の LAYOUT[id]
  const L = LAYOUT[id] || {};
  const add = (o) => statics.push(o);
  // 建物 (x,y = 足元の左端タイル。接地は2行)
  const bld = (img, x, y, flip, doorX, art, artWidth, artOffsetX) => {   // art = 専用画像の名前(ファイルがあれば img の代わりに使う)
    const im = () => (art && IMG[art]) || IMG[img];
    add({ y: (y + 1) * T, draw(c) {
      const i = im(); if (!i) return; const dw = art && IMG[art] && artWidth ? artWidth : 6 * T;
      // 専用画像の寸法は代替画像と異なる。代替画像専用の切り出しは流用しない。
      const crop = art && IMG[art] ? [0, 0, i.width, i.height] : img === 'bld_workshop_front' ? [60, 32, 1257, 1034] : img === 'bld_hall_front' ? [22, 28, 1339, 1059] : [0, 0, i.width, i.height];
      const dh = crop[3] * dw / crop[2], dx = x * T + (6 * T - dw) / 2 + (art && IMG[art] ? (artOffsetX || 0) : 0) + (img === 'bld_workshop_front' && !flip && !(art && IMG[art]) ? 15 : 0);
      c.save(); if (flip) { c.translate(dx * 2 + dw, 0); c.scale(-1, 1); }
      c.drawImage(i, ...crop, dx, (y + 1) * T - dh, dw, dh); c.restore();
    } });
    block(x, y - 1, 6, 2);
    if (doorX != null) solid[y][doorX] = false;
  };
  for (const b of (L.buildings || [])) {
    bld(b.img, b.x, b.y, b.flip, b.door != null ? b.door : null, b.art, b.artWidth, b.artOffsetX);
    if (b.shopName) add({ y: (b.y + 1) * T + 1, draw(c) { const x = b.door * T + T / 2; c.save(); c.font = 'bold 14px ' + FONT; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillStyle = '#302016'; c.fillRect(x - 27, b.y * T - 35, 54, 20); c.strokeStyle = '#d2a760'; c.strokeRect(x - 27, b.y * T - 35, 54, 20); c.fillStyle = '#fff0c5'; c.fillText(b.shopName, x, b.y * T - 25); c.restore(); } });
    if (b.kind === 'workshop') warps.push({ x: b.door, y: b.y, to: 'W', tx: 6, ty: 8, dir: 'up' });
    else if (b.kind === 'hall') inters.push({ x: b.x + 3, y: b.y, w: 1, fn: async () => { await narrate(atLeast('furnace_taken') ? '公民館の扉。中から人の気配がする。' : '村の公民館。灯火祭の準備で荷物が積まれている。'); } });
    else if (b.kind === 'locked') inters.push({ x: b.x + (b.img === 'bld_workshop_front' ? (b.flip ? 4 : 2) : 3), y: b.y, w: 1, fn: async () => { await narrate('扉には鍵がかかっている。留守のようだ。'); } });
    else if (b.kind === 'talk') inters.push({ x: b.x + (b.img === 'bld_workshop_front' ? (b.flip ? 4 : 2) : 3), y: b.y, w: 1, fn: () => play(STORY[b.story]) });
  }
  // 木・小物
  const prop = (img, x, y, sc, ox, oy, heightScale) => {
    add({ y: (y + 1) * T + (oy || 0), draw(c) { const i = IMG[img]; if (!i) return; const dw = i.width * sc, dh = i.height * (heightScale || sc); c.drawImage(i, x * T + T / 2 - dw / 2 + (ox || 0), (y + 1) * T - dh + (oy || 0), dw, dh); } });
    block(x, y, 1, 1);
  };
  (L.lamps || []).forEach(([x, y]) => {
    add({ y: (y + 1) * T, draw(c) {
      const dh = 120;
      if (id === 'C15_ROAD' && IMG.prop_road_lantern_row) {
        const i = IMG.prop_road_lantern_row, dw = dh * i.width / i.height;
        c.drawImage(i, x * T + T / 2 - dw / 2, (y + 1) * T - dh, dw, dh); return;
      }
      const i = IMG.prop_lamp_tall; if (!i) return; const dw = dh * 360 / 1491;
      c.drawImage(i, 407, 23, 234, 1491, x * T + T / 2 - dw * 0.22, (y + 1) * T - dh, dw, dh);
    } });
    block(x, y, 1, 1);
  });
  (L.barrels || []).forEach(p => prop('prop_barrel', p[0], p[1], 1));
  (L.signs || []).forEach(p => prop('prop_sign', p[0], p[1], 1));
  (L.trees || []).forEach(p => {
    add({ y: (p[1] + 1) * T, draw(c) { const i = IMG.prop_tree; if (!i) return; const dw = p[2] || 130, dh = i.height * dw / i.width; c.drawImage(i, p[0] * T + T / 2 - dw / 2, (p[1] + 1) * T - dh + 6, dw, dh); } });
    block(p[0], p[1], 1, 1);
  });
  // 村の生活小物。見た目と一緒に足元の当たり判定を作る。
  for (const d of (L.decor || [])) {
    if (d.art && IMG[d.art]) {   // 専用画像は横幅 aw で描く。blockW があれば足元の判定幅も合わせる
      add({ y: (d.y + 1) * T, draw(c) { const i = IMG[d.art]; if (!i) return; const q = d.crop, crop = q && i.width >= q[0] + q[2] && i.height >= q[1] + q[3] ? q : [0, 0, i.width, i.height], dw = d.aw || 96, dh = crop[3] * dw / crop[2], px = d.x * T + T / 2; c.save(); if (d.flip) { c.translate(px * 2, 0); c.scale(-1, 1); } c.drawImage(i, ...crop, px - dw / 2, (d.y + 1) * T - dh, dw, dh); c.restore(); } });
      if (!d.noblock) { const bw = d.blockW || 1; block(d.x - Math.floor(bw / 2), d.y, bw, 1); }
    } else if (d.img) prop(d.img, d.x, d.y, d.scale);
  }
  // 外周の木は位置に応じて大きさを少し変え、同じ樹木の反復を和らげる。
  const border = (x, y) => add({ y: (y + 1) * T, draw(c) { const i = IMG.prop_tree; if (!i) return; const dw = [112, 124, 138, 150][Math.abs((x * 13 + y * 7) % 4)], dh = i.height * dw / i.width; c.drawImage(i, x * T + T / 2 - dw / 2, (y + 1) * T - dh + 10, dw, dh); } });
  if (L.border !== 'none') {   // 外周の木(甲板・海・浮島などは 'none')。gap / gap2 = 森をあけて道を通す所
    for (let x = 0; x < map.w; x += 2) { border(x + (x % 4 ? 1 : 0), 1); border(x + 1, 0); border(x, map.h - 1); border(x + 1 - (x % 4 ? 0 : 1), map.h - 2); }
    const gps = [L.gap, L.gap2].filter(Boolean); if (!gps.length) gps.push({ side: 'e', y0: 99, y1: 99 });
    const inGap = (side, y) => gps.some(g => g.side === side && y >= g.y0 && y <= g.y1);
    for (let y = 2; y < map.h - 2; y += 2) { if (!inGap('w', y)) { border(0, y); border(1, y + 1); } if (!inGap('e', y)) { border(map.w - 2, y); border(map.w - 1, y + 1); } }
  }
  if (id === 'V') {
    // 灯火炉
    add({ y: 14 * T + 40, draw: drawFurnace });
    block(19, 13, 2, 2);
    inters.push({ x: 19, y: 13, w: 2, h: 2, fn: () => furnaceTalk() });
    // ゾーン
    zones.push({ x: 15, y: 12, w: 3, h: 4, cond: () => S.st === 'tools_obtained', fn: () => sceneCollection() });
    zones.push({ x: 11, y: 10, w: 4, h: 3, cond: () => S.st === 'mayor_spoken' && !S.flags.potion, fn: () => sceneKid() });
    zones.push({ x: 31, y: 13, w: 1, h: 2, cond: () => S.st !== 'furnace_taken' && !atLeast('wolf_defeated'), fn: () => sceneBarrier() });
    zones.push({ x: 34, y: 13, w: 3, h: 2, cond: () => S.st === 'furnace_taken', fn: () => sceneWolf() });
    zones.push({ x: 31, y: 13, w: 1, h: 2, cond: () => atLeast('wolf_defeated') && !S.flags.back_barrier && false, fn: () => { } });
    zones.push({ x: 38, y: 13, w: 2, h: 2, cond: () => atLeast('prologue_complete'), fn: () => play(STORY.toKirimachi) });
  } else if (id === 'K') buildKirimachiEvents();
}

function buildKirimachiEvents() {
  warps.push({ x: 1, y: 6, to: 'V', tx: 37, ty: 13, dir: 'left' }, { x: 1, y: 7, to: 'V', tx: 37, ty: 14, dir: 'left' });
  // 橋へは、ミラと話して準備ができるまで入れない
  zones.push({ x: 19, y: 9, w: 4, h: 1, cond: () => atLeast('c1_arrive') && !atLeast('c1_ready'), fn: () => play(STORY.c1_barrier) });
  zones.push({ x: 19, y: 8, w: 4, h: 1, cond: () => S.st === 'c1_ready' && !S.flags.c1_slimes, fn: () => play(STORY.c1_slimes) });
  zones.push({ x: 20, y: 9, w: 2, h: 2, cond: () => atLeast('c1_ready') && !S.flags.c1_boss, fn: () => play(STORY.c1_boss) });
}
function placeKirimachi() {
  const f = S.flags;
  addActor({ id: 'ferry', img: 'npc_innkeeper', sheet: 'walk_ferry', x: 19, y: 8, dir: 'right', name: '渡し守', talk: () => play(STORY.c1_ferry) });
  if (!f.joined_mira) addActor({ id: 'mira', img: 'npc_mira', sheet: 'walk_mira', x: 22, y: 8, dir: 'left', name: 'ミラ', talk: () => play(STORY.c1_mira) });
  addActor({ id: 'mother', img: 'npc_mayor', sheet: 'walk_mother', x: 9, y: 6, dir: 'left', name: '母親', talk: () => play(STORY.c1_mother) });
  addActor({ id: 'kidsick', img: 'npc_kid', x: 6, y: 6, dir: 'right', name: '子ども', talk: () => play(STORY.c1_kidsick) });
  addActor({ id: 'elder', img: 'npc_carpenter', sheet: 'walk_elder', x: 31, y: 6, dir: 'down', name: 'おじいさん', talk: () => play(STORY.c1_elder) });
  addActor({ id: 'daughter', img: 'npc_blacksmith', sheet: 'walk_hana', x: 33, y: 6, dir: 'left', name: 'ハナ', talk: () => play(STORY.c1_daughter) });
  if (f.c1_boss) addActor({ id: 'doctor', img: 'npc_granny', sheet: 'walk_doctor', x: 27, y: 20, dir: 'down', name: '診療所の医師', talk: () => play(STORY.c1_doctor) });
}
async function showCard(title, sub) {
  await fade(1, 0.04);
  G.card = { title, sub, a: 0 }; await sleep(30);
  while (G.card.a < 1) { G.card.a += 0.02; await sleep(1); }
  await sleep(60); await waitOk(); G.card = null;
  await fade(0, 0.04);
}
async function fieldBattle(ids) {   // 台本から呼ぶ戦闘。終わったらフィールドに戻る
  await fade(1, 0.06);
  await runBattle(ids);
  G.mode = 'field'; Snd.bgm(fieldMusic());
  G.fade = 1; G.fadeTo = 1; await fade(0, 0.06);
}

function buildWorkshopStatics(id) {
  id = id || 'W';
  const conceptRoom = (typeof CONCEPT_ROOMS !== 'undefined' && CONCEPT_ROOMS[id] && IMG[CONCEPT_ROOMS[id].image]) || (id === 'W' && IMG.bg_workshop_concept) || (id === 'C3_WAREHOUSE' && IMG.bg_harbor_warehouse) || (id === 'C5_TUNNEL' && IMG.bg_mine_tunnel_concept) || (id === 'C8_LAB' && IMG.bg_observatory_lab_concept) || (id === 'C4_CASTLE' && IMG.bg_castle_audience_concept) || (id === 'C7_INN' && IMG.bg_inn_remembrance) || (id === 'C4_ESCAPE' && IMG.bg_escape_drain) || (id === 'C14_HEART' && IMG.bg_furnace_heart_concept);
  const add = (o) => statics.push(o);
  // 壁(上2行)
  add({ y: -100, draw(c) { if (!conceptRoom) drawWorkshopWall(c); } });
  // 家具(画像素材15から切り出した img/furn_*.png)。footprint=タイル単位の当たり判定、描画は足元基準
  const furn = (img, fx, fy, fw, fh, dw, o) => {
    o = o || {};
    add({ y: (fy + fh) * T + (o.dy || 0), draw(c) {
      if (conceptRoom) return;
      const key = (o.art && IMG[o.art]) ? o.art : img, i = IMG[key]; if (!i) return;
      const crops = { furn_table_orthogonal: [158, 184, 1173, 734], furn_bed_orthogonal: [143, 93, 859, 1190], furn_bench_orthogonal: [13, 25, 1369, 1075], furn_chair_orthogonal: [108, 97, 783, 1374], furn_bookshelf_orthogonal: [108, 31, 989, 1255] };
      const crop = (key === img && crops[img]) || [0, 0, i.width, i.height];
      const cx = (fx + fw / 2) * T + (o.ox || 0), by = (fy + fh) * T - 2;
      const topMargin = key === 'prop_voice_furnace' ? T : 8;
      const width = key !== img ? Math.min(dw, Math.max(1, by - topMargin) * crop[2] / crop[3]) : dw;
      const h = crop[3] * width / crop[2];
      c.save();
      if (o.flip) { c.translate(cx * 2, 0); c.scale(-1, 1); }
      c.drawImage(i, ...crop, cx - width / 2, by - h, width, h);
      c.restore();
      if (o.after) o.after(c, cx, by - h);
    } });
    if (!o.noblock) block(fx, fy, fw, fh);
  };
  const WL = LAYOUT[id] || {};
  if (WL.rug && !conceptRoom) add({ y: -90, draw(c) { const i = IMG.furn_rug_orthogonal; if (i) c.drawImage(i, 121, 110, 1293, 795, WL.rug.x * T, WL.rug.y * T, WL.rug.w, 795 * WL.rug.w / 1293); } });
  add({ y: -80, draw(c) { if (conceptRoom) return; for (const w of (WL.wall || [])) { if (id === 'W' && w.img === 'furn_toolrack_orthogonal' && IMG.furn_bench_concept) continue; const i = IMG[w.img]; if (i) { const crop = w.img === 'furn_toolrack_orthogonal' ? [6, 21, 1525, 974] : w.img === 'furn_jarshelf_orthogonal' ? [165, 49, 1822, 611] : [0, 0, i.width, i.height]; c.drawImage(i, ...crop, w.x * T, w.y, w.w, crop[3] * w.w / crop[2]); } } } });
  for (const f of (WL.furn || [])) furn(f.img, f.x, f.y, f.w, f.h, f.dw, { flip: f.flip, dy: f.dy, art: f.art, after: f.overlay ? OVERLAYS[f.overlay] : null });
  if (id === 'W' && IMG.bg_workshop_concept) add({ y: 4*T, draw(c) { const bell=IMG.item_bell, kit=IMG.item_repair; if (bell) c.drawImage(bell, 3.57*T, 3.35*T, 14, 14*bell.height/bell.width); if (kit) c.drawImage(kit, 10.55*T, 3.21*T, 24, 24*kit.height/kit.width); } });
  // Chapter decorations can also be placed indoors (the shared asset map uses decor).
  for (const d of (WL.decor || [])) {
    if (id === 'C4_CASTLE' && IMG.bg_castle_audience_concept) continue;
    if (id === 'C14_HEART' && IMG.bg_furnace_heart_concept) continue;
    if (!(d.art && IMG[d.art])) continue;
    add({ y: (d.y + 1) * T, draw(c) {
      const im = IMG[d.art]; if (!im || (d.visible && !d.visible())) return;
      const dw = d.aw || 96, dh = im.height * dw / im.width, px = d.x * T + T / 2;
      c.save(); if (d.flip) { c.translate(px * 2, 0); c.scale(-1, 1); }
      c.drawImage(im, px - dw / 2, (d.y + 1) * T - dh, dw, dh); c.restore();
    } });
    if (!d.noblock) { const bw = d.blockW || 1; block(d.x - Math.floor(bw / 2), d.y, bw, 1); }
  }
  if (id === 'W') warps.push({ x: 6, y: 9, to: 'V', tx: 12, ty: 10, dir: 'down', cond: () => true, pre: async () => { if (S.st === 'start') { await narrate('(机の鈴を見てから行こう)'); return false; } return true; } });
  for (const f of (WL.furn || [])) { if (f.shop) inters.push({ x: f.x, y: f.y, w: f.w, h: f.h, optional: true, fn: () => openShop(f.shop) }); else if (f.act && ACTS[f.act]) inters.push({ x: f.x, y: f.y, w: f.w, h: f.h, fn: ACTS[f.act] }); else if (f.say) inters.push({ x: f.x, y: f.y, w: f.w, h: f.h, fn: say1(f.say) }); else if (f.story) inters.push({ x: f.x, y: f.y, w: f.w, h: f.h, fn: () => play(STORY[f.story]) }); }
}

const say1 = s => async () => { await narrate(s); };
const ACTS = {  // 家具を調べたときの動作(layout.js の act)
  inn_rest: () => restAtInn(),
  bell: () => sceneBell(), kit: () => sceneKit(),
  bed: say1('寝台。妹が使っていた頃のまま、毛布だけが畳んである。'),
  stove: say1('鉄のストーブに、小さな火が燃えている。今日の仕事は、ランタンの修理だ。'),
  shelf: say1('部品と古い本の棚。ねじや金具が、種類ごとに小さな箱に分けてある。'),
  table: say1('食事や図面を広げる机。ランタンの灯りが揺れている。'),
  crate: say1('部品を入れた木箱。'), barrel: say1('樽。修理用の油が入っている。'), chest: say1('道具箱。古い部品がしまってある。')
};
const OVERLAYS = {  // 家具の上に載せる物。(c, 家具の中心x, 家具の上端y)
  // 机の左側の天板に置く。カップや中央の布と重ならない小さな鈴。
  bell(c, cx, top) { const i = IMG.item_bell; if (i) c.drawImage(i, cx - 35, top + 9, 16, 16 * i.height / i.width); },
  kit(c, cx, top) { const i = IMG.item_repair; if (i) c.drawImage(i, cx - 20, top + 57, 32, 32 * i.height / i.width); },
  stove(c, cx, top) { glow(c, cx - 1, top + 74, 44, 0.45 + Math.sin(G.t / 9) * 0.08); },
  lantern(c, cx, top) { const i = IMG.furn_lantern, x = cx - 35, y = top - 18; glow(c, x + 9, y + 22, 45, 0.3); if (i) c.drawImage(i, x, y, 18, 18 * i.height / i.width); }
};

function glow(c, x, y, r, a) {
  const g = c.createRadialGradient(x, y, 0, x, y, r);
  g.addColorStop(0, `rgba(255,190,90,${a})`); g.addColorStop(1, 'rgba(255,160,60,0)');
  c.fillStyle = g; c.fillRect(x - r, y - r, r * 2, r * 2);
}
function drawWorkshopWall(c) {
  const WL = LAYOUT[map.id] || {}, wc = WL.wallColor || '#6b4a2c', wins = WL.windows || [6 * T + 6], dx = WL.doorX == null ? 6 : WL.doorX;
  for (let x = 0; x < map.w; x++) {
    c.fillStyle = wc; c.fillRect(x * T, 0, T, 2 * T);
    c.fillStyle = 'rgba(0,0,0,.18)'; c.fillRect(x * T + T - 3, 0, 3, 2 * T);
    c.fillStyle = 'rgba(255,255,255,.06)'; c.fillRect(x * T, 0, 3, 2 * T);
  }
  if (map.id === 'W' && IMG.wall_workshop_concept) { const i = IMG.wall_workshop_concept; for (let x=0; x<map.w*T; x+=4*T) { const n = Math.min(4*T, map.w*T-x); c.drawImage(i, 0, 0, n, 96, x, 0, n, 2*T); } }
  if (map.id === 'C5_TUNNEL' && IMG.tile_cave_wall) { const i = IMG.tile_cave_wall; for (let x=0; x<map.w*T; x+=4*T) { const n = Math.min(4*T, map.w*T-x); c.drawImage(i, 0, 0, n, 96, x, 0, n, 2*T); } }
  c.fillStyle = '#4a3220'; c.fillRect(0, 2 * T - 10, map.w * T, 10);
  // 窓
  for (const wx of wins) {
    if (map.id === 'W' && IMG.window_workshop_concept) { c.drawImage(IMG.window_workshop_concept, wx - 8, 6, 92, 82); continue; }
    c.fillStyle = '#3a2814'; c.fillRect(wx - 6, 14, 84, 70);
    const g = c.createLinearGradient(0, 18, 0, 80); g.addColorStop(0, '#ffe7a8'); g.addColorStop(1, '#f0b860');
    c.fillStyle = g; c.fillRect(wx, 20, 72, 58);
    c.fillStyle = '#3a2814'; c.fillRect(wx + 34, 20, 4, 58); c.fillRect(wx, 46, 72, 4);
  }
  // 左右・下の壁
  c.fillStyle = '#3d2a18';
  c.fillRect(0, 2 * T, T, (map.h - 2) * T); c.fillRect((map.w - 1) * T, 2 * T, T, (map.h - 2) * T);
  c.fillRect(0, (map.h - 1) * T, map.w * T, T);
  c.fillStyle = wc; c.fillRect(dx * T, (map.h - 1) * T, T, T);
  c.fillStyle = '#c99b58'; c.fillRect(dx * T + 6, (map.h - 1) * T + 4, T - 12, T - 4);
  c.fillStyle = '#e8c27a'; c.fillRect(dx * T + 12, (map.h - 1) * T + 10, T - 24, T - 10);
}
function stoneBlock(c, x, y, w, h, col) {
  const g = c.createLinearGradient(x, y, x, y + h); g.addColorStop(0, col[0]); g.addColorStop(1, col[1]);
  c.fillStyle = g; c.fillRect(x, y, w, h);
  c.strokeStyle = 'rgba(0,0,0,.28)'; c.lineWidth = 1;
  for (let yy = y + 11; yy < y + h; yy += 11) { c.beginPath(); c.moveTo(x, yy); c.lineTo(x + w, yy); c.stroke(); }
  for (let r = 0, yy = y; yy < y + h; yy += 11, r++) for (let xx = x + (r % 2 ? 9 : 22); xx < x + w; xx += 26) { c.beginPath(); c.moveTo(xx, yy); c.lineTo(xx, Math.min(y + h, yy + 11)); c.stroke(); }
  c.fillStyle = 'rgba(255,255,255,.18)'; c.fillRect(x, y, w, 2);
}
function drawFurnace(c) {
  const cx = 20 * T, cy = 14 * T;
  // 炉と基壇が一体の専用画像。撤去後は従来の空の台座を残す。
  const landmark = IMG.prop_village_furnace_v2;
  if (!S.flags.furnace_gone && landmark) {
    const dw = 124, dh = landmark.height * dw / landmark.width;
    c.fillStyle = 'rgba(0,0,0,.25)'; c.beginPath(); c.ellipse(cx, cy + 36, 58, 12, 0, 0, 7); c.fill();
    glow(c, cx, cy - 28, 100, 0.45);
    c.drawImage(landmark, cx - dw / 2, cy + 36 - dh, dw, dh);
    return;
  }
  if (S.flags.furnace_gone) {
    // 炉を撤去した後は広場に残った低い据付跡。空中に階段状の台座を残さない。
    c.fillStyle = 'rgba(28,24,23,.28)'; c.beginPath(); c.ellipse(cx, cy + 31, 62, 16, 0, 0, Math.PI * 2); c.fill();
    c.beginPath(); c.moveTo(cx - 48, cy + 13); c.lineTo(cx - 31, cy + 3); c.lineTo(cx + 31, cy + 3); c.lineTo(cx + 48, cy + 13); c.lineTo(cx + 45, cy + 30); c.lineTo(cx + 28, cy + 37); c.lineTo(cx - 28, cy + 37); c.lineTo(cx - 45, cy + 30); c.closePath();
    c.fillStyle = '#746d60'; c.fill(); c.strokeStyle = '#47423d'; c.lineWidth = 3; c.stroke();
    c.beginPath(); c.ellipse(cx, cy + 19, 28, 9, 0, 0, Math.PI * 2); c.fillStyle = '#4c4944'; c.fill(); c.strokeStyle = '#aaa08a'; c.lineWidth = 2; c.stroke();
    for (const dx of [-35, 35]) { c.fillStyle = '#413c36'; c.fillRect(cx + dx - 2, cy + 18, 4, 4); c.fillStyle = '#b9aa8e'; c.fillRect(cx + dx - 1, cy + 18, 2, 1); }
    glow(c, cx, cy + 17, 22, 0.32); c.fillStyle = '#e79551'; c.fillRect(cx - 3, cy + 17, 6, 3);
    return;
  }
  c.fillStyle = 'rgba(0,0,0,.3)'; c.beginPath(); c.ellipse(cx, cy + 40, 74, 22, 0, 0, 7); c.fill();
  // 三段の石の台座
  stoneBlock(c, cx - 72, cy + 18, 144, 24, ['#8d8c92', '#5f5e66']);
  stoneBlock(c, cx - 56, cy - 2, 112, 22, ['#9a999f', '#66656d']);
  stoneBlock(c, cx - 40, cy - 20, 80, 20, ['#a5a4aa', '#6f6e76']);
  if (!S.flags.furnace_gone) {
    const i = IMG.furn_lantern, fl = 1 + Math.sin(G.t / 13) * 0.03;
    glow(c, cx, cy - 62, 130 * fl, 0.9);
    if (i) { const dw = 78, dh = i.height * dw / i.width; c.drawImage(i, cx - dw / 2, cy - 20 - dh + 4, dw, dh); }
    c.fillStyle = `rgba(255,236,170,${0.5 + Math.sin(G.t / 9) * 0.1})`; c.beginPath(); c.arc(cx, cy - 66, 14, 0, 7); c.fill();
    // 火の粉
    for (let k = 0; k < 4; k++) { const ph = (G.t / 50 + k * 0.27) % 1; c.fillStyle = `rgba(255,210,120,${1 - ph})`; c.fillRect(cx - 16 + k * 11 + Math.sin(G.t / 7 + k) * 4, cy - 100 - ph * 40, 2, 2); }
  }
}

/* ================= マップ切替・状態の反映 ================= */
function placeActors() { placeActorsBase(); if (map.id === 'V') registryActors(); }   // 村(V)にも章の人物(再訪など)を置けるように
function placeActorsBase() {
  actors = [];
  if (map.id === 'K') { placeKirimachi(); registryActors(); return; }
  if (SHOP_ROOMS[map.id]) { placeShopkeeper(map.id); return; }
  if (map.id !== 'V') { registryActors(); if (map.id === 'C12_SEA' && atLeast('c12_start')) placeTravelingMerchant(); if (map.id === 'C5_TOWN' && atLeast('c5_confess')) placeValleyMerchant(); return; }
  const st = stIdx();
  if (st < STAGES.indexOf('furnace_taken')) {
    addActor({ id: 'mayor', img: 'npc_mayor', x: 22, y: 12, dir: 'left', name: '村長', talk: () => mayorTalk() });
    addActor({ id: 'carpenter', img: 'npc_carpenter', x: 16, y: 11, dir: 'down', name: '大工', talk: () => carpenterTalk() });
    addActor({ id: 'kid1', img: 'npc_kid', x: 23, y: 16, dir: 'left', name: '子ども', scale: 1.0, talk: () => kidTalk() });
    if (S.st === 'mayor_spoken' && !S.flags.potion) addActor({ id: 'kid2', img: 'npc_kid', x: 13, y: 11, dir: 'left', name: '子ども', scale: 1.0, talk: () => sceneKid() });
  } else if (S.st === 'furnace_taken') {
    addActor({ id: 'mayor', img: 'npc_mayor', x: 26, y: 10, dir: 'down', name: '村長', talk: () => mayorTalk() });
  } else {
    addActor({ id: 'mayor', img: 'npc_mayor', x: 28, y: 10, dir: 'down', name: '村長', talk: () => mayorTalk() });
    addActor({ id: 'granny', img: 'npc_granny', x: 26, y: 10, dir: 'right', name: '祖母', talk: () => grannyTalk() });
    addActor({ id: 'kid1', img: 'npc_kid', x: 28, y: 11, dir: 'up', name: '子ども', scale: 1.0, talk: () => kidTalk() });
    addActor({ id: 'carpenter', img: 'npc_carpenter', x: 29, y: 12, dir: 'left', name: '大工', talk: () => carpenterTalk() });
  }
}
function fieldMusic() {
  if (map && map.bgm) return map.bgm;
  if (map && map.indoor) return 'home';
  return (G.tint > 0.1 || (S && atLeast('furnace_taken') && !atLeast('c1_arrive'))) ? 'dusk' : 'village';
}
function enterMap(id, x, y, dir) {
  setMapData(id);
  placeActors();
  // Entries from scenes, tools and old coordinates must obey the same floor
  // rules as movement. Never place the player in water, walls or another actor.
  if (!Number.isInteger(x) || !Number.isInteger(y) || isSolidTile(x, y) || actorAt(x, y)) {
    const preferred = map.points.start || [6, 7];
    const safe = safeLoadPosition(preferred);
    if (!safe) throw new Error('歩ける開始位置がありません: ' + id);
    [x, y] = safe;
  }
  Snd.bgm(fieldMusic());
  G.P = { x, y, px: x, py: y, dir, moving: 0, alt: false, tx: x, ty: y, prog: 0 };
  S.map = id;
}
async function changeMap(id, x, y, dir) {
  G.busy = true;
  await fade(1, 0.08);
  enterMap(id, x, y, dir);
  await fade(0, 0.08);
  G.busy = false;
}

/* ================= シーン(台本) ================= */
async function runScene(fn) {
  if (G.busy) return;
  G.busy = true;
  try { await fn(); } catch (e) {   // 台本や戦闘の途中でエラーが出ても、操作できる状態へ戻す
    console.error(e);
    G.dlg = null; G.choice = null; G.screen = null; G.card = null; okWait = null; G.recall = null; G.cg = G.pic = null;
    if (G.mode === 'battle') { G.mode = 'field'; Snd.bgm(fieldMusic()); }
    G.fade = G.fadeTo = 0;
  }
  G.cg = G.pic = null;   // 台本の終わりで一枚絵・挿絵を必ず消す
  if (map && S) syncRegistryActors();
  G.busy = false;
}

/* 台本データ(src/story.js)を再生する。書式は story.js の先頭に書いてある */
const HOOKS = {
  placeActors: () => placeActors(),
  faceKid2: () => { const k = getActor('kid2'); if (k) face(k, G.P.x, G.P.y); },
  removeKid2: () => removeActor('kid2'),
  pushBack: () => moveP(G.P.x - 1, G.P.y),
  pushUp: () => moveP(G.P.x, G.P.y - 1),
  toK: async () => {   // 灯火村の東の道 → 川霧の町
    await fade(1, 0.08);
    const first = S.st === 'prologue_complete';
    if (first) setStage('c1_arrive');
    G.tint = 0; enterMap('K', 3, 6, 'right'); await fade(0, 0.08);
    if (first) { Snd.sfx('door'); await play(STORY.c1_arrive); }
  },
  c1End: async () => { if (S.flags.c1_child_saved && S.flags.c1_elder_saved && S.st !== 'c1_complete') await play(STORY.c1_end); }
};
function storyCond(c) {
  return c.split('&').every(term => {
    term = term.trim(); let neg = false;
    if (term[0] === '!') { neg = true; term = term.slice(1); }
    const r = term.split('|').some(a => {
      const i = a.indexOf(':'), k = a.slice(0, i), v = a.slice(i + 1);
      return k === 'flag' ? !!S.flags[v] : k === 'st' ? S.st === v : k === 'ge' ? atLeast(v) : false;
    });
    return neg ? !r : r;
  });
}
async function play(script) {   // 戻り値 true = ['end'] で終わった
  for (const op of script) {
    switch (op[0]) {
      case 's': await say(op[1], op[2]); break;
      case 'n': await narrate(op[1]); break;
      case 'if': { const r = await play(storyCond(op[1]) ? op[2] : (op[3] || [])); if (r) return true; break; }
      case 'flag': S.flags[op[1]] = true; break;
      case 'stage': if (STAGES.indexOf(op[1]) >= stIdx()) setStage(op[1]); break;   // 段階は進むだけ(戻さない。再訪で前の章の台本が走っても進行が巻き戻らない)
      case 'give': S.items[op[1]] = (S.items[op[1]] || 0) + op[2]; break;
      case 'sfx': Snd.sfx(op[1]); break;
      case 'toast': toast(op[1]); break;
      case 'recall': G.recall = op[1] ? { img: 'npc_lina', a: 0 } : null; break;
      case 'sleep': await sleep(op[1]); break;
      case 'fadein': G.fade = 1; G.fadeTo = 0; break;
      case 'hook': await HOOKS[op[1]](); break;
      case 'ask': {   // ['ask', キー, 質問, [選択肢], [選んだときの台本...]]  選んだ番号 n で フラグ キー_n が立つ
        const i = await choose(op[3], op[2]); S.flags[op[1] + '_' + i] = true;
        const r = await play(op[4][i] || []); if (r) return true; break;
      }
      case 'join': { S.allies = S.allies || []; if (!S.allies.some(m => m.id === op[1])) S.allies.push({ id: op[1], hp: mhpOf(op[1]), mp: mmpOf(op[1]) }); S.flags['joined_' + op[1]] = true; break; }
      case 'gear': S.gear = S.gear || {}; S.gear[op[1]] = (S.gear[op[1]] || 0) + (op[2] || 1); break;
      case 'equip': S.equip = S.equip || {}; (S.equip[op[1]] = S.equip[op[1]] || {})[op[2]] = op[3]; break;
      case 'battle': await fieldBattle(op[1]); break;
      case 'goto': { await fade(1, 0.08); const [gx, gy] = resolveAt(op[2], op[1]); enterMap(op[1], gx, gy, op[3] || 'down'); await fade(0, 0.08); await zoneHere(); break; }   // ['goto', マップID, [x,y]|'MAP@名前', 向き]
      case 'leave': { const i = (S.allies || []).findIndex(m => m.id === op[1]); if (i >= 0) { const eq = (S.equip && S.equip[op[1]]) || {}; for (const s of ['w', 'a', 'c']) if (eq[s]) { S.gear[eq[s]] = (S.gear[eq[s]] || 0) + 1; eq[s] = null; } S.allies.splice(i, 1); } S.flags['left_' + op[1]] = true; break; }   // 仲間が離脱(装備は持ち物へ返す)
      case 'bgm': Snd.bgm(op[1]); break;
      case 'tint': G.tint = op[1]; break;
      case 'heal': S.hp = S.mhp; for (const m of (S.allies || [])) { m.hp = mhpOf(m.id); m.mp = mmpOf(m.id); } Snd.sfx('heal'); break;
      case 'walk': { const a = getActor(op[1]); if (a) { const [wx, wy] = resolveAt(op[2], map.id); await moveActor(a, wx, wy, op[3] || 0.09); } break; }   // ['walk', 人物ID, 場所, 速さ]
      case 'actor': { if (op[1] === 'remove') removeActor(op[2]); else if (op[1] === 'add') { const d = op[2], [ax, ay] = resolveAt(d.at, map.id); addActor({ id: d.id, img: d.img, fallback: d.fallback, sheet: d.sheet, x: ax, y: ay, dir: d.dir || 'down', name: d.name, scale: d.scale, talk: d.story ? () => play(STORY[d.story]) : undefined }); } break; }
      case 'bg': G.cg = op[1] ? { img: op[1] } : null; break;   // ['bg', 画像名|null] 一枚絵を画面いっぱいに(会話の背景)
      case 'pic': G.pic = op[1] ? { img: op[1], size: op[2] || 'small' } : null; break;   // ['pic', 画像名|null, 'small'|'big'] 挿絵・小物を中央に
      case 'levelup': { const n = op[1] || 1, oldLv = S.lv || 0; const ids = ['allen', ...(S.allies || []).map(m => m.id)], was = ids.map(i => skillsOf(i)); S.lv = oldLv + n; S.mhp += LV.mhp * n; S.hp += LV.mhp * n; for (const m of (S.allies || [])) { m.hp += LV.mhp * n; m.mp += LV.mmp * n; } Snd.sfx('item');
        for (let k = 0; k < ids.length; k++) for (const s of skillsOf(ids[k])) if (!was[k].includes(s)) await narrate(`${ALLIES[ids[k]].name}は「${SKILLS[s].name}」を覚えた！`);
        if (oldLv < 10 && S.lv >= 10 && ids.includes('mira') && ids.includes('serena')) await narrate('水極と炎極を覚えた！ 戦闘でミラかアレンの「合成」を選ぶと、参加者の行動とMPを使い、強力な全体魔法を放てる。');
        break; }   // 全員の成長(新しく覚えた技も知らせる)
      case 'end_game': await fade(1, 0.04); G.mode = 'ended'; G.fade = 0; G.fadeTo = 0; break;
      case 'card': await showCard(op[1], op[2]); break;
      case 'end': return true;
      default: console.warn('story: 不明な命令', op);
    }
  }
  return false;
}
async function sceneIntro() { G.busy = true; await play(STORY.intro); G.busy = false; }
const sceneBell = () => play(STORY.bell);
const carpenterTalk = () => play(STORY.carpenter);
const kidTalk = () => play(STORY.kid);
const mayorTalk = () => play(STORY.mayor);
const grannyTalk = () => play(STORY.granny);
const furnaceTalk = () => play(STORY.furnace);
const sceneKid = () => play(STORY.kidGive);
const sceneKit = () => play(STORY.kit);
const sceneBarrier = () => play(STORY.barrier);
async function moveP(tx, ty) { // プレイヤーを歩かせる(衝突無視)
  const P = G.P; P.moving = 0;
  while (Math.abs(P.x - tx) > 1e-3 || Math.abs(P.y - ty) > 1e-3) {
    const dx = tx - P.x, dy = ty - P.y; P.dir = Math.abs(dx) >= Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : (dy > 0 ? 'down' : 'up');
    const d = Math.hypot(dx, dy), s = Math.min(0.08, d); P.x += dx / d * s; P.y += dy / d * s; P.wk = (P.wk || 0) + s; await sleep(1);
  }
  P.wk = 0; P.px = P.x; P.py = P.y; P.tx = P.x; P.ty = P.y;
}

// 台座の南側を回って公民館へ向かう。台座は撤去後も通行できない。
const EVAC_CARPENTER_PATH = [[16, 15], [22, 15], [27, 13], [27, 9]];
const EVAC_GRANNY_PATH = [[27, 12], [27, 9]];
const EVAC_KID_PATH = [[23, 14], [27, 13], [27, 9]];
const EVAC_MAYOR_PATH = [[21, 13], [26, 13], [26, 10]];
async function sceneCollection() { // E06 回収隊
  const P = G.P;
  await moveP(P.x, P.y);
  // 回収隊が南から入ってくる
  const cap = addActor({ id: 'cap', img: 'npc_guard', x: 20, y: 3, dir: 'down', name: '回収隊長', scale: 0.95 });
  const g1 = addActor({ id: 'g1', img: 'npc_guard', x: 19, y: 2, dir: 'down', name: '回収隊', scale: 0.8 });
  const g2 = addActor({ id: 'g2', img: 'npc_guard', x: 21, y: 2, dir: 'down', name: '回収隊', scale: 0.8 });
  const m = getActor('mayor'); if (m) { m.x = 22; m.y = 12; m.dir = 'left'; }
  await Promise.all([walkPath(cap, [[20, 11]], 0.07), walkPath(g1, [[19, 12]], 0.07), walkPath(g2, [[21, 12]], 0.07)]);
  face(m, cap.x, cap.y);
  await say('回収隊長', '王国の命令により、灯火炉を回収する。首都の結界維持のためだ');
  await say('村長', 'この村の結界はどうなるんだい');
  await say('回収隊長', '代わりの装置を手配する。それまで、村人は屋内に');
  await say('アレン', 'いつ届くんですか');
  await say('回収隊長', '……期日は、聞かされていない');
  await say('村長', '子どもたちがいるんだ。炉を置いていっておくれ');
  await say('回収隊長', '命令は変えられない。せめて夕方までは、兵を残そう');
  await narrate('隊は炉を搬出していく。');
  G.flash = 1; shake(30); S.flags.furnace_gone = true; Snd.sfx('rumble');
  await sleep(40);
  await Promise.all([walkPath(cap, [[20, 2]], 0.06), walkPath(g1, [[19, 2]], 0.06), walkPath(g2, [[21, 2]], 0.06)]);
  removeActor('cap'); removeActor('g1'); removeActor('g2');
  setTint(0.22);
  await sleep(40);
  shake(50);
  await narrate('炉の消えた広場に、不穏な音が響く。山の方から、獣の唸り声。');
  await say('村人', '山の方から、獣が！');
  await say('村長', 'みんな、公民館へ！　歩けない人を先に！');
  const ca = getActor('carpenter'), k1 = getActor('kid1');
  const gr = addActor({ id: 'granny', img: 'npc_granny', x: 24, y: 10, dir: 'right', name: '祖母' });
  const run = async (a, pts) => { await walkPath(a, pts, 0.1); a.vis = false; };
  const t0 = [];
  t0.push(run(gr, EVAC_GRANNY_PATH));
  await sleep(10);
  if (ca) t0.push(run(ca, EVAC_CARPENTER_PATH));
  if (k1) t0.push(run(k1, EVAC_KID_PATH));
  await Promise.all(t0);
  removeActor('carpenter'); removeActor('kid1'); removeActor('granny');
  await narrate('村人が協力して避難していく。回収隊の兵も、道を守ってくれている。');
  await say('アレン', '俺も手伝います！');
  await narrate('そのとき、炉の残り火から、かすかな声がした。');
  G.flash = 0.4; Snd.sfx('voice');
  await say('声', '……おにい……');
  await say('アレン', 'リナ……？');
  await say('村長', 'アレン！　子どもがまだ外れにいる！');
  await say('アレン', '今行きます！');
  setStage('furnace_taken');
  // 村長は公民館へ
  if (m) { m.dir = 'right'; await walkPath(m, EVAC_MAYOR_PATH, 0.08); m.dir = 'down'; }
  placeActors();
  toast('目的が更新された');
}

async function sceneWolf() { // E07
  const P = G.P;
  await moveP(P.x, P.y);
  const kid = addActor({ id: 'kidw', img: 'npc_kid', x: 36, y: 14, dir: 'left', name: '子ども', scale: 0.88 });
  const wolf = addActor({ id: 'wolf', img: 'enemy_wolf', x: 38, y: 13, dir: 'left', scale: 0.3, solid: false });
  face(P, 38, 13);
  await narrate('村外れ。子どもの前に、灰色の獣が立ちはだかっている。');
  await say('アレン', 'こっちだ！　逃げ道はあけてある！');
  await moveActor(kid, 36, 17, 0.12);
  kid.vis = false;
  await fade(1, 0.06);
  const result = await runBattle();
  // 勝利(runBattle は勝つまで戻らない)
  G.mode = 'field'; Snd.bgm('dusk');
  G.fade = 1; G.fadeTo = 1;
  const w = getActor('wolf'); if (w) w.vis = false;
  kid.vis = true; kid.x = 36; kid.y = 17;
  await fade(0, 0.06);
  setStage('wolf_defeated');
  await narrate('灰狼は倒れ、森へ逃げていった。');
  await moveActor(kid, 36, 14, 0.07);
  face(kid, P.x, P.y); face(P, kid.x, kid.y);
  await say('子ども', '……こわかった');
  await say('アレン', 'うん。俺もだ。歩けるか？');
  await say('子ども', 'うん。でも、おばあちゃんが……');
  await say('アレン', '一緒に戻ろう。探すのは、それからだ');
  const guard = addActor({ id: 'gdw', img: 'npc_guard', x: 39, y: 13, dir: 'left', name: '回収隊', scale: 0.72 });
  await moveActor(guard, 37, 13, 0.07);
  await narrate('回収隊の兵が現れ、村へ戻る道を護衛してくれた。');
  await sceneReturn();
}

async function sceneReturn() { // E08
  await fade(1, 0.05);
  removeActor('kidw'); removeActor('gdw'); removeActor('wolf');
  enterMap('V', 27, 12, 'up');
  placeActors();
  const kid = getActor('kid1'); kid.y = 12; kid.x = 28; kid.dir = 'up';
  getActor('granny').x = 26; getActor('granny').y = 11;
  getActor('mayor').x = 27; getActor('mayor').y = 10;
  getActor('carpenter').vis = false;
  setTint(0.28);
  await fade(0, 0.05);
  await narrate('公民館の前。子どもと祖母が再会する。');
  await moveActor(kid, 28, 11, 0.09);
  await say('子ども', 'おばあちゃん！');
  await say('祖母', 'よかった……本当によかった');
  await narrate('祖母が、アレンに深く頭を下げた。');
  await say('アレン', '回復薬、助かりました');
  await say('祖母', 'そうかい。届けてよかった');
  await say('村長', '隊は王都の方へ向かった。村の結界は、応急の灯りで今夜をしのぐ');
  await say('アレン', 'さっき、炉から声が聞こえたんです。リナの声に、似た……');
  await say('村長', '聞き間違いだと、簡単には言えないね');
  await say('アレン', '炉を追います。村を守る方法も、あの声のことも、確かめたい');
  await say('村長', '戻っておいで。一人で直せないものは、村のみんなで考えよう');
  await say('アレン', '……はい。行ってきます');
  await narrate('アレンは、鈴を握りしめた。');
  await fade(1, 0.04);
  G.card = { title: '序章「声の残る村」 おわり', sub: 'この先の旅は、これから作られていく。', a: 0 };
  await sleep(30);
  while (G.card.a < 1) { G.card.a += 0.02; await sleep(1); }
  await sleep(60);
  await waitOk();
  G.card = null;
  setStage('prologue_complete');
  placeActors();
  G.P.x = G.P.px = G.P.tx = 27; G.P.y = G.P.py = G.P.ty = 12; G.P.dir = 'up';
  await fade(0, 0.04);
  toast('序章クリア。メニューからセーブできます。');
  G.busy = false;
}

/* ================= 戦闘は src/battle.js ================= */

/* ================= メニュー・タイトル・セーブ ================= */
const SAVE_SLOTS = 3;
// Slot 1 keeps the original key so existing saves work without migration.
function saveSlotKey(slot = 1) { return slot === 1 ? SAVE_KEY : SAVE_KEY + '_' + slot; }
function savedData(slot = 1) {
  try {
    const t = localStorage.getItem(saveSlotKey(slot)); if (!t) return null;
    const o = JSON.parse(t);
    if (!o || o.v !== SAVE_VERSION || !STAGES.includes(o.st) || !MAPS[o.map]) return null;
    const tiles = MAPS[o.map].tiles;
    // 旧14×10の店舗セーブは新12×9内へ移す。保存データ自体は上書きしない。
    if (SHOP_ROOMS[o.map] && !o.shopLayout && Number.isInteger(o.x) && Number.isInteger(o.y) && o.x >= 0 && o.x < 14 && o.y >= 0 && o.y < 10) { o.x = Math.max(1, Math.min(10, o.x - 1)); o.y = Math.max(2, Math.min(7, o.y)); }
    if (o.map === 'C6_TOWN' && !o.roomLayout && Number.isInteger(o.x) && o.x >= 0 && o.x < 14) o.x = Math.min(10, o.x);
    if ((o.map === 'C7_INN' || o.map === 'C16_TABLE') && (!o.roomLayout || o.roomLayout < 4) && Number.isInteger(o.x) && Number.isInteger(o.y) && o.x >= 0 && o.x < 16 && o.y >= 0 && o.y < 11) { o.x = Math.min(10, o.x); o.y = Math.min(8, o.y); }
    if (!Number.isInteger(o.x) || !Number.isInteger(o.y) || o.y < 0 || o.y >= tiles.length || o.x < 0 || o.x >= tiles[o.y].length) return null;
    if (o.allies != null && (!Array.isArray(o.allies) || o.allies.some(a => !a || !ALLIES[a.id]))) return null;
    for (const k of ['flags', 'items', 'gear', 'equip']) if (o[k] != null && (typeof o[k] !== 'object' || Array.isArray(o[k]))) return null;
    return o;
  } catch (e) { return null; }
}
function anySavedData() { return [1, 2, 3].some(slot => !!savedData(slot)); }
function saveSlotText(slot) {
  let raw = null; try { raw = localStorage.getItem(saveSlotKey(slot)); } catch (e) { return `セーブ ${slot}　保存を利用できません`; }
  if (raw === null) return `セーブ ${slot}　― 空き ―`;
  const data = savedData(slot); if (!data) return `セーブ ${slot}　読み取れません`;
  const mapName = MAPS[data.map].name || data.map;
  const date = data.savedAt && !Number.isNaN(Date.parse(data.savedAt)) ? new Date(data.savedAt).toLocaleString('ja-JP', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }) : '以前の記録';
  return `セーブ ${slot}　${mapName}　${date}`;
}
async function chooseSaveSlot(prompt, loading = false) {
  while (true) {
    const selection = await choose([1, 2, 3].map(saveSlotText), prompt, { cancel: true });
    if (selection < 0) return null;
    const slot = selection + 1;
    if (!loading || savedData(slot)) return slot;
    await narrate('このセーブは空か、読み取れません。');
  }
}
// 追加前に該当イベントを終えたセーブだけに、受け取れなかった補給を届ける。
// ステージはイベント終了後の最初の保存可能地点。取得済みフラグは通常の物語と共有する。
const MISSED_SUPPLIES = [
  ['c2_road', 'c2_caravan_supply', ['salt_knife', 'caravan_coat', 'gardo_axe'], 'caravan_ration'],
  ['c3_night', 'c3_dock_supplies', ['dock_jacket', 'compass_charm', 'noah_dagger']],
  ['c4_escape', 'c4_escape_supplies', ['guard_saber', 'silver_staff', 'gardo_hammer'], 'mist_ether'],
  ['c5_mine', 'c5_mine_supplies', ['miner_plate'], 'miner_tonic'],
  ['c6_prep', 'c6_valley_supplies', ['wind_blade', 'furnace_pin', 'noah_hook'], 'wind_herb'],
  ['c8_lab', 'c8_gate_supplies', ['sand_goggles'], 'star_ether'],
  ['c9_start', 'c8_join_supplies', ['moon_staff', 'serena_rod']],
  ['c9_dive', 'c9_gate_supplies', ['tide_blade', 'tide_mail'], 'sea_tonic'],
  ['c10_tour', 'c10_isle_supplies', ['isle_plate', 'sky_feather'], 'sky_honey'],
  ['c11_device', 'c11_device_supplies', ['royal_blade', 'serena_rod2'], 'royal_cordial'],
  ['c12_start', 'c12_voyage_supplies', ['sky_cloak', 'ash_ward', 'compass_gun'], 'big_ether'],
  ['c13_start', 'c13_prepared_supplies', ['ash_edge', 'dawn_staff'], 'ash_remedy']
];
function restoreMissedSupplies(state) {
  const progress = STAGES.indexOf(state.st);
  if (progress < 0) return 0;
  let restored = 0;
  // The road's added supplies are also available to older saves already past the trader.
  if ((state.st === 'c2_road' || state.st === 'c2_conflict') && !state.flags.c2_magic_supply) {
    state.items.ether = (state.items.ether || 0) + 1;
    state.items.potion = (state.items.potion || 0) + 1;
    state.flags.c2_magic_supply = true;
    restored++;
  }
  // Saves made in the warehouse before the first-aid cache was introduced
  // should have the same tactical options without rewriting the save slot.
  if (state.st === 'c3_night' && !state.flags.c3_firstaid) {
    for (const id of ['potion', 'ether', 'weakening_powder', 'armorbreak_powder']) state.items[id] = (state.items[id] || 0) + 1;
    state.flags.c3_firstaid = true;
    restored++;
  }
  for (const [stage, flag, gear, item] of MISSED_SUPPLIES) {
    const threshold = STAGES.indexOf(stage);
    if (threshold < 0 || progress < threshold || state.flags[flag]) continue;
    for (const id of gear) {
      const equipped = Object.values(state.equip).some(slots => slots && Object.values(slots).includes(id));
      if (!(state.gear[id] > 0) && !equipped) state.gear[id] = 1;
    }
    if (item) state.items[item] = (state.items[item] || 0) + 2;
    state.flags[flag] = true;
    restored++;
  }
  return restored;
}
async function doSave() {
  if (G.P.moving) return false;
  const slot = await chooseSaveSlot('セーブ先を選んでください');
  if (slot === null) return false;
  const key = saveSlotKey(slot);
  let previous = null; try { previous = localStorage.getItem(key); } catch (e) { /* setItem の失敗時に案内する */ }
  if (previous !== null) {
    const valid = !!savedData(slot);
    const c = await choose(['上書きする', 'やめる'], valid ? `セーブ ${slot} を上書きしますか？` : `セーブ ${slot} は読み取れません。上書きしますか？`, { cancel: true });
    if (c !== 0) return false;
  }
  try {
    localStorage.setItem(key, JSON.stringify({ v: SAVE_VERSION, shopLayout: 2, roomLayout: 4, gold: S.gold, shopStock: S.shopStock || {}, st: S.st, flags: S.flags, items: S.items, hp: S.hp, mhp: S.mhp, lv: S.lv || 0, allies: S.allies || [], gear: S.gear || {}, equip: S.equip || {}, map: map.id, x: Math.round(G.P.x), y: Math.round(G.P.y), dir: G.P.dir, tint: G.tint, savedAt: new Date().toISOString() }));
    await narrate(`セーブ ${slot} に保存しました。`);
    return true;
  } catch (e) { await narrate('セーブに失敗しました。(ブラウザの保存が使えません)'); return false; }
}
async function startGame(load, slot = 1) {
  S = newState();
  G.mode = 'field'; G.busy = true; G.tint = 0;
  if (load) {
    const o = savedData(slot);
    if (o) { Object.assign(S, { shopStock: cleanShopStock(o.shopStock), gold: Number.isSafeInteger(o.gold) && o.gold >= 0 ? o.gold : 180 + Math.min(12, Math.max(0, o.lv || 0)) * 45, st: o.st, flags: o.flags || {}, items: Object.assign({ potion: 0, kit: 0, bread: 0, ether: 0 }, o.items), hp: o.hp, mhp: o.mhp, lv: o.lv || 0, allies: o.allies || [], gear: o.gear || {}, equip: o.equip || {} }); const restored = restoreMissedSupplies(S); G.tint = o.tint || 0; enterMap(o.map, o.x, o.y, o.dir); setStage(S.st);
      if (!Number.isFinite(S.hp) || !Number.isFinite(S.mhp) || S.mhp <= 0) { S.mhp = 50; S.hp = Math.max(1, Math.min(S.hp || 1, 50)); }
      if (isSolidTile(Math.round(G.P.x), Math.round(G.P.y)) || actorAt(Math.round(G.P.x), Math.round(G.P.y))) { const st = (MAPS[o.map].points || {}).start || [2, 2], safe = safeLoadPosition(st); if (safe) { G.P.x = G.P.px = G.P.tx = safe[0]; G.P.y = G.P.py = G.P.ty = safe[1]; } } G.fade = 1; G.fadeTo = 0; G.busy = false; if (restored) toast('以前の冒険で受け取れなかった装備・道具を持ち物に追加しました。'); return; }
  }
  enterMap('W', 6, 4, 'down'); G.fade = 1;
  await sceneIntro();
  toast('目的が更新された');
}
const titleMenu = { idx: 0 };

/* ================= 更新 ================= */
function walkable(x, y) { return !isSolidTile(x, y) && !actorAt(x, y); }
function inRect(o, x, y) { return x >= o.x && y >= o.y && x < o.x + (o.w || 1) && y < o.y + (o.h || 1); }

function update() {
  G.t++;
  // tween
  for (let i = tweens.length - 1; i >= 0; i--) {
    const w = tweens[i]; w.t++; w.step(Math.min(1, w.t / w.d));
    if (w.t >= w.d) { tweens.splice(i, 1); w.done(); }
  }
  // 画面効果
  if (G.fade !== G.fadeTo) { const d = G.fadeTo - G.fade; G.fade += Math.sign(d) * Math.min(Math.abs(d), G.fadeSpeed); }
  if (G.shake > 0) G.shake--;
  if (G.flash > 0) G.flash = Math.max(0, G.flash - 0.03);
  if (G.toast) { G.toast.t--; if (G.toast.t <= 0) G.toast = null; }
  if (G.B) {
    const B = G.B; B.nums = B.nums.filter(n => { n.t--; return n.t > 0; });
    if (B.shk > 0) B.shk--; if (B.red > 0) B.red--;
  }
  pollPad();
  // 入力の消費
  const ok = edge.has('ok'), cancel = edge.has('cancel');
  const up = edge.has('up'), down = edge.has('down');
  if (G.dlg) {
    const d = G.dlg;
    if (d.shown < d.full) { d.shown = Math.min(d.full, d.shown + 1.2); if (ok) d.shown = d.full; }
    else if (ok) { Snd.sfx('ok'); G.dlg = null; d.resolve(); }
  } else if (G.choice) {
    const c = G.choice;
    if (up) { c.idx = (c.idx + c.list.length - 1) % c.list.length; Snd.sfx('move'); }
    if (down) { c.idx = (c.idx + 1) % c.list.length; Snd.sfx('move'); }
    if (ok) { Snd.sfx('ok'); G.choice = null; c.resolve(c.idx); }
    else if (cancel && c.cancel) { Snd.sfx('cancel'); G.choice = null; c.resolve(-1); }
  } else if (G.screen) {
    const s = G.screen;
    if (edge.has('left')) { s.idx--; Snd.sfx('move'); }
    if (edge.has('right')) { s.idx++; Snd.sfx('move'); }
    if (ok || cancel) { Snd.sfx('cancel'); G.screen = null; s.resolve(); }
  } else if (G.mode === 'title') {
    const items = titleItems();
    if (up) { titleMenu.idx = (titleMenu.idx + items.length - 1) % items.length; Snd.sfx('move'); }
    if (down) { titleMenu.idx = (titleMenu.idx + 1) % items.length; Snd.sfx('move'); }
    if (ok && !G.busy) { Snd.sfx('ok'); titleSelect(items[titleMenu.idx]); }
  } else if (G.mode === 'ended' && !G.busy) {
    if (ok) { Snd.sfx('ok'); titleMenu.idx = 0; G.mode = 'title'; G.tint = 0; Snd.bgm('title'); }
  } else if (G.mode === 'battle') {
    const B = G.B;
    if (B.menu) {
      const m = B.menu;
      if (up) { m.idx = (m.idx + m.list.length - 1) % m.list.length; Snd.sfx('move'); }
      if (down) { m.idx = (m.idx + 1) % m.list.length; Snd.sfx('move'); }
      if (ok) { Snd.sfx('ok'); B.menu = null; m.r(m.list[m.idx][0]); }
      else if (cancel) {   // Xキー: 「戻る」の項目があればそれ、最上段で前の味方に戻れるときは 'cancel'
        const bi = m.list.findIndex(x => x[0] === 'back');
        if (bi >= 0) { Snd.sfx('cancel'); B.menu = null; m.r('back'); } else if (m.cancel) { Snd.sfx('cancel'); B.menu = null; m.r('cancel'); }
      }
    } else if (okWait && ok) { const r = okWait; okWait = null; r(); }
  } else if (okWait && ok) { const r = okWait; okWait = null; r(); }
  else if (G.mode === 'field' && !G.busy) updateField(ok, cancel);
  edge = new Set();
}

const WALK_SPEEDS = [{ name: 'ゆっくり', pixels: 2 }, { name: 'ふつう', pixels: 3 }, { name: 'はやい', pixels: 4.5 }];
const WALK_SPEED_KEY = 'ash_lantern_walk_speed';
let selectedWalkSpeed = (() => { try { const raw = localStorage.getItem(WALK_SPEED_KEY), n = Number(raw); return raw !== null && Number.isInteger(n) && n >= 0 && n < WALK_SPEEDS.length ? n : 1; } catch (_) { return 1; } })();
function walkSpeedIndex() { return selectedWalkSpeed; }
function setWalkSpeed(index) {
  if (!Number.isInteger(index) || index < 0 || index >= WALK_SPEEDS.length) return;
  selectedWalkSpeed = index;
  try { localStorage.setItem(WALK_SPEED_KEY, String(index)); } catch (_) { /* 保存できなくても現在の起動中は速度を変えられる */ }
}
function updateField(ok, cancel) {
  const P = G.P;
  if (P.moving) {
    P.prog += WALK_SPEEDS[walkSpeedIndex()].pixels;
    const f = Math.min(1, P.prog / T);
    P.x = P.sx + (P.tx - P.sx) * f; P.y = P.sy + (P.ty - P.sy) * f;
    if (f >= 1) { P.moving = 0; P.x = P.tx; P.y = P.ty; P.alt = !P.alt; arrive(); }
    return;
  }
  if (cancel) { runScene(openMenu); return; }
  if (ok) {
    const [dx, dy] = DIRS[P.dir];
    const fx = Math.round(P.x) + dx, fy = Math.round(P.y) + dy;
    const a = actors.find(a => a.vis !== false && a.talk && Math.round(a.x) === fx && Math.round(a.y) === fy);
    if (a) { face(a, P.x, P.y); runScene(a.talk); return; }
    const it = inters.find(i => inRect(i, fx, fy));
    if (it) { runScene(it.fn); return; }
  }
  for (const k of ['up', 'down', 'left', 'right']) {
    if (isHeld(k)) {
      P.dir = k;
      const [dx, dy] = DIRS[k];
      const nx = Math.round(P.x) + dx, ny = Math.round(P.y) + dy;
      if (walkable(nx, ny)) { P.moving = 1; P.sx = P.x; P.sy = P.y; P.tx = nx; P.ty = ny; P.prog = 0; }
      break;
    }
  }
}
async function zoneHere() {   // いま立っているマスのイベントゾーンを(あれば)走らせる。出入口・goto の直後に使う
  const P = G.P, x = Math.round(P.x), y = Math.round(P.y);
  const z = zones.find(z => inRect(z, x, y) && z.cond());
  if (z) await z.fn();
}
function arrive() {
  const P = G.P, x = Math.round(P.x), y = Math.round(P.y);
  const w = warps.find(w => w.x === x && w.y === y && (!w.cond || w.cond()));
  if (w) {
    runScene(async () => {
      if (w.pre && !(await w.pre())) { await moveP(x, y - 1); return; }
      Snd.sfx('door'); await fade(1, 0.1);
      enterMap(w.to, w.tx, w.ty, w.dir);
      await fade(0, 0.1);
      await zoneHere();
    });
    return;
  }
  const z = zones.find(z => inRect(z, x, y) && z.cond());
  if (z) runScene(z.fn);
}

/* ================= 描画 ================= */
function camera() {
  const P = G.P, mw = map.w * T, mh = map.h * T;
  let cx = P.x * T + T / 2 - W / 2, cy = P.y * T + T / 2 - H / 2;
  cx = mw <= W ? -(W - mw) / 2 : Math.max(0, Math.min(mw - W, cx));
  cy = mh <= H ? -(H - mh) / 2 : Math.max(0, Math.min(mh - H, cy));
  return [Math.round(cx), Math.round(cy)];
}
function tgrp(ch) { return ch === 'p' || ch === 's' || ch === 'r' ? 'P' : ch === 'w' ? 'W' : ch === 'b' ? '*' : ch === 'm' ? 'M' : ch === 'x' ? 'X' : 'G'; }
function tsame(a, b) { return a === b || a === '*' || b === '*' || a === 'X' || b === 'X'; }
function roundedClip(c, x, y, tl, tr, br, bl) {
  c.beginPath(); c.moveTo(x + tl, y); c.lineTo(x + T - tr, y); if (tr) c.arc(x + T - tr, y + tr, tr, -Math.PI / 2, 0); else c.lineTo(x + T, y);
  c.lineTo(x + T, y + T - br); if (br) c.arc(x + T - br, y + T - br, br, 0, Math.PI / 2); else c.lineTo(x + T, y + T);
  c.lineTo(x + bl, y + T); if (bl) c.arc(x + bl, y + T - bl, bl, Math.PI / 2, Math.PI); else c.lineTo(x, y + T);
  c.lineTo(x, y + tl); if (tl) c.arc(x + tl, y + tl, tl, Math.PI, Math.PI * 1.5); else c.lineTo(x, y);
  c.closePath();
}
function tileImageFor(m, ch) {
  const skin = (m.skin && m.skin[ch]) || ch;
  return (m.tileArt && IMG[m.tileArt[ch]]) || IMG[TILE_IMG[skin] || skin];
}
function drawTiles(cx, cy) {
  const room = typeof CONCEPT_ROOMS !== 'undefined' && CONCEPT_ROOMS[map.id];
  if (room && IMG[room.image]) { ctx.drawImage(IMG[room.image], -cx, -cy, map.w*T, map.h*T); return; }
  if (map.id === 'C14_HEART' && IMG.bg_furnace_heart_concept) { ctx.drawImage(IMG.bg_furnace_heart_concept, -cx, -cy, map.w*T, map.h*T); return; }
  if (map.id === 'C4_ESCAPE' && IMG.bg_escape_drain) { ctx.drawImage(IMG.bg_escape_drain, -cx, -cy, map.w*T, map.h*T); return; }
  if (map.id === 'C7_INN' && IMG.bg_inn_remembrance) { ctx.drawImage(IMG.bg_inn_remembrance, -cx, -cy, map.w*T, map.h*T); return; }
  if (map.id === 'C4_CASTLE' && IMG.bg_castle_audience_concept) { ctx.drawImage(IMG.bg_castle_audience_concept, -cx, -cy, map.w*T, map.h*T); return; }
  if (map.id === 'C8_LAB' && IMG.bg_observatory_lab_concept) { ctx.drawImage(IMG.bg_observatory_lab_concept, -cx, -cy, map.w*T, map.h*T); return; }
  if (map.id === 'C5_TUNNEL' && IMG.bg_mine_tunnel_concept) { ctx.drawImage(IMG.bg_mine_tunnel_concept, -cx, -cy, map.w*T, map.h*T); return; }
  if (map.id === 'C3_WAREHOUSE' && IMG.bg_harbor_warehouse) { ctx.drawImage(IMG.bg_harbor_warehouse, -cx, -cy, map.w*T, map.h*T); return; }
  if (map.id === 'W' && IMG.bg_workshop_concept) { ctx.drawImage(IMG.bg_workshop_concept, -cx, -cy, map.w*T, map.h*T); return; }
  const x0 = Math.max(0, Math.floor(cx / T)), y0 = Math.max(0, Math.floor(cy / T));
  const x1 = Math.min(map.w - 1, Math.floor((cx + W) / T)), y1 = Math.min(map.h - 1, Math.floor((cy + H) / T));
  const tl = (x, y) => (map.tiles[y] && map.tiles[y][x]) || 'x';
  const R = 22;
  for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
    const ch = map.tiles[y][x];
    if (map.indoor && (ch === 'x')) continue;
    const im = tileImageFor(map, ch);   // tileArt は専用画像、skin は地形記号または画像名
    const px = x * T - cx, py = y * T - cy;
    const g = tgrp(ch);
    const soft = !map.indoor && (g === 'P' || g === 'W' || g === 'M') && !(g === 'W' && (map.id === 'C10_SHIP' || map.id === 'C12_DECK'));
    let cr = [0, 0, 0, 0];   // 左上, 右上, 右下, 左下の丸め
    let sides = [false, false, false, false]; // 上, 右, 下, 左 が別の地面
    if (soft) {
      const gu = tgrp(tl(x, y - 1)), gr = tgrp(tl(x + 1, y)), gd = tgrp(tl(x, y + 1)), gl = tgrp(tl(x - 1, y));
      const du = !tsame(g, gu), dr = !tsame(g, gr), dd = !tsame(g, gd), dl = !tsame(g, gl);
      sides = [du, dr, dd, dl];
      const rr = g === 'W' ? 30 : R; cr = [du && dl ? rr : 0, du && dr ? rr : 0, dd && dr ? rr : 0, dd && dl ? rr : 0];
    }
    const round = cr.some(v => v);
    if (round) { const gi = map.id === 'C12_SEA' ? tileImageFor(map, 'l') : IMG[map.id === 'C2_ROAD' || map.id === 'C9_GATE' ? 'tile_sand' : 'tile_grass']; if (gi) ctx.drawImage(gi, (x % 4) * T, (y % 4) * T, T, T, px, py, T, T); }
    if (round || sides.some(v => v)) { ctx.save(); roundedClip(ctx, px, py, cr[0], cr[1], cr[2], cr[3]); ctx.clip(); }
    if (im) ctx.drawImage(im, (x % 4) * T, (y % 4) * T, T, T, px, py, T, T);
    else { ctx.fillStyle = '#556'; ctx.fillRect(px, py, T, T); }
    if (ch === 'w' && im) {
      ctx.globalAlpha = 0.38; const sx = ((x + 2) % 4) * T, sy = ((y + 1) % 4) * T;
      ctx.drawImage(im, (sx + (G.t >> 3)) % (3 * T), sy, T, T, px, py, T, T); ctx.globalAlpha = 1;
      ctx.fillStyle = `rgba(255,255,255,${0.07 + 0.06 * Math.sin(G.t / 20 + x * 1.7 + y)})`;
      ctx.fillRect(px, py + ((G.t / 3 + x * 7) % T), T, 3);
    }
    if (ch === 'x' && !map.indoor) { ctx.fillStyle = 'rgba(0,20,0,.35)'; ctx.fillRect(px, py, T, T); }
    if (ch === 'o' || ch === 'd') { ctx.fillStyle = 'rgba(255,200,120,.07)'; ctx.fillRect(px, py, T, T); }
    if (sides.some(v => v)) {
      // ふちの影(水は明るい泡の線)
      const col = g === 'W' ? 'rgba(10,40,60,.38)' : g === 'M' ? 'rgba(10,30,10,.3)' : 'rgba(40,25,5,.3)';
      const dirs = [[px, py, T, 9, 0, 1], [px + T - 9, py, 9, T, -1, 0], [px, py + T - 9, T, 9, 0, -1], [px, py, 9, T, 1, 0]];
      sides.forEach((s, i) => {
        if (!s) return; const d = dirs[i];
        const gr = ctx.createLinearGradient(i === 1 ? px + T : i === 3 ? px : 0, i === 0 ? py : i === 2 ? py + T : 0, i === 1 ? px + T - 9 : i === 3 ? px + 9 : 0, i === 0 ? py + 9 : i === 2 ? py + T - 9 : 0);
        gr.addColorStop(0, col); gr.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = gr; ctx.fillRect(d[0], d[1], d[2], d[3]);
        if (g === 'W') { ctx.fillStyle = 'rgba(255,255,255,.35)'; if (i === 0) ctx.fillRect(px, py + 1, T, 2); if (i === 2) ctx.fillRect(px, py + T - 3, T, 2); if (i === 1) ctx.fillRect(px + T - 3, py, 2, T); if (i === 3) ctx.fillRect(px + 1, py, 2, T); }
      });
    }
    if (round || sides.some(v => v)) ctx.restore();
  }
}
function spriteFrame(dir, frame) { return { down: 0, left: 1, right: 2, up: 3 }[dir] * 3 + frame; }
function drawAllen(c, cx, cy, P) {
  const im = IMG.allen; if (!im) return;
  const rows = { down: 0, left: 1, right: 2, up: 3 };
  let col = 1;
  if (P.moving) { const f = P.prog / T; col = (f > 0.12 && f < 0.88) ? (P.alt ? 2 : 0) : 1; }
  else if (P.wk) { col = Math.floor(P.wk * 4) % 2 ? 0 : 2; }
  const px = P.x * T - cx + T / 2, py = P.y * T - cy + T;
  const revised = IMG.allen_walk_v2;
  if (revised && revised.width === 1086 && revised.height === 1448) {
    // Keep one side-facing row mirrored for consistent facing and stable framing.
    const sourceDir = P.dir === 'right' ? 'left' : P.dir;
    const size = 84;
    c.fillStyle = 'rgba(0,0,0,.28)'; c.beginPath(); c.ellipse(px, py - 6, 15, 6, 0, 0, 7); c.fill();
    c.save(); if (P.dir === 'right') { c.translate(px * 2, 0); c.scale(-1, 1); }
    const anchor = { down: [-13.6, 0, 13.8], up: [-12.7, 0, 12.7], left: [-12, 0, 13.1] };
    const offset = (anchor[sourceDir] || anchor.down)[col];
    c.drawImage(revised, col * 362, (rows[sourceDir] ?? 0) * 362, 362, 362, px - size / 2 + offset, py - size + 2, size, size);
    c.restore(); return;
  }
  const sc = 1.05, dw = 84 * sc, dh = 84 * sc;
  c.fillStyle = 'rgba(0,0,0,.28)'; c.beginPath(); c.ellipse(px, py - 6, 15, 6, 0, 0, 7); c.fill();
  // 元絵はコマごとに頭・胴の位置が違う。上半身を基準に微調整し、横揺れを軽減する。
  const anchorX = { down: [-1, 0, 1], left: [0, 0, 0], up: [-1, 0, 4] };
  const mirrorRight = P.dir === 'right', sourceDir = mirrorRight ? 'left' : P.dir;
  c.save();
  if (mirrorRight) { c.translate(px * 2, 0); c.scale(-1, 1); }
  c.drawImage(im, col * 84, (rows[sourceDir] ?? 0) * 84, 84, 84, px - dw / 2 + (anchorX[sourceDir] || anchorX.down)[col] * sc, py - dh + 2, dw, dh);
  c.restore();
}
function drawMissing(c, a, cx, cy) {   // 画像が無いときの仮表示(色付きの人影+名前)。台帳に「未制作」と記録してある素材
  if (a.vis === false) return;
  const px = a.x * T - cx + T / 2, py = a.y * T - cy + T;
  c.fillStyle = 'rgba(0,0,0,.28)'; c.beginPath(); c.ellipse(px, py - 6, 15, 6, 0, 0, 7); c.fill();
  c.fillStyle = '#7a86b8'; c.fillRect(px - 14, py - 62, 28, 56); c.beginPath(); c.arc(px, py - 70, 11, 0, 7); c.fill();
  c.font = '14px ' + FONT; c.fillStyle = '#fff'; c.textAlign = 'center'; c.fillText(a.name || '?', px, py - 86); c.textAlign = 'left';
}
function drawActor(c, a, cx, cy) {
  if (a.vis === false) return;
  const kidSheet = a.sheet === 'walk_kid' && IMG.walk_kid_generated;
  const grannySheet = a.sheet === 'walk_granny' && IMG.walk_granny_generated;
  const carpenterSheet = a.sheet === 'walk_carpenter' && IMG.walk_carpenter_generated;
  const guardSheet = a.sheet === 'walk_guard' && IMG.walk_guard_generated;
  const mayorSheet = a.sheet === 'walk_mayor' && IMG.walk_mayor_generated;
  const miraSheet = a.sheet === 'walk_mira' && IMG.walk_mira_generated;
  const sh = kidSheet || grannySheet || carpenterSheet || guardSheet || mayorSheet || miraSheet || (a.sheet && IMG[a.sheet]);   // 歩行画像があれば使う
  if (sh) {   // 歩行画像(アレンと同じ 3列×4行・1コマ84px)
    const rows = { down: 0, left: 1, right: 2, up: 3 };
    const col = a.walk ? (Math.floor(a.walk * 3) % 2 ? 0 : 2) : 1;
    if (kidSheet) { // 子どもの生成原画は等間隔だが余白が広い。隣のコマを含めずに描く。
      const px = a.x * T - cx + T / 2, py = a.y * T - cy + T, scale = a.scale == null ? 1 : a.scale;
      const h = 68 * scale, w = h * 265 / 330;
      c.fillStyle = 'rgba(0,0,0,.28)'; c.beginPath(); c.ellipse(px, py - 6, 12 * scale, 5 * scale, 0, 0, 7); c.fill();
      const offsets = { down: [0.4, 0, -0.3], up: [1, 0, -1.3], left: [1.7, 0, -0.8], right: [0, 0, 0] };
      c.drawImage(sh, 145 + col * 265, 38 + (rows[a.dir] ?? 0) * 337, 265, 330, px - w / 2 + (offsets[a.dir] || offsets.down)[col] * scale, py - h + 2, w, h);
      return;
    }
    if (grannySheet) { // 横向きの逆向きコマは使わず、右向き素材を必要に応じ反転。
      const px = a.x * T - cx + T / 2, py = a.y * T - cy + T, scale = a.scale == null ? 1 : a.scale;
      const h = 76 * scale, w = h * 300 / 335, side = a.dir === 'left' || a.dir === 'right';
      const sourceCol = side && col === 2 ? 1 : col, sourceRow = side ? 1 : (rows[a.dir] ?? 0);
      c.fillStyle = 'rgba(0,0,0,.28)'; c.beginPath(); c.ellipse(px, py - 6, 14 * scale, 5 * scale, 0, 0, 7); c.fill();
      c.save(); if (a.dir === 'left') { c.translate(px * 2, 0); c.scale(-1, 1); }
      c.drawImage(sh, 54 + sourceCol * 339, 24 + sourceRow * 341, 300, 335, px - w / 2, py - h + 2, w, h);
      c.restore(); return;
    }
    if (carpenterSheet) {
      const px = a.x * T - cx + T / 2, py = a.y * T - cy + T, scale = a.scale == null ? 1 : a.scale;
      const h = 76 * scale, w = h * 300 / 335;
      c.fillStyle = 'rgba(0,0,0,.28)'; c.beginPath(); c.ellipse(px, py - 6, 14 * scale, 5 * scale, 0, 0, 7); c.fill();
      const offsets = { down: [0.4, 0, -0.1], up: [-0.4, 0, 2.2], left: [-1.1, 0, 0.1], right: [0, 0, 0] };
      c.drawImage(sh, 75 + col * 315, 24 + (rows[a.dir] ?? 0) * 341, 300, 335, px - w / 2 + (offsets[a.dir] || offsets.down)[col] * scale, py - h + 2, w, h);
      return;
    }
    if (guardSheet) { // 横向きの混在したコマを避け、左向きの二コマから左右を作る。
      const px = a.x * T - cx + T / 2, py = a.y * T - cy + T, scale = a.scale == null ? 1 : a.scale;
      const h = 100 * scale, side = a.dir === 'left' || a.dir === 'right';
      const sourceCol = side && col === 2 ? 1 : col, sourceRow = side ? 1 : (rows[a.dir] ?? 0);
      c.fillStyle = 'rgba(0,0,0,.28)'; c.beginPath(); c.ellipse(px, py - 6, 18 * scale, 5 * scale, 0, 0, 7); c.fill();
      c.save(); if (a.dir === 'right') { c.translate(px * 2, 0); c.scale(-1, 1); }
      const baseline = (sourceRow === 3 ? 8 : sourceRow === 1 ? 3 : 0) * scale;
      c.drawImage(sh, sourceCol * 362, sourceRow * 362, 362, 362, px - h / 2, py - h + 2 + baseline, h, h);
      c.restore(); return;
    }
    if (mayorSheet) { // 横向きは右を向く行を共有し、左向きのときだけ反転。
      const px = a.x * T - cx + T / 2, py = a.y * T - cy + T, scale = a.scale == null ? 1 : a.scale;
      const h = 76 * scale, w = h * 275 / 340, side = a.dir === 'left' || a.dir === 'right';
      const sourceY = side ? 365 : a.dir === 'up' ? 1065 : 5;
      c.fillStyle = 'rgba(0,0,0,.28)'; c.beginPath(); c.ellipse(px, py - 6, 14 * scale, 5 * scale, 0, 0, 7); c.fill();
      c.save(); if (a.dir === 'left') { c.translate(px * 2, 0); c.scale(-1, 1); }
      const offsets = side ? [-1.9, 0, -4.4] : a.dir === 'up' ? [0.7, 0, -1.1] : [-3.6, 0, -2.4];
      c.drawImage(sh, 125 + col * 275, sourceY, 275, 340, px - w / 2 + offsets[col] * scale, py - h + 2, w, h);
      c.restore(); return;
    }
    if (miraSheet) { // 左向きの行に逆向きが混じるため、右向きの行を反転して使用。
      const px = a.x * T - cx + T / 2, py = a.y * T - cy + T, scale = a.scale == null ? 1 : a.scale;
      const h = 80 * scale, w = h * 260 / 335, side = a.dir === 'left' || a.dir === 'right';
      const sourceY = side ? 365 : a.dir === 'up' ? 1045 : 24;
      c.fillStyle = 'rgba(0,0,0,.28)'; c.beginPath(); c.ellipse(px, py - 6, 14 * scale, 5 * scale, 0, 0, 7); c.fill();
      c.save(); if (a.dir === 'left') { c.translate(px * 2, 0); c.scale(-1, 1); }
      const offsets = side ? [-2.7, 0, -1.2] : a.dir === 'up' ? [-1.9, 0, 1.9] : [-2.0, 0, 1.8];
      c.drawImage(sh, 145 + col * 260, sourceY, 260, 335, px - w / 2 + offsets[col] * scale, py - h + 2, w, h);
      c.restore(); return;
    }
    const sc = (a.sheetScale || 1.05), dw = 84 * sc, px = a.x * T - cx + T / 2, py = a.y * T - cy + T;
    c.fillStyle = 'rgba(0,0,0,.28)'; c.beginPath(); c.ellipse(px, py - 6, 15, 6, 0, 0, 7); c.fill();
    c.drawImage(sh, col * 84, rows[a.dir] * 84, 84, 84, px - dw / 2, py - dw + 2, dw, dw);
    return;
  }
  const im = IMG[a.img] || (a.fallback && IMG[a.fallback]) || (a.fallback2 && IMG[a.fallback2]); if (!im) { drawMissing(c, a, cx, cy); return; }
  const dw = a.fieldWidth || im.width * a.scale, dh = im.height * dw / im.width;
  const px = a.x * T - cx + T / 2, py = a.y * T - cy + T;
  c.fillStyle = 'rgba(0,0,0,.28)'; c.beginPath(); c.ellipse(px, py - 6, dw / 2.2, 6, 0, 0, 7); c.fill();
  let bob = 0; if (a.walk) bob = Math.abs(Math.sin(a.walk * 9)) * -3;
  c.save();
  if (a.img === 'enemy_wolf') { bob = Math.sin(G.t / 18) * 2; if (a.dir === 'right') { c.translate(px * 2, 0); c.scale(-1, 1); } }
  if (a.img === 'npc_bandit' && a.dir === 'right') { c.translate(px * 2, 0); c.scale(-1, 1); }
  c.drawImage(im, px - dw / 2, py - dh + 4 + bob, dw, dh);
  c.restore();
}
function drawField() {
  const ship = typeof CONCEPT_SHIP !== 'undefined' && CONCEPT_SHIP[map.id];
  const [cx, cy] = ship ? [0,0] : camera();
  ctx.fillStyle = '#05040a'; ctx.fillRect(0, 0, W, H);
  ctx.save();
  if (G.shake > 0) ctx.translate((Math.random() - 0.5) * 6, (Math.random() - 0.5) * 6);
  if (map.indoor) { ctx.fillStyle = '#1b1210'; ctx.fillRect(-cx, -cy, map.w * T, map.h * T); }
  if (ship) ctx.scale(W/(map.w*T), H/(map.h*T));
  if (ship && IMG[ship.image]) ctx.drawImage(IMG[ship.image],0,0,map.w*T,map.h*T);
  else drawTiles(cx, cy);
  if (ship) {
    for (const [x,y,label] of ship.exits) {
      if (label === '浮島へ' && !atLeast('c10_ship')) continue;
      const px=(x+.5)*T, py=(y+.9)*T;
      ctx.save(); ctx.fillStyle='rgba(24,19,32,.8)'; roundRect(ctx,px-35,py-12,70,24,8);ctx.fill();
      ctx.font='16px '+FONT;ctx.fillStyle='#ffe8b0';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(label,px,py);ctx.restore();
    }
  }
  const list = [];
  const room = typeof CONCEPT_ROOMS !== 'undefined' && CONCEPT_ROOMS[map.id];
  if (room && room.counter && IMG[room.image]) {
    const [x,y,w,h,base]=room.counter, sx=map.w*T/1536, sy=map.h*T/1024;
    list.push({y:base*sy,d:c=>{c.save();c.beginPath();c.rect(x*sx-cx,y*sy-cy,w*sx,h*sy);c.clip();c.drawImage(IMG[room.image],-cx,-cy,map.w*T,map.h*T);c.restore();}});
  }
  // The painted mast must hide people passing behind it. Redraw only its
  // silhouette at the base's depth, using the original background pixels.
  if (ship && IMG[ship.image]) {
    for (const [top,left,right,bottom] of [[0,668,705,638],[0,1141,1187,513]]) {
      const sx=map.w*T/1672, sy=map.h*T/941;
      list.push({y:bottom*sy,d:c=>{c.save();c.beginPath();
        c.rect(left*sx,top*sy,(right-left)*sx,(bottom-top)*sy);c.clip();
        c.drawImage(IMG[ship.image],0,0,map.w*T,map.h*T);c.restore();}});
    }
  }
  for (const s of statics) list.push({ y: s.y, d: c => { c.save(); c.translate(-cx, -cy); s.draw(c); c.restore(); } });
  for (const a of actors) list.push({ y: (a.y + 1) * T, d: c => drawActor(c, a, cx, cy) });
  list.push({ y: (G.P.y + 1) * T, d: c => drawAllen(c, cx, cy, G.P) });
  list.sort((a, b) => a.y - b.y);
  for (const l of list) l.d(ctx);
  ctx.restore();
  // 色味
  if (map.dim) { ctx.fillStyle = map.dim; ctx.fillRect(0, 0, W, H); }
  if (G.tint > 0) { ctx.fillStyle = `rgba(70,30,80,${G.tint})`; ctx.fillRect(0, 0, W, H); }
  if (map.indoor) { const g = ctx.createRadialGradient(W / 2, H / 2, 200, W / 2, H / 2, 560); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(0,0,0,.3)'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H); }
  if (G.flash > 0) { ctx.fillStyle = `rgba(255,240,200,${G.flash})`; ctx.fillRect(0, 0, W, H); }
  // 回想(リナ)
  if (G.recall) {
    const r = G.recall; r.a = Math.min(0.9, r.a + 0.03);
    ctx.fillStyle = `rgba(255,245,225,${r.a * 0.25})`; ctx.fillRect(0, 0, W, H);
    const im = IMG.lina_big; if (im) { const gx = W / 2, gy = 190; const gr = ctx.createRadialGradient(gx, gy, 10, gx, gy, 230); gr.addColorStop(0, `rgba(255,248,230,${r.a * 0.55})`); gr.addColorStop(1, 'rgba(255,248,230,0)'); ctx.fillStyle = gr; ctx.fillRect(gx - 240, gy - 240, 480, 480); ctx.globalAlpha = r.a; ctx.drawImage(im, W / 2 - im.width / 2, 14); ctx.globalAlpha = 1; }
  }
  // 目的表示
  if (G.obj && G.mode === 'field' && !G.card) {
    ctx.font = '18px ' + FONT; const t = '目的: ' + G.obj; const w = ctx.measureText(t).width + 24;
    ctx.fillStyle = 'rgba(10,8,20,.62)'; roundRect(ctx, 12, 12, w, 34, 8); ctx.fill();
    ctx.fillStyle = '#ffe6a8'; ctx.textBaseline = 'middle'; ctx.fillText(t, 24, 30);
  }
  if (G.toast) { ctx.font = '20px ' + FONT; const w = ctx.measureText(G.toast.text).width + 30; ctx.fillStyle = 'rgba(10,8,20,.75)'; roundRect(ctx, W / 2 - w / 2, 62, w, 38, 10); ctx.fill(); ctx.fillStyle = '#fff'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(G.toast.text, W / 2, 81); ctx.textAlign = 'left'; }
}
function roundRect(c, x, y, w, h, r) { c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r); c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath(); }

function panel(x, y, w, h) {
  // Shared frame: dark lacquer with warm metal edges, inspired by the dungeon UI.
  ctx.save();
  ctx.shadowColor = 'rgba(0,0,0,.55)'; ctx.shadowBlur = 12; ctx.shadowOffsetY = 4;
  const bg = ctx.createLinearGradient(x, y, x, y + h);
  bg.addColorStop(0, 'rgba(48,37,38,.97)'); bg.addColorStop(.22, 'rgba(26,22,29,.97)'); bg.addColorStop(1, 'rgba(15,16,25,.97)');
  ctx.fillStyle = bg; roundRect(ctx, x, y, w, h, 9); ctx.fill();
  ctx.shadowColor = 'transparent'; ctx.shadowBlur = 0; ctx.shadowOffsetY = 0;
  ctx.strokeStyle = '#806540'; ctx.lineWidth = 3; roundRect(ctx, x + 1.5, y + 1.5, w - 3, h - 3, 8); ctx.stroke();
  ctx.strokeStyle = 'rgba(241,206,139,.65)'; ctx.lineWidth = 1; roundRect(ctx, x + 5, y + 5, w - 10, h - 10, 5); ctx.stroke();
  if (w >= 100 && h >= 40) {
    ctx.fillStyle = '#d5ad6b';
    for (const px of [x + 11, x + w - 11]) for (const py of [y + 11, y + h - 11]) {
      ctx.beginPath(); ctx.arc(px, py, 1.5, 0, Math.PI * 2); ctx.fill();
    }
  }
  ctx.restore();
}
function drawDialog() {
  const d = G.dlg;
  panel(30, H - 178, W - 60, 160);
  if (d.name) { ctx.font = 'bold 22px ' + FONT; const nw = ctx.measureText(d.name).width + 36; panel(48, H - 214, nw, 44); ctx.fillStyle = '#ffe6a8'; ctx.textBaseline = 'middle'; ctx.fillText(d.name, 66, H - 192); }
  ctx.font = '25px ' + FONT; ctx.fillStyle = '#fff'; ctx.textBaseline = 'top';
  let left = Math.floor(d.shown);
  for (let i = 0; i < d.lines.length; i++) {
    const t = d.lines[i].slice(0, Math.max(0, left)); left -= d.lines[i].length;
    ctx.fillText(t, 62, H - 160 + i * 36);
  }
  if (d.shown >= d.full) { ctx.fillStyle = '#ffe6a8'; ctx.fillText(Math.floor(G.t / 20) % 2 ? '▼' : '', W - 80, H - 60); }
}
function drawChoice() {
  const c = G.choice;
  if (G.shop && G.mode === 'field') { drawShopChoice(c); return; }
  ctx.font = '25px ' + FONT;
  let w = 240; c.list.forEach(t => w = Math.max(w, ctx.measureText(t).width + 80));
  if (c.prompt) { ctx.font = '22px ' + FONT; w = Math.max(w, ctx.measureText(c.prompt).width + 50); }
  w = Math.min(W - 40, w);
  const visible = Math.min(c.list.length, c.desc ? 6 : 8);
  const first = Math.max(0, Math.min(c.idx - visible + 1, c.list.length - visible));
  const h = visible * 46 + 28 + (c.prompt ? 48 : 0), x = W / 2 - w / 2, y = H / 2 - h / 2 - 20;
  panel(x, y, w, h);
  let yy = y + 20;
  if (c.prompt) { ctx.font = '22px ' + FONT; ctx.fillStyle = '#ffe6a8'; ctx.textBaseline = 'top'; ctx.fillText(c.prompt, x + 25, yy, w - 50); yy += 48; }
  ctx.font = '25px ' + FONT; ctx.textBaseline = 'middle';
  c.list.slice(first, first + visible).forEach((t, row) => {
    const i = first + row;
    if (i === c.idx) { const ry = yy + row * 46; const glow = ctx.createLinearGradient(x + 14, ry, x + w - 14, ry); glow.addColorStop(0, 'rgba(187,132,62,.48)'); glow.addColorStop(1, 'rgba(187,132,62,.12)'); ctx.fillStyle = glow; roundRect(ctx, x + 14, ry, w - 28, 42, 5); ctx.fill(); ctx.strokeStyle = 'rgba(246,210,139,.55)'; ctx.lineWidth = 1; roundRect(ctx, x + 14, ry, w - 28, 42, 5); ctx.stroke(); ctx.fillStyle = '#ffe6a8'; ctx.fillText('▶', x + 24, ry + 21); }
    ctx.fillStyle = i === c.idx ? '#fff' : '#cfc6b0'; const icon = c.icons && IMG[c.icons[i]]; if (icon) ctx.drawImage(icon, x + 53, yy + row * 46 + 4, 34, 34); ctx.fillText(t, x + (icon ? 94 : 56), yy + row * 46 + 21, w - (icon ? 114 : 76));
  });
  if (first > 0 || first + visible < c.list.length) { ctx.fillStyle = '#e8d9b6'; ctx.font = '16px ' + FONT; ctx.textBaseline = 'middle'; ctx.fillText((first > 0 ? '↑' : '') + (first + visible < c.list.length ? '↓' : ''), x + w - 34, y + h - 14); }
  if (c.desc) { const d = c.desc(c.idx); if (d) { panel(30, H - 96, W - 60, 70); ctx.font = '22px ' + FONT; ctx.fillStyle = '#fff'; ctx.textBaseline = 'middle'; ctx.fillText(d, 56, H - 61, W - 112); } }
}
function bar(x, y, w, h, v, mv, col) {
  ctx.save();
  ctx.fillStyle = '#17141a'; ctx.fillRect(x, y, w, h); ctx.fillStyle = col; ctx.fillRect(x, y, w * (mv > 0 ? Math.max(0, Math.min(1, v / mv)) : 0), h);
  ctx.fillStyle = 'rgba(255,255,255,.16)'; ctx.fillRect(x, y, w * (mv > 0 ? Math.max(0, Math.min(1, v / mv)) : 0), Math.max(1, h * .3));
  ctx.strokeStyle = '#c9a56f'; ctx.lineWidth = 1; ctx.strokeRect(x, y, w, h);
  ctx.restore();
}
/* タイトル */
function titleItems() { const it = ['はじめから']; if (anySavedData()) it.push('つづきから'); it.push('操作説明'); return it; }
async function titleSelect(item) {
  if (G.busy) return;
  G.busy = true;
  if (item === '操作説明') { await narrate('移動: 矢印キー / WASD / ゲームパッド / 画面の十字ボタン\n決定・調べる: Z・Enter・スペース\nメニュー・キャンセル: X・Esc\n進行はメニューの「セーブ」で保存できます。'); G.busy = false; return; }
  if (item === 'はじめから' && anySavedData()) { const c = await choose(['はじめから(保存データは残る)', 'やめる'], '最初から始めますか？'); if (c !== 0) { G.busy = false; return; } }
  let slot = 1;
  if (item === 'つづきから') {
    slot = await chooseSaveSlot('読み込むセーブを選んでください', true);
    if (slot === null) { G.busy = false; return; }
  }
  await fade(1, 0.05);
  G.busy = false;
  await startGame(item === 'つづきから', slot);
  if (item === 'つづきから') { await fade(0, 0.05); }
}
function drawTitle() {
  const bg = IMG.bg_title;
  if (bg) { const sc = Math.max(W / bg.width, H / bg.height); ctx.drawImage(bg, (W - bg.width * sc) / 2, (H - bg.height * sc) / 2, bg.width * sc, bg.height * sc); }
  else { ctx.fillStyle = '#223'; ctx.fillRect(0, 0, W, H); }
  const g = ctx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, 'rgba(8,6,20,.55)'); g.addColorStop(.5, 'rgba(8,6,20,.15)'); g.addColorStop(1, 'rgba(8,6,20,.8)');
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.font = 'bold 64px ' + FONT; ctx.lineWidth = 8; ctx.strokeStyle = 'rgba(20,10,0,.85)'; ctx.strokeText('灰の灯火と、約束の旅', W / 2, 130);
  ctx.fillStyle = '#ffe2a0'; ctx.fillText('灰の灯火と、約束の旅', W / 2, 130);
  ctx.font = '24px ' + FONT; ctx.fillStyle = '#fff'; ctx.fillText('序章「声の残る村」', W / 2, 190);
  const items = titleItems();
  if (!G.dlg && !G.choice) items.forEach((t, i) => {
    const y = 340 + i * 52;
    if (i === titleMenu.idx) { ctx.fillStyle = 'rgba(216,184,120,.3)'; roundRect(ctx, W / 2 - 150, y - 22, 300, 44, 10); ctx.fill(); }
    ctx.font = '28px ' + FONT; ctx.fillStyle = i === titleMenu.idx ? '#fff' : '#cfc6b0'; ctx.fillText(t, W / 2, y);
  });
  ctx.font = '16px ' + FONT; ctx.fillStyle = 'rgba(255,255,255,.8)'; ctx.fillText('上下で選択　決定：Z / Enter　音楽を聴く：画面をクリック', W / 2, H - 24);
  ctx.textAlign = 'left';
}
function drawCard() {
  const c = G.card; ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, H);
  ctx.globalAlpha = c.a; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.font = 'bold 44px ' + FONT; ctx.fillStyle = '#ffe2a0'; ctx.fillText(c.title, W / 2, H / 2 - 20);
  ctx.font = '24px ' + FONT; ctx.fillStyle = '#fff'; ctx.fillText(c.sub, W / 2, H / 2 + 40);
  if (c.a >= 1 && Math.floor(G.t / 25) % 2) { ctx.font = '18px ' + FONT; ctx.fillStyle = '#aaa'; ctx.fillText('決定キーでつづける', W / 2, H - 50); }
  ctx.globalAlpha = 1; ctx.textAlign = 'left';
}
function drawEnding() {
  const bg = IMG.bg_table_end || IMG.bg_title;
  if (bg) { const sc = Math.max(W / bg.width, H / bg.height); ctx.drawImage(bg, (W - bg.width * sc) / 2, (H - bg.height * sc) / 2, bg.width * sc, bg.height * sc); }
  else { ctx.fillStyle = '#17131b'; ctx.fillRect(0, 0, W, H); }
  ctx.fillStyle = 'rgba(12,8,12,.64)'; ctx.fillRect(0, 0, W, H);
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillStyle = '#ffe2a0'; ctx.font = 'bold 52px ' + FONT; ctx.fillText('灰の灯火と、約束の旅', W / 2, H / 2 - 42);
  ctx.fillStyle = '#fff'; ctx.font = '24px ' + FONT; ctx.fillText('旅の終わり。灯りは、これからも。', W / 2, H / 2 + 22);
  ctx.font = '18px ' + FONT; ctx.fillStyle = '#e5d8ba'; ctx.fillText('決定キーでタイトルへ', W / 2, H - 58);
  ctx.textAlign = 'left';
}
function draw() {
  ctx.clearRect(0, 0, W, H);
  if (G.mode === 'title') drawTitle();
  else if (G.mode === 'ended') drawEnding();
  else if (G.mode === 'battle') drawBattle();
  else if (map) drawField();
  if (G.card) drawCard();
  if (G.screen && G.screen.type === 'status') drawStatusScreen();
  if (G.cg && IMG[G.cg.img]) { const im = IMG[G.cg.img], s = Math.max(W / im.width, H / im.height); ctx.drawImage(im, (W - im.width * s) / 2, (H - im.height * s) / 2, im.width * s, im.height * s); }
  if (G.pic && IMG[G.pic.img]) {
    const im = IMG[G.pic.img], w = Math.min(im.width, G.pic.img === 'ui_lullaby_text' ? 360 : G.pic.size === 'big' ? 420 : 200), h = im.height * w / im.width;
    // Keep the laboratory's voice waveform above the speakers' heads.
    const cy = G.pic.img === 'ui_voice_wave' || G.pic.img === 'ui_lullaby_text' ? 95 : 190;
    const px = G.pic.img === 'npc_captain_dart' ? W - w - 45 : (W - w) / 2;
    if (G.pic.img === 'npc_deck_crew') {
      // Treat the group art as a cutscene, not oversized figures on the deck.
      ctx.fillStyle = 'rgba(7, 11, 21, .94)'; ctx.fillRect(0, 0, W, H);
      ctx.strokeStyle = 'rgba(217, 185, 121, .65)'; ctx.lineWidth = 2;
      ctx.strokeRect(px - 10, cy - h / 2 - 10, w + 20, h + 20);
    }
    ctx.drawImage(im, px, cy - h / 2, w, h);
  }
  if (G.fade > 0) { ctx.fillStyle = `rgba(0,0,0,${G.fade})`; ctx.fillRect(0, 0, W, H); }
  if (G.dlg) drawDialog();
  if (G.choice) drawChoice();
}

/* ================= 起動 ================= */
let last = performance.now(), acc = 0;
function frame(now) {
  acc += Math.min(100, now - last); last = now;
  let n = 0;
  while (acc >= 1000 / 60 && n < 5) { update(); acc -= 1000 / 60; n++; }
  draw();
  requestAnimationFrame(frame);
}
/* 台帳(未制作・仮)の素材: ファイルがあれば自動で使う。無ければ代替表示のまま。
   マップの小物は入ったときの画像の有無で描き分けるので、起動前に読み込みの成否が出るまで待つ(待たないと、画像があるのに代替のままになる) */
const PH = /[?&]ph=1/.test(location.search);   // ?ph=1 : 開発用の仮画像(tools/placeholder_assets)で、素材の接続を確認する
const LEDGER_LOAD = CHREG.ledger.filter(a => a.file).map(a => new Promise(r => {
  const key = a.file.replace(/^.*\//, '').replace(/\.\w+$/, ''); if (IMG[key]) return r();
  const i = new Image(); let triedReal = false;
  i.onload = () => { IMG[key] = i; r(); };
  i.onerror = () => { if (PH && !triedReal) { triedReal = true; i.src = (window.IMG_BASE || '') + a.file; } else r(); };
  i.src = PH ? (window.PH_BASE || 'tools/placeholder_assets/') + a.file.replace(/^.*\//, '') : (window.IMG_BASE || '') + a.file;
}));
const GAME_ASSETS_READY = Promise.all(IMG_LIST.map(n => new Promise(r => { const i = new Image(); i.onload = () => { IMG[n.replace(/\.\w+$/, '')] = i; r(); }; i.onerror = () => { console.warn('missing', n); r(); }; i.src = (window.IMG_BASE || '') + 'img/' + n; })).concat(LEDGER_LOAD));
GAME_ASSETS_READY.then(() => {
  Snd.bgm('title');
  requestAnimationFrame(frame);
  // 歩行画像(Codex が用意したら自動で使われる。無ければ立ち絵のまま)
  for (const n of ['mayor', 'mayor_generated', 'carpenter', 'carpenter_generated', 'kid', 'kid_generated', 'granny', 'granny_generated', 'guard', 'guard_generated', 'mira', 'mira_generated', 'ferry', 'mother', 'elder', 'hana', 'doctor']) { const i = new Image(); i.onload = () => { IMG['walk_' + n] = i; }; i.src = (window.IMG_BASE || '') + 'img/walk_' + n + '.png'; }
});
/* 配置の点検: 調べる対象・出入口・イベント位置へ歩いて行けるか、小物が水や道にかかっていないか。問題の一覧(空なら問題なし) */
function checkLayout() {
  const prev = map && map.id, out = [];
  for (const id of Object.keys(MAPS)) {
    setMapData(id);
    const start = (MAPS[id].points && MAPS[id].points.start) || (id === 'V' ? [12, 11] : id === 'K' ? [3, 6] : [6, 7]);
    const seen = new Set([start.join()]), q = [start];
    while (q.length) { const [x, y] = q.shift(); for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const nx = x + dx, ny = y + dy, k = nx + ',' + ny; if (!seen.has(k) && !isSolidTile(nx, ny)) { seen.add(k); q.push([nx, ny]); } } }
    const reach = (x, y) => seen.has(x + ',' + y);
    for (const it of inters) {
      let ok = false;
      for (let j = 0; j < (it.h || 1); j++) for (let i = 0; i < (it.w || 1); i++) for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) if (reach(it.x + i + dx, it.y + j + dy)) ok = true;
      if (!ok) out.push(`${id}: 調べる場所(${it.x},${it.y})の隣に行けない`);
    }
    for (const w of warps) if (!reach(w.x, w.y)) out.push(`${id}: 出入口(${w.x},${w.y})に行けない`);
    for (const ar of CHREG.actors) if (ar.map === id) {   // 章の人物は、隣のマスまで歩いて行けること(話しかけられる)
      const [ax, ay] = resolveAt(ar.at, id);
      if (![[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => reach(ax + dx, ay + dy))) out.push(`${id}: 人物 ${ar.id}(${ax},${ay})の隣に行けない`);
    }
    for (const z of zones) {
      let ok = false; for (let j = 0; j < (z.h || 1); j++) for (let i = 0; i < (z.w || 1); i++) if (reach(z.x + i, z.y + j)) ok = true;
      if (!ok) out.push(`${id}: イベント位置(${z.x},${z.y})に行けない`);
    }
    if (!MAPS[id].indoor) {
      const tl = map.tiles;
      const chk = (name, list) => list.forEach(([x, y]) => { const c = tl[y][x]; if (c === 'w' || c === 'b') out.push(`${id}: ${name}(${x},${y})が水の上`); else if (c === 'p' || c === 'r') out.push(`${id}: ${name}(${x},${y})が道や広場の上`); });
      const Lx = LAYOUT[id] || {}; chk('街灯', Lx.lamps || []); chk('樽', Lx.barrels || []); chk('木', Lx.trees || []); chk('看板', Lx.signs || []); chk('生活小物', (Lx.decor || []).filter(d => !d.waterOK).map(d => [d.x, d.y]));
    }
  }
  if (prev) setMapData(prev);
  return out;
}
window.__g = {
  testBattle: async (enemyIds, allyIds, keep) => { if (!keep) { S = newState(); S.items.potion = 2; } S.allies = (allyIds || []).map(id => ({ id, hp: mhpOf(id), mp: mmpOf(id) })); G.mode = 'field'; G.busy = true; enterMap('V', 34, 13, 'right'); G.fade = 0; G.fadeTo = 0; return runBattle(enemyIds); },
  checkLayout, validate: () => validateChapters(), exportLedger: () => JSON.stringify(CHREG.ledger, null, 1), chapters: () => CHAPTERS.map(c => ({ id: c.id, title: c.title, stages: c.stages })), get G() { return G; }, get S() { return S; }, update, draw, actors: () => actors, setStage, startGame, IMG };
