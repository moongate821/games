/* ゲームの設定(題名・持ち物・場所・結末の種類)。物語本文は story_*.js。 */
window.GAME = {
  id: "mimi40",
  title: "ミミと四十の帰り道",
  eyebrow: "【作成中】 AN INTERACTIVE PICTURE BOOK",
  subtitle: "おいていかれた、ぬいぐるみの、帰り道の絵本ゲーム",
  credit: "書き下ろしの物語",
  start: "closet",
  items: {
    ribbon: { name: "ハナの赤いリボン", prop: "ribbon", desc: "ハナが、いつも、髪にむすんでいたリボン。" },
    address: { name: "段ボールの切れはし", prop: "address", desc: "ハナのお母さんの字で、新しい家の住所が書いてある。" },
    umbrella: { name: "小さな傘", prop: "umbrella", desc: "だれかの、わすれもの。ミミには、ちょうどいい大きさ。" },
    key: { name: "ぜんまい鍵", prop: "key", desc: "ツギハギさんの店の、引き出しの奥にあった、小さな鍵。" }
  },
  zones: {
    ie: { hue: 20, name: "空き家", color: "#b07a5a", kicker: "THE EMPTY HOUSE" },
    machi: { hue: 200, name: "町はずれ", color: "#5a7a9a", kicker: "THE EDGE OF TOWN" },
    kawa: { hue: 230, name: "川", color: "#3a5aa0", kicker: "THE RIVER" },
    shin: { hue: 340, name: "新しい町", color: "#c8607a", kicker: "THE NEW TOWN" }
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
