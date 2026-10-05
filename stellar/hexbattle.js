// ---------- STELLAR HEGEMONY ― 銀河覇権: 戦術バトルフェーズ(12x8ヘックス) ----------
// 側背攻撃(Facing)は資料.txt 開発バックログ2(未着手)。ここでは全攻撃を facing:'front' として計算する。

function startNextBattle() {
  const job = GAME.battleQueue.shift(); if (!job) return;
  const attacker = GAME.fleets.find(f => f.id === job.attackerId);
  const defender = GAME.fleets.find(f => f.id === job.defenderId);
  if (!attacker || !defender || !fleetAlive(attacker) || !fleetAlive(defender)) return;
  const sys = systemById(job.systemId);
  const playerIsAttacker = attacker.faction === GAME.playerFaction;
  const playerFleet = playerIsAttacker ? attacker : defender;
  const aiFleet = playerIsAttacker ? defender : attacker;

  // 特殊兵装「自動修復ドローン」: 開戦時に耐久を5%回復する(command.jsのEQUIP_DEFS.autoRepair)
  for (const fleet of [playerFleet, aiFleet]) {
    if (fleet.equip !== 'autoRepair') continue;
    for (const ship of fleet.ships) if (ship.alive) ship.hp = Math.min(ship.maxHp, Math.round(ship.hp + ship.maxHp * 0.05));
  }

  const units = [];
  const half = Math.max(1, Math.floor(BOARD_W / 2));   // 自陣が使える列数(艦隊が多いと2列を超えて手前へ広がる)
  for (const fleet of [playerFleet, aiFleet]) {
    const isPlayer = fleet === playerFleet;
    let i = 0;
    for (const ship of fleet.ships) {
      if (!ship.alive) continue;
      const depth = Math.min(half - 1, Math.floor(i / BOARD_H));   // 前線からの列数(0=最前列)
      units.push({
        uid: 'U' + Math.random().toString(36).slice(2, 8), fleetId: fleet.id, faction: fleet.faction,
        type: ship.type, hp: ship.hp, maxHp: ship.maxHp, shield: ship.shield, maxShield: ship.maxShield,
        col: isPlayer ? depth : (BOARD_W - 1 - depth), row: i % BOARD_H,
        alive: true, acted: false, formation: fleet.formation, ship, cooldowns: {},
        cloaked: ship.type === 'ST',   // ステルス艦: 発砲/被弾するまでAIの照準対象から外れる(command.jsのSHIPS.ST.stealth)
        // 特殊兵装「自動修復ドローン」発動演出(2026-09-29追加): 開戦直後だけ、ナノマシンの修復演出を出す
        fxRepairAt: fleet.equip === 'autoRepair' ? millis() : 0,
      });
      i++;
    }
  }
  // 行の重なりを避けるため、簡易に再配置
  const used = new Set();
  for (const u of units) {
    let tries = 0;
    while (used.has(u.col + ',' + u.row) && tries < BOARD_H) { u.row = (u.row + 1) % BOARD_H; tries++; }
    used.add(u.col + ',' + u.row);
  }

  const fortressDefender = sys.fortress ? sys.owner : null;
  // 回廊(corridor): 先にその星系に布陣していた側(defender=攻めてきたのではない側)が、隘路での奇襲側になる。
  const corridorDefender = sys.zone === 'corridor' ? defender.faction : null;
  GAME.activeBattle = {
    systemId: job.systemId, sys, turnNumber: 1, side: 'player',
    playerFleetId: playerFleet.id, aiFleetId: aiFleet.id,
    playerFaction: playerFleet.faction, aiFaction: aiFleet.faction,
    strategicSupply: {
      [playerFleet.faction]: strategicSupplyRate(playerFleet.faction, job.systemId),
      [aiFleet.faction]: strategicSupplyRate(aiFleet.faction, job.systemId),
    },
    units, cursor: { col: 0, row: 0 }, mode: 'select', selectedUid: null, reachable: [], attackTargets: [],
    zone: sys.zone, fortressDefender, corridorDefender, fortressCharge: 0, log: [],
    winner: null, moveLastTime: 0,
    cinemaMode: true, cineFx: [], cineStars: null, // 既定で自動観戦シネマモード。Lボタンで手動指揮に切替
  };
  GAME.phase = 'dogfight';
  startDogfight(playerFleet, aiFleet, GAME.activeBattle);
  pushLog(`${systemNameOf(job.systemId)}にて戦術会戦、開始。`);
}
function battleLog(msg) { const b = GAME.activeBattle; b.log.unshift(msg); if (b.log.length > 30) b.log.pop(); }

