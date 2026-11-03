'use strict';
/* 第5章 maps: C5_MINE(雨の鉱山入口) / C5_TUNNEL(坑道・洞窟風) / C5_TOWN(エマの町)。 */
(function () {
  const A = (id, kind, spec, fb, pr, note) => ({ id, kind, file: 'img/' + id.replace('.', '_') + '.png', spec, status: '未制作', fallback: fb, priority: pr, owner: 'Codex', note });
  registerChapter({
    id: 'c5',
    maps: {
      C5_MINE: {
        name: '雨鳴鉱山', w: 44, h: 26, bgm: 'village', skin: { g: 'm', f: 'm' }, dim: 'rgba(35,55,95,.32)',
        ops: [
          ['fill', 'g'], ['circle', 37, 19, 3, 'r'],
          ['road', 1, 12, 42, 12, 2], ['rect', 30, 11, 32, 11, 'p'], ['road', 37, 14, 37, 16, 2],
          ['border', 2, 'x', [['w', 12, 13, 'p'], ['e', 12, 13, 'p']]]
        ],
        points: { start: [5, 13], west_in: [2, 12], west: [3, 12], east: [40, 12], east_in: [41, 12], entrance: [31, 11], door_in: [30, 11] },
        layout: {
          gap: { side: 'w', y0: 12, y1: 13 }, gap2: { side: 'e', y0: 12, y1: 13 },
          buildings: [
            { img: 'bld_workshop_front', x: 28, y: 10, flip: false, door: 30, kind: 'door' },    // 坑道の入口 → C5_TUNNEL
            { img: 'bld_hall_front', x: 6, y: 9, flip: false, kind: 'locked' }, { img: 'bld_workshop_front', x: 14, y: 9, flip: true, kind: 'locked' },
            { img: 'bld_hall_front', x: 10, y: 17, flip: true, kind: 'locked' }],
          lamps: [[10, 14], [24, 14], [38, 11], [17, 11]],
          barrels: [[8, 14], [26, 14], [36, 11], [26, 11]],
          signs: [[27, 11]],
          trees: [[3, 6, 120], [22, 5, 116], [36, 5, 126], [4, 20, 110], [22, 22, 118], [40, 22, 124]],
          decor: [{ img: 'furn_crate', x: 13, y: 14, scale: 0.32 }, { img: 'furn_crate', x: 14, y: 14, scale: 0.3 }, { img: 'furn_crate', x: 34, y: 11, scale: 0.32 }, { img: 'furn_chest', x: 20, y: 15, scale: 0.28 }]
        }
      },
      C5_TUNNEL: {
        name: '雨鳴鉱山の坑道', w: 22, h: 14, indoor: true, bgm: 'dusk', skin: { o: 'r' }, dim: 'rgba(5,10,28,.5)',
        ops: [['fill', 'x'], ['rect', 1, 2, 20, 12, 'o'], ['set', 11, 13, 'd']],
        points: { start: [11, 12], deep: [11, 3], trapped: [18, 4] },
        layout: {
          wallColor: '#3a3430', windows: [], doorX: 11,
          furn: [
            { img: 'furn_crate', x: 16, y: 3, w: 1, h: 1, dw: 52, say: '崩れた坑木と荷箱が通路をふさいでいる。' }, { img: 'furn_crate', x: 16, y: 4, w: 1, h: 1, dw: 52 },
            { img: 'furn_crate', x: 16, y: 5, w: 1, h: 1, dw: 52 }, { img: 'furn_crate', x: 17, y: 6, w: 1, h: 1, dw: 52 },
            { img: 'furn_fence', x: 6, y: 5, w: 2, h: 1, dw: 100, say: '折れかけた坑木。' },
            { img: 'furn_crate', x: 4, y: 6, w: 1, h: 1, dw: 52 }, { img: 'furn_crate', x: 5, y: 6, w: 1, h: 1, dw: 52, say: '鉱石を入れた木箱。濡れて重い。' },
            { img: 'furn_crate', x: 4, y: 9, w: 1, h: 1, dw: 52 }, { img: 'furn_crate', x: 15, y: 9, w: 1, h: 1, dw: 52 },
            { img: 'furn_crate', x: 8, y: 8, w: 1, h: 1, dw: 52 }, { img: 'furn_crate', x: 14, y: 7, w: 1, h: 1, dw: 52 },
            { img: 'furn_barrel', x: 2, y: 11, w: 1, h: 1, dw: 46, say: '雨水が溜まった樽。' }, { img: 'furn_barrel', x: 19, y: 11, w: 1, h: 1, dw: 46 },
            { img: 'furn_lantern', x: 9, y: 3, w: 1, h: 1, dw: 30, say: '坑道のランタン。火は小さい。' }, { img: 'furn_lantern', x: 13, y: 3, w: 1, h: 1, dw: 30 }]
        }
      },
      C5_TOWN: {
        name: '谷のふもとの町', w: 40, h: 24, bgm: 'village', dim: 'rgba(90,110,150,.10)',
        ops: [
          ['fill', 'g'], ['scatter', 'f', 0.08, 'g', 12],
          ['road', 2, 12, 37, 12, 2], ['circle', 20, 14, 2, 's'],
          ['border', 2, 'x', [['w', 12, 13, 'p'], ['e', 12, 13, 'p']]]
        ],
        points: { start: [19, 14], west_in: [2, 12], west: [3, 12], east: [36, 12], east_in: [37, 12], tailor: [21, 12], tailor_door: [20, 12] },
        layout: {
          gap: { side: 'w', y0: 12, y1: 13 }, gap2: { side: 'e', y0: 12, y1: 13 },
          buildings: [
            { img: 'bld_hall_front', x: 18, y: 11, flip: false, door: 20, kind: 'door' },        // 仕立て屋 → C6_TOWN
            { img: 'bld_workshop_front', x: 6, y: 10, flip: false, kind: 'locked' }, { img: 'bld_hall_front', x: 28, y: 10, flip: true, kind: 'locked' },
            { img: 'bld_hall_front', x: 6, y: 19, flip: false, kind: 'locked' }, { img: 'bld_workshop_front', x: 28, y: 19, flip: true, kind: 'locked' }],
          lamps: [[16, 11], [25, 11], [16, 14], [25, 14]],
          barrels: [[12, 11], [26, 13 + 1], [12, 14]],
          signs: [[17, 14]],
          trees: [[3, 6, 120], [36, 6, 126], [3, 21, 112], [37, 21, 118], [20, 21, 120]],
          decor: [{ img: 'furn_flowerpot', x: 17, y: 11, scale: 0.26 }, { img: 'furn_flowerpot', x: 24, y: 11, scale: 0.26 }, { img: 'furn_well', x: 23, y: 15, scale: 0.3 }, { img: 'furn_crate', x: 30, y: 14, scale: 0.3 }]
        }
      }
    },
    warps: [
      { map: 'C4_CAPITAL', at: [46, 14], to: 'C5_MINE', to_at: 'C5_MINE@west_in', dir: 'right', cond: 'ge:c4_complete' },
      { map: 'C4_CAPITAL', at: [46, 15], to: 'C5_MINE', to_at: 'C5_MINE@west_in', dir: 'right', cond: 'ge:c4_complete' },
      { map: 'C5_MINE', at: [1, 12], to: 'C4_CAPITAL', to_at: 'C4_CAPITAL@east_in', dir: 'left' },
      { map: 'C5_MINE', at: [1, 13], to: 'C4_CAPITAL', to_at: 'C4_CAPITAL@east_in', dir: 'left' },
      { map: 'C5_MINE', at: [30, 10], to: 'C5_TUNNEL', to_at: 'C5_TUNNEL@start', dir: 'up', cond: 'ge:c5_mine' },
      { map: 'C5_TUNNEL', at: [11, 13], to: 'C5_MINE', to_at: 'C5_MINE@door_in', dir: 'down' },
      { map: 'C5_MINE', at: [42, 12], to: 'C5_TOWN', to_at: 'C5_TOWN@west_in', dir: 'right', cond: 'ge:c5_rescue' },
      { map: 'C5_MINE', at: [42, 13], to: 'C5_TOWN', to_at: 'C5_TOWN@west_in', dir: 'right', cond: 'ge:c5_rescue' },
      { map: 'C5_TOWN', at: [1, 12], to: 'C5_MINE', to_at: 'C5_MINE@east_in', dir: 'left' },
      { map: 'C5_TOWN', at: [1, 13], to: 'C5_MINE', to_at: 'C5_MINE@east_in', dir: 'left' }
    ],
    assets: [
      { ...A('bld.mine_entrance', 'bld', '幅6タイル相当・透明・正面寄り俯瞰。岩を掘った坑口に木の枠とトロッコの線路', 'bld_workshop_front', '高', '第5章 鉱山入口(28,10)'), status: '調整中' },
      { ...A('prop.rubble', 'prop', '48x48〜96x48・透明。崩落した岩と折れた坑木(通路をふさぐ。撤去後の差分あり)', 'furn_crate', '高', '第5章 坑道(trapped手前)。第9・13章の洞窟でも流用'), status: '調整中' },
      { ...A('prop.mine_cart', 'prop', '96x64・透明。鉱石を積んだトロッコ(横向き)', 'furn_crate', '中', '第5章 鉱山入口の飾り'), status: '調整中' },
      { ...A('tile.cave_wall', 'tile', '192x192・4x4。岩壁の面(屋内マップ内部の壁用。屋内の x は今は描かれない)', 'tile_moss', '高', '第5・9・13章の洞窟風マップ'), status: '調整中' },
      { ...A('bld.tailor_shop', 'bld', '幅6タイル相当・透明・正面寄り俯瞰。布や服の見本と糸巻きの看板がある仕立て屋', 'bld_hall_front', '中', '第5章 谷のふもとの町(18,11)、第6・16章でも'), status: '調整中' }
    ]
  });
})();
