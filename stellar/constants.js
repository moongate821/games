// ---------- STELLAR HEGEMONY ― 銀河覇権: 定数定義 ----------
// 資料\資料.txt 3章「実装済みデータ構造」を正とする。数値やIDはここを書き換えて調整する。

const FACTION = {
  empire: { id: 'empire', name: '星冠帝国軍', short: '帝国軍', color: '#d4af37', colorRgb: [212, 175, 55], capital: 'レーヴェンブルク' },
  republic: { id: 'republic', name: '地球星域防衛軍', short: '地球軍', color: '#3b82f6', colorRgb: [59, 130, 246], capital: '地球圏' },
};

// 3.1 艦種(SHIP)
// 2026-09-27追記: 各種宇宙戦略・戦術SLG(銀河英雄伝説/大戦略/Sins of a Solar Empire/Sword of the Stars等)を
// 調査のうえ、武器体系を beam/missile の2種から railgun(電磁投射砲)・torpedo(雷撃)を加えた4種に拡張。
// 護衛艦(FR)・雷撃艇(TB)の2艦種を追加した(資料.txtの5艦種はそのまま維持し、追加分としてここに記載)。
const SHIPS = {
  DN: { id: 'DN', name: '超弩級艦', hp: 5000, shield: 2000, beam: 800, missile: 200, railgun: 500, torpedo: 0,   spd: 2, fighter: 0, intercept: 0,   cost: 1000, capital: true, buildLv: 4, activeCap: 6 },
  BB: { id: 'BB', name: '戦艦',     hp: 2000, shield: 800,  beam: 400, missile: 100, railgun: 300, torpedo: 0,   spd: 3, fighter: 0, intercept: 0,   cost: 400,  capital: true, buildLv: 2 },
  CA: { id: 'CA', name: '巡航艦',   hp: 1000, shield: 400,  beam: 200, missile: 200, railgun: 0,   torpedo: 0,   spd: 5, fighter: 0, intercept: 40,  cost: 200,  capital: false, buildLv: 1 },
  DD: { id: 'DD', name: '駆逐艦',   hp: 500,  shield: 100,  beam: 50,  missile: 400, railgun: 0,   torpedo: 0,   spd: 6, fighter: 0, intercept: 20,  cost: 100,  capital: false },
  CV: { id: 'CV', name: '空母',     hp: 1500, shield: 500,  beam: 50,  missile: 50,  railgun: 0,   torpedo: 0,   spd: 3, fighter: 600, intercept: 300, cost: 500, capital: true, buildLv: 3 },
  FR: { id: 'FR', name: '護衛艦',   hp: 350,  shield: 120,  beam: 60,  missile: 60,  railgun: 0,   torpedo: 0,   spd: 7, fighter: 0, intercept: 130, cost: 90,   capital: false },
  TB: { id: 'TB', name: '雷撃艇',   hp: 400,  shield: 80,   beam: 30,  missile: 0,   railgun: 0,   torpedo: 320, spd: 6, fighter: 0, intercept: 10,  cost: 140,  capital: false, buildLv: 1 },
  // 2026-09-28追加: 惑星型戦闘艦(要塞艦)。デス・スターやイゼルローン要塞のような、球体の艦体に巨砲を備えた移動要塞。極めて高価で鈍重。
  // 2026-09-29(4回目)追加: ユーザー要望「決戦兵器として、最後の方に出したい」により、兵装研究が最大Lvに
  // 達するまで建造できない(unlockTech)よう条件付けた。開始直後の艦隊にいきなり紛れ込むことも無くなる
  // (starmap.jsのcomposeFleetForAdmiral/tickProductionがshipUnlockedForで参照する)。
  PL: { id: 'PL', name: '惑星型戦闘艦', hp: 9000, shield: 4000, beam: 1100, missile: 300, railgun: 900, torpedo: 0, spd: 1, fighter: 0, intercept: 200, cost: 2400, capital: true, buildLv: 5, activeCap: 1, unlockTech: { cat: 'weapon', lv: 5 } },
  // 2026-09-29追加: 工作艦(ES)。非武装に近い支援艦。友軍星系停泊中の艦隊修復と、機雷の敷設・掃海(command.js)を担う。
  ES: { id: 'ES', name: '工作艦', hp: 350, shield: 80, beam: 0, missile: 0, railgun: 0, torpedo: 0, spd: 5, fighter: 0, intercept: 20, cost: 90, capital: false },
  // 2026-09-29追加: ステルス艦(ST)。Sins of a Solar EmpireのVasari偵察艦・Stellarisのクローキング艦を参考に、
  // AIからは(掃射を受けるか、ゼッフル粒子域でない限り)後回しにされ、隠密状態での初弾は威力+40%となる奇襲艦。
  ST: { id: 'ST', name: 'ステルス艦', hp: 320, shield: 100, beam: 150, missile: 0, railgun: 0, torpedo: 0, spd: 8, fighter: 0, intercept: 30, cost: 170, capital: false, stealth: true, buildLv: 2 },
  // 2026-09-29(5回目)追加: ユーザー要望「他にも特殊戦艦を建造して欲しい、ネットで有用な情報を取得」を受け、
  // Master of Orion/Homeworld2の「シールドを落とした艦を拿捕する」ボーディング艦(=強襲揚陸艦MA。
  // hexbattle.jsのperformBoarding参照)と、Sins of a Solar Empire/Sword of the Starsの「旗艦が艦隊全体へ
  // 指揮ボーナスを及ぼす」コマンドシップ(=指揮巡洋艦CC。utils.jsのtraitWeaponMul/traitDefenseMulの
  // amp引数参照)を調査のうえ翻案した。
  CC: { id: 'CC', name: '指揮巡洋艦', hp: 1400, shield: 600, beam: 250, missile: 150, railgun: 200, torpedo: 0, spd: 4, fighter: 0, intercept: 60, cost: 450, capital: true, command: true, buildLv: 3 },
  // troops: 2026-09-29(6回目)追加。ユーザー要望「各惑星を占領するのに歩兵が降りて、惑星軍と戦って、
  // 100%になったら占領されるようにしたい」を受け、Stellaris(制宙権確保後にassault armiesで着陸侵攻し、
  // 惑星のdefensive armiesと戦う)・Master of Orion(輸送艦で運んだ海兵隊で地上戦)を調査のうえ翻案。
  // 強襲揚陸艦(MA)が運ぶ地上兵力。starmap.jsのtickInvasionsが、敵星系の防衛度(garrison)をこの値で
  // 毎ターン削り、0になった星系を占領する(艦同士のボーディングperformBoardingとは別の、対星系の運用)。
  MA: { id: 'MA', name: '強襲揚陸艦', hp: 450, shield: 150, beam: 40, missile: 80, railgun: 0, torpedo: 0, spd: 6, fighter: 0, intercept: 40, cost: 160, capital: false, boarding: true, troops: 60 },
};
const SHIP_ORDER = ['PL', 'DN', 'BB', 'CC', 'CA', 'DD', 'CV', 'FR', 'TB', 'ES', 'ST', 'MA'];

