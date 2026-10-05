/* 絵(光のポスター調 art_kids.js)を、エンジンにつなぐ。動き・背景の動き・額縁・表紙。 */
(function () {
  "use strict";
  const rain = (n, d0) => Array.from({ length: n }, (_, i) => ({ p: "drop", x: 20 + (i * 83) % 600, y: -20, s: 0.4 + (i % 3) * 0.1, a: "fall", d: (d0 || 3) + (i % 4) * 0.6, delay: (i * 0.45) % 3, dx: "-8%", dy: "2800%" }));
  const petals = (n) => Array.from({ length: n }, (_, i) => ({ p: "petal", x: 20 + (i * 97) % 600, y: -20, s: 0.4 + (i % 3) * 0.12, a: "fall", d: 8 + (i % 4) * 2, delay: i * 0.9, dx: (i % 2 ? "" : "-") + "50%", dy: "3000%" }));
  const twinkles = (n, ymax, s0, y0) => Array.from({ length: n }, (_, i) => ({ p: "littlestar", x: 30 + (i * 137) % 580, y: (y0 || 40) + (i * 71) % (ymax || 300), s: (s0 || 0.35) + (i % 3) * 0.12, a: "twinkle", d: 2.2 + (i % 4) * 0.7, delay: (i * 0.6) % 3 }));
  const cloud = (x, y, s, d, delay, dx) => ({ p: "cloud", x, y, s, a: "drift", d, delay, dx: dx || "420%" });

  window.GAME.art = makeKidArt({
    defs: window.PAINT_DEFS, filterDef: window.PAINT_FILTER,
    motion: {
      ryo: "breathe", ryo_old: "breathe", yui: "bob", kotone: "breathe", takahashi: "bob", tomoko: "breathe", shizuka: "breathe", kashiwagi: "breathe",
      anzai: "breathe", reika: "breathe", minori: "bob", oldman: "sway", usagi: "sway", glass: "float", okusuri: "sway", notebook: "float", note: "float", heart: "float", lamp: "sway"
    },
    ambient: {
      rain: rain(18, 2.6), classroom: [cloud(160, 60, 0.7, 90, 0)], town: [cloud(160, 50, 0.7, 90, 0), cloud(440, 60, 0.6, 110, 20)], shop: [],
      music: twinkles(5, 120, 0.25, 40), clinic: [], consult: [], fireworks: [...twinkles(8, 160, 0.3), cloud(300, 50, 0.6, 120, 4)],
      campus: petals(12), dorm: twinkles(4, 100, 0.25, 40), meeting: [], eve: twinkles(8, 200, 0.28), finale: rain(10, 3.2), night: twinkles(14, 300), spring: petals(14)
    },
    stage: {
      frameImage: makeFrame({ corner: "note", edge: "rain", c1: "#2a3068", c2: "#4a58a8", c3: "#1c2050", gold: "#ffe8a8" }),
      wallpaper: makeWallpaper("rain"),
      frame: [
        { type: "peek", p: "yui", css: "left:8%;top:-48px;width:40px;height:48px", d: 15, delay: 0 },
        { type: "peek", p: "ryo", css: "right:14%;top:-46px;width:40px;height:46px", d: 19, delay: 6 },
        { p: "usagi", css: "left:47%;top:-30px;width:22px", a: "sway", d: 3.4, z: "front" },
        { type: "orbit", p: "littlestar", css: "right:-6px;top:-6px", r: 34, d: 9, w: 18 },
        { type: "orbit", p: "drop", css: "left:-6px;bottom:-6px", r: 30, d: 12, w: 14, delay: 2 },
        { p: "note", css: "left:-12px;top:-14px;width:26px", a: "sway", d: 2.8, z: "front" },
        { p: "notebook", css: "right:6%;bottom:-20px;width:30px", a: "sway", d: 4, z: "front" }
      ],
      page: [
        { p: "littlestar", css: "left:10%;top:30%;width:14px", a: "twinkle", d: 3, delay: 0.5 },
        { p: "littlestar", css: "left:90%;top:62%;width:14px", a: "twinkle", d: 3.6, delay: 1.7 },
        { p: "drop", css: "left:20%;top:-3%;width:12px", a: "fall", d: 14, delay: 3, dx: "-100%", dy: "5400%" },
        { p: "petal", css: "left:60%;top:-3%;width:14px", a: "fall", d: 17, delay: 9, dx: "-200%", dy: "5400%" }
      ]
    },
    cover: { bg: "finale", deco: [["yui", 260, 450, 1.0], ["ryo", 380, 450, 1.0], ["usagi", 460, 400, 0.9], ["littlestar", 320, 110, 1.0]] }
  });
})();
