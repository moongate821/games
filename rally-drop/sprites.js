// ドット絵(コードで描く。文字列の1文字=1ドット)。ラリーX SURVIVORS(`ラリーX風はすくら\実装\sprites.js`)の車をそのまま取り込んだ。
(() => {
const DG = window.DG = window.DG || {};
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
const BODY = {
  blue:   { b: "#2f6bff", h: "#7fa8ff", s: "#ffffff" },
  red:    { b: "#e02828", h: "#ff7a7a", s: "#b01818" },
  yellow: { b: "#f2c200", h: "#fff07a", s: "#b08a00" },
  green:  { b: "#2f8a3a", h: "#6fcf7a", s: "#1d5a26" },
  purple: { b: "#8a3ad0", h: "#c58aff", s: "#5a2490" },
};
const COMMON = { o: "#101018", g: "#9fe8ff", w: "#222230", l: "#ffee88", r: "#ff4040", p: "#c8c8d8", R: "#e02828", Y: "#ffd400", W: "#ffffff", B: "#40a8ff" };
function makeSprite(rows, pal) {
  const c = document.createElement('canvas');
  c.width = Math.max(...rows.map(r => r.length)); c.height = rows.length;
  const x = c.getContext('2d');
  rows.forEach((row, j) => [...row].forEach((ch, i) => { const col = pal[ch]; if (!col) return; x.fillStyle = col; x.fillRect(i, j, 1, 1); }));
  return c;
}
const cache = {};
DG.Sprites = {
  car(kind) { return cache[kind] || (cache[kind] = makeSprite(CAR, Object.assign({}, COMMON, BODY[kind]))); },
  flagS() { return cache.flagS || (cache.flagS = makeSprite(FLAG_S, COMMON)); },
  // 車を (cx,cy) に、高さ h で描く。rot=0 で前(鼻先)が上、Math.PI で下向き。ドットがにじまないよう補間を切る
  drawCar(ctx, kind, cx, cy, h, rot) {
    const sp = this.car(kind), w = h * sp.width / sp.height;
    ctx.save(); ctx.translate(cx, cy); if (rot) ctx.rotate(rot); ctx.imageSmoothingEnabled = false; ctx.drawImage(sp, -w / 2, -h / 2, w, h); ctx.restore();
  },
};
})();
