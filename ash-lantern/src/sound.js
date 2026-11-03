'use strict';
/* 音: ファイル音源と、画像・音源未完成時の WebAudio による代替音。最初の操作で有効になる。 */
const Snd = (() => {
  let ac = null, master = null, bgmGain = null, on = true, track = null, step = 0, timer = null, nextT = 0, music = null;
  try { if (localStorage.getItem('ash_lantern_sound') === 'off') on = false; } catch (e) { }
  const F = n => 440 * Math.pow(2, (n - 69) / 12);
  function init() {
    if (ac) { if (ac.state === 'suspended') ac.resume(); return; }
    try {
      ac = new (window.AudioContext || window.webkitAudioContext)();
      master = ac.createGain(); master.gain.value = on ? 0.5 : 0; master.connect(ac.destination);
      bgmGain = ac.createGain(); bgmGain.gain.value = 0.22; bgmGain.connect(master);
      if (track) startMusic();
    } catch (e) { ac = null; }
  }
  addEventListener('keydown', init, { once: false }); addEventListener('pointerdown', init, { once: false });
  function tone(t, f, d, type, vol, dest, slide) {
    const o = ac.createOscillator(), g = ac.createGain();
    o.type = type; o.frequency.setValueAtTime(f, t); if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(20, slide), t + d);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t + d);
    o.connect(g); g.connect(dest || master); o.start(t); o.stop(t + d + 0.05);
  }
  function noise(t, d, vol, hp) {
    const n = Math.floor(ac.sampleRate * d), b = ac.createBuffer(1, n, ac.sampleRate), a = b.getChannelData(0);
    for (let i = 0; i < n; i++) a[i] = (Math.random() * 2 - 1) * (1 - i / n);
    const s = ac.createBufferSource(); s.buffer = b; const f = ac.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = hp || 800;
    const g = ac.createGain(); g.gain.value = vol; s.connect(f); f.connect(g); g.connect(master); s.start(t);
  }
  const SFX = {
    ok: t => tone(t, 880, 0.06, 'square', 0.05),
    move: t => tone(t, 660, 0.04, 'square', 0.03),
    cancel: t => tone(t, 440, 0.07, 'square', 0.05),
    door: t => { noise(t, 0.18, 0.3, 300); tone(t, 180, 0.2, 'triangle', 0.2, null, 90); },
    hit: t => { noise(t, 0.16, 0.6, 1400); tone(t, 220, 0.15, 'sawtooth', 0.15, null, 70); },
    hurt: t => { noise(t, 0.22, 0.7, 500); tone(t, 140, 0.25, 'sawtooth', 0.2, null, 50); },
    heal: t => [72, 76, 79, 84].forEach((n, i) => tone(t + i * 0.08, F(n), 0.25, 'sine', 0.12)),
    bell: t => { tone(t, F(88), 1.4, 'sine', 0.14); tone(t, F(95), 1.0, 'sine', 0.06); },
    rumble: t => { noise(t, 1.2, 0.8, 120); tone(t, 55, 1.2, 'sawtooth', 0.2, null, 35); },
    win: t => [67, 71, 74, 79].forEach((n, i) => tone(t + i * 0.13, F(n), 0.35, 'triangle', 0.14)),
    lose: t => [67, 64, 60, 55].forEach((n, i) => tone(t + i * 0.2, F(n), 0.4, 'triangle', 0.14)),
    item: t => { tone(t, F(84), 0.1, 'square', 0.05); tone(t + 0.08, F(91), 0.18, 'square', 0.05); },
    voice: t => { tone(t, F(81), 1.6, 'sine', 0.08, null, F(80)); tone(t + 0.02, F(88), 1.4, 'sine', 0.04); }
  };
  // 曲: 8分音符ごとの MIDI ノート(0=休み)。bpm と波形つき
  const TRACKS = {
    title: { bpm: 70, wave: 'triangle', bass: [45, 0, 0, 0, 52, 0, 0, 0, 43, 0, 0, 0, 50, 0, 0, 0], mel: [69, 0, 72, 0, 76, 0, 72, 0, 74, 0, 71, 0, 67, 0, 71, 0, 69, 0, 72, 0, 76, 0, 79, 0, 77, 0, 74, 0, 72, 0, 0, 0] },
    village: { bpm: 96, wave: 'triangle', bass: [48, 0, 55, 0, 52, 0, 55, 0, 53, 0, 60, 0, 55, 0, 52, 0], mel: [72, 0, 76, 79, 0, 76, 74, 0, 72, 0, 67, 69, 0, 72, 71, 0, 69, 0, 72, 76, 0, 74, 72, 0, 71, 0, 67, 0, 69, 0, 0, 0] },
    home: { bpm: 72, wave: 'sine', bass: [48, 0, 0, 0, 55, 0, 0, 0, 53, 0, 0, 0, 52, 0, 0, 0], mel: [67, 0, 0, 72, 0, 0, 71, 0, 0, 67, 0, 0, 69, 0, 0, 72, 0, 0, 74, 0, 0, 71, 0, 0, 67, 0, 0, 0, 0, 0, 0, 0] },
    dusk: { bpm: 66, wave: 'triangle', bass: [45, 0, 0, 0, 41, 0, 0, 0, 43, 0, 0, 0, 40, 0, 0, 0], mel: [69, 0, 0, 72, 0, 0, 76, 0, 0, 74, 0, 72, 0, 0, 71, 0, 0, 69, 0, 0, 67, 0, 0, 64, 0, 0, 0, 0, 0, 0, 0, 0] },
    battle: { bpm: 150, wave: 'sawtooth', bass: [45, 45, 0, 45, 45, 0, 45, 0, 43, 43, 0, 43, 43, 0, 43, 0], mel: [69, 0, 72, 0, 76, 0, 72, 0, 77, 0, 76, 0, 72, 0, 69, 0, 67, 0, 71, 0, 74, 0, 71, 0, 76, 0, 74, 0, 71, 0, 67, 0] }
  };
  // 音楽フォルダの曲。未指定の曲・読み込み失敗時は従来の仮BGMを使う。
  // Fallback melodies for scene-specific tracks if audio cannot be loaded.
  TRACKS.farewell = TRACKS.dusk; TRACKS.crisis = TRACKS.battle; TRACKS.ending = TRACKS.home;
  const AUDIO_TRACKS = {
    title: 'audio/title_promise.mp3',
    village: 'audio/bgm_yoruzora_instrumental.mp3',
    home: 'audio/bgm_yoruzora_instrumental.mp3',
    battle: 'audio/bgm_voyage_intro.mp3',
    farewell: 'audio/bgm_farewell_requiem_outro.mp3',
    crisis: 'audio/bgm_crisis_brave_intro.mp3',
    ending: 'audio/bgm_ending_yoruzora.mp3'
  };
  function stopMusic() {
    if (timer) { clearInterval(timer); timer = null; }
    if (music) { music.onerror = null; music.pause(); music = null; }
  }
  function startMusic() {
    if (!ac || !track) return;
    const path = AUDIO_TRACKS[track];
    if (!path) { startTimer(); return; }
    const player = new Audio((window.IMG_BASE || '') + path);
    music = player; player.loop = track !== 'ending'; player.volume = 0.30; player.muted = !on;
    const fallback = () => {
      if (music !== player) return;
      player.onerror = null; player.pause(); music = null; startTimer();
    };
    player.onerror = fallback;
    const started = player.play();
    if (started && typeof started.catch === 'function') started.catch(fallback);
  }
  function startTimer() {
    if (timer) return; nextT = ac.currentTime + 0.1; step = 0;
    timer = setInterval(() => {
      if (!ac || !track) return;
      const tr = TRACKS[track], dt = 60 / tr.bpm / 2;
      while (nextT < ac.currentTime + 0.4) {
        const m = tr.mel[step % tr.mel.length], b = tr.bass[step % tr.bass.length];
        if (m) tone(nextT, F(m), dt * 1.6, tr.wave, tr.wave === 'sawtooth' ? 0.1 : 0.2, bgmGain);
        if (b) tone(nextT, F(b - 12), dt * 2.2, 'sine', 0.3, bgmGain);
        nextT += dt; step++;
      }
    }, 100);
  }
  return {
    sfx(n) { if (!ac || !on || !SFX[n]) return; try { SFX[n](ac.currentTime + 0.005); } catch (e) { } },
    bgm(n) { if (n && !TRACKS[n]) n = 'village'; if (track === n) return; if (music && n && AUDIO_TRACKS[n] && AUDIO_TRACKS[n] === AUDIO_TRACKS[track]) { track = n; return; } stopMusic(); track = n; step = 0; if (ac && n) startMusic(); },
    get on() { return on; },
    toggle() { on = !on; try { localStorage.setItem('ash_lantern_sound', on ? 'on' : 'off'); } catch (e) { } if (master) master.gain.value = on ? 0.5 : 0; if (music) music.muted = !on; return on; }
  };
})();
