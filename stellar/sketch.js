// ---------- STELLAR HEGEMONY ― 銀河覇権: メインループ(p5.js) ----------
const W = 1280, H = 720;
let state = 'title'; // 'title' | 'play'
let paused = false;
let saveData = null;
let GAME = null;
let sysScreenPos = {};
let hoverSystemId = null;
let lastCursorMoveAt = 0;
let orderTargetId = null;

// ---------- ネオン描画(1980s GALAXY SHOOTERのneon()/noGlow()の仕組みを移植。惑星・艦船のワイヤーフレーム表現に使う) ----------
function neon(col, alpha = 255, blur = 12, weight = 2) {
  stroke(col[0], col[1], col[2], alpha); strokeWeight(weight); noFill();
  drawingContext.shadowColor = `rgba(${col[0]},${col[1]},${col[2]},0.9)`; drawingContext.shadowBlur = blur;
}
function noGlow() { drawingContext.shadowBlur = 0; }
function hashStr(s) { let h = 0; for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0; return h; }

// ---------- 惑星(ワイヤーフレーム球。GALAXY SHOOTERのdrawPlanet()と同じ「経線・緯線を輪で描く」考え方を2D化) ----------
function drawPlanetIcon(x, y, r, colRgb, rot, dim) {
  const k = dim ? 0.4 : 1;
  push();
  neon(colRgb, 210 * k, 18, 2.2); ellipse(x, y, r * 2, r * 2);
  noGlow(); noFill(); stroke(colRgb[0], colRgb[1], colRgb[2], 130 * k); strokeWeight(1);
  for (let i = 0; i < 3; i++) { const a = rot + i * Math.PI / 3; ellipse(x, y, Math.abs(Math.cos(a)) * r * 2, r * 2); }
  for (const f of [-0.55, 0, 0.55]) { const ry = Math.sqrt(Math.max(0, 1 - f * f)) * r; ellipse(x, y + f * r, r * 2, ry * 2); }
  pop();
}
function drawRing(x, y, rx, ry, colRgb, alpha) {
  push(); neon(colRgb, alpha, 12, 2); ellipse(x, y, rx * 2, ry * 2); noGlow(); pop();
}
function drawFortressRing(x, y, r, colRgb) { drawRing(x, y, r * 1.65, r * 0.575, colRgb, 190); }

// ---------- 特殊環境ごとの背景(2026-09-27追加、2026-09-29拡張。資料の参考画像+実在の4X宇宙戦略ゲーム
// (Space Empires:4X の小惑星帯・星雲、Stellarisの電離ネビュラ等)を調査のうえ、重力嵐=ブラックホール、
// ゼッフル粒子=毒ガス状の星雲(銀英伝設定準拠)、小惑星帯=岩塊、電離嵐=紫電の嵐、をワイヤーフレームで描き分け、
// 特殊環境の無い星系も連星・環のある惑星・残骸宙域など複数の見た目に描き分けて「戦場のバリエーション」を増やした ----------
function drawBlackHoleIcon(x, y, r, rot, dim) {
  const k = dim ? 0.5 : 1;
  push();
  noStroke(); fill(2, 2, 4, 255 * k); ellipse(x, y, r * 0.7, r * 0.7); // 事象の地平面(黒い核)
  for (let i = 0; i < 7; i++) {
    const a = rot * (1 + i * 0.12), squash = 0.22 + i * 0.11;
    const col = i % 2 ? [255, 210, 150] : [140, 200, 255];
    neon(col, (230 - i * 18) * k, 16, 1.6);
    push(); translate(x, y); rotate(a * 0.35);
    ellipse(0, 0, r * (1.15 + i * 0.32), r * (1.15 + i * 0.32) * squash);
    pop(); noGlow();
  }
  pop();
}
function drawSunIcon(x, y, r, rot, dim, colRgb) {
  const k = dim ? 0.5 : 1, col = colRgb || [255, 160, 60];
  push();
  neon(col, 230 * k, 26, 2.4); ellipse(x, y, r * 1.5, r * 1.5);
  noGlow(); stroke(Math.min(255, col[0] + 20), Math.min(255, col[1] + 30), Math.min(255, col[2] + 40), 150 * k); strokeWeight(1);
  const n = 16;
  for (let i = 0; i < n; i++) {
    const a = rot + i * TWO_PI / n, wob = 0.75 + 0.25 * Math.sin(i * 2.3 + rot * 3);
    line(x + Math.cos(a) * r * 0.85, y + Math.sin(a) * r * 0.85, x + Math.cos(a) * r * 1.5 * wob, y + Math.sin(a) * r * 1.5 * wob);
  }
  pop();
}
// 連星系: 恒星2つが互いを巡る(暖色矮星+青白い伴星、という組み合わせが実在の連星でもよくある取り合わせ)
function drawBinaryStar(x, y, r, rot, dim) {
  const off = r * 0.55, x1 = x + Math.cos(rot * 0.6) * off, y1 = y + Math.sin(rot * 0.6) * off * 0.5;
  const x2 = x - Math.cos(rot * 0.6) * off, y2 = y - Math.sin(rot * 0.6) * off * 0.5;
  drawSunIcon(x1, y1, r * 0.62, rot, dim, [255, 160, 70]);
  drawSunIcon(x2, y2, r * 0.48, rot + 1.7, dim, [170, 205, 255]);
}
// ゼッフル粒子: 資料の設定通り「引火性の毒ガス」なので、岩塊(小惑星帯)ではなく、漂う気体の雲として描く
function drawNebulaCloud(x, y, r, rot, dim, seed) {
  const k = dim ? 0.45 : 1;
  push();
  for (let i = 0; i < 6; i++) {
    const a = (hashStr(seed + 'na' + i) % 1000) / 1000 * TWO_PI, dist = (hashStr(seed + 'nd' + i) % 1000) / 1000 * r * 0.65;
    const bx = x + Math.cos(a + rot * 0.3) * dist, by = y + Math.sin(a + rot * 0.3) * dist * 0.55;
    const rr = r * (0.4 + (hashStr(seed + 'nr' + i) % 100) / 100 * 0.4);
    neon([185, 225, 90], (85 - i * 5) * k, 24, 1.4);
    beginShape();
    const verts = 10;
    for (let j = 0; j <= verts; j++) {
      const ja = j / verts * TWO_PI, wob = 0.8 + 0.22 * Math.sin(ja * 3 + i * 1.7 + rot * 2);
      vertex(bx + Math.cos(ja) * rr * wob, by + Math.sin(ja) * rr * wob * 0.68);
    }
    endShape(CLOSE); noGlow();
  }
  pop();
}
// 電離嵐: 紫電(パルサー・イオン化ネビュラをイメージした)がのたうつ、密度の高い嵐
function drawIonStorm(x, y, r, rot, dim, seed) {
  const k = dim ? 0.5 : 1;
  push();
  noStroke(); fill(45, 20, 65, 150 * k); ellipse(x, y, r * 1.05, r * 1.05);
  for (let i = 0; i < 10; i++) {
    const a = (hashStr(seed + 'ii' + i) % 1000) / 1000 * TWO_PI + rot * 2, col = i % 2 ? [195, 145, 255] : [140, 230, 255];
    neon(col, (220 - i * 10) * k, 14, 1.4);
    let px = x + Math.cos(a) * r * 0.35, py = y + Math.sin(a) * r * 0.35 * 0.7;
    beginShape(); vertex(px, py);
    for (let s = 1; s <= 4; s++) {
      const rad = r * (0.35 + s / 4 * 0.8), jag = ((hashStr(seed + i + 'ij' + s) % 100) / 100 - 0.5) * 0.55;
      px = x + Math.cos(a + jag) * rad; py = y + Math.sin(a + jag) * rad * 0.7;
      vertex(px, py);
    }
    endShape(); noGlow();
  }
  pop();
}
// 戦術戦の背景を、特殊環境および星系IDに応じて描き分ける
function drawZoneBackdrop(b, cx, cy, r, dim) {
  const bgCol = b.sys.owner === 'neutral' ? [150, 150, 160] : FACTION[b.sys.owner].colorRgb;
  const rot = frameCount * 0.0025;
  if (b.zone === 'gravity') { drawBlackHoleIcon(cx, cy, r, rot, dim); return; }
  if (b.zone === 'zeffel') { drawNebulaCloud(cx, cy, r * 1.7, rot, dim, b.systemId); return; }
  if (b.zone === 'asteroid') { drawAsteroidField(cx, cy, r * 2.3, 16, b.systemId, dim); drawPlanetIcon(cx, cy, r * 0.45, [120, 130, 140], rot, true); return; }
  if (b.zone === 'ion') { drawIonStorm(cx, cy, r, rot, dim, b.systemId); return; }
  if (b.zone === 'star') { drawSunIcon(cx, cy, r * 1.4, rot, dim, [255, 110, 55]); return; }   // 恒星近傍: 通常の恒星より大きく・赤熱した色で「近い」ことを示す
  if (b.zone === 'corridor') { drawCorridorTunnel(cx, cy, r, rot, dim); return; }
  if (b.fortressDefender) { drawPlanetIcon(cx, cy, r, bgCol, rot, dim); drawFortressRing(cx, cy, r, bgCol); return; }
  // 特殊環境の無い星系も、星系IDに応じて5通りの見た目に固定で描き分ける(同じ星系はいつ戦っても同じ戦場に見える)
  const variant = hashStr(b.systemId) % 5;
  if (variant === 0) drawSunIcon(cx, cy, r, rot, dim);
  else if (variant === 1) drawBinaryStar(cx, cy, r, rot, dim);
  else if (variant === 2) { drawPlanetIcon(cx, cy, r, bgCol, rot, dim); drawRing(cx, cy, r * 1.5, r * 0.5, [170, 190, 210], 140); }
  else if (variant === 3) drawDerelictField(cx, cy, r * 2.1, 10, b.systemId, dim);
  else drawPlanetIcon(cx, cy, r, bgCol, rot, dim);
}
function drawAsteroidField(x, y, spread, n, seed, dim) {
  const k = dim ? 0.55 : 1;
  push();
  for (let i = 0; i < n; i++) {
    const rx = x + (hashStr(seed + 'x' + i) % 1000 / 1000 - 0.5) * spread;
    const ry = y + (hashStr(seed + 'y' + i) % 1000 / 1000 - 0.5) * spread * 0.6;
    const rr = 6 + (hashStr(seed + 'r' + i) % 100) / 100 * 16;
    const verts = 5 + (hashStr(seed + 'v' + i) % 3);
    noFill(); stroke(150, 170, 190, 150 * k); strokeWeight(1);
    beginShape();
    for (let j = 0; j < verts; j++) {
      const a = j / verts * TWO_PI, jr = rr * (0.7 + (hashStr(seed + i + 'j' + j) % 100) / 100 * 0.5);
      vertex(rx + Math.cos(a) * jr, ry + Math.sin(a) * jr);
    }
    endShape(CLOSE);
  }
  pop();
}
// 廃墟宙域: かつての海戦場に残る、折れ曲がった船体の残骸(たまに燻る残り火)
function drawDerelictField(x, y, spread, n, seed, dim) {
  const k = dim ? 0.5 : 1;
  push();
  for (let i = 0; i < n; i++) {
    const rx = x + (hashStr(seed + 'wx' + i) % 1000 / 1000 - 0.5) * spread;
    const ry = y + (hashStr(seed + 'wy' + i) % 1000 / 1000 - 0.5) * spread * 0.55;
    const len = 14 + (hashStr(seed + 'wl' + i) % 100) / 100 * 26, ang = (hashStr(seed + 'wa' + i) % 360) * Math.PI / 180;
    noFill(); stroke(175, 155, 150, 130 * k); strokeWeight(1.2);
    let px = rx - Math.cos(ang) * len / 2, py = ry - Math.sin(ang) * len / 2;
    beginShape(); vertex(px, py);
    for (let s = 1; s <= 3; s++) {
      const jag = ((hashStr(seed + i + 'wj' + s) % 100) / 100 - 0.5) * 0.6;
      px += Math.cos(ang + jag) * len / 3; py += Math.sin(ang + jag) * len / 3 * 0.6;
      vertex(px, py);
    }
    endShape();
    if (hashStr(seed + 'we' + i) % 5 === 0) { neon([255, 140, 60], 160 * k, 14, 1.5); noStroke(); fill(255, 180, 100, 200 * k); ellipse(rx, ry, 3, 3); noGlow(); }
  }
  pop();
}
// 回廊(隘路): 奥へすぼまる菱形のリングと収束するガイド線で、狭い航路を通り抜けていく遠近感を表す
function drawCorridorTunnel(x, y, r, rot, dim) {
  const k = dim ? 0.5 : 1;
  push();
  for (let i = 0; i < 6; i++) {
    const t = i / 5, rr = r * (1.15 - t * 0.9);
    neon([150 + i * 8, 175, 215], (210 - i * 22) * k, 14, 1.6);
    noFill();
    beginShape();
    for (let a = 0; a < 4; a++) { const ang = rot * 0.2 + a * HALF_PI + QUARTER_PI; vertex(x + Math.cos(ang) * rr * 1.4, y + Math.sin(ang) * rr * 0.55); }
    endShape(CLOSE);
    noGlow();
  }
  stroke(150, 180, 210, 110 * k); strokeWeight(1);
  for (const a of [-0.7, -0.35, 0, 0.35, 0.7]) line(x + Math.cos(a) * r * 1.6, y + Math.sin(a) * r * 0.65, x, y);
  pop();
}

