// ---------- STELLAR HEGEMONY ― 銀河覇権: 戦略層(星系マップ・艦隊・人事) ----------

const ADMIRAL_NAMES = {
  empire: ['レオン・ヴァイス', 'エミール・クルーガー', 'イザベル・ハルト', 'フリード・ノイマン', 'マルタ・ケラー', 'オスカー・ベルク', 'リーナ・フォークト', 'アルノ・ブラント'],
  republic: ['佐伯 遼', 'マヤ・オルティス', 'ノア・ベネット', '張 玲', 'アミナ・サイド', 'ルカ・モレノ', '高瀬 葵', 'サム・カーター'],
};
const LEGACY_ADMIRAL_NAMES = {
  empire: ['ヴァルデマール', 'アレン', 'クライスト', 'ロェングラム', 'ミッターマイヤー風', 'オーベルシュタイン風', 'ケスラー', 'ビッテンフェルト風'],
  republic: ['ユリシーズ', 'アッテンボロー風', 'ビュコック風', 'フィッシャー風', 'ドーソン', 'ラップ', 'モートン', 'キャゼルヌ風'],
};
let nameCursor = { empire: 0, republic: 0 };
function nextAdmiralName(faction) {
  const list = ADMIRAL_NAMES[faction];
  const index = nameCursor[faction]++, n = list[index % list.length];
  const generation = Math.floor(index / list.length) + 1;
  return generation === 1 ? n : `${n} ${generation}世`;
}
function migrateLegacyNames(game) {
  if (!game || !Array.isArray(game.fleets)) return;
  for (const fleet of game.fleets) {
    if (!fleet.admiral) continue;
    const faction = fleet.admiral.faction;
    const oldIndex = (LEGACY_ADMIRAL_NAMES[faction] || []).indexOf(fleet.admiral.name);
    if (oldIndex < 0) continue;
    fleet.admiral.name = ADMIRAL_NAMES[faction][oldIndex];
    fleet.color = fleetIdentityColor(fleet.admiral);
  }
  const earth = game.systems && game.systems.find(s => s.id === 'terranova');
  if (earth && earth.name === 'テラ・ノヴァ') earth.name = '地球圏';
  nameCursor = {
    empire: game.fleets.filter(f => f.admiral && f.admiral.faction === 'empire').length,
    republic: game.fleets.filter(f => f.admiral && f.admiral.faction === 'republic').length,
  };
}
function randomTraits(n) {
  const pool = [...TRAIT_ORDER];
  const out = [];
  for (let i = 0; i < n && pool.length; i++) { const idx = Math.floor(Math.random() * pool.length); out.push(pool.splice(idx, 1)[0]); }
  return out;
}
function makeAdmiral(faction) {
  return { name: nextAdmiralName(faction), faction, rank: 0, merit: 0, traits: randomTraits(1 + (Math.random() < 0.35 ? 1 : 0)), loyalty: 60 + Math.floor(Math.random() * 35), status: 'active' };
}
// 艦隊識別色(2026-09-29追加): 提督名がADMIRAL_NAMES内の何番目かをFLEET_ID_COLORSに1:1で対応させる。
// 「その提督が指揮する限り艦隊の色は変わらない」識別サインにするため、艦隊ではなく提督名を鍵にする
// (調略で艦隊ごと寝返っても、提督自身の色は保たれる=キャラクターとしての一貫性)。寝返り後など、
// 現在の所属陣営の名簿に名前が見つからない場合は名前のハッシュ値で代用する。
function fleetIdentityColor(admiral) {
  const list = ADMIRAL_NAMES[admiral.faction] || [];
  const idx = list.indexOf(admiral.name);
  return FLEET_ID_COLORS[(idx >= 0 ? idx : hashStr(admiral.name)) % FLEET_ID_COLORS.length];
}
function shipInstance(typeId) {
  const t = SHIPS[typeId];
  // kills/veteran: 2026-09-29追加。大戦略シリーズの熟練度システムに倣い、撃墜を重ねた艦は精鋭化して永続強化される。
  return { type: typeId, hp: t.hp, maxHp: t.hp, shield: t.shield, maxShield: t.shield, alive: true, kills: 0, veteran: false };
}
function makeFleet(faction, systemId, composition) {
  const ships = [];
  for (const typeId of composition) ships.push(shipInstance(typeId));
  const admiral = makeAdmiral(faction);
  return {
    id: 'F' + Math.random().toString(36).slice(2, 8),
    faction, systemId, route: null, progress: 0, formation: 'spindle',
    admiral, ships, equip: null,   // equip: 2026-09-29追加。特殊兵装(command.jsのEQUIP_DEFS)
    color: fleetIdentityColor(admiral),   // 2026-09-29追加。艦隊特有の識別色(戦略マップ・艦隊一覧・戦闘画面で使用)
  };
}
// 決戦兵器の建造条件(2026-09-29(4回目)追加)。SHIPS[id].unlockTechが無ければ常にtrue。
// あれば、その陣営の該当研究(TECH_DEFS)が指定Lvに達しているかを見る(惑星型戦闘艦=兵装研究Lv.5=最大)。
// research: GAME.research[faction]相当のオブジェクト、またはundefined。initGame()自身が初期艦隊を作る時点
// ではまだGAME(ひいてはGAME.research)が存在しない(GAME=initGame()の代入はinitGame()の戻り後)ため、
// グローバルを直接読まずに呼び出し側から明示的に渡してもらう(未指定=研究皆無の新規ゲーム相当として扱う)。
function shipUnlockedFor(typeId, research) {
  const type = SHIPS[typeId]; if (!type) return false;
  if ((research && research.shipyard || 0) < (type.buildLv || 0)) return false;
  const req = type.unlockTech; if (!req) return true;
  return !!research && (research[req.cat] || 0) >= req.lv;
}
// 登場人物(提督)のスキルにあわせた艦隊編成(2026-09-29追加)。提督の主特性(traits[0])が持つ
// compWeights(constants.js)に従って艦種を重み付き抽選し、costの合計がbudgetに達するまで艦を積む。
// initGame()の初期艦隊、tickProduction()の増援艦種選定の両方から使う。
function composeFleetForAdmiral(admiral, budget, research) {
  const trait = TRAITS[admiral.traits[0]];
  let weights = (trait && trait.compWeights) || { CA: 2, DD: 2, FR: 2 };
  let pool = Object.keys(weights).filter(id => SHIPS[id] && shipUnlockedFor(id, research));
  // 攻城家のように得意艦がすべて未解禁でも、序盤の哨戒艦隊を必ず持てるようにする。
  if (!pool.length) { weights = { DD: 3, FR: 3, MA: 1, ES: 1 }; pool = Object.keys(weights); }
  const composition = [];
  let remaining = budget;
  let guard = 0;
  while (remaining > 0 && guard++ < 60) {
    const affordable = pool.filter(id => SHIPS[id].cost <= remaining);
    if (!affordable.length) break;
    const totalW = affordable.reduce((s, id) => s + weights[id], 0);
    let r = Math.random() * totalW, pick = affordable[affordable.length - 1];
    for (const id of affordable) { r -= weights[id]; if (r <= 0) { pick = id; break; } }
    composition.push(pick);
    remaining -= SHIPS[pick].cost;
  }
  return composition;   // budget=0(例: 空の駐留艦隊を先に作る場合)なら正しく空配列を返す
}
function makeAdmiralFleet(faction, systemId, budget, research) {
  const admiral = makeAdmiral(faction);
  const composition = composeFleetForAdmiral(admiral, budget, research);
  const ships = composition.map(shipInstance);
  return {
    id: 'F' + Math.random().toString(36).slice(2, 8),
    faction, systemId, route: null, progress: 0, formation: 'spindle',
    admiral, ships, equip: null,
    color: fleetIdentityColor(admiral),
  };
}

