// ドット絵(コードで描く)。文字列の1文字=1ドット。補間はしない(imageSmoothing を切って拡大)。
(function () {
  const SP = window.SP = {};
  function make(rows, pal) {
    const c = document.createElement('canvas'); c.width = Math.max.apply(null, rows.map(r => r.length)); c.height = rows.length;
    const x = c.getContext('2d');
    rows.forEach((row, j) => { for (let i = 0; i < row.length; i++) { const col = pal[row[i]]; if (!col) continue; x.fillStyle = col; x.fillRect(i, j, 1, 1); } });
    return c;
  }
  SP.make = make;
  // ドットの円(半径 r のぎざぎざの丸)。内側 -> 外側 の色リスト
  function disc(r, cols) {
    const n = r * 2 + 1, c = document.createElement('canvas'); c.width = c.height = n; const x = c.getContext('2d');
    for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) {
      const d = Math.hypot(i - r, j - r); if (d > r + .35) continue;
      const k = Math.min(cols.length - 1, Math.floor((d / (r + .35)) * cols.length * .999));
      x.fillStyle = cols[k]; x.fillRect(i, j, 1, 1);
    }
    return c;
  }
  SP.disc = disc;
  // 自機(右向き) 18x9
  SP.player = make([
    "...ooooo..........",
    "..owwwwwoo........",
    "oowbbbbbbboo......",
    "owbbbbbbbbbboooo..",
    "obbbbccbbbbbbbwwoo",
    "owbbbbbbbbbboooo..",
    "oowbbbbbbboo......",
    "..owwwwwoo........",
    "...ooooo..........",
  ], { o: '#10163a', w: '#cfe8ff', b: '#4fa8ff', c: '#7dffea' });
  // 敵(左向き)
  SP.drone = make([
    "..oooo...",
    ".orrrro..",
    "orRwwRro.",
    "orrrrrrro",
    "orRwwRro.",
    ".orrrro..",
    "..oooo...",
  ], { o: '#2a0a18', r: '#d8405a', R: '#ff8aa0', w: '#fff6c0' });
  SP.swoop = make([
    "o.......o",
    "oo.....oo",
    ".oyyyyyo.",
    "..oyYYyo.",
    ".oyyyyyo.",
    "oo.....oo",
    "o.......o",
  ], { o: '#3a2a00', y: '#e8b800', Y: '#fff0a0' });
  SP.turret = make([
    "..oooooo..",
    ".ogggggGo.",
    "ogggGGgggo",
    "ogGwwwGggo",
    "ogggGGgggo",
    "oooooooooo",
    "oggggggggo",
  ], { o: '#08301a', g: '#2faa5a', G: '#7aeaa0', w: '#ffffff' });
  SP.ringer = make([
    "...oooooo...",
    "..opppppppo.",
    ".opPPpppPPpo",
    "opPwwPPPwwPpo",
    "opppPPPPPppo".slice(0, 12),
    "opPwwPPPwwPpo",
    ".opPPpppPPpo",
    "..opppppppo.",
    "...oooooo...",
  ].map(r => r.padEnd(13, '.')), { o: '#2a0a40', p: '#a050e8', P: '#e0a0ff', w: '#ffffff' });
  SP.carrier = make([
    "....oooooooooooo....",
    "..ooccccccccccccoo..",
    ".occCCCCCCCCCCCCcco.",
    "occCwwCCCCCCCCwwCcco",
    "occCCCCoooooCCCCCcco",
    "ocCCCCoRRRRRRoCCCCco",
    "occCCCCoooooCCCCCcco",
    "occCwwCCCCCCCCwwCcco",
    ".occCCCCCCCCCCCCcco.",
    "..ooccccccccccccoo..",
    "....oooooooooooo....",
  ], { o: '#101830', c: '#4a68b0', C: '#8ab0ff', w: '#ffffff', R: '#ff5a5a' });
  // 敵の弾(色ごと): 小(半径2) 中(3) 大(5)
  const BC = {
    red: ['#ffffff', '#ff7a7a', '#d02030'], orange: ['#fff6c0', '#ffb050', '#d06010'], pink: ['#ffffff', '#ff8ae0', '#c02090'],
    cyan: ['#ffffff', '#80f0ff', '#1090c0'], yellow: ['#ffffff', '#fff060', '#c09000'], green: ['#ffffff', '#90ff90', '#20a040'], violet: ['#ffffff', '#c8a0ff', '#6030c0'],
  };
  SP.bullets = {};
  for (const k in BC) SP.bullets[k] = [disc(2, BC[k]), disc(3, BC[k]), disc(5, BC[k])];
  SP.gem = disc(2, ['#ffffff', '#7dffb0', '#18a060']);
  SP.pshot = make(["wwwww", "bbbbb"], { w: '#ffffff', b: '#6fd0ff' });
  SP.pshotBig = make(["wwwwwww", "bbbbbbb", "wwwwwww"], { w: '#ffffff', b: '#ffe070' });
  SP.missile = make(["..ww", "bbbw", "..ww"], { w: '#ffffff', b: '#ff9a40' });
  SP.bit = make([".oo.", "owwo", "owwo", ".oo."], { o: '#103a2a', w: '#7dffb0' });
  SP.forceFrames = [
    disc(6, ['#ffffff', '#fff0a0', '#ffb030', '#c06000']),
    disc(6, ['#fffbe0', '#ffe070', '#ff9020', '#a04800']),
  ];
})();
// ---- 差し替え素材(assets/sprites.json)。無ければコードで描いた仮の形を使う ----
(function () {
  const SP = window.SP;
  SP.ext = {};
  SP.cfg = {};
  SP.loadManifest = function () {
    try {
      fetch('assets/sprites.json', { cache: 'no-cache' }).then(r => r.ok ? r.json() : {}).then(j => {
        for (const k in j) { const im = new Image(); im.onload = () => { SP.ext[k] = im; SP.cfg[k] = j[k]; }; im.onerror = () => { }; im.src = j[k].file; }
      }).catch(() => { });
    } catch (e) { }
  };
  SP.loadManifest();
  // 名前で描く: 外から差し替えた絵があればそれ(横幅 cfg.w に拡大縮小)、なければ仮の形(placeholder は canvas)
  SP.draw = function (ctx, name, x, y, placeholder, flash) {
    const im = SP.ext[name], cfg = SP.cfg[name];
    if (im) {
      const w = (cfg && cfg.w) || im.width, h = Math.round(im.height * w / im.width);
      ctx.drawImage(im, Math.round(x - w / 2), Math.round(y - h / 2), w, h);
      if (flash) { ctx.fillStyle = 'rgba(255,255,255,.55)'; ctx.fillRect(Math.round(x - w / 2), Math.round(y - h / 2), w, h); }
      return true;
    }
    if (placeholder) { ctx.drawImage(placeholder, Math.round(x - placeholder.width / 2), Math.round(y - placeholder.height / 2)); if (flash) { ctx.fillStyle = 'rgba(255,255,255,.55)'; ctx.fillRect(Math.round(x - placeholder.width / 2), Math.round(y - placeholder.height / 2), placeholder.width, placeholder.height); } }
    return false;
  };
})();
