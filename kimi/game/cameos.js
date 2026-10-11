/* 特別なキャラクターの出番。ふだんは出さない。ヒントは遠まわしに。 */
window.GAME.cameos = {
  gap: 3,
  list: [
    { id: "fin_true", group: ["ryo", "yui", "kotone", "tomoko", "takahashi"], scenes: ["e_true"], kinds: ["true"], always: true, kind: "cheer", lines: ["あなたに、逢うために。"] },
    { id: "fin_happy_yui", p: "yui", name: "結衣", kinds: ["happy"], chance: 0.35, kind: "cheer", lines: ["ありがとう。会えて、よかった。", "また、ギター、聴いてね。"] },
    { id: "fin_happy_takahashi", p: "takahashi", name: "高橋", kinds: ["happy"], chance: 0.3, kind: "cheer", lines: ["お前ら、ほんと、手がかかるな。"] },
    { id: "b_anzai", p: "anzai", name: "安西", scenes: ["b_anzai"], kinds: ["bad"], always: true, kind: "sad", lines: ["『規則は、規則ですので』"] },
    { id: "bad_any", p: "oldman", name: "電車の老人", kinds: ["bad", "stuck"], chance: 0.75, kind: "sad", lines: ["約束は、時間にするもんじゃない。人にするもんだ。", "もう一つ前の道へ、戻ってごらん。"] },
    { id: "loop_any", p: "tomoko", name: "母さん", kinds: ["loop"], chance: 0.8, kind: "sad", lines: ["……遼？ どうしたの、ぼうっとして。"] },
    { id: "h_clinic", p: "yui", name: "結衣", scenes: ["clinic"], when: "!has:okusuri", chance: 0.6, kind: "hint", lines: ["(遠くから)……手帳、持ってないと、また忘れちゃう。"] },
    { id: "h_shop", p: "tomoko", name: "母さん", scenes: ["shop"], when: "!has:glass", chance: 0.6, kind: "hint", lines: ["(奥から)……宝箱の、緑色のもの、見てみたら。"] },
    { id: "h_fireworks", p: "yui", name: "結衣", scenes: ["fireworks"], when: "!has:usagi", chance: 0.6, kind: "hint", lines: ["(屋台の前で)……このうさぎ、可愛くない？"] },
    { id: "h_dorm", p: "kotone", name: "琴音", scenes: ["dorm"], when: "!flag:proof", chance: 0.6, kind: "hint", lines: ["証拠が、ないと、会議は、始められません。"] },
    { id: "c_yui", p: "yui", name: "結衣", zone: "kou", chance: 0.1, kind: "chat", lines: ["〜♪(鼻歌)"] },
    { id: "c_kashiwagi", p: "kashiwagi", name: "柏木先生", zone: "oto", chance: 0.08, kind: "chat", lines: ["ピアノの調律は、終わったぞ。"] },
    { id: "c_shizuka", p: "shizuka", name: "静香", zone: "dai", chance: 0.08, kind: "chat", lines: ["無理は、しないでね。"] }
  ]
};
