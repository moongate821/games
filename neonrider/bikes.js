// bikes.js — 選べるマシン(資料「NR-X Series Vehicle Specs.pdf」の4台 + 隠しの1台)。性能・色・形
// stat: top 最高速 / acc 加速 / grip 旋回 / weight 重さ(ぶつかり合いの強さ) / heat 耐熱(ブーストを長く使える) / boost ブーストの強さ(1 が基準)
const BIKES = [
  { id: 'kai', no: 'NR-01', name: 'KAI', cls: 'HIGH-SPEED ASSAULT / AKIRA-STYLE', mesh: 'kai', stat: { top: 1.0, acc: 1.08, grip: 1.0, weight: 1.0, heat: 1.0, boost: 1.0 }, awd: true,
    spec: [['全長', '2947 mm'], ['全幅', '831 mm'], ['シート高', '340 mm'], ['エンジン', 'CERAMIC TWIN ROTOR'], ['出力', '12000 RPM / 200 PS'], ['駆動', 'AWD(超電導モーター)'], ['タイヤ', '18in F / 19in R']],
    desc: '前衛的な流線型の赤いフェアリング。低く伏せた姿勢と、セラミック・ツインローターの爆発的な加速。', special: '全輪駆動: 発進とコーナーの立ち上がりが強い',
    col: [255, 45, 60], trail: [255, 30, 50], hi: [255, 180, 170], pal: null },
  { id: 'arc', no: 'NR-02', name: 'ARCADE', cls: 'LIGHT-GRID INTERCEPTOR / TRON-STYLE', mesh: 'arc', stat: { top: 1.02, acc: 1.0, grip: 1.22, weight: 0.75, heat: 0.95, boost: 1.0 }, sharp: true, trailLen: 1.6,
    spec: [['全長', '2550 mm'], ['全幅', '650 mm'], ['シート高', '450 mm'], ['エンジン', 'QUANTUM ELECTRIC MOTOR'], ['出力', '15000 RPM / 250 PS相当'], ['駆動', 'Direct Magnetic Hub Drive'], ['タイヤ', 'HUBLESS MAG-DRIVE']],
    desc: '電子空間から実体化したような、無駄のない車体とハブレスホイール。フォトン・エミッターが青白い軌跡を残す。', special: '磁気駆動: 直角に近い鋭いターン(軽いので当たり負けする)',
    col: [60, 230, 255], trail: [40, 210, 255], hi: [200, 255, 255], tailCol: [80, 230, 255], pal: { body: [24, 43, 55], jacket: [20, 22, 30], helmet: [20, 34, 44], jacketLine: [80, 230, 255], edge: [90, 230, 255] } },
  { id: 'nst', no: 'NR-03', name: 'NEO-STREET', cls: 'HEAVY TACTICAL BRUISER / CYBER-PUNK', mesh: 'nst', stat: { top: 0.96, acc: 1.15, grip: 0.92, weight: 1.6, heat: 1.35, boost: 0.95 }, runflat: true,
    spec: [['全長', '2700 mm'], ['全幅', '900 mm'], ['シート高', '750 mm'], ['エンジン', 'DUAL TURBINE HYBRID'], ['出力', '10000 RPM / 320 PS'], ['駆動', 'Chain Drive / Torque Vectoring'], ['タイヤ', '20in ALL-TERRAIN FAT(ランフラット)']],
    desc: '瓦礫を走破する無骨な重装甲。デュアルタービンの暴力的なトルク。マットブラックの装甲にオレンジのネオン管。', special: '重装甲: 体当たりに強く、壁や段差で減速しにくい',
    col: [255, 150, 40], trail: [255, 120, 30], hi: [255, 220, 170], tailCol: [255, 140, 30], pal: { body: [51, 53, 57], jacket: [35, 39, 47], helmet: [35, 39, 47], jacketLine: [255, 150, 40], edge: [255, 150, 40], decal2: [255, 140, 30] } },
  { id: 'ngt', no: 'NR-04', name: 'NIGHT-RUNNER', cls: 'MAG-LEV SPEEDSTER / HOVER-CAR', mesh: 'ngt', stat: { top: 1.1, acc: 0.93, grip: 0.96, weight: 1.15, heat: 0.85, boost: 1.3 }, hover: true,
    spec: [['全長', '3200 mm'], ['全幅', '1100 mm'], ['シート高', 'COCKPIT ENCLOSED'], ['エンジン', 'ANTI-GRAVITY REPULSOR'], ['出力', 'THRUST 15,000 kN / MACH 0.8'], ['駆動', 'Magnetic Levitation'], ['タイヤ', 'NONE(浮上)']],
    desc: 'タイヤのない反重力マグレブ。偏光色に輝く流線形の密閉コックピット。ブースト時には音速に迫る。', special: '浮上走行: 最高速とブーストが強い(熱に弱い)',
    col: [190, 90, 255], trail: [160, 80, 255], hi: [220, 200, 255], tailCol: [200, 110, 255], iri: [[60, 255, 170], [190, 70, 255]], pal: { body: [120, 150, 200], edge: [200, 160, 255] } },
  { id: 'kmi', no: 'NR-00', name: 'KAMUI', cls: 'SEALED PROTOTYPE', mesh: 'kmi', hidden: true, stat: { top: 1.2, acc: 1.35, grip: 1.28, weight: 1.4, heat: 1.7, boost: 1.3 }, awd: true, trailLen: 1.4,
    spec: [['全長', '3010 mm'], ['全幅', '860 mm'], ['シート高', '330 mm'], ['エンジン', 'SEALED SINGULARITY CORE'], ['出力', 'UNKNOWN'], ['駆動', 'AWD'], ['タイヤ', '19in F / 19in R']],
    desc: '封印された原型機。すべての性能が桁外れ。', special: 'すべての性能が最高水準',
    col: [255, 215, 90], trail: [255, 225, 130], hi: [255, 255, 220], tailCol: [255, 250, 200], pal: { body: [232, 180, 50], bodyDark: [117, 86, 24], jacket: [240, 240, 246], jacketLine: [255, 240, 200], decal: [255, 255, 255], decal2: [60, 40, 20], edge: [255, 240, 180] } },
];
const bikeById = id => BIKES.find(b => b.id === id) || BIKES[0];
let hiddenUnlocked = false;
try { hiddenUnlocked = localStorage.getItem('nr_unlock') === '1'; } catch (_) {}
const bikeList = () => BIKES.filter(b => !b.hidden || hiddenUnlocked);
function unlockHidden(why) {
  if (hiddenUnlocked) return false;
  hiddenUnlocked = true; try { localStorage.setItem('nr_unlock', '1'); } catch (_) {}
  SND.se('power'); whiteFlash = 0.6;
  return true;
}
// 敵(AI)のマシンの色違い
const AI_PALS = {
  kai: [{ body: [30, 90, 220], jacket: [40, 60, 180], jacketLine: [120, 170, 255] }, { body: [230, 230, 235], jacket: [60, 60, 70] }, { body: [40, 180, 90], jacket: [30, 120, 60] }],
  arc: [{ body: [16, 18, 26], jacket: [20, 22, 30], jacketLine: [255, 140, 30], edge: [255, 150, 40] }, { body: [16, 18, 26], jacket: [20, 22, 30], jacketLine: [255, 60, 200], edge: [255, 80, 200] }],
  nst: [{ body: [36, 36, 40], jacket: [40, 38, 36], jacketLine: [80, 255, 120], edge: [80, 255, 120] }, { body: [60, 20, 20], jacket: [40, 30, 30], jacketLine: [255, 60, 60], edge: [255, 60, 60] }],
  ngt: [{ body: [120, 150, 200], edge: [255, 200, 120] }, { body: [120, 150, 200], edge: [120, 255, 255] }],
};
const AI_IRI = [[[255, 200, 80], [255, 60, 120]], [[80, 200, 255], [120, 255, 160]]];
const AI_GLOW = { arc: [[255, 150, 40], [255, 80, 200]], nst: [[80, 255, 120], [255, 60, 60]] };