function unitAt(b, col, row) { return b.units.find(u => u.alive && u.col === col && u.row === row); }
function unitsOfSide(b, faction) { return b.units.filter(u => u.alive && u.faction === faction); }

function effectiveMove(u) {
  const base = SHIPS[u.type].spd, formMod = formMoveMod(u.formation);
  const zone = GAME.activeBattle.zone, zonePenalty = (zone === 'gravity' || zone === 'ion') ? 1 : 0;
  return Math.max(1, Math.min(6, Math.round(base / 2) + formMod - zonePenalty));
}
function reachableHexes(b, u) {
  const maxMove = effectiveMove(u);
  const start = { col: u.col, row: u.row, d: 0 };
  const key = (c, r) => c + ',' + r;
  const visited = new Map([[key(u.col, u.row), 0]]);
  const queue = [start]; const out = [];
  while (queue.length) {
    const cur = queue.shift();
    if (cur.d > 0) out.push({ col: cur.col, row: cur.row });
    if (cur.d >= maxMove) continue;
    for (const n of hexNeighbors(cur.col, cur.row)) {
      if (!inBoard(n.col, n.row, BOARD_W, BOARD_H)) continue;
      const k = key(n.col, n.row);
      if (visited.has(k)) continue;
      if (unitAt(b, n.col, n.row)) continue;
      visited.set(k, cur.d + 1); queue.push({ col: n.col, row: n.row, d: cur.d + 1 });
    }
  }
  return out;
}
function inRange(a, b2, weapon) { return hexDist(a, b2) <= (WEAPON_DEFS[weapon] ? WEAPON_DEFS[weapon].range : 1); }
// ユニットが今使える武器の一覧(威力>0、ゼッフル粒子域ではエネルギー兵器不可、冷却中は不可)を、威力の高い順に返す。
function getAvailableWeapons(b, u) {
  return WEAPON_ORDER
    .filter(w => (SHIPS[u.type][w] || 0) > 0)
    .filter(w => !(b.zone === 'zeffel' && WEAPON_DEFS[w].energy))
    .filter(w => !(u.cooldowns[w] > 0))
    .sort((a, c) => SHIPS[u.type][c] - SHIPS[u.type][a]);
}

// ステルス艦(2026-09-29追加): Sins of a Solar Empireの偵察艦・Stellarisのクローキングを参考に、
// 「発砲するか、狙われるまでは見つからない」艦を実装した。ゼッフル粒子(濃い気体)域では、
// 光学迷彩が効かず常時発見される(Space Empires:4Xの「星雲でクローキング艦が機能しない」設定を翻案)。
function isCloakedNow(b, u) { return u.type === 'ST' && u.cloaked && b.zone !== 'zeffel'; }
// AI(cinemaActOne/aiActOne/fireFortressGun)の照準対象一覧から、なお隠れているステルス艦を除外する。
// 除外した結果、対象が1隻も残らない場合(全艦がステルスの場合等)は、除外前の一覧をそのまま返す。
function pickableTargets(b, list) {
  const visible = list.filter(u => !isCloakedNow(b, u));
  return visible.length ? visible : list;
}

// 補給率(BFS): 自陣の後方列から到達距離を測り、士気(攻撃倍率0.7〜1.0)に反映する。
function unitSupply(b, u) {
  const homeCols = u.faction === b.playerFaction ? [0, 1] : [BOARD_W - 1, BOARD_W - 2];
  const blocked = new Set();
  for (const o of b.units) if (o.alive && o.faction !== u.faction) blocked.add(o.col + ',' + o.row);
  return computeSupply({ col: u.col, row: u.row }, homeCols, blocked, BOARD_W, BOARD_H);
}
function moraleMulOf(b, u) {
  const tactical = 0.7 + 0.3 * (unitSupply(b, u) / 100);
  const strategic = b.strategicSupply && b.strategicSupply[u.faction] !== undefined ? b.strategicSupply[u.faction] : 100;
  return tactical * (0.65 + 0.35 * strategic / 100);
}

