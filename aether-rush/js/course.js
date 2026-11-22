// コース定義と、スプライン→バンク付き路面ポリゴン(押し出し)の生成
import * as THREE from '../lib/three.module.js';
import { GeoB, rgb, mul, mix } from './geo.js';
import { GEN_COURSES } from './courses_data.js';

const V = (x, y, z) => new THREE.Vector3(x, y, z);
const TAU = Math.PI * 2;

// ---- コースの制御点を作る補助 ----
export function figureEight(cx, r, bridge) {
  const L = Math.sqrt(cx * cx - r * r), th = Math.asin(r / cx);
  const c = Math.cos(th), s = Math.sin(th);
  const pts = [];
  const line = (x0, z0, x1, z1, n, y0, y1) => { for (let i = 0; i < n; i++) { const t = i / n; pts.push([x0 + (x1 - x0) * t, y0 + (y1 - y0) * t, z0 + (z1 - z0) * t]); } };
  const arc = (ccx, a0, a1, n, yf) => { for (let i = 0; i < n; i++) { const t = i / n, a = a0 + (a1 - a0) * t; pts.push([ccx + Math.cos(a) * r, yf(t), Math.sin(a) * r]); } };
  const A = [L * c, -L * s], B = [L * c, L * s], A2 = [-L * c, -L * s], B2 = [-L * c, L * s];
  const aR0 = Math.atan2(A[1], A[0] - cx), aR1 = Math.atan2(B[1], B[0] - cx);
  const aL0 = Math.atan2(A2[1], A2[0] + cx), aL1 = Math.atan2(B2[1], B2[0] + cx);
  // 1) 原点(下を通る)→右上の接点
  line(0, 0, A[0], A[1], 4, 0, 0);
  // 2) 右の円(時計回り)
  arc(cx, aR0, aR1 + (aR1 < aR0 ? TAU : 0), 12, () => 0);
  // 3) 右下の接点→原点(橋で上を通る)→左上の接点
  line(B[0], B[1], 0, 0, 5, 0, bridge);
  line(0, 0, A2[0], A2[1], 4, bridge, 0);
  // 4) 左の円(反時計回り)
  arc(-cx, aL0, aL1 - (aL1 > aL0 ? TAU : 0), 12, () => 0);
  // 5) 左下の接点→スタート前
  line(B2[0], B2[1], -40, 0, 4, 0, 0);
  // スタートは 5) の直線の途中(原点の手前)にする
  return pts.slice(pts.length - 2).concat(pts.slice(0, pts.length - 2));
}

function warp(fn, n) { const a = []; for (let i = 0; i < n; i++) a.push(fn(i / n)); return a; }

