// 言語(日本語 / English)と難易度(4段階)。ほかのどのファイルよりも先に読み込む(index.html の p5 の次)。
//  ・TR(日本語, English): いまの言語の文字を返す。画面に出す文字は、毎回これを通すので、ゲーム中に切り替えても、すぐ変わる。
//  ・HTML の文字は、要素に data-i18n="キー" を付け、日本語は index.html に書いたまま、英語は下の HTML_EN に書く。
//  ・DF(): いまの難易度の倍率(sketch.js などが使う)。ふつう(1)は、以前のバランスと同じ。
//  ・設定は localStorage の sf_settings に、lang・diff として保存する。確認用: URL に #lang=en や #diff=3 を付けると、保存せずに、その設定で始まる。
const SF_KEY = 'sf_settings';
function sfLoad() { try { return JSON.parse(localStorage.getItem(SF_KEY) || 'null') || {}; } catch (e) { return {}; } }
function sfSave(patch) { try { localStorage.setItem(SF_KEY, JSON.stringify(Object.assign(sfLoad(), patch))); } catch (e) { /* 保存できなくても、遊べる */ } }

const SF = { lang: 'ja', diff: 1 };
(function () {
  const s = sfLoad(), nav = (typeof navigator !== 'undefined' && (navigator.language || '')) || 'ja';
  SF.lang = s.lang === 'en' || s.lang === 'ja' ? s.lang : (/^ja/i.test(nav) ? 'ja' : 'en');   // 初めての起動: ブラウザの言語が日本語なら日本語、そうでなければ英語
  SF.diff = Number.isInteger(s.diff) && s.diff >= 0 && s.diff <= 3 ? s.diff : 1;
  const hl = /[#,]lang=(ja|en)/.exec(location.hash), hd = /[#,]diff=([0-3])/.exec(location.hash);
  if (hl) SF.lang = hl[1]; if (hd) SF.diff = +hd[1];
})();
const TR = (ja, en) => (SF.lang === 'en' && en !== undefined ? en : ja);

// ---------- 難易度(0〜3) ----------
// dmg=自機が受けるダメージ、hp=敵の体力、fire=敵が撃つ間隔(大きいほど、ゆっくり)、count=敵の数、spd=敵の速さ、lives=最初の残機、score=得点の倍率
const DIFFS = [
  { id: 'easy', ja: 'かんたん', en: 'Easy', dmg: 0.6, hp: 0.75, fire: 1.4, count: 0.7, spd: 0.9, lives: 5, score: 0.6,
    jaD: 'はじめての人向け。敵の攻撃がゆるく、数も少なめ。残機5。', enD: 'For first-timers. Gentler enemy fire, fewer enemies. 5 lives.' },
  { id: 'normal', ja: 'ふつう', en: 'Normal', dmg: 1, hp: 1, fire: 1, count: 1, spd: 1, lives: 3, score: 1,
    jaD: '標準の難しさ。残機3。', enD: 'The standard challenge. 3 lives.' },
  { id: 'hard', ja: 'むずかしい', en: 'Hard', dmg: 1.35, hp: 1.3, fire: 0.82, count: 1.25, spd: 1.07, lives: 3, score: 1.4,
    jaD: '敵が硬く、速く、よく撃つ。数も多い。得点1.4倍。', enD: 'Tougher, faster enemies that fire more often, and more of them. Score x1.4.' },
  { id: 'extreme', ja: '超難関', en: 'Extreme', dmg: 1.8, hp: 1.7, fire: 0.68, count: 1.5, spd: 1.15, lives: 2, score: 2,
    jaD: '最高難度。被ダメージ大、敵は大群。残機2。得点2倍。', enD: 'The ultimate test. Heavy damage, huge swarms. 2 lives. Score x2.' },
];
const DF = () => DIFFS[SF.diff];
const diffName = (i = SF.diff) => TR(DIFFS[i].ja, DIFFS[i].en);
const diffRankKey = () => SF.diff === 1 ? 'sf_rank' : 'sf_rank_' + DIFFS[SF.diff].id;   // ランキングは、難易度ごと(ふつうは、以前のまま)
function diffStats(i = SF.diff) {
  const d = DIFFS[i], x = v => '×' + v;
  return TR(`被ダメージ ${x(d.dmg)}　敵の体力 ${x(d.hp)}　敵の数 ${x(d.count)}　敵の射撃間隔 ${x(d.fire)}　残機 ${d.lives}　得点 ${x(d.score)}`,
           `Damage taken ${x(d.dmg)}   Enemy HP ${x(d.hp)}   Enemy count ${x(d.count)}   Enemy fire interval ${x(d.fire)}   Lives ${d.lives}   Score ${x(d.score)}`);
}

// ---------- 敵・障害物の英語名(assets.js の name に対応。画面に出るのは、この名前) ----------
const ASSET_EN = { '01': 'Title screen', '02': 'Cockpit HUD', '03': 'Results & ranking', '04': 'Player ship', '05': 'Player ship (damaged)', '06': 'CHASER', '07': 'GUNNER', '08': 'SWARM', '09': 'INTERCEPTOR', '10': 'STEALTH FIGHTER',
  '11': 'Deep space', '12': 'Standard grid', '13': 'Complex grid', '14': 'Vast space', '15': 'Final planet approach', '16': 'ASTEROID (small)', '17': 'ASTEROID (large)', '18': 'SPACE DEBRIS', '19': 'DEFENSE LASER GRID', '20': 'Trap grid',
  '21': 'MINI-BOSS (polyhedron)', '22': 'DEFENSE BATTLESHIP', '23': 'Final planet core (shell)', '24': 'Final planet core', '25': 'CORE GUARDIAN', '26': 'Warp (start)', '27': 'Warp (end)', '28': 'Enemy explosion', '29': 'Wide cannon', '30': 'Core explosion' };

// ---------- HTML の英語(日本語は、index.html に書いたまま) ----------
const HTML_EN = {
  a_game: 'STARFIGHTER game screen', a_pause: 'Pause', a_settings: 'Settings',
  y_title: 'Ship Gallery', y_faction: 'Faction', y_class: 'Class', y_view: 'View', y_exit: 'Back to title',
  y_f_empire: 'Empire', y_f_machine: 'Machine', y_f_bio: 'Bio', y_f_ancient: 'Ancient', y_f_void: 'Void',
  y_c_cruiser: 'Cruiser', y_c_battle: 'Battleship', y_c_carrier: 'Carrier', y_c_dread: 'Dreadnought', y_c_titan: 'Titan', y_c_fighter: 'Fighters & drones',
  t_tag: 'Carve a path through the galaxy with trails of light.',
  t_desc: '5 factions. 25 bosses.<br>Transform your fighter and slip between the enemy fleets.',
  t_continue: 'Continue', t_launch: 'LAUNCH <span>↗</span>', t_coop: 'TWO PLAYERS <span>⧉</span>',
  t_help: 'Controls <span>+</span>', t_yard: 'Ship Gallery <span>◇</span>', t_settings: 'Settings <span>⚙</span>', t_install: 'Add as an app <span>↓</span>',
  p_title: 'Paused', p_text: 'Resume flight when you are ready.', p_resume: 'RESUME ↗', p_help: 'Controls', p_settings: 'Settings', p_small: 'Press Esc / P or the controller Start to resume',
  h_title: 'Controls',
  h_move: '<b>Move</b><span>Arrow keys / Left stick / Drag the left side of the screen</span>',
  h_fire: '<b>Fire</b><span>Space / A, R1 / FIRE</span>',
  h_lock: '<b>Homing missiles</b><span>Hold X / B, L1 / LOCK, then release</span>',
  h_boost: '<b>Boost / Brake</b><span>Shift, Z / R2, L2 / BOOST, BRAKE</span>',
  h_form: '<b>Transform / Wide cannon</b><span>F, B / Y, X / FORM, WIDE</span>',
  h_roll: '<b>Roll / U-turn</b><span>Q, E, V / Right stick, R3 / ROLL, U-TURN</span>',
  h_view: '<b>View / Sound</b><span>C: cockpit (instrument panel and glass HUD) / I: invert Y / M: mute</span>',
  h_fa: '<b>Flight assist</b><span>G: on / off (when off, sideways drift remains)</span>',
  h_map: '<b>Star map</b><span>At a fork, choose a route with ← → and confirm with Space / Enter / A / tap</span>',
  h_pause: '<b>Pause</b><span>Esc, P / Start / the Ⅱ button at the bottom of the screen</span>',
  h_ship: '<b>Fighters</b><span>Choose before launch: VALKYRIE (standard), RAPTOR (fast and agile), BASTION (tough, 3 guns). A hidden fighter can be unlocked.</span>',
  h_coop: '<b>Two players (PC version)</b><span>Top screen is 1P, bottom is 2P. 2P uses a gamepad, or W A S D to move, R fire, T lock-on, Y boost, H brake, 1 2 roll, 3 wide cannon, 4 transform, 5 U-turn.</span>',
  h_brief: 'Head for the planet and destroy the boss or the fleet. Routes fork and merge at hubs, leading to a single final path. Destroy a battleship\'s shield generators first to open its bridge to attack. Cruise form is for fast travel; homing missiles and the wide cannon work in combat form.',
  h_small: 'Buy upgrades in the hangar with Space / A, launch with Enter / Start. On touch, tap an item to select and tap again to buy. The game saves when you reach the hangar, buy something, or launch to the next stage. Resume on the same device and app.',
  h_ok: 'GOT IT',
  i_title: 'Add to Home Screen',
  i_ios: '<b>iPhone / iPad</b><br>From Safari\'s Share menu, choose "Add to Home Screen". If shown, turn on "Open as Web App".',
  i_win: '<b>Windows</b><br>Use the install icon in the Edge address bar, or install from the "Apps" menu.',
  i_note: 'After the first load and offline preparation finish, you can play without a connection from next time. Saves are kept per device.',
  i_close: 'Close',
  s_title: 'Settings', s_lang: 'Language', s_diff: 'Difficulty', s_sfx: 'Sound effects', s_bgm: 'Music', s_lite: 'Light mode', s_note: 'Difficulty can also be changed during play. Scores are ranked per difficulty.', s_close: 'Close',
  rotate: 'Rotate to landscape for a wider view ↻',
};

function applyHtml() {
  const en = SF.lang === 'en';
  for (const el of document.querySelectorAll('[data-i18n]')) {
    if (el._ja === undefined) el._ja = el.innerHTML;   // 日本語は、最初の1回だけ、覚える
    const k = el.dataset.i18n; el.innerHTML = en && HTML_EN[k] !== undefined ? HTML_EN[k] : el._ja;
  }
  for (const el of document.querySelectorAll('[data-i18n-aria]')) {
    if (el._jaAria === undefined) el._jaAria = el.getAttribute('aria-label');
    const k = el.dataset.i18nAria; el.setAttribute('aria-label', en && HTML_EN[k] !== undefined ? HTML_EN[k] : el._jaAria);
  }
  document.documentElement.lang = SF.lang;
  const md = document.querySelector('meta[name=description]'); if (md) { if (md._ja === undefined) md._ja = md.content; md.content = en ? 'A wireframe flight shooter racing through a neon universe.' : md._ja; }
}
function setLang(l) {
  if (l !== 'ja' && l !== 'en') return;
  SF.lang = l; sfSave({ lang: l }); applyHtml();
  if (typeof refreshSettingsUI === 'function') refreshSettingsUI();
  if (typeof syncAppUI === 'function') syncAppUI(true);
}
function setDiff(i) {
  if (!(i >= 0 && i <= 3)) return;
  SF.diff = i; sfSave({ diff: i });
  if (typeof refreshSettingsUI === 'function') refreshSettingsUI();
}
applyHtml();

const scoreOf = x => DF().score === 1 ? x : Math.round(x * DF().score);   // 得点の倍率(ふつうは、そのまま)
