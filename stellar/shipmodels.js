// ---------- STELLAR HEGEMONY ― 銀河覇権: 3Dワイヤーフレーム艦艇モデル(2026-09-28追加) ----------
// 1980s GALAXY SHOOTERのmodels.jsは一人称3Dカメラの描画エンジンに強く依存していて流用できないため、
// 同じ「頂点と辺だけのワイヤーフレーム艦船」という絵柄を、この作品用に新規に作った(部品を組み合わせて艦体を作る方式)。
// デザインはネットで調べた各作品の艦隊の系統を参考にしている:
//  ・星冠帝国軍(empire): 楔形の艦体・段状の装甲・高く角ばった艦橋・艦首の突起。艦載機は展開翼型。
//  ・地球星域防衛軍(republic): 丸みのある船体・球形のセンサー・両舷の並列ポッド(双胴)・大きな主機。艦載機はデルタ翼型。
//  ・惑星型戦闘艦: 球体+赤道の溝+巨砲(デス・スターの集束砲/イゼルローン要塞の主砲の系譜)。
// モデル座標: +z=艦首、+y=上、+x=右舷。最後に、艦の長さ(zの最大幅)が1になるよう正規化する。

class WM {
  constructor() { this.v = []; this.e = []; this.acc = []; }   // e=船体の線 acc=発光部(エンジン・窓・甲板の線)
  vtx(x, y, z) { this.v.push([x, y, z]); return this.v.length - 1; }
  ln(a, b, acc) { (acc ? this.acc : this.e).push([a, b]); }
  loop(ids, acc) { for (let i = 0; i < ids.length; i++) this.ln(ids[i], ids[(i + 1) % ids.length], acc); }
  seg(x0, y0, z0, x1, y1, z1, acc) { this.ln(this.vtx(x0, y0, z0), this.vtx(x1, y1, z1), acc); }
  box(cx, cy, cz, sx, sy, sz, acc) {
    const id = [];
    for (const dz of [-1, 1]) for (const dy of [-1, 1]) for (const dx of [-1, 1]) id.push(this.vtx(cx + dx * sx / 2, cy + dy * sy / 2, cz + dz * sz / 2));
    for (const [a, b] of [[0, 1], [2, 3], [4, 5], [6, 7], [0, 2], [1, 3], [4, 6], [5, 7], [0, 4], [1, 5], [2, 6], [3, 7]]) this.ln(id[a], id[b], acc);
  }
  frustum(cx, cy, cz, w0, h0, w1, h1, len, acc) {   // z方向に伸びる角錐台(後ろ側w0×h0、前側w1×h1)
    const z0 = cz - len / 2, z1 = cz + len / 2, a = [], b = [];
    for (const [sx, sy] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) { a.push(this.vtx(cx + sx * w0 / 2, cy + sy * h0 / 2, z0)); b.push(this.vtx(cx + sx * w1 / 2, cy + sy * h1 / 2, z1)); }
    this.loop(a, acc); this.loop(b, acc); for (let i = 0; i < 4; i++) this.ln(a[i], b[i], acc);
  }
  cyl(cx, cy, cz, r0, r1, len, n, acc) {              // z方向に伸びる円筒(後ろ側r0、前側r1)
    const z0 = cz - len / 2, z1 = cz + len / 2, a = [], b = [];
    for (let i = 0; i < n; i++) { const t = i / n * Math.PI * 2, c = Math.cos(t), s = Math.sin(t); a.push(this.vtx(cx + c * r0, cy + s * r0, z0)); b.push(this.vtx(cx + c * r1, cy + s * r1, z1)); }
    this.loop(a, acc); this.loop(b, acc); for (let i = 0; i < n; i += Math.max(1, n >> 2)) this.ln(a[i], b[i], acc);
  }
  ring(cx, cy, cz, r, n, acc) {                        // 軸がzの輪(円盤・砲口・エンジンの縁)
    const a = []; for (let i = 0; i < n; i++) { const t = i / n * Math.PI * 2; a.push(this.vtx(cx + Math.cos(t) * r, cy + Math.sin(t) * r, cz)); } this.loop(a, acc);
  }
  ringXZ(cx, cy, cz, r, n, acc) {                      // 軸がyの輪(球の赤道・環状ドック)
    const a = []; for (let i = 0; i < n; i++) { const t = i / n * Math.PI * 2; a.push(this.vtx(cx + Math.cos(t) * r, cy, cz + Math.sin(t) * r)); } this.loop(a, acc);
  }
  sphere(cx, cy, cz, r, lat, lon, acc) {               // 緯線・経線の球(軸がy)
    const rows = [];
    for (let i = 1; i < lat; i++) {
      const phi = Math.PI * i / lat, ry = Math.cos(phi) * r, rr = Math.sin(phi) * r, row = [];
      for (let j = 0; j < lon; j++) { const t = j / lon * Math.PI * 2; row.push(this.vtx(cx + Math.cos(t) * rr, cy + ry, cz + Math.sin(t) * rr)); }
      this.loop(row, acc); rows.push(row);
    }
    const top = this.vtx(cx, cy + r, cz), bot = this.vtx(cx, cy - r, cz);
    for (let j = 0; j < lon; j++) { let prev = top; for (const row of rows) { this.ln(prev, row[j], acc); prev = row[j]; } this.ln(prev, bot, acc); }
  }
  loft(st) {                                            // 断面(八角形)を並べて艦体を作る。st=[[z, 半幅, 下端y, 上端y],...]
    const rings = [];
    for (const [z, w, y0, y1] of st) {
      const cut = (y1 - y0) * 0.25;
      rings.push([this.vtx(-w * 0.7, y1, z), this.vtx(w * 0.7, y1, z), this.vtx(w, y1 - cut, z), this.vtx(w, y0 + cut, z),
                  this.vtx(w * 0.6, y0, z), this.vtx(-w * 0.6, y0, z), this.vtx(-w, y0 + cut, z), this.vtx(-w, y1 - cut, z)]);
    }
    for (const r of rings) this.loop(r);
    for (let k = 0; k < rings.length - 1; k++) for (let i = 0; i < 8; i++) this.ln(rings[k][i], rings[k + 1][i]);
  }
}

