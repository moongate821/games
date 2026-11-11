'use strict';
/* マップ・台詞などのデータ。台本は 物語・シナリオ/序章_会話イベント台本.md が元。 */
const T = 48;
const IMG_LIST = ['dg_icon_3506.png','dg_icon_3512.png','dg_icon_3522.png', 'dg_icon_3006.png','dg_icon_3012.png','dg_icon_1003.png','dg_icon_1052.png','dg_icon_1310.png','dg_icon_1311.png', 'prop_shop_counter.png', 'prop_shop_supplies.png', 'prop_shop_weapons.png', 'prop_shop_armor.png', 'shop_bread.png', 'shop_staff.png', 'shop_knife.png', 'shop_coat.png', 'shop_elixir.png', 'shop_potion.png', 'shop_ether.png', 'shop_sword.png', 'shop_armor.png', 'shop_charm.png', 'allen.png', 'allen_walk_v2.png', 'battle_allen_idle_v2.png', 'battle_mira_idle_v2.png', 'battle_gardo_idle_v2.png', 'battle_noah_idle_v2.png', 'battle_serena_idle_v2.png', 'prop_village_furnace_v2.png', 'npc_mayor.png', 'npc_carpenter.png', 'npc_blacksmith.png', 'npc_innkeeper.png', 'npc_lina.png',
  'npc_granny.png', 'npc_guard.png', 'npc_kid.png', 'item_bell.png', 'item_potion.png', 'item_repair.png',
  'bld_workshop.png', 'bld_inn.png', 'bld_workshop_front.png', 'bld_hall_front.png', 'prop_lamp.png', 'prop_tree.png', 'prop_barrel.png', 'prop_sign.png',
  'enemy_wolf.png', 'bg_battle.jpg', 'bg_title.jpg',
  'tile_grass.png', 'tile_path.png', 'tile_stone.png', 'tile_flower.png', 'tile_water.png', 'tile_moss.png',
  'tile_gravel.png', 'tile_wood.png', 'tile_soil.png', 'lina_big.png',
  'furn_table.png', 'furn_workbench.png', 'furn_table_orthogonal.png', 'furn_bed_orthogonal.png', 'furn_bench_orthogonal.png', 'furn_bookshelf_orthogonal.png', 'furn_toolrack_orthogonal.png', 'furn_jarshelf_orthogonal.png', 'prop_lamp_tall.png', 'furn_chair_orthogonal.png', 'furn_rug_orthogonal.png', 'furn_chair.png', 'furn_bed.png', 'furn_bookshelf.png', 'furn_rug.png', 'furn_lantern.png', 'furn_stove.png',
  'furn_chest.png', 'furn_barrel.png', 'furn_crate.png', 'furn_toolrack.png', 'furn_jarshelf.png', 'furn_fence.png',
  'furn_flowerpot.png', 'furn_well.png',
  'tile_sand.png', 'tile_leaf.png', 'furn_cauldron.png', 'battle_mira.png', 'enemy_slime.png', 'enemy_bat.png', 'npc_mira.png', 'enemy_crab.png',
  'npc_gardo.png', 'npc_noah.png', 'npc_serena.png', 'npc_emma.png', 'npc_alvan.png', 'battle_gardo.png', 'battle_noah.png', 'battle_serena.png', 'enemy_guard.png', 'enemy_golem.png'];

IMG_LIST.push('item_armorbreak_powder.png', 'item_weakening_powder.png', 'item_scroll_cataclysm.png', 'prop_deck_rail.png', 'prop_ship_hatch.png', 'prop_ship_mast_open.png', 'prop_ship_stern.png', 'furn_bench_concept.png', 'prop_shop_supplies_concept.png', 'prop_shop_forge_concept.png', 'prop_undersea_column.png', 'wall_workshop_concept.png', 'prop_royal_fountain.png', 'window_workshop_concept.png', 'bg_workshop_concept.png', 'prop_royal_fountain_garden.png', 'bg_harbor_warehouse.png', 'bg_mine_tunnel_concept.png', 'bg_observatory_lab_concept.png', 'bg_castle_audience_concept.png');
IMG_LIST.push('bg_inn_remembrance.png', 'bg_escape_drain.png', 'bg_furnace_heart_concept.png');
IMG_LIST.push('fx_status_poison.png', 'fx_status_sleep.png');