const HAND = [
  {
    slot: 1, id: 'city', name: 'NEON CITY CIRCUIT', jp: 'ネオンシティ・サーキット', style: 'city', laps: 3, halfW: 32, seed: 11,
    desc: '夜の高架を駆け抜ける基本コース。長い直線と大きなカーブ、2か所のジャンプ台。',
    points: [
      [0, 0, 300], [0, 0, -600], [-50, 14, -1400], [250, 34, -2100], [900, 42, -2400], [1600, 30, -2250], [2100, 8, -1700],
      [2250, -10, -1000], [2000, 0, -420], [1500, 6, -140], [1250, 22, 300], [1500, 30, 800], [1780, 18, 1060],
      [1900, 8, 1380], [1720, -4, 1700], [1400, -8, 1900], [700, 0, 1950], [0, 6, 1600], [-330, 0, 950],
    ],
    pads: [
      { at: 0.07, len: 5, l: [-22, 22], type: 'boost' }, { at: 0.34, len: 5, l: [-10, 10], type: 'boost' },
      { at: 0.58, len: 5, l: [-22, 22], type: 'boost' }, { at: 0.82, len: 5, l: [-10, 10], type: 'boost' },
      { at: 0.23, len: 36, l: [-32, 32], type: 'recover' },
      { at: 0.66, len: 40, l: [-32, 32], type: 'slip' },
    ],
    gaps: [{ at: 0.47, len: 11 }],
    pal: {
      skyTop: 0x050221, skyBot: 0x5a1a7a, fog: 0x2a0d4f, fogFar: 4200, ground: 0x07041a, grid: 0x7a2cff,
      road: 0x3a3c58, roadAlt: 0x45486a, wall: 0x2a2250, neon: 0x00f0ff, edge: 0xff2bd6, accent: 0xffe14a, sun: 0xff3fa4,
      bld: [0x4a2e8f, 0x2b3f9f, 0x7a2d8f, 0x1f6aa8, 0x8f2d5a],
    },
  },
  {
    slot: 3, id: 'canyon', name: 'CRYSTAL CANYON X', jp: 'クリスタル・キャニオン', style: 'canyon', laps: 3, halfW: 32, seed: 23,
    desc: '岩の谷間の8の字コース。中央で立体交差、上を通る橋はスピード勝負。',
    points: () => figureEight(1300, 820, 135),
    pads: [
      { at: 0.04, len: 5, l: [-22, 22], type: 'boost' }, { at: 0.30, len: 5, l: [-14, 14], type: 'boost' },
      { at: 0.55, len: 5, l: [-22, 22], type: 'boost' }, { at: 0.80, len: 5, l: [-14, 14], type: 'boost' },
      { at: 0.17, len: 38, l: [-32, 32], type: 'recover' },
      { at: 0.62, len: 40, l: [-32, 32], type: 'slip' },
    ],
    gaps: [{ at: 0.38, len: 10 }, { at: 0.88, len: 10 }],
    pal: {
      skyTop: 0x2a0a3a, skyBot: 0xff7a2a, fog: 0xc0501c, fogFar: 4600, ground: 0x2a0d08, grid: 0xff8a2a,
      road: 0x4a3a40, roadAlt: 0x574650, wall: 0x6a2a1a, neon: 0xffd23a, edge: 0xffffff, accent: 0x32f0ff, sun: 0xfff0a0,
      bld: [0xb0502a, 0x8a3a22, 0xd0703a, 0x6a2c20, 0xa84a30],
    },
  },
  {
    slot: 6, id: 'aurora', name: 'AURORA SKY LOOP', jp: 'オーロラ・スカイループ', style: 'ice', laps: 3, halfW: 34, seed: 37,
    desc: '雪原の空に架かる高低差の大きいコース。長い上り坂と、一気に駆け降りる谷。',
    points: () => warp((t) => {
      const a = t * TAU;
      return [2200 * Math.cos(a) + 125 * Math.cos(3 * a + 1.6), 340 * (0.5 - 0.5 * Math.cos(a + 0.2)) + 75 * Math.sin(2 * a), 1370 * Math.sin(a) + 0];
    }, 24),
    pads: [
      { at: 0.03, len: 5, l: [-24, 24], type: 'boost' }, { at: 0.26, len: 5, l: [-12, 12], type: 'boost' },
      { at: 0.52, len: 5, l: [-24, 24], type: 'boost' }, { at: 0.74, len: 5, l: [-12, 12], type: 'boost' },
      { at: 0.14, len: 36, l: [-34, 34], type: 'recover' },
      { at: 0.31, len: 44, l: [-34, 34], type: 'slip' },
      { at: 0.64, len: 44, l: [-34, 34], type: 'slip' },
    ],
    gaps: [{ at: 0.40, len: 12 }, { at: 0.90, len: 11 }],
    pal: {
      skyTop: 0x02121f, skyBot: 0x0a6a70, fog: 0x0c3b52, fogFar: 4800, ground: 0x041a24, grid: 0x39ffd0,
      road: 0x3a4f66, roadAlt: 0x465f78, wall: 0x1a3a58, neon: 0x7dff4a, edge: 0x6ad8ff, accent: 0xff5ad2, sun: 0xb8fff0,
      bld: [0x4aa8c8, 0x6ad0e0, 0x3a78b8, 0x9ae8f0, 0x2a8ab0],
    },
  },
];