// ---------- 近未来HUD調のパネル(角切り+コーナーブラケット。ネットで調べたsci-fi UIの定番意匠を流用) ----------
function panelPath(x, y, w, h, cut) {
  beginShape();
  vertex(x + cut, y); vertex(x + w, y); vertex(x + w, y + h - cut);
  vertex(x + w - cut, y + h); vertex(x, y + h); vertex(x, y + cut);
  endShape(CLOSE);
}
function hudCut(w, h) { return Math.min(16, w * 0.04, h * 0.08); }
function drawHudPanelFill(x, y, w, h) { push(); noStroke(); fill(8, 14, 24, 255); panelPath(x, y, w, h, hudCut(w, h)); pop(); }
function drawHudPanelBorder(x, y, w, h, colRgb) {
  const c = colRgb || [90, 180, 255], cut = hudCut(w, h);
  push();
  noFill(); stroke(c[0], c[1], c[2], 150); strokeWeight(1.2); panelPath(x, y, w, h, cut);
  stroke(c[0], c[1], c[2], 230); strokeWeight(2);
  const bl = 12;
  line(x + w - bl, y, x + w, y); line(x + w, y, x + w, y + bl); // 右上のブラケット(直角の角)
  line(x, y + h - bl, x, y + h); line(x, y + h, x + bl, y + h); // 左下のブラケット(直角の角)
  pop();
}
function drawHudPanel(x, y, w, h, colRgb) { drawHudPanelFill(x, y, w, h); drawHudPanelBorder(x, y, w, h, colRgb); }

// ---------- 艦船シルエット(GALAXY SHOOTERの艦船デザインを踏まえた、上から見たネオン・ワイヤーフレーム) ----------
const SHIP_SHAPES = {
  DN: [[18, 0], [7, 8], [-11, 10], [-18, 4], [-18, -4], [-11, -10], [7, -8]],
  BB: [[15, 0], [5, 7], [-13, 7], [-15, 0], [-13, -7], [5, -7]],
  CA: [[16, 0], [3, 6], [-12, 8], [-14, 0], [-12, -8], [3, -6]],
  CV: [[11, 0], [7, 8], [-13, 8], [-15, 0], [-13, -8], [7, -8]],
  DD: [[15, 0], [-6, 6], [-12, 0], [-6, -6]],
  FR: [[11, 0], [3, 5], [-9, 5], [-9, -5], [3, -5]],
  TB: [[13, 0], [-4, 3.5], [-10, 0], [-4, -3.5]],
  PL: [[20, 0], [14, 14], [0, 20], [-14, 14], [-20, 0], [-14, -14], [0, -20], [14, -14]],
  ES: [[9, 0], [3, 4], [-6, 8], [-10, 3], [-10, -3], [-6, -8], [3, -4]],   // 工作艦: 修復アームを思わせる非対称な小型艦
  ST: [[16, 0], [2, 3], [-14, 0], [2, -3]],                                // ステルス艦: 面の少ない薄く尖った輪郭
  CC: [[17, 0], [6, 5], [-6, 9], [-17, 3], [-17, -3], [-6, -9], [6, -5]],   // 指揮巡洋艦: 旗艦然とした細長い輪郭(2026-09-29(5回目)追加)
  MA: [[15, 0], [10, 5], [12, 8], [4, 5], [-10, 8], [-15, 2], [-15, -2], [-10, -8], [4, -5], [12, -8], [10, -5]],   // 強襲揚陸艦: 艦首の鉤爪を思わせる鈍重な輪郭
};
function drawShipIcon(type, x, y, facingRight, scl, colRgb, dim) {
  const shape = SHIP_SHAPES[type] || SHIP_SHAPES.CA;
  push(); translate(x, y); scale(facingRight ? scl : -scl, scl);
  noStroke(); fill(colRgb[0] * 0.22, colRgb[1] * 0.22, colRgb[2] * 0.22, dim ? 110 : 170);
  beginShape(); for (const v of shape) vertex(v[0], v[1]); endShape(CLOSE);
  neon(colRgb, dim ? 140 : 230, 9, 1.4);
  beginShape(); for (const v of shape) vertex(v[0], v[1]); endShape(CLOSE);
  noGlow(); pop();
}

// ---------- タイトル画面の背景演出(2026-09-29追加。「最初の画面をもっとカッコよく」との要望に応え、
// 静止したCSSグラデーションだけだったタイトル画面に、キャンバス側で星の流れ・ゆっくり回る惑星・
// 両陣営の艦影が奥を横切る演出を追加した。HTML側の中央構図(title-center)は中心ほどCSSの黒みが薄い
// (radial-gradientの中心アルファが低い)ため、ロゴの背後にちょうどこの惑星が透けて見える) ----------
let titleBG = null;
function drawTitleBackdrop() {
  if (!titleBG) {
    titleBG = { stars: [], ships: [] };
    for (let i = 0; i < 140; i++) titleBG.stars.push({ x: Math.random() * W, y: Math.random() * H, r: Math.random() < 0.12 ? 1.8 : 0.9, a: 50 + Math.random() * 150, sp: 4 + Math.random() * 14, tw: Math.random() * TWO_PI });
    const classes = ['DN', 'BB', 'CA', 'DD', 'CV'];
    for (let i = 0; i < 6; i++) titleBG.ships.push({ cls: classes[i % classes.length], fac: i % 2 ? 'republic' : 'empire', y: 70 + Math.random() * (H - 140), sp: 7 + Math.random() * 12, x: Math.random() * W, yaw: Math.random() < 0.5 ? 1.22 : -1.22 });
  }
  const dt = Math.min(0.05, (deltaTime || 16) / 1000), t = millis() / 1000;
  push();
  noStroke();
  for (const s of titleBG.stars) {
    s.x -= s.sp * dt; if (s.x < -6) s.x = W + 6;
    fill(200, 220, 255, s.a * (0.6 + 0.4 * Math.sin(t * 1.6 + s.tw)));
    ellipse(s.x, s.y, s.r * 2);
  }
  // 中央奥にゆっくり回る惑星: 覇権を賭ける舞台そのものを、ロゴの背後にうっすら置く
  drawPlanetIcon(W * 0.5, H * 0.44, 200, [80, 120, 165], t * 0.05, false);
  // 遠景を横切る、両陣営の艦影(ゆっくり・淡く。艦首の向きへ実際に進む)
  for (const s of titleBG.ships) {
    s.x += s.sp * dt * (s.yaw > 0 ? 1 : -1);
    if (s.x < -140) s.x = W + 140; if (s.x > W + 140) s.x = -140;
    drawWire(wireModel(s.cls, s.fac), s.x, s.y, (WIRE_SIZE[s.cls] || 120) * 0.4, s.yaw, 0.4, FACTION[s.fac].colorRgb, 0.24, false, wireAccent(s.fac));
  }
  pop();
}

function preload() { /* 追加読み込みは無し(全て図形描画) */ }
function setup() {
  const c = createCanvas(W, H); c.parent('game-stage');
  if (typeof textWrap === 'function') textWrap(CHAR);   // 日本語はスペースが無いので、幅指定のtext()は文字単位で折り返す
  pixelDensity(1); frameRate(60);
  layoutTouchUI(W, H);
  fitCanvas(W, H);
  try { saveData = JSON.parse(localStorage.getItem('sh_save') || 'null'); } catch (e) { saveData = null; }
  syncAppUI(true);
  document.addEventListener('gesturestart', e => e.preventDefault());
  document.getElementById('game-stage').addEventListener('contextmenu', e => e.preventDefault()); // 右ドラッグでのパン用
  // 動作確認用: URLに #gallery / #gallery=PL,republic / #sandbox を付けると、その画面を直接開く
  const hs = location.hash;
  if (hs.includes('campaignwin')) {
    startGame(); syncAppUI(true);
    const enemyCapital = systemById('terranova'); enemyCapital.owner = 'empire';
    for (const s of GAME.systems) {
      if (campaignProgress('empire').owned >= campaignProgress('empire').required) break;
      s.owner = 'empire';
    }
    checkCampaignVictory();
  }
  else if (hs.includes('gallery')) { const m = /gallery=(\w+),?(\w+)?/.exec(hs); openGallery(); if (m) { const i = GALLERY_CLASSES.indexOf(m[1]); if (i >= 0) gal.idx = i; if (m[2] === 'republic') gal.fac = 'republic'; } }
  else if (hs.includes('sandbox')) {
    // #sandbox=zone,ion : 指定の特殊環境の星系で模擬戦を開始する(戦場背景の確認用)
    // #sandbox=sim,N : 艦載機戦を飛ばし、AI戦闘をN秒分だけ同期的に進めた状態で開く(ヘッドレス撮影用)
    // 両方を合わせて #sandbox=zone,ion,sim,15 のように書くと、指定環境での戦闘をN秒分シミュレートできる。
    const zm = /zone,(\w+)/.exec(hs), m = /sim,(\d+)?/.exec(hs), tier = /tier,(\d+)/.exec(hs);
    startSandbox(zm ? zm[1] : undefined, tier ? +tier[1] : undefined);
    if (m) { skipDogfight(); updateDogfight(0); for (let i = 0, n = (+m[1] || 10) * 10; i < n && GAME.activeBattle && !GAME.activeBattle.winner; i++) updateBattleCinema(0.1); }
    else if (zm) { skipDogfight(); updateDogfight(0); toggleBattleCinema(); }   // シネマ無しで戦場背景を静止確認する
  }
  // #zonetest=asteroid : 戦略画面を開き、カーソルを指定環境の星系に、選択艦隊を自軍の先頭艦隊に合わせた状態で表示する
  // (環境適性カードの見た目を、実際に艦隊を動かさずに確認するためのフック)
  else if (hs.includes('zonetest')) {
    startGame(); syncAppUI(true);
    const m = /zonetest=(\w+)/.exec(hs), want = m ? m[1] : 'asteroid';
    const target = GAME.systems.find(s => s.zone === want) || GAME.systems.find(s => s.zone !== 'none');
    if (target) { GAME.cursorSystemId = target.id; GAME.camPan.x = target.x; GAME.camPan.y = target.y; }
    const mine = fleetsOfFaction(GAME.playerFaction)[0];
    if (mine) GAME.selectedFleetId = mine.id;
  }
  // #cmdtest=research|equip|political[,go[,political用の下位選択]] : 司令部画面を、指定タブ(・状態)を開いた状態で表示する(動作確認用)
  else if (hs.includes('cmdtest')) {
    startGame(); syncAppUI(true); openCommand();
    const m = /cmdtest=([\w,]+)/.exec(hs);
    if (m) {
      const parts = m[1].split(',');
      if (cmdTabs().includes(parts[0])) cmd.tab = parts[0];
      if (parts[1] === 'go') {
        if (cmd.tab === 'research') startResearch(GAME.playerFaction, 'weapon');
        if (cmd.tab === 'equip') { GAME.research[GAME.playerFaction].ecm = 3; const mine = fleetsOfFaction(GAME.playerFaction)[0]; if (mine) cmd.sel = mine.id; }
        if (cmd.tab === 'political') cmd.sel = parts[2] || 'subvert';
      }
      if (parts[3]) cmd.scroll = +parts[3] || 0;
    }
  }
  // #alphatest : サンドボックス戦闘を開始し、最初に行動する自軍ユニットへ強制的に一斉斉射を撃たせる(動作確認用)
  else if (hs.includes('alphatest')) {
    startSandbox(); skipDogfight(); updateDogfight(0);
    const b = GAME.activeBattle;
    const mine = unitsOfSide(b, b.playerFaction)[0], enemy = unitsOfSide(b, b.aiFaction)[0];
    const fired = performAlphaStrike(b, mine, enemy, { ignoreRange: true });
    pushLog(`[test] alphaStrike fired=${JSON.stringify(fired)} cooldowns=${JSON.stringify(mine.cooldowns)}`);
    for (let i = 0; i < 100 && GAME.activeBattle && !GAME.activeBattle.winner; i++) updateBattleCinema(0.1);
  }
  // #minetest : 自国星系に工作艦を含む艦隊を配置して機雷を敷設し、敵艦隊を到着させて起爆させる(動作確認用)
  else if (hs.includes('minetest')) {
    startGame(); syncAppUI(true);
    const sys = GAME.systems.find(s => s.owner === GAME.playerFaction && !s.capital);
    const esFleet = makeFleet(GAME.playerFaction, sys.id, ['ES', 'FR']);
    GAME.fleets.push(esFleet);
    const layRes = layMines(sys.id);
    pushLog(`[test] layMines: ${JSON.stringify(layRes)}`);
    const enemyFleet = makeFleet(aiFactionOf(), sys.id, ['DD', 'DD', 'CA']);
    GAME.fleets.push(enemyFleet);
    onFleetArrived(enemyFleet);
    GAME.cursorSystemId = sys.id;
  }
  // #missiontest : ミッション選択画面を開く(動作確認用)
  else if (hs.includes('missiontest') && !hs.includes('missiontest=')) { openMissionSelect(); }
  // #missiontest=<id>[,win|lose] : 指定ミッションを開始し、シネマを最後まで同期再生する。
  // ,win/,loseを付けると、決着後さらに1回postCombatの決定操作を模擬して次章への連戦/ミッション選択への遷移も確認する。
  else if (hs.includes('missiontest=')) {
    const m = /missiontest=(\w+)(,(win|lose))?/.exec(hs);
    const mission = MISSIONS.find(x => x.id === (m ? m[1] : 'm1')) || MISSIONS[0];
    startMission(mission);
    skipDogfight(); updateDogfight(0);
    for (let i = 0; i < 400 && GAME.activeBattle && !GAME.activeBattle.winner; i++) updateBattleCinema(0.1);
    if (m && m[3] && GAME.activeBattle) { GAME.activeBattle.winner = m[3] === 'win' ? GAME.playerFaction : aiFactionOf(); }
    if (GAME.activeBattle && !GAME.activeBattle.resolved) resolvePostCombat(GAME.activeBattle);
    if (GAME.activeBattle && GAME.activeBattle.resolved && m && m[3]) {
      const b = GAME.activeBattle, won = b.winner === GAME.playerFaction;
      if (won) markMissionCleared(mission);
      const next = won ? MISSIONS.find(x => x.chapter === mission.chapter + 1) : null;
      pushLog(`[test] mission resolved winner=${b.winner} won=${won} next=${next ? next.id : 'none'}`);
      if (next) startMission(next); else openMissionSelect();
    }
  }
  // #turntest=N : 戦略ターンをN回同期実行する(研究・内政・生産・AIがN期分回っても壊れないかの確認用)。
  // #turntest=N,battle : さらに最初の会戦が起きるまでターンを進め、シネマを最後まで同期再生する(研究/熟練/特殊兵装が実戦に反映されるかの確認用)
  else if (hs.includes('turntest')) {
    startGame(); syncAppUI(true);
    const m = /turntest=(\d+)(,battle)?/.exec(hs), n = m ? +m[1] : 10, toBattle = m && !!m[2];
    for (let i = 0; i < n && GAME.phase === 'strategy'; i++) endStrategyTurn();
    if (toBattle) {
      for (let i = 0; i < 200 && GAME.phase === 'strategy'; i++) endStrategyTurn();
      if (GAME.phase === 'dogfight') { skipDogfight(); updateDogfight(0); }
      for (let i = 0; i < 400 && GAME.activeBattle && !GAME.activeBattle.winner; i++) updateBattleCinema(0.1);
    }
  }
}
function windowResized() { fitCanvas(W, H); }

