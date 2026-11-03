'use strict';
/* 第3章 maps: C3_PORT(港) / C3_WAREHOUSE(夜の倉庫・屋内) / C3_MARKET(市場)。 */
(function () {
  const A = (id, kind, spec, fb, pr, note) => ({ id, kind, file: 'img/' + id.replace('.', '_') + '.png', spec, status: ['bld.warehouse', 'prop.small_boat', 'prop.market_stall'].includes(id) ? '調整中' : '未制作', fallback: fb, priority: pr, owner: 'Codex', note });
  registerChapter({
    id: 'c3',
    maps: {
      C3_PORT: {
        name: '地図にない港', w: 44, h: 26, bgm: 'village', dim: 'rgba(120,170,220,.08)',
        ops: [
          ['fill', 'g'], ['scatter', 'f', 0.05, 'g', 4], ['scatter', 'm', 0.04, 'g', 6],
          ['rect', 0, 18, 43, 25, 'w'],                                   // 海
          ['rect', 2, 14, 41, 17, 's'],                                   // 岸壁の石畳
          ['road', 1, 12, 42, 12, 2], ['road', 19, 14, 19, 17, 2], ['road', 24, 2, 24, 11, 2], ['rect', 9, 11, 11, 11, 'p'],
          ['rect', 19, 18, 20, 22, 'b'], ['rect', 31, 18, 32, 21, 'b'],   // 桟橋2本
          ['border', 2, 'x', [['w', 12, 13, 'p'], ['e', 12, 13, 'p'], ['n', 24, 25, 'p'], ['s', 0, 43, 'w']]]
        ],
        points: { start: [5, 13], west_in: [2, 12], west: [3, 12], east: [40, 12], east_in: [41, 12], dock: [20, 22], boat: [31, 21], market_in: [24, 3], revisit: [14, 13] },
        layout: {
          border: 'none', gap: { side: 'w', y0: 12, y1: 13 }, gap2: { side: 'e', y0: 12, y1: 13 },
          buildings: [
            { img: 'bld_workshop_front', x: 8, y: 11, flip: false, door: 10, kind: 'door' },       // 倉庫(扉 → C3_WAREHOUSE)
            { img: 'bld_hall_front', x: 30, y: 9, flip: true, kind: 'locked' },
            { img: 'bld_hall_front', x: 3, y: 7, flip: false, kind: 'locked' }],
          lamps: [[17, 14], [22, 14], [28, 17], [35, 14]],
          barrels: [[16, 15], [23, 15], [27, 16], [36, 16]],
          signs: [[18, 14], [23, 11]],
          trees: [[4, 15, 118], [39, 15, 126], [14, 5, 120], [34, 4, 112], [44 - 8, 6, 124]],
          decor: [{ img: 'furn_crate', x: 25, y: 15, scale: 0.32 }, { img: 'furn_crate', x: 26, y: 15, scale: 0.3 }, { img: 'furn_crate', x: 33, y: 15, scale: 0.32 },
            { img: 'furn_well', x: 37, y: 9, scale: 0.3 }, { img: 'furn_flowerpot', x: 7, y: 11, scale: 0.26 }]
        }
      },
      C3_WAREHOUSE: {
        name: '夜の倉庫', w: 16, h: 11, indoor: true, bgm: 'home', dim: 'rgba(10,15,45,.38)',
        ops: [['fill', 'x'], ['rect', 1, 2, 14, 9, 'o'], ['set', 8, 10, 'd']],
        points: { start: [8, 9], door: [8, 8], crate: [8, 4] },
        layout: {
          wallColor: '#4a3a30', windows: [3 * 48, 11 * 48], doorX: 8,
          furn: [
            { img: 'furn_crate', x: 2, y: 3, w: 1, h: 1, dw: 52, say: '港の荷が詰まった木箱。' }, { img: 'furn_crate', x: 3, y: 3, w: 1, h: 1, dw: 52, say: '同じ印の木箱が積んである。' },
            { img: 'furn_crate', x: 2, y: 4, w: 1, h: 1, dw: 52, say: '中身は乾燥させた干し魚だ。' },
            { img: 'furn_crate', x: 12, y: 3, w: 1, h: 1, dw: 52, say: '夜でも荷が運び込まれている。' }, { img: 'furn_crate', x: 13, y: 3, w: 1, h: 1, dw: 52 },
            { img: 'furn_crate', x: 13, y: 4, w: 1, h: 1, dw: 52 },
            { img: 'furn_barrel', x: 2, y: 7, w: 1, h: 1, dw: 46, say: '燃料の油が入った樽。' }, { img: 'furn_barrel', x: 13, y: 7, w: 1, h: 1, dw: 46, say: '水の樽。' },
            { img: 'furn_crate', x: 5, y: 6, w: 1, h: 1, dw: 52 }, { img: 'furn_crate', x: 10, y: 6, w: 1, h: 1, dw: 52 },
            { img: 'furn_chest', x: 6, y: 3, w: 1, h: 1, dw: 50, say: '鍵のかかった帳簿箱。' }]
        }
      },
      C3_MARKET: {
        name: '朝の市場', w: 40, h: 24, bgm: 'village', dim: 'rgba(255,230,180,.06)',
        ops: [
          ['fill', 'g'], ['scatter', 'f', 0.05, 'g', 8],
          ['circle', 21, 12, 5, 's'], ['road', 2, 12, 37, 12, 2], ['road', 20, 2, 20, 21, 2],
          ['border', 2, 'x', [['s', 20, 21, 'p']]]
        ],
        points: { start: [21, 18], gate_in: [21, 21], gate: [20, 20], stall: [24, 12] },
        layout: {
          buildings: [
            { img: 'bld_workshop_front', x: 5, y: 8, flip: false, kind: 'locked' }, { img: 'bld_hall_front', x: 29, y: 8, flip: true, kind: 'locked' },
            { img: 'bld_hall_front', x: 5, y: 18, flip: false, kind: 'locked' }, { img: 'bld_workshop_front', x: 29, y: 18, flip: true, kind: 'locked' }],
          lamps: [[17, 10], [25, 10], [17, 15], [25, 15], [12, 11], [31, 11]],
          barrels: [[12, 10], [27, 11], [12, 14], [28, 14]],
          signs: [[18, 5], [22, 20]],
          trees: [[3, 10, 118], [36, 5, 120], [36, 21, 112]],
          decor: [{ img: 'furn_crate', x: 23, y: 9, scale: 0.32 }, { img: 'furn_crate', x: 24, y: 9, scale: 0.3 }, { img: 'furn_flowerpot', x: 16, y: 9, scale: 0.26 },
            { img: 'furn_flowerpot', x: 26, y: 15, scale: 0.26 }, { img: 'furn_well', x: 18, y: 16, scale: 0.3 }]
        }
      }
    },
    warps: [
      { map: 'C2_ROAD', at: [44, 12], to: 'C3_PORT', to_at: 'C3_PORT@west_in', dir: 'right', cond: 'ge:c2_complete' },
      { map: 'C2_ROAD', at: [44, 13], to: 'C3_PORT', to_at: 'C3_PORT@west_in', dir: 'right', cond: 'ge:c2_complete' },
      { map: 'C3_PORT', at: [1, 12], to: 'C2_ROAD', to_at: 'C2_ROAD@east_in', dir: 'left' },
      { map: 'C3_PORT', at: [1, 13], to: 'C2_ROAD', to_at: 'C2_ROAD@east_in', dir: 'left' },
      { map: 'C3_PORT', at: [10, 11], to: 'C3_WAREHOUSE', to_at: 'C3_WAREHOUSE@start', dir: 'up', cond: 'ge:c3_night' },
      { map: 'C3_WAREHOUSE', at: [8, 10], to: 'C3_PORT', to_at: [10, 12], dir: 'down' },
      { map: 'C3_PORT', at: [24, 1], to: 'C3_MARKET', to_at: 'C3_MARKET@gate_in', dir: 'up' },
      { map: 'C3_PORT', at: [25, 1], to: 'C3_MARKET', to_at: 'C3_MARKET@gate_in', dir: 'up' },
      { map: 'C3_MARKET', at: [20, 22], to: 'C3_PORT', to_at: 'C3_PORT@market_in', dir: 'down' },
      { map: 'C3_MARKET', at: [21, 22], to: 'C3_PORT', to_at: 'C3_PORT@market_in', dir: 'down' }
    ],
    assets: [
      { ...A('tile.dock_stone', 'tile', '192x192・4x4の継ぎ目なし。潮で濡れた岸壁の石畳(縁に海藻)', 'tile_stone', '中', '第3章 港の岸壁'), status: '調整中' },
      A('bld.warehouse', 'bld', '幅6タイル相当・透明・正面寄り俯瞰。大きな両開きの扉と木の梁の倉庫', 'bld_workshop_front', '高', '第3章 港の倉庫(扉が倉庫内部への入口)'),
      A('prop.small_boat', 'prop', '144x96・透明。桟橋につないだ小舟(横向き)', 'furn_crate', '高', '第3章 港(boat/dock)'),
      A('prop.market_stall', 'prop', '幅3タイル(144px)・透明。布の屋根の屋台と商品', 'furn_crate', '高', '第3章 朝の市場(stall)'),
      { ...A('tile.sea_deep', 'tile', '192x192・4x4。深い海(波紋は別描画)', 'tile_water', '低', '第3章 港の海'), status: '調整中' }
    ]
  });
})();
