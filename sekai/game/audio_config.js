/* BGM と効果音。やわらかな村の曲から、白い境界、星の海へ。曲は自動作曲(seedが同じなら毎回同じ曲)。 */
window.GAME.audio = {
  cover: "cover",
  zoneTheme: { mura: "mura", tabi: "tabi", kyokai: "kyokai", seikai: "seikai" },
  kindTheme: { true: "true", happy: "happy", normal: "normal", bad: "bad", loop: "loop", stuck: "stuck" },
  enterSfx: { hill: "glow", loss: "tick", town: "pop", ruins: "tick", mountain: "splash", obs2: "glow", obs3: "tick", kyokai: "glow", tree: "glow", spring: "pop", starsea: "glow", ring: "glow" },
  themes: {
    cover:   { root: 64, scale: "lydian", bpm: 64, meter: 3, inst: "musicbox", lead: "bell", bass: false, pad: true, density: 0.45, chords: [0, 3, 4, 0, 5, 3, 1, 0], seed: 1001 },
    mura:    { root: 62, scale: "major", bpm: 80, meter: 4, inst: "harp", lead: "flute", bass: true, pad: false, density: 0.45, chords: [0, 4, 5, 3], seed: 1003 },
    tabi:    { root: 57, scale: "dorian", bpm: 72, meter: 4, inst: "piano", lead: "flute", bass: true, pad: true, density: 0.4, chords: [0, 3, 6, 4], seed: 1007 },
    kyokai:  { root: 60, scale: "lydian", bpm: 60, meter: 3, inst: "musicbox", lead: "bell", bass: false, pad: true, density: 0.4, chords: [0, 1, 4, 0], seed: 1009 },
    seikai:  { root: 59, scale: "whole", bpm: 70, meter: 4, inst: "bell", lead: "musicbox", bass: false, pad: true, density: 0.4, chords: [0, 2, 0, 4], seed: 1011 },
    true:    { root: 62, scale: "lydian", bpm: 66, meter: 3, inst: "piano", lead: "bell", bass: true, pad: true, density: 0.55, chords: [0, 3, 4, 0, 5, 3, 4, 0], seed: 1017 },
    happy:   { root: 64, scale: "major", bpm: 94, meter: 4, inst: "musicbox", lead: "harp", bass: true, pad: false, density: 0.55, chords: [0, 4, 5, 3], seed: 1019 },
    normal:  { root: 60, scale: "penta", bpm: 72, meter: 4, inst: "harp", lead: "flute", bass: false, pad: true, density: 0.4, chords: [0, 2, 0, 3], seed: 1031 },
    bad:     { root: 52, scale: "minor", bpm: 60, meter: 4, inst: "piano", lead: "bell", bass: false, pad: true, density: 0.25, chords: [0, 1, 0, 3], seed: 1041 },
    loop:    { root: 57, scale: "whole", bpm: 84, meter: 4, inst: "musicbox", lead: null, bass: false, pad: true, density: 0.7, chords: [0], seed: 1043 },
    stuck:   { root: 48, scale: "minor", bpm: 48, meter: 4, inst: "bell", lead: "bell", bass: false, pad: true, density: 0.2, chords: [0, 0, 1, 0], arp: false, seed: 1047 }
  }
};
