/* ゲームの設定(題名・持ち物・場所・結末の種類)。物語本文は story_*.js。原作: 小説『翡翠の約束』 */
window.GAME = {
  id: "hisui",
  title: "翡翠の約束",
  eyebrow: "【作成中】 AN INTERACTIVE PICTURE BOOK",
  subtitle: "時をこえて受けつがれる、墨絵の絵本ゲーム",
  credit: "原作 小説『翡翠の約束』",
  start: "funeral",
  items: {
    hisui: { name: "翡翠のペンダント", prop: "hisui", desc: "銀の鎖に、翡翠色の石。奥で、青白い光が、ゆれている。" },
    diary: { name: "祖父の記録帳", prop: "diary", desc: "革ばりの古い手帳。「守人の桜」と、地図が、はさんである。" },
    memoir: { name: "母の手記", prop: "memoir", desc: "小夜の母が遺した、『愛しい娘へ』の手記。使命ではなく、自由が、書いてある。" },
    tegami: { name: "雪乃の手紙", prop: "tegami", desc: "第三世・雪乃が、未来の継承者へ残した手紙。「桜が涙を流す日に気を付けて」。" },
    notebook: { name: "蒼真の手帳", prop: "notebook", desc: "小夜の父が遺した手帳。「守人にならなくていい。自分で選べ」。" }
  },
  zones: {
    gendai: { hue: 150, name: "現代", color: "#3a8a78", kicker: "THE PRESENT" },
    tenkei: { hue: 30, name: "天慶三年", color: "#a07a40", kicker: "THE PAST" },
    tabi: { hue: 260, name: "守人の旅", color: "#6a5a98", kicker: "THE JOURNEY" },
    sakura: { hue: 340, name: "始原の桜", color: "#c8708a", kicker: "THE ORIGIN" }
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
