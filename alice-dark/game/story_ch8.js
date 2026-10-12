/* 第8章: 海亀もどきの学校(グリフォン)
 * 謎: 授業の計算(7-3=4, ×2=8, ÷4=2) / カドリールの並び(条件4つ) → 二つ解くと、グリフォンが「詩は、頭から読め」と教える(hint_head) */
Object.assign(window.GAME.scenes, {

  school: {
    zone: "school", title: "海亀もどきの学校",
    art: { bg: "school", deco: [["turtle", 230, 400, 1], ["gryphon", 470, 390, 1]] },
    pages: [
      { when: "visits:school<=1", text: `グリフォンは、アリスを、庭の外れの、岩場へ連れていった。

岩に、ひとり、座っている。**海亀もどき**だ。頭は仔牛、体は亀。目から、涙が、とまらない。

「こいつは、**ずっと、泣いている**んだ」と、グリフォンが言った。「悲しいことなんか、何も、ないのに。……な?」

海亀もどきは、ひとつ、しゃくりあげた。

「……ぼくは、むかし、本当の、海亀だった」

学校の黒板に、字が、うっすら、残っている。` },
      { when: "visits:school>=2", text: `海亀もどきの学校。波の音が、遠い。` },
      { text: `「**授業を、して、あげよう**」と、海亀もどきは、言った。「泣いてる間は、**数が、慰めになる**」` }
    ],
    options: [
      { id: "lesson", label: "授業を、受ける", when: "!flag:lesson_ok", next: "school_lesson" },
      { id: "dance", label: "カドリールを、踊る", when: "!flag:dance_ok", next: "school_dance" },
      { id: "talk", label: "海亀もどきの話を、聞く", next: "school_talk" },
      { id: "hint", label: "グリフォンに、声をかける", when: "n:sc>=2 && !flag:hint_head", next: "school_hint" },
      { id: "back", label: "庭へ、もどる", next: "croquet" }
    ]
  },

  school_talk: {
    zone: "school", title: "亀の話", free: true,
    art: { bg: "school", deco: [["turtle", 330, 400, 1.3]] },
    pages: [{ text: `「**むかしは、午後が、終わらなかった**」と、海亀もどきは、言った。

「毎日、おなじ授業。九時から、六時まで。……六時になると、**全部、消える**。黒板も。ぼくも。**消える前に、ひとつだけ、持って出られる**」

「ぼくは、涙を、持って出た。……それ以外が、**思い出せない**んだ」

グリフォンは、海のほうを、見ている。「**六時には、数が、合わなくなる**んだよ。……ここでは、な」` }],
    options: [{ id: "back", label: "うなずく", next: "school", free: true }]
  },

  school_lesson: {
    zone: "school", title: "授業の計算", free: true,
    art: { bg: "school", deco: [["turtle", 330, 400, 1.3]] },
    pages: [{ text: `海亀もどきは、黒板に、書いた。

「**七**から はじめる。**三を引く**。**二倍する**。**四で、割る**。……さて、**いくつ**?」

(計算には、順番が、ある。)` }],
    options: [
      { id: "l1", label: "一", next: "school_lesson_wrong" },
      { id: "l2", label: "二", sets: "lesson_ok", inc: "sc", next: "school_lesson_ok" },
      { id: "l3", label: "三", next: "school_lesson_wrong" },
      { id: "l4", label: "四", next: "school_lesson_wrong" },
      { id: "l7", label: "七", next: "school_lesson_wrong" },
      { id: "no", label: "あとにする", next: "school", free: true }
    ]
  },

  school_lesson_wrong: {
    zone: "school", title: "ちがう答え", cost: 1,
    art: { bg: "school", deco: [["turtle", 330, 400, 1.3]] },
    pages: [{ text: `海亀もどきは、ぽろぽろ、泣いた。

「……ちがう。……でも、**間違えるのも、悪くない**。ぼくも、昔は、よく、間違えた」

(順番に。ひとつずつ。)` }],
    options: [{ id: "back", label: "もう一度", next: "school" }]
  },

  school_lesson_ok: {
    zone: "school", title: "二", cost: 1,
    art: { bg: "school", deco: [["turtle", 330, 400, 1.3]] },
    pages: [{ text: `七から三を引いて、四。二倍して、八。四で割って、**二**。

「……そうだ。二。……二人、だったな。……いや、何でもない」

海亀もどきは、黒板の字を、そっと、消した。` }],
    options: [{ id: "on", label: "黙って、うなずく", next: "school" }]
  },

  school_dance: {
    zone: "school", title: "カドリール", free: true,
    art: { bg: "school", deco: [["gryphon", 470, 390, 1]] },
    pages: [{ text: `グリフォンが、言った。「**五人**で、一列に、並んで、踊る。名前は、A、B、C、D、E」

「並び方は、**決まって**いる」

「**Eは、最後**」

「**Cは、Bの、すぐ後ろ**」

「**Aは、Bより、前**」

「**Dは、一番前では、ない**」

「ただし、**Dは、Cの隣には、ならない**」

「さあ、並べ。**音楽が、止まる前に**」` }],
    options: [
      { id: "d1", label: "A → B → C → D → E", next: "school_dance_wrong" },
      { id: "d2", label: "A → D → B → C → E", sets: "dance_ok", inc: "sc", next: "school_dance_ok" },
      { id: "d3", label: "D → A → B → C → E", next: "school_dance_wrong" },
      { id: "d4", label: "A → B → D → C → E", next: "school_dance_wrong" },
      { id: "no", label: "あとにする", next: "school", free: true }
    ]
  },

  school_dance_wrong: {
    zone: "school", title: "足がもつれる", cost: 1,
    art: { bg: "school", deco: [["gryphon", 470, 390, 1]] },
    pages: [{ text: `ロブスターが、背中から、落ちた。五人が、ばらばらに、絡まった。

「**条件を、ぜんぶ**、見たかい?」と、グリフォン。` }],
    options: [{ id: "back", label: "並べなおす", next: "school" }]
  },

  school_dance_ok: {
    zone: "school", title: "A、D、B、C、E", cost: 1,
    art: { bg: "school", deco: [["gryphon", 470, 390, 1]] },
    pages: [{ text: `A、D、B、C、E。

五人は、きれいに、一列で、前へ進み、後ろへ進み、また前へ進んだ。

誰も、笑わなかった。でも、**誰も、泣かなかった**。` }],
    options: [{ id: "on", label: "一礼する", next: "school" }]
  },

  school_hint: {
    zone: "school", title: "グリフォンの、ささやき", cost: 1,
    art: { bg: "school", deco: [["gryphon", 400, 390, 1.2]] },
    pages: [{ text: `グリフォンは、アリスを、岩陰に、連れていった。

「二つとも、解いたな。……なら、**ひとつ、教えてやろう**」

「法廷で、**詩が、読まれる**。王様が、前から読む。**意味は、どうでもいい**」

「**詩は、頭から、読むものだ。**……各行の、**最初の、一文字**」

「それだけだ」` }],
    options: [{ id: "on", label: "礼を言う", sets: "hint_head", next: "school" }]
  }
});
