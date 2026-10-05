// ---------- STELLAR HEGEMONY ― 銀河覇権: 艦艇図鑑(ワイヤーフレームモデルの閲覧)と、模擬戦(両艦隊をAIが戦わせる観戦) ----------
// 2026-09-28追加。ユーザー要望「戦闘艦・護衛艦・駆逐艦・空母・艦載機・惑星型戦闘艦等を調べて、ワイヤーフレームで各艦隊を作り、AIで戦闘させる方式がほしい」。

const GALLERY_CLASSES = ['PL', 'DN', 'BB', 'CC', 'CV', 'CA', 'DD', 'FR', 'TB', 'ES', 'ST', 'MA', 'FT'];
const GAL_SIZE = { PL: 400, DN: 520, BB: 470, CC: 440, CV: 500, CA: 430, DD: 380, FR: 360, TB: 380, ES: 400, ST: 380, MA: 400, FT: 330 };
const SHIP_LORE = {
  PL: { name: '惑星型戦闘艦', e: '球体の艦体に、赤道の溝と巨大な集束砲の皿を備えた移動要塞。デス・スターのような「動く惑星」の系譜。極めて高価で鈍重だが、一隻で艦隊に匹敵する火力と防御を持つ。', r: '球体の艦体に、巨大な主砲の砲口と環状ドックを備えた移動要塞。イゼルローン要塞のような「動く城塞」の系譜。極めて高価で鈍重だが、一隻で艦隊に匹敵する火力と防御を持つ。' },
  DN: { name: '超弩級艦', e: '艦隊旗艦を務める最大級の戦艦。楔形の艦体に段状の装甲と高い艦橋、多数の連装砲塔を載せる。', r: '艦隊旗艦を務める最大級の戦艦。丸みのある艦体に球形の艦橋、両舷の並列ポッドと大きな主機を備える。' },
  BB: { name: '戦艦', e: '艦隊の主力となる重装甲・重火力の艦。楔形の艦体と角ばった艦橋、3基の連装砲塔。', r: '艦隊の主力となる重装甲・重火力の艦。滑らかな艦体に両舷のポッドを備え、砲塔は3基。' },
  CV: { name: '空母', e: '広い飛行甲板と艦橋の島を持つ、艦載機の母艦。X翼の戦闘艇(ワルキューレ風)を多数運用し、迎撃力も高い。', r: '広い飛行甲板を持つ、艦載機の母艦。デルタ翼の戦闘艇(スパルタニアン風)を多数運用し、迎撃力も高い。' },
  CA: { name: '巡航艦', e: '両軍で最も数が多い主戦力。細身の楔形で、機動力と火力のバランスがよい。', r: '両軍で最も数が多い主戦力。細身の円筒形の艦体に並列ポッドを備え、機動力と火力のバランスがよい。' },
  DD: { name: '駆逐艦', e: '小型で機動力に優れ、ミサイルを主兵装とする。艦尾の安定翼と艦首の発射管が特徴。', r: '小型で機動力に優れ、ミサイルを主兵装とする。艦尾の垂直尾翼と艦首の発射管が特徴。' },
  FR: { name: '護衛艦', e: '安価で迎撃力が高い護衛専門の艦。近接防御ドームとレーダーで、味方の大型艦をミサイルや雷撃から守る。', r: '安価で迎撃力が高い護衛専門の艦。近接防御ドームと両舷の張り出しで、味方の大型艦をミサイルや雷撃から守る。' },
  TB: { name: '雷撃艇', e: '雷撃(魚雷)に特化した高速の小型艦。両舷の魚雷ポッドから、シールドを無視する大威力の雷撃を放つ。', r: '雷撃(魚雷)に特化した高速の小型艦。艦底の大型魚雷ポッドから、シールドを無視する大威力の雷撃を放つ。' },
  FT: { name: '艦載機', e: '空母から発進する単座の戦闘艇。X字の4枚翼(ワルキューレ風)。編隊で敵艦を襲う。', r: '空母から発進する単座の戦闘艇。デルタ翼と双尾翼(スパルタニアン風)。編隊で敵艦を襲う。' },
  ES: { name: '工作艦', e: '非武装に近い支援艦。外部に張り出した修復アームと通信/整備用パラボラを持つ。自国星系に停泊する艦隊を静かに癒し、機雷の敷設・掃海を一手に担う。', r: '非武装に近い支援艦。丸みを帯びた艦体に修復アームと整備用パラボラを持つ。自国星系に停泊する艦隊を静かに癒し、機雷の敷設・掃海を一手に担う。' },
  ST: { name: 'ステルス艦', e: '乱反射を抑えた面構成の低視認性艦体を持つ奇襲艦。探知されるまでは戦列から外れて狙われず、隠密からの初弾は不意打ちとして大きな威力を発揮する。ただしゼッフル粒子(濃い気体)域では光学迷彩が効かず、常に発見される。', r: '流線形ながら面を減らした低視認性の艦体を持つ奇襲艦。探知されるまでは戦列から外れて狙われず、隠密からの初弾は不意打ちとして大きな威力を発揮する。ただしゼッフル粒子(濃い気体)域では光学迷彩が効かず、常に発見される。' },
  // 2026-09-29(5回目)追加: ユーザー要望「他にも特殊戦艦を建造して欲しい、ネットで有用な情報を取得」を受け、
  // Master of Orion/Homeworld2の「シールドを落とした艦を拿捕する」ボーディング艦と、Sins of a Solar Empire/
  // Sword of the Starsの「旗艦が艦隊全体へ指揮ボーナスを及ぼす」コマンドシップを調査のうえ翻案した。
  CC: { name: '指揮巡洋艦', e: '巡航艦級の艦体に大型の通信/司令部アレイを増設した、小さな旗艦。健在の間、その艦隊の提督の得意分野(特性)を通常より強く発揮させる。', r: '巡航艦級の艦体に大型のセンサー/司令部アレイを増設した、小さな旗艦。健在の間、その艦隊の提督の得意分野(特性)を通常より強く発揮させる。' },
  MA: { name: '強襲揚陸艦', e: '艦首に鉤爪状のドッキングクランプを備えた、鈍重だが頑丈な突撃艦。シールドを失い、耐久が半分を切った敵艦に接舷・強襲をかけ、撃沈する代わりに鹵獲(捕獲)を試みる。成功すれば、その艦はそのまま自軍の戦力になる。', r: '艦首に鉤爪状のドッキングクランプを備えた、鈍重だが頑丈な突撃艦。シールドを失い、耐久が半分を切った敵艦に接舷・強襲をかけ、撃沈する代わりに鹵獲(捕獲)を試みる。成功すれば、その艦はそのまま自軍の戦力になる。' },
};

