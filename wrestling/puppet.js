// puppet.js — レスラーを部品(頭・胴・腰・上腕/前腕・太もも/すね)に分けて、関節で動かす「紙人形」(2026-10-08)
// 部品の絵: assets/parts/NN/*.png + parts.json(Geminiのパーツ絵を cut_parts.py で切ったもの。届くまでは make_placeholder_parts.py の仮パーツ)
// 向き: ローカル座標は「右向き」。前 = +x。ポーズの角度は 正 = 前(相手の方)へ振る / 前へ倒れる。左右反転は呼び出し側(ctx.scale)。
// 腕・脚の「前側」は、見る人の右側 = キャラクターの左 の部品(L)を使う。
'use strict';
const PUP = (() => {
  const store = {}, KEYS = ['rx', 'ry', 'rr', 'tr', 'hr', 'af1', 'af2', 'ab1', 'ab2', 'lf1', 'lf2', 'lb1', 'lb2'];
  const PN = ['head', 'torso', 'pelvis', 'armUp', 'armLo', 'legUp', 'legLo'];
  const P = (o) => Object.assign(Object.fromEntries(KEYS.map((k) => [k, 0])), o);
  // ----- ポーズ表 -----
  const POSE = {
    guard: P({ tr: .06, af1: .55, af2: 2.0, ab1: .15, ab2: 2.4, lf1: .3, lf2: -.35, lb1: -.3, lb2: -.25, ry: 2 }),
    windup: P({ tr: -.2, af1: -.2, af2: 1.6, ab1: .2, ab2: 2.3, lf1: .15, lb1: -.35, lb2: -.2, rx: -6 }),
    punch: P({ tr: .3, rr: .05, af1: 1.45, af2: .15, ab1: .1, ab2: 2.4, lf1: .55, lf2: -.2, lb1: -.45, lb2: -.1, rx: 10 }),
    lariat: P({ tr: .5, rr: .1, af1: 1.55, af2: 0, ab1: .3, ab2: 2.6, lf1: .75, lf2: -.3, lb1: -.65, lb2: -.1, rx: 14 }),
    chopUp: P({ tr: -.18, af1: 2.7, af2: .4, ab1: .2, ab2: 2.4, lf1: .2, lb1: -.3, rx: -4 }),
    chopDown: P({ tr: .38, af1: .5, af2: .1, ab1: .2, ab2: 2.3, lf1: .5, lf2: -.2, lb1: -.4, rx: 8 }),
    kick: P({ rr: -.12, tr: -.3, af1: .95, af2: .3, ab1: -.7, ab2: .4, lf1: 1.6, lf2: -.05, lb1: -.1, lb2: -.1, ry: -2, rx: 4 }),
    lowKick: P({ tr: .12, af1: .7, af2: 1.8, ab1: -.3, ab2: 1.5, lf1: .98, lf2: -.05, lb1: -.35, lb2: -.2, rx: 4 }),
    headbutt: P({ tr: .62, hr: .5, af1: -.7, ab1: -.6, lf1: .4, lf2: -.4, lb1: -.35, rx: 10 }),
    elbow: P({ tr: .45, af1: 1.2, af2: 2.6, ab1: .2, ab2: 2.2, lf1: .55, lf2: -.3, lb1: -.4, rx: 8 }),
    grapple: P({ tr: .22, hr: .1, af1: 1.3, af2: .9, ab1: 1.2, ab2: .9, lf1: .4, lf2: -.8, lb1: -.2, lb2: -.8, ry: 6, rx: 6 }),
    hold: P({ tr: .35, af1: 1.0, af2: 1.0, ab1: 1.1, ab2: 1.2, lf1: .5, lf2: -.7, lb1: -.45, lb2: -.5, ry: 8, rx: 6 }),
    liftHigh: P({ tr: -.28, hr: -.2, af1: 3.0, af2: .1, ab1: 2.8, ab2: .1, lf1: .15, lb1: -.15, ry: -6 }),
    slamDown: P({ tr: .85, af1: 1.1, af2: .2, ab1: 1.0, ab2: .2, lf1: .75, lf2: -1.25, lb1: -.4, lb2: -1.0, ry: 18, rx: 10 }),
    held: P({ tr: -.1, hr: -.3, af1: -.4, af2: -.3, ab1: -.2, ab2: -.3, lf1: .3, lf2: -.2, lb1: -.3, lb2: -.3 }),
    stagger: P({ tr: -.45, hr: -.5, af1: .5, af2: .8, ab1: -.3, ab2: .6, lf1: -.1, lb1: -.5, rr: -.15, rx: -8 }),
    down: P({ af1: .9, af2: .2, ab1: -.9, ab2: .2, lf1: .25, lf2: -.1, lb1: -.2, lb2: -.1 }),
    pinTop: P({ tr: .95, hr: .2, af1: 1.4, af2: .3, ab1: 1.3, ab2: .3, lf1: 1.1, lf2: -1.6, lb1: -.2, lb2: -1.4, ry: 26 }),
    dive: P({ rr: 1.3, tr: .1, af1: 2.4, af2: .1, ab1: -2.2, ab2: .1, lf1: -.5, lb1: -.3 }),
    elbowDrop: P({ rr: .9, tr: .2, af1: 1.6, af2: 2.7, ab1: 1.0, ab2: 2.0, lf1: .6, lf2: -.9, lb1: -.2, lb2: -1.0 }),
    runRope: P({ tr: .5, af1: .9, af2: 1.3, ab1: -.8, ab2: .6, lf1: 1.0, lf2: -.5, lb1: -.9, lb2: -.8, rx: 8 }),
    power: P({ tr: -.12, af1: 2.4, af2: .2, ab1: -2.4, ab2: .2, lf1: .5, lb1: -.5, ry: -4 }),
    refStand: P({ tr: .08, af1: .35, af2: .9, ab1: .25, ab2: 1.1, lf1: .1, lb1: -.1, ry: 1 }),
    refSlap: P({ tr: .75, hr: .25, af1: 1.5, af2: .2, ab1: 1.0, ab2: .3, lf1: .9, lf2: -1.4, lb1: -.15, lb2: -1.3, ry: 26, rx: 6 }),
    refUp: P({ tr: .7, hr: .25, af1: 2.3, af2: .2, ab1: 1.0, ab2: .3, lf1: .9, lf2: -1.4, lb1: -.15, lb2: -1.3, ry: 26, rx: 6 }),
    getup: P({ tr: .6, af1: .7, ab1: .6, lf1: 1.0, lf2: -1.7, lb1: -.1, lb2: -1.6, ry: 30 }),
    stomp: P({ tr: .4, af1: .9, af2: 1.2, ab1: -.5, ab2: .9, lf1: 1.2, lf2: -.6, lb1: -.2, lb2: -.2, rx: 8 }),
  };
  // ----- 読み込み -----
  function loadOne(no) {
    const d = 'assets/parts/' + String(no).padStart(2, '0') + '/';
    return fetch(d + 'parts.json').then((r) => { if (!r.ok) throw 0; return r.json(); }).then((info) => Promise.all(PN.map((k) => new Promise((res, rej) => { const im = new Image(); im.onload = () => res([k, im]); im.onerror = rej; im.src = d + k + '.png'; }))).then((arr) => {
      const img = Object.fromEntries(arr), g = (k) => ({ w: img[k].width, h: img[k].height });
      const pe = g('pelvis'), to = g('torso'), he = g('head'), au = g('armUp'), al = g('armLo'), lu = g('legUp'), ll = g('legLo');
      const below = 0.68 * pe.h + 0.86 * lu.h + 0.88 * ll.h, H0 = below + 0.93 * to.h + 0.9 * he.h;
      store[no] = { img, info, K: 212 * (info.size || 1) / H0, below, ok: true };
    })).catch(() => { store[no] = { ok: false }; });
  }
  const loadAll = () => Promise.all(Array.from({ length: 21 }, (_, i) => loadOne(i + 1)));
  const has = (no) => !!(store[no] && store[no].ok) && !/[?&#,]nopuppet/.test(location.href);
  // ----- ポーズの補間(なめらかに近づける) -----
  function newPose() { return Object.assign({}, POSE.guard); }
  function step(f, name, dt, rate, extra) {
    const t = POSE[name] || POSE.guard; f.pose = f.pose || newPose(); f.pv = f.pv || {};
    const w = (rate || 16) * 1.15, z = 0.82, h = Math.min(dt, 1 / 30);      // ばね+ダンパー: 少しゆきすぎて戻る(しなやかな動き)
    for (const key of KEYS) { const v = t[key] + (extra && extra[key] || 0); let q = f.pv[key] || 0;
      q += (w * w * (v - f.pose[key]) - 2 * z * w * q) * h; f.pv[key] = q; f.pose[key] += q * h; }
    f.poseName = name;
  }
  // ----- 描画 -----
  // ctx は、足元の x(px)・床の y(GROUND)・向き(flip)・持ち上げ(lift)・横たわり度(lie 0..1) と、ゲームの vis(rot, sx, sy, flash)で変換して描く
  function draw(ctx, f, px, ground, flip, lift, lie, vis) {
    const S = store[f.no]; if (!S || !S.ok) return false; const K = S.K * (f.scl || 1), I = S.img, p = f.pose || newPose();
    const pe = I.pelvis, to = I.torso, he = I.head, au = I.armUp, al = I.armLo, lu = I.legUp, ll = I.legLo;
    const standY = ground - K * S.below - lift - p.ry * 0.7, lieY = ground - K * (pe.height * 0.32 + 14) - lift * 0.3;
    const wy = standY + (lieY - standY) * lie;
    ctx.save(); ctx.translate(px + vis.ox, wy); ctx.rotate(vis.rot + (flip >= 0 ? -1 : 1) * 1.5 * lie); ctx.scale(flip * vis.sx, vis.sy);
    if (vis.flash > 0 && 'filter' in ctx) ctx.filter = 'brightness(2.4) saturate(.5)';
    ctx.translate(p.rx * 0.7, 0); ctx.rotate(p.rr); ctx.scale(K, K);      // 以後は部品の元の大きさ(px)で書く。原点=腰の中心
    const img = (im, ax, ay) => ctx.drawImage(im, -ax * im.width, -ay * im.height);
    // 手首・足首: すね/前腕の下の部分(手・足)を別パーツとして、もう一つの関節で曲げる(fr=関節の位置の割合, a3=曲げ角)
    const limb = (up, lo, x, y, a1, a2, hold, a3, fr, v2) => { ctx.save(); ctx.translate(x, y); ctx.rotate(-a1); img(up, .5, .1); ctx.translate(0, (.86 - .1) * up.height); ctx.rotate(-a2);
      const w = lo.width, h = lo.height, cut = fr * h; ctx.drawImage(lo, 0, 0, w, cut + 2, -.5 * w, -.08 * h, w, cut + 2);
      ctx.translate(0, cut - .08 * h); ctx.rotate(-a3); ctx.drawImage(lo, 0, cut, w, h - cut, -.5 * w, -1, w, h - cut);
      if (hold && window.PROP && window.PROP[hold]) { const pi = window.PROP[hold], sc = (hold === 'chair' ? 70 : 60) / K / pi.height; ctx.translate(0, (.9 - fr) * h); ctx.rotate(hold === 'chair' ? 0.5 : 0); ctx.scale(sc, sc); ctx.drawImage(pi, -pi.width * 0.5, -pi.height * 0.62); }
      ctx.restore(); };
    const pv = f.pv || {}, cl = (v, m) => Math.max(-m, Math.min(m, v));
    const hand = (a1, a2, k2) => cl(-0.05 * (pv[k2] || 0) + 0.12 * (a1 + a2) * 0.3, .8), foot = (a1, a2, k2) => cl(-(a1 + a2) * .55 - 0.04 * (pv[k2] || 0), .9);
    const hipY = (.8 - .12) * pe.height, hipX = .24 * pe.width;
    limb(lu, ll, -hipX, hipY, p.lb1, p.lb2, null, foot(p.lb1, p.lb2, 'lb2'), .72);                                   // 後ろ脚
    limb(lu, ll, hipX, hipY, p.lf1, p.lf2, null, foot(p.lf1, p.lf2, 'lf2'), .72);                                    // 前脚
    ctx.save(); img(pe, .5, .12); ctx.restore();                              // 腰
    ctx.save(); ctx.rotate(p.tr);                                              // 胴(腰を軸に前へ倒れる)
    limb(au, al, -.38 * to.width, (.14 - .97) * to.height, p.ab1, p.ab2, null, hand(p.ab1, p.ab2, 'ab2'), .66);      // 後ろ腕(胴の後ろ側)
    img(to, .5, .97);
    ctx.save(); ctx.translate(0, (.04 - .97) * to.height); ctx.rotate(p.hr); img(he, .5, .9); ctx.restore();   // 頭
    limb(au, al, .38 * to.width, (.14 - .97) * to.height, p.af1, p.af2, f.holding, hand(p.af1, p.af2, 'af2'), .66);       // 前腕側(手前)。小物を持っていれば手に描く
    ctx.restore();
    ctx.restore(); return true;
  }
  return { POSE, has, loadAll, step, draw, store, newPose };
})();
