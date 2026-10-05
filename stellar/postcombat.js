// ---------- STELLAR HEGEMONY ― 銀河覇権: 論功行賞・戦後処理 ----------

function promoteIfNeeded(admiral, summary) {
  while (admiral.rank < RANKS.length - 1 && admiral.merit >= RANKS[admiral.rank].cap) {
    admiral.merit -= RANKS[admiral.rank].cap;
    admiral.rank++;
    summary.push(`${admiral.name}、${RANKS[admiral.rank].name}に昇進。`);
    SND.se('coin');
  }
}
function admiralFate(admiral, summary) {
  // 撃滅された艦隊の提督: 忠誠度が高いほど脱出、低いほど捕虜、稀に戦死。
  const roll = Math.random() * 100;
  if (admiral.loyalty < 35 && Math.random() < 0.4) {
    admiral.status = 'defected';
    summary.push(`${admiral.name}提督、敵陣営へ亡命した。`);
    return 'defected';
  }
  if (roll < 55) { admiral.status = 'active'; summary.push(`${admiral.name}提督、辛くも脱出。`); return 'escaped'; }
  if (roll < 90) { admiral.status = 'captured'; summary.push(`${admiral.name}提督、捕虜となった。`); return 'captured'; }
  admiral.status = 'dead'; summary.push(`${admiral.name}提督、戦死。`); return 'dead';
}
// 撃滅されていない(艦は残っている)劣勢艦隊の提督向け: 生死・捕虜は問わず、亡命のみ判定する。
function admiralDefectionCheck(admiral, summary) {
  if (admiral.loyalty < 35 && Math.random() < 0.25) {
    admiral.status = 'defected';
    summary.push(`${admiral.name}提督、敵陣営へ亡命した。`);
    return 'defected';
  }
  return null;
}

function resolvePostCombat(b) {
  if (!b.winner) { b.summary = []; b.resolved = true; return; } // 本来は勝敗が付いてから呼ばれる想定。念のための保険。
  const summary = [];
  const playerFleet = GAME.fleets.find(f => f.id === b.playerFleetId);
  const aiFleet = GAME.fleets.find(f => f.id === b.aiFleetId);
  for (const fleet of [playerFleet, aiFleet]) {
    if (!fleet) continue;
    const won = b.winner === fleet.faction;
    if (won) promoteIfNeeded(fleet.admiral, summary);
    if (!fleetAlive(fleet)) {
      summary.push(`${FACTION[fleet.faction].short}艦隊(${fleet.admiral.name})、壊滅。`);
      admiralFate(fleet.admiral, summary);
    } else if (!won && b.winner !== 'draw') {
      fleet.admiral.loyalty = Math.max(0, fleet.admiral.loyalty - 8);
      if (fleet.admiral.loyalty < 35) {
        const outcome = admiralDefectionCheck(fleet.admiral, summary);
        if (outcome === 'defected') fleet.ships = []; // 亡命した提督は艦を置いて去る(艦隊は解散扱い)
      }
    }
  }
  if (b.winner !== 'draw') {
    // 地上侵攻(2026-09-29(6回目)追加): 無人宙域(neutral)は会戦勝利=占領で変わらないが、
    // 他陣営が領有する星系は、会戦に勝っても制宙権を握るだけで即座には占領できない。
    // 実際の占領は、勝った側が強襲揚陸艦(MA)を伴ってこの星系に留まり続け、starmap.jsの
    // tickInvasionsが防衛度(garrison)を削りきった時に成立する。
    const sys = systemById(b.systemId);
    if (sys.owner !== b.winner) {
      if (sys.owner === 'neutral') {
        sys.owner = b.winner;
        summary.push(`${systemNameOf(b.systemId)}、${FACTION[b.winner].short}の占領下に入った。`);
      } else {
        summary.push(`${systemNameOf(b.systemId)}の制宙権を、${FACTION[b.winner].short}が握った。占領には地上侵攻(強襲揚陸艦)が必要。`);
      }
    }
  }
  GAME.fleets = GAME.fleets.filter(f => fleetAlive(f) || f.admiral.status === 'active');
  for (const f of GAME.fleets) if (fleetAlive(f)) f.ships = f.ships.filter(s => s.alive);
  b.summary = summary;
  b.resolved = true;
  GAME.phase = 'postCombat';
  for (const line of summary) pushLog(line);
}
function finishPostCombat() {
  // 2026-09-29(8回目)修正: startNextBattleは、キュー内の会戦の参加艦隊が既に(同ターンの別の会戦で)
  // 全滅済みだと何もせず戻る(GAME.activeBattleがnullのまま)。従来は1回しか呼ばず戻っていたため、
  // その場合GAME.phaseが'postCombat'のままGAME.activeBattle=nullという不整合な状態になり、
  // 次フレームのdraw()が`GAME.activeBattle.resolved`でクラッシュしていた(AIの艦隊行動を強化し、
  // 1ターンに複数の会戦が積まれるようになって初めて顕在化した)。無効な会戦をすべて読み飛ばし、
  // 有効な会戦が見つかるかキューが尽きるまで繰り返すよう修正。
  GAME.activeBattle = null;
  while (GAME.battleQueue.length && !GAME.activeBattle) startNextBattle();
  if (!GAME.activeBattle) { GAME.phase = 'strategy'; checkCampaignVictory(); }
}

if (typeof module !== 'undefined') module.exports = { resolvePostCombat, finishPostCombat, promoteIfNeeded, admiralFate, admiralDefectionCheck };
