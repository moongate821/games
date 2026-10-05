// ---------- STELLAR HEGEMONY ― 銀河覇権: ストーリーモード・ミッションモード(2026-09-29追加) ----------
// ユーザー要望「ストーリーモードやミッションモードも」を受け、これまでに実装した特殊環境(回廊・小惑星帯・
// 恒星近傍・重力嵐)や新艦種(工作艦・ステルス艦)を一通り体験できる、5章構成の短い戦役を用意した。
// 「ミッション」= 5つの局地戦をいつでも自由に選んで遊べるモード(大戦略シリーズのシナリオ選択に相当)。
// 「ストーリー」= その5つを、艦隊指揮官レオン・ヴァイス(星冠帝国軍)の視点の短い状況説明つきで順番に進める戦役。
// 両者は同じミッション定義・同じ戦闘処理(startNextBattle等)を共有し、進行度だけをlocalStorageに保存する。
const MISSIONS = [
  {
    id: 'm1', chapter: 1, zone: 'corridor', fortress: false,
    title: '第一章 ― 無名回廊の狼火',
    playerComp: ['DD', 'DD', 'DD', 'FR', 'FR', 'FR', 'MA'],
    enemyComp: ['DD', 'DD', 'DD', 'DD', 'FR', 'FR', 'FR'],
    briefing: '「……閣下、賊軍別動隊が無名回廊に向かっております」\n回廊は狭く、先に布陣した側が圧倒的に有利となる隘路である。我が艦隊は既にその奥に身を潜めている。敵が踏み込んだ瞬間、雌雄は決する。',
    debriefWin: '奇襲は完璧だった。回廊に踏み込んだ敵別動隊は、為すすべもなく殲滅された。この緒戦の勝利が、後の戦役全体の呼び水となる。',
    debriefLose: '待ち伏せは、逆に鋭く反撃された。艦隊は後退を余儀なくされ、無名回廊は依然として係争の地であり続けている。',
  },
  {
    id: 'm2', chapter: 2, zone: 'asteroid', fortress: false,
    title: '第二章 ― イゼル小惑星帯の掃討',
    playerComp: ['CA', 'CA', 'CA', 'DD', 'DD', 'FR', 'FR', 'TB', 'TB'],
    enemyComp: ['CA', 'CA', 'CA', 'DD', 'DD', 'FR', 'FR', 'TB'],
    briefing: '岩塊の海、イゼル小惑星帯。新たに竣工した巡航艦と雷撃艇を投入する。岩塊の陰を進む小型艦隊の用兵が、この掃討戦を左右する。',
    debriefWin: '小惑星の陰に隠れた雷撃艇隊が、敵の巡航艦隊を崩した。造船計画を進めた成果が初めて戦場に現れた。',
    debriefLose: '岩塊との接触損害が艦隊を蝕み、態勢を立て直す間もなく撃退された。この宙域の制圧は、後日を期すこととなった。',
  },
  {
    id: 'm3', chapter: 3, zone: 'star', fortress: false,
    title: '第三章 ― タナトス恒星域の火線',
    playerComp: ['BB', 'BB', 'CA', 'CA', 'CV', 'DD', 'FR'],
    enemyComp: ['BB', 'BB', 'CA', 'CA', 'CV', 'DD', 'DD'],
    briefing: '死を意味する名を持つ恒星、タナトス。その灼熱の放射はビーム兵器の出力を押し上げるが、両軍の乗員を等しく焼く諸刃の剣でもある。艦載機隊の出撃が、この一戦の帰趨を分けるだろう。',
    debriefWin: 'ビーム砲列の斉射が、恒星の光にまぎれて敵艦隊を刺し貫いた。艦載機隊もまた、抜群の働きを見せた。',
    debriefLose: '恒星の熱線は、我が方にも容赦なかった。消耗戦の果てに、艦隊は撤退を選ばざるを得なかった。',
  },
  {
    id: 'm4', chapter: 4, zone: 'gravity', fortress: false,
    title: '第四章 ― ヴェスパー超重力域の死闘',
    playerComp: ['DN', 'DN', 'BB', 'BB', 'CA', 'CA', 'DD', 'DD', 'FR'],
    enemyComp: ['DN', 'BB', 'BB', 'CA', 'CA', 'CA', 'DD', 'DD', 'CV'],
    briefing: 'ヴェスパー超重力域。事象の地平線に近いこの海域では、ラウンドを重ねるごとに潮汐力が増し、大型艦を容赦なく引き裂く。新造の超弩級艦二隻を投入する時が来た。長期戦は許されない。',
    debriefWin: '超弩級艦の主砲が趨勢を決めた。だが、ブラックホールの潮汐力は味方にも牙を剥いており、辛勝と呼ぶべき一戦であった。',
    debriefLose: '重力の変化に翻弄され、艦隊は組織的な抵抗力を失った。ヴェスパーの深淵は、多くの将兵を飲み込んだ。',
  },
  {
    id: 'm5', chapter: 5, zone: 'corridor', fortress: true, playerIsAttacker: true,
    title: '第五章(終章) ― 要塞回廊、最終決戦',
    playerComp: ['PL', 'DN', 'DN', 'BB', 'BB', 'CA', 'CA', 'CV', 'DD', 'DD', 'ES', 'ST', 'ST'],
    enemyComp: ['PL', 'DN', 'BB', 'BB', 'CA', 'CA', 'CA', 'CV', 'DD', 'DD', 'FR', 'FR'],
    briefing: '敵の牙城たる要塞回廊。狭い航路の奥に要塞主砲が待ち構え、先に布陣する敵に奇襲の利がある。工作艦とステルス艦を伴う混成艦隊による強襲のみが、この戦役に終止符を打つ。',
    debriefWin: '要塞回廊は陥落した。ステルス艦の奇襲と工作艦の後方支援が、正攻法だけでは崩せぬ堅陣をこじ開けたのである。この日、覇権の帰趨は定まった。',
    debriefLose: '要塞主砲と敵の奇襲の前に、強襲部隊は大きな損害を出して後退した。戦役はなお長引くことになる。',
  },
];

