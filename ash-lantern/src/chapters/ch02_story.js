'use strict';
// 第2章 story「塩の街道と元兵士」。ガルド登場(荷車の護衛で仮加入→最後に正式に同行)。
// 選択 c2_first_0=盗賊を追った / c2_first_1=避難路を守った。どちらも両方の場所を必ず訪れ、取り返せる。
registerChapter({
  id: 'c2', title: '塩の街道と元兵士',
  stages: ['c2_start', 'c2_road', 'c2_conflict', 'c2_record', 'c2_complete'],
  objectives: {
    c2_start: '街道の荷車を探して、商人に話しかけよう',
    c2_road: '荷車と一緒に街道を東へ進もう',
    c2_conflict: '盗賊の野営地と避難所の入口、両方を見に行こう',
    c2_record: '避難所の長老に、荷車の書類を見せよう',
    c2_complete: '第2章クリア(メニューからセーブできます)'
  },
  actors: [
    { map: 'C2_ROAD', id: 'c2_gardo', img: 'npc_gardo', name: 'ガルド', at: 'C2_ROAD@start', dir: 'down', when: 'st:c1_complete|st:c2_start', story: 'c2_gardo_idle' },
    { map: 'C2_ROAD', id: 'c2_trader', img: 'npc_trader', fallback: 'npc_carpenter', fieldWidth: 60, name: '商人トーマ', at: 'C2_ROAD@cart', dir: 'left', when: 'st:c1_complete|st:c2_start', story: 'c2_trader' },
    { map: 'C2_ROAD', id: 'c2_runner', img: 'npc_refugee', fallback: 'npc_kid', fieldWidth: 55, name: '逃げてきた人', at: 'C2_ROAD@ambush', dir: 'down', when: 'st:c2_road&!flag:c2_ambush', story: 'c2_ambush' },
    { map: 'C2_ROAD', id: 'c2_chief', img: 'npc_bandit', fallback: 'enemy_bandit_chief', fallback2: 'npc_guard', fieldWidth: 78, name: '盗賊の頭', at: 'C2_ROAD@bandit_camp', dir: 'left', when: 'ge:c2_conflict&!flag:c2_chief_done', story: 'c2_chief' },
    { map: 'C2_CAMP', id: 'c2_gatekeeper', img: 'npc_refugee', fallback: 'npc_kid', fieldWidth: 55, name: '避難所の見張り', at: 'C2_CAMP@gate', dir: 'down', when: 'ge:c2_conflict&!flag:c2_gate_done', story: 'c2_gate' },
    { map: 'C2_CAMP', id: 'c2_elder', img: 'npc_granny', name: '避難所の長老', at: 'C2_CAMP@elder', dir: 'down', when: 'ge:c2_start', story: 'c2_elder' }
  ],
  zones: [
    { map: 'C2_ROAD', at: 'C2_ROAD@west', cond: 'st:c1_complete', story: 'c2_arrive' },
    { map: 'C2_ROAD', at: 'C2_ROAD@start', cond: 'st:c1_complete', story: 'c2_arrive' },
    // The refugee occupies the ambush tile, so start the event when approached.
    { map: 'C2_ROAD', at: [23, 12, 3, 3], cond: 'st:c2_road&!flag:c2_ambush', story: 'c2_ambush' }
  ],
  story: {
    c2_arrive: [
      ['stage', 'c2_start'],
      ['n', '川霧の町を出て東へ。塩の混じる風が吹く街道に入った。'],
      ['s', 'ミラ', '白い道……。砂と塩で、遠くまで光って見えますね。'],
      ['s', 'アレン', '回収隊の車輪の跡は、この道の先に続いてる。'],
      ['n', '道ばたに荷車が止まり、大柄な男が腕を組んで立っている。'],
      ['toast', '目的が更新された']
    ],
    c2_gardo_idle: [
      ['if', 'flag:c2_gardo_met', [['s', 'ガルド', '商人に話を通せ。道は長いぞ。'], ['end']]],
      ['flag', 'c2_gardo_met'],
      ['s', 'ガルド', '……なんだ、お前ら。旅人か。'],
      ['s', 'アレン', '東へ行きたい。荷車の護衛がいると聞いた。'],
      ['s', 'ガルド', '俺は雇われの用心棒だ。ガルドと呼べ。足手まといは連れん。'],
      ['s', 'ミラ', '回復なら任せてください。'],
      ['s', 'ガルド', '……口だけじゃないといいがな。商人に話せ。']
    ],
    c2_trader: [
      ['if', 'ge:c2_road', [['s', 'トーマ', '行こう。日が暮れる前に、避難所までたどり着きたい。'], ['end']]],
      ['s', 'トーマ', '助かった。最近の街道は盗賊と砂の獣だらけでね。'],
      ['s', 'トーマ', '避難所へ薬と布を運んでる。腕の立つ人が一人でも欲しい。'],
      ['s', 'アレン', '東へ行くついでだ。護衛させてもらう。'],
      ['if', '!flag:c2_gardo_met', [
        ['s', 'ガルド', '待て。勝手に決めるな。……まあいい、足を引っ張るなよ。']
      ], [
        ['s', 'ガルド', '決まりだな。後ろは見ててやる。前は自分でやれ。']
      ]],
      ['join', 'gardo'], ['sfx', 'item'],
      ['n', 'ガルドが仲間に加わった！(丈夫な前衛。攻撃と手当てが得意)'],
      ['if', '!flag:c2_caravan_supply', [
        ['flag', 'c2_caravan_supply'],
        ['s', 'トーマ', '護衛の備えに、隊商の予備を使ってくれ。無事に届けるためだ。'],
        ['gear', 'salt_knife', 1], ['gear', 'caravan_coat', 1], ['gear', 'gardo_axe', 1], ['give', 'caravan_ration', 2],
        ['n', '塩晶のナイフ、隊商の外套、ガルドの手斧、隊商の携行食を2個受け取った。(装備はメニューから変更できる)']
      ]],
      ['if', '!flag:c2_magic_supply', [
        ['flag', 'c2_magic_supply'], ['give', 'ether', 1], ['give', 'potion', 1],
        ['s', 'トーマ', '魔力薬と回復薬も一つずつ持っていってくれ。連戦に備えてな。']
      ]],
      ['n', '戦闘で防御と回復を使い分けると、仲間を守れる。(この先、仲間の教えが技になることもある)'],
      ['stage', 'c2_road'], ['toast', '目的が更新された']
    ],
    c2_ambush: [
      ['flag', 'c2_ambush'], ['actor', 'remove', 'c2_runner'],
      ['s', '逃げてきた人', '助けて！　砂の中から獣が……それに盗賊まで！'],
      ['s', 'ガルド', '下がってろ。お前ら、構えろ！'],
      ['battle', ['sand_beast', 'sand_beast']],
      ['s', 'ミラ', '大丈夫ですか？　けがはありませんか。'],
      ['n', 'そのとき、街道の先から鬨の声。荷車の積み荷が、盗賊の一団に襲われていた。'],
      ['n', '同時に、避難所へ向かう列が、細い道を進んでいる。盗賊の矢が、その列にも向けられていた。'],
      ['s', 'ガルド', '頭を叩けば、残りは散る。追うぞ。守るだけじゃ、いつまでも終わらん。'],
      ['s', 'ミラ', '待ってください。列の人たちが……！'],
      ['s', 'ガルド', '兵はそうやって勝ってきたんだ。決めろ、アレン。'],
      ['ask', 'c2_first', '二手には分かれられない。どうする？', ['盗賊を追う', '避難路を守る'], [
        [['s', 'アレン', '追おう。荷を取り返して、盗賊の頭を止める。'],
         ['s', 'ガルド', '話が早い。……ミラ、嬢ちゃんは文句を飲み込め。'],
         ['s', 'ミラ', '……避難の人たちは、必ず後から守ります。'],
         ['stage', 'c2_conflict'], ['goto', 'C2_ROAD', 'C2_ROAD@east', 'left']],
        [['s', 'アレン', '列を守る。荷は後からでも、取り返せる。'],
         ['s', 'ガルド', '……盗賊を逃がす気か。甘いぞ。'],
         ['s', 'アレン', '甘くてもいい。人が先だ。'],
         ['stage', 'c2_conflict'], ['goto', 'C2_CAMP', 'C2_CAMP@start', 'down']]
      ]],
      ['toast', '目的が更新された']
    ],
    c2_chief: [
      ['if', 'flag:c2_first_0', [
        ['s', '盗賊の頭', '追いつくのが早いな。護衛にしては、気が荒い。']
      ], [
        ['s', '盗賊の頭', 'もう戻ってきたのか。避難の列は、見捨てたのか？']
      ]],
      ['s', 'ガルド', '荷を返せ。おとなしくすれば、命までは取らん。'],
      ['s', '盗賊の頭', '塩も薬も、冬を越すのに要る。奪わなきゃ、うちの連中が死ぬんだ。'],
      ['s', 'アレン', '理由があっても、列に矢を向けていい理由にはならない。'],
      ['battle', ['salt_bandit', 'bandit_chief']],
      ['levelup', 1], ['heal'],
      ['flag', 'c2_chief_done'], ['actor', 'remove', 'c2_chief'],
      ['s', '盗賊の頭', '……荷は返す。だが、この街道に回収隊が来てから、誰も塩を運べなくなった。'],
      ['s', 'ミラ', '回収隊が……？'],
      ['give', 'potion', 2], ['n', '取り返した荷の中から、回復薬を2個、譲ってもらった。'],
      ['if', 'flag:c2_gate_done', [
        ['n', '二つの場所の用が済んだ。荷車の書類を、避難所の長老に見せよう。'],
        ['stage', 'c2_record'], ['goto', 'C2_CAMP', 'C2_CAMP@start', 'down']
      ], [
        ['n', '残るは避難所の入口だ。'], ['goto', 'C2_CAMP', 'C2_CAMP@start', 'down']
      ]],
      ['toast', '目的が更新された']
    ],
    c2_gate: [
      ['if', 'flag:c2_first_1', [
        ['s', '見張り', '列が着いた！　あんたたちが守ってくれたのか。'],
        ['s', 'ガルド', '……盗賊の頭は、まだ野放しだがな。']
      ], [
        ['s', '見張り', '遅かった。盗賊は去ったが、列の最後の人たちが、怯えて動けない。'],
        ['s', 'ガルド', '……追っているうちに、後ろが薄くなったか。']
      ]],
      ['s', 'ミラ', '怖かったですね。もう大丈夫。私が、そばにいます。'],
      ['n', '避難所の入口に、はぐれた盗賊が二人、まだ潜んでいた。'],
      ['battle', ['salt_bandit', 'salt_bandit']],
      ['flag', 'c2_gate_done'], ['actor', 'remove', 'c2_gatekeeper'],
      ['s', 'ガルド', '剣で敵を倒しても、人は守りきれん。……戦場で、そう教わったはずだったな。'],
      ['s', 'アレン', '強さは、道具の一つだ。直すのも、守るのも、使い方次第だと思う。'],
      ['s', 'ガルド', '口の減らん修理屋だ。'],
      ['if', 'flag:c2_chief_done', [
        ['stage', 'c2_record'], ['n', '二つの場所の用が済んだ。長老に荷車の書類を見せよう。'], ['goto', 'C2_CAMP', 'C2_CAMP@start', 'down']
      ], [
        ['n', '残るは、盗賊の野営地だ。街道を戻ろう。'], ['goto', 'C2_ROAD', 'C2_ROAD@east', 'left']
      ]],
      ['toast', '目的が更新された']
    ],
    c2_elder: [
      ['if', 'ge:c2_complete', [['s', '長老', '灯りの道の旅、気をつけてな。ガルドさんの汁物は、また食べたいものじゃ。'], ['end']]],
      ['if', 'st:c2_record', [
        ['s', '長老', '書類を見せておくれ。……これは王都の回収の記録じゃな。'],
        ['n', '記録には、回収した炉の順番が並んでいる。灯守村、川霧の町……次は、潮騒港。'],
        ['n', '各地の炉を首都へ集める計画だった。回収の日付はある。だが、炉を戻す日付の欄は、すべて空白だった。'],
        ['s', 'アレン', '戻す日が、書いてない……。'],
        ['s', 'ガルド', '兵は命令を運ぶだけだ。中身を読めと言われたことは、一度もなかった。'],
        ['s', 'ミラ', '次の港の炉も、同じ目に遭うなら……急がないと。'],
        ['flag', 'c2_ledger'],
        ['s', '長老', '腹ごしらえをしていきなされ。旅人に空腹で出られては、避難所の名が廃る。'],
        ['n', 'ガルドが鍋を借り、塩漬けの肉と根菜で汁物を作った。口は悪いが、手際はいい。'],
        ['s', 'ガルド', '……食え。冷めると、まずくなる。'],
        ['s', 'ミラ', 'おいしい……！　ガルドさん、料理がお上手なんですね。'],
        ['s', 'ガルド', 'うるさい。昔、教える相手がいただけだ。'],
        ['n', 'ガルドは、それ以上は語らなかった。窓の外で、塩の風が鳴っている。'],
        ['s', 'ガルド', '……俺はここまでの護衛のはずだった。だが、お前らの行く先は、俺の知る場所と重なる。'],
        ['s', 'ガルド', '潮騒港まで付き合う。勘違いするな、荷のついでだ。'],
        ['stage', 'c2_complete'],
        ['card', '第2章「塩の街道と元兵士」 おわり', '食卓には、ひとつ、名前のない空席が残った。'],
        ['toast', '第2章クリア。メニューからセーブできます。'],
        ['goto', 'C3_PORT', 'C3_PORT@start', 'down'],
        ['stage', 'c3_start'],
        ['n', '街道を抜けると、潮の匂いがした。潮騒港。船の帆が、夕日にゆれている。'],
        ['s', 'ミラ', '海……。診療所の窓からでも、見たことがなかったです。'],
        ['s', 'ガルド', '港の炉も、書類の次の行き先だ。急ぐぞ。'],
        ['s', 'アレン', '王都へは、船で川をさかのぼるのが早い。船を探そう。'],
        ['toast', '目的が更新された'], ['end']
      ]],
      ['s', '長老', '遠いところをよく来なさった。ここは、街道で行き場を失った者の避難所じゃ。']
    ]
  },
  assets: [
    { id: 'npc.trader', kind: 'npc', file: 'img/npc_trader.png', spec: '立ち絵80px・中年の商人・旅装', status: '調整中', fallback: 'npc_carpenter', priority: '低', owner: 'Codex', note: '第2章 荷車の商人トーマ。静止画を接続、歩行差分は未制作' },
    { id: 'npc.refugee', kind: 'npc', file: 'img/npc_refugee.png', spec: '立ち絵80px・疲れた様子の避難民', status: '調整中', fallback: 'npc_kid', priority: '中', owner: 'Codex', note: '第2・6章に静止画を接続。歩行差分は未制作' },
    { id: 'npc.bandit', kind: 'npc', file: 'img/npc_bandit.png', spec: '立ち絵80px・頭巾の盗賊の頭', status: '調整中', fallback: 'npc_guard', priority: '低', owner: 'Codex', note: '第2章 盗賊の頭。戦闘絵を参照した頭巾なしの静止絵を接続・実画面確認。頭巾指定との整合と歩行差分は要確認。' }
  ]
});
