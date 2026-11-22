// ボスの仮の形(コードで描くドット絵)。後で assets/sprites.json の boss_N に透明PNGを足せば差し替わる。
// 向きは左向き。(0,0)=ボスの中心、b.t=経過時間、h=色相。当たり判定は game.js の円(b.r)。
(function () {
  const A = window.BossArt = {};
  let C = null;
  const R = (x, y, w, h, c) => { C.fillStyle = c; C.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h)); };
  const disc = (cx, cy, r, c) => { C.fillStyle = c; for (let j = -r; j <= r; j++) { const hw = Math.floor(Math.sqrt(r * r - j * j) + .5); C.fillRect(Math.round(cx - hw), Math.round(cy + j), hw * 2 + 1, 1); } };
  const line = (x0, y0, x1, y1, t, c) => { const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0)) | 0; C.fillStyle = c; for (let i = 0; i <= n; i++) { const k = n ? i / n : 0; C.fillRect(Math.round(x0 + (x1 - x0) * k - t / 2), Math.round(y0 + (y1 - y0) * k - t / 2), t, t); } };
  const hsl = (h, s, l) => 'hsl(' + (h % 360) + ',' + s + '%,' + l + '%)';
  const eye = (x, y, r, ph) => { disc(x, y, r + 1, '#10081c'); disc(x, y, r, ph === 2 ? '#ff4040' : ph === 1 ? '#ffb030' : '#ffee80'); R(x - 1, y - r + 2, 2, r * 2 - 3, '#10081c'); };
  function pal(h, f) { return { d: hsl(h, 50, f ? 24 : 14), m: hsl(h, 45, f ? 48 : 30), l: hsl(h, 45, f ? 64 : 46), a: '#ffd84a', k: '#10081c' }; }

  const ART = {
    octa(b, p) { // 8角形の本体(1面の最初の形)
      const r = 34, c = Math.round(r * .41); C.fillStyle = p.k;
      const oct = (rr, col) => { C.fillStyle = col; for (let j = -rr; j <= rr; j++) { const aj = Math.abs(j), hw = aj <= rr - Math.round(rr * .41) ? rr : rr - (aj - (rr - Math.round(rr * .41))); C.fillRect(-hw, j, hw * 2 + 1, 1); } };
      oct(r + 2, p.k); oct(r, p.m); oct(r - 5, p.l); oct(r - 12, p.d);
      for (let i = 0; i < 8; i++) { const a = b.t * .8 + i * Math.PI / 4; R(Math.cos(a) * (r - 8) - 2, Math.sin(a) * (r - 8) - 1, 4, 3, i % 2 ? p.a : '#ff5a7a'); }
      eye(0, 0, 7, b.phase);
    },
    spider(b, p) { // 機械の蜘蛛
      for (let s = -1; s <= 1; s += 2) for (let i = 0; i < 4; i++) {
        const base = -16 + i * 10, sw = Math.sin(b.t * 2 + i * 1.2) * 5;
        line(base, s * 8, base - 8 + sw, s * 24, 4, p.d); line(base - 8 + sw, s * 24, base - 18 + sw, s * 40 + (s < 0 ? 0 : 0), 3, p.m); R(base - 20 + sw, s * 40 - 2, 4, 4, p.a);
      }
      disc(-4, 0, 22, p.k); disc(-4, 0, 20, p.m); disc(-6, -3, 14, p.l); R(-24, -6, 14, 12, p.d);
      R(2, -34, 22, 10, p.k); R(3, -33, 20, 8, p.m); R(-18, -32, 26, 4, p.k); // 背中の砲
      R(-30, -3, 12, 6, p.k); R(-29, -2, 10, 4, p.a); eye(-8, 2, 6, b.phase);
    },
    insect(b, p) { // 生体メカの女王(羽つき)
      const f = Math.sin(b.t * 6) * 4;
      for (let s = -1; s <= 1; s += 2) { line(2, s * 6, 22, s * (34 + f), 5, p.d); line(2, s * 6, 34, s * (20 + f), 4, p.m); line(10, s * 8, 30, s * (30 + f), 3, p.l); }
      disc(12, 0, 16, p.k); disc(12, 0, 14, p.m); disc(-16, 0, 11, p.k); disc(-16, 0, 9, p.l); R(-34, -3, 10, 6, p.a); eye(-18, -1, 4, b.phase);
      for (let i = 0; i < 3; i++) disc(28 + i * 8, 0, 6 - i, i % 2 ? p.l : p.m);
    },
    squid(b, p) { // 触手(イカ・クラーケン)
      for (let i = 0; i < 7; i++) { const y0 = -24 + i * 8; let px = 4, py = y0; for (let k = 1; k <= 12; k++) { const nx = 4 + k * 5, ny = y0 + Math.sin(b.t * 3 + k * .6 + i) * (3 + k * .8); line(px, py, nx, ny, 3, k % 3 ? p.m : p.l); px = nx; py = ny; } }
      disc(-10, 0, 24, p.k); disc(-10, 0, 22, p.m); disc(-14, -4, 14, p.l); R(-34, -4, 8, 8, p.a); eye(-18, 0, 7, b.phase);
    },
    serpent(b, p) { // 蛇(ふたつ折り)
      for (let i = 11; i >= 1; i--) { const x = -8 + i * 8, y = Math.sin(b.t * 2.4 + i * .6) * (10 + i * 1.5), r = 9 - i * .3 | 0; disc(x, y, r + 1, p.k); disc(x, y, r, i % 2 ? p.m : p.l); }
      disc(-14, Math.sin(b.t * 2.4 - .5) * 8, 12, p.k); disc(-14, Math.sin(b.t * 2.4 - .5) * 8, 10, p.l); R(-34, -3 + Math.sin(b.t * 2.4 - .5) * 8, 12, 6, p.d); eye(-14, Math.sin(b.t * 2.4 - .5) * 8 - 3, 4, b.phase);
    },
    fortress(b, p) { // 生体要塞(砲台つきの巨体)
      R(-44, -26, 90, 56, p.k); R(-42, -24, 86, 52, p.m); R(-42, -24, 86, 6, p.l);
      for (let i = 0; i < 4; i++) { R(-36 + i * 22, -38, 14, 14, p.k); R(-35 + i * 22, -37, 12, 12, p.l); R(-34 + i * 22, -32, 4, 10, p.a); }
      for (let i = 0; i < 3; i++) { disc(-26 + i * 24, 8, 9, p.k); disc(-26 + i * 24, 8, 7, i === 1 ? '#ffee80' : p.d); }
      R(-52, -6, 10, 12, p.k); R(-50, -4, 8, 8, p.a); eye(-26, -8, 4, b.phase);
    },
    cruiser(b, p) { // 戦艦(長い船体)
      R(-48, -9, 100, 20, p.k); R(-46, -7, 96, 16, p.m); R(-46, -7, 96, 4, p.l); R(-56, -4, 10, 10, p.k); R(-54, -2, 8, 6, p.m);
      R(-10, -22, 30, 14, p.k); R(-9, -21, 28, 12, p.l); R(-6, 11, 32, 12, p.k); R(-5, 12, 30, 10, p.m);
      for (let i = 0; i < 3; i++) { R(-70 + i * 0, -14 + i * 14, 24, 3, p.k); R(-69, -13 + i * 14, 22, 1, i === 1 ? '#ff5a5a' : p.a); }
      for (let i = 0; i < 4; i++) R(36 + (i & 1) * 2, -8 + i * 5, 12, 3, '#ff9a40');
    },
    carrier(b, p) { // 空母(格納庫がひらく)
      R(-50, -14, 100, 28, p.k); R(-48, -12, 96, 24, p.m); R(-48, -12, 96, 5, p.l);
      const open = (Math.sin(b.t * 2) + 1) * 3;
      for (let i = 0; i < 4; i++) { R(-38 + i * 22, -3, 14, 6 + open, p.k); R(-37 + i * 22, -2, 12, 4 + open, '#ffb050'); }
      R(-62, -6, 14, 12, p.k); R(-60, -4, 10, 8, p.a); R(24, -26, 22, 12, p.k); R(25, -25, 20, 10, p.l);
    },
    ring(b, p) { // 司令基地(回る輪)
      for (let i = 0; i < 8; i++) { const a = b.t * .7 + i * Math.PI / 4, x = Math.cos(a) * 36, y = Math.sin(a) * 36; disc(x, y, 7, p.k); disc(x, y, 5, i % 2 ? p.l : p.a); line(0, 0, x * .7, y * .7, 3, p.d); }
      disc(0, 0, 18, p.k); disc(0, 0, 16, p.m); disc(0, 0, 11, p.l); eye(0, 0, 6, b.phase);
    },
    shark(b, p) { // サメ型メカ
      const j = Math.sin(b.t * 3) * 2;
      R(-44, -12, 84, 24, p.k); R(-42, -10, 80, 20, p.m); R(-42, -10, 80, 5, p.l);
      for (let i = 0; i < 5; i++) { R(-56 + i * 0, -4 + (i - 2) * 2, 14 - i * 2, 3, p.k); }
      R(-52, 4 + j, 28, 6, p.k); R(-50, 5 + j, 24, 3, '#fff'); R(-8, -26, 18, 16, p.k); R(-6, -24, 14, 12, p.l); R(36, -18, 16, 8, p.k); R(36, 10, 16, 8, p.k); eye(-30, -4, 3, b.phase);
    },
    jelly(b, p) { // クラゲ
      for (let i = 0; i < 7; i++) { let px = 4, py = -18 + i * 6; for (let k = 1; k <= 11; k++) { const nx = 4 + k * 5, ny = -18 + i * 6 + Math.sin(b.t * 2.5 + k * .5 + i) * 4; line(px, py, nx, ny, 2, k % 2 ? p.l : '#7ad8ff'); px = nx; py = ny; } }
      disc(-6, 0, 26, p.k); disc(-6, 0, 24, p.m); disc(-10, -2, 16, p.l); disc(-8, 0, 8, '#bff'); eye(-12, 0, 5, b.phase);
    },
    crab(b, p) { // カニ(はさみ)
      const s = Math.sin(b.t * 2) * 5;
      for (let i = 0; i < 4; i++) { line(8 + i * 7, -12, 14 + i * 7, -30 - (i & 1) * 4, 3, p.d); line(8 + i * 7, 12, 14 + i * 7, 30 + (i & 1) * 4, 3, p.d); }
      line(-14, -14, -34, -22 - s, 5, p.m); disc(-42, -26 - s, 10, p.k); disc(-42, -26 - s, 8, '#ff7a3a'); R(-54, -26 - s, 8, 3, p.k);
      line(-14, 14, -34, 22 + s, 5, p.m); disc(-42, 26 + s, 10, p.k); disc(-42, 26 + s, 8, '#ff7a3a'); R(-54, 24 + s, 8, 3, p.k);
      disc(6, 0, 22, p.k); disc(6, 0, 20, p.m); disc(4, -4, 12, p.l); eye(-8, -2, 5, b.phase);
    },
    destroyer(b, p) { // 矢じり型の駆逐艦
      const y = [[-62, 0, 12], [-50, -2, 22], [-36, -4, 32], [-20, -6, 40], [0, -8, 44], [20, -8, 46]];
      for (const [x, o, w] of y) { R(x, -w / 2, 18, w, p.k); R(x + 1, -w / 2 + 2, 16, w - 4, o % 4 ? p.m : p.l); }
      R(40, -20, 14, 6, '#ff9a40'); R(40, 14, 14, 6, '#ff9a40'); R(-30, -3, 40, 6, p.a);
    },
  };
  A.arches = Object.keys(ART);
  A.draw = function (ctx, b, arch, hue, flash) {
    C = ctx; ctx.save(); ctx.translate(Math.round(b.x), Math.round(b.y));
    (ART[arch] || ART.octa)(b, pal(hue, flash)); ctx.restore();
  };
})();