// 武器体系: shieldPierce=0でシールド全減衰(ビーム)、1でシールド完全無視(ミサイル・雷撃)、0<x<1で部分貫通(電磁投射砲)。
// evadeBase>0の武器は回避判定あり(艦の迎撃力・陣形回避で軽減)。energy=trueの武器はゼッフル粒子域で使用不可。
// cooldown>0の武器は、発射後そのターン数だけ再使用不可(電磁投射砲は過熱のため隔ターン射撃)。
const WEAPON_DEFS = {
  beam:    { id: 'beam',    name: 'ビーム',       range: 4, shieldPierce: 0,   evadeBase: 0,    energy: true,  cooldown: 0 },
  railgun: { id: 'railgun', name: '電磁投射砲',   range: 9, shieldPierce: 0.5, evadeBase: 0,    energy: false, cooldown: 1 },
  missile: { id: 'missile', name: 'ミサイル',     range: 7, shieldPierce: 1,   evadeBase: 0.35, energy: false, cooldown: 0 },
  torpedo: { id: 'torpedo', name: '雷撃',         range: 5, shieldPierce: 1,   evadeBase: 0.50, energy: false, cooldown: 0 },
  // 空母の艦載機による攻撃(SHIPS[..].fighter の値が威力)。迎撃力の高い艦には落とされやすい。
  fighter: { id: 'fighter', name: '艦載機',       range: 8, shieldPierce: 0.7, evadeBase: 0.30, energy: false, cooldown: 0 },
};
const WEAPON_ORDER = ['beam', 'railgun', 'missile', 'torpedo', 'fighter'];

