'use strict';
/* 第7章 maps: C7_INN(宿・屋内) / C7_HILL(葬送の丘・屋外)。 */
(function () {
  const A = (id, kind, spec, fb, pr, note) => ({ id, kind, file: 'img/' + id.replace('.', '_') + '.png', spec, status: '未制作', fallback: fb, priority: pr, owner: 'Codex', note });
  registerChapter({
    id: 'c7',
    maps: {
      C7_INN: {
        name: '丘のふもとの宿', w: 12, h: 10, indoor: true, bgm: 'home',
        ops: [['fill', 'x'], ['rect', 1, 2, 10, 8, 'o'], ['set', 8, 9, 'd']],
        points: { start: [8, 8], table: [6, 5], seat: [9, 5] },
        layout: {
          wallColor: '#7a5532', windows: [4 * 48 + 6, 9 * 48 + 6], doorX: 8, wall: [{img:'furn_jarshelf_orthogonal',x:6.05,y:17,w:110}], rug: { x: 5.2, y: 3.6, w: 210 },
          furn: [
            { img: 'furn_table_orthogonal', art: 'prop_table_set', x: 7, y: 4, w: 2, h: 2, dw: 118, say: '宿の食卓。皿は並んでいるが、一つだけ手つかずのままだ。' },
            { img: 'furn_chair_orthogonal', x: 6, y: 4, w: 1, h: 1, dw: 35, say: '椅子。' },
            { img: 'furn_chair_orthogonal', x: 9, y: 4, w: 1, h: 1, dw: 35, say: '空いたままの椅子。誰の席か、言わなくても分かる。' },
            { img: 'furn_bookshelf_orthogonal', x: 2, y: 2, w: 2, h: 1, dw: 100, say: '宿帳と、旅人の置いていった本。' },
            { img: 'furn_stove', x: 10, y: 2, w: 1, h: 2, dw: 66, say: '暖炉代わりのストーブ。鍋が静かに煮えている。' },
            { img: 'furn_bed_orthogonal', x: 1, y: 6, w: 2, h: 2, dw: 82, act: 'inn_rest' },
            { img: 'furn_barrel', x: 10, y: 7, w: 1, h: 1, dw: 46, say: '葡萄酒の樽。' }, { img: 'furn_crate', x: 10, y: 8, w: 1, h: 1, dw: 52 },
            { img: 'furn_flowerpot', x: 5, y: 2, w: 1, h: 1, dw: 32 },
            { img: 'furn_chest', x: 1, y: 4, w: 1, h: 1, dw: 44, say: '宿泊客のための毛布が入っている。' }]
        }
      },
      C7_HILL: {
        name: '葬送の丘', w: 40, h: 24, bgm: 'farewell', dim: 'rgba(200,210,255,.10)',
        ops: [
          ['fill', 'g'], ['scatter', 'f', 0.12, 'g', 19], ['circle', 20, 7, 5, 'l'],
          ['road', 1, 14, 38, 14, 2], ['road', 20, 9, 20, 13, 2],
          ['border', 2, 'x', [['w', 14, 15, 'p'], ['e', 14, 15, 'p']]]
        ],
        points: { start: [5, 15], west_in: [2, 14], west: [3, 14], east: [36, 14], east_in: [37, 14], grave: [20, 6], inn_in: [8, 14] },
        layout: {
          gap: { side: 'w', y0: 14, y1: 15 }, gap2: { side: 'e', y0: 14, y1: 15 },
          buildings: [{ img: 'bld_hall_front', x: 6, y: 13, flip: false, door: 8, kind: 'door' }],        // 宿 → C7_INN
          lamps: [[17, 13], [24, 13], [30, 13], [12, 13]],
          barrels: [[13, 16], [27, 13]],
          signs: [[18, 5], [19, 5], [21, 5], [22, 5]],                                                      // 墓標
          trees: [[4, 10, 100], [12, 10, 105], [7, 19, 105], [11, 20, 108], [16, 4, 128], [24, 4, 126], [15, 8, 120], [25, 8, 122], [10, 7, 118], [32, 6, 124], [34, 19, 120], [4, 20, 116], [26, 20, 110]],
          decor: [{ img: 'furn_flowerpot', x: 18, y: 6, scale: 0.26 }, { img: 'furn_flowerpot', x: 22, y: 6, scale: 0.26 }, { img: 'furn_well', x: 12, y: 17, scale: 0.3 }]
        }
      }
    },
    warps: [
      { map: 'C6_VALLEY', at: [42, 13], to: 'C7_HILL', to_at: 'C7_HILL@west_in', dir: 'right', cond: 'ge:c6_complete' },
      { map: 'C6_VALLEY', at: [42, 14], to: 'C7_HILL', to_at: 'C7_HILL@west_in', dir: 'right', cond: 'ge:c6_complete' },
      { map: 'C7_HILL', at: [1, 14], to: 'C6_VALLEY', to_at: 'C6_VALLEY@east_in', dir: 'left' },
      { map: 'C7_HILL', at: [1, 15], to: 'C6_VALLEY', to_at: 'C6_VALLEY@east_in', dir: 'left' },
      { map: 'C7_HILL', at: [8, 13], to: 'C7_INN', to_at: 'C7_INN@start', dir: 'up' },
      { map: 'C7_INN', at: [8, 9], to: 'C7_HILL', to_at: 'C7_HILL@inn_in', dir: 'down' }
    ],
    assets: [
      { ...A('prop.gravestone', 'prop', '48x64・透明。簡素な墓標(石・木の2種、花を添えた差分)', 'prop_sign', '高', '第7章 葬送の丘(18〜22,5)。第16章でも'), status: '調整中' }
    ]
  });
})();
