/* 絵(子ども描き風 art_kids.js)を、エンジンにつなぐ。動き・背景の動き・額縁・表紙。 */
(function () {
  "use strict";
  const twinkles = (n, ymax, s0) => Array.from({ length: n }, (_, i) => ({ p: "littlestar", x: 30 + (i * 137) % 580, y: 40 + (i * 71) % (ymax || 300), s: (s0 || 0.35) + (i % 3) * 0.12, a: "twinkle", d: 2.2 + (i % 4) * 0.7, delay: (i * 0.6) % 3 }));
  const cloud = (x, y, s, d, delay, dx) => ({ p: "cloud", x, y, s, a: "drift", d, delay, dx: dx || "420%" });
  const petals = (n, d0) => Array.from({ length: n }, (_, i) => ({ p: "petal", x: 40 + (i * 83) % 560, y: -20, s: 0.7 + (i % 3) * 0.2, a: "fall", d: d0 + (i % 4) * 3, delay: i * 2.1, dx: (i % 2 ? "" : "-") + (60 + (i % 3) * 30) + "%", dy: "2600%" }));
  const fly = (y, d, delay) => ({ p: "dragonfly", x: 20, y, s: 0.8, a: "cross", d, delay, dx: "1700%", flap: 1 });
  const fish = (x, y, d, delay) => ({ p: "fish", x, y, s: 0.8, a: "jump", d, delay });
  const ash = (n) => Array.from({ length: n }, (_, i) => ({ p: "cloud", x: 40 + (i * 97) % 560, y: -10, s: 0.12 + (i % 3) * 0.05, a: "fall", d: 14 + (i % 4) * 3, delay: i * 1.9, dx: "40%", dy: "3600%" }));
  const sky = [cloud(120, 80, 1.0, 80, 0, "520%"), cloud(430, 130, 0.8, 100, 20)];

  window.GAME.art = makeKidArt({
    motion: {
      momotaro: "bob", grandma: "breathe", grandpa: "breathe", elder: "breathe", chaya: "bob", fisher: "bob", tengu: "float",
      dog: "hop", monkey: "sway", pheasant: "bob", oni_red: "breathe", oni_blue: "bob", oni_child: "hop",
      peach: "float", kibi: "sway", sprout: "sway", lantern: "sway", hata: "sway", boat: "float", drum: "breathe"
    },
    ambient: {
      river: [...sky, ...petals(5, 15), fish(380, 420, 7, 1), fly(250, 26, 4)],
      house: [{ p: "littlestar", x: 320, y: 170, s: 0.4, a: "twinkle", d: 3, delay: 0 }],
      village: [...sky, ...petals(4, 16), fly(260, 24, 0), fly(200, 32, 10)],
      road: [...sky, fly(240, 26, 2), ...petals(2, 17)],
      forest: [{ p: "petal", x: 100, y: -20, s: 0.7, a: "fall", d: 18, delay: 0, dx: "60%", dy: "2600%" }, fly(300, 30, 3)],
      pass: [...sky, ...petals(3, 16)],
      bridge: [cloud(100, 70, 0.9, 90, 0), fly(200, 24, 1), fish(320, 430, 8, 2)],
      port: [...sky, fish(160, 330, 7, 1), fish(470, 340, 9, 4)],
      sea: [cloud(100, 80, 1.0, 80, 0, "520%"), cloud(420, 120, 0.8, 100, 15), fish(130, 380, 6, 0.5), fish(500, 420, 8, 3)],
      storm: [{ p: "bolt", x: 140, y: 200, s: 0.6, a: "twinkle", d: 4, delay: 1 }, { p: "bolt", x: 520, y: 160, s: 0.5, a: "twinkle", d: 5.5, delay: 3 }],
      beach: [cloud(120, 70, 0.8, 90, 0), fish(200, 330, 8, 2)],
      field: ash(8), oni_gate: ash(6), cave: twinkles(6, 400, 0.25), hall: twinkles(3, 120, 0.25),
      festival: [...petals(6, 14), ...sky], night: twinkles(10, 260)
    },
    stage: {
      frameImage: makeFrame({ corner: "peach", edge: "sakura", c1: "#ffe0e6", c2: "#fff2d8", c3: "#e0f0d0" }),
      wallpaper: makeWallpaper("peach"),
      frame: [
        { type: "peek", p: "dog", css: "left:8%;top:-46px;width:62px;height:46px", d: 13, delay: 0 },
        { type: "peek", p: "monkey", css: "right:14%;top:-50px;width:50px;height:50px", d: 17, delay: 6 },
        { p: "peach", css: "left:47%;top:-44px;width:34px", a: "sway", d: 3.4, z: "front" },
        { type: "orbit", p: "petal", css: "right:-6px;top:-6px", r: 36, d: 9, w: 18 },
        { type: "orbit", p: "petal", css: "left:-6px;bottom:-6px", r: 30, d: 12, w: 16, delay: 2 },
        { p: "pheasant", css: "right:-30px;top:20%;width:36px", a: "zig", d: 9, z: "front" },
        { p: "dragonfly", css: "left:-24px;top:40%;width:26px", a: "zig", d: 7, flap: 1, z: "front" },
        { p: "kibi", css: "left:6%;bottom:-36px;width:18px", a: "sway", d: 3.2, z: "front" },
        { p: "oni_child", css: "right:8%;bottom:-30px;width:34px", a: "crawl", d: 46, dx: "-260%", delay: 6, z: "front" }
      ],
      page: [
        { p: "cloud", css: "left:2%;top:1.5%;width:90px;opacity:.8", a: "drift", d: 90, dx: "380%" },
        { p: "dragonfly", css: "left:0;top:5%;width:30px", a: "cross", d: 28, delay: 6, dx: "2100%", flap: 1 },
        { p: "petal", css: "left:14%;top:-3%;width:14px", a: "fall", d: 15, delay: 1, dx: "120%", dy: "5200%" },
        { p: "petal", css: "left:60%;top:-3%;width:12px", a: "fall", d: 18, delay: 7, dx: "-140%", dy: "5600%" },
        { p: "petal", css: "left:82%;top:-3%;width:13px", a: "fall", d: 20, delay: 12, dx: "-100%", dy: "5200%" },
        { p: "lantern", css: "left:92%;top:30%;width:22px", a: "sway", d: 4 },
        { p: "dog", css: "left:3%;bottom:1%;width:50px", a: "crawl", d: 46, delay: 0, dx: "1000%" }
      ]
    },
    cover: { bg: "village", deco: [["peach", 330, 300, 1.0], ["momotaro", 330, 440, 1.1], ["dog", 190, 450, 0.8], ["monkey", 470, 450, 0.7], ["pheasant", 520, 200, 0.8]] }
  });
})();
