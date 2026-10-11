/*
 * かわいい描き直し(人と動物)。art_props.js のあとに読み込み、同じ名前の絵を上書きする。
 * 決まり: 頭を大きく(2〜2.5頭身)、目は大きくて白い光を2つ、ほっぺは桃色、口は小さい笑み。線はすこし細く、色はやわらかく。
 * 原点は足もと・中央(0,0)。高さは前の絵とだいたい同じにして、場面の配置をくずさない。
 */
(function () {
  "use strict";
  const P = window.ART_PROPS;
  const INK = "#4b3326";
  const ln = (w) => `stroke="${INK}" stroke-width="${w}" stroke-linejoin="round" stroke-linecap="round"`;
  const S = ln(2.2), T = ln(1.4);
  const f2 = (n) => (+n).toFixed(2);
  // 大きな目(白い光つき)・ほっぺ・笑み・ねむり目
  const eye = (x, y, r) => { r = r || 5; return `<ellipse cx="${x}" cy="${y}" rx="${f2(r * 0.84)}" ry="${r}" fill="#3a2a20"/><circle cx="${f2(x + r * 0.3)}" cy="${f2(y - r * 0.4)}" r="${f2(r * 0.38)}" fill="#fff"/><circle cx="${f2(x - r * 0.28)}" cy="${f2(y + r * 0.4)}" r="${f2(r * 0.17)}" fill="#fff"/>`; };
  const blush = (x, y, rx) => { rx = rx || 5; return `<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${f2(rx * 0.58)}" fill="#f79aa6" opacity=".55"/>`; };
  const smile = (x, y, w) => { w = w || 3.4; return `<path d="M${f2(x - w)},${y} Q${x},${f2(y + w)} ${f2(x + w)},${y}" fill="none" ${T}/>`; };
  const sleep = (x, y, w) => { w = w || 4; return `<path d="M${f2(x - w)},${y} Q${x},${f2(y + w * 0.8)} ${f2(x + w)},${y}" fill="none" ${S}/>`; };
  const face = (y, dx, r, by) => eye(-dx, y, r) + eye(dx, y, r) + blush(-(dx + 7), y + (by || 10), 4.8) + blush(dx + 7, y + (by || 10), 4.8);
  const goldEye = (x, y) => `<ellipse cx="${x}" cy="${y}" rx="7" ry="8" fill="#ffe680" ${T}/>` + eye(x, y + 0.5, 5);

  // ── 人 ─────────────────────────────
  P.alice = `
<path ${S} fill="#f6d26a" d="M-30,-104C-41,-146 41,-146 30,-104C40,-82 36,-62 27,-56L-27,-56C-36,-62 -40,-82 -30,-104Z"/>
<rect ${T} x="-10" y="-30" width="8" height="22" rx="3" fill="#fffdf6"/><rect ${T} x="2" y="-30" width="8" height="22" rx="3" fill="#fffdf6"/>
<path d="M-10,-24h8M-10,-18h8M-10,-12h8M2,-24h8M2,-18h8M2,-12h8" stroke="#7fa0d0" stroke-width="2"/>
<path ${T} fill="#3a3046" d="M-17,-9h13c2,0 3,6 0,7h-13c-3,-1 -3,-7 0,-7Z"/><path ${T} fill="#3a3046" d="M4,-9h13c3,0 3,6 0,7h-13c-3,-1 -2,-7 0,-7Z"/>
<path ${S} fill="#8ecbf0" d="M-15,-64C-28,-58 -36,-38 -35,-28C-12,-21 12,-21 35,-28C36,-38 28,-58 15,-64Z"/>
<path ${T} fill="#fffdf6" d="M-9,-63H9L19,-30C7,-25 -7,-25 -19,-30Z"/>
<path fill="#f7a1b0" d="M0,-37c-3,-4 -9,-1 -6,3l6,5l6,-5c3,-4 -3,-7 -6,-3z" ${T}/>
<path ${S} fill="none" d="M-22,-57C-30,-49 -31,-41 -28,-37M22,-57C30,-49 31,-41 28,-37"/>
<circle ${S} cx="-17" cy="-60" r="8" fill="#8ecbf0"/><circle ${S} cx="17" cy="-60" r="8" fill="#8ecbf0"/>
<circle ${T} cx="-28" cy="-34" r="4.5" fill="#ffe6d4"/><circle ${T} cx="28" cy="-34" r="4.5" fill="#ffe6d4"/>
<circle ${S} cx="0" cy="-97" r="28" fill="#ffe6d4"/>
<path ${T} fill="#f6d26a" d="M-28,-99C-29,-132 29,-132 28,-99C20,-110 10,-103 3,-112C-4,-103 -18,-110 -28,-99Z"/>
<path d="M-26,-109C-16,-129 16,-129 26,-109" stroke="#2f3b66" stroke-width="5" fill="none" stroke-linecap="round"/>
<path ${T} fill="#2f3b66" d="M20,-118L31,-126L31,-110ZM20,-118L9,-126L9,-110Z"/><circle cx="20" cy="-118" r="3" fill="#2f3b66"/>
${face(-94, 10, 5.6, 10)}${smile(0, -82, 3.4)}`;

  P.sister = `
<path ${S} fill="#8a5a3c" d="M-26,-92C-31,-72 -27,-62 -19,-58L19,-58C27,-62 31,-72 26,-92Z"/>
<path ${S} fill="#eab6c8" d="M-24,-4C-30,-40 -20,-62 0,-64C20,-62 30,-40 24,-4C10,2 -10,2 -24,-4Z"/>
<path ${T} fill="#fff7f4" d="M-8,-62L8,-62L10,-36L-10,-36Z"/>
<circle ${S} cx="0" cy="-88" r="24" fill="#ffe6d4"/>
<path ${S} fill="#8a5a3c" d="M-25,-88C-28,-118 28,-118 25,-88C21,-99 11,-103 0,-101C-11,-103 -21,-99 -25,-88Z"/>
<circle ${S} cx="0" cy="-116" r="9" fill="#8a5a3c"/><path d="M-6,-120q6,-5 12,0" stroke="#f7a1b0" stroke-width="3" fill="none"/>
${face(-86, 8.5, 4.6, 9)}${smile(0, -74, 3)}
<path ${S} fill="#fffaf0" d="M-25,-52L0,-46L0,-26L-25,-32Z"/><path ${S} fill="#fffaf0" d="M25,-52L0,-46L0,-26L25,-32Z"/>
<path d="M-20,-46L-5,-42M-20,-40L-5,-36M5,-42L20,-46M5,-36L20,-40" stroke="#c9b48a" stroke-width="1.2" fill="none"/>
<circle ${T} cx="-26" cy="-40" r="4.5" fill="#ffe6d4"/><circle ${T} cx="26" cy="-40" r="4.5" fill="#ffe6d4"/>`;

  P.duchess = `
<path ${S} fill="#7ab48e" d="M-30,-4C-36,-40 -22,-64 0,-66C22,-64 36,-40 30,-4C12,4 -12,4 -30,-4Z"/>
<path ${T} fill="#fffdf6" d="M-16,-64C-8,-54 8,-54 16,-64C8,-70 -8,-70 -16,-64Z"/>
<circle ${S} cx="0" cy="-90" r="27" fill="#ffd9c0"/>
<path ${S} fill="#c86aa8" d="M-42,-104C-30,-120 30,-120 42,-104C30,-99 -30,-99 -42,-104Z"/><path ${S} fill="#c86aa8" d="M-20,-110C-20,-140 20,-140 20,-110Z"/>
<path d="M14,-134c10,-12 22,-10 24,-2" stroke="#f4cd4a" stroke-width="4" fill="none" stroke-linecap="round"/><circle cx="-8" cy="-118" r="4" fill="#f7a1b0" ${T}/>
${face(-88, 10, 5.4, 11)}<ellipse cx="0" cy="-75" rx="3.2" ry="2.6" fill="#c45a6a"/>`;

  P.queen = `
<path ${S} fill="#e2554f" d="M-38,-4C-44,-46 -26,-72 0,-74C26,-72 44,-46 38,-4C14,6 -14,6 -38,-4Z"/>
<path fill="#fffdf6" d="M0,-30c-10,-14 -26,-4 -16,8l16,14l16,-14c10,-12 -6,-22 -16,-8z" ${T}/>
<path ${T} fill="#fffdf6" d="M-24,-72C-14,-60 14,-60 24,-72C12,-80 -12,-80 -24,-72Z"/>
<path ${S} fill="#8a3a3a" d="M-29,-100C-32,-82 -27,-74 -20,-72L-18,-112ZM29,-100C32,-82 27,-74 20,-72L18,-112Z"/>
<circle ${S} cx="0" cy="-98" r="27" fill="#ffd9c0"/>
<path ${S} fill="#8a3a3a" d="M-27,-102C-26,-124 26,-124 27,-102C14,-110 -14,-110 -27,-102Z"/>
<path ${S} fill="#f4cd4a" d="M-22,-118L-22,-142L-11,-130L0,-148L11,-130L22,-142L22,-118Z"/><circle cx="0" cy="-130" r="3" fill="#e2554f"/>
${eye(-10, -95, 5.4)}${eye(10, -95, 5.4)}<path d="M-17,-106L-5,-102M17,-106L5,-102" ${S} fill="none"/>${blush(-18, -85, 5)}${blush(18, -85, 5)}
<path d="M-5,-82Q0,-86 5,-82" fill="none" ${T}/>`;

  P.king = `
<path ${S} fill="#8a6ac8" d="M-26,-4C-30,-34 -18,-54 0,-56C18,-54 30,-34 26,-4C10,3 -10,3 -26,-4Z"/>
<path ${T} fill="#fffdf6" d="M-6,-54L6,-54L6,-6L-6,-6Z"/><path d="M-6,-44h12M-6,-32h12M-6,-20h12" stroke="#8a6ac8" stroke-width="2"/>
<circle ${S} cx="0" cy="-78" r="23" fill="#ffd9c0"/>
<path ${S} fill="#f4cd4a" d="M-16,-96L-16,-114L-8,-106L0,-118L8,-106L16,-114L16,-96Z"/>
${face(-78, 8.5, 4.8, 10)}<path ${T} fill="#fffdf6" d="M-9,-68c3,-3 6,-3 9,0c3,-3 6,-3 9,0c-3,4 -6,4 -9,1c-3,3 -6,3 -9,-1Z"/>`;

  P.jack = `
<path ${S} fill="#d9564b" d="M-20,-6C-24,-32 -16,-48 0,-50C16,-48 24,-32 20,-6C8,0 -8,0 -20,-6Z"/>
<path ${T} fill="#f4cd4a" d="M-6,-48H6L5,-10H-5Z"/><path d="M-20,-30l-10,14M20,-30l10,14" ${S} fill="none"/>
<circle ${S} cx="0" cy="-70" r="20" fill="#ffe6d4"/>
<path ${S} fill="#3a3046" d="M-21,-74C-20,-96 20,-96 21,-74C10,-82 -10,-82 -21,-74Z"/><path d="M14,-90c8,-10 16,-8 18,-2" stroke="#d9564b" stroke-width="3.4" fill="none" stroke-linecap="round"/>
${eye(-6, -68, 4.4)}${eye(8, -68, 4.4)}${blush(-14, -60, 4.4)}${blush(15, -60, 4.4)}${smile(1, -59, 2.6)}`;

  P.soldier = `
<path d="M-9,-14v14M9,-14v14" ${S} fill="none"/>
<rect ${S} x="-19" y="-92" width="38" height="80" rx="7" fill="#fffdf6"/>
<path d="M0,-66c-8,-10 -20,-2 -13,7l13,11l13,-11c7,-9 -5,-17 -13,-7z" fill="#e2554f" ${T}/>
<text x="-15" y="-78" font-size="12" fill="#e2554f" font-family="serif" font-weight="bold">♥</text>
<circle ${S} cx="0" cy="-106" r="16" fill="#ffe6d4"/><path ${S} fill="#3a3046" d="M-17,-108C-15,-126 15,-126 17,-108C8,-114 -8,-114 -17,-108Z"/>
${eye(-6, -105, 3.8)}${eye(6, -105, 3.8)}${blush(-12, -98, 3.6)}${blush(12, -98, 3.6)}${smile(0, -97, 2.2)}
<path d="M-19,-60l-10,20M19,-60l10,20" ${S} fill="none"/><path d="M30,-116V-14" ${S}/><path d="M30,-118l-6,13h12z" fill="#c9d2dc" ${T}/>`;

  P.hatter = `
<path ${S} fill="#6aa86a" d="M-22,-4C-26,-34 -16,-52 0,-54C16,-52 26,-34 22,-4C8,2 -8,2 -22,-4Z"/>
<path ${T} fill="#fffdf6" d="M-6,-52H6L4,-26H-4Z"/><path ${T} fill="#e86a6a" d="M0,-50l-10,-6v12zM0,-50l10,-6v12z"/>
<path ${S} fill="#f4a04a" d="M-23,-78C-31,-70 -29,-58 -21,-56C-22,-64 -20,-71 -15,-76ZM23,-78C31,-70 29,-58 21,-56C22,-64 20,-71 15,-76Z"/>
<circle ${S} cx="0" cy="-76" r="23" fill="#ffe6d4"/>
<ellipse ${S} cx="0" cy="-95" rx="31" ry="6.5" fill="#5a4a6a"/><path ${S} fill="#5a4a6a" d="M-18,-97L-22,-141C-10,-147 10,-147 22,-141L18,-97Z"/>
<path d="M-19,-108H19" stroke="#e8a0b4" stroke-width="6"/><rect x="4" y="-134" width="13" height="10" fill="#fffdf6" ${T} transform="rotate(10 10 -129)"/>
${face(-75, 8.5, 5, 10)}<path d="M-6,-64Q0,-59 6,-64" fill="none" ${T}/>`;

  // ── 動物 ─────────────────────────────
  P.rabbit = `
<ellipse ${S} cx="-11" cy="-136" rx="8.5" ry="26" transform="rotate(-10 -11 -136)" fill="#fffdf8"/><ellipse cx="-11" cy="-133" rx="4" ry="18" transform="rotate(-10 -11 -133)" fill="#f8c0c4"/>
<ellipse ${S} cx="12" cy="-136" rx="8.5" ry="26" transform="rotate(13 12 -136)" fill="#fffdf8"/><ellipse cx="12" cy="-133" rx="4" ry="18" transform="rotate(13 12 -133)" fill="#f8c0c4"/>
<circle ${S} cx="-24" cy="-22" r="7" fill="#fffdf8"/>
<ellipse ${S} cx="0" cy="-34" rx="24" ry="30" fill="#fffdf8"/>
<path ${S} fill="#e2716b" d="M-18,-54C-20,-36 -16,-20 -10,-12C-4,-8 4,-8 10,-12C16,-20 20,-36 18,-54C8,-62 -8,-62 -18,-54Z"/>
<circle cx="0" cy="-44" r="2" fill="#f4cd4a"/><circle cx="0" cy="-33" r="2" fill="#f4cd4a"/><circle cx="0" cy="-22" r="2" fill="#f4cd4a"/>
<path ${T} fill="#5a8fd0" d="M0,-58l-9,-5v10zM0,-58l9,-5v10z"/><circle cx="0" cy="-58" r="2.4" fill="#5a8fd0"/>
<circle ${S} cx="0" cy="-84" r="25" fill="#fffdf8"/>
${eye(-9, -86, 5.2)}${eye(9, -86, 5.2)}${blush(-17, -76, 4.8)}${blush(17, -76, 4.8)}
<ellipse cx="0" cy="-77" rx="3.2" ry="2.4" fill="#f28a98"/><path d="M-4,-72q4,4 4,0q0,4 4,0" fill="none" ${T}/>
<path d="M-24,-80l-9,-2M-24,-76l-9,2M24,-80l9,-2M24,-76l9,2" ${T} fill="none"/>
<path ${S} fill="none" d="M18,-46C26,-40 28,-34 26,-28"/><circle ${S} cx="28" cy="-24" r="8" fill="#f4cd4a"/><circle cx="28" cy="-24" r="5" fill="#fff9e0" ${T}/>
<ellipse ${S} cx="-11" cy="-3" rx="11" ry="5" fill="#fffdf8"/><ellipse ${S} cx="11" cy="-3" rx="11" ry="5" fill="#fffdf8"/>`;

  P.mouse = `
<path d="M18,-8C36,-8 38,-24 30,-30" ${S} fill="none"/>
<ellipse ${S} cx="0" cy="-22" rx="20" ry="21" fill="#c9a07a"/><ellipse cx="0" cy="-18" rx="11" ry="12" fill="#f0dcc4"/>
<circle ${S} cx="-16" cy="-62" r="11" fill="#c9a07a"/><circle cx="-16" cy="-62" r="6.5" fill="#f6b8b4"/><circle ${S} cx="16" cy="-62" r="11" fill="#c9a07a"/><circle cx="16" cy="-62" r="6.5" fill="#f6b8b4"/>
<circle ${S} cx="0" cy="-46" r="17" fill="#d4ac84"/>
${eye(-6, -48, 4.2)}${eye(6, -48, 4.2)}${blush(-12, -40, 3.8)}${blush(12, -40, 3.8)}
<circle cx="0" cy="-40" r="2.6" fill="#e88a94"/>${smile(0, -36, 2.4)}<path d="M-14,-42l-9,-2M-14,-39l-9,2M14,-42l9,-2M14,-39l9,2" ${T} fill="none"/>
<ellipse ${T} cx="-8" cy="-2" rx="7" ry="3.5" fill="#d4ac84"/><ellipse ${T} cx="8" cy="-2" rx="7" ry="3.5" fill="#d4ac84"/>`;

  P.dormouse = `
<ellipse ${S} cx="0" cy="-18" rx="24" ry="18" fill="#d4ac84"/>
<circle ${S} cx="-15" cy="-33" r="8" fill="#d4ac84"/><circle cx="-15" cy="-33" r="4.4" fill="#f6b8b4"/><circle ${S} cx="15" cy="-33" r="8" fill="#d4ac84"/><circle cx="15" cy="-33" r="4.4" fill="#f6b8b4"/>
${sleep(-8, -20, 4)}${sleep(8, -20, 4)}${blush(-15, -13, 4)}${blush(15, -13, 4)}<circle cx="0" cy="-13" r="2.2" fill="#e88a94"/>
<path ${S} fill="#9fb6e8" d="M-12,-34C-8,-52 12,-56 24,-46C16,-46 12,-40 13,-32Z"/><circle ${T} cx="25" cy="-46" r="4" fill="#fffdf6"/>
<text x="16" y="-56" font-size="11" fill="#6b5ca0" font-family="serif">z z</text>`;

  P.hare = `
<ellipse ${S} cx="-10" cy="-112" rx="7.5" ry="22" transform="rotate(-14 -10 -112)" fill="#d8b48c"/><ellipse cx="-10" cy="-110" rx="3.6" ry="15" transform="rotate(-14 -10 -110)" fill="#f3c6b8"/>
<ellipse ${S} cx="11" cy="-112" rx="7.5" ry="22" transform="rotate(18 11 -112)" fill="#d8b48c"/><ellipse cx="11" cy="-110" rx="3.6" ry="15" transform="rotate(18 11 -110)" fill="#f3c6b8"/>
<path ${S} fill="#b88a64" d="M-22,-4C-26,-32 -16,-50 0,-52C16,-50 26,-32 22,-4C8,2 -8,2 -22,-4Z"/><ellipse cx="0" cy="-24" rx="11" ry="15" fill="#ead2b4"/>
<circle ${S} cx="0" cy="-74" r="22" fill="#d8b48c"/>
${eye(-8, -76, 5)}${eye(9, -75, 4.4)}${blush(-15, -66, 4.4)}${blush(16, -66, 4.4)}
<ellipse cx="0" cy="-67" rx="3" ry="2.3" fill="#e88a94"/>${smile(0, -62, 3)}
<path d="M-8,-94l4,-9M2,-96v-10M10,-94l-3,-9" stroke="#e8c048" stroke-width="2.6" stroke-linecap="round"/>
<path d="M-18,-40C-28,-30 -28,-22 -22,-18M18,-40C28,-30 28,-22 22,-18" ${S} fill="none"/>`;

  P.dodo = `
<path ${S} fill="#e8eef4" d="M-38,-34C-52,-40 -54,-26 -44,-22Z"/>
<path ${S} fill="#9fb6c8" d="M-36,-10C-46,-48 -24,-78 4,-76C32,-74 46,-44 34,-10C14,0 -16,0 -36,-10Z"/>
<ellipse cx="2" cy="-30" rx="22" ry="16" fill="#c4d6e2"/>
<path ${S} fill="#b9cddb" d="M-28,-44C-20,-62 4,-62 14,-44C4,-32 -16,-32 -28,-44Z"/>
<circle ${S} cx="10" cy="-92" r="23" fill="#9fb6c8"/>
<path ${S} fill="#f4cf6a" d="M-8,-94C-30,-97 -44,-86 -42,-77C-28,-77 -16,-81 -6,-86Z"/>
${eye(14, -96, 5.6)}${blush(22, -84, 4.6)}<path d="M8,-114c-2,-8 6,-10 6,-4c2,-6 8,-4 6,2" ${T} fill="none"/>
<path d="M-12,-8v8M10,-8v8M-18,0h12M4,0h12" stroke="#e8a24a" stroke-width="3" fill="none" stroke-linecap="round"/>`;

  P.pigeon = `
<ellipse ${S} cx="0" cy="-26" rx="26" ry="22" fill="#b9b0d8"/><ellipse cx="4" cy="-22" rx="14" ry="12" fill="#d8d2ec"/>
<path ${S} fill="#a29ac4" d="M-24,-30C-42,-36 -46,-20 -36,-14C-26,-12 -18,-20 -18,-26Z"/>
<circle ${S} cx="20" cy="-50" r="15" fill="#b9b0d8"/><path ${S} fill="#f0b24d" d="M33,-52L44,-48L33,-44Z"/>
${eye(22, -52, 4.4)}${blush(27, -43, 3.6)}<path d="M-6,-6v8M8,-6v8" stroke="#e8a24a" stroke-width="2.6" stroke-linecap="round"/>`;

  P.flamingo = `
<path d="M-6,-6V-60M8,-6V-52" stroke="#f08aa0" stroke-width="3.4" fill="none" stroke-linecap="round"/><path d="M-6,-60V-6M8,-52V-6" ${T} fill="none"/>
<path d="M-18,-4h12M-2,-4h12" ${S}/>
<ellipse ${S} cx="-4" cy="-70" rx="28" ry="18" fill="#f8b2c2"/><path d="M-26,-72C-14,-84 4,-82 10,-74" stroke="#f08aa0" stroke-width="3" fill="none"/>
<path d="M18,-78C38,-96 34,-126 20,-128" stroke="#f8b2c2" stroke-width="9" fill="none" stroke-linecap="round"/><path d="M18,-78C38,-96 34,-126 20,-128" ${S} fill="none" stroke-width="1.6"/>
<circle ${S} cx="18" cy="-132" r="12" fill="#f8b2c2"/>
<path ${S} fill="#fffdf6" d="M8,-134L-4,-126L8,-124Z"/><path ${T} fill="#3a3046" d="M-1,-128L-4,-126L1,-125Z"/>
${eye(20, -134, 3.8)}${blush(24, -126, 3.4)}`;

  P.hedgehog = `
<path ${S} fill="#9a7650" d="M-32,-4C-34,-14 -38,-16 -32,-22C-36,-30 -28,-34 -24,-38C-24,-46 -14,-48 -8,-50C-4,-58 6,-58 10,-52C16,-56 24,-50 24,-44C32,-44 36,-34 32,-28C38,-22 36,-12 30,-4Z"/>
<path ${S} fill="#f0d8b4" d="M-30,-4C-38,-14 -36,-30 -24,-32C-16,-30 -12,-18 -12,-4Z"/>
${eye(-24, -20, 3.6)}${blush(-20, -12, 3.4)}<circle cx="-34" cy="-16" r="2.6" fill="#3a2a20"/>`;

  P.baby = `
<path ${S} fill="#fbf2e2" d="M-26,-4C-34,-30 -22,-50 0,-52C22,-50 34,-30 26,-4C10,2 -10,2 -26,-4Z"/>
<path d="M-24,-28C-10,-20 10,-20 24,-28" stroke="#f0b4b4" stroke-width="3" fill="none"/>
<circle ${S} cx="0" cy="-64" r="21" fill="#f9c4cc"/>
<path ${S} fill="#f4a6b2" d="M-16,-76L-22,-92L-6,-82ZM16,-76L22,-92L6,-82Z"/>
${eye(-8, -68, 4.4)}${eye(8, -68, 4.4)}${blush(-14, -58, 4)}${blush(14, -58, 4)}
<ellipse ${S} cx="0" cy="-57" rx="8" ry="5.6" fill="#f4a0ae"/><circle cx="-3" cy="-57" r="1.5" fill="#8a3a4a"/><circle cx="3" cy="-57" r="1.5" fill="#8a3a4a"/>`;

  P.cat = `
<path d="M30,-12C52,-16 58,-40 44,-50" stroke="#c9a6e8" stroke-width="10" fill="none" stroke-linecap="round"/><path d="M30,-12C52,-16 58,-40 44,-50" ${S} fill="none" stroke-width="1.4"/>
<ellipse ${S} cx="0" cy="-30" rx="32" ry="29" fill="#c9a6e8"/>
<path d="M-28,-36h9M-30,-24h9M20,-40h9M22,-26h9" stroke="#a283d6" stroke-width="3.4" stroke-linecap="round"/>
<ellipse ${S} cx="-12" cy="-4" rx="9" ry="5" fill="#d8bff0"/><ellipse ${S} cx="12" cy="-4" rx="9" ry="5" fill="#d8bff0"/>
<path ${S} fill="#c9a6e8" d="M-28,-86L-26,-112L-8,-98ZM28,-86L26,-112L8,-98Z"/><path fill="#f8c0d0" d="M-24,-92L-23,-106L-13,-98ZM24,-92L23,-106L13,-98Z"/>
<ellipse ${S} cx="0" cy="-76" rx="32" ry="26" fill="#c9a6e8"/><path d="M-6,-100v6M0,-101v7M6,-100v6" stroke="#a283d6" stroke-width="2.6" stroke-linecap="round"/>
${goldEye(-12, -80)}${goldEye(12, -80)}${blush(-22, -68, 4.6)}${blush(22, -68, 4.6)}
<path ${T} fill="#fffdf6" d="M-18,-66C-9,-55 9,-55 18,-66C9,-62 -9,-62 -18,-66Z"/><path d="M-9,-62v4M-3,-61v5M3,-61v5M9,-62v4" stroke="${INK}" stroke-width="1"/>`;

  P.grin = `
<path ${S} fill="#fffdf6" d="M-32,-16C-18,4 18,4 32,-16C18,-8 -18,-8 -32,-16Z"/><path d="M-20,-11v6M-10,-8v8M0,-8v8M10,-8v8M20,-11v6" stroke="${INK}" stroke-width="1.2"/>
${goldEye(-14, -34)}${goldEye(14, -34)}${blush(-26, -22, 4.4)}${blush(26, -22, 4.4)}`;

  P.caterpillar = `
<circle ${S} cx="-46" cy="-18" r="14" fill="#9ad88e"/><circle ${S} cx="-22" cy="-21" r="17" fill="#a8e09a"/><circle ${S} cx="6" cy="-24" r="19" fill="#9ad88e"/>
<circle cx="-46" cy="-24" r="3" fill="#f8e07a"/><circle cx="-22" cy="-28" r="3.4" fill="#f8e07a"/><circle cx="6" cy="-32" r="3.6" fill="#f8e07a"/>
<circle ${S} cx="40" cy="-46" r="24" fill="#b4e8a6"/>
<path d="M30,-68l-5,-12M48,-68l5,-12" ${S} fill="none"/><circle ${T} cx="25" cy="-81" r="3.6" fill="#f7a1b0"/><circle ${T} cx="53" cy="-81" r="3.6" fill="#f7a1b0"/>
${eye(32, -48, 5)}${eye(48, -48, 5)}${blush(25, -38, 4.2)}${blush(56, -38, 4.2)}${smile(40, -36, 3)}
<path ${S} fill="none" d="M60,-34c10,0 14,-8 24,-8"/><rect ${S} x="82" y="-52" width="11" height="14" rx="3" fill="#c8a574"/>
<path d="M88,-56c-4,-8 6,-12 2,-20" stroke="#d8d8e4" stroke-width="4" fill="none" stroke-linecap="round" opacity=".8"/>`;

  // ── 特別なキャラクター ─────────────────────────────
  P.dinah = `
<path d="M28,-8C50,-10 56,-34 44,-50" stroke="#fffdf6" stroke-width="9" fill="none" stroke-linecap="round"/><path d="M28,-8C50,-10 56,-34 44,-50" ${S} fill="none" stroke-width="1.4"/>
<path ${S} fill="#fffdf6" d="M-28,-4C-36,-34 -20,-58 0,-58C20,-58 36,-34 28,-4C10,2 -10,2 -28,-4Z"/>
<path fill="#f4b064" d="M-24,-28C-22,-46 -8,-54 -2,-52C-12,-42 -10,-32 -14,-18Z"/>
<ellipse ${S} cx="-10" cy="-3" rx="8" ry="4.6" fill="#fffdf6"/><ellipse ${S} cx="10" cy="-3" rx="8" ry="4.6" fill="#fffdf6"/>
<path ${S} fill="#fffdf6" d="M-24,-80L-24,-100L-10,-90ZM24,-80L24,-100L10,-90Z"/><path fill="#f8c0d0" d="M-21,-84L-21,-95L-13,-89ZM21,-84L21,-95L13,-89Z"/>
<ellipse ${S} cx="0" cy="-70" rx="27" ry="22" fill="#fffdf6"/><path fill="#f4b064" d="M-26,-74C-22,-90 -6,-92 -4,-86C-12,-82 -16,-76 -20,-66Z"/><path fill="#4a4050" d="M12,-90C24,-88 28,-78 26,-70C18,-74 12,-80 12,-90Z"/>
${eye(-9, -72, 5)}${eye(9, -72, 5)}${blush(-17, -62, 4.2)}${blush(17, -62, 4.2)}
<path d="M-3,-64l3,3l3,-3Z" fill="#e58a8a" ${T}/><path d="M-3,-59q3,3 3,0q0,3 3,0" fill="none" ${T}/>
<path d="M-12,-50Q0,-45 12,-50" stroke="#e2554f" stroke-width="4" fill="none"/><circle cx="0" cy="-46" r="3" fill="#f4cd4a" ${T}/>`;

  P.bill = `
<path d="M14,-8C40,-6 46,-30 34,-38" stroke="#9cd488" stroke-width="7" fill="none" stroke-linecap="round"/><path d="M14,-8C40,-6 46,-30 34,-38" ${S} fill="none" stroke-width="1.4"/>
<path ${S} fill="#9cd488" d="M-18,-4C-24,-32 -14,-54 0,-56C14,-54 22,-32 16,-4C6,2 -8,2 -18,-4Z"/><ellipse cx="-1" cy="-26" rx="10" ry="16" fill="#eef0b4"/>
<ellipse ${S} cx="0" cy="-74" rx="24" ry="20" fill="#9cd488"/>
<circle ${S} cx="-10" cy="-86" r="9" fill="#9cd488"/><circle ${S} cx="10" cy="-86" r="9" fill="#9cd488"/>${eye(-10, -86, 5)}${eye(10, -86, 5)}
${blush(-17, -70, 4.2)}${blush(17, -70, 4.2)}${smile(0, -68, 4)}
<path d="M-18,-44C-28,-36 -28,-28 -22,-24M16,-44C26,-36 26,-28 20,-24" ${S} fill="none"/>
<ellipse ${T} cx="-8" cy="-2" rx="8" ry="3.4" fill="#9cd488"/><ellipse ${T} cx="8" cy="-2" rx="8" ry="3.4" fill="#9cd488"/>`;

  P.turtle = `
<path ${S} fill="#b4cc9c" d="M-40,-28C-54,-26 -54,-14 -44,-12Z"/>
<ellipse ${S} cx="-4" cy="-28" rx="38" ry="26" fill="#9cbc84"/><path d="M-34,-28h60M-18,-50L-24,-8M10,-50L16,-8M-4,-54V-4" stroke="#7a9a66" stroke-width="2.4" fill="none"/>
<ellipse ${S} cx="-28" cy="-4" rx="11" ry="5" fill="#b4cc9c"/><ellipse ${S} cx="18" cy="-4" rx="11" ry="5" fill="#b4cc9c"/>
<circle ${S} cx="42" cy="-36" r="18" fill="#b4cc9c"/>
${eye(36, -38, 4.6)}${eye(49, -38, 4.6)}<path d="M38,-32q-1,6 0,10" stroke="#6fb7e8" stroke-width="2.4" fill="none" stroke-linecap="round"/>${blush(32, -28, 3.6)}${blush(53, -28, 3.6)}
<path d="M38,-25Q42,-28 46,-25" fill="none" ${T}/><path ${T} fill="#5a8fd0" d="M42,-54l-7,-5v10zM42,-54l7,-5v10z"/>`;

  P.gryphon = `
<path ${S} fill="#f0c46a" d="M-30,-4C-38,-28 -26,-48 -4,-50C18,-50 32,-32 26,-4C8,4 -12,4 -30,-4Z"/>
<path d="M26,-14C46,-16 50,-38 40,-46" stroke="#f0c46a" stroke-width="6" fill="none" stroke-linecap="round"/><path d="M26,-14C46,-16 50,-38 40,-46" ${S} fill="none" stroke-width="1.4"/><circle ${T} cx="41" cy="-49" r="6" fill="#d88a3a"/>
<path ${S} fill="#fffdf6" d="M-16,-44C-46,-54 -58,-82 -40,-90C-34,-72 -22,-60 -6,-54Z"/>
<circle ${S} cx="4" cy="-70" r="22" fill="#fffdf6"/><path ${S} fill="#f4cd4a" d="M22,-74L38,-68L22,-60Z"/>
${eye(-2, -74, 4.8)}${eye(12, -74, 4.8)}${blush(-8, -64, 3.8)}${blush(18, -64, 3.8)}
<path ${T} fill="#fffdf6" d="M-6,-88L-10,-100L2,-92Z"/><path ${T} fill="#fffdf6" d="M8,-90L10,-102L18,-92Z"/>
<path d="M-14,-6v8M10,-6v8" ${S} fill="none" stroke-width="3"/>`;

  P.frog = `
<path ${S} fill="#4a6fb4" d="M-22,-4C-26,-30 -16,-50 0,-52C16,-50 26,-30 22,-4C8,2 -8,2 -22,-4Z"/><path ${T} fill="#fffdf6" d="M-6,-50L6,-50L4,-20L-4,-20Z"/>
<circle cx="0" cy="-40" r="2" fill="#f4cd4a"/><circle cx="0" cy="-31" r="2" fill="#f4cd4a"/>
<g fill="#fffdf6" ${T}><circle cx="-24" cy="-82" r="7"/><circle cx="-28" cy="-72" r="6"/><circle cx="24" cy="-82" r="7"/><circle cx="28" cy="-72" r="6"/></g>
<ellipse ${S} cx="0" cy="-68" rx="24" ry="18" fill="#9cd488"/>
<circle ${S} cx="-12" cy="-84" r="9" fill="#9cd488"/><circle ${S} cx="12" cy="-84" r="9" fill="#9cd488"/>${eye(-12, -84, 5)}${eye(12, -84, 5)}
${blush(-16, -64, 4.4)}${blush(16, -64, 4.4)}<path d="M-10,-62Q0,-55 10,-62" fill="none" ${S}/>
<ellipse ${T} cx="-10" cy="-2" rx="10" ry="4" fill="#9cd488"/><ellipse ${T} cx="10" cy="-2" rx="10" ry="4" fill="#9cd488"/>`;

  P.bat = `
<path ${S} fill="#7d6a92" d="M0,-30C-8,-52 -34,-56 -46,-40C-38,-42 -34,-36 -30,-32C-26,-38 -20,-34 -16,-28C-10,-34 -6,-30 0,-26C6,-30 10,-34 16,-28C20,-34 26,-38 30,-32C34,-36 38,-42 46,-40C34,-56 8,-52 0,-30Z"/>
<ellipse ${S} cx="0" cy="-26" rx="10" ry="12" fill="#9d8ab4"/>
<path ${S} fill="#9d8ab4" d="M-9,-50L-12,-64L-3,-55ZM9,-50L12,-64L3,-55Z"/><circle ${S} cx="0" cy="-44" r="11" fill="#9d8ab4"/>
${eye(-4.5, -45, 3.4)}${eye(4.5, -45, 3.4)}${blush(-8, -39, 2.8)}${blush(8, -39, 2.8)}<path d="M-3,-38l1.5,2.4l1.5,-2.4" ${T} fill="#fffdf6"/>`;

  P.owl = `
<path ${S} fill="#b88a5a" d="M-24,-4C-34,-32 -22,-60 0,-62C22,-60 34,-32 24,-4C8,2 -8,2 -24,-4Z"/><path ${T} fill="#f0dcb4" d="M-13,-46C-13,-28 -6,-12 0,-8C6,-12 13,-28 13,-46C6,-40 -6,-40 -13,-46Z"/>
<path ${S} fill="#b88a5a" d="M-21,-82L-24,-98L-10,-88ZM21,-82L24,-98L10,-88Z"/>
<ellipse ${S} cx="0" cy="-72" rx="24" ry="20" fill="#b88a5a"/>
<circle ${S} cx="-9" cy="-74" r="9" fill="#fffdf6"/><circle ${S} cx="9" cy="-74" r="9" fill="#fffdf6"/>${eye(-9, -74, 4.6)}${eye(9, -74, 4.6)}<path d="M-18,-75H-25M0,-75H0M18,-75H25" ${T}/>
${blush(-16, -62, 3.8)}${blush(16, -62, 3.8)}<path ${T} fill="#f0b24d" d="M-3,-66L3,-66L0,-60Z"/>
<path ${S} fill="#3a3046" d="M-17,-90L0,-98L17,-90L0,-84Z"/><path d="M14,-91v9" stroke="#f4cd4a" stroke-width="2.4"/>`;
  P.butterfly = `
<path ${S} fill="#7fb6f0" d="M0,-30C-20,-60 -52,-54 -44,-30C-40,-14 -12,-12 0,-26Z"/><path ${S} fill="#f6a07a" d="M0,-30C20,-60 52,-54 44,-30C40,-14 12,-12 0,-26Z"/>
<circle cx="-28" cy="-36" r="6" fill="#fff6d0"/><circle cx="28" cy="-36" r="6" fill="#fff6d0"/><circle cx="-34" cy="-24" r="3" fill="#fff6d0"/><circle cx="34" cy="-24" r="3" fill="#fff6d0"/>
<ellipse ${S} cx="0" cy="-26" rx="4.6" ry="13" fill="#6b5a7a"/><circle ${S} cx="0" cy="-44" r="7" fill="#6b5a7a"/>
<circle cx="-2.4" cy="-45" r="1.6" fill="#fff"/><circle cx="2.4" cy="-45" r="1.6" fill="#fff"/>
<path d="M-2,-50C-6,-60 -10,-60 -12,-64M2,-50C6,-60 10,-60 12,-64" ${T} fill="none"/><circle cx="-12" cy="-64" r="2" fill="#f7a1b0"/><circle cx="12" cy="-64" r="2" fill="#f7a1b0"/>`;
})();
