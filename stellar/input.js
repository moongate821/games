// ---------- STELLAR HEGEMONY ― 銀河覇権: 入力・配信基盤 ----------
// 「1980s GALAXY SHOOTER」(実装\v2_starfighter\sketch.js の readGamepad/readTouch/rumble/fitCanvas)から
// 入力・配信の「仕組み」だけを移植し、SLG向けのボタン意味づけに置き換えたもの。
// ゲームパッド: 左スティック=カーソル移動・マップパン, A=決定, B=取消, LB/RB=タブ切替, Y=陣形切替, Start=一時停止, Back/Select=ターン終了
// タッチ: 左下=仮想スティック(パン), 右下=決定/取消/ターン終了ボタン, 盤面タップは touchStarted 経由で lastTap に記録
// キーボード: 矢印=カーソル, Enter/Space=決定, Esc/Backspace=取消, Tab/Shift+Tab=タブ切替, F=陣形切替, Q=ターン終了, P=一時停止

const isTouchDev = ('ontouchstart' in window) || navigator.maxTouchPoints > 0;

const INPUT = {
  mx: 0, my: 0, confirm: false, cancel: false, tabL: false, tabR: false, formation: false,
  endTurn: false, pause: false,
  confirmEdge: false, cancelEdge: false, tabLEdge: false, tabREdge: false, formationEdge: false,
  endTurnEdge: false, pauseEdge: false,
  pointer: { x: 0, y: 0, down: false, tapped: false, tapX: 0, tapY: 0 },
};
let touchMode = isTouchDev || location.hash.includes('touch');
let stickId = null, stickOrg = null, stickPos = null;

function clearInputState() {
  for (const k of Object.keys(INPUT)) if (typeof INPUT[k] === 'boolean') INPUT[k] = false;
  INPUT.mx = 0; INPUT.my = 0;
  stickId = null; stickOrg = null; stickPos = null;
  gpPrevButtons = {};
}

// ---------- 振動(対応機器のみ・失敗しても無視) ----------
let rumbleLast = 0;
function rumble(strong, weak, ms) {
  const now = performance.now(); if (now - rumbleLast < 60) return; rumbleLast = now;
  try {
    const gp = (navigator.getGamepads ? Array.from(navigator.getGamepads()) : []).find(p => p && p.connected);
    if (gp && gp.vibrationActuator && gp.vibrationActuator.playEffect) gp.vibrationActuator.playEffect('dual-rumble', { duration: ms, strongMagnitude: strong, weakMagnitude: weak });
    else if (isTouchDev && navigator.vibrate) navigator.vibrate(Math.round(ms / 2));
  } catch (e) { /* 振動できなくても続行 */ }
}

// ---------- ゲームパッド(Gamepad API) ----------
let gpPrevButtons = {};
function readGamepad() {
  const r = { mx: 0, my: 0, confirm: false, cancel: false, tabL: false, tabR: false, formation: false, endTurn: false, pause: false };
  const gp = (navigator.getGamepads ? Array.from(navigator.getGamepads()) : []).find(p => p && p.connected);
  if (!gp) return r;
  const dz = v => Math.abs(v) < 0.2 ? 0 : v, B = i => !!(gp.buttons[i] && gp.buttons[i].pressed);
  const edge = (k, i) => { const now = B(i); const e = now && !gpPrevButtons[k]; gpPrevButtons[k] = now; return e; };
  r.mx = dz(gp.axes[0] || 0); r.my = dz(gp.axes[1] || 0);
  r.confirm = edge('confirm', 0);   // A
  r.cancel = edge('cancel', 1);     // B
  r.tabL = edge('tabL', 4);         // LB
  r.tabR = edge('tabR', 5);         // RB
  r.formation = edge('formation', 3); // Y
  r.endTurn = edge('endTurn', 8);   // Back/Select
  r.pause = edge('pause', 9);       // Start
  return r;
}