// 地面の種類 → 画像名
const TILE_IMG = { g: 'tile_grass', f: 'tile_flower', p: 'tile_path', s: 'tile_stone', w: 'tile_water', b: 'tile_wood',
  a: 'tile_sand', l: 'tile_leaf', m: 'tile_moss', r: 'tile_gravel', o: 'tile_wood', d: 'tile_wood', x: 'tile_moss' };

function rng(seed) { let s = seed >>> 0; return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296); }

/* ---- 灯守村(40×28) ---- */
function buildVillage() {
  const w = 40, h = 28;
  const g = Array.from({ length: h }, () => Array(w).fill('g'));
  const set = (x, y, c) => { if (x >= 0 && y >= 0 && x < w && y < h) g[y][x] = c; };
  const get = (x, y) => (x >= 0 && y >= 0 && x < w && y < h) ? g[y][x] : 'x';
  const R = rng(7);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (R() < 0.1) set(x, y, 'f');
  // 村外れ(東)は苔のまだら
  for (let y = 0; y < h; y++) for (let x = 32; x < w; x++) if (Math.sin(x * 0.8 + y * 0.3) + Math.sin(y * 0.7 - x * 0.35) > 0.5) set(x, y, 'm');
  // 川(うねらせる)
  const rcx = y => 5.9 + 0.9 * Math.sin(y * 0.3), rhw = y => 1.55 + 0.1 * Math.sin(y * 0.5 + 1);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (Math.abs(x + 0.5 - rcx(y)) < rhw(y)) set(x, y, 'w');
  // 道: 太さを少しだけ不規則にして、直線に見えないようにする
  const n1 = x => Math.sin(x * 1.3) + Math.sin(x * 0.37 + 2) > 0.55;
  const n2 = x => Math.sin(x * 1.1 + 1) + Math.sin(x * 0.43 + 4) > 0.55;
  const road = (x, y) => { if (get(x, y) !== 'w') set(x, y, 'p'); };
  for (let x = 2; x < 40; x++) { road(x, 13); road(x, 14); if (n1(x)) road(x, 12); if (n2(x)) road(x, 15); }
  for (let y = 2; y < 26; y++) { road(19, y); road(20, y); if (n1(y)) road(18, y); if (n2(y)) road(21, y); }
  for (let y = 10; y <= 12; y++) { road(12, y); road(13, y); }
  for (let y = 9; y <= 12; y++) { road(27, y); road(28, y); }
  for (let y = 15; y <= 18; y++) { road(12, y); road(13, y); road(28, y); road(29, y); }
  // 広場(石畳・ほぼ円)
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const dx = x + 0.5 - 20, dy = y + 0.5 - 14; if (dx * dx + dy * dy <= 27.5) set(x, y, 's'); }
  // 川岸の小石
  for (let y = 1; y < h - 1; y++) for (let x = 1; x < w - 1; x++) {
    if (get(x, y) === 'g' || get(x, y) === 'f') {
      if ([[1, 0], [-1, 0], [0, 1], [0, -1]].some(d => get(x + d[0], y + d[1]) === 'w') && Math.sin(x * 2.1 + y * 1.7) > 0.35) set(x, y, 'r');
    }
  }
  // 橋(川が道を横切る所)
  for (let y = 13; y <= 14; y++) for (let x = 0; x < 14; x++) if (get(x, y) === 'w') set(x, y, 'b');
  // 村外れの道
  for (let x = 33; x < 40; x++) { set(x, 13, 'r'); set(x, 14, 'r'); }
  // 森(外周)
  for (let x = 0; x < w; x++) { set(x, 0, 'x'); set(x, 1, 'x'); set(x, h - 1, 'x'); set(x, h - 2, 'x'); }
  for (let y = 0; y < h; y++) { set(0, y, 'x'); set(1, y, 'x'); if (y !== 13 && y !== 14) { set(w - 1, y, 'x'); set(w - 2, y, 'x'); } }
  return g.map(r => r.join(''));
}

