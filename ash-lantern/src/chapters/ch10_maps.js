'use strict';
/* 第10章 maps: C10_SHIP(古代船の甲板) / C10_ISLES(浮島群)。
   再訪用の点: V@revisit / K@revisit(ここで足す)。C2_ROAD@revisit / C3_PORT@revisit は各マップ側にある。 */
(function () {
  const A = (id, kind, spec, fb, pr, note) => ({ id, kind, file: 'img/' + id.replace('.', '_') + '.png', spec, status: '未制作', fallback: fb, priority: pr, owner: 'Codex', note });
  registerChapter({
    id: 'c10',
    maps: {
      C10_SHIP: {
        name: '古代船の甲板', w: 30, h: 18, bgm: 'village', dim: 'rgba(130,180,235,.10)',
        ops: [
          ['fill', 'w'], ['rect', 3, 5, 26, 12, 'o'], ['circle', 27, 8.5, 3, 'o'],
          ['rect', 0, 8, 2, 9, 'b'], ['rect', 27, 8, 29, 9, 'b']                     // 乗り降りの板(西=港側、東=島側)
        ],
        points: { start: [14, 9], helm: [24, 8], hold: [7, 8], gangway_in: [3, 8], bow_in: [26, 8] },
        layout: {
          border: 'none',
          buildings: [], lamps: [[20, 6], [20, 11], [10, 6], [10, 11]], barrels: [[5, 6], [5, 11], [8, 6]], signs: [], trees: [],
          decor: [{ img: 'furn_crate', x: 6, y: 10, scale: 0.32 }, { img: 'furn_crate', x: 7, y: 10, scale: 0.3 }, { img: 'furn_chest', x: 22, y: 6, scale: 0.28 }, { img: 'furn_crate', x: 24, y: 11, scale: 0.3 }]
        }
      },
      C10_ISLES: {
        name: '浮島群', w: 40, h: 26, bgm: 'village', skin: { w: 's' }, dim: 'rgba(235,245,255,.14)',
        ops: [
          ['fill', 'w'], ['circle', 9, 13, 6, 'g'], ['circle', 21, 8, 5, 'g'], ['circle', 32, 17, 6, 'g'], ['scatter', 'f', 0.12, 'g', 31],
          ['rect', 14, 10, 17, 11, 'b'], ['rect', 24, 11, 25, 14, 'b'], ['rect', 24, 15, 27, 16, 'b'],     // 吊り橋
          ['rect', 1, 13, 3, 14, 'b'], ['rect', 38, 17, 39, 18, 'b']                                        // 西の船着き場・東の灰の海への船着き場
        ],
        points: { start: [8, 13], dock_in: [3, 13], dock: [4, 13], ash_gate: [37, 17], ash_in: [38, 17], island2: [21, 9], island3: [32, 17] },
        layout: {
          border: 'none',
          buildings: [], lamps: [[6, 12], [21, 11], [29, 17]], barrels: [[7, 15], [24, 7]], signs: [[5, 14]],
          trees: [[8, 10, 110], [11, 16, 104], [20, 6, 112], [22, 10, 100], [31, 14, 108], [34, 20, 104]],
          decor: [{ img: 'furn_flowerpot', x: 12, y: 12, scale: 0.26 }, { img: 'furn_crate', x: 30, y: 19, scale: 0.3 }, { img: 'furn_well', x: 19, y: 8, scale: 0.3 }]
        }
      }
    },
    mapPoints: { V: { revisit: [20, 16] }, K: { revisit: [20, 17] } },
    warps: [
      { map: 'C9_GATE', at: [38, 10], to: 'C10_SHIP', to_at: 'C10_SHIP@gangway_in', dir: 'right', cond: 'ge:c9_complete' },
      { map: 'C9_GATE', at: [38, 11], to: 'C10_SHIP', to_at: 'C10_SHIP@gangway_in', dir: 'right', cond: 'ge:c9_complete' },
      { map: 'C10_SHIP', at: [0, 8], to: 'C9_GATE', to_at: 'C9_GATE@east_in', dir: 'left' },
      { map: 'C10_SHIP', at: [0, 9], to: 'C9_GATE', to_at: 'C9_GATE@east_in', dir: 'left' },
      { map: 'C10_SHIP', at: [29, 8], to: 'C10_ISLES', to_at: 'C10_ISLES@dock_in', dir: 'right', cond: 'ge:c10_ship' },
      { map: 'C10_SHIP', at: [29, 9], to: 'C10_ISLES', to_at: 'C10_ISLES@dock_in', dir: 'right', cond: 'ge:c10_ship' },
      { map: 'C10_ISLES', at: [1, 13], to: 'C10_SHIP', to_at: 'C10_SHIP@bow_in', dir: 'left' },
      { map: 'C10_ISLES', at: [1, 14], to: 'C10_SHIP', to_at: 'C10_SHIP@bow_in', dir: 'left' }
    ],
    assets: [
      { ...A('tile.deck_wood', 'tile', '192x192・4x4の継ぎ目なし。古代船の甲板(金属の継ぎ目と木板)', 'tile_wood', '高', '第10・12章の甲板'), status: '調整中' },
      { ...A('prop.ship_wheel', 'prop', '96x96・透明。古代船の舵輪(修復前/修復後の差分、光る灯火管)', 'furn_lantern', '高', '第10章 helm(24,8)'), status: '調整中' },
      { ...A('prop.ship_mast', 'prop', '96x240・透明。帆柱と畳んだ帆(修復前/後)', 'prop_tree', '中', '第10・12章の甲板。今は何も描かれない'), status: '調整中' },
      { ...A('tile.sky_cloud', 'tile', '192x192・4x4。雲海(浮島群の足元。ゆっくり流れる差分)', 'tile_stone', '高', '第10章 浮島群の空(skin w→s で代用中)'), status: '調整中' },
      { ...A('prop.floating_isle_edge', 'prop', '島の縁用の岩肌と根(円形の島の外周に重ねる)。192x96・透明', 'prop_tree', '中', '第10章 浮島群'), status: '調整中' },
      { ...A('prop.small_lantern_core', 'prop', '48x72・透明。各地で繋ぐ小さな炉(消灯/点灯)', 'furn_lantern', '中', '第10章 各地の再訪'), status: '調整中' }
    ]
  });
})();