function admiralOfUnit(u) {
  const fleet = GAME.fleets.find(f => f.id === u.fleetId);
  return fleet ? fleet.admiral : null;
}
function applyDamageTo(target, dmg) {
  const shieldAbsorb = Math.min(target.shield, dmg);
  target.shield -= shieldAbsorb;
  const rest = dmg - shieldAbsorb;
  target.hp -= rest;
  if (target.hp <= 0) { target.hp = 0; target.alive = false; target.ship.alive = false; }
  target.ship.hp = target.hp; target.ship.shield = target.shield;
  return dmg;
}
function performAttack(b, attacker, target, weapon, opts) {
  const wdef = WEAPON_DEFS[weapon];
  if (b.zone === 'zeffel' && wdef.energy) { battleLog(`ゼッフル粒子域のため${wdef.name}は使用不可。`); return false; }
  if (attacker.cooldowns[weapon] > 0) { battleLog(`${wdef.name}は冷却中。`); return false; }
  if (!(opts && opts.ignoreRange) && !inRange(attacker, target, weapon)) { battleLog('射程外。'); return false; }
  // ステルス艦: 発砲すれば自ら位置を露呈し(クローキング解除)、狙われた側も探知される。
  const stealthAmbush = isCloakedNow(b, attacker);
  if (attacker.type === 'ST') attacker.cloaked = false;
  if (target.type === 'ST') target.cloaked = false;
  const admiral = admiralOfUnit(attacker);
  const traits = admiral ? admiral.traits : [];
  const isSiegeAttack = !!b.fortressDefender && b.fortressDefender !== attacker.faction;
  const defFleet = fleetOfUnit(target);
  const veteranAtk = !!(attacker.ship && attacker.ship.veteran);
  // 指揮巡洋艦(CC)の指揮ボーナス(2026-09-29(5回目)追加): 健在なら、その艦隊の提督特性による
  // 増減量を1.5倍に底上げする(Sins of a Solar Empireの旗艦アウラ、Sword of the Starsの
  // 指揮艦を翻案)。攻め手・受け手それぞれ自分の艦隊にCCがいるかどうかで別々に判定する。
  const atkFleet = fleetOfUnit(attacker);
  const cmdAmpAtk = (atkFleet && atkFleet.ships.some(s => s.alive && s.type === 'CC')) ? 1.5 : 1;
  const cmdAmpDef = (defFleet && defFleet.ships.some(s => s.alive && s.type === 'CC')) ? 1.5 : 1;
  // techAtkMul/techDefMul: 2026-09-29追加。開発(研究)の兵装/装甲Lv.による陣営全体の恒久ボーナス(command.js)。
  // stealthAmbush: 隠密状態からの初弾は、不意を突く一撃として威力+40%。
  let atkMul = formAtkMul(attacker.formation) * traitWeaponMul(traits, weapon, cmdAmpAtk) * traitWeaponMul(traits, 'atk', cmdAmpAtk) * moraleMulOf(b, attacker)
    * techAtkMul(attacker.faction) * (veteranAtk ? VETERAN_BONUS.atk : 1) * (stealthAmbush ? 1.4 : 1);
  if (isSiegeAttack) atkMul *= traitWeaponMul(traits, 'siege', cmdAmpAtk);
  // 恒星近傍: 恒星の放射エネルギーを利用できるビーム兵器のみ威力+15%。
  if (b.zone === 'star' && weapon === 'beam') atkMul *= 1.15;
  // 回廊(隘路): 先に布陣していた側(奇襲側)は、開戦第1ラウンドのみ攻撃力+30%(銀河英雄伝説のアムリッツァ回廊のような奇襲)。
  if (b.corridorDefender && b.turnNumber === 1 && attacker.faction === b.corridorDefender) atkMul *= 1.3;
  let defMul = formDefMul(target.formation) * traitDefenseMul(admiralOfUnit(target) ? admiralOfUnit(target).traits : [], cmdAmpDef) * techDefMul(target.faction);
  if (defFleet && defFleet.equip === 'shieldBooster') defMul *= 0.9;   // 特殊兵装: シールド増幅器
  const power = SHIPS[attacker.type][weapon] || 0;
  // 実弾・誘導兵器の回避率: 小惑星帯(小型艦のみ)・電子戦研究Lv.・ECMポッド・熟練艦、を積み増す。
  // 回廊(隘路)では艦を振る余地が無いため、回避の基礎値そのものを無効化する。
  let evadeBase = b.zone === 'corridor' ? 0 : wdef.evadeBase;
  if (b.zone !== 'corridor' && evadeBase > 0) {
    if (b.zone === 'asteroid' && !SHIPS[target.type].capital) evadeBase += 0.18;
    evadeBase += techEvadeBonus(target.faction);
    if (defFleet && defFleet.equip === 'ecmPod') evadeBase += 0.14;
    if (target.ship && target.ship.veteran) evadeBase += VETERAN_BONUS.evade;
    evadeBase = Math.min(0.9, evadeBase);
  }
  if (missileEvaded(SHIPS[target.type], target.formation, evadeBase)) {
    battleLog(`${SHIPS[target.type].name}は${wdef.name}を回避した。`); SND.se('kin', worldPosOf(target));
    // 特殊兵装「ECMポッド」発動演出(2026-09-29追加): ECMポッドが寄与した回避だけ、ジャミングの演出を出す
    if (defFleet && defFleet.equip === 'ecmPod') target.fxEcmAt = millis();
    if (wdef.cooldown) attacker.cooldowns[weapon] = wdef.cooldown; return true;
  }
  // 電離嵐: 全艦のシールド出力が半減するため、本来シールドで全減衰されるビーム兵器が相対的に通りやすくなる。
  const effShield = b.zone === 'ion' ? target.shield * 0.5 : target.shield;
  const dmg = computeDamage({ weapon, power, facing: 'front', shield: effShield, shieldPierce: wdef.shieldPierce, atkMul, defMul });
  applyDamageTo(target, dmg);
  // 特殊兵装「シールド増幅器」発動演出(2026-09-29追加): 被弾を軽減した艦にシールド閃光の演出を出す
  if (defFleet && defFleet.equip === 'shieldBooster') target.fxShieldAt = millis();
  battleLog(`${SHIPS[attacker.type].name}(${admiral ? admiral.name : '?'})の${wdef.name}が${SHIPS[target.type].name}に${dmg}ダメージ。`);
  SND.se(weapon === 'beam' ? 'shotB' : weapon === 'railgun' ? 'cannon' : weapon === 'torpedo' ? 'torpedo' : weapon === 'fighter' ? 'fighterLaunch' : 'missile', worldPosOf(attacker));
  if (admiral) admiral.merit += Math.round(dmg / 40);
  if (!target.alive) {
    battleLog(`${SHIPS[target.type].name}、撃沈。`); if (admiral) admiral.merit += 20;
    SND.se(SHIPS[target.type].capital ? 'bossBoom1' : 'boomM', worldPosOf(target)); rumble(0.5, 0.3, 150);
    // 熟練(軍事): 撃墜を重ねた艦は精鋭化し、以後永続的に攻撃+8%・回避+5%を得る(大戦略シリーズの熟練度システムを参考)。
    if (attacker.ship) {
      attacker.ship.kills = (attacker.ship.kills || 0) + 1;
      if (!attacker.ship.veteran && attacker.ship.kills >= VETERAN_KILLS) {
        attacker.ship.veteran = true;
        battleLog(`${SHIPS[attacker.type].name}、実戦経験を積み精鋭化した。`);
      }
    }
  } else SND.se('hit', worldPosOf(target));
  if (wdef.cooldown) attacker.cooldowns[weapon] = wdef.cooldown;
  return true;
}
// SND.se()の位置引数(左右パン)用: ヘックス盤上の位置を、左(-1)〜右(+1)の疑似座標に変換するだけの簡易版。
function worldPosOf(u) { return [(u.col / BOARD_W) * 2 - 1, 0, 3000]; }

