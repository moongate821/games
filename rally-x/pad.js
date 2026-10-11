// RALLY X SURVIVORS 用の割り当て。スティック = 進みたい方向(交差点で曲がる予約・逆向きで反転)、ボタン = 煙幕・ブレーキ
(function () {
  // game.js の state / DEMO / touch(トップレベルの変数)をそのまま使う
  const active = () => typeof state !== 'undefined' && state === 'play' && !DEMO;
  VPad.setup({
    active,
    stick: {
      onMove(x, y, on) {
        touch.on = on; touch.dx = on && Math.hypot(x, y) > 0.25 ? x : 0; touch.dy = on && Math.hypot(x, y) > 0.25 ? y : 0;
        if (on && typeof initAudio === 'function') initAudio();
      },
    },
    buttons: [
      { id: 'smoke', label: 'SMOKE', sub: '煙幕', color: 'yellow', r: 52, x: 76, y: 88, big: true },
      { id: 'brake', label: 'BRAKE', sub: 'ブレーキ', color: 'red', r: 40, x: 196, y: 64 },
    ],
    onPress(id) { touch[id] = true; },
    onRelease(id) { touch[id] = false; },
  });
})();
