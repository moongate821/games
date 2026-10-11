// 1980s WIREFRAME GALAXY SHOOTER — v2 STARFIGHTER(オールレンジ版)
// 半径6000の巨大な球体の戦闘空域を、3D で自由に飛ぶ。自機の後ろから見る視点(スターフォックスのオールレンジ)。
// 敵は戦艦(砲塔・シールド発生器・艦橋)と戦闘機。仕様書PDF9枚目のイメージ(段のある船体、艦橋タワー、双砲身の砲塔ドーム)。
// 操作: ←→ 旋回 / ↑↓ 上昇・下降 / Space 射撃 / X 押し続けてロックオン、離すと誘導弾
//       Q・E か ←←・→→ バレルロール / V Uターン / Shift ブースト / Z ブレーキ / I 上下反転 / C コックピット視点 / B ワイド兵装 / F 変形(戦闘⇔巡航) / Space 開始・再開
// URL の末尾に #demo で自動操縦。#demo,sim=1800 なら 1800フレーム先へ進めて表示。,god で無敵、,still で停止、,look で戦艦の近くから開始(確認用)。
// (レール版は 実装\旧\v2_rail_2026-09-21\ に残してある)

const W = 1280, H = 720, CX = W / 2, CY = H / 2 - 20, F = 700;   // 画面と、透視投影の焦点距離
const ARENA = 6000;                 // 戦闘空域(球)の半径
const CAM_BACK = 380, CAM_UP = 90, CAM_DOWN = 0.16;  // カメラは自機の後ろ・上から、少し見下ろす
const STAR_N = 400, DUST_N = 250, DUST_BOX = 2400;

function mkCol(r, g, b) { return { rgb: [r, g, b], fill: `rgb(${r * 0.11 | 0},${g * 0.11 | 0},${b * 0.11 | 0})`, stroke: `rgb(${r},${g},${b})` }; }
const C = {
  ship: mkCol(120, 225, 255), shipHit: mkCol(255, 60, 60), fighter: mkCol(255, 70, 80), fighter2: mkCol(190, 80, 255),
  chaser: mkCol(255, 60, 60), gunner: mkCol(255, 150, 40), swarm: mkCol(190, 80, 255), inter: mkCol(255, 240, 70), stealth: mkCol(255, 60, 220),
  debris: mkCol(255, 110, 50), poly: { rgb: [255, 60, 60], fill: 'rgba(0,0,0,0)', stroke: 'rgb(255,60,60)' },
  stealthDim: { rgb: [130, 130, 180], fill: 'rgba(0,0,0,0)', stroke: 'rgba(140,140,200,0.3)' }, asteroid: mkCol(150, 200, 255),
  hull: mkCol(170, 90, 255), dread: mkCol(60, 170, 255), turret: mkCol(255, 70, 220), gen: mkCol(60, 240, 255),
  bridgeOn: mkCol(255, 140, 50), bridgeOff: mkCol(110, 110, 150), white: mkCol(255, 255, 255),
};
const HUDC = [0, 240, 255];
// 5つの勢力。星系ごとに支配する勢力が決まる(ステージ順)。敵機・戦艦の色、AI、武装が、勢力で変わる
const FACTION_ORDER = ['empire', 'machine', 'bio', 'ancient', 'void'];
const FACTIONS = {
  empire: { name: 'GALACTIC EMPIRE', rgb: [255, 60, 60], hp: 0, spd: 1, weapons: ['laserCannon', 'plasmaCannon', 'megaCannon', 'empireMissile'] },
  machine: { name: 'MACHINE LEGION', rgb: [0, 220, 255], hp: 0, spd: 1.05, weapons: ['pulseBeam', 'railgun', 'naniteSwarm', 'repairBeam'] },
  bio: { name: 'BIO SWARM', rgb: [100, 255, 120], hp: 0, spd: 1.15, weapons: ['acidShot', 'sporeCannon', 'parasiteMissile', 'hiveSpawn'] },
  ancient: { name: 'ANCIENT CIVILIZATION', rgb: [255, 220, 80], hp: 2, spd: 0.55, weapons: ['prismBeam', 'solarBeam', 'gravitySphere', 'ancientLance'] },
  void: { name: 'VOID ENTITY', rgb: [220, 80, 255], hp: 0, spd: 1.2, weapons: ['chaosBeam', 'voidSpike', 'singularity', 'warpRift'] },
};
for (const k of FACTION_ORDER) FACTIONS[k].col = mkCol(...FACTIONS[k].rgb);
const FACTION_EXTRA = { empire: ['flakBurst', 'orbitalStrike'], machine: ['ionPulse', 'droneSwarm'], bio: ['toxinCloud', 'tentacleLash'], ancient: ['novaBurst', 'starfall'], void: ['entropyRay', 'phantomBlades'] };
for (const k of FACTION_ORDER) FACTIONS[k].extra = FACTION_EXTRA[k];
function wireCol(rgb) { return { rgb, fill: 'rgba(0,0,0,0)', stroke: `rgb(${rgb[0]},${rgb[1]},${rgb[2]})` }; }
const PLANETS = ['XAVIER', 'KEPLER-9', 'ORION', 'VEGA', 'ZETA', 'ALTAIR', 'PYRRHOS', 'HELIOS', 'NEMESIS', 'CASTOR'];

const assetManager = new AssetManager(ASSET_DATA);
let DEST = [0, 0, 30000], START = [0, 0, 0], travelDir = [0, 0, 1], destDist0 = 30000, enc = 0, bossShip = null, bossSpawned = false, warningT = 0;
const DEST_R = 3400; let ENC_AT = [0.18, 0.38, 0.58, 0.78];   // 目的地の惑星の半径と、遭遇戦が起きる位置(道のりの割合)   // 全30アセットの仕様(assets.js)
let fences = [], swarmT = 900, whiteFlash = 0, announceT = 0, announceTxt = '', announceId = '', ranking = [], rankSaved = false;
const seen = new Set();
let specialBullets = [], charges = [], beamFx = [], empireCount = 0, machineVolleyT = 100, volley = false;
const forceFaction = (/(?:faction|ship)=(\w+)/.exec(location.hash) || [])[1] || null;   // 確認用: #faction=void など
// iPad(iPadOS は Mac と名乗る)・iPhone・Android を判定。タッチ端末は、軽量モード(グロウを切り、敵の数を減らす)で始める
const isTouchDev = typeof navigator !== 'undefined' && (/iPad|iPhone|iPod|Android/.test(navigator.userAgent) || (navigator.maxTouchPoints > 1 && /Mac/.test(navigator.platform)));
let lite = isTouchDev || location.hash.includes('lite'), fpsAvg = 16.7, fpsN = 0;
let cockpit = false;          // C キーでコックピット視点
let paused = false;
let state = 'title';          // 'title' | 'play' | 'over'
let mode = 'fight';           // 'fight' | 'clear' | 'warp'
let demo = false, god = false, simT = 0;
let P;                        // 自機
let cam = { p: [0, 0, 0], r: [1, 0, 0], u: [0, 1, 0], f: [0, 0, 1], yaw: 0, pitch: 0 };
let ships = [], fighters = [], asteroids = [], ebullets = [], pbullets = [], missiles = [], particles = [], shockwaves = [];
let stars = [], dust = [];
let stage = 1, modeT = 0, spawnT = 60, shake = 0, flash = 0, invertY = false, planetRot = 0;
let M = {};                   // メッシュ
const pulse = { launch: false, roll: 0, release: false, uturn: false, wide: false, form: false };
const lastTap = { '-1': -1e9, '1': -1e9 };
const perf = { n: 0, ms: 0 };

// ---------- ベクトル ----------
const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const vlen = a => Math.hypot(a[0], a[1], a[2]);
const vsub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const vadd = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const vmul = (a, k) => [a[0] * k, a[1] * k, a[2] * k];
const vnorm = a => { const l = vlen(a) || 1; return [a[0] / l, a[1] / l, a[2] / l]; };
const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const angDiff = a => Math.atan2(Math.sin(a), Math.cos(a));
const rnd = (a, b) => a + Math.random() * (b - a);
function randDir() { const a = Math.random() * TWO_PI, z = Math.random() * 2 - 1, s = Math.sqrt(1 - z * z); return [s * Math.cos(a), z, s * Math.sin(a)]; }

// 向き(ヨー・ピッチ・ロール)から、前・右・上の3軸を作る。x=右, y=上, z=奥
function basisYP(yaw, pitch, roll) {
  const sy = Math.sin(yaw), cy = Math.cos(yaw), sp = Math.sin(pitch), cp = Math.cos(pitch);
  const f = [sy * cp, sp, cy * cp], r0 = [cy, 0, -sy], u0 = [-sp * sy, cp, -sp * cy];
  if (!roll) return { f, r: r0, u: u0 };
  const c = Math.cos(roll), s = Math.sin(roll);
  return { f, r: [r0[0] * c + u0[0] * s, r0[1] * c + u0[1] * s, r0[2] * c + u0[2] * s], u: [-r0[0] * s + u0[0] * c, -r0[1] * s + u0[1] * c, -r0[2] * s + u0[2] * c] };
}
function basisDir(f, roll) {
  let r = [f[2], 0, -f[0]]; const l = Math.hypot(r[0], r[2]);
  r = l < 1e-4 ? [1, 0, 0] : [r[0] / l, 0, r[2] / l];
  let u = cross(f, r);
  if (roll) {
    const c = Math.cos(roll), s = Math.sin(roll), r2 = [r[0] * c + u[0] * s, r[1] * c + u[1] * s, r[2] * c + u[2] * s];
    u = [-r[0] * s + u[0] * c, -r[1] * s + u[1] * c, -r[2] * s + u[2] * c]; r = r2;
  }
  return { f, r, u };
}

// ---------- カメラ・投影 ----------
function toCam(x, y, z) {
  const dx = x - cam.p[0], dy = y - cam.p[1], dz = z - cam.p[2];
  return [dx * cam.r[0] + dy * cam.r[1] + dz * cam.r[2], dx * cam.u[0] + dy * cam.u[1] + dz * cam.u[2], dx * cam.f[0] + dy * cam.f[1] + dz * cam.f[2]];
}
function sc(c) { const k = F / c[2]; return [CX + c[0] * k, CY - c[1] * k, k]; }
function projW(p) { const c = toCam(p[0], p[1], p[2]); return c[2] < 20 ? null : sc(c); }
function fogA(z) { return z < 5000 ? 1 : Math.max(0.28, 1 - (z - 5000) / 12000); }
function neon(col, alpha = 255, blur = 12, weight = 2) {
  stroke(col[0], col[1], col[2], alpha); strokeWeight(weight); noFill();
  drawingContext.shadowColor = `rgba(${col[0]},${col[1]},${col[2]},0.9)`; drawingContext.shadowBlur = lite ? 0 : blur;
}
function noGlow() { drawingContext.shadowBlur = 0; }

// ---------- メッシュ作成 ----------
const BOXF = [[0, 1, 2, 3], [4, 5, 6, 7], [0, 1, 5, 4], [2, 3, 7, 6], [0, 3, 7, 4], [1, 2, 6, 5]];
class MB {
  constructor() { this.v = []; this.f = []; }
  put(vs, fs, x, y, z, ry, rx) {
    const base = this.v.length, cy = Math.cos(ry), sy = Math.sin(ry), cx = Math.cos(rx), sx = Math.sin(rx);
    for (const p of vs) {
      let a = p[0], b = p[1], c = p[2], t;
      t = b * cx - c * sx; c = b * sx + c * cx; b = t;
      t = a * cy + c * sy; c = -a * sy + c * cy; a = t;
      this.v.push([a + x, b + y, c + z]);
    }
    for (const f of fs) this.f.push(f.map(i => i + base));
    return this;
  }
  box(x, y, z, w, h, d, ry = 0, rx = 0) { const a = w / 2, b = h / 2, c = d / 2; return this.put([[-a, -b, -c], [a, -b, -c], [a, b, -c], [-a, b, -c], [-a, -b, c], [a, -b, c], [a, b, c], [-a, b, c]], BOXF, x, y, z, ry, rx); }
  frustum(x, y, z, w0, h0, w1, h1, d, ry = 0, rx = 0) {   // 奥(−z)の面が w0×h0、手前(+z)の面が w1×h1
    return this.put([[-w0 / 2, -h0 / 2, -d / 2], [w0 / 2, -h0 / 2, -d / 2], [w0 / 2, h0 / 2, -d / 2], [-w0 / 2, h0 / 2, -d / 2], [-w1 / 2, -h1 / 2, d / 2], [w1 / 2, -h1 / 2, d / 2], [w1 / 2, h1 / 2, d / 2], [-w1 / 2, h1 / 2, d / 2]], BOXF, x, y, z, ry, rx);
  }
  prism(x, y, z, r0, r1, h, n, ry = 0, rx = 0) {         // 縦の円柱・円錐台。下が r0、上が r1
    const vs = [], fs = [];
    for (let k = 0; k < 2; k++) for (let i = 0; i < n; i++) { const a = TWO_PI * i / n, r = k ? r1 : r0; vs.push([Math.cos(a) * r, k ? h / 2 : -h / 2, Math.sin(a) * r]); }
    for (let i = 0; i < n; i++) fs.push([i, (i + 1) % n, n + (i + 1) % n, n + i]);
    fs.push([...Array(n).keys()]); fs.push([...Array(n).keys()].map(i => n + i));
    return this.put(vs, fs, x, y, z, ry, rx);
  }
  poly(pts, y0, y1) {   // xz 平面の多角形を、y0〜y1 の厚みに押し出す
    const n = pts.length, vs = [], fs = [];
    for (const [x, z] of pts) vs.push([x, y0, z]);
    for (const [x, z] of pts) vs.push([x, y1, z]);
    for (let i = 0; i < n; i++) fs.push([i, (i + 1) % n, n + (i + 1) % n, n + i]);
    fs.push([...Array(n).keys()]); fs.push([...Array(n).keys()].map(i => n + i));
    return this.put(vs, fs, 0, 0, 0, 0, 0);
  }
  cylz(x, y, z, r0, r1, len, n) { return this.prism(x, y, z, r0, r1, len, n, 0, Math.PI / 2); }   // 奥行き方向の円柱(手前が r1)
}
function buildPlayerShip(fold) {   // fold=1: 戦闘形態(翼を開く)、0: 巡航形態(翼を畳み、機首が伸びる)
  const m = new MB(), wx = 22 + 50 * fold, dn = 26 * (1 - fold);
  m.frustum(0, 0, -4, 24, 15, 12, 10, 90).frustum(0, -1, 58 + dn / 2, 12, 10, 2, 3, 44 + dn);   // 胴体と機首
  m.frustum(0, 10, 4, 15, 7, 9, 4, 36).box(0, 6, -26, 14, 6, 22);                              // キャノピー
  m.poly([[10, 22], [wx, -32], [wx, -48], [10, -34]], -3, 1).poly([[-10, 22], [-wx, -32], [-wx, -48], [-10, -34]], -3, 1);   // 後退翼
  m.box(wx + 2, 9, -42, 3, 22, 18, 0.15 * fold).box(-wx - 2, 9, -42, 3, 22, 18, -0.15 * fold);   // 翼端の垂直翼
  m.box(0, 13, -40, 3, 24, 26);                                                               // 尾翼
  m.cylz(-15, -1, -48, 9, 8, 46, 8).cylz(15, -1, -48, 9, 8, 46, 8);                            // エンジンナセル
  m.cylz(-15, -1, -74, 8, 6, 8, 8).cylz(15, -1, -74, 8, 6, 8, 8);                              // 噴射口
  m.cylz(-(wx - 4), 0, -50, 5, 4, 4 + 18 * fold, 6).cylz(wx - 4, 0, -50, 5, 4, 4 + 18 * fold, 6);   // 翼端のスラスター(戦闘形態で露出)
  m.box(0, -9, -4, 18, 6, 60);                                                                // 腹
  return { v: m.v.map(p => p.map(c => c * 0.8)), f: m.f };
}
function buildEnemyFighter() {
  const m = new MB();
  m.frustum(0, 0, 0, 20, 14, 8, 8, 100).frustum(0, 0, 64, 8, 8, 1, 2, 28);          // 胴体と機首
  m.poly([[8, 30], [60, -22], [72, -44], [8, -30]], -2, 2).poly([[-8, 30], [-60, -22], [-72, -44], [-8, -30]], -2, 2);
  m.box(-30, 12, -32, 3, 26, 24).box(30, 12, -32, 3, 26, 24);                        // 垂直尾翼
  m.cylz(-11, 0, -52, 8, 7, 24, 8).cylz(11, 0, -52, 8, 7, 24, 8);
  m.box(0, 9, 8, 10, 6, 24);
  m.box(-56, -1, -20, 4, 4, 30).box(56, -1, -20, 4, 4, 30);                          // 翼の砲
  return { v: m.v.map(p => p.map(c => c * 0.9)), f: m.f };
}
function icosaMesh() {
  const g = (1 + Math.sqrt(5)) / 2;
  const b = [[0, 1, g], [0, -1, g], [0, 1, -g], [0, -1, -g], [1, g, 0], [-1, g, 0], [1, -g, 0], [-1, -g, 0], [g, 0, 1], [-g, 0, 1], [g, 0, -1], [-g, 0, -1]];
  const k = 1 / Math.hypot(1, g), adj = (i, j) => Math.hypot(b[i][0] - b[j][0], b[i][1] - b[j][1], b[i][2] - b[j][2]) < 2.1;
  const f = [];
  for (let i = 0; i < 12; i++) for (let j = i + 1; j < 12; j++) for (let l = j + 1; l < 12; l++) if (adj(i, j) && adj(j, l) && adj(i, l)) f.push([i, j, l]);
  return { v: b.map(p => p.map(c => c * k)), f };
}
function jitterMesh(m, amt) { return { v: m.v.map(p => { const s = 1 + rnd(-amt, amt); return [p[0] * s, p[1] * s, p[2] * s]; }), f: m.f }; }
function terrainSphere(latN, lonN) {   // クレーターのある惑星(経緯線)
  const craters = []; for (let i = 0; i < 14; i++) craters.push({ d: randDir(), r: rnd(0.12, 0.3) });
  const v = [], dir = [], e = [];
  for (let i = 0; i <= latN; i++) for (let j = 0; j < lonN; j++) {
    const a = PI * i / latN - PI / 2, b = TWO_PI * j / lonN, d = [Math.cos(a) * Math.cos(b), Math.sin(a), Math.cos(a) * Math.sin(b)];
    let h = 1 + 0.012 * Math.sin(d[0] * 5 + 1) * Math.cos(d[2] * 4) + 0.008 * Math.sin(d[1] * 7);
    for (const c of craters) {
      const ang = Math.acos(Math.max(-1, Math.min(1, dot(d, c.d))));
      if (ang < c.r * 1.5) { const t = ang / c.r; h += t < 1 ? -0.055 * (1 - t * t) : 0.03 * Math.exp(-Math.pow((t - 1) / 0.22, 2)); }
    }
    dir.push(d); v.push([d[0] * h, d[1] * h, d[2] * h]);
  }
  for (let i = 0; i <= latN; i++) for (let j = 0; j < lonN; j++) { const k = i * lonN + j; e.push([k, i * lonN + (j + 1) % lonN, 0]); if (i < latN) e.push([k, (i + 1) * lonN + j, 1]); }
  return { v, dir, e, f: [] };
}
function uvSphere(latN, lonN) {   // 経緯線だけの球(辺のみ)
  const v = [], e = [];
  for (let i = 0; i <= latN; i++) for (let j = 0; j < lonN; j++) {
    const a = PI * i / latN - PI / 2, b = TWO_PI * j / lonN;
    v.push([Math.cos(a) * Math.cos(b), Math.sin(a), Math.cos(a) * Math.sin(b)]);
  }
  for (let i = 0; i <= latN; i++) for (let j = 0; j < lonN; j++) {
    const k = i * lonN + j;
    e.push([k, i * lonN + (j + 1) % lonN]);
    if (i < latN) e.push([k, (i + 1) * lonN + j]);
  }
  return { v, f: [], e };
}
// 戦艦(巡洋艦): 段のある船体、艦橋タワー、後部エンジン。船首が +z
function buildCruiserHull() {
  const m = new MB();
  m.box(0, -20, -100, 340, 110, 1000);                                   // 下部船体
  m.frustum(0, -20, 550, 340, 110, 70, 60, 300);                         // 船首
  m.box(0, 70, -150, 260, 60, 760);                                      // 上甲板
  m.frustum(0, 62, 300, 260, 60, 120, 40, 140);                          // 甲板の前端(傾斜)
  m.box(0, 120, -300, 170, 40, 260);                                     // 艦橋の基部
  m.box(0, 170, -330, 110, 60, 150).box(0, 220, -340, 70, 40, 100);     // 艦橋タワー
  m.box(0, 275, -340, 8, 70, 8).box(-32, 255, -320, 6, 50, 6).box(32, 255, -320, 6, 50, 6);   // アンテナ
  m.box(0, 250, -400, 60, 6, 40);                                        // 通信アレイ
  m.box(220, -15, -150, 100, 80, 640).box(-220, -15, -150, 100, 80, 640);   // 舷側の張り出し
  m.frustum(220, -15, 220, 100, 80, 40, 40, 100).frustum(-220, -15, 220, 100, 80, 40, 40, 100);
  m.box(0, -95, -100, 120, 50, 760);                                     // 竜骨
  m.box(0, -10, -660, 300, 150, 130);                                    // 艦尾エンジンブロック
  for (const [x, y] of [[-90, 30], [90, 30], [-90, -50], [90, -50]]) m.cylz(x, y, -740, 52, 44, 60, 8);   // 噴射口
  m.box(250, 30, -480, 140, 20, 230, 0.3).box(-250, 30, -480, 140, 20, 230, -0.3);   // 後部の翼
  for (const s of [-1, 1]) { m.box(s * 70, 102, -100, 26, 6, 480).box(s * 130, 102, -60, 20, 6, 300); }   // 甲板のパネル
  m.box(0, 103, 60, 90, 5, 120).box(0, 103, -240, 90, 5, 60);
  return { v: m.v, f: m.f };
}
function buildTurretBase() {
  const m=new MB(); m.prism(0,0,0,43,39,15,10).frustum(0,18,0,68,30,51,22,49).box(0,35,-8,34,5,26);
  for(const sd of [-1,1])m.box(sd*30,18,-4,8,14,30);
  return {v:m.v,f:m.f};
}
function buildTurretBarrels() {
  const m=new MB(); m.box(0,23,4,42,20,30);
  for(const sd of [-1,1]) {m.cylz(sd*13,25,54,6.5,4,96,6).box(sd*13,25,25,13,14,32).box(sd*13,25,102,11,10,14);for(let i=0;i<3;i++)m.box(sd*13,32,26+i*10,11,2,3);}
  return {v:m.v,f:m.f};
}
function buildGen() { const m = new MB(); m.prism(0, 0, 0, 34, 30, 34, 8).prism(0, 28, 0, 24, 10, 26, 8).prism(0, 46, 0, 5, 4, 20, 6); return { v: m.v, f: m.f }; }
function buildBridge() { const m = new MB(); m.box(0, 0, 0, 74, 40, 92).box(0, 9, 47, 62, 10, 4).box(0, 26, -6, 30, 12, 30); return { v: m.v, f: m.f }; }
function bipyramid(n, r, hf, hb, sy = 1) {   // 菱形・六角形などの、前後に尖った多面体
  const v = [[0, 0, hf]], f = [];
  for (let i = 0; i < n; i++) { const a = TWO_PI * i / n; v.push([Math.cos(a) * r, Math.sin(a) * r * sy, 0]); }
  v.push([0, 0, -hb]);
  for (let i = 0; i < n; i++) { const a = 1 + i, b = 1 + (i + 1) % n; f.push([0, a, b]); f.push([n + 1, b, a]); }
  return { v, f };
}
function debrisMesh() {   // 壊れた人工衛星の残骸(単位の大きさ)
  const m = new MB(), r = () => rnd(-1, 1);
  m.box(0, 0, 0, 0.9, 0.5, 1.4, r(), r()).box(0.7, 0.1, 0.2, 0.5, 0.4, 0.5, r(), r()).box(-0.6, -0.1, -0.4, 0.6, 0.3, 0.4, r(), r());
  m.box(1.3, 0, 0.1, 1.4, 0.03, 0.7, r() * 0.3, r() * 0.3).box(0, 0.6, 0, 0.05, 0.9, 0.05, r(), r());
  return { v: m.v, f: m.f };
}
function initMeshes() {
  M.playerA = buildPlayerShip(1); M.playerB = buildPlayerShip(0); M.player = M.playerA; M.bit = bipyramid(4, 10, 20, 10); M.enemy = buildEnemyFighter(); M.icosa = icosaMesh();
  M.hull = buildCruiserHull(); M.turretBase = buildTurretBase(); M.barrels = buildTurretBarrels(); M.gen = buildGen(); M.bridge = buildBridge();
  M.planet = terrainSphere(30, 60);
  M.chaser = bipyramid(4, 24, 58, 34);
  { const m = new MB(), bp = bipyramid(6, 36, 24, 24, 0.7); m.put(bp.v, bp.f, 0, 0, 0, 0, 0); m.box(0, 0, 40, 6, 6, 50); M.gunner = { v: m.v, f: m.f }; }
  M.swarm = bipyramid(3, 10, 26, 8);
  { const m = new MB(), bp = bipyramid(4, 9, 95, 40); m.put(bp.v, bp.f, 0, 0, 0, 0, 0); m.poly([[6, -10], [46, -38], [46, -52], [6, -30]], -1.5, 1.5).poly([[-6, -10], [-46, -38], [-46, -52], [-6, -30]], -1.5, 1.5); M.arrow = { v: m.v, f: m.f }; }
  M.core = { v: M.icosa.v.map(p => p.map(c => c * 90)), f: M.icosa.f }; M.arena = uvSphere(10, 22);
  EnemyFactory.init(); ShipFactory.init();
}

// ---------- 面の描画(奥から手前へ塗る。面の中を暗く塗って、後ろの線を隠す) ----------
function pushFaces(out, verts, faces, col) {
  // verts: カメラ座標の配列。面ごとに投影して out に積む
  const scr = new Array(verts.length);
  for (let i = 0; i < verts.length; i++) { const c = verts[i]; scr[i] = c[2] < 25 ? null : sc(c); }
  for (const f of faces) {
    const pts = []; let z = 0, ok = true;
    for (const i of f) { const s = scr[i]; if (!s) { ok = false; break; } pts.push(s); z += verts[i][2]; }
    if (ok) out.push({ z: z / f.length, pts, col });
  }
}
function worldToCamAll(vw) { const out = new Array(vw.length); for (let i = 0; i < vw.length; i++) out[i] = toCam(vw[i][0], vw[i][1], vw[i][2]); return out; }
function bakeMesh(m, pos, b, s) {   // ローカル頂点 → ワールド(向き b、拡大 s)
  return m.v.map(p => { const x = p[0] * s, y = p[1] * s, z = p[2] * s; return [pos[0] + b.r[0] * x + b.u[0] * y + b.f[0] * z, pos[1] + b.r[1] * x + b.u[1] * y + b.f[1] * z, pos[2] + b.r[2] * x + b.u[2] * y + b.f[2] * z]; });
}
function paintFaces(list) {
  list.sort((a, b) => b.z - a.z);
  const ctx = drawingContext; ctx.shadowBlur = 0; ctx.lineJoin = 'round';
  for (const fc of list) {
    const p = fc.pts, k = p[0][2];
    ctx.globalAlpha = fogA(fc.z);
    ctx.beginPath(); ctx.moveTo(p[0][0], p[0][1]);
    for (let i = 1; i < p.length; i++) ctx.lineTo(p[i][0], p[i][1]);
    ctx.closePath();
    ctx.fillStyle = fc.col.fill; ctx.fill();
    ctx.strokeStyle = fc.col.stroke; ctx.lineWidth = Math.max(0.8, Math.min(2.2, 0.7 + k * 9)); ctx.stroke();
  }
  ctx.globalAlpha = 1;
}
function paintWire(list) {   // 遠い物: 面を塗らず、辺だけを色ごとにまとめて1回で描く(軽い)
  if (!list.length) return;
  const ctx = drawingContext, groups = new Map(); ctx.shadowBlur = 0; ctx.lineJoin = 'round';
  for (const fc of list) { let g = groups.get(fc.col); if (!g) groups.set(fc.col, g = []); g.push(fc); }
  for (const [col, g] of groups) {
    ctx.beginPath();
    for (const fc of g) { const p = fc.pts; ctx.moveTo(p[0][0], p[0][1]); for (let i = 1; i < p.length; i++) ctx.lineTo(p[i][0], p[i][1]); ctx.closePath(); }
    ctx.globalAlpha = fogA(g[0].z) * 0.85; ctx.strokeStyle = col.stroke; ctx.lineWidth = 1; ctx.stroke();
  }
  ctx.globalAlpha = 1;
}
function drawEdgeMesh(m, pos, s, ry, col, alpha, blur) {   // 辺だけのメッシュ(惑星・空域の球)
  const cy = Math.cos(ry), sy = Math.sin(ry), pv = m.v.map(p => { const x = p[0] * s, y = p[1] * s, z = p[2] * s; return projW([pos[0] + x * cy + z * sy, pos[1] + y, pos[2] - x * sy + z * cy]); });
  neon(col, alpha, blur, 1.3);
  const ctx = drawingContext; ctx.beginPath();
  for (const [a, b] of m.e) { const p = pv[a], q = pv[b]; if (p && q) { ctx.moveTo(p[0], p[1]); ctx.lineTo(q[0], q[1]); } }
  ctx.stroke(); noGlow();
}

// ---------- 爆発(機体の線分が3Dで四散する) ----------
function fragments(verts, faces, col, n, big, vel) {
  if (particles.length > (lite ? 250 : 900)) return;
  const edges = [], seen = new Set();
  for (const f of faces) for (let i = 0; i < f.length; i++) { const a = f[i], b = f[(i + 1) % f.length], k = a < b ? a * 65536 + b : b * 65536 + a; if (!seen.has(k)) { seen.add(k); edges.push([a, b]); } }
  let c = [0, 0, 0]; for (const v of verts) c = vadd(c, v); c = vmul(c, 1 / verts.length);
  for (let i = 0; i < n && edges.length; i++) {
    const [a, b] = edges[Math.floor(Math.random() * edges.length)], pa = verts[a], pb = verts[b];
    const mid = vmul(vadd(pa, pb), 0.5), out = vnorm(vsub(mid, c)), sp = (big ? 12 : 6) * rnd(0.4, 1.3);
    particles.push({ p: mid, v: vadd(vmul(out, sp), vel || [0, 0, 0]), d: vmul(vsub(pb, pa), 0.5), life: rnd(50, 90), max: 90, col: col.rgb, ax: randDir(), wr: rnd(-0.22, 0.22) });
  }
}
let rumbleLast = 0;
function rumble(strong, weak, ms) {   // 被弾・大爆発・ワープで、コントローラーを振動させる(対応する機器だけ)
  const now = performance.now(); if (now - rumbleLast < 60) return; rumbleLast = now;
  try {
    const gp = (navigator.getGamepads ? Array.from(navigator.getGamepads()) : []).find(p => p && p.connected);
    if (gp && gp.vibrationActuator && gp.vibrationActuator.playEffect) gp.vibrationActuator.playEffect('dual-rumble', { duration: ms, strongMagnitude: strong, weakMagnitude: weak });
    else if (isTouchDev && navigator.vibrate) navigator.vibrate(Math.round(ms / 2));
  } catch (e) { /* 振動できなくても、ゲームは続ける */ }
}
function addShockwave(p, maxRadius, thickness, col) { shockwaves.push({ p: [...p], r: 10, max: maxRadius, w: thickness, col }); if (maxRadius >= 600) rumble(0.6, 0.9, 320); }
function drawShockwaves() {   // 爆発の位置から、光の輪が広がる(3D の位置に、画面の丸として描く)
  noGlow();
  for (const sw of shockwaves) {
    const prog = sw.r / sw.max; if (prog > 1) continue;
    const c = toCam(sw.p[0], sw.p[1], sw.p[2]); if (c[2] < 20) continue;
    const q = sc(c), rad = F * sw.r / c[2];
    neon(sw.col, 255 * (1 - prog), sw.w * 2 * (1 - prog), Math.max(0.6, sw.w * (1 - prog))); ellipse(q[0], q[1], rad * 2);
  }
  noGlow();
}
function burst(p, n, sp, col, vel) {
  if (particles.length > (lite ? 250 : 900)) return;
  for (let i = 0; i < n; i++) {
    const d = randDir(), s = sp * rnd(0.3, 1.2);
    particles.push({ p: [...p], v: vadd(vmul(d, s), vel || [0, 0, 0]), d: vmul(d, s * 1.3), life: rnd(18, 45), max: 45, col: col || [255, 210, 90] });
  }
}

