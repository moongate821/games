/*
 * StoryBook Engine ― kid_runtime.js(子ども描き風の絵を、エンジンにつなぐ)
 * kidart で書き出した window.KID_PROPS / window.KID_BGS から、ui.js が使う art オブジェクトを作る。
 *   GAME.art = makeKidArt({ motion, ambient, stage, cover })
 * makeFrame({ corner, edge, c1, c2, c3 }) で、作品ごとの額縁(9分割の絵)を作れる。
 */
(function (root) {
  "use strict";

  function makeKidArt(opts) {
    opts = opts || {};
    const P = root.KID_PROPS || {}, B = root.KID_BGS || {};
    return {
      w: 640, h: 480, props: P, bgs: B,
      bg(name) {
        if (!B[name]) { console.warn("背景がありません:", name); return '<rect width="640" height="480" fill="#fffdf8"/>'; }
        return "<g>" + B[name] + "</g>";
      },
      prop(name) {
        if (!P[name]) { console.warn("小道具がありません:", name); return '<circle cx="0" cy="-18" r="18" fill="#eee" stroke="#333"/><text y="-12" text-anchor="middle" font-size="16">?</text>'; }
        return P[name];
      },
      cover: opts.cover ? () => {
        const c = opts.cover;
        const parts = (c.deco || []).map(([p, x, y, s]) => `<g transform="translate(${x} ${y}) scale(${s || 1})">${P[p] || ""}</g>`).join("");
        return `<svg viewBox="0 0 640 480" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="表紙の絵"><g filter="url(#sb-wc)"><g>${B[c.bg] || ""}</g>${parts}</g></svg>`;
      } : null,
      motion: opts.motion || {},
      ambientMap: opts.ambient || {},
      ambient(bg) { return (opts.ambient && opts.ambient[bg]) || []; },
      stage: opts.stage || null,
      defs: opts.defs ? () => opts.defs : null,          // 絵の部品が使う共通の定義(影・模様など)
      filterDef: opts.filterDef || null                  // 絵全体のフィルター(id="sb-wc")を差しかえる
    };
  }

  // ── 額縁(9分割): 角の模様と、辺の模様を選ぶ ──
  const CORNER = {
    rose: `<path d="M3,14C3,4 9,3 16,3" stroke="#c79a3b" stroke-width="2.4" fill="none"/><ellipse cx="25" cy="9" rx="8" ry="3.4" fill="#8bc86e" stroke="#4b3326" stroke-width="1.3" transform="rotate(-18 25 9)"/><ellipse cx="9" cy="25" rx="8" ry="3.4" fill="#8bc86e" stroke="#4b3326" stroke-width="1.3" transform="rotate(72 9 25)"/><circle cx="15" cy="15" r="10" fill="#f0788a" stroke="#4b3326" stroke-width="1.5"/><path d="M15,15m-6,0a6,6 0 1 1 6,6m-3,-6a3,3 0 1 1 3,3" stroke="#a8324a" stroke-width="1.4" fill="none"/>`,
    star: `<path d="M16,2l3.6,8.4l9,.6l-6.9,5.8l2.2,8.8l-7.9,-4.8l-7.9,4.8l2.2,-8.8l-6.9,-5.8l9,-.6Z" fill="#ffd84a" stroke="#4b3326" stroke-width="1.5" stroke-linejoin="round"/><circle cx="29" cy="27" r="2.4" fill="#fff6c0" stroke="#4b3326" stroke-width="1"/><circle cx="7" cy="30" r="1.8" fill="#fff6c0"/>`,
    peach: `<ellipse cx="25" cy="8" rx="8" ry="3.6" fill="#8bc86e" stroke="#4b3326" stroke-width="1.3" transform="rotate(-20 25 8)"/><path d="M15,6C5,6 2,16 5,22C8,28 14,29 16,28C18,29 24,28 27,22C30,16 26,6 15,6Z" fill="#ffb0b8" stroke="#4b3326" stroke-width="1.5"/><path d="M15,9C13,15 14,22 16,27" stroke="#e07888" stroke-width="1.4" fill="none"/><ellipse cx="10" cy="15" rx="3" ry="2" fill="#fff" opacity=".7"/>`,
    moon: `<path d="M22,4C12,2 4,10 5,19C6,28 15,33 24,30C16,28 12,21 13,15C14,9 18,6 22,4Z" fill="#ffe27a" stroke="#4b3326" stroke-width="1.5"/><path d="M28,12l1.4,3l3.2,.3l-2.4,2l.8,3.2l-3,-1.8l-3,1.8l.8,-3.2l-2.4,-2l3.2,-.3Z" fill="#fff6c0" stroke="#4b3326" stroke-width=".9"/>`,
    jade: `<path d="M8,6C17,2 27,8 25,18C23,26 14,26 14,19C14,14 20,15 19,11C18,8 12,9 8,6Z" fill="#6ac0a0" stroke="#2a4a40" stroke-width="1.4"/><circle cx="11" cy="9" r="1.6" fill="#e8fff6"/><path d="M6,4C12,0 20,1 24,6" stroke="#c8d8d0" stroke-width="1.6" fill="none"/>`,
    petal: `<g fill="#ffc8d8" stroke="#8a4a5a" stroke-width="1.1"><path d="M6,6C10,0 18,2 16,10C14,14 8,12 6,6Z"/><path d="M16,10C22,6 28,12 22,18C18,20 14,16 16,10Z"/><path d="M6,6C2,12 6,20 12,18C16,16 12,10 6,6Z"/></g><circle cx="13" cy="12" r="2" fill="#fff6c0"/>`,
    note: `<path d="M10,22V6L24,3V19" stroke="#3a3458" stroke-width="2.2" fill="none"/><ellipse cx="8" cy="23" rx="5" ry="3.6" fill="#3a3458"/><ellipse cx="22" cy="20" rx="5" ry="3.6" fill="#3a3458"/>`,
    paw: `<g fill="#f2a050" stroke="#4b3326" stroke-width="1.3"><ellipse cx="17" cy="20" rx="7.5" ry="6.2"/><circle cx="8" cy="11" r="3.2"/><circle cx="14" cy="5.5" r="3.2"/><circle cx="21" cy="5.5" r="3.2"/><circle cx="27" cy="11" r="3.2"/></g>`,
    rocket: `<g stroke="#4b3326" stroke-width="1.3" stroke-linejoin="round"><path d="M16,3C22,8 24,16 22,24H10C8,16 10,8 16,3Z" fill="#c8996a"/><path d="M16,3C19,5 21,9 22,12H10C11,9 13,5 16,3Z" fill="#e8463c"/><circle cx="16" cy="17" r="3" fill="#9ad0f0"/><path d="M10,19L4,28L10,26ZM22,19L28,28L22,26Z" fill="#3a8ad0"/><path d="M12,24L16,31L20,24Z" fill="#ffd23e"/></g>`
  };
  const EDGE = {
    daisy: `<g transform="translate(60 14)"><g fill="#fffdf6" stroke="#4b3326" stroke-width="1.1"><ellipse cx="0" cy="-6" rx="3" ry="4.6"/><ellipse cx="0" cy="6" rx="3" ry="4.6"/><ellipse cx="-6" cy="0" rx="4.6" ry="3"/><ellipse cx="6" cy="0" rx="4.6" ry="3"/></g><circle r="3.3" fill="#f0c24d" stroke="#4b3326" stroke-width="1"/></g>`,
    star: `<path d="M60,6l2.6,5.6l6,.5l-4.6,4l1.5,5.9l-5.5,-3.3l-5.5,3.3l1.5,-5.9l-4.6,-4l6,-.5Z" fill="#ffe27a" stroke="#4b3326" stroke-width="1.2" stroke-linejoin="round"/>`,
    sakura: `<g transform="translate(60 14)" fill="#ffc8d8" stroke="#4b3326" stroke-width="1.1"><ellipse cx="0" cy="-6" rx="3.4" ry="5"/><ellipse cx="5.7" cy="-1.9" rx="3.4" ry="5" transform="rotate(72 5.7 -1.9)"/><ellipse cx="3.5" cy="4.9" rx="3.4" ry="5" transform="rotate(144 3.5 4.9)"/><ellipse cx="-3.5" cy="4.9" rx="3.4" ry="5" transform="rotate(216 -3.5 4.9)"/><ellipse cx="-5.7" cy="-1.9" rx="3.4" ry="5" transform="rotate(288 -5.7 -1.9)"/><circle r="2.4" fill="#f0c24d"/></g>`,
    rain: `<g stroke="#8aa8d0" stroke-width="1.6" stroke-linecap="round"><path d="M42,8l-3,9M54,6l-3,10M66,9l-3,9M78,7l-3,10"/></g><circle cx="60" cy="24" r="2.4" fill="#cfe0f8" stroke="#8aa8d0" stroke-width=".8"/>`,
    wave: `<path d="M36,14q6,-9 12,0t12,0t12,0t12,0" stroke="#3a6a8a" stroke-width="2" fill="none"/><path d="M36,22q6,-7 12,0t12,0t12,0t12,0" stroke="#8ab8d0" stroke-width="1.6" fill="none"/>`,
    check: `<g transform="translate(37 8)"><rect width="46" height="12" fill="#fffdf6" stroke="#4b3326" stroke-width="1"/><g fill="#e8463c" opacity=".5"><rect x="0" width="5.75" height="12"/><rect x="11.5" width="5.75" height="12"/><rect x="23" width="5.75" height="12"/><rect x="34.5" width="5.75" height="12"/><rect width="46" height="6" opacity=".7"/></g></g>`,
    tape: `<path d="M37,9L83,6.5L84,19L38,21.5Z" fill="#f2e2a0" stroke="#c8b070" stroke-width="1" opacity=".92"/><path d="M37,9l1,12.5" stroke="#c8b070" stroke-dasharray="1.5 1.5"/>`,
    rail: `<path d="M38,10H82M38,18H82" stroke="#8a7a6a" stroke-width="2"/><path d="M44,7v14M54,7v14M64,7v14M74,7v14" stroke="#b08a5a" stroke-width="2.4"/><circle cx="60" cy="27" r="2.2" fill="#ffe27a"/>`
  };
  function makeFrame(o) {
    o = Object.assign({ corner: "rose", edge: "daisy", c1: "#fbd9df", c2: "#fdeccf", c3: "#d4ecd8", gold: "#c79a3b" }, o || {});
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${o.c1}"/><stop offset=".55" stop-color="${o.c2}"/><stop offset="1" stop-color="${o.c3}"/></linearGradient>
<g id="c">${CORNER[o.corner] || CORNER.rose}</g><g id="e"><path d="M37,7q11,-7 23,0q12,-7 23,0" stroke="#7fb36e" stroke-width="2.2" fill="none" opacity=".8"/>${EDGE[o.edge] || EDGE.daisy}<circle cx="46" cy="27" r="2.4" fill="#fff6c0" stroke="#4b3326" stroke-width=".9"/><circle cx="74" cy="27" r="2.4" fill="#fff6c0" stroke="#4b3326" stroke-width=".9"/></g></defs>
<rect x="1.5" y="1.5" width="117" height="117" rx="16" fill="url(#g)" stroke="${o.gold}" stroke-width="3"/><rect x="33" y="33" width="54" height="54" rx="3" fill="none" stroke="${o.gold}" stroke-width="2.4"/><rect x="31" y="31" width="58" height="58" rx="4" fill="none" stroke="#fffaf0" stroke-width="2"/>
<use href="#e"/><use href="#e" transform="translate(0 120) scale(1 -1)"/><use href="#e" transform="translate(0 120) rotate(-90)"/><use href="#e" transform="translate(120 0) rotate(90)"/>
<use href="#c"/><use href="#c" transform="translate(120 0) scale(-1 1)"/><use href="#c" transform="translate(0 120) scale(1 -1)"/><use href="#c" transform="translate(120 120) scale(-1 -1)"/></svg>`;
    return "data:image/svg+xml," + encodeURIComponent(svg);
  }
  // 地の模様(84×84 のくり返し)
  function makeWallpaper(kind) {
    const icons = {
      alice: `<path d="M20,10l2.2,5.2l5.6,.5l-4.3,3.7l1.3,5.5l-4.8,-3l-4.8,3l1.3,-5.5l-4.3,-3.7l5.6,-.5z"/><path d="M60,14c-6,-8 -12,2 -6,8l6,6l6,-6c6,-6 0,-16 -6,-8z"/><circle cx="62" cy="58" r="3.2"/>`,
      star: `<path d="M20,10l2.2,5.2l5.6,.5l-4.3,3.7l1.3,5.5l-4.8,-3l-4.8,3l1.3,-5.5l-4.3,-3.7l5.6,-.5z"/><circle cx="62" cy="58" r="2.6"/><path d="M58,18a8,8 0 1 0 8,8a6,6 0 1 1 -8,-8z"/><circle cx="24" cy="62" r="1.6"/>`,
      peach: `<path d="M22,12c-8,0 -10,8 -8,12c2,5 6,6 8,5c2,1 6,0 8,-5c2,-4 0,-12 -8,-12z"/><path d="M22,12c3,-4 7,-4 9,-2"/><g transform="translate(60 56)"><circle r="2"/><path d="M0,-7v4M0,3v4M-7,0h4M3,0h4"/></g>`,
      sakura: `<g transform="translate(20 20)"><circle r="2.4"/><path d="M0,-9q5,3 0,8q-5,-5 0,-8M8,-3q-1,6 -7,5q0,-6 7,-5M5,7q-5,3 -8,-2q5,-4 8,2M-5,7q-1,-6 5,-6q1,6 -5,6M-8,-3q6,-2 8,4q-6,2 -8,-4"/></g><path d="M58,52q6,-2 8,4q-5,3 -8,-4" /><circle cx="60" cy="16" r="1.6"/><path d="M14,64q8,-5 16,0M22,60v8"/>`,
      rain: `<path d="M18,10l-4,12M42,30l-4,12M66,12l-4,12M30,58l-4,12M70,52l-4,12"/><circle cx="52" cy="66" r="3"/><circle cx="14" cy="40" r="2"/>`,
      kitchen: `<path d="M16,8v9M20,8v9M24,8v9M16,17q4,5 8,0M20,19v17"/><ellipse cx="62" cy="50" rx="5" ry="7"/><path d="M62,57v14"/><path d="M34,72q8,-7 16,0q-8,7 -16,0zM50,72l5,-4v8z"/><circle cx="64" cy="18" r="1.8"/>`,
      rocket: `<path d="M22,8c5,4 6,12 5,18h-10c-1,-6 0,-14 5,-18z"/><path d="M17,26l-4,6M27,26l4,6M20,28l2,5l2,-5"/><circle cx="62" cy="58" r="6"/><path d="M52,58h20"/><circle cx="66" cy="18" r="1.8"/><path d="M20,58l2,5l5,.5l-4,3.5l1.2,5l-4.2,-2.6l-4.2,2.6l1.2,-5l-4,-3.5l5,-.5z"/>`,
      night: `<path d="M20,10l2.2,5.2l5.6,.5l-4.3,3.7l1.3,5.5l-4.8,-3l-4.8,3l1.3,-5.5l-4.3,-3.7l5.6,-.5z"/><circle cx="62" cy="58" r="2.2"/><circle cx="66" cy="20" r="1.6"/><path d="M14,60h16M18,56v8M26,56v8"/>`
    };
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="84" height="84" viewBox="0 0 84 84"><g fill="none" stroke="#b99a6b" stroke-width="1.3" opacity=".28" stroke-linecap="round" stroke-linejoin="round">${icons[kind] || icons.alice}</g></svg>`;
    return "data:image/svg+xml," + encodeURIComponent(svg);
  }

  root.makeKidArt = makeKidArt;
  root.makeFrame = makeFrame;
  root.makeWallpaper = makeWallpaper;
})(typeof self !== "undefined" ? self : this);
