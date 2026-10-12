/* 第5章: 公爵夫人の家 ── 胡椒の台所 / チェシャ猫
 * 謎: 胡椒(扇があれば風でよける。なければ、一度だけ息を止めて入れる。二度目はくしゃみで終わる) / 猫の論理(犬と逆) → 迷路の暗号「鳩=右の翼、猫=左の耳」
 * 手がかり: 料理人「十二個分の材料を買ったが、鍋の都合で七つしか焼けなかった」 */
Object.assign(window.GAME.scenes, {

  duchess: {
    zone: "duchess", title: "公爵夫人の家",
    art: { bg: "duchess", deco: [["cat", 500, 120, 0.9]] },
    pages: [
      { when: "visits:duchess<=1", text: `右の道を行くと、煙の匂いが、した。

公爵夫人の家は、煙突から、胡椒の煙を、吐いていた。窓は、全部、涙目で曇っている。

玄関のまわりに、割れた皿の破片が、散っている。どこかで、赤ん坊が、泣き、くしゃみが、聞こえる。` },
      { when: "visits:duchess>=2", text: `公爵夫人の家。煙突の胡椒の煙は、まだ、出ている。` },
      { text: `屋根の上に、**にやにや笑い**だけが、浮いている。` }
    ],
    options: [
      { id: "kfan", label: "扇をひろげて、台所へ入る", when: "has:fan", next: "kitchen" },
      { id: "kplain", label: "息を止めて、台所へ入る", when: "!has:fan", next: "kitchen_pep" },
      { id: "cat", label: "屋根の上の、にやにや笑い", at: ["cat", 500, 120, 0.9], next: "cheshire" },
      { id: "back", label: "分かれ道へ、もどる", next: "crossroads" }
    ]
  },

  kitchen: {
    zone: "duchess", title: "胡椒の台所(風のなか)",
    art: { bg: "kitchen", deco: [["cook", 400, 400, 1]] },
    pages: [{ text: `扇で、風を起こしながら、台所へ入った。胡椒の霧が、アリスの前で、ふたつに割れる。

大鍋の前に、料理人。皿を、投げている。

「タルトかい。**七つ**、焼いたよ。**午後三時**に。盆に載せて、広間に出した。それっきりさ!」

「十二個分の材料? ああ、買ったさ。女王陛下が、**十二個**作れ、とおっしゃったからね。でも、鍋の都合で、**七つ**しか焼けなかった」

(帳簿の、五。……材料の、五個ぶんは、使われなかった。使われなかったものは、盗まれてもいない。)` }],
    options: [{ id: "out", label: "台所を、出る", next: "duchess" }]
  },

  kitchen_pep: {
    zone: "duchess", title: "胡椒の台所", enter: { inc: "pepper" },
    art: { bg: "kitchen", deco: [["cook", 400, 400, 1]] },
    pages: [
      { when: "!n:pepper>=2", text: `息を止めて、入った。……五秒で、涙が出た。

胡椒は、目にも、喉にも、刺さる。大鍋の前に、料理人。皿を、投げている。

「タルトかい。**七つ**、焼いたよ。**午後三時**に。盆に載せて、広間に出した。それっきりさ!」

「十二個分の材料? ああ、買ったさ。女王陛下が、**十二個**作れ、とおっしゃったからね。でも、鍋の都合で、**七つ**しか焼けなかった」

(帳簿の、五。……材料の、五個ぶんは、使われなかった。使われなかったものは、盗まれてもいない。)` },
      { when: "n:pepper>=2", text: `二度目だった。

息を止める前に、鼻が、むずむずした。むずむずが、胸まで、おりてくる。

台所の床が、ぐらりと、傾いた。` }
    ],
    options: [
      { id: "out", label: "台所を、出る", when: "!n:pepper>=2", next: "duchess" },
      { id: "sneeze", label: "……はっ", when: "n:pepper>=2", next: "b_pepper" }
    ]
  },

  cheshire: {
    zone: "duchess", title: "チェシャ猫",
    art: { bg: "duchess", deco: [["cat", 320, 250, 1.4]] },
    pages: [
      { when: "!flag:legend", text: `屋根の上に、笑いだけが、浮いていた。

笑いが、だんだん、猫の形になる。「やあ、監査人」

「ここの者は、みんな、狂っている。**わたしも**。……証明しようか」` },
      { when: "flag:legend", text: `屋根の上に、すこしだけ、笑いが、残っている。` }
    ],
    options: [
      { id: "ask", label: "証明を、聞く", when: "!flag:legend", next: "cheshire_q" },
      { id: "follow", label: "猫に、ついていく", when: "flag:legend", next: "x_cat_follow" },
      { id: "back", label: "家の前へ、もどる", next: "duchess", free: true }
    ]
  },

  cheshire_q: {
    zone: "duchess", title: "狂っている証明", free: true,
    art: { bg: "duchess", deco: [["cat", 320, 250, 1.4]] },
    pages: [{ text: `「犬は、怒ると、**唸る**。喜ぶと、**尾を振る**」

猫は、しっぽを、ゆらゆら、振っている。

「わたしは、**喜ぶと唸り、怒ると尾を振る**。つまり、犬とは、逆だ」

「さて、いま、わたしは、尾を**振っている**。**わたしは、怒っているか? 喜んでいるか?**」` }],
    options: [
      { id: "angry", label: "「怒っています」", sets: "legend", next: "cheshire_ok" },
      { id: "glad", label: "「喜んでいます」", next: "cheshire_wrong" },
      { id: "same", label: "「犬と同じだから、喜んでいる」", next: "cheshire_wrong" },
      { id: "mad", label: "「狂っているから、答えはありません」", next: "cheshire_wrong" }
    ]
  },

  cheshire_wrong: {
    zone: "duchess", title: "にやり", cost: 1,
    art: { bg: "duchess", deco: [["cat", 320, 250, 1.4]] },
    pages: [{ text: `猫は、にやりと、した。

「ちがう。……残念。頭のなかで、もう一度、並べなおしてごらん」

(犬のきまりと、猫のきまり。**どちらが、どちらか。**)` }],
    options: [{ id: "back", label: "考えなおす", next: "cheshire" }]
  },

  cheshire_ok: {
    zone: "duchess", title: "ご名答", cost: 1,
    art: { bg: "duchess", deco: [["cat", 320, 250, 1.4]] },
    pages: [{ text: `「ご名答。……狂っていても、筋は、通る」

猫は、満足そうに、体を薄くした。

「ほうびに、庭の話を、してやろう。迷路の入口の、二本の門柱に、紋がある。」

「**鳩は、右の翼。猫は、左の耳。**」

「それだけだ」

猫は、消えた。笑いだけが、すこしのあいだ、残った。` }],
    options: [{ id: "on", label: "笑いの残りを、見送る", next: "duchess" }]
  }
});
