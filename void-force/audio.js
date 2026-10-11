// 合成音(WebAudio)。BGM は面ごとにシードから作る短いループ(ベース+アルペジオ+ドラム)。
// iOS は touchend/click 等のあとでないと鳴らない → Snd.init() を最初の操作から呼ぶ。音の聴き心地は耳でしか確かめられない(未確認)。
(function () {
  const Snd = window.Snd = { on: true, ctx: null };
  let master = null, bgmGain = null, seGain = null, timer = null, nextT = 0, step = 0, song = null, noiseBuf = null, lastSe = {};
  Snd.init = function () {
    if (Snd.ctx) { if (Snd.ctx.state === 'suspended') Snd.ctx.resume(); return; }
    const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return;
    try {
      const c = Snd.ctx = new AC();
      master = c.createGain(); master.gain.value = Snd.on ? .5 : 0; master.connect(c.destination);
      bgmGain = c.createGain(); bgmGain.gain.value = .55; bgmGain.connect(master);
      seGain = c.createGain(); seGain.gain.value = .8; seGain.connect(master);
      noiseBuf = c.createBuffer(1, c.sampleRate * 1, c.sampleRate); const d = noiseBuf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    } catch (e) { Snd.ctx = null; }
  };
  Snd.setOn = function (v) { Snd.on = v; if (master) master.gain.value = v ? .5 : 0; };
  function tone(dst, f, t, dur, type, vol, slide) {
    const c = Snd.ctx, o = c.createOscillator(), g = c.createGain(); o.type = type; o.frequency.setValueAtTime(f, t);
    if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(20, f * slide), t + dur);
    g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(.0008, t + dur); o.connect(g); g.connect(dst); o.start(t); o.stop(t + dur + .02);
  }
  function noise(dst, t, dur, vol, hp) {
    const c = Snd.ctx, s = c.createBufferSource(), g = c.createGain(), f = c.createBiquadFilter(); s.buffer = noiseBuf; f.type = 'highpass'; f.frequency.value = hp || 800;
    g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(.0008, t + dur); s.connect(f); f.connect(g); g.connect(dst); s.start(t); s.stop(t + dur + .02);
  }
  // 効果音。同じ音が1/30秒以内に重ならないようにする(弾幕で音が割れないように)
  Snd.se = function (name) {
    const c = Snd.ctx; if (!c || !Snd.on) return; const t = c.currentTime;
    if (lastSe[name] && t - lastSe[name] < (name === 'shot' ? .09 : .04)) return; lastSe[name] = t;
    switch (name) {
      case 'shot': tone(seGain, 880, t, .05, 'square', .035, .6); break;
      case 'hit': tone(seGain, 220, t, .04, 'square', .04, .7); break;
      case 'kill': noise(seGain, t, .12, .16, 600); tone(seGain, 300, t, .12, 'sawtooth', .07, .3); break;
      case 'big': noise(seGain, t, .6, .3, 200); tone(seGain, 120, t, .6, 'sawtooth', .15, .3); break;
      case 'gem': tone(seGain, 1200, t, .05, 'triangle', .04, 1.4); break;
      case 'graze': tone(seGain, 1800, t, .03, 'sine', .02, 1); break;
      case 'level': [523, 659, 784, 1046].forEach((f, i) => tone(seGain, f, t + i * .07, .18, 'square', .06)); break;
      case 'pick': tone(seGain, 660, t, .08, 'square', .06); tone(seGain, 990, t + .06, .12, 'square', .06); break;
      case 'miss': noise(seGain, t, .9, .35, 100); tone(seGain, 200, t, .9, 'sawtooth', .2, .1); break;
      case 'force': tone(seGain, 300, t, .12, 'square', .06, 2); break;
      case 'charge': tone(seGain, 200, t, .1, 'sine', .03, 1.5); break;
      case 'wave': noise(seGain, t, .5, .25, 300); tone(seGain, 90, t, .5, 'sawtooth', .18, 3); break;
      case 'warn': [0, .5, 1, 1.5].forEach(d => tone(seGain, 440, t + d, .35, 'sawtooth', .07)); break;
      case 'clear': [523, 659, 784, 1046, 1318].forEach((f, i) => tone(seGain, f, t + i * .12, .3, 'square', .06)); break;
    }
  };
  // ---- BGM ----
  // 面(地形)ごとに手で書いた曲。譜面は文字: 1-7=低い音階の度数 / a-g=1オクターブ上 / .=休み / -=のばす。1文字=8分音符、8文字=1小節。
  // 面ごとにキー・テンポ・音色を変え、ボス戦は別の譜面(16分のベース+速いドラム)になる。耳でしか確かめられない(未確認)。
  function rngOf(seed) { let s = seed >>> 0; return () => { s = (s + 0x6D2B79F5) >>> 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
  const SCALES = { aeo: [0, 2, 3, 5, 7, 8, 10], phr: [0, 1, 3, 5, 7, 8, 10], dor: [0, 2, 3, 5, 7, 9, 10], har: [0, 2, 3, 5, 7, 8, 11], lyd: [0, 2, 4, 6, 7, 9, 11] };
  const KIND = {   // prog=小節ごとの根音(音階の度数0始まり) lead=面の主旋律 boss=ボス戦の主旋律
    M: { sc: 'aeo', prog: [0, 0, 5, 6, 0, 0, 3, 4], bpm: 134, lead: '5.3.1.3.5.6.5.3.a.8.6.8.7.5.6.7.a-8-6-5-3.5.6-5-3-1.3.5.-.-.....5.6.8.a-c-a.8.7.6.5.3-5-6.7.8-.-.....', boss: '1.1.3.1.5.1.3.1.6.6.8.6.a.6.8.6.7.7.5.7.8.7.5.7.a.a.c.a.8.7.5.3.', lead2: 'sawtooth', kick: [0, 6, 8, 14] },
  O: { sc: 'phr', prog: [0, 0, 1, 0, 5, 5, 1, 0], bpm: 118, lead: '1---3-2-1---5-4-3---5-6-8---7-6-5---3-4-3-2-1-.-.-.-3.4.5.-.8-7-5-4.3.2.1.-.-.-.-', boss: '1.2.1.3.1.2.1.5.4.3.4.5.4.3.4.6.5.4.5.6.5.4.5.8.7.6.5.4.3.2.1.2.', lead2: 'triangle', kick: [0, 3, 8, 11] },
  A: { sc: 'dor', prog: [0, 0, 3, 3, 4, 4, 6, 6], bpm: 126, lead: '3.5.6.8.6.5.3.-.2.3.5.6.5.3.2.-.1.3.5.6.8.a.8.6.5.-.3.-.5.-.-.-.6.8.a.c.a.8.6.8.7.6.5.3.2.3.5.-.', boss: '1.5.1.5.3.5.3.5.4.8.4.8.6.8.6.8.5.a.5.a.8.a.8.a.7.6.5.4.3.2.1.2.', lead2: 'square', kick: [0, 4, 8, 12] },
  R: { sc: 'har', prog: [0, 0, 3, 4, 5, 4, 3, 0], bpm: 122, lead: '1-3-5-7-8---7-5-6---5-3-4---5-6-7---6-5-3-1---.-.-.-8-a-c---b-a-8---7-5-3-5---.-.-.-', boss: '1.3.5.7.8.7.5.3.1.2.4.6.8.6.4.2.7.5.7.a.b.a.7.5.5.6.7.8.a.b.c.a.', lead2: 'sawtooth', kick: [0, 2, 8, 10] },
  C: { sc: 'lyd', prog: [0, 0, 4, 4, 5, 5, 3, 4], bpm: 138, lead: '1.5.8.5.c.8.5.8.2.6.9.6.d.9.6.9.3.7.a.7.e.a.7.a.1.5.8.c.a.8.5.3.', boss: '1.8.5.8.1.8.5.8.4.b.8.b.4.b.8.b.5.c.9.c.5.c.9.c.a.9.8.7.5.4.3.2.', lead2: 'triangle', kick: [0, 4, 8, 12] },
};
  const STERR = 'MOAMOMRMMOORAOCMRCMC';   // 面ごとの地形(game.js の STAGE_DEF と同じ並び)
  function parse(str, sc, oct) {   // 文字譜 → [{i:開始ステップ(16分),n:半音,len:長さ(16分)}]
    const out = []; let step = 0;
    for (const ch of str) {
      if (ch === '-') { if (out.length) out[out.length - 1].len += 2; }
      else if (ch !== '.') { const k = '1234567abcdefg'.indexOf(ch), deg = k % 7, up = k >= 7 ? 1 : 0; out.push({ i: step, n: sc[deg] + 12 * (up + (k >= 14 ? 1 : 0)) + (oct || 0), len: 2 }); }
      step += 2;
    }
    return { notes: out, steps: Math.ceil(step / 16) * 16 };
  }
  function compose(seed, boss) {
    const n = (seed % 100) || 1, K = KIND[STERR[n - 1] || 'M'], sc = SCALES[K.sc], r = rngOf(n * 7919 + (boss ? 13 : 1));
    const root = 33 + ((n * 5) % 7), bpm = K.bpm + (n - 1) * 1.2 + (boss ? 26 : 0);
    const ld = parse(boss ? K.boss : K.lead, sc, 12), bar = [];
    // 小節ごとの根音(半音)。度数 → 半音
    const prog = (boss ? K.prog.map((d, i) => (i % 2 ? (d + 5) % 7 : d)) : K.prog).map(d => sc[d % 7]);
    return { root, prog, bpm, boss, ld, K, sc, wave: boss ? 'sawtooth' : K.lead2, vib: r() * .5 + .5, nb: prog.length };
  }
  const mf = n => 440 * Math.pow(2, (n - 69) / 12);
  function sched() {
    const c = Snd.ctx; if (!c || !song) return;
    while (nextT < c.currentTime + .25) {
      const L = song.ld.steps, total = Math.max(L, song.nb * 16), s = step % total, bar = (s >> 4) % song.nb, i16 = s & 15, base = song.root + song.prog[bar], sd = 60 / song.bpm / 4;
      if (Snd.on) {
        // ベース: 通常=8分の刻み、ボス=16分のうねり
        if (song.boss) tone(bgmGain, mf(base - 12 + (i16 % 4 === 3 ? 12 : 0)), nextT, sd * 1.6, 'sawtooth', .11);
        else if (i16 % 2 === 0) tone(bgmGain, mf(base - 12 + (i16 % 8 === 6 ? 7 : 0)), nextT, sd * 1.8, 'sawtooth', .12);
        // パッド(和音): 小節の頭で長く
        if (i16 === 0) [0, 3 + (song.sc[2] === 4 ? 1 : 0), 7].forEach(o => tone(bgmGain, mf(base + o), nextT, sd * 15, 'triangle', .05));
        // 主旋律(譜面のループ)
        for (const nt of song.ld.notes) if (nt.i === s % L) { tone(bgmGain, mf(song.root + nt.n + song.prog[bar] * 0), nextT, sd * nt.len * .95, song.wave, song.boss ? .075 : .06); tone(bgmGain, mf(song.root + nt.n + 12), nextT + sd * 1.5, sd * nt.len * .6, 'square', .018); }
        // ドラム
        const kk = song.K.kick; if (song.boss ? i16 % 4 === 0 || i16 === 14 : kk.indexOf(i16) >= 0) tone(bgmGain, 130, nextT, .13, 'sine', .32, .3);
        if (i16 === 4 || i16 === 12) noise(bgmGain, nextT, .12, .17, 1500);
        if (song.boss ? true : i16 % 2 === 1) noise(bgmGain, nextT, .03, song.boss ? .045 : .04, 6500);
        if (bar % 4 === 3 && i16 >= 12) noise(bgmGain, nextT, .05, .1, 2500);   // 4小節ごとのフィル
      }
      nextT += sd; step++;
    }
  }
  Snd.bgm = function (seed, boss) {
    song = compose(seed, boss); step = 0; if (!Snd.ctx) return; nextT = Snd.ctx.currentTime + .05;
    if (!timer) timer = setInterval(sched, 60);
  };
  Snd.stop = function () { song = null; };
})();
