// models.js — ワイヤーフレームの立体(バイク・敵・ボス・アイテム)と、その描画
// 形式: v = 頂点 [x, y, z](x=右、y=上、z=前)、f = 面 {i:[頂点番号...], k:'body'|'light'|'glass'|'glow'}、l = 飾りの線 [a, b]
function Mesh() { return { v: [], f: [], l: [] }; }
function addV(m, x, y, z) { m.v.push([x, y, z]); return m.v.length - 1; }
function addBox(m, cx, cy, cz, w, h, d, k) {   // 中心x、底y、中心z
  const b = m.v.length, x0 = cx - w / 2, x1 = cx + w / 2, z0 = cz - d / 2, z1 = cz + d / 2, y0 = cy, y1 = cy + h;
  for (const [x, y, z] of [[x0, y0, z0], [x1, y0, z0], [x1, y1, z0], [x0, y1, z0], [x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1]]) addV(m, x, y, z);
  const F = [[0, 1, 2, 3], [5, 4, 7, 6], [4, 0, 3, 7], [1, 5, 6, 2], [3, 2, 6, 7], [4, 5, 1, 0]];
  for (const f of F) m.f.push({ i: f.map(i => i + b), k: k || 'body' });
  return b;
}
// 横から見た輪郭(z, y)を、点ごとの幅で左右に広げて立体にする
function addLoft(m, prof, widths, x0, k) {
  const b = m.v.length, n = prof.length;
  for (let i = 0; i < n; i++) { const w = (typeof widths === 'number' ? widths : widths[i]) / 2; addV(m, x0 - w, prof[i][1], prof[i][0]); addV(m, x0 + w, prof[i][1], prof[i][0]); }
  m.f.push({ i: prof.map((_, i) => b + i * 2), k: k || 'body' });
  m.f.push({ i: prof.map((_, i) => b + (n - 1 - i) * 2 + 1), k: k || 'body' });
  for (let i = 0; i < n; i++) { const j = (i + 1) % n; m.f.push({ i: [b + i * 2, b + j * 2, b + j * 2 + 1, b + i * 2 + 1], k: k || 'body' }); }
  return b;
}
function addWheel(m, x0, cy, cz, r, w, n, hubless, disc, discK) {   // x軸まわりの円柱(タイヤ)。hubless は、中が空いた光る輪
  const b = m.v.length;
  for (let i = 0; i < n; i++) { const a = i / n * Math.PI * 2; addV(m, x0 - w / 2, cy + Math.sin(a) * r, cz + Math.cos(a) * r); addV(m, x0 + w / 2, cy + Math.sin(a) * r, cz + Math.cos(a) * r); }
  m.f.push({ i: Array.from({ length: n }, (_, i) => b + i * 2), k: 'tire' });
  m.f.push({ i: Array.from({ length: n }, (_, i) => b + (n - 1 - i) * 2 + 1), k: 'tire' });
  for (let i = 0; i < n; i++) { const j = (i + 1) % n; m.f.push({ i: [b + i * 2, b + j * 2, b + j * 2 + 1, b + i * 2 + 1], k: 'tire' }); }
  if (disc) for (const sd of [-1, 1]) { const c = m.v.length; for (let i = 0; i < n; i++) { const a = i / n * Math.PI * 2; addV(m, x0 + sd * (w / 2 + 2), cy + Math.sin(a) * r * 0.66, cz + Math.cos(a) * r * 0.66); } m.f.push({ i: Array.from({ length: n }, (_, i) => c + (sd > 0 ? i : n - 1 - i)), k: discK || 'hub' }); const c2 = m.v.length; for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 2; addV(m, x0 + sd * (w / 2 + 3), cy + Math.sin(a) * r * 0.22, cz + Math.cos(a) * r * 0.22); } m.f.push({ i: Array.from({ length: 8 }, (_, i) => c2 + (sd > 0 ? i : 7 - i)), k: 'tire' }); }
  if (disc) { /* 円盤の車輪: 飾りは上で付けた */ }
  else if (hubless) { const c = m.v.length; for (let i = 0; i < n; i++) { const a = i / n * Math.PI * 2; addV(m, x0 + w / 2 + 1, cy + Math.sin(a) * r * 0.72, cz + Math.cos(a) * r * 0.72); } for (let i = 0; i < n; i++) m.l.push([c + i, c + (i + 1) % n, 'glow']); }
  else { const c = addV(m, x0 + w / 2 + 1, cy, cz); for (let i = 0; i < n; i += 2) m.l.push([c, b + i * 2 + 1]); }
  return b;
}
function addLine(m, a, b, k) { m.l.push([addV(m, a[0], a[1], a[2]), addV(m, b[0], b[1], b[2]), k]); }
function scaleMesh(m, s) { for (const v of m.v) { v[0] *= s; v[1] *= s; v[2] *= s; } return m; }