// ---------- EnemyFactory: 勢力 × seed から、敵機の形を作る ----------
// 戦闘機(fighter)10種 + 空母機(carrier)4種 + ドローン(drone)4種 を、5勢力ぶん = 90種。seed が同じなら、いつも同じ形になる(毎回作り直さず、起動時に1度だけ作る)
function mulberry32(a) { return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
function engineRow(m, E, L, spread, r) { for (let i = 0; i < E; i++) m.cylz(E === 1 ? 0 : (i / (E - 1) - 0.5) * spread * 2, 0, -L * 0.5, r, r * 0.85, L * 0.22, 6); }
function mirrorPoly(m, pts, y0, y1) { m.poly(pts, y0, y1).poly(pts.map(([x, z]) => [-x, z]).reverse(), y0, y1); }
function aimPut(m, mesh, x, y, z, dx, dy, dz) {   // 向き (dx,dy,dz) へ伸びる部品を、位置 (x,y,z) に置く
  const l = Math.hypot(dx, dy, dz) || 1; m.put(mesh.v, mesh.f, x, y, z, Math.atan2(dx, dz), -Math.asin(dy / l));
}
const FAC_BUILD = {
  empire(m, s, rng) {   // 角ばった、後退翼の編隊機
    const L = s.bodyLength, W = s.wingSize, sw = rng(), wx = 45 * W, tz = -L * (0.2 + 0.3 * sw);
    m.frustum(0, 0, 0, L * 0.2, L * 0.14, L * 0.08, L * 0.08, L).frustum(0, 0, L * 0.64, L * 0.08, L * 0.08, 1, 2, L * 0.28);
    mirrorPoly(m, [[8, L * 0.3], [wx, tz + 22], [wx + 12, tz - 10], [8, -L * 0.3]], -2, 2);
    m.box(-wx * 0.5, 12, -L * 0.32, 3, 26, 24).box(wx * 0.5, 12, -L * 0.32, 3, 26, 24);
    engineRow(m, s.engineCount, L, 11, 8);
    if (s.armorLevel) m.box(0, 9, L * 0.08, 10, 6, L * 0.24);
  },
  machine(m, s, rng) {   // 細い胴体と、左右対称の刃のような翼
    const L = s.bodyLength, W = s.wingSize, wx = 14 + 22 * W;
    m.box(0, 0, 0, L * 0.1, L * 0.1, L * 1.05).box(0, L * 0.07, L * 0.38, L * 0.06, L * 0.05, L * 0.2);
    m.box(-wx / 2 - 6, 0, -L * 0.15, wx, 3, L * 0.28).box(wx / 2 + 6, 0, -L * 0.15, wx, 3, L * 0.28);
    for (const sd of [-1, 1]) m.box(sd * (wx + 8), 0, L * 0.05, 5, 5, L * 0.55);
    engineRow(m, s.engineCount, L, 10, 6);
    if (s.armorLevel) m.box(0, -L * 0.07, -L * 0.05, L * 0.16, L * 0.05, L * 0.3);
  },
  bio(m, s, rng) {   // 曲がった胴体、トゲ、大あご
    const L = s.bodyLength, W = s.wingSize, bp = bipyramid(5, L * 0.17, L * 0.5, L * 0.4, 0.8), sp = bipyramid(3, 3, 24 * W, 2), n = 3 + s.engineCount;
    m.put(bp.v, bp.f, 0, 0, 0, 0, 0);
    for (let i = 0; i < n; i++) { const a = (i / n) * TWO_PI + rng(); aimPut(m, sp, Math.cos(a) * L * 0.1, Math.sin(a) * L * 0.1, -L * 0.2, Math.cos(a) * 0.7, Math.sin(a) * 0.7, -0.5); }
    mirrorPoly(m, [[6, L * 0.45], [22 * W, L * 0.62], [9, L * 0.33]], -2, 2);
    if (s.armorLevel) m.box(0, L * 0.14, -L * 0.05, 8, 6, L * 0.3);
  },
  ancient(m, s, rng) {   // 幅のある菱形、浮かぶ輪と柱
    const L = s.bodyLength, W = s.wingSize, r = 20 + 16 * W, bp = bipyramid(rng() < 0.5 ? 4 : 6, r, L * 0.45, L * 0.4, 0.9);
    m.put(bp.v, bp.f, 0, 0, 0, 0, 0).prism(0, 0, -L * 0.05, r * 1.5, r * 1.5, 3, 8).box(0, r * 0.6, -L * 0.1, 4, r * 0.6, 4);
    for (let i = 0; i < 1 + (s.engineCount > 2 ? 1 : 0); i++) m.box(-(r + 14), 0, L * 0.12 - i * L * 0.3, 6, 6, L * 0.4).box(r + 14, 0, L * 0.12 - i * L * 0.3, 6, 6, L * 0.4);
    if (s.armorLevel) m.box(0, -r * 0.5, 0, r * 0.8, 5, L * 0.3);
  },
  void(m, s, rng) {   // 左右がそろわない、砕けた破片
    const L = s.bodyLength, W = s.wingSize, bp = bipyramid(3, 12 + 8 * W, L * 0.55, L * 0.3, 1), n = 2 + s.engineCount, side = rng() < 0.5 ? -1 : 1;
    m.put(bp.v, bp.f, 0, 0, 0, 0, 0);
    m.poly([[6, L * 0.2], [side * 45 * W, -L * 0.2], [side * 30 * W, -L * 0.4], [6, -L * 0.25]], -1.5, 1.5);
    for (let i = 0; i < n; i++) m.box((rng() * 2 - 1) * L * 0.45 * W, (rng() - 0.5) * L * 0.3, (rng() * 1.0 - 0.6) * L * 0.6, 6 + rng() * 10, 3 + rng() * 11, 20 + rng() * 30, rng() * 3, rng() * 3);
    if (s.armorLevel) m.box(0, 0, -L * 0.1, 10, 10, L * 0.3);
  },
};
const FAC_DRONE = {
  empire(m, r, rng) { m.box(0, 0, 0, r * 1.4, r * 1.4, r * 1.6).box(-r * 1.3, 0, 0, 3, r * 1.8, r * 1.8).box(r * 1.3, 0, 0, 3, r * 1.8, r * 1.8); },
  machine(m, r, rng) { m.box(0, 0, 0, r, r, r).box(0, 0, 0, r * 2.4, 2, 2).box(0, 0, 0, 2, r * 2.4, 2).box(0, 0, r * 0.9, 3, 3, r); },
  bio(m, r, rng) { const bp = bipyramid(5, r * 0.6, r * 1.2, r * 0.8), sp = bipyramid(3, 1.5, r, 1); m.put(bp.v, bp.f, 0, 0, 0, 0, 0); for (let i = 0; i < 3; i++) { const a = rng() * TWO_PI; aimPut(m, sp, 0, 0, -r * 0.4, Math.cos(a), Math.sin(a), -0.6); } },
  ancient(m, r, rng) { const bp = bipyramid(4, r * 0.9, r, r); m.put(bp.v, bp.f, 0, 0, 0, 0, 0).prism(0, 0, 0, r * 1.5, r * 1.5, 2, 6); },
  void(m, r, rng) { const bp = bipyramid(3, r * 0.7, r * 1.4, r * 0.6); m.put(bp.v, bp.f, 0, 0, 0, 0, 0).box((rng() - 0.5) * r * 2, (rng() - 0.5) * r, -r * 0.5, r * 0.5, 2, r, rng() * 3, rng() * 3); },
};
const EnemyFactory = {
  catalog: {},
  COUNTS: { fighter: 10, carrier: 4, drone: 4 },
  REF: { fighter: 95, carrier: 150, drone: 24 },   // 基準の大きさ(これと比べて、当たり判定の半径を決める)
  CODE: { empire: 'EMP', machine: 'MCH', bio: 'BIO', ancient: 'ANC', void: 'VOD' },
  makeFighter(faction, seed) { return this.build('fighter', faction, seed); },
  makeCarrierFighter(faction, seed) { return this.build('carrier', faction, seed); },
  makeDrone(faction, seed) { return this.build('drone', faction, seed); },
  build(cat, faction, seed) {
    const rng = mulberry32(seed * 7919 + FACTION_ORDER.indexOf(faction) * 104729 + (cat === 'fighter' ? 1 : cat === 'carrier' ? 2 : 3) * 15485863), R = (a, b) => a + rng() * (b - a);
    const s = cat === 'drone' ? { bodyLength: R(28, 46), wingSize: R(0.7, 1.3), engineCount: 1 + (rng() * 2 | 0), armorLevel: 0, speed: R(0.9, 1.2) }
      : cat === 'carrier' ? { bodyLength: R(130, 190), wingSize: R(0.9, 1.5), engineCount: 2 + (rng() * 3 | 0), armorLevel: 1 + (rng() * 2 | 0), speed: R(0.7, 0.95) }
      : { bodyLength: R(75, 125), wingSize: R(0.7, 1.4), engineCount: 1 + (rng() * 4 | 0), armorLevel: rng() < 0.3 ? 1 : 0, speed: R(0.85, 1.2) };
    const opts = FACTIONS[faction].weapons.filter(n => WEAPONS[n].kind !== 'heal' && WEAPONS[n].kind !== 'spawn');
    s.weaponType = cat === 'drone' ? opts[0] : opts[Math.floor(rng() * opts.length)];
    const m = new MB();
    if (cat === 'drone') FAC_DRONE[faction](m, s.bodyLength * 0.4, rng);
    else {
      FAC_BUILD[faction](m, s, rng);
      if (cat === 'carrier') { const L = s.bodyLength; m.box(0, -L * 0.09, -L * 0.05, L * 0.24, L * 0.08, L * 0.5).box(-L * 0.16, -L * 0.02, -L * 0.25, L * 0.09, L * 0.09, L * 0.34).box(L * 0.16, -L * 0.02, -L * 0.25, L * 0.09, L * 0.09, L * 0.34); }   // 格納庫と、ミサイルポッド
    }
    const mesh = { v: m.v, f: m.f };
    s.ext = Math.max(...mesh.v.map(p => Math.hypot(p[0], p[1], p[2])));
    s.size = Math.max(0.75, Math.min(1.4, s.ext / this.REF[cat]));
    return { name: this.CODE[faction] + '-' + (cat === 'fighter' ? 'F' : cat === 'carrier' ? 'C' : 'D') + String(seed).padStart(2, '0'), faction, cat, seed, mesh, detail: Object.assign(buildFighterDetails(s, faction, cat), { lines: buildFighterLines(s, faction, cat) }), spec: s };
  },
  init() {
    for (const fac of FACTION_ORDER) {
      const c = this.catalog[fac] = { fighter: [], carrier: [], drone: [] };
      for (let i = 1; i <= this.COUNTS.fighter; i++) c.fighter.push(this.makeFighter(fac, i));
      for (let i = 1; i <= this.COUNTS.carrier; i++) c.carrier.push(this.makeCarrierFighter(fac, i));
      for (let i = 1; i <= this.COUNTS.drone; i++) c.drone.push(this.makeDrone(fac, i));
    }
  },
  pick(faction, cat) { const a = this.catalog[faction][cat]; return a[Math.floor(Math.random() * a.length)]; },
  get total() { return FACTION_ORDER.reduce((n, f) => n + this.COUNTS.fighter + this.COUNTS.carrier + this.COUNTS.drone, 0); },
};

// ---------- ShipFactory: 勢力 × 級 × seed から、大型艦の形を作る ----------
// 巡洋艦 Cruiser(小)/ 戦艦 BattleShip / 空母 Carrier / ドレッドノート Dreadnought / タイタン Titan。勢力ごとに、巡洋艦4・戦艦4・空母2・ドレッドノート1・タイタン1 = 12種。5勢力で60種(巡洋艦20・戦艦20・空母10・ドレッドノート5・タイタン5)
const SHIP_CLS = {
  cruiser: { S: 0.7, nT: 4, nG: 1, nE: 2, hpT: 4, hpG: 8, hpB: 14, tiers: 1, cnt: 4, code: 'CR', L: [1200, 1500] },
  battle: { S: 1, nT: 6, nG: 2, nE: 3, hpT: 5, hpG: 10, hpB: 22, tiers: 2, cnt: 4, code: 'BB', L: [1400, 1700] },
  carrier: { S: 1.15, nT: 4, nG: 2, nE: 4, hpT: 5, hpG: 10, hpB: 26, tiers: 1, cnt: 2, code: 'CV', L: [1500, 1800] },
  dread: { S: 2, nT: 10, nG: 3, nE: 4, hpT: 9, hpG: 18, hpB: 60, tiers: 3, cnt: 1, code: 'DN', L: [1400, 1700] },
  titan: { S: 3.2, nT: 16, nG: 4, nE: 6, hpT: 12, hpG: 26, hpB: 110, tiers: 4, cnt: 1, code: 'TT', L: [1500, 1800] },
};
function profHW(prof, z) {   // 甲板の半幅を、位置 z から引く(prof は [z, 半幅] の並び。zが大きい順)
  if (z > prof[0][0] || z < prof[prof.length - 1][0]) return 0;
  for (let i = 0; i < prof.length - 1; i++) { const [z0, h0] = prof[i], [z1, h1] = prof[i + 1]; if (z <= z0 && z >= z1) return h0 + (h1 - h0) * (z0 - z) / ((z0 - z1) || 1); }
  return 0;
}
const FAC_HULL = {   // 船体を作って、甲板の高さ y と半幅の形 prof、艦尾の位置 zs を返す。船首が +z
  empire(m, L, W, rng) {   // 楔形の、二層の船体
    const t = 70 + rng() * 30, k = 0.85 + rng() * 0.3;
    m.poly([[0, L * 0.55], [W * 1.1 * k, -L * 0.15], [W * 0.9 * k, -L * 0.5], [-W * 0.9 * k, -L * 0.5], [-W * 1.1 * k, -L * 0.15]], -t, 0);
    m.poly([[0, L * 0.36], [W * 0.72 * k, -L * 0.1], [W * 0.6 * k, -L * 0.44], [-W * 0.6 * k, -L * 0.44], [-W * 0.72 * k, -L * 0.1]], 0, t * 0.7);
    m.box(0, -t * 0.9, -L * 0.05, W * 0.3, t * 0.5, L * 0.85);
    return { y: t * 0.7, prof: [[L * 0.36, 0], [-L * 0.1, W * 0.72 * k], [-L * 0.44, W * 0.6 * k]], zs: -L * 0.5 };
  },
  machine(m, L, W, rng) {   // 箱型の区画が並ぶ、モジュール式
    m.box(0, 0, 0, 50, 50, L * 0.95);
    for (let i = 0; i < 4; i++) m.box(0, -40, L * (0.35 - i * 0.23), W * (1.15 - 0.1 * i), 110, L * 0.17);
    m.box(0, 15, 0, W * 0.9, 20, L * 0.8);
    for (const sd of [-1, 1]) m.box(sd * W * 0.8, -10, -L * 0.1, 60, 60, L * (0.4 + rng() * 0.2));
    return { y: 25, prof: [[L * 0.4, W * 0.45], [-L * 0.4, W * 0.45]], zs: -L * 0.44 };
  },
  bio(m, L, W, rng) {   // 生き物のような、卵形の船体とトゲ
    const bp = bipyramid(6, W * 0.75, L * 0.55, L * 0.5, 0.6), sp = bipyramid(3, 14, 150 + rng() * 80, 4);
    m.put(bp.v, bp.f, 0, 0, 0, 0, 0);
    for (let i = 0; i < 8; i++) { const a = rng() * TWO_PI, z = (rng() - 0.6) * L * 0.6; aimPut(m, sp, Math.cos(a) * W * 0.5, Math.sin(a) * W * 0.3, z, Math.cos(a), Math.sin(a) * 0.8, -0.4); }
    const y = W * 0.39 + 12; m.box(0, y - 6, -L * 0.03, W * 0.66, 12, L * 0.7);
    return { y, prof: [[L * 0.32, W * 0.33], [-L * 0.38, W * 0.33]], zs: -L * 0.5 };
  },
  ancient(m, L, W, rng) {   // 広い菱形の船体と、浮かぶ輪
    const bp = bipyramid(4, W * 0.9, L * 0.5, L * 0.45, 0.5), y = W * 0.45 + 8;
    m.put(bp.v, bp.f, 0, 0, 0, 0, 0).prism(0, 0, -L * 0.05, W * 1.6, W * 1.6, 20, 12).box(0, y - 8, -L * 0.05, W * 0.8, 16, L * 0.65);
    for (const sd of [-1, 1]) m.box(sd * W * 1.35, 0, L * 0.05, 30, 30, L * (0.45 + rng() * 0.15));
    return { y, prof: [[L * 0.27, W * 0.4], [-L * 0.37, W * 0.4]], zs: -L * 0.45 };
  },
  void(m, L, W, rng) {   // 背骨に、砕けた破片が付いた船体
    m.box(0, 0, 0, 70, 60, L * 0.9).box(0, 70, 0, W * 0.66, 20, L * 0.7);
    for (let i = 0; i < 7; i++) m.box((rng() * 2 - 1) * W * 0.95, (rng() - 0.5) * W * 0.6, (rng() - 0.5) * L * 0.8, 80 + rng() * 120, 40 + rng() * 80, 120 + rng() * 200, rng() * 3, rng() * 3);
    return { y: 80, prof: [[L * 0.35, W * 0.33], [-L * 0.35, W * 0.33]], zs: -L * 0.45 };
  },
};
const ShipFactory = {
  catalog: {},
  CODE: { empire: 'EMP', machine: 'MCH', bio: 'BIO', ancient: 'ANC', void: 'VOD' },
  build(cls, faction, seed) {
    const C0 = SHIP_CLS[cls], rng = mulberry32(seed * 6151 + FACTION_ORDER.indexOf(faction) * 7919 + (Object.keys(SHIP_CLS).indexOf(cls) + 1) * 99991);
    const L = C0.L[0] + rng() * (C0.L[1] - C0.L[0]), W = L * (0.15 + 0.05 * rng()), m = new MB(), d = FAC_HULL[faction](m, L, W, rng, cls);
    if (seed >= 101) {   // ボス専用の飾り: 大きな翼板と背びれ(seed から決まる)
      const n = 3 + (rng() * 4 | 0);
      for (let i = 0; i < n; i++) m.box((rng() < 0.5 ? -1 : 1) * W * (1.0 + rng() * 0.9), (rng() - 0.3) * W * 0.5, (rng() - 0.4) * L * 0.7, 60 + rng() * 90, 40 + rng() * 160, 200 + rng() * 400, (rng() - 0.5) * 0.5, 0);
      m.box(0, d.y + 90 + rng() * 80, -L * 0.05, 20, 120 + rng() * 120, L * (0.2 + rng() * 0.2));
    }
    const hwAt = z => profHW(d.prof, z), zb = -L * 0.22, hb = hwAt(zb) || W * 0.4;
    for (let k = 0; k < C0.tiers; k++) m.box(0, d.y + 40 + k * 50, zb, hb * 1.1 * (1 - 0.2 * k), 80, 170 - 30 * k);   // 艦橋の塔
    const towerTop = d.y + 40 + (C0.tiers - 1) * 50 + 40, bridgeY = towerTop + 22;
    m.box(0, towerTop + 70, zb - 10, 8, 90, 8).box(-30, towerTop + 40, zb + 20, 6, 50, 6);   // アンテナ
    const T = [];
    for (const off of [0, L * 0.025]) for (let z = L * 0.4 - off; z > -L * 0.17 && T.length < C0.nT; z -= L * 0.05) {   // 砲塔は、甲板の上に並べる
      const h = hwAt(z); if (h < 40) continue;
      if (h < 90) T.push([0, d.y + 14, z]); else { T.push([-h * 0.65, d.y + 14, z]); if (T.length < C0.nT) T.push([h * 0.65, d.y + 14, z]); }
    }
    const G = [[-1, -0.36], [1, -0.36], [0, -0.06], [0, 0.14]].slice(0, Math.max(C0.nG, 1)).map(([sx, zz]) => [sx * hwAt(L * zz) * 0.55, d.y + 22, L * zz]);
    if (C0.nG === 1) G[0] = [0, d.y + 22, -L * 0.36];
    const E = [], er = Math.min(45, W * 1.1 / C0.nE * 0.4);
    for (let i = 0; i < C0.nE; i++) { const x = C0.nE === 1 ? 0 : (i / (C0.nE - 1) - 0.5) * W * 1.1; m.cylz(x, 0, d.zs - 25, er, er * 0.85, 90, 6); E.push([x, 0, d.zs - 70]); }
    const hangars = [];
    if (cls === 'carrier') {   // 空母: 舷側の格納庫と、発着甲板
      const h = hwAt(L * 0.1) || W * 0.4;
      m.box(-W * 0.8, -20, L * 0.1, W * 0.3, 70, L * 0.4).box(W * 0.8, -20, L * 0.1, W * 0.3, 70, L * 0.4).box(0, d.y + 3, L * 0.12, h * 0.9, 4, L * 0.4);
      hangars.push([-W * 0.8, -20, L * 0.3], [W * 0.8, -20, L * 0.3], [0, d.y, L * 0.34]);
    }
    const sph = []; for (let i = 0; i < 7; i++) sph.push({ lp: [0, 0, L * (-0.42 + i * 0.14)], r: Math.max(150, W * 0.7) });
    sph.push({ lp: [0, bridgeY, zb], r: 100 });
    return { name: this.CODE[faction] + '-' + C0.code + String(seed).padStart(2, '0'), faction, cls, seed, mesh: { v: m.v, f: m.f }, detail: buildCapitalDetails(cls, faction, L, W, d, towerTop, zb, E, seed >= 101), turrets: T, gens: G, bridge: [0, bridgeY, zb], engines: E, hangars, spheres: sph, hullR: L * 0.55, len: L };
  },
  init() {
    for (const fac of FACTION_ORDER) { const c = this.catalog[fac] = {}; for (const cls of Object.keys(SHIP_CLS)) { c[cls] = []; for (let i = 1; i <= SHIP_CLS[cls].cnt; i++) c[cls].push(this.build(cls, fac, i)); } }
  },
  bossDesign(def) { this.bossCache = this.bossCache || {}; return this.bossCache[def.name] || (this.bossCache[def.name] = this.build(def.shape, def.faction, 101 + BOSS_LIST.indexOf(def))); },
  pick(faction, cls) { const a = this.catalog[faction][cls]; return shipSeed && a[shipSeed - 1] ? a[shipSeed - 1] : a[Math.floor(Math.random() * a.length)]; },
};
let shipSeed = 0;   // 確認用: 設計の番号を指定
let nextShipFaction = null, nextScale = 1, nextDesign = null;   // ボスを作るときだけ使う指定(勢力・大きさの倍率・船体の設計)

// ---------- 敵: 戦闘機 ----------
const FTYPES = {
  chaser: { mesh: 'chaser', col: 'chaser', id: '06', r: 40, hp: 1, pts: 100, speed: 15, dmg: 15, turn: 0.05 },
  gunner: { mesh: 'gunner', col: 'gunner', id: '07', r: 48, hp: 3, pts: 300, speed: 9, dmg: 12, turn: 0.04 },
  swarm: { mesh: 'swarm', col: 'swarm', id: '08', r: 24, hp: 1, pts: 30, speed: 14, dmg: 8, turn: 0.06 },
  interceptor: { mesh: 'arrow', col: 'inter', id: '09', r: 36, hp: 1, pts: 200, speed: 27, dmg: 12, turn: 0.08 },
  stealth: { mesh: 'enemy', col: 'stealth', id: '10', r: 46, hp: 2, pts: 400, speed: 13, dmg: 15, turn: 0.04 },
};
// 敵AI。役割(role)の基本の動きに、勢力ごとの動きを重ねる。kind は役割の種類(SEEK 追う、SNIPER 距離を保つ、SWARM 群れ、FLANK 一撃離脱、AMBUSH 待ち伏せ)
const ROLE_KIND = { chaser: 'SEEK', gunner: 'SNIPER', swarm: 'SWARM', interceptor: 'FLANK', stealth: 'AMBUSH' };
class EnemyBrain {
  constructor(f) { this.f = f; this.kind = ROLE_KIND[f.type]; this.t = rnd(0, 100); this.cd = {}; this.mode = 'main'; this.st = 0; this.timer = rnd(150, 320); this.healTarget = null; }
  ready(key, iv) { iv *= DF().fire; if (this.cd[key] === undefined) this.cd[key] = rnd(0, iv); if (this.cd[key] > 0) return false; this.cd[key] = iv * rnd(0.85, 1.15); return true; }
  move(dt, tp, tv, d, dn) {   // 進みたい向き(want)と、速度の倍率(spd)を返す
    const f = this.f; this.t += dt; for (const k in this.cd) this.cd[k] -= dt;
    let want, spd = 1;
    if (f.type === 'chaser' || f.type === 'swarm') {
      want = vnorm(vadd(vsub(tp, f.p), vmul(tv, d / 40)));
      if (f.type === 'swarm') want = vnorm(vadd(want, [Math.sin(f.t * 0.05 + f.phase) * 0.35, Math.cos(f.t * 0.04 + f.phase) * 0.35, 0]));
    } else if (f.type === 'gunner') {
      if (d > 1350) want = dn; else if (d < 900) want = vmul(dn, -1);
      else want = vnorm(vadd(vmul(cross(dn, [0, 1, 0]), Math.floor(f.t / 300) % 2 ? 1 : -1), vmul(dn, 0.1)));
    } else {
      if (f.state === 'seek') {
        want = vnorm(vadd(vsub(tp, f.p), vmul(tv, d / 40)));
        if (d < 420) { f.state = 'break'; f.t = 0; f.brkT = rnd(70, 130); f.brk = vnorm(vadd(vmul(dn, -0.6), randDir())); }
      } else { want = f.brk; if (f.t > f.brkT) f.state = 'seek'; }
      if (f.state === 'break') spd = 1.2;
    }
    switch (f.faction) {
      case 'empire': {   // formation(): 隊長の後ろに V 字 / surround(): 自機の周りを、隊員ごとに違う角度から包囲
        const leader = fighters.find(o => o !== f && o.faction === 'empire' && o.squad === f.squad && !o.dead);
        if (leader && f.slot > 0 && d > 900) {
          const lb = basisDir(vnorm(leader.v), 0), n = Math.ceil(f.slot / 2), side = (f.slot % 2 ? 1 : -1) * n;
          const to = vsub(vadd(leader.p, vadd(vmul(lb.r, side * 140), vmul(lb.f, -120 * n))), f.p);
          if (vlen(to) > 60) { want = vnorm(vadd(vmul(vnorm(to), 0.8), vmul(want, 0.2))); break; }
        }
        if (d < 1500 && d > 700) {
          const b = basisDir(dn, 0), a = f.slot * (TWO_PI / 4) + this.t * 0.012;
          const to = vsub(vadd(tp, vadd(vmul(b.r, Math.cos(a) * 650), vmul(b.u, Math.sin(a) * 650))), f.p);
          want = vnorm(vadd(vmul(vnorm(to), 0.7), vmul(dn, 0.3)));
        }
        break; }
      case 'machine': {   // strafe(): 横へ回る / keepDistance(): 距離を保つ / 衛生兵は、傷ついた味方へ寄る
        const b = basisDir(dn, 0), s = Math.floor(this.t / 240) % 2 ? 1 : -1;
        if (f.isMedic) this.healTarget = this.healTarget && !this.healTarget.dead && this.healTarget.hp < this.healTarget.maxHp ? this.healTarget : (fighters.find(o => o !== f && !o.dead && o.hp < o.maxHp && vlen(vsub(o.p, f.p)) < 2200) || null);
        if (f.isMedic && this.healTarget) { const to = vsub(this.healTarget.p, f.p); want = vnorm(to); spd = vlen(to) < 350 ? 0.3 : 1; }
        else if (d > 1500) want = vnorm(vadd(vmul(dn, 0.8), vmul(b.r, s * 0.3)));
        else if (d < 900) want = vnorm(vadd(vmul(dn, -0.6), vmul(b.r, s)));
        else want = vnorm(vadd(vmul(b.r, s), vmul(dn, 0.05)));
        break; }
      case 'bio':   // rush(): まっすぐ突っ込む(速い)
        want = vnorm(vadd(dn, vmul(randDir(), 0.1))); spd = 1.25; break;
      case 'ancient':   // holdPosition(): 近づくと、その場に留まって撃つ
        want = dn; if (d < 1900) spd = 0.12; break;
      case 'void':   // teleport(): 自機の背後へ瞬間移動 / fakeRetreat(): 退くふりをして、戻って奇襲
        this.timer -= dt;
        if (this.mode === 'retreat') { want = vmul(dn, -1); spd = 1.4; this.st -= dt; if (this.st <= 0) { this.mode = 'main'; this.blink(); } }
        else if (this.timer <= 0) { this.timer = rnd(200, 330); if (Math.random() < 0.4) { this.mode = 'retreat'; this.st = 70; } else this.blink(); }
        break;
    }
    return { want, spd };
  }
  blink() {
    const f = this.f, pb = basisYP(P.yaw, P.pitch, 0);
    addShockwave(f.p, 120, 3, [220, 80, 255]);
    f.p = vadd(P.p, vadd(vmul(pb.f, -rnd(500, 900)), vmul(randDir(), 250))); f.v = vmul(vnorm(vsub(P.p, f.p)), f.speed);
    addShockwave(f.p, 140, 4, [220, 80, 255]); this.cd.voidSpike = 0; this.cd.chaosBeam = 0;   // 現れた直後に、奇襲の連射
  }
  shoot(name, tp, tv) { const f = this.f; if (f.type === 'stealth') f.glow = 55; fireWeapon(f, name, tp, tv); }
  fire(dt, tp, tv, d, dn, nd) {   // 勢力ごとの武装を、間隔と距離で撃ち分ける
    const f = this.f, ws = FACTIONS[f.faction].weapons, al = dot(nd, dn), rate = f.type === 'chaser' ? 1.7 : 1, sw = f.type === 'swarm';
    const sig = f.design.spec.weaponType, go = (name, iv) => { if (this.ready(name, iv * rate * (name === sig ? 0.65 : 1))) { this.shoot(name, tp, tv); return true; } return false; };
    switch (f.faction) {
      case 'empire':
        if (al > 0.93 && d < 1500) go(ws[0], 70);
        if (!sw && d < 1300 && al > 0.9) go(ws[1], 230);
        if (!sw && d > 800 && d < 2600) go(ws[3], 460);
        break;
      case 'machine':
        if (f.isMedic) { const t = this.healTarget; if (t && !t.dead && t.hp < t.maxHp && vlen(vsub(t.p, f.p)) < 900 && this.ready('heal', 100)) { t.hp = Math.min(t.maxHp, t.hp + 1); beamFx.push({ a: [...f.p], b: [...t.p], col: [80, 255, 160], life: 16 }); burst(t.p, 4, 3, [80, 255, 160]); } break; }
        if (al > 0.93 && d < 1700) go(ws[0], 95);
        if (!sw && volley && d > 900 && d < 3000 && this.ready('volley', 120)) this.shoot(ws[1], tp, tv);   // focusFire(): 全員が同時に狙撃
        if (!sw && d < 1500 && al > 0.9) go(ws[2], 720);
        break;
      case 'bio':
        if (d < 1100 && al > 0.9) go(ws[0], 70);
        if (!sw && d < 800) go(ws[1], 170);
        if (!sw && d > 600 && d < 2200) go(ws[2], 540);
        if (f.isHive) go(ws[3], 900);
        break;
      case 'ancient':
        if (d < 2200 && al > 0.8) go(ws[0], 230);
        if (d < 2400) go(ws[2], 400);
        if (d < 3000) go(ws[1], 560);
        if (d < 2600 && al > 0.9) go(ws[3], 280);
        break;
      case 'void':
        if (d < 1500 && al > 0.8) go(ws[0], 115);
        if (d < 900) go(ws[1], 65);
        if (!sw && d < 2500) go(ws[2], 950);
        if (!sw && d < 2000) go(ws[3], 520);
        break;
    }
    if (!sw && stage >= 6 && d < 2600) { const ex = FACTIONS[f.faction].extra; go(ex[0], 620); if (stage >= 10) go(ex[1], 800); }   // ステージ6から追加の武装
  }
}
class Fighter {
  constructor(p, type = 'chaser', faction, opts = {}) {
    const c = FTYPES[type], fac = faction || pickFaction(), FC = FACTIONS[fac];
    const dz = opts.design || EnemyFactory.pick(fac, type === 'swarm' ? 'drone' : type === 'gunner' ? 'carrier' : 'fighter'), sp = dz.spec;   // 役割ごとに、戦闘機・空母機・ドローンの設計から選ぶ
    this.design = dz;
    this.kind = 'fighter'; this.type = type; this.faction = fac; this.p = p; this.r = c.r * sp.size * (opts.child ? 0.8 : 1); this.pts = c.pts; this.dmg = c.dmg; this.dead = false; this.child = !!opts.child;
    this.hp = Math.max(1, Math.round(DF().hp * (c.hp + (type !== 'swarm' ? (stage >= 5) + (stage >= 12) + (stage >= 18) : 0) + (type === 'swarm' ? 0 : FC.hp + sp.armorLevel)))); this.maxHp = this.hp;
    this.speed = (c.speed + Math.random() * 2 + Math.min(3, stage * 0.3)) * FC.spd * sp.speed * DF().spd; this.turn = c.turn;
    this.v = vmul(vnorm(vsub(P.p, p)), this.speed);
    this.mesh = dz.mesh; this.col = FC.col; this.glow = 0; this.tgt = null; this.retgt = 0; this.phase = Math.random() * 6;
    this.state = 'seek'; this.t = 0; this.brk = [0, 1, 0]; this.roll = 0; this.brkT = 100;
    this.squad = 0; this.slot = 0;
    if (fac === 'empire') { this.squad = (empireCount / 4) | 0; this.slot = empireCount % 4; empireCount++; }
    this.isMedic = fac === 'machine' && type !== 'swarm' && Math.random() < 0.2;
    this.isHive = fac === 'bio' && type !== 'swarm' && Math.random() < 0.12;
    this.brain = new EnemyBrain(this);
    if (opts.warp) startWarp(this, opts.warp, FC.rgb, opts.delay || 0);   // ワープインして現れる
    announce(c.id);
  }
  get cloaked() { return this.type === 'stealth' && this.glow <= 0 && vlen(vsub(P.p, this.p)) > 500; }
  update(dt) {
    if (this.wt > 0) { tickWarp(this, dt); if (this.wt > 0) { this.p = vadd(this.p, vmul(this.v, dt * 0.25)); return; } }   // ワープ中は、撃たない
    this.t += dt; if (this.glow > 0) this.glow -= dt;
    if (this.retgt <= 0 || (this.tgt && this.tgt.dead)) { this.tgt = allies.length && Math.random() < 0.35 ? allies[Math.floor(Math.random() * allies.length)] : null; this.retgt = 240; }
    this.retgt -= dt;
    const tp = this.tgt ? this.tgt.p : P.p, tv = this.tgt ? this.tgt.v : P.v;   // 狙う相手(自機か、味方機)
    const toP = vsub(tp, this.p), d = vlen(toP), dn = vnorm(toP);
    const mv = this.brain.move(dt, tp, tv, d, dn);
    const cur = vnorm(this.v);
    thrustTo(this, vmul(mv.want, this.speed * mv.spd), this.speed * this.turn * 2.2, dt);   // 行きたい速度へ、スラスターで近づく(急には曲がれない)
    this.v = vadd(this.v, vmul(gravAt(this.p), dt));
    const nd = vnorm(this.v);
    this.roll += (dot(cross(cur, nd), [0, 1, 0]) * 14 - this.roll) * 0.1 * dt;
    this.p = vadd(this.p, vmul(this.v, dt));
    if (!P.dead) this.brain.fire(dt, tp, tv, d, dn, nd);
  }
  hurt(dm) { this.hp -= dm; return this.hp <= 0; }
  die() {
    const b = basisDir(vnorm(this.v), this.roll), vw = bakeMesh(this.mesh, this.p, b, 1);
    fragments(vw, this.mesh.f, this.col, 36, false, this.v);
    burst(this.p, 18, 10, null, this.v); addShockwave(this.p, 160, 4, [255, 180, 50]); blast(this.p, 450, 3.5); shake = Math.max(shake, 4); this.dead = true; P.kills++; SND.se('boomS', this.p);
    if (this.faction === 'bio' && !this.child && this.type !== 'swarm' && fighters.length < 40) for (let i = 0; i < 2; i++) fighters.push(new Fighter(vadd(this.p, vmul(randDir(), 50)), 'swarm', 'bio', { child: true }));   // split(): 倒すと、小型の2体に分裂
  }
  faces(out) {
    const b = basisDir(vnorm(this.v), this.roll);
    if (this.wt > 0) { if (this.wt > this.wdur) return; const w = warpXf(this, b, this.p, this.r); pushFaces(out, worldToCamAll(bakeMesh(this.mesh, w.pos, w.b, 1)), this.mesh.f, warpCol(this)); return; }
    pushFaces(out, worldToCamAll(bakeMesh(this.mesh, this.p, b, 1)), this.mesh.f, this.cloaked ? C.stealthDim : this.col);
    if (!this.cloaked && this.design.detail && vlen(vsub(this.p,cam.p)) < (lite ? 1400 : 2600)) {
      const detail = this.design.detail;
      pushFaces(out, worldToCamAll(bakeMesh(detail, this.p, b, 1)), detail.f, this.col);
    }
  }
}
// ---------- ワープイン(艦艇・艦載機が、ハイパースペースから飛び出してくる演出) ----------
// startWarp(e, 長さ, 色, 遅れ): 出現の前に、引き伸ばされた光の筋 → 実体に収束 → 衝撃波。ワープ中は、当たらず・撃たない
let chain = 0, chainT = 0, hitStop = 0, bestChain = 0;
const chainMul = () => 1 + Math.min(7, Math.floor(chain / 5));
function startWarp(e, dur, rgb, delay = 0) { e.wdur = dur; e.wt = dur + delay; e.wsnd = false; e.wrgb = rgb || [180, 230, 255]; e.wseed = Math.random() * TWO_PI; return e; }
const warpEase = t => 1 - Math.pow(1 - t, 3);
function warpT(e) { return Math.max(0, Math.min(1, 1 - e.wt / e.wdur)); }
function tickWarp(e, dt) {   // 毎フレーム。ワープが終わったら false
  if (!(e.wt > 0)) return false;
  e.wt -= dt;
  if (!e.wsnd && e.wt <= e.wdur) { e.wsnd = true; SND.se(e.wdur > 60 ? 'warpIn' : 'warpS', e.p); }
  if (e.wt <= 0) { e.wt = 0; warpArrive(e); return false; }
  return true;
}
function warpArrive(e) {   // 出現の瞬間: 光の輪と火花
  const big = !!e.hullR, R = e.hullR || e.r, rgb = e.wrgb || [180, 230, 255];
  addShockwave(e.p, R * (big ? 1.5 : 3), big ? 9 : 4, rgb); burst(e.p, big ? 46 : 12, big ? 16 : 9, rgb);
  if (big) { shake = Math.max(shake, 8); rumble(0.5, 0.7, 260); if (e.def) whiteFlash = Math.max(whiteFlash, 0.45); }
}
function warpXf(e, b, pos, R) {   // 進行方向に引き伸ばされた細い光が、実体の大きさに収束する
  const t = warpT(e), inv = 1 - t, s = 0.1 + 0.9 * warpEase(t), st = 1 + 12 * inv * inv;
  return { b: { r: vmul(b.r, s), u: vmul(b.u, s), f: vmul(b.f, st * s) }, pos: vsub(pos, vmul(b.f, R * 3.2 * inv * inv)) };
}
function warpCol(e) {   // 白 → 勢力の色
  const t = Math.min(1, warpT(e) * 1.4), c = (e.wrgb || [180, 230, 255]).map(v => Math.round(255 + (v - 255) * t));
  e._wc = e._wc || { rgb: [255, 255, 255], fill: 'rgba(0,0,0,0)', stroke: '' }; e._wc.stroke = `rgb(${c[0]},${c[1]},${c[2]})`; e._wc.rgb = c; return e._wc;
}
function drawWarpFx() {   // 収束する放射状の光と、門のリング
  noFill();
  for (const e of [...fighters, ...ships, ...allyShips]) {
    if (!(e.wt > 0) || e.wt > e.wdur) continue;
    const t = warpT(e), inv = 1 - t, R = e.hullR || e.r, c = toCam(e.p[0], e.p[1], e.p[2]); if (c[2] < 30) continue;
    const q = sc(c), k = q[2], al = Math.sin(Math.PI * Math.min(1, t * 0.9 + 0.05)), rgb = e.wrgb || [180, 230, 255], big = !!e.hullR, n = big ? 26 : 9;
    neon(rgb, 230 * al, lite ? 0 : 10, big ? 1.8 : 1.2);
    for (let i = 0; i < n; i++) {
      const a = i / n * TWO_PI + e.wseed, r1 = R * k * (big ? 0.45 + 1.3 * inv : 0.5 + 2.4 * inv), r2 = R * k * (big ? 0.15 + 0.6 * inv * inv : 0.2 + 1.1 * inv * inv);
      line(q[0] + Math.cos(a) * r1, q[1] + Math.sin(a) * r1 * 0.8, q[0] + Math.cos(a) * r2, q[1] + Math.sin(a) * r2 * 0.8);
    }
    const rr = R * k * (0.35 + 1.5 * inv); ellipse(q[0], q[1], rr * 2, rr * 1.6); if (big) ellipse(q[0], q[1], rr * 1.3, rr * 1.04);
    if (t < 0.15) { noStroke(); fill(255, 255, 255, 200 * (1 - t / 0.15)); ellipse(q[0], q[1], R * k * 0.9); noFill(); }
  }
  noGlow();
}
function allyWarp(s) { return startWarp(s, 100, [80, 255, 130]); }
function drawWeakPoints() {   // ボスと戦艦の弱点(発生器 → 艦橋)に、脈打つ照準枠を出す
  const pulse = 0.55 + 0.45 * Math.sin(frameCount * 0.2);
  for (const s of ships) {
    if (!s.alive || s.wt > 0) continue;
    const gens = s.gensAlive() > 0, cand = gens ? s.gens.filter(g => g.alive) : (s.bridge.alive ? [s.bridge] : []);
    for (const g of cand) {
      if (vlen(vsub(g.p, P.p)) > 5500 + g.r) continue;
      const q = projW(g.p); if (!q) continue;
      const sz = Math.max(14, Math.min(46, g.r * q[2] * 1.5)), cs = sz * 0.5, col = gens ? [255, 200, 80] : [255, 80, 80];
      neon(col, 230 * pulse, lite ? 0 : 6, 1.5);
      for (const [sx, sy] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) { line(q[0] + sx * sz, q[1] + sy * sz, q[0] + sx * (sz - cs), q[1] + sy * sz); line(q[0] + sx * sz, q[1] + sy * sz, q[0] + sx * sz, q[1] + sy * (sz - cs)); }
      noStroke(); fill(col[0], col[1], col[2], 220 * pulse); textAlign(CENTER, TOP); textSize(11); text(gens ? 'GENERATOR' : 'CORE', q[0], q[1] + sz + 4); noFill();
    }
  }
  noGlow();
}
// ---------- 宇宙空間の物理(慣性・質量・運動量の保存・衝突・重力・爆風) ----------
// 空気抵抗は無い。速度は、推力・衝突・爆風・重力でだけ変わる。自機は、姿勢制御(FA、Gキーで切替)が横滑りを打ち消す。
// 敵機・味方機は、加速度に上限のあるスラスターで飛ぶ(急には曲がれず、横へ流れる)。撃った弾は、撃った側の速度を引き継ぐ。
const PHYS = { GM: 231200, e: 0.55 };   // GM: 目的地の惑星の重力(表面で 0.02 の加速)、e: 反発係数
function gravAt(p) { const d = vsub(DEST, p), l2 = d[0] * d[0] + d[1] * d[1] + d[2] * d[2], l = Math.sqrt(l2); if (l < DEST_R) return [0, 0, 0]; return vmul(d, PHYS.GM / l2 / l); }
function massOf(e) {   // 質量: 大きいほど、動かしにくい
  if (e.mass) return e.mass;
  return e.mass = e.kind === 'asteroid' ? Math.pow(e.r / 40, 3) * 2.4 : e.kind === 'fighter' ? Math.pow(e.r / 40, 3) + 0.3 : e.kind === 'ally' ? 1.4 : Math.pow((e.hullR || 800) / 40, 3);
}
function knock(e, J) { if (!e.v || e.dead) return; const dv = vmul(J, 1 / massOf(e)), l = vlen(dv); e.v = vadd(e.v, l > 8 ? vmul(dv, 8 / l) : dv); }   // 力積 J を加える(速度の変化は、質量に反比例)
function thrustTo(e, desired, amax, dt) { const dv = vsub(desired, e.v), l = vlen(dv), k = l > amax * dt ? amax * dt / l : 1; e.v = vadd(e.v, vmul(dv, k)); }   // スラスターで、行きたい速度へ近づく(加速度の上限つき)
function rotAxis(v, k, th) { const c = Math.cos(th), s = Math.sin(th), kd = dot(k, v) * (1 - c), kx = cross(k, v); return [v[0] * c + kx[0] * s + k[0] * kd, v[1] * c + kx[1] * s + k[1] * kd, v[2] * c + kx[2] * s + k[2] * kd]; }
function blast(p, R, Sn) {   // 爆風: 近くの物を、外へ押しのける(近いほど強い)
  const push = (e, k) => { const d = vsub(e.p, p), rr = R + (e.r || 0), l = Math.max(30, vlen(d)); if (l > rr) return; knock(e, vmul(vnorm(d), Sn * k * Math.pow(1 - l / rr, 2))); };
  for (const f of fighters) if (!(f.wt > 0)) push(f, 1);
  for (const a of asteroids) push(a, 1);
  for (const a of allies) push(a, 1);
  for (const m of missiles) push(m, 3);
  if (!P.dead) { const d = vsub(P.p, p), l = Math.max(30, vlen(d)); if (l < R) { P.vel = vadd(P.vel, vmul(vnorm(d), Math.min(5, Sn * 0.1 * Math.pow(1 - l / R, 2)))); P.v = P.vel; } }
  for (const q of particles) { const d = vsub(q.p, p), l = Math.max(20, vlen(d)); if (l < R) q.v = vadd(q.v, vmul(vnorm(d), Sn * 0.02 * (1 - l / R))); }
}
function collide(a, b, ra, rb) {   // 球どうしの弾性衝突。運動量を保存し、重なりを離す。ぶつかった速さを返す(離れていく向きなら 0)
  const d = vsub(b.p, a.p), l = vlen(d), Rr = ra + rb; if (l >= Rr || l < 1e-6) return 0;
  const n = vmul(d, 1 / l), ma = massOf(a), mb = massOf(b), tot = ma + mb, push = Rr - l;
  a.p = vsub(a.p, vmul(n, push * mb / tot)); b.p = vadd(b.p, vmul(n, push * ma / tot));
  const vn = dot(vsub(b.v, a.v), n); if (vn >= 0) return 0;
  const J = -(1 + PHYS.e) * vn / (1 / ma + 1 / mb);
  a.v = vsub(a.v, vmul(n, J / ma)); b.v = vadd(b.v, vmul(n, J / mb));
  return -vn;
}
function collidePlayer(t, ra) { const a = { p: P.p, v: P.vel, mass: 1.6 }, vi = collide(a, t, ra, t.r); P.p = a.p; P.vel = a.v; P.v = P.vel; return vi; }
let bumpSndT = 0;
function bump(e, vi, mo, m) { const d = vi * 0.06 * mo / (mo + m); if (d > 0.25 && !e.indestructible) damage(e, d); }   // 衝突のダメージ(相手が重いほど、速いほど大きい)
function collideBodies(dt) {   // 敵機・小惑星・艦の船体の、衝突
  bumpSndT -= dt;
  const bodies = [];
  for (const f of fighters) if (!f.dead && !(f.wt > 0)) bodies.push(f);
  for (const a of asteroids) if (!a.dead) bodies.push(a);
  for (let i = 0; i < bodies.length; i++) for (let j = i + 1; j < bodies.length; j++) {
    const a = bodies[i], b = bodies[j], rr = a.r * 0.85 + b.r * 0.85;
    if (Math.abs(a.p[0] - b.p[0]) > rr || Math.abs(a.p[1] - b.p[1]) > rr || Math.abs(a.p[2] - b.p[2]) > rr) continue;
    if (a.indestructible && b.indestructible) continue;
    const ma = massOf(a), mb = massOf(b), vi = collide(a, b, a.r * 0.85, b.r * 0.85);
    if (vi > 2) { bump(a, vi, mb, ma); bump(b, vi, ma, mb); if (vi > 7 && bumpSndT <= 0) { SND.se('clang', a.p); bumpSndT = 8; burst(vmul(vadd(a.p, b.p), 0.5), 5, 4); } }
  }
  for (const f of fighters) {   // 敵機は、艦の船体に、はね返される
    if (f.dead || f.wt > 0) continue;
    for (const s of ships) {
      if (!s.alive || s.wt > 0) continue;
      for (const sp of s.spheres) {
        const d = vsub(f.p, sp.p), l = vlen(d), R = sp.r + f.r * 0.8; if (l >= R || l < 1e-6) continue;
        const n = vmul(d, 1 / l); f.p = vadd(sp.p, vmul(n, R)); const vn = dot(vsub(f.v, s.v || [0, 0, 0]), n);
        if (vn < 0) { f.v = vsub(f.v, vmul(n, (1 + 0.5) * vn)); bump(f, -vn, 400, massOf(f)); }
      }
    }
  }
}
class Asteroid {
  constructor(p, r, sub = 'small') {
    this.kind = 'asteroid'; this.sub = sub; this.p = p; this.r = r; this.dead = false; this.pts = sub === 'debris' ? 80 : 50;
    this.indestructible = sub === 'big'; this.hp = sub === 'debris' ? 2 : Math.ceil(r / 40);
    this.mesh = sub === 'debris' ? debrisMesh() : jitterMesh(M.icosa, sub === 'big' ? 0.16 : 0.3); this.col = sub === 'debris' ? C.debris : C.asteroid;
    this.ay = Math.random() * 6; this.ax = Math.random() * 6; this.sy = rnd(-0.01, 0.01); this.sx = rnd(-0.01, 0.01);
    this.v = sub === 'debris' ? vmul(randDir(), rnd(0.5, 2)) : vmul(randDir(), sub === 'big' ? rnd(0, 0.3) : rnd(0, 1.2));   // 宇宙空間で、ゆっくり漂う
    if (sub !== 'small') announce(sub === 'big' ? '17' : '18'); else announce('16');
  }
  update(dt) {
    this.ay += this.sy * dt * 2; this.ax += this.sx * dt * 2;
    this.v = vadd(this.v, vmul(gravAt(this.p), dt)); this.p = vadd(this.p, vmul(this.v, dt));
  }
  hurt(dm) { if (this.indestructible) { SND.se('kin', this.p); return false; } this.hp -= dm; return this.hp <= 0; }
  die() { const vw = bakeMesh(this.mesh, this.p, basisYP(this.ay, this.ax, 0), this.r); fragments(vw, this.mesh.f, this.col, 16, false, this.v); burst(this.p, 10, 6, this.sub === 'debris' ? [255, 140, 60] : [200, 220, 255], this.v); this.dead = true; SND.se('boomS', this.p); blast(this.p, this.r * 3.5, 3); }
  faces(out) { pushFaces(out, worldToCamAll(bakeMesh(this.mesh, this.p, basisYP(this.ay, this.ax, 0), this.r)), this.mesh.f, this.col); }
}
class LaserFence {   // 防衛レーザー網(赤い直線)
  constructor(a, b) { this.a = a; this.b = b; this.p = vmul(vadd(a, b), 0.5); this.r = vlen(vsub(a, b)) / 2; this.cd = 0; }
  distTo(q) { const ab = vsub(this.b, this.a), t = Math.max(0, Math.min(1, dot(vsub(q, this.a), ab) / dot(ab, ab))); return vlen(vsub(q, vadd(this.a, vmul(ab, t)))); }
}
function drawFence(f) {
  const N = 14, ctx = drawingContext;
  for (const off of [-45, 0, 45]) {
    const pts = []; for (let i = 0; i <= N; i++) pts.push(projW(vadd(vadd(f.a, vmul(vsub(f.b, f.a), i / N)), [0, off, 0])));
    neon([255, 50, 50], 190 + 60 * Math.sin(frameCount * 0.3 + off), 14, 2.6); ctx.beginPath();
    for (let i = 0; i < N; i++) { const p = pts[i], q = pts[i + 1]; if (p && q) { ctx.moveTo(p[0], p[1]); ctx.lineTo(q[0], q[1]); } }
    ctx.stroke();
  }
  for (const e of [f.a, f.b]) { const p = projW(e); if (p) { neon([255, 120, 120], 255, 12, 3); ellipse(p[0], p[1], Math.max(5, 45 * p[2])); } }
  noGlow();
}
function partMesh(p) { return p.part === 'turret' ? M.turretBase : p.part === 'gen' ? M.gen : (p.ship.variant === 'poly' ? M.core : M.bridge); }

// ---------- 敵: 戦艦 ----------
class Part {
  constructor(ship, kind, lp, r, hp) {
    this.kind = 'part'; this.part = kind; this.ship = ship; this.lp = lp; this.r = r; hp *= (ship.ally ? 1 : DF().hp); this.hp = hp; this.maxhp = hp; this.alive = true; this.flash = 0; this.dead = false;
    this.p = ship.toWorld(lp); this.pts = kind === 'bridge' ? 2500 : kind === 'gen' ? 500 : 200;
    this.fireT = rnd(60, 160); this.tyaw = 0; this.tpitch = 0;
  }
  get exposed() { return this.alive && (this.part !== 'bridge' || this.ship.gensAlive() === 0); }
  hurt(dm) {
    this.flash = 5;
    if (!this.exposed) { burst(this.p, 3, 5, [160, 200, 255]); SND.se('kin', this.p); return false; }
    this.hp -= dm; return this.hp <= 0;
  }
  die() {
    const s = this.ship, mesh = partMesh(this);
    const vw = bakeMesh(mesh, this.p, s.basis, s.S);
    fragments(vw, mesh.f, this.part === 'turret' ? C.turret : this.part === 'gen' ? C.gen : C.bridgeOn, 30, true, s.v);
    burst(this.p, 32, 14, null, s.v); blast(this.p, 700 * s.S, 12); shake = Math.max(shake, 9); this.alive = false; this.dead = true; addShockwave(this.p, 300 * s.S, 6, [255, 150, 80]); SND.se('boomM');
    if (this.part === 'gen' && s.gensAlive() === 0 && !s.ally) SND.se('coreOpen');
    if (this.part === 'bridge') s.destroy();
  }
  allyAim(dt) {   // 味方戦艦の砲塔: 近くの敵機を撃つ
    if (this.part !== 'turret' || !this.alive) return;
    let tgt = null, bd = 2600;
    for (const f of fighters) { if (f.cloaked) continue; const d = vlen(vsub(f.p, this.p)); if (d < bd) { bd = d; tgt = f; } }
    if (!tgt) return;
    const l = this.ship.toLocalDir(vsub(tgt.p, this.p));
    this.tyaw = Math.atan2(l[0], l[2]); this.tpitch = Math.atan2(l[1], Math.hypot(l[0], l[2]));
    this.fireT -= dt;
    if (this.fireT <= 0) { this.fireT = rnd(50, 90); allyShot(vadd(this.p, vmul(vnorm(vsub(tgt.p, this.p)), 70)), vadd(tgt.p, vmul(tgt.v, bd / 60)), 60); }
  }
  update(dt) {
    if (this.flash > 0) this.flash -= dt;
    if (this.ship.wt > 0) return;   // 艦がワープ中は、撃たない
    if (this.ship.ally) { this.allyAim(dt); return; }
    if (this.part !== 'turret' || !this.alive || P.dead) return;
    const s = this.ship, d = vsub(P.p, this.p), l = s.toLocalDir(d);
    this.tyaw = Math.atan2(l[0], l[2]); this.tpitch = Math.atan2(l[1], Math.hypot(l[0], l[2]));
    this.fireT -= dt;
    const dist = vlen(d);
    if (this.fireT <= 0 && dist < 3200 && dist > 250) {
      this.fireT = Math.max(70, 170 - stage * 10) * rnd(0.7, 1.3) * DF().fire;
      const muzzle = vadd(this.p, vmul(vnorm(d), 70 * s.S));
      const ws = FACTIONS[s.faction || 'empire'].weapons, wn = s.S >= 2 && Math.random() < 0.3 ? ws[2] : ws[Math.random() < 0.5 ? 1 : 0];   // 大型艦は、勢力の主砲を撃つ
      fireWeapon(this, wn === 'repairBeam' ? ws[0] : wn, P.p, P.v, { from: muzzle });
    }
  }
  faces(out, z = 0) {
    const s = this.ship;
    const col = this.flash > 0 ? C.white : this.ship.ally ? C.ally : this.part === 'turret' ? C.turret : this.part === 'gen' ? C.gen : (this.exposed ? C.bridgeOn : C.bridgeOff);
    const mesh = partMesh(this);
    pushFaces(out, worldToCamAll(bakeMesh(mesh, this.p, s.basis, s.S)), mesh.f, col);
    if (this.part === 'turret' && z < 3200) {   // 砲身は、自機の方へ向く(遠いときは省く)
      const cy = Math.cos(this.tyaw), sy = Math.sin(this.tyaw), cp = Math.cos(-this.tpitch), sp = Math.sin(-this.tpitch);
      const bv = M.barrels.v.map(v => { let a = v[0], b = v[1], c = v[2], t; t = b * cp - c * sp; c = b * sp + c * cp; b = t; t = a * cy + c * sy; c = -a * sy + c * cy; a = t; return [a, b, c]; });
      pushFaces(out, worldToCamAll(bakeMesh({ v: bv }, this.p, s.basis, s.S)), M.barrels.f, col);
    }
  }
}
class Battleship {
  constructor(p, yaw, variant) {
    this.kind = 'ship'; this.v = [0, 0, 0]; this.w = 0; this.p = p; this.yaw = yaw; this.variant = variant; this.S = (SHIP_CLS[variant] || { S: 1 }).S * nextScale;
    this.basis = basisYP(yaw, 0, 0); this.alive = true; this.deadT = 0; this.boom = 0;
    const poly = variant === 'poly';
    this.hullMesh = poly ? fineIcosa() : M.hull; this.ally = variant === 'ally';   // 核の船体は、面を4分割した細かい球
    this.faction = this.ally ? null : (nextShipFaction || stageFaction());
    this.col = this.ally ? C.ally : poly ? wireCol(FACTIONS[this.faction].rgb) : FACTIONS[this.faction].col;
    if (!poly && !this.ally) { const rgb = FACTIONS[this.faction].rgb; this.col = mkCol(105 + rgb[0] * 0.32, 135 + rgb[1] * 0.28, 155 + rgb[2] * 0.25); }
    const S = this.S, hpT = 5, hpG = 10, hpB = 22;
    if (poly) {   // 中ボス: 正二十面体。6つの頂点に砲台、2つの頂点にシールド発生器、中心に核
      const vs = M.icosa.v;
      this.hullV = bakeMesh(this.hullMesh, p, this.basis, 520 * S); this.spheres = [];
      this.parts = [2, 3, 4, 5, 6, 7].map(i => new Part(this, 'turret', vmul(vs[i], 520 * S), 60 * S, 5 + stage));
      this.gens = [8, 9].map(i => new Part(this, 'gen', vmul(vs[i], 520 * S), 54 * S, 10));
      this.bridge = new Part(this, 'bridge', [0, 0, 0], 72 * S, 24);
      this.hullR = 560 * S;
    } else if (SHIP_CLS[variant] && !this.ally) {   // ShipFactory の設計(勢力 × 級 × seed)
      const dz = nextDesign || ShipFactory.pick(this.faction, variant), K = SHIP_CLS[variant]; this.design = dz; this.hullMesh = dz.mesh;
      this.hullV = bakeMesh(dz.mesh, p, this.basis, S);
      this.spheres = dz.spheres.map(q => ({ p: this.toWorld(vmul(q.lp, S)), r: q.r * S }));
      this.parts = dz.turrets.map(t => new Part(this, 'turret', vmul(t, S), 55 * S, K.hpT));
      this.gens = dz.gens.map(g => new Part(this, 'gen', vmul(g, S), 48 * S, K.hpG));
      this.bridge = new Part(this, 'bridge', vmul(dz.bridge, S), 62 * S, K.hpB);
      this.hullR = dz.hullR * S; this.engines = dz.engines; this.hangars = dz.hangars;
    } else {
      this.hullV = bakeMesh(M.hull, p, this.basis, S);
      this.spheres = [-560, -380, -180, 20, 220, 400].map(z => ({ p: this.toWorld([0, 0, z * S]), r: 170 * S })).concat([{ p: this.toWorld([0, 190 * S, -330 * S]), r: 100 * S }]);
      const T = [[75, 100, 120], [-75, 100, 120], [75, 100, -40], [-75, 100, -40], [200, 28, -150], [-200, 28, -150]];
      this.parts = T.map(t => new Part(this, 'turret', vmul(t, S), 55 * S, hpT));
      this.gens = [[-150, 122, -250], [150, 122, -250]].map(g => new Part(this, 'gen', vmul(g, S), 48 * S, hpG));
      this.bridge = new Part(this, 'bridge', vmul([0, 262, -340], S), 62 * S, hpB);
      this.hullR = 760 * S;
    }
    this.all = [...this.parts, ...this.gens, this.bridge];
  }
  toWorld(l) { const b = this.basis; return [this.p[0] + b.r[0] * l[0] + b.u[0] * l[1] + b.f[0] * l[2], this.p[1] + b.r[1] * l[0] + b.u[1] * l[1] + b.f[1] * l[2], this.p[2] + b.r[2] * l[0] + b.u[2] * l[1] + b.f[2] * l[2]]; }
  toLocalDir(d) { const b = this.basis; return [dot(d, b.r), dot(d, b.u), dot(d, b.f)]; }
  gensAlive() { return this.gens.filter(g => g.alive).length; }
  relocate(p, yaw) {   // 位置と向きを変える(ボスの瞬間移動・回転用)。船体・当たり判定・部位の位置を作り直す
    this.p = p; this.yaw = yaw; this.basis = basisYP(yaw, 0, 0);
    this.hullV = bakeMesh(this.hullMesh, p, this.basis, this.variant === 'poly' ? 520 * this.S : this.S);
    if (this.design) this.spheres = this.design.spheres.map(q => ({ p: this.toWorld(vmul(q.lp, this.S)), r: q.r * this.S }));
    for (const pt of this.all) pt.p = this.toWorld(pt.lp);
  }
  update(dt) {
    if (this.wt > 0) { tickWarp(this, dt); if (this.wt > 0) return; }
    if (this.alive && (this.v[0] || this.v[1] || this.v[2] || this.w)) this.relocate(vadd(this.p, vmul(this.v, dt)), this.yaw + this.w * dt);   // 慣性で漂い、ゆっくり回る
    if (this.alive) for (const p of this.all) p.update(dt);
    else {
      this.deadT += dt; this.boom -= dt;
      if (!this.finalDone && this.deadT > 100) { this.finalDone = true; SND.se('bossBoom2', this.p); whiteFlash = Math.max(whiteFlash, 0.8); }
      if (this.boom <= 0 && this.deadT < 110) { this.boom = 5; const s = this.spheresAll[Math.floor(Math.random() * this.spheresAll.length)]; const bp = vadd(s.p, vmul(randDir(), s.r * 0.8)); burst(bp, 16, 14, [255, 190, 90]); if (Math.random() < 0.4) addShockwave(bp, 260, 5, [255, 170, 80]); shake = Math.max(shake, 8); }
    }
  }
  destroy() {
    this.alive = false; this.spheresAll = this.spheres.length ? this.spheres : [{ p: this.p, r: this.hullR * 0.8 }];
    for (const p of this.all) if (p.alive) { p.alive = false; p.dead = true; }
    fragments(this.hullV, this.hullMesh.f, this.col, 120, true, this.v); addShockwave(this.p, 1200 * this.S, 14, [255, 100, 100]); blast(this.p, this.hullR * 2.2, 55); SND.se('bossBoom1', this.p);
    this.spheres = [];
    P.score += scoreOf(3000 * this.S); shake = 20;
  }
  faces(out, z) {
    if (!this.alive && this.deadT > 100) return;
    if (this.wt > 0) { if (this.wt > this.wdur) return; const w = warpXf(this, this.basis, this.p, this.hullR); pushFaces(out, worldToCamAll(bakeMesh(this.hullMesh, w.pos, w.b, this.variant === 'poly' ? 520 * this.S : this.S)), this.hullMesh.f, warpCol(this)); return; }
    pushFaces(out, worldToCamAll(this.hullV), this.hullMesh.f, this.col);
    if (this.variant === 'poly' && this.alive && z < 14000) polyExtraFaces(this, out);   // 中ボス・ボスの核: 内側の核と、回るリング
    if (this.design && this.design.detail && z < (lite ? 2800 : 4800) * this.S) {
      const detail = this.design.detail.mesh;
      pushFaces(out, worldToCamAll(bakeMesh(detail, this.p, this.basis, this.S)), detail.f, this.col);
    }
    if (this.alive && z < 5200 * this.S) for (const p of this.all) if (p.alive) p.faces(out, z / this.S);   // 遠いときは、砲塔などを省く(近づくほど細かく)
  }
}


// ---------- 最終ボス20体 ----------
// 各勢力4体。ステージ1〜5=各勢力の1体目、6〜10=2体目、11〜15=3体目、16〜20=4体目(ステージ20 = ENDLESS_VOID)。21以降は、体力が増えて、4体目がくりかえす。
// shape: dread / titan(艦の船体を、勢力×専用seedで作る)/ poly(正二十面体のコア。回転する)。S=大きさの倍率、hp=部位の体力の倍率。
// tr(特性): spawn=手下を出す、teleport=自機の前へ瞬間移動、spin=回転。ph=フェーズごとの武装(iv=撃つ間隔、multi=同時の数、w=順に撃つ武装)
const PH = (iv, multi, ...w) => ({ iv, multi, w });
const BOSSES = {
  empire: [
    { name: 'JUDGEMENT', shape: 'dread', S: 1.3, hp: 1.6, tr: [], ph: [PH(300, 1, 'megaCannon', 'empireMissile'), PH(230, 1, 'megaCannon', 'plasmaCannon', 'missileBattery'), PH(170, 2, 'megaCannon', 'waveCannon')] },
    { name: 'DESTROYER_PRIME', shape: 'titan', S: 0.8, hp: 1.2, tr: [], ph: [PH(260, 1, 'megaCannon', 'missileBattery'), PH(200, 1, 'waveCannon', 'megaCannon', 'empireMissile'), PH(150, 2, 'megaCannon', 'missileBattery', 'waveCannon')] },
    { name: 'MOTHER_SHIP', shape: 'titan', S: 0.9, hp: 1.3, tr: ['spawn'], spawnN: 4, ph: [PH(300, 1, 'missileBattery', 'laserCannon'), PH(240, 1, 'megaCannon', 'missileBattery'), PH(180, 2, 'waveCannon', 'megaCannon')] },
    { name: 'TITAN', shape: 'titan', S: 1.25, hp: 1.6, tr: [], ph: [PH(230, 1, 'megaCannon', 'plasmaCannon', 'missileBattery'), PH(170, 2, 'megaCannon', 'waveCannon', 'missileBattery'), PH(120, 2, 'megaCannon', 'waveCannon', 'empireMissile', 'plasmaCannon')] },
  ],
  machine: [
    { name: 'MACHINE_KING', shape: 'dread', S: 1.4, hp: 1.6, tr: [], ph: [PH(280, 1, 'railgun', 'naniteSwarm'), PH(210, 1, 'railgun', 'pulseBeam', 'missileBattery'), PH(150, 2, 'railgun', 'naniteSwarm')] },
    { name: 'CHAOS_NODE', shape: 'dread', S: 1.7, hp: 1.8, tr: ['spawn'], spawnN: 4, ph: [PH(260, 1, 'pulseBeam', 'railgun'), PH(200, 1, 'naniteSwarm', 'railgun', 'waveCannon'), PH(150, 2, 'railgun', 'missileBattery')] },
    { name: 'ABSOLUTE_ZERO', shape: 'poly', S: 1.5, hp: 4, tr: ['spin'], ph: [PH(240, 1, 'railgun', 'pulseBeam'), PH(180, 1, 'railgun', 'naniteSwarm'), PH(130, 2, 'railgun', 'pulseBeam', 'missileBattery')] },
    { name: 'OMEGA_CORE', shape: 'titan', S: 1.1, hp: 1.5, tr: [], ph: [PH(220, 1, 'railgun', 'missileBattery'), PH(160, 2, 'railgun', 'naniteSwarm', 'waveCannon'), PH(110, 2, 'railgun', 'missileBattery', 'megaCannon')] },
  ],
  bio: [
    { name: 'NEBULA_BRAIN', shape: 'poly', S: 1.3, hp: 3, tr: ['spin'], ph: [PH(260, 1, 'sporeCannon', 'parasiteMissile'), PH(200, 1, 'acidShot', 'sporeCannon', 'parasiteMissile'), PH(150, 2, 'sporeCannon', 'parasiteMissile')] },
    { name: 'BIO_QUEEN', shape: 'dread', S: 1.5, hp: 1.6, tr: ['spawn'], spawnN: 5, ph: [PH(280, 1, 'acidShot', 'sporeCannon'), PH(210, 1, 'parasiteMissile', 'sporeCannon'), PH(150, 2, 'sporeCannon', 'parasiteMissile', 'missileBattery')] },
    { name: 'HIVE_WORLD', shape: 'titan', S: 0.85, hp: 1.3, tr: ['spawn'], spawnN: 6, ph: [PH(260, 1, 'sporeCannon', 'acidShot'), PH(200, 1, 'parasiteMissile', 'sporeCannon'), PH(140, 2, 'sporeCannon', 'parasiteMissile', 'waveCannon')] },
    { name: 'STAR_EATER', shape: 'titan', S: 1.2, hp: 1.6, tr: [], ph: [PH(240, 1, 'acidShot', 'gravitySphere'), PH(170, 1, 'gravitySphere', 'sporeCannon', 'parasiteMissile'), PH(120, 2, 'gravitySphere', 'parasiteMissile', 'waveCannon')] },
  ],
  ancient: [
    { name: 'DARK_MOON', shape: 'poly', S: 1.4, hp: 3.5, tr: ['spin'], ph: [PH(280, 1, 'prismBeam', 'gravitySphere'), PH(210, 1, 'solarBeam', 'prismBeam'), PH(150, 2, 'solarBeam', 'gravitySphere', 'ancientLance')] },
    { name: 'PLANET_CORE', shape: 'poly', S: 1.9, hp: 5, tr: ['spin'], ph: [PH(260, 1, 'solarBeam', 'prismBeam'), PH(190, 1, 'solarBeam', 'gravitySphere', 'ancientLance'), PH(130, 2, 'solarBeam', 'prismBeam', 'gravitySphere')] },
    { name: 'ANCIENT_AI', shape: 'titan', S: 0.9, hp: 1.4, tr: [], ph: [PH(240, 1, 'prismBeam', 'solarBeam'), PH(180, 1, 'gravitySphere', 'ancientLance', 'solarBeam'), PH(120, 2, 'solarBeam', 'ancientLance', 'waveCannon')] },
    { name: 'LAST_ORIGIN', shape: 'titan', S: 1.2, hp: 1.7, tr: [], ph: [PH(220, 1, 'solarBeam', 'gravitySphere', 'prismBeam'), PH(160, 2, 'solarBeam', 'ancientLance', 'waveCannon'), PH(110, 2, 'solarBeam', 'gravitySphere', 'ancientLance', 'missileBattery')] },
  ],
  void: [
    { name: 'BLACK_SUN', shape: 'poly', S: 1.6, hp: 4, tr: ['spin'], ph: [PH(280, 1, 'singularity', 'voidSpike'), PH(210, 1, 'singularity', 'chaosBeam'), PH(150, 2, 'singularity', 'voidSpike', 'warpRift')] },
    { name: 'SINGULARITY', shape: 'poly', S: 2, hp: 5, tr: ['spin', 'teleport'], ph: [PH(260, 1, 'singularity', 'chaosBeam'), PH(190, 1, 'singularity', 'warpRift', 'voidSpike'), PH(130, 2, 'singularity', 'chaosBeam', 'waveCannon')] },
    { name: 'VOID_GOD', shape: 'titan', S: 1, hp: 1.5, tr: ['teleport'], ph: [PH(230, 1, 'chaosBeam', 'warpRift'), PH(170, 1, 'singularity', 'voidSpike', 'warpRift'), PH(120, 2, 'chaosBeam', 'warpRift', 'waveCannon')] },
    { name: 'ENDLESS_VOID', shape: 'titan', S: 1.4, hp: 2, tr: ['teleport', 'spawn'], spawnN: 4, ph: [PH(200, 1, 'chaosBeam', 'singularity', 'warpRift'), PH(150, 2, 'voidSpike', 'singularity', 'waveCannon'), PH(100, 2, 'chaosBeam', 'singularity', 'warpRift', 'missileBattery')] },
  ],
};
const BOSS_LIST = Object.values(BOSSES).flat();
BOSS_LIST.forEach(d => { d.ph[2].w.push('__x0', '__x1'); });
BOSS_LIST.forEach((d, i) => { d.faction = Object.keys(BOSSES).find(f => BOSSES[f].includes(d)); d.tier = BOSSES[d.faction].indexOf(d); });
BOSS_LIST.forEach(d => { const ex = FACTIONS[d.faction].extra, w = d.ph[2].w; w[w.length - 2] = ex[0]; w[w.length - 1] = ex[1]; });   // 最終フェーズは、追加の武装も使う
function bossFor(st) { const n = curNode(); return BOSS_LIST.find(d => d.name === n.boss) || BOSSES[stageFaction()][Math.min(3, Math.floor((st - 1) / 5))]; }
let phaseT = 0, phaseTxt = '';
class BossShip extends Battleship {
  constructor(p, yaw, def) {
    nextShipFaction = def.faction; nextScale = def.S; nextDesign = def.shape === 'poly' ? null : ShipFactory.bossDesign(def);
    super(p, yaw, def.shape);
    nextShipFaction = null; nextScale = 1; nextDesign = null;
    this.def = def; this.phase = 0; this.atkT = 240; this.atkN = 0; this.spawnT = 300; this.tpT = 500;
    const hm = def.hp * (1 + 0.045 * Math.max(0, stage - 8));   // 深い星系(と、周回)ほど、体力が増える
    for (const pt of this.all) { pt.hp *= hm; pt.maxhp = pt.hp; }
    this.critMax = [...this.gens, this.bridge].reduce((n, q) => n + q.maxhp, 0);
  }
  critFrac() { return [...this.gens, this.bridge].reduce((n, q) => n + (q.alive ? Math.max(0, q.hp) : 0), 0) / this.critMax; }   // 発生器と艦橋の残り(この割合でフェーズが進む)
  update(dt) {
    super.update(dt); if (!this.alive || this.wt > 0) return;
    const d = this.def, tint = FACTIONS[d.faction].rgb, dist = vlen(vsub(P.p, this.p));
    if (d.tr.includes('spin')) this.relocate(this.p, this.yaw + 0.004 * dt);
    const fr = this.critFrac(), ph = fr > 0.66 ? 0 : fr > 0.33 ? 1 : 2;
    if (ph > this.phase) {   // フェーズが進む: 衝撃波と、警告
      this.phase = ph; this.atkT = 70; phaseT = 150; phaseTxt = 'PHASE ' + (ph + 1); SND.se('warning'); shake = Math.max(shake, 14); addShockwave(this.p, 1600 * this.S, 12, tint);
      if (d.tr.includes('spawn')) this.spawnAdds(d.spawnN * 2);
    }
    if (d.tr.includes('teleport') && !P.dead) {
      this.tpT -= dt;
      if (this.tpT <= 0) {   // 自機の前へ、瞬間移動する
        this.tpT = rnd(380, 520) - this.phase * 60; addShockwave(this.p, 1600 * this.S, 10, tint);
        const pb = basisYP(P.yaw, P.pitch, 0), np = vadd(vadd(P.p, vmul(pb.f, Math.min(9500, Math.max(this.hullR * 1.8, 3500)))), vmul(randDir(), 900));
        this.relocate(np, Math.atan2(P.p[0] - np[0], P.p[2] - np[2])); addShockwave(this.p, 1600 * this.S, 10, tint); startWarp(this, 45, tint);   // 瞬間移動: ワープアウト → ワープイン
      }
    }
    if (d.tr.includes('spawn') && dist < 9000) { this.spawnT -= dt; if (this.spawnT <= 0) { this.spawnT = 240 - this.phase * 30; this.spawnAdds(d.spawnN); } }
    this.atkT -= dt;
    if (this.atkT <= 0 && dist < 9500 && !P.dead) {
      const pd = d.ph[this.phase]; this.atkT = pd.iv * (lite ? 1.25 : 1) * DF().fire;
      const top = vadd(this.bridge.p, vmul(this.basis.u, 60 * this.S));
      for (let i = 0; i < pd.multi; i++) fireWeapon(this.bridge, pd.w[this.atkN++ % pd.w.length], P.p, P.v, { from: top, tint });
    }
  }
  spawnAdds(n) {   // 手下(勢力の戦闘機・ドローン)を出す
    n = lite ? Math.ceil(n / 2) : n; n = Math.max(1, Math.round(n * DF().count));
    for (let i = 0; i < n && fighters.length < 46; i++) {
      const pos = vadd(this.p, vmul(randDir(), this.hullR * 0.7)), r = Math.random();
      fighters.push(new Fighter(pos, r < 0.5 ? 'swarm' : r < 0.8 ? 'chaser' : 'interceptor', this.def.faction)); burst(pos, 6, 5, FACTIONS[this.def.faction].rgb);
    }
    SND.se('ping');
  }
  destroy() { super.destroy(); P.score += scoreOf(10000 * (this.def.tier + 1)); hitStop = 12; }
}

class Cruiser extends Battleship { constructor(p, yaw) { super(p, yaw, 'cruiser'); } }
class BattleShip extends Battleship { constructor(p, yaw) { super(p, yaw, 'battle'); } }
class Carrier extends Battleship {   // 空母: 近づくと、格納庫から艦載機を次々に出す(合計 12〜40 機)
  constructor(p, yaw) { super(p, yaw, 'carrier'); this.total = lite ? 8 + (Math.random() * 6 | 0) : Math.min(40, 12 + stage * 3 + (Math.random() * 9 | 0)); this.launched = 0; this.launchT = 90; }
  update(dt) {
    super.update(dt); if (!this.alive || this.wt > 0) return;
    this.launchT -= dt;
    if (this.launchT <= 0 && this.launched < this.total && vlen(vsub(P.p, this.p)) < 7000 && fighters.length < (lite ? 26 : 50)) { this.spawnFighter(); this.launchT = rnd(70, 120); }
  }
  spawnFighter() {   // 艦載機を、2〜3機ずつ出す
    const n = Math.min(3, this.total - this.launched), rgb = FACTIONS[this.faction].rgb;
    for (let i = 0; i < n; i++) {
      const h = this.hangars[(this.launched + i) % this.hangars.length], pos = this.toWorld(vmul(h, this.S)), r = Math.random();
      fighters.push(new Fighter(pos, r < 0.4 ? 'chaser' : r < 0.65 ? 'interceptor' : r < 0.9 ? 'swarm' : 'gunner', this.faction, { warp: 22 }));   // 艦載機も、格納庫からワープアウトして飛び出す
      burst(pos, 6, 5, rgb); addShockwave(pos, 90, 3, rgb);
    }
    this.launched += n; SND.se('ping');
  }
}
class Dreadnought extends Battleship {   // ドレッドノート: 主砲(メガキャノン)、ウェーブキャノン、ミサイルバッテリーを順に撃つ。シールド発生器は、艦橋を守る発生器
  constructor(p, yaw, variant = 'dread') { super(p, yaw, variant); this.spT = 240; this.spN = 0; }
  update(dt) {
    super.update(dt); if (!this.alive || P.dead || this.wt > 0) return;
    this.spT -= dt;
    if (this.spT <= 0 && vlen(vsub(P.p, this.p)) < 6500) { this.spT = this.variant === 'titan' ? 200 : 300; this.special(); }
  }
  special() {
    const seq = ['megaCannon', 'waveCannon', 'missileBattery'], tint = FACTIONS[this.faction].rgb, top = vadd(this.bridge.p, vmul(this.basis.u, 60 * this.S));
    fireWeapon(this.bridge, seq[this.spN++ % 3], P.p, P.v, { from: top, tint });
    if (this.variant === 'titan') fireWeapon(this.bridge, seq[this.spN++ % 3], P.p, P.v, { from: top, tint });   // タイタンは、2つ同時
  }
}
class Titan extends Dreadnought { constructor(p, yaw) { super(p, yaw, 'titan'); } }
const SHIP_CLASSES = { cruiser: Cruiser, battle: BattleShip, carrier: Carrier, dread: Dreadnought, titan: Titan };
function makeShip(cls, p, yaw) { return new SHIP_CLASSES[cls](p, yaw); }
function pickShipClass(k) {   // 遭遇戦で出る級。ステージが進むほど、大きい艦が出る
  if (stage >= 3 && k === 2) return 'carrier';
  const pool = stage < 2 ? ['cruiser', 'cruiser', 'battle'] : stage < 3 ? ['cruiser', 'battle'] : stage < 6 ? ['cruiser', 'battle', 'carrier'] : ['battle', 'carrier', 'cruiser', 'dread'];
  return pool[Math.floor(Math.random() * pool.length)];
}

C.ally = mkCol(80, 255, 120);
let allies = [], allyShips = [], allyT = 0;
function allyShot(from, target, speed) { SND.se('allyShot', from); pbullets.push({ p: [...from], pp: [...from], v: vmul(vnorm(vsub(target, from)), speed), life: 70, dmg: 1, ally: true }); }
class AllyFighter {   // 味方のAI戦闘機: 近くの敵機を追って撃つ。いなければ自機の前を飛ぶ
  constructor(p) { this.kind = 'ally'; this.p = p; this.v = vmul(travelDir, 16); this.r = 40; this.hp = 6; this.dead = false; this.roll = 0; this.fireT = rnd(10, 40); this.t = 0; }
  update(dt) {
    this.t += dt;
    let tgt = null, bd = 4000;
    for (const f of fighters) { if (f.cloaked) continue; const d = vlen(vsub(f.p, this.p)); if (d < bd) { bd = d; tgt = f; } }
    let want;
    if (tgt) { const dn = vnorm(vsub(vadd(tgt.p, vmul(tgt.v, bd / 50)), this.p)); want = bd < 350 ? vnorm(vadd(vmul(dn, -0.4), randDir())) : dn; }
    else want = vnorm(vsub(vadd(P.p, vmul(basisYP(P.yaw, P.pitch, 0).f, 600 + 150 * Math.sin(this.t * 0.02))), this.p));
    const cur = vnorm(this.v); thrustTo(this, vmul(want, 17), 1.9, dt); this.v = vadd(this.v, vmul(gravAt(this.p), dt));
    const nd = vnorm(this.v);
    this.roll += (dot(cross(cur, nd), [0, 1, 0]) * 14 - this.roll) * 0.1 * dt;
    this.p = vadd(this.p, vmul(this.v, dt));
    this.fireT -= dt;
    if (tgt && this.fireT <= 0 && bd < 1600 && dot(nd, vnorm(vsub(tgt.p, this.p))) > 0.96) { this.fireT = 28; allyShot(this.p, vadd(tgt.p, vmul(tgt.v, bd / 60)), 60); }
  }
  die() { const vw = bakeMesh(M.playerA, this.p, basisDir(vnorm(this.v), this.roll), 1); fragments(vw, M.playerA.f, C.ally, 22, false, this.v); burst(this.p, 14, 8, [120, 255, 160], this.v); this.dead = true; blast(this.p, 400, 4); }
  faces(out) { pushFaces(out, worldToCamAll(bakeMesh(M.playerA, this.p, basisDir(vnorm(this.v), this.roll), 1)), M.playerA.f, C.ally); }
}
function stageFaction() { return forceFaction && FACTIONS[forceFaction] ? forceFaction : curNode().faction; }   // 星系ごとに、支配する勢力が決まる
function pickFaction() { return stage <= 2 || Math.random() < 0.7 ? stageFaction() : FACTION_ORDER[Math.floor(Math.random() * 5)]; }

// 勢力別の武装(20種)。kind: bolt=直進弾、beam=高速の長い光線、missile=誘導、spread=扇状、swarm=小型の誘導弾の群れ、gravity=引き寄せる球、rift=一定時間後に爆発する裂け目、spawn=手下を出す、heal=味方を回復
// charge=撃つ前の予告線(フレーム数)、burst=連射数、status=当たったときの状態異常(acid=腐食で削れる、slow=旋回が鈍る、confuse=操作が逆になる)、hp=自機の弾で撃ち落とせる
const WEAPONS = {
  laserCannon: { faction: 'empire', kind: 'bolt', damage: 6, speed: 32, radius: 14, color: [255, 70, 70], life: 120, se: 'eshot' },
  plasmaCannon: { faction: 'empire', kind: 'bolt', damage: 12, speed: 20, radius: 28, color: [255, 120, 60], life: 170, se: 'cannon' },
  megaCannon: { faction: 'empire', kind: 'beam', damage: 26, speed: 70, radius: 34, color: [255, 50, 50], life: 70, charge: 55, se: 'cannon' },
  empireMissile: { faction: 'empire', kind: 'missile', damage: 14, speed: 15, radius: 18, color: [255, 110, 110], homing: 0.05, life: 320, hp: 1, se: 'eshot' },
  pulseBeam: { faction: 'machine', kind: 'bolt', damage: 4, speed: 46, radius: 9, color: [0, 220, 255], life: 70, burst: 3, se: 'eshot' },
  railgun: { faction: 'machine', kind: 'beam', damage: 22, speed: 95, radius: 12, color: [120, 240, 255], life: 45, charge: 45, se: 'cannon' },
  naniteSwarm: { faction: 'machine', kind: 'swarm', damage: 3, speed: 18, radius: 8, color: [140, 255, 255], homing: 0.09, life: 260, count: 6, hp: 1, se: 'eshot' },
  repairBeam: { faction: 'machine', kind: 'heal', color: [80, 255, 160] },
  acidShot: { faction: 'bio', kind: 'bolt', damage: 4, speed: 26, radius: 14, color: [110, 255, 90], life: 110, status: 'acid', se: 'eshot' },
  sporeCannon: { faction: 'bio', kind: 'spread', damage: 3, speed: 22, radius: 10, color: [170, 255, 110], life: 100, count: 5, spread: 0.18, se: 'eshot' },
  parasiteMissile: { faction: 'bio', kind: 'missile', damage: 8, speed: 16, radius: 16, color: [90, 220, 60], homing: 0.06, life: 300, status: 'slow', hp: 1, se: 'eshot' },
  hiveSpawn: { faction: 'bio', kind: 'spawn', color: [100, 255, 120], count: 3 },
  prismBeam: { faction: 'ancient', kind: 'spread', damage: 7, speed: 42, radius: 12, color: [255, 230, 120], life: 90, count: 3, spread: 0.14, se: 'eshot' },
  solarBeam: { faction: 'ancient', kind: 'beam', damage: 20, speed: 75, radius: 30, color: [255, 200, 60], life: 60, charge: 60, se: 'cannon' },
  gravitySphere: { faction: 'ancient', kind: 'gravity', damage: 5, speed: 9, radius: 44, color: [255, 210, 90], life: 260, pull: 3.2, pullR: 700, hp: 3, se: 'cannon' },
  ancientLance: { faction: 'ancient', kind: 'beam', damage: 18, speed: 62, radius: 16, color: [255, 240, 150], life: 70, se: 'cannon' },
  chaosBeam: { faction: 'void', kind: 'bolt', damage: 9, speed: 36, radius: 14, color: [230, 90, 255], life: 100, status: 'confuse', se: 'eshot' },
  voidSpike: { faction: 'void', kind: 'bolt', damage: 8, speed: 52, radius: 10, color: [190, 60, 255], life: 70, se: 'eshot' },
  singularity: { faction: 'void', kind: 'gravity', damage: 0, speed: 7, radius: 36, color: [160, 60, 255], life: 240, pull: 5.5, pullR: 900, dot: 0.12, black: true, hp: 4, se: 'cannon' },
  warpRift: { faction: 'void', kind: 'rift', damage: 18, radius: 170, color: [220, 120, 255], life: 80, se: 'ping' },
  // 追加の武装(ステージ6から、各勢力が2つずつ使う。ボスの最終フェーズでも使う)
  flakBurst: { faction: 'empire', kind: 'spread', damage: 3, speed: 26, radius: 9, color: [255, 150, 90], life: 60, count: 7, spread: 0.22, se: 'eshot' },
  orbitalStrike: { faction: 'empire', kind: 'rift', damage: 20, radius: 200, color: [255, 90, 60], life: 90, count: 3, ring: 300, se: 'ping' },
  ionPulse: { faction: 'machine', kind: 'bolt', damage: 5, speed: 40, radius: 12, color: [90, 200, 255], life: 90, status: 'slow', se: 'eshot' },
  droneSwarm: { faction: 'machine', kind: 'swarm', damage: 2, speed: 20, radius: 7, color: [130, 240, 255], homing: 0.1, life: 260, count: 10, hp: 1, se: 'eshot' },
  toxinCloud: { faction: 'bio', kind: 'rift', damage: 6, radius: 260, color: [120, 255, 80], life: 90, status: 'acid', se: 'ping' },
  tentacleLash: { faction: 'bio', kind: 'beam', damage: 10, speed: 60, radius: 14, color: [150, 255, 90], life: 50, se: 'cannon' },
  novaBurst: { faction: 'ancient', kind: 'spread', damage: 6, speed: 34, radius: 12, color: [255, 235, 130], life: 80, count: 9, spread: 0.12, se: 'eshot' },
  starfall: { faction: 'ancient', kind: 'rift', damage: 14, radius: 190, color: [255, 220, 90], life: 90, count: 5, ring: 500, se: 'ping' },
  entropyRay: { faction: 'void', kind: 'beam', damage: 10, speed: 80, radius: 16, color: [210, 70, 255], life: 60, charge: 40, status: 'confuse', se: 'cannon' },
  phantomBlades: { faction: 'void', kind: 'swarm', damage: 5, speed: 30, radius: 9, color: [200, 110, 255], homing: 0.12, life: 240, count: 5, hp: 1, se: 'eshot' },
  // 大型艦の特別な武装(色は、艦の勢力の色になる)
  waveCannon: { kind: 'rift', damage: 12, radius: 150, color: [255, 255, 255], life: 100, count: 6, ring: 420, se: 'ping' },   // 自機の周りに、輪になって裂け目が並ぶ
  missileBattery: { kind: 'swarm', damage: 6, speed: 15, radius: 12, color: [255, 150, 70], homing: 0.07, life: 320, count: 8, hp: 1, se: 'eshot' },
};
function mkSpecial(name, w, from, dir, sv) {
  return { weaponType: name, faction: w.faction, kind: w.kind, damage: w.damage || 0, speed: w.speed || 0, radius: w.radius || 10, color: w.color, homing: w.homing || 0, life: w.life || 100, p: [...from], pp: [...from], v: vadd(vmul(dir, w.speed || 0), sv || [0, 0, 0]), owner: 'e', hp: w.hp || 0, t: 0, w };
}
function fireWeapon(sh, name, tp, tv, opts = {}) {   // sh は、撃つ側(位置 p を持つ物)。tp・tv は、狙う相手の位置と速度
  const w0 = WEAPONS[name]; if (!w0) return;
  const w = opts.tint ? Object.assign({}, w0, { color: opts.tint }) : w0;
  if (specialBullets.length > (lite ? 40 : 90) && w.kind !== 'spawn') return;   // 弾の数の上限(描画が重くならないように)
  const from = opts.from || sh.p;
  if (w.charge && !opts.done) { charges.push({ who: sh, name, t: w.charge, max: w.charge, from: opts.from, tint: opts.tint }); SND.se('alert', from); return; }   // 予告線を出してから撃つ
  if (w.burst && !opts.done) for (let i = 1; i < w.burst; i++) charges.push({ who: sh, name, t: i * 5, max: 0, from: opts.from, silent: true, tint: opts.tint });
  const inh = w.kind === 'gravity' || w.kind === 'rift' ? 0 : 1, sv = vmul(sh.v || (sh.ship && sh.ship.v) || [0, 0, 0], inh);   // 撃つ側の速度を、弾が引き継ぐ
  const dist = vlen(vsub(tp, from)), aim = vadd(tp, vmul(vsub(tv || [0, 0, 0], sv), dist / Math.max(6, w.speed || 20))), dir = vnorm(vsub(aim, from));   // 相対速度で狙う
  switch (w.kind) {
    case 'heal': return;
    case 'spawn': if (fighters.length < 34) for (let i = 0; i < w.count; i++) fighters.push(new Fighter(vadd(from, vmul(randDir(), 90)), 'swarm', 'bio', { child: true })); burst(from, 10, 6, w.color); SND.se('ping'); return;
    case 'rift': {   // 裂け目(count が 2 以上なら、自機の周りに輪になって、順に現れる)
      const c = vadd(tp, vmul(tv || [0, 0, 0], 40)), n = w.count || 1, b = basisDir(dir, 0);
      for (let i = 0; i < n; i++) { const a = i / n * TWO_PI, sp = mkSpecial(name, w, n > 1 ? vadd(c, vadd(vmul(b.r, Math.cos(a) * w.ring), vmul(b.u, Math.sin(a) * w.ring))) : c, [0, 0, 0]); sp.t = -i * 8; specialBullets.push(sp); }
      break; }
    case 'swarm': for (let i = 0; i < w.count; i++) specialBullets.push(mkSpecial(name, w, from, vnorm(vadd(dir, vmul(randDir(), 0.6))), sv)); break;
    case 'spread': { const b = basisDir(dir, 0), n = w.count; for (let i = 0; i < n; i++) specialBullets.push(mkSpecial(name, w, from, vnorm(vadd(dir, vmul(b.r, (i - (n - 1) / 2) * w.spread))), sv)); break; }
    default: specialBullets.push(mkSpecial(name, w, from, dir, sv));
  }
  if (!opts.silent) SND.se(w.se || 'eshot', from);   // 撃った場所から、左右に鳴る
}
function hitPlayerSpecial(b) {
  hurtPlayer(b.damage, b.p); burst(b.p, 8, 6, b.color);
  const st = b.w.status; if (st === 'acid') P.acidT = 150; else if (st === 'slow') P.slowT = 160; else if (st === 'confuse') P.confT = 110;
}
function updateCharges(dt) {
  for (let i = charges.length - 1; i >= 0; i--) {
    const c = charges[i], who = c.who;
    if (who.dead || who.alive === false) { charges.splice(i, 1); continue; }
    c.t -= dt;
    if (c.t <= 0) { charges.splice(i, 1); if (!P.dead) fireWeapon(who, c.name, P.p, P.v, { from: c.from, done: true, silent: c.silent, tint: c.tint }); }
  }
}
function updateSpecial(dt) {
  for (let i = specialBullets.length - 1; i >= 0; i--) {
    const b = specialBullets[i]; b.pp = b.p; b.t += dt; b.life -= dt;
    if (b.kind === 'rift') {   // 裂け目: 予告の後、爆発する
      if (b.t > 60) { addShockwave(b.p, b.radius * 1.3, 6, b.color); if (!P.dead && vlen(vsub(P.p, b.p)) < b.radius) hitPlayerSpecial(b); b.life = 0; }
    } else {
      if (b.homing && b.owner === 'e' && !P.dead) { const cur = vnorm(b.v), want = vnorm(vsub(P.p, b.p)); b.v = vmul(vnorm(vadd(vmul(cur, 1 - b.homing * dt), vmul(want, b.homing * dt))), b.speed); }
      b.p = vadd(b.p, vmul(b.v, dt));
      if (b.kind === 'gravity' && b.owner === 'e' && !P.dead) {   // 重力: 自機を引き寄せる。特異点は、近づくとシールドが削れる
        const dd = vlen(vsub(b.p, P.p)), w = b.w;
        if (dd < w.pullR) { P.vel = vadd(P.vel, vmul(vnorm(vsub(b.p, P.p)), w.pull * (1 - dd / w.pullR) * 0.1 * dt)); P.v = P.vel; }   // 重力は、位置ではなく、加速として働く
        if (w.dot && dd < b.radius * 3 && !god && P.invuln <= 0) { P.shield -= w.dot * dt; if (P.shield <= 0) hurtPlayer(0.001); }
      }
      if (b.owner === 'e') {
        if (!P.dead && !(b.kind === 'gravity' && b.w.dot) && segSphere(b.pp, b.p, P.p, 24 + b.radius * 0.6)) { hitPlayerSpecial(b); b.life = 0; }
        else for (const a of allies) if (segSphere(b.pp, b.p, a.p, a.r + b.radius * 0.5)) { a.hp -= Math.max(1, Math.round(b.damage / 6)); burst(a.p, 3, 4, [80, 255, 120]); if (a.hp <= 0) a.die(); b.life = 0; break; }
      } else {   // バレルロールではね返した弾は、敵に当たる
        for (const t of allTargets()) if (!t.dead && segSphere(b.pp, b.p, t.p, t.r + b.radius * 0.5)) { damage(t, Math.max(1, Math.round(b.damage / 3))); b.life = 0; break; }
      }
    }
    if (b.life <= 0 || vlen(vsub(b.p, P.p)) > 12000) specialBullets.splice(i, 1);
  }
  for (let i = beamFx.length - 1; i >= 0; i--) { beamFx[i].life -= dt; if (beamFx[i].life <= 0) beamFx.splice(i, 1); }
}
function drawSpecial() {
  for (const c of charges) {   // 予告線: 撃つ前に、狙いを示す
    if (c.max <= 0) continue;
    const a = projW(c.who.p), q = projW(vadd(c.who.p, vmul(vnorm(vsub(P.p, c.who.p)), 3500)));
    if (a && q) { neon(c.tint || WEAPONS[c.name].color, 90 + 120 * Math.abs(Math.sin(frameCount * 0.3)), 6, 1.4); line(a[0], a[1], q[0], q[1]); }
  }
  for (const fx of beamFx) { const a = projW(fx.a), q = projW(fx.b); if (a && q) { neon(fx.col, 255 * fx.life / 16, 10, 3); line(a[0], a[1], q[0], q[1]); } }
  for (const b of specialBullets) {
    const a = projW(b.p); if (!a) continue;
    const col = b.owner === 'r' ? [0, 240, 255] : b.color, k = a[2], dir = vnorm(b.v);
    if (b.kind === 'gravity') {
      const r = Math.max(8, b.radius * k), pu = 1 + 0.1 * Math.sin(frameCount * 0.2 + b.t);
      if (b.w.black) { noStroke(); fill(0); ellipse(a[0], a[1], r * 2 * pu); }
      neon(col, 230, 14, 2.5); noFill(); ellipse(a[0], a[1], r * 2 * pu); ellipse(a[0], a[1], r * 1.2 * pu);
      for (let j = 0; j < 3; j++) arc(a[0], a[1], r * 3, r * 3, frameCount * 0.06 + j * 2.1, frameCount * 0.06 + j * 2.1 + 1.0);
    } else if (b.kind === 'rift') {
      const r = Math.max(10, b.radius * k * (0.3 + 0.7 * Math.min(1, b.t / 60)));
      neon(col, 150 + 100 * Math.sin(b.t * 0.4), 12, 2.5); noFill(); ellipse(a[0], a[1], r * 2); ellipse(a[0], a[1], r * 0.8); line(a[0] - r, a[1], a[0] + r, a[1]); line(a[0], a[1] - r, a[0], a[1] + r);
    } else {
      const len = b.kind === 'beam' ? (b.w.charge ? 380 : 260) : b.kind === 'missile' ? 70 : 40 + b.radius * 2, q = projW(vsub(b.p, vmul(dir, len)));
      neon(col, 255, 14, Math.max(2, b.radius * k * (b.kind === 'beam' ? 0.5 : 0.35)));
      if (q) line(q[0], q[1], a[0], a[1]);
      strokeWeight(Math.max(4, b.radius * k * 0.8)); point(a[0], a[1]);
      if (b.kind === 'missile' || b.kind === 'swarm') { const s = Math.max(4, b.radius * k * 0.7); strokeWeight(1.6); line(a[0] - s, a[1], a[0], a[1] - s); line(a[0], a[1] - s, a[0] + s, a[1]); line(a[0] + s, a[1], a[0], a[1] + s); line(a[0], a[1] + s, a[0] - s, a[1]); }
    }
  }
  noGlow();
}
function enemyShot(from, target, speed, dmg, big) {
  const d = vnorm(vsub(target, from));
  SND.se(big ? 'cannon' : 'eshot', from);
  ebullets.push({ p: [...from], pp: [...from], v: vmul(d, speed), life: 260, owner: 'e', dmg, big: !!big });
}

// ---------- ステージ ----------
function pickType() {
  const r = Math.random();
  if (stage < 2) return r < 0.6 ? 'chaser' : 'gunner';
  if (stage < 3) return r < 0.35 ? 'chaser' : r < 0.6 ? 'gunner' : 'interceptor';
  return r < 0.25 ? 'chaser' : r < 0.45 ? 'gunner' : r < 0.7 ? 'interceptor' : 'stealth';
}
function spawnStage() {   // 出発点: 味方の艦隊と、少数の敵機だけ。道中は、遭遇戦で敵が立ちはだかる
  ships = []; fighters = []; asteroids = []; fences = []; allies = []; allyShips = []; allyT = 0; ebullets = []; pbullets = []; missiles = []; particles = []; shockwaves = []; specialBullets = []; charges = []; beamFx = []; empireCount = 0;
  const f = travelDir, r = basisDir(f, 0).r;
  allyShips.push(allyWarp(new Battleship(vadd(vadd(START, vmul(f, 900)), vmul(r, 1500)), Math.atan2(f[0], f[2]) + 0.15, 'ally')));
  for (let i = 0; i < 3; i++) allies.push(new AllyFighter(vadd(vadd(START, vmul(r, (i - 1) * 300)), vmul(f, -200 - i * 150))));
  announce('22');
  for (let i = 0; i < 5; i++) spawnFighter();
  spawnT = 100; swarmT = 900;
}
function spawnEncounter(k) {   // 進路の前方に、戦艦・艦載機・障害物が現れる
  SND.se('ping');
  const f = travelDir, b = basisDir(f, 0), C0 = vadd(P.p, vmul(f, 3600)), yawTo = Math.atan2(-f[0], -f[2]);
  const nShips = k === 3 ? 2 : 1 + (stage >= 3 && k === 1 ? 1 : 0);
  for (let i = 0; i < nShips; i++) {
    const p = vadd(vadd(C0, vmul(b.r, (i - (nShips - 1) / 2) * 2600 + rnd(-400, 400))), vadd(vmul(b.u, rnd(-500, 500)), vmul(f, rnd(-300, 600))));
    const sh = makeShip(pickShipClass(k), p, yawTo + rnd(-0.6, 0.6)); sh.v = vmul(randDir(), rnd(0, 0.5)); sh.w = rnd(-0.0005, 0.0005); startWarp(sh, 110, FACTIONS[sh.faction].rgb, i * 25); ships.push(sh);   // 戦艦が、ワープインして現れる
  }
  announce('22');
  for (let i = 0, nEnc = Math.max(2, Math.round((lite ? 4 + stage : 5 + stage * 2) * DF().count)); i < nEnc; i++) fighters.push(new Fighter(vadd(C0, vmul(randDir(), rnd(400, 1400))), pickType(), undefined, { warp: 30, delay: Math.random() * 60 }));
  if (k === 1) spawnSwarm(C0);
  if (k === 0 || k === 2) {   // 小惑星帯とレーザー網
    for (let i = 0; i < 14; i++) asteroids.push(new Asteroid(vadd(C0, vmul(randDir(), rnd(500, 2600))), rnd(50, 130), 'small'));
    asteroids.push(new Asteroid(vadd(C0, vadd(vmul(b.r, rnd(-1800, 1800)), vmul(b.u, rnd(-800, 800)))), rnd(450, 650), 'big'));
    for (let i = 0; i < 3; i++) asteroids.push(new Asteroid(vadd(C0, vmul(randDir(), rnd(500, 2600))), rnd(60, 100), 'debris'));
    if (stage >= 2) for (let i = 0; i < Math.min(3, stage); i++) {
      const c = vadd(C0, vmul(randDir(), rnd(300, 1800))), d = randDir(), len = rnd(900, 1500);
      fences.push(new LaserFence(vsub(c, vmul(d, len / 2)), vadd(c, vmul(d, len / 2)))); announce('19');
    }
  }
  if (k % 2 === 1) allyShips.push(allyWarp(new Battleship(vadd(vadd(P.p, vmul(f, 1200)), vmul(b.r, -1600)), Math.atan2(f[0], f[2]), 'ally')));   // 味方の戦艦も合流
}
function spawnBoss() {   // 惑星の近くで、その星系のボス(または艦隊)が現れる
  bossSpawned = true;
  if (curNode().kind === 'fleet') { spawnFleet(); return; }
  const f = travelDir, def = bossFor(stage), yawB = Math.atan2(-f[0], -f[2]);
  const dist = Math.min(9000, def.shape === 'poly' ? 4200 * Math.max(1, def.S * 0.8) : 2600 * SHIP_CLS[def.shape].S * def.S);
  bossShip = new BossShip(vadd(P.p, vmul(f, dist)), yawB, def);
  startWarp(bossShip, 150, FACTIONS[def.faction].rgb); ships.push(bossShip); announce(def.shape === 'poly' ? '21' : '22'); warningT = 200; SND.se('warning');   // ボスも、ワープインして現れる
}
function cull() {   // 遠く離れた物を消す
  ships = ships.filter(s => s === bossShip || fleetShips.includes(s) || (s.alive ? vlen(vsub(s.p, P.p)) < 14000 : s.deadT < 130));
  fighters = fighters.filter(f => vlen(vsub(f.p, P.p)) < 10000);
  asteroids = asteroids.filter(a => vlen(vsub(a.p, P.p)) < 9000);
  fences = fences.filter(f => vlen(vsub(f.p, P.p)) < 9000);
  allyShips = allyShips.filter(s => vlen(vsub(s.p, P.p)) < 14000);
}
function spawnFighter() { if (fighters.length < (lite ? 44 : 80)) fighters.push(new Fighter(vadd(P.p, vmul(randDir(), rnd(2500, 4500))), pickType(), undefined, { warp: 30 })); }
function spawnSwarm(o) {   // 小型の群れが、波のように押し寄せる
  o = o || vadd(vadd(P.p, vmul(travelDir, 3500)), vmul(randDir(), 1200));
  for (let i = 0, nSw = Math.round((lite ? 12 : 24) * DF().count); i < nSw && fighters.length < (lite ? 44 : 80); i++) fighters.push(new Fighter(vadd(o, vmul(randDir(), 260)), 'swarm', undefined, { warp: 26, delay: Math.random() * 40 }));   // 敵の総数には、上限がある
}
function newPlayer() {
  return { p: [0, 0, -4300], v: [0, 0, 0], yaw: 0, pitch: 0, yawV: 0, pitchV: 0, roll: 0, rollAng: 0, rollT: 0, rollDir: 0, dash: 0, uT: 0, speed: 18,
    shield: 100, lives: DF().lives, score: 0, invuln: 0, boost: 100, boosting: false, cd: 0, locks: [], lockT: 0, dead: false, deadT: 0, pending: [], warn: false, energy: 100, kills: 0, hitT: 0, form: 'combat', foldV: 1, acidT: 0, slowT: 0, confT: 0, vel: [0, 0, 0], fa: true, credits: 0, up: { shield: 0, boost: 0, power: 0, lock: 0, bits: 0, wide: 0 } };
}
const shipK = k => (P && P.ship && P.ship[k] !== undefined ? P.ship[k] : (k === 'lock' || k === 'bits' ? 0 : 1));   // 機体の性能(ship.js の SHIPS。1 = 標準)
const maxSh = () => Math.round((100 + 20 * P.up.shield) * shipK('armor')), boostMax = () => Math.round((100 + 20 * P.up.boost) * shipK('tank')), pwr = () => (1 + 0.25 * P.up.power) * shipK('power'), lockMax = () => 6 + P.up.lock + shipK('lock'), wideCost = () => 30 - 3 * P.up.wide;
// 2人プレイ(coop.js)の入口。1人のときは、P だけに働く
let players = [], coop = false;
function withP(pl, fn) { if (!pl || pl === P) return fn(); const o = P; P = pl; try { return fn(); } finally { P = o; } }   // しばらく、P を別の自機にする
function forPlayers(fn) { if (!coop) return fn(P, 0); players.forEach((pl, k) => withP(pl, () => fn(pl, k))); }
function withNear(p, fn) { return fn(); }   // 2人のときは coop.js が、近い方の自機を狙わせる
function camStep(dt) { updateCamera(dt); }
function allOut() { return true; }          // 全員の残機が無くなったか(2人のときは coop.js)
function readInput2() { return NEUTRAL; }   // 2Pの入力(coop.js)
function p1PadSlot() { return 0; }          // 1Pが使うゲームパッドの番号(-1 = 使わない)
function resetForStage() {   // 新しい惑星系: 出発点に戻り、目的地の惑星へ向く
  const yaw = rnd(-0.6, 0.6), pit = rnd(-0.2, 0.2), tb = basisYP(yaw, pit, 0);
  travelDir = tb.f; destDist0 = 36000 + 5000 * Math.min(stage, 12); ENC_AT = stage >= 6 ? [0.12, 0.26, 0.4, 0.54, 0.68, 0.82] : [0.18, 0.38, 0.58, 0.78];   // 遠い星系ほど、道のりが長く、遭遇戦が多い
  START = [0, 0, 0]; DEST = vmul(travelDir, destDist0);
  P.p = [0, 0, 0]; P.yaw = yaw; P.pitch = pit; P.yawV = P.pitchV = 0; P.v = [0, 0, 0]; P.vel = [0, 0, 0]; P.locks = []; P.pending = [];
  cam.yaw = yaw; cam.pitch = pit; mode = 'fight'; modeT = 0; enc = 0; bossShip = null; bossSpawned = false; phaseT = 0; fleetShips = [];
  spawnStage();
}
// ---------- 星間航路(分岐する星図。途中で分かれ、ハブで合流し、最後は一本の道になる) ----------
// 63の星系。1周は35面(0〜34列目を、1列に1面ずつ進む)。分岐は3か所: 3ルート(第1分岐)→ ハブ → 3ルート(第2分岐)→ ハブ → 2ルート(第3分岐)→ ハブ → 最終の5面。
// kind: boss = ボスとの戦い、fleet = 大型艦の艦隊との戦い、core = 惑星の内部へ突入して中心核を壊す、belt = 小惑星帯を突破する(zones.js)。depth(列+1)が、敵の強さ・道のりの長さになる。
const CAMP = { nodes: {}, start: 'p0', cols: 35 };
const ROUTE_INFO = {
  a0: ['IRON FRONT', '帝国の艦隊。要塞惑星の内部へ突入する', 'Imperial fleet. Dive into a fortress planet.'], b0: ['CIRCUIT LINE', 'マシン軍団。途中で小惑星帯を抜ける', 'Machine Legion. Break through an asteroid belt on the way.'], c0: ['HIVE TIDE', 'バイオの群れ。巣の惑星の内部へ', 'Bio Swarm. Into the planet of the hive.'],
  d0: ['RUINS RUN', '古代文明の遺跡。神殿惑星の内部へ', 'Ruins of an ancient civilization. Into the temple planet.'], e0: ['VOID RIFT', 'ヴォイド。崩れた小惑星帯を抜ける', 'The Void. Break through a crumbling asteroid belt.'], f0: ['CRIMSON WAR', '帝国の主力艦隊。兵器工場の惑星へ', 'Imperial main fleet. To the weapons-factory planet.'],
  g0: ['EVENT HORIZON', 'ヴォイドの深部。重力で乱れる小惑星帯', 'Deep in the Void. An asteroid belt warped by gravity.'], k0: ['LAST BASTION', '古代の最後の砦。砦の惑星の内部へ', 'The last bastion of the ancients. Into the fortress planet.'],
};
(function buildCampaign() {
  const N = CAMP.nodes, STARS = ['XAVIER', 'KEPLER-9', 'ORION', 'VEGA', 'ALTAIR', 'ZETA', 'PYRRHOS', 'HELIOS', 'NEMESIS', 'CASTOR', 'SIRIUS', 'RIGEL', 'DENEB', 'POLLUX', 'ANTARES', 'CAPELLA', 'ARCTURUS', 'PROCYON', 'ALDEBARAN', 'BETELGEUSE', 'SPICA', 'REGULUS', 'FOMALHAUT', 'ACHERNAR', 'HADAR', 'MIRA', 'ALGOL', 'MIZAR', 'SADR', 'NUNKI', 'KAUS', 'ALPHARD', 'DIPHDA', 'SCHEDAR', 'MIRACH', 'ALMACH', 'HAMAL', 'MENKAR', 'ELNATH', 'ALNILAM', 'SAIPH', 'WEZEN', 'ADHARA', 'ASPIDISKE', 'AVIOR', 'MIAPLACIDUS', 'ALIOTH', 'DUBHE', 'MERAK', 'PHECDA', 'MEGREZ', 'ALKAID', 'ERIDANUS', 'CANOPUS', 'ALTARF', 'TARAZED', 'VINDEMIATRIX', 'ZUBENELGENUBI', 'SABIK', 'RASALHAGUE', 'ALBIREO', 'MARKAB', 'SCHEAT', 'ENIF', 'SADALSUUD'];
  let si = 0;
  const add = (id, faction, kind, boss, col, row, route = '') => { N[id] = { id, name: STARS[si++], faction, kind, boss, col, row, depth: col + 1, next: [], route }; return id; };
  const link = (a, b) => N[a].next.push(b);
  const line = (ids) => { for (let i = 0; i < ids.length - 1; i++) link(ids[i], ids[i + 1]); };
  // 序章(5面。最後は小惑星帯)
  const pro = [add('p0', 'empire', 'boss', 'JUDGEMENT', 0, 1), add('p1', 'machine', 'boss', 'MACHINE_KING', 1, 1), add('p2', 'bio', 'boss', 'NEBULA_BRAIN', 2, 1), add('p3', 'ancient', 'boss', 'DARK_MOON', 3, 1), add('p4', 'machine', 'belt', null, 4, 1)]; line(pro);
  // ルート: len 面。途中の sp 面目が、特殊な区域(core = 惑星の内部、belt = 小惑星帯)。最後はボス
  const route = (pre, fac, boss, col0, row, name, sp, spKind, spBoss, len = 6) => { const ids = []; for (let i = 0; i < len; i++) ids.push(add(pre + i, fac, i === len - 1 ? 'boss' : i === sp ? spKind : 'fleet', i === len - 1 ? boss : i === sp && spKind === 'core' ? spBoss : null, col0 + i, row, name)); line(ids); return ids; };
  // 第1分岐(3ルート×6面)
  const A = route('a', 'empire', 'DESTROYER_PRIME', 5, 0, 'IRON FRONT', 2, 'core', 'FORGE_CORE'), B = route('b', 'machine', 'CHAOS_NODE', 5, 1, 'CIRCUIT LINE', 2, 'belt'), C = route('c', 'bio', 'BIO_QUEEN', 5, 2, 'HIVE TIDE', 2, 'core', 'HIVE_HEART');
  for (const r of [A, B, C]) link('p4', r[0]);
  const h1 = add('h1', 'void', 'boss', 'BLACK_SUN', 11, 1, 'ECLIPSE GATE'); for (const r of [A, B, C]) link(r[5], h1);
  // 幕間(4面。小惑星帯と、古代の惑星の中心核)
  const I = [add('i0', 'ancient', 'fleet', null, 12, 1), add('i1', 'void', 'fleet', null, 13, 1), add('i2', 'void', 'belt', null, 14, 1), add('i3', 'ancient', 'core', 'PLANET_CORE', 15, 1)]; link(h1, I[0]); line(I);
  // 第2分岐(3ルート×6面)
  const Dd = route('d', 'ancient', 'ANCIENT_AI', 16, 0, 'RUINS RUN', 2, 'core', 'ORACLE_CORE'), E = route('e', 'void', 'SINGULARITY', 16, 1, 'VOID RIFT', 2, 'belt'), Ff = route('f', 'empire', 'TITAN', 16, 2, 'CRIMSON WAR', 2, 'core', 'CRIMSON_HEART');
  for (const r of [Dd, E, Ff]) link('i3', r[0]);
  const h2 = add('h2', 'machine', 'boss', 'OMEGA_CORE', 22, 1, 'IRON GATE'); for (const r of [Dd, E, Ff]) link(r[5], h2);
  // 幕間2(2面)
  const J = [add('j0', 'machine', 'boss', 'ABSOLUTE_ZERO', 23, 1), add('j1', 'bio', 'boss', 'HIVE_WORLD', 24, 1)]; link(h2, J[0]); line(J);
  // 第3分岐(2ルート×4面)
  const G = route('g', 'void', 'VOID_GOD', 25, 0.5, 'EVENT HORIZON', 1, 'belt', null, 4), K = route('k', 'ancient', 'LAST_ORIGIN', 25, 1.5, 'LAST BASTION', 1, 'core', 'ORIGIN_HEART', 4);
  for (const r of [G, K]) link('j1', r[0]);
  const h3 = add('h3', 'empire', 'boss', 'MOTHER_SHIP', 29, 1, 'CONVERGENCE'); for (const r of [G, K]) link(r[3], h3);
  // 最終(5面。最初は小惑星帯)
  const Z = [add('zb', 'machine', 'belt', null, 30, 1), add('z0', 'machine', 'fleet', null, 31, 1), add('z1', 'bio', 'fleet', null, 32, 1), add('z2', 'bio', 'boss', 'STAR_EATER', 33, 1), add('z3', 'void', 'boss', 'ENDLESS_VOID', 34, 1)]; link(h3, Z[0]); line(Z);
  for (const id of Object.keys(ROUTE_INFO)) if (N[id]) N[id].info = ROUTE_INFO[id];
})();
let campaign = { node: 'p0', path: [], loop: 0 }, fleetShips = [], mapSel = 0;
const curNode = () => CAMP.nodes[campaign.node] || CAMP.nodes[CAMP.start];
function nodeAtDepth(d) { let n = CAMP.nodes[CAMP.start]; const k = (((d - 1) % CAMP.cols) + CAMP.cols) % CAMP.cols; for (let i = 0; i < k && n.next.length; i++) n = CAMP.nodes[n.next[0]]; return n; }   // 深さから、いちばん上の道をたどった星系(確認用・古いセーブ用)
const sectorName = () => curNode().name;
function pickFleetClass() { const d = stage, pool = d < 6 ? ['cruiser', 'battle'] : d < 12 ? ['battle', 'carrier', 'cruiser'] : d < 20 ? ['battle', 'carrier', 'dread'] : ['carrier', 'dread', 'dread', 'titan']; return pool[Math.floor(Math.random() * pool.length)]; }
function spawnFleet() {   // 艦隊戦: 大型艦が、ワープインして並ぶ。全部壊すと、クリア
  const f = travelDir, b = basisDir(f, 0), yawB = Math.atan2(-f[0], -f[2]), cnt = stage < 10 ? 2 : 3; fleetShips = [];
  for (let i = 0; i < cnt; i++) {
    const sh = makeShip(pickFleetClass(), vadd(vadd(P.p, vmul(f, 5200 + rnd(-300, 600))), vadd(vmul(b.r, (i - (cnt - 1) / 2) * 2700), vmul(b.u, rnd(-500, 500)))), yawB + rnd(-0.4, 0.4));
    sh.v = vmul(randDir(), rnd(0, 0.3)); startWarp(sh, 110, FACTIONS[sh.faction].rgb, i * 30); ships.push(sh); fleetShips.push(sh);
  }
  announce('22'); warningT = 180; SND.se('warning');
}
function advanceTo(id, loop) { campaign.path.push(campaign.node); if (campaign.path.length > 80) campaign.path.shift(); campaign.node = id; if (loop) campaign.loop++; }
function startWarpMode() { mode = 'warp'; modeT = 0; SND.se('warpCharge'); rumble(0.3, 0.3, 900); saveGame(stage + 1); }
function mapChoices() { return curNode().next.map(id => CAMP.nodes[id]); }
function mapChoose(i) { const c = mapChoices()[i]; if (!c) return; SND.se('ok'); advanceTo(c.id); startWarpMode(); }
function mapInput() {   // ←→↑↓ で航路を選び、決定(Space / Enter / A / Start)
  const i = curInp || {}, n = mapChoices().length, up = i.my > 0.5 || i.mx < -0.5, dn = i.my < -0.5 || i.mx > 0.5;
  if (up && !hgPrev.up) { mapSel = (mapSel + n - 1) % n; SND.se('tick'); } if (dn && !hgPrev.dn) { mapSel = (mapSel + 1) % n; SND.se('tick'); }
  if (modeT > 20 && ((i.fire && !hgPrev.fire) || (i.launch && !hgPrev.launch))) mapChoose(mapSel);
  hgPrev = { up, dn, fire: !!i.fire, launch: !!i.launch };
  if (demo && modeT > 30) mapChoose(Math.floor(Math.random() * n));   // 自動操縦は、ランダムに選ぶ
}
function mapCards() { const n = mapChoices().length, w = Math.min(380, (W - 120) / n - 20); return mapChoices().map((c, i) => ({ x: W / 2 - (n * (w + 20) - 20) / 2 + i * (w + 20), y: 470, w, h: 130 })); }
function mapTap(p) { const cs = mapCards(); for (let i = 0; i < cs.length; i++) if (inRect(p, cs[i])) { if (mapSel === i) mapChoose(i); else { mapSel = i; SND.se('tick'); } return true; } return false; }
function drawGalaxyMap() {   // 星図: これまでの道、これからの分かれ道、合流点
  const ch = mapChoices(), cur = curNode(), gx = c => 64 + c * (1152 / (CAMP.cols - 1)), gy = r => 232 + r * 78;
  noStroke(); fill(0, 0, 0, 246); rect(30, 70, W - 60, 560, 10); neon([80, 200, 255], 200, 8, 1.4); noFill(); rect(30, 70, W - 60, 560, 10); noGlow();
  centerText('GALAXY MAP', 104, 34, [120, 230, 255]); centerText('SECTOR ' + cur.depth + ' CLEAR   —   CHOOSE YOUR ROUTE', 140, 15, [255, 210, 120], false);
  const pathSet = new Set(campaign.path), pulse = 0.5 + 0.5 * Math.sin(frameCount * 0.15);
  strokeWeight(1.4);
  for (const n of Object.values(CAMP.nodes)) for (const id of n.next) { const m = CAMP.nodes[id], on = pathSet.has(n.id) && (pathSet.has(id) || id === cur.id) || (n.id === cur.id && ch.includes(m)); stroke(on ? color(120, 230, 255, 200) : color(70, 100, 125, 120)); line(gx(n.col), gy(n.row), gx(m.col), gy(m.row)); }
  noStroke();
  for (const n of Object.values(CAMP.nodes)) {
    const x = gx(n.col), y = gy(n.row), c = FACTIONS[n.faction].rgb, visited = pathSet.has(n.id), isCur = n.id === cur.id, isChoice = ch.includes(n), r = n.kind === 'boss' ? 6.5 : 4.2;
    if (isChoice) { neon(c, 255, 10, 2); noFill(); ellipse(x, y, 20 + 8 * pulse); noGlow(); noStroke(); }
    if (isCur) { neon([255, 255, 255], 255, 10, 2); noFill(); ellipse(x, y, 22); noGlow(); noStroke(); }
    fill(c[0], c[1], c[2], visited || isCur ? 255 : isChoice ? 230 : 110); ellipse(x, y, r * 2);
    if (n.kind === 'boss') { noFill(); stroke(255, 100, 90, visited ? 230 : 130); strokeWeight(1.2); ellipse(x, y, r * 2 + 6); noStroke(); }
    if (n.kind === 'core') { noFill(); stroke(255, 170, 90, visited ? 240 : 150); strokeWeight(1.4); ellipse(x, y, r * 2 + 7); ellipse(x, y, r * 2 + 13); noStroke(); }
    if (n.kind === 'belt') { fill(200, 175, 140, visited ? 240 : 150); for (const [dx, dy] of [[-7, -6], [7, -5], [0, 8]]) ellipse(x + dx, y + dy, 3.2); }
  }
  fill(150, 190, 205); textAlign(LEFT, CENTER); textSize(10); text('PROLOGUE', gx(0), gy(1) - 34); text('ROUTE 1', gx(5), gy(-0.55)); text('ECLIPSE GATE', gx(10), gy(1) - 44); text('ROUTE 2', gx(16), gy(-0.55)); text('IRON GATE', gx(21), gy(1) - 44); text('ROUTE 3', gx(25), gy(-0.05)); text('CONVERGENCE', gx(28), gy(1) - 44); text('FINAL', gx(30), gy(1) - 34);
  textAlign(RIGHT, CENTER); { let lx = W - 64; for (const [lc, ls] of [[[255, 110, 100], TR('○ ボス', '○ Boss')], [[200, 175, 140], TR('∴ 小惑星帯', '∴ Asteroid belt')], [[255, 170, 90], TR('◎ 惑星の内部', '◎ Planet core')]]) { fill(...lc); text(ls, lx, 90); lx -= textWidth(ls) + 26; } }
  const cs = mapCards();
  ch.forEach((c, i) => {
    const r = cs[i], sel = i === mapSel, col = FACTIONS[c.faction].rgb, route = c.info ? c.info[0] : (c.route || c.name), blurb = c.info ? TR(c.info[1], c.info[2]) : '';
    noStroke(); fill(sel ? color(col[0], col[1], col[2], 60) : color(255, 255, 255, 10)); rect(r.x, r.y, r.w, r.h, 8);
    neon(sel ? col : [80, 110, 130], sel ? 240 : 140, sel ? 8 : 0, sel ? 2 : 1); noFill(); rect(r.x, r.y, r.w, r.h, 8); noGlow(); noStroke();
    fill(col[0], col[1], col[2]); textAlign(LEFT, TOP); textSize(20); text(route, r.x + 16, r.y + 14);
    fill(220, 235, 245); textSize(13); text(FACTIONS[c.faction].name, r.x + 16, r.y + 44); fill(160, 200, 215); textSize(12); text(blurb, r.x + 16, r.y + 66);
    fill(255, 200, 110); textSize(12); text('DANGER  ' + '◆'.repeat(Math.min(6, 1 + Math.floor(c.depth / 5))) + '◇'.repeat(6 - Math.min(6, 1 + Math.floor(c.depth / 5))), r.x + 16, r.y + 92); fill(255, 220, 140); text('FIRST: ' + c.name, r.x + 16, r.y + 110);
    const kinds = new Set(); for (let q = c, k = 0; q && k < 8; k++) { kinds.add(q.kind); if (!c.route || q.next.length !== 1 || CAMP.nodes[q.next[0]].route !== c.route) break; q = CAMP.nodes[q.next[0]]; }
    const tags = [kinds.has('core') ? TR('◎ 惑星の内部', '◎ Planet core') : '', kinds.has('belt') ? TR('∴ 小惑星帯', '∴ Asteroids') : ''].filter(Boolean).join('   '); if (tags) { fill(255, 185, 120); text(tags, r.x + TR(190, 140), r.y + 92); }
  });
  centerText('← → SELECT      SPACE / ENTER / A / TAP  CONFIRM', 622, 12, [150, 200, 190], false);
}
// ---------- 格納庫(恒久の強化)・エンディング・セーブ ----------
const HANGAR = [
  { k: 'shield', name: 'SHIELD', desc: 'MAX SHIELD +20', max: 5, cost: l => 150 + 150 * l },
  { k: 'boost', name: 'BOOST TANK', desc: 'BOOST CAPACITY +20', max: 5, cost: l => 120 + 120 * l },
  { k: 'power', name: 'LASER POWER', desc: 'SHOT DAMAGE +25%', max: 5, cost: l => 250 + 200 * l },
  { k: 'lock', name: 'LOCK-ON', desc: 'MAX LOCKS +1', max: 4, cost: l => 200 + 200 * l },
  { k: 'bits', name: 'BITS', desc: 'ADD ORBITAL BIT', max: 4, cost: l => 300 + 250 * l },
  { k: 'wide', name: 'WIDE CANNON', desc: 'ENERGY COST -3 / RECHARGE +20%', max: 5, cost: l => 180 + 150 * l },
  { k: 'life', name: 'EXTRA LIFE', desc: '+1 LIFE (MAX 5)' },
  { k: 'repair', name: 'REPAIR', desc: 'RESTORE SHIELD' },
];
let hangarSel = 0, hgPrev = { up: false, dn: false, fire: false, launch: false }, curInp = null, saveData = null;
const NEUTRAL = { mx: 0, my: 0, fire: false, lock: false, boost: false, brake: true, roll: 0, release: false, uturn: false, wide: false, form: false };
function upCost(it) { return it.k === 'life' ? 500 : it.k === 'repair' ? 100 : it.cost(P.up[it.k]); }
function upMaxed(it) { return it.k === 'life' ? P.lives >= 5 : it.k === 'repair' ? P.shield >= maxSh() - 0.5 : P.up[it.k] >= it.max; }
function hangarBuy(i, quiet) {
  const it = HANGAR[i], c = upCost(it);
  if (upMaxed(it) || P.credits < c) { if (!quiet) SND.se('clang'); return; }
  P.credits -= c;
  if (it.k === 'life') P.lives++; else if (it.k === 'repair') P.shield = maxSh(); else { P.up[it.k]++; if (it.k === 'shield') P.shield = Math.min(maxSh(), P.shield + 20); }
  saveGame(stage, 'hangar');
  if (!quiet) SND.se('ok');
}
function hangarLaunch() {
  fighters = []; ebullets = []; specialBullets = []; charges = [];
  const n = curNode();
  if (n.next.length > 1) { mode = 'map'; modeT = 0; mapSel = 0; SND.se('ping'); return; }   // 分かれ道: 星図で、航路を選ぶ
  advanceTo(n.next.length ? n.next[0] : CAMP.start, !n.next.length);   // 最後まで行ったら、最初へ(周回。敵が強くなる)
  startWarpMode();
}
function hangarInput() {
  const i = curInp || {}, up = i.my > 0.5, dn = i.my < -0.5;
  if (mode === 'hangar') {
    if (up && !hgPrev.up) { hangarSel = (hangarSel + HANGAR.length - 1) % HANGAR.length; SND.se('tick'); }
    if (dn && !hgPrev.dn) { hangarSel = (hangarSel + 1) % HANGAR.length; SND.se('tick'); }
  }
  if (modeT > 20) {
    if (i.fire && !hgPrev.fire) { if (mode === 'hangar') hangarBuy(hangarSel); else { mode = 'hangar'; modeT = 0; } }
    if (i.launch && !hgPrev.launch) { if (mode === 'hangar') hangarLaunch(); else { mode = 'hangar'; modeT = 0; } }
  }
  hgPrev = { up, dn, fire: !!i.fire, launch: !!i.launch };
}
function hangarRows() { return HANGAR.map((_, i) => ({ x: W / 2 - 320, y: 214 + i * 40, w: 640, h: 36 })); }
const HANGAR_LAUNCH = () => ({ x: W / 2 - 120, y: 546, w: 240, h: 38 });
function inRect(p, r) { return p.x >= r.x && p.x <= r.x + r.w && p.y >= r.y && p.y <= r.y + r.h; }
function hangarTap(p) {   // 画面のタップ・クリック
  if (state !== 'play' || modeT < 20) return false;
  if (mode === 'ending') { mode = 'hangar'; modeT = 0; return true; }
  if (mode === 'map') return mapTap(p);
  if (mode !== 'hangar') return false;
  if (inRect(p, HANGAR_LAUNCH())) { hangarLaunch(); return true; }
  const rows = hangarRows(); for (let i = 0; i < rows.length; i++) if (inRect(p, rows[i])) { if (hangarSel === i) hangarBuy(i); else { hangarSel = i; SND.se('tick'); } return true; }
  return false;
}
function saveGame(nextStage, phase = 'flight') {
  if (demo || coop || state !== 'play') return;   // 2人プレイは、保存しない
  const data = { version: 3, diff: SF.diff, node: campaign.node, path: campaign.path.slice(-80), loop: campaign.loop, phase, stage: nextStage, ship: P.ship ? P.ship.id : 'valkyrie', score: P.score, lives: P.lives, credits: P.credits, up: { ...P.up }, kills: P.kills, shield: P.shield };
  try { localStorage.setItem('sf_save', JSON.stringify(data)); saveData = data; window.sfSaveFailed = false; }
  catch (_) { window.sfSaveFailed = true; }
}
function loadSave() {
  try {
    const v = JSON.parse(localStorage.getItem('sf_save') || 'null');
    if (!v || !Number.isInteger(v.stage) || v.stage < 1 || v.stage > 9999 || !v.up || typeof v.up !== 'object') return null;
    const num = (n, lo, hi, fallback) => Number.isFinite(n) ? Math.max(lo, Math.min(hi, Math.floor(n))) : fallback;
    const up = {}; for (const it of HANGAR) if (it.max) up[it.k] = num(v.up[it.k], 0, it.max, 0);
    return { diff: Number.isInteger(v.diff) && v.diff >= 0 && v.diff <= 3 ? v.diff : 1, ship: typeof v.ship === 'string' && typeof SHIPS !== 'undefined' && SHIPS[v.ship] ? v.ship : 'valkyrie', version: 3, node: typeof v.node === 'string' && CAMP.nodes[v.node] ? v.node : nodeAtDepth(v.stage).id, path: Array.isArray(v.path) ? v.path.filter(id => CAMP.nodes[id]).slice(-80) : [], loop: num(v.loop, 0, 999, 0), stage: v.stage, phase: v.phase === 'hangar' ? 'hangar' : 'flight', up,
      score: num(v.score, 0, 999999999, 0), credits: num(v.credits, 0, 99999999, 0), kills: num(v.kills, 0, 9999999, 0),
      lives: num(v.lives, 1, 5, 3), shield: num(v.shield, 1, 100 + 20 * up.shield, 100 + 20 * up.shield) };
  } catch (_) { return null; }
}
function continueGame() {
  const v = loadSave(); if (!v) return;
  SND.resume(); SND.se('coin'); demo = false; paused = false; setDiff(v.diff); newGame();
  if (typeof SHIPS !== 'undefined' && SHIPS[v.ship]) P.ship = SHIPS[v.ship];
  stage = v.stage; campaign = { node: v.node, path: v.path, loop: v.loop }; P.score = v.score; P.lives = v.lives; P.credits = v.credits; P.kills = v.kills;
  Object.assign(P.up, v.up); P.shield = v.phase === 'hangar' ? v.shield : maxSh();
  resetForStage(); state = 'play';
  if (v.phase === 'hangar') { mode = 'hangar'; modeT = 40; hangarSel = 0; }
  clearFlightInput();
}
function drawHangar() {
  const x0 = W / 2 - 330;
  noStroke(); fill(0, 0, 0, 210); rect(x0, 120, 660, 500, 10);
  neon([60, 255, 140], 200, 8, 1.5); noFill(); rect(x0, 120, 660, 500, 10); noGlow();
  centerText('HANGAR', 152, 40, [255, 200, 60]); centerText('CREDITS  ' + P.credits + '     STAGE ' + stage + ' CLEAR', 190, 16, [120, 255, 180], false);
  textAlign(LEFT, CENTER);
  HANGAR.forEach((it, i) => {
    const r = hangarRows()[i], sel = i === hangarSel, maxed = upMaxed(it), c = upCost(it), ok = !maxed && P.credits >= c;
    noStroke(); fill(sel ? color(60, 255, 140, 45) : color(255, 255, 255, 8)); rect(r.x, r.y, r.w, r.h, 4);
    if (sel) { neon([60, 255, 140], 220, 6, 1.2); noFill(); rect(r.x, r.y, r.w, r.h, 4); noGlow(); }
    noStroke(); textSize(16); fill(maxed ? color(140, 140, 140) : ok ? color(255, 255, 255) : color(200, 170, 170)); text(it.name, r.x + 12, r.y + 12);
    textSize(11); fill(150, 200, 190); text(it.desc, r.x + 12, r.y + 27);
    if (it.max) for (let j = 0; j < it.max; j++) { fill(j < P.up[it.k] ? color(60, 255, 140) : color(60, 70, 70)); rect(r.x + 250 + j * 20, r.y + 10, 14, 16, 2); }
    else { textSize(13); fill(180, 220, 200); text(it.k === 'life' ? 'LIVES  ' + P.lives : 'SHIELD  ' + Math.round(P.shield) + '/' + maxSh(), r.x + 250, r.y + 18); }
    textAlign(RIGHT, CENTER); textSize(16); fill(maxed ? color(140, 140, 140) : ok ? color(255, 220, 90) : color(230, 90, 90)); text(maxed ? 'MAX' : c, r.x + r.w - 14, r.y + 18); textAlign(LEFT, CENTER);
  });
  const L = HANGAR_LAUNCH(); noStroke(); fill(255, 200, 60, 40); rect(L.x, L.y, L.w, L.h, 6); neon([255, 200, 60], 220, 6, 1.5); noFill(); rect(L.x, L.y, L.w, L.h, 6); noGlow();
  centerText('LAUNCH', L.y + 19, 20, [255, 220, 90], false);
  centerText('UP DOWN SELECT     SPACE / A / TAP  BUY     ENTER / START  LAUNCH', 604, 12, [150, 200, 190], false);
}
function drawEnding() {
  noStroke(); fill(0, 0, 0, 200); rect(0, H / 2 - 190, W, 380);
  centerText('MISSION COMPLETE', H / 2 - 130, 56, [90, 255, 130]);
  centerText('THE VOID IS SILENT.  THE GALAXY IS SAVED.', H / 2 - 70, 22, [200, 255, 220], false);
  centerText('SCORE ' + String(P.score).padStart(6, '0') + '    DESTROYED ' + P.kills + '    LIVES ' + P.lives, H / 2 - 20, 20, HUDC);
  centerText('THE GALAXY IS RESET...  NEW GAME+ :  ENEMIES GROW STRONGER', H / 2 + 30, 16, [255, 200, 100], false);
  if (Math.floor(frameCount / 30) % 2 === 0) centerText('PRESS ENTER / SPACE / TAP', H / 2 + 110, 20, HUDC);
}
function stageCleared() { if (curNode().kind === 'fleet') return fleetShips.length > 0 && fleetShips.every(s => !s.alive); return !!(bossShip && !bossShip.alive); }   // 特殊な区域は、zones.js が上書きする
let zoneInside = false;   // 惑星の内部(トンネルと中心核の部屋)にいる間 true(zones.js)
function bgmFor(bossOn) {   // 場面 → BGM の名前(audio.js の40曲)
  if (state === 'title') return 'title'; if (state === 'over') return 'gameover';
  if (mode === 'hangar') return 'hangar'; if (mode === 'ending') return 'ending'; if (mode === 'map') return 'map'; if (mode === 'clear') return 'clear'; if (mode === 'warp') return 'warp';
  if (warningT > 0) return null;
  const n = curNode(), f = stageFaction(), h = (n.id.charCodeAt(0) * 7 + n.id.charCodeAt(n.id.length - 1)) % 2 ? '_a' : '_b';
  if (n.kind === 'core') return bossOn ? 'core_heart' : zoneInside ? 'core_' + (1 + n.depth % 3) : f + h;
  if (n.kind === 'belt') return 'belt_' + (1 + n.depth % 3);
  if (bossOn) { const d = bossShip.def; return n.id === 'z3' ? 'last_boss' : d && d.tier >= 3 ? 'final_boss' : /^h\d/.test(n.id) ? 'hub_gate' : d && d.tier === 2 ? 'boss_heavy' : f + '_boss'; }
  if (n.kind === 'fleet' && bossSpawned) return f + '_fleet';
  if (n.route === 'EVENT HORIZON') return 'event_horizon'; if (n.route === 'LAST BASTION') return 'last_bastion';
  return f + h;
}
function updateStage(dt) {
  if (mode === 'fight') {
    const prog = dot(vsub(P.p, START), travelDir);
    while (enc < ENC_AT.length && prog > destDist0 * ENC_AT[enc]) { spawnEncounter(enc); enc++; }
    spawnT -= dt;
    if (spawnT <= 0 && fighters.filter(f => f.type !== 'swarm').length < Math.round(Math.min(lite ? 12 : 24, 8 + stage * 2) * DF().count)) { spawnFighter(); spawnT = Math.max(40, 120 - stage * 8) / DF().count; }
    if (stage >= 2) { swarmT -= dt; if (swarmT <= 0) { spawnSwarm(); swarmT = 800; } }
    if (!bossSpawned && vlen(vsub(DEST, P.p)) < 9000) spawnBoss();
    cull();
    if (bossSpawned && stageCleared()) { mode = 'clear'; modeT = 0; P.score += scoreOf(Math.round(P.shield) * 10); P.credits += 200 + 100 * stage + Math.round(P.shield); }
  } else if (mode === 'clear') {
    modeT += dt; if (modeT < 130 && Math.floor(modeT) % 5 === 0) SND.se('tick');
    if (modeT > 170) { mode = curNode().next.length === 0 ? 'ending' : 'hangar'; modeT = 0; hangarSel = 0; fighters = []; ebullets = []; specialBullets = []; charges = []; saveGame(stage, 'hangar'); }
  } else if (mode === 'ending') {   // 20ステージ目のボスを倒した: エンディング。続きは、ステージ21以降(体力が増える)
    modeT += dt; hangarInput(); if (demo && modeT > 90) { mode = 'hangar'; modeT = 0; }
  } else if (mode === 'map') {   // 星図: 分かれ道で、次の航路を選ぶ
    modeT += dt; mapInput();
  } else if (mode === 'hangar') {   // 格納庫: お金で、恒久の強化を買う
    modeT += dt; hangarInput();
    if (demo && modeT > 30) { for (let i = 0; i < HANGAR.length; i++) hangarBuy(i, true); if (modeT > 60) hangarLaunch(); }
  } else if (mode === 'warp') {
    modeT += dt;
    if (modeT > 190) { stage++; P.shield = Math.min(maxSh(), P.shield + 30); whiteFlash = 1; SND.se('warpJump'); resetForStage(); }
  }
}

// ---------- 自機 ----------
function hurtPlayer(d, src) {
  if (paused || state !== 'play' || mode !== 'fight' || P.invuln > 0 || P.dead || god) return;
  P.shield -= d * DF().dmg; P.invuln = 36; shake = Math.max(shake, 7); flash = 1; P.hitT = 24; SND.se('hit', src); rumble(0.8, 0.5, 200);
  if (P.shield <= 0) {
    SND.se('playerBoom'); rumble(1, 1, 600); P.dead = true; P.deadT = 110; P.lives--; P.locks = [];
    const b = basisYP(P.yaw, P.pitch, P.roll), vw = bakeMesh(M.player, P.p, b, 1);
    fragments(vw, M.player.f, C.ship, 40, true, P.v); burst(P.p, 30, 12, [255, 220, 120]); addShockwave(P.p, 300, 6, [120, 225, 255]); shake = 18;
  }
}
function updatePlayer(dt, inp) {
  if (P.dead) {
    P.deadT -= dt;
    if (P.deadT <= 0) {
      if (P.lives > 0) { P.dead = false; P.shield = maxSh(); P.invuln = 200; P.v = [0, 0, 0]; P.vel = [0, 0, 0]; ebullets = []; specialBullets = []; charges = []; P.locks = []; }
      else if (state === 'play' && allOut()) state = 'over';
    }
    return;
  }
  if (P.invuln > 0) P.invuln -= dt;
  const inWarp = mode === 'warp';
  if (inp.form) { P.form = P.form === 'combat' ? 'cruise' : 'combat'; P.locks = []; P.pending = []; burst(P.p, 14, 6, [120, 225, 255]); SND.se(P.form === 'combat' ? 'formC' : 'formB'); }   // 変形
  P.foldV += ((P.form === 'combat' ? 1 : 0) - P.foldV) * 0.12 * dt;
  const cm = P.form === 'cruise';
  // 旋回・上昇下降(なめらかに)
  const cs = P.confT > 0 ? -1 : 1, mx = inWarp ? 0 : inp.mx * cs, my = inWarp ? 0 : inp.my * cs;   // 混乱: 操作が逆になる
  const turn = (cm ? 0.016 : 0.032) * (P.boosting ? 0.7 : 1) * (P.slowT > 0 ? 0.5 : 1) * shipK('turn');   // 戦闘形態は旋回が2倍、巡航形態は速い
  P.yawV += (mx * turn - P.yawV) * 0.12 * dt;
  P.pitchV += (my * (cm ? 0.014 : 0.026) * shipK('turn') - P.pitchV) * 0.12 * dt;
  if (P.uT > 0) { P.uT -= dt; P.yawV = 0; P.yaw += PI / 26 * dt; P.rollAng = (P.rollAng + 0.24 * dt) % TWO_PI; }
  P.yaw += P.yawV * dt; P.pitch += P.pitchV * dt;
  if (P.pitch > 1.3) { P.pitch = 1.3; P.pitchV = 0; } if (P.pitch < -1.3) { P.pitch = -1.3; P.pitchV = 0; }
  P.warn = false;
  // ブースト / ブレーキ
  const canBoost = inp.boost && P.boost > (P.boosting ? 0 : 20);
  P.boosting = canBoost;
  if (canBoost) P.boost = Math.max(0, P.boost - 0.7 * dt); else P.boost = Math.min(boostMax(), P.boost + 0.25 * dt);
  const target = inWarp ? 60 : canBoost ? (cm ? 46 : 32) * shipK('speed') : inp.brake ? 9 : (cm ? 27 : 18) * shipK('speed');   // 巡航形態は速度1.5倍
  // バレルロール(横へ滑る)・Uターン
  if (inp.roll && P.rollT <= 0) { P.rollT = 34; P.rollDir = inp.roll; P.dash = inp.roll * 9; P.vel = vadd(P.vel, vmul(basisYP(P.yaw, P.pitch, 0).r, inp.roll * 9)); P.v = P.vel; }   // 横への推力(力積)
  if (P.rollT > 0) {
    P.rollT -= dt; const u = 1 - Math.max(0, P.rollT) / 34;
    P.rollAng = P.rollDir * TWO_PI * (u * u * (3 - 2 * u));
    P.dash *= Math.pow(0.9, dt);
    for (const b of ebullets) if (b.owner === 'e' && vlen(vsub(b.p, P.p)) < 170) { b.owner = 'r'; b.v = vmul(b.v, -1.6); b.life = 90; }
    for (const sb of specialBullets) if (sb.owner === 'e' && sb.kind !== 'gravity' && sb.kind !== 'rift' && vlen(vsub(sb.p, P.p)) < 170) { sb.owner = 'r'; sb.v = vmul(sb.v, -1.4); sb.life = Math.max(sb.life, 90); }   // 特殊弾も、はね返せる
  } else if (P.uT <= 0) { P.rollAng = 0; P.dash *= Math.pow(0.9, dt); }
  if (inp.uturn && P.uT <= 0 && P.rollT <= 0) P.uT = 26;
  P.roll = Math.max(-0.9, Math.min(0.9, -P.yawV * 22)) + P.rollAng;
  const b = basisYP(P.yaw, P.pitch, 0);
  // 慣性飛行: 速度 P.vel は保存される。推力は前方の成分だけを動かし、姿勢制御(FA)が横滑りを打ち消す(切ると、横へ流れ続ける)
  let vf = dot(P.vel, b.f); const lat0 = vsub(P.vel, vmul(b.f, vf));
  vf += (target - vf) * 0.08 * dt;
  P.vel = vadd(vadd(vmul(b.f, vf), vmul(lat0, Math.pow(P.fa ? 0.9 : 0.997, dt))), vmul(gravAt(P.p), dt));
  P.speed = vf; P.v = P.vel; P.p = vadd(P.p, vmul(P.vel, dt));
  const pl = vsub(P.p, DEST), pd = vlen(pl);
  if (pd < DEST_R + 30 && !zoneInside) { const n = vnorm(pl); P.p = vadd(DEST, vmul(n, DEST_R + 31)); const vn = dot(P.vel, n); if (vn < 0) { P.vel = vsub(P.vel, vmul(n, 1.35 * vn)); P.v = P.vel; hurtPlayer(Math.min(36, 6 - vn * 1.15)); SND.se('clang'); } }   // 惑星に、はね返される
  // 射撃(2連の光線)
  P.cd -= dt;
  if (inp.fire && P.cd <= 0 && !inWarp) {
    P.cd = 7 / shipK('rate'); const pb = basisYP(P.yaw, P.pitch, P.roll); SND.se(cm ? 'shotB' : 'shotC');
    if (!cm) for (const bp of bitPositions()) pbullets.push({ p: bp, pp: bp, v: vadd(vmul(b.f, 90), P.vel), life: 58, dmg: pwr() });   // ビットが連動して撃つ
    for (const s of (P.ship && P.ship.guns) || [-22, 22]) { const o = vadd(cockpit ? cam.p : P.p, vadd(vmul(pb.r, s), vmul(pb.f, cockpit ? 10 : 40))); pbullets.push({ p: o, pp: o, v: vadd(vmul(b.f, 90), P.vel), life: 58, dmg: pwr() }); }   // 弾は、自機の速度を引き継ぐ
  }
  // 特殊兵装(ワイド): 扇状の太いレーザー。エネルギーを30使う
  if (P.energy < 100) P.energy = Math.min(100, P.energy + 0.09 * (1 + 0.2 * P.up.wide) * shipK('energy') * dt);
  if (inp.wide && P.energy >= wideCost() && !inWarp && !cm) {
    P.energy -= wideCost(); shake = Math.max(shake, 4);
    for (let i = -4; i <= 4; i++) { const wb = basisYP(P.yaw + i * 0.075, P.pitch, 0); pbullets.push({ p: vadd(P.p, vmul(wb.f, 40)), pp: vadd(P.p, vmul(wb.f, 40)), v: vadd(vmul(wb.f, 85), P.vel), life: 45, dmg: 3, wide: true }); }
  }
  // ロックオン
  if (inp.lock && !inWarp && !cm) {   // 補助兵装は戦闘形態のみ
    P.lockT -= dt;
    if (P.lockT <= 0 && P.locks.length < lockMax()) {
      const rt = projW(vadd(P.p, vmul(b.f, 1500)));
      let best = null, bd = touchMode ? 210 : 150;   // タッチは、ロックオンの範囲を広げる
      for (const t of lockTargets()) {
        if (P.locks.includes(t)) continue;
        const c = toCam(t.p[0], t.p[1], t.p[2]); if (c[2] < 200 || c[2] > 5200 || !rt) continue;
        const q = sc(c), dd = Math.hypot(q[0] - rt[0], q[1] - rt[1]);
        if (dd < bd) { bd = dd; best = t; }
      }
      if (best) { P.locks.push(best); P.lockT = 7; SND.se('lock'); }
    }
  }
  if (inp.release && P.locks.length) { P.locks.forEach((t, i) => P.pending.push({ t, delay: i * 5 })); P.locks = []; }
  for (let i = P.pending.length - 1; i >= 0; i--) {
    const q = P.pending[i]; q.delay -= dt;
    if (q.delay <= 0) { SND.se('missile'); missiles.push({ p: [...P.p], pp: [...P.p], v: vadd(vadd(vmul(b.f, 40), vmul(randDir(), 6)), P.vel), target: q.t, life: 240, mass: 0.3 }); P.pending.splice(i, 1); }
  }
  P.locks = P.locks.filter(t => !t.dead && (t.kind !== 'part' || t.exposed));
}
function bitPositions() {   // 自機の周りを回る2基のビット
  const b = basisYP(P.yaw, P.pitch, P.roll), a = frameCount * 0.07, out = [];
  const nb = 2 + P.up.bits + shipK('bits'); for (let j = 0; j < nb; j++) { const k = j * TWO_PI / nb; const x = Math.cos(a + k) * 70, y = Math.sin(a + k) * 40; out.push(vadd(P.p, vadd(vmul(b.r, x), vadd(vmul(b.u, y), vmul(b.f, 10))))); }
  return out;
}
function lockTargets() {
  const out = fighters.filter(f => !f.cloaked && !(f.wt > 0));
  for (const s of ships) if (s.alive && !(s.wt > 0)) for (const p of s.all) if (p.alive && p.exposed) out.push(p);
  return out;
}

// ---------- 更新 ----------
function segSphere(p0, p1, c, r) {
  const dx = p1[0] - p0[0], dy = p1[1] - p0[1], dz = p1[2] - p0[2], dd = dx * dx + dy * dy + dz * dz;
  const mx = p0[0] - c[0], my = p0[1] - c[1], mz = p0[2] - c[2];
  let t = dd > 1e-9 ? -(mx * dx + my * dy + mz * dz) / dd : 0; t = t < 0 ? 0 : t > 1 ? 1 : t;
  const qx = mx + dx * t, qy = my + dy * t, qz = mz + dz * t;
  return qx * qx + qy * qy + qz * qz < r * r;
}
function allTargets() {
  const out = [...fighters.filter(f => !(f.wt > 0)), ...asteroids];
  for (const s of ships) if (s.alive && !(s.wt > 0)) for (const p of s.all) if (p.alive) out.push(p);
  return out;
}
function damage(t, d) { if (t.hurt(d)) { t.die(); chain++; chainT = 160; bestChain = Math.max(bestChain, chain); const mul = chainMul(); P.score += scoreOf(t.pts * mul); P.credits += Math.ceil(t.pts / 10); if (t.kind === 'part' && t.part !== 'turret') hitStop = Math.max(hitStop, t.part === 'bridge' ? 10 : 5); }   /* 連続撃破で、得点が最大8倍 */ else { burst(t.p, 2, 4); if (t.kind === 'part' && t.part === 'bridge') SND.se('bossHit', t.p); } }
function updateCamera(dt) {   // カメラ(自機の向きに、少し遅れてついてくる)
  cam.yaw += angDiff(P.yaw - cam.yaw) * 0.11 * dt; cam.pitch += (P.pitch - cam.pitch) * 0.11 * dt;
  const cb0 = basisYP(cam.yaw, cam.pitch, 0), cb = basisYP(cam.yaw, cam.pitch - CAM_DOWN, 0);   // 位置は自機の向き基準、視線は少し下へ
  cam.f = cb.f; cam.r = cb.r; cam.u = cb.u;
  cam.p = vadd(vsub(P.p, vmul(cb0.f, CAM_BACK)), vmul(cb0.u, CAM_UP));
  if (cockpit) { const cbc = basisYP(P.yaw, P.pitch, P.roll); cam.f = cbc.f; cam.r = cbc.r; cam.u = cbc.u; cam.p = vadd(vadd(P.p, vmul(cbc.f, 30)), vmul(cbc.u, 6)); }   // 機首から見る
}
function step(dt) {
  if (state === 'over' && !paused) SND.update({ thrust: 0, alarm: false, bgm: 'gameover', intense: false });
  if (paused || state === 'over') return;
  if (mode === 'hangar' || mode === 'ending' || mode === 'clear' || mode === 'map') {
    curInp = readInput(); updateStage(dt);
    SND.update({ thrust: 0, alarm: false, bgm: bgmFor(false), intense: false });
    return;
  }
  simT += dt;
  const inp0 = readInput(); if (paused) return; curInp = inp0;
  const inp = (mode === 'hangar' || mode === 'ending') ? NEUTRAL : inp0;   // 格納庫の間は、操縦しない
  const inp2 = coop ? readInput2() : null; forPlayers((pl, k) => updatePlayer(dt, k ? inp2 : inp));
  updateStage(dt);
  if (mode !== 'fight' && mode !== 'warp') return;
  updateFlightTrails(dt);
  machineVolleyT -= dt; volley = false; if (machineVolleyT <= 0) { volley = true; machineVolleyT = 170; }   // マシン軍団の一斉射撃の合図
  for (const f of fighters) withNear(f.p, () => f.update(dt));
  for (const a of asteroids) a.update(dt);
  for (const a of allies) a.update(dt);
  for (const s of ships) withNear(s.p, () => s.update(dt));
  for (const s of allyShips) s.update(dt);
  if (mode === 'fight' && allies.length < 3) { allyT -= dt; if (allyT <= 0) { const bb = basisYP(P.yaw, P.pitch, 0); allies.push(new AllyFighter(vsub(P.p, vmul(bb.f, 900)))); allyT = 600; } }
  planetRot += 0.002 * dt;
  // カメラ(自機の向きに、少し遅れてついてくる)
  camStep(dt);
  // 星屑(速度感)
  for (const d of dust) for (let i = 0; i < 3; i++) { const q = d[i] - P.p[i]; if (q > DUST_BOX / 2) d[i] -= DUST_BOX; else if (q < -DUST_BOX / 2) d[i] += DUST_BOX; }

  const targets = allTargets();
  // 自機の光線
  for (let i = pbullets.length - 1; i >= 0; i--) {
    const b = pbullets[i]; b.pp = b.p; b.p = vadd(b.p, vmul(b.v, dt)); b.life -= dt;
    let hit = false;
    for (const t of (b.ally ? fighters : targets)) if (!t.dead && segSphere(b.pp, b.p, t.p, t.r + 8)) { knock(t, vmul(b.v, 0.02 * (b.dmg || 1))); withP(b.pl, () => damage(t, b.dmg || 1)); hit = true; break; }   // 弾が当たると、押される
    if (!hit && !b.ally) for (const sb of specialBullets) if (sb.owner === 'e' && sb.hp > 0 && segSphere(b.pp, b.p, sb.p, sb.radius + 8)) { sb.hp -= (b.dmg || 1); hit = true; if (sb.hp <= 0) { sb.life = 0; burst(sb.p, 6, 6, sb.color); } break; }   // 誘導弾・球は、撃ち落とせる
    if (!hit) for (const s of ships) { if (!s.alive || s.wt > 0) continue; for (const sp of s.spheres) if (segSphere(b.pp, b.p, sp.p, sp.r)) { hit = true; burst(b.p, 2, 3, [180, 200, 255]); break; } if (hit) break; }
    if (hit || b.life <= 0) pbullets.splice(i, 1);
  }
  // 敵弾(はね返した弾は、敵に当たる)
  for (let i = ebullets.length - 1; i >= 0; i--) {
    const b = ebullets[i]; b.pp = b.p; b.p = vadd(b.p, vmul(b.v, dt)); b.life -= dt;
    if (b.owner === 'r') { for (const t of targets) if (!t.dead && segSphere(b.pp, b.p, t.p, t.r + 10)) { damage(t, 2); b.life = 0; break; } }
    else forPlayers(() => { if (b.owner === 'e' && b.life > 0 && !P.dead && segSphere(b.pp, b.p, P.p, touchMode ? 20 : 26)) { if (P.rollT > 0) { b.owner = 'r'; b.v = vmul(b.v, -1.6); b.life = 90; } else { hurtPlayer(b.dmg, b.p); b.life = 0; } } });
    if (b.owner === 'e' && b.life > 0) for (const a of allies) if (segSphere(b.pp, b.p, a.p, a.r)) { a.hp--; burst(a.p, 3, 4, [80, 255, 120]); if (a.hp <= 0) a.die(); b.life = 0; break; }   // 味方機も撃たれる
    if (b.life <= 0 || vlen(vsub(b.p, P.p)) > 12000) ebullets.splice(i, 1);
  }
  // 誘導弾
  for (let i = missiles.length - 1; i >= 0; i--) {
    const m = missiles[i]; m.pp = m.p; m.life -= dt;
    const t = m.target;
    if (t && !t.dead && (t.kind !== 'part' || t.alive)) { const want = vmul(vnorm(vsub(t.p, m.p)), 50); m.v = vadd(m.v, vmul(vsub(want, m.v), 0.1 * dt)); }
    m.v = vadd(m.v, vmul(gravAt(m.p), dt)); m.p = vadd(m.p, vmul(m.v, dt));
    let done = false;
    if (t && !t.dead && segSphere(m.pp, m.p, t.p, t.r + 24)) { withP(m.pl, () => damage(t, 4)); done = true; }
    if (done || m.life <= 0) missiles.splice(i, 1);
  }
  // 接触
  forPlayers(() => { if (P.dead) return;
    for (const s of ships) if (s.alive && !(s.wt > 0)) for (const sp of s.spheres) {
      const d = vsub(P.p, sp.p), l = vlen(d);
      if (l < sp.r + 26) { const n = vnorm(d); P.p = vadd(sp.p, vmul(n, sp.r + 27)); const vn = dot(vsub(P.vel, s.v || [0, 0, 0]), n); if (vn < 0) { P.vel = vsub(P.vel, vmul(n, 1.4 * vn)); P.v = P.vel; hurtPlayer(Math.min(36, 5 - vn * 1.05)); SND.se('clang'); } }   // 艦に、はね返される(ぶつかった速さで、ダメージ)
    }
    for (const t of [...fighters, ...asteroids]) {
      if (t.dead || t.wt > 0) continue;
      if (vlen(vsub(P.p, t.p)) < t.r + (touchMode ? 18 : 24)) {
        if (t.kind === 'asteroid') { const vi = collidePlayer(t, touchMode ? 18 : 24); if (vi > 0.5) { SND.se('clang'); hurtPlayer(Math.min(32, 4 + vi * (t.indestructible ? 1.1 : 0.7))); if (!t.indestructible) damage(t, Math.max(0.5, vi * 0.4)); } }   // 岩には、質量に応じて、はね返される
        else if (P.rollT > 0) { knock(t, vmul(vnorm(vsub(t.p, P.p)), 14)); damage(t, 9); }
        else { hurtPlayer(t.dmg || 15, t.p); P.vel = vadd(P.vel, vmul(vsub(t.v, P.vel), 0.25 * massOf(t) / (massOf(t) + 1.6))); P.v = P.vel; damage(t, 99); }
      }
    }
  });
  updateSpecial(dt); updateCharges(dt); collideBodies(dt);
  for (const f of fences) { if (f.cd > 0) f.cd -= dt; forPlayers(() => { if (!P.dead && f.cd <= 0 && f.distTo(P.p) < 34) { hurtPlayer(20); f.cd = 45; } }); }   // 防衛レーザー網
  fighters = fighters.filter(f => !f.dead); asteroids = asteroids.filter(a => !a.dead); allies = allies.filter(a => !a.dead);
  for (let i = particles.length - 1; i >= 0; i--) {
    const q = particles[i]; q.p = vadd(q.p, vmul(q.v, dt)); q.v = vadd(q.v, vmul(gravAt(q.p), dt)); q.life -= dt;   // 空気抵抗は無い。重力で曲がり、回転し続ける
    if (q.wr) q.d = rotAxis(q.d, q.ax, q.wr * dt);
    if (q.life <= 0) particles.splice(i, 1);
  }
  for (let i = shockwaves.length - 1; i >= 0; i--) { const sw = shockwaves[i]; sw.r += (sw.max - sw.r) * 0.1 * dt; if (sw.r / sw.max > 0.98) shockwaves.splice(i, 1); }
  shake *= Math.pow(0.9, dt); flash *= Math.pow(0.9, dt); whiteFlash *= Math.pow(0.94, dt);
  let nearE = 0, nearShip = false;
  for (const f of fighters) if (f.type !== 'swarm' && !f.cloaked && vlen(vsub(f.p, P.p)) < 1300) nearE++;
  for (const sh of ships) if (sh.alive && vlen(vsub(sh.p, P.p)) < 4500) nearShip = true;
  if (nearE && !step.hadNear) SND.se('alert'); step.hadNear = nearE > 0;
  const bossOn = bossSpawned && bossShip && bossShip.alive, crowded = fighters.length >= 5 || nearShip;
  SND.update({ thrust: P.dead ? 0 : Math.min(1, P.speed / 32), alarm: !P.dead && P.shield < 0.2 * maxSh() && state === 'play',
    bgm: bgmFor(bossOn), intense: crowded, listener: cam });   /* 聞き手(カメラ)の位置と向き */   // ふだんは、その星系の勢力の曲
  if (chainT > 0) { chainT -= dt; if (chainT <= 0) chain = 0; }
  if (P.hitT > 0) P.hitT -= dt; if (announceT > 0) announceT -= dt; if (warningT > 0) warningT -= dt; if (phaseT > 0) phaseT -= dt;
  if (P.acidT > 0) { P.acidT -= dt; if (!god && !P.dead && P.invuln <= 0) { P.shield -= 0.06 * dt; if (P.shield <= 0) hurtPlayer(0.001); } }   // 腐食: シールドが、じわじわ削れる
  if (P.slowT > 0) P.slowT -= dt; if (P.confT > 0) P.confT -= dt;
}

// ---------- 描画 ----------
function drawStars() {
  noGlow(); let si = 0;
  for (const s of stars) {
    if (lite && (si++ & 1)) continue;
    const z = dot(s, cam.f); if (z < 0.05) continue;
    const x = CX + dot(s, cam.r) / z * F, y = CY - dot(s, cam.u) / z * F;
    if (x < 0 || x > W || y < 0 || y > H) continue;
    if (s[4]) stroke(90, 210, 255, 70 + s[3] * 110); else stroke(170, 200, 255, 80 + s[3] * 110);
    strokeWeight(s[3] > 0.6 ? 2 : 1); point(x, y);
  }
}
function drawDust() {
  noGlow(); const sp = P.v; let di = 0;
  for (const d of dust) {
    if (lite && (di++ & 1)) continue;
    const a = projW(d), b = projW(vsub(d, vmul(sp, 1.8))); if (!a || !b) continue;
    if (Math.hypot(a[0] - b[0], a[1] - b[1]) > 400) continue;
    stroke(120, 170, 220, Math.min(170, 30 + a[2] * 1500)); strokeWeight(1); line(a[0], a[1], b[0], b[1]);
  }
}
function drawPlanet() {
  const c = DEST, R = DEST_R, m = M.planet, cc = toCam(c[0], c[1], c[2]);
  if (cc[2] < 100) return;
  const d = vlen(vsub(cam.p, c)), tc = vnorm(vsub(cam.p, c)), lim = R / d, cy = Math.cos(planetRot), sy = Math.sin(planetRot);
  const pv = m.v.map((p, i) => {
    const dv = m.dir[i], rx = dv[0] * cy + dv[2] * sy, rz = -dv[0] * sy + dv[2] * cy;
    if (rx * tc[0] + dv[1] * tc[1] + rz * tc[2] < lim) return null;   // 裏側は描かない
    const x = p[0] * R, y = p[1] * R, z = p[2] * R;
    return projW([c[0] + x * cy + z * sy, c[1] + y, c[2] - x * sy + z * cy]);
  });
  const ctx = drawingContext, ctr = sc(cc), rs = F * R / Math.sqrt(Math.max(1, d * d - R * R));
  neon([40, 255, 140], 200, 22, 3.5); ellipse(ctr[0], ctr[1], rs * 2);   // 縁の光
  for (const kind of [0, 1]) {
    neon(kind ? [50, 200, 255] : [70, 255, 130], 200, 8, 1.3); ctx.beginPath();
    for (const [a, b, k] of m.e) { if (k !== kind) continue; const p = pv[a], q = pv[b]; if (p && q) { ctx.moveTo(p[0], p[1]); ctx.lineTo(q[0], q[1]); } }
    ctx.stroke();
  }
  noGlow();
}
function drawArena() {   // 空域の縁に近づくと、球の経緯線が見え始める
  const l = vlen(P.p), a = Math.max(0, (l - ARENA * 0.55) / (ARENA * 0.45));
  if (a > 0.02) drawEdgeMesh(M.arena, [0, 0, 0], ARENA, 0, [0, 200, 255], 30 + 150 * a, 6);
}
function playerFaces(out) {
  if (P.dead || cockpit) return;
  if (P.invuln > 0 && P.invuln < 300 && Math.floor(P.invuln / 6) % 2 === 0) return;   // 復活直後は点滅
  const hitCol = P.hitT > 0 && Math.floor(P.hitT / 3) % 2 === 0 ? C.shipHit : C.ship;
  const b = basisYP(P.yaw, P.pitch, P.roll), f = P.foldV, A = M.playerA.v, Bv = M.playerB.v;
  const mesh = { v: A.map((p, i) => { const q = Bv[i]; return [q[0] + (p[0] - q[0]) * f, q[1] + (p[1] - q[1]) * f, q[2] + (p[2] - q[2]) * f]; }), f: M.playerA.f };
  pushFaces(out, worldToCamAll(bakeMesh(mesh, P.p, b, 1)), mesh.f, hitCol);
  if (P.form === 'combat') for (const bp of bitPositions()) pushFaces(out, worldToCamAll(bakeMesh(M.bit, bp, b, 1)), M.bit.f, hitCol);
}
function drawPlayerFlame() {
  if (P.dead || cockpit) return;
  const b = basisYP(P.yaw, P.pitch, P.roll), fl = (P.boosting ? 60 : 26) + Math.random() * 14;
  for (const s of [-10, 10]) {
    const a = vadd(P.p, vadd(vmul(b.r, s * 0.8), vmul(b.f, -50))), c = vadd(a, vmul(b.f, -fl)), pa = projW(a), pc = projW(c);
    if (pa && pc) { neon(P.boosting ? [120, 200, 255] : [255, 170, 60], 240, 12, 3); line(pa[0], pa[1], pc[0], pc[1]); }
  }
  noGlow();
}
function drawObjects() {
  pickLineFighters();
  const items = [];
  const add = (o, rad, fn) => {
    const c = toCam(o.p[0], o.p[1], o.p[2]); if (c[2] + rad < 30 || c[2] > 15000) return;
    if (c[2] > 0) { const k = F / c[2]; if (Math.abs(c[0] * k) - rad * k > W || Math.abs(c[1] * k) - rad * k > H) return; }
    items.push({ z: c[2], fn });
  };
  for (const f of fighters) add(f, 120, z => { const l = []; f.faces(l); (z > 2600 || f.wt > 0) ? paintWire(l) : paintFaces(l); drawFighterLines(f, z); });
  for (const a of asteroids) add(a, a.r * 1.5, z => { const l = []; a.faces(l); z > 2600 + a.r ? paintWire(l) : paintFaces(l); });
  for (const f of fences) add(f, f.r, () => drawFence(f));
  for (const s of ships) add(s, s.hullR * (s.wt > 0 ? 3.5 : 1), z => { const l = []; s.faces(l, z); (z > 3600 * s.S || s.wt > 0) ? paintWire(l) : paintFaces(l); if (z < 9000 && !(s.wt > 0)) drawEngineGlow(s); drawCapitalAccents(s,z); });
  for (const s of allyShips) add(s, s.hullR * (s.wt > 0 ? 3.5 : 1), z => { const l = []; s.faces(l, z); (z > 3600 * s.S || s.wt > 0) ? paintWire(l) : paintFaces(l); if (z < 9000 && !(s.wt > 0)) drawEngineGlow(s); drawCapitalAccents(s,z); });
  for (const a of allies) add(a, 120, z => { const l = []; a.faces(l); z > 2600 ? paintWire(l) : paintFaces(l); });
  items.push({ z: CAM_BACK, fn: () => { const l = []; playerFaces(l); paintFaces(l); drawPlayerFlame(); } });
  items.sort((a, b) => b.z - a.z);
  for (const it of items) it.fn(it.z);
}
function drawEngineGlow(s) {
  if (!s.alive || s.variant === 'poly') return;
  const eng = s.engines || [[-90, 30, -775], [90, 30, -775], [-90, -50, -775], [90, -50, -775]];
  for (const [x, y, z] of eng) {
    const a = projW(s.toWorld([x * s.S, y * s.S, z * s.S])), b = projW(s.toWorld([x * s.S, y * s.S, (z - 110 - Math.random() * 30) * s.S]));
    if (a && b) { neon([255, 120, 60], 230, 12, 2.5); line(a[0], a[1], b[0], b[1]); }
  }
  noGlow();
}
function drawShots() {
  drawShockwaves(); drawSpecial(); drawWarpFx();
  for (const f of fighters) {   // 敵機の尾
    if (f.cloaked || f.speed === 0 || f.wt > 0) continue;
    const dv = vnorm(f.v), b0 = basisDir(dv, 0), ts = Math.max(0.4, f.r / 40);   // 小さい機体は、尾も短く細く
    for (const sd of [-14 * ts, 14 * ts]) {
      const t0 = vadd(f.p, vadd(vmul(b0.r, sd), vmul(dv, -50 * ts))), pa = projW(t0), pb = projW(vsub(t0, vmul(dv, 480 * ts)));
      if (pa && pb) { neon(f.col.rgb, 150, 6, 1.3); line(pa[0], pa[1], pb[0], pb[1]); }
    }
  }
  for (const al of allies) {   // 味方機の尾
    const dv = vnorm(al.v), b0 = basisDir(dv, 0);
    for (const sd of [-14, 14]) { const t0 = vadd(al.p, vadd(vmul(b0.r, sd), vmul(dv, -50))), pa = projW(t0), pb = projW(vsub(t0, vmul(dv, 420))); if (pa && pb) { neon([80, 255, 130], 150, 6, 1.3); line(pa[0], pa[1], pb[0], pb[1]); } }
  }
  for (const b of pbullets) {
    const a = projW(b.p), q = projW(vsub(b.p, vmul(vnorm(b.v), 70))); if (!a || !q) continue;
    if (b.wide) { neon([170, 225, 255], 255, 20, 7); line(q[0], q[1], a[0], a[1]); neon([255, 255, 255], 255, 8, 2.5); line(q[0], q[1], a[0], a[1]); }
    else if (b.ally) { neon([90, 255, 130], 255, 12, 3); line(q[0], q[1], a[0], a[1]); strokeWeight(6); point(a[0], a[1]); }
    else { neon([255, 225, 80], 255, 14, 3); line(q[0], q[1], a[0], a[1]); strokeWeight(7); point(a[0], a[1]); }
  }
  for (const b of ebullets) {
    const a = projW(b.p), q = projW(vsub(b.p, vmul(vnorm(b.v), b.big ? 160 : 90))); if (!a) continue;
    const col = b.owner === 'r' ? [0, 240, 255] : b.big ? [255, 70, 50] : [255, 150, 40];
    neon(col, 255, 14, b.big ? 4 : 2.5); if (q) line(q[0], q[1], a[0], a[1]);
    const s = Math.max(3, (b.big ? 20 : 10) * a[2]); line(a[0] - s, a[1], a[0], a[1] - s); line(a[0], a[1] - s, a[0] + s, a[1]); line(a[0] + s, a[1], a[0], a[1] + s); line(a[0], a[1] + s, a[0] - s, a[1]);
  }
  for (const m of missiles) {
    const a = projW(m.p), q = projW(vsub(m.p, vmul(vnorm(m.v), 60))); if (!a || !q) continue;
    neon([255, 255, 130], 255, 12, 3); line(q[0], q[1], a[0], a[1]);
  }
  for (const q of particles) {
    const a = projW(vsub(q.p, q.d)), b = projW(vadd(q.p, q.d)); if (!a || !b) continue;
    neon(q.col, 255 * Math.max(0, q.life / q.max), 6, 1.6); line(a[0], a[1], b[0], b[1]);
  }
  noGlow();
}
function drawReticle() {
  if (P.dead) return;
  const sp0 = vlen(P.vel);
  if (sp0 > 3) {   // 速度ベクトル: 実際に進んでいく向き(機首の向きと、ずれると分かる)
    const vp = projW(vadd(P.p, vmul(vnorm(P.vel), 1500)));
    if (vp) { neon([255, 200, 90], 200, lite ? 0 : 6, 1.4); const s = 9; line(vp[0] - s, vp[1], vp[0], vp[1] - s); line(vp[0], vp[1] - s, vp[0] + s, vp[1]); line(vp[0] + s, vp[1], vp[0], vp[1] + s); line(vp[0], vp[1] + s, vp[0] - s, vp[1]); line(vp[0], vp[1] - s, vp[0], vp[1] - s - 7); line(vp[0] - s, vp[1], vp[0] - s - 7, vp[1]); line(vp[0] + s, vp[1], vp[0] + s + 7, vp[1]); noGlow(); }
  }
  const b = basisYP(P.yaw, P.pitch, 0), locking = P.locks.length > 0, c = locking ? [255, 210, 0] : [0, 255, 140];
  const far = projW(vadd(P.p, vmul(b.f, 1500))), near = projW(vadd(P.p, vmul(b.f, 700)));
  if (!cockpit && far) {
    neon(c, 220, 8, 1.6); ellipse(far[0], far[1], 46);
    line(far[0] - 36, far[1], far[0] - 14, far[1]); line(far[0] + 14, far[1], far[0] + 36, far[1]); line(far[0], far[1] - 36, far[0], far[1] - 14); line(far[0], far[1] + 14, far[0], far[1] + 36);
  }
  if (!cockpit && near) { neon(c, 150, 6, 1.2); const s = 12; for (const [sx, sy] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) { line(near[0] + sx * s, near[1] + sy * s, near[0] + sx * s, near[1] + sy * (s - 6)); line(near[0] + sx * s, near[1] + sy * s, near[0] + sx * (s - 6), near[1] + sy * s); } }
  for (const t of P.locks) {
    const q = projW(t.p); if (!q) continue;
    const sz = Math.min(80, Math.max(18, t.r * q[2] * 1.3)), a = frameCount * 0.08;
    neon([255, 70, 70], 255, 8, 2); push(); translate(q[0], q[1]); rotate(a); rect(-sz, -sz, sz * 2, sz * 2); pop();
    line(q[0] - sz - 8, q[1], q[0] - sz + 6, q[1]); line(q[0] + sz - 6, q[1], q[0] + sz + 8, q[1]);
  }
  noGlow();
}
function drawWarpFX() {   // 虹色のリングのトンネル
  const ctx = drawingContext; ctx.save();
  for (let i = 0; i < 16; i++) {
    const u = ((i / 16) + modeT * 0.012) % 1, r = 24 + u * u * 1200, hue = (i * 26 + modeT * 3) % 360;
    ctx.shadowColor = `hsla(${hue},100%,60%,0.9)`; ctx.shadowBlur = 14;
    ctx.strokeStyle = `hsla(${hue},100%,${55 + u * 15}%,${0.95 - u * 0.3})`; ctx.lineWidth = 1 + u * 6;
    ctx.beginPath(); ctx.arc(CX, CY, r, 0, TWO_PI); ctx.stroke();
  }
  ctx.shadowBlur = 0; ctx.lineWidth = 1.2; ctx.strokeStyle = 'rgba(60,255,150,0.45)';
  for (let i = 0; i < 24; i++) { const a = i * TWO_PI / 24; ctx.beginPath(); ctx.moveTo(CX + Math.cos(a) * 30, CY + Math.sin(a) * 30); ctx.lineTo(CX + Math.cos(a) * 1300, CY + Math.sin(a) * 1300); ctx.stroke(); }
  for (let i = 0; i < 70; i++) {   // 流れる光の筋
    const a = i * 0.9 + 0.3, r0 = 50 + ((modeT * 16 + i * 53) % 700), r1 = r0 + 60 + (i % 6) * 25, hue = (i * 47 + modeT * 5) % 360;
    ctx.strokeStyle = `hsla(${hue},100%,70%,0.75)`; ctx.lineWidth = 1.6;
    ctx.beginPath(); ctx.moveTo(CX + Math.cos(a) * r0, CY + Math.sin(a) * r0); ctx.lineTo(CX + Math.cos(a) * r1, CY + Math.sin(a) * r1); ctx.stroke();
  }
  ctx.restore();
  centerText('WARP', CY - 150, 72, [80, 255, 150]);
}
function drawScene() {
  push();
  if (shake > 0.3) translate(random(-shake, shake), random(-shake, shake));
  background(2, 5, 12);
  drawDeepSpace();
  drawStars(); drawPlanet(); drawDust();
  drawFlightTrails();
  drawObjects();
  drawShots(); drawWeakPoints(); drawReticle();
  if (mode === 'warp') drawWarpFX();
  if (cockpit) drawCockpit();
  pop();
  noGlow();
  if (flash > 0.05) { noStroke(); fill(255, 40, 40, 90 * flash); rect(0, 0, W, H); }
  if (P.hitT > 0) {   // 被弾のグリッチ
    noStroke();
    for (let i = 0; i < 2; i++) { fill(255, 60, 60, 35); rect(random(-8, 8), random(H), W, random(2, 5)); fill(80, 255, 255, 22); rect(random(-8, 8), random(H), W, 2); }
  }
  if (whiteFlash > 0.02) { noStroke(); fill(255, 255, 255, 255 * whiteFlash); rect(0, 0, W, H); }
  if (state !== 'title') { drawFlightHUD(); if (state === 'play' && mode === 'fight' && !paused) drawTouchUI(); }
  drawCRT();
  if (window.innerHeight > window.innerWidth * 1.1 && Math.floor(frameCount / 40) % 2 === 0) { noStroke(); fill(255, 220, 120); textAlign(CENTER, CENTER); textSize(22); text('ROTATE YOUR DEVICE (LANDSCAPE)', W / 2, H * 0.3); }   // 縦向きの案内
  if (state === 'title' && !SND.running && !SND.muted && Math.floor(frameCount / 40) % 2 === 0) { noStroke(); fill(255, 220, 120); textAlign(CENTER, TOP); textSize(13); text('PRESS ANY KEY TO ENABLE SOUND  (M: MUTE)', W / 2, H - 22); }
}

// ---------- HUD ----------
function centerText(str, y, size, col, glow = true) {
  textAlign(CENTER, CENTER); textSize(size);
  if (glow) { drawingContext.shadowColor = `rgba(${col[0]},${col[1]},${col[2]},0.9)`; drawingContext.shadowBlur = lite ? 0 : 20; }
  noStroke(); fill(...col); text(str, W / 2, y); noGlow();
}
function bar(x, y, w, h, frac, col, label) {
  stroke(...HUDC); strokeWeight(1.5); noFill(); rect(x, y, w, h);
  noStroke(); fill(...col); rect(x + 2, y + 2, Math.max(0, (w - 4) * frac), h - 4);
  if (label) { fill(...HUDC); textAlign(RIGHT, CENTER); textSize(14); text(label, x - 8, y + h / 2); }
}
function drawRadar() {   // 自機を中心に、前方が上。目的地の惑星は、範囲外なら縁に矢印で示す
  const cx = W / 2, cy = H - 92, RNG = 9000, kx = 128 / RNG, ky = 58 / RNG;
  noGlow(); fill(0, 14, 28, 205); neon([60, 150, 255], 230, 8, 1.6); rect(cx - 150, cy - 74, 300, 152, 3); noGlow();
  noStroke(); fill(0, 14, 28); rect(cx - 112, cy - 84, 224, 18);
  fill(90, 230, 255); textAlign(CENTER, CENTER); textSize(12); text('OMNI-DIRECTIONAL RADAR', cx, cy - 76);
  noFill(); stroke(60, 255, 140, 70); strokeWeight(1); for (const k of [0.33, 0.66, 1]) ellipse(cx, cy, 256 * k, 116 * k); line(cx - 128, cy, cx + 128, cy); line(cx, cy - 58, cx, cy + 58);
  const b = basisYP(P.yaw, P.pitch, 0), rel = p => { const d = vsub(p, P.p); return [dot(d, b.r), dot(d, b.u), dot(d, b.f)]; };
  const blip = (p, col, size, sq) => {
    const q = rel(p), x = cx + q[0] * kx, y = cy - q[2] * ky, h = q[1] * ky * 0.6;
    if (Math.abs(x - cx) > 142 || Math.abs(y - cy) > 66) return;
    stroke(col[0], col[1], col[2], 90); strokeWeight(1); line(x, y, x, y - h);
    noStroke(); fill(...col); if (sq) rect(x - size, y - size - h, size * 2, size * 2); else ellipse(x, y - h, size * 2);
  };
  for (const s of ships) if (s.alive) blip(s.p, [255, 80, 80], 4, true);
  for (const f of fighters) if (!f.cloaked) blip(f.p, f.col.rgb, 2.2, false);
  for (const a of allies) blip(a.p, [80, 255, 130], 2.2, false);
  for (const sh of allyShips) blip(sh.p, [80, 255, 130], 4, true);
  // 目的地の惑星
  const q = rel(DEST); let vx = q[0] * kx, vy = -q[2] * ky; const out = Math.abs(vx) > 136 || Math.abs(vy) > 62;
  if (out) { const sc2 = Math.min(136 / (Math.abs(vx) || 1e-6), 62 / (Math.abs(vy) || 1e-6)); vx *= sc2; vy *= sc2; }
  neon([60, 255, 140], 255, 8, 1.6); noFill(); ellipse(cx + vx, cy + vy, 16); ellipse(cx + vx, cy + vy, 6); noGlow();
  noStroke(); fill(90, 255, 130); textAlign(CENTER, CENTER); textSize(10); text('DEST', cx + vx, cy + vy + (vy > 40 ? -14 : 14));
  noStroke(); fill(255); triangle(cx, cy - 7, cx - 5, cy + 5, cx + 5, cy + 5);   // 自機
}
function drawHUD() {
  noGlow(); noStroke();
  // 左上: SCORE / LEVEL
  hudPanel(22, 14, 252, 70, true);
  textAlign(LEFT, TOP); textSize(22);
  fill(255, 90, 90); text('SCORE:', 38, 22); fill(90, 255, 130); text(String(P.score).padStart(6, '0'), 130, 22);
  fill(70, 190, 255); text('LEVEL', 38, 50); fill(90, 255, 130); text(String(stage).padStart(2, '0'), 130, 50);
  textSize(13); fill(...HUDC, 170); text('SPEED  ' + Math.round(P.speed * 40) + ' km/h', 28, 94); text('ALT    ' + Math.round(P.p[1]), 28, 110);
  fill(255, 230, 120); text('MODE  ' + (P.form === 'combat' ? '[> COMBAT <]  CRUISE' : ' COMBAT  [> CRUISE <]'), 28, 126);
  if (P.form === 'combat') { fill(...HUDC, 170); text('BITS   ACTIVE', 28, 142); }
  if (P.locks.length) { fill(255, 210, 0); text('LOCK ' + P.locks.length + '/' + lockMax(), 28, 158); }
  fill(255, 220, 90); textAlign(RIGHT, TOP); textSize(12); text('CREDITS  ' + P.credits, W - 22, 118); textAlign(LEFT, TOP); textSize(16);
  if (P.acidT > 0) { fill(110, 255, 90); text('ACID  CORROSION', 28, 176); }
  if (P.slowT > 0) { fill(90, 220, 60); text('PARASITE  SLOWED', 28, 192); }
  if (P.confT > 0) { fill(230, 90, 255); text('CHAOS  CONTROLS INVERTED', 28, 208); }
  // 上中央: 惑星名とステージ
  textAlign(CENTER, TOP); textSize(34); drawingContext.shadowColor = 'rgba(60,255,140,0.9)'; drawingContext.shadowBlur = 14;
  fill(90, 255, 130); text('PLANET ' + sectorName(), W / 2, 10); noGlow();
  const done = ships.filter(s => !s.alive).length;
  textSize(16); fill(255, 90, 90); text('STAGE ' + stage + '-' + String.fromCharCode(65 + Math.min(25, enc)), W / 2, 52);
  textSize(13); fill(90, 255, 130, 190);
  text('DESTINATION  ' + (vlen(vsub(DEST, P.p)) / 1000).toFixed(1) + 'k    ENEMY ' + (ships.filter(s => s.alive).length + fighters.length) + '    ALLIES ' + allies.length, W / 2, 74);
  // 右上: LIVES / SHIELDS
  { const fc = FACTIONS[stageFaction()]; textAlign(CENTER, TOP); textSize(12); fill(fc.rgb[0], fc.rgb[1], fc.rgb[2]); text('CONTROLLED BY  ' + fc.name, W / 2, 108); }   // この星系を支配する勢力
  hudPanel(W - 274, 14, 252, 70, false);
  textAlign(LEFT, TOP); textSize(20); fill(255, 90, 90); text('LIVES:', W - 256, 22);
  for (let i = 0; i < P.lives; i++) {
    push(); translate(W - 150 + i * 30, 34); scale(0.24, 0.24); noFill(); neon([90, 170, 255], 255, 5, 4);
    beginShape(); vertex(0, -60); vertex(-74, 30); vertex(-14, 14); vertex(-14, 42); vertex(14, 42); vertex(14, 14); vertex(74, 30); endShape(CLOSE); pop(); noGlow();
  }
  const sh = Math.max(0, P.shield) / maxSh() * 100, n = Math.round(sh / 12.5);
  textSize(16); noStroke(); fill(70, 190, 255); text('SHIELDS:', W - 256, 54);
  fill(sh > 50 ? color(90, 255, 130) : sh > 25 ? color(255, 190, 0) : color(255, 60, 60)); text('[' + '='.repeat(n) + ' '.repeat(8 - n) + ']' + Math.round(sh) + '%', W - 176, 54);
  noFill(); stroke(...HUDC, 200); strokeWeight(1); rect(W - 256, 92, 214, 7); noStroke(); fill(80, 180, 255); rect(W - 255, 93, 212 * Math.min(1, P.boost / boostMax()), 5);
  fill(...HUDC, 170); textAlign(RIGHT, CENTER); textSize(11); text('BOOST', W - 262, 96);
  noFill(); stroke(...HUDC, 200); strokeWeight(1); rect(W - 256, 104, 214, 7); noStroke(); fill(255, 220, 120); rect(W - 255, 105, 212 * P.energy / 100, 5);
  fill(...HUDC, 170); textAlign(RIGHT, CENTER); textSize(11); text('SPECIAL', W - 262, 108);
  if (P.warn && Math.floor(frameCount / 12) % 2 === 0) centerText('WARNING  LEAVING COMBAT AREA', CY - 200, 22, [255, 80, 80]);
  const sb = ships.find(s => s.alive && s.gensAlive() > 0 && vlen(vsub(s.p, P.p)) < 3500);
  if (sb) { textAlign(CENTER, BOTTOM); textSize(13); fill(255, 70, 220, 210); text('DESTROY THE SHIELD GENERATORS TO EXPOSE THE BRIDGE', W / 2, H - 200); }
  if (announceT > 0) { textAlign(CENTER, TOP); textSize(18); fill(255, 240, 120, Math.min(255, announceT * 4)); text('>> ' + announceName() + TR(' 出現', ' DETECTED'), W / 2, 128); }
  {   // 道のり(遭遇の位置に印)と、惑星
    const dd = vlen(vsub(DEST, P.p)), prog = Math.max(0, Math.min(1, 1 - dd / destDist0)), x0 = W / 2 - 150;
    noFill(); stroke(90, 255, 130, 150); strokeWeight(1); rect(x0, 92, 300, 6); noStroke(); fill(90, 255, 130, 210); rect(x0, 92, 300 * prog, 6);
    fill(255, 90, 90); for (const e of ENC_AT) rect(x0 + 300 * e - 1, 88, 2, 14);
    noFill(); neon([60, 255, 140], 220, 6, 1.4); ellipse(x0 + 312, 95, 16); noGlow();
  }
  if (warningT > 0 && Math.floor(frameCount / 8) % 2 === 0) {   // WARNING メッセージ
    noStroke(); fill(60, 0, 0, 160); rect(W / 2 - 250, CY - 150, 500, 120, 8);
    centerText('WARNING', CY - 112, 60, [255, 60, 60]); centerText(bossShip && bossShip.def ? bossShip.def.name.replace('_', ' ') : 'BOSS APPROACHING', CY - 62, 22, [255, 120, 120]);
  }
  if (bossSpawned && bossShip && bossShip.alive && bossShip.def) {   // ボスの体力(発生器と艦橋の残り)
    const b = bossShip, fr = b.critFrac(), fc = FACTIONS[b.faction].rgb, w = 420, x0 = W / 2 - w / 2;
    noStroke(); fill(0, 0, 0, 150); rect(x0 - 6, 146, w + 12, 30, 4);
    fill(fc[0], fc[1], fc[2], 210); rect(x0, 164, w * fr, 8);
    noFill(); stroke(fc[0], fc[1], fc[2]); strokeWeight(1); rect(x0, 164, w, 8);
    noStroke(); textAlign(CENTER, TOP); textSize(12); fill(255, 225, 225); text(b.def.name.replace('_', ' ') + '    PHASE ' + (b.phase + 1) + '/3', W / 2, 149);
  }
  if (phaseT > 0 && Math.floor(frameCount / 6) % 2 === 0) centerText(phaseTxt, CY - 100, 46, [255, 200, 80]);
  drawRadar();
  if (mode === 'hangar') drawHangar(); if (mode === 'ending') drawEnding();
  if (mode === 'clear') { centerText('STAGE CLEAR', CY - 80, 60, [90, 255, 130]); centerText('SHIELD BONUS  ' + Math.round(P.shield * 10), CY - 20, 22, HUDC); centerText('DESTROYED  ' + P.kills, CY + 14, 22, [90, 255, 130]); }
}

// ---------- 入力 ----------
function readInput() {
  if (demo) return botInput();
  const inv = invertY ? -1 : 1;
  const r = {
    mx: (keyIsDown(RIGHT_ARROW) ? 1 : 0) - (keyIsDown(LEFT_ARROW) ? 1 : 0),
    my: ((keyIsDown(UP_ARROW) ? 1 : 0) - (keyIsDown(DOWN_ARROW) ? 1 : 0)) * inv,
    fire: keyIsDown(32), lock: keyIsDown(88), boost: keyIsDown(SHIFT), brake: keyIsDown(90),
    roll: pulse.roll, release: pulse.release, uturn: pulse.uturn, wide: pulse.wide, form: pulse.form,
  };
  const g = readGamepad(p1PadSlot()), tc = readTouch();   // ゲームパッドとタッチも、キーボードと同時に使える
  r.mx = Math.max(-1, Math.min(1, r.mx + g.mx + tc.mx)); r.my = Math.max(-1, Math.min(1, r.my + (g.my + tc.my) * inv));
  r.fire = r.fire || g.fire || tc.fire; r.lock = r.lock || g.lock || tc.lock; r.boost = r.boost || g.boost || tc.boost; r.brake = r.brake || g.brake || tc.brake;
  r.release = r.release || g.release || tc.release; r.wide = r.wide || g.wide || tc.wide; r.form = r.form || g.form || tc.form; r.uturn = r.uturn || g.uturn || tc.uturn; r.roll = r.roll || g.roll || tc.roll;
  if (g.start && state === 'play' && mode === 'fight') togglePause();
  r.launch = pulse.launch || !!g.start; pulse.launch = false;
  pulse.roll = 0; pulse.release = false; pulse.uturn = false; pulse.wide = false; pulse.form = false;
  return r;
}
let botLockPrev = false;
function botInput() {
  const r = { mx: 0, my: 0, fire: false, lock: false, boost: false, brake: false, roll: 0, release: false, uturn: false, wide: false, form: false };
  if (mode !== 'fight' || P.dead) return r;
  const b = basisYP(P.yaw, P.pitch, 0);
  // 目標: 近くの戦闘機。なければ戦艦(発生器 → 艦橋 → 砲塔の順)
  let tgt = null, bd = 1e9;
  for (const f of fighters) { const d = vlen(vsub(f.p, P.p)); if (d < 2500 && d < bd) { bd = d; tgt = f; } }
  if (!tgt) {
    let ns = null, nd = 1e9;
    for (const s of ships) if (s.alive) { const d = vlen(vsub(s.p, P.p)); if (d < nd) { nd = d; ns = s; } }
    if (ns && (nd < 4200 || ns === bossShip)) { const cand = ns.gensAlive() ? ns.gens.filter(g => g.alive) : ns.bridge.exposed ? [ns.bridge] : ns.parts.filter(p => p.alive); for (const p of cand) { const d = vlen(vsub(p.p, P.p)); if (d < bd) { bd = d; tgt = p; } } }
  }
  if (!tgt) tgt = { p: DEST, kind: 'dest' };   // 敵がいなければ、目的地へ
  if (tgt) {
    const d = vsub(tgt.p, P.p), l = vnorm(d);
    const wy = Math.atan2(l[0], l[2]), wp = Math.asin(l[1]), ey = angDiff(wy - P.yaw), ep = wp - P.pitch;
    r.mx = ey > 0.03 ? 1 : ey < -0.03 ? -1 : 0; r.my = ep > 0.03 ? 1 : ep < -0.03 ? -1 : 0;
    r.fire = tgt.kind !== 'dest' && Math.abs(ey) < 0.09 && Math.abs(ep) < 0.09 && vlen(d) < 3000;
    if (tgt.kind === 'dest') r.boost = vlen(d) > 5000 && Math.abs(ey) < 0.3;
    if (Math.abs(ey) > 2.4) r.uturn = simT % 200 < 2;
  }
  // 船体・小惑星を避ける
  for (const s of ships) if (s.alive) for (const sp of s.spheres) {
    const d = vsub(sp.p, P.p), l = vlen(d);
    if (l < sp.r + 420 && dot(vnorm(d), b.f) > 0.3) { r.my = 1; r.mx = dot(d, b.r) > 0 ? -1 : 1; }
  }
  for (const a of asteroids) { const d = vsub(a.p, P.p), l = vlen(d); if (l < a.r + 260 && dot(vnorm(d), b.f) > 0.5) { r.my = -1; r.mx = 1; } }
  r.lock = simT % 320 < 70; r.release = botLockPrev && !r.lock; botLockPrev = r.lock;
  if (Math.floor(simT) % 520 === 0 && P.rollT <= 0) r.roll = 1;
  return r;
}
function keyPressed(event) {
  if (isShowroom || !document.getElementById('help-screen').hidden || !document.getElementById('install-screen').hidden || !document.getElementById('settings-screen').hidden) return;
  if (event && event.target && /^(BUTTON|INPUT|SELECT|TEXTAREA)$/.test(event.target.tagName)) return;
  if (keyCode === 27 || keyCode === 80) { if (!event || !event.repeat) togglePause(); return false; }
  if (paused) return false;
  if (event && event.repeat && [67,70,73,76,77,81,69,86,66].includes(keyCode)) return false;
  SND.resume();
  if (keyCode === 77) { SND.toggle(); return false; }   // M: 音のオン・オフ
  if (keyCode === ENTER) pulse.launch = true;
  if (keyCode === 67 && state === 'title' && saveData) { continueGame(); return false; }   // C: 続きから(タイトル)
  if (keyCode === 71) { P.fa = !P.fa; SND.se('tick'); return false; }   // G: 姿勢制御(FA)のオン・オフ
  if (keyCode === 76) { lite = !lite; return false; }    // L: 軽量モードの切替
  if ((keyCode === ENTER || keyCode === 32) && (state === 'title' || state === 'over')) { startGame(); return false; }
  if (keyCode === 81) pulse.roll = -1;           // Q
  if (keyCode === 69) pulse.roll = 1;            // E
  if (keyCode === 86) pulse.uturn = true;        // V
  if (keyCode === 73) invertY = !invertY;        // I
  if (keyCode === 67) cockpit = !cockpit;        // C
  if (keyCode === 66) pulse.wide = true;         // B(ワイド兵装)
  if (keyCode === 70) pulse.form = true;         // F(変形: 戦闘/巡航)
  if (keyCode === LEFT_ARROW || keyCode === RIGHT_ARROW) {
    const d = keyCode === LEFT_ARROW ? -1 : 1, now = millis();
    if (now - lastTap[d] < 260) { pulse.roll = d; lastTap[d] = -1e9; } else lastTap[d] = now;
  }
  if ([32, LEFT_ARROW, RIGHT_ARROW, UP_ARROW, DOWN_ARROW].includes(keyCode)) return false;
}
function keyReleased() { if (keyCode === 88) pulse.release = true; }

// ---------- 全体 ----------
function saveRank(score) {   // 上位5件を、ブラウザに保存する
  try {
    const rk = diffRankKey(), a = JSON.parse(localStorage.getItem(rk) || '[]'); a.push(score); a.sort((x, y) => y - x);
    const top = a.slice(0, 5); localStorage.setItem(rk, JSON.stringify(top)); return top;
  } catch (e) { return [score]; }
}
function announceName() { const a = assetManager.getAssetInfo(announceId); return a ? TR(a.name, ASSET_EN[announceId] || a.name) : ''; }   // 敵・障害物の名前(表示のたびに、いまの言語で)
function announce(id) {   // 初めて出る敵・障害物の名前を、アセット定義から引いて知らせる
  if (seen.has(id)) return; seen.add(id);
  const a = assetManager.getAssetInfo(id); if (a) { announceTxt = a.name; announceId = id; announceT = 220; }
}
function newGame() {
  rankSaved = false; seen.clear(); announceT = 0; whiteFlash = 0;
  P = newPlayer(); stage = 1; simT = 0; shake = 0; flash = 0; campaign = { node: CAMP.start, path: [], loop: 0 };
  resetForStage();
  flightTrails = [];
  cam.p = vadd(vsub(P.p, [0, 0, CAM_BACK]), [0, CAM_UP, 0]);   // 開始時のカメラ位置
}
function setup() {
  const surface = createCanvas(W, H); if (document.getElementById('game-stage')) surface.parent('game-stage'); frameRate(60); textFont('monospace');
  pixelDensity(isTouchDev ? 1 : Math.min(2, window.devicePixelRatio || 1));   // iPad の高解像度(2倍)は、画素が4倍になり重すぎるので、1倍にする
  fitCanvas();
  for (const ev of ['touchend', 'pointerup', 'click', 'keydown', 'mousedown']) window.addEventListener(ev, () => { if (!paused) SND.resume(); }, { passive: true });   // iOS は、touchend か click でないと音が解除されない
  document.addEventListener('gesturestart', e => e.preventDefault());   // ピンチ拡大を防ぐ
  window.addEventListener('orientationchange', () => setTimeout(fitCanvas, 250));
  if (window.visualViewport) window.visualViewport.addEventListener('resize', fitCanvas);
  initMeshes();
  for (let i = 0; i < STAR_N; i++) { const d = randDir(); stars.push([d[0], d[1], d[2], Math.random()]); }
  for (let c = 0; c < 5; c++) { const d0 = randDir(); for (let i = 0; i < 70; i++) { const d = vnorm(vadd(d0, vmul(randDir(), rnd(0, 0.22)))); stars.push([d[0], d[1], d[2], Math.random(), 1]); } }   // 水色の星の集まり
  for (let i = 0; i < DUST_N; i++) dust.push([rnd(-DUST_BOX / 2, DUST_BOX / 2), rnd(-DUST_BOX / 2, DUST_BOX / 2), rnd(-DUST_BOX / 2, DUST_BOX / 2)]);
  saveData = loadSave();
  newGame();
  const stg = /stage=(\d+)/.exec(location.hash), ndm = /node=(\w+)/.exec(location.hash); if (ndm && CAMP.nodes[ndm[1]]) { campaign.node = ndm[1]; stage = curNode().depth; resetForStage(); } else if (stg) { stage = +stg[1]; campaign.node = nodeAtDepth(stage).id; resetForStage(); }   // 確認用: #node=z3 / #stage=20
  if (location.hash.includes('look')) P.p = vmul(travelDir, destDist0 * ENC_AT[0] - 300);   // 確認用: 最初の遭遇の直前から
  if (location.hash.includes('boss')) { P.p = vsub(DEST, vmul(travelDir, 9600)); enc = ENC_AT.length; }   // 確認用: ボスの直前から(道中の遭遇は省く)
  if (location.hash.includes('cockpit')) cockpit = true;
  if (location.hash.includes('cruise')) { P.form = 'cruise'; P.foldV = 0; }
  const bxm = /bx=(\w+)/.exec(location.hash), bxd = bxm && BOSS_LIST.find(d => d.name === bxm[1]);
  if (bxd) {   // 確認用: ボスを1体、斜めから見る(例 #bx=VOID_GOD,still)
    fighters = []; ships = []; allies = []; allyShips = []; asteroids = []; P.yaw = P.pitch = cam.yaw = cam.pitch = 0;
    const R = bxd.shape === 'poly' ? 560 * bxd.S : ShipFactory.bossDesign(bxd).hullR * SHIP_CLS[bxd.shape].S * bxd.S;
    const zb0 = /zoom=([\d.]+)/.exec(location.hash); bossShip = new BossShip([0, R * 0.32, R * (zb0 ? +zb0[1] : 1.6)], Math.PI - 0.6, bxd); ships.push(bossShip); bossSpawned = true;
  }
  const wpm = /warp=([\d.]+)/.exec(location.hash);   // 確認用: #warp=0.5 で、ワープインの途中(0〜1)で止める
  if (wpm && ships[0]) { startWarp(ships[0], 110, FACTIONS[ships[0].faction].rgb); ships[0].wt = ships[0].wdur * (1 - +wpm[1]); }
  const shp = /ship=(\w+):(\w+):?(\d*)/.exec(location.hash);
  if (shp && SHIP_CLS[shp[2]]) {   // 確認用: 大型艦を1隻、斜めから見る(例 #ship=empire:carrier:1,still)
    fighters = []; ships = []; allies = []; allyShips = []; asteroids = []; P.yaw = P.pitch = cam.yaw = cam.pitch = 0; shipSeed = +shp[3] || 0;
    const R = 900 * SHIP_CLS[shp[2]].S;
    const zm = /zoom=([\d.]+)/.exec(location.hash); ships.push(makeShip(shp[2], [0, R * 0.32, R * (zm ? +zm[1] : 1.45)], Math.PI - 0.6)); shipSeed = 0;
    if (wpm) { startWarp(ships[0], 110, FACTIONS[ships[0].faction].rgb); ships[0].wt = ships[0].wdur * (1 - +wpm[1]); }
  }
  const gal = /gallery=(\w+)/.exec(location.hash);
  if (gal && FACTIONS[gal[1]]) {   // 確認用: その勢力の全18設計(戦闘機10・空母機4・ドローン4)を、格子に並べる
    fighters = []; ships = []; allies = []; allyShips = []; asteroids = []; P.yaw = P.pitch = cam.yaw = cam.pitch = 0;
    const list = [...EnemyFactory.catalog[gal[1]].fighter, ...EnemyFactory.catalog[gal[1]].carrier, ...EnemyFactory.catalog[gal[1]].drone], cb = basisYP(P.yaw, P.pitch, 0);
    list.forEach((dz, i) => {
      const gx = (i % 6 - 2.5) * 190, gy = 170 - Math.floor(i / 6) * 130;
      const f = new Fighter(vadd(P.p, vadd(vmul(cb.f, 820), vadd(vmul(cb.r, gx), vmul(cb.u, gy)))), 'chaser', gal[1], { design: dz });
      f.v = vmul(vnorm(vadd(vadd(vmul(cb.r, -0.55), vmul(cb.u, -0.4)), vmul(cb.f, -0.75))), 1); f.speed = 0; f.turn = 0; fighters.push(f);
    });
    location.hash.includes('still') || (state = 'play');
  }
  if (location.hash.includes('showroom')) { state = 'play'; god = true; }
  if (location.hash.includes('hangar')) { P.credits = 3000; P.up.shield = 2; P.up.bits = 1; mode = 'hangar'; modeT = 40; state = 'play'; }   // 確認用: 格納庫から
  if (location.hash.includes('galaxymap')) { campaign = { node: 'p4', path: ['p0', 'p1', 'p2', 'p3'], loop: 0 }; stage = 5; P.credits = 400; mode = 'map'; modeT = 40; state = 'play'; }   // 確認用: 星図(第1分岐)
  if (location.hash.includes('mapdeep')) { campaign = { node: 'j1', path: ['p0', 'p1', 'p2', 'p3', 'p4', 'b0', 'b1', 'b2', 'b3', 'b4', 'b5', 'h1', 'i0', 'i1', 'i2', 'i3', 'e0', 'e1', 'e2', 'e3', 'e4', 'e5', 'h2', 'j0'], loop: 0 }; stage = 25; mode = 'map'; modeT = 40; state = 'play'; }   // 確認用: 星図(第3分岐)
  if (location.hash.includes('ending')) { stage = 20; P.credits = 500; mode = 'ending'; modeT = 40; state = 'play'; }   // 確認用: エンディングから
  demo = location.hash.startsWith('#demo'); god = location.hash.includes('god');
  if (demo) state = 'play';
  if (location.hash.includes('sndtest')) {   // 確認用: すべての効果音とBGMを鳴らして、エラーが出ないか見る(要: --autoplay-policy=no-user-gesture-required)
    SND.resume();
    const names = ['shotB', 'shotC', 'formC', 'formB', 'lock', 'missile', 'hit', 'playerBoom', 'eshot', 'cannon', 'boomS', 'boomM', 'ping', 'alert', 'clang', 'kin', 'warning', 'coreOpen', 'bossHit', 'bossBoom1', 'bossBoom2', 'warpCharge', 'warpJump', 'coin', 'tick', 'ok'];
    let n = 0;
    const tick = () => { SND.se(names[n % names.length]); SND.update({ thrust: 1, alarm: true, bgm: ['title', 'cruise', 'fleet', 'boss', 'empire', 'machine', 'bio', 'ancient', 'void', 'final_boss'][Math.floor(n / 8) % 10], intense: n % 16 < 8 }); n++; if (n < 90) setTimeout(tick, 60); else document.title = 'sndtest ok running=' + SND.running + ' n=' + n + ' errors=' + SND.errors; };
    setTimeout(tick, 200);
  }
  if (location.hash.includes('bgmtest')) {   // 確認用: 各BGMを1.5秒ずつ鳴らして、出力の大きさ(RMS)をタイトルに出す(要: --autoplay-policy=no-user-gesture-required)
    SND.resume(); const names = SND.tracks, out = {}; let k = 0, pk = 0;
    const poll = () => { const an = SND.analyser; if (an) { const a = new Uint8Array(an.fftSize); an.getByteTimeDomainData(a); let sum = 0; for (const v of a) sum += (v - 128) * (v - 128); pk = Math.max(pk, Math.sqrt(sum / a.length)); } };
    const run = () => { if (k >= names.length) { document.title = 'bgmtest ' + JSON.stringify(out) + ' errors=' + SND.errors; return; } SND.update({ thrust: 0, bgm: names[k], intense: k % 2 === 1 }); let n = 0; const iv = setInterval(() => { SND.update({ thrust: 0, bgm: names[k], intense: k % 2 === 1 }); poll(); if (++n > 40) { clearInterval(iv); out[names[k]] = +pk.toFixed(1); pk = 0; k++; run(); } }, 40); };
    setTimeout(run, 300);
  }
  const sim = /sim=(\d+)/.exec(location.hash);
  if (demo && sim) {
    for (let i = 0; i < +sim[1]; i++) { if (god) P.invuln = 999; step(1); if (i === 5 && location.hash.includes('killall')) for (const sh of ships) if (sh.alive) sh.bridge.die(); }
    const t0 = performance.now(); for (let i = 0; i < 20; i++) drawScene(); perf.ms = (performance.now() - t0) / 20;
    if (location.hash.includes('prof')) {   // 確認用: 描画の内訳(ms/フレーム)
      const T = (fn) => { const t = performance.now(); for (let i = 0; i < 10; i++) fn(); return +((performance.now() - t) / 10).toFixed(1); };
      perf.prof = { stars: T(drawStars), planet: T(drawPlanet), arena: T(drawArena), dust: T(drawDust), objects: T(drawObjects), shots: T(drawShots), hud: T(drawHUD), crt: T(drawCRT) };
    }
    document.title = JSON.stringify({ state, mode, stage, score: P.score, lives: P.lives, shield: Math.round(P.shield), ships: ships.filter(s => s.alive).length, fighters: fighters.length, sb: specialBullets.length, ch: charges.length, particles: particles.length, drawMs: +perf.ms.toFixed(1), prof: perf.prof, pos: P.p.map(Math.round) });
  }
}
function draw() {
  if (isShowroom) { drawShowroom(); syncAppUI(); return; }
  let dt = Math.min(deltaTime / (1000 / 60), 3);
  if (hitStop > 0) { hitStop--; dt *= 0.1; }   // 大きな部位を壊した瞬間の、ほんの一瞬の停止(手ごたえ)
  if (paused) { const pad = readGamepad(); if (pad.start) togglePause(); syncAppUI(); return; }
  fpsAvg += (deltaTime - fpsAvg) * 0.05; if (!lite && ++fpsN > 120 && fpsAvg > 34) lite = true;   // 重い端末は、自動で軽量モードへ
  if (location.hash.includes('still')) { drawScene(); syncAppUI(); return; }   // 確認用: sim の結果をそのまま表示する
  if (state !== 'play') { const g0 = readGamepad(); if (g0.start) { startGame(); return; } }   // ゲームパッドの Start / A で開始
  if (state === 'title') { demo = true; step(dt); if (P.lives < DF().lives) newGame(); drawScene(); syncAppUI(); return; }
  step(dt); drawScene(); syncAppUI();
  if (state === 'over') {
    if (!rankSaved) { ranking = saveRank(P.score); rankSaved = true; }
    noStroke(); fill(0, 0, 0, 190); rect(0, H / 2 - 190, W, 380);
    centerText('GAME OVER', H / 2 - 145, 60, [255, 70, 80]);
    centerText('SCORE ' + String(P.score).padStart(6, '0') + '   STAGE ' + stage, H / 2 - 88, 24, HUDC);
    centerText('RANKING  [' + DF().en.toUpperCase() + ']', H / 2 - 50, 26, [255, 200, 60]);
    const mine = ranking.indexOf(P.score);
    ranking.forEach((r, i) => centerText((i + 1) + '.  PLAYER  ' + String(r).padStart(6, '0'), H / 2 - 12 + i * 32, 22, i === mine ? [255, 255, 120] : [90, 255, 130]));
    if (Math.floor(frameCount / 30) % 2 === 0) centerText('PRESS SPACE', H / 2 + 165, 18, HUDC);
  }
}

// ---------- コンセプト画像に寄せた表示 ----------
function drawCockpit() {
  const ctx = drawingContext; noGlow();
  neon([60, 160, 255], 220, 10, 2.5);
  ctx.beginPath(); ctx.moveTo(300, 130); ctx.lineTo(980, 130); ctx.lineTo(1030, 480); ctx.lineTo(250, 480); ctx.closePath(); ctx.stroke();
  line(0, 40, 300, 130); line(W, 40, 980, 130); line(0, 330, 250, 480); line(W, 330, 1030, 480);
  line(0, H - 250, 200, H - 200); line(W, H - 250, W - 200, H - 200); line(200, H - 200, 250, 480); line(W - 200, H - 200, 1030, 480);
  for (const sd of [-1, 1]) {   // 左右の主翼と噴射
    const x0 = sd < 0 ? 0 : W, dx = -sd;
    neon([200, 230, 255], 230, 10, 2);
    ctx.beginPath(); ctx.moveTo(x0, H - 190); ctx.lineTo(x0 + dx * 220, H - 215); ctx.lineTo(x0 + dx * 330, H - 190); ctx.lineTo(x0 + dx * 300, H - 150); ctx.lineTo(x0 + dx * 120, H - 100); ctx.lineTo(x0, H - 90); ctx.stroke();
    neon([190, 80, 255], 230, 16, 4); line(x0, H - 110, x0 + dx * 120, H - 125); line(x0, H - 132, x0 + dx * 90, H - 140);
  }
  // 姿勢計(人工水平儀): 機体のピッチとロールに連動。水平線は、機体が傾くと反対に傾き、機首を上げると下がる
  push(); translate(CX, CY); rotate(P.roll);
  neon([0, 255, 180], 190, 8, 1.4);
  const y0 = F * Math.tan(Math.max(-1.2, Math.min(1.2, P.pitch)));
  if (Math.abs(y0) < 330) { line(-300, y0, -70, y0); line(70, y0, 300, y0); }
  for (let a = -60; a <= 60; a += 15) {   // ピッチ目盛り(15度ごと)
    if (a === 0) continue;
    const ang = a * PI / 180 - P.pitch; if (Math.abs(ang) > 1.2) continue;
    const y = -F * Math.tan(ang); if (Math.abs(y) > 300) continue;
    const dir = a > 0 ? 6 : -6;
    line(-46, y, -14, y); line(14, y, 46, y); line(-46, y, -46, y + dir); line(46, y, 46, y + dir);
    noStroke(); fill(0, 255, 180, 190); textAlign(CENTER, CENTER); textSize(10); text(Math.abs(a), -62, y); text(Math.abs(a), 62, y);
    neon([0, 255, 180], 190, 8, 1.4);
  }
  pop();
  neon([255, 210, 0], 255, 10, 2); line(CX - 15, CY, CX - 5, CY); line(CX + 5, CY, CX + 15, CY); line(CX, CY - 15, CX, CY - 5); line(CX, CY + 5, CX, CY + 15);   // 固定の照準
  // 下のコンソール
  neon([60, 255, 130], 230, 10, 1.8); noFill(); rect(150, H - 138, 300, 98, 3); noGlow();
  noStroke(); fill(90, 255, 140); textAlign(LEFT, CENTER); textSize(15);
  text(P.locks.length ? 'TARGETING ACTIVE' : 'TARGETING STANDBY', 166, H - 118); text('WEAPONS  ' + P.form.toUpperCase(), 166, H - 96);
  text('PITCH ' + String(Math.round(P.pitch * 180 / PI)).padStart(3, ' ') + '   ROLL ' + String(Math.round(angDiff(P.roll) * 180 / PI)).padStart(4, ' '), 166, H - 74); text('THRUST ' + Math.round(P.speed * 40) + ' km/h', 166, H - 52);
}
let crtPat = null;
function drawCRT() {   // ブラウン管風: 周辺を暗く、走査線
  const ctx = drawingContext; ctx.save(); ctx.shadowBlur = 0;
  const g = ctx.createRadialGradient(CX, H / 2, H * 0.45, CX, H / 2, W * 0.62);
  g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(0,0,0,0.55)'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  if (!crtPat) { const c = document.createElement('canvas'); c.width = 4; c.height = 3; const x = c.getContext('2d'); x.fillStyle = 'rgba(0,0,0,0.13)'; x.fillRect(0, 2, 4, 1); crtPat = ctx.createPattern(c, 'repeat'); }
  ctx.fillStyle = crtPat; ctx.fillRect(0, 0, W, H); ctx.restore();
}
function hudPanel(x, y, w, h, left) {   // 斜めに切った青い枠
  fill(0, 18, 36, 200); neon([60, 150, 255], 230, 8, 1.6);
  const pts = left ? [[x, y], [x + w, y], [x + w - 18, y + h], [x, y + h]] : [[x + 18, y], [x + w, y], [x + w, y + h], [x, y + h]];
  beginShape(); for (const p of pts) vertex(p[0], p[1]); endShape(CLOSE); noGlow();
}

function fitCanvas() {   // CSS の aspect-ratio に頼らず、画面に合わせて 16:9 の大きさを計算する(古い iPadOS でも動く)
  const c = document.querySelector('canvas'); if (!c) return;
  const area = document.getElementById('game-stage');
  const vw = area ? area.clientWidth : window.innerWidth, vh = area ? area.clientHeight : window.innerHeight, k = Math.min(vw / W, vh / H);
  c.style.width = Math.floor(W * k) + 'px'; c.style.height = Math.floor(H * k) + 'px';
}
function windowResized() { fitCanvas(); }
function startGame() { SND.resume(); SND.se('coin'); demo = false; paused = false; newGame(); P.invuln = 180; state = 'play'; clearFlightInput(); syncAppUI(); }

// ---------- ゲームパッド(Gamepad API) ----------
const gpPrev = {};
const gpPrevs = [{}, {}];
function padList() { return navigator.getGamepads ? Array.from(navigator.getGamepads()).filter(p => p && p.connected) : []; }
function readGamepad(slot = 0) {
  const r = { mx: 0, my: 0, fire: false, lock: false, boost: false, brake: false, wide: false, form: false, release: false, roll: 0, uturn: false, start: false };
  const pads = navigator.getGamepads ? Array.from(navigator.getGamepads()) : [];
  const gp = slot >= 0 ? padList()[slot] : null, gpPrev = gpPrevs[slot] || (gpPrevs[slot] = {});
  if (!gp) return r;
  const dz = v => Math.abs(v) < 0.18 ? 0 : v, B = i => !!(gp.buttons[i] && gp.buttons[i].pressed);
  const edge = (k, i) => { const now = B(i); const e = now && !gpPrev[k]; gpPrev[k] = now; return e; };
  r.mx = dz(gp.axes[0] || 0); r.my = -dz(gp.axes[1] || 0);       // 左スティック: 旋回と上昇下降
  r.fire = B(0) || B(5);                                       // A / R1: 射撃
  const lockNow = B(1) || B(4); r.lock = lockNow; r.release = !!gpPrev.lock && !lockNow; gpPrev.lock = lockNow;   // B / L1: ロックオン(離すと誘導弾)
  r.boost = B(7) || (gp.buttons[7] && gp.buttons[7].value > 0.5); r.brake = B(6);   // R2: ブースト、L2: ブレーキ
  r.form = edge('y', 3); r.wide = edge('x', 2); r.uturn = edge('r3', 11) || edge('dd', 13);   // Y: 変形、X: ワイド、R3か十字の下: Uターン
  const rx = gp.axes[2] || 0; if (Math.abs(rx) > 0.85 && !gpPrev.roll) { r.roll = Math.sign(rx); gpPrev.roll = true; } if (Math.abs(rx) < 0.4) gpPrev.roll = false;   // 右スティックを左右に弾く: バレルロール
  const startEdge = edge('start', 9), aEdge = edge('a2', 0);
  r.start = startEdge || (state !== 'play' && aEdge);
  return r;
}

// ---------- タッチ(iPhone・Android): 左に仮想スティック、右にボタン ----------
let touchMode = isTouchDev || location.hash.includes('touch'), stickId = null, stickOrg = null, stickPos = null, touchPrev = {}, touchHeld = {};
const TBTN = {
  shot: { x: 1170, y: 565, r: 65, label: 'FIRE' }, lock: { x: 1020, y: 595, r: 58, label: 'LOCK' },
  wide: { x: 1165, y: 402, r: 44, label: 'WIDE' }, form: { x: 1035, y: 455, r: 44, label: 'FORM' }, boost: { x: 900, y: 467, r: 44, label: 'BOOST' },
  rollL: { x: 73, y: 355, r: 44, label: 'ROLL L' }, rollR: { x: 190, y: 355, r: 44, label: 'ROLL R' },
  uturn: { x: 308, y: 355, r: 44, label: 'U-TURN' }, brake: { x: 330, y: 620, r: 44, label: 'BRAKE' }
};
function readTouch() {
  const r = { mx: 0, my: 0, fire: false, lock: false, boost: false, wide: false, form: false, release: false };
  if (!touchMode) return r;
  const held = {}; let seen = false;
  for (const t of touches) {
    if (t.id === stickId && stickOrg) {
      seen = true; const dx = t.x - stickOrg.x, dy = t.y - stickOrg.y, len = Math.hypot(dx, dy), a = Math.atan2(dy, dx), m = Math.min(1, len / 80);
      stickPos = { x: stickOrg.x + Math.cos(a) * Math.min(80, len), y: stickOrg.y + Math.sin(a) * Math.min(80, len) };
      r.mx = Math.cos(a) * m; r.my = -Math.sin(a) * m; continue;
    }
    for (const k in TBTN) if (Math.hypot(t.x - TBTN[k].x, t.y - TBTN[k].y) < TBTN[k].r * 1.15) held[k] = true;
  }
  if (!seen) { stickId = null; stickPos = null; }
  r.roll = held.rollL && !touchPrev.rollL ? -1 : held.rollR && !touchPrev.rollR ? 1 : 0;
  r.uturn = !!held.uturn && !touchPrev.uturn; r.brake = !!held.brake;
  r.fire = !!held.shot; r.lock = !!held.lock; r.boost = !!held.boost;
  r.wide = !!held.wide && !touchPrev.wide; r.form = !!held.form && !touchPrev.form; r.release = !!touchPrev.lock && !held.lock;
  touchPrev = held; touchHeld = held;
  return r;
}
function touchStarted(event) {
  if (event && event.target && event.target.closest && event.target.closest('#app-ui, #toolbar, #shipyard-ui')) return;
  if (paused) return false;
  SND.resume(); touchMode = true;
  for (const t of touches) if (stickId === null && t.x < W * 0.42 && t.y > H * 0.3 && !Object.values(TBTN).some(b => Math.hypot(t.x - b.x, t.y - b.y) < b.r * 1.15)) { stickId = t.id; stickOrg = { x: t.x, y: t.y }; stickPos = { x: t.x, y: t.y }; }
  if (state === 'play' && (mode === 'hangar' || mode === 'ending')) { const t = touches[touches.length - 1]; if (t && hangarTap(t)) return false; }

  if (state === 'over') startGame();
  return false;
}
function mousePressed(event) { if (paused || (event && event.target && event.target.closest && event.target.closest('#app-ui, #toolbar'))) return; if (!touchMode) { SND.resume(); if (state === 'play' && (mode === 'hangar' || mode === 'ending')) hangarTap({ x: mouseX, y: mouseY }); } }
// 画面のボタン(出撃・設定など)の上では、既定の動作を止めない(止めると iPhone でタップがクリックにならず、ボタンが押せない)
function onAppUI(event) { return !!(event && event.target && event.target.closest && event.target.closest('#app-ui, #toolbar, #shipyard-ui')); }
function touchEnded(event) { SND.resume(); if (onAppUI(event)) return; return false; }
function touchMoved(event) { if (onAppUI(event)) return; return false; }
function drawTouchUI() {
  if (!touchMode && !location.hash.includes('touch')) return;
  const o = stickOrg || { x: 170, y: H - 150 }, k = stickPos || o;
  noFill(); neon([90, 210, 255], 130, 8, 2); ellipse(o.x, o.y, 160); ellipse(o.x, o.y, 60);
  neon([90, 210, 255], stickPos ? 230 : 120, 10, 3); ellipse(k.x, k.y, 64);
  for (const key in TBTN) {
    const b = TBTN[key], on = touchHeld[key];
    neon(key === 'shot' ? [255, 225, 80] : key === 'lock' ? [255, 90, 90] : [90, 210, 255], on ? 255 : 130, on ? 14 : 8, on ? 3.5 : 2); noFill(); ellipse(b.x, b.y, b.r * 2);
    noGlow(); noStroke(); fill(255, on ? 240 : 150); textAlign(CENTER, CENTER); textSize(key === 'shot' ? 18 : 13); text(b.label, b.x, b.y);
  }
  noGlow();
}
