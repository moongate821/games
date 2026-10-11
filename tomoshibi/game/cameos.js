/* 特別なキャラクターの出番。ふだんは出さない。ヒントは遠まわしに。 */
window.GAME.cameos = {
  gap: 3,
  list: [
    // ── 結末のとき ──
    { id: "fin_true", group: ["seiji", "nagi", "gull", "crab", "cat"], scenes: ["e_true"], kinds: ["true"], always: true, kind: "cheer", lines: ["こんばんは、ともしび。きょうも、たのむよ。"] },
    { id: "fin_happy_pii", p: "gull", name: "ピイ", kinds: ["happy"], chance: 0.35, kind: "cheer", lines: ["よかったねえ、ともしび。", "ぼく、ちゃんと、見てたよう。"] },
    { id: "fin_happy_crab", p: "crab", name: "ハサミじい", kinds: ["happy"], chance: 0.3, kind: "cheer", lines: ["ふん。わるくない夜じゃったわい。"] },
    { id: "b_dark", p: "seiji", name: "セイジじいさん", scenes: ["b_dark"], kinds: ["bad"], always: true, kind: "sad", lines: ["……今夜は、まっくらだね、ともしび。"] },
    { id: "b_fall", p: "gull", name: "ピイ", scenes: ["b_fall"], kinds: ["bad"], always: true, kind: "sad", lines: ["ひとりで飛ばなくても、ぼくが、はこぶのに……。"] },
    { id: "bad_any", p: "crab", name: "ハサミじい", kinds: ["bad", "stuck"], chance: 0.75, kind: "sad", lines: ["ひとつ前の岩まで、もどってみい。", "あわてるな。潮は、また、みちてくる。"] },
    { id: "loop_any", p: "cat", name: "ミケ", kinds: ["loop"], chance: 0.8, kind: "sad", lines: ["おやおや。同じところを、ぐるぐるだね。"] },

    // ── ヒント ──
    { id: "h_storm", p: "crab", name: "ハサミじい", scenes: ["storm"], when: "!has:lantern", chance: 0.6, kind: "hint", lines: ["(遠くの磯から)灯台の棚に、古いランタンが、あったはずじゃがのう。"] },
    { id: "h_cliff", p: "gull", name: "ピイ", scenes: ["cliff"], when: "!has:shell", chance: 0.6, kind: "hint", lines: ["ハサミじいの、ほう、っていう音、聞きたいなあ。"] },
    { id: "h_harbor", p: "cat", name: "ミケ", scenes: ["harbor"], when: "!flag:cat_told && visits:harbor>=2", chance: 0.6, kind: "hint", lines: ["(日だまりから)……朝市の魚は、うまいんだがねえ。"] },
    { id: "h_home", p: "seiji", name: "セイジじいさん", scenes: ["homeward"], when: "!flag:nagi_met || !flag:bell_rung || !flag:lit_others", chance: 0.6, kind: "hint", lines: ["(窓の向こうから)灯台は、ひとりで守るものじゃ、ないんだよ。"] },
    { id: "h_window", p: "nagi", name: "ナギ", scenes: ["window"], when: "!has:letter", chance: 0.5, kind: "hint", lines: ["(遠くの堤防で)……あの瓶の手紙、だれが書いたんだろう。"] },

    // ── 日常のおしゃべり ──
    { id: "c_pii", p: "gull", name: "ピイ", zone: "todai", chance: 0.1, kind: "chat", lines: ["きょうの風、しょっぱいねえ。"] },
    { id: "c_cat", p: "cat", name: "ミケ", zone: "minato", chance: 0.1, kind: "chat", lines: ["日だまりは、先にすわった者のものさ。"] },
    { id: "c_seal", p: "seal", name: "アザラシ", zone: "umi", chance: 0.1, kind: "chat", lines: ["いいねえ。"] },
    { id: "c_nurse", p: "nurse", name: "看護師さん", zone: "oka", chance: 0.06, kind: "chat", lines: ["東の窓のおじいさん、毎晩、岬を見てるのよ。"] }
  ]
};
