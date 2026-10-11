/* 特別なキャラクターの出番。ふだんは出さない。ヒントは遠まわしに。 */
window.GAME.cameos = {
  gap: 3,
  list: [
    { id: "fin_true", group: ["sazuki", "sayo", "rojin", "grandpa", "mio", "gtsuki"], scenes: ["e_true"], kinds: ["true"], always: true, kind: "cheer", lines: ["翡翠の約束は、続いていく。"] },
    { id: "fin_happy_rojin", p: "rojin", name: "老人", kinds: ["happy"], chance: 0.35, kind: "cheer", lines: ["うむ。よい選びじゃ。", "源一郎も、きっと笑っておる。"] },
    { id: "fin_happy_sayo", p: "sayo", name: "小夜", kinds: ["happy"], chance: 0.3, kind: "cheer", lines: ["ありがとう、湊。"] },
    { id: "b_kuroj", p: "kokujin", name: "黒迅", scenes: ["b_shrine", "b_bandit"], kinds: ["bad"], always: true, kind: "sad", lines: ["……まだ足りん。"] },
    { id: "bad_any", p: "rojin", name: "老人", kinds: ["bad", "stuck"], chance: 0.75, kind: "sad", lines: ["ふむ。ひとつ前の場所まで、もどってみよ。", "焦るでない。時は、巡る。"] },
    { id: "loop_any", p: "gtsuki", name: "初代月守", kinds: ["loop"], chance: 0.8, kind: "sad", lines: ["『ぐるぐる、まわっていますね』"] },
    { id: "h_study", p: "sazuki", name: "紗月", scenes: ["school"], when: "!has:hisui || !has:diary", chance: 0.5, kind: "hint", lines: ["(遠くから)……天城くんの家の、木箱。それと、おじいさんの、手帳。"] },
    { id: "h_hermit", p: "rojin", name: "老人", scenes: ["hermitage"], when: "!flag:ki", chance: 0.6, kind: "hint", lines: ["目を閉じて、森の音を、聞くのじゃ。"] },
    { id: "h_shrine", p: "sayo", name: "小夜", scenes: ["shrine"], when: "!has:memoir", chance: 0.6, kind: "hint", lines: ["母さんの、手記……奥の記録庫に、あるはず。"] },
    { id: "h_sato", p: "mio", name: "澪", scenes: ["sato"], when: "!has:tegami || !has:notebook", chance: 0.5, kind: "hint", lines: ["禁書庫と、蒼真様の洞窟に、まだ、何かが……"] },
    { id: "c_sayo", p: "sayo", name: "小夜", zone: "tenkei", chance: 0.08, kind: "chat", lines: ["お師匠様の挨拶は、痛いよ。"] },
    { id: "c_mio", p: "mio", name: "澪", zone: "tabi", chance: 0.08, kind: "chat", lines: ["里の梅干し、また、食べたいな。"] },
    { id: "c_sazuki", p: "sazuki", name: "紗月", zone: "gendai", chance: 0.08, kind: "chat", lines: ["神社の桜、好きなんだ。昔から。"] }
  ]
};
