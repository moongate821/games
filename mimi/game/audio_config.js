/* BGM と効果音。すこしさびしく、やさしい音。曲は自動作曲(seedが同じなら毎回同じ曲)。 */
window.GAME.audio = {
  cover: "cover",
  zoneTheme: { ie: "ie", machi: "machi", kawa: "kawa", shin: "shin" },
  kindTheme: { true: "true", happy: "happy", normal: "normal", bad: "bad", loop: "loop", stuck: "stuck" },
  enterSfx: {
    room: "pop", door: "tick", rainstreet: "splash", station: "clink", shop: "clink", bird: "tick", alley: "meow",
    crossing: "tick", river: "splash", boat: "splash", newtown: "glow", school: "glow", gate: "glow"
  },
  themes: {
    cover: { root: 62, scale: "major", bpm: 70, meter: 3, inst: "musicbox", lead: "bell", bass: true, pad: true, density: 0.45, chords: [0, 3, 4, 0, 5, 3, 1, 0], seed: 501 },
    ie:    { root: 60, scale: "minor", bpm: 62, meter: 3, inst: "musicbox", lead: "bell", bass: false, pad: true, density: 0.35, chords: [0, 5, 3, 4], seed: 503 },
    machi: { root: 62, scale: "dorian", bpm: 80, meter: 4, inst: "harp", lead: "flute", bass: true, pad: false, density: 0.45, chords: [0, 3, 4, 0], seed: 507 },
    kawa:  { root: 57, scale: "lydian", bpm: 64, meter: 3, inst: "harp", lead: "bell", bass: false, pad: true, density: 0.4, chords: [0, 1, 4, 0], seed: 509 },
    shin:  { root: 64, scale: "major", bpm: 84, meter: 4, inst: "musicbox", lead: "flute", bass: true, pad: true, density: 0.5, chords: [0, 4, 5, 3], seed: 511 },
    true:  { root: 62, scale: "lydian", bpm: 66, meter: 3, inst: "piano", lead: "bell", bass: true, pad: true, density: 0.5, chords: [0, 3, 4, 0, 5, 3, 4, 0], seed: 521 },
    happy: { root: 60, scale: "major", bpm: 92, meter: 4, inst: "musicbox", lead: "harp", bass: true, pad: false, density: 0.55, chords: [0, 4, 5, 3], seed: 523 },
    normal:{ root: 62, scale: "penta", bpm: 72, meter: 4, inst: "harp", lead: "flute", bass: false, pad: true, density: 0.4, chords: [0, 2, 0, 3], seed: 529 },
    bad:   { root: 52, scale: "phrygian", bpm: 54, meter: 4, inst: "piano", lead: "bell", bass: false, pad: true, density: 0.25, chords: [0, 1, 0, 3], seed: 533 },
    loop:  { root: 57, scale: "whole", bpm: 84, meter: 4, inst: "musicbox", lead: null, bass: false, pad: true, density: 0.7, chords: [0], seed: 541 },
    stuck: { root: 48, scale: "minor", bpm: 48, meter: 4, inst: "bell", lead: "bell", bass: false, pad: true, density: 0.2, chords: [0, 0, 1, 0], arp: false, seed: 547 }
  }
};