function continueGame() {
  if (!saveData) return;
  GAME = saveData; migrateLegacyNames(GAME); state = 'play'; clearInputState();
}
function startGame() { GAME = initGame(); state = 'play'; clearInputState(); }
function saveGame() {
  try { localStorage.setItem('sh_save', JSON.stringify(GAME)); saveData = GAME; } catch (e) { /* 保存できなくても続行 */ }
}

// ---------- 音楽(1980s GALAXY SHOOTERのSNDを母体に、陣営/戦場/戦況で選曲する) ----------
function battleBgmName(b) {
  if (!b) return 'belt_1';
  if (b.fortressDefender) return 'last_bastion';
  if (b.zone === 'gravity') return 'event_horizon';
  if (b.zone === 'zeffel') return 'void_a';
  if (b.zone === 'asteroid') return ['belt_1', 'belt_2', 'belt_3'][hashStr(b.systemId) % 3];
  if (b.zone === 'star') return 'core_2';
  if (b.zone === 'ion') return 'void_b';
  if (b.zone === 'corridor') return 'hub_gate';
  const own = b.playerFaction === 'republic' ? 'earth' : 'empire';
  if (b.units && b.units.some(u => u.alive && u.type === 'PL')) return own === 'earth' ? 'earth_boss' : 'empire_boss';
  if (b.turnNumber >= 7) return own === 'earth' ? 'earth_b' : 'empire_b';
  return own === 'earth' ? 'earth_fleet' : 'empire_fleet';
}
function postCombatBgmName(b) {
  if (!b) return 'ending';
  if (b.winner === 'draw') return 'ending';
  return b.winner === GAME.playerFaction ? 'clear' : 'gameover';
}
function updateAudio() {
  let bgm = 'title', intense = 0;
  if (state === 'gallery') bgm = 'hangar';
  if (state === 'play' && GAME) {
    switch (GAME.phase) {
      case 'strategy': {
        const pressure = GAME.fleets.some(f => f.faction !== GAME.playerFaction && !f.route &&
          fleetAlive(f) && systemById(f.systemId)?.owner === GAME.playerFaction);
        bgm = pressure ? (GAME.playerFaction === 'republic' ? 'earth_a' : 'empire_a') : 'map';
        break;
      }
      case 'command': bgm = 'map'; break;
      case 'dogfight': bgm = 'warp'; intense = 1; break;
      case 'battle': bgm = battleBgmName(GAME.activeBattle); intense = 1; break;
      case 'postCombat': bgm = postCombatBgmName(GAME.activeBattle); break;
      case 'campaignEnd': bgm = GAME.campaignWinner === GAME.playerFaction ? 'clear' : 'gameover'; break;
    }
  }
  SND.update({ bgm, intense });
}

function draw() {
  background(3, 6, 12);
  updateAudio();
  if (state === 'gallery') { const gi = pollInput(W, H); updateGallery(gi); drawGallery(); consumeTap(); return; }
  if (state === 'missionSelect') { const mi = pollInput(W, H); updateMissionSelect(mi); drawMissionSelect(); consumeTap(); return; }
  if (state === 'title') { drawTitleBackdrop(); return; }
  if (state !== 'play' || paused) { return; }
  const input = pollInput(W, H);
  const dt = Math.min(0.1, deltaTime / 1000);

  if (input.pauseEdge) { togglePause(true); return; }

  switch (GAME.phase) {
    case 'strategy': updateStrategyInput(input, dt); drawStrategyMap(); break;
    case 'command': updateCommandInput(input); drawCommand(); break;
    case 'dogfight': if (input.confirmEdge) skipDogfight(); updateDogfight(dt); drawDogfight(W, H); break;
    case 'battle':
      updateBattleInput(input);
      if (GAME.activeBattle.cinemaMode) { updateBattleCinema(dt); drawBattleCinema(); }
      else { updateBattle(dt); drawBattle(); }
      if (GAME.activeBattle.winner) GAME.phase = 'postCombat';
      break;
    case 'postCombat':
      if (!GAME.activeBattle.resolved) resolvePostCombat(GAME.activeBattle);
      drawPostCombat();
      if (input.confirmEdge) {
        if (GAME.sandbox) exitSandbox();
        else if (GAME.mission) {
          // ストーリー/ミッションモード: 勝利すれば進行度を記録し、次の章があればそのまま連戦、無ければミッション選択に戻る。
          const b = GAME.activeBattle, mission = GAME.mission, won = b.winner === GAME.playerFaction;
          if (won) markMissionCleared(mission);
          const next = won ? MISSIONS.find(m => m.chapter === mission.chapter + 1) : null;
          if (next) startMission(next); else openMissionSelect();
        }
        else { finishPostCombat(); saveGame(); }
      }
      break;
    case 'campaignEnd':
      drawCampaignEnd();
      if (input.confirmEdge) { state = 'title'; GAME = null; syncAppUI(true); }
      break;
  }
  consumeTap();
}

// ---------- 戦略フェーズ: 入力(スティック/ドラッグでパン、ホイール/ピンチでズーム) ----------
// 2026-09-27: ダンジョンゲームの「画面いっぱいのプレイ領域+要件別に小さく浮かせたカード」という
// UI思想に倣い、マップをほぼ全画面にし、情報を1枚の大きなパネルではなく用途別の小さなカードに分けた。
const MAP_BOX = { x: 14, y: 14, w: W - 28, h: H - 28 };
const PAN_SPEED = 0.7, ZOOM_MIN = 1, ZOOM_MAX = 3.6;
function clampCam() {
  GAME.camZoom = Math.max(ZOOM_MIN, Math.min(ZOOM_MAX, GAME.camZoom));
  GAME.camPan.x = Math.max(-0.15, Math.min(1.15, GAME.camPan.x));
  GAME.camPan.y = Math.max(-0.15, Math.min(1.15, GAME.camPan.y));
}
function worldToScreen(wx, wy) {
  const b = MAP_BOX, z = GAME.camZoom;
  return { x: b.x + b.w / 2 + (wx - GAME.camPan.x) * b.w * z, y: b.y + b.h / 2 + (wy - GAME.camPan.y) * b.h * z };
}
function screenToWorldDelta(dx, dy) {
  const b = MAP_BOX, z = GAME.camZoom;
  return { x: dx / (b.w * z), y: dy / (b.h * z) };
}
function updateStrategyInput(input, dt) {
  if (GAME.selectedFleetId && !GAME.fleets.some(f => f.id === GAME.selectedFleetId && fleetAlive(f))) GAME.selectedFleetId = null;
  if (Math.abs(input.mx) > 0.15 || Math.abs(input.my) > 0.15) {
    GAME.camPan.x += input.mx * dt * PAN_SPEED / GAME.camZoom;
    GAME.camPan.y += input.my * dt * PAN_SPEED / GAME.camZoom;
    clampCam();
  }
  if (input.pointer.tapped) {
    const r = commandBtnRect();
    if (input.pointer.tapX >= r.x && input.pointer.tapX <= r.x + r.w && input.pointer.tapY >= r.y && input.pointer.tapY <= r.y + r.h) { openCommand(); return; }
    const tapped = nearestSystemAt(input.pointer.tapX, input.pointer.tapY);
    if (tapped) { GAME.cursorSystemId = tapped; handleStrategyConfirm(); }
  }
  if (input.tabREdge) cycleSystem(1);
  if (input.tabLEdge) cycleSystem(-1);
  if (input.confirmEdge) handleStrategyConfirm();
  if (input.cancelEdge) GAME.selectedFleetId = null;
  if (input.formationEdge) {
    if (GAME.selectedFleetId) {
      const f = GAME.fleets.find(x => x.id === GAME.selectedFleetId);
      if (f) { const i = FORM_ORDER.indexOf(f.formation); f.formation = FORM_ORDER[(i + 1) % FORM_ORDER.length]; }
    } else {
      openCommand();   // 艦隊未選択時のY/Fボタンで司令部(研究・特殊兵装・政略)を開く(2026-09-29追加)
    }
  }
  if (input.endTurnEdge) { endStrategyTurn(); saveGame(); }
}
function cycleSystem(dir) {
  const ids = GAME.systems.map(s => s.id);
  let i = ids.indexOf(GAME.cursorSystemId);
  i = (i + dir + ids.length) % ids.length;
  GAME.cursorSystemId = ids[i];
  const s = systemById(GAME.cursorSystemId); GAME.camPan.x = s.x; GAME.camPan.y = s.y; clampCam();
  SND.se('tick');
}
function handleStrategyConfirm() {
  const sysId = GAME.cursorSystemId;
  if (GAME.selectedFleetId) {
    const f = GAME.fleets.find(x => x.id === GAME.selectedFleetId);
    if (f && f.systemId === sysId) { GAME.selectedFleetId = null; return; }
    if (f && routeExists(f.systemId, sysId)) { orderMarch(f.id, sysId); GAME.selectedFleetId = null; SND.se('ok'); return; }
    return;
  }
  const here = fleetsAt(sysId).filter(f => f.faction === GAME.playerFaction);
  if (here.length) { GAME.selectedFleetId = here[0].id; SND.se('tick'); }
}
function nearestSystemAt(x, y) {
  let best = null, bestD = 30;
  for (const id in sysScreenPos) { const p = sysScreenPos[id]; const d = Math.hypot(p.x - x, p.y - y); if (d < bestD) { bestD = d; best = id; } }
  return best;
}
function inMapBox(x, y) { return x >= MAP_BOX.x && x <= MAP_BOX.x + MAP_BOX.w && y >= MAP_BOX.y && y <= MAP_BOX.y + MAP_BOX.h; }