function fleetPower(fleet) {
  return fleet.ships.reduce((s, sh) => s + (sh.alive ? sh.hp + sh.shield : 0), 0);
}
function fleetAlive(fleet) { return fleet.ships.some(s => s.alive); }

// ---------- 戦闘環境への艦隊適性(2026-09-29追加。「戦闘環境に合わせて艦隊を選ぶ」ための判定) ----------
// ZONE[id].favors: 'small'(小型艦有利。重力嵐・小惑星帯) / 'nonBeam'(非ビーム有利。ゼッフル粒子) /
// 'beam'(ビーム有利。電離嵐・恒星近傍) / 'defender'(先に布陣していた側が有利。回廊)
// に応じて、艦隊の構成(耐久における大型艦の割合、兵装におけるビームの割合)、または対象星系の現在の領有から適性を判定する。
// sysOwner: 回廊(favors:'defender')の判定にのみ使う、移動先候補の星系の現在の領有者('empire'|'republic'|'neutral')。
function zoneSuitability(fleet, zoneId, sysOwner) {
  const z = ZONE[zoneId]; if (!z || !z.favors) return null;
  if (z.favors === 'defender') {
    // 回廊は艦種構成でなく「どちらが先に布陣しているか」で有利不利が決まるため、現在の領有を目安にする。
    if (sysOwner === fleet.faction) return { rating: 'good', note: '自軍の勢力圏の回廊。敵が来れば奇襲する側に回れる' };
    return { rating: 'bad', note: '敵勢力圏(または中立)の回廊。先に布陣されていると奇襲を受ける恐れがある' };
  }
  const alive = fleet.ships.filter(s => s.alive); if (!alive.length) return null;
  const totalHp = alive.reduce((s, sh) => s + SHIPS[sh.type].hp, 0) || 1;
  const capFrac = alive.reduce((s, sh) => s + (SHIPS[sh.type].capital ? SHIPS[sh.type].hp : 0), 0) / totalHp;
  const totalPow = alive.reduce((s, sh) => s + WEAPON_ORDER.reduce((ss, w) => ss + (SHIPS[sh.type][w] || 0), 0), 0) || 1;
  const beamFrac = alive.reduce((s, sh) => s + (SHIPS[sh.type].beam || 0), 0) / totalPow;
  if (z.favors === 'small') {
    if (capFrac < 0.3) return { rating: 'good', note: '小型艦中心でこの環境に適応しやすい' };
    if (capFrac > 0.6) return { rating: 'bad', note: '大型艦中心のためこの環境で消耗が大きい' };
    return { rating: 'neutral', note: '大型艦と小型艦が混在し、影響は中程度' };
  }
  if (z.favors === 'nonBeam') {
    if (beamFrac > 0.5) return { rating: 'bad', note: 'ビーム主体編成のため、この環境で火力を発揮できない' };
    return { rating: 'good', note: '非ビーム兵器主体でこの環境の影響を受けにくい' };
  }
  if (z.favors === 'beam') {
    if (beamFrac > 0.4) return { rating: 'good', note: 'ビーム主体編成が活きる環境' };
    return { rating: 'neutral', note: 'ビーム武装が少なく、恩恵は限定的' };
  }
  return null;
}

