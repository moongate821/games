'use strict';
/* フィールドのメニュー(ステータス・道具・装備・セーブ・設定)と、道具・装備のデータ表。
   ■ 道具は ITEMS、装備は GEAR に書き足す。装備の効果は攻撃(atk)・防御(def)・素早さ(spd)に足される。
   ■ 持ち物は S.items(道具の数)と S.gear(持っている装備の数)、付けている装備は S.equip[メンバーid]={w:武器,a:防具,c:装飾}。 */
const ITEMS = {
  weakening_powder: { name:'鈍刃の粉', desc:'戦闘中、敵1体の攻撃力を次の3行動の間25%下げる。', weaken:3 },
  armorbreak_powder: { name:'砕甲の粉', desc:'敵1体の防御力を次の3行動の間25%下げる。通常攻撃に有効。', armorbreak:3 },
  scroll_cataclysm: { name:'星墜の極大巻物', desc:'戦闘中、敵全体に90ダメージ。使うとなくなる。', damage:90, allEnemies:true, ultimate:true },
  scroll_fire: { name:'火球の巻物', desc:'戦闘中、敵1体に28ダメージ。使うとなくなる。', damage:28 },
  scroll_gale: { name:'旋風の巻物', desc:'戦闘中、敵全体に14ダメージ。使うとなくなる。', damage:14, allEnemies:true },
  scroll_heal: { name:'治癒の巻物', desc:'仲間1人のHPを45回復。使うとなくなる。', hp:45 },
  revival_tonic: { name: '目覚めの薬', desc: '戦闘不能の仲間をHP25で立て直す。', revive: 25 },
  potion: { name: '回復薬', desc: 'HPを25回復する。', hp: 25 },
  bread: { name: '灯火祭のパン', desc: 'HPを15回復する。素朴な甘さがする。', hp: 15 },
  ether: { name: '魔力薬', desc: 'MPを8回復する。', mp: 8 },
  kit: { name: '修理道具', desc: 'アレンの仕事道具。ねじ回しやペンチが入っている。', key: true }
};
const GEAR = {
  old_wrench: { name: '古いレンチ', slot: 'w', atk: 2, desc: '修理屋が使い込んだレンチ。殴ると意外に痛い。' },
  iron_sword: { name: '鉄の剣', slot: 'w', atk: 4, desc: '王国兵の払い下げ。重いがよく斬れる。' },
  herb_staff: { name: '薬草の杖', slot: 'w', atk: 2, only: ['mira'], desc: '薬草が巻き付いた杖。' },
  work_coat: { name: '作業用の上着', slot: 'a', def: 2, desc: '丈夫な布の上着。油の匂いがする。' },
  leather_vest: { name: '革の胴着', slot: 'a', def: 3, desc: '旅人向けの革の胴着。' },
  bell_charm: { name: '鈴のお守り', slot: 'c', spd: 2, desc: '小さな鈴。歩くたびに軽く鳴る。' }
};
const SLOT_NAME = { w: '武器', a: '防具', c: '装飾' };

/* メンバー(フィールド用)。アレンは S.hp、他の仲間は S.allies に保存してある */
function fieldMembers() {
  const list = [{ id: 'allen', name: 'アレン', get hp() { return S.hp; }, set hp(v) { S.hp = v; }, get mp() { return 0; }, set mp(v) { }, mhp: S.mhp, mmp: 0 }];
  for (const m of (S.allies || [])) list.push({ id: m.id, name: ALLIES[m.id].name, get hp() { return m.hp; }, set hp(v) { m.hp = v; }, get mp() { return m.mp; }, set mp(v) { m.mp = v; }, mhp: mhpOf(m.id), mmp: mmpOf(m.id) });
  return list;
}
function gearBonus(id) {
  const eq = (S.equip && S.equip[id]) || {}, b = { atk: 0, def: 0, spd: 0 };
  for (const s of ['w', 'a', 'c']) { const g = GEAR[eq[s]]; if (g) { b.atk += g.atk || 0; b.def += g.def || 0; b.spd += g.spd || 0; } }
  return b;
}
/* 成長: S.lv(台本の ['levelup', n] で上がる)1つにつき 攻撃+2・防御+1・最大HP+8・最大MP+2。アレンの最大HPは S.mhp に直接足す */
const LV = { atk: 2, def: 1, mhp: 8, mmp: 2 };
const mhpOf = id => id === 'allen' ? S.mhp : ALLIES[id].mhp + LV.mhp * (S.lv || 0);
const mmpOf = id => ALLIES[id].mmp ? ALLIES[id].mmp + LV.mmp * (S.lv || 0) : 0;
function statsOf(id) { const d = ALLIES[id], b = gearBonus(id), lv = S.lv || 0; return { atk: d.atk + LV.atk * lv + b.atk, def: d.def + LV.def * lv + b.def, spd: d.spd + b.spd, base: { atk: d.atk + LV.atk * lv, def: d.def + LV.def * lv, spd: d.spd }, bonus: b }; }

