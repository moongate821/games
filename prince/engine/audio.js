/*
 * StoryBook Engine ― audio.js(BGM と効果音。音声ファイルなし、WebAudio で合成)
 *
 * game.audio = {
 *   themes: { 名前: { root, scale, bpm, meter, inst, bass, pad, density, chords, seed, color } },
 *   zoneTheme: { 場所ID: 'テーマ名' }, kindTheme: { 結末の種類: 'テーマ名' }, cover: 'テーマ名',
 *   enterSfx: { 場面ID: 'sfx名' }
 * }
 * 曲は「毎回同じ曲になる」決定的な自動作曲(seed)。場所が変わると、前の曲をフェードアウトして次の曲に交代する。
 * 画面の仮想時計(録画用)でも動くように、setTimeout の先読みと ctx.currentTime だけで予約する。
 */
(function (root) {
  "use strict";

  const SCALES = {
    major: [0, 2, 4, 5, 7, 9, 11], minor: [0, 2, 3, 5, 7, 8, 10], dorian: [0, 2, 3, 5, 7, 9, 10],
    lydian: [0, 2, 4, 6, 7, 9, 11], penta: [0, 2, 4, 7, 9], minpenta: [0, 3, 5, 7, 10],
    whole: [0, 2, 4, 6, 8, 10], phrygian: [0, 1, 3, 5, 7, 8, 10], mixo: [0, 2, 4, 5, 7, 9, 10]
  };
  const mtof = (m) => 440 * Math.pow(2, (m - 69) / 12);
  function rng(seed) { let s = seed >>> 0 || 1; return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; }

  function create(game, hooks) {
    const cfg = game.audio || { themes: {} };
    const A = { ctx: null, on: true, music: 0.7, sfxVol: 0.8, started: false, cur: null };
    let master, musicBus, sfxBus, reverb, wet, noiseBuf;
    let timer = 0, theme = null, themeName = "", bar = 0, nextT = 0, rand = null, runId = 0;

    function init() {
      if (A.ctx) return true;
      const AC = root.AudioContext || root.webkitAudioContext;
      if (!AC) return false;
      A.ctx = new AC();
      const c = A.ctx;
      master = c.createGain(); master.gain.value = 0.9; master.connect(c.destination);
      musicBus = c.createGain(); musicBus.gain.value = 0.34 * A.music; musicBus.connect(master);
      sfxBus = c.createGain(); sfxBus.gain.value = 0.8 * A.sfxVol; sfxBus.connect(master);
      // 簡単なリバーブ(減衰するノイズのインパルス)
      const len = Math.floor(c.sampleRate * 2.2), imp = c.createBuffer(2, len, c.sampleRate);
      for (let ch = 0; ch < 2; ch++) { const d = imp.getChannelData(ch); for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2.6); }
      reverb = c.createConvolver(); reverb.buffer = imp;
      wet = c.createGain(); wet.gain.value = 0.28; reverb.connect(wet); wet.connect(master);
      const nl = c.sampleRate * 1; noiseBuf = c.createBuffer(1, nl, c.sampleRate);
      const nd = noiseBuf.getChannelData(0); for (let i = 0; i < nl; i++) nd[i] = Math.random() * 2 - 1;
      return true;
    }

    // ── 楽器 ─────────────────────────────
    function env(g, t, a, peak, d, end) {
      g.gain.setValueAtTime(0.0001, t);
      g.gain.linearRampToValueAtTime(peak, t + a);
      g.gain.exponentialRampToValueAtTime(0.0001, t + a + d);
    }
    function osc(type, f, t, dur, out) {
      const o = A.ctx.createOscillator(); o.type = type; o.frequency.setValueAtTime(f, t);
      o.connect(out); o.start(t); o.stop(t + dur + 0.05); return o;
    }
    function voice(inst, f, t, dur, vel, bus, sendRev) {
      const c = A.ctx, g = c.createGain(); let tail = g;
      const send = (x) => { x.connect(bus); if (sendRev) { const s = c.createGain(); s.gain.value = sendRev; x.connect(s); s.connect(reverb); } };
      if (inst === "musicbox") {
        env(g, t, 0.003, 0.5 * vel, 1.3);
        osc("sine", f, t, 1.4, g); const g2 = c.createGain(); g2.gain.value = 0.35; osc("sine", f * 2, t, 1.0, g2); g2.connect(g);
        const g3 = c.createGain(); g3.gain.value = 0.12; osc("sine", f * 5.04, t, 0.4, g3); g3.connect(g);
      } else if (inst === "piano") {
        const lp = c.createBiquadFilter(); lp.type = "lowpass"; lp.frequency.value = 2600; g.connect(lp); tail = lp;
        env(g, t, 0.005, 0.5 * vel, 1.6);
        osc("triangle", f, t, 1.7, g); const g2 = c.createGain(); g2.gain.value = 0.3; osc("sine", f * 2, t, 1.2, g2); g2.connect(g);
      } else if (inst === "harp") {
        env(g, t, 0.004, 0.45 * vel, 1.9);
        osc("triangle", f, t, 2.0, g); const g2 = c.createGain(); g2.gain.value = 0.2; osc("sine", f * 3, t, 0.8, g2); g2.connect(g);
      } else if (inst === "bell") {
        env(g, t, 0.002, 0.38 * vel, 3.2);
        [[1, 1], [2.76, 0.4], [5.4, 0.2], [8.9, 0.08]].forEach(([m, a]) => { const x = c.createGain(); x.gain.value = a; osc("sine", f * m, t, 3.3, x); x.connect(g); });
      } else if (inst === "flute") {
        const o = osc("sine", f, t, dur + 0.3, g);
        const lfo = c.createOscillator(), lg = c.createGain(); lfo.frequency.value = 5; lg.gain.value = f * 0.006; lfo.connect(lg); lg.connect(o.frequency); lfo.start(t); lfo.stop(t + dur + 0.4);
        const o2 = osc("triangle", f * 2, t, dur + 0.3, g); void o2;
        g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(0.28 * vel, t + 0.06); g.gain.setValueAtTime(0.28 * vel, t + dur * 0.7); g.gain.exponentialRampToValueAtTime(0.0001, t + dur + 0.25);
      } else if (inst === "pad") {
        const lp = c.createBiquadFilter(); lp.type = "lowpass"; lp.frequency.value = 700; lp.Q.value = 0.7; g.connect(lp); tail = lp;
        osc("sawtooth", f, t, dur + 1.5, g).detune.value = -7; osc("sawtooth", f, t, dur + 1.5, g).detune.value = 7;
        g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(0.1 * vel, t + 0.9); g.gain.setValueAtTime(0.1 * vel, t + dur); g.gain.linearRampToValueAtTime(0.0001, t + dur + 1.3);
      } else if (inst === "brass") {
        const lp = c.createBiquadFilter(); lp.type = "lowpass"; lp.frequency.setValueAtTime(500, t); lp.frequency.linearRampToValueAtTime(1800, t + 0.12); g.connect(lp); tail = lp;
        osc("sawtooth", f, t, dur + 0.2, g);
        g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(0.2 * vel, t + 0.06); g.gain.setValueAtTime(0.2 * vel, t + dur * 0.8); g.gain.exponentialRampToValueAtTime(0.0001, t + dur + 0.15);
      } else if (inst === "bass") {
        env(g, t, 0.01, 0.55 * vel, Math.max(0.3, dur)); osc("sine", f, t, dur + 0.4, g); const g2 = c.createGain(); g2.gain.value = 0.25; osc("triangle", f * 2, t, dur, g2); g2.connect(g);
      } else if (inst === "tick") {
        const n = c.createBufferSource(); n.buffer = noiseBuf; const hp = c.createBiquadFilter(); hp.type = "highpass"; hp.frequency.value = 3500; n.connect(hp); hp.connect(g);
        env(g, t, 0.001, 0.25 * vel, 0.04); n.start(t, Math.random() * 0.5, 0.06);
      } else if (inst === "snare") {
        const n = c.createBufferSource(); n.buffer = noiseBuf; const bp = c.createBiquadFilter(); bp.type = "bandpass"; bp.frequency.value = 1800; n.connect(bp); bp.connect(g);
        env(g, t, 0.001, 0.3 * vel, 0.12); n.start(t, Math.random() * 0.5, 0.15);
      }
      send(tail);
    }

    // ── 自動作曲の演奏 ─────────────────────────────
    function chordTones(th, deg) {
      const sc = SCALES[th.scale] || SCALES.major, n = sc.length;
      const at = (i) => { const o = Math.floor(i / n), k = ((i % n) + n) % n; return th.root + sc[k] + 12 * o; };
      return [at(deg), at(deg + 2), at(deg + 4), at(deg + 6)];
    }
    function scheduleBar(th, run) {
      if (run !== runId) return;
      const c = A.ctx, beat = 60 / th.bpm, meter = th.meter || 4;
      const chords = th.chords || [0, 3, 4, 0];
      const deg = chords[bar % chords.length];
      const tones = chordTones(th, deg);
      const sc = SCALES[th.scale] || SCALES.major;
      const dens = th.density == null ? 0.7 : th.density;
      const sub = th.sub || 2; // 1拍をいくつに分けるか
      const t0 = Math.max(nextT, c.currentTime + 0.05);
      const bq = bar % 8;
      const phrase = rng((th.seed || 1) * 131 + Math.floor(bar / 4) % 4);
      // 低音
      if (th.bass) {
        voice("bass", mtof(tones[0] - 12), t0, beat * 0.9, 0.9, musicBus);
        if (meter === 3) { voice("bass", mtof(tones[2] - 12), t0 + beat, beat * 0.4, 0.5, musicBus); voice("bass", mtof(tones[2] - 12), t0 + 2 * beat, beat * 0.4, 0.5, musicBus); }
        else if (meter === 4) voice("bass", mtof(tones[2] - 12), t0 + 2 * beat, beat * 0.8, 0.6, musicBus);
      }
      // 和音の持続音
      if (th.pad) tones.slice(0, 3).forEach((m) => voice("pad", mtof(m - 12), t0, beat * meter, 0.8, musicBus, 0.4));
      // アルペジオと旋律
      const steps = meter * sub;
      for (let i = 0; i < steps; i++) {
        const tt = t0 + i * beat / sub;
        const strong = i % sub === 0;
        if (th.arp !== false && (strong || phrase() < dens * 0.5)) {
          const m = tones[(i + (th.arpShift || 0)) % 3] + (i % 4 === 3 ? 12 : 0);
          voice(th.inst, mtof(m + 12), tt, beat / sub * 1.6, strong ? 0.8 : 0.5, musicBus, 0.3);
        }
        if (th.lead && (strong ? phrase() < dens : phrase() < dens * 0.35)) {
          const idx = Math.floor(phrase() * sc.length * 2);
          const m = th.root + 12 + sc[idx % sc.length] + 12 * Math.floor(idx / sc.length);
          voice(th.lead, mtof(m + (th.leadOct || 12)), tt, beat / sub * 1.8, 0.7, musicBus, 0.35);
        }
        if (th.tick && strong && (i / sub) % 1 === 0) voice("tick", 0, tt, 0.05, 0.6, musicBus, 0);
        if (th.snare && i % (sub * 2) === sub && meter === 4) voice("snare", 0, tt, 0.1, 0.6, musicBus, 0.1);
      }
      void bq;
      nextT = t0 + beat * meter;
      bar++;
    }
    function loop(run) {
      if (run !== runId || !theme || !A.ctx) return;
      const c = A.ctx;
      // 約1.2秒先まで予約する
      let guard = 0;
      while (nextT < c.currentTime + 1.2 && guard++ < 4) scheduleBar(theme, run);
      timer = setTimeout(() => loop(run), 250);
    }

    function stopMusic(fade) {
      runId++; clearTimeout(timer);
      if (!A.ctx || !musicBus) return;
      // 古い曲は、いったん音量を下げて切り替える(新しい母線をつくる)
      const old = musicBus, t = A.ctx.currentTime;
      old.gain.cancelScheduledValues(t); old.gain.setValueAtTime(old.gain.value, t); old.gain.linearRampToValueAtTime(0.0001, t + (fade == null ? 0.8 : fade));
      musicBus = A.ctx.createGain(); musicBus.gain.value = 0; musicBus.connect(master);
      setTimeout(() => { try { old.disconnect(); } catch (e) { /* 無視 */ } }, 2500);
    }
    function playTheme(name) {
      if (!A.on || !init() || A.music <= 0) { A.cur = name; return; }
      const th = cfg.themes[name];
      if (!th) return;
      if (themeName === name && theme) return;
      if (A.ctx.state === "suspended") A.ctx.resume();
      stopMusic(0.9);
      themeName = name; theme = th; bar = 0; rand = rng(th.seed || 1); void rand;
      nextT = A.ctx.currentTime + 0.25;
      const t = A.ctx.currentTime;
      musicBus.gain.setValueAtTime(0.0001, t); musicBus.gain.linearRampToValueAtTime(0.34 * A.music, t + 1.2);
      const run = runId; loop(run);
    }

    // ── 効果音 ─────────────────────────────
    function noise(t, dur, type, f0, f1, vol, q) {
      const c = A.ctx, n = c.createBufferSource(); n.buffer = noiseBuf; const f = c.createBiquadFilter(); f.type = type; f.Q.value = q || 1;
      f.frequency.setValueAtTime(f0, t); f.frequency.exponentialRampToValueAtTime(f1, t + dur);
      const g = c.createGain(); env(g, t, dur * 0.25, vol, dur * 0.75); n.connect(f); f.connect(g); g.connect(sfxBus); n.start(t, 0, dur + 0.1);
    }
    function sweep(t, f0, f1, dur, vol, type) {
      const c = A.ctx, g = c.createGain(), o = c.createOscillator(); o.type = type || "sine";
      o.frequency.setValueAtTime(f0, t); o.frequency.exponentialRampToValueAtTime(f1, t + dur);
      env(g, t, 0.02, vol, dur); o.connect(g); g.connect(sfxBus); o.start(t); o.stop(t + dur + 0.1);
    }
    function notes(list, inst, gap, vel, t0, bus) {
      const t = t0 || A.ctx.currentTime + 0.02;
      list.forEach((m, i) => voice(inst, mtof(m), t + i * gap, gap * 2, vel || 0.8, bus || sfxBus, 0.35));
    }
    const SFX = {
      page() { const t = A.ctx.currentTime; noise(t, 0.38, "bandpass", 700, 3200, 0.5, 0.8); noise(t + 0.05, 0.25, "highpass", 2500, 6000, 0.12); },
      pick() { const t = A.ctx.currentTime; sweep(t, 520, 760, 0.12, 0.35, "triangle"); voice("tick", 0, t, 0.04, 0.8, sfxBus, 0); },
      item() { notes([84, 88, 91, 96], "musicbox", 0.07, 0.9); },
      locked() { const t = A.ctx.currentTime; sweep(t, 190, 120, 0.22, 0.4, "triangle"); sweep(t + 0.1, 170, 105, 0.22, 0.3, "triangle"); },
      shrink() { const t = A.ctx.currentTime; sweep(t, 1100, 160, 0.8, 0.35, "sine"); notes([96, 91, 88, 84, 79], "musicbox", 0.09, 0.6, t); },
      grow() { const t = A.ctx.currentTime; sweep(t, 150, 1000, 0.9, 0.35, "sine"); notes([72, 76, 79, 84, 88], "piano", 0.1, 0.6, t); },
      splash() { const t = A.ctx.currentTime; noise(t, 0.5, "lowpass", 1800, 300, 0.5, 0.7); for (let i = 0; i < 4; i++) sweep(t + 0.1 + i * 0.12, 500 + i * 200, 900 + i * 300, 0.1, 0.2, "sine"); },
      clink() { const t = A.ctx.currentTime; voice("bell", 2200, t, 0.5, 0.6, sfxBus, 0.5); voice("bell", 2900, t + 0.08, 0.5, 0.4, sfxBus, 0.5); },
      tick() { const t = A.ctx.currentTime; for (let i = 0; i < 6; i++) voice("tick", 0, t + i * 0.5, 0.05, 1.1, sfxBus, 0); },
      pop() { const t = A.ctx.currentTime; sweep(t, 300, 900, 0.09, 0.4, "sine"); },
      hop() { const t = A.ctx.currentTime; sweep(t, 330, 660, 0.1, 0.3, "triangle"); sweep(t + 0.12, 440, 880, 0.1, 0.3, "triangle"); },
      meow() { const t = A.ctx.currentTime; sweep(t, 520, 900, 0.18, 0.25, "sawtooth"); sweep(t + 0.18, 900, 480, 0.3, 0.22, "sawtooth"); },
      snore() { const t = A.ctx.currentTime; sweep(t, 110, 80, 0.7, 0.3, "sawtooth"); },
      sneeze() { const t = A.ctx.currentTime; noise(t, 0.1, "highpass", 4000, 6000, 0.3); noise(t + 0.18, 0.35, "bandpass", 900, 2600, 0.6, 0.6); },
      // 結末
      glow() { const t = A.ctx.currentTime; notes([88, 91, 95, 100], "musicbox", 0.07, 0.6, t); voice("bell", mtof(103), t + 0.25, 1.2, 0.35, sfxBus, 0.6); },
      wilt() { const t = A.ctx.currentTime; sweep(t, 520, 90, 1.0, 0.3, "sine"); notes([64, 60, 57], "piano", 0.22, 0.5, t + 0.1); },
      end_happy() { const t = A.ctx.currentTime; notes([72, 76, 79, 84], "musicbox", 0.12, 0.9, t); notes([79, 84, 88, 91, 96], "bell", 0.14, 0.7, t + 0.5); },
      end_true() { const t = A.ctx.currentTime; notes([60, 64, 67, 72, 76, 79, 84], "piano", 0.16, 0.9, t); notes([84, 88, 91, 96, 100], "bell", 0.2, 0.9, t + 1.0); [72, 76, 79].forEach((m) => voice("pad", mtof(m), t + 1.2, 3, 1, sfxBus, 0.5)); },
      end_normal() { const t = A.ctx.currentTime; notes([67, 64, 60], "musicbox", 0.3, 0.7, t); },
      end_bad() { const t = A.ctx.currentTime; notes([69, 65, 62, 57], "piano", 0.28, 0.8, t); sweep(t + 0.2, 120, 55, 1.4, 0.4, "sine"); },
      end_loop() { const t = A.ctx.currentTime; for (let r = 0; r < 2; r++) notes([72, 74, 76, 78, 80, 82], "musicbox", 0.09, 0.7, t + r * 0.7); },
      end_stuck() { const t = A.ctx.currentTime; [48, 49].forEach((m) => voice("pad", mtof(m), t, 2.5, 1, sfxBus, 0.5)); voice("bell", mtof(60), t + 0.8, 2, 0.5, sfxBus, 0.6); }
    };

    // ── 公開 ─────────────────────────────
    A.unlock = function () { if (!init()) return; if (A.ctx.state === "suspended") A.ctx.resume(); A.started = true; if (A.cur) { const n = A.cur; themeName = ""; playTheme(n); } };
    A.sfx = function (name) { if (!A.on || A.sfxVol <= 0 || !A.started || !init() || !SFX[name]) return; try { SFX[name](); } catch (e) { /* 音が出なくても遊べる */ } };
    A.theme = function (name) { A.cur = name; if (A.started) playTheme(name); };
    A.themeForScene = function (sc) {
      if (sc.ending) return cfg.kindTheme && cfg.kindTheme[sc.ending.kind];
      return cfg.zoneTheme && cfg.zoneTheme[sc.zone];
    };
    A.scene = function (sc, isNew) {
      const n = A.themeForScene(sc); if (n) A.theme(n);
      if (sc.ending) A.sfx("end_" + sc.ending.kind);
      else if (cfg.enterSfx && cfg.enterSfx[sc.id]) A.sfx(cfg.enterSfx[sc.id]);
      void isNew;
    };
    A.cover = function () { if (cfg.cover) A.theme(cfg.cover); };
    A.setOn = function (v) { A.on = !!v; if (!A.on) { stopMusic(0.4); themeName = ""; theme = null; } else if (A.cur) { themeName = ""; if (A.started) playTheme(A.cur); } };
    A.setMusic = function (v) { A.music = v; if (musicBus && A.ctx) musicBus.gain.value = 0.34 * v; if (v <= 0) { stopMusic(0.3); themeName = ""; theme = null; } else if (A.cur && !theme && A.started) playTheme(A.cur); };
    A.setSfx = function (v) { A.sfxVol = v; if (sfxBus) sfxBus.gain.value = 0.8 * v; };
    A.names = Object.keys(SFX);
    A.scales = SCALES;
    return A;
  }

  root.BookAudio = { create };
})(typeof self !== "undefined" ? self : this);
