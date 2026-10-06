// iPhone・iPad の仮想スティック+ボタン(vpad.js)の割り当て。見た目はシューティングと同じ。
// スティック=移動 / 波動(長押しでためて、はなす) / FORCE(押すたびに 発射→呼び戻し→装着) / 低速(おしている間ゆっくり・当たりが小さい)
(function () {
  const V = () => window.VF;
  VPad.setup({
    active: () => { const v = V(); return !!v && v.touchActive(); },
    stick: { onMove(x, y, on) { const v = V(); if (v) v.input.stick(x, y, on); } },
    buttons: [
      { id: 'wave', label: '波動', sub: '長押し', color: 'yellow', r: 46, x: 70, y: 82, big: true },
      { id: 'force', label: 'FORCE', sub: '', color: 'cyan', r: 38, x: 172, y: 62 },
      { id: 'slow', label: '低速', sub: '', color: 'red', r: 34, x: 128, y: 168 },
    ],
    onPress(id) { const v = V(); if (v) { v.audioInit(); v.input.press(id); } },
    onRelease(id) { const v = V(); if (v) v.input.release(id); },
  });
})();
