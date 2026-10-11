/* BGM と効果音の設定(場所ごとの曲、結末の種類ごとの曲、場面に入ったときの効果音)。
 * 曲は自動作曲(seedが同じなら毎回同じ曲)。root=基準の音(MIDI)、scale=音階、bpm=速さ、meter=拍子(3=ワルツ)。 */
window.ALICE_GAME.audio = {
  cover: "cover",
  zoneTheme: {
    river: "river", hole: "hole", hall: "hall", pool: "pool", forest: "forest", house: "house",
    mush: "mush", duchess: "duchess", tea: "tea", garden: "garden", court: "court"
  },
  kindTheme: { true: "true", happy: "happy", normal: "normal", bad: "bad", loop: "loop", stuck: "stuck" },
  enterSfx: {
    fall: "shrink", shrunk: "shrink", giant: "grow", giant_alice: "grow", pigeon: "grow",
    tears: "splash", swim: "splash", mouse: "pop", mushroom: "pop", caucus: "hop", rabbit_house: "hop",
    cheshire: "meow", duchess: "sneeze", tea: "clink", teapot: "clink", hatter_time: "tick"
  },
  themes: {
    cover:   { root: 60, scale: "major",  bpm: 72,  meter: 3, inst: "musicbox", lead: "harp",   bass: true, pad: false, density: 0.55, chords: [0, 3, 4, 0, 5, 3, 4, 0], seed: 7 },
    river:   { root: 62, scale: "major",  bpm: 84,  meter: 3, inst: "harp",     lead: "flute",  bass: true, pad: false, density: 0.5,  chords: [0, 4, 5, 3], seed: 11 },
    hole:    { root: 57, scale: "whole",  bpm: 66,  meter: 4, inst: "musicbox", lead: "bell",   bass: false, pad: true, density: 0.5,  chords: [0, 1, 2, 3], seed: 5 },
    hall:    { root: 57, scale: "dorian", bpm: 92,  meter: 3, inst: "musicbox", lead: "piano",  bass: true, pad: true,  density: 0.45, chords: [0, 6, 3, 4], seed: 9 },
    pool:    { root: 59, scale: "lydian", bpm: 64,  meter: 4, inst: "harp",     lead: "flute",  bass: false, pad: true, density: 0.4,  chords: [0, 1, 0, 4], seed: 3 },
    forest:  { root: 60, scale: "penta",  bpm: 92,  meter: 4, inst: "harp",     lead: "flute",  bass: true, pad: false, density: 0.55, chords: [0, 2, 3, 1], seed: 13 },
    house:   { root: 65, scale: "major",  bpm: 128, meter: 4, inst: "piano",    lead: "musicbox", bass: true, pad: false, density: 0.6, chords: [0, 3, 0, 4], tick: true, seed: 17 },
    mush:    { root: 55, scale: "dorian", bpm: 70,  meter: 3, inst: "harp",     lead: "flute",  bass: false, pad: true, density: 0.45, chords: [0, 2, 0, 6], seed: 19 },
    duchess: { root: 57, scale: "minor",  bpm: 108, meter: 3, inst: "piano",    lead: "brass",  bass: true, pad: false, density: 0.5,  chords: [0, 0, 3, 4], seed: 23 },
    tea:     { root: 62, scale: "major",  bpm: 132, meter: 3, inst: "musicbox", lead: "bell",   bass: true, pad: false, density: 0.6,  chords: [0, 4, 0, 3, 0, 5, 1, 4], tick: true, arpShift: 1, seed: 29 },
    garden:  { root: 60, scale: "major",  bpm: 104, meter: 4, inst: "harp",     lead: "brass",  bass: true, pad: false, density: 0.5,  chords: [0, 3, 4, 0], seed: 31 },
    court:   { root: 52, scale: "minor",  bpm: 88,  meter: 4, inst: "piano",    lead: "brass",  bass: true, pad: true,  density: 0.4,  chords: [0, 0, 5, 4], snare: true, seed: 37 },
    true:    { root: 62, scale: "lydian", bpm: 72,  meter: 4, inst: "piano",    lead: "bell",   bass: true, pad: true,  density: 0.5,  chords: [0, 3, 4, 0, 5, 3, 4, 0], seed: 41 },
    happy:   { root: 60, scale: "major",  bpm: 100, meter: 4, inst: "musicbox", lead: "harp",   bass: true, pad: false, density: 0.6,  chords: [0, 4, 5, 3], seed: 43 },
    normal:  { root: 62, scale: "penta",  bpm: 76,  meter: 4, inst: "harp",     lead: "flute",  bass: false, pad: true, density: 0.4,  chords: [0, 2, 0, 3], seed: 47 },
    bad:     { root: 52, scale: "phrygian", bpm: 56, meter: 4, inst: "piano",   lead: "bell",   bass: false, pad: true, density: 0.25, chords: [0, 1, 0, 3], seed: 53 },
    loop:    { root: 57, scale: "whole",  bpm: 84,  meter: 4, inst: "musicbox", lead: null,     bass: false, pad: true, density: 0.7,  chords: [0], seed: 59 },
    stuck:   { root: 48, scale: "minor",  bpm: 48,  meter: 4, inst: "bell",     lead: "bell",   bass: false, pad: true, density: 0.2,  chords: [0, 0, 1, 0], arp: false, seed: 61 }
  }
};
