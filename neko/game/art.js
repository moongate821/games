/* 絵(切り絵ふう art_kids.js)を、エンジンにつなぐ。動き・背景の動き・額縁・表紙。紙の影の定義(CRAFT_DEFS)も、ここでわたす。 */
(function () {
  "use strict";
  const twinkles = (n, ymax, s0, y0) => Array.from({ length: n }, (_, i) => ({ p: "littlestar", x: 30 + (i * 137) % 580, y: (y0 || 40) + (i * 71) % (ymax || 300), s: (s0 || 0.35) + (i % 3) * 0.12, a: "twinkle", d: 2.2 + (i % 4) * 0.7, delay: (i * 0.6) % 3 }));
  const cloud = (x, y, s, d, delay, dx) => ({ p: "cloud", x, y, s, a: "drift", d, delay, dx: dx || "420%" });
  const steam = (x, y, delay) => ({ p: "steam", x, y, s: 0.5, a: "rise", d: 5, delay: delay || 0, dx: "20%", dy: "-300%" });

  window.GAME.art = makeKidArt({
    defs: window.CRAFT_DEFS, filterDef: window.CRAFT_FILTER,
    motion: {
      komugi: "bob", chuta: "hop", nana: "breathe", tora: "breathe", kokko: "bob", chick: "hop", crab: "sway", tanuki: "breathe",
      mermaid: "sway", bobo: "breathe", fuwari: "float", pipo: "bob", cow: "breathe", ufo: "float", lantern: "sway", flower: "sway", herb: "sway", note: "float"
    },
    ambient: {
      shop: [cloud(300, 40, 0.6, 80, 0)], kitchen: [steam(180, 250), steam(250, 240, 2)],
      street: [cloud(100, 50, 0.8, 90, 0), cloud(400, 30, 0.6, 110, 20)], fishshop: [cloud(500, 40, 0.6, 90, 3)],
      farm: [cloud(200, 60, 0.8, 90, 0), { p: "chick", x: 40, y: 430, s: 0.6, a: "cross", d: 30, delay: 2, dx: "4000%" }],
      sea: [cloud(260, 60, 0.8, 100, 0), { p: "fish", x: 400, y: 420, s: 0.8, a: "jump", d: 8, delay: 2 }],
      forest: twinkles(4, 120, 0.3), evening: twinkles(4, 90, 0.25, 80), party: twinkles(6, 90, 0.25, 80),
      roof: [...twinkles(12, 260), { p: "littlestar", x: 20, y: 40, s: 0.4, a: "cross", d: 7, delay: 4, dx: "2600%", dy: "700%" }],
      sky: twinkles(14, 400), volcano: [{ p: "cloud", x: 320, y: 120, s: 0.5, a: "rise", d: 8, delay: 0, dx: "40%", dy: "-600%" }]
    },
    stage: {
      frameImage: makeFrame({ corner: "paw", edge: "check", c1: "#fff0e0", c2: "#fffaf2", c3: "#ffe8d8", gold: "#d0904a" }),
      wallpaper: makeWallpaper("kitchen"),
      frame: [
        { type: "peek", p: "chuta", css: "left:8%;top:-40px;width:40px;height:40px", d: 13, delay: 0 },
        { type: "peek", p: "chick", css: "right:16%;top:-30px;width:30px;height:30px", d: 17, delay: 5 },
        { p: "egg", css: "left:47%;top:-40px;width:24px", a: "sway", d: 3.4, z: "front" },
        { type: "orbit", p: "littlestar", css: "right:-6px;top:-6px", r: 34, d: 9, w: 18 },
        { type: "orbit", p: "fish", css: "left:-6px;bottom:-6px", r: 30, d: 12, w: 22, delay: 2 },
        { p: "lantern", css: "left:-12px;top:-16px;width:26px", a: "sway", d: 2.6, z: "front" },
        { p: "pan", css: "right:6%;bottom:-20px;width:44px", a: "sway", d: 4, z: "front" },
        { p: "herb", css: "left:5%;bottom:-24px;width:22px", a: "sway", d: 3, z: "front" }
      ],
      page: [
        { p: "fish", css: "left:3%;bottom:1%;width:40px", a: "crawl", d: 50, delay: 0, dx: "1000%" },
        { p: "littlestar", css: "left:10%;top:30%;width:16px", a: "twinkle", d: 3, delay: 0.5 },
        { p: "littlestar", css: "left:90%;top:62%;width:16px", a: "twinkle", d: 3.6, delay: 1.7 },
        { p: "heart", css: "left:86%;top:12%;width:16px", a: "twinkle", d: 4, delay: 1 }
      ]
    },
    cover: { bg: "shop", deco: [["komugi", 320, 450, 1.2], ["chuta", 440, 460, 0.9], ["omelette", 180, 340, 0.8], ["bobo", 560, 450, 0.7]] }
  });
})();
