// SUPER RING 超人プロレス ― 縦に一本の試作(2026-10-07)
// 1対1。リング(斜め視点)→ 立ち(打撃・組み付き)→ 組み(技を選ぶ)→ ダウン → 3カウント。必殺技はゲージで解放。
// 技データは moves.json(技データ\build_moves.py から)。数値は仮。画像は assets\(素材制作\crop_wrestlers.py)。
// テスト入口: #vs=1,5(2人を指定して即試合) #auto(2人ともCPU) #sim=秒,1,5(描画なしで高速に回して結果を document.title に) #shot=名前,秒
'use strict';
const W = 960, H = 540;
const cv = document.getElementById('c'), ctx = cv.getContext('2d');
ctx.imageSmoothingEnabled = false;
const HASH = location.hash.slice(1);
const hp = (k) => { const m = new RegExp('(?:^|[,&])' + k + '=([^,&]*)').exec(HASH); return m ? m[1] : null; };

// ---------- 乱数(試験で再現できるよう種つき) ----------
let _s = (+hp('seed') || 12345) >>> 0;
const rnd = () => { _s = (Math.imul(_s, 1664525) + 1013904223) >>> 0; return _s / 4294967296; };
const rr = (a, b) => a + rnd() * (b - a), pick = (a) => a[Math.floor(rnd() * a.length)], clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const lerp = (a, b, t) => a + (b - a) * t, ease = (t) => t * t * (3 - 2 * t);

// ---------- 入力 ----------
const keys = {}, pressed = {};
addEventListener('keydown', (e) => { if (!keys[e.code]) pressed[e.code] = true; keys[e.code] = true; if (/^(Arrow|Space|Key[ZXCV])/.test(e.code)) e.preventDefault(); Snd.resume(); });
addEventListener('keyup', (e) => { keys[e.code] = false; });
if ('ontouchstart' in window || navigator.maxTouchPoints > 0) {
  document.getElementById('wrap').classList.add('touch');
  document.querySelectorAll('.b').forEach((b) => {
    const ks = b.dataset.k.split(','), on = (e) => { e.preventDefault(); for (const k of ks) { if (!keys[k]) pressed[k] = true; keys[k] = true; } b.classList.add('on'); Snd.resume(); }, off = (e) => { e.preventDefault(); for (const k of ks) keys[k] = false; b.classList.remove('on'); };
    b.addEventListener('touchstart', on, { passive: false }); b.addEventListener('touchend', off, { passive: false }); b.addEventListener('touchcancel', off, { passive: false });
  });
  cv.addEventListener('touchstart', (e) => { e.preventDefault(); const r = cv.getBoundingClientRect(), t = e.changedTouches[0]; handleTap((t.clientX - r.left) / r.width * W, (t.clientY - r.top) / r.height * H); Snd.resume(); }, { passive: false });
}
cv.addEventListener('mousedown', (e) => { const r = cv.getBoundingClientRect(); handleTap((e.clientX - r.left) / r.width * W, (e.clientY - r.top) / r.height * H); Snd.resume(); });
const wasPressed = (...c) => c.some((k) => pressed[k]);

// ---------- 音(合成。画像・音声ファイル無し) ----------
const Snd = {
  ac: null, resume() { try { if (!this.ac) this.ac = new (window.AudioContext || window.webkitAudioContext)(); if (this.ac.state === 'suspended') this.ac.resume(); } catch (e) {} },
  tone(f0, f1, dur, type, vol) { const a = this.ac; if (!a || SIM) return; const o = a.createOscillator(), g = a.createGain(); o.type = type || 'square'; o.frequency.setValueAtTime(f0, a.currentTime); o.frequency.exponentialRampToValueAtTime(Math.max(20, f1), a.currentTime + dur); g.gain.setValueAtTime(vol || 0.12, a.currentTime); g.gain.exponentialRampToValueAtTime(0.0008, a.currentTime + dur); o.connect(g).connect(a.destination); o.start(); o.stop(a.currentTime + dur + 0.02); },
  noise(dur, vol, hi) { const a = this.ac; if (!a || SIM) return; const n = Math.floor(a.sampleRate * dur), b = a.createBuffer(1, n, a.sampleRate), d = b.getChannelData(0); for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / n); const s = a.createBufferSource(); s.buffer = b; const f = a.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = hi || 2500; const g = a.createGain(); g.gain.value = vol || 0.3; s.connect(f).connect(g).connect(a.destination); s.start(); },
  hit(p) { this.noise(0.12, 0.35 + p * 0.05, 3000); this.tone(180, 60, 0.12, 'square', 0.1); },
  slam() { this.noise(0.35, 0.6, 900); this.tone(90, 30, 0.3, 'sine', 0.35); },
  whiff() { this.noise(0.1, 0.1, 5000); },
  count() { this.tone(520, 480, 0.18, 'square', 0.12); },
  bell() { this.tone(1320, 1300, 0.9, 'sine', 0.14); this.tone(1980, 1960, 0.7, 'sine', 0.06); },
  special() { this.tone(300, 1200, 0.5, 'sawtooth', 0.12); },
  menu() { this.tone(700, 800, 0.05, 'square', 0.06); },
  cheer() { this.noise(0.8, 0.12, 1800); },
  boom() { this.noise(0.6, 0.7, 500); this.tone(70, 25, 0.5, 'sine', 0.45); this.tone(900, 120, 0.25, 'sawtooth', 0.1); },
  zap() { this.tone(2400, 300, 0.25, 'sawtooth', 0.1); this.noise(0.15, 0.2, 6000); },
};

// ---------- 画像・データ ----------
const IMG = { body: {}, face: {}, action: {}, down: {} }, PROP = window.PROP = {};
let DATA = null, SIM = false;
function loadAll() {
  const jobs = [fetch('moves.json').then((r) => r.json()).then((d) => { DATA = d; })];
  for (let i = 1; i <= 20; i++) for (const k of ['body', 'face']) jobs.push(new Promise((res) => { const im = new Image(); im.onload = () => { IMG[k][i] = im; res(); }; im.onerror = res; im.src = `assets/${k}_${String(i).padStart(2, '0')}.png`; }));
  jobs.push(PUP.loadAll());
  jobs.push(fetch('assets/action/manifest.json').then((r) => r.json()).then((numbers) => Promise.all(numbers.map((id) => new Promise((res) => { const im = new Image(); im.onload = () => { IMG.action[+id] = im; res(); }; im.onerror = res; im.src = 'assets/action/' + id + '.png'; })))).catch(() => {}));
  jobs.push(fetch('assets/down/manifest.json').then((r) => r.json()).then((numbers) => Promise.all(numbers.map((id) => new Promise((res) => { const im = new Image(); im.onload = () => { IMG.down[+id] = im; res(); }; im.onerror = res; im.src = 'assets/down/' + id + '.png'; })))).catch(() => {}));
  jobs.push(fetch('assets/props/props.json').then((r) => r.json()).then((d) => Promise.all(Object.keys(d).map((k) => new Promise((res) => { const im = new Image(); im.onload = () => { PROP[k] = im; res(); }; im.onerror = res; im.src = 'assets/props/' + k + '.png'; })))).catch(() => {}));
  return Promise.all(jobs);
}

// ---------- レスラー ----------
const MAXPOWER = 24, GAUGE_MAX = 3;
const GROUND = 408;                       // 足元のy(奥行き中央)
function sx(x) { return W / 2 + x * 322; }
class Fighter {
  constructor(no, side, human) {
    const w = DATA.wrestlers[String(no)], ms = {}; DATA.master.forEach((m) => { ms[m.id] = m; });
    this.no = no; this.side = side; this.human = human; this.name = w.name; this.type = w.type; this.st = w.stats;
    const mv = w.moves.map((i) => ms[i]).filter(Boolean), sp = w.specials.map((i) => ms[i]).filter(Boolean);
    const by = (f) => mv.filter(f);
    this.light = by((m) => m.kind === '打' && m.rank <= 2 && m.sit === '立ち'); this.heavy = by((m) => m.kind === '打' && m.rank >= 3 && m.sit === '立ち');
    this.lock = by((m) => m.sit === '組み'); this.ground = by((m) => m.kind === '地'); this.dive = by((m) => m.kind === '飛'); this.rope = by((m) => m.kind === 'ロ'); this.corner = by((m) => m.kind === '角');
    this.specials = sp;
    if (!this.light.length) this.light = [ms.G001]; if (!this.heavy.length) this.heavy = [ms.G006];
    this.maxLife = 120 + this.st['耐'] * 9; this.life = this.maxLife; this.power = MAXPOWER; this.gauge = 0;
    this.x = side < 0 ? -0.45 : 0.45; this.face = -side; this.mode = 'free'; this.t = 0; this.stun = 0; this.cool = 0; this.downT = 0; this.mash = 0;
    this.vis = { ox: 0, lift: 0, rot: 0, lie: 0, sx: 1, sy: 1, flash: 0 }; this.lieN = 0;
    this.ai = { t: rr(0.3, 0.8), mx: 0, act: null };
    this.mvName = '';
  }
  get ratio() { return this.life / this.maxLife; }
}

// ---------- 試合 ----------
let M = null;          // 現在の試合
const FX = [];         // 演出(火花・文字)
let shake = 0, flashT = 0, banner = null, hitStop = 0, slowT = 0, zoom = 0, zoomC = [W / 2, 300], flashRGB = '255,255,255', crowdT = 0, comboT = 0;
function newMatch(a, b, auto) {
  const p1 = new Fighter(a, -1, !auto), p2 = new Fighter(b, +1, false);
  M = { ref: { no: 21, x: 0, face: 1, scl: 0.93, vis: { ox: 0, lift: 0, rot: 0, lie: 0, sx: 1, sy: 1, flash: 0 }, lieN: 0, mode: 'ref' }, chairs: [{ side: -1, avail: true }, { side: 1, avail: true }], gongT: 1.2, p: [p1, p2], act: null, lock: null, pin: null, time: 0, limit: 240, over: null, msg: null, msgT: 0, log: [], counts: { moves: 0, downs: 0, pins: 0, specials: 0 }, started: 0, bellT: 1.4 };
  FX.length = 0; banner = null; state = 'match'; Snd.bell(); say('FIGHT!', 1.2);
}
function say(t, d) { M.msg = t; M.msgT = d || 1.4; }
const opp = (f) => (M.p[0] === f ? M.p[1] : M.p[0]);
const dist = () => Math.abs(M.p[0].x - M.p[1].x);