// 色のセット(コースごとに選ぶ)
export const PALS = {
  citySunset: { skyTop: 0x1a0a3a, skyBot: 0xff6a3a, fog: 0x6a2a4a, fogFar: 4400, ground: 0x120818, grid: 0xff4aa8, road: 0x4a3a52, roadAlt: 0x5a4a64, wall: 0x3a2048, neon: 0xffb03a, edge: 0xff3a8a, accent: 0x3affd0, sun: 0xffd06a, bld: [0x7a2f6a, 0xa0405a, 0x4a3a8a, 0xc0603a, 0x5a2a7a] },
  cityCyber: { skyTop: 0x00121a, skyBot: 0x00695a, fog: 0x053a3a, fogFar: 4400, ground: 0x021014, grid: 0x00ff9a, road: 0x30484a, roadAlt: 0x3a5659, wall: 0x123a3a, neon: 0x39ff7a, edge: 0x00e5ff, accent: 0xfff23a, sun: 0x7affd0, bld: [0x1f8a7a, 0x2b6fa0, 0x3a9a5a, 0x1a5a6a, 0x4aa88a] },
  neonVoid: { skyTop: 0x10000a, skyBot: 0x5a0a2a, fog: 0x30051a, fogFar: 4200, ground: 0x0a0008, grid: 0xff2a5a, road: 0x3e3440, roadAlt: 0x4a3f4e, wall: 0x3a1230, neon: 0xff3a5a, edge: 0xffe03a, accent: 0x3aeaff, sun: 0xff5a5a, bld: [0x7a1a3a, 0x4a1a5a, 0xa02a4a, 0x5a0a2a, 0x8a2a6a] },
  canyonDusk: { skyTop: 0x120a3a, skyBot: 0xb04a8a, fog: 0x6a2a5a, fogFar: 4600, ground: 0x1a0a20, grid: 0xff7ac8, road: 0x483a4e, roadAlt: 0x564560, wall: 0x5a2a4a, neon: 0xff9ae8, edge: 0xffffff, accent: 0x6affff, sun: 0xffa0c8, bld: [0x9a4a6a, 0x7a3a5a, 0xc0607a, 0x5a2a4a, 0x8a4a7a] },
  canyonMars: { skyTop: 0x2a0a0a, skyBot: 0xd05a2a, fog: 0x8a3a1a, fogFar: 4600, ground: 0x200a05, grid: 0xff5a1a, road: 0x4a3a34, roadAlt: 0x584640, wall: 0x7a2a14, neon: 0xff6a2a, edge: 0xffe0a0, accent: 0x3affd0, sun: 0xffd08a, bld: [0xc0502a, 0x9a3a1e, 0xd8703a, 0x7a2c18, 0xb04a2a] },
  iceBlue: { skyTop: 0x0a2a5a, skyBot: 0x6ac0f0, fog: 0x5a9ac8, fogFar: 4800, ground: 0x0a2038, grid: 0xbfeaff, road: 0x4a6078, roadAlt: 0x587088, wall: 0x2a4a6a, neon: 0x4aeaff, edge: 0xffffff, accent: 0xff7a3a, sun: 0xffffff, bld: [0x8ad0f0, 0xaae4ff, 0x6ab8e0, 0xc8f0ff, 0x58a0d0] },
  iceMagenta: { skyTop: 0x120a2a, skyBot: 0x6a2a9a, fog: 0x3a1a5a, fogFar: 4800, ground: 0x0a0618, grid: 0xe07aff, road: 0x453f68, roadAlt: 0x524c78, wall: 0x2a1a50, neon: 0xe07aff, edge: 0x7affea, accent: 0xfff03a, sun: 0xffc8ff, bld: [0x9a7ae0, 0xb890ff, 0x7a5ac8, 0xd0b0ff, 0x6a4ab8] },
};
HAND[0].pal.fogFar = 4200;
PALS.cityNight = HAND[0].pal;

// 手作り3本 + 保存済みの生成コース(courses_data.js)を、slot 順に並べて20本にする
export const COURSES = HAND.concat(GEN_COURSES.map((c) => ({ ...c, pal: typeof c.pal === 'string' ? PALS[c.pal] : c.pal, style: c.style })))
  .sort((a, b) => a.slot - b.slot);
export const CUPS = ['CUP 1  RUSH', 'CUP 2  TWIST', 'CUP 3  SLICK', 'CUP 4  ZENITH'];

