/* BGM と効果音。夏休みのうらにわ、空、しんとした宇宙、月。曲は自動作曲(seedが同じなら毎回同じ曲)。 */
window.GAME.audio = {
  cover: "cover",
  zoneTheme: { niwa: "niwa", sora: "sora", uchu: "uchu", tsuki: "tsuki" },
  kindTheme: { true: "true", happy: "happy", normal: "normal", bad: "bad", loop: "loop", stuck: "stuck" },
  enterSfx: {
    yard: "pop", kitchen: "clink", attic: "tick", hill: "glow", launch: "splash", sky: "glow", space: "glow",
    station: "tick", candy: "pop", moon: "glow", rabbit: "glow"
  },
  themes: {
    cover:  { root: 62, scale: "major", bpm: 108, meter: 4, inst: "musicbox", lead: "bell", bass: true, pad: false, density: 0.55, chords: [0, 4, 5, 3, 0, 4, 3, 4], seed: 801 },
    niwa:   { root: 64, scale: "major", bpm: 116, meter: 4, inst: "piano", lead: "flute", bass: true, pad: false, density: 0.55, chords: [0, 3, 4, 0], seed: 803 },
    sora:   { root: 62, scale: "lydian", bpm: 100, meter: 4, inst: "harp", lead: "flute", bass: true, pad: true, density: 0.5, chords: [0, 1, 4, 0], seed: 807 },
    uchu:   { root: 57, scale: "whole", bpm: 72, meter: 4, inst: "bell", lead: "musicbox", bass: false, pad: true, density: 0.35, chords: [0, 2, 0, 4], seed: 809 },
    tsuki:  { root: 60, scale: "penta", bpm: 84, meter: 3, inst: "musicbox", lead: "bell", bass: true, pad: true, density: 0.45, chords: [0, 3, 4, 0], seed: 811 },
    true:   { root: 62, scale: "major", bpm: 96, meter: 3, inst: "piano", lead: "bell", bass: true, pad: true, density: 0.55, chords: [0, 3, 4, 0, 5, 3, 4, 0], seed: 817 },
    happy:  { root: 64, scale: "major", bpm: 118, meter: 4, inst: "musicbox", lead: "harp", bass: true, pad: false, density: 0.6, chords: [0, 4, 5, 3], seed: 819 },
    normal: { root: 60, scale: "penta", bpm: 92, meter: 4, inst: "harp", lead: "flute", bass: false, pad: true, density: 0.45, chords: [0, 2, 0, 3], seed: 831 },
    bad:    { root: 55, scale: "minor", bpm: 100, meter: 4, inst: "musicbox", lead: "bell", bass: true, pad: false, density: 0.45, chords: [0, 5, 3, 4], seed: 841 },
    loop:   { root: 57, scale: "whole", bpm: 120, meter: 4, inst: "musicbox", lead: null, bass: false, pad: true, density: 0.7, chords: [0], seed: 843 },
    stuck:  { root: 52, scale: "minor", bpm: 70, meter: 4, inst: "bell", lead: "bell", bass: false, pad: true, density: 0.3, chords: [0, 0, 1, 0], arp: false, seed: 847 }
  }
};
