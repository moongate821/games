/* 絵(子ども描き風 art_kids.js)を、エンジンにつなぐ。動き・背景の動き・額縁・表紙。 */
(function () {
  "use strict";
  const twinkles = (n, ymax, s0, y0) => Array.from({ length: n }, (_, i) => ({ p: "littlestar", x: 30 + (i * 137) % 580, y: (y0 || 40) + (i * 71) % (ymax || 300), s: (s0 || 0.35) + (i % 3) * 0.12, a: "twinkle", d: 2.2 + (i % 4) * 0.7, delay: (i * 0.6) % 3 }));
  const cloud = (x, y, s, d, delay, dx) => ({ p: "cloud", x, y, s, a: "drift", d, delay, dx: dx || "420%" });
  const rain = (n) => Array.from({ length: n }, (_, i) => ({ p: "raindrop", x: 20 + (i * 71) % 600, y: -20, s: 0.6 + (i % 3) * 0.2, a: "fall", d: 2.4 + (i % 4) * 0.5, delay: i * 0.37, dx: "-20%", dy: "3600%" }));
  const flies = (n) => Array.from({ length: n }, (_, i) => ({ p: "firefly", x: 40 + (i * 113) % 560, y: 260 + (i * 47) % 160, s: 0.6 + (i % 3) * 0.2, a: "twinkle", d: 2 + (i % 4) * 0.6, delay: (i * 0.5) % 3 }));

  window.GAME.art = makeKidArt({
    motion: {
      mimi: "bob", mimi_fixed: "bob", hana: "bob", hana_cry: "breathe", tetsu: "bob", chichi: "hop", tsugi: "breathe",
      dog: "breathe", cat: "sway", crow: "bob", kid: "bob", snail: "sway", umbrella: "sway", firefly: "float", moon: "float", poster: "sway"
    },
    ambient: {
      closet: [], room: rain(10), hanaroom: [], entrance: [], rain: rain(24), garbage: [cloud(100, 60, 0.9, 90, 0), { p: "crow", x: 10, y: 80, s: 0.5, a: "cross", d: 26, delay: 4, dx: "1900%", flap: 1 }],
      shop: twinkles(3, 60, 0.25, 40), roof: [cloud(100, 70, 0.9, 90, 0), { p: "chichi", x: 10, y: 120, s: 0.4, a: "cross", d: 30, delay: 8, dx: "1900%", flap: 1 }],
      alley: twinkles(8, 140), crossing: twinkles(12, 240), river: [...twinkles(8, 200), ...flies(8)],
      newtown: [cloud(100, 60, 1.0, 80, 0, "520%"), cloud(420, 110, 0.8, 100, 18)], school: [cloud(140, 70, 0.9, 90, 0)], house: [cloud(120, 70, 0.9, 90, 0)]
    },
    stage: {
      frameImage: makeFrame({ corner: "rose", edge: "daisy", c1: "#ffe0e8", c2: "#fff4e0", c3: "#e0ecf8", gold: "#c89a6a" }),
      wallpaper: makeWallpaper("alice"),
      frame: [
        { type: "peek", p: "tetsu", css: "left:8%;top:-52px;width:36px;height:52px", d: 15, delay: 0 },
        { type: "peek", p: "chichi", css: "right:14%;top:-40px;width:50px;height:40px", d: 17, delay: 6 },
        { p: "ribbon", css: "left:47%;top:-36px;width:30px", a: "sway", d: 3.4, z: "front" },
        { type: "orbit", p: "littlestar", css: "right:-6px;top:-6px", r: 36, d: 9, w: 22 },
        { type: "orbit", p: "littlestar", css: "left:-6px;bottom:-6px", r: 30, d: 12, w: 18, delay: 2 },
        { p: "raindrop", css: "right:-20px;top:20%;width:14px", a: "twinkle", d: 2.4, z: "front" },
        { p: "snail", css: "left:4%;bottom:-20px;width:40px", a: "crawl", d: 60, dx: "320%", z: "front" },
        { p: "umbrella", css: "right:8%;bottom:-30px;width:34px", a: "sway", d: 4, z: "front" }
      ],
      page: [
        { p: "cloud", css: "left:2%;top:1.5%;width:90px;opacity:.8", a: "drift", d: 90, dx: "380%" },
        { p: "chichi", css: "left:0;top:4%;width:30px", a: "cross", d: 30, delay: 8, dx: "2100%", flap: 1 },
        { p: "littlestar", css: "left:10%;top:30%;width:16px", a: "twinkle", d: 3, delay: 0.5 },
        { p: "littlestar", css: "left:90%;top:62%;width:16px", a: "twinkle", d: 3.6, delay: 1.7 },
        { p: "raindrop", css: "left:20%;top:-3%;width:10px", a: "fall", d: 6, delay: 2, dx: "-20%", dy: "6000%" },
        { p: "raindrop", css: "left:70%;top:-3%;width:10px", a: "fall", d: 7, delay: 5, dx: "-20%", dy: "6000%" },
        { p: "tetsu", css: "left:3%;bottom:1%;width:28px", a: "crawl", d: 50, delay: 0, dx: "1600%" }
      ]
    },
    cover: { bg: "rain", deco: [["umbrella", 330, 360, 1.6], ["mimi", 310, 440, 1.0], ["tetsu", 400, 440, 0.9], ["chichi", 480, 220, 1.0]] }
  });
})();
