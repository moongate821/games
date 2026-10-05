/* ゲームの設定(題名・持ち物・場所・結末の種類)。物語本文は story_*.js。原作: 小説『君に逢うために』 */
window.GAME = {
  id: "kimi",
  title: "君に逢うために",
  eyebrow: "【作成中】 AN INTERACTIVE PICTURE BOOK",
  subtitle: "雨の夜の祈りから、もう一度。淡い光の絵本ゲーム",
  credit: "原作 小説『君に逢うために』",
  start: "rain",
  items: {
    okusuri: { name: "お薬手帳", prop: "okusuri", desc: "結衣に、必ず持ち歩くと約束させた手帳。小さな防波堤。" },
    usagi: { name: "うさぎのキーホルダー", prop: "usagi", desc: "花火大会の夜、結衣がくれた、安っぽいプラスチックのうさぎ。小学校のハンカチの、あのうさぎと、同じ顔。" },
    glass: { name: "緑のガラスのかけら", prop: "glass", desc: "小学生の頃、川原で拾った、緑のガラスのかけら。母さんの宝箱に、しまってあった。" },
    notebook: { name: "告白ノート", prop: "notebook", desc: "二十ページ。表紙に「遼のこと。」。結衣に、全部を話すために、書いた。" }
  },
  zones: {
    ame: { hue: 240, name: "雨の夜", color: "#4a58a8", kicker: "THE RAIN" },
    kou: { hue: 25, name: "二度目の高校", color: "#e08a5a", kicker: "THE SECOND CHANCE" },
    dai: { hue: 330, name: "大学", color: "#c85a88", kicker: "THE UNIVERSITY" },
    oto: { hue: 215, name: "音楽室", color: "#5a88d8", kicker: "THE MUSIC ROOM" }
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
