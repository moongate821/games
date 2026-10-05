/* ゲームの設定(題名・持ち物・場所・結末の種類)。物語本文は story_*.js。 */
window.GAME = {
  id: "prince40",
  title: "王子さまと四十の夕日",
  eyebrow: "AN INTERACTIVE PICTURE BOOK",
  subtitle: "四十の夕日をさがす、星めぐりの絵本ゲーム",
  credit: "原案: サン＝テグジュペリ『星の王子さま』(1943)",
  start: "planet",
  items: {
    bird_string: { name: "わたり鳥の糸", prop: "bird_string", desc: "鳥たちの群れにつながる、細い糸。星から星へ、旅ができる。" },
    letter: { name: "大使の任命状", prop: "letter", desc: "王さまがくれた紙。「どこへでも行ってよい」と書いてある。" },
    wheat: { name: "麦の穂", prop: "wheat", desc: "キツネがくれた。金色は、きみの髪の色。" },
    sheep_box: { name: "羊の入った箱", prop: "sheep_box", desc: "穴が三つ。なかで、羊がねむっている。" },
    muzzle: { name: "羊の口輪", prop: "muzzle", desc: "羊がバラを食べないように。革ひもがついている。" },
    water: { name: "井戸の水", prop: "bucket", desc: "ふたりで汲んだ水。歌うような味がした。" }
  },
  zones: {
    home: { hue: 30, name: "わが星", color: "#c98a3a", kicker: "ASTEROID B-612" },
    trip: { hue: 240, name: "星めぐり", color: "#5a5ab0", kicker: "AMONG THE STARS" },
    earth: { hue: 45, name: "地球", color: "#c8a03a", kicker: "THE EARTH" },
    night: { hue: 220, name: "砂漠の夜", color: "#3a5a9a", kicker: "THE DESERT NIGHT" }
  },
  endingKinds: {
    true: { name: "トゥルーエンド", color: "#c79a1b" },
    happy: { name: "ハッピーエンド", color: "#e0703f" },
    normal: { name: "ふつうの結末", color: "#6a8f6a" },
    bad: { name: "バッドエンド", color: "#7a4a8a" },
    loop: { name: "ふしぎ・ループ", color: "#3f7fa8" },
    stuck: { name: "進めない", color: "#7a7a7a" }
  },
  scenes: {}
};