// ---------- 進行度(localStorage) ----------
function loadMissionProgress() {
  try { return JSON.parse(localStorage.getItem('sh_mission_progress') || 'null') || { cleared: [], storyChapter: 1 }; }
  catch (e) { return { cleared: [], storyChapter: 1 }; }
}
function saveMissionProgress(p) { try { localStorage.setItem('sh_mission_progress', JSON.stringify(p)); } catch (e) { /* 保存できなくても続行 */ } }
function markMissionCleared(mission) {
  const p = loadMissionProgress();
  if (!p.cleared.includes(mission.id)) p.cleared.push(mission.id);
  if (mission.chapter === p.storyChapter) p.storyChapter = mission.chapter + 1;
  saveMissionProgress(p);
}

// ---------- ミッションの開始(startSandboxと同じ「initGameで銀河を作り、艦隊だけ差し替える」方式) ----------
function missionSystemFor(mission) {
  if (mission.fortress) {
    const sys = GAME.systems.find(s => s.owner === 'republic' && s.fortress && !s.capital) || GAME.systems.find(s => s.owner === 'republic' && s.capital);
    if (mission.zone) sys.zone = mission.zone;   // 終章のみ、要塞星系に回廊の隘路を重ねて最大の激戦地にする
    return sys;
  }
  return GAME.systems.find(s => s.zone === mission.zone) || GAME.systems.find(s => s.owner === 'neutral') || GAME.systems[0];
}
function startMission(mission) {
  SND.resume();
  GAME = initGame(); GAME.mission = mission;
  const sys = missionSystemFor(mission);
  const pf = makeFleet('empire', sys.id, mission.playerComp);
  const ef = makeFleet('republic', sys.id, mission.enemyComp);
  GAME.fleets = [pf, ef];
  // 通常は防御側(先に布陣)をプレイヤーにする(回廊の奇襲を得るため)。終章のみプレイヤーが攻める側。
  if (mission.playerIsAttacker) GAME.battleQueue.push({ systemId: sys.id, attackerId: pf.id, defenderId: ef.id });
  else GAME.battleQueue.push({ systemId: sys.id, attackerId: ef.id, defenderId: pf.id });
  state = 'play'; paused = false; clearInputState();
  startNextBattle();
  syncAppUI(true);
}
function exitMission() { GAME = null; state = 'title'; clearInputState(); syncAppUI(true); }
function startStoryMode() {
  const p = loadMissionProgress();
  const chapter = Math.min(p.storyChapter, MISSIONS.length);
  startMission(MISSIONS.find(m => m.chapter === chapter) || MISSIONS[MISSIONS.length - 1]);
}

