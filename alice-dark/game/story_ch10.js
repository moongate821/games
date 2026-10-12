/* 第10章: ハートの法廷
 * 四つの証明(pf): 帳簿(十二個は、そもそも、存在しない) / 証人の論理(嘘をつくのは、犯人だけ → 女王) / 詩の頭文字(わたしがたべた) / 証拠品の棚(白い傘で背が伸びていれば届く)
 * 三つそろえば、女王を告発できる。ただし、女王の「許し」(queen_ok)がなければ、口を開いた途端に首が飛ぶ。
 * 真の結末には、t1(時計の紙片) と t2(秘密の庭の手紙) も、いる。 */
Object.assign(window.GAME.scenes, {

  bell: {
    zone: "court", title: "鐘", immune: true,
    art: { bg: "court", deco: [] },
    pages: [{ text: `**鐘が、鳴っている。**

ひとつ。ふたつ。**数えなくても、わかる。六つ、鳴る。**

庭が、折りたたまれていく。薔薇も、兵隊も、トランプのように、ぱたぱたと、閉じていった。

アリスの足もとに、赤い絨毯が、のびた。その先に、**扉**。

「**法廷が、はじまる**」

どこかで、誰かが、言った。` }],
    options: [
      { id: "go", label: "扉を、あける", next: "court" },
      { id: "run", label: "背を向けて、走りだす", next: "x_bell_run" }
    ]
  },

  court: {
    zone: "court", title: "ハートの法廷",
    art: { bg: "court", deco: [["king", 470, 280, 0.9], ["queen", 560, 330, 0.9], ["knave", 120, 400, 0.9]] },
    pages: [
      { when: "visits:court<=1", text: `法廷は、トランプの城の、広間だった。

玉座に、ハートの王と、女王。陪審員は、十二匹の、小さな生き物。ひとり、石板で、ことばを数えている。

被告席に、**ハートのジャック**。鎖で、つながれている。

「**十二個の、タルトを、盗んだ罪**」と、王が、読みあげた。

女王が、アリスのほうを、見た。「**会計監査人**。数字の専門家だ。……数字は、嘘をつかぬ、そうだな?」` },
      { when: "visits:court>=2", text: `ハートの法廷。陪審員たちは、まだ、石板に、何か、書いている。` },
      { text: `(四つの、確かめるべきこと。**帳簿の数**。**証人たちの言い分**。**詩**。**証拠品の棚**。)

時計の針は、六時を、指している。` }
    ],
    options: [
      { id: "led", label: "帳簿を、提出する", at: ["ledger", 120, 330, 0.7], when: "!flag:pf_led", requires: "has:ledger", locked: "帳簿が、ない。", next: "court_ledger" },
      { id: "wit", label: "証人たちの言い分を、聞く", when: "!flag:pf_log", next: "court_wit" },
      { id: "verse", label: "王の読む、詩を聞く", when: "!flag:pf_verse", next: "court_verse" },
      { id: "shelf", label: "証拠品の棚を、見る", when: "!flag:pf_shelf", requires: "flag:large", locked: "棚は、天井近くにある。背が、とても足りない。(体が大きければ、届くかもしれない)", next: "court_shelf" },
      { id: "eatW", label: "白い傘のキノコを、かじる", when: "has:mushWhite", takes: "mushWhite", sets: "large", clears: "small", msg: "体が、ぐんぐん、伸びた。天井に、頭が、つきそうだ。" },
      { id: "eatR", label: "赤い傘のキノコを、かじる", when: "has:mushRed", takes: "mushRed", sets: "small", clears: "large", msg: "体が、縮んだ。" },
      { id: "say", label: "証言台に、立つ", at: ["stand", 330, 420, 0.9], next: "court_testify" }
    ]
  },

  court_ledger: {
    zone: "court", title: "帳簿の提出", cost: 1,
    art: { bg: "court", deco: [["ledger", 330, 400, 1.6]] },
    pages: [{ text: `アリスは、帳簿を、陪審員に、見せた。

「**材料は、十二個ぶん、買われています**。ですが、**焼かれたのは、七つ**です。鍋の都合で。料理人の証言も、あります」

「**十二個、盗まれた**というのは、数字の上で、**ありえません**。盗まれる**はず**の五つは、**そもそも、存在しなかった**」

王が、帳簿を、逆さに持った。

「……それは、**つまり**」と、王。

「**盗まれたのは、多くて、七つ**。そして、**七つは、盆に載って、広間にあった**」

ざわめきが、起きた。女王の扇が、とまった。` }],
    options: [{ id: "on", label: "帳簿を、閉じる", sets: "pf_led", inc: "pf", next: "court" }]
  },

  court_wit: {
    zone: "court", title: "五人の証人", free: true,
    art: { bg: "court", deco: [["hatter", 150, 400, 0.8], ["queen", 560, 330, 0.8]] },
    pages: [{ text: `証人は、五人。ナイト、帽子屋、三月ウサギ、料理人、女王。

書記が、石板を、持って、言う。「**この中で、嘘をついているのは、犯人ただひとり**。ほかの者は、**全員、本当のことを、言っている**」

**ナイト**「犯人は、帽子屋か、女王の、どちらかだ」

**帽子屋**「料理人は、犯人では、ない」

**三月ウサギ**「犯人は、帽子屋か、女王の、どちらかだ」

**料理人**「**女王は、嘘つきだ**」

**女王**「犯人は、**ナイト**だ」

「さて」と、書記。「**犯人は、誰だ**」` }],
    options: [
      { id: "k", label: "ナイト", next: "court_wit_wrong" },
      { id: "h", label: "帽子屋", next: "court_wit_wrong" },
      { id: "m", label: "三月ウサギ", next: "court_wit_wrong" },
      { id: "c", label: "料理人", next: "court_wit_wrong" },
      { id: "q", label: "女王", next: "court_wit_ok" },
      { id: "no", label: "もう一度、整理する", next: "court", free: true }
    ]
  },

  court_wit_wrong: {
    zone: "court", title: "矛盾", cost: 1,
    art: { bg: "court", deco: [["queen", 560, 330, 0.8]] },
    pages: [{ text: `アリスが、そう言うと、書記は、石板を、見なおした。

「……それだと、**誰かの言葉が、嘘と、本当の、あいだで、ぶつかる**」

(犯人だけが、嘘をつく。**犯人でない者の言葉は、全部、本当**。**ひとりずつ、犯人に、仮定して、確かめる**。)` }],
    options: [{ id: "back", label: "考えなおす", next: "court" }]
  },

  court_wit_ok: {
    zone: "court", title: "女王の嘘", cost: 1,
    art: { bg: "court", deco: [["queen", 560, 330, 0.8]] },
    pages: [{ text: `アリスは、順に、説明した。

「帽子屋が犯人なら、**帽子屋の言葉『料理人は犯人でない』は嘘**でなければならない。ですが、それは、**本当**です。矛盾です」

「料理人が犯人なら、帽子屋の言葉は嘘になる。でも、帽子屋は犯人でない。矛盾です」

「ナイトが犯人なら、女王は嘘をつかないので、女王の『ナイトが犯人』は本当。すると、料理人の『女王は嘘つき』が嘘になりますが、料理人は犯人では、ありません。矛盾です」

「三月ウサギが犯人なら、ナイトの『犯人は帽子屋か女王』が嘘になります。ナイトは犯人では、ありません。矛盾です」

「**女王が犯人なら**、女王の『ナイトが犯人』は嘘。ほかの、四人の言葉は、全部、本当。**矛盾は、ありません**」

法廷が、静まった。女王の顔は、**赤から、白へ**、変わった。` }],
    options: [{ id: "on", label: "席にもどる", sets: "pf_log", inc: "pf", next: "court" }]
  },

  court_verse: {
    zone: "court", title: "詩", free: true,
    art: { bg: "court", deco: [["king", 330, 330, 1.2]] },
    pages: [{ text: `王が、羊皮紙を、読みあげる。

「**わたしは 台所へ 午後に行った**」
「**たくさんの 皿が 並んでいた**」
「**しずかな 広間に 盆があった**」
「**がまんは、いつも 六時までだった**」
「**たいせつな ものは 甘かった**」
「**べつに、誰にも 言わなくていい**」
「**たとえば 赤い 嘘を ひとつ**」

「……意味が、わからぬな」と、王は、言った。

「**詩は、意味のためでは、なく、並びのために、ある**」と、誰かが、つぶやいた。

アリスは、行の**頭**だけを、順に、目で追った。` }],
    options: [
      { id: "v1", label: "「わ・た・し・が・た・べ・た」(わたしが、たべた)", sets: "pf_verse", inc: "pf", next: "court_verse_ok" },
      { id: "v2", label: "「わ・た・し・が・た・べ・る」(わたしが、たべる)", next: "court_verse_wrong" },
      { id: "v3", label: "「あたしがたべた」", next: "court_verse_wrong" },
      { id: "v4", label: "「意味の、ない詩です」", next: "court_verse_wrong" },
      { id: "no", label: "いったん、席にもどる", next: "court", free: true }
    ]
  },

  court_verse_wrong: {
    zone: "court", title: "読みちがい", cost: 1,
    art: { bg: "court", deco: [["king", 330, 330, 1.2]] },
    pages: [{ text: `王は、首を、ひねった。

「……そうかな? そうは、読めぬが」

(各行の、**最初の一文字**を、一行目から、順番に。**数えまちがえやすい**。)` }],
    options: [{ id: "back", label: "もう一度、読む", next: "court_verse" }]
  },

  court_verse_ok: {
    zone: "court", title: "わたしが、たべた", cost: 1,
    art: { bg: "court", deco: [["king", 330, 330, 1.2], ["queen", 560, 330, 0.9]] },
    pages: [{ text: `「**わ・た・し・が・た・べ・た**」

アリスが、そう読むと、法廷が、凍った。

王が、ゆっくりと、羊皮紙を、女王に、向けた。

「……この詩の、筆跡は、わたしの、**妻**のものだ」

「**ち、ちがう**」と、女王は、言った。「**わたしは、食べて、いない。わたしは、数えて、いただけ**」

女王の手が、震えていた。**赤いペンキの、においが、した。**` }],
    options: [{ id: "on", label: "黙って、見ている", next: "court" }]
  },

  court_shelf: {
    zone: "court", title: "証拠品の棚", cost: 1,
    art: { bg: "court", deco: [["shelf", 330, 430, 1.1]] },
    pages: [{ text: `体を伸ばして、棚の、いちばん上に、手が、届いた。

銀の盆。その上に、**七枚の、空の、タルト型**。型の縁に、**赤い口紅の跡**。

盆の下に、**ハートの紋の、ハンカチ**。端に、小さな刺繍。

**「R」**。

王が、盆を、のぞいた。「……七つ。……十二では、ない」

ハンカチを、持つ手が、**女王の、手**と、**同じ、指輪**だった。` }],
    options: [{ id: "on", label: "盆を、おろす", sets: "pf_shelf", inc: "pf", next: "court" }]
  },

  court_testify: {
    zone: "court", title: "証言台", free: true,
    art: { bg: "court", deco: [["stand", 330, 400, 1]] },
    pages: [
      { when: "!flag:queen_ok", text: `アリスは、証言台に、立った。

口を、開こうとして、女王の目と、合った。

女王の指が、**ゆっくりと**、首の、前を、横切った。` },
      { when: "flag:queen_ok", text: `アリスは、証言台に、立った。

女王が、**ほんの一瞬**、うなずいたように、見えた。庭で、与えた、許しが、まだ、生きている。

(あとは、**何を言うか**。)` }
    ],
    options: [
      { id: "noperm", label: "それでも、口を、開く", when: "!flag:queen_ok", next: "x_court_noperm" },
      { id: "step", label: "証言台から、降りる", next: "court", free: true },
      { id: "queen", label: "「犯人は、女王陛下です」", when: "flag:queen_ok", next: "court_accuse" },
      { id: "knave", label: "「ナイトに、罪が、あると思います」", when: "flag:queen_ok", next: "court_agree" },
      { id: "silent", label: "何も言わずに、帳簿を、閉じる", when: "flag:queen_ok", next: "x_court_silent" },
      { id: "lie", label: "「帳簿は、十二個で、合っています」と言い、署名する", when: "flag:queen_ok && has:pen", next: "x_court_lie" },
      { id: "no", label: "「いいえ」", when: "flag:queen_ok", next: "x_queen_no" }
    ]
  },

  court_accuse: {
    zone: "court", title: "指をさす", lead: true, free: true,
    art: { bg: "court", deco: [["queen", 470, 330, 1.4]] },
    pages: [
      { when: "!n:pf>=3", text: `法廷が、静まった。

アリスは、息を、吸った。(**まだ、足りない。**証拠が、三つ、そろっていない。)` },
      { when: "n:pf>=3", text: `法廷が、静まった。

アリスは、息を、吸った。(**三つ、そろっている。**)` }
    ],
    options: [
      { id: "fA", label: "言い切る", when: "n:pf>=3 && flag:t1 && flag:t2", next: "court_win" },
      { id: "fB", label: "言い切る", when: "n:pf>=3 && !flag:t1", next: "h_audit" },
      { id: "fC", label: "言い切る", when: "n:pf>=3 && flag:t1 && !flag:t2", next: "h_audit" },
      { id: "fD", label: "言い切る", when: "!n:pf>=3", next: "b_verdict" },
      { id: "back", label: "言うのを、やめる", next: "court_testify", free: true }
    ]
  },

  court_agree: {
    zone: "court", title: "言葉を、選ぶ", lead: true, free: true,
    art: { bg: "court", deco: [["knave", 330, 400, 1.2]] },
    pages: [{ text: `ナイトは、鎖の中で、顔をあげた。

アリスは、ナイトと、目が、合った。ナイトは、**ほんの少し、うなずいた**。

(**本当に、そう、思うのか。**)

陪審員たちが、石板に、**判決**を、書きはじめている。` }],
    options: [
      { id: "ok", label: "「……はい」", next: "n_jury" },
      { id: "back", label: "言葉を、のみこむ", next: "court_testify", free: true }
    ]
  },

  court_win: {
    zone: "court", title: "崩れる法廷", cost: 1,
    art: { bg: "court", deco: [["queen", 470, 330, 1.4]] },
    pages: [{ text: `「**帳簿によれば**、十二個は、はじめから、存在しません」

「**証人の言い分に**、矛盾なく、当てはまる、嘘つきは、ひとりだけです」

「**詩を、頭から読めば**、書いたのは、あなた自身だと、わかります」

「**盆の上の、口紅と、ハンカチ**は、あなたの、ものです」

アリスは、女王を、まっすぐ、見た。

「**数字は、嘘を、つきません**。ですが、**数字を、書いた人は、つきます**。……わたしも、含めて」

女王は、**何も、言わなかった**。

女王の顔の、赤が、ゆっくりと、**はがれて**いった。下から、**白い、顔**が、出てきた。

法廷が、**折りたたまれて**いく。トランプのように、ぱたぱたと。

「**六時に、なりました**」と、誰かが、言った。` }],
    options: [{ id: "on", label: "目を、閉じる", next: "six" }]
  }
});
