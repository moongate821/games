/* 特別なキャラクターの出番(書き方は engine/README.md と アリスの cameos.js を参照)。ふだんは出さない。ヒントは遠まわしに。 */
window.GAME.cameos = {
  gap: 3,
  list: [
    // ── 結末のとき ──
    { id: "fin_true", group: ["fox", "rose", "sheep", "pilot", "bird"], scenes: ["e_true"], kinds: ["true"], always: true, kind: "cheer", lines: ["星が、ぜんぶ、笑ってるよ。"] },
    { id: "fin_happy_fox", p: "fox", name: "キツネ", kinds: ["happy"], chance: 0.35, kind: "cheer", lines: ["いい夕日だったね。", "ほかの夕日も、さがしてごらん。"] },
    { id: "fin_happy_rose", p: "rose", name: "バラ", kinds: ["happy"], chance: 0.3, kind: "cheer", lines: ["……べつに、うれしくなんか、ないけれど。", "まあまあね。"] },
    { id: "b_sheep", p: "pilot", name: "飛行士", scenes: ["b_sheep"], kinds: ["bad"], always: true, kind: "sad", lines: ["羊の絵を描くとき、もう一枚、描いてあげればよかったな…。"] },
    { id: "b_quarrel", p: "fox", name: "キツネ", scenes: ["b_quarrel"], kinds: ["bad"], always: true, kind: "sad", lines: ["ことばは、行きちがいのもとさ。花のしていることを、見てごらん。"] },
    { id: "b_baobab", p: "sheep", name: "羊", scenes: ["b_baobab"], kinds: ["bad"], always: true, kind: "sad", lines: ["めえ。芽のうちなら、ぼくでも、食べられたのに。"] },
    { id: "bad_any", p: "bird", name: "わたり鳥", kinds: ["bad", "stuck"], chance: 0.75, kind: "sad", lines: ["ひとつ前の分かれ道へ、もどってごらん。", "糸は、まだ、ここにあるよ。"] },
    { id: "loop_any", p: "littlestar", name: "小さな星", kinds: ["loop"], chance: 0.8, kind: "sad", lines: ["くるくる、まわってるね。ちがうほうへも、行けるよ。"] },

    // ── ヒント(困っていそうなとき) ──
    { id: "h_sunset", p: "rose", name: "バラ", scenes: ["sunset"], when: "!flag:rose_dome || !flag:rose_screen", chance: 0.5, kind: "hint", lines: ["夜の風って、つめたいわね。……ひとりごとよ。"] },
    { id: "h_space", p: "bird", name: "わたり鳥", scenes: ["space"], when: "!flag:told_earth && !has:letter && visits:space>=2", chance: 0.7, kind: "hint", lines: ["物知りの学者さんか、えらい王さま。どちらかに聞けば、青い星への道がわかるよ。"] },
    { id: "h_garden", p: "fox", name: "キツネ", scenes: ["garden"], when: "!flag:tamed", chance: 0.5, kind: "hint", lines: ["(りんごの木の下から)…泣いている声がするね。"] },
    { id: "h_pilot", p: "sheep", name: "羊", scenes: ["pilot"], when: "has:sheep_box && !has:muzzle", chance: 0.7, kind: "hint", lines: ["めえ。ぼく、なんでも、食べちゃうよ。トゲがあっても。"] },
    { id: "h_wall", p: "fox", name: "キツネ", scenes: ["wall"], when: "!flag:shared_water || !has:muzzle", chance: 0.6, kind: "hint", lines: ["持っていくものは、そろったかい。ふたりで飲んだ水も、だよ。"] },
    { id: "h_fox", p: "littlestar", name: "小さな星", scenes: ["fox"], when: "visits:fox<=2", chance: 0.4, kind: "hint", lines: ["しんぼう、しんぼう。きのうと、同じ時刻にね。"] },

    // ── 日常のおしゃべり(めったに出ない) ──
    { id: "c_sheep", p: "sheep", name: "羊", zone: "home", chance: 0.1, kind: "chat", lines: ["めえ。この箱、けっこう、いごこちがいいよ。"] },
    { id: "c_bird", p: "bird", name: "わたり鳥", zone: "trip", chance: 0.1, kind: "chat", lines: ["星と星のあいだは、思ったより、風が、すずしいんだ。"] },
    { id: "c_snake", p: "snake", name: "ヘビ", zone: "earth", chance: 0.08, kind: "chat", lines: ["砂は、あたたかい。昼のうちはね。"] },
    { id: "c_star", p: "littlestar", name: "小さな星", zone: "night", chance: 0.1, kind: "chat", lines: ["きょうは、よく見えるでしょう。ぼく、ちょっと、おしゃれしたんだ。"] },
    { id: "c_fox", p: "fox", name: "キツネ", zone: "earth", chance: 0.08, kind: "chat", lines: ["木曜日はね、とても、いい日なんだよ。"] }
  ]
};
