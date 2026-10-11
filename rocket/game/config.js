/* ゲームの設定(題名・持ち物・場所・結末の種類)。物語本文は story_*.js。 */
window.GAME = {
  id: "rocket40",
  title: "ダンボールロケットで月まで",
  eyebrow: "【作成中】 AN INTERACTIVE PICTURE BOOK",
  subtitle: "段ボールのロケットで、月まで、ケーキをとどける、工作の絵本ゲーム",
  credit: "書き下ろしの物語",
  start: "yard",
  items: {
    cake: { name: "いちごのケーキ", prop: "cake", desc: "母さんと焼いた。チョコの板に「ルナ」の文字。箱に入れて、テープで、とめてある。" },
    starbit: { name: "流れ星のかけら", prop: "starbit", desc: "夕方の丘で、虫とりあみで、つかまえた。ぽかぽか、あったかい。ハル号の燃料。" },
    map: { name: "星の地図", prop: "map", desc: "じいちゃんの、むかしの地図。月までの道が、えんぴつで、書きこんである。" }
  },
  zones: {
    niwa: { hue: 40, name: "うらにわの基地", color: "#c8803a", kicker: "THE BACKYARD BASE" },
    sora: { hue: 200, name: "空の上", color: "#3a8ad0", kicker: "UP IN THE SKY" },
    uchu: { hue: 250, name: "宇宙", color: "#5a5aa8", kicker: "OUTER SPACE" },
    tsuki: { hue: 50, name: "月", color: "#b8a040", kicker: "THE MOON" }
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
