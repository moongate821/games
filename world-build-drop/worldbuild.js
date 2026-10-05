// WORLD BUILD DROP のルールと見た目。落ちてくるのは「言葉」。となり合うと合体して上位の概念になり、
// 「章」まで育つとプロットに記録されて消える。天井まで積むと「設定の矛盾で打ち切り」。
(() => {
const DG = window.DG, { Sfx } = DG.Audio, { COLS, ROWS, CELL, BX, BY, PW } = DG.C, SERIF = DG.Art.SERIF, TAU = Math.PI * 2;

// ======================= 辞書(ティア構造: 上位は下位だけで作れる。同じ概念への道は複数) =======================
const BASES = [['人', 'Human'], ['死', 'Death'], ['時間', 'Time'], ['魔法', 'Magic'], ['機械', 'Machine'], ['帝国', 'Empire'], ['恋', 'Love'], ['土', 'Earth'],
  ['水', 'Water'], ['空間', 'Space'], ['剣', 'Sword'], ['星', 'Star'], ['毒', 'Poison'], ['夢', 'Dream'], ['海', 'Sea'], ['竜', 'Dragon']];
const RECIPES = [   // [A, B, できる概念] 順不同。ティア1 → 2 → 3(章)
  ['人', '死', '悲劇'], ['魔法', '機械', '魔導機'], ['帝国', '人', '皇帝'], ['土', '水', '箱庭'], ['剣', '人', '剣士'], ['時間', '魔法', '時の砂'],
  ['毒', '水', '毒薬'], ['海', '竜', '海竜'], ['星', '夢', '星夜'], ['夢', '魔法', '幻'], ['帝国', '土', '城'], ['海', '星', '航海'],
  ['悲劇', '時間', '死に戻り'], ['悲劇', '時の砂', '死に戻り'], ['魔導機', '人', '魔導兵'], ['皇帝', '恋', '寵愛'], ['箱庭', '空間', '六畳一間'],
  ['剣士', '帝国', '騎士団'], ['剣士', '城', '騎士団'], ['皇帝', '毒薬', '陰謀'], ['皇帝', '毒', '陰謀'], ['剣士', '竜', '竜殺し'], ['剣士', '海竜', '竜殺し'],
  ['恋', '星夜', '約束'], ['幻', '城', '幻影城'],
  ['死に戻り', '恋', '運命の再会'], ['寵愛', '陰謀', '後宮の陰謀'], ['六畳一間', '人', '創造主'], ['魔導兵', '帝国', '魔導戦争'],
  ['竜殺し', '騎士団', '竜討伐譚'], ['航海', '竜殺し', '海の英雄譚'], ['約束', '時間', '星降る誓い'], ['幻影城', '夢', '夢幻の物語'],
];
const CHAPTERS = ['運命の再会', '後宮の陰謀', '創造主', '魔導戦争', '竜討伐譚', '海の英雄譚', '星降る誓い', '夢幻の物語'];
const EN_NAMES = {
  '人': 'Human', '死': 'Death', '時間': 'Time', '魔法': 'Magic', '機械': 'Machine', '帝国': 'Empire', '恋': 'Love', '土': 'Earth', '水': 'Water', '空間': 'Space',
  '剣': 'Sword', '星': 'Star', '毒': 'Poison', '夢': 'Dream', '海': 'Sea', '竜': 'Dragon',
  '悲劇': 'Tragedy', '魔導機': 'Magitech', '皇帝': 'Emperor', '箱庭': 'Terrarium', '剣士': 'Swordsman', '時の砂': 'Time Sand', '毒薬': 'Poison Vial', '海竜': 'Sea Dragon',
  '星夜': 'Starry Night', '幻': 'Illusion', '城': 'Castle', '航海': 'Voyage',
  '死に戻り': 'Time Loop', '魔導兵': 'Mage Soldier', '寵愛': 'Royal Favor', '六畳一間': 'Tiny Room', '騎士団': 'Knight Order', '陰謀': 'Intrigue', '竜殺し': 'Dragonslayer',
  '約束': 'Promise', '幻影城': 'Phantom Castle',
  '運命の再会': 'Fateful Reunion', '後宮の陰謀': 'Harem Intrigue', '創造主': 'The Creator', '魔導戦争': 'Magitech War', '竜討伐譚': 'Dragon Epic', '海の英雄譚': 'Sea Saga',
  '星降る誓い': 'Starfall Vow', '夢幻の物語': 'Dream Tale', '矛盾': 'Contradiction',
};
const FLAVOR = {   // 章のあらすじ(1行)と、ト書きの講評
  '運命の再会': ['何度死んでも、あなたに会いに戻る。', '『人』と『死』に『時間』を掛け合わせましたね。王道ですが、読者を引き込む死に戻り展開、確認しました。', 'What dies must return, to meet you once more.', 'You multiplied Human and Death by Time. Classic, but it hooks readers. Time-loop arc confirmed.'],
  '後宮の陰謀': ['寵愛は、毒の香りがした。', '皇帝の隣に毒を配置しましたか。……展開が少々昼ドラじみてきましたね。', 'Favor, it turned out, smelled of poison.', 'You placed poison beside the Emperor... The plot is getting a little soap-opera.'],
  '創造主': ['六畳一間の箱庭に、神が目を覚ます。', '土と水から箱庭、そして創造主へ。……あなたは、この部屋の主ですね。', 'In a six-mat terrarium, a god awakens.', 'From earth and water to a terrarium, then a Creator... You are master of this room.'],
  '魔導戦争': ['魔法と機械の兵が、帝国の空を埋める。', 'SFファンタジー路線で章が成立。戦記ものとして、読者は確保できそうです。', 'Soldiers of magic and machine fill the imperial sky.', 'A sci-fi fantasy chapter holds. As a war chronicle, it should find readers.'],
  '竜討伐譚': ['剣と騎士団と竜。王道の冒険譚が、いま幕を開ける。', '騎士団と竜殺し。ここまで王道だと、逆に安心しますね。', 'Sword, knights and a dragon. A classic adventure begins.', 'Knights and a dragonslayer. So classic it is oddly reassuring.'],
  '海の英雄譚': ['星を頼りに、竜の棲む海を渡る。', '航海と竜殺しを結びましたか。海洋冒険譚、悪くありません。', 'Guided by the stars, they cross the dragon-haunted sea.', 'You joined Voyage and Dragonslayer. A sea adventure, not bad at all.'],
  '星降る誓い': ['時を越えて、星の下で交わした約束。', '約束に時間を重ねる。静かな純愛ものとして、記録します。', 'A promise made under the stars, across time.', 'A promise layered with Time. I will record it as a quiet pure romance.'],
  '夢幻の物語': ['幻の城は、誰かの夢の中にしか建たない。', '幻影城に夢を。メタ的な幻想譚、編集者としては歓迎です。', 'A phantom castle stands only inside someone\'s dream.', 'A dream in the Phantom Castle. A meta fantasy; as an editor, I welcome it.'],
};
const REC = new Map(), TIER = {}, OUTS = [];
for (const [b] of BASES) TIER[b] = 0;
for (const [a, b, c] of RECIPES) { REC.set(a + '|' + b, c); REC.set(b + '|' + a, c); TIER[c] = Math.max(TIER[c] || 0, Math.max(TIER[a], TIER[b]) + 1); if (!OUTS.includes(c)) OUTS.push(c); }
const recipeOf = (a, b) => REC.get(a + '|' + b);
const ALL_WORDS = BASES.map(b => b[0]).concat(OUTS);
DG.WB = { BASES, RECIPES, CHAPTERS, TIER, ALL_WORDS, recipeOf, EN_NAMES, FLAVOR };

// ---- 英語(辞書と文のパターン)----
(() => {
  const d = { '矛盾': 'Contradiction', '(混ぜるな危険)': '' };
  for (const k in EN_NAMES) d[k] = EN_NAMES[k];
  for (const k in FLAVOR) { d[FLAVOR[k][0]] = FLAVOR[k][2]; d[FLAVOR[k][1]] = FLAVOR[k][3]; }
  Object.assign(d, {
    '入門': 'Beginner', '編集者': 'Editor', '作家': 'Author', 'ネタ切れ': "Writer's Block", 'ト書き': 'Stage Dir.',
    '編纂を開始します。言葉を、つないでください。': 'Compilation begins. Please connect the words.',
    '単語が天井まで積み上がりました。……残念ですが、この世界は設定の矛盾により崩壊(打ち切り)です。(Enter)': 'The words have piled up to the ceiling... Sadly, this world collapses under its own contradictions (cancelled). (Enter)',
    '最初の合成を確認。ここから物語が始まります。': 'First merge confirmed. The story starts here.',
    '単語が連鎖していく……編集者として、少々興奮を禁じ得ません。': 'The words are chaining... As an editor, I admit I am a little thrilled.',
    '締切です! 章が完成していません。矛盾が降ってきました。': 'Deadline! No chapter is finished. Contradictions are falling.',
    '編集会議: 矛盾の雨です。設定が破綻しかけています。': 'Editorial meeting: a rain of contradictions. The setting is nearly broken.',
    '編集会議: ひらめきの雨です。使える言葉が降ってきました。': 'Editorial meeting: a rain of inspiration. Useful words are falling.',
    '単語が積み上がってきました。……設定の整理を、お勧めします。': 'The words are piling up... I recommend tidying up the setting.',
    '矛盾の雨': 'Rain of contradictions',
    '駒: 2語 (T)': 'Piece: Pair (T)', '🎲 駒: 3語+サイコロ (T)': '🎲 Piece: Triple + Die (T)',
    'ジャンルのサイコロです。↑ で転がして、落とす言葉を選ぼう。': 'A genre die. Roll it with ↑ to choose the word to drop.',
    '3つの言葉の駒です。↑ で順番を回して、合体のしかたを選べます。': 'A three-word piece. Rotate with ↑ to choose how they merge.',
    'SF': 'Sci-Fi', 'ループ': 'Loop', '宮廷': 'Court', '冒険': 'Adventure', 'ひらめきの雨': 'Rain of inspiration',
    '入門: ヒントあり(作れる組み合わせを表示)': 'Hints shown (possible merges)', 'ヒントなし。自分で発見しよう': 'No hints. Discover them yourself.',
    'NEXTは1つだけ': 'Only 1 NEXT shown', '10手ごとに章を1つ完成(締切)': 'A chapter every 10 turns (deadline)', '締切+予告つきイベント(8手ごと)': 'Deadline + announced events (every 8 turns)',
    '【プロット進行ログ】': '[ Plot Log ]', 'ヒント': 'Hint', '……まだ、何も書かれていない。': '...Nothing has been written yet.', '(作れる組み合わせはなし)': '(No merges available)',
    '字': '字', '詩': '詩', '章': '章', '巻': '巻', '界': '界', '創': '創', '神': '神',          // メダルに刻む一字(英語表示でも漢字のまま) 'あと1手': '1 turn left', '作れる組み合わせ': 'Possible merges',
    '図鑑': 'CODEX', '発見した概念': 'Discovered', '？': '?', 'Esc / Enter / B / タップで もどる': 'Esc / Enter / B / Tap to go back',
    // 称号・実績
    '見習い編纂者': 'Apprentice Compiler', '駆け出しの作家': 'Budding Writer', '一人前の編集者': 'Capable Editor', '物語の紡ぎ手': 'Weaver of Tales',
    '世界の編纂者': 'Compiler of Worlds', '伝説の語り部': 'Legendary Storyteller', 'アカシックの賢者': 'Akashic Sage',
    '初めての一章': 'First Chapter', '三章の書き手': 'Three-Chapter Writer', '長編作家': 'Novelist', '全章制覇': 'All Chapters Done', '博識': 'Well-read',
    '連鎖の神': 'God of Chains', '大連鎖の魔術師': 'Grand Chain Wizard', '連鎖の名手': 'Chain Master', '攻撃の名人': 'Attack Ace', '持久の人': 'Endurance', '締切の鬼': 'Deadline Slayer',
  });
  const T = DG.t;
  DG.i18n.add(d, [
    [/^\[(.+)\]と\[(.+)\]が交わり、『(.+)』が生まれた。$/, m => `[${T(m[1])}] met [${T(m[2])}] and "${T(m[3])}" was born.`],
    [/^第(\d+)章『(.+)』が完成した。$/, m => `Chapter ${m[1]}: "${T(m[2])}" is complete.`],
    [/^『(.+)』が成立。設定が深まってきましたね。$/, m => `"${T(m[1])}" holds. The setting is deepening.`],
    [/^『(.+)』を図鑑に記録。$/, m => `"${T(m[1])}" added to the codex.`],
    [/^完成した章 (\d+) \/ (\d+)\s+最大連鎖 (\d+)$/, m => `Chapters ${m[1]} / ${m[2]}   Best chain ${m[3]}`],
    [/^(.+)\+(.+)→(.+)$/, m => `${T(m[1])}+${T(m[2])}→${T(m[3])}`],
    [/^【(.+)】得点×(.+)$/, m => `[${T(m[1])}]  Score ×${m[2]}`],
    [/^締切まで あと (\d+) 手$/, m => `Deadline in ${m[1]} turn${m[1] === '1' ? '' : 's'}`],
    [/^✎ あと(\d+)手: (.+)$/, m => `✎ In ${m[1]} turn${m[1] === '1' ? '' : 's'}: ${T(m[2])}`],
    [/^発見 (\d+) \/ (\d+)$/, m => `Found ${m[1]} / ${m[2]}`],
    [/^🎲 (.+)$/, m => `🎲 ${T(m[1])}`],
    [/^(.+?)(\+3語)?(\+文字)?$/, m => (m[2] || m[3]) ? `${T(m[1])}${m[2] ? ' +Triple' : ''}${m[3] ? ' +Letters' : ''}` : null],
  ]);
})();

// ======================= 4段階のモード =======================
const LV = [
  { name: '入門', bonus: 1, hint: true, nextN: 2, deadline: 0, event: false, desc: ['入門: ヒントあり(作れる組み合わせを表示)'] },
  { name: '編集者', bonus: 1.25, hint: false, nextN: 2, deadline: 0, event: false, desc: ['ヒントなし。自分で発見しよう'] },
  { name: '作家', bonus: 1.5, hint: false, nextN: 1, deadline: 10, event: false, desc: ['NEXTは1つだけ', '10手ごとに章を1つ完成(締切)'] },
  { name: 'ネタ切れ', bonus: 2, hint: false, nextN: 1, deadline: 10, event: true, desc: ['締切+予告つきイベント(8手ごと)'] },
];
let LEVEL = 0, STYLE = 0, KANJI = 0;
const lvOf = P => LV[(P.stat && P.stat.lv) || 0];
const EVENT_EVERY = 8;
function nextEvent(P, from) { P.stat.event = { turn: from + EVENT_EVERY, kind: Math.random() < 0.5 ? 'rain' : 'gift' }; }

// ======================= 出題 =======================
function boardWords(P) { const s = new Set(); for (const r of P.grid) for (const c of r) if (c && !c.noise) s.add(c.w); return s; }
function helpful(P) {          // 盤面の言葉と合体できる基本の言葉
  const have = boardWords(P), out = [];
  for (const [b] of BASES) for (const w of have) if (recipeOf(b, w)) { out.push(b); break; }
  return out;
}
function pickBase(P, assist) {
  if (P && P.grid && Math.random() < assist) { const h = helpful(P); if (h.length) return h[Math.floor(Math.random() * h.length)]; }
  return BASES[Math.floor(Math.random() * BASES.length)][0];
}
// ジャンルのサイコロ: 6つの面に、そのジャンルの言葉が並ぶ(転がして、落とす言葉を選ぶ)
const DICE = { 'SF': ['魔法', '機械', '人', '星', '帝国', '空間'], 'ループ': ['人', '死', '時間', '恋', '星', '夢'], '宮廷': ['帝国', '人', '恋', '毒', '死', '剣'],
  '箱庭': ['土', '水', '空間', '人', '星', '夢'], '冒険': ['剣', '人', '竜', '海', '星', '魔法'] };
function makePiece(P) {
  const lv = lvOf(P), st = P.stat, danger = P.grid ? (P.dangerRow() <= 4) : false;         // 盤が高いと、合体できる言葉が出やすい(救済)
  const assist = (lv.hint ? 0.32 : 0.24) + (danger ? 0.25 : 0);
  if (st.kanji) return makeKanjiPiece(P, assist);
  if (st.style) {                                                    // 駒のかたち「3語+サイコロ」
    st.gen = (st.gen || 0) + 1;
    if (st.gen % 7 === 0) {                                          // 7つに1つは、ジャンルのサイコロ(1マス)
      const names = Object.keys(DICE), genre = names[Math.floor(Math.random() * names.length)], faces = DICE[genre].map(w => ({ w, tier: 0 })), face = Math.floor(Math.random() * 6);
      return { kind: 'die', faces, face, genre, b: [faces[face]], ent: null };
    }
    const pick = () => pickBase(P, assist); let a = pick(), b = pick(), c = pick();
    for (let k = 0; k < 4 && (a === b || b === c); k++) { b = pick(); c = pick(); }      // 同じ言葉が並びすぎないように
    return { kind: 'col', b: [a, b, c].map(w => ({ w, tier: 0 })), ent: null };
  }
  return { b: [{ w: pickBase(P, assist), tier: 0 }, { w: pickBase(P, assist), tier: 0 }], ent: null };
}
const noiseCell = () => ({ w: '矛盾', tier: -1, noise: true });

// ======================= 文字モード: 1文字ずつのタイルで言葉を作る =======================
// 縦(上→下)・横(左→右)に並んだ字が、辞書の言葉(2〜4字)になると消えて得点。字数が多いほど高得点で、四字熟語は「章」になる。
// 連鎖のあとの「入れ替え」(となり合う2字を1回だけ入れ替えられる)で、言葉をつくる。
function charGrid(P) { return P.grid.map(r => r.map(c => (c && !c.noise) ? c.w : null)); }
function findWordsInGrid(cg) {
  const out = [], SET = DG.KJ.SET;
  const scan = (line, coords) => {
    let i = 0;
    while (i < line.length) {
      if (line[i] == null) { i++; continue; }
      let j = i; while (j < line.length && line[j] != null) j++;                       // つながった字の並び [i, j)
      let k = i;
      while (k < j) {                                                                  // 長い言葉を優先して、重ならないように拾う
        let hit = 0;
        for (let L = Math.min(4, j - k); L >= 2; L--) { const w = line.slice(k, k + L).join(''); if (SET.has(w)) { out.push({ word: w, len: L, cells: coords.slice(k, k + L) }); hit = L; break; } }
        k += hit || 1;
      }
      i = j;
    }
  };
  for (let y = 0; y < ROWS; y++) scan(cg[y], cg[y].map((_, x) => [x, y]));
  for (let x = 0; x < COLS; x++) { const col = [], co = []; for (let y = 0; y < ROWS; y++) { col.push(cg[y][x]); co.push([x, y]); } scan(col, co); }
  return out;
}
function shuffle(a) { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }
function refillBag(st) {          // 実在する言葉の字を袋に入れてシャッフル(=作れることが保証される)
  const KJ = DG.KJ, bag = [];
  for (let i = 0; i < 4; i++) { const r = Math.random(), pool = r < .18 ? KJ.W4 : r < .4 ? KJ.W3 : KJ.W2; bag.push(...pool[Math.floor(Math.random() * pool.length)]); }
  st.bag = shuffle(bag);
}
function helpfulChars(P) {         // 盤面の字といっしょに、言葉が完成する「あと1字」
  const have = new Set(); for (const r of P.grid) for (const c of r) if (c && !c.noise) have.add(c.w);
  const out = new Set();
  for (const w of DG.KJ.ALL) { const miss = [...w].filter(ch => !have.has(ch)); if (miss.length === 1 && w.length - 1 >= 1) out.add(miss[0]); }
  return [...out];
}
function nextChar(P, assist) {
  if (Math.random() < assist) { const h = helpfulChars(P); if (h.length) return h[Math.floor(Math.random() * h.length)]; }
  if (!P.stat.bag.length) refillBag(P.stat);
  return P.stat.bag.shift();
}
function makeKanjiPiece(P, assist) {
  const n = P.stat.style ? 3 : 2, b = []; for (let i = 0; i < n; i++) b.push({ w: nextChar(P, assist), tier: 0, ch: true });
  return n === 3 ? { kind: 'col', b, ent: null } : { b, ent: null };
}
function stepKanji(P) {
  const words = findWordsInGrid(charGrid(P)); if (!words.length) return null;
  const g = P.grid, KJ = DG.KJ;
  return {
    pre: .32, post: .3,
    mark() { for (const w of words) for (const [x, y] of w.cells) if (g[y][x]) g[y][x].clr = 1; },
    apply() {
      const mult = DG.chainMult(P.chain) * lvOf(P).bonus, clear = new Set();
      for (const w of words) {
        P.score += Math.round([0, 0, 100, 300, 1000][w.len] * mult); P.stat.merges = (P.stat.merges || 0) + 1; P.stat.words = (P.stat.words || 0) + 1; P.stat.lastChapter = P.stat.turn || 0;
        for (const [x, y] of w.cells) clear.add(y * COLS + x);
        if (w.len === 4) {                                    // 四字熟語 = 章
          const n = P.stat.chapters.length + 1, idx = KJ.IDX.get(w.word); P.stat.chapters.push(w.word);
          logPush(P, `第${n}章『${w.word}』が完成した。`, 'chapter'); if (idx != null) { logPush(P, KJ.IDIOMS[idx][1], 'flavor'); P.say(`『${w.word}』……${KJ.IDIOMS[idx][1]}`, 6, 5); }
          if (DG.Rank.discover('K:' + w.word)) logPush(P, `『${w.word}』を図鑑に記録。`, 'codex');
          P.flash = 1; P.shake = Math.max(P.shake, 6); Sfx.chapter(); Sfx.typewriter(10); P.burst(w.cells[1][0], w.cells[1][1], '#ffd34d', 16);
        } else { logPush(P, `『${w.word}』が成立した。`, 'merge'); Sfx.merge(w.len - 1); Sfx.typewriter(3); }
      }
      const doomed = [...clear].map(k => [k % COLS, Math.floor(k / COLS)]);
      for (const [x, y] of doomed) for (const [dx, dy] of [[0, 1], [1, 0], [0, -1], [-1, 0]]) { const n = g[y + dy] && g[y + dy][x + dx]; if (n && n.noise) { g[y + dy][x + dx] = null; P.burst(x + dx, y + dy, '#9a9aa8', 6); } }
      for (const [x, y] of doomed) { P.burst(x, y, '#9fb8ff', 7); g[y][x] = null; }
      if (P.chain >= 2) P.say('単語が連鎖していく……編集者として、少々興奮を禁じ得ません。', 4, 4);
    },
  };
}
function aiEvalKanji(g) {
  const cg = g.map(r => r.map(k => (k && k !== '#') ? k : null)), at = (x, y) => (x >= 0 && x < COLS && y >= 0 && y < ROWS) ? cg[y][x] : null;
  let s = 0; for (const w of findWordsInGrid(cg)) s += [0, 0, 40, 140, 500][w.len];
  const BG = DG.KJ.BIGRAM, heights = Array(COLS).fill(0);
  for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++) {
    const k = g[y][x]; if (!k) continue; if (!heights[x]) heights[x] = ROWS - y; if (k === '#') { s -= 4; continue; }
    const r = at(x + 1, y), d = at(x, y + 1); if (r && BG.has(k + r)) s += 3; if (d && BG.has(k + d)) s += 3;       // 言葉の途中に現れる並びなら、近づいている
  }
  for (let x = 0; x < COLS; x++) { const h = heights[x]; s -= h * h * 0.55; if (x === 2 && h >= 9) s -= 60; if (x === 2 && h >= 7) s -= 12; }
  for (let x = 0; x < COLS; x++) for (let y = 1; y < ROWS; y++) if (!g[y][x] && g[y - 1][x]) s -= 4;
  return s;
}
function aiSwap(P) {              // CPU: 全ての入れ替えを試して、いちばん良いもの(よくなければ、なし)
  const cg = P.grid.map(r => r.map(c => c ? (c.noise ? '#' : c.w) : null)), base = aiEvalKanji(cg); let best = null, bs = base + 12;
  for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++) for (const dir of [0, 1]) {
    const x2 = x + (dir === 0 ? 1 : 0), y2 = y + (dir === 1 ? 1 : 0), a = cg[y][x], b = cg[y2] && cg[y2][x2];
    if (!a || !b || a === '#' || b === '#' || a === b) continue;
    cg[y][x] = b; cg[y2][x2] = a; const v = aiEvalKanji(cg); cg[y][x] = a; cg[y2][x2] = b;
    if (v > bs) { bs = v; best = { x, y, dir }; }
  }
  return best;
}

