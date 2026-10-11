/* 絵(水彩 art_kids.js)を、エンジンにつなぐ。動き・背景の動き・額縁・表紙。水彩のにじみの定義(PAINT_DEFS)も、ここでわたす。 */
(function () {
  "use strict";
  const twinkles = (n, ymax, s0, y0) => Array.from({ length: n }, (_, i) => ({ p: "littlestar", x: 30 + (i * 137) % 580, y: (y0 || 40) + (i * 71) % (ymax || 300), s: (s0 || 0.35) + (i % 3) * 0.12, a: "twinkle", d: 2.2 + (i % 4) * 0.7, delay: (i * 0.6) % 3 }));
  const snow = (n, d0) => Array.from({ length: n }, (_, i) => ({ p: "snowflake", x: 20 + (i * 71) % 600, y: -20, s: 0.3 + (i % 3) * 0.12, a: "fall", d: (d0 || 9) + (i % 4) * 2, delay: i * 0.9, dx: (i % 2 ? "" : "-") + "40%", dy: "3600%" }));
  const cloud = (x, y, s, d, delay, dx) => ({ p: "cloud", x, y, s, a: "drift", d, delay, dx: dx || "420%" });
  const meteor = (x, y, delay) => ({ p: "meteor", x, y, s: 0.8, a: "cross", d: 6, delay, dx: "2800%", dy: "900%" });

  window.GAME.art = makeKidArt({
    defs: window.PAINT_DEFS, filterDef: window.PAINT_FILTER,
    motion: {
      yuzuki: "bob", mashiro: "breathe", yui: "float", aira: "bob", regulus: "breathe", asteru: "breathe", eve: "float", oldman: "sway", guardian: "breathe",
      shadow: "float", girl: "bob", mother: "breathe", trader: "breathe", lantern: "sway", flower: "sway", tree: "sway", starship: "float", ring: "float", star: "float", compass: "sway"
    },
    ambient: {
      hill: [...twinkles(6, 100, 0.3), meteor(20, 40, 3), cloud(200, 60, 0.8, 90, 0)], village: [...twinkles(10, 200), meteor(10, 40, 2)],
      library: [], rain: snow(0), town: [cloud(160, 50, 0.7, 90, 0), cloud(440, 60, 0.6, 110, 20)], ruins: twinkles(3, 80, 0.2, 60),
      mountain: snow(16, 7), obs: twinkles(4, 100, 0.25, 70), tower: [...twinkles(14, 280), meteor(30, 30, 4)], white: twinkles(10, 340, 0.3),
      tree: [...twinkles(14, 300), meteor(20, 30, 2)], spring: [cloud(140, 60, 0.8, 90, 0)], starsea: [...twinkles(18, 440, 0.25), meteor(10, 30, 3)],
      ring: twinkles(10, 300, 0.25), evehill: twinkles(4, 100, 0.25, 50), night: [...twinkles(14, 300), meteor(20, 30, 3)]
    },
    stage: {
      frameImage: makeFrame({ corner: "star", edge: "wave", c1: "#e8f0ff", c2: "#f8f8ff", c3: "#e4eef8", gold: "#6a8ac0" }),
      wallpaper: makeWallpaper("star"),
      frame: [
        { type: "peek", p: "yuzuki", css: "left:8%;top:-48px;width:40px;height:48px", d: 15, delay: 0 },
        { type: "peek", p: "yui", css: "right:14%;top:-46px;width:40px;height:46px", d: 19, delay: 6 },
        { p: "flower", css: "left:47%;top:-36px;width:22px", a: "sway", d: 3.4, z: "front" },
        { type: "orbit", p: "littlestar", css: "right:-6px;top:-6px", r: 34, d: 9, w: 18 },
        { type: "orbit", p: "snowflake", css: "left:-6px;bottom:-6px", r: 30, d: 12, w: 16, delay: 2 },
        { p: "compass", css: "left:-12px;top:-14px;width:26px", a: "sway", d: 2.8, z: "front" },
        { p: "diary", css: "right:6%;bottom:-20px;width:30px", a: "sway", d: 4, z: "front" }
      ],
      page: [
        { p: "littlestar", css: "left:10%;top:30%;width:14px", a: "twinkle", d: 3, delay: 0.5 },
        { p: "littlestar", css: "left:90%;top:62%;width:14px", a: "twinkle", d: 3.6, delay: 1.7 },
        { p: "meteor", css: "left:20%;top:-3%;width:30px", a: "fall", d: 16, delay: 3, dx: "600%", dy: "2400%" },
        { p: "snowflake", css: "left:60%;top:-3%;width:12px", a: "fall", d: 17, delay: 9, dx: "-100%", dy: "5400%" }
      ]
    },
    cover: { bg: "tree", deco: [["yuzuki", 240, 450, 1.0], ["mashiro", 340, 450, 1.0], ["yui", 440, 450, 0.95], ["star", 320, 110, 1.0]] }
  });
})();
