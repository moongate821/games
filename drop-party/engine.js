// 共通エンジン: 2個1組の落下・回転・接地猶予・連鎖の進行・おじゃま(対戦)・メニュー・入力・メインループ。
// ゲームごとの違い(ブロックの種類、進化/消去のルール、見た目)は rules(DG.terrarium / DG.quantum)が持つ。
(() => {
const DG = window.DG = window.DG || {};
const { Sfx, Music } = DG.Audio;
const COLS = 6, ROWS = 12, CELL = 44, BX = 24, BY = 64, PW = 480, H = 640;
const DIRS = [[0, -1], [1, 0], [0, 1], [-1, 0]];      // 副ブロックの向き 0=上 1=右 2=下 3=左
DG.C = { COLS, ROWS, CELL, BX, BY, PW, H, DIRS };
// 連鎖の倍率(得点にかかる)と、攻撃に足す連鎖ボーナス。連鎖が大きいほど急に伸びる
const CHAIN_MULT = [1, 2, 4, 7, 11, 16, 22, 30, 40, 52, 66, 82];
DG.chainMult = n => CHAIN_MULT[Math.min(n, CHAIN_MULT.length - 1)];
DG.chainBonus = n => n < 2 ? 0 : Math.floor(n * n * 0.6);        // 2連鎖=2, 3連鎖=5, 5連鎖=15, 8連鎖=38

function text(ctx, s, x, y, size, color, align, o) {
  s = DG.t(s);                      // 言語設定(日本語/English)で翻訳
  ctx.font = `bold ${size}px "Segoe UI","Yu Gothic","Hiragino Sans",sans-serif`; ctx.textAlign = align || 'left'; ctx.textBaseline = 'alphabetic';
  if (o && o.maxW) {                // 英語は長いので、枠(maxW)に収まるまで文字を小さくする
    while (size > 8 && ctx.measureText(s).width > o.maxW) { size -= 0.5; ctx.font = `bold ${size}px "Segoe UI","Yu Gothic","Hiragino Sans",sans-serif`; }
  }
  if (o && o.stroke) { ctx.lineWidth = o.sw || 4; ctx.strokeStyle = o.stroke; ctx.lineJoin = 'round'; ctx.strokeText(s, x, y); }
  ctx.fillStyle = color; ctx.fillText(s, x, y);
}
const rr = (ctx, x, y, w, h, r) => { ctx.beginPath(); ctx.roundRect(x, y, w, h, r); };
DG.text = text; DG.rr = rr;

class Player {
  constructor(rules, ox, idx, vs) { this.rules = rules; this.ox = ox; this.idx = idx; this.vs = vs; this.opp = null; this.best = 0; this.reset(); }
  reset() {
    this.grid = Array.from({ length: ROWS }, () => Array(COLS).fill(null));
    this.stat = {}; this.rules.init && this.rules.init(this);
    this.next = [this.rules.makePiece(this), this.rules.makePiece(this)];
    this.pop = null;
    this.piece = null; this.phase = 'play'; this.res = null; this.result = null;
    this.score = 0; this.lockScore = 0; this.chain = 0; this.maxChain = 0; this.placed = 0; this.time = 0; this.pending = 0; this.sent = 0;
    this.msg = ''; this.msgT = 0; this.msgPri = 0; this.fx = []; this.flash = 0; this.shake = 0;
    this.hold = { left: false, right: false, down: false }; this.dasT = { left: 0, right: 0 };
    const al = this.rules.actLabel;
    this.hints = !this.vs ? ['← → 移動  ↓ 加速', '↑ 回転  Z 逆回転', 'Space ' + al]
      : this.idx === 0 ? ['A D 移動  S 加速', 'W 回転  Q 逆回転', 'E ' + al] : ['← → 移動  ↓ 加速', '↑ 回転  . 逆回転', '/ ' + al];
    this.say(this.rules.hello, 4, 1);
    this.spawn();
  }
  say(t, sec, pri) { if (!t || (this.ai && (pri || 0) < 5)) return; if (pri >= this.msgPri || this.msgT <= 0) { this.msg = t; this.msgT = sec || 3; this.msgPri = pri || 0; } }
  burst(gx, gy, color, n) {
    for (let i = 0; i < n; i++) {
      const a = Math.random() * 6.28, s = 40 + Math.random() * 130;
      this.fx.push({ x: BX + (gx + .5) * CELL, y: BY + (gy + .5) * CELL, vx: Math.cos(a) * s, vy: Math.sin(a) * s - 60, life: .45 + Math.random() * .4, color });
    }
  }
  // ---------- 落下ペア ----------
  spawn() {
    if (this.grid[1][2] || this.grid[0][2]) return this.gameOver();
    const n = this.next.shift(); this.next.push(this.rules.makePiece(this));
    this.piece = { px: 2, py: 1, rot: 0, b: n.b, ent: n.ent, special: n.special, fall: 0, lock: 0, age: 0 };
    this.phase = 'play';
    this.rules.onSpawn && this.rules.onSpawn(this);
  }
  satPos(px, py, rot) { return [px + DIRS[rot][0], py + DIRS[rot][1]]; }
  free(x, y) { return x >= 0 && x < COLS && y >= 0 && y < ROWS && !this.grid[y][x]; }
  fits(px, py, rot) { const [sx, sy] = this.satPos(px, py, rot); return this.free(px, py) && this.free(sx, sy); }
  canMove(dx, dy) { const p = this.piece; return this.fits(p.px + dx, p.py + dy, p.rot); }
  landing() { const p = this.piece; let gy = p.py; while (this.fits(p.px, gy + 1, p.rot)) gy++; return gy; }
  move(dx) { if (this.phase === 'play' && this.canMove(dx, 0)) { this.piece.px += dx; this.piece.lock = 0; Sfx.move(); } }
  rotate(dir) {
    if (this.phase !== 'play') return;
    const p = this.piece, nr = (p.rot + dir + 4) % 4;
    for (const [kx, ky] of [[0, 0], [-DIRS[nr][0], -DIRS[nr][1]]]) if (this.fits(p.px + kx, p.py + ky, nr)) { p.px += kx; p.py += ky; p.rot = nr; p.lock = 0; Sfx.rot(); return; }
    const fr = (p.rot + 2) % 4; if (this.fits(p.px, p.py, fr)) { p.rot = fr; p.lock = 0; Sfx.rot(); }
  }
  hardDrop() {
    if (this.phase !== 'play') return;
    const p = this.piece; let n = 0; while (this.canMove(0, 1)) { p.py++; n++; }
    this.score += n * 2; this.lockPiece();
  }
  press(a) {
    if (this.phase !== 'play') { if (a === 'down') this.hold.down = true; return; }
    if (a === 'left') { this.move(-1); this.hold.left = true; this.dasT.left = 0.17; }
    else if (a === 'right') { this.move(1); this.hold.right = true; this.dasT.right = 0.17; }
    else if (a === 'down') this.hold.down = true;
    else if (a === 'rot') this.rotate(1); else if (a === 'rotL') this.rotate(-1);
    else if (a === 'act') this.rules.act(this);
  }
  release(a) { if (a in this.hold) this.hold[a] = false; }
  lockPiece() {
    const p = this.piece, [sx, sy] = this.satPos(p.px, p.py, p.rot);
    this.rules.finalize && this.rules.finalize(this, p);
    this.lockScore = this.score;
    this.grid[p.py][p.px] = this.mk(p.b[0]); this.grid[sy][sx] = this.mk(p.b[1]);
    this.piece = null; this.placed++; this.chain = 0; this.turnDone = false;
    Sfx.lock(); this.applyGravity();
    this.phase = 'resolve'; this.res = { stage: 'settle', t: 0 };
  }
  mk(payload) { return Object.assign({ oy: 0, vy: 0, pop: 0, clr: 0 }, payload); }

  // ---------- 盤面 ----------
  applyGravity() {
    for (let x = 0; x < COLS; x++) {
      let w = ROWS - 1;
      for (let y = ROWS - 1; y >= 0; y--) {
        const c = this.grid[y][x]; if (!c) continue;
        if (w !== y) { this.grid[w][x] = c; this.grid[y][x] = null; c.oy -= (w - y); c.vy = 0; }
        w--;
      }
    }
  }
  animateFalls(dt) {
    let moving = false;
    for (const row of this.grid) for (const c of row) if (c) {
      if (c.pop > 0) c.pop = Math.max(0, c.pop - dt * 3);
      if (c.oy < 0) { c.vy += 60 * dt; c.oy += c.vy * dt; if (c.oy >= 0) { c.oy = 0; c.vy = 0; } else moving = true; }
    }
    return moving;
  }
  settleInstant() { for (const row of this.grid) for (const c of row) if (c) { c.oy = 0; c.vy = 0; } }

  updateResolve(dt) {
    const R = this.res;
    if (R.stage === 'settle') {
      if (this.animateFalls(dt)) return;
      const plan = this.rules.step(this);
      if (plan) { R.plan = plan; plan.mark && plan.mark(); R.stage = 'pre'; R.t = plan.pre || 0; }
      else this.endChain();
    } else if (R.stage === 'pre') {
      this.animateFalls(dt); R.t -= dt;
      if (R.t <= 0) {
        const s0 = this.score; R.plan.apply(); this.chain++; this.maxChain = Math.max(this.maxChain, this.chain);
        if (this.chain >= 2) {
          Sfx.chime(this.chain - 2); this.shake = Math.min(14, 2 + this.chain * 1.8);
          this.pop = { n: this.chain, gain: this.score - s0, t: 1.5, born: this.time };      // 「N連鎖!」の表示
        }
        R.stage = 'post'; R.t = R.plan.post || 0;
      }
    } else {
      this.animateFalls(dt); R.t -= dt;
      if (R.t <= 0) { this.applyGravity(); R.stage = 'settle'; }
    }
  }
  // 連鎖が終わった: 攻撃の計算(相殺 → 相手へ)、予告おじゃまの落下、次のペア
  endChain() {
    if (!this.turnDone) {       // 1手に1回: ゲーム固有の「時間の経過」(枯れる・嵐など)。盤面が変わったら、もう一度つながりを調べる
      this.turnDone = true;
      if (this.rules.onTurn && this.rules.onTurn(this)) { if (this.phase !== 'over') { this.phase = 'resolve'; this.res = { stage: 'settle', t: 0 }; } return; }
    }
    if (this.vs && this.opp) {
      // 攻撃 = 得点÷定数 + 連鎖ボーナス(連鎖が大きいほど急に増える)
      let send = Math.floor((this.score - this.lockScore) / this.rules.garbageDiv) + Math.round(DG.chainBonus(this.chain) * (this.rules.bonusScale || 1));
      if (send > 0 && this.pending > 0) { const c = Math.min(send, this.pending); this.pending -= c; send -= c; this.say('相殺!', 1.5, 6); Sfx.send(); }
      if (send > 0) { this.opp.pending += send; this.sent += send; Sfx.send(); this.say(`${send} こ おくった!`, 2, 5); }
      this.lockScore = this.score;
      if (this.pending > 0) { this.dropGarbage(); return; }
    }
    this.res = null; this.spawn();
  }
  dropGarbage() {
    const n = Math.min(this.pending, COLS * 3); this.pending -= n; this.chain = 0;
    this.rainCells(n, () => this.rules.garbageCell(), true);
  }
  // 盤の上から n 個のセルを(ランダムな列に)降らせる。おじゃま・嵐の石・恵みの雨で共通
  rainCells(n, make, isGarbage) {
    const cols = [0, 1, 2, 3, 4, 5].sort(() => Math.random() - .5), cnt = Array(COLS).fill(0);
    let over = false;
    for (let k = 0; k < n; k++) {
      const x = cols[k % COLS]; let top = ROWS; for (let y = 0; y < ROWS; y++) if (this.grid[y][x]) { top = y; break; }
      const y = top - 1 - cnt[x]; cnt[x]++;
      if (y < 0) { over = true; continue; }
      const c = this.mk(make()); c.oy = -(y + 2 + (k >> 1) * 0.3); this.grid[y][x] = c;
    }
    Sfx.garbage(); this.shake = 8; if (isGarbage) this.say('おじゃまが ふってきた…', 2.5, 4);
    this.phase = 'resolve'; this.res = { stage: 'settle', t: 0 }; if (isGarbage) this.lockScore = this.score;
    if (over) this.gameOver();
  }
  gameOver() {
    if (this.phase === 'over') return;
    this.phase = 'over'; this.piece = null; this.res = null; Sfx.over();
    if (this.score > this.best) this.best = this.score;
    this.say(this.rules.overMsg, 99, 9);
  }
  update(dt) {
    this.time += dt;
    if (this.msgT > 0) this.msgT -= dt;
    if (this.pop) this.pop.t -= dt;
    if (this.flash > 0) this.flash -= dt * 2;
    if (this.shake > 0) this.shake = Math.max(0, this.shake - dt * 20);
    for (const f of this.fx) { f.x += f.vx * dt; f.y += f.vy * dt; f.vy += 300 * dt; f.life -= dt; }
    this.fx = this.fx.filter(f => f.life > 0);
    if (this.ai) this.ai.update(dt);
    if (this.phase === 'play') {
      for (const d of ['left', 'right']) if (this.hold[d]) { this.dasT[d] -= dt; if (this.dasT[d] <= 0) { this.move(d === 'left' ? -1 : 1); this.dasT[d] = 0.05; } }
      this.rules.update && this.rules.update(this, dt);
      this.updatePlay(dt);
    } else if (this.phase === 'resolve') this.updateResolve(dt);
  }
  updatePlay(dt) {
    const p = this.piece; if (!p) return;
    const level = Math.floor(this.placed / 12), soft = this.hold.down;
    const interval = soft ? 0.045 : Math.max(0.1, 0.78 - level * 0.06);
    p.fall += dt; p.age = (p.age || 0) + dt;
    if (this.canMove(0, 1)) { p.lock = 0; if (p.fall >= interval) { p.fall = 0; p.py++; if (soft) this.score += 1; } }
    else { p.fall = 0; p.lock += dt * (soft ? 5 : 1); if (p.lock >= 0.45) this.lockPiece(); }
  }
  dangerRow() { for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++) if (this.grid[y][x]) return y; return ROWS; }

  // ---------- 描画 ----------
  draw(ctx, t) {
    const R = this.rules, th = R.theme;
    ctx.save(); ctx.translate(this.ox, 0);
    if (this.shake > 0) ctx.translate((Math.random() - .5) * this.shake, (Math.random() - .5) * this.shake);
    text(ctx, R.title, 24, 40, 24, th.title, 'left', { stroke: th.titleStroke, sw: 5 });
    if (this.tag) text(ctx, this.tag, BX + COLS * CELL, 22, 13, th.title, 'right', { stroke: th.titleStroke, sw: 4 });
    // 盤
    ctx.fillStyle = th.glass; rr(ctx, BX - 6, BY - 6, COLS * CELL + 12, ROWS * CELL + 12, 14); ctx.fill();
    ctx.strokeStyle = th.line; ctx.lineWidth = 3; ctx.stroke();
    ctx.strokeStyle = th.grid; ctx.lineWidth = 1;
    for (let x = 1; x < COLS; x++) { ctx.beginPath(); ctx.moveTo(BX + x * CELL, BY); ctx.lineTo(BX + x * CELL, BY + ROWS * CELL); ctx.stroke(); }
    for (let y = 1; y < ROWS; y++) { ctx.beginPath(); ctx.moveTo(BX, BY + y * CELL); ctx.lineTo(BX + COLS * CELL, BY + y * CELL); ctx.stroke(); }
    ctx.fillStyle = th.danger; ctx.fillRect(BX + 2 * CELL, BY, CELL, 2 * CELL);
    ctx.save(); ctx.beginPath(); ctx.rect(BX, BY, COLS * CELL, ROWS * CELL); ctx.clip();
    for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++) {
      const c = this.grid[y][x]; if (!c) continue;
      R.drawCell(ctx, c, BX + x * CELL, BY + (y + c.oy) * CELL, CELL, 1 + c.pop * .3, t);
    }
    if (this.piece) {
      const p = this.piece, [sx, sy] = this.satPos(p.px, p.py, p.rot), gy = this.landing(), [gsx, gsy] = this.satPos(p.px, gy, p.rot);
      ctx.globalAlpha = .22;
      if (R.ghost === 'outline') {           // 枠はブロックに見えて紛らわしいので、落ちる列の光の柱と着地の▼だけにする
        ctx.globalAlpha = 1;
        for (const [x, y, y0] of [[p.px, gy, p.py], [gsx, gsy, sy]]) {
          const top = Math.min(y0, y) * CELL, bot = (Math.max(y0, y) + 1) * CELL;
          ctx.fillStyle = 'rgba(190,210,255,.07)'; ctx.fillRect(BX + x * CELL, BY + top, CELL, bot - top);
          ctx.fillStyle = 'rgba(255,230,140,.75)'; const cx = BX + (x + .5) * CELL, cy = BY + (y + 1) * CELL - 7;
          ctx.beginPath(); ctx.moveTo(cx - 7, cy - 6); ctx.lineTo(cx + 7, cy - 6); ctx.lineTo(cx, cy + 3); ctx.closePath(); ctx.fill();
        }
      }
      else { R.drawCell(ctx, p.b[0], BX + p.px * CELL, BY + gy * CELL, CELL, 1, t); R.drawCell(ctx, p.b[1], BX + gsx * CELL, BY + gsy * CELL, CELL, 1, t); }
      ctx.globalAlpha = 1;
      R.drawPieceExtra && R.drawPieceExtra(ctx, this, gy, t);
      R.drawCell(ctx, p.b[0], BX + p.px * CELL, BY + p.py * CELL, CELL, 1, t, 0);
      R.drawCell(ctx, p.b[1], BX + sx * CELL, BY + sy * CELL, CELL, 1, t, 1);
      if (p.ent) this.drawThread(ctx, p, sx, sy, t);
    }
    for (const f of this.fx) { ctx.globalAlpha = Math.min(1, f.life * 2); ctx.fillStyle = f.color; ctx.beginPath(); ctx.arc(f.x, f.y, 3, 0, 6.3); ctx.fill(); }
    ctx.globalAlpha = 1; ctx.restore();
    if (this.flash > 0) { ctx.fillStyle = th.flash.replace('A', (this.flash * .3).toFixed(2)); ctx.fillRect(BX, BY, COLS * CELL, ROWS * CELL); }
    // 予告おじゃま
    if (this.vs && this.pending > 0) {
      const g = this.rules.garbageCell(), n = Math.min(6, this.pending);
      for (let i = 0; i < n; i++) R.drawCell(ctx, this.mk(g), BX + COLS * CELL - (i + 1) * 20, 40, 20, 1, t);
      if (this.pending > 6) text(ctx, '+' + (this.pending - 6), BX + COLS * CELL - 6 * 20 - 8, 56, 14, th.title, 'right', { stroke: th.titleStroke, sw: 3 });
    }
    // パネル
    ctx.fillStyle = th.card; rr(ctx, 306, 62, 168, 530, 14); ctx.fill();
    R.drawPanel(ctx, this, 316, t);
    if (this.pop && this.pop.t > 0) this.drawChainPop(ctx);
    // メッセージ
    ctx.fillStyle = th.msgBg; rr(ctx, 16, 602, PW - 32, 30, 10); ctx.fill();
    if (this.msgT > 0 || this.phase === 'over') {
      ctx.save(); ctx.beginPath(); ctx.rect(22, 602, PW - 44, 30); ctx.clip();
      let fs = 14; const s = DG.t(R.nav) + ' ' + DG.t(this.msg); ctx.font = `bold ${fs}px sans-serif`;
      while (fs > 9 && ctx.measureText(s).width > PW - 60) { fs--; ctx.font = `bold ${fs}px sans-serif`; }
      text(ctx, s, 28, 623, fs, th.msgText); ctx.restore();
    }
    if (this.result) {
      ctx.fillStyle = 'rgba(0,0,0,.55)'; rr(ctx, BX - 6, BY - 6, COLS * CELL + 12, ROWS * CELL + 12, 14); ctx.fill();
      DG.Rank.drawResult(ctx, this, BX + COLS * CELL / 2, t, S.players.length === 1 ? S.entry : null);
    }
    ctx.restore();
  }
  // 盤の中央に「N連鎖!」を大きく出す。連鎖が増えるたびにポンと跳ねて、数が大きいほど派手な色になる
  drawChainPop(ctx) {
    const q = this.pop, age = 1.5 - q.t, n = q.n;
    const bounce = age < .25 ? 1 + (1 - age / .25) * .6 : 1, fade = Math.min(1, q.t / .4);
    const hue = n >= 8 ? (this.time * 400) % 360 : n >= 6 ? 0 : n >= 4 ? 25 : 48, col = `hsl(${hue},100%,${n >= 8 ? 62 : 60}%)`;
    const cx = BX + COLS * CELL / 2, cy = BY + 150 - Math.min(age, .6) * 20, size = Math.min(60, 30 + n * 4);
    ctx.save(); ctx.globalAlpha = fade; ctx.translate(cx, cy); ctx.scale(bounce, bounce);
    if (n >= 4) { ctx.fillStyle = `hsla(${hue},100%,60%,.25)`; ctx.beginPath(); ctx.arc(0, -size * .3, size * 1.5, 0, 6.3); ctx.fill(); }
    text(ctx, `${n} 連鎖!`, 0, 0, size, col, 'center', { stroke: '#3a1a00', sw: 8 });
    text(ctx, `+${q.gain}`, 0, size * .6, 20, '#fff', 'center', { stroke: '#3a1a00', sw: 5 });
    const bonus = Math.round(DG.chainBonus(n) * (this.rules.bonusScale || 1));
    if (this.vs && bonus > 0) text(ctx, `おじゃま +${bonus}`, 0, size * .6 + 24, 15, '#ffd0d0', 'center', { stroke: '#3a1a00', sw: 4 });
    ctx.restore();
  }
  drawThread(ctx, p, sx, sy, t) {
    const x1 = BX + (p.px + .5) * CELL, y1 = BY + (p.py + .5) * CELL, x2 = BX + (sx + .5) * CELL, y2 = BY + (sy + .5) * CELL;
    this.rules.drawThread && this.rules.drawThread(ctx, x1, y1, x2, y2, p.ent, t);
  }
}
DG.Player = Player;

