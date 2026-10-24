/* 霧の灯台 audio.js  WebAudio手続き生成のSE/BGM。engineのイベントのみ購読 */
(function (root) {
'use strict';
var A = { ctx: null, master: null, sfxG: null, bgmG: null, vol: { bgm: 0.5, sfx: 0.7 }, last: {}, cnt: {}, bgmOn: false, bgmTimer: null, mode: 'menu', noiseBuf: null, ok: false, step: 0 };
var PENT = [0, 2, 4, 7, 9]; // ペンタトニック

function ensure() {
  if (A.ctx) return true;
  try {
    var AC = window.AudioContext || window.webkitAudioContext; if (!AC) return false;
    A.ctx = new AC(); var c = A.ctx;
    A.master = c.createGain(); A.master.gain.value = 0.9;
    var comp = c.createDynamicsCompressor(); A.master.connect(comp); comp.connect(c.destination);
    A.sfxG = c.createGain(); A.sfxG.gain.value = A.vol.sfx; A.sfxG.connect(A.master);
    A.bgmG = c.createGain(); A.bgmG.gain.value = A.vol.bgm * 0.5; A.bgmG.connect(A.master);
    var len = c.sampleRate, buf = c.createBuffer(1, len, c.sampleRate), d = buf.getChannelData(0); for (var i = 0; i < len; i++) d[i] = Math.random() * 2 - 1; A.noiseBuf = buf;
    A.ok = true; return true;
  } catch (e) { A.ok = false; return false; }
}
function resume() { if (!ensure()) return; if (A.ctx.state === 'suspended') A.ctx.resume(); }
function setVolumes(bgm, sfx) { A.vol.bgm = bgm; A.vol.sfx = sfx; if (A.ok) { A.sfxG.gain.value = sfx; A.bgmG.gain.value = bgm * 0.5; } }
function tone(f, dur, type, vol, f2, delay, dest) {
  if (!A.ok) return; var c = A.ctx, t = c.currentTime + (delay || 0), o = c.createOscillator(), g = c.createGain();
  o.type = type || 'sine'; o.frequency.setValueAtTime(f, t); if (f2) o.frequency.exponentialRampToValueAtTime(Math.max(20, f2), t + dur);
  g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + 0.008); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g); g.connect(dest || A.sfxG); o.start(t); o.stop(t + dur + 0.05);
}
function noise(dur, vol, freq, q, type, delay) {
  if (!A.ok) return; var c = A.ctx, t = c.currentTime + (delay || 0), s = c.createBufferSource(), f = c.createBiquadFilter(), g = c.createGain();
  s.buffer = A.noiseBuf; f.type = type || 'lowpass'; f.frequency.value = freq; f.Q.value = q || 1;
  g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur); s.connect(f); f.connect(g); g.connect(A.sfxG); s.start(t, Math.random() * 0.5); s.stop(t + dur + 0.05);
}
function bell(f, vol, dur, delay) { var ratios = [1, 2.01, 2.76, 5.4]; for (var i = 0; i < ratios.length; i++) tone(f * ratios[i], dur / (1 + i * 0.6), 'sine', vol / (1 + i * 1.2), null, delay); }

