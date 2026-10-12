/* 第3章: 涙の池 / コーカス・レース / ウサギの家と屋根裏
 * 謎: 池を渡る(空き瓶 or 泳ぐ=時間をとられる) / ドードーの賞品の計算(あまり=5) / ウサギの頼みごと(扇と手袋)→匙 / 毒の瓶(ひっかけ)
 * 手がかり: ネズミ「胡椒の家では、扇で風を起こす」 / ウサギの予定帳「席は時計まわり1〜6。帽子屋1・三月ウサギ2・ヤマネ3」「法廷は午後六時」 */
Object.assign(window.GAME.scenes, {

  tears: {
    zone: "pool", title: "涙の池",
    art: { bg: "tears", deco: [] },
    pages: [
      { when: "visits:tears<=1", text: `扉の向こうは、通路ではなかった。

**岸**だった。

目の前に、池が、ひろがっている。ほんとうに、広い。小さな体からは、向こう岸が、霞んで見えない。

水は、塩の匂いがする。……涙の、匂いだ。

(アリスは、泣いていない。たぶん。)` },
      { when: "visits:tears>=2", text: `涙の池の岸。塩の匂い。` },
      { text: `岸のあちこちに、流れついたものが、散らばっている。

泳ぐか。何かに掴まるか。

どちらにしても、**濡れる**。` }
    ],
    options: [
      { id: "swim", label: "泳いで、渡る", next: "tears_swim" },
      { id: "float", label: "空き瓶に掴まって、渡る", at: ["jar", 470, 400, 0.9], requires: "has:jar", locked: "掴まれるものを、持っていない。", next: "caucus" },
      { id: "look", label: "水面をのぞきこむ", next: "tears_look" }
    ]
  },

  tears_look: {
    zone: "pool", title: "水面", free: true,
    art: { bg: "tears", deco: [] },
    pages: [
      { text: `水面に、顔が映っている。二十八歳の、疲れた顔。

その肩ごしに、**もうひとり**、映っている気がした。

振り向くと、誰もいない。

(水面の顔は、アリスより、すこし、若かった。)` }
    ],
    options: [{ id: "close", label: "目をそらす", next: "tears", free: true }]
  },

  tears_swim: {
    zone: "pool", title: "涙のなか", cost: 3,
    art: { bg: "tears", deco: [] },
    pages: [
      { text: `泳いだ。服が、重い。

塩水が、目に入る。泣いているみたいだ、と思って、笑いそうになった。

途中で、何かの板切れに、ぶつかった。掴まって、息をついた。

向こう岸に着くまで、ずいぶん、かかった。` }
    ],
    options: [{ id: "on", label: "岸に、上がる", next: "caucus" }]
  },

  caucus: {
    zone: "pool", title: "コーカス・レース", enter: { clears: ["small", "large"] },
    art: { bg: "caucus", deco: [["dodo", 420, 400, 1]] },
    pages: [
      { when: "visits:caucus<=1", text: `向こう岸には、濡れた動物たちが、集まっていた。ドードー。インコ。ワシの子。アヒル。そして、ネズミ。

誰も、ちゃんと乾いていない。

「乾くには、走るのが、いちばんだ」と、ドードーが宣言した。「**コーカス・レース**だ」

輪になって、走りだす。いつ始まり、いつ終わるのか、誰にも、分からない。` },
      { when: "visits:caucus>=2", text: `コーカス・レースの跡。乾きかけた動物たちが、まだ、ぐるぐる歩いている。` },
      { text: `終わった。……らしい。

ドードーが、胸をはる。「全員、優勝だ。賞品が、ある」

そして、アリスを、じっと見た。「会計監査人、とやら。賞品の、勘定を、頼む」` }
    ],
    options: [
      { id: "prize", label: "賞品の勘定を、引き受ける", at: ["dodo", 420, 400, 1], when: "!flag:dodo_ok", next: "dodo_prize" },
      { id: "mouse", label: "ネズミと、話す", at: ["mouse", 150, 410, 0.8], next: "mouse_talk" },
      { id: "house", label: "ウサギの家へ、向かう", next: "rabbit_house" },
      { id: "wood", label: "森へ、向かう", next: "crossroads" }
    ]
  },

  dodo_prize: {
    zone: "pool", title: "賞品の勘定", free: true,
    art: { bg: "caucus", deco: [["comfits", 320, 400, 1.6]] },
    pages: [
      { text: `ドードーは、袋を逆さにした。キャンディが、ころころ、転がる。

「**十七個**だ」

「走ったのは、わたしを入れて、**六人**。六人に、同じ数ずつ、配る。あまりは、審判の、わたしのものだ。……さて、監査人。**審判の取り分は、いくつ?**」

全員が、アリスを見ている。` }
    ],
    options: [
      { id: "a1", label: "「一個です」", next: "dodo_wrong" },
      { id: "a2", label: "「二個です」", next: "dodo_wrong" },
      { id: "a3", label: "「三個です」", next: "dodo_wrong" },
      { id: "a5", label: "「五個です」", sets: "dodo_ok", next: "dodo_right" },
      { id: "no", label: "「やめておきます」", next: "caucus", free: true }
    ]
  },

  dodo_wrong: {
    zone: "pool", title: "走りなおし", cost: 2,
    art: { bg: "caucus", deco: [["dodo", 420, 400, 1]] },
    pages: [
      { text: `「違う!」ドードーは、杖を、地面に叩きつけた。「勘定の合わない者は、走りなおしだ!」

もう一周、走らされた。足は、まだ、塩でべたつく。

(会計監査人が、自分の足し算で、間違えるとは。)` }
    ],
    options: [{ id: "back", label: "息をととのえる", next: "caucus" }]
  },

  dodo_right: {
    zone: "pool", title: "正しい勘定", cost: 1,
    art: { bg: "caucus", deco: [["dodo", 420, 400, 1], ["mouse", 150, 410, 0.8]] },
    pages: [
      { text: `十七を、六で割る。二が、六つ。あまりは、五。

「……正しい」ドードーは、すこし、悔しそうだ。「会計監査人は、嫌いだ。だが、感謝する」

ネズミが、そっと、寄ってきた。

「**胡椒の家へ行くなら、扇を。**風を起こせば、胡椒は、逃げます」

そう言って、ネズミは、人混みに、まぎれた。` }
    ],
    options: [{ id: "on", label: "うなずく", next: "caucus" }]
  },

  mouse_talk: {
    zone: "pool", title: "ネズミの話", free: true,
    art: { bg: "caucus", deco: [["mouse", 320, 410, 1.3]] },
    pages: [
      { text: `「長くて、悲しい話です」ネズミが、言った。

「昔、猫と、犬と、……いえ、これは、話さなくて、よい」

ネズミは、アリスの顔を、じっと、見た。

「あなたも、誰かを、**待たせた**ことが、ありますか」

答えられなかった。

ネズミは、うなずいた。「私もです。**待たせる側は、いつも、忙しい。** 待つ側だけが、ひまを、知っている」` }
    ],
    options: [{ id: "close", label: "うつむく", next: "caucus", free: true }]
  },

  rabbit_house: {
    zone: "house", title: "白ウサギの家",
    art: { bg: "rabbit_house", deco: [] },
    pages: [
      { when: "visits:rabbit_house<=1", text: `白ウサギの家は、きちんと、しすぎていた。

靴は、揃っている。傘は、角度まで、揃っている。ここでは、遅刻だけが、乱れているのだ。

テーブルの上に、メモがある。ウサギの、細かい字。

『==扇と、手袋。屋根裏へ。急げ。==』` },
      { when: "visits:rabbit_house>=2", text: `白ウサギの家。靴は、揃っている。` },
      { text: `(奥の扉は、屋根裏への階段になっている。)` }
    ],
    options: [
      { id: "fan", label: "テーブルの上の、白い扇", at: ["fan", 200, 330, 0.8], gives: "fan", msg: "扇は、軽かった。" },
      { id: "gloves", label: "引き出しの中の、白い手袋", at: ["gloves", 440, 380, 0.8], gives: "gloves", msg: "手袋は、片方だけ、湿っていた。" },
      { id: "bottle", label: "棚の上の、ラベルのない小瓶", at: ["bottle2", 540, 220, 0.7], next: "house_bottle" },
      { id: "attic", label: "屋根裏への、階段", next: "rabbit_attic" },
      { id: "out1", label: "池のほとりへ、もどる", next: "caucus" },
      { id: "out2", label: "森へ、出る", next: "crossroads" }
    ]
  },

  house_bottle: {
    zone: "house", title: "ラベルのない瓶", free: true, lead: true,
    art: { bg: "rabbit_house", deco: [["bottle2", 320, 400, 1.7]] },
    pages: [
      { text: `瓶には、ラベルがない。

代わりに、栓に、細い糸で、**紙切れ**が結んである。表は、白。裏から、字が、透けて見える。「==飲むな==」の、反対の字だ。

飲めば、何かが起こるのだろう。

ウサギが、見られたくない、何かが。` }
    ],
    options: [
      { id: "drink", label: "栓を抜いて、飲む", next: "b_poison" },
      { id: "put", label: "瓶を、棚にもどす", next: "rabbit_house", free: true }
    ]
  },

  rabbit_attic: {
    zone: "house", title: "屋根裏",
    art: { bg: "attic", deco: [["rabbit", 420, 400, 1]] },
    pages: [
      { when: "!flag:rabbit_ok", text: `屋根裏は、書類の山だった。

白ウサギが、机に向かっている。割れた時計の文字盤を、前に。

「遅い!」と、彼は、顔を上げずに、言った。「手袋と、扇は?」

アリスは、**メアリー・アン**という名前に、された気がした。` },
      { when: "flag:rabbit_ok", text: `白ウサギは、手袋をはめて、扇をひろげて、満足そうに、うなずいた。

「……ありがとう。**匙**は、持っていきなさい。時計の裏蓋は、それで開く」

それから、すこしだけ、アリスを見た。

「君は、遅れては、いけない。僕は、もう、手遅れだが」` }
    ],
    options: [
      { id: "give", label: "扇と手袋を、渡す", at: ["rabbit", 420, 400, 1], requires: "has:fan && has:gloves", locked: "ウサギは、手を止めて、アリスの手元を見た。足りない、と言いたいらしい。", takes: ["fan", "gloves"], gives: "spoon", sets: "rabbit_ok", msg: "ウサギは、銀の匙をくれた。柄に、小さな穴がある。" },
      { id: "book", label: "ウサギの予定帳を、のぞく", when: "flag:rabbit_ok", next: "rabbit_book" },
      { id: "down", label: "階段を、降りる", next: "rabbit_house", free: true }
    ]
  },

  rabbit_book: {
    zone: "house", title: "ウサギの予定帳", free: true,
    art: { bg: "attic", deco: [["book", 320, 400, 1.6]] },
    pages: [
      { text: `ウサギの予定帳は、分刻みだった。

『午後 四時 ── 川岸にて、**会計監査人**を、連れてくる。』

『午後 四時三十分 ── 女王の庭。クロッケー。』

『お茶会 ── 時刻、**六時のまま**。席は、時計まわりに、一から六。**帽子屋が一番、三月ウサギが二番、ヤマネが三番。**一杯ごとに、全員、ひとつ時計まわりに移る。』

『午後 **六時きっかり** ── ハートの法廷。遅刻者は、……』

その先は、インクが滲んで、読めない。` }
    ],
    options: [{ id: "close", label: "予定帳を、閉じる", next: "rabbit_attic", free: true }]
  }
});
