/* 特別なキャラクターの出番。ふだんは出さない。ヒントは遠まわしに。 */
window.GAME.cameos = {
  gap: 3,
  list: [
    // ── 結末のとき ──
    { id: "fin_true", group: ["sora", "owl", "bear", "swallow", "wind"], scenes: ["e_true"], kinds: ["true"], always: true, kind: "cheer", lines: ["おかえり、ユキ！"] },
    { id: "fin_happy_owl", p: "owl", name: "ふくろう", kinds: ["happy"], chance: 0.35, kind: "cheer", lines: ["ほう。今年の冬も、よい冬じゃった。", "来年も、おぼえておくよ。"] },
    { id: "fin_happy_swallow", p: "swallow", name: "ツバメ", kinds: ["happy"], chance: 0.3, kind: "cheer", lines: ["春に、また会おうね。"] },
    { id: "b_warm", p: "charcoal", name: "炭焼きのおじいさん", scenes: ["b_warm", "b_melt"], kinds: ["bad"], always: true, kind: "sad", lines: ["……あたたかいものには、ちかづきすぎちゃ、いけないよ。"] },
    { id: "b_pick", p: "swallow", name: "ツバメ", scenes: ["b_pick"], kinds: ["bad"], always: true, kind: "sad", lines: ["花は、咲いている場所で、見てあげるのが、いちばんさ。"] },
    { id: "bad_any", p: "owl", name: "ふくろう", kinds: ["bad", "stuck"], chance: 0.75, kind: "sad", lines: ["ほう。ひとつ前の枝まで、もどってごらん。", "雪は、また、ふる。何度でも、やりなおせる。"] },
    { id: "loop_any", p: "wind", name: "北風", kinds: ["loop"], chance: 0.8, kind: "sad", lines: ["ぐるぐる、まわってるな、ちびすけ。"] },

    // ── ヒント ──
    { id: "h_window", p: "owl", name: "ふくろう", scenes: ["window"], when: "!flag:friend && visits:window>=2", chance: 0.6, kind: "hint", lines: ["(遠くの森から)……窓は、たたかなければ、ひらかんよ。"] },
    { id: "h_forest", p: "owl", name: "ふくろう", scenes: ["forest"], when: "!has:bulb && visits:forest>=2", chance: 0.6, kind: "hint", lines: ["ほう。わしの木のうろに、春を待つものが、しまってある。"] },
    { id: "h_last", p: "sora", name: "ソラ", scenes: ["lastnight"], when: "!has:bell || !has:bulb || !flag:wind_calm", chance: 0.6, kind: "hint", lines: ["ユキ、森で見た宝物、ぜんぶ、もってきてくれた？"] },
    { id: "h_pass", p: "swallow", name: "ツバメ", scenes: ["thaw"], when: "!flag:wind_calm", chance: 0.4, kind: "hint", lines: ["今年は、春が、はやいみたいだね。北風が、のんびりしてないから。"] },

    // ── 日常のおしゃべり ──
    { id: "c_sora", p: "sora", name: "ソラ", zone: "yuki", chance: 0.1, kind: "chat", lines: ["きょうの雪、ふわふわだね。"] },
    { id: "c_bear", p: "bear", name: "くま", zone: "mori", chance: 0.08, kind: "chat", lines: ["……むにゃ。はちみつ……。"] },
    { id: "c_swallow", p: "swallow", name: "ツバメ", zone: "haru", chance: 0.1, kind: "chat", lines: ["南は、もう、さくらが、散ったよ。"] },
    { id: "c_wind", p: "wind", name: "北風", zone: "yakusoku", chance: 0.06, kind: "chat", lines: ["……ふん。もうすこしだけ、冬にしておいてやる。"] }
  ]
};
