'use strict';

// Seven distinct mazes cycle through the first nineteen floors. Floor 20 has its own finale.
const FIELD_THEMES = [
  { name: 'ネオン・グリッド', floor: '#0a0d24', wall: '#141a4a', face: '#1b2468', core: '#10163c', edge: '#2f8cff', shine: '#9fd0ff', map: '#25308a', rubble: '#26336a', grid: '#4264b0', loops: .60, plazas: 5, pattern: 'lines' },
  { name: '地下工事区画', floor: '#18120b', wall: '#4c3020', face: '#695035', core: '#35251b', edge: '#ffab36', shine: '#ffe3a1', map: '#876139', rubble: '#826c52', grid: '#997950', loops: .30, plazas: 3, pattern: 'rivet' },
  { name: 'ミッドナイト・ストリート', floor: '#100b25', wall: '#302050', face: '#432967', core: '#211733', edge: '#a176ff', shine: '#e6d5ff', map: '#644497', rubble: '#4e386c', grid: '#674687', loops: .48, plazas: 4, pattern: 'stars' },
  { name: 'グリッチ・キャンバス', floor: '#14091d', wall: '#481d52', face: '#66266b', core: '#300f38', edge: '#ff52de', shine: '#ffe0fb', map: '#9b399b', rubble: '#754279', grid: '#a052a2', loops: .85, plazas: 7, pattern: 'glitch' },
  { name: 'ボルカニック・ロード', floor: '#210d0b', wall: '#572019', face: '#7c3120', core: '#38120f', edge: '#ff653b', shine: '#ffc08a', map: '#a44227', rubble: '#8e4029', grid: '#a83e27', loops: .25, plazas: 2, pattern: 'lava' },
  { name: 'フロスト・サーキット', floor: '#091d28', wall: '#1a4c60', face: '#26758a', core: '#123540', edge: '#70eaff', shine: '#d8ffff', map: '#3c8ca5', rubble: '#3d8190', grid: '#629aae', loops: .55, plazas: 6, pattern: 'ice' },
  { name: '廃車の墓場', floor: '#171a19', wall: '#353d38', face: '#526157', core: '#262e2a', edge: '#b3d674', shine: '#f0ffd2', map: '#6d845e', rubble: '#536a58', grid: '#748a65', loops: .38, plazas: 5, pattern: 'scrap' },
];
const FINAL_FIELD = { name: 'ゼロ・アーク中枢', floor: '#050711', wall: '#242233', face: '#343047', core: '#0e101c', edge: '#ffffff', shine: '#ffcf61', map: '#9280aa', rubble: '#685e7c', grid: '#514c73', loops: .95, plazas: 8, pattern: 'core' };
const fieldForStage = stage => stage >= 20 ? FINAL_FIELD : FIELD_THEMES[(stage - 1) % FIELD_THEMES.length];
let activeField = FIELD_THEMES[0];

// The marks are deterministic: the boss can redraw a broken tile without changing its neighbours.
function fieldFloor(g, tx, ty) {
  const f = activeField, x = tx * T, y = ty * T, h = ((tx * 73856093) ^ (ty * 19349663)) >>> 0;
  g.fillStyle = f.floor; g.fillRect(x, y, T, T);
  g.globalAlpha = .16 + (h % 5) * .018; g.fillStyle = f.edge;
  if (f.pattern === 'lines') g.fillRect(x + 8, y + 19, 24, 1);
  if (f.pattern === 'rivet') { g.fillRect(x + 5, y + 5, 3, 3); g.fillRect(x + 32, y + 32, 3, 3); }
  if (f.pattern === 'stars') { g.fillRect(x + h % 30 + 5, y + (h >>> 8) % 30 + 5, 2, 2); }
  if (f.pattern === 'glitch') { g.fillRect(x + h % 22, y + 9, 14, 2); g.fillRect(x + 8, y + 27, 18, 1); }
  if (f.pattern === 'lava') { g.fillRect(x + 4, y + 30, 19, 2); g.fillRect(x + 19, y + 24, 2, 8); }
  if (f.pattern === 'ice') { g.fillRect(x + 6, y + 5, 2, 14); g.fillRect(x + 6, y + 5, 13, 2); }
  if (f.pattern === 'scrap') { g.fillRect(x + 6, y + 13, 8, 3); g.fillRect(x + 25, y + 27, 9, 3); }
  if (f.pattern === 'core') { g.fillRect(x + 18, y + 7, 3, 26); g.fillRect(x + 7, y + 18, 26, 3); }
  g.globalAlpha = 1;
}