// 一斉斉射(アルファストライク、2026-09-29追加): 今使える全兵装を同時に1目標へ叩き込む強力な一撃。
// Stellarisの「射程内側から全短射程兵装を同時発射し反撃の間を与えない」戦術、大戦略の集中砲撃を参考にした。
// 代償として、発射した全兵装が2ターン過熱し使用不可になる(通常のperformAttackの冷却を上書きする形で一括設定)。
// opts.ignoreRange: 自動観戦シネマ(cinema.js)はヘックスの射程を扱わないため、そちらから呼ぶ時に使う。
// 戻り値は実際に発射できた武器のID一覧(シネマ側が光条エフェクトを武器ごとに出し分けるため)。
function performAlphaStrike(b, attacker, target, opts) {
  const ignoreRange = !!(opts && opts.ignoreRange);
  const weapons = getAvailableWeapons(b, attacker).filter(w => ignoreRange || inRange(attacker, target, w));
  if (!weapons.length) { battleLog('斉射: 使える兵装が無い。'); return []; }
  battleLog(`${SHIPS[attacker.type].name}、${weapons.length}種の兵装で一斉斉射!`);
  const fired = [];
  for (const w of weapons) { if (!target.alive) break; if (performAttack(b, attacker, target, w, opts)) fired.push(w); }
  for (const w of WEAPON_ORDER) if ((SHIPS[attacker.type][w] || 0) > 0) attacker.cooldowns[w] = 2;
  return fired;
}

