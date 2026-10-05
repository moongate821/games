/* 特別なキャラクターの出番。ふだんは出さない。ヒントは遠まわしに。 */
window.GAME.cameos = {
  gap: 3,
  list: [
    // ── 結末のとき ──
    { id: "fin_true", group: ["dog", "monkey", "pheasant", "oni_child", "grandma"], scenes: ["e_true"], kinds: ["true"], always: true, kind: "cheer", lines: ["分けるほど、ふえたね！"] },
    { id: "fin_happy_dog", p: "dog", name: "犬", kinds: ["happy"], chance: 0.35, kind: "cheer", lines: ["わん！ よい結末でございました！", "ほかの道の、においもしますよ。"] },
    { id: "fin_happy_monkey", p: "monkey", name: "猿", kinds: ["happy"], chance: 0.3, kind: "cheer", lines: ["へへっ、やるじゃないか。", "まだ、ほかの結末もあるぜ。"] },
    { id: "b_dango", p: "grandma", name: "おばあさん", scenes: ["b_dango"], kinds: ["bad"], always: true, kind: "sad", lines: ["だんごはね、分けると、ふえるんだよ。"] },
    { id: "b_child", p: "oni_child", name: "鬼の子", scenes: ["b_child"], kinds: ["bad"], always: true, kind: "sad", lines: ["……おなか、すいてただけなのに。"] },
    { id: "b_storm", p: "pheasant", name: "雉", scenes: ["b_storm"], kinds: ["bad"], always: true, kind: "sad", lines: ["嵐のときは、くっつきあうのです。ひとりで立たないで。"] },
    { id: "bad_any", p: "dog", name: "犬", kinds: ["bad", "stuck"], chance: 0.75, kind: "sad", lines: ["ひとつ前の分かれ道へ、もどってみましょう。", "においを、たどりなおせば、だいじょうぶです。"] },
    { id: "loop_any", p: "monkey", name: "猿", kinds: ["loop"], chance: 0.8, kind: "sad", lines: ["おいおい、同じところを、ぐるぐるだぜ。"] },

    // ── ヒント ──
    { id: "h_village", p: "elder", name: "長老", scenes: ["village"], when: "!flag:listened && visits:village>=2", chance: 0.6, kind: "hint", lines: ["鬼ヶ島のむかし話、聞きに来んかね。"] },
    { id: "h_road", p: "dog", name: "白い犬", scenes: ["road"], when: "!flag:dog && !flag:monkey && !flag:pheasant && visits:road>=2", chance: 0.6, kind: "hint", lines: ["くんくん……いいにおいの、つつみ……。"] },
    { id: "h_bridge", p: "pheasant", name: "雉", scenes: ["bridge"], when: "flag:dog && flag:monkey", chance: 0.5, kind: "hint", lines: ["この橋は、みんなで心をそろえないと、わたれませんよ。"] },
    { id: "h_field", p: "grandpa", name: "おじいさん", scenes: ["field"], when: "!flag:planted", chance: 0.5, kind: "hint", lines: ["(お守り袋のなかから、声がした気がする)桃の木は、まいた場所を、しあわせにする……。"] },
    { id: "h_talk", p: "oni_child", name: "鬼の子", scenes: ["talk"], when: "!flag:oni_friend", chance: 0.6, kind: "hint", lines: ["(戸のすきまから)……あまい、においの、にんげん……。"] },
    { id: "h_gate", p: "monkey", name: "猿", scenes: ["gate_oni"], when: "visits:gate_oni>=2", chance: 0.6, kind: "hint", lines: ["たたくなら、名のりもわすれずにな。"] },

    // ── 日常のおしゃべり ──
    { id: "c_grandpa", p: "grandpa", name: "おじいさん", zone: "mura", chance: 0.1, kind: "chat", lines: ["きょうは、山で、ウグイスが鳴いたよ。"] },
    { id: "c_pheasant", p: "pheasant", name: "雉", zone: "michi", chance: 0.1, kind: "chat", lines: ["上から見ると、田んぼは、将棋の盤のようです。"] },
    { id: "c_fisher", p: "fisher", name: "漁師", zone: "umi", chance: 0.1, kind: "chat", lines: ["カモメが低く飛ぶ日は、雨になるぞ。"] },
    { id: "c_oni", p: "oni_blue", name: "青鬼", zone: "shima", chance: 0.08, kind: "chat", lines: ["……角が、かゆい。"] }
  ]
};
