/* BGM と効果音。雨の夜から、やわらかな音楽室へ。曲は自動作曲(seedが同じなら毎回同じ曲)。 */
window.GAME.audio = {
  cover: "cover",
  zoneTheme: { ame: "ame", kou: "kou", dai: "dai", oto: "oto" },
  kindTheme: { true: "true", happy: "happy", normal: "normal", bad: "bad", loop: "loop", stuck: "stuck" },
  enterSfx: { rain: "tick", classroom: "pop", town: "pop", shop: "pop", music: "glow", clinic: "tick", fireworks: "glow", campus: "pop", dorm: "tick", meeting: "tick", eve: "glow", finale: "glow" },
  themes: {
    cover:   { root: 62, scale: "lydian", bpm: 64, meter: 3, inst: "piano", lead: "bell", bass: false, pad: true, density: 0.45, chords: [0, 3, 4, 0, 5, 3, 1, 0], seed: 2001 },
    ame:     { root: 57, scale: "minor", bpm: 62, meter: 4, inst: "piano", lead: "bell", bass: false, pad: true, density: 0.3, chords: [0, 5, 3, 4], seed: 2003 },
    kou:     { root: 62, scale: "major", bpm: 88, meter: 4, inst: "musicbox", lead: "flute", bass: true, pad: false, density: 0.5, chords: [0, 4, 5, 3], seed: 2007 },
    dai:     { root: 60, scale: "dorian", bpm: 78, meter: 4, inst: "harp", lead: "flute", bass: true, pad: true, density: 0.45, chords: [0, 3, 6, 4], seed: 2009 },
    oto:     { root: 64, scale: "penta", bpm: 66, meter: 3, inst: "piano", lead: "musicbox", bass: false, pad: true, density: 0.4, chords: [0, 2, 3, 0], seed: 2011 },
    true:    { root: 62, scale: "lydian", bpm: 66, meter: 3, inst: "piano", lead: "bell", bass: true, pad: true, density: 0.55, chords: [0, 3, 4, 0, 5, 3, 4, 0], seed: 2017 },
    happy:   { root: 65, scale: "major", bpm: 94, meter: 4, inst: "musicbox", lead: "harp", bass: true, pad: false, density: 0.55, chords: [0, 4, 5, 3], seed: 2019 },
    normal:  { root: 60, scale: "penta", bpm: 72, meter: 4, inst: "harp", lead: "flute", bass: false, pad: true, density: 0.4, chords: [0, 2, 0, 3], seed: 2031 },
    bad:     { root: 52, scale: "minor", bpm: 58, meter: 4, inst: "piano", lead: "bell", bass: false, pad: true, density: 0.25, chords: [0, 1, 0, 3], seed: 2041 },
    loop:    { root: 57, scale: "whole", bpm: 84, meter: 4, inst: "musicbox", lead: null, bass: false, pad: true, density: 0.7, chords: [0], seed: 2043 },
    stuck:   { root: 48, scale: "minor", bpm: 48, meter: 4, inst: "bell", lead: "bell", bass: false, pad: true, density: 0.2, chords: [0, 0, 1, 0], arp: false, seed: 2047 }
  }
};
