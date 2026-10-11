/* 特別なキャラクターの出番。ふだんは出さない。ヒントは遠まわしに。 */
window.GAME.cameos = {
  gap: 3,
  list: [
    // ── 結末のとき ──
    { id: "fin_true", group: ["hana", "tetsu", "chichi", "tsugi", "cat"], scenes: ["e_true"], kinds: ["true"], always: true, kind: "cheer", lines: ["おかえり、ミミ！"] },
    { id: "fin_happy_tetsu", p: "tetsu", name: "テツ", kinds: ["happy"], chance: 0.35, kind: "cheer", lines: ["任務、完了であります！", "よい寄り道でありました。"] },
    { id: "fin_happy_chichi", p: "chichi", name: "チチ", kinds: ["happy"], chance: 0.3, kind: "cheer", lines: ["ぴい！ よかったね、ミミ！"] },
    { id: "b_rain", p: "snail", name: "かたつむり", scenes: ["b_rain"], kinds: ["bad"], always: true, kind: "sad", lines: ["雨の日は、傘が、いちばんの、ともだちだよ。"] },
    { id: "b_shy", p: "hana_cry", name: "ハナ", scenes: ["b_shy"], kinds: ["bad"], always: true, kind: "sad", lines: ["(窓の向こうから)……ミミ、どこに、いるの。"] },
    { id: "bad_any", p: "tsugi", name: "ツギハギさん", kinds: ["bad", "stuck"], chance: 0.75, kind: "sad", lines: ["……ほつれたら、ひとつ前から、ぬいなおせばいい。"] },
    { id: "loop_any", p: "chichi", name: "チチ", kinds: ["loop"], chance: 0.8, kind: "sad", lines: ["くるくる、まわってるよう。べつの道も、あるよ。"] },

    // ── ヒント ──
    { id: "h_station", p: "tetsu", name: "テツ", scenes: ["station"], when: "!has:ribbon && !flag:soldier_friend", chance: 0.6, kind: "hint", lines: ["この足を、ささえる、ひもか、なにかが、あれば……。"] },
    { id: "h_shop", p: "tsugi", name: "ツギハギさん", scenes: ["shop"], when: "!has:address", chance: 0.6, kind: "hint", lines: ["……町の外へ出るなら、行き先を、知っておかないとね。"] },
    { id: "h_bird", p: "tsugi", name: "ツギハギさん", scenes: ["bird"], when: "!has:key", chance: 0.6, kind: "hint", lines: ["……作業台の引き出しを、見てごらん。"] },
    { id: "h_gate", p: "hana_cry", name: "ハナ", scenes: ["newtown"], when: "!flag:saw_hana", chance: 0.4, kind: "hint", lines: ["(どこかの教室から)……ミミ……。"] },
    { id: "h_river", p: "snail", name: "かたつむり", scenes: ["river"], when: "!has:umbrella", chance: 0.6, kind: "hint", lines: ["(遠くの雨の通りで)あの青い傘、帆に、ちょうどいいのになあ。"] },

    // ── 日常のおしゃべり ──
    { id: "c_snail", p: "snail", name: "かたつむり", zone: "ie", chance: 0.1, kind: "chat", lines: ["きょうも、いい雨だねえ。"] },
    { id: "c_cat", p: "cat", name: "くろねこ", zone: "machi", chance: 0.1, kind: "chat", lines: ["この路地の魚屋は、木曜日がねらいめさ。"] },
    { id: "c_tetsu", p: "tetsu", name: "テツ", zone: "kawa", chance: 0.1, kind: "chat", lines: ["水は、ブリキには、ちと、つめたいであります。"] },
    { id: "c_kid", p: "kid", name: "しらないこ", zone: "shin", chance: 0.06, kind: "chat", lines: ["ねえ、きのう、踏切で、うさぎが手をふってたんだよ。ほんとだよ。"] }
  ]
};