// 楕円体(丸いカウル・ヘルメット)。y0,y1 は緯度の範囲(-1=下端、1=上端)で、半分だけ作ることもできる
function addBlob(m, cx, cy, cz, rx, ry, rz, k, nLat, nLon, y0, y1, capK) {
  nLat = nLat || 4; nLon = nLon || 10; y0 = y0 == null ? -1 : y0; y1 = y1 == null ? 1 : y1;
  const b = m.v.length, rows = nLat + 1;
  const la0 = Math.asin(y0), la1 = Math.asin(y1);
  for (let i = 0; i < rows; i++) { const la = la0 + (la1 - la0) * i / nLat, cl = Math.cos(la), sl = Math.sin(la);
    for (let j = 0; j < nLon; j++) { const lo = j / nLon * Math.PI * 2; addV(m, cx + Math.cos(lo) * cl * rx, cy + sl * ry, cz + Math.sin(lo) * cl * rz); } }
  for (let i = 0; i < nLat; i++) for (let j = 0; j < nLon; j++) { const a = b + i * nLon + j, c = b + i * nLon + (j + 1) % nLon; m.f.push({ i: [a, c, c + nLon, a + nLon], k: k || 'body' }); }
  if (y0 > -1) m.f.push({ i: Array.from({ length: nLon }, (_, j) => b + j), k: k || 'body' });
  if (capK) m.f.push({ i: Array.from({ length: nLon }, (_, j) => b + nLat * nLon + (nLon - 1 - j)), k: capK });
  return b;
}
// 楕円体の表面の位置(ステッカーやランプを、カウルの面に沿わせるため)
const ellX = (E, z, y) => E[3] * Math.sqrt(Math.max(0, 1 - ((z - E[2]) / E[5]) ** 2 - ((y - E[1]) / E[4]) ** 2));
const ellZ = (E, x, y, sgn) => E[2] + sgn * E[5] * Math.sqrt(Math.max(0, 1 - (x / E[3]) ** 2 - ((y - E[1]) / E[4]) ** 2));
function addDecal(m, E, side, z0, z1, y0, y1, k) {   // 楕円体の横の面に貼る四角(4x2に分けて、曲面に沿わせる)
  for (let i = 0; i < 4; i++) {
    const za = lerp(z0, z1, i / 4), zb = lerp(z0, z1, (i + 1) / 4), q = m.v.length;
    for (const [z, y] of [[za, y0], [zb, y0], [zb, y1], [za, y1]]) addV(m, side * (ellX(E, z, y) + 2), y, z);
    m.f.push({ i: side > 0 ? [q, q + 1, q + 2, q + 3] : [q + 3, q + 2, q + 1, q], k });
  }
}
// ---------- 自機: 金田のバイク風 ----------
// 一続きの丸い車体: 前後方向の断面(z, 下端y, 上端y, 半幅)をつないで作る。低い鼻先 → 黒いキャノピー → 伏せる座面のくぼみ → 後ろのカウルのふくらみ → 尾
// 実寸の比(全長2947mm・全幅831mm・シート高340mm)に合わせて、1単位 ≒ 4mm
const KANEDA = [[-372, 130, 160, 28], [-352, 116, 185, 72], [-310, 110, 207, 100], [-240, 110, 218, 100], [-170, 108, 208, 102], [-110, 76, 170, 94], [-40, 70, 165, 90], [30, 80, 172, 92],
  [100, 110, 195, 102], [170, 143, 225, 106], [240, 184, 237, 76], [300, 190, 218, 59], [350, 178, 190, 48], [385, 156, 165, 33], [398, 145, 150, 12]];
