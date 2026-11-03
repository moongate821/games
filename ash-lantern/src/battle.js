'use strict';
/* 戦闘(複数の味方・複数の敵・技・行動順)。
   ■ データ表(ALLIES / ENEMIES / SKILLS)を書き足すだけで、仲間・敵・技を増やせる。
   ■ 1ラウンド = 味方全員がコマンドを選ぶ → 素早さ(spd)の高い順に味方も敵も行動。
   ■ ダメージ = max(1, 攻撃 - 防御)。強攻撃 = round(攻撃×1.6) - 防御。防御中は最終値を半分(切り上げ・最小1)。
   ■ 序章の灰狼戦(アレン1人 vs 灰狼)は、従来と同じ数値・同じ文言・同じコマンド順(攻撃/防御/道具)。技を持つ仲間がいるときだけ「技」が出る。 */
const SKILLS = {
  heal: { name: 'ヒール', mp: 4, target: 'ally', kind: 'heal', power: 25 },
  light: { name: 'ひかり', mp: 3, target: 'enemy', kind: 'magic', power: 14 },
  rain: { name: 'あめのうた', mp: 6, target: 'allEnemies', kind: 'magic', power: 9 }
};
const ALLIES = {
  allen: { name: 'アレン', mhp: 50, mmp: 0, atk: 10, def: 4, spd: 10, skills: [], sprite: 'allen' },
  mira: { name: 'ミラ', mhp: 42, mmp: 12, atk: 6, def: 3, spd: 9, skills: ['heal', 'light', 'rain'], portrait: 'battle_mira' }
};
const ENEMIES = {   // size = 画面に出す横幅(px)。pattern: n=通常 / tele=身構え(予告) / strong=強攻撃
  ash_wolf: { name: '灰狼', img: 'enemy_wolf', mhp: 55, atk: 13, def: 2, spd: 8, size: 359, pattern: ['n', 'n', 'tele', 'strong'] },
  river_slime: { name: '川スライム', img: 'enemy_slime', mhp: 28, atk: 9, def: 1, spd: 6, size: 190, pattern: ['n', 'n', 'n'] },
  bridge_beast: { name: '橋の灰獣', img: 'enemy_crab', mhp: 80, atk: 13, def: 3, spd: 7, size: 440, pattern: ['n', 'n', 'tele', 'strong'] },
  cave_bat: { name: '洞窟コウモリ', img: 'enemy_bat', mhp: 20, atk: 8, def: 0, spd: 12, size: 190, pattern: ['n', 'n', 'n'] }
};
const ALLY_POS = { 1: [[195, 355]], 2: [[115, 355], [260, 355]], 3: [[75, 355], [195, 355], [315, 355]], 4: [[65, 355], [155, 355], [245, 355], [335, 355]] };
// 左側の味方・右側のステータスに敵の顔が隠れない配置。
const ENEMY_POS = { 1: [[710, 345]], 2: [[610, 345], [810, 345]], 3: [[525, 345], [675, 345], [825, 345]] };

/* フラグで解放される技。once=1戦闘に1回(MPを使わない)。例: 第7章「ガルドの教え」(c7_bond) */
const SKILL_UNLOCKS = [{ flag: 'c7_bond', who: 'allen', skill: 'gardo_teaching' }];
/* 成長(S.lv)で覚える技。ALLIES[id].learn = {必要なlv:[技ID...]}。ミラは下の表(章データ側の仲間は learn を持つ) */
const LEARN = { mira: { 3: ['light_plus'], 4: ['heal_plus'], 5: ['rain_plus'], 7: ['light_max'], 8: ['heal_max'], 9: ['rain_max'], 11: ['light_ex'], 12: ['heal_ex'] } };
function skillsOf(id, lv) {   // 基本の技+成長で覚えた技+フラグで解放された技
  const d = ALLIES[id], L = d.learn || LEARN[id] || {}, out = d.skills.slice(); lv = lv == null ? (S.lv || 0) : lv;
  for (const n of Object.keys(L).map(Number).sort((a, b) => a - b)) if (lv >= n) for (const s of L[n]) if (SKILLS[s] && !out.includes(s)) out.push(s);
  for (const u of SKILL_UNLOCKS) if (u.who === id && S.flags && S.flags[u.flag] && SKILLS[u.skill] && !out.includes(u.skill)) out.push(u.skill);
  return out;
}
function nextLearn(id) {   // 次に覚える技 [lv, 技ID] (無ければ null)
  const d = ALLIES[id], L = d.learn || LEARN[id] || {}, lv = S.lv || 0;
  for (const n of Object.keys(L).map(Number).sort((a, b) => a - b)) if (n > lv) return [n, L[n][0]];
  return null;
}
function mkAlly(id) {
  const d = ALLIES[id], s = statsOf(id);
  return { side: 'ally', id, name: d.name, mhp: mhpOf(id), mmp: mmpOf(id), hp: mhpOf(id), mp: mmpOf(id), atk: s.atk, def: s.def, spd: s.spd, skills: skillsOf(id), used: {}, cast: 0, sprite: d.sprite, portrait: d.portrait, lunge: 0, flash: 0, defending: false };
}
function mkEnemy(id) {
  const d = ENEMIES[id];
  return { side: 'enemy', id, name: d.name, img: d.img, fallback: d.fallback, mhp: d.mhp, hp: d.mhp, atk: d.atk, def: d.def, spd: d.spd, size: d.size, pattern: d.pattern, step: 0, pose: false, dead: false, fade: 0, flash: 0, x: 0 };
}
const MAX_PARTY = 4;   // 戦闘に出る味方は最大4人(アレン+仲間3人。それ以外は控え)
function partyForBattle() {   // アレンは S.hp/S.mhp、他の仲間は S.allies に保存してある
  const a = mkAlly('allen'); a.hp = S.hp; a.mhp = S.mhp; const list = [a];
  for (const m of (S.allies || [])) { if (list.length >= MAX_PARTY) break; const c = mkAlly(m.id); c.hp = m.hp; c.mp = m.mp; list.push(c); }
  return list;
}
function syncParty(list) { S.hp = list[0].hp; (S.allies || []).forEach((m, i) => { const c = list[i + 1]; if (c) { m.hp = c.hp; m.mp = c.mp; } }); }
function snapshot() { return JSON.stringify({ hp: S.hp, items: S.items, allies: S.allies || [] }); }
const usableItems = () => Object.keys(ITEMS).filter(k => (ITEMS[k].hp || ITEMS[k].mp) && (S.items[k] || 0) > 0);

