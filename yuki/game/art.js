/* 絵(子ども描き風 art_kids.js)を、エンジンにつなぐ。動き・背景の動き・額縁・表紙。 */
(function () {
  "use strict";
  const twinkles = (n, ymax, s0, y0) => Array.from({ length: n }, (_, i) => ({ p: "littlestar", x: 30 + (i * 137) % 580, y: (y0 || 40) + (i * 71) % (ymax || 300), s: (s0 || 0.35) + (i % 3) * 0.12, a: "twinkle", d: 2.2 + (i % 4) * 0.7, delay: (i * 0.6) % 3 }));
  const snow = (n, d0) => Array.from({ length: n }, (_, i) => ({ p: "flake", x: 20 + (i * 71) % 600, y: -20, s: 0.25 + (i % 3) * 0.1, a: "fall", d: (d0 || 9) + (i % 4) * 2, delay: i * 0.9, dx: (i % 2 ? "" : "-") + "40%", dy: "3600%" }));
  const cloud = (x, y, s, d, delay, dx) => ({ p: "cloud", x, y, s, a: "drift", d, delay, dx: dx || "420%" });

  window.GAME.art = makeKidArt({
    motion: {
      yuki: "float", yuki_fade: "breathe", sora: "bob", sora_bed: "breathe", bear: "breathe", owl: "sway", wind: "float",
      swallow: "bob", charcoal: "breathe", kid: "hop", fish: "float", snowdrop: "sway", bell: "sway", flake: "float", snowman: "sway"
    },
    ambient: {
      night: [...snow(12), ...twinkles(4, 100)], house: snow(10), garden: snow(8, 11), village: snow(8, 11),
      forest: snow(10), cave: [], lake: [cloud(100, 60, 0.9, 90, 0), ...snow(4, 12), { p: "fish", x: 300, y: 380, s: 0.6, a: "jump", d: 9, delay: 2 }],
      owltree: [...twinkles(10, 240), ...snow(4, 12)], pass: snow(18, 5), hut: [...snow(8), { p: "cloud", x: 400, y: 80, s: 0.4, a: "rise", d: 8, delay: 0, dx: "40%", dy: "-600%" }],
      thaw: [cloud(120, 60, 0.9, 90, 0), { p: "swallow", x: 10, y: 120, s: 0.5, a: "cross", d: 20, delay: 3, dx: "1900%", flap: 1 }],
      hill: [...twinkles(14, 300), { p: "littlestar", x: 20, y: 40, s: 0.4, a: "cross", d: 7, delay: 4, dx: "2600%", dy: "700%" }],
      room: twinkles(6, 140, 0.25, 90), spring: [cloud(120, 60, 0.9, 90, 0), { p: "swallow", x: 10, y: 100, s: 0.5, a: "cross", d: 22, delay: 2, dx: "1900%", flap: 1 }]
    },
    stage: {
      frameImage: makeFrame({ corner: "star", edge: "daisy", c1: "#e0ecff", c2: "#f4f8ff", c3: "#e8f4ec", gold: "#8aa8c8" }),
      wallpaper: makeWallpaper("star"),
      frame: [
        { type: "peek", p: "owl", css: "left:8%;top:-46px;width:40px;height:46px", d: 15, delay: 0 },
        { type: "peek", p: "bear", css: "right:14%;top:-40px;width:56px;height:40px", d: 19, delay: 6 },
        { p: "snowdrop", css: "left:47%;top:-46px;width:22px", a: "sway", d: 3.4, z: "front" },
        { type: "orbit", p: "flake", css: "right:-6px;top:-6px", r: 36, d: 9, w: 20 },
        { type: "orbit", p: "flake", css: "left:-6px;bottom:-6px", r: 30, d: 12, w: 16, delay: 2 },
        { p: "littlestar", css: "left:-14px;top:-14px;width:24px", a: "twinkle", d: 2.6, z: "front" },
        { p: "swallow", css: "right:-30px;top:20%;width:34px", a: "zig", d: 9, flap: 1, z: "front" },
        { p: "snowrabbit", css: "left:4%;bottom:-20px;width:36px", a: "sway", d: 4, z: "front" },
        { p: "bell", css: "right:8%;bottom:-26px;width:22px", a: "sway", d: 3, z: "front" }
      ],
      page: [
        { p: "flake", css: "left:10%;top:-3%;width:14px", a: "fall", d: 14, delay: 0, dx: "120%", dy: "5200%" },
        { p: "flake", css: "left:35%;top:-3%;width:10px", a: "fall", d: 17, delay: 4, dx: "-100%", dy: "5600%" },
        { p: "flake", css: "left:60%;top:-3%;width:12px", a: "fall", d: 15, delay: 8, dx: "80%", dy: "5400%" },
        { p: "flake", css: "left:85%;top:-3%;width:10px", a: "fall", d: 19, delay: 12, dx: "-80%", dy: "5200%" },
        { p: "littlestar", css: "left:10%;top:30%;width:16px", a: "twinkle", d: 3, delay: 0.5 },
        { p: "littlestar", css: "left:90%;top:62%;width:16px", a: "twinkle", d: 3.6, delay: 1.7 },
        { p: "snowrabbit", css: "left:3%;bottom:1%;width:40px", a: "crawl", d: 60, delay: 0, dx: "1000%" }
      ]
    },
    cover: { bg: "house", deco: [["yuki", 160, 440, 1.0], ["snowman", 520, 440, 0.8], ["snowrabbit", 340, 460, 1.0]] }
  });
})();