// ---------- 部品 ----------
function wmTurret(m, x, y, z, s) {   // 連装砲塔(前向きの砲身2本)
  m.box(x, y, z, 0.05 * s, 0.025 * s, 0.06 * s);
  for (const sx of [-1, 1]) m.seg(x + sx * 0.012 * s, y, z + 0.03 * s, x + sx * 0.012 * s, y, z + 0.12 * s);
}
function wmEngines(m, list, r, zTail) { for (const [x, y] of list) m.cyl(x, y, zTail - 0.02, r, r * 0.75, 0.04, 8, true); }
function wmTower(m, E, x, y, z, s) {   // 艦橋
  if (E) { m.frustum(x, y, z, 0.08 * s, 0.09 * s, 0.05 * s, 0.09 * s, 0.13 * s); m.box(x, y + 0.075 * s, z, 0.11 * s, 0.02 * s, 0.045 * s); m.seg(x, y + 0.085 * s, z, x, y + 0.16 * s, z); }
  else { m.sphere(x, y + 0.02 * s, z, 0.055 * s, 4, 8); m.seg(x, y + 0.075 * s, z, x, y + 0.14 * s, z); }
  for (let i = -2; i <= 2; i++) m.seg(x + i * 0.012 * s, y + 0.01 * s, z + 0.07 * s, x + i * 0.012 * s + 0.006 * s, y + 0.01 * s, z + 0.07 * s, true); // 艦橋の窓
}
function hrand(i) { const x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); }

