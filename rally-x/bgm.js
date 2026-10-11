'use strict';
// BGM: オリジナルの自動演奏(原作の曲は使わない)。資料の「ダイナミックBGM」案:
// 敵の数で楽器が重なる(ベース+ハイハット → ドラム → メロディ → アルペジオ)。フィーバーでテンポ1.2倍、ボス戦は不穏な進行。Mキーで消音。
const BGM = { on: true, step: 0, next: 0, gain: null, noise: null, timer: null };
const SONG = {
  normal: {
    bpm: 138, roots: [45, 41, 48, 43], minor: [1, 0, 0, 0], // Am - F - C - G
    lead: [
      [12, -1, 15, -1, 19, -1, 17, 15, 12, -1, 10, -1, 12, -1, -1, -1],
      [12, -1, 16, -1, 19, -1, 17, 16, 14, -1, 12, -1, 14, -1, -1, -1],
      [12, -1, 16, -1, 19, -1, 21, 19, 16, -1, 14, -1, 12, -1, -1, -1],
      [14, -1, 12, -1, 11, -1, 12, 14, 16, -1, 19, -1, 17, -1, 14, -1],
    ],
  },
  boss: {
    bpm: 150, roots: [45, 46, 45, 44], minor: [1, 0, 1, 0], // Am - B♭ - Am - G♯(不穏)
    lead: [
      [12, 13, 12, -1, 15, -1, 12, -1, 18, -1, 17, -1, 15, -1, 13, -1],
      [12, -1, 11, -1, 12, -1, 16, -1, 15, -1, 12, -1, 11, -1, -1, -1],
      [12, 13, 12, -1, 15, -1, 12, -1, 19, -1, 18, -1, 15, -1, 13, -1],
      [12, -1, 15, -1, 16, -1, 15, -1, 12, -1, 11, -1, 8, -1, -1, -1],
    ],
  },
};
const mtof = m => 440 * Math.pow(2, (m - 69) / 12);
function bgmInit() {
  if (!AC || BGM.gain) return;
  try {
    BGM.gain = AC.createGain(); BGM.gain.gain.value = 0; BGM.gain.connect(AC.destination);
    const len = AC.sampleRate * .5 | 0, buf = AC.createBuffer(1, len, AC.sampleRate), d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    BGM.noise = buf; BGM.next = AC.currentTime + .1; BGM.timer = setInterval(bgmTick, 25);
  } catch (e) { BGM.gain = null; }
}
function bTone(f, t, d, type, v) {
  const o = AC.createOscillator(), g = AC.createGain(); o.type = type; o.frequency.setValueAtTime(f, t);
  g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(v, t + .005); g.gain.exponentialRampToValueAtTime(.0001, t + d);
  o.connect(g); g.connect(BGM.gain); o.start(t); o.stop(t + d + .02);
}
function bNoise(t, d, v, hp) {
  const s = AC.createBufferSource(), f = AC.createBiquadFilter(), g = AC.createGain(); s.buffer = BGM.noise; f.type = 'highpass'; f.frequency.value = hp;
  g.gain.setValueAtTime(v, t); g.gain.exponentialRampToValueAtTime(.0001, t + d); s.connect(f); f.connect(g); g.connect(BGM.gain); s.start(t, Math.random() * .3); s.stop(t + d + .02);
}
function bKick(t) {
  const o = AC.createOscillator(), g = AC.createGain(); o.frequency.setValueAtTime(150, t); o.frequency.exponentialRampToValueAtTime(45, t + .12);
  g.gain.setValueAtTime(.9, t); g.gain.exponentialRampToValueAtTime(.001, t + .18); o.connect(g); g.connect(BGM.gain); o.start(t); o.stop(t + .2);
}
function bgmSong() { return G && (G.boss || G.bossWarn > 0) ? SONG.boss : SONG.normal; }
function bgmTick() {
  if (!AC || !BGM.gain) return;
  try {
    const playing = BGM.on && G && (state === 'play' || state === 'levelup' || state === 'title');
    BGM.gain.gain.setTargetAtTime(playing ? (state === 'title' ? .08 : .16) : 0, AC.currentTime, .15);
    if (BGM.next < AC.currentTime - .3) BGM.next = AC.currentTime + .05; // タブが裏にあって遅れた時は追いつかせず今から
    while (BGM.next < AC.currentTime + .12) {
      if (playing) bgmStep(BGM.next);
      BGM.next += 60 / (bgmSong().bpm * (G && G.fever > 0 ? 1.2 : 1)) / 4; BGM.step++;
    }
  } catch (e) { }
}
function bgmStep(t) {
  const s = BGM.step % 16, bar = (BGM.step >> 4) % 4, song = bgmSong(), root = song.roots[bar];
  const n = G.enemies.length, boss = !!(G.boss || G.bossWarn > 0), fev = G.fever > 0, title = state === 'title';
  // 1層目: ベース(8分、オクターブで跳ねる)+ハイハット
  if (s % 2 === 0) { const note = root + (s % 4 === 2 ? 12 : 0); bTone(mtof(note), t, .2, 'triangle', .5); bTone(mtof(note), t, .1, 'square', .07); }
  if (s % 2 === 1) bNoise(t, .04, .22, 7000);
  if (title) return;
  // 2層目: キックとスネア(敵15台以上・ボス・フィーバー)
  if (n > 15 || boss || fev) {
    if (s % 4 === 0) bKick(t);
    if (s === 4 || s === 12) { bNoise(t, .14, .5, 1500); bTone(190, t, .08, 'triangle', .3); }
  }
  // 3層目: メロディ(敵50台以上・ボス・フィーバー)
  if (n > 50 || boss || fev) { const off = song.lead[bar][s]; if (off >= 0) { bTone(mtof(root + 24 + off), t, .17, 'square', .085); bTone(mtof(root + 24 + off) * 1.006, t, .17, 'sawtooth', .03); } }
  // 4層目: アルペジオ(敵120台以上・フィーバー・ボス第3段階)
  if (n > 120 || fev || (G.boss && G.boss.phase === 3)) { const ch = song.minor[bar] ? [0, 3, 7, 12] : [0, 4, 7, 12]; bTone(mtof(root + 36 + ch[s % 4]), t, .07, 'square', .04); }
}
