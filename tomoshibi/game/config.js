/* ゲームの設定(題名・持ち物・場所・結末の種類)。物語本文は story_*.js。 */
window.GAME = {
  id: "tomoshibi40",
  title: "ともしびと四十の手紙",
  eyebrow: "【作成中】 AN INTERACTIVE PICTURE BOOK",
  subtitle: "ひとりぼっちの灯りが、手紙の主をさがす、絵本ゲーム",
  credit: "書き下ろしの物語",
  start: "lamp",
  items: {
    lantern: { name: "古いランタン", prop: "lantern", desc: "セイジじいさんの、古いランタン。これにうつれば、灯台の外へ出られる。" },
    photo: { name: "古い写真", prop: "photo", desc: "灯台の前に立つ、男の子の写真。裏に、なにか書いてある。" },
    letter: { name: "瓶の手紙", prop: "letter", desc: "「この灯りが見えるあなたへ」。差出人の名は、にじんで読めない。" },
    shell: { name: "巻貝の笛", prop: "shell", desc: "ハサミじいがくれた。ふくと、ほう、と、海の音がする。" },
    fish: { name: "小魚", prop: "fish", desc: "朝市でもらった、銀色の小魚。" },
    oil: { name: "菜種油の小瓶", prop: "oil", desc: "ランタンの油。遠くまで行ける。だれかに、分けることもできる。" }
  },
  zones: {
    todai: { hue: 40, name: "岬の灯台", color: "#c8903a", kicker: "THE LIGHTHOUSE" },
    minato: { hue: 190, name: "港町", color: "#3a8aa8", kicker: "THE HARBOR TOWN" },
    umi: { hue: 220, name: "海", color: "#3a5aa0", kicker: "THE SEA" },
    oka: { hue: 280, name: "坂の上", color: "#7a5aa0", kicker: "THE HILL" }
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
