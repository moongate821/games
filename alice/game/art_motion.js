/*
 * アリスの挿絵 ― 動き(キャラクター・背景・メルヘンな枠)。
 * 動くものは、すべて「小さな別の層」にして、transform と opacity だけで動かす(絵の本体は動かさない=クレヨンのフィルターが毎コマ再計算されないため)。
 * エンジン(ui.js)が art.motion / art.ambient / art.stage を読む。
 */
(function () {
  "use strict";
  const A = window.ALICE_ART;

  // ── 絵の中のキャラクターの、ふだんの動き(飾り・さわれる物のどちらも) ──
  A.motion = {
    alice: "bob", sister: "bob", rabbit: "hop", hatter: "bob", hare: "hop", dormouse: "breathe", mouse: "bob",
    dodo: "sway", pigeon: "bob", duchess: "sway", queen: "sway", king: "bob", jack: "bob", soldier: "bob",
    flamingo: "sway", hedgehog: "bob", baby: "bob", caterpillar: "sway", butterfly: "float", cat: "sway",
    grin: "float", cocoon: "sway", fish: "float", bird: "bob"
  };

  // ── 絵の中の背景の動き(場所ごと) ──
  const cloud = (x, y, s, d, delay, dx) => ({ p: "cloud", x, y, s, a: "drift", d, delay, dx: dx || "420%" });
  const fly = (y, d, delay, s) => ({ p: "butterfly", x: 20, y, s: s || 0.5, a: "cross", d, delay, dx: "1700%", flap: 1 });
  const petals = (n, p, d0) => Array.from({ length: n }, (_, i) => ({ p, x: 40 + (i * 83) % 560, y: -20, s: 0.55 + (i % 3) * 0.12, a: "fall", d: d0 + (i % 4) * 3, delay: i * 2.1, dx: (i % 2 ? "" : "-") + (60 + (i % 3) * 30) + "%", dy: "2600%" }));
  const bubbles = (n, y0) => Array.from({ length: n }, (_, i) => ({ p: "bubble", x: 60 + (i * 97) % 520, y: y0 || 470, s: 0.5 + (i % 3) * 0.25, a: "rise", d: 7 + (i % 4) * 2, delay: i * 1.3, dx: (i % 2 ? "" : "-") + "30%", dy: "-1700%" }));
  const stars = (n, ymax) => Array.from({ length: n }, (_, i) => ({ p: "sparklestar", x: 30 + (i * 137) % 580, y: 40 + (i * 71) % (ymax || 300), s: 0.4 + (i % 3) * 0.2, a: "twinkle", d: 2.2 + (i % 4) * 0.7, delay: (i * 0.6) % 3 }));
  const sky = [cloud(120, 90, 1.0, 80, 0, "520%"), cloud(430, 140, 0.8, 100, 20, "420%")];
  const outdoors = (extra) => [...sky, fly(300, 26, 0), fly(210, 34, 12, 0.42), { p: "bird", x: 10, y: 120, s: 0.6, a: "cross", d: 30, delay: 6, dx: "1900%", flap: 1 }, ...(extra || [])];

  A.ambientMap = {
    river: outdoors(petals(3, "petal", 16)), meadow: outdoors(petals(3, "petal", 16)), golden: outdoors(petals(3, "petal", 16)),
    cottage: outdoors(petals(3, "leaf", 18)), forest: outdoors(petals(4, "leaf", 18)), glade: outdoors(petals(4, "leaf", 18)),
    treetop: outdoors(petals(4, "leaf", 18)), garden: outdoors(petals(5, "petal", 15)), tea: outdoors(petals(3, "petal", 17)),
    maze: [fly(250, 28, 0), ...petals(3, "leaf", 18)],
    pool: [cloud(150, 80, 0.9, 90, 0), ...bubbles(5, 470), { p: "fish", x: 120, y: 330, s: 0.7, a: "jump", d: 7, delay: 1.5 }, { p: "fish", x: 470, y: 400, s: 0.6, a: "jump", d: 9, delay: 4.5 }, { p: "bird", x: 10, y: 100, s: 0.6, a: "cross", d: 32, delay: 5, dx: "1900%", flap: 1 }],
    flood: [...bubbles(5, 470), ...stars(4, 200)],
    shore: [...sky, { p: "bird", x: 10, y: 110, s: 0.6, a: "cross", d: 30, delay: 3, dx: "1900%", flap: 1 }, { p: "fish", x: 200, y: 250, s: 0.5, a: "jump", d: 9, delay: 2 }],
    sea: [cloud(120, 90, 1.0, 80, 0, "520%"), { p: "bird", x: 10, y: 140, s: 0.7, a: "cross", d: 24, delay: 0, dx: "1900%", flap: 1 }, { p: "fish", x: 150, y: 380, s: 0.8, a: "jump", d: 6, delay: 1 }, { p: "fish", x: 480, y: 420, s: 0.7, a: "jump", d: 8, delay: 3.5 }, ...bubbles(3, 470)],
    sky: [cloud(90, 100, 1.3, 70, 0, "560%"), cloud(480, 150, 1.1, 90, 14, "430%"), { p: "bird", x: 10, y: 250, s: 0.8, a: "cross", d: 22, delay: 2, dx: "1700%", flap: 1 }, fly(330, 30, 6)],
    hall: stars(7, 260), hallwall: stars(6, 260), corridor: stars(6, 300), room: [...stars(4, 200), { p: "ladybug", x: 60, y: 478, s: 0.9, a: "crawl", d: 40, delay: 0, dx: "2200%" }],
    fall: [...stars(6, 400), { p: "cup", x: 560, y: 470, s: 0.5, a: "rise", d: 9, delay: 1, dx: "-30%", dy: "-2200%" }, { p: "key", x: 90, y: 470, s: 0.5, a: "rise", d: 11, delay: 5, dx: "30%", dy: "-2200%" }, { p: "clock6", x: 330, y: 470, s: 0.35, a: "rise", d: 13, delay: 8, dx: "-20%", dy: "-2600%" }],
    hole: stars(9, 440),
    kitchen: [{ p: "steam", x: 300, y: 260, s: 1.0, a: "rise", d: 5, delay: 0, dx: "20%", dy: "-500%" }, { p: "steam", x: 345, y: 262, s: 0.9, a: "rise", d: 6, delay: 2, dx: "-20%", dy: "-500%" }, ...stars(3, 200)],
    court: [{ p: "heart", x: 90, y: 470, s: 0.35, a: "rise", d: 11, delay: 0, dx: "40%", dy: "-2300%" }, { p: "spade", x: 540, y: 470, s: 0.3, a: "rise", d: 13, delay: 3, dx: "-40%", dy: "-2300%" }, { p: "diamond", x: 320, y: 470, s: 0.3, a: "rise", d: 12, delay: 6, dx: "30%", dy: "-2300%" }, { p: "club", x: 450, y: 470, s: 0.28, a: "rise", d: 14, delay: 8, dx: "-30%", dy: "-2300%" }],
    dusk: stars(12, 300), void: [...stars(8, 440), { p: "note", x: 100, y: 470, s: 0.6, a: "rise", d: 12, delay: 0, dx: "30%", dy: "-2000%" }],
    cards: [{ p: "heart", x: 90, y: 470, s: 0.5, a: "rise", d: 11, delay: 0, dx: "40%", dy: "-1900%" }, { p: "spade", x: 540, y: 470, s: 0.45, a: "rise", d: 13, delay: 3, dx: "-40%", dy: "-1900%" }, { p: "diamond", x: 320, y: 470, s: 0.45, a: "rise", d: 12, delay: 6, dx: "30%", dy: "-1900%" }],
    bookpage: [{ p: "butterfly", x: 20, y: 300, s: 0.7, a: "cross", d: 24, delay: 0, dx: "1300%", flap: 1 }, ...stars(4, 200)],
    tiny: [{ p: "ladybug", x: 40, y: 470, s: 2.6, a: "crawl", d: 36, delay: 0, dx: "1100%" }, fly(160, 26, 3, 0.8)],
    stars: stars(14, 320)
  };
  A.ambient = function (bg) { return A.ambientMap[bg] || []; };

  // ── メルヘンな枠(9分割の絵) ──
  const FRAME = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120">
<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fbd9df"/><stop offset=".55" stop-color="#fdeccf"/><stop offset="1" stop-color="#d4ecd8"/></linearGradient>
<g id="c"><path d="M3,14C3,4 9,3 16,3" stroke="#c79a3b" stroke-width="2.4" fill="none"/>
<ellipse cx="25" cy="9" rx="8" ry="3.4" fill="#8bc86e" stroke="#4b3326" stroke-width="1.3" transform="rotate(-18 25 9)"/><ellipse cx="9" cy="25" rx="8" ry="3.4" fill="#8bc86e" stroke="#4b3326" stroke-width="1.3" transform="rotate(72 9 25)"/>
<circle cx="15" cy="15" r="10" fill="#f0788a" stroke="#4b3326" stroke-width="1.5"/><path d="M15,15m-6,0a6,6 0 1 1 6,6m-3,-6a3,3 0 1 1 3,3" stroke="#a8324a" stroke-width="1.4" fill="none"/>
<path d="M31,28l1.6,3.6l3.8,.4l-2.8,2.6l.8,3.8l-3.4,-1.9l-3.4,1.9l.8,-3.8l-2.8,-2.6l3.8,-.4Z" fill="#ffe27a" stroke="#b98a1d" stroke-width=".9" transform="translate(-3 -3)"/></g>
<g id="e"><path d="M37,7q11,-7 23,0q12,-7 23,0" stroke="#7fb36e" stroke-width="2.4" fill="none"/>
<ellipse cx="45" cy="15" rx="6" ry="2.8" fill="#8bc86e" stroke="#4b3326" stroke-width="1.2" transform="rotate(-28 45 15)"/><ellipse cx="75" cy="15" rx="6" ry="2.8" fill="#8bc86e" stroke="#4b3326" stroke-width="1.2" transform="rotate(28 75 15)"/>
<g transform="translate(60 14)"><g fill="#fffdf6" stroke="#4b3326" stroke-width="1.1"><ellipse cx="0" cy="-6" rx="3" ry="4.6"/><ellipse cx="0" cy="6" rx="3" ry="4.6"/><ellipse cx="-6" cy="0" rx="4.6" ry="3"/><ellipse cx="6" cy="0" rx="4.6" ry="3"/><ellipse cx="-4.2" cy="-4.2" rx="3" ry="4.6" transform="rotate(-45 -4.2 -4.2)"/><ellipse cx="4.2" cy="4.2" rx="3" ry="4.6" transform="rotate(-45 4.2 4.2)"/><ellipse cx="4.2" cy="-4.2" rx="3" ry="4.6" transform="rotate(45 4.2 -4.2)"/><ellipse cx="-4.2" cy="4.2" rx="3" ry="4.6" transform="rotate(45 -4.2 4.2)"/></g><circle r="3.3" fill="#f0c24d" stroke="#4b3326" stroke-width="1"/></g>
<circle cx="46" cy="27" r="2.6" fill="#f8bcc8" stroke="#4b3326" stroke-width=".9"/><circle cx="74" cy="27" r="2.6" fill="#f8bcc8" stroke="#4b3326" stroke-width=".9"/></g></defs>
<rect x="1.5" y="1.5" width="117" height="117" rx="16" fill="url(#g)" stroke="#c79a3b" stroke-width="3"/>
<rect x="33" y="33" width="54" height="54" rx="3" fill="none" stroke="#c79a3b" stroke-width="2.4"/><rect x="31" y="31" width="58" height="58" rx="4" fill="none" stroke="#fffaf0" stroke-width="2"/>
<use href="#e"/><use href="#e" transform="translate(0 120) scale(1 -1)"/><use href="#e" transform="translate(0 120) rotate(-90)"/><use href="#e" transform="translate(120 0) rotate(90)"/>
<use href="#c"/><use href="#c" transform="translate(120 0) scale(-1 1)"/><use href="#c" transform="translate(0 120) scale(1 -1)"/><use href="#c" transform="translate(120 120) scale(-1 -1)"/></svg>`;

  // ── 枠のまわり・ページのすきまを動くキャラクター ──
  // css=置く場所(絵の額縁、またはページを基準) / a=動き / d=1周の秒 / delay=開始の遅れ / dx,dy=動く距離(自分の大きさの%) / flap=はばたき
  const WALL = `<svg xmlns="http://www.w3.org/2000/svg" width="84" height="84" viewBox="0 0 84 84"><g fill="none" stroke="#b99a6b" stroke-width="1.3" opacity=".28" stroke-linecap="round" stroke-linejoin="round"><path d="M20,10l2.2,5.2l5.6,.5l-4.3,3.7l1.3,5.5l-4.8,-3l-4.8,3l1.3,-5.5l-4.3,-3.7l5.6,-.5z"/><circle cx="62" cy="58" r="3.2"/><path d="M62,50v-4M62,66v4M54,58h-4M70,58h4"/><path d="M60,14c-6,-8 -12,2 -6,8l6,6l6,-6c6,-6 0,-16 -6,-8z"/><path d="M22,60l4,-6l4,6z"/><path d="M26,60v8"/></g></svg>`;
  A.stage = {
    wallpaper: "data:image/svg+xml," + encodeURIComponent(WALL),
    frameImage: "data:image/svg+xml," + encodeURIComponent(FRAME),
    frame: [
      { type: "peek", p: "rabbit", css: "left:7%;top:-60px;width:52px;height:60px", d: 11, delay: 0 },
      { type: "peek", p: "cat", css: "right:12%;top:-52px;width:70px;height:52px", d: 17, delay: 5, small: 0.5 },
      { p: "watch", css: "left:47%;top:-46px;width:34px", a: "swing", d: 3.2, z: "front" },
      { type: "orbit", p: "butterfly", css: "right:-6px;top:-6px", r: 38, d: 8, w: 30, flap: 1 },
      { type: "orbit", p: "butterfly", css: "left:-6px;bottom:-6px", r: 30, d: 11, w: 24, flap: 1, delay: 2 },
      { p: "sparklestar", css: "left:-14px;top:-14px;width:24px", a: "twinkle", d: 2.6, z: "front" },
      { p: "sparklestar", css: "right:-14px;bottom:-14px;width:24px", a: "twinkle", d: 3.1, delay: 1, z: "front" },
      { p: "sparklestar", css: "left:-12px;bottom:34%;width:18px", a: "twinkle", d: 2.2, delay: 0.6, z: "front" },
      { p: "sparklestar", css: "right:-12px;top:36%;width:18px", a: "twinkle", d: 2.8, delay: 1.4, z: "front" },
      { p: "ladybug", css: "left:-22px;top:12%;width:20px", a: "climb", d: 18, dy: "2400%", z: "front" },
      { p: "bee", css: "right:-26px;top:20%;width:26px", a: "zig", d: 8, flap: 1, z: "front" },
      { p: "caterpillar", css: "left:6%;bottom:-31px;width:74px", a: "crawl", d: 34, dx: "320%", z: "front" },
      { p: "snail", css: "right:8%;bottom:-28px;width:44px", a: "crawl", d: 52, dx: "-260%", delay: 6, z: "front" },
      { p: "flower2", css: "left:48%;bottom:-27px;width:28px", a: "sway", d: 3.4, z: "front" }
    ],
    page: [
      { p: "cloud", css: "left:2%;top:1.5%;width:96px;opacity:.85", a: "drift", d: 90, dx: "380%" },
      { p: "cloud", css: "left:30%;top:9%;width:70px;opacity:.7", a: "drift", d: 120, delay: 30, dx: "460%" },
      { p: "bird", css: "left:0;top:4%;width:30px", a: "cross", d: 30, delay: 8, dx: "2100%", flap: 1 },
      { p: "butterfly", css: "left:0;bottom:11%;width:34px", a: "cross", d: 24, delay: 3, dx: "1700%", flap: 1 },
      { p: "heart", css: "left:6%;bottom:2%;width:20px", a: "rise", d: 16, delay: 0, dx: "40%", dy: "-3200%" },
      { p: "spade", css: "left:88%;bottom:1%;width:18px", a: "rise", d: 19, delay: 5, dx: "-40%", dy: "-3000%" },
      { p: "diamond", css: "left:20%;bottom:0;width:18px", a: "rise", d: 21, delay: 9, dx: "60%", dy: "-2900%" },
      { p: "club", css: "left:72%;bottom:0;width:18px", a: "rise", d: 23, delay: 13, dx: "-50%", dy: "-2900%" },
      { p: "petal", css: "left:14%;top:-3%;width:14px", a: "fall", d: 15, delay: 1, dx: "120%", dy: "5200%" },
      { p: "petal", css: "left:60%;top:-3%;width:12px", a: "fall", d: 18, delay: 7, dx: "-140%", dy: "5600%" },
      { p: "leaf", css: "left:80%;top:-3%;width:14px", a: "fall", d: 20, delay: 12, dx: "-100%", dy: "5200%" },
      { p: "hedgehog", css: "left:3%;bottom:1%;width:46px", a: "crawl", d: 44, delay: 0, dx: "1050%" },
      { p: "firefly", css: "left:10%;top:30%;width:14px", a: "twinkle", d: 3, delay: 0.5 },
      { p: "firefly", css: "left:90%;top:62%;width:14px", a: "twinkle", d: 3.6, delay: 1.7 }
    ]
  };
})();