// ---------- ミッション選択画面(タイトル画面から「ミッション」ボタンで開く。gallery.js/command.jsと同じ意匠) ----------
let missionSel = { idx: 0, lastMove: 0, stars: null };
let missionRects = { rows: [], launch: null, back: null };
function openMissionSelect() { SND.resume(); missionSel.idx = 0; state = 'missionSelect'; clearInputState(); syncAppUI(true); }
function closeMissionSelect() { state = 'title'; clearInputState(); syncAppUI(true); }
function updateMissionSelect(input) {
  if (input.cancelEdge) { closeMissionSelect(); return; }
  const n = MISSIONS.length;
  if (Math.abs(input.my) > 0.5 && millis() - missionSel.lastMove > 200) {
    missionSel.lastMove = millis(); missionSel.idx = (missionSel.idx + Math.sign(input.my) + n) % n; SND.se('tick');
  }
  if (input.confirmEdge) { startMission(MISSIONS[missionSel.idx]); return; }
  if (input.pointer.tapped) {
    const x = input.pointer.tapX, y = input.pointer.tapY;
    const hit = r => r && x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h;
    if (hit(missionRects.back)) { closeMissionSelect(); return; }
    if (hit(missionRects.launch)) { startMission(MISSIONS[missionSel.idx]); return; }
    for (let i = 0; i < missionRects.rows.length; i++) if (hit(missionRects.rows[i])) { missionSel.idx = i; SND.se('tick'); return; }
  }
}
function drawMissionSelect() {
  if (!missionSel.stars) { missionSel.stars = []; for (let i = 0; i < 110; i++) missionSel.stars.push({ x: hrand(i * 2) * W, y: hrand(i * 2 + 1) * H, r: hrand(i + 9) < 0.15 ? 1.6 : 0.9, a: 60 + hrand(i + 3) * 140 }); }
  const prog = loadMissionProgress(), t = millis() / 1000;
  push();
  noStroke(); fill(4, 7, 14); rect(0, 0, W, H);
  for (const s of missionSel.stars) { fill(200, 220, 255, s.a); ellipse(s.x, s.y, s.r * 2); }
  missionRects = { rows: [], launch: null, back: null };

  fill(230); textAlign(LEFT, TOP); textSize(18); text('ミッション選択', 20, 16);
  fill(150, 170, 185); textSize(11); text('上下・タップで選択、決定または「出撃」で開始、取消で戻る', 20, 42);
  const backX = W - 130, backY = 16, backW = 110, backH = 36;
  drawHudPanel(backX, backY, backW, backH, [110, 130, 150]);
  noStroke(); fill(220); textAlign(CENTER, CENTER); textSize(13); text('戻る', backX + backW / 2, backY + backH / 2);
  missionRects.back = { x: backX, y: backY, w: backW, h: backH };

  const listX = 20, listY = 76, listW = 430, rowH = 92;
  for (let i = 0; i < MISSIONS.length; i++) {
    const m = MISSIONS[i], y = listY + i * rowH, on = i === missionSel.idx, cleared = prog.cleared.includes(m.id);
    drawHudPanel(listX, y, listW, rowH - 10, on ? [212, 175, 55] : [70, 100, 120]);
    noStroke(); fill(on ? 255 : 200); textAlign(LEFT, TOP); textSize(13); text(m.title + (cleared ? '  ✓制圧済' : ''), listX + 14, y + 10);
    fill(150, 170, 185); textSize(10.5); text(`環境: ${ZONE[m.zone] ? ZONE[m.zone].label : '通常宙域'}${m.fortress ? '(要塞)' : ''}`, listX + 14, y + 32);
    fill(170); textSize(10); text(`自軍: ${m.playerComp.map(c => SHIPS[c].id).join(' ')}`, listX + 14, y + 50, listW - 28, 24);
    missionRects.rows.push({ x: listX, y, w: listW, h: rowH - 10 });
  }

  const cur = MISSIONS[missionSel.idx], dx = listX + listW + 24, dy = 76, dw = W - dx - 24, dh = 470;
  drawHudPanel(dx, dy, dw, dh, [200, 170, 90]);
  noStroke(); fill(230); textAlign(LEFT, TOP); textSize(20); text(cur.title, dx + 24, dy + 18);
  fill(150, 170, 185); textSize(11); text(`特殊環境: ${ZONE[cur.zone] ? ZONE[cur.zone].label : '通常宙域'}${cur.fortress ? '(要塞星系)' : ''}`, dx + 24, dy + 50);
  fill(210); textSize(13); text(cur.briefing, dx + 24, dy + 78, dw - 48, 170);
  fill(170); textSize(11); text(`自軍編成: ${cur.playerComp.map(c => SHIPS[c].name).join(' / ')}`, dx + 24, dy + 260, dw - 48, 80);
  fill(170); textSize(11); text(`敵編成: ${cur.enemyComp.map(c => SHIPS[c].name).join(' / ')}`, dx + 24, dy + 340, dw - 48, 80);
  const lx = dx + 24, ly = dy + dh - 62, lw = 160, lh = 42;
  drawHudPanel(lx, ly, lw, lh, [255, 210, 120]);
  noStroke(); fill(255, 225, 150); textAlign(CENTER, CENTER); textSize(14); text('出撃 ↗', lx + lw / 2, ly + lh / 2);
  missionRects.launch = { x: lx, y: ly, w: lw, h: lh };

  drawTouchUI();
  pop();
}

if (typeof module !== 'undefined') module.exports = {
  MISSIONS, loadMissionProgress, saveMissionProgress, markMissionCleared,
  startMission, exitMission, startStoryMode, openMissionSelect, closeMissionSelect, updateMissionSelect, drawMissionSelect,
};