let gal = { idx: 0, fac: 'empire', lastMove: 0, stars: null };
function openGallery() { SND.resume(); gal.idx = 0; state = 'gallery'; clearInputState(); syncAppUI(true); }
function closeGallery() { state = 'title'; clearInputState(); syncAppUI(true); }

// 2026-09-29(5回目)追加: 艦種が増えてもW(画面幅)からはみ出さないよう、必要なら118pxより詰める。
function galSlot(i) { const w = Math.min(118, (W - 32) / GALLERY_CLASSES.length), x0 = (W - GALLERY_CLASSES.length * w) / 2; return { x: x0 + i * w, y: 596, w: w - 8, h: 96 }; }
function updateGallery(input) {
  if (input.cancelEdge) { closeGallery(); return; }
  const n = GALLERY_CLASSES.length, now = millis();
  if (input.tabREdge) { gal.idx = (gal.idx + 1) % n; SND.se('tick'); }
  if (input.tabLEdge) { gal.idx = (gal.idx + n - 1) % n; SND.se('tick'); }
  if (Math.abs(input.mx) > 0.6 && now - gal.lastMove > 220) { gal.lastMove = now; gal.idx = (gal.idx + (input.mx > 0 ? 1 : n - 1)) % n; SND.se('tick'); }
  if (input.confirmEdge || input.formationEdge) { gal.fac = gal.fac === 'empire' ? 'republic' : 'empire'; SND.se('ok'); }
  if (input.pointer.tapped) {
    const tx = input.pointer.tapX, ty = input.pointer.tapY;
    for (let i = 0; i < n; i++) { const s = galSlot(i); if (tx >= s.x && tx <= s.x + s.w && ty >= s.y && ty <= s.y + s.h) { gal.idx = i; SND.se('tick'); } }
    if (ty >= 16 && ty <= 52) {
      if (tx >= 20 && tx <= 150) { gal.fac = 'empire'; SND.se('ok'); }
      else if (tx >= 160 && tx <= 290) { gal.fac = 'republic'; SND.se('ok'); }
      else if (tx >= W - 130 && tx <= W - 20) closeGallery();
    }
  }
}
function drawGallery() {
  const cls = GALLERY_CLASSES[gal.idx], fac = gal.fac, col = FACTION[fac].colorRgb, t = millis() / 1000;
  if (!gal.stars) { gal.stars = []; for (let i = 0; i < 110; i++) gal.stars.push({ x: hrand(i * 2) * W, y: hrand(i * 2 + 1) * H, r: hrand(i + 9) < 0.15 ? 1.6 : 0.9, a: 60 + hrand(i + 3) * 140 }); }
  push();
  noStroke(); fill(4, 7, 14); rect(0, 0, W, H);
  for (const s of gal.stars) { fill(200, 220, 255, s.a); ellipse(s.x, s.y, s.r * 2); }
  // 床のグリッド(ブループリント調)
  stroke(60, 110, 150, 60); strokeWeight(1);
  for (let i = 0; i <= 12; i++) { const y = 400 + i * i * 2.2; if (y > 590) break; line(0, y, 800, y); }
  for (let i = -8; i <= 8; i++) line(400 + i * 40, 400, 400 + i * 130, 590);
  // 大きなモデル(ゆっくり回転)
  drawWire(wireModel(cls, fac), 420, 320, GAL_SIZE[cls], t * 0.45, 0.32, col, 1, true, wireAccent(fac));
  // 上部の陣営タブと戻るボタン
  for (const [f, x] of [['empire', 20], ['republic', 160]]) {
    const on = gal.fac === f, c = FACTION[f].colorRgb;
    drawHudPanel(x, 16, 130, 36, on ? c : [70, 90, 110]);
    noStroke(); fill(on ? 255 : 150); textAlign(CENTER, CENTER); textSize(13); text(FACTION[f].name, x + 65, 35);
  }
  drawHudPanel(W - 130, 16, 110, 36, [110, 130, 150]);
  noStroke(); fill(220); textAlign(CENTER, CENTER); textSize(13); text('戻る', W - 75, 35);
  fill(150, 170, 185); textAlign(LEFT, TOP); textSize(11); text('艦艇図鑑 ― ワイヤーフレーム  [L/R・左右キー=艦種  決定=陣営切替  取消=戻る]', 310, 28);
  // 右の情報カード
  const L = SHIP_LORE[cls], st = SHIPS[cls], x = 820, y = 76, w = 440, h = 490;
  drawHudPanel(x, y, w, h, col);
  noStroke(); fill(col); textAlign(LEFT, TOP); textSize(24); text(L.name, x + 22, y + 18);
  fill(150, 170, 185); textSize(11); text(`${FACTION[fac].name}  /  ${cls}`, x + 22, y + 52);
  let yy = y + 82;
  fill(210); textSize(13);
  if (st) {
    text(`耐久 ${st.hp}   シールド ${st.shield}   速度 ${st.spd}   建造費 ${st.cost}`, x + 22, yy); yy += 24;
    text(`造船Lv.${st.buildLv || 0}   建造期間 ${shipBuildTurns(cls)}ターン${st.activeCap ? `   上限${st.activeCap}隻` : ''}${cls === 'PL' ? '   兵装Lv.5も必要' : ''}`, x + 22, yy, w - 44, 38); yy += 32;
    const ws = WEAPON_ORDER.filter(k => (st[k] || 0) > 0).map(k => `${WEAPON_DEFS[k].name} ${st[k]}`);
    text('兵装: ' + (ws.length ? ws.join(' / ') : '非武装(支援艦)'), x + 22, yy, w - 44, 40); yy += 42;
    text(`迎撃力 ${st.intercept}` + (st.capital ? '   (大型艦)' : st.stealth ? '   (隠密)' : ''), x + 22, yy); yy += 26;
  } else {
    text('艦載機は空母から発進する。空母の「艦載機」攻撃と、開戦前の艦載機戦で使われる。', x + 22, yy, w - 44, 60); yy += 64;
  }
  stroke(90, 140, 180, 120); line(x + 22, yy, x + w - 22, yy); noStroke(); yy += 14;
  fill(200); textSize(13); text(L[fac === 'empire' ? 'e' : 'r'], x + 22, yy, w - 44, 200);
  // 下段: 艦種の一覧
  for (let i = 0; i < GALLERY_CLASSES.length; i++) {
    const c2 = GALLERY_CLASSES[i], s = galSlot(i), on = i === gal.idx;
    drawHudPanel(s.x, s.y, s.w, s.h, on ? col : [60, 80, 100]);
    drawWire(wireModel(c2, fac), s.x + s.w / 2, s.y + 38, c2 === 'PL' ? 60 : c2 === 'FT' ? 50 : 76, t * 0.6 + i, 0.4, on ? col : [130, 150, 170], on ? 1 : 0.7, false, wireAccent(fac));
    noStroke(); fill(on ? 255 : 170); textAlign(CENTER, TOP); textSize(11); text(SHIP_LORE[c2].name, s.x + s.w / 2, s.y + 72);
  }
  pop();
}

