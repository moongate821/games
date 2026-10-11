/* 絵(墨絵 art_kids.js)を、エンジンにつなぐ。動き・背景の動き・額縁・表紙。墨のにじみの定義(PAINT_DEFS)も、ここでわたす。 */
(function () {
  "use strict";
  const petals = (n, d0) => Array.from({ length: n }, (_, i) => ({ p: "petal", x: 20 + (i * 83) % 600, y: -20, s: 0.5 + (i % 3) * 0.2, a: "fall", d: (d0 || 10) + (i % 4) * 2, delay: i * 1.1, dx: (i % 2 ? "" : "-") + "50%", dy: "3200%" }));
  const twinkles = (n, ymax, s0, y0) => Array.from({ length: n }, (_, i) => ({ p: "littlestar", x: 30 + (i * 137) % 580, y: (y0 || 40) + (i * 71) % (ymax || 300), s: (s0 || 0.35) + (i % 3) * 0.12, a: "twinkle", d: 2.2 + (i % 4) * 0.7, delay: (i * 0.6) % 3 }));
  const cloud = (x, y, s, d, delay, dx) => ({ p: "cloud", x, y, s, a: "drift", d, delay, dx: dx || "420%" });

  window.GAME.art = makeKidArt({
    defs: window.PAINT_DEFS, filterDef: window.PAINT_FILTER,
    motion: {
      minato: "breathe", sazuki: "breathe", sayo: "bob", grandpa: "breathe", rojin: "sway", kokujin: "float", mio: "breathe", rasetsu: "breathe",
      shikigen: "float", tenmei: "float", yukino: "float", jotei: "breathe", soma: "breathe", gtsuki: "float", girl: "bob", oldman: "breathe",
      hisui: "sway", sakura: "sway", lantern: "sway", petal: "float", mirror: "float", moon: "float"
    },
    ambient: {
      house: [cloud(200, 40, 0.5, 80, 0)], study: [], school: [...petals(5, 12), cloud(120, 50, 0.7, 90, 0)],
      cherry: petals(10, 9), village: [cloud(200, 60, 0.7, 90, 0)], hermitage: [...petals(3, 14), cloud(400, 50, 0.6, 100, 4)],
      shrine: twinkles(4, 100, 0.25, 60), sato: [cloud(160, 70, 0.8, 80, 0)], mirror: twinkles(6, 150, 0.25, 70), library: twinkles(3, 120, 0.2, 60),
      canyon: [...petals(4, 12), cloud(300, 60, 0.8, 90, 0)], origin: petals(14, 8), spring: petals(14, 10), night: twinkles(10, 200)
    },
    stage: {
      frameImage: makeFrame({ corner: "jade", edge: "sakura", c1: "#efe8d8", c2: "#f8f2e4", c3: "#e4eadc", gold: "#6a8a78" }),
      wallpaper: makeWallpaper("sakura"),
      frame: [
        { type: "peek", p: "rojin", css: "left:8%;top:-50px;width:42px;height:50px", d: 15, delay: 0 },
        { type: "peek", p: "sayo", css: "right:14%;top:-48px;width:40px;height:48px", d: 19, delay: 6 },
        { p: "hisui", css: "left:47%;top:-38px;width:26px", a: "sway", d: 3.4, z: "front" },
        { type: "orbit", p: "petal", css: "right:-6px;top:-6px", r: 34, d: 9, w: 18 },
        { type: "orbit", p: "petal", css: "left:-6px;bottom:-6px", r: 30, d: 12, w: 16, delay: 2 },
        { p: "lantern", css: "left:-12px;top:-14px;width:24px", a: "sway", d: 2.8, z: "front" },
        { p: "moon", css: "right:6%;bottom:-24px;width:34px", a: "sway", d: 4, z: "front" }
      ],
      page: [
        { p: "petal", css: "left:10%;top:-3%;width:12px", a: "fall", d: 14, delay: 0, dx: "120%", dy: "5200%" },
        { p: "petal", css: "left:40%;top:-3%;width:10px", a: "fall", d: 17, delay: 5, dx: "-100%", dy: "5600%" },
        { p: "petal", css: "left:70%;top:-3%;width:12px", a: "fall", d: 15, delay: 9, dx: "80%", dy: "5400%" },
        { p: "littlestar", css: "left:90%;top:62%;width:14px", a: "twinkle", d: 3.6, delay: 1.7 }
      ]
    },
    cover: { bg: "cherry", deco: [["minato", 240, 450, 1.1], ["sayo", 400, 450, 1.1], ["hisui", 320, 330, 0.8]] }
  });
})();
