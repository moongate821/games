/* BGM と効果音。すこしさびしく、やさしい音。曲は自動作曲(seedが同じなら毎回同じ曲)。 */
window.GAME.audio = {
  cover: "cover",
  zoneTheme: { todai: "todai", minato: "minato", umi: "umi", oka: "oka" },
  kindTheme: { true: "true", happy: "happy", normal: "normal", bad: "bad", loop: "loop", stuck: "stuck" },
  enterSfx: {
    storm: "splash", stairs: "tick", shore: "splash", crab: "pop", cliff: "glow", harbor: "pop", market: "clink",
    cat: "meow", oilshop: "clink", pier: "splash", fog: "glow", ship: "tick", bell: "glow", seals: "pop",
    capes: "glow", window: "glow", truth: "glow"
  },
  themes: {
    cover:  { root: 62, scale: "lydian", bpm: 66, meter: 3, inst: "musicbox", lead: "bell", bass: true, pad: true, density: 0.45, chords: [0, 3, 4, 0, 5, 3, 1, 0], seed: 401 },
    todai:  { root: 60, scale: "dorian", bpm: 64, meter: 3, inst: "harp", lead: "flute", bass: true, pad: true, density: 0.4, chords: [0, 3, 4, 0], seed: 403 },
    minato: { root: 62, scale: "major", bpm: 88, meter: 4, inst: "musicbox", lead: "flute", bass: true, pad: false, density: 0.55, chords: [0, 4, 5, 3], seed: 407 },
    umi:    { root: 57, scale: "lydian", bpm: 60, meter: 3, inst: "harp", lead: "bell", bass: false, pad: true, density: 0.4, chords: [0, 1, 4, 0], seed: 409 },
    oka:    { root: 55, scale: "minor", bpm: 66, meter: 4, inst: "piano", lead: "bell", bass: true, pad: true, density: 0.35, chords: [0, 5, 3, 4], seed: 419 },
    true:   { root: 62, scale: "lydian", bpm: 64, meter: 3, inst: "piano", lead: "bell", bass: true, pad: true, density: 0.5, chords: [0, 3, 4, 0, 5, 3, 4, 0], seed: 421 },
    happy:  { root: 60, scale: "major", bpm: 92, meter: 4, inst: "musicbox", lead: "harp", bass: true, pad: false, density: 0.55, chords: [0, 4, 5, 3], seed: 431 },
    normal: { root: 62, scale: "penta", bpm: 72, meter: 4, inst: "harp", lead: "flute", bass: false, pad: true, density: 0.4, chords: [0, 2, 0, 3], seed: 433 },
    bad:    { root: 52, scale: "phrygian", bpm: 54, meter: 4, inst: "piano", lead: "bell", bass: false, pad: true, density: 0.25, chords: [0, 1, 0, 3], seed: 439 },
    loop:   { root: 57, scale: "whole", bpm: 84, meter: 4, inst: "musicbox", lead: null, bass: false, pad: true, density: 0.7, chords: [0], seed: 443 },
    stuck:  { root: 48, scale: "minor", bpm: 48, meter: 4, inst: "bell", lead: "bell", bass: false, pad: true, density: 0.2, chords: [0, 0, 1, 0], arp: false, seed: 449 }
  }
};