// ====================== メイン(メニュー・入力・ループ) ======================
const cv = document.getElementById('c'), ctx = cv.getContext('2d');
// mode 0=ひとり 1=ふたり対戦 2=CPUと対戦 3=デモ(AI同士)  cpu=CPUの強さ 0..2  lv[ゲーム]=4段階モード 0..3(やさしい/ふつう/むずかしい/カオス)
const menu = { sel: 0, mode: 0, cpu: 1, lv: [0, 0] };
const MODE_NAMES = ['ひとりで', 'ふたりで対戦', 'CPUと対戦', 'デモ観戦'];
const S = { scene: 'menu', players: [], paused: false, t: 0, rules: null, demo: false, cpuMode: false, idle: 0, demoT: 0 };
const RULES = () => [DG.terrarium, DG.quantum];

function setCanvas(w) { cv.width = w; cv.height = H; cv.style.aspectRatio = `${w}/${H}`; }
setCanvas(960);

function startGame() {
  commitEntry(); DG.Audio.init(); Sfx.start();
  const rules = RULES()[menu.sel], n = menu.mode === 0 ? 1 : 2, vs = n === 2;
  setCanvas(PW * n);
  if (rules.setOptions) rules.setOptions({ level: menu.lv[menu.sel] });
  S.rules = rules; S.players = []; S.demo = menu.mode === 3; S.cpuMode = menu.mode === 2; S.demoT = 0;
  for (let i = 0; i < n; i++) S.players.push(new Player(rules, i * PW, i, vs));
  if (vs) { S.players[0].opp = S.players[1]; S.players[1].opp = S.players[0]; S.players[0].tag = '1P'; S.players[1].tag = '2P'; }
  if (S.cpuMode) { S.players[0].hints = ['← → 移動  ↓ 加速', '↑ 回転  Z 逆回転', 'Space ' + rules.actLabel]; new DG.AI.Controller(S.players[1], menu.cpu); S.players[0].tag = 'あなた'; }
  if (S.demo) { new DG.AI.Controller(S.players[0], menu.cpu); new DG.AI.Controller(S.players[1], menu.cpu); }
  S.scene = 'play'; S.paused = false; Music.play(rules.bgm);
  document.body.dataset.scene = 'play';
}
function toMenu() { commitEntry(); S.scene = 'menu'; S.players = []; S.demo = false; S.cpuMode = false; S.idle = 0; setCanvas(960); Music.play('menu'); document.body.dataset.scene = 'menu'; }
function checkEnd() {
  if (S.scene !== 'play') return;
  const ps = S.players, lost = ps.filter(p => p.phase === 'over');
  if (!lost.length) return;
  if (ps.length === 1) ps[0].result = 'over';
  else if (lost.length === 2) { ps[0].result = ps[1].result = 'lose'; }
  else for (const p of ps) p.result = p.phase === 'over' ? 'lose' : 'win';
  S.scene = 'result'; S.demoT = 0;
  if (ps.length === 2 && lost.length === 1 && !S.demo) Sfx.win();
  if (!S.demo) finalizeResult();
}
// 称号を授与し、ひとりプレイならランキングに入るか調べる(名前の入力待ちにする)
function finalizeResult() {
  const rid = S.rules.id, R = DG.Rank;
  for (const p of S.players) {
    if (p.ai) continue;
    p.award = R.award(rid, p); p.newTitle = R.noteGame(rid, p.award.tier);
  }
  for (const p of S.players) if (p.ai) p.award = R.award(rid, p);       // CPUの分は表示だけ
  if (S.players.length === 1) {
    const p = S.players[0]; p.rankPos = R.qualifies(rid, p.score);
    S.entry = p.rankPos ? { game: rid, name: R.name, fresh: true, rec: { score: p.score, tier: p.award.tier, title: p.award.title, chain: p.maxChain, lv: S.rules.levelName ? S.rules.levelName() : '', date: new Date().toISOString().slice(0, 10) } } : null;
    if (p.newTitle || p.rankPos === 1) Sfx.win();
  } else {
    if (S.cpuMode && S.players[0].result === 'win') { R.noteVs(menu.cpu); S.players[0].award.feats.unshift({ icon: '🤖', name: `CPU(${DG.AI.LEVELS[menu.cpu].name})撃破` }); }
    else if (!S.cpuMode) R.noteVs(null);
  }
}
function commitEntry() {
  if (!S.entry) return;
  const e = S.entry; S.entry = null; e.rec.name = (e.name || 'PLAYER').trim().slice(0, 8) || 'PLAYER';
  const pos = DG.Rank.addRecord(e.game, e.rec); if (S.players[0]) S.players[0].rankPos = pos;
}

