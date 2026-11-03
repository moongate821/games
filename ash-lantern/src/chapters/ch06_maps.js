'use strict';
/* 第6章 maps: C6_VALLEY(風の谷) / C6_FURNACE(大型炉・屋内風) / C6_TOWN(エマの仕立て屋・屋内)。 */
(function () {
  const A = (id, kind, spec, fb, pr, note) => ({ id, kind, file: 'img/' + id.replace('.', '_') + '.png', spec, status: '未制作', fallback: fb, priority: pr, owner: 'Codex', note });
  registerChapter({
    id: 'c6',
    maps: {
      C6_VALLEY: {
        name: '風継ぎの谷', w: 44, h: 28, bgm: 'village', dim: 'rgba(190,220,255,.10)',
        ops: [
          ['fill', 'g'], ['scatter', 'f', 0.10, 'g', 17],
          ['rect', 10, 2, 14, 8, 'x'], ['rect', 36, 2, 41, 9, 'x'], ['rect', 28, 18, 33, 25, 'x'], ['rect', 6, 19, 9, 24, 'x'],   // 谷をはさむ岩壁
          ['rect', 16, 16, 24, 21, 'l'],                                                                                           // 避難民の野営地
          ['road', 1, 13, 42, 13, 2], ['road', 34, 10, 34, 12, 2],
          ['border', 2, 'x', [['w', 13, 14, 'p'], ['e', 13, 14, 'p']]]
        ],
        points: { start: [5, 14], west_in: [2, 13], west: [3, 13], east: [40, 13], east_in: [41, 13], furnace_gate: [35, 10], gate_in: [34, 10], refugee: [20, 17] },
        layout: {
          gap: { side: 'w', y0: 13, y1: 14 }, gap2: { side: 'e', y0: 13, y1: 14 },
          buildings: [{ img: 'bld_hall_front', x: 32, y: 9, flip: false, door: 34, kind: 'door' }],      // 暴走した大型炉 → C6_FURNACE
          lamps: [[30, 12], [39, 12], [12, 15], [26, 15]],
          barrels: [[17, 16], [23, 16], [17, 21], [23, 20]],
          signs: [[33, 12]],
          trees: [[7, 10, 98], [10, 10, 105], [4, 18, 100], [11, 17, 105], [4, 8, 120], [5, 22, 128], [40, 22, 118], [26, 6, 130], [18, 5, 124], [22, 25, 112]],
          decor: [{ img: 'furn_crate', x: 18, y: 16, scale: 0.32 }, { img: 'furn_crate', x: 22, y: 18, scale: 0.3 }, { img: 'furn_well', x: 21, y: 20, scale: 0.3 }, { img: 'furn_chest', x: 24, y: 17, scale: 0.28 }]
        }
      },
      C6_FURNACE: {
        name: '谷の大型炉', w: 22, h: 14, indoor: true, bgm: 'dusk', skin: { o: 'r' }, dim: 'rgba(140,50,10,.24)',
        ops: [['fill', 'x'], ['rect', 1, 2, 20, 12, 'o'], ['set', 11, 13, 'd']],
        points: { start: [11, 12], valve: [11, 3], boss: [11, 7] },
        layout: {
          wallColor: '#4a3a34', windows: [], doorX: 11,
          furn: [
            { img: 'furn_stove', x: 3, y: 3, w: 1, h: 2, dw: 66, say: '炉の補助釜。灯が荒れて、鉄の肌が熱い。' }, { img: 'furn_stove', x: 18, y: 3, w: 1, h: 2, dw: 66, say: '炉の補助釜。ひびが入っている。' },
            { img: 'furn_lantern', x: 8, y: 3, w: 1, h: 1, dw: 30, say: '暴走した灯火の光が、ランタンを白く焼いている。' }, { img: 'furn_lantern', x: 14, y: 3, w: 1, h: 1, dw: 30 },
            { img: 'furn_crate', x: 5, y: 8, w: 1, h: 1, dw: 52 }, { img: 'furn_crate', x: 16, y: 8, w: 1, h: 1, dw: 52 },
            { img: 'furn_barrel', x: 3, y: 10, w: 1, h: 1, dw: 46, say: '冷却用の水樽。空だ。' }, { img: 'furn_barrel', x: 18, y: 10, w: 1, h: 1, dw: 46 },
            { img: 'furn_chest', x: 6, y: 5, w: 1, h: 1, dw: 50, say: '操作盤の保守道具が入っている。' }]
        }
      },
      C6_TOWN: {
        name: 'エマの仕立て屋', w: 12, h: 10, indoor: true, bgm: 'home',
        ops: [['fill', 'x'], ['rect', 1, 2, 10, 8, 'o'], ['set', 6, 9, 'd']],
        points: { start: [6, 8] },
        layout: {
          wallColor: '#7a5a3c', windows: [2 * 48 + 6, 8 * 48 + 6], doorX: 6,
          furn: [
            { img: 'furn_bench_orthogonal', x: 7, y: 3, w: 3, h: 2, dw: 156, say: '裁ち台。針と糸、型紙が整然と並んでいる。' },
            { img: 'furn_bookshelf_orthogonal', x: 3, y: 2, w: 2, h: 1, dw: 100, say: '布見本の棚。色ごとに巻いてある。' },
            { img: 'furn_bed_orthogonal', x: 9, y: 6, w: 2, h: 2, dw: 82, say: '小さな寝台。仕事場の隅で寝起きしているらしい。' },
            { img: 'furn_table_orthogonal', x: 2, y: 5, w: 2, h: 2, dw: 118, say: '試着用の机。縫いかけの外套が掛けてある。' },
            { img: 'furn_flowerpot', x: 1, y: 3, w: 1, h: 1, dw: 32 }]
        }
      }
    },
    warps: [
      { map: 'C5_TOWN', at: [38, 12], to: 'C6_VALLEY', to_at: 'C6_VALLEY@west_in', dir: 'right', cond: 'ge:c5_complete' },
      { map: 'C5_TOWN', at: [38, 13], to: 'C6_VALLEY', to_at: 'C6_VALLEY@west_in', dir: 'right', cond: 'ge:c5_complete' },
      { map: 'C6_VALLEY', at: [1, 13], to: 'C5_TOWN', to_at: 'C5_TOWN@east_in', dir: 'left' },
      { map: 'C6_VALLEY', at: [1, 14], to: 'C5_TOWN', to_at: 'C5_TOWN@east_in', dir: 'left' },
      { map: 'C6_VALLEY', at: [34, 9], to: 'C6_FURNACE', to_at: 'C6_FURNACE@start', dir: 'up', cond: 'ge:c6_prep' },
      { map: 'C6_FURNACE', at: [11, 13], to: 'C6_VALLEY', to_at: 'C6_VALLEY@gate_in', dir: 'down' },
      { map: 'C5_TOWN', at: [20, 11], to: 'C6_TOWN', to_at: 'C6_TOWN@start', dir: 'up', cond: 'ge:c5_confess' },
      { map: 'C6_TOWN', at: [6, 9], to: 'C5_TOWN', to_at: 'C5_TOWN@tailor_door', dir: 'down' }
    ],
    assets: [
      { ...A('bld.furnace_hall', 'bld', '幅6タイル相当・高さ約5タイル・透明・正面寄り俯瞰。谷の大型炉を収めた石造りの建物(煙突と赤い光が漏れる扉)', 'bld_hall_front', '高', '第6章 谷の大型炉(32,9)'), status: '調整中' },
      { ...A('prop.big_furnace_core', 'prop', '192x240・透明。暴走して白く光る大型炉の中心核(正常時/暴走時/停止後の3差分)', 'furn_lantern', '高', '第6章 C6_FURNACE のボス戦と停止演出'), status: '調整中' },
      { ...A('prop.valve_wheel', 'prop', '48x64・透明。手動遮断の大きな弁(閉/開の2差分)', 'furn_crate', '高', '第6章 valve(11,3)'), status: '調整中' }
    ]
  });
})();
