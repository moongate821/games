/* テキストゲーム共通の音(BGM と効果音)。WebAudio だけで鳴らす(音のファイルは使わない)。
 * 曲は music.js(window.GAME_MUSIC)の「曲の設計」から、決まった種で毎回同じ曲を組み立てる。
 * MS-DOS 時代の FM 音源・PCスピーカーの手ざわりを目指す(矩形波・三角波・ベル・雑音の太鼓)。
 * 使い方(エンジンから): SND.music('title') / SND.sfx('ok') / SND.jingle('death') / SND.tick() / SND.mode()
 */
(function () {
  'use strict';
  const GM = window.GAME_MUSIC || { themes: {} };
  let ctx = null, master = null, musicBus = null, sfxBus = null, analyser = null;
  function peek() {
    if (!analyser) return { state: ctx ? ctx.state : 'none', rms: 0, peak: 0 };
    const a = new Float32Array(analyser.fftSize); analyser.getFloatTimeDomainData(a);
    let s = 0, p = 0; a.forEach(v => { s += v * v; p = Math.max(p, Math.abs(v)); });
    return { state: ctx.state, rms: Math.sqrt(s / a.length), peak: p };
  }
  // 音の設定: 0=BGM+効果音 1=効果音のみ 2=音なし(保存はエンジンの記録 M.sound)
  let level = 0;

  function init() {
    if (ctx) return true;
    try {
      ctx = new (window.AudioContext || window.webkitAudioContext)();
      master = ctx.createGain(); master.gain.value = 1.5;
      // 角を丸める弱いコンプレッサー(音割れ防止)
      const comp = ctx.createDynamicsCompressor();
      comp.threshold.value = -18; comp.ratio.value = 4;
      master.connect(comp); comp.connect(ctx.destination);
      // 検証用: 出口の音量を測る(SND.peek())
      analyser = ctx.createAnalyser(); analyser.fftSize = 2048; comp.connect(analyser);
      musicBus = ctx.createGain(); musicBus.gain.value = GM.musicVol || 0.32; musicBus.connect(master);
      sfxBus = ctx.createGain(); sfxBus.gain.value = GM.sfxVol || 0.5; sfxBus.connect(master);
      apply();
      return true;
    } catch (e) { return false; }
  }
  // iPhone などは、最初に触れた時でないと音が出ない
  function unlock() {
    if (!init()) return;
    if (ctx.state === 'suspended') ctx.resume();
    if (want && !cur) start(want);
  }
  ['pointerdown', 'keydown', 'touchstart'].forEach(ev => window.addEventListener(ev, unlock, { capture: true, passive: true }));

  function apply() {
    if (!ctx) return;
    const t = ctx.currentTime;
    musicBus.gain.setTargetAtTime(level === 0 ? (GM.musicVol || 0.32) : 0, t, 0.2);
    sfxBus.gain.setTargetAtTime(level <= 1 ? (GM.sfxVol || 0.5) : 0, t, 0.05);
  }

  // ---------- 音色 ----------
  const mtof = m => 440 * Math.pow(2, (m - 69) / 12);
  // 一音: wave=square/triangle/sine/sawtooth/pulse/bell/organ/pluck
  function note(dest, midi, t, dur, wave, vol, opt) {
    opt = opt || {};
    const f = mtof(midi);
    const g = ctx.createGain();
    const atk = opt.atk || 0.006, rel = opt.rel || 0.08;
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(vol, t + atk);
    if (opt.decay) g.gain.setTargetAtTime(vol * (opt.sustain || 0.35), t + atk, opt.decay);
    g.gain.setValueAtTime(opt.decay ? vol * (opt.sustain || 0.35) : vol, Math.max(t + atk, t + dur - 0.001));
    g.gain.linearRampToValueAtTime(0, t + dur + rel);
    let out = g;
    if (opt.lp) { const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = opt.lp; lp.Q.value = 0.7; g.connect(lp); out = lp; }
    out.connect(dest);
    const end = t + dur + rel + 0.05;
    const osc = (type, freq, gain) => {
      const o = ctx.createOscillator();
      if (type === 'pulse') {
        // 25% の矩形波(ファミコン・PC-88 の手ざわり)
        const real = new Float32Array(32), imag = new Float32Array(32);
        for (let n = 1; n < 32; n++) imag[n] = (2 / (n * Math.PI)) * Math.sin(n * Math.PI * 0.25);
        o.setPeriodicWave(ctx.createPeriodicWave(real, imag));
      } else o.type = type;
      o.frequency.value = freq;
      if (opt.vib) { // ゆるいビブラート
        const l = ctx.createOscillator(), lg = ctx.createGain();
        l.frequency.value = 5.5; lg.gain.value = freq * 0.006 * opt.vib;
        l.connect(lg); lg.connect(o.frequency); l.start(t + 0.12); l.stop(end);
      }
      if (opt.slide) o.frequency.exponentialRampToValueAtTime(Math.max(20, freq * opt.slide), t + dur);
      const og = ctx.createGain(); og.gain.value = gain;
      o.connect(og); og.connect(g);
      o.start(t); o.stop(end);
    };
    if (wave === 'bell') { osc('sine', f, 0.7); osc('sine', f * 2.76, 0.18); osc('sine', f * 5.4, 0.06); }
    else if (wave === 'organ') { osc('square', f, 0.35); osc('sine', f * 2, 0.25); }
    else if (wave === 'pluck') { osc('triangle', f, 0.8); osc('square', f * 2, 0.08); }
    else if (wave === 'pad') { osc('sawtooth', f, 0.25); osc('sawtooth', f * 1.006, 0.25); }
    else if (wave === 'fm') { // 2オペレータの FM っぽい音
      const car = ctx.createOscillator(), mod = ctx.createOscillator(), mg = ctx.createGain();
      car.frequency.value = f; mod.frequency.value = f * (opt.ratio || 2);
      mg.gain.setValueAtTime(f * (opt.index || 2.5), t); mg.gain.exponentialRampToValueAtTime(Math.max(1, f * 0.3), t + dur + rel);
      mod.connect(mg); mg.connect(car.frequency); car.connect(g);
      car.start(t); mod.start(t); car.stop(end); mod.stop(end);
    } else osc(wave, f, 1);
  }
  function noise(dest, t, dur, vol, hp, lp) {
    const n = Math.floor(ctx.sampleRate * Math.max(0.02, dur));
    const buf = ctx.createBuffer(1, n, ctx.sampleRate), d = buf.getChannelData(0);
    for (let i = 0; i < n; i++) d[i] = Math.random() * 2 - 1;
    const s = ctx.createBufferSource(); s.buffer = buf;
    const g = ctx.createGain();
    g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    let x = s;
    if (hp) { const f = ctx.createBiquadFilter(); f.type = 'highpass'; f.frequency.value = hp; x.connect(f); x = f; }
    if (lp) { const f = ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = lp; x.connect(f); x = f; }
    x.connect(g); g.connect(dest);
    s.start(t); s.stop(t + dur + 0.02);
  }
  function kick(dest, t, vol) {
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.frequency.setValueAtTime(130, t); o.frequency.exponentialRampToValueAtTime(42, t + 0.12);
    g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.18);
    o.connect(g); g.connect(dest); o.start(t); o.stop(t + 0.2);
  }

  // ---------- 作曲(決まった種から毎回同じ曲を組み立てる) ----------
  function rng(seed) { return () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
  const SCALES = {
    major: [0, 2, 4, 5, 7, 9, 11], minor: [0, 2, 3, 5, 7, 8, 10], dorian: [0, 2, 3, 5, 7, 9, 10],
    phrygian: [0, 1, 3, 5, 7, 8, 10], lydian: [0, 2, 4, 6, 7, 9, 11], mixolydian: [0, 2, 4, 5, 7, 9, 10],
    harmonic: [0, 2, 3, 5, 7, 8, 11], penta: [0, 2, 4, 7, 9], minpenta: [0, 3, 5, 7, 10], whole: [0, 2, 4, 6, 8, 10],
    dim: [0, 2, 3, 5, 6, 8, 9, 11],
  };
  // 和音の名前 → 音程(根音からの半音)
  const CH = { M: [0, 4, 7], m: [0, 3, 7], M7: [0, 4, 7, 11], m7: [0, 3, 7, 10], '7': [0, 4, 7, 10], dim: [0, 3, 6], sus: [0, 5, 7], add9: [0, 4, 7, 14], m9: [0, 3, 7, 14], aug: [0, 4, 8] };
  function parseChord(s) { // "0m" "5M7" "-2M" など。数字=根音からの半音
    const m = String(s).match(/^(-?\d+)(.*)$/);
    return { root: +m[1], iv: CH[m[2] || 'M'] || CH.M };
  }
  function compose(th) {
    const R = rng(th.seed || 1);
    const beats = th.beats || 4, spb = beats * 4;                  // 1小節の16分音符の数
    const prog = (th.chords || ['0m', '5m', '7M', '0m']).map(parseChord);
    const bars = th.bars || prog.length * 2;
    const scale = SCALES[th.scale] || SCALES.minor;
    const root = th.root || 57;
    const lead = new Array(bars * spb).fill(null);
    const dens = th.density == null ? 0.5 : th.density;
    // 旋律: 2小節の動機を作り、繰り返しと変化で曲にする(A A' B A'')
    const pitchPool = [];
    for (let o = 0; o < 3; o++) scale.forEach(s => pitchPool.push(root + 12 * (th.leadOct || 1) + s + o * 12 - 12));
    const nearest = (m) => pitchPool.reduce((a, b) => Math.abs(b - m) < Math.abs(a - m) ? b : a, pitchPool[0]);
    function motif(len, startPitch, bar0) {
      const out = new Array(len).fill(null);
      let p = startPitch;
      for (let s = 0; s < len; s++) {
        const pos = s % spb;
        const ch = prog[(bar0 + Math.floor(s / spb)) % prog.length];
        const strong = pos % 4 === 0, downbeat = pos === 0;
        const on = downbeat ? R() < 0.85 : strong ? R() < dens + 0.25 : (pos % 2 === 0 ? R() < dens * 0.7 : R() < dens * 0.25);
        if (!on) continue;
        if (strong) { // 強拍は和音の音
          const ct = ch.iv.map(i => root + 12 * (th.leadOct || 1) + ch.root + i);
          const cands = ct.concat(ct.map(x => x + 12), ct.map(x => x - 12));
          p = cands.reduce((a, b) => Math.abs(b - p) < Math.abs(a - p) ? b : a, cands[0]);
        } else { // 弱拍は音階を一歩か二歩
          const idx = pitchPool.indexOf(nearest(p));
          const step = R() < 0.7 ? (R() < 0.5 ? 1 : -1) : (R() < 0.5 ? 2 : -2);
          p = pitchPool[Math.max(0, Math.min(pitchPool.length - 1, idx + step))];
        }
        out[s] = p;
      }
      return out;
    }
    const L = spb * 2;
    const start = root + 12 * (th.leadOct || 1) + prog[0].root + prog[0].iv[R() < 0.5 ? 0 : 2];
    const A = motif(L, start, 0);
    const B = motif(L, start + (th.bLift == null ? 5 : th.bLift), 4 % prog.length);
    for (let b = 0; b < bars; b += 2) {
      const sec = Math.floor(b / 2) % 4;     // A A' B A''
      const src = sec === 2 ? B : A;
      for (let s = 0; s < L && (b * spb + s) < lead.length; s++) {
        let n = src[s];
        if (n != null && sec !== 0) {
          // 変化: 小節の終わりの方を少し変える
          if (s > L - spb / 2 && R() < 0.5) n = nearest(n + (R() < 0.5 ? 2 : -2));
          const ch = prog[(b + Math.floor(s / spb)) % prog.length];
          if (s % spb === 0 && sec === 3 && b + 2 >= bars) n = root + 12 * (th.leadOct || 1) + ch.root; // 最後は根音へ
        }
        lead[b * spb + s] = n;
      }
    }
    // 音の長さ: 次の音まで(最大で th.hold 拍)
    const len = lead.map((n, i) => {
      if (n == null) return 0;
      let k = 1; while (k < (th.hold || 4) && lead[i + k] == null && i + k < lead.length) k++;
      return k;
    });
    return { th, prog, bars, spb, lead, len, root };
  }

  // ---------- 再生 ----------
  let want = null, cur = null, song = null, step = 0, nextT = 0, timer = null, trackGain = null;
  function stepDur() { return 60 / (song.th.tempo || 90) / 4; }
  function schedule(s, t) {
    const th = song.th, spb = song.spb, bar = Math.floor(s / spb) % song.bars, pos = s % spb;
    const ch = song.prog[bar % song.prog.length];
    const root = song.root;
    const dur = stepDur();
    const dest = trackGain;
    const sw = th.swing && pos % 2 === 1 ? dur * th.swing : 0;
    const tt = t + sw;
    // 旋律
    const n = song.lead[s % song.lead.length];
    if (n != null && th.lead !== 'none') {
      note(dest, n + (th.leadShift || 0), tt, song.len[s % song.lead.length] * dur * 0.92, th.lead || 'square', th.leadVol || 0.16,
        { vib: th.vib == null ? 1 : th.vib, decay: th.leadDecay, sustain: 0.5, lp: th.leadLp, rel: th.leadRel || 0.1, ratio: th.ratio, index: th.index });
      if (th.echo) note(dest, n + (th.leadShift || 0), tt + dur * 3, dur * 2, th.lead || 'square', (th.leadVol || 0.16) * 0.3, { lp: 1800, decay: 0.2 });
    }
    // ベース
    const bassStyle = th.bassStyle || 'root';
    const bn = root - 12 + ch.root;
    if (th.bass !== 'none') {
      if (bassStyle === 'root' && pos === 0) note(dest, bn, t, dur * spb * 0.9, th.bass || 'triangle', th.bassVol || 0.2, { lp: 900 });
      if (bassStyle === 'half' && pos % (spb / 2) === 0) note(dest, bn + (pos ? 7 : 0), t, dur * spb / 2 * 0.9, th.bass || 'triangle', th.bassVol || 0.2, { lp: 900 });
      if (bassStyle === 'eighth' && pos % 2 === 0) note(dest, bn + (pos % 8 === 6 ? 12 : 0), t, dur * 1.6, th.bass || 'square', th.bassVol || 0.13, { lp: 700 });
      if (bassStyle === 'walk' && pos % 4 === 0) { const w = [0, ch.iv[1], ch.iv[2], ch.iv[2] + 2][pos / 4 % 4]; note(dest, bn + w, tt, dur * 3.6, th.bass || 'triangle', th.bassVol || 0.18, { lp: 1000 }); }
      if (bassStyle === 'drone' && s % (spb * 2) === 0) note(dest, root - 24, t, dur * spb * 2, 'sine', th.bassVol || 0.16, { atk: 0.4, rel: 0.6 });
    }
    // 分散和音
    const arpStyle = th.arpStyle || 'none';
    if (arpStyle !== 'none') {
      const ct = ch.iv.map(i => root + ch.root + i + 12 * (th.arpOct || 0));
      const every = arpStyle === 'fast' ? 1 : arpStyle === 'slow' ? 4 : 2;
      if (pos % every === 0) {
        const k = (pos / every) % (ct.length * 2 - 2);
        const idx = k < ct.length ? k : ct.length * 2 - 2 - k;
        note(dest, ct[idx], tt, dur * every * 0.8, th.arp || 'pulse', th.arpVol || 0.07, { decay: 0.12, sustain: 0.3, lp: th.arpLp || 3000 });
      }
    }
    // 和音を伸ばす
    if (th.pad && pos === 0) ch.iv.forEach(i => note(dest, root + ch.root + i, t, dur * spb * 0.98, th.pad === true ? 'pad' : th.pad, th.padVol || 0.035, { atk: 0.25, rel: 0.4, lp: th.padLp || 1400 }));
    // 太鼓(雑音)
    const dr = th.drums || 'none';
    if (dr === 'tick' && pos % 4 === 0) noise(dest, t, 0.025, 0.06, 6000);
    if (dr === 'soft' && pos % 4 === 2) noise(dest, tt, 0.03, 0.05, 7000);
    if (dr === 'beat') {
      if (pos % 8 === 0) kick(dest, t, 0.35);
      if (pos % 8 === 4) noise(dest, t, 0.1, 0.12, 1500, 6000);
      if (pos % 2 === 1) noise(dest, tt, 0.02, 0.04, 8000);
    }
    if (dr === 'march') { if (pos % 4 === 0) kick(dest, t, 0.25); if (pos % 16 === 12 || pos % 16 === 14) noise(dest, t, 0.06, 0.09, 2000, 7000); }
    if (dr === 'clock' && pos % 4 === 0) note(dest, pos % 8 ? 96 : 91, t, 0.02, 'square', 0.025, { lp: 4000 });
    if (dr === 'sonar' && s % (spb * 2) === 0) note(dest, root + 24, t, dur * 6, 'sine', 0.06, { atk: 0.002, decay: 0.5, sustain: 0.01, rel: 1.2 });
    if (dr === 'bells' && pos === 0 && bar % 2 === 0) note(dest, root + 24 + ch.root, t, dur * 8, 'bell', 0.05, { decay: 0.6, sustain: 0.05, rel: 1.5 });
  }
  function pump() {
    if (!song) return;
    const ahead = ctx.currentTime + 0.25;
    while (nextT < ahead) {
      schedule(step, nextT);
      nextT += stepDur();
      step++;
      if (song.th.once && step >= song.bars * song.spb) { stopTrack(1.5); return; }
    }
  }
  function stopTrack(fade) {
    if (timer) { clearInterval(timer); timer = null; }
    if (trackGain) {
      const g = trackGain, t = ctx.currentTime;
      g.gain.cancelScheduledValues(t); g.gain.setValueAtTime(g.gain.value, t);
      g.gain.linearRampToValueAtTime(0, t + (fade || 0.5));
      setTimeout(() => { try { g.disconnect(); } catch (e) { } }, (fade || 0.5) * 1000 + 200);
    }
    trackGain = null; song = null; cur = null;
  }
  const cache = {};
  function start(name) {
    const th = (GM.themes || {})[name];
    if (!th || !ctx) return;
    stopTrack(0.6);
    song = cache[name] || (cache[name] = compose(th));
    cur = name; step = 0;
    trackGain = ctx.createGain(); trackGain.gain.value = 0; trackGain.connect(musicBus);
    trackGain.gain.linearRampToValueAtTime(1, ctx.currentTime + 0.8);
    nextT = ctx.currentTime + 0.12;
    timer = setInterval(pump, 50);
    pump();
  }
  // 場面の名前(title/floor1/battle/...)→ GM.scenes で曲の名前に読み替え
  function music(scene) {
    const name = (GM.scenes || {})[scene] || scene;
    if (!name || !(GM.themes || {})[name]) { if (name === null || name === 'none') { want = null; if (ctx) stopTrack(0.8); } return; }
    want = name;
    if (!ctx || ctx.state !== 'running') return;   // 触れてから鳴らす
    if (cur === name) return;
    start(name);
  }

  // ---------- 効果音 ----------
  const P = Object.assign({ wave: 'square', pitch: 0 }, GM.sfx || {});
  const W = P.wave, X = P.pitch;
  let lastTick = 0;
  const S = {
    key: t => note(sfxBus, 84 + X, t, 0.02, W, 0.05, { lp: 3500 }),
    select: t => { note(sfxBus, 79 + X, t, 0.03, W, 0.07); note(sfxBus, 86 + X, t + 0.035, 0.04, W, 0.06); },
    ok: t => [0, 4, 7, 12].forEach((d, i) => note(sfxBus, 76 + X + d, t + i * 0.055, 0.06, W, 0.08)),
    ng: t => { note(sfxBus, 50 + X, t, 0.12, 'square', 0.1, { lp: 900 }); note(sfxBus, 47 + X, t + 0.13, 0.2, 'square', 0.1, { lp: 700 }); },
    hit: t => { noise(sfxBus, t, 0.09, 0.35, 300, 3000); note(sfxBus, 45 + X, t, 0.08, 'square', 0.12, { slide: 0.5, lp: 1200 }); },
    hurt: t => { noise(sfxBus, t, 0.14, 0.3, 120, 1800); note(sfxBus, 40 + X, t, 0.16, 'sawtooth', 0.14, { slide: 0.4, lp: 900 }); },
    heavy: t => { kick(sfxBus, t, 0.6); noise(sfxBus, t, 0.3, 0.4, 80, 1200); },
    crit: t => { noise(sfxBus, t, 0.05, 0.3, 2000); [0, 7, 12, 19].forEach((d, i) => note(sfxBus, 79 + X + d, t + i * 0.03, 0.05, W, 0.08)); },
    guard: t => note(sfxBus, 67 + X, t, 0.1, 'triangle', 0.12, { slide: 1.5 }),
    mind: t => note(sfxBus, 70 + X, t, 0.4, 'sine', 0.1, { vib: 6, slide: 0.7 }),
    door: t => { noise(sfxBus, t, 0.18, 0.12, 400, 2500); note(sfxBus, 55 + X, t, 0.12, 'triangle', 0.08, { slide: 0.8 }); },
    item: t => { note(sfxBus, 81 + X, t, 0.06, 'bell', 0.12, { decay: 0.1 }); note(sfxBus, 88 + X, t + 0.07, 0.12, 'bell', 0.12, { decay: 0.15 }); },
    lose: t => { note(sfxBus, 72 + X, t, 0.08, W, 0.07); note(sfxBus, 66 + X, t + 0.09, 0.14, W, 0.07); },
    heal: t => [0, 5, 9, 12].forEach((d, i) => note(sfxBus, 72 + X + d, t + i * 0.07, 0.1, 'triangle', 0.1)),
    buy: t => { note(sfxBus, 88 + X, t, 0.03, 'square', 0.06); note(sfxBus, 93 + X, t + 0.05, 0.08, 'bell', 0.1, { decay: 0.1 }); },
    heart: t => [0, 4, 7].forEach((d, i) => note(sfxBus, 84 + X + d, t + i * 0.08, 0.18, 'bell', 0.1, { decay: 0.2, sustain: 0.1 })),
    heartDown: t => [7, 3, 0].forEach((d, i) => note(sfxBus, 76 + X + d, t + i * 0.09, 0.16, 'triangle', 0.09)),
    meta: t => [0, 4, 7, 11, 14].forEach((d, i) => note(sfxBus, 72 + X + d, t + i * 0.09, 0.25, 'bell', 0.12, { decay: 0.25, sustain: 0.15 })),
    win: t => [0, 4, 7, 12, 7, 12].forEach((d, i) => note(sfxBus, 67 + X + d, t + i * 0.08, i === 5 ? 0.4 : 0.07, W, 0.09)),
    flee: t => [12, 7, 3, 0].forEach((d, i) => note(sfxBus, 70 + X + d, t + i * 0.04, 0.04, W, 0.06)),
    stairs: t => [0, 2, 4, 5, 7, 9, 11, 12].forEach((d, i) => note(sfxBus, (GM.stairsUp ? 60 + d : 72 - d) + X, t + i * 0.06, 0.06, 'triangle', 0.08)),
    terminal: t => [0, 12, 0, 12].forEach((d, i) => note(sfxBus, 81 + d + X, t + i * 0.04, 0.03, 'square', 0.04, { lp: 2500 })),
  };
  function sfx(name) {
    if (!init() || level >= 2) return;
    if (ctx.state === 'suspended') ctx.resume();
    const f = S[name]; if (f) f(ctx.currentTime + 0.005);
  }
  // 文字送りのカタカタ(うるさくないよう間引く)
  function tick() {
    if (!ctx || level >= 2 || GM.tick === false) return;
    const now = ctx.currentTime;
    if (now - lastTick < 0.055) return;
    lastTick = now;
    note(sfxBus, (GM.tickPitch || 96) + Math.floor(Math.random() * 3), now, 0.008, 'square', 0.018, { atk: 0.001, rel: 0.01, lp: 5000 });
  }
  // 短い節(死・BAD END など)。曲を止めて一回だけ鳴らす
  function jingle(name) {
    want = null;
    if (!init()) return;
    stopTrack(0.3);
    if (level >= 2) return;
    const j = (GM.jingles || {})[name];
    if (!j) return;
    const t0 = ctx.currentTime + 0.1, d = 60 / (j.tempo || 80);
    let t = t0;
    j.notes.forEach(([m, beats]) => {
      if (m != null) note(level === 0 ? musicBus : sfxBus, m, t, beats * d * 0.9, j.wave || 'square', j.vol || 0.14, { vib: 1, lp: j.lp, decay: j.decay, sustain: 0.6 });
      if (m != null && j.bass) note(level === 0 ? musicBus : sfxBus, m - 24, t, beats * d * 0.9, 'triangle', 0.12, { lp: 600 });
      t += beats * d;
    });
  }
  function setLevel(n) { level = n; apply(); if (level === 0 && want && !cur && ctx) start(want); }
  // 場面の候補を順に見て、曲がある最初の場面を鳴らす(例: ['ev:f1_patrol','omen','floor1'])
  const has = sc => { const n = (GM.scenes || {})[sc] || sc; return !!(GM.themes || {})[n]; };
  function scene(list) {
    const hit = list.find(has);
    if (hit) music(hit);
  }
  // イベントの id を規則で場面に読み替える(GM.eventScenes: [{"match":"togo","scene":"togo"}])
  function evScene(id) { const r = (GM.eventScenes || []).find(x => new RegExp(x.match).test(id)); return r ? r.scene : null; }
  // 数値(同化など)が上がった時の探索の曲(GM.varScenes: [{"var":"doka","min":5,"scene":"doka"}])。高い条件を先に書く
  function varScene(vars) { const r = (GM.varScenes || []).find(x => (vars[x.var] || 0) >= x.min && has(x.scene)); return r ? r.scene : null; }
  window.SND = { peek, music, scene, has, evScene, varScene, sfx, tick, jingle, setLevel, get level() { return level; }, get playing() { return cur; } };
})();