function systemById(id) { return GAME.systems.find(s => s.id === id); }
function neighborIdsOf(id) {
  const out = [];
  for (const [a, b] of ROUTES) { if (a === id) out.push(b); if (b === id) out.push(a); }
  return out;
}
function routeExists(a, b) { return neighborIdsOf(a).includes(b); }
function fleetsAt(systemId) { return GAME.fleets.filter(f => f.systemId === systemId && !f.route && fleetAlive(f)); }
function fleetsOfFaction(faction) { return GAME.fleets.filter(f => f.faction === faction && fleetAlive(f)); }

// 首都から自領航路だけを辿る戦略補給。敵艦が居座る星系は通過できず、航路切断に意味が生まれる。
// 首都喪失時は要塞、次いで残存星系から臨時補給を行うが、その効率は下がる。
function strategicSupplyNetwork(faction) {
  const owned = GAME.systems.filter(s => s.owner === faction);
  const homeCapitalId = faction === 'empire' ? 'lowenburg' : 'terranova';
  const capital = owned.find(s => s.id === homeCapitalId), fortress = owned.find(s => s.fortress);
  const source = capital || fortress || owned[0];
  const base = capital ? 100 : fortress ? 75 : source ? 55 : 0;
  const connected = new Set();
  if (!source) return { connected, base, source: null };
  const queue = [source.id]; connected.add(source.id);
  while (queue.length) {
    const cur = queue.shift();
    for (const nb of neighborIdsOf(cur)) {
      const sys = systemById(nb);
      if (!sys || sys.owner !== faction || connected.has(nb)) continue;
      if (fleetsAt(nb).some(f => f.faction !== faction)) continue;
      connected.add(nb); queue.push(nb);
    }
  }
  return { connected, base, source: source.id };
}
function strategicSupplyRate(faction, systemId, network) {
  if (GAME.sandbox || GAME.mission) return 100; // 章別シナリオ・模擬戦は戦略マップの後方線を持たない
  const sys = systemById(systemId); if (!sys) return 0;
  const net = network || strategicSupplyNetwork(faction);
  if (net.connected.has(systemId)) return net.base;
  if (sys.owner === faction) return 35; // 孤立拠点に残された局地備蓄
  const neighbors = neighborIdsOf(systemId);
  if (neighbors.some(id => net.connected.has(id))) return Math.round(net.base * 0.7);
  if (neighbors.some(id => { const s = systemById(id); return s && s.owner === faction; })) return 25;
  return 0;
}
function tickStrategicAttrition() {
  if (GAME.sandbox || GAME.mission) return;
  for (const f of GAME.fleets) {
    if (f.route || !fleetAlive(f)) continue;
    const rate = strategicSupplyRate(f.faction, f.systemId);
    if (rate >= 35) continue;
    let damage = 0;
    for (const ship of f.ships) {
      if (!ship.alive) continue;
      const loss = Math.max(1, Math.round(ship.maxHp * (rate === 0 ? 0.015 : 0.007)));
      ship.hp = Math.max(0, ship.hp - loss);
      ship.shield = Math.max(0, ship.shield - Math.round(ship.maxShield * 0.04));
      damage += loss;
      if (ship.hp === 0) ship.alive = false;
    }
    pushLog(`${systemNameOf(f.systemId)}の${f.admiral.name}艦隊、補給途絶で耐久${damage}を喪失。`);
  }
}

