'use strict';
/* 第13章 maps: C13_CORE(灰の冠の中枢・洞窟風)。灰の海 C12_SEA の東の洞窟の口(42,11〜12)から入る。 */
(function () {
  const A = (id, kind, spec, fb, pr, note) => ({ id, kind, file: 'img/' + id.replace('.', '_') + '.png', spec, status: '未制作', fallback: fb, priority: pr, owner: 'Codex', note });
  registerChapter({
    id: 'c13',
    maps: {
      C13_CORE: {
        name: '灰の冠の中枢', w: 24, h: 16, indoor: true, bgm: 'crisis', skin: { o: 'r' }, dim: 'rgba(70,30,95,.5)',
        ops: [['fill', 'x'], ['rect', 1, 2, 22, 14, 'o'], ['set', 12, 15, 'd']],
        points: { start: [12, 13], vision1: [5, 9], vision2: [18, 9], vision3: [12, 8], crown: [12, 4] },
        layout: {
          wallColor: '#2a2433', windows: [], doorX: 12,
          furn: [
            { img: 'furn_lantern', x: 8, y: 3, w: 1, h: 1, dw: 30, say: '集められた灯火が、ランタンの中で苦しげに渦を巻いている。' }, { img: 'furn_lantern', x: 16, y: 3, w: 1, h: 1, dw: 30 },
            { img: 'furn_lantern', x: 3, y: 6, w: 1, h: 1, dw: 30 }, { img: 'furn_lantern', x: 20, y: 6, w: 1, h: 1, dw: 30 },
            { img: 'furn_crate', x: 3, y: 10, w: 1, h: 1, dw: 52, say: '崩れた箱。灰を被っている。' }, { img: 'furn_crate', x: 20, y: 10, w: 1, h: 1, dw: 52 },
            { img: 'furn_crate', x: 7, y: 11, w: 1, h: 1, dw: 52 }, { img: 'furn_crate', x: 16, y: 11, w: 1, h: 1, dw: 52 },
            { img: 'furn_barrel', x: 2, y: 13, w: 1, h: 1, dw: 46 }, { img: 'furn_barrel', x: 21, y: 13, w: 1, h: 1, dw: 46 },
            { img: 'furn_fence', x: 9, y: 6, w: 2, h: 1, dw: 100, say: '折れた柵。灰がこびりついている。' }, { img: 'furn_fence', x: 13, y: 6, w: 2, h: 1, dw: 100 }]
        }
      }
    },
    warps: [
      { map: 'C12_SEA', at: [42, 11], to: 'C13_CORE', to_at: 'C13_CORE@start', dir: 'up', cond: 'ge:c12_complete' },
      { map: 'C12_SEA', at: [42, 12], to: 'C13_CORE', to_at: 'C13_CORE@start', dir: 'up', cond: 'ge:c12_complete' },
      { map: 'C13_CORE', at: [12, 15], to: 'C12_SEA', to_at: 'C12_SEA@gate_in', dir: 'left' }
    ],
    assets: [
      { ...A('prop.crown_core', 'prop', '192x240・透明。灰の冠の中枢(静止/脈動/弱体化の3差分)', 'furn_lantern', '高', '第13章 crown(12,4)'), status: '調整中' },
      { ...A('prop.vision_mist', 'prop', '96x144・透明。幻の人影が現れる灰の霧(半透明)', 'furn_lantern', '中', '第13章 vision1〜3'), status: '調整中' },
      { ...A('bg.ash_core', 'bg', '960x540。灰の冠の中枢の戦闘背景', 'bg_battle', '中', '第13章 ash_crown 戦'), status: '調整中' }
    ]
  });
})();
