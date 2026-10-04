/*
 * 特別なキャラクターの出番。ふだんは出さない(間をあける)。ときどき、ヒントや世間話を吹き出しで言う。
 *   gap: 前に出てから、最低この数の場面を進むまで、出さない
 *   id, p(姿)/group(みんな), name(吹き出しの名前)
 *   scenes(出る場面)/zone(出る場所)/kinds(結末の種類。結末にだけ出る)
 *   when(出る条件。「まだ持っていない」など、困っていそうなときに出る)
 *   chance(出る確率) always(かならず)
 *   kind: hint(遠まわしなヒント) / chat(日常のおしゃべり) / cheer(お祝い) / sad(なぐさめ)
 *   lines: 言うことばの候補。ヒントは、答えを直接言わない。
 * 上から順に調べるので、ヒントを先に、おしゃべりをあとに書く。
 */
window.ALICE_GAME.cameos = {
  gap: 3,
  list: [
    // ── 結末のとき ──
    { id: "fin_true", group: ["rabbit", "hatter", "hare", "dodo", "dinah"], scenes: ["e_true"], kinds: ["true"], always: true, kind: "cheer", lines: ["おめでとう、アリス! 時間を、ありがとう!"] },
    { id: "fin_happy_dodo", p: "dodo", name: "ドードー", kinds: ["happy"], chance: 0.35, kind: "cheer", lines: ["優雅な結末でしたな!", "ぱちぱち。いい午後でした。"] },
    { id: "fin_happy_cat", p: "cat", name: "チェシャ猫", kinds: ["happy"], chance: 0.3, kind: "cheer", lines: ["ふふ。いい午後だったね。", "にやにや。まだ、ほかの午後も、あるよ。"] },
    { id: "fin_happy_mouse", p: "mouse", name: "ネズミ", kinds: ["happy"], chance: 0.3, kind: "cheer", lines: ["おめでとうございます。", "…ひとつ、お話が、できました。"] },
    { id: "b_big", p: "dinah", name: "ダイナ", scenes: ["b_big"], kinds: ["bad"], always: true, kind: "sad", lines: ["大きくなるのは、扉をくぐれるようになってからでも、いいのにゃ…。"] },
    { id: "b_pressed", p: "frog", name: "カエルの従僕", scenes: ["b_pressed"], kinds: ["bad"], always: true, kind: "sad", lines: ["泣いてばかりだと、足もとが、ぬれてしまいますよ。…扇が落ちていたでしょう?"] },
    { id: "b_tiny", p: "owl", name: "ふくろう先生", scenes: ["b_tiny"], kinds: ["bad"], always: true, kind: "sad", lines: ["ホー。かじるのは、あとでもよい。ポケットに入れて、持っておくこともできる。"] },
    { id: "b_card", p: "gryphon", name: "グリフォン", scenes: ["b_card"], kinds: ["bad"], always: true, kind: "sad", lines: ["女王に言いかえすのは、やめておけ。庭で見たことを、思いだすのだ。"] },
    { id: "bad_any", p: "bill", name: "トカゲのビル", kinds: ["bad", "stuck"], chance: 0.75, kind: "sad", lines: ["あらら…。ひとつ前の分かれ道へ、もどってみたら?", "だいじょうぶ。何度でも、やりなおせるさ。"] },
    { id: "s_table", p: "bat", name: "コウモリ", scenes: ["s_table"], kinds: ["stuck"], always: true, kind: "sad", lines: ["のぼれないなら…鍵は、さいしょから、持っていけたんじゃない?"] },
    { id: "loop_any", p: "owl", name: "ふくろう先生", kinds: ["loop"], always: true, kind: "hint", lines: ["ホー。同じことの、くり返しに気づいたら、ちがう道を試すものじゃ。"] },
    { id: "fin_normal", p: "turtle", name: "海亀もどき", kinds: ["normal"], chance: 0.45, kind: "chat", lines: ["ふつうの午後も、わるくない。(ぐすん)", "むかしは、ほんものの海亀だったんだよ。(ぐすん)"] },

    // ── 困っていそうなときの、遠まわしなヒント ──
    { id: "h_hall", p: "dinah", name: "ダイナ", scenes: ["hall"], when: "visits:hall>=2 && !has:key", chance: 0.7, kind: "hint", lines: ["ガラスのテーブルの上で、なにか、きらっと光っていたにゃ。"] },
    { id: "h_door", p: "bill", name: "トカゲのビル", scenes: ["door"], when: "visits:door>=2 && !has:bottle", chance: 0.7, kind: "hint", lines: ["小さな扉は、小さな人にしか、通れないんだってさ。"] },
    { id: "h_doors", p: "dinah", name: "ダイナ", scenes: ["doors"], when: "visits:doors>=2 && !has:lantern && !has:map", chance: 0.7, kind: "hint", lines: ["高いところのひびは、明かりがないと、たどれないにゃ。"] },
    { id: "h_shrunk", p: "bill", name: "トカゲのビル", scenes: ["shrunk"], when: "!has:key", chance: 0.6, kind: "hint", lines: ["鍵は…まだ、あの高いところに、あるみたいだよ。", "大きくなれば、あのテーブルにも、手が届くかも。"] },
    { id: "h_tears", p: "frog", name: "カエルの従僕", scenes: ["tears"], when: "!has:fan", chance: 0.65, kind: "hint", lines: ["泣くより、あおいでみてはいかが? ほら、水に浮かんでいるでしょう。"] },
    { id: "h_swim", p: "gryphon", name: "グリフォン", scenes: ["swim"], when: "visits:swim>=2", chance: 0.7, kind: "hint", lines: ["ぐるぐる泳ぐのも、いいが。旗のほうへ行ってみるのも、おもしろいぞ。"] },
    { id: "h_caucus", p: "bat", name: "コウモリ", scenes: ["caucus"], when: "!has:thimble", chance: 0.5, kind: "hint", lines: ["賞品の指ぬきは、勲章になるんだって。ぼくも、ほしいな。"] },
    { id: "h_rabbit_house", p: "gryphon", name: "グリフォン", scenes: ["rabbit_house"], when: "!has:fan", chance: 0.55, kind: "hint", lines: ["メアリー・アンの寝室に、白い扇があるらしいぞ。"] },
    { id: "h_upstairs", p: "owl", name: "ふくろう先生", scenes: ["upstairs"], chance: 0.5, kind: "hint", lines: ["ホー。ラベルのない瓶は、おすすめできん。"] },
    { id: "h_cross", p: "owl", name: "ふくろう先生", scenes: ["crossroads"], when: "visits:crossroads>=2 && !flag:cat_hint", chance: 0.6, kind: "hint", lines: ["ホー。道は、あの木の上の猫が、よく知っているそうじゃ。"] },
    { id: "h_mush", p: "dinah", name: "ダイナ", scenes: ["mushroom"], when: "!flag:cat_honest", chance: 0.6, kind: "hint", lines: ["左は大きく、右は小さく…むかしの猫から、聞いたにゃ。"] },
    { id: "h_pigeon", p: "turtle", name: "海亀もどき", scenes: ["pigeon"], chance: 0.6, kind: "hint", lines: ["卵は、たべちゃだめだよ…。(ぐすん)"] },
    { id: "h_teapot", p: "bat", name: "コウモリ", scenes: ["teapot"], when: "!flag:cat_hint && !flag:dormouse_hint", chance: 0.65, kind: "hint", lines: ["ポットの中のネズミは、寝言で、ひみつを話すらしいよ。"] },
    { id: "h_move", p: "dormouse", name: "眠りネズミ", scenes: ["moveseat"], when: "visits:moveseat>=2", chance: 0.7, kind: "hint", lines: ["…ぐう…席は、ずれるだけじゃ…おわらん…ぐう…"] },
    { id: "h_hatter", p: "hare", name: "三月ウサギ", scenes: ["hatter_time"], chance: 0.4, kind: "hint", lines: ["時計は、巻けば動くのさ。巻くものが、あればね。"] },
    { id: "h_garden", p: "frog", name: "カエルの従僕", scenes: ["garden"], when: "!flag:painted", chance: 0.5, kind: "hint", lines: ["筆を持つ人は、女王さまに、きらわれないとか。"] },
    { id: "h_croquet", p: "gryphon", name: "グリフォン", scenes: ["croquet"], when: "!flag:tarts_seen", chance: 0.6, kind: "hint", lines: ["ジャックのお盆に、目をむけてごらん。"] },
    { id: "h_maze", p: "turtle", name: "海亀もどき", scenes: ["maze"], when: "visits:maze>=2", chance: 0.7, kind: "hint", lines: ["ネズミと仲よくなれたなら…生け垣の下を、さがしてごらん。(ぐすん)"] },
    { id: "h_witness", p: "owl", name: "ふくろう先生", scenes: ["alice_witness"], when: "!flag:tarts_seen && !has:mushL", chance: 0.7, kind: "hint", lines: ["ホー。証拠か、大きな体か。どちらかを持たずに立つものではない。"] },
    { id: "h_court", p: "dinah", name: "ダイナ", scenes: ["giant_alice"], when: "!has:watch || !has:screw", chance: 0.5, kind: "hint", lines: ["時計は、ねじが、そろったら動くのにゃ。"] },

    // ── 日常のおしゃべり(めったに出ない) ──
    { id: "c_rabbit", p: "rabbit", name: "白ウサギ", zone: "river", chance: 0.1, kind: "chat", lines: ["ああ、たいへん! …と言いながら、じつは、たのしいのです。"] },
    { id: "c_dinah", p: "dinah", name: "ダイナ", zone: "hall", chance: 0.1, kind: "chat", lines: ["今日のミルクは、すこし、ぬるいにゃ。"] },
    { id: "c_frog", p: "frog", name: "カエルの従僕", zone: "pool", chance: 0.1, kind: "chat", lines: ["雨ですか? いいえ、池のしぶきです。"] },
    { id: "c_owl", p: "owl", name: "ふくろう先生", zone: "forest", chance: 0.1, kind: "chat", lines: ["ホー。今日の雲は、本のしおりより、うすいのう。"] },
    { id: "c_bat", p: "bat", name: "コウモリ", zone: "tea", chance: 0.1, kind: "chat", lines: ["きらきら ひかる おほしさま…あれ、昼間か。"] },
    { id: "c_gryphon", p: "gryphon", name: "グリフォン", zone: "garden", chance: 0.1, kind: "chat", lines: ["さあ、さあ、散歩のじかんだ!"] },
    { id: "c_bill", p: "bill", name: "トカゲのビル", zone: "house", chance: 0.1, kind: "chat", lines: ["煙突から落ちるのは、もう、うんざりさ。"] },
    { id: "c_turtle", p: "turtle", name: "海亀もどき", zone: "court", chance: 0.1, kind: "chat", lines: ["裁判は、ながいねえ。(ぐすん)"] },
    { id: "c_mouse", p: "mouse", name: "ネズミ", zone: "mush", chance: 0.08, kind: "chat", lines: ["…キノコの上は、見晴らしが、いいですね。"] },
    { id: "c_cat", p: "cat", name: "チェシャ猫", zone: "duchess", chance: 0.1, kind: "chat", lines: ["ふふ。ここの胡椒は、世界一さ。"] }
  ]
};
