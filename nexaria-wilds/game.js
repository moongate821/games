'use strict';
// NEXARIA WILDS 【作成中】 — 斜め見下ろし・ドット絵・精密エイム・スコープ
// 設計: 資料/設計書_異世界転生シューター.md
const W = 960, H = 540, T = 32, MW = 88, MH = 60, WALLH = 12;
const cv = document.getElementById('c'), ctx = cv.getContext('2d');
const $ = id => document.getElementById(id);
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const lerp = (a, b, k) => a + (b - a) * k;
const rad = d => d * Math.PI / 180;
let seedv = 1; const rnd = () => (seedv = (seedv * 1664525 + 1013904223) >>> 0) / 4294967296;
const R = (a, b) => a + Math.random() * (b - a);

// ---------- ドット絵(左半分の文字列を左右反転して作る) ----------
function mk(half, pal, S) {
  S = S || 2;
  const w = half[0].length * 2, h = half.length;
  const c = document.createElement('canvas'); c.width = w * S; c.height = h * S;
  const g = c.getContext('2d');
  half.forEach((row, y) => {
    const full = row + row.split('').reverse().join('');
    for (let x = 0; x < w; x++) {
      const col = pal[full[x]]; if (!col) continue;
      g.fillStyle = col; g.fillRect(x * S, y * S, S, S);
    }
  });
  return c;
}
const LEGS_A = ['..ppp.', '..ppp.', '..ppp.', '..bbb.', '..bbb.'];
const LEGS_B = ['.pp...', '.pp...', 'pp....', 'bb....', 'bb....'];
const PL_TOP = ['..KKKK', '.KKKKK', 'KKKsss', 'Kseess', '.sssss', 'jjjjjj', 'jjjjjg', 'Jjjjjg', 'sJjjjj', '.Jjjjj', '.ppppp'];
const PL_PAL = { K: '#3b82f6', s: '#fcd9b0', e: '#0b1020', j: '#0ea5e9', J: '#0369a1', g: '#67e8f9', p: '#334155', b: '#0b1020' };
const GN_TOP = ['..HHHH', '.HHHHH', '.Hvvvv', '.HHHHH', '...HHH', 'AAAAAA', 'AAAAaa', 'sAAAaa', '.AAAAA', '.ppppp'];
function palGn(h, a, v) { return { H: h, v: v, A: a, a: '#00000055', s: '#fcd9b0', p: '#1f2937', b: '#0b1020' }; }
const SPR = {
  p0: mk(PL_TOP.concat(LEGS_A), PL_PAL), p1: mk(PL_TOP.concat(LEGS_B), PL_PAL),
  gn0: mk(GN_TOP.concat(LEGS_A), palGn('#991b1b', '#dc2626', '#22d3ee')), gn1: mk(GN_TOP.concat(LEGS_B), palGn('#991b1b', '#dc2626', '#22d3ee')),
  sn0: mk(GN_TOP.concat(LEGS_A), palGn('#581c87', '#7c3aed', '#f43f5e')), sn1: mk(GN_TOP.concat(LEGS_B), palGn('#581c87', '#7c3aed', '#f43f5e')),
  hv0: mk(GN_TOP.concat(LEGS_A), palGn('#9a3412', '#ea580c', '#fde047'), 3), hv1: mk(GN_TOP.concat(LEGS_B), palGn('#9a3412', '#ea580c', '#fde047'), 3),
  dr0: mk(['...rrr', '.rrRRR', 'rRRyyy', 'RRyYYY', 'RyYYee', 'RyYYee', 'RRyYYY', 'rRRyyy', '.rrRRR', '...rrr', 'g....g'], { r: '#7f1d1d', R: '#dc2626', y: '#fca5a5', Y: '#fecaca', e: '#22d3ee', g: '#fbbf24' }),
  dr1: mk(['...rrr', '.rrRRR', 'rRRyyy', 'RRyYYY', 'RyYYee', 'RyYYee', 'RRyYYY', 'rRRyyy', '.rrRRR', '...rrr', '.g..g.'], { r: '#7f1d1d', R: '#dc2626', y: '#fca5a5', Y: '#fecaca', e: '#22d3ee', g: '#fbbf24' }),
};
// Geminiで作ったアキラの絵(akira_sprite.js)。walk: 0=右足 1=立ち 2=左足(反転) 3=立ち。無ければ従来のコード絵を使う
function mkPx(rows, pal, flip) {
  const w = rows[0].length, h = rows.length, c = document.createElement('canvas'); c.width = w; c.height = h; const g = c.getContext('2d');
  rows.forEach((row, y) => { for (let x0 = 0; x0 < w; x0++) { const ch = row[flip ? w - 1 - x0 : x0]; if (ch === '.') continue; g.fillStyle = pal[parseInt(ch, 36)]; g.fillRect(x0, y, 1, 1); } });
  return c;
}
if (typeof AKIRA_PX !== 'undefined') {
  const a = AKIRA_PX; SPR.walk = a.frames.map(f => mkPx(f, a.pal)); SPR.stand = SPR.walk[1];
}
// 敵4種(ENEMY_PX)と銃5種(WEAPON_PX)のドット絵。face: 絵が向いている向き(右=1/左=-1)。k: 表示倍率
SPR.en = {}; SPR.gun = {};
if (typeof ENEMY_PX !== 'undefined') { const face = { drone: 1, gunner: -1, sniper: 1, heavy: 1 }; for (const k in ENEMY_PX) SPR.en[k] = { img: mkPx(ENEMY_PX[k].rows, ENEMY_PX[k].pal), face: face[k], k: k === 'heavy' ? .9 : .8 }; }
if (typeof BOSS_PX !== 'undefined') for (const k in BOSS_PX) SPR.en[k] = { img: mkPx(BOSS_PX[k].rows, BOSS_PX[k].pal), face: 1, sym: true, k: .68 };
// 動物の敵(Geminiで作成。正面・真横(右向き)・真後ろの3方向)。あれば従来の絵を置き換える
if (typeof ANIMAL_PX !== 'undefined') { const kk = { drone: .8, gunner: .8, sniper: .8, heavy: .9, beast: .9, boss1: .68, boss2: .68 }; for (const id in ANIMAL_PX) { const v = ANIMAL_PX[id], o = {}; for (const d of ['front', 'side', 'back']) if (v[d]) o[d] = mkPx(v[d].rows, v[d].pal); if (o.front && o.side && o.back) SPR.en[id] = { img: o.front, views: o, face: 1, sym: true, k: kk[id] || .8 }; } }
// 向き付きキャラ: front/back/side それぞれ [立ち, 歩きA, 歩きB]
SPR.char = {};
if (typeof AKIRA_PX !== 'undefined') { const a = AKIRA_PX, fr = a.frames.map(f => mkPx(f, a.pal)); SPR.char.akira = { front: [fr[1], fr[0], fr[2]] }; }
if (typeof CHAR_PX !== 'undefined') for (const id in CHAR_PX) { SPR.char[id] = SPR.char[id] || {}; for (const dir in CHAR_PX[id]) SPR.char[id][dir] = CHAR_PX[id][dir].map(f => mkPx(f.rows, f.pal)); }
SPR.prop = {}; if (typeof PROP_PX !== 'undefined') for (const k in PROP_PX) SPR.prop[k] = mkPx(PROP_PX[k].rows, PROP_PX[k].pal);
const dprop = (id, wx, wy, k) => { const im = SPR.prop[id]; if (!im) return false; const z = cam.z * k, w = im.width * z, h = im.height * z; ctx.drawImage(im, sx(wx) - w / 2, sy(wy) + 6 * cam.z - h, w, h); return true; };
SPR.fx = {}; if (typeof EFFECT_PX !== 'undefined') for (const k in EFFECT_PX) SPR.fx[k] = mkPx(EFFECT_PX[k].rows, EFFECT_PX[k].pal);
let fxs = []; // 爆発など(エフェクトの絵)。{x,y,t,dur,k}
SPR.item = {}; if (typeof ITEM_PX !== 'undefined') for (const k in ITEM_PX) SPR.item[k] = mkPx(ITEM_PX[k].rows, ITEM_PX[k].pal);
if (typeof WALL_PX !== 'undefined') SPR.wallFront = WALL_PX.front.map(f => mkPx(f.rows, f.pal));
if (typeof TILE_PX !== 'undefined') SPR.tiles = TILE_PX.map(t => mkPx(t.rows, t.pal));
if (typeof WEAPON_PX !== 'undefined') { const kk = { pistol: .5, sniper: .37, smg: .55, shotgun: .47, rifle: .44 }; for (const k in WEAPON_PX) SPR.gun[k] = { img: mkPx(WEAPON_PX[k].rows, WEAPON_PX[k].pal), k: kk[k] }; }
const BOSS_HALF =['......xxxxxx', '....xxXXXXXX', '...xXXXXXXXX', '..xXXeeXXXXX', '..xXXeeXXXXX', '..xXXXXXXXXX', '...xxXXccccc', 'xx.xXXcCCCCC', 'XXxxXXcCCCCC', 'XwxXXXccccc.', 'XwxXXXXXXXXX', 'xx.xXXXXXXXX', '...xXXwwXXXX', '...xXXXXXXXX', '...xxXXXXXXX', '..xxXXXxxxxx', '..xXXXX.....', '..xXXXX.....', '..xxxxx.....', '..XXXXX.....'];
SPR.bs1 = mk(BOSS_HALF, { x: '#1e293b', X: '#475569', w: '#94a3b8', c: '#9f1239', C: '#f43f5e', e: '#fde047' }, 3);
SPR.bs2 = mk(BOSS_HALF, { x: '#2e1065', X: '#6d28d9', w: '#c4b5fd', c: '#0e7490', C: '#22d3ee', e: '#f43f5e' }, 3);

// ---------- データ ----------
const WEAPONS = [
  { id: 'pistol', pen: 18, name: 'ハンドガン', dmg: 20, rate: .30, spread: 2, speed: 760, pellets: 1, auto: false, mag: 12, res: Infinity, reload: 1.0, zoom: 1.3, unlock: 1, rec: 3, rng: 800 },
  { id: 'sniper', pen: 62, name: 'スナイパー', dmg: 130, rate: 1.0, spread: 5, scoped: .15, speed: 2400, pellets: 1, auto: false, mag: 5, res: 25, reload: 1.8, zoom: 2.2, unlock: 1, rec: 12, pierce: 2, rng: 1500 },
  { id: 'smg', pen: 14, name: 'SMG', dmg: 9, rate: .07, spread: 5, speed: 800, pellets: 1, auto: true, mag: 30, res: 150, reload: 1.3, zoom: 1.3, unlock: 2, rec: 2.2, rng: 700 },
  { id: 'shotgun', pen: 20, name: 'ショットガン', dmg: 9, rate: .8, spread: 9, speed: 700, pellets: 7, auto: false, mag: 6, res: 36, reload: 1.8, zoom: 1.25, unlock: 3, rec: 8, rng: 420 },
  { id: 'rifle', pen: 36, name: 'アサルト', dmg: 22, rate: .14, spread: 2.5, speed: 900, pellets: 1, auto: true, mag: 24, res: 120, reload: 1.5, zoom: 1.4, unlock: 4, rec: 2.8, rng: 950 },
];
// タルコフ式: 防具クラス×10 が防げる貫通力。貫通されなければ鈍的ダメージ(blunt)だけ通る。ap=耐久
const ARMOR = [{ n: '作業着', cls: 0, max: 0 }, { n: '軽量スーツ(Class2)', cls: 2, max: 60 }, { n: '戦闘装甲(Class3)', cls: 3, max: 110 }, { n: '外骨格(Class4)', cls: 4, max: 180 }];
function penChance(pen, cls) { return cls <= 0 ? 1 : clamp((pen - cls * 10 + 10) / 20, .04, .96); }
const EN = {
  drone: { cls: 0, val: 10, hp: 40, spd: 120, r: 10, spr: 'dr', col: '#dc2626' },
  gunner: { cls: 1, val: 25, hp: 70, spd: 85, r: 11, spr: 'gn' },
  sniper: { cls: 2, val: 45, hp: 50, spd: 70, r: 11, spr: 'sn' },
  heavy: { cls: 3, val: 70, hp: 240, spd: 55, r: 15, spr: 'hv' },
  beast: { cls: 1, val: 35, hp: 95, spd: 150, r: 12, spr: 'bt' },
  boss1: { cls: 3, val: 400, hp: 1100, spd: 50, r: 30, spr: 'bs1', boss: 1 },
  boss2: { cls: 4, val: 900, hp: 2200, spd: 55, r: 30, spr: 'bs2', boss: 2 },
};
const STAGES = [
  { n: '春の花畑', biome: 'spring', wallStyle: 'tree', water: true, fl: ['#4f8a3c', '#559040'], wl: ['#2f6b34', '#245a2b'], acc: '#f9a8d4' },
  { n: '若葉の森', biome: 'forest', wallStyle: 'tree', fl: ['#2f6035', '#356a3a'], wl: ['#1f4d2a', '#143a1e'], acc: '#bef264' },
  { n: '夕暮れの海岸', biome: 'beach', wallStyle: 'rock', fl: ['#dcc78c', '#e2cf96'], wl: ['#8b8478', '#6b6458'], acc: '#38bdf8' },
  { n: '濃霧の入り江', biome: 'cove', wallStyle: 'rock', gim: 'fog', fl: ['#b4a574', '#bcad7c'], wl: ['#56606b', '#3d4650'], acc: '#67e8f9' },
  { n: 'BOSS 砂漠の主', biome: 'desert', wallStyle: 'sand', water: true, gim: 'heat', fl: ['#d9ac60', '#dfb46a'], wl: ['#a8743a', '#85582a'], acc: '#f59e0b', boss: 'boss1' },
  { n: '岩山の稜線', biome: 'mountain', wallStyle: 'rock', gim: 'wind', fl: ['#82826f', '#8a8a77'], wl: ['#5d5f63', '#3f4146'], acc: '#cbd5e1' },
  { n: '針葉樹の山道', biome: 'pine', wallStyle: 'pine', fl: ['#617259', '#69795f'], wl: ['#1e3d2f', '#12281e'], acc: '#86efac' },
  { n: '氷河の裂け目', biome: 'glacier', wallStyle: 'ice', gim: 'ice', fl: ['#c4e4f1', '#cde9f5'], wl: ['#7cc4de', '#4f9fc0'], acc: '#e0f2fe' },
  { n: '雪山の吹雪', biome: 'snow', wallStyle: 'snowpine', gim: 'blizzard', fl: ['#e6edf4', '#dde6ef'], wl: ['#a9b8c8', '#7a8ba0'], acc: '#ffffff' },
  { n: 'BOSS 氷の山頂', biome: 'summit', wallStyle: 'ice', fl: ['#d0dcea', '#c6d5e6'], wl: ['#8fa7c4', '#5f7ca0'], acc: '#a5f3fc', boss: 'boss2' },
];
// 戦利品の名前: 面が進むほど「魔導」から工業的な名前に変わる(違和感の伏線)。[通常, 希少]
const LOOT_NAMES = [
  ['クローバーの蜜', '春の花束'], ['どんぐり', '森の宝石'], ['貝殻', '海の真珠'], ['海藻の束', '深海の真珠'], ['サボテンの実', '砂漠の琥珀'],
  ['岩塩', '山の水晶'], ['松ぼっくり', '古い蜜蝋'], ['氷のかけら', '氷河の青玉'], ['雪の結晶', '雪豹の牙'], ['白い毛皮', '山頂の星石'],
];
// 各面に1つある「記録」(データログ)。拾うと伏線の断片が読める。
const LOGS = [
  '花畑の隅に、古い作業靴が埋まっている。サイズは、俺の足にぴったりだ。…これは、前の世界の俺のものだ。',
  '木の根元に、錆びた名札。「A.」とだけ読める。…Aは俺のイニシャルだ。偶然だろうか。',
  '波打ち際の瓶に、紙切れ。「ここは、獣たちが銃を拾った浜。人間の落とし物は、全部ここに流れ着く」',
  '霧の入り江。濃い霧の向こうで、誰かが俺の名前を呼んだ気がした。',
  '【砂漠の主の唸り】「人間の匂い。覚えている。あの日、空から降ってきた、お前の匂い」',
  '岩山の石碑。「銃は人間が置いていった。使い方を教えたのは、白い兎だった」',
  '針葉樹の洞に、小さな日記。「ミオ、今日も森の入り口で待った。あの人は来なかった」',
  '氷に閉じ込められた景色に、落ちていく俺と、手を伸ばす白い兎が映っている。――ミオ?',
  '吹雪の中、足跡が一組だけ山頂へ続いている。小さな、兎の足跡だ。',
  '【白き王の声】「落ちた者よ、思い出せ。お前がここへ来た理由を。私は、ただ守っていただけだ」',
];
// 各面の強敵(ミニボス役)。通常の敵の強化版: 体力3.5倍・大型・周期的に全方位弾・良い戦利品
// 面ごとのギミック(短い説明を面の開始時に出す)。4=暗闇 6=氷で滑る 7=風で弾が流れる 8=高温 9=胞子で霞む。全面共通で5分後に「大嵐」
// 遊べるキャラ: アキラ+二頭身どうぶつ4匹(隠れ家の「着替え」で購入・選択)。性能差は小さめの調整
const CHARS = [
  { id: 'akira', n: 'アキラ', d: 'バランス型。転生した元エンジニア。', cost: 0, spd: 1, hp: 1, breath: 1, sway: 1, heal: 1 },
  { id: 'mike', n: 'ミケ(ネコ)', d: 'すばしこい。足が速いが体力は少なめ。', cost: 300, spd: 1.16, hp: .8, breath: 1, sway: 1, heal: 1 },
  { id: 'pochi', n: 'ポチ(イヌ)', d: '回復上手。医療キットの効果+25%、体力やや多め。', cost: 300, spd: 1.04, hp: 1.08, breath: 1, sway: 1, heal: 1.25 },
  { id: 'mimi', n: 'ミミ(ウサギ)', d: 'スコープが得意。息止めが長く、照準の揺れが小さい。有効射程+15%。', cost: 400, spd: 1, hp: .9, breath: 1.5, sway: .75, heal: 1, rngm: 1.15 },
  { id: 'gon', n: 'ゴン(クマ)', d: 'タフ。体力+35%だが足は遅い。', cost: 400, spd: .88, hp: 1.35, breath: 1, sway: 1, heal: 1 },
];
let charId = 'akira', owned = { akira: 1 };
try { charId = localStorage.getItem('nx_char') || 'akira'; owned = Object.assign(owned, JSON.parse(localStorage.getItem('nx_owned') || '{}')); } catch (e) { }
const CH = () => CHARS.find(c => c.id === charId) || CHARS[0];
const GIMMICK = { 4: '濃霧: 視界が狭い', 5: '熱砂: 防具Class2未満は体力がじわじわ減る', 6: '強風: 弾が横に流される', 8: '氷の床: 足が滑る', 9: '吹雪: 視界が霞む' };
let STORM_T = 300;
let clock = { h: 8, day: 1 }; try { Object.assign(clock, JSON.parse(localStorage.getItem('nx_clock') || '{}')); } catch (e) { }
const saveClock = () => { try { localStorage.setItem('nx_clock', JSON.stringify(clock)); } catch (e) { } };
const isNight = () => clock.h >= 20 || clock.h < 6;
const isStormDay = () => clock.day % 3 === 0;
const clockStr = () => String(Math.floor(clock.h)).padStart(2, '0') + ':' + String(Math.floor((clock.h % 1) * 60)).padStart(2, '0');
// レーダー: 範囲内の敵だけが見える。スコープで構えると、狙っている方向だけ遠くまで見える。撃たれた/撃った敵は短時間「ping」で位置が分かる
const effRange = w => w.rng * .7 * (mods.barrel ? 1.25 : 1) * (CH().rngm || 1); // 有効射程(これより遠いと威力半分)
const radarR = () => 200 * (mods.radar ? 1.3 : 1) * (1 + .08 * base.comms) * (hasG('goggle') ? 1.15 : 1); // 全周の「近くは分かる」距離
const radarFar = () => 430 * (mods.radar ? 1.3 : 1) * (1 + .08 * base.comms) * (P.scoped > .5 ? 1.35 : 1); // 前方60度の見える距離
const CONE = rad(30); // 前方60度 = 左右30度ずつ
function radarVis(e) {
  const dx = e.x - P.x, dy = e.y - P.y, d = Math.hypot(dx, dy), boss = EN[e.type].boss ? 1.5 : 1;
  const near = radarR() * boss, far = radarFar() * boss;
  let a = Math.abs(Math.atan2(dy, dx) - P.aimA); a = Math.min(a, Math.PI * 2 - a);
  const cone = a <= CONE ? 1 : a >= CONE + rad(8) ? 0 : 1 - (a - CONE) / rad(8);
  const vNear = Math.max(0, Math.min(1, (near - d) / (near * .55)));
  const vFar = d < far * .55 ? 1 : Math.max(0, (far - d) / (far * .45));
  return Math.max(vNear, vFar * cone);
}
// ---------- バッグ・装備・秘密基地 ----------
const BAGS = [
  { n: '布のポーチ', slots: 3, loot: 600, cost: 0 },
  { n: 'ミリタリーバッグ', slots: 5, loot: 1500, cost: 300 },
  { n: '革のバックパック', slots: 8, loot: 4000, cost: 800 },
  { n: '次元ポケット', slots: 12, loot: 99999, cost: 2000 },
];
const GEAR = [
  { id: 'goggle', slot: 'head', n: 'ナイトゴーグル', d: '暗闇・胞子の影響が半分に。近くのレーダー+15%', cost: 400 },
  { id: 'helm', slot: 'head', n: '獣革ヘルメット', d: '受けるダメージ -8%', cost: 500 },
  { id: 'vest', slot: 'body', n: '戦術ベスト', d: 'バッグの枠 +2', cost: 450 },
  { id: 'medvest', slot: 'body', n: '救護ベスト', d: '医療キットの回復 +25%', cost: 600 },
  { id: 'boots', slot: 'feet', n: '軽量ブーツ', d: '移動速度 +8%', cost: 350 },
  { id: 'glove', slot: 'hand', n: '速装グローブ', d: '装填が25%速い', cost: 300 },
  { id: 'steady', slot: 'hand', n: '安定グローブ', d: '照準の揺れ -15%', cost: 450 },
];
const SLOTN = { head: '頭', body: '胴', feet: '足', hand: '手' };
const FAC = {
  storage: { n: '倉庫', d: '出撃時に医療キットを1個/Lvずつ持って行く', cost: [200, 500, 1000], ico: 'S' },
  power: { n: '発電室', d: '脱出に必要な時間 -0.5秒/Lv(3秒→1.5秒)', cost: [300, 700, 1500], ico: 'P' },
  comms: { n: '通信室', d: 'レーダーの範囲 +8%/Lv', cost: [250, 600, 1200], ico: 'C' },
  lab: { n: '研究室', d: '持ち帰った戦利品の売値 +10%/Lv', cost: [350, 800, 1600], ico: 'L' },
  kitchen: { n: '食堂', d: '次の面へ持ち越す時の回復 +15/Lv', cost: [200, 500, 1000], ico: 'K' },
};
let bagLv = 0, gearOwn = {}, gearEq = {}, base = { storage: 0, power: 0, comms: 0, lab: 0, kitchen: 0 };
try { bagLv = +localStorage.getItem('nx_bag') || 0; gearOwn = JSON.parse(localStorage.getItem('nx_gearown') || '{}'); gearEq = JSON.parse(localStorage.getItem('nx_geareq') || '{}'); Object.assign(base, JSON.parse(localStorage.getItem('nx_base') || '{}')); } catch (e) { }
const REQ = { goggle: 'q6', helm: 'q2', medvest: 'q8', steady: 'q3', bag2: 'q7', bag3: 'q4', lab: 'q6', kitchen: 'q6', power: 'q8', radar: 'q9' };
const qOk = k => !REQ[k] || !!claimed[REQ[k]];
const qName = k => { const q = QUESTS.find(x => x.id === REQ[k]); return q ? q.n : ''; };

// ---------- アイコン(コードで描く24x24。ゲーム内アイテムと隠れ家の一覧で共通) ----------
const ICO = {
  bomb: g => { R_(g, 12, 14, 8, '#1f2937'); R_(g, 10, 12, 3, '#6b7280'); g.fillStyle = '#a16207'; g.fillRect(14, 4, 3, 4); g.fillRect(16, 2, 3, 3); g.fillStyle = '#fbbf24'; g.fillRect(18, 0, 4, 3); g.fillStyle = '#ef4444'; g.fillRect(19, 1, 2, 1); g.fillStyle = '#374151'; g.fillRect(9, 5, 7, 3); },
  flash: g => { g.fillStyle = '#9ca3af'; g.fillRect(7, 5, 10, 17); g.fillStyle = '#e5e7eb'; g.fillRect(8, 5, 3, 17); g.fillStyle = '#fde047'; g.fillRect(7, 11, 10, 4); g.fillStyle = '#4b5563'; g.fillRect(6, 3, 12, 3); g.fillRect(6, 21, 12, 2); g.fillStyle = '#ef4444'; g.fillRect(10, 0, 4, 3); },
  cure: g => { g.fillStyle = '#c4b5fd'; g.fillRect(5, 9, 11, 6); g.fillStyle = '#7c3aed'; g.fillRect(6, 10, 8, 4); g.fillStyle = '#e5e7eb'; g.fillRect(16, 10, 5, 4); g.fillRect(20, 11, 4, 2); g.fillStyle = '#9ca3af'; g.fillRect(2, 7, 3, 10); g.fillRect(0, 11, 2, 2); g.fillStyle = '#fff'; g.fillRect(7, 10, 2, 1); },
  feather: g => { g.fillStyle = '#e5e7eb'; for (let i = 0; i < 18; i++) { g.fillRect(3 + i, 20 - i, 3 + (i < 9 ? i >> 1 : (18 - i) >> 1), 2); } g.fillStyle = '#9ca3af'; for (let i = 0; i < 20; i++) g.fillRect(2 + i, 22 - i, 1, 1); g.fillStyle = '#fff'; g.fillRect(12, 8, 3, 2); },
  bag0: g => bag(g, '#a16207', '#78350f', '#fbbf24', 0), bag1: g => bag(g, '#4d7c0f', '#365314', '#a3e635', 1), bag2: g => bag(g, '#1d4ed8', '#1e3a8a', '#22d3ee', 2), bag3: g => bag(g, '#7c3aed', '#4c1d95', '#f0abfc', 3),
  goggle: g => { g.fillStyle = '#374151'; g.fillRect(1, 9, 22, 7); g.fillStyle = '#111827'; g.fillRect(2, 10, 8, 5); g.fillRect(14, 10, 8, 5); g.fillStyle = '#22d3ee'; g.fillRect(3, 11, 6, 3); g.fillRect(15, 11, 6, 3); g.fillStyle = '#9ca3af'; g.fillRect(10, 11, 4, 2); },
  helm: g => { g.fillStyle = '#4b5563'; g.beginPath(); g.arc(12, 14, 10, Math.PI, 0); g.fill(); g.fillRect(2, 14, 20, 5); g.fillStyle = '#9ca3af'; g.fillRect(6, 8, 5, 3); g.fillStyle = '#22d3ee'; g.fillRect(9, 15, 6, 2); },
  vest: g => { g.fillStyle = '#374151'; g.fillRect(4, 3, 16, 19); g.fillStyle = '#111827'; g.fillRect(9, 3, 6, 5); g.fillStyle = '#6b7280'; g.fillRect(6, 11, 5, 5); g.fillRect(13, 11, 5, 5); g.fillStyle = '#fbbf24'; g.fillRect(6, 18, 12, 2); },
  medvest: g => { g.fillStyle = '#e5e7eb'; g.fillRect(4, 3, 16, 19); g.fillStyle = '#111827'; g.fillRect(9, 3, 6, 5); g.fillStyle = '#ef4444'; g.fillRect(10, 10, 4, 10); g.fillRect(7, 13, 10, 4); },
  boots: g => { g.fillStyle = '#78350f'; g.fillRect(5, 3, 8, 14); g.fillRect(5, 15, 17, 6); g.fillStyle = '#451a03'; g.fillRect(5, 20, 17, 2); g.fillStyle = '#fbbf24'; g.fillRect(6, 6, 6, 1); g.fillRect(6, 9, 6, 1); },
  glove: g => { g.fillStyle = '#0e7490'; g.fillRect(6, 10, 13, 11); g.fillRect(6, 4, 3, 7); g.fillRect(10, 2, 3, 9); g.fillRect(14, 4, 3, 7); g.fillStyle = '#22d3ee'; g.fillRect(6, 17, 13, 3); },
  steady: g => { g.fillStyle = '#6d28d9'; g.fillRect(6, 10, 13, 11); g.fillRect(6, 4, 3, 7); g.fillRect(10, 2, 3, 9); g.fillRect(14, 4, 3, 7); g.fillStyle = '#c4b5fd'; g.fillRect(6, 17, 13, 3); g.fillStyle = '#fff'; g.fillRect(11, 13, 3, 3); },
};
function R_(g, cx, cy, r, c) { g.fillStyle = c; g.beginPath(); g.arc(cx, cy, r, 0, 7); g.fill(); }
function bag(g, c1, c2, c3, lv) { g.fillStyle = c2; g.fillRect(8, 1, 8, 4); g.fillStyle = c1; g.fillRect(4, 5, 16, 17); g.fillStyle = c2; g.fillRect(4, 14, 16, 2); g.fillRect(8, 16, 8, 6); g.fillStyle = c3; g.fillRect(10, 17, 4, 2); for (let i = 0; i < lv; i++) g.fillRect(6 + i * 4, 8, 3, 3); }
function mkIco(name) { const c = document.createElement('canvas'); c.width = 24; c.height = 24; const g = c.getContext('2d'); if (ICO[name]) ICO[name](g); return c; }
for (const k of ['bomb', 'flash', 'cure', 'feather']) SPR.item[k] = mkIco(k);
// Meshy(CC0)の3Dモデルから作ったドット絵: 爆発樽・弾薬箱・手榴弾(読み込めなければ従来の絵)
SPR.mx = {}; if (typeof MESHY_PX !== 'undefined') for (const k in MESHY_PX) { const im = new Image(); im.src = MESHY_PX[k]; SPR.mx[k] = im; }
if (typeof MESHY_DECOR !== 'undefined') for (const k in MESHY_DECOR) { const im = new Image(); im.src = MESHY_DECOR[k]; SPR.mx[k] = im; }
const mxOk = k => { const im = SPR.mx && SPR.mx[k]; return im && im.complete && im.naturalWidth ? im : null; };
if (typeof MESHY_BEAST !== 'undefined') { const bim = new Image(); bim.onload = () => { if (SPR.en.beast && SPR.en.beast.views) return; const fr = []; for (let i = 0; i < 8; i++) { const c = document.createElement('canvas'); c.width = MESHY_BEAST.w; c.height = MESHY_BEAST.h; c.getContext('2d').drawImage(bim, i * MESHY_BEAST.w, 0, MESHY_BEAST.w, MESHY_BEAST.h, 0, 0, MESHY_BEAST.w, MESHY_BEAST.h); fr.push(c); } SPR.en.beast = { img: fr[0], frames: fr, face: 1, k: .55, sym: true }; }; bim.src = MESHY_BEAST.sheet; }
const beastDir = e => { const a = e.fa == null ? 0 : e.fa; return ((Math.round(-a / (Math.PI / 4)) % 8) + 8) % 8; };
{ const bi = SPR.mx.bomb; if (bi) bi.onload = () => { SPR.item.bomb = bi; }; }
const hasG = id => Object.values(gearEq).includes(id);
const bagSlots = () => BAGS[bagLv].slots + (hasG('vest') ? 2 : 0);
const packN = () => P && P.pack ? P.pack.med + P.pack.boost + P.pack.od + (P.pack.cure || 0) + (P.pack.bomb || 0) + (P.pack.flash || 0) : 0;
const holdT = () => 3 - .5 * base.power;
const DIFFS = {
  easy: { n: 'やさしい', d: '受けるダメージ -40% / 敵HP -30% / 敵が気づく距離 -20%', dmg: .6, hp: .7, sight: .8, stash: true },
  normal: { n: 'ふつう', d: '標準', dmg: 1, hp: 1, sight: 1, stash: true },
  hard: { n: 'きびしい', d: '受けるダメージ +40% / 敵HP +25% / 気づく距離 +15% / 死ぬと遺失物なし(全部失う)', dmg: 1.4, hp: 1.25, sight: 1.15, stash: false },
};
let diff = 'normal'; try { diff = localStorage.getItem('nx_diff') || 'normal'; } catch (e) { }
const DF = () => DIFFS[diff] || DIFFS.normal;
// 状態異常(面の属性): 敵弾に付く。毒=継続ダメージ(重なる)、点火=継続ダメージ、感電=移動半減、冷気=重なると凍結(動けない)
const STATUS_FX = { 4: 'poison', 5: 'burn', 6: 'shock', 7: 'poison', 8: 'cold', 9: 'cold', 10: 'cold' };
const STN = { poison: '毒', burn: '点火', shock: '感電', cold: '冷気', freeze: '凍結' };
const TOTEMS = [
  { id: 'haste', n: '疾風', d: '移動速度 +6%' }, { id: 'hardy', n: '頑強', d: '最大HP +10%' }, { id: 'sharp', n: '鋭牙', d: '銃のダメージ +8%' },
  { id: 'lucky', n: '幸運', d: '拾う戦利品 +10%' }, { id: 'lung', n: '長息', d: '息止めの時間 +30%' }, { id: 'ghost', n: '忍び', d: '隠密中、さらに気づかれにくい' },
];
let tot = { own: {}, eq: [], f: 0 }; try { Object.assign(tot, JSON.parse(localStorage.getItem('nx_totem') || '{}')); } catch (e) { }
const hasT = id => tot.eq.includes(id);
// 遺失物: 死んだ場所に戦利品とバッグの中身が残る(同じ面で取り戻せる。新しく死ぬと古いものは消える)
let stash = null; try { stash = JSON.parse(localStorage.getItem('nx_stash') || 'null'); } catch (e) { }
const saveStash = () => { try { localStorage.setItem('nx_stash', JSON.stringify(stash)); } catch (e) { } };
// 荷物の重さ: 軽いと速い、重いと遅い
const maxW = () => 14 + 14 * bagLv;
function carryW() { let w = P.loot / 130 + packN() + ARMOR[P.tier].cls * 2; for (const k in P.ammo) { const a = P.ammo[k]; if (a.res !== Infinity) w += (a.res + a.mag) * .02; } return w; }
function weightMul() { const r = carryW() / maxW(); return r < .25 ? 1.1 : r <= .75 ? 1 : Math.max(.55, 1 - .45 * (r - .75) / .5); }
const gimOf = () => (STAGES[stageNo - 1] || {}).gim;
const windAt = tt => gimOf() === 'wind' ? Math.sin(tt / 7) * 70 : 0;
const ELITES = { 2: ['heavy', '森の大熊ブルーノ'], 3: ['gunner', '浜辺の怪盗ガル'], 4: ['heavy', '入り江の主ヌシ'], 6: ['gunner', '山の頭領ライゾウ'], 7: ['sniper', '鷹の目のスカイ'], 8: ['heavy', '氷河の巨熊'], 9: ['gunner', '雪原の女王ユキヒョウ'] };
const STORY_INTRO ='目覚めると、そこは春の花畑。見たこともない大きな森が広がっていた。\n動物たちが武器を手にした世界「ネクサリア」。森も海も砂漠も、山も氷河も雪山も、獣たちの縄張りだ。\n転生特典は「ガンスミス・コア」。倒した獣の戦利品から、武器と防具を組み上げる力。\n各地を巡る脱出行の果て、山頂に君臨する主を倒し、元の世界へ帰る道を見つけ出せ。';

