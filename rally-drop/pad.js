// iPhone・iPad の仮想スティック+ボタン(vpad.js)の割り当て。見た目はシューティングと同じ。
// スティック ← → ↓ = 移動・加速 / ボタン = S旗(黄)・回転・逆回転。レベルアップの選択中は出さない(カードをタップできるように)
(function () {
  const st = document.createElement('style'); st.textContent = 'html.vpad-on #pad{display:none!important}'; document.head.appendChild(st);   // 前の画面ボタンはしまう
  const E = () => window.DG && DG.engine;
  const me = () => { const e = E(); return e && e.S.players[0]; };
  const active = () => {
    const e = E(); if (!e) return false; const S = e.S, p = S.players[0];
    return S.scene === 'play' && !S.paused && !S.demo && !!p && p.phase !== 'pick' && p.phase !== 'over';
  };
  let dir = null;
  const portraitPos = (right, down, top) => (s, W, H) => {
    if (H <= W) return null;
    const canvas = document.getElementById('c');
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    return { x: W - right * s, y: top ? rect.top / 2 : rect.bottom + down * s };
  };
  VPad.setup({
    active,
    dir4: {
      onDir(d) {
        const p = me(); if (!p) return;
        if (dir && dir !== 'up') p.release(dir);
        dir = d;
        if (d && d !== 'up') { DG.Audio && DG.Audio.init && DG.Audio.init(); p.press(d); }   // ↑ は使わない(うっかり回転しないように)
      },
    },
    buttons: [
      { id: 'act', label: 'S旗', sub: '爆発', color: 'yellow', r: 46, x: 70, y: 82, at: portraitPos(60, 0, true), big: true },
      { id: 'rot', label: '⟳', sub: '回転', color: 'cyan', r: 38, x: 70, y: 175, at: portraitPos(155, 70, false) },
      { id: 'rotL', label: '⟲', sub: '逆回転', color: 'cyan', r: 34, x: 70, y: 260, at: portraitPos(60, 70, false) },
    ],
    onPress(id) { const p = me(); if (p) { DG.Audio && DG.Audio.init && DG.Audio.init(); p.press(id); } },
    onRelease(id) { const p = me(); if (p) p.release(id); },
  });
})();