// 3.2 陣形(FORMS)
const FORMS = {
  spindle:    { id: 'spindle',    name: '紡錘陣', atk: 0.30,  def: -0.20, evade: 0,     move: 0 },
  square:     { id: 'square',     name: '方円陣', atk: -0.10, def: 0.30,  evade: -0.10, move: -1 },
  dispersed:  { id: 'dispersed',  name: '疎開陣', atk: -0.20, def: 0,     evade: 0.25,  move: 1 },
};
const FORM_ORDER = ['spindle', 'square', 'dispersed'];

// 3.3 提督特性(TRAITS)
// compWeights: 2026-09-29追加。「登場人物(提督)のスキルにあわせて艦隊を編成する」ための、艦種ごとの採用比重。
// starmap.jsのcomposeFleetForAdmiralが、提督の主特性(traits[0])のこの表に従って艦種を重み付き抽選する。
const TRAITS = {
  genius:     { id: 'genius',     name: '用兵の天才',   desc: '全武器+12%',        compWeights: { DN: 3, PL: 2, BB: 2, CC: 3, CA: 2, CV: 2, DD: 1, FR: 1, TB: 1, ES: 1, ST: 1, MA: 1 } },   // 全艦種を高水準でそつなく揃える万能編成。指揮巡洋艦で自らの多才さを底上げする
  aggressive: { id: 'aggressive', name: '猛将',         desc: '攻+18% 防-10%',     compWeights: { DN: 4, PL: 2, BB: 3, CC: 2, CA: 2, DD: 1 } },                                     // 大型艦中心の攻撃艦隊。指揮巡洋艦で攻めの気性を倍加させる
  defensive:  { id: 'defensive',  name: '守勢の名手',   desc: '被害-18%',          compWeights: { FR: 4, CA: 3, BB: 2, CC: 1, ES: 2, DD: 1 } },                                     // 護衛艦・巡航艦中心の堅陣
  ace:        { id: 'ace',        name: '空戦の鬼',     desc: '艦載機/迎撃+35%',   compWeights: { CV: 4, FR: 2, CA: 1, DD: 1 } },                                            // 空母中心の航空打撃群
  missileer:  { id: 'missileer',  name: '実弾術師',     desc: 'ミサイル+30%',      compWeights: { DD: 4, TB: 3, CA: 1 } },                                                   // 駆逐艦・雷撃艇の実弾艦隊
  charisma:   { id: 'charisma',   name: 'カリスマ',     desc: '士気・登用+',       compWeights: { ES: 3, MA: 3, FR: 2, CA: 2, DD: 1 } },                                            // 撃滅でなく鹵獲(強襲揚陸艦)を好む、懐柔上手な編成
  siege:      { id: 'siege',      name: '攻城家',       desc: '要塞攻撃時+20%',    compWeights: { PL: 4, DN: 3, BB: 2, CC: 1 } },                                                   // 惑星型戦闘艦・超弩級艦中心の攻城艦隊
};
const TRAIT_ORDER = ['genius', 'aggressive', 'defensive', 'ace', 'missileer', 'charisma', 'siege'];

// 艦隊識別色(2026-09-29追加): 「艦隊特有の識別」用のアクセント色パレット。提督名(ADMIRAL_NAMES内の並び)に
// 1:1で対応させ、同じ提督が指揮する限り艦隊の色が変わらない「識別サイン」になるようにする(starmap.jsのfleetIdentityColor)。
const FLEET_ID_COLORS = [
  [255, 209, 102], // 山吹
  [111, 191, 255], // 氷青
  [255, 138, 194], // 桜桃
  [154, 230, 140], // 若緑
  [255, 148, 90],  // 橙
  [190, 150, 255], // 紫水晶
  [255, 99, 99],   // 緋
  [120, 220, 210], // 青緑
];

// 階級(RANKS): 武勲(merit)蓄積で昇進。cap = 次の階級に上がる必要武勲。
const RANKS = [
  { id: 'commodore', name: '准将',     cap: 110 },
  { id: 'rearAdmiral', name: '少将',   cap: 150 },
  { id: 'viceAdmiral', name: '中将',   cap: 200 },
  { id: 'admiral', name: '大将',       cap: 260 },
  { id: 'seniorAdmiral', name: '上級大将', cap: 330 },
  { id: 'marshal', name: '元帥',       cap: 420 },
];