var SFX = {
  T1: function () { noise(0.09, 0.22, 1800, 1); tone(520, 0.07, 'triangle', 0.08, 300); },
  T2: function () { tone(900, 0.16, 'sine', 0.2, 180); noise(0.05, 0.1, 3000, 1, 'highpass'); },
  T3: function () { tone(110, 0.5, 'sine', 0.3, 80); tone(165, 0.45, 'triangle', 0.1, 120); noise(0.3, 0.1, 400, 1); },
  T4: function () { tone(1300, 0.18, 'sine', 0.1, 1800); tone(1960, 0.2, 'sine', 0.06); },
  T5: function () { noise(0.14, 0.2, 2500, 3, 'bandpass'); tone(1400, 0.1, 'sawtooth', 0.06, 200); },
  kill: function () { tone(520, 0.14, 'sine', 0.1, 900); },
  boss: function () { tone(70, 1.0, 'sawtooth', 0.15, 50); tone(105, 1.0, 'sine', 0.2, 70); noise(0.6, 0.15, 300, 1); },
  leak: function () { tone(120, 0.4, 'sine', 0.35, 50); noise(0.3, 0.2, 500, 1); },
  build: function () { noise(0.04, 0.2, 600, 1); bell(660, 0.14, 0.5, 0.02); tone(220, 0.15, 'triangle', 0.15, 120); },
  upgrade: function () { [523, 659, 784, 1047].forEach(function (f, i) { tone(f, 0.25, 'triangle', 0.12, null, i * 0.07); }); },
  sell: function () { tone(880, 0.1, 'square', 0.06); tone(1175, 0.15, 'square', 0.06, null, 0.08); },
  deny: function () { tone(150, 0.18, 'sawtooth', 0.14, 100); },
  wave: function () { tone(98, 1.0, 'sawtooth', 0.12, 92); tone(147, 1.0, 'sine', 0.16, 140); },
  reveal: function () { tone(520, 0.05, 'sine', 0.06); tone(1400, 0.09, 'sine', 0.07, 1900, 0.04); },
  bell: function () { bell(300, 0.35, 2.2); },
  freeze: function () { tone(2400, 0.2, 'sine', 0.06, 1200); },
  summon: function () { tone(200, 0.4, 'sine', 0.12, 400); },
  click: function () { tone(700, 0.05, 'sine', 0.06, 500); },
  waveClear: function () { [392, 523, 659].forEach(function (f, i) { tone(f, 0.3, 'sine', 0.1, null, i * 0.09); }); },
  win: function () { [523, 659, 784, 1047, 1319].forEach(function (f, i) { bell(f, 0.2, 1.6, i * 0.16); }); },
  lose: function () { [392, 330, 262, 196].forEach(function (f, i) { tone(f, 0.7, 'triangle', 0.18, f * 0.95, i * 0.25); }); },
  oil: function () { tone(1568, 0.08, 'sine', 0.05); },
  heart: function () { tone(70, 0.12, 'sine', 0.3, 45); tone(66, 0.14, 'sine', 0.26, 42, 0.17); },
  alarm: function () { tone(880, 0.16, 'square', 0.07); tone(660, 0.16, 'square', 0.07, null, 0.2); tone(880, 0.16, 'square', 0.07, null, 0.4); },
  roar: function () { tone(90, 0.8, 'sawtooth', 0.2, 40); noise(0.7, 0.2, 400, 1); },
  pick: function () { [880, 1175, 1568, 2093].forEach(function (f, i) { tone(f, 0.18, 'sine', 0.08, null, i * 0.05); }); },
  gust: function () { noise(0.5, 0.1, 900, 1, 'bandpass'); }
};
var LIM = { T1: 0.05, T2: 0.05, T3: 0.1, T4: 0.06, T5: 0.06, kill: 0.04, reveal: 0.08, oil: 0.2, leak: 0.1 };
function sfx(name) {
  if (!A.ok || !SFX[name] || A.vol.sfx <= 0) return; var now = A.ctx.currentTime, lim = LIM[name] || 0.04;
  if (A.last[name] && now - A.last[name] < lim) return; A.last[name] = now; SFX[name]();
}
var chainIdx = 0, chainT = 0;
function killChain() {
  if (!A.ok || A.vol.sfx <= 0) return; var now = A.ctx.currentTime; if (now - chainT > 1.2) chainIdx = 0; chainT = now;
  var deg = PENT[chainIdx % 5] + 12 * Math.floor(chainIdx / 5); if (chainIdx < 9) chainIdx++;
  if (A.last.kill && now - A.last.kill < 0.04) return; A.last.kill = now; tone(520 * Math.pow(2, deg / 12), 0.14, 'sine', 0.1, 520 * Math.pow(2, deg / 12) * 1.5);
}
function flush(evs) {
  if (!A.ok) return; var firedLimit = 0;
  for (var i = 0; i < evs.length; i++) {
    var e = evs[i];
    switch (e.t) {
      case 'fire': if (!e.sub) sfx(e.def); break;
      case 'blast': break;
      case 'chain': break;
      case 'kill': if (e.boss) sfx('boss'); else killChain(); break;
      case 'flash': sfx('wave'); break;
      case 'bossWarn': case 'ambushWarn': sfx('alarm'); break;
      case 'roar': sfx('roar'); break;
      case 'picked': case 'combo': sfx('pick'); break;
      case 'gust': sfx('gust'); break;
      case 'leak': sfx('leak'); break;
      case 'build': sfx('build'); break;
      case 'upgrade': sfx('upgrade'); break;
      case 'sell': sfx('sell'); break;
      case 'wave': sfx('wave'); break;
      case 'waveClear': sfx('waveClear'); break;
      case 'reveal': sfx('reveal'); break;
      case 'bell': sfx('bell'); break;
      case 'freeze': sfx('freeze'); break;
      case 'summon': sfx('summon'); break;
      case 'bossPhase': sfx('boss'); break;
      case 'win': sfx('win'); break;
      case 'lose': sfx('lose'); break;
      case 'oil': if (e.early) sfx('oil'); break;
    }
  }
}

