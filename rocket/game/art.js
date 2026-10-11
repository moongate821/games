/* 絵(段ボール工作ふう art_kids.js)を、エンジンにつなぐ。動き・背景の動き・額縁・表紙。段ボールの影と波もよう(CRAFT_DEFS)も、ここでわたす。 */
(function () {
  "use strict";
  const twinkles = (n, ymax, s0, y0) => Array.from({ length: n }, (_, i) => ({ p: "littlestar", x: 30 + (i * 137) % 580, y: (y0 || 40) + (i * 71) % (ymax || 300), s: (s0 || 0.35) + (i % 3) * 0.12, a: "twinkle", d: 2.2 + (i % 4) * 0.7, delay: (i * 0.6) % 3 }));
  const cloud = (x, y, s, d, delay, dx) => ({ p: "cloud", x, y, s, a: "drift", d, delay, dx: dx || "420%" });
  const fly = (x, y, d, delay) => ({ p: "firefly", x, y, s: 0.6, a: "float", d, delay });

  window.GAME.art = makeKidArt({
    defs: window.CRAFT_DEFS, filterDef: window.CRAFT_FILTER,
    motion: {
      haru: "bob", danbot: "hop", mom: "breathe", grandpa: "breathe", luna: "hop", sate: "float", astronaut: "float", kome: "float",
      gummy: "bob", goose: "bob", rocket: "breathe", plane: "float", station: "float", junk: "float", paperplane: "float", firefly: "float", note: "float", cloud: "float"
    },
    ambient: {
      yard: [cloud(140, 60, 0.7, 90, 0), { p: "paperplane", x: 20, y: 80, s: 0.6, a: "cross", d: 18, delay: 3, dx: "2400%", dy: "300%" }],
      kitchen: [], attic: twinkles(3, 60, 0.25, 60),
      hill: [...twinkles(6, 100, 0.3), fly(120, 380, 4, 0), fly(260, 410, 5, 1), fly(520, 390, 4.5, 2), { p: "littlestar", x: 20, y: 40, s: 0.4, a: "cross", d: 5, delay: 2, dx: "2600%", dy: "600%" }],
      launch: [...twinkles(10, 260), { p: "littlestar", x: 20, y: 30, s: 0.4, a: "cross", d: 6, delay: 4, dx: "2600%", dy: "500%" }],
      sky: [cloud(100, 150, 0.8, 70, 0), cloud(400, 220, 0.6, 90, 10)],
      space: [...twinkles(14, 420), { p: "junk", x: 600, y: 60, s: 0.4, a: "cross", d: 40, delay: 5, dx: "-3000%", dy: "800%" }],
      station: twinkles(4, 120, 0.25, 70), candy: [...twinkles(6, 160), cloud(300, 80, 0.6, 80, 0)],
      moon: twinkles(12, 220), lunahouse: twinkles(3, 80, 0.25, 60), room: twinkles(4, 160, 0.25, 70)
    },
    stage: {
      frameImage: makeFrame({ corner: "rocket", edge: "tape", c1: "#f2e2c8", c2: "#fbf2e2", c3: "#e8dcc4", gold: "#a8784a" }),
      wallpaper: makeWallpaper("rocket"),
      frame: [
        { type: "peek", p: "danbot", css: "left:8%;top:-44px;width:40px;height:44px", d: 13, delay: 0 },
        { type: "peek", p: "luna", css: "right:16%;top:-44px;width:34px;height:44px", d: 17, delay: 6 },
        { p: "moon", css: "left:47%;top:-36px;width:30px", a: "sway", d: 4, z: "front" },
        { type: "orbit", p: "littlestar", css: "right:-6px;top:-6px", r: 34, d: 9, w: 18 },
        { type: "orbit", p: "paperplane", css: "left:-6px;bottom:-6px", r: 30, d: 12, w: 24, delay: 2 },
        { p: "rocket", css: "left:-14px;top:-20px;width:22px", a: "sway", d: 2.6, z: "front" },
        { p: "starbit", css: "right:6%;bottom:-18px;width:26px", a: "sway", d: 3.4, z: "front" },
        { p: "earth", css: "left:5%;bottom:-18px;width:26px", a: "sway", d: 5, z: "front" }
      ],
      page: [
        { p: "paperplane", css: "left:3%;top:20%;width:30px", a: "crawl", d: 40, delay: 0, dx: "1200%" },
        { p: "littlestar", css: "left:10%;top:30%;width:16px", a: "twinkle", d: 3, delay: 0.5 },
        { p: "littlestar", css: "left:90%;top:62%;width:16px", a: "twinkle", d: 3.6, delay: 1.7 },
        { p: "heart", css: "left:86%;top:12%;width:14px", a: "twinkle", d: 4, delay: 1 }
      ]
    },
    cover: { bg: "launch", deco: [["rocket", 460, 460, 1.5], ["haru", 280, 450, 1.1], ["danbot", 170, 450, 1.0], ["moon", 560, 100, 0.8]] }
  });
})();
