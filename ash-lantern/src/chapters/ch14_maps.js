'use strict';
/* 第14章 maps: C14_HEART(炉の中心・屋内風)。灰の冠の中枢 C13_CORE の奥(12,2)から入る。出口は C15_ROAD へ。 */
(function () {
  const A = (id, kind, spec, fb, pr, note) => ({ id, kind, file: 'img/' + id.replace('.', '_') + '.png', spec, status: '未制作', fallback: fb, priority: pr, owner: 'Codex', note });
  registerChapter({
    id: 'c14',
    maps: {
      C14_HEART: {
        name: '炉の中心', w: 20, h: 12, indoor: true, bgm: 'home', skin: { o: 's' }, dim: 'rgba(255,225,170,.10)',
        ops: [['fill', 'x'], ['rect', 1, 2, 18, 10, 'o'], ['set', 10, 11, 'd']],
        points: { start: [10, 10], voice: [10, 6], furnace: [10, 3] },
        layout: {
          wallColor: '#b49a78', windows: [], doorX: 10, rug: { x: 7.6, y: 4.2, w: 200 },
          furn: [
            { img: 'furn_lantern', x: 8, y: 2, w: 4, h: 2, dw: 84, say: '炉の中心で、小さな灯が静かに揺れている。' },
            { img: 'furn_stove', x: 4, y: 2, w: 2, h: 2, dw: 66, say: '古い補助釜。もう火は入っていない。' },
            { img: 'furn_stove', x: 14, y: 2, w: 2, h: 2, dw: 66, say: '古い補助釜。' },
            { img: 'furn_crate', x: 1, y: 7, w: 2, h: 1, dw: 52, say: '記録と小さな灯りが残されている。' },
            { img: 'furn_crate', x: 17, y: 7, w: 2, h: 1, dw: 52, say: '古い道具と灯り。' }]
        }
      }
    },
    warps: [
      { map: 'C13_CORE', at: [12, 2], to: 'C14_HEART', to_at: 'C14_HEART@start', dir: 'up', cond: 'ge:c13_complete' },
      { map: 'C14_HEART', at: [10, 11], to: 'C15_ROAD', to_at: 'C15_ROAD@west_in', dir: 'right', cond: 'ge:c14_complete' }
    ],
    assets: [
      { ...A('prop.voice_furnace', 'prop', '128x192・透明。リナの声が宿る炉の中心(声がある/消えた後の差分)', 'furn_lantern', '高', '第14章 furnace(10,3)'), status: '調整中' },
      { ...A('tile.light_floor', 'tile', '192x192・4x4。淡い光が揺らぐ白い床(炉の中心)', 'tile_stone', '低', '第14章 C14_HEART(今は石畳)'), status: '調整中' }
    ]
  });
})();
