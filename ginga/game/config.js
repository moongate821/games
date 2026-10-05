/* ゲームの設定(題名・持ち物・場所・結末の種類)。物語本文は story_*.js。 */
window.GAME = {
  id: "ginga40",
  title: "銀河鉄道と四十の切符",
  eyebrow: "AN INTERACTIVE PICTURE BOOK",
  subtitle: "四十の結末をさがす、星めぐりの汽車の絵本ゲーム",
  credit: "原案: 宮沢賢治『銀河鉄道の夜』",
  start: "school",
  items: {
    ticket: { name: "緑の切符", prop: "ticket", desc: "ポケットに入っていた、ふしぎな緑の紙。どこまででも行ける切符らしい。" },
    fossil: { name: "くるみの化石", prop: "fossil", desc: "プリオシン海岸でひろった。百二十万年前の、くるみ。" },
    apple: { name: "燈台守のりんご", prop: "apple", desc: "黄と紅の、きれいなりんご。いい匂いがする。" },
    milk: { name: "牛乳", prop: "milk", desc: "母さんのための、あたたかい牛乳。" }
  },
  zones: {
    machi: { hue: 30, name: "町", color: "#a8703a", kicker: "THE TOWN" },
    ginga: { hue: 230, name: "銀河", color: "#4a5ab0", kicker: "THE MILKY WAY" },
    minami: { hue: 300, name: "南の空", color: "#8a4a9a", kicker: "THE SOUTHERN SKY" },
    yoru: { hue: 210, name: "目ざめの夜", color: "#3a6a9a", kicker: "THE NIGHT OF WAKING" }
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
