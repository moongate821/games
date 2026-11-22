// 古い iPhone・iPad(iOS 15 以前の Safari)で、落ち物ゲームが動かない原因の補い。他のスクリプトより先に読み込む。
//   ctx.roundRect(角丸の四角形)は iOS 16 の Safari から入った機能。無い端末では描くたびにエラーになり、画面が何も描かれなかった。
(function () {
  function rr(x, y, w, h, r) {
    if (r && typeof r === 'object' && !Array.isArray(r)) r = r.x;     // DOMPointInit
    if (Array.isArray(r)) r = r[0];                                    // 4隅べつべつの指定は、1つ目をそろえて使う(このゲームでは使っていない)
    r = +r || 0;
    if (w < 0) { x += w; w = -w; }
    if (h < 0) { y += h; h = -h; }
    r = Math.max(0, Math.min(r, w / 2, h / 2));
    this.moveTo(x + r, y);
    this.arcTo(x + w, y, x + w, y + h, r);
    this.arcTo(x + w, y + h, x, y + h, r);
    this.arcTo(x, y + h, x, y, r);
    this.arcTo(x, y, x + w, y, r);
    this.closePath();
  }
  if (window.CanvasRenderingContext2D && !CanvasRenderingContext2D.prototype.roundRect) CanvasRenderingContext2D.prototype.roundRect = rr;
  if (window.Path2D && !Path2D.prototype.roundRect) Path2D.prototype.roundRect = rr;
  if (window.OffscreenCanvasRenderingContext2D && !OffscreenCanvasRenderingContext2D.prototype.roundRect) OffscreenCanvasRenderingContext2D.prototype.roundRect = rr;
})();