// ======================= 合体の進行 =======================
const PTS = [0, 30, 100, 600];
function logPush(P, s, kind) { (P.stat.log = P.stat.log || []).push({ s, kind: kind || 'n', born: P.time }); if (P.stat.log.length > 40) P.stat.log.shift(); }
function step(P) {
  if (P.stat.kanji) return stepKanji(P);
  const g = P.grid, cands = [];
  for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++) {
    const c = g[y][x]; if (!c || c.noise) continue;
    for (const [dx, dy] of [[1, 0], [0, 1]]) {
      const nx = x + dx, ny = y + dy; if (nx >= COLS || ny >= ROWS) continue;
      const d = g[ny][nx]; if (!d || d.noise) continue;
      const out = recipeOf(c.w, d.w); if (out) cands.push({ x, y, nx, ny, out, tier: TIER[out] });
    }
  }
  if (!cands.length) return null;
  cands.sort((a, b) => b.tier - a.tier || b.y - a.y);
  const used = new Set(), picks = [];
  for (const cd of cands) { const k1 = cd.y * COLS + cd.x, k2 = cd.ny * COLS + cd.nx; if (used.has(k1) || used.has(k2)) continue; used.add(k1); used.add(k2); picks.push(cd); }
  return {
    pre: .32, post: .3,
    mark() { for (const p of picks) { g[p.y][p.x].clr = 1; g[p.ny][p.nx].clr = 1; } },
    apply() {
      const mult = DG.chainMult(P.chain) * lvOf(P).bonus;
      for (const p of picks) {
        const a = g[p.y][p.x], b = g[p.ny][p.nx]; if (!a || !b) continue;
        const [rx, ry, ox, oy] = (p.ny > p.y) ? [p.nx, p.ny, p.x, p.y] : [p.x, p.y, p.nx, p.ny];       // 下(同じ高さなら左)のマスに残る
        const nameA = a.w, nameB = b.w;
        logPush(P, `[${nameA}]と[${nameB}]が交わり、『${p.out}』が生まれた。`, 'merge');
        P.score += Math.round(PTS[Math.min(p.tier, 3)] * mult);
        const isNew = DG.Rank.discover(p.out); if (isNew) logPush(P, `『${p.out}』を図鑑に記録。`, 'codex');
        P.stat.merges = (P.stat.merges || 0) + 1;
        if (CHAPTERS.includes(p.out)) {            // 章の完成: プロットに記録して、盤面から消える
          g[ry][rx] = null; g[oy][ox] = null;
          for (const [cx, cy] of [[rx, ry], [ox, oy]]) for (const [dx, dy] of [[0, 1], [1, 0], [0, -1], [-1, 0]]) { const n = g[cy + dy] && g[cy + dy][cx + dx]; if (n && n.noise) { g[cy + dy][cx + dx] = null; P.burst(cx + dx, cy + dy, '#9a9aa8', 6); } }
          const n = P.stat.chapters.length + 1; P.stat.chapters.push(p.out); P.stat.lastChapter = P.stat.turn || 0;
          logPush(P, `第${n}章『${p.out}』が完成した。`, 'chapter'); logPush(P, FLAVOR[p.out][0], 'flavor');
          P.flash = 1; P.shake = Math.max(P.shake, 6); Sfx.chapter(); Sfx.typewriter(10);
          P.say(FLAVOR[p.out][1], 6, 5);
          P.burst(rx, ry, '#ffd34d', 18); P.burst(ox, oy, '#ffe9a0', 10);
        } else {
          g[ry][rx] = P.mk({ w: p.out, tier: p.tier }); g[ry][rx].pop = 1; g[oy][ox] = null;
          P.burst(rx, ry, ['#9fb8ff', '#9fffee', '#e0b8ff'][Math.min(p.tier - 1, 2)], 9);
          Sfx.merge(p.tier); if (P.stat.merges % 2 === 1) Sfx.typewriter(4);
          if (P.stat.merges === 1) P.say('最初の合成を確認。ここから物語が始まります。', 4, 2);
          else if (p.tier >= 2) P.say(`『${p.out}』が成立。設定が深まってきましたね。`, 3, 3);
        }
      }
      if (P.chain >= 2) P.say('単語が連鎖していく……編集者として、少々興奮を禁じ得ません。', 4, 4);
    },
  };
}