// ---- 骨組み(中心線・向き・バンク)を作る ----
export function buildTrack(def) {
  const raw = typeof def.points === 'function' ? def.points() : def.points;
  const curve = new THREE.CatmullRomCurve3(raw.map((p) => V(p[0], p[1], p[2])), true, 'centripetal');
  curve.arcLengthDivisions = 8000; curve.updateArcLengths();
  const length = curve.getLength();
  const N = Math.round(length / 10);
  const ds = length / N;
  const sp = curve.getSpacedPoints(N); // N+1(最後は最初と同じ)
  const P = new Float32Array(N * 3), T = new Float32Array(N * 3), R = new Float32Array(N * 3), U = new Float32Array(N * 3);
  const wrap = (i) => ((i % N) + N) % N;
  const tmp = V(0, 0, 0);
  const shift = (def.startShift || 0) % N;
  for (let i = 0; i < N; i++) { const q = sp[(i + shift) % N]; P[i * 3] = q.x; P[i * 3 + 1] = q.y; P[i * 3 + 2] = q.z; }
  for (let i = 0; i < N; i++) {
    const a = wrap(i - 1), b = wrap(i + 1);
    tmp.set(P[b * 3] - P[a * 3], P[b * 3 + 1] - P[a * 3 + 1], P[b * 3 + 2] - P[a * 3 + 2]).normalize();
    T[i * 3] = tmp.x; T[i * 3 + 1] = tmp.y; T[i * 3 + 2] = tmp.z;
  }
  // 水平方向の曲がり(右が正)
  const turn = new Float32Array(N), R0 = new Float32Array(N * 3);
  for (let i = 0; i < N; i++) {
    const tx = T[i * 3], tz = T[i * 3 + 2];
    const rl = Math.hypot(tx, tz) || 1; // R0 = normalize(T x Y) = (-tz, 0, tx)
    R0[i * 3] = -tz / rl; R0[i * 3 + 2] = tx / rl;
  }
  for (let i = 0; i < N; i++) {
    const a = wrap(i - 1), b = wrap(i + 1);
    const dx = T[b * 3] - T[a * 3], dz = T[b * 3 + 2] - T[a * 3 + 2];
    turn[i] = (dx * R0[i * 3] + dz * R0[i * 3 + 2]) / (2 * ds);
  }
  const sm = (arr, k) => { const o = new Float32Array(N); for (let i = 0; i < N; i++) { let s = 0; for (let j = -k; j <= k; j++) s += arr[wrap(i + j)]; o[i] = s / (2 * k + 1); } return o; };
  const turnS = sm(sm(turn, 9), 9);
  const gain = def.bankGain || 240, maxB = def.maxBank || 0.72;
  const bank = new Float32Array(N);
  for (let i = 0; i < N; i++) {
    bank[i] = Math.max(-maxB, Math.min(maxB, turnS[i] * gain));
    const cb = Math.cos(bank[i]), sb = Math.sin(bank[i]);
    const ux = R0[i * 3] * sb, uy = cb, uz = R0[i * 3 + 2] * sb;
    // R = normalize(T x up), U = R x T
    const tx = T[i * 3], ty = T[i * 3 + 1], tz = T[i * 3 + 2];
    let rx = ty * uz - tz * uy, ry = tz * ux - tx * uz, rz = tx * uy - ty * ux;
    const rl = Math.hypot(rx, ry, rz); rx /= rl; ry /= rl; rz /= rl;
    R[i * 3] = rx; R[i * 3 + 1] = ry; R[i * 3 + 2] = rz;
    U[i * 3] = ry * tz - rz * ty; U[i * 3 + 1] = rz * tx - rx * tz; U[i * 3 + 2] = rx * ty - ry * tx;
  }
  const halfW = def.halfW;
  // ギャップ(路面なし)とパッド
  const gap = new Uint8Array(N);
  const gaps = [];
  for (const g of def.gaps || []) { const i0 = Math.round(g.at * N); gaps.push({ i0, len: g.len }); for (let k = 0; k < g.len; k++) gap[wrap(i0 + k)] = 1; }
  const pads = [];
  for (const p of def.pads || []) pads.push({ type: p.type, i0: Math.round(p.at * N), len: p.len, l0: p.l[0], l1: p.l[1] });
  for (const g of gaps) pads.push({ type: 'jump', i0: wrap(g.i0 - 14), len: 4, l0: -halfW + 6, l1: halfW - 6 });
  // 前もって: パッドの上のサンプルに印を付ける(sample→pad)
  const padAt = new Int16Array(N).fill(-1);
  pads.forEach((p, pi) => { for (let k = 0; k < p.len; k++) padAt[wrap(p.i0 + k)] = pi; });
  let minY = 1e9, maxY = -1e9, minX = 1e9, maxX = -1e9, minZ = 1e9, maxZ = -1e9;
  for (let i = 0; i < N; i++) {
    minY = Math.min(minY, P[i * 3 + 1]); maxY = Math.max(maxY, P[i * 3 + 1]);
    minX = Math.min(minX, P[i * 3]); maxX = Math.max(maxX, P[i * 3]);
    minZ = Math.min(minZ, P[i * 3 + 2]); maxZ = Math.max(maxZ, P[i * 3 + 2]);
  }
  const tr = { def, N, ds, length, P, T, R, U, bank, halfW, gap, gaps, pads, padAt, wrap, minY, maxY, minX, maxX, minZ, maxZ, wallH: 5 };
  tr.stats = analyze(tr);
  return tr;
}