// 地上侵攻(2026-09-29(6回目)追加): 星系の防衛度(garrison)の上限。開発投資(devLevel)・要塞・首都ほど硬い。
// tickInvasionsがこの値を基準に、侵攻中は削り、無防備な時はここまでゆっくり回復させる。
function garrisonMaxFor(sys) {
  return 120 + (sys.devLevel || 0) * 40 + (sys.fortress ? 400 : 0) + (sys.capital ? 300 : 0);
}
function initGame() {
  nameCursor = { empire: 0, republic: 0 };
  // garrison/garrisonMax: 2026-09-29(6回目)追加。地上侵攻(tickInvasions参照)で使う星系の防衛度。
  const systems = SYSTEMS.map(s => { const gm = garrisonMaxFor(s); return { ...s, devLevel: 0, mines: 0, garrison: gm, garrisonMax: gm }; });   // devLevel: 内政(開発投資)による産出強化。mines: 機雷原の規模(0〜MINES.maxLevel)
  // 銀河は毎回同じ生成ルール(constants.jsのgenerateGalaxy)から作られるが、IDを直書きせず、
  // 「自国の首都」「自国の要塞(首都以外)」を実行時に検索して艦隊の初期配置に使う(生成側の変更に強くするため)。
  const empireCapital = systems.find(s => s.owner === 'empire' && s.capital);
  const republicCapital = systems.find(s => s.owner === 'republic' && s.capital);
  const empireFortress = systems.find(s => s.owner === 'empire' && s.fortress && !s.capital) || empireCapital;
  const republicFortress = systems.find(s => s.owner === 'republic' && s.fortress && !s.capital) || republicCapital;
  // 艦隊規模(2026-09-29、ユーザー要望「もう少し艦隊規模を増やして」により、当初の6隻/5隻編成から増強)。
  // 2026-09-29(3回目): 「登場人物のスキルにあわせて編成」のため、固定艦種リストではなく提督ごとの
  // 予算(旧構成のcost合計相当)をcomposeFleetForAdmiralに渡し、提督の主特性で艦種構成が変わるようにした。
  const fleets = [];
  // 開始時は哨戒・揚陸中心の艦隊。主力艦は造船技術と資源を積み上げてから竣工する。
  fleets.push(makeAdmiralFleet('empire', empireCapital.id, 900));
  fleets.push(makeAdmiralFleet('empire', empireFortress.id, 540));
  fleets.push(makeAdmiralFleet('republic', republicCapital.id, 900));
  fleets.push(makeAdmiralFleet('republic', republicFortress.id, 540));
  return {
    turn: 1, log: [], phase: 'strategy', systems, fleets, battleQueue: [],
    selectedFleetId: null, cursorSystemId: 'lowenburg',
    resources: { empire: 300, republic: 300 }, buildQueue: { empire: null, republic: null },
    // research: 2026-09-29追加。開発(研究)の陣営別Lv.とactive(進行中の研究)。command.jsのstartResearch/tickResearchが操作する。
    research: {
      empire: { shipyard: 0, weapon: 0, armor: 0, ecm: 0, active: null },
      republic: { shipyard: 0, weapon: 0, armor: 0, ecm: 0, active: null },
    },
    activeBattle: null, camPan: { x: 0.5, y: 0.5 }, camZoom: 1,
    playerFaction: 'empire',
  };
}
function pushLog(msg) { GAME.log.unshift('T' + GAME.turn + ' ' + msg); if (GAME.log.length > 60) GAME.log.pop(); }
function campaignProgress(faction) {
  const enemy = faction === 'empire' ? 'republic' : 'empire';
  const enemyCapital = GAME.systems.find(s => s.id === (enemy === 'empire' ? 'lowenburg' : 'terranova'));
  return {
    owned: GAME.systems.filter(s => s.owner === faction).length,
    required: Math.ceil(GAME.systems.length * 0.6),
    enemyCapitalId: enemyCapital ? enemyCapital.id : null,
    capitalHeld: !!enemyCapital && enemyCapital.owner === faction,
  };
}
function checkCampaignVictory() {
  if (GAME.mission || GAME.sandbox || GAME.campaignWinner) return null;
  for (const faction of ['empire', 'republic']) {
    const p = campaignProgress(faction);
    if (p.capitalHeld && p.owned >= p.required) {
      GAME.campaignWinner = faction;
      GAME.phase = 'campaignEnd';
      if (typeof syncAppUI === 'function') syncAppUI(true);
      pushLog(`${FACTION[faction].short}が敵首都と銀河の過半を制し、覇権戦争は終結した。`);
      if (typeof saveGame === 'function') saveGame();
      return faction;
    }
  }
  return null;
}

// ---------- 進軍指令 ----------
function orderMarch(fleetId, targetSystemId) {
  const f = GAME.fleets.find(x => x.id === fleetId); if (!f || f.route) return false;
  if (!routeExists(f.systemId, targetSystemId)) return false;
  f.route = { from: f.systemId, to: targetSystemId }; f.progress = 0; f.systemId = null;
  pushLog(`${FACTION[f.faction].short}艦隊(${f.admiral.name})が${systemNameOf(targetSystemId)}へ進発。`);
  return true;
}
function systemNameOf(id) { const s = systemById(id); return s ? s.name : id; }

// ---------- 行軍フェーズ: 艦隊を進め、両軍が同一星系に達したら会戦を積む ----------
function marchSpeedOf(fleet) {
  const minSpd = Math.min(...fleet.ships.filter(s => s.alive).map(s => SHIPS[s.type].spd));
  return Math.max(1, minSpd || 3);
}
function advanceMarches() {
  for (const f of GAME.fleets) {
    if (!f.route || !fleetAlive(f)) continue;
    const speed = marchSpeedOf(f);
    f.progress += speed * 0.34; // 数タームで到着する程度のペース
    if (f.progress >= 1) {
      f.systemId = f.route.to; f.route = null; f.progress = 0;
      onFleetArrived(f);
    }
  }
}
function onFleetArrived(fleet) {
  const sys = systemById(fleet.systemId);
  applyMinefield(fleet, sys);
  if (!fleetAlive(fleet)) return;   // 機雷原で艦隊が全滅した場合、以後の接触・占領判定は行わない
  const others = fleetsAt(fleet.systemId).filter(f => f.id !== fleet.id);
  const enemies = others.filter(f => f.faction !== fleet.faction);
  if (enemies.length) {
    GAME.battleQueue.push({ systemId: fleet.systemId, attackerId: fleet.id, defenderId: enemies[0].id });
    pushLog(`${systemNameOf(fleet.systemId)}にて両軍が接触。会戦発生。`);
  } else if (sys.owner !== fleet.faction) {
    // 地上侵攻(2026-09-29(6回目)追加): 無人宙域(neutral)は無血で占領できるが、他陣営が
    // 既に領有する星系は、制宙権を握っただけでは占領できない。実際の占領はtickInvasionsが
    // 強襲揚陸艦(MA)の地上兵力で星系の防衛度(garrison)を削りきった時に成立する。
    if (sys.owner === 'neutral') {
      sys.owner = fleet.faction;
    } else {
      pushLog(`${systemNameOf(fleet.systemId)}の制宙権を${FACTION[fleet.faction].short}が握った。占領には地上侵攻(強襲揚陸艦)が必要。`);
    }
  }
}