// 1手ごと: 締切(章が完成していないと矛盾が降る)・予告つきイベント
function onTurn(P) {
  const lv = lvOf(P), st = P.stat; st.turn = (st.turn || 0) + 1; let changed = false;
  if (lv.deadline && st.turn - (st.lastChapter || 0) >= lv.deadline) {
    st.lastChapter = st.turn; P.rainCells(3, noiseCell, false); logPush(P, '締切です! 章が完成していません。矛盾が降ってきました。', 'warn'); P.say('締切です! 章が完成していません。矛盾が降ってきました。', 4, 5); changed = true;
  }
  if (lv.event && st.event && st.turn >= st.event.turn) {
    const kind = st.event.kind; nextEvent(P, st.turn);
    if (kind === 'rain') { P.rainCells(3, noiseCell, false); P.say('編集会議: 矛盾の雨です。設定が破綻しかけています。', 4, 5); }
    else { const h = helpful(P); P.rainCells(2, () => ({ w: (h.length ? h : BASES.map(b => b[0]))[Math.floor(Math.random() * (h.length || BASES.length))], tier: 0 }), false); P.say('編集会議: ひらめきの雨です。使える言葉が降ってきました。', 4, 5); }
    changed = true;
  }
  return changed;
}

// ======================= CPU 用の評価 =======================
function aiEval(g) {
  if (DG.worldbuild.kanjiOn) return aiEvalKanji(g);
  const at = (x, y) => (x >= 0 && x < COLS && y >= 0 && y < ROWS) ? g[y][x] : null;
  let s = 0; const heights = Array(COLS).fill(0);
  for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++) {
    const k = g[y][x]; if (!k) continue; if (!heights[x]) heights[x] = ROWS - y;
    if (k === '#') { s -= 4; continue; }
    for (const [dx, dy] of [[1, 0], [0, 1]]) { const n = at(x + dx, y + dy); if (n && n !== '#') { const o = recipeOf(k, n); if (o) s += [0, 22, 70, 240][Math.min(TIER[o], 3)]; } }
    if (TIER[k] >= 1) s += 4 * TIER[k];                           // 上位の概念を持っているほど良い
  }
  for (let x = 0; x < COLS; x++) { const h = heights[x]; s -= h * h * 0.55; if (x === 2 && h >= 9) s -= 60; if (x === 2 && h >= 7) s -= 12; }
  for (let x = 0; x < COLS; x++) for (let y = 1; y < ROWS; y++) if (!g[y][x] && g[y - 1][x]) s -= 4;
  return s;
}

