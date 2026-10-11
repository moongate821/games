/*
 * アリスの挿絵 ― 小道具(props)。すべて SVG の断片で、原点は「足もと・中央」(0,0)。上へ伸びる(y がマイナス)。
 * 絵の中の物としてさわれるのも、飾りとして置くのも、ポケットの絵も、これを使う。
 */
(function () {
  "use strict";
  const INK = "#4b3326";
  const ln = (w) => `stroke="${INK}" stroke-width="${w}" stroke-linejoin="round" stroke-linecap="round"`;
  const S = ln(2.4), T = ln(1.5), B = ln(3.4);
  const P = {};

  // ── 人 ─────────────────────────────
  P.alice = `
<path ${S} fill="#f2c85b" d="M-24,-118C-38,-154 38,-154 24,-118C33,-96 31,-76 26,-66L-26,-66C-31,-76 -33,-96 -24,-118Z"/>
<rect ${T} x="-12" y="-34" width="9" height="28" fill="#fffdf6"/><rect ${T} x="3" y="-34" width="9" height="28" fill="#fffdf6"/>
<path d="M-12,-27h9M-12,-20h9M-12,-13h9M3,-27h9M3,-20h9M3,-13h9" stroke="#7d93c0" stroke-width="2.2"/>
<ellipse ${T} cx="-8" cy="-5" rx="10" ry="5.5" fill="#2d2a38"/><ellipse ${T} cx="8" cy="-5" rx="10" ry="5.5" fill="#2d2a38"/>
<path ${S} fill="#8cc1e8" d="M-18,-92L18,-92L36,-30C12,-23 -12,-23 -36,-30Z"/>
<path ${T} fill="#fffdf6" d="M-11,-92L11,-92L21,-31C8,-27 -8,-27 -21,-31Z"/>
<path d="M-17,-72H17" stroke="#5b86b8" stroke-width="6"/>
<path ${S} fill="none" d="M-20,-88C-34,-74 -36,-60 -31,-50M20,-88C34,-74 36,-60 31,-50"/>
<circle cx="-18" cy="-88" r="9" fill="#8cc1e8" ${T}/><circle cx="18" cy="-88" r="9" fill="#8cc1e8" ${T}/>
<circle cx="-31" cy="-49" r="5" fill="#fde4d0" ${T}/><circle cx="31" cy="-49" r="5" fill="#fde4d0" ${T}/>
<ellipse ${S} cx="0" cy="-104" rx="19" ry="20" fill="#fde4d0"/>
<path ${T} fill="#f2c85b" d="M-20,-108C-12,-132 12,-132 20,-108C11,-117 -11,-117 -20,-108Z"/>
<path d="M-19,-113C-9,-130 9,-130 19,-113" stroke="#2f3b66" stroke-width="5" fill="none" stroke-linecap="round"/>
<circle cx="-7" cy="-102" r="2.3" fill="#3a2a20"/><circle cx="7" cy="-102" r="2.3" fill="#3a2a20"/>
<circle cx="-13" cy="-96" r="4" fill="#f6a9a0" opacity=".65"/><circle cx="13" cy="-96" r="4" fill="#f6a9a0" opacity=".65"/>
<path d="M-4,-94Q0,-90 4,-94" fill="none" ${T}/>`;

  P.sister = `
<path ${S} fill="#e9b6c0" d="M-26,-6C-30,-50 -22,-80 0,-84C22,-80 30,-50 26,-6C10,2 -10,2 -26,-6Z"/>
<path ${T} fill="#fff4f0" d="M-10,-80L10,-80L14,-48L-14,-48Z"/>
<ellipse ${S} cx="0" cy="-100" rx="15" ry="16" fill="#fde4d0"/>
<path ${S} fill="#7a4d36" d="M-17,-102C-20,-124 20,-124 17,-102C18,-86 14,-80 10,-84C14,-100 6,-112 0,-112C-6,-112 -14,-100 -10,-84C-14,-80 -18,-86 -17,-102Z"/>
<circle cx="-5" cy="-98" r="1.8" fill="#3a2a20"/><circle cx="5" cy="-98" r="1.8" fill="#3a2a20"/>
<path ${S} fill="#fffaf0" d="M-26,-58L2,-52L2,-30L-26,-36Z"/><path ${S} fill="#fffaf0" d="M30,-58L2,-52L2,-30L30,-36Z"/>
<path d="M-20,-52L-4,-48M-20,-46L-4,-42M8,-48L24,-52M8,-42L24,-46" stroke="#b9a37c" stroke-width="1.2" fill="none"/>`;

  P.rabbit = `
<ellipse ${S} cx="-8" cy="-146" rx="7.5" ry="26" transform="rotate(-9 -8 -146)" fill="#fffdf8"/>
<ellipse cx="-8" cy="-146" rx="3.6" ry="19" transform="rotate(-9 -8 -146)" fill="#f6b8b4"/>
<ellipse ${S} cx="11" cy="-146" rx="7.5" ry="26" transform="rotate(12 11 -146)" fill="#fffdf8"/>
<ellipse cx="11" cy="-146" rx="3.6" ry="19" transform="rotate(12 11 -146)" fill="#f6b8b4"/>
<ellipse ${S} cx="0" cy="-48" rx="27" ry="40" fill="#fffdf8"/>
<path ${S} fill="#6fa8c8" d="M-21,-70L-8,-38L-13,-10C-4,-6 4,-6 13,-10L8,-38L21,-70C10,-82 -10,-82 -21,-70Z"/>
<circle cx="0" cy="-52" r="2" fill="#2f4d68"/><circle cx="0" cy="-38" r="2" fill="#2f4d68"/><circle cx="0" cy="-24" r="2" fill="#2f4d68"/>
<ellipse ${S} cx="0" cy="-100" rx="21" ry="19" fill="#fffdf8"/>
<circle cx="-8" cy="-103" r="2.8" fill="#c43c4a"/><circle cx="8" cy="-103" r="2.8" fill="#c43c4a"/>
<ellipse cx="0" cy="-95" rx="3.5" ry="2.6" fill="#f08a96"/>
<path d="M-4,-90Q0,-86 4,-90M-24,-96l-12,-3M-24,-92l-12,2M24,-96l12,-3M24,-92l12,2" ${T} fill="none"/>
<path d="M0,-82l-8,6l8,4l8,-4z" fill="#d9564b" ${T}/>
<path ${T} fill="none" d="M20,-62C34,-52 34,-40 30,-34"/>
<circle ${S} cx="30" cy="-30" r="10" fill="#f0c24d"/><circle cx="30" cy="-30" r="6.5" fill="#fff7d6" ${T}/><path d="M30,-30V-35M30,-30L34,-28" ${T} fill="none"/>
<ellipse ${S} cx="-12" cy="-3" rx="13" ry="6" fill="#fffdf8"/><ellipse ${S} cx="12" cy="-3" rx="13" ry="6" fill="#fffdf8"/>`;

  P.sister_sit = P.sister;

  P.duchess = `
<path ${S} fill="#5c8f6b" d="M-34,-4C-40,-60 -26,-96 0,-100C26,-96 40,-60 34,-4C12,4 -12,4 -34,-4Z"/>
<path ${T} fill="#f3e6c4" d="M-14,-96L14,-96L10,-60L-10,-60Z"/>
<ellipse ${S} cx="0" cy="-118" rx="22" ry="22" fill="#f4d3b6"/>
<path ${S} fill="#a8508a" d="M-40,-132C-30,-146 30,-146 40,-132C34,-128 -34,-128 -40,-132ZM-22,-134C-20,-168 20,-168 22,-134Z"/>
<circle cx="-8" cy="-118" r="2.2" fill="#3a2a20"/><circle cx="8" cy="-118" r="2.2" fill="#3a2a20"/>
<path d="M-8,-108Q0,-103 8,-108" ${T} fill="none"/><ellipse cx="0" cy="-113" rx="4" ry="3.3" fill="#e9a58f"/>`;

  P.queen = `
<path ${S} fill="#d9433f" d="M-44,-4C-50,-60 -30,-100 0,-104C30,-100 50,-60 44,-4C14,6 -14,6 -44,-4Z"/>
<path ${T} fill="#fffdf6" d="M-18,-100L18,-100L14,-60L0,-40L-14,-60Z"/>
<path fill="#d9433f" d="M0,-92c-6,-8 -16,-2 -10,6l10,10l10,-10c6,-8 -4,-14 -10,-6z" ${T}/>
<ellipse ${S} cx="0" cy="-126" rx="24" ry="24" fill="#f4d3b6"/>
<path ${S} fill="#f0c24d" d="M-24,-142L-24,-168L-12,-154L0,-172L12,-154L24,-168L24,-142Z"/>
<circle cx="-12" cy="-154" r="2.4" fill="#d9433f"/><circle cx="12" cy="-154" r="2.4" fill="#d9433f"/>
<path d="M-14,-132L-6,-128M14,-132L6,-128" ${S} fill="none"/><circle cx="-8" cy="-125" r="2.2" fill="#3a2a20"/><circle cx="8" cy="-125" r="2.2" fill="#3a2a20"/>
<path d="M-8,-112Q0,-120 8,-112Q0,-108 -8,-112Z" ${T} fill="#9d2433"/>
<path ${S} fill="none" d="M-44,-70C-60,-80 -62,-96 -56,-104M44,-70C60,-80 62,-96 56,-104"/>`;

  P.king = `
<path ${S} fill="#6d4aa8" d="M-28,-4C-32,-50 -20,-80 0,-84C20,-80 32,-50 28,-4C10,3 -10,3 -28,-4Z"/>
<path ${T} fill="#fffdf6" d="M-14,-80L14,-80L10,-50L-10,-50Z"/><path ${T} d="M-12,-72l2,3l2,-3l2,3l2,-3l2,3l2,-3l2,3" stroke="#6d4aa8" fill="none"/>
<ellipse ${S} cx="0" cy="-102" rx="17" ry="17" fill="#f4d3b6"/>
<path ${S} fill="#f0c24d" d="M-17,-114L-17,-134L-8,-124L0,-138L8,-124L17,-134L17,-114Z"/>
<circle cx="-6" cy="-102" r="2" fill="#3a2a20"/><circle cx="6" cy="-102" r="2" fill="#3a2a20"/><path d="M-6,-92Q0,-96 6,-92" ${T} fill="none"/>
<path d="M-14,-88C-8,-80 8,-80 14,-88" fill="#f5f0e6" ${T}/>`;

  P.jack = `
<path ${S} fill="#c9433f" d="M-22,-8C-26,-44 -18,-70 0,-72C18,-70 26,-44 22,-8C8,0 -8,0 -22,-8Z"/>
<path d="M-10,-70L10,-70L8,-30L-8,-30Z" fill="#f0c24d" ${T}/>
<ellipse ${S} cx="0" cy="-90" rx="15" ry="16" fill="#f4d3b6"/>
<path ${S} fill="#2d2a38" d="M-16,-94C-10,-112 10,-112 16,-94L8,-100L-8,-100Z"/>
<circle cx="-5" cy="-88" r="1.8" fill="#3a2a20"/><circle cx="5" cy="-88" r="1.8" fill="#3a2a20"/><path d="M-4,-80Q0,-77 4,-80" ${T} fill="none"/>
<path d="M-24,-60l-14,18M24,-60l14,18" ${S}/><circle cx="-38" cy="-42" r="3.5" fill="#8a7a6a"/><circle cx="38" cy="-42" r="3.5" fill="#8a7a6a"/>`;

  P.soldier = `
<rect ${S} x="-17" y="-100" width="34" height="86" rx="5" fill="#fffdf6"/>
<path d="M0,-74c-8,-10 -22,-2 -14,8l14,12l14,-12c8,-10 -6,-18 -14,-8z" fill="#c43c4a" ${T}/>
<text x="-13" y="-84" font-size="13" font-family="serif" fill="#c43c4a" font-weight="bold">♥</text>
<circle ${S} cx="0" cy="-114" r="13" fill="#f4d3b6"/><path ${S} fill="#2d2a38" d="M-14,-116C-10,-132 10,-132 14,-116Z"/>
<circle cx="-4" cy="-112" r="1.6" fill="#3a2a20"/><circle cx="4" cy="-112" r="1.6" fill="#3a2a20"/>
<path d="M-17,-70l-14,40M17,-70l14,40M-8,-14v14M8,-14v14" ${S} fill="none"/><path d="M30,-120V-10" ${S}/><path d="M30,-120l-6,14h12z" fill="#aab4bd" ${T}/>`;

  P.hatter = `
<path ${S} fill="#7a4aa0" d="M-26,-4C-30,-44 -20,-76 0,-78C20,-76 30,-44 26,-4C10,3 -10,3 -26,-4Z"/>
<path ${T} fill="#d9564b" d="M-8,-76L0,-62L8,-76L5,-68L-5,-68Z"/>
<ellipse ${S} cx="0" cy="-96" rx="17" ry="17" fill="#f4d3b6"/>
<path ${S} fill="#3f3a4d" d="M-28,-108H28L22,-112H-22ZM-17,-110L-15,-148H15L17,-110Z"/><path d="M-15,-122H15" stroke="#d9564b" stroke-width="6"/>
<rect x="0" y="-138" width="14" height="10" fill="#fffdf6" ${T} transform="rotate(8 0 -138)"/>
<circle cx="-6" cy="-96" r="2" fill="#3a2a20"/><circle cx="6" cy="-96" r="2" fill="#3a2a20"/><path d="M-7,-86Q0,-81 7,-86" ${T} fill="none"/>
<path d="M-20,-92C-26,-86 -28,-80 -24,-76M20,-92C26,-86 28,-80 24,-76" ${T} fill="#f5a24d" stroke="#f5a24d"/>`;

  P.hare = `
<ellipse ${S} cx="-9" cy="-126" rx="6.5" ry="22" transform="rotate(-12 -9 -126)" fill="#d9c0a0"/>
<ellipse ${S} cx="10" cy="-126" rx="6.5" ry="22" transform="rotate(14 10 -126)" fill="#d9c0a0"/>
<path ${S} fill="#a87858" d="M-24,-4C-28,-44 -18,-74 0,-76C18,-74 28,-44 24,-4C10,3 -10,3 -24,-4Z"/>
<ellipse ${S} cx="0" cy="-92" rx="18" ry="17" fill="#d9c0a0"/>
<circle cx="-6" cy="-94" r="2.2" fill="#3a2a20"/><circle cx="6" cy="-94" r="2.2" fill="#3a2a20"/><ellipse cx="0" cy="-87" rx="3" ry="2.4" fill="#c4776f"/>
<path d="M-4,-82Q0,-79 4,-82" ${T} fill="none"/><path d="M-18,-70C-30,-56 -30,-46 -24,-42M18,-70C30,-56 30,-46 24,-42" ${S} fill="none"/>
<path d="M-12,-108C-6,-120 6,-120 12,-108" fill="#6fae5e" ${T}/><path d="M-10,-112l3,-8M0,-116v-9M10,-112l-3,-8" stroke="#e0b030" stroke-width="2"/>`;

  P.dormouse = `
<ellipse ${S} cx="0" cy="-16" rx="22" ry="16" fill="#c99a6b"/><ellipse ${S} cx="-14" cy="-30" rx="7" ry="8" fill="#c99a6b"/><ellipse ${S} cx="14" cy="-30" rx="7" ry="8" fill="#c99a6b"/>
<ellipse cx="-14" cy="-30" rx="3.5" ry="4.5" fill="#f2b8b0"/><ellipse cx="14" cy="-30" rx="3.5" ry="4.5" fill="#f2b8b0"/>
<path d="M-9,-20Q-6,-17 -3,-20M3,-20Q6,-17 9,-20" ${T} fill="none"/><ellipse cx="0" cy="-12" rx="3" ry="2.3" fill="#c4776f"/>
<text x="12" y="-44" font-size="12" fill="#6b5ca0" font-family="serif">z z</text>`;

  P.mouse = `
<ellipse ${S} cx="0" cy="-26" rx="22" ry="26" fill="#b98f6a"/>
<ellipse ${S} cx="-13" cy="-56" rx="9" ry="10" fill="#b98f6a"/><ellipse ${S} cx="13" cy="-56" rx="9" ry="10" fill="#b98f6a"/>
<ellipse cx="-13" cy="-56" rx="5" ry="6" fill="#f2b8b0"/><ellipse cx="13" cy="-56" rx="5" ry="6" fill="#f2b8b0"/>
<ellipse ${S} cx="0" cy="-44" rx="15" ry="14" fill="#c9a07a"/>
<circle cx="-6" cy="-47" r="2.2" fill="#3a2a20"/><circle cx="6" cy="-47" r="2.2" fill="#3a2a20"/><ellipse cx="0" cy="-39" rx="3.4" ry="2.6" fill="#c4776f"/>
<path d="M-4,-35Q0,-32 4,-35M-16,-42l-12,-2M-16,-38l-12,3M16,-42l12,-2M16,-38l12,3" ${T} fill="none"/>
<path d="M18,-4C38,-6 40,-22 34,-30" ${S} fill="none"/><ellipse ${T} cx="-9" cy="-3" rx="8" ry="4" fill="#c9a07a"/><ellipse ${T} cx="9" cy="-3" rx="8" ry="4" fill="#c9a07a"/>`;

  P.dodo = `
<path ${S} fill="#8aa3b4" d="M-40,-10C-52,-58 -26,-96 4,-92C34,-88 52,-52 36,-10C14,2 -16,2 -40,-10Z"/>
<path ${S} fill="#a8c0cf" d="M-30,-34C-20,-60 14,-60 28,-34C12,-22 -14,-22 -30,-34Z"/>
<path ${S} fill="#8aa3b4" d="M4,-92C0,-118 -2,-132 -6,-142C4,-148 14,-146 18,-136C22,-122 18,-104 12,-92Z"/>
<path ${S} fill="#f0c24d" d="M-6,-136C-24,-136 -42,-124 -48,-112C-34,-114 -20,-114 -6,-122Z"/>
<circle cx="6" cy="-134" r="3" fill="#3a2a20"/><circle cx="7" cy="-135" r="1" fill="#fff"/>
<path d="M-22,-92C-30,-98 -36,-92 -34,-84" ${T} fill="none"/><path d="M-14,-8v12M10,-8v12M-20,4h14M4,4h14" ${S} fill="none"/>
<path d="M-34,-60C-48,-50 -50,-38 -40,-30" ${S} fill="#8aa3b4"/>`;

  P.pigeon = `
<ellipse ${S} cx="0" cy="-32" rx="26" ry="22" fill="#a9a2c0"/><circle ${S} cx="22" cy="-52" r="14" fill="#a9a2c0"/>
<path ${S} fill="#f0b24d" d="M34,-54L48,-50L34,-46Z"/><circle cx="26" cy="-56" r="2.6" fill="#3a2a20"/>
<path ${S} fill="#8d86aa" d="M-26,-34C-44,-40 -50,-26 -40,-16C-30,-14 -20,-22 -18,-30Z"/><path d="M-6,-12v12M8,-12v12" ${S}/>
<path d="M10,-42C16,-36 24,-36 30,-42" stroke="#e9e3d0" stroke-width="5" fill="none"/>`;

  P.egg = `<ellipse ${S} cx="0" cy="-20" rx="15" ry="19" fill="#bfe3e2"/><circle cx="-5" cy="-26" r="2" fill="#7fb6b4"/><circle cx="5" cy="-15" r="2.4" fill="#7fb6b4"/><circle cx="-2" cy="-10" r="1.6" fill="#7fb6b4"/>`;

  P.flamingo = `
<path d="M-6,-6V-70M8,-6V-60" ${S} fill="none" stroke-width="3.2"/><path d="M-18,-6h14M-2,-6h14" ${S}/>
<path ${S} fill="#f3a6b4" d="M-30,-70C-30,-100 6,-110 30,-92C34,-76 10,-56 -8,-60C-22,-60 -30,-62 -30,-70Z"/>
<path ${S} fill="none" d="M26,-94C46,-114 44,-148 20,-150C8,-152 4,-142 8,-136" stroke-width="7" stroke="#f3a6b4"/>
<path ${S} fill="none" d="M26,-94C46,-114 44,-148 20,-150C8,-152 4,-142 8,-136"/>
<path ${S} fill="#2d2a38" d="M4,-142L-6,-134L8,-132Z"/><path ${S} fill="#fffdf6" d="M-2,-142L-6,-134L4,-134Z"/><circle cx="14" cy="-146" r="2" fill="#3a2a20"/>
<path d="M-30,-72C-20,-86 -6,-84 0,-76" stroke="#e57f93" stroke-width="3" fill="none"/>`;

  P.hedgehog = `
<path ${S} fill="#7d6144" d="M-30,-4C-38,-30 -22,-52 0,-52C22,-52 38,-30 30,-4Z"/>
<path d="M-26,-30l-8,-6M-18,-42l-6,-8M-6,-48l-2,-9M8,-48l2,-9M20,-42l6,-8M28,-30l8,-6" ${S} fill="none"/>
<path ${S} fill="#e7c9a4" d="M-30,-4C-36,-14 -34,-24 -26,-26C-20,-22 -16,-10 -16,-4Z"/><circle cx="-26" cy="-17" r="2" fill="#3a2a20"/><circle cx="-33" cy="-12" r="2.4" fill="#3a2a20"/>`;

  P.cat = `
<path ${S} fill="#b79bd6" d="M-46,-8C-52,-46 -30,-70 0,-70C30,-70 50,-44 44,-8C20,2 -22,2 -46,-8Z"/>
<path d="M-38,-40h14M-34,-26h12M26,-52h14M30,-36h12M10,-66l-2,12M-8,-66l2,12" stroke="#7d5fa6" stroke-width="3" fill="none" stroke-linecap="round"/>
<path ${S} fill="#b79bd6" d="M44,-14C64,-16 74,-34 66,-52"/><path d="M44,-14C64,-16 74,-34 66,-52" ${S} fill="none" stroke-width="7" stroke="#b79bd6"/><path d="M44,-14C64,-16 74,-34 66,-52" ${S} fill="none"/>
<path ${S} fill="#b79bd6" d="M-30,-86C-30,-110 30,-110 30,-86C30,-64 -30,-64 -30,-86Z"/>
<path ${S} fill="#b79bd6" d="M-28,-98L-26,-120L-12,-106ZM28,-98L26,-120L12,-106Z"/>
<ellipse cx="-12" cy="-90" rx="6" ry="7" fill="#fff6a8" ${T}/><ellipse cx="12" cy="-90" rx="6" ry="7" fill="#fff6a8" ${T}/><ellipse cx="-12" cy="-90" rx="1.8" ry="5.5" fill="#3a2a20"/><ellipse cx="12" cy="-90" rx="1.8" ry="5.5" fill="#3a2a20"/>
<path ${S} fill="#fffdf6" d="M-24,-78C-12,-60 12,-60 24,-78C14,-74 -14,-74 -24,-78Z"/><path d="M-14,-72l1,5M-5,-70l0,6M5,-70l0,6M14,-72l-1,5" stroke="#4b3326" stroke-width="1.6"/>`;

  P.grin = `
<path ${S} fill="#fffdf6" d="M-34,-18C-20,6 20,6 34,-18C20,-8 -20,-8 -34,-18Z"/>
<path d="M-22,-12l0,8M-11,-9l0,8M0,-8l0,9M11,-9l0,8M22,-12l0,8" stroke="#4b3326" stroke-width="1.6"/>
<ellipse cx="-14" cy="-34" rx="6" ry="7" fill="#fff6a8" ${T}/><ellipse cx="14" cy="-34" rx="6" ry="7" fill="#fff6a8" ${T}/>
<ellipse cx="-14" cy="-34" rx="1.8" ry="5.5" fill="#3a2a20"/><ellipse cx="14" cy="-34" rx="1.8" ry="5.5" fill="#3a2a20"/>`;

  P.baby = `
<path ${S} fill="#f6efe0" d="M-26,-4C-34,-30 -22,-52 0,-54C22,-52 34,-30 26,-4C10,2 -10,2 -26,-4Z"/>
<path d="M-24,-30C-10,-22 10,-22 24,-30" stroke="#d9a0a0" stroke-width="3" fill="none"/>
<ellipse ${S} cx="0" cy="-66" rx="19" ry="17" fill="#f6b8bc"/>
<path ${S} fill="#f0969e" d="M-17,-76L-22,-92L-8,-82ZM17,-76L22,-92L8,-82Z"/>
<ellipse ${S} cx="0" cy="-60" rx="9" ry="6.5" fill="#f08d97"/><circle cx="-3" cy="-60" r="1.6" fill="#7a3a42"/><circle cx="3" cy="-60" r="1.6" fill="#7a3a42"/>
<circle cx="-8" cy="-72" r="2.2" fill="#3a2a20"/><circle cx="8" cy="-72" r="2.2" fill="#3a2a20"/>`;

  P.butterfly = `
<path ${S} fill="#6aa8e8" d="M0,-30C-20,-60 -52,-54 -44,-30C-40,-14 -12,-12 0,-26Z"/><path ${S} fill="#f08a6a" d="M0,-30C20,-60 52,-54 44,-30C40,-14 12,-12 0,-26Z"/>
<circle cx="-30" cy="-36" r="5" fill="#fff6d0"/><circle cx="30" cy="-36" r="5" fill="#fff6d0"/>
<path ${S} d="M0,-52V-12" stroke-width="4"/><path d="M0,-52C-6,-62 -10,-62 -12,-66M0,-52C6,-62 10,-62 12,-66" ${T} fill="none"/>`;

  P.cocoon = `
<path d="M0,-170V-110" ${S} fill="none"/><path ${S} fill="#9bcf8a" d="M0,-112C-22,-100 -24,-56 0,-40C24,-56 22,-100 0,-112Z"/>
<path d="M-14,-96C-4,-92 4,-92 14,-96M-18,-80C-6,-76 6,-76 18,-80M-16,-64C-4,-60 4,-60 16,-64M-10,-50C-2,-47 2,-47 10,-50" stroke="#4f8a46" stroke-width="2" fill="none"/>`;

  P.caterpillar = `
<circle ${S} cx="-48" cy="-22" r="16" fill="#7fc47a"/><circle ${S} cx="-20" cy="-26" r="19" fill="#8fd08a"/><circle ${S} cx="12" cy="-30" r="21" fill="#7fc47a"/>
<circle ${S} cx="44" cy="-52" r="24" fill="#a3dc98"/>
<path d="M32,-60q7,-8 14,-2M52,-62q7,-6 13,0" ${T} fill="none"/><circle cx="40" cy="-52" r="2.4" fill="#3a2a20"/><circle cx="58" cy="-52" r="2.4" fill="#3a2a20"/>
<path d="M38,-40Q48,-34 58,-42" ${T} fill="none"/>
<path d="M40,-76l-4,-12M54,-76l4,-12" ${S} fill="none"/>
<path ${S} fill="none" d="M62,-38c12,0 16,-10 28,-10"/><rect ${S} x="86" y="-56" width="12" height="16" rx="3" fill="#c8a574"/>
<path d="M92,-60c-4,-10 6,-14 2,-24c-2,-6 4,-10 8,-16" stroke="#cfcfd8" stroke-width="4" fill="none" stroke-linecap="round" opacity=".8"/>`;

  // ── 物 ─────────────────────────────
  P.daisies = `
<path d="M-26,0C-26,-14 -24,-24 -24,-34M0,0C0,-14 2,-30 2,-46M26,0C26,-12 24,-22 26,-30" stroke="#5f9a52" stroke-width="3.4" fill="none" stroke-linecap="round"/>
<g fill="#fffdf6" ${T}><circle cx="-24" cy="-42" r="9"/><circle cx="-33" cy="-36" r="6"/><circle cx="-16" cy="-37" r="6"/><circle cx="-24" cy="-52" r="6"/>
<circle cx="2" cy="-54" r="10"/><circle cx="-8" cy="-48" r="7"/><circle cx="12" cy="-48" r="7"/><circle cx="2" cy="-65" r="7"/>
<circle cx="26" cy="-38" r="8"/><circle cx="18" cy="-34" r="5.5"/><circle cx="34" cy="-33" r="5.5"/><circle cx="26" cy="-47" r="5.5"/></g>
<circle cx="-24" cy="-42" r="5" fill="#f0c24d" ${T}/><circle cx="2" cy="-54" r="5.6" fill="#f0c24d" ${T}/><circle cx="26" cy="-38" r="4.6" fill="#f0c24d" ${T}/>`;
  P.crown = `
<path ${S} fill="#fffdf6" d="M-34,-8C-48,-30 -30,-52 -8,-46C-4,-62 22,-62 26,-44C46,-42 46,-10 24,-6C10,2 -16,2 -34,-8Z"/>
<g fill="#fffdf6" ${T}><circle cx="-20" cy="-20" r="9"/><circle cx="0" cy="-30" r="9"/><circle cx="20" cy="-20" r="9"/><circle cx="-10" cy="-8" r="8"/><circle cx="12" cy="-8" r="8"/></g>
<g fill="#f0c24d" ${T}><circle cx="-20" cy="-20" r="3.4"/><circle cx="0" cy="-30" r="3.4"/><circle cx="20" cy="-20" r="3.4"/><circle cx="-10" cy="-8" r="3.4"/><circle cx="12" cy="-8" r="3.4"/></g>`;
  P.book = `
<path ${S} fill="#fffaf0" d="M0,-8C-20,-18 -44,-18 -60,-10L-60,-48C-44,-56 -20,-56 0,-46Z"/><path ${S} fill="#fffaf0" d="M0,-8C20,-18 44,-18 60,-10L60,-48C44,-56 20,-56 0,-46Z"/>
<path d="M-50,-40C-36,-44 -18,-44 -8,-38M-50,-32C-36,-36 -18,-36 -8,-30M-50,-24C-36,-28 -18,-28 -8,-22M8,-38C18,-44 36,-44 50,-40M8,-30C18,-36 36,-36 50,-32M8,-22C18,-28 36,-28 50,-24" stroke="#c9b48a" stroke-width="1.3" fill="none"/>
<path d="M0,-8V-46" ${S}/>`;
  P.lantern = `
<path d="M-12,-76C-12,-98 12,-98 12,-76" ${S} fill="none"/><rect ${S} x="-14" y="-76" width="28" height="8" rx="3" fill="#8a6a3a"/>
<path ${S} fill="#ffe9a0" d="M-14,-68H14L18,-18H-18Z"/><path d="M-6,-68L-8,-18M6,-68L8,-18" ${T}/>
<path fill="#f08a2a" d="M0,-58C-9,-46 -7,-34 0,-30C7,-34 9,-46 0,-58Z"/><path fill="#ffd25e" d="M0,-48C-4,-42 -3,-36 0,-34C3,-36 4,-42 0,-48Z"/>
<rect ${S} x="-20" y="-18" width="40" height="10" rx="3" fill="#8a6a3a"/>`;
  P.map = `
<path ${S} fill="#f1deb0" d="M-50,-40C-44,-48 -38,-34 -30,-44L30,-48C38,-52 46,-40 52,-46L52,-6C46,0 40,-12 30,-6L-30,-2C-38,2 -44,-10 -50,-4Z"/>
<path d="M-36,-14C-24,-34 -8,-8 4,-28C14,-40 26,-26 34,-34" stroke="#b9503a" stroke-width="2.4" stroke-dasharray="4 4" fill="none"/>
<path d="M28,-20l10,10M38,-20l-10,10" stroke="#c43c4a" stroke-width="3.4"/><circle cx="-36" cy="-14" r="3.4" fill="#4b3326"/>`;
  P.key = `
<circle ${S} cx="-24" cy="-26" r="14" fill="#f0c24d"/><circle cx="-24" cy="-26" r="6" fill="#fbf3de" ${T}/>
<path ${S} fill="#f0c24d" d="M-10,-30H42V-22H34V-14H27V-22H18V-10H11V-22H-10Z"/>`;
  P.bottle = `
<path ${S} fill="#c6a9e8" d="M-10,-52C-10,-44 -26,-40 -26,-22C-26,-8 -16,-2 0,-2C16,-2 26,-8 26,-22C26,-40 10,-44 10,-52Z"/>
<rect ${S} x="-8" y="-66" width="16" height="16" rx="2" fill="#e8d6ae"/><rect ${S} x="-10" y="-72" width="20" height="8" rx="3" fill="#b98f5a"/>
<rect x="-14" y="-30" width="28" height="14" fill="#fffdf6" ${T}/><path d="M-10,-25h20M-8,-21h16" stroke="#4b3326" stroke-width="1.4"/><path d="M-20,-26C-20,-16 -16,-10 -10,-8" stroke="#fff" stroke-width="3" fill="none" opacity=".7"/>`;
  P.cake = `
<ellipse ${S} cx="0" cy="-6" rx="34" ry="8" fill="#fffdf6"/><path ${S} fill="#f0c9a0" d="M-24,-10V-30C-24,-44 24,-44 24,-30V-10C10,-2 -10,-2 -24,-10Z"/>
<path ${S} fill="#f8b9c6" d="M-26,-30C-26,-48 26,-48 26,-30C20,-24 18,-34 12,-30C6,-24 4,-34 -2,-30C-8,-24 -12,-34 -18,-30C-22,-26 -24,-26 -26,-30Z"/>
<circle cx="-12" cy="-38" r="3" fill="#7a3a52"/><circle cx="2" cy="-40" r="3" fill="#7a3a52"/><circle cx="14" cy="-37" r="3" fill="#7a3a52"/><circle cx="-2" cy="-20" r="2.4" fill="#7a3a52"/><circle cx="12" cy="-18" r="2.4" fill="#7a3a52"/>
<rect x="-18" y="-60" width="36" height="12" rx="2" fill="#fffdf6" ${T} transform="rotate(-4 0 -54)"/><text x="-15" y="-51" font-size="8.4" fill="#c43c4a" font-family="serif" transform="rotate(-4 0 -54)">私を食べて</text>`;
  P.table = `
<ellipse ${S} cx="0" cy="-60" rx="70" ry="14" fill="#cfeaf4" opacity=".92"/><path ${S} fill="#bfe0ee" opacity=".9" d="M-70,-60V-54C-60,-44 60,-44 70,-54V-60C60,-50 -60,-50 -70,-60Z"/>
<path d="M-48,-52L-54,-2M0,-47V-2M48,-52L54,-2" stroke="#9cc4d6" stroke-width="7" stroke-linecap="round"/><path d="M-48,-52L-54,-2M0,-47V-2M48,-52L54,-2" ${T} fill="none"/>
<path d="M-30,-64C-10,-70 20,-70 40,-64" stroke="#fff" stroke-width="3" fill="none" opacity=".8"/>`;
  P.door_small = `
<path ${S} fill="#c68a4f" d="M-26,0V-52C-26,-82 26,-82 26,-52V0Z"/><path d="M0,-80V0M-26,-44H26" stroke="#8a5a2f" stroke-width="2" fill="none"/>
<path ${T} fill="none" d="M-17,-8V-52C-17,-70 17,-70 17,-52V-8"/><circle ${T} cx="14" cy="-34" r="4" fill="#f0c24d"/>`;
  P.door = `
<path ${S} fill="#b97a45" d="M-30,0V-86C-30,-110 30,-110 30,-86V0Z"/><path ${T} fill="none" d="M-20,-8V-84C-20,-98 20,-98 20,-84V-8M-20,-52H20"/><circle ${T} cx="18" cy="-46" r="4.5" fill="#f0c24d"/>`;
  P.door_red = `
<path ${S} fill="#d9564b" d="M-32,0V-90C-32,-116 32,-116 32,-90V0Z"/><path ${T} fill="none" d="M-22,-8V-88C-22,-102 22,-102 22,-88V-8"/><circle ${T} cx="20" cy="-46" r="4.5" fill="#f0c24d"/>`;
  P.door_blue = `
<path ${S} fill="#5f8fd0" d="M-32,0V-90C-32,-116 32,-116 32,-90V0Z"/><path ${T} fill="none" d="M-22,-8V-88C-22,-102 22,-102 22,-88V-8"/><circle ${T} cx="-20" cy="-46" r="4.5" fill="#f0c24d"/>`;
  P.door_green = `
<path ${S} fill="#6fae6a" d="M-32,0V-90C-32,-116 32,-116 32,-90V0Z"/><path ${T} fill="none" d="M-22,-8V-88C-22,-102 22,-102 22,-88V-8"/><circle ${T} cx="20" cy="-46" r="4.5" fill="#f0c24d"/>`;
  P.doors_row = `
<path ${S} fill="#d9564b" d="M-96,0V-80C-96,-104 -44,-104 -44,-80V0Z"/><path ${S} fill="#6fae6a" d="M-26,0V-96C-26,-124 26,-124 26,-96V0Z"/><path ${S} fill="#5f8fd0" d="M44,0V-80C44,-104 96,-104 96,-80V0Z"/>
<circle ${T} cx="-52" cy="-44" r="4" fill="#f0c24d"/><circle ${T} cx="18" cy="-50" r="4" fill="#f0c24d"/><circle ${T} cx="52" cy="-44" r="4" fill="#f0c24d"/>
<path ${T} fill="none" d="M-86,-8V-80C-86,-94 -54,-94 -54,-80V-8M-16,-8V-96C-16,-112 16,-112 16,-96V-8M54,-8V-80C54,-94 86,-94 86,-80V-8"/>`;
  P.crack = `
<path d="M-4,0L6,-36L-6,-66L8,-100L-2,-132" stroke="#fff6a8" stroke-width="14" fill="none" stroke-linecap="round" opacity=".55"/><path d="M-4,0L6,-36L-6,-66L8,-100L-2,-132" ${B} fill="none"/><path d="M-4,0L6,-36L-6,-66L8,-100L-2,-132" stroke="#fffbe0" stroke-width="3" fill="none"/>`;
  P.keyhole = `
<path ${S} fill="#3a2a30" d="M0,-90C-18,-90 -26,-70 -14,-56L-22,-6H22L14,-56C26,-70 18,-90 0,-90Z"/><circle cx="0" cy="-70" r="6" fill="#fff6a8" opacity=".8"/>`;
  P.mushroom = `
<path ${S} fill="#f3e9d0" d="M-12,0C-10,-30 -10,-50 -14,-70H14C10,-50 10,-30 12,0Z"/>
<path ${S} fill="#d9564b" d="M-64,-70C-64,-124 64,-124 64,-70C40,-60 -40,-60 -64,-70Z"/>
<g fill="#fffdf6" ${T}><circle cx="-34" cy="-92" r="8"/><circle cx="-2" cy="-106" r="9"/><circle cx="34" cy="-90" r="7"/><circle cx="14" cy="-82" r="5"/><circle cx="-18" cy="-78" r="4.5"/></g>`;
  P.mush_l = `<path ${S} fill="#d9564b" d="M-30,-6C-30,-34 -6,-48 14,-34L14,-6Z"/><circle cx="-14" cy="-24" r="4.2" fill="#fffdf6" ${T}/><circle cx="2" cy="-18" r="3" fill="#fffdf6" ${T}/><path ${S} fill="#f3e9d0" d="M-30,-6H14V0H-30Z"/>`;
  P.mush_r = `<path ${S} fill="#e89a3c" d="M30,-6C30,-34 6,-48 -14,-34L-14,-6Z"/><circle cx="14" cy="-24" r="4.2" fill="#fffdf6" ${T}/><circle cx="-2" cy="-18" r="3" fill="#fffdf6" ${T}/><path ${S} fill="#f3e9d0" d="M30,-6H-14V0H30Z"/>`;
  P.fan = `
<path ${S} fill="#fffdf6" d="M0,-4L-44,-44C-30,-66 30,-66 44,-44Z"/>
<path d="M0,-4L-30,-58M0,-4L-14,-62M0,-4L0,-64M0,-4L14,-62M0,-4L30,-58" stroke="#c9b48a" stroke-width="1.6" fill="none"/><path d="M-36,-50C-20,-62 20,-62 36,-50" stroke="#e8a0b4" stroke-width="3.4" fill="none"/>
<circle cx="0" cy="-5" r="3.6" fill="#8a6a3a" ${T}/>`;
  P.gloves = `
<path ${S} fill="#fffdf6" d="M-36,-6C-40,-26 -40,-44 -34,-48C-28,-52 -26,-40 -22,-38C-20,-52 -14,-54 -12,-48C-8,-54 -2,-52 -4,-42L-4,-6Z"/>
<path ${S} fill="#fffdf6" d="M36,-6C40,-26 40,-44 34,-48C28,-52 26,-40 22,-38C20,-52 14,-54 12,-48C8,-54 2,-52 4,-42L4,-6Z"/>
<path d="M-36,-12H-4M36,-12H4" stroke="#c9b48a" stroke-width="2"/>`;
  P.thimble = `<path ${S} fill="#d8dee6" d="M-14,-4L-18,-30C-18,-50 18,-50 18,-30L14,-4Z"/><g fill="#8f9cab"><circle cx="-8" cy="-30" r="1.8"/><circle cx="0" cy="-34" r="1.8"/><circle cx="8" cy="-30" r="1.8"/><circle cx="-4" cy="-22" r="1.8"/><circle cx="5" cy="-22" r="1.8"/><circle cx="0" cy="-13" r="1.8"/></g>`;
  P.watch = `
<path d="M0,-52C-8,-64 -8,-70 0,-76" ${S} fill="none"/><rect ${S} x="-5" y="-60" width="10" height="9" rx="2" fill="#f0c24d"/>
<circle ${S} cx="0" cy="-26" r="26" fill="#f0c24d"/><circle ${T} cx="0" cy="-26" r="20" fill="#fff9e0"/>
<path d="M0,-26V-42M0,-26L9,-20" stroke="#4b3326" stroke-width="2.6" stroke-linecap="round"/><g stroke="#4b3326" stroke-width="1.6"><path d="M0,-44v3M0,-11v3M-18,-26h3M15,-26h3"/></g>
<path d="M-14,-40l28,26" stroke="#c43c4a" stroke-width="2.4"/><path d="M-12,-14l24,-24" stroke="#c43c4a" stroke-width="0"/>`;
  P.screw = `
<circle ${S} cx="0" cy="-34" r="14" fill="#c2c9d2"/><path d="M-9,-34H9M0,-43V-25" stroke="#4b3326" stroke-width="3.4" stroke-linecap="round"/>
<path ${S} fill="#aab2bc" d="M-6,-20H6V-4L0,0L-6,-4Z"/><path d="M-6,-16H6M-6,-11H6M-6,-6H6" stroke="#4b3326" stroke-width="1.6"/>
<path d="M18,-44l4,-6M-18,-44l-4,-6M22,-34h6M-22,-34h-6" stroke="#f0c24d" stroke-width="2.4" stroke-linecap="round"/>`;
  P.grass = `
<path d="M-40,0C-38,-16 -36,-24 -40,-34M-26,0C-24,-14 -20,-26 -26,-38M-10,0C-8,-18 -6,-26 -10,-36M6,0C8,-14 12,-24 8,-34M22,0C24,-16 28,-26 24,-36M38,0C38,-12 42,-22 40,-30" stroke="#5f9a52" stroke-width="4" fill="none" stroke-linecap="round"/>
<circle cx="-30" cy="-30" r="5" fill="#f08a96" ${T}/><circle cx="16" cy="-32" r="5" fill="#fff0a8" ${T}/>`;
  P.flowers = `
<path d="M-30,0V-22M-6,0V-30M18,0V-24M36,0V-16" stroke="#5f9a52" stroke-width="3" fill="none"/>
<g ${T}><circle cx="-30" cy="-26" r="7" fill="#f08a96"/><circle cx="-6" cy="-34" r="7" fill="#b79bd6"/><circle cx="18" cy="-28" r="7" fill="#fff0a8"/><circle cx="36" cy="-20" r="6" fill="#f5a24d"/></g>`;
  P.signpost = `
<rect ${S} x="-5" y="-110" width="10" height="110" fill="#a67c52"/>
<path ${S} fill="#e9d2a0" d="M-8,-104H52L66,-92L52,-80H-8Z"/><path ${S} fill="#e9d2a0" d="M8,-70H-52L-66,-58L-52,-46H8Z"/>
<text x="-2" y="-88" font-size="11" fill="#4b3326" font-family="serif">帽子屋</text><text x="-48" y="-54" font-size="11" fill="#4b3326" font-family="serif">三月ウサギ</text>`;
  P.house = `
<path ${S} fill="#fffaf0" d="M-54,0V-60H54V0Z"/><path ${S} fill="#d9564b" d="M-66,-58L0,-112L66,-58Z"/>
<rect ${S} x="30" y="-120" width="14" height="30" fill="#c98a6a"/><path d="M36,-126c-8,-10 8,-14 2,-26" stroke="#cfcfd8" stroke-width="4" fill="none" stroke-linecap="round"/>
<path ${S} fill="#b97a45" d="M-12,0V-34C-12,-48 12,-48 12,-34V0Z"/><circle cx="6" cy="-22" r="2.4" fill="#f0c24d"/>
<rect ${S} x="-44" y="-48" width="22" height="22" fill="#bfe3ef"/><path d="M-33,-48V-26M-44,-37H-22" ${T}/><rect ${S} x="22" y="-48" width="22" height="22" fill="#bfe3ef"/><path d="M33,-48V-26M22,-37H44" ${T}/>
<path d="M-50,0h-10M50,0h10" stroke="#5f9a52" stroke-width="5" stroke-linecap="round"/>`;
  P.house_duchess = `
<path ${S} fill="#e6c99a" d="M-64,0V-70H64V0Z"/><path ${S} fill="#7a5a6a" d="M-76,-68L0,-124L76,-68Z"/>
<rect ${S} x="-44" y="-132" width="16" height="36" fill="#b88a6a"/><rect ${S} x="30" y="-132" width="16" height="36" fill="#b88a6a"/>
<path d="M-36,-138c-10,-12 10,-16 2,-30M38,-138c-10,-12 10,-16 2,-30" stroke="#cfcfd8" stroke-width="5" fill="none" stroke-linecap="round" opacity=".85"/>
<path ${S} fill="#5c3a2a" d="M-14,0V-40C-14,-56 14,-56 14,-40V0Z"/><circle cx="7" cy="-24" r="2.6" fill="#f0c24d"/>
<rect ${S} x="-52" y="-56" width="24" height="26" fill="#ffe9a0"/><rect ${S} x="28" y="-56" width="24" height="26" fill="#ffe9a0"/><path d="M-40,-56V-30M-52,-43H-28M40,-56V-30M28,-43H52" ${T}/>`;
  P.pepper = `
<path ${S} fill="#e8dcc0" d="M-18,-4C-22,-30 -20,-48 -12,-56H12C20,-48 22,-30 18,-4Z"/><path ${S} fill="#9c9aa6" d="M-12,-56C-12,-70 12,-70 12,-56Z"/>
<g fill="#4b3326"><circle cx="-4" cy="-64" r="1.4"/><circle cx="4" cy="-64" r="1.4"/><circle cx="0" cy="-60" r="1.4"/></g><rect x="-12" y="-38" width="24" height="14" fill="#c43c4a" ${T}/><text x="-9" y="-28" font-size="9" fill="#fffdf6" font-family="serif">こしょう</text>`;
  P.soup = `
<path ${S} fill="#fffdf6" d="M-40,-24C-40,-4 -22,4 0,4C22,4 40,-4 40,-24Z"/><ellipse ${S} cx="0" cy="-24" rx="40" ry="9" fill="#f3b24d"/>
<path d="M-18,-34c-8,-12 8,-14 0,-26M2,-34c-8,-12 8,-14 0,-26M22,-34c-8,-12 8,-14 0,-26" stroke="#cfcfd8" stroke-width="4" fill="none" stroke-linecap="round" opacity=".9"/><circle cx="-10" cy="-25" r="4" fill="#9bcf8a"/><circle cx="12" cy="-23" r="4" fill="#e8744a"/>`;
  P.chair = `
<path ${S} fill="#c98a5a" d="M-26,-50H26V-44H-26Z"/><path d="M-22,-44L-26,0M22,-44L26,0M-20,-90V-50M20,-90V-50M-20,-86H20M-20,-70H20" ${S} fill="none"/>
<rect ${S} x="-26" y="-52" width="52" height="10" rx="3" fill="#e0a56c"/><path d="M-22,-90H22" stroke="#b97a45" stroke-width="6" stroke-linecap="round"/>`;
  P.teapot = `
<path ${S} fill="#f3d7e8" d="M-34,-12C-44,-40 -30,-64 0,-64C30,-64 44,-40 34,-12C14,2 -14,2 -34,-12Z"/>
<path ${S} fill="#f3d7e8" d="M34,-40C54,-48 62,-34 46,-22"/><path ${S} fill="none" d="M-34,-30C-56,-40 -58,-18 -36,-20"/>
<path ${S} fill="#e0b0cc" d="M-14,-64C-14,-76 14,-76 14,-64Z"/><circle ${S} cx="0" cy="-78" r="4.4" fill="#e0b0cc"/>
<g fill="#f08a96" ${T}><circle cx="-12" cy="-38" r="5"/><circle cx="10" cy="-30" r="5"/><circle cx="-2" cy="-22" r="4"/></g>`;
  P.cup = `
<path ${S} fill="#fffdf6" d="M-26,-30C-26,-2 -14,4 0,4C14,4 26,-2 26,-30Z"/><ellipse ${S} cx="0" cy="-30" rx="26" ry="7" fill="#c98a5a"/>
<path ${S} fill="none" d="M26,-26C42,-26 42,-8 24,-8"/><ellipse cx="0" cy="-32" rx="16" ry="3" fill="#e8b678" opacity=".8"/>
<path d="M-8,-40c-6,-9 6,-12 0,-20M8,-40c-6,-9 6,-12 0,-20" stroke="#cfcfd8" stroke-width="3.4" fill="none" stroke-linecap="round" opacity=".9"/>`;
  P.teatable = `
<path ${S} fill="#fffdf6" d="M-150,-50H150L158,-40H-158Z"/><path ${S} fill="#e8a0b4" d="M-150,-50H150L158,-40H-158Z" opacity=".35"/>
<path ${S} fill="#c98a5a" d="M-158,-40H158V-32H-158Z"/><path d="M-130,-32V0M130,-32V0M-60,-32V0M60,-32V0" stroke="#b97a45" stroke-width="7" stroke-linecap="round"/><path d="M-130,-32V0M130,-32V0M-60,-32V0M60,-32V0" ${T} fill="none"/>`;
  P.clock6 = `
<circle ${S} cx="0" cy="-48" r="40" fill="#fff9e0"/><circle ${S} cx="0" cy="-48" r="46" fill="none"/>
<g stroke="#4b3326" stroke-width="2"><path d="M0,-84v6M0,-18v6M-36,-48h6M30,-48h6M-18,-79l3,5M18,-79l-3,5M-18,-17l3,-5M18,-17l-3,-5M-34,-66l5,3M34,-66l-5,3M-34,-30l5,-3M34,-30l-5,-3"/></g>
<path d="M0,-48V-82M0,-48V-24" stroke="#4b3326" stroke-width="3.4" stroke-linecap="round"/><circle cx="0" cy="-48" r="4" fill="#c43c4a"/><path d="M-20,0L-14,-4M20,0L14,-4" ${S}/>`;
  P.tophat = `<path ${S} fill="#3f3a4d" d="M-40,-10C-20,-2 20,-2 40,-10L30,-16H-30ZM-26,-16L-22,-70H22L26,-16Z"/><path d="M-25,-28H25" stroke="#d9564b" stroke-width="8"/><rect x="2" y="-52" width="22" height="14" fill="#fffdf6" ${T} transform="rotate(8 2 -52)"/><text x="5" y="-41" font-size="8" fill="#4b3326" font-family="serif" transform="rotate(8 2 -52)">10/6</text>`;
  P.brush = `
<path d="M-30,-4L22,-76" stroke="#b97a45" stroke-width="9" stroke-linecap="round"/><path d="M-30,-4L22,-76" ${S} fill="none"/>
<path ${S} fill="#d9564b" d="M22,-76L36,-98C44,-92 46,-80 34,-70Z"/><path d="M-28,-2c-10,6 -4,12 4,6" stroke="#d9564b" stroke-width="5" fill="none"/>`;
  P.roses = `
<path ${S} fill="#7fb36e" d="M-60,0C-66,-40 -40,-70 0,-70C40,-70 66,-40 60,0Z"/>
<g ${T}><circle cx="-34" cy="-38" r="10" fill="#fffdf6"/><circle cx="-4" cy="-52" r="11" fill="#fffdf6"/><circle cx="30" cy="-36" r="10" fill="#d9564b"/><circle cx="8" cy="-22" r="9" fill="#d9564b"/><circle cx="-22" cy="-16" r="8" fill="#fffdf6"/><circle cx="42" cy="-14" r="7" fill="#d9564b"/></g>
<path d="M-34,-42a4,4 0 1 1 5,3M-4,-56a5,5 0 1 1 6,4M30,-40a4,4 0 1 1 5,3M8,-26a4,4 0 1 1 5,3" stroke="#4b3326" stroke-width="1.2" fill="none"/>`;
  P.tarts = `
<ellipse ${S} cx="0" cy="-8" rx="52" ry="10" fill="#e7e1d6"/><ellipse ${T} cx="0" cy="-10" rx="42" ry="7" fill="#fffdf6"/>
<g ${S}><path fill="#e8b678" d="M-40,-12L-34,-30H-14L-8,-12Z"/><path fill="#e8b678" d="M-6,-12L0,-30H20L26,-12Z"/><path fill="#e8b678" d="M20,-12L26,-30H44L50,-12Z"/></g>
<g ${T}><ellipse cx="-24" cy="-30" rx="10" ry="4" fill="#c43c4a"/><ellipse cx="10" cy="-30" rx="10" ry="4" fill="#c43c4a"/><ellipse cx="35" cy="-30" rx="9" ry="4" fill="#c43c4a"/></g>`;
  P.hedge = `
<path ${S} fill="#4f9a56" d="M-70,0V-80C-70,-96 -50,-100 -40,-92C-30,-104 -10,-104 0,-94C10,-106 30,-104 40,-92C50,-100 70,-96 70,-80V0Z"/>
<g fill="#6bb86a" opacity=".8"><circle cx="-44" cy="-60" r="9"/><circle cx="-10" cy="-70" r="10"/><circle cx="26" cy="-56" r="9"/><circle cx="50" cy="-72" r="8"/><circle cx="-26" cy="-30" r="8"/><circle cx="20" cy="-24" r="9"/></g>`;
  P.mousehole = `<path ${S} fill="#3a2a30" d="M-20,0V-22C-20,-44 20,-44 20,-22V0Z"/><path ${T} fill="none" d="M-28,0C-28,-30 -22,-50 0,-52C22,-50 28,-30 28,0" stroke="#8a6a3a"/><circle cx="-6" cy="-14" r="2.4" fill="#fff6a8"/><circle cx="6" cy="-14" r="2.4" fill="#fff6a8"/>`;
  P.bench = `
<rect ${S} x="-70" y="-34" width="140" height="12" rx="3" fill="#c98a5a"/><rect ${S} x="-70" y="-62" width="140" height="10" rx="3" fill="#b97a45"/><path d="M-60,-22V0M60,-22V0M-60,-62V-34M60,-62V-34" ${S} fill="none"/>`;
  P.jurybox = `
<rect ${S} x="-86" y="-60" width="172" height="58" rx="6" fill="#b97a45"/><rect ${T} x="-80" y="-54" width="160" height="46" rx="4" fill="#d9a56c"/>
<g ${T}><circle cx="-60" cy="-44" r="9" fill="#f4d3b6"/><circle cx="-30" cy="-44" r="9" fill="#c9a07a"/><circle cx="0" cy="-44" r="9" fill="#a9a2c0"/><circle cx="30" cy="-44" r="9" fill="#f6b8bc"/><circle cx="60" cy="-44" r="9" fill="#9bcf8a"/></g>
<g fill="#3a2a20"><circle cx="-63" cy="-46" r="1.5"/><circle cx="-57" cy="-46" r="1.5"/><circle cx="-33" cy="-46" r="1.5"/><circle cx="-27" cy="-46" r="1.5"/><circle cx="-3" cy="-46" r="1.5"/><circle cx="3" cy="-46" r="1.5"/><circle cx="27" cy="-46" r="1.5"/><circle cx="33" cy="-46" r="1.5"/><circle cx="57" cy="-46" r="1.5"/><circle cx="63" cy="-46" r="1.5"/></g>`;
  P.throne = `
<path ${S} fill="#d9433f" d="M-34,0V-90C-34,-120 34,-120 34,-90V0Z"/><path ${T} fill="#f0c24d" d="M-24,-8V-88C-24,-108 24,-108 24,-88V-8"/><path ${S} fill="#a8322f" d="M-30,-34H30V0H-30Z"/>
<path fill="#d9433f" d="M0,-80c-6,-8 -16,-2 -10,6l10,10l10,-10c6,-8 -4,-14 -10,-6z" ${T}/>`;
  P.gavel = `<path d="M-30,-4L16,-44" stroke="#b97a45" stroke-width="7" stroke-linecap="round"/><rect ${S} x="6" y="-62" width="34" height="18" rx="4" fill="#8a5a2f" transform="rotate(-40 23 -53)"/>`;
  P.waves = `
<path d="M-50,-20C-34,-36 -18,-4 0,-20C16,-34 34,-4 50,-20" stroke="#4f8fb0" stroke-width="5" fill="none" stroke-linecap="round"/><path d="M-40,-4C-26,-18 -10,10 6,-4C22,-16 36,8 46,-4" stroke="#7fbcd8" stroke-width="4" fill="none" stroke-linecap="round"/>`;
  P.ship = `
<path ${S} fill="#c98a5a" d="M-70,-24H70C60,2 -54,2 -70,-24Z"/><path d="M0,-24V-130" ${S}/><path ${S} fill="#fffdf6" d="M4,-124C54,-110 56,-52 4,-34Z"/><path ${S} fill="#fffdf6" d="M-4,-110C-40,-100 -42,-60 -4,-44Z"/>
<path ${S} fill="#d9564b" d="M0,-130L22,-122L0,-114Z"/>`;
  P.tinydoor = P.door_small;
  P.sparkle = `<path d="M0,-30L6,-8L28,0L6,8L0,30L-6,8L-28,0L-6,-8Z" fill="#ffe27a" ${T} transform="translate(0 -30)"/>`;
  P.heart = `<path d="M0,-10C-34,-40 -20,-70 0,-52C20,-70 34,-40 0,-10Z" fill="#d9433f" ${S}/>`;
  P.spade = `<path d="M0,-70C-30,-48 -24,-26 -8,-30C-8,-18 -12,-12 -16,-8H16C12,-12 8,-18 8,-30C24,-26 30,-48 0,-70Z" fill="#2d2a38" ${S}/>`;
  P.card = `
<rect ${S} x="-44" y="-118" width="88" height="118" rx="9" fill="#fffdf6"/><rect ${T} x="-36" y="-110" width="72" height="102" rx="5" fill="none"/>
<text x="-34" y="-92" font-size="20" fill="#c43c4a" font-family="serif" font-weight="bold">7</text><text x="-34" y="-72" font-size="18" fill="#c43c4a" font-family="serif">♥</text>
<path d="M0,-86c-14,-14 -34,0 -22,14l22,22l22,-22c12,-14 -8,-28 -22,-14z" fill="#c43c4a" ${T}/>
<ellipse cx="0" cy="-58" rx="14" ry="12" fill="#f4d3b6" ${T}/><circle cx="-5" cy="-60" r="1.8" fill="#3a2a20"/><circle cx="5" cy="-60" r="1.8" fill="#3a2a20"/><path d="M-12,-66C-10,-76 10,-76 12,-66C6,-70 -6,-70 -12,-66Z" fill="#f2c85b" ${T}/>`;
  P.flat_alice = `<g transform="scale(1 .96)">${P.alice}</g>`;
  P.vine = `<path d="M0,0C-30,-30 30,-60 0,-90C-24,-116 20,-130 0,-150" stroke="#5f9a52" stroke-width="5" fill="none" stroke-linecap="round"/><g fill="#7fb36e" ${T}><ellipse cx="-14" cy="-40" rx="9" ry="5" transform="rotate(-30 -14 -40)"/><ellipse cx="14" cy="-70" rx="9" ry="5" transform="rotate(30 14 -70)"/><ellipse cx="-10" cy="-104" rx="9" ry="5" transform="rotate(-30 -10 -104)"/></g>`;
  P.stone = `<path ${S} fill="#a9a2a0" d="M-30,0C-34,-16 -26,-30 -6,-32C16,-34 32,-22 30,0Z"/><path d="M-14,-18C-6,-24 4,-22 10,-16" stroke="#7d7776" stroke-width="2" fill="none"/>`;
  P.teaset = `<g>${P.teapot.replace(/^/, '<g transform="translate(-26 0) scale(.7)">')}</g></g><g transform="translate(34 0) scale(.6)">${P.cup}</g>`;

  P.tear = `<path ${S} fill="#9fd4ee" d="M0,-60C-6,-42 -22,-30 -22,-16C-22,-4 -12,2 0,2C12,2 22,-4 22,-16C22,-30 6,-42 0,-60Z"/><path d="M-10,-22C-10,-14 -6,-9 -1,-8" stroke="#fff" stroke-width="3" fill="none" opacity=".8"/>`;

  // ── 動く飾り・枠の小物 ─────────────────────────────
  P.ladybug = `<ellipse ${S} cx="0" cy="-9" rx="11" ry="9" fill="#e0453c"/><path d="M0,-18V0" stroke="${INK}" stroke-width="2"/><circle cx="-4.5" cy="-11" r="1.8" fill="${INK}"/><circle cx="4.5" cy="-7" r="1.8" fill="${INK}"/><circle ${T} cx="0" cy="-19" r="4.2" fill="#2d2a38"/><path d="M-3,-23l-3,-4M3,-23l3,-4" ${T} fill="none"/>`;
  P.snail = `<path ${S} fill="#bfa27a" d="M-30,-2C-18,-8 6,-8 22,-4C30,-2 34,-8 30,-14L26,-24L30,-26L24,-20C16,-18 -2,-4 -30,-2Z"/><circle ${S} cx="-4" cy="-18" r="15" fill="#e8b678"/><path ${T} fill="none" d="M-4,-18m-9,0a9,9 0 1 1 9,9m-5,-9a4,4 0 1 1 4,4"/><path d="M30,-22l4,-8M26,-24l-1,-8" ${T} fill="none"/><circle cx="34" cy="-30" r="2" fill="${INK}"/><circle cx="25" cy="-32" r="2" fill="${INK}"/>`;
  P.bee = `<ellipse ${S} cx="0" cy="-12" rx="12" ry="9" fill="#f6cf4a"/><path d="M-4,-20V-4M3,-20V-4" stroke="${INK}" stroke-width="3"/><ellipse ${T} cx="-5" cy="-24" rx="8" ry="5" fill="#dff0fa" opacity=".9" transform="rotate(-20 -5 -24)"/><ellipse ${T} cx="6" cy="-24" rx="8" ry="5" fill="#dff0fa" opacity=".9" transform="rotate(20 6 -24)"/><circle cx="-10" cy="-13" r="1.6" fill="${INK}"/>`;
  P.bird = `<ellipse ${S} cx="0" cy="-12" rx="14" ry="10" fill="#7fb6e8"/><circle ${S} cx="12" cy="-18" r="7" fill="#7fb6e8"/><path ${T} fill="#f0b24d" d="M18,-19l7,2l-7,2Z"/><circle cx="13" cy="-19" r="1.5" fill="${INK}"/><path ${S} fill="#5f98d0" d="M-6,-14C-14,-26 -4,-30 4,-18Z"/><path ${T} fill="#5f98d0" d="M-12,-10L-24,-8L-13,-14Z"/>`;
  P.fish = `<path ${S} fill="#f09a4a" d="M-18,-10C-10,-24 12,-24 20,-10C12,4 -10,4 -18,-10Z"/><path ${S} fill="#f4b878" d="M20,-10L32,-20L32,0Z"/><circle cx="-8" cy="-12" r="2" fill="${INK}"/><path d="M-2,-18C0,-12 0,-8 -2,-2" ${T} fill="none"/>`;
  P.star5 = `<path ${T} fill="#ffe27a" d="M0,-26L5,-14L18,-14L8,-6L12,6L0,-1L-12,6L-8,-6L-18,-14L-5,-14Z" transform="translate(0 0) scale(.8)"/>`;
  P.club = `<g fill="#2d2a38" ${T}><circle cx="0" cy="-30" r="9"/><circle cx="-10" cy="-18" r="9"/><circle cx="10" cy="-18" r="9"/><path d="M-3,-18L-6,-2H6L3,-18Z"/></g>`;
  P.diamond = `<path ${S} fill="#d9433f" d="M0,-34L14,-17L0,0L-14,-17Z"/>`;
  P.petal = `<path ${T} fill="#f8bcc8" d="M0,0C-10,-8 -8,-20 0,-26C8,-20 10,-8 0,0Z"/>`;
  P.leaf = `<path ${T} fill="#8bc86e" d="M0,0C-12,-6 -12,-20 0,-28C12,-20 12,-6 0,0Z"/><path d="M0,0V-24" ${T} fill="none"/>`;
  P.bubble = `<circle cx="0" cy="-10" r="9" fill="#dff3fb" fill-opacity=".55" stroke="#7fbcd8" stroke-width="1.8"/><path d="M-4,-14a5,5 0 0 1 4,-3" stroke="#fff" stroke-width="2" fill="none"/>`;
  P.note = `<path d="M-4,-4a4,3 0 1 0 0.1,0M0,-4V-26L10,-22" ${S} fill="#6b5ca0" stroke-width="2.4"/>`;
  P.firefly = `<circle cx="0" cy="-6" r="7" fill="#fff6a8" opacity=".35"/><circle cx="0" cy="-6" r="3.2" fill="#ffe94a"/>`;
  P.cloud = `<g fill="#fffdf6" ${T}><ellipse cx="0" cy="-8" rx="34" ry="12"/><ellipse cx="-18" cy="-16" rx="18" ry="12"/><ellipse cx="12" cy="-20" rx="20" ry="13"/></g>`;
  P.zzz = `<text x="0" y="-4" font-size="16" fill="#6b5ca0" font-family="serif" font-weight="bold">z</text><text x="9" y="-14" font-size="12" fill="#6b5ca0" font-family="serif">z</text><text x="16" y="-23" font-size="9" fill="#6b5ca0" font-family="serif">z</text>`;
  P.flower2 = `<path d="M0,0V-12" stroke="#5f9a52" stroke-width="2.6" fill="none"/><g ${T} fill="#f8bcc8"><circle cx="0" cy="-20" r="5"/><circle cx="-6" cy="-15" r="5"/><circle cx="6" cy="-15" r="5"/><circle cx="-4" cy="-24" r="5"/><circle cx="4" cy="-24" r="5"/></g><circle cx="0" cy="-19" r="3.4" fill="#f0c24d" ${T}/>`;
  P.steam = `<path d="M-6,0c-8,-10 8,-14 0,-26c-6,-8 6,-14 0,-24" stroke="#d8d8e4" stroke-width="5" fill="none" stroke-linecap="round" opacity=".8"/>`;
  P.sparklestar = `<path d="M0,-14L3,-4L14,0L3,4L0,14L-3,4L-14,0L-3,-4Z" transform="translate(0 -14)" fill="#ffe27a" stroke="#b98a1d" stroke-width="1.2"/>`;

  // ── 特別なキャラクター(特別な場面や、ヒントのときだけ顔を出す) ─────────────────
  P.dinah = `
<path ${S} fill="none" stroke-width="9" stroke="#fffdf6" d="M30,-8C52,-10 58,-34 46,-52"/><path ${S} fill="none" d="M30,-8C52,-10 58,-34 46,-52"/>
<path ${S} fill="#fffdf6" d="M-30,-4C-38,-36 -22,-64 0,-64C22,-64 38,-36 30,-4C10,2 -10,2 -30,-4Z"/>
<path fill="#f0a24a" d="M-26,-30C-24,-52 -8,-60 -2,-58C-12,-46 -10,-34 -14,-20Z"/><path fill="#3a3340" d="M14,-60C26,-54 30,-40 28,-28C20,-34 14,-44 14,-60Z"/>
<path ${S} fill="#fffdf6" d="M-22,-70C-24,-92 24,-92 22,-70C22,-56 -22,-56 -22,-70Z"/><path ${S} fill="#f0a24a" d="M-22,-84L-26,-100L-12,-90ZM22,-84L26,-100L12,-90Z"/><path fill="#3a3340" d="M-20,-86C-14,-92 -8,-90 -6,-84Z"/>
<circle cx="-8" cy="-72" r="2.4" fill="${INK}"/><circle cx="8" cy="-72" r="2.4" fill="${INK}"/><path d="M-3,-66l3,3l3,-3Z" fill="#e58a8a" ${T}/><path d="M-22,-68l-10,-2M-22,-65l-10,3M22,-68l10,-2M22,-65l10,3" ${T} fill="none"/>
<path d="M-14,-56Q0,-50 14,-56" stroke="#d9433f" stroke-width="4" fill="none"/><circle cx="0" cy="-51" r="3" fill="#f0c24d" ${T}/>`;
  P.bill = `
<path ${S} fill="none" stroke-width="7" stroke="#7fb36e" d="M14,-8C40,-6 46,-30 34,-38"/><path ${S} fill="none" d="M14,-8C40,-6 46,-30 34,-38"/>
<path ${S} fill="#8cc87a" d="M-18,-4C-24,-34 -14,-60 0,-62C14,-60 22,-34 16,-4C6,2 -8,2 -18,-4Z"/><path ${T} fill="#e8e0a0" d="M-8,-52L8,-52L10,-12C2,-8 -2,-8 -10,-12Z"/>
<path ${S} fill="#8cc87a" d="M-20,-72C-22,-90 22,-90 20,-72C22,-60 -22,-60 -20,-72Z"/><circle ${T} cx="-8" cy="-76" r="6" fill="#fffdf6"/><circle ${T} cx="8" cy="-76" r="6" fill="#fffdf6"/><circle cx="-7" cy="-76" r="2.6" fill="${INK}"/><circle cx="9" cy="-76" r="2.6" fill="${INK}"/>
<path d="M-8,-66Q0,-62 8,-66" ${T} fill="none"/><path d="M-18,-48C-30,-40 -30,-30 -24,-26M16,-48C28,-40 28,-30 22,-26" ${S} fill="none"/><ellipse ${T} cx="-8" cy="-2" rx="8" ry="3.4" fill="#8cc87a"/><ellipse ${T} cx="8" cy="-2" rx="8" ry="3.4" fill="#8cc87a"/>
<path d="M-12,-92l4,-6l4,6l4,-6l4,6" stroke="#f0c24d" stroke-width="3" fill="none" stroke-linecap="round"/>`;
  P.turtle = `
<ellipse ${S} cx="0" cy="-30" rx="40" ry="28" fill="#8aa87a"/><path d="M-30,-30h60M-14,-52L-20,-8M14,-52L20,-8M0,-58V-4" stroke="#5f7a52" stroke-width="2.4" fill="none"/>
<path ${S} fill="#a8c490" d="M34,-34C48,-40 56,-30 52,-20C48,-12 38,-14 34,-20Z"/><circle cx="46" cy="-28" r="2.2" fill="${INK}"/><path d="M42,-20q6,4 10,-2" ${T} fill="none"/><path d="M47,-24q-1,6 0,10" stroke="#6fb7e8" stroke-width="2.4" fill="none"/>
<ellipse ${S} cx="-26" cy="-4" rx="12" ry="5.5" fill="#a8c490"/><ellipse ${S} cx="20" cy="-4" rx="12" ry="5.5" fill="#a8c490"/>
<path d="M-40,-30C-52,-28 -52,-18 -44,-16" ${S} fill="#a8c490"/><path d="M30,-62l8,-8l8,8l-8,4Z" fill="#e8745a" ${T}/>`;
  P.gryphon = `
<path ${S} fill="#e8b24a" d="M-34,-4C-42,-30 -30,-52 -6,-54C20,-54 36,-36 30,-4C10,4 -14,4 -34,-4Z"/><path ${S} fill="none" stroke-width="6" stroke="#e8b24a" d="M30,-14C50,-16 54,-40 44,-50"/><path ${S} fill="none" d="M30,-14C50,-16 54,-40 44,-50"/><circle ${T} cx="46" cy="-52" r="6" fill="#c77a2a"/>
<path ${S} fill="#fffdf6" d="M-20,-48C-52,-60 -66,-90 -46,-100C-40,-80 -26,-66 -10,-60Z"/><path d="M-44,-92C-40,-82 -34,-72 -22,-62M-52,-84C-44,-74 -34,-68 -26,-62" stroke="#c9b48a" stroke-width="1.6" fill="none"/>
<path ${S} fill="#fffdf6" d="M-4,-72C-4,-98 26,-98 26,-72C26,-60 -4,-60 -4,-72Z"/><path ${S} fill="#f0c24d" d="M24,-76L42,-70L24,-62Z"/><circle cx="12" cy="-78" r="2.6" fill="${INK}"/><path ${T} fill="#fffdf6" d="M0,-92L-4,-106L8,-98Z"/><path ${T} fill="#fffdf6" d="M14,-94L16,-108L24,-96Z"/>
<path d="M-16,-6v8M12,-6v8" ${S} fill="none" stroke-width="3"/>`;
  P.frog = `
<path ${S} fill="#3f5fa0" d="M-24,-4C-28,-34 -18,-56 0,-58C18,-56 28,-34 24,-4C8,2 -8,2 -24,-4Z"/><path ${T} fill="#fffdf6" d="M-6,-56L6,-56L4,-20L-4,-20Z"/><circle cx="0" cy="-44" r="2" fill="#f0c24d"/><circle cx="0" cy="-34" r="2" fill="#f0c24d"/><circle cx="0" cy="-24" r="2" fill="#f0c24d"/>
<path ${S} fill="#8cc87a" d="M-22,-70C-26,-90 26,-90 22,-70C22,-58 -22,-58 -22,-70Z"/><circle ${T} cx="-12" cy="-86" r="7" fill="#8cc87a"/><circle ${T} cx="12" cy="-86" r="7" fill="#8cc87a"/><circle cx="-12" cy="-86" r="3" fill="${INK}"/><circle cx="12" cy="-86" r="3" fill="${INK}"/>
<path d="M-12,-64Q0,-58 12,-64" ${S} fill="none"/><g fill="#fffdf6" ${T}><circle cx="-24" cy="-88" r="7"/><circle cx="-30" cy="-78" r="6"/><circle cx="24" cy="-88" r="7"/><circle cx="30" cy="-78" r="6"/></g>
<ellipse ${T} cx="-10" cy="-2" rx="10" ry="4" fill="#8cc87a"/><ellipse ${T} cx="10" cy="-2" rx="10" ry="4" fill="#8cc87a"/>`;
  P.bat = `
<path ${S} fill="#6b5a7a" d="M0,-30C-8,-52 -34,-56 -46,-40C-38,-42 -34,-36 -30,-32C-26,-38 -20,-34 -16,-28C-10,-34 -6,-30 0,-26C6,-30 10,-34 16,-28C20,-34 26,-38 30,-32C34,-36 38,-42 46,-40C34,-56 8,-52 0,-30Z"/>
<ellipse ${S} cx="0" cy="-26" rx="9" ry="12" fill="#8a7a9a"/><circle ${S} cx="0" cy="-42" r="9" fill="#8a7a9a"/><path ${S} fill="#8a7a9a" d="M-8,-48L-10,-60L-3,-52ZM8,-48L10,-60L3,-52Z"/><circle cx="-3" cy="-43" r="1.6" fill="#fff6a8"/><circle cx="3" cy="-43" r="1.6" fill="#fff6a8"/><path d="M-3,-37l1.5,2l1.5,-2" ${T} fill="#fffdf6"/>`;
  P.owl = `
<path ${S} fill="#a67c52" d="M-24,-4C-34,-34 -22,-64 0,-66C22,-64 34,-34 24,-4C8,2 -8,2 -24,-4Z"/><path ${T} fill="#e8d3a8" d="M-12,-50C-12,-30 -6,-14 0,-8C6,-14 12,-30 12,-50C6,-44 -6,-44 -12,-50Z"/>
<path d="M-6,-40l3,3M0,-38l3,3M6,-40l-3,3M-4,-28l3,3M4,-28l-3,3" stroke="#b08a5a" stroke-width="1.6" fill="none"/>
<path ${S} fill="#a67c52" d="M-22,-76C-24,-94 24,-94 22,-76C22,-64 -22,-64 -22,-76Z"/><path ${S} fill="#a67c52" d="M-20,-88L-24,-102L-10,-92ZM20,-88L24,-102L10,-92Z"/>
<circle ${S} cx="-9" cy="-78" r="8" fill="#fffdf6"/><circle ${S} cx="9" cy="-78" r="8" fill="#fffdf6"/><circle cx="-9" cy="-78" r="3.2" fill="${INK}"/><circle cx="9" cy="-78" r="3.2" fill="${INK}"/><path d="M-17,-78H17" ${T} fill="none"/>
<path ${T} fill="#f0b24d" d="M-3,-72L3,-72L0,-66Z"/><path ${S} fill="#2d2a38" d="M-18,-96L0,-104L18,-96L0,-90Z"/><path d="M14,-97v10" stroke="#f0c24d" stroke-width="2.4"/>`;
  P.speechdot = `<circle cx="0" cy="-6" r="5" fill="#fffdf6" ${T}/>`;

  window.ART_PROPS = P;
})();
