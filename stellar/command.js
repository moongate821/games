// ---------- STELLAR HEGEMONY ― 銀河覇権: 司令部(研究・特殊兵装・政略)。2026-09-29追加 ----------
// ユーザー要望「特殊兵装や軍事や開発や政略もできるだけ大戦略みたいに」を受け、以下をWeb調査のうえ翻案した。
// ・「大戦略」シリーズ: 拠点の研究所に資金とターン数を投じて兵器を開発する仕組み、実戦をこなした部隊が
//   熟練度を積んで新兵より強くなる仕組み(→本ファイルの研究/特殊兵装、hexbattle.jsの熟練=veteran)。
// ・「信長の野望」シリーズ: 調略(流言=対象の忠誠を下げる、引抜=忠誠の低い武将を寝返らせる)、
//   内政(開発投資で所領の産出を増やす)の仕組み(→本ファイルの調略/内政)。
// 画面はダンジョンゲーム流の「小さなカードの一覧をタップ/決定で選ぶ」UIに合わせ、gallery.jsのタブ切替に倣う。

// ---------- 研究(開発) ----------
function startResearch(faction, cat) {
  const r = GAME.research[faction];
  if (r.active) return { ok: false, msg: '既に別の研究が進行中' };
  const def = TECH_DEFS[cat], lv = r[cat] || 0;
  if (lv >= def.maxLevel) return { ok: false, msg: '既に最大Lvに到達済み' };
  const cost = def.costOf(lv);
  if (GAME.resources[faction] < cost) return { ok: false, msg: '資源が不足している' };
  GAME.resources[faction] -= cost;
  r.active = { cat, turnsLeft: def.turnsOf(lv), targetLevel: lv + 1 };
  pushLog(`${FACTION[faction].short}、${def.name}(目標Lv.${lv + 1})に着手。`);
  return { ok: true };
}
// ターン送り時に呼ぶ(starmap.jsのendStrategyTurnから)。研究が完了したら陣営のLvを上げる。
function tickResearch() {
  for (const faction of ['empire', 'republic']) {
    const r = GAME.research[faction]; if (!r.active) continue;
    r.active.turnsLeft--;
    if (r.active.turnsLeft <= 0) {
      const { cat, targetLevel } = r.active;
      r[cat] = targetLevel;
      pushLog(`${FACTION[faction].short}、${TECH_DEFS[cat].name}がLv.${targetLevel}に到達。`);
      r.active = null;
    }
  }
}
// NPC陣営の自動研究(生産の自動判定と同様、1ターンにつき1回だけ判定する)
function aiResearchTick() {
  const faction = aiFactionOf(), r = GAME.research[faction];
  if (r.active || Math.random() >= 0.25) return;
  const cands = TECH_ORDER.filter(c => (r[c] || 0) < TECH_DEFS[c].maxLevel && GAME.resources[faction] >= TECH_DEFS[c].costOf(r[c] || 0));
  if (!cands.length) return;
  startResearch(faction, cands[Math.floor(Math.random() * cands.length)]);
}
// 研究レベルによる戦闘効果の倍率(hexbattle.jsのperformAttackから参照)
function techAtkMul(faction) { return 1 + GAME.research[faction].weapon * 0.05; }
function techDefMul(faction) { return 1 - GAME.research[faction].armor * 0.05; }
function techEvadeBonus(faction) { return GAME.research[faction].ecm * 0.04; }