// ----- 力関係から出す数値 -----
function dmgOf(a, d, mv, mult) {
  const lowPow = a.power < mv.cost ? 0.55 : 1;
  const x = mv.dmg * (0.72 + 0.05 * a.st['力']) * (1.34 - 0.065 * d.st['耐']) * lowPow * (mult || 1) * rr(0.9, 1.1);
  return x;
}
function gainGauge(a, d, dmg, special) { if (special) return; a.gauge = clamp(a.gauge + dmg * 0.012, 0, GAUGE_MAX); d.gauge = clamp(d.gauge + dmg * 0.02, 0, GAUGE_MAX); }
function applyHit(a, d, mv, big, mult, noFx) {
  const dm = dmgOf(a, d, mv, mult); d.life = Math.max(0, d.life - dm); a.power = Math.max(0, a.power - mv.cost * 0.6);
  gainGauge(a, d, dm, mv.id && mv.id[0] === 'S'); d.vis.flash = 0.18; M.counts.moves++;
  const sp = mv.id && mv.id[0] === 'S', tier = sp ? 3 : (big || mv.rank >= 4) ? 2 : mv.rank >= 3 ? 1 : 0;
  if (!noFx) fxHit(a, d, mv, tier, dm);
  if (tier >= 3) Snd.boom(); else if (big) Snd.slam(); else Snd.hit(mv.rank);
  if (d.life <= 0) endMatch(a, 'KO');
  return dm;
}
function endMatch(w, how) { if (M.over) return; M.gongT = 1.4; M.over = { winner: w, how, t: 0 }; say(how === 'PIN' ? '3カウント!' : how === 'KO' ? 'K.O.!' : '判定', 3); Snd.bell(); Snd.cheer(); }
const TXT = { '打': ['POW!', 'BAM!', 'WHAP!', 'BASH!'], '投': ['DOGOON!', 'CRASH!', 'KABOOM!', 'SLAM!'], '関': ['GRIND!', 'CRUSH!'], '地': ['THUD!', 'STOMP!'], '飛': ['IMPACT!', 'BOOM!'], 'ロ': ['WHAM!', 'RAM!'], '奥': ['DOOM!!', 'K.O.!!'], '角': ['BANG!', 'SMASH!'] };
function fxHit(a, d, mv, tier, dm) {
  const kind = mv.kind, x = (sx(a.x) + sx(d.x)) / 2, y = GROUND - 112, k = [0.9, 1.3, 1.9, 2.8][tier], floorX = sx(d.x);
  FX.push({ type: 'star', x, y, t: 0, dur: 0.3 + 0.1 * tier, k, tier });
  FX.push({ type: 'lines', x, y, t: 0, dur: 0.28 + 0.1 * tier, k, n: 12 + tier * 8, tier });
  if (tier >= 1 || rnd() < 0.5) FX.push({ type: 'txt', x: x + rr(-60, 60), y: y - 50 - rnd() * 40, t: 0, dur: 0.75 + 0.15 * tier, s: pick(TXT[kind] || TXT['打']), k: 0.8 + tier * 0.35, tier });
  const n = 6 + tier * 12; for (let i = 0; i < n; i++) FX.push({ type: 'dot', x, y, vx: rr(-340, 340) * (1 + tier * 0.4), vy: rr(-460, 60), t: 0, dur: 0.45 + 0.1 * tier, tier });
  if (kind === '投' || kind === '奥' || kind === '地' || kind === '飛' || tier >= 2) {
    FX.push({ type: 'ring', x: floorX, y: GROUND + 4, t: 0, dur: 0.45 + 0.1 * tier, k, tier });
    if (tier >= 2) FX.push({ type: 'ring', x: floorX, y: GROUND + 4, t: -0.08, dur: 0.55, k: k * 1.4, tier });
    for (let i = 0; i < 5 + tier * 4; i++) FX.push({ type: 'dust', x: floorX + rr(-40, 40), y: GROUND + rr(-4, 10), vx: rr(-120, 120) * (1 + tier * 0.3), vy: rr(-90, -20), t: 0, dur: rr(0.5, 0.9), r: rr(14, 26) * (1 + tier * 0.35) });
    if (tier >= 1) FX.push({ type: 'crack', x: floorX, y: GROUND + 6, t: 0, dur: 1.4, k, seed: Math.floor(rnd() * 9999) });
  }
  if (tier >= 2) { FX.push({ type: 'wave', x, y, t: 0, dur: 0.5, k, tier }); crowdT = 1.2 + tier * 0.4; Snd.cheer(); }
  shake = Math.max(shake, [4, 9, 16, 28][tier]); hitStop = [0.035, 0.07, 0.14, 0.3][tier]; zoom = Math.max(zoom, [0.008, 0.02, 0.05, 0.1][tier]); zoomC = [x, y + 40];
  if (tier >= 2) { flashT = Math.max(flashT, tier >= 3 ? 0.55 : 0.2); flashRGB = tier >= 3 ? '255,220,255' : '255,255,255'; }
  if (tier >= 3) slowT = 0.85;
  if (tier >= 2) { comboT = 1.3; M.praise = { s: tier >= 3 ? 'FINISH!!' : (dm > 20 ? 'EXCELLENT!' : 'GREAT!'), t: 0, dur: 1.3, tier }; }
}
function burst(x, y, k, big) { const w = ['CRASH!', 'BOOM!', 'WHAM!', 'SMASH!', 'BAM!'][Math.floor(rnd() * 5)]; FX.push({ type: 'star', x, y, t: 0, dur: 0.35, k }); if (big || rnd() < 0.5) FX.push({ type: 'txt', x: x + rr(-50, 50), y: y - 40 - rnd() * 40, t: 0, dur: 0.7, s: w, k }); for (let i = 0; i < 8 * k; i++) FX.push({ type: 'dot', x, y, vx: rr(-300, 300), vy: rr(-380, 80), t: 0, dur: 0.45 }); }

// ---------- 行動(技の演出) ----------
// act = { a, d, mv, kind, t, dur, hit:false, ... }
function styleOf(mv) {
  const n = mv.name; if (mv.id === 'CHAIR') return 'chop';
  if (/ラリアット|ボンバー|ミキサー|突撃/.test(n)) return 'lariat'; if (/チョップ|手刀|水平|赤い雨/.test(n)) return 'chop'; if (/ヘッドバット|頭突き/.test(n)) return 'headbutt';
  if (/ロー/.test(n)) return 'lowKick'; if (/キック|蹴|ブーツ|ニー|膝/.test(n)) return 'kick'; if (/エルボー|肘/.test(n)) return 'elbow';
  return 'punch';
}
function motionKindOf(mv) {
  if (mv.kind === '合') return /ネジ|回し/.test(mv.name) ? '投' : '打';
  if (mv.kind !== '奥') return mv.kind;
  const n = mv.name + ' ' + (mv.desc || '');
  if (/マッスル・スパーク/.test(mv.name)) return '投';
  if (/プレス|山崩れ/.test(n)) return '飛';
  if (/連撃|連続|ラッシュ|ストーム|ボンバー|クラッシュ|海嘯|シンフォニー/.test(n)) return '打';
  if (/ロック|締め上げ|四肢と首を完全に固め/.test(n)) return '関';
  return '投';
}
// 参考動画のように、組む→体重を預ける→投げる→着地を技ごとに見せる。
function throwStyle(mv) {
  const n = mv.name + ' ' + (mv.desc || '');
  if (/スパーク/.test(mv.name)) return 'spark';
  if (/ブレーンバスター|フィッシャーマンバスター|スープレックス|バックドロップ/.test(mv.name)) return 'suplex';
  if (/バスター/.test(mv.name)) return 'buster';
  if (/竜巻|ネジ回し|手裏剣|回転しながら/.test(n)) return 'twister';
  if (/パイルドライバー|ツームストーン|ドライバー|断頭台|判決|ペナルティ|逆さに担ぎ上げ/.test(n)) return 'piledriver';
  if (/DDT|フェイスバスター/.test(n)) return 'ddt';
  if (/スープレックス|バックドロップ|ブレーンバスター|サンセット|逆転|順逆|チェンジ/.test(n)) return 'suplex';
  return 'slam';
}
function startAct(a, d, mv, kind, extra) {
  const act = Object.assign({ a, d, mv, kind, t: 0, hit: false, x0: a.x, dx0: d.x, ticks: 0 }, extra || {});
  const k = act.motionKind = motionKindOf(mv), sp = mv.id && mv.id[0] === 'S';
  act.dur = kind === 'whiff' ? 0.4 : k === '打' ? (sp ? 1.12 : 0.55) : k === '投' ? (sp ? 2.0 : 1.5) : k === '関' ? (sp ? 1.85 : 1.35) : k === '飛' ? (sp ? 1.48 : 1.15) : k === '地' ? 0.8 : k === 'ロ' ? 1.5 : k === '角' ? 1.6 : 1;
  act.style = styleOf(mv); act.throwStyle = k === '投' ? throwStyle(mv) : null;
  act.rush = sp && k === '打' && /連撃|連続|ラッシュ|ストーム|雨|分身|全奥義|処刑|海嘯/.test(mv.name + ' ' + (mv.desc || ''));
  act.intro = sp ? 1.3 : 0; act.dur += act.intro;
  a.mode = 'act'; d.mode = kind === 'strike' || kind === 'whiff' ? d.mode : 'hold';
  if (sp) { a.gauge -= mv.gauge; M.counts.specials++; Snd.special(); flashT = 0.5; banner = { s: mv.name, t: 0, dur: act.dur, special: true, who: a }; }
  else if (kind !== 'whiff' && mv.rank >= 3) banner = { s: mv.name, t: 0, dur: Math.min(1.6, act.dur), who: a };
  a.power = Math.max(0, a.power - (sp ? 0 : mv.cost));
  M.act = act; a.mvName = mv.name; return act;
}
function lieTo(f, v, dt) { f.lieN = clamp(f.lieN + (v ? 1 : -1) * dt * 6, 0, 1); }