// ---------- 艦種ごとの組み立て ----------
function wmCapital(m, E, o) {   // 超弩級艦・戦艦・巡航艦の共通の作り(oで大きさ・砲塔数・エンジン数を変える)
  const w = o.w, h = o.h;
  if (E) {
    m.loft([[-0.5, w, -h, h * 0.9], [-0.28, w * 1.08, -h * 1.05, h], [-0.02, w * 0.85, -h, h], [0.26, w * 0.4, -h * 0.75, h * 0.8], [0.5, 0, -h * 0.3, h * 0.3]]);
    m.box(0, h * 1.3, -0.14, w * 1.1, h * 0.5, 0.5);                    // 上面の段状装甲
    if (o.layers > 1) m.box(0, h * 1.9, -0.2, w * 0.65, h * 0.5, 0.3);
    m.seg(0, 0, 0.5, 0, 0, 0.58);                                        // 艦首の突起
    wmTower(m, true, 0, h * 2.2, -o.tz, o.ts);
  } else {
    m.loft([[-0.5, w * 0.8, -h * 1.1, h * 1.1], [-0.3, w * 0.95, -h * 1.2, h * 1.2], [0, w, -h * 1.2, h * 1.2], [0.28, w * 0.7, -h * 0.9, h * 0.9], [0.46, w * 0.3, -h * 0.5, h * 0.5], [0.5, 0, 0, 0]]);
    wmTower(m, false, 0, h * 1.4, -o.tz, o.ts);
    for (const sx of [-1, 1]) {                                          // 両舷の並列ポッド
      m.cyl(sx * w * 1.3, -h * 0.2, -0.05, w * 0.28, w * 0.28, 0.55, 8);
      m.seg(sx * w, 0, -0.05, sx * w * 1.3, -h * 0.2, -0.05); m.seg(sx * w, 0, 0.15, sx * w * 1.3, -h * 0.2, 0.15);
    }
  }
  const ty = E ? h * 1.9 : h * 1.3;
  for (let i = 0; i < o.turrets; i++) {
    const z = 0.28 - i * (0.5 / Math.max(2, o.turrets));
    wmTurret(m, 0, ty * (E ? 0.95 : 1), z, o.ts * 1.2);
    if (o.turrets > 3 && i < o.turrets - 2 && i % 2 === 0) { wmTurret(m, w * 0.55, ty * 0.8, z - 0.12, o.ts); wmTurret(m, -w * 0.55, ty * 0.8, z - 0.12, o.ts); }
  }
  const eng = []; for (let i = 0; i < o.engines; i++) eng.push([(i - (o.engines - 1) / 2) * w * 0.55, 0]);
  wmEngines(m, eng, w * 0.16, -0.5);
}
function wmCarrier(m, E) {
  const w = E ? 0.20 : 0.19;
  m.loft([[-0.5, w * 0.8, -0.035, 0.02], [-0.2, w, -0.04, 0.025], [0.3, w, -0.04, 0.025], [0.46, w * 0.55, -0.025, 0.018], [0.5, E ? 0.0 : 0.02, -0.01, 0.01]]);
  m.box(0, 0.033, 0, w * 1.6, 0.006, 0.88);                              // 飛行甲板
  m.seg(0, 0.04, -0.42, 0, 0.04, 0.42, true);                           // 滑走線
  for (let z = -0.4; z <= 0.4; z += 0.16) m.seg(-0.05, 0.04, z, 0.05, 0.04, z, true);
  if (E) { m.box(w * 0.75, 0.09, -0.12, 0.05, 0.11, 0.17); m.box(w * 0.75, 0.16, -0.12, 0.08, 0.02, 0.07); m.seg(w * 0.75, 0.17, -0.12, w * 0.75, 0.24, -0.12); }
  else { m.box(-w * 0.75, 0.08, -0.12, 0.05, 0.09, 0.17); m.sphere(-w * 0.75, 0.16, -0.12, 0.045, 4, 8); }
  for (const sx of [-1, 1]) m.box(sx * w * 0.6, -0.01, 0.47, 0.05, 0.03, 0.02, true);   // 格納庫の口
  wmEngines(m, [[-w * 0.5, 0], [w * 0.5, 0], [-w * 0.15, 0], [w * 0.15, 0]], 0.03, -0.5);
}
function wmDestroyer(m, E) {
  if (E) {
    m.loft([[-0.5, 0.07, -0.03, 0.03], [0, 0.08, -0.03, 0.03], [0.5, 0, -0.008, 0.008]]);
    for (const sx of [-1, 1]) m.loop([m.vtx(sx * 0.07, 0, -0.35), m.vtx(sx * 0.19, 0, -0.5), m.vtx(sx * 0.07, 0, -0.5)]);
    m.box(0, 0.055, -0.12, 0.05, 0.04, 0.1); wmTurret(m, 0, 0.05, 0.15, 0.9);
  } else {
    m.loft([[-0.5, 0.05, -0.05, 0.05], [0.1, 0.055, -0.055, 0.055], [0.5, 0, 0, 0]]);
    m.loop([m.vtx(0, 0.05, -0.32), m.vtx(0, 0.15, -0.5), m.vtx(0, 0.05, -0.5)]);
    m.sphere(0, 0.075, -0.05, 0.03, 3, 6); wmTurret(m, 0, 0.055, 0.2, 0.9);
  }
  for (const sx of [-1, 1]) m.cyl(sx * 0.045, -0.01, 0.25, 0.012, 0.012, 0.2, 6);   // 発射管
  wmEngines(m, [[-0.03, 0], [0.03, 0]], 0.025, -0.5);
}
function wmFrigate(m, E) {
  if (E) { m.loft([[-0.5, 0.11, -0.05, 0.04], [0, 0.12, -0.05, 0.05], [0.5, 0, -0.01, 0.01]]); m.ring(0, 0.13, -0.1, 0.05, 10); }
  else { m.loft([[-0.5, 0.07, -0.06, 0.06], [0, 0.09, -0.07, 0.07], [0.5, 0, 0, 0]]); for (const sx of [-1, 1]) m.box(sx * 0.12, 0, -0.1, 0.04, 0.03, 0.2); }
  for (const [x, z] of [[-0.07, 0.12], [0.07, 0.12], [0, -0.2]]) m.sphere(x, 0.075, z, 0.03, 3, 6);   // 近接防御ドーム
  wmEngines(m, [[-0.04, 0], [0.04, 0]], 0.028, -0.5);
}
function wmTorpedoBoat(m, E) {
  if (E) { m.loft([[-0.5, 0.045, -0.02, 0.02], [0.2, 0.05, -0.02, 0.02], [0.5, 0, 0, 0]]); for (const sx of [-1, 1]) m.loop([m.vtx(sx * 0.05, 0, -0.38), m.vtx(sx * 0.14, 0, -0.5), m.vtx(sx * 0.05, 0, -0.5)]); }
  else { m.loft([[-0.5, 0.035, -0.03, 0.03], [0.2, 0.04, -0.03, 0.03], [0.5, 0, 0, 0]]); m.cyl(0, -0.055, 0.05, 0.028, 0.028, 0.6, 6); }
  if (E) for (const sx of [-1, 1]) { m.cyl(sx * 0.09, -0.012, 0.1, 0.02, 0.02, 0.5, 6); m.seg(sx * 0.09, -0.012, 0.35, sx * 0.09, -0.012, 0.42); }
  wmEngines(m, [[0, 0]], 0.025, -0.5);
}
function wmPlanet(m, E) {   // 惑星型戦闘艦(要塞艦)
  m.sphere(0, 0, 0, 0.5, 9, 16);
  m.ringXZ(0, 0, 0, 0.47, 28, true); m.ringXZ(0, 0.035, 0, 0.485, 28); m.ringXZ(0, -0.035, 0, 0.485, 28);   // 赤道の溝
  for (let i = 0; i < 16; i++) {                                                                            // 表面の砲台
    const a = hrand(i * 3 + 1) * Math.PI * 2, b = (hrand(i * 3 + 2) - 0.5) * 2.2;
    const r = 0.5, x = Math.cos(a) * Math.cos(b) * r, y = Math.sin(b) * r, z = Math.sin(a) * Math.cos(b) * r;
    if (Math.abs(y) < 0.05) continue; m.box(x, y, z, 0.035, 0.035, 0.035);
  }
  if (E) { m.ring(0, 0.17, 0.42, 0.16, 14, true); m.ring(0, 0.17, 0.45, 0.11, 12, true); m.ring(0, 0.17, 0.48, 0.05, 8, true); }   // 集束砲の皿
  else {                                                                                                    // 主砲の砲口と環状ドック
    m.cyl(0, 0, 0.47, 0.13, 0.13, 0.16, 12, true); m.ring(0, 0, 0.56, 0.09, 10, true);
    m.ringXZ(0, 0, 0, 0.64, 32);
    for (let i = 0; i < 8; i++) { const t = i / 8 * Math.PI * 2; m.seg(Math.cos(t) * 0.5, 0, Math.sin(t) * 0.5, Math.cos(t) * 0.64, 0, Math.sin(t) * 0.64); }
  }
}
function wmEngineer(m, E) {   // 2026-09-29追加: 工作艦。非武装に近い支援艦で、修復用アームと通信/修復パラボラを外部に持つ
  if (E) m.loft([[-0.5, 0.06, -0.04, 0.04], [0, 0.075, -0.045, 0.045], [0.5, 0, -0.01, 0.01]]);
  else m.loft([[-0.5, 0.055, -0.05, 0.05], [0.1, 0.065, -0.05, 0.05], [0.5, 0, 0, 0]]);
  m.ring(0, 0.09, -0.15, 0.045, 10, true); m.seg(0, 0.045, -0.15, 0, 0.09, -0.15, true);   // 通信/修復用パラボラ
  for (const sx of [-1, 1]) {   // 左右に張り出す、関節2つの修復アーム
    const a = m.vtx(sx * 0.06, 0, 0.05), b = m.vtx(sx * 0.17, 0.02, 0.2), c = m.vtx(sx * 0.24, -0.015, 0.34);
    m.ln(a, b, true); m.ln(b, c, true);
  }
  wmEngines(m, [[-0.03, 0], [0.03, 0]], 0.022, -0.5);
}
function wmStealth(m, E) {   // 2026-09-29追加: ステルス艦。乱反射を抑えた、面の少ない低い多面体シルエット
  if (E) m.loft([[-0.5, 0.045, -0.015, 0.05], [-0.1, 0.13, -0.01, 0.03], [0.3, 0.05, -0.008, 0.015], [0.5, 0, 0, 0]]);
  else { m.loft([[-0.5, 0.06, -0.03, 0.03], [0.05, 0.1, -0.02, 0.02], [0.5, 0, 0, 0]]); m.ring(0, 0.02, -0.2, 0.03, 8, true); }
  wmEngines(m, [[0, 0]], 0.018, -0.5);
}
// 2026-09-29(5回目)追加: 指揮巡洋艦。巡航艦相当の艦体(wmCapital流用)に、大型の司令部アンテナ/通信アレイを追加した「小さな旗艦」
function wmCommand(m, E) {
  wmCapital(m, E, { w: 0.12, h: 0.045, turrets: 2, engines: 3, ts: 0.9, tz: 0.27, layers: 1 });
  const topY = E ? 0.13 : 0.09;
  const base = m.vtx(0, topY, 0.05), tip = m.vtx(0, topY + 0.14, 0.0);
  m.ln(base, tip, true);
  m.ring(0, topY + 0.13, 0.0, 0.035, 8, true);
  for (const sx of [-1, 1]) { const a = m.vtx(sx * 0.02, topY + 0.01, 0.08), b = m.vtx(sx * 0.1, topY + 0.08, 0.02); m.ln(a, b, true); }
}
// 2026-09-29(5回目)追加: 強襲揚陸艦。艦首に鉤爪状のドッキングクランプを備えた、鈍重だが頑丈な突撃艦
function wmBoarding(m, E) {
  if (E) m.loft([[-0.5, 0.07, -0.05, 0.05], [0.1, 0.08, -0.055, 0.055], [0.45, 0.035, -0.02, 0.02], [0.5, 0.02, -0.015, 0.015]]);
  else m.loft([[-0.5, 0.065, -0.06, 0.06], [0.15, 0.075, -0.05, 0.05], [0.5, 0.025, -0.018, 0.018]]);
  for (const sx of [-1, 1]) {   // 艦首の鉤爪(ドッキングクランプ)
    const a = m.vtx(sx * 0.03, 0.02, 0.42), bp = m.vtx(sx * 0.09, 0.05, 0.49), c = m.vtx(sx * 0.03, -0.01, 0.5);
    m.ln(a, bp, true); m.ln(bp, c, true);
  }
  wmEngines(m, [[-0.04, 0], [0.04, 0]], 0.028, -0.5);
}
function wmFighter(m, E) {   // 艦載機(星冠帝国軍=展開翼 / 地球星域防衛軍=デルタ翼)
  m.frustum(0, 0, 0, 0.07, 0.05, 0.04, 0.03, 0.8);
  m.seg(0, 0, 0.4, 0, 0, 0.55);
  if (E) for (const sx of [-1, 1]) for (const sy of [-1, 1]) m.loop([m.vtx(sx * 0.03, sy * 0.02, 0.12), m.vtx(sx * 0.36, sy * 0.26, -0.22), m.vtx(sx * 0.03, sy * 0.02, -0.32)]);
  else for (const sx of [-1, 1]) {
    m.loop([m.vtx(sx * 0.03, 0, 0.12), m.vtx(sx * 0.42, -0.02, -0.36), m.vtx(sx * 0.03, 0, -0.32)]);
    m.loop([m.vtx(sx * 0.42, -0.02, -0.3), m.vtx(sx * 0.42, 0.16, -0.38), m.vtx(sx * 0.42, -0.02, -0.42)]);
  }
  m.ring(0, 0, -0.4, 0.02, 6, true);
}