// ---------- 特殊兵装 ----------
function unlockedEquip(faction) {
  const lv = GAME.research[faction].ecm;
  return EQUIP_ORDER.filter(id => EQUIP_DEFS[id].unlockLv <= lv);
}
function equipFleet(fleetId, equipId) {
  const f = GAME.fleets.find(x => x.id === fleetId); if (!f) return { ok: false, msg: '艦隊が見当たらない' };
  const def = EQUIP_DEFS[equipId]; if (!def) return { ok: false, msg: '不明な装備' };
  if (!unlockedEquip(f.faction).includes(equipId)) return { ok: false, msg: 'まだ開放されていない' };
  if (GAME.resources[f.faction] < def.cost) return { ok: false, msg: '資源が不足している' };
  GAME.resources[f.faction] -= def.cost;
  f.equip = equipId;
  pushLog(`${FACTION[f.faction].short}艦隊(${f.admiral.name})、${def.name}を装備。`);
  return { ok: true };
}
// 艦隊の特殊兵装フラグ(hexbattle.jsのperformAttackから参照する、艦隊単位のヘルパー)
function fleetOfUnit(u) { return GAME.fleets.find(f => f.id === u.fleetId); }

// ---------- 政略: 調略(信長の野望の「流言」「引抜」を1コマンドに翻案) ----------
function subvertChanceOf(admiral) { return Math.max(0.06, Math.min(0.75, (100 - admiral.loyalty) / 140)); }
function attemptSubvert(targetFleetId) {
  const faction = GAME.playerFaction;
  if (GAME.resources[faction] < POLITICS.subvertCost) return { ok: false, msg: '資源が不足している' };
  const f = GAME.fleets.find(x => x.id === targetFleetId); if (!f || f.faction === faction) return { ok: false, msg: '対象が不正' };
  GAME.resources[faction] -= POLITICS.subvertCost;
  const admiral = f.admiral, from = f.faction, chance = subvertChanceOf(admiral);
  if (Math.random() < chance) {
    // 引抜成功: 信長の野望で「城主が寝返ると城ごと寝返る」のに倣い、提督が艦隊ごと寝返る。
    f.faction = faction; admiral.faction = faction; admiral.loyalty = 55;
    pushLog(`調略成功。${FACTION[from].short}の${admiral.name}提督が艦隊ごと${FACTION[faction].short}へ寝返った。`);
    return { ok: true, success: true };
  }
  // 失敗(流言): 寝返りまでは至らないが、忠誠を揺るがす。
  admiral.loyalty = Math.max(0, admiral.loyalty - 15);
  pushLog(`調略は不発に終わったが、${admiral.name}提督の忠誠を揺るがした。`);
  return { ok: true, success: false };
}
// ---------- 政略: 内政(開発投資) ----------
function investInSystem(sysId) {
  const sys = systemById(sysId); if (!sys || sys.owner !== GAME.playerFaction) return { ok: false, msg: '対象が不正' };
  const lv = sys.devLevel || 0; if (lv >= POLITICS.investMaxLevel) return { ok: false, msg: '開発済み' };
  const cost = POLITICS.investCost(lv);
  if (GAME.resources[GAME.playerFaction] < cost) return { ok: false, msg: '資源が不足している' };
  GAME.resources[GAME.playerFaction] -= cost;
  sys.devLevel = lv + 1;
  pushLog(`${sys.name}に開発投資、産出がLv.${sys.devLevel}に向上。`);
  return { ok: true };
}

