/* ゲームの設定(題名・持ち物・場所・結末の種類)。物語本文は story_*.js。 */
window.ALICE_GAME = {
  id: "alice40",
  title: "アリスの小さな大冒険",
  eyebrow: "AN INTERACTIVE PICTURE BOOK",
  subtitle: "ふしぎの国を、選んで進む絵本ゲーム",
  credit: "原案: ルイス・キャロル『不思議の国のアリス』(1865)",
  start: "river",
  items: {
    lantern: { name: "ランプ", prop: "lantern", desc: "小さな明かり。暗いところで役に立ちそう。" },
    map: { name: "古い地図", prop: "map", desc: "赤い点線と、バツじるしが描いてある。" },
    key: { name: "金の鍵", prop: "key", desc: "小さな扉の鍵。" },
    bottle: { name: "小瓶", prop: "bottle", desc: "「私を飲んで」と書いてある。" },
    cake: { name: "ケーキ", prop: "cake", desc: "「私を食べて」と書いてある。" },
    fan: { name: "白い扇", prop: "fan", desc: "ウサギの落とし物。" },
    gloves: { name: "白い手袋", prop: "gloves", desc: "ウサギの落とし物。" },
    thimble: { name: "指ぬき", prop: "thimble", desc: "ドードーがくれた賞品。" },
    mushL: { name: "キノコ(左)", prop: "mush_l", desc: "かじると、体がぐんぐん大きくなる。" },
    mushR: { name: "キノコ(右)", prop: "mush_r", desc: "かじると、体がしゅんと小さくなる。" },
    watch: { name: "こわれた懐中時計", prop: "watch", desc: "針が止まっている。ねじが足りない。" },
    screw: { name: "六時のねじ", prop: "screw", desc: "止まった時間を動かす、小さな部品。" }
  },
  zones: {
    river: { hue: 0, name: "川岸", color: "#5f9a52", kicker: "THE RIVERBANK" },
    hole: { hue: 250, name: "ウサギ穴", color: "#8a5a7a", kicker: "DOWN THE RABBIT HOLE" },
    hall: { hue: 270, name: "扉の広間", color: "#8a5e86", kicker: "THE HALL OF DOORS" },
    pool: { hue: 170, name: "涙の池", color: "#4f8fb0", kicker: "THE POOL OF TEARS" },
    forest: { hue: 60, name: "森", color: "#5a9a50", kicker: "THE WOOD" },
    house: { hue: 330, name: "白ウサギの家", color: "#c0614f", kicker: "THE WHITE RABBIT'S HOUSE" },
    mush: { hue: 40, name: "キノコの原っぱ", color: "#7a9a3a", kicker: "THE MUSHROOM GLADE" },
    duchess: { hue: 300, name: "公爵夫人の家", color: "#a8508a", kicker: "THE DUCHESS" },
    tea: { hue: 20, name: "狂ったお茶会", color: "#d08a2a", kicker: "A MAD TEA-PARTY" },
    garden: { hue: 340, name: "女王の庭", color: "#c9433f", kicker: "THE QUEEN'S GARDEN" },
    court: { hue: 350, name: "法廷", color: "#9d2433", kicker: "THE COURT OF HEARTS" }
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