/* 道具を使う(フィールド)。使えたら文を返す。使えなければ null */
function applyItem(itemId, m) {
  const it = ITEMS[itemId];
  if ((S.items[itemId] || 0) <= 0) return null;
  if (it.revive) { if (m.hp > 0) return null; m.hp = Math.min(it.revive, m.mhp); S.items[itemId]--; return `${m.name}は目を覚ました。HPが${m.hp}回復した。`; }
  if (m.hp <= 0) return null;
  if (it.hp) { if (m.hp >= m.mhp) return null; const h = Math.min(it.hp, m.mhp - m.hp); m.hp += h; S.items[itemId]--; return m.id === 'allen' ? `${it.name}を使った。HPが${h}回復した。` : `${m.name}に${it.name}を使った。HPが${h}回復した。`; }
  if (it.mp) { if (!m.mmp || m.mp >= m.mmp) return null; const h = Math.min(it.mp, m.mmp - m.mp); m.mp += h; S.items[itemId]--; return `${m.name}に${it.name}を使った。MPが${h}回復した。`; }
  return null;
}

async function itemMenu() {
  while (true) {
    const ids = Object.keys(ITEMS).filter(k => (S.items[k] || 0) > 0);
    if (!ids.length) { await narrate('道具を持っていない。'); return; }
    const k = await choose(ids.map(i => `${ITEMS[i].name} ×${S.items[i]}`), '道具(戻る: Xキー)', { cancel: true, desc: i => ITEMS[ids[i]].desc + (ITEMS[ids[i]].key ? '(大事な物)' : '') });
    if (k < 0) return;
    const id = ids[k], it = ITEMS[id];
    if (it.damage || it.weaken || it.armorbreak) { await narrate(`${it.name}は戦闘中に使う道具だ。`); continue; }
    if (it.key) { await narrate(`${it.name}は、使うものではない。${it.desc}`); continue; }
    const ms = fieldMembers();
    let m = ms[0];
    if (ms.length > 1) { const t = await choose(ms.map(x => `${x.name}  HP ${x.hp}/${x.mhp}${x.mmp ? '  MP ' + x.mp + '/' + x.mmp : ''}`), `${it.name}をだれに使う？`, { cancel: true }); if (t < 0) continue; m = ms[t]; }
    const msg = applyItem(id, m);
    await narrate(msg || (it.revive ? `${m.name}には今使えない。` : m.hp <= 0 ? `${m.name}は倒れている。目覚めの薬が必要だ。` : it.mp ? `${m.name}のMPは回復できない。` : `${m.name}のHPは満タンだ。`));
  }
}

