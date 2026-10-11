/* 絵(子ども描き風 art_kids.js)を、エンジンにつなぐ。動き・背景の動き・額縁・表紙。 */
(function () {
  "use strict";
  const twinkles = (n, ymax, s0) => Array.from({ length: n }, (_, i) => ({ p: "littlestar", x: 30 + (i * 137) % 580, y: 40 + (i * 71) % (ymax || 300), s: (s0 || 0.35) + (i % 3) * 0.12, a: "twinkle", d: 2.2 + (i % 4) * 0.7, delay: (i * 0.6) % 3 }));
  const cloud = (x, y, s, d, delay, dx) => ({ p: "cloud", x, y, s, a: "drift", d, delay, dx: dx || "420%" });
  const bird = (y, d, delay, s) => ({ p: "bird", x: 10, y, s: s || 0.5, a: "cross", d, delay, dx: "1900%", flap: 1 });
  const comet = (delay) => ({ p: "littlestar", x: 20, y: 60, s: 0.5, a: "cross", d: 9, delay, dx: "2600%", dy: "800%" });
  const planet = (extra) => [...twinkles(6, 230), comet(4), ...(extra || [])];

  window.GAME.art = makeKidArt({
    motion: {
      prince: "bob", rose: "sway", fox: "sway", snake: "sway", sheep: "breathe", king: "bob", vain: "bob", drunk: "breathe",
      business: "bob", lamplighter: "hop", geographer: "breathe", pilot: "bob", flower3: "sway", switchman: "bob",
      merchant: "bob", bird: "float", earth: "float", lamp: "breathe", echo: "breathe", littlestar: "float",
      pl_king: "float", pl_vain: "float", pl_drunk: "float", pl_biz: "float", pl_lamp: "float", pl_geo: "float"
    },
    ambient: {
      space: [...twinkles(10, 440), comet(2), comet(11), bird(120, 34, 6, 0.4)],
      b612: planet([bird(110, 36, 8, 0.4)]), sunset: [bird(120, 30, 3, 0.45), bird(160, 36, 9, 0.38), ...twinkles(3, 120)],
      king_p: planet(), vain_p: planet(), drunk_p: planet(), biz_p: planet(twinkles(6, 260, 0.25)), lamp_p: planet(), geo_p: planet(),
      desert: [cloud(110, 90, 0.9, 90, 0, "520%"), cloud(420, 130, 0.7, 110, 25), bird(80, 40, 10, 0.35)],
      desert_night: twinkles(12, 290), mountain: [cloud(80, 110, 1.1, 80, 0, "520%"), cloud(430, 70, 0.8, 100, 18), bird(140, 30, 4, 0.45)],
      garden: [cloud(120, 70, 0.9, 90, 0), bird(110, 30, 5, 0.45), bird(160, 38, 14, 0.4)],
      wheat: [cloud(100, 80, 1.0, 85, 0, "520%"), cloud(450, 120, 0.8, 110, 20), bird(120, 32, 7, 0.45)],
      rail: [cloud(140, 80, 1.0, 90, 0), bird(110, 34, 3, 0.45)],
      well_night: twinkles(12, 300), wall_night: [...twinkles(12, 300), comet(6)], dawn: [...twinkles(4, 110), bird(150, 34, 4, 0.4)]
    },
    stage: {
      frameImage: makeFrame({ corner: "star", edge: "star", c1: "#dfe4ff", c2: "#fff2cf", c3: "#ffe0c8" }),
      wallpaper: makeWallpaper("star"),
      frame: [
        { type: "peek", p: "fox", css: "left:8%;top:-52px;width:56px;height:52px", d: 13, delay: 0 },
        { type: "peek", p: "sheep", css: "right:14%;top:-44px;width:56px;height:44px", d: 17, delay: 6 },
        { p: "rose", css: "left:47%;top:-50px;width:30px", a: "sway", d: 3.4, z: "front" },
        { type: "orbit", p: "littlestar", css: "right:-6px;top:-6px", r: 36, d: 9, w: 24 },
        { type: "orbit", p: "littlestar", css: "left:-6px;bottom:-6px", r: 30, d: 12, w: 20, delay: 2 },
        { p: "littlestar", css: "left:-14px;top:-14px;width:24px", a: "twinkle", d: 2.6, z: "front" },
        { p: "littlestar", css: "right:-14px;bottom:-14px;width:24px", a: "twinkle", d: 3.1, delay: 1, z: "front" },
        { p: "littlestar", css: "left:-12px;bottom:34%;width:18px", a: "twinkle", d: 2.2, delay: 0.6, z: "front" },
        { p: "bird", css: "right:-26px;top:20%;width:30px", a: "zig", d: 9, flap: 1, z: "front" },
        { p: "snake", css: "left:6%;bottom:-24px;width:60px", a: "crawl", d: 40, dx: "320%", z: "front" },
        { p: "flower3", css: "right:10%;bottom:-30px;width:26px", a: "sway", d: 3.2, z: "front" }
      ],
      page: [
        { p: "cloud", css: "left:2%;top:1.5%;width:90px;opacity:.8", a: "drift", d: 90, dx: "380%" },
        { p: "bird", css: "left:0;top:4%;width:30px", a: "cross", d: 30, delay: 8, dx: "2100%", flap: 1 },
        { p: "littlestar", css: "left:10%;top:30%;width:16px", a: "twinkle", d: 3, delay: 0.5 },
        { p: "littlestar", css: "left:90%;top:62%;width:16px", a: "twinkle", d: 3.6, delay: 1.7 },
        { p: "littlestar", css: "left:55%;top:8%;width:12px", a: "twinkle", d: 2.8, delay: 1 },
        { p: "littlestar", css: "left:20%;top:-3%;width:14px", a: "fall", d: 16, delay: 2, dx: "120%", dy: "5200%" },
        { p: "wheat", css: "left:70%;top:-3%;width:14px", a: "fall", d: 19, delay: 9, dx: "-140%", dy: "5400%" },
        { p: "earth", css: "left:84%;bottom:0;width:22px", a: "rise", d: 24, delay: 5, dx: "-40%", dy: "-2800%" },
        { p: "fox", css: "left:3%;bottom:1%;width:44px", a: "crawl", d: 46, delay: 0, dx: "1050%" }
      ]
    },
    cover: { bg: "b612", deco: [["volcano", 110, 400, 0.9], ["prince", 300, 420, 1.15], ["rose", 450, 410, 1.0], ["chair", 560, 410, 0.8], ["bird", 160, 160, 0.7], ["bird", 500, 120, 0.6]] }
  });
})();