// ---- キー割り当て ----
const MAP1 = { ArrowLeft: 'left', ArrowRight: 'right', ArrowDown: 'down', ArrowUp: 'rot', KeyA: 'left', KeyD: 'right', KeyS: 'down', KeyW: 'rot', KeyX: 'rot', KeyZ: 'rotL', Space: 'act' };
const MAP2 = [
  { KeyA: 'left', KeyD: 'right', KeyS: 'down', KeyW: 'rot', KeyQ: 'rotL', KeyE: 'act' },
  { ArrowLeft: 'left', ArrowRight: 'right', ArrowDown: 'down', ArrowUp: 'rot', Period: 'rotL', Slash: 'act' },
];
function actionFor(code) {
  if (S.demo) return null;
  if (S.players.length === 1 || S.cpuMode) return MAP1[code] ? [0, MAP1[code]] : null;
  for (let i = 0; i < 2; i++) if (MAP2[i][code]) return [i, MAP2[i][code]];
  return null;
}
function menuMove(dx, dy) {
  if (dy) { menu.mode = (menu.mode + (dy > 0 ? 1 : 3)) % 4; Sfx.select(); }
}
function confirm() {
  if (S.scene === 'menu') startGame();
  else if (S.scene === 'result') startGame();
}
addEventListener('keydown', e => {
  DG.Audio.init();
  const k = e.code;
  if (['ArrowLeft', 'ArrowRight', 'ArrowDown', 'ArrowUp', 'Space', 'Slash'].includes(k)) e.preventDefault();
  S.idle = 0;
  if (k === 'KeyM' && !(S.scene === 'result' && S.entry)) { Music.toggleMute(); return; }       // 名前入力中は M も文字として使う
  if (k === 'KeyF' && !(S.scene === 'result' && S.entry)) {                                      // F = 全画面の切り替え
    try { if (document.fullscreenElement) document.exitFullscreen(); else document.documentElement.requestFullscreen(); } catch (err) {}
    return;
  }
  if (S.demo) { toMenu(); return; }                         // デモ中は何かキーでメニューへ
  if (S.scene === 'rank') { if (k === 'Escape' || k === 'Enter' || k === 'Space') toMenu(); return; }
  if (S.scene === 'settings') {                              // 設定: ↑↓ えらぶ ← → かえる
    if (k === 'Escape') { toMenu(); return; }
    if (k === 'ArrowUp' || k === 'KeyW') menu.setSel = (menu.setSel + 3) % 4; else if (k === 'ArrowDown' || k === 'KeyS') menu.setSel = (menu.setSel + 1) % 4;
    else if (k === 'ArrowLeft' || k === 'KeyA') settingsChange(-1); else if (k === 'ArrowRight' || k === 'KeyD') settingsChange(1);
    else if (k === 'Enter' || k === 'Space') settingsChange(0);
    return;
  }
  if (S.scene === 'result' && S.entry) {                    // ランキング入りの名前入力
    const en = S.entry;
    if (k === 'Enter') { commitEntry(); Sfx.select(); }
    else if (k === 'Escape') toMenu();
    else if (k === 'Backspace') { en.fresh = false; en.name = en.name.slice(0, -1); }
    else if (/^[A-Za-z0-9 _-]$/.test(e.key)) { if (en.fresh) { en.name = ''; en.fresh = false; } if (en.name.length < 8) en.name += e.key.toUpperCase(); Sfx.move(); }
    return;
  }
  if (S.scene === 'menu') {
    Music.play('menu');
    if (k === 'ArrowLeft' || k === 'KeyA') { menu.sel = 0; Sfx.select(); } else if (k === 'ArrowRight' || k === 'KeyD') { menu.sel = 1; Sfx.select(); }
    else if (k === 'ArrowUp' || k === 'KeyW') menuMove(0, -1); else if (k === 'ArrowDown' || k === 'KeyS') menuMove(0, 1);
    else if (k === 'Digit1') menu.mode = 0; else if (k === 'Digit2') menu.mode = 1; else if (k === 'Digit3') menu.mode = 2; else if (k === 'Digit4') menu.mode = 3;
    else if (k === 'KeyC') { menu.cpu = (menu.cpu + 1) % 3; Sfx.select(); }
    else if (k === 'KeyQ') { menu.lv[menu.sel] = (menu.lv[menu.sel] + 1) % 4; Sfx.select(); }
    else if (k === 'KeyR') { S.scene = 'rank'; Sfx.select(); }
    else if (k === 'KeyO') { S.scene = 'settings'; menu.setSel = 0; Sfx.select(); }
    else if (k === 'Enter' || k === 'Space') confirm();
    return;
  }
  if (k === 'Escape') { toMenu(); return; }
  if (k === 'Enter' && S.scene === 'result') { confirm(); return; }
  if (k === 'KeyP' && S.scene === 'play') { S.paused = !S.paused; return; }
  if (S.scene !== 'play' || S.paused || e.repeat) return;
  const a = actionFor(k); if (a) S.players[a[0]].press(a[1]);
});
addEventListener('keyup', e => {
  const a = actionFor(e.code); if (a && S.players[a[0]]) S.players[a[0]].release(a[1]);
});
document.querySelectorAll('#pad button').forEach(b => {
  const a = b.dataset.a;
  b.addEventListener('pointerdown', e => { e.preventDefault(); DG.Audio.init(); if (S.scene === 'play' && !S.paused) S.players[0].press(a); });
  const up = () => S.players[0] && S.players[0].release(a);
  b.addEventListener('pointerup', up); b.addEventListener('pointerleave', up);
});
const CARDS = [{ x: 50, y: 160, w: 400, h: 330 }, { x: 510, y: 160, w: 400, h: 330 }];
const MODES = [0, 1, 2, 3].map(i => ({ x: 90 + i * 200, y: 508, w: 190, h: 50 }));
const CPUBTN = { x: 20, y: 570, w: 150, h: 26 };
const QDBTNS = [0, 1, 2, 3].map(i => ({ x: 322 + i * 156, y: 566, w: 150, h: 40 }));       // 4段階モード(右寄せ)
const RANKBTN = { x: 780, y: 14, w: 170, h: 36 };
const SETBTN = { x: 780, y: 56, w: 170, h: 34 };
// ---- 設定(言語・音量)----
const SET_ROWS = [0, 1, 2, 3].map(i => ({ x: 200, y: 170 + i * 92, w: 560, h: 74 }));     // 言語 / BGM / 効果音 / もどる
function settingsChange(dx) {
  const st = DG.settings, r = menu.setSel;
  if (r === 0) { DG.i18n.setLang(st.lang === 'ja' ? 'en' : 'ja'); Sfx.select(); }
  else if (r === 1 || r === 2) {
    if (dx === 0) dx = 1;
    const k = r === 1 ? 'music' : 'sfx'; st[k] = Math.max(0, Math.min(10, st[k] + dx)); DG.Audio.applyVolumes(); DG.i18n.save(); Sfx.select();
  } else if (dx === 0) toMenu();
}
function drawSettings(t) {
  DG.Art.bgMenu(ctx, t, 960, H);
  DG.text(ctx, '⚙ ' + DG.t('設定'), 480, 100, 44, '#fff', 'center', { stroke: '#5a3a9a', sw: 9 });
  const st = DG.settings, labels = ['言語 / Language', 'BGMの音量', '効果音の音量', 'もどる'];
  SET_ROWS.forEach((b, i) => {
    const on = menu.setSel === i;
    ctx.fillStyle = on ? 'rgba(255,255,255,.95)' : 'rgba(255,255,255,.75)'; rr(ctx, b.x, b.y, b.w, b.h, 22); ctx.fill();
    ctx.lineWidth = on ? 5 : 2; ctx.strokeStyle = on ? '#ffb02e' : '#8a7aff'; ctx.stroke();
    DG.text(ctx, labels[i], b.x + 26, b.y + 46, 22, '#3b2a7a', 'left');
    const cx = b.x + 400;
    if (i === 0) {
      for (const [j, name] of [[0, '日本語'], [1, 'English']]) {
        const cur = (st.lang === 'ja') === (j === 0), px = cx - 100 + j * 120;
        ctx.fillStyle = cur ? '#8a7aff' : 'rgba(138,122,255,.18)'; rr(ctx, px - 52, b.y + 16, 104, 42, 21); ctx.fill();
        DG.text(ctx, name, px, b.y + 45, 18, cur ? '#fff' : '#6a5aaa', 'center');
      }
    } else if (i === 1 || i === 2) {
      const v = i === 1 ? st.music : st.sfx;
      DG.text(ctx, '◀', cx - 110, b.y + 46, 24, '#6a5aaa', 'center'); DG.text(ctx, '▶', cx + 110, b.y + 46, 24, '#6a5aaa', 'center');
      for (let k = 0; k < 10; k++) { ctx.fillStyle = k < v ? '#8a7aff' : 'rgba(138,122,255,.2)'; rr(ctx, cx - 80 + k * 16, b.y + 22 - (k * 1.2), 12, 30 + k * 1.2, 4); ctx.fill(); }
      DG.text(ctx, String(v), cx + 90, b.y + 12, 13, '#6a5aaa', 'center');
    }
  });
  DG.text(ctx, '↑ ↓ えらぶ   ← → かえる   Esc / Enter で もどる', 480, 600, 15, '#fff', 'center', { stroke: '#3a2a7a', sw: 4 });
}
cv.addEventListener('pointerdown', e => {
  DG.Audio.init(); S.idle = 0;
  if (S.demo) { toMenu(); return; }
  if (S.scene === 'rank') { toMenu(); return; }
  if (S.scene === 'settings') {                                // 行をタップ: 左半分=減らす/右半分=増やす(言語は切替、もどるは戻る)
    const rc = cv.getBoundingClientRect(), sx = (e.clientX - rc.left) / rc.width * cv.width, sy = (e.clientY - rc.top) / rc.height * cv.height;
    SET_ROWS.forEach((b, i) => { if (sx >= b.x && sx <= b.x + b.w && sy >= b.y && sy <= b.y + b.h) { menu.setSel = i; settingsChange(i === 3 ? 0 : (sx < b.x + 400 ? -1 : 1)); } });
    return;
  }
  if (S.scene === 'result' && S.entry) {                      // タップ端末用: 名前を入力して決定
    let nm = null; try { nm = window.prompt(DG.t('なまえを入力 (8文字まで)'), S.entry.name); } catch (err) {}
    if (nm != null) S.entry.name = nm; commitEntry(); return;
  }
  const r = cv.getBoundingClientRect(), x = (e.clientX - r.left) / r.width * cv.width, y = (e.clientY - r.top) / r.height * cv.height;
  if (S.scene === 'menu') {
    Music.play('menu');
    const inR = (b) => x >= b.x && x <= b.x + b.w && y >= b.y && y <= b.y + b.h;
    for (let i = 0; i < 2; i++) if (inR(CARDS[i])) { if (menu.sel === i) confirm(); else { menu.sel = i; Sfx.select(); } return; }
    for (let i = 0; i < 4; i++) if (inR(MODES[i])) { menu.mode = i; Sfx.select(); return; }
    for (let i = 0; i < 4; i++) if (inR(QDBTNS[i])) { menu.lv[menu.sel] = i; Sfx.select(); return; }
    if (inR(CPUBTN) && menu.mode >= 2) { menu.cpu = (menu.cpu + 1) % 3; Sfx.select(); }
    if (inR(RANKBTN)) { S.scene = 'rank'; Sfx.select(); }
    if (inR(SETBTN)) { S.scene = 'settings'; menu.setSel = 0; Sfx.select(); }
  } else if (S.scene === 'result') confirm();
});

