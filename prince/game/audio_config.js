/* BGM と効果音(場所ごとの曲、結末の種類ごとの曲、場面に入ったときの効果音)。曲は自動作曲(seedが同じなら毎回同じ曲)。 */
window.GAME.audio = {
  cover: "cover",
  zoneTheme: { home: "home", trip: "trip", earth: "earth", night: "night" },
  kindTheme: { true: "true", happy: "happy", normal: "normal", bad: "bad", loop: "loop", stuck: "stuck" },
  enterSfx: {
    birds: "glow", space: "glow", desert: "grow", snake: "tick", sunset: "glow", lamp: "pop", vain: "pop",
    business: "tick", fox: "hop", secret: "glow", rail: "tick", pilot: "clink", well: "splash", mountain: "pop"
  },
  themes: {
    cover: { root: 62, scale: "lydian", bpm: 70, meter: 3, inst: "musicbox", lead: "bell", bass: true, pad: true, density: 0.5, chords: [0, 3, 4, 0, 5, 3, 1, 0], seed: 101 },
    home:  { root: 64, scale: "major", bpm: 80, meter: 3, inst: "musicbox", lead: "flute", bass: true, pad: false, density: 0.5, chords: [0, 3, 4, 0], seed: 103 },
    trip:  { root: 59, scale: "whole", bpm: 68, meter: 4, inst: "bell", lead: "musicbox", bass: false, pad: true, density: 0.45, chords: [0, 1, 2, 1], seed: 107 },
    earth: { root: 57, scale: "dorian", bpm: 76, meter: 4, inst: "harp", lead: "flute", bass: true, pad: true, density: 0.45, chords: [0, 3, 6, 4], seed: 109 },
    night: { root: 55, scale: "lydian", bpm: 60, meter: 3, inst: "harp", lead: "bell", bass: false, pad: true, density: 0.35, chords: [0, 4, 3, 0], seed: 113 },
    true:  { root: 62, scale: "lydian", bpm: 66, meter: 3, inst: "piano", lead: "bell", bass: true, pad: true, density: 0.5, chords: [0, 3, 4, 0, 5, 3, 4, 0], seed: 127 },
    happy: { root: 60, scale: "major", bpm: 96, meter: 4, inst: "musicbox", lead: "harp", bass: true, pad: false, density: 0.6, chords: [0, 4, 5, 3], seed: 131 },
    normal:{ root: 62, scale: "penta", bpm: 74, meter: 4, inst: "harp", lead: "flute", bass: false, pad: true, density: 0.4, chords: [0, 2, 0, 3], seed: 137 },
    bad:   { root: 52, scale: "phrygian", bpm: 54, meter: 4, inst: "piano", lead: "bell", bass: false, pad: true, density: 0.25, chords: [0, 1, 0, 3], seed: 139 },
    loop:  { root: 57, scale: "whole", bpm: 84, meter: 4, inst: "musicbox", lead: null, bass: false, pad: true, density: 0.7, chords: [0], seed: 149 },
    stuck: { root: 48, scale: "minor", bpm: 48, meter: 4, inst: "bell", lead: "bell", bass: false, pad: true, density: 0.2, chords: [0, 0, 1, 0], arp: false, seed: 151 }
  }
};