// 断面をつないだ丸い車体(金田型と同じ作り方)。STA: [z, 下端y, 上端y, 半幅]。visor: [z0, z1] の上側を黒いキャノピーにする
function stationBody(m, STA, visor, NR, stepZ, visFrac) {
  const sec = z => { if (z <= STA[0][0]) return STA[0]; if (z >= STA[STA.length - 1][0]) return STA[STA.length - 1]; let i = 0; while (STA[i + 1][0] < z) i++; const t = (z - STA[i][0]) / (STA[i + 1][0] - STA[i][0]); return [z, lerp(STA[i][1], STA[i + 1][1], t), lerp(STA[i][2], STA[i + 1][2], t), lerp(STA[i][3], STA[i + 1][3], t)]; };
  const z0 = STA[0][0], z1 = STA[STA.length - 1][0], st = []; for (let z = z0; z < z1; z += stepZ) st.push(z); st.push(z1);
  const b0 = m.v.length, vf = visFrac || 0.3;
  for (const z of st) { const s = sec(z); for (let j = 0; j < NR; j++) { const [x, y] = ringPt(s, j / NR * Math.PI * 2); addV(m, x, y, z); } }
  for (let i = 0; i < st.length - 1; i++) for (let j = 0; j < NR; j++) {
    const a = b0 + i * NR + j, c = b0 + i * NR + (j + 1) % NR, zc = (st[i] + st[i + 1]) / 2, yc = (m.v[a][1] + m.v[c][1]) / 2, s = sec(zc);
    const top = yc > s[2] - (s[2] - s[1]) * vf, under = yc < s[1] + (s[2] - s[1]) * 0.12;
    m.f.push({ i: [a, c, c + NR, a + NR], k: visor && top && zc > visor[0] && zc < visor[1] ? 'visor' : under ? 'under' : 'body' });
  }
  m.f.push({ i: Array.from({ length: NR }, (_, j) => b0 + (NR - 1 - j)), k: 'body' });
  m.f.push({ i: Array.from({ length: NR }, (_, j) => b0 + (st.length - 1) * NR + j), k: 'body' });
  return (z, y) => { const s = sec(z), mid = (s[1] + s[2]) / 2, hh = (s[2] - s[1]) / 2, u = clamp(Math.abs(y - mid) / hh, 0, 1); return s[3] * Math.pow(Math.max(0, 1 - Math.pow(u, 1 / 0.8)), 0.72) + 2; };
}
function addRingWheel(m, x0, cy, cz, rO, rI, w, n, glowK) {   // 中が空いた輪の車輪(外周・内周・両側の面)と、光る縁
  const b = m.v.length;
  for (let i = 0; i < n; i++) { const a = i / n * Math.PI * 2, c = Math.cos(a), s = Math.sin(a); for (const [r, x] of [[rO, -w / 2], [rO, w / 2], [rI, w / 2], [rI, -w / 2]]) addV(m, x0 + x, cy + s * r, cz + c * r); }
  for (let i = 0; i < n; i++) { const j = (i + 1) % n, A = b + i * 4, B = b + j * 4; m.f.push({ i: [A, B, B + 1, A + 1], k: 'tire' }); m.f.push({ i: [A + 1, B + 1, B + 2, A + 2], k: 'tire' }); m.f.push({ i: [A + 2, B + 2, B + 3, A + 3], k: 'tire' }); m.f.push({ i: [A + 3, B + 3, B, A], k: 'tire' }); }
  for (const sd of [-1, 1]) { const g = m.v.length, rm = (rO + rI) / 2; for (let i = 0; i < n; i++) { const a = i / n * Math.PI * 2; addV(m, x0 + sd * (w / 2 + 2), cy + Math.sin(a) * rm, cz + Math.cos(a) * rm); } for (let i = 0; i < n; i++) m.l.push([g + i, g + (i + 1) % n, glowK || 'glow']); }
}
function addCylZ(m, cx, cy, z0, z1, r, n, k) {   // z 方向の円柱(タービン)
  const b = m.v.length;
  for (const z of [z0, z1]) for (let i = 0; i < n; i++) { const a = i / n * Math.PI * 2; addV(m, cx + Math.cos(a) * r, cy + Math.sin(a) * r, z); }
  for (let i = 0; i < n; i++) { const j = (i + 1) % n; m.f.push({ i: [b + i, b + j, b + n + j, b + n + i], k }); }
  m.f.push({ i: Array.from({ length: n }, (_, i) => b + n - 1 - i), k }); m.f.push({ i: Array.from({ length: n }, (_, i) => b + n + i), k: 'intake' });
  const g = m.v.length; for (let i = 0; i < n; i++) { const a = i / n * Math.PI * 2; addV(m, cx + Math.cos(a) * r * 0.7, cy + Math.sin(a) * r * 0.7, z1 + 2); } for (let i = 0; i < n; i++) m.l.push([g + i, g + (i + 1) % n, 'glow']);
}
function sideGlow(m, bx, y, z0, z1, step) { for (const s of [-1, 1]) for (let z = z0; z < z1; z += step) addLine(m, [s * (bx(z, y) + 3), y, z], [s * (bx(Math.min(z1, z + step), y) + 3), y, Math.min(z1, z + step)], 'glow'); }

