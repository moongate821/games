'use strict';
/* 第8章 maps: C8_OBS(砂の観測所・屋外) / C8_LAB(観測室・屋内)。 */
(function () {
  const A = (id, kind, spec, fb, pr, note) => ({ id, kind, file: 'img/' + id.replace('.', '_') + '.png', spec, status: '未制作', fallback: fb, priority: pr, owner: 'Codex', note });
  registerChapter({
    id: 'c8',
    maps: {
      C8_OBS: {
        name: '砂の観測所', w: 40, h: 26, bgm: 'village', dim: 'rgba(255,215,140,.12)',
        ops: [
          ['fill', 'a'], ['circle', 8, 6, 3, 'l'], ['circle', 31, 20, 4, 'l'], ['circle', 10, 21, 3, 'l'],
          ['road', 1, 14, 38, 14, 2], ['road', 19, 10, 19, 13, 2],
          ['border', 2, 'x', [['w', 14, 15, 'p'], ['e', 14, 15, 'p']]]
        ],
        points: { start: [5, 15], west_in: [2, 14], west: [3, 14], east: [36, 14], east_in: [37, 14], gate: [20, 10], door_in: [19, 10] },
        layout: {
          gap: { side: 'w', y0: 14, y1: 15 }, gap2: { side: 'e', y0: 14, y1: 15 },
          buildings: [{ img: 'bld_hall_front', x: 17, y: 9, flip: false, door: 19, kind: 'door' }],        // 観測所 → C8_LAB
          lamps: [[16, 12], [23, 12], [10, 13], [30, 13]],
          barrels: [[16, 11], [23, 11]],
          signs: [[18, 12]],
          trees: [[6, 19, 100], [32, 6, 96], [36, 19, 104]],
          decor: [{ img: 'furn_crate', x: 15, y: 11, scale: 0.32 }, { img: 'furn_crate', x: 24, y: 11, scale: 0.3 }, { img: 'furn_well', x: 28, y: 12, scale: 0.3 }]
        }
      },
      C8_LAB: {
        name: '観測室', w: 16, h: 11, indoor: true, bgm: 'home', skin: { o: 's' }, dim: 'rgba(120,150,210,.10)',
        ops: [['fill', 'x'], ['rect', 1, 2, 14, 9, 'o'], ['set', 8, 10, 'd']],
        points: { start: [8, 9], console: [9, 4] },
        layout: {
          wallColor: '#5d6577', windows: [3 * 48 + 6, 11 * 48 + 6], doorX: 8,
          // 観測装置と机の足元を通行不可にし、中央通路を確保。
          furn: [
            { img:'furn_bench_orthogonal', x:6, y:3, w:4, h:1, dw:156, say:'観測装置。灯火の波形が細い線で刻まれ続けている。' },
            { img:'furn_bookshelf_orthogonal', x:1, y:3, w:2, h:1, dw:100, say:'日付と場所の札が並ぶ観測記録の棚。' },
            { img:'furn_bookshelf_orthogonal', x:13, y:3, w:2, h:1, dw:100, say:'各地の灯火炉と声の反響を測った記録。' },
            { img:'furn_table_orthogonal', x:2, y:6, w:3, h:2, dw:118, say:'星図と実験記録を広げた机。' },
            { img:'furn_table_orthogonal', x:11, y:6, w:3, h:2, dw:118, say:'望遠鏡と標本を使う観測机。' }
          ]
        }
      }
    },
    warps: [
      { map: 'C7_HILL', at: [38, 14], to: 'C8_OBS', to_at: 'C8_OBS@west_in', dir: 'right', cond: 'ge:c7_complete' },
      { map: 'C7_HILL', at: [38, 15], to: 'C8_OBS', to_at: 'C8_OBS@west_in', dir: 'right', cond: 'ge:c7_complete' },
      { map: 'C8_OBS', at: [1, 14], to: 'C7_HILL', to_at: 'C7_HILL@east_in', dir: 'left' },
      { map: 'C8_OBS', at: [1, 15], to: 'C7_HILL', to_at: 'C7_HILL@east_in', dir: 'left' },
      { map: 'C8_OBS', at: [19, 9], to: 'C8_LAB', to_at: 'C8_LAB@start', dir: 'up', cond: 'ge:c8_lab' },
      { map: 'C8_LAB', at: [8, 10], to: 'C8_OBS', to_at: 'C8_OBS@door_in', dir: 'down' }
    ],
    assets: [
      { ...A('bld.observatory', 'bld', '幅6タイル相当・高さ約6タイル・透明・正面寄り俯瞰。砂に半ば埋もれた円筒形の観測塔(ドームと計器)', 'bld_hall_front', '高', '第8章 砂の観測所(17,9)'), status: '調整中' },
      { ...A('prop.observation_console', 'prop', '144x96・透明。結晶と針の計器が並ぶ観測卓(起動/停止の2差分)', 'furn_bench_orthogonal', '中', '第8章 観測室(C8_LAB)'), status: '調整中' },
      { ...A('prop.dune_rock', 'prop', '72x56・透明。砂に半分埋もれた風化した岩', 'prop_tree', '低', '第8章 砂漠の景観(第2章の街道にも流用)'), status: '調整中' }
    ]
  });
})();
