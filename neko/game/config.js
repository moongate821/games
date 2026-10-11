/* ゲームの設定(題名・持ち物・場所・結末の種類)。物語本文は story_*.js。 */
window.GAME = {
  id: "neko40",
  title: "ねこのレストランと満月オムライス",
  eyebrow: "【作成中】 AN INTERACTIVE PICTURE BOOK",
  subtitle: "子ねこのコックと、ふしぎなお客の、切り絵の絵本ゲーム",
  credit: "書き下ろしの物語",
  start: "open",
  items: {
    egg: { name: "虹色たまご", prop: "egg", desc: "コッコさんが、ごきげんな日にだけ、うむ。から に、七つの色の、しま。" },
    salt: { name: "星くずの塩", prop: "salt", desc: "夜の潮だまりで、カニのじいさんがつくる塩。びんのなかで、ちかちか光る。" },
    herb: { name: "月見ハーブ", prop: "herb", desc: "月見の森の、たぬきの番人から、わけてもらった。葉っぱの先が、三日月の形。" }
  },
  zones: {
    mise: { hue: 30, name: "しっぽ亭", color: "#d0772e", kicker: "THE RESTAURANT" },
    ichiba: { hue: 200, name: "港町", color: "#3a8ad0", kicker: "THE HARBOR TOWN" },
    mori: { hue: 120, name: "月見の森", color: "#4a8a4a", kicker: "THE MOON-VIEWING WOOD" },
    yoru: { hue: 280, name: "満月の夜", color: "#7a5aa8", kicker: "THE FULL-MOON NIGHT" }
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
