'use strict';
/* 第12章 maps: C12_SEA(灰の海) / C12_DECK(夜の甲板)。浮島群 C10_ISLES の東の船着き場から入る。 */
(function () {
  const A = (id, kind, spec, fb, pr, note) => ({ id, kind, file: 'img/' + id.replace('.', '_') + '.png', spec, status: '未制作', fallback: fb, priority: pr, owner: 'Codex', note });
  registerChapter({
    id: 'c12',
    maps: {
      C12_SEA: {
        name: '灰の海', w: 44, h: 24, bgm: 'dusk', skin: { w: 'r' }, dim: 'rgba(70,70,88,.5)',
        ops: [
          ['fill', 'w'], ['circle', 7, 12, 6, 'l'], ['circle', 30, 12, 5, 'l'], ['circle', 41, 12, 4, 'l'],
          ['rect', 13, 11, 25, 12, 'b'], ['rect', 35, 11, 38, 12, 'b'], ['rect', 6, 18, 7, 19, 'b']
        ],
        points: { start: [5, 12], west_in: [2, 12], west: [3, 12], gate: [41, 12], gate_in: [40, 12], ship: [6, 18], ship_in: [6, 18] },
        layout: {
          border: 'none',
          buildings: [], lamps: [[9, 9], [29, 9]], barrels: [[4, 14], [31, 15]], signs: [[10, 14]], trees: [],
          decor: [{ img: 'furn_crate', x: 8, y: 14, scale: 0.3 }, { img: 'furn_crate', x: 27, y: 10, scale: 0.3 }]
        }
      },
      C12_DECK: {
        name: '夜の甲板', w: 30, h: 14, bgm: 'dusk', dim: 'rgba(5,10,55,.5)',
        ops: [['fill', 'w'], ['rect', 3, 4, 26, 9, 'o'], ['rect', 0, 6, 2, 7, 'b']],
        points: { start: [14, 7], rail: [14, 4], gangway_in: [3, 6] },
        layout: {
          border: 'none',
          buildings: [], lamps: [[8, 5], [19, 5], [8, 9], [19, 9]], barrels: [[5, 5], [24, 5]], signs: [], trees: [],
          decor: [{ img: 'furn_crate', x: 6, y: 9, scale: 0.32 }, { img: 'furn_crate', x: 23, y: 9, scale: 0.3 }]
        }
      }
    },
    warps: [
      { map: 'C10_ISLES', at: [39, 17], to: 'C12_SEA', to_at: 'C12_SEA@west_in', dir: 'right', cond: 'ge:c11_complete' },
      { map: 'C10_ISLES', at: [39, 18], to: 'C12_SEA', to_at: 'C12_SEA@west_in', dir: 'right', cond: 'ge:c11_complete' },
      { map: 'C12_SEA', at: [1, 11], to: 'C10_ISLES', to_at: 'C10_ISLES@ash_in', dir: 'left' },
      { map: 'C12_SEA', at: [1, 12], to: 'C10_ISLES', to_at: 'C10_ISLES@ash_in', dir: 'left' },
      { map: 'C12_SEA', at: [6, 19], to: 'C12_DECK', to_at: 'C12_DECK@gangway_in', dir: 'down', cond: 'ge:c12_start' },
      { map: 'C12_SEA', at: [7, 19], to: 'C12_DECK', to_at: 'C12_DECK@gangway_in', dir: 'down', cond: 'ge:c12_start' },
      { map: 'C12_DECK', at: [0, 6], to: 'C12_SEA', to_at: 'C12_SEA@ship_in', dir: 'left' },
      { map: 'C12_DECK', at: [0, 7], to: 'C12_SEA', to_at: 'C12_SEA@ship_in', dir: 'left' }
    ],
    assets: [
      { ...A('tile.ash_sea', 'tile', '192x192・4x4の継ぎ目なし。灰色の灰の海(波紋は別描画)。skin w→r で代用中', 'tile_gravel', '高', '第12章 灰の海(C12_SEA)'), status: '調整中' },
      { ...A('tile.ash_ground', 'tile', '192x192・4x4の継ぎ目なし。焦げた灰の地面', 'tile_soil', '中', '第12章 灰の海の島々(今は落ち葉の土)'), status: '調整中' },
      { ...A('bg.ash_horizon', 'bg', '960x540。灰の海の水平線と、遠くの冠の影', 'bg_battle', '中', '第12・13章 戦闘背景(ash_beast / ash_crown)'), status: '調整中' },
      { ...A('prop.ash_cave_mouth', 'prop', '幅4タイル・透明。灰の冠の洞窟の口', 'furn_crate', '高', '第12章 gate(41,12)'), status: '調整中' }
    ]
  });
})();
