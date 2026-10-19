/* 沈書庫の挿絵(作品ごと)。道具箱は art.js。場面の決め方は 資料\挿絵案.md。
 * ART.add('名前', { style: 'shock' | 'quiet', rate, draw(g, K) { ... } })
 * 全8枚: shock = card / porter / eightstitch / hands、quiet = reprint / index / reader / returned
 */
(function () {
  'use strict';
  const W = ART.W, H = ART.H;
  const bay = ART.K.bay, rnd = ART.K.rnd;

  // ---------- この作品だけの部品 ----------
  // 名前の「■■」(黒い四角を二つ)。s は四角の一辺
  function name2(g, x, y, s, c) { g.rect(x, y, s, s, c == null ? 0 : c); g.rect(x + s + 1, y, s, s, c == null ? 0 : c); }
  // 文章の代わりの細い線(単語の長さをばらつかせる)
  function textLines(g, seed, x, y, w, rows, step, c, th) {
    const R = rnd(seed);
    for (let r = 0; r < rows; r++) {
      let xx = x + (r === 0 || R() < 0.15 ? 4 : 0);
      const end = r === rows - 1 ? x + w * (0.3 + R() * 0.4) : x + w - R() * 8;
      while (xx < end) { const ww = 3 + Math.floor(R() * 9); g.rect(xx, y + r * step, Math.min(ww, end - xx), th || 1, c); xx += ww + 2; }
    }
  }
  // 光だまり: 楕円の中だけ、中心ほど濃く色を置き換える(map は {元の色: 新しい色})
  function pool(g, cx, cy, rx, ry, map, power) {
    for (let y = Math.floor(cy - ry); y <= cy + ry; y++) for (let x = Math.floor(cx - rx); x <= cx + rx; x++) {
      if (x < 0 || y < 0 || x >= W || y >= H) continue;
      const d = Math.sqrt(((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2); if (d >= 1) continue;
      const c = g.b[y * W + x]; if (map[c] != null && bay(x, y) < (1 - d) * (power || 1)) g.b[y * W + x] = map[c];
    }
  }
  // 歯車の影
  function gear(g, cx, cy, r, teeth, c, rot) {
    for (let i = 0; i < teeth; i++) {
      const a = (i / teeth) * Math.PI * 2 + (rot || 0), a1 = a - 0.12, a2 = a + 0.12;
      g.poly([[cx + Math.cos(a1) * (r - 2), cy + Math.sin(a1) * (r - 2)], [cx + Math.cos(a1) * (r + 5), cy + Math.sin(a1) * (r + 5)],
        [cx + Math.cos(a2) * (r + 5), cy + Math.sin(a2) * (r + 5)], [cx + Math.cos(a2) * (r - 2), cy + Math.sin(a2) * (r - 2)]], c);
    }
    g.circ(cx, cy, r, c); g.ring(cx, cy, r * 0.55, r * 0.7, 0); g.circ(cx, cy, r * 0.22, 0);
    g.ring(cx, cy, r - 1, r, 0, Math.PI * 1.0, Math.PI * 1.5);
  }
  // 折れ線(点の並びを順につなぐ)
  function path(g, pts, c, th) { for (let i = 0; i + 1 < pts.length; i++) g.line(pts[i][0], pts[i][1], pts[i + 1][0], pts[i + 1][1], c, th); }

  // ================= shock =================

  // 1層 f1_counter: 貸出票。縫いつぶされた名前と、一列に並んだ七つの赤い印。右上の暗がりに目が二つ
  ART.add('card', { style: 'shock', rate: 5, draw(g, K) {
    g.rect(0, 0, W, 108, 0, 1, 0.16);
    g.recolor(0, 0, W, 108, { 1: 0 }, 0.5);
    g.vgrad(0, 106, W, 54, [6, 6, 0]); for (let y = 110; y < H; y += 6) g.line(0, y, W, y, 0);
    g.line(0, 106, W, 106, 14); g.line(0, 107, W, 107, 6);
    // 票(少し傾いた紙)
    g.poly([[42, 130], [252, 126], [254, 130], [42, 134]], 0);
    g.poly([[46, 18], [244, 14], [250, 126], [40, 130]], 15, 7, 0.28);
    g.outline([[46, 18], [244, 14], [250, 126], [40, 130]], 8);
    g.line(40, 130, 250, 126, 0);
    // 見出しの帯と罫線(文字は書かない)
    g.rect(58, 23, 64, 5, 0); g.rect(128, 23, 28, 5, 8);
    for (let i = 0; i < 4; i++) g.line(54, 96 + i * 7, 240, 94 + i * 7, 8);
    for (let x = 80; x < 240; x += 27) g.line(x - 1, 64, x - 2, 118, 7);
    textLines(g, 4, 58, 98, 60, 3, 7, 8);
    // 氏名欄: ■■ を灰色の糸で縫いつぶす
    g.rect(56, 34, 176, 14, 15); g.outline([[56, 34], [231, 34], [231, 47], [56, 47]], 8);
    name2(g, 62, 36, 10);
    for (let x = 58; x < 228; x += 6) { g.line(x, 35, x + 5, 46, 7); g.line(x + 5, 35, x, 46, x < 84 ? 7 : 8); }
    g.line(58, 41, 228, 41, 7);
    // 糸の端と針(票の右へ垂れる)
    path(g, [[230, 41], [240, 46], [247, 56], [251, 70], [252, 84]], 7);
    g.line(252, 84, 254, 100, 15); g.line(253, 84, 255, 100, 7); g.px(254, 101, 15);
    // 七つの赤い印(古いほど薄く、七つ目がいちばん新しい)
    for (let i = 0; i < 7; i++) {
      const cx = 66 + i * 27, cy = 78 + (i % 2 ? 1 : -1), fade = 0.55 - i * 0.08;
      g.circ(cx, cy, 11, 4, 15, Math.max(0, fade * 0.6));
      g.circ(cx, cy, 8, 15, 4, 0.1 + i * 0.03);
      g.rect(cx - 7, cy - 1, 15, 3, 4); g.rect(cx - 4, cy - 5, 9, 2, 4); g.rect(cx - 4, cy + 4, 9, 2, 4);
      if (i === 6) { g.ring(cx, cy, 10, 11, 12); g.rect(cx - 7, cy - 1, 15, 1, 12); g.px(cx - 6, cy - 7, 15); }
    }
    // 右上の暗がり。白い目が二つ
    g.ellipse(290, 30, 24, 14, 0);
    K.eye(g, 279, 30, 5, 0); K.eye(g, 301, 31, 5, 0);
    K.grain(g, 9, 200, 8);
  } });

  // 1〜3層 c_porter_body: 壁にもたれた人。腰から下が本の背表紙の束になりかけ、足先を糸で縫われている
  ART.add('porter', { style: 'shock', rate: 5, draw(g, K) {
    const R = rnd(21);
    // 石の壁と床
    g.rect(0, 0, W, 112, 8, 0, 0.45);
    for (let y = 0, r = 0; y < 112; y += 14, r++) { g.line(0, y, W, y, 0); for (let x = (r % 2) * 18; x < W; x += 36) g.line(x, y, x, y + 13, 0); }
    g.recolor(0, 0, W, 40, { 8: 0 }, 0.55);
    g.vgrad(0, 112, W, 48, [8, 0, 0]); g.line(0, 112, W, 112, 0); g.line(0, 113, W, 113, 7);
    for (let y = 120; y < H; y += 9) g.line(0, y, W, y, 0);
    // 背負子(右下に大きく、壁に立てかけてある)
    g.rect(226, 150, 82, 4, 0);
    for (const px of [236, 292]) { g.line(px - 6, 152, px + 4, 48, 0, 6); g.line(px - 6, 152, px + 4, 48, 6, 4); g.line(px - 5, 152, px + 5, 48, 8, 1); }
    for (const by of [64, 96, 132]) { const k = (152 - by) / 104 * 10; g.rect(232 - k + 8, by, 60, 4, 6); g.line(232 - k + 8, by + 4, 292 - k + 8, by + 4, 0); }
    // 縛った本の荷
    for (let i = 0; i < 6; i++) { const y = 70 + i * 9, x = 242 - i * 0.8; g.rect(x, y, 50, 8, [8, 6, 8, 6, 0, 6][i]); g.line(x, y, x + 49, y, 7); g.line(x, y + 7, x + 49, y + 7, 0); }
    g.line(252, 66, 248, 126, 7, 2); g.line(280, 66, 276, 126, 7, 2);
    g.line(240, 52, 241, 50, 15); g.px(297, 48, 15);
    // 床のカンテラの光(足もとを照らす)
    pool(g, 186, 130, 100, 32, { 8: 6, 7: 14 }, 1.0);
    pool(g, 200, 140, 64, 18, { 0: 8 }, 0.7);
    g.recolor(20, 44, 34, 84, { 8: 0 }, 0.6);                        // 壁に落ちた影
    // 脚のかわりの、背表紙の束(壁ぎわから右へ伸びる)
    let x = 84;
    const tops = [];
    while (x < 198) {
      const bw = 4 + Math.floor(R() * 4), knee = Math.max(0, 1 - Math.abs(x - 136) / 50);
      const bh = 16 + Math.floor(R() * 5) + Math.round(knee * 9) - (x > 180 ? 5 : 0);
      const pal = [[6, null], [6, 14], [8, 6], [6, 0], [4, 6]][Math.floor(R() * 5)];
      g.rect(x, 136 - bh, bw, bh, pal[0], pal[1], 0.25);
      g.line(x, 136 - bh, x, 135, 0); g.line(x, 136 - bh, x + bw - 1, 136 - bh, 0);
      if (R() < 0.6) { g.line(x + 1, 136 - bh + 3, x + bw - 1, 136 - bh + 3, 0); g.line(x + 1, 133, x + bw - 1, 133, 0); }
      tops.push([x, 136 - bh, bw]);
      x += bw;
    }
    g.line(84, 136, 198, 136, 0);
    // 一冊だけ、明るい黄の箔
    const f = tops[9]; g.line(f[0] + 2, f[1] + 5, f[0] + 2, 131, 14); g.px(f[0] + 2, f[1] + 6, 15);
    // 足先を縫う灰色の糸(三針)と、床に落ちた針
    for (let k = 0; k < 3; k++) { const sx = 176 + k * 7; g.line(sx, 118, sx + 5, 133, 7); g.line(sx + 5, 118, sx, 133, 7); }
    path(g, [[195, 128], [200, 140], [196, 150], [184, 152]], 7);
    g.line(184, 152, 172, 154, 15); g.px(172, 154, 7);
    // カンテラ
    const lx = 210, ly = 132;
    g.ring(lx + 4, ly - 7, 2, 3, 8); g.rect(lx, ly - 4, 9, 2, 8);
    g.rect(lx + 1, ly - 2, 7, 10, 14); g.rect(lx + 3, ly + 1, 3, 5, 15);
    g.line(lx, ly - 2, lx, ly + 7, 0); g.line(lx + 8, ly - 2, lx + 8, ly + 7, 0); g.line(lx + 4, ly - 2, lx + 4, ly, 6);
    g.rect(lx - 1, ly + 8, 11, 2, 8); g.line(lx - 1, ly + 10, lx + 9, ly + 10, 0);
    // 人の影(壁にもたれ、うなだれている)。カンテラのある右側だけ、縁が光る
    g.poly([[56, 78], [64, 70], [90, 70], [97, 78], [99, 110], [94, 126], [60, 128], [52, 108]], 0);
    g.poly([[62, 116], [100, 108], [108, 120], [98, 130], [64, 130]], 0);       // 外套の裾が、背表紙にかかる
    g.line(90, 70, 97, 78, 8); g.line(70, 84, 66, 120, 8);
    g.poly([[80, 70], [92, 66], [94, 74], [84, 76]], 0);                        // 前へ折れた首
    g.ellipse(90, 62, 9, 9, 0);                                                 // うなだれた頭(顔は影の中)
    g.ring(90, 62, 8, 9, 7, Math.PI * 1.4, Math.PI * 1.99); g.ring(90, 62, 8, 9, 8, 0, Math.PI * 0.35); g.px(94, 54, 15);
    g.line(97, 78, 104, 102, 0, 6); g.line(104, 102, 110, 124, 0, 5);           // 垂れた腕
    g.line(100, 78, 107, 101, 7); g.line(107, 102, 112, 122, 7);
    g.ellipse(112, 127, 4, 2, 7); g.line(109, 129, 116, 129, 8);                // 床に置かれた手
    K.grain(g, 13, 160, 0);
  } });

  // 2層 yatsume(八目綴): 上から下りてくる八本の針。まん中の一本に、あなたの髪
  ART.add('eightstitch', { style: 'shock', rate: 5, draw(g, K) {
    const R = rnd(31);
    g.vgrad(0, 0, W, 108, [0, 1, 0]); g.recolor(0, 0, W, 108, { 1: 0 }, 0.45);
    for (let i = 0; i < 40; i++) { const x = Math.floor(R() * W); g.line(x, 16, x + Math.floor(R() * 5 - 2), 16 + R() * 80, 8); }
    // 左右の端の歯車
    gear(g, 6, 70, 30, 12, 6, 0.1); gear(g, 40, 112, 16, 9, 6, 0.3);
    gear(g, 316, 58, 28, 11, 6, 0.2); gear(g, 284, 104, 14, 8, 6, 0);
    // 作業台(黒)と、綴じかけの紙
    g.rect(0, 108, W, 52, 0); g.line(0, 108, W, 108, 8); g.line(0, 109, W, 109, 7);
    g.poly([[96, 100], [224, 100], [232, 110], [88, 110]], 7, 15, 0.4); g.line(160, 100, 160, 110, 8); g.line(88, 110, 232, 110, 8);
    for (let i = 0; i < 4; i++) g.line(100 + i * 2, 102 + i * 2, 154, 102 + i * 2, 8);
    for (let x = 0; x < W; x += 12) g.line(x, 116, x + 6, 116, 8);
    // 上の機械の梁
    g.rect(0, 0, W, 15, 8); g.line(0, 1, W, 1, 7); g.rect(0, 14, W, 3, 0);
    for (let x = 6; x < W; x += 16) { g.px(x, 7, 7); g.px(x - 1, 6, 15); }
    // 八本の針
    const tip = 94;
    for (let i = 0; i < 8; i++) {
      const x = Math.round(27 + i * 38);
      g.rect(x - 6, 12, 13, 12, 8); g.outline([[x - 6, 12], [x + 6, 12], [x + 6, 23], [x - 6, 23]], 0); g.line(x - 5, 13, x + 5, 13, 7);
      g.rect(x - 2, 24, 5, 4, 7); g.line(x - 2, 27, x + 2, 27, 0);
      g.rect(x - 1, 28, 3, tip - 40, 15); g.line(x + 1, 28, x + 1, tip - 12, 7); g.line(x - 2, 28, x - 2, tip - 12, 0); g.line(x + 2, 28, x + 2, tip - 12, 0);
      g.line(x, 31, x, 36, 0);                                      // 針の穴
      g.line(x - 1, tip - 12, x, tip, 15); g.line(x + 1, tip - 12, x, tip, 7);
      g.ellipse(x, tip + 2, 2, 3, 14); g.px(x - 1, tip + 1, 15); g.px(x, tip + 6, 14); g.px(x, tip + 7, 6);   // 乾かない糊
    }
    // まん中の針(四本目)に、髪が一筋
    const hx = 27 + 3 * 38;
    path(g, [[hx - 22, 30], [hx - 10, 40], [hx - 2, 44]], 6);
    path(g, [[hx + 2, 45], [hx + 6, 52], [hx + 8, 64], [hx + 6, 76], [hx + 11, 88]], 6);
    g.px(hx - 1, 44, 0); g.px(hx, 44, 0); g.px(hx + 1, 45, 0);
    K.grain(g, 7, 120, 8);
  } });

  // 4層 f4_voice_2: 水の中から伸びる白い手。手前の一本が大きくこちらへ。右下に、片方だけの靴
  ART.add('hands', { style: 'shock', rate: 5, draw(g, K) {
    g.vgrad(0, 0, W, 78, [0, 0, 1]);
    K.shelves(g, 0, 4, W, 70, 7, [1, 1, 8, 0, 8, 5]);
    K.glow(g, 250, 24, 14, 15, 9, 1);
    K.stars(g, 2, 70, 200, 4, 110, 40, [8, 7, 8]);
    K.water(g, 78, H, [3, 1, 1, 0], 11, 5);
    g.rect(0, 77, W, 2, 11); g.dith(0, 79, W, 3, 3, 1, 0.5);
    K.hand(g, 52, 56, 0.55, 0.6, false); K.ripple(g, 52, 80, 6, 11);
    K.hand(g, 268, 52, 0.62, -0.5, false); K.ripple(g, 268, 80, 7, 11);
    K.hand(g, 118, 62, 0.5, 0.3, false); K.ripple(g, 118, 80, 5, 11);
    K.hand(g, 192, 52, 1.05, 0.9, true); K.ripple(g, 192, 98, 13, 11); K.ripple(g, 192, 98, 21, 3);
    g.dith(174, 100, 36, 26, 1, 11, 0.12);
    // 右下の水面に浮かぶ、片方だけの靴
    const sx = 262, sy = 132;
    g.rect(sx - 2, sy + 4, 24, 3, 1, 0, 0.5);
    g.poly([[sx, sy + 4], [sx + 2, sy - 3], [sx + 9, sy - 3], [sx + 12, sy], [sx + 20, sy + 1], [sx + 21, sy + 4]], 4);
    g.line(sx + 2, sy - 3, sx + 9, sy - 3, 0); g.rect(sx + 3, sy - 2, 5, 2, 0);
    g.line(sx, sy + 4, sx + 21, sy + 4, 0); g.line(sx + 12, sy + 1, sx + 19, sy + 2, 12); g.px(sx + 15, sy + 1, 15);
    K.ripple(g, sx + 10, sy + 6, 10, 11);
    K.grain(g, 5, 160, 8);
  } });

  // ================= quiet =================

  // 3層 f3_reprint: 扇形に重なる七枚の目録カード。奥ほど焼け、手前ほど白い。手前の「■■」だけ濡れて光る
  ART.add('reprint', { style: 'quiet', rate: 2, draw(g, K) {
    // 上からの薄い黄の灯り
    K.beam(g, 160, -6, Math.PI / 2, 0.44, 190, 8, 0.07);
    K.beam(g, 160, -6, Math.PI / 2, 0.26, 170, 14, 0.06);
    K.glow(g, 160, -2, 10, 15, 14, null);
    const P = [160, 236], RR = 150, cw = 54, ch = 34;
    const pt = (a, u, v) => { const dy = v - RR; return [P[0] + u * Math.cos(a) - dy * Math.sin(a), P[1] + u * Math.sin(a) + dy * Math.cos(a)]; };
    const quad = (a, u0, v0, u1, v1) => [pt(a, u0, v0), pt(a, u1, v0), pt(a, u1, v1), pt(a, u0, v1)];
    const looks = [[6, 0, 0.35], [6, 8, 0.2], [6, 7, 0.45], [7, 6, 0.25], [7, 15, 0.3], [15, 7, 0.3], [15, null, 0]];
    for (let i = 0; i < 7; i++) {
      const a = -0.3 + i * 0.1, L = looks[i];
      g.poly(quad(a, -cw + 2, -ch + 3, cw + 2, ch + 3), 0);               // 影
      const q = quad(a, -cw, -ch, cw, ch);
      g.poly(q, L[0], L[1], L[2]); g.outline(q, i < 3 ? 0 : 8);
      const ln = (v, c) => { const p0 = pt(a, -cw + 6, v), p1 = pt(a, cw - 6, v); g.line(p0[0], p0[1], p1[0], p1[1], c); };
      ln(-ch + 14, i < 2 ? 0 : 6); ln(-ch + 15, i < 2 ? 0 : 6);           // 見出しの二重線(赤茶)
      for (let r = 0; r < 4; r++) ln(-ch + 24 + r * 8, i < 3 ? 0 : 8);
      const h0 = pt(a, 0, ch - 6); g.circ(h0[0], h0[1], 2, 0);              // 下の綴じ穴
      // 同じ位置に「■■」
      g.poly(quad(a, -cw + 5, -ch + 3, -cw + 11, -ch + 10), 0);
      g.poly(quad(a, -cw + 13, -ch + 3, -cw + 19, -ch + 10), 0);
      if (i === 6) {                                                        // 濡れて光る
        const w1 = pt(a, -cw + 7, -ch + 5); g.px(w1[0], w1[1], 15); g.px(w1[0] + 1, w1[1], 7);
        const w2 = pt(a, -cw + 16, -ch + 10); g.px(w2[0], w2[1] + 1, 0); g.px(w2[0], w2[1] + 2, 0); g.px(w2[0], w2[1] + 3, 8);
      }
    }
    // 焼けた初版の縁の焦げ
    const e = quad(-0.3, -cw, -ch, cw, ch);
    for (let k = 0; k < 30; k++) { const t = k / 30, x = e[0][0] + (e[3][0] - e[0][0]) * t, y = e[0][1] + (e[3][1] - e[0][1]) * t; g.px(x + 1, y, 0); if (k % 3 === 0) g.px(x + 2, y, 0); }
    K.grain(g, 17, 60, 8);
  } });

  // 5層 f5_index_core: 画面いっぱいの黒い端末。緑の細い線がびっしり。点滅する白いカーソル。端の行に「■■」
  ART.add('index', { style: 'quiet', rate: 1, draw(g, K) {
    const R = rnd(11);
    const x0 = 14, x1 = 306, step = 7, last = 15;
    for (let r = 0; r < last; r++) {
      const y = 8 + r * step;
      let x = x0;
      if (R() < 0.35) { g.rect(x, y, 3, 2, 10); x += 6; }
      const end = R() < 0.2 ? x0 + 60 + R() * 160 : x1 - R() * 10;
      while (x < end) { const w = 3 + Math.floor(R() * 12); g.rect(x, y, Math.min(w, end - x), 2, R() < 0.06 ? 10 : 2); x += w + 3; }
      if (r % 4 === 1) { g.rect(x1 - 12, y - 1, 4, 4, 10); g.rect(x1 - 7, y - 1, 4, 4, 10); }          // 右端の ■■
      if (r % 5 === 3) { g.rect(x0, y - 1, 4, 4, 10); g.rect(x0 + 5, y - 1, 4, 4, 10); }               // 左端の ■■
    }
    // 打ちかけの行と、白いカーソル
    const cy = 8 + last * step;
    g.rect(x0, cy, 3, 2, 10);
    let x = x0 + 6; for (const w of [8, 5, 11, 4, 9]) { g.rect(x, cy, w, 2, 2); x += w + 3; }
    g.rect(x0 + 6 + 52, cy - 1, 4, 4, 10); g.rect(x0 + 6 + 57, cy - 1, 4, 4, 10);
    g.rect(x0 + 6 + 64, cy - 4, 5, 8, 15);
    // 画面の縁(暗い灰の丸み)と走査線
    for (let y = 0; y < H; y += 2) g.recolor(0, y, W, 1, { 2: 0 }, 0.25);
    for (const [cx, cy2] of [[0, 0], [W, 0], [0, H], [W, H]]) pool(g, cx, cy2, 40, 26, { 0: 8, 2: 8 }, 1.4);
    g.outline([[1, 1], [W - 2, 1], [W - 2, H - 2], [1, H - 2]], 8);
    K.grain(g, 3, 60, 2);
  } });

  // 5層 f5_reading_room: 一つだけ点いた読書灯。机に突っ伏して眠る人の後ろ姿。手首に赤いリボン
  ART.add('reader', { style: 'quiet', rate: 2, draw(g, K) {
    // 小さな部屋(暗い青の壁、茶の床)
    g.rect(0, 0, W, 112, 0, 1, 0.3);
    for (let x = 18; x < W; x += 40) g.line(x, 0, x, 111, 0);
    g.vgrad(0, 112, W, 48, [6, 0, 0]);
    for (let x = 0; x < W; x++) g.recolor(x, 0, 1, H, { 1: 0, 6: 0 }, Math.pow(Math.abs(x - 170) / 170, 1.6));
    // 机
    g.poly([[70, 62], [250, 62], [274, 100], [46, 100]], 6, 0, 0.35);
    g.line(70, 62, 250, 62, 8); g.rect(46, 100, 228, 6, 0); g.line(46, 100, 273, 100, 6);
    g.rect(52, 106, 6, 54, 0); g.rect(262, 106, 6, 54, 0);
    // 読書灯(右奥)と、黄の光の輪
    g.rect(222, 58, 16, 3, 0); g.line(230, 58, 230, 40, 0, 2); g.line(230, 40, 218, 32, 0, 2);
    pool(g, 200, 80, 90, 34, { 0: 6, 6: 14, 1: 8 }, 1.3);
    pool(g, 205, 42, 70, 40, { 0: 1, 1: 9 }, 0.7);
    g.line(231, 58, 231, 42, 8); g.line(231, 42, 220, 34, 8);
    g.poly([[206, 28], [226, 28], [232, 40], [200, 40]], 6); g.line(200, 40, 232, 40, 14); g.line(206, 28, 226, 28, 0);
    g.rect(208, 41, 16, 2, 15); g.px(214, 41, 14);
    // 開いた本(腕の下)
    g.poly([[100, 70], [160, 68], [162, 90], [94, 92]], 15, 7, 0.3); g.line(160, 68, 162, 90, 8);
    g.poly([[160, 68], [214, 70], [222, 90], [162, 90]], 15, 7, 0.15);
    for (let i = 0; i < 4; i++) { g.line(104, 74 + i * 4, 154, 73 + i * 4, 8); g.line(168, 73 + i * 4, 212, 74 + i * 4, 8); }
    name2(g, 128, 76, 3, 0);
    // 眠る人の後ろ姿(腕を組んで、頭をうずめる)
    // 組んだ腕(机の上で輪になり、そこに頭をうずめる)
    g.poly([[104, 96], [118, 82], [160, 78], [202, 82], [216, 96], [200, 100], [120, 100]], 0);
    g.poly([[108, 95], [120, 84], [160, 80], [200, 84], [212, 95], [198, 98], [122, 98]], 1);
    g.line(120, 84, 158, 80, 9); g.line(162, 80, 200, 84, 9); g.line(200, 84, 212, 95, 9);
    // 背中と肩(暗い青の上着。灯りの側に、明るい青の縁)
    g.poly([[110, 104], [130, 94], [190, 94], [210, 104], [216, 160], [104, 160]], 0);
    g.poly([[113, 105], [131, 96], [189, 96], [207, 105], [213, 160], [107, 160]], 1, 0, 0.3);
    pool(g, 220, 96, 46, 40, { 1: 9 }, 0.8);
    g.line(189, 96, 207, 105, 9); g.line(207, 105, 212, 150, 9);
    g.line(160, 100, 160, 160, 0);                                         // 背中の縫い目
    // 頭(髪だけ。顔は腕の中)
    g.ellipse(160, 88, 19, 13, 0);
    for (const [a, b, c] of [[146, 82, 6], [152, 78, 8], [160, 77, 6], [167, 78, 6], [173, 82, 8]]) g.line(a, b, a + (a - 160) * 0.15, b + 13, c);
    g.ring(160, 88, 17, 19, 6, Math.PI * 1.55, Math.PI * 1.9); g.px(170, 77, 14);
    g.poly([[148, 96], [172, 96], [176, 112], [144, 112]], 0);              // 肩へ流れる髪
    g.line(150, 98, 148, 110, 6); g.line(170, 98, 173, 110, 6);
    // 手首の赤いリボン(この絵でいちばん鮮やか)
    g.ellipse(102, 95, 4, 3, 8); g.line(99, 93, 104, 93, 7); g.px(100, 93, 15);   // 手(影の中)
    g.rect(107, 90, 5, 9, 12); g.line(111, 90, 111, 98, 4); g.px(108, 91, 15);
    g.poly([[108, 99], [102, 106], [106, 107]], 12); g.poly([[110, 99], [116, 108], [112, 109]], 12);
    path(g, [[104, 107], [100, 114], [103, 120]], 4); path(g, [[114, 109], [117, 116]], 4);
    // 椅子の背(手前)
    g.rect(116, 130, 88, 5, 6); g.line(116, 130, 203, 130, 8); g.px(196, 130, 14); g.line(116, 134, 203, 134, 0);
    g.rect(120, 130, 5, 30, 6); g.rect(195, 130, 5, 30, 6); g.line(120, 130, 120, 160, 0); g.line(200, 130, 200, 160, 0);
    K.grain(g, 23, 70, 0);
  } });

  // 結末 true: 左に返却口へ落ちる一冊、右に上へ続く階段と小さな後ろ姿。上には地上の淡い光
  ART.add('returned', { style: 'quiet', rate: 1, dir: 'up', draw(g, K) {
    // 左: 返却口のある壁
    g.rect(0, 0, 150, 140, 8, 0, 0.5);
    for (let y = 12; y < 140; y += 22) g.line(0, y, 149, y, 0);
    g.rect(150, 0, 8, 140, 0);
    g.rect(28, 76, 76, 12, 7); g.rect(32, 79, 68, 6, 0); g.line(28, 76, 103, 76, 15); g.line(28, 87, 103, 87, 8);
    g.rect(110, 60, 14, 14, 15); g.line(110, 74, 123, 74, 7); g.px(116, 59, 8);    // 手書きの札(白い四角)
    // 落ちていく途中の一冊(半分、口に入っている)
    g.poly([[54, 60], [72, 54], [80, 79], [62, 79]], 6); g.line(54, 60, 72, 54, 14); g.line(72, 54, 80, 79, 0);
    g.line(56, 62, 64, 79, 0); g.line(60, 59, 68, 79, 14);
    for (const [x, y] of [[50, 44], [58, 40], [66, 38]]) g.line(x, y, x + 2, y + 6, 7);
    // 右: 上へ続く階段と、地上の光
    g.rect(158, 0, 162, 140, 0, 1, 0.25);
    K.glow(g, 238, 8, 34, 15, 11, 3);
    g.rect(204, 0, 70, 18, 15, 11, 0.4);
    K.beam(g, 238, 4, Math.PI / 2, 0.38, 120, 3, 0.18);
    for (let i = 0; i < 14; i++) {
      const y = 134 - i * 8, w = 120 - i * 7, x = 238 - w / 2, lit = i > 9;
      g.rect(x, y - 8, w, 8, lit ? 7 : 8, lit ? 15 : 0, lit ? 0.3 : 0.35);
      g.line(x, y - 8, x + w - 1, y - 8, i > 6 ? 15 : 7); g.line(x, y - 1, x + w - 1, y - 1, 0);
    }
    g.line(178, 134, 228, 24, 0); g.line(298, 134, 248, 24, 0);
    g.rect(200, 0, 4, 20, 8); g.rect(274, 0, 4, 20, 8); g.line(200, 20, 277, 20, 0);   // 地上へ出る口の枠
    // 階段を上る、小さな後ろ姿
    K.figure(g, 236, 86, 24, 0, { coat: true });
    g.px(235, 63, 11); g.px(237, 62, 15); g.px(233, 66, 11); g.px(239, 66, 11);
    // 下の端: 棚の背表紙の列。一冊にだけ、白い短い線
    const R = rnd(41);
    g.rect(0, 140, W, 20, 0); g.line(0, 140, W, 140, 8);
    let x = 2, k = 0;
    while (x < W - 3) {
      const bw = 4 + Math.floor(R() * 4), c = [1, 8, 6, 1, 8, 0][Math.floor(R() * 6)];
      g.rect(x, 143, bw, 17, c); g.line(x, 143, x, 159, 0); if (R() < 0.4) g.line(x + 1, 146, x + bw - 1, 146, 0);
      if (k === 21) { g.line(x + Math.floor(bw / 2), 148, x + Math.floor(bw / 2), 153, 15); }
      x += bw; k++;
    }
    K.grain(g, 29, 50, 8);
  } });
})();
