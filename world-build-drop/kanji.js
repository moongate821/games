// 文字モードの辞書: 2字・3字の言葉と、四字熟語(意味つき)。外部のデータは使わず、定番の言葉だけを自分で選んだもの。
// 四字熟語 = [熟語, 意味(日本語), 英語の呼び名, 英語の意味]
(() => {
const DG = window.DG;
let W2 = ('世界 物語 言葉 文字 時間 空間 夢想 幻想 魔法 機械 帝国 皇帝 恋愛 悲劇 喜劇 運命 再会 約束 誓約 星空 月光 太陽 大地 海洋 人生 人間 生命 命運 宿命 平和 戦争 勇気 希望 絶望 友情 愛情 感情 理想 現実 真実 夢幻 記憶 記録 歴史 未来 過去 現在 永遠 瞬間 刹那 光明 暗黒 光陰 自然 山河 草原 森林 花鳥 風雨 雷鳴 月夜 星夜 朝日 夕陽 青空 白雲 王国 王者 騎士 剣士 竜神 神話 伝説 英雄 勇者 魔王 魔女 妖精 天使 悪魔 死神 毒薬 薬草 医者 学者 賢者 詩人 作家 画家 音楽 文学 芸術 美術 科学 数学 物理 宇宙 地球 大陸 島国 港町 都市 村人 旅人 出発 到着 冒険 探索 発見 発明 創造 想像 思想 哲学 論理 意味 言語 辞書 図鑑 書物 原稿 小説 詩歌 俳句 短歌 季節 春風 夏空 秋風 冬空 雪原 氷河 火山 砂漠 荒野 青春 人類 文明 文化 技術 進歩 革命 自由 平等 正義 悪事 善意 悪意 勝利 敗北 栄光 名誉 約定 信頼').split(' ');
let W3 = ('世界観 可能性 想像力 創造力 洞察力 記憶力 図書館 博物館 天文台 万華鏡 地平線 水平線 未知数 人生観 宇宙船 大冒険 新時代 冒険家 魔術師 錬金術 探検家 発明家 研究所 展望台 望遠鏡 顕微鏡 万年筆').split(' ');
let IDIOMS = [
  ['一期一会', '一生に一度の出会いを大切にすること。', 'Once in a Lifetime', 'Treasure every meeting as if it were your only one.'],
  ['一石二鳥', '一つのことで二つの利益を得ること。', 'Two Birds, One Stone', 'Gaining two benefits from a single act.'],
  ['七転八起', '何度失敗しても立ち上がること。', 'Fall Seven, Rise Eight', 'Getting back up no matter how many times you fail.'],
  ['十人十色', '人の考えや好みは、それぞれ違うこと。', 'Ten People, Ten Colors', 'Everyone has different tastes and ideas.'],
  ['花鳥風月', '自然の美しい風景や、それを楽しむこと。', 'Flower, Bird, Wind, Moon', 'The beauty of nature, and enjoying it.'],
  ['起承転結', '文章や物語の組み立ての型。', 'Intro, Development, Twist, Conclusion', 'The classic four-part structure of a story.'],
  ['温故知新', '昔のことを学んで、新しい知恵を得ること。', 'Learn from the Past', 'Studying the old to gain new knowledge.'],
  ['以心伝心', '言葉にしなくても、心が通じ合うこと。', 'Heart to Heart', 'Understanding each other without words.'],
  ['自由自在', '思いのままに、自由にできること。', 'Free and Unrestrained', 'Doing as one pleases, without limits.'],
  ['四面楚歌', '周りがすべて敵で、孤立していること。', 'Surrounded by Foes', 'Isolated with enemies on every side.'],
  ['晴耕雨読', '晴れた日は耕し、雨の日は本を読む暮らし。', 'Farm in Sun, Read in Rain', 'A calm life of working the fields and reading.'],
  ['弱肉強食', '強い者が弱い者を食い物にすること。', 'Survival of the Fittest', 'The strong prey on the weak.'],
  ['心機一転', '気持ちを入れ替えて、新しく始めること。', 'A Fresh Start', 'Changing your mindset and beginning anew.'],
  ['勇猛果敢', '勇ましく、思い切って行動すること。', 'Bold and Brave', 'Acting with courage and decisiveness.'],
  ['天真爛漫', '飾り気がなく、無邪気で明るいこと。', 'Pure and Cheerful', 'Natural, innocent and bright.'],
  ['大器晩成', '大人物は、遅れて大成すること。', 'Late Bloomer', 'Great talents mature late.'],
  ['異口同音', 'みんなが同じことを言うこと。', 'With One Voice', 'Everyone says the same thing.'],
  ['一日千秋', '一日が千年のように長く感じること。', 'A Day Like a Thousand Autumns', 'Waiting so eagerly that a day feels endless.'],
  ['電光石火', 'きわめてすばやいこと。', 'Lightning Flash', 'Extremely swift.'],
  ['日進月歩', '絶えず、どんどん進歩すること。', 'Daily Progress', 'Advancing steadily, day after day.'],
  ['森羅万象', '宇宙にある、すべてのもの。', 'All Things in the Universe', 'Everything that exists.'],
  ['質実剛健', '飾らず、まじめで、たくましいこと。', 'Simple and Sturdy', 'Plain, sincere and strong.'],
  ['喜怒哀楽', '人のさまざまな感情。', 'Joy, Anger, Sorrow, Pleasure', 'The full range of human emotions.'],
  ['春夏秋冬', '一年の四つの季節。', 'Four Seasons', 'Spring, summer, autumn and winter.'],
  ['東西南北', 'あらゆる方角。', 'North, South, East, West', 'Every direction.'],
  ['古今東西', 'いつでも、どこでも。', 'All Ages and Places', 'Always and everywhere.'],
  ['老若男女', '年齢も性別も問わない、すべての人。', 'Old, Young, Men, Women', 'People of every age and gender.'],
  ['公明正大', '公平で、隠しごとがないこと。', 'Fair and Square', 'Open, impartial and honest.'],
  ['臥薪嘗胆', '目的のために、長く苦労に耐えること。', 'Endure Hardship for a Goal', 'Bearing long hardship to achieve a goal.'],
  ['順風満帆', '物事がすべて順調に進むこと。', 'Smooth Sailing', 'Everything going well.'],
  ['疾風迅雷', '行動が非常にすばやく激しいこと。', 'Gale and Thunder', 'Swift and fierce action.'],
  ['針小棒大', '小さなことを大げさに言うこと。', 'Needle into Pole', 'Exaggerating something small.'],
  ['試行錯誤', '失敗を重ねながら、方法を探すこと。', 'Trial and Error', 'Searching for a way through repeated failure.'],
  ['唯我独尊', '世界で自分だけが尊いと思うこと。', 'I Alone Am Honored', 'Believing oneself supreme.'],
  ['紆余曲折', '事情が入り組んで、変化が多いこと。', 'Twists and Turns', 'A complicated course with many changes.'],
  ['離合集散', '離れたり集まったりすること。', 'Parting and Gathering', 'Coming together and drifting apart.'],
  ['縦横無尽', '自由自在に、思うままに動くこと。', 'Without Limits', 'Moving freely in every direction.'],
  ['千差万別', '物事が、それぞれ大きく違うこと。', 'A Thousand Differences', 'Things all differ greatly.'],
  ['千載一遇', '千年に一度のような、めったにない機会。', 'Once in a Millennium', 'A chance that rarely comes.'],
  ['傍若無人', '周りを気にせず、勝手にふるまうこと。', 'Without Regard for Others', 'Acting as if no one else were there.'],
  ['因果応報', '行いに応じた報いが、必ずくること。', 'Cause and Effect', 'Deeds bring their due consequences.'],
  ['栄枯盛衰', '栄えたり衰えたりする、世の移り変わり。', 'Rise and Fall', 'The flourishing and decline of the world.'],
  ['有為転変', '世の中は、常に移り変わること。', 'Everything Changes', 'The world is always changing.'],
  ['諸行無常', 'すべてのものは、移り変わるということ。', 'All Things Pass', 'Nothing stays the same.'],
  ['不言実行', '黙って、やるべきことを実行すること。', 'Act Without Words', 'Doing what must be done, quietly.'],
  ['有言実行', '口にしたことを、必ず実行すること。', 'Say It, Do It', 'Carrying out what you promised.'],
  ['一心同体', '心を一つにして、結びつくこと。', 'One Heart, One Body', 'United in heart as if one body.'],
  ['一挙両得', '一つの行いで、二つの利益を得ること。', 'Two Gains at Once', 'One action, two benefits.'],
  ['一網打尽', '一度に、すべてをつかまえること。', 'One Net, All Caught', 'Catching everything in one sweep.'],
  ['八方美人', '誰からも、よく思われようとする人。', 'Pleasing Everyone', 'Someone who tries to be liked by all.'],
  ['百花繚乱', '多くの花が、美しく咲き乱れること。', 'A Hundred Flowers in Bloom', 'Many flowers blooming in profusion.'],
  ['品行方正', '行いが正しく、立派なこと。', 'Upright Conduct', 'Behavior that is correct and admirable.'],
  ['才色兼備', '才能と美しさを、ともに持つこと。', 'Talent and Beauty', 'Having both ability and beauty.'],
  ['画竜点睛', '最後の大事な仕上げを加えること。', "Dot the Dragon's Eye", 'Adding the final, crucial touch.'],
  ['山紫水明', '山や川が、清らかで美しいこと。', 'Purple Mountains, Clear Waters', 'Pure and beautiful scenery.'],
  ['雲散霧消', '雲や霧が消えるように、なくなること。', 'Vanish Like Mist', 'Disappearing like clouds and fog.'],
  ['空前絶後', '過去にもなく、将来もないほど珍しいこと。', 'Unprecedented', 'So rare it has never happened and never will.'],
  ['無我夢中', '何かに熱中して、我を忘れること。', 'Lost in the Moment', 'Absorbed and forgetting oneself.'],
  ['無病息災', '病気もなく、健康であること。', 'Good Health', 'Free of illness and well.'],
  ['竜頭蛇尾', '始めは盛んで、終わりは振るわないこと。', "Dragon's Head, Snake's Tail", 'A grand start and a weak finish.'],
  ['明鏡止水', '澄み切って、静かな心の状態。', 'Calm, Clear Mind', 'A pure, serene state of mind.'],
  ['風林火山', '戦いの心得を表した、有名な言葉。', 'Wind, Forest, Fire, Mountain', 'A famed maxim of warfare.'],
  ['破顔一笑', '顔をほころばせて、にっこり笑うこと。', 'A Broad Smile', 'Breaking into a smile.'],
  ['天変地異', '天地に起こる、不思議な災い。', 'Natural Disasters', 'Strange calamities of heaven and earth.'],
  ['魑魅魍魎', 'さまざまな化け物や妖怪。', 'Goblins and Spirits', 'All kinds of monsters and spirits.'],
];
// ---- 密度アップ: 言葉を大幅に追加(字が多くの言葉で共有されるので、並べると言葉になりやすい)。長さの違うもの・重複は取り除く ----
const MORE2 = `天空 天地 天下 天気 天才 天体 天命 天井 天然 天文 天国 天罰 地上 地下 地図 地面 地形 地震 地平 地域 地方 地区 地名 地位 地獄
大海 大河 大波 大風 大雨 大雪 大木 大樹 山頂 山脈 山岳 山道 山村 山奥 川辺 河原 河口 河川 湖畔 湖水 湖面 湖底 海岸 海辺 海底 海面 海流 海賊 海軍 海路 海図 海原
波間 潮風 潮流 潮騒 岸辺 浜辺 砂浜 砂丘 岩石 岩山 岩場 石畳 石像 石碑 石段 石橋 土地 土砂 土壌 土台 田畑 田園 草木 草花 草笛 樹木 樹海 樹齢 樹液
花園 花畑 花束 花火 花見 花嫁 花道 桜花 桜色 紅葉 若葉 青葉 落葉 枯葉 葉脈 新緑 緑地 緑色 雨音 雨雲 雨空 雨天 雨具 雨傘 風音 風景 風車 風船 風向 風力 風速 風邪
雷雲 雷雨 稲妻 稲光 雪山 雪景 雪国 氷結 氷雨 霧雨 濃霧 朝霧 雲海 雲間 虹色 虹彩 光線 光景 光輪 光熱 星影 星座 星雲 星屑 流星 彗星 惑星 衛星 恒星 月影 月食 月面 満月 新月
日光 日没 日食 日傘 夕日 夕方 夜明 夜景 夜道 夜風 夜行 昼間 昼食 昼夜 朝夕
人工 人事 人権 友人 友達 友好 仲間 家族 家庭 家屋 家具 家来 家臣 家系 家訓 兄弟 姉妹 親子 親友 母親 父親 父母 子供 子孫 先祖 祖先 祖父 祖母 夫婦 夫人 恋文 愛人 愛読 愛用 愛国 愛犬 愛称 愛着
感動 感謝 感覚 感想 感性 感心 感激 心情 心理 心身 心配 心臓 心得 心地 勇士 勇姿 勇敢 失望 願望 野望 事実 実際 実力 実現 実行 実験 実感 実話 実在 実体 実績
言論 言動 言霊 文章 文学 文才 文集 文庫 文書 文具 文面 作文 作品 作者 作曲 作戦 作法 作業 詩集 詩篇 和歌 歌詞 歌人 歌手 歌声 歌謡 音色 音声 音符 楽譜 楽器 楽団
本棚 書物 書籍 書店 書斎 書類 書道 書簡 書状 読書 読者 原作 原文 原則 原因 原理 原始 辞典 図書 図形 図面 図案 絵画 絵本 画家 画面 画像 映画 映像 劇場 劇団 演劇 演技 演奏 演説
物理 物質 物体 物事 物資 生物 動物 植物 鉱物
魔術 魔物 魔力 魔導 妖術 幽霊 亡霊 神様 神殿 神社 神秘 神聖 神官 神父 女神 伝承 伝記 剣術 剣豪 刀剣 宝剣 聖剣 聖域 聖者 聖書 聖火 聖地 聖女 竜宮 竜巻 竜王
王子 王女 王様 王宮 王座 王冠 王道 女王 帝王 皇后 皇室 皇族 宮殿 宮廷 城下 城壁 城門 城跡 古城 戦士 戦闘 戦場 戦略 戦術 戦記 戦国 武士 武器 武術 武勇 勝負 勝敗 敗戦 栄誉 名声 名前 名作 名人 名所
探検 探求 発想 発展 発表 発生 出発 到着 出現 旅行 旅路
化学 地理 国語 英語 算数 理科 学問 学校 学生 学園 学習 学年 学力 学説 研究 研修 理論 理解 理由 論文 論争 思考 思索 知識 知恵 知性 知能 知覚 知人 賢人 聖人
使命 寿命 命令 運動 運転 運搬 幸運 幸福 不幸 悲哀 悲鳴 悲願 哀愁 楽園 楽天 快楽 苦痛 苦難 苦労 苦悩 孤独 孤島 自由 自分 自信 自己 自身 自慢 平凡 平原 平野 平均 正解 正直 正体 正面 正式 善悪 悪夢 悪人 善人
夢中 幻覚 空想 妄想 想起 想念 追想 回想 連想 予想 空気 空中 空港 空白 空腹 空洞 青空 大空 夜空
記事 記号 記念 日記 手記 暗記
都会 村落 町人 町並 港湾 市場 市街 街道 街灯 街角 街路 道路 道具 道中 国王 国家 国土 国民 国境 国旗 島民 半島 列島 谷間 峡谷 渓谷 洞窟 洞穴 砂漠 荒地 高原 湿原 氷原
社会 会社 会議 会話 会場 会員 面会 契約 条約 規約 信用 信念 信号 信仰 信条 信義 友好 同盟 同志 同士 同時 同様 同行 同意 改革 変革 維新
技術 技能 技巧 技師 工学 工芸 工夫 工場 工作 機関 機能 機会 機構 機材 機体 機動 器械 器具 兵器 兵士 兵隊 兵力 軍隊 軍人 軍神 軍師 軍略 創作 創始 創世 創立
毒草 毒物 薬学 薬局 医者 医学 医術 医師 病気 病人 病院 看病 治療 治癒 回復
無限 有限 無数 無敵 無言 無心 無情 無常 無理 無用 有名 有力 有益 有効 有利 新世 新生 新年 新人 新作 新聞 新鮮 新星 古今 古代 古書 古典 暗示 暗号 暗殺 黒髪 黒雲 黒板 白雲 白髪 白鳥 白紙 白銀 青天 赤心 紅蓮 黄金 金色 金属 金貨 銀河 銀色 銀貨 鉄道 鉄鋼 鉄板 鉄砲 宝石 宝物 宝島 宝箱 宝庫 財宝 財産
時代 時計 時刻 将来 現代 近代 中世 年月 月日 年代 世代 世紀 一日 一生 一瞬 一歩 今日 明日 昨日 毎日 毎年 毎月 今年 来年 去年 春夏
開始 終了 完成 成功 失敗 努力 挑戦 決戦 決意 決心 決断`.split(/\s+/).filter(Boolean), MORE3 = `想像上 図書室 資料館 美術館 水族館 動物園 植物園 遊園地 停留所 大都市 大宇宙 大自然 大海原 大草原 大平原 大魔王 大帝国 大英雄 大地震 大洪水 大火事 大成功 大失敗 小宇宙 小世界 小説家
作曲家 作詞家 音楽家 科学者 哲学者 数学者 物理学 化学者 考古学 天文学 生物学 地理学 歴史家 歴史書 魔法陣 魔導書 魔導師 魔法書 魔法学 剣術家 騎士道 戦士団 軍事力 想像図 未来図 地球儀
地下室 地下道 地下街 地下鉄 風見鶏 時間割 時間帯 時計台 時計塔 夢想家 幻想曲 幻想的 運命的 理想的 現実的 神秘的 魔術的 雪月花 太平洋 大西洋 日本海 地中海 北極星 北斗星 銀河系 太陽系
超新星 世界樹 世界中 世界史 世界一 言語学 文学史 文学賞 無意識 無限大 無作為 無条件 無関心 無責任 不可能 不思議 不条理 超能力`.split(/\s+/).filter(Boolean);
W2 = [...new Set(W2.concat(MORE2))].filter(w => w.length === 2); W3 = [...new Set(W3.concat(MORE3))].filter(w => w.length === 3);
const MORE_IDIOMS = [['一朝一夕', 'わずかな期間のこと。', 'A Single Morning and Evening', 'A very short time.'], ['一進一退', '良くなったり悪くなったりすること。', 'Two Steps Forward, One Back', 'Alternately improving and worsening.'], ['一喜一憂', '状況に合わせて、喜んだり心配したりすること。', 'Joy and Worry', 'Cheering and fretting with every turn.'], ['一長一短', '長所もあれば、短所もあること。', 'Pros and Cons', 'Having both merits and faults.'], ['一部始終', '始めから終わりまでのすべて。', 'From Start to Finish', 'The whole story from beginning to end.'], ['一目瞭然', '一目見ただけで、はっきり分かること。', 'Clear at a Glance', 'Obvious at first sight.'], ['一刀両断', '思い切って、きっぱり決断すること。', 'One Cut in Two', 'Deciding resolutely.'], ['一念発起', '決心して、何かを始めること。', 'Resolve to Begin', "Making up one's mind to start something."], ['一触即発', '少しのきっかけで、すぐ大事になりそうな状態。', 'On a Hair Trigger', 'About to explode at the slightest touch.'], ['一騎当千', '一人で千人に立ち向かえるほど強いこと。', 'One Rider, a Thousand Foes', 'So strong one can face a thousand.'], ['一蓮托生', '運命を共にすること。', 'Share One Lotus', 'Sharing the same fate.'], ['二束三文', '値段が、ひどく安いこと。', 'Dirt Cheap', 'Sold for next to nothing.'], ['三寒四温', '寒い日と暖かい日が、くり返し来ること。', 'Three Cold, Four Warm', 'Cold and warm days alternating.'], ['三日坊主', '飽きっぽくて、長続きしないこと。', 'Three-Day Monk', 'Never sticking with anything for long.'], ['三位一体', '三つのものが、一つに結びつくこと。', 'Three in One', 'Three things united as one.'], ['四苦八苦', 'たいへん苦労すること。', 'Great Struggle', 'Suffering and struggling a lot.'], ['五里霧中', '状況が分からず、迷うこと。', 'Lost in the Fog', 'Bewildered, unable to see the way.'], ['七転八倒', '苦しくて、転げ回ること。', 'Rolling in Agony', 'Writhing in great pain.'], ['九死一生', '助かる見込みのない所から、助かること。', 'Narrow Escape', 'Barely surviving near-certain death.'], ['十中八九', 'ほとんど、たいてい。', 'Eight or Nine in Ten', 'Almost certainly.'], ['千変万化', 'さまざまに、変化すること。', 'Ever-Changing', 'Changing in countless ways.'], ['無理難題', '無理な、むずかしい注文。', 'Impossible Demands', 'Unreasonable, difficult requests.'], ['奇想天外', '思いもよらない、変わった発想。', 'Wildly Original', 'A strange idea beyond imagination.'], ['起死回生', '絶望的な状況を、立て直すこと。', 'Back from the Brink', 'Reviving a hopeless situation.'], ['吉凶禍福', '幸せと不幸せ。', 'Fortune and Misfortune', 'Good and bad luck.'], ['興味津々', '興味が、次々にわいてくること。', 'Brimming with Interest', 'Curiosity welling up endlessly.'], ['空中楼閣', '根拠のない、空想的な計画。', 'Castle in the Air', 'A baseless, fanciful plan.'], ['孤立無援', '一人きりで、助けがないこと。', 'Alone and Unaided', 'Isolated with no help.'], ['五穀豊穣', '穀物が、豊かに実ること。', 'Abundant Harvest', 'Grains ripening in plenty.'], ['国士無双', '国中で並ぶ者がいない、すぐれた人物。', 'Peerless Hero', 'The best in the land, without equal.'], ['才気煥発', '才能が、あふれ出ること。', 'Brilliant Wit', 'Talent bursting forth.'], ['自画自賛', '自分で自分をほめること。', 'Self-Praise', "Praising one's own work."], ['自業自得', '自分の行いの報いを、自分が受けること。', 'Reap What You Sow', 'Suffering the results of your own deeds.'], ['自給自足', '必要なものを、自分でまかなうこと。', 'Self-Sufficiency', 'Providing for oneself.'], ['自暴自棄', 'やけになって、投げやりになること。', 'Giving Up on Oneself', 'Becoming reckless and despairing.'], ['適材適所', '才能に合った場所に、人を置くこと。', 'Right Person, Right Place', 'Placing people where they suit best.'], ['取捨選択', '必要なものを選び、いらないものを捨てること。', 'Pick and Choose', 'Choosing what to keep and what to discard.'], ['勧善懲悪', '善を勧め、悪を懲らしめること。', 'Reward Good, Punish Evil', 'Encouraging virtue and punishing vice.'], ['感慨無量', '心に深く、感じ入ること。', 'Deeply Moved', 'Filled with deep emotion.'], ['危機一髪', '髪の毛一本ほどの差で、あやういこと。', "A Hair's Breadth", 'Escaping danger by the narrowest margin.'], ['厚顔無恥', 'あつかましくて、恥知らずなこと。', 'Shameless', 'Brazen and without shame.'], ['呉越同舟', '仲の悪い者が、同じ場所にいること。', 'Enemies in One Boat', 'Rivals sharing a boat.'], ['合縁奇縁', '人と人のつながりの、不思議さ。', 'Strange Bonds', 'The mystery of how people connect.'], ['首尾一貫', '始めから終わりまで、変わらないこと。', 'Consistent Throughout', 'Unchanged from start to finish.'], ['青天白日', '心にやましいところがないこと。', 'Clear Blue Sky', 'A conscience free of guilt.'], ['切磋琢磨', '仲間と励まし合って、向上すること。', 'Polish Each Other', 'Improving together through rivalry.'], ['絶体絶命', 'どうにも逃れられない、せっぱ詰まった状態。', 'Cornered', 'A desperate situation with no escape.'], ['前代未聞', '今まで聞いたことのない、めずらしいこと。', 'Unheard Of', 'Something never heard of before.'], ['前途洋洋', '将来が、明るく開けていること。', 'Bright Future', 'A future full of promise.'], ['大胆不敵', '度胸があって、恐れを知らないこと。', 'Bold and Fearless', 'Daring and unafraid.'], ['単刀直入', '前置きなしに、すぐ本題に入ること。', 'Straight to the Point', 'Getting right to the subject.'], ['泰然自若', 'どっしり落ち着いて、動じないこと。', 'Perfectly Composed', 'Calm and unshaken.'], ['臨機応変', 'その場に応じて、うまく対応すること。', 'Adapt to the Moment', 'Responding flexibly to circumstances.'], ['朝令暮改', '命令や方針が、すぐに変わること。', 'Orders Change by Evening', 'Rules that keep changing.'], ['天下無双', 'この世に並ぶ者がいないこと。', 'Unrivaled', 'Without equal in the world.'], ['内憂外患', '国の内外に、心配ごとがあること。', 'Trouble Within and Without', 'Worries both at home and abroad.'], ['半信半疑', '半分信じて、半分疑うこと。', 'Half Believing', 'Half trusting, half doubting.'], ['美辞麗句', '美しく飾った、言葉。', 'Flowery Words', 'Beautifully decorated language.'], ['不撓不屈', '困難にくじけないこと。', 'Unyielding', 'Never giving in to hardship.'], ['不老不死', '年を取らず、死なないこと。', 'Ageless and Deathless', 'Never aging, never dying.'], ['平穏無事', '何事もなく、穏やかなこと。', 'Peace and Quiet', 'Calm with nothing wrong.'], ['本末転倒', '大事なことと、そうでないことを取り違えること。', 'Putting the Cart Before the Horse', 'Mistaking the important for the trivial.'], ['満場一致', 'その場の全員の意見が、一つになること。', 'Unanimous', 'Everyone present agreeing.'], ['優柔不断', 'ぐずぐずして、決断できないこと。', 'Indecisive', 'Wavering and unable to decide.'], ['容姿端麗', '姿や顔立ちが、美しく整っていること。', 'Graceful Looks', 'Having a beautiful, well-formed appearance.'], ['理路整然', '話の筋道が、きちんと通っていること。', 'Logical and Orderly', 'Reasoning that is clear and tidy.'], ['和気藹々', '和やかで、楽しい雰囲気。', 'Warm and Friendly', 'A harmonious, cheerful atmosphere.'], ['我田引水', '自分に都合のよいように、言ったりしたりすること。', 'Divert Water to My Field', "Arguing or acting for one's own benefit."], ['快刀乱麻', 'もつれた物事を、鮮やかに解決すること。', 'Cut Through the Tangle', 'Solving a mess with brilliant ease.'], ['完全無欠', '少しも欠点がないこと。', 'Flawless', 'Without a single fault.'], ['喜色満面', '喜びが、顔いっぱいにあふれること。', 'Beaming with Joy', 'Delight written all over the face.'], ['気宇壮大', '心の構えが、とても大きいこと。', 'Grand Spirit', 'A magnificent, expansive mind.'], ['旧態依然', '昔のままで、進歩がないこと。', 'Same Old Ways', 'Unchanged and without progress.'], ['玉石混交', 'すぐれたものと、そうでないものが混じること。', 'Gems and Stones Mixed', 'The good and the poor mixed together.'], ['金科玉条', '大切にして、守るべき決まり。', 'Golden Rule', 'A precious rule to be upheld.'], ['君子豹変', '態度が、がらりと変わること。', 'A Sudden Change', 'A complete change of attitude.'], ['軽挙妄動', '深く考えず、軽はずみに行動すること。', 'Rash Action', 'Acting thoughtlessly.'], ['言語道断', 'あまりにひどくて、言葉も出ないこと。', 'Outrageous', 'Beyond words, shockingly bad.'], ['光風霽月', '心がさっぱりして、わだかまりがないこと。', 'Clear Breeze, Bright Moon', 'A pure heart without resentment.'], ['百発百中', '狙いが、すべて当たること。', 'Never Miss', 'Every shot hits the mark.'], ['百戦錬磨', '多くの経験を積んで、鍛えられていること。', 'Battle-Hardened', 'Seasoned by many experiences.'], ['千客万来', '客が、たくさん来ること。', 'Many Visitors', 'Guests arriving in great numbers.'], ['風光明媚', '自然の景色が、美しいこと。', 'Scenic Beauty', 'Lovely natural scenery.'], ['悠悠自適', '世間にとらわれず、のんびり暮らすこと。', 'Living at Leisure', 'Living freely and peacefully.']];
{ const seen = new Set(IDIOMS.map(i => i[0])); for (const it of MORE_IDIOMS) if (it[0].length === 4 && !seen.has(it[0])) { IDIOMS.push(it); seen.add(it[0]); } }
const W4 = IDIOMS.map(i => i[0]);
const ALL = W2.concat(W3, W4), SET = new Map(ALL.map(w => [w, w.length])), IDX = new Map(IDIOMS.map((i, k) => [i[0], k]));
const BIGRAM = new Set(); for (const w of ALL) for (let i = 0; i + 1 < w.length; i++) BIGRAM.add(w[i] + w[i + 1]);   // 言葉の途中に現れる隣り合う2字(CPUの目安)
const CHARS = new Set(ALL.join(''));

// 英語(四字熟語の呼び名と意味)。ログに出る行の訳
const en = {}; for (const [n, ja, g, m] of IDIOMS) { en[n] = g; en[ja] = m; }
DG.KJ = { W2, W3, W4, IDIOMS, ALL, SET, IDX, BIGRAM, CHARS };
DG.i18n.add(Object.assign(en, {
  '落ちている間も、字を入れ替えられます。1個につき1回!': 'You can swap letters even while a piece is falling. One swap per piece!', '⇄ 入れ替えOK': '⇄ Swap ready', '⇄ -': '⇄ -',
  '← → 移動  ↓ 加速  ↑ 回転': '← → Move  ↓ Soft drop  ↑ Rotate', 'Space 即落下': 'Space Hard drop', 'I J K L 字  U/O 入替': 'I J K L Cursor  U/O Swap',
  'A D 移動  S 加速  W 回転': 'A D Move  S Soft drop  W Rotate', 'E 即落下': 'E Hard drop', 'T F G H 字  R/Y 入替': 'T F G H Cursor  R/Y Swap', '/ 即落下': '/ Hard drop',
  '中身: 言葉 (K)': 'Tiles: Words (K)', '🔤 中身: 文字 (K)': '🔤 Tiles: Letters (K)',
  '← → ページ': '← → Page', '四字熟語': 'Four-character idioms', 'Esc / Enter / B / タップで もどる   ← → ページ': 'Esc / Enter / B / Tap: Back   ← → Page',
}), [
  [/^『(.+)』が成立した。$/, m => `"${m[1]}" formed.`],
  [/^『(.+)』……(.+)$/, m => `"${DG.t(m[1])}"... ${DG.t(m[2])}`],
  [/^四字熟語 (\d+)\s+最大連鎖 (\d+)$/, m => `Idioms ${m[1]}   Best chain ${m[2]}`],
  [/^字: (.+)$/, m => `Try: ${m[1]}`],
  [/^([^\s+→]+)\+([^\s+→]+)$/, m => `${DG.t(m[1])}+${DG.t(m[2])}`],             // 図鑑のレシピ(A+B)
  [/^(\d+) \/ (\d+) 発見$/, m => `${m[1]} / ${m[2]} found`],
]);
})();
