/* 絵(子ども描き風 art_kids.js)を、エンジンにつなぐ。動き・背景の動き・額縁・表紙。 */
(function () {
  "use strict";
  const twinkles = (n, ymax, s0, y0) => Array.from({ length: n }, (_, i) => ({ p: "littlestar", x: 30 + (i * 137) % 580, y: (y0 || 40) + (i * 71) % (ymax || 300), s: (s0 || 0.35) + (i % 3) * 0.12, a: "twinkle", d: 2.2 + (i % 4) * 0.7, delay: (i * 0.6) % 3 }));
  const shoot = (delay, y) => ({ p: "littlestar", x: 20, y: y || 60, s: 0.45, a: "cross", d: 8, delay, dx: "2600%", dy: "700%" });
  const birds = (n) => Array.from({ length: n }, (_, i) => ({ p: "bird", x: 60 + (i * 113) % 520, y: -20, s: 0.5 + (i % 3) * 0.12, a: "fall", d: 10 + (i % 3) * 3, delay: i * 1.7, dx: "40%", dy: "2400%" }));
  const lanterns = (n) => Array.from({ length: n }, (_, i) => ({ p: "karasuuri", x: 40 + (i * 97) % 560, y: 470, s: 0.35 + (i % 3) * 0.08, a: "rise", d: 12 + (i % 4) * 2, delay: i * 2.2, dx: "30%", dy: "-2200%" }));
  const night = (n, ymax) => [...twinkles(n, ymax), shoot(5)];

  window.GAME.art = makeKidArt({
    motion: {
      giovanni: "bob", campanella: "breathe", zanelli: "bob", mother: "breathe", birdcatcher: "bob", conductor: "bob",
      youth: "breathe", girl: "bob", boy: "hop", keeper: "breathe", scholar: "bob", doctor: "breathe",
      karasuuri: "sway", gems: "float", sasori: "breathe", rindou: "sway", triangle: "float", cross: "breathe", bird: "float", gan: "float", milk: "bob", ticket: "float"
    },
    ambient: {
      classroom: [], print: [], home: twinkles(3, 60, 0.25, 100),
      dairy: night(10, 260), street: [...twinkles(6, 160), ...lanterns(4)], bridge: [...night(10, 220), ...lanterns(3)],
      hill: [...night(14, 300), shoot(12, 120)], train: twinkles(6, 150, 0.3, 90),
      galaxy: [...twinkles(14, 400), shoot(3), shoot(9, 200)], swan: night(10, 260), pliocene: night(8, 220),
      observatory: night(12, 380), southern: [...twinkles(12, 380), shoot(6)], cross: night(10, 300), coalsack: twinkles(12, 420),
      dawn: twinkles(4, 140), river: [...night(8, 220), ...lanterns(3)], road: night(10, 260)
    },
    stage: {
      frameImage: makeFrame({ corner: "moon", edge: "rail", c1: "#d8dcff", c2: "#eef0ff", c3: "#d0e4f8", gold: "#8a8ac0" }),
      wallpaper: makeWallpaper("night"),
      frame: [
        { type: "peek", p: "campanella", css: "left:8%;top:-52px;width:44px;height:52px", d: 15, delay: 0 },
        { type: "peek", p: "bird", css: "right:14%;top:-40px;width:56px;height:40px", d: 17, delay: 6 },
        { p: "karasuuri", css: "left:47%;top:-50px;width:26px", a: "sway", d: 3.4, z: "front" },
        { type: "orbit", p: "littlestar", css: "right:-6px;top:-6px", r: 36, d: 9, w: 22 },
        { type: "orbit", p: "littlestar", css: "left:-6px;bottom:-6px", r: 30, d: 12, w: 18, delay: 2 },
        { p: "littlestar", css: "left:-14px;top:-14px;width:24px", a: "twinkle", d: 2.6, z: "front" },
        { p: "littlestar", css: "right:-14px;bottom:-14px;width:24px", a: "twinkle", d: 3.1, delay: 1, z: "front" },
        { p: "sasori", css: "left:-16px;bottom:34%;width:22px", a: "twinkle", d: 2.2, delay: 0.6, z: "front" },
        { p: "locomotive", css: "left:4%;bottom:-30px;width:70px", a: "crawl", d: 36, dx: "320%", z: "front" },
        { p: "rindou", css: "right:10%;bottom:-30px;width:22px", a: "sway", d: 3.2, z: "front" }
      ],
      page: [
        { p: "littlestar", css: "left:10%;top:30%;width:16px", a: "twinkle", d: 3, delay: 0.5 },
        { p: "littlestar", css: "left:90%;top:62%;width:16px", a: "twinkle", d: 3.6, delay: 1.7 },
        { p: "littlestar", css: "left:55%;top:8%;width:12px", a: "twinkle", d: 2.8, delay: 1 },
        { p: "littlestar", css: "left:0;top:6%;width:16px", a: "cross", d: 14, delay: 4, dx: "2400%", dy: "300%" },
        { p: "bird", css: "left:0;top:4%;width:30px", a: "cross", d: 30, delay: 8, dx: "2100%", flap: 1 },
        { p: "karasuuri", css: "left:20%;bottom:0;width:14px", a: "rise", d: 22, delay: 3, dx: "40%", dy: "-3000%" },
        { p: "karasuuri", css: "left:78%;bottom:0;width:12px", a: "rise", d: 26, delay: 11, dx: "-40%", dy: "-3000%" },
        { p: "locomotive", css: "left:3%;bottom:1%;width:60px", a: "crawl", d: 50, delay: 0, dx: "900%" }
      ]
    },
    cover: { bg: "hill", deco: [["pillar", 470, 380, 1.0], ["giovanni", 260, 420, 1.0], ["campanella", 360, 420, 0.95], ["locomotive", 140, 180, 0.8], ["sasori", 560, 140, 0.5]] }
  });
})();
