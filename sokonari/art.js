/* 挿絵(昔のPCの絵)の共通の道具箱。3作で同じもの(正本は沈書庫)。作品ごとの絵は art_scenes.js に書く。
 * 画像ファイルは使わず、16色パレットとディザ(網点)でコードから描く。320x160 のドットを、ぼかさずに拡大して見せる。
 * パレットは VGA の標準16色(各色を 0/85/170/255 の4段階から選ぶ EGA の流れ):
 *   0 黒 1 青 2 緑 3 シアン 4 赤 5 マゼンタ 6 茶 7 明るい灰 8 暗い灰 9 明るい青 10 明るい緑 11 明るいシアン 12 明るい赤 13 明るいマゼンタ 14 黄 15 白
 *
 * 絵の足し方(art_scenes.js):
 *   ART.add('hands', { style: 'shock', rate: 5, draw(g, K) { ... } });
 *     style: 'shock' = 走査線で速く描く + 白黒反転の閃光 + 揺れ + 「ハッ」の音 / 'quiet' = ゆっくり描く、静かな音だけ
 *     rate : 1コマに描く行数(大きいほど速い。shock 5、quiet 2 が目安)
 *     draw(g, K): g は描画面(下の g.* )、K は部品(下の K.* )
 *   データ側は、イベント・結末・敵・階層に "art":"hands" と書くだけ。
 */
