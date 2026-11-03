'use strict';
/* 素材の接続表: 台帳(章ファイルの assets)の ID → ゲームのどこに表示するか。
   ここに書いた物は「ファイル(img/xxx.png)を置けば、その場所に自動で表示される」。置かれていないあいだは代替表示(台帳の fallback)。
   ■ 接続した ID は ASSET_USE に説明が入り、`chapter_check.ps1` の ledgerConnected に数えられる。
   ■ まだ表示場所が無い物は ASSET_PENDING に理由つきで入る(未接続のまま。完成扱いにしない)。
   ■ 画像の大きさは台帳の spec(例「96x80」)から読む。Codex が spec どおりに作れば、位置と大きさがそろう。
   ■ 確認用: URL に ?ph=1 を付けると、tools/placeholder_assets/ の仮画像(tools/make_placeholders.py で作る)を台帳の名前で読み込み、接続を実画面で確かめられる(img/ には置かない)。 */
const ASSET_USE = {}, ASSET_PENDING = {}, ASSET_PROBLEMS = [];
(function () {
  const ent = id => CHREG.ledger.find(a => a.id === id);
  const key = id => { const e = ent(id); return e && e.file ? e.file.replace(/^.*\//, '').replace(/\.\w+$/, '') : null; };
  const use = (id, where) => { ASSET_USE[id] = ASSET_USE[id] ? ASSET_USE[id] + ' / ' + where : where; };
  const pend = (id, why) => { if (ent(id) && !ASSET_USE[id]) ASSET_PENDING[id] = why; };
  const width = (id, dflt) => { const e = ent(id), m = e && /(\d+)\s*[x×]\s*(\d+)/.exec(e.spec || ''); return m ? +m[1] : dflt; };

  /* ---- 地面(tileArt: マップの元の文字 → 専用タイル。192×192 の継ぎ目なし) ---- */
  const tile = (id, map, ch) => { const k = key(id); if (!k || !MAPS[map]) return; (MAPS[map].tileArt = MAPS[map].tileArt || {})[ch] = k; use(id, `${map} の「${ch}」マス`); };
  tile('tile.salt_flat', 'C2_ROAD', 's'); tile('tile.salt_flat', 'C2_CAMP', 's');
  tile('tile.dock_stone', 'C3_PORT', 's'); tile('tile.sea_deep', 'C3_PORT', 'w');
  tile('tile.royal_stone', 'C4_CAPITAL', 's'); tile('tile.royal_stone', 'C4_CASTLE', 'o'); tile('tile.royal_stone', 'C11_HALL', 'o');
  tile('tile.cave_floor', 'C4_ESCAPE', 'o'); tile('tile.cave_floor', 'C5_TUNNEL', 'o'); tile('tile.cave_floor', 'C13_CORE', 'o');
  tile('tile.cave_wall', 'C5_MINE', 'x');
  tile('tile.ruin_floor', 'C9_RUIN', 'o');
  tile('tile.deck_wood', 'C10_SHIP', 'o'); tile('tile.deck_wood', 'C12_DECK', 'o');
  tile('tile.sky_cloud', 'C10_ISLES', 'w');
  tile('tile.ash_sea', 'C12_SEA', 'w'); tile('tile.ash_ground', 'C12_SEA', 'l');
  tile('tile.light_floor', 'C14_HEART', 'o');

  /* ---- 建物(art: 建物の座標で指定。幅6タイル) ---- */
  const bld = (id, map, x, y) => { const k = key(id), b = ((LAYOUT[map] || {}).buildings || []).find(b => b.x === x && b.y === y); if (!k || !b) return; b.art = k; use(id, `${map} の建物(${x},${y})`); };
  bld('bld.waystation', 'C2_ROAD', 5, 9);
  bld('bld.warehouse', 'C3_PORT', 8, 11);
  bld('bld.castle_gate', 'C4_CAPITAL', 21, 6); bld('bld.castle_gate', 'C4_CAPITAL', 27, 6);
  bld('bld.mine_entrance', 'C5_MINE', 28, 10); bld('bld.tailor_shop', 'C5_TOWN', 18, 11);
  bld('bld.furnace_hall', 'C6_VALLEY', 32, 9); bld('bld.observatory', 'C8_OBS', 17, 9);
  bld('bld.lighthouse', 'C9_GATE', 8, 6); bld('bld.table_house', 'C16_VILLAGE', 12, 9);
  const lighthouse = (LAYOUT.C9_GATE.buildings || []).find(b => b.art === key('bld.lighthouse'));
  if (lighthouse) lighthouse.artWidth = 192; // 縦長の灯台がマップ上端で切れない幅

  /* ---- 小物・家具(art: 既にある飾り/家具の座標で差し替え) ---- */
  const swap = (id, map, x, y) => {
    const k = key(id), l = LAYOUT[map] || {}, d = [...(l.decor || []), ...(l.furn || [])].find(d => d.x === x && d.y === y);
    if (!k || !d) return; d.art = k;
    if (d.w != null) d.dw = width(id, d.dw); else d.aw = width(id, 96);   // furn は dw、decor は aw(描く横幅 px)
    use(id, `${map} の飾り/家具(${x},${y})`);
  };
  swap('prop.refugee_tent', 'C2_CAMP', 11, 15); swap('prop.refugee_tent', 'C2_CAMP', 23, 15); swap('prop.refugee_tent', 'C2_CAMP', 14, 19);
  // 避難用のテントは人が入れる縮尺にし、足元の横幅にも当たり判定を付ける。
  for (const d of (LAYOUT.C2_CAMP.decor || []).filter(d => d.art === key('prop.refugee_tent'))) { d.aw = 144; d.blockW = 3; }
  swap('prop.supply_wagon', 'C2_ROAD', 15, 11); swap('prop.market_stall', 'C3_MARKET', 23, 9);
  for (const d of (LAYOUT.C3_MARKET.decor || []).filter(d => d.art === key('prop.market_stall'))) d.blockW = 3;
  swap('prop.prison_bars', 'C4_CASTLE', 14, 5); swap('prop.throne', 'C4_CASTLE', 9, 2); swap('prop.throne', 'C11_HALL', 10, 2);
  swap('prop.rubble', 'C5_TUNNEL', 17, 6); swap('prop.mine_cart', 'C5_MINE', 34, 11);
  swap('prop.gravestone', 'C7_HILL', 18, 6); swap('prop.gravestone', 'C7_HILL', 22, 6);
  swap('prop.observation_console', 'C8_LAB', 6, 3); swap('prop.sea_lamp', 'C9_RUIN', 12, 4);
  swap('prop.voice_furnace', 'C14_HEART', 10, 2); swap('prop.new_furnace', 'C16_VILLAGE', 20, 14); swap('prop.table_set', 'C16_TABLE', 7, 4);
  for (const d of (LAYOUT.C7_HILL.decor || []).filter(d => d.art === key('prop.gravestone'))) d.aw = 72;
  for (const d of (LAYOUT.C16_TABLE.furn || []).filter(d => d.art === key('prop.table_set'))) d.dw = 118; // 椅子と室内の2マスの食卓に合わせる
  for (const d of (LAYOUT.C16_VILLAGE.decor || []).filter(d => d.art === key('prop.new_furnace'))) d.blockW = 3;
  // 新しく置く(当たり判定なしの飾り。ファイルが無いあいだは何も描かない)。位置は台帳の note と名前付きの場所から
  const place = (id, map, at) => {
    const k = key(id), m = MAPS[map]; if (!k || !m) return;
    const p = typeof at === 'string' ? (m.points || {})[at] : at; if (!p) return;
    const l = LAYOUT[map] = LAYOUT[map] || {}; (l.decor = l.decor || []).push({ img: null, art: k, x: p[0], y: p[1], aw: width(id, 96), noblock: true });
    use(id, `${map} の ${typeof at === 'string' ? '点「' + at + '」' : '(' + p + ')'}(新規の飾り・当たり判定なし)`);
  };
  place('prop.small_boat', 'C3_PORT', [22, 20]); // 陸の木箱ではなく、桟橋の隣の水面に浮かべる
  const harborBoat = (LAYOUT.C3_PORT.decor || []).find(d => d.art === key('prop.small_boat'));
  if (harborBoat) harborBoat.waterOK = true;
  place('prop.hatch', 'C4_CASTLE', [15, 2]); place('prop.valve_wheel', 'C6_FURNACE', [11, 3]); place('prop.big_furnace_core', 'C6_FURNACE', 'boss');
  place('prop.ship_wheel', 'C10_SHIP', [24, 8]); place('prop.lullaby_device', 'C11_DEVICE', 'core'); place('prop.ash_cave_mouth', 'C12_SEA', 'gate');
  place('prop.crown_core', 'C13_CORE', 'crown'); place('prop.vision_mist', 'C13_CORE', 'vision1'); place('prop.vision_mist', 'C13_CORE', 'vision2'); place('prop.vision_mist', 'C13_CORE', 'vision3');
  place('prop.wayside_bench', 'C15_ROAD', 'rest');
  // 幻は各人物が向き合った後に消え、章を越えて残り続けない。
  for (const [point, flag] of [['vision1','c13_v1'], ['vision2','c13_v2'], ['vision3','c13_v3']]) {
    const pos = MAPS.C13_CORE.points[point];
    const d = (LAYOUT.C13_CORE.decor || []).find(x => x.art === key('prop.vision_mist') && x.x === pos[0] && x.y === pos[1]);
    if (d) d.visible = () => atLeast('c13_start') && !atLeast('c13_crown') && !S.flags[flag];
  }

  /* ---- 人物(台帳の名前の img に差し替え、今の絵は fallback に回す) ---- */
  const npc = (id, ids) => { const k = key(id); if (!k) return; const hit = []; for (const a of CHREG.actors) if (ids.includes(a.id)) { a.fallback = a.fallback || a.img; a.img = k; hit.push(a.map + ':' + a.id); } if (hit.length) use(id, '人物 ' + hit.join(', ')); };
  npc('npc.dockman', ['c3_foreman', 'c3_boatman', 'c3_cook']); npc('npc.miner', ['c5_miners']); npc('npc.keeper', ['c9_keeper']);
  for (const a of CHREG.actors.filter(a => ['c3_foreman', 'c3_boatman', 'c3_cook'].includes(a.id))) a.fieldWidth = 56;
  for (const a of CHREG.actors.filter(a => a.id === 'c5_miners')) a.fieldWidth = 56;
  npc('npc.auto_keeper', ['c10_auto']); npc('npc.deck_crew', ['c12_crew']);
  for (const a of CHREG.actors.filter(a => ['c9_keeper', 'c10_auto'].includes(a.id))) a.fieldWidth = a.id === 'c10_auto' ? 44 : 50;

  /* ---- 戦闘の表示(battle.js)。画像が置かれていれば自動で使われる ---- */
  const code = (id, where) => { if (ent(id)) use(id, where); };
  code('prop.salt_scrub', '第2章: 塩の街道の砂地に岩と草を配置');
  code('ui.target_arrow', '戦闘: 対象選択中、選んでいる相手の頭上(無ければ金色の三角)');
  for (const id of ['ui.boss_frame', 'ui.boss_nameplate', 'ui.cmd_icons', 'ui.mp_gauge']) pend(id, '戦闘画面再設計後は画像を参照せず、ゲーム内描画の枠・アイコン・ゲージを使用');
  code('fx.hit', '戦闘: 通常攻撃が当たったとき'); code('fx.light', '戦闘: 「ひかり」系の技'); code('fx.heal', '戦闘: 回復技・回復薬'); code('fx.rain', '戦闘: 全体技(あめのうた系)');
  code('fx.guard', '戦闘: 防御'); code('fx.enemy_strong', '戦闘: 敵の強攻撃'); code('fx.limit_teaching', '戦闘: ガルドの教え'); code('fx.boss_appear', '戦闘: ボス戦の最初の約0.7秒'); code('fx.ash_burst', '戦闘: 灰の冠の強攻撃');
  for (const c of ['mira', 'gardo', 'noah', 'serena']) code(`battle.${c}_cast`, `戦闘: ${c} が技を使うとき(技のポーズ)`);
  code('battle.allen_attack', '戦闘: アレンが攻撃するとき(後ろ姿の振り下ろし)');
  code('enemy.bridge_beast_pose', '戦闘: 橋の灰獣が身構えたとき(enemy_crab_pose)'); code('enemy.ash_wolf_pose', '戦闘: 灰狼が身構えたとき(enemy_wolf_pose)');
  for (const [id, bg] of [['bg.throne_room', 'rogue_device'], ['bg.underwater', 'deep_keeper / deep_fish'], ['bg.ash_horizon', 'ash_beast'], ['bg.ash_core', 'ash_shade / ash_crown']]) code(id, `戦闘の背景: ${bg}`);

  /* ---- 一枚絵(bg)・挿絵(pic): 台本の途中に差し込む。台本は story*.js のまま、ここで命令を足す ---- */
  const txt = op => JSON.stringify(op);
  const findIn = (script, pred) => { for (let i = 0; i < script.length; i++) { if (pred(script[i])) return [script, i]; const op = script[i]; const subs = op[0] === 'if' ? [op[2], op[3]] : op[0] === 'ask' ? (op[4] || []) : []; for (const s of subs) if (s) { const r = findIn(s, pred); if (r) return r; } } return null; };
  const show = (id, storyName, startPred, endPred, mk) => {   // mk=[表示の命令, 消す命令]
    const sc = STORY[storyName], k = key(id); if (!k) return; if (!sc) { ASSET_PROBLEMS.push(`${id}: 台本 ${storyName} が無い`); return; }
    const a = startPred === 0 ? [sc, 0] : findIn(sc, startPred); if (!a) { ASSET_PROBLEMS.push(`${id}: ${storyName} に表示位置が見つからない`); return; }
    const [arr, i] = a; arr.splice(i, 0, mk[0](k));
    let j = arr.length; if (endPred) { for (let q = i + 2; q < arr.length; q++) if (endPred(arr[q], q - i)) { j = q; break; } }
    arr.splice(j, 0, mk[1]); use(id, `台本 ${storyName}`);
  };
  const BG = [k => ['bg', k], ['bg', null]], PIC = [k => ['pic', k, 'small'], ['pic', null]], PICB = [k => ['pic', k, 'big'], ['pic', null]];
  const isOp = n => op => op[0] === n, has = s => op => txt(op).includes(s);
  show('bg.furnace_collapse', 'c6_guardian', isOp('leave'), isOp('stage'), BG);
  show('bg.lighthouse_log', 'c9_keeper_boss', isOp('ask'), (op, d) => d >= 3, BG);
  show('bg.sky_isles', 'c10_auto', 0, isOp('battle'), BG);
  show('bg.throne_hall', 'c4_king', 0, isOp('stage'), BG); show('bg.throne_hall', 'c11_king', 0, isOp('battle'), BG);
  show('bg.ash_sea', 'c12_gate', 0, isOp('battle'), BG); show('bg.ash_sea', 'c14_voice', 0, isOp('ask'), BG);
  show('bg.table_end', 'c16_kid', has('食卓に、笑い声が広がった'), isOp('end_game'), BG);
  show('ui.empty_plate', 'c16_kid', has('皿のない席'), has('空けておいて'), PICB);
  show('item.gardo_letter', 'c16_kid', has('折りたたまれた紙'), (op, d) => d >= 2, PIC);
  show('ui.letters', 'c15_post', 0, null, PICB);
  show('ui.bell_glow', 'c14_furnace', has('鈴'), (op, d) => d >= 2, PIC);
  show('ui.voice_wave', 'c8_serena', 0, null, PIC);
  show('ui.lullaby_text', 'c4_king', has('子守歌'), (op, d) => d >= 2, PIC); show('ui.lullaby_text', 'c11_king', has('子守歌'), (op, d) => d >= 2, PIC);
  show('item.gardo_pan', 'c7_mira', has('鍋'), (op, d) => d >= 2, PIC);

  /* ---- 未接続のまま残る物(理由つき) ---- */
  for (const id of ['ui.status_icons', 'fx.status_poison', 'fx.status_sleep']) pend(id, '状態異常のしくみが未実装(実装したときに接続)');
  pend('ui.turn_order', '行動順の表示が未実装(提案の段階)');
  for (const id of ['prop.ship_mast', 'prop.floating_isle_edge', 'prop.small_lantern_core', 'prop.road_lantern_row', 'prop.dune_rock', 'npc.captain_dart', 'prop.wayside_bench', 'prop.hatch', 'prop.valve_wheel', 'prop.ship_wheel', 'prop.big_furnace_core', 'prop.lullaby_device', 'prop.ash_cave_mouth', 'prop.crown_core', 'prop.vision_mist'])
    pend(id, '配置する場所が決まっていない/名前付きの場所が無い(Codex と座標を決めてから接続)');
  pend('item.gardo_pan', '台本に「鍋」の場面が見つからない');
})();