// ---------- 状態 ----------
let scene = 'title', stageNo = 1, t = 0;
let rings = [], grenades = [], barrels = [], ts = 1, tsT = 0;
let tiles, dist, P, enemies, bullets, ebullets, items, parts, texts, portal, portals = [], cam = { x: 0, y: 0, z: 1 }, shake = 0;
let unlocked = 1; try { unlocked = +localStorage.getItem('nx_unlock') || 1; } catch (e) { }
let logs = {}; try { logs = JSON.parse(localStorage.getItem('nx_logs') || '{}'); } catch (e) { }
let money = 0, up = { med: 0, range: 0, armory: 0, gym: 0 };
try { money = +localStorage.getItem('nx_money') || 0; Object.assign(up, JSON.parse(localStorage.getItem('nx_up') || '{}')); } catch (e) { }
// 武器改造(ガロンの作業台)・戦績(依頼用)・受け取り済みの依頼
let mods = {}, stats = { kills: {}, boss: {} }, claimed = {}, carry = { ammo: 0, armor: 0 };
try { mods = JSON.parse(localStorage.getItem('nx_mods') || '{}'); stats = Object.assign(stats, JSON.parse(localStorage.getItem('nx_stats') || '{}')); claimed = JSON.parse(localStorage.getItem('nx_claim') || '{}'); carry = Object.assign(carry, JSON.parse(localStorage.getItem('nx_carry') || '{}')); } catch (e) { }
const magOf = w => Math.round(w.mag * (mods.mag ? 1.5 : 1));
function saveMeta() { try { localStorage.setItem('nx_money', money); localStorage.setItem('nx_up', JSON.stringify(up)); localStorage.setItem('nx_mods', JSON.stringify(mods)); localStorage.setItem('nx_stats', JSON.stringify(stats)); localStorage.setItem('nx_claim', JSON.stringify(claimed)); localStorage.setItem('nx_carry', JSON.stringify(carry)); localStorage.setItem('nx_char', charId); localStorage.setItem('nx_owned', JSON.stringify(owned)); localStorage.setItem('nx_bag', bagLv); localStorage.setItem('nx_gearown', JSON.stringify(gearOwn)); localStorage.setItem('nx_geareq', JSON.stringify(gearEq)); localStorage.setItem('nx_base', JSON.stringify(base)); localStorage.setItem('nx_totem', JSON.stringify(tot)); localStorage.setItem('nx_diff', diff); } catch (e) { } }
const inp = { mx: W / 2, my: H / 2, down: false, rdown: false, tog: false, keys: {}, ls: null, rs: null, rsFire: false };
const hash = new URLSearchParams(location.hash.slice(1));
const G = window.G = { step: null, bot: hash.has('bot'), god: hash.has('god'), get P() { return P; }, get cam() { return cam; }, get portal() { return portal; }, get portals() { return portals; }, inp,  get boxes() { return boxes; }, get blds() { return blds; }, get tiles() { return tiles; }, MW, MH, get items() { return items; }, dmg: (d, p) => dmgPlayer(d, p), hit: (e, b) => hitEnemy(e, b), get enemies() { return enemies; }, get scene() { return scene; }, start: null };

// ---------- 音 ----------
let ac = null;
function noise(d, v, f0, f1) {
  try {
    ac = ac || new (window.AudioContext || window.webkitAudioContext)(); if (ac.state === 'suspended') ac.resume();
    const n = Math.floor(ac.sampleRate * d), buf = ac.createBuffer(1, n, ac.sampleRate), ch = buf.getChannelData(0); for (let i = 0; i < n; i++) ch[i] = Math.random() * 2 - 1;
    const src = ac.createBufferSource(); src.buffer = buf; const fl = ac.createBiquadFilter(); fl.type = 'lowpass'; fl.frequency.setValueAtTime(f0, ac.currentTime); fl.frequency.exponentialRampToValueAtTime(Math.max(40, f1), ac.currentTime + d);
    const g = ac.createGain(); g.gain.setValueAtTime(v, ac.currentTime); g.gain.exponentialRampToValueAtTime(.0001, ac.currentTime + d); src.connect(fl); fl.connect(g); g.connect(ac.destination); src.start();
  } catch (e) { }
}
function gunSnd(id) {
  if (id === 'sniper') { noise(.55, .5, 5500, 160); sfx(105, .4, 'sawtooth', .14, .3); sfx(1800, .05, 'square', .05, .3); }
  else if (id === 'shotgun') { noise(.4, .5, 4200, 140); sfx(85, .32, 'sawtooth', .12, .35); }
  else if (id === 'smg') { noise(.07, .2, 7000, 1500); sfx(320, .05, 'square', .05, .5); }
  else if (id === 'rifle') { noise(.12, .3, 6000, 700); sfx(210, .1, 'sawtooth', .09, .45); }
  else { noise(.13, .26, 6500, 900); sfx(400, .09, 'square', .06, .4); }
}
function boomSnd(big) { noise(big ? 1.2 : .6, .6, 2600, 70); sfx(88, big ? .9 : .45, 'sine', .4, .25); sfx(46, big ? 1 : .5, 'sine', .3, .5); }
function sfx(f, d, ty, v, sl) {
  try {
    ac = ac || new (window.AudioContext || window.webkitAudioContext)(); if (ac.state === 'suspended') ac.resume();
    const o = ac.createOscillator(), g = ac.createGain(); o.type = ty || 'square'; o.frequency.value = f;
    if (sl) o.frequency.exponentialRampToValueAtTime(Math.max(30, f * sl), ac.currentTime + d);
    g.gain.value = v || .05; g.gain.exponentialRampToValueAtTime(.0001, ac.currentTime + d);
    o.connect(g); g.connect(ac.destination); o.start(); o.stop(ac.currentTime + d);
  } catch (e) { }
}

// ---------- ステージ生成 ----------
function solid(tx, ty) { if (tx < 0 || ty < 0 || tx >= MW || ty >= MH) return true; const v = tiles[ty * MW + tx]; return v === 1 || v === 3 || v === 4; }
function solidB(tx, ty) { if (tx < 0 || ty < 0 || tx >= MW || ty >= MH) return true; const v = tiles[ty * MW + tx]; return v === 1 || v === 4; } // 弾・視線(柵は通る)
let decor = [], zones = [], roadH = 0, roadV = 0, camps = [];
const zoneAt = (px, py) => { const tx = Math.floor(px / T), ty = Math.floor(py / T); if (tiles[ty * MW + tx] === 2) return '中央道路'; const z = zones.find(q => tx >= q.x0 && tx <= q.x1 && ty >= q.y0 && ty <= q.y1); return z ? z.name : ''; };
let blds = [], boxes = [];
const inBldCell = c => { const x = c % MW, y = c / MW | 0; return blds.some(o => x >= o.x && x < o.x + o.w && y >= o.y && y < o.y + o.h); };
// コンテナを開ける: 戦利品を数個落とす(建物内は多め・高価)
function openBox(bx) {
  bx.open = true; sfx(420, .15, 'triangle', .05, 1.4); const n = stageNo, cnt = bx.rich ? 3 + (rnd() * 2 | 0) : 2 + (rnd() < .4 ? 1 : 0);
  const mult = (isNight() ? 1.25 : 1) * (hasT('lucky') ? 1.1 : 1); bx.contents = [];
  for (let i = 0; i < cnt; i++) {
    const r = rnd(), it = {};
    if (r < .26) it.k = ['med', 'ammo', 'ammo', 'armor'][(rnd() * 4) | 0];
    else if (r < .42) it.k = ['bomb', 'flash', 'cure', 'boost', 'od'][(rnd() * 5) | 0];
    else if (r < .46) it.k = 'feather';
    else { it.k = 'loot'; const big = rnd() < (bx.rich ? .12 : .04); it.v = Math.round((big ? 150 : 15 + rnd() * 40) * (1 + n * .15) * (bx.rich ? 1.4 : 1) * mult); it.m = 1; }
    bx.contents.push(it);
  }
  bx.reveal = 0; showLoot(bx);
}
// ---------- 戦利品パネル(コンテナを調べると開く。中身を選んで取る) ----------
let lootBox = null;
const lootEl = () => document.getElementById('lootp');
function itemName(it) { if (it.k === 'loot') return LOOT_NAMES[stageNo - 1][it.v >= 100 ? 1 : 0]; return { med: '医療キット', ammo: '弾薬', armor: '防具プレート', boost: 'ブースト注射', od: 'オーバードライブ', cure: '解毒注射', bomb: '爆弾', flash: '閃光弾', feather: 'ぼやけた羽根', log: 'データログ' }[it.k] || it.k; }
function itemIcon(it) { const ik = it.k === 'loot' ? (it.v >= 300 ? 'core' : it.v >= 100 ? 'crystal' : it.v >= 40 ? 'board' : 'part') : it.k; return SPR.item[ik] || null; }
function showLoot(bx) { lootBox = bx; bx.closed = false; renderLoot(); }
function closeLoot(byUser) { if (lootBox) { if (byUser) lootBox.closed = true; lootBox = null; } const el = lootEl(); if (el) el.style.display = 'none'; }
function renderLoot() {
  const el = lootEl(); if (!el || !lootBox) return; const bx = lootBox, cs = bx.contents || [], rv = Math.min(cs.length, Math.floor(bx.reveal || 0));
  let h = '<div class="lh">' + (bx.kind === 'bag' ? '戦利品の袋' : bx.rich ? '宝箱(豪華)' : '宝箱') + ' <small>' + (rv < cs.length ? '探索中…' : (cs.length ? cs.length + '個' : '空')) + '</small></div>';
  cs.forEach((it, k) => { if (k < rv) h += '<div class="lr"><canvas class="li" data-k="' + k + '"></canvas><span class="ln">' + itemName(it) + (it.k === 'loot' ? ' <small>' + it.v + 'G</small>' : '') + '</span><button onclick="G.take(' + k + ')">取る</button></div>'; else h += '<div class="lr dim"><span class="ln">…</span></div>'; });
  h += '<div class="lf"><button onclick="G.takeAll()">全部取る [F]</button><button onclick="G.closeLoot()">閉じる [Esc]</button></div>';
  el.innerHTML = h; el.style.display = 'block';
  el.querySelectorAll('.li').forEach(cv => { const it = cs[+cv.dataset.k], ic = itemIcon(it); cv.width = 28; cv.height = 28; const g = cv.getContext('2d'); g.imageSmoothingEnabled = false; if (ic) { const sc = Math.min(26 / ic.width, 26 / ic.height); g.drawImage(ic, 14 - ic.width * sc / 2, 14 - ic.height * sc / 2, ic.width * sc, ic.height * sc); } else { g.fillStyle = '#fbbf24'; g.fillRect(6, 6, 16, 16); } });
}
function takeOne(k) {
  const bx = lootBox; if (!bx) return false; const it = bx.contents[k]; if (!it) return false;
  if (it.k === 'loot') { const cap = BAGS[bagLv].loot, room = cap - P.loot; if (room <= 0) { toast('バッグがいっぱい(戦利品 ' + cap + 'G)', 1.4); return false; } const tk = Math.min(it.v, room); P.loot += tk; it.v -= tk; sfx(880, .12, 'sine', .05, 1.5); toast(itemName(it) + ' +' + tk + 'G', 1.2); if (it.v > 0) { toast('バッグに入りきらない分は残した', 1.6); return false; } }
  else if (pickup(it) === false) return false;
  bx.contents.splice(k, 1); return true;
}
G.take = k => { takeOne(k); renderLoot(); };
G.takeAll = () => { const bx = lootBox; if (!bx) return; const rv = Math.floor(bx.reveal || 0); for (let k = Math.min(rv, bx.contents.length) - 1; k >= 0; k--) takeOne(k); renderLoot(); };
G.closeLoot = () => closeLoot(true);
// ダッコフ風の拠点型マップ: 建物(出入口あり)・屋外の遮蔽物・コンテナ。面ごとに建物の配置が違う
const ZNAMES = {
  spring: { housing: 'ウサギの村', warehouse: 'クローバーの丘', energy: 'せせらぎの泉', lab: '古い風車小屋' },
  forest: { housing: 'きつねの集落', warehouse: '倒木の広場', energy: '静かな泉', lab: '苔むした遺跡' },
  beach: { housing: 'ヤシの浜', warehouse: '難破船の入り江', energy: '岩場の潮だまり', lab: '古い灯台' },
  cove: { housing: '霧の漁村', warehouse: '座礁した船', energy: '暗い潮だまり', lab: '朽ちた桟橋' },
  desert: { housing: 'サボテンの宿場', warehouse: '岩の迷路', energy: 'オアシス', lab: '砂に埋もれた遺跡' },
  mountain: { housing: '山小屋', warehouse: 'ガレ場', energy: '湧き水', lab: '見張り台' },
  pine: { housing: '木こりの村', warehouse: '倒木の谷', energy: '雪解けの泉', lab: '狩人の砦' },
  glacier: { housing: '氷の洞窟', warehouse: 'クレバスの縁', energy: '凍った池', lab: '氷河のベース' },
  snow: { housing: '雪の集落', warehouse: '吹きだまり', energy: '温泉', lab: '雪原の砦' },
  summit: { housing: '山頂の祠', warehouse: '氷柱の森', energy: '凍る泉', lab: '頂への階段' },
};
// 置物: [種類, 個数, 通れない?]
const DECOR_SET = {
  spring: [['tree', 26, 1], ['boulder', 10, 1], ['bush', 34, 0], ['flower', 150, 0], ['tuft', 120, 0], ['pebble', 20, 0]],
  forest: [['tree', 74, 1], ['boulder', 8, 1], ['log', 12, 1], ['mushroom', 44, 0], ['flower', 24, 0], ['tuft', 140, 0]],
  beach: [['palm', 22, 1], ['boulder', 10, 1], ['boat', 3, 1], ['shell', 90, 0], ['pebble', 30, 0], ['tuft', 40, 0]],
  cove: [['boulder', 22, 1], ['palm', 8, 1], ['boat', 4, 1], ['shell', 56, 0], ['pebble', 44, 0]],
  desert: [['cactus', 44, 1], ['sandrock', 16, 1], ['pebble', 34, 0], ['tuft', 40, 0]],
  mountain: [['boulder', 40, 1], ['pine', 14, 1], ['pebble', 54, 0], ['tuft', 40, 0], ['flower', 26, 0]],
  pine: [['pine', 72, 1], ['boulder', 10, 1], ['log', 8, 1], ['tuft', 60, 0], ['mushroom', 12, 0], ['pebble', 22, 0]],
  glacier: [['ice', 42, 1], ['snowrock', 10, 1], ['pebble', 12, 0]],
  snow: [['snowpine', 62, 1], ['snowrock', 14, 1], ['tuft', 30, 0], ['pebble', 12, 0]],
  summit: [['ice', 30, 1], ['snowrock', 20, 1], ['snowpine', 10, 1], ['pebble', 14, 0]],
};
function genStage(n) {
  const S = STAGES[n - 1]; seedv = n * 7919 + 13; tiles = new Uint8Array(MW * MH); blds = []; decor = []; zones = [];
  for (let x = 0; x < MW; x++) { tiles[x] = 1; tiles[(MH - 1) * MW + x] = 1; }
  for (let y = 0; y < MH; y++) { tiles[y * MW] = 1; tiles[y * MW + MW - 1] = 1; }
  const sx = 3, sy = MH - 4;
  const near = (x, y) => Math.abs(x - sx) < 7 && Math.abs(y - sy) < 7;
  const set = (x, y, v) => { if (x > 0 && y > 0 && x < MW - 1 && y < MH - 1) tiles[y * MW + x] = v; };
  const get = (x, y) => (x < 0 || y < 0 || x >= MW || y >= MH) ? 1 : tiles[y * MW + x];
  const ri = (a, b) => a + (rnd() * (b - a + 1) | 0);
  // 道(土の道・桟橋・雪道)。ボス面ではこの交差点が決戦場
  roadH = (MH >> 1) + ri(-3, 3); roadV = ((MW * .46) | 0) + ri(-4, 4);
  for (let x = 1; x < MW - 1; x++) for (let d = -1; d <= 1; d++) set(x, roadH + d, 2);
  for (let y = 1; y < MH - 1; y++) for (let d = -1; d <= 1; d++) set(roadV + d, y, 2);
  const nearC = (x, y) => S.boss && Math.abs(x - roadV) < 9 && Math.abs(y - roadH) < 8;
  // 4つのエリア
  const Q = [[3, 3, roadV - 4, roadH - 4], [roadV + 4, 3, MW - 4, roadH - 4], [3, roadH + 4, roadV - 4, MH - 4], [roadV + 4, roadH + 4, MW - 4, MH - 4]];
  const types = ['housing', 'warehouse', 'energy', 'lab'].sort(() => rnd() - .5);
  const NAMES = ZNAMES[S.biome];
  const overlapB = (bx, by, bw, bh, m) => blds.some(o => bx < o.x + o.w + m && bx + bw + m > o.x && by < o.y + o.h + m && by + bh + m > o.y);
  const placeB = (q, bw, bh, m) => {
    if (q[2] - q[0] < bw + 1 || q[3] - q[1] < bh + 1) return null;
    for (let tr = 0; tr < 60; tr++) {
      const bx = ri(q[0], q[2] - bw), by = ri(q[1], q[3] - bh);
      if (near(bx, by) || near(bx + bw, by) || near(bx, by + bh) || near(bx + bw, by + bh)) continue;
      if (overlapB(bx, by, bw, bh, m)) continue;
      for (let x = bx; x < bx + bw; x++) { set(x, by, 1); set(x, by + bh - 1, 1); }
      for (let y = by; y < by + bh; y++) { set(bx, y, 1); set(bx + bw - 1, y, 1); }
      const doors = [], sides = ['t', 'b', 'l', 'r'].sort(() => rnd() - .5).slice(0, ri(2, 3));
      for (const sd of sides) {
        if (sd === 't' || sd === 'b') { const dx = ri(bx + 2, bx + bw - 4), yy = sd === 't' ? by : by + bh - 1; set(dx, yy, 0); set(dx + 1, yy, 0); doors.push([dx, yy]); }
        else { const dy = ri(by + 2, by + bh - 4), xx = sd === 'l' ? bx : bx + bw - 1; set(xx, dy, 0); set(xx, dy + 1, 0); doors.push([xx, dy]); }
      }
      if (bw >= 11) { const mx = bx + (bw >> 1); for (let y = by + 1; y < by + bh - 1; y++) set(mx, y, 1); const dy = ri(by + 1, by + bh - 3); set(mx, dy, 0); set(mx, dy + 1, 0); }
      const b = { x: bx, y: by, w: bw, h: bh, doors }; blds.push(b); return b;
    }
    return null;
  };
  const cons = [];
  Q.forEach((q, qi) => {
    const ty = types[qi]; zones.push({ name: NAMES[ty], x0: q[0] - 2, y0: q[1] - 2, x1: q[2] + 2, y1: q[3] + 2 });
    if (ty === 'housing') { const k = S.boss ? ri(4, 5) : ri(6, 8); for (let i = 0; i < k; i++) placeB(q, ri(6, 9), ri(5, 7), 2); }
    else if (ty === 'warehouse') {
      for (let i = 0, k = ri(2, 3); i < k; i++) placeB(q, ri(13, 18), ri(7, 9), 3);
      for (let i = 0, k = ri(7, 10); i < k; i++) for (let tr = 0; tr < 30; tr++) { const cx = ri(q[0], q[2] - 4), cy = ri(q[1], q[3] - 2); if (near(cx, cy) || near(cx + 4, cy + 2) || overlapB(cx, cy, 4, 2, 2) || cons.some(c => cx < c[0] + 6 && cx + 6 > c[0] && cy < c[1] + 4 && cy + 4 > c[1])) continue; cons.push([cx, cy]); for (let a = 0; a < 4; a++) for (let b = 0; b < 2; b++) set(cx + a, cy + b, 1); break; }
    } else if (ty === 'energy') {
      const c = placeB(q, 9, 8, 3);
      if (c) {
        for (let i = 0; i < 3; i++) placeB(q, 6, 5, 6);
        const rx0 = c.x - 3, ry0 = c.y - 3, rx1 = c.x + c.w + 2, ry1 = c.y + c.h + 2, gate = (a, lo, hi) => a >= lo && a <= hi;
        for (let x = rx0; x <= rx1; x++) for (const y of [ry0, ry1]) { if (y === ry1 && gate(x, c.x + 2, c.x + 4)) continue; if (get(x, y) === 0) set(x, y, 3); }
        for (let y = ry0; y <= ry1; y++) for (const x of [rx0, rx1]) { if (x === rx0 && gate(y, c.y + 2, c.y + 4)) continue; if (get(x, y) === 0) set(x, y, 3); }
      }
    } else { placeB(q, ri(12, 15), ri(8, 9), 3); placeB(q, ri(12, 15), ri(8, 9), 3); placeB(q, 6, 5, 3); placeB(q, 6, 5, 3); }
  });
  // 水辺・氷の割れ目
  const bm = S.biome;
  if (bm === 'spring') { const rx = roadV + 8 + ri(-1, 1); for (let y = 1; y < MH - 1; y++) { const cx = Math.round(rx + Math.sin(y / 6) * 2); for (let d = -2; d <= 2; d++) if (get(cx + d, y) === 0 && Math.abs(y - (roadH - 14)) > 1 && Math.abs(y - (roadH + 14)) > 1) set(cx + d, y, 3); } for (const by of [roadH - 14, roadH, roadH + 14]) { const bx = Math.round(rx + Math.sin(by / 6) * 2); for (let y = by - 1; y <= by + 1; y++) for (let x = bx - 4; x <= bx + 4; x++) if (get(x, y) === 3 || get(x, y) === 0) set(x, y, 2); decor.push({ k: 'landmark', v: 1, x: (bx + .5) * T, y: (by + .5) * T }); } }
  else if (bm === 'beach') { for (let y = 1; y < MH - 1; y++) { const ex = MW - 11 + Math.round(3 * Math.sin(y / 5) + 2 * Math.sin(y / 2.3)); for (let x = ex; x < MW - 1; x++) if (get(x, y) === 0) set(x, y, 3); } }
  else if (bm === 'cove') { for (let y = 1; y < MH - 1; y++) { const ex = MW - 14 + Math.round(3 * Math.sin(y / 4) + 2 * Math.sin(y / 2.1)); for (let x = ex; x < MW - 1; x++) if (get(x, y) === 0) set(x, y, 3); } for (let x = 1; x < MW - 1; x++) { const ey = 6 + Math.round(2 * Math.sin(x / 5)); for (let y = 1; y < ey; y++) if (get(x, y) === 0) set(x, y, 3); } }
  else if (bm === 'desert') { const q = Q[types.indexOf('energy')]; const ox = ((q[0] + q[2]) >> 1), oy = ((q[1] + q[3]) >> 1); for (let y = oy - 4; y <= oy + 4; y++) for (let x = ox - 6; x <= ox + 6; x++) if (((x - ox) / 6) ** 2 + ((y - oy) / 4) ** 2 <= 1 && get(x, y) === 0 && !near(x, y)) set(x, y, 3); }
  else if (bm === 'glacier') { for (let i = 0; i < 7; i++) { let x = ri(6, MW - 7), y = ri(6, MH - 7); const dx = rnd() < .5 ? 1 : 0, dy = 1 - dx, len = ri(10, 18); for (let k = 0; k < len; k++) { if (!near(x, y) && get(x, y) === 0 && !nearC(x, y)) set(x, y, 3); x += dx + (rnd() < .2 ? 1 : 0) * dy; y += dy + (rnd() < .2 ? 1 : 0) * dx; } } }
  // ボス面の決戦場。四方の入口を残した遮蔽物の輪で、中央と外周の位置取りを変える。
  if (n === 5 || n === 10) {
    const radius = n === 5 ? 7 : 8;
    for (let y = roadH - radius - 2; y <= roadH + radius + 2; y++) for (let x = roadV - radius - 2; x <= roadV + radius + 2; x++) {
      const dx = x - roadV, dy = y - roadH, ring = Math.hypot(dx, dy);
      if (ring > radius - 1 && ring < radius + 1 && Math.min(Math.abs(dx), Math.abs(dy)) > 2 && get(x, y) === 0) set(x, y, n === 5 ? 3 : 1);
    }
    decor.push({ k: 'landmark', v: n, x: (roadV + .5) * T, y: (roadH + .5) * T });
    for (const [dx, dy] of [[-6, -3], [6, 3], [-4, 6], [4, -6]]) { const x = roadV + dx, y = roadH + dy; if (get(x, y) === 0) { set(x, y, 4); decor.push({ k: n === 5 ? 'sandrock' : 'ice', x: (x + .5) * T, y: (y + .5) * T, v: 2 }); } }
  }
  // 自然のかたまり(木立・岩場)。道・水・建物の出入口は避ける
  const inBld = (x, y, m) => blds.some(o => x >= o.x - m && x < o.x + o.w + m && y >= o.y - m && y < o.y + o.h + m);
  for (let i = 0, cover = 26 + n; i < cover; i++) { const cw = ri(1, 3), chh = ri(1, 2), cx = ri(2, MW - 5), cy = ri(2, MH - 5); let ok = !(near(cx, cy) || nearC(cx, cy) || inBld(cx, cy, 2) || inBld(cx + cw, cy + chh, 2)); for (let a = -1; ok && a <= cw; a++) for (let b = -1; b <= chh; b++) if (get(cx + a, cy + b) !== 0) { ok = false; break; } if (!ok) continue; for (let a = 0; a < cw; a++) for (let b = 0; b < chh; b++) set(cx + a, cy + b, 1); }
  const openAny = () => { for (let tr = 0; tr < 60; tr++) { const x = ri(3, MW - 4), y = ri(3, MH - 4); if (get(x, y) === 0 && !near(x, y) && !nearC(x, y) && !inBld(x, y, 1)) return [x, y]; } return null; };
  // 置物(通れないもの=タイル4、通れるもの=飾り)
  for (const [k, cnt, sol] of DECOR_SET[bm]) {
    for (let i = 0; i < cnt; i++) {
      const c = openAny(); if (!c) continue;
      if (sol) { if (k === 'boat' && get(c[0] + 1, c[1]) !== 0) continue; set(c[0], c[1], 4); decor.push({ k, x: (c[0] + .5) * T, y: (c[1] + .5) * T, v: (rnd() * 9) | 0 }); }
      else decor.push({ k, x: (c[0] + rnd()) * T, y: (c[1] + .3 + rnd() * .5) * T, v: (rnd() * 9) | 0 });
    }
  }
  // 松明と道しるべ
  for (let y = 4; y < MH - 3; y += 7) for (const dx of [-2, 2]) { const x = roadV + dx; if (get(x, y) === 0) decor.push({ k: 'torch', x: (x + .5) * T, y: (y + .5) * T }); }
  for (let x = 4; x < MW - 3; x += 7) for (const dy of [-2, 2]) { const y = roadH + dy; if (get(x, y) === 0) decor.push({ k: 'torch', x: (x + .5) * T, y: (y + .5) * T }); }
  for (let i = 0; i < 7; i++) { const x = ri(5, MW - 6), y = rnd() < .5 ? roadH - 3 : roadH + 3; if (get(x, y) === 0 && !near(x, y)) decor.push({ k: 'sign', x: (x + .5) * T, y: (y + .5) * T, t: i }); }
  // キャンプ(焚き火・テント・木箱・丸太の椅子)。宝箱はこのまわりに置く
  camps = [];
  for (let i = 0, want = 9; i < want; i++) {
    for (let tr = 0; tr < 80; tr++) {
      const c = openAny(); if (!c) break; const [cx, cy] = c; let ok = !inBld(cx, cy, 3);
      for (let a = -3; a <= 3 && ok; a++) for (let b = -2; b <= 2; b++) if (get(cx + a, cy + b) !== 0) { ok = false; break; }
      if (!ok || camps.some(q => Math.hypot(q.tx - cx, q.ty - cy) < 14)) continue;
      const P0 = (x, y, k, v) => decor.push({ k, x: (x + .5) * T, y: (y + .5) * T, v: v || 0 });
      P0(cx, cy, 'campfire'); set(cx - 2, cy - 1, 4); P0(cx - 2, cy - 1, 'tent', i % 3); set(cx + 2, cy - 1, 4); P0(cx + 2, cy - 1, 'crates'); P0(cx - 1, cy + 1, 'logseat', 0); P0(cx + 1, cy + 1, 'logseat', 1);
      camps.push({ tx: cx, ty: cy, x: (cx + .5) * T, y: (cy + .5) * T }); break;
    }
  }
  // 到達可能マスと距離(BFS)
  dist = new Int16Array(MW * MH).fill(-1); const q = [sy * MW + sx]; dist[q[0]] = 0;
  for (let i = 0; i < q.length; i++) { const c = q[i], cx = c % MW, cy = c / MW | 0; for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const nx = cx + dx, ny = cy + dy; if (!solid(nx, ny) && dist[ny * MW + nx] < 0) { dist[ny * MW + nx] = dist[c] + 1; q.push(ny * MW + nx); } } }
  return { sx, sy, cells: q };
}
function startStage(n, keep) {
  stageNo = n; const S = STAGES[n - 1]; const gen = genStage(n);
  if (!keep || !P) {
    P = { x: 0, y: 0, r: 11, hp: 100, max: 100, ap: 0, tier: 0, cur: 0, ammo: {}, rel: 0, cd: 0, bloom: 0, rec: 0, breath: 1, face: 1, anim: 0, hurt: 0, loot: 0, bleed: false, boost: 0, od: 0, scoped: 0, aimA: 0, aimD: 200, steady: false, pack: { med: 0, boost: 0, od: 0, cure: 0, bomb: 0, flash: 0 }, stat: {}, fe: 0 };
  }
  if (!keep) { P.max = Math.round((100 + 15 * up.med) * CH().hp * (hasT('hardy') ? 1.1 : 1)); P.hp = P.max; P.tier = up.armory; P.ap = ARMOR[P.tier].max; P.loot = 0; P.pack = { med: n === 1 ? Math.max(1, Math.min(base.storage, bagSlots())) : Math.min(base.storage, bagSlots()), boost: 0, od: 0, cure: 0, bomb: 0, flash: 0 }; P.fe = 0; }
  P.stat = { poison: 0, pt: 0, burn: 0, shock: 0, cold: 0, freeze: 0, resist: 0 };
  P.bleed = false;
  P.x = (gen.sx + .5) * T; P.y = (gen.sy + .5) * T; P.hp = Math.min(P.max, P.hp + (keep ? 30 + 15 * base.kitchen : 0)); P.rel = 0;
  for (const w of WEAPONS) if (w.unlock <= n && !P.ammo[w.id]) P.ammo[w.id] = { mag: magOf(w), res: w.res };
  if (!keep) { if (carry.armor > P.tier) { P.tier = carry.armor; P.ap = ARMOR[P.tier].max; } if (carry.ammo) for (const w of WEAPONS) { const a = P.ammo[w.id]; if (a && a.res !== Infinity) a.res = Math.round(a.res * 1.5); } carry = { ammo: 0, armor: 0 }; saveMeta(); }
  if (P.cur >= WEAPONS.length || WEAPONS[P.cur].unlock > n) P.cur = 0;
  closeLoot(false); rings = []; grenades = []; barrels = []; enemies = []; bullets = []; ebullets = []; items = []; parts = []; fxs = []; texts = []; portal = null; portals = []; boxes = [];
  // 敵配置(約4割は建物の中。建物内は見通しが悪く、近距離戦になる)
  const farAll = gen.cells.filter(c => dist[c] > 14), farIn = farAll.filter(inBldCell), farOut = farAll.filter(c => !inBldCell(c));
  const place = type => { const pool = (rnd() < .42 && farIn.length) ? farIn : farOut, c = pool[(rnd() * pool.length) | 0], e = mkEnemy(type, ((c % MW) + .5) * T, ((c / MW | 0) + .5) * T); enemies.push(e); return e; };
  const total = n === 1 ? 10 : Math.round(14 + 3 * n);
  if (S.boss) { place(S.boss); const m = S.boss === 'boss1' ? ['drone', 8] : ['heavy', 5]; for (let i = 0; i < m[1]; i++)place(m[0]); if (S.boss === 'boss2') for (let i = 0; i < 8; i++)place('gunner'); }
  else {
    for (let i = 0; i < total; i++) { const r = rnd(); let ty = 'drone'; const pd = Math.max(.2, .6 - .05 * n); if (r > pd) ty = 'gunner'; if (n >= 3 && r > .85) ty = 'sniper'; if (n >= 4 && r > .93) ty = 'heavy'; if (r < pd * .3 && n >= 2) ty = 'gunner'; if (n >= 3 && r > .55 && r < .68) ty = 'beast'; place(ty); }
  }
  if (ELITES[n] && !S.boss) { const e = place(ELITES[n][0]); e.elite = ELITES[n][1]; e.hp = e.max = e.max * 3.5; e.r *= 1.2; e.ec = 3; }
  const cxy = c => ({ x: ((c % MW) + .5) * T, y: ((c / MW | 0) + .5) * T });
  // 補給(地面)は少なめ。コンテナを探して集めるのが主役
  const outAll = gen.cells.filter(c => !inBldCell(c) && dist[c] > 4);
  // 脱出口: 屋外の遠い2か所
  let ec = outAll[0]; for (const c of outAll) if (dist[c] > dist[ec]) ec = c;
  portals = [Object.assign(cxy(ec), { hold: 0, locked: false })];
  { const maxd = dist[ec], e1x = ec % MW, e1y = ec / MW | 0; const alt = outAll.filter(c => dist[c] > maxd * .5 && Math.hypot((c % MW) - e1x, (c / MW | 0) - e1y) > 26); if (alt.length) portals.push(Object.assign(cxy(alt[(rnd() * alt.length) | 0]), { hold: 0, locked: false })); }
  portal = portals[0];
  // コンテナ: 建物の中(中身が良い)と屋外
  const wallish = c => { const x = c % MW, y = c / MW | 0; return solid(x + 1, y) || solid(x - 1, y) || solid(x, y - 1) || solid(x, y + 1); };
  for (const o of blds) { const cells = gen.cells.filter(c => { const x = c % MW, y = c / MW | 0; return x > o.x && x < o.x + o.w - 1 && y > o.y && y < o.y + o.h - 1 && wallish(c); }); const k = 2 + (rnd() * 2 | 0); for (let i = 0; i < k && cells.length; i++) { const c = cells.splice((rnd() * cells.length) | 0, 1)[0]; boxes.push(Object.assign(cxy(c), { open: false, prog: 0, rich: true })); } }
  for (const cp of camps) for (let i = 0; i < 2; i++) { const a = (i ? 2.4 : 5.2) + rnd() * .6; let bx2 = cp.x + Math.cos(a) * 46, by2 = cp.y + Math.sin(a) * 38; if (blocked(bx2, by2, 10)) { bx2 = cp.x + (i ? 24 : -24); by2 = cp.y + 30; } boxes.push({ x: bx2, y: by2, open: false, prog: 0, rich: rnd() < .35 }); }
  { const ws = outAll.filter(c => wallish(c) && dist[c] > 6 && !blocked(cxy(c).x, cxy(c).y, 10)); for (let i = 0; i < 6 + (n >> 1) && ws.length; i++) { const c = ws.splice((rnd() * ws.length) | 0, 1)[0]; boxes.push(Object.assign(cxy(c), { open: false, prog: 0, rich: false })); } }
  { const lc = gen.cells.filter(c => dist[c] > 10 && inBldCell(c)); const c = (lc.length ? lc : gen.cells)[(rnd() * (lc.length || gen.cells.length)) | 0]; items.push(Object.assign(cxy(c), { k: 'log' })); }
  if (!keep) { clock.h += 2.5; if (clock.h >= 24) { clock.h -= 24; clock.day++; } saveClock(); }
  STORM_T = isStormDay() ? 180 : 300; if (isNight()) for (const e of enemies) if (!EN[e.type].boss) { e.hp *= 1.2; e.max *= 1.2; }
  { for (const cp of camps) if (rnd() < .6) { const bx3 = cp.x + (rnd() < .5 ? -1 : 1) * 56, by3 = cp.y + 8; if (!blocked(bx3, by3, 10)) barrels.push({ x: bx3, y: by3, hp: 30 }); } const ws2 = outAll.filter(c => wallish(c) && dist[c] > 8); for (let i = 0; i < 4 + (n >> 1) && ws2.length; i++) { const c = ws2.splice((Math.random() * ws2.length) | 0, 1)[0]; const q = cxy(c); if (!blocked(q.x, q.y, 10)) barrels.push({ x: q.x, y: q.y, hp: 30 }); } }
  if (stash && stash.stage === n) items.push({ x: stash.x, y: stash.y, k: 'stash' });
  P.still = 0; P.lastFire = -99;
  cam.x = P.x; cam.y = P.y; cam.z = 1.6;
  scene = 'play'; $('ov').style.display = 'none'; t = 0;
  toast(`STAGE ${n}  ${S.n}`, 2.2); if (GIMMICK[n]) setTimeout(() => toast('【ギミック】' + GIMMICK[n], 3), 2300); if (stageNo === 1 && !keep) setTimeout(() => toast('戦利品を集めて、緑の出口で3秒立てば脱出', 3), 2300);
}
const S_BOSS = () => !!STAGES[stageNo - 1].boss;
function mkEnemy(type, x, y) {
  const d = EN[type], k = 1 + .12 * (stageNo - 1);
  return { type, x, y, hp: d.hp * (d.boss ? 1 : k) * DF().hp, max: d.hp * (d.boss ? 1 : k) * DF().hp, r: d.r, spd: d.spd, alert: false, cd: R(.5, 2), burst: 0, bt: 0, aimT: 0, flash: 0, hy: (SPR.en[type] ? SPR.en[type].img.height * SPR.en[type].k * .42 : d.r), anim: Math.random() * 6, sd: Math.random() < .5 ? 1 : -1, st: 0, ph: 0, ang0: 0, face: 1, wander: Math.random() * 6 };
}

