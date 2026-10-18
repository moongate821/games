/* 底鳴りの BGM と効果音の設計(sound.js が読む)。深いほど遅く低く、浅くなるほど速く明るく。
 * 同化(doka)が上がると探索の曲が「底の歌」に寄っていく(varScenes)。
 */
window.GAME_MUSIC = {
  musicVol: 0.32, sfxVol: 0.5,
  sfx: { wave: 'triangle', pitch: -5 },
  tickPitch: 90,
  stairsUp: true,
  themes: {
    // タイトル: 三時十七分の通話
    title: { tempo: 58, root: 45, scale: 'dorian', chords: ['0m9', '10M', '8M7', '7sus'], lead: 'sine', vib: 1.5, leadVol: 0.14, density: 0.28, hold: 8, echo: true, pad: true, padVol: 0.035, padLp: 900, bass: 'sine', bassStyle: 'drone', drums: 'sonar', seed: 7 },
    // 深度一〇九〇〇 海溝の底: ほとんど音のない闇
    floor1: { tempo: 52, root: 40, scale: 'phrygian', chords: ['0m', '1M', '0m', '10m'], lead: 'sine', leadVol: 0.12, density: 0.22, hold: 8, echo: true, pad: 'pad', padVol: 0.035, padLp: 600, bass: 'sine', bassStyle: 'drone', drums: 'sonar', seed: 13 },
    // 深度八〇〇〇 機関区: 動く時計と止まった時計
    floor2: { tempo: 86, root: 45, scale: 'minor', chords: ['0m', '5m', '10M', '3M'], lead: 'pulse', leadVol: 0.09, density: 0.42, arp: 'pulse', arpStyle: 'fast', arpVol: 0.045, bass: 'square', bassStyle: 'eighth', bassVol: 0.08, drums: 'clock', seed: 23 },
    // 深度五〇〇〇 居住区: 声だけが残った部屋
    floor3: { tempo: 70, root: 50, scale: 'harmonic', chords: ['0m', '8M7', '5m', '7M'], lead: 'fm', ratio: 1, index: 1.2, leadVol: 0.12, density: 0.36, echo: true, arp: 'bell', arpStyle: 'slow', arpVol: 0.035, bass: 'triangle', bassStyle: 'half', drums: 'soft', seed: 33 },
    // 深度二〇〇〇 鯨骨の森: 白い骨と、光る生き物
    floor4: { tempo: 64, root: 47, scale: 'lydian', chords: ['0M7', '2M', '7M', '6m'], lead: 'bell', leadVol: 0.13, density: 0.32, hold: 6, echo: true, pad: true, padVol: 0.035, bass: 'sine', bassStyle: 'drone', drums: 'sonar', seed: 43 },
    // 深度二〇〇 浮上ドック: 光が見える。急がせる
    floor5: { tempo: 112, root: 52, scale: 'dorian', chords: ['0m', '10M', '5M', '7m'], lead: 'square', leadLp: 3000, leadVol: 0.1, density: 0.55, arp: 'pulse', arpStyle: 'fast', arpVol: 0.04, bass: 'square', bassStyle: 'eighth', bassVol: 0.09, drums: 'march', seed: 53 },
    // 同化が進んだ時: 底の歌
    doka: { tempo: 56, root: 42, scale: 'whole', chords: ['0aug', '2aug', '0aug', '10aug'], lead: 'sine', vib: 3, leadVol: 0.12, density: 0.3, hold: 8, echo: true, pad: 'pad', padVol: 0.04, padLp: 700, bass: 'sine', bassStyle: 'drone', drums: 'sonar', seed: 61 },
    doka2: { tempo: 50, root: 40, scale: 'whole', chords: ['0aug', '4aug', '2aug', '6aug'], lead: 'fm', ratio: 3.5, index: 5, vib: 4, leadVol: 0.11, density: 0.35, echo: true, pad: 'pad', padVol: 0.045, padLp: 600, bass: 'sine', bassStyle: 'drone', seed: 62 },
    // 不穏・罠
    omen: { tempo: 62, root: 43, scale: 'phrygian', chords: ['0dim', '1M', '0dim', '6dim'], lead: 'sine', leadVol: 0.1, density: 0.16, hold: 8, pad: 'pad', padVol: 0.03, padLp: 600, bass: 'sine', bassStyle: 'drone', drums: 'march', seed: 71 },
    trap: { tempo: 124, root: 47, scale: 'phrygian', chords: ['0m', '1M', '0m', '1M'], lead: 'pulse', leadVol: 0.08, density: 0.5, bass: 'square', bassStyle: 'eighth', bassVol: 0.08, drums: 'tick', seed: 81 },
    // 物語の要: 十二年前の記録
    story: { tempo: 66, root: 52, scale: 'minor', chords: ['0m', '8M', '3M', '10M'], lead: 'triangle', leadVol: 0.12, density: 0.34, hold: 6, arp: 'bell', arpStyle: 'slow', arpVol: 0.04, bass: 'triangle', bassStyle: 'half', pad: true, padVol: 0.025, seed: 91 },
    // 休息(空気だまりなど)
    rest: { tempo: 58, root: 48, scale: 'lydian', chords: ['0M7', '2M', '0M7', '7M'], lead: 'sine', leadVol: 0.11, density: 0.28, hold: 8, arp: 'bell', arpStyle: 'slow', arpVol: 0.035, bass: 'sine', bassStyle: 'root', seed: 101 },
    // 物資のロッカー
    shop: { tempo: 96, root: 50, scale: 'mixolydian', chords: ['0M', '10M', '5M', '0M'], lead: 'pluck', leadVol: 0.12, density: 0.5, bass: 'triangle', bassStyle: 'walk', drums: 'soft', seed: 111 },
    // 戦闘
    battle: { tempo: 134, root: 45, scale: 'minor', chords: ['0m', '10M', '8M', '7M'], lead: 'square', leadVol: 0.1, leadLp: 3000, density: 0.6, arp: 'pulse', arpStyle: 'fast', arpVol: 0.04, bass: 'square', bassStyle: 'eighth', bassVol: 0.1, drums: 'beat', seed: 121 },
    battleDanger: { tempo: 152, root: 44, scale: 'harmonic', chords: ['0m', '1M', '8M', '7M'], lead: 'square', leadVol: 0.1, leadLp: 2800, density: 0.65, arp: 'pulse', arpStyle: 'fast', arpVol: 0.04, bass: 'square', bassStyle: 'eighth', bassVol: 0.1, drums: 'beat', seed: 122 },
    bossIntro: { tempo: 54, root: 40, scale: 'phrygian', chords: ['0m', '1M', '0m', '6dim'], lead: 'sine', leadVol: 0.1, density: 0.15, hold: 8, pad: 'pad', padVol: 0.04, padLp: 700, bass: 'sine', bassStyle: 'drone', drums: 'march', seed: 131 },
    boss: { tempo: 144, root: 45, scale: 'harmonic', chords: ['0m', '8M', '10M', '7M'], lead: 'fm', ratio: 2, index: 3, leadVol: 0.11, density: 0.6, pad: 'pad', padVol: 0.03, bass: 'square', bassStyle: 'eighth', bassVol: 0.1, drums: 'beat', seed: 141 },
    bossb: { tempo: 162, root: 46, scale: 'harmonic', chords: ['0m', '1M', '8M', '7M'], lead: 'fm', ratio: 2, index: 4, leadVol: 0.11, density: 0.7, arp: 'pulse', arpStyle: 'fast', arpVol: 0.04, bass: 'square', bassStyle: 'eighth', bassVol: 0.1, drums: 'beat', seed: 142 },
    // 最後の敵「初号」だけ別の曲
    shogou: { tempo: 140, root: 40, scale: 'dim', chords: ['0m', '6dim', '1M', '0m'], lead: 'fm', ratio: 3.5, index: 5, vib: 2, leadVol: 0.11, density: 0.55, pad: 'pad', padVol: 0.04, padLp: 900, bass: 'square', bassStyle: 'eighth', bassVol: 0.1, drums: 'beat', seed: 151 },
    shogoub: { tempo: 158, root: 41, scale: 'dim', chords: ['0m', '1M', '6dim', '7M'], lead: 'fm', ratio: 3.5, index: 6, vib: 3, leadVol: 0.11, density: 0.65, arp: 'pulse', arpStyle: 'fast', arpVol: 0.04, bass: 'square', bassStyle: 'eighth', bassVol: 0.1, drums: 'beat', seed: 152 },
    // 体力・精神が危ない
    danger: { tempo: 92, root: 45, scale: 'minor', chords: ['0m', '1M', '0m', '6dim'], lead: 'sine', leadVol: 0.1, density: 0.26, bass: 'sine', bassStyle: 'drone', drums: 'march', pad: 'pad', padVol: 0.025, padLp: 600, seed: 161 },
    madness: { tempo: 80, root: 47, scale: 'whole', chords: ['0aug', '2aug', '4aug', '6aug'], lead: 'fm', ratio: 3.5, index: 6, vib: 4, leadVol: 0.1, density: 0.42, echo: true, bass: 'sine', bassStyle: 'drone', seed: 171 },
    // 前の周の潜水服
    remains: { tempo: 56, root: 47, scale: 'minor', chords: ['0m', '8M', '3M', '10M'], lead: 'bell', leadVol: 0.12, density: 0.28, hold: 8, echo: true, pad: true, padVol: 0.03, drums: 'sonar', seed: 181 },
    // 通話(無線)
    terminal: { tempo: 108, root: 57, scale: 'minpenta', chords: ['0m', '5m', '0m', '7m'], lead: 'square', leadLp: 1800, leadVol: 0.06, density: 0.4, drums: 'tick', bass: 'none', pad: 'pad', padVol: 0.02, padLp: 1200, seed: 191 },
    // 結末
    ending: { tempo: 72, root: 52, scale: 'dorian', chords: ['0m', '5M', '10M', '7m'], lead: 'triangle', leadVol: 0.12, density: 0.36, hold: 6, arp: 'bell', arpStyle: 'slow', arpVol: 0.04, bass: 'triangle', bassStyle: 'half', pad: true, padVol: 0.03, drums: 'sonar', seed: 201 },
    endingTrue: { tempo: 80, root: 55, scale: 'major', chords: ['0add9', '7M', '9m', '5M7'], lead: 'bell', leadVol: 0.14, density: 0.42, echo: true, arp: 'triangle', arpStyle: 'normal', arpVol: 0.04, bass: 'triangle', bassStyle: 'half', pad: true, padVol: 0.03, drums: 'soft', seed: 211 },
    endingDark: { tempo: 50, root: 40, scale: 'whole', chords: ['0aug', '2aug', '0aug', '10aug'], lead: 'sine', vib: 3, leadVol: 0.12, density: 0.28, hold: 8, echo: true, pad: 'pad', padVol: 0.04, padLp: 700, bass: 'sine', bassStyle: 'drone', drums: 'sonar', seed: 219 },
  },
  scenes: {
    treasure: 'story', puzzle: null, special: null,
    'ev:c_radio': 'terminal', 'ev:f5_radio': 'terminal', 'ev:f3_real_voice': 'story', 'ev:f5_fast': 'trap',
    'enemy:shogou': 'shogou', 'enemy:shogoub': 'shogoub',
    'ending:true': 'endingTrue', 'ending:doka': 'endingDark', 'ending:fake_capsule': 'endingDark',
  },
  // 同化が上がると探索の曲が変わる(高い方を先に)
  varScenes: [{ var: 'doka', min: 6, scene: 'doka2' }, { var: 'doka', min: 3, scene: 'doka' }],
  jingles: {
    death: { tempo: 70, wave: 'sine', bass: true, notes: [[64, 1], [59, 1], [57, 0.5], [52, 3]] },
  },
};