// ---------- 指令画面(戦略画面右上の「指令」ボタンから開く) ----------
// CMD_LIST_Y/CMD_ROW_H/CMD_LIST_BOTTOM_MARGIN: 一覧が縦に収まりきらない場合(所有星系が多い内政タブ等)に
// スクロールさせるための座標定数。値はdrawCommand()の描画と一致させること。
const CMD_LIST_Y = 96, CMD_ROW_H = 74, CMD_LIST_BOTTOM_MARGIN = 56;
function cmdFreshState() { return { tab: 'research', sel: null, cursorIdx: 0, scroll: 0, msgText: '', msgOk: true, msgAt: -1e9, lastMoveAt: 0 }; }
let cmd = cmdFreshState();
let cmdRects = { tabs: [], back: null, rows: [] };
function cmdTabs() { return ['research', 'build', 'equip', 'political', 'engineering']; }
function openCommand() {
  if (!GAME || GAME.phase !== 'strategy') return;
  GAME.phase = 'command'; cmd = cmdFreshState();
  SND.se('tick');
}
function closeCommand() { if (GAME.phase === 'command') GAME.phase = 'strategy'; }
function cmdMsg(res) {
  cmd.msgAt = millis(); cmd.msgOk = res.ok !== false;
  if (!res.ok) cmd.msgText = `実行できない(${res.msg || '条件を満たしていない'})`;
  else if (res.success === true) cmd.msgText = '調略成功。艦隊が寝返った。';
  else if (res.success === false) cmd.msgText = '調略は失敗。相手の忠誠を揺るがした。';
  else cmd.msgText = '実行した。';
}
// タップ(マウス/タッチ)に加え、ゲームパッド/キーボードでも上下カーソル+決定ボタンで行を選べるようにする。
function updateCommandInput(input) {
  if (input.tabLEdge || input.tabREdge) {
    const tabs = cmdTabs(), i = tabs.indexOf(cmd.tab);
    cmd.tab = tabs[(i + (input.tabREdge ? 1 : -1) + tabs.length) % tabs.length]; cmd.sel = null; cmd.cursorIdx = 0; cmd.scroll = 0;
    SND.se('tick'); return;
  }
  if (input.cancelEdge) { if (cmd.sel) { cmd.sel = null; cmd.cursorIdx = 0; cmd.scroll = 0; } else closeCommand(); return; }
  if (Math.abs(input.my) > 0.5 && millis() - cmd.lastMoveAt > 200 && cmdRects.rows.length) {
    cmd.lastMoveAt = millis();
    cmd.cursorIdx = (cmd.cursorIdx + Math.sign(input.my) + cmdRects.rows.length) % cmdRects.rows.length;
    // 一覧が画面に収まらない場合、フォーカス中の行が見えるようスクロールを追従させる(概算。実際の上限はdrawCommandで再度clampする)
    const rowVY = cmd.cursorIdx * CMD_ROW_H, visibleH = (H - CMD_LIST_BOTTOM_MARGIN) - CMD_LIST_Y;
    if (rowVY < cmd.scroll) cmd.scroll = rowVY;
    if (rowVY + CMD_ROW_H > cmd.scroll + visibleH) cmd.scroll = rowVY + CMD_ROW_H - visibleH;
    SND.se('tick');
  }
  if (input.confirmEdge && cmdRects.rows[cmd.cursorIdx]) { cmdRects.rows[cmd.cursorIdx].action(); SND.se('ok'); return; }
  if (input.pointer.tapped) {
    const x = input.pointer.tapX, y = input.pointer.tapY;
    const hit = r => x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h;
    if (cmdRects.back && hit(cmdRects.back)) { closeCommand(); return; }
    for (const t of cmdRects.tabs) if (hit(t)) { cmd.tab = t.tab; cmd.sel = null; cmd.cursorIdx = 0; cmd.scroll = 0; SND.se('tick'); return; }
    for (const r of cmdRects.rows) if (hit(r)) { r.action(); SND.se('ok'); return; }
  }
}
// マウスホイール/タッチスクロールでの一覧スクロール(sketch.jsのmouseWheelから呼ぶ)。上限はdrawCommandでclampする。
function cmdScrollBy(delta) { cmd.scroll = Math.max(0, cmd.scroll + delta); }
function cmdRow(x, y, w, h, col, action) {
  const idx = cmdRects.rows.length, focused = idx === cmd.cursorIdx;
  drawHudPanel(x, y, w, h, col);
  if (focused) { noFill(); stroke(255, 255, 255, 210); strokeWeight(2); rect(x, y, w, h); noStroke(); }
  cmdRects.rows.push({ x, y, w, h, action });
}
function cmdBackRow(x, y) {
  cmdRow(x, y, 140, 34, [150, 150, 160], () => { cmd.sel = null; cmd.cursorIdx = 0; cmd.scroll = 0; });
  noStroke(); fill(220); textAlign(CENTER, CENTER); textSize(11); text('◀ 戻る', x + 70, y + 17);
}
function drawCommand() {
  const faction = GAME.playerFaction;
  push();
  noStroke(); fill(4, 7, 13); rect(0, 0, W, H);
  fill(70, 90, 110, 90);
  for (let i = 0; i < 50; i++) { const hx = hashStr('cs' + i), x = hx % 1280, y = (hx >> 8) % 720; ellipse(x, y, 1.3); }
  cmdRects = { tabs: [], back: null, rows: [] };

  // タブ
  const tabs = cmdTabs(), tabNames = { research: '研究(開発)', build: '艦艇建造', equip: '特殊兵装', political: '政略', engineering: '工作' };
  const tabW = 168, tabY = 16;
  tabs.forEach((t, i) => {
    const x = 18 + i * (tabW + 8), on = t === cmd.tab;
    drawHudPanel(x, tabY, tabW, 38, on ? [255, 210, 120] : [80, 110, 130]);
    noStroke(); fill(on ? 255 : 170); textAlign(CENTER, CENTER); textSize(13); text(tabNames[t], x + tabW / 2, tabY + 19);
    cmdRects.tabs.push({ x, y: tabY, w: tabW, h: 38, tab: t });
  });
  const backX = W - 168, backY = 16, backW = 150, backH = 38;
  drawHudPanel(backX, backY, backW, backH, [150, 150, 160]);
  noStroke(); fill(220); textAlign(CENTER, CENTER); textSize(12); text('◀ 戦略画面へ', backX + backW / 2, backY + 19);
  cmdRects.back = { x: backX, y: backY, w: backW, h: backH };

  noStroke(); fill(FACTION[faction].colorRgb); textAlign(LEFT, TOP); textSize(13);
  text(`${FACTION[faction].name}  保有資源 ${Math.floor(GAME.resources[faction])}`, 18, 66);

  // 一覧が画面に収まらない場合にスクロールできるよう、リスト領域をクリップし、実際の描画Yは
  // 「積み上げ用の仮想Y(yy、スクロール量に関係なく増え続ける)」からcmd.scroll分を引いた位置にする。
  // これにより、画面外にスクロールした行は当たり判定(cmdRects.rowsの座標)も自然に画面外になり、誤タップしない。
  const listX = 18, listY = CMD_LIST_Y, listW = W - 36, rowH = CMD_ROW_H, listBottom = H - CMD_LIST_BOTTOM_MARGIN;
  const sy = vy => vy - cmd.scroll;
  drawingContext.save(); drawingContext.beginPath(); drawingContext.rect(0, listY - 6, W, listBottom - (listY - 6)); drawingContext.clip();
  let yy = listY;
  if (cmd.tab === 'research') {
    const r = GAME.research[faction];
    for (const cat of TECH_ORDER) {
      const def = TECH_DEFS[cat], lv = r[cat] || 0, maxed = lv >= def.maxLevel, isActive = r.active && r.active.cat === cat, ry = sy(yy);
      cmdRow(listX, ry, listW, rowH - 8, isActive ? [255, 210, 120] : maxed ? [110, 140, 110] : [90, 150, 190], () => cmdMsg(startResearch(faction, cat)));
      noStroke(); fill(230); textAlign(LEFT, TOP); textSize(14); text(`${def.name}  Lv.${lv}/${def.maxLevel}`, listX + 16, ry + 10);
      // 2026-09-29(4回目)追加: 惑星型戦闘艦(決戦兵器)が兵装研究の最大Lv到達で建造解禁されることを、該当の行に注記する。
      const descText = cat === 'weapon' ? `${def.desc}(惑星型戦闘艦には兵装Lv.5と造船Lv.5の両方が必要)` : def.desc;
      fill(180); textSize(11); text(descText, listX + 16, ry + 32, listW - 230, 30);
      fill(210); textAlign(RIGHT, TOP); textSize(11);
      if (maxed) text('研究完了', listX + listW - 16, ry + 10);
      else if (isActive) text(`研究中 残り${r.active.turnsLeft}ターン`, listX + listW - 16, ry + 10);
      else if (r.active) text('他の研究が進行中', listX + listW - 16, ry + 10);
      else text(`費用${def.costOf(lv)} / ${def.turnsOf(lv)}ターン`, listX + listW - 16, ry + 10);
      yy += rowH;
    }
  } else if (cmd.tab === 'build') {
    const order = GAME.buildQueue && GAME.buildQueue[faction], lv = GAME.research[faction].shipyard || 0;
    noStroke(); fill(210); textAlign(LEFT, TOP); textSize(12);
    text(order ? `造船Lv.${lv}  ·  建造中: ${SHIPS[order.typeId].name}  残り${order.turnsLeft}ターン  ·  ${systemNameOf(order.systemId)}` : `造船Lv.${lv}  ·  建造命令を選択  ·  竣工後は造船星系の艦隊へ配備`, listX + 5, sy(yy) + 2);
    yy += 33;
    for (const id of BUILD_QUEUE_TYPES) {
      const type = SHIPS[id], tid = id, ry = sy(yy), open = shipUnlockedFor(id, GAME.research[faction]), room = canBuildMore(faction, id);
      const locked = !open || !room || !!order;
      cmdRow(listX, ry, listW, rowH - 8, locked ? [74, 98, 115] : [106, 175, 201], () => cmdMsg(queueShipBuild(faction, tid)));
      noStroke(); fill(open ? 234 : 158); textAlign(LEFT, TOP); textSize(13);
      text(`${type.name}  [${id}]`, listX + 16, ry + 10);
      fill(172, 188, 202); textSize(11);
      const req = id === 'PL' ? '造船Lv.5 + 兵装Lv.5' : `造船Lv.${type.buildLv || 0}`;
      text(`${req}  ·  耐久${type.hp} / シールド${type.shield}  ·  ${type.capital ? '主力艦' : '支援・護衛艦'}${type.activeCap ? `  ·  上限${type.activeCap}隻` : ''}`, listX + 16, ry + 32);
      fill(open && !order ? [222, 235, 241] : [156, 173, 185]); textAlign(RIGHT, TOP); textSize(11);
      text(!open ? '研究待ち' : !room ? '保有上限' : order ? '造船所が稼働中' : `費用${type.cost} / ${shipBuildTurns(id)}ターン`, listX + listW - 16, ry + 10);
      yy += rowH;
    }
  } else if (cmd.tab === 'equip') {
    const mine = fleetsOfFaction(faction);
    if (!cmd.sel) {
      if (!mine.length) { noStroke(); fill(170); textAlign(LEFT, TOP); textSize(12); text('自軍艦隊がありません。', listX + 16, sy(yy) + 10); }
      for (const f of mine) {
        const fid = f.id, ry = sy(yy);
        cmdRow(listX, ry, listW, rowH - 8, [90, 150, 190], () => { cmd.sel = fid; cmd.cursorIdx = 0; cmd.scroll = 0; });
        noStroke(); fill(230); textAlign(LEFT, TOP); textSize(13); text(`${f.admiral.name}(${RANKS[f.admiral.rank].name})  ${f.systemId ? systemNameOf(f.systemId) : '航行中'}`, listX + 16, ry + 10);
        fill(180); textSize(11); text(`現在の装備: ${f.equip ? EQUIP_DEFS[f.equip].name : 'なし'}`, listX + 16, ry + 32);
        yy += rowH;
      }
    } else {
      const f = mine.find(x => x.id === cmd.sel), unlocked = unlockedEquip(faction);
      noStroke(); fill(200); textAlign(LEFT, TOP); textSize(12); text(f ? `対象艦隊: ${f.admiral.name}` : '', listX, sy(yy)); yy += 24;
      if (!unlocked.length) { fill(170); textSize(12); text('電子戦研究を進めると特殊兵装が開放されます。', listX + 16, sy(yy) + 10); yy += rowH; }
      for (const id of unlocked) {
        const def = EQUIP_DEFS[id], fid = cmd.sel, ry = sy(yy);
        cmdRow(listX, ry, listW, rowH - 8, [90, 190, 150], () => { const res = equipFleet(fid, id); cmdMsg(res); if (res.ok) { cmd.sel = null; cmd.cursorIdx = 0; cmd.scroll = 0; } });
        noStroke(); fill(230); textAlign(LEFT, TOP); textSize(13); text(def.name, listX + 16, ry + 10);
        fill(180); textSize(11); text(def.desc, listX + 16, ry + 32, listW - 160, 26);
        fill(210); textAlign(RIGHT, TOP); textSize(11); text(`費用${def.cost}`, listX + listW - 16, ry + 10);
        yy += rowH;
      }
      cmdBackRow(listX, sy(yy)); yy += 44;
    }
  } else if (cmd.tab === 'political') {
    if (!cmd.sel) {
      const menu = [
        { id: 'subvert', name: '調略(引抜)', desc: '敵提督に働きかけて忠誠を揺るがす。成功すれば艦隊ごと寝返る' },
        { id: 'invest', name: '内政(開発投資)', desc: '自国星系に投資し、産出資源を恒久的に増やす' },
      ];
      for (const m of menu) {
        const mid = m.id, ry = sy(yy);
        cmdRow(listX, ry, listW, rowH - 8, [190, 150, 90], () => { cmd.sel = mid; cmd.cursorIdx = 0; cmd.scroll = 0; });
        noStroke(); fill(230); textAlign(LEFT, TOP); textSize(13); text(m.name, listX + 16, ry + 10);
        fill(180); textSize(11); text(m.desc, listX + 16, ry + 32, listW - 40, 26);
        yy += rowH;
      }
    } else if (cmd.sel === 'subvert') {
      const enemies = GAME.fleets.filter(f => f.faction !== faction);
      if (!enemies.length) { noStroke(); fill(170); textAlign(LEFT, TOP); textSize(12); text('対象となる敵艦隊がありません。', listX + 16, sy(yy) + 10); yy += rowH; }
      for (const f of enemies) {
        const chance = Math.round(subvertChanceOf(f.admiral) * 100), fid = f.id, ry = sy(yy);
        cmdRow(listX, ry, listW, rowH - 8, [190, 110, 110], () => cmdMsg(attemptSubvert(fid)));
        noStroke(); fill(230); textAlign(LEFT, TOP); textSize(13); text(`${FACTION[f.faction].short} ${f.admiral.name}(${RANKS[f.admiral.rank].name})  ${f.systemId ? systemNameOf(f.systemId) : '航行中'}`, listX + 16, ry + 10);
        fill(180); textSize(11); text(`忠誠 ${f.admiral.loyalty}  成功率目安 約${chance}%`, listX + 16, ry + 32);
        fill(210); textAlign(RIGHT, TOP); textSize(11); text(`費用${POLITICS.subvertCost}`, listX + listW - 16, ry + 10);
        yy += rowH;
      }
      cmdBackRow(listX, sy(yy)); yy += 44;
    } else if (cmd.sel === 'invest') {
      const mine = GAME.systems.filter(s => s.owner === faction);
      for (const s of mine) {
        const lv = s.devLevel || 0, maxed = lv >= POLITICS.investMaxLevel, sid = s.id, ry = sy(yy);
        cmdRow(listX, ry, listW, rowH - 8, maxed ? [110, 140, 110] : [110, 190, 130], () => { if (!maxed) cmdMsg(investInSystem(sid)); });
        noStroke(); fill(230); textAlign(LEFT, TOP); textSize(13); text(`${s.name}${s.fortress ? '(要塞)' : ''}  開発Lv.${lv}/${POLITICS.investMaxLevel}`, listX + 16, ry + 10);
        fill(180); textSize(11); text(`産出ボーナス +${lv * POLITICS.investBonus}/ターン`, listX + 16, ry + 32);
        fill(210); textAlign(RIGHT, TOP); textSize(11); text(maxed ? '開発済み' : `費用${POLITICS.investCost(lv)}`, listX + listW - 16, ry + 10);
        yy += rowH;
      }
      cmdBackRow(listX, sy(yy)); yy += 44;
    }
  } else if (cmd.tab === 'engineering') {
    // 工作(2026-09-29追加): 自国星系のうち、自軍の工作艦(ES)が在泊しているものにだけ機雷を敷設できる。
    const mine = GAME.systems.filter(s => s.owner === faction);
    const hasES = sysId => fleetsAt(sysId).some(f => f.faction === faction && f.ships.some(sh => sh.alive && sh.type === 'ES'));
    for (const s of mine) {
      const lv = s.mines || 0, maxed = lv >= MINES.maxLevel, es = hasES(s.id), sid = s.id, ry = sy(yy);
      cmdRow(listX, ry, listW, rowH - 8, maxed ? [110, 140, 110] : es ? [150, 170, 210] : [90, 100, 115], () => { if (!maxed && es) cmdMsg(layMines(sid)); else cmdMsg({ ok: false, msg: es ? '既に最大Lv' : 'この星系に工作艦がいない' }); });
      noStroke(); fill(230); textAlign(LEFT, TOP); textSize(13); text(`${s.name}${s.fortress ? '(要塞)' : ''}  機雷Lv.${lv}/${MINES.maxLevel}${es ? '' : '(工作艦なし)'}`, listX + 16, ry + 10);
      fill(180); textSize(11); text('自国星系に工作艦を在泊させると敷設できる。侵入した敵艦隊に被害を与える', listX + 16, ry + 32);
      fill(210); textAlign(RIGHT, TOP); textSize(11); text(maxed ? '敷設済み' : `費用${MINES.layCost(lv)}`, listX + listW - 16, ry + 10);
      yy += rowH;
    }
    if (!mine.length) { noStroke(); fill(170); textAlign(LEFT, TOP); textSize(12); text('自国星系がありません。', listX + 16, sy(yy) + 10); }
  }
  drawingContext.restore();
  // このフレームで積み上がった実際のコンテンツ高さに合わせて、スクロール量を有効範囲にclampする
  // (項目数が減った直後などで一時的に大きすぎる場合、次フレームで即補正される)。
  const maxScroll = Math.max(0, (yy - listY) - (listBottom - listY));
  cmd.scroll = Math.max(0, Math.min(maxScroll, cmd.scroll));

  if (millis() - cmd.msgAt < 3500 && cmd.msgText) {
    noStroke(); fill(cmd.msgOk ? [150, 230, 170] : [255, 150, 130]); textAlign(LEFT, TOP); textSize(12);
    text(cmd.msgText, 18, H - 40);
  }
  fill(150); textAlign(RIGHT, BOTTOM); textSize(10.5); noStroke();
  text('L/R=タブ切替 タップ/決定=選択 取消=戻る' + (maxScroll > 0 ? '  ホイール/スティックでスクロール' : ''), W - 18, H - 12);
  pop();
}

if (typeof module !== 'undefined') module.exports = {
  startResearch, tickResearch, aiResearchTick, techAtkMul, techDefMul, techEvadeBonus,
  unlockedEquip, equipFleet, fleetOfUnit, subvertChanceOf, attemptSubvert, investInSystem,
  openCommand, closeCommand, updateCommandInput, drawCommand,
};