// 特殊環境(2026-09-29追加分: 実在の4X宇宙戦略ゲーム ― Space Empires:4X の小惑星帯/星雲による命中・索敵低下、
// Stellarisの電離ネビュラ・パルサーによるシールド無力化+速度低下、等を調査のうえ、本作の武器体系(ビーム/電磁投射砲/
// ミサイル/雷撃/艦載機)に合わせて翻案した。艦種ごとに得手不得手が生まれるよう、大型艦有利/小型艦有利/ビーム有利/
// 非ビーム有利/布陣していた側有利、の5系統に分けてある(「戦闘環境に合わせて艦隊を選ぶ」ための土台)。
// 2026-09-29(2回目)、ユーザー要望によりブラックホール・恒星近傍・回廊(隘路)を追加。銀河英雄伝説の
// 「アムリッツァ回廊」「イーゼルローン回廊」のような、狭い航路での奇襲・艦隊決戦という定番シチュエーションを
// 翻案した(回廊=corridor)。重力嵐(ブラックホール)は、戦闘が長引くほど潮汐力が増す「重力の変化」も追加した。
const ZONE = {
  none: { id: 'none', name: '通常宙域' },
  gravity: { id: 'gravity', name: '重力嵐', desc: '移動力-1、大型艦に毎ターン継続被害(事象の地平面に近いブラックホールのため、ラウンドが進むほど潮汐力が増して悪化する)', label: 'ヴェスパー超重力域', favors: 'small' },
  zeffel: { id: 'zeffel', name: 'ゼッフル粒子', desc: 'ビーム兵器が引火爆発するため使用不可(電磁投射砲・ミサイル・雷撃・艦載機は使用可)', label: 'クレーン宙域', favors: 'nonBeam' },
  asteroid: { id: 'asteroid', name: '小惑星帯', desc: '護衛艦・駆逐艦・雷撃艇は岩塊に紛れて実弾兵器の回避率+18%、大型艦は毎ターン軽微な接触損害', label: 'イゼル小惑星帯', favors: 'small' },
  ion: { id: 'ion', name: '電離嵐', desc: '移動力-1、全艦のシールド出力が半減(ビーム兵器が通りやすくなる)', label: 'アムリ電離霧', favors: 'beam' },
  star: { id: 'star', name: '恒星近傍', desc: '恒星の放射エネルギーでビーム兵器威力+15%、ただし全艦に毎ターン軽微な熱線被害', label: 'タナトス恒星域', favors: 'beam' },
  corridor: { id: 'corridor', name: '回廊', desc: '隘路のため艦の回避運動が大きく制限される(回避率の基礎値が実質0に)。先に布陣していた側は奇襲となり、開戦第1ラウンドの攻撃力+30%', label: '無名回廊', favors: 'defender' },
};

