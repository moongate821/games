// 言語(日本語 / English)と設定(音量)。画面の文字はすべて DG.text を通るので、そこで DG.t() が翻訳する。
// ゲーム固有の訳は DG.i18n.add(辞書, [正規表現,関数]の配列) で足す。英語表示で訳が抜けた日本語は DG.i18n.missing に溜まる(テスト用)。
(() => {
const DG = window.DG = window.DG || {};
const KEY = 'wbd_settings';
const defaults = { lang: ((navigator.language || 'ja').toLowerCase().startsWith('ja')) ? 'ja' : 'en', music: 6, sfx: 6 };
let S = Object.assign({}, defaults);
try { const d = JSON.parse(localStorage.getItem(KEY)); if (d) S = Object.assign(S, d); } catch (e) {}
const save = () => { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) {} };

const EN = {
  // ---- メニュー・共通 ----
  'アカシック・エディタ': 'The Akashic Editor',
  'ブロックは「言葉」。となり合わせると合体して、物語になる。': 'Blocks are WORDS. Put them side by side and they merge into a story.',
  '章を完成させて、世界の編纂者になろう。': 'Complete chapters and become the Compiler of Worlds.',
  '▶ はじめる': '▶ Start', '1P ひとりで': '1P Solo', '2P ふたりで対戦': '2P Versus', '🤖 CPUと対戦': '🤖 vs CPU', '👀 デモ観戦': '👀 Watch Demo',
  '🏆 ランキング (R)': '🏆 Ranking (R)', '⚙ 設定 (O)': '⚙ Settings (O)', '📖 図鑑 (B)': '📖 Codex (B)', 'あなたの称号': 'Your title', 'あなた': 'You',
  '難しさ (Q)': 'Difficulty (Q)',
  '← → むずかしさ  ↑ ↓ / 1-4 遊び方  T 駒  O 設定  R ランキング  B 図鑑  Enter / タップで スタート  M ミュート  20秒放置でデモ': '← → Difficulty   ↑ ↓ / 1-4 Play style   T Piece   O Settings   R Ranking   B Codex   Enter / Tap: Start   M Mute   Idle 20s: Demo',
  'P で さいかい': 'Press P to resume', 'DEMO  ─  AI対AI    キー / タップでメニューへ': 'DEMO — AI vs AI    Press any key / tap for the menu',
  'Enter / タップ: もういちど    Esc: メニューへ': 'Enter / Tap: Retry    Esc: Menu', 'Esc: メニュー': 'Esc: Menu',
  'なまえを入力 (8文字まで)': 'Enter your name (up to 8 letters)', 'CPU が操作中': 'CPU is playing',
  'よわい': 'Weak', 'ふつう': 'Normal', 'つよい': 'Strong',
  '相殺!': 'Offset!', '矛盾が ふってきた…': 'Contradictions incoming...',
  // ---- 操作の説明 ----
  '← → 移動  ↓ 加速': '← → Move  ↓ Soft drop', '↑ 回転  Z 逆回転': '↑ Rotate  Z Rotate back', 'A D 移動  S 加速': 'A D Move  S Soft drop',
  'W 回転  Q 逆回転': 'W Rotate  Q Rotate back', '↑ 回転  . 逆回転': '↑ Rotate  . Rotate back', 'P 停止  M ミュート': 'P Pause  M Mute',
  'Space 即落下': 'Space Hard drop', 'E 即落下': 'E Hard drop', '/ 即落下': '/ Hard drop', '即落下': 'Hard drop',
  // ---- 設定画面 ----
  '設定': 'SETTINGS', '言語 / Language': 'Language / 言語', 'BGMの音量': 'Music volume', '効果音の音量': 'Sound effects volume', 'もどる': 'Back',
  '↑ ↓ えらぶ   ← → かえる   Esc / Enter で もどる': '↑ ↓ Select   ← → Change   Esc / Enter: Back', '日本語': '日本語', 'English': 'English',
  // ---- ランキング ----
  '★ 新しい称号! ★': '★ New title! ★', 'なまえ': 'Name', 'タイプして Enter で決定': 'Type, then press Enter', 'Esc / Enter / タップで もどる': 'Esc / Enter / Tap to go back',
  '(まだ一章も書けなかった)': '(Not a single chapter was written.)', '物語のあらすじ': 'Synopsis',
};

const T = s => t(s);
const PAT = [
  [/^(\d+) こ おくった!$/, m => `Sent ${m[1]}!`],
  [/^(\d+) 連鎖!$/, m => `${m[1]} CHAIN!`],
  [/^矛盾 \+(\d+)$/, m => `Contradictions +${m[1]}`],
  [/^(1P|2P) (.+)$/, m => `${m[1]} ${T(m[2])}`],
  [/^CPU: (.+) \(C\)$/, m => `CPU: ${T(m[1])} (C)`],
  [/^CPU (よわい|ふつう|つよい)$/, m => `CPU ${T(m[1])}`],
  [/^\((よわい|ふつう|つよい)\)$/, m => `(${T(m[1])})`],
  [/^CPU\((.+)\)撃破$/, m => `Beat CPU (${T(m[1])})`],
  [/^次の称号まで あと (\d+)$/, m => `${m[1]} more to the next title`],
  [/^ランキング (\d+)位!$/, m => `Rank #${m[1]}!`],
  [/^(\d+)連鎖$/, m => `${m[1]} chain${m[1] === '1' ? '' : 's'}`],
  [/^(.+) ・(.+)$/, m => `${T(m[1])} · ${T(m[2])}`],
  [/^(Space|E|\/) (即落下)$/, m => `${m[1]} ${T(m[2])}`],
];
const extraPat = [];
const cache = { en: new Map() }, missing = new Set(), JP = /[ぁ-んァ-ヶ一-龥]/;
function t(s) {
  if (S.lang === 'ja' || typeof s !== 'string' || !s) return s;
  let r = cache.en.get(s); if (r !== undefined) return r;
  r = EN[s];
  if (r === undefined) for (const [re, fn] of PAT.concat(extraPat)) { const m = re.exec(s); if (m) { const o = fn(m); if (o != null) { r = o; break; } } }
  if (r === undefined) { r = s; if (JP.test(s)) missing.add(s); }
  cache.en.set(s, r); return r;
}
function setLang(l) { S.lang = l; cache.en.clear(); try { document.documentElement.lang = l; } catch (e) {} save(); }
function add(dict, pats) { Object.assign(EN, dict || {}); if (pats) extraPat.push(...pats); cache.en.clear(); }
try { document.documentElement.lang = S.lang; } catch (e) {}
DG.t = t;
DG.settings = S;
DG.i18n = { EN, missing, setLang, save, add, get lang() { return S.lang; } };
})();