function stepAct(dt) {
  const A = M.act; if (!A) return;
  const a = A.a, d = A.d, mv = A.mv, dir = a.x < d.x ? 1 : -1, sp = mv.id && mv.id[0] === 'S';
  A.t += dt; let t = A.t - A.intro; const u = clamp(t / (A.dur - A.intro), 0, 1);
  if (t < 0) { a.vis.sy = 1 + 0.04 * Math.sin(A.t * 30); a.vis.flash = 0.12 * ((A.t * 12) % 1 > 0.5 ? 1 : 0); if (rnd() < 0.5) FX.push({ type: 'dot', x: sx(a.x) + rr(-50, 50), y: GROUND - rr(0, 200), vx: rr(-40, 40), vy: rr(-300, -120), t: 0, dur: 0.6, tier: 3 }); return; }   // 必殺技の溜め
  const big = sp || mv.rank >= 4, k = A.motionKind;
  const fast = (A.kind === 'strike' && u < 0.4) || k === '飛' || k === 'ロ' || A.kind === 'rope'; if (fast) { a.trail = a.trail || []; a.trail.push({ x: a.x, lift: a.vis.lift, rot: a.vis.rot, ox: a.vis.ox }); if (a.trail.length > 7) a.trail.shift(); } else if (a.trail && a.trail.length) a.trail.shift();
  if (A.kind === 'whiff') { a.x += dir * 0.35 * dt; if (u > 0.5 && !A.hit) { A.hit = true; Snd.whiff(); } }
  else if (k === '打' && A.kind !== 'rope') {
    const gap = Math.abs(d.x - a.x);
    const impactAt = sp ? (A.rush ? 0.39 : 0.67) : 0.35;
    if (u < impactAt) { a.x += dir * Math.max(0, Math.min(gap - 0.1, 0.5)) * dt * (sp ? 4.5 : 3.2); a.vis.ox = dir * (sp ? 18 : 12) * ease(u / impactAt); }
    if (A.rush) {
      const beats = [0.39, 0.59, 0.79];
      while (A.ticks < beats.length && u >= beats[A.ticks]) {
        const last = A.ticks === beats.length - 1; A.ticks++;
        a.vis.ox = dir * (last ? 26 : 14); d.vis.ox = dir * (last ? 35 : 12); d.vis.rot = dir * (last ? 0.38 : 0.13);
        if (Math.abs(d.x - a.x) <= 0.34 && d.mode !== 'down') {
          applyHit(a, d, mv, last, last ? 0.4 : 0.3, !last);
          if (last && d.life > 0) { d.mode = 'down'; d.downT = rr(1.8, 2.7); M.counts.downs++; }
        } else if (last) Snd.whiff();
        if (last) { A.hit = true; A.react = 0.7; }
      }
    } else if (u >= impactAt && !A.hit) {
      A.hit = true;
      // 当たりの瞬間に距離を見直す(相手が下がった・倒れたなら空振り=本物の当たり判定)
      const reach = Math.abs(d.x - a.x) <= 0.31 && d.mode !== 'down';
      if (A.dodge || !reach) { Snd.whiff(); if (A.dodge) say('かわした!', 0.7); else A.missed = true; }
      else {
        applyHit(a, d, mv, big, A.mult);
        const tier = sp ? 3 : big ? 2 : mv.rank >= 3 ? 1 : 0;   // 軽・中・大・必殺で、のけぞりの大きさと硬直を変える
        d.x = clamp(d.x + dir * [0.04, 0.08, 0.15, 0.25][tier], -0.95, 0.95);
        d.vis.ox = dir * [10, 18, 30, 44][tier]; d.vis.rot = dir * [0.08, 0.16, 0.28, 0.42][tier]; A.react = [0.2, 0.34, 0.55, 0.8][tier];
        if ((A.knock || sp) && d.life > 0) { d.mode = 'down'; d.downT = rr(1.6, 2.6); M.counts.downs++; }
      }
    }
    if (u > impactAt) { a.vis.ox = lerp(a.vis.ox, 0, 0.2); if (A.hit && d.mode === 'free') { d.vis.ox = lerp(d.vis.ox, 0, 0.08); d.vis.rot = lerp(d.vis.rot, 0, 0.08); } }
    if (A.missed && u > 0.6) A.t = Math.max(A.t, A.dur);   // 空振りは余計な間を残さず、あとの隙で表す
  } else if (k === '投' || k === '奥') {
    // 投げは相手との接点を保ち、技の種類ごとに異なる軌道と受け身を描く。
    const ts = A.throwStyle, bend = ease(clamp(u / 0.23, 0, 1));
    a.x = lerp(a.x, A.dx0 - dir * 0.15, 0.22);
    a.vis.sy = 1 - 0.09 * bend * (1 - ease(clamp((u - 0.3) / 0.2, 0, 1)));
    if (A.ukeAI === undefined) A.ukeAI = rnd() < 0.12 + 0.05 * d.st['耐'];
    if (u > 0.5 && u < 0.9 && !A.uke && d.life > 0 && (d.human ? wasPressed('KeyZ', 'KeyX', 'KeyC') : A.ukeAI && u > 0.7)) { A.uke = true; say('受け身!', 0.8); Snd.menu(); FX.push({ type: 'ring', x: sx(d.x), y: GROUND + 4, t: 0, dur: 0.4, k: 1, tier: 0 }); }
    const lift = ease(clamp((u - 0.2) / 0.31, 0, 1));
    const fall = ease(clamp((u - 0.62) / 0.24, 0, 1));
    const landing = ts === 'suplex' ? -0.24 : ts === 'slam' ? 0.44 : ts === 'ddt' ? 0.19 : 0.17;
    d.x = a.x + dir * lerp(0.15, landing, fall);
    if (ts === 'spark') {
      a.vis.lift = 64 * lift * (1 - fall);
      d.vis.lift = 126 * lift * (1 - fall);
      d.vis.rot = -dir * (0.7 * lift + 0.9 * fall);
      a.vis.rot = dir * 0.28 * lift * (1 - fall);
      d.x = a.x + dir * lerp(0.13, 0.06, lift);
    } else if (ts === 'buster') {
      d.vis.lift = 86 * lift * (1 - fall);
      d.vis.rot = -dir * (1.5 * lift + 0.45 * fall);
      a.vis.sy = 1 - 0.13 * fall;
    } else if (ts === 'twister') {
      d.vis.lift = (68 * lift + 16 * Math.sin(u * 18)) * (1 - fall);
      d.vis.rot = -dir * 6.1 * ease(clamp((u - 0.3) / 0.56, 0, 1));
      a.vis.rot = dir * 0.18 * Math.sin(u * 16);
    } else if (ts === 'suplex') {
      d.vis.lift = (72 * lift + 27 * Math.sin(Math.PI * clamp((u - 0.42) / 0.44, 0, 1))) * (1 - fall);
      d.vis.rot = -dir * (0.85 * lift + 1.65 * fall);
      a.vis.rot = -dir * 0.76 * fall; a.vis.lie = 0.82 * fall;
    } else if (ts === 'ddt') {
      d.vis.lift = 43 * lift * (1 - fall); d.vis.rot = dir * (0.38 * lift + 1.12 * fall);
      a.vis.rot = dir * 0.42 * fall; a.vis.lie = 0.72 * fall;
    } else if (ts === 'piledriver') {
      d.vis.lift = 83 * lift * (1 - fall); d.vis.rot = -dir * Math.PI * lift;
      a.vis.sy = 1 - 0.2 * fall; a.vis.lift = -9 * fall;
    } else {
      // 参考動画のボディスラム: 水平に抱える間を置き、腕を伸ばして前方へ放る。
      d.vis.lift = 74 * lift * (1 - fall);
      d.vis.rot = -dir * (1.48 * lift + 1.15 * fall);
      a.vis.rot = dir * 0.25 * fall;
    }
    if (u >= 0.86 && !A.hit) {
      A.hit = true; A.hitT = A.t;
      applyHit(a, d, mv, !A.uke, A.uke ? 0.6 : 1);
      if (d.life > 0) { d.mode = 'down'; d.downT = rr(2.0, 3.2) * (A.uke ? 0.55 : 1); M.counts.downs++; }
      d.vis.lift = 0; d.vis.rot = 0; d.lieN = 1;
    }
    if (A.hit) { d.vis.lift = 0; d.vis.rot = 0; }
  } else if (k === '関') {
    d.x = lerp(d.x, a.x + dir * 0.12, 0.2); d.vis.rot = -dir * (sp ? 0.6 : 0.35); d.vis.ox = Math.sin(A.t * 40) * 5; a.vis.ox = Math.sin(A.t * 40) * 2;
    if (sp && /タワーブリッジ|背骨/.test(mv.name + (mv.desc || ''))) d.vis.lift = 42 * ease(clamp(u / 0.32, 0, 1));
    const n = Math.floor(u * 3.2); while (A.ticks < n && A.ticks < 3) { A.ticks++; applyHit(a, d, mv, false, 0.34, false); if (A.ticks === 3) { A.hit = true; FX.push({ type: 'ring', x: sx(d.x), y: GROUND - 90, t: 0, dur: 0.4, k: 1.2, tier: 1, air: true }); } }
    if (d.life <= 0) { A.t = A.dur; }
  } else if (k === '飛') {
    // 飛びつき(倒れた相手へ。立っている相手へは、ぶつかる)
    const tx = d.x - dir * 0.14; const v = clamp(u / 0.62, 0, 1);
    a.x = lerp(A.x0, tx, ease(v)); a.vis.lift = Math.sin(v * Math.PI) * (sp ? 190 : 150); a.vis.rot = dir * 0.9 * Math.sin(v * Math.PI) + (/宙|ローリング|スター|バウンス/.test(mv.name) ? v * 6.28 * dir : 0);
    if (u >= 0.62 && !A.hit) { A.hit = true; a.vis.lift = 0; a.vis.rot = 0; applyHit(a, d, mv, true, A.mult); if (d.life > 0 && d.mode !== 'down') { d.mode = 'down'; d.downT = rr(1.8, 2.8); M.counts.downs++; } }
  } else if (k === '地') {
    a.x = lerp(a.x, d.x - dir * 0.2, 0.15); const v = clamp(u / 0.45, 0, 1); a.vis.lift = Math.sin(clamp(u / 0.5, 0, 1) * Math.PI) * 55; a.vis.rot = dir * 0.2 * Math.sin(v * Math.PI);
    if (u >= 0.45 && !A.hit) { A.hit = true; a.vis.lift = 0; applyHit(a, d, mv, false, 1); d.downT = Math.max(d.downT, 1.2); }
  } else if (k === 'ロ' || A.kind === 'rope') {
    // ロープへ走り、反動で戻って体当たり
    const edge = a.x < 0 ? -0.93 : 0.93, tgt = d.x;
    if (u < 0.35) a.x = lerp(A.x0, edge, ease(u / 0.35)); else { const v = clamp((u - 0.35) / 0.35, 0, 1); a.x = lerp(edge, tgt - (edge < 0 ? 0.12 : -0.12), ease(v)); a.vis.rot = (edge < 0 ? 1 : -1) * 0.5 * Math.sin(v * Math.PI); if (v >= 1 && !A.hit) { A.hit = true; applyHit(a, d, mv, mv.rank >= 3, 1); if (d.life > 0) { d.mode = 'down'; d.downT = rr(1.6, 2.6); M.counts.downs++; } } }
  } else {   // 角ほか: ひとまず体当たり扱い
    a.x = lerp(a.x, d.x - dir * 0.14, 0.12); if (u > 0.5 && !A.hit) { A.hit = true; applyHit(a, d, mv, true, 1); if (d.life > 0) { d.mode = 'down'; d.downT = 2; M.counts.downs++; } }
  }
  if (A.t >= A.dur) {
    a.vis = { ox: 0, lift: 0, rot: 0, lie: 0, sx: 1, sy: 1, flash: 0 }; if (d.mode !== 'down') d.vis = { ox: 0, lift: 0, rot: 0, lie: 0, sx: 1, sy: 1, flash: 0 };
    a.trail = []; a.mode = 'free'; a.cool = A.kind === 'whiff' ? 0.5 : 0.25; if (d.mode === 'hold') { d.mode = 'free'; d.stun = A.motionKind === '関' ? 0.6 : 0.3; }
    if (d.mode === 'free' && A.kind === 'strike' && A.hit) d.stun = A.react || 0.25;
    if (A.missed) a.cool = 0.75;   // 空振りの隙
    if (d.mode === 'down') d.vis.rot = 0;
    M.act = null; M.lock = null;
  }
}

// ---------- 組み付き(技選び) ----------
function startLock(a, d) { a.mode = 'lock'; d.mode = 'hold'; M.lock = { a, d, t: 0, sel: 0, items: lockItems(a), limit: 3.4, sp: { a: 0, d: 0, T: a.human || d.human ? 1.0 : 0.5, t: 0 } }; a.x = clamp(a.x, -0.9, 0.9); }
function lockItems(a) {
  const it = [], seen = new Set();
  for (const s of a.specials) if (a.gauge >= s.gauge - 0.001) it.push(s);
  const base = a.lock.slice().sort((x, y) => y.rank - x.rank);
  const ok = base.filter((m) => a.power >= m.cost);
  const lows = ok.filter((m) => m.rank <= 2), mids = ok.filter((m) => m.rank === 3), highs = ok.filter((m) => m.rank >= 4);
  const take = (arr, n) => { const c = arr.slice(); while (n > 0 && c.length) { const m = c.splice(Math.floor(rnd() * c.length), 1)[0]; if (!seen.has(m.id)) { seen.add(m.id); it.push(m); n--; } } };
  take(highs, 2); take(mids, 2); take(lows, 2);
  if (it.length < 3) take(base, 3);
  return it.slice(0, 6);
}
function lockMoveName(m) { return (m.id[0] === 'S' ? '★' : '') + m.name; }
function stepStruggle(L, dt) {   // 組んだ瞬間の力比べ: 連打で押し勝つ。勝てば技が1.15倍、端なら ロープに押し込む。負ければふりほどかれる
  const S = L.sp, a = L.a, d = L.d; S.T -= dt; S.t += dt;
  for (const [f, k] of [[a, 'a'], [d, 'd']]) {
    if (f.human) { if (wasPressed('KeyZ', 'KeyX', 'KeyC', 'Enter', 'Space')) S[k] += 1; }
    else S[k] += dt * (2.4 + f.st['力'] * 0.32) * rr(0.7, 1.3);
  }
  a.vis.ox = Math.sin(S.t * 38) * 3; d.vis.ox = Math.sin(S.t * 38 + 2) * 3;
  if (S.T > 0) return;
  a.vis.ox = 0; d.vis.ox = 0; L.t = 0; L.sp = null;
  const diff = S.a - S.d, dir = d.x >= a.x ? 1 : -1;
  if (diff < -1.2) {
    M.lock = null; a.mode = 'free'; d.mode = 'free'; a.stun = 0.5; a.cool = 0.3; d.stun = 0.05; a.x = clamp(a.x - dir * 0.12, -0.95, 0.95);
    say('ふりほどいた!', 0.9); Snd.whiff(); FX.push({ type: 'star', x: sx((a.x + d.x) / 2), y: GROUND - 112, t: 0, dur: 0.3, k: 0.9, tier: 0 });
  } else if (diff > 1.2) {
    L.bonus = true; say('力で押し込んだ!', 0.8); Snd.menu();
    if (Math.abs(d.x) > 0.8) { applyHit(a, d, { id: 'PUSH', name: 'ロープ押し込み', kind: 'ロ', rank: 2, dmg: 7, cost: 0, part: '背', sit: '立ち' }, false, 1); d.x = clamp(d.x + dir * 0.0, -0.95, 0.95); say('ロープに押し込んだ!', 0.9); }
  }
}
function chooseLock(i) {
  const L = M.lock; if (!L) return; const m = L.items[i]; if (!m) return; Snd.menu();
  M.lock = null; const a = L.a, d = L.d; a.mode = 'act'; startAct(a, d, m, 'lock', { mult: L.bonus ? 1.15 : 1 });
}