// ======================= 見た目: ガラスのタイルに言葉を刻む =======================
const PAL = [
  { a: '#4a6ec0', b: '#1d2f6e', edge: '#a8c0ff', glow: '#6a8cff', ink: '#ffffff' },     // 基本の言葉
  { a: '#35aab0', b: '#17555e', edge: '#aaffee', glow: '#4ae0d0', ink: '#ffffff' },     // ティア1
  { a: '#9a5fd4', b: '#4a2478', edge: '#e6c4ff', glow: '#b06aff', ink: '#ffffff' },     // ティア2
  { a: '#f0c850', b: '#8a5a10', edge: '#fff2b8', glow: '#ffd34d', ink: '#3a2400' },     // 章
  { a: '#55555e', b: '#25252b', edge: '#ff7a7a', glow: '#ff4a4a', ink: '#ffd0d0' },     // 矛盾
];
function writeWord(g, label, s, ink) {
  g.fillStyle = ink; g.textAlign = 'center'; g.textBaseline = 'middle'; g.shadowColor = 'rgba(0,0,0,.45)'; g.shadowBlur = s * .05;
  const jp = /[ぁ-んァ-ヶ一-龥]/.test(label);
  if (!jp) {                               // 英語: 横書き。スペースで2行に分け、枠に収まるまで縮める
    const parts = label.includes(' ') ? [label.split(' ')[0], label.split(' ').slice(1).join(' ')] : [label];
    let fs = s * (parts.length > 1 ? .26 : .3);
    g.font = `bold ${fs}px ${SERIF}`; while (fs > 6 && Math.max(...parts.map(p => g.measureText(p).width)) > s * .84) { fs -= .5; g.font = `bold ${fs}px ${SERIF}`; }
    parts.forEach((p, i) => g.fillText(p, s / 2, s / 2 + (i - (parts.length - 1) / 2) * fs * 1.15));
    return;
  }
  const ch = [...label], n = ch.length;                    // 日本語: 縦書き(右の列から、上から下へ)
  const cols = n <= 3 ? 1 : n <= 6 ? 2 : 3, rows = Math.ceil(n / cols), aw = s * .8 / cols, ah = s * .8 / rows;
  const fs = Math.min(aw, ah) * (n === 1 ? .78 : .92); g.font = `bold ${fs}px ${SERIF}`;
  for (let i = 0; i < n; i++) {
    const c = Math.floor(i / rows), r = i % rows;
    g.fillText(ch[i], s / 2 + (cols / 2 - .5 - c) * aw, s / 2 + (r - (Math.min(rows, n - c * rows) - 1) / 2) * (ah * (rows === 1 ? 1 : 1)));
  }
}
const SPR = new Map();
function sprite(word, tier, noise, s, ch) {
  const S = Math.round(s), label = ch ? word : DG.t(word), pal = PAL[noise ? 4 : Math.max(0, Math.min(tier, 3))], key = label + '|' + (noise ? 'n' : tier) + '|' + S;
  let cv = SPR.get(key); if (cv) return cv;
  const dpr = 2, pad = Math.ceil(S * .22);
  cv = document.createElement('canvas'); cv.width = (S + pad * 2) * dpr; cv.height = (S + pad * 2) * dpr; const g = cv.getContext('2d'); g.scale(dpr, dpr); g.translate(pad, pad);
  const m = S * .05, w = S - m * 2, r = S * .16;
  g.shadowColor = pal.glow; g.shadowBlur = S * .22;
  const gr = g.createLinearGradient(0, m, 0, S - m); gr.addColorStop(0, pal.a); gr.addColorStop(1, pal.b);
  g.fillStyle = gr; g.beginPath(); g.roundRect(m, m, w, w, r); g.fill(); g.shadowBlur = 0;
  g.strokeStyle = pal.edge; g.lineWidth = S * .035; g.stroke();
  g.fillStyle = 'rgba(255,255,255,.18)'; g.beginPath(); g.roundRect(m + 3, m + 3, w - 6, w * .42, r * .8); g.fill();          // ガラスの反射
  if (tier === 3 && !noise) { g.strokeStyle = 'rgba(255,255,255,.7)'; g.lineWidth = S * .02; g.beginPath(); g.roundRect(m + 4, m + 4, w - 8, w - 8, r * .7); g.stroke(); }
  if (noise) { g.strokeStyle = 'rgba(255,120,120,.7)'; g.lineWidth = S * .03; g.beginPath(); g.moveTo(S * .2, S * .1); g.lineTo(S * .42, S * .45); g.lineTo(S * .3, S * .62); g.lineTo(S * .5, S * .95); g.stroke(); }
  writeWord(g, label, S, pal.ink);
  SPR.set(key, cv); return cv;
}
function drawCell(ctx, c, x, y, s, scale, t) {
  const cv = sprite(c.w, c.tier, c.noise, s, c.ch), sc = scale || 1, sz = cv.width / 2;
  ctx.drawImage(cv, x + s / 2 - sz / 2 * sc, y + s / 2 - sz / 2 * sc, sz * sc, sz * sc);
  if (c.die) { ctx.save(); ctx.fillStyle = '#fff'; ctx.strokeStyle = 'rgba(0,0,0,.45)'; ctx.lineWidth = 1; for (const [dx, dy] of [[.78, .2], [.66, .32], [.54, .44]]) { ctx.beginPath(); ctx.arc(x + s * dx, y + s * dy, s * .06, 0, TAU); ctx.fill(); ctx.stroke(); } ctx.restore(); }     // サイコロの印(3つの点)
  if (c.clr && Math.sin((t || 0) * 40) > 0) { ctx.save(); ctx.fillStyle = 'rgba(255,255,255,.55)'; ctx.beginPath(); ctx.roundRect(x + s * .05, y + s * .05, s * .9, s * .9, s * .16); ctx.fill(); ctx.restore(); }
}