const WIRE_CACHE = {};
function wireModel(cls, faction) {
  const key = cls + '|' + faction;
  if (WIRE_CACHE[key]) return WIRE_CACHE[key];
  const m = new WM(), E = faction === 'empire';
  switch (cls) {
    case 'DN': wmCapital(m, E, { w: 0.21, h: 0.055, turrets: 5, engines: 4, ts: 1.15, tz: 0.30, layers: 2 }); break;
    case 'BB': wmCapital(m, E, { w: 0.15, h: 0.045, turrets: 3, engines: 3, ts: 1.0, tz: 0.28, layers: 1 }); break;
    case 'CA': wmCapital(m, E, { w: 0.10, h: 0.035, turrets: 2, engines: 2, ts: 0.8, tz: 0.25, layers: 1 }); break;
    case 'CV': wmCarrier(m, E); break;
    case 'DD': wmDestroyer(m, E); break;
    case 'FR': wmFrigate(m, E); break;
    case 'TB': wmTorpedoBoat(m, E); break;
    case 'PL': wmPlanet(m, E); break;
    case 'ES': wmEngineer(m, E); break;
    case 'ST': wmStealth(m, E); break;
    case 'CC': wmCommand(m, E); break;
    case 'MA': wmBoarding(m, E); break;
    case 'FT': wmFighter(m, E); break;
    default: wmCapital(m, E, { w: 0.10, h: 0.035, turrets: 2, engines: 2, ts: 0.8, tz: 0.25, layers: 1 });
  }
  let maxZ = 0.01; for (const v of m.v) maxZ = Math.max(maxZ, Math.abs(v[2]));
  const k = 0.5 / maxZ; for (const v of m.v) { v[0] *= k; v[1] *= k; v[2] *= k; }
  return (WIRE_CACHE[key] = m);
}