(function () {
  'use strict';
  const W = 320, H = 160;
  const PAL = ['#000000', '#0000aa', '#00aa00', '#00aaaa', '#aa0000', '#aa00aa', '#aa5500', '#aaaaaa',
    '#555555', '#5555ff', '#55ff55', '#55ffff', '#ff5555', '#ff55ff', '#ffff55', '#ffffff'];
  const RGB = PAL.map(h => [1, 3, 5].map(i => parseInt(h.substr(i, 2), 16)));
  const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
  const bay = (x, y) => BAYER[(y & 3) * 4 + (x & 3)] / 16;
  function rnd(seed) { return () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }

  // ---------- 描画面(パレットの番号を並べた配列) ----------
  function canvasBuf() {
    const b = new Uint8Array(W * H);
    const pick = (x, y, c, c2, t) => (c2 != null && bay(x, y) < t ? c2 : c);
    const g = {
      b, W, H,
      px(x, y, c) { x = Math.round(x); y = Math.round(y); if (x >= 0 && y >= 0 && x < W && y < H && c != null && c >= 0) b[y * W + x] = c; },
      get(x, y) { return b[Math.round(y) * W + Math.round(x)]; },
      // 塗り。c2 と t(0〜1)を渡すと、c と c2 をディザで混ぜる(t が c2 の割合)
      rect(x, y, w, h, c, c2, t) { for (let yy = Math.round(y); yy < Math.round(y + h); yy++) for (let xx = Math.round(x); xx < Math.round(x + w); xx++) g.px(xx, yy, pick(xx, yy, c, c2, t)); },
      dith(x, y, w, h, c1, c2, t) { g.rect(x, y, w, h, c1, c2, t); },
      // 縦のグラデーション(色の列を上から順に、間をディザでつなぐ)
      vgrad(x, y, w, h, cols) {
        for (let yy = 0; yy < h; yy++) {
          const f = yy / Math.max(1, h - 1) * (cols.length - 1), i = Math.min(cols.length - 2, Math.floor(f)), t = f - i;
          for (let xx = 0; xx < w; xx++) g.px(x + xx, y + yy, bay(x + xx, y + yy) < t ? cols[i + 1] : cols[i]);
        }
      },
      // 横のグラデーション
      hgrad(x, y, w, h, cols) {
        for (let xx = 0; xx < w; xx++) {
          const f = xx / Math.max(1, w - 1) * (cols.length - 1), i = Math.min(cols.length - 2, Math.floor(f)), t = f - i;
          for (let yy = 0; yy < h; yy++) g.px(x + xx, y + yy, bay(x + xx, y + yy) < t ? cols[i + 1] : cols[i]);
        }
      },
      line(x0, y0, x1, y1, c, th) {
        th = th || 1; x0 = Math.round(x0); y0 = Math.round(y0); x1 = Math.round(x1); y1 = Math.round(y1);
        const dx = Math.abs(x1 - x0), dy = -Math.abs(y1 - y0), sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1; let e = dx + dy;
        for (let guard = 0; guard < 4000; guard++) {
          if (th <= 1) g.px(x0, y0, c); else g.rect(x0 - Math.floor(th / 2), y0 - Math.floor(th / 2), th, th, c);
          if (x0 === x1 && y0 === y1) break;
          const e2 = 2 * e; if (e2 >= dy) { e += dy; x0 += sx; } if (e2 <= dx) { e += dx; y0 += sy; }
        }
      },
      // 多角形を塗る([[x,y],...])
      poly(pts, c, c2, t) {
        const y0 = Math.min(...pts.map(p => p[1])), y1 = Math.max(...pts.map(p => p[1]));
        for (let y = Math.floor(y0); y <= Math.ceil(y1); y++) {
          const xs = [];
          for (let i = 0; i < pts.length; i++) {
            const a = pts[i], d = pts[(i + 1) % pts.length];
            if ((a[1] <= y && d[1] > y) || (d[1] <= y && a[1] > y)) xs.push(a[0] + (y - a[1]) / (d[1] - a[1]) * (d[0] - a[0]));
          }
          xs.sort((p, q) => p - q);
          for (let k = 0; k + 1 < xs.length; k += 2) for (let x = Math.round(xs[k]); x < Math.round(xs[k + 1]); x++) g.px(x, y, pick(x, y, c, c2, t));
        }
      },
      // 輪郭だけの多角形
      outline(pts, c, th) { for (let i = 0; i < pts.length; i++) { const a = pts[i], d = pts[(i + 1) % pts.length]; g.line(a[0], a[1], d[0], d[1], c, th); } },
      circ(cx, cy, r, c, c2, t) { g.ellipse(cx, cy, r, r, c, c2, t); },
      ellipse(cx, cy, rx, ry, c, c2, t) {
        for (let y = -ry; y <= ry; y++) for (let x = -rx; x <= rx; x++) if ((x * x) / (rx * rx + 0.3) + (y * y) / (ry * ry + 0.3) <= 1.02)
          g.px(cx + x, cy + y, pick(Math.round(cx + x), Math.round(cy + y), c, c2, t));
      },
      // 円の輪(r0〜r1 の間)。a0〜a1 で角度を絞れる(ラジアン、0=右、時計回り)
      ring(cx, cy, r0, r1, c, a0, a1) {
        for (let y = -r1; y <= r1; y++) for (let x = -r1; x <= r1; x++) {
          const d = Math.sqrt(x * x + y * y); if (d < r0 || d > r1) continue;
          if (a0 != null) { let a = Math.atan2(y, x); if (a < 0) a += Math.PI * 2; if (a < a0 || a > a1) continue; }
          g.px(cx + x, cy + y, c);
        }
      },
      // 今ある色を置き換える(影を落とす・光を当てる)。from が null なら全部
      recolor(x, y, w, h, map, t) {
        for (let yy = Math.round(y); yy < Math.round(y + h); yy++) for (let xx = Math.round(x); xx < Math.round(x + w); xx++) {
          if (xx < 0 || yy < 0 || xx >= W || yy >= H) continue;
          const c = b[yy * W + xx]; if (map[c] != null && (t == null || bay(xx, yy) < t)) b[yy * W + xx] = map[c];
        }
      },
    };
    return g;
  }

  // ---------- 部品(K) ----------
  const K = {
    rnd, bay,
    // 星空
    stars(g, seed, n, x, y, w, h, cols) { const R = rnd(seed); cols = cols || [15, 7, 8]; for (let i = 0; i < n; i++) g.px(x + R() * w, y + R() * h, cols[Math.floor(R() * cols.length)]); },
    // ざらざら(古いモニターの感じ)
    grain(g, seed, n, c) { const R = rnd(seed); for (let i = 0; i < n; i++) g.px(R() * W, R() * H, c); },
    // 月・灯り(中心が明るく、外がディザでぼける)
    glow(g, cx, cy, r, inner, outer, back) {
      for (let y = -r; y <= r; y++) for (let x = -r; x <= r; x++) {
        const d = Math.sqrt(x * x + y * y) / r; if (d > 1) continue;
        const X = Math.round(cx + x), Y = Math.round(cy + y);
        if (d < 0.45) g.px(X, Y, inner); else if (bay(X, Y) < 1 - (d - 0.45) / 0.55) g.px(X, Y, outer); else if (back != null) g.px(X, Y, back);
      }
    },
    // 光の筋(灯台・投光器・懐中電灯)。(x,y) から角度 a、広がり sp、長さ len
    beam(g, x, y, a, sp, len, c, t) {
      const p1 = [x + Math.cos(a - sp) * len, y + Math.sin(a - sp) * len], p2 = [x + Math.cos(a + sp) * len, y + Math.sin(a + sp) * len];
      g.poly([[x, y], p1, p2], null, c, t == null ? 0.35 : t);
    },
    // 霧・もや(横の帯をディザで重ねる)
    fog(g, y, h, c, t, seed) { const R = rnd(seed || 3); for (let yy = y; yy < y + h; yy++) { const k = t * (1 - Math.abs((yy - y - h / 2) / (h / 2))); for (let x = 0; x < W; x++) if (bay(x, yy) < k * (0.7 + 0.6 * R())) g.px(x, yy, c); } },
    // 雪
    snow(g, seed, n, c) { const R = rnd(seed); for (let i = 0; i < n; i++) { const x = R() * W, y = R() * H; g.px(x, y, c == null ? 15 : c); if (R() < 0.3) g.px(x + 1, y, 7); } },
    // 水面(横の光の線)
    water(g, y0, y1, cols, hi, seed) {
      g.vgrad(0, y0, W, y1 - y0, cols);
      const R = rnd(seed || 5);
      for (let y = y0 + 2; y < y1; y += 3 + Math.floor(R() * 2)) for (let x = Math.floor(R() * 12); x < W; x += 10 + Math.floor(R() * 10)) g.line(x, y, x + 3 + Math.floor(R() * 6), y, hi);
    },
    // 波紋
    ripple(g, x, y, r, c) { for (let i = 0; i < 3; i++) { const rr = r + i * 5; g.line(x - rr, y + i * 2, x - rr * 0.4, y + i * 2 + 1, c); g.line(x + rr * 0.4, y + i * 2 + 1, x + rr, y + i * 2, c); } },
    // 人の影(立っている・後ろ姿)。(x,y) は足もと、h は背の高さ。coat=true で裾の広い外套
    figure(g, x, y, h, c, opt) {
      opt = opt || {};
      const hr = h * 0.09, sw = h * 0.16, top = y - h;
      g.ellipse(x, top + hr, hr, hr * 1.1, c);                                  // 頭
      if (opt.hat) g.rect(x - hr * 1.4, top + hr * 0.2, hr * 2.8, hr * 0.5, c);  // 帽子のつば
      g.poly([[x - sw * 0.5, top + hr * 2.1], [x + sw * 0.5, top + hr * 2.1], [x + sw * (opt.coat ? 0.85 : 0.6), y - h * 0.42], [x - sw * (opt.coat ? 0.85 : 0.6), y - h * 0.42]], c); // 胴
      if (opt.coat) g.poly([[x - sw * 0.85, y - h * 0.42], [x + sw * 0.85, y - h * 0.42], [x + sw * 1.0, y - h * 0.08], [x - sw * 1.0, y - h * 0.08]], c);
      g.rect(x - sw * 0.42, y - h * 0.45, sw * 0.32, h * 0.45, c);            // 脚
      g.rect(x + sw * 0.1, y - h * 0.45, sw * 0.32, h * 0.45, c);
      g.line(x - sw * 0.55, top + hr * 2.4, x - sw * (opt.armOut ? 1.4 : 0.75), y - h * (opt.armOut ? 0.62 : 0.45), c, Math.max(1, Math.round(h * 0.05)));
      g.line(x + sw * 0.55, top + hr * 2.4, x + sw * (opt.armUp ? 1.0 : 0.75), opt.armUp ? top - hr : y - h * 0.45, c, Math.max(1, Math.round(h * 0.05)));
      if (opt.rim != null) { g.line(x - sw * 0.5, top + hr * 2.2, x - sw * 0.6, y - h * 0.45, opt.rim); g.px(x - hr, top + hr, opt.rim); }
    },
    // 座っている人の影(椅子つき)
    seated(g, x, y, h, c, chairC) {
      const hr = h * 0.12;
      if (chairC != null) { g.rect(x - h * 0.3, y - h * 0.38, h * 0.62, h * 0.06, chairC); g.rect(x + h * 0.26, y - h * 0.95, h * 0.06, h * 0.95, chairC); g.rect(x - h * 0.28, y - h * 0.38, h * 0.05, h * 0.38, chairC); }
      g.ellipse(x, y - h + hr, hr, hr * 1.1, c);
      g.poly([[x - h * 0.16, y - h + hr * 2], [x + h * 0.16, y - h + hr * 2], [x + h * 0.2, y - h * 0.4], [x - h * 0.2, y - h * 0.4]], c);
      g.rect(x - h * 0.2, y - h * 0.44, h * 0.4, h * 0.1, c); g.rect(x - h * 0.2, y - h * 0.44, h * 0.08, h * 0.44, c);
    },
    // 窓(灯りのついた窓。枠つき)
    window(g, x, y, w, h, lit, frame) { g.rect(x, y, w, h, frame == null ? 8 : frame); g.rect(x + 1, y + 1, w - 2, h - 2, lit); g.line(x + w / 2, y, x + w / 2, y + h - 1, frame == null ? 8 : frame); g.line(x, y + h / 2, x + w - 1, y + h / 2, frame == null ? 8 : frame); },
    // 本の並ぶ書架
    shelves(g, x0, y0, x1, y1, seed, cols) {
      const R = rnd(seed);
      for (let sy = y0; sy < y1; sy += 22) {
        g.rect(x0, sy + 19, x1 - x0, 3, 8);
        let x = x0 + 2;
        while (x < x1 - 4) {
          const bw = 3 + Math.floor(R() * 4), bh = 12 + Math.floor(R() * 7), c = cols[Math.floor(R() * cols.length)];
          if (R() < 0.1) { x += bw; continue; }
          g.rect(x, sy + 19 - bh, bw, bh, c); g.px(x, sy + 19 - bh, 8);
          if (R() < 0.35) g.rect(x + 1, sy + 19 - bh + 3, Math.max(1, bw - 2), 1, 7);
          x += bw + 1;
        }
      }
    },
    // 時計(針の角度は時・分)
    clock(g, cx, cy, r, h, m, face, rim, hand) {
      g.circ(cx, cy, r, rim == null ? 8 : rim); g.circ(cx, cy, r - 2, face == null ? 7 : face);
      for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2; g.px(cx + Math.sin(a) * (r - 4), cy - Math.cos(a) * (r - 4), 0); }
      const ah = ((h % 12) + m / 60) / 12 * Math.PI * 2, am = m / 60 * Math.PI * 2;
      g.line(cx, cy, cx + Math.sin(ah) * r * 0.5, cy - Math.cos(ah) * r * 0.5, hand == null ? 0 : hand, 2);
      g.line(cx, cy, cx + Math.sin(am) * r * 0.78, cy - Math.cos(am) * r * 0.78, hand == null ? 0 : hand, 1);
    },
    // 目(暗がりから覗く)
    eye(g, x, y, r, iris) { g.ellipse(x, y, r * 1.4, r, 15); g.circ(x, y, Math.max(1, r * 0.55), iris == null ? 4 : iris); g.px(x - 1, y - 1, 15); },
    // 水面から伸びる白い手。(x,y) が手首、s が大きさ、tilt で指の開き、lit で明るく
    hand(g, x, y, s, tilt, lit) {
      const base = lit ? 15 : 7, shade = lit ? 7 : 8, w = 7 * s;
      g.poly([[x - w * 0.95, y + 60 * s], [x - w * 0.7, y], [x + w * 0.7, y], [x + w * 0.95, y + 60 * s]], base);
      g.poly([[x + w * 0.1, y + 60 * s], [x + w * 0.1, y], [x + w * 0.7, y], [x + w * 0.95, y + 60 * s]], base, shade, 0.5);
      g.line(x - w * 0.7, y, x - w * 0.95, y + 60 * s, 8, 1);
      const py = y - 9 * s;
      g.poly([[x - w * 0.7, y], [x + w * 0.7, y], [x + w * 1.15, py], [x - w * 1.15, py]], base);
      g.poly([[x + w * 0.2, y], [x + w * 0.7, y], [x + w * 1.15, py], [x + w * 0.3, py]], base, shade, 0.45);
      g.line(x - w * 1.15, py, x - w * 0.7, y, 8, 1);
      const len = [13, 17, 18, 15];
      for (let i = 0; i < 4; i++) {
        const fx = x - w * 0.95 + i * (w * 1.9 / 3), tx = fx + tilt * (i - 1.5) * 2.2 * s, ty = py - len[i] * s;
        g.line(fx, py + 1, tx, ty, 8, Math.max(3, Math.round(3.2 * s)));
        g.line(fx, py + 1, tx, ty, base, Math.max(2, Math.round(2.2 * s)));
        g.line(fx + 1, py, tx + 1, ty + 1, shade, 1);
        g.px(tx, ty - 1, 15);
        const jx = fx + (tx - fx) * 0.5, jy = py + (ty - py) * 0.5;
        g.line(jx - s, jy, jx + s, jy, shade, 1);
      }
      g.line(x - w * 1.1, y - 3 * s, x - w * 1.1 - 9 * s, y - 14 * s, 8, Math.max(3, Math.round(3.4 * s)));
      g.line(x - w * 1.1, y - 3 * s, x - w * 1.1 - 9 * s, y - 14 * s, base, Math.max(2, Math.round(2.4 * s)));
    },
    // 端末の画面(緑の文字の帯)
    terminal(g, x, y, w, h, seed, c, hi) { const R = rnd(seed); for (let yy = y; yy < y + h; yy += 8) { let xx = x; while (xx < x + w - 6) { const ww = 2 + Math.floor(R() * 8); if (R() < 0.8) g.rect(xx, yy, Math.min(ww * 2, x + w - xx), 4, R() < 0.1 ? hi : c); xx += ww * 2 + 3; } } },
    // 階段(奥へ下りる・上る)
    stairs(g, x, y, w, steps, dh, dw, c, edge) { for (let i = 0; i < steps; i++) { g.rect(x + i * dw, y - i * dh, w - i * dw * 2, dh, c); g.line(x + i * dw, y - i * dh, x + w - i * dw - 1, y - i * dh, edge); } },
  };

  // ---------- 登録と表示 ----------
  const scenes = {};
  function add(id, def) { scenes[id] = typeof def === 'function' ? { style: 'shock', draw: def } : def; }
  const active = [];
  function paint(canvas, g, rows) {
    const ctx = canvas.getContext('2d');
    const im = ctx.createImageData(W, rows);
    for (let i = 0; i < W * rows; i++) { const c = RGB[g.b[i]]; im.data[i * 4] = c[0]; im.data[i * 4 + 1] = c[1]; im.data[i * 4 + 2] = c[2]; im.data[i * 4 + 3] = 255; }
    ctx.putImageData(im, 0, 0);
  }
  const cache = {};
  function build(id) { if (!cache[id]) { const g = canvasBuf(); g.rect(0, 0, W, H, 0); scenes[id].draw(g, K); cache[id] = g; } return cache[id]; }
  // 走査線で上から描く。quick なら一気に
  function reveal(canvas, id, opt) {
    opt = opt || {};
    const g = build(id);
    canvas.width = W; canvas.height = H;
    const ctx = canvas.getContext('2d');
    const rate = opt.rate || 5;
    // dir:'up' の絵は下から上へ描く(光や出口を最後に見せたい時)
    const up = scenes[id] && scenes[id].dir === 'up';
    const job = { canvas, g, row: 0, done: false, cb: opt.done };
    const step = () => {
      if (job.done) return;
      job.row = Math.min(H, job.row + rate);
      if (up) { paint(canvas, g, H); ctx.fillStyle = '#000000'; ctx.fillRect(0, 0, W, H - job.row); if (job.row < H) { ctx.fillStyle = '#ffffff'; ctx.fillRect(0, H - job.row - 1, W, 1); } }
      else paint(canvas, g, job.row);
      if (!up && job.row < H) { ctx.fillStyle = '#ffffff'; ctx.fillRect(0, job.row, W, 1); }
      if (job.row >= H) finish(job); else job.t = requestAnimationFrame(step);
    };
    active.push(job);
    if (opt.quick) { job.row = H; paint(canvas, g, H); finish(job); } else step();
    return job;
  }
  function finish(job) {
    if (job.done) return; job.done = true; cancelAnimationFrame(job.t);
    paint(job.canvas, job.g, H);
    const i = active.indexOf(job); if (i >= 0) active.splice(i, 1);
    if (job.cb) job.cb();
  }
  function finishAll() { active.slice().forEach(finish); }
  const style = id => (scenes[id] && scenes[id].style) || 'shock';
  const rate = id => (scenes[id] && scenes[id].rate) || (style(id) === 'shock' ? 5 : 2);
  window.ART = {
    W, H, PAL, K, scenes, add, has: id => !!scenes[id], reveal, finishAll, style, rate,
    get busy() { return active.length > 0; },
    duration: id => Math.ceil(H / rate(id)) * 16 + 200,
    // 検証用: 描いた結果(パレット番号の配列)
    render: id => build(id),
  };
})();