// ---------- 判定 ----------
function blocked(x, y, r) {
  const x0 = Math.floor((x - r) / T), x1 = Math.floor((x + r) / T), y0 = Math.floor((y - r) / T), y1 = Math.floor((y + r) / T);
  for (let a = x0; a <= x1; a++)for (let b = y0; b <= y1; b++)if (solid(a, b)) return true; return false;
}
function move(e, dx, dy) { if (!blocked(e.x + dx, e.y, e.r * .8)) e.x += dx; if (!blocked(e.x, e.y + dy, e.r * .8)) e.y += dy; }
function los(x0, y0, x1, y1) {
  const d = Math.hypot(x1 - x0, y1 - y0), n = Math.ceil(d / 12); for (let i = 1; i < n; i++) { const k = i / n; if (solidB(Math.floor((x0 + (x1 - x0) * k) / T), Math.floor((y0 + (y1 - y0) * k) / T))) return false; } return true;
}
function curW() { return WEAPONS[P.cur]; }
function toast(s, d) { toastT = d || 2; toastS = s; }
let toastT = 0, toastS = '';

// ---------- 射撃 ----------
function aimPoint() {
  if (inp.rs && inp.rs.mag > .1) { const d = P.scoped > .5 ? 420 : 220; return { x: P.x + inp.rs.x / inp.rs.mag * d, y: P.y + inp.rs.y / inp.rs.mag * d }; }
  if (G.bot) return G.botAim || { x: P.x + 100, y: P.y };
  if (padSt.on && P.padDir != null && padSt.act > (inp.mouseT || 0)) { const d = P.scoped > .5 ? 420 : 220; return { x: P.x + Math.cos(P.padDir) * d, y: P.y + Math.sin(P.padDir) * d }; }
  return { x: cam.x + (inp.mx - W / 2) / cam.z, y: cam.y + (inp.my - H / 2) / cam.z };
}
function swayAng(moving) {
  if (P.scoped < .5) return 0; if (P.steady) return 0;
  const a = CH().sway * (hasG('steady') ? .85 : 1) * (mods.scope ? .7 : 1) * .012 * (1 + moving * 2.2) * (curW().id === 'sniper' ? 1 : .6);
  return Math.sin(t * 1.7) * a + Math.sin(t * 2.9 + 1) * a * .6;
}
function fire() {
  const w = curW(), am = P.ammo[w.id]; if (P.rel > 0 || P.cd > 0) return;
  if (am.mag <= 0) { reload(); return; }
  am.mag--; P.cd = w.rate; P.lastFire = t;
  const moving = Math.min(1, Math.hypot(P.vx || 0, P.vy || 0) / 150);
  let sp = w.spread; if (P.scoped > .5) sp = w.scoped != null ? w.scoped : sp * .4;
  sp *= (1 + moving * 1.6 + P.bloom) * (1 - .08 * up.range) * (mods.barrel ? .9 : 1);
  const base = P.aimA;
  for (let i = 0; i < w.pellets; i++) {
    const a = base + rad((Math.random() + Math.random() - 1) * sp);
    bullets.push({ x: solid(Math.floor((P.x + Math.cos(base) * 14) / T), Math.floor((P.y + Math.sin(base) * 14) / T)) ? P.x : P.x + Math.cos(base) * 14, y: solid(Math.floor((P.x + Math.cos(base) * 14) / T), Math.floor((P.y + Math.sin(base) * 14) / T)) ? P.y : P.y + Math.sin(base) * 14, vx: Math.cos(a) * w.speed, vy: Math.sin(a) * w.speed, dmg: w.dmg * (P.od > 0 ? 1.5 : 1) * (hasT('sharp') ? 1.08 : 1) * (mods.ap ? .9 : 1), pen: w.pen + (mods.ap ? 10 : 0), life: w.rng * (mods.barrel ? 1.25 : 1) / w.speed, pierce: w.pierce || 0, hit: [], x0: P.x, y0: P.y, eff: effRange(w), col: w.id === 'sniper' ? '#fff' : '#fde68a', len: w.id === 'sniper' ? 40 : 10 });
  }
  P.bloom = Math.min(2, P.bloom + (w.id === 'sniper' ? .5 : .22));
  P.rec += rad(w.rec) * (Math.random() < .5 ? -1 : 1) * R(.5, 1) * (P.scoped > .5 ? .6 : 1) + (w.rec > 6 ? rad(w.rec) * 0.4 * (Math.random() < .5 ? 1 : -1) : 0);
  shake = Math.max(shake, w.id === 'sniper' ? 7 : w.id === 'shotgun' ? 5 : 1.5);
  P.flash = .06; gunSnd(w.id);
  parts.push({ x: P.x, y: P.y, vx: -Math.cos(base) * 40 + R(-30, 30), vy: -Math.sin(base) * 40 + R(-30, 30), life: .4, col: '#facc15', sz: 2, shell: 1 });
  if (am.mag <= 0) reload();
}
function reload() {
  const w = curW(), am = P.ammo[w.id]; if (P.rel > 0 || am.mag >= magOf(w) || am.res <= 0) return; P.rel = w.reload * (hasG('glove') ? .75 : 1); sfx(200, .1, 'triangle', .04);
}
function finishReload() { const w = curW(), am = P.ammo[w.id], need = magOf(w) - am.mag, take = Math.min(need, am.res); am.mag += take; if (am.res !== Infinity) am.res -= take; }
function dmgPlayer(d, pen) {
  if (G.god || P.hurt > 0) return; P.hurt = .12; pen = pen == null ? 30 : pen; d *= DF().dmg; if (hasG('helm')) d *= .92;
  const ar = ARMOR[P.tier]; let pass = true;
  if (P.ap > 0 && ar.cls > 0) {
    pass = Math.random() < penChance(pen, ar.cls);
    P.ap = Math.max(0, P.ap - d * (pass ? .5 : .9));
    if (!pass) { d *= .25; texts.push({ x: P.x + 10, y: P.y - 30, s: '防具が弾いた', col: '#93c5fd', life: .8 }); }
  }
  if (pass && d >= 7 && Math.random() < .3) { if (!P.bleed) toast('出血!(医療キットで止血)', 1.6); P.bleed = true; }
  P.hp -= d; shake = Math.max(shake, 6); sfx(90, .2, 'square', .1, .5); noise(.2, .35, 2500, 200); P.hurtFx = .45; texts.push({ x: P.x, y: P.y - 20, s: '-' + Math.ceil(d), col: '#f87171', life: .8 });
  if (P.hp <= 0) die();
}
function updStatus(dt) {
  const s = P.stat; if (!s) return; if (s.resist > 0) s.resist -= dt;
  if (s.poison > 0) { s.pt -= dt; if (!G.god) { P.hp -= (1.2 + 1.2 * s.poison) * dt; if (P.hp <= 0) die(); } if (s.pt <= 0) s.poison = 0; }
  if (s.burn > 0) { s.burn -= dt; if (!G.god) { P.hp -= 4 * dt; if (P.hp <= 0) die(); } }
  if (s.shock > 0) s.shock -= dt; if (s.freeze > 0) s.freeze -= dt; else if (s.cold > 0) s.cold = Math.max(0, s.cold - dt * .35);
}
function statMul() { const s = P.stat || {}; return s.freeze > 0 ? 0 : (s.shock > 0 ? .5 : 1) * (1 - .05 * (s.cold || 0)); }
function applyStatus(fx) {
  const s = P.stat; if (!s || s.resist > 0 || !fx) return;
  if (fx === 'poison') { s.poison = Math.min(5, s.poison + 1); s.pt = 8; toast('毒!(重なると強い)', 1); }
  if (fx === 'burn') { s.burn = 5; toast('点火!', 1); }
  if (fx === 'shock') { s.shock = 3; toast('感電! 動きが鈍い', 1.2); }
  if (fx === 'cold') { s.cold++; if (s.cold >= 5) { s.freeze = 2; s.cold = 0; toast('凍結! 動けない', 1.4); } else toast('冷気x' + s.cold, .8); }
}
function die() {
  saveClock();
  saveMeta(); lostLoot = P.loot; droppedStash = false;
  if (DF().stash && (P.loot > 0 || packN() > 0)) { stash = { stage: stageNo, x: Math.round(P.x), y: Math.round(P.y), loot: P.loot, pack: Object.assign({}, P.pack) }; saveStash(); droppedStash = true; }
  P.loot = 0; scene = 'dead'; showOv('dead');
}
let droppedStash = false, toast_clear = 0;
let lostLoot = 0, bankedLoot = 0;
let bgmOn = true, bgmT = null, bgmN = 0;
function bgmTick() {
  if (!bgmOn || scene !== 'play') return; bgmN++;
  // 面の自然に合わせた音: 春・森・海=明るい五音音階(鳥のさえずり)/ 砂漠・山・針葉樹=低めの落ち着いた旋律 / 氷・雪=高く澄んだ鈴
  const bi = (STAGES[stageNo - 1] || {}).biome || 'spring', night = isNight();
  const warm = ['spring', 'forest', 'beach', 'cove'].includes(bi), cold = ['glacier', 'snow', 'summit'].includes(bi);
  const sc = cold ? [523.3, 659.3, 784, 880, 1046.5] : warm ? (night ? [196, 220, 261.6, 329.6] : [261.6, 293.7, 329.6, 392, 440]) : (night ? [110, 130.8, 164.8, 196] : [146.8, 164.8, 174.6, 220, 246.9]);
  if (bgmN % 6 === 1) sfx(night ? 55 : cold ? 82.4 : 65.4, 3.2, 'sine', .03, 1);
  if (bgmN % 2 === 0) sfx(sc[(Math.random() * sc.length) | 0] * (Math.random() < .25 ? 2 : 1), cold ? 2.4 : 1.6, cold ? 'sine' : 'triangle', .016, 1);
  if (warm && !night && Math.random() < .22) { const f = 2400 + Math.random() * 900; sfx(f, .09, 'sine', .012, 1); setTimeout(() => sfx(f * 1.2, .08, 'sine', .01, 1), 110); }
  if (cold && Math.random() < .3) sfx(60 + Math.random() * 20, 1.8, 'sawtooth', .004, 1);
}
function bgmStart() { if (!bgmT) bgmT = setInterval(bgmTick, 800); }
function ebul(x, y, a, sp, dmg, col, r) {
  for (const e of enemies) if (Math.abs(e.x - x) < 1 && Math.abs(e.y - y) < 1) { e.rv = 1.4; break; } ebullets.push({ x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, dmg, pen: 12 + dmg * 1.4, life: 4, col: col || '#fb7185', r: r || 4, fx: STATUS_FX[stageNo] }); }