// ---------- ピン(3カウント) ----------
function startPin(a, d) {
  M.pin = { a, d, n: 0, t: 0, step: 0.78 }; a.mode = 'pin'; M.counts.pins++; a.x = clamp(d.x - (a.x < d.x ? 0.16 : -0.16), -0.95, 0.95); say('カバー!', 0.8);
}
function stepPin(dt) {
  const P = M.pin; if (!P) return; const a = P.a, d = P.d;
  d.mash += (wasPressed('KeyZ', 'KeyX', 'KeyC', 'KeyV', 'Space', 'Enter', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown') && d.human ? 1 : 0) + (!d.human && rnd() < dt * (2 + d.st['気'] * 0.4) ? 1 : 0);
  P.t += dt;
  if (P.t >= P.step) {
    P.t = 0; P.n++; Snd.count(); say(String(P.n), 0.7);
    const kick = clamp(0.06 + 0.78 * Math.pow(d.ratio, 0.85) + 0.035 * (d.st['耐'] - 5) + d.mash * 0.09, 0.02, 0.96); d.mash = 0;
    if (P.n < 3) { if (rnd() < kick * 0.55) { P.out = true; } }
    else if (rnd() < kick) P.out = true;
    if (P.out) { say('カウント2.9! 返した!', 1.0); a.mode = 'free'; a.cool = 0.5; d.downT = Math.max(d.downT, 0.8); d.mode = 'down'; M.pin = null; return; }
    if (P.n >= 3) { M.pin = null; a.mode = 'free'; endMatch(a, 'PIN'); }
  }
}

// ---------- 自由行動(立ち・ダウン) ----------
function freeStep(f, dt) {
  const o = opp(f);
  f.cool = Math.max(0, f.cool - dt); f.stun = Math.max(0, f.stun - dt); f.power = Math.min(MAXPOWER, f.power + dt * (0.9 + f.st['気'] * 0.12));
  f.vis.flash = Math.max(0, f.vis.flash - dt);
  if (f.slide) { f.x = clamp(f.x + f.slide * dt * 0.8, -0.95, 0.95); f.slide *= Math.pow(0.02, dt); if (Math.abs(f.slide) < 0.05) f.slide = 0; }
  if (f.mode === 'down') {
    f.downT -= dt * (1 + f.mash * 0.0); lieTo(f, true, dt); f.vis.lie = f.lieN;
    if (f.human && wasPressed('KeyZ', 'KeyX', 'KeyC', 'KeyV', 'Enter', 'Space')) f.downT -= 0.22;
    if (!f.human && rnd() < dt * 1.2) f.downT -= 0.1;
    if (f.downT <= 0 && !(M.pin && M.pin.d === f)) {
      if (!f.human && !f.fakeDone && f.ratio > 0.3 && rnd() < 0.12) { f.fakeDone = true; f.downT = 0.6; return; }   // 狸寝入り: もう少し寝たふり
      const o2 = opp(f), away = f.x >= o2.x ? 1 : -1;
      f.mode = 'free'; f.stun = 0.2; f.invuln = 0.4;
      f.getupT = 0.38;
      if (f.fakeDone) { f.fakeDone = false; f.stun = 0; f.invuln = 0.8; f.surprise = 1.2; say('狸寝入りだった!', 0.9); }   // 起きざま不意打ち
      else if (f.human ? (keys.ArrowDown || f.ratio < 0.3 && !keys.ArrowLeft && !keys.ArrowRight && false) : f.ratio < 0.35) { f.stun = 0.6; f.power = Math.min(MAXPOWER, f.power + 1.5); }   // ゆっくり起きて気力を戻す
      else if (f.human ? (keys.ArrowLeft || keys.ArrowRight) : rnd() < 0.2) { f.slide = (f.human ? (keys.ArrowRight ? 1 : -1) : away) * 1.1; f.invuln = 0.7; f.stun = 0; }   // ころがって逃げる
      f.fakeDone = false;
    }
    return;
  }
  lieTo(f, false, dt); f.vis.lie = f.lieN;
  f.getupT = Math.max(0, (f.getupT || 0) - dt);
  if (f.mode !== 'free') return;
  const I = f.human ? humanIntent(f) : aiIntent(f, o, dt);
  f.face = o.x >= f.x ? 1 : -1;
  if (f.stun <= 0) {
    const sp = (0.42 + f.st['速'] * 0.045) * (f.power < 4 ? 0.72 : 1) * (f.life / f.maxLife < 0.25 ? 0.85 : 1); f.x = clamp(f.x + I.mx * sp * dt, -0.95, 0.95); f.moving = Math.abs(I.mx) > 0.05;
    // 相手を通り抜けない
    const gap = 0.17; if (Math.abs(f.x - o.x) < gap && o.mode !== 'down') f.x = o.x + (f.x < o.x ? -gap : gap) * 1;
    f.x = clamp(f.x, -0.95, 0.95);
  }
  if (f.cool > 0 || f.stun > 0 || M.act || M.lock || M.pin || M.over) return;
  const d = dist(), near = d < 0.3, oDown = o.mode === 'down';
  if (oDown) {
    if (I.grab && d < 0.5) { startPin(f, o); return; }
    if (I.heavy && o.mode === 'down' && f.dive.length && d < 1.1) { const m = pick(f.dive); startAct(f, o, m, 'dive', { mult: 1 }); return; }
    if (I.light && d < 0.5 && f.ground.length) { startAct(f, o, pick(f.ground), 'ground'); return; }
    return;
  }
  if (I.grab && I.up && !f.holding) {   // リング際で椅子を拾う
    const ch = M.chairs.find((c) => c.avail && Math.sign(f.x) === c.side && Math.abs(f.x) > 0.74);
    if (ch) { ch.avail = false; f.holding = 'chair'; f.cool = 0.4; say('パイプ椅子!', 0.8); Snd.menu(); return; }
  }
  if (f.holding === 'chair' && (I.light || I.heavy) && near) {   // 椅子で殴る
    const mv = { id: 'CHAIR', name: 'パイプ椅子攻撃', kind: '打', rank: 4, dmg: 20, cost: 2, part: '頭', sit: '立ち' };
    f.holding = null; startAct(f, o, mv, 'strike', { dodge: false, knock: true, mult: 1 }); return;
  }
  if (I.special && near) { const s = f.specials.filter((m) => f.gauge >= m.gauge - 0.001); if (s.length) { startLock(f, o); M.lock.sp = null; M.lock.items = s.concat(M.lock.items).slice(0, 6); return; } }
  if (I.rope && Math.abs(f.x) > 0.7 && f.rope.length && d < 1.5) { startAct(f, o, pick(f.rope), 'rope'); return; }
  if (I.light || I.heavy) {
    const mv = I.heavy ? pick(f.heavy) : pick(f.light);
    const hitOK = d < 0.32; const dodge = hitOK && !o.invuln && rnd() < clamp(0.1 + (o.st['速'] - f.st['速']) * 0.03, 0.02, 0.4) && o.mode === 'free';
    if (!hitOK) { startAct(f, o, mv, 'whiff'); return; }
    startAct(f, o, mv, 'strike', { dodge, knock: I.heavy && rnd() < 0.3 + (1 - o.ratio) * 0.3, mult: 1 }); return;
  }
  if (I.grab && near) {
    const p = clamp(0.58 + 0.045 * (f.st['技'] - o.st['技']) - (o.stun > 0 ? -0.2 : 0), 0.2, 0.92);
    if (rnd() < p) { startLock(f, o); } else { f.cool = 0.55; f.stun = 0.25; say('組めない!', 0.6); }
  }
}
function humanIntent(f) {
  const I = { mx: (keys.ArrowRight ? 1 : 0) - (keys.ArrowLeft ? 1 : 0), light: wasPressed('KeyZ'), heavy: wasPressed('KeyX'), grab: wasPressed('KeyC'), special: wasPressed('KeyV'), rope: false, up: !!keys.ArrowUp };
  if (keys.ArrowUp && I.heavy) { I.rope = true; I.heavy = false; }
  return I;
}
function aiIntent(f, o, dt) {
  const A = f.ai, I = { mx: 0, light: false, heavy: false, grab: false, special: false, rope: false, up: false }; A.t -= dt;
  const d = Math.abs(f.x - o.x), dir = o.x > f.x ? 1 : -1, lv = 0.8 + (f.st['技'] - 5) * 0.04;
  if (o.mode === 'down') {   // 倒れた相手: ピンか追撃
    if (d > 0.4) I.mx = dir; else if (A.t <= 0) { A.t = rr(0.25, 0.6); const r = rnd(); if (o.ratio < 0.55 && r < 0.55) I.grab = true; else if (r < 0.8 && f.ground.length) I.light = true; else if (f.dive.length) I.heavy = true; }
    if (d > 0.4 && d < 1.0 && f.dive.length && A.t <= 0 && rnd() < 0.4) { A.t = 0.5; I.heavy = true; I.mx = 0; }
    return I;
  }
  if (f.surprise > 0) { f.surprise -= dt; if (d < 0.34) { f.surprise = 0; I.heavy = true; return I; } I.mx = dir; return I; }
  if (!f.holding && Math.abs(f.x) > 0.8 && M.chairs.some((c) => c.avail && Math.sign(f.x) === c.side) && rnd() < 0.5 * dt * 4) { I.grab = true; I.up = true; return I; }
  if (f.holding === 'chair' && d < 0.3 && A.t <= 0) { A.t = rr(0.3, 0.7); I.heavy = true; return I; }
  if (d > 0.27) { I.mx = dir * (rnd() < 0.9 ? 1 : 0); if (d < 0.6 && A.t <= 0) { A.t = rr(0.2, 0.5); if (rnd() < 0.25) I.light = true; } return I; }
  if (A.t > 0) { I.mx = d < 0.2 ? -dir * 0.5 : 0; return I; }
  A.t = rr(0.35, 0.9) / lv; const r = rnd();
  if (f.gauge >= 1.9 && r < 0.45) I.special = true;
  else if (r < 0.50 + (f.st['技'] - 5) * 0.03) I.grab = true; else if (r < 0.78) I.light = true; else I.heavy = true;
  if (Math.abs(f.x) > 0.8 && rnd() < 0.25 && f.rope.length) { I.rope = true; I.light = I.heavy = false; }
  return I;
}
function aiLock(L) { if (L.t > rr(0.2, 0.45)) { const it = L.items; let best = 0, bs = -1; it.forEach((m, i) => { const s = m.dmg * (m.id[0] === 'S' ? 1.35 : 1) + rnd() * 8; if (s > bs) { bs = s; best = i; } }); chooseLock(best); } }

// ---------- 更新 ----------
function stepMatch(dt) {
  if (!M) return;
  if (slowT > 0) { slowT -= dt; dt *= 0.3; }
  M.gongT = Math.max(0, (M.gongT || 0) - dt); M.time += dt; M.msgT -= dt; shake *= 0.86; flashT = Math.max(0, flashT - dt); zoom *= 0.9; crowdT = Math.max(0, crowdT - dt); comboT = Math.max(0, comboT - dt);
  if (M.praise) { M.praise.t += dt; if (M.praise.t > M.praise.dur) M.praise = null; }
  if (hitStop > 0) { hitStop -= dt; return; }
  for (const f of M.p) { f.invuln = Math.max(0, (f.invuln || 0) - dt); }
  if (M.over) { M.over.t += dt; if (M.act) stepAct(dt); if (state === 'match' && M.over.t > 2.6) { state = 'result'; } return; }
  if (M.bellT > 0) { M.bellT -= dt; return; }
  if (M.time > M.limit) { const [a, b] = M.p; endMatch(a.ratio >= b.ratio ? a : b, '判定'); return; }
  if (M.act) stepAct(dt);
  else if (M.lock) {
    const L = M.lock; L.t += dt; if (L.sp) stepStruggle(L, dt);
    if (L.sp) { /* 力比べ中 */ } else if (L.a.human) {
      if (wasPressed('ArrowUp')) { L.sel = (L.sel + L.items.length - 1) % L.items.length; Snd.menu(); }
      if (wasPressed('ArrowDown')) { L.sel = (L.sel + 1) % L.items.length; Snd.menu(); }
      for (let i = 0; i < 6; i++) if (wasPressed('Digit' + (i + 1))) chooseLock(i);
      if (wasPressed('KeyZ', 'Enter', 'Space', 'KeyC')) chooseLock(L.sel);
      else if (L.t > L.limit) chooseLock(0);
    } else aiLock(L);
  } else if (M.pin) stepPin(dt);
  for (const f of M.p) { if (f.mode === 'act' && !M.act) f.mode = 'free'; if (f.mode === 'hold' && !M.act && !M.lock) f.mode = 'free'; }
  if (!M.act) for (const f of M.p) freeStep(f, dt); else { for (const f of M.p) { f.cool = Math.max(0, f.cool); f.vis.flash = Math.max(0, f.vis.flash - dt); lieTo(f, f.mode === 'down', dt); f.vis.lie = Math.max(f.vis.lie || 0, f.lieN); } }
  // 他の演出
}
function stepRef(dt) {
  const R = M && M.ref; if (!R || !PUP.has(21)) return; const a = M.p[0], b = M.p[1];
  let tx = (a.x + b.x) / 2 + (b.x >= a.x ? 1 : -1) * 0.0, side = ((a.x + b.x) / 2 > 0 ? -1 : 1) * 0.42;
  if (M.pin) { const d = M.pin.d, k = M.pin.a.x < d.x ? 1 : -1; tx = d.x + k * 0.34; } else tx = (a.x + b.x) / 2 + side;
  tx = clamp(tx, -0.88, 0.88); R.x += (tx - R.x) * Math.min(1, dt * (M.pin ? 3.5 : 1.6));
  R.face = ((a.x + b.x) / 2) >= R.x ? 1 : -1; if (M.pin) R.face = M.pin.d.x >= R.x ? 1 : -1;
  const name = M.pin ? (M.pin.t > M.pin.step * 0.55 ? 'refUp' : 'refSlap') : 'refStand';
  PUP.step(R, name, dt, M.pin ? 22 : 10, { ry: Math.sin(M.time * 2.2) * 0.8 });
}
function stepFx(dt) { for (let i = FX.length - 1; i >= 0; i--) { const e = FX[i]; e.t += dt; if (e.type === 'dot') { e.x += e.vx * dt; e.y += e.vy * dt; e.vy += 900 * dt; } if (e.t > e.dur) FX.splice(i, 1); } if (banner) { banner.t += dt; if (banner.t > banner.dur) banner = null; } }

// ---------- 描画: リング ----------
const RING = { bl: [215, 262], br: [745, 262], fr: [905, 480], fl: [55, 480] };
let bg = null;
function buildBg() {
  bg = document.createElement('canvas'); bg.width = W; bg.height = H; const g = bg.getContext('2d'); g.imageSmoothingEnabled = false;
  // 観客席
  const gr = g.createLinearGradient(0, 0, 0, 280); gr.addColorStop(0, '#0b1030'); gr.addColorStop(1, '#2a2050'); g.fillStyle = gr; g.fillRect(0, 0, W, 300);
  const cols = ['#e8c8a0', '#d8a878', '#f0d8b8', '#b88860', '#ffe0c0', '#c89870'], shirt = ['#c33', '#36c', '#3a6', '#c93', '#a3c', '#ddd', '#333', '#e63'];
  let s = 777; const r = () => { s = (Math.imul(s, 1664525) + 1013904223) >>> 0; return s / 4294967296; };
  for (let row = 0; row < 7; row++) { const y = 70 + row * 26; for (let x = -10; x < W + 20; x += 20 - row) { const px = x + r() * 6, py = y + r() * 4; g.fillStyle = shirt[Math.floor(r() * shirt.length)]; g.fillRect(px, py + 8, 12, 14); g.fillStyle = cols[Math.floor(r() * cols.length)]; g.fillRect(px + 2, py, 8, 9); g.fillStyle = r() < 0.5 ? '#222' : '#642'; g.fillRect(px + 2, py - 1, 8, 3); } g.fillStyle = 'rgba(10,10,30,' + (0.45 - row * 0.05) + ')'; g.fillRect(0, y - 8, W, 34); }
  // 看板
  g.fillStyle = '#1a2a6a'; g.fillRect(0, 232, W, 30); g.fillStyle = '#e8c040'; g.font = 'bold 20px sans-serif'; g.textAlign = 'center'; for (let i = 0; i < 4; i++) g.fillText('SUPER RING  ★  超人', 120 + i * 240, 254);
  // 床
  g.fillStyle = '#12122a'; g.fillRect(0, 262, W, 280);
  // アプロン
  g.fillStyle = '#1c3d90'; g.fillRect(RING.fl[0], RING.fl[1] + 218, RING.fr[0] - RING.fl[0], 62);
  g.fillStyle = '#e8c040'; g.font = 'bold 34px sans-serif'; g.fillText('SUPER RING', W / 2, 520);
  // マット
  g.fillStyle = '#d8c8a0'; g.beginPath(); g.moveTo(...RING.bl); g.lineTo(...RING.br); g.lineTo(...RING.fr); g.lineTo(...RING.fl); g.closePath(); g.fill();
  g.strokeStyle = 'rgba(120,90,50,.35)'; g.lineWidth = 1; for (let i = 1; i < 14; i++) { const t = i / 14; g.beginPath(); g.moveTo(lerp(RING.bl[0], RING.fl[0], t), lerp(RING.bl[1], RING.fl[1], t)); g.lineTo(lerp(RING.br[0], RING.fr[0], t), lerp(RING.br[1], RING.fr[1], t)); g.stroke(); }
  // 中央のロゴ
  g.save(); g.translate(W / 2, 395); g.scale(1, 0.34); g.fillStyle = 'rgba(30,60,160,.55)'; g.font = 'bold 84px sans-serif'; g.fillText('SUPER', 0, -6); g.font = 'bold 40px sans-serif'; g.fillText('P R O - W R E S T L I N G', 0, 44); g.restore();
}
const lerp2 = (p, q, t) => [lerp(p[0], q[0], t), lerp(p[1], q[1], t)];
function ropePt(c, k, hh) { const sc = lerp(0.62, 1.08, (c[1] - RING.bl[1]) / (RING.fl[1] - RING.bl[1])); return [c[0], c[1] - hh * sc]; }
function drawRopes(front) {
  const ropeCol = ['#d33', '#eee', '#35c'], hs = [58, 100, 142];
  const draw = (p, q, sag) => { for (let i = 0; i < 3; i++) { const a = ropePt(p, 0, hs[i]), b = ropePt(q, 0, hs[i]); ctx.strokeStyle = ropeCol[i]; ctx.lineWidth = front ? 4 : 3; ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.quadraticCurveTo((a[0] + b[0]) / 2, (a[1] + b[1]) / 2 + sag, b[0], b[1]); ctx.stroke(); } };
  if (!front) { ctx.globalAlpha = 1; draw(RING.bl, RING.br, 5); draw(RING.bl, RING.fl, 4); draw(RING.br, RING.fr, 4); }
  else { ctx.globalAlpha = 0.55; draw(RING.fl, RING.fr, 7); ctx.globalAlpha = 1; }
  // 支柱
  const posts = front ? [RING.fl, RING.fr] : [RING.bl, RING.br];
  for (const p of posts) { const top = ropePt(p, 0, 160), sc = lerp(0.62, 1.08, (p[1] - RING.bl[1]) / (RING.fl[1] - RING.bl[1])), w = 9 * sc; ctx.fillStyle = '#7a1c1c'; ctx.fillRect(p[0] - w / 2, top[1], w, p[1] - top[1] + 4); ctx.fillStyle = '#ddd'; for (const h of hs) { const q = ropePt(p, 0, h); ctx.fillRect(p[0] - w * 0.8, q[1] - 5 * sc, w * 1.6, 10 * sc); } }
}

// ---------- 描画: レスラー ----------
function drawFighter(f) {
  const im = IMG.body[f.no]; if (!im) return;
  if (f.trail && f.trail.length > 1 && !PUP.has(f.no)) { const fl = f.face >= 0 ? 1 : -1, h0 = 212, s0 = h0 / im.height, w0 = im.width * s0; f.trail.forEach((p, i) => { if (i === f.trail.length - 1) return; ctx.save(); ctx.globalAlpha = 0.07 + 0.22 * i / f.trail.length; ctx.translate(sx(p.x) + p.ox, GROUND - h0 / 2 - p.lift); ctx.rotate(p.rot); ctx.scale(fl, 1); ctx.drawImage(im, -w0 / 2, -h0 / 2, w0, h0); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha *= 0.8; ctx.drawImage(im, -w0 / 2, -h0 / 2, w0, h0); ctx.restore(); }); }
  if (M.act && M.act.a === f && M.act.mv.id && M.act.mv.id[0] === 'S') { const px0 = sx(f.x), pulse = 0.75 + 0.25 * Math.sin(M.act.t * 18), g = ctx.createRadialGradient(px0, GROUND - 110, 10, px0, GROUND - 110, 190 * pulse); g.addColorStop(0, 'rgba(255,230,255,.75)'); g.addColorStop(0.45, 'rgba(255,80,225,.38)'); g.addColorStop(1, 'rgba(255,60,200,0)'); ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = g; ctx.fillRect(px0 - 220, GROUND - 330, 440, 440); ctx.restore(); }
  if ((f.mode === 'down' || f.lieN > 0.5) && IMG.down[f.no]) { drawDownSprite(f); return; }
  const actionFrame = actionFrameFor(f);
  if (actionFrame !== null && IMG.action[f.no]) { drawActionSprite(f, actionFrame); return; }
  // 倒れた体と投げられる体は一枚絵でつなぎ、関節の部品がばらけて見えるのを防ぐ。
  const wholeBody = f.mode === 'down' || f.lieN > 0.5 || (M.act && M.act.d === f && M.act.motionKind === '投');
  if (!wholeBody && PUP.has(f.no)) { drawPuppet(f); return; }
  const o = opp(f), v = f.vis;
  const hh = 212, sc = hh / im.height, w = im.width * sc;
  const px = sx(f.x) + v.ox, flip = (f.face >= 0 ? 1 : -1);
  // 影
  ctx.fillStyle = 'rgba(0,0,0,.35)'; ctx.beginPath(); ctx.ellipse(px, GROUND + 4, 56 * (1 - Math.min(0.5, v.lift / 280)), 11, 0, 0, 7); ctx.fill();
  const lie = f.lieN, cyStand = GROUND - hh / 2 - v.lift, cyLie = GROUND - 42 - v.lift * 0.3, cy = lerp(cyStand, cyLie, lie);
  ctx.save(); ctx.translate(px, cy);
  const lieRot = (flip >= 0 ? -1 : 1) * 1.45 * lie; ctx.rotate(v.rot + lieRot);
  ctx.scale(flip * v.sx, v.sy);
  ctx.drawImage(im, -w / 2, -hh / 2, w, hh);
  if (v.flash > 0) { ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = 0.7; ctx.drawImage(im, -w / 2, -hh / 2, w, hh); ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over'; }
  ctx.restore();
}
function actionFrameFor(f) {
  if (!M || !IMG.action[f.no]) return null;
  if (M.over && M.over.winner === f) return null;
  // 汎用のボディスラム用シートは、回転・逆さ抱えなどの必殺技には使わない。
  if (M.act && M.act.a === f && M.act.motionKind === '投' && M.act.throwStyle === 'slam') {
    const A = M.act, u = clamp((A.t - A.intro) / Math.max(0.01, A.dur - A.intro), 0, 1);
    return u < 0.2 ? 1 : u < 0.42 ? 2 : u < 0.7 ? 3 : 4;
  }
  if (M.lock && (M.lock.a === f || M.lock.d === f)) return 1;
  if (f.getupT > 0 && f.mode === 'free') return 5;
  if (f.mode === 'free' && f.stun <= 0 && (!M.act || (M.act.a !== f && M.act.d !== f))) return 0;
  return null;
}
function drawActionSprite(f, frame) {
  const v = f.vis, s = 1.72, px = sx(f.x) + v.ox, lift = v.lift || 0;
  ctx.fillStyle = 'rgba(0,0,0,.35)'; ctx.beginPath(); ctx.ellipse(px, GROUND + 4, 48 * (1 - Math.min(0.5, lift / 280)), 9, 0, 0, 7); ctx.fill();
  const walking = (f.walkVisual || 0) > 0;
  ctx.save(); ctx.translate(px, GROUND - lift - (walking ? Math.abs(Math.sin(f.walkT || 0)) * 3 : 0)); ctx.rotate((v.rot || 0) + (walking ? Math.sin(f.walkT || 0) * 0.025 : 0));
  ctx.scale((f.face >= 0 ? 1 : -1) * s * v.sx, s * v.sy);
  const im = IMG.action[f.no], x = (frame % 3) * 128, y = Math.floor(frame / 3) * 128;
  ctx.drawImage(im, x, y, 128, 128, -64, -128, 128, 128);
  if (v.flash > 0) { ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = 0.45; ctx.drawImage(im, x, y, 128, 128, -64, -128, 128, 128); }
  ctx.restore();
}
function drawDownSprite(f) {
  const px = sx(f.x) + f.vis.ox, im = IMG.down[f.no];
  ctx.fillStyle = 'rgba(0,0,0,.32)'; ctx.beginPath(); ctx.ellipse(px, GROUND + 3, 88, 8, 0, 0, 7); ctx.fill();
  ctx.save(); ctx.translate(px, GROUND - Math.max(0, f.vis.lift || 0)); ctx.scale(f.face >= 0 ? 1 : -1, 1);
  ctx.drawImage(im, -128, -128);
  if (f.vis.flash > 0) { ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = .4; ctx.drawImage(im, -128, -128); }
  ctx.restore();
}
function drawFx() {
  for (const e of FX) {
    const u = e.t / e.dur;
    if (e.type === 'star') { ctx.save(); ctx.translate(e.x, e.y); ctx.rotate(u * 0.5); const R = (30 + 70 * u) * e.k; ctx.fillStyle = u < 0.5 ? '#fff6a0' : '#ff9030'; ctx.globalAlpha = 1 - u; ctx.beginPath(); for (let i = 0; i < 16; i++) { const r = i % 2 ? R * 0.45 : R; const a = i / 16 * 6.283; ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r); } ctx.closePath(); ctx.fill(); ctx.restore(); }
    else if (e.type === 'lines') { if (u < 0) continue; ctx.save(); ctx.translate(e.x, e.y); ctx.strokeStyle = e.tier >= 3 ? '#ffd0ff' : e.tier >= 2 ? '#fff' : '#ffeaa0'; ctx.globalAlpha = 1 - u; ctx.lineWidth = 2 + e.tier; for (let i = 0; i < e.n; i++) { const a = i / e.n * 6.283 + (i % 3) * 0.07, r0 = (24 + 60 * u) * e.k, r1 = r0 + (40 + (i % 4) * 26) * e.k; ctx.beginPath(); ctx.moveTo(Math.cos(a) * r0, Math.sin(a) * r0); ctx.lineTo(Math.cos(a) * r1, Math.sin(a) * r1); ctx.stroke(); } ctx.restore(); }
    else if (e.type === 'ring') { if (u < 0) continue; ctx.save(); ctx.translate(e.x, e.y); ctx.globalAlpha = (1 - u) * 0.9; ctx.strokeStyle = e.tier >= 3 ? '#ff80f0' : '#fff'; ctx.lineWidth = 6 * (1 - u) + 1; const R = (30 + 190 * u) * e.k * 0.6; ctx.beginPath(); ctx.ellipse(0, 0, R, e.air ? R : R * 0.28, 0, 0, 7); ctx.stroke(); ctx.restore(); }
    else if (e.type === 'dust') { e.x += (e.vx || 0) * 0.016; e.y += (e.vy || 0) * 0.016; ctx.globalAlpha = (1 - u) * 0.55; ctx.fillStyle = '#c8b898'; ctx.beginPath(); ctx.arc(e.x, e.y, e.r * (0.5 + u), 0, 7); ctx.fill(); ctx.globalAlpha = 1; }
    else if (e.type === 'crack') { let sd = e.seed; const rq = () => { sd = (Math.imul(sd, 1664525) + 1013904223) >>> 0; return sd / 4294967296; }; ctx.save(); ctx.translate(e.x, e.y); ctx.strokeStyle = '#2a1a10'; ctx.globalAlpha = u < 0.7 ? 1 : (1 - u) / 0.3; ctx.lineWidth = 2; const grow = Math.min(1, u / 0.12); for (let i = 0; i < 7; i++) { let px = 0, py = 0, a = rq() * 6.283; ctx.beginPath(); ctx.moveTo(0, 0); for (let j = 0; j < 5 * grow; j++) { a += (rq() - 0.5) * 0.9; px += Math.cos(a) * 24 * e.k; py += Math.sin(a) * 7 * e.k; ctx.lineTo(px, py); } ctx.stroke(); } ctx.restore(); }
    else if (e.type === 'wave') { if (u < 0) continue; ctx.save(); ctx.globalAlpha = (1 - u) * 0.8; ctx.strokeStyle = e.tier >= 3 ? '#ff60e0' : '#ffe070'; ctx.lineWidth = 10 * (1 - u) + 2; ctx.beginPath(); ctx.arc(e.x, e.y, (40 + 420 * u) * e.k * 0.5, 0, 7); ctx.stroke(); ctx.restore(); }
    else if (e.type === 'dot') { ctx.fillStyle = '#ffd860'; ctx.globalAlpha = 1 - u; ctx.fillRect(e.x, e.y, 5, 5); ctx.globalAlpha = 1; }
    else if (e.type === 'txt') { ctx.save(); ctx.translate(e.x, e.y - u * 20); ctx.rotate(-0.15); ctx.font = `bold ${Math.round(38 * e.k)}px sans-serif`; ctx.textAlign = 'center'; const tr = e.tier || 0; ctx.lineWidth = 6 + tr * 2; ctx.strokeStyle = tr >= 3 ? '#601070' : tr >= 2 ? '#8a1010' : '#a02010'; ctx.fillStyle = tr >= 3 ? '#ff90f0' : '#ffe040'; ctx.globalAlpha = 1 - u * u; const pop = 1 + Math.max(0, 0.3 - e.t) * 2; ctx.scale(pop, pop); ctx.strokeText(e.s, 0, 0); ctx.fillText(e.s, 0, 0); ctx.restore(); }
  }
  ctx.globalAlpha = 1;
}

// ---------- 描画: HUD ----------
function bar(x, y, w, h, v, col, back, right) {
  ctx.fillStyle = back || '#201830'; ctx.fillRect(x, y, w, h); ctx.fillStyle = col; const ww = Math.max(0, w * clamp(v, 0, 1)); ctx.fillRect(right ? x + w - ww : x, y, ww, h); ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.5; ctx.strokeRect(x, y, w, h);
}
function drawHud() {
  for (const f of M.p) {
    const L = f.side < 0, x0 = L ? 14 : W - 14; const ix = L ? 14 : W - 14 - 62;
    const fi = IMG.face[f.no]; ctx.fillStyle = '#10102a'; ctx.fillRect(ix, 10, 62, 62); if (fi) ctx.drawImage(fi, ix + 2, 12, 58, 58); ctx.strokeStyle = L ? '#f55' : '#58f'; ctx.lineWidth = 3; ctx.strokeRect(ix, 10, 62, 62);
    const bx = L ? 84 : W - 84 - 300, bw = 300;
    ctx.font = 'bold 20px sans-serif'; ctx.textAlign = L ? 'left' : 'right'; ctx.fillStyle = '#fff'; ctx.fillText((L ? '1P ' : '2P ') + f.name, L ? bx : bx + bw, 28);
    const lv = f.life / f.maxLife; bar(bx, 34, bw, 14, lv, lv > 0.5 ? '#f2d020' : lv > 0.22 ? '#f08020' : '#e03030', '#201830', !L);
    bar(bx, 52, bw, 9, f.power / MAXPOWER, '#3898ff', '#201830', !L);
    // 必殺ゲージ(3つ)
    for (let i = 0; i < GAUGE_MAX; i++) { const gx = L ? bx + i * 34 : bx + bw - 30 - i * 34, fill = clamp(f.gauge - i, 0, 1); ctx.fillStyle = '#201830'; ctx.fillRect(gx, 64, 30, 8); ctx.fillStyle = fill >= 1 ? '#ff50e0' : '#b050b0'; ctx.fillRect(gx, 64, 30 * fill, 8); ctx.strokeStyle = '#fff'; ctx.lineWidth = 1; ctx.strokeRect(gx, 64, 30, 8); }
  }
  const rem = Math.max(0, M.limit - M.time); ctx.textAlign = 'center'; ctx.font = 'bold 26px monospace'; ctx.fillStyle = '#ffe070'; ctx.fillText(String(Math.floor(rem / 60)).padStart(2, '0') + ':' + String(Math.floor(rem % 60)).padStart(2, '0'), W / 2, 36); ctx.font = '13px sans-serif'; ctx.fillStyle = '#ccd'; ctx.fillText('TIME', W / 2, 16);
  if (M.msgT > 0 && M.msg) { ctx.font = 'bold 54px sans-serif'; ctx.textAlign = 'center'; ctx.lineWidth = 8; ctx.strokeStyle = '#102060'; ctx.fillStyle = '#fff'; const s = M.msg; ctx.strokeText(s, W / 2, 190); ctx.fillText(s, W / 2, 190); }
  if (M.pin) { const P = M.pin; ctx.font = 'bold 28px sans-serif'; ctx.textAlign = 'center'; ctx.fillStyle = '#ff6060'; ctx.fillText(`COUNT ${P.n}  ― ${P.d.human ? 'ボタンを連打で返せ!' : ''}`, W / 2, 130); bar(W / 2 - 100, 140, 200, 8, P.t / P.step, '#ff6060', '#201830'); }
  if (M.lock) drawLock();
  if (banner) { const u = banner.t / banner.dur, a = u < 0.1 ? u / 0.1 : u > 0.85 ? (1 - u) / 0.15 : 1; ctx.globalAlpha = clamp(a, 0, 1); ctx.fillStyle = banner.special ? 'rgba(80,0,60,.9)' : 'rgba(10,20,70,.9)'; ctx.fillRect(W / 2 - 250, 456, 500, 44); ctx.strokeStyle = banner.special ? '#ff60e0' : '#fff'; ctx.lineWidth = 3; ctx.strokeRect(W / 2 - 250, 456, 500, 44); ctx.fillStyle = '#fff'; ctx.font = 'bold 26px sans-serif'; ctx.textAlign = 'center'; ctx.fillText((banner.special ? '★ ' : '') + banner.s + (banner.special ? ' ★' : ''), W / 2, 487); ctx.globalAlpha = 1; }
}
function drawLock() {
  const L = M.lock;
  if (L.sp) {   // 力比べ(連打)
    const S = L.sp, x0 = W / 2 - 170, tot = Math.max(1, S.a + S.d), r = clamp(S.a / tot, 0.04, 0.96);
    ctx.fillStyle = 'rgba(0,0,0,.55)'; ctx.fillRect(x0 - 12, 100, 364, 70); ctx.fillStyle = '#ffe070'; ctx.font = 'bold 22px sans-serif'; ctx.textAlign = 'center'; ctx.fillText('力比べ! ボタン連打!', W / 2, 128);
    ctx.fillStyle = '#331'; ctx.fillRect(x0, 140, 340, 16); ctx.fillStyle = L.a.human ? '#5cf' : '#f66'; ctx.fillRect(x0, 140, 340 * r, 16); ctx.fillStyle = L.d.human ? '#5cf' : '#f66'; ctx.fillRect(x0 + 340 * r, 140, 340 * (1 - r), 16); ctx.fillStyle = '#fff'; ctx.fillRect(x0 + 340 * r - 2, 136, 4, 24);
    return;
  } if (!L.a.human) { ctx.fillStyle = 'rgba(0,0,0,.45)'; ctx.fillRect(W / 2 - 150, 130, 300, 34); ctx.fillStyle = '#fff'; ctx.font = 'bold 20px sans-serif'; ctx.textAlign = 'center'; ctx.fillText(L.a.name + ' が組みついた!', W / 2, 154); return; }
  const n = L.items.length, h = 30, y0 = 112, w = 330, x0 = W / 2 - w / 2;
  ctx.fillStyle = 'rgba(8,12,50,.88)'; ctx.fillRect(x0 - 10, y0 - 34, w + 20, n * h + 46); ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.strokeRect(x0 - 10, y0 - 34, w + 20, n * h + 46);
  ctx.fillStyle = '#ffe070'; ctx.font = 'bold 16px sans-serif'; ctx.textAlign = 'left'; ctx.fillText('組み! 技を選べ(↑↓ + Z / 数字)', x0, y0 - 12);
  L.items.forEach((m, i) => { const y = y0 + i * h; if (i === L.sel) { ctx.fillStyle = 'rgba(255,220,80,.35)'; ctx.fillRect(x0 - 4, y, w + 8, h - 3); } ctx.fillStyle = m.id[0] === 'S' ? '#ff80f0' : '#fff'; ctx.font = 'bold 19px sans-serif'; ctx.fillText((i + 1) + '. ' + lockMoveName(m), x0, y + 21); ctx.textAlign = 'right'; ctx.fillStyle = '#9bf'; ctx.font = '14px sans-serif'; ctx.fillText('★'.repeat(m.rank > 4 ? 5 : m.rank), x0 + w, y + 21); ctx.textAlign = 'left'; });
  bar(x0, y0 + n * h + 2, w, 4, 1 - L.t / L.limit, '#ffe070', '#201830');
}

// ---------- 画面: 選択・結果 ----------
let state = 'loading', sel = 0, selCpu = 0, titleT = 0, helpOn = false, helpNo = 1;
const hbRect = () => state === 'match' ? { x: W / 2 - 76, y: H - 40, w: 152, h: 30 } : { x: W - 168, y: 12, w: 152, h: 30 };
function handleTap(x, y) {
  if (state === 'match' && M && M.lock && M.lock.a.human && !helpOn) {   // 技の選択メニュー: 項目をタップ
    const L = M.lock, n = L.items.length, h0 = 30, y0 = 112, w0 = 330, x0 = W / 2 - w0 / 2;
    if (x >= x0 - 10 && x <= x0 + w0 + 10 && y >= y0 && y < y0 + n * h0) { chooseLock(Math.floor((y - y0) / h0)); return; }
  }
  if (helpOn) { if (y > 486) { if (x < 330) helpNo = (helpNo + 18) % 20 + 1; else if (x > 630) helpNo = helpNo % 20 + 1; else helpOn = false; Snd.menu(); } else if (x > W - 120 && y < 40) helpOn = false; return; }
  const hb = hbRect(); if ((state === 'select' || state === 'match') && x >= hb.x && x <= hb.x + hb.w && y >= hb.y && y <= hb.y + hb.h) { openHelp(); return; }
  if (state === 'select') { const cols = 5, cw = 150, ch = 98, ox = (W - cols * cw) / 2, oy = 84; const c = Math.floor((x - ox) / cw), r = Math.floor((y - oy) / ch); if (c >= 0 && c < cols && r >= 0 && r < 4) { const i = r * cols + c; if (i === sel) startFromSelect(); else { sel = i; Snd.menu(); } } else if (y > 480) startFromSelect(); }
  else if (state === 'result') { state = 'select'; M = null; }
  else if (state === 'title') { state = 'select'; Snd.menu(); }
}
function openHelp() { helpOn = true; helpNo = state === 'match' && M ? M.p[0].no : sel + 1; Snd.menu(); }
function startFromSelect() { let c; do { c = 1 + Math.floor(rnd() * 20); } while (c === sel + 1); newMatch(sel + 1, c, false); }
function drawSelect() {
  ctx.fillStyle = '#0c0c24'; ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = '#ffe070'; ctx.font = 'bold 34px sans-serif'; ctx.textAlign = 'center'; ctx.fillText('SUPER RING 超人プロレス 【作成中】', W / 2, 46); ctx.fillStyle = '#ccd'; ctx.font = '16px sans-serif'; ctx.fillText('レスラーを選んでください(矢印+Z / タップ)  相手はランダム', W / 2, 72);
  const cols = 5, cw = 150, ch = 98, ox = (W - cols * cw) / 2, oy = 84;
  for (let i = 0; i < 20; i++) {
    const c = i % cols, r = Math.floor(i / cols), x = ox + c * cw, y = oy + r * ch, on = i === sel; const im = IMG.face[i + 1];
    ctx.fillStyle = on ? '#2a3a90' : '#16163a'; ctx.fillRect(x + 6, y + 4, cw - 12, ch - 10); ctx.strokeStyle = on ? '#ffe070' : '#445'; ctx.lineWidth = on ? 4 : 1.5; ctx.strokeRect(x + 6, y + 4, cw - 12, ch - 10);
    if (im) ctx.drawImage(im, x + cw / 2 - 31, y + 8, 62, 62); ctx.fillStyle = '#fff'; ctx.font = 'bold 13px sans-serif'; ctx.textAlign = 'center'; ctx.fillText(DATA.wrestlers[String(i + 1)].name, x + cw / 2, y + ch - 13);
  }
  const w = DATA.wrestlers[String(sel + 1)]; ctx.textAlign = 'left'; ctx.fillStyle = '#fff'; ctx.font = 'bold 18px sans-serif';
  const st = w.stats; ctx.fillText(`${w.name}(${w.type})  力${st['力']} 速${st['速']} 技${st['技']} 耐${st['耐']} 気${st['気']}`, 30, 528);
  ctx.textAlign = 'right'; ctx.fillStyle = '#ff80f0'; ctx.font = '14px sans-serif'; const names = w.specials.map((id) => DATA.master.find((m) => m.id === id).name).join(' / '); ctx.fillText('必殺: ' + names, W - 30, 528);
  ctx.textAlign = 'center'; ctx.fillStyle = '#9bf'; ctx.font = '13px sans-serif'; ctx.fillText('試合: ←→移動 Z弱打 X強打 C組み付き(倒れた相手にはカバー) ↑+X ロープ反動 V必殺(ゲージがたまると組みで出せる)', W / 2, 504);
}
function drawResult() {
  const o = M.over; ctx.fillStyle = 'rgba(0,0,20,.7)'; ctx.fillRect(0, 0, W, H); ctx.textAlign = 'center'; const w = o.winner;
  ctx.fillStyle = '#ffe070'; ctx.font = 'bold 60px sans-serif'; ctx.fillText(w.name + ' の勝ち!', W / 2, 200); ctx.fillStyle = '#fff'; ctx.font = 'bold 26px sans-serif'; ctx.fillText(({ PIN: '3カウント', KO: 'K.O.', '判定': '時間切れ判定' })[o.how] + '  ' + Math.floor(M.time / 60) + '分' + Math.floor(M.time % 60) + '秒', W / 2, 250);
  const im = IMG.body[w.no]; if (im && !PUP.has(w.no)) { const hh = 190, sc = hh / im.height; ctx.drawImage(im, W / 2 - im.width * sc / 2, 280, im.width * sc, hh); }
  if (PROP.belt) { const b = PROP.belt; ctx.drawImage(b, W / 2 - b.width * 1.3, 268, b.width * 2.6, b.height * 2.6); }  ctx.fillStyle = '#9bf'; ctx.font = '18px sans-serif'; ctx.fillText('Z / タップで レスラー選択へ', W / 2, 520);
}
function drawCutIn(A) {
  const u = A.t / A.intro, a = A.a, ap = Math.sin(Math.min(1, u * 1.1) * Math.PI) ** 0.5;
  ctx.save(); ctx.fillStyle = `rgba(30,0,40,${0.72 * ap})`; ctx.fillRect(0, 0, W, H);
  // 放射状の光
  ctx.translate(W / 2, 270); ctx.globalCompositeOperation = 'lighter'; const rot = A.t * 1.4; for (let i = 0; i < 18; i++) { const a0 = rot + i / 18 * 6.283, a1 = a0 + 0.17; ctx.fillStyle = i % 2 ? `rgba(255,90,220,${0.28 * ap})` : `rgba(255,220,120,${0.2 * ap})`; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(Math.cos(a0) * 900, Math.sin(a0) * 900); ctx.lineTo(Math.cos(a1) * 900, Math.sin(a1) * 900); ctx.closePath(); ctx.fill(); }
  ctx.restore();
  // 斜めの帯と顔
  const slide = (1 - Math.min(1, u * 4)) * 700, fi = IMG.face[a.no], left = a.side < 0;
  ctx.save(); ctx.globalAlpha = ap; ctx.translate(0, 0);
  ctx.fillStyle = '#12082a'; ctx.beginPath(); ctx.moveTo(0, 190 + slide * 0.1); ctx.lineTo(W, 150); ctx.lineTo(W, 360); ctx.lineTo(0, 400); ctx.closePath(); ctx.fill();
  ctx.strokeStyle = '#ff60e0'; ctx.lineWidth = 5; ctx.stroke();
  if (fi) { const fx = left ? 60 - slide : W - 300 + slide, fs = 250; ctx.save(); ctx.translate(fx + fs / 2, 280); ctx.rotate(left ? -0.05 : 0.05); ctx.drawImage(fi, -fs / 2, -fs / 2 - 10, fs, fs); ctx.restore(); }
  ctx.textAlign = left ? 'left' : 'right'; const tx = left ? 330 + slide * 0.6 : W - 330 - slide * 0.6;
  ctx.font = 'bold 22px sans-serif'; ctx.fillStyle = '#ffe070'; ctx.fillText('★ FINISHER ★  ' + a.name, tx, 232);
  ctx.font = 'bold 56px sans-serif'; ctx.lineWidth = 9; ctx.strokeStyle = '#601070'; ctx.fillStyle = '#fff'; ctx.strokeText(A.mv.name, tx, 306); ctx.fillText(A.mv.name, tx, 306);
  ctx.font = '18px sans-serif'; ctx.fillStyle = '#ffc0f8'; ctx.fillText(A.mv.desc ? A.mv.desc.slice(0, 26) : '', tx, 342);
  ctx.restore();
  if (u > 0.9) { ctx.fillStyle = `rgba(255,255,255,${(u - 0.9) * 8})`; ctx.fillRect(0, 0, W, H); }
}
function drawRingside() {
  const pr = (k, x, y, s, flip) => { const im = PROP[k]; if (!im) return; ctx.save(); ctx.translate(x, y); if (flip) ctx.scale(-1, 1); ctx.drawImage(im, -im.width * s / 2, -im.height * s, im.width * s, im.height * s); ctx.restore(); };
  const sh = (M && M.gongT > 0) ? Math.sin(M.gongT * 50) * 3 * Math.min(1, M.gongT) : 0;
  ctx.save(); ctx.translate(sh, 0); pr('gong', 78, 520, 1.5); ctx.restore();                // 左下: ゴング(開始と終了で揺れる)
  pr('table', 872, 512, 1.4); pr('bell', 890, 470, 1.2); pr('towel', 846, 470, 0.8); pr('bottle', 930, 470, 0.9);   // 右下: 机の上に鐘・タオル・水
  if (M) for (const c of M.chairs) if (c.avail) pr('chair', c.side < 0 ? 185 : 735, 538, 1.2, c.side > 0);        // 左右のリング際: パイプ椅子
}
function drawMatch() {
  ctx.save(); if (shake > 0.3) ctx.translate(rr(-shake, shake), rr(-shake, shake));
  if (zoom > 0.002) { ctx.translate(zoomC[0], zoomC[1]); ctx.scale(1 + zoom, 1 + zoom); ctx.translate(-zoomC[0], -zoomC[1]); }
  ctx.drawImage(bg, 0, 0);
  if (crowdT > 0) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = 'rgba(255,230,160,' + (0.1 + 0.08 * Math.sin(M.time * 30)) * Math.min(1, crowdT) + ')'; ctx.fillRect(0, 60, W, 180); ctx.fillStyle = '#fff'; for (let i = 0; i < 10; i++) ctx.fillRect(rr(0, W), rr(70, 230), 3, 3); ctx.restore(); }
  drawRopes(false);
  if (M.ref && PUP.has(21)) { const R = M.ref, px = sx(R.x); ctx.fillStyle = 'rgba(0,0,0,.3)'; ctx.beginPath(); ctx.ellipse(px, GROUND - 4, 46, 9, 0, 0, 7); ctx.fill(); PUP.draw(ctx, R, px, GROUND - 8, R.face, 0, 0, R.vis); }
  const order = M.p.slice().sort((a, b) => (a.mode === 'down' ? -1 : 0) - (b.mode === 'down' ? -1 : 0)); const first = M.act ? [M.act.d, M.act.a] : M.lock ? [M.lock.d, M.lock.a] : M.pin ? [M.pin.d, M.pin.a] : order; for (const f of first) drawFighter(f);
  drawRopes(true); drawRingside(); drawFx(); ctx.restore();
  if (flashT > 0) { ctx.fillStyle = `rgba(${flashRGB},${Math.min(1, flashT)})`; ctx.fillRect(0, 0, W, H); }
  if (M.act && M.act.intro > 0 && M.act.t < M.act.intro) drawCutIn(M.act);
  if (M.praise) { const p = M.praise, u = p.t / p.dur, sc = 1 + Math.max(0, 0.25 - p.t) * 2; ctx.save(); ctx.translate(W / 2, 86); ctx.rotate(-0.06); ctx.scale(sc, sc); ctx.globalAlpha = u > 0.7 ? (1 - u) / 0.3 : 1; ctx.font = 'bold ' + (p.tier >= 3 ? 62 : 54) + 'px sans-serif'; ctx.textAlign = 'center'; ctx.lineWidth = 8; ctx.strokeStyle = p.tier >= 3 ? '#601070' : '#8a1010'; ctx.fillStyle = p.tier >= 3 ? '#ffb0f8' : '#ffe040'; ctx.strokeText(p.s, 0, 0); ctx.fillText(p.s, 0, 0); ctx.restore(); }
  drawHud();
}

// ---------- 主ループ ----------
let last = 0, acc = 0;
function frame(ts) {
  const dt = Math.min(0.05, (ts - last) / 1000 || 0.016); last = ts; acc += dt;
  while (acc >= 1 / 60) { update(1 / 60); acc -= 1 / 60; }
  render(); for (const k in pressed) delete pressed[k]; requestAnimationFrame(frame);
}
function update(dt) {
  titleT += dt;
  if (helpOn) {
    if (wasPressed('ArrowRight')) { helpNo = helpNo % 20 + 1; Snd.menu(); } if (wasPressed('ArrowLeft')) { helpNo = (helpNo + 18) % 20 + 1; Snd.menu(); }
    if (wasPressed('KeyH', 'Escape', 'KeyZ', 'Enter', 'Space')) { helpOn = false; if (state === 'select') sel = helpNo - 1; Snd.menu(); }
    return;
  }
  if (wasPressed('KeyH') && (state === 'select' || state === 'match')) { openHelp(); return; }
  if (state === 'select') {
    if (wasPressed('ArrowRight')) { sel = (sel + 1) % 20; Snd.menu(); } if (wasPressed('ArrowLeft')) { sel = (sel + 19) % 20; Snd.menu(); }
    if (wasPressed('ArrowDown')) { sel = (sel + 5) % 20; Snd.menu(); } if (wasPressed('ArrowUp')) { sel = (sel + 15) % 20; Snd.menu(); }
    if (wasPressed('KeyZ', 'Enter', 'Space')) startFromSelect();
  } else if (state === 'match') { stepMatch(dt); stepFx(dt); stepPoses(dt); stepRef(dt); }
  else if (state === 'result') { stepFx(dt); stepPoses(dt); if (wasPressed('KeyZ', 'Enter', 'Space')) { state = 'select'; M = null; } }
}
function render0() {
  if (state === 'loading') { ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, H); ctx.fillStyle = '#fff'; ctx.font = '24px sans-serif'; ctx.textAlign = 'center'; ctx.fillText('読み込み中…', W / 2, H / 2); return; }
  if (state === 'select') drawSelect(); else if (state === 'match') drawMatch(); else if (state === 'result') { drawMatch(); drawResult(); }
}

