/* ゲームの設定(題名・持ち物・場所・結末の種類)。物語本文は story_*.js。 */
window.GAME = {
  id: "yuki40",
  title: "ユキと春の足あと",
  eyebrow: "【作成中】 AN INTERACTIVE PICTURE BOOK",
  subtitle: "春にとけてしまう、雪の子の、絵本ゲーム",
  credit: "書き下ろしの物語",
  start: "birth",
  items: {
    mitten: { name: "ソラの赤い手袋", prop: "mitten", desc: "ソラが、窓のすきまから、わたしてくれた。ユキには、すこし、大きい。" },
    bell: { name: "氷の鈴", prop: "bell", desc: "氷の湖でみつけた、すきとおった鈴。りん、と、冬の音がする。" },
    bulb: { name: "スノードロップの球根", prop: "bulb", desc: "雪の下で、春を待つ花の、たまご。" }
  },
  zones: {
    yuki: { hue: 210, name: "初雪", color: "#5a8ac8", kicker: "THE FIRST SNOW" },
    mori: { hue: 160, name: "冬の森", color: "#3a8a7a", kicker: "THE WINTER WOOD" },
    haru: { hue: 100, name: "春の気配", color: "#7aa85a", kicker: "THE THAW" },
    yakusoku: { hue: 330, name: "約束", color: "#c86a8a", kicker: "THE PROMISE" }
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
