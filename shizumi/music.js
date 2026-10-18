/* 沈書庫の BGM と効果音の設計(sound.js が読む)。
 * 曲は種(seed)から毎回同じものが組み上がる。場面の名前 → 曲の名前は scenes で読み替え。
 * 場面: title / floor1〜5 / danger(体力が少ない) / madness(錯乱) / omen・story・rest・trap・treasure・shop(イベントの種類)
 *       / battle・battleDanger / boss・bossb(ボスを半分まで削った後)・bossIntro / remains / terminal / ending・ending:<id> / ev:<イベントid>
 */
window.GAME_MUSIC = {
  musicVol: 0.3, sfxVol: 0.5,
  sfx: { wave: 'square', pitch: 0 },
  themes: {
    // タイトル: オルゴールのような、遠い記憶
    title: { tempo: 64, root: 57, scale: 'minor', chords: ['0m', '8M', '3M', '10M'], lead: 'bell', leadVol: 0.14, density: 0.35, hold: 6, echo: true, bass: 'sine', bassStyle: 'drone', pad: true, padVol: 0.03, seed: 3 },
    // 第一層 閲覧室: 静粛。時計の音だけが響く
    floor1: { tempo: 72, root: 50, scale: 'dorian', chords: ['0m7', '5M7', '3M', '10M'], lead: 'triangle', leadVol: 0.13, density: 0.38, arp: 'pluck', arpStyle: 'slow', arpVol: 0.05, bass: 'triangle', bassStyle: 'half', drums: 'clock', seed: 11 },
    // 第二層 綴じ場: 糸と針の機械
    floor2: { tempo: 92, root: 52, scale: 'phrygian', chords: ['0m', '1M', '0m', '10M'], lead: 'pulse', leadVol: 0.1, density: 0.45, arp: 'pulse', arpStyle: 'fast', arpVol: 0.05, arpOct: 1, bass: 'square', bassStyle: 'eighth', bassVol: 0.09, drums: 'clock', seed: 21 },
    // 第三層 目録回廊: 丁寧な嘘。整いすぎた和音
    floor3: { tempo: 84, root: 47, scale: 'harmonic', chords: ['0m', '8M', '5dim', '7M'], lead: 'fm', ratio: 2, index: 1.5, leadVol: 0.12, density: 0.42, pad: 'organ', padVol: 0.03, bass: 'triangle', bassStyle: 'half', drums: 'soft', seed: 31 },
    // 第四層 水没書架: 水の底。ゆっくり、名前を呼ぶ声
    floor4: { tempo: 58, root: 49, scale: 'minor', chords: ['0m9', '8M7', '3M', '10sus'], lead: 'sine', vib: 2.5, leadVol: 0.14, density: 0.3, hold: 8, echo: true, pad: true, padVol: 0.04, padLp: 900, bass: 'sine', bassStyle: 'drone', arp: 'bell', arpStyle: 'slow', arpVol: 0.03, seed: 41 },
    // 第五層 索引の底: 緑の端末。機械が学習する
    floor5: { tempo: 108, root: 53, scale: 'dim', chords: ['0m', '1M', '6dim', '0m'], lead: 'square', leadLp: 2400, leadVol: 0.09, density: 0.5, arp: 'pulse', arpStyle: 'fast', arpVol: 0.05, arpOct: 1, bass: 'square', bassStyle: 'eighth', bassVol: 0.08, drums: 'tick', seed: 51 },
    // 不穏な部屋・罠: 心臓の音
    omen: { tempo: 66, root: 45, scale: 'phrygian', chords: ['0dim', '1M', '0dim', '6dim'], lead: 'sine', leadVol: 0.1, density: 0.18, hold: 8, pad: 'pad', padVol: 0.03, padLp: 700, bass: 'sine', bassStyle: 'drone', drums: 'march', seed: 61 },
    trap: { tempo: 120, root: 52, scale: 'phrygian', chords: ['0m', '1M', '0m', '1M'], lead: 'pulse', leadVol: 0.08, density: 0.5, bass: 'square', bassStyle: 'eighth', bassVol: 0.08, drums: 'tick', seed: 101 },
    // 物語の要・宝: 思い出す
    story: { tempo: 70, root: 57, scale: 'minor', chords: ['0m', '5M', '8M', '7M'], lead: 'bell', leadVol: 0.12, density: 0.36, hold: 6, arp: 'triangle', arpStyle: 'slow', arpVol: 0.05, bass: 'triangle', bassStyle: 'half', pad: true, padVol: 0.025, seed: 71 },
    // 休憩: ひと息
    rest: { tempo: 62, root: 53, scale: 'lydian', chords: ['0M7', '2M', '0M7', '7M'], lead: 'triangle', leadVol: 0.12, density: 0.3, hold: 6, arp: 'bell', arpStyle: 'slow', arpVol: 0.04, bass: 'sine', bassStyle: 'root', seed: 81 },
    // 店: 透けた老人の行李
    shop: { tempo: 100, root: 55, scale: 'mixolydian', chords: ['0M', '10M', '5M', '0M'], lead: 'pluck', leadVol: 0.13, density: 0.55, swing: 0.25, bass: 'triangle', bassStyle: 'walk', drums: 'soft', seed: 91 },
    // 戦闘
    battle: { tempo: 138, root: 57, scale: 'minor', chords: ['0m', '8M', '10M', '0m'], lead: 'square', leadVol: 0.1, leadLp: 3200, density: 0.6, arp: 'pulse', arpStyle: 'fast', arpVol: 0.04, bass: 'square', bassStyle: 'eighth', bassVol: 0.09, drums: 'beat', seed: 111 },
    battleDanger: { tempo: 156, root: 56, scale: 'harmonic', chords: ['0m', '1M', '8M', '7M'], lead: 'square', leadVol: 0.1, leadLp: 3000, density: 0.65, arp: 'pulse', arpStyle: 'fast', arpVol: 0.04, bass: 'square', bassStyle: 'eighth', bassVol: 0.09, drums: 'beat', seed: 112 },
    // ボス・ボスの前
    bossIntro: { tempo: 56, root: 45, scale: 'phrygian', chords: ['0m', '1M', '0m', '6dim'], lead: 'sine', leadVol: 0.1, density: 0.15, hold: 8, pad: 'pad', padVol: 0.04, padLp: 800, bass: 'sine', bassStyle: 'drone', drums: 'march', seed: 131 },
    boss: { tempo: 148, root: 50, scale: 'harmonic', chords: ['0m', '10M', '8M', '7M'], lead: 'fm', ratio: 3, index: 3, leadVol: 0.11, density: 0.6, pad: 'pad', padVol: 0.03, bass: 'square', bassStyle: 'eighth', bassVol: 0.1, drums: 'beat', seed: 121 },
    bossb: { tempo: 166, root: 51, scale: 'harmonic', chords: ['0m', '1M', '10M', '7M'], lead: 'fm', ratio: 3, index: 4, leadVol: 0.11, density: 0.7, arp: 'pulse', arpStyle: 'fast', arpVol: 0.04, bass: 'square', bassStyle: 'eighth', bassVol: 0.1, drums: 'beat', seed: 122 },
    // 体力が少ない・錯乱
    danger: { tempo: 96, root: 57, scale: 'minor', chords: ['0m', '1M', '0m', '6dim'], lead: 'sine', leadVol: 0.1, density: 0.28, bass: 'sine', bassStyle: 'drone', drums: 'march', pad: 'pad', padVol: 0.025, padLp: 700, seed: 141 },
    madness: { tempo: 86, root: 54, scale: 'whole', chords: ['0aug', '2aug', '4aug', '6aug'], lead: 'fm', ratio: 3.5, index: 6, vib: 4, leadVol: 0.1, density: 0.45, echo: true, bass: 'sine', bassStyle: 'drone', seed: 151 },
    // 前のあなたの本
    remains: { tempo: 58, root: 52, scale: 'minor', chords: ['0m', '8M', '3M', '10M'], lead: 'bell', leadVol: 0.12, density: 0.3, hold: 8, echo: true, pad: true, padVol: 0.03, seed: 161 },
    // 照会端末
    terminal: { tempo: 120, root: 64, scale: 'minpenta', chords: ['0m', '5m', '0m', '7m'], lead: 'square', leadLp: 2800, leadVol: 0.07, density: 0.5, arp: 'pulse', arpStyle: 'fast', arpVol: 0.03, drums: 'tick', bass: 'none', seed: 171 },
    // 結末
    ending: { tempo: 74, root: 53, scale: 'major', chords: ['0M', '9m', '5M', '7M'], lead: 'triangle', leadVol: 0.13, density: 0.4, hold: 6, arp: 'bell', arpStyle: 'slow', arpVol: 0.04, bass: 'triangle', bassStyle: 'half', pad: true, padVol: 0.03, seed: 181 },
    endingTrue: { tempo: 84, root: 60, scale: 'major', chords: ['0add9', '7M', '9m', '5M7'], lead: 'bell', leadVol: 0.14, density: 0.45, echo: true, arp: 'triangle', arpStyle: 'normal', arpVol: 0.04, bass: 'triangle', bassStyle: 'half', pad: true, padVol: 0.03, drums: 'soft', seed: 191 },
    endingDark: { tempo: 60, root: 50, scale: 'minor', chords: ['0m', '10M', '8M', '7sus'], lead: 'sine', leadVol: 0.12, density: 0.3, hold: 8, echo: true, pad: 'pad', padVol: 0.03, bass: 'sine', bassStyle: 'drone', seed: 199 },
  },
  scenes: {
    treasure: 'story', special: 'story', puzzle: null,
    'ev:c_terminal': 'terminal',
    'ending:true': 'endingTrue', 'ending:chair': 'endingDark', 'ending:fake_exit': 'endingDark', 'ending:rewrite': 'endingDark', 'ending:rewrite_flood': 'endingDark',
  },
  jingles: {
    death: { tempo: 84, wave: 'square', lp: 2200, bass: true, notes: [[64, 0.5], [63, 0.5], [62, 0.5], [61, 2.5]] },
  },
};