// ---------- 開発(研究)・特殊兵装・政略(2026-09-29追加) ----------
// 「大戦略」シリーズ(拠点の研究所で資金・ターン数を投じて兵器を開発する仕組み、戦闘をこなした部隊が
// 熟練度を積んで強くなる仕組み)と、「信長の野望」シリーズ(調略=流言で忠誠を下げる・引抜で寝返らせる、
// 内政=開発投資で所領の産出を増やす仕組み)をWeb調査のうえ翻案した。
// 研究(TECH_DEFS): 陣営ごとにLv.0から始まり、1段階ずつ資源とターン数を投じて強化する。
const TECH_DEFS = {
  shipyard: { id: 'shipyard', name: '造船技術', desc: 'Lv.1 巡航艦・雷撃艇 / Lv.2 戦艦・ステルス / Lv.3 空母・指揮巡洋艦 / Lv.4 超弩級艦 / Lv.5 惑星型戦闘艦', maxLevel: 5, costOf: lv => 180 + lv * 130, turnsOf: lv => 2 + lv },
  weapon: { id: 'weapon', name: '兵装研究', desc: 'Lv.毎に全武器の威力+5%', maxLevel: 5, costOf: lv => 220 + lv * 140, turnsOf: lv => 2 + lv },
  armor: { id: 'armor', name: '装甲研究', desc: 'Lv.毎に被ダメージ-5%', maxLevel: 5, costOf: lv => 220 + lv * 140, turnsOf: lv => 2 + lv },
  ecm: { id: 'ecm', name: '電子戦研究', desc: 'Lv.毎に実弾・誘導兵器の回避率+4%。Lv.1/2/3で特殊兵装を1つずつ開放', maxLevel: 3, costOf: lv => 260 + lv * 180, turnsOf: lv => 3 + lv },
};
const TECH_ORDER = ['shipyard', 'weapon', 'armor', 'ecm'];
// 特殊兵装(EQUIP_DEFS): 電子戦研究の各Lv到達で開放され、艦隊(旗艦)に1つだけ装備できる。効果はhexbattle.jsのperformAttack等で参照。
const EQUIP_DEFS = {
  shieldBooster: { id: 'shieldBooster', name: 'シールド増幅器', desc: '被弾ダメージ-10%', unlockLv: 1, cost: 220 },
  ecmPod: { id: 'ecmPod', name: 'ECMポッド', desc: '実弾・誘導兵器の被回避率+14%', unlockLv: 2, cost: 260 },
  autoRepair: { id: 'autoRepair', name: '自動修復ドローン', desc: '会戦開始時に耐久を5%回復', unlockLv: 3, cost: 300 },
};
const EQUIP_ORDER = ['shieldBooster', 'ecmPod', 'autoRepair'];
// 軍事(熟練): 累積撃墜数がこの数に達すると精鋭化し、攻撃力+8%・回避率+5%の永続ボーナスを得る(大戦略シリーズの熟練度システムを参考)。
const VETERAN_KILLS = 3;
const VETERAN_BONUS = { atk: 1.08, evade: 0.05 };
// 政略(調略・内政)の資源コスト
const POLITICS = {
  subvertCost: 180,                       // 調略(引抜): 敵提督への働きかけ1回あたりの費用
  investCost: lv => 120 + lv * 90,        // 内政(開発投資): 星系の開発Lv(0〜3)毎の費用
  investBonus: 6,                         // 内政Lv.1毎に、その星系がもたらす産出資源+6/ターン
  investMaxLevel: 3,
};

// ---------- 工作艦の運用: 機雷・野戦修復(2026-09-29追加) ----------
// Sins of a Solar Empireの機雷敷設艦(Vasari種族の専用ユニット)を参考に、工作艦(ES)がいる艦隊だけが
// 星系に機雷原を敷設できるようにした。機雷は「その星系を有さない陣営の艦隊が到着した時」に爆発し、
// 工作艦を伴わない艦隊ほど大きな被害を受ける(=掃海には工作艦が要る、という役割分担)。
const MINES = {
  layCost: lv => 150 + lv * 100,   // 敷設Lv(0〜3)毎の費用。要:自軍のES(工作艦)が同じ星系に在泊していること
  maxLevel: 3,
  dmgRateSwept: 0.03,    // 工作艦を伴う艦隊が触雷した場合の被害率(最大HPに対する割合)×機雷Lv
  dmgRateUnswept: 0.08,  // 工作艦を伴わない艦隊が触雷した場合の被害率×機雷Lv
  fieldRepairRate: 0.02, // 工作艦がいる艦隊が、自国星系に停泊中(進軍していない)の間、戦略ターン毎に回復する割合
};

