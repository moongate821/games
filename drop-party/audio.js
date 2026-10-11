// 音: 効果音(Sfx)と、その場で作曲して流す BGM(Music)。素材ファイルなし・WebAudio のみ。
// BGM は「先読みスケジューラ」(25ms ごとに 0.15 秒先までのノートを予約)で正確なテンポを保つ。
(() => {
const DG = window.DG = window.DG || {};
let ac = null, master, musicGain, sfxGain, noiseBuf, muted = false;

// iPhone/iPad: 本体の消音スイッチが入っていても鳴るように「再生」扱いにする(WebAudio だけだと消音スイッチで無音になる)
function unlockIOS() {
  try { if (navigator.audioSession) navigator.audioSession.type = 'playback'; } catch (e) {}
  try {
    const a = document.createElement('audio'); a.setAttribute('playsinline', ''); a.loop = true; a.volume = 0.01;
    a.src = 'data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA='; a.play().catch(() => {});
  } catch (e) {}
}
// 設定画面の音量(0〜10)を反映。初期値6 = BGM 0.30 / 効果音 0.54
function applyVolumes() {
  const s = (window.DG && DG.settings) || { music: 6, sfx: 6 };
  if (musicGain) musicGain.gain.value = 0.5 * s.music / 10;
  if (sfxGain) sfxGain.gain.value = 0.9 * s.sfx / 10;
}
function init() {
  try {
    if (ac) { if (ac.state === 'suspended') ac.resume(); return; }
    unlockIOS();
    ac = new (window.AudioContext || window.webkitAudioContext)();
    master = ac.createGain(); master.gain.value = muted ? 0 : 0.85; master.connect(ac.destination);
    musicGain = ac.createGain(); musicGain.connect(master);
    sfxGain = ac.createGain(); sfxGain.connect(master);
    applyVolumes();
    noiseBuf = ac.createBuffer(1, ac.sampleRate, ac.sampleRate);
    const d = noiseBuf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  } catch (e) { ac = null; }
}
const mtof = m => 440 * Math.pow(2, (m - 69) / 12);

// 1音。freq→freq2 へスライド可。lp でローパス
function tone(freq, t, dur, type, vol, dest, o) {
  if (!ac) return;
  try {
    o = o || {};
    const osc = ac.createOscillator(), g = ac.createGain();
    osc.type = type; osc.frequency.setValueAtTime(freq, t);
    if (o.to) osc.frequency.exponentialRampToValueAtTime(o.to, t + dur);
    if (o.detune) osc.detune.value = o.detune;
    const a = o.attack || 0.006;
    g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(vol, t + a);
    g.gain.exponentialRampToValueAtTime(0.0001, t + Math.max(dur, a + 0.02));
    let node = osc;
    if (o.lp) { const f = ac.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = o.lp; osc.connect(f); node = f; }
    node.connect(g); g.connect(dest || sfxGain);
    osc.start(t); osc.stop(t + dur + 0.05);
  } catch (e) {}
}
function noise(t, dur, vol, hp, dest, lp) {
  if (!ac) return;
  try {
    const s = ac.createBufferSource(), g = ac.createGain(), f = ac.createBiquadFilter();
    s.buffer = noiseBuf; f.type = lp ? 'lowpass' : 'highpass'; f.frequency.value = hp;
    g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    s.connect(f); f.connect(g); g.connect(dest || sfxGain); s.start(t); s.stop(t + dur + 0.02);
  } catch (e) {}
}
const now = () => (ac ? ac.currentTime : 0);

// ---------- 効果音 ----------
const PENTA = [0, 2, 4, 7, 9];
const Sfx = {
  move() { tone(420, now(), .04, 'square', .04, null, { lp: 2000 }); },
  rot() { tone(560, now(), .05, 'square', .05, null, { lp: 2400 }); tone(740, now() + .03, .05, 'square', .04, null, { lp: 2400 }); },
  lock() { const t = now(); tone(150, t, .12, 'sine', .25, null, { to: 70 }); noise(t, .05, .08, 1200); },
  // 連鎖が伸びるほど音階が上がる(ぷよぷよ系の気持ちよさ)
  chime(n, base) {
    const t = now(), k = Math.min(n, 9), m = (base || 72) + PENTA[k % 5] + 12 * Math.floor(k / 5);
    tone(mtof(m), t, .35, 'triangle', .22); tone(mtof(m + 12), t + .02, .3, 'sine', .1);
  },
  grow() { const t = now(); tone(mtof(76), t, .15, 'sine', .14); tone(mtof(83), t + .06, .2, 'sine', .12); },
  forest() { const t = now(); [72, 76, 79, 84, 88].forEach((m, i) => tone(mtof(m), t + i * .07, .6, 'triangle', .16)); noise(t, .5, .05, 5000); },
  zap() { const t = now(); tone(1400, t, .18, 'sine', .12, null, { to: 500 }); tone(2100, t + .02, .12, 'triangle', .06, null, { to: 900 }); },
  materialize() { const t = now(); tone(300, t, .25, 'sawtooth', .07, null, { to: 1200, lp: 3000 }); tone(1200, t + .22, .15, 'sine', .12); },
  clear(n) { const t = now(), b = 60 + n * 2; [0, 4, 7, 12].forEach((s, i) => tone(mtof(b + s), t + i * .04, .3, 'square', .06, null, { lp: 3000 })); noise(t, .15, .06, 3000); },
  garbage() { const t = now(); tone(100, t, .25, 'sine', .3, null, { to: 45 }); noise(t, .12, .12, 600, null, true); },
  send() { const t = now(); tone(880, t, .1, 'square', .07, null, { to: 220, lp: 2500 }); },
  over() { const t = now(); [60, 57, 53, 48].forEach((m, i) => tone(mtof(m), t + i * .22, .5, 'triangle', .2)); },
  win() { const t = now(); [72, 76, 79, 84, 79, 84, 88].forEach((m, i) => tone(mtof(m), t + i * .12, .4, 'triangle', .18)); },
  select() { const t = now(); tone(mtof(79), t, .08, 'square', .06, null, { lp: 3000 }); },
  start() { const t = now(); [72, 79, 84].forEach((m, i) => tone(mtof(m), t + i * .08, .25, 'square', .07, null, { lp: 3000 })); },
};

// ---------- BGM ----------
function rng(seed) { return () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }

const THEMES = {
  // やさしい箱庭。Cメジャー、ゆったり、オルゴールのような音色
  terrarium: { tempo: 100, seed: 11, root: 60, chords: [[0, [0, 4, 7]], [9, [0, 3, 7]], [5, [0, 4, 7]], [7, [0, 4, 7]]], scale: [0, 2, 4, 7, 9], lead: 'triangle', arp: 'sine', bass: 'sine', style: 'soft' },
  // 量子の夜。Aマイナー、少し速く、シンセ
  quantum: { tempo: 132, seed: 29, root: 57, chords: [[0, [0, 3, 7]], [-4, [0, 4, 7]], [3, [0, 4, 7]], [-2, [0, 4, 7]]], scale: [0, 3, 5, 7, 10], lead: 'square', arp: 'sawtooth', bass: 'sawtooth', style: 'synth' },
  // メニュー。ふわっとしたベル
  menu: { tempo: 88, seed: 5, root: 62, chords: [[0, [0, 4, 7]], [7, [0, 4, 7]], [9, [0, 3, 7]], [5, [0, 4, 7]]], scale: [0, 2, 4, 7, 9], lead: 'sine', arp: 'triangle', bass: 'sine', style: 'soft' },
};

function makeSong(th) {
  const R = rng(th.seed), len = 8 * 16, mel = new Array(len).fill(null);
  const pool = []; for (let o = 0; o < 2; o++) th.scale.forEach(s => pool.push(th.root + 12 + o * 12 + s));
  let idx = 3;
  const bar = (b, vary) => {
    const ch = th.chords[b % 4], tones = ch[1].map(i => th.root + 12 + ch[0] + i);
    for (let p = 0; p < 16; p += 2) {
      const strong = p % 8 === 0, prob = strong ? 0.92 : (vary ? 0.5 : 0.42);
      if (R() > prob) continue;
      if (strong) { // 強拍はコードの音へ寄せる
        let best = pool[idx], bd = 99;
        for (const q of pool) for (const tn of tones) { const d = Math.abs(q % 12 - tn % 12); const dd = d > 6 ? 12 - d : d; if (dd === 0 && Math.abs(q - pool[idx]) < bd) { bd = Math.abs(q - pool[idx]); best = q; } }
        idx = pool.indexOf(best);
      } else idx = Math.max(0, Math.min(pool.length - 1, idx + Math.floor(R() * 5) - 2));
      mel[b * 16 + p] = pool[idx];
    }
  };
  // A A' A B の形で 8 小節
  for (let b = 0; b < 8; b++) bar(b, b === 3 || b === 7);
  for (let b = 4; b < 6; b++) for (let p = 0; p < 16; p++) mel[b * 16 + p] = mel[(b - 4) * 16 + p];   // 5,6小節目は 1,2 の再現
  return mel;
}

const M = { name: null, th: null, mel: null, step: 0, next: 0, timer: null };
function schedule(s, t) {
  const th = M.th, bar = Math.floor(s / 16) % 8, pos = s % 16, ch = th.chords[bar % 4];
  const chord = ch[1].map(i => th.root + ch[0] + i), dur = 60 / th.tempo / 4;
  const soft = th.style === 'soft';
  // ベース
  if (soft ? (pos === 0 || pos === 8) : (pos % 2 === 0)) tone(mtof(th.root - 12 + ch[0]), t, dur * (soft ? 6 : 1.6), th.bass, soft ? .3 : .16, musicGain, { lp: soft ? 600 : 900 });
  // アルペジオ
  if (soft ? pos % 2 === 0 : true) {
    const arpPat = soft ? [0, 1, 2, 1, 0, 2, 1, 2] : [0, 2, 1, 2];
    const n = chord[arpPat[(soft ? pos / 2 : pos) % arpPat.length] % chord.length] + 12;
    tone(mtof(n), t, dur * (soft ? 2.5 : 1.2), th.arp, soft ? .09 : .05, musicGain, { lp: soft ? 2500 : 1800 });
  }
  // メロディ
  const m = M.mel[s % M.mel.length];
  if (m != null) { let l = 1; while (l < 8 && M.mel[(s + l) % M.mel.length] == null && (s + l) % 16 !== 0) l++; tone(mtof(m), t, dur * l * 0.95, th.lead, soft ? .17 : .1, musicGain, { lp: soft ? 3000 : 2200, attack: soft ? .01 : .004 }); }
  // ドラム
  if (soft) {
    if (pos === 0 || pos === 8) tone(120, t, .12, 'sine', .22, musicGain, { to: 50 });
    if (pos % 4 === 2) noise(t, .04, .03, 7000, musicGain);
  } else {
    if (pos % 4 === 0) tone(140, t, .14, 'sine', .3, musicGain, { to: 45 });
    if (pos === 4 || pos === 12) noise(t, .12, .09, 1800, musicGain);
    if (pos % 2 === 0) noise(t, .03, .04, 8000, musicGain);
  }
}
function pump() {
  if (!ac || !M.th) return;
  const dur = 60 / M.th.tempo / 4;
  while (M.next < ac.currentTime + 0.15) { schedule(M.step, M.next); M.step = (M.step + 1) % 128; M.next += dur / (M.speed || 1); }
}
const Music = {
  play(name) {
    init(); if (!ac || M.name === name) return;
    this.stop(); M.name = name; M.th = THEMES[name]; M.mel = makeSong(M.th); M.step = 0; M.next = ac.currentTime + 0.1; M.speed = 1;
    M.timer = setInterval(pump, 25);
  },
  stop() { if (M.timer) clearInterval(M.timer); M.timer = null; M.name = null; M.th = null; },
  speed(v) { M.speed = v; },            // 危険時にテンポを上げる
  toggleMute() { muted = !muted; if (master) master.gain.value = muted ? 0 : 0.85; return muted; },
  get muted() { return muted; },
};
DG.Audio = { init, applyVolumes, Sfx, Music, tone, noise, debug: () => ({ state: ac && ac.state, t: ac && ac.currentTime, music: M.name, step: M.step, muted }) };
})();