// 艦の描画上の基準の長さ(px)
const WIRE_SIZE = { PL: 210, DN: 230, CV: 215, BB: 190, CA: 145, DD: 110, FR: 95, TB: 90, ES: 100, ST: 90, CC: 150, MA: 100, FT: 22 };

// 3D→2Dに投影して、ワイヤーフレームで描く。yaw=鉛直軸まわりの向き(艦首が右=約+1.25)、pitch=見下ろす角度。
function drawWire(model, cx, cy, size, yaw, pitch, col, alpha, glow, accCol) {
  const ctx = drawingContext, cyw = Math.cos(yaw), syw = Math.sin(yaw), cp = Math.cos(pitch), sp = Math.sin(pitch);
  const D = size * 2.6, n = model.v.length, PX = new Float32Array(n), PY = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const v = model.v[i], x = v[0] * size, y = v[1] * size, z = v[2] * size;
    const x1 = x * cyw + z * syw, z1 = -x * syw + z * cyw;
    const y2 = y * cp + z1 * sp, z2 = -y * sp + z1 * cp, f = D / (D + z2);
    PX[i] = cx + x1 * f; PY[i] = cy - y2 * f;
  }
  ctx.save(); ctx.lineJoin = 'round'; ctx.lineCap = 'round';
  ctx.lineWidth = Math.max(0.8, size / 200 + 0.6);
  ctx.strokeStyle = `rgba(${col[0] | 0},${col[1] | 0},${col[2] | 0},${alpha})`;
  ctx.shadowColor = `rgba(${col[0] | 0},${col[1] | 0},${col[2] | 0},0.85)`; ctx.shadowBlur = glow ? 8 : 0;
  ctx.beginPath(); for (const e of model.e) { ctx.moveTo(PX[e[0]], PY[e[0]]); ctx.lineTo(PX[e[1]], PY[e[1]]); } ctx.stroke();
  if (model.acc.length) {
    const ac = accCol || [255, 200, 120];
    ctx.strokeStyle = `rgba(${ac[0]},${ac[1]},${ac[2]},${alpha})`; ctx.shadowColor = `rgba(${ac[0]},${ac[1]},${ac[2]},0.9)`; ctx.shadowBlur = glow ? 10 : 0;
    ctx.beginPath(); for (const e of model.acc) { ctx.moveTo(PX[e[0]], PY[e[0]]); ctx.lineTo(PX[e[1]], PY[e[1]]); } ctx.stroke();
  }
  ctx.restore();
}
function wireAccent(faction) { return faction === 'empire' ? [255, 200, 120] : [150, 240, 255]; }

if (typeof module !== 'undefined') module.exports = { WM, wireModel, drawWire, WIRE_SIZE, wireAccent };