function kanedaSec(z) {   // z での断面を補間
  const K = KANEDA; if (z <= K[0][0]) return K[0]; if (z >= K[K.length - 1][0]) return K[K.length - 1];
  let i = 0; while (K[i + 1][0] < z) i++; const t = (z - K[i][0]) / (K[i + 1][0] - K[i][0]); return [z, lerp(K[i][1], K[i + 1][1], t), lerp(K[i][2], K[i + 1][2], t), lerp(K[i][3], K[i + 1][3], t)];
}
const ringPt = (sec, th) => { const c = Math.cos(th), sn = Math.sin(th), mid = (sec[1] + sec[2]) / 2, hh = (sec[2] - sec[1]) / 2; return [Math.sign(c) * Math.pow(Math.abs(c), 0.72) * sec[3], mid + Math.sign(sn) * Math.pow(Math.abs(sn), 0.8) * hh]; };
function bodyX(z, y) { const sec = kanedaSec(z), mid = (sec[1] + sec[2]) / 2, hh = (sec[2] - sec[1]) / 2, u = clamp(Math.abs(y - mid) / hh, 0, 1); return sec[3] * Math.pow(Math.max(0, 1 - Math.pow(u, 1 / 0.8)), 0.72) + 2; }
function kanedaDecal(m, side, z0, z1, y0, y1, k) { for (let i = 0; i < 4; i++) { const za = lerp(z0, z1, i / 4), zb = lerp(z0, z1, (i + 1) / 4), q = m.v.length; for (const [z, y] of [[za, y0], [zb, y0], [zb, y1], [za, y1]]) addV(m, side * (bodyX(z, y) + 3), y, z); m.f.push({ i: side > 0 ? [q, q + 1, q + 2, q + 3] : [q + 3, q + 2, q + 1, q], k }); } }
function makePlayerBike() {
  const m = Mesh();
  addWheel(m, 0, 90, -238, 90, 96, 14, false, true, 'body');
  addWheel(m, 0, 86, 250, 86, 84, 14, false, true, 'body');
  // 車体
  const NR = 14, st = [];
  for (let z = -372; z <= 398; z += 32) st.push(z); if (st[st.length - 1] !== 398) st.push(398);
  const b0 = m.v.length;
  for (const z of st) { const sec = kanedaSec(z); for (let j = 0; j < NR; j++) { const [x, y] = ringPt(sec, j / NR * Math.PI * 2); addV(m, x, y, z); } }
  for (let i = 0; i < st.length - 1; i++) for (let j = 0; j < NR; j++) {
    const a = b0 + i * NR + j, c = b0 + i * NR + (j + 1) % NR, zc = (st[i] + st[i + 1]) / 2, yc = (m.v[a][1] + m.v[c][1]) / 2, sec = kanedaSec(zc);
    const top = yc > sec[2] - (sec[2] - sec[1]) * 0.28, under = yc < sec[1] + (sec[2] - sec[1]) * 0.12;
    const k = top && zc > 118 && zc < 340 ? 'visor' : under ? 'under' : 'body';
    m.f.push({ i: [a, c, c + NR, a + NR], k });
  }
  m.f.push({ i: Array.from({ length: NR }, (_, j) => b0 + (NR - 1 - j)), k: 'body' });
  m.f.push({ i: Array.from({ length: NR }, (_, j) => b0 + (st.length - 1) * NR + j), k: 'body' });
  addBlob(m, 0, 146, 394, 20, 16, 6, 'head', 2, 12);                  // 丸いヘッドライト
  for (const s of [-1, 1]) addBlob(m, s * 44, 176, 380, 8, 6, 4, 'head', 1, 8);   // 小さな補助灯
  // テールランプ: 尾の面に、横長の帯と左右の丸いランプ
  { const q = m.v.length; for (const [x, y, z] of [[-62, 150, -350], [62, 150, -350], [58, 166, -347], [-58, 166, -347]]) addV(m, x, y, z); m.f.push({ i: [q, q + 1, q + 2, q + 3], k: 'tail' }); }
  for (const s of [-1, 1]) addBlob(m, s * 46, 146, -358, 11, 11, 4, 'tail', 2, 10);
  // 資料の赤い一体型カウル、露出した前輪、後輪カバーと金属リブ。
  for (const s of [-1, 1]) {
    addLoft(m, [[-340, 120], [-315, 185], [-240, 194], [-195, 130]], [30, 36, 37, 28], s * 86, 'body');
    for (let z = -315; z < 330; z += 43) {
      const zz = Math.min(z + 43, 330);
      addLine(m, [s * (bodyX(z, 165) + 5), 165, z], [s * (bodyX(zz, 165) + 5), 165, zz], 'chrome');
    }
    addLine(m, [s * 64, 164, -350], [s * 101, 164, -335], 'tail');
    addLine(m, [s * 43, 95, 205], [s * 40, 112, 300], 'chrome');
  }
  // ステッカー(白・黄の四角)と、横の細い線
  for (const s of [-1, 1]) {
    kanedaDecal(m, s, -318, -246, 140, 168, 'decal'); kanedaDecal(m, s, -228, -176, 150, 170, 'decal2'); kanedaDecal(m, s, -150, -100, 128, 146, 'decal');
    kanedaDecal(m, s, 36, 98, 124, 144, 'decal'); kanedaDecal(m, s, 250, 318, 150, 172, 'decal'); kanedaDecal(m, s, 330, 360, 150, 162, 'decal2');
    for (let z = -350; z < 380; z += 40) addLine(m, [s * bodyX(z, 132), 132, z], [s * bodyX(z + 40, 132), 132, z + 40], 'stripe');
  }
  // 乗り手: 赤いジャケットで、腹ばいに伏せる。背中にカプセルの印
  addBlob(m, 0, 196, -112, 60, 32, 60, 'jacket', 5, 12);
  addBlob(m, 0, 208, -6, 66, 34, 92, 'jacket', 5, 12);
  addBlob(m, 0, 240, 88, 36, 35, 40, 'jacket', 5, 12);
  addBlob(m, 0, 241, 118, 31, 14, 14, 'visor', 2, 10);                // ヘルメットのシールド
  { const y = 229, q = m.v.length; for (const [x, z] of [[-28, -126], [0, -130], [0, -102], [-28, -106], [28, -126], [28, -106]]) addV(m, x, y, z); m.f.push({ i: [q, q + 1, q + 2, q + 3], k: 'pillR' }); m.f.push({ i: [q + 1, q + 4, q + 5, q + 2], k: 'pillW' }); }
  for (const s of [-1, 1]) { addLine(m, [s * 60, 214, 40], [s * 70, 196, 140], 'jacket'); addLine(m, [s * 54, 182, -140], [s * 112, 150, -196], 'jeans'); addLine(m, [s * 112, 150, -196], [s * 112, 104, -262], 'jeans'); }
  return m;
}
// ---------- 暴走族のバイク(高いハンドル、旗竿、むき出しの車体) ----------
function makeBiker() {
  const m = Mesh();
  addLoft(m, [[-270, 140], [-240, 220], [-120, 230], [-40, 210], [60, 250], [180, 240], [250, 170], [200, 90], [-100, 80], [-230, 100]], [100, 120, 130, 120, 150, 140, 120, 100, 100, 100], 0);
  addWheel(m, 0, 100, -190, 100, 70, 10, false);
  addWheel(m, 0, 96, 190, 96, 60, 10, false);
  addLoft(m, [[-150, 230], [-80, 360], [20, 380], [-10, 250]], [110, 130, 120, 110], 0, 'rider');
  addBlob(m, 0, 405, 0, 44, 40, 48, 'rider', 3, 8);
  for (const s of [-1, 1]) { addLine(m, [s * 40, 250, 160], [s * 110, 360, 120], 'body'); addLine(m, [s * 110, 360, 120], [s * 60, 360, 30], 'rider'); }
  addLine(m, [-50, 230, -230], [-50, 620, -250], 'body');   // 旗竿
  const q = m.v.length; addV(m, -50, 620, -250); addV(m, -50, 540, -250); addV(m, -50, 580, -380); m.f.push({ i: [q, q + 1, q + 2], k: 'flag' });
  const t = m.v.length; addV(m, -30, 150, -272); addV(m, 30, 150, -272); addV(m, 30, 170, -268); addV(m, -30, 170, -268); m.f.push({ i: [t, t + 1, t + 2, t + 3], k: 'tail' });
  return m;
}
// ---------- 光のバイク(全体を覆う流線形、空洞の車輪) ----------
function makeCycle() {
  const m = Mesh();
  addLoft(m, [[-330, 60], [-330, 200], [-230, 260], [-60, 240], [60, 250], [200, 230], [320, 170], [340, 80], [300, 40], [-280, 40]], [90, 100, 120, 110, 120, 120, 100, 90, 90, 90], 0);
  addWheel(m, 0, 125, -215, 125, 96, 16, true);
  addWheel(m, 0, 125, 215, 125, 96, 16, true);
  addBox(m, 0, 250, 30, 60, 50, 150, 'glass');
  addLine(m, [-62, 180, -300], [-62, 190, 310], 'glow'); addLine(m, [62, 180, -300], [62, 190, 310], 'glow');
  const t = m.v.length; addV(m, -45, 120, -333); addV(m, 45, 120, -333); addV(m, 45, 190, -333); addV(m, -45, 190, -333); m.f.push({ i: [t, t + 1, t + 2, t + 3], k: 'tail' });
  return m;
}
// ---------- ドローン(六角の胴、4つの回転翼、赤い目) ----------
function makeDrone() {
  const m = Mesh(), n = 6, b = m.v.length;
  for (let i = 0; i < n; i++) { const a = i / n * Math.PI * 2; addV(m, Math.cos(a) * 160, 40, Math.sin(a) * 160); }
  for (let i = 0; i < n; i++) { const a = i / n * Math.PI * 2; addV(m, Math.cos(a) * 110, -40, Math.sin(a) * 110); }
  const top = addV(m, 0, 90, 0), bot = addV(m, 0, -80, 0);
  for (let i = 0; i < n; i++) { const j = (i + 1) % n; m.f.push({ i: [b + i, b + j, top], k: 'body' }); m.f.push({ i: [b + i, b + n + i, b + n + j, b + j], k: 'body' }); m.f.push({ i: [b + n + j, b + n + i, bot], k: 'body' }); }
  for (const [x, z] of [[-230, -230], [230, -230], [-230, 230], [230, 230]]) {
    const c = m.v.length; for (let i = 0; i < 10; i++) { const a = i / 10 * Math.PI * 2; addV(m, x + Math.cos(a) * 110, 50, z + Math.sin(a) * 110); }
    for (let i = 0; i < 10; i++) m.l.push([c + i, c + (i + 1) % 10, 'body']);
    addLine(m, [x * 0.5, 40, z * 0.5], [x, 50, z], 'body');
  }
  const e = m.v.length; addV(m, -40, -20, -150); addV(m, 40, -20, -150); addV(m, 30, 20, -150); addV(m, -30, 20, -150); m.f.push({ i: [e, e + 1, e + 2, e + 3], k: 'eye' });
  return m;
}
function makeMine() {
  const m = Mesh(), n = 8, b = m.v.length;
  for (let i = 0; i < n; i++) { const a = i / n * Math.PI * 2; addV(m, Math.cos(a) * 90, 0, Math.sin(a) * 90); addV(m, Math.cos(a) * 60, 50, Math.sin(a) * 60); }
  for (let i = 0; i < n; i++) { const j = (i + 1) % n; m.f.push({ i: [b + i * 2, b + j * 2, b + j * 2 + 1, b + i * 2 + 1], k: 'body' }); }
  m.f.push({ i: Array.from({ length: n }, (_, i) => b + (n - 1 - i) * 2 + 1), k: 'body' });
  for (let i = 0; i < n; i += 2) addLine(m, [Math.cos(i / n * 6.283) * 90, 0, Math.sin(i / n * 6.283) * 90], [Math.cos(i / n * 6.283) * 130, 30, Math.sin(i / n * 6.283) * 130], 'body');
  return m;
}
function makeBarrier(kind) {
  const m = Mesh();
  if (kind === 'rock') { addLoft(m, [[-150, 0], [-120, 200], [0, 330], [130, 240], [160, 0]], [520, 480, 360, 420, 500], 0); return m; }
  addBox(m, 0, 0, 0, 560, 260, 120);
  for (let i = -2; i <= 2; i++) addLine(m, [i * 110 - 50, 20, -62], [i * 110 + 50, 240, -62], 'stripe');
  return m;
}
function makeRamp() {   // ジャンプ台(緑の斜面)
  const m = Mesh();
  addLoft(m, [[-260, 0], [260, 170], [260, 0]], 640, 0, 'ramp');
  for (let i = 0; i < 5; i++) { const z = -200 + i * 110; addLine(m, [-320, (z + 260) / 520 * 170, z], [320, (z + 260) / 520 * 170, z], 'glow'); }
  return m;
}
function makeCube(s) { const m = Mesh(); addBox(m, 0, -s / 2, 0, s, s, s, 'item'); addBox(m, 0, -s * 0.3, 0, s * 0.6, s * 0.6, s * 0.6, 'glow'); return m; }

