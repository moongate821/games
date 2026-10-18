/* もういちど、十二月 の BGM と効果音の設計(sound.js が読む)。
 * 一九九九年の冬の港町。章ごとの曲、相手ごとの曲(eventScenes でイベントの id から選ぶ)、
 * 胸騒ぎ(omen)・修羅場・聖夜・除夜の汽笛(長・短・長)。
 */
window.GAME_MUSIC = {
  musicVol: 0.3, sfxVol: 0.45,
  sfx: { wave: 'triangle', pitch: 0 },
  tickPitch: 100,
  themes: {
    // タイトル: 除夜の汽笛を、ひとりで聞いてはいけない
    title: { tempo: 72, root: 53, scale: 'major', chords: ['0M7', '9m7', '2m7', '77'], lead: 'bell', leadVol: 0.13, density: 0.38, hold: 6, echo: true, bass: 'triangle', bassStyle: 'walk', pad: true, padVol: 0.025, drums: 'bells', seed: 5 },
    // 第一章 十二月のはじめ: 駅に降りた朝
    floor1: { tempo: 92, root: 53, scale: 'major', chords: ['0M7', '9m7', '2m7', '77'], lead: 'triangle', leadVol: 0.13, density: 0.45, swing: 0.22, arp: 'bell', arpStyle: 'slow', arpVol: 0.035, bass: 'triangle', bassStyle: 'walk', drums: 'soft', seed: 11 },
    // 第二章 霜の週: 噂が回り始める
    floor2: { tempo: 84, root: 50, scale: 'dorian', chords: ['0m7', '5M7', '10M7', '9m7'], lead: 'fm', ratio: 1, index: 1.4, leadVol: 0.12, density: 0.42, swing: 0.2, bass: 'triangle', bassStyle: 'walk', drums: 'soft', seed: 21 },
    // 第三章 冬至: 一年でいちばん長い夜
    floor3: { tempo: 68, root: 57, scale: 'minor', chords: ['0m9', '8M7', '5m7', '7sus'], lead: 'bell', leadVol: 0.12, density: 0.34, hold: 6, echo: true, pad: true, padVol: 0.03, bass: 'triangle', bassStyle: 'half', seed: 31 },
    // 第四章 聖夜: 鐘とワルツ
    floor4: { tempo: 108, beats: 3, root: 51, scale: 'major', chords: ['0M', '5M', '7M', '0M'], lead: 'pluck', leadVol: 0.13, density: 0.5, arp: 'bell', arpStyle: 'normal', arpVol: 0.04, bass: 'triangle', bassStyle: 'root', drums: 'bells', seed: 41 },
    // 第五章 除夜: 汽笛までの七日間
    floor5: { tempo: 74, root: 55, scale: 'mixolydian', chords: ['0M', '10M', '5M', '0sus'], lead: 'sine', vib: 1.5, leadVol: 0.13, density: 0.36, hold: 6, pad: true, padVol: 0.035, bass: 'sine', bassStyle: 'drone', drums: 'tick', seed: 51 },
    // 相手ごとの曲
    togo: { tempo: 76, root: 48, scale: 'major', chords: ['0M', '5M', '9m', '7M'], lead: 'triangle', leadVol: 0.13, density: 0.36, hold: 6, bass: 'triangle', bassStyle: 'half', pad: 'organ', padVol: 0.02, seed: 61 },       // 冬吾: 赤いバイク、短い丁寧語
    suzu: { tempo: 124, root: 60, scale: 'lydian', chords: ['0M7', '2M', '7M', '4m7'], lead: 'pulse', leadVol: 0.09, density: 0.6, arp: 'pulse', arpStyle: 'fast', arpVol: 0.035, arpOct: 1, bass: 'triangle', bassStyle: 'eighth', bassVol: 0.1, drums: 'soft', seed: 71 }, // 鈴: 早口、霧の数字
    ruka: { tempo: 88, root: 51, scale: 'dorian', chords: ['0m7', '5M7', '10M7', '3M7'], lead: 'pluck', leadVol: 0.13, density: 0.5, swing: 0.33, bass: 'triangle', bassStyle: 'walk', drums: 'soft', seed: 81 },   // ルカ: ピアノとジャズ
    nagi: { tempo: 66, root: 55, scale: 'major', chords: ['0M7', '4m7', '9m7', '2m7'], lead: 'bell', leadVol: 0.12, density: 0.32, hold: 8, echo: true, pad: true, padVol: 0.03, bass: 'sine', bassStyle: 'half', seed: 91 },   // 凪: 喫茶「汽笛」、湯気
    tami: { tempo: 112, root: 57, scale: 'major', chords: ['0M', '5M', '7M', '0M'], lead: 'pluck', leadVol: 0.12, density: 0.55, bass: 'triangle', bassStyle: 'walk', drums: 'soft', seed: 95 },               // 多美さん: 世話焼き
    // 胸騒ぎ・修羅場・離脱
    omen: { tempo: 64, root: 50, scale: 'minor', chords: ['0m', '1M', '0m', '7dim'], lead: 'sine', leadVol: 0.1, density: 0.2, hold: 8, pad: 'pad', padVol: 0.03, padLp: 800, bass: 'sine', bassStyle: 'drone', drums: 'march', seed: 101 },
    clash: { tempo: 132, root: 52, scale: 'harmonic', chords: ['0m', '1M', '0m', '8M'], lead: 'square', leadVol: 0.09, leadLp: 2600, density: 0.55, arp: 'pulse', arpStyle: 'fast', arpVol: 0.035, bass: 'square', bassStyle: 'eighth', bassVol: 0.08, drums: 'beat', seed: 111 },
    // 寒さ・坂道・働きすぎ(罠)
    trap: { tempo: 116, root: 53, scale: 'minor', chords: ['0m', '10M', '8M', '7M'], lead: 'pulse', leadVol: 0.08, density: 0.45, bass: 'square', bassStyle: 'eighth', bassVol: 0.07, drums: 'tick', seed: 121 },
    // ひと息(喫茶・銭湯・眠る)
    rest: { tempo: 60, root: 53, scale: 'lydian', chords: ['0M7', '2M', '0M7', '7M'], lead: 'triangle', leadVol: 0.11, density: 0.28, hold: 8, arp: 'bell', arpStyle: 'slow', arpVol: 0.035, bass: 'sine', bassStyle: 'root', seed: 131 },
    // 商店街・朝市
    shop: { tempo: 104, root: 57, scale: 'mixolydian', chords: ['0M', '10M', '5M', '0M'], lead: 'pluck', leadVol: 0.12, density: 0.52, swing: 0.25, bass: 'triangle', bassStyle: 'walk', drums: 'soft', seed: 141 },
    special: { tempo: 90, root: 55, scale: 'major', chords: ['0M', '9m', '5M', '7M'], lead: 'triangle', leadVol: 0.11, density: 0.4, bass: 'triangle', bassStyle: 'half', drums: 'soft', seed: 145 },
    // もめごと(酔客・年賀状の山)
    battle: { tempo: 148, root: 55, scale: 'mixolydian', chords: ['0M', '10M', '5M', '7M'], lead: 'square', leadVol: 0.09, leadLp: 3200, density: 0.6, bass: 'square', bassStyle: 'eighth', bassVol: 0.08, drums: 'beat', seed: 151 },
    battleDanger: { tempo: 160, root: 53, scale: 'minor', chords: ['0m', '10M', '8M', '7M'], lead: 'square', leadVol: 0.09, leadLp: 3000, density: 0.65, bass: 'square', bassStyle: 'eighth', bassVol: 0.08, drums: 'beat', seed: 152 },
    // 体調が悪い・平常心が尽きた(動揺)
    danger: { tempo: 84, root: 50, scale: 'minor', chords: ['0m', '8M', '0m', '7sus'], lead: 'sine', leadVol: 0.1, density: 0.25, hold: 6, bass: 'sine', bassStyle: 'drone', drums: 'march', pad: 'pad', padVol: 0.025, padLp: 800, seed: 161 },
    madness: { tempo: 96, root: 54, scale: 'whole', chords: ['0aug', '2aug', '4aug', '2aug'], lead: 'fm', ratio: 3, index: 4, vib: 3, leadVol: 0.1, density: 0.45, echo: true, bass: 'sine', bassStyle: 'drone', seed: 171 },
    // 章の終わり(汽笛の気配)
    chapterEnd: { tempo: 60, root: 53, scale: 'major', chords: ['0M7', '5M7', '2m7', '7sus'], lead: 'sine', leadVol: 0.12, density: 0.26, hold: 8, echo: true, pad: true, padVol: 0.035, bass: 'sine', bassStyle: 'drone', seed: 181 },
    // 忘れ物の棚
    remains: { tempo: 58, root: 52, scale: 'major', chords: ['0M7', '9m7', '5M7', '7sus'], lead: 'bell', leadVol: 0.12, density: 0.3, hold: 8, echo: true, pad: true, padVol: 0.03, seed: 191 },
    // NAGI-NET(パソコン通信)
    terminal: { tempo: 116, root: 60, scale: 'penta', chords: ['0M', '5M', '9m', '7M'], lead: 'square', leadLp: 2600, leadVol: 0.06, density: 0.45, arp: 'pulse', arpStyle: 'fast', arpVol: 0.03, drums: 'tick', bass: 'none', seed: 201 },
    // 結末
    ending: { tempo: 76, root: 53, scale: 'major', chords: ['0M7', '9m7', '2m7', '77'], lead: 'triangle', leadVol: 0.13, density: 0.4, hold: 6, arp: 'bell', arpStyle: 'slow', arpVol: 0.04, bass: 'triangle', bassStyle: 'walk', pad: true, padVol: 0.03, seed: 211 },
    endingTrue: { tempo: 86, root: 55, scale: 'major', chords: ['0add9', '7M', '9m7', '5M7'], lead: 'bell', leadVol: 0.14, density: 0.45, echo: true, arp: 'triangle', arpStyle: 'normal', arpVol: 0.04, bass: 'triangle', bassStyle: 'walk', pad: true, padVol: 0.03, drums: 'bells', seed: 221 },
    endingSad: { tempo: 58, root: 50, scale: 'minor', chords: ['0m7', '10M', '8M7', '7sus'], lead: 'sine', leadVol: 0.12, density: 0.28, hold: 8, echo: true, pad: true, padVol: 0.03, bass: 'sine', bassStyle: 'drone', seed: 229 },
  },
  // イベントの id から相手の曲を選ぶ(上から順に)
  eventScenes: [
    { match: 'clash|rumor', scene: 'clash' },
    { match: 'leave|broken|hurt|late', scene: 'omen' },
    { match: 'togo', scene: 'togo' },
    { match: 'suzu', scene: 'suzu' },
    { match: 'ruka', scene: 'ruka' },
    { match: 'nagi|c_cafe', scene: 'nagi' },
    { match: 'c_tami', scene: 'tami' },
  ],
  scenes: {
    treasure: 'special', puzzle: null,
    'ev:c_bbs': 'terminal', 'ev:f3_bbs_log': 'terminal', 'ev:f2_market': 'shop', 'ev:f4_xmas_market': 'floor4',
    'ev:f5_joya': 'chapterEnd', 'ev:f5_east': 'nagi', 'ev:f5_test_whistle': 'chapterEnd',
    'ending:true': 'endingTrue', 'ending:nagi': 'nagi',
    'ending:togo_true': 'togo', 'ending:togo': 'togo', 'ending:suzu_true': 'suzu', 'ending:suzu': 'suzu', 'ending:ruka_true': 'ruka', 'ending:ruka': 'ruka',
    'ending:shut_togo': 'endingSad', 'ending:shut_suzu': 'endingSad', 'ending:shut_ruka': 'endingSad', 'ending:alone': 'endingSad',
  },
  jingles: {
    // BAD END: 除夜の汽笛(長く、短く、長く)
    death: { tempo: 60, wave: 'sine', bass: true, notes: [[55, 2], [55, 0.5], [null, 0.25], [55, 2.5]] },
  },
};
