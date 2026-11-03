'use strict';
/* 第2章 maps(街・フィールド担当): C2_ROAD(塩の街道・砂) / C2_CAMP(避難所の集落)。
   約束: 出入口の「踏む所」は外周の道の1マス内側(x=1 / x=w-2)。到着点は *_in(その2マス内側)。
   *_in から1歩進むと west / east の点を踏む(章の到着ゾーン用)。 */
(function () {
  const A = (id, kind, spec, fb, pr, note) => ({ id, kind, file: 'img/' + id.replace('.', '_') + '.png', spec, status: id === 'prop.supply_wagon' ? '調整中' : '未制作', fallback: fb, priority: pr, owner: 'Codex', note });
  registerChapter({
    id: 'c2',
    maps: {
      C2_ROAD: {
        name: '塩の街道', w: 46, h: 26, bgm: 'village', dim: 'rgba(255,225,160,.10)', skin: { x: 'tile_sand' },
        ops: [
          ['fill', 'a'],
          ['circle', 9, 5, 3, 's'], ['circle', 37, 20, 4, 's'], ['circle', 24, 21, 3, 's'],   // 塩の干潟
          ['circle', 40, 6, 3, 'g'], ['circle', 40, 6, 1.6, 'w'],                               // 小さなオアシス
          ['circle', 9, 12, 2.2, 'p'], ['circle', 21, 13, 2.3, 'p'],
          ['circle', 32, 12, 2.2, 'p'],                                                           // 道幅に緩やかな変化
          ['road', 1, 12, 44, 12, 2], ['rect', 13, 14, 16, 14, 'p'],                           // 街道(荷車の脇を抜ける道つき)
          ['road', 13, 14, 13, 25, 2], ['road', 31, 7, 31, 11, 2],
          ['border', 2, 'x', [['w', 12, 13, 'p'], ['e', 12, 13, 'p'], ['s', 13, 14, 'p']]]
        ],
        points: { start: [5, 12], west_in: [2, 12], west: [3, 12], east: [42, 12], east_in: [43, 12], cart: [15, 12], ambush: [24, 13], camp: [13, 21], camp_in: [13, 22], bandit_camp: [31, 4], revisit: [10, 13] },
        layout: {
          border: 'none',
          gap: { side: 'w', y0: 12, y1: 13 }, gap2: { side: 'e', y0: 12, y1: 13 },
          buildings: [{ img: 'bld_hall_front', art: 'bld_waystation', x: 5, y: 9, flip: false, kind: 'locked' }],   // 閉ざされた休憩所(art: 専用画像 bld.waystation ができたら自動で使う)
          lamps: [],
          barrels: [[29, 3], [34, 5]],
          signs: [[4, 11], [41, 11], [12, 16]],
          trees: [[40, 8, 100], [43, 7, 92]],
          decor: [{ img: 'furn_crate', x: 15, y: 11, scale: 0.32 }, { img: 'furn_crate', x: 30, y: 4, scale: 0.32 },
            { img: 'furn_crate', x: 33, y: 3, scale: 0.3 }, { img: 'furn_well', x: 38, y: 8, scale: 0.3 }, { img: 'furn_chest', x: 28, y: 5, scale: 0.3 }]
            .concat([[18, 8, 72, false], [24, 7, 90, true], [27, 17, 78, false], [33, 18, 62, true], [8, 17, 68, false]].map(([x, y, aw, flip]) =>
              ({ img: null, art: 'prop_salt_scrub', x, y, aw, flip, crop: [390, 249, 812, 511] })))
        }
      },
      C2_CAMP: {
        name: '避難所の集落', w: 36, h: 24, bgm: 'village', dim: 'rgba(255,220,170,.06)',
        ops: [
          ['fill', 'g'], ['scatter', 'f', 0.05, 'g', 9],
          ['circle', 17, 13, 4, 's'],
          ['road', 16, 2, 16, 21, 2], ['road', 3, 12, 32, 12, 2],
          ['border', 2, 'x', [['n', 16, 17, 'p']]]
        ],
        points: { start: [17, 5], gate_in: [17, 2], gate: [16, 3], elder: [17, 10] },
        layout: {
          buildings: [
            { img: 'bld_hall_front', x: 4, y: 8, flip: false, kind: 'locked' }, { img: 'bld_hall_front', x: 24, y: 8, flip: true, kind: 'locked' },
            { img: 'bld_workshop_front', x: 4, y: 19, flip: false, kind: 'locked' }, { img: 'bld_hall_front', x: 26, y: 19, flip: true, kind: 'locked' }],
          lamps: [[15, 6], [18, 6], [15, 17], [18, 17]],
          barrels: [[11, 10], [22, 10], [12, 15], [23, 21]],
          signs: [[15, 3]],
          trees: [[3, 4, 120], [32, 4, 128], [12, 20, 110], [34, 14, 122], [3, 15, 116]],
          decor: [{ img: 'furn_well', x: 20, y: 15, scale: 0.3 }, { img: 'furn_crate', x: 11, y: 15, scale: 0.32 }, { img: 'furn_crate', x: 23, y: 15, scale: 0.3 },
            { img: 'furn_flowerpot', x: 14, y: 9, scale: 0.26 }, { img: 'furn_crate', x: 14, y: 19, scale: 0.3 }]
        }
      }
    },
    mapPatch: { K: [['rect', 38, 6, 39, 7, 'p']] },
    mapPoints: { K: { east: [38, 6], east_in: [36, 6] } },
    warps: [
      { map: 'K', at: [38, 6], to: 'C2_ROAD', to_at: 'C2_ROAD@west_in', dir: 'right', cond: 'ge:c1_complete' },
      { map: 'K', at: [38, 7], to: 'C2_ROAD', to_at: 'C2_ROAD@west_in', dir: 'right', cond: 'ge:c1_complete' },
      { map: 'C2_ROAD', at: [1, 12], to: 'K', to_at: 'K@east_in', dir: 'left' },
      { map: 'C2_ROAD', at: [1, 13], to: 'K', to_at: 'K@east_in', dir: 'left' },
      { map: 'C2_ROAD', at: [13, 24], to: 'C2_CAMP', to_at: 'C2_CAMP@gate_in', dir: 'down' },
      { map: 'C2_ROAD', at: [14, 24], to: 'C2_CAMP', to_at: 'C2_CAMP@gate_in', dir: 'down' },
      { map: 'C2_CAMP', at: [16, 1], to: 'C2_ROAD', to_at: 'C2_ROAD@camp_in', dir: 'up' },
      { map: 'C2_CAMP', at: [17, 1], to: 'C2_ROAD', to_at: 'C2_ROAD@camp_in', dir: 'up' }
    ],
    assets: [
      { ...A('tile.salt_flat', 'tile', '192x192・4x4の継ぎ目なし。白い塩の結晶と細かなひび。俯瞰・縁は砂となじむ', 'tile_stone', '中', '第2章 塩の街道の干潟(今は石畳で代用)'), status: '調整中' },
      { ...A('bld.waystation', 'bld', '幅6タイル(288px)相当・透明・正面寄り俯瞰。崩れかけた石造りの休憩所', 'bld_hall_front', '低', '第2章 街道の閉ざされた休憩所'), status: '調整中' },
      { ...A('prop.refugee_tent', 'prop', '96x80・透明。布を張った簡易テント(開口あり)', 'furn_crate', '高', '第2章 避難所の集落(建物の代わりにテント群にしたい)'), status: '調整中' },
      { ...A('prop.salt_scrub', 'prop', '812x511の主要部分を切り出して使用。砂岩と乾いた草の小さな群れ', '', '中', '第2章 街道の砂地'), status: '調整中' },
      A('prop.supply_wagon', 'prop', '144x96・透明。荷を積んだ荷車(横向き)', 'furn_crate', '中', '第2章 街道の荷車(cart)')
    ]
  });
})();
