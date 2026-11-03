'use strict';
/* 配置データ(見た目担当が編集する場所)。座標はタイル単位(左上が 0,0)。
   描画と当たり判定は game.js が読んで作る。ここを変えても進行(イベント・フラグ)には影響しない。
   ■ 変更したら必ず: ブラウザで村と工房を歩き、建物・家具・木の「見た目の接地」と「通れない範囲」が合っているか、
     入口(村 12,9 → 工房 6,8)と鈴(工房の机)・道具(作業台)に行けるかを確認する。
   ■ 建物: x,y は「足元の左端タイル」。幅6タイル・奥行2タイル(y-1〜y)が通れなくなる。door は扉のタイル x(通れる)。
   ■ 木(trees)・樽・街灯・看板は1タイル分が通れなくなる。道の上(村の茶色い道)には置かない。
   ■ 家具(furn): x,y,w,h = 通れなくなるタイル範囲、dw = 描画する横幅(px)、dy = 前後の並びの微調整(px)、
     flip = 左右反転、overlay = 上に載せる物(game.js の OVERLAYS の名前)、
     act = 調べたときの動作(game.js の ACTS の名前)。家具を動かすと、調べられる位置も x,y,w,h に合わせて自動で動く。
   ■ 確認: ブラウザのコンソールで `__g.checkLayout()` を実行すると、調べる対象・出入口・イベント位置に歩いて行けるか、
     木や街灯が水や道にかかっていないかを自動で点検して一覧を返す。空の配列なら問題なし。 */
const LAYOUT = {
  K: {   // 川霧の町(第1章)。gap=外周の森をあけて道を通す所
    gap: { side: 'w', y0: 4, y1: 9 }, gap2: { side: 'e', y0: 6, y1: 7 },   // 東の出口は第2章へ
    buildings: [
      { img: 'bld_workshop_front', x: 5, y: 5, flip: false, kind: 'talk', story: 'c1_childhouse_door' },
      { img: 'bld_hall_front', x: 14, y: 5, flip: false, kind: 'locked' },
      { img: 'bld_hall_front', x: 29, y: 5, flip: true, kind: 'talk', story: 'c1_elderhouse_door' },
      { img: 'bld_workshop_front', x: 23, y: 19, flip: false, kind: 'talk', story: 'c1_clinic_door' },
      { img: 'bld_hall_front', x: 8, y: 19, flip: true, kind: 'locked' }
    ],
    lamps: [[3, 8], [12, 8], [23, 8], [36, 5], [19, 17], [22, 17], [31, 23]],
    barrels: [[10, 8], [27, 8], [6, 22], [34, 22]],
    signs: [],
    trees: [[4, 15, 130], [9, 16, 120], [13, 15, 140], [30, 15, 126], [34, 16, 140], [37, 15, 118], [16, 24, 120], [34, 24, 144], [12, 3, 118], [36, 4, 126]],
    decor: []
  },
  V: {
    gap: { side: 'e', y0: 11, y1: 15},
    buildings: [
      { img: 'bld_workshop_front', x: 10, y: 9, flip: false, door: 12, kind: 'workshop' },
      { img: 'bld_hall_front', x: 25, y: 8, flip: false, kind: 'hall' },
      { img: 'bld_workshop_front', x: 26, y: 20, flip: true, kind: 'locked' },
      { img: 'bld_hall_front', x: 10, y: 20, flip: true, kind: 'locked' }
    ],
    lamps: [[17, 10], [23, 10], [17, 18], [23, 18], [11, 10], [26, 9], [8, 12], [8, 15], [35, 11]],
    barrels: [[9, 9], [16, 9], [24, 9], [9, 19], [25, 19]],
    signs: [[31, 11], [31, 16]],
    trees: [[3, 6, 118], [3, 21, 145], [34, 6, 126], [34, 21, 150], [15, 22, 116], [30, 24, 140], [22, 4, 120], [16, 4, 146], [36, 10, 118], [36, 17, 144]],
    // 工房の鉢と民家脇の収納。通路・出入口・イベント位置には置かない。
    decor: [
      { img: 'furn_flowerpot', x: 9, y: 10, scale: 0.28 },
      { img: 'furn_crate', x: 32, y: 19, scale: 0.32 },
      { img: 'furn_flowerpot', x: 9, y: 20, scale: 0.26 },
      { img: 'furn_flowerpot', x: 24, y: 20, scale: 0.26 }
    ]
  },
  W: {
    rug: { x: 6.2, y: 5.35, w: 180 },
    wall: [
      { img: 'furn_jarshelf_orthogonal', x: 1.0, y: 14, w: 100 },
      { img: 'furn_toolrack_orthogonal', x: 8.08, y: 6, w: 120 }
    ],
    furn: [
      { img: 'furn_bookshelf_orthogonal', x: 4, y: 2, w: 2, h: 1, dw: 100, act: 'shelf' },
      { img: 'furn_table_orthogonal', x: 2, y: 2, w: 2, h: 2, dw: 118, overlay: 'bell', act: 'bell' },
      { img: 'furn_bench_orthogonal', x: 8, y: 2, w: 3, h: 2, dw: 156, overlay: 'kit', act: 'kit' },
      { img: 'furn_stove', x: 12, y: 2, w: 1, h: 2, dw: 66, overlay: 'stove', act: 'stove' },
      { img: 'furn_flowerpot', x: 1, y: 4, w: 1, h: 1, dw: 32 },
      { img: 'furn_bed_orthogonal', x: 1, y: 6, w: 2, h: 2, dw: 82, act: 'bed' },
      { img: 'furn_table_orthogonal', x: 8, y: 6, w: 2, h: 1, dw: 104, overlay: 'lantern', act: 'table' },
      { img: 'furn_chair_orthogonal', x: 7, y: 6, w: 1, h: 1, dw: 35 },
      { img: 'furn_crate', x: 12, y: 6, w: 1, h: 1, dw: 52, act: 'crate' },
      { img: 'furn_barrel', x: 11, y: 7, w: 1, h: 1, dw: 46, act: 'barrel' },
      { img: 'furn_chest', x: 12, y: 7, w: 1, h: 1, dw: 50, act: 'chest' }
    ]
  }
};
