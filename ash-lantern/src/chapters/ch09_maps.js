'use strict';
/* 第9章 maps: C9_GATE(海辺・屋外) / C9_RUIN(海底遺跡・洞窟風の屋内)。 */
(function () {
  const A = (id, kind, spec, fb, pr, note) => ({ id, kind, file: 'img/' + id.replace('.', '_') + '.png', spec, status: '未制作', fallback: fb, priority: pr, owner: 'Codex', note });
  registerChapter({
    id: 'c9',
    maps: {
      C9_GATE: {
        name: '灯台の入り江', w: 40, h: 24, bgm: 'village', dim: 'rgba(110,200,230,.10)',
        ops: [
          ['fill', 'a'],
          ['rect', 0, 15, 39, 23, 'w'],                                      // 海
          ['road', 1, 10, 38, 10, 2], ['road', 19, 12, 19, 14, 2], ['rect', 19, 15, 20, 20, 'b'],   // 桟橋(先端から潜る)
          ['border', 2, 'x', [['w', 10, 11, 'p'], ['e', 10, 11, 'p'], ['s', 0, 39, 'w']]]
        ],
        points: { start: [5, 11], west_in: [2, 10], west: [3, 10], east: [36, 10], east_in: [37, 10], dive: [20, 19] },
        layout: {
          border: 'none', gap: { side: 'w', y0: 10, y1: 11 }, gap2: { side: 'e', y0: 10, y1: 11 },
          buildings: [{ img: 'bld_hall_front', x: 8, y: 6, flip: false, kind: 'locked' }, { img: 'bld_workshop_front', x: 28, y: 6, flip: true, kind: 'locked' }],
          lamps: [[17, 13], [22, 13], [10, 12], [30, 12]],
          barrels: [[15, 12], [24, 12]],
          signs: [[18, 12]],
          trees: [[4, 5, 110], [34, 4, 112], [14, 3, 100], [3, 13, 104]],
          decor: [{ img: 'furn_crate', x: 26, y: 12, scale: 0.32 }, { img: 'furn_crate', x: 27, y: 12, scale: 0.3 }, { img: 'furn_flowerpot', x: 7, y: 8, scale: 0.26 }]
        }
      },
      C9_RUIN: {
        name: '海底の灯台', w: 24, h: 14, indoor: true, bgm: 'dusk', skin: { o: 's' }, dim: 'rgba(0,60,95,.5)',
        ops: [['fill', 'x'], ['rect', 1, 2, 22, 12, 'o'], ['set', 12, 13, 'd']],
        points: { start: [12, 12], deep: [12, 3], lamp: [12, 5] },
        layout: {
          wallColor: '#1f3d4a', windows: [], doorX: 12,
          furn: [
            { img: 'furn_lantern', x: 12, y: 4, w: 1, h: 1, dw: 64, say: '古い灯台の灯。海の底でなお、消えずに揺れている。' },
            { img: 'furn_fence', x: 6, y: 8, w: 3, h: 1, dw: 150, say: '崩れた石の欄干。藻が絡んでいる。' }, { img: 'furn_fence', x: 15, y: 8, w: 3, h: 1, dw: 150 },
            { img: 'furn_chest', x: 3, y: 3, w: 1, h: 1, dw: 50, say: '遺跡の箱。蓋は固く貼りついている。' }, { img: 'furn_chest', x: 20, y: 3, w: 1, h: 1, dw: 50 },
            { img: 'furn_crate', x: 4, y: 10, w: 1, h: 1, dw: 52, say: '朽ちた木箱。' }, { img: 'furn_barrel', x: 19, y: 10, w: 1, h: 1, dw: 46, say: '貝殻だらけの樽。' },
            { img: 'furn_bookshelf_orthogonal', x: 7, y: 2, w: 2, h: 1, dw: 100, say: '古代の航海日誌。文字は水に溶けかけている。' },
            { img: 'furn_bookshelf_orthogonal', x: 15, y: 2, w: 2, h: 1, dw: 100, say: '仲間の日記を挟んだ棚。ノアの字に似た書き込みがある。' }]
        }
      }
    },
    warps: [
      { map: 'C8_OBS', at: [38, 14], to: 'C9_GATE', to_at: 'C9_GATE@west_in', dir: 'right', cond: 'ge:c8_complete' },
      { map: 'C8_OBS', at: [38, 15], to: 'C9_GATE', to_at: 'C9_GATE@west_in', dir: 'right', cond: 'ge:c8_complete' },
      { map: 'C9_GATE', at: [1, 10], to: 'C8_OBS', to_at: 'C8_OBS@east_in', dir: 'left' },
      { map: 'C9_GATE', at: [1, 11], to: 'C8_OBS', to_at: 'C8_OBS@east_in', dir: 'left' },
      { map: 'C9_GATE', at: [19, 20], to: 'C9_RUIN', to_at: 'C9_RUIN@start', dir: 'up', cond: 'ge:c9_dive' },
      { map: 'C9_GATE', at: [20, 20], to: 'C9_RUIN', to_at: 'C9_RUIN@start', dir: 'up', cond: 'ge:c9_dive' },
      { map: 'C9_RUIN', at: [12, 13], to: 'C9_GATE', to_at: 'C9_GATE@dive', dir: 'up' }
    ],
    assets: [
      { ...A('tile.ruin_floor', 'tile', '192x192・4x4の継ぎ目なし。藻と貝殻が付いた古代の石床(水中)', 'tile_stone', '中', '第9章 海底遺跡の床(今は石畳)'), status: '調整中' },
      { ...A('prop.sea_lamp', 'prop', '64x128・透明。海底で灯り続ける古い灯台の灯(通常/強く光る差分)', 'furn_lantern', '高', '第9章 lamp(12,4)'), status: '調整中' },
      { ...A('bld.lighthouse', 'bld', '幅6タイル相当・高さ約7タイル・透明。入り江に立つ古い灯台(潜水口つき)', 'bld_hall_front', '中', '第9章 海辺(8,6)の建物の代わり'), status: '調整中' },
      { ...A('bg.underwater', 'bg', '960x540。海底の戦闘背景(光の筋と遺跡の柱)', 'bg_battle', '中', '第9章 海底遺跡の戦闘(deep_keeper)'), status: '調整中' }
    ]
  });
})();