// 検査用: 最小半径・自己近接
export function analyze(tr) {
  const { N, ds, T, P } = tr;
  let minR = 1e9, minRi = 0, maxSlope = 0, minVR = 1e9;
  for (let i = 0; i < N; i++) {
    const j = (i + 1) % N;
    const a = Math.hypot(T[i * 3], T[i * 3 + 2]) || 1, b = Math.hypot(T[j * 3], T[j * 3 + 2]) || 1;
    const dot = Math.max(-1, Math.min(1, (T[i * 3] * T[j * 3] + T[i * 3 + 2] * T[j * 3 + 2]) / (a * b)));
    const r = ds / (Math.acos(dot) || 1e-9); // 水平方向の曲がり半径
    if (r < minR) { minR = r; minRi = i; }
    maxSlope = Math.max(maxSlope, Math.abs(T[i * 3 + 1]));
    const dv = Math.abs(Math.asin(T[j * 3 + 1]) - Math.asin(T[i * 3 + 1])) || 1e-9; // 縦方向の曲がり半径
    minVR = Math.min(minVR, ds / dv);
  }
  // 離れた区間どうしが近づく場所(立体交差の高さ確認)
  let minClear = 1e9, near = null;
  for (let i = 0; i < N; i += 2) for (let j = i + 60; j < N - 60 + (i < 60 ? 0 : 0); j += 2) {
    if (N - (j - i) < 60) continue;
    const dx = P[i * 3] - P[j * 3], dz = P[i * 3 + 2] - P[j * 3 + 2];
    if (dx * dx + dz * dz < 140 * 140) { const dy = Math.abs(P[i * 3 + 1] - P[j * 3 + 1]); if (dy < minClear) { minClear = dy; near = [i, j]; } }
  }
  return { N, length: Math.round(tr.length), minRadius: Math.round(minR), minRadiusAt: minRi, maxSlopeDeg: +(Math.asin(maxSlope) * 57.3).toFixed(1), minVerticalRadius: Math.round(minVR), crossingClearance: Math.round(minClear), crossingAt: near };
}

// 補間した点: サンプル i から f(0..1) 進んだ位置の、横 lat 高さ h
export function at(tr, i, f, lat, h, out) {
  const a = ((i % tr.N) + tr.N) % tr.N, b = (a + 1) % tr.N;
  const P = tr.P, R = tr.R, U = tr.U, g = 1 - f;
  const rx = R[a * 3] * g + R[b * 3] * f, ry = R[a * 3 + 1] * g + R[b * 3 + 1] * f, rz = R[a * 3 + 2] * g + R[b * 3 + 2] * f;
  const ux = U[a * 3] * g + U[b * 3] * f, uy = U[a * 3 + 1] * g + U[b * 3 + 1] * f, uz = U[a * 3 + 2] * g + U[b * 3 + 2] * f;
  out = out || [0, 0, 0];
  out[0] = P[a * 3] * g + P[b * 3] * f + rx * lat + ux * h;
  out[1] = P[a * 3 + 1] * g + P[b * 3 + 1] * f + ry * lat + uy * h;
  out[2] = P[a * 3 + 2] * g + P[b * 3 + 2] * f + rz * lat + uz * h;
  return out;
}

