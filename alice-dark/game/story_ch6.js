/* 第6章: 六時のお茶会(左の道)
 * 謎: 席の回転(答え=席6) / カラスと書き物机(答え=ノートを出せる) / ヤマネの「ま」のもの(4つ) → 2つ以上で、帽子屋が時計を見てくれる
 *     匙で時計の裏蓋を開ける(→ 手紙の紙片=t1) → 竜頭を巻く(wound) */
Object.assign(window.GAME.scenes, {

  tea: {
    zone: "tea", title: "六時のお茶会",
    art: { bg: "tea", deco: [["hatter", 200, 360, 1], ["hare", 330, 380, 1], ["dormouse", 470, 390, 0.9]] },
    pages: [
      { when: "visits:tea<=1", text: `左の道の先は、庭だった。庭、というより、**止まった午後**だった。

長いテーブル。椅子が、六つ。椅子の背に、小さな札が、ついている。時計まわりに、**一から六**。

ティーカップが、六つ。ポットから、湯気が出ているのに、湯は、すこしも減らない。

木の枝に、柱時計が、ぶらさがっている。針は、**六時**。

帽子屋が一番、三月ウサギが二番、ヤマネが三番の席で、お茶を飲んでいる。

「席は、ない! 席は、ない!」と、三人は、そろって叫んだ。

席は、六つ。座っているのは、三人だけ。` },
      { when: "visits:tea>=2", text: `六時のお茶会。柱時計は、六時。` },
      { when: "flag:wound", text: `柱時計の秒針が、**動いている**。

三人は、まだ、気づいていない。` },
      { text: `お茶は、あたたかい。いつまでも、あたたかい。

ここにいれば、午後は、終わらない。**終わらないことが、いちばん、ありがたい人も、いる。**` }
    ],
    options: [
      { id: "seats", label: "席に、座ってみる", when: "!flag:seat_ok", next: "tea_seats" },
      { id: "raven", label: "帽子屋の、なぞなぞに答える", when: "!flag:raven_ok", next: "tea_raven" },
      { id: "dm", label: "ヤマネの話を、聞く", when: "!flag:dm_ok", next: "tea_dormouse" },
      { id: "hatter", label: "帽子屋に、時計を見せる", when: "n:tea_ok>=2 && !flag:t1", next: "hatter_time" },
      { id: "wind", label: "時計の竜頭を、巻く", when: "flag:t1 && !flag:wound", sets: "wound", msg: "かち、と、音がした。……秒針が、動きだした。" },
      { id: "tell", label: "三人に、「もう、六時を、すぎています」と告げる", when: "flag:wound", next: "x_tea_tell" },
      { id: "cup", label: "お茶を、もう一杯もらう", when: "visits:tea<4", next: "tea", loop: true, msg: "お茶は、あたたかかった。いつまでも。" },
      { id: "cup2", label: "お茶を、もう一杯もらう", when: "visits:tea>=4", next: "x_tea_cup" },
      { id: "stay", label: "このまま、お茶会に、残る", next: "x_tea_stay" },
      { id: "leave", label: "お茶会を、あとにする", next: "crossroads" }
    ]
  },

  tea_seats: {
    zone: "tea", title: "席の回転", free: true,
    art: { bg: "tea", deco: [["hatter", 200, 360, 1]] },
    pages: [{ text: `「座りたまえ」と、帽子屋が言った。「ただし、**決まりがある**」

「お茶を、**ひとつ**飲むごとに、全員が、**時計まわりに、ひとつ**、席をうつる。それが、ここの作法だ」

「**三杯目のあと**、わたしの**ひとつ手前**(反時計まわりの、隣)の席に、いたまえ。さもなくば、カップは、出せない」

「さて、きみは、**いま、どの席**に座る?」

(席は、時計まわりに、一から六。帽子屋は、一番。)` }],
    options: [
      { id: "s1", label: "一番の席", next: "tea_seat_wrong" },
      { id: "s2", label: "二番の席", next: "tea_seat_wrong" },
      { id: "s3", label: "三番の席", next: "tea_seat_wrong" },
      { id: "s4", label: "四番の席", next: "tea_seat_wrong" },
      { id: "s5", label: "五番の席", next: "tea_seat_wrong" },
      { id: "s6", label: "六番の席", sets: "seat_ok", inc: "tea_ok", next: "tea_seat_ok" },
      { id: "no", label: "立ったまま、考える", next: "tea", free: true }
    ]
  },

  tea_seat_wrong: {
    zone: "tea", title: "三杯目のあと", cost: 2,
    art: { bg: "tea", deco: [["hatter", 200, 360, 1]] },
    pages: [{ text: `三杯目。

全員が、ひとつずつ、時計まわりに、うつった。ヤマネが、アリスの上に、倒れこんだ。三月ウサギの肘が、カップを、ひっくり返した。

「ちがう。ちがう」と、帽子屋は、嬉しそうに言った。「**もう一度、数えなおしたまえ**」` }],
    options: [{ id: "back", label: "席を、立つ", next: "tea" }]
  },

  tea_seat_ok: {
    zone: "tea", title: "三杯目のあと", cost: 1,
    art: { bg: "tea", deco: [["hatter", 200, 360, 1]] },
    pages: [{ text: `三杯目。

全員が、ひとつずつ、うつった。……アリスは、帽子屋の、ひとつ手前に、座っていた。

帽子屋が、にやりと、した。「合格だ。……ただし、時刻は、まだ、六時だが」` }],
    options: [{ id: "on", label: "お茶を、受けとる", next: "tea" }]
  },

  tea_raven: {
    zone: "tea", title: "なぞなぞ", free: true,
    art: { bg: "tea", deco: [["hatter", 200, 360, 1]] },
    pages: [{ text: `帽子屋は、帽子の中から、黒い羽根を、取りだした。

「**なぜ、カラスは、書き物机に、似ているのか?**」

「答えを、知っているわけでは、ない」と、帽子屋は、付け足した。「だが、**答えが、ない、とは、言っていない**」` }],
    options: [
      { id: "r1", label: "「どちらも、ノートを出せる。ただし、ひどく、平べったい」", sets: "raven_ok", inc: "tea_ok", next: "tea_raven_ok" },
      { id: "r2", label: "「どちらも、黒いから」", next: "tea_raven_wrong" },
      { id: "r3", label: "「どちらも、羽根で、ものを書くから」", next: "tea_raven_wrong" },
      { id: "r4", label: "「答えは、ありません」", next: "tea_raven_wrong" },
      { id: "no", label: "「やめておきます」", next: "tea", free: true }
    ]
  },

  tea_raven_wrong: {
    zone: "tea", title: "はずれ", cost: 1,
    art: { bg: "tea", deco: [["hatter", 200, 360, 1]] },
    pages: [{ text: `帽子屋は、がっかりして、帽子を、かぶりなおした。

「ちがう。……いや、ちがう、とも、言いきれないが、**ちがう**」

(ここでは、**ことば**が、いちばん、油断ならない。)` }],
    options: [{ id: "back", label: "お茶を、すする", next: "tea" }]
  },

  tea_raven_ok: {
    zone: "tea", title: "ノートを出す", cost: 1,
    art: { bg: "tea", deco: [["hatter", 200, 360, 1]] },
    pages: [{ text: `「……ノート。音の、ノート。書きつける、ノート」

帽子屋は、膝を叩いて、笑った。笑いすぎて、帽子が、落ちた。

「それだ! 平べったい、のも、ふくめて! 久しぶりに、**ことばが、ことばに、勝った**」

三月ウサギが、ぱちぱち、手を叩いた。誰かが、遠くで、泣いたような気がした。` }],
    options: [{ id: "on", label: "照れくさく、うなずく", next: "tea" }]
  },

  tea_dormouse: {
    zone: "tea", title: "ヤマネの話", free: true,
    art: { bg: "tea", deco: [["dormouse", 320, 390, 1.2]] },
    pages: [
      { when: "!n:mw>=4", text: `ヤマネは、半分、眠りながら、話しはじめた。

「むかし、三人の姉妹が、井戸の底に、住んでいた。糖蜜の井戸だ。姉妹は、絵を描いていた。**『ま』で、はじまるもの**ばかり」

「たとえば、……」

ヤマネは、いびきをかいた。目をあけて、続けた。

「……たとえば、**なんだったかな**。あなたが、四つ、言ってくれ」

(「ま」で、はじまるものを、四つ。数えまちがえても、ヤマネは、また、眠るだけだ。)` },
      { when: "n:mw>=4", text: `四つ、そろった。

ヤマネは、満足そうに、目を閉じた。「……そう、それだ。……それだ」` }
    ],
    options: [
      { id: "m1", label: "満月", when: "!flag:m1", sets: "m1", inc: "mw", msg: "「まんげつ。……そうだ」" },
      { id: "m2", label: "窓", when: "!flag:m2", sets: "m2", inc: "mw", msg: "「まど。……そうだ」" },
      { id: "m3", label: "迷子", when: "!flag:m3", sets: "m3", inc: "mw", msg: "「まいご。……そうだ」" },
      { id: "m4", label: "枕", when: "!flag:m4", sets: "m4", inc: "mw", msg: "「まくら。……そうだ」" },
      { id: "n1", label: "猫", next: "tea_dm_wrong" },
      { id: "n2", label: "時計", next: "tea_dm_wrong" },
      { id: "n3", label: "鏡", next: "tea_dm_wrong" },
      { id: "n4", label: "帽子", next: "tea_dm_wrong" },
      { id: "done", label: "ヤマネの話を、聞き終える", when: "n:mw>=4", sets: "dm_ok", inc: "tea_ok", next: "tea_dm_ok" },
      { id: "no", label: "起こさないように、離れる", next: "tea", free: true }
    ]
  },

  tea_dm_wrong: {
    zone: "tea", title: "ちがう", cost: 1,
    art: { bg: "tea", deco: [["dormouse", 320, 390, 1.2]] },
    pages: [{ text: `「……ちがう」

ヤマネは、そう言って、また、眠った。

(「ま」。もういちど、頭文字を、思いうかべる。)` }],
    options: [{ id: "back", label: "そっと、もどる", next: "tea_dormouse", free: true }]
  },

  tea_dm_ok: {
    zone: "tea", title: "井戸の底", cost: 1,
    art: { bg: "tea", deco: [["dormouse", 320, 390, 1.2]] },
    pages: [{ text: `「……井戸の底の、姉妹はね」と、ヤマネは、夢の中で、言った。

「描いても、描いても、**間に合わなかった**。もう、すこし、もう、すこし、と思っているうちに、**井戸が、いっぱいに、なった**」

誰も、笑わなかった。

三月ウサギが、カップを、そっと、置いた。` }],
    options: [{ id: "on", label: "黙って、うなずく", next: "tea" }]
  },

  hatter_time: {
    zone: "tea", title: "時計を、見せる",
    art: { bg: "tea", deco: [["hatter", 320, 380, 1.3]] },
    pages: [{ text: `「二つ、解いたな」と、帽子屋は、言った。

「では、見せたまえ。**止まった時計**を」

懐中時計を、テーブルの上に、置いた。針は、六時のまま。帽子屋は、鼻先まで、顔を近づけた。

「……この時計は、壊れて、いない。**止まる、と決めた**のだ。……誰かが、ね」

裏蓋に、小さな穴が、ひとつ、ある。` }],
    options: [
      { id: "open", label: "銀の匙を、穴に差しこむ", at: ["spoon", 320, 420, 0.8], requires: "has:spoon && has:watch", locked: "裏蓋は、開かない。小さな穴に差しこむ、細い柄の何かが、いる。", next: "watch_inside" },
      { id: "back", label: "時計を、しまう", next: "tea", free: true }
    ]
  },

  watch_inside: {
    zone: "tea", title: "裏蓋の、内側", cost: 1,
    art: { bg: "tea", deco: [["letter", 320, 400, 1.5]] },
    pages: [{ text: `かち、と、小さな音がして、裏蓋が、開いた。

内側に、折りたたんだ、紙片が、挟まっていた。

『**六時に、駅の時計の下で。** 遅れても、いいから。来てくれたら、それで、いい。 ── リナ』

アリスは、読んだ。

読んでいる間、**止まっていたのは、時計では、なかった**。

(半年前の、あの日。会議は、延びた。「あと十分」と、メールを、送った。**十分は、六時を、すぎた。**)

帽子屋は、何も、言わなかった。三月ウサギも。ヤマネも、目を、あけていた。` }],
    options: [{ id: "on", label: "紙片を、握りしめる", sets: "t1", next: "tea" }]
  }
});
