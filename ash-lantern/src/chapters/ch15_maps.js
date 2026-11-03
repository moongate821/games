'use strict';
/* 第15章 maps: C15_ROAD(帰路・屋外)。C14_HEART の出口から西端に着き、東へ向かって新しい村へ(C16_VILLAGE)。
   西端は行き止まり(外周の森)。各地の再訪は V/K/C2_ROAD/C3_PORT の revisit 点へ goto で行く。 */
(function () {
  const A = (id, kind, spec, fb, pr, note) => ({ id, kind, file: 'img/' + id.replace('.', '_') + '.png', spec, status: '未制作', fallback: fb, priority: pr, owner: 'Codex', note });
  registerChapter({
    id: 'c15',
    maps: {
      C15_ROAD: {
        name: '帰り道', w: 44, h: 24, bgm: 'village', dim: 'rgba(255,200,130,.07)',
        ops: [
          ['fill', 'g'], ['scatter', 'f', 0.14, 'g', 37], ['river', 'v', 30, 1.5, 1, 0.3],
          ['road', 1, 11, 42, 11, 2], ['bridge', 27, 11, 33, 12], ['circle', 20, 13, 2, 's'],
          ['border', 2, 'x', [['e', 11, 12, 'p']]]
        ],
        points: { start: [5, 11], west_in: [2, 11], west: [3, 11], east: [40, 11], east_in: [41, 11], rest: [20, 14] },
        layout: {
          gap: { side: 'e', y0: 11, y1: 12 },
          buildings: [{ img: 'bld_hall_front', x: 10, y: 8, flip: false, kind: 'locked' }],
          lamps: [[12, 13], [18, 13], [24, 13], [36, 13], [8, 10]],
          barrels: [[16, 10], [38, 10]],
          signs: [[6, 10], [38, 13]],
          trees: [[4, 6, 120], [18, 5, 126], [24, 19, 118], [34, 18, 122], [38, 5, 128], [8, 19, 114], [16, 21, 110]],
          decor: [{ img: 'furn_well', x: 21, y: 16, scale: 0.3 }, { img: 'furn_flowerpot', x: 16, y: 13, scale: 0.26 }, { img: 'furn_flowerpot', x: 22, y: 13, scale: 0.26 }, { img: 'furn_crate', x: 14, y: 10, scale: 0.3 }]
        }
      }
    },
    warps: [
      { map: 'C15_ROAD', at: [42, 11], to: 'C16_VILLAGE', to_at: 'C16_VILLAGE@west_in', dir: 'right', cond: 'ge:c15_complete' },
      { map: 'C15_ROAD', at: [42, 12], to: 'C16_VILLAGE', to_at: 'C16_VILLAGE@west_in', dir: 'right', cond: 'ge:c15_complete' }
    ],
    assets: [
      { ...A('prop.wayside_bench', 'prop', '96x64・透明。街道の休憩用ベンチ', 'furn_crate', '低', '第15章 帰り道(rest付近)'), status: '調整中' },
      { ...A('prop.road_lantern_row', 'prop', '48x120・透明。道沿いの小さな灯(点灯/消灯)。第15章で街道に灯がともっていく演出用', 'prop_lamp_tall', '中', '第15章 帰り道'), status: '調整中' }
    ]
  });
})();
