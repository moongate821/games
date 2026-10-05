// CPU(AI): 置ける全ての「向き×横位置」を試し、置いた後の盤面を点数化して一番よい所へ操作して落とす。
// 点数のつけ方はゲームごと(rules.aiEval)。強さ = 操作の速さ + 選び方のぶれ。
(() => {
const DG = window.DG, { COLS, ROWS } = DG.C;
const LEVELS = [
  { name: 'よわい', delay0: .55, interval: .22, noise: 22, hard: false },
  { name: 'ふつう', delay0: .30, interval: .12, noise: 6, hard: true },
  { name: 'つよい', delay0: .12, interval: .06, noise: 0.5, hard: true },
];

// ブロックを置いたあとの盤面(種類キーの配列)を作る。副ブロックが宙に浮く場合は列ごとに詰める。
function simulate(P, px, rot, py, keys) {
  const cg = P.grid.map(r => r.map(c => c ? P.rules.aiKey(c) : null));
  const p = P.piece, [sx, sy] = P.satPos(px, py, rot);
  cg[py][px] = keys ? keys[0] : P.rules.aiKey(p.b[0]); cg[sy][sx] = keys ? keys[1] : P.rules.aiKey(p.b[1]);
  for (let x = 0; x < COLS; x++) { let w = ROWS - 1; for (let y = ROWS - 1; y >= 0; y--) if (cg[y][x] != null) { const v = cg[y][x]; cg[y][x] = null; cg[w][x] = v; w--; } }
  return cg;
}
function choose(P, lv) {
  const opts = [], variants = P.rules.aiVariants ? P.rules.aiVariants(P) : null;     // 色が未確定なら、可能性ごとの平均で評価
  for (let rot = 0; rot < 4; rot++) for (let px = 0; px < COLS; px++) {
    if (!P.fits(px, 1, rot)) continue;
    let py = 1; while (P.fits(px, py + 1, rot)) py++;
    let s = 0;
    if (variants) for (const v of variants) s += v.w * P.rules.aiEval(simulate(P, px, rot, py, v.keys));
    else s = P.rules.aiEval(simulate(P, px, rot, py));
    opts.push({ px, rot, s: s + Math.random() * lv.noise });
  }
  if (!opts.length) return null;
  opts.sort((a, b) => b.s - a.s); return opts[0];
}

class Controller {
  constructor(P, levelIdx) { this.P = P; this.lv = LEVELS[levelIdx]; this.t = 0; this.pid = null; this.plan = null; P.ai = this; P.tag = 'CPU ' + this.lv.name; P.hints = ['CPU が操作中', '(' + this.lv.name + ')', '']; }
  update(dt) {
    const P = this.P;
    if (P.phase !== 'play' || !P.piece) { this.pid = null; this.plan = null; P.hold.down = false; return; }
    if (this.pid !== P.piece) {
      this.pid = P.piece; this.plan = null; this.t = this.lv.delay0; P.hold.down = false; this.replanned = false;
    }
    this.t -= dt; if (this.t > 0) return; this.t = this.lv.interval;
    const p = P.piece;
    if (P.rules.aiVariants && !this.replanned && p.b[0].c >= 0 && p.b[1].c >= 0) { this.replanned = true; this.plan = null; }   // 色が決まったら、見て決め直す
    if (!this.plan) this.plan = choose(P, this.lv);
    const pl = this.plan; if (!pl) { P.hardDrop(); return; }
    if (p.rot !== pl.rot) { const before = p.rot; P.rotate(1); if (p.rot === before) pl.rot = p.rot; return; }
    if (p.px !== pl.px) { const before = p.px; P.move(p.px < pl.px ? 1 : -1); if (p.px === before) pl.px = p.px; return; }
    if (this.lv.hard && !P.rules.aiVariants) P.hardDrop(); else P.hold.down = true;      // 量子は途中で実体化するので、すとんと落とさず普通に落とす
  }
}
DG.AI = { Controller, LEVELS };
})();
