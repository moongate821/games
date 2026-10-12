/* 第9章: 生け垣の迷路 → 秘密の庭
 * 謎: 六つの分かれ道(穴で見た地図の言葉 + チェシャ猫の「鳩=右の翼、猫=左の耳」)。翼、翼、耳、翼、耳、耳
 *     近道=赤い傘(縮む)で生け垣の穴をくぐる / 抜け道=白い傘(伸びる)で上から眺める
 *     中心=金の鍵で開く扉 → 秘密の庭 → リナの手紙(t2) */
Object.assign(window.GAME.scenes, {

  maze: {
    zone: "maze", title: "迷路の入口",
    art: { bg: "maze", deco: [["posts", 330, 400, 1.2]] },
    pages: [
      { when: "visits:maze<=1", text: `庭の外れに、**生け垣の迷路**が、あった。

入口に、二本の門柱。一本には、羽ばたく何かの、彫刻。もう一本には、立った何かの、彫刻。

風雨に、さらされて、彫りは、ほとんど、消えている。` },
      { when: "visits:maze>=2", text: `生け垣の迷路。門柱は、そのまま。` },
      { when: "flag:small", text: `体が、縮んでいる。生け垣の根元に、ちょうど、アリスが通れるほどの穴が、あいている。` },
      { when: "flag:large", text: `体が、大きい。生け垣が、**膝までしか、ない**。` },
      { text: `分かれ道が、六つ、あるという。**その順番を、間違えれば、もどされる**。` }
    ],
    options: [
      { id: "enter", label: "迷路に、入る", next: "m1" },
      { id: "hole", label: "生け垣の根元の、穴をくぐる", when: "flag:small", next: "maze_center" },
      { id: "top", label: "上から、迷路を見おろす", when: "flag:large", next: "maze_top" },
      { id: "eatR", label: "赤い傘のキノコを、かじる", at: ["mushred", 120, 430, 0.5], when: "has:mushRed", takes: "mushRed", sets: "small", clears: "large", msg: "体が、ぐんと、縮んだ。" },
      { id: "eatB", label: "青い傘のキノコを、かじる", when: "has:mushBlue", takes: "mushBlue", msg: "……何も、起きなかった。" },
      { id: "eatW", label: "白い傘のキノコを、かじる", when: "has:mushWhite", takes: "mushWhite", sets: "large", clears: "small", msg: "体が、ぐんぐん、伸びた。" },
      { id: "giveup", label: "もう、歩きたくない。生け垣に、もたれる", when: "n:maze_lost>=2", next: "x_maze_giveup" },
      { id: "back", label: "庭へ、もどる", next: "croquet" }
    ]
  },

  maze_top: {
    zone: "maze", title: "上から見た迷路", cost: 1,
    art: { bg: "maze", deco: [["posts", 330, 400, 1.2]] },
    pages: [{ text: `生け垣が、膝までしかない。迷路の全体が、見える。

分かれ道には、**六つ**、アーチが、立っている。どのアーチにも、彫刻がある。**翼の彫刻**か、**耳の彫刻**。

六つの分かれ道の、**正しい道**に立つアーチの彫刻は、この順番だった。

**翼、翼、耳、翼、耳、耳。**

(アリスは、頭の中で、**二回**、繰り返した。……三回は、いらない。)` }],
    options: [{ id: "on", label: "迷路に、入る", next: "m1" }]
  },

  maze_wrong: {
    zone: "maze", title: "行き止まり", cost: 2,
    art: { bg: "maze", deco: [] },
    pages: [{ text: `道は、行き止まりだった。

引き返すうちに、**来た道が、わからなくなった**。気がつくと、また、入口の門柱の前に、立っていた。

(順番は、はじめから。)` }],
    options: [{ id: "back", label: "入口へ、もどる", next: "maze", inc: "maze_lost" }]
  },

  m1: {
    zone: "maze", title: "一つ目の分かれ道", cost: 1,
    art: { bg: "maze", deco: [["arch", 200, 400, 1], ["arch", 460, 400, 1]] },
    pages: [{ text: `最初の、分かれ道。

左のアーチには、**耳**の彫刻。右のアーチには、**翼**の彫刻。` }],
    options: [
      { id: "ear", label: "耳の彫刻の、アーチ", next: "maze_wrong" },
      { id: "wing", label: "翼の彫刻の、アーチ", next: "m2" },
      { id: "back", label: "入口へ、もどる", next: "maze", free: true }
    ]
  },
  m2: {
    zone: "maze", title: "二つ目の分かれ道", cost: 1,
    art: { bg: "maze", deco: [["arch", 200, 400, 1], ["arch", 460, 400, 1]] },
    pages: [{ text: `二つ目の、分かれ道。

左のアーチには、**翼**。右のアーチには、**耳**。` }],
    options: [
      { id: "wing", label: "翼の彫刻の、アーチ", next: "m3" },
      { id: "ear", label: "耳の彫刻の、アーチ", next: "maze_wrong" }
    ]
  },
  m3: {
    zone: "maze", title: "三つ目の分かれ道", cost: 1,
    art: { bg: "maze", deco: [["arch", 200, 400, 1], ["arch", 460, 400, 1]] },
    pages: [{ text: `三つ目の、分かれ道。

左のアーチには、**耳**。右のアーチには、**翼**。` }],
    options: [
      { id: "ear", label: "耳の彫刻の、アーチ", next: "m4" },
      { id: "wing", label: "翼の彫刻の、アーチ", next: "maze_wrong" }
    ]
  },
  m4: {
    zone: "maze", title: "四つ目の分かれ道", cost: 1,
    art: { bg: "maze", deco: [["arch", 200, 400, 1], ["arch", 460, 400, 1]] },
    pages: [{ text: `四つ目の、分かれ道。

左のアーチには、**翼**。右のアーチには、**耳**。` }],
    options: [
      { id: "ear", label: "耳の彫刻の、アーチ", next: "maze_wrong" },
      { id: "wing", label: "翼の彫刻の、アーチ", next: "m5" }
    ]
  },
  m5: {
    zone: "maze", title: "五つ目の分かれ道", cost: 1,
    art: { bg: "maze", deco: [["arch", 200, 400, 1], ["arch", 460, 400, 1]] },
    pages: [{ text: `五つ目の、分かれ道。

左のアーチには、**翼**。右のアーチには、**耳**。` }],
    options: [
      { id: "wing", label: "翼の彫刻の、アーチ", next: "maze_wrong" },
      { id: "ear", label: "耳の彫刻の、アーチ", next: "m6" }
    ]
  },
  m6: {
    zone: "maze", title: "六つ目の分かれ道", cost: 1,
    art: { bg: "maze", deco: [["arch", 200, 400, 1], ["arch", 460, 400, 1]] },
    pages: [{ text: `六つ目の、分かれ道。

左のアーチには、**耳**。右のアーチには、**翼**。` }],
    options: [
      { id: "ear", label: "耳の彫刻の、アーチ", next: "maze_center" },
      { id: "wing", label: "翼の彫刻の、アーチ", next: "maze_wrong" }
    ]
  },

  maze_center: {
    zone: "maze", title: "迷路の中心", cost: 1,
    art: { bg: "maze_center", deco: [["fountain", 330, 400, 1.2], ["smalldoor", 520, 400, 0.9]] },
    pages: [
      { when: "!flag:t2", text: `迷路の中心は、小さな広場だった。

涸れた噴水。その向こう、生け垣の壁に、**錆びた鉄の扉**が、ひとつ。

扉には、**鍵穴**。` },
      { when: "flag:t2", text: `迷路の中心。噴水は、涸れたまま。鉄の扉は、開いている。` }
    ],
    options: [
      { id: "door", label: "鍵を、鍵穴に差す", at: ["smalldoor", 520, 400, 0.9], when: "!flag:t2", requires: "has:key", locked: "扉は、びくとも、しない。鍵が、いるらしい。", next: "secret_garden" },
      { id: "again", label: "扉を、くぐる", when: "flag:t2", next: "secret_garden" },
      { id: "out", label: "迷路を、出る", next: "maze" }
    ]
  },

  secret_garden: {
    zone: "maze", title: "秘密の庭",
    art: { bg: "secret_garden", deco: [["bench", 330, 410, 1.1]] },
    pages: [
      { when: "!flag:t2", text: `扉の向こうは、**小さな庭**だった。

白い薔薇。ペンキは、塗られていない。ベンチが、ひとつ。

ベンチの上に、**白い封筒**が、置いてあった。宛名は、**アリス**。

封は、すでに、あいている。` },
      { when: "flag:t2", text: `小さな庭。白い薔薇。ベンチ。` }
    ],
    options: [
      { id: "read", label: "封筒を、開く", at: ["letter", 330, 380, 1], when: "!flag:t2", next: "secret_letter" },
      { id: "stay", label: "ベンチに、座る", when: "flag:t2", next: "x_garden_stay" },
      { id: "out", label: "庭を、出る", when: "flag:t2", next: "maze_center" }
    ]
  },

  secret_letter: {
    zone: "maze", title: "リナの手紙", cost: 1,
    art: { bg: "secret_garden", deco: [["letter", 320, 400, 1.6]] },
    pages: [{ text: `**アリスへ。**

これを、読んでいるなら、あなたは、まだ、あの午後の中にいるのね。

六時の約束を、あなたは、**忘れたんじゃない**。守れなかった、だけ。それは、ちがうことよ。

わたしは、怒っていません。**待ちくたびれて、先に、歩きだしただけ**。

だから、お願い。

**六時を、あなたの、罰にしないで。**

──リナ

追伸。**数字を、疑うのは、いい癖よ。**でも、**自分の手で書いた数字だけは、最後まで、疑って**。` }],
    options: [{ id: "on", label: "手紙を、胸に、しまう", gives: "letter", sets: "t2", next: "secret_garden" }]
  }
});