// ---------- 更新 ----------
function update(dt) {
  if (scene !== 'play') return; t += dt; clock.h += dt / 37.5; if (clock.h >= 24) { clock.h -= 24; clock.day++; }
  if (toastT > 0) toastT -= dt;
  // 入力→移動
  let mx = 0, my = 0; const k = inp.keys;
  if (k.KeyW || k.ArrowUp) my--; if (k.KeyS || k.ArrowDown) my++; if (k.KeyA || k.ArrowLeft) mx--; if (k.KeyD || k.ArrowRight) mx++;
  if (inp.ls) { mx = inp.ls.x; my = inp.ls.y; } if (inp.padLs) { mx = inp.padLs.x; my = inp.padLs.y; }
  if (G.bot) botThink();
  const ml = Math.hypot(mx, my); if (ml > 1) { mx /= ml; my /= ml; }
  const wantScope = inp.rdown || inp.tog || inp.padScope || (G.botScope === true);
  P.scoped = lerp(P.scoped, wantScope ? 1 : 0, Math.min(1, dt * 14));
  P.steady = !!(k.Space || inp.padSteady || G.botSteady) && P.scoped > .5 && P.breath > 0;
  P.breath = clamp(P.breath + (P.steady ? -dt / ((2.5 + .5 * up.gym) * CH().breath * (hasT('lung') ? 1.3 : 1)) : dt / 4), 0, 1); if (P.breath <= 0) P.steady = false;
  const sp = 150 * CH().spd * weightMul() * statMul() * (hasT('haste') ? 1.06 : 1) * (hasG('boots') ? 1.08 : 1) * (1 - P.scoped * .55) * (P.boost > 0 ? 1.3 : 1);
  if (gimOf() === 'ice') { P.sv = P.sv || { x: 0, y: 0 }; P.sv.x = lerp(P.sv.x, mx * sp, Math.min(1, dt * 2.2)); P.sv.y = lerp(P.sv.y, my * sp, Math.min(1, dt * 2.2)); P.vx = P.sv.x; P.vy = P.sv.y; } else { P.sv = P.sv || { x: 0, y: 0 }; const ac = (mx || my) ? 1 - Math.exp(-dt * 16) : 1 - Math.exp(-dt * 22); P.sv.x = lerp(P.sv.x, mx * sp, ac); P.sv.y = lerp(P.sv.y, my * sp, ac); if (Math.abs(P.sv.x) < 1) P.sv.x = 0; if (Math.abs(P.sv.y) < 1) P.sv.y = 0; P.vx = P.sv.x; P.vy = P.sv.y; }
  move(P, P.vx * dt, P.vy * dt);
  P.still = (Math.hypot(P.vx, P.vy) < 6) ? P.still + dt : 0; P.camo = P.still > .6 && t - P.lastFire > 1.6;
  // 面のギミックと大嵐(時間が経つと体力が減る=早めの脱出を促す)
  if (gimOf() === 'heat' && P.tier < 2 && !G.god) { P.hp -= .4 * dt; if (P.hp <= 0) die(); }
  { const lim = S_BOSS() ? STORM_T * 1.5 : STORM_T; if (t > lim - 40 && !P.stormWarn) { P.stormWarn = 1; toast('大嵐が迫っている! 脱出を急げ', 3); } if (t > lim && !G.god) { P.hp -= (2 + 4 * Math.min(2, (t - lim) / 60)) * dt; if (P.hp <= 0) die(); } }
  if (ml > 0) P.anim += dt * 9; if (P.vx) P.face = P.vx > 0 ? 1 : -1;
  updStatus(dt);
  { const zn = zoneAt(P.x, P.y); if (zn !== P.zone) { P.zone = zn; if (zn) toast('▶ ' + zn, 2.2); } }
  if (P.bleed && !G.god) { P.hp -= 2.2 * dt; if (P.hp <= 0) die(); } P.hurt -= dt; P.cd -= dt; P.boost -= dt; P.od -= dt; P.bloom = Math.max(0, P.bloom - dt * 1.4); P.rec *= Math.max(0, 1 - dt * 7); P.flash = (P.flash || 0) - dt;
  if (P.rel > 0) { P.rel -= dt; if (P.rel <= 0) finishReload(); }
  // 照準角(反動・揺れ込み)
  const ap = aimPoint(); const ddx = ap.x - P.x, ddy = ap.y - P.y; P.aimD = Math.max(40, Math.hypot(ddx, ddy));
  const mvf = Math.min(1, Math.hypot(P.vx, P.vy) / 150);
  P.aimA = Math.atan2(ddy, ddx) + P.rec + swayAng(mvf);
  const w = curW();
  // 射撃(スマホ: スコープ中は離した瞬間)
  const fireHeld = inp.down || inp.tfire || inp.padFire || (inp.rs && !inp.rs.pad && inp.rs.mag > .5 && P.scoped < .5) || (G.botFire === true);
  if (fireHeld && (w.auto || !P.trig)) { fire(); } P.trig = fireHeld;
  if (inp.rsRelease) { inp.rsRelease = false; if (P.scoped > .5) fire(); }
  // カメラ
  const tz = lerp(1.6, w.zoom * 1.6 * (w.id === 'sniper' ? 1.0 : 1), P.scoped);
  cam.z = lerp(cam.z, tz, Math.min(1, dt * 8));
  const off = P.scoped > .5 ? .5 : .18;
  let fx = P.x + (ap.x - P.x) * off, fy = P.y + (ap.y - P.y) * off;
  const lim = 320 / cam.z * 1.6; const ox = clamp(fx - P.x, -lim, lim), oy = clamp(fy - P.y, -lim, lim);
  { const kc = 1 - Math.exp(-dt * 9); cam.x = lerp(cam.x, P.x + ox, kc); cam.y = lerp(cam.y, P.y + oy, kc); }
  shake = Math.max(0, shake - dt * 30);
  // 弾
  for (const b of bullets) {
    const steps = Math.ceil(Math.hypot(b.vx, b.vy) * dt / 8);
    for (let s = 0; s < steps && b.life > 0; s++) {
      b.x += b.vx * dt / steps + windAt(t) * dt / steps; b.y += b.vy * dt / steps;
      if (solidB(Math.floor(b.x / T), Math.floor(b.y / T))) { b.life = 0; spark(b.x, b.y, '#cbd5e1'); break; }
      { let hb = false; for (const br of barrels) if (!br.dead && Math.hypot(br.x - b.x, br.y - b.y) < 13) { br.hp -= b.dmg; spark(b.x, b.y, '#fde047'); sfx(700, .05, 'square', .05); if (br.hp <= 0 && br.fuse == null) br.fuse = .05; b.life = 0; hb = true; break; } if (hb) break; }
      for (const e of enemies) { if (e.hp <= 0 || b.hit.includes(e)) continue; if (((e.x - b.x) / (e.r + 3)) ** 2 + ((e.y - b.y) / ((e.hy || e.r) * (e.elite ? 1.2 : 1) + 3)) ** 2 < 1) { hitEnemy(e, b); b.hit.push(e); if (b.pierce-- <= 0) { b.life = 0; } break; } }
    }
    b.life -= dt;
  }
  bullets = bullets.filter(b => b.life > 0);
  for (const b of ebullets) {
    b.x += (b.vx + windAt(t)) * dt; b.y += b.vy * dt; b.life -= dt;
    if (solidB(Math.floor(b.x / T), Math.floor(b.y / T))) { b.life = 0; spark(b.x, b.y, b.col); continue; }
    if (((b.x - P.x) / (11 + b.r)) ** 2 + ((b.y - P.y) / (19 + b.r)) ** 2 < 1) { const hp0 = P.hp; dmgPlayer(b.dmg, b.pen); if (P.hp < hp0 && b.fx && Math.random() < .4) applyStatus(b.fx); b.life = 0; }
  }
  ebullets = ebullets.filter(b => b.life > 0);
  // 敵
  for (const e of enemies) { if (e.rv > 0) e.rv -= dt; if (e.hp > 0) enemyAI(e, dt); }
  enemies = enemies.filter(e => e.hp > 0 || (e.dead = (e.dead || 0) + dt) < .01);
  // アイテム
  for (const it of items) { if (it.deny > 0) it.deny -= dt; else if (Math.hypot(it.x - P.x, it.y - P.y) < 20) { if (pickup(it) === false) it.deny = 1.5; else it.got = true; } }
  items = items.filter(i => !i.got);
  updGrenades(dt);
  // 粒子
  for (const p of parts) { p.x += p.vx * dt; p.y += p.vy * dt; p.life -= dt; p.vx *= .92; p.vy *= .92; } parts = parts.filter(p => p.life > 0); for (const f of fxs) f.t += dt; fxs = fxs.filter(f => f.t < f.dur);
  for (const x of texts) { x.y -= 24 * dt; x.life -= dt; } texts = texts.filter(x => x.life > 0);
  // 脱出(Extraction): 出口に立ち続ける。ボス面はボス撃破後に開く
  const bossAlive = enemies.some(e => EN[e.type].boss);
  for (const p of portals) { p.locked = bossAlive; const inZ = Math.hypot(p.x - P.x, p.y - P.y) < 40; if (inZ && !p.locked) { p.hold += dt; if (p.hold >= holdT()) stageClear(); } else p.hold = Math.max(0, p.hold - dt * 2); }
  portal = portals.reduce((a, b) => Math.hypot(a.x - P.x, a.y - P.y) <= Math.hypot(b.x - P.x, b.y - P.y) ? a : b, portals[0]);
  // コンテナの捜索(近くに立って1.2秒)
  for (const bx of boxes) {
    const dd = Math.hypot(bx.x - P.x, bx.y - P.y);
    if (!bx.open) { if (dd < 30) { bx.prog += dt; if (bx.prog >= 1.2) openBox(bx); } else bx.prog = Math.max(0, bx.prog - dt * 2); }
    else { if (dd > 60) bx.closed = false; if (bx.contents && bx.contents.length && !bx.closed && dd < 40 && lootBox !== bx) showLoot(bx); }
  }
  if (boxes.some(b => b.kind === 'bag' && b.contents.length === 0 && b !== lootBox)) boxes = boxes.filter(b => !(b.kind === 'bag' && b.contents.length === 0 && b !== lootBox));
  if (lootBox && lootBox.kind === 'bag' && lootBox.contents.length === 0) closeLoot(false);
  if (lootBox) { const bx = lootBox, dd = Math.hypot(bx.x - P.x, bx.y - P.y); if (dd > 70) closeLoot(false); else if (bx.reveal < bx.contents.length) { const before = Math.floor(bx.reveal); bx.reveal += dt / .35; if (Math.floor(bx.reveal) !== before) { sfx(600 + Math.floor(bx.reveal) * 60, .06, 'sine', .04, 1.2); renderLoot(); } } }
}
let lastKill = null;
function spark(x, y, col) { for (let i = 0; i < 4; i++)parts.push({ x, y, vx: R(-80, 80), vy: R(-80, 80), life: .25, col, sz: 2 }); }
function hitEnemy(e, b) {
  e.rv = 2;
  const cls = EN[e.type].cls || 0; let dm = b.dmg, pass = true;
  const far = b.eff && Math.hypot(e.x - b.x0, e.y - b.y0) > b.eff; if (far) { dm *= .5; e.far = true; }
  if (cls > 0) { pass = Math.random() < penChance(b.pen || 20, cls); if (!pass) dm *= .2; }
  e.hp -= dm; e.flash = .1; e.alert = true; e.x += b.vx * .01; e.y += b.vy * .01; spark(b.x, b.y, pass ? '#fca5a5' : '#93c5fd');
  P.hm = .16; P.hmk = e.hp <= 0 ? 1 : 0;
  { const ba = Math.atan2(b.vy, b.vx) || 0; for (let i = 0; i < (pass ? 7 : 4); i++) { const sa = ba + R(-.7, .7), sp2 = R(60, 220); parts.push({ x: b.x, y: b.y, vx: Math.cos(sa) * sp2, vy: Math.sin(sa) * sp2, life: R(.2, .45), col: pass ? ['#ef4444', '#fca5a5', '#fff'][i % 3] : ['#93c5fd', '#e0f2fe'][i % 2], sz: R(1.5, 3.2) }); } rings.push({ x: b.x, y: b.y, r: 3, dr: pass ? 22 : 16, t: 0, dur: .16, col: pass ? '#fecaca' : '#bfdbfe', w: 2 }); }
  if (pass && (dm >= 60 || e.hp <= 0)) { ts = .15; tsT = e.hp <= 0 ? (EN[e.type].boss ? .45 : .07) : .04; }
  texts.push({ x: e.x + R(-6, 6), y: e.y - e.r - 10, s: pass ? Math.round(dm) + (far ? '(遠)' : '') : '弾かれた', col: !pass ? '#93c5fd' : far ? '#fb923c' : dm >= 100 ? '#fde047' : '#fff', life: .6 });
  if (pass) { noise(.06, .22, 3800, 500); sfx(dm >= 100 ? 1250 : 680, .08, 'triangle', .08, 1.6); } else { sfx(1500, .09, 'square', .05, .6); noise(.04, .12, 8000, 3000); }
  if (e.hp <= 0) killEnemy(e);
}
function killEnemy(e) {
  stats.kills[e.type] = (stats.kills[e.type] || 0) + 1; if (EN[e.type].boss) stats.boss[stageNo] = 1;
  fxs.push({ x: e.x, y: e.y, t: 0, dur: EN[e.type].boss ? .9 : .45, k: EN[e.type].boss ? 1.9 : e.type === 'heavy' ? 1.0 : .7 });
  lastKill = { x: e.x, y: e.y }; sfx(120, .3, 'sawtooth', .07, .3); sfx(62, .4, 'sine', .22, .4); noise(.3, .3, 1800, 120); rings.push({ x: e.x, y: e.y, r: 6, dr: EN[e.type].boss ? 120 : 46, t: 0, dur: EN[e.type].boss ? .6 : .3, col: '#fbbf24', w: 4 }); if (EN[e.type].boss) boomSnd(true); shake = Math.max(shake, EN[e.type].boss ? 14 : 3);
  for (let i = 0; i < (EN[e.type].boss ? 40 : 10); i++)parts.push({ x: e.x, y: e.y, vx: R(-160, 160), vy: R(-160, 160), life: R(.3, .8), col: ['#f87171', '#fbbf24', '#fff'][i % 3], sz: 3 });
  { const mult = (isNight() ? 1.25 : 1) * (hasT('lucky') ? 1.1 : 1), bag = [], val = EN[e.type].val || 10;
    if (e.elite) { for (let k = 0; k < 4; k++) bag.push({ k: 'loot', m: 1, v: Math.round(val * R(3, 6) * (1 + stageNo * .15) * mult) }); bag.push({ k: 'armor' }); toast('強敵「' + e.elite + '」を撃破!', 2); }
    bag.push({ k: 'loot', m: 1, v: Math.round(val * R(.7, 1.4) * mult) });
    if (Math.random() < (EN[e.type].boss ? 1 : .22)) bag.push({ k: ['med', 'ammo', 'ammo', 'armor', 'boost', 'od', 'cure', 'bomb', 'bomb', 'flash'][(Math.random() * 10) | 0] });
    if (Math.random() < (EN[e.type].boss ? 1 : .08)) bag.push({ k: 'feather' });
    dropBag(e.x, e.y, bag); }
}
const PACKN = { med: '医療キット', boost: 'ブースト', od: 'オーバードライブ', cure: '解毒注射', bomb: '爆弾', flash: '閃光弾' }, PACKKEY = { med: 'H', boost: 'J', od: 'K', cure: 'L', bomb: 'G', flash: 'V' };
function useItem(k) {
  if (scene !== 'play' || !P.pack || !(P.pack[k] > 0)) return;
  if (k === 'bomb' || k === 'flash') { P.pack[k]--; throwG(k); return; }
  if (k === 'med' && P.hp >= P.max && !P.bleed) { toast('体力は満タン', 1); return; }
  P.pack[k]--; applyItem(k);
}
function throwG(kind) {
  const dist0 = Math.min(P.aimD || 200, 380), a = P.aimA, T0 = .7;
  grenades.push({ x: P.x + Math.cos(a) * 12, y: P.y + Math.sin(a) * 12, vx: Math.cos(a) * dist0 / T0, vy: Math.sin(a) * dist0 / T0, t: 0, fuse: 1.25, kind });
  sfx(300, .12, 'triangle', .05, 1.6); noise(.08, .15, 3000, 600);
}
const BLAST = { bomb: { r: 115, dmg: 150 }, barrel: { r: 100, dmg: 120 } };
function explode(x, y, kind) {
  const B = BLAST[kind] || BLAST.bomb;
  boomSnd(true); shake = Math.max(shake, 15); ts = .25; tsT = .14;
  fxs.push({ x, y, t: 0, dur: .75, k: 2.5 });
  rings.push({ x, y, r: 8, dr: B.r * 1.6, t: 0, dur: .45, col: '#fbbf24', w: 5 }); rings.push({ x, y, r: 4, dr: B.r * 1.1, t: 0, dur: .3, col: '#ffffff', w: 3 });
  for (let i = 0; i < 46; i++) parts.push({ x, y, vx: R(-340, 340), vy: R(-340, 340), life: R(.4, 1), col: ['#f97316', '#fbbf24', '#ffffff', '#78716c'][i % 4], sz: R(2, 5) });
  for (const e of enemies) { if (e.hp <= 0) continue; const d = Math.hypot(e.x - x, e.y - y), RR = B.r + e.r; if (d < RR) { const dm = B.dmg * (1 - Math.min(1, d / RR) * .6) * (EN[e.type].boss ? .6 : 1); e.stun = Math.max(e.stun || 0, .7); hitEnemy(e, { dmg: dm, pen: 90, x, y, vx: 0, vy: 0, hit: [] }); } }
  const dp = Math.hypot(P.x - x, P.y - y); if (dp < B.r) { P.hurt = 0; dmgPlayer(55 * (1 - dp / B.r), 90); }
  for (const b of barrels) if (!b.dead && b.fuse == null && Math.hypot(b.x - x, b.y - y) < B.r) b.fuse = .18;
}
function flashBang(x, y) {
  noise(.5, .55, 9000, 1200); sfx(2400, .3, 'square', .08, .3); shake = Math.max(shake, 6); rings.push({ x, y, r: 6, dr: 170, t: 0, dur: .35, col: '#ffffff', w: 6 });
  for (let i = 0; i < 24; i++) parts.push({ x, y, vx: R(-260, 260), vy: R(-260, 260), life: R(.3, .7), col: '#fffbe0', sz: 3 });
  for (const e of enemies) if (e.hp > 0 && Math.hypot(e.x - x, e.y - y) < 175) { e.stun = 3.5; e.alert = true; }
  if (Math.hypot(P.x - x, P.y - y) < 160) P.blind = 1.8;
}
function updGrenades(dt) {
  for (const g of grenades) {
    g.t += dt; if (g.t < .7) { const nx = g.x + g.vx * dt, ny = g.y + g.vy * dt; if (solid(Math.floor(nx / T), Math.floor(ny / T))) { g.vx = g.vy = 0; } else { g.x = nx; g.y = ny; } } else { g.vx *= .9; g.vy *= .9; }
    if (g.t >= g.fuse && !g.done) { g.done = true; if (g.kind === 'bomb') explode(g.x, g.y, 'bomb'); else flashBang(g.x, g.y); }
  }
  grenades = grenades.filter(g => !g.done);
  for (const b of barrels) if (b.fuse != null && !b.dead) { b.fuse -= dt; if (b.fuse <= 0) { b.dead = true; explode(b.x, b.y, 'barrel'); } }
  barrels = barrels.filter(b => !b.dead);
  for (const r of rings) r.t += dt; rings = rings.filter(r => r.t < r.dur);
  if (P.hm > 0) P.hm -= dt; if (P.hurtFx > 0) P.hurtFx -= dt; if (P.blind > 0) P.blind -= dt;
}
function drawGrenade(g) {
  const h = g.t < .7 ? Math.sin(Math.PI * g.t / .7) * 34 : 0, X = sx(g.x), Y = sy(g.y), z = cam.z / 1.4; shadow(g.x, g.y, 5, 0);
  ctx.fillStyle = g.kind === 'bomb' ? '#1f2937' : '#e5e7eb'; ctx.beginPath(); ctx.arc(X, Y - h * z, 5 * z, 0, 7); ctx.fill(); ctx.strokeStyle = '#111'; ctx.lineWidth = 1; ctx.stroke();
  if (Math.floor(g.t * (6 + g.t * 8)) % 2 === 0) { ctx.fillStyle = g.kind === 'bomb' ? '#ef4444' : '#fde047'; ctx.fillRect(X - z, Y - h * z - 7 * z, 2 * z, 2 * z); }
}
function drawBarrel(b) {
  shadow(b.x, b.y, 11); const X = sx(b.x), Y = sy(b.y) - 6 * cam.z / 1.4, z = cam.z / 1.4;
  { const im = mxOk('barrel'); if (im) { if (b.fuse != null && Math.floor(t * 14) % 2) ctx.globalAlpha = .55; spr(im, b.x, b.y, false, 0, .6); ctx.globalAlpha = 1; if (b.fuse != null) { ctx.fillStyle = 'rgba(255,255,255,.35)'; ctx.fillRect(X - 9 * z, Y - 14 * z, 18 * z, 26 * z); } return; } }
  ctx.fillStyle = '#b91c1c'; ctx.fillRect(X - 9 * z, Y - 11 * z, 18 * z, 22 * z); ctx.fillStyle = '#7f1d1d'; ctx.fillRect(X - 9 * z, Y - 6 * z, 18 * z, 3 * z); ctx.fillRect(X - 9 * z, Y + 4 * z, 18 * z, 3 * z);
  ctx.fillStyle = '#fde047'; ctx.fillRect(X - 3 * z, Y - 1 * z, 6 * z, 4 * z); ctx.fillStyle = '#111'; ctx.fillRect(X - 1 * z, Y, 2 * z, 2 * z);
  if (b.fuse != null) { ctx.fillStyle = '#fff'; ctx.globalAlpha = .6; ctx.fillRect(X - 9 * z, Y - 11 * z, 18 * z, 22 * z); ctx.globalAlpha = 1; }
}
function applyItem(k) {
  if (k === 'med') { const h = Math.round(35 * CH().heal * (hasG('medvest') ? 1.25 : 1)); P.hp = Math.min(P.max, P.hp + h); if (P.bleed) toast('止血した', 1.2); else toast('医療キット +' + h, 1.2); P.bleed = false; P.stat.burn = 0; P.stat.poison = 0; }
  if (k === 'boost') { P.boost = 10; toast('ブースト 10秒', 1.2); }
  if (k === 'od') { P.od = 10; toast('オーバードライブ 10秒', 1.2); }
  if (k === 'cure') { Object.assign(P.stat, { poison: 0, pt: 0, burn: 0, shock: 0, cold: 0, freeze: 0, resist: 25 }); P.bleed = false; toast('解毒注射: 状態異常を消し、25秒耐性', 1.6); }
  sfx(660, .1, 'sine', .05, 1.4);
}
function dropBag(x, y, list) {
  let b = boxes.find(q => q.kind === 'bag' && Math.hypot(q.x - x, q.y - y) < 46);
  if (!b) { b = { x, y, kind: 'bag', open: true, prog: 0, rich: false, contents: [], reveal: 99, closed: false }; boxes.push(b); }
  b.contents.push(...list); b.closed = false;
}
function pickup(it) {
  if (it.k === 'med' || it.k === 'boost' || it.k === 'od' || it.k === 'cure' || it.k === 'bomb' || it.k === 'flash') {
    if (packN() < bagSlots()) { P.pack[it.k]++; toast(PACKN[it.k] + ' をバッグへ(' + PACKKEY[it.k] + 'で使う)', 1.4); sfx(880, .12, 'sine', .05, 1.5); return; }
    if (it.k === 'med') { applyItem('med'); return; }
    toast('バッグがいっぱい', 1.2); return false;
  }
  if (it.k === 'feather') { P.fe = (P.fe || 0) + 1; toast('ぼやけた羽根 +1(脱出で持ち帰り。8個でトーテム)', 1.6); sfx(1000, .12, 'sine', .04, 1.4); return; }
  if (it.k === 'stash') {
    const cap = BAGS[bagLv].loot, take = Math.max(0, Math.min(stash.loot, cap - P.loot)); stash.loot -= take; P.loot += take;
    for (const k of ['med', 'boost', 'od', 'cure', 'bomb', 'flash']) while ((stash.pack[k] || 0) > 0 && packN() < bagSlots()) { stash.pack[k]--; P.pack[k] = (P.pack[k] || 0) + 1; }
    const left = stash.loot + stash.pack.med + stash.pack.boost + stash.pack.od + (stash.pack.cure || 0) + (stash.pack.bomb || 0) + (stash.pack.flash || 0);
    if (left > 0) { saveStash(); toast('遺失物を一部回収(バッグに入りきらない分は残った)', 2); return false; }
    stats.recover = (stats.recover || 0) + 1; stash = null; saveStash(); toast('遺失物を回収した! 戦利品 +' + take + 'G', 2); sfx(880, .15, 'sine', .05, 1.6); return;
  }
  if (it.k === 'loot' && !it.m) { it.m = 1; it.v = Math.round(it.v * (isNight() ? 1.25 : 1) * (hasT('lucky') ? 1.1 : 1)); }
  if (it.k === 'loot') { const cap = BAGS[bagLv].loot; if (P.loot >= cap) { toast('バッグがいっぱい(戦利品 ' + cap + 'G)', 1.4); return false; } it.v = Math.min(it.v, cap - P.loot); }
  sfx(880, .12, 'sine', .05, 1.5);
  if (it.k === 'loot') { P.loot += it.v; const nm = LOOT_NAMES[stageNo - 1][it.v >= 100 ? 1 : 0]; toast(nm + ' +' + it.v + 'G (持ち帰り前)', 1.4); }
  if (it.k === 'log') { if (!logs[stageNo]) { logs[stageNo] = 1; try { localStorage.setItem('nx_logs', JSON.stringify(logs)); } catch (e) { } } toast('【記録 ' + stageNo + '】' + LOGS[stageNo - 1], 7); sfx(500, .3, 'sine', .05, 1.6); }
  if (it.k === 'ammo') { for (const w of WEAPONS) { const a = P.ammo[w.id]; if (a && a.res !== Infinity) a.res = Math.min(w.res * 2, a.res + Math.ceil(w.res * .5)); } toast('弾薬補給', 1.2); }
  if (it.k === 'armor') { const nt = Math.min(3, 1 + Math.floor(stageNo / 3.5)); if (nt > P.tier) P.tier = nt; P.ap = ARMOR[P.tier].max; toast('防具: ' + ARMOR[P.tier].n, 1.6); }
}
function stageClear() {
  saveClock();
  if (P.fe) { tot.f += P.fe; toast_clear = P.fe; P.fe = 0; }
  stats.clears = (stats.clears || 0) + 1; if (isNight()) stats.nightClears = (stats.nightClears || 0) + 1;
  bankedLoot = Math.round(P.loot * (1 + .1 * base.lab)); money += bankedLoot; P.loot = 0; saveMeta();
  scene = 'clear'; unlocked = Math.max(unlocked, Math.min(10, stageNo + 1)); try { localStorage.setItem('nx_unlock', unlocked); } catch (e) { }
  showOv(stageNo >= 10 ? 'end' : 'clear');
}

// ---------- 敵AI ----------
function enemyAI(e, dt) {
  e.warn = Math.max(0, (e.warn || 0) - dt);
  if (e.stun > 0) { e.stun -= dt; e.anim += dt * 2; e.flash -= dt; return; }
  e.anim += dt * 8; e.flash -= dt; const dx = P.x - e.x, dy = P.y - e.y, d = Math.hypot(dx, dy) || 1, a = Math.atan2(dy, dx);
  if (dx) e.face = dx > 0 ? 1 : -1;
  const see = d < 460 * DF().sight * (mods.sup ? .65 : 1) * (P.camo && !EN[e.type].boss ? (hasT('ghost') ? .36 : .45) : 1) && los(e.x, e.y, P.x, P.y);
  if (!e.alert && see) { e.alert = true; e.warn = .9; e.rv = .9; sfx(640, .12, 'triangle', .025, -.35); for (const o of enemies) if (!o.alert && Math.hypot(o.x - e.x, o.y - e.y) < 220) { o.alert = true; o.warn = .9; o.rv = .9; } }
  if (e.elite && e.alert) {
    e.dc = (e.dc == null ? 3 : e.dc) - dt;
    if (e.type === 'heavy') {
      if (e.dash > 0) { e.dash -= dt; move(e, Math.cos(e.da) * 430 * dt, Math.sin(e.da) * 430 * dt); if (d < 32 && !e.hitD) { e.hitD = 1; dmgPlayer(28, 60); shake = Math.max(shake, 8); } if (Math.random() < .6) parts.push({ x: e.x, y: e.y + 6, vx: R(-40, 40), vy: R(-40, 40), life: .3, col: '#fbbf24', sz: 3 }); return; }
      if (e.tele > 0) { e.tele -= dt; if (e.tele <= 0) { e.dash = .55; e.hitD = 0; sfx(140, .35, 'sawtooth', .08, 2.2); } return; }
      if (e.dc <= 0 && d < 460) { e.dc = 5; e.tele = .75; e.da = a; sfx(220, .5, 'sawtooth', .06, 1.8); return; }
    } else if (e.type === 'sniper') {
      if (e.vol > 0) { e.vt -= dt; if (e.vt <= 0) { ebul(e.x, e.y, Math.atan2(P.y - e.y, P.x - e.x) + R(-.025, .025), 600, 16, '#fde047', 4); e.vol--; e.vt = .15; } }
      else if (e.dc <= 0 && d < 560) { e.dc = 4.5; e.vol = 4; e.vt = .6; sfx(900, .5, 'sine', .06, 2.2); }
    } else if (e.type === 'gunner') {
      if (e.dc <= 0 && d < 480) { e.dc = 4; for (let i = -3; i <= 3; i++) ebul(e.x, e.y, a + i * .17, 270, 10, '#fb7185', 4); sfx(260, .25, 'sawtooth', .07, .6); }
    }
  }
  if (!e.alert) { e.wander += dt; if (Math.sin(e.wander) > .6) move(e, Math.cos(e.wander * 3) * 20 * dt, Math.sin(e.wander * 2) * 20 * dt); return; }
  e.cd -= dt;
  const mv = (ang, sp) => move(e, Math.cos(ang) * sp * dt, Math.sin(ang) * sp * dt);
  const ty = e.type;
  if (ty === 'drone') { mv(a + Math.sin(e.anim * .5) * .5, e.spd); if (d < e.r + 12 && e.cd <= 0) { dmgPlayer(10, 8); e.cd = .8; } }
  else if (ty === 'beast') {
    e.fa = a;
    if (e.lunge > 0) { e.lunge -= dt; e.fa = e.la; mv(e.la, 380); if (d < e.r + 16 && !e.hitL) { e.hitL = 1; dmgPlayer(22, 22); shake = Math.max(shake, 5); } if (Math.random() < .5) parts.push({ x: e.x, y: e.y, vx: R(-30, 30), vy: R(-30, 30), life: .25, col: '#38bdf8', sz: 3 }); }
    else if (e.tele > 0) { e.tele -= dt; e.da = a; if (e.tele <= 0) { e.lunge = .4; e.hitL = 0; e.la = a; sfx(180, .3, 'sawtooth', .07, 2.5); } }
    else {
      if (d > 240) mv(a, e.spd); else mv(a + e.sd * 1.25, e.spd * .85);
      e.st -= dt; if (e.st <= 0) { e.sd *= -1; e.st = R(1, 2.2); }
      if (e.cd <= 0 && d < 270) { e.tele = .45; e.da = a; e.cd = R(2.2, 3.2); sfx(300, .3, 'sine', .05, 1.8); }
    }
  }
  else if (ty === 'gunner') {
    if (d > 280) mv(a, e.spd); else if (d < 170) mv(a + Math.PI, e.spd); else { e.st -= dt; if (e.st <= 0) { e.sd *= -1; e.st = R(1, 2); } mv(a + e.sd * Math.PI / 2, e.spd * .8); }
    if (e.burst > 0) { e.bt -= dt; if (e.bt <= 0) { ebul(e.x, e.y, a + rad(R(-4, 4)), 300, 8); e.burst--; e.bt = .12; sfx(260, .05, 'square', .03); } }
    else if (e.cd <= 0 && see && e.warn <= 0) { e.burst = 3; e.bt = 0; e.cd = R(1.8, 2.6); }
  } else if (ty === 'sniper') {
    if (d < 300) mv(a + Math.PI, e.spd); else if (d > 450 || !see) mv(a, e.spd * .8);
    if (e.aimT > 0) { e.aimT -= dt; if (e.aimT > .35) e.lock = a; if (e.aimT <= 0) { ebul(e.x, e.y, e.lock, 900, 30, '#fb7185', 4); sfx(160, .3, 'sawtooth', .06, .4); e.cd = 2.8; } }
    else if (e.cd <= 0 && see && e.warn <= 0) { e.aimT = 1.1; e.lock = a; }
  } else if (ty === 'heavy') {
    if (d > 150) mv(a, e.spd);
    if (e.cd <= 0 && see && d < 340 && e.warn <= 0) { for (let i = -2; i <= 2; i++)ebul(e.x, e.y, a + i * rad(9), 280, 7, '#fb923c', 5); e.cd = 1.6; sfx(120, .15, 'sawtooth', .05); }
  } else if (EN[ty].boss) bossAI(e, dt, a, d, mv);
  if (e.elite && e.alert) { e.ec -= dt; if (e.ec <= 0) { e.ec = 3.2; const n2 = 10, a0 = Math.random() * 6.28; for (let i = 0; i < n2; i++) ebul(e.x, e.y, a0 + i / n2 * 6.283, 190, 8, '#fbbf24', 5); sfx(150, .2, 'sawtooth', .06, .5); } }
  // 敵同士の押し合い
  for (const o of enemies) if (o !== e && o.hp > 0) { const ox = e.x - o.x, oy = e.y - o.y, od = Math.hypot(ox, oy); if (od > 0 && od < e.r + o.r) move(e, ox / od * 40 * dt, oy / od * 40 * dt); }
}
function bossAI(e, dt, a, d, mv) {
  const lv = EN[e.type].boss, f = e.hp / e.max;
  if (d > 240) mv(a, e.spd); else if (d < 160) mv(a + Math.PI, e.spd * .8); else mv(a + Math.PI / 2 * e.sd, e.spd * .6);
  e.st -= dt; if (e.st <= 0) { e.sd *= -1; e.st = R(2, 4); }
  e.ph += dt; e.cd -= 0; // cdは上で減算済み
  if (e.cd <= 0 && e.warn <= 0) {
    const pick = Math.floor(e.ph) % 3;
    if (pick === 0) { const n = lv === 1 ? 18 : 24; for (let i = 0; i < n; i++)ebul(e.x, e.y, i / n * Math.PI * 2 + e.ang0, 170, 9, '#f87171', 5); e.ang0 += .2; e.cd = 2.0; }
    else if (pick === 1) { for (let i = -3; i <= 3; i++)ebul(e.x, e.y, a + i * rad(8), 320, 10, '#fbbf24', 5); e.cd = 1.2; }
    else { if (lv === 2) { for (let i = 0; i < 10; i++)ebul(e.x, e.y, e.ang0 + i * .63, 220, 8, '#c084fc', 5); e.ang0 += .35; } else for (let i = -1; i <= 1; i++)ebul(e.x, e.y, a + i * rad(14), 380, 12, '#fb923c', 6); e.cd = 1.0; }
    sfx(100, .2, 'sawtooth', .07, .5);
  }
  for (const th of [.66, .33]) if (f < th && !e['s' + th]) { e['s' + th] = 1; for (let i = 0; i < 3; i++) { const m = mkEnemy('drone', e.x + R(-40, 40), e.y + R(-40, 40)); m.alert = true; enemies.push(m); } toast('敵増援!', 1.2); }
}
// ---------- bot (テスト用) ----------
function botThink() {
  let best = null, bd = 1e9; for (const e of enemies) { if (e.hp <= 0) continue; const d = Math.hypot(e.x - P.x, e.y - P.y); if (d < bd) { bd = d; best = e; } }
  if (!best && portal) best = portal;
  if (best === portal) { const a2 = Math.atan2(portal.y - P.y, portal.x - P.x); inp.ls = Math.hypot(portal.x - P.x, portal.y - P.y) > 12 ? { x: Math.cos(a2), y: Math.sin(a2), mag: 1 } : { x: 0, y: 0, mag: 0 }; G.botFire = false; return; }
  if (best) { G.botAim = { x: best.x, y: best.y }; const a = Math.atan2(best.y - P.y, best.x - P.x); inp.ls = bd > 220 ? { x: Math.cos(a), y: Math.sin(a), mag: 1 } : { x: -Math.sin(a), y: Math.cos(a), mag: 1 }; G.botFire = !!best.hp && bd < 520 && los(P.x, P.y, best.x, best.y) && (Math.floor(t * 8) % 2 === 0); if (!G.botKeepW) { if (bd > 600) P.cur = 1; else P.cur = stageNo >= 4 ? 4 : stageNo >= 2 ? 2 : 0; } }
  if (G.botScope !== undefined && hash.has('scope')) G.botScope = true;
}

// ---------- 描画 ----------
// カメラは画面の整数ピクセルに合わせる(動いたときの絵のぶれを防ぐ)
const sx = x => (x - Math.round(cam.x * cam.z) / cam.z) * cam.z + W / 2, sy = y => (y - Math.round(cam.y * cam.z) / cam.z) * cam.z + H / 2;
function hashT(x, y) { let h = (x * 374761393 + y * 668265263) >>> 0; h = ((h ^ (h >> 13)) * 1274126177) >>> 0; return (h ^ (h >> 16)) >>> 0; }
function spr(img, x, y, flip, bob, k) {
  k = k || 1; const w = img.width * cam.z * k, h = img.height * cam.z * k, X = Math.round(sx(x)), Y = Math.round(sy(y) + h / 2 - (bob || 0) * cam.z);
  ctx.save(); if (flip) { ctx.translate(X, 0); ctx.scale(-1, 1); ctx.translate(-X, 0); } ctx.drawImage(img, X - w / 2, Y - h, w, h); ctx.restore();
}
function draw() {
  const S = STAGES[stageNo - 1] || STAGES[0];
  ctx.imageSmoothingEnabled = false; ctx.fillStyle = '#05070d'; ctx.fillRect(0, 0, W, H);
  if (scene === 'title' || !tiles) return;
  const shx = (Math.random() - .5) * shake, shy = (Math.random() - .5) * shake; ctx.save(); ctx.translate(shx, shy);
  const hw = W / 2 / cam.z + T * 2, hh = H / 2 / cam.z + T * 3;
  const tx0 = Math.max(0, Math.floor((cam.x - hw) / T)), tx1 = Math.min(MW - 1, Math.ceil((cam.x + hw) / T)), ty0 = Math.max(0, Math.floor((cam.y - hh) / T)), ty1 = Math.min(MH - 1, Math.ceil((cam.y + hh) / T));
  const tz = Math.ceil(T * cam.z) + 1;
  for (let y = ty0; y <= ty1; y++)for (let x = tx0; x <= tx1; x++) {
    if (tiles[y * MW + x] === 1) continue; if (tiles[y * MW + x] === 2) { drawRoadTile(x, y, S); continue; }
    if (tiles[y * MW + x] === 3 && S.water) { drawWaterTile(x, y, S); continue; }
    drawBiomeTile(x, y, S, Math.floor(sx(x * T)), Math.floor(sy(y * T)), tz);
  }
  // 出口ポータル
  for (const portal of portals) { const X = sx(portal.x), Y = sy(portal.y), r = (22 + Math.sin(t * 5) * 2) * cam.z, col = portal.locked ? '#f87171' : '#4ade80'; ctx.strokeStyle = col; ctx.lineWidth = 3; ctx.beginPath(); ctx.ellipse(X, Y, r, r * .6, 0, 0, 7); ctx.stroke(); ctx.globalAlpha = .2; ctx.fillStyle = col; ctx.fill(); ctx.globalAlpha = 1;
    if (portal.hold > 0) { ctx.strokeStyle = '#fff'; ctx.lineWidth = 4; ctx.beginPath(); ctx.ellipse(X, Y, r + 5, (r + 5) * .6, 0, -Math.PI / 2, -Math.PI / 2 + portal.hold / holdT() * Math.PI * 2); ctx.stroke(); }
    ctx.fillStyle = col; ctx.font = 'bold 12px sans-serif'; ctx.textAlign = 'center'; ctx.fillText(portal.locked ? 'EXTRACT(ボス撃破で開く)' : 'EXTRACT 脱出', X, Y - r * .6 - 8); }
  // 影つきソート描画
  const list = [];
  for (let y = ty0; y <= ty1; y++)for (let x = tx0; x <= tx1; x++)if (tiles[y * MW + x] === 1) list.push({ y: (y + 1) * T, f: () => drawWall(x, y, S) });
  for (let y = ty0; y <= ty1; y++) for (let x = tx0; x <= tx1; x++) if (tiles[y * MW + x] === 3 && !S.water) list.push({ y: (y + .5) * T, f: () => drawBarrier(x, y) });
  for (const d of decor) if (d.x > cam.x - hw && d.x < cam.x + hw && d.y > cam.y - hh && d.y < cam.y + hh) list.push({ y: d.y, f: () => drawDecor(d) });
  for (const it of items) list.push({ y: it.y, f: () => drawItem(it) });
  for (const bx of boxes) list.push({ y: bx.y, f: () => drawBox(bx) });
  for (const g of grenades) list.push({ y: g.y, f: () => drawGrenade(g) });
  for (const b of barrels) list.push({ y: b.y, f: () => drawBarrel(b) });
  for (const e of enemies) { e.vis = radarVis(e); if (e.vis > 0) list.push({ y: e.y, f: () => { ctx.globalAlpha = e.vis; drawEnemy(e); ctx.globalAlpha = 1; if (e.tele > 0) { ctx.strokeStyle = 'rgba(239,68,68,' + (.4 + .5 * Math.sin(t * 40)) + ')'; ctx.lineWidth = 10 * cam.z / 1.4; ctx.beginPath(); ctx.moveTo(sx(e.x), sy(e.y)); ctx.lineTo(sx(e.x + Math.cos(e.da) * 300), sy(e.y + Math.sin(e.da) * 300)); ctx.stroke(); } if (e.stun > 0) { ctx.fillStyle = '#fde047'; ctx.font = 'bold 12px sans-serif'; ctx.textAlign = 'center'; ctx.fillText('★ ★ ★', sx(e.x), sy(e.y) - (e.r + 26) * cam.z / 1.1); } } }); }
  list.push({ y: P.y, f: drawPlayer });
  list.sort((a, b) => a.y - b.y); for (const o of list) o.f();
  // 敵のレーザー
  for (const e of enemies) if (e.type === 'sniper' && e.aimT > 0) { ctx.strokeStyle = `rgba(255,60,80,${.35 + (e.aimT < .35 ? .6 : 0)})`; ctx.lineWidth = e.aimT < .35 ? 2 : 1; ctx.beginPath(); ctx.moveTo(sx(e.x), sy(e.y)); ctx.lineTo(sx(e.x + Math.cos(e.lock) * 900), sy(e.y + Math.sin(e.lock) * 900)); ctx.stroke(); }
  // 弾
  for (const b of bullets) { ctx.strokeStyle = b.col; ctx.lineWidth = 2 * cam.z / 1.6 + 1; const m = Math.hypot(b.vx, b.vy); ctx.beginPath(); ctx.moveTo(sx(b.x), sy(b.y)); ctx.lineTo(sx(b.x - b.vx / m * b.len), sy(b.y - b.vy / m * b.len)); ctx.stroke(); }
  for (const f of fxs) { const names = ['ex1', 'ex2', 'ex3', 'ex4', 'ex5'], im = SPR.fx[names[Math.min(4, Math.floor(f.t / f.dur * 5))]]; if (!im) continue; const kk = f.k * cam.z, w2 = im.width * kk, h2 = im.height * kk; ctx.globalAlpha = f.t / f.dur > .8 ? 1 - (f.t / f.dur - .8) * 5 : 1; ctx.drawImage(im, sx(f.x) - w2 / 2, sy(f.y) - h2 / 2, w2, h2); ctx.globalAlpha = 1; }
  for (const b of ebullets) { const eo = SPR.fx.orbE; if (eo && b.r <= 5 && (b.col === '#fb7185' || b.col === '#f87171')) { const kk = .3 * cam.z * (b.r / 4); ctx.drawImage(eo, sx(b.x) - eo.width * kk / 2, sy(b.y) - eo.height * kk / 2, eo.width * kk, eo.height * kk); continue; } ctx.fillStyle = b.col; ctx.beginPath(); ctx.arc(sx(b.x), sy(b.y), b.r * cam.z / 1.2, 0, 7); ctx.fill(); ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(sx(b.x), sy(b.y), b.r * cam.z / 2.6, 0, 7); ctx.fill(); }
  for (const p of parts) { ctx.fillStyle = p.col; ctx.globalAlpha = Math.min(1, p.life * 3); ctx.fillRect(sx(p.x), sy(p.y), p.sz * cam.z / 1.4, p.sz * cam.z / 1.4); } ctx.globalAlpha = 1;
  for (const r of rings) { const k = r.t / r.dur; ctx.strokeStyle = r.col; ctx.globalAlpha = 1 - k; ctx.lineWidth = (r.w || 3) * (1 - k * .6); ctx.beginPath(); ctx.arc(sx(r.x), sy(r.y), (r.r + r.dr * Math.sqrt(k)) * cam.z / 1.4, 0, 7); ctx.stroke(); } ctx.globalAlpha = 1;
  ctx.font = 'bold 14px monospace'; ctx.textAlign = 'center'; for (const x of texts) { ctx.fillStyle = x.col; ctx.fillText(x.s, sx(x.x), sy(x.y)); }
  ctx.restore();
  drawRadarFog();
  drawGimmick();
  drawScope(); drawHUD();
}
// ---------- 動物系FPS: バイオーム(春・森・海・砂漠・山・氷河・雪山)の描画 ----------
const BIOME = {
  spring: { dots: [['#6fae4a', 26, 1, 2], ['#3f7a30', 18, 1, 2], ['#8fcf63', 10, 2, 1]], flowers: ['#fde68a', '#f9a8d4', '#ffffff', '#c4b5fd'], path: '#b6925b', pathE: '#8a6c3f', water: ['#3b8ccf', '#5aa8e0'] },
  forest: { dots: [['#3d7a40', 24, 1, 2], ['#1f4d2a', 22, 2, 1], ['#7a5a35', 12, 2, 1]], flowers: [], path: '#8a6a45', pathE: '#5f4630', water: ['#2b6b7a', '#3f8a96'] },
  beach: { dots: [['#efdca0', 20, 3, 1], ['#c9b077', 16, 2, 1]], ripple: '#f3e6b2', flowers: [], path: '#a9824f', pathE: '#6e5230', plank: true, water: ['#1d86c8', '#49b4ea'] },
  cove: { dots: [['#a99a6c', 18, 2, 1], ['#cdbd8b', 14, 3, 1]], ripple: '#d9ca98', flowers: [], path: '#8b7a55', pathE: '#5d513a', plank: true, water: ['#1e5f86', '#3b87b0'] },
  desert: { dots: [['#e6bd72', 20, 3, 1], ['#bd8c44', 18, 2, 1]], ripple: '#ecc884', flowers: [], path: '#b88a40', pathE: '#8a6428', water: ['#2a9db5', '#5cc4d6'] },
  mountain: { dots: [['#9a9a8c', 22, 2, 2], ['#66665c', 20, 1, 1], ['#a3b08a', 8, 2, 1]], flowers: ['#fde68a', '#ffffff'], path: '#9c9a8e', pathE: '#6f6d63', water: ['#3a7ca0', '#5a9cc0'] },
  pine: { dots: [['#5d6e57', 22, 1, 2], ['#3e4f3c', 20, 2, 1], ['#8a7a58', 10, 2, 1]], flowers: [], path: '#76634a', pathE: '#4f402c', water: ['#2f6f86', '#4a8ea4'] },
  glacier: { dots: [['#ffffff', 16, 2, 1], ['#a9d3e6', 18, 3, 1]], cracks: '#7fb6d2', flowers: [], path: '#dbe9f2', pathE: '#9bc2d8', water: ['#0b2a45', '#17446a'] },
  snow: { dots: [['#ffffff', 22, 3, 1], ['#cfdbe8', 20, 2, 1]], flowers: [], path: '#cdd9e6', pathE: '#9fb2c6', water: ['#2a5578', '#3f78a0'] },
  summit: { dots: [['#ffffff', 20, 2, 1], ['#bfd0e2', 20, 3, 1]], cracks: '#9db8d4', flowers: [], path: '#bccee0', pathE: '#8aa4c0', water: ['#1c3f66', '#2c5f92'] },
};
const biomeTiles = {};
function biomeTileSet(S) {
  const b = S.biome; if (biomeTiles[b]) return biomeTiles[b]; const B = BIOME[b], out = [];
  for (let v = 0; v < 6; v++) {
    const c = document.createElement('canvas'); c.width = c.height = 32; const g = c.getContext('2d'); let sd = (v + 1) * 9301 + b.length * 49297;
    const r = () => (sd = (sd * 1664525 + 1013904223) >>> 0) / 4294967296;
    g.fillStyle = S.fl[v & 1]; g.fillRect(0, 0, 32, 32);
    for (const [col, n, w, h] of B.dots) { g.fillStyle = col; for (let i = 0; i < n; i++) g.fillRect((r() * 31) | 0, (r() * 31) | 0, w, h); }
    if (B.ripple) { g.strokeStyle = B.ripple; g.lineWidth = 1; for (let i = 0; i < 3; i++) { const y = 6 + i * 10 + ((r() * 4) | 0); g.beginPath(); g.moveTo(0, y); g.bezierCurveTo(10, y - 3, 20, y + 3, 32, y); g.stroke(); } }
    if (B.cracks && v % 2 === 0) { g.strokeStyle = B.cracks; g.lineWidth = 1; g.beginPath(); let x = r() * 32, y = r() * 32; g.moveTo(x, y); for (let i = 0; i < 4; i++) { x += (r() - .5) * 14; y += (r() - .5) * 14; g.lineTo(x, y); } g.stroke(); }
    if (B.flowers.length && v % 3 === 1) { for (let i = 0; i < 2; i++) { const x = 3 + ((r() * 24) | 0), y = 3 + ((r() * 24) | 0); g.fillStyle = B.flowers[(r() * B.flowers.length) | 0]; g.fillRect(x, y, 2, 2); g.fillStyle = '#3f7a30'; g.fillRect(x, y + 2, 1, 2); } }
    out.push(c);
  }
  return biomeTiles[b] = out;
}
function drawBiomeTile(x, y, S, tx, ty, tz) {
  const ts = biomeTileSet(S); ctx.drawImage(ts[hashT(x, y) % ts.length], tx, ty, tz, tz);
}
function drawWaterTile(x, y, S) {
  const B = BIOME[S.biome], X = Math.floor(sx(x * T)), Y = Math.floor(sy(y * T)), s = Math.ceil(T * cam.z) + 1, z = cam.z, h = hashT(x, y);
  ctx.fillStyle = B.water[0]; ctx.fillRect(X, Y, s, s);
  const w = Math.sin(t * 1.6 + x * .9 + y * .7); ctx.fillStyle = B.water[1]; ctx.globalAlpha = .45 + .25 * w; ctx.fillRect(X + ((h >> 3) & 15) * z, Y + ((h >> 7) & 15) * z, 12 * z, 2 * z); ctx.fillRect(X + ((h >> 5) & 15) * z, Y + (((h >> 9) & 15) + 8) % 30 * z, 9 * z, 2 * z); ctx.globalAlpha = 1;
  const W = (a, b) => tiles[b * MW + a] === 3, up = W(x, y - 1), dn = W(x, y + 1), lf = W(x - 1, y), rt = W(x + 1, y);
  ctx.fillStyle = 'rgba(255,255,255,.55)'; const f = Math.max(1, z * 1.5); if (!up) ctx.fillRect(X, Y, s, f); if (!dn) ctx.fillRect(X, Y + s - f, s, f); if (!lf) ctx.fillRect(X, Y, f, s); if (!rt) ctx.fillRect(X + s - f, Y, f, s);
  if (!dn) { ctx.fillStyle = 'rgba(0,0,0,.18)'; ctx.fillRect(X, Y + s, s, 4 * z); }
}

