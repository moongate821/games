/* 特別なキャラクターの出番。ふだんは出さない。ヒントは遠まわしに。ダンボットは、いつもいっしょなので、ここでは、地上の人や宇宙の友だちが出る。 */
window.GAME.cameos = {
  gap: 3,
  list: [
    // ── 結末のとき ──
    { id: "fin_true", group: ["luna", "haru", "danbot", "grandpa", "mom"], scenes: ["e_true"], kinds: ["true"], always: true, kind: "cheer", lines: ["ハッピーバースデー、ルナ！"] },
    { id: "fin_happy_luna", p: "luna", name: "ルナ", kinds: ["happy"], chance: 0.35, kind: "cheer", lines: ["ありがとう、ハル！", "こんど、ぜったい、来てね。"] },
    { id: "fin_happy_grandpa", p: "grandpa", name: "じいちゃん", kinds: ["happy"], chance: 0.3, kind: "cheer", lines: ["よくやった。わしの、ゆめの、つづきだ。"] },
    { id: "b_wet", p: "mom", name: "母さん", scenes: ["b_spin", "b_thunder", "b_candy"], kinds: ["bad"], always: true, kind: "sad", lines: ["段ボールは、かわかせば、また、なおるわよ。"] },
    { id: "bad_any", p: "grandpa", name: "じいちゃん", kinds: ["bad", "stuck"], chance: 0.75, kind: "sad", lines: ["ほう。ひとつ前の、星まで、もどってごらん。", "ロケットは、なんどでも、うちあげなおせる。"] },
    { id: "loop_any", p: "kome", name: "ほうき星のコメ", kinds: ["loop"], chance: 0.8, kind: "sad", lines: ["ぐるぐる！ ひゃっほう！ ……でも、どこにも、着かないよ？"] },

    // ── ヒント ──
    { id: "h_yard", p: "mom", name: "母さん", scenes: ["yard"], when: "visits:yard>=2 && !has:cake || visits:yard>=2 && !has:map", chance: 0.5, kind: "hint", lines: ["おみやげと、道しるべ。旅には、どっちも、いるわね。"] },
    { id: "h_launch", p: "grandpa", name: "じいちゃん", scenes: ["launch"], when: "!has:map", chance: 0.6, kind: "hint", lines: ["(遠くから)……宇宙は、ひろい。地図が、なければのう。"] },
    { id: "h_space", p: "sate", name: "衛星サテ", scenes: ["space"], when: "!has:map", chance: 0.6, kind: "hint", lines: ["月への、道？ むかし、だれかが、地図に、書いてたよ……。"] },
    { id: "h_moon", p: "luna", name: "ルナ", scenes: ["moon"], when: "!has:cake", chance: 0.3, kind: "hint", lines: ["(丘の上から)……だれか、来たの？"] },

    // ── 日常のおしゃべり ──
    { id: "c_mom", p: "mom", name: "母さん", zone: "niwa", chance: 0.08, kind: "chat", lines: ["夜ごはんまでに、帰ってくるのよ。"] },
    { id: "c_goose", p: "goose", name: "わたり鳥", zone: "sora", chance: 0.08, kind: "chat", lines: ["クワッ。"] },
    { id: "c_kome", p: "kome", name: "ほうき星のコメ", zone: "uchu", chance: 0.08, kind: "chat", lines: ["ひゃっほう！"] },
    { id: "c_luna", p: "luna", name: "ルナ", zone: "tsuki", chance: 0.06, kind: "chat", lines: ["地球、きれいだね。"] }
  ]
};