function drawStrategyMap() {
  sysScreenPos = {};
  const supplyNet = strategicSupplyNetwork(GAME.playerFaction);
  const { x: mapX, y: mapY, w: mapW, h: mapH } = MAP_BOX;
  push();
  drawHudPanelFill(mapX, mapY, mapW, mapH);
  drawingContext.save(); drawingContext.beginPath(); drawingContext.rect(mapX, mapY, mapW, mapH); drawingContext.clip();
  // 航路
  for (const [a, b] of ROUTES) {
    const pa = worldToScreen(systemById(a).x, systemById(a).y), pb = worldToScreen(systemById(b).x, systemById(b).y);
    const connected = supplyNet.connected.has(a) && supplyNet.connected.has(b);
    if (connected) { stroke(105, 208, 235, 165); strokeWeight(2.5); }
    else { stroke(60, 90, 110, 120); strokeWeight(1.2); }
    line(pa.x, pa.y, pb.x, pb.y);
  }
  // ホバー判定(マウス操作時、名前を出す)
  let hover = null;
  if (!touchMode) { let bestD = 26; for (const s of GAME.systems) { const p = worldToScreen(s.x, s.y); const d = Math.hypot(p.x - mouseX, p.y - mouseY); if (d < bestD) { bestD = d; hover = s.id; } } }
  hoverSystemId = hover;
  // 星系(ワイヤーフレーム惑星として描く)
  for (const s of GAME.systems) {
    const p = worldToScreen(s.x, s.y); sysScreenPos[s.id] = p;
    if (p.x < mapX - 30 || p.x > mapX + mapW + 30 || p.y < mapY - 30 || p.y > mapY + mapH + 30) continue; // 画面外は省略
    const col = s.owner === 'neutral' ? [150, 150, 160] : FACTION[s.owner].colorRgb;
    const r = ((s.fortress ? 20 : 14) + (s.capital ? 3 : 0)) * Math.min(1.4, Math.max(0.6, GAME.camZoom * 0.7));
    const rot = frameCount * 0.006 + (hashStr(s.id) % 100) * 0.06;
    drawPlanetIcon(p.x, p.y, r, col, rot);
    if (s.fortress) drawFortressRing(p.x, p.y, r, col);
    if (s.owner === GAME.playerFaction && !supplyNet.connected.has(s.id)) {
      noFill(); stroke(255, 105, 88, 220); strokeWeight(2); ellipse(p.x, p.y, r * 2 + 28);
      noStroke(); fill(255, 135, 110); textAlign(CENTER, CENTER); textSize(11); text('!', p.x + r + 8, p.y - r - 7);
    }
    if (s.zone !== 'none') { noFill(); stroke(255, 210, 90, 160); strokeWeight(1); ellipse(p.x, p.y, r * 2 + 20); }
    if (s.id === GAME.cursorSystemId) { noFill(); stroke(255, 255, 255); strokeWeight(2); ellipse(p.x, p.y, r * 2 + 14); }
    const hasFleet = fleetsAt(s.id).length > 0;
    const showLabel = s.capital || s.fortress || s.id === GAME.cursorSystemId || s.id === hover || hasFleet || GAME.camZoom > 1.8;
    const underToolbar = p.x < 110 && p.y > H - 70; // 左下の一時停止ボタン(HTML)の裏に隠れる位置ではラベルを省く
    if (showLabel && !underToolbar) { noStroke(); fill(230); textAlign(CENTER, TOP); textSize(11); text(s.name, p.x, p.y + r + 10); }
  }
  // 艦隊アイコン
  for (const f of GAME.fleets) {
    if (!fleetAlive(f)) continue;
    let p;
    if (f.route) { const pa = worldToScreen(systemById(f.route.from).x, systemById(f.route.from).y), pb = worldToScreen(systemById(f.route.to).x, systemById(f.route.to).y); p = { x: lerp(pa.x, pb.x, f.progress), y: lerp(pa.y, pb.y, f.progress) }; }
    else p = worldToScreen(systemById(f.systemId).x, systemById(f.systemId).y);
    const col = FACTION[f.faction].colorRgb;
    const isSel = f.id === GAME.selectedFleetId;
    // 艦隊特有の識別色(2026-09-29追加): 同陣営でも艦隊(提督)ごとに色の違うリングを常時表示し、
    // 一目でどの艦隊かを区別できるようにする。塗りは従来どおり陣営色のまま(所属は塗りで、識別はリングで示す)。
    // 識別色が陣営色と近い色相の場合でも判別できるよう、先に暗い縁取りを敷いてから識別色のリングを重ねる。
    noFill(); stroke(10, 14, 20, 200); strokeWeight(4); ellipse(p.x, p.y - 22, 17);
    stroke(f.color[0], f.color[1], f.color[2], 230); strokeWeight(2.2); ellipse(p.x, p.y - 22, 17);
    noStroke(); fill(col[0], col[1], col[2]);
    push(); translate(p.x, p.y - 22); rotate(f.route ? Math.atan2((worldToScreen(systemById(f.route.to).x, systemById(f.route.to).y).y - worldToScreen(systemById(f.route.from).x, systemById(f.route.from).y).y), (worldToScreen(systemById(f.route.to).x, systemById(f.route.to).y).x - worldToScreen(systemById(f.route.from).x, systemById(f.route.from).y).x)) : 0);
    triangle(-6, 6, 6, 6, 0, -8); pop();
    if (isSel) { noFill(); stroke(255); strokeWeight(1.6); ellipse(p.x, p.y - 22, 24); }
  }
  drawingContext.restore();
  drawHudPanelBorder(mapX, mapY, mapW, mapH, [80, 140, 170]);
  pop();
  drawStrategyHeaderCard();
  drawWarGoalCard();
  drawStrategySystemCard();
  drawStrategyFleetCard();
  drawStrategyLogCard();
  drawCommandButton();
  drawTouchUI();
}
// 右上: 司令部(研究・特殊兵装・政略)を開くボタン。2026-09-29追加。艦隊未選択時のY/Fボタンでも開ける。
function commandBtnRect() { return { x: W - 168, y: 16, w: 150, h: 38 }; }
function drawCommandButton() {
  const r = commandBtnRect();
  drawHudPanel(r.x, r.y, r.w, r.h, [200, 170, 90]);
  noStroke(); fill(230); textAlign(CENTER, CENTER); textSize(12);
  text('▤ 指令(研究/政略)', r.x + r.w / 2, r.y + r.h / 2);
}

// 上部中央: ターン数と両陣営の資源(ダンジョンゲームの#resourceに相当。細長い一段のピル)
function drawStrategyHeaderCard() {
  const w = 520, h = 38, x = W / 2 - w / 2, y = 16;
  drawHudPanel(x, y, w, h, [90, 170, 220]);
  textAlign(CENTER, CENTER); textSize(13); noStroke();
  fill(220); text(`第${GAME.turn}期`, x + 60, y + h / 2);
  fill(FACTION.empire.colorRgb); text(`${FACTION.empire.name} ${Math.floor(GAME.resources.empire)}`, x + w / 2 + 5, y + h / 2);
  fill(FACTION.republic.colorRgb); text(`${FACTION.republic.name} ${Math.floor(GAME.resources.republic)}`, x + w - 90, y + h / 2);
}
function drawWarGoalCard() {
  const p = campaignProgress(GAME.playerFaction), x = 918, y = 16, w = 176, h = 38;
  drawHudPanel(x, y, w, h, [185, 162, 92]);
  noStroke(); textAlign(LEFT, TOP); textSize(9); fill(165, 184, 198);
  text('勝利目標 / 覇権', x + 10, y + 5);
  fill(p.owned >= p.required ? [135, 228, 172] : [228, 205, 145]); textSize(12);
  text(`${p.owned}/${p.required}星系  首都${p.capitalHeld ? '確保' : '未確保'}`, x + 10, y + 19);
}
// 左上: カーソル中の星系カード(ダンジョンゲームの#partyに相当する位置)
// 星系カードの想定高さ(艦隊カードの位置決めにも使うので、描画と別に計算できるようにしてある)。
// 特殊環境の説明が増え、さらに艦隊を選んでいる間はその艦隊の適性(下記zoneSuitability)まで表示するため、
// 内容量に応じて可変にしている。
function systemCardInfo() {
  const cur = systemById(GAME.cursorSystemId);
  const zoneActive = !!(ZONE[cur.zone] && cur.zone !== 'none');
  const selFleet = GAME.selectedFleetId ? GAME.fleets.find(f => f.id === GAME.selectedFleetId) : null;
  const suit = (selFleet && zoneActive) ? zoneSuitability(selFleet, cur.zone, cur.owner) : null;
  const showGarrison = cur.owner !== 'neutral';   // 2026-09-29(6回目)追加: 地上侵攻の防衛度表示
  const supply = selFleet ? strategicSupplyRate(selFleet.faction, cur.id) : null;
  return { cur, zoneActive, suit, showGarrison, supply, h: 72 + (zoneActive ? 76 : 0) + (suit ? 32 : 0) + (showGarrison ? 24 : 0) + (supply !== null ? 24 : 0) };
}
function drawStrategySystemCard() {
  const x = 18, y = 64, w = 300;
  const { cur, zoneActive, suit, showGarrison, supply, h } = systemCardInfo();
  drawHudPanel(x, y, w, h, [90, 170, 220]);
  textAlign(LEFT, TOP); noStroke();
  fill(230); textSize(14); text(`▶ ${cur.name}` + (cur.fortress ? '(要塞)' : ''), x + 14, y + 10);
  fill(cur.owner === 'neutral' ? [170, 170, 180] : FACTION[cur.owner].colorRgb); textSize(12);
  text(`領有: ${cur.owner === 'neutral' ? '中立' : FACTION[cur.owner].short}`, x + 14, y + 32);
  let yy = y + 50;
  // 地上侵攻(2026-09-29(6回目)追加): 他陣営が領有する星系を奪うには、制宙権に加え強襲揚陸艦による
  // 地上侵攻で防衛度(garrison)を削りきる必要がある。占領の進み具合をバーと%で示す。
  if (showGarrison) {
    const gm = cur.garrisonMax || 1, g = cur.garrison === undefined ? gm : cur.garrison;
    const pct = Math.round(100 * (1 - g / gm)), bw = w - 28;
    fill(180); textSize(10.5); text(`防衛度 ${Math.round(g)}/${gm}${pct > 0 ? `(占領進捗 ${pct}%)` : ''}`, x + 14, yy);
    noStroke(); fill(30, 40, 55); rect(x + 14, yy + 15, bw, 5, 2);
    const barCol = g / gm < 0.3 ? [255, 140, 90] : [120, 200, 255];
    fill(barCol[0], barCol[1], barCol[2]); rect(x + 14, yy + 15, bw * (g / gm), 5, 2);
    yy += 26;
  }
  if (zoneActive) { fill(255, 210, 90); textSize(11); text(`${ZONE[cur.zone].label} ― ${ZONE[cur.zone].desc}`, x + 14, yy, w - 28, 74); yy += 78; }
  // 「戦闘環境に合わせて艦隊を選ぶ」ための適性表示: 艦隊選択中に移動先候補を見ると、その艦隊がこの環境に
  // 向くか向かないかが分かる。不向きなら取消して別の艦隊を選び直せる。
  if (suit) {
    const col = suit.rating === 'good' ? [120, 230, 150] : suit.rating === 'bad' ? [255, 130, 110] : [190, 190, 200];
    const mark = suit.rating === 'good' ? '◎適性あり' : suit.rating === 'bad' ? '▲不向き' : '○中立';
    fill(col); textSize(11); text(`${mark}: ${suit.note}`, x + 14, yy, w - 28, 30);
    yy += 32;
  }
  if (supply !== null) {
    fill(supply >= 70 ? [125, 220, 178] : supply >= 35 ? [230, 195, 115] : [255, 125, 105]);
    textSize(11); text(`選択艦隊の航路補給見込み ${supply}%`, x + 14, yy);
  }
}
// 左側(星系カードの下): 自軍艦隊カード。1艦隊=1行のカードで、選んでいる艦隊が光る。
// 艦隊数と、星系カードの高さ(可変)に応じて位置・高さを決める(空きだらけの巨大パネルや重なりを避けるため)。
function drawStrategyFleetCard() {
  const count = fleetsOfFaction(GAME.playerFaction).length;
  const x = 18, y = 64 + systemCardInfo().h + 10, w = 300;
  const h = Math.min(420, Math.max(130, 66 + count * 50 + 26), H - y - 110);
  drawHudPanel(x, y, w, h, [90, 170, 220]);
  noStroke(); fill(200); textAlign(LEFT, TOP); textSize(12); text('自軍艦隊', x + 14, y + 10);
  let yy = y + 32;
  for (const f of fleetsOfFaction(GAME.playerFaction)) {
    if (yy > y + h - 40) { fill(150); textSize(10); text('…', x + 14, yy); break; }
    const isSel = f.id === GAME.selectedFleetId;
    if (isSel) { noFill(); stroke(255, 230, 150, 200); strokeWeight(1.4); rect(x + 8, yy - 4, w - 16, 46, 4); noStroke(); }
    const loc = f.route ? `${systemNameOf(f.route.from)}→${systemNameOf(f.route.to)}` : systemNameOf(f.systemId);
    // 艦隊特有の識別色(2026-09-29追加): 戦略マップのリングと同じ色のスウォッチを添え、一覧との対応を取れるようにする。
    // 主特性名も添えて、「なぜこの艦種構成なのか」(登場人物のスキル)が一目で分かるようにする。
    noStroke(); fill(f.color[0], f.color[1], f.color[2]); rect(x + 14, yy + 2, 8, 8, 2);
    const traitName = TRAITS[f.admiral.traits[0]] ? TRAITS[f.admiral.traits[0]].name : '';
    fill(isSel ? 255 : 220); textSize(12); text(`${isSel ? '★ ' : ''}${f.admiral.name}(${RANKS[f.admiral.rank].name}・${traitName})`, x + 28, yy);
    fill(160); textSize(10); text(`${loc}  陣形:${FORMS[f.formation].name}`, x + 28, yy + 15);
    fill(180); text(f.ships.map(s => SHIPS[s.type].id + (s.veteran ? '★' : '')).join(' ') + (f.equip ? `  [${EQUIP_DEFS[f.equip].name}]` : ''), x + 28, yy + 28);
    yy += 50;
  }
  fill(160); textSize(10.5); textAlign(LEFT, BOTTOM);
  text(GAME.selectedFleetId ? '移動先の星系を選択して決定' : '艦隊のいる星系で決定を押すと選択', x + 14, y + h - 8);
}
// 下部中央: 直近ログ(ダンジョンゲームの#logに相当。半透明の細長いピル)
function drawStrategyLogCard() {
  const w = 640, h = 90, x = W / 2 - w / 2, y = H - h - 16;
  drawHudPanel(x, y, w, h, [70, 100, 120]);
  noStroke(); fill(150, 170, 185); textAlign(LEFT, TOP); textSize(9.5);
  text('ホイール/ピンチ=ズーム 右ドラッグ/スティック=パン L・R=星系切替 ターン終了=Tボタン', x + 14, y + 8);
  fill(200); textSize(11); textAlign(LEFT, TOP);
  let yy = y + 26;
  for (const line of GAME.log.slice(0, 4)) { text(line, x + 14, yy, w - 28, 16); yy += 15; }
}

