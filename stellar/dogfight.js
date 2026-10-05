// ---------- STELLAR HEGEMONY ― 銀河覇権: ドッグファイト演出(艦載機同士の交戦) ----------
// 資料.txt 4章「DogfightScene」: Canvas APIでの演出。CVを持つ艦隊が交戦した際、
// 開戦前に自動解決(艦載機火力 vs 迎撃力の差分が、突破機数として本隊に直接ダメージ)し、
// その過程を短いアニメーションで見せる。決定ボタンで演出を早送り(スキップ)できる。

function startDogfight(playerFleet, aiFleet, b) {
  const hasCV = fleet => fleet.ships.some(s => s.alive && s.type === 'CV');
  const active = hasCV(playerFleet) || hasCV(aiFleet);
  b.dogfight = { active, t: 0, dur: 2.4, particles: [], resolved: false, skip: false };
  if (!active) { finishDogfight(b); return; }
  const n = 36;
  for (let i = 0; i < n; i++) b.dogfight.particles.push({ side: 'player', x: -20, y: Math.random() * 420 + 100, vx: 260 + Math.random() * 90, vy: (Math.random() - 0.5) * 50 });
  for (let i = 0; i < n; i++) b.dogfight.particles.push({ side: 'ai', x: 1300, y: Math.random() * 420 + 100, vx: -(260 + Math.random() * 90), vy: (Math.random() - 0.5) * 50 });
}
function skipDogfight() { const b = GAME.activeBattle; if (b && b.dogfight) b.dogfight.skip = true; }
function updateDogfight(dt) {
  const b = GAME.activeBattle; if (!b || !b.dogfight || b.dogfight.resolved) return;
  const d = b.dogfight; d.t += dt;
  for (const p of d.particles) { p.x += p.vx * dt; p.y += p.vy * dt; }
  if (d.t >= d.dur || d.skip) finishDogfight(b);
}
function fighterStatSum(fleet, stat, traitKey) {
  const adm = fleet.admiral, traits = adm ? adm.traits : [];
  return fleet.ships.filter(s => s.alive).reduce((sum, s) => sum + (SHIPS[s.type][stat] || 0), 0) * traitWeaponMul(traits, traitKey);
}
function applyBreakthrough(b, targetFaction, dmg) {
  if (dmg <= 0) return;
  const targets = unitsOfSide(b, targetFaction).filter(u => SHIPS[u.type].capital);
  if (!targets.length) return;
  const t = targets[Math.floor(Math.random() * targets.length)];
  applyDamageTo(t, dmg);
  battleLog(`艦載機隊の突破により${SHIPS[t.type].name}に${dmg}ダメージ。`);
  SND.se('missile'); rumble(0.3, 0.2, 100);
}
function finishDogfight(b) {
  if (!b.dogfight) b.dogfight = { active: false };
  if (b.dogfight.resolved) return;
  b.dogfight.resolved = true;
  if (b.dogfight.active) {
    const playerFleet = GAME.fleets.find(f => f.id === b.playerFleetId), aiFleet = GAME.fleets.find(f => f.id === b.aiFleetId);
    const pFighter = fighterStatSum(playerFleet, 'fighter', 'fighter'), pIntercept = fighterStatSum(playerFleet, 'intercept', 'intercept');
    const aFighter = fighterStatSum(aiFleet, 'fighter', 'fighter'), aIntercept = fighterStatSum(aiFleet, 'intercept', 'intercept');
    const breakToPlayer = Math.max(0, Math.round((aFighter - pIntercept) / 8));
    const breakToAi = Math.max(0, Math.round((pFighter - aIntercept) / 8));
    applyBreakthrough(b, b.playerFaction, breakToPlayer);
    applyBreakthrough(b, b.aiFaction, breakToAi);
    checkBattleEnd(b);
  }
  GAME.phase = 'battle';
}

function drawDogfight(W, H) {
  const b = GAME.activeBattle; if (!b || !b.dogfight) return;
  push(); background(4, 8, 16);
  noStroke(); fill(180, 220, 255); textAlign(CENTER, CENTER); textSize(22);
  text('艦載機隊、交戦中…', W / 2, 46);
  textSize(13); fill(150, 180, 200); text('(決定ボタンでスキップ)', W / 2, 74);
  for (const p of b.dogfight.particles) {
    const col = p.side === 'player' ? FACTION[b.playerFaction].colorRgb : FACTION[b.aiFaction].colorRgb;
    stroke(col[0], col[1], col[2], 230); strokeWeight(2);
    line(p.x - p.vx * 0.02, p.y - p.vy * 0.02, p.x, p.y);
  }
  pop();
}

if (typeof module !== 'undefined') module.exports = { startDogfight, updateDogfight, skipDogfight, drawDogfight, finishDogfight };