// ---- 右パネル: 原稿用紙 ----
function wrapLines(ctx, s, maxW, fs) {
  ctx.font = `${fs}px ${SERIF}`; const out = []; let line = '';
  const tokens = /[ぁ-んァ-ヶ一-龥]/.test(s) ? [...s] : (s.match(/[^ ]* |[^ ]+/g) || [s]);   // 空白のうしろで区切る(後読み (?<= ) は iOS 16.3 以前の Safari で読み込みごと失敗するので使わない)
  for (const tk of tokens) { if (ctx.measureText(line + tk).width > maxW && line) { out.push(line); line = tk.trimStart(); } else line += tk; }
  if (line) out.push(line); return out;
}
const INK = '#3a2a1a', SUB = '#7a6040', RED = '#a02828';
function dieIcon(ctx, x, y, s) {
  ctx.save(); ctx.fillStyle = '#f4ead0'; ctx.strokeStyle = '#c8962a'; ctx.lineWidth = s * .06; ctx.beginPath(); ctx.roundRect(x + s * .06, y + s * .06, s * .88, s * .88, s * .16); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#3a2a1a'; for (const [dx, dy] of [[.28, .28], [.72, .28], [.5, .5], [.28, .72], [.72, .72]]) { ctx.beginPath(); ctx.arc(x + s * dx, y + s * dy, s * .075, 0, TAU); ctx.fill(); } ctx.restore();
}
function nextTiles(ctx, n, x, t) {       // NEXT: 2語=縦に2つ / 3語=縦に3つ / サイコロ=サイコロの絵
  const k = n.kind || 'pair';
  if (k === 'die') { dieIcon(ctx, x, 200, 40); return; }
  if (k === 'col') { n.b.forEach((b, i) => drawCell(ctx, b, x + 6, 178 + i * 29, 28, 1, t)); return; }
  drawCell(ctx, n.b[1], x, 178, 40, 1, t); drawCell(ctx, n.b[0], x, 220, 40, 1, t);
}
function dieFaces(ctx, p, x, y, t) {     // 落下中のサイコロの6つの面(いまの面に金の枠)
  p.faces.forEach((f, i) => { const cx = x + (i % 3) * 25, cy = y + Math.floor(i / 3) * 25; drawCell(ctx, f, cx, cy, 23, 1, t); if (i === p.var) { ctx.save(); ctx.strokeStyle = '#ffd34d'; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.roundRect(cx - 1, cy - 1, 25, 25, 5); ctx.stroke(); ctx.restore(); } });
  DG.text(ctx, '🎲 ' + p.genre, x, y + 62, 10, SUB, 'left', { font: SERIF, maxW: 80 });
}
function drawPanel(ctx, P, px, t) {
  const RIGHT = PW - 22, T = (cx, s, x, y, size, col, al, o) => DG.text(cx, s, x, y, size, col, al, Object.assign({ maxW: al === 'center' ? RIGHT - px : RIGHT - x, font: SERIF }, o || {}));
  const lv = lvOf(P), st = P.stat;
  ctx.save(); ctx.strokeStyle = 'rgba(170,60,50,.13)'; ctx.lineWidth = 1;                // 原稿用紙の罫線
  for (let y = 74; y < 590; y += 15) { ctx.beginPath(); ctx.moveTo(px - 4, y); ctx.lineTo(RIGHT + 4, y); ctx.stroke(); } ctx.restore();
  T(ctx, 'SCORE', px, 84, 12, SUB); T(ctx, String(P.score), px, 110, 26, INK, 'left', { weight: 'bold' });
  T(ctx, 'BEST', px, 130, 11, SUB); T(ctx, String(Math.max(P.best, P.score)), px + 38, 130, 14, INK);
  T(ctx, st.kanji ? `四字熟語 ${st.chapters.length}   最大連鎖 ${P.maxChain}` : `完成した章 ${st.chapters.length} / ${CHAPTERS.length}   最大連鎖 ${P.maxChain}`, px, 150, 12, INK);
  T(ctx, 'NEXT', px, 172, 12, SUB);
  P.next.slice(0, lv.nextN).forEach((n, i) => nextTiles(ctx, n, px + 2 + i * 50, t));
  if (P.piece && P.piece.kind === 'die') dieFaces(ctx, P.piece, px + 108, 176, t);
  T(ctx, `【${lv.name}】得点×${lv.bonus}`, px + 112, 244, 12, RED, 'left');
  if (lv.deadline) { const left = Math.max(0, lv.deadline - ((st.turn || 0) - (st.lastChapter || 0))); T(ctx, `締切まで あと ${left} 手`, px + 112, 258, 11, left <= 2 ? RED : SUB); }
  if (lv.event && st.event) { const left = st.event.turn - (st.turn || 0); T(ctx, `✎ あと${left}手: ${st.event.kind === 'rain' ? '矛盾の雨' : 'ひらめきの雨'}`, px + 112, 271, 10, st.event.kind === 'rain' ? RED : '#2a7a4a'); }
  // プロット進行ログ(タイプライターで書かれる)
  T(ctx, '【プロット進行ログ】', px, 280, 13, RED, 'left', { weight: 'bold' });
  const lines = []; const log = st.log || [];
  for (let i = log.length - 1; i >= 0 && lines.length < 10; i--) {
    const e = log[i], txt = DG.t(e.s); let shown = txt;
    if (i === log.length - 1) shown = txt.slice(0, Math.max(0, Math.floor((P.time - e.born) * 30)));
    const ls = wrapLines(ctx, txt, RIGHT - px, 12); let left = shown.length; const part = ls.map(l => { const k = Math.min(l.length, left); left -= k; return l.slice(0, k); });
    for (let j = ls.length - 1; j >= 0; j--) lines.unshift({ s: part[j], kind: e.kind, first: j === 0 });
  }
  const show = lines.slice(-11);
  show.forEach((l, i) => { ctx.font = `${l.kind === 'chapter' ? 'bold ' : ''}12px ${SERIF}`; ctx.textAlign = 'left'; ctx.fillStyle = l.kind === 'chapter' ? RED : l.kind === 'warn' ? '#b03030' : l.kind === 'codex' ? '#2a6a8a' : l.kind === 'flavor' ? '#5a4a30' : INK; ctx.fillText(l.s, px, 300 + i * 15); });
  if (!show.length) T(ctx, '……まだ、何も書かれていない。', px, 300, 12, SUB);
  // ヒント(入門のみ): 盤面にある言葉どうしで作れる組み合わせ
  if (lv.hint) {
    T(ctx, 'ヒント', px, 486, 11, SUB);
    if (st.kanji) {          // 文字モードのヒント: 盤面と駒にある字だけで作れる言葉
      const have = new Set(); for (const r of P.grid) for (const c of r) if (c && !c.noise) have.add(c.w);
      for (const n of P.next.slice(0, 1)) for (const b of n.b) have.add(b.w); if (P.piece) for (const b of P.piece.b) have.add(b.w);
      const cand = DG.KJ.ALL.filter(w => [...w].every(ch => have.has(ch))).sort((a, b) => b.length - a.length).slice(0, 4);
      T(ctx, cand.length ? `字: ${cand.join(' ')}` : '(作れる組み合わせはなし)', px, 502, 12, INK);
    } else {
    const have = boardWords(P); for (const n of P.next.slice(0, 1)) for (const b of n.b) have.add(b.w); if (P.piece) for (const b of P.piece.b) have.add(b.w);
    const hints = []; for (const [a, b, c] of RECIPES) if (have.has(a) && have.has(b)) hints.push([a, b, c]);
    hints.sort((p, q) => TIER[q[2]] - TIER[p[2]]); hints.slice(0, 2).forEach((h, i) => T(ctx, `${h[0]}+${h[1]}→${h[2]}`, px, 502 + i * 15, 12, INK));
    if (!hints.length) T(ctx, '(作れる組み合わせはなし)', px, 502, 11, SUB);
    }
  }
  P.hints.forEach((h, i) => T(ctx, h, px, 536 + i * 13, 10, SUB)); T(ctx, 'P 停止  M ミュート', px, 578, 10, SUB);
}

