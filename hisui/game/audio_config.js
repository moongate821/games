/* BGM と効果音。静かな和の音階から、桜の夜明けへ。曲は自動作曲(seedが同じなら毎回同じ曲)。 */
window.GAME.audio = {
  cover: "cover",
  zoneTheme: { gendai: "gendai", tenkei: "tenkei", tabi: "tabi", sakura: "sakura" },
  kindTheme: { true: "true", happy: "happy", normal: "normal", bad: "bad", loop: "loop", stuck: "stuck" },
  enterSfx: { funeral: "tick", study: "glow", school: "pop", cherry: "glow", village: "pop", hermitage: "splash", shrine: "glow", sato: "tick", mirror: "glow", library: "tick", canyon: "tick", origin: "glow" },
  themes: {
    cover:    { root: 62, scale: "penta", bpm: 60, meter: 4, inst: "harp", lead: "flute", bass: false, pad: true, density: 0.4, chords: [0, 3, 4, 0], seed: 901 },
    gendai:   { root: 57, scale: "minor", bpm: 62, meter: 4, inst: "piano", lead: "bell", bass: false, pad: true, density: 0.35, chords: [0, 5, 3, 4], seed: 903 },
    tenkei:   { root: 62, scale: "penta", bpm: 76, meter: 4, inst: "harp", lead: "flute", bass: true, pad: false, density: 0.5, chords: [0, 3, 4, 0], seed: 907 },
    tabi:     { root: 59, scale: "dorian", bpm: 68, meter: 4, inst: "harp", lead: "bell", bass: true, pad: true, density: 0.42, chords: [0, 2, 3, 4], seed: 909 },
    sakura:   { root: 64, scale: "lydian", bpm: 66, meter: 3, inst: "musicbox", lead: "bell", bass: true, pad: true, density: 0.5, chords: [0, 1, 4, 0], seed: 911 },
    true:     { root: 62, scale: "lydian", bpm: 70, meter: 3, inst: "piano", lead: "bell", bass: true, pad: true, density: 0.55, chords: [0, 3, 4, 0, 5, 3, 4, 0], seed: 917 },
    happy:    { root: 64, scale: "major", bpm: 92, meter: 4, inst: "harp", lead: "flute", bass: true, pad: false, density: 0.55, chords: [0, 4, 5, 3], seed: 919 },
    normal:   { root: 60, scale: "penta", bpm: 72, meter: 4, inst: "harp", lead: "flute", bass: false, pad: true, density: 0.4, chords: [0, 2, 0, 3], seed: 931 },
    bad:      { root: 52, scale: "phrygian", bpm: 56, meter: 4, inst: "piano", lead: "bell", bass: false, pad: true, density: 0.25, chords: [0, 1, 0, 3], seed: 941 },
    loop:     { root: 57, scale: "whole", bpm: 84, meter: 4, inst: "musicbox", lead: null, bass: false, pad: true, density: 0.7, chords: [0], seed: 943 },
    stuck:    { root: 48, scale: "minor", bpm: 48, meter: 4, inst: "bell", lead: "bell", bass: false, pad: true, density: 0.2, chords: [0, 0, 1, 0], arp: false, seed: 947 }
  }
};