// ---------- 時間と影: 太陽は東→南→西へ動き、影の向き・長さ・濃さが変わる。夜は月明かり ----------
function sunInfo() {
  const h = clock.h, fr = Math.floor(h * 60); if (sunInfo.c && sunInfo.c.fr === fr) return sunInfo.c;
  let th, alt, alpha;
  if (h >= 5.5 && h <= 19.5) { const pr = Math.min(1, Math.max(0, (h - 6) / 13)); th = Math.PI * pr; alt = (10 + 52 * Math.sin(Math.PI * pr)) * Math.PI / 180; alpha = .34 * Math.min(1, Math.min(h - 5.5, 19.5 - h) / 1.5); }
  else { const pr = ((h + 4) % 24) / 9; th = Math.PI * Math.min(1, Math.max(0, pr)); alt = 40 * Math.PI / 180; alpha = .16; }
  const len = Math.min(3.2, Math.max(.45, 1 / Math.tan(alt)));
  return sunInfo.c = { fr, vx: -Math.cos(th), vy: -Math.sin(th), len, alpha };
}
function sunShadow(X, Y, w, hgt) {
  const sv = sunInfo(), L = hgt * sv.len, tx = X + sv.vx * L, ty = Y + sv.vy * L * .55, nx = -sv.vy, ny = sv.vx;
  ctx.fillStyle = 'rgba(2,6,24,' + sv.alpha + ')';
  ctx.beginPath(); ctx.ellipse(X, Y, w, w * .34, 0, 0, 7); ctx.fill();
  ctx.beginPath(); ctx.moveTo(X + nx * w * .7, Y + ny * w * .25); ctx.lineTo(tx + nx * w * .4, ty + ny * w * .15); ctx.lineTo(tx - nx * w * .4, ty - ny * w * .15); ctx.lineTo(X - nx * w * .7, Y - ny * w * .25); ctx.closePath(); ctx.fill();
  ctx.beginPath(); ctx.ellipse(tx, ty, w * .45, w * .2, 0, 0, 7); ctx.fill();
}
const AMB = [[0, 6, 12, 40, .42], [5, 8, 14, 44, .38], [6.5, 255, 160, 90, .16], [8, 255, 230, 200, 0], [16, 255, 230, 200, 0], [18, 255, 150, 70, .14], [19.5, 170, 70, 90, .22], [21, 6, 12, 40, .38], [24, 6, 12, 40, .42]];
function drawAmbient() {
  const h = clock.h; let i = 0; while (i < AMB.length - 2 && h > AMB[i + 1][0]) i++; const a = AMB[i], b = AMB[i + 1], k = Math.min(1, Math.max(0, (h - a[0]) / (b[0] - a[0])));
  const c = [1, 2, 3, 4].map(j => a[j] + (b[j] - a[j]) * k); if (c[3] <= .004) return;
  ctx.fillStyle = `rgba(${c[0] | 0},${c[1] | 0},${c[2] | 0},${c[3].toFixed(3)})`; ctx.fillRect(0, 0, W, H);
}
const phaseName = () => { const h = clock.h; return h < 5 || h >= 20.5 ? '夜' : h < 7.5 ? '朝焼け' : h < 10 ? '朝' : h < 16.5 ? '昼' : h < 19.5 ? '夕方' : '宵'; };
function drawRoadTile(x, y, S) {
  const B = BIOME[S.biome], X = Math.floor(sx(x * T)), Y = Math.floor(sy(y * T)), s = Math.ceil(T * cam.z) + 1, h = hashT(x, y), z = cam.z;
  ctx.fillStyle = B.path; ctx.fillRect(X, Y, s, s);
  ctx.fillStyle = B.pathE; ctx.globalAlpha = .35; for (let i = 0; i < 4; i++) ctx.fillRect(X + ((h >> (i * 3)) & 15) * 1.8 * z, Y + ((h >> (i * 3 + 2)) & 15) * 1.8 * z, 3 * z, 1.5 * z); ctx.globalAlpha = 1;
  if (B.plank) { ctx.fillStyle = 'rgba(0,0,0,.28)'; for (let i = 0; i < 4; i++) ctx.fillRect(X, Y + i * 8 * z, s, Math.max(1, z * .8)); ctx.fillStyle = 'rgba(255,255,255,.08)'; ctx.fillRect(X, Y, s, 2 * z); }
  const R = (a, b) => tiles[b * MW + a] === 2, up = R(x, y - 1), dn = R(x, y + 1), lf = R(x - 1, y), rt = R(x + 1, y);
  ctx.fillStyle = B.pathE; const e = 3 * z; if (!up) ctx.fillRect(X, Y, s, e); if (!dn) ctx.fillRect(X, Y + s - e, s, e); if (!lf) ctx.fillRect(X, Y, e, s); if (!rt) ctx.fillRect(X + s - e, Y, e, s);
  if (!B.plank) { ctx.fillStyle = 'rgba(0,0,0,.08)'; if (y === roadH) ctx.fillRect(X, Y + s * .35, s, 2 * z), ctx.fillRect(X, Y + s * .65, s, 2 * z); if (x === roadV) ctx.fillRect(X + s * .35, Y, 2 * z, s), ctx.fillRect(X + s * .65, Y, 2 * z, s); }
}
// 画像の置物を、足元(X,Y)にそろえて、高さ s*hm で描く。画像が無ければ false(従来のコード描画へ)
function propAt(id, X, Y, s, hm, v, filt) {
  const im = SPR.prop && SPR.prop[id]; if (!im) return false; const h = s * hm, w = im.width * h / im.height;
  ctx.save(); if (filt) ctx.filter = filt; if (v & 1) { ctx.translate(X, 0); ctx.scale(-1, 1); ctx.translate(-X, 0); } ctx.drawImage(im, X - w / 2, Y - h, w, h); ctx.restore(); return true;
}
function drawBarrier(x, y) {
  if (SPR.prop && SPR.prop.fence) { const Xb = sx((x + .5) * T), Yb = sy((y + .5) * T); shadow((x + .5) * T, (y + .5) * T, 8); propAt('fence', Xb, Yb + 9 * cam.z, T * cam.z, 1.0, 0); return; }
  const S = STAGES[stageNo - 1], X = sx((x + .5) * T), Y = sy((y + .5) * T), z = cam.z / 1.4; shadow((x + .5) * T, (y + .5) * T, 8);
  // 木の柵
  ctx.fillStyle = '#6b4a2a'; ctx.fillRect(X - 14 * z, Y - 10 * z, 28 * z, 3 * z); ctx.fillRect(X - 14 * z, Y - 2 * z, 28 * z, 3 * z); ctx.fillStyle = '#8a6238'; ctx.fillRect(X - 2.5 * z, Y - 16 * z, 5 * z, 22 * z); ctx.fillStyle = '#a9824f'; ctx.fillRect(X - 2.5 * z, Y - 16 * z, 5 * z, 2 * z);
}
function tuftAt(g, X, Y, z, col) { g.fillStyle = col; g.fillRect(X - 3 * z, Y - 4 * z, z, 4 * z); g.fillRect(X, Y - 6 * z, z, 6 * z); g.fillRect(X + 3 * z, Y - 3 * z, z, 3 * z); }
function drawTree(X, Y, s, z, v, snow) {
  if (SPR.prop && SPR.prop.tree) { sunShadow(X, Y, s * .5, s * 1.7); propAt(snow ? 'snowpine' : 'tree', X, Y, s, 1.9, v); return; }
  // 幹と、重なった丸い葉(濃→淡)。X,Yは足元の中心
  sunShadow(X, Y, s * .5, s * 1.7);
  ctx.fillStyle = '#5a3d22'; ctx.fillRect(X - s * .09, Y - s * .62, s * .18, s * .62); ctx.fillStyle = '#7a5532'; ctx.fillRect(X - s * .09, Y - s * .62, s * .06, s * .62);
  const cols = [['#1f5a2a', '#2f7a38', '#4fa04a'], ['#2a6a34', '#3a8a44', '#62b05a'], ['#1c4f30', '#2c6e44', '#4c9a60']][v % 3], cy = Y - s * 1.05;
  ctx.fillStyle = cols[0]; ctx.beginPath(); ctx.arc(X, cy, s * .62, 0, 7); ctx.fill(); ctx.fillStyle = cols[1]; ctx.beginPath(); ctx.arc(X - s * .12, cy - s * .12, s * .5, 0, 7); ctx.fill(); ctx.fillStyle = cols[2]; ctx.beginPath(); ctx.arc(X - s * .22, cy - s * .24, s * .26, 0, 7); ctx.fill();
  if (snow) { ctx.fillStyle = '#f1f5f9'; ctx.beginPath(); ctx.arc(X, cy - s * .38, s * .36, Math.PI * 1.05, Math.PI * 1.95); ctx.fill(); }
}
function drawPine(X, Y, s, z, v, snow) {
  if (SPR.prop && SPR.prop.pine) { sunShadow(X, Y, s * .45, s * 1.8); propAt(snow ? 'snowpine' : 'pine', X, Y, s, 1.9, v); return; }
  sunShadow(X, Y, s * .42, s * 1.8);
  ctx.fillStyle = '#4a3320'; ctx.fillRect(X - s * .07, Y - s * .4, s * .14, s * .4);
  const g = ['#1c4a34', '#24603f', '#2f7a4e'], layers = [[.52, .45, 0], [.42, .85, 1], [.3, 1.2, 2]];
  for (const [w, yy, k] of layers) { ctx.fillStyle = g[(k + v) % 3 === 0 ? 0 : k]; ctx.beginPath(); ctx.moveTo(X - s * w, Y - s * (yy - .22)); ctx.lineTo(X, Y - s * (yy + .5)); ctx.lineTo(X + s * w, Y - s * (yy - .22)); ctx.closePath(); ctx.fill(); if (snow) { ctx.fillStyle = '#f8fafc'; ctx.beginPath(); ctx.moveTo(X - s * w * .62, Y - s * (yy + .02)); ctx.lineTo(X, Y - s * (yy + .5)); ctx.lineTo(X + s * w * .62, Y - s * (yy + .02)); ctx.closePath(); ctx.fill(); } }
}
function drawBoulder(X, Y, s, z, v, snow, tint) {
  if (SPR.prop && SPR.prop.rock) { sunShadow(X, Y, s * .45, s * .9); propAt('rock', X, Y, s, .95, v, snow ? 'brightness(1.5) saturate(.4)' : tint ? 'sepia(.5) saturate(1.2) brightness(1.1)' : null); return; }
  sunShadow(X, Y, s * .52, s * 0.9);
  const c = tint || ['#7b7d84', '#8a8c92', '#6c6e75'][v % 3]; ctx.fillStyle = c; ctx.beginPath(); ctx.moveTo(X - s * .48, Y); ctx.quadraticCurveTo(X - s * .56, Y - s * .55, X - s * .18, Y - s * .8); ctx.quadraticCurveTo(X + s * .15, Y - s * .95, X + s * .42, Y - s * .55); ctx.quadraticCurveTo(X + s * .6, Y - s * .12, X + s * .45, Y); ctx.closePath(); ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,.18)'; ctx.beginPath(); ctx.moveTo(X - s * .3, Y - s * .6); ctx.quadraticCurveTo(X - s * .05, Y - s * .86, X + s * .2, Y - s * .7); ctx.quadraticCurveTo(X, Y - s * .55, X - s * .3, Y - s * .6); ctx.fill();
  ctx.fillStyle = 'rgba(0,0,0,.2)'; ctx.fillRect(X - s * .46, Y - s * .12, s * .92, s * .12);
  if (snow) { ctx.fillStyle = '#f1f5f9'; ctx.beginPath(); ctx.moveTo(X - s * .3, Y - s * .62); ctx.quadraticCurveTo(X, Y - s * .98, X + s * .38, Y - s * .55); ctx.quadraticCurveTo(X + s * .1, Y - s * .6, X - s * .3, Y - s * .62); ctx.fill(); }
}
function drawSandRock(X, Y, s, z, v) {
  if (SPR.prop && SPR.prop.rock) { sunShadow(X, Y, s * .45, s * .9); propAt('rock', X, Y, s, .95, v, 'sepia(.85) saturate(1.8) brightness(1.15) hue-rotate(-8deg)'); return; }
  sunShadow(X, Y, s * .52, s * 1.0);
  const hgt = s * (.75 + (v % 3) * .12); ctx.fillStyle = '#9a6a34'; ctx.fillRect(X - s * .46, Y - hgt, s * .92, hgt); ctx.fillStyle = '#c18a47'; ctx.fillRect(X - s * .46, Y - hgt, s * .92, hgt * .3); ctx.fillStyle = '#7e5528'; for (let i = 1; i < 4; i++) ctx.fillRect(X - s * .46, Y - hgt + hgt * (.3 + i * .17), s * .92, Math.max(1, z * .8)); ctx.fillStyle = 'rgba(255,255,255,.16)'; ctx.fillRect(X - s * .46, Y - hgt, s * .92, Math.max(1, z));
}
function drawIceBlock(X, Y, s, z, v) {
  if (SPR.prop && SPR.prop.icecrystal) { sunShadow(X, Y, s * .45, s * 1.0); propAt('icecrystal', X, Y, s, 1.15, v); return; }
  sunShadow(X, Y, s * .5, s * 1.1);
  const hgt = s * (.85 + (v % 3) * .12); ctx.fillStyle = '#6fb8d8'; ctx.beginPath(); ctx.moveTo(X - s * .42, Y); ctx.lineTo(X - s * .36, Y - hgt * .7); ctx.lineTo(X - s * .08, Y - hgt); ctx.lineTo(X + s * .3, Y - hgt * .8); ctx.lineTo(X + s * .44, Y); ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#b6e3f4'; ctx.beginPath(); ctx.moveTo(X - s * .36, Y - hgt * .7); ctx.lineTo(X - s * .08, Y - hgt); ctx.lineTo(X + s * .1, Y - hgt * .55); ctx.lineTo(X - s * .15, Y - hgt * .4); ctx.closePath(); ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,.7)'; ctx.fillRect(X - s * .3, Y - hgt * .5, Math.max(1, z), hgt * .35); ctx.fillStyle = 'rgba(30,80,130,.35)'; ctx.fillRect(X + s * .14, Y - hgt * .6, s * .3, hgt * .6);
}
function drawPalm(X, Y, s, z, v) {
  if (SPR.prop && SPR.prop.palm) { sunShadow(X, Y, s * .4, s * 1.6); propAt('palm', X, Y, s, 1.9, v); return; }
  sunShadow(X, Y, s * .45, s * 1.6);
  ctx.strokeStyle = '#8a6238'; ctx.lineWidth = Math.max(2, s * .12); ctx.beginPath(); ctx.moveTo(X, Y); ctx.quadraticCurveTo(X + s * .15 * (v % 2 ? 1 : -1), Y - s * .7, X, Y - s * 1.25); ctx.stroke();
  ctx.fillStyle = '#2f9a4a'; for (let i = 0; i < 6; i++) { const a = i / 6 * Math.PI * 2 + v; ctx.beginPath(); ctx.ellipse(X + Math.cos(a) * s * .32, Y - s * 1.28 + Math.sin(a) * s * .12, s * .34, s * .08, a * .5, 0, 7); ctx.fill(); } ctx.fillStyle = '#3d2a14'; ctx.beginPath(); ctx.arc(X, Y - s * 1.2, s * .07, 0, 7); ctx.fill();
}
function drawCactus(X, Y, s, z, v) {
  if (SPR.prop && SPR.prop.cactus) { sunShadow(X, Y, s * .35, s * 1.0); propAt('cactus', X, Y, s, 1.3, v); return; }
  sunShadow(X, Y, s * .35, s * 1.0);
  ctx.fillStyle = '#3d8a46'; ctx.fillRect(X - s * .1, Y - s * .95, s * .2, s * .95); ctx.fillRect(X - s * .34, Y - s * .62, s * .24, s * .1); ctx.fillRect(X - s * .34, Y - s * .8, s * .1, s * .28); ctx.fillRect(X + s * .1, Y - s * .5, s * .24, s * .1); ctx.fillRect(X + s * .24, Y - s * .72, s * .1, s * .32); ctx.fillStyle = '#5db266'; ctx.fillRect(X - s * .1, Y - s * .95, s * .06, s * .95); ctx.fillStyle = '#e5e7eb'; for (let i = 0; i < 4; i++) ctx.fillRect(X - s * .06, Y - s * (.2 + i * .2), 2, 2);
}
function drawDecor(d) {
  const S = STAGES[stageNo - 1], X = sx(d.x), Y = sy(d.y) + 12 * cam.z, s = T * cam.z, z = cam.z / 1.4, v = d.v | 0, k = d.k;
  if (k === 'landmark') { ctx.save(); ctx.translate(X, Y); if (v === 1) { ctx.fillStyle = '#6b4428'; ctx.fillRect(-s * 2.8, -s * .12, s * 5.6, s * .24); ctx.fillStyle = '#c49456'; for (let i = -2; i <= 2; i++) ctx.fillRect(i * s, -s * .18, s * .85, s * .16); ctx.fillStyle = '#f8fafc'; ctx.font = 'bold ' + Math.round(9 * z) + 'px sans-serif'; ctx.textAlign = 'center'; ctx.fillText('橋', 0, -s * .5); } else { ctx.fillStyle = v === 5 ? '#9b6c35' : '#526b90'; ctx.beginPath(); ctx.arc(0, 0, s * .75, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = v === 5 ? '#fbbf24' : '#a5f3fc'; ctx.beginPath(); ctx.arc(0, -s * .35, s * .42, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = '#fff'; ctx.font = 'bold ' + Math.round(11 * z) + 'px sans-serif'; ctx.textAlign = 'center'; ctx.fillText(v === 5 ? 'オアシス' : '氷晶核', 0, -s); } ctx.restore(); return; }
  const PM = { campfire: ['campfire', .62], tent: ['tent', .85], crates: ['crates', .6], logseat: ['stump', .42], sign: ['sign', .6] };
  if (PM[k] && SPR.prop[PM[k][0]]) { if (k === 'campfire') { ctx.save(); ctx.globalCompositeOperation = 'lighter'; const g0 = ctx.createRadialGradient(X, Y - 6 * z, 0, X, Y - 2 * z, 90 * z); g0.addColorStop(0, 'rgba(251,146,60,.30)'); g0.addColorStop(1, 'rgba(251,146,60,0)'); ctx.fillStyle = g0; ctx.beginPath(); ctx.ellipse(X, Y - 2 * z, 90 * z, 60 * z, 0, 0, 7); ctx.fill(); ctx.restore(); } sunShadow(X, Y, s * .35, s * .6); dprop(PM[k][0], d.x, d.y + 6, PM[k][1]); return; }
  if (k === 'tree') drawTree(X, Y, s, z, v, false);
  else if (k === 'snowtree') drawTree(X, Y, s, z, v, true);
  else if (k === 'pine') drawPine(X, Y, s, z, v, false);
  else if (k === 'snowpine') drawPine(X, Y, s, z, v, true);
  else if (k === 'boulder') drawBoulder(X, Y, s, z, v, false);
  else if (k === 'snowrock') drawBoulder(X, Y, s, z, v, true);
  else if (k === 'sandrock') drawSandRock(X, Y, s, z, v);
  else if (k === 'ice') drawIceBlock(X, Y, s, z, v);
  else if (k === 'palm') drawPalm(X, Y, s, z, v);
  else if (k === 'cactus') drawCactus(X, Y, s, z, v);
  else if (k === 'bush' && SPR.prop && SPR.prop.flowerbush) { sunShadow(X, Y, s * .4, s * .5); propAt('flowerbush', X, Y, s, .8, v); }
  else if (k === 'mushroom' && SPR.prop && SPR.prop.mushroom) { propAt('mushroom', X, Y, s, .5, v); }
  else if (k === 'bush') { sunShadow(X, Y, s * .4, s * 0.5); ctx.fillStyle = '#2d7a3a'; ctx.beginPath(); ctx.arc(X - s * .15, Y - s * .22, s * .22, 0, 7); ctx.arc(X + s * .14, Y - s * .2, s * .24, 0, 7); ctx.arc(X, Y - s * .34, s * .22, 0, 7); ctx.fill(); ctx.fillStyle = '#4fa04a'; ctx.beginPath(); ctx.arc(X - s * .08, Y - s * .38, s * .1, 0, 7); ctx.fill(); if (v % 2) { ctx.fillStyle = '#f9a8d4'; ctx.fillRect(X + s * .1, Y - s * .3, 3 * z, 3 * z); } }
  else if (k === 'flower') { const c = ['#fde68a', '#f9a8d4', '#ffffff', '#c4b5fd', '#fb923c'][v % 5]; ctx.fillStyle = '#3f7a30'; ctx.fillRect(X, Y - 6 * z, z, 6 * z); ctx.fillRect(X - 3 * z, Y - 3 * z, 3 * z, z); ctx.fillStyle = c; ctx.fillRect(X - 2 * z, Y - 9 * z, 5 * z, 3 * z); ctx.fillRect(X - z, Y - 10 * z, 3 * z, 5 * z); ctx.fillStyle = '#facc15'; ctx.fillRect(X, Y - 8 * z, z, z); }
  else if (k === 'tuft') tuftAt(ctx, X, Y, z, S.biome === 'snow' || S.biome === 'glacier' || S.biome === 'summit' ? '#e2e8f0' : (S.biome === 'desert' ? '#a38a3c' : '#4fa04a'));
  else if (k === 'mushroom') { ctx.fillStyle = '#f1e8d8'; ctx.fillRect(X - z, Y - 4 * z, 3 * z, 4 * z); ctx.fillStyle = v % 2 ? '#dc2626' : '#c2410c'; ctx.beginPath(); ctx.ellipse(X, Y - 5 * z, 5 * z, 3.5 * z, 0, Math.PI, 0); ctx.fill(); ctx.fillStyle = '#fff'; ctx.fillRect(X - 2 * z, Y - 7 * z, z, z); ctx.fillRect(X + z, Y - 6 * z, z, z); }
  else if (k === 'shell') { ctx.fillStyle = ['#fda4af', '#fde68a', '#e5e7eb'][v % 3]; ctx.beginPath(); ctx.ellipse(X, Y - 2 * z, 4 * z, 3 * z, 0, 0, 7); ctx.fill(); ctx.strokeStyle = 'rgba(0,0,0,.2)'; ctx.lineWidth = Math.max(1, z * .6); ctx.beginPath(); ctx.moveTo(X, Y - 5 * z); ctx.lineTo(X, Y + z); ctx.stroke(); }
  else if (k === 'pebble') { ctx.fillStyle = 'rgba(0,0,0,.2)'; ctx.fillRect(X - 3 * z, Y - z, 8 * z, 2 * z); ctx.fillStyle = '#8f9097'; ctx.fillRect(X - 3 * z, Y - 4 * z, 6 * z, 4 * z); ctx.fillStyle = '#b7b9c0'; ctx.fillRect(X - 3 * z, Y - 4 * z, 6 * z, z); }
  else if (k === 'log') { sunShadow(X, Y, s * .48, s * 0.3); ctx.fillStyle = '#6b4a2a'; ctx.fillRect(X - s * .46, Y - s * .26, s * .92, s * .26); ctx.fillStyle = '#8a6238'; ctx.fillRect(X - s * .46, Y - s * .26, s * .92, s * .08); ctx.fillStyle = '#d6b27a'; ctx.beginPath(); ctx.ellipse(X + s * .46, Y - s * .13, s * .05, s * .13, 0, 0, 7); ctx.fill(); }
  else if (k === 'boat') { sunShadow(X, Y, s * .6, s * 1.0); ctx.fillStyle = '#7a4f2a'; ctx.beginPath(); ctx.moveTo(X - s * .6, Y - s * .32); ctx.lineTo(X + s * .6, Y - s * .32); ctx.lineTo(X + s * .42, Y); ctx.lineTo(X - s * .42, Y); ctx.closePath(); ctx.fill(); ctx.fillStyle = '#a9824f'; ctx.fillRect(X - s * .6, Y - s * .36, s * 1.2, s * .06); ctx.fillStyle = '#e5e7eb'; ctx.fillRect(X - s * .02, Y - s * .9, s * .04, s * .56); ctx.fillStyle = '#f1f5f9'; ctx.beginPath(); ctx.moveTo(X + s * .04, Y - s * .86); ctx.lineTo(X + s * .4, Y - s * .42); ctx.lineTo(X + s * .04, Y - s * .42); ctx.fill(); }
  else if (k === 'campfire') {
    ctx.fillStyle = 'rgba(0,0,0,.25)'; ctx.beginPath(); ctx.ellipse(X, Y, s * .4, s * .14, 0, 0, 7); ctx.fill(); ctx.fillStyle = '#6b6b70'; for (let i = 0; i < 7; i++) { const a = i / 7 * 6.28; ctx.beginPath(); ctx.arc(X + Math.cos(a) * 9 * z, Y - 3 * z + Math.sin(a) * 4 * z, 2.6 * z, 0, 7); ctx.fill(); }
    ctx.fillStyle = '#5a3d22'; ctx.fillRect(X - 7 * z, Y - 4 * z, 14 * z, 3 * z); const f = .8 + .2 * Math.sin(t * 11 + d.x); ctx.fillStyle = '#f97316'; ctx.beginPath(); ctx.ellipse(X, Y - 9 * z, 5 * z * f, 9 * z * f, 0, 0, 7); ctx.fill(); ctx.fillStyle = '#fde047'; ctx.beginPath(); ctx.ellipse(X, Y - 8 * z, 2.6 * z, 5 * z * f, 0, 0, 7); ctx.fill();
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; const g = ctx.createRadialGradient(X, Y - 6 * z, 0, X, Y - 2 * z, 90 * z); g.addColorStop(0, 'rgba(251,146,60,.30)'); g.addColorStop(1, 'rgba(251,146,60,0)'); ctx.fillStyle = g; ctx.beginPath(); ctx.ellipse(X, Y - 2 * z, 90 * z, 60 * z, 0, 0, 7); ctx.fill(); ctx.restore();
  } else if (k === 'tent') {
    ctx.fillStyle = 'rgba(0,0,0,.28)'; ctx.beginPath(); ctx.ellipse(X, Y, s * .55, s * .17, 0, 0, 7); ctx.fill(); const c1 = ['#c2410c', '#1d6b4a', '#3b6fb3'][v % 3], c2 = ['#9a3412', '#14532d', '#27528a'][v % 3];
    ctx.fillStyle = c1; ctx.beginPath(); ctx.moveTo(X - s * .52, Y); ctx.lineTo(X, Y - s * .95); ctx.lineTo(X + s * .52, Y); ctx.closePath(); ctx.fill(); ctx.fillStyle = c2; ctx.beginPath(); ctx.moveTo(X, Y - s * .95); ctx.lineTo(X + s * .52, Y); ctx.lineTo(X + s * .12, Y); ctx.closePath(); ctx.fill(); ctx.fillStyle = '#1f2937'; ctx.beginPath(); ctx.moveTo(X - s * .1, Y); ctx.lineTo(X, Y - s * .42); ctx.lineTo(X + s * .1, Y); ctx.closePath(); ctx.fill(); ctx.fillStyle = '#5a3d22'; ctx.fillRect(X - 1, Y - s * 1.05, 2, s * .12);
  } else if (k === 'crates') {
    ctx.fillStyle = 'rgba(0,0,0,.28)'; ctx.beginPath(); ctx.ellipse(X, Y, s * .5, s * .16, 0, 0, 7); ctx.fill(); const bx0 = (ox, oy, w, h) => { ctx.fillStyle = '#9a6a35'; ctx.fillRect(X + ox, Y + oy, w, h); ctx.fillStyle = '#6b4a22'; ctx.fillRect(X + ox, Y + oy, w, 2 * z); ctx.fillRect(X + ox, Y + oy + h - 2 * z, w, 2 * z); ctx.fillRect(X + ox + w / 2 - z, Y + oy, 2 * z, h); };
    bx0(-s * .42, -s * .34, s * .46, s * .34); bx0(s * .02, -s * .3, s * .42, s * .3); bx0(-s * .2, -s * .66, s * .44, s * .32);
  } else if (k === 'logseat') { ctx.fillStyle = 'rgba(0,0,0,.25)'; ctx.beginPath(); ctx.ellipse(X, Y, s * .26, s * .09, 0, 0, 7); ctx.fill(); ctx.fillStyle = '#7a5532'; ctx.fillRect(X - s * .22, Y - s * .2, s * .44, s * .2); ctx.fillStyle = '#d6b27a'; ctx.beginPath(); ctx.ellipse(X, Y - s * .2, s * .22, s * .07, 0, 0, 7); ctx.fill(); }
  else if (k === 'torch') {
    ctx.fillStyle = '#5a3d22'; ctx.fillRect(X - 1.5 * z, Y - 24 * z, 3 * z, 26 * z); const f = .75 + .25 * Math.sin(t * 9 + d.x); ctx.fillStyle = '#f59e0b'; ctx.beginPath(); ctx.ellipse(X, Y - 28 * z, 4 * z * f, 7 * z * f, 0, 0, 7); ctx.fill(); ctx.fillStyle = '#fde68a'; ctx.beginPath(); ctx.ellipse(X, Y - 27 * z, 2 * z, 4 * z, 0, 0, 7); ctx.fill();
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; const g = ctx.createRadialGradient(X, Y - 26 * z, 0, X, Y - 4 * z, 70 * z); g.addColorStop(0, 'rgba(251,191,36,.28)'); g.addColorStop(1, 'rgba(251,191,36,0)'); ctx.fillStyle = g; ctx.beginPath(); ctx.ellipse(X, Y - 4 * z, 70 * z, 46 * z, 0, 0, 7); ctx.fill(); ctx.restore();
  } else if (k === 'sign') { ctx.fillStyle = '#5a3d22'; ctx.fillRect(X - 1.5 * z, Y - 18 * z, 3 * z, 20 * z); ctx.fillStyle = '#a9824f'; ctx.fillRect(X - 14 * z, Y - 30 * z, 28 * z, 12 * z); ctx.strokeStyle = '#5a3d22'; ctx.lineWidth = Math.max(1, z * .8); ctx.strokeRect(X - 14 * z, Y - 30 * z, 28 * z, 12 * z); ctx.fillStyle = '#3b2a14'; ctx.font = 'bold ' + Math.round(8 * z) + 'px sans-serif'; ctx.textAlign = 'center'; ctx.fillText(SIGNS[d.t % SIGNS.length], X, Y - 21 * z); }
}
const SIGNS = ['巣穴→', '←川', '危険', 'エサ場', '見張り', '←泉', '近道', '縄張り'];

function drawWall(tx, ty, S) {
  const s = Math.ceil(T * cam.z) + 1, X = Math.floor(sx(tx * T)), Y = Math.floor(sy(ty * T)), z = cam.z / 1.4, h = hashT(tx, ty), v = h % 3, cx = X + s / 2, by = Y + s - s * .04, st = S.wallStyle;
  if (st === 'tree') drawTree(cx, by, s, z, h % 5, false);
  else if (st === 'pine') drawPine(cx, by, s, z, h % 5, false);
  else if (st === 'snowpine') drawPine(cx, by, s, z, h % 5, true);
  else if (st === 'sand') drawSandRock(cx, by, s, z, h % 5);
  else if (st === 'ice') drawIceBlock(cx, by, s, z, h % 5);
  else drawBoulder(cx, by, s, z, h % 5, false, (S.biome === 'beach' || S.biome === 'cove') ? ['#8b8478', '#9a9286', '#7a7468'][v] : null);
}
function shadow(x, y, r, fo) { const X = sx(x), Y = sy(y) + (fo == null ? 9 : fo) * cam.z; if (r >= 9) sunShadow(X, Y, r * .55 * cam.z, r * 3.2 * cam.z); ctx.fillStyle = 'rgba(0,0,0,.28)'; ctx.beginPath(); ctx.ellipse(X, Y, r * cam.z * .8, r * .36 * cam.z, 0, 0, 7); ctx.fill(); }
// 武器ごとの構え絵(chars.js に akira_smg などで入れる)。pistol はアキラ本体の絵が構え絵
const stanceSet = wid => (wid === 'pistol' && charId === 'akira' ? (SPR.char.akira && SPR.char.akira.side && SPR.char.akira.side[0].height >= 53 ? SPR.char.akira : null) : SPR.char[charId + '_' + wid] || null);
function drawPlayer() {
  shadow(P.x, P.y, 12, 19); const fr = (Math.sin(P.anim) > 0 && (P.vx || P.vy)) ? 1 : 0;
  const bob = (P.vx || P.vy) ? Math.abs(Math.sin(P.anim)) * 1.5 : 0;
  if (P.hurt > 0 && (P.hurt * 40 | 0) % 2) ctx.globalAlpha = .5;
  const gunBack = Math.sin(P.aimA) < -0.3; const drawGun = () => {
    const w = curW(), aa0 = P.aimA, X = sx(P.x) + Math.cos(aa0) * 4 * cam.z - Math.sin(aa0) * 3 * cam.z, Y = sy(P.y) - 6 * cam.z + Math.sin(aa0) * 3 * cam.z + Math.cos(aa0) * 3 * cam.z, L = (w.id === 'sniper' ? 24 : w.id === 'pistol' ? 12 : 18) * cam.z / 1.2;
    ctx.save(); ctx.translate(X, Y); ctx.rotate(P.aimA);
    const gs = SPR.gun[w.id]; let mz = L; const own = !!stanceSet(w.id);
    if (own) mz = ({ pistol: 17, smg: 20, shotgun: 25, rifle: 25, sniper: 31 }[w.id] || 18) * cam.z; else if (gs) { const gw = gs.img.width * gs.k * cam.z * .82, gh = gs.img.height * gs.k * cam.z * .82; if (Math.cos(P.aimA) < 0) ctx.scale(1, -1); ctx.shadowColor = 'rgba(255,255,255,.9)'; ctx.shadowBlur = 1.5 * cam.z; ctx.drawImage(gs.img, -gw * .22, -gh * .42, gw, gh); ctx.shadowBlur = 0; mz = gw * .78; }
    else { ctx.fillStyle = '#0f172a'; ctx.fillRect(2 * cam.z, -1.8 * cam.z, L, 3.6 * cam.z); ctx.fillStyle = '#64748b'; ctx.fillRect(2 * cam.z, -1.8 * cam.z, L, 1.4 * cam.z); }
    if (P.flash > 0) {
      const fi = SPR.fx[P.flash > .04 ? 'muz1' : P.flash > .02 ? 'muz2' : 'muz3'];
      if (fi) { const k = (w.id === 'shotgun' || w.id === 'sniper' ? .5 : .36) * cam.z; ctx.drawImage(fi, mz - 2 * cam.z, -fi.height * k / 2, fi.width * k, fi.height * k); }
      else { ctx.fillStyle = '#fde047'; ctx.beginPath(); ctx.arc(mz + 4 * cam.z, 0, 5 * cam.z, 0, 7); ctx.fill(); }
    } ctx.restore();
    // 腕: 肩から銃のグリップ(後ろの手)と銃身(前の手)へ。腕を下ろしたままの絵に、構えを描き足す
    if (!own) { const ca = Math.cos(aa0), sa = Math.sin(aa0), c = cam.z, hand = (lx, ly) => [X + lx * ca - ly * sa, Y + lx * sa + ly * ca], gl = (gs ? gs.img.width * gs.k * c * .82 : L), h1 = hand(2 * c, 1.2 * c), h2 = hand(Math.max(gl * .5, 8 * c), 0.4 * c), shy = sy(P.y) - 9 * c, shx = sx(P.x), s1 = [shx - sa * 3.2 * c, shy + ca * 1.5 * c], s2 = [shx + sa * 3.2 * c, shy - ca * 1.5 * c];
      const limb = (s, h, col) => { ctx.strokeStyle = col; ctx.lineWidth = 3.4 * c; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(s[0], s[1]); ctx.lineTo(h[0], h[1]); ctx.stroke(); ctx.fillStyle = '#e8b894'; ctx.beginPath(); ctx.arc(h[0], h[1], 1.9 * c, 0, 7); ctx.fill(); };
      limb(s2, h2, '#4a6fa5'); limb(s1, h1, '#5a82b8'); ctx.lineCap = 'butt'; }
  };
  const moving = !!(P.vx || P.vy), wi = moving ? Math.floor(P.anim / 1.6) % 4 : 1;
  if (gunBack) drawGun();
  const cs = stanceSet(curW().id) || SPR.char[charId] || SPR.char.akira;
  if (cs) {
    // 8方向: 0=E 1=SE 2=S 3=SW 4=W 5=NW 6=N 7=NE(右向きの絵を左右反転して使う)
    const ang = P.aimA, sec = ((Math.round(ang / (Math.PI / 4)) % 8) + 8) % 8, M = [['side', 0], ['fd', 0], ['front', 0], ['fd', 1], ['side', 1], ['bd', 1], ['back', 0], ['bd', 0]][sec];
    let dir = M[0], set = cs[dir]; if (!set) { dir = (sec === 1 || sec === 2 || sec === 3) ? 'front' : (sec === 5 || sec === 6 || sec === 7) ? 'back' : 'side'; set = cs[dir] || cs.front; }
    const ix = moving ? [1, 0, 2, 0][Math.floor(P.anim / 1.6) % 4] : 0;
    spr(set[ix] || set[0], P.x, P.y, !!M[1] && dir !== 'front' && dir !== 'back', moving ? Math.abs(Math.sin(P.anim)) * 1.2 : 0, .8);
  } else if (SPR.walk) spr(SPR.walk[wi], P.x, P.y, Math.cos(P.aimA) < 0, moving ? Math.abs(Math.sin(P.anim)) * 1.2 : 0, .8); else spr(SPR['p' + fr], P.x, P.y, Math.cos(P.aimA) < 0, bob);
  if (!gunBack) drawGun();
  if (P.od > 0) { ctx.strokeStyle = '#f43f5e'; ctx.beginPath(); ctx.arc(sx(P.x), sy(P.y), 14 * cam.z, 0, 7); ctx.stroke(); }
  ctx.globalAlpha = 1;
}
function enemyImg(e, es) {
  e.flipv = false; if (es.frames) return es.frames[beastDir(e)]; if (!es.views) return es.img;
  const fa = e.fa != null ? e.fa : Math.atan2(P.y - e.y, P.x - e.x), sn = Math.sin(fa);
  if (sn > .55) return es.views.front; if (sn < -.55) return es.views.back; e.flipv = Math.cos(fa) < 0; return es.views.side;
}
function drawEnemy(e) {
  const d = EN[e.type]; { const es0 = SPR.en[e.type]; shadow(e.x, e.y, e.r, es0 ? es0.img.height * es0.k * (e.elite ? 1.25 : 1) / 2 - 1 : 9); } const fr = (Math.sin(e.anim) > 0) ? 1 : 0; const img = SPR[d.spr + (d.boss ? '' : fr)];
  const es = SPR.en[e.type];
  if (es && e.elite) { ctx.strokeStyle = '#fbbf24'; ctx.lineWidth = 2; ctx.globalAlpha = .6 + Math.sin(t * 6) * .3; ctx.beginPath(); ctx.ellipse(sx(e.x), sy(e.y) + 8 * cam.z, 22 * cam.z, 10 * cam.z, 0, 0, 7); ctx.stroke(); ctx.globalAlpha = 1; ctx.fillStyle = '#fbbf24'; ctx.font = 'bold 11px sans-serif'; ctx.textAlign = 'center'; ctx.fillText('★' + e.elite, sx(e.x), sy(e.y) - (e.r + 30) * cam.z / 1.1); }
  if (es) { const lift = e.type === 'drone' ? 4 + Math.sin(e.anim * .6) * 2 : 0; spr(enemyImg(e, es), e.x, e.y - lift, es.sym ? !!e.flipv : e.face !== es.face, (e.type === 'drone' || d.boss) ? 0 : Math.abs(Math.sin(e.anim)) * 1.2, es.k * (e.elite ? 1.25 : 1)); }
  else if (!img) { ctx.fillStyle = '#38bdf8'; ctx.beginPath(); ctx.arc(sx(e.x), sy(e.y), e.r * cam.z, 0, 7); ctx.fill(); }
  else if (d.spr === 'dr') { spr(img, e.x, e.y - 6 + Math.sin(e.anim * .6) * 2, e.face < 0); } else spr(img, e.x, e.y + (d.boss ? 18 : 0), e.face < 0, d.boss ? 0 : Math.abs(Math.sin(e.anim)) * 1.2);
  if (e.flash > 0) { ctx.globalAlpha = .6; ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(sx(e.x), sy(e.y), e.r * cam.z, 0, 7); ctx.fill(); ctx.globalAlpha = 1; }
  if (e.alert && (e.hp < e.max || e.elite)) { const w = Math.max(24, e.r * 2) * cam.z, X = sx(e.x) - w / 2, Y = sy(e.y) - (e.r + 22) * cam.z / (d.boss ? 1 : 1.1); ctx.fillStyle = '#000a'; ctx.fillRect(X, Y, w, 4); ctx.fillStyle = d.boss ? '#f43f5e' : '#f87171'; ctx.fillRect(X, Y, w * clamp(e.hp / e.max, 0, 1), 4); }
}
function drawBox(bx) {
  const X = sx(bx.x), Y = sy(bx.y) + 6 * cam.z, z = cam.z / 1.4, has = bx.contents && bx.contents.length, op = bx.open;
  shadow(bx.x, bx.y, bx.kind === 'bag' ? 10 : 13, 6);
  if (SPR.prop.chest) { const id = bx.kind === 'bag' ? 'bag' : (op && has) ? 'chestopen' : 'chest'; if (bx.kind === 'bag') groundGlow(bx.x, bx.y - 2, '#fbbf24', 10); else if (!op && bx.rich) groundGlow(bx.x, bx.y - 2, '#fde047', 11); ctx.save(); if (op && !has && bx.kind !== 'bag') ctx.globalAlpha = .55; dprop(id, bx.x, bx.y, bx.kind === 'bag' ? .5 : .55); ctx.restore(); if (op && has) { ctx.fillStyle = '#fbbf24'; ctx.font = 'bold 12px monospace'; ctx.textAlign = 'center'; ctx.fillText('●' + has, X, Y - 32 * z); } if (!op && bx.prog > 0) { ctx.strokeStyle = '#fff'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(X, Y - 32 * z, 8 * cam.z, -Math.PI / 2, -Math.PI / 2 + bx.prog / 1.2 * Math.PI * 2); ctx.stroke(); } return; }
  if (bx.kind === 'bag') {
    groundGlow(bx.x, bx.y - 2, '#fbbf24', 10);
    ctx.fillStyle = '#7a5532'; ctx.beginPath(); ctx.ellipse(X, Y - 7 * z, 9 * z, 8 * z, 0, 0, 7); ctx.fill(); ctx.fillStyle = '#9a6e42'; ctx.beginPath(); ctx.ellipse(X - 2 * z, Y - 9 * z, 5 * z, 4 * z, 0, 0, 7); ctx.fill();
    ctx.fillStyle = '#5a3d22'; ctx.fillRect(X - 3 * z, Y - 16 * z, 6 * z, 4 * z); ctx.fillStyle = '#c9a227'; ctx.fillRect(X - 4 * z, Y - 13 * z, 8 * z, 2 * z);
  } else {
    const gold = bx.rich, wood = op && !has ? '#4b3a2a' : '#8a5a2b', band = gold ? '#e7b92e' : '#6b7280', dark = op && !has ? '#3a2d20' : '#5d3b1c';
    ctx.fillStyle = wood; ctx.fillRect(X - 13 * z, Y - 12 * z, 26 * z, 12 * z); ctx.fillStyle = dark; ctx.fillRect(X - 13 * z, Y - 4 * z, 26 * z, 4 * z);
    ctx.fillStyle = band; ctx.fillRect(X - 13 * z, Y - 12 * z, 3 * z, 12 * z); ctx.fillRect(X + 10 * z, Y - 12 * z, 3 * z, 12 * z); ctx.fillRect(X - 13 * z, Y - 7 * z, 26 * z, 2 * z);
    if (!op) { ctx.fillStyle = wood; ctx.beginPath(); ctx.ellipse(X, Y - 12 * z, 13 * z, 6 * z, 0, Math.PI, 0); ctx.fill(); ctx.fillStyle = band; ctx.fillRect(X - 13 * z, Y - 13 * z, 3 * z, 2 * z); ctx.fillRect(X + 10 * z, Y - 13 * z, 3 * z, 2 * z); ctx.fillStyle = '#fde68a'; ctx.fillRect(X - 2.5 * z, Y - 10 * z, 5 * z, 5 * z); ctx.fillStyle = '#92400e'; ctx.fillRect(X - 1 * z, Y - 8.5 * z, 2 * z, 2.5 * z); }
    else { ctx.fillStyle = wood; ctx.fillRect(X - 13 * z, Y - 22 * z, 26 * z, 7 * z); ctx.fillStyle = band; ctx.fillRect(X - 13 * z, Y - 22 * z, 3 * z, 7 * z); ctx.fillRect(X + 10 * z, Y - 22 * z, 3 * z, 7 * z); if (has) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; const g = ctx.createRadialGradient(X, Y - 12 * z, 0, X, Y - 12 * z, 22 * z); g.addColorStop(0, 'rgba(253,224,71,.6)'); g.addColorStop(1, 'rgba(253,224,71,0)'); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(X, Y - 12 * z, 22 * z, 0, 7); ctx.fill(); ctx.restore(); } }
    if (!op && gold) { groundGlow(bx.x, bx.y - 2, '#fde047', 11); }
  }
  if (op && has) { ctx.fillStyle = '#fbbf24'; ctx.font = 'bold 12px monospace'; ctx.textAlign = 'center'; ctx.fillText('●' + has, X, Y - 26 * z); }
  if (!op && bx.prog > 0) { ctx.strokeStyle = '#fff'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(X, Y - 26 * z, 8 * cam.z, -Math.PI / 2, -Math.PI / 2 + bx.prog / 1.2 * Math.PI * 2); ctx.stroke(); }
}
function groundGlow(x, y, col, r) {
  const X = sx(x), Y = sy(y) + 5 * cam.z, k = cam.z / 1.4, p = .5 + .5 * Math.sin(t * 3 + x * .05);
  ctx.save(); ctx.globalCompositeOperation = 'lighter'; const g = ctx.createRadialGradient(X, Y, 0, X, Y, r * 2 * k); g.addColorStop(0, col + '66'); g.addColorStop(1, col + '00'); ctx.globalAlpha = .55 + .35 * p; ctx.fillStyle = g; ctx.beginPath(); ctx.ellipse(X, Y, r * 2 * k, r * k, 0, 0, 7); ctx.fill(); ctx.restore();
  ctx.strokeStyle = col; ctx.globalAlpha = .35 + .25 * p; ctx.lineWidth = Math.max(1, k * .8); ctx.beginPath(); ctx.ellipse(X, Y, r * 1.05 * k, r * .5 * k, 0, 0, 7); ctx.stroke(); ctx.globalAlpha = 1;
}
function drawItem(it) {
  if (it.k === 'stash') { shadow(it.x, it.y, 10); const X = sx(it.x), Y = sy(it.y) - 6 * cam.z / 1.4, z = cam.z / 1.4; ctx.fillStyle = '#7c2d12'; ctx.fillRect(X - 11 * z, Y - 7 * z, 22 * z, 15 * z); ctx.fillStyle = '#b45309'; ctx.fillRect(X - 11 * z, Y - 7 * z, 22 * z, 5 * z); ctx.fillStyle = '#fbbf24'; ctx.fillRect(X - 2 * z, Y - 3 * z, 4 * z, 5 * z); ctx.strokeStyle = '#fde68a'; ctx.lineWidth = 1.5; ctx.globalAlpha = .6 + Math.sin(t * 5) * .3; ctx.strokeRect(X - 13 * z, Y - 9 * z, 26 * z, 19 * z); ctx.globalAlpha = 1; ctx.fillStyle = '#fde68a'; ctx.font = 'bold 11px sans-serif'; ctx.textAlign = 'center'; ctx.fillText('遺失物 ' + (stash ? stash.loot : 0) + 'G', X, Y - 14 * z); return; }
  const ik = it.k === 'loot' ? (it.v >= 300 ? 'core' : it.v >= 100 ? 'crystal' : it.v >= 40 ? 'board' : 'part') : it.k, ii = SPR.item[ik];
  const gcol = { med: '#4ade80', ammo: '#fbbf24', armor: '#60a5fa', boost: '#22d3ee', od: '#f43f5e', cure: '#a78bfa', feather: '#e5e7eb', bomb: '#f97316', flash: '#fde047', log: '#22d3ee', loot: it.v >= 100 ? '#e879f9' : '#fbbf24' }[it.k] || '#ffffff';
  if (ii) { groundGlow(it.x, it.y, gcol, 11); shadow(it.x, it.y, 7, 6); spr(ii, it.x, it.y, false, -(ii.height * .8) / 2 + 3, .8); return; }
  if (it.k === 'log') { groundGlow(it.x, it.y, gcol, 12); shadow(it.x, it.y, 8); const X = sx(it.x), Y = sy(it.y) - (4 + Math.sin(t * 3) * 2) * cam.z, s = 7 * cam.z / 1.4; ctx.fillStyle = '#0e7490'; ctx.fillRect(X - s, Y - s, s * 2, s * 2); ctx.strokeStyle = '#67e8f9'; ctx.lineWidth = 2; ctx.strokeRect(X - s, Y - s, s * 2, s * 2); ctx.fillStyle = '#e0f2fe'; ctx.font = `bold ${8 * cam.z / 1.4}px monospace`; ctx.textAlign = 'center'; ctx.fillText('LOG', X, Y + 3 * cam.z / 1.4); return; }
  if (it.k === 'loot') { groundGlow(it.x, it.y, gcol, 10); shadow(it.x, it.y, 6, 4); const X = sx(it.x), Y = sy(it.y) - 2 * cam.z, q = it.v >= 100; ctx.fillStyle = q ? '#e879f9' : '#fbbf24'; ctx.beginPath(); ctx.moveTo(X, Y - 7 * cam.z / 1.4); ctx.lineTo(X + 6 * cam.z / 1.4, Y); ctx.lineTo(X, Y + 7 * cam.z / 1.4); ctx.lineTo(X - 6 * cam.z / 1.4, Y); ctx.fill(); ctx.strokeStyle = '#fff'; ctx.lineWidth = 1; ctx.stroke(); return; }
  groundGlow(it.x, it.y, gcol, 11); const X = sx(it.x), Y = sy(it.y) - 3 * cam.z, c = { med: '#4ade80', ammo: '#fbbf24', armor: '#60a5fa', boost: '#22d3ee', od: '#f43f5e', cure: '#a78bfa', feather: '#e5e7eb', bomb: '#f97316', flash: '#fde047' }[it.k], l = { med: '+', ammo: 'A', armor: 'D', boost: 'B', od: 'O', cure: 'C', feather: 'F', bomb: 'X', flash: 'S' }[it.k];
  shadow(it.x, it.y, 8); ctx.fillStyle = c; ctx.fillRect(X - 8 * cam.z / 1.4, Y - 8 * cam.z / 1.4, 16 * cam.z / 1.4, 16 * cam.z / 1.4); ctx.strokeStyle = '#fff'; ctx.lineWidth = 1; ctx.strokeRect(X - 8 * cam.z / 1.4, Y - 8 * cam.z / 1.4, 16 * cam.z / 1.4, 16 * cam.z / 1.4);
  ctx.fillStyle = '#000'; ctx.font = `bold ${11 * cam.z / 1.4}px monospace`; ctx.textAlign = 'center'; ctx.fillText(l, X, Y + 4 * cam.z / 1.4);
}
function drawRadarFog() {
  const X = sx(P.x), Y = sy(P.y), N = radarR() * cam.z, F = radarFar() * cam.z;
  const lo = P.aimA - CONE, hi = P.aimA + CONE;
  // 前方以外: 曇り(近くは晴れ、遠いほど濃い)
  ctx.save(); ctx.beginPath(); ctx.rect(0, 0, W, H); ctx.moveTo(X, Y); ctx.arc(X, Y, Math.max(W, H) * 2, lo, hi); ctx.closePath(); ctx.clip('evenodd');
  const g1 = ctx.createRadialGradient(X, Y, N * .3, X, Y, N * 1.15); g1.addColorStop(0, 'rgba(8,14,26,0)'); g1.addColorStop(1, 'rgba(8,14,26,.72)'); ctx.fillStyle = g1; ctx.fillRect(0, 0, W, H); ctx.restore();
  // 前方60度: 遠くまで見える(端で曇る)
  ctx.save(); ctx.beginPath(); ctx.moveTo(X, Y); ctx.arc(X, Y, F * 1.3, lo, hi); ctx.closePath(); ctx.clip();
  const g2 = ctx.createRadialGradient(X, Y, F * .5, X, Y, F * 1.05); g2.addColorStop(0, 'rgba(8,14,26,0)'); g2.addColorStop(1, 'rgba(8,14,26,.72)'); ctx.fillStyle = g2; ctx.fillRect(0, 0, W, H); ctx.restore();
  ctx.strokeStyle = 'rgba(103,232,249,.3)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(X + Math.cos(lo) * N * .5, Y + Math.sin(lo) * N * .5); ctx.lineTo(X + Math.cos(lo) * F * .8, Y + Math.sin(lo) * F * .8); ctx.moveTo(X + Math.cos(hi) * N * .5, Y + Math.sin(hi) * N * .5); ctx.lineTo(X + Math.cos(hi) * F * .8, Y + Math.sin(hi) * F * .8); ctx.stroke();
  // 見えない敵の「ping」(撃たれた直後だけ位置が分かる)
  for (const e of enemies) { if (e.vis > 0 || !(e.rv > 0)) continue; const ex = sx(e.x), ey = sy(e.y); if (ex < 0 || ex > W || ey < 0 || ey > H) continue; const k = clamp(1 - e.rv / 1.4, 0, 1); ctx.strokeStyle = `rgba(248,113,113,${Math.max(0, e.rv / 1.4)})`; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(ex, ey, (6 + k * 16) * cam.z / 1.6, 0, 7); ctx.stroke(); }
}
function drawGimmick() {
  const X = sx(P.x), Y = sy(P.y);
  drawAmbient();
  if (gimOf() === 'fog') { const g2 = ctx.createRadialGradient(X, Y, 90, X, Y, 300); g2.addColorStop(0, 'rgba(205,215,225,0)'); g2.addColorStop(1, hasG('goggle') ? 'rgba(205,215,225,.5)' : 'rgba(205,215,225,.88)'); ctx.fillStyle = g2; ctx.fillRect(0, 0, W, H); }
  if (gimOf() === 'blizzard') { ctx.fillStyle = `rgba(235,242,250,${(.16 + .12 * (1 + Math.sin(t * .8)) / 2) * (hasG('goggle') ? .5 : 1)})`; ctx.fillRect(0, 0, W, H); ctx.strokeStyle = 'rgba(255,255,255,.55)'; ctx.lineWidth = 1.5; ctx.beginPath(); for (let i = 0; i < 70; i++) { const px = ((i * 137 + t * 260) % (W + 80)) - 40, py = ((i * 71 + t * 130) % (H + 40)) - 20; ctx.moveTo(px, py); ctx.lineTo(px - 14, py + 6); } ctx.stroke(); }
  if (gimOf() === 'wind') { ctx.fillStyle = '#e2e8f0'; ctx.font = '12px monospace'; ctx.textAlign = 'right'; ctx.fillText('風 ' + (windAt(t) > 0 ? '→' : '←') + ' ' + Math.abs(Math.round(windAt(t) / 7)), W - 12, 20); }
  const lim = S_BOSS() ? STORM_T * 1.5 : STORM_T; if (t > lim) { ctx.fillStyle = `rgba(120,30,170,${.18 + .12 * Math.sin(t * 4)})`; ctx.fillRect(0, 0, W, H); }
}
function drawScope() {
  const ap = aimPoint(), w = curW(); let X, Y;
  if (inp.rs && inp.rs.mag > .1 || G.bot) { X = sx(P.x + Math.cos(P.aimA) * P.aimD); Y = sy(P.y + Math.sin(P.aimA) * P.aimD); }
  else { const aax = P.x + Math.cos(P.aimA) * P.aimD, aay = P.y + Math.sin(P.aimA) * P.aimD; X = sx(aax); Y = sy(aay); }
  const k = P.scoped;
  if (k > .02) {
    const rr = (w.id === 'sniper' ? 190 : 250), dark = w.id === 'sniper' ? .93 : .5;
    // 円の外を塗りつぶす
    ctx.save(); ctx.beginPath(); ctx.rect(0, 0, W, H); ctx.moveTo(X + rr, Y); ctx.arc(X, Y, rr, 0, Math.PI * 2, true); ctx.clip('evenodd'); ctx.fillStyle = `rgba(0,0,0,${dark * k})`; ctx.fillRect(0, 0, W, H); ctx.restore();
    ctx.strokeStyle = `rgba(103,232,249,${.5 * k})`; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(X, Y, rr, 0, 7); ctx.stroke();
    if (w.id === 'sniper') { ctx.strokeStyle = `rgba(0,0,0,${.9 * k})`; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(X - rr, Y); ctx.lineTo(X + rr, Y); ctx.moveTo(X, Y - rr); ctx.lineTo(X, Y + rr); ctx.stroke(); ctx.fillStyle = '#ef4444'; for (let i = 1; i <= 4; i++) { ctx.fillRect(X + i * 22 - 1, Y - 1, 2, 2); ctx.fillRect(X - i * 22 - 1, Y - 1, 2, 2); ctx.fillRect(X - 1, Y + i * 22 - 1, 2, 2); } }
  }
  // 十字(収束で縮む)
  const mvf = Math.min(1, Math.hypot(P.vx || 0, P.vy || 0) / 150); let sp = w.spread; if (P.scoped > .5) sp = w.scoped != null ? w.scoped : sp * .4; sp *= (1 + mvf * 1.6 + P.bloom) * (1 - .08 * up.range) * (mods.barrel ? .9 : 1);
  const gap = Math.max(3, Math.tan(rad(sp)) * P.aimD * cam.z);
  ctx.strokeStyle = P.scoped > .5 && w.id === 'sniper' ? '#fb7185' : '#e0f2fe'; ctx.lineWidth = 2; ctx.beginPath();
  ctx.moveTo(X - gap - 8, Y); ctx.lineTo(X - gap, Y); ctx.moveTo(X + gap, Y); ctx.lineTo(X + gap + 8, Y); ctx.moveTo(X, Y - gap - 8); ctx.lineTo(X, Y - gap); ctx.moveTo(X, Y + gap); ctx.lineTo(X, Y + gap + 8); ctx.stroke();
  if (gap > 6) { ctx.strokeStyle = 'rgba(224,242,254,.35)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(X, Y, gap, 0, 7); ctx.stroke(); }
  ctx.fillStyle = '#fb7185'; ctx.fillRect(X - 1, Y - 1, 2, 2);
  if (P.hm > 0) { const k = P.hm / .16, o = 7 + (1 - k) * 6; ctx.strokeStyle = P.hmk ? '#ef4444' : '#ffffff'; ctx.lineWidth = P.hmk ? 3 : 2; ctx.globalAlpha = Math.min(1, k + .3); ctx.beginPath(); for (const [dx2, dy2] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) { ctx.moveTo(X + dx2 * o, Y + dy2 * o); ctx.lineTo(X + dx2 * (o + 7), Y + dy2 * (o + 7)); } ctx.stroke(); ctx.globalAlpha = 1; }
  { const ef = effRange(w), dd = P.aimD, ok = dd <= ef; ctx.font = 'bold 11px monospace'; ctx.textAlign = 'center'; ctx.fillStyle = ok ? '#4ade80' : '#fb923c'; ctx.fillText(Math.round(dd / 20) + 'm / 有効' + Math.round(ef / 20) + 'm' + (ok ? '' : ' 威力半減'), X, Y + gap + 24); }
}
function drawRadarHUD() {
  const cx = 66, cy = H - 74, rr = 52, R = radarFar() * 1.05 / 1.7;
  ctx.fillStyle = 'rgba(2,12,22,.72)'; ctx.beginPath(); ctx.arc(cx, cy, rr + 3, 0, 7); ctx.fill();
  ctx.strokeStyle = 'rgba(103,232,249,.55)'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(cx, cy, rr, 0, 7); ctx.stroke(); ctx.beginPath(); ctx.arc(cx, cy, rr / 2, 0, 7); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(cx - rr, cy); ctx.lineTo(cx + rr, cy); ctx.moveTo(cx, cy - rr); ctx.lineTo(cx, cy + rr); ctx.stroke();
  ctx.fillStyle = 'rgba(103,232,249,.16)'; ctx.beginPath(); ctx.moveTo(cx, cy); ctx.arc(cx, cy, rr, P.aimA - CONE, P.aimA + CONE); ctx.closePath(); ctx.fill();
  const sw = t * 2.2; ctx.strokeStyle = 'rgba(103,232,249,.7)'; ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + Math.cos(sw) * rr, cy + Math.sin(sw) * rr); ctx.stroke();
  for (const e of enemies) { if (!(e.vis > 0)) continue; const dx = (e.x - P.x) / (R * 1.7) * rr, dy = (e.y - P.y) / (R * 1.7) * rr; if (dx * dx + dy * dy > rr * rr) continue; ctx.fillStyle = e.elite ? '#fbbf24' : EN[e.type].boss ? '#f43f5e' : '#f87171'; const sz = EN[e.type].boss ? 4 : e.elite ? 3.2 : 2.4; ctx.beginPath(); ctx.arc(cx + dx, cy + dy, sz, 0, 7); ctx.fill(); }
  // 脱出口の方向
  if (portal) { const a = Math.atan2(portal.y - P.y, portal.x - P.x), dd = Math.min(rr - 4, Math.hypot(portal.x - P.x, portal.y - P.y) / (R * 1.7) * rr); ctx.fillStyle = portal.locked ? '#f87171' : '#4ade80'; ctx.fillRect(cx + Math.cos(a) * dd - 2.5, cy + Math.sin(a) * dd - 2.5, 5, 5); }
  if (stash && stash.stage === stageNo) { const a = Math.atan2(stash.y - P.y, stash.x - P.x), dd = Math.min(rr - 4, Math.hypot(stash.x - P.x, stash.y - P.y) / (R * 1.7) * rr); ctx.fillStyle = '#fbbf24'; ctx.fillRect(cx + Math.cos(a) * dd - 2, cy + Math.sin(a) * dd - 2, 4, 4); ctx.strokeStyle = '#fbbf24'; ctx.strokeRect(cx + Math.cos(a) * dd - 3.5, cy + Math.sin(a) * dd - 3.5, 7, 7); }
  ctx.fillStyle = '#67e8f9'; ctx.beginPath(); ctx.arc(cx, cy, 2.6, 0, 7); ctx.fill();
  // 向き(エイム方向)
  ctx.strokeStyle = '#fff'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + Math.cos(P.aimA) * 14, cy + Math.sin(P.aimA) * 14); ctx.stroke();
  ctx.fillStyle = '#9ca3af'; ctx.font = '9px monospace'; ctx.textAlign = 'center'; ctx.fillText('RADAR', cx, cy + rr + 12);
}
function drawHUD() {
  if (isTouch) { const mh = $('mobilehud'), a0 = P.ammo[curW().id]; mh.textContent = `HP ${Math.ceil(P.hp)}/${P.max}${P.bleed ? ' 出血!' : ''}  弾 ${a0.mag}/${a0.res === Infinity ? '∞' : a0.res}  医療 ${P.pack.med}  戦利品 ${P.loot}G`; }
  if (P.hurtFx > 0) { const g3 = ctx.createRadialGradient(W / 2, H / 2, H * .3, W / 2, H / 2, H * .85); g3.addColorStop(0, 'rgba(220,20,20,0)'); g3.addColorStop(1, 'rgba(220,20,20,' + Math.min(.6, P.hurtFx * 1.6) + ')'); ctx.fillStyle = g3; ctx.fillRect(0, 0, W, H); }
  if (P.blind > 0) { ctx.fillStyle = 'rgba(255,255,240,' + Math.min(1, P.blind * 1.2) + ')'; ctx.fillRect(0, 0, W, H); }
  drawRadarHUD();
  const threat = enemies.filter(e => e.hp > 0 && e.warn > 0 && Math.hypot(e.x - P.x, e.y - P.y) < 520).sort((a, b) => Math.hypot(a.x - P.x, a.y - P.y) - Math.hypot(b.x - P.x, b.y - P.y))[0];
  if (threat) { const a = Math.atan2(threat.y - P.y, threat.x - P.x), x = W / 2 + Math.cos(a) * 170, y = H / 2 + Math.sin(a) * 115; ctx.save(); ctx.translate(x, y); ctx.rotate(a); ctx.fillStyle = '#fb7185'; ctx.beginPath(); ctx.moveTo(13, 0); ctx.lineTo(-8, -8); ctx.lineTo(-8, 8); ctx.closePath(); ctx.fill(); ctx.restore(); ctx.fillStyle = '#fecdd3'; ctx.font = 'bold 13px sans-serif'; ctx.textAlign = 'center'; ctx.fillText('敵に発見された', W / 2, 70); }
  ctx.textAlign = 'left'; ctx.font = 'bold 13px monospace';
  ctx.fillStyle = '#000a'; ctx.fillRect(10, 10, 200, 44); ctx.fillStyle = '#1f2937'; ctx.fillRect(16, 16, 188, 12);
  ctx.fillStyle = P.hp < 30 ? '#ef4444' : '#4ade80'; ctx.fillRect(16, 16, 188 * clamp(P.hp / P.max, 0, 1), 12);
  ctx.fillStyle = '#1f2937'; ctx.fillRect(16, 34, 188, 8); ctx.fillStyle = '#60a5fa'; if (ARMOR[P.tier].max) ctx.fillRect(16, 34, 188 * P.ap / ARMOR[P.tier].max, 8);
  ctx.fillStyle = '#fff'; ctx.fillText(`HP ${Math.ceil(P.hp)}`, 20, 26); ctx.font = '11px monospace'; ctx.fillText(ARMOR[P.tier].n + (P.bleed ? '  ■出血' : ''), 20, 51); ctx.fillStyle = '#fbbf24'; ctx.fillText('持ち出し戦利品 ' + P.loot + '/' + (BAGS[bagLv].loot > 9e4 ? '∞' : BAGS[bagLv].loot) + 'G  / 所持金 ' + money + 'G', 20, 66);
  { ctx.textAlign = 'left'; ctx.font = '11px monospace'; ctx.fillStyle = '#000a'; ctx.fillRect(10, H - 22, 715, 16); ctx.fillStyle = '#4ade80'; ctx.fillText('H 医療 ' + P.pack.med, 14, H - 10); ctx.fillStyle = '#22d3ee'; ctx.fillText('J ブースト ' + P.pack.boost, 84, H - 10); ctx.fillStyle = '#f43f5e'; ctx.fillText('K OD ' + P.pack.od, 176, H - 10); ctx.fillStyle = '#a78bfa'; ctx.fillText('L 解毒 ' + (P.pack.cure || 0), 520, H - 10); ctx.fillStyle = '#fb923c'; ctx.fillText('G 爆弾 ' + (P.pack.bomb || 0), 600, H - 10); ctx.fillStyle = '#fde047'; ctx.fillText('V 閃光 ' + (P.pack.flash || 0), 670, H - 10); ctx.fillStyle = '#9ca3af'; ctx.fillText('袋 ' + packN() + '/' + bagSlots(), 238, H - 10); const cw = carryW(), r = cw / maxW(); ctx.fillStyle = r > .75 ? '#f87171' : r < .25 ? '#4ade80' : '#9ca3af'; ctx.fillText('重量 ' + cw.toFixed(1) + '/' + maxW() + 'kg' + (r < .25 ? ' 軽量' : r > .75 ? ' 重い' : ''), 286, H - 10); if (P.camo) { ctx.fillStyle = '#a78bfa'; ctx.fillText('隠密', 436, H - 10); } }
  const w = curW(), am = P.ammo[w.id];
  ctx.font = 'bold 15px monospace'; ctx.textAlign = 'right'; ctx.fillStyle = '#000a'; ctx.fillRect(W - 230, H - 62, 220, 52);
  ctx.fillStyle = '#fde68a'; ctx.fillText(w.name, W - 18, H - 42); ctx.fillStyle = '#fff'; ctx.font = 'bold 20px monospace';
  ctx.fillText(P.rel > 0 ? 'RELOAD' : `${am.mag} / ${am.res === Infinity ? '∞' : am.res}`, W - 18, H - 18);
  ctx.textAlign = 'left'; ctx.font = '12px monospace'; for (let i = 0; i < WEAPONS.length; i++) { const u = WEAPONS[i].unlock <= stageNo; ctx.fillStyle = i === P.cur ? '#fde047' : u ? '#94a3b8' : '#334155'; ctx.fillText((i + 1) + (u ? WEAPONS[i].name.slice(0, 3) : '---'), W - 226 + i * 44, H - 66); }
  ctx.textAlign = 'center'; ctx.fillStyle = '#000a'; ctx.fillRect(W / 2 - 110, 8, 220, 24); ctx.fillStyle = '#67e8f9'; ctx.font = 'bold 13px monospace';
  ctx.fillText(`STAGE ${stageNo}/10  敵 ${enemies.length}`, W / 2, 25); ctx.font = '10px monospace'; ctx.fillStyle = isNight() ? '#a5b4fc' : '#fde68a'; ctx.textAlign = 'right'; ctx.fillText(clockStr() + ' ' + phaseName() + (isNight() ? '(敵+20%/戦利品+25%)' : '') + (isStormDay() ? ' 嵐の日' : ''), W - 12, 14); ctx.textAlign = 'center'; ctx.font = 'bold 13px monospace';
  { const lim = S_BOSS() ? STORM_T * 1.5 : STORM_T, rest = Math.max(0, lim - t); ctx.font = '11px monospace'; ctx.fillStyle = rest < 40 ? '#f87171' : '#a5b4fc'; ctx.fillText(rest > 0 ? '大嵐まで ' + Math.floor(rest / 60) + ':' + String(Math.floor(rest % 60)).padStart(2, '0') : '大嵐!(体力が減る)', W / 2, 40); ctx.font = 'bold 13px monospace'; }
  if (P.scoped > .5) { ctx.fillStyle = '#000a'; ctx.fillRect(W / 2 - 80, H - 30, 160, 12); ctx.fillStyle = '#67e8f9'; ctx.fillRect(W / 2 - 80, H - 30, 160 * P.breath, 12); ctx.fillStyle = '#fff'; ctx.font = '10px monospace'; ctx.fillText('息止め [Space]', W / 2, H - 21); }
  const bs = enemies.find(e => EN[e.type].boss && e.hp > 0); if (bs) { ctx.fillStyle = '#000a'; ctx.fillRect(W / 2 - 200, 38, 400, 12); ctx.fillStyle = '#f43f5e'; ctx.fillRect(W / 2 - 198, 40, 396 * clamp(bs.hp / bs.max, 0, 1), 8); }
  { const st = P.stat, a = []; if (st.freeze > 0) a.push('凍結'); else if (st.cold > 0) a.push('冷気x' + st.cold); if (st.poison > 0) a.push('毒x' + st.poison); if (st.burn > 0) a.push('点火'); if (st.shock > 0) a.push('感電'); if (st.resist > 0) a.push('耐性' + Math.ceil(st.resist)); if (a.length) { ctx.fillStyle = '#c4b5fd'; ctx.textAlign = 'left'; ctx.font = 'bold 12px monospace'; ctx.fillText(a.join(' '), 14, 100); } }
  if (P.boost > 0 || P.od > 0) { ctx.fillStyle = '#22d3ee'; ctx.textAlign = 'left'; ctx.fillText((P.boost > 0 ? '' : '') + (P.boost > 0 ? 'BOOST ' : '') + (P.od > 0 ? 'OVERDRIVE' : ''), 14, 84); }
  if (toastT > 0) {
    ctx.textAlign = 'center'; const long = toastS.length > 24; ctx.font = long ? 'bold 17px sans-serif' : 'bold 22px sans-serif'; const per = long ? 34 : 99, a = clamp(toastT, 0, 1), ls = [];
    for (let i = 0; i < toastS.length; i += per) ls.push(toastS.slice(i, i + per));
    if (long) { ctx.fillStyle = `rgba(0,0,0,${.6 * a})`; ctx.fillRect(W / 2 - 330, 70, 660, 14 + ls.length * 24); }
    ctx.fillStyle = `rgba(255,255,255,${a})`; ls.forEach((l, i) => ctx.fillText(l, W / 2, 90 + i * 24));
  }
  if (portal) { const a = Math.atan2(portal.y - P.y, portal.x - P.x); ctx.fillStyle = portal.locked ? '#f87171' : '#4ade80'; ctx.save(); ctx.translate(W / 2 + Math.cos(a) * 120, H / 2 + Math.sin(a) * 120); ctx.rotate(a); ctx.fillRect(-8, -2, 16, 4); ctx.fillRect(4, -6, 4, 12); ctx.restore(); }
  ctx.fillStyle = '#fbbf24'; ctx.font = '10px monospace'; ctx.textAlign = 'left'; ctx.fillText('作成中', 14, H - 28);
}