// ---------- 模擬戦: 保存済みの造船段階に合わせた戦力をAI同士で戦わせる ----------
function startSandbox(forceZone, forceLevel) {
  SND.resume();
  const progress = saveData && saveData.research && saveData.research[saveData.playerFaction || 'empire'];
  const tier = Math.max(0, Math.min(5, Number.isFinite(forceLevel) ? forceLevel : (progress && progress.shipyard || 0)));
  const weaponLv = Number.isFinite(forceLevel) ? forceLevel : (progress && progress.weapon || 0);
  GAME = initGame(); GAME.sandbox = true;
  GAME.sandboxTier = tier;
  const comp = ['DD', 'DD', 'DD', 'DD', 'DD', 'FR', 'FR', 'FR', 'FR', 'FR', 'MA', 'MA', 'ES', 'ES'];
  if (tier >= 1) comp.push('TB', 'TB', 'TB', 'CA', 'CA', 'CA');
  if (tier >= 2) comp.push('BB', 'BB', 'ST', 'ST');
  if (tier >= 3) comp.push('CV', 'CV', 'CC');
  if (tier >= 4) comp.push('DN', 'DN');
  if (tier >= 5 && weaponLv >= 5) comp.push('PL', 'DD', 'DD', 'DD', 'FR', 'FR', 'FR', 'CA', 'CA');
  // forceZone: 動作確認用(#sandbox=zone,ion 等)に、戦場を特定の特殊環境へ強制する。通常プレイでは未指定。
  let cands = forceZone ? GAME.systems.filter(s => s.zone === forceZone) : [];
  if (!cands.length) cands = GAME.systems.filter(s => !s.fortress);
  const sys = cands[Math.floor(Math.random() * cands.length)];
  const fe = makeFleet('empire', sys.id, comp), fr = makeFleet('republic', sys.id, comp);
  GAME.fleets = [fe, fr];
  GAME.battleQueue.push({ systemId: sys.id, attackerId: fr.id, defenderId: fe.id });
  state = 'play'; paused = false; clearInputState();
  startNextBattle();
  syncAppUI(true);
}
function exitSandbox() { GAME = null; state = 'title'; clearInputState(); syncAppUI(true); }

if (typeof module !== 'undefined') module.exports = { openGallery, updateGallery, drawGallery, startSandbox, exitSandbox };