// ---------- 戦術バトル: 入力・描画 ----------
const HEX_R = 34;
function hexOrigin() { return { x: 120, y: 90 }; }
function hexToScreen(col, row) {
  const o = hexOrigin();
  const x = o.x + col * HEX_R * 1.5;
  const y = o.y + row * HEX_R * Math.sqrt(3) + (col % 2 ? HEX_R * Math.sqrt(3) / 2 : 0);
  return { x, y };
}
function screenToHex(x, y) {
  let best = null, bestD = 1e9;
  for (let c = 0; c < BOARD_W; c++) for (let r = 0; r < BOARD_H; r++) { const p = hexToScreen(c, r); const d = Math.hypot(p.x - x, p.y - y); if (d < bestD) { bestD = d; best = { col: c, row: r }; } }
  return bestD < HEX_R * 1.1 ? best : null;
}
function updateBattleInput(input) {
  const b = GAME.activeBattle; if (!b) return;
  if (input.tabLEdge) toggleBattleCinema();
  if (b.cinemaMode) return; // シネマ(自動観戦)中は他の操作を受け付けない
  if (b.side !== 'player') { return; }
  const now = millis();
  if ((Math.abs(input.mx) > 0.5 || Math.abs(input.my) > 0.5) && now - lastCursorMoveAt > 180) {
    lastCursorMoveAt = now;
    battleMoveCursor(Math.abs(input.mx) > 0.5 ? Math.sign(input.mx) : 0, Math.abs(input.my) > 0.5 ? Math.sign(input.my) : 0);
  }
  if (input.pointer.tapped) { const h = screenToHex(input.pointer.tapX, input.pointer.tapY); if (h) { b.cursor.col = h.col; b.cursor.row = h.row; battleConfirm(); } }
  if (input.confirmEdge) battleConfirm();
  if (input.cancelEdge) battleCancel();
  if (input.formationEdge) battleToggleWeapon();
  if (input.endTurnEdge) battleEndPlayerTurn();
}
function drawManualBattleHud(b) {
  const fleet = GAME.fleets.find(f => f.id === (b.side === 'player' ? b.playerFleetId : b.aiFleetId));
  const col = FACTION[b.side === 'player' ? b.playerFaction : b.aiFaction].colorRgb;
  push();
  noStroke(); fill(4, 10, 20, 242); rect(0, 0, 985, 88);
  fill(col[0], col[1], col[2]); rect(0, 85, 985, 2);
  fill(135, 184, 207); textAlign(LEFT, TOP); textSize(10); text('GALACTIC HEGEMONY  /  TACTICAL COMMAND', 20, 10);
  fill(235, 244, 247); textStyle(BOLD); textSize(21); text(`${systemNameOf(b.systemId)}  会戦`, 20, 27); textStyle(NORMAL);
  fill(158, 193, 211); textSize(10);
  text(`ROUND ${String(b.turnNumber).padStart(2, '0')}   ·   手番 ${FACTION[b.side === 'player' ? b.playerFaction : b.aiFaction].short}   ·   ${b.zone === 'none' ? '標準宇宙' : ZONE[b.zone].label}`, 21, 60);
  const ps = b.strategicSupply || {};
  fill(145, 202, 216); text(`航路補給 自軍${ps[b.playerFaction] ?? 100}% / 敵軍${ps[b.aiFaction] ?? 100}%`, 402, 60);
  if (fleet) {
    if (fleet.color) { const fc = fleet.color; fill(fc[0], fc[1], fc[2]); rect(665, 25, 9, 9, 2); }
    fill(211, 227, 234); textSize(12); text(`${fleet.admiral.name} 提督`, 682, 23);
  }
  if (b.fortressDefender) { fill(255, 205, 122); textSize(10); text(`要塞主砲  ${b.fortressCharge}/${FORTRESS_GUN.chargeTurns}`, 755, 60); }
  pop();
}
function drawManualTacticalPanel(b) {
  const x = 790, y = 164, w = 466, h = 377;
  const a = cineFleetStats(b, b.playerFaction), d = cineFleetStats(b, b.aiFaction);
  push(); drawHudPanel(x, y, w, h, [72, 142, 180]);
  noStroke(); textAlign(LEFT, TOP);
  fill(117, 175, 205); textSize(10); text('TACTICAL OVERVIEW  /  戦域走査', x + 18, y + 16);
  fill(220, 236, 242); textSize(14); text('艦隊配置', x + 18, y + 36);
  const rx = x + 22, ry = y + 68, rw = w - 44, rh = 176;
  noFill(); stroke(73, 116, 138, 105); strokeWeight(1); rect(rx, ry, rw, rh);
  for (let i = 1; i < 4; i++) { line(rx + rw * i / 4, ry, rx + rw * i / 4, ry + rh); line(rx, ry + rh * i / 4, rx + rw, ry + rh * i / 4); }
  stroke(120, 200, 229, 55); line(rx, ry + rh / 2, rx + rw, ry + rh / 2); line(rx + rw / 2, ry, rx + rw / 2, ry + rh);
  for (const u of b.units) {
    if (!u.alive) continue;
    const c = FACTION[u.faction].colorRgb;
    const xx = rx + 12 + (u.col / Math.max(1, BOARD_W - 1)) * (rw - 24);
    const yy = ry + 10 + (u.row / Math.max(1, BOARD_H - 1)) * (rh - 20);
    noStroke(); fill(c[0], c[1], c[2], 200); ellipse(xx, yy, u.uid === b.selectedUid ? 7 : 3.5);
    if (u.uid === b.selectedUid) { noFill(); stroke(c[0], c[1], c[2], 210); ellipse(xx, yy, 15); }
  }
  const cx = rx + 12 + (b.cursor.col / Math.max(1, BOARD_W - 1)) * (rw - 24);
  const cy = ry + 10 + (b.cursor.row / Math.max(1, BOARD_H - 1)) * (rh - 20);
  stroke(230, 245, 250, 220); strokeWeight(1); noFill(); line(cx - 7, cy, cx - 3, cy); line(cx + 3, cy, cx + 7, cy); line(cx, cy - 7, cx, cy - 3); line(cx, cy + 3, cx, cy + 7);
  const rows = [
    { s: a, c: FACTION[b.playerFaction].colorRgb, label: '自軍' },
    { s: d, c: FACTION[b.aiFaction].colorRgb, label: '敵軍' }
  ];
  for (let i = 0; i < rows.length; i++) {
    const r = rows[i], yy = y + 258 + i * 44;
    noStroke(); fill(204, 220, 231); textSize(11); text(`${r.label}  ${r.s.ships}/${r.s.totalShips} 隻`, x + 22, yy);
    textAlign(RIGHT, TOP); text(`${Math.round(r.s.strength * 100)}%`, x + w - 23, yy); textAlign(LEFT, TOP);
    fill(31, 52, 65); rect(x + 22, yy + 19, w - 44, 5);
    fill(r.c[0], r.c[1], r.c[2]); rect(x + 22, yy + 19, (w - 44) * r.s.strength, 5);
  }
  noStroke(); fill(129, 171, 194); textSize(9);
  text(`戦場効果  /  ${b.zone === 'none' ? '標準交戦' : ZONE[b.zone].label}`, x + 22, y + h - 22);
  pop();
}
function drawBattle() {
  const b = GAME.activeBattle; if (!b) return;
  push();
  // 背景(特殊環境に応じて惑星・ブラックホール・小惑星帯・恒星を描き分け)。盤面の下に薄く敷く演出。
  drawZoneBackdrop(b, 340, 280, 150, true);
  for (let c = 0; c < BOARD_W; c++) for (let r = 0; r < BOARD_H; r++) drawHex(c, r, b);
  for (const u of b.units) if (u.alive) drawUnit(u, b);
  drawManualBattleHud(b);
  drawManualTacticalPanel(b);
  drawUnitCard(b.units.find(u => u.uid === b.selectedUid), b);
  drawLogCard(b, '移動=スティック 決定=選択/移動/攻撃 取消=戻る 陣形=武器切替 T=ターン終了 Q=シネマ切替');
  drawTouchUI();
  pop();
}
function factionOfUid(b, uid) { const u = b.units.find(x => x.uid === uid); return u ? u.faction : 'empire'; }
// シネマの画作り: 暗い宇宙に色温度の異なる両軍の光を置き、中央には視線が抜ける余白を残す。
function drawCineAtmosphere(b, t) {
  const ctx = drawingContext;
  ctx.save();
  for (const [x, rgb] of [[245, FACTION[b.playerFaction].colorRgb], [1035, FACTION[b.aiFaction].colorRgb]]) {
    const g = ctx.createRadialGradient(x, 290, 5, x, 290, 470);
    g.addColorStop(0, `rgba(${rgb[0]},${rgb[1]},${rgb[2]},0.16)`);
    g.addColorStop(0.5, `rgba(${rgb[0]},${rgb[1]},${rgb[2]},0.055)`);
    g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  }
  const vignette = ctx.createRadialGradient(640, 320, 230, 640, 320, 810);
  vignette.addColorStop(0, 'rgba(0,0,0,0)'); vignette.addColorStop(1, 'rgba(0,2,8,0.86)');
  ctx.fillStyle = vignette; ctx.fillRect(0, 0, W, H);
  ctx.restore();
  // 遠景の戦術測距線。透視収束とゆっくりした流れで艦隊の三次元感を補強する。
  push(); noFill(); strokeWeight(1);
  for (let i = -7; i <= 7; i++) {
    stroke(80, 145, 185, 12 + (i % 3 === 0 ? 13 : 0));
    line(640 + i * 22, 350, 640 + i * 140, 586);
  }
  for (let i = 0; i < 5; i++) {
    const y = 367 + i * i * 12 + Math.sin(t * 0.25) * 2;
    stroke(92, 150, 190, 12 + i * 3); line(95, y, 1185, y);
  }
  pop();
}
function cineFleetStats(b, faction) {
  const us = b.units.filter(u => u.faction === faction);
  const alive = us.filter(u => u.alive);
  const total = us.reduce((n, u) => n + u.maxHp + u.maxShield, 0);
  const remain = alive.reduce((n, u) => n + Math.max(0, u.hp) + Math.max(0, u.shield), 0);
  return { ships: alive.length, totalShips: us.length, strength: total ? Math.max(0, Math.min(1, remain / total)) : 0 };
}
function drawCineHud(b, t) {
  const left = cineFleetStats(b, b.playerFaction), right = cineFleetStats(b, b.aiFaction);
  const pf = GAME.fleets.find(f => f.id === b.playerFleetId), af = GAME.fleets.find(f => f.id === b.aiFleetId);
  const amber = FACTION[b.playerFaction].colorRgb, ice = FACTION[b.aiFaction].colorRgb;
  push();
  noStroke(); fill(3, 8, 17, 235); rect(0, 0, W, 87); rect(0, 613, W, 107);
  stroke(84, 137, 168, 110); strokeWeight(1); line(0, 87, W, 87); line(0, 613, W, 613);
  stroke(169, 208, 230, 38); line(0, 91, W, 91); line(0, 609, W, 609);
  textAlign(LEFT, TOP); noStroke();
  fill(139, 185, 211); textSize(10); text('GALACTIC HEGEMONY  /  TACTICAL LIVE FEED', 24, 11);
  fill(238, 245, 249); textSize(22); textStyle(BOLD); text(`${systemNameOf(b.systemId)}  会戦`, 24, 30); textStyle(NORMAL);
  fill(150, 185, 205); textSize(10); text(`戦闘宙域  /  ${b.zone === 'none' ? '標準宇宙' : ZONE[b.zone].label}     ROUND  ${String(b.turnNumber).padStart(2, '0')}`, 25, 63);
  const cards = [
    { x: 706, fac: b.playerFaction, fleet: pf, stat: left, col: amber, label: 'FRIENDLY' },
    { x: 978, fac: b.aiFaction, fleet: af, stat: right, col: ice, label: 'HOSTILE' }
  ];
  for (const c of cards) {
    const y = 14, w = 266;
    fill(13, 23, 34, 220); rect(c.x, y, w, 60, 2);
    fill(c.col[0], c.col[1], c.col[2]); rect(c.x, y, 3, 60);
    fill(150, 172, 190); textSize(9); text(c.label, c.x + 12, y + 6);
    if (c.fleet && c.fleet.color) { const fc = c.fleet.color; fill(fc[0], fc[1], fc[2]); rect(c.x + w - 17, y + 7, 6, 6, 1); }
    fill(230, 240, 246); textSize(12); text((c.fleet ? c.fleet.admiral.name + ' 提督' : FACTION[c.fac].short), c.x + 12, y + 21, 174, 18);
    fill(c.col[0], c.col[1], c.col[2]); textAlign(RIGHT, TOP); textSize(13); text(`${c.stat.ships}/${c.stat.totalShips}`, c.x + w - 12, y + 19);
    textAlign(LEFT, TOP); fill(34, 52, 65); rect(c.x + 12, y + 47, w - 24, 4);
    fill(c.col[0], c.col[1], c.col[2]); rect(c.x + 12, y + 47, (w - 24) * c.stat.strength, 4);
    fill(150, 172, 190); textSize(8); text(`戦力  /  航路補給 ${(b.strategicSupply || {})[c.fac] ?? 100}%`, c.x + 12, y + 39);
  }
  // 中央の交戦標識は砲撃のある時だけ明るくする。
  const active = b.cineFx && b.cineFx.length > 0;
  const pulse = active ? 0.75 + 0.25 * Math.sin(t * 16) : 0.38;
  stroke(170, 205, 220, 130 * pulse); strokeWeight(1.2); noFill();
  arc(640, 346, 62, 62, -0.9, 0.9); arc(640, 346, 62, 62, 2.25, 4.04);
  line(640, 310, 640, 320); line(640, 372, 640, 382);
  line(604, 346, 614, 346); line(666, 346, 676, 346);
  noStroke(); fill(170, 205, 220, 90 * pulse); ellipse(640, 346, 3);
  // 左下は環境、中央は戦闘通信、右下は両軍の兵力差。小さな情報に意味を与える。
  fill(132, 172, 195); textSize(9); text('BATTLESPACE / ENVIRONMENT', 25, 629);
  fill(230, 236, 241); textSize(15); text(b.zone === 'none' ? '標準宇宙' : ZONE[b.zone].label, 25, 647);
  fill(147, 171, 188); textSize(10); text(b.zone === 'none' ? '標準交戦規則' : ZONE[b.zone].desc, 103, 675, 182, 30);
  stroke(69, 116, 142, 120); line(298, 626, 298, 705); line(980, 626, 980, 705); noStroke();
  fill(130, 180, 205); textSize(9); text('COMBAT TELEMETRY', 320, 629);
  const events = b.log.slice(0, 3);
  fill(213, 226, 234); textSize(11);
  events.forEach((entry, i) => text('›  ' + entry, 320, 649 + i * 17, 638, 16));
  fill(130, 180, 205); textSize(9); text('FORCE BALANCE', 1001, 629);
  fill(230); textSize(12); text(`${Math.round(left.strength * 100)}%`, 1001, 652);
  textAlign(RIGHT, TOP); text(`${Math.round(right.strength * 100)}%`, 1250, 652);
  fill(26, 42, 56); rect(1001, 677, 249, 7);
  const balance = left.strength + right.strength ? left.strength / (left.strength + right.strength) : 0.5;
  fill(amber[0], amber[1], amber[2]); rect(1001, 677, 249 * balance, 7);
  fill(ice[0], ice[1], ice[2]); rect(1001 + 249 * balance, 677, 249 * (1 - balance), 7);
  fill(175, 203, 215); textSize(9); textAlign(RIGHT, TOP); text('Q  手動指揮へ', 1250, 692);
  pop();
}
function drawBattleCinema() {
  const b = GAME.activeBattle; if (!b) return;
  if (!b.cineStars) { b.cineStars = []; for (let i = 0; i < 90; i++) b.cineStars.push({ x: Math.random() * W, y: Math.random() * H, r: Math.random() < 0.15 ? 1.6 : 0.9, a: 70 + Math.random() * 130 }); }
  if (b.cineStartAt === undefined) b.cineStartAt = millis();
  const shotTime = (millis() - b.cineStartAt) / 1000 % 18;
  // 引きの全景→帝国側への寄り→地球側の反撃→全景に戻る、18秒周期の滑らかなカメラ移動。
  const shotKeys = [
    { t: 0, z: 0.92, x: 0, y: 0 }, { t: 2.5, z: 1.0, x: 0, y: 0 },
    { t: 5.5, z: 1.18, x: 110, y: 25 }, { t: 9, z: 1.18, x: -110, y: -20 },
    { t: 13, z: 1.03, x: 0, y: 0 }, { t: 18, z: 0.92, x: 0, y: 0 },
  ];
  const shotIndex = Math.min(shotKeys.length - 2, shotKeys.findIndex((k, i) => i < shotKeys.length - 1 && shotTime >= k.t && shotTime < shotKeys[i + 1].t));
  const fromShot = shotKeys[Math.max(0, shotIndex)], toShot = shotKeys[Math.max(0, shotIndex) + 1];
  let shotMix = (shotTime - fromShot.t) / (toShot.t - fromShot.t);
  shotMix = Math.max(0, Math.min(1, shotMix)); shotMix = shotMix * shotMix * (3 - 2 * shotMix);
  const camZ = lerp(fromShot.z, toShot.z, shotMix), camX = lerp(fromShot.x, toShot.x, shotMix), camY = lerp(fromShot.y, toShot.y, shotMix);
  push();
  noStroke(); fill(5, 8, 15); rect(0, 0, W, H);
  for (const s of b.cineStars) { fill(200, 220, 255, s.a); ellipse(s.x, s.y, s.r * 2); }
  push(); translate(W / 2 + camX, H / 2 + camY); scale(camZ); translate(-W / 2, -H / 2);
  drawCineAtmosphere(b, millis() / 1000);
  drawZoneBackdrop(b, W / 2 + 30, H / 2 + 20, 115, true);

  // ---- 陣形(初回だけ決めて固定。撃沈で他の艦の位置がずれないように)。
  // 「小さく沢山・三次元的に」という要望に応え、艦を平面の2列ではなく、
  // 重い艦ほど陣形の芯(奥行き・上下とも中央寄り)に、軽い艦ほど周囲の殻に散らばる
  // 3D的な群れとして配置し(フィボナッチ球面配置で満遍なく散らす)、艦体メッシュと
  // 同じカメラ規約(PITCH。shipmodels.jsのy'=y*cosP+z*sinP; z'=-y*sinP+z*cosP)で
  // 疑似遠近法投影する。奥の艦ほど小さく・上寄りに、手前の艦ほど大きく・下寄りに映る。
  const leftFac = b.playerFaction;
  const PITCH = 0.42, FOCAL = 620;
  if (!b.cinePos) {
    b.cinePos = {};
    const WT = { PL: 3.2, DN: 1.7, CV: 1.7, BB: 1.35, CA: 1, DD: 0.8, FR: 0.68, TB: 0.62 };
    for (const [fac, leftSide] of [[b.playerFaction, true], [b.aiFaction, false]]) {
      const us = b.units.filter(u => u.faction === fac);
      const n = Math.max(1, us.length);
      const shrink = Math.max(0.3, Math.min(1, 9 / n));   // 艦数が多いほど基準サイズを縮小し、密集した大艦隊に見せる
      const capitals = us.filter(u => SHIPS[u.type].capital), escorts = us.filter(u => !SHIPS[u.type].capital);
      // 大型艦・護衛艦それぞれを独立に球面いっぱいへフィボナッチ球面配置で満遍なく散らし(まとめて1つの列で並べると
      // 頭数の少ない大型艦が球の片側だけに偏って団子状に重なるため、グループごとに0周から数える)、
      // 大型艦の芯の外側にひとまわり大きな半径で護衛艦の殻を配置する。艦数が非常に多い艦隊では、
      // 半径をそのまま伸ばすと両陣営の殻が画面中央で交錯してしまうため、艦数に応じて全体を圧縮する。
      const spreadK = Math.max(0.7, Math.min(1, 22 / n));
      const capRad = (100 + capitals.length * 9) * spreadK, escMin = capRad + 80 * spreadK, escSpan = 150 * spreadK;
      const place = (list, radOf) => list.forEach((u, i) => {
        const cnt = Math.max(1, list.length), gAng = i * 2.399963, hEl = 1 - 2 * (i + 0.5) / cnt;
        const elev = Math.acos(Math.max(-1, Math.min(1, hEl))) - Math.PI / 2, rad = radOf(i, cnt);
        const lx = Math.cos(elev) * Math.cos(gAng) * rad, ly = Math.sin(elev) * rad * 0.72, lz = Math.cos(elev) * Math.sin(gAng) * rad;
        const base = (WIRE_SIZE[u.type] || 120) * shrink * (SHIPS[u.type].capital ? 0.8 : 0.62);
        b.cinePos[u.uid] = { lx, ly, lz, base, leftSide, ph: hashStr(u.uid) % 100 * 0.07 };
      });
      place(capitals, () => capRad);
      place(escorts, (i, cnt) => escMin + (i / Math.max(1, cnt - 1)) * escSpan);
      for (const u of us) if (!u.alive) u.deadAt = -1e9;   // 開始前に沈んでいた艦は、爆発演出を出さない
    }
  }
  const now = millis(), t = now / 1000, pitch = PITCH;
  const posOf = b.cinePos;
  const perspF = z2 => Math.max(0.55, Math.min(1.3, FOCAL / Math.max(220, FOCAL + z2)));   // 奥行きの効きすぎで艦同士が突き抜けたり画面外に飛び出したりしないよう頭打ちにする
  function projUnit(p) {
    // ゆっくり漂う個体差(ph)を3D空間側で加えてから投影するので、奥の艦ほど画面上の揺れ幅も小さくなる(視差)
    const wlx = p.lx + Math.sin(t * 0.3 + p.ph) * 9, wly = p.ly + Math.sin(t * 0.45 + p.ph * 1.4) * 6, wlz = p.lz + Math.cos(t * 0.26 + p.ph) * 13;
    const y2 = wly * Math.cos(PITCH) + wlz * Math.sin(PITCH), z2 = -wly * Math.sin(PITCH) + wlz * Math.cos(PITCH);
    const f = perspF(z2);
    const cx = p.leftSide ? 300 : W - 300;
    return { x: cx + wlx * f, y: 300 + y2 * f, sz: p.base * f, f, yaw: (p.leftSide ? 1.22 : -1.22) + Math.sin(t * 0.5 + p.ph) * 0.09 };
  }

  // 後方の予備艦隊(演出だけの遠景。3D群れのさらに外殻・奥に置き、小さく薄く、大艦隊の物量感を出す)
  for (const [fac, leftSide] of [[b.playerFaction, true], [b.aiFaction, false]]) {
    const col = FACTION[fac].colorRgb, mdl = wireModel('DD', fac);
    for (let i = 0; i < 14; i++) {
      const gAng = i * 2.399963 + 1.4, elev = (i % 7 - 3) * 0.22;
      const rad = 235 + (i % 3) * 30, lz = Math.cos(elev) * Math.sin(gAng) * rad + 90;
      const y2 = Math.sin(elev) * rad * 0.72 * Math.cos(PITCH) + lz * Math.sin(PITCH), z2 = -Math.sin(elev) * rad * 0.72 * Math.sin(PITCH) + lz * Math.cos(PITCH);
      const f = perspF(z2) * 0.6, cx = leftSide ? 300 : W - 300;
      const x = cx + Math.cos(elev) * Math.cos(gAng) * rad * f + Math.sin(t * 0.4 + i) * 4, y = 300 + y2 * f;
      drawWire(mdl, x, y, 40 * f, leftSide ? 1.22 : -1.22, pitch, col, 0.2, false, wireAccent(fac));
    }
  }

  // ---- 艦(生存艦+撃沈演出中の艦)。奥から手前の順に描き、3D的な前後関係が正しく見えるようにする ----
  const drawList = [];
  for (const u of b.units) { const p = posOf[u.uid]; if (p) drawList.push({ u, p, pr: projUnit(p) }); }
  drawList.sort((a, c) => a.pr.f - c.pr.f);
  for (const { u, p, pr: s } of drawList) {
    if (!u.alive) {
      if (u.deadAt === undefined) u.deadAt = now;
      const age = (now - u.deadAt) / 1100; if (age < 0 || age >= 1) continue;
      const col = FACTION[u.faction].colorRgb, jit = (1 - age) * 6;
      drawWire(wireModel(u.type, u.faction), s.x + (Math.random() - 0.5) * jit, s.y + (Math.random() - 0.5) * jit, s.sz, s.yaw, pitch, col, 0.8 * (1 - age), true, wireAccent(u.faction));
      noFill();
      for (let k = 0; k < 3; k++) { neon([255, 190 - k * 40, 100], 230 * (1 - age), 18, 2.5 - k * 0.5); ellipse(s.x, s.y, s.sz * (0.12 + age * (0.5 + k * 0.22))); }
      noGlow(); stroke(255, 220, 160, 230 * (1 - age)); strokeWeight(1.2);
      for (let k = 0; k < 12; k++) { const a = hrand(k + hashStr(u.uid) % 50) * TWO_PI, r0 = s.sz * 0.1 * age, r1 = s.sz * (0.16 + 0.5 * age); line(s.x + Math.cos(a) * r0, s.y + Math.sin(a) * r0 * 0.6, s.x + Math.cos(a) * r1, s.y + Math.sin(a) * r1 * 0.6); }
      continue;
    }
    const col = FACTION[u.faction].colorRgb;
    drawWire(wireModel(u.type, u.faction), s.x, s.y, s.sz, s.yaw, pitch, col, (u.acted ? 0.7 : 1) * Math.min(1, 0.5 + s.f * 0.6), true, wireAccent(u.faction));
    // 特殊兵装の発動演出(2026-09-29追加): いずれも発動直後の短時間だけ表示する一過性の演出。
    // 自動修復ドローン=開戦直後、艦を包む緑のナノ粒子。シールド増幅器=被弾ごとの青いシールド閃光。
    // ECMポッド=命中を外した瞬間の、黄緑色のジャミング走査線。
    if (u.fxRepairAt && now - u.fxRepairAt < 1300) {
      const age = (now - u.fxRepairAt) / 1300;
      for (let k = 0; k < 8; k++) { const a = hrand(k * 7 + hashStr(u.uid) % 40) * TWO_PI + t * 0.8, r = s.sz * (0.3 + 0.25 * Math.sin(t * 3 + k)); noStroke(); fill(140, 255, 180, 200 * (1 - age)); ellipse(s.x + Math.cos(a) * r, s.y + Math.sin(a) * r * 0.6 - s.sz * 0.1, 3); }
      noStroke(); fill(140, 255, 180, 70 * (1 - age)); ellipse(s.x, s.y, s.sz * (0.7 + age * 0.5));
    }
    if (u.fxShieldAt && now - u.fxShieldAt < 420) {
      const age = (now - u.fxShieldAt) / 420;
      noFill(); neon([140, 190, 255], 170 * (1 - age), 10, 1.8); ellipse(s.x, s.y, s.sz * (0.9 + age * 0.9)); noGlow();
    }
    if (u.fxEcmAt && now - u.fxEcmAt < 380) {
      const age = (now - u.fxEcmAt) / 380;
      noFill(); stroke(180, 255, 120, 220 * (1 - age)); strokeWeight(1.2);
      for (let k = 0; k < 5; k++) { const yy = s.y - s.sz * 0.3 + k * s.sz * 0.15 + (Math.random() - 0.5) * 3; line(s.x - s.sz * 0.5, yy, s.x + s.sz * 0.5, yy); }
    }
    // 耐久バーと艦名(小さい艦・奥の艦では省略して、画面が文字で埋まらないようにする)
    if (s.sz >= 34) {
      const bw = Math.max(30, s.sz * 0.42), by = s.y + Math.max(14, s.sz * (u.type === 'PL' ? 0.52 : 0.14)) + 4;
      noStroke(); fill(10, 20, 32, 220); rect(s.x - bw / 2, by, bw, 4);
      fill(u.hp / u.maxHp < 0.35 ? color(255, 170, 60) : color(90, 210, 255)); rect(s.x - bw / 2, by, bw * u.hp / u.maxHp, 4);
      if (u.maxShield > 0) { fill(120, 160, 255, 200); rect(s.x - bw / 2, by + 5, bw * u.shield / u.maxShield, 2); }
      if (s.sz >= 64 || u.type === 'PL') { fill(220); textAlign(CENTER, TOP); textSize(9.5); text(SHIPS[u.type].name + (u.ship && u.ship.veteran ? '★' : ''), s.x, by + 9); }
    }
  }

  // ---- 空母の艦載機(艦のまわりを周回) ----
  for (const u of b.units) {
    if (!u.alive || !(SHIPS[u.type].fighter > 0)) continue;
    const p = posOf[u.uid], s = projUnit(p), fm = wireModel('FT', u.faction), col = FACTION[u.faction].colorRgb;
    for (let k = 0; k < 6; k++) {
      const th = t * 1.15 + k * TWO_PI / 6 + p.ph, vx = -Math.sin(th);
      drawWire(fm, s.x + Math.cos(th) * s.sz * 0.5, s.y - s.sz * 0.1 + Math.sin(th) * s.sz * 0.14, 15 * s.f, vx > 0 ? 1.22 : -1.22, pitch, col, 0.9, false, wireAccent(u.faction));
    }
  }

  // ---- 撃ち合い(直近0.5秒の攻撃): ビーム=光条 / 実弾=弾頭 / 艦載機=編隊 / 要塞主砲=巨大ビーム ----
  for (const fx of (b.cineFx || [])) {
    // 要塞主砲(2026-09-29追加): 発射源はユニットではないため、防衛側の陣形の奥に固定した仮想の砲台位置を使う。
    const fp = fx.fortressFaction ? { lx: 0, ly: -230, lz: -260, base: 70, leftSide: fx.fortressFaction === b.playerFaction, ph: 0 } : posOf[fx.from];
    const tp = posOf[fx.to]; if (!fp || !tp) continue;
    const from = projUnit(fp), to = projUnit(tp), k = Math.max(0, 1 - fx.t / 0.5), q = Math.min(1, fx.t / 0.45), wdef = WEAPON_DEFS[fx.weapon];
    if (fx.weapon === 'fighter') {
      const fm = wireModel('FT', factionOfUid(b, fx.from)), col = FACTION[factionOfUid(b, fx.from)].colorRgb;
      // 発艦演出(2026-09-29追加): 出撃直後、空母側にカタパルト発艦の閃光を出す(「艦載機が出ていく時の映像」)
      if (q < 0.3) {
        const lf = 1 - q / 0.3;
        noStroke(); fill(255, 235, 190, 190 * lf); ellipse(from.x, from.y, 12 + 30 * (1 - lf));
        noFill(); stroke(255, 225, 160, 170 * lf); strokeWeight(1.6); ellipse(from.x, from.y, 20 + 46 * (1 - lf));
      }
      for (let i = 0; i < 9; i++) {
        const e = Math.min(1, q * (1.1 - i * 0.02)), jx = Math.sin(i * 2.7) * 18 * (1 - e), jy = Math.cos(i * 1.9) * 16 * (1 - e);
        drawWire(fm, lerp(from.x, to.x, e) + jx, lerp(from.y, to.y, e) + jy, 15, to.x > from.x ? 1.22 : -1.22, pitch, col, 1, false, [255, 230, 160]);
      }
      if (q > 0.8) { noStroke(); fill(255, 200, 120, 200 * k); ellipse(to.x, to.y, 26 + 30 * (1 - k)); }
      continue;
    }
    if (fx.weapon === 'board') {
      // 強襲(2026-09-29(5回目)追加): 接舷の鉤縄/グラップルを思わせる明滅する破線。成功=鹵獲(緑)/失敗=撃退(赤)で色を変える。
      const capOk = fx.hit === 'capture', dashCol = capOk ? [140, 255, 170] : [255, 120, 120];
      stroke(dashCol[0], dashCol[1], dashCol[2], 210 * k); strokeWeight(2.2);
      drawingContext.setLineDash([7, 7]); drawingContext.lineDashOffset = -fx.t * 40;
      line(from.x, from.y, to.x, to.y);
      drawingContext.setLineDash([]); noStroke();
      if (q > 0.6) {
        if (capOk) { fill(140, 255, 170, 220 * k); ellipse(to.x, to.y, 30 + 40 * (1 - k)); fill(255, 255, 255, 180 * k); ellipse(to.x, to.y, 14 + 10 * (1 - k)); }
        else { fill(255, 120, 120, 220 * k); ellipse(to.x, to.y, 20 + 24 * (1 - k)); }
      }
      continue;
    }
    if (fx.weapon === 'fortress') {
      // 要塞主砲の発射演出(2026-09-29追加): 通常兵装より太く明るいビームで、発射元に大きな充填閃光を出す
      if (q < 0.25) {
        const cf = 1 - q / 0.25;
        noStroke(); fill(255, 245, 210, 220 * cf); ellipse(from.x, from.y, 20 + 70 * (1 - cf));
        noFill(); stroke(255, 230, 160, 200 * cf); strokeWeight(2.4); ellipse(from.x, from.y, 30 + 100 * (1 - cf));
      }
      neon([255, 245, 200], 255 * k, 24, 4.2); line(from.x, from.y, to.x, to.y); noGlow();
      noStroke(); fill(255, 255, 255, 220 * k); ellipse(lerp(from.x, to.x, q), lerp(from.y, to.y, q), 10);
      if (q > 0.75) { noStroke(); fill(255, 220, 160, 230 * k); ellipse(to.x, to.y, 34 + 50 * (1 - k)); fill(255, 255, 255, 180 * k); ellipse(to.x, to.y, 16 + 18 * (1 - k)); }
      continue;
    }
    const col = wdef.energy ? [255, 210, 120] : wdef.id === 'railgun' ? [180, 230, 255] : [255, 120, 120];
    if (wdef.energy || wdef.id === 'railgun') { neon(col, 230 * k, 16, wdef.energy ? 2.6 : 1.6); line(from.x, from.y, to.x, to.y); noGlow(); }
    else {
      neon(col, 90 * k, 10, 1); line(from.x, from.y, to.x, to.y); noGlow();
      noStroke(); fill(col[0], col[1], col[2], 255); ellipse(lerp(from.x, to.x, q), lerp(from.y, to.y, q), 7); fill(255, 255, 255, 200 * k); ellipse(lerp(from.x, to.x, Math.max(0, q - 0.06)), lerp(from.y, to.y, Math.max(0, q - 0.06)), 4);
    }
    if (q > 0.85 && fx.hit !== 'kill') { noStroke(); fill(255, 240, 200, 220 * k); ellipse(to.x, to.y, 12 + 14 * (1 - k)); }
  }
  // 命中点から光が広がる。撃沈時はリングを増やし、通常命中との重さを変える。
  for (const fx of (b.cineFx || [])) {
    const p = posOf[fx.to]; if (!p || fx.t < 0.2) continue;
    const q = Math.min(1, (fx.t - 0.2) / 0.3), s = projUnit(p), kill = fx.hit === 'kill';
    push(); noFill(); strokeWeight(kill ? 2.2 : 1.2);
    const c = kill ? [255, 184, 105] : [165, 218, 255];
    stroke(c[0], c[1], c[2], (kill ? 190 : 95) * (1 - q));
    ellipse(s.x, s.y, (kill ? 40 : 22) + q * (kill ? 155 : 65), (kill ? 28 : 15) + q * (kill ? 110 : 45));
    if (kill) ellipse(s.x, s.y, 15 + q * 95, 9 + q * 68);
    pop();
  }
  pop(); // 宇宙と艦隊だけを動かし、情報HUDは画面に固定する。
  drawCineHud(b, t);
  noStroke(); fill(125, 169, 193); textAlign(RIGHT, TOP); textSize(9);
  text(`TACTICAL CAMERA  /  ${String(Math.floor(shotTime / 4.5) + 1).padStart(2, '0')}`, W - 25, 594);
  drawTouchUI();
  pop();
}
// ---------- 戦術戦の小カード群(ダンジョンゲームの「用途別に小さく浮かせる」UIに倣う) ----------
function drawUnitCard(sel, b) {
  const w = 260, h = 110, x = W - w - 18, y = 16;
  drawHudPanel(x, y, w, h, [90, 170, 220]);
  noStroke(); textAlign(LEFT, TOP);
  if (sel) {
    fill(230); textSize(13); text(SHIPS[sel.type].name + (sel.ship && sel.ship.veteran ? ' ★精鋭' : ''), x + 14, y + 8);
    fill(180); textSize(10.5); text(`HP ${sel.hp}/${sel.maxHp}  シールド ${sel.shield}/${sel.maxShield}`, x + 14, y + 27);
    text(`陣形:${FORMS[sel.formation].name}  補給:${unitSupply(b, sel)}%`, x + 14, y + 42);
    if (b.mode === 'attackWeapon' || b.mode === 'attackTarget') {
      fill(255, 210, 90); textSize(10.5);
      // 2026-09-29(5回目)追加: 'alpha'(一斉斉射)・'board'(強襲)はWEAPON_DEFSに無い仮想の行動名なので、
      // 表示名をここで振る。どちらも実兵装の一覧には含まれないため、選択中なら末尾に追記して見えるようにする。
      const wname = id => id === 'alpha' ? '一斉斉射' : id === 'board' ? '強襲' : WEAPON_DEFS[id].name;
      const parts = (b.availableWeapons || []).map(w2 => w2 === b.pendingWeapon ? `[${wname(w2)}]` : wname(w2));
      if (b.pendingWeapon === 'alpha' || b.pendingWeapon === 'board') parts.push(`[${wname(b.pendingWeapon)}]`);
      text(`武器: ${parts.join(' ')}`, x + 14, y + 58, w - 28, 20);
    } else { fill(150); textSize(10); text(mode2text(b.mode), x + 14, y + 60, w - 28, 44); }
  } else { fill(180); textSize(12); text('自艦をタップ/決定で選択', x + 14, y + 12); }
}
function drawLogCard(b, hint) {
  const w = 640, h = 90, x = W / 2 - w / 2, y = H - h - 16;
  drawHudPanel(x, y, w, h, [70, 100, 120]);
  noStroke(); fill(150, 170, 185); textAlign(LEFT, TOP); textSize(9.5);
  text(hint, x + 14, y + 8);
  fill(200); textSize(11);
  let yy = y + 26;
  for (const line of b.log.slice(0, 4)) { text(line, x + 14, yy, w - 28, 16); yy += 15; }
}
function drawHex(col, row, b) {
  const p = hexToScreen(col, row);
  const isCursor = b.cursor.col === col && b.cursor.row === row;
  const isReach = b.mode === 'move' && b.reachable.some(h => h.col === col && h.row === row);
  const sel = b.units.find(u => u.uid === b.selectedUid);
  const isTarget = b.mode === 'attackTarget' && b.attackTargets.some(t => t.col === col && t.row === row);
  noFill();
  stroke(isTarget ? color(255, 90, 90, 200) : isReach ? color(90, 220, 130, 200) : isCursor ? color(255, 255, 255, 230) : color(40, 70, 90, 160));
  strokeWeight(isCursor ? 2.4 : 1.2);
  beginShape();
  for (let i = 0; i < 6; i++) { const a = Math.PI / 180 * (60 * i); vertex(p.x + HEX_R * Math.cos(a), p.y + HEX_R * Math.sin(a)); }
  endShape(CLOSE);
}
function drawUnit(u, b) {
  const p = hexToScreen(u.col, u.row);
  const col = FACTION[u.faction].colorRgb;
  const isSel = u.uid === b.selectedUid;
  const facingRight = u.col < BOARD_W / 2;
  drawShipIcon(u.type, p.x, p.y, facingRight, isSel ? 1.15 : 1, col, u.acted);
  noFill(); stroke(80, 200, 255, 200); strokeWeight(2);
  arc(p.x, p.y, 40, 40, -HALF_PI, -HALF_PI + TWO_PI * (u.hp / u.maxHp));
  if (isSel) { noFill(); stroke(255); strokeWeight(2); ellipse(p.x, p.y, 42); }
  noStroke(); fill(230, u.acted ? 140 : 230); textAlign(CENTER, TOP); textSize(9); text(SHIPS[u.type].id, p.x, p.y + 22);
}
function mode2text(mode) {
  return { select: '自艦を選んで決定', move: '移動先を選んで決定(その場に留まる場合はその場で決定)', attackWeapon: '決定で射程内の目標を検索', attackTarget: '目標を選んで決定(取消で攻撃せず終了)' }[mode] || '';
}

