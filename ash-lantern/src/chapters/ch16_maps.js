'use strict';
/* 第16章 maps: C16_VILLAGE(新しい炉がともる村) / C16_TABLE(食卓・屋内)。
   新しい炉は decor の大きなランタン(20,14)で仮表示(専用の描画は統括役に依頼: 報告参照)。 */
(function () {
  const A = (id, kind, spec, fb, pr, note) => ({ id, kind, file: 'img/' + id.replace('.', '_') + '.png', spec, status: '未制作', fallback: fb, priority: pr, owner: 'Codex', note });
  registerChapter({
    id: 'c16',
    maps: {
      C16_VILLAGE: {
        name: '灯守村(新しい炉)', w: 40, h: 28, bgm: 'village', dim: 'rgba(255,205,140,.07)',
        ops: [
          ['fill', 'g'], ['scatter', 'f', 0.12, 'g', 7],
          ['road', 2, 13, 38, 13, 2], ['road', 19, 2, 19, 25, 2], ['road', 14, 10, 14, 12, 1], ['circle', 20, 14, 5, 's'],
          ['border', 2, 'x', [['w', 13, 14, 'p']]]
        ],
        points: { start: [8, 14], west_in: [2, 13], west: [3, 13], furnace: [20, 16], table_door: [14, 10] },
        layout: {
          gap: { side: 'w', y0: 13, y1: 14 },
          buildings: [
            { img: 'bld_workshop_front', x: 12, y: 9, flip: false, door: 14, kind: 'door' },       // 食卓の家 → C16_TABLE
            { img: 'bld_hall_front', x: 26, y: 9, flip: true, kind: 'locked' },
            { img: 'bld_hall_front', x: 10, y: 19, flip: true, kind: 'locked' }, { img: 'bld_workshop_front', x: 28, y: 19, flip: true, kind: 'locked' }],
          lamps: [[17, 11], [23, 11], [17, 17], [23, 17], [11, 12], [30, 12]],
          barrels: [[10, 12], [29, 12], [12, 16]],
          signs: [[16, 15]],
          trees: [[4, 6, 120], [35, 6, 126], [4, 23, 112], [35, 23, 118], [22, 4, 124], [16, 24, 110]],
          decor: [{ img: 'furn_lantern', x: 20, y: 14, scale: 0.5 }, { img: 'furn_flowerpot', x: 13, y: 11, scale: 0.26 }, { img: 'furn_flowerpot', x: 15, y: 11, scale: 0.26 },
            { img: 'furn_well', x: 24, y: 16, scale: 0.3 }, { img: 'furn_crate', x: 31, y: 15, scale: 0.3 }]
        }
      },
      C16_TABLE: {
        name: '灯りのある食卓', w: 12, h: 10, indoor: true, bgm: 'home', dim: 'rgba(255,200,130,.06)',
        ops: [['fill', 'x'], ['rect', 1, 2, 10, 8, 'o'], ['set', 8, 9, 'd']],
        points: { start: [8, 8], table: [8, 6] },
        layout: {
          wallColor: '#7a5532', windows: [4 * 48 + 6, 9 * 48 + 6], doorX: 8, wall: [{img:'furn_jarshelf_orthogonal',x:6.05,y:17,w:110}], rug: { x: 5.4, y: 3.2, w: 200 },
          furn: [
            { img: 'furn_table_orthogonal', x: 7, y: 4, w: 2, h: 2, dw: 118, say: '大きな食卓。皿が並んでいる。どれも温かい湯気をのぼらせている。' },
            { img: 'furn_chair_orthogonal', x: 6, y: 4, w: 1, h: 1, dw: 35 }, { img: 'furn_chair_orthogonal', x: 6, y: 5, w: 1, h: 1, dw: 35 },
            { img: 'furn_chair_orthogonal', x: 9, y: 4, w: 1, h: 1, dw: 35 },
            { img: 'furn_chair_orthogonal', x: 9, y: 5, w: 1, h: 1, dw: 35, say: '空席。皿は置かれたまま、誰も座らない。それでいい。' },
            { img: 'furn_chair_orthogonal', x: 7, y: 3, w: 1, h: 1, dw: 35 }, { img: 'furn_chair_orthogonal', x: 8, y: 3, w: 1, h: 1, dw: 35, say: '新しい人の席。新しい皿が置いてある。' },
            { img: 'furn_stove', x: 10, y: 2, w: 1, h: 2, dw: 66, say: '鍋が煮えている。ガルドの味に近づけようとした跡がある。' },
            { img: 'furn_bookshelf_orthogonal', x: 2, y: 2, w: 2, h: 1, dw: 100, say: '修理記録の束。最初の一冊は、日付が妹の命日になっている。' },
            { img: 'furn_chest', x: 2, y: 5, w: 1, h: 1, dw: 44, say: '器や食卓の布がしまってある。' },
            { img: 'furn_flowerpot', x: 1, y: 4, w: 1, h: 1, dw: 32 }, { img: 'furn_barrel', x: 2, y: 7, w: 1, h: 1, dw: 46 }, { img: 'furn_crate', x: 10, y: 7, w: 1, h: 1, dw: 52 }]
        }
      }
    },
    warps: [
      { map: 'C16_VILLAGE', at: [1, 13], to: 'C15_ROAD', to_at: 'C15_ROAD@east_in', dir: 'left' },
      { map: 'C16_VILLAGE', at: [1, 14], to: 'C15_ROAD', to_at: 'C15_ROAD@east_in', dir: 'left' },
      { map: 'C16_VILLAGE', at: [14, 9], to: 'C16_TABLE', to_at: 'C16_TABLE@start', dir: 'up' },
      { map: 'C16_TABLE', at: [8, 9], to: 'C16_VILLAGE', to_at: 'C16_VILLAGE@table_door', dir: 'down' }
    ],
    assets: [
      { ...A('prop.new_furnace', 'prop', '192x288・透明。村に新しくともった分散型の炉(小さな塔と大きなランタン、点灯/揺らぎの差分)。村の目印として V の炉より少し小ぶり', 'furn_lantern', '高', '第16章 furnace(20,16)。通常画像を接続、揺らぎ差分は未制作'), status: '調整中' },
      { ...A('prop.table_set', 'prop', '240x160・透明。皿とパンと鍋が並んだ食卓(空席の皿/新しい皿の差分)', 'furn_table_orthogonal', '高', '第16章 C16_TABLE(7,4)。通常画像を接続、皿の差分は未制作'), status: '調整中' },
      { ...A('bld.table_house', 'bld', '幅6タイル相当・透明。窓に灯りのともる、食卓のある家', 'bld_workshop_front', '中', '第16章 (12,9)'), status: '調整中' }
    ]
  });
})();