// ---------- ボス: 装甲トラック ----------
function makeTruck(caravan) {
  const m = Mesh();
  addBox(m, 0, 150, 0, 900, 620, 1500);           // 荷台
  addBox(m, 0, 150, 950, 820, 520, 420);          // 運転台
  addBox(m, 0, 670, 950, 700, 60, 300, 'glass');
  addBox(m, 0, 60, 0, 700, 90, 1900);             // 車台
  for (let i = -3; i <= 3; i++) addLine(m, [i * 120, 170, -752], [i * 120, 750, -752], 'stripe');   // 後ろの扉の筋
  for (let k = 0; k < 3; k++) addLine(m, [-452, 300 + k * 150, -740], [-452, 300 + k * 150, 740], 'body');
  for (let k = 0; k < 3; k++) addLine(m, [452, 300 + k * 150, -740], [452, 300 + k * 150, 740], 'body');
  if (caravan) { addBox(m, 0, 770, 200, 500, 80, 900); addLine(m, [-250, 850, -250], [250, 850, 650], 'stripe'); }
  for (const s of [-1, 1]) { const t = m.v.length; addV(m, s * 420, 190, -752); addV(m, s * 330, 190, -752); addV(m, s * 330, 240, -752); addV(m, s * 420, 240, -752); m.f.push({ i: s < 0 ? [t, t + 3, t + 2, t + 1] : [t, t + 1, t + 2, t + 3], k: 'tail' }); }
  for (const z of [-500, -250, 350, 900]) for (const s of [-1, 1]) addWheel(m, s * 420, 130, z, 130, 110, 10, false);
  return m;
}
function makeTurret() { const m = Mesh(); addBox(m, 0, 0, 0, 220, 120, 220); addBox(m, 0, 120, 0, 150, 70, 150); addBox(m, -45, 140, -180, 30, 30, 260); addBox(m, 45, 140, -180, 30, 30, 260); return m; }
function makePod() { const m = Mesh(); addBox(m, 0, 0, 0, 260, 160, 240); for (let i = 0; i < 3; i++) for (let j = 0; j < 2; j++) addBox(m, -80 + i * 80, 30 + j * 70, -125, 50, 45, 10, 'eye'); return m; }
function makeCorePlate() { const m = Mesh(); addBox(m, 0, 0, 0, 380, 300, 60, 'core'); addLine(m, [-190, 0, -32], [190, 300, -32], 'stripe'); addLine(m, [190, 0, -32], [-190, 300, -32], 'stripe'); return m; }
// ---------- ボス: 門のような浮遊兵器(2本の脚、上の梁、中央の頭) ----------
function makeArch() {
  const m = Mesh();
  for (const s of [-1, 1]) {
    addLoft(m, [[-160, 0], [-220, 900], [-120, 1500], [160, 1500], [120, 900], [160, 0]], [140, 200, 260, 260, 200, 140], s * 900);
    addBox(m, s * 900, -120, 0, 120, 120, 200, 'glow');
  }
  addLoft(m, [[-220, 1500], [-200, 1760], [220, 1760], [240, 1500]], 2100, 0);
  addLoft(m, [[-300, 1420], [-250, 1600], [250, 1600], [300, 1420], [0, 1300]], 420, 0);
  for (let k = -3; k <= 3; k++) addLine(m, [k * 250, 1760, -200], [k * 250, 1760, 200], 'glow');
  return m;
}
function makeHead() { const m = Mesh(); addLoft(m, [[-200, 0], [-150, 220], [150, 220], [200, 0], [0, -100]], 360, 0, 'core'); const e = m.v.length; addV(m, -110, 60, -212); addV(m, 110, 60, -212); addV(m, 80, 140, -190); addV(m, -80, 140, -190); m.f.push({ i: [e, e + 1, e + 2, e + 3], k: 'eye' }); return m; }
function makeEmitter() { const m = Mesh(); addBox(m, 0, 0, 0, 240, 240, 240, 'core'); addBox(m, 0, 60, -125, 120, 120, 10, 'eye'); return m; }