async function equipMenu() {
  while (true) {
    const ms = fieldMembers();
    let m = ms[0];
    if (ms.length > 1) { const t = await choose(ms.map(x => x.name), 'だれの装備を変える？', { cancel: true }); if (t < 0) return; m = ms[t]; }
    S.equip = S.equip || {}; const eq = S.equip[m.id] = S.equip[m.id] || { w: null, a: null, c: null };
    while (true) {
      const slots = ['w', 'a', 'c'];
      const s = await choose(slots.map(x => `${SLOT_NAME[x]}: ${eq[x] ? GEAR[eq[x]].name : 'なし'}`), `${m.name}の装備(戻る: Xキー)`, { cancel: true });
      if (s < 0) break;
      const slot = slots[s];
      const owned = Object.keys(GEAR).filter(g => GEAR[g].slot === slot && (S.gear[g] || 0) > 0 && (!GEAR[g].only || GEAR[g].only.includes(m.id)));
      const fmt = g => { const x = GEAR[g], p = []; if (x.atk) p.push('攻+' + x.atk); if (x.def) p.push('防+' + x.def); if (x.spd) p.push('速+' + x.spd); return `${x.name}  ${p.join(' ')}  ×${S.gear[g]}`; };
      const list = [...owned.map(fmt), '外す'];
      const k = await choose(list, `${SLOT_NAME[slot]}を選ぶ`, { cancel: true, desc: i => (owned[i] ? GEAR[owned[i]].desc : '装備を外す。') });
      if (k < 0) continue;
      if (eq[slot]) { S.gear[eq[slot]] = (S.gear[eq[slot]] || 0) + 1; eq[slot] = null; }
      if (k < owned.length) { eq[slot] = owned[k]; S.gear[owned[k]]--; await narrate(`${m.name}は${GEAR[owned[k]].name}を装備した。`); }
      else await narrate('装備を外した。');
    }
    if (ms.length === 1) return;
  }
}

// 宿での休息。戦闘不能も回復するが、物語で離脱した人物は戻さない。
async function restAtInn() {
  const price = 20;
  const c = await choose(['休む（20 G）', 'やめる'], `宿で休みますか？　所持金 ${S.gold} G`, { cancel: true });
  if (c !== 0) return;
  if (S.gold < price) { await narrate('所持金が足りません。'); return; }
  S.gold -= price;
  for (const m of fieldMembers()) { m.hp = m.mhp; if (m.mmp) m.mp = m.mmp; }
  Snd.sfx('heal'); await narrate(`ひと休みして、仲間のHPとMPが全回復した。所持金 ${S.gold} G。`);
}

function statusScreen() {
  return new Promise(r => { G.screen = { type: 'status', idx: 0, resolve: r }; });
}

async function openMenu() {
  while (true) {
    const ms = fieldMembers();
    const c = await choose(['ステータス', '道具', '装備', 'セーブ', '操作説明', '音: ' + (Snd.on ? 'ON' : 'OFF'), '移動速度: ' + WALK_SPEEDS[walkSpeedIndex()].name, 'タイトルへ戻る', '閉じる'],
      ms.map(m => `${m.name} ${m.hp}/${m.mhp}`).join('  ') + `   回復薬 ×${S.items.potion}   ${S.gold} G`, { cancel: true });
    if (c < 0 || c === 8) break;
    if (c === 0) await statusScreen();
    else if (c === 1) await itemMenu();
    else if (c === 2) await equipMenu();
    else if (c === 3) await doSave();
    else if (c === 4) await narrate('移動: 矢印キー/WASD・ゲームパッド・画面の十字ボタン\n決定・調べる: Z/Enter/スペース　メニュー・キャンセル: X/Esc');
    else if (c === 5) Snd.toggle();
    else if (c === 6) { const speed = await choose(WALK_SPEEDS.map(s => s.name), '移動速度を選んでください', { cancel: true }); if (speed >= 0) setWalkSpeed(speed); }
    else if (c === 7) {
      const action = await choose(['セーブして戻る', '保存せず戻る', 'やめる'], 'タイトルに戻りますか？', { cancel: true });
      if (action < 0 || action === 2) continue;
      if (action === 0 && !(await doSave())) continue;
      if (action === 1) {
        const confirm = await choose(['戻らない', '保存せず戻る'], '最後にセーブしてからの進行は失われます', { cancel: true });
        if (confirm !== 1) continue;
      }
      await fade(1, 0.05);
      G.mode = 'title'; G.tint = 0; G.toast = null; titleMenu.idx = 0; Snd.bgm('title');
      await fade(0, 0.05);
      break;
    }
  }
}