async function runBattle(enemyIds) {
  enemyIds = enemyIds || ['ash_wolf'];
  const snap = snapshot();
  while (true) {
    const res = await battleOnce(enemyIds);
    if (res === 'win') return res;
    const n = partyForBattle().length;
    const c = await choose(['戦闘の前からやり直す', 'タイトルへ戻る'], n > 1 ? 'みんなは倒れてしまった……' : 'アレンは倒れてしまった……');
    if (c === 1) { location.reload(); await new Promise(() => { }); }
    const o = JSON.parse(snap); S.hp = o.hp; S.items = o.items; S.allies = o.allies;
  }
}

const alive = list => list.filter(c => c.hp > 0);
const posOf = (B, c) => {
  const list = c.side === 'ally' ? B.allies : B.enemies, n = list.length;
  const p = (c.side === 'ally' ? ALLY_POS : ENEMY_POS)[Math.min(4, n)][list.indexOf(c)];
  return { x: p[0] + (c.lunge || 0) * (c.side === 'ally' ? 140 : -110) + (c.x || 0) * 110, y: p[1] };
};
function pickMenu(list, prompt, opts) { return new Promise(r => { G.B.menu = { idx: 0, list, r, cancel: !!(opts && opts.cancel), targets: opts && opts.targets }; G.B.msg = prompt; }); }   // opts.cancel=Xキーで 'cancel' を返す / opts.targets=選択中の対象に矢印
async function pickEnemy() {
  const es = alive(G.B.enemies); if (es.length === 1) return es[0];
  const k = await pickMenu([...es.map((e, i) => [i, `${e.name}  HP ${e.hp}`]), ['back', '戻る']], 'だれを狙う？', { targets: es });
  return k === 'back' ? null : es[k];
}
async function pickAlly() {
  const as = alive(G.B.allies); if (as.length === 1) return as[0];
  const k = await pickMenu([...as.map((a, i) => [i, `${a.name}  HP ${a.hp}/${a.mhp}`]), ['back', '戻る']], 'だれに使う？', { targets: as });
  return k === 'back' ? null : as[k];
}
async function askCommand(a, canBack) {   // canBack=前の味方のコマンドへ戻れる(Xキー)。戻るときは 'back' を返す
  while (true) {
    const top = [['attack', '攻撃']];
    if (a.skills.length) top.push(['skill', '技']);
    top.push(['defend', '防御'], ['item', '道具 ×' + usableItems().reduce((n, k) => n + S.items[k], 0)]);
    const c = await pickMenu(top, `${a.name}はどうする？`, { cancel: !!canBack });
    if (c === 'cancel') return 'back';
    if (c === 'attack') { const t = await pickEnemy(); if (!t) continue; return { actor: a, kind: 'attack', target: t }; }
    if (c === 'defend') { a.defending = true; return { actor: a, kind: 'defend' }; }
    if (c === 'skill') {
      const k = await pickMenu([...a.skills.map(s => [s, SKILLS[s].once ? `${SKILLS[s].name}  1戦闘に1回${a.used && a.used[s] ? '(使用済み)' : ''}` : `${SKILLS[s].name}  MP${SKILLS[s].mp}`]), ['back', '戻る']], `${a.name}の技`);
      if (k === 'back') continue;
      const sk = SKILLS[k];
      if (sk.once && a.used && a.used[k]) { await bmsg('この技は、この戦闘ではもう使った。'); continue; }
      if (a.mp < sk.mp) { await bmsg('MPが足りない！'); continue; }
      let t = null;
      if (sk.target === 'enemy') { t = await pickEnemy(); if (!t) continue; }
      else if (sk.target === 'ally') {
        t = await pickAlly(); if (!t) continue;
        if (sk.kind === 'heal' && t.hp >= t.mhp) { await bmsg(`${t.name}のHPは満タンだ。`); continue; }   // MPは使わない
      }
      return { actor: a, kind: 'skill', skill: k, target: t };
    }
    if (c === 'item') {
      const us = usableItems();
      if (!us.length) { await bmsg(S.items.potion <= 0 && !ITEMS.bread.hp ? '回復薬がない！' : '使える道具がない！'); continue; }
      let item = us[0];
      if (us.length > 1) { const k = await pickMenu([...us.map(i => [i, `${ITEMS[i].name} ×${S.items[i]}`]), ['back', '戻る']], '何を使う？'); if (k === 'back') continue; item = k; }
      const t = await pickAlly(); if (!t) continue;
      const it = ITEMS[item];
      if (it.hp && t.hp >= t.mhp) { await bmsg(t === a && G.B.allies.length === 1 ? 'HPは満タンだ。' : `${t.name}のHPは満タンだ。`); continue; }
      if (it.mp && (!t.mmp || t.mp >= t.mmp)) { await bmsg(`${t.name}のMPは回復できない。`); continue; }
      return { actor: a, kind: 'item', item, target: t };
    }
  }
}
/* 演出(img/fx_*.png)。横に並べた正方形のコマ(1コマの一辺=画像の高さ)を順に再生する。画像が無ければ何もしない */
const SKILL_FX = { light: 'light', light_plus: 'light', light_max: 'ultimate_magic', light_ex: 'ultimate_magic', rain: 'rain', rain_plus: 'rain', rain_max: 'ultimate_magic', gardo_teaching: 'ultimate_attack' };
const BATTLE_BG = { rogue_device: 'bg_throne_room', deep_keeper: 'bg_underwater', deep_fish: 'bg_underwater', ash_beast: 'bg_ash_horizon', ash_shade: 'bg_ash_core', ash_crown: 'bg_ash_core' };
function battleBackground(enemyIds) { const id = enemyIds.slice(0, 3).find(enemy => BATTLE_BG[enemy]); return id ? BATTLE_BG[id] : null; }
const isBoss = e => e.pattern.includes('strong') && e.mhp >= 80;
function battleFx(B, name, c) {
  if (name === 'ultimate_magic' || name === 'ultimate_attack') {
    const p = posOf(B, c);
    (B.fx = B.fx || []).push({ kind: name, x: p.x, y: p.y - (c.side === 'enemy' ? 90 : 60), t0: G.t, duration: 38 });
    return;
  }
  const im = IMG['fx_' + name]; if (!im) return;
  const cell = im.height, n = Math.max(1, Math.round(im.width / cell)), p = posOf(B, c);
  (B.fx = B.fx || []).push({ im, n, cell, x: p.x, y: p.y - (c.side === 'enemy' ? 90 : 60), t0: G.t, fps: 14 });
}
function skillFxName(sk, id) { return SKILL_FX[id] || (sk.kind === 'heal' ? 'heal' : sk.target === 'allEnemies' ? 'rain' : 'light'); }
// The strongest learned magic and Gardo's teaching get readable effects even without image assets.
function drawUltimateFx(f) {
  const t = Math.max(0, Math.min(1, (G.t - f.t0) / f.duration));
  const a = Math.sin(Math.PI * t), radius = 22 + 115 * t;
  ctx.save(); ctx.translate(f.x, f.y); ctx.globalAlpha = 0.75 * a;
  if (f.kind === 'ultimate_magic') {
    const beam = ctx.createLinearGradient(-50, 0, 50, 0);
    beam.addColorStop(0, 'rgba(255,225,105,0)'); beam.addColorStop(.5, 'rgba(255,255,225,.9)'); beam.addColorStop(1, 'rgba(255,225,105,0)');
    ctx.fillStyle = beam; ctx.fillRect(-72 - 35 * t, -250, 144 + 70 * t, 315);
    const glow = ctx.createRadialGradient(0, -40, 0, 0, -40, 155);
    glow.addColorStop(0, 'rgba(255,255,225,.8)'); glow.addColorStop(.38, 'rgba(255,219,102,.30)'); glow.addColorStop(1, 'rgba(255,205,80,0)');
    ctx.fillStyle = glow; ctx.fillRect(-155, -195, 310, 310);
    ctx.strokeStyle = '#fff1a6'; ctx.lineWidth = 4;
    for (const ring of [1, .72]) { ctx.beginPath(); ctx.ellipse(0, 38, radius * ring, radius * ring * .28, 0, 0, Math.PI * 2); ctx.stroke(); }
    for (let i = 0; i < 20; i++) { const angle = i * Math.PI / 10 + t * 3, r = radius * (.7 + .25 * (i % 2)); const x = Math.cos(angle) * r, y = Math.sin(angle) * r * .7 - 40; ctx.fillStyle = i % 2 ? '#fff4ab' : '#99dfff'; ctx.fillRect(x - 2, y - 7, 4, 14); ctx.fillRect(x - 6, y - 2, 12, 4); }
  } else {
    ctx.rotate(-.7); ctx.strokeStyle = '#fff4c0'; ctx.lineCap = 'round';
    for (let i = -1; i <= 1; i++) { ctx.lineWidth = i === 0 ? 10 : 4; ctx.beginPath(); ctx.arc(0, 0, radius + i * 13, -.85, .85); ctx.stroke(); }
    ctx.rotate(1.4); ctx.strokeStyle = '#ffc56d'; ctx.lineWidth = 5; ctx.beginPath(); ctx.arc(0, 0, radius * .9, -.8, .8); ctx.stroke();
    const burst = ctx.createRadialGradient(0, 0, 1, 0, 0, radius * 1.35);
    burst.addColorStop(0, 'rgba(255,255,240,.9)'); burst.addColorStop(.22, 'rgba(255,202,84,.55)'); burst.addColorStop(1, 'rgba(255,135,35,0)');
    ctx.fillStyle = burst; ctx.beginPath(); ctx.arc(0, 0, radius * 1.35, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#ffe5a2'; ctx.lineWidth = 3;
    for (let i = 0; i < 14; i++) { const angle = i * Math.PI / 7 + t, inner = radius * .32, outer = radius * (1 + .3 * (i % 2)); ctx.beginPath(); ctx.moveTo(Math.cos(angle)*inner, Math.sin(angle)*inner); ctx.lineTo(Math.cos(angle)*outer, Math.sin(angle)*outer); ctx.stroke(); }
  }
  ctx.restore();
}
function pop(B, c, v, col) { const p = posOf(B, c); B.nums.push({ t: 40, v, x: p.x + (c.side === 'enemy' ? 0 : 30), y: p.y - (c.side === 'enemy' ? 130 : 90), c: col }); }

async function doAction(B, act) {
  const a = act.actor;
  if (a.hp <= 0) return;
  if (a.side === 'ally') {
    if (act.kind === 'defend') { battleFx(B, 'guard', a); await bmsg(`${a.name}は身構えた。`); return; }
    if (act.kind === 'item') {
      const t = act.target, id = act.item || 'potion', it = ITEMS[id];
      const full = it.hp ? t.hp >= t.mhp : (!t.mmp || t.mp >= t.mmp);
      if ((S.items[id] || 0) <= 0 || full) { await bmsg(`${it.name}は使えなかった。`); return; }
      S.items[id]--; Snd.sfx('heal'); battleFx(B, 'heal', t);
      if (it.hp) { const heal = Math.min(it.hp, t.mhp - t.hp); t.hp += heal; pop(B, t, '+' + heal, '#7df08a'); await bmsg(t === a ? `${it.name}を使った。HPが${heal}回復した！` : `${a.name}は${t.name}に${it.name}を使った。HPが${heal}回復した！`); }
      else { const mp = Math.min(it.mp, t.mmp - t.mp); t.mp += mp; pop(B, t, 'MP+' + mp, '#9fd8ff'); await bmsg(t === a ? `${it.name}を使った。MPが${mp}回復した！` : `${a.name}は${t.name}に${it.name}を使った。MPが${mp}回復した！`); }
      return;
    }
    let targets, text;
    if (act.kind === 'attack') {
      let t = act.target.hp > 0 ? act.target : alive(B.enemies)[0]; if (!t) return;
      const dmg = Math.max(1, a.atk - t.def);
      a.lunge = 1; await sleep(8);
      Snd.sfx('hit'); t.hp = Math.max(0, t.hp - dmg); t.flash = 14; pop(B, t, dmg, '#fff'); battleFx(B, 'hit', t); a.lunge = 0;
      await bmsg(`${a.name}の攻撃！　${t.name}に${dmg}のダメージ！`);
    } else if (act.kind === 'skill') {
      const sk = SKILLS[act.skill];
      if (a.mp < sk.mp) { await bmsg('MPが足りない！'); return; }
      a.mp -= sk.mp; if (sk.once) (a.used = a.used || {})[act.skill] = true; a.cast = 50;   // 技のポーズ(battle_<id>_cast があれば)
      if (sk.kind === 'heal') {
        const t = act.target.hp > 0 ? act.target : alive(B.allies)[0], heal = Math.min(sk.power, t.mhp - t.hp);
        t.hp += heal; Snd.sfx('heal'); battleFx(B, 'heal', t); if (heal > 0) pop(B, t, '+' + heal, '#7df08a');
        await bmsg(heal > 0 ? `${a.name}の${sk.name}！　${t.name}のHPが${heal}回復した！` : `${a.name}の${sk.name}！　しかし${t.name}のHPは満タンだった。`);
      } else {
        targets = sk.target === 'allEnemies' ? alive(B.enemies) : [act.target.hp > 0 ? act.target : alive(B.enemies)[0]];
        a.lunge = 0.4; await sleep(8); Snd.sfx('hit');
        const parts = [];
        for (const t of targets) { if (!t) continue; const dmg = sk.power; t.hp = Math.max(0, t.hp - dmg); t.flash = 14; pop(B, t, dmg, '#9fd8ff'); battleFx(B, skillFxName(sk, act.skill), t); parts.push(`${t.name}に${dmg}`); }
        a.lunge = 0;
        await bmsg(`${a.name}の${sk.name}！　${parts.join('、')}のダメージ！`);
      }
    }
    return;
  }
  // 敵の行動
  const k = a.pattern[a.step % a.pattern.length]; a.step++;
  if (k === 'tele') { a.pose = true; await bmsg(`${a.name}は身構えている……！　次の攻撃に注意！`); return; }
  a.pose = false;
  const t = alive(B.allies)[Math.floor(Math.random() * alive(B.allies).length)];
  let dmg = Math.max(1, (k === 'strong' ? Math.round(a.atk * 1.6) : a.atk) - t.def);
  if (t.defending) dmg = Math.max(1, Math.ceil(dmg / 2));
  a.x = -1; await sleep(8); a.x = 0;
  t.hp = Math.max(0, t.hp - dmg); B.shk = 14; B.red = 10; t.flash = 10; Snd.sfx('hurt'); pop(B, t, dmg, '#ff8a8a');
  if (k === 'strong') { battleFx(B, 'enemy_strong', t); if (a.id === 'ash_crown') battleFx(B, 'ash_burst', t); }
  await bmsg(k === 'strong' ? `${a.name}の強攻撃！　${t.name}に${dmg}のダメージ！` : `${a.name}の攻撃！　${t.name}に${dmg}のダメージ！`);
}

async function battleOnce(enemyIds) {
  const allies = partyForBattle(), enemies = enemyIds.slice(0, 3).map(mkEnemy);
  const B = G.B = { allies, enemies, wolf: enemies[0], msg: '', nums: [], shk: 0, red: 0, active: null, fx: [], t0: G.t, bgKey: battleBackground(enemyIds) };
  G.mode = 'battle'; Snd.bgm('battle');
  await fade(0, 0.06);
  const names = enemies.map(e => e.name).join('と');
  B.msg = `${names}が現れた！`;
  await sleep(20);
  await bmsg(`${names}が現れた！`);
  if (enemyIds[0] === 'ash_wolf') await bmsg('【戦い方】 攻撃=敵を斬る / 防御=受けるダメージを半分に / 道具=回復薬でHPを25回復');
  while (true) {
    // 1) 味方のコマンド
    const acts = [];
    const live = allies.filter(a => a.hp > 0);
    for (let i = 0; i < live.length;) {   // 味方ごとにコマンド。Xキーで前の味方に戻って選び直せる
      const a = live[i]; B.active = a;
      const r = await askCommand(a, i > 0);
      if (r === 'back') { i--; live[i].defending = false; acts.pop(); continue; }
      acts.push(r); i++;
    }
    B.active = null;
    for (const e of enemies) if (e.hp > 0) acts.push({ actor: e, kind: 'enemy' });
    // 2) 素早さの高い順(同じなら味方が先)
    acts.sort((x, y) => (y.actor.spd - x.actor.spd) || ((x.actor.side === 'ally' ? 0 : 1) - (y.actor.side === 'ally' ? 0 : 1)));
    for (const act of acts) {
      await doAction(B, act);
      syncParty(allies);
      // 倒れた敵の演出
      for (const e of enemies) if (e.hp <= 0 && !e.dead) {
        e.dead = true;
        if (enemies.every(x => x.hp <= 0)) Snd.sfx('win');
        for (let i = 0; i < 40; i++) { e.fade = i / 40; await sleep(1); }
        await bmsg(`${e.name}は倒れた！`);
      }
      if (enemies.every(e => e.hp <= 0)) { allies.forEach(a => a.defending = false); return 'win'; }
      // 倒れた味方
      for (const a of allies) if (a.hp <= 0 && !a.down) {
        a.down = true;
        if (allies.every(x => x.hp <= 0)) { Snd.sfx('lose'); await bmsg(`${a.name}は力尽きた……`); return 'lose'; }
        await bmsg(`${a.name}は倒れた……`);
      }
    }
    allies.forEach(a => a.defending = false);
  }
}
function bmsg(text) { G.B.msg = text; G.B.msgWait = true; return waitOk().then(() => { G.B.msgWait = false; }); }

/* 戦闘用の縦長画像が画面上端と対象矢印からはみ出さない大きさ。 */
function enemyDrawSize(e, im, p, scale = 1, count = 1) {
  const maxHeight = Math.max(1, p.y - 75);
  const boss = Array.isArray(e.pattern) && isBoss(e);
  const maxWidth = count === 1 ? 300 : count === 2 ? (boss ? 180 : 170) : (boss ? 180 : 110);
  const dw = Math.max(1, Math.min(e.size * scale, maxWidth, Math.max(1, (W - 10 - p.x) * 2), Math.max(1, (p.x - 10) * 2), maxHeight * im.width / im.height));
  return [dw, im.height * dw / im.width];
}
/* 戦闘中の情報は細いゲージと短いラベルにまとめる。 */
function battleGauge(x, y, w, value, max, color) {
  const ratio = max > 0 ? Math.max(0, Math.min(1, value / max)) : 0;
  ctx.fillStyle = 'rgba(0,0,0,.65)'; roundRect(ctx, x, y, w, 7, 3); ctx.fill();
  if (ratio > 0) {
    const g = ctx.createLinearGradient(x, y, x, y + 7);
    g.addColorStop(0, color[0]); g.addColorStop(1, color[1]);
    ctx.fillStyle = g; roundRect(ctx, x, y, Math.max(1, w * ratio), 7, 3); ctx.fill();
  }
}
// The battle frame uses the lantern's warm brass and engraved corner motifs.
function battleFrame(x, y, w, h) {
  ctx.save(); panel(x, y, w, h);
  const shine = ctx.createLinearGradient(x, y, x + w, y);
  shine.addColorStop(0, 'rgba(238,185,94,.12)'); shine.addColorStop(.45, 'rgba(238,185,94,.55)'); shine.addColorStop(1, 'rgba(238,185,94,.12)');
  ctx.strokeStyle = shine; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(x + 28, y + 9); ctx.lineTo(x + w - 28, y + 9); ctx.moveTo(x + 28, y + h - 9); ctx.lineTo(x + w - 28, y + h - 9); ctx.stroke();
  for (const side of [1, -1]) {
    const cx = side === 1 ? x + 13 : x + w - 13;
    ctx.save(); ctx.translate(cx, y + 13); ctx.scale(side, 1); ctx.strokeStyle = '#c9a66c'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(0, 12); ctx.lineTo(0, 2); ctx.lineTo(10, 2); ctx.moveTo(2, 9); ctx.quadraticCurveTo(3, 4, 8, 4); ctx.stroke();
    ctx.fillStyle = '#f3cf8b'; ctx.beginPath(); ctx.moveTo(5, -1); ctx.lineTo(8, 2); ctx.lineTo(5, 5); ctx.lineTo(2, 2); ctx.closePath(); ctx.fill(); ctx.restore();
  }
  // A small lantern crest in the frame centre reinforces the game's motif.
  ctx.translate(x + w / 2, y + h - 9); ctx.fillStyle = '#d7ae6c';
  ctx.beginPath(); ctx.moveTo(0, -3); ctx.lineTo(4, 0); ctx.lineTo(0, 3); ctx.lineTo(-4, 0); ctx.closePath(); ctx.fill();
  ctx.restore();
}
function battleCommandIcon(kind, x, y, selected) {
  ctx.save(); ctx.translate(x, y); ctx.strokeStyle = selected ? '#ffe9af' : '#c8ac7e'; ctx.fillStyle = selected ? '#ffe9af' : '#c8ac7e'; ctx.lineWidth = 1.6; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  if (kind === 'attack') { ctx.beginPath(); ctx.moveTo(-5, 6); ctx.lineTo(5, -6); ctx.lineTo(6, -9); ctx.lineTo(3, -8); ctx.lineTo(-7, 3); ctx.moveTo(-8, 0); ctx.lineTo(-3, 5); ctx.moveTo(-7, 7); ctx.lineTo(-4, 4); ctx.stroke(); }
  else if (kind === 'defend') { ctx.beginPath(); ctx.moveTo(0, -8); ctx.lineTo(7, -5); ctx.lineTo(6, 2); ctx.quadraticCurveTo(3, 7, 0, 8); ctx.quadraticCurveTo(-3, 7, -6, 2); ctx.lineTo(-7, -5); ctx.closePath(); ctx.stroke(); }
  else if (kind === 'item') { ctx.beginPath(); ctx.moveTo(-3, -7); ctx.lineTo(3, -7); ctx.moveTo(-2, -7); ctx.lineTo(-2, -3); ctx.lineTo(-6, 1); ctx.lineTo(-6, 7); ctx.lineTo(6, 7); ctx.lineTo(6, 1); ctx.lineTo(2, -3); ctx.lineTo(2, -7); ctx.moveTo(-5, 3); ctx.lineTo(5, 3); ctx.stroke(); }
  else { ctx.beginPath(); ctx.moveTo(0, -8); ctx.quadraticCurveTo(2, -2, 7, 0); ctx.quadraticCurveTo(2, 2, 0, 8); ctx.quadraticCurveTo(-2, 2, -7, 0); ctx.quadraticCurveTo(-2, -2, 0, -8); ctx.closePath(); ctx.stroke(); }
  ctx.restore();
}
// Compact labels follow each combatant instead of covering the battlefield edges.
function battleLabelRect(B, unit) {
  const pos = posOf(B, unit), enemy = unit.side === 'enemy';
  const im = enemy && ((unit.pose && IMG[unit.img + '_pose']) || IMG[unit.img] || (unit.fallback && IMG[unit.fallback]));
  const imageHeight = enemy ? (im ? enemyDrawSize(unit, im, pos, 1.09, B.enemies.length)[1] : 150) : 150;
  const w = enemy ? 108 : 84, h = !enemy && unit.mmp > 0 ? 41 : 31;
  return { x: Math.max(5, Math.min(W - w - 5, pos.x - w / 2)), y: Math.max(6, pos.y - imageHeight - h - 8), w, h };
}
function drawCombatantLabel(rect, unit, active) {
  const { x, y, w, h } = rect, enemy = unit.side === 'enemy';
  ctx.save(); panel(x, y, w, h);
  if (active) { ctx.strokeStyle = '#ffe39a'; ctx.lineWidth = 1.5; roundRect(ctx, x + 3, y + 3, w - 6, h - 6, 6); ctx.stroke(); }
  ctx.textBaseline = 'middle'; ctx.textAlign = 'left'; ctx.font = 'bold 12px ' + FONT;
  ctx.fillStyle = active ? '#ffe3a0' : unit.hp > 0 ? '#fff4e2' : '#aaa'; ctx.fillText(unit.name, x + 8, y + 10, enemy ? w - 62 : w - 48);
  ctx.textAlign = 'right'; ctx.font = '11px ' + FONT; ctx.fillStyle = '#fff4e2';
  ctx.fillText(`${Math.max(0, unit.hp)}/${unit.mhp}`, x + w - 7, y + 10, 39);
  battleGauge(x + 8, y + 18, w - 16, unit.hp, unit.mhp, enemy ? ['#ffac89', '#b64240'] : unit.hp <= unit.mhp * .25 ? ['#ffcf7e', '#c25444'] : ['#a5edb1', '#388b70']);
  if (!enemy && unit.mmp > 0) {
    ctx.textAlign = 'left'; ctx.font = '10px ' + FONT; ctx.fillStyle = '#b6d6ff'; ctx.fillText('MP', x + 8, y + 33);
    battleGauge(x + 25, y + 29, w - 60, unit.mp, unit.mmp, ['#b1d9ff', '#4a75bd']);
    ctx.textAlign = 'right'; ctx.fillText(`${Math.max(0, unit.mp)}/${unit.mmp}`, x + w - 7, y + 33, 28);
  }
  ctx.restore();
}
/* ---- 描画 ---- */
function drawBattle() {
  const B = G.B;
  ctx.save();
  if (B.shk > 0) ctx.translate((Math.random() - 0.5) * 10, (Math.random() - 0.5) * 10);
  const bg = IMG[B.bgKey] || IMG.bg_battle;
  if (bg) { const sc = H / bg.height; const dw = bg.width * sc; ctx.drawImage(bg, (W - dw) / 2, 0, dw, H); } else { ctx.fillStyle = '#334'; ctx.fillRect(0, 0, W, H); }
  // 敵
  for (const e of B.enemies) {
    const im = (e.pose && IMG[e.img + '_pose']) || IMG[e.img] || (e.fallback && IMG[e.fallback]); if (!im) continue;   // 身構えの差分(<img>_pose)があれば使う
    const p = posOf(B, e), sc = 1 + Math.sin(G.t / 22 + B.enemies.indexOf(e)) * 0.01 + (e.pose ? 0.08 : 0);
    const [dw, dh] = enemyDrawSize(e, im, p, sc, B.enemies.length);
    ctx.save(); ctx.translate(p.x, p.y);
    if (e.dead) ctx.globalAlpha = Math.max(0, 1 - e.fade);
    else if (e.flash > 0 && e.flash % 4 < 2) ctx.globalAlpha = 0.35;
    if (e.pose) { ctx.shadowColor = '#ff6a3a'; ctx.shadowBlur = 24; }
    ctx.drawImage(im, -dw / 2, -dh, dw, dh);
    ctx.restore();
  }
  // 味方
  for (const a of [...B.allies].reverse()) {
    const p = posOf(B, a); ctx.save();
    if (a.hp <= 0) ctx.globalAlpha = 0.45; else if (a.flash > 0 && a.flash % 4 < 2) ctx.globalAlpha = 0.5;
    const poseImg = (a.cast > 0 && IMG['battle_' + a.id + '_cast']) || (a.id === 'allen' && a.lunge > 0 && IMG.battle_allen_attack) || null;   // 技・攻撃のポーズ
    const idleImg = IMG['battle_' + a.id + '_idle_v2'];
    const sh = a.sprite && IMG[a.sprite], pt = poseImg || idleImg || (a.portrait && IMG[a.portrait]);
    if (poseImg || idleImg) { const im = poseImg || idleImg, dh = 150, dw = im.width * dh / im.height; ctx.drawImage(im, p.x - dw / 2, p.y - dh, dw, dh); }
    else if (sh) {
      const sc = 150 / 84, dw = 84 * sc, revised = a.id === 'allen' && IMG.allen_walk_v2;
      if (revised && revised.width === 1086 && revised.height === 1448) ctx.drawImage(revised, 362, 3 * 362, 362, 362, p.x - dw / 2, p.y - dw, dw, dw);
      else ctx.drawImage(sh, 84, 3 * 84, 84, 84, p.x - dw / 2, p.y - dw, dw, dw);
    }
    else if (pt) { const dh = 150, dw = pt.width * dh / pt.height; ctx.drawImage(pt, p.x - dw / 2, p.y - dh, dw, dh); }
    else { ctx.fillStyle = '#6a7aa8'; ctx.fillRect(p.x - 30, p.y - 110, 60, 110); }
    ctx.restore();

  }
  // 演出(fx)
  B.fx = (B.fx || []).filter(f => f.kind ? G.t - f.t0 < f.duration : (G.t - f.t0) * f.fps / 60 < f.n);
  for (const f of B.fx) {
    if (f.kind) { drawUltimateFx(f); continue; }
    const fr = Math.floor((G.t - f.t0) * f.fps / 60);
    ctx.drawImage(f.im, fr * f.cell, 0, f.cell, f.cell, f.x - f.cell / 2, f.y - f.cell / 2, f.cell, f.cell);
  }
  if (B.red > 0) { ctx.fillStyle = `rgba(255,40,40,${B.red / 30})`; ctx.fillRect(0, 0, W, H); }
  ctx.restore();
  for (const c of [...B.allies, ...B.enemies]) { if (c.flash > 0) c.flash--; if (c.cast > 0) c.cast--; }
  // 数値
  ctx.font = 'bold 36px ' + FONT; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  for (const n of B.nums) { ctx.globalAlpha = Math.min(1, n.t / 20); ctx.lineWidth = 5; ctx.strokeStyle = '#000'; ctx.strokeText(n.v, n.x, n.y - (40 - n.t)); ctx.fillStyle = n.c; ctx.fillText(n.v, n.x, n.y - (40 - n.t)); }
  ctx.globalAlpha = 1; ctx.textAlign = 'left';
  // 味方と敵の頭上に表示する。対象選択の矢印はラベルより上。
  const labelRects = new Map(), placedLabels = [];
  for (const c of [...B.allies, ...B.enemies.filter(e => !e.dead)]) {
    const rect = battleLabelRect(B, c);
    // Crowded groups: keep labels separate while staying close to their owner.
    for (let attempt = 0; attempt < placedLabels.length + 1; attempt++) {
      const hit = placedLabels.find(p => rect.x < p.x + p.w + 3 && rect.x + rect.w + 3 > p.x && rect.y < p.y + p.h + 3 && rect.y + rect.h + 3 > p.y);
      if (!hit) break;
      const above = hit.y - rect.h - 4;
      if (above >= 6) rect.y = above;
      else { rect.x = Math.min(W - rect.w - 5, hit.x + hit.w + 4); }
    }
    placedLabels.push(rect); labelRects.set(c, rect);
    drawCombatantLabel(rect, c, B.active === c);
  }
  const boss = B.enemies.find(e => !e.dead && isBoss(e));
  if (IMG.fx_boss_appear && boss && G.t - B.t0 < 40) { ctx.globalAlpha = 1 - (G.t - B.t0) / 40; ctx.drawImage(IMG.fx_boss_appear, 0, 0, W, H); ctx.globalAlpha = 1; }
  // The battlefield stays unobstructed: dialogue and commands share the lower strip.
  const split = !!B.menu, messageWidth = split ? 540 : W - 40;
  battleFrame(20, H - 150, messageWidth, 130); ctx.fillStyle = '#fff'; ctx.textBaseline = 'top';
  let messageSize = 22, lines; do { ctx.font = messageSize + 'px ' + FONT; lines = wrapText(B.msg, messageWidth - 48); if (lines.length <= 4 || messageSize <= 13) break; messageSize--; } while (true);
  const lineHeight = Math.min(messageSize + 6, 100 / Math.max(1, lines.length));
  lines.forEach((l, i) => ctx.fillText(l, 44, H - 130 + i * lineHeight));
  if (B.msgWait && Math.floor(G.t / 20) % 2) { ctx.fillStyle = '#ffe6a8'; ctx.fillText('▼', 20 + messageWidth - 36, H - 56); }
  if (B.menu) {
    const m = B.menu, x = 574, top = H - 150, w = W - x - 20, visible = Math.min(4, m.list.length), rh = 27;
    const first = Math.max(0, Math.min(m.idx - visible + 1, m.list.length - visible));
    battleFrame(x, top, w, 130);
    ctx.font = '19px ' + FONT; ctx.textBaseline = 'middle';
    m.list.slice(first, first + visible).forEach((it, row) => {
      const i = first + row, yy = top + 11 + row * rh;
      if (i === m.idx) { const gr = ctx.createLinearGradient(x + 12, yy, x + w - 12, yy); gr.addColorStop(0, 'rgba(184,126,58,.54)'); gr.addColorStop(1, 'rgba(184,126,58,.10)'); ctx.fillStyle = gr; roundRect(ctx, x + 11, yy, w - 22, rh - 2, 4); ctx.fill(); ctx.strokeStyle = 'rgba(245,209,140,.62)'; ctx.lineWidth = 1; roundRect(ctx, x + 11, yy, w - 22, rh - 2, 4); ctx.stroke(); }
      battleCommandIcon(it[0], x + 25, yy + rh / 2, i === m.idx);
      ctx.fillStyle = i === m.idx ? '#fff4dd' : '#d9d0c2'; ctx.fillText(it[1], x + 43, yy + rh / 2, w - 65);
    });
    if (first > 0 || first + visible < m.list.length) { ctx.fillStyle = '#e8d9b6'; ctx.font = '14px ' + FONT; ctx.fillText((first > 0 ? '↑' : '') + (first + visible < m.list.length ? '↓' : ''), x + w - 22, top + 13); }
    // 対象選択中は、選んでいる相手の頭上に矢印(img/ui_target_arrow.png。無ければ三角)
    if (m.targets && m.idx < m.targets.length) {
      const c = m.targets[m.idx], p = posOf(B, c), im = c.side === 'enemy' ? ((IMG[c.img] || (c.fallback && IMG[c.fallback]))) : null;
      const label = labelRects.get(c);
      const topY = Math.max(0, (label ? label.y : p.y - 200) - 30 + Math.sin(G.t / 7) * 3);
      if (IMG.ui_target_arrow) ctx.drawImage(IMG.ui_target_arrow, p.x - 24, topY, 48, 48);
      else { ctx.fillStyle = '#ffd35a'; ctx.strokeStyle = '#5a3a10'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(p.x - 16, topY + 6); ctx.lineTo(p.x + 16, topY + 6); ctx.lineTo(p.x, topY + 34); ctx.closePath(); ctx.fill(); ctx.stroke(); }
    }
  }
}