let MESH = {};
function initMeshes() {
  MESH = { player: makePlayerBike(), wing: scaleMesh(makePlayerBike(), 0.78), biker: makeBiker(), cycle: makeCycle(), drone: makeDrone(), mine: makeMine(),
    barrier: makeBarrier('box'), rock: makeBarrier('rock'), ramp: makeRamp(), cube: makeCube(160), truck: makeTruck(false), caravan: makeTruck(true),
    turret: makeTurret(), pod: makePod(), plate: makeCorePlate(), arch: makeArch(), head: makeHead(), emitter: makeEmitter() };
}

// ---------- 描画 ----------
// ez: 絶対z、ex: 実寸x、ey: 路面からの高さ。rot: {yaw, roll, pitch}。col: 縁の色 [r,g,b]
// opt: {a, flash, glowCol, brake, scale, shade}。shade を渡すと、面を光の向きで塗り分ける(赤い車体として見せる)
const SV = [], TV = []; for (let i = 0; i < 2600; i++) { SV.push([0, 0, 0, 0, 0]); TV.push([0, 0, 0]); }
const FACE_BUF = [];
let MESH_PROJ = null;   // ガレージなど、別のカメラで描くときに差し替える
const LIGHT = (() => { const l = [-0.45, 0.8, -0.4], n = Math.hypot(...l); return l.map(v => v / n); })();
const SHADE = {   // 塗り分けの色(赤い車体)
  body: [205, 22, 38], jacket: [185, 26, 36], hair: [30, 24, 30], visor: [18, 26, 40], seat: [28, 20, 26], under: [30, 30, 40], tire: [16, 16, 20], hub: [150, 152, 165],
  decal: [235, 235, 235], decal2: [250, 215, 60], pillR: [220, 30, 40], pillW: [240, 240, 240], helmet: [235, 236, 240], glass2: [30, 60, 90], chrome: [170, 175, 190],
  bodyDark: [108, 10, 24], modelGreen: [18, 185, 104], modelPurple: [100, 35, 168], modelCopper: [140, 82, 34],
};
function drawMesh(m, ez, ex, ey, rot, col, opt) {
  opt = opt || {};
  const pf = MESH_PROJ || proj;
  const cy = Math.cos(rot.yaw || 0), sy = Math.sin(rot.yaw || 0), cr = Math.cos(rot.roll || 0), sr = Math.sin(rot.roll || 0), cp = Math.cos(rot.pitch || 0), sp = Math.sin(rot.pitch || 0);
  const sc = opt.scale || 1, a = opt.a == null ? 1 : opt.a, n = m.v.length;
  for (let i = 0; i < n; i++) {
    const v = m.v[i], x = v[0] * sc, y = v[1] * sc, z = v[2] * sc;
    // 傾き(前後の軸まわり、接地点が中心)→ 前後の傾き → 向き
    const x1 = x * cr - y * sr, y1 = x * sr + y * cr;
    const y2 = y1 * cp - z * sp, z2 = y1 * sp + z * cp;
    const x3 = x1 * cy + z2 * sy, z3 = -x1 * sy + z2 * cy;
    const t = TV[i]; t[0] = x3; t[1] = y2; t[2] = z3;
    if (!pf(ez + z3, ex + x3, ey + y2, SV[i])) return;   // カメラに近すぎる物は描かない(手前で巨大にならないように)
  }
  FACE_BUF.length = 0;
  for (const f of m.f) { let dz = 0; for (const i of f.i) dz += SV[i][4]; FACE_BUF.push([dz / f.i.length - (f.k === 'decal' || f.k === 'decal2' || f.k === 'tail' ? 14 : 0), f]); }
  for (const L of m.l) FACE_BUF.push([(SV[L[0]][4] + SV[L[1]][4]) / 2 - 12, L]);   // 線も奥行きで並べる(表面の線は、少し手前に)
  FACE_BUF.sort((p, q) => q[0] - p[0]);
  const flash = opt.flash || 0, glow = opt.glowCol || col, shade = opt.shade;
  const lw = clamp(SV[0][2] * 3, 0.7, 2.2);
  for (const [, f] of FACE_BUF) {
    if (Array.isArray(f)) {
      const [i, j, k] = f;
      const c = k === 'stripe' ? [255, 255, 255] : k === 'glow' ? glow : k === 'chrome' ? [210, 226, 240] : k === 'tail' ? opt.tailCol || [255, 35, 55] : k === 'rider' ? [150, 150, 190] : k === 'jeans' ? [70, 90, 150] : k === 'jacket' ? (opt.pal && opt.pal.jacketLine) || [255, 90, 100] : k === 'hubline' ? [200, 200, 215] : k === 'pipe' ? [215, 220, 235] : col;
      ctx.strokeStyle = rgba(flash > 0 ? [255, 255, 255] : c, a * (k === 'glow' || k === 'tail' ? 1 : 0.85)); ctx.lineWidth = k === 'glow' || k === 'tail' ? lw * 1.8 : k === 'jeans' || k === 'jacket' ? lw * 3 : k === 'pipe' ? lw * 4.5 : lw;
      ctx.beginPath(); ctx.moveTo(SV[i][0], SV[i][1]); ctx.lineTo(SV[j][0], SV[j][1]); ctx.stroke(); continue;
    }
    const k = f.k, I = f.i;
    ctx.beginPath(); ctx.moveTo(SV[I[0]][0], SV[I[0]][1]); for (let j = 1; j < I.length; j++) ctx.lineTo(SV[I[j]][0], SV[I[j]][1]); ctx.closePath();
    if (k === 'tail') { ctx.fillStyle = rgba(opt.brake ? [255, 150, 150] : opt.tailCol || [255, 24, 44], a); ctx.fill(); continue; }
    if (k === 'fin') { ctx.fillStyle = rgba(glow, a * (0.55 + 0.25 * Math.sin(performance.now() / 120))); ctx.fill(); ctx.strokeStyle = rgba([255, 255, 255], a * 0.8); ctx.lineWidth = lw; ctx.stroke(); continue; }
    if (k === 'intake' || k === 'repulsor') { ctx.fillStyle = rgba(glow, a * (k === 'repulsor' ? 0.5 + 0.3 * Math.sin(performance.now() / 70) : 0.85)); ctx.fill(); continue; }
    if (k === 'head') { ctx.fillStyle = rgba([255, 250, 225], a); ctx.fill(); continue; }
    if (k === 'modelCyan' || k === 'modelAmber' || k === 'modelViolet') {
      const light = k === 'modelCyan' ? [32, 218, 255] : k === 'modelAmber' ? [255, 130, 25] : [180, 82, 255];
      ctx.fillStyle = rgba(flash > 0 ? [255, 255, 255] : light, a * 0.95); ctx.fill(); continue;
    }
    if (k === 'eye') { ctx.fillStyle = rgba([255, 30, 60], a * (0.6 + 0.4 * Math.sin(performance.now() / 90))); ctx.fill(); continue; }
    if (k === 'flag') { ctx.fillStyle = rgba([255, 60, 40], a * 0.8); ctx.fill(); continue; }
    const pal = opt.pal;
    if (shade && (SHADE[k] || (pal && pal[k]))) {
      // 面の向き(3頂点の外積)と光の向きで明るさを決める。両面とも同じに扱う
      const A = TV[I[0]], B = TV[I[1]], C = TV[I[2]];
      const ux = B[0] - A[0], uy = B[1] - A[1], uz = B[2] - A[2], vx = C[0] - A[0], vy = C[1] - A[1], vz = C[2] - A[2];
      let nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx; const nl = Math.hypot(nx, ny, nz) || 1;
      const d = Math.abs((nx * LIGHT[0] + ny * LIGHT[1] + nz * LIGHT[2]) / nl);
      const flat = k === 'decal' || k === 'decal2' || k === 'pillR' || k === 'pillW';
      let base = (pal && pal[k]) || ((k === 'body' || k === 'jacket') && Array.isArray(shade) ? shade : SHADE[k]);
      if (opt.iri && k === 'body') { const u = clamp(0.5 + (nx * 0.6 + ny * 0.3 - nz * 0.5) / nl, 0, 1); base = mixc(opt.iri[0], opt.iri[1], u); }   // 偏光色: 面の向きで色が変わる
      const lit = flat ? 0.78 + 0.22 * d : 0.44 + 0.62 * d, sp = d > 0.87 ? (d - 0.87) * 3.2 : 0;
      const r = Math.min(255, base[0] * lit + 255 * sp * 0.55), g = Math.min(255, base[1] * lit + 255 * sp * 0.45), b = Math.min(255, base[2] * lit + 255 * sp * 0.45);
      ctx.fillStyle = flash > 0 ? 'rgba(255,255,255,' + a + ')' : 'rgba(' + (r | 0) + ',' + (g | 0) + ',' + (b | 0) + ',' + a + ')'; ctx.fill();
      if (k === 'body' || k === 'visor') { ctx.strokeStyle = rgba(k === 'visor' ? [120, 200, 255] : (pal && pal.edge) || [255, 120, 120], a * 0.28); ctx.lineWidth = 0.7; ctx.stroke(); }
      continue;
    }
    const base = k === 'glass' || k === 'visor' ? 'rgba(10,30,50,' : k === 'rider' || k === 'jacket' || k === 'hair' ? 'rgba(12,10,18,' : k === 'tire' ? 'rgba(4,4,8,' : k === 'ramp' ? 'rgba(0,40,20,' : k === 'item' ? 'rgba(0,30,10,' : k === 'core' ? 'rgba(40,0,20,' : 'rgba(6,6,14,';
    ctx.fillStyle = base + (0.93 * a).toFixed(3) + ')'; ctx.fill();
    const c = flash > 0 ? [255, 255, 255] : k === 'rider' || k === 'jacket' || k === 'hair' ? [150, 150, 190] : k === 'tire' ? [90, 90, 120] : k === 'glass' || k === 'visor' ? [140, 220, 255] : k === 'ramp' || k === 'item' ? [60, 255, 120] : k === 'core' ? [255, 60, 160] : col;
    ctx.strokeStyle = rgba(c, a * (k === 'tire' ? 0.8 : 1)); ctx.lineWidth = lw; ctx.stroke();
  }
}