/* ステータス画面の描画(G.screen があるとき) */
function drawStatusScreen() {
  const sc = G.screen, ms = fieldMembers(); sc.idx = Math.max(0, Math.min(ms.length - 1, sc.idx));
  const m = ms[sc.idx], st = statsOf(m.id), d = ALLIES[m.id], eq = (S.equip && S.equip[m.id]) || {};
  ctx.fillStyle = 'rgba(6,5,14,.9)'; ctx.fillRect(0, 0, W, H);
  panel(30, 24, W - 60, H - 48);
  ctx.textBaseline = 'middle';
  // 上部のタブ
  ms.forEach((x, i) => { const px = 56 + i * 150; ctx.fillStyle = i === sc.idx ? 'rgba(216,184,120,.35)' : 'rgba(255,255,255,.07)'; roundRect(ctx, px, 40, 138, 36, 8); ctx.fill(); ctx.font = '20px ' + FONT; ctx.fillStyle = i === sc.idx ? '#fff' : '#bbb'; ctx.fillText(x.name, px + 16, 59); });
  if (ms.length > 1) { ctx.font = '15px ' + FONT; ctx.fillStyle = '#aaa'; ctx.fillText('← → でメンバーを切り替え', W - 250, 59); }
  // 立ち姿
  const sh = d.sprite && IMG[d.sprite], pt = d.portrait && IMG[d.portrait];
  if (sh) ctx.drawImage(sh, 84, 0, 84, 84, 70, 130, 252, 252);
  else if (pt) { const h = 300, w = pt.width * h / pt.height; ctx.drawImage(pt, 196 - w / 2, 100, w, h); }
  ctx.font = 'bold 30px ' + FONT; ctx.fillStyle = '#ffe6a8'; ctx.fillText(m.name, 70, 420);
  // HP/MP
  ctx.font = '20px ' + FONT; ctx.fillStyle = '#fff'; ctx.fillText(`HP ${m.hp}/${m.mhp}`, 380, 110); bar(380, 128, 250, 14, m.hp, m.mhp, '#5ac86a');
  if (m.mmp) { ctx.fillStyle = '#fff'; ctx.fillText(`MP ${m.mp}/${m.mmp}`, 380, 168); bar(380, 186, 250, 12, m.mp, m.mmp, '#5a8ae8'); }
  // 能力
  const rows = [['攻撃', st.base.atk, st.bonus.atk], ['防御', st.base.def, st.bonus.def], ['素早さ', st.base.spd, st.bonus.spd]];
  rows.forEach((r, i) => { const y = 238 + i * 34; ctx.font = '20px ' + FONT; ctx.fillStyle = '#cfc6b0'; ctx.fillText(r[0], 380, y); ctx.fillStyle = '#fff'; ctx.fillText(String(r[1] + r[2]), 480, y); if (r[2]) { ctx.fillStyle = '#7df08a'; ctx.fillText(`(+${r[2]})`, 530, y); } });
  // 装備
  ctx.font = '20px ' + FONT; ctx.fillStyle = '#ffe6a8'; ctx.fillText('そうび', 660, 110);
  ['w', 'a', 'c'].forEach((s, i) => { const y = 148 + i * 40; ctx.fillStyle = '#cfc6b0'; ctx.fillText(SLOT_NAME[s], 660, y); ctx.fillStyle = eq[s] ? '#fff' : '#777'; ctx.fillText(eq[s] ? GEAR[eq[s]].name : 'なし', 730, y); });
  // 技
  const sk = skillsOf(m.id), nl = nextLearn(m.id);
  if (sk.length) { ctx.fillStyle = '#ffe6a8'; ctx.fillText('わざ', 660, 270); sk.slice(0, 6).forEach((k, i) => { ctx.fillStyle = '#fff'; ctx.font = '17px ' + FONT; ctx.fillText(SKILLS[k].once ? `${SKILLS[k].name}  1戦闘1回` : `${SKILLS[k].name}  MP${SKILLS[k].mp}`, 660, 300 + i * 26); }); ctx.font = '20px ' + FONT; }
  if (nl && SKILLS[nl[1]]) { ctx.font = '15px ' + FONT; ctx.fillStyle = '#9fd8ff'; ctx.fillText(`次に覚える技: ${SKILLS[nl[1]].name}(成長${nl[0]})`, 660, 474); ctx.font = '20px ' + FONT; }
  // 持ち物
  ctx.font = '18px ' + FONT; ctx.fillStyle = '#cfc6b0';
  const inv = Object.keys(ITEMS).filter(k => (S.items[k] || 0) > 0).map(k => `${ITEMS[k].name}×${S.items[k]}`).join('  ');
  ctx.fillText('持ち物: ' + (inv || 'なし'), 70, H - 60, W - 340);
  ctx.fillStyle = '#aaa'; ctx.fillText('決定/戻る: とじる', W - 250, H - 60);
}
