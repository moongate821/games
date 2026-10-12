/* 第1〜2章: 川岸と穴 / 扉の広間
 * 書き方: 短い段落。**大事な文**、==いちばん大事な文==。読み物の場面は free:true(時計を進めない)。
 * 謎: 帳簿を持つ / 懐中時計 / 瓶と地図(迷路の道順の暗号) / 広間の「大きさ」の順番(薬2口・ケーキ2口・鍵・扉) */
Object.assign(window.GAME.scenes, {

  river: {
    zone: "bank", title: "川岸のベンチ",
    art: { bg: "river", deco: [] },
    pages: [
      { when: "visits:river<=1", text: `午後四時。川岸のベンチ。

アリスは、他人の帳簿を、膝に広げていた。ハートの女王商会、厨房の台帳。半年分。

二十八歳。会計監査人。仕事は、数字の嘘を、見つけることだ。

合わない。何度、足しても、合わない。

風が、ページをめくる。川は、ゆっくり、光っている。

……ベンチの端を、白いものが、走りぬけた。

「遅刻だ。遅刻だ。もう、こんな時間だ」

ウサギだった。チョッキを着て、懐中時計を、握りしめている。` },
      { when: "visits:river>=2", text: `川岸のベンチ。午後四時の、光。

風が、ページをめくる。` },
      { text: `アリスは、帳簿から、顔をあげた。

こういうとき、大人は、見なかったことにする。

でも、あの時計の鎖に、**見おぼえがあった**。` }
    ],
    options: [
      { id: "ledger", label: "ベンチの上の帳簿", at: ["ledger", 190, 430, 0.9], gives: "ledger", msg: "帳簿を、鞄にしまった。" },
      { id: "pen", label: "胸ポケットの、万年筆", at: ["pen", 330, 300, 0.6], when: "!has:pen", gives: "pen", msg: "万年筆を、ポケットにさした。仕事の、道具だ。" },
      { id: "open", label: "帳簿を、もう一度、開く", when: "has:ledger", next: "river_ledger" },
      { id: "rabbit", label: "ウサギを追う", at: ["rabbit", 520, 360, 0.9], when: "has:ledger", next: "hole" },
      { id: "rabbit0", label: "ウサギを追う", at: ["rabbit", 520, 360, 0.9], when: "!has:ledger", sets: "noledger", next: "hole", msg: "帳簿を、ベンチに置いたまま、走っていた。" },
      { id: "wait", label: "ベンチに座ったまま、時計の音を数える", when: "visits:river<3", next: "river", loop: true, msg: "秒針の音。……いや、あれは、自分の鼓動だ。" },
      { id: "wait2", label: "それでも、座ったまま、数えつづける", when: "visits:river>=3", next: "x_river_wait" }
    ]
  },

  river_ledger: {
    zone: "bank", title: "ハートの女王商会 厨房台帳", free: true,
    art: { bg: "river", deco: [["ledger", 320, 380, 1.6]] },
    pages: [
      { text: `**ハートの女王商会 厨房 収支台帳(下半期)**

仕入の欄。小麦粉、バター、木いちご、砂糖。全部を足して、タルト**十二個分**。

製造記録の欄。本日、午後三時。出来高、タルト**七個**。

差額の欄に、アリスの字で、赤く、書きこんである。「**五**」

最後のページは、破りとられていた。

破れた紙の端に、かろうじて、数字が読める。「==六時==」` }
    ],
    options: [
      { id: "close", label: "帳簿を、閉じる", next: "river", free: true }
    ]
  },

  hole: {
    zone: "hole", title: "生け垣の根もとの穴",
    art: { bg: "hole", deco: [] },
    pages: [
      { when: "visits:hole<=1", text: `ウサギは、生け垣の根もとの穴へ、飛びこんだ。

大人が、這って入るには、ずいぶん小さい。それでも、穴の口は、アリスの肩幅に、ぴったり合っていた。

足もとに、何かが落ちている。

壊れた、懐中時計。針は、**六時**で止まっている。` },
      { when: "visits:hole>=2", text: `生け垣の根もとの穴。口は、肩幅に、ぴったり合っている。` },
      { text: `穴の奥から、風が、上がってくる。

古い紙の、においがした。` }
    ],
    options: [
      { id: "watch", label: "壊れた懐中時計", at: ["watch", 250, 400, 1], gives: "watch", msg: "時計は、冷たかった。" },
      { id: "engraving", label: "時計の裏蓋を見る", when: "has:watch", next: "watch_read" },
      { id: "down", label: "穴へ、降りる", next: "fall", at: ["hole", 420, 400, 1] },
      { id: "back", label: "川岸へ、もどる", next: "river" }
    ]
  },

  watch_read: {
    zone: "hole", title: "時計の裏蓋", free: true,
    art: { bg: "hole", deco: [["watch", 320, 400, 1.7]] },
    pages: [
      { text: `裏蓋に、細い字で、刻みがある。

『**L.から、A.へ。遅れても、いいから。**』

アリスは、親指で、その文字をなぞった。

L.。……その頭文字を、アリスは、知っている。

知っているのに、頭の中で、**すぐ、しまいこんだ**。` }
    ],
    options: [
      { id: "close", label: "時計を、握りしめる", next: "hole", free: true }
    ]
  },

  fall: {
    zone: "hole", title: "落ちる道", cost: 2,
    art: { bg: "fall", deco: [] },
    pages: [
      { when: "visits:fall<=1", text: `落ちた。落ちている。いつまでも、落ちている。

壁は、棚だった。棚には、瓶と、地図と、帳簿と、時計が、並んでいる。

(落ちながら、つかめるのは、手の届くものだけ。手は、二本ある。)` },
      { when: "visits:fall>=2", text: `落ちている。棚が、ゆっくり、上へ流れていく。` },
      { text: `下から、暖かい空気が、上がってくる。

時刻の感覚が、うすい。` }
    ],
    options: [
      { id: "orange", label: "「オレンジ・マーマレード」の瓶", at: ["jar", 150, 220, 0.8], gives: "jar", msg: "ふたを開けると、空っぽだった。ラベルだけが、立派だ。" },
      { id: "strawberry", label: "「イチゴジャム」の瓶", at: ["jam", 500, 280, 0.8], next: "fall_jam" },
      { id: "map", label: "壁に貼られた地図", at: ["map", 330, 170, 0.9], next: "fall_map" },
      { id: "down", label: "そのまま、落ちつづける", next: "hall" }
    ]
  },

  fall_jam: {
    zone: "hole", title: "ジャムの瓶", cost: 3,
    art: { bg: "fall", deco: [["jam", 320, 380, 1.6]] },
    pages: [
      { text: `瓶は、半分、中身が入っていた。

指を入れて、なめた。甘い。甘すぎる。**疲れた体に、ありがたい**。

気がつくと、指は、ベタベタ。棚の縁にも、ジャムが、ついた。

……ずいぶん、時間を、かけてしまった。` }
    ],
    options: [
      { id: "close", label: "ハンカチで、指を拭く", next: "fall", free: true }
    ]
  },

  fall_map: {
    zone: "hole", title: "壁の地図", free: true,
    art: { bg: "fall", deco: [["map", 320, 400, 1.7]] },
    pages: [
      { text: `地図は、迷路の絵だった。入口に「**入**」、中央に「**庭**」。

余白に、細い字で、道順が書いてある。

『==二羽の鳩は、そろって飛ぶ。猫は、ひとつ、ふりかえる。鳩が、ひとつ。猫が、ふたつ。==』

その下に、小さく。

『**鳩と猫が、どちらの手か。それは、門の柱に、聞くこと。**』

アリスは、字を、頭に入れた。……入れたつもりだった。` }
    ],
    options: [
      { id: "close", label: "地図から、手を離す", next: "fall", free: true }
    ]
  },

  hall: {
    zone: "hall", title: "扉の広間",
    art: { bg: "hall", deco: [["curtain", 110, 330, 1]] },
    pages: [
      { when: "visits:hall<=1", text: `着いた。広間だった。

天井まで届く、ガラスのテーブル。窓はない。扉が、ぐるりと、並んでいる。みんな、鍵が、かかっている。

ただ、**カーテンの裏の、小さな扉**だけが、少し、開いていた。

高さは、アリスの膝まで。` },
      { when: "visits:hall>=2", text: `扉の広間。窓はない。` },
      { when: "flag:large", text: `天井に、頭が、つかえている。ガラスのテーブルが、腰の高さにある。` },
      { when: "flag:small", text: `ガラスのテーブルが、**断崖**のようだ。小さな扉が、ちょうど、目の高さにある。` },
      { text: `テーブルの上には、鍵と、瓶と、ケーキ。

瓶には、「**私を飲みなさい。ただし、二口まで**」。

ケーキには、「**私を食べなさい。二口まで**」。

アリスは、会計監査人だ。**上限のある数字には、理由がある**ことを、知っていた。` }
    ],
    options: [
      { id: "drinkL", label: "瓶を、飲む", at: ["bottle", 200, 250, 0.85], when: "flag:large", requires: "!n:pu>=2", locked: "瓶は、もう、空っぽだ。", clears: "large", inc: "pu", msg: "体が、すっと、縮んだ。ちょうどいい大きさだ。" },
      { id: "drinkN", label: "瓶を、飲む", at: ["bottle", 200, 250, 0.85], when: "!flag:large && !flag:small", requires: "!n:pu>=2", locked: "瓶は、もう、空っぽだ。", sets: "small", inc: "pu", msg: "世界が、ぐんぐん、大きくなった。" },
      { id: "drinkS", label: "瓶を、飲む", at: ["bottle", 200, 250, 0.85], when: "flag:small", msg: "これ以上、縮んで、どうするのか。" },
      { id: "eatN", label: "ケーキを、食べる", at: ["cake", 440, 250, 0.85], when: "!flag:large && !flag:small", requires: "!n:ce>=2", locked: "ケーキは、もう、かけらしか、残っていない。", sets: "large", inc: "ce", msg: "頭が、天井に、近づいていく。" },
      { id: "eatS", label: "ケーキを、食べる", at: ["cake", 440, 250, 0.85], when: "flag:small", requires: "!n:ce>=2", locked: "ケーキは、もう、かけらしか、残っていない。", clears: "small", inc: "ce", msg: "体が、すこし、もどった。" },
      { id: "eatL", label: "ケーキを、食べる", at: ["cake", 440, 250, 0.85], when: "flag:large", msg: "これ以上、大きくなって、どうするのか。" },
      { id: "key", label: "ガラスのテーブルの上の、鍵", at: ["key", 320, 120, 0.8], when: "!has:key", requires: "flag:large", locked: "手が、届かない。", gives: "key", msg: "鍵は、小さな金色だった。" },
      { id: "door", label: "カーテンの裏の、小さな扉", at: ["door", 110, 400, 0.9], requires: "flag:small && has:key", locked: "扉は、小さい。そして、鍵が、いる。", next: "tears" },
      { id: "giveup", label: "もう、考えたくない。広間の隅に、座りこむ", when: "n:pu>=1 || n:ce>=1", next: "hall_giveup" }
    ]
  },

  hall_giveup: {
    zone: "hall", title: "広間の隅", free: true, lead: true,
    art: { bg: "hall", deco: [] },
    pages: [
      { text: `広間は、静かだ。扉は、全部、閉まっている。

座りこむと、床は、思ったより、あたたかかった。

誰も、来ない。

**急ぐ理由が、ひとつ、なくなった**。` }
    ],
    options: [
      { id: "stay", label: "このまま、座っている", next: "s_hall" },
      { id: "up", label: "立ちあがる", next: "hall", free: true }
    ]
  }
});