// ---- 路面・壁・ネオンのメッシュを作る ----
export function buildTrackMeshes(tr) {
  const pal = tr.def.pal, N = tr.N, w = tr.halfW, wallH = tr.wallH;
  const body = new GeoB(), glow = new GeoB();
  const cRoad = rgb(pal.road), cRoadAlt = rgb(pal.roadAlt), cWall = rgb(pal.wall), cNeon = rgb(pal.neon), cEdge = rgb(pal.edge), cAcc = rgb(pal.accent);
  const cUnder = mul(cWall, 0.55);
  const A = [0, 0, 0], B = [0, 0, 0], C = [0, 0, 0], D = [0, 0, 0];
  // 断面上の帯(lat0,h0)→(lat1,h1) を i0..i1 の間に張る
  const strip = (G, i, l0, h0, l1, h1, col, f0 = 0, f1 = 1) => {
    G.quad(at(tr, i, f0, l0, h0, [0, 0, 0]), at(tr, i, f1, l0, h0, [0, 0, 0]), at(tr, i, f1, l1, h1, [0, 0, 0]), at(tr, i, f0, l1, h1, [0, 0, 0]), col);
  };
  const ww = 2.6;
  for (let i = 0; i < N; i++) {
    const j = (i + 1) % N;
    if (tr.gap[i] || tr.gap[j]) continue;
    const alt = (Math.floor(i / 4) & 1) ? mul(cRoadAlt, 1.18) : mul(cRoad, 0.88);
    // 路面(横6枚。ふちほど少し暗く)
    const lanes = 6;
    for (let k = 0; k < lanes; k++) {
      const l0 = -w + (2 * w * k) / lanes, l1 = -w + (2 * w * (k + 1)) / lanes;
      const edgeDark = (k === 0 || k === lanes - 1) ? 0.82 : 1;
      strip(body, i, l0, 0, l1, 0, mul(alt, edgeDark * (k & 1 ? 1.04 : 0.97)));
    }
    // 壁(内側の面・天面・外側の面)
    for (const s of [-1, 1]) {
      strip(body, i, s * w, 0, s * w, wallH, mul(cWall, 1.15));
      strip(body, i, s * w, wallH, s * (w + ww), wallH, mul(cWall, 1.4));
      strip(body, i, s * (w + ww), wallH, s * (w + ww), -2, cWall);
    }
    strip(body, i, -w - ww, -2, w + ww, -2, cUnder); // 裏
    // ネオン: 壁の内側のライン
    for (const s of [-1, 1]) {
      strip(glow, i, s * (w - 0.05), 2.1, s * (w - 0.05), 3.0, cNeon);
      strip(glow, i, s * (w - 0.9), 0.05, s * (w - 0.3), 0.05, cEdge);
    }
    // 中央の破線と、左右のレーン線(うすい)
    if (((i >> 1) & 1) === 0) strip(glow, i, -0.35, 0.06, 0.35, 0.06, mul(cAcc, 0.9));
    if ((i & 3) < 2) for (const s of [-1, 1]) strip(glow, i, s * w * 0.5 - 0.15, 0.05, s * w * 0.5 + 0.15, 0.05, mul(cNeon, 0.32));
    // 区間ごとの目印(100サンプルおきに横線)
    if (i % 50 === 0) strip(glow, i, -w + 3, 0.05, w - 3, 0.05, mul(cEdge, 0.5), 0, 0.12);
  }
  // ギャップの端(断面のフタ)
  for (let i = 0; i < N; i++) {
    const j = (i + 1) % N;
    if (!tr.gap[i] && tr.gap[j]) capAt(i, 1.0);
    if (tr.gap[i] && !tr.gap[j]) capAt(j, 0.0);
  }
  function capAt(i, f) {
    const cc = mul(cWall, 0.8);
    body.quad(at(tr, i, f, -w - ww, -2, A), at(tr, i, f, w + ww, -2, B), at(tr, i, f, w + ww, 0, C), at(tr, i, f, -w - ww, 0, D), cc);
    for (const s of [-1, 1]) body.quad(at(tr, i, f, s * w, 0, [0, 0, 0]), at(tr, i, f, s * (w + ww), 0, [0, 0, 0]), at(tr, i, f, s * (w + ww), wallH, [0, 0, 0]), at(tr, i, f, s * w, wallH, [0, 0, 0]), cc);
    // 縁の発光(ここでジャンプが終わる/始まる)
    glow.quad(at(tr, i, f, -w, 0.1, [0, 0, 0]), at(tr, i, f, w, 0.1, [0, 0, 0]), at(tr, i, f, w, 0.9, [0, 0, 0]), at(tr, i, f, -w, 0.9, [0, 0, 0]), mul(cAcc, 0.8));
  }
  // スタートライン(チェッカー)
  {
    const cells = 12, rows = 2;
    for (let r = 0; r < rows; r++) for (let k = 0; k < cells; k++) {
      const l0 = -w + (2 * w * k) / cells, l1 = -w + (2 * w * (k + 1)) / cells;
      const f0 = r * 0.5, f1 = f0 + 0.5;
      const col = ((k + r) & 1) ? [1, 1, 1] : [0.05, 0.05, 0.08];
      glow.quad(at(tr, 0, f0, l0, 0.08, [0, 0, 0]), at(tr, 0, f1, l0, 0.08, [0, 0, 0]), at(tr, 0, f1, l1, 0.08, [0, 0, 0]), at(tr, 0, f0, l1, 0.08, [0, 0, 0]), col);
    }
  }
  // パッド(ブースト/ジャンプ/回復)
  for (const p of tr.pads) {
    const col = p.type === 'boost' ? rgb(0xffa21a) : p.type === 'jump' ? rgb(0xff3a6a) : p.type === 'slip' ? (tr.def.style === 'ice' ? rgb(0x9fe8ff) : rgb(0xb06aff)) : rgb(0x3aff8a);
    const colDim = mul(col, 0.35);
    // 下地
    for (let k = 0; k < p.len; k++) strip(glow, p.i0 + k, p.l0, 0.07, p.l1, 0.07, colDim);
    if (p.type === 'slip') {
      // 滑る路面: ななめの筋(氷は白っぽく、オイルは紫)
      for (let k = 0; k < p.len; k++) {
        const i = p.i0 + k;
        strip(glow, i, p.l0, 0.09, p.l1, 0.09, mul(col, 0.22));
        const a = (k & 1) ? 0.15 : 0.55;
        glow.quad(at(tr, i, a, p.l0 + 2, 0.12, [0, 0, 0]), at(tr, i, a + 0.2, p.l0 + 2, 0.12, [0, 0, 0]), at(tr, i, a + 0.45, p.l1 - 2, 0.12, [0, 0, 0]), at(tr, i, a + 0.25, p.l1 - 2, 0.12, [0, 0, 0]), mul(col, 0.7));
      }
      continue;
    }
    if (p.type === 'recover') {
      // 回復: 横縞
      for (let k = 0; k < p.len; k += 2) strip(glow, p.i0 + k, p.l0 + 1, 0.1, p.l1 - 1, 0.1, col, 0.2, 0.7);
      continue;
    }
    // 矢じるし(V字)
    const lm = (p.l0 + p.l1) / 2, nChev = Math.max(2, p.len);
    for (let k = 0; k < nChev; k++) {
      const i = p.i0 + k;
      const tipF = 0.95, backF = 0.15, th = 0.28;
      // 左の腕と右の腕(後ろ側から先端へ)
      for (const s of [-1, 1]) {
        const lo = s < 0 ? p.l0 + 1.5 : p.l1 - 1.5;
        glow.quad(at(tr, i, backF, lo, 0.12, [0, 0, 0]), at(tr, i, tipF, lm, 0.12, [0, 0, 0]),
          at(tr, i, tipF - th * 0.4, lm, 0.12, [0, 0, 0]), at(tr, i, backF - 0.01, lo + s * 0, 0.12, [0, 0, 0]), col);
        glow.tri(at(tr, i, backF, lo, 0.12, [0, 0, 0]), at(tr, i, tipF, lm, 0.12, [0, 0, 0]), at(tr, i, backF, lo + (lm - lo) * 0.28, 0.12, [0, 0, 0]), col);
      }
    }
  }
  return { body: body.build(), glow: glow.build() };
}

// ミニマップ用の2D輪郭(0..1に正規化)
export function minimapPath(tr, size) {
  const pad = 14, sx = (size - pad * 2) / (tr.maxX - tr.minX || 1), sz = (size - pad * 2) / (tr.maxZ - tr.minZ || 1);
  const s = Math.min(sx, sz);
  const ox = pad + ((size - pad * 2) - (tr.maxX - tr.minX) * s) / 2, oz = pad + ((size - pad * 2) - (tr.maxZ - tr.minZ) * s) / 2;
  const pts = [];
  for (let i = 0; i < tr.N; i += 4) pts.push([ox + (tr.P[i * 3] - tr.minX) * s, oz + (tr.P[i * 3 + 2] - tr.minZ) * s]);
  return { pts, map: (x, z) => [ox + (x - tr.minX) * s, oz + (z - tr.minZ) * s] };
}