// ---------- 起動・試験 ----------
function fastSim(sec, a, b) {
  SIM = true; newMatch(a, b, true); M.p[0].human = false; M.bellT = 0; const dt = 1 / 60; let n = 0;
  while (n < sec * 60 && !(M.over && M.over.t > 0.1)) { stepMatch(dt); stepFx(dt); for (const k in pressed) delete pressed[k]; n++; }
  SIM = false;
  const r = { winner: M.over ? M.over.winner.name : null, how: M.over ? M.over.how : null, time: +M.time.toFixed(1), life: M.p.map((f) => Math.round(f.life)), counts: M.counts };
  document.title = JSON.stringify(r); return r;
}
window.__pw = { startAct, startLock, fastSim, get M() { return M; }, newMatch, get state() { return state; }, chooseLock, stepMatch, keys, pressed };
loadAll().then(() => {
  buildBg(); state = 'select';
  const vs = hp('vs'), sim = hp('sim'), auto = hp('auto') !== null || HASH.indexOf('auto') === 0;
  if (sim) { const [s, a, b] = sim.split('/').length > 1 ? sim.split('/') : [sim, 1, 5]; fastSim(+s, +a || 1, +b || 5); return; }
  if (vs) { const [a, b] = vs.split('/').map(Number); newMatch(a || 1, b || 5, false); }
  else if (auto) { newMatch(+(hp('a') || 1), +(hp('b') || 5), true); M.p[0].human = false; }
  requestAnimationFrame(frame);
});