// ---- ゲームパッド(1台目=1P、2台目=2P。ひとりの時はどれでも1P) ----
const padPrev = {};
function pollPads() {
  const pads = (navigator.getGamepads && navigator.getGamepads()) || [];
  for (const pad of pads) {
    if (!pad) continue;
    const b = i => pad.buttons[i] && pad.buttons[i].pressed, ax = pad.axes[0] || 0, ay = pad.axes[1] || 0;
    const cur = { left: b(14) || ax < -.5, right: b(15) || ax > .5, down: b(13) || ay > .5, up: b(12) || ay < -.5, rot: b(0), rotL: b(1), act: b(2) || b(3) || b(5) || b(7), start: b(9) };
    const pv = padPrev[pad.index] || {}; padPrev[pad.index] = cur;
    const edge = k => cur[k] && !pv[k];
    if (S.scene === 'rank') { if (edge('start') || edge('rot')) toMenu(); continue; }
    if (S.scene === 'menu') {
      if (edge('left')) { menu.sel = 0; Sfx.select(); } if (edge('right')) { menu.sel = 1; Sfx.select(); }
      if (edge('up') || edge('down')) menuMove(0, 1);
      if (edge('start') || edge('rot')) confirm(); continue;
    }
    if (S.scene === 'result' && edge('start')) { confirm(); continue; }
    if (S.scene !== 'play' || S.paused) continue;
    if (S.demo) continue;
    const p = (S.players.length === 1 || S.cpuMode) ? S.players[0] : S.players[Math.min(pad.index, 1)]; if (!p) continue;
    for (const k of ['left', 'right', 'down']) { if (edge(k)) p.press(k); if (!cur[k] && pv[k]) p.release(k); }
    if (edge('up') || edge('rot')) p.press('rot'); if (edge('rotL')) p.press('rotL'); if (edge('act')) p.press('act');
    if (edge('start')) S.paused = true;
  }
}