// 強襲揚陸艦(MA)による鹵獲(2026-09-29(5回目)追加。Master of Orion/Homeworld2の「シールドを
// 落として拿捕する」ボーディング機構を翻案)。シールドが尽き、かつ耐久が半分未満に落ちた艦だけが対象。
function boardableTarget(u) { return u.alive && u.shield <= 0 && u.hp / u.maxHp < 0.5; }
function performBoarding(b, attacker, target, opts) {
  if (attacker.type !== 'MA') { battleLog('強襲揚陸艦でなければ強襲できない。'); return false; }
  if (attacker.cooldowns.board > 0) { battleLog('強襲部隊は再編成中。'); return false; }
  if (!(opts && opts.ignoreRange) && hexDist(attacker, target) > BOARDING_RANGE) { battleLog('強襲は接舷が必要(近接のみ)。'); return false; }
  if (!boardableTarget(target)) { battleLog('目標はまだ強襲できる状態ではない(シールド残存、または損傷が浅い)。'); return false; }
  attacker.cooldowns.board = 2;
  const hpFrac = target.hp / target.maxHp;
  // 成功率: 損傷が深いほど、また対象が小型艦であるほど高い(大型艦は制圧に手間取る)。
  const chance = Math.max(0.1, Math.min(0.75, 0.15 + (1 - hpFrac) * 0.5 - (SHIPS[target.type].capital ? 0.15 : 0)));
  const captured = Math.random() < chance;
  if (captured) {
    // 鹵獲成功: 目標の実体(strategic層のship)を、防衛側艦隊からこちらの艦隊へ丸ごと移す。
    // 今回の会戦の場からは(撃沈と同様に)姿を消すが、生存フラグは立てたままにするので、
    // 次の会戦からは自軍の戦力として使える(Master of Orionの「本国で解体するまでは使えない」を、
    // 「次の会戦から使える」という形に単純化して翻案)。
    const defFleet = fleetOfUnit(target), atkFleet = fleetOfUnit(attacker);
    if (defFleet && atkFleet && target.ship) {
      defFleet.ships = defFleet.ships.filter(s => s !== target.ship);
      target.ship.alive = true;
      atkFleet.ships.push(target.ship);
    }
    target.alive = false;
    battleLog(`${SHIPS[attacker.type].name}、${SHIPS[target.type].name}への強襲に成功。鹵獲した!`);
    SND.se('ok', worldPosOf(target));
    const adm = admiralOfUnit(attacker); if (adm) adm.merit += 25;
  } else {
    battleLog(`${SHIPS[attacker.type].name}の強襲は撃退された。`);
    SND.se('kin', worldPosOf(target));
  }
  return { attempted: true, captured };
}