function render() { const wr = document.getElementById('wrap'); if (wr) wr.classList.toggle('inmatch', state === 'match' && !helpOn); render0(); if (helpOn) drawHelp(); else if (state === 'select' || state === 'match') drawHelpBtn(); }
function drawHelpBtn() { const b = hbRect(); ctx.fillStyle = 'rgba(20,30,90,.85)'; ctx.fillRect(b.x, b.y, b.w, b.h); ctx.strokeStyle = '#ffe070'; ctx.lineWidth = 2; ctx.strokeRect(b.x, b.y, b.w, b.h); ctx.fillStyle = '#ffe070'; ctx.font = 'bold 16px sans-serif'; ctx.textAlign = 'center'; ctx.fillText('H: 操作・技表', b.x + b.w / 2, b.y + 21); }
const _hc = {};
function helpFighter(no) { return _hc[no] || (_hc[no] = new Fighter(no, -1, false)); }
function drawHelp() {
  const f = helpFighter(helpNo), w = DATA.wrestlers[String(helpNo)];
  ctx.fillStyle = 'rgba(6,8,30,.96)'; ctx.fillRect(0, 0, W, H);
  ctx.textAlign = 'left'; ctx.fillStyle = '#ffe070'; ctx.font = 'bold 26px sans-serif'; ctx.fillText('操作・技表', 24, 38);
  ctx.fillStyle = '#9bf'; ctx.font = '14px sans-serif'; ctx.fillText('←→ レスラー切替   H / Z / Esc で閉じる', 190, 36);
  // 左: 操作
  const rows = [['←  →', '移動(相手に近づく/離れる)'], ['Z', '弱打 ― 立ち技の打撃(倒れた相手には 地上技)'], ['X', '強打 ― 重い打撃(倒れた相手には 飛び技)'], ['C', '組み付き → 技を選ぶ(倒れた相手には カバー=3カウント)'], ['↑ + X', 'ロープ反動技(ロープ際で)'], ['V', '必殺技(ゲージがたまっていれば組みで出せる)'], ['連打', 'カバーされたら ボタン連打で返す / 倒れたとき 連打で早く起きる'], ['組み中', '↑↓ + Z か 数字 1〜6 で技を選ぶ(3秒で自動)']];
  ctx.font = 'bold 15px sans-serif'; let y = 72;
  for (const [k, t] of rows) { ctx.fillStyle = '#ff9040'; ctx.fillRect(24, y - 15, 70, 22); ctx.fillStyle = '#10102a'; ctx.textAlign = 'center'; ctx.fillText(k, 59, y + 1); ctx.fillStyle = '#fff'; ctx.textAlign = 'left'; ctx.font = '14px sans-serif'; wrapText(t, 102, y, 270, 17); ctx.font = 'bold 15px sans-serif'; y += (t.length > 19 ? 40 : 28); }
  ctx.fillStyle = '#9bf'; ctx.font = '13px sans-serif'; ctx.fillText('iPhone: 左手=◀▶(移動)▲▼ / 右手=弱・強・組、必・ロープ・椅子。技は画面をタップで選ぶ', 24, y + 14); ctx.fillText('勝ち方: 3カウント / K.O.(体力0) / 時間切れ判定', 24, y + 34); ctx.fillText('青いバー=気力(技を出すと減る) ピンクの3つ=必殺ゲージ', 24, y + 54); ctx.fillText('組んだら連打で力比べ / 投げられる瞬間にボタンで受け身 / 倒れたあと ◀▶でころがり ▼で休む', 24, y + 74);
  // 右: そのレスラーの技表
  const X = 404; ctx.fillStyle = '#16163a'; ctx.fillRect(X - 8, 50, W - X - 8, 428); ctx.strokeStyle = '#445'; ctx.strokeRect(X - 8, 50, W - X - 8, 428);
  const fi = IMG.face[helpNo]; if (fi) ctx.drawImage(fi, X, 56, 56, 56);
  ctx.fillStyle = '#fff'; ctx.font = 'bold 22px sans-serif'; ctx.fillText(w.name + '  (' + w.type + ')', X + 66, 80); ctx.font = '14px sans-serif'; ctx.fillStyle = '#ccd'; const st = w.stats; ctx.fillText(`力${st['力']} 速${st['速']} 技${st['技']} 耐${st['耐']} 気${st['気']}`, X + 66, 102);
  let yy = 132; const sec = (title, col, list, tag) => { ctx.fillStyle = col; ctx.font = 'bold 15px sans-serif'; ctx.fillText(title, X, yy); yy += 6; ctx.font = '13px sans-serif'; ctx.fillStyle = '#fff'; let x = X, line = ''; const items = list.map((m) => m.name + (tag === 'sp' ? '(ゲージ' + m.gauge + ')' : '')); let cx = X, cy = yy + 14; for (const n of items) { const wd = ctx.measureText(n).width + 18; if (cx + wd > W - 22) { cx = X; cy += 17; } ctx.fillText(n, cx, cy); cx += wd; } yy = cy + 20; };
  sec('Z 弱打(立ち)', '#ffd060', f.light); sec('X 強打(立ち)', '#ff9040', f.heavy);
  sec('C 組み付き → 選ぶ技(投げ・関節)', '#80d0ff', f.lock);
  const g = f.ground.concat(f.dive.length ? [] : []); sec('倒れた相手: Z 地上技', '#a0e0a0', f.ground); sec('倒れた相手: X 飛び技', '#a0e0a0', f.dive);
  sec('↑+X ロープ反動', '#c0a0ff', f.rope); sec('★ 必殺技(V / 組みで)', '#ff80f0', f.specials, 'sp');
  ctx.fillStyle = '#6a7'; ctx.font = '12px sans-serif'; ctx.fillText('※ コーナー技・タッグ技はまだ出せません(作成中)', X, 470);
  // 下: 切替ボタン
  ctx.fillStyle = 'rgba(40,50,120,.9)'; ctx.fillRect(0, 486, 330, 54); ctx.fillRect(630, 486, 330, 54); ctx.fillStyle = 'rgba(70,40,40,.9)'; ctx.fillRect(330, 486, 300, 54);
  ctx.fillStyle = '#fff'; ctx.font = 'bold 20px sans-serif'; ctx.textAlign = 'center'; ctx.fillText('◀ 前のレスラー', 165, 520); ctx.fillText('次のレスラー ▶', 795, 520); ctx.fillText('閉じる', 480, 520);
}
function wrapText(t, x, y, mw, lh) { let line = '', yy = y; for (const ch of t) { if (ctx.measureText(line + ch).width > mw) { ctx.fillText(line, x, yy); line = ch; yy += lh; } else line += ch; } ctx.fillText(line, x, yy); }