// ---- メニュー描画 ----
function drawMenu(t) {
  DG.Art.bgMenu(ctx, t, 960, H);
  DG.text(ctx, 'DROP PARTY', 480, 76, 56, '#fff', 'center', { stroke: '#5a3a9a', sw: 10 });
  DG.text(ctx, 'どっちで あそぶ?', 480, 118, 22, '#fff', 'center', { stroke: '#5a3a9a', sw: 6 });
  { const b = RANKBTN; ctx.fillStyle = 'rgba(255,255,255,.85)'; rr(ctx, b.x, b.y, b.w, b.h, 18); ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = '#ffb02e'; ctx.stroke();
    DG.text(ctx, '🏆 ランキング (R)', b.x + b.w / 2, b.y + 24, 15, '#6a4a00', 'center'); }
  { const b = SETBTN; ctx.fillStyle = 'rgba(255,255,255,.85)'; rr(ctx, b.x, b.y, b.w, b.h, 17); ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = '#8a7aff'; ctx.stroke();
    DG.text(ctx, '⚙ 設定 (O)', b.x + b.w / 2, b.y + 23, 14, '#4a3a8a', 'center'); }
  const bt = DG.Rank.bestTitle();
  if (bt) { DG.Rank.drawBadge(ctx, bt.game, bt.tier, 44, 40, 24, t); DG.text(ctx, 'あなたの称号', 84, 30, 11, '#fff', 'left', { stroke: '#3a2a7a', sw: 3 }); DG.text(ctx, bt.title, 84, 52, 18, '#fff', 'left', { stroke: '#3a2a7a', sw: 5 }); }
  RULES().forEach((R, i) => {
    const c = CARDS[i], sel = menu.sel === i, bob = sel ? Math.sin(t * 4) * 3 : 0;
    ctx.save(); ctx.translate(c.x + c.w / 2, c.y + c.h / 2 + bob); const sc = sel ? 1.05 : 0.95; ctx.scale(sc, sc); ctx.translate(-c.w / 2, -c.h / 2);
    ctx.shadowColor = sel ? '#fff' : 'rgba(0,0,0,.3)'; ctx.shadowBlur = sel ? 30 : 10;
    ctx.fillStyle = i === 0 ? 'rgba(255,255,255,.78)' : 'rgba(20,10,60,.72)'; rr(ctx, 0, 0, c.w, c.h, 26); ctx.fill(); ctx.shadowBlur = 0;
    ctx.lineWidth = sel ? 6 : 3; ctx.strokeStyle = sel ? '#ffd34d' : (i === 0 ? '#8fd89a' : '#8a7aff'); ctx.stroke();
    DG.text(ctx, R.title, c.w / 2, 56, 30, i === 0 ? '#2f7a45' : '#cfd8ff', 'center');
    DG.text(ctx, R.tagline[0], c.w / 2, 90, 16, i === 0 ? '#4a6a50' : '#aeb8ff', 'center');
    DG.text(ctx, R.tagline[1], c.w / 2, 112, 16, i === 0 ? '#4a6a50' : '#aeb8ff', 'center');
    R.sampleTypes.forEach((s, k) => {
      const x = 28 + k * 70, y = 170 + Math.sin(t * 2.2 + k * 1.1) * 12, cell = Object.assign({ oy: 0, vy: 0, pop: 0, clr: 0 }, s);
      R.drawCell(ctx, cell, x, y, 64, 1, t);
    });
    DG.text(ctx, R.howto[0], c.w / 2, 280, 14, i === 0 ? '#3a5a40' : '#9aa6ee', 'center');
    DG.text(ctx, R.howto[1], c.w / 2, 302, 14, i === 0 ? '#3a5a40' : '#9aa6ee', 'center');
    ctx.restore();
    if (sel) DG.text(ctx, '▼', c.x + c.w / 2, c.y - 10 + Math.sin(t * 5) * 4, 24, '#ffd34d', 'center', { stroke: '#7a4a00', sw: 4 });
  });
  ['1P ' + MODE_NAMES[0], '2P ' + MODE_NAMES[1], '🤖 ' + MODE_NAMES[2], '👀 ' + MODE_NAMES[3]].forEach((lab, i) => {
    const b = MODES[i], on = menu.mode === i;
    ctx.fillStyle = on ? '#ffd34d' : 'rgba(255,255,255,.75)'; rr(ctx, b.x, b.y, b.w, b.h, 25); ctx.fill();
    ctx.lineWidth = 3; ctx.strokeStyle = on ? '#b57a00' : '#8a7aff'; ctx.stroke();
    DG.text(ctx, lab, b.x + b.w / 2, b.y + 33, 18, on ? '#5a3a00' : '#4a3a8a', 'center');
  });
  if (menu.mode >= 2) {
    const b = CPUBTN; ctx.fillStyle = 'rgba(255,255,255,.85)'; rr(ctx, b.x, b.y, b.w, b.h, 13); ctx.fill();
    DG.text(ctx, `CPU: ${DG.AI.LEVELS[menu.cpu].name} (C)`, b.x + b.w / 2, b.y + 18, 14, '#4a3a8a', 'center');
  }
  {                           // 選んでいるゲームの4段階モード(右側に表示。Q キーで切替)
    const R = RULES()[menu.sel], cur = menu.lv[menu.sel];
    DG.text(ctx, menu.sel === 1 ? '実体化モード (Q)' : '季節モード (Q)', QDBTNS[0].x - 8, 586, 13, '#fff', 'right', { stroke: '#3a2a7a', sw: 3 });
    R.levels.forEach((lv, i) => {
      const b = QDBTNS[i], on = cur === i;
      ctx.fillStyle = on ? '#9cf0ff' : 'rgba(255,255,255,.78)'; rr(ctx, b.x, b.y, b.w, b.h, 14); ctx.fill();
      ctx.lineWidth = on ? 3 : 2; ctx.strokeStyle = on ? '#2a7aa8' : '#8a7aff'; ctx.stroke();
      DG.text(ctx, lv.name, b.x + b.w / 2, b.y + 16, 14, on ? '#073a52' : '#4a3a8a', 'center');
      DG.text(ctx, menu.sel === 1 ? (lv.ahead ? lv.ahead + 'マス手前' : 'ランダム') : lv.season, b.x + b.w / 2, b.y + 32, 11, on ? '#0a5a7a' : '#6a5aaa', 'center');
    });
  }
  DG.text(ctx, '← → ゲーム  ↑ ↓ / 1-4 遊び方  Q モード  O 設定  Enter / タップで スタート  M ミュート  20秒放置でデモ', 480, 624, 13, '#fff', 'center', { stroke: '#3a2a7a', sw: 4 });
}