const R = DG.worldbuild = {
  id: 'worldbuild', title: 'WORLD BUILD DROP', nav: 'ト書き', bgm: 'worldbuild', garbageDiv: 140, bonusScale: 0.8, ghost: 'cell', actLabel: '即落下',
  hello: '編纂を開始します。言葉を、つないでください。', overMsg: '単語が天井まで積み上がりました。……残念ですが、この世界は設定の矛盾により崩壊(打ち切り)です。(Enter)',
  theme: { title: '#f3e6c4', titleStroke: '#0a1030', glass: 'rgba(10,16,56,.58)', line: 'rgba(190,210,255,.85)', grid: 'rgba(190,210,255,.10)', danger: 'rgba(255,80,110,.12)', card: 'rgba(240,229,200,.95)', msgBg: 'rgba(10,14,40,.85)', msgText: '#ecdfc0', flash: 'rgba(255,230,160,A)' },
  levels: LV, levelName: () => LV[LEVEL].name + (STYLE ? '+3語' : '') + (KANJI ? '+文字' : ''), levelBtn: i => LV[i].name, setOptions(o) { LEVEL = o.level || 0; STYLE = o.style || 0; KANJI = o.kanji || 0; },
  canSwap: P => !!P.stat.kanji, swapTime: P => [7, 5, 4, 3][lvOf(P) === LV[0] ? 0 : lvOf(P) === LV[1] ? 1 : lvOf(P) === LV[2] ? 2 : 3], aiSwap,
  init(P) { P.stat = { chapters: [], log: [], turn: 0, lastChapter: 0, lv: LEVEL, style: STYLE, kanji: KANJI, bag: [], gen: 0, merges: 0 }; if (LV[LEVEL].event) nextEvent(P, 0); },
  get kanjiOn() { return !!KANJI; },
  makePiece, drawCell, step, onTurn, drawPanel, aiKey: c => c.noise ? '#' : c.w, aiEval,
  act(P) { P.hardDrop(); }, garbageCell: noiseCell,
  finalize(P, p) { for (const b of p.b) delete b.die; },                 // サイコロの印は、置いたら外す
  onSpawn(P) {
    const p = P.piece;
    if (P.stat.kanji && !P.stat.seenSwap) { P.stat.seenSwap = true; P.say('落ちている間も、字を入れ替えられます。1個につき1回!', 5, 4); }
    if (p.kind === 'die') P.say('ジャンルのサイコロです。↑ で転がして、落とす言葉を選ぼう。', 4, 4);
    else if (p.kind === 'col' && !P.stat.seenCol) { P.stat.seenCol = true; P.say('3つの言葉の駒です。↑ で順番を回して、合体のしかたを選べます。', 5, 4); }
  },
  update(P) {   // 積み上がってきたら、ト書きが声をかける(12秒に1回まで)
    if (P.dangerRow() <= 3 && P.time - (P.stat.warnT || -99) > 12) { P.stat.warnT = P.time; P.say('単語が積み上がってきました。……設定の整理を、お勧めします。', 4, 3); }
  },
  drawBG: (ctx, t, w, h) => DG.Art.bgWorld(ctx, t, w, h),
  sampleCell: (w, tier) => ({ w, tier, oy: 0, vy: 0, pop: 0, clr: 0 }),
};
DG.WBTest = { step, helpful, aiEval };
})();
