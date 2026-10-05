// ---------- STELLAR HEGEMONY ― 銀河覇権: 自動観戦シネマ(戦術戦を、両陣営ともAIに任せて映像として見る) ----------
// ユーザー要望(2026-09-27): 「戦闘開始したら…戦闘の映像に流れるようにしてほしい。それかAIで両方の戦闘が始まるように」
// 実際のダメージ計算・武器・要塞主砲・特殊環境は hexbattle.js の同じ関数(performAttack等)をそのまま使う。
// ヘックスの移動・射程判定だけ省略し(全員が常に交戦可能とみなす)、artistic license で艦隊戦の映像として描く。

function toggleBattleCinema() {
  const b = GAME.activeBattle; if (!b) return;
  b.cinemaMode = !b.cinemaMode;
  SND.se('ok');
}

// 弱っている艦から狙う(集中攻撃)簡易AI。射程・移動はシネマでは扱わないため、常に射程内とみなす。
// ステルス艦(cloaked)は、発砲か被弾で探知されるまで対象から除外する(pickableTargets、hexbattle.js)。
function cinemaActOne(b, actor, enemies) {
  const alive = pickableTargets(b, enemies.filter(u => u.alive));
  if (!alive.length) { actor.acted = true; return; }
  // 強襲揚陸艦(MA、2026-09-29(5回目)追加): 強襲できる状態の艦がいれば優先して強襲を試みる。
  if (actor.type === 'MA' && !(actor.cooldowns.board > 0)) {
    const boardTarget = alive.find(boardableTarget);
    if (boardTarget) {
      const captured = performBoarding(b, actor, boardTarget, { ignoreRange: true });
      b.cineFx.push({ from: actor.uid, to: boardTarget.uid, weapon: 'board', t: 0, hit: captured && captured.captured ? 'capture' : 'repelled' });
      actor.acted = true;
      return;
    }
  }
  const weapons = getAvailableWeapons(b, actor);
  if (!weapons.length) { actor.acted = true; return; }
  alive.sort((a, c) => (a.hp + a.shield) - (c.hp + c.shield));
  const target = alive[0];
  const beforeAlive = target.alive;
  // 兵装が2種以上あるときは、時おり一斉斉射(アルファストライク)で大打撃を狙う。
  if (weapons.length >= 2 && Math.random() < 0.18) {
    const fired = performAlphaStrike(b, actor, target, { ignoreRange: true });
    for (const w of fired) b.cineFx.push({ from: actor.uid, to: target.uid, weapon: w, t: 0, hit: beforeAlive && !target.alive ? 'kill' : 'hit' });
    actor.acted = true;
    return;
  }
  const weapon = weapons[0];
  performAttack(b, actor, target, weapon, { ignoreRange: true }); // シネマでは移動を扱わないため、射程判定を無視して常に交戦させる
  b.cineFx.push({ from: actor.uid, to: target.uid, weapon, t: 0, hit: beforeAlive && !target.alive ? 'kill' : 'hit' });
  actor.acted = true;
}
function tickCineFx(b, dt) {
  if (!b.cineFx) { b.cineFx = []; return; }
  for (const fx of b.cineFx) fx.t += dt;
  b.cineFx = b.cineFx.filter(fx => fx.t < 0.5);
}

// hexbattle.jsのupdateBattle()と同じ手番の運び方(側の交代・要塞主砲・特殊環境)を踏襲し、
// 「移動して射程に入る」の代わりに、両陣営ともcinemaActOneで直接行動させる。
let cinemaTickTimer = 0;
function updateBattleCinema(dt) {
  const b = GAME.activeBattle; if (!b || !b.cinemaMode) return;
  tickCineFx(b, dt);
  const pUnits = unitsOfSide(b, b.playerFaction), aUnits = unitsOfSide(b, b.aiFaction);
  // 艦数が多いほど1行動あたりの間隔を詰める(大艦隊でも、会戦が間延びしないように)
  cinemaTickTimer += dt; if (cinemaTickTimer < Math.max(0.2, 0.5 - 0.013 * (pUnits.length + aUnits.length))) return; cinemaTickTimer = 0;
  if (b.side === 'player') {
    const actor = pUnits.find(u => !u.acted);
    if (!actor) { b.side = 'ai'; resetTurn(aUnits); return; }
    cinemaActOne(b, actor, aUnits);
    checkBattleEnd(b);
    return;
  }
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
  cinemaActOne(b, actor, pUnits);
  checkBattleEnd(b);
}

if (typeof module !== 'undefined') module.exports = { toggleBattleCinema, cinemaActOne, updateBattleCinema, tickCineFx };
