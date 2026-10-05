/* BGM と効果音。すきとおった冬の音から、春の音へ。曲は自動作曲(seedが同じなら毎回同じ曲)。 */
window.GAME.audio = {
  cover: "cover",
  zoneTheme: { yuki: "yuki", mori: "mori", haru: "haru", yakusoku: "yakusoku" },
  kindTheme: { true: "true", happy: "happy", normal: "normal", bad: "bad", loop: "loop", stuck: "stuck" },
  enterSfx: {
    birth: "glow", window: "tick", garden: "pop", village: "pop", forest: "glow", bear: "pop", lake: "clink",
    owl: "glow", pass: "splash", hut: "tick", thaw: "splash", swallow: "glow", star: "glow", lastnight: "glow", morning: "glow"
  },
  themes: {
    cover:    { root: 64, scale: "lydian", bpm: 64, meter: 3, inst: "musicbox", lead: "bell", bass: false, pad: true, density: 0.45, chords: [0, 3, 4, 0, 5, 3, 1, 0], seed: 601 },
    yuki:     { root: 64, scale: "lydian", bpm: 60, meter: 3, inst: "musicbox", lead: "bell", bass: false, pad: true, density: 0.4, chords: [0, 1, 4, 0], seed: 603 },
    mori:     { root: 57, scale: "dorian", bpm: 70, meter: 4, inst: "harp", lead: "flute", bass: true, pad: true, density: 0.4, chords: [0, 3, 6, 4], seed: 607 },
    haru:     { root: 62, scale: "major", bpm: 78, meter: 4, inst: "harp", lead: "flute", bass: true, pad: false, density: 0.5, chords: [0, 4, 5, 3], seed: 611 },
    yakusoku: { root: 60, scale: "minor", bpm: 60, meter: 3, inst: "piano", lead: "bell", bass: true, pad: true, density: 0.35, chords: [0, 5, 3, 4], seed: 613 },
    true:     { root: 62, scale: "lydian", bpm: 62, meter: 3, inst: "piano", lead: "bell", bass: true, pad: true, density: 0.5, chords: [0, 3, 4, 0, 5, 3, 4, 0], seed: 617 },
    happy:    { root: 60, scale: "major", bpm: 90, meter: 4, inst: "musicbox", lead: "harp", bass: true, pad: false, density: 0.55, chords: [0, 4, 5, 3], seed: 619 },
    normal:   { root: 62, scale: "penta", bpm: 70, meter: 4, inst: "harp", lead: "flute", bass: false, pad: true, density: 0.4, chords: [0, 2, 0, 3], seed: 631 },
    bad:      { root: 52, scale: "phrygian", bpm: 54, meter: 4, inst: "piano", lead: "bell", bass: false, pad: true, density: 0.25, chords: [0, 1, 0, 3], seed: 641 },
    loop:     { root: 57, scale: "whole", bpm: 84, meter: 4, inst: "musicbox", lead: null, bass: false, pad: true, density: 0.7, chords: [0], seed: 643 },
    stuck:    { root: 48, scale: "minor", bpm: 48, meter: 4, inst: "bell", lead: "bell", bass: false, pad: true, density: 0.2, chords: [0, 0, 1, 0], arp: false, seed: 647 }
  }
};