// ---------- オーバーレイ ----------
const HIDE = {
  med: { n: '医療施設', d: '最大HP +15 / Lv', max: 5, cost: l => 100 * (l + 1) },
  range: { n: '射撃場', d: '散布 -8% / Lv(精密エイム)', max: 5, cost: l => 120 * (l + 1) },
  armory: { n: '武器庫', d: '出撃時の防具 Class2→3→4', max: 3, cost: l => [250, 600, 1200][l] },
  gym: { n: 'ジム', d: '息止め +0.5秒 / Lv', max: 5, cost: l => 90 * (l + 1) },
};
G.buy = k => { const h = HIDE[k], l = up[k]; if (l >= h.max) return; const c = h.cost(l); if (money < c) return; money -= c; up[k]++; saveMeta(); showOv('hideout'); };
// 武器改造(ガロン)。Duckovの武器改造を参考にした5種。効果はゲーム側(mods.xxx)で適用
const MODS = {
  barrel: { n: 'ロングバレル', d: '射程・有効射程 +25% / 散布 -10%', cost: 200 },
  sup: { n: 'サプレッサー', d: '敵に気づかれる距離 -35%', cost: 250 },
  mag: { n: '拡張マガジン', d: '弾倉 +50%', cost: 220 },
  ap: { n: 'AP弾', d: '貫通力 +10 / ダメージ -10%', cost: 300 },
  scope: { n: '鷹眼スコープ', d: 'スコープの揺れ -30%', cost: 260 },
  radar: { n: 'レーダー拡張', d: '敵が見える範囲 +30%', cost: 280 },
};
G.buyCarry = k => { const C = { ammo: 100, a3: 400, a4: 900 }[k]; if (money < C) return; if (k === 'ammo' && carry.ammo) return; if (k === 'a3' && carry.armor >= 3) return; if (k === 'a4' && carry.armor >= 4) return; money -= C; if (k === 'ammo') carry.ammo = 1; else carry.armor = k === 'a3' ? 3 : 4; saveMeta(); showOv('hideout'); };
G.pickChar = id => { if (!owned[id]) return; charId = id; saveMeta(); showOv('hideout'); };
G.buyChar = id => { const c = CHARS.find(x => x.id === id); if (!c || owned[id] || money < c.cost) return; money -= c.cost; owned[id] = 1; charId = id; saveMeta(); showOv('hideout'); };
G.buyMod = k => { if (mods[k] || money < MODS[k].cost || !qOk(k)) return; money -= MODS[k].cost; mods[k] = 1; saveMeta(); showOv('hideout'); };
G.buyBag = () => { const n = BAGS[bagLv + 1]; if (!n || money < n.cost || !qOk('bag' + (bagLv + 1))) return; money -= n.cost; bagLv++; saveMeta(); showOv('hideout'); };
G.buyGear = id => { const g = GEAR.find(x => x.id === id); if (!g || gearOwn[id] || money < g.cost || !qOk(id)) return; money -= g.cost; gearOwn[id] = 1; gearEq[g.slot] = id; saveMeta(); showOv('hideout'); };
G.eqGear = id => { const g = GEAR.find(x => x.id === id); if (!g || !gearOwn[id]) return; if (gearEq[g.slot] === id) delete gearEq[g.slot]; else gearEq[g.slot] = id; saveMeta(); showOv('hideout'); };
G.buyFac = k => { const F = FAC[k], l = base[k]; if (l >= F.cost.length || money < F.cost[l] || !qOk(k)) return; money -= F.cost[l]; base[k]++; saveMeta(); showOv('hideout'); };
G.setDiff = k => { if (!DIFFS[k]) return; diff = k; saveMeta(); showOv('hideout'); };
G.offer = () => { if (tot.f < 8) return; const left = TOTEMS.filter(x => !tot.own[x.id]); if (!left.length) return; tot.f -= 8; const t0 = left[(Math.random() * left.length) | 0]; tot.own[t0.id] = 1; if (tot.eq.length < 2) tot.eq.push(t0.id); saveMeta(); showOv('hideout'); };
G.eqTotem = id => { if (!tot.own[id]) return; const i = tot.eq.indexOf(id); if (i >= 0) tot.eq.splice(i, 1); else { if (tot.eq.length >= 2) tot.eq.shift(); tot.eq.push(id); } saveMeta(); showOv('hideout'); };
G.sleep = () => { clock.h = 8; clock.day++; saveClock(); showOv('hideout'); };
// 依頼(ヴェイル)
const QUESTS = [
  { id: 'q1', n: 'ハチ退治', d: '空飛ぶ敵(ドローン枠)を累計30体倒す', now: () => stats.kills.drone || 0, need: 30, reward: 150 },
  { id: 'q2', n: '重装兵の撃破', d: 'ヘビーを累計5体倒す', now: () => stats.kills.heavy || 0, need: 5, reward: 300, unl: '獣革ヘルメット' },
  { id: 'q3', n: '狙撃手狩り', d: 'スナイパー兵を累計10体倒す', now: () => stats.kills.sniper || 0, need: 10, reward: 250, unl: '安定グローブ' },
  { id: 'q4', n: '門番の撃破', d: '5面のボス「砂漠の主サンドマザー」を倒す', now: () => stats.boss[5] ? 1 : 0, need: 1, reward: 500, unl: '次元ポケット' },
  { id: 'q6', n: '初めての脱出', d: '脱出に成功する', now: () => stats.clears || 0, need: 1, reward: 120, unl: 'ナイトゴーグル・研究室・食堂' },
  { id: 'q7', n: '常連の脱出者', d: '脱出に5回成功する', now: () => stats.clears || 0, need: 5, reward: 400, unl: '革のバックパック' },
  { id: 'q8', n: '落とし物を拾う', d: '遺失物を1回回収する', now: () => stats.recover || 0, need: 1, reward: 200, unl: '救護ベスト・発電室' },
  { id: 'q9', n: '夜の脱出', d: '夜(20時〜6時)に脱出する', now: () => stats.nightClears || 0, need: 1, reward: 350, unl: 'レーダー拡張' },
  { id: 'q5', n: '山頂の王に挑む', d: '10面のボス「白き王」を倒す', now: () => stats.boss[10] ? 1 : 0, need: 1, reward: 1500 },
];
G.claim = id => { const q = QUESTS.find(x => x.id === id); if (!q || claimed[id] || q.now() < q.need) return; claimed[id] = 1; money += q.reward; saveMeta(); showOv('hideout'); };
// 隠れ家の住人。立ち絵は portraits.js(Geminiで作成)
let hideNPC = 'garon';
G.hide = k => { hideNPC = k; showOv('hideout'); };
const NPCS = {
  rina: { n: 'リナ', role: '医療施設', say: n => n >= 5 ? '「あなたの脈……前にどこかで診た気がするの。気のせいね。」' : n >= 2 ? '「また無茶をして。次は止血剤を忘れないで。」' : '「生きて戻ったのね。傷は浅いわ。座って。」' },
  garon: { n: 'ガロン', role: '武器庫・射撃場・作業台', say: n => n >= 4 ? '「お前の癖、昔の同僚に似てやがる。……気のせいだろ。」' : '「それはまだ使える。持っていきな。」' },
  veil: { n: 'ヴェイル', role: '情報屋・依頼', say: n => n >= 6 ? '「あたしの記憶、途中から薄いんだ。……あんたもだろ?」' : '「白き王の手下の動き、買うかい。仕事なら、ここにあるよ。」' },
  toto: { n: 'トト', role: 'ジム', say: n => n >= 7 ? 'ホー……アキラ……ハ……ダレ……ヲ……マッテ……イル?' : 'ホーホー。トレーニングを、はじめるぞ。' },
  gear: { n: '装備', role: 'バッグ・装備品', say: n => n >= 4 ? '「背負う荷物は、軽いほうがいい。……そう言ったのは、誰だったかな。」' : '「バッグが大きいほど、持ち帰れる儲けも増える。装備は4か所、好きに組みな。」' },
  base: { n: '基地', role: '秘密基地の施設', say: n => n >= 5 ? '「この巣穴、掘った覚えのない部屋があるんだ。誰が掘ったんだろうな。」' : '「古い巣穴を少しずつ直してる。部屋が増えれば、出撃が楽になるよ。」' },
  chars: { n: '着替え', role: 'キャラ選択', say: n => '「今日は誰で出る?　二頭身の仲間は、それぞれ得意なことが違うよ。」' },
  mio: { n: 'ミオ', role: '???', say: n => n >= 8 ? '「私は、あなたが助けられなかった子の、かけら。……でも、怖くないよ。」' : '「……来てくれたんだね。ここは、あったかい。」' },
};
// タイトル絵: 夕焼けの山と森、雪をかぶった針葉樹、狼とうさぎ(ドット)
function drawTitleScene(g) {
  const W2 = 192, H2 = 106, sk = ['#2b1d4f', '#4a2a6b', '#8a3a6a', '#d9576b', '#f59e5b', '#fcd37a'];
  sk.forEach((c, i) => { g.fillStyle = c; g.fillRect(0, i * 11, W2, 12); });
  let seed = 7; const rn = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  g.fillStyle = '#fff3'; for (let i = 0; i < 40; i++) g.fillRect(rn() * W2 | 0, rn() * 30 | 0, 1, 1);
  g.fillStyle = '#fde68a'; g.beginPath(); g.arc(138, 52, 11, 0, 7); g.fill(); g.fillStyle = '#fef3c7'; g.beginPath(); g.arc(138, 52, 8, 0, 7); g.fill();
  const ridge = (base, amp, col, snow, ph) => { for (let x = 0; x < W2; x++) { const h = base - amp * (Math.abs(Math.sin(x / 23 + ph)) * .7 + Math.abs(Math.sin(x / 9 + ph * 2)) * .3) | 0; g.fillStyle = col; g.fillRect(x, h, 1, H2 - h); if (snow) { g.fillStyle = '#e8eef6'; g.fillRect(x, h, 1, 3); } } };
  ridge(66, 34, '#5b4a86', true, 1); ridge(74, 24, '#3d3566', false, 3);
  g.fillStyle = '#1d2a4a'; g.fillRect(0, 84, W2, 22);
  const pine = (x, y, h, c) => { g.fillStyle = c; for (let k = 0; k < 4; k++) { const w = 3 + k * 2 + (h > 22 ? 1 : 0), yy = y - h + k * (h / 4 | 0); g.fillRect(x - (w >> 1), yy, w, (h / 4 | 0) + 2); } g.fillStyle = '#e8eef6'; for (let k = 0; k < 4; k++) g.fillRect(x - ((3 + k * 2) >> 1), y - h + k * (h / 4 | 0), 3 + k * 2, 1); g.fillStyle = '#3b2a1c'; g.fillRect(x, y, 1, 3); };
  for (let i = 0; i < 22; i++) pine(i * 9 + 3 + (rn() * 4 | 0), 92 + (rn() * 3 | 0), 14 + (rn() * 10 | 0), '#12302a');
  g.fillStyle = '#0c1a1f'; g.fillRect(0, 95, W2, 11);
  for (let i = 0; i < 12; i++) pine(i * 17 + 6, 104, 26 + (rn() * 8 | 0), '#0b2420');
  g.fillStyle = '#e8eef6'; for (let x = 0; x < W2; x++) g.fillRect(x, 103 + (Math.sin(x / 5) * 1.2 | 0), 1, 3);
  // 狼のシルエット(岩の上で吠える)
  g.fillStyle = '#0a0f1c'; g.fillRect(32, 86, 28, 20); g.fillRect(36, 82, 20, 6);
  const wolf = ['....##.........', '...###.....##..', '..####....###..', '..#####..####..', '..###########..', '...##########..', '....##########.', '....#.#....#.#.', '....#.#....#.#.'];
  wolf.forEach((r, y) => { for (let x = 0; x < r.length; x++) if (r[x] === '#') g.fillRect(36 + x * 1.3 | 0, 66 + y * 2, 2, 2); });
  g.fillStyle = '#facc15'; g.fillRect(40, 70, 1, 1);
  // うさぎ
  g.fillStyle = '#0a0f1c'; g.fillRect(150, 96, 8, 6); g.fillRect(155, 92, 3, 5); g.fillRect(155, 88, 1, 5); g.fillRect(157, 88, 1, 5);
}
function showOv(kind) {
  const o = $('ov'), b = $('obox'); o.style.display = 'flex'; let h = '';
  if (kind === 'title') {
    h = `<h1>NEXARIA WILDS</h1><div class="wip">【作成中】動物たちの森 ドット絵・脱出シューター</div><p>${STORY_INTRO.split(String.fromCharCode(10)).join('<br>')}</p>
    <p style="color:#9ca3af;font-size:12px">PC: WASD移動 / マウス照準 / 左クリック射撃 / <b>右クリック長押し or Q = スコープ</b> / Space 息止め(スコープ中) / R 装填 / 1-5 or ホイール 武器切替<br>スマホ: 横向き / 左=移動 右=照準 / 射撃ボタン(スコープ中は右を離しても発射) / 装備ボタン<br>コントローラ: 左スティック=移動 右スティック=照準 RT/R2=射撃 LT/L2=スコープ L3=息止め X/□=装填 Y/△・LB/L1=武器 RB/R1=爆弾 B/○=医療 十字(上=ブースト 右=解毒 左=閃光 下=戦利品全部) / メニューは十字+A/× / F9で配列変更・F10で診断表示<br>目的: 戦利品◆を集め、緑の出口に3秒立って<b>脱出</b>。死ぬと持ち出した戦利品を失う。弾かれる敵には貫通力の高い武器を。</p>
    <p style="color:#fbbf24">所持金 ${money}G</p>`;
    { const got = Object.keys(logs).map(Number).sort((a, b) => a - b); h += `<details style="margin:6px 0;color:#9ca3af"><summary>回収した記録 ${got.length}/10(各面に1つ、水色の「LOG」)</summary>${got.map(n => '<p style="font-size:12px">【' + n + '】' + LOGS[n - 1] + '</p>').join('') || '<p style="font-size:12px">まだ無い</p>'}</details>`; }
    h += `<div><button class="b" onclick="G.start(1)">出撃(1面から)</button><button class="b" onclick="G.hide(hideNPC)">隠れ家(強化・改造・依頼)</button></div><div id="sel">`;
    for (let i = 1; i <= 10; i++)h += `<button class="b" ${i > unlocked ? 'disabled' : ''} onclick="G.start(${i})">${i}</button>`; h += '</div>';
  } else if (kind === 'hideout') {
    const nl = Object.keys(logs).length, nq = QUESTS.filter(q => !claimed[q.id] && q.now() >= q.need).length;
    h = `<h1>隠れ家</h1><div class="wip">森の古い巣穴。獣たちの居住区 / 所持金 <b>${money}G</b></div><div class="npcrow">`;
    for (const k in NPCS) { const lock = k === 'mio' && nl < 3; h += `<button class="npc ${k === hideNPC ? 'on' : ''}" ${lock ? 'disabled' : ''} onclick="G.hide('${k}')"><canvas class="pcv" data-k="${k}"></canvas><span>${lock ? '???' : NPCS[k].n}${k === 'veil' && nq ? ' ❗' : ''}</span></button>`; }
    h += '</div>';
    const N = NPCS[hideNPC]; h += `<div class="say"><b>${N.n}</b>(${N.role})<br>${N.say(nl)}</div>`;
    const upBtn = k => { const H2 = HIDE[k], l = up[k], mx = l >= H2.max; return `<button class="b" ${mx || money < H2.cost(l) ? 'disabled' : ''} onclick="G.buy('${k}')">${H2.n} Lv${l}${mx ? ' MAX' : ' → ' + H2.cost(l) + 'G'}<br><small>${H2.d}</small></button>`; };
    if (hideNPC === 'rina') h += '<div>' + upBtn('med') + '</div><p style="font-size:12px;color:#9ca3af">医療キットを拾うと体力+35と止血。出血は放っておくと体力が減り続ける。</p>';
    else if (hideNPC === 'toto') h += '<div>' + upBtn('gym') + '</div><p style="font-size:12px;color:#9ca3af">息止めの時間が伸びる(スコープ中にSpace)。</p>';
    else if (hideNPC === 'garon') {
      h += '<div>' + upBtn('armory') + upBtn('range') + '</div><p style="color:#fbbf24;margin:8px 0 2px"><b>作業台(武器改造・全武器に適用)</b></p><div>';
      for (const k in MODS) { const M = MODS[k]; h += `<button class="b" ${mods[k] || money < M.cost || !qOk(k) ? 'disabled' : ''} onclick="G.buyMod('${k}')">${M.n}${mods[k] ? ' 装着済' : qOk(k) ? ' → ' + M.cost + 'G' : ' 🔒'}<br><small>${M.d}${!mods[k] && !qOk(k) ? ' <span style="color:#fbbf24">【依頼「' + qName(k) + '」で解放】</span>' : ''}</small></button>`; } h += '</div>';
      h += '<p style="color:#fbbf24;margin:8px 0 2px"><b>持ち込み(次の出撃1回だけ)</b></p><div>';
      h += `<button class="b" ${carry.ammo || money < 100 ? 'disabled' : ''} onclick="G.buyCarry('ammo')">弾薬セット${carry.ammo ? ' 購入済' : ' → 100G'}<br><small>全武器の予備弾 +50%</small></button>`;
      h += `<button class="b" ${carry.armor >= 3 || money < 400 ? 'disabled' : ''} onclick="G.buyCarry('a3')">戦闘装甲 Class3${carry.armor >= 3 ? ' 購入済' : ' → 400G'}<br><small>出撃時に装備</small></button>`;
      h += `<button class="b" ${carry.armor >= 4 || money < 900 ? 'disabled' : ''} onclick="G.buyCarry('a4')">外骨格 Class4${carry.armor >= 4 ? ' 購入済' : ' → 900G'}<br><small>出撃時に装備</small></button></div>`;
    } else if (hideNPC === 'veil') {
      h += '<p style="color:#fbbf24;margin:8px 0 2px"><b>依頼</b></p>';
      for (const q of QUESTS) { const now = Math.min(q.now(), q.need), ok = now >= q.need, cl = claimed[q.id]; h += `<div class="qrow"><span>${q.n}<br><small>${q.d}(${now}/${q.need})${q.unl ? ' <span style="color:#fbbf24">解放: ' + q.unl + '</span>' : ''}</small></span><button class="b" ${cl || !ok ? 'disabled' : ''} onclick="G.claim('${q.id}')">${cl ? '済' : ok ? '報酬 ' + q.reward + 'G' : q.reward + 'G'}</button></div>`; }
    } else if (hideNPC === 'gear') {
      const nb = BAGS[bagLv + 1];
      h += `<p style="color:#fbbf24;margin:8px 0 2px"><canvas class="ico" data-i="bag${bagLv}"></canvas> <b>バッグ</b>:${BAGS[bagLv].n}(枠${bagSlots()}・持ち帰り上限 ${BAGS[bagLv].loot > 9e4 ? '無制限' : BAGS[bagLv].loot + 'G'})</p><div>`;
      h += nb ? `<button class="b" ${money < nb.cost || !qOk('bag' + (bagLv + 1)) ? 'disabled' : ''} onclick="G.buyBag()">${nb.n} → ${nb.cost}G${qOk('bag' + (bagLv + 1)) ? '' : '<br><small style="color:#fbbf24">🔒 依頼「' + qName('bag' + (bagLv + 1)) + '」(ヴェイル)</small>'}<br><small>枠 ${nb.slots} / 持ち帰り上限 ${nb.loot > 9e4 ? '無制限' : nb.loot + 'G'}</small></button>` : '<span style="color:#9ca3af">最大のバッグ</span>';
      h += '</div><p style="font-size:12px;color:#9ca3af">枠=医療キット・ブースト・オーバードライブを持てる数(出撃中 H/J/K で使う)。戦利品は上限まで。</p>';
      h += '<p style="color:#fbbf24;margin:8px 0 2px"><b>装備(頭・胴・足・手 に1つずつ)</b></p>';
      for (const sl in SLOTN) { const cur = GEAR.find(x => x.id === gearEq[sl]); h += `<div class="qrow" style="background:#0b1220"><span style="flex:1"><b>${SLOTN[sl]}</b>:${cur ? cur.n : '<span style="color:#6b7280">なし</span>'}</span></div>`; for (const g of GEAR.filter(x => x.slot === sl)) { const ow = gearOwn[g.id], on = gearEq[sl] === g.id; h += `<div class="qrow"><canvas class="ico" data-i="${g.id}"></canvas><span style="flex:1">${g.n}${on ? ' ★装備中' : ''}<br><small>${g.d}${!ow && !qOk(g.id) ? ' <span style="color:#fbbf24">【依頼「' + qName(g.id) + '」で解放】</span>' : ''}</small></span><button class="b" ${!ow && (money < g.cost || !qOk(g.id)) ? 'disabled' : ''} onclick="${ow ? "G.eqGear('" + g.id + "')" : "G.buyGear('" + g.id + "')"}">${ow ? (on ? '外す' : '装備') : qOk(g.id) ? g.cost + 'G' : '🔒'}</button></div>`; } }
      h += `<p style="color:#fbbf24;margin:10px 0 2px"><b>トーテム</b>(装備は2つまで)  羽根 ${tot.f}個</p><div class="qrow"><span style="flex:1">羽根を8個捧げると、まだ持っていないトーテムが1つ手に入る。羽根は敵が落とし、脱出で持ち帰る。</span><button class="b" ${tot.f < 8 || TOTEMS.every(x => tot.own[x.id]) ? 'disabled' : ''} onclick="G.offer()">捧げる</button></div>`;
      for (const t1 of TOTEMS) { const ow = tot.own[t1.id], on = tot.eq.includes(t1.id); h += `<div class="qrow"><span style="flex:1">${ow ? t1.n : '???'}${on ? ' ★装備中' : ''}<br><small>${ow ? t1.d : '未入手'}</small></span><button class="b" ${ow ? '' : 'disabled'} onclick="G.eqTotem('${t1.id}')">${on ? '外す' : '装備'}</button></div>`; }
    } else if (hideNPC === 'base') {
      h += `<p style="color:#fbbf24;margin:8px 0 2px"><b>難易度(自室)</b></p><div>`; for (const k in DIFFS) h += `<button class="b ${diff === k ? 'on' : ''}" onclick="G.setDiff('${k}')">${DIFFS[k].n}${diff === k ? ' ★' : ''}</button>`; h += `</div><p style="font-size:12px;color:#9ca3af">${DIFFS[diff].d}</p>`;
      h += '<canvas id="bcv" width="320" height="86" style="width:100%;image-rendering:pixelated;border:1px solid #164e63;margin:6px 0"></canvas>';
      h += `<div class="qrow"><span style="flex:1"><b>ベッド</b> 現在 ${clockStr()}(${clock.day}日目${isNight() ? '・夜' : ''}${isStormDay() ? '・嵐の日' : ''})<br><small>寝ると朝8時になる。夜は敵+20%・戦利品+25%。3日ごとの「嵐の日」は大嵐が早く来る(3分)。出撃のたびに2.5時間進む。</small></span><button class="b" onclick="G.sleep()">寝る</button></div>`;
      for (const k in FAC) { const F = FAC[k], l = base[k], mx = l >= F.cost.length; h += `<div class="qrow"><span style="flex:1"><b>${F.n}</b> Lv${l}/${F.cost.length}<br><small>${F.d}${!qOk(k) ? ' <span style="color:#fbbf24">【依頼「' + qName(k) + '」で解放】</span>' : ''}</small></span><button class="b" ${mx || money < F.cost[l] || !qOk(k) ? 'disabled' : ''} onclick="G.buyFac('${k}')">${mx ? 'MAX' : qOk(k) ? F.cost[l] + 'G' : '🔒'}</button></div>`; }
    } else if (hideNPC === 'chars') {
      h += '<div>';
      for (const c of CHARS) { const ow = owned[c.id]; h += `<div class="qrow"><canvas class="ccv" data-c="${c.id}"></canvas><span style="flex:1">${c.n}${charId === c.id ? ' ★選択中' : ''}<br><small>${c.d}</small></span><button class="b" ${(ow && charId === c.id) || (!ow && money < c.cost) ? 'disabled' : ''} onclick="${ow ? "G.pickChar('" + c.id + "')" : "G.buyChar('" + c.id + "')"}">${ow ? (charId === c.id ? '選択中' : '選ぶ') : c.cost + 'G'}</button></div>`; }
      h += '</div>';
    } else if (hideNPC === 'mio') {
      const got = Object.keys(logs).map(Number).sort((a, b) => a - b); h += `<p style="color:#fbbf24;margin:8px 0 2px"><b>集めた記録 ${got.length}/10</b></p>` + (got.map(n => '<p style="font-size:12px">【' + n + '】' + LOGS[n - 1] + '</p>').join('') || '<p style="font-size:12px">まだ無い</p>');
    }
    h += '<div style="margin-top:10px"><button class="b" onclick="G.title()">戻る</button><button class="b" onclick="G.start(1)">出撃(1面から)</button></div>';
  } else if (kind === 'clear') h =`<h1>EXTRACTED — STAGE ${stageNo}</h1><p>${STAGES[stageNo - 1].n} から脱出した。<br>戦利品 <b style="color:#fbbf24">+${bankedLoot}G</b>(所持金 ${money}G)${stageNo + 1 === 2 ? '<br>SMGを解禁。' : stageNo + 1 === 3 ? '<br>ショットガンを解禁。' : stageNo + 1 === 4 ? '<br>アサルトライフルを解禁。' : stageNo === 4 ? '<br>次は第5面、ボス「砂漠の主サンドマザー」だ。' : ''}</p><button class="b" onclick="G.start(${stageNo + 1},1)">次の面へ(装備を持ち越す)</button><button class="b" onclick="G.title()">隠れ家へ戻る</button>`;
  else if (kind === 'dead') h = `<h1 style="color:#f87171">YOU DIED</h1><p>${droppedStash ? `持っていた戦利品 ${lostLoot}G とバッグの中身は、死んだ場所に<b>遺失物</b>として残った。<br>同じ面(${stash.stage}面)で取りに戻れる。ただし、取り戻す前に新しく死ぬと古い遺失物は消える。` : '持ち出した荷物は無かった。'}<br>隠れ家で立て直して、もう一度転生する。</p><button class="b" onclick="G.start(${stageNo})">この面で再出撃</button><button class="b" onclick="G.title()">隠れ家へ</button>`;
  else if (kind === 'end') h = `<h1>THE END</h1><p>山頂の王「白き王」は、静かに膝をついた。氷の玉座の奥で、最後の記録が開く。<br>あの日、森で倒れていた人間のアキラを、最後の泉の力で助けたのは、白き王だった。王は、その代償に、世界を雪で閉ざしていたのだ。<br>ミオが微笑む。「ありがとう。もう、春になるよ」――雪が光の粒になって溶け、彼女の姿も、朝の光に消えた。</p><p style="color:#fbbf24">戦利品 +${bankedLoot}G(所持金 ${money}G)</p><p style="color:#9ca3af">(試作版の仮エンディング)</p><button class="b" onclick="G.title()">隠れ家へ</button>`;
  if (kind === 'title') h = '<canvas id="tcv" width="192" height="106" style="width:100%;image-rendering:pixelated;border:1px solid #22d3ee;margin-bottom:8px"></canvas>' + h;
  b.innerHTML = h;
  document.querySelectorAll('.ico').forEach(cv => { cv.width = 24; cv.height = 24; const g = cv.getContext('2d'); const ic = ICO[cv.dataset.i]; if (ic) ic(g); cv.style.cssText = 'width:36px;height:36px;image-rendering:pixelated;vertical-align:middle;margin-right:6px'; });
  document.querySelectorAll('.ccv').forEach(cv => { const cs = SPR.char[cv.dataset.c]; const im = cs && cs.front && cs.front[0]; if (!im) { cv.width = 8; cv.height = 8; return; } cv.width = im.width; cv.height = im.height; cv.getContext('2d').drawImage(im, 0, 0); cv.style.cssText = 'height:56px;image-rendering:pixelated'; });
  document.querySelectorAll('.pcv').forEach(cv => { if (cv.dataset.k === 'gear' || cv.dataset.k === 'base') { cv.width = 16; cv.height = 16; const g = cv.getContext('2d'); const IC = cv.dataset.k === 'gear' ? ['....cccccc......', '...cbbbbbbc.....', '..cbbbbbbbbc....', '..cbbbbbbbbc....', '.cbbbddddbbbc...', '.cbbd....dbbc...', '.cbbbbbbbbbbc...', '.cbbbbbbbbbbc...', '.cbbeeeeeebbc...', '.cbbeffffebbc...', '.cbbeeeeeebbc...', '.cbbbbbbbbbbc...', '.cbbbbbbbbbbc...', '..cbbbbbbbbc....', '...cccccccc.....', '................'] : ['................', '.......cc.......', '.....ccbbcc.....', '...ccbbbbbbcc...', '..cbbbbbbbbbbc..', '.cbbbbbbbbbbbbc.', '.cbbeeebbeeebbc.', '.cbbeeebbeeebbc.', '.cbbeeebbffbbbc.', '.cbbbbbbbffbbbc.', '.cbbbbbbbffbbbc.', '.cddddddddddddc.', '................', '................', '................', '................'];
    const C = { c: '#0f172a', b: '#64748b', d: '#334155', e: '#22d3ee', f: '#fbbf24' }; IC.forEach((r, y) => { for (let x = 0; x < 16; x++) { const ch = r[x]; if (ch === '.') continue; g.fillStyle = C[ch]; g.fillRect(x, y, 1, 1); } }); cv.style.cssText = 'height:64px;image-rendering:pixelated'; return; }
  if (cv.dataset.k === 'chars') { const cs = SPR.char[charId], im = cs && cs.front && cs.front[0]; if (im) { cv.width = im.width; cv.height = im.height; cv.getContext('2d').drawImage(im, 0, 0); cv.style.cssText = 'height:64px;image-rendering:pixelated'; } return; } const it = typeof PORTRAIT_PX !== 'undefined' && PORTRAIT_PX.items.find(x => x.name === cv.dataset.k); if (!it) return; cv.width = it.w; cv.height = Math.min(it.h, Math.round(it.w * 1.0)); const g = cv.getContext('2d'); it.rows.slice(0, cv.height).forEach((row, y) => { for (let x = 0; x < it.w; x++) { const ch = row[x]; if (ch === '.') continue; g.fillStyle = it.pal[parseInt(ch, 36)]; g.fillRect(x, y, 1, 1); } }); cv.style.cssText = 'width:64px;image-rendering:pixelated'; });
  const bcv = $('bcv'); if (bcv) { const g = bcv.getContext('2d'); g.fillStyle = '#0b1220'; g.fillRect(0, 0, 320, 86); g.fillStyle = '#1e293b'; g.fillRect(0, 70, 320, 16); g.fillStyle = '#334155'; for (let x = 0; x < 320; x += 8) g.fillRect(x, 72, 4, 2);
    const ks = Object.keys(FAC); ks.forEach((k, i) => { const x = 8 + i * 62, l = base[k], on = l > 0; g.fillStyle = on ? '#164e63' : '#111827'; g.fillRect(x, 14, 54, 52); g.strokeStyle = on ? '#22d3ee' : '#334155'; g.strokeRect(x + .5, 14.5, 53, 51); if (on) { g.fillStyle = 'rgba(103,232,249,' + (.12 + l * .1) + ')'; g.fillRect(x + 2, 16, 50, 24); } g.fillStyle = on ? '#e0f2fe' : '#475569'; g.font = 'bold 16px monospace'; g.textAlign = 'center'; g.fillText(FAC[k].ico, x + 27, 38); g.font = '9px monospace'; g.fillText(FAC[k].n, x + 27, 52); for (let j = 0; j < 3; j++) { g.fillStyle = j < l ? '#fbbf24' : '#1f2937'; g.fillRect(x + 12 + j * 11, 58, 8, 4); } });
    g.fillStyle = '#9ca3af'; g.font = '9px monospace'; g.textAlign = 'left'; g.fillText('廃駅の地下 - 秘密基地', 6, 9); }
  const tcv = $('tcv'); if (tcv) drawTitleScene(tcv.getContext('2d'));
}
G.title = () => { scene = 'title'; showOv('title'); };
G.start = (n, keep) => { bgmStart(); try { ac = ac || new (window.AudioContext || window.webkitAudioContext)(); ac.resume(); } catch (e) { } startStage(n, keep); };

