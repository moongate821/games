// 合成音: エンジン・効果音・コースごとのBGM(外部ファイルなし)
import { rng } from './geo.js';

let ctx = null, master = null, sfxBus = null, bgmBus = null, engine = null, noiseBuf = null;
let muted = false, bgmTimer = null, bgm = null;
let silent = false; // 録画用: 先読み(早送り)の間は効果音を出さない

export const Snd = {
  get ready() { return !!ctx; },
  get muted() { return muted; },
  set silent(v) { silent = v; },
  get bgmOn() { return !!bgmTimer; },
  init() {
    if (ctx) { if (ctx.state === 'suspended') ctx.resume(); return; }
    // iPhone: 消音スイッチが入っていても鳴るよう、音声セッションを再生扱いにする
    try { if (navigator.audioSession) navigator.audioSession.type = 'playback'; } catch (e) { /* 未対応 */ }
    try {
      const a = document.createElement('audio'); a.loop = true; a.setAttribute('playsinline', ''); a.volume = 0.01;
      a.src = 'data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA=';
      const pr = a.play(); if (pr && pr.catch) pr.catch(() => {});
    } catch (e) { /* ignore */ }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    ctx = new AC();
    master = ctx.createGain(); master.gain.value = muted ? 0 : 0.8; master.connect(ctx.destination);
    const comp = ctx.createDynamicsCompressor(); comp.threshold.value = -14; comp.ratio.value = 6; comp.connect(master);
    sfxBus = ctx.createGain(); sfxBus.gain.value = 0.7; sfxBus.connect(comp);
    bgmBus = ctx.createGain(); bgmBus.gain.value = 0.34; bgmBus.connect(comp);
    const len = ctx.sampleRate * 1.5; noiseBuf = ctx.createBuffer(1, len, ctx.sampleRate);
    const d = noiseBuf.getChannelData(0); for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    if (ctx.state === 'suspended') ctx.resume();
  },
  setMuted(v) { muted = v; if (master) master.gain.value = v ? 0 : 0.8; },
  toggleMute() { Snd.setMuted(!muted); return muted; },
  suspend() { if (ctx && ctx.state === 'running') ctx.suspend(); },
  resume() { if (ctx && ctx.state === 'suspended') ctx.resume(); },

  // ---- エンジン ----
  engineStart() {
    if (!ctx || engine) return;
    const o1 = ctx.createOscillator(), o2 = ctx.createOscillator(), g = ctx.createGain(), f = ctx.createBiquadFilter();
    o1.type = 'sawtooth'; o2.type = 'square'; f.type = 'lowpass'; f.frequency.value = 600; f.Q.value = 3; g.gain.value = 0;
    const g2 = ctx.createGain(); g2.gain.value = 0.35;
    o1.connect(f); o2.connect(g2); g2.connect(f); f.connect(g); g.connect(sfxBus);
    o1.start(); o2.start();
    // 風切り
    const ns = ctx.createBufferSource(); ns.buffer = noiseBuf; ns.loop = true;
    const nf = ctx.createBiquadFilter(); nf.type = 'bandpass'; nf.frequency.value = 900; nf.Q.value = 0.7;
    const ng = ctx.createGain(); ng.gain.value = 0; ns.connect(nf); nf.connect(ng); ng.connect(sfxBus); ns.start();
    engine = { o1, o2, g, f, ns, nf, ng };
  },
  engineUpdate(speedRatio, throttle, boosting, vol = 1) {
    if (!ctx || !engine) return;
    const t = ctx.currentTime, base = 48 + speedRatio * 150 + (boosting ? 40 : 0);
    engine.o1.frequency.setTargetAtTime(base, t, 0.05); engine.o2.frequency.setTargetAtTime(base * 0.5, t, 0.05);
    engine.f.frequency.setTargetAtTime(380 + speedRatio * 1500 + (throttle ? 400 : 0), t, 0.08);
    engine.g.gain.setTargetAtTime((0.05 + 0.13 * (throttle ? 1 : 0.4) * (0.4 + speedRatio)) * vol, t, 0.06);
    engine.ng.gain.setTargetAtTime(Math.min(0.2, speedRatio * speedRatio * 0.14 + (boosting ? 0.07 : 0)) * vol, t, 0.1);
    engine.nf.frequency.setTargetAtTime(500 + speedRatio * 2400, t, 0.1);
  },
  engineStop() {
    if (!engine) return;
    try { engine.o1.stop(); engine.o2.stop(); engine.ns.stop(); } catch (e) { /* ignore */ }
    engine = null;
  },

  // ---- 効果音 ----
  tone(freq, dur, type = 'square', vol = 0.2, slide = 0, delay = 0) {
    if (!ctx || silent) return;
    const t = ctx.currentTime + delay, o = ctx.createOscillator(), g = ctx.createGain();
    o.type = type; o.frequency.setValueAtTime(freq, t); if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(20, freq + slide), t + dur);
    g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(sfxBus); o.start(t); o.stop(t + dur + 0.02);
  },
  noise(dur, vol = 0.3, freq = 1200, q = 0.8, type = 'bandpass', slide = 0, bus = null) {
    if (!ctx || silent) return;
    const t = ctx.currentTime, s = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain();
    s.buffer = noiseBuf; f.type = type; f.frequency.setValueAtTime(freq, t); if (slide) f.frequency.exponentialRampToValueAtTime(Math.max(40, freq + slide), t + dur); f.Q.value = q;
    g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    s.connect(f); f.connect(g); g.connect(bus || sfxBus); s.start(t); s.stop(t + dur + 0.02);
  },
  beep(go) { Snd.tone(go ? 1320 : 660, go ? 0.55 : 0.18, 'square', 0.22); if (go) Snd.tone(1980, 0.5, 'triangle', 0.1); },
  boostpad() { Snd.noise(0.7, 0.35, 600, 0.9, 'bandpass', 3200); Snd.tone(300, 0.5, 'sawtooth', 0.12, 700); },
  boostStart() { Snd.noise(0.5, 0.22, 800, 0.8, 'bandpass', 2400); Snd.tone(220, 0.35, 'sawtooth', 0.1, 500); },
  jump() { Snd.tone(300, 0.4, 'triangle', 0.18, 900); Snd.noise(0.4, 0.12, 1800, 1, 'highpass'); },
  land() { Snd.noise(0.25, 0.3, 300, 1, 'lowpass'); Snd.tone(90, 0.2, 'sine', 0.3, -50); },
  wall(power = 1) { Snd.noise(0.25, 0.25 + 0.25 * power, 2400, 0.6, 'bandpass', -1800); Snd.tone(110, 0.18, 'sawtooth', 0.14 * power, -60); },
  scrape() { Snd.noise(0.1, 0.08, 3200, 1.4, 'bandpass'); },
  recover() { Snd.tone(660, 0.12, 'triangle', 0.12); Snd.tone(990, 0.16, 'triangle', 0.1, 0, 0.1); },
  lap() { [880, 1175, 1568].forEach((f, i) => Snd.tone(f, 0.18, 'square', 0.14, 0, i * 0.09)); },
  finish() { [523, 659, 784, 1047, 784, 1047, 1319].forEach((f, i) => Snd.tone(f, 0.22, 'square', 0.16, 0, i * 0.11)); },
  explode() { Snd.noise(1.4, 0.7, 900, 0.5, 'lowpass', -700); Snd.tone(70, 0.9, 'sawtooth', 0.4, -40); },
  respawn() { Snd.tone(440, 0.3, 'triangle', 0.16, 440); },
  select() { Snd.tone(880, 0.07, 'square', 0.1); },
  decide() { Snd.tone(660, 0.08, 'square', 0.12); Snd.tone(990, 0.14, 'square', 0.12, 0, 0.07); },
  cancel() { Snd.tone(330, 0.12, 'square', 0.1); },
  warn() { Snd.tone(1040, 0.08, 'square', 0.1); },

  // ---- BGM ----
  bgmStart(style, seed = 1) {
    if (!ctx) return;
    Snd.bgmStop();
    const P = {
      city: { bpm: 152, root: 45, scale: [0, 3, 5, 7, 10], prog: [0, 0, 5, 7, 0, 0, 8, 7], lead: 'square', bass: 'sawtooth' },
      canyon: { bpm: 138, root: 40, scale: [0, 2, 3, 7, 8], prog: [0, 3, 0, 5, 0, 3, 7, 5], lead: 'sawtooth', bass: 'square' },
      ice: { bpm: 126, root: 43, scale: [0, 2, 4, 7, 9], prog: [0, 5, 3, 7, 0, 5, 3, 10], lead: 'triangle', bass: 'sawtooth' },
    }[style] || { bpm: 140, root: 45, scale: [0, 3, 5, 7, 10], prog: [0, 0, 5, 7], lead: 'square', bass: 'sawtooth' };
    const R = rng(seed * 99 + 7);
    // 2小節のメロディを作っておき、繰り返す(2周目に少し変える)
    const mel = [];
    for (let i = 0; i < 32; i++) {
      const on = (i % 4 === 0) || R() < 0.45;
      mel.push(on ? P.scale[Math.floor(R() * P.scale.length)] + (R() < 0.3 ? 12 : 0) + 24 : -1);
    }
    bgm = { P, mel, step: 0, next: ctx.currentTime + 0.15, R };
    const f = (n) => 440 * Math.pow(2, (n - 69) / 12);
    const tick = () => {
      if (!bgm || !ctx) return;
      while (bgm.next < ctx.currentTime + 0.25) {
        const s = bgm.step, t = bgm.next, spb = 60 / P.bpm / 4;
        const bar = Math.floor(s / 16) % P.prog.length, ch = P.prog[bar];
        const sn = s % 16;
        // キック・スネア・ハット
        if (sn % 4 === 0) drum(t, 'kick');
        if (sn === 4 || sn === 12) drum(t, 'snare');
        if (sn % 2 === 0) drum(t, 'hat', sn % 4 === 2 ? 0.5 : 0.28);
        // ベース(8分)
        if (sn % 2 === 0) note(t, P.root + ch + (sn % 8 === 6 ? 12 : 0), spb * 1.8, P.bass, 0.22, 500);
        // アルペジオ(薄く)
        if (sn % 4 === 2) note(t, P.root + 24 + ch + P.scale[(sn / 2) % P.scale.length | 0], spb * 1.5, 'triangle', 0.08, 3000);
        // メロディ
        const mi = (s + (Math.floor(s / 32) % 2 ? 0 : 0)) % 32;
        const m = bgm.mel[mi];
        if (m >= 0 && Math.floor(s / 64) % 2 === 0) note(t, P.root + ch + m, spb * 2.2, P.lead, 0.1, 4000);
        else if (m >= 0 && mi % 2 === 0) note(t, P.root + ch + m + 12, spb * 1.2, P.lead, 0.06, 4000);
        bgm.step++; bgm.next += spb;
      }
    };
    function note(t, midi, dur, type, vol, cutoff) {
      const o = ctx.createOscillator(), g = ctx.createGain(), fl = ctx.createBiquadFilter();
      o.type = type; o.frequency.value = f(midi); fl.type = 'lowpass'; fl.frequency.value = cutoff;
      g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(vol, t + 0.008); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      o.connect(fl); fl.connect(g); g.connect(bgmBus); o.start(t); o.stop(t + dur + 0.03);
    }
    function drum(t, kind, vol = 1) {
      if (kind === 'kick') {
        const o = ctx.createOscillator(), g = ctx.createGain(); o.frequency.setValueAtTime(150, t); o.frequency.exponentialRampToValueAtTime(42, t + 0.12);
        g.gain.setValueAtTime(0.7, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.18); o.connect(g); g.connect(bgmBus); o.start(t); o.stop(t + 0.2);
      } else {
        const s = ctx.createBufferSource(), fl = ctx.createBiquadFilter(), g = ctx.createGain(); s.buffer = noiseBuf;
        fl.type = kind === 'hat' ? 'highpass' : 'bandpass'; fl.frequency.value = kind === 'hat' ? 7000 : 1800;
        const d = kind === 'hat' ? 0.04 : 0.14; g.gain.setValueAtTime((kind === 'hat' ? 0.18 : 0.4) * vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + d);
        s.connect(fl); fl.connect(g); g.connect(bgmBus); s.start(t); s.stop(t + d + 0.02);
      }
    }
    bgmTimer = setInterval(tick, 40); tick();
  },
  bgmStop() { if (bgmTimer) clearInterval(bgmTimer); bgmTimer = null; bgm = null; },
};
