// origpuppet.js — 元絵(assets/body_NN.webp)の画素だけを、頭・胴・上腕/前腕・太もも/すねに切り分けた「紙人形」(2026-10-09)
// 部品: assets/orig/NN.webp(アトラス)+ assets/orig/joints.json。作り方は 素材制作/cut_original_puppet.py
// 元絵のポーズ = PUP.POSE.guard。ほかのポーズは guard との差の角度だけ、肩・ひじ・股関節・ひざ・腰・首で回す。
// そのため guard では元絵とまったく同じ見た目で、衣装・腕の数・体格が場面で変わらない。
'use strict';
const OPUP = (() => {
  const store = {}; let JOINTS = null;
  const G = () => PUP.POSE.guard;
  function loadAll() {
    return fetch('assets/orig/joints.json').then((r) => { if (!r.ok) throw 0; return r.json(); }).then((j) => {
      JOINTS = j;
      return Promise.all(Object.keys(j).map((no) => new Promise((res) => { const im = new Image(); im.onload = () => { store[no] = { img: im, d: j[no], ok: true }; res(); }; im.onerror = res; im.src = 'assets/orig/' + String(no).padStart(2, '0') + '.webp'; })));
    }).catch(() => {});
  }
  const has = (no) => !!(store[no] && store[no].ok) && !/[?&#,]nopuppet|[?&#,]noorig/.test(location.href);
  const rot = (pt, c, a) => { const s = Math.sin(a), k = Math.cos(a), x = pt[0] - c[0], y = pt[1] - c[1]; return [c[0] + x * k - y * s, c[1] + x * s + y * k]; };
  // ctx は GROUND の床 y と、足元 x(px)、向き flip、vis(rot,sx,sy,ox,lift,flash) で配置する。戻り値 true=描いた
  function draw(ctx, f, px, ground, flip, v, extra) {
    const S = store[f.no]; if (!S || !S.ok) return false;
    const D = S.d, J = D.J, P = D.parts, im = S.img, W = D.W, H = D.H, sc = 212 / H, p = f.pose || PUP.newPose(), g = G();
    const part = (k) => { const q = P[k]; if (q) ctx.drawImage(im, q.sx, q.sy, q.w, q.h, q.ox, q.oy, q.w, q.h); };
    const dTr = (p.tr - g.tr) * 0.9, dHr = (p.hr - g.hr) * 0.9;
    const aF1 = -(p.af1 - g.af1), aF2 = -(p.af2 - g.af2), aB1 = -(p.ab1 - g.ab1), aB2 = -(p.ab2 - g.ab2);
    const hF = -(p.lf1 - g.lf1), kF = -(p.lf2 - g.lf2), hB = -(p.lb1 - g.lb1), kB = -(p.lb2 - g.lb2);
    // 足の接地: いちばん低い足が元の床の高さにくるよう、体全体を上下させる(ひざを曲げれば腰が下がる)
    let dy = 0;
    if (Math.abs(p.rr) < 0.3 && v.lift < 8 && J.footB && J.footF) {
      const fb = rot(rot(J.footB, J.kneeB, kB), J.hipB, hB), ff = rot(rot(J.footF, J.kneeF, kF), J.hipF, hF);
      const rest = Math.max(J.footB[1], J.footF[1]); dy = Math.max(-6, Math.min(0.22 * H, rest - Math.max(fb[1], ff[1])));
    }
    const hip = J.hip, neck = J.neck, cyc = ground - 106 - v.lift - (p.ry || 0) * 0.35;
    ctx.save();
    ctx.translate(px + v.ox + (p.rx || 0) * 0.7, cyc); ctx.rotate(v.rot + (p.rr || 0)); ctx.scale(flip * v.sx, v.sy); ctx.scale(sc, sc); ctx.translate(-W / 2, -H / 2 + dy);
    if (v.flash > 0 && 'filter' in ctx) ctx.filter = 'brightness(2.4) saturate(.5)';
    const T = (pt) => ctx.translate(pt[0], pt[1]), TI = (pt) => ctx.translate(-pt[0], -pt[1]);
    const leg = (s, hp, kn, ah, ak) => { ctx.save(); T(hp); ctx.rotate(ah); TI(hp); ctx.save(); T(kn); ctx.rotate(ak); TI(kn); part('leg' + s + 'l'); ctx.restore(); part('leg' + s + 'u'); ctx.restore(); };
    // 上半身(胴・頭・腕)は腰を軸に前へ倒れる
    ctx.save(); T(hip); ctx.rotate(dTr); TI(hip);
    part('torso');
    ctx.restore();
    leg('B', J.hipB, J.kneeB, hB, kB);
    leg('F', J.hipF, J.kneeF, hF, kF);
    ctx.save(); T(hip); ctx.rotate(dTr); TI(hip);
    ctx.save(); T(neck); ctx.rotate(dHr); TI(neck); part('head'); ctx.restore();
    const arm = (s, a1, a2, hold) => { if (!J['sh' + s]) return; const sh = J['sh' + s], el = J['el' + s], wr = J['wr' + s];
      ctx.save(); T(sh); ctx.rotate(a1); TI(sh); part('arm' + s + 'u');
      T(el); ctx.rotate(a2); TI(el); part('arm' + s + 'l');
      if (hold && window.PROP && window.PROP[hold]) { const pi = window.PROP[hold], k = ((hold === 'chair' ? 70 : 60) / sc) / pi.height; T(wr); ctx.rotate(hold === 'chair' ? 0.5 : 0); ctx.scale(k, k); ctx.drawImage(pi, -pi.width * 0.5, -pi.height * 0.62); }
      ctx.restore(); };
    arm('B', aB1, aB2, null);
    arm('F', aF1, aF2, f.holding);
    ctx.restore();
    ctx.restore(); return true;
  }
  return { loadAll, has, draw, store };
})();