/* ---- BGM: 低音ドローン + ゆるいアルペジオ ---- */
var drone = null;
function bgmStart(mode) {
  A.mode = mode || 'menu'; if (!ensure()) return; resume(); if (A.bgmOn) return; A.bgmOn = true; var c = A.ctx;
  drone = { o1: c.createOscillator(), o2: c.createOscillator(), g: c.createGain(), lfo: c.createOscillator(), lg: c.createGain() };
  drone.o1.type = 'sine'; drone.o1.frequency.value = 55; drone.o2.type = 'triangle'; drone.o2.frequency.value = 82.4; drone.g.gain.value = 0.16;
  drone.lfo.frequency.value = 0.12; drone.lg.gain.value = 0.06; drone.lfo.connect(drone.lg); drone.lg.connect(drone.g.gain);
  drone.o1.connect(drone.g); drone.o2.connect(drone.g); drone.g.connect(A.bgmG); drone.o1.start(); drone.o2.start(); drone.lfo.start();
  A.step = 0; tick();
}
var THEME = [0, 2, 4, 7, 4, 2, 0, -3, 0, 2, 4, 9, 7, 4, 2, 0]; // 主題旋律(ペンタ度数)。全場面で共通
var SC = { maj: [0, 2, 4, 7, 9], min: [0, 3, 5, 7, 10] };
function degToSemi(d, minor) { var sc = minor ? SC.min : SC.maj, o = Math.floor(d / 5), i = ((d % 5) + 5) % 5; return sc[i] + 12 * o; }
function setStageMusic(id) { A.keyShift = id <= 4 ? 0 : id <= 8 ? -2 : id <= 11 ? -4 : 0; A.minor = id >= 9 && id <= 11; A.timbre = id <= 4 ? 'bell' : id <= 8 ? 'box' : id <= 11 ? 'pipe' : 'bell'; A.tempo = id <= 4 ? 66 : id <= 8 ? 72 : id <= 11 ? 60 : 66; }
function note(f, t, vol) {
  var c = A.ctx, tm = A.timbre || 'bell';
  if (tm === 'bell') { [1, 2.01, 2.76].forEach(function (r, i) { var o = c.createOscillator(), g = c.createGain(); o.type = 'sine'; o.frequency.value = f * r; g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol / (1 + i * 1.5), t + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, t + 2.0 / (1 + i * 0.5)); o.connect(g); g.connect(A.bgmG); o.start(t); o.stop(t + 2.1); }); }
  else { var o2 = c.createOscillator(), g2 = c.createGain(); o2.type = tm === 'box' ? 'triangle' : 'sine'; o2.frequency.value = f; if (tm === 'pipe') { var l = c.createOscillator(), lg = c.createGain(); l.frequency.value = 5; lg.gain.value = f * 0.01; l.connect(lg); lg.connect(o2.frequency); l.start(t); l.stop(t + 1.6); } g2.gain.setValueAtTime(0.0001, t); g2.gain.exponentialRampToValueAtTime(vol, t + (tm === 'pipe' ? 0.12 : 0.01)); g2.gain.exponentialRampToValueAtTime(0.0001, t + (tm === 'box' ? 0.9 : 1.5)); o2.connect(g2); g2.connect(A.bgmG); o2.start(t); o2.stop(t + 1.7); }
}
function tick() {
  if (!A.bgmOn) return; var c = A.ctx, battle = A.mode === 'battle', beat = 60 / (A.tempo || 66) * (battle ? 2 : 1);
  if (A.vol.bgm > 0 && c.state === 'running') {
    var idx = A.step % THEME.length; if (!battle || idx % 2 === 0 || A.lastWave) { var semi = degToSemi(THEME[idx], A.minor) + (A.keyShift || 0) + (A.lastWave ? 12 : 0); note(220 * Math.pow(2, semi / 12), c.currentTime + 0.05, battle ? 0.1 : 0.16); }
    if (A.step % 16 === 0 && drone) { var r = [55, 49, 41.2, 55][Math.floor(A.step / 16) % 4] * Math.pow(2, (A.keyShift || 0) / 12); drone.o1.frequency.setTargetAtTime(r, c.currentTime, 1.5); drone.o2.frequency.setTargetAtTime(r * 1.5, c.currentTime, 1.5); }
    A.step++;
  }
  A.bgmTimer = setTimeout(tick, beat * 1000);
}
function bgmStop() { A.bgmOn = false; clearTimeout(A.bgmTimer); if (drone) { try { drone.o1.stop(); drone.o2.stop(); drone.lfo.stop(); } catch (e) { } drone = null; } }
function setMode(m) { A.mode = m; }
function setLast(v) { A.lastWave = !!v; }

root.Fog = root.Fog || {};
root.Fog.Audio = { resume: resume, setVolumes: setVolumes, sfx: sfx, flush: flush, bgmStart: bgmStart, bgmStop: bgmStop, setMode: setMode, setStageMusic: setStageMusic, setLast: setLast, state: A };
})(typeof window !== 'undefined' ? window : this);