// ---------- 機雷(2026-09-29追加。Sins of a Solar Empireの専用機雷敷設艦を参考に、工作艦(ES)が敷設する) ----------
// その星系を有していない陣営の艦隊が到着すると起爆する。工作艦を伴う艦隊は掃海しながら進むため被害が小さく、
// 機雷原の規模も1段階減る(=工作艦のいない艦隊ほど機雷原の脅威に晒される、という役割分担)。
function applyMinefield(fleet, sys) {
  if (!sys.mines || sys.owner === fleet.faction) return;
  const hasES = fleet.ships.some(s => s.alive && s.type === 'ES');
  const rate = (hasES ? MINES.dmgRateSwept : MINES.dmgRateUnswept) * sys.mines;
  let sunk = 0;
  for (const ship of fleet.ships) {
    if (!ship.alive) continue;
    const dmg = Math.round(ship.maxHp * rate);
    ship.hp -= dmg;
    if (ship.hp <= 0) { ship.hp = 0; ship.alive = false; sunk++; }
  }
  pushLog(`${systemNameOf(sys.id)}の機雷原で${FACTION[fleet.faction].short}艦隊(${fleet.admiral.name})が被害` +
    (sunk ? `(${sunk}隻喪失)` : '') + (hasES ? '。工作艦が掃海し、機雷原の規模が縮小した' : '') + '。');
  if (hasES) sys.mines = Math.max(0, sys.mines - 1);
}
// 自国星系に工作艦(ES)を伴う艦隊を停泊させておくと、戦略ターン毎にわずかに艦隊が修復される(野戦修復)。
function tickFleetRepair() {
  for (const f of GAME.fleets) {
    if (f.route || !fleetAlive(f)) continue;
    if (!f.ships.some(s => s.alive && s.type === 'ES')) continue;
    const sys = systemById(f.systemId); if (!sys || sys.owner !== f.faction) continue;
    for (const ship of f.ships) {
      if (!ship.alive) continue;
      ship.hp = Math.min(ship.maxHp, Math.round(ship.hp + ship.maxHp * MINES.fieldRepairRate));
      ship.shield = Math.min(ship.maxShield, Math.round(ship.shield + ship.maxShield * MINES.fieldRepairRate));
    }
  }
}
// ---------- 地上侵攻(2026-09-29(6回目)追加) ----------
// ユーザー要望「各惑星を占領するのに歩兵が降りて、惑星軍と戦って、100%になったら占領される」を受け、
// Stellaris(制宙権確保後、assault armiesで着陸しdefensive armiesと戦う。守備隊が無ければ即占領)・
// Master of Orion(輸送艦の海兵隊で地上戦、相対戦力で消耗しあう)を調査のうえ翻案。
// 星系の防衛度(garrison)をHPバーのように扱い、強襲揚陸艦(MA)の地上兵力(troops)で毎ターン削る。
// 0まで削りきると占領成立。逆に、侵攻側がいない(または強襲揚陸艦を伴わない)間は、守備隊がゆっくり回復する。
function tickInvasions() {
  for (const sys of GAME.systems) {
    if (sys.owner === 'neutral') continue;   // 無人宙域は制宙権だけで占領できるため対象外(onFleetArrived参照)
    if (sys.garrisonMax === undefined) { sys.garrisonMax = garrisonMaxFor(sys); sys.garrison = sys.garrisonMax; }
    const present = fleetsAt(sys.id).filter(f => fleetAlive(f));
    const defenders = present.filter(f => f.faction === sys.owner);
    const invaders = present.filter(f => f.faction !== sys.owner);
    // 防衛側の艦隊がまだ星系にいる(=制宙権が定まっていない)間は、侵攻は始まらない。
    // 侵攻艦隊がいない場合も同様。いずれの場合も、守備隊はゆっくり最大値まで回復する。
    if (defenders.length || !invaders.length) {
      if (sys.garrison < sys.garrisonMax) sys.garrison = Math.min(sys.garrisonMax, sys.garrison + sys.garrisonMax * 0.04);
      continue;
    }
    const invader = invaders[0];   // 簡略化: 複数陣営が同時に同じ星系へ侵攻することは想定しない
    const troopPower = invader.ships.filter(s => s.alive && s.type === 'MA').reduce((sum, s) => sum + (SHIPS.MA.troops || 0), 0);
    if (troopPower <= 0) {
      // 制宙権は握っていても、強襲揚陸艦(地上兵力)が無ければ占領は進まない。守備隊は回復する。
      if (sys.garrison < sys.garrisonMax) sys.garrison = Math.min(sys.garrisonMax, sys.garrison + sys.garrisonMax * 0.04);
      continue;
    }
    const supportedTroops = Math.round(troopPower * strategicSupplyRate(invader.faction, sys.id) / 100);
    if (!supportedTroops) { pushLog(`${sys.name}の地上侵攻は補給途絶により停滞。`); continue; }
    sys.garrison = Math.max(0, sys.garrison - supportedTroops);
    // 守備隊の反撃(地上からの対空砲火): 残存する防衛度に応じて、侵攻艦隊の強襲揚陸艦にダメージを与える。
    const maUnits = invader.ships.filter(s => s.alive && s.type === 'MA');
    if (maUnits.length) {
      const counterDmg = Math.round((sys.garrison * 0.12) / maUnits.length);
      for (const s of maUnits) { s.hp = Math.max(0, s.hp - counterDmg); if (s.hp <= 0) { s.hp = 0; s.alive = false; } }
    }
    const pct = Math.round(100 * (1 - sys.garrison / sys.garrisonMax));
    if (sys.garrison <= 0) {
      pushLog(`${systemNameOf(sys.id)}、${FACTION[invader.faction].short}の地上軍に占領された!`);
      sys.owner = invader.faction;
      sys.garrisonMax = garrisonMaxFor(sys);
      sys.garrison = Math.round(sys.garrisonMax * 0.5);   // 占領直後は防衛度半分からの再出発(占領した側の駐留軍として)
    } else {
      pushLog(`${systemNameOf(sys.id)}へ${FACTION[invader.faction].short}の地上軍が侵攻中(占領進捗 ${pct}%)。`);
    }
  }
}
// 機雷の敷設(司令部「工作」タブから呼ぶ)。自国星系かつ、その星系に自軍の工作艦がいることが条件。
function layMines(sysId) {
  const sys = systemById(sysId); if (!sys) return { ok: false, msg: '対象が不正' };
  if (sys.owner !== GAME.playerFaction) return { ok: false, msg: '自国星系にのみ敷設できる' };
  const hasES = fleetsAt(sysId).some(f => f.faction === GAME.playerFaction && f.ships.some(s => s.alive && s.type === 'ES'));
  if (!hasES) return { ok: false, msg: 'この星系に自軍の工作艦がいない' };
  const lv = sys.mines || 0; if (lv >= MINES.maxLevel) return { ok: false, msg: '既に最大Lvまで敷設済み' };
  const cost = MINES.layCost(lv);
  if (GAME.resources[GAME.playerFaction] < cost) return { ok: false, msg: '資源が不足している' };
  GAME.resources[GAME.playerFaction] -= cost;
  sys.mines = lv + 1;
  pushLog(`${sys.name}に機雷を敷設(Lv.${sys.mines})。`);
  return { ok: true };
}