function fireFortressGun(b) {
  const defenderFaction = b.fortressDefender;
  const enemies = pickableTargets(b, unitsOfSide(b, defenderFaction === b.playerFaction ? b.aiFaction : b.playerFaction));
  if (!enemies.length) return;
  const target = enemies.reduce((best, u) => (u.hp + u.shield > best.hp + best.shield ? u : best), enemies[0]);
  const defFleet = fleetOfUnit(target);
  let defMul = formDefMul(target.formation) * techDefMul(target.faction);
  if (defFleet && defFleet.equip === 'shieldBooster') defMul *= 0.9;
  const beforeAlive = target.alive;
  const dmg = computeDamage({ weapon: 'beam', power: FORTRESS_GUN.power, facing: 'front', shield: target.shield, shieldPierce: WEAPON_DEFS.beam.shieldPierce, atkMul: 1, defMul });
  applyDamageTo(target, dmg);
  if (defFleet && defFleet.equip === 'shieldBooster') target.fxShieldAt = millis();
  battleLog(`要塞主砲、${SHIPS[target.type].name}に${dmg}の巨弾を叩き込む。`);
  SND.se('cannon', worldPosOf(target));
  // 要塞主砲の発射演出(2026-09-29追加): シネマ画面向けに、砲そのもの(ユニットではない)を発射源とする
  // 専用fxを積む。艦のuidの代わりにfortressFaction(防衛側の陣営)を発射源として持たせ、
  // 描画側(sketch.js)で防衛側の陣形の奥に固定した砲台位置から発射されたように描く。
  if (b.cineFx) b.cineFx.push({ fortressFaction: defenderFaction, to: target.uid, weapon: 'fortress', t: 0, hit: beforeAlive && !target.alive ? 'kill' : 'hit' });
}

function applyZoneTick(b) {
  if (b.zone === 'gravity') {
    // 重力の変化: ブラックホールの事象の地平面に近いため、ラウンドが進む(=潮汐力に晒される時間が延びる)ほど被害が増す。
    const rate = 0.03 + Math.min(0.06, b.turnNumber * 0.005);
    for (const u of b.units) {
      if (!u.alive || !SHIPS[u.type].capital) continue;
      const dmg = Math.round(u.maxHp * rate);
      applyDamageTo(u, dmg);
      battleLog(`重力嵐(ブラックホールの潮汐力)の継続被害で${SHIPS[u.type].name}に${dmg}ダメージ。`);
    }
  } else if (b.zone === 'asteroid') {
    for (const u of b.units) {
      if (!u.alive || !SHIPS[u.type].capital) continue;
      const dmg = Math.round(u.maxHp * 0.015);
      applyDamageTo(u, dmg);
      battleLog(`小惑星帯との接触の継続被害で${SHIPS[u.type].name}に${dmg}ダメージ。`);
    }
  } else if (b.zone === 'star') {
    // 恒星近傍: 大型・小型を問わず、恒星の熱線・放射線で全艦がわずかに被害を受け続ける。
    for (const u of b.units) {
      if (!u.alive) continue;
      const dmg = Math.round(u.maxHp * 0.01);
      applyDamageTo(u, dmg);
      battleLog(`恒星の放射熱で${SHIPS[u.type].name}に${dmg}ダメージ。`);
    }
  }
}

function checkBattleEnd(b) {
  const pAlive = unitsOfSide(b, b.playerFaction).length, aAlive = unitsOfSide(b, b.aiFaction).length;
  if (pAlive === 0 || aAlive === 0 || b.turnNumber > BATTLE_TURN_LIMIT) {
    if (pAlive === 0 && aAlive === 0) b.winner = 'draw';
    else if (pAlive === 0) b.winner = b.aiFaction;
    else if (aAlive === 0) b.winner = b.playerFaction;
    else {
      const pHp = unitsOfSide(b, b.playerFaction).reduce((s, u) => s + u.hp + u.shield, 0);
      const aHp = unitsOfSide(b, b.aiFaction).reduce((s, u) => s + u.hp + u.shield, 0);
      b.winner = pHp >= aHp ? b.playerFaction : b.aiFaction;
    }
    return true;
  }
  return false;
}

