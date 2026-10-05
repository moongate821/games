// 言語(日本語 / English)と設定(音量)。画面の文字はすべて DG.text を通るので、そこで DG.t() が翻訳する。
// 英語表示で訳が抜けた日本語は DG.i18n.missing に溜まる(テスト用)。
(() => {
const DG = window.DG = window.DG || {};
const KEY = 'smokechain_settings';
const defaults = { lang: ((navigator.language || 'ja').toLowerCase().startsWith('ja')) ? 'ja' : 'en', music: 6, sfx: 6 };
let S = Object.assign({}, defaults);
try { const d = JSON.parse(localStorage.getItem(KEY)); if (d) S = Object.assign(S, d); } catch (e) {}
const save = () => { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) {} };

const EN = {
  // ---- メニュー・共通 ----
  'どっちで あそぶ?': 'Pick your game!', '1P ひとりで': '1P Solo', '2P ふたりで対戦': '2P Versus', '🤖 CPUと対戦': '🤖 vs CPU', '👀 デモ観戦': '👀 Watch Demo',
  '🏆 ランキング (R)': '🏆 Ranking (R)', '⚙ 設定 (O)': '⚙ Settings (O)', 'あなたの称号': 'Your title', 'あなた': 'You',
  '実体化モード (Q)': 'Materialize mode (Q)', '季節モード (Q)': 'Season mode (Q)', 'ランダム': 'Random',
  '← → ゲーム  ↑ ↓ / 1-4 遊び方  Q モード  O 設定  Enter / タップで スタート  M ミュート  20秒放置でデモ': '← → Game   ↑ ↓ / 1-4 Play style   Q Mode   O Settings   Enter / Tap: Start   M Mute   Idle 20s: Demo',
  'P で さいかい': 'Press P to resume', 'DEMO  ─  AI対AI    キー / タップでメニューへ': 'DEMO — AI vs AI    Press any key / tap for the menu',
  'Enter / タップ: もういちど    Esc: メニューへ': 'Enter / Tap: Retry    Esc: Menu', 'Esc: メニュー': 'Esc: Menu',
  'なまえを入力 (8文字まで)': 'Enter your name (up to 8 letters)', 'CPU が操作中': 'CPU is playing',
  'よわい': 'Weak', 'ふつう': 'Normal', 'つよい': 'Strong', 'やさしい': 'Easy', 'むずかしい': 'Hard', 'カオス': 'Chaos',
  'はる': 'Spring', 'なつ': 'Summer', 'あき': 'Autumn', 'あらし': 'Storm',
  '相殺!': 'Offset!', 'おじゃまが ふってきた…': 'Garbage incoming...',
  // ---- 操作の説明 ----
  '← → 移動  ↓ 加速': '← → Move  ↓ Soft drop', '↑ 回転  Z 逆回転': '↑ Rotate  Z Rotate back', 'A D 移動  S 加速': 'A D Move  S Soft drop',
  'W 回転  Q 逆回転': 'W Rotate  Q Rotate back', '↑ 回転  . 逆回転': '↑ Rotate  . Rotate back', 'P 停止  M ミュート': 'P Pause  M Mute',
  'Space 即落下': 'Space Hard drop', 'E 即落下': 'E Hard drop', '/ 即落下': '/ Hard drop', 'Space 観測': 'Space Observe', 'E 観測': 'E Observe', '/ 観測': '/ Observe',
  '即落下': 'Hard drop', '観測': 'Observe',
  // ---- 設定画面 ----
  '設定': 'SETTINGS', '言語 / Language': 'Language / 言語', 'BGMの音量': 'Music volume', '効果音の音量': 'Sound effects volume', 'もどる': 'Back',
  '↑ ↓ えらぶ   ← → かえる   Esc / Enter で もどる': '↑ ↓ Select   ← → Change   Esc / Enter: Back', '日本語': '日本語', 'English': 'English',
  // ---- TERRARIUM GENESIS ----
  '管理室、起動しました。創造主様、まずは土を。': 'Control room online. Creator, let us begin with soil.',
  '土が天井に達しました。再構築しますか?(Enter)': 'The soil has reached the ceiling. Rebuild? (Enter)',
  '育てて進化! 土・水・種・光で': 'Grow and evolve! With soil, water,', '小さな森をつくろう(4つの季節)': 'seeds and light, make a tiny forest (4 seasons)',
  '種を土にのせる→水→光で木に。木3つで「森」': 'Seed on soil → water → light = tree. 3 trees = forest', '同じものが4つつながっても消える': '4 or more of the same kind also clear',
  '見事な森の構築、お見事です、創造主様。': 'A magnificent forest, Creator. Well done.', '光合成を確認。木になりました。': 'Photosynthesis confirmed. It has become a tree.',
  '土壌の水分量が規定値に達しました。': 'Soil moisture has reached the threshold.', '発芽プロセスに移行します。': 'Starting the sprouting process.',
  '余った物質を還元しました。': 'Leftover matter has been reduced.', '育てきれず、枯れてしまいました…': 'It could not be tended in time and withered...',
  '嵐です! 石が降ってきました。': 'A storm! Rocks are falling.', '恵みの雨です。命のエネルギーが降ってきました。': 'A blessed rain! Life energy is falling.',
  'ふつうに育てよう': 'Just grow things.', '芽は10手、草は9手で枯れる': 'Sprouts wither in 10 turns, grass in 9', '芽7手・草6手で枯れる': 'Sprouts 7 / grass 6 turns to wither',
  'NEXTは1つだけ': 'Only 1 NEXT shown', '芽8手・草7手で枯れる': 'Sprouts 8 / grass 7 turns to wither', '8手ごとに嵐(予告あり)': 'A storm every 8 turns (announced)',
  '同じ4つつなげても きえる': '4 of a kind also clears', '石の雨': 'Rock rain', '命の雨': 'Life rain', 'θ': 'θ',
  // ---- QUANTUM DROP ----
  'クォーク': 'Quark', '電子': 'Electron', 'フォトン': 'Photon', '崩壊弾': 'Collapse Bomb', '万能': 'Wild', 'エル': 'Elle',
  '3マス手前': '3 cells ahead', '2マス手前': '2 cells ahead', '1マス手前': '1 cell ahead', 'ランダム(1〜4)': 'Random (1-4)',
  'あー、観測者くん。宇宙が崩れる前に、ひとつよろしく。': 'Ah, Observer. Do your thing before the universe falls apart.',
  '真空崩壊、進行中。…もう一回、ループしてみる?(Enter)': 'Vacuum collapse in progress... Try another loop? (Enter)',
  'ふわふわ「確率の雲」の素粒子が': 'Fluffy particles in a "probability cloud"', '直前に「実体化」!(4段階)': 'materialize just before landing! (4 modes)',
  '同じ粒子を4つつなげて消そう': 'Connect 4 of the same particle to clear them', 'もつれペアは 片方が決まると 相方も決まる': 'Entangled pairs: fix one and the other is fixed too',
  'もつれ解除。色がきまったよ。': 'Entanglement collapsed. The color is set.', '実体化。ここから先は変えられないよ。': 'Materialized. No changing it now.',
  'そことそこ、もつれてる。片方が決まれば、もう片方も決まるよ。': 'Those two are entangled. Fix one and the other follows.',
  '次は特殊「崩壊弾」。落ちた先の色が全部消えるよ。': 'Next: special "Collapse Bomb". It clears every particle of the color it lands on.',
  '次は特殊「万能」。どの色にもなれるよ。': 'Next: special "Wild". It can be any color.',
  '崩壊弾だ。消したい色の上に落としてごらん。': 'A Collapse Bomb. Drop it on the color you want gone.', '万能ブロックだ。色をつなげてみて。': 'A Wild block. Try linking colors with it.',
  'そこはもつれてる。片方を確定させたら、もう片方も収束したろ?': 'Those were entangled. Fixing one collapsed the other, see?', '今の観測タイミング、悪くないね。': 'Nice observation timing.',
  '崩壊弾は不発だったよ': 'The Collapse Bomb fizzled.', '連鎖崩壊…君、宇宙の寿命を延ばしてるよ。': "Chain collapse... you're extending the universe's lifespan.",
  'このセクターの物理法則は保たれた。': "This sector's laws of physics hold.", '実体化ライン': 'Materialize line', '特殊!': 'SPECIAL!',
  'すくない粒子ほど出やすい': 'Rarer particles appear more often', '落ちた先の色を全部消す': 'Clears the color it lands on', 'どの色にもなる万能': 'Counts as any color',
  '観測キーで先に実体化': 'Observe key: materialize early',
  // ---- ランキング・称号 ----
  'たねまきびと': 'Seed Sower', 'わかばの庭師': 'Sprout Gardener', '草原の管理者': 'Meadow Keeper', '森の育て手': 'Forest Grower', '箱庭の創造主': 'Terrarium Creator',
  '世界樹の守り人': 'Guardian of the World Tree', '創世の大賢者': 'Sage of Genesis',
  '観測見習い': 'Observer Apprentice', 'ゆらぎの旅人': 'Fluctuation Traveler', '確率の観測者': 'Probability Observer', '収束の使い手': 'Wielder of Collapse',
  '時空観測員': 'Spacetime Observer', '真空の守護者': 'Guardian of the Vacuum', '宇宙の管理者': 'Keeper of the Universe',
  '連鎖の神': 'God of Chains', '大連鎖の魔術師': 'Grand Chain Wizard', '連鎖の名手': 'Chain Master', '森の賢者': 'Forest Sage', 'はじめての森': 'First Forest',
  '還元の達人': 'Reduction Expert', '崩壊弾の使い手': 'Bomb Handler', '観測マスター': 'Observation Master', '消去の鬼': 'Clearing Fiend', '攻撃の名人': 'Attack Ace', '持久の人': 'Endurance',
  '★ 新しい称号! ★': '★ New title! ★', 'なまえ': 'Name', 'タイプして Enter で決定': 'Type, then press Enter', 'Esc / Enter / タップで もどる': 'Esc / Enter / Tap to go back',
};

// 数字入りの文(正規表現)
const T = s => t(s);
const PAT = [
  [/^(\d+) こ おくった!$/, m => `Sent ${m[1]}!`],
  [/^(\d+) 連鎖!$/, m => `${m[1]} CHAIN!`],
  [/^おじゃま \+(\d+)$/, m => `Garbage +${m[1]}`],
  [/^(1P|2P) (.+)$/, m => `${m[1]} ${T(m[2])}`],
  [/^CPU: (.+) \(C\)$/, m => `CPU: ${T(m[1])} (C)`],
  [/^CPU (よわい|ふつう|つよい)$/, m => `CPU ${T(m[1])}`],
  [/^\((よわい|ふつう|つよい)\)$/, m => `(${T(m[1])})`],
  [/^CPU\((.+)\)撃破$/, m => `Beat CPU (${T(m[1])})`],
  [/^(\d)マス手前$/, m => `${m[1]} cell${m[1] === '1' ? '' : 's'} ahead`],
  [/^森 (\d+)\s+最大連鎖 (\d+)$/, m => `Forests ${m[1]}   Best chain ${m[2]}`],
  [/^消去 (\d+)\s+最大連鎖 (\d+)$/, m => `Cleared ${m[1]}   Best chain ${m[2]}`],
  [/^【(.+)】(.+) 得点×(.+)$/, m => `[${T(m[1])}] ${T(m[2])}  Score ×${m[3]}`],
  [/^【(.+)】得点×(.+)$/, m => `[${T(m[1])}]  Score ×${m[2]}`],
  [/^(.+)で実体化$/, m => `Materializes ${T(m[1])}`],
  [/^⛈ あと(\d+)手: (.+)$/, m => `⛈ In ${m[1]} turn${m[1] === '1' ? '' : 's'}: ${T(m[2])}`],
  [/^★(.+) (つぎ!|あと(\d+)手)$/, m => `★${T(m[1])} ${m[2] === 'つぎ!' ? 'Next!' : 'in ' + m[3] + ' turns'}`],
  [/^崩壊弾! (.+)を (\d+)こ 消した$/, m => `Collapse Bomb! Cleared ${m[2]} ${m[1].split('と').map(T).join(' & ')}`],
  [/^(クォーク|電子|フォトン) (\d+%)\s+\((\d+)\)$/, m => `${T(m[1])} ${m[2]}  (${m[3]})`],
  [/^次の称号まで あと (\d+)$/, m => `${m[1]} more to the next title`],
  [/^ランキング (\d+)位!$/, m => `Rank #${m[1]}!`],
  [/^(\d+)連鎖$/, m => `${m[1]} chain${m[1] === '1' ? '' : 's'}`],
  [/^(.+) ・(.+)$/, m => `${T(m[1])} · ${T(m[2])}`],
  [/^あそんだ回数\s+テラリウム (\d+)\s+量子 (\d+)\s+CPU撃破\s+よわい (\d+)\s+ふつう (\d+)\s+つよい (\d+)\s+ふたり対戦 (\d+)回$/,
    m => `Games played  Terrarium ${m[1]}  Quantum ${m[2]}    CPU beaten  Weak ${m[3]}  Normal ${m[4]}  Strong ${m[5]}    2P battles ${m[6]}`],
  [/^(Space|E|\/) (即落下|観測)$/, m => `${m[1]} ${T(m[2])}`],
  [/^([\wθ]+) (.+)$/, m => (/[ぁ-んァ-ヶ一-龥]/.test(m[2]) && /^(θ|エル)$/.test(m[1])) ? `${T(m[1])} ${T(m[2])}` : null],
];
const cache = { en: new Map() }, missing = new Set(), JP = /[ぁ-んァ-ヶ一-龥]/;
function t(s) {
  if (S.lang === 'ja' || typeof s !== 'string' || !s) return s;
  let r = cache.en.get(s); if (r !== undefined) return r;
  r = EN[s];
  if (r === undefined) for (const [re, fn] of PAT) { const m = re.exec(s); if (m) { const o = fn(m); if (o != null) { r = o; break; } } }
  if (r === undefined) { r = s; if (JP.test(s)) missing.add(s); }
  cache.en.set(s, r); return r;
}
function setLang(l) { S.lang = l; cache.en.clear(); try { document.documentElement.lang = l; } catch (e) {} save(); }
try { document.documentElement.lang = S.lang; } catch (e) {}
DG.t = t;
DG.settings = S;
DG.i18n = { EN, missing, setLang, save, get lang() { return S.lang; } };
})();
