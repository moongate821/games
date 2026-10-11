/* ゲームの設定(題名・持ち物・場所・結末の種類)。物語本文は story_*.js。原作: 小説『世界の果てで君を探す』 */
window.GAME = {
  id: "sekai",
  title: "世界の果てで君を探す",
  eyebrow: "【作成中】 AN INTERACTIVE PICTURE BOOK",
  subtitle: "何度失っても、また会いに行く。水彩の絵本ゲーム",
  credit: "原作 小説『世界の果てで君を探す』",
  start: "hill",
  items: {
    diary: { name: "結月の日記", prop: "diary", desc: "結月が書きはじめた、まだ数ページの日記。最後のページに「待ってて」と、ある。" },
    compass: { name: "古い羅針盤", prop: "compass", desc: "旅の老人がくれた、銀色の羅針盤。針は、いつも、空の遠くを指す。" },
    hairpin: { name: "結月の髪飾り", prop: "hairpin", desc: "秋祭りの日、結月がつけていた、小さな花の髪飾り。第二観測区画で、光の中に落ちていた。" }
  },
  zones: {
    mura: { hue: 30, name: "星祭りの村", color: "#d08a5a", kicker: "THE VILLAGE" },
    tabi: { hue: 220, name: "北への旅", color: "#5a7ab0", kicker: "THE JOURNEY NORTH" },
    kyokai: { hue: 270, name: "境界", color: "#8a7ac0", kicker: "THE BOUNDARY" },
    seikai: { hue: 200, name: "星海", color: "#3a6ab8", kicker: "THE STAR SEA" }
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