// 星系マップ: 資料.txt原案は10星系・15航路。2026-09-27、ユーザー要望により約40星系へ拡張。
// 手書きではなく、決まった種(シード)から毎回同じ銀河を組み立てる(生成手順は下記 generateGalaxy)。
// 手を加えたい場合は、この関数の中身(星系数・名前・配置・航路の作り方)を書き換える。
function mulberry32(seed) {
  return function () {
    seed |= 0; seed = (seed + 0x6D2B79F5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function generateGalaxy(seed) {
  const rng = mulberry32(seed);
  const pick = arr => arr[Math.floor(rng() * arr.length)];
  const systems = [];
  systems.push({ id: 'lowenburg', name: 'レーヴェンブルク', owner: 'empire', fortress: true, capital: true, x: 0.94, y: 0.10, zone: 'none' });
  systems.push({ id: 'terranova', name: '地球圏', owner: 'republic', fortress: true, capital: true, x: 0.06, y: 0.92, zone: 'none' });

  // 帝国風・連合風の音節を組み合わせて、重複しない星系名を必要数だけ作る。
  const EMPIRE_A = ['ヴェス', 'アステ', 'ヒンター', 'ゼー', 'カルス', 'シュタイン', 'ヴァル', 'オルフェ', 'ドルン', 'グロス', 'モルガ', 'エーレ', 'タンネ', 'ノイエ'];
  const EMPIRE_B = ['ル門', 'リヒト', 'ブルク', 'フェルト', 'ヴァルト', 'シュタット', 'ホルム', 'グラート', 'マルク', '要塞', '宙域', '前哨'];
  const REPUB_A = ['フライ', 'ブラン', 'ケス', 'ライン', 'ドーソン', 'モート', 'ラップ', 'カゼル', 'フィッシャー', 'アッテン', 'ビュコ', 'ヨーク'];
  const REPUB_B = ['ハーフェン', 'ダイス', 'ラー辺境', 'ハイム', 'ヴィル', 'フォード', 'バラー', 'ステーション', '星域', 'コロニー'];
  const NEUTRAL_A = ['ヴェスパー', 'クレーン', 'アムリ', 'イゼル', '無名', 'ゼッフル', 'カリン', 'タナトス'];
  const NEUTRAL_B = ['回廊', '宙域', '星団', '回廊帯', 'の墓場', '航路'];
  function makeNames(poolA, poolB, n) {
    const used = new Set(), out = [];
    let guard = 0;
    while (out.length < n && guard++ < n * 50) {
      const name = pick(poolA) + pick(poolB);
      if (used.has(name)) continue;
      used.add(name); out.push(name);
    }
    while (out.length < n) out.push(`辺境星${out.length}`); // 万一名前が尽きた場合の保険
    return out;
  }
  const N = 40;
  const COLS = 8, ROWS = 5; // 8x5の格子(40マス)に、乱数でずらしを加えて配置する。右上隅=帝国首都、左下隅=連合首都のマスは、既に首都を置いたので除外する。
  const cells = [];
  for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) {
    if (c === COLS - 1 && r === 0) continue; // 帝国首都のマス
    if (c === 0 && r === ROWS - 1) continue; // 連合首都のマス
    cells.push({ c, r });
  }
  const restCells = cells;
  const restCount = N - 2;
  const names = { empire: makeNames(EMPIRE_A, EMPIRE_B, 20), republic: makeNames(REPUB_A, REPUB_B, 20), neutral: makeNames(NEUTRAL_A, NEUTRAL_B, 10) };
  let ei = 0, ri = 0, ni = 0;

  const withPos = restCells.slice(0, restCount).map(cell => {
    const jitterX = (rng() - 0.5) * (0.9 / COLS), jitterY = (rng() - 0.5) * (0.9 / ROWS);
    const x = Math.min(0.98, Math.max(0.02, (cell.c + 0.5) / COLS + jitterX));
    const y = Math.min(0.98, Math.max(0.02, (cell.r + 0.5) / ROWS + jitterY));
    return { x, y, distEmpire: Math.hypot(x - 0.94, y - 0.10), distRepublic: Math.hypot(x - 0.06, y - 0.92) };
  });
  // 帝国寄り・連合寄り・中立、の順にソートして、およそ 16:16:6 に振り分ける(合計38 + 首都2 = 40)。
  const byLean = withPos.map((p, idx) => ({ ...p, idx })).sort((a, b) => (a.distEmpire - a.distRepublic) - (b.distEmpire - b.distRepublic));
  const EMP_N = 16, REP_N = 16;
  byLean.forEach((p, order) => {
    let owner, pool;
    if (order < EMP_N) { owner = 'empire'; pool = 'empire'; }
    else if (order >= byLean.length - REP_N) { owner = 'republic'; pool = 'republic'; }
    else { owner = 'neutral'; pool = 'neutral'; }
    let name;
    if (pool === 'empire') name = names.empire[ei++];
    else if (pool === 'republic') name = names.republic[ri++];
    else name = names.neutral[ni++];
    systems.push({ id: 'sys' + p.idx, name, owner, fortress: false, capital: false, x: p.x, y: p.y, zone: 'none', _distEmpire: p.distEmpire, _distRepublic: p.distRepublic });
  });
  // 要塞: 各陣営、首都に次いで自国領深くにある2星系を要塞化する。
  const empOwned = systems.filter(s => s.owner === 'empire' && !s.capital).sort((a, b) => a._distEmpire - b._distEmpire);
  const repOwned = systems.filter(s => s.owner === 'republic' && !s.capital).sort((a, b) => a._distRepublic - b._distRepublic);
  for (let i = 0; i < 2 && i < empOwned.length; i++) empOwned[i].fortress = true;
  for (let i = 0; i < 2 && i < repOwned.length; i++) repOwned[i].fortress = true;
  // 特殊環境: 中立宙域(帝国と連合の狭間、6星系)に、6種の環境(重力嵐=ブラックホール/ゼッフル粒子/
  // 小惑星帯/電離嵐/恒星近傍/回廊)を1つずつ割り当てる。マップ上の場所ごとに違う戦場性質を持たせ、
  // 「戦場を沢山作る」「戦場をマップと結びつける」ねらい(銀河は固定シードなので、どの星系がどの環境かは常に同じ)。
  const neutrals = systems.filter(s => s.owner === 'neutral');
  const ZONE_KINDS = ['gravity', 'zeffel', 'asteroid', 'ion', 'star', 'corridor'];
  neutrals.forEach((s, i) => { s.zone = ZONE_KINDS[i % ZONE_KINDS.length]; });
  for (const s of systems) { delete s._distEmpire; delete s._distRepublic; }

  // 航路: 距離が近い順にKruskal法で全体を連結(最小全域木)にしたうえ、近接ノード同士の航路を少し足して、迂回路を作る。
  const idOf = i => systems[i].id;
  const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
  const edges = [];
  for (let i = 0; i < systems.length; i++) for (let j = i + 1; j < systems.length; j++) edges.push([i, j, dist(systems[i], systems[j])]);
  edges.sort((a, b) => a[2] - b[2]);
  const parent = systems.map((_, i) => i);
  function find(x) { while (parent[x] !== x) { parent[x] = parent[parent[x]]; x = parent[x]; } return x; }
  function union(a, b) { const ra = find(a), rb = find(b); if (ra === rb) return false; parent[ra] = rb; return true; }
  const routeSet = new Set(), routes = [];
  const key = (a, b) => a < b ? a + '_' + b : b + '_' + a;
  function addRoute(i, j) { const k = key(i, j); if (routeSet.has(k)) return; routeSet.add(k); routes.push([idOf(i), idOf(j)]); }
  for (const [i, j] of edges) if (union(i, j)) addRoute(i, j);
  // 近い順に、次数(接続数)が多くなりすぎない範囲で、迂回路を追加する。
  const degree = {}; for (const s of systems) degree[s.id] = 0;
  for (const [a, b] of routes) { degree[a]++; degree[b]++; }
  const MAX_DEGREE = 5;
  for (const [i, j, d] of edges) {
    if (d > 0.22) continue; // 近傍のみ
    if (routeSet.has(key(i, j))) continue;
    if (degree[idOf(i)] >= MAX_DEGREE || degree[idOf(j)] >= MAX_DEGREE) continue;
    if (rng() > 0.5) continue;
    addRoute(i, j); degree[idOf(i)]++; degree[idOf(j)]++;
  }
  return { systems, routes };
}
const GALAXY_SEED = 220926;
const { systems: SYSTEMS, routes: ROUTES } = generateGalaxy(GALAXY_SEED);

// 戦術盤: 12x8 ヘックス(Odd-Q)
const BOARD_W = 12, BOARD_H = 8;

// 要塞主砲: 充填ターン数と威力(射程は全域につき判定なし)
const FORTRESS_GUN = { chargeTurns: 2, power: 900 };
// 戦術戦の最大ターン数(超過時はHP合計で判定)
const BATTLE_TURN_LIMIT = 20;
// 強襲揚陸艦(MA)の接舷・強襲(hexbattle.jsのperformBoarding)が届く距離。2026-09-29(5回目)追加。
const BOARDING_RANGE = 2;

// ダメージ計算の基礎乗数(武器ごとの射程・シールド貫通・回避率は WEAPON_DEFS を見よ)
const DAMAGE = {
  facing: { front: 1.0, side: 1.3, back: 1.7 },
  backShieldMul: 0.5,     // 背後攻撃はシールド半減
};

if (typeof module !== 'undefined') module.exports = {
  FACTION, SHIPS, SHIP_ORDER, WEAPON_DEFS, WEAPON_ORDER, FORMS, FORM_ORDER, TRAITS, TRAIT_ORDER, FLEET_ID_COLORS, RANKS, ZONE, SYSTEMS, ROUTES, BOARD_W, BOARD_H, DAMAGE, FORTRESS_GUN, BATTLE_TURN_LIMIT, BOARDING_RANGE,
  TECH_DEFS, TECH_ORDER, EQUIP_DEFS, EQUIP_ORDER, VETERAN_KILLS, VETERAN_BONUS, POLITICS, MINES,
};