// ---------- タッチ(iPhone・Android): 左下に仮想スティック(パン)、右下にボタン ----------
const TBTN = {
  confirm: { x: 0, y: 0, r: 60, label: '決定' },
  cancel: { x: 0, y: 0, r: 48, label: '取消' },
  formation: { x: 0, y: 0, r: 44, label: '陣形' },
  endTurn: { x: 0, y: 0, r: 50, label: 'ターン終了' },
};
function layoutTouchUI(W, H) {
  TBTN.confirm.x = W - 90; TBTN.confirm.y = H - 100;
  TBTN.cancel.x = W - 210; TBTN.cancel.y = H - 70;
  TBTN.formation.x = W - 210; TBTN.formation.y = H - 190;
  TBTN.endTurn.x = W - 90; TBTN.endTurn.y = H - 220;
}
let touchHeldPrev = {};
function readTouch(W, H) {
  const r = { mx: 0, my: 0, confirm: false, cancel: false, formation: false, endTurn: false };
  if (!touchMode) return r;
  const held = {}; let seen = false;
  for (const t of touches) {
    if (t.id === stickId && stickOrg) {
      seen = true;
      const dx = t.x - stickOrg.x, dy = t.y - stickOrg.y, len = Math.hypot(dx, dy), a = Math.atan2(dy, dx), m = Math.min(1, len / 70);
      stickPos = { x: stickOrg.x + Math.cos(a) * Math.min(70, len), y: stickOrg.y + Math.sin(a) * Math.min(70, len) };
      r.mx = Math.cos(a) * m; r.my = Math.sin(a) * m; continue;
    }
    for (const k in TBTN) if (Math.hypot(t.x - TBTN[k].x, t.y - TBTN[k].y) < TBTN[k].r * 1.15) held[k] = true;
  }
  if (!seen) { stickId = null; stickPos = null; }
  r.confirm = !!held.confirm; r.cancel = !!held.cancel && !touchHeldPrev.cancel;
  r.formation = !!held.formation && !touchHeldPrev.formation; r.endTurn = !!held.endTurn && !touchHeldPrev.endTurn;
  touchHeldPrev = held;
  return r;
}
function inputTouchStarted(evt, W, H, onMapTap) {
  if (evt && evt.target && evt.target.closest && evt.target.closest('#app-ui, #toolbar')) return true;
  touchMode = true;
  let overUI = false;
  for (const t of touches) for (const k in TBTN) if (Math.hypot(t.x - TBTN[k].x, t.y - TBTN[k].y) < TBTN[k].r * 1.15) overUI = true;
  for (const t of touches) if (stickId === null && t.x < W * 0.42 && t.y > H * 0.35 && !overUI) { stickId = t.id; stickOrg = { x: t.x, y: t.y }; stickPos = { x: t.x, y: t.y }; }
  if (!overUI && touches.length) {
    const t = touches[touches.length - 1];
    if (t.x >= W * 0.42 || t.y <= H * 0.35) { INPUT.pointer.tapped = true; INPUT.pointer.tapX = t.x; INPUT.pointer.tapY = t.y; if (onMapTap) onMapTap(t.x, t.y); }
  }
  return false;
}

// ---------- キーボード(デスクトップ確認用) ----------
let kbPrev = {};
function readKeyboard() {
  const r = { mx: 0, my: 0, confirm: false, cancel: false, tabL: false, tabR: false, formation: false, endTurn: false, pause: false };
  const down = c => keyIsDown(c);
  r.mx = (down(39) || down(68) ? 1 : 0) - (down(37) || down(65) ? 1 : 0);
  r.my = (down(40) || down(83) ? 1 : 0) - (down(38) || down(87) ? 1 : 0);
  const edge = (k, held) => { const e = held && !kbPrev[k]; kbPrev[k] = held; return e; };
  r.confirm = edge('confirm', down(13) || down(32));           // Enter / Space
  r.cancel = edge('cancel', down(27) || down(8));              // Esc / Backspace
  r.tabL = edge('tabL', down(81));                             // Q
  r.tabR = edge('tabR', down(69));                             // E
  r.formation = edge('formation', down(70));                   // F
  r.endTurn = edge('endTurn', down(84));                        // T
  r.pause = edge('pause', down(80));                            // P
  return r;
}

