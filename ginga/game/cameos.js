/* 特別なキャラクターの出番。ふだんは出さない。ヒントは遠まわしに。 */
window.GAME.cameos = {
  gap: 3,
  list: [
    // ── 結末のとき ──
    { id: "fin_true", group: ["campanella", "mother", "birdcatcher", "girl", "boy"], scenes: ["e_true"], kinds: ["true"], always: true, kind: "cheer", lines: ["どこまでも、いっしょに。"] },
    { id: "fin_happy_bird", p: "birdcatcher", name: "鳥を捕る人", kinds: ["happy"], chance: 0.35, kind: "cheer", lines: ["いやあ、けっこう、けっこう！", "ほかの停車場も、なかなかですよ。"] },
    { id: "fin_happy_camp", p: "campanella", name: "カムパネルラ", kinds: ["happy"], chance: 0.3, kind: "cheer", lines: ["きれいだったね。", "また、いっしょに見よう。"] },
    { id: "b_ticket", p: "conductor", name: "車掌", scenes: ["b_ticket"], kinds: ["bad"], always: true, kind: "sad", lines: ["汽車に乗ったら、まず、ポケットを、おたしかめください。"] },
    { id: "b_bird", p: "campanella", name: "カムパネルラ", scenes: ["b_bird"], kinds: ["bad"], always: true, kind: "sad", lines: ["……あの人、さびしそうだったね。"] },
    { id: "b_milk", p: "mother", name: "おかあさん", scenes: ["b_milk"], kinds: ["bad"], always: true, kind: "sad", lines: ["いいんだよ。……でも、牛乳屋さん、待っていたかもしれないね。"] },
    { id: "bad_any", p: "girl", name: "かおる", kinds: ["bad", "stuck"], chance: 0.75, kind: "sad", lines: ["ひとつ前の停車場から、もう一度。", "だいじょうぶ。汽車は、また、来るわ。"] },
    { id: "loop_any", p: "boy", name: "タダシ", kinds: ["loop"], chance: 0.8, kind: "sad", lines: ["おなじところ、ぐるぐる、してるね。"] },

    // ── ヒント ──
    { id: "h_train", p: "conductor", name: "車掌", scenes: ["train"], when: "!has:ticket && visits:train>=2", chance: 0.6, kind: "hint", lines: ["まもなく、検札に、まいります。"] },
    { id: "h_farewell", p: "girl", name: "かおる", scenes: ["farewell"], when: "!flag:sasori_heard || !flag:kind_bird", chance: 0.6, kind: "hint", lines: ["さそりのお話、ちゃんと、聞いてくれた？"] },
    { id: "h_bird", p: "keeper", name: "燈台守", scenes: ["birdcatcher"], when: "!flag:kind_bird", chance: 0.5, kind: "hint", lines: ["あの男は、ひとりで、何十年も、河原に立っておるのです。"] },
    { id: "h_dairy2", p: "mother", name: "おかあさん", scenes: ["dairy2"], when: "!has:milk", chance: 0.6, kind: "hint", lines: ["(遠くの窓から、声がした気がする)……あたたかいのが、いいねえ。"] },
    { id: "h_bridge", p: "campanella", name: "カムパネルラ", scenes: ["bridge"], chance: 0.4, kind: "hint", lines: ["(目で)……ザネリの灯、ちいさいね。"] },

    // ── 日常のおしゃべり ──
    { id: "c_zanelli", p: "zanelli", name: "ザネリ", zone: "machi", chance: 0.08, kind: "chat", lines: ["……べつに、なんでもないよ。"] },
    { id: "c_bird", p: "birdcatcher", name: "鳥を捕る人", zone: "ginga", chance: 0.1, kind: "chat", lines: ["きょうは、さぎの、あたり日ですな。"] },
    { id: "c_boy", p: "boy", name: "タダシ", zone: "minami", chance: 0.1, kind: "chat", lines: ["ねえ、りんご、もうひとつ、ある？"] },
    { id: "c_doctor", p: "doctor", name: "博士", zone: "yoru", chance: 0.06, kind: "chat", lines: ["……星は、きょうも、よく見えますね。"] }
  ]
};