// ---------- 紙人形: 描画とポーズ選び ----------
function drawPuppet(f) {
  const v = f.vis, flip = f.face >= 0 ? 1 : -1, px = sx(f.x) + v.ox;
  ctx.fillStyle = 'rgba(0,0,0,.35)'; ctx.beginPath(); ctx.ellipse(px, GROUND + 4, 56 * (1 - Math.min(0.5, v.lift / 280)), 11, 0, 0, 7); ctx.fill();
  PUP.draw(ctx, f, sx(f.x), GROUND, flip, v.lift, Math.max(f.lieN, v.lie || 0), v);
}
function actPose(A, f) {
  const att = A.a === f, mv = A.mv, k = A.motionKind, ti = A.t - A.intro, u = clamp(ti / Math.max(0.01, A.dur - A.intro), 0, 1);
  if (ti < 0) return att ? 'power' : 'guard';
  const hitAge = A.hitT === undefined ? 0 : A.t - A.hitT;
  if (A.kind === 'whiff' || (k === '打' && A.kind !== 'rope')) {
    if (att && A.rush) return u < 0.28 ? 'windup' : u < 0.49 ? 'punch' : u < 0.69 ? 'chopDown' : u < 0.86 ? 'lariat' : 'guard';
    if (att) return u < (A.intro ? 0.52 : 0.3) ? (A.style === 'chop' ? 'chopUp' : 'windup') : u < (A.intro ? 0.85 : 0.7) ? (A.style === 'chop' ? 'chopDown' : A.style) : 'guard';
    return (A.ticks > 0 || A.hit) && !A.dodge && u < 0.9 ? 'stagger' : A.dodge && u < 0.6 ? 'windup' : 'guard';
  }
  if (k === '投' || k === '奥') {
    if (!att) return A.hit ? 'down' : A.throwStyle === 'piledriver' && u > 0.32 ? 'tucked' : 'held';
    if (u < 0.22) return 'clinch';
    if (u < 0.62) return 'liftHigh';
    if (A.throwStyle === 'spark') return u < 0.86 ? 'spark' : 'kneel';
    if (A.throwStyle === 'buster') return u < 0.86 ? 'carry' : 'kneel';
    if (A.throwStyle === 'suplex') return 'bridge';
    if (A.throwStyle === 'ddt') return 'fallBack';
    return u < 0.86 ? 'slamDown' : 'kneel';
  }
  if (k === '関') return att ? (A.intro && /タワーブリッジ|背骨/.test(mv.name + (mv.desc || '')) ? 'bridge' : 'hold') : 'held';
  if (k === '飛') return att ? (u < 0.62 ? 'dive' : 'elbowDrop') : (f.mode === 'down' ? 'down' : 'stagger');
  if (k === '地') return att ? (u < 0.45 ? (/エルボー|ヒップ/.test(mv.name) ? 'elbowDrop' : 'stomp') : 'guard') : 'down';
  if (k === 'ロ' || A.kind === 'rope') return att ? (u < 0.35 ? 'runRope' : 'lariat') : (u > 0.6 ? 'stagger' : 'guard');
  return att ? 'dive' : 'stagger';
}
// 投げ技で持ち上げられた側: 持ち上げで背をそらし、頭上で体を振って(足がおくれてついてくる)、叩きつけの前に くの字に折れる
function flexOf(A) {
  const u = clamp((A.t - A.intro) / Math.max(0.01, A.dur - A.intro), 0, 1);
  if (u < 0.3) { const s = u / 0.3; return { tr: -0.55 * s, hr: -0.6 * s, af1: -1.1 * s, ab1: -1.2 * s, lf1: -0.5 * s, lb1: -0.8 * s, lf2: -0.3 * s }; }
  if (u < 0.72) { const v = (u - 0.3) / 0.42, w = Math.sin(v * Math.PI * 1.6); return { tr: -0.5 + 0.55 * w, hr: -0.55 + 0.7 * w, af1: -1 + 0.8 * w, ab1: -1.1 + 0.9 * w, lf1: -0.5 - 0.9 * w, lb1: -0.8 - 0.9 * w, lf2: -0.4 * w, lb2: -0.4 * w }; }
  const v = (u - 0.72) / 0.28; return { tr: 0.15 + 0.85 * v, hr: 0.2 + 0.5 * v, af1: 0.4 + 0.8 * v, ab1: 0.4 + 0.8 * v, lf1: 0.4 + 1.0 * v, lb1: 0.2 + 1.0 * v, lf2: -0.9 * v, lb2: -0.9 * v };   // 叩きつけ直前: くの字
}
function poseFor(f) {
  if (!M) return ['guard'];
  if (M.over && M.over.winner === f) return ['power'];
  if (f.mode === 'down' || f.lieN > 0.75) return ['down'];
  if (f.getupT > 0) return ['getup', 18];
  if (f.lieN > 0.5) return ['down'];
  if (M.pin && M.pin.a === f) return ['pinTop'];
  if (M.act && (M.act.a === f || M.act.d === f)) {
    const A = M.act, k = A.motionKind;
    if (A.d === f && (k === '投' || k === '奥') && A.t >= A.intro && !A.hit) return [A.throwStyle === 'piledriver' ? 'tucked' : 'held', 24, flexOf(A)];   // 持ち上げられた体がしなる
    return [actPose(A, f), 22];
  }
  if (M.lock && (M.lock.a === f || M.lock.d === f)) { const v = Math.sin(M.lock.t * 15 + (M.lock.a === f ? 0 : Math.PI)); return ['clinch', 18, { tr: v * 0.09, rr: v * 0.035, rx: v * 2, af1: v * 0.12, ab1: -v * 0.1 }]; }
  if (f.stun > 0) return ['stagger', 20];
  if (f.mode === 'free') {
    if (f.moving) { const sw = Math.sin(f.walkT || 0); return ['guard', 14, { lf1: sw * 0.5, lb1: -sw * 0.5, ry: -Math.abs(sw) * 3, af1: -sw * 0.15, ab1: sw * 0.12 }]; }
    return ['guard', 10, { ry: Math.sin(titleT * 3 + f.no) * 1.6, af2: Math.sin(titleT * 3 + f.no) * 0.06 }];
  }
  return ['guard'];
}
function stepPoses(dt) {
  if (!M) return;
  for (const f of M.p) { if (f.moving) f.walkT = (f.walkT || 0) + dt * 11; f.walkVisual = f.moving ? 0.12 : Math.max(0, (f.walkVisual || 0) - dt); const [name, rate, extra] = poseFor(f); PUP.step(f, name, dt, rate, extra); f.moving = false; }
}
