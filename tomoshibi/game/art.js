/* 絵(子ども描き風 art_kids.js)を、エンジンにつなぐ。動き・背景の動き・額縁・表紙。 */
(function () {
  "use strict";
  const twinkles = (n, ymax, s0, y0) => Array.from({ length: n }, (_, i) => ({ p: "littlestar", x: 30 + (i * 137) % 580, y: (y0 || 40) + (i * 71) % (ymax || 300), s: (s0 || 0.35) + (i % 3) * 0.12, a: "twinkle", d: 2.2 + (i % 4) * 0.7, delay: (i * 0.6) % 3 }));
  const cloud = (x, y, s, d, delay, dx) => ({ p: "cloud", x, y, s, a: "drift", d, delay, dx: dx || "420%" });
  const gull = (y, d, delay, s) => ({ p: "gull", x: 10, y, s: s || 0.4, a: "cross", d, delay, dx: "1900%", flap: 1 });
  const fish = (x, y, d, delay) => ({ p: "fish", x, y, s: 0.8, a: "jump", d, delay });
  const bubbles = (n) => Array.from({ length: n }, (_, i) => ({ p: "bubble", x: 60 + (i * 97) % 520, y: 470, s: 0.6 + (i % 3) * 0.3, a: "rise", d: 7 + (i % 4) * 2, delay: i * 1.3, dx: (i % 2 ? "" : "-") + "30%", dy: "-1700%" }));
  const fogs = (n) => Array.from({ length: n }, (_, i) => cloud(40 + (i * 150) % 560, 120 + (i * 70) % 220, 1.4 + (i % 2) * 0.4, 60 + i * 15, i * 6, "300%"));

  window.GAME.art = makeKidArt({
    motion: {
      tomoshibi: "breathe", lantern: "float", seiji: "breathe", nagi: "bob", crab: "sway", gull: "bob", cat: "breathe",
      oilman: "bob", fishkid: "hop", nurse: "bob", sailor: "sway", jelly: "float", seal: "breathe", keeper_light: "breathe",
      bottle: "float", ship: "float", bell: "sway", beam: "breathe", seiji_bed: "breathe"
    },
    ambient: {
      lamproom: twinkles(10, 300, 0.3, 80), storm: [{ p: "wave", x: 80, y: 400, s: 1.4, a: "sway", d: 3 }, { p: "wave", x: 420, y: 380, s: 1.2, a: "sway", d: 3.6, delay: 1 }],
      stairs: [], room: twinkles(3, 60, 0.25, 100),
      shore: [cloud(100, 60, 0.9, 90, 0), gull(120, 30, 3), { p: "wave", x: 300, y: 330, s: 1.2, a: "sway", d: 3.4 }],
      cliff: [gull(120, 26, 2, 0.5), gull(180, 34, 9), cloud(120, 80, 1.0, 90, 0)],
      harbor: [cloud(120, 70, 1.0, 80, 0, "520%"), gull(100, 28, 4), fish(200, 350, 7, 1)],
      market: [gull(90, 30, 3)], oilshop: [],
      pier: [...twinkles(12, 260), { p: "fish", x: 480, y: 360, s: 0.6, a: "jump", d: 9, delay: 2 }],
      slope: twinkles(8, 180), fog: [...fogs(5), gull(160, 40, 8, 0.35)],
      seabed: [...bubbles(6), { p: "jelly", x: 120, y: 260, s: 0.6, a: "float", d: 6 }, fish(300, 300, 8, 1)],
      seals: [cloud(100, 70, 0.9, 90, 0), gull(120, 30, 2), fish(520, 320, 7, 3)],
      capes: twinkles(12, 260), hospital: twinkles(8, 180), sickroom: twinkles(4, 100, 0.25, 90),
      dawn: [gull(140, 30, 2), gull(180, 36, 10), ...twinkles(3, 60)]
    },
    stage: {
      frameImage: makeFrame({ corner: "star", edge: "rail", c1: "#d8e8f8", c2: "#fff2d8", c3: "#d8f0e8", gold: "#a88a5a" }),
      wallpaper: makeWallpaper("star"),
      frame: [
        { type: "peek", p: "crab", css: "left:8%;top:-40px;width:56px;height:40px", d: 15, delay: 0 },
        { type: "peek", p: "cat", css: "right:14%;top:-46px;width:50px;height:46px", d: 17, delay: 6 },
        { p: "lantern", css: "left:47%;top:-50px;width:26px", a: "sway", d: 3.4, z: "front" },
        { type: "orbit", p: "littlestar", css: "right:-6px;top:-6px", r: 36, d: 9, w: 22 },
        { type: "orbit", p: "littlestar", css: "left:-6px;bottom:-6px", r: 30, d: 12, w: 18, delay: 2 },
        { p: "gull", css: "right:-30px;top:20%;width:36px", a: "zig", d: 9, flap: 1, z: "front" },
        { p: "littlestar", css: "left:-14px;top:-14px;width:24px", a: "twinkle", d: 2.6, z: "front" },
        { p: "bottle", css: "left:4%;bottom:-24px;width:40px", a: "crawl", d: 40, dx: "320%", z: "front" },
        { p: "seal", css: "right:8%;bottom:-24px;width:46px", a: "sway", d: 4, z: "front" }
      ],
      page: [
        { p: "cloud", css: "left:2%;top:1.5%;width:90px;opacity:.8", a: "drift", d: 90, dx: "380%" },
        { p: "gull", css: "left:0;top:4%;width:30px", a: "cross", d: 30, delay: 8, dx: "2100%", flap: 1 },
        { p: "littlestar", css: "left:10%;top:30%;width:16px", a: "twinkle", d: 3, delay: 0.5 },
        { p: "littlestar", css: "left:90%;top:62%;width:16px", a: "twinkle", d: 3.6, delay: 1.7 },
        { p: "letter", css: "left:20%;top:-3%;width:18px", a: "fall", d: 18, delay: 2, dx: "120%", dy: "5200%" },
        { p: "bubble", css: "left:80%;bottom:0;width:12px", a: "rise", d: 14, delay: 5, dx: "-40%", dy: "-3000%" },
        { p: "crab", css: "left:3%;bottom:1%;width:40px", a: "crawl", d: 46, delay: 0, dx: "1100%" }
      ]
    },
    cover: { bg: "pier", deco: [["lantern", 330, 300, 1.4], ["nagi", 180, 400, 0.9], ["gull", 480, 200, 1.0], ["bottle", 470, 420, 1.0]] }
  });
})();
