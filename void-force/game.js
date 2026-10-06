// VOID FORCE 20 — Rタイプ風 横スクロール弾幕シューティング(+レベルアップ3択のビルド要素)
// 画面は 480x270 のドット絵(#g)+くっきり文字の層(#h)。ゲームの時間は 1/60 秒の固定刻み。
(function () {
  'use strict';
  const W = 480, H = 270, TAU = Math.PI * 2, STAGES_N = 20;
  const $ = id => document.getElementById(id);
  const cv = $('g'), ctx = cv.getContext('2d'), hud = $('h'), hx = hud.getContext('2d'), stageEl = $('stage');
  const hash = location.hash;
  const flag = k => new RegExp('[#,&]' + k + '(=|,|&|$)').test(hash);
  const val = (k, d) => { const m = hash.match(new RegExp('[#,&]' + k + '=([^,&]+)')); return m ? m[1] : d; };
  const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
  const rngOf = seed => { let s = seed >>> 0; return () => { s = (s + 0x6D2B79F5) >>> 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; };
  const rr = Math.random;

  // ---------- 保存・設定 ----------
  const save = { hi: 0, best: 1, diff: 3, mute: false };
  try { Object.assign(save, JSON.parse(localStorage.getItem('voidforce_v1') || '{}')); } catch (e) { }
  const store = () => { try { localStorage.setItem('voidforce_v1', JSON.stringify(save)); } catch (e) { } };
  if (val('diff', null) !== null) save.diff = clamp(+val('diff', 3) | 0, 0, 3);
  // b=弾の数の倍率 / s=弾の速さの倍率 / h=敵の体力
  const DIFFS = [{ name: 'やさしい', b: .55, s: .85, h: .8 }, { name: 'ふつう', b: .8, s: .95, h: 1 }, { name: 'むずい', b: 1, s: 1, h: 1.1 }, { name: '激ムズ', b: 1.3, s: 1.1, h: 1.2 }];
  const DF = () => DIFFS[save.diff];
  Snd.setOn(!save.mute);

  // ---------- 面の名前 ----------
  const STAGE_NAMES = ['GLASS CITADEL', 'NEON HARBOR', 'CRYSTAL CAVERN', 'IRON FOREST', 'SOLAR FLARE', 'DROWNED SKY', 'BONE NEBULA', 'MIRROR STATION', 'LAVA CORE', 'STORM BELT',
    'SILENT SEA', 'CLOCKWORK RING', 'VOID GARDEN', 'RED MERIDIAN', 'ICE LABYRINTH', 'STAR FORGE', 'GHOST FLEET', 'BLACK SUN', 'LAST GATE', 'VOID HEART'];
  const BOSS_NAMES = ['MECH-ARACHNID', 'BIOMECH QUEEN', 'TENTACLE DREADNOUGHT', 'ARMORED SERPENT', 'GIGANTIC BIO-FORTRESS', 'STAR CRUISER X', 'DREADNOUGHT BEHEMOTH', 'PLASMA CARRIER', 'COMMAND STATION', 'DESTROYER X',
    'KRAKEN MECH', 'LEVIATHAN SERPENT', 'SHARK MECH', 'JELLYFISH TITAN', 'CRAB BOSS', 'IRON ARACHNID', 'QUEEN REBORN', 'ECLIPSE OCTA', 'BIO-FORTRESS MK2', 'VOID HEART'];
  const hueOf = n => (n * 37 + 200) % 360;
  // 20面の定義: 地形 M=要塞 O=生体洞窟 A=小惑星 / ボスの仮の形(bosses.js)。参考: 20面構成案.md
  const STAGE_DEF = [
    ['M', 'octa'], ['O', 'insect'], ['A', 'squid'], ['M', 'serpent'], ['O', 'fortress'], ['M', 'cruiser'], ['A', 'cruiser'], ['M', 'carrier'], ['M', 'ring'], ['O', 'destroyer'],
    ['O', 'squid'], ['O', 'serpent'], ['A', 'shark'], ['O', 'jelly'], ['A', 'crab'], ['M', 'spider'], ['O', 'insect'], ['A', 'octa'], ['M', 'fortress'], ['O', 'octa'],
  ].map(a => ({ terr: a[0], arch: a[1] }));
  const BOSS_R = { octa: 34, spider: 30, insect: 28, squid: 28, serpent: 24, fortress: 36, cruiser: 30, carrier: 30, ring: 32, shark: 28, jelly: 28, crab: 28, destroyer: 28 };

  // ---------- スキル ----------
  const SK = {
    shot: { n: 'メインショット', ic: '◆', c: '#6fd0ff', d: L => '弾が' + [1, 2, 2, 3, 3][L - 1] + '列・威力x' + [1, 1, 1.3, 1.3, 1.7][L - 1] },
    spread: { n: '拡散弾', ic: '▲', c: '#ff7ab0', d: L => 'ななめに' + [2, 2, 4, 4, 6][L - 1] + '発' },
    homing: { n: '誘導ミサイル', ic: '●', c: '#ffb050', d: L => L + '発ずつ・敵を追う' },
    pierce: { n: '貫通', ic: '■', c: '#8aff9a', d: L => L >= 5 ? '弾がぜんぶ貫通' : '弾が' + L + '体まで貫通' },
    bit: { n: 'ビット', ic: '✦', c: '#7dffb0', d: L => '付き添う砲台が' + [1, 2, 2, 3, 4][L - 1] + '機' },
    force: { n: 'フォース強化', ic: '◈', c: '#ffd84a', d: L => '大きさ・体当たり・ビームが強くなる(Lv' + L + ')' },
    absorb: { n: '弾の吸収', ic: '◎', c: '#c8a0ff', d: L => 'フォースが消した弾→経験値+波動チャージ(Lv' + L + ')' },
    wave: { n: '波動砲', ic: '≋', c: '#ffe070', d: L => 'ため時間が短く・威力アップ(Lv' + L + ')' },
    magnet: { n: '磁力', ic: '✚', c: '#80f0ff', d: L => '経験値を遠くから吸う(Lv' + L + ')' },
    guard: { n: 'ガード', ic: '⬡', c: '#ffffff', d: L => '面ごとに' + (L >= 3 ? 2 : 1) + '回、被弾を無効' + (L >= 5 ? '(ミスのたび回復)' : '') },
    speed: { n: '機動力', ic: '➤', c: '#ff9a70', d: L => '移動が速く、低速時の当たりが小さい(Lv' + L + ')' },
  };
  const SK_KEYS = Object.keys(SK);
  // ---------- ルート(ドロップ品): 一時的な強化。ノーマル6秒・レア8秒・エピック10秒・レジェンド12秒 ----------
  const FX = {
    rate: { n: '連射', ic: '≫', c: '#6fd0ff', m: [1.4, 1.6, 1.8, 2.1] },
    dmg: { n: '威力', ic: '✹', c: '#ff9a70', m: [1.3, 1.5, 1.7, 2] },
    pierce: { n: '貫通', ic: '■', c: '#8aff9a' },
    spread: { n: '拡散', ic: '▲', c: '#ff7ab0' },
    homing: { n: '誘導', ic: '●', c: '#ffb050' },
    magnet: { n: '吸引', ic: '✚', c: '#80f0ff' },
    xp: { n: '経験値x2', ic: '★', c: '#ffe070' },
    charge: { n: '急速チャージ', ic: '≋', c: '#ffe070' },
    forceBig: { n: '巨大フォース', ic: '◈', c: '#ffd84a' },
    slow: { n: '弾スロー', ic: '◷', c: '#c8a0ff' },
    bits: { n: 'ビット+2', ic: '✦', c: '#7dffb0' },
    ghost: { n: 'ゴースト', ic: '☆', c: '#ffffff', minRar: 2 },
  };
  const FX_KEYS = Object.keys(FX);
  const RAR = [{ n: 'NORMAL', c: '#e8e8e8', t: 6, k: 1, w: .58 }, { n: 'RARE', c: '#5ab4ff', t: 8, k: 1, w: .28 }, { n: 'EPIC', c: '#c070ff', t: 10, k: 2, w: .11 }, { n: 'LEGEND', c: '#ffc040', t: 12, k: 3, w: .03 }];
  const DR = [];
  const lvOf = k => (R && R.skills[k]) || 0;

  // ---------- 状態 ----------
  let state = 'title', R = null, S = null, P = null, IN = null;
  const EB = [], PB = [], EN = [], GM = [], PT = [], BEAM = [];
  let time = 0, shake = 0, banner = null, bossB = null, selStage = 1, menuSel = 0;
  const keys = {}, touch = { sx: 0, sy: 0, on: false, wave: false, slow: false, force: false }, edge = { force: false, ok: false, pause: false, left: false, right: false, up: false, down: false, num: 0 };
  const stars = []; { const r = rngOf(5); for (let i = 0; i < 90; i++) stars.push({ x: r() * W, y: r() * H, z: 1 + Math.floor(r() * 3), c: r() }); }

  function newRun(stage) {
    R = { stage, score: 0, lives: 3, lv: 1, xp: 0, skills: { shot: 1 }, kills: 0, graze: 0, pending: 0, picks: [], t0: performance.now(), bossKills: 0, continues: 0 };
  }
  const needXp = lv => 6 + 5 * lv + lv * lv * .35;

  // ---------- 地形 ----------
  function buildTerrain(n) {
    const r = rngOf(n * 313 + 9), N = 620, top = new Float32Array(N), bot = new Float32Array(N);
    const amp = Math.min(46, 14 + n * 2.5), f1 = .05 + r() * .04, f2 = .13 + r() * .06, p1 = r() * 6, p2 = r() * 6, p3 = r() * 6, p4 = r() * 6;
    for (let i = 0; i < N; i++) {
      top[i] = 8 + amp * (.5 + .3 * Math.sin(i * f1 + p1) + .2 * Math.sin(i * f2 + p2));
      bot[i] = 8 + amp * (.5 + .3 * Math.sin(i * f1 * .8 + p3) + .2 * Math.sin(i * f2 * 1.1 + p4));
      if (n >= 2 && (i % 53) > 46 && i > 30) { if ((i / 53 | 0) % 2) top[i] += 34 + n; else bot[i] += 34 + n; }
      if (i < 12) top[i] = bot[i] = 6;
    }
    return { top, bot };
  }
  const col8 = x => Math.floor((S.scroll + x) / 8);
  function colH(i, top) {   // 列 i の地形の高さ(しかけ込み)
    const a = top ? S.ter.top : S.ter.bot; if (i < 0 || i >= a.length) return 8;
    let h = a[i] * S.tf;
    if (S.gim === 'pulse') h *= 1 + .28 * Math.sin(time * 1.4 + i * .13);
    else if (S.gim === 'shutter') for (const s of S.shut) if (i >= s.i0 && i < s.i0 + s.w && s.top === top) h += 58 * (.5 + .5 * Math.sin(time * 1.1 + s.ph));
    return h;
  }
  function topH(x) { return colH(col8(x), true); }
  function botH(x) { return colH(col8(x), false); }

  // ---------- 面の台本(出現のタイミング) ----------
  // 面ごとの台本。pal=その面に出る敵 / set=時間つきの見せ場 / gim=地形のしかけ(pulse=脈打つ, shutter=閉じるシャッター)
  const RECIPES = {
    2: { pal: ['drone', 'swoop', 'mine', 'splitter'], set: [[26, 'worm'], [44, 'carrier']], gim: 'pulse' },
    3: { pal: ['rock', 'drone', 'sniper', 'swoop'], set: [[22, 'rockstorm'], [46, 'carrier']] },
    4: { pal: ['drone', 'turret', 'sniper', 'ringer'], set: [[22, 'spinner'], [40, 'spinner2'], [54, 'carrier']], gim: 'shutter' },
    5: { pal: ['swoop', 'mine', 'splitter', 'spinner'], set: [[20, 'worm'], [38, 'worm'], [54, 'carrier']], gim: 'pulse' },
    6: { pal: ['drone', 'sniper', 'turret', 'spinner'], set: [[30, 'carrier'], [48, 'spinner2']], gim: 'shutter' },
    7: { pal: ['rock', 'sniper', 'splitter', 'ringer'], set: [[20, 'rockstorm'], [40, 'rockstorm'], [56, 'carrier']] },
    8: { pal: ['swoop', 'turret', 'ringer', 'splitter'], set: [[24, 'carrier'], [50, 'carrier']], gim: 'shutter' },
    9: { pal: ['spinner', 'sniper', 'drone', 'ringer'], set: [[22, 'spinner2'], [40, 'carrier']], gim: 'shutter' },
    10: { pal: ['mine', 'splitter', 'swoop', 'ringer'], set: [[18, 'worm'], [32, 'worm'], [50, 'carrier']], gim: 'pulse' },
    11: { pal: ['drone', 'mine', 'spinner', 'sniper'], set: [[20, 'worm'], [38, 'spinner2'], [54, 'carrier']], gim: 'pulse' },
    12: { pal: ['swoop', 'splitter', 'sniper', 'ringer'], set: [[18, 'worm'], [34, 'worm'], [52, 'carrier']], gim: 'pulse' },
    13: { pal: ['rock', 'sniper', 'spinner', 'drone'], set: [[16, 'rockstorm'], [34, 'rockstorm'], [52, 'carrier']] },
    14: { pal: ['mine', 'splitter', 'spinner', 'swoop'], set: [[22, 'worm'], [40, 'spinner2'], [56, 'carrier']], gim: 'pulse' },
    15: { pal: ['rock', 'splitter', 'sniper', 'ringer'], set: [[18, 'rockstorm'], [36, 'rockstorm'], [54, 'carrier']] },
    16: { pal: ['drone', 'sniper', 'turret', 'spinner', 'ringer'], set: [[20, 'spinner2'], [34, 'carrier'], [52, 'carrier']], gim: 'shutter' },
    17: { pal: ['mine', 'splitter', 'swoop', 'spinner', 'sniper'], set: [[16, 'worm'], [30, 'worm'], [44, 'spinner2'], [56, 'carrier']], gim: 'pulse' },
    18: { pal: ['rock', 'sniper', 'spinner', 'splitter', 'ringer'], set: [[14, 'rockstorm'], [30, 'rockstorm'], [46, 'carrier'], [58, 'spinner2']] },
    19: { pal: ['turret', 'sniper', 'spinner', 'ringer', 'splitter'], set: [[18, 'spinner2'], [32, 'carrier'], [46, 'spinner2'], [58, 'carrier']], gim: 'shutter' },
    20: { pal: ['mine', 'splitter', 'spinner', 'sniper', 'ringer', 'rock'], set: [[14, 'worm'], [28, 'rockstorm'], [40, 'spinner2'], [52, 'carrier'], [60, 'worm']], gim: 'pulse' },
  };
  function buildScript2(n) {
    const rc = RECIPES[n], r = rngOf(n * 211 + 5), sc = [], gap = Math.max(2.4, 4.4 - n * .09);
    const near = t => rc.set.some(s => Math.abs(s[0] - t) < 3);
    for (const [t, k] of rc.set) {
      if (k === 'worm') sc.push({ t, k, n: 8 + (n > 10 ? 2 : 0), y: 60 + r() * 150, amp: 40 + r() * 30 });
      else if (k === 'rockstorm') sc.push({ t, k: 'rocks', n: 12 + Math.floor(n / 2), dur: 6 });
      else sc.push({ t, k, y: 50 + r() * 170 });
    }
    let t = 3;
    while (t < 66) {
      if (near(t)) { t += 2; continue; }
      const k = rc.pal[Math.floor(r() * rc.pal.length)], y = 50 + r() * 170;
      switch (k) {
        case 'drone': sc.push({ t, k: 'drones', n: 5 + Math.floor(r() * 3), y, amp: 20 + r() * 40 }); break;
        case 'swoop': sc.push({ t, k: 'swoop', n: 4, top: r() < .5 }); break;
        case 'turret': sc.push({ t, k: 'turrets', n: n > 6 ? 3 : 2 }); break;
        case 'ringer': sc.push({ t, k: 'ringer', y }); break;
        case 'spinner': sc.push({ t, k: 'spinner', y }); break;
        case 'mine': sc.push({ t, k: 'mines', n: 4, y }); break;
        case 'sniper': sc.push({ t, k: 'snipers', n: 2 }); break;
        case 'splitter': sc.push({ t, k: 'splitter', n: 2 }); break;
        case 'rock': sc.push({ t, k: 'rocks', n: 5, dur: 3 }); break;
      }
      t += gap + r() * 1.2;
    }
    sc.sort((a, b) => a.t - b.t);
    return sc;
  }
  function buildScript(n) {
    if (RECIPES[n]) return buildScript2(n);
    const r = rngOf(n * 131 + 7), sc = [];
    let t = 3;
    while (t < 66) {
      const p = r();
      if (p < .3) { sc.push({ t, k: 'drones', n: 5 + Math.floor(r() * 3), y: 50 + r() * 170, amp: 20 + r() * 40 }); t += 4.4; }
      else if (p < .5) { sc.push({ t, k: 'swoop', n: 4, top: r() < .5 }); t += 4; }
      else if (p < .7) { sc.push({ t, k: 'turrets', n: n >= 3 ? 3 : 2 }); t += 5; }
      else if (p < .88) { sc.push({ t, k: 'ringer', y: 50 + r() * 170 }); t += 5; }
      else { sc.push({ t, k: 'drones', n: 6, y: 60 + r() * 150, amp: 40 }); sc.push({ t: t + 1.5, k: 'swoop', n: 3, top: r() < .5 }); t += 5.5; }
    }
    sc.push({ t: 36, k: 'carrier' });
    if (n >= 8) sc.push({ t: 58, k: 'carrier' });
    sc.sort((a, b) => a.t - b.t);
    return sc;
  }

  // ---------- 弾 ----------
  function ebul(x, y, ang, sp, col, sz, o) {
    if (EB.length >= 1900) return null;
    const s = sp * DF().s * (1 + (S.n - 1) * .012), b = { x, y, vx: Math.cos(ang) * s, vy: Math.sin(ang) * s, col: col || 'red', sz: sz | 0, r: [2, 3, 5][sz | 0], t: 0, g: 0, turn: 0 };
    if (o) Object.assign(b, o);
    EB.push(b); return b;
  }
  const DENS = 1.7;   // 弾幕の濃さ(全体の倍率)。検査の自動操縦で調整した
const cn = n => Math.max(1, Math.round(n * DF().b * DENS));
  const aimAt = (x, y) => Math.atan2(P.y - y, P.x - x);
  function fan(x, y, n, spread, sp, col, sz, base) { n = cn(n); const a0 = (base == null ? aimAt(x, y) : base); for (let i = 0; i < n; i++) ebul(x, y, a0 + (n === 1 ? 0 : (i / (n - 1) - .5) * spread), sp, col, sz); }
  function ring(x, y, n, sp, col, sz, off) { n = cn(n); for (let i = 0; i < n; i++) ebul(x, y, off + i * TAU / n, sp, col, sz); }

  // ---------- 敵 ----------
  function enemy(type, x, y, o) {
    const T = {
      drone: { hp: 3, r: 4, sc: 100, xp: 1, spr: SP.drone },
      swoop: { hp: 4, r: 4, sc: 120, xp: 1, spr: SP.swoop },
      turret: { hp: 10, r: 5, sc: 250, xp: 2, spr: SP.turret },
      ringer: { hp: 16, r: 6, sc: 400, xp: 3, spr: SP.ringer },
      carrier: { hp: 90, r: 11, sc: 3000, xp: 14, spr: SP.carrier },
      spinner: { hp: 18, r: 7, sc: 450, xp: 3, spr: SP.spinner },
      seg: { hp: 5, r: 4, sc: 90, xp: 1, spr: SP.seg },
      rock: { hp: 6, r: 4, sc: 60, xp: 1, spr: SP.rockS },
      mine: { hp: 3, r: 4, sc: 80, xp: 1, spr: SP.mine },
      sniper: { hp: 7, r: 5, sc: 200, xp: 2, spr: SP.sniper },
      splitter: { hp: 10, r: 6, sc: 220, xp: 2, spr: SP.splitter },
    }[type];
    if (type === 'rock' && o && o.big) { T.hp = 14; T.r = 7; T.spr = SP.rock; T.xp = 2; }
    const e = Object.assign({ type, x, y, hp: T.hp * (o && o.hpm || 1) * DF().h * (1 + (S.n - 1) * .1), r: T.r, sc: T.sc, xp: T.xp, spr: T.spr, t: 0, fl: 0, cd: 1 + rr() * 1.2, y0: y, ph: rr() * 6 }, o || {});
    EN.push(e); return e;
  }
  function runScript(it) {
    const n = S.n;
    switch (it.k) {
      case 'drones': for (let i = 0; i < it.n; i++) S.later.push({ t: S.time + i * .35, f: () => enemy('drone', W + 10, it.y, { amp: it.amp, vx: -62 })}); break;
      case 'swoop': for (let i = 0; i < it.n; i++) S.later.push({ t: S.time + i * .4, f: () => enemy('swoop', W + 10, it.top ? 30 : H - 30, { dir: it.top ? 1 : -1 }) }); break;
      case 'turrets': for (let i = 0; i < it.n; i++) S.later.push({ t: S.time + i * .9, f: () => { const up = (i + (rr() < .5 ? 1 : 0)) % 2 === 0, x = W + 12, wx = S.scroll + x; const idx = Math.floor(wx / 8); const e = enemy('turret', x, 0, { stick: true, wx, up }); e.y = up ? S.ter.top[idx] * S.tf + 3 : H - S.ter.bot[idx] * S.tf - 3; } }); break;
      case 'ringer': enemy('ringer', W + 12, it.y, { vx: -50, stopX: W - 70 - rr() * 100 }); break;
      case 'carrier': enemy('carrier', W + 20, H / 2, { vx: -30, stopX: W - 90, mid: true }); break;
      case 'spinner': enemy('spinner', W + 12, it.y, { vx: -50, stopX: W - 110 - rr() * 60 }); break;
      case 'spinner2': enemy('spinner', W + 12, 70, { vx: -50, stopX: W - 100 }); enemy('spinner', W + 12, H - 70, { vx: -50, stopX: W - 150, rot: -1 }); break;
      case 'worm': for (let i = 0; i < it.n; i++) S.later.push({ t: S.time + i * .22, f: () => enemy('seg', W + 10, it.y, { amp: it.amp, vx: -75 }) }); break;
      case 'rocks': for (let i = 0; i < it.n; i++) S.later.push({ t: S.time + i * (it.dur || 3) / it.n, f: () => enemy('rock', W + 14, 20 + rr() * (H - 40), { vx: -(35 + rr() * 40), vy: (rr() - .5) * 14, big: rr() < .35 }) }); break;
      case 'mines': for (let i = 0; i < it.n; i++) enemy('mine', W + 10 + i * 30, clamp(it.y + (i - 1.5) * 34, 24, H - 24), { vx: -42 }); break;
      case 'snipers': for (let i = 0; i < it.n; i++) S.later.push({ t: S.time + i * 1.2, f: () => enemy('sniper', W + 10, 40 + rr() * (H - 80), { vx: -90, stopX: W - 60 - rr() * 120 }) }); break;
      case 'splitter': for (let i = 0; i < it.n; i++) S.later.push({ t: S.time + i * 1.0, f: () => enemy('splitter', W + 10, 60 + rr() * 150, { vx: -52, amp: 30 }) }); break;
    }
  }
  function updEnemy(e, dt) {
    e.t += dt; e.cd -= dt; if (e.fl > 0) e.fl--;
    const n = S.n;
    switch (e.type) {
      case 'drone':
        e.x += (e.vx || -60) * dt; e.y = e.y0 + (e.amp || 30) * Math.sin(e.t * 2.2 + e.ph);
        if (e.cd <= 0 && e.x < W - 30 && e.x > 80) { e.cd = 1.8 + rr() * 1.2; fan(e.x, e.y, n >= 3 ? 3 : 1, .5, 70, 'orange', 0); }
        break;
      case 'swoop':
        e.x -= 78 * dt; e.y = e.y0 + e.dir * (e.t < 1.6 ? 0 : (e.t - 1.6) * 0) + e.dir * 74 * (1 - Math.cos(Math.min(e.t, 3.1) * 1.0)) * .9;
        if (e.cd <= 0 && e.x < W - 20) { e.cd = 1.6 + rr(); fan(e.x, e.y, 3, .6, 75, 'yellow', 0); }
        break;
      case 'turret': e.x = e.wx - S.scroll; { const ci = Math.floor((S.scroll + e.x) / 8); e.y = e.up ? colH(ci, true) + 3 : H - colH(ci, false) - 3; } if (e.cd <= 0 && e.x < W - 10 && e.x > 40) { e.cd = 2 + rr() * .8; fan(e.x, e.y + (e.up ? 4 : -4), 5, .9, 66, 'green', 1); } break;
      case 'ringer':
        if (e.x > e.stopX) e.x += e.vx * dt; else e.x -= 6 * dt; e.y = e.y0 + 14 * Math.sin(e.t * 1.2);
        if (e.cd <= 0 && e.x < W - 20) { e.cd = 1.3; ring(e.x, e.y, 10, 56, 'pink', 1, e.t * .7); if (n >= 4) fan(e.x, e.y, 3, .4, 80, 'red', 0); }
        break;
      case 'spinner':
        if (e.x > e.stopX) e.x += e.vx * dt;
        else { e.hold = (e.hold || 0) + dt; if (e.hold < 5.5) { e.cd2 = (e.cd2 || 0) - dt; if (e.cd2 <= 0) { e.cd2 = .09 / (DF().b * 1.2); e.a = (e.a || 0) + .33 * (e.rot || 1); ebul(e.x, e.y, e.a, 52, 'violet', 0); ebul(e.x, e.y, e.a + Math.PI, 52, 'pink', 0); if (n >= 6) ebul(e.x, e.y, e.a + 1.57, 50, 'cyan', 0); } } else e.x -= 60 * dt; }
        break;
      case 'seg':
        e.x += e.vx * dt; e.y = e.y0 + (e.amp || 40) * Math.sin(e.t * 2.6);
        if (e.cd <= 0) { e.cd = 3 + rr() * 3; if (e.x < W - 20) fan(e.x, e.y, 1, 0, 70, 'green', 0); }
        break;
      case 'rock': e.x += e.vx * dt; e.y += e.vy * dt; if (e.y < 12 || e.y > H - 12) e.vy = -e.vy; break;
      case 'mine':
        e.x += e.vx * dt; if (!e.arm && Math.hypot(P.x - e.x, P.y - e.y) < 46) e.arm = .55;
        if (e.arm) { e.arm -= dt; e.fl = ((e.arm * 14) | 0) % 2; if (e.arm <= 0) { ring(e.x, e.y, 10, 50, 'red', 1, 0); boom(e.x, e.y, 10, 1); e.dead = 1; Snd.se('kill'); } }
        break;
      case 'sniper':
        if (e.x > e.stopX) e.x += e.vx * dt; else e.y += clamp(P.y - e.y, -1, 1) * 16 * dt;
        if (e.cd < .7 && !e.tele) { e.tele = true; e.ang = aimAt(e.x, e.y); }
        if (e.cd <= 0) { e.cd = 2.6; e.tele = false; if (e.x < W - 10) fan(e.x, e.y, 3, .14, 130, 'yellow', 1, e.ang); }
        break;
      case 'splitter':
        e.x -= 52 * dt; e.y = e.y0 + (e.amp || 30) * Math.sin(e.t * 2);
        if (e.cd <= 0) { e.cd = 2.4 + rr(); if (e.x < W - 20) fan(e.x, e.y, 1, 0, 70, 'orange', 0); }
        break;
      case 'carrier':
        if (e.x > e.stopX) e.x += e.vx * dt; e.y = H / 2 + 60 * Math.sin(e.t * .7);
        if (e.cd <= 0 && e.x <= e.stopX + 4) { e.cd = .09; e.sp = (e.sp || 0) + .35; ebul(e.x - 8, e.y, e.sp, 62, 'cyan', 0); ebul(e.x - 8, e.y, e.sp + Math.PI, 62, 'cyan', 0); if (cn(1) > 1) ebul(e.x - 8, e.y, e.sp + 1.57, 60, 'violet', 0); }
        if (e.x <= e.stopX + 4 && e.t % 4 < dt) S.later.push({ t: S.time + .1, f: () => enemy('drone', e.x - 12, e.y, { amp: 20, vx: -80 }) });
        break;
    }
    if (e.x < -30 || e.y < -30 || e.y > H + 30 || (e.type === 'ringer' && e.t > 12)) e.dead = 1;
  }
  function killEnemy(e) {
    e.dead = 1; R.kills++; R.score += e.sc;
    boom(e.x, e.y, e.type === 'carrier' ? 40 : 10, e.type === 'carrier' ? 2 : 1);
    for (let i = 0, n = Math.ceil(e.xp); i < n; i++) GM.push({ x: e.x + (rr() - .5) * 8, y: e.y + (rr() - .5) * 8, vx: -20 + rr() * 30, vy: (rr() - .5) * 40, v: 1 });
    Snd.se(e.type === 'carrier' ? 'big' : 'kill'); if (e.type === 'carrier') shake = 12;
    if (e.type === 'splitter') for (let k = 0; k < 3; k++) enemy('drone', e.x, e.y + (k - 1) * 9, { y0: e.y + (k - 1) * 12, amp: 14, vx: -75 - k * 12, hpm: .6 });
    if (e.type === 'rock' && e.big) for (let k = 0; k < 2; k++) enemy('rock', e.x, e.y + (k ? 6 : -6), { vx: e.vx - 10, vy: (k ? 22 : -22) });
    if (e.type === 'mine') ring(e.x, e.y, 10, 50, 'red', 1, 0);
    const ch = { drone: .05, swoop: .05, turret: .14, ringer: .32, carrier: 2, spinner: .3, seg: .02, rock: .03, mine: .05, sniper: .12, splitter: .1 }[e.type] || 0, boost = e.type === 'carrier' ? .12 : e.type === 'ringer' ? .05 : 0;
    for (let i = 0; i < Math.floor(ch) + (rr() < ch % 1 ? 1 : 0); i++) rollLoot(e.x + i * 8, e.y + (i % 2 ? 8 : -8), boost);
  }
  function hurt(e, d) { e.hp -= d; e.fl = 3; if (e.hp <= 0 && !e.dead) killEnemy(e); }

  // ---------- 粒 ----------
  function boom(x, y, n, k) {
    const cs = ['#ffffff', '#fff0a0', '#ffb030', '#ff6020', '#a02010'];
    for (let i = 0; i < n && PT.length < 400; i++) { const a = rr() * TAU, s = (20 + rr() * 90) * (k || 1); PT.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, l: .3 + rr() * .5, m: .8, c: cs[Math.floor(rr() * cs.length)], s: rr() < .3 ? 2 : 1 }); }
  }

  // ---------- ボス ----------
  function bossPlan(n) {
    const r = rngOf(n * 977 + 3), d = Math.min(1, (n - 1) / 19), sp = .95 + d * .5, cols = ['red', 'orange', 'pink', 'cyan', 'yellow', 'violet', 'green'];
    const C = () => cols[Math.floor(r() * cols.length)];
    const lib = [
      () => ({ t: 'spiral', arms: 2 + Math.floor(r() * 2 + d * 3), rate: 12 + d * 8, rot: .13 + r() * .08, sp: 54 * sp, col: C(), sz: 0 }),
      () => ({ t: 'ring', n: 14 + Math.floor(r() * 6 + d * 12), every: 1 - d * .3, sp: 46 * sp, col: C(), sz: 1 }),
      () => ({ t: 'fan', n: 3 + Math.floor(r() * 2 + d * 4), spread: .8 + r() * .4, every: .9 - d * .25, sp: 78 * sp, col: C(), sz: 0 }),
      () => ({ t: 'wall', every: 2.2 - d * .5, sp: 48 * sp, gap: 52 - d * 12, col: C() }),
      () => ({ t: 'petal', n: 10 + Math.floor(d * 10), every: 2.4 - d * .5, sp: 70 * sp, col: C() }),
      () => ({ t: 'sweep', rate: 14 + d * 10, sp: 66 * sp, col: C(), w: .8 }),
    ];
    const pick = (cnt, ban) => { const out = [], used = new Set(ban || []); while (out.length < cnt) { const i = Math.floor(r() * lib.length); if (used.has(i)) continue; used.add(i); out.push(lib[i]()); } return out; };
    const p1 = pick(2), p2 = pick(2 + (n >= 4 ? 1 : 0)), p3 = pick(3 + (n >= 8 ? 1 : 0));
    const plan = [p1, p2, p3], arch = STAGE_DEF[n - 1].arch;
    const SPX = { spider: [['dash', 1]], insect: [['summon:drone', 1]], squid: [['rain', 1], ['summon:mine', 2]], serpent: [['dash', 1]], fortress: [['laser', 1], ['hatch']], cruiser: [['laser', 0], ['hatch']], carrier: [['summon:splitter', 1], ['hatch']], ring: [['rain', 1], ['hatch']], shark: [['dash', 1]], jelly: [['summon:drone', 1], ['rain', 2]], crab: [['dash', 1], ['laser', 2]], destroyer: [['dash', 1], ['laser', 2]], octa: [['laser', 2]] }[arch] || [];
    if (n > 1) for (const [kind, minPh] of SPX) {
      if (kind === 'hatch') { plan.hatch = true; continue; }
      const parts = kind.split(':'), mk = { dash: () => ({ t: 'dash', every: 7 - d * 2 }), summon: () => ({ t: 'summon', k: parts[1], n: 3, every: 6 - d * 1.5 }), rain: () => ({ t: 'rain', every: .11, sp: 62 * sp, col: C() }), laser: () => ({ t: 'laser', every: 5.5 - d * 1.5 }) }[parts[0]];
      for (let ph = minPh; ph < 3; ph++) plan[ph].push(mk());
    }
    return plan;
  }
  function startBoss() {
    const n = S.n, plan0 = bossPlan(n), hp = (760 + 85 * (n - 1)) * (DF().h * .9 + .1) * (plan0.hatch ? .7 : 1);
    bossB = { x: W + 70, y: H / 2, hp, max: hp, phase: 0, t: 0, fl: 0, a: 0, r: 34, plan: plan0, dash: { s: 'idle', t: 0 }, timers: [], enter: true, brk: 0, name: BOSS_NAMES[n - 1], arch: STAGE_DEF[n - 1].arch };
    bossB.r = BOSS_R[bossB.arch] || 32;
    S.boss = true; S.warn = 3; S.gim = null;
    Snd.se('warn'); Snd.bgm(n + 100, true);
  }
  function bossPhaseStart(b) {
    b.timers = b.plan[b.phase].map(() => ({ c: 0, a: 0 })); b.brk = 1.4; b.dash = { s: 'idle', t: 0 }; b.x = Math.max(b.x, W - 74);
    // 区切り: 画面の弾を経験値の宝石に変える(ごほうび)
    for (const e of EB) { if (GM.length < 300 && rr() < .35) GM.push({ x: e.x, y: e.y, vx: -10, vy: 0, v: 1 }); }
    EB.length = 0;
    if (b.phase > 0) { rollLoot(b.x - 30, b.y - 20, .1); rollLoot(b.x - 30, b.y + 20, .1); }
  }
  function updBoss(b, dt) {
    b.t += dt; if (b.fl > 0) b.fl--; if (b.flcd > 0) b.flcd -= dt;
    if (b.enter) { b.x -= 48 * dt; if (b.x <= W - 74) { b.enter = false; b.t = 0; bossPhaseStart(b); } return; }
    const cfgs = b.plan[b.phase], D = b.dash;
    if (b.brk > 0) { b.brk -= dt; b.x = W - 74 + Math.sin(b.t * .35) * 8; b.y = H / 2 + Math.sin(b.t * (.45 + .12 * b.phase)) * 62; return; }
    const dc = cfgs.find(c => c.t === 'dash');
    if (dc && P.dead <= 0) {   // 突進: 予告線(0.9秒)→まっすぐ突っ込む→戻る
      const tm = b.timers[cfgs.indexOf(dc)];
      if (D.s === 'idle') { tm.c += dt; if (tm.c >= dc.every) { D.s = 'warn'; D.t = .9; D.y = P.y; Snd.se('warn'); } }
      else if (D.s === 'warn') { D.t -= dt; b.y += (D.y - b.y) * Math.min(1, dt * 6); if (D.t <= 0) D.s = 'go'; }
      else if (D.s === 'go') { b.x -= 270 * dt; if (b.x < 50) D.s = 'back'; }
      else if (D.s === 'back') { b.x += 130 * dt; if (b.x >= W - 74) { b.x = W - 74; D.s = 'idle'; tm.c = 0; } }
    }
    const busy = D.s !== 'idle';
    if (!busy) { b.x = W - 74 + Math.sin(b.t * .35) * 8; b.y = H / 2 + Math.sin(b.t * (.45 + .12 * b.phase)) * 62; }
    for (let i = 0; i < cfgs.length; i++) {
      const c = cfgs[i], tm = b.timers[i]; if (busy && c.t !== 'dash') continue; tm.c += c.t === 'dash' ? 0 : dt;
      switch (c.t) {
        case 'laser': if (tm.c >= c.every) { tm.c = 0; S.elaser.push({ y: P.y, h: 12, w: .9, f: .45, x: b.x - 10, t: 0 }); } break;
        case 'summon': if (tm.c >= c.every) { tm.c = 0; if (EN.length < 14) for (let k = 0; k < c.n; k++) enemy(c.k, b.x - 24, b.y + (k - (c.n - 1) / 2) * 20, c.k === 'drone' ? { amp: 18, vx: -85 } : c.k === 'mine' ? { vx: -46 } : { vx: -60, amp: 20 }); } break;
        case 'rain': { const step = c.every / (DF().b * 1.1); while (tm.c >= step) { tm.c -= step; const top = rr() < .5; ebul(W * .15 + rr() * W * .85, top ? -4 : H + 4, top ? Math.PI / 2 : -Math.PI / 2, c.sp, c.col, 0); } break; }
        case 'spiral': { const step = 1 / (c.rate * DF().b * 1.2); while (tm.c >= step) { tm.c -= step; tm.a += c.rot; for (let k = 0; k < c.arms; k++) ebul(b.x - 20, b.y, tm.a + k * TAU / c.arms + Math.PI, c.sp, c.col, c.sz); } break; }
        case 'ring': if (tm.c >= c.every) { tm.c = 0; tm.a += .3; ring(b.x - 20, b.y, c.n, c.sp, c.col, c.sz, tm.a); } break;
        case 'fan': if (tm.c >= c.every) { tm.c = 0; fan(b.x - 20, b.y, c.n, c.spread, c.sp, c.col, c.sz); } break;
        case 'wall': if (tm.c >= c.every) { tm.c = 0; tm.a += 1; const gy = H / 2 + Math.sin(tm.a * 1.3) * (H / 2 - 50); for (let y = 16; y < H - 10; y += 11) { if (Math.abs(y - gy) < c.gap / 2) continue; ebul(W + 4, y, Math.PI, c.sp, c.col, 0); } } break;
        case 'petal': if (tm.c >= c.every) { tm.c = 0; const n = cn(c.n), off = rr() * TAU; for (let k = 0; k < n; k++) ebul(b.x - 20, b.y, off + k * TAU / n, 90, c.col, 1, { dec: 110, turn: 1.1, tsp: c.sp * 1.1 }); } break;
        case 'sweep': { const step = 1 / (c.rate * DF().b * 1.2); while (tm.c >= step) { tm.c -= step; const a = Math.PI + Math.sin(b.t * 1.1) * c.w; ebul(b.x - 20, b.y, a, c.sp, c.col, 0); if (cn(1) > 1) ebul(b.x - 20, b.y, a + .12, c.sp, c.col, 0); } break; }
      }
    }
  }
  function hurtBoss(d) {
    const b = bossB; if (!b || b.enter || b.brk > 0.7 || b.dead) return;
    if (b.plan.hatch && b.t % 8 > 3.5) d *= .3;   // 装甲: コアが開いている間だけ本来のダメージ
    b.hp -= d; if (!(b.flcd > 0)) { b.fl = 2; b.flcd = .2; } R.score += 2;
    const ratio = b.hp / b.max, want = ratio <= .33 ? 2 : ratio <= .66 ? 1 : 0;
    if (b.hp <= 0) { b.dead = 1; b.dying = 2.2; for (const e of EB) if (GM.length < 400) GM.push({ x: e.x, y: e.y, vx: -10, vy: 0, v: 1 }); EB.length = 0; Snd.se('big'); shake = 14; return; }
    if (want > b.phase) { b.phase = want; bossPhaseStart(b); Snd.se('big'); shake = 8; }
  }

  // ---------- 面の開始・終了 ----------
  function startStage(n, retry) {
    DR.length = 0; R.stage = n; if (!retry) R.snap = { skills: Object.assign({}, R.skills), lv: R.lv, xp: R.xp, score: R.score, lives: R.lives }; EB.length = PB.length = EN.length = GM.length = PT.length = BEAM.length = 0; bossB = null;
    S = { n, time: 0, scroll: 0, ter: buildTerrain(n), tf: 1, script: buildScript(n), si: 0, later: [], boss: false, warn: 0, guard: guardMax(), buffs: {}, elaser: [], gim: (RECIPES[n] || {}).gim || null, shut: [], cleared: 0, fire: 0, mfire: 0, bitA: 0, hits: 0, spawnT: 0 };
    if (S.gim === 'shutter') { const rs = rngOf(n * 17); for (let i0 = 36, k = 0; i0 < 560; i0 += 30 + Math.floor(rs() * 12), k++) S.shut.push({ i0, w: 3, top: k % 2 === 0, ph: rs() * 6 }); }
    P = { x: 56, y: H / 2, inv: 1.5, dead: 0, charge: 0, F: { mode: 'front', x: 72, y: H / 2, vx: 0, vy: 0, cd: 0 }, bitCd: 0, anim: 0 };
    banner = { t: 2.6, a: 'STAGE ' + n, b: STAGE_NAMES[n - 1] };
    state = 'play'; Snd.bgm(n, false);
    if (flag('boss')) { S.time = 66; S.scroll = 66 * 40; }
  }
  const guardMax = () => { const L = lvOf('guard'); return L >= 3 ? 2 : L >= 1 ? 1 : 0; };
  function retryStage() {   // この面の最初から(スキル・経験値は面の開始時に戻る。残機は2〜3)
    const s = R.snap; R.skills = Object.assign({}, s.skills); R.lv = s.lv; R.xp = s.xp; R.score = s.score; R.lives = Math.max(2, s.lives); R.pending = 0; startStage(R.stage, true);
  }
  const STARTER = ['bit', 'spread', 'homing', 'pierce', 'force', 'absorb', 'wave', 'magnet', 'guard', 'speed'];
  function giveStarter(n) {   // 途中の面から始めるときの標準装備(面が進むほど育っている)
    for (let i = 0; i < (n - 1) * 2 && i < 60; i++) { const k = STARTER[i % STARTER.length]; if ((R.skills[k] || 0) < 5) R.skills[k] = (R.skills[k] || 0) + 1; }
    if (n > 1) R.skills.shot = Math.min(5, 1 + Math.floor(n / 4)); R.lv = n * 2;
  }
  function stageClear() {
    state = 'clear'; S.clearT = 0; Snd.se('clear'); Snd.stop();
    const bonus = 2000 * S.n + 1000 * R.lives; R.score += bonus; S.bonus = bonus;
    if (S.n >= save.best) save.best = Math.min(STAGES_N, S.n + 1); if (R.score > save.hi) save.hi = R.score; store();
  }

  // ---------- 入力 ----------
  const input = {
    stick(x, y, on) { touch.sx = x; touch.sy = y; touch.on = on; },
    press(id) { if (id === 'wave') touch.wave = true; else if (id === 'slow') touch.slow = true; else if (id === 'force') edge.force = true; },
    release(id) { if (id === 'wave') touch.wave = false; else if (id === 'slow') touch.slow = false; },
  };
  const GK = { ArrowLeft: 'left', a: 'left', ArrowRight: 'right', d: 'right', ArrowUp: 'up', w: 'up', ArrowDown: 'down', s: 'down' };
  addEventListener('keydown', e => {
    if (e.repeat) { if (e.key.startsWith('Arrow') || e.key === ' ') e.preventDefault(); return; }
    Snd.init();
    const k = e.key.length === 1 ? e.key.toLowerCase() : e.key; keys[k] = true;
    if (k === ' ' || k.startsWith('Arrow')) e.preventDefault();
    if (k === 'x') edge.force = true;
    if (k === 'p' || k === 'Escape') edge.pause = true;
    if (k === 'm') { save.mute = !save.mute; Snd.setOn(!save.mute); store(); }
    if (k === 'Enter' || k === 'z' || k === ' ') edge.ok = true;
    if (k >= '1' && k <= '3') edge.num = +k;
    if (GK[k]) edge[GK[k]] = true;
  });
  addEventListener('keyup', e => { const k = e.key.length === 1 ? e.key.toLowerCase() : e.key; keys[k] = false; });
  ['touchend', 'click', 'keydown'].forEach(ev => addEventListener(ev, () => Snd.init(), { passive: true }));   // iOS は touchend/click のあとでないと音が出ない
  addEventListener('blur', () => { for (const k in keys) keys[k] = false; if (state === 'play') state = 'paused'; });
  document.addEventListener('visibilitychange', () => { if (document.hidden && state === 'play') { state = 'paused'; menuSel = 0; } });
  function logical(ev) { const r = stageEl.getBoundingClientRect(); return { x: (ev.clientX - r.left) / r.width * W, y: (ev.clientY - r.top) / r.height * H }; }
  addEventListener('pointerdown', ev => {
    Snd.init(); const q = logical(ev);
    if (state === 'title') {
      if (q.y > 140 && q.y < 168 && ((q.x > 120 && q.x < 195) || (q.x > 285 && q.x < 360))) { selStage = clamp(selStage + (q.x < 240 ? -1 : 1), 1, Math.max(1, save.best)); return; }
      if (q.y > 188 && q.y < 206 && ((q.x > 140 && q.x < 205) || (q.x > 275 && q.x < 340))) { save.diff = clamp(save.diff + (q.x < 240 ? -1 : 1), 0, 3); store(); return; }
      if (q.y > 236 && q.x > W - 70) { save.mute = !save.mute; Snd.setOn(!save.mute); store(); return; }
      edge.ok = true; return;
    }
    if (state === 'levelup') { for (let i = 0; i < 3; i++) { const x = 28 + i * 148; if (q.x > x && q.x < x + 136 && q.y > 70 && q.y < 220) { choosePick(i); return; } } return; }
    if (state === 'play' && q.x > W - 26 && q.y < 14) { state = 'paused'; menuSel = 0; return; }
    if (state === 'paused') { const c = Math.floor((q.y - 118) / 24); if (c >= 0 && c < 3) { menuSel = c; edge.num = c + 1; } return; }
    if (state === 'gameover') { if (S.goT > 1) { edge.num = q.x < W / 2 ? 1 : 2; } return; }
    if (state === 'clear' || state === 'ending') edge.ok = true;
  });
  function pad() {
    const gp = (navigator.getGamepads && navigator.getGamepads()) || []; let o = null;
    for (const g of gp) if (g && g.connected) { o = g; break; } if (!o) return null;
    const b = i => o.buttons[i] && o.buttons[i].pressed, ax = (o.axes[0] || 0), ay = (o.axes[1] || 0);
    return { x: Math.abs(ax) > .2 ? ax : (b(15) ? 1 : b(14) ? -1 : 0), y: Math.abs(ay) > .2 ? ay : (b(13) ? 1 : b(12) ? -1 : 0), wave: b(0) || b(7), force: b(1) || b(2), slow: b(4) || b(5) || b(6), ok: b(0) || b(9), start: b(9) };
  }
  let gpPrev = {};
  function readInput() {
    const g = pad(); let dx = 0, dy = 0, wave = false, slow = false;
    if (keys.ArrowLeft || keys.a) dx -= 1; if (keys.ArrowRight || keys.d) dx += 1; if (keys.ArrowUp || keys.w) dy -= 1; if (keys.ArrowDown || keys.s) dy += 1;
    wave = !!(keys.z || keys[' ']); slow = !!keys.Shift;
    if (touch.on) { dx += touch.sx; dy += touch.sy; }
    wave = wave || touch.wave; slow = slow || touch.slow;
    if (g) { dx += g.x; dy += g.y; wave = wave || g.wave; slow = slow || g.slow; if (g.force && !gpPrev.force) edge.force = true; if (g.start && !gpPrev.start) { edge.pause = true; } if (g.ok && !gpPrev.ok) edge.ok = true; gpPrev = g; }
    const l = Math.hypot(dx, dy); if (l > 1) { dx /= l; dy /= l; }
    IN = { dx, dy, wave, slow };
  }
  const clearEdges = () => { edge.force = edge.ok = edge.pause = edge.left = edge.right = edge.up = edge.down = false; edge.num = 0; };

  // ---------- 自動操縦(検査・デモ用: #bot) ----------
  const D9 = [[0, 0], [1, 0], [-1, 0], [0, 1], [0, -1], [.7, .7], [.7, -.7], [-.7, .7], [-.7, -.7]];
  function botInput() {
    if (!P || P.dead) return { dx: 0, dy: 0, wave: false, slow: false };
    // 目標の高さ: いちばん近い敵(いなければボス)
    let ty = H / 2, best = 1e9;
    for (const e of EN) { const d = Math.abs(e.x - P.x) + (e.x < P.x ? 400 : 0); if (d < best) { best = d; ty = e.y; } }
    if (bossB && !bossB.dead) ty = bossB.y;
    const sp = 100; let pick = null, bs = 1e18;
    for (const [dx, dy] of D9) {
      const nx = clamp(P.x + dx * sp * .16, 8, W * .62), ny = clamp(P.y + dy * sp * .16, 12, H - 12);
      let danger = 0;
      for (let i = 0; i < EB.length; i++) {
        const b = EB[i]; if (b.x < P.x - 40 && b.vx < 0) continue;
        for (let k = 1; k <= 3; k++) { const tt = k * .09, bx = b.x + b.vx * tt, by = b.y + b.vy * tt, d = Math.hypot(bx - nx, by - ny) - b.r; if (d < 18) danger += (18 - d) * (18 - d) * (4 - k); }
      }
      if (S) {   // レーザー・突進の予告・体当たりしてくる敵も避ける
        for (const l of S.elaser) if (l.t > l.w - .6 && Math.abs(ny - l.y) < 15 && nx < l.x) danger += 600;
        if (bossB && bossB.dash && bossB.dash.s !== 'idle' && Math.abs(ny - (bossB.dash.s === 'warn' ? bossB.dash.y : bossB.y)) < bossB.r + 12) danger += 500;
        for (const e of EN) for (let k = 1; k <= 3; k++) { const tt = k * .09, ex = e.x + (e.vx || 0) * tt, ey = e.y + (e.vy || 0) * tt, d = Math.hypot(ex - nx, ey - ny) - e.r; if (d < 16) danger += (16 - d) * (16 - d) * (4 - k); }
        if (bossB && !bossB.enter) { const d = Math.hypot(bossB.x - nx, bossB.y - ny) - bossB.r; if (d < 14) danger += (14 - d) * (14 - d) * 3; }
      }
      const dist = Math.abs(ny - ty), edge = (ny < 24 ? (24 - ny) * 3 : 0) + (ny > H - 24 ? (ny - (H - 24)) * 3 : 0) + (nx < 30 ? (30 - nx) * 2 : 0);
      const xAim = Math.abs(nx - 90) * .15;
      const score = danger * 2 + dist * .6 + edge + xAim + (dx === 0 && dy === 0 ? 0 : .5);
      if (score < bs) { bs = score; pick = [dx, dy]; }
    }
    return { dx: pick[0], dy: pick[1], wave: P.charge < 1 && state === 'play' && S && !S.warn, slow: false };
  }

  // ---------- プレイヤー ----------
  const moveSpeed = slow => (slow ? 46 : 98) * (1 + .07 * lvOf('speed'));
  const hitR = slow => slow ? 1.1 : (lvOf('speed') >= 3 ? 1.3 : 1.6);
  function pdmg() { return [1, 1, 1.3, 1.3, 1.7][lvOf('shot') - 1] || 1; }
  function pshot(x, y, vx, vy, dmg, o) { if (PB.length > 500) return; PB.push(Object.assign({ x, y, vx, vy, dmg: dmg * bm('dmg'), pierce: lvOf('pierce') >= 5 || bf('pierce') ? 99 : lvOf('pierce'), life: 1.2, w: 5, h: 2 }, o || {})); }
  function nearestEnemy(x, y, maxd) {
    let b = null, bd = maxd * maxd; for (const e of EN) { const d = (e.x - x) * (e.x - x) + (e.y - y) * (e.y - y); if (d < bd && e.x > -5 && e.x < W + 5) { bd = d; b = e; } }
    if (bossB && !bossB.dead && !bossB.enter) { const d = (bossB.x - x) * (bossB.x - x) + (bossB.y - y) * (bossB.y - y); if (d < bd) b = bossB; }
    return b;
  }
  const forceR = () => (6 + .6 * lvOf('force')) * (bf('forceBig') ? 1.5 : 1);
  const chargeTime = () => ([1.5, 1.25, 1.0, .8, .6, .45][lvOf('wave')] || 1.5) / (bf('charge') ? 3 : 1);
  function updPlayer(dt) {
    const F = P.F;
    if (P.dead > 0) { P.dead -= dt; if (P.dead <= 0) { if (R.lives < 0) { gameOver(); return; } P.dead = 0; P.x = 56; P.y = H / 2; P.inv = 2.5; F.mode = 'front'; F.x = P.x + 16; F.y = P.y; } return; }
    P.anim += dt; if (P.inv > 0) P.inv -= dt;
    const sp = moveSpeed(IN.slow);
    P.x = clamp(P.x + IN.dx * sp * dt, 10, W - 14); P.y = clamp(P.y + IN.dy * sp * dt, 14, H - 12);
    // 地形に押される(当たってもミスにはならない)
    const tH = Math.max(topH(P.x - 8), topH(P.x), topH(P.x + 8)), bH = Math.max(botH(P.x - 8), botH(P.x), botH(P.x + 8));
    P.y = clamp(P.y, tH + 5, H - bH - 5);
    // 自動連射
    S.fire -= dt; if (S.fire <= 0) {
      S.fire = .11 / bm('rate'); const L = lvOf('shot'), n = [1, 2, 2, 3, 3][L - 1], d = pdmg();
      for (let i = 0; i < n; i++) pshot(P.x + 12, P.y + (i - (n - 1) / 2) * 4, 330, 0, d);
      const sp2 = bf('spread') ? Math.min(5, lvOf('spread') + 3) : lvOf('spread'); if (sp2 > 0) { const m = [2, 2, 4, 4, 6][sp2 - 1]; for (let i = 0; i < m; i++) { const a = (i - (m - 1) / 2) * .16 + (i < m / 2 ? -.06 : .06); pshot(P.x + 8, P.y, Math.cos(a) * 300, Math.sin(a) * 300, .55, { w: 3, h: 2 }); } }
      Snd.se('shot');
    }
    const hl = lvOf('homing') + (bf('homing') ? 2 : 0); S.mfire -= dt; if (hl > 0 && S.mfire <= 0) { S.mfire = bf('homing') ? .4 : .7; for (let i = 0; i < hl; i++) pshot(P.x, P.y + (i % 2 ? 6 : -6), 40, (i % 2 ? 90 : -90), 2, { missile: true, w: 4, h: 3, life: 2.2, pierce: 0 }); }
    // ビット
    const nb = ([0, 1, 2, 2, 3, 4][lvOf('bit')] || 0) + (bf('bits') ? 2 : 0); P.bitN = nb; P.bitCd -= dt;
    if (nb > 0 && P.bitCd <= 0) { P.bitCd = .22; for (let i = 0; i < nb; i++) { const q = bitPos(i, nb); pshot(q.x + 4, q.y, 300, 0, .8, { w: 4, h: 2 }); } }
    // 波動砲(ため)
    const ct = chargeTime();
    if (IN.wave) { if (P.charge < 1) { const was = P.charge; P.charge = Math.min(1, P.charge + dt / ct); if (((was * 8) | 0) !== ((P.charge * 8) | 0)) Snd.se('charge'); } P.holding = true; }
    else if (P.holding) { P.holding = false; if (P.charge >= .22) fireWave(P.charge); P.charge = 0; }
    // フォース
    if (edge.force) { edge.force = false; forceToggle(); }
    updForce(dt);
    // ミスと接触
    if (P.inv <= 0) {
      const hr = hitR(IN.slow) * (bf('ghost') ? .5 : 1);
      for (let i = EB.length - 1; i >= 0; i--) {
        const b = EB[i], dx = b.x - P.x, dy = b.y - P.y, d2 = dx * dx + dy * dy, rr2 = hr + b.r * .75;
        if (d2 < rr2 * rr2) { playerHit(); EB.splice(i, 1); break; }
        if (!b.g && d2 < (b.r + 8) * (b.r + 8)) { b.g = 1; R.graze++; R.score += 10; addXp(.12); Snd.se('graze'); }
      }
      if (P.inv <= 0) for (const e of EN) { const d = Math.hypot(e.x - P.x, e.y - P.y); if (d < e.r + hr + 1) { playerHit(); break; } }
      if (P.inv <= 0 && bossB && !bossB.dead && !bossB.enter && Math.hypot(bossB.x - P.x, bossB.y - P.y) < bossB.r - 2) playerHit();
    }
  }
  const bf = k => S && S.buffs && S.buffs[k] && S.buffs[k].t > 0 ? S.buffs[k] : null;
  const bm = k => { const b = bf(k); return b ? (FX[k].m ? FX[k].m[b.r] : 1) : 1; };
  function rollLoot(x, y, boost) {
    let r = rr() - (boost || 0), ri = 0; for (; ri < RAR.length - 1; ri++) { r -= RAR[ri].w; if (r <= 0) break; }
    const pool = FX_KEYS.filter(k => !FX[k].minRar || ri >= FX[k].minRar), fx = [];
    while (fx.length < RAR[ri].k && pool.length) fx.push(pool.splice(Math.floor(rr() * pool.length), 1)[0]);
    DR.push({ x, y, vx: -24 - rr() * 10, vy: (rr() - .5) * 30, ri, fx, t: 0 });
  }
  function pickLoot(d) {
    const R0 = RAR[d.ri];
    for (const k of d.fx) { const o = S.buffs[k]; const keepT = o && o.t > 0 ? o.t : 0, keepR = o && o.t > 0 ? o.r : 0; S.buffs[k] = { t: Math.max(R0.t, keepT), r: Math.max(d.ri, keepR), max: Math.max(R0.t, keepT) }; }
    banner = { t: 2.2, a: R0.n, b: d.fx.map(k => FX[k].n).join(' + ') + '  ' + R0.t + '秒', col: R0.c };
    Snd.se(d.ri >= 2 ? 'level' : 'pick'); R.score += 100 * (d.ri + 1);
  }
  function bitPos(i, n) { const a = P.anim * 2.4 + i * TAU / n; return { x: P.x - 4 + Math.cos(a) * 13, y: P.y + Math.sin(a) * 15 }; }
  function forceToggle() {
    const F = P.F; Snd.se('force');
    if (F.mode === 'front' || F.mode === 'rear') { F.vx = F.mode === 'front' ? 230 : -230; F.vy = 0; F.mode = 'free'; F.t = 0; }
    else if (F.mode === 'free') F.mode = 'recall';
    else F.mode = 'free';
  }
  function updForce(dt) {
    const F = P.F; F.cd -= dt; const fl = lvOf('force');
    if (F.mode === 'front') { F.x += (P.x + 16 - F.x) * Math.min(1, dt * 20); F.y += (P.y - F.y) * Math.min(1, dt * 20); if (F.cd <= 0) { F.cd = .1; pshot(F.x + 6, F.y - 3, 340, 0, .7 + .15 * fl, { w: 5, h: 2 }); pshot(F.x + 6, F.y + 3, 340, 0, .7 + .15 * fl, { w: 5, h: 2 }); } }
    else if (F.mode === 'rear') { F.x += (P.x - 15 - F.x) * Math.min(1, dt * 20); F.y += (P.y - F.y) * Math.min(1, dt * 20); if (F.cd <= 0) { F.cd = .14; pshot(F.x - 6, F.y, -320, 0, .8 + .15 * fl, { w: 5, h: 2 }); pshot(F.x, F.y - 4, -200, -220, .6, { w: 3, h: 3 }); pshot(F.x, F.y + 4, -200, 220, .6, { w: 3, h: 3 }); } }
    else if (F.mode === 'free') {
      F.t = (F.t || 0) + dt; const tx = P.x + 74, ty = P.y;
      F.vx += (tx - F.x) * 5 * dt - F.vx * 2.2 * dt; F.vy += (ty - F.y) * 5 * dt - F.vy * 2.2 * dt; F.x += F.vx * dt; F.y += F.vy * dt; F.x = clamp(F.x, 6, W - 6); F.y = clamp(F.y, 8, H - 8);
      if (F.cd <= 0) { F.cd = .16; const e = nearestEnemy(F.x, F.y, 200); const a = e ? Math.atan2(e.y - F.y, e.x - F.x) : 0; pshot(F.x, F.y, Math.cos(a) * 330, Math.sin(a) * 330, 1 + .2 * fl, { w: 4, h: 3 }); }
    } else if (F.mode === 'recall') {
      const dx = P.x - F.x, dy = P.y - F.y, d = Math.hypot(dx, dy) || 1, s = 260 * dt; F.x += dx / d * Math.min(s, d); F.y += dy / d * Math.min(s, d);
      if (d < 16) { F.mode = F.x >= P.x ? 'front' : 'rear'; Snd.se('force'); }
    }
    // 弾を消す・敵に体当たり
    const r = forceR() + (lvOf('absorb') ? 2 : 0);
    for (let i = EB.length - 1; i >= 0; i--) {
      const b = EB[i], dx = b.x - F.x, dy = b.y - F.y, rr2 = r + b.r * .6; if (dx * dx + dy * dy < rr2 * rr2) {
        EB.splice(i, 1); const L = lvOf('absorb'); if (L) { addXp(.35 * L); P.charge = Math.min(1, P.charge + .006 * L); }
      }
    }
    const cd = (28 + 12 * fl) * dt * (bf('forceBig') ? 2 : 1);
    for (const e of EN) if (Math.hypot(e.x - F.x, e.y - F.y) < e.r + r) hurt(e, cd);
    if (bossB && !bossB.dead && Math.hypot(bossB.x - F.x, bossB.y - F.y) < bossB.r + r) hurtBoss(cd * .8);
  }
  function fireWave(ch) {
    const L = lvOf('wave'), tot = 110 * (.35 + ch) * (1 + .25 * L) * bm('dmg');
    BEAM.push({ t: .35, max: .35, w: 5 + ch * 16, y: P.y, x0: P.x + 12, dps: tot / .35, ch });
    Snd.se('wave'); shake = Math.max(shake, 2 + ch * 3);
  }
  function playerHit() {
    if (P.inv > 0) return;
    if (S.guard > 0) { S.guard--; P.inv = 1.6; for (let i = EB.length - 1; i >= 0; i--) if (Math.hypot(EB[i].x - P.x, EB[i].y - P.y) < 46) EB.splice(i, 1); Snd.se('big'); boom(P.x, P.y, 14, .6); banner = { t: 1.2, a: 'GUARD!', b: '被弾を防いだ' }; return; }
    R.lives--; P.dead = 1.6; boom(P.x, P.y, 36, 1.4); Snd.se('miss'); shake = 10; EB.length = 0;
    if (lvOf('guard') >= 5) S.guard = guardMax();
    const own = Object.keys(R.skills).filter(k => R.skills[k] > (k === 'shot' ? 1 : 0)); if (own.length) { const k = own[Math.floor(rr() * own.length)]; R.skills[k]--; if (R.skills[k] <= 0) delete R.skills[k]; banner = { t: 2, a: 'MISS', b: SK[k].n + ' が1つ下がった' }; }
  }
  function gameOver() { state = 'gameover'; S.goT = 0; menuSel = 0; if (R.score > save.hi) save.hi = R.score; store(); Snd.stop(); }

  // ---------- 経験値とレベルアップ ----------
  function addXp(v) { R.xp += v * (bf('xp') ? 2 : 1); while (R.xp >= needXp(R.lv)) { R.xp -= needXp(R.lv); R.lv++; R.pending++; } }
  function openPick() {
    const pool = []; for (const k of SK_KEYS) { const L = lvOf(k); if (L < 5) pool.push({ k, w: L ? 2 : 1.4 }); }
    const picks = [];
    while (picks.length < 3 && pool.length) { let tw = 0; pool.forEach(p => tw += p.w); let r = rr() * tw, i = 0; for (; i < pool.length; i++) { r -= pool[i].w; if (r <= 0) break; } i = Math.min(i, pool.length - 1); picks.push({ k: pool[i].k }); pool.splice(i, 1); }
    const fill = [{ k: '_life', n: '1UP', ic: '♥', c: '#ff7a9a', d: () => '残機+1(最大5)' }, { k: '_score', n: 'スコア', ic: '★', c: '#ffe070', d: () => '+10,000点' }];
    for (let i = 0; picks.length < 3; i++) picks.push({ k: fill[i % 2].k });
    S.picks = picks; S.sel = 0; state = 'levelup'; S.luT = 0; Snd.se('level');
  }
  function choosePick(i) {
    const p = S.picks[i]; if (!p || S.luT < .25) return;
    if (p.k === '_life') R.lives = Math.min(5, R.lives + 1); else if (p.k === '_score') R.score += 10000;
    else { R.skills[p.k] = lvOf(p.k) + 1; if (p.k === 'guard') S.guard = guardMax(); }
    R.picks.push(p.k); R.pending--; Snd.se('pick'); state = 'play';
    if (R.pending > 0) openPick();
  }

  // ---------- 更新 ----------
  function update(dt) {
    time += dt; if (shake > 0) shake = Math.max(0, shake - dt * 30);
    if (state === 'title') { selStage = clamp(selStage, 1, Math.max(1, save.best)); if (edge.up) selStage = Math.min(save.best, selStage + 1); if (edge.down) selStage = Math.max(1, selStage - 1); if (edge.ok) { edge.ok = false; const n = +val('stage', 0) || selStage; newRun(n); giveStarter(n); startStage(n); Snd.init(); } if (edge.left) save.diff = clamp(save.diff - 1, 0, 3); if (edge.right) save.diff = clamp(save.diff + 1, 0, 3); if (edge.left || edge.right) store(); clearEdges(); return; }
    if (state === 'paused') { if (edge.up) menuSel = (menuSel + 2) % 3; if (edge.down) menuSel = (menuSel + 1) % 3; const c = edge.num ? edge.num - 1 : edge.pause ? 0 : edge.ok ? menuSel : -1; if (c === 0) state = 'play'; else if (c === 1) retryStage(); else if (c === 2) { state = 'title'; Snd.stop(); } clearEdges(); return; }
    if (state === 'levelup') {
      S.luT += dt;
      if (edge.left) S.sel = (S.sel + 2) % 3; if (edge.right) S.sel = (S.sel + 1) % 3; if (edge.num) choosePick(edge.num - 1); else if (edge.ok) choosePick(S.sel);
      if (flag('bot') && S.luT > .5) choosePick(Math.floor(rr() * 3));
      clearEdges(); return;
    }
    if (state === 'clear') { S.clearT += dt; if (edge.ok && S.clearT > 1.2) { if (S.n >= STAGES_N) { state = 'ending'; } else startStage(S.n + 1); } clearEdges(); updFx(dt); return; }
    if (state === 'gameover') { S.goT += dt; if (S.goT > 1) { if (edge.left || edge.right || edge.up || edge.down) menuSel = menuSel ? 0 : 1; const c = edge.num ? edge.num - 1 : edge.ok ? menuSel : -1; if (c === 0) retryStage(); else if (c === 1) { state = 'title'; Snd.stop(); } } clearEdges(); updFx(dt); return; }
    if (state === 'ending') { if (edge.ok) state = 'title'; clearEdges(); return; }
    if (state !== 'play') return;
    if (edge.pause) { state = 'paused'; menuSel = 0; clearEdges(); return; }
    if (flag('bot')) IN = botInput(); else readInput();
    // 台本・スクロール
    if (!S.boss) {
      S.time += dt; S.scroll = S.time * 40;
      while (S.si < S.script.length && S.script[S.si].t <= S.time) runScript(S.script[S.si++]);
      if (S.time >= 68 && !EN.some(e => e.mid)) startBoss();
    } else { S.scroll += (bossB && bossB.dead ? 0 : 20) * dt; S.tf += (.35 - S.tf) * dt * .8; }
    for (let i = S.later.length - 1; i >= 0; i--) if (S.later[i].t <= S.time + (S.boss ? 1e9 : 0)) { S.later[i].f(); S.later.splice(i, 1); }
    if (S.warn > 0) S.warn -= dt;
    updPlayer(dt);
    for (let i = S.elaser.length - 1; i >= 0; i--) {
      const l = S.elaser[i]; l.t += dt; if (bossB && !bossB.dead) l.x = bossB.x - 10;
      if (l.t > l.w + l.f) { S.elaser.splice(i, 1); continue; }
      if (l.t >= l.w) { shake = Math.max(shake, 1.5); if (P.inv <= 0 && P.dead <= 0 && P.x < l.x && Math.abs(P.y - l.y) < l.h / 2 + hitR(IN.slow)) playerHit(); }
    }
    for (const e of EN) updEnemy(e, dt);
    if (bossB) { if (bossB.dead) { bossB.dying -= dt; if (rr() < .5) boom(bossB.x + (rr() - .5) * 60, bossB.y + (rr() - .5) * 60, 8, 1); if (bossB.dying <= 0) { R.bossKills++; R.score += 10000 * S.n; bossB = null; stageClear(); return; } } else if (S.warn <= 0 || bossB.enter) updBoss(bossB, dt); }
    // 自機の弾
    for (let i = PB.length - 1; i >= 0; i--) {
      const b = PB[i]; b.life -= dt;
      if (b.missile) { const t = nearestEnemy(b.x, b.y, 300); if (t) { const a = Math.atan2(t.y - b.y, t.x - b.x), c = Math.atan2(b.vy, b.vx); let d = a - c; while (d > Math.PI) d -= TAU; while (d < -Math.PI) d += TAU; const nc = c + clamp(d, -6 * dt, 6 * dt), s = Math.min(320, Math.hypot(b.vx, b.vy) + 500 * dt); b.vx = Math.cos(nc) * s; b.vy = Math.sin(nc) * s; } else { b.vx += 300 * dt; } }
      b.x += b.vx * dt; b.y += b.vy * dt;
      let gone = b.life <= 0 || b.x > W + 8 || b.x < -8 || b.y < -8 || b.y > H + 8;
      if (!gone) for (const e of EN) { if (e.dead || b.hit === e) continue; if (Math.abs(b.x - e.x) < e.r + b.w / 2 && Math.abs(b.y - e.y) < e.r + 2) { hurt(e, b.dmg); Snd.se('hit'); b.hit = e; if (b.pierce > 0) b.pierce--; else { gone = true; break; } } }
      if (!gone && bossB && !bossB.dead && !bossB.enter && Math.hypot(b.x - bossB.x, b.y - bossB.y) < bossB.r + 2) { hurtBoss(b.dmg); Snd.se('hit'); gone = true; }
      if (gone) PB.splice(i, 1);
    }
    for (let i = EN.length - 1; i >= 0; i--) if (EN[i].dead) EN.splice(i, 1);
    // 波動砲
    for (let i = BEAM.length - 1; i >= 0; i--) {
      const m = BEAM[i]; m.t -= dt; if (m.t <= 0) { BEAM.splice(i, 1); continue; }
      m.x0 = P.x + 12; m.y = P.y;
      for (const e of EN) if (e.x > m.x0 - 4 && Math.abs(e.y - m.y) < m.w / 2 + e.r) hurt(e, m.dps * dt);
      if (bossB && !bossB.dead && !bossB.enter && bossB.x + bossB.r > m.x0 && Math.abs(bossB.y - m.y) < m.w / 2 + bossB.r) hurtBoss(m.dps * dt);
      for (let k = EB.length - 1; k >= 0; k--) { const b = EB[k]; if (b.x > m.x0 && Math.abs(b.y - m.y) < m.w / 2 + b.r) { EB.splice(k, 1); if (GM.length < 400 && rr() < .3) GM.push({ x: b.x, y: b.y, vx: -10, vy: 0, v: 1 }); } }
    }
    // 敵の弾
    const guardT = S.boss ? false : true, bd = bf('slow') ? dt * .55 : dt;
    for (let i = EB.length - 1; i >= 0; i--) {
      const b = EB[i]; b.t += bd;
      if (b.dec) { const s = Math.hypot(b.vx, b.vy); if (s > 6) { const ns = Math.max(0, s - b.dec * bd); b.vx *= ns / s; b.vy *= ns / s; } }
      if (b.turn && b.t >= b.turn) { b.turn = 0; b.dec = 0; const a = aimAt(b.x, b.y); b.vx = Math.cos(a) * b.tsp * DF().s; b.vy = Math.sin(a) * b.tsp * DF().s; }
      b.x += b.vx * bd; b.y += b.vy * bd;
      if (b.x < -12 || b.x > W + 12 || b.y < -12 || b.y > H + 12) { EB.splice(i, 1); continue; }
      if (guardT && b.t > .15 && b.x > 0 && b.x < W) { if (b.y < topH(b.x) || b.y > H - botH(b.x)) EB.splice(i, 1); }
    }
    // 宝石
    const mg = bf('magnet') ? 420 : ([34, 50, 70, 95, 130, 170][lvOf('magnet')] || 34);
    for (let i = GM.length - 1; i >= 0; i--) {
      const g = GM[i]; const dx = P.x - g.x, dy = P.y - g.y, d = Math.hypot(dx, dy);
      if (P.dead <= 0 && d < mg) { const s = 190 * dt; g.x += dx / (d || 1) * s; g.y += dy / (d || 1) * s; } else { g.x += g.vx * dt; g.y += g.vy * dt; g.vx += (-28 - g.vx) * dt * 2; g.vy *= (1 - dt * 2); }
      if (P.dead <= 0 && d < 7) { GM.splice(i, 1); addXp(g.v); R.score += 20; Snd.se('gem'); continue; }
      if (g.x < -10) GM.splice(i, 1);
    }
    for (const k in S.buffs) if (S.buffs[k].t > 0) S.buffs[k].t -= dt;
    for (let i = DR.length - 1; i >= 0; i--) {
      const d = DR[i]; d.t += dt; d.x += d.vx * dt; d.y += d.vy * dt; d.vx += (-22 - d.vx) * dt; d.vy *= (1 - dt * .8);
      if (d.y < 16 || d.y > H - 18) d.vy = -d.vy;
      if (P.dead <= 0 && Math.hypot(d.x - P.x, d.y - P.y) < 12) { pickLoot(d); DR.splice(i, 1); continue; }
      if (d.x < -12) DR.splice(i, 1);
    }
    updFx(dt);
    if (R.pending > 0 && state === 'play' && !(bossB && bossB.dead) && P.dead <= 0) openPick();
    if (banner) { banner.t -= dt; if (banner.t <= 0) banner = null; }
    clearEdges();
  }
  function updFx(dt) { for (let i = PT.length - 1; i >= 0; i--) { const p = PT[i]; p.l -= dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vx *= .96; p.vy *= .96; if (p.l <= 0) PT.splice(i, 1); } }

  // ---------- 描画(ドット) ----------
  const hsl = (h, s, l) => 'hsl(' + h + ',' + s + '%,' + l + '%)';
  function drawSprite(sp, x, y, flip) { const w = sp.width, h = sp.height; ctx.drawImage(sp, Math.round(x - w / 2), Math.round(y - h / 2)); }
  function pxOct(cx, cy, r, col) {
    const c = Math.round(r * .41); ctx.fillStyle = col;
    for (let j = -r; j <= r; j++) { const aj = Math.abs(j), hw = aj <= r - c ? r : r - (aj - (r - c)); ctx.fillRect(Math.round(cx - hw), Math.round(cy + j), hw * 2 + 1, 1); }
  }
  function drawBg() {
    const hue = hueOf(S ? S.n : 1);
    const g = ctx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, hsl(hue, 45, 7)); g.addColorStop(1, hsl(hue + 30, 50, 12)); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    const sc = S ? S.scroll : time * 30;
    for (const s of stars) { const x = ((s.x - sc * .12 * s.z) % W + W) % W; ctx.fillStyle = s.c < .3 ? '#8aa0ff' : s.c < .6 ? '#ffffff' : '#ffd8a0'; ctx.fillRect(x | 0, s.y | 0, s.z > 2 ? 2 : 1, s.z > 2 ? 2 : 1); }
    // 遠景の塊(ドットの雲)
    ctx.fillStyle = hsl(hue, 40, 16);
    for (let i = 0; i < 6; i++) { const x = ((i * 190 - sc * .25) % (W + 200) + W + 200) % (W + 200) - 100; ctx.fillRect(x | 0, 100 + (i * 37) % 70, 70, 6); ctx.fillRect((x + 12) | 0, 94 + (i * 37) % 70, 40, 6); ctx.fillRect((x + 20) | 0, 106 + (i * 37) % 70, 50, 4); }
  }
  function drawTerrain() {
    if (!S) return; const type = STAGE_DEF[S.n - 1].terr, t = S.ter;
    const H0 = type === 'M' ? 220 : type === 'O' ? 285 : 28, SAT = type === 'A' ? 22 : 30;
    for (let sx = -((S.scroll % 8) | 0); sx < W; sx += 8) {
      const i = Math.floor((S.scroll + sx) / 8); if (i < 0 || i >= t.top.length) continue;
      const th = Math.round(colH(i, true)), bh = Math.round(colH(i, false)), pulse = type === 'O' ? Math.sin(time * 2 + i * .5) * 6 : 0;
      ctx.fillStyle = hsl(H0, SAT, 21 + pulse * .3); ctx.fillRect(sx, 0, 8, th); ctx.fillRect(sx, H - bh, 8, bh);
      ctx.fillStyle = hsl(H0, SAT, 30 + pulse * .5); ctx.fillRect(sx, th - 3, 8, 3); ctx.fillRect(sx, H - bh, 8, 3);
      ctx.fillStyle = hsl(H0, SAT + 5, 38); ctx.fillRect(sx, th - 1, 8, 1); ctx.fillRect(sx, H - bh, 8, 1);
      if (type === 'M') {            // 金属板: 継ぎ目・リベット・ランプ
        ctx.fillStyle = hsl(H0, 25, 15); if (i % 4 === 0) { ctx.fillRect(sx, 0, 1, th - 3); ctx.fillRect(sx, H - bh + 3, 1, bh - 3); } if (th > 24) ctx.fillRect(sx, (th / 2) | 0, 8, 1); if (bh > 24) ctx.fillRect(sx, H - ((bh / 2) | 0), 8, 1);
        if (i % 5 === 2) { ctx.fillStyle = hsl(40, 90, 55); ctx.fillRect(sx + 3, Math.max(0, th - 8), 2, 2); ctx.fillRect(sx + 3, H - bh + 6, 2, 2); }
      } else if (type === 'O') {     // 生体: 脈打つ筋・緑のこぶ
        ctx.fillStyle = hsl(320, 40, 28 + pulse); if (i % 3 === 0) { ctx.fillRect(sx + 2, 0, 3, th - 4); ctx.fillRect(sx + 2, H - bh + 4, 3, bh - 4); }
        if (i % 7 === 3) { ctx.fillStyle = hsl(110, 70, 45); ctx.fillRect(sx + 1, th - 1, 6, 3); ctx.fillRect(sx + 1, H - bh - 2, 6, 3); }
      } else {                       // 小惑星: 岩のでこぼこ・影
        ctx.fillStyle = hsl(30, 18, 14); if (i % 3 === 1) { ctx.fillRect(sx + 2, (th * .4) | 0, 4, 3); ctx.fillRect(sx + 3, H - ((bh * .4) | 0), 3, 3); }
        ctx.fillStyle = hsl(30, 20, 36); if (i % 4 === 0) { ctx.fillRect(sx, th - 4, 3, 2); ctx.fillRect(sx + 4, H - bh + 2, 3, 2); }
      }
    }
  }
  function drawBoss(b) {
    const hue = hueOf(S.n);
    if (!SP.draw(ctx, 'boss_' + S.n, b.x, b.y, null, b.fl > 0)) BossArt.draw(ctx, b, b.arch, hue + 300, b.fl > 0);
    if (b.plan.hatch && !b.enter) {   // 装甲: 閉じている間はコアが隠れる
      const open = b.t % 8 <= 3.5, x = Math.round(b.x), y = Math.round(b.y);
      if (!open) { ctx.fillStyle = 'rgba(150,170,230,.55)'; ctx.fillRect(x - 15, y - 15, 30, 30); ctx.strokeStyle = '#cfe0ff'; ctx.strokeRect(x - 14.5, y - 14.5, 29, 29); }
      else { ctx.fillStyle = ((time * 8) | 0) % 2 ? '#ffffff' : '#ffee80'; ctx.fillRect(x - 3, y - 3, 6, 6); }
    }
  }
  function render() {
    ctx.save(); if (shake > 0) ctx.translate(Math.round((rr() - .5) * shake), Math.round((rr() - .5) * shake));
    ctx.imageSmoothingEnabled = false;
    drawBg();
    if (S && state !== 'title') {
      drawTerrain();
      for (const g of GM) ctx.drawImage(SP.gem, Math.round(g.x) - 2, Math.round(g.y) - 2);
      for (const e of EN) SP.draw(ctx, e.type, e.x, e.y, e.spr, e.fl > 0);
      if (bossB) drawBoss(bossB);
      // 自機の弾
      for (const b of PB) { const sp = b.missile ? SP.missile : b.w >= 5 ? SP.pshot : SP.pshotBig; if (b.missile) drawSprite(SP.missile, b.x, b.y); else { ctx.fillStyle = '#ffffff'; ctx.fillRect(Math.round(b.x - b.w / 2), Math.round(b.y) - 1, b.w, 1); ctx.fillStyle = '#6fd0ff'; ctx.fillRect(Math.round(b.x - b.w / 2), Math.round(b.y), b.w, 1); } }
      // 波動砲
      for (const m of BEAM) {
        const k = m.t / m.max, w = Math.max(2, Math.round(m.w * (k > .8 ? 1 : .35 + k * .8))), x0 = Math.round(m.x0), y = Math.round(m.y);
        ctx.fillStyle = '#ffb030'; ctx.fillRect(x0, y - w, W - x0, w * 2); ctx.fillStyle = '#ffe070'; ctx.fillRect(x0, y - (w * .7 | 0), W - x0, ((w * .7) | 0) * 2); ctx.fillStyle = '#ffffff'; ctx.fillRect(x0, y - (w * .35 | 0), W - x0, ((w * .35) | 0) * 2 + 1);
      }
      if (P && P.dead <= 0) {
        // ビット・フォース・自機
        for (let i = 0; i < (P.bitN || 0); i++) { const q = bitPos(i, P.bitN); SP.draw(ctx, 'bit', q.x, q.y, SP.bit); }
        const F = P.F, fr = SP.forceFrames[((P.anim * 8) | 0) % 2]; const rr0 = forceR(), sc = rr0 / 6; const sz = Math.round(fr.width * sc);
        ctx.drawImage(fr, Math.round(F.x - sz / 2), Math.round(F.y - sz / 2), sz, sz);
        if (bf('ghost')) ctx.globalAlpha = .55; if (P.inv <= 0 || ((P.anim * 20) | 0) % 2) SP.draw(ctx, 'player', P.x, P.y, SP.player); ctx.globalAlpha = 1;
        if (P.charge > .05) { const n = Math.round(P.charge * 10); ctx.fillStyle = P.charge >= 1 ? '#ffffff' : '#ffe070'; ctx.fillRect(Math.round(P.x - 9), Math.round(P.y + 8), n * 2, 2); ctx.fillStyle = 'rgba(255,255,255,.3)'; ctx.fillRect(Math.round(P.x - 9) + n * 2, Math.round(P.y + 8), 20 - n * 2, 2); }
        // 当たり判定の点
        ctx.fillStyle = '#ffffff'; ctx.fillRect(Math.round(P.x) - 1, Math.round(P.y) - 1, 3, 3); ctx.fillStyle = '#ff2040'; ctx.fillRect(Math.round(P.x), Math.round(P.y), 1, 1);
        if (S.guard > 0) { ctx.strokeStyle = 'rgba(255,255,255,.5)'; ctx.strokeRect(Math.round(P.x) - 12.5, Math.round(P.y) - 9.5, 24, 18); }
      }
      for (const d of DR) {
        const R0 = RAR[d.ri], bob = Math.round(Math.sin(d.t * 5) * 1.5), x = Math.round(d.x), y = Math.round(d.y) + bob, f = ((d.t * 6) | 0) % 2;
        ctx.fillStyle = R0.c; ctx.globalAlpha = .25 + .15 * f; ctx.fillRect(x - 7, y - 7, 14, 14); ctx.globalAlpha = 1;
        ctx.fillStyle = '#10081c'; ctx.fillRect(x - 5, y - 5, 10, 10); ctx.fillStyle = R0.c; ctx.fillRect(x - 4, y - 4, 8, 8); ctx.fillStyle = '#10081c'; ctx.fillRect(x - 2, y - 2, 4, 4);
        ctx.fillStyle = d.ri >= 3 ? '#ffffff' : R0.c; ctx.fillRect(x - 1, y - 1, 2, 2);
        if (d.ri >= 2) { ctx.fillStyle = '#fff'; const s = ((d.t * 8) | 0) % 4; ctx.fillRect(x - 8 + s * 4, y - 8, 1, 1); ctx.fillRect(x + 7 - s * 4, y + 7, 1, 1); }
      }
      for (const p of PT) { ctx.globalAlpha = Math.min(1, p.l / p.m + .2); ctx.fillStyle = p.c; ctx.fillRect(Math.round(p.x), Math.round(p.y), p.s, p.s); } ctx.globalAlpha = 1;
      for (const l of S.elaser) {
        if (l.t < l.w) { if (((l.t * 12) | 0) % 2) { ctx.fillStyle = 'rgba(255,90,90,.7)'; for (let x = 0; x < l.x; x += 6) ctx.fillRect(x, Math.round(l.y), 3, 1); } }
        else { const y = Math.round(l.y), h = l.h; ctx.fillStyle = '#ff5a5a'; ctx.fillRect(0, y - h / 2, l.x, h); ctx.fillStyle = '#ffd0d0'; ctx.fillRect(0, y - h / 4, l.x, h / 2); ctx.fillStyle = '#fff'; ctx.fillRect(0, y - 1, l.x, 2); }
      }
      for (const e of EN) if (e.type === 'sniper' && e.tele && e.ang != null && ((time * 14) | 0) % 2) { ctx.fillStyle = 'rgba(255,220,80,.8)'; for (let k = 8; k < 150; k += 6) ctx.fillRect(Math.round(e.x + Math.cos(e.ang) * k), Math.round(e.y + Math.sin(e.ang) * k), 1, 1); }
      if (bossB && bossB.dash && bossB.dash.s === 'warn' && ((time * 12) | 0) % 2) { ctx.fillStyle = 'rgba(255,90,90,.75)'; for (let x = 0; x < bossB.x; x += 6) ctx.fillRect(x, Math.round(bossB.y), 3, 2); }
      for (const b of EB) { const sp = SP.bullets[b.col][b.sz]; ctx.drawImage(sp, Math.round(b.x) - b.r, Math.round(b.y) - b.r); }
    } else {
      // タイトルの背景: 自機が横切る
      const x = ((time * 60) % (W + 60)) - 30; drawSprite(SP.player, x, 150 + Math.sin(time * 2) * 8); drawSprite(SP.forceFrames[((time * 8) | 0) % 2], x + 22, 150 + Math.sin(time * 2) * 8);
    }
    ctx.restore();
  }

  // ---------- 描画(文字・HUD) ----------
  function T(s, x, y, size, col, al, bold) {
    hx.font = (bold === false ? '' : 'bold ') + size + 'px "Yu Gothic UI","Hiragino Sans","Hiragino Kaku Gothic ProN","Meiryo",sans-serif'; hx.textAlign = al || 'left'; hx.textBaseline = 'alphabetic';
    hx.lineWidth = Math.max(2, size * .28); hx.strokeStyle = 'rgba(0,0,12,.85)'; hx.lineJoin = 'round'; hx.strokeText(s, x, y); hx.fillStyle = col || '#fff'; hx.fillText(s, x, y);
  }
  function box(x, y, w, h, fill, stroke, lw) { hx.fillStyle = fill; hx.fillRect(x, y, w, h); if (stroke) { hx.strokeStyle = stroke; hx.lineWidth = lw || 1; hx.strokeRect(x + .5, y + .5, w - 1, h - 1); } }
  function renderHud() {
    const k = hud.width / W; hx.setTransform(k, 0, 0, k, 0, 0); hx.clearRect(0, 0, W, H);
    if (state === 'title') return drawTitle();
    if (!R || !S) return;
    box(0, 0, W, 13, 'rgba(0,0,12,.6)'); box(0, H - 14, W, 14, 'rgba(0,0,12,.6)');
    T('STAGE ' + S.n, 4, 10, 9, '#7dffea'); T(('0000000' + R.score).slice(-8), W / 2, 10, 9, '#fff', 'center'); T('HI ' + Math.max(save.hi, R.score), W - 30, 10, 9, '#ffd84a', 'right');
    T('II', W - 8, 10, 9, '#fff', 'center');
    // 下: LV・経験値・波動・スキル・残機
    const nx = needXp(R.lv); T('LV ' + R.lv, 4, H - 4, 9, '#ffd84a');
    box(36, H - 11, 70, 6, '#223'); box(36, H - 11, 70 * clamp(R.xp / nx, 0, 1), 6, '#ffd84a');
    T('波動', 112, H - 4, 8, '#cfe', 'left', false); box(132, H - 11, 46, 6, '#223'); box(132, H - 11, 46 * (P ? P.charge : 0), 6, P && P.charge >= 1 ? '#ffffff' : '#7dffea');
    let sx = 190; for (const kk of SK_KEYS) { const L = lvOf(kk); if (!L) continue; box(sx, H - 12, 18, 11, 'rgba(10,20,50,.9)', SK[kk].c); T(SK[kk].ic, sx + 4, H - 3, 8, SK[kk].c); T('' + L, sx + 13, H - 3, 7, '#fff'); sx += 20; }
    T('♥'.repeat(Math.max(0, R.lives)) || '-', W - 4, H - 4, 9, '#ff7a9a', 'right');
    if (S.guard > 0) T('GUARD x' + S.guard, W - 50, H - 4, 8, '#fff', 'right');
    // ボス体力
    if (bossB && !bossB.enter) { const bw = 200, bx = W - bw - 8; box(bx, 16, bw, 5, 'rgba(0,0,0,.6)', '#ff5a7a'); box(bx, 16, bw * clamp(bossB.hp / bossB.max, 0, 1), 5, bossB.phase === 2 ? '#ff4040' : bossB.phase === 1 ? '#ffb030' : '#ff5a7a'); T(bossB.name, bx, 14, 8, '#ff9ab0'); if (bossB.plan.hatch) { const op = bossB.t % 8 <= 3.5; T(op ? 'CORE OPEN!' : 'ARMOR CLOSED', bx + bw, 14, 8, op ? '#ffee80' : '#9ab', 'right'); } }
    { let by = 18; for (const k of FX_KEYS) { const b = bf(k); if (!b) continue; const c = RAR[b.r].c; box(3, by, 60, 9, 'rgba(0,0,12,.65)', c); box(4, by + 1, 58 * clamp(b.t / (b.max || 10), 0, 1), 7, 'rgba(255,255,255,.18)'); T(FX[k].ic + ' ' + FX[k].n, 6, by + 7.5, 7, c); T(Math.ceil(b.t) + 's', 61, by + 7.5, 7, '#fff', 'right'); by += 11; } }
    if (banner) { const a = clamp(banner.t * 2, 0, 1); hx.globalAlpha = a; T(banner.a, W / 2, 110, 22, banner.col || '#fff', 'center'); T(banner.b, W / 2, 128, 11, banner.col ? '#fff' : '#7dffea', 'center'); hx.globalAlpha = 1; }
    if (S.warn > 0) { const bl = ((time * 4) | 0) % 2; box(0, 100, W, 36, 'rgba(120,0,20,' + (bl ? .5 : .3) + ')'); T('WARNING', W / 2, 124, 22, bl ? '#fff' : '#ff6a6a', 'center'); }
    if (state === 'paused') { box(0, 0, W, H, 'rgba(0,0,10,.7)'); T('PAUSE', W / 2, 96, 22, '#fff', 'center'); ['つづける', 'この面の最初からやり直す', 'タイトルへ'].forEach((s, i) => { box(150, 118 + i * 24, 180, 20, i === menuSel ? 'rgba(60,80,160,.9)' : 'rgba(20,24,60,.9)', i === menuSel ? '#7dffea' : '#456'); T((i + 1) + '  ' + s, W / 2, 132 + i * 24, 10, '#fff', 'center'); }); T('矢印・WASD=移動  Shift=低速  Z/Space=波動(長押し)  X=FORCE  M=音', W / 2, 205, 7.5, '#9ab', 'center', false); }
    if (state === 'levelup') drawPick();
    if (state === 'clear') { box(0, 70, W, 110, 'rgba(0,0,10,.75)'); T('STAGE ' + S.n + ' CLEAR', W / 2, 105, 24, '#ffe070', 'center'); T('クリアボーナス +' + S.bonus, W / 2, 128, 11, '#fff', 'center'); T(S.n >= STAGES_N ? 'ALL CLEAR!' : 'つぎは STAGE ' + (S.n + 1) + '  ' + STAGE_NAMES[S.n], W / 2, 146, 10, '#7dffea', 'center'); if (S.clearT > 1.2) T('タップ / Enter で つづける', W / 2, 168, 10, '#ccc', 'center'); }
    if (state === 'gameover') { box(0, 60, W, 150, 'rgba(10,0,0,.82)'); T('GAME OVER', W / 2, 96, 26, '#ff6a6a', 'center'); T('STAGE ' + S.n + '  SCORE ' + R.score, W / 2, 118, 11, '#fff', 'center'); T('撃破 ' + R.kills + '   かすり ' + R.graze + '   到達LV ' + R.lv, W / 2, 134, 10, '#cfe', 'center'); if (S.goT > 1) { ['この面の最初から', 'タイトルへ'].forEach((s, i) => { box(60 + i * 180, 150, 160, 24, i === menuSel ? 'rgba(60,80,160,.9)' : 'rgba(20,24,60,.9)', i === menuSel ? '#7dffea' : '#456'); T((i + 1) + '  ' + s, 140 + i * 180, 166, 10, '#fff', 'center'); }); } }
    if (state === 'ending') { box(0, 0, W, H, 'rgba(0,0,20,.9)'); T('ALL CLEAR!!', W / 2, 110, 28, '#ffe070', 'center'); T('全20面クリア  SCORE ' + R.score, W / 2, 136, 12, '#fff', 'center'); T('タップ / Enter でタイトルへ', W / 2, 170, 10, '#ccc', 'center'); }
  }
  function drawPick() {
    box(0, 0, W, H, 'rgba(0,0,14,.78)'); T('LEVEL UP!', W / 2, 44, 24, '#ffe070', 'center'); T('LV ' + R.lv + '   選ぶと強くなる(1 / 2 / 3 キー・タップ)', W / 2, 60, 9, '#cfe', 'center');
    S.picks.forEach((p, i) => {
      const x = 28 + i * 148, y = 70, sel = i === S.sel, def = SK[p.k] || { n: p.k === '_life' ? '1UP' : 'スコア', ic: p.k === '_life' ? '♥' : '★', c: p.k === '_life' ? '#ff7a9a' : '#ffe070', d: () => p.k === '_life' ? '残機+1(最大5)' : '+10,000点' };
      const L = SK[p.k] ? lvOf(p.k) : 0, e = clamp((S.luT - i * .06) / .2, 0, 1), yy = y + (1 - e) * 30; hx.globalAlpha = e;
      box(x, yy, 136, 150, 'rgba(12,16,44,.95)', def.c, sel ? 3 : 1);
      T(def.ic, x + 68, yy + 46, 34, def.c, 'center'); T(def.n, x + 68, yy + 68, 12, '#fff', 'center');
      if (SK[p.k]) { T(L ? 'Lv ' + L + ' → ' + (L + 1) : 'NEW!', x + 68, yy + 84, 10, L ? '#ffe070' : '#7dffb0', 'center'); wrapT(def.d(L + 1), x + 68, yy + 102, 15, 8.5, '#cfd8ff'); }
      else wrapT(def.d(), x + 68, yy + 102, 15, 8.5, '#cfd8ff');
      T('' + (i + 1), x + 6, yy + 12, 10, def.c); hx.globalAlpha = 1;
    });
  }
  function wrapT(s, x, y, n, size, col) { for (let i = 0; i * n < s.length && i < 4; i++) T(s.slice(i * n, (i + 1) * n), x, y + i * (size + 3), size, col, 'center', false); }
  function drawTitle() {
    T('VOID FORCE 20', W / 2, 78, 36, '#7dffea', 'center'); T('弾幕フォース  ─  全20面の横スクロール弾幕シューティング', W / 2, 98, 10, '#cfe', 'center');
    T('【作成中】1面〜20面(2面以降は自動生成の骨組み)', W / 2, 114, 8, '#ffb050', 'center', false);
    T('◀  STAGE ' + selStage + '  ▶', W / 2, 160, 13, '#7dffea', 'center'); T(STAGE_NAMES[selStage - 1] + (selStage > 1 ? '  (標準装備つき)' : ''), W / 2, 171, 7.5, '#9ab', 'center', false);
    T('◀  ' + DF().name + '  ▶', W / 2, 200, 14, '#ffd84a', 'center'); T('(面: ↑↓ / タップ   難しさ: ←→ / タップ)', W / 2, 212, 7, '#9ab', 'center', false);
    if (((time * 2) | 0) % 2 === 0) T('TAP / Z / Enter でスタート', W / 2, 236, 12, '#fff', 'center');
    T('HI ' + save.hi, 6, H - 6, 8, '#ffd84a'); T((save.mute ? '♪ OFF' : '♪ ON'), W - 6, H - 6, 8, '#cfe', 'right');
    T('矢印=移動  Shift=低速  Z=波動(長押し)  X=FORCE  P=ポーズ', W / 2, 256, 7.5, '#9ab', 'center', false);
  }

  // ---------- ループ・大きさ ----------
  function resize() {
    const dpr = window.devicePixelRatio || 1, raw = Math.min(innerWidth / W, innerHeight / H);
    const sc = raw * dpr >= 1 ? Math.floor(raw * dpr) / dpr : raw;
    stageEl.style.width = Math.round(W * sc) + 'px'; stageEl.style.height = Math.round(H * sc) + 'px';
    const k = Math.max(1, Math.round(W * sc * dpr / W * 2) / 2); hud.width = Math.round(W * sc * dpr); hud.height = Math.round(H * sc * dpr);
  }
  addEventListener('resize', resize); addEventListener('orientationchange', () => setTimeout(resize, 200)); resize();
  cv.width = W; cv.height = H;
  let last = performance.now(), acc = 0;
  function frame(now) {
    requestAnimationFrame(frame);
    let dt = Math.min(.1, (now - last) / 1000); last = now; acc += dt;
    let n = 0; while (acc >= 1 / 60 && n < 5) { update(1 / 60); acc -= 1 / 60; n++; } if (n >= 5) acc = 0;
    render(); renderHud();
  }
  requestAnimationFrame(frame);
  if (flag('start')) { newRun(+val('stage', 1) || 1); startStage(R.stage); }

  // ---------- 検査用の入口 ----------
  window.VF = {
    get state() { return state; }, get R() { return R; }, get S() { return S; }, get P() { return P; }, get boss() { return bossB; }, EB, EN, PB, GM, SK, DIFFS, save,
    input, touchActive: () => state === 'play', audioInit: () => Snd.init(),
    start(n) { newRun(n || 1); startStage(R.stage); }, start2(n) { startStage(n); },
    step(n) { for (let i = 0; i < n; i++) update(1 / 60); },
    setState(s) { state = s; }, giveSkill(k, L) { R.skills[k] = L; }, setBot(v) { window.__bot = v; },
    god(v) { window.__god = v; }, DR, FX, RAR, rollLoot, pickLoot, bf, bm, killEnemy, giveStarter, newRun,
  };
  const _hit = playerHit; playerHit = function () { if (window.__god) { if (P.inv <= 0) { window.__hits = (window.__hits || 0) + 1; P.inv = .6; } return; } _hit(); };
})();
