'use strict';
/* 第11章 maps: C11_HALL(玉座の間) / C11_DEVICE(装置室)。
   王都 C4_CAPITAL の城の右翼の扉(29,6)から入る(第10章完了後)。 */
(function () {
  const A = (id, kind, spec, fb, pr, note) => ({ id, kind, file: 'img/' + id.replace('.', '_') + '.png', spec, status: '未制作', fallback: fb, priority: pr, owner: 'Codex', note });
  registerChapter({
    id: 'c11',
    maps: {
      C11_HALL: {
        name: '玉座の間', w: 20, h: 13, indoor: true, bgm: 'home', skin: { o: 's' }, dim: 'rgba(200,190,230,.08)',
        ops: [['fill', 'x'], ['rect', 1, 2, 18, 11, 'o'], ['set', 10, 12, 'd']],
        points: { start: [10, 11], throne: [10, 3], device_door: [17, 3] },
        layout: {
          wallColor: '#9b94a8', windows: [3 * 48 + 6, 7 * 48 + 6, 12 * 48 + 6], doorX: 10, rug: { x: 8, y: 3.4, w: 220 },
          furn: [
            { img: 'furn_chair_orthogonal', x: 10, y: 2, w: 1, h: 1, dw: 76, say: '玉座。背もたれに、灯火炉と同じ紋が刻まれている。' },
            { img: 'furn_bookshelf_orthogonal', x: 3, y: 2, w: 2, h: 1, dw: 100, say: '子守歌の楽譜が、丁寧に綴じてある。同じ曲ばかりだ。' },
            { img: 'furn_bookshelf_orthogonal', x: 15, y: 2, w: 2, h: 1, dw: 100, say: '王子の幼い頃の絵本。手垢がつくほど読まれている。' },
            { img: 'furn_table_orthogonal', x: 4, y: 6, w: 2, h: 2, dw: 118, say: '長い評議の机。今は誰も座っていない。' },
            { img: 'furn_table_orthogonal', x: 14, y: 6, w: 2, h: 2, dw: 118, say: '記録の机。回収の命令書が重ねてある。' },
            { img: 'furn_lantern', x: 7, y: 3, w: 1, h: 1, dw: 30, say: '玉座の脇のランタン。声に合わせるように明滅している。' }, { img: 'furn_lantern', x: 13, y: 3, w: 1, h: 1, dw: 30 }]
        }
      },
      C11_DEVICE: {
        name: '暴走装置室', w: 20, h: 12, indoor: true, bgm: 'dusk', skin: { o: 'r' }, dim: 'rgba(80,30,110,.36)',
        ops: [['fill', 'x'], ['rect', 1, 2, 18, 10, 'o'], ['set', 10, 11, 'd']],
        points: { start: [10, 10], core: [10, 3] },
        layout: {
          wallColor: '#3b3347', windows: [], doorX: 10,
          furn: [
            { img: 'furn_stove', x: 3, y: 3, w: 1, h: 2, dw: 66, say: '装置の補助釜。灯火が過剰に流れ込んでいる。' }, { img: 'furn_stove', x: 16, y: 3, w: 1, h: 2, dw: 66, say: '装置の補助釜。ひびから白い光が漏れる。' },
            { img: 'furn_lantern', x: 7, y: 3, w: 1, h: 1, dw: 30, say: '脈打つように光るランタン。' }, { img: 'furn_lantern', x: 13, y: 3, w: 1, h: 1, dw: 30 },
            { img: 'furn_crate', x: 4, y: 7, w: 1, h: 1, dw: 52 }, { img: 'furn_crate', x: 15, y: 7, w: 1, h: 1, dw: 52 },
            { img: 'furn_chest', x: 2, y: 9, w: 1, h: 1, dw: 50, say: '保守用の工具箱。鍵はこじ開けられている。' }]
        }
      }
    },
    warps: [
      { map: 'C4_CAPITAL', at: [29, 6], to: 'C11_HALL', to_at: 'C11_HALL@start', dir: 'up', cond: 'ge:c10_complete' },
      { map: 'C11_HALL', at: [10, 12], to: 'C4_CAPITAL', to_at: 'C4_CAPITAL@hall_in', dir: 'down' },
      { map: 'C11_HALL', at: [17, 2], to: 'C11_DEVICE', to_at: 'C11_DEVICE@start', dir: 'up', cond: 'ge:c11_device' },
      { map: 'C11_DEVICE', at: [10, 11], to: 'C11_HALL', to_at: 'C11_HALL@device_door', dir: 'down' }
    ],
    assets: [
      { ...A('prop.throne', 'prop', '96x128・透明・正面。灯火炉の紋をあしらった玉座(第4章の城内と第11章で共用)', 'furn_chair_orthogonal', '高', '第4章 C4_CASTLE(9,2)・第11章 C11_HALL(10,2)'), status: '調整中' },
      { ...A('prop.lullaby_device', 'prop', '192x192・透明。子守歌を繰り返す暴走装置の中心(静止/暴走の差分)', 'furn_lantern', '高', '第11章 C11_DEVICE core(10,3)'), status: '調整中' },
      { ...A('bg.throne_room', 'bg', '960x540。玉座の間の戦闘背景', 'bg_battle', '中', '第11章 rogue_device 戦'), status: '調整中' }
    ]
  });
})();
