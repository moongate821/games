/* 画像の絵(Geminiの水彩画)を、エンジンの art インターフェースにつなぐ。
 *   背景: img/bg/<名前>.webp(640×480)  小物: img/p/<名前>.webp(切りぬき・透明)  持ち物アイコン: img/p/i_<名前>.webp
 *   img_list.js(取りこみ時に自動で作る)に、ある画像の一覧と大きさ。ないものは、仮の絵(薄い色の面+名前)で出す。
 *   小物は、足もと中央が (0,0)。小物の大きさ(幅×高さ)は、img_list の w,h(取りこみ時に決まる)。 */
(function () {
  "use strict";
  const L = window.IMG_LIST || { bg: {}, p: {} };
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  function hash(s) { let h = 0; for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0; return Math.abs(h); }
  function placeholderBg(name) {
    const hue = hash(name) % 360;
    return `<rect width="640" height="480" fill="hsl(${hue} 22% 78%)"/><rect y="300" width="640" height="180" fill="hsl(${hue} 20% 66%)"/>` +
      `<text x="320" y="240" text-anchor="middle" font-size="26" fill="#5a4a3a" opacity=".55" font-family="serif">${esc(name)}</text>`;
  }
  function placeholderProp(name) {
    const hue = hash(name) % 360, ic = name.startsWith("i_");
    const w = ic ? 44 : 90, hh = ic ? 44 : 110;
    return `<g opacity=".92"><rect x="${-w / 2}" y="${-hh}" width="${w}" height="${hh}" rx="8" fill="hsl(${hue} 30% 82%)" stroke="#6a5a4a" stroke-width="1.5"/>` +
      `<text y="${-hh / 2 + 4}" text-anchor="middle" font-size="${ic ? 9 : 13}" fill="#4a3a2a" font-family="serif">${esc(name.replace(/^i_/, ""))}</text></g>`;
  }
  window.ALICE_ART = {
    w: 640, h: 480,
    bg(name) {
      const e = L.bg[name];
      if (!e) return placeholderBg(name);
      return `<image href="img/bg/${name}.webp" x="0" y="0" width="640" height="480" preserveAspectRatio="xMidYMid slice"/>`;
    },
    prop(name) {
      const e = L.p[name];
      if (!e) return placeholderProp(name);
      return `<image href="img/p/${name}.webp" x="${-e.w / 2}" y="${-e.h}" width="${e.w}" height="${e.h}"/>`;
    },
    cover() {
      const inner = L.bg.cover ? `<image href="img/bg/cover.webp" width="640" height="480" preserveAspectRatio="xMidYMid slice"/>` : placeholderBg("cover");
      return `<svg viewBox="0 0 640 480" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="cover">${inner}</svg>`;
    },
    // 水彩画は、そのまま出す(線のゆらぎは、かけない)
    filterDef: '<filter id="sb-wc" x="0" y="0" width="1" height="1"><feOffset dx="0" dy="0"/></filter>',
    defs: null,
    motion: {}, ambient() { return []; }, stage: null,
    props: {}, bgs: {}
  };
})();