// ---------- NR-02 ARCADE: 光のバイク(大きな空洞の車輪、低く黒い車体、伏せた乗り手) ----------
function makeARC() {
  const m = Mesh();
  addRingWheel(m, 0, 128, -236, 128, 86, 70, 20);
  addRingWheel(m, 0, 128, 236, 128, 86, 70, 20);
  const STA = [[-300, 118, 196, 30], [-230, 96, 226, 58], [-120, 86, 214, 60], [0, 82, 204, 56], [110, 88, 222, 60], [210, 100, 238, 62], [300, 124, 206, 34]];
  const bx = stationBody(m, STA, null, 12, 34);
  sideGlow(m, bx, 180, -290, 290, 40); sideGlow(m, bx, 120, -220, 220, 55);
  for (const s of [-1, 1]) {
    addLine(m, [s * 70, 215, -190], [s * 72, 216, 190], 'glow');
    addBox(m, s * 77, 115, -10, 16, 32, 125, 'chrome');
  }
  addBlob(m, 0, 244, -70, 50, 26, 90, 'jacket', 4, 12);            // 伏せた乗り手(黒いスーツ)
  addBlob(m, 0, 262, 60, 32, 30, 36, 'helmet', 4, 12);
  addBlob(m, 0, 264, 86, 24, 10, 10, 'visor', 2, 10);
  for (const s of [-1, 1]) { addLine(m, [s * 42, 250, 0], [s * 50, 232, 120], 'jacket'); addLine(m, [s * 40, 236, -120], [s * 60, 196, -200], 'jacket'); }
  { const q = m.v.length; for (const [x, y] of [[-18, 150], [18, 150], [18, 180], [-18, 180]]) addV(m, x, y, -302); m.f.push({ i: [q, q + 1, q + 2, q + 3], k: 'tail' }); }
  addBlob(m, 0, 170, 302, 12, 12, 4, 'head', 2, 10);
  return m;
}
// ---------- NR-03 NEO-STREET: 重装甲(角ばった黒い装甲、デュアルタービン、太いタイヤとオレンジのネオン) ----------
function makeNST() {
  const m = Mesh();
  addWheel(m, 0, 100, -250, 100, 128, 14, false, true);
  addWheel(m, 0, 100, 262, 100, 118, 14, false, true);
  for (const [z, r] of [[-250, 100], [262, 100]]) for (const s of [-1, 1]) { const g = m.v.length, n = 14; for (let i = 0; i < n; i++) { const a = i / n * Math.PI * 2; addV(m, s * 66, 100 + Math.sin(a) * r * 0.74, z + Math.cos(a) * r * 0.74); } for (let i = 0; i < n; i++) m.l.push([g + i, g + (i + 1) % n, 'glow']); }
  addBox(m, 0, 70, 20, 130, 110, 230, 'under');                    // 骨組みとエンジン
  addLoft(m, [[-60, 160], [-40, 240], [150, 250], [220, 210], [230, 150], [120, 140]], [170, 176, 180, 170, 150, 150], 0);   // 装甲タンク
  addLoft(m, [[200, 150], [220, 250], [330, 240], [360, 170], [330, 120]], [160, 170, 150, 130, 120], 0);   // 前の装甲
  addBox(m, 0, 176, -150, 150, 40, 170, 'seat');
  addLoft(m, [[-330, 150], [-320, 230], [-200, 236], [-170, 170]], [150, 150, 150, 140], 0);   // 後ろの装甲
  for (const s of [-1, 1]) addCylZ(m, s * 64, 290, -300, -110, 46, 12, 'body');   // デュアルタービン
  for (const s of [-1, 1]) { addLine(m, [s * 92, 200, -300], [s * 92, 210, 340], 'glow'); addLine(m, [s * 86, 150, -60], [s * 84, 150, 330], 'glow'); }
  for (const s of [-1, 1]) {
    addBox(m, s * 92, 168, -230, 26, 44, 130, 'chrome');
    addLine(m, [s * 111, 231, -313], [s * 111, 231, -180], 'glow');
    addLine(m, [s * 90, 253, 200], [s * 56, 243, 340], 'chrome');
  }
  addBox(m, 0, 238, 330, 120, 16, 20, 'head');
  { const q = m.v.length; for (const [x, y] of [[-60, 190], [60, 190], [60, 206], [-60, 206]]) addV(m, x, y, -334); m.f.push({ i: [q, q + 1, q + 2, q + 3], k: 'tail' }); }
  // 乗り手: 前傾した装甲服
  addBlob(m, 0, 290, -100, 62, 60, 52, 'jacket', 4, 12);
  addBlob(m, 0, 372, -40, 38, 38, 42, 'helmet', 4, 12);
  addBlob(m, 0, 374, -8, 28, 12, 10, 'visor', 2, 10);
  for (const s of [-1, 1]) { addLine(m, [s * 58, 320, -70], [s * 90, 300, 180], 'jacket'); addLine(m, [s * 52, 240, -110], [s * 92, 180, -20], 'jeans'); addLine(m, [s * 92, 180, -20], [s * 92, 120, 0], 'jeans'); }
  return m;
}
// ---------- NR-04 NIGHT-RUNNER: 浮上するマグレブ車(タイヤなし、偏光色の流線形、密閉キャノピー、下の反重力の光) ----------
function makeNGT() {
  const m = Mesh(), lift = 60;
  const STA = [[-404, 44, 118, 40], [-350, 32, 158, 110], [-230, 28, 182, 134], [-90, 30, 214, 138], [40, 32, 236, 134], [160, 30, 222, 128], [280, 32, 170, 108], [360, 38, 120, 78], [406, 46, 84, 26]];
  const bx = stationBody(m, STA, [-150, 230], 16, 32, 0.38);
  for (const v of m.v) v[1] += lift;
  const bxl = (z, y) => bx(z, y - lift);
  for (const s of [-1, 1]) {   // 後ろの羽と、横の光の筋
    const q = m.v.length; addV(m, s * 90, 145 + lift, -300); addV(m, s * 127, 172 + lift, -390); addV(m, s * 108, 118 + lift, -400); m.f.push({ i: [q, q + 1, q + 2], k: 'body' });
    for (let z = -380; z < 380; z += 50) addLine(m, [s * (bxl(z, 110 + lift) + 3), 110 + lift, z], [s * (bxl(Math.min(390, z + 50), 110 + lift) + 3), 110 + lift, Math.min(390, z + 50)], 'glow');
  }
  for (const z of [-260, 250]) { const q = m.v.length; for (const [x, dz] of [[-90, -60], [90, -60], [90, 60], [-90, 60]]) addV(m, x, lift - 4, z + dz); m.f.push({ i: [q + 3, q + 2, q + 1, q], k: 'repulsor' }); }   // 反重力の光(下面)
  for (const s of [-1, 1]) {
    for (let z = -290; z < 320; z += 60) addLine(m, [s * (bxl(z, 190) + 4), 190, z], [s * (bxl(z + 60, 190) + 4), 190, z + 60], 'chrome');
    addLine(m, [s * 114, 122, -392], [s * 135, 140, -270], 'glow');
  }
  { const q = m.v.length; for (const [x, y] of [[-100, 90], [100, 90], [96, 110], [-96, 110]]) addV(m, x, y + lift, -405); m.f.push({ i: [q, q + 1, q + 2, q + 3], k: 'tail' }); }
  for (const s of [-1, 1]) addBlob(m, s * 70, 70 + lift, 400, 18, 8, 5, 'head', 1, 10);
  return m;
}
// ---------- NR-00 KAMUI: 金田型の原型(金色、光る羽) ----------
function makeKMI() {
  const m = makePlayerBike();
  for (const s of [-1, 1]) {
    const q = m.v.length; addV(m, s * 96, 190, -200); addV(m, s * 210, 330, -340); addV(m, s * 100, 160, -330); m.f.push({ i: [q, q + 1, q + 2], k: 'fin' });
    const r = m.v.length; addV(m, s * 92, 200, 160); addV(m, s * 170, 250, 60); addV(m, s * 96, 170, 60); m.f.push({ i: [r, r + 1, r + 2], k: 'fin' });
    for (let z = -330; z < 380; z += 40) addLine(m, [s * (bodyX(z, 160) + 4), 160, z], [s * (bodyX(z + 40, 160) + 4), 160, z + 40], 'glow');
  }
  return m;
}
function initBikeMeshes() {
  MESH.kai = MESH.player; MESH.arc = makeARC(); MESH.nst = makeNST(); MESH.ngt = makeNGT(); MESH.kmi = makeKMI();
}
