// 自機(2026-09-27 その10): 選べる3機+隠し機体。どれも、戦闘形態(fold=1)と巡航形態(fold=0)で頂点の並びが同じ(変形は頂点の補間)。
//  VALKYRIE: 針の機首・後退翼・双尾翼(標準)/ RAPTOR: 前進翼の軽量迎撃機(速い・よく曲がる・連射、装甲は薄い)
//  BASTION: 双胴の重砲撃機(3門の砲・装甲・誘導弾が多い、遅い)/ PHANTOM(隠し): 金色の全翼機(すべてが桁違い。4門の砲)
// 性能は SHIPS の倍率(sketch.js の shipK が使う)。#oldship を付けると、元のデザイン(sketch.js の buildPlayerShip)に戻る。
var SHIPS = {
  valkyrie: { id: 'valkyrie', name: 'VALKYRIE', role: 'バランス型', roleEn: 'Balanced', speed: 1, turn: 1, armor: 1, power: 1, rate: 1, tank: 1, energy: 1, lock: 0, bits: 0, guns: [-22, 22], acc: [255, 190, 100], noz: [[-13, -1, -82], [13, -1, -82]] },
  raptor: { id: 'raptor', name: 'RAPTOR', role: '高速の迎撃機', roleEn: 'High-speed interceptor', speed: 1.22, turn: 1.25, armor: 0.8, power: 0.85, rate: 1.3, tank: 1.3, energy: 1.1, lock: -1, bits: 0, guns: [-14, 14], acc: [120, 255, 200], noz: [[0, -1, -68], [-9, -2, -61], [9, -2, -61]] },
  bastion: { id: 'bastion', name: 'BASTION', role: '重装甲の砲撃機', roleEn: 'Heavy-armor gunship', speed: 0.86, turn: 0.84, armor: 1.5, power: 1.3, rate: 0.85, tank: 0.9, energy: 1.25, lock: 2, bits: 1, guns: [-30, 0, 30], acc: [255, 120, 80], noz: [[-10, -1, -66], [10, -1, -66], [-28, 0, -70], [28, 0, -70]] },
  phantom: { id: 'phantom', name: 'PHANTOM', role: '究極の試作機(隠し機体)', roleEn: 'Ultimate prototype (hidden)', hidden: true, speed: 1.4, turn: 1.4, armor: 2.2, power: 2.2, rate: 1.6, tank: 2, energy: 2, lock: 4, bits: 2, guns: [-26, -9, 9, 26], acc: [210, 160, 255], hullRgb: [255, 214, 120], noz: [[0, 0, -54], [-12, -1, -48], [12, -1, -48]], boostCol: [[255, 255, 255], [255, 160, 240], [160, 80, 255]] },
};
const SHIP_ORDER = ['valkyrie', 'raptor', 'bastion', 'phantom'];
(function () {
  if (/oldship/.test(location.hash)) return;
  const accCol = rgb => ({ rgb, fill: `rgb(${rgb[0]},${rgb[1]},${rgb[2]})`, stroke: `rgb(${Math.min(255, rgb[0] + 40)},${Math.min(255, rgb[1] + 40)},${Math.min(255, rgb[2] + 40)})` });
  const ACC_HIT = { rgb: [255, 60, 60], fill: 'rgb(255,60,60)', stroke: 'rgb(255,160,160)' };
  const fin = (m, x, y, z, len, h, th, rz, sweep) => {   // 傾いた薄い板(上端が後ろに流れる)
    const a = th / 2, b = h / 2, c = len / 2, cs = Math.cos(rz), sn = Math.sin(rz);
    const vs = [[-a, -b, -c], [a, -b, -c], [a, b, -c], [-a, b, -c], [-a, -b, c], [a, -b, c], [a, b, c], [-a, b, c]].map(([px, py, pz]) => {
      if (py > 0) pz = pz * 0.55 - sweep;
      return [px * cs - py * sn, px * sn + py * cs, pz];
    });
    return m.put(vs, BOXF, x, y, z, 0, 0);
  };
  const done = (m, nb) => ({ v: m.v.map(p => p.map(c => c * 0.8)), f: m.f.slice(0, nb), fAcc: m.f.slice(nb) });
  const BUILD = {
    valkyrie(fold) {   // 針の機首、後退した三角翼、外に傾いた双尾翼、大きな双発エンジン
      const m = new MB(), wx = 22 + 50 * fold, dn = 26 * (1 - fold), cn = 0.35 + 0.65 * fold;
      m.frustum(0, -1, -30, 26, 14, 19, 11, 44).frustum(0, 0, 20, 19, 11, 8, 6.5, 56).frustum(0, -0.5, 72 + dn / 2, 8, 6, 1.4, 2, 56 + dn).frustum(0, -8, -8, 16, 6, 9, 4, 58);
      m.frustum(0, 9, 6, 12, 5, 7, 2.6, 34).box(0, 7.6, -24, 6, 4.4, 30);
      for (const s of [-1, 1]) {
        m.poly([[s * 7, 62], [s * 17, 10], [s * 25, -24], [s * 9, -24]], -2.2, -0.2);
        m.poly([[s * 14, 20], [s * wx, -38], [s * (wx + 2), -58], [s * wx * 0.62, -50], [s * 14, -42]], -2.5, -0.5);
        m.poly([[s * 7, 46], [s * (7 + 19 * cn), 24], [s * 8, 22]], -0.4, 0.6);
        m.box(s * wx * 0.56, -4.6, -20, 3, 3.4, 32);
        fin(m, s * (wx + 3), 8, -46, 22, 22, 2.4, s * -0.42, 6); fin(m, s * 11, 13, -52, 26, 24, 2.6, s * -0.38, 7);
        m.cylz(s * 13, -1, -52, 9, 8.4, 44, 8).cylz(s * 13, -1, -76, 8.6, 6.6, 8, 8).cylz(s * (wx - 4), 0, -50, 5, 4, 4 + 18 * fold, 6);
      }
      const nb = m.f.length; m.box(0, 10.1, -24, 2, 0.8, 26);
      for (const s of [-1, 1]) {
        m.poly([[s * 15, 17.5], [s * (wx - 1.5), -35.5], [s * (wx - 4), -36.5], [s * 18, 15.5]], -0.5, 0.5).poly([[s * 7.5, 58], [s * 16, 13], [s * 17.6, 12], [s * 8.4, 58]], -0.2, 0.6);
        m.cylz(s * 13, -1, -79, 9.6, 7.4, 3, 8).cylz(s * 13, -1, -81, 5.6, 5.6, 1.2, 8).box(s * (wx + 3 + 4.4 * 0.42), 15.5, -49.5, 1.4, 1.4, 4).box(s * (11 + 4.6 * 0.38), 22.5, -55, 1.4, 1.4, 4);
      }
      return done(m, nb);
    },
    raptor(fold) {   // 前進翼の迎撃機: 細い胴、前へ伸びる主翼、1枚の尾翼、中央の大きなエンジンと左右の小さなエンジン
      const m = new MB(), wx = 18 + 44 * fold, dn = 22 * (1 - fold), cn = 0.3 + 0.7 * fold;
      m.frustum(0, 0, -22, 16, 12, 12, 9, 60).frustum(0, 0, 36 + dn / 2, 12, 9, 1.4, 1.6, 56 + dn).frustum(0, -6, -10, 10, 4, 6, 3, 50);
      m.frustum(0, 8, 14, 9, 5, 6, 2.4, 30);
      fin(m, 0, 13, -42, 26, 22, 2.2, 0, 9);
      m.cylz(0, -1, -54, 9, 8, 20, 8);
      for (const s of [-1, 1]) {
        m.poly([[s * 8, -8], [s * wx, 8], [s * (wx + 2), -2], [s * 9, -34]], -1.8, -0.2);   // 前進翼(翼端が前)
        m.poly([[s * 6, 36], [s * (6 + 15 * cn), 22], [s * 6, 16]], -0.3, 0.5);
        m.box(s * (wx + 1), -0.5, 2, 3, 3, 24);                                         // 翼端のポッド
        fin(m, s * 7, 3, -44, 18, 10, 1.6, s * -1.1, 4);                                // 腹の小さな安定板
        m.cylz(s * 9, -2, -48, 5, 4.6, 22, 6);
      }
      const nb = m.f.length; m.box(0, 11.5, -20, 1.6, 0.7, 22).cylz(0, -1, -65, 9.8, 8.4, 3, 8);
      for (const s of [-1, 1]) m.poly([[s * 9, -9], [s * (wx - 1), 6.5], [s * (wx - 2), 4.5], [s * 10, -11]], -0.4, 0.4).cylz(s * 9, -2, -60, 5.4, 5, 2.4, 6).box(s * (wx + 1), 1.5, 14, 1.4, 1.4, 4);
      return done(m, nb);
    },
    bastion(fold) {   // 双胴の重砲撃機: 幅広の胴、2本の尾翼の胴、まっすぐな厚い翼、3門の長い砲、4発のエンジン
      const m = new MB(), wx = 30 + 30 * fold, dn = 16 * (1 - fold);
      m.frustum(0, 0, -10, 34, 16, 26, 12, 80).frustum(0, -1, 46 + dn / 2, 20, 10, 8, 5, 34 + dn).frustum(0, 10, 24, 13, 6, 8, 3, 26).box(0, -9, -8, 26, 5, 62);
      m.box(0, -4, 44 + dn, 3.4, 3.4, 40);                                                // 中央の砲
      for (const s of [-1, 1]) {
        m.box(s * 28, 0, -24, 10, 10, 64);                                               // 尾翼の胴
        fin(m, s * 28, 13, -52, 22, 22, 2.6, s * -0.12, 6);
        m.poly([[s * 15, 14], [s * wx, -8], [s * wx, -30], [s * 15, -38]], -3, 0.4);      // 厚い主翼
        m.box(s * wx * 0.72, -6, 14, 4, 4, 52);                                          // 翼下の長い砲
        m.cylz(s * 10, -1, -54, 7.4, 6.8, 18, 8).cylz(s * 28, 0, -60, 6.2, 5.8, 14, 8);
      }
      const nb = m.f.length; m.box(0, 13.3, 20, 2, 0.8, 14);
      for (const s of [-1, 1]) m.poly([[s * 16, 12.5], [s * (wx - 1), -9], [s * (wx - 1), -11], [s * 16, 10.5]], -0.2, 0.8).cylz(s * 10, -1, -64, 7.8, 7.2, 2.4, 8).cylz(s * 28, 0, -68, 6.6, 6.2, 2.4, 8).box(s * wx * 0.72, -6, 41, 5, 5, 3).box(s * 28, 23, -60, 1.6, 1.6, 4);
      return done(m, nb);
    },
    phantom(fold) {   // 隠し機体: 金色の全翼機。背骨、細い操縦席、外へ倒れた2枚の尾翼、3発のエンジン、後ろに光の輪
      const m = new MB(), wx = 30 + 44 * fold, dn = 20 * (1 - fold);
      m.frustum(0, 2, 4, 14, 8, 3, 3, 100 + dn).frustum(0, 6, 22, 8, 4, 4, 2, 30);
      m.cylz(0, 0, -44, 7, 6, 12, 8);
      for (const s of [-1, 1]) {
        m.poly([[s * 1, 66 + dn * 0.6], [s * wx, -34], [s * (wx * 0.74), -46], [s * 7, -38]], -2, 1);   // 全翼
        fin(m, s * 14, 9, -30, 20, 16, 2, s * -0.62, 8);
        m.cylz(s * 12, -1, -40, 5, 4.6, 12, 6);
        m.box(s * wx * 0.8, -0.5, -30, 2.4, 2.4, 14);
      }
      const nb = m.f.length; for (let k = 0; k < 16; k++) { const a = k * TWO_PI / 16, c = Math.cos(a), sn = Math.sin(a), vs = [[-4.7, -0.8, -0.8], [4.7, -0.8, -0.8], [4.7, 0.8, -0.8], [-4.7, 0.8, -0.8], [-4.7, -0.8, 0.8], [4.7, -0.8, 0.8], [4.7, 0.8, 0.8], [-4.7, 0.8, 0.8]].map(([x, y, z]) => [-x * sn + y * c + c * 24, x * c + y * sn + sn * 24, z]); m.put(vs, BOXF, 0, 0, -54, 0, 0); } m.cylz(0, 0, -51, 8, 8, 2, 8);   // 光の輪(16個の小片)
      for (const s of [-1, 1]) m.poly([[s * 2, 64 + dn * 0.6], [s * (wx - 1), -32], [s * (wx - 2.5), -34], [s * 3, 60 + dn * 0.6]], -0.4, 1.4).cylz(s * 12, -1, -47, 5.4, 5, 2, 6).box(s * (14 + 7 * 0.58), 16, -38, 1.4, 1.4, 4);
      return done(m, nb);
    },
  };
  const MESH = {};
  window.shipMesh = id => MESH[id] || (MESH[id] = { A: BUILD[id](1), B: BUILD[id](0) });
  buildPlayerShip = fold => BUILD.valkyrie(fold);   // 味方のAI機・撃墜の破片は、標準の形を使う
  const HULL_P2 = mkCol(255, 140, 210);
  playerFaces = function (out) {
    if (P.dead || cockpit) return;
    if (P.invuln > 0 && P.invuln < 300 && Math.floor(P.invuln / 6) % 2 === 0) return;   // 復活直後は点滅
    const sp = P.ship || SHIPS.valkyrie, hit = P.hitT > 0 && Math.floor(P.hitT / 3) % 2 === 0;
    const hull = hit ? C.shipHit : P.hullCol || (P.pno === 2 ? HULL_P2 : sp.hullRgb ? (sp._hc || (sp._hc = mkCol(...sp.hullRgb))) : C.ship);
    const ms = shipMesh(sp.id), b = basisYP(P.yaw, P.pitch, P.roll), f = P.foldV, A = ms.A, Bm = ms.B;
    const verts = worldToCamAll(bakeMesh({ v: A.v.map((p, i) => { const q = Bm.v[i]; return [q[0] + (p[0] - q[0]) * f, q[1] + (p[1] - q[1]) * f, q[2] + (p[2] - q[2]) * f]; }) }, P.p, b, 1));
    pushFaces(out, verts, A.f, hull);
    if (A.fAcc) pushFaces(out, verts, A.fAcc, hit ? ACC_HIT : (sp._ac || (sp._ac = accCol(sp.acc))));
    if (P.form === 'combat') for (const bp of bitPositions()) pushFaces(out, worldToCamAll(bakeMesh(M.bit, bp, b, 1)), M.bit.f, hull);
  };
  // アフターバーナー: 噴射口から粒子を噴き出す。ふだんは橙の火の粉、ブースト中は青白い噴流と、ショックダイヤモンド。
  // 粒子の動きは1フレームに1回、噴き出しは自機ごとに1フレームに1回(2人プレイで、画面を2回描いても増えない)
  const EX = [], rnd2 = (a, b) => a + Math.random() * (b - a); let exT = 0, exF = -1;
  const COL_N = [[255, 244, 210], [255, 160, 60], [200, 60, 30]], COL_B = [[255, 255, 255], [120, 210, 255], [150, 90, 255]];
  const mixC = (cs, u) => { const k = Math.min(1.999, u * 2), a = cs[Math.floor(k)], b = cs[Math.floor(k) + 1], f = k - Math.floor(k); return [a[0] + (b[0] - a[0]) * f | 0, a[1] + (b[1] - a[1]) * f | 0, a[2] + (b[2] - a[2]) * f | 0]; };
  function emit(pos, f, boost, n, burst, bc) {
    for (let i = 0; i < n; i++) {
      const spark = Math.random() < (boost ? 0.12 : 0.07), sp = spark ? rnd2(22, 34) : boost ? rnd2(13, 19) : rnd2(6, 10), spread = burst ? 7 : boost ? 1.4 : 0.8;
      const v = vadd(vadd(P.vel, vmul(f, -sp)), vmul(randDir(), rnd2(0.3, spread))), life = spark ? rnd2(16, 26) : boost ? rnd2(14, 22) : rnd2(10, 18);
      EX.push({ p: vadd(pos, vmul(randDir(), rnd2(0, 3))), v, base: [...P.vel], t: 0, life, spark, boost, s: boost ? rnd2(4.5, 7) : rnd2(3, 5), bc });
    }
  }
  drawPlayerFlame = function () {
    const ctx = drawingContext;
    if (exF !== frameCount) {   // 粒子を動かす(1フレームに1回)
      const now = performance.now(), dt = Math.min(3, exT ? (now - exT) / 16.667 : 1); exT = now; exF = frameCount;
      for (const e of EX) { e.t += dt; e.p = vadd(e.p, vmul(e.v, dt)); }
      for (let i = EX.length - 1; i >= 0; i--) if (EX[i].t >= EX[i].life) EX.splice(i, 1);
      window.__exDt = dt;
    }
    const sp = P.ship || SHIPS.valkyrie, alive = !P.dead && !cockpit;
    const b = basisYP(P.yaw, P.pitch, P.roll), boost = P.boosting || mode === 'warp', fl = (boost ? 60 : 24) + Math.random() * 12;
    const noz = sp.noz.map(([x, y, z]) => vadd(P.p, vadd(vadd(vmul(b.r, x * 0.8), vmul(b.u, y * 0.8)), vmul(b.f, z * 0.8))));
    if (alive && !paused && state !== 'select' && P._exF !== frameCount) {   // 噴き出す(自機ごとに、1フレームに1回)
      P._exF = frameCount;
      P._exAcc = (P._exAcc || 0) + (window.__exDt || 1) * (boost ? 5 : 2.2) * (lite ? 0.5 : 1) * (2 / noz.length);
      const n = Math.floor(P._exAcc); P._exAcc -= n;
      for (const a of noz) emit(a, b.f, boost, n, false, sp.boostCol);
      if (boost && !P._exWas) for (const a of noz) emit(a, b.f, true, lite ? 10 : 22, true, sp.boostCol);   // 点火の瞬間: 輪のように噴き出す
      P._exWas = boost;
      const cap = (lite ? 220 : 520) * (coop ? 1.5 : 1); if (EX.length > cap) EX.splice(0, EX.length - cap);
    }
    if (!window.__exSkip) {   // 粒子(加算で光らせる。古いほど、大きく・暗く・色が冷える)。2人のときは、画面ごとに1回だけ描く
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      for (const e of EX) {
        const q = projW(e.p); if (!q) continue;
        const zc = F / q[2], near = Math.max(0, Math.min(1, (zc - 90) / 330));   // カメラに近い粒子は、薄くする
        const u = e.t / e.life, al = Math.pow(1 - u, 1.5) * (e.spark ? 0.9 : e.boost ? 0.42 : 0.5) * near, c = e.spark ? [255, 235, 170] : mixC(e.boost ? (e.bc || COL_B) : COL_N, u);
        if (e.spark) { const q2 = projW(vsub(e.p, vmul(vsub(e.v, e.base), 1.6))); if (q2) { ctx.strokeStyle = `rgba(${c[0]},${c[1]},${c[2]},${al})`; ctx.lineWidth = Math.max(1, q[2] * 4); ctx.beginPath(); ctx.moveTo(q[0], q[1]); ctx.lineTo(q2[0], q2[1]); ctx.stroke(); } continue; }
        if (al < 0.02) continue; const r = Math.min(13, Math.max(0.8, e.s * (0.7 + 1.3 * u) * q[2])); ctx.fillStyle = `rgba(${c[0]},${c[1]},${c[2]},${al})`; ctx.beginPath(); ctx.arc(q[0], q[1], r, 0, 6.2832); ctx.fill();
      }
      ctx.restore();
    }
    if (!alive) return;
    const bcol = sp.boostCol ? sp.boostCol[1] : [120, 200, 255];
    for (const a of noz) {
      const c = vadd(a, vmul(b.f, -fl)), pa = projW(a), pc = projW(c);
      if (!pa || !pc) continue;
      if (!lite) {   // 噴射口の光の玉
        const r = Math.max(6, pa[2] * (boost ? 34 : 20)), g = ctx.createRadialGradient(pa[0], pa[1], 0, pa[0], pa[1], r);
        g.addColorStop(0, boost ? 'rgba(220,240,255,.85)' : 'rgba(255,230,170,.7)'); g.addColorStop(0.4, boost ? `rgba(${bcol[0]},${bcol[1]},${bcol[2]},.32)` : 'rgba(255,150,50,.25)'); g.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = g; ctx.fillRect(pa[0] - r, pa[1] - r, r * 2, r * 2); ctx.restore();
      }
      neon(boost ? bcol : [255, 170, 60], 235, 12, boost ? 5 : 3.4); line(pa[0], pa[1], pc[0], pc[1]);
      neon([255, 250, 235], 230, 0, 1.4); line(pa[0], pa[1], pa[0] + (pc[0] - pa[0]) * 0.55, pa[1] + (pc[1] - pa[1]) * 0.55);
      if (boost) {   // ショックダイヤモンド: 噴流の中に並ぶ、明るい輪
        ctx.save(); ctx.globalCompositeOperation = 'lighter';
        for (let k = 1; k <= 4; k++) { const q = projW(vadd(a, vmul(b.f, -k * 17 - Math.random() * 3))); if (!q) continue; const r = Math.max(1.2, q[2] * (9 - k * 1.5)), al = (0.75 - k * 0.14) * (0.7 + 0.3 * Math.random()); ctx.fillStyle = `rgba(210,235,255,${al})`; ctx.beginPath(); ctx.ellipse(q[0], q[1], r, r * 0.7, 0, 0, 6.2832); ctx.fill(); }
        ctx.restore();
      }
    }
    noGlow();
  };
})();
