/* 第7章: 女王の庭(中の道)
 * 謎: 兵隊の数(1+2+…+9=45) / 輪の順(赤→青→緑、条件3つ) / 女王の機嫌(「いいえ」は禁句)
 * 二つ解く + 機嫌をそこねない → 女王の許し(queen_ok)。許しがないまま法廷で口を開くと、首が飛ぶ。 */
Object.assign(window.GAME.scenes, {

  croquet: {
    zone: "garden", title: "女王の庭",
    art: { bg: "garden", deco: [["queen", 470, 380, 1], ["hedgehog", 150, 440, 0.5]] },
    pages: [
      { when: "visits:croquet<=1", text: `中の道の先は、赤い庭だった。

薔薇の木が、白い薔薇に、赤いペンキを、塗られている。庭師の三人の札(トランプ)が、あわてて、塗り残しを探している。

その向こうで、行進が、はじまった。兵隊の札。王と王妃。そして、一番うしろを、**赤い顔の女王**が、歩いてくる。

「この庭に、**文句のある者は、いるか!**」

兵隊は、全員、首を、横に振った。**縦にも、振れなかった。**` },
      { when: "visits:croquet>=2", text: `女王の庭。クロッケーの、準備が、続いている。` },
      { text: `輪(フープ)は、**赤、青、緑**の三つ。ボールは、ハリネズミ。槌は、フラミンゴ。

兵隊は、三角の形に、整列している。` }
    ],
    options: [
      { id: "count", label: "整列した兵隊を、数える", when: "!flag:sc_ok", next: "croquet_count" },
      { id: "hoop", label: "輪の順番を、確かめる", when: "!flag:hoop_ok", next: "croquet_hoop" },
      { id: "queen", label: "女王に、話しかける", at: ["queen", 470, 380, 1], when: "n:q_ok>=2 && !flag:queen_ok", next: "queen_talk" },
      { id: "queen_no", label: "女王に、話しかける", when: "!n:q_ok>=2", next: "croquet_early" },
      { id: "queen_done", label: "女王に、あいさつする", when: "flag:queen_ok", next: "queen_after" },
      { id: "gry", label: "グリフォンに、ついていく", next: "school" },
      { id: "maze", label: "庭の外れの、生け垣の迷路へ", next: "maze" },
      { id: "court", label: "法廷へ、向かう", next: "court", requires: "has:ledger", locked: "帳簿を、持たずに法廷へ行くのは、武器を持たずに戦場へ行くようなものだ。" },
      { id: "back", label: "分かれ道へ、もどる", next: "crossroads" }
    ]
  },

  croquet_early: {
    zone: "garden", title: "女王の前", cost: 1,
    art: { bg: "garden", deco: [["queen", 470, 380, 1]] },
    pages: [{ text: `近づこうとして、アリスは、兵隊に止められた。

「**準備のできていない者は、陛下の御前には、出られない**」

(兵隊を数え、輪の順を、確かめておけ、ということらしい。)` }],
    options: [{ id: "back", label: "引きさがる", next: "croquet" }]
  },

  croquet_count: {
    zone: "garden", title: "兵隊の数", free: true,
    art: { bg: "garden", deco: [["card", 330, 400, 1]] },
    pages: [{ text: `兵隊は、三角に並んでいる。

先頭は、**ひとり**。その後ろは、**ふたり**。その後ろは、**三人**。……と、一列ごとに、一人ずつ増えて、最後の列は、**九人**。

女王が、言う。「**全部で、何人だ**。**間違えたら、**」

女王は、言い終えなかった。` }],
    options: [
      { id: "n36", label: "三十六人", next: "croquet_count_wrong" },
      { id: "n45", label: "四十五人", sets: "sc_ok", inc: "q_ok", next: "croquet_count_ok" },
      { id: "n54", label: "五十四人", next: "croquet_count_wrong" },
      { id: "n55", label: "五十五人", next: "croquet_count_wrong" },
      { id: "no", label: "もう一度、数えなおす", next: "croquet", free: true }
    ]
  },

  croquet_count_wrong: {
    zone: "garden", title: "兵隊の数、ちがい", cost: 2,
    art: { bg: "garden", deco: [["queen", 470, 380, 1]] },
    pages: [{ text: `「……ちがうな」

女王が、扇で、アリスの鼻先を、叩いた。

「**数えなおせ。**ただし、もう、あまり、時間がない」

(一、二、三、……九。足していく。)` }],
    options: [{ id: "back", label: "下がる", next: "croquet" }]
  },

  croquet_count_ok: {
    zone: "garden", title: "四十五", cost: 1,
    art: { bg: "garden", deco: [["card", 330, 400, 1]] },
    pages: [{ text: `「**四十五**」

女王は、眉を、ぴくりと、動かした。

「……合っている。**だが**、偶然かも、しれん」` }],
    options: [{ id: "on", label: "黙って、頭を下げる", next: "croquet" }]
  },

  croquet_hoop: {
    zone: "garden", title: "輪の順番", free: true,
    art: { bg: "garden", deco: [["hoop", 330, 420, 1]] },
    pages: [{ text: `輪は、赤、青、緑の、三つ。くぐる順番が、決まっている。庭師の札が、そっと、教えてくれた。

「**緑は、最初では、ありません**」

「**赤は、最後では、ありません**」

「**青は、緑の、すぐ前です**」

(札は、それだけ言って、また、ペンキを塗りはじめた。)` }],
    options: [
      { id: "h1", label: "赤 → 青 → 緑", sets: "hoop_ok", inc: "q_ok", next: "croquet_hoop_ok" },
      { id: "h2", label: "赤 → 緑 → 青", next: "croquet_hoop_wrong" },
      { id: "h3", label: "青 → 赤 → 緑", next: "croquet_hoop_wrong" },
      { id: "h4", label: "青 → 緑 → 赤", next: "croquet_hoop_wrong" },
      { id: "h5", label: "緑 → 赤 → 青", next: "croquet_hoop_wrong" },
      { id: "no", label: "あとで、考える", next: "croquet", free: true }
    ]
  },

  croquet_hoop_wrong: {
    zone: "garden", title: "輪が、笑う", cost: 1,
    art: { bg: "garden", deco: [["hoop", 330, 420, 1]] },
    pages: [{ text: `ハリネズミを、転がしてみた。ハリネズミは、あちこちの輪に、ぶつかって、丸くなった。

庭師の札が、こそっと、言う。「……ちがいます」` }],
    options: [{ id: "back", label: "考えなおす", next: "croquet" }]
  },

  croquet_hoop_ok: {
    zone: "garden", title: "赤、青、緑", cost: 1,
    art: { bg: "garden", deco: [["hoop", 330, 420, 1]] },
    pages: [{ text: `ハリネズミは、赤、青、緑の順に、すこんと、くぐった。

庭師の札が、そっと、顔をあげた。「……お見事で」

遠くで、女王が、**ひと言**、鼻で笑った。` }],
    options: [{ id: "on", label: "会釈する", next: "croquet" }]
  },

  queen_talk: {
    zone: "garden", title: "ハートの女王",
    art: { bg: "garden", deco: [["queen", 330, 380, 1.4]] },
    pages: [
      { when: "!flag:queen_q", text: `女王は、アリスを、上から下まで、眺めた。

「兵隊を、数えた。輪の順を、覚えた。……**よろしい**」

女王の顔は、赤い。赤いのは、怒りのせいか、もともとか、よくわからない。

「では、ひとつだけ、聞く。**この庭は、美しいか?**」` },
      { when: "flag:queen_q", text: `女王は、満足そうに、扇を、あおいだ。` }
    ],
    options: [
      { id: "yes", label: "「はい、陛下。たいへん、お美しい庭です」", when: "!flag:queen_q", sets: "queen_q", next: "queen_yes" },
      { id: "no", label: "「いいえ、白い薔薇に、赤いペンキを、塗っているように、見えます」", when: "!flag:queen_q", next: "x_queen_no" },
      { id: "but", label: "「……そうですね。薔薇が、少し、かわいそうです」", when: "!flag:queen_q", next: "queen_hmm" },
      { id: "back", label: "一歩、下がる", next: "croquet" }
    ]
  },

  queen_hmm: {
    zone: "garden", title: "ぎりぎり", cost: 2,
    art: { bg: "garden", deco: [["queen", 330, 380, 1.4]] },
    pages: [{ text: `女王の顔が、赤から、**赤黒く**なった。

「……かわいそう? ……薔薇が?」

兵隊が、斧を持った。女王が、手を挙げた。ほんの、ちょっと、持ちあげた。

「**もう一度、聞く。この庭は、美しいか?**」

(言いかたを、まちがえないほうが、いい。)` }],
    options: [
      { id: "yes", label: "「はい、陛下。たいへん、お美しい庭です」", sets: "queen_q", next: "queen_yes" },
      { id: "no", label: "「いいえ」", next: "x_queen_no" }
    ]
  },

  queen_yes: {
    zone: "garden", title: "おほめの言葉", cost: 1,
    art: { bg: "garden", deco: [["queen", 330, 380, 1.4]] },
    pages: [{ text: `女王は、**声を出して、笑った**。

「そうであろう。そうであろう。**わたしの庭だ**」

笑いのあと、ほんの一瞬、女王は、**ひどく、疲れた顔**を、した。

「……おまえに、**許しを**、やる。**法廷で、口をきく許し**だ。本当は、そんなものは、やらぬのだが」

女王は、そっぽを向いて、付け加えた。「六時には、**すべて、数えなおす**。何度でも、な」` }],
    options: [{ id: "on", label: "深く、頭を下げる", sets: "queen_ok", next: "croquet" }]
  },

  queen_after: {
    zone: "garden", title: "女王へ、あいさつ", free: true,
    art: { bg: "garden", deco: [["queen", 330, 380, 1.4]] },
    pages: [{ text: `「何だ」と、女王は、扇の陰から言った。

「……いや、いい。行け。六時が、くる」` }],
    options: [{ id: "back", label: "もどる", next: "croquet", free: true }]
  }
});