// ---------- 造船: 資源を発注時に支払い、造船Lvに応じた艦だけ数ターン後に首都で竣工する ----------
const BUILD_QUEUE_TYPES = ['FR', 'DD', 'ES', 'MA', 'TB', 'CA', 'ST', 'BB', 'CV', 'CC', 'DN', 'PL'];
function shipBuildTurns(typeId) { return Math.max(1, Math.ceil(SHIPS[typeId].cost / 430)); }
function shipActiveCount(faction, typeId) { return GAME.fleets.reduce((n, f) => n + (f.faction === faction ? f.ships.filter(s => s.alive && s.type === typeId).length : 0), 0); }
function canBuildMore(faction, typeId) { const cap = SHIPS[typeId].activeCap; return !cap || shipActiveCount(faction, typeId) < cap; }
function shipyardOf(faction) {
  return GAME.systems.find(s => s.owner === faction && s.capital) || GAME.systems.find(s => s.owner === faction && s.fortress) || GAME.systems.find(s => s.owner === faction);
}
function queueShipBuild(faction, typeId) {
  const type = SHIPS[typeId], yard = shipyardOf(faction);
  if (!type || !BUILD_QUEUE_TYPES.includes(typeId)) return { ok: false, msg: '建造対象が不正' };
  if (!yard) return { ok: false, msg: '利用できる造船星系がない' };
  if (!GAME.buildQueue) GAME.buildQueue = { empire: null, republic: null }; // 旧セーブとの互換
  if (GAME.buildQueue[faction]) return { ok: false, msg: '造船所は別の艦を建造中' };
  if (!shipUnlockedFor(typeId, GAME.research[faction])) return { ok: false, msg: '造船技術・兵装研究が不足' };
  if (!canBuildMore(faction, typeId)) return { ok: false, msg: 'この艦種は保有上限に達している' };
  if (GAME.resources[faction] < type.cost) return { ok: false, msg: '資源が不足' };
  GAME.resources[faction] -= type.cost;
  GAME.buildQueue[faction] = { typeId, turnsLeft: shipBuildTurns(typeId), systemId: yard.id };
  pushLog(`${FACTION[faction].short}、${yard.name}で${type.name}を起工。資源${type.cost}、${shipBuildTurns(typeId)}ターン。`);
  return { ok: true };
}
function tickProduction() {
  for (const faction of ['empire', 'republic']) {
    const owned = GAME.systems.filter(s => s.owner === faction);
    // 内政(開発投資)による産出ボーナス: 2026-09-29追加。星系ごとのdevLevel×POLITICS.investBonusを上乗せする。
    const devBonus = owned.reduce((s, sy) => s + (sy.devLevel || 0) * POLITICS.investBonus, 0);
    GAME.resources[faction] += 40 + owned.length * 12 + devBonus;
  }
  if (!GAME.buildQueue) GAME.buildQueue = { empire: null, republic: null };
  for (const faction of ['empire', 'republic']) {
    const order = GAME.buildQueue[faction];
    if (!order) continue;
    if (--order.turnsLeft > 0) continue;
    const yard = systemById(order.systemId);
    const destination = yard && yard.owner === faction ? yard : shipyardOf(faction);
    if (!destination) { order.turnsLeft = 1; continue; }
    let fleet = GAME.fleets.find(f => f.faction === faction && f.systemId === destination.id && !f.route && fleetAlive(f));
    if (!fleet) { fleet = makeAdmiralFleet(faction, destination.id, 0, GAME.research[faction]); GAME.fleets.push(fleet); }
    fleet.ships.push(shipInstance(order.typeId));
    pushLog(`${destination.name}で${SHIPS[order.typeId].name}が竣工。${fleet.admiral.name}艦隊へ配備。`);
    GAME.buildQueue[faction] = null;
  }
  // 敵AIも同じ費用・建造期間を負担して1隻ずつ起工。提督の適性を建造候補に反映する。
  const faction = aiFactionOf();
  if (!GAME.buildQueue[faction] && Math.random() < 0.55) {
    const yard = shipyardOf(faction);
    if (!yard) return;
    const tech = GAME.research[faction];
    const hasType = id => GAME.fleets.some(f => f.faction === faction && f.ships.some(s => s.alive && s.type === id));
    // 高段階の造船研究を活かすため、初号主力艦に必要な資源を一時的に積み立てる。
    if ((tech.shipyard || 0) >= 5 && (tech.weapon || 0) >= 5 && !hasType('PL') && GAME.resources[faction] < SHIPS.PL.cost) return;
    if ((tech.shipyard || 0) >= 4 && !hasType('DN') && GAME.resources[faction] < SHIPS.DN.cost) return;
    const affordable = BUILD_QUEUE_TYPES.filter(t => GAME.resources[faction] >= SHIPS[t].cost && shipUnlockedFor(t, GAME.research[faction]) && canBuildMore(faction, t));
    if (!affordable.length) return;
    const fleet = GAME.fleets.find(f => f.faction === faction && f.systemId === yard.id && !f.route && fleetAlive(f));
    const trait = fleet && TRAITS[fleet.admiral.traits[0]];
    const weights = trait ? trait.compWeights : {};
    const totalW = affordable.reduce((s, t) => s + (weights[t] || 0.6), 0);
    let r = Math.random() * totalW, pick = affordable[affordable.length - 1];
    for (const t of affordable) { r -= (weights[t] || 0.6); if (r <= 0) { pick = t; break; } }
    if (affordable.includes('PL') && !hasType('PL')) pick = 'PL';
    else if (affordable.includes('DN') && !hasType('DN')) pick = 'DN';
    // 地上侵攻に必須の揚陸艦を持たない間は、先に1隻確保して戦略AIの停滞を防ぐ。
    if (affordable.includes('MA') && !hasType('MA') && pick !== 'PL' && pick !== 'DN') pick = 'MA';
    queueShipBuild(faction, pick);
  }
}

