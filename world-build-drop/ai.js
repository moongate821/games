// CPU(AI): 置ける全ての「向き/並び/面 × 横位置」を試し、置いた後の盤面を点数化して一番よい所へ操作して落とす。
// 点数のつけ方はゲームごと(rules.aiEval)。強さ = 操作の速さ + 選び方のぶれ。
(() => {
const DG = window.DG, { COLS, ROWS } = DG.C;
const LEVELS = [
  { name: 'よわい', delay0: .55, interval: .22, noise: 22, hard: false },
  { name: 'ふつう', delay0: .30, interval: .12, noise: 6, hard: true },
  { name: 'つよい', delay0: .12, interval: .06, noise: 0.5, hard: true },
];

// 駒を置いたあとの盤面(種類キーの配列)。浮いたセルは列ごとに詰める。cells = [[x, y, 中身], ...]
function simulate(P, cells) {
  const cg = P.grid.map(r => r.map(c => c ? P.rules.aiKey(c) : null));
  for (const [x, y, b] of cells) cg[y][x] = P.rules.aiKey(b);
  for (let x = 0; x < COLS; x++) { let w = ROWS - 1; for (let y = ROWS - 1; y >= 0; y--) if (cg[y][x] != null) { const v = cg[y][x]; cg[y][x] = null; cg[w][x] = v; w--; } }
  return cg;
}
function choose(P, lv) {
  const opts = [], n = P.variantCount();
  for (let v = 0; v < n; v++) for (let px = 0; px < COLS; px++) {
    const r = P.variantCells(v, px); if (!r) continue;
    opts.push({ px, v, rot: r.rot, s: P.rules.aiEval(simulate(P, r.cells)) + Math.random() * lv.noise });
  }
  if (!opts.length) return null;
  opts.sort((a, b) => b.s - a.s); return opts[0];
}

class Controller {
  constructor(P, levelIdx) { this.P = P; this.lv = LEVELS[levelIdx]; this.t = 0; this.pid = null; this.plan = null; P.ai = this; P.tag = 'CPU ' + this.lv.name; P.hints = ['CPU が操作中', '(' + this.lv.name + ')', '']; }
  update(dt) {
    const P = this.P;
    if (P.phase !== 'play' || !P.piece) { this.pid = null; this.plan = null; P.hold.down = false; return; }
    if (this.pid !== P.piece) { this.pid = P.piece; this.plan = null; this.t = this.lv.delay0; P.hold.down = false; }
    if (P.canSwapNow() && this.swapPiece !== P.piece) {           // 落下中に、入れ替えを1回だけ試す(良い入れ替えがなければ、使わない)
      this.swapDelay = (this.swapDelay === undefined ? this.lv.delay0 * 1.5 + .4 : this.swapDelay) - dt;
      if (this.swapDelay <= 0) { this.swapPiece = P.piece; this.swapDelay = undefined; const r = P.rules.aiSwap && P.rules.aiSwap(P); if (r && P.doSwap(r.x, r.y, r.dir)) return; }
    }
    this.t -= dt; if (this.t > 0) return; this.t = this.lv.interval;
    const p = P.piece, pair = (p.kind || 'pair') === 'pair';
    if (!this.plan) this.plan = choose(P, this.lv);
    const pl = this.plan; if (!pl) { P.hardDrop(); return; }
    if (pair) { if (p.rot !== pl.rot) { const before = p.rot; P.rotate(1); if (p.rot === before) pl.rot = p.rot; return; } }
    else if (pl.v > 0) { P.rotate(1); pl.v--; return; }                  // 3語の駒・サイコロ: あと何回まわすか
    if (p.px !== pl.px) { const before = p.px; P.move(p.px < pl.px ? 1 : -1); if (p.px === before) pl.px = p.px; return; }
    if (this.lv.hard) P.hardDrop(); else P.hold.down = true;
  }
}
DG.AI = { Controller, LEVELS };
})();
