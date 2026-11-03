'use strict';
// 第13章 story「灰の冠」。仲間3人それぞれの後悔の幻(幻は過去に残った断片しか繰り返さない。新しい言葉は語らない)→灰の冠(ボス)。
registerChapter({
  id: 'c13', title: '灰の冠',
  stages: ['c13_start', 'c13_visions', 'c13_crown', 'c13_complete'],
  objectives: {
    c13_start: '中枢を進み、灰の影の幻に立ち向かおう(3か所)',
    c13_visions: 'まだ立ち向かっていない影を探そう',
    c13_crown: '奥の灰の冠に挑もう',
    c13_complete: '第13章クリア'
  },
  actors: [
    { map: 'C13_CORE', id: 'c13_s1', img: 'enemy_ash_shade', fallback: 'enemy_bat', fieldWidth: 56, name: '灰の影', at: 'C13_CORE@vision1', dir: 'down', when: 'ge:c13_start&!ge:c13_crown&!flag:c13_v1', story: 'c13_vision1' },
    { map: 'C13_CORE', id: 'c13_s2', img: 'enemy_ash_shade', fallback: 'enemy_bat', fieldWidth: 56, name: '灰の影', at: 'C13_CORE@vision2', dir: 'down', when: 'ge:c13_start&!ge:c13_crown&!flag:c13_v2', story: 'c13_vision2' },
    { map: 'C13_CORE', id: 'c13_s3', img: 'enemy_ash_shade', fallback: 'enemy_bat', fieldWidth: 56, name: '灰の影', at: 'C13_CORE@vision3', dir: 'down', when: 'ge:c13_start&!ge:c13_crown&!flag:c13_v3', story: 'c13_vision3' },
    { map: 'C13_CORE', id: 'c13_crown', img: 'enemy_ash_crown', fallback: 'enemy_golem', fieldWidth: 108, name: '灰の冠', at: 'C13_CORE@crown', dir: 'down', when: 'st:c13_crown', story: 'c13_crown' }
  ],
  story: {
    c13_vision1: [
      ['sfx', 'voice'],
      ['n', '灰の影が、白い病衣の姿をとった。ミラがかつて看取った、一人の患者。'],
      ['s', '影', '……ありがとう、先生……'],
      ['s', '冠の声', '救えなかった。お前が、もっと早く気づいていれば。'],
      ['s', 'ミラ', '……っ。'],
      ['s', 'ミラ', '違います。あの人が最後に言った言葉は、それだけ。あなたは、それ以上のことを、言えない。'],
      ['s', 'ミラ', '私が背負うのは、私の後悔です。幻に決めさせません。'],
      ['battle', ['ash_shade', 'ash_shade']],
      ['flag', 'c13_v1'], ['actor', 'remove', 'c13_s1'],
      ['if', 'flag:c13_v1&flag:c13_v2&flag:c13_v3', [['stage', 'c13_crown'], ['toast', '三つの影を越えた。奥の冠へ。']], [['stage', 'c13_visions'], ['toast', '目的が更新された']]]
    ],
    c13_vision2: [
      ['sfx', 'voice'],
      ['n', '灰の影が、灯台の窓辺の姿になった。炉の灯りに照らされた、小さな家の食卓。'],
      ['s', '影', '……ノア、ごはんよ。……ノア、ごはんよ。'],
      ['s', '冠の声', 'ここに残れば、もう、忘れずに済む。ずっと、呼んでもらえる。'],
      ['s', 'ノア', '……ありがとう。ボクを呼んでくれて。でも、行かなきゃいけない。'],
      ['s', 'ノア', 'お母さんの声、最初に聞いた言葉のまま、止まってる。ボクは、進んでる。'],
      ['s', 'ノア', '忘れても、いい。忘れても、みんなが呼んでくれる。ボクは、前に行く！'],
      ['battle', ['ash_shade', 'ash_shade']],
      ['flag', 'c13_v2'], ['actor', 'remove', 'c13_s2'],
      ['if', 'flag:c13_v1&flag:c13_v2&flag:c13_v3', [['stage', 'c13_crown'], ['toast', '三つの影を越えた。奥の冠へ。']], [['stage', 'c13_visions'], ['toast', '目的が更新された']]]
    ],
    c13_vision3: [
      ['sfx', 'voice'],
      ['n', '灰の影が、技師団の机の並ぶ記録室の姿になった。積み上がった書類の山。'],
      ['s', '影', '……回収、承認。……回収、承認。'],
      ['s', '冠の声', 'お前の設計が、各地を空にした。お前が、この灰の海を作った。'],
      ['s', 'セレナ', '……ええ。私も、その一人です。否定しません。'],
      ['s', 'セレナ', 'ただ、責任があるからこそ、直せる立場にあります。逃げません。止めます。'],
      ['battle', ['ash_shade', 'ash_shade']],
      ['flag', 'c13_v3'], ['actor', 'remove', 'c13_s3'],
      ['if', 'flag:c13_v1&flag:c13_v2&flag:c13_v3', [['stage', 'c13_crown'], ['toast', '三つの影を越えた。奥の冠へ。']], [['stage', 'c13_visions'], ['toast', '目的が更新された']]]
    ],
    c13_crown: [
      ['n', '奥に、灰色の灯火が絡み合った、巨大な冠が浮かんでいた。灯火の影が、いくつもの姿をとる。'],
      ['sfx', 'voice'],
      ['s', '影', '……おにい……'],
      ['s', 'アレン', '……っ。リナの声だ。でも、あの日、炉から聞こえた言葉と同じだ。それ以外、何も言わない。'],
      ['n', '影の中に、もう一つ、大柄な男の輪郭が浮かんだ。何も言わない。ただ、立っている。'],
      ['s', 'アレン', 'ガルド……。本物なら、「前を向け」って、言いそうだ。でも、あなたは、何も言わない。'],
      ['s', 'アレン', 'それが、本当は、あなたじゃないってことの、何よりの証拠だな。'],
      ['s', '冠の声', 'お前は、また失う。直せない。守れない。'],
      ['s', 'アレン', '直せないものは、ある。でも、持って行くことは、できる。……ミラの言葉だ。'],
      ['s', 'ミラ', 'アレンさん。みんな、そばにいます。'],
      ['battle', ['ash_shade', 'ash_crown', 'ash_shade']],
      ['levelup', 1], ['heal'],
      ['n', '冠は砕け、灰色の灯火が、静かに空へ溶けていった。残響の影は、一つずつ消えていく。'],
      ['s', 'セレナ', '中枢が開きます。奥が、炉の中心です。'],
      ['stage', 'c13_complete'],
      ['card', '第13章「灰の冠」 おわり', '影は、何も新しいことを言わなかった。'],
      ['toast', '第13章クリア。メニューからセーブできます。'],
      ['goto', 'C14_HEART', 'C14_HEART@start', 'up'],
      ['stage', 'c14_start'],
      ['n', '炉の中心。灰の海のすべての灯火が、静かな灯りとなって、そこに集まっている。'],
      ['n', '奥から、聞き覚えのある、小さな声が、かすかに聞こえてきた。'],
      ['toast', '目的が更新された']
    ]
  },
  assets: []
});