function drawPostCombat() {
  const b = GAME.activeBattle; if (!b) return;
  const mission = GAME.mission;
  push();
  noStroke(); fill(4, 6, 11); rect(0, 0, W, H);
  const w = 640, h = mission ? 540 : 420, x = W / 2 - w / 2, y = H / 2 - h / 2;
  const col = b.winner === 'draw' ? [150, 150, 160] : FACTION[b.winner].colorRgb;
  drawHudPanel(x, y, w, h, col);
  noStroke(); fill(col); textAlign(CENTER, TOP); textSize(26);
  text(b.winner === 'draw' ? '痛み分け' : `${FACTION[b.winner].short}の勝利`, W / 2, y + 26);
  if (mission) { fill(180, 190, 200); textAlign(CENTER, TOP); textSize(12); text(mission.title, W / 2, y + 58); }
  textSize(14); textAlign(LEFT, TOP); fill(220);
  let yy = y + (mission ? 88 : 76);
  for (const line of (b.summary || [])) { text(line, x + 36, yy, w - 72, 24); yy += 24; }
  // ストーリー/ミッションモード: 勝敗に応じた戦況説明(debrief)を続けて表示する。
  if (mission) {
    yy += 10; stroke(90, 140, 180, 120); line(x + 36, yy, x + w - 36, yy); noStroke(); yy += 16;
    fill(210); textSize(13);
    text(b.winner === GAME.playerFaction ? mission.debriefWin : mission.debriefLose, x + 36, yy, w - 72, h - (yy - y) - 44);
  }
  textAlign(CENTER, TOP); fill(160); text(mission ? '(決定ボタンで次へ)' : '(決定ボタンで戦略画面へ)', W / 2, y + h - 30);
  pop();
}

