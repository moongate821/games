// ボスの「紙人形」アニメーション。絵を assets/rigs.json の設計図どおりにパーツへ切り分け、パーツごとにゆらす・回す・波うたせる。
// どのパーツにも入らない部分が胴体。パーツが無いボスは SP.draw(1枚絵)のまま。
(function () {
  const Rig = window.Rig = { specs: null, built: {} };
  Rig.load = function () {
    try { fetch('assets/rigs.json', { cache: 'no-cache' }).then(r => r.ok ? r.json() : null).then(j => { Rig.specs = j; Rig.built = {}; }).catch(() => { }); } catch (e) { }
  };
  Rig.load();

  function inPoly(u, v, pts) {
    let c = false;
    for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
      const xi = pts[i][0], yi = pts[i][1], xj = pts[j][0], yj = pts[j][1];
      if (((yi > v) !== (yj > v)) && (u < (xj - xi) * (v - yi) / (yj - yi) + xi)) c = !c;
    }
    return c;
  }
  function hit(sh, u, v) {
    if (sh.t === 'rect') return u >= sh.r[0] && u < sh.r[2] && v >= sh.r[1] && v < sh.r[3];
    if (sh.t === 'poly') return inPoly(u, v, sh.p);
    const dx = (u - sh.c[0]) / sh.r[0], dy = (v - sh.c[1]) / sh.r[1], d = dx * dx + dy * dy;
    return d <= 1 && d >= (sh.hole || 0) * (sh.hole || 0);
  }
  function layerCanvas(w, h, src, owner, id) {
    const c = document.createElement('canvas'); c.width = w; c.height = h; const x = c.getContext('2d'), out = x.createImageData(w, h), sd = src.data, od = out.data;
    for (let i = 0; i < w * h; i++) if (owner[i] === id) { od[i * 4] = sd[i * 4]; od[i * 4 + 1] = sd[i * 4 + 1]; od[i * 4 + 2] = sd[i * 4 + 2]; od[i * 4 + 3] = sd[i * 4 + 3]; }
    x.putImageData(out, 0, 0); return c;
  }
  function tinted(cv) {
    const c = document.createElement('canvas'); c.width = cv.width; c.height = cv.height; const x = c.getContext('2d');
    x.drawImage(cv, 0, 0); x.globalCompositeOperation = 'source-atop'; x.fillStyle = 'rgba(255,255,255,.4)'; x.fillRect(0, 0, c.width, c.height); return c;
  }
  function build(name) {
    const im = SP.ext[name], spec = Rig.specs && Rig.specs[name]; if (!im || !spec) return null;
    const w = im.naturalWidth || im.width, h = im.naturalHeight || im.height;
    const tmp = document.createElement('canvas'); tmp.width = w; tmp.height = h; const tx = tmp.getContext('2d'); tx.drawImage(im, 0, 0);
    const src = tx.getImageData(0, 0, w, h), owner = new Int8Array(w * h).fill(-1);
    for (let p = 0; p < spec.length; p++) for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (src.data[(y * w + x) * 4 + 3] > 0 && hit(spec[p].shape, (x + .5) / w, (y + .5) / h)) owner[y * w + x] = p;
    const B = { w, h, body: layerCanvas(w, h, src, owner, -1), parts: [] };
    B.bodyF = tinted(B.body);
    spec.forEach((s, p) => {
      const cv = layerCanvas(w, h, src, owner, p); let bx0 = w, bx1 = 0;
      for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (owner[y * w + x] === p) { if (x < bx0) bx0 = x; if (x > bx1) bx1 = x; }
      const sh = s.shape, c = sh.t === 'rect' ? [(sh.r[0] + sh.r[2]) / 2, (sh.r[1] + sh.r[3]) / 2] : sh.t === 'ell' ? sh.c : [.5, .5];
      B.parts.push({ cv, cvF: tinted(cv), s, px: (s.pivot ? s.pivot[0] : c[0]) * w, py: (s.pivot ? s.pivot[1] : c[1]) * h, bx0, bx1, cx: c[0] * w, cy: c[1] * h });
    });
    return B;
  }
  Rig.has = function (name) {
    if (!Rig.specs || !Rig.specs[name] || !SP.ext[name]) return false;
    if (!(name in Rig.built)) Rig.built[name] = build(name);
    return !!Rig.built[name];
  };
  // 描く: (x,y)=絵の中心 / t=時間 / o={flash, phase(ボスの形態), dead(やられてからの秒), scale(絵の拡大率)}
  Rig.draw = function (ctx, name, x, y, t, o) {
    o = o || {}; const B = Rig.built[name]; if (!B) return false;
    const k = 1 + .35 * (o.phase || 0), dead = o.dead || 0, ox = Math.round(x - B.w / 2), oy = Math.round(y - B.h / 2), fl = o.flash;
    const fade = dead > 0 ? Math.max(0, 1 - dead / 2.1) : 1; const ga = ctx.globalAlpha; ctx.globalAlpha = ga * fade;
    const shakeX = dead > 0 ? Math.round(Math.sin(dead * 60) * 1.5) : 0;
    ctx.drawImage(fl ? B.bodyF : B.body, ox + shakeX, oy);
    for (let i = 0; i < B.parts.length; i++) {
      const p = B.parts[i], s = p.s, cv = fl ? p.cvF : p.cv; let dx = 0, dy = 0, ang = 0, sc = 1;
      if (s.rot) ang = ((s.rot[3] || 0) + s.rot[0] * Math.sin(t * s.rot[1] * k + s.rot[2])) * Math.PI / 180;
      if (s.mv) { const m = Math.sin(t * s.mv[2] * k + s.mv[3]); dx = s.mv[0] * m; dy = s.mv[1] * m; }
      if (s.sc) sc = 1 + s.sc[0] * Math.sin(t * s.sc[1] * k + s.sc[2]);
      if (s.spin) ang += t * s.spin * k;
      if (dead > 0) { const d = dead * 34, a = Math.atan2(p.cy - B.h / 2, p.cx - B.w / 2 + .001) + i; dx += Math.cos(a) * d; dy += Math.sin(a) * d + dead * dead * 14; ang += dead * (i % 2 ? 1.4 : -1.4); }
      if (s.wave) {
        const wv = s.wave, step = 2;
        if (wv.axis === 'x') for (let sx = p.bx0 - (p.bx0 % step); sx <= p.bx1; sx += step) {
          const u = (sx - p.bx0) / Math.max(1, p.bx1 - p.bx0), g = wv.grow === 'left' ? 1 - u : wv.grow === 'right' ? u : 1;
          const off = Math.round(Math.sin(t * wv.speed * k + wv.phase + u * wv.k) * wv.amp * g);
          ctx.drawImage(cv, sx, 0, step, B.h, ox + sx + shakeX, oy + off + (dead > 0 ? Math.round(dy) : 0), step, B.h);
        }
        continue;
      }
      ctx.save(); ctx.translate(ox + p.px + dx + shakeX, oy + p.py + dy); if (ang) ctx.rotate(ang); if (sc !== 1) ctx.scale(sc, sc); ctx.drawImage(cv, -p.px, -p.py); ctx.restore();
    }
    ctx.globalAlpha = ga; return true;
  };
})();
