# StoryBook Engine ― 絵本型の分岐ゲームを作るための土台

『アリスの小さな大冒険』のために作った、**ゲームに依存しない**エンジン。別の物語(童話・ゲームブック・ミステリー…)でも、`game\` の中身だけ差し替えれば動く。外部ライブラリなし、音声ファイルも画像ファイルもなし。

## ファイル
| ファイル | 役目 |
|---|---|
| `core.js` | 状態・条件・遷移・結末の記録・検査(画面に触れない。ブラウザ/検査ツール両方で使う) |
| `ui.js` | 見開きの絵本UI。ページ自動分割・ページめくり・絵の中の物の選択・ポケット・結末の本棚・設定・しおり |
| `audio.js` | BGM(自動作曲)と効果音の合成(WebAudio) |
| `book.css` | 見た目(紙・見開き・めくり・虹色の文など)。色は `--accent` などの変数 |

## 新しいゲームを作る手順
1. `game\config.js` を写して、題名・`items`(持ち物)・`zones`(場所と色)・`endingKinds`(結末の種類)を決める。
2. 絵: `art_props.js`(物の絵。原点は足もと中央)と `art_bg.js`(背景)を写して差し替える。`ART.bg(name)` と `ART.prop(name)` を返す `art` オブジェクトを `game.art` に渡す。
3. 本文: 場面を書く(下のデータの形)。**1場面=1オブジェクト**、結末は `ending` つき。
4. `index.html` を写して、script を並べる(core → audio → ui → 絵 → config → 本文 → audio_config)。最後に `BookUI.mount(game, 要素)`。
5. `tools\validate.html` を写して、検査する(参照切れ・到達性・字数・通しテスト)。

## データの形
```js
scenes: {
  river: {
    zone: "river", title: "川岸",
    art: { bg: "river", deco: [["alice", 330, 424, 0.95]] },     // [小道具, x, y, 拡大率, 反転]
    pages: [ "本文(\n で段落)", { when: "visits:river>=2", text: "2回目以降の本文" } ],
    options: [
      { id: "rabbit", label: "白ウサギを追う", at: ["rabbit", 556, 412, 0.85], next: "fall" },  // at=絵の中の物
      { id: "back",   label: "戻る", next: "hall" },                                              // atなし=文字の選択肢
      { id: "key",    label: "金の鍵", at: ["key", 200, 360, 1.2], gives: "key" }                 // nextなし=その場で拾う
    ]
  },
  e_true: { zone: "...", title: "...", ending: { kind: "true", name: "...", hint: "ヒント", summary: "一行" }, art: {...}, pages: [...] }
}
```
- 選択肢の主な項目: `when`(見える条件) `requires`+`locked`(使える条件と、満たさないときの一言) `gives/takes/sets/clears/inc` `loop:true`(ループの回数) `msg`(ふせん) `once`
- 条件: `has:鍵` `flag:名` `visits:場面>=3` `n:カウンタ>=2` `endings>=10`、先頭に `!`、`&&`、`||`(`||` が弱い。かっこは使えない)
- 本文の印: `**大事な文**`(色)、`==いちばん大事な文==`(虹色)。印は一文の中に収める。

## 設計のポイント
- **ページは自動で分ける**。画面の大きさ・文字サイズに合わせて、文章を実際に測って、収まる分だけ1ページにする。最後のページに選択肢が入らなければ、最後の段落を次のページへ送る。
- 絵の中の物は、**最後のページまで読んでから**さわれる(読み飛ばし防止)。
- 戻る(しおり)は、直前の分かれ道に戻る(持ち物も戻る)。結末は本棚に記録される(localStorage)。
- 検査の「到達性」は、持ち物とフラグは「手に入れたら残る」と見なす軽い解析。**「行ける」の確認は、通しテスト(実際の規則で選択肢を順に選ぶ)でする**。全状態の探索は組み合わせが爆発するので使わない(`exploreExact` は小さいゲーム用)。
- 撮影・検査用: `index.html#scene=ID&items=a,b&flags=x&visits=場面:回数&page=2` で、好きな場面から始められる。`window.__book` に `jump` `pageInfo` など。

## 動く絵とメルヘンな枠(art.motion / art.ambient / art.stage)
絵の本体(背景と静止物)は**一枚絵で固定**して、動くものは**別の小さな層**(`.sb-fx`)にして `transform` と `opacity` だけで動かす。こうすると、クレヨンのフィルターが毎コマ再計算されず、42個動いても60fpsで動く。
- `art.motion = { 小道具名: 動き名 }`: 絵の中のキャラクターのふだんの動き(`bob` `hop` `sway` `breathe` `float`)。飾りにも、さわれる物にも効く(さわれる物は、動く層に置き換えて、ホバーで光る)。
- `art.ambient(背景名)`: 背景ごとの動き(雲が流れる・蝶が飛ぶ・花びらや葉が落ちる・泡がのぼる・魚が跳ねる・湯気・星のまたたき)。`{p, x, y, s, a, d, delay, dx, dy, flap}`。
- `art.stage = { frameImage, wallpaper, frame: [...], page: [...] }`: 絵の額縁(9分割の絵)と、枠のまわり・ページのすきまを動くキャラクター。`type:"peek"`(のぞく)、`"orbit"`(まわる)、`a:"crawl"`(はう)・`"climb"`・`"zig"`・`"swing"` など。
- 動きの名前と、キーフレームは `book.css` の `fx-*`。`prefers-reduced-motion` では止まる。

## 特別なキャラクター・枠の演出・文字の演出
- `game.cameos = { gap, list: [...] }`: ときどき顔を出して、吹き出しでヒントや世間話を言う。`scenes`/`zone`/`kinds`(結末)/`when`(条件。困っていそうなとき)/`chance`/`always`/`kind`(hint・chat・cheer・sad)/`lines`。出しすぎないよう、前に出てから `gap` 場面あける。`group:[...]` で全員集合。
- 枠の演出(`frameFx`): 正解で `glow`(光る+きらきら)、まちがいで `fall`(模様が落ちて色あせる)/`wrong`(ゆれる)、ふしぎで `spin`。選択肢に `gives`/`sets` があれば正解、使えない(`locked`)ならまちがい、結末は種類で決まる。
- 文字の演出(`idleStage`): しばらく操作がないと(`game.idle={t1,t2,t3}` 秒。既定 25/45/70)、文字が浮いて光り、虫に変わる。さわる(ホバー/タップ)と、もとの位置にもどる。ページが変わると全部もどる。設定でオフにできる。
- めくれた紙の裏がわは、`art.stage.wallpaper` の模様だけ(文字は、めくり始めてすぐ消える)。

## 音(audio.js)
`game.audio = { themes, zoneTheme, kindTheme, cover, enterSfx }`。曲は seed つきの自動作曲なので毎回同じ曲になる。場所が変わると曲が交代する。録画用に、`setTimeout` と `ctx.currentTime` だけで予約するので、仮想時計・OfflineAudioContext でも動く。