// ---------- プレイヤー操作 ----------
function battleCancel() {
  const b = GAME.activeBattle;
  if (b.mode === 'move' || b.mode === 'attackWeapon' || b.mode === 'attackTarget') { b.mode = 'select'; b.selectedUid = null; b.reachable = []; b.attackTargets = []; }
}
function battleConfirm() {
  const b = GAME.activeBattle;
  const cur = unitAt(b, b.cursor.col, b.cursor.row);
  if (b.mode === 'select') {
    if (cur && cur.faction === b.playerFaction && !cur.acted) { b.selectedUid = cur.uid; b.mode = 'move'; b.reachable = reachableHexes(b, cur); }
  } else if (b.mode === 'move') {
    const sel = b.units.find(u => u.uid === b.selectedUid);
    const canMoveHere = b.reachable.some(h => h.col === b.cursor.col && h.row === b.cursor.row) || (sel.col === b.cursor.col && sel.row === b.cursor.row);
    if (canMoveHere) { sel.col = b.cursor.col; sel.row = b.cursor.row; b.mode = 'attackWeapon'; b.reachable = []; }
  } else if (b.mode === 'attackWeapon') {
    // 陣形ボタンで武器を巡回できる(battleToggleWeapon)。ここでは既定で威力最大の武器を選ぶ。
    const sel = b.units.find(u => u.uid === b.selectedUid);
    b.availableWeapons = getAvailableWeapons(b, sel);
    if (!b.availableWeapons.length) { sel.acted = true; b.mode = 'select'; b.selectedUid = null; return; }
    // 兵装選択は既定で威力最大のものにする(一斉斉射=alphaは、陣形ボタンでの巡回時にのみ選べる。battleToggleWeapon参照)。
    const weapon = b.availableWeapons.includes(b.pendingWeapon) ? b.pendingWeapon : b.availableWeapons[0];
    b.pendingWeapon = weapon;
    b.attackTargets = weaponTargetsFor(b, sel, weapon);
    if (!b.attackTargets.length) { sel.acted = true; b.mode = 'select'; b.selectedUid = null; } else b.mode = 'attackTarget';
  } else if (b.mode === 'attackTarget') {
    const sel = b.units.find(u => u.uid === b.selectedUid);
    const target = unitAt(b, b.cursor.col, b.cursor.row);
    if (target && b.attackTargets.includes(target)) {
      if (b.pendingWeapon === 'alpha') performAlphaStrike(b, sel, target);
      else if (b.pendingWeapon === 'board') performBoarding(b, sel, target);
      else performAttack(b, sel, target, b.pendingWeapon);
      sel.acted = true; b.mode = 'select'; b.selectedUid = null; b.attackTargets = [];
      if (checkBattleEnd(b)) return;
    }
  }
}
// weapon==='alpha'(一斉斉射)の場合は、今使える兵装のうち最も射程の長いものを基準に対象を絞る
// (実際にどの兵装が届くかはperformAlphaStrike側で兵装ごとに再判定する)。
// weapon==='board'(強襲、2026-09-29(5回目)追加)の場合は、接舷距離内かつ強襲可能な状態の艦だけに絞る。
function weaponTargetsFor(b, sel, weapon) {
  const enemies = unitsOfSide(b, sel.faction === b.playerFaction ? b.aiFaction : b.playerFaction);
  if (weapon === 'alpha') {
    const maxRange = Math.max(...(b.availableWeapons || []).map(w => WEAPON_DEFS[w].range));
    return enemies.filter(t => hexDist(sel, t) <= maxRange);
  }
  if (weapon === 'board') return enemies.filter(t => boardableTarget(t) && hexDist(sel, t) <= BOARDING_RANGE);
  return enemies.filter(t => inRange(sel, t, weapon));
}
function battleToggleWeapon() {
  const b = GAME.activeBattle;
  if (b.mode !== 'attackWeapon' && b.mode !== 'attackTarget') return;
  const sel = b.units.find(u => u.uid === b.selectedUid);
  const base = b.availableWeapons && b.availableWeapons.length ? b.availableWeapons : [b.pendingWeapon];
  let list = base.length >= 2 ? [...base, 'alpha'] : base;   // 一斉斉射(alpha)は、実兵装が2種以上ある時だけ選べる
  if (sel && sel.type === 'MA') list = [...list, 'board'];   // 強襲(board)は強襲揚陸艦だけが選べる
  const i = list.indexOf(b.pendingWeapon);
  b.pendingWeapon = list[(i + 1) % list.length];
  if (b.mode === 'attackTarget') {
    const sel = b.units.find(u => u.uid === b.selectedUid);
    b.attackTargets = weaponTargetsFor(b, sel, b.pendingWeapon);
  }
}
function battleMoveCursor(dcol, drow) {
  const b = GAME.activeBattle;
  b.cursor.col = Math.max(0, Math.min(BOARD_W - 1, b.cursor.col + dcol));
  b.cursor.row = Math.max(0, Math.min(BOARD_H - 1, b.cursor.row + drow));
}
function battleEndPlayerTurn() {
  const b = GAME.activeBattle;
  for (const u of unitsOfSide(b, b.playerFaction)) u.acted = true;
}

