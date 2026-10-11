/* BGM と効果音。にぎやかな台所、港町、月見の森、満月の夜。曲は自動作曲(seedが同じなら毎回同じ曲)。 */
window.GAME.audio = {
  cover: "cover",
  zoneTheme: { mise: "mise", ichiba: "ichiba", mori: "mori", yoru: "yoru" },
  kindTheme: { true: "true", happy: "happy", normal: "normal", bad: "bad", loop: "loop", stuck: "stuck" },
  enterSfx: {
    open: "pop", kitchen: "clink", street: "pop", fishshop: "splash", farm: "pop", sea: "splash", forest: "glow",
    evening: "glow", dragon: "pop", ghost: "glow", alien: "tick", cook: "clink", party: "glow"
  },
  themes: {
    cover:  { root: 60, scale: "major", bpm: 104, meter: 4, inst: "musicbox", lead: "harp", bass: true, pad: false, density: 0.55, chords: [0, 3, 4, 0, 5, 3, 4, 0], seed: 701 },
    mise:   { root: 62, scale: "major", bpm: 112, meter: 4, inst: "piano", lead: "musicbox", bass: true, pad: false, density: 0.55, chords: [0, 4, 5, 3], seed: 703 },
    ichiba: { root: 65, scale: "mixolydian", bpm: 120, meter: 4, inst: "harp", lead: "flute", bass: true, pad: false, density: 0.6, chords: [0, 6, 3, 4], seed: 707 },
    mori:   { root: 57, scale: "penta", bpm: 92, meter: 3, inst: "harp", lead: "flute", bass: true, pad: true, density: 0.45, chords: [0, 3, 4, 0], seed: 709 },
    yoru:   { root: 62, scale: "dorian", bpm: 96, meter: 4, inst: "piano", lead: "bell", bass: true, pad: true, density: 0.5, chords: [0, 3, 6, 4], seed: 711 },
    true:   { root: 60, scale: "major", bpm: 100, meter: 4, inst: "piano", lead: "bell", bass: true, pad: true, density: 0.6, chords: [0, 3, 4, 0, 5, 3, 4, 0], seed: 717 },
    happy:  { root: 62, scale: "major", bpm: 116, meter: 4, inst: "musicbox", lead: "harp", bass: true, pad: false, density: 0.6, chords: [0, 4, 5, 3], seed: 719 },
    normal: { root: 60, scale: "penta", bpm: 92, meter: 4, inst: "harp", lead: "flute", bass: false, pad: true, density: 0.45, chords: [0, 2, 0, 3], seed: 731 },
    bad:    { root: 55, scale: "minor", bpm: 100, meter: 4, inst: "musicbox", lead: "bell", bass: true, pad: false, density: 0.45, chords: [0, 5, 3, 4], seed: 741 },
    loop:   { root: 57, scale: "whole", bpm: 120, meter: 4, inst: "musicbox", lead: null, bass: false, pad: true, density: 0.7, chords: [0], seed: 743 },
    stuck:  { root: 52, scale: "minor", bpm: 70, meter: 4, inst: "bell", lead: "bell", bass: false, pad: true, density: 0.3, chords: [0, 0, 1, 0], arp: false, seed: 747 }
  }
};
