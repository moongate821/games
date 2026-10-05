/* BGM と効果音。和風に、五音音階(penta / minpenta)を中心に。曲は自動作曲(seedが同じなら毎回同じ曲)。 */
window.GAME.audio = {
  cover: "cover",
  zoneTheme: { mura: "mura", michi: "michi", umi: "umi", shima: "shima" },
  kindTheme: { true: "true", happy: "happy", normal: "normal", bad: "bad", loop: "loop", stuck: "stuck" },
  enterSfx: {
    river: "splash", house: "pop", kitchen: "pop", dog: "hop", monkey: "pop", pheasant: "glow", inn: "clink",
    forest: "grow", bridge: "tick", port: "splash", sea: "splash", storm: "grow", gate_oni: "tick", cave: "glow",
    hall: "clink", festival: "glow"
  },
  themes: {
    cover: { root: 62, scale: "penta", bpm: 76, meter: 4, inst: "harp", lead: "flute", bass: true, pad: true, density: 0.5, chords: [0, 3, 4, 0, 5, 3, 4, 0], seed: 201 },
    mura:  { root: 62, scale: "penta", bpm: 88, meter: 4, inst: "harp", lead: "flute", bass: true, pad: false, density: 0.55, chords: [0, 3, 4, 0], seed: 203 },
    michi: { root: 64, scale: "penta", bpm: 100, meter: 4, inst: "musicbox", lead: "flute", bass: true, pad: false, density: 0.55, chords: [0, 2, 3, 1], seed: 207 },
    umi:   { root: 57, scale: "minpenta", bpm: 72, meter: 3, inst: "harp", lead: "bell", bass: true, pad: true, density: 0.45, chords: [0, 3, 4, 3], seed: 211 },
    shima: { root: 55, scale: "minpenta", bpm: 92, meter: 4, inst: "piano", lead: "brass", bass: true, pad: true, density: 0.45, chords: [0, 0, 3, 4], snare: true, seed: 213 },
    true:  { root: 62, scale: "penta", bpm: 84, meter: 4, inst: "harp", lead: "bell", bass: true, pad: true, density: 0.55, chords: [0, 3, 4, 0, 5, 3, 4, 0], seed: 227 },
    happy: { root: 60, scale: "penta", bpm: 104, meter: 4, inst: "musicbox", lead: "flute", bass: true, pad: false, density: 0.6, chords: [0, 4, 5, 3], seed: 229 },
    normal:{ root: 62, scale: "penta", bpm: 74, meter: 4, inst: "harp", lead: "flute", bass: false, pad: true, density: 0.4, chords: [0, 2, 0, 3], seed: 233 },
    bad:   { root: 52, scale: "minpenta", bpm: 54, meter: 4, inst: "piano", lead: "bell", bass: false, pad: true, density: 0.25, chords: [0, 1, 0, 3], seed: 239 },
    loop:  { root: 57, scale: "whole", bpm: 84, meter: 4, inst: "musicbox", lead: null, bass: false, pad: true, density: 0.7, chords: [0], seed: 241 },
    stuck: { root: 48, scale: "minor", bpm: 48, meter: 4, inst: "bell", lead: "bell", bass: false, pad: true, density: 0.2, chords: [0, 0, 1, 0], arp: false, seed: 251 }
  }
};
