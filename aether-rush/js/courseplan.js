// 開発用: 生成する17本の設計(残りの3本は course.js の手作り)。slot は一覧での順番(1〜20)
const base = { ax: 1.0, az: 0.7, amp: 0.2, elev: 0.03, nBoost: 4, nRec: 1, halfW: 32 };
const P = (o) => ({ ...base, ...o });

export const PLAN = [
  // CUP 1 RUSH ― 広いカーブ中心。ジャンプ1回、滑る所はひかえめ
  P({ slot: 2, id: 'sunset', name: 'SUNSET BOULEVARD', jp: 'サンセット大通り', style: 'city', pal: 'citySunset', desc: '夕焼けの高架。広いカーブが続く入門コース。ジャンプ台が1つ。', seed: 2, len: 10500, harm: [2, 3, 4], amp: 0.2, minR: 330, nGap: 1, nSlip: 0 }),
  P({ slot: 4, id: 'frost', name: 'FROSTLINE', jp: 'フロストライン', style: 'ice', pal: 'iceBlue', desc: '氷原を走る。途中に凍った路面があり、ハンドルが効きにくくなる。', seed: 4, len: 10000, harm: [2, 3, 4], amp: 0.22, minR: 320, nGap: 1, nSlip: 1 }),
  P({ slot: 5, id: 'cyber', name: 'CYBER LOOP', jp: 'サイバーループ', style: 'city', pal: 'cityCyber', desc: '緑のネオンのうねる周回路。ジャンプ2回、滑る区間1つ。', seed: 5, len: 11000, harm: [2, 3, 4, 5], amp: 0.22, minR: 300, nGap: 2, nSlip: 1 }),
  // CUP 2 TWIST ― 連続カーブとシケイン、滑る区間が増える
  P({ slot: 7, id: 'mesa', name: 'MESA TWISTER', jp: 'メサ・ツイスター', style: 'canyon', pal: 'canyonMars', desc: '赤い岩山をぬう連続カーブ。ジャンプ2回。', seed: 7, len: 11500, harm: [2, 3, 4, 5], amp: 0.26, minR: 250, nGap: 2, nSlip: 1, elev: 0.04 }),
  P({ slot: 8, id: 'oil', name: 'OILSLICK DOWNTOWN', jp: 'オイルスリック・ダウンタウン', style: 'city', pal: 'neonVoid', desc: '路面にオイルがこぼれた街中。紫の筋の上では滑る。3か所。', seed: 8, len: 11000, harm: [2, 3, 4, 5, 6], amp: 0.27, minR: 240, nGap: 2, nSlip: 3 }),
  P({ slot: 9, id: 'switch', name: 'GLACIER SWITCHBACK', jp: 'グレイシャー・スイッチバック', style: 'ice', pal: 'iceMagenta', desc: '氷河の九十九折り。凍った路面が4か所、急カーブの前後にもある。', seed: 9, len: 12000, harm: [2, 3, 4, 5, 6], amp: 0.28, minR: 230, nGap: 1, nSlip: 4, elev: 0.045 }),
  P({ slot: 10, id: 'ridge', name: 'DUSK RIDGE', jp: 'ダスク・リッジ', style: 'canyon', pal: 'canyonDusk', desc: '夕暮れの尾根道。高低差が大きく、ジャンプ2回。', seed: 10, len: 12000, harm: [2, 3, 4, 5], amp: 0.27, minR: 240, nGap: 2, nSlip: 2, elev: 0.05 }),
  // CUP 3 SLICK ― 低速のヘアピン、連続ジャンプ、滑る区間
  P({ slot: 11, id: 'hairpin', name: 'MIDNIGHT HAIRPIN', jp: 'ミッドナイト・ヘアピン', style: 'city', pal: 'cityNight', desc: '深夜の街のヘアピン連続。ドリフトとブレーキの使い分けが勝負。', seed: 11, len: 12500, harm: [2, 3, 4, 5, 6, 7], amp: 0.3, minR: 190, nGap: 2, nSlip: 2 }),
  { kind: 'eight', slot: 12, id: 'bridges', name: 'TWIN BRIDGES', jp: 'ツイン・ブリッジ', style: 'city', pal: 'cityCyber', desc: '8の字の立体交差。橋の上でも下でもジャンプ台が待っている。', seed: 12, cx: 1500, r: 700, bridge: 150, minR: 330, nGap: 2, nSlip: 2, nBoost: 4, nRec: 1, halfW: 32, len: 10500, maxSlope: 14 },
  P({ slot: 13, id: 'slick', name: 'SLICK CITY RUSH', jp: 'スリック・シティ・ラッシュ', style: 'city', pal: 'citySunset', desc: '滑る路面が4か所。ジャンプも3回あるので、着地後の姿勢に注意。', seed: 13, len: 12000, harm: [2, 3, 4, 5, 6], amp: 0.28, minR: 200, nGap: 3, nSlip: 4 }),
  P({ slot: 14, id: 'redrun', name: 'RED CANYON RUN', jp: 'レッド・キャニオン・ラン', style: 'canyon', pal: 'canyonMars', desc: '谷底を駆ける高速コース。ジャンプ3回、岩肌の連続カーブ。', seed: 14, len: 13000, harm: [2, 3, 4, 5, 6], amp: 0.27, minR: 200, nGap: 3, nSlip: 2, elev: 0.05 }),
  P({ slot: 15, id: 'abyss', name: 'BLUE ABYSS', jp: 'ブルー・アビス', style: 'ice', pal: 'iceBlue', desc: '深い青の氷の谷。凍った路面が4か所、ジャンプ2回。', seed: 15, len: 12500, harm: [2, 3, 4, 5, 6], amp: 0.28, minR: 200, nGap: 2, nSlip: 4, elev: 0.05 }),
  // CUP 4 ZENITH ― 最高難度
  P({ slot: 16, id: 'labyrinth', name: 'NEON LABYRINTH', jp: 'ネオン・ラビリンス', style: 'city', pal: 'neonVoid', desc: '入り組んだ赤いネオンの迷路。ヘアピン、ジャンプ3回、オイル3か所。', seed: 16, len: 13000, harm: [2, 3, 4, 5, 6, 7], amp: 0.32, minR: 160, nGap: 3, nSlip: 3, nRec: 2 }),
  P({ slot: 17, id: 'dunes', name: 'DEADLINE DUNES', jp: 'デッドライン・デューンズ', style: 'canyon', pal: 'canyonDusk', desc: '砂丘と岩の難コース。長いジャンプと急カーブが交互に来る。', seed: 17, len: 13500, harm: [2, 3, 4, 5, 6, 7], amp: 0.32, minR: 165, nGap: 3, nSlip: 3, elev: 0.05, nRec: 2 }),
  P({ slot: 18, id: 'cascade', name: 'CRYO CASCADE', jp: 'クライオ・カスケード', style: 'ice', pal: 'iceMagenta', desc: '凍った路面が5か所。高低差の大きい氷の滝コース。', seed: 18, len: 13000, harm: [2, 3, 4, 5, 6, 7], amp: 0.31, minR: 165, nGap: 3, nSlip: 4, elev: 0.055, nRec: 2 }),
  { kind: 'eight', slot: 19, id: 'helix', name: 'DOUBLE HELIX', jp: 'ダブル・ヘリックス', style: 'city', pal: 'cityNight', desc: '大きな8の字。高い橋の上は滑りやすく、ジャンプが3回。', seed: 19, cx: 1700, r: 600, bridge: 190, minR: 260, nGap: 3, nSlip: 3, nBoost: 4, nRec: 1, halfW: 32, len: 11500, maxSlope: 15 },
  P({ slot: 20, id: 'zenith', name: 'AETHER ZENITH', jp: 'エーテル・ゼニス', style: 'city', pal: 'cityCyber', desc: '最後のコース。全長最長、ヘアピン・ジャンプ3回・滑る路面4か所の総決算。', seed: 20, len: 14500, harm: [2, 3, 4, 5, 6, 7], amp: 0.33, minR: 155, nGap: 3, nSlip: 4, elev: 0.055, nRec: 2 }),
];
