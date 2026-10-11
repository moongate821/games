// DROP PARTY / WORLD BUILD DROP 用の割り当て(同じエンジン)。スティック ← → ↓ = 移動・加速、ボタン = 回転・逆回転・アクション
(function () {
  const st = document.createElement('style'); st.textContent = 'html.vpad-on #pad{display:none!important}'; document.head.appendChild(st);   // 前の画面ボタンはしまう
  const E = () => window.DG && DG.engine;
  const me = () => { const e = E(); return e && e.S.players[0]; };
  const active = () => {
    const e = E(); if (!e) return false; const S = e.S;
    return S.scene === 'play' && !S.paused && !S.demo && S.players.length > 0 && (S.players.length === 1 || S.cpuMode);
  };
  let dir = null;
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
    // 盤をタップして使う遊び(WORLD BUILD DROP の文字モードの入れ替え)は、盤の上をスティックにしない
    exclude(x, y) {
      const e = E(), p = me(); if (!e || !p || !p.rules.canSwap || !p.rules.canSwap(p)) return false;
      const r = e.cv.getBoundingClientRect(), cx = (x - r.left) / r.width * e.cv.width, cy = (y - r.top) / r.height * e.cv.height;
      return cx >= 24 && cx <= 24 + 6 * 44 && cy >= 64 && cy <= 64 + 12 * 44;
    },
    buttons: [
      { id: 'act', label: () => { const p = me(); return (p && p.rules.actLabel) || '落とす'; }, color: 'yellow', r: 46, x: 70, y: 82, big: true },
      { id: 'rot', label: '⟳', sub: '回転', color: 'cyan', r: 38, x: 172, y: 62 },
      { id: 'rotL', label: '⟲', sub: '逆回転', color: 'cyan', r: 34, x: 128, y: 168 },
    ],
    onPress(id) { const p = me(); if (p) { DG.Audio && DG.Audio.init && DG.Audio.init(); p.press(id); } },
    onRelease(id) { const p = me(); if (p) p.release(id); },
  });
})();
