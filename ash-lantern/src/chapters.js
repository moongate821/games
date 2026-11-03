'use strict';
/* 章フレームワーク。第2章以降は、このファイルの registerChapter() に「データだけ」を渡して追加する。
   書き方は ゲーム/章データの書き方.md。章ファイルは src/chapters/chNN.js(index.html で番号順に読み込む)。
   ■ STAGES は末尾に追加するだけ(順序を変えると旧セーブが壊れる)。フラグ・段階名・マップIDは章の接頭辞(c2_ / C2_)を付ける。 */
const CHAPTERS = [];
const CHREG = { zones: [], warps: [], inters: [], actors: [], ledger: [], endings: [] };

/* ---- マップ生成命令 ----
   ['fill', ch]                      全体を ch で埋める
   ['rect', x0,y0,x1,y1, ch]         四角(端を含む)
   ['circle', cx,cy,r, ch]           円(タイル中心で判定)
   ['river', 'h'|'v', 中心, 半幅, 振れ, 周期, ch='w']   うねる川(h=横に流れる: 中心はy、v=縦: 中心はx)
   ['road', x0,y0,x1,y1, 幅, ch='p'] 縦か横の道(幅2など)。端は含む。川の上は 'b' にならない(橋は別命令)
   ['scatter', ch, 確率, 置き換え対象の文字, シード]  対象の文字の所にだけ ch をまき散らす
   ['bridge', x0,y0,x1,y1]           範囲内の水 'w' を橋 'b' に
   ['border', 厚さ, ch='x', [[辺'n'|'s'|'w'|'e', 開始, 終了, 道の文字]...]]  外周を ch で囲む。開口部は道の文字にする
   ['set', x,y, ch]                  1マス
   地面の文字: g草 f花畑 p土の道 s石畳 w水 b橋(木) m苔 r砂利 o木の床 d扉の床 x通れない外周(屋外は森・屋内は壁)
   a砂 l落ち葉の土(どちらも既存の画像の切り出しで描かれる)。マップごとの skin で文字→画像の差し替え、dim で暗がりの色。 */
function buildMapOps(def, init) {   // init = 既存マップの行(あれば、その上に命令を重ねる)
  const w = def.w, h = def.h, g = init ? init.map(r => r.split('')) : Array.from({ length: h }, () => Array(w).fill('g'));
  const set = (x, y, c) => { if (x >= 0 && y >= 0 && x < w && y < h) g[y][x] = c; };
  const get = (x, y) => (x >= 0 && y >= 0 && x < w && y < h) ? g[y][x] : 'x';
  for (const op of def.ops || []) {
    const k = op[0];
    if (k === 'fill') { for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) set(x, y, op[1]); }
    else if (k === 'rect') { for (let y = op[2]; y <= op[4]; y++) for (let x = op[1]; x <= op[3]; x++) set(x, y, op[5]); }
    else if (k === 'circle') { for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const dx = x + 0.5 - op[1], dy = y + 0.5 - op[2]; if (dx * dx + dy * dy <= op[3] * op[3]) set(x, y, op[4]); } }
    else if (k === 'river') {
      const [, dir, c0, hw, amp, per, ch] = op;
      for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
        const along = dir === 'h' ? x : y, across = dir === 'h' ? y : x;
        if (Math.abs(across + 0.5 - (c0 + (amp || 0) * Math.sin(along * (per || 0.25)))) < hw + 0.12 * Math.sin(along * 0.6)) set(x, y, ch || 'w');
      }
    }
    else if (k === 'road') {
      const [, x0, y0, x1, y1, wd, ch] = op, c = ch || 'p', t = wd || 2;
      if (y0 === y1) { for (let x = x0; x <= x1; x++) for (let j = 0; j < t; j++) if (get(x, y0 + j) !== 'w' && get(x, y0 + j) !== 'b') set(x, y0 + j, c); }
      else { for (let y = y0; y <= y1; y++) for (let j = 0; j < t; j++) if (get(x0 + j, y) !== 'w' && get(x0 + j, y) !== 'b') set(x0 + j, y, c); }
    }
    else if (k === 'scatter') { const R = rng(op[4] || 7); for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (get(x, y) === op[3] && R() < op[2]) set(x, y, op[1]); }
    else if (k === 'bridge') { for (let y = op[2]; y <= op[4]; y++) for (let x = op[1]; x <= op[3]; x++) if (get(x, y) === 'w') set(x, y, 'b'); }
    else if (k === 'border') {
      const t = op[1] || 2, ch = op[2] || 'x';
      for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (x < t || y < t || x >= w - t || y >= h - t) set(x, y, ch);
      for (const [side, a, b, road] of op[3] || []) for (let i = a; i <= b; i++) for (let j = 0; j < t; j++) {
        if (side === 'w') set(j, i, road); else if (side === 'e') set(w - 1 - j, i, road); else if (side === 'n') set(i, j, road); else if (side === 's') set(i, h - 1 - j, road);
      }
    }
    else if (k === 'set') set(op[1], op[2], op[3]);
  }
  return g.map(r => r.join(''));
}

