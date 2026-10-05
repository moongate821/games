// Dungeon Explorer 用の割り当て。スティック ↑ = 前進(倒したままだと続けて進む)、← → = 向きを変える、↓ = 後ろを向く
// ボタン = 決定(宝箱・階段・調べる)。地図などほかの行動は、これまでどおり画面右の行動ボタンから。十字ボタンはスティックにおきかえる
(function () {
  const st = document.createElement('style'); st.textContent = 'html.vpad-on #dpad{visibility:hidden!important}'; document.head.appendChild(st);   // 前の画面ボタンはしまう
  const $id = id => document.getElementById(id);
  const active = () => {
    const d = $id('dpad'), m = $id('modal');
    return !!d && !d.hidden && (!m || m.hidden) && !document.body.classList.contains('busy') && typeof moveCmd === 'function';
  };
  let timer = null;
  const stop = () => { clearTimeout(timer); timer = null; };
  VPad.setup({
    active,
    dir4: {
      onDir(d) {
        stop(); if (!d) return;
        try { SND.unlock(); } catch (e) { }
        const fire = () => moveCmd(DIR_CMD[d]);
        fire();
        if (d === 'up') timer = setTimeout(function rep() { if (active()) fire(); timer = setTimeout(rep, 170); }, 380);   // 十字ボタンと同じ速さ
      },
    },
    // 決定ボタンは、右の行動ボタンの欄と下の文章欄をよけて置く(横向き=欄の左どなり、縦向き=欄の上)
    // 仲間の枠・上の帯・文章欄・行動ボタンにさわったときは、スティックにしない(そちらを押せるように)
    exclude(x, y) {
      return ['party', 'topbar', 'log', 'actions'].some(id => { const r = $id(id) && $id(id).getBoundingClientRect(); return r && r.width && x >= r.left && x <= r.right && y >= r.top && y <= r.bottom; });
    },
    buttons: [
      { id: 'ok', label: 'A', sub: '決定', color: 'yellow', r: 40, big: true, at(s, W, H) {
        const a = $id('actions').getBoundingClientRect(), lg = $id('log').getBoundingClientRect(), r = 40 * s, bottom = (lg.height ? lg.top : H) - r - 10;
        if (a.width && a.left > W * 0.5) return { x: a.left - r - 14, y: bottom };          // 横向き(行動ボタンが右側)
        if (a.width) {                                                                       // 縦向き(並んでいる行動ボタンの下の空き)
          const last = Math.max(a.top, ...[...$id('actions').querySelectorAll('button')].map(e => e.getBoundingClientRect().bottom));
          return { x: W - r - 24, y: Math.min(H - r - 70, Math.max(last + r + 16, H * 0.6)) };
        }
        return { x: W - r - 24, y: bottom };
      } },
    ],
    onPress(id) {
      try { SND.unlock(); } catch (e) { }
      if (id === 'ok') primaryDungeonAction();
    },
    onRelease() { },
  });
})();