let last = performance.now();
let dangerT = 0;
function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000); last = now; S.t += dt;
  pollPads();
  if (S.scene === 'menu') {
    S.idle += dt;
    if (S.idle > 20 && S.t > 0) { menu.sel = Math.random() < .5 ? 0 : 1; menu.mode = 3; menu.cpu = 1; menu.lv = [Math.floor(Math.random() * 4), Math.floor(Math.random() * 4)]; startGame(); }   // 放置すると自動でデモ
    else drawMenu(S.t);
  } else if (S.scene === 'rank') {
    DG.Rank.drawRanking(ctx, S.t, 960, H);
  } else if (S.scene === 'settings') {
    drawSettings(S.t);
  } else {
    if (S.demo && S.scene === 'result') { S.demoT += dt; if (S.demoT > 4) { menu.sel = 1 - menu.sel; startGame(); } }     // デモは終わると次のゲームへ
    if (!S.paused) for (const p of S.players) { if (S.scene === 'play' || p.fx.length) { if (S.scene === 'play') p.update(dt); else { p.time += dt; if (p.pop) p.pop.t -= dt; for (const f of p.fx) { f.x += f.vx * dt; f.y += f.vy * dt; f.vy += 300 * dt; f.life -= dt; } p.fx = p.fx.filter(f => f.life > 0); } } }
    checkEnd();
    dangerT -= dt; if (dangerT <= 0) { dangerT = .5; const d = Math.min(...S.players.map(p => p.dangerRow())); Music.speed(S.scene === 'play' && d <= 3 ? 1.12 : 1); }
    S.rules.drawBG(ctx, S.t, cv.width, H);
    for (const p of S.players) p.draw(ctx, S.t);
    if (S.players.length === 2) { ctx.strokeStyle = 'rgba(255,255,255,.7)'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(PW, 0); ctx.lineTo(PW, H); ctx.stroke(); }
    if (S.paused) { ctx.fillStyle = 'rgba(0,0,0,.6)'; ctx.fillRect(0, 0, cv.width, H); DG.text(ctx, 'PAUSE', cv.width / 2, 300, 40, '#fff', 'center'); DG.text(ctx, 'P で さいかい', cv.width / 2, 340, 18, '#ffe36b', 'center'); }
    if (S.demo) DG.text(ctx, 'DEMO  ─  AI対AI    キー / タップでメニューへ', cv.width / 2, 17, 14, '#fff', 'center', { stroke: '#000', sw: 4 });
    else if (S.scene === 'result') { DG.text(ctx, 'Enter / タップ: もういちど    Esc: メニューへ', cv.width / 2, 17, 13, '#fff', 'center', { stroke: '#000', sw: 4 }); }
    else if (S.scene === 'play') DG.text(ctx, 'Esc: メニュー', cv.width - 10, 20, 11, 'rgba(255,255,255,.6)', 'right');
  }
  requestAnimationFrame(frame);
}
DG.engine = { S, menu, startGame, toMenu, Player, cv };
addEventListener('load', () => requestAnimationFrame(frame));
})();
