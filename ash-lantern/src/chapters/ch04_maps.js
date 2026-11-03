'use strict';
/* 第4章 maps: C4_CAPITAL(白灯王都・石畳) / C4_CASTLE(城内・屋内) / C4_ESCAPE(脱出路・洞窟風)。
   王都の城には扉が2つ: 中央(23,6)=C4_CASTLE(牢のある城内) / 右翼(29,6)=C11_HALL(玉座の間。第10章完了後に開く)。 */
(function () {
  const A = (id, kind, spec, fb, pr, note) => ({ id, kind, file: 'img/' + id.replace('.', '_') + '.png', spec, status: '未制作', fallback: fb, priority: pr, owner: 'Codex', note });
  registerChapter({
    id: 'c4',
    maps: {
      C4_CAPITAL: {
        name: '白灯王都', w: 48, h: 28, bgm: 'village', dim: 'rgba(210,225,255,.10)',
        ops: [
          ['fill', 's'], ['rect', 5, 16, 11, 21, 'g'], ['rect', 36, 16, 42, 21, 'g'], ['scatter', 'f', 0.12, 'g', 3],
          ['border', 2, 'x', [['w', 14, 15, 's'], ['e', 14, 15, 's']]]
        ],
        points: { start: [5, 15], west_in: [2, 14], west: [3, 14], east: [44, 14], east_in: [45, 14], square: [23, 15], gate: [23, 8], gate_in: [23, 7], hall_in: [29, 7], escape_in: [23, 24] },
        layout: {
          gap: { side: 'w', y0: 14, y1: 15 }, gap2: { side: 'e', y0: 14, y1: 15 },
          buildings: [
            { img: 'bld_hall_front', x: 21, y: 6, flip: false, door: 23, kind: 'door' },       // 城の正門 → C4_CASTLE
            { img: 'bld_hall_front', x: 27, y: 6, flip: true, door: 29, kind: 'door' },        // 右翼 → C11_HALL(第10章後)
            { img: 'bld_workshop_front', x: 6, y: 10, flip: false, kind: 'locked' }, { img: 'bld_workshop_front', x: 14, y: 10, flip: true, kind: 'locked' },
            { img: 'bld_workshop_front', x: 32, y: 10, flip: false, kind: 'locked' }, { img: 'bld_hall_front', x: 40, y: 10, flip: true, kind: 'locked' },
            { img: 'bld_hall_front', x: 14, y: 23, flip: false, kind: 'locked' }, { img: 'bld_workshop_front', x: 28, y: 23, flip: true, kind: 'locked' }],
          lamps: [[21, 10], [26, 10], [21, 18], [26, 18], [12, 14], [35, 14], [21, 25], [26, 25]],
          barrels: [[16, 9], [31, 9], [20, 21]],
          signs: [[18, 14], [29, 14]],
          trees: [[7, 17, 120], [10, 19, 130], [38, 17, 118], [41, 20, 128], [6, 20, 110], [9, 17, 112], [40, 18, 114]],
          decor: [{ img: 'furn_well', x: 25, y: 16, scale: 0.3 }, { img: 'furn_flowerpot', x: 21, y: 8, scale: 0.26 }, { img: 'furn_flowerpot', x: 26, y: 8, scale: 0.26 },
            { img: 'furn_flowerpot', x: 8, y: 16, scale: 0.26 }, { img: 'furn_flowerpot', x: 39, y: 16, scale: 0.26 }]
        }
      },
      C4_CASTLE: {
        name: '白灯の城', w: 18, h: 12, indoor: true, bgm: 'home', skin: { o: 's' }, dim: 'rgba(200,215,255,.06)',
        ops: [['fill', 'x'], ['rect', 1, 2, 16, 10, 'o'], ['set', 9, 11, 'd']],
        points: { start: [9, 10], throne: [9, 3], cell: [15, 3], cell_door: [16, 5], hatch: [15, 2] },
        layout: {
          wallColor: '#8a8f9c', windows: [2 * 48 + 6, 6 * 48 + 6, 11 * 48 + 6], doorX: 9, rug: { x: 7.7, y: 3.3, w: 200 },
          furn: [
            { img: 'furn_chair_orthogonal', x: 9, y: 2, w: 1, h: 1, dw: 70, say: '玉座。誰も座っていない。肘掛けに、灯火炉と同じ紋が刻まれている。' },
            { img: 'furn_bookshelf_orthogonal', x: 3, y: 2, w: 2, h: 1, dw: 100, say: '回収記録の写しが並んでいる。村の名前の多くに、斜線が引かれている。' },
            { img: 'furn_bookshelf_orthogonal', x: 12, y: 2, w: 2, h: 1, dw: 100, say: '灯火炉の図面。過負荷の印が赤く塗られている。' },
            { img: 'furn_table_orthogonal', x: 4, y: 6, w: 2, h: 2, dw: 118, say: '評議の長い机。地図の上に、灯火炉の駒が置かれている。' },
            { img: 'furn_table_orthogonal', x: 12, y: 6, w: 2, h: 2, dw: 118, say: '書類が積んである。署名はどれも同じ筆跡だ。' },
            { img: 'furn_fence', x: 14, y: 5, w: 2, h: 1, dw: 100, say: '牢の格子。' }]
        }
      },
      C4_ESCAPE: {
        name: '城の脱出路', w: 20, h: 13, indoor: true, bgm: 'dusk', skin: { o: 'r' }, dim: 'rgba(0,0,30,.42)',
        ops: [['fill', 'x'], ['rect', 1, 2, 18, 11, 'o'], ['set', 10, 12, 'd']],
        points: { start: [10, 3], exit: [10, 11] },
        layout: {
          wallColor: '#33323b', windows: [], doorX: 10,
          furn: [
            { img: 'furn_crate', x: 5, y: 5, w: 1, h: 1, dw: 52, say: '古い荷箱。' }, { img: 'furn_crate', x: 5, y: 6, w: 1, h: 1, dw: 52 },
            { img: 'furn_crate', x: 14, y: 5, w: 1, h: 1, dw: 52 }, { img: 'furn_crate', x: 14, y: 6, w: 1, h: 1, dw: 52, say: '蓋に王家の紋。中は空だ。' },
            { img: 'furn_crate', x: 7, y: 8, w: 1, h: 1, dw: 52 }, { img: 'furn_crate', x: 12, y: 8, w: 1, h: 1, dw: 52 },
            { img: 'furn_barrel', x: 16, y: 8, w: 1, h: 1, dw: 46, say: '湿った樽。' }, { img: 'furn_barrel', x: 3, y: 9, w: 1, h: 1, dw: 46 },
            { img: 'furn_lantern', x: 6, y: 3, w: 1, h: 1, dw: 30, say: '壁の釘に掛かったランタン。まだ火が入っている。' }, { img: 'furn_lantern', x: 14, y: 3, w: 1, h: 1, dw: 30 }]
        }
      }
    },
    warps: [
      { map: 'C4_CAPITAL', at: [23, 6], to: 'C4_CASTLE', to_at: 'C4_CASTLE@start', dir: 'up' },
      { map: 'C4_CASTLE', at: [9, 11], to: 'C4_CAPITAL', to_at: 'C4_CAPITAL@gate_in', dir: 'down' },
      { map: 'C4_CASTLE', at: [15, 2], to: 'C4_ESCAPE', to_at: 'C4_ESCAPE@start', dir: 'down', cond: 'ge:c4_caught' },
      { map: 'C4_ESCAPE', at: [10, 12], to: 'C4_CAPITAL', to_at: 'C4_CAPITAL@escape_in', dir: 'down', cond: 'ge:c4_escape' },
      { map: 'C3_PORT', at: [42, 12], to: 'C4_CAPITAL', to_at: 'C4_CAPITAL@west_in', dir: 'right', cond: 'ge:c3_complete' },
      { map: 'C3_PORT', at: [42, 13], to: 'C4_CAPITAL', to_at: 'C4_CAPITAL@west_in', dir: 'right', cond: 'ge:c3_complete' },
      { map: 'C4_CAPITAL', at: [1, 14], to: 'C3_PORT', to_at: 'C3_PORT@east_in', dir: 'left' },
      { map: 'C4_CAPITAL', at: [1, 15], to: 'C3_PORT', to_at: 'C3_PORT@east_in', dir: 'left' }
    ],
    assets: [
      { ...A('tile.royal_stone', 'tile', '192x192・4x4の継ぎ目なし。白い磨かれた石畳(王都)', 'tile_stone', '中', '第4章 王都の広場・城内の床'), status: '調整中' },
      { ...A('bld.castle_gate', 'bld', '幅8タイル(384px)・高さ約5タイル・透明・正面寄り俯瞰。白い城の正門(中央に扉)', 'bld_hall_front', '高', '第4章 王都の城(正門 23,6)と第11章の右翼(29,6)'), status: '調整中' },
      { ...A('prop.prison_bars', 'prop', '幅2タイル(96px)・高さ64px・透明。牢の鉄格子(開口部の戸つき)', 'furn_fence', '中', '第4章 城内の牢(cell)'), status: '調整中' },
      { ...A('prop.hatch', 'prop', '48x48・透明。床の隠し戸(開いた状態の差分あり)', 'furn_crate', '中', '第4章 牢の床の脱出口(15,2)'), status: '調整中' },
      { ...A('tile.cave_floor', 'tile', '192x192・4x4の継ぎ目なし。暗い岩の洞窟床', 'tile_gravel', '高', '第4・5・9・13章の洞窟風マップ(skin o→r で代用中)'), status: '調整中' }
    ]
  });
})();
