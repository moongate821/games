/* 第4章: 森 ── 分かれ道(三枚の看板) / キノコの原 / イモムシ / ハト
 * 謎(すべて、論理で解ける):
 *  - 看板: 三枚のうち、本当は一枚だけ(全6通りを総当たりで調べ、答えは一つだけ) → 左=お茶会 / 中=女王の庭 / 右=公爵夫人の家
 *  - キノコの札: 三枚とも嘘 + 「赤い傘は何かを起こす」(イモムシの助言) → 赤=縮む / 白=伸びる / 青=何も起きない
 *  - イモムシ: 持ち物に答えさせる三問(時計=六時 / 差額=5 / 裏蓋=L.からA.へ)
 *  - ハト: 「卵を食べるものは蛇」への反論(逆は真ならず) → 女王は「いいえ」を嫌う */
Object.assign(window.GAME.scenes, {

  crossroads: {
    zone: "wood", title: "森の分かれ道",
    art: { bg: "crossroads", deco: [["signs", 330, 400, 1.2]] },
    pages: [
      { when: "visits:crossroads<=1", text: `ウサギの家を出ると、森だった。

道が、ほどけるように、四つに分かれている。三つは、きちんと踏み固められた道。ひとつは、獣道。

分かれ道のまんなかに、看板が、三枚、立っている。

字は、それぞれ、違う人の手に見える。看板の足もとに、小さな貼り紙。` },
      { when: "visits:crossroads>=2", text: `森の分かれ道。看板は、三枚。` },
      { text: `踏み固められた三本の道は、**左の道、中の道、右の道**。

行き先は、お茶会と、女王の庭と、公爵夫人の家。

どの道が、どこへ行くのか。看板は、それを、教えてくれるはずだ。**教えてくれる、はずなのだ。**` }
    ],
    options: [
      { id: "signs", label: "三枚の看板を、読む", at: ["signs", 330, 400, 1.2], next: "crossroads_signs" },
      { id: "left", label: "左の道", next: "tea" },
      { id: "mid", label: "中の道", next: "croquet" },
      { id: "right", label: "右の道", next: "duchess" },
      { id: "beast", label: "獣道", next: "mushroom" },
      { id: "back", label: "池のほうへ、もどる", next: "caucus" }
    ]
  },

  crossroads_signs: {
    zone: "wood", title: "三枚の看板", free: true,
    art: { bg: "crossroads", deco: [["signs", 320, 400, 1.7]] },
    pages: [
      { text: `看板A 「お茶会は、**右**の道の先に、ある。」

看板B 「女王の庭は、**左**の道の先には、ない。」

看板C 「公爵夫人の家は、**右**の道の先には、ない。」

足もとの貼り紙。

『看板屋より。**三枚のうち、本当のことを書いたのは、一枚だけです。**あとの二枚は、嘘です。行き先は、三本の道に、ひとつずつ。入れかわりは、ありません。』` }
    ],
    options: [{ id: "close", label: "看板から、離れる", next: "crossroads", free: true }]
  },

  mushroom: {
    zone: "mush", title: "キノコの原",
    art: { bg: "mushroom", deco: [["caterpillar", 400, 330, 1]] },
    pages: [
      { when: "visits:mushroom<=1", text: `獣道を抜けると、キノコの原だった。

傘が、アリスの背丈より、大きい。その上に、青い煙。イモムシが、水ぎせるを、ふかしている。

足もとには、傘の色の違うキノコが、三つ。それぞれ、札が、挿してある。

『赤い傘 ── **伸びる**』
『青い傘 ── **縮む**』
『白い傘 ── **なにも起きない**』` },
      { when: "visits:mushroom>=2", text: `キノコの原。傘の色の違うキノコが、三つ。札は、そのまま。` },
      { text: `木の上から、ハトの、わめき声がする。

(札は、誰が、挿したのだろう。)` }
    ],
    options: [
      { id: "cat", label: "イモムシに、話しかける", at: ["caterpillar", 400, 330, 1], next: "caterpillar" },
      { id: "pigeon", label: "木の上の、ハト", at: ["pigeon", 540, 150, 0.8], next: "pigeon" },
      { id: "red", label: "赤い傘のキノコ", at: ["mushred", 150, 410, 0.8], gives: "mushRed", msg: "赤い傘を、ひとつ、折りとった。" },
      { id: "blue", label: "青い傘のキノコ", at: ["mushblue", 260, 420, 0.8], gives: "mushBlue", msg: "青い傘を、ひとつ、折りとった。" },
      { id: "white", label: "白い傘のキノコ", at: ["mushwhite", 560, 410, 0.8], gives: "mushWhite", msg: "白い傘を、ひとつ、折りとった。" },
      { id: "back", label: "分かれ道へ、もどる", next: "crossroads" }
    ]
  },

  caterpillar: {
    zone: "mush", title: "イモムシ",
    art: { bg: "mushroom", deco: [["caterpillar", 320, 380, 1.3]] },
    pages: [
      { when: "!flag:cat_ok", text: `イモムシは、アリスを、ゆっくり、見た。

「**おまえは、誰だ**」

アリスは、答えようとして、気づいた。こういう場合、名前は、役に立たない。

「名乗る必要は、ない」と、イモムシは、言った。「**持ち物に、答えさせろ。**三つ、聞く」` },
      { when: "flag:cat_ok", text: `イモムシは、満足そうに、煙を吐いた。

「おまえは、おまえだ。……行け」` }
    ],
    options: [
      { id: "ask", label: "三つの問いに、答える", when: "!flag:cat_ok", next: "cq1" },
      { id: "back", label: "キノコの原へ、もどる", next: "mushroom", free: true }
    ]
  },

  cq1: {
    zone: "mush", title: "一つ目の問い", free: true,
    art: { bg: "mushroom", deco: [["caterpillar", 320, 380, 1.3]] },
    pages: [{ text: `「一つ目。」イモムシが、言う。

「おまえの懐中時計は、**何時**で止まっている?」` }],
    options: [
      { id: "a4", label: "「四時です」", next: "cat_angry" },
      { id: "a559", label: "「五時五十九分です」", next: "cat_angry" },
      { id: "a6", label: "「六時です」", requires: "has:watch", locked: "時計を、持っていない。", next: "cq2", free: true },
      { id: "a0", label: "「時計は、持っていません」", when: "!has:watch", next: "cat_angry" }
    ]
  },

  cq2: {
    zone: "mush", title: "二つ目の問い", free: true,
    art: { bg: "mushroom", deco: [["caterpillar", 320, 380, 1.3]] },
    pages: [{ text: `「二つ目。」

「おまえの帳簿の、**差額**の欄には、いくつと、書いてある?」` }],
    options: [
      { id: "b3", label: "「三です」", next: "cat_angry" },
      { id: "b5", label: "「五です」", requires: "has:ledger", locked: "帳簿を、持っていない。", next: "cq3", free: true },
      { id: "b7", label: "「七です」", next: "cat_angry" },
      { id: "b12", label: "「十二です」", next: "cat_angry" }
    ]
  },

  cq3: {
    zone: "mush", title: "三つ目の問い", free: true,
    art: { bg: "mushroom", deco: [["caterpillar", 320, 380, 1.3]] },
    pages: [{ text: `「三つ目。」

「時計の裏蓋に、刻んである。**誰から、誰へ**。」` }],
    options: [
      { id: "c1", label: "「A.から、L.へ」", next: "cat_angry" },
      { id: "c2", label: "「L.から、A.へ」", sets: "cat_ok", next: "cat_ok", free: true },
      { id: "c3", label: "「R.から、A.へ」", next: "cat_angry" },
      { id: "c4", label: "「何も、刻んでありません」", next: "cat_angry" }
    ]
  },

  cat_angry: {
    zone: "mush", title: "ちがう", cost: 2,
    art: { bg: "mushroom", deco: [["caterpillar", 320, 380, 1.3]] },
    pages: [{ text: `「……ちがう」

イモムシは、煙の輪を、ひとつ吐いた。輪は、アリスの顔の前で、ゆっくり、ほどけた。

「持ち物を、よく、見てから、来い」

(帳簿も、時計も、見返せる。**読み返すのは、恥ではない。**)` }],
    options: [{ id: "back", label: "引きさがる", next: "mushroom" }]
  },

  cat_ok: {
    zone: "mush", title: "持ち物は、嘘をつかない", cost: 1,
    art: { bg: "mushroom", deco: [["caterpillar", 320, 380, 1.3]] },
    pages: [{ text: `イモムシは、ゆっくり、煙を吐いた。

「……よろしい。持ち物は、嘘をつかない。持ち主は、つくがな」

それから、すこしだけ、体を起こした。

「ひとつ、助言をやろう。**足もとの札は、三枚とも、嘘だ。** そして、**赤い傘は、何かを起こす。**」` }],
    options: [{ id: "on", label: "うなずく", next: "mushroom" }]
  },

  pigeon: {
    zone: "mush", title: "木の上のハト",
    art: { bg: "mushroom", deco: [["pigeon", 320, 330, 1.3]] },
    pages: [
      { when: "!flag:pigeon_ok", text: `木の上で、ハトが、わめいていた。

「蛇め! 卵を食べる、蛇め!」

アリスは、卵を、食べたことが、ある。ふつうに、朝食で。

「**卵を食べるものは、蛇だ**」と、ハトは、言った。「おまえは、卵を食べる。だから、蛇だ」` },
      { when: "flag:pigeon_ok", text: `ハトは、巣の上で、まだ、ぶつぶつ言っている。` }
    ],
    options: [
      { id: "p1", label: "「私は、蛇ではありません!」", when: "!flag:pigeon_ok", next: "pigeon_wrong" },
      { id: "p2", label: "「蛇は、卵を食べます。でも、卵を食べるからといって、蛇とは限りません」", when: "!flag:pigeon_ok", sets: "pigeon_ok", next: "pigeon_ok" },
      { id: "p3", label: "「卵は、食べたことが、ありません」", when: "!flag:pigeon_ok", next: "pigeon_wrong" },
      { id: "p4", label: "「……蛇でも、いいです」", when: "!flag:pigeon_ok", next: "pigeon_wrong" },
      { id: "back", label: "木の下から、離れる", next: "mushroom", free: true }
    ]
  },

  pigeon_wrong: {
    zone: "mush", title: "蛇だ、蛇だ", cost: 2,
    art: { bg: "mushroom", deco: [["pigeon", 320, 330, 1.3]] },
    pages: [{ text: `「蛇だ! 蛇だ!」

ハトは、羽をばたばたさせて、巣から落ちそうになった。

(論理で、負けたのではない。**言い方で、負けたのだ。**)` }],
    options: [{ id: "back", label: "あとずさる", next: "mushroom" }]
  },

  pigeon_ok: {
    zone: "mush", title: "筋は、通っている", cost: 1,
    art: { bg: "mushroom", deco: [["pigeon", 320, 330, 1.3]] },
    pages: [{ text: `ハトは、羽を、止めた。

「……ふむ。……筋は、通っている。腹立たしいが」

しばらく、黙ってから、ぽつりと、言った。

「ひとつ、教えてやる。**女王陛下は、『いいえ』という言葉を聞くと、頭が、取れる。** 取れるのは、おまえの頭だが」` }],
    options: [{ id: "on", label: "礼を言う", next: "mushroom" }]
  }
});