// ---------- ターン進行(毎フレーム呼び出し。ai/自動処理を進める) ----------
let aiTickTimer = 0;
function tickCooldowns(u) { for (const w in u.cooldowns) if (u.cooldowns[w] > 0) u.cooldowns[w]--; }
function resetTurn(units) { for (const u of units) { u.acted = false; tickCooldowns(u); } }
function updateBattle(dt) {
  const b = GAME.activeBattle; if (!b) return;
  const pUnits = unitsOfSide(b, b.playerFaction), aUnits = unitsOfSide(b, b.aiFaction);
  const playerDone = pUnits.every(u => u.acted) || pUnits.length === 0;
  if (b.side === 'player') {
    if (playerDone) { b.side = 'ai'; aiTickTimer = 0; resetTurn(aUnits); }
    return;
  }
  // AI手番: 少し間隔を空けて1体ずつ行動(演出のため)
  aiTickTimer += dt;
  if (aiTickTimer < 0.35) return; aiTickTimer = 0;
  const actor = aUnits.find(u => !u.acted);
  if (!actor) {
    applyZoneTick(b);
    if (b.fortressDefender === b.aiFaction) { b.fortressCharge++; if (b.fortressCharge >= FORTRESS_GUN.chargeTurns) { fireFortressGun(b); b.fortressCharge = 0; } }
    if (checkBattleEnd(b)) return;
    b.turnNumber++;
    if (b.fortressDefender === b.playerFaction) { b.fortressCharge++; if (b.fortressCharge >= FORTRESS_GUN.chargeTurns) { fireFortressGun(b); b.fortressCharge = 0; if (checkBattleEnd(b)) return; } }
    b.side = 'player'; resetTurn(pUnits);
    return;
  }
  aiActOne(b, actor, pUnits);
}
function aiActOne(b, actor, targets) {
  const alive = pickableTargets(b, targets.filter(u => u.alive));
  if (!alive.length) { actor.acted = true; return; }
  alive.sort((a, c) => hexDist(actor, a) - hexDist(actor, c));
  const nearest = alive[0];
  // 強襲揚陸艦(MA)は、接舷距離内に強襲できる状態の艦があれば優先して強襲を試みる。
  if (actor.type === 'MA' && !(actor.cooldowns.board > 0)) {
    const boardTarget = alive.find(t => boardableTarget(t) && hexDist(actor, t) <= BOARDING_RANGE);
    if (boardTarget) { performBoarding(b, actor, boardTarget); actor.acted = true; return; }
  }
  const weapons = getAvailableWeapons(b, actor);
  const weapon = weapons.find(w => inRange(actor, nearest, w));
  // 複数の兵装が射程内にあるとき、AIも時おり一斉斉射(アルファストライク)で大打撃を狙う。
  if (weapon && weapons.filter(w => inRange(actor, nearest, w)).length >= 2 && Math.random() < 0.25) { performAlphaStrike(b, actor, nearest); actor.acted = true; return; }
  if (weapon) { performAttack(b, actor, nearest, weapon); actor.acted = true; return; }
  const reach = reachableHexes(b, actor);
  if (reach.length) {
    reach.sort((h1, h2) => hexDist(h1, nearest) - hexDist(h2, nearest));
    actor.col = reach[0].col; actor.row = reach[0].row;
  }
  actor.acted = true;
}

if (typeof module !== 'undefined') module.exports = {
  startNextBattle, unitAt, unitsOfSide, reachableHexes, getAvailableWeapons, performAttack, performAlphaStrike, isCloakedNow, pickableTargets,
  fireFortressGun, applyZoneTick, unitSupply, moraleMulOf,
  checkBattleEnd, battleCancel, battleConfirm, battleToggleWeapon, battleMoveCursor, battleEndPlayerTurn, updateBattle,
};
