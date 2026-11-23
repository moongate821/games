/* ゲームの設定(題名・持ち物・場所・結末の種類・時計)。物語本文は story_*.js、英語は en_*.js。 */
window.GAME = {
  id: "alice_dark",
  title: "アリスの暗い午後",
  eyebrow: "AN INTERACTIVE PICTURE BOOK FOR GROWN-UPS",
  subtitle: "謎を解いて、午後六時のむこうへ。大人のための、激ムズの絵本ゲーム",
  credit: "原案: ルイス・キャロル『不思議の国のアリス』(1865)　絵: Gemini(水彩)",
  start: "river",
  defaults: { labels: false, sparkle: false, idleFx: false, cameo: false },
  // 時計: 午後4:00に始まり、場面に入るたびに進む。80で午後6:00。鐘が鳴って、法廷が始まる。
  clock: { counter: "tick", limit: 80, next: "bell", startMin: 16 * 60, minPerTick: 120 / 80, msg: "遠くで、鐘が、鳴りはじめた。",
    warn: ["日が、傾きはじめた。", "どこかで、鐘の音が、した気がする。", "鐘が、近い。**急がないと**。"] },
  items: {
    ledger: { name: "帳簿", prop: "i_ledger", desc: "ハートの女王商会、厨房の台帳。最後のページが、破られている。" },
    watch: { name: "こわれた懐中時計", prop: "i_watch", desc: "針は、六時で止まっている。裏蓋に、刻みがある。" },
    jar: { name: "空き瓶", prop: "i_jar", desc: "「オレンジ・マーマレード」のラベル。中身は、空っぽ。" },
    key: { name: "小さな金の鍵", prop: "i_key", desc: "小さな扉の、鍵。" },
    fan: { name: "白い扇", prop: "i_fan", desc: "ウサギの落とし物。" },
    gloves: { name: "白い手袋", prop: "i_gloves", desc: "ウサギの落とし物。片方だけ、湿っている。" },
    spoon: { name: "銀の匙", prop: "i_spoon", desc: "柄に、小さな穴がある。" },
    mushRed: { name: "赤い傘のキノコ(札:伸びる)", prop: "i_mushred", desc: "札には「伸びる」とある。この森の札は、あてにならない。" },
    mushBlue: { name: "青い傘のキノコ(札:縮む)", prop: "i_mushblue", desc: "札には「縮む」とある。" },
    mushWhite: { name: "白い傘のキノコ(札:なにも起きない)", prop: "i_mushwhite", desc: "札には「なにも起きない」とある。" },
    letter: { name: "封のあいた手紙", prop: "i_letter", desc: "宛名は、アリス。" },
    pen: { name: "万年筆", prop: "i_pen", desc: "アリスの、仕事の道具。" }
  },
  zones: {
    bank: { hue: 0, name: "川岸", color: "#5f8a6a", kicker: "THE RIVERBANK" },
    hole: { hue: 250, name: "穴", color: "#6a5a7a", kicker: "DOWN THE HOLE" },
    hall: { hue: 270, name: "扉の広間", color: "#7a5e86", kicker: "THE HALL OF DOORS" },
    pool: { hue: 190, name: "涙の池", color: "#4f7f9a", kicker: "THE POOL OF TEARS" },
    house: { hue: 330, name: "白ウサギの家", color: "#a8584f", kicker: "THE WHITE RABBIT'S HOUSE" },
    wood: { hue: 80, name: "森", color: "#5a7a50", kicker: "THE WOOD" },
    mush: { hue: 40, name: "キノコの原", color: "#7a8a3a", kicker: "THE MUSHROOM GLADE" },
    duchess: { hue: 300, name: "公爵夫人の家", color: "#8a4a7a", kicker: "THE DUCHESS" },
    tea: { hue: 20, name: "六時のお茶会", color: "#b0722a", kicker: "THE TEA-PARTY AT SIX" },
    garden: { hue: 340, name: "女王の庭", color: "#a8433f", kicker: "THE QUEEN'S GROUND" },
    school: { hue: 200, name: "海亀の学校", color: "#4f6f8a", kicker: "THE MOCK TURTLE'S SCHOOL" },
    maze: { hue: 120, name: "生け垣の迷路", color: "#4a7a4a", kicker: "THE HEDGE MAZE" },
    court: { hue: 350, name: "ハートの法廷", color: "#8d2433", kicker: "THE COURT OF HEARTS" },
    six: { hue: 30, name: "六時の部屋", color: "#8a6a3a", kicker: "THE ROOM AT SIX" }
  },
  endingKinds: {
    true: { name: "午後六時の、そのさき", color: "#c79a1b", rank: "S", rainbow: true, banner: "コングラッチュレーション！" },
    happy: { name: "おだやかな結末", color: "#c8703f", rank: "B" },
    normal: { name: "ありふれた結末", color: "#6a8f7a", rank: "C" },
    bad: { name: "静かに、重い結末", color: "#6a4a7a", rank: "D" },
    loop: { name: "くりかえし", color: "#3f7fa8", rank: "E" },
    stuck: { name: "動けない", color: "#7a7a7a", rank: "E" }
  },
  puzzles: [
    { id: "cat", scene: "cat_ok", name: "イモムシの三つの問い", en: "The Caterpillar's three questions" },
    { id: "pigeon", scene: "pigeon_ok", name: "ハトの三段論法", en: "The Pigeon's syllogism" },
    { id: "cheshire", scene: "cheshire_ok", name: "猫の逆さの論理", en: "The Cat's reversed logic" },
    { id: "hall", scene: "tears", name: "広間の大きさの順番", en: "The order of sizes in the hall" },
    { id: "dodo", scene: "dodo_right", name: "賞品の勘定", en: "The prize count" },
    { id: "seat", scene: "tea_seat_ok", name: "席の回転", en: "The rotating seats" },
    { id: "raven", scene: "tea_raven_ok", name: "カラスと書き物机", en: "The raven and the writing-desk" },
    { id: "dm", scene: "tea_dm_ok", name: "ヤマネの「ま」", en: "The Dormouse's M-words" },
    { id: "watch", scene: "watch_inside", name: "止まった時計の裏蓋", en: "Inside the stopped watch" },
    { id: "count", scene: "croquet_count_ok", name: "兵隊の数", en: "The soldiers' count" },
    { id: "hoop", scene: "croquet_hoop_ok", name: "輪の順番", en: "The order of the hoops" },
    { id: "queen", scene: "queen_yes", name: "女王のごきげん", en: "The Queen's mood" },
    { id: "lesson", scene: "school_lesson_ok", name: "授業の計算", en: "The lesson sum" },
    { id: "dance", scene: "school_dance_ok", name: "カドリールの並び", en: "The Quadrille line-up" },
    { id: "maze", scene: "maze_center", name: "生け垣の迷路の暗号", en: "The hedge-maze code" },
    { id: "letter", scene: "secret_letter", name: "秘密の庭の手紙", en: "The letter in the secret garden" },
    { id: "ledger", scene: "court_ledger", name: "帳簿の数字", en: "The figures in the ledger" },
    { id: "wit", scene: "court_wit_ok", name: "証人たちの論理", en: "The witnesses' logic" },
    { id: "verse", scene: "court_verse_ok", name: "詩の頭文字", en: "The poem's first letters" },
    { id: "shelf", scene: "court_shelf", name: "証拠品の棚", en: "The evidence shelf" }
  ],
  // 謎の答えの場面に入ったときの、音と枠の合図(場面idの正規表現)
  fx: {
    wrong: "(_wrong$|^cat_angry$|^queen_hmm$|^croquet_early$|^tea_dm_wrong$|^court_wit_wrong$|^court_verse_wrong$|^school_.*_wrong$|^dodo_wrong$)",
    ok: "(_ok$|^queen_yes$|^watch_inside$|^secret_letter$|^court_win$|^school_hint$|^dodo_right$|^croquet_.*_ok$|^court_ledger$|^court_shelf$)"
  },
  scenes: {}
};