function drawCampaignEnd() {
  const won = GAME.campaignWinner === GAME.playerFaction;
  const col = won ? [223, 189, 104] : [135, 182, 225];
  const p = campaignProgress(GAME.campaignWinner);
  push();
  noStroke(); fill(3, 7, 14); rect(0, 0, W, H);
  for (let i = 0; i < 95; i++) {
    const x = (hashStr('end-x-' + i) % W), y = (hashStr('end-y-' + i) % H);
    fill(105, 155, 195, 60 + i % 4 * 32); ellipse(x, y, 1 + i % 3);
  }
  drawHudPanel(258, 134, 764, 452, col);
  textAlign(CENTER, TOP); noStroke();
  fill(131, 169, 192); textSize(11); text('CAMPAIGN CONCLUDED  /  GALACTIC HEGEMONY', W / 2, 168);
  fill(col); textSize(42); textStyle(BOLD); text(won ? '銀河覇権、確立' : '覇権戦争、敗北', W / 2, 214); textStyle(NORMAL);
  fill(220, 231, 239); textSize(19); text(`${FACTION[GAME.campaignWinner].short}が銀河の主導権を掌握`, W / 2, 288);
  stroke(90, 143, 165, 110); line(340, 333, 940, 333); noStroke();
  fill(153, 181, 200); textSize(12); text(`終結  第${GAME.turn}期     領有星系 ${p.owned}/${GAME.systems.length}     敵首都確保`, W / 2, 360);
  fill(201, 216, 226); textSize(14); text('前線をつなぎ、艦隊と地上軍を送り届けた側が銀河を制した。', W / 2, 422);
  fill(154, 194, 218); textSize(12); text('決定ボタンでタイトルへ', W / 2, 534);
  pop();
}