// ---------- 入力 ----------
function cpos(e) { const r = cv.getBoundingClientRect(); return { x: (e.clientX - r.left) / r.width * W, y: (e.clientY - r.top) / r.height * H }; }
cv.addEventListener('mousemove', e => { const p = cpos(e); inp.mx = p.x; inp.my = p.y; inp.mouseT = performance.now(); });
cv.addEventListener('mousedown', e => { if (e.button === 0) inp.down = true; if (e.button === 2) inp.rdown = true; });
addEventListener('mouseup', e => { if (e.button === 0) inp.down = false; if (e.button === 2) inp.rdown = false; });
cv.addEventListener('contextmenu', e => e.preventDefault());
cv.addEventListener('wheel', e => { e.preventDefault(); swap(e.deltaY > 0 ? 1 : -1); }, { passive: false });
function swap(d) { if (scene !== 'play') return; let n = P.cur; for (let i = 0; i < 5; i++) { n = (n + d + 5) % 5; if (WEAPONS[n].unlock <= stageNo) break; } setW(n); }
function setW(n) { if (scene !== 'play' || WEAPONS[n].unlock > stageNo || n === P.cur) return; P.cur = n; P.rel = 0; P.cd = .2; sfx(300, .06, 'triangle', .04); }
addEventListener('keydown', e => {
  inp.keys[e.code] = true; if (e.code === 'Space' || e.code.startsWith('Arrow')) e.preventDefault();
  if (scene === 'play') { if (e.code === 'KeyH') useItem('med'); if (e.code === 'KeyJ') useItem('boost'); if (e.code === 'KeyK') useItem('od'); if (e.code === 'KeyF') G.takeAll(); if (e.code === 'Escape') G.closeLoot(); if (e.code === 'KeyL') useItem('cure'); if (e.code === 'KeyG') useItem('bomb'); if (e.code === 'KeyV') useItem('flash'); if (e.code === 'KeyM') { bgmOn = !bgmOn; toast(bgmOn ? 'BGM ON' : 'BGM OFF', 1); } } if (e.code === 'KeyQ') inp.tog = !inp.tog; if (e.code === 'KeyR' && scene === 'play') reload();
  if (/^Digit[1-5]$/.test(e.code)) setW(+e.code.slice(5) - 1);
});
addEventListener('keyup', e => { inp.keys[e.code] = false; });
// タッチ
const isTouch = matchMedia('(pointer:coarse)').matches || 'ontouchstart' in window || hash.has('touch'); if (isTouch) document.body.classList.add('touch');
const tch = {};
function tstart(e) {
  for (const t of e.changedTouches) { const p = cpos(t); if (p.x < W / 2) { tch[t.identifier] = { k: 'l', ox: p.x, oy: p.y }; } else { tch[t.identifier] = { k: 'r', ox: p.x, oy: p.y }; } }
}
function tmove(e) {
  for (const t of e.changedTouches) { const s = tch[t.identifier]; if (!s) continue; const p = cpos(t), dx = p.x - s.ox, dy = p.y - s.oy, m = Math.min(1, Math.hypot(dx, dy) / 60), a = Math.atan2(dy, dx); const v = { x: Math.cos(a) * m, y: Math.sin(a) * m, mag: m }; if (s.k === 'l') inp.ls = v; else inp.rs = v; }
}
function tend(e) {
  for (const t of e.changedTouches) { const s = tch[t.identifier]; if (!s) continue; if (s.k === 'l') inp.ls = null; else { if (inp.rs && inp.rs.mag > .3) inp.rsRelease = true; inp.rs = null; } delete tch[t.identifier]; }
}
cv.addEventListener('touchstart', e => { e.preventDefault(); tstart(e); }, { passive: false });
cv.addEventListener('touchmove', e => { e.preventDefault(); tmove(e); }, { passive: false });
cv.addEventListener('touchend', e => { e.preventDefault(); tend(e); }, { passive: false });
cv.addEventListener('touchcancel', tend);
$('bScope').addEventListener('touchstart', e => { e.preventDefault(); inp.tog = !inp.tog; }, { passive: false });
$('bReload').addEventListener('touchstart', e => { e.preventDefault(); if (scene === 'play') reload(); }, { passive: false });
$('bMed').addEventListener('touchstart', e => { e.preventDefault(); useItem('med'); }, { passive: false });
$('bBoost').addEventListener('touchstart', e => { e.preventDefault(); useItem(P && P.pack && P.pack.boost > 0 ? 'boost' : 'od'); }, { passive: false });
$('bBomb').addEventListener('touchstart', e => { e.preventDefault(); useItem(P && P.pack && P.pack.bomb > 0 ? 'bomb' : 'flash'); }, { passive: false });
$('bSwap').addEventListener('touchstart', e => { e.preventDefault(); swap(1); }, { passive: false });
$('bFire').addEventListener('touchstart', e => { e.preventDefault(); inp.tfire = true; }, { passive: false });
for (const ev of ['touchend', 'touchcancel']) $('bFire').addEventListener(ev, e => { e.preventDefault(); inp.tfire = false; }, { passive: false });

