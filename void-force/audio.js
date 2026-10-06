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
  function rngOf(seed) { let s = seed >>> 0; return () => { s = (s + 0x6D2B79F5) >>> 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
  function compose(seed, boss) {
    const r = rngOf(seed * 7919 + (boss ? 13 : 1)), scale = [0, 2, 3, 5, 7, 8, 10], root = 36 + Math.floor(r() * 6);   // 短調
    const prog = []; for (let i = 0; i < 4; i++) prog.push(scale[Math.floor(r() * 7)]);
    const arp = []; for (let i = 0; i < 16; i++) arp.push(scale[Math.floor(r() * 7)] + (r() < .3 ? 12 : 0));
    return { root, prog, arp, bpm: boss ? 156 : 132 + Math.floor(r() * 16), boss };
  }
  const mf = n => 440 * Math.pow(2, (n - 69) / 12);
  function sched() {
    const c = Snd.ctx; if (!c || !song) return;
    while (nextT < c.currentTime + .25) {
      const s = step % 64, bar = (s >> 4) % 4, i16 = s & 15, base = song.root + song.prog[bar];
      if (Snd.on) {
        if (i16 % 2 === 0) tone(bgmGain, mf(base - 12 + (i16 % 8 === 6 ? 7 : 0)), nextT, .13, 'sawtooth', .13);
        tone(bgmGain, mf(base + 12 + song.arp[(i16 + bar * 3) % 16] - (song.prog[bar])), nextT, .09, 'square', song.boss ? .05 : .035);
        if (i16 % 4 === 0) { tone(bgmGain, 120, nextT, .12, 'sine', .3, .3); }
        if (i16 % 8 === 4) noise(bgmGain, nextT, .1, .16, 1500);
        if (song.boss || i16 % 2 === 1) noise(bgmGain, nextT, .03, .05, 6000);
      }
      nextT += 60 / song.bpm / 4; step++;
    }
  }
  Snd.bgm = function (seed, boss) {
    song = compose(seed, boss); step = 0; if (!Snd.ctx) return; nextT = Snd.ctx.currentTime + .05;
    if (!timer) timer = setInterval(sched, 60);
  };
  Snd.stop = function () { song = null; };
})();
