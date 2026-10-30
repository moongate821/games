// STARFIGHTER — サウンド v3(2026-09-26 その8)。Web Audio で作る、映画風のオーケストラ+電子音の BGM(40曲)と、立体音響の効果音。外部の音声ファイルは不要。
// ネットで調べて取り入れたこと:
//  ・残響: 「指数関数で減衰するノイズ」に、時間とともに下がるローパス(高い音から先に消える)と、初期反射をつけた、左右で別々の残響(reverbGen の方法)
//  ・弦: 少しずらしたノコギリ波+パルス波、遅れてかかるビブラート、弓のこすれ(ノイズ)、そして弦セクション全体に3本の揺れる遅延(アンサンブル・コーラス)
//  ・金管: 低いフィルタから開く音色(強く吹くほど明るい)、出だしの音程のしゃくり、80Hzのうなり(growl)、遅れてかかるビブラート、息のノイズ
//  ・打楽器: 太鼓(和太鼓)=高い音から一気に下がる正弦波+皮の音(ノイズ)、ティンパニ=非整数倍音、スネア、シンバルの逆回し、「ブワーン」(braam)
//  ・撥弦(ハープ)= Karplus-Strong、ピアノ=非整数倍音の加算合成。どちらも最初に一度だけ波形を作って、使い回す
//  ・曲: 映画でよく使う和音進行(i-bVI-bIII-bVII、I-bVI-IV、bVI-v-i など)、動機のくりかえしと変形、弦の刻み(オスティナート)、
//        場面の激しさに合わせて楽器を重ねる(縦の重ね方。戦闘が激しいと、刻みと打楽器が加わる)
//  ・効果音: 出だし(トランジェント)+本体+余韻の3層。爆発は、低音の衝撃を少し先に、本体(歪ませたノイズ)、パチパチ(破片)、長い残響
// 使い方: SND.resume()(ユーザー操作の中で)、SND.se('shotC')、SND.se('boomS', 世界の位置)、
//        SND.update({thrust, alarm, bgm, intense, listener:{p,r,u,f}})、SND.toggle()(ミュート)
const SND = (() => {
  let ctx = null, master = null, sfxBus = null, bgmBus = null, musicDuck = null, noiseBuf = null, muted = false, wantResume = false;
  const last = {}, pending = [], loops = {}, SEC = {}, TG = {};
  const bgm = { name: null, step: 0, next: 0 };
  let inten = 0, lvl = 0.3, spat = null, LST = null, bgmDly = null, comp = null, revIn = null, spaceIn = null, analyser = null, duckUntil = 0;
  const vols = { master: 0.85, sfx: 0.85, bgm: 0.3 };
  let fmStyle = true, fmBgm = true, alarmNext = 0, errCount = 0, lastErr = '';
  const clamp = (x, a, b) => x < a ? a : x > b ? b : x;

  // ---------- 残響(reverbGen の方法: 減衰するノイズ+下がっていくローパス+初期反射。左右は別のノイズ) ----------
  function makeIR(sec, decay, lp0, lp1, pre, er) {
    const sr = ctx.sampleRate, n = Math.floor(sr * sec), b = ctx.createBuffer(2, n, sr), p0 = Math.floor(pre * sr), k60 = Math.pow(0.001, 1 / (decay * sr));
    for (let c = 0; c < 2; c++) {
      const d = b.getChannelData(c); let env = 1, y = 0, a = 0;
      for (let i = p0; i < n; i++) {
        if ((i - p0) % 64 === 0) { const u = Math.min(1, (i - p0) / (decay * sr)), fc = lp0 * Math.pow(lp1 / lp0, u); a = Math.exp(-2 * Math.PI * fc / sr); }
        const fade = Math.min(1, (i - p0) / (0.01 * sr)); y = (1 - a) * (Math.random() * 2 - 1) + a * y; d[i] = y * env * fade * 2.2; env *= k60;
      }
      for (const [dt, g] of er) { const k = Math.floor((pre + dt + (c ? 0.0009 : 0) * Math.random()) * sr); if (k < n) d[k] += g * (0.75 + 0.5 * Math.random()) * (Math.random() < 0.5 ? -1 : 1); }
    }
    return b;
  }
  function chorusNet(input, out, dry = 0.62, wet = 0.42) {   // アンサンブル・コーラス: 揺れる3本の遅延(弦・合唱に)
    const d0 = ctx.createGain(); d0.gain.value = dry; input.connect(d0); d0.connect(out);
    [[0.012, 0.31, 0.0024, -0.7], [0.017, 0.43, 0.003, 0], [0.023, 0.57, 0.0027, 0.7]].forEach(([base, rate, depth, pan]) => {
      const dl = ctx.createDelay(0.1), lfo = ctx.createOscillator(), lg = ctx.createGain(), g = ctx.createGain(), pn = ctx.createStereoPanner ? ctx.createStereoPanner() : null;
      dl.delayTime.value = base; lfo.frequency.value = rate; lg.gain.value = depth; lfo.connect(lg); lg.connect(dl.delayTime); lfo.start();
      g.gain.value = wet; input.connect(dl); dl.connect(g); if (pn) { pn.pan.value = pan; g.connect(pn); pn.connect(out); } else g.connect(out);
    });
  }
  function driveCurve(k) { const n = 512, c = new Float32Array(n); for (let i = 0; i < n; i++) { const x = i / (n - 1) * 2 - 1; c[i] = Math.tanh(x * k) / Math.tanh(k); } return c; }
  function ensure() {
    if (ctx) return ctx;
    try {
      ctx = new (window.AudioContext || window.webkitAudioContext)();
      master = ctx.createGain(); master.gain.value = muted ? 0 : vols.master;
      comp = ctx.createDynamicsCompressor(); comp.threshold.value = -16; comp.knee.value = 12; comp.ratio.value = 3; comp.attack.value = 0.008; comp.release.value = 0.25;
      master.connect(comp);
      const limiter = ctx.createDynamicsCompressor(); limiter.threshold.value = -2.5; limiter.knee.value = 0; limiter.ratio.value = 20; limiter.attack.value = 0.002; limiter.release.value = 0.12;
      comp.connect(limiter); limiter.connect(ctx.destination);
      sfxBus = ctx.createGain(); sfxBus.gain.value = vols.sfx; sfxBus.connect(master);
      bgmBus = ctx.createGain(); bgmBus.gain.value = vols.bgm;
      musicDuck = ctx.createGain(); musicDuck.gain.value = 1; bgmBus.connect(musicDuck); musicDuck.connect(master);
      // 残響: ホール(音楽と効果音)と、宇宙の深い残響(爆発・大きな音の余韻)
      const hall = ctx.createConvolver(); hall.buffer = makeIR(3.2, 2.6, 11000, 1300, 0.022, [[0.011, 0.5], [0.017, 0.42], [0.024, 0.38], [0.031, 0.33], [0.043, 0.27], [0.052, 0.22], [0.068, 0.18]]);
      revIn = ctx.createGain(); revIn.connect(hall); const ho = ctx.createGain(); ho.gain.value = 0.5; hall.connect(ho); ho.connect(master);
      const space = ctx.createConvolver(); space.buffer = makeIR(5, 4.2, 5000, 380, 0.04, [[0.03, 0.3], [0.061, 0.24], [0.097, 0.18]]);
      spaceIn = ctx.createGain(); spaceIn.connect(space); const so = ctx.createGain(); so.gain.value = 0.45; space.connect(so); so.connect(master);
      const sr1 = ctx.createGain(); sr1.gain.value = 0.1; sfxBus.connect(sr1); sr1.connect(revIn);
      const sr2 = ctx.createGain(); sr2.gain.value = 0.07; sfxBus.connect(sr2); sr2.connect(spaceIn);
      const dl = ctx.createDelay(1), fb = ctx.createGain(), dlf = ctx.createBiquadFilter(), sd = ctx.createGain();   // 効果音の短いエコー
      dl.delayTime.value = 0.21; fb.gain.value = 0.25; dlf.type = 'lowpass'; dlf.frequency.value = 2600; sd.gain.value = 0.06;
      sfxBus.connect(sd); sd.connect(dl); dl.connect(dlf); dlf.connect(fb); fb.connect(dl); dlf.connect(master);
      // BGM のエコー(テンポに合わせた付点8分)
      bgmDly = ctx.createDelay(2); const bfb = ctx.createGain(), blf = ctx.createBiquadFilter(), bdo = ctx.createGain();
      bfb.gain.value = 0.36; blf.type = 'lowpass'; blf.frequency.value = 2200; bgmDly.delayTime.value = 0.4; bdo.gain.value = 0.8;
      bgmDly.connect(blf); blf.connect(bfb); bfb.connect(bgmDly); blf.connect(bdo); bdo.connect(bgmBus);
      // 楽器の部門(それぞれ、残響の量と音の加工が違う)
      const mk = (name, lvl, rev, spc, dly, fx) => { const i = ctx.createGain(), o = ctx.createGain(); o.gain.value = lvl; if (fx) fx(i, o); else i.connect(o); o.connect(bgmBus); const send = (dst, v) => { if (!v) return; const g = ctx.createGain(); g.gain.value = v; o.connect(g); g.connect(dst); }; send(revIn, rev); send(spaceIn, spc); send(bgmDly, dly); SEC[name] = i; };
      mk('str', 1, 0.5, 0.06, 0, (i, o) => { const hs = ctx.createBiquadFilter(); hs.type = 'highshelf'; hs.frequency.value = 5200; hs.gain.value = -5; chorusNet(i, hs); hs.connect(o); });
      mk('brass', 0.95, 0.42, 0.05, 0, (i, o) => { const ws = ctx.createWaveShaper(), hs = ctx.createBiquadFilter(); ws.curve = driveCurve(1.4); hs.type = 'highshelf'; hs.frequency.value = 4800; hs.gain.value = -4; i.connect(ws); ws.connect(hs); hs.connect(o); });
      mk('choir', 0.85, 0.6, 0.14, 0, (i, o) => chorusNet(i, o, 0.55, 0.45));
      mk('perc', 1, 0.36, 0.1, 0);
      mk('synth', 0.75, 0.24, 0, 0.28);
      mk('pad', 0.7, 0.45, 0.08, 0);
      mk('bass', 0.95, 0.05, 0, 0, (i, o) => { const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 1800; i.connect(lp); lp.connect(o); });
      mk('pluck', 0.85, 0.45, 0.05, 0.22);
      mk('fx', 0.85, 0.3, 0.3, 0);
      analyser = ctx.createAnalyser(); analyser.fftSize = 1024; master.connect(analyser);
      noiseBuf = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
      const d = noiseBuf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
      PW = ctx.createPeriodicWave(...pulseCoefs(0.25));
    } catch (e) { ctx = null; lastErr = 'init: ' + e.message; }
    return ctx;
  }
  let PW = null;
  function pulseCoefs(duty) { const N = 40, re = new Float32Array(N), im = new Float32Array(N); for (let k = 1; k < N; k++) { re[k] = 2 * Math.sin(Math.PI * k * duty) / (Math.PI * k) * Math.cos(Math.PI * k * duty); im[k] = 2 * Math.sin(Math.PI * k * duty) / (Math.PI * k) * Math.sin(Math.PI * k * duty); } return [re, im]; }
  function resume() {   // ブラウザの制限のため、キー・タッチ・クリックの中で呼ぶ
    if (!ensure()) return;
    wantResume = true;
    if (ctx.state !== 'running') {
      try { const b = ctx.createBuffer(1, 1, 22050), src = ctx.createBufferSource(); src.buffer = b; src.connect(ctx.destination); src.start(0); } catch (e) { /* 無視 */ }
      ctx.resume().then(() => { while (pending.length) se(pending.shift()); }).catch(() => {});
    }
    warmup();
  }
  const ok = () => ctx && ctx.state === 'running' && !muted;
  const mf = m => 440 * Math.pow(2, (m - 69) / 12);
  const OUT = () => spat || sfxBus;
  const R = n => { const x = Math.sin(n * 127.1) * 43758.5453; return x - Math.floor(x); };

  // ---------- 立体音響 ----------
  function spatialInfo(pos) {
    const L = LST, dx = pos[0] - L.p[0], dy = pos[1] - L.p[1], dz = pos[2] - L.p[2], d = Math.hypot(dx, dy, dz) || 1, nx = dx / d, ny = dy / d, nz = dz / d;
    const az = nx * L.r[0] + ny * L.r[1] + nz * L.r[2], fr = nx * L.f[0] + ny * L.f[1] + nz * L.f[2];
    return { pan: Math.max(-0.88, Math.min(0.88, az * 1.1)), fr, d, gain: Math.max(0.16, 1 / (1 + d / 2200)) * (fr < 0 ? 0.82 : 1), cut: Math.max(1400, (fr < 0 ? 2600 + (1 + fr) * 5000 : 13000) / (1 + d / 4200)), side: az < -0.3 ? 'L' : az > 0.3 ? 'R' : 'C' };
  }
  function makeSpatial(s) {
    const g = ctx.createGain(), lp = ctx.createBiquadFilter(), pan = ctx.createStereoPanner ? ctx.createStereoPanner() : null;
    g.gain.value = s.gain; lp.type = 'lowpass'; lp.frequency.value = s.cut; lp.Q.value = 0.5; g.connect(lp);
    if (pan) { pan.pan.value = s.pan; lp.connect(pan); pan.connect(sfxBus); } else lp.connect(sfxBus);
    if (s.d > 2500) { const far = ctx.createGain(); far.gain.value = Math.min(0.5, s.d / 12000); g.connect(far); far.connect(spaceIn); }   // 遠い音ほど、残響が多い(距離感)
    return g;
  }

  // ---------- 基本の音 ----------
  function env(g, t, a, d, vol) { g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(Math.max(0.0002, vol), t + a); g.gain.exponentialRampToValueAtTime(0.0001, t + a + d); }
  function asr(g, t, a, dur, rel, vol) { g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(Math.max(0.0002, vol), t + a); g.gain.setValueAtTime(Math.max(0.0002, vol), t + Math.max(a, dur)); g.gain.exponentialRampToValueAtTime(0.0001, t + Math.max(a, dur) + rel); }
  const at = o => o.at !== undefined ? o.at : ctx.currentTime + (o.delay || 0);
  function panTo(node, pan, dest) { if (pan && ctx.createStereoPanner) { const p = ctx.createStereoPanner(); p.pan.value = clamp(pan, -1, 1); node.connect(p); p.connect(dest); } else node.connect(dest); }
  function tone(f0, dur, o = {}) {
    const t = at(o), a = o.a || 0.005, osc = ctx.createOscillator(), g = ctx.createGain();
    osc.type = o.type || 'square'; osc.frequency.setValueAtTime(f0, t); if (o.f1) osc.frequency.exponentialRampToValueAtTime(o.f1, t + dur);
    env(g, t, a, dur, o.vol || 0.3); osc.connect(g); panTo(g, o.pan, o.bus || OUT()); osc.start(t); osc.stop(t + a + dur + 0.05);
  }
  function fmVoice(f0, dur, o = {}) {   // FM音源(4オペレーター)
    const t = at(o), a = o.a || .006, end = t + a + dur;
    const car = ctx.createOscillator(), mods = [ctx.createOscillator(), ctx.createOscillator(), ctx.createOscillator()];
    const gains = mods.map(() => ctx.createGain()), out = ctx.createGain(), filter = ctx.createBiquadFilter();
    const ratios = [o.r1 ?? 2, o.r2 ?? 3, o.r3 ?? .5], depths = [o.i1 ?? 200, o.i2 ?? 100, o.i3 ?? f0 * .16];
    car.type = o.type || 'sine'; car.frequency.setValueAtTime(f0, t); car.detune.value = o.detune || 0;
    if (o.f1 > 0) car.frequency.exponentialRampToValueAtTime(o.f1, end);
    mods.forEach((m, i) => {
      m.frequency.setValueAtTime(Math.max(1, f0 * ratios[i]), t);
      if (o.f1 > 0) m.frequency.exponentialRampToValueAtTime(Math.max(1, o.f1 * ratios[i]), end);
      gains[i].gain.setValueAtTime(Math.max(.001, depths[i]), t);
      if (o.decay) gains[i].gain.exponentialRampToValueAtTime(Math.max(.001, depths[i] * (i === 2 ? .22 : .045)), end);
      m.connect(gains[i]);
    });
    gains[1].connect(mods[0].frequency); gains[0].connect(car.frequency); gains[2].connect(car.frequency);
    filter.type = 'lowpass'; filter.Q.value = .7; filter.frequency.setValueAtTime(o.cut || 6500, t); filter.frequency.exponentialRampToValueAtTime(Math.max(180, (o.cut || 6500) * .45), end);
    env(out, t, a, dur, o.vol ?? .15); car.connect(filter); filter.connect(out); panTo(out, o.pan, o.bus || OUT());
    const stop = end + .05; mods.forEach(m => { m.start(t); m.stop(stop); }); car.start(t); car.stop(stop);
  }
  const FM = {   // 調整できる FM の音色(音色調整ページ用。brass・bass は、いまは使わない)
    shotC: { notes: [1880], gap: 0, dur: 0.16, r1: 1.01, r2: 2.98, r3: 0.5, i1: 1350, i2: 320, i3: 210, vol: 0.13, a: 0.002, slide: 0.115, decay: 1, type: 'sine' },
    lock: { notes: [880, 1108, 1320], gap: 0.05, dur: 0.06, r1: 3, r2: 5, i1: 80, i2: 30, vol: 0.12, a: 0.005, slide: 1, decay: 0, type: 'sine' },
    warning: { notes: [104, 104, 104, 104], gap: 0.28, dur: 0.18, r1: 4, r2: 7, i1: 180, i2: 90, vol: 0.16, a: 0.01, slide: 1, decay: 0, type: 'sine' },
    brass: { notes: [60], gap: 0, dur: 0.5, r1: 1, r2: 2.01, r3: 3, i1: 440, i2: 85, i3: 65, vol: 0.09, a: 0.025, slide: 1, decay: 0, type: 'sine' },
    bass: { notes: [36], gap: 0, dur: 0.2, r1: 1, r2: 2, r3: 0.5, i1: 260, i2: 65, i3: 45, vol: 0.14, a: 0.004, slide: 1, decay: 0, type: 'sine' },
    custom: { notes: [440], gap: 0.2, dur: 0.3, r1: 2, r2: 3.5, i1: 200, i2: 80, vol: 0.15, a: 0.01, slide: 1, decay: 1, type: 'sine' },
  };
  const FM_DEFAULT = JSON.parse(JSON.stringify(FM)), MIDI_VOICES = { brass: 1, bass: 1 };
  function fmOpts(p, extra) { return Object.assign({ r1: p.r1, r2: p.r2, i1: p.i1, i2: p.i2, vol: p.vol, a: p.a, decay: p.decay, type: p.type, r3: p.r3, i3: p.i3 }, extra); }
  function playFm(name, pm = 1, volK = 1) { const p = FM[name]; if (!p) return; p.notes.forEach((n, i) => { const f = (MIDI_VOICES[name] ? mf(n) : n) * pm; fmVoice(f, p.dur, fmOpts(p, { delay: i * p.gap, vol: p.vol * volK, f1: p.slide && p.slide !== 1 ? f * p.slide : 0 })); }); }
  function noise(dur, o = {}) {
    const t = at(o), a = o.a || 0.005, src = ctx.createBufferSource(), fl = ctx.createBiquadFilter(), g = ctx.createGain();
    src.buffer = noiseBuf; src.loop = true; fl.type = o.filter || 'lowpass'; fl.Q.value = o.q || 1;
    fl.frequency.setValueAtTime(o.f0 || 2000, t); if (o.f1) fl.frequency.exponentialRampToValueAtTime(o.f1, t + dur);
    env(g, t, a, dur, o.vol || 0.3); src.connect(fl);
    if (o.drive) { const ws = ctx.createWaveShaper(); ws.curve = driveCurve(o.drive); fl.connect(ws); ws.connect(g); } else fl.connect(g);
    panTo(g, o.pan, o.bus || OUT()); src.start(t, Math.random() * 1.5); src.stop(t + a + dur + 0.1);
  }
  function fTone(f, dur, o = {}) {
    const t = at(o), os = ctx.createOscillator(), fl = ctx.createBiquadFilter(), g = ctx.createGain(), a = o.a || 0.005;
    os.type = o.type || 'sawtooth'; os.frequency.setValueAtTime(f, t); if (o.f1) os.frequency.exponentialRampToValueAtTime(o.f1, t + dur);
    fl.type = o.ft || 'lowpass'; fl.Q.value = o.q || 2; fl.frequency.setValueAtTime(o.c0 || 3000, t); fl.frequency.exponentialRampToValueAtTime(Math.max(60, o.c1 || 400), t + dur);
    env(g, t, a, dur, o.vol || 0.1); os.connect(fl); fl.connect(g); panTo(g, o.pan, o.bus || OUT()); os.start(t); os.stop(t + a + dur + 0.05);
  }

  // ---------- 楽器(オーケストラ+電子) ----------
  const stPan = m => clamp(-(m - 62) / 30, -0.55, 0.55);   // 高い弦は左(バイオリン)、低い弦は右(チェロ・コントラバス)
  function strL(m, t, dur, dest, vol = 0.03, o = {}) {   // 弦(のばす音)
    const f = mf(m), a = o.a ?? 0.35, rel = o.rel ?? 0.8, end = t + Math.max(a, dur) + rel + 0.1, out = ctx.createGain(), fl = ctx.createBiquadFilter();
    const fc = clamp(1500 * Math.pow(2, (m - 57) / 22), 650, 6500) * (o.bright || 1);
    fl.type = 'lowpass'; fl.Q.value = 0.8; fl.frequency.setValueAtTime(fc * 0.55, t); fl.frequency.linearRampToValueAtTime(fc, t + a + 0.25);
    asr(out, t, a, dur, rel, vol);
    const lfo = ctx.createOscillator(), lg = ctx.createGain(); lfo.frequency.value = 5 + Math.random() * 1.2; lg.gain.setValueAtTime(0, t); lg.gain.linearRampToValueAtTime(8 + Math.random() * 6, t + 0.5); lfo.connect(lg); lfo.start(t); lfo.stop(end);
    for (const [ty, dt, gv] of [['sawtooth', -7, 0.5], ['sawtooth', 6, 0.5], ['pw', 1, 0.32]]) { const os = ctx.createOscillator(), g = ctx.createGain(); if (ty === 'pw' && PW) os.setPeriodicWave(PW); else os.type = 'sawtooth'; os.frequency.setValueAtTime(f, t); os.detune.value = dt; lg.connect(os.detune); g.gain.value = gv; os.connect(g); g.connect(fl); os.start(t); os.stop(end); }
    const ns = ctx.createBufferSource(), nb = ctx.createBiquadFilter(), ng = ctx.createGain(); ns.buffer = noiseBuf; ns.loop = true; nb.type = 'bandpass'; nb.frequency.value = Math.min(9000, fc * 1.4); nb.Q.value = 1.2; ng.gain.value = 0.05; ns.connect(nb); nb.connect(ng); ng.connect(out); ns.start(t, Math.random()); ns.stop(end);   // 弓のこすれ
    fl.connect(out); panTo(out, o.pan ?? stPan(m), dest);
  }
  function strS(m, t, dest, vol = 0.03, o = {}) {   // 弦の刻み(スピッカート)
    const f = mf(m), dur = o.dur || 0.15, out = ctx.createGain(), fl = ctx.createBiquadFilter(), fc = clamp(3600 * Math.pow(2, (m - 60) / 30), 1500, 7000);
    fl.type = 'lowpass'; fl.Q.value = 1.1; fl.frequency.setValueAtTime(fc, t); fl.frequency.exponentialRampToValueAtTime(fc * 0.25, t + dur);
    env(out, t, 0.004, dur, vol);
    for (const dt of [-8, 7]) { const os = ctx.createOscillator(); os.type = 'sawtooth'; os.frequency.setValueAtTime(f, t); os.detune.value = dt; os.connect(fl); os.start(t); os.stop(t + dur + 0.05); }
    fl.connect(out); panTo(out, o.pan ?? stPan(m), dest);
    noise(0.012, { at: t, filter: 'bandpass', f0: 3200, q: 1.5, vol: vol * 0.45, bus: dest });   // 弓が弦に当たる音
  }
  function brass(m, t, dur, dest, vol = 0.05, o = {}) {   // 金管(トランペット・ホルン)
    const f = mf(m), dyn = o.dyn ?? 0.7, horn = !!o.horn, a = o.a ?? (horn ? 0.07 : 0.035), rel = o.rel ?? 0.2, hold = Math.max(a, dur), end = t + hold + rel + 0.1;
    const out = ctx.createGain(), fl = ctx.createBiquadFilter(), key = Math.pow(2, (m - 60) / 12 * 0.6), peak = (horn ? 1300 : 2400) * (0.5 + dyn) * key;
    fl.type = 'lowpass'; fl.Q.value = 1.3; fl.frequency.setValueAtTime(220, t); fl.frequency.exponentialRampToValueAtTime(peak, t + a + 0.05); fl.frequency.exponentialRampToValueAtTime(peak * 0.62, t + a + 0.4); fl.frequency.setValueAtTime(peak * 0.62, t + hold); fl.frequency.exponentialRampToValueAtTime(Math.max(150, peak * 0.2), t + hold + rel);
    asr(out, t, a, dur, rel, vol);
    const gr = ctx.createOscillator(), gg = ctx.createGain(); gr.type = 'triangle'; gr.frequency.value = 80; gg.gain.setValueAtTime(0, t); gg.gain.linearRampToValueAtTime(peak * 0.25, t + 0.01); gg.gain.linearRampToValueAtTime(0, t + 0.06); gr.connect(gg); gg.connect(fl.frequency); gr.start(t); gr.stop(t + 0.1);   // 出だしのうなり
    const lfo = ctx.createOscillator(), lg = ctx.createGain(); lfo.frequency.value = 5; lg.gain.setValueAtTime(0, t); lg.gain.setValueAtTime(0, t + 0.35); lg.gain.linearRampToValueAtTime(dur > 0.5 ? 8 : 0, t + 0.8); lfo.connect(lg); lfo.start(t); lfo.stop(end);   // 遅れてかかるビブラート
    for (const [ty, dt, gv] of [['sawtooth', -5, 0.55], ['sawtooth', 5, 0.55], ['square', 0, horn ? 0.12 : 0.22]]) { const os = ctx.createOscillator(), g = ctx.createGain(); os.type = ty; os.frequency.setValueAtTime(f, t); os.detune.setValueAtTime(dt - 35, t); os.detune.linearRampToValueAtTime(dt, t + 0.06); lg.connect(os.detune); g.gain.value = gv; os.connect(g); g.connect(fl); os.start(t); os.stop(end); }   // 音程のしゃくり
    fl.connect(out); panTo(out, o.pan ?? (horn ? 0.25 : -0.2), dest);
    noise(0.08, { at: t, filter: 'bandpass', f0: 1400, q: 0.8, vol: vol * 0.25, bus: dest });   // 息
  }
  const FORM = { a: [800, 1150, 2900], o: [450, 800, 2830], u: [325, 700, 2530], e: [400, 1600, 2700] };
  function choirV(m, t, dur, dest, vol = 0.04, o = {}) {   // 合唱: 3声のノコギリ波 → 母音のフォルマント
    const f = mf(m), a = o.a ?? 0.45, rel = o.rel ?? 0.7, end = t + Math.max(a, dur) + rel + 0.1, out = ctx.createGain(), fm = FORM[o.v || 'a'];
    asr(out, t, a, dur, rel, vol);
    const lfo = ctx.createOscillator(), lg = ctx.createGain(); lfo.frequency.value = 5.5; lg.gain.setValueAtTime(0, t); lg.gain.linearRampToValueAtTime(12, t + 0.6); lfo.connect(lg); lfo.start(t); lfo.stop(end);
    const mix = ctx.createGain(); mix.gain.value = 1;
    for (const dt of [-9, 0, 8]) { const os = ctx.createOscillator(); os.type = 'sawtooth'; os.frequency.setValueAtTime(f, t); os.detune.value = dt; lg.connect(os.detune); os.connect(mix); os.start(t); os.stop(end); }
    fm.forEach((fq, k) => { const bp = ctx.createBiquadFilter(), g = ctx.createGain(); bp.type = 'bandpass'; bp.frequency.value = fq; bp.Q.value = 6 + k * 2; g.gain.value = [1.6, 0.8, 0.35][k]; mix.connect(bp); bp.connect(g); g.connect(out); });
    panTo(out, o.pan ?? clamp((m - 60) / 40, -0.4, 0.4), dest);
  }
  function taiko(t, dest, vol = 0.5, o = {}) {   // 和太鼓: 高い音から一気に下がる正弦波+皮の音
    const f = o.f || 62, g = ctx.createGain(), os = ctx.createOscillator(); os.type = 'sine';
    os.frequency.setValueAtTime(f * 2.5, t); os.frequency.exponentialRampToValueAtTime(f, t + 0.035); os.frequency.exponentialRampToValueAtTime(f * 0.8, t + 0.9);
    env(g, t, 0.002, o.len || 0.9, vol); os.connect(g); panTo(g, o.pan, dest); os.start(t); os.stop(t + 1.1);
    tone(f * 1.58, 0.25, { at: t, type: 'sine', vol: vol * 0.3, a: 0.002, bus: dest, pan: o.pan });
    noise(0.22, { at: t, filter: 'lowpass', f0: 1300, f1: 250, vol: vol * 0.55, bus: dest, pan: o.pan });
    noise(0.012, { at: t, filter: 'bandpass', f0: 2600, q: 1, vol: vol * 0.3, bus: dest, pan: o.pan });
  }
  function timp(m, t, dest, vol = 0.3) {   // ティンパニ: 非整数倍音
    const f = mf(m); [[1, 1, 1.6], [1.504, 0.5, 0.9], [1.742, 0.35, 0.7], [2, 0.25, 0.6]].forEach(([k, a, d]) => tone(f * k, d, { at: t, type: 'sine', vol: vol * a, a: 0.003, bus: dest, f1: f * k * 0.985 }));
    noise(0.06, { at: t, filter: 'lowpass', f0: 700, vol: vol * 0.4, bus: dest });
  }
  function snare(t, dest, vol = 0.2, pan = 0) { noise(0.16, { at: t, filter: 'bandpass', f0: 1900, q: 0.9, vol, bus: dest, pan }); tone(195, 0.08, { at: t, type: 'triangle', f1: 160, vol: vol * 0.6, bus: dest, pan }); noise(0.1, { at: t, filter: 'highpass', f0: 5200, vol: vol * 0.4, bus: dest, pan }); }
  function roll(t, dur, dest, v0, v1) { const n = Math.floor(dur * 22); for (let i = 0; i < n; i++) snare(t + i * dur / n, dest, v0 + (v1 - v0) * i / n, (i % 2 ? 0.15 : -0.15)); }
  function crash(t, dest, vol = 0.12, dur = 2.4) { noise(dur, { at: t, filter: 'highpass', f0: 5200, vol, a: 0.002, bus: dest }); noise(dur * 0.6, { at: t, filter: 'bandpass', f0: 8500, q: 2, vol: vol * 0.5, bus: dest }); }
  function swell(t, dur, dest, vol = 0.1) {   // シンバルの逆回し(次の区切りへ、盛り上げる)
    const src = ctx.createBufferSource(), fl = ctx.createBiquadFilter(), g = ctx.createGain(); src.buffer = noiseBuf; src.loop = true; fl.type = 'highpass'; fl.frequency.value = 4500;
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + dur); g.gain.exponentialRampToValueAtTime(0.0001, t + dur + 0.05); src.connect(fl); fl.connect(g); g.connect(dest); src.start(t, Math.random()); src.stop(t + dur + 0.1);
  }
  function braam(m, t, dest, vol = 0.07, len = 2.2) {   // 映画の予告編の「ブワーン」: 低い金管の塊を歪ませる
    const out = ctx.createGain(), fl = ctx.createBiquadFilter(), ws = ctx.createWaveShaper(); ws.curve = driveCurve(3.5);
    fl.type = 'lowpass'; fl.Q.value = 2; fl.frequency.setValueAtTime(180, t); fl.frequency.exponentialRampToValueAtTime(2600, t + 0.35); fl.frequency.exponentialRampToValueAtTime(700, t + len);
    asr(out, t, 0.05, len * 0.7, len * 0.5, vol);
    for (const k of [0, 7, 12]) for (const dt of [-9, 9]) { const os = ctx.createOscillator(); os.type = 'sawtooth'; os.frequency.value = mf(m + k); os.detune.value = dt; os.connect(fl); os.start(t); os.stop(t + len * 1.3); }
    fl.connect(ws); ws.connect(out); out.connect(dest);
    tone(mf(m - 12), len, { at: t, type: 'sine', vol: vol * 2, a: 0.02, bus: dest });
  }
  function boom(t, dest, vol = 0.3) { tone(58, 1.6, { at: t, type: 'sine', f1: 27, vol, a: 0.003, bus: dest }); noise(1.1, { at: t, filter: 'lowpass', f0: 420, f1: 60, vol: vol * 0.6, bus: dest }); }
  function riser(t, dur, dest, v = 0.08) { const src = ctx.createBufferSource(), fl = ctx.createBiquadFilter(), g = ctx.createGain(); src.buffer = noiseBuf; src.loop = true; fl.type = 'bandpass'; fl.Q.value = 1.6; fl.frequency.setValueAtTime(300, t); fl.frequency.exponentialRampToValueAtTime(9000, t + dur); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(v, t + dur); g.gain.exponentialRampToValueAtTime(0.0001, t + dur + 0.08); src.connect(fl); fl.connect(g); g.connect(dest); src.start(t, Math.random()); src.stop(t + dur + 0.2); }
  // 撥弦(ハープ): Karplus-Strong。音ごとに一度だけ波形を作って、使い回す
  const KS = {}, PIA = {};
  function ksBuf(m) {
    if (KS[m]) return KS[m];
    const sr = 32000, f = mf(m), T = m < 55 ? 2.4 : m < 72 ? 1.8 : 1.2, len = Math.floor(sr * T), b = ctx.createBuffer(1, len, sr), y = b.getChannelData(0);
    const D = sr / f - 0.5, Di = Math.floor(D), fr = D - Di, g = Math.pow(0.001, 1 / (f * T)); let lp = 0;
    for (let i = 0; i < Di + 2 && i < len; i++) { lp = lp * 0.45 + (Math.random() * 2 - 1) * 0.55; y[i] = lp; }
    for (let i = Di + 2; i < len; i++) { const a = y[i - Di] * (1 - fr) + y[i - Di - 1] * fr, c = y[i - Di - 1] * (1 - fr) + y[i - Di - 2] * fr; y[i] += g * 0.5 * (a + c); }
    let pk = 0; for (let i = 0; i < len; i++) pk = Math.max(pk, Math.abs(y[i])); if (pk > 0) for (let i = 0; i < len; i++) y[i] *= 0.9 / pk;
    return (KS[m] = b);
  }
  function pianoBuf(m) {   // ピアノ: 非整数倍音(弦の硬さ)の加算合成+2本の弦のうなり+ハンマーの音。3半音ごとに作り、再生の速さで音程を合わせる
    if (PIA[m]) return PIA[m];
    const sr = 32000, f = mf(m), T = clamp(3.4 * Math.pow(220 / f, 0.4), 0.9, 5), len = Math.floor(sr * Math.min(4.5, T * 1.1)), b = ctx.createBuffer(1, len, sr), y = b.getChannelData(0), B = 0.00035;
    const K = f < 300 ? 10 : f < 800 ? 7 : 4;
    for (let k = 1; k <= K; k++) {
      const fk = k * f * Math.sqrt(1 + B * k * k); if (fk > 11000) break;
      const amp = 1 / Math.pow(k, 1.1), dec = Math.pow(0.001, 1 / (sr * T / (1 + 0.45 * (k - 1))));
      for (const det of [-0.0004, 0.0004]) { const w = 2 * Math.PI * fk * (1 + det) / sr, cw = Math.cos(w), sw = Math.sin(w); let re = 0, im = amp * 0.5, e = 1; for (let i = 0; i < len; i++) { const r2 = re * cw - im * sw; im = re * sw + im * cw; re = r2; y[i] += im * e; e *= dec; } }
    }
    for (let i = 0; i < Math.min(len, 120); i++) y[i] += (Math.random() * 2 - 1) * 0.3 * (1 - i / 120);   // ハンマー
    let pk = 0; for (let i = 0; i < len; i++) pk = Math.max(pk, Math.abs(y[i])); if (pk > 0) for (let i = 0; i < len; i++) y[i] *= 0.9 / pk;
    return (PIA[m] = b);
  }
  function playBuf(b, rate, t, dur, dest, vol, pan, rel = 0.3) { const s = ctx.createBufferSource(), g = ctx.createGain(); s.buffer = b; s.playbackRate.value = rate; g.gain.setValueAtTime(vol, t); if (dur) { g.gain.setValueAtTime(vol, t + dur); g.gain.exponentialRampToValueAtTime(0.0001, t + dur + rel); } s.connect(g); panTo(g, pan, dest); s.start(t); s.stop(t + (dur ? dur + rel + 0.05 : b.duration / rate)); }
  function pluck(m, t, dest, vol = 0.05, pan = 0) { playBuf(ksBuf(m), 1, t, 0, dest, vol, pan); }
  function piano(m, t, dur, dest, vol = 0.06, pan = 0) { const r0 = m - (((m % 3) + 3) % 3); playBuf(pianoBuf(r0), Math.pow(2, (m - r0) / 12), t, dur, dest, vol, pan, 0.4); }
  let warmed = false;
  function warmup() {   // ハープとピアノの波形を、手の空いたときに少しずつ作っておく(最初の音で止まらないように)
    if (warmed || !ctx) return; warmed = true;
    const todo = []; for (let m = 43; m <= 91; m++) todo.push(() => ksBuf(m)); for (let m = 36; m <= 93; m += 3) todo.push(() => pianoBuf(m));
    const go = () => { const t0 = performance.now(); while (todo.length && performance.now() - t0 < 6) todo.shift()(); if (todo.length) setTimeout(go, 40); };
    setTimeout(go, 400);
  }
  function glassB(f, dur, vol, dest, t, pan = 0) { fmVoice(f, dur, { at: t, bus: dest, r1: 3.5, r2: 5.43, r3: 0.5, i1: f * 1.4, i2: f * 0.55, i3: f * 0.05, decay: 1, vol, a: 0.002, cut: 9000, pan }); }
  // 電子の楽器
  function padOf(g) { if (!g._pump) { g._pump = ctx.createGain(); g._pump.connect(g); } return g._pump; }
  function pump(g, t, depth = 0.45, rel = 0.2) { const q = padOf(g).gain; q.cancelScheduledValues(t); q.setValueAtTime(depth, t); q.linearRampToValueAtTime(1, t + rel); }
  function sPad(m, t, dur, dest, vol = 0.03, o = {}) {
    const f = mf(m), a = o.a || 0.9, rel = o.rel || 1.1, end = t + dur + rel + 0.05, out = ctx.createGain(), fl = ctx.createBiquadFilter();
    fl.type = 'lowpass'; fl.Q.value = 1.3; fl.frequency.setValueAtTime(o.c0 || 500, t); fl.frequency.linearRampToValueAtTime(o.c1 || 2600, t + Math.max(0.3, dur * 0.8));
    asr(out, t, a, dur, rel, vol);
    for (const k of [-1, 1]) { const os = ctx.createOscillator(); os.type = 'sawtooth'; os.frequency.setValueAtTime(f, t); os.detune.value = k * 8; const pn = ctx.createStereoPanner ? ctx.createStereoPanner() : null; if (pn) { pn.pan.value = k * 0.6; os.connect(pn); pn.connect(fl); } else os.connect(fl); os.start(t); os.stop(end); }
    fl.connect(out); out.connect(padOf(dest));
  }
  function sLead(m, t, dur, dest, vol = 0.05, o = {}) {
    const f = mf(m), a = o.a || 0.02, rel = o.rel || 0.16, end = t + dur + rel + 0.05, out = ctx.createGain(), fl = ctx.createBiquadFilter();
    fl.type = 'lowpass'; fl.Q.value = o.q || 4; fl.frequency.setValueAtTime(o.c0 || 700, t); fl.frequency.exponentialRampToValueAtTime(o.c1 || 4200, t + 0.09 + a); fl.frequency.exponentialRampToValueAtTime((o.c1 || 4200) * 0.55, t + Math.max(0.15, dur));
    asr(out, t, a, dur, rel, vol);
    const lfo = ctx.createOscillator(), lg = ctx.createGain(); lfo.frequency.value = 5.4; lg.gain.setValueAtTime(0, t); lg.gain.linearRampToValueAtTime(8, t + 0.25); lfo.connect(lg); lfo.start(t); lfo.stop(end);
    for (const [ty, dt, gv] of [['sawtooth', -8, 1], ['sawtooth', 8, 1], ['square', 0, 0.45]]) { const os = ctx.createOscillator(), g = ctx.createGain(); os.type = ty; os.frequency.setValueAtTime(f, t); os.detune.value = dt; g.gain.value = gv; lg.connect(os.detune); os.connect(g); g.connect(fl); os.start(t); os.stop(end); }
    if (o.drive) { const ws = ctx.createWaveShaper(); ws.curve = driveCurve(o.drive); fl.connect(ws); ws.connect(out); } else fl.connect(out); out.connect(dest);
  }
  function sArp(m, t, dur, dest, vol = 0.03, pan = 0) { const os = ctx.createOscillator(), fl = ctx.createBiquadFilter(), g = ctx.createGain(); os.type = 'sawtooth'; os.frequency.setValueAtTime(mf(m), t); fl.type = 'lowpass'; fl.Q.value = 6; fl.frequency.setValueAtTime(4600, t); fl.frequency.exponentialRampToValueAtTime(520, t + Math.max(0.05, dur * 0.9)); env(g, t, 0.003, dur, vol); os.connect(fl); fl.connect(g); panTo(g, pan, dest); os.start(t); os.stop(t + dur + 0.05); }
  function sBass(m, t, dur, dest, vol = 0.1, o = {}) {
    const f = mf(m), sub = ctx.createOscillator(), saw = ctx.createOscillator(), fl = ctx.createBiquadFilter(), g = ctx.createGain(), sg = ctx.createGain();
    sub.type = 'sine'; saw.type = 'sawtooth'; sub.frequency.setValueAtTime(f, t); saw.frequency.setValueAtTime(f, t); sg.gain.value = 0.6;
    fl.type = 'lowpass'; fl.Q.value = 2.5; fl.frequency.setValueAtTime(o.c0 || 560, t); fl.frequency.exponentialRampToValueAtTime(o.c1 || 120, t + Math.max(0.06, dur));
    env(g, t, 0.006, dur, vol); saw.connect(fl);
    if (o.wob) { const lfo = ctx.createOscillator(), lg = ctx.createGain(); lfo.frequency.value = o.wob; lg.gain.value = 300; lfo.connect(lg); lg.connect(fl.frequency); lfo.start(t); lfo.stop(t + dur + 0.1); }
    if (o.drive) { const ws = ctx.createWaveShaper(); ws.curve = driveCurve(o.drive); fl.connect(ws); ws.connect(g); } else fl.connect(g);
    sub.connect(sg); sg.connect(g); g.connect(dest); sub.start(t); saw.start(t); sub.stop(t + dur + 0.1); saw.stop(t + dur + 0.1);
  }
  function kickE(t, dest, v = 0.5) { tone(160, 0.16, { at: t, type: 'sine', f1: 44, vol: v, a: 0.002, bus: dest }); noise(0.015, { at: t, filter: 'bandpass', f0: 3000, vol: v * 0.2, bus: dest }); }
  function clapE(t, dest, v = 0.15) { for (let k = 0; k < 3; k++) noise(0.02, { at: t + k * 0.009, filter: 'bandpass', f0: 1500, q: 1.1, vol: v * 0.7, bus: dest }); noise(0.16, { at: t + 0.028, filter: 'bandpass', f0: 1400, q: 0.9, vol: v * 0.5, bus: dest }); }
  function hatE(t, dest, v = 0.05, open = false, pan = 0) { noise(open ? 0.16 : 0.03, { at: t, filter: 'highpass', f0: 8200, vol: v, bus: dest, pan }); }
  function metal(t, dest, v = 0.08, pan = 0) { fmVoice(310, 0.35, { at: t, bus: dest, r1: 1.41, r2: 2.76, r3: 0.5, i1: 900, i2: 500, i3: 80, decay: 1, vol: v, a: 0.002, cut: 7000, pan }); noise(0.05, { at: t, filter: 'highpass', f0: 3500, vol: v * 0.6, bus: dest, pan }); }
  function zapP(t, dest, v = 0.05, pan = 0) { fTone(2400, 0.07, { at: t, type: 'square', f1: 300, c0: 6000, c1: 900, q: 4, vol: v, bus: dest, pan }); }

  // ---------- 作曲(和音・音階・旋律を、種から作る) ----------
  const SCALES = { aeolian: [0, 2, 3, 5, 7, 8, 10], dorian: [0, 2, 3, 5, 7, 9, 10], phrygian: [0, 1, 3, 5, 7, 8, 10], harmonic: [0, 2, 3, 5, 7, 8, 11], lydian: [0, 2, 4, 6, 7, 9, 11], ionian: [0, 2, 4, 5, 7, 9, 11], mixo: [0, 2, 4, 5, 7, 9, 10], phrydom: [0, 1, 4, 5, 7, 8, 10] };
  const MAJ = [0, 2, 4, 5, 7, 9, 11], ROM = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII'], PC = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
  function chordOf(sym, key) {   // 'i' 'bVI' 'V' 'iio' 'Is'(sus4) … または 'Dm' 'Bb' など
    let root, q;
    if (/^[A-G]/.test(sym)) { root = PC[sym[0]]; let i = 1; if (sym[i] === '#') { root++; i++; } else if (sym[i] === 'b') { root--; i++; } q = sym.slice(i) === 'm' ? [0, 3, 7] : [0, 4, 7]; }
    else { const m = /^([b#]?)([ivIV]+)(o|s|\+)?$/.exec(sym); const num = ROM.indexOf(m[2].toUpperCase()); root = key + MAJ[num] + (m[1] === 'b' ? -1 : m[1] === '#' ? 1 : 0); const minor = m[2] === m[2].toLowerCase(); q = m[3] === 'o' ? [0, 3, 6] : m[3] === 's' ? [0, 5, 7] : m[3] === '+' ? [0, 4, 8] : minor ? [0, 3, 7] : [0, 4, 7]; }
    root = ((root % 12) + 12) % 12; return { root, pcs: q.map(x => (root + x) % 12), q };
  }
  const voiceIn = (ch, lo) => ch.pcs.map(pc => lo + ((pc - lo) % 12 + 12) % 12).sort((a, b) => a - b);   // lo〜lo+11 の間に、和音の音を置く
  const rootIn = (ch, lo) => lo + ((ch.root - lo) % 12 + 12) % 12;
  function mulberry(a) { return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
  const RH = {
    slow: [[[0, 8], [8, 8]], [[0, 12], [12, 4]], [[0, 6], [6, 2], [8, 8]], [[0, 16]], [[0, 4], [4, 4], [8, 8]]],
    med: [[[0, 4], [4, 2], [6, 2], [8, 8]], [[0, 3], [3, 1], [4, 4], [8, 4], [12, 4]], [[0, 6], [6, 2], [8, 4], [12, 4]], [[0, 4], [4, 4], [8, 6], [14, 2]], [[0, 2], [2, 2], [4, 4], [8, 8]]],
    fast: [[[0, 2], [2, 2], [4, 2], [6, 2], [8, 4], [12, 4]], [[0, 3], [3, 3], [6, 2], [8, 2], [10, 2], [12, 4]], [[0, 1], [1, 1], [2, 2], [4, 4], [8, 2], [10, 2], [12, 4]], [[0, 3], [3, 1], [4, 2], [6, 2], [8, 4], [12, 2], [14, 2]]],
  };
  function genMelody(rng, sp, prog, B) {   // 8小節: 動機 → 動機の移し替え → 対照 → 終止。強拍は、和音の音にそろえる
    const sc = SCALES[sp.scale], key = sp.key, toM = idx => { const o = Math.floor(idx / 7), d = ((idx % 7) + 7) % 7; return 48 + key + 12 * o + sc[d]; };
    const target = (sp.reg || 72) + (B ? 4 : 0); let cI = 0; for (let i = 0; i < 40; i++) if (Math.abs(toM(i) - target) < Math.abs(toM(cI) - target)) cI = i;
    const snap = (idx, ch) => { for (const d of [0, 1, -1, 2, -2, 3]) if (ch.pcs.includes(((toM(idx + d) % 12) + 12) % 12)) return idx + d; return idx; };
    const pool = RH[B && sp.dens !== 'fast' ? (sp.dens === 'slow' ? 'med' : 'fast') : sp.dens || 'med'], pick = a => a[Math.floor(rng() * a.length)];
    const rA = pick(pool), rB = pick(RH.slow), rC = pick(pool), cA = rA.map(() => Math.floor(rng() * 5) - 2 + (rng() < 0.3 ? 1 : 0)), cC = cA.map(x => -x);
    const out = []; let pos = cI;
    const bar = (b, rh, cont, startIdx, snapAll) => { let idx = snap(startIdx, prog[b]); rh.forEach(([s, d], k) => { if (k) idx += cont[k % cont.length]; idx = clamp(idx, cI - 5, cI + 8); if (s === 0 || d >= 4 || snapAll) idx = snap(idx, prog[b]); out.push({ s: b * 16 + s, m: toM(idx), d }); }); return idx; };
    pos = bar(0, rA, cA, cI, false); pos = bar(1, rB, cA, pos, false);
    pos = bar(2, rA, cA, cI + (rng() < 0.5 ? 1 : 2), false); pos = bar(3, rB, cA, pos, false);
    pos = bar(4, rC, cC, cI + 2, false); pos = bar(5, rC, cC, pos - 1, false);
    pos = bar(6, rA.slice(0, Math.max(2, rA.length - 1)), [1, 1, 1], pos, true);
    const end = snap(B ? cI : cI + 2, prog[7]); out.push({ s: 7 * 16, m: toM(end), d: 14 });
    return out;
  }
  const parseMel = str => { const out = []; for (const w of str.trim().split(/\s+/)) { if (!w) continue; const [s, n, d] = w.split(':'), m = /^([A-G])([#b]?)(\d)$/.exec(n); out.push({ s: +s, m: 12 * (+m[3] + 1) + PC[m[1]] + (m[2] === '#' ? 1 : m[2] === 'b' ? -1 : 0), d: +d }); } return out; };
  const THEME = '0:G4:3 3:C5:1 4:E5:4 8:D5:2 10:C5:2 12:G5:4 16:F5:3 19:E5:1 20:D5:4 24:C5:4 32:A4:3 35:D5:1 36:F5:4 40:E5:2 42:D5:2 44:A5:4 48:G5:3 51:F5:1 52:E5:4 56:D5:8 64:E5:2 66:G5:2 68:C6:6 74:B5:2 76:A5:4 80:G5:3 83:A5:1 84:G5:4 88:E5:4 92:C5:4 96:F5:3 99:E5:1 100:D5:2 102:E5:2 104:F5:4 108:G5:4 112:C6:12';
  const MEL = {   // 前の版の旋律(主題として使い続ける)
    fleet: '0:D5:3 3:D5:1 4:F5:4 8:A5:4 12:G5:2 14:F5:2 16:D5:3 19:F5:1 20:Bb5:6 26:A5:2 28:G5:4 32:G5:3 35:F5:1 36:D5:4 40:Bb4:4 44:D5:4 48:E5:3 51:F5:1 52:A5:6 58:G5:2 60:E5:4 64:D5:3 67:D5:1 68:F5:4 72:A5:4 76:D6:4 80:C6:3 83:Bb5:1 84:A5:4 88:F5:8 96:E5:2 98:G5:2 100:C6:6 106:B5:2 108:G5:4 112:A5:3 115:G5:1 116:E5:4 120:F5:2 122:E5:2 124:A4:4',
    boss: '0:C4:4 4:C4:2 6:Eb4:2 8:G4:6 14:F#4:2 16:Ab4:6 22:G4:2 24:F4:8 32:F4:4 36:F4:2 38:Ab4:2 40:C5:6 46:B4:2 48:D5:8 56:G4:8 64:C5:4 68:C5:2 70:Eb5:2 72:G5:6 78:F#5:2 80:Ab5:6 86:G5:2 88:F5:8 96:Bb4:4 100:Bb4:2 102:D5:2 104:F5:6 110:E5:2 112:G5:12',
    empire: '0:G4:3 3:G4:1 4:G4:3 7:G4:1 8:Bb4:4 12:D5:4 16:Eb5:3 19:Eb5:1 20:D5:3 23:D5:1 24:Bb4:8 32:C5:3 35:C5:1 36:C5:3 39:C5:1 40:Eb5:4 44:G5:4 48:F#5:3 51:F#5:1 52:A5:4 56:D5:8 64:G5:3 67:G5:1 68:G5:3 71:G5:1 72:Bb5:4 76:D6:4 80:Eb6:3 83:D6:1 84:C6:4 88:Bb5:8 96:A5:3 99:A5:1 100:C6:4 104:F5:4 108:A5:4 112:D6:4 116:C6:2 118:A5:2 120:D5:8',
    machine: '0:E5:2 2:A5:2 4:C6:4 8:B5:2 10:A5:2 12:E5:4 16:F5:2 18:A5:2 20:C6:4 24:D6:2 26:C6:2 28:A5:4 32:G5:2 34:C6:2 36:E6:4 40:D6:2 42:C6:2 44:G5:4 48:G5:2 50:B5:2 52:D6:4 56:E6:4 60:D6:4 64:A5:4 68:C6:2 70:E6:2 72:A6:8 80:G6:4 84:F6:2 86:E6:2 88:C6:8 96:D6:4 100:E6:2 102:G6:2 104:B6:4 108:A6:4 112:G6:4 116:E6:4 120:B5:8',
    ancient: '0:D5:8 8:F5:8 16:E5:8 24:G5:8 32:F5:8 40:D5:8 48:E5:12 60:C#5:4 64:D5:6 70:F5:2 72:A5:8 80:G5:6 86:E5:2 88:C5:8 96:D5:4 100:F5:4 104:Bb5:8 112:A5:12',
    final: '0:A4:4 4:C5:2 6:E5:2 8:A5:8 16:G5:4 20:F5:2 22:E5:2 24:C5:8 32:E5:4 36:G5:2 38:C6:2 40:B5:6 46:G5:2 48:A5:4 52:G5:2 54:F5:2 56:D5:8 64:A4:2 66:C5:2 68:E5:2 70:A5:2 72:C6:8 80:B5:4 84:A5:2 86:G5:2 88:A5:8 96:F5:4 100:A5:2 102:D6:2 104:C6:4 108:A5:4 112:B5:6 118:G#5:2 120:E5:8',
  };
  // 曲の設計図: bpm・調(key=0〜11)・音階・A と B の和音進行(8小節ずつ)・編成。
  // lead: brass/horn/strings/synth/choir/piano/pluck/bell、drums: epic/drive/march/half/sparse/industrial/tribal/heart/none、
  // ost(刻み): gallop/drive/pulse/arp/harp/none、pad: strings/synth/choir/both、bass: orch/synth/wobble/pulse/drone、x: 追加(braam/choir/bells/zap/riser)
  // floor: 激しさの下限(ボスなどは常に全開)、ostLv: 刻みが入る激しさ
  const S = (bpm, key, scale, A, B, o) => Object.assign({ bpm, key, scale, A, B, lead: 'brass', drums: 'epic', ost: 'gallop', pad: 'strings', bass: 'orch', x: [], floor: 0, ostLv: 0.35, dens: 'med', reg: 72 }, o);
  const P4 = (a, b, c, d) => [a, a, b, b, c, c, d, d], P8 = (...x) => x;
  const SPECS = {
    title: S(80, 0, 'ionian', ['C', 'F', 'Dm', 'G', 'C', 'C', 'F', 'C'], P4('I', 'bVI', 'IV', 'I'), { mel: THEME, lead: 'horn', drums: 'sparse', ost: 'harp', x: ['bells', 'choir'], dens: 'slow' }),
    hangar: S(72, 2, 'lydian', P4('I', 'II', 'IV', 'I'), P4('vi', 'IV', 'I', 'V'), { lead: 'piano', drums: 'none', ost: 'harp', pad: 'both', bass: 'drone', dens: 'slow', reg: 74 }),
    map: S(84, 4, 'dorian', P4('i', 'IV', 'i', 'bVII'), P4('bIII', 'bVII', 'IV', 'i'), { lead: 'bell', drums: 'sparse', ost: 'harp', pad: 'choir', bass: 'drone', dens: 'slow', reg: 76 }),
    warp: S(128, 6, 'aeolian', P4('i', 'bVI', 'bVII', 'i'), P4('bVI', 'bVII', 'i', 'v'), { lead: 'none', drums: 'drive', ost: 'arp', pad: 'synth', bass: 'pulse', x: ['riser'], floor: 0.7 }),
    clear: S(96, 10, 'ionian', P4('I', 'IV', 'V', 'I'), P4('vi', 'IV', 'bVII', 'I'), { lead: 'brass', drums: 'march', ost: 'none', x: ['bells'], floor: 0.6, dens: 'med' }),
    ending: S(68, 0, 'ionian', ['C', 'F', 'Dm', 'G', 'C', 'C', 'F', 'C'], P4('I', 'iv', 'I', 'iv'), { mel: THEME, lead: 'strings', drums: 'sparse', ost: 'harp', pad: 'both', x: ['choir', 'bells'], dens: 'slow' }),
    gameover: S(60, 2, 'aeolian', P4('i', 'bVI', 'iv', 'V'), P4('i', 'bVI', 'bVII', 'i'), { lead: 'piano', drums: 'none', ost: 'none', bass: 'drone', dens: 'slow', reg: 70 }),
    // 帝国: 行進・金管・弦の刻み
    empire_a: S(104, 7, 'aeolian', ['Gm', 'Eb', 'Cm', 'D', 'Gm', 'Eb', 'F', 'D'], P4('bVI', 'bVII', 'i', 'i'), { mel: MEL.empire, drums: 'march', ost: 'gallop' }),
    empire_b: S(112, 0, 'harmonic', P4('i', 'bVI', 'iv', 'V'), P4('i', 'bVII', 'bVI', 'V'), { lead: 'horn', drums: 'epic', ost: 'drive' }),
    empire_fleet: S(138, 2, 'aeolian', ['Dm', 'Bb', 'Gm', 'A', 'Dm', 'Bb', 'C', 'A'], P4('iv', 'bVI', 'bVII', 'V'), { mel: MEL.fleet, drums: 'epic', ost: 'gallop', x: ['braam'], floor: 0.6 }),
    empire_boss: S(92, 0, 'phrygian', ['Cm', 'Ab', 'Fm', 'G', 'Cm', 'Ab', 'Bb', 'G'], P4('i', 'bII', 'bVI', 'V'), { mel: MEL.boss, drums: 'half', ost: 'pulse', x: ['braam', 'choir'], floor: 0.8, reg: 67 }),
    // 地球星域防衛軍: 電子と弦の混成、機械的な打楽器。帝国の金管・行進曲と音色を分ける。
    earth_a: S(128, 9, 'aeolian', ['Am', 'F', 'C', 'G', 'Am', 'F', 'G', 'Em'], P4('bVI', 'bIII', 'bVII', 'v'), { mel: MEL.machine, lead: 'synth', drums: 'industrial', ost: 'arp', pad: 'both', bass: 'synth', x: ['zap'] }),
    earth_b: S(136, 4, 'phrygian', P4('i', 'bII', 'bVII', 'i'), P4('bVI', 'bVII', 'i', 'bII'), { lead: 'synth', drums: 'industrial', ost: 'drive', pad: 'synth', bass: 'pulse', x: ['zap'], dens: 'fast' }),
    earth_fleet: S(144, 11, 'aeolian', P4('i', 'bVI', 'bVII', 'i'), P4('bVI', 'bVII', 'iv', 'V'), { lead: 'brass', drums: 'industrial', ost: 'drive', pad: 'both', bass: 'pulse', x: ['braam', 'zap'], floor: 0.6, dens: 'fast' }),
    earth_boss: S(100, 6, 'phrygian', P4('i', 'bII', 'i', 'bVII'), P4('bVI', 'bII', 'v', 'i'), { lead: 'synth', drums: 'half', ost: 'arp', pad: 'synth', bass: 'pulse', x: ['braam', 'zap'], floor: 0.8, reg: 66 }),
    // バイオ: 部族的な太鼓、うねる低音、合唱
    bio_a: S(118, 6, 'phrydom', P4('i', 'bII', 'i', 'bVII'), P4('iv', 'bII', 'bVI', 'V'), { lead: 'choir', drums: 'tribal', ost: 'pulse', pad: 'strings', bass: 'wobble', x: ['choir'] }),
    bio_b: S(124, 1, 'phrygian', P4('i', 'bVI', 'bII', 'i'), P4('bVII', 'bVI', 'bII', 'V'), { lead: 'horn', drums: 'tribal', ost: 'drive', bass: 'wobble' }),
    bio_fleet: S(140, 3, 'phrydom', P4('i', 'bII', 'bVII', 'i'), P4('bVI', 'bVII', 'bII', 'V'), { lead: 'brass', drums: 'tribal', ost: 'gallop', bass: 'wobble', x: ['braam', 'choir'], floor: 0.6 }),
    bio_boss: S(96, 5, 'phrygian', P4('i', 'bII', 'i', 'bII'), P4('bVI', 'bII', 'v', 'i'), { lead: 'choir', drums: 'half', ost: 'pulse', bass: 'wobble', x: ['braam', 'choir'], floor: 0.8, reg: 66 }),
    // 古代文明: 合唱・ハープ・ティンパニ、荘厳
    ancient_a: S(66, 2, 'dorian', ['Dm', 'C', 'Bb', 'A', 'Dm', 'C', 'Bb', 'A'], P4('i', 'IV', 'bVII', 'i'), { mel: MEL.ancient, lead: 'choir', drums: 'sparse', ost: 'harp', pad: 'both', bass: 'orch', x: ['bells'], dens: 'slow', ostLv: 0 }),
    ancient_b: S(84, 9, 'dorian', P4('i', 'IV', 'i', 'bVII'), P4('bIII', 'IV', 'bVII', 'i'), { lead: 'horn', drums: 'sparse', ost: 'harp', pad: 'choir', x: ['bells'], dens: 'slow', ostLv: 0 }),
    ancient_fleet: S(120, 4, 'aeolian', P4('bVI', 'v', 'i', 'v'), P4('bVI', 'bVII', 'i', 'i'), { lead: 'brass', drums: 'epic', ost: 'gallop', pad: 'strings', x: ['choir', 'braam'], floor: 0.6 }),
    ancient_boss: S(88, 2, 'harmonic', P4('i', 'bVI', 'iv', 'V'), P4('bVI', 'bIII', 'iv', 'V'), { lead: 'choir', drums: 'half', ost: 'pulse', x: ['choir', 'braam'], floor: 0.8, reg: 67 }),
    // ヴォイド: まばらで不安な響き
    void_a: S(90, 9, 'phrygian', P4('i', 'bII', 'i', 'bII'), P4('iv', 'bII', 'v', 'i'), { lead: 'bell', drums: 'sparse', ost: 'pulse', pad: 'choir', bass: 'drone', x: ['zap'], dens: 'slow', ostLv: 0.5 }),
    void_b: S(96, 1, 'aeolian', P4('i', 'bVI', 'v', 'i'), P4('bII', 'bVI', 'v', 'i'), { lead: 'strings', drums: 'heart', ost: 'pulse', pad: 'synth', bass: 'drone', dens: 'slow' }),
    void_fleet: S(132, 10, 'phrygian', P4('i', 'bII', 'bVII', 'i'), P4('bVI', 'bII', 'bVII', 'v'), { lead: 'brass', drums: 'epic', ost: 'drive', pad: 'both', bass: 'pulse', x: ['braam'], floor: 0.6 }),
    void_boss: S(84, 8, 'phrygian', P4('i', 'bII', 'i', 'bII'), P4('bVI', 'bII', 'iv', 'i'), { lead: 'choir', drums: 'half', ost: 'pulse', pad: 'choir', bass: 'drone', x: ['braam', 'choir'], floor: 0.8, reg: 64 }),
    // 小惑星帯: 駆け抜ける弦の刻みとハープ
    belt_1: S(124, 4, 'aeolian', P4('i', 'bVII', 'bVI', 'bVII'), P4('bVI', 'bIII', 'bVII', 'i'), { lead: 'horn', drums: 'drive', ost: 'drive', x: ['bells'], floor: 0.5 }),
    belt_2: S(132, 8, 'dorian', P4('i', 'IV', 'bVII', 'i'), P4('bIII', 'bVII', 'IV', 'IV'), { lead: 'strings', drums: 'epic', ost: 'gallop', x: ['bells'], floor: 0.5 }),
    belt_3: S(140, 0, 'aeolian', P4('i', 'bVI', 'bIII', 'bVII'), P4('iv', 'bVI', 'bVII', 'V'), { lead: 'brass', drums: 'drive', ost: 'drive', pad: 'both', bass: 'pulse', floor: 0.5, dens: 'fast' }),
    // 惑星の内部: 心臓の鼓動のような太鼓、低い刻み、緊張
    core_1: S(110, 2, 'phrygian', P4('i', 'bII', 'i', 'bII'), P4('bVI', 'bII', 'bVII', 'i'), { lead: 'horn', drums: 'heart', ost: 'pulse', bass: 'drone', x: ['riser'], floor: 0.4, reg: 67 }),
    core_2: S(118, 5, 'harmonic', P4('i', 'bVI', 'iv', 'V'), P4('i', 'bII', 'bVI', 'V'), { lead: 'strings', drums: 'tribal', ost: 'drive', bass: 'pulse', floor: 0.45 }),
    core_3: S(124, 11, 'phrydom', P4('i', 'bII', 'bVII', 'i'), P4('iv', 'bII', 'V', 'i'), { lead: 'choir', drums: 'heart', ost: 'gallop', bass: 'wobble', x: ['choir'], floor: 0.45 }),
    core_heart: S(100, 1, 'phrygian', P4('i', 'bII', 'bVI', 'bII'), P4('iv', 'bII', 'v', 'i'), { lead: 'brass', drums: 'half', ost: 'drive', x: ['braam', 'choir'], floor: 0.85, reg: 66 }),
    // ボス・区切り
    boss_heavy: S(104, 4, 'aeolian', P4('i', 'bVI', 'bIII', 'bVII'), P4('bVI', 'bVII', 'i', 'V'), { lead: 'brass', drums: 'half', ost: 'gallop', x: ['braam', 'choir'], floor: 0.85 }),
    final_boss: S(132, 9, 'aeolian', ['Am', 'F', 'C', 'G', 'Am', 'F', 'Dm', 'E'], P4('bVI', 'bVII', 'i', 'V'), { mel: MEL.final, drums: 'epic', ost: 'gallop', pad: 'both', bass: 'pulse', x: ['braam', 'choir'], floor: 0.9 }),
    last_boss: S(150, 5, 'harmonic', P4('i', 'bVI', 'iv', 'V'), P4('bVI', 'bII', 'bVII', 'V'), { lead: 'brass', drums: 'epic', ost: 'drive', pad: 'both', bass: 'pulse', x: ['braam', 'choir'], floor: 1, dens: 'fast' }),
    hub_gate: S(112, 2, 'aeolian', P4('i', 'bVI', 'bVII', 'i'), P4('iv', 'bVI', 'bVII', 'V'), { lead: 'horn', drums: 'epic', ost: 'gallop', x: ['braam', 'choir'], floor: 0.8 }),
    event_horizon: S(96, 10, 'phrygian', P4('i', 'bII', 'bVI', 'bII'), P4('iv', 'v', 'bII', 'i'), { lead: 'choir', drums: 'heart', ost: 'arp', pad: 'synth', bass: 'drone', x: ['zap', 'riser'], floor: 0.35, dens: 'slow' }),
    last_bastion: S(100, 7, 'dorian', P4('i', 'IV', 'bVII', 'i'), P4('bVI', 'bVII', 'I', 'I'), { lead: 'horn', drums: 'march', ost: 'gallop', x: ['choir', 'bells'], floor: 0.45 }),
  };
  const ALIAS = { cruise: 'empire_a', fleet: 'empire_fleet', boss: 'boss_heavy', empire: 'empire_a', machine: 'earth_a', machine_a: 'earth_a', machine_b: 'earth_b', machine_fleet: 'earth_fleet', machine_boss: 'earth_boss', bio: 'bio_a', ancient: 'ancient_a', void: 'void_a' };   // 旧トラック名との互換
  const TRACKS = {};
  Object.keys(SPECS).forEach((name, n) => {
    const sp = SPECS[name], rng = mulberry(n * 7919 + 17), A = sp.A.map(c => chordOf(c, sp.key)), B = sp.B.map(c => chordOf(c, sp.key));
    const melA = sp.mel ? parseMel(sp.mel) : genMelody(rng, sp, A, false), melB = genMelody(rng, sp, B, true);
    const byA = {}, byB = {}; for (const e of melA) (byA[e.s] = byA[e.s] || []).push(e); for (const e of melB) (byB[e.s] = byB[e.s] || []).push(e);
    TRACKS[name] = { name, bpm: sp.bpm, sp, A, B, byA, byB };
  });

  // ---------- 演奏(1ステップ=16分音符。A 8小節 → B 8小節 をくりかえす) ----------
  const GATE = ['str', 'brass', 'choir', 'perc', 'synth', 'pad', 'bass', 'pluck', 'fx'];
  function gates(name) { if (!TG[name]) { TG[name] = {}; for (const k of GATE) { const g = ctx.createGain(); g.gain.value = 0; g.connect(SEC[k]); TG[name][k] = g; } } return TG[name]; }
  const OST = { gallop: [1, 0, 1, 1, 1, 0, 1, 1, 1, 0, 1, 1, 1, 0, 1, 1], drive: [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1], pulse: [1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0], arp: [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1], harp: [1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0] };
  function play(tr, i, t, sd) {
    const sp = tr.sp, G = gates(tr.name), p = i % 256, B = p >= 128, bar = (p >> 4) & 7, s = p & 15, prog = B ? tr.B : tr.A, ch = prog[bar], prev = prog[(bar + 7) & 7];
    const lv = Math.max(sp.floor, lvl), barS = sd * 16, rt = rootIn(ch, 36), newCh = s === 0 && (bar === 0 || ch !== prev || bar % 2 === 0);
    const r = n => R(i * 13 + n + tr.name.length * 101);
    // 和音の持続(弦・シンセ・合唱)
    if (newCh) {
      const len = barS * ((bar % 2 === 0 && prog[bar + 1] === ch) ? 2 : 1) - sd * 0.5, vs = voiceIn(ch, B ? 55 : 52);
      if (sp.pad === 'strings' || sp.pad === 'both') { vs.forEach(m => strL(m, t, len, G.str, 0.022 + 0.01 * lv, { a: 0.5 })); strL(rt + 12, t, len, G.str, 0.024, { a: 0.45 }); }
      if (sp.pad === 'synth' || sp.pad === 'both') vs.forEach(m => sPad(m + 12, t, len, G.pad, sp.pad === 'both' ? 0.012 : 0.022, { c1: 2000 + 1500 * lv }));
      if (sp.pad === 'choir' || (B && sp.x.includes('choir'))) vs.forEach((m, k) => choirV(m + (k ? 0 : 12), t, len, G.choir, 0.02 + 0.01 * lv, { v: B ? 'a' : 'o' }));
      if (sp.bass === 'orch') { strL(rt, t, len, G.str, 0.03, { a: 0.3, bright: 0.7 }); if (lv > 0.4) tone(mf(rt), len * 0.5, { at: t, type: 'sine', vol: 0.05, a: 0.02, bus: G.bass }); }
      if (sp.bass === 'drone') { sPad(rt, t, len, G.pad, 0.02, { c0: 200, c1: 600 }); tone(mf(rt), len, { at: t, type: 'sine', vol: 0.05, a: 0.4, bus: G.bass }); }
    }
    // 低音
    if (sp.bass === 'synth' && s % 2 === 0) sBass(rt + (s % 8 === 6 ? 12 : 0), t, sd * 1.6, G.bass, 0.08);
    if (sp.bass === 'pulse' && (lv > 0.3 || s % 4 === 0)) sBass(rt + (s % 4 === 3 ? 12 : 0), t, sd * 0.85, G.bass, s % 4 === 0 ? 0.085 : 0.06, { c0: 650 + 500 * lv });
    if (sp.bass === 'wobble' && s % 2 === 0) sBass(rt, t, sd * 1.8, G.bass, 0.08, { wob: 3 + (s % 5) * 0.5, c0: 600 });
    // 刻み(激しいときに、加わる)
    const ost = OST[sp.ost];
    if (ost && ost[s] && lv >= sp.ostLv) {
      const vs = voiceIn(ch, B ? 48 : 45), k = s >> 2;
      if (sp.ost === 'arp') sArp([...vs, vs[0] + 12][(s % 4 + (bar & 1)) % 4] + 12 + 12 * ((s >> 3) & 1), t, sd * 0.8, G.synth, 0.02 + 0.012 * lv, s % 2 ? -0.55 : 0.55);
      else if (sp.ost === 'harp') pluck([...vs, vs[0] + 12, vs[1] + 12][((s >> 1) + bar) % 5] + 12, t, G.pluck, 0.05 + 0.02 * lv, ((s >> 1) % 2 ? 0.4 : -0.4));
      else if (sp.ost === 'pulse') strS(rt + 12 + (s % 8 === 4 ? 7 : 0), t, G.str, 0.03 + 0.012 * lv, { dur: sd * 1.2 });
      else strS(sp.ost === 'drive' ? [vs[0], vs[0], vs[2], vs[0], vs[1], vs[0], vs[2], vs[1]][s % 8] : vs[k % 3], t, G.str, (s % 4 === 0 ? 0.04 : 0.028) + 0.012 * lv, { dur: sd * 0.9 });
    }
    // 打楽器
    const D = sp.drums, full = lv > 0.5, P = G.perc;
    if (D === 'epic') { if (s === 0 || s === 8) taiko(t, P, 0.5, { f: 58 }); if (full && (s === 6 || s === 11 || s === 14)) taiko(t, P, 0.3, { f: 76, pan: s === 11 ? 0.4 : -0.4 }); if (full && (s === 4 || s === 12)) snare(t, P, 0.13); if (bar % 4 === 3 && s >= 12 && full) taiko(t, P, 0.18 + (s - 12) * 0.06, { f: 88, len: 0.3 }); }
    if (D === 'drive') { if (s % 4 === 0) kickE(t, P, 0.42); if (s === 4 || s === 12) snare(t, P, 0.14); if (full) hatE(t, P, s % 2 ? 0.025 : 0.04, s % 4 === 2); if (s === 0 && bar % 2 === 0) taiko(t, P, 0.35, { f: 60 }); if (full && s === 14 && bar % 2) taiko(t, P, 0.3, { f: 80 }); }
    if (D === 'march') { if ([0, 4, 6, 8, 12].includes(s) || (full && [3, 11, 14, 15].includes(s))) snare(t, P, [0, 8].includes(s) ? 0.16 : 0.07); if (s === 0 || s === 8) taiko(t, P, 0.4, { f: 55 }); if (full && s % 4 === 0) timp(rt + 12, t, P, 0.12); }
    if (D === 'half') { if (s === 0) { taiko(t, P, 0.6, { f: 52 }); kickE(t, P, 0.45); } if (s === 10) taiko(t, P, 0.4, { f: 58 }); if (s === 8) snare(t, P, 0.2); if (full && s % 2 === 0) hatE(t, P, 0.02); if (bar % 2 === 1 && s === 12) timp(rt + 12, t, P, 0.2); }
    if (D === 'sparse') { if (s === 0 && bar % 2 === 0) taiko(t, P, 0.35 + 0.15 * lv, { f: 56 }); if (full && s === 8 && bar % 2 === 1) timp(rt + 12, t, P, 0.15); }
    if (D === 'industrial') { if (s === 0 || s === 8 || (full && s === 10)) kickE(t, P, 0.45); if (s === 4 || s === 12) metal(t, P, 0.07, s === 4 ? -0.3 : 0.3); if (full) hatE(t, P, s % 4 === 2 ? 0.04 : 0.02, false, s % 2 ? 0.4 : -0.4); if (sp.x.includes('zap') && r(1) < 0.12) zapP(t, P, 0.035, r(2) * 2 - 1); if (s === 0 && bar % 2 === 0) taiko(t, P, 0.35, { f: 58 }); }
    if (D === 'tribal') { const pat = [0, 3, 6, 8, 10, 12, 14]; if (pat.includes(s) && (full || s % 8 === 0)) taiko(t, P, s % 8 === 0 ? 0.45 : 0.25, { f: [56, 64, 72, 58, 80, 66, 90][pat.indexOf(s)], pan: (pat.indexOf(s) % 3 - 1) * 0.35 }); if (full) hatE(t, P, 0.018, false, s % 2 ? 0.5 : -0.5); }
    if (D === 'heart') { if (s === 0 || s === 8) taiko(t, P, 0.42, { f: 50, len: 0.5 }); if (s === 2 || s === 10) taiko(t, P, 0.26, { f: 46, len: 0.4 }); if (full && s % 4 === 3) hatE(t, P, 0.02); }
    // 旋律
    const mel = (B ? tr.byB : tr.byA)[p & 127];
    if (mel && sp.lead !== 'none') for (const e of mel) {
      const d = e.d * sd * 0.95, m = e.m, v = 0.8 + 0.4 * lv;
      if (sp.lead === 'brass') { brass(m, t, d, G.brass, 0.045 * v, { dyn: 0.5 + 0.5 * lv }); if (B || lv > 0.6) brass(m - 12, t, d, G.brass, 0.03 * v, { horn: true, dyn: 0.6 }); }
      else if (sp.lead === 'horn') { brass(m - (m > 76 ? 12 : 0), t, d, G.brass, 0.05 * v, { horn: true, dyn: 0.5 + 0.4 * lv }); if (B) strL(m + (m > 76 ? 0 : 12), t, d, G.str, 0.02, { a: 0.12 }); }
      else if (sp.lead === 'strings') { strL(m, t, d, G.str, 0.035 * v, { a: 0.1, rel: 0.4 }); strL(m + 12, t, d, G.str, 0.018 * v, { a: 0.12, rel: 0.4 }); }
      else if (sp.lead === 'synth') { sLead(m, t, d, G.synth, 0.045 * v, { c1: 3800 + 1500 * lv }); if (B) strL(m - 12, t, d, G.str, 0.02, { a: 0.1 }); }
      else if (sp.lead === 'choir') { choirV(m, t, d, G.choir, 0.04 * v, { a: 0.2, v: 'a' }); strL(m, t, d, G.str, 0.016, { a: 0.15 }); }
      else if (sp.lead === 'piano') piano(m, t, d, G.pluck, 0.09, (m - 66) / 30);
      else if (sp.lead === 'pluck') pluck(m, t, G.pluck, 0.08, 0);
      else if (sp.lead === 'bell') { glassB(mf(m + 12), Math.min(2.4, d + 0.6), 0.03, G.pluck, t, (m - 66) / 25); strL(m, t, d, G.str, 0.014, { a: 0.3 }); }
    }
    // 飾り: 鐘・電子音
    if (sp.x.includes('bells') && s % 4 === 0 && r(3) < 0.35) glassB(mf(voiceIn(ch, 72)[(s >> 2) % 3] + 12), 1.4, 0.014, G.pluck, t, r(4) * 1.2 - 0.6);
    // 区切り: 頭で衝撃(ブワーン・シンバル)、終わりで盛り上げ(逆シンバル・ロール・上昇音)
    if (p % 128 === 0) { crash(t, P, 0.07 + 0.05 * lv); if (sp.x.includes('braam') && lv > 0.3) braam(rt - 12 + 24, t, G.fx, 0.05); else if (lv > 0.4) boom(t, G.fx, 0.22); }
    if (sp.x.includes('braam') && lv > 0.6 && s === 0 && bar === 4) braam(rt + 12, t, G.fx, 0.04, 1.6);
    if (p % 128 === 112) { swell(t, barS, P, 0.06 + 0.05 * lv); if (lv > 0.5 && (D === 'epic' || D === 'march' || D === 'half')) roll(t + barS * 0.5, barS * 0.5, P, 0.03, 0.12); if (sp.x.includes('riser') || lv > 0.7) riser(t, barS, G.fx, 0.04 + 0.03 * lv); }
  }
  function setBgm(name) {   // 切り替えは、前の曲を静かに消しながら、新しい曲を上げる(クロスフェード)
    if (name && !TRACKS[name]) name = ALIAS[name] || null;
    if (bgm.name === name) return;
    const now = ctx.currentTime;
    if (bgm.name && TG[bgm.name]) for (const k of GATE) TG[bgm.name][k].gain.setTargetAtTime(0, now, 0.5);
    bgm.name = name; bgm.step = 0; bgm.next = now + 0.08;
    if (name) { const G = gates(name); for (const k of GATE) G[k].gain.setTargetAtTime(1, now, 0.4); if (bgmDly) bgmDly.delayTime.setTargetAtTime(Math.min(1.9, 60 / TRACKS[name].bpm * 0.75), now, 0.1); }
  }
  function schedule() {
    if (!bgm.name) return;
    const tr = TRACKS[bgm.name], sd = 60 / tr.bpm / 4;
    if (bgm.next < ctx.currentTime) bgm.next = ctx.currentTime + 0.05;
    while (bgm.next < ctx.currentTime + 0.3) {
      const i = bgm.step++;
      try { play(tr, i, bgm.next, sd); } catch (e) { errCount++; lastErr = 'bgm ' + bgm.name + ': ' + e.message; }
      bgm.next += sd;
    }
  }

  // ---------- 効果音の部品 ----------
  const digi = (f0, f1, dur, vol, delay = 0, pan = 0) => fmVoice(f0, dur, { delay, f1, r1: 1.5, r2: 3.01, r3: 0.5, i1: f0 * 1.1, i2: f0 * 0.4, i3: f0 * 0.1, decay: 1, vol, cut: 7000, pan });
  const glass = (f, dur, vol, delay = 0, pan = 0) => fmVoice(f, dur, { delay, r1: 3.5, r2: 5.43, r3: 0.5, i1: f * 1.4, i2: f * 0.55, i3: f * 0.05, decay: 1, vol, a: 0.002, cut: 9000, pan });
  const sub = (f0, f1, dur, vol, delay = 0) => tone(f0, dur, { delay, type: 'sine', f1, vol, a: 0.002 });
  const air = (dur, f0, f1, vol, delay = 0, q = 1.4) => noise(dur, { delay, filter: 'bandpass', f0, f1, q, vol });
  const holo = (f0, f1, dur, vol, delay = 0) => fmVoice(f0, dur, { delay, f1, r1: 2, r2: 2.01, r3: 1, i1: f0 * 0.6, i2: f0 * 0.2, i3: f0 * 0.05, decay: 1, vol, cut: 8000 });
  const body = (dur, f0, f1, vol, k, delay = 0) => noise(dur, { delay, filter: 'lowpass', f0, f1, vol, drive: k, q: 0.8 });   // 爆発の本体: 歪ませたノイズ
  function crackle(n, dur, vol, delay = 0, hi = 5000) { for (let i = 0; i < n; i++) { const d = delay + Math.pow(Math.random(), 0.7) * dur; noise(0.006 + Math.random() * 0.02, { delay: d, filter: 'bandpass', f0: hi * (0.5 + Math.random()), q: 1.8, vol: vol * (0.4 + Math.random() * 0.6) * (1 - (d - delay) / (dur + 0.01) * 0.6), pan: Math.random() * 1.4 - 0.7 }); } }   // 破片のパチパチ
  function clinks(n, dur, vol, delay = 0) { for (let i = 0; i < n; i++) fmVoice(1800 + Math.random() * 2600, 0.12 + Math.random() * 0.2, { delay: delay + Math.random() * dur, r1: 1.41, r2: 2.76, r3: 0.5, i1: 900, i2: 300, i3: 50, decay: 1, vol: vol * (0.5 + Math.random() * 0.5), a: 0.001, cut: 9000, pan: Math.random() * 1.2 - 0.6 }); }   // 金属片の音
  // ---------- 効果音(出だし+本体+余韻の3層。位置つきなら、左右・距離・遠さの残響がつく) ----------
  const SE = {
    shotC: () => {   // 自機のレーザー: 高い閃光 → 落ちる光線 → 小さな衝撃
      const pm = .96 + Math.random() * .08;
      noise(0.006, { filter: 'highpass', f0: 7000, vol: 0.045 });
      fmVoice(2500 * pm, 0.11, { f1: 420 * pm, r1: 1.01, r2: 2.02, r3: 0.5, i1: 900, i2: 260, i3: 80, decay: 1, vol: 0.075, cut: 7000, pan: Math.random() < .5 ? -.22 : .22 });
      sub(900, 70, 0.05, 0.07); if (fmStyle) playFm('shotC', pm, 0.45); glass(3300 * pm, 0.08, 0.01, 0.01);
    },
    shotC_chip: () => { tone(2400, 0.12, { type: 'sawtooth', f1: 220, vol: 0.1 }); noise(0.02, { filter: 'highpass', f0: 6000, vol: 0.06 }); },
    shotB: () => { const pm = .96 + Math.random() * .08; noise(0.008, { filter: 'highpass', f0: 6000, vol: 0.05 }); fmVoice(1100 * pm, .22, { f1: 90, r1: 1.5, r2: 2.99, r3: .5, i1: 1500, i2: 420, i3: 120, decay: 1, vol: .12, cut: 5000 }); sub(160, 45, .16, .16); body(0.1, 2500, 400, 0.05, 2); },
    lock: () => { [1760, 2217, 2637].forEach((f, i) => glass(f, 0.2, 0.045, i * 0.055, (i - 1) * 0.25)); if (fmStyle) playFm('lock', 1, 0.6); },
    lock_chip: () => { for (let i = 0; i < 3; i++) tone(1200, 0.05, { delay: i * 0.07, type: 'square', vol: 0.14 }); },
    warning: () => { for (let i = 0; i < 4; i++) { fTone(i % 2 ? 330 : 440, 0.26, { delay: i * 0.3, type: 'sawtooth', c0: 1800, c1: 900, q: 3, vol: 0.08, a: 0.02 }); fTone(i % 2 ? 331.5 : 442, 0.26, { delay: i * 0.3, type: 'square', c0: 1200, c1: 600, q: 2, vol: 0.05, a: 0.02 }); sub(70, 45, 0.28, 0.12, i * 0.3); } },   // 警報のクラクション(2音)
    warning_chip: () => { for (let i = 0; i < 3; i++) tone(140, 0.45, { delay: i * 0.6, type: 'sawtooth', vol: 0.4 }); },
    formC: () => { fTone(90, 0.5, { f1: 480, c0: 500, c1: 5000, q: 6, vol: 0.14 }); for (let i = 0; i < 4; i++) { sub(180, 60, 0.06, 0.18, 0.12 + i * 0.08); noise(0.03, { delay: 0.12 + i * 0.08, filter: 'bandpass', f0: 2600, vol: 0.06 }); } air(0.2, 800, 3200, 0.1); [880, 1175, 1568].forEach((f, i) => glass(f, 0.3, 0.04, 0.45 + i * 0.05)); },   // 変形: 駆動音とロックの音
    formB: () => { fTone(2400, 0.4, { f1: 300, c0: 7000, c1: 500, q: 5, vol: 0.11 }); for (let i = 0; i < 3; i++) { sub(160, 55, 0.06, 0.16, 0.1 + i * 0.09); noise(0.03, { delay: 0.1 + i * 0.09, filter: 'bandpass', f0: 2200, vol: 0.06 }); } [1568, 1175, 880].forEach((f, i) => glass(f, 0.28, 0.04, 0.35 + i * 0.05)); },
    missile: () => { sub(240, 60, 0.12, 0.25); noise(0.05, { filter: 'bandpass', f0: 1800, vol: 0.12 }); noise(0.9, { filter: 'bandpass', f0: 500, f1: 3800, q: 1.2, vol: 0.16, a: 0.08 }); noise(0.7, { filter: 'highpass', f0: 4000, vol: 0.04, a: 0.1 }); },   // ミサイル: 点火 → 噴射の風切り
    torpedo: () => { sub(120, 30, 0.48, 0.33); noise(0.42, { filter: 'bandpass', f0: 260, f1: 1050, q: 1, vol: 0.12, a: 0.06 }); tone(210, 0.42, { type: 'triangle', f1: 64, vol: 0.08 }); }, // 重い魚雷の発射
    fighterLaunch: () => { for (let i = 0; i < 3; i++) { noise(0.13, { delay: i * 0.07, filter: 'highpass', f0: 2200, vol: 0.035, a: 0.008, pan: (i - 1) * 0.4 }); tone(650 + i * 90, 0.12, { delay: i * 0.07, type: 'sawtooth', f1: 180, vol: 0.025, pan: (i - 1) * 0.4 }); } }, // 艦載機の連続発艦
    hit: () => { sub(190, 45, 0.22, 0.5); body(0.2, 3000, 300, 0.28, 3); crackle(8, 0.25, 0.12, 0.01, 6000); holo(1300, 200, 0.18, 0.07); clinks(2, 0.2, 0.03, 0.02); },   // 被弾: 衝撃+電撃のパチパチ
    playerBoom: () => { sub(95, 22, 1.8, 0.6); body(1.6, 3500, 50, 0.5, 3.5, 0.008); crackle(26, 1.4, 0.14); clinks(8, 1.2, 0.04, 0.1); for (let i = 0; i < 6; i++) glass(2200 - i * 240, 0.5, 0.025, 0.08 + i * 0.09, i % 2 ? 0.5 : -0.5); digi(1400, 50, 1.2, 0.06); },
    eshot: () => { const pm = 0.9 + Math.random() * 0.2; fTone(1300 * pm, 0.12, { type: 'square', f1: 260 * pm, c0: 4200, c1: 600, q: 5, vol: 0.05 }); holo(640 * pm, 180 * pm, 0.1, 0.03); noise(0.01, { filter: 'highpass', f0: 5000, vol: 0.03 }); },   // 敵の光線(低く、濁った音)
    allyShot: () => { const pm = 0.96 + Math.random() * 0.1; digi(2200 * pm, 440 * pm, 0.1, 0.045); glass(3600 * pm, 0.06, 0.01, 0.01); },
    cannon: () => { sub(150, 34, 0.7, 0.35); body(0.55, 2400, 140, 0.24, 3); fmVoice(170, .6, { f1: 40, r1: 1.01, r2: 1.99, r3: 3.02, i1: 900, i2: 380, i3: 150, decay: 1, vol: .14, cut: 3200 }); crackle(6, 0.4, 0.07); metal(ctx.currentTime + 0.03, OUT(), 0.05); },   // 主砲: 深い衝撃と、金属の響き
    boomS: () => { sub(115, 36, 0.4, 0.34); body(0.42, 3600, 170, 0.26, 2.5, 0.006); crackle(7, 0.35, 0.09); clinks(1, 0.3, 0.025, 0.05); },   // 小さな爆発
    boomM: () => { sub(92, 26, 1, 0.5); body(0.95, 3000, 80, 0.4, 3.2, 0.008); crackle(16, 0.9, 0.11); clinks(4, 0.8, 0.03, 0.08); noise(1.8, { filter: 'lowpass', f0: 380, vol: 0.12, a: 0.05, delay: 0.1 }); },   // 中くらいの爆発+地鳴りの余韻
    ping: () => { tone(1320, 1.2, { type: 'sine', vol: 0.09, a: 0.004 }); glass(1319, 1.1, 0.05, 0.28); },   // ソナー
    alert: () => { for (let i = 0; i < 2; i++) { digi(700, 1500, 0.13, 0.07, i * 0.17); glass(1760, 0.2, 0.03, i * 0.17); } },
    clang: () => { fmVoice(520, 0.5, { f1: 380, r1: 1.41, r2: 2.76, r3: 0.5, i1: 1100, i2: 520, i3: 80, decay: 1, vol: 0.16, cut: 6000 }); sub(160, 50, 0.18, 0.3); noise(0.25, { filter: 'bandpass', f0: 3200, f1: 1200, q: 2, vol: 0.08 }); },   // 衝突: 金属の響き+こすれ
    kin: () => { fmVoice(3400, 0.28, { f1: 2500, r1: 1.41, r2: 2.2, r3: 0.5, i1: 1200, i2: 300, i3: 50, decay: 1, vol: 0.07, cut: 9000 }); noise(0.02, { filter: 'highpass', f0: 6000, vol: 0.06 }); },   // 跳弾
    coreOpen: () => { fTone(120, 1.1, { f1: 2400, c0: 400, c1: 7000, q: 5, vol: 0.11 }); sub(60, 40, 1, 0.32); air(1, 300, 5000, 0.12); [523, 784, 1047].forEach((f, i) => glass(f, 0.9, 0.05, 0.9 + i * 0.06)); },
    bossHit: () => { metal(ctx.currentTime, OUT(), 0.1); sub(150, 60, 0.2, 0.3); crackle(4, 0.15, 0.06); },
    bossBoom1: () => { for (let i = 0; i < 8; i++) { sub(105 - i * 5, 32, 0.4, 0.24, i * 0.13); body(0.3, 2600, 150, 0.2, 3, i * 0.13); crackle(4, 0.3, 0.07, i * 0.13); } clinks(8, 1.2, 0.03); noise(2.4, { filter: 'lowpass', f0: 300, vol: 0.16, a: 0.2 }); },   // 大型艦の連続爆発
    bossBoom2: () => { sub(72, 18, 2.8, 0.65); body(2.5, 3200, 36, 0.55, 4); crackle(32, 2.2, 0.12); clinks(12, 2, 0.035, 0.1); noise(3.2, { filter: 'lowpass', f0: 240, vol: 0.2, a: 0.3, delay: 0.2 }); noise(2.4, { filter: 'highpass', f0: 5500, vol: 0.1, a: 0.05 }); digi(2000, 60, 1.8, 0.05); },   // 最後の大爆発
    warpCharge: () => { fTone(140, 1.7, { f1: 3200, c0: 500, c1: 6500, q: 6, vol: 0.16 }); fTone(210, 1.7, { f1: 4800, c0: 600, c1: 7000, q: 4, vol: 0.08 }); noise(1.7, { filter: 'bandpass', f0: 300, f1: 6500, q: 1.5, vol: 0.12, a: 0.3 }); tone(70, 1.7, { type: 'sine', f1: 300, vol: 0.18 }); },
    warpJump: () => { sub(160, 32, 0.8, 0.5); noise(1.1, { filter: 'bandpass', f0: 7000, f1: 200, q: 1, vol: 0.32 }); digi(3000, 180, 0.6, 0.09); [1568, 2093, 3136, 4186].forEach((f, i) => glass(f, 0.7, 0.045, 0.05 + i * 0.05, (i - 1.5) * 0.4)); },
    warpIn: () => { fTone(90, 1.6, { f1: 2600, c0: 400, c1: 7500, q: 5, vol: 0.13 }); noise(1.6, { filter: 'bandpass', f0: 500, f1: 7500, q: 1.2, vol: 0.14, a: 0.5 }); tone(60, 1.6, { type: 'sine', f1: 220, vol: 0.15 }); sub(130, 28, 0.9, 0.5, 1.75); body(0.6, 3500, 100, 0.3, 3, 1.75); [880, 1319, 1760, 2637].forEach((f, i) => glass(f, 0.8, 0.05, 1.77 + i * 0.05, (i - 1.5) * 0.4)); },
    warpS: () => { digi(3400, 400, 0.28, 0.06); air(0.2, 3000, 8500, 0.08); sub(180, 70, 0.12, 0.14, 0.24); },
    coin: () => { [1046, 1318, 1568, 2093].forEach((f, i) => glass(f, 0.45, 0.09, i * 0.07, (i - 1.5) * 0.2)); sub(200, 100, 0.15, 0.15); },
    tick: () => holo(2400, 1800, 0.05, 0.05),
    ok: () => { glass(1568, 0.28, 0.08, 0, -0.2); glass(2093, 0.32, 0.08, 0.06, 0.2); },
    radio: () => { noise(0.05, { filter: 'bandpass', f0: 2600, q: 1.2, vol: 0.05 }); glass(1900, 0.06, 0.03, 0.03); noise(0.035, { filter: 'bandpass', f0: 3400, f1: 2000, q: 1.5, vol: 0.03, delay: 0.09 }); },
  };
  const MIN_GAP = { shotB: 0.07, shotC: 0.07, eshot: 0.09, allyShot: 0.11, cannon: 0.2, torpedo: 0.12, fighterLaunch: 0.18, boomS: 0.07, boomM: 0.12, tick: 0.05, kin: 0.08, bossHit: 0.12, hit: 0.1, clang: 0.15, alert: 3, warpS: 0.12, warpIn: 0.4, radio: 0.3 };
  function se(name, pos) {
    if (!SE[name]) return;
    if (ctx && ctx.state !== 'running' && wantResume) { if (pending.length < 3) pending.push(name); return; }
    if (!ok()) return;
    const now = ctx.currentTime, info = pos && LST ? spatialInfo(pos) : null, key = info ? name + info.side : name;
    if (info && info.d > 14000) return;
    if (last[key] && now - last[key] < (MIN_GAP[name] || 0.03)) return; last[key] = now;
    if (musicDuck && ['cannon', 'boomM', 'bossBoom1', 'bossBoom2', 'warpJump'].includes(name)) {
      duckUntil = Math.max(duckUntil, now + (name.startsWith('boss') ? 1.5 : 0.7));
      musicDuck.gain.setTargetAtTime(0.55, now, 0.025);
    }
    spat = info ? makeSpatial(info) : null;
    try { SE[name](); } catch (e) { errCount++; lastErr = name + ': ' + e.message; } finally { spat = null; }
  }

  // ---------- 毎フレーム: 噴射音・コックピットの機械音・遠くの戦闘の地鳴り・警告・BGM・聞き手の位置 ----------
  function loop(key, make) { if (!loops[key]) loops[key] = make(); return loops[key]; }
  function update(st) {
    if (!ctx) return;
    if (st.listener) LST = st.listener;
    if (!ok()) { for (const k of Object.keys(loops)) loops[k].g.gain.setTargetAtTime(0, ctx.currentTime, 0.05); return; }
    const now = ctx.currentTime, lv = Math.max(0, Math.min(1, st.thrust || 0)), ck = typeof cockpit !== 'undefined' && cockpit && !!st.listener;
    if (musicDuck && now >= duckUntil) musicDuck.gain.setTargetAtTime(1, now, 0.35);
    const th = loop('th', () => { const src = ctx.createBufferSource(), fl = ctx.createBiquadFilter(), g = ctx.createGain(); src.buffer = noiseBuf; src.loop = true; fl.type = 'lowpass'; fl.frequency.value = 300; g.gain.value = 0; src.connect(fl); fl.connect(g); g.connect(sfxBus); src.start(); const o1 = ctx.createOscillator(), o2 = ctx.createOscillator(), of = ctx.createBiquadFilter(), og = ctx.createGain(); o1.type = o2.type = 'sawtooth'; o1.frequency.value = 55; o2.frequency.value = 55.7; of.type = 'lowpass'; of.frequency.value = 200; og.gain.value = 0; o1.connect(of); o2.connect(of); of.connect(og); og.connect(sfxBus); o1.start(); o2.start(); return { g, fl, og, of, o1, o2 }; });   // 噴射: 風の音+エンジンのうなり
    th.g.gain.setTargetAtTime(lv * 0.14, now, 0.12); th.fl.frequency.setTargetAtTime(180 + lv * 900, now, 0.12);
    th.og.gain.setTargetAtTime(st.listener ? 0.02 + lv * 0.035 : 0, now, 0.2); th.of.frequency.setTargetAtTime(160 + lv * 700, now, 0.2); th.o1.frequency.setTargetAtTime(48 + lv * 30, now, 0.3); th.o2.frequency.setTargetAtTime(48.6 + lv * 30.5, now, 0.3);
    const hum = loop('hum', () => { const o = ctx.createOscillator(), o2 = ctx.createOscillator(), g = ctx.createGain(), am = ctx.createOscillator(), ag = ctx.createGain(); o.type = 'sine'; o.frequency.value = 110; o2.type = 'triangle'; o2.frequency.value = 220.4; am.frequency.value = 0.35; ag.gain.value = 0.004; am.connect(ag); ag.connect(g.gain); g.gain.value = 0; o.connect(g); o2.connect(g); g.connect(sfxBus); o.start(); o2.start(); am.start(); return { g }; });   // コックピットの機械のうなり
    hum.g.gain.setTargetAtTime(ck ? 0.012 : 0, now, 0.3);
    const rum = loop('rum', () => { const src = ctx.createBufferSource(), fl = ctx.createBiquadFilter(), g = ctx.createGain(), lfo = ctx.createOscillator(), lg = ctx.createGain(); src.buffer = noiseBuf; src.loop = true; fl.type = 'lowpass'; fl.frequency.value = 110; lfo.frequency.value = 0.13; lg.gain.value = 40; lfo.connect(lg); lg.connect(fl.frequency); g.gain.value = 0; src.connect(fl); fl.connect(g); g.connect(sfxBus); src.start(); lfo.start(); return { g }; });   // 遠くで続く戦闘の地鳴り
    rum.g.gain.setTargetAtTime(st.listener ? (st.intense ? 0.1 : 0.04) : 0, now, 0.8);
    if (st.alarm && now > alarmNext) { holo(1500, 1400, 0.16, 0.09); alarmNext = now + 0.7; }
    inten = st.intense ? 1 : 0; lvl += ((st.intense ? 1 : 0.25) - lvl) * 0.012;   // 激しさは、ゆっくり変わる(楽器が重なっていく)
    setBgm(st.bgm || null);
    schedule();
  }
  function setVol(kind, v) { vols[kind] = Math.max(0, Math.min(1, v)); if (!ctx) return; const node = kind === 'master' ? master : kind === 'sfx' ? sfxBus : bgmBus, now = ctx.currentTime; node.gain.setTargetAtTime(kind === 'master' && muted ? 0 : vols[kind], now, 0.03); }
  function voice(f0, dur, o) { if (ok()) fmVoice(f0, dur, o); }
  function tune() { return { vol: Object.assign({}, vols), style: fmStyle, fmBgm, fm: JSON.parse(JSON.stringify(FM)) }; }
  function applyTune(t) { if (!t) return; if (t.vol) for (const k of Object.keys(t.vol)) setVol(k, k === 'bgm' ? Math.max(t.vol[k], 0.3) : t.vol[k]); if (t.style !== undefined) fmStyle = !!t.style; if (t.fmBgm !== undefined) fmBgm = !!t.fmBgm; if (t.fm) for (const k of Object.keys(t.fm)) if (FM[k]) Object.assign(FM[k], t.fm[k]); }
  function resetTune() { for (const k of Object.keys(FM_DEFAULT)) FM[k] = JSON.parse(JSON.stringify(FM_DEFAULT[k])); fmStyle = true; fmBgm = true; setVol('master', 0.85); setVol('sfx', 0.85); setVol('bgm', 0.3); }
  if (typeof SND_TUNE !== 'undefined') applyTune(SND_TUNE);
  function toggle() { muted = !muted; if (master) master.gain.setTargetAtTime(muted ? 0 : vols.master, ctx.currentTime, 0.05); return muted; }
  return { resume, se, update, toggle, setVol, voice, playFm: n => { if (ok()) playFm(n); }, tune, applyTune, resetTune, fm: FM, fmDefault: FM_DEFAULT, get analyser() { return analyser; }, get context() { return ctx; }, get tap() { return comp; },
    get style() { return fmStyle; }, set style(v) { fmStyle = !!v; }, get fmBgm() { return fmBgm; }, set fmBgm(v) { fmBgm = !!v; }, get names() { return Object.keys(SE); }, get tracks() { return Object.keys(TRACKS); }, get muted() { return muted; }, get running() { return !!ctx && ctx.state === 'running'; }, get errors() { return errCount + (lastErr ? ' ' + lastErr : ''); },
    set level(v) { lvl = v; } };
})();