// ---------- 簡易AI(NPC陣営: プレイヤーでない方) ----------
function aiFactionOf() { return GAME.playerFaction === 'empire' ? 'republic' : 'empire'; }
// 最前線への一歩(2026-09-29(8回目)追加): fromIdから見て最も近い「自陣営が領有していない星系」への
// 最短経路を、所有者を問わない全星系のグラフ上でBFS探索し、その最初の一歩(隣接する自国星系、または
// 前線そのもの)を返す。艦隊が本国の奥深くに留まっていて隣接する非領有星系が無い場合に使う。
// 発見の経緯: 初期艦隊(首都・要塞に配置)の隣接星系が全て自国領だったため、従来のaiTakeTurn(隣接する
// 非領有星系だけを見る)では艦隊が一生本国から動かず、200ターンのシミュレーションで会戦が一度も
// 起きないという、地上侵攻以前の根本的な不具合を発見した。
function strategicTargetScore(fleet, target) {
  const enemy = target.owner !== 'neutral' && target.owner !== fleet.faction;
  const hasMA = fleet.ships.some(s => s.alive && s.type === 'MA');
  const supply = strategicSupplyRate(fleet.faction, target.id);
  const defenders = fleetsAt(target.id).filter(f => f.faction !== fleet.faction);
  const defendingPower = defenders.reduce((n, f) => n + fleetPower(f), 0);
  const powerRatio = defendingPower / Math.max(1, fleetPower(fleet));
  let score = enemy ? 9 : 5;
  if (enemy && target.capital) score += 10;
  if (target.fortress) score -= 3;
  if (enemy && !hasMA) score -= 5; // 制宙だけでは占領できない
  if (enemy && hasMA) score += 2 + (1 - (target.garrison || 0) / Math.max(1, target.garrisonMax || 1)) * 3;
  score += supply * 0.025;
  if (!supply) score -= 9;
  if (powerRatio > 1) score -= Math.min(13, (powerRatio - 1) * 8);
  const suitability = zoneSuitability(fleet, target.zone, target.owner);
  if (suitability) score += suitability.rating === 'good' ? 1.5 : suitability.rating === 'bad' ? -2 : 0;
  return score;
}
function nearestFrontierStep(faction, fromId, fleet) {
  const visited = new Set([fromId]), queue = [{ id: fromId, first: null, d: 0 }];
  let best = null;
  while (queue.length) {
    const cur = queue.shift();
    for (const nb of neighborIdsOf(cur.id)) {
      const sys = systemById(nb); if (!sys) continue;
      const first = cur.first || nb;
      if (sys.owner !== faction) {
        const score = strategicTargetScore(fleet, sys) - cur.d * 1.4;
        if (!best || score > best.score) best = { first, score };
      } else if (!visited.has(nb)) {
        visited.add(nb); queue.push({ id: nb, first, d: cur.d + 1 });
      }
    }
  }
  return best ? best.first : null;
}
function aiTakeTurn() {
  const faction = aiFactionOf();
  for (const f of fleetsOfFaction(faction)) {
    if (f.route) continue;
    // 地上侵攻中は居座る(2026-09-29(6回目)追加): 敵の非中立星系で強襲揚陸艦(MA)を伴って占領を進めている
    // 間にふらふらと他所へ向かわせてしまうと、tickInvasionsが多ターンかけて削る前に艦隊が離れてしまい、
    // 地上侵攻が機能しなくなる(実際に200ターンの検証で、艦隊が居座らず領土が一切動かない不具合を発見)。
    const here = systemById(f.systemId);
    const isInvading = here && here.owner !== faction && here.owner !== 'neutral';
    const hasMA = f.ships.some(s => s.alive && s.type === 'MA');
    if (isInvading && hasMA) {
      if (strategicSupplyRate(faction, here.id) > 0) continue;
      // 補給が完全に途切れた上陸艦を無期限に待機させず、最寄りの自領へ退避させる。
      const retreat = neighborIdsOf(here.id).filter(id => systemById(id)?.owner === faction)
        .sort((a, b) => strategicSupplyRate(faction, b) - strategicSupplyRate(faction, a))[0];
      if (retreat) orderMarch(f.id, retreat);
      continue;
    }
    const neighbors = neighborIdsOf(f.systemId).map(systemById).filter(Boolean);
    let targets = neighbors.filter(s => s.owner !== faction);
    if (!targets.length) {
      // 2026-09-29(8回目)追加: 隣接する非領有星系が無い(本国の奥に留まっている)場合、最前線へ向けて
      // 自国領内を一歩ずつ進軍する。でなければ艦隊が本国から一生出られない(上記の発見を参照)。
      const step = nearestFrontierStep(faction, f.systemId, f);
      if (step && Math.random() < 0.5) orderMarch(f.id, step);
      continue;
    }
    // 目的(敵首都・占領できる星系)と危険(敵戦力・要塞・補給途絶・不利な宙域)を比較する。
    targets.sort((a, b) => strategicTargetScore(f, b) - strategicTargetScore(f, a));
    if (targets.length && strategicTargetScore(f, targets[0]) > -2 && Math.random() < 0.35) orderMarch(f.id, targets[0].id);
  }
}

