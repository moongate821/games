// audio.js — すべて Web Audio で合成(音声ファイルなし)
// エンジン音: 点火の周波数(回転数/30)ののこぎり波+半分の周波数の矩形波(二輪の鼓動)に、タービンのうなり(ジェット機)を重ねる。
// BGM: 資料の30コースの一覧(ジャンルと BPM)に合わせて、ジャンルごとの型(ドラム・ベース・和音・旋律)で、コースごとに違う調と和音で鳴らす。
//      すべて途切れずに繰り返す(Intro/Loop/Outro を持たない、ループ前提の作り)
// API: SND.resume() / se(name, 位置{z,x}) / update({rpm,thr,engine,nitro,kmh,limit,slide,vol,pan}, 番号) / setBgm(name) / setVol(kind,v) / toggle()
const SND = (() => {
  let ctx = null, master, sfxBus, bgmBus, comp, verb, verbIn, noiseBuf, shaper, muted = false, errors = 0, eng = null;
  const vols = { master: 0.9, sfx: 0.85, bgm: 0.32 };
  let cur = 'title', want = 'title', nextT = 0, step = 0, timer = null, intense = false;
  const ok = () => ctx && ctx.state === 'running';
  function init() {
    const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return;
    ctx = new AC();
    comp = ctx.createDynamicsCompressor(); comp.threshold.value = -14; comp.ratio.value = 4; comp.attack.value = 0.004; comp.release.value = 0.2;
    master = ctx.createGain(); master.gain.value = muted ? 0 : vols.master; master.connect(comp); comp.connect(ctx.destination);
    sfxBus = ctx.createGain(); sfxBus.gain.value = vols.sfx; sfxBus.connect(master);
    bgmBus = ctx.createGain(); bgmBus.gain.value = vols.bgm; bgmBus.connect(master);
    noiseBuf = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate); const d = noiseBuf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    const cv = new Float32Array(1024); for (let i = 0; i < 1024; i++) { const x = i / 512 - 1; cv[i] = Math.tanh(x * 5); } shaper = cv;
    // 残響(減衰するノイズで作ったインパルス応答)
    verb = ctx.createConvolver(); const len = ctx.sampleRate * 2.6, ir = ctx.createBuffer(2, len, ctx.sampleRate);
    for (let c = 0; c < 2; c++) { const a = ir.getChannelData(c); for (let i = 0; i < len; i++) a[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 3.2); }
    verb.buffer = ir; verbIn = ctx.createGain(); verbIn.gain.value = 0.3; verbIn.connect(verb); const vo = ctx.createGain(); vo.gain.value = 0.55; verb.connect(vo); vo.connect(master);
    eng = buildEngine();
    nextT = ctx.currentTime + 0.1;
    timer = setInterval(() => { try { schedule(); } catch (e) { errors++; } }, 25);
  }
  function resume() { try { if (!ctx) init(); if (ctx && ctx.state !== 'running') ctx.resume().catch(() => {}); } catch (e) { errors++; } }
  function out(dest, pan) { if (pan && ctx.createStereoPanner) { const p = ctx.createStereoPanner(); p.pan.value = clamp(pan, -1, 1); p.connect(dest); return p; } return dest; }
  function env(g, t, a, peak, dur) { g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(peak, t + a); g.gain.exponentialRampToValueAtTime(0.0001, t + a + dur); }
  function tone(type, f0, f1, dur, vol, t, dest, o) {
    o = o || {}; const os = ctx.createOscillator(), g = ctx.createGain(); os.type = type; os.frequency.setValueAtTime(Math.max(1, f0), t);
    if (f1 !== f0) os.frequency.exponentialRampToValueAtTime(Math.max(1, f1), t + dur);
    if (o.det) os.detune.value = o.det;
    let node = os; if (o.lp) { const f = ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.setValueAtTime(o.lp, t); if (o.lp2) f.frequency.exponentialRampToValueAtTime(o.lp2, t + dur); f.Q.value = o.q || 1; os.connect(f); node = f; }
    if (o.dist) { const w = ctx.createWaveShaper(); w.curve = shaper; node.connect(w); node = w; }
    node.connect(g); env(g, t, o.a || 0.004, vol, dur); g.connect(o.pan ? out(dest || sfxBus, o.pan) : dest || sfxBus); if (o.verb) { const s = ctx.createGain(); s.gain.value = o.verb; g.connect(s); s.connect(verbIn); }
    os.start(t); os.stop(t + (o.a || 0.004) + dur + 0.05); return os;
  }
  function noise(dur, vol, type, f0, f1, t, dest, o) {
    o = o || {}; const s = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain(); s.buffer = noiseBuf; s.loop = true;
    f.type = type; f.frequency.setValueAtTime(f0, t); if (f1 !== f0) f.frequency.exponentialRampToValueAtTime(f1, t + dur); f.Q.value = o.q || 1;
    s.connect(f); f.connect(g); env(g, t, o.a || 0.003, vol, dur); g.connect(o.pan ? out(dest || sfxBus, o.pan) : dest || sfxBus); if (o.verb) { const v = ctx.createGain(); v.gain.value = o.verb; g.connect(v); v.connect(verbIn); }
    s.start(t, Math.random() * 1.5); s.stop(t + (o.a || 0.003) + dur + 0.05); return f;
  }

  // ---------- エンジン(プレイヤーごと + 近くのAI 1台) ----------
  const engines = [];
  function buildEngine() {
    const e = {};
    e.pan = ctx.createStereoPanner ? ctx.createStereoPanner() : null; if (e.pan) e.pan.connect(sfxBus);
    const dst = e.pan || sfxBus;
    e.g = ctx.createGain(); e.g.gain.value = 0; e.g.connect(dst);
    e.lp = ctx.createBiquadFilter(); e.lp.type = 'lowpass'; e.lp.frequency.value = 600; e.lp.Q.value = 2.2;
    e.sh = ctx.createWaveShaper(); const c = new Float32Array(1024); for (let i = 0; i < 1024; i++) { const x = i / 512 - 1; c[i] = Math.tanh(x * 2.6); } e.sh.curve = c;
    e.am = ctx.createGain(); e.am.gain.value = 0.75;   // 鼓動(低回転で強い、振幅の揺れ)
    e.cut = ctx.createGain(); e.cut.gain.value = 1;   // 回転の上限での点火カット
    e.o1 = ctx.createOscillator(); e.o1.type = 'sawtooth'; e.o2 = ctx.createOscillator(); e.o2.type = 'square'; e.o3 = ctx.createOscillator(); e.o3.type = 'sawtooth'; e.o3.detune.value = 9;
    const m1 = ctx.createGain(); m1.gain.value = 0.5; const m2 = ctx.createGain(); m2.gain.value = 0.35; const m3 = ctx.createGain(); m3.gain.value = 0.3;
    e.o1.connect(m1); e.o2.connect(m2); e.o3.connect(m3); for (const m of [m1, m2, m3]) m.connect(e.sh);
    e.sh.connect(e.lp); e.lp.connect(e.am); e.am.connect(e.cut); e.cut.connect(e.g);
    e.lfo = ctx.createOscillator(); e.lfo.type = 'sine'; e.lfoG = ctx.createGain(); e.lfoG.gain.value = 0.2; e.lfo.connect(e.lfoG); e.lfoG.connect(e.am.gain);
    // タービンのうなり(ジェット機)と、吸気のノイズ
    e.wh = ctx.createOscillator(); e.wh.type = 'sine'; e.whG = ctx.createGain(); e.whG.gain.value = 0; e.wh.connect(e.whG); e.whG.connect(e.g);
    e.wh2 = ctx.createOscillator(); e.wh2.type = 'triangle'; e.wh2G = ctx.createGain(); e.wh2G.gain.value = 0; e.wh2.connect(e.wh2G); e.wh2G.connect(e.g);
    e.nz = ctx.createBufferSource(); e.nz.buffer = noiseBuf; e.nz.loop = true; e.bp = ctx.createBiquadFilter(); e.bp.type = 'bandpass'; e.bp.Q.value = 1.2; e.nzG = ctx.createGain(); e.nzG.gain.value = 0;
    e.nz.connect(e.bp); e.bp.connect(e.nzG); e.nzG.connect(e.g);
    // 風切り音(速さに比例)とタイヤの鳴き(ドリフト中)
    e.wind = ctx.createBufferSource(); e.wind.buffer = noiseBuf; e.wind.loop = true; e.wf = ctx.createBiquadFilter(); e.wf.type = 'lowpass'; e.wf.frequency.value = 500; e.windG = ctx.createGain(); e.windG.gain.value = 0;
    e.wind.connect(e.wf); e.wf.connect(e.windG); e.windG.connect(sfxBus);
    e.sq = ctx.createBufferSource(); e.sq.buffer = noiseBuf; e.sq.loop = true; e.sqf = ctx.createBiquadFilter(); e.sqf.type = 'bandpass'; e.sqf.frequency.value = 2400; e.sqf.Q.value = 6; e.sqG = ctx.createGain(); e.sqG.gain.value = 0;
    e.sq.connect(e.sqf); e.sqf.connect(e.sqG); e.sqG.connect(sfxBus);
    for (const o of [e.o1, e.o2, e.o3, e.lfo, e.wh, e.wh2, e.nz, e.wind, e.sq]) o.start();
    return e;
  }
  function update(s, idx) {
    if (!ok()) return;
    if (!engines[idx]) engines[idx] = idx === 0 ? eng : buildEngine();
    try {
      const t = ctx.currentTime, e = engines[idx], vol = s.vol == null ? 1 : s.vol, tc = 0.03, r = Math.max(0, s.rpm), f = Math.max(18, r / 30), on = s.engine && vol > 0.001;
      e.o1.frequency.setTargetAtTime(f, t, tc); e.o2.frequency.setTargetAtTime(f / 2, t, tc); e.o3.frequency.setTargetAtTime(f * 1.5, t, tc);
      e.lfo.frequency.setTargetAtTime(f / 4, t, tc); e.lfoG.gain.setTargetAtTime(0.45 * Math.max(0, 1 - r / 7000), t, 0.05);
      e.lp.frequency.setTargetAtTime(220 + s.thr * 1800 + r * 0.22 + (s.nitro ? 1500 : 0), t, 0.04);
      e.g.gain.setTargetAtTime(on ? (0.2 + s.thr * 0.09) * vol : 0, t, on ? 0.05 : 0.15);
      e.wh.frequency.setTargetAtTime(f * 3.7 + 300, t, 0.05); e.whG.gain.setTargetAtTime(on ? 0.015 + r / 13000 * 0.05 + (s.nitro ? 0.09 : 0) : 0, t, 0.08);
      e.wh2.frequency.setTargetAtTime(1800 + r * 0.35 + (s.nitro ? 1200 : 0), t, 0.08); e.wh2G.gain.setTargetAtTime(on ? (s.nitro ? 0.05 : 0.008 * r / 13000) : 0, t, 0.1);
      e.bp.frequency.setTargetAtTime(500 + r * 0.35, t, 0.05); e.nzG.gain.setTargetAtTime(on ? s.thr * 0.06 + (s.nitro ? 0.22 : 0) : 0, t, 0.06);
      e.cut.gain.setTargetAtTime(s.limit ? (Math.random() < 0.5 ? 0.15 : 1) : 1, t, 0.005);
      e.windG.gain.setTargetAtTime(Math.min(0.14, s.kmh / 2400) * vol, t, 0.1); e.wf.frequency.setTargetAtTime(300 + s.kmh * 6, t, 0.1);
      e.sqG.gain.setTargetAtTime(s.slide ? 0.16 * vol : 0, t, 0.03); e.sqf.frequency.setTargetAtTime(2100 + Math.random() * 700, t, 0.02);
      if (e.pan) e.pan.pan.setTargetAtTime(s.pan || 0, t, 0.05);
    } catch (err) { errors++; }
  }

  // ---------- 効果音 ----------
  const SE = {
    grind: t => { const f = noise(0.45, 0.4, 'bandpass', 1900, 1500, t, null, { q: 4 }); const l = ctx.createOscillator(), lg = ctx.createGain(); l.frequency.value = 38; lg.gain.value = 900; l.connect(lg); lg.connect(f.frequency); l.start(t); l.stop(t + 0.5); tone('square', 95, 70, 0.4, 0.14, t, null, { lp: 1600 }); tone('sawtooth', 3100, 2600, 0.3, 0.05, t); },
    shift: t => { noise(0.02, 0.12, 'highpass', 4000, 4000, t); tone('sine', 190, 90, 0.06, 0.12, t); },
    overrev: t => tone('sawtooth', 900, 1600, 0.25, 0.08, t, null, { lp: 2500 }),
    knock: t => { tone('sine', 75, 38, 0.12, 0.3, t); noise(0.08, 0.15, 'lowpass', 500, 200, t); },
    stall: t => { for (let i = 0; i < 4; i++) tone('sawtooth', 110 - i * 18, 40, 0.1, 0.18 - i * 0.03, t + i * 0.12, null, { lp: 700 }); },
    start: t => { for (let i = 0; i < 5; i++) tone('square', 48, 44, 0.06, 0.1, t + i * 0.08, null, { lp: 500 }); tone('sawtooth', 60, 140, 0.35, 0.15, t + 0.4, null, { lp: 900 }); },
    jump: t => tone('sine', 300, 760, 0.22, 0.14, t),
    land: t => { noise(0.2, 0.3, 'lowpass', 600, 150, t); tone('sine', 90, 40, 0.2, 0.3, t); },
    slide: t => { noise(0.25, 0.2, 'lowpass', 900, 200, t); tone('sawtooth', 2100, 1700, 0.8, 0.035, t, null, { lp: 3500 }); },
    scrape: t => noise(0.18, 0.2, 'bandpass', 3200, 2400, t, null, { q: 3 }),
    clang: t => { tone('square', 520, 500, 0.3, 0.1, t, null, { lp: 3000, verb: 0.3 }); tone('square', 787, 760, 0.25, 0.07, t); noise(0.1, 0.2, 'highpass', 2000, 2000, t); },
    crash: t => { noise(0.6, 0.5, 'lowpass', 2500, 200, t, null, { verb: 0.3 }); tone('square', 420, 300, 0.4, 0.12, t, null, { lp: 2500 }); tone('sine', 90, 35, 0.4, 0.4, t); },
    overheat: t => { noise(1.2, 0.3, 'highpass', 3000, 6000, t, null, { a: 0.05 }); for (let i = 0; i < 4; i++) tone('square', 880, 880, 0.08, 0.07, t + i * 0.16, null, { lp: 2500 }); },
    turbo: t => { noise(0.5, 0.35, 'bandpass', 400, 3000, t, null, { q: 2 }); tone('sawtooth', 200, 900, 0.4, 0.1, t, null, { lp: 3000 }); },
    pad: t => { tone('square', 660, 1320, 0.12, 0.08, t, null, { lp: 4000 }); tone('square', 990, 1980, 0.12, 0.06, t + 0.05, null, { lp: 4000 }); },
    whoosh: t => noise(0.55, 0.35, 'bandpass', 2400, 500, t, null, { q: 1.5, a: 0.05 }),
    deflect: t => tone('sine', 2000, 3400, 0.08, 0.1, t),
    power: t => [523, 659, 784, 1047, 1319].forEach((f, i) => tone('square', f, f, 0.1, 0.07, t + i * 0.06, null, { lp: 3500, verb: 0.3 })),
    finallap: t => [659, 784, 988, 1319].forEach((f, i) => tone('sawtooth', f, f, 0.14, 0.07, t + i * 0.09, null, { lp: 3500, verb: 0.3 })),
    finish: t => [523, 659, 784, 1047, 784, 1047, 1568].forEach((f, i) => tone('square', f, f, i === 6 ? 0.8 : 0.12, 0.08, t + i * 0.1, null, { lp: 3500, verb: 0.4 })),
    clear: t => [523, 659, 784, 1047].forEach((f, i) => tone('triangle', f, f, 0.5, 0.1, t + i * 0.12, null, { verb: 0.4 })),
    over: t => [440, 415, 392, 311].forEach((f, i) => tone('triangle', f, f, 0.4, 0.12, t + i * 0.3, null, { verb: 0.4 })),
    tick: t => tone('sine', 880, 880, 0.12, 0.14, t),
    go: t => tone('sine', 1760, 1760, 0.5, 0.16, t, null, { verb: 0.3 }),
    coin: t => { tone('square', 988, 988, 0.07, 0.08, t); tone('square', 1319, 1319, 0.25, 0.08, t + 0.07); },
  };
  let seCount = 0, seWin = 0;
  function se(name, pos) {
    if (!ok() || !SE[name]) return;
    const now = ctx.currentTime; if (now - seWin > 0.05) { seWin = now; seCount = 0; } if (++seCount > 10) return;   // 同時に鳴らしすぎない
    try {
      let dest = sfxBus;
      if (pos && typeof P !== 'undefined' && P && pos.z != null) {   // 位置: 遠いほど小さく、左右に振る
        const dz = relZ(pos.z, P.z), v = clamp(1 - Math.abs(dz) / 16000, 0.12, 1), g = ctx.createGain(); g.gain.value = v;
        g.connect(out(sfxBus, pos.x != null ? (pos.x - P.x) * 0.8 : 0)); dest = g;
      }
      withDest(dest, () => SE[name](now + 0.005));
    } catch (e) { errors++; }
  }
  function withDest(dest, fn) { const s = sfxBus; sfxBus = dest; try { fn(); } finally { sfxBus = s; } }

  // ---------- BGM の楽器 ----------
  const B = () => bgmBus;
  const kick = (t, v, hard) => { tone('sine', hard ? 200 : 160, 40, hard ? 0.3 : 0.22, v, t, B(), hard ? { dist: true } : null); if (hard) noise(0.03, v * 0.3, 'highpass', 3000, 3000, t, B()); };
  const snare = (t, v, gated) => { noise(gated ? 0.22 : 0.13, v, 'bandpass', 1800, 1400, t, B(), { q: 0.8, verb: gated ? 0.6 : 0.2 }); tone('triangle', 200, 170, 0.08, v * 0.6, t, B()); };
  const clap = (t, v) => { for (let i = 0; i < 3; i++) noise(0.06, v * (i === 2 ? 1 : 0.5), 'bandpass', 1200, 1100, t + i * 0.012, B(), { q: 1.2, verb: 0.25 }); };
  const hat = (t, v, open, pan) => noise(open ? 0.16 : 0.035, v, 'highpass', 8000, 8000, t, B(), { pan });
  const rim = (t, v) => tone('square', 1700, 1700, 0.025, v, t, B(), { lp: 3000 });
  const metal = (t, v, f) => { noise(0.12, v, 'bandpass', f, f, t, B(), { q: 18 }); tone('square', f * 0.51, f * 0.5, 0.1, v * 0.3, t, B(), { lp: 4000 }); };
  const crush = (t, v) => { noise(0.08, v, 'bandpass', 2600, 900, t, B(), { q: 3 }); tone('square', 3000, 300, 0.05, v * 0.4, t, B()); };
  const sub = (t, f, d, v) => tone('sine', f, f, d, v, t, B());
  const sawBass = (t, f, d, v, lp) => { tone('sawtooth', f, f, d, v, t, B(), { lp: lp || 900, lp2: 180, q: 4 }); tone('square', f / 2, f / 2, d, v * 0.4, t, B(), { lp: 300 }); };
  const acid = (t, f, d, v, acc) => tone('sawtooth', f, f, d, v, t, B(), { lp: 300 + acc * 2600, lp2: 200, q: 14 });
  const reese = (t, f, d, v) => { for (const dt of [-14, 14]) tone('sawtooth', f, f, d, v, t, B(), { lp: 700, det: dt, a: 0.02 }); };
  const pluck = (t, f, v, bright, pan) => tone('sawtooth', f, f, 0.14, v, t, B(), { lp: bright || 3200, lp2: 400, q: 3, verb: 0.2, pan });
  const bell = (t, f, v, pan) => { tone('sine', f, f, 0.9, v, t, B(), { verb: 0.6, pan }); tone('sine', f * 2.76, f * 2.76, 0.3, v * 0.3, t, B(), { pan }); };
  const lead = (t, f, d, v) => { tone('square', f, f, d, v, t, B(), { lp: 2600, a: 0.01, verb: 0.35 }); tone('sawtooth', f * 1.003, f * 1.003, d, v * 0.6, t, B(), { lp: 3000, a: 0.01 }); };
  const supersaw = (t, fs, d, v) => { for (const f of fs) for (const dt of [-24, -9, 0, 9, 24]) tone('sawtooth', f, f, d, v * 0.35, t, B(), { lp: 5000, det: dt, a: 0.005, verb: 0.3 }); };
  function fm(t, f, d, v, ratio, idx) { const c = ctx.createOscillator(), m = ctx.createOscillator(), mg = ctx.createGain(), g = ctx.createGain(); c.frequency.value = f; m.frequency.value = f * ratio; mg.gain.setValueAtTime(f * idx, t); mg.gain.exponentialRampToValueAtTime(f * 0.1 + 1, t + d); m.connect(mg); mg.connect(c.frequency); c.connect(g); env(g, t, 0.003, v, d); g.connect(B()); c.start(t); m.start(t); c.stop(t + d + 0.05); m.stop(t + d + 0.05); }
  function wobble(t, f, d, v, rate) { const o1 = ctx.createOscillator(), o2 = ctx.createOscillator(), lp = ctx.createBiquadFilter(), l = ctx.createOscillator(), lg = ctx.createGain(), g = ctx.createGain(); o1.type = 'sawtooth'; o2.type = 'square'; o1.frequency.value = f; o2.frequency.value = f * 1.005; lp.type = 'lowpass'; lp.frequency.value = 600; lp.Q.value = 8; l.frequency.value = rate; lg.gain.value = 500; l.connect(lg); lg.connect(lp.frequency); o1.connect(lp); o2.connect(lp); lp.connect(g); env(g, t, 0.01, v, d); g.connect(B()); for (const o of [o1, o2, l]) { o.start(t); o.stop(t + d + 0.05); } }
  function pad(t, fs, dur, v, lpf) { for (const f of fs) for (const d of [-8, 8]) { const os = ctx.createOscillator(), g = ctx.createGain(), lp = ctx.createBiquadFilter(); os.type = 'sawtooth'; os.frequency.value = f; os.detune.value = d; lp.type = 'lowpass'; lp.frequency.value = lpf || 1100; os.connect(lp); lp.connect(g); g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(v, t + dur * 0.3); g.gain.linearRampToValueAtTime(0.0001, t + dur); g.connect(B()); const s = ctx.createGain(); s.gain.value = 0.4; g.connect(s); s.connect(verbIn); os.start(t); os.stop(t + dur + 0.05); } }
  function brass(t, fs, dur, v) { for (const f of fs) { tone('sawtooth', f, f, dur, v, t, B(), { lp: 3200, lp2: 500, q: 2, a: 0.03, verb: 0.4 }); tone('sawtooth', f / 2, f / 2, dur, v * 0.8, t, B(), { lp: 1500, lp2: 300, a: 0.03 }); } }
  function vox(t, f, dur, v) {   // 声(母音のフィルタ)
    const fm2 = [[720, 1180], [500, 900], [350, 2200]][Math.floor(t * 3) % 3], mix = ctx.createGain(), g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(v, t + 0.03); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    for (const fr of fm2) { const b = ctx.createBiquadFilter(); b.type = 'bandpass'; b.frequency.value = fr; b.Q.value = 8; mix.connect(b); b.connect(g); }
    const o = ctx.createOscillator(); o.type = 'sawtooth'; o.frequency.value = f; o.connect(mix); o.start(t); o.stop(t + dur + 0.05);
    g.connect(B()); const s = ctx.createGain(); s.gain.value = 0.3; g.connect(s); s.connect(verbIn);
  }
  const riser = (t, d, v) => noise(d, v, 'bandpass', 300, 6000, t, B(), { q: 2, a: d * 0.9 });
  const epiano = (t, fs, v) => { for (const f of fs) { tone('sine', f, f, 1.2, v, t, B(), { verb: 0.3 }); tone('sine', f * 4, f * 4, 0.15, v * 0.2, t, B()); } };

  // ---------- 30コースの曲(ジャンルの型 × コースごとの調・和音) ----------
  const SCALES = { minor: [0, 2, 3, 5, 7, 8, 10], phryg: [0, 1, 3, 5, 7, 8, 10], dorian: [0, 2, 3, 5, 7, 9, 10], major: [0, 2, 4, 5, 7, 9, 11], penta: [0, 2, 4, 7, 9], hminor: [0, 2, 3, 5, 7, 8, 11] };
  const px = (s, i) => s[i % s.length] !== '.';   // パターン文字列: '.' 以外で鳴らす
  function mk(root, scale, prog) {   // 音階の番号 → 周波数
    const sc = SCALES[scale];
    const n = (deg, oct) => { const k = Math.floor(deg / sc.length); return root * Math.pow(2, (sc[((deg % sc.length) + sc.length) % sc.length] + 12 * (k + (oct || 0))) / 12); };
    const ch = b => { const d = prog[b % prog.length]; return [n(d, 0), n(d + 2, 0), n(d + 4, 0)]; };
    return { n, ch, rootDeg: b => prog[b % prog.length] };
  }
  const GEN = {
    synthwave: (i, b, t, k) => { if (px('x...x...x...x...', i)) kick(t, 0.5); if (i === 4 || i === 12) snare(t, 0.16, true); if (i % 4 === 2) hat(t, 0.05); if (i % 2 === 0) sawBass(t, k.n(k.rootDeg(b), -2), 0.13, 0.11); pluck(t, k.ch(b)[i % 3] * (i % 8 < 4 ? 2 : 4), 0.03); if (i === 0) pad(t, k.ch(b), 2.2, 0.02); if (b % 2 && [0, 3, 6, 10].includes(i)) lead(t, k.n(k.rootDeg(b) + [4, 2, 3, 1][[0, 3, 6, 10].indexOf(i)], 1), 0.3, 0.035); },
    techno: (i, b, t, k) => { if (i % 4 === 0) kick(t, 0.6, true); if (i === 4 || i === 12) clap(t, 0.14); hat(t, i % 4 === 2 ? 0.07 : 0.025, i % 4 === 2); if (px('x..x..x...x..x..', i)) fm(t, k.n(k.rootDeg(b), -1), 0.12, 0.09, 3.5, 3); if (i % 4 === 2) sub(t, k.n(k.rootDeg(b), -2), 0.1, 0.12); if (b % 4 === 3 && i > 11) crush(t, 0.05); },
    dnb: (i, b, t, k) => { if (i === 0 || i === 10) kick(t, 0.55); if (i === 4 || i === 12) snare(t, 0.18); if ([7, 9, 14].includes(i)) snare(t, 0.05); hat(t, 0.03 + (i % 2) * 0.02); if (i === 0) reese(t, k.n(k.rootDeg(b), -2), 1.4, 0.07); if (i === 0 && b % 2 === 0) pad(t, k.ch(b), 3.5, 0.02, 1600); if (i % 4 === 2) bell(t, k.ch(b)[(i >> 2) % 3] * 4, 0.02); },
    industrial: (i, b, t, k) => { if (px('x...x...x..xx...', i)) kick(t, 0.6, true); if (i === 4 || i === 12) { snare(t, 0.16); crush(t, 0.06); } if (Math.random() < 0.3) metal(t, 0.05, 2000 + Math.random() * 3000); if (i % 2 === 0) tone('sawtooth', k.n(k.rootDeg(b), -2), k.n(k.rootDeg(b), -2), 0.12, 0.09, t, B(), { lp: 900, dist: true }); if (i === 0 && b % 4 === 0) noise(1.2, 0.05, 'lowpass', 400, 3000, t, B()); },
    darksynth: (i, b, t, k) => { if (i % 4 === 0) kick(t, 0.55, true); if (i === 4 || i === 12) snare(t, 0.17, true); if (i % 2 === 1) hat(t, 0.04); sawBass(t, k.n(k.rootDeg(b), i % 4 === 2 ? -1 : -2), 0.1, 0.1, 1300); if (i === 0) brass(t, k.ch(b).map(f => f / 2), 0.6, 0.05); if (i % 2 === 0) pluck(t, k.ch(b)[(i >> 1) % 3] * 2, 0.025, 2000); },
    trap: (i, b, t, k) => { if (px('x......x..x.....', i)) kick(t, 0.5); if (i === 8) clap(t, 0.18); hat(t, 0.035); if (i >= 12 && b % 2) hat(t + 0.06, 0.03); if (i === 0 || i === 10) tone('sine', k.n(k.rootDeg(b), -2) * 1.02, k.n(k.rootDeg(b), -2), 0.6, 0.18, t, B(), { dist: true }); if ([0, 3, 6, 8, 11].includes(i)) pluck(t, k.n([0, 2, 4, 1, 3][[0, 3, 6, 8, 11].indexOf(i)] + k.rootDeg(b), 1), 0.04, 2400); },
    trance: (i, b, t, k) => { if (i % 4 === 0) kick(t, 0.55); if (i % 4 === 2) { sawBass(t, k.n(k.rootDeg(b), -1), 0.1, 0.09, 1200); hat(t, 0.07, true); } if (i === 4 || i === 12) clap(t, 0.1); pluck(t, k.ch(b)[i % 3] * (i % 2 ? 4 : 2), 0.025, 3500); if (i % 4 === 2 && b % 2) supersaw(t, k.ch(b).map(f => f * 2), 0.12, 0.03); if (b % 8 === 7 && i === 0) riser(t, 1.6, 0.06); },
    dubstep: (i, b, t, k) => { if (i === 0 || i === 3) kick(t, 0.55); if (i === 8) snare(t, 0.2); if (i % 2 === 1) hat(t, 0.03); if (i % 4 === 0) wobble(t, k.n(k.rootDeg(b), -2), 0.4, 0.13, [2, 4, 8, 6][(b + (i >> 2)) % 4]); if (i === 0 && b % 2 === 0) pad(t, k.ch(b), 3, 0.015); },
    glitchhop: (i, b, t, k) => { if (px('x.....x...x.....', i)) kick(t, 0.5); if (i === 4 || i === 12) crush(t, 0.12); if (Math.random() < 0.25) tone('square', 400 + Math.random() * 2400, 200, 0.03, 0.03, t, B(), { pan: Math.random() * 2 - 1 }); if (i % 4 === 0) fm(t, k.n(k.rootDeg(b), -1), 0.18, 0.1, 2, 4); if (i % 2 === 1) hat(t, 0.03); },
    electro: (i, b, t, k) => { if (i % 4 === 0) kick(t, 0.55); if (i === 4 || i === 12) clap(t, 0.15); if (i % 4 === 2) hat(t, 0.06, true); if (i % 2 === 0) sawBass(t, k.n(k.rootDeg(b), i % 4 === 2 ? -1 : -2), 0.12, 0.1, 1500); if (i % 4 === 2) for (const f of k.ch(b)) vox(t, f, 0.18, 0.03); },
    acid: (i, b, t, k) => { if (i % 4 === 0) kick(t, 0.55); if (i % 4 === 2) hat(t, 0.06, true); if (i === 4 || i === 12) clap(t, 0.1); const line = [0, 0, 7, 0, 3, 0, 10, 5, 0, 12, 0, 3, 7, 0, 5, 3]; acid(t, k.n(k.rootDeg(b), -1) * Math.pow(2, line[i] / 12), 0.1, 0.08, (i % 3 === 0 ? 0.6 : 0.2) + 0.4 * Math.sin(b * 0.7 + i * 0.1)); },
    minimal: (i, b, t, k) => { if (i % 4 === 0) kick(t, 0.5); if (px('..x.......x..x..', i)) rim(t, 0.05); if (i % 4 === 2) hat(t, 0.03); if (px('x..x....x..x....', i)) pluck(t, k.n(k.rootDeg(b) + (i % 8 === 0 ? 0 : 2), 1), 0.035, 1500 + (b % 8) * 300); if (i % 8 === 4) sub(t, k.n(k.rootDeg(b), -2), 0.2, 0.12); if (b % 8 === 7 && i === 0) noise(1.8, 0.04, 'highpass', 800, 9000, t, B(), { a: 1.5 }); },
    liquid: (i, b, t, k) => { if (i === 0 || i === 10) kick(t, 0.45); if (i === 4 || i === 12) snare(t, 0.12); hat(t, 0.02 + (i % 2) * 0.015); if (i % 8 === 0) sub(t, k.n(k.rootDeg(b), -2), 0.9, 0.14); if (i === 0) epiano(t, k.ch(b), 0.04); if (i === 8 && b % 2) epiano(t, k.ch(b + 1), 0.03); },
    chillwave: (i, b, t, k) => { if (i === 0 || i === 8) kick(t, 0.35); if (i === 4 || i === 12) snare(t, 0.08, true); if (i % 4 === 2) hat(t, 0.02); if (i === 0) pad(t, k.ch(b), 2.4, 0.03, 900); if ([0, 6, 10].includes(i) && b % 2) lead(t, k.n(k.rootDeg(b) + [4, 2, 0][[0, 6, 10].indexOf(i)], 0), 0.5, 0.025); if (i % 4 === 0) sub(t, k.n(k.rootDeg(b), -2), 0.4, 0.08); },
    bassline: (i, b, t, k) => { if (i % 4 === 0) kick(t, 0.55); if (i === 4 || i === 12) snare(t, 0.14); if (i % 2 === 1) hat(t + 0.02, 0.04); if (px('x..x..x.x..x.x..', i)) fm(t, k.n(k.rootDeg(b), -1) * (i % 3 === 0 ? 2 : 1), 0.12, 0.1, 1, 6); },
    idm: (i, b, t, k) => { if (i % 3 === 0 && Math.random() < 0.8) kick(t, 0.4); if (i % 5 === 2) crush(t, 0.07); if (Math.random() < 0.4) rim(t, 0.03); if (i % 5 === 0) bell(t, k.ch(b)[(i + b) % 3] * 4, 0.025, Math.sin(i) * 0.7); if (i === 0) pad(t, k.ch(b), 2, 0.02, 1400); },
    synthpop: (i, b, t, k) => { if (i === 0 || i === 8) kick(t, 0.5); if (i === 4 || i === 12) snare(t, 0.14); if (i % 2 === 1) hat(t, 0.035); if (i % 2 === 0) { for (const f of k.ch(b)) tone('square', f * 2, f * 2, 0.1, 0.012, t, B(), { lp: 3000 }); sawBass(t, k.n(k.rootDeg(b), -1), 0.1, 0.08, 1400); } if ([0, 2, 4, 7, 10].includes(i) && b % 2 === 0) lead(t, k.n(k.rootDeg(b) + [0, 2, 4, 3, 1][[0, 2, 4, 7, 10].indexOf(i)], 1), 0.2, 0.03); },
    cyberpop: (i, b, t, k) => { if (i % 4 === 0) kick(t, 0.55); if (i === 4 || i === 12) clap(t, 0.15); hat(t, i % 2 ? 0.04 : 0.02); if (px('x..x..x...x.x...', i)) vox(t, k.n(k.rootDeg(b) + (i % 3), 1), 0.12, 0.05); if (i % 4 === 2) supersaw(t, k.ch(b).map(f => f * 2), 0.12, 0.03); pluck(t, k.ch(b)[i % 3] * 4, 0.02, 4000); },
    ambient: (i, b, t, k) => { if (i % 4 === 0) kick(t, 0.45); if (i % 8 === 6) hat(t, 0.03, true); if (i % 6 === 0) bell(t, k.ch(b)[(i / 6 + b) % 3 | 0] * 4, 0.035, (i % 2) - 0.5); if (i === 0 && b % 2 === 0) pad(t, k.ch(b), 4, 0.03, 1300); },
    hardstyle: (i, b, t, k) => { if (i % 4 === 0) kick(t, 0.7, true); if (i % 4 === 2) tone('sawtooth', k.n(k.rootDeg(b), -1) * 0.5, k.n(k.rootDeg(b), -1), 0.14, 0.09, t, B(), { lp: 1500, dist: true }); if (i === 4 || i === 12) clap(t, 0.12); if (b % 2 && i % 2 === 0) lead(t, k.n(k.rootDeg(b) + [0, 0, 2, 4, 3, 2, 0, 1][i >> 1], 1), 0.1, 0.035); },
    psytrance: (i, b, t, k) => { if (i % 4 === 0) kick(t, 0.6); else acid(t, k.n(k.rootDeg(b), -2), 0.07, 0.09, 0.3); if (i % 4 === 2) hat(t, 0.06, true); if (i % 8 === 6) fm(t, k.n(k.rootDeg(b) + 4, 1), 0.25, 0.04, 1.5, 8); if (b % 8 === 7 && i === 0) riser(t, 1.7, 0.05); },
    slowwave: (i, b, t, k) => { if (i === 0) kick(t, 0.4); if (i === 8) snare(t, 0.1, true); if (i % 4 === 2) hat(t, 0.02); if (i === 0) { pad(t, k.ch(b), 2.6, 0.035, 900); brass(t, [k.ch(b)[0] / 2], 2, 0.02); } if (i % 4 === 0 && b % 2) bell(t, k.ch(b)[(i >> 2) % 3] * 2, 0.03); },
    proghouse: (i, b, t, k) => { if (i % 4 === 0) kick(t, 0.55); if (i % 4 === 2) { hat(t, 0.05, true); sawBass(t, k.n(k.rootDeg(b), -1), 0.1, 0.09, 1000); } if (i === 4 || i === 12) clap(t, 0.1); pluck(t, k.ch(b)[(i * 2) % 3] * 2, 0.03, 600 + (b % 16) * 200); if (b % 16 === 15 && i === 0) riser(t, 1.8, 0.06); },
    darkambient: (i, b, t, k) => { if (i === 0 || i === 3) tone('sine', 70, 40, 0.3, 0.3, t, B(), { lp: 200 }); if (i === 0 && b % 2 === 0) pad(t, [k.n(k.rootDeg(b), -1), k.n(k.rootDeg(b) + 1, -1)], 4, 0.04, 500); if (Math.random() < 0.05) noise(1.2, 0.03, 'bandpass', 200 + Math.random() * 800, 2000, t, B(), { q: 4, a: 0.6 }); },
    breakbeat: (i, b, t, k) => { if (px('x.....x...x.....', i)) kick(t, 0.5); if (i === 4 || i === 12) snare(t, 0.16); if ([7, 15].includes(i)) snare(t, 0.06); if (b % 4 === 3 && i >= 12) snare(t, 0.08); hat(t, 0.03); if (px('x..x.x....x.x...', i)) sawBass(t, k.n(k.rootDeg(b) + (i % 5 === 0 ? 2 : 0), -1), 0.12, 0.1, 1800); },
    uplifting: (i, b, t, k) => { if (i % 4 === 0) kick(t, 0.55); if (i % 4 === 2) { sawBass(t, k.n(k.rootDeg(b), -1), 0.1, 0.09, 1200); hat(t, 0.06, true); } if (i === 4 || i === 12) clap(t, 0.1); pluck(t, k.ch(b)[i % 3] * 4, 0.025, 5000); if (i % 8 === 0) supersaw(t, [k.n(k.rootDeg(b) + [0, 4, 2, 5][(b + (i >> 3)) % 4], 1)], 0.5, 0.05); if (b % 8 === 7 && i === 0) riser(t, 1.6, 0.06); },
    glitch: (i, b, t, k) => { if (Math.random() < 0.35) kick(t, 0.4); if (Math.random() < 0.2) crush(t, 0.06); for (let q = 0; q < 2; q++) if (Math.random() < 0.3) tone(Math.random() < 0.5 ? 'square' : 'sine', 200 + Math.random() * 4000, 100 + Math.random() * 3000, 0.02 + Math.random() * 0.05, 0.03, t + q * 0.03, B(), { pan: Math.random() * 2 - 1 }); if (i === 0) pad(t, k.ch(b), 1.8, 0.02, 1200); },
    ebm: (i, b, t, k) => { if (i % 4 === 0) kick(t, 0.6, true); if (i === 4 || i === 12) snare(t, 0.18); const seq = [0, 0, 7, 0, 0, 5, 0, 3, 0, 0, 7, 0, 10, 0, 5, 3]; tone('square', k.n(k.rootDeg(b), -2) * Math.pow(2, seq[i] / 12), k.n(k.rootDeg(b), -2) * Math.pow(2, seq[i] / 12), 0.09, 0.08, t, B(), { lp: 900 + (i % 4) * 300 }); if (i % 2 === 1) hat(t, 0.03); },
    speedcore: (i, b, t, k) => { if (i % 2 === 0) kick(t, 0.55, true); if (i % 8 === 4) snare(t, 0.15); if (Math.random() < 0.3) noise(0.05, 0.05, 'highpass', 3000, 3000, t, B()); if (i % 4 === 0) tone('sawtooth', k.n(k.rootDeg(b) + [0, 3, 5, 7][(i >> 2)], 1), k.n(k.rootDeg(b) + [0, 3, 5, 7][(i >> 2)], 1), 0.1, 0.04, t, B(), { lp: 3500, dist: true }); },
    title: (i, b, t, k) => { if (i === 0) kick(t, 0.35); if (i === 8) snare(t, 0.08, true); if (i === 0) pad(t, k.ch(b), 2.4, 0.03, 1000); if (i % 2 === 0) pluck(t, k.ch(b)[(i >> 1) % 3] * 2, 0.025, 1800); },
    result: (i, b, t, k) => { if (i === 0) pad(t, k.ch(b), 2.4, 0.03, 1200); if (i % 4 === 0) bell(t, k.ch(b)[(i >> 2) % 3] * 4, 0.03); },
  };
  const TR = {};   // 曲名 → { bpm, fn, k }
  function track(name, genre, bpm, root, scale, prog) { TR[name] = { bpm, fn: GEN[genre] || GEN.synthwave, k: mk(root, scale, prog) }; }
  const ROOTS = [110, 116.5, 123.5, 130.8, 138.6, 146.8, 155.6, 98, 103.8];
  const PROGS = [[0, 5, 3, 4], [0, 3, 4, 3], [0, 6, 5, 4], [0, 2, 5, 4], [0, 0, 3, 5], [0, 4, 5, 3], [0, 5, 6, 4]];
  const SCALE_OF = { trap: 'penta', ebm: 'phryg', industrial: 'phryg', darksynth: 'hminor', synthpop: 'major', cyberpop: 'major', uplifting: 'minor', proghouse: 'dorian', liquid: 'dorian', chillwave: 'dorian', electro: 'minor', slowwave: 'major' };
  track('title', 'title', 96, 110, 'minor', [0, 5, 3, 4]); track('result', 'result', 90, 130.8, 'major', [0, 4, 5, 3]);
  if (typeof COURSES !== 'undefined') COURSES.forEach((c, i) => track('c' + c.no, c.bgm.genre, c.bgm.bpm, ROOTS[i % ROOTS.length], SCALE_OF[c.bgm.genre] || 'minor', PROGS[(i * 3) % PROGS.length]));
  function schedule() {
    if (!ok()) { nextT = ctx ? ctx.currentTime + 0.05 : 0; return; }
    while (nextT < ctx.currentTime + 0.12) {
      if (want !== cur && (step & 3) === 0) { cur = want; step = 0; }
      const tr = TR[cur] || TR.title;
      if (vols.bgm > 0.001) try { tr.fn(step & 15, step >> 4, nextT, tr.k); if (intense && (step & 1)) hat(nextT, 0.03); } catch (e) { errors++; }
      nextT += 60 / tr.bpm / 4; step++;
    }
  }
  function setBgm(name) { if (TR[name]) want = name; }
  function setVol(kind, v) { vols[kind] = clamp(v, 0, 1); if (!ctx) return; const n = kind === 'master' ? master : kind === 'sfx' ? sfxBus : bgmBus; n.gain.setTargetAtTime(kind === 'master' && muted ? 0 : vols[kind], ctx.currentTime, 0.03); }
  function toggle() { muted = !muted; if (master) master.gain.setTargetAtTime(muted ? 0 : vols.master, ctx.currentTime, 0.05); return muted; }
  return { resume, se, update: (s, i) => { update(s, i || 0); if (!i) intense = !!s.intense; }, setBgm, setVol, toggle,
    get context() { return ctx; }, get tap() { return comp; }, get errors() { return errors; }, get running() { return ok(); }, tracks: Object.keys(TR), seNames: Object.keys(SE) };
})();