/* 'MAP@名前' または [x,y] を [x,y] にする */
function resolveAt(at, mapId) {
  if (typeof at === 'string') {
    const i = at.indexOf('@'), mid = i < 0 ? mapId : at.slice(0, i), nm = i < 0 ? at : at.slice(i + 1);
    const m = MAPS[mid]; const p = m && m.points && m.points[nm];
    if (!p) { console.warn('章データ: 名前付きの場所が見つからない', at); return [1, 1]; }
    return p;
  }
  return at;
}

function registerChapter(c) {
  CHAPTERS.push(c);
  for (const s of c.stages || []) if (!STAGES.includes(s)) STAGES.push(s);
  Object.assign(OBJECTIVE, c.objectives || {});
  for (const id of Object.keys(c.maps || {})) {
    const d = c.maps[id];
    MAPS[id] = { id, name: d.name, tiles: d.tiles || buildMapOps(d), indoor: !!d.indoor, tileArt: d.tileArt, skin: d.skin, dim: d.dim, bgm: d.bgm, points: d.points || {}, solid: d.solid };
    LAYOUT[id] = d.layout || {};
  }
  // 既存マップへの追記(前の章のマップに出口を足すときなど): mapPatch:{K:[命令...]}、mapPoints:{K:{名前:[x,y]}}
  for (const id of Object.keys(c.mapPatch || {})) { const rows = MAPS[id].tiles; MAPS[id].tiles = buildMapOps({ w: rows[0].length, h: rows.length, ops: c.mapPatch[id] }, rows); }
  for (const id of Object.keys(c.mapPoints || {})) MAPS[id].points = Object.assign(MAPS[id].points || {}, c.mapPoints[id]);
  for (const id of Object.keys(c.layoutPatch || {})) { const L = LAYOUT[id] = LAYOUT[id] || {}, d = c.layoutPatch[id]; for (const k of Object.keys(d)) L[k] = Array.isArray(d[k]) ? (L[k] || []).concat(d[k]) : d[k]; }
  Object.assign(STORY, c.story || {});
  Object.assign(ENEMIES, c.enemies || {}); Object.assign(SKILLS, c.skills || {});
  Object.assign(ITEMS, c.items || {}); Object.assign(GEAR, c.gear || {}); Object.assign(ALLIES, c.allies || {});
  for (const z of c.zones || []) CHREG.zones.push(z);
  for (const z of c.warps || []) CHREG.warps.push(z);
  for (const z of c.inters || []) CHREG.inters.push(z);
  for (const z of c.actors || []) CHREG.actors.push(z);
  for (const a of c.assets || []) CHREG.ledger.push(Object.assign({ chapter: c.id }, a));
}

/* マップを作るとき(setMapData の最後)に、登録された出入口・ゾーン・調べる場所を差し込む */
function applyRegistry(id) {
  const cond = s => !s || storyCond(s);
  for (const z of CHREG.warps) if (z.map === id) {
    const [x, y] = resolveAt(z.at, id), [tx, ty] = resolveAt(z.to_at, z.to);
    warps.push({ x, y, to: z.to, tx, ty, dir: z.dir || 'down', cond: () => cond(z.cond) });
  }
  for (const z of CHREG.zones) if (z.map === id) {
    const a = resolveAt(z.at, id); const r = Array.isArray(a[0]) ? a : a;
    zones.push({ x: r[0], y: r[1], w: r[2] || 1, h: r[3] || 1, cond: () => cond(z.cond) && (z.repeat || !S.flags['z_' + z.story]),
      fn: async () => { if (!z.repeat) S.flags['z_' + z.story] = true; await play(STORY[z.story]); } });   // 既定は1回だけ(何度も走らせるなら repeat:true)
  }
  for (const z of CHREG.inters) if (z.map === id) {
    const r = resolveAt(z.at, id);
    inters.push({ x: r[0], y: r[1], w: r[2] || 1, h: r[3] || 1, fn: () => play(STORY[z.story]) });
  }
}
function registryActors() {
  for (const a of CHREG.actors) if (a.map === map.id && (!a.when || storyCond(a.when))) {
    const [x, y] = resolveAt(a.at, map.id);
    addActor({ id: a.id, img: a.img, fallback: a.fallback, fallback2: a.fallback2, sheet: a.sheet, x, y, dir: a.dir || 'down', name: a.name, scale: a.scale ?? 1.0, fieldWidth: a.fieldWidth, solid: a.solid !== false, talk: a.story ? () => play(STORY[a.story]) : undefined });
  }
}