// ---------- ターン進行 ----------
function endStrategyTurn() {
  advanceMarches();
  aiTakeTurn();
  tickProduction();
  tickResearch();      // 2026-09-29追加: 進行中の研究のターン消化・完了判定
  aiResearchTick();     // 2026-09-29追加: NPC陣営の自動研究着手
  tickFleetRepair();    // 2026-09-29追加: 工作艦(ES)を伴い、自国星系に停泊中の艦隊を野戦修復する
  tickInvasions();      // 2026-09-29(6回目)追加: 強襲揚陸艦(MA)による地上侵攻の進捗・占領判定
  tickStrategicAttrition(); // 補給線から遠い艦隊の耐久・シールドが徐々に消耗する
  GAME.turn++;
  // 2026-09-29(8回目)修正: キュー先頭の会戦が無効(参加艦隊が既に全滅済み等)でも、後続に有効な
  // 会戦が残っていれば取りこぼさないよう、有効な会戦が見つかるかキューが尽きるまで読み進める。
  while (GAME.battleQueue.length && !GAME.activeBattle) startNextBattle();
  if (!GAME.activeBattle) checkCampaignVictory();
}

if (typeof module !== 'undefined') module.exports = {
  initGame, makeFleet, makeAdmiral, fleetPower, fleetAlive, systemById, neighborIdsOf, routeExists,
  fleetsAt, fleetsOfFaction, orderMarch, advanceMarches, tickProduction, aiTakeTurn, endStrategyTurn, systemNameOf, pushLog, zoneSuitability,
  applyMinefield, tickFleetRepair, layMines,
  shipUnlockedFor, shipBuildTurns, shipActiveCount, canBuildMore, queueShipBuild,
  strategicSupplyNetwork, strategicSupplyRate, tickStrategicAttrition,
  campaignProgress, checkCampaignVictory,
};