// ---------- ループ ----------
let last = performance.now();

// ---------- ゲームパッド(Xbox/PS/Switchなど標準配列) ----------
// 左スティック=移動 右スティック=照準 RT=射撃 LT=スコープ(押している間) L3=息止め R3=スコープ切替
// X=装填 Y=次の武器 LB=前の武器 RB=爆弾 B=医療 十字: 上=ブースト 右=解毒 左=閃光 下=戦利品を全部取る A=(戦利品パネルで)全部取る/メニューで決定
function padToast(s) { let el = document.getElementById('padtoast'); if (!el) { el = document.createElement('div'); el.id = 'padtoast'; el.style.cssText = 'position:fixed;left:50%;top:18%;transform:translateX(-50%);z-index:20;background:#0e7490e6;border:2px solid #67e8f9;color:#fff;font:bold 22px monospace;padding:8px 18px;pointer-events:none;display:none'; document.body.appendChild(el); } if (el.textContent !== s) el.textContent = s; el.style.display = s ? 'block' : 'none'; }
function padFocus(bad) { let el = document.getElementById('padfocus'); if (!el) { el = document.createElement('div'); el.id = 'padfocus'; el.style.cssText = 'position:fixed;left:50%;top:40%;transform:translateX(-50%);z-index:21;background:#b91c1cf0;border:2px solid #fecaca;color:#fff;font:bold 20px sans-serif;padding:12px 20px;display:none;text-align:center'; el.textContent = 'ゲーム画面を1回クリックしてください(ブラウザは、選ばれていない画面にはコントローラの入力を渡しません)'; document.body.appendChild(el); } el.style.display = bad ? 'block' : 'none'; }
function padBadge(s) { const el = document.getElementById('padbadge'); if (!el) return; if (el.textContent !== s) el.textContent = s; el.style.display = s ? 'block' : 'none'; }
addEventListener('gamepadconnected', e => padBadge('🎮 コントローラ接続: ' + String(e.gamepad.id).slice(0, 34)));
addEventListener('gamepaddisconnected', () => padBadge(''));
const padSt = { prev: [], on: false, rep: 0, focus: 0, index: -1, debug: false, layout: 'ps4' };
try { padSt.layout = localStorage.getItem('nx_pad_layout') || 'ps4'; } catch (e) { }
addEventListener('keydown', e => { if (e.code === 'F10') { padSt.debug = !padSt.debug; e.preventDefault(); } if (e.code === 'F9') { padSt.layout = padSt.layout === 'ps4' ? 'standard' : 'ps4'; try { localStorage.setItem('nx_pad_layout', padSt.layout); } catch (err) { } toast('コントローラ配列: ' + (padSt.layout === 'ps4' ? 'PS4' : '標準'), 2); e.preventDefault(); } });
const dz = (v, d) => Math.abs(v) < d ? 0 : (v - Math.sign(v) * d) / (1 - d);
function padMenuNav(pad, btn, press) {
  const ov = document.getElementById('ov'); if (!ov || ov.style.display === 'none') return;
  const bs = [...ov.querySelectorAll('button:not([disabled])')].filter(b => b.offsetParent); if (!bs.length) return;
  padSt.focus = Math.max(0, Math.min(bs.length - 1, padSt.focus)); const cur = bs[padSt.focus];
  const dir = (press(13) ? 1 : 0) + (press(15) ? 1 : 0) - (press(12) ? 1 : 0) - (press(14) ? 1 : 0);
  if (dir) padSt.focus = Math.max(0, Math.min(bs.length - 1, padSt.focus + Math.sign(dir)));
  bs.forEach(b => b.classList.remove('padf')); const f = bs[padSt.focus]; f.classList.add('padf'); f.scrollIntoView({ block: 'nearest' });
  if (press(0)) f.click();
  if (press(1)) { const back = bs.find(b => /戻る/.test(b.textContent)); if (back) back.click(); }
}
function pollPad(dt) {
  const pads = Array.from((navigator.getGamepads && navigator.getGamepads()) || []).filter(p => p && p.connected); let pad = null;
  // 接続中は同じ1台を維持。複数台の軸を合成すると仮想パッドが実機を上書きする。
  const active = p => p.buttons.some(b => b && (b.pressed || b.value > .35)) || p.axes.some((v, i) => Math.abs(v) > (p.mapping !== 'standard' && p.axes.length >= 6 && (i === 3 || i === 4 || i >= 9) ? 1.1 : .3));
  const chosen = pads.find(p => p.index === padSt.index) || pads.find(active) || pads[0];
  if (chosen) { if (padSt.index !== chosen.index) { padSt.prev = []; padSt.index = chosen.index; } pad = { index: chosen.index, id: chosen.id, mapping: chosen.mapping, buttons: chosen.buttons.map(b => ({ pressed: b.pressed, value: b.value || 0 })), axes: [...chosen.axes] }; }
  // 非標準配列のPS4系(軸10・ボタン14): 右スティック=軸2,5 / L2,R2=軸3,4(静止-1) / 十字キー=軸9のハット
  if (pad && pad.mapping !== 'standard' && pad.axes.length >= 6) {
    const A = pad.axes, B = pad.buttons.slice(), tr = v => v > -.5, hat = A[9], dir = hat != null && hat < 1.1 ? Math.round((hat + 1) / 2 * 7) : -1;
    const bt = (i, on) => { B[i] = { pressed: !!(B[i] && B[i].pressed) || on, value: on ? 1 : (B[i] ? B[i].value : 0) }; };
    bt(6, tr(A[3])); bt(7, tr(A[4]));
    bt(12, [0, 1, 7].includes(dir)); bt(13, [3, 4, 5].includes(dir)); bt(14, [5, 6, 7].includes(dir)); bt(15, [1, 2, 3].includes(dir));
    pad = Object.assign({}, pad, { axes: [A[0], A[1], A[2], A[5]], buttons: B });
  }
  // 一部の有線PS4パッドは4軸16ボタンだが mapping が空で、四つの顔ボタンが標準と異なる。
  if (pad && padSt.layout === 'ps4' && pad.mapping !== 'standard' && pad.axes.length === 4 && /PS4|DualShock|Wireless Controller/i.test(pad.id)) { const B = pad.buttons.slice(); pad.buttons[0] = B[1] || { pressed: false, value: 0 }; pad.buttons[1] = B[2] || { pressed: false, value: 0 }; pad.buttons[2] = B[0] || { pressed: false, value: 0 }; }
  if (!pad) { padBadge(''); padToast(''); padFocus(false); if (padSt.on) { padSt.on = false; padSt.index = -1; padSt.prev = []; inp.padLs = null; inp.padFire = inp.padScope = inp.padSteady = false; if (inp.rs && inp.rs.pad) inp.rs = null; } return; }
  if (!padSt.on) { padSt.on = true; toast('コントローラ接続', 1.5); }
  { const pr = []; pad.buttons.forEach((x, i) => { if (x.pressed || x.value > .5) pr.push(i); }); padBadge(padSt.debug ? '🎮 ' + String(pad.id).slice(0, 28) + ' | ' + (pad.mapping || '非標準') + ' | 軸' + pad.axes.length + ' ボタン' + pad.buttons.length + ' | 押した: ' + (pr.join(',') || '-') + ' | 軸値: ' + pad.axes.map(v => (+v).toFixed(1)).join(' ') : '🎮 #' + pad.index + '  ' + (padSt.layout === 'ps4' ? 'PS4' : '標準') + ' F9:配列 F10:診断'); }
  const b = i => !!(pad.buttons[i] && pad.buttons[i].pressed), prev = padSt.prev, press = i => b(i) && !prev[i];
  // 入力があったら画面の中央に大きく表示(届いているかどうかが一目で分かる)。ウィンドウにフォーカスが無いとブラウザは入力を渡さない
  { const pr2 = []; pad.buttons.forEach((x, i) => { if (x.pressed || x.value > .5) pr2.push(i); }); const ax = pad.axes.map((v, i) => Math.abs(v) > .4 ? 'axis' + i + (v > 0 ? '+' : '-') : '').filter(Boolean);
    if (pr2.length || ax.length) { padSt.show = 1.2; padSt.txt = 'ボタン ' + (pr2.join(',') || '-') + (ax.length ? '  ' + ax.join(' ') : ''); }
    if (padSt.show > 0) padSt.show -= dt; padToast(padSt.debug && padSt.show > 0 ? padSt.txt : '');
    padFocus(!document.hasFocus() && !!padSt.act && performance.now() - padSt.act < 1200); }
  const lx = dz(pad.axes[0] || 0, .2), ly = dz(pad.axes[1] || 0, .2), rx = dz(pad.axes[2] || 0, .2), ry = dz(pad.axes[3] || 0, .2);
  padSt.sx = lx; padSt.sy = ly;
  if (scene !== 'play') { if (padSt.rep > 0) padSt.rep -= dt; const stickDir = Math.abs(lx) > .6 || Math.abs(ly) > .6; const pr = i => press(i) || (stickDir && padSt.rep <= 0 && (i === 13 ? ly > .6 : i === 12 ? ly < -.6 : i === 15 ? lx > .6 : i === 14 ? lx < -.6 : false)); if (stickDir && padSt.rep <= 0) padSt.rep = .22; padMenuNav(pad, b, pr); if (!stickDir) padSt.rep = 0; padSt.prev = pad.buttons.map(x => x.pressed); return; }
  const lm0 = Math.hypot(lx, ly), rm0 = Math.hypot(rx, ry); if (lm0 > .3 || rm0 > .3 || pad.buttons.some(x => x.pressed)) padSt.act = performance.now(); if (rm0 > .15) P.padDir = Math.atan2(ry, rx); else if (lm0 > .3) P.padDir = Math.atan2(ly, lx);
  const lm = Math.hypot(lx, ly); inp.padLs = lm > 0 ? { x: lx / Math.max(1, lm), y: ly / Math.max(1, lm), mag: Math.min(1, lm) } : null;
  const rm = Math.hypot(rx, ry); if (rm > .15) inp.rs = { x: rx, y: ry, mag: Math.min(1, rm), pad: true }; else if (inp.rs && inp.rs.pad) inp.rs = null;
  inp.padFire = b(7) || (pad.buttons[7] && pad.buttons[7].value > .35); inp.padScope = b(6) || (pad.buttons[6] && pad.buttons[6].value > .35); inp.padSteady = b(10);
  if (press(11)) inp.tog = !inp.tog;
  if (press(2)) reload(); if (press(3)) swap(1); if (press(4)) swap(-1);
  if (press(5)) useItem(P.pack && P.pack.bomb > 0 ? 'bomb' : 'flash'); if (press(1)) useItem('med');
  if (press(12)) useItem(P.pack && P.pack.boost > 0 ? 'boost' : 'od'); if (press(15)) useItem('cure'); if (press(14)) useItem('flash');
  if (press(13) || (press(0) && lootBox)) G.takeAll();
  if (press(9)) G.closeLoot();
  padSt.prev = pad.buttons.map(x => x.pressed);
}
function frame(now) { const dt = Math.min(.05, (now - last) / 1000); last = now; try { pollPad(dt); } catch (err) { padBadge('🎮 エラー: ' + err.message); } if (tsT > 0) tsT -= dt; else ts = 1; try { update(dt * ts); draw(); } catch (err) { if (!frame.err) { frame.err = 1; console.error(err); padBadge('エラー: ' + err.message); } } requestAnimationFrame(frame); }
G.step = (n, dt) => { for (let i = 0; i < n; i++)update(dt || 1 / 60); draw(); };
if (hash.has('stage')) { G.start(+hash.get('stage') || 1); if (hash.has('center')) { P.x = (roadV + .5) * T; P.y = (roadH + .5) * T; cam.x = P.x; cam.y = P.y; } if (hash.has('scope')) { G.botScope = true; } } else showOv('title');
if (hash.has('w')) { const wi = +hash.get('w'); if (scene === 'play') { for (const w of WEAPONS) if (!P.ammo[w.id]) P.ammo[w.id] = { mag: magOf(w), res: w.res }; P.cur = wi; } }
requestAnimationFrame(frame);
