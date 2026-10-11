'use strict';
// ドットはコードで描く。文字列の1文字=1ドット、パレットの記号で色を決める。'.'は透明。
const CAR = [
  "..oooooooo..",
  ".olbbbbbblo.",
  ".obbhhhhbbo.",
  "wobbbbbbbbow",
  "wobggggggbow",
  "wobggggggbow",
  "wobbbbbbbbow",
  "oobbsbbsbboo",
  "oobbsbbsbboo",
  "oobbsbbsbboo",
  "oobbbbbbbboo",
  "oobggggggboo",
  "wobbbbbbbbow",
  "wobbbbbbbbow",
  "wobhhhhhhbow",
  "wobbbbbbbbow",
  ".obbbbbbbbo.",
  ".orrbbbbrro.",
  ".oooooooooo.",
];
const FLAG_S = (() => {
  const S = [".YYY.", "Y....", ".YYY.", "....Y", ".YYY."];
  const rows = ["pRRRRRRRRRR"];
  for (const r of S) rows.push("pRR" + r.replace(/\./g, "R") + "RRR");
  rows.push("pRRRRRRRRRR", "p..........", "p..........", "p..........", "p..........");
  return rows;
})();
const GEM = [
  "...bbbb...", "..bBBBBb..", ".bBWBBBBb.", "bBWBBBBBBb",
  ".bBBBBBBb.", "..bBBBBb..", "...bBBb...", "....bb....",
];
const BODY = {
  blue:   {b:"#2f6bff", h:"#7fa8ff", s:"#ffffff"},
  red:    {b:"#e02828", h:"#ff7a7a", s:"#b01818"},
  yellow: {b:"#f2c200", h:"#fff07a", s:"#b08a00"},
  green:  {b:"#2f8a3a", h:"#6fcf7a", s:"#1d5a26"},
  purple: {b:"#8a3ad0", h:"#c58aff", s:"#5a2490"},
};
const COMMON = {o:"#101018", g:"#9fe8ff", w:"#222230", l:"#ffee88", r:"#ff4040",
  p:"#c8c8d8", R:"#e02828", Y:"#ffd400", W:"#ffffff", B:"#40a8ff"};
function makeSprite(rows, pal) {
  const c = document.createElement("canvas");
  c.width = Math.max(...rows.map(r => r.length)); c.height = rows.length;
  const x = c.getContext("2d");
  rows.forEach((row, j) => [...row].forEach((ch, i) => {
    const col = pal[ch]; if (!col) return;
    x.fillStyle = col; x.fillRect(i, j, 1, 1);
  }));
  return c;
}
function carSprite(kind) { return makeSprite(CAR, {...COMMON, ...BODY[kind]}); }

const FLAG_Y = (() => {
  const rows = ["pYYYYYYYY.."];
  for (let i = 0; i < 4; i++) rows.push("pYYYYYYYY..");
  rows.push("pYYYYY.....", "p..........", "p..........", "p..........");
  return rows;
})();
const FUEL = [
  "..RRRR..", "..R..R..", "RRRRRRRR", "RRWWWWRR", "RRWRRRRR", "RRWWWRRR",
  "RRWRRRRR", "RRWRRRRR", "RRRRRRRR",
];
const ROCK = [
  "...oooo...", "..oggggo..", ".ogGgggGo.", "ogggGggggo", "oggggggGgo",
  "ogGggggggo", ".oggggGgo.", "..oooooo..",
];
const CRAB = [
  "R..RRRR..R", "RR.RRRR.RR", ".RRRRRRRR.", "RRRRWRRWRR", ".RRRRRRRR.", "R.R.R..R.R",
];
const PAL2 = {g:"#8a7a6a", G:"#a89a88"};