// ---------- 統合: 毎フレーム呼び出す ----------
function pollInput(W, H) {
  const g = readGamepad(), t = readTouch(W, H), k = readKeyboard();
  const prevConfirm = INPUT.confirm, prevCancel = INPUT.cancel, prevTabL = INPUT.tabL, prevTabR = INPUT.tabR, prevFormation = INPUT.formation, prevEndTurn = INPUT.endTurn, prevPause = INPUT.pause;
  INPUT.mx = Math.max(-1, Math.min(1, g.mx + t.mx + k.mx));
  INPUT.my = Math.max(-1, Math.min(1, g.my + t.my + k.my));
  INPUT.confirm = g.confirm || t.confirm || k.confirm;
  INPUT.cancel = g.cancel || t.cancel || k.cancel;
  INPUT.tabL = g.tabL || k.tabL; INPUT.tabR = g.tabR || k.tabR;
  INPUT.formation = g.formation || t.formation || k.formation;
  INPUT.endTurn = g.endTurn || t.endTurn || k.endTurn;
  INPUT.pause = g.pause || k.pause;
  // ボタン系はエッジ検出(押した瞬間のみtrue)。ゲームパッド/キーボードは既にエッジ、タッチは今回値をそのままエッジとして扱う。
  INPUT.confirmEdge = INPUT.confirm && !prevConfirm;
  INPUT.cancelEdge = INPUT.cancel && !prevCancel;
  INPUT.tabLEdge = INPUT.tabL; INPUT.tabREdge = INPUT.tabR;
  INPUT.formationEdge = INPUT.formation; INPUT.endTurnEdge = INPUT.endTurn;
  INPUT.pauseEdge = INPUT.pause && !prevPause;
  INPUT.pointer.down = touchMode ? (stickId !== null) : mouseIsPressed;
  return INPUT;
}
function consumeTap() { INPUT.pointer.tapped = false; }

// ---------- 画面フィット(古い端末でもaspect-ratioに頼らない) ----------
function fitCanvas(W, H) {
  const c = document.querySelector('canvas'); if (!c) return;
  const area = document.getElementById('game-stage');
  const vw = area ? area.clientWidth : window.innerWidth, vh = area ? area.clientHeight : window.innerHeight, k = Math.min(vw / W, vh / H);
  c.style.width = Math.floor(W * k) + 'px'; c.style.height = Math.floor(H * k) + 'px';
}

function drawTouchUI(gfx) {
  const g = gfx || window;
  if (!touchMode) return;
  const o = stickOrg || { x: 120, y: g.height ? g.height - 120 : 500 }, p = stickPos || o;
  g.push();
  g.noFill(); g.stroke(90, 210, 255, 130); g.strokeWeight(2); g.ellipse(o.x, o.y, 140); g.ellipse(o.x, o.y, 50);
  g.stroke(90, 210, 255, stickPos ? 230 : 120); g.strokeWeight(3); g.ellipse(p.x, p.y, 56);
  for (const key in TBTN) {
    const b = TBTN[key], on = touchHeldPrev[key];
    g.noFill(); g.stroke(90, 210, 255, on ? 255 : 140); g.strokeWeight(on ? 3.5 : 2); g.ellipse(b.x, b.y, b.r * 2);
    g.noStroke(); g.fill(255, on ? 240 : 160); g.textAlign(g.CENTER, g.CENTER); g.textSize(13); g.text(b.label, b.x, b.y);
  }
  g.pop();
}

if (typeof module !== 'undefined') module.exports = { INPUT, pollInput, rumble, fitCanvas, layoutTouchUI, drawTouchUI, inputTouchStarted, clearInputState, consumeTap };
