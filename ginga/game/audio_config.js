/* BGM と効果音。すきとおった、夜の音。曲は自動作曲(seedが同じなら毎回同じ曲)。 */
window.GAME.audio = {
  cover: "cover",
  zoneTheme: { machi: "machi", ginga: "ginga", minami: "minami", yoru: "yoru" },
  kindTheme: { true: "true", happy: "happy", normal: "normal", bad: "bad", loop: "loop", stuck: "stuck" },
  enterSfx: {
    print: "tick", dairy: "pop", street: "glow", bridge: "splash", hill: "glow", train: "tick", window: "glow",
    swan: "glow", pliocene: "clink", birdcatcher: "pop", observatory: "glow", conductor: "tick", sasori: "glow",
    cross: "glow", coalsack: "wilt", wake: "pop", riverbank: "splash"
  },
  themes: {
    cover:  { root: 62, scale: "lydian", bpm: 66, meter: 3, inst: "musicbox", lead: "bell", bass: true, pad: true, density: 0.45, chords: [0, 3, 4, 0, 5, 3, 1, 0], seed: 301 },
    machi:  { root: 60, scale: "major", bpm: 80, meter: 4, inst: "piano", lead: "flute", bass: true, pad: false, density: 0.45, chords: [0, 5, 3, 4], seed: 303 },
    ginga:  { root: 62, scale: "lydian", bpm: 72, meter: 3, inst: "musicbox", lead: "bell", bass: true, pad: true, density: 0.5, chords: [0, 1, 4, 0], seed: 307 },
    minami: { root: 57, scale: "dorian", bpm: 64, meter: 4, inst: "harp", lead: "flute", bass: false, pad: true, density: 0.4, chords: [0, 3, 6, 4], seed: 311 },
    yoru:   { root: 55, scale: "minor", bpm: 70, meter: 4, inst: "piano", lead: "bell", bass: true, pad: true, density: 0.35, chords: [0, 5, 3, 4], seed: 313 },
    true:   { root: 62, scale: "lydian", bpm: 62, meter: 3, inst: "piano", lead: "bell", bass: true, pad: true, density: 0.5, chords: [0, 3, 4, 0, 5, 3, 4, 0], seed: 317 },
    happy:  { root: 60, scale: "major", bpm: 92, meter: 4, inst: "musicbox", lead: "harp", bass: true, pad: false, density: 0.55, chords: [0, 4, 5, 3], seed: 331 },
    normal: { root: 62, scale: "penta", bpm: 72, meter: 4, inst: "harp", lead: "flute", bass: false, pad: true, density: 0.4, chords: [0, 2, 0, 3], seed: 337 },
    bad:    { root: 52, scale: "phrygian", bpm: 54, meter: 4, inst: "piano", lead: "bell", bass: false, pad: true, density: 0.25, chords: [0, 1, 0, 3], seed: 347 },
    loop:   { root: 57, scale: "whole", bpm: 84, meter: 4, inst: "musicbox", lead: null, bass: false, pad: true, density: 0.7, chords: [0], seed: 349 },
    stuck:  { root: 48, scale: "minor", bpm: 48, meter: 4, inst: "bell", lead: "bell", bass: false, pad: true, density: 0.2, chords: [0, 0, 1, 0], arp: false, seed: 353 }
  }
};
