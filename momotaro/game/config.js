/* ゲームの設定(題名・持ち物・場所・結末の種類)。物語本文は story_*.js。 */
window.GAME = {
  id: "momo40",
  title: "桃太郎と四十のきびだんご",
  eyebrow: "AN INTERACTIVE PICTURE BOOK",
  subtitle: "四十の結末をさがす、鬼ヶ島への絵本ゲーム",
  credit: "原案: 昔話『桃太郎』",
  start: "river",
  items: {
    kibi: { name: "きびだんご", prop: "kibi", desc: "おばあさんの手づくり。ひとつ分けると、仲間がふえる。" },
    hata: { name: "日本一の旗", prop: "hata", desc: "おばあさんが縫ってくれた旗。「日本一」と書いてある。" },
    momo_seed: { name: "桃の種", prop: "momo_seed", desc: "桃太郎が生まれた桃の種。おじいさんが、お守り袋に入れてくれた。" }
  },
  zones: {
    mura: { hue: 20, name: "村", color: "#c8703a", kicker: "THE VILLAGE" },
    michi: { hue: 100, name: "道", color: "#5a9a3a", kicker: "ON THE ROAD" },
    umi: { hue: 210, name: "海", color: "#3a7ac0", kicker: "THE SEA" },
    shima: { hue: 330, name: "鬼ヶ島", color: "#b0405a", kicker: "ONIGASHIMA" }
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