/* ---- 川霧の町(40×26): 第1章。横に川が流れ、橋が1本。北岸に民家、南岸に診療所 ---- */
function buildKirimachi() {
  const w = 40, h = 26;
  const g = Array.from({ length: h }, () => Array(w).fill('g'));
  const set = (x, y, c) => { if (x >= 0 && y >= 0 && x < w && y < h) g[y][x] = c; };
  const get = (x, y) => (x >= 0 && y >= 0 && x < w && y < h) ? g[y][x] : 'x';
  const R = rng(21);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (R() < 0.1) set(x, y, 'f');
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (Math.sin(x * 0.5 + y * 0.9) + Math.sin(y * 0.4 - x * 0.3) > 1.2) set(x, y, 'm');
  // 川(横に流れる。増水して幅が広い)
  const cy = x => 11.5 + 0.7 * Math.sin(x * 0.22), hw = x => 1.95 + 0.12 * Math.sin(x * 0.6);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (Math.abs(y + 0.5 - cy(x)) < hw(x)) set(x, y, 'w');
  const n1 = x => Math.sin(x * 1.3) + Math.sin(x * 0.37 + 2) > 0.55;
  const road = (x, y) => { if (get(x, y) !== 'w') set(x, y, 'p'); };
  for (let x = 1; x < 39; x++) { road(x, 6); road(x, 7); if (n1(x)) road(x, 8); road(x, 20); road(x, 21); if (n1(x + 3)) road(x, 22); }
  for (let y = 8; y <= 19; y++) { road(20, y); road(21, y); }
  // 川岸の小石
  for (let y = 1; y < h - 1; y++) for (let x = 1; x < w - 1; x++) if ((get(x, y) === 'g' || get(x, y) === 'f') && [[1, 0], [-1, 0], [0, 1], [0, -1]].some(d => get(x + d[0], y + d[1]) === 'w') && Math.sin(x * 2.1 + y * 1.7) > 0.35) set(x, y, 'r');
  // 橋
  for (let y = 0; y < h; y++) for (let x = 20; x <= 21; x++) if (get(x, y) === 'w') set(x, y, 'b');
  // 森(外周)。西(x=0)の出入口の道は空ける
  for (let x = 0; x < w; x++) { set(x, 0, 'x'); set(x, 1, 'x'); set(x, h - 1, 'x'); set(x, h - 2, 'x'); }
  for (let y = 0; y < h; y++) { set(w - 1, y, 'x'); set(w - 2, y, 'x'); if (y < 4 || y > 9) { set(0, y, 'x'); set(1, y, 'x'); } }
  for (let y = 4; y <= 9; y++) { set(0, y, y === 6 || y === 7 ? 'p' : 'g'); set(1, y, y === 6 || y === 7 ? 'p' : 'g'); }
  return g.map(r => r.join(''));
}

/* ---- 工房の中(14×10) ---- */
function buildWorkshop() {
  const rows = [];
  for (let y = 0; y < 10; y++) {
    let s = '';
    for (let x = 0; x < 14; x++) {
      if (y < 2 || x === 0 || x === 13 || y === 9) s += 'x'; else s += 'o';
    }
    rows.push(s);
  }
  rows[9] = rows[9].slice(0, 6) + 'd' + rows[9].slice(7);
  return rows;
}

const MAPS = {
  V: { id: 'V', name: '灯守村', tiles: buildVillage(), indoor: false, points: { start: [12, 11] } },
  W: { id: 'W', name: '修理工房', tiles: buildWorkshop(), indoor: true, points: { start: [6, 4] } },
  K: { id: 'K', name: '川霧の町', tiles: buildKirimachi(), indoor: false, points: { start: [3, 6] } }
};

// 台本の状態(進行)
const STAGES = ['start', 'bell_seen', 'mayor_spoken', 'tools_obtained', 'furnace_taken', 'wolf_defeated', 'prologue_complete', 'c1_arrive', 'c1_town', 'c1_ready', 'c1_bridge', 'c1_medicine', 'c1_complete'];
const OBJECTIVE = {
  start: '工房の机を調べ、それから広場へ向かおう。',
  bell_seen: '広場で村長に話しかけよう。',
  mayor_spoken: '工房で修理道具を受け取ろう。',
  tools_obtained: '灯火炉のある広場へ戻ろう。',
  furnace_taken: '村外れへ向かおう。(東の道)',
  wolf_defeated: '公民館の前へ戻ろう。',
  prologue_complete: '序章はここまで。村の人と話したり、セーブできる。(村の東の道の先が、川霧の町)',
  c1_arrive: '川霧の町の人に話を聞こう。',
  c1_town: '渡し守と、治療師ミラに話を聞こう。',
  c1_ready: '橋へ向かい、灰獣を倒そう。(橋の北側)',
  c1_bridge: '橋を渡って、診療所で薬を受け取ろう。',
  c1_medicine: '薬を、まだ飲めていない人へ届けよう。',
  c1_complete: '第1章はここまで。町の人と話したり、セーブできる。'
};

const SAVE_KEY = 'ash_lantern_save_v1';
const SAVE_VERSION = 1;
