/* 底鳴りの挿絵(作品ごと)。道具箱は art.js。場面の決め方は 資料\挿絵案.md。
 * ART.add('名前', { style: 'shock' | 'quiet', rate, draw(g, K) { ... } })
 * この作品用の部品(潜水服など)は、下の「部品」にまとめた。art.js は3作共通なので触らない。
 */
(function () {
  'use strict';
  const W = ART.W, H = ART.H, bay = ART.K.bay, rnd = ART.K.rnd;

  // ---------- 部品 ----------
  // ディザの色(a と b を t の割合で混ぜる)。色の代わりに渡せる
  const D = (a, b, t) => (x, y) => (bay(x, y) < t ? b : a);
  const cv = (c, x, y) => (typeof c === 'function' ? c(x, y) : c);

  // 下書きの層。描いたドットを覚えておき、最後に輪郭をつけて描画面へ押す
  function layer() {
    const m = new Map();
    const L = {
      m,
      px(x, y, c) { x = Math.round(x); y = Math.round(y); if (x < 0 || y < 0 || x >= W || y >= H) return; const v = cv(c, x, y); if (v == null || v < 0) return; m.set(y * W + x, v); },
      rect(x, y, w, h, c) { for (let yy = Math.round(y); yy < Math.round(y + h); yy++) for (let xx = Math.round(x); xx < Math.round(x + w); xx++) L.px(xx, yy, c); },
      ellipse(cx, cy, rx, ry, c) {
        for (let y = Math.floor(-ry) - 1; y <= Math.ceil(ry) + 1; y++) for (let x = Math.floor(-rx) - 1; x <= Math.ceil(rx) + 1; x++)
          if ((x * x) / (rx * rx + 0.3) + (y * y) / (ry * ry + 0.3) <= 1.02) L.px(Math.round(cx) + x, Math.round(cy) + y, c);
      },
      poly(pts, c) {
        const y0 = Math.min(...pts.map(p => p[1])), y1 = Math.max(...pts.map(p => p[1]));
        for (let y = Math.floor(y0); y <= Math.ceil(y1); y++) {
          const xs = [];
          for (let i = 0; i < pts.length; i++) { const a = pts[i], d = pts[(i + 1) % pts.length]; if ((a[1] <= y && d[1] > y) || (d[1] <= y && a[1] > y)) xs.push(a[0] + (y - a[1]) / (d[1] - a[1]) * (d[0] - a[0])); }
          xs.sort((p, q) => p - q);
          for (let k = 0; k + 1 < xs.length; k += 2) for (let x = Math.round(xs[k]); x < Math.round(xs[k + 1]); x++) L.px(x, y, c);
        }
      },
      line(x0, y0, x1, y1, c, th) {
        th = th || 1; const n = Math.max(1, Math.ceil(Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0))));
        for (let i = 0; i <= n; i++) { const x = x0 + (x1 - x0) * i / n, y = y0 + (y1 - y0) * i / n; if (th <= 1.2) L.px(x, y, c); else L.ellipse(x, y, th / 2 - 0.5, th / 2 - 0.5, c); }
      },
    };
    return L;
  }
  // 層を描画面へ。oc は輪郭の色(外側に1ドット)、clip(x,y) で描く範囲を絞れる
  function stamp(g, L, oc, clip) {
    const ok = (x, y) => !clip || clip(x, y);
    if (oc != null) for (const k of L.m.keys()) {
      const x = k % W, y = (k / W) | 0;
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const X = x + dx, Y = y + dy;
        if (X < 0 || Y < 0 || X >= W || Y >= H || L.m.has(Y * W + X) || !ok(X, Y)) continue;
        g.px(X, Y, cv(oc, X, Y));
      }
    }
    for (const [k, c] of L.m) { const x = k % W, y = (k / W) | 0; if (ok(x, y)) g.px(x, y, c); }
  }
  // ディザの輪(r0〜r1、a0〜a1 の角度。0=右、時計回り)
  function ringD(g, cx, cy, r0, r1, c, t, a0, a1, sy) {
    sy = sy || 1;
    for (let y = -r1 * sy - 1; y <= r1 * sy + 1; y++) for (let x = -r1 - 1; x <= r1 + 1; x++) {
      const d = Math.sqrt(x * x + (y / sy) * (y / sy)); if (d < r0 || d > r1) continue;
      let a = Math.atan2(y, x); if (a < 0) a += Math.PI * 2;
      if (a0 != null && (a < a0 || a > a1)) continue;
      const X = Math.round(cx + x), Y = Math.round(cy + y);
      if (bay(X, Y) < cv(t, a, d)) g.px(X, Y, c);
    }
  }

  // 立っている潜水服(正面)。(x,y) が足もと、h が背の高さ。
  // P = { b: 服, s: 服の影, r: 兜(ヘルメット)と胸当て, rs: 兜の影, w: 窓, d: 長靴・手袋・帯 }
  function suitFront(L, x, y, h, P, opt) {
    opt = opt || {}; const u = h / 60;
    L.rect(x - 11 * u, y - 6 * u, 9 * u, 6 * u, P.d); L.rect(x + 2 * u, y - 6 * u, 9 * u, 6 * u, P.d);         // 長靴
    L.rect(x - 10 * u, y - 25 * u, 8 * u, 20 * u, P.b); L.rect(x + 2 * u, y - 25 * u, 8 * u, 20 * u, P.b);       // 脚
    L.rect(x + 6 * u, y - 25 * u, 4 * u, 20 * u, P.s); L.rect(x - 4 * u, y - 25 * u, 2 * u, 20 * u, P.s);
    L.poly([[x - 12 * u, y - 45 * u], [x + 12 * u, y - 45 * u], [x + 11 * u, y - 23 * u], [x - 11 * u, y - 23 * u]], P.b); // 胴
    L.poly([[x + 5 * u, y - 45 * u], [x + 12 * u, y - 45 * u], [x + 11 * u, y - 23 * u], [x + 5 * u, y - 23 * u]], P.s);
    L.rect(x - 11 * u, y - 28 * u, 22 * u, 3 * u, P.d);                                                          // 帯
    const la = opt.armL || [x - 16 * u, y - 25 * u], ra = opt.armR || [x + 16 * u, y - 25 * u];
    L.line(x - 12 * u, y - 42 * u, la[0], la[1], P.b, 6 * u); L.ellipse(la[0], la[1] + 1 * u, 3.4 * u, 3.4 * u, P.d);
    L.line(x + 12 * u, y - 42 * u, ra[0], ra[1], P.s, 6 * u); L.ellipse(ra[0], ra[1] + 1 * u, 3.4 * u, 3.4 * u, P.d);
    L.poly([[x - 14 * u, y - 43 * u], [x + 14 * u, y - 43 * u], [x + 9 * u, y - 50 * u], [x - 9 * u, y - 50 * u]], P.r); // 胸当て
    L.poly([[x + 4 * u, y - 43 * u], [x + 14 * u, y - 43 * u], [x + 9 * u, y - 50 * u], [x + 4 * u, y - 50 * u]], P.rs);
    L.ellipse(x, y - 55 * u, 10 * u, 10 * u, P.r);                                                               // 兜
    L.ellipse(x + 4 * u, y - 54 * u, 5 * u, 8 * u, P.rs);
    if (P.w != null) { L.ellipse(x, y - 55 * u, 6.5 * u, 6.5 * u, P.d); L.ellipse(x, y - 55 * u, 5.2 * u, 5.2 * u, P.w); } // 前の窓
    return { hx: x, hy: y - 55 * u, hr: 10 * u, wr: 5.2 * u, chest: [x - 2 * u, y - 40 * u] };
  }

  // 仰向けに倒れた潜水服(横から)。腕は上へ伸ばしたまま。(x,y) は兜の下の砂
  function suitLying(L, x, y, u, P, R) {
    const j = () => (R() - 0.5) * 4 * u;
    L.rect(x + 50 * u, y - 13 * u, 6 * u, 13 * u, P.d);                                     // 長靴(つま先が上)
    L.rect(x + 28 * u, y - 9 * u, 24 * u, 8 * u, P.s);                                      // 奥の脚
    L.rect(x + 28 * u, y - 7 * u, 24 * u, 7 * u, P.b);                                      // 手前の脚
    L.ellipse(x + 19 * u, y - 7 * u, 13 * u, 7 * u, P.b);                                   // 胴
    L.rect(x + 8 * u, y - 4 * u, 24 * u, 4 * u, P.s);
    const a1 = x + 3 * u + j(), a2 = x + 15 * u + j();
    L.line(x + 9 * u, y - 10 * u, a1, y - 42 * u, P.s, 4.5 * u);                           // 奥の腕(上へ)
    L.ellipse(a1, y - 44 * u, 3.2 * u, 3.6 * u, P.d);
    L.line(x + 13 * u, y - 9 * u, a2, y - 40 * u, P.b, 4.5 * u);                           // 手前の腕
    L.ellipse(a2, y - 42 * u, 3.2 * u, 3.6 * u, P.d);
    L.ellipse(x, y - 8 * u, 8.5 * u, 8.5 * u, P.r);                                         // 兜
    L.ellipse(x - 1 * u, y - 15 * u, 4 * u, 2 * u, P.d);                                    // 上を向いた窓
    L.ellipse(x - 5 * u, y - 7 * u, 2.4 * u, 2.4 * u, P.d);                                 // 横の窓
  }

  // ========== 1. 1層 f1_suits: 空っぽの潜水服が並ぶ(shock) ==========
  ART.add('suits', { style: 'shock', rate: 5, draw(g, K) {
    const ox = 0, oy = -24, ax = Math.atan2(174, 150), sp = 0.2;
    const far = (x, y) => Math.abs(Math.atan2(y - oy, x - ox) - ax) / sp;
    const lit = (x, y) => {
      let da = Math.abs(Math.atan2(y - oy, x - ox) - ax) / sp; if (da >= 1) return 0;
      const dist = Math.hypot(x - ox, y - oy); return (1 - da * da) * Math.max(0, 1 - dist / 380) * 1.6;
    };
    // 水と砂
    g.rect(0, 0, W, 58, 0);
    for (let y = 58; y < H; y++) for (let x = 0; x < W; x++) if (bay(x, y) < 0.04 + (y - 58) / 102 * 0.12) g.px(x, y, 1);
    K.grain(g, 4, 200, 1);
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const l = lit(x, y); if (l <= 0) continue;
      const c = g.get(x, y), b = bay(x, y);
      if (y < 58) { if (b < l * 0.22) g.px(x, y, 9); else if (b < l * 0.5) g.px(x, y, 1); }
      else if (b < l * 0.22) g.px(x, y, 7); else if (b < l * 0.9) g.px(x, y, 8); else if (b < l * 1.8) g.px(x, y, 1);
    }
    // 砂の筋
    const R = rnd(21);
    for (let i = 0; i < 70; i++) { const x = R() * W, y = 62 + R() * 98, w = 4 + R() * 10; g.line(x, y, x + w, y, lit(x, y) > 0.3 ? 7 : 0); }
    // 潜水服の列(奥から手前へ)
    const rows = [[68, 0.3, 11], [88, 0.42, 4], [114, 0.58, 17], [148, 0.8, 9]];
    for (const [ry, u, s] of rows) {
      const Rr = rnd(s), step = 80 * u;
      for (let x = -10 + Rr() * step; x < W + 10; x += step * (0.85 + Rr() * 0.3)) {
        const y = ry + (Rr() - 0.5) * 6 * u;
        const tier = (px, py) => { const l = lit(px, py) + (bay(px, py) - 0.5) * 0.25; return l > 0.55 ? 2 : l > 0.2 ? 1 : 0; };
        const P = {
          b: (px, py) => [0, 8, D(7, 15, 0.1)(px, py)][tier(px, py)],
          s: (px, py) => [0, D(8, 0, 0.5)(px, py), 8][tier(px, py)],
          r: (px, py) => [0, 8, D(7, 15, 0.3)(px, py)][tier(px, py)],
          d: (px, py) => [0, 0, 8][tier(px, py)],
        };
        const L = layer(); suitLying(L, x, y, u, P, Rr);
        stamp(g, L, (px, py) => (tier(px, py) > 0 ? 0 : far(px, py) < 2.4 ? 1 : far(px, py) < 3.6 ? D(0, 1, 0.5)(px, py) : D(0, 1, 0.2)(px, py)));
        if (lit(x, y - 8 * u) > 0.55) g.px(x - 3 * u, y - 12 * u, 15);           // 兜のハイライト
        // 胸の白い印(どの服にも同じ四角)
        const mx = Math.round(x + 22 * u), my = Math.round(y - 13 * u), ms = Math.max(2, Math.round(3 * u));
        const ml = lit(mx, my);
        g.rect(mx - 1, my - 1, ms + 2, ms + 1, 0);
        g.rect(mx, my, ms, ms - (u < 0.5 ? 0 : 1), ml > 0.3 ? 15 : ml > 0.08 ? 7 : 8);
      }
    }
    // 光の外のもや
    K.grain(g, 9, 160, 8);
  } });

  // ========== 2. 2層 tomaridokei: 止まり時計(shock) ==========
  ART.add('stillclock', { style: 'shock', rate: 5, draw(g, K) {
    g.vgrad(0, 0, W, 140, [0, 1, 0]);
    K.grain(g, 6, 300, 1);
    // 水面
    K.water(g, 140, H, [1, 0, 0], 9, 7);
    for (let y = 142; y < H; y += 3) g.line(130 + (y % 7), y, 190 - (y % 5), y, D(8, 7, 0.4));
    const cx = 160, cy = 70, r = 64;
    // 振り子(錆びた鉄の腕)。文字盤の下から左へ
    const P = layer();
    P.line(cx, cy + 40, 92, 146, 6, 5); P.line(cx, cy + 40, 92, 146, D(6, 4, 0.3), 3);
    P.ellipse(84, 148, 12, 10, D(6, 4, 0.35)); P.ellipse(80, 145, 5, 4, D(6, 7, 0.25));
    stamp(g, P, 0);
    K.ripple(g, 84, 156, 14, 9);
    // 枠
    g.circ(cx, cy, r + 2, 0);
    for (let y = -r; y <= r; y++) for (let x = -r; x <= r; x++) {
      const d = Math.hypot(x, y); if (d > r) continue;
      const X = cx + x, Y = cy + y, b = bay(X, Y);
      if (d > r - 6) { const k = (x + y) / r; g.px(X, Y, k < -0.6 ? (b < 0.4 ? 7 : 8) : k > 0.4 ? (b < 0.3 ? 6 : 0) : (b < 0.25 ? 6 : 8)); continue; }
      if (d > r - 7) { g.px(X, Y, 0); continue; }
      const k = (x + y) / r; let c = 7;
      if (k < -0.7 && b < (-0.7 - k) * 1.4) c = 15; if (k > 0.3 && b < (k - 0.3) * 0.9) c = 8;
      g.px(X, Y, c);
    }
    // 錆と水垢
    const R = rnd(33);
    for (let i = 0; i < 14; i++) { const a = R() * 6.28, dd = R() * 50; g.ellipse(cx + Math.cos(a) * dd, cy + Math.sin(a) * dd * 0.9 + 6, 2 + R() * 5, 1 + R() * 3, 7, 8, 0.4); }
    for (let x = cx - 52; x < cx + 52; x++) for (let y = cy + 36; y < cy + 58; y++) if (Math.hypot(x - cx, y - cy) < r - 8 && bay(x, y) < (y - cy - 36) / 60) g.px(x, y, g.get(x, y) === 15 ? 7 : 8);
    // 目盛り(数字は無し)
    for (let i = 0; i < 60; i++) {
      const a = i / 60 * Math.PI * 2, s = Math.sin(a), c = -Math.cos(a);
      if (i % 5 === 0) g.line(cx + s * 44, cy + c * 44, cx + s * 54, cy + c * 54, 0, 3);
      else g.line(cx + s * 51, cy + c * 51, cx + s * 54, cy + c * 54, 8);
    }
    // 針: 三時十七分。長針は十六分から十七分へ、いま動いた
    const hand = (ang, len, wd, c, tail) => {
      const s = Math.sin(ang), c2 = -Math.cos(ang), nx = -c2, ny = s;
      g.poly([[cx - s * tail + nx * wd, cy - c2 * tail + ny * wd], [cx + s * len * 0.8 + nx * wd, cy + c2 * len * 0.8 + ny * wd], [cx + s * len, cy + c2 * len],
        [cx + s * len * 0.8 - nx * wd, cy + c2 * len * 0.8 - ny * wd], [cx - s * tail - nx * wd, cy - c2 * tail - ny * wd]], c);
    };
    const am = 17 / 60 * Math.PI * 2, am0 = 16 / 60 * Math.PI * 2, ah = (3 + 17 / 60) / 12 * Math.PI * 2;
    // 残像
    for (let k = 0; k < 4; k++) { const a = am0 + (am - am0) * k / 4; g.line(cx, cy, cx + Math.sin(a) * 50, cy - Math.cos(a) * 50, D(7, 8, 0.6 - k * 0.12), 1); }
    ringD(g, cx, cy, 52, 56, 15, 0.55, am0 - Math.PI / 2 - 0.02, am - Math.PI / 2 + 0.02);
    for (let i = 0; i < 3; i++) { const a = am + 0.08 + i * 0.05; g.line(cx + Math.sin(a) * 58, cy - Math.cos(a) * 58, cx + Math.sin(a) * 61, cy - Math.cos(a) * 61, 15); }
    hand(ah, 28, 5, 0, 7);
    hand(am, 55, 2, 0, 12);
    g.line(cx + 2, cy - 1, cx + Math.sin(am) * 50, cy - Math.cos(am) * 50 - 1, 8);
    g.px(cx + Math.sin(am) * 51, cy - Math.cos(am) * 51 - 1, 15);
    // 軸(赤は、ここ一点だけ)
    g.circ(cx, cy, 5, 0); g.circ(cx, cy, 3, 4); g.px(cx - 1, cy - 1, 12);
    // ガラスの光
    g.line(cx - 40, cy - 38, cx - 30, cy - 46, 15); g.line(cx - 44, cy - 30, cx - 42, cy - 32, 15);
  } });

  // ========== 3. 3層 f3_mirror: 鏡の中の、空っぽのヘルメット(shock) ==========
  ART.add('mirror', { style: 'shock', rate: 5, draw(g, K) {
    // 洗面所の壁(濃い灰のタイル)
    g.rect(0, 0, W, H, 0, 8, 0.22);
    for (let y = 10; y < H; y += 20) g.line(0, y, W, y, 0);
    for (let y = 0; y < H; y += 20) for (let x = (y / 20) % 2 ? 10 : 0; x < W; x += 20) g.line(x, y, x, y + 9, 0);
    g.recolor(0, 0, W, 30, { 8: 0 }, 0.6);
    // 鏡の枠
    const x0 = 104, y0 = 6, x1 = 216, y1 = 154;
    g.rect(x0 - 1, y0 - 1, x1 - x0 + 2, y1 - y0 + 2, 0);
    g.rect(x0, y0, x1 - x0, y1 - y0, 7);
    g.rect(x0 + 2, y0 + 2, x1 - x0 - 2, y1 - y0 - 2, 8);
    g.line(x0, y0, x1 - 1, y0, 15); g.line(x0, y0, x0, y1 - 1, 15);
    const ix0 = x0 + 6, iy0 = y0 + 6, ix1 = x1 - 6, iy1 = y1 - 6;
    g.rect(ix0 - 1, iy0 - 1, ix1 - ix0 + 2, iy1 - iy0 + 2, 0);
    // 鏡の中: 暗い部屋と、立っている潜水服
    g.vgrad(ix0, iy0, ix1 - ix0, iy1 - iy0, [1, 0, 0]);
    const inside = (x, y) => x >= ix0 && x < ix1 && y >= iy0 && y < iy1;
    const L = layer();
    const S = suitFront(L, 160, 160, 128, { b: D(8, 0, 0.2), s: D(0, 8, 0.3), r: D(7, 8, 0.35), rs: D(8, 0, 0.3), d: 0, w: null },
      { armL: [142, 120], armR: [178, 120] });
    stamp(g, L, 0, inside);
    // ヘルメットの窓の中: 顔は無い。黒い水と、揺れる水面だけ
    const hx = S.hx, hy = S.hy;
    g.circ(hx, hy, 15, 0); g.ring(hx, hy, 12.5, 15, 8); g.ring(hx, hy, 13.5, 14.2, 7, 3.3, 4.6);
    g.circ(hx, hy, 12, 0);
    for (let k = 0; k < 3; k++) for (let x = -11; x <= 11; x++) {
      const y = Math.round(hy - 2 + k * 4 + Math.sin(x * 0.55 + k * 1.7) * 1.1);
      if (Math.hypot(x, y - hy) < 11) g.px(hx + x, y, [9, 1, 3][k]);
    }
    g.px(hx - 7, hy - 7, 15); g.px(hx - 6, hy - 8, 15); g.px(hx - 8, hy - 5, 7);
    // 曇り。斜めに一本だけ拭った跡(ヘルメットのところ)
    const wipe = (x, y) => Math.abs((x - hx) * 0.82 + (y - hy) * 0.57 - 0) < 17 + Math.sin(y * 0.3) * 1.5;
    for (let y = iy0; y < iy1; y++) for (let x = ix0; x < ix1; x++) {
      if (wipe(x, y)) continue;
      const b = bay(x, y), edge = Math.abs((x - hx) * 0.82 + (y - hy) * 0.57) - 17;
      const t = Math.min(0.55, 0.3 + edge * 0.02);
      if (b < 0.1) g.px(x, y, 7); else if (b < t) g.px(x, y, 8);
    }
    // 拭き跡の縁の、水のしずく
    const R = rnd(8);
    for (let i = 0; i < 9; i++) {
      const t = (R() - 0.5) * 120, sx = hx - 0.57 * t + 0.82 * 18, sy = hy + 0.82 * t + 0.57 * 18;
      if (!inside(sx, sy)) continue; const len = 3 + R() * 7;
      g.line(sx, sy, sx, sy + len, 7); g.px(sx, sy + len, 15);
    }
    // 鏡の外: 手前の端に、拭った手袋の手
    const Hd = layer(), gc = D(7, 8, 0.3), gs = D(8, 0, 0.3);
    Hd.ellipse(296, 150, 30, 22, gc);
    Hd.ellipse(304, 156, 22, 14, gs);
    for (const [fx, fy, tx, ty] of [[276, 136, 244, 118], [282, 132, 252, 110], [290, 130, 264, 108], [298, 130, 278, 112]]) { Hd.line(fx, fy, tx, ty, gc, 9); Hd.line(fx + 2, fy + 3, tx + 2, ty + 3, gs, 3); }
    Hd.line(272, 150, 250, 146, gc, 10);
    stamp(g, Hd, 0);
    g.line(246, 116, 252, 112, 15); g.line(254, 108, 258, 106, 15); g.px(268, 108, 15);
    g.px(240, 124, 11); g.px(256, 122, 9); g.line(262, 124, 262, 127, 9);
  } });

  // ========== 4. 1層 f1_bell: 鐘室。上へ広がる、答えたい輪(quiet) ==========
  ART.add('bellroom', { style: 'quiet', rate: 2, draw(g, K) {
    g.rect(0, 0, W, H, 0);
    // 丸い部屋の壁(下ほど見える)
    for (const ph of [-1.35, -1.05, -0.7, -0.35, 0.35, 0.7, 1.05, 1.35]) {
      const x = 160 + Math.sin(ph) * 158;
      for (let y = 50; y < 146 - Math.cos(ph) * 10; y++) if (bay(x, y) < (y - 50) / 110) { g.px(x, y, 1); g.px(x + 1, y, bay(x + 1, y) < 0.3 ? 1 : 0); }
    }
    for (let x = 0; x < W; x++) { const y = 146 - Math.sqrt(Math.max(0, 1 - ((x - 160) / 160) ** 2)) * 10; g.px(x, y, D(1, 9, 0.15)(x, Math.round(y))); }
    g.rect(0, 150, W, 10, 0, 1, 0.12);
    // 輪(下から上へ広がる。内側は明るく、外ほど淡く)
    const cx = 160, cy = 88;
    const rings = [[20, 4, 11, 0.6], [32, 5, 11, 0.75], [50, 6, 3, 0.8], [72, 6, 9, 0.5], [98, 6, 1, 0.8]];
    rings.forEach(([r, th, c, t], i) => {
      const ccy = cy - i * 7, half = Math.PI * (0.95 - i * 0.1);
      ringD(g, cx, ccy, r - th / 2, r + th / 2, c, (a) => t * Math.max(0, 1 - Math.abs(a - Math.PI * 1.5) / (half / 2 + 0.01)) ** 0.5, Math.PI * 1.5 - half / 2, Math.PI * 1.5 + half / 2, 0.8);
      ringD(g, cx, ccy, r + th / 2, r + th / 2 + 2, 1, (a) => 0.35 * Math.max(0, 1 - Math.abs(a - Math.PI * 1.5) / (half / 2)), Math.PI * 1.5 - half / 2, Math.PI * 1.5 + half / 2, 0.8);
    });
    // 聴音器(灰の筒、上に開いた口)
    const L = layer();
    L.ellipse(160, 146, 18, 4, D(8, 0, 0.3));
    L.rect(155, 94, 11, 52, 7); L.rect(162, 94, 4, 52, 8);
    L.poly([[146, 84], [175, 84], [166, 96], [155, 96]], 7); L.poly([[164, 84], [175, 84], [166, 96], [162, 96]], 8);
    L.rect(153, 116, 15, 3, 8); L.rect(153, 130, 15, 3, 8);
    stamp(g, L, 0);
    g.ellipse(160, 84, 13, 2, 0); g.line(148, 85, 172, 85, 8);
    g.line(156, 98, 156, 144, 15); g.px(147, 84, 15);
    // 上へのぼる、小さな泡
    const R = rnd(14);
    for (let i = 0; i < 9; i++) g.px(150 + R() * 20, 70 - R() * 50, R() < 0.4 ? 11 : 9);
    K.grain(g, 2, 50, 1);
  } });

  // ========== 5. 4層 utsushimi: 鯨骨の森。向こうも同じ投光器(shock) ==========
  ART.add('likeness', { style: 'shock', rate: 5, draw(g, K) {
    g.vgrad(0, 0, W, H, [1, 1, 0, 0]);
    g.rect(0, 0, W, 26, 1, 9, 0.08);
    // 上からの薄い光の筋
    for (const [x, w] of [[40, 18], [110, 10], [230, 22], [290, 12]]) for (let y = 0; y < 130; y++) for (let k = 0; k < w; k++) { const X = x + k - y * 0.25; if (bay(X, y) < 0.14 * (1 - y / 130)) g.px(X, y, 9); }
    // 海底
    g.vgrad(0, 126, W, 34, [8, 1, 0]); K.grain(g, 12, 260, 8);
    // 肋骨のアーチ
    const rib = (cx, by, a, h, th, far) => {
      const pts = []; for (let i = 0; i <= 80; i++) { const t = Math.PI * i / 80; pts.push([cx - a * Math.cos(t), by - h * Math.sin(t), Math.sin(t)]); }
      const tk = s => th * (0.55 + 0.45 * s);
      const c = far ? [0, 1, 9, 9] : [0, 8, 7, 15];
      for (const [x, y, s] of pts) g.circ(x, y, tk(s) / 2 + 1, c[0]);
      for (const [x, y, s] of pts) g.circ(x, y, tk(s) / 2, c[1]);
      for (const [x, y, s] of pts) g.circ(x, y - 1, Math.max(0, tk(s) / 2 - 1), c[2], far ? null : 15, 0.12);
      if (!far) for (const [x, y, s] of pts) if (s > 0.25) g.px(x - Math.cos(Math.asin(s)) * 0, y - tk(s) / 2, c[3]);
    };
    // 奥の骨(暗い青)
    for (const [cx, a, h] of [[30, 26, 34], [86, 22, 28], [236, 24, 30], [292, 28, 36], [126, 14, 18], [200, 15, 20]]) rib(cx, 130, a, h, 3, true);
    // 手前の骨
    rib(48, 138, 44, 70, 6, false); rib(274, 140, 46, 74, 6, false);
    rib(160, 140, 66, 40, 8, false);                 // いちばん高い骨(その上に人影)
    rib(-10, 162, 40, 150, 9, false); rib(330, 162, 40, 150, 9, false);
    // こちらを照らす投光器(画面の真ん中に、まぶしい円)。まず後ろの光の輪
    const lx = 160, ly = 63;
    for (let y = -44; y <= 44; y++) for (let x = -60; x <= 60; x++) {
      const d = Math.hypot(x, y * 1.25) / 52; if (d > 1) continue;
      const X = lx + x, Y = ly + y, c = g.get(X, Y), b = bay(X, Y), k = (1 - d);
      if (b < k * 0.9) g.px(X, Y, c === 0 || c === 1 ? 8 : c === 8 || c === 9 ? 7 : 15);
    }
    for (let i = 0; i < 16; i++) {
      const a = i / 16 * Math.PI * 2 + 0.1, len = i % 2 ? 50 : 76;
      for (let d = 14; d < len; d++) { const X = lx + Math.cos(a) * d, Y = ly + Math.sin(a) * d * 0.85; if (bay(Math.round(X), Math.round(Y)) < 0.85 * (1 - d / len)) g.px(X, Y, d < 34 ? 15 : 7); }
    }
    // 骨の上に立つ潜水服の人影(光を背負って黒い)
    const L = layer();
    suitFront(L, 160, 99, 42, { b: 0, s: 0, r: 0, rs: 0, d: 0, w: null }, { armL: [146, 76], armR: [174, 76] });
    stamp(g, L, 8);
    g.line(149, 98, 171, 98, 15);
    // 胸もとのまぶしい投光器(中身は見えない)
    K.glow(g, lx, ly, 17, 15, 7);
    g.circ(lx, ly, 7, 15);
    g.line(lx - 24, ly, lx + 24, ly, 15); g.line(lx, ly - 18, lx, ly + 16, 15);
  } });

  // ========== 6. 5層 shogou: 減圧室の扉。内側から焼ける溶接(shock) ==========
  ART.add('weld', { style: 'shock', rate: 5, draw(g, K) {
    // 浅い層の明るい水
    g.vgrad(0, 0, W, H, [11, 3, 3, 1]);
    for (let y = 0; y < 40; y++) for (let x = 0; x < W; x++) { const n = Math.sin(x * 0.12 + Math.sin(y * 0.3) * 2) + Math.sin(y * 0.25 - x * 0.05); if (Math.abs(n) < 0.12) g.px(x, y, 15); }
    const cx = 160, cy = 80, R0 = 79;
    g.circ(cx, cy, R0 + 1, 0);
    for (let y = -R0; y <= R0; y++) for (let x = -R0; x <= R0; x++) {
      const d = Math.hypot(x, y); if (d > R0) continue;
      const X = cx + x, Y = cy + y, b = bay(X, Y), k = (x + y) / R0;
      let c;
      if (d > 71) c = k < -0.5 ? (b < 0.5 ? 15 : 7) : k > 0.5 ? (b < 0.5 ? 0 : 8) : (b < 0.3 ? 7 : 8);  // 外の縁
      else if (d > 70) c = 0;
      else { c = 7; if (k < -0.6 && b < (-0.6 - k) * 1.2) c = 15; if (k > 0.2 && b < (k - 0.2) * 0.7) c = 8; }
      g.px(X, Y, c);
    }
    // ボルト
    for (let i = 0; i < 16; i++) { const a = i / 16 * Math.PI * 2, x = cx + Math.cos(a) * 75, y = cy + Math.sin(a) * 75; g.circ(x, y, 2, 0); g.px(x, y, 8); g.px(x - 1, y - 1, 7); }
    // 内側から叩かれた、無数の膨らみ(十一年ぶん)
    const R = rnd(77);
    for (let i = 0; i < 260; i++) {
      const rr = 56 * Math.pow(R(), 0.8), a = R() * Math.PI * 2, x = Math.round(cx + Math.cos(a) * rr), y = Math.round(cy + Math.sin(a) * rr), s = R() < 0.25 ? 2 : 1;
      if (s === 2) { g.px(x - 1, y - 1, 15); g.px(x, y - 1, 15); g.px(x - 1, y, 15); g.px(x + 1, y + 1, 8); g.px(x + 1, y, 8); g.px(x, y + 1, 8); g.px(x, y, 7); }
      else { g.px(x, y, 15); g.px(x + 1, y + 1, 8); }
    }
    g.circ(cx, cy, 9, 8, 7, 0.3); g.ring(cx, cy, 9, 10, 0); g.px(cx - 4, cy - 4, 15);
    // 溶接の線(赤と黄で焼ける。一か所だけ白く溶け始める)
    const ma = 0.75;
    for (let y = -71; y <= 71; y++) for (let x = -71; x <= 71; x++) {
      const d = Math.hypot(x, y); if (d < 58 || d > 72) continue;
      const X = cx + x, Y = cy + y, b = bay(X, Y);
      let a = Math.atan2(y, x); const dm = Math.abs(Math.atan2(Math.sin(a - ma), Math.cos(a - ma)));
      const hot = Math.max(0, 1 - dm / 0.45);
      if (d >= 64 && d <= 69) { let c = d > 65.5 && d < 67.5 ? 12 : 4; if (b < 0.25 + hot * 0.6) c = c === 12 ? 14 : 12; if (hot > 0.55 && d > 65 && d < 68.5) c = b < hot ? 15 : 14; g.px(X, Y, c); }
      else if (d > 69) { if (b < 0.25 + hot * 0.4) g.px(X, Y, 4); }
      else if (b < (d - 58) / 6 * (0.25 + hot * 0.5)) g.px(X, Y, d > 62 ? 12 : 6);
    }
    // 溶けて垂れる一筋
    const mx = cx + Math.cos(ma) * 66, my = cy + Math.sin(ma) * 66;
    g.line(mx, my, mx - 1, my + 12, 14, 2); g.line(mx, my, mx - 1, my + 9, 15); g.px(mx - 1, my + 13, 12); g.px(mx - 1, my + 15, 4);
    K.glow(g, mx, my, 7, 15, 14);
    // 熱でゆらぐ泡
    for (let i = 0; i < 10; i++) { const x = mx + (R() - 0.3) * 24, y = my - 8 - R() * 30; g.px(x, y, 15); if (R() < 0.5) g.px(x + 1, y, 11); }
  } });

  // ========== 7. 通常の結末 normal: 港の灯と、手前の海の盛り上がり(quiet) ==========
  ART.add('harbor', { style: 'quiet', rate: 2, draw(g, K) {
    const hz = 92;
    g.vgrad(0, 0, W, hz - 10, [0, 0, 1, 1]);
    g.vgrad(0, hz - 10, W, 10, [1, 9]);
    K.stars(g, 7, 26, 0, 0, W, 40, [8, 7, 8]);
    // 遠くの陸と無線局
    g.poly([[0, hz - 5], [30, hz - 7], [70, hz - 9], [110, hz - 6], [150, hz - 3], [170, hz], [0, hz]], 0);
    g.line(64, hz - 9, 64, hz - 24, 0); g.line(61, hz - 14, 67, hz - 14, 0);
    K.glow(g, 64, hz - 12, 4, 14, 6); g.px(64, hz - 12, 14); g.px(65, hz - 12, 14);
    // 海(黒)
    g.rect(0, hz, W, H - hz, 0);
    for (let y = hz + 2; y < hz + 30; y += 2) { const w = Math.max(1, 3 - (y - hz) / 12); if (bay(64, y) < 0.8) g.rect(64 - w / 2 + (y % 3) - 1, y, w, 1, y < hz + 12 ? 14 : 6); }
    // 波の線。一か所だけ、ゆるく盛り上がる
    const bx = 112, by = 136, bump = (x, y0) => 11 * Math.exp(-(((x - bx) / 36) ** 2)) * Math.exp(-(((y0 - by) / 14) ** 2));
    const R = rnd(5);
    const lines = [95, 98, 102, 107, 113, 120, 128, 137, 147, 158];
    // 盛り上がりの面
    for (let x = bx - 70; x < bx + 70; x++) { const top = by - bump(x, by); for (let y = Math.round(top); y < by + 6; y++) if (bay(x, y) < 0.35 * (bump(x, by) / 11)) g.px(x, y, 1); }
    for (const y0 of lines) {
      const gap = 4 + (y0 - hz) * 0.3;
      for (let x = Math.floor(R() * gap); x < W;) {
        const len = 3 + R() * (6 + (y0 - hz) * 0.25), hot = bump(x, y0) > 2;
        for (let k = 0; k < len; k++) { const xx = x + k; g.px(xx, y0 - bump(xx, y0), hot && y0 === 137 ? 9 : (bay(xx, y0) < 0.6 ? 1 : 0)); }
        x += hot ? len : len + gap + R() * gap;
      }
    }
    // 盛り上がりの稜線(ここだけ明るい)
    for (let x = bx - 30; x <= bx + 30; x++) { const y = by - bump(x, by) - 1; if (bump(x, by) > 3) g.px(x, y, bay(x, y) < 0.7 ? 9 : 3); }
    // 桟橋と、寄り添う二つの影
    g.rect(196, 100, W - 196, 3, 0); g.line(196, 100, W, 100, 8);
    for (let x = 200; x < W; x += 18) { g.rect(x, 103, 2, 12, 0); g.line(x, 116, x + 1, 116, 1); }
    K.figure(g, 238, 100, 30, 0, { coat: true });
    K.figure(g, 248, 100, 27, 0);
    g.line(243, 82, 245, 82, 0); g.line(242, 83, 246, 83, 0);
    g.px(234, 72, 8); g.px(251, 75, 8);
  } });

  // ========== 8. 真の結末 true: 海面を見上げる。上がらない二つの影(quiet) ==========
  ART.add('surface', { style: 'quiet', rate: 2, draw(g, K) {
    g.vgrad(0, 0, W, 150, [11, 3, 3, 1, 1]);
    g.vgrad(0, 150, W, 10, [1, 0]);
    // 光の網(海面の揺れ)
    for (let y = 0; y < 60; y++) for (let x = 0; x < W; x++) {
      const n = Math.sin(x * 0.09 + 2 * Math.sin(y * 0.16 + x * 0.03)) + Math.sin(y * 0.24 - x * 0.04 + 1.5 * Math.sin(x * 0.05));
      const th = 0.22 * (1 - y / 70);
      if (Math.abs(n) < th) g.px(x, y, y < 22 ? 15 : (bay(x, y) < 0.6 ? 11 : 3));
    }
    g.rect(0, 0, W, 4, 15, 11, 0.3);
    // 差しこむ光の筋
    for (const [x0, ang] of [[60, 0.35], [120, 0.15], [200, -0.12], [270, -0.3]]) for (let y = 10; y < 96; y++) for (let k = -5; k <= 5; k++) { const X = Math.round(x0 + y * ang + k); if (bay(X, y) < 0.3 * (1 - y / 96) * (1 - Math.abs(k) / 6)) g.px(X, y, y < 60 ? 11 : 3); }
    // 上っていく通信ブイ
    const L = layer();
    L.ellipse(160, 50, 8, 4, 14); L.rect(152, 50, 17, 16, 14); L.ellipse(160, 66, 8, 4, D(14, 6, 0.6));
    L.rect(164, 48, 5, 20, 6); L.rect(152, 57, 17, 2, 0);
    L.line(160, 46, 160, 34, 8); L.ellipse(160, 34, 1, 1, 15);
    stamp(g, L, 0);
    g.line(154, 52, 154, 55, 15); g.px(155, 49, 15);
    // 白い泡の列
    const R = rnd(3);
    for (let i = 0; i < 18; i++) {
      const y = 74 + i * 3.4 + R() * 2, x = 160 + Math.sin(i * 0.9) * (2 + i * 0.25) + (R() - 0.5) * 3, r = Math.max(0.6, 2.6 - i * 0.12);
      if (r > 1.5) { g.ring(x, y, r - 1, r, 15); g.px(x - 1, y - 1, 15); } else g.px(x, y, i < 12 ? 15 : 11);
    }
    // 底へ、手をつないで沈んでいく二つの潜水服。輪郭を海より明るくして姿を読ませる
    const S = layer(), P = { b: 0, s: 0, r: 0, rs: 0, d: 0, w: null };
    suitFront(S, 146, 153, 29, P, { armR: [159, 137] });
    suitFront(S, 174, 155, 27, P, { armL: [160, 138] });
    stamp(g, S, (x, y) => (y < 147 ? 11 : 9));
    g.line(157, 137, 161, 138, 15, 2);
    g.px(145, 125, 15); g.px(174, 128, 15);
    for (let i = 0; i < 9; i++) g.px(149 + R() * 23, 112 + R() * 16, i % 3 ? 3 : 11);
  } });
})();
