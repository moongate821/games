/* 特別なキャラクターの出番。ふだんは出さない。ヒントは遠まわしに。 */
window.GAME.cameos = {
  gap: 3,
  list: [
    // ── 結末のとき ──
    { id: "fin_true", group: ["nana", "chuta", "tora", "bobo", "fuwari", "pipo"], scenes: ["e_true"], kinds: ["true"], always: true, kind: "cheer", lines: ["しっぽ亭、ふたたび開店！"] },
    { id: "fin_happy_chuta", p: "chuta", name: "チュー太", kinds: ["happy"], chance: 0.35, kind: "cheer", lines: ["コムギさん、すごいです！", "ホール係、がんばります！"] },
    { id: "fin_happy_tora", p: "tora", name: "トラ親分", kinds: ["happy"], chance: 0.3, kind: "cheer", lines: ["うまい！ さすが、ナナさんの孫だ！"] },
    { id: "b_fire", p: "tora", name: "トラ親分", scenes: ["b_fire", "b_fish"], kinds: ["bad"], always: true, kind: "sad", lines: ["……ひとくち、ひと火。ほどほどが、いちばんだ。"] },
    { id: "bad_any", p: "chuta", name: "チュー太", kinds: ["bad", "stuck"], chance: 0.75, kind: "sad", lines: ["コムギさん、ひとつ前から、やりなおしましょう！", "だいじょうぶ。満月は、また、のぼります。"] },
    { id: "loop_any", p: "pipo", name: "ピポ", kinds: ["loop"], chance: 0.8, kind: "sad", lines: ["グルグル、マワッテマスネ。"] },

    // ── ヒント ──
    { id: "h_street", p: "tora", name: "トラ親分", scenes: ["street"], when: "visits:street>=2 && !has:egg || visits:street>=2 && !has:salt || visits:street>=2 && !has:herb", chance: 0.5, kind: "hint", lines: ["ナナさんは、丘と、海と、森を、ひと回りしてたっけなあ。"] },
    { id: "h_evening", p: "chuta", name: "チュー太", scenes: ["evening"], when: "!has:egg || !has:salt || !has:herb", chance: 0.5, kind: "hint", lines: ["満月オムライスの、材料、ぜんぶ、ありますか？"] },
    { id: "h_farm", p: "kokko", name: "コッコさん", scenes: ["farm"], when: "!has:egg && visits:farm>=2", chance: 0.6, kind: "hint", lines: ["ひよこが、もどってきたら、きっと、ごきげんに、なれるのに……。"] },
    { id: "h_forest", p: "tanuki", name: "たぬき", scenes: ["forest"], when: "!has:herb && visits:forest>=2", chance: 0.6, kind: "hint", lines: ["……ぐう。なにか、食べるものが、あればのう。"] },
    { id: "h_cook", p: "chuta", name: "チュー太", scenes: ["cook"], chance: 0.5, kind: "hint", lines: ["ばあちゃんの火は、いつも、ちいさかったですよね。"] },

    // ── 日常のおしゃべり ──
    { id: "c_chuta", p: "chuta", name: "チュー太", zone: "mise", chance: 0.1, kind: "chat", lines: ["ナプキン、ねこの形に、おれました！"] },
    { id: "c_tora", p: "tora", name: "トラ親分", zone: "ichiba", chance: 0.08, kind: "chat", lines: ["らっしゃい、らっしゃーい！"] },
    { id: "c_tanuki", p: "tanuki", name: "たぬき", zone: "mori", chance: 0.08, kind: "chat", lines: ["ぽんぽこ。"] },
    { id: "c_pipo", p: "pipo", name: "ピポ", zone: "yoru", chance: 0.06, kind: "chat", lines: ["チキュウノ、ツキ、オオキイ。"] }
  ]
};