function touchStarted(evt) {
  SND.resume();
  return inputTouchStarted(evt, W, H, (x, y) => {});
}
// 画面のボタン(出撃など)の上では、既定の動作を止めない(止めると iPhone でタップがクリックにならず、ボタンが押せない)
function onAppUI(evt) { return !!(evt && evt.target && evt.target.closest && evt.target.closest('#app-ui, #toolbar')); }
function touchEnded(evt) { if (onAppUI(evt)) return; lastPinchDist = null; return false; }
let lastPinchDist = null;
function touchMoved(evt) {
  if (onAppUI(evt)) return;
  if (state === 'play' && !paused && GAME && GAME.phase === 'strategy' && touches.length >= 2) {
    const d = Math.hypot(touches[0].x - touches[1].x, touches[0].y - touches[1].y);
    if (lastPinchDist !== null) { GAME.camZoom *= 1 + (d - lastPinchDist) * 0.0025; clampCam(); }
    lastPinchDist = d;
  }
  return false;
}
let dragPan = null;
function mousePressed(evt) {
  if (evt && evt.target && evt.target.closest && evt.target.closest('#app-ui, #toolbar')) return;
  if (touchMode) return;
  SND.resume();
  if (mouseButton === 'right' && state === 'play' && GAME && GAME.phase === 'strategy' && inMapBox(mouseX, mouseY)) {
    dragPan = { x: mouseX, y: mouseY, camX: GAME.camPan.x, camY: GAME.camPan.y };
    return false;
  }
  INPUT.pointer.tapped = true; INPUT.pointer.tapX = mouseX; INPUT.pointer.tapY = mouseY;
}
function mouseDragged() {
  if (dragPan) {
    const d = screenToWorldDelta(mouseX - dragPan.x, mouseY - dragPan.y);
    GAME.camPan.x = dragPan.camX - d.x; GAME.camPan.y = dragPan.camY - d.y; clampCam();
    return false;
  }
}
function mouseReleased() { dragPan = null; }
function mouseWheel(event) {
  if (state === 'play' && !paused && GAME && GAME.phase === 'strategy' && inMapBox(mouseX, mouseY)) {
    GAME.camZoom *= 1 - event.delta * 0.0012; clampCam();
    return false;
  }
  if (state === 'play' && !paused && GAME && GAME.phase === 'command') {
    cmdScrollBy(event.delta * 0.6);
    return false;
  }
}
