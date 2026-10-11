// 機体の定義(性能)と、ポリゴンの機体モデル
import * as THREE from '../lib/three.module.js';
import { GeoB, rgb, mul } from './geo.js';

// 性能: top=最高速(u/s) accel=加速 turn=旋回(rad/s) grip=横滑りの収まりやすさ(0.8台=すぐ収まる) body=頑丈さ boost=ブーストの強さ
export const MACHINES = [
  { id: 'aero', name: 'AERO-POLY 17', jp: 'エアロポリ 17', note: '軽くてバランス型。迷ったらこれ。', num: '17', body: 0x3b7be8, accent: 0xff8a2a, glow: 0x36e8ff,
    shape: { L: 9.0, w: 1.85, h: 1.1, cockpit: 'canopy', eng: { r: 0.62, len: 2.4, x: 2.35, y: 0.55 } },
    top: 318, accel: 150, turn: 2.1, grip: 0.90, durab: 1.0, boost: 1.0, stars: { speed: 3, accel: 3, handling: 3, body: 3 } },
  { id: 'viper', name: 'VIPER-9', jp: 'バイパー 9', note: '最高速が高い。曲がりは重め。', num: '9', body: 0x1fa05a, accent: 0xd8ff3a, glow: 0x7dff4a,
    shape: { L: 10.8, w: 1.5, h: 0.9, cockpit: 'canopy', eng: { r: 0.5, len: 3.2, x: 2.0, y: 0.45 } },
    top: 346, accel: 118, turn: 1.8, grip: 0.92, durab: 0.85, boost: 1.1, stars: { speed: 5, accel: 2, handling: 2, body: 2 } },
  { id: 'ironclad', name: 'IRONCLAD 44', jp: 'アイアンクラッド 44', note: '重くて頑丈。加速が強く壁に強い。', num: '44', body: 0x2a4fb0, accent: 0xff8a1e, glow: 0xffa040,
    shape: { L: 9.2, w: 2.2, h: 1.25, cockpit: 'armor', eng: { r: 0.95, len: 3.0, x: 2.1, y: 1.15 } },
    top: 300, accel: 168, turn: 2.0, grip: 0.88, durab: 1.55, boost: 0.9, stars: { speed: 2, accel: 4, handling: 3, body: 5 } },
  { id: 'pixie', name: 'PIXIE-R', jp: 'ピクシー R', note: 'よく曲がる。ぶつかると弱い。', num: '7', body: 0xff5ab8, accent: 0xfff04a, glow: 0xff7af0,
    shape: { L: 7.6, w: 1.55, h: 0.95, cockpit: 'canopy', eng: { r: 0.5, len: 1.9, x: 2.0, y: 0.5 } },
    top: 306, accel: 178, turn: 2.55, grip: 0.86, durab: 0.7, boost: 1.0, stars: { speed: 2, accel: 5, handling: 5, body: 1 } },
];

export const RIVALS = [
  { name: 'NOVA', hue: 150, sat: 1.0, mach: 1, body: 0xc8d4ff, accent: 0x4a6aff, skill: 1.0, lane: -12 },
  { name: 'REX', hue: 330, sat: 1.1, mach: 0, body: 0x2a2a34, accent: 0xff7a1a, skill: 0.985, lane: 14 },
  { name: 'ZEN', hue: 60, sat: 1.0, mach: 2, body: 0xe8e0c8, accent: 0x2ad0a0, skill: 0.97, lane: -20 },
  { name: 'MIKA', hue: 300, sat: 1.15, mach: 3, body: 0xf4f4ff, accent: 0xff2a6a, skill: 0.955, lane: 6 },
  { name: 'GRIM', hue: 255, sat: 0.9, mach: 0, body: 0x6a2a8a, accent: 0xc8ff2a, skill: 0.94, lane: 20 },
  { name: 'ECHO', hue: 20, sat: 1.1, mach: 1, body: 0xff8a2a, accent: 0x2a2a34, skill: 0.925, lane: -6 },
  { name: 'JUNO', hue: 185, sat: 1.0, mach: 3, body: 0x2ad0e0, accent: 0xffffff, skill: 0.91, lane: 0 },
];

// 機体モデル(低ポリのホバーボート型)。前は -Z、上は +Y、右は +X
function hash(a, b, c) { let h = (a * 374761393 + b * 668265263 + c * 2147483647) | 0; h = (h ^ (h >>> 13)) * 1274126177 | 0; return ((h ^ (h >>> 16)) >>> 0) / 4294967296; }

function numberPlate(txt, color) {
  const cv = document.createElement('canvas'); cv.width = cv.height = 128; const g = cv.getContext('2d');
  g.font = 'italic 900 92px Arial, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.lineWidth = 10; g.strokeStyle = 'rgba(0,0,0,.55)'; g.strokeText(txt, 64, 70); g.fillStyle = color; g.fillText(txt, 64, 70);
  const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

// ================= Meshy の機体モデル(GLB) =================
// assets/machines/<id>_hi.glb(プレイヤー・メニュー用 約1.4万三角形)と _lo.glb(ライバル用 約4500三角形)。
// 作り方は 素材制作\make_machine_glb.py。頂点色 RGBA: RGB=もとの色 / A=アクセント塗りの場所。読み込めなければ従来のポリゴンの機体を使う。
const ASSETS = {};
export function parseGLB(buf) {
  const dv = new DataView(buf);
  if (dv.getUint32(0, true) !== 0x46546c67) throw new Error('not glb');
  const jl = dv.getUint32(12, true); const json = JSON.parse(new TextDecoder().decode(new Uint8Array(buf, 20, jl)));
  const bo = 20 + jl + 8; // BINチャンクの中身
  const prim = json.meshes[0].primitives[0];
  const read = (ai) => {
    const a = json.accessors[ai], bv = json.bufferViews[a.bufferView], off = bo + (bv.byteOffset || 0) + (a.byteOffset || 0);
    const nc = { SCALAR: 1, VEC2: 2, VEC3: 3, VEC4: 4 }[a.type], n = a.count * nc;
    if (a.componentType === 5126) return { data: new Float32Array(buf.slice(off, off + n * 4)), nc, count: a.count };
    if (a.componentType === 5125) return { data: new Uint32Array(buf.slice(off, off + n * 4)), nc, count: a.count };
    if (a.componentType === 5123) return { data: new Uint16Array(buf.slice(off, off + n * 2)), nc, count: a.count };
    if (a.componentType === 5121) { const u = new Uint8Array(buf.slice(off, off + n)); return { data: u, nc, count: a.count, norm: true }; }
    throw new Error('component ' + a.componentType);
  };
  const pos = read(prim.attributes.POSITION), idx = read(prim.indices);
  const col = prim.attributes.COLOR_0 !== undefined ? read(prim.attributes.COLOR_0) : null;
  const uv = prim.attributes.TEXCOORD_0 !== undefined ? read(prim.attributes.TEXCOORD_0) : null;
  let image = null;   // 埋め込みのテクスチャ画像(JPEG/PNG)。make_machine_glb_tex.py の xl だけが持つ
  const mat = prim.material !== undefined ? json.materials[prim.material] : null, ti = mat && mat.pbrMetallicRoughness && mat.pbrMetallicRoughness.baseColorTexture;
  if (ti) { const im = json.images[json.textures[ti.index].source], bv = json.bufferViews[im.bufferView]; image = { bytes: new Uint8Array(buf.slice(bo + (bv.byteOffset || 0), bo + (bv.byteOffset || 0) + bv.byteLength)), mime: im.mimeType || 'image/jpeg' }; }
  return { pos: pos.data, col: col ? col.data : null, colNC: col ? col.nc : 4, uv: uv ? uv.data : null, image, idx: idx.data, n: pos.count };
}
// PC は大きくてもきれいな版(xl 約5〜6万三角形)を使う。スマホ・タブレットは軽い版(hi/lo)。?q=high / ?q=low で切り替えて確かめられる
const TOUCH_DEV = /iPad|iPhone|iPod|Android/.test(navigator.userAgent) || (navigator.maxTouchPoints > 1 && /Mac/.test(navigator.platform));
export const HIGH_QUALITY = /[?&]q=high/.test(location.search) || (!TOUCH_DEV && !/[?&]q=low/.test(location.search));
// スマホは、自分の機体とメニューにテクスチャつきの中間版 md(約4.5万三角形・1024)、ライバルは軽い lo(頂点色)。PCは xl と hi
export const PLAYER_LOD = HIGH_QUALITY ? 'xl' : 'md', RIVAL_LOD = HIGH_QUALITY ? 'hi' : 'lo';
export const machineAssetsReady = (async () => {
  const jobs = [];
  for (const m of MACHINES) for (const lod of (HIGH_QUALITY ? ['xl', 'hi'] : ['md', 'lo'])) {
    jobs.push(fetch(`assets/machines/${m.id}_${lod}.glb`).then((r) => { if (!r.ok) throw new Error(r.status); return r.arrayBuffer(); })
      .then(async (b) => { const g = prepareAsset(parseGLB(b)); if (g.image && g.uv) { const bmp = await createImageBitmap(new Blob([g.image.bytes], { type: g.image.mime })); const tx = new THREE.Texture(bmp); tx.flipY = false; tx.colorSpace = THREE.SRGBColorSpace; tx.anisotropy = 8; tx.needsUpdate = true; g.tex = tx; } (ASSETS[m.id] = ASSETS[m.id] || {})[lod] = g; }).catch((e) => { console.warn('機体モデルを読めない', m.id, lod, e); }));
  }
  await Promise.all(jobs);
})();
// 後ろのエンジン位置・上面の高さを、形から自動で出す(炎・ゼッケン用)
function prepareAsset(g) {
  const p = g.pos, n = g.n; let zmin = 1e9, zmax = -1e9, xmax = 0;
  for (let i = 0; i < n; i++) { const z = p[i * 3 + 2], x = Math.abs(p[i * 3]); if (z < zmin) zmin = z; if (z > zmax) zmax = z; if (x > xmax) xmax = x; }
  const L = zmax - zmin, rear = zmax - L * 0.05;
  const left = { x: 0, y: 0, c: 0, ymin: 1e9, ymax: -1e9 }, right = { x: 0, y: 0, c: 0, ymin: 1e9, ymax: -1e9 }, mid = { x: 0, y: 0, c: 0, ymin: 1e9, ymax: -1e9 };
  for (let i = 0; i < n; i++) {
    if (p[i * 3 + 2] < rear) continue; const x = p[i * 3], y = p[i * 3 + 1];
    const t = x < -xmax * 0.2 ? left : x > xmax * 0.2 ? right : mid; t.x += x; t.y += y; t.c++; t.ymin = Math.min(t.ymin, y); t.ymax = Math.max(t.ymax, y);
  }
  const flames = [];
  const add = (t) => { if (t.c > 15) flames.push({ x: t.x / t.c, y: t.y / t.c, r: Math.max(0.25, (t.ymax - t.ymin) / 2) }); };
  if (left.c > 15 && right.c > 15) { add(left); add(right); } else add({ x: left.x + right.x + mid.x, y: left.y + right.y + mid.y, c: left.c + right.c + mid.c, ymin: Math.min(left.ymin, right.ymin, mid.ymin), ymax: Math.max(left.ymax, right.ymax, mid.ymax) });
  let top = -1e9; for (let i = 0; i < n; i++) { const x = Math.abs(p[i * 3]), z = p[i * 3 + 2], u = (z - zmin) / L; if (x < xmax * 0.18 && u > 0.3 && u < 0.5) top = Math.max(top, p[i * 3 + 1]); }
  g.info = { zmin, zmax, L, flames, top, topZ: zmin + L * 0.4 };
  return g;
}
// 色違い: テクスチャの色(sRGB)の色相を回す(明暗・模様はそのまま)。deg=回す角度、sat=彩度の倍率
function hueShift(r, g, b, deg, sat) {
  const a = deg * Math.PI / 180, c = Math.cos(a), s = Math.sin(a);
  const R = (0.213 + c * 0.787 - s * 0.213) * r + (0.715 - c * 0.715 - s * 0.715) * g + (0.072 - c * 0.072 + s * 0.928) * b;
  const G = (0.213 - c * 0.213 + s * 0.143) * r + (0.715 + c * 0.285 + s * 0.140) * g + (0.072 - c * 0.072 - s * 0.283) * b;
  const B = (0.213 - c * 0.213 - s * 0.787) * r + (0.715 - c * 0.715 + s * 0.715) * g + (0.072 + c * 0.928 + s * 0.072) * b;
  const l = 0.3 * R + 0.59 * G + 0.11 * B, k = (v) => Math.min(1, Math.max(0, l + (v - l) * sat));
  return [k(R), k(G), k(B)];
}
function makeGlbShip(m, paint, lod) {
  const A = ASSETS[m.id]; const a = A && (A[lod] || A.md || A.hi || A.xl || A.lo); if (!a) return null;
  const body = rgb(paint ? paint.body : m.body), acc = rgb(paint ? paint.accent : m.accent), glowC = rgb(m.glow);
  if (!a.geo) { const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(a.pos, 3)); g.setIndex(new THREE.BufferAttribute(a.idx, 1)); if (a.uv) g.setAttribute('uv', new THREE.BufferAttribute(a.uv, 2)); g.computeVertexNormals(); a.geo = g; }
  const group = new THREE.Group();
  if (a.tex && !paint) {
    // PC のプレイヤー・メニュー: Meshy のテクスチャそのままで描く(2048の絵)
    group.add(new THREE.Mesh(a.geo, new THREE.MeshStandardMaterial({ map: a.tex, roughness: 0.5, metalness: 0.25, side: THREE.DoubleSide })));
  } else {
    // 頂点色の版(スマホ・ライバル): 元のテクスチャの色を焼き込んである。塗り替え(paint)のときは、本体色↔アクセント色をアクセント塗りの場所で混ぜ、元の明暗(模様)を乗せる
    const col = new Float32Array(a.n * 3), nc = a.colNC;
    for (let i = 0; i < a.n; i++) {
      const mk = a.col[i * nc + 3] / 255, br = Math.pow(a.col[i * nc] / 255, 2.2), bg = Math.pow(a.col[i * nc + 1] / 255, 2.2), bb = Math.pow(a.col[i * nc + 2] / 255, 2.2);   // テクスチャの色(sRGB)を、three の頂点色(線形)に直す
      if (paint && paint.hue != null) { const c = hueShift(a.col[i * nc] / 255, a.col[i * nc + 1] / 255, a.col[i * nc + 2] / 255, paint.hue, paint.sat || 1); col[i * 3] = Math.pow(c[0], 2.2); col[i * 3 + 1] = Math.pow(c[1], 2.2); col[i * 3 + 2] = Math.pow(c[2], 2.2); }
      else if (!paint) { col[i * 3] = br; col[i * 3 + 1] = bg; col[i * 3 + 2] = bb; }
      else { const lum = Math.min(1.25, 0.35 + (0.3 * br + 0.59 * bg + 0.11 * bb) * 1.25); col[i * 3] = (body[0] * (1 - mk) + acc[0] * mk) * lum; col[i * 3 + 1] = (body[1] * (1 - mk) + acc[1] * mk) * lum; col[i * 3 + 2] = (body[2] * (1 - mk) + acc[2] * mk) * lum; }
    }
    const g = a.geo.clone(); g.setAttribute('color', new THREE.BufferAttribute(col, 3));
    group.add(new THREE.Mesh(g, new THREE.MeshStandardMaterial({ vertexColors: true, flatShading: a.n < 15000, roughness: 0.45, metalness: 0.3, side: THREE.DoubleSide })));   // 軽い版はフラットに
  }
  const I = a.info;
  // ゼッケン
  const pl = new THREE.Mesh(new THREE.PlaneGeometry(1.9, 1.9), new THREE.MeshBasicMaterial({ map: numberPlate(m.num, '#ffffff'), transparent: true, depthWrite: false }));
  pl.rotation.x = -Math.PI / 2; pl.position.set(0, I.top + 0.06, I.topZ); pl.scale.set(0.9, 0.9, 1); group.add(pl);
  // 炎
  const flames = [], fm = new THREE.MeshBasicMaterial({ color: m.glow, transparent: true, opacity: 0.85, blending: THREE.AdditiveBlending, depthWrite: false });
  const fg = new THREE.ConeGeometry(0.5, 1.0, 6, 1, true); fg.rotateX(Math.PI / 2); fg.translate(0, 0, 0.5);
  let fb = 0.9;
  for (const e of I.flames) { const fs = Math.min(0.95, Math.max(0.5, e.r / 0.5 * 0.7)); fb = fs; const f = new THREE.Mesh(fg, fm); f.position.set(e.x, e.y, I.zmax + 0.05); f.scale.set(fs, fs, 1); group.add(f); flames.push(f); }
  group.userData.flames = flames; group.userData.len = I.L; group.userData.flameBase = fb; group.userData.glb = true;
  return group;
}
export function makeShipModel(m, paint, lod = PLAYER_LOD) { return makeGlbShip(m, paint, lod) || makeShipModelProc(m, paint); }

export function makeShipModelProc(m, paint) {
  const s = m.shape, body = rgb(paint ? paint.body : m.body), acc = rgb(paint ? paint.accent : m.accent), glowC = rgb(m.glow);
  const G = new GeoB(), E = new GeoB();
  const L = s.L, zN = -L / 2, zR = L / 2;
  const dark = [0.12, 0.13, 0.2];
  // ---- 船体: 8角の輪を並べる。面ごとに色をばらして「三角面の多色」を出す ----
  const rings = [ // [z, 幅, 高さ, 中心高さ]
    [zN, 0.28, 0.26, -0.05], [zN + L * 0.07, 0.62, 0.5, 0.0], [zN + L * 0.2, 0.9, 0.82, 0.05], [zN + L * 0.45, 1.0, 1.0, 0.1],
    [zN + L * 0.75, 1.0, 0.95, 0.1], [zR, 0.84, 0.8, 0.05],
  ];
  const ringPts = (r) => {
    const [z, wm, hm, cy] = r, w = s.w * wm, h = s.h * hm, out = [];
    for (let k = 0; k < 8; k++) {
      const a = (k / 8) * Math.PI * 2 + Math.PI / 8, cx = Math.cos(a), sy = Math.sin(a);
      const x = w * Math.sign(cx) * Math.pow(Math.abs(cx), 0.62), y = (sy >= 0 ? h : h * 0.55) * Math.sign(sy) * Math.pow(Math.abs(sy), 0.62);
      out.push([x, cy + y, z]);
    }
    return out;
  };
  const shadeOf = (e) => [0.85, 1.12, 1.18, 1.0, 0.7, 0.5, 0.5, 0.7][e];
  const R = rings.map(ringPts);
  const white = [0.95, 0.97, 1.0];
  for (let k = 0; k < R.length - 1; k++) for (let e = 0; e < 8; e++) {
    const e2 = (e + 1) % 8, hh = hash(k, e, 7);
    let c = body; const f = shadeOf(e) * (0.86 + hh * 0.3);
    if (e <= 3 && hh < 0.28 && k >= 1) c = acc; else if (e <= 3 && hh > 0.86) c = mul(body, 1.35);
    const col = mul(c, f);
    if ((e === 1 || e === 2) && k >= 1 && k <= 3) { G.quad(R[k][e], R[k][e2], R[k + 1][e2], R[k + 1][e], mul(white, 0.9 + hh * 0.2)); continue; }
    const c2 = mul(hash(k, e, 3) < 0.25 ? acc : body, f * (0.9 + hash(k, e, 5) * 0.25));
    G.tri(R[k][e], R[k][e2], R[k + 1][e2], col); G.tri(R[k][e], R[k + 1][e2], R[k + 1][e], c2);
  }
  { const r = R[R.length - 1]; for (let e = 1; e < 7; e++) G.tri(r[0], r[e], r[e + 1], mul(body, 0.3)); }
  // 先端のライト
  { const r = R[2]; E.quad([r[3][0], r[3][1] - 0.02, r[3][2] - 0.01], [r[4][0], r[4][1] - 0.02, r[4][2] - 0.01], [r[4][0], r[4][1] + 0.12, r[4][2] - 0.01], [r[3][0], r[3][1] + 0.12, r[3][2] - 0.01], glowC); }
  // ---- 左右のエンジン(六角柱) ----
  const eg = s.eng;
  const prism = (cx, cy, z0, z1, r, col, intake) => {
    const sides = 6, ring = (z, rr) => { const o = []; for (let k = 0; k < sides; k++) { const a = (k / sides) * Math.PI * 2 + Math.PI / 6; o.push([cx + Math.cos(a) * rr, cy + Math.sin(a) * rr, z]); } return o; };
    const A = ring(z0, r * 0.92), B = ring(z0 + (z1 - z0) * 0.18, r), C = ring(z1, r * 0.98);
    for (let k = 0; k < sides; k++) {
      const k2 = (k + 1) % sides, f = [0.9, 1.15, 0.9, 0.55, 0.45, 0.6][k];
      G.quad(A[k], A[k2], B[k2], B[k], mul(col, f * 0.8));
      G.quad(B[k], B[k2], C[k2], C[k], k === 0 ? mul(acc, 0.9) : mul(col, f));
    }
    for (let k = 1; k < sides - 1; k++) G.tri(A[0], A[k + 1], A[k], intake);
    for (let k = 1; k < sides - 1; k++) E.tri(C[0], C[k], C[k + 1], glowC);
    for (let q = -1; q <= 1; q++) G.quad([cx + q * r * 0.32 - 0.04, cy - r * 0.5, z0 - 0.02], [cx + q * r * 0.32 + 0.04, cy - r * 0.5, z0 - 0.02], [cx + q * r * 0.32 + 0.04, cy + r * 0.5, z0 - 0.02], [cx + q * r * 0.32 - 0.04, cy + r * 0.5, z0 - 0.02], [0.35, 0.4, 0.6]);
  };
  const eCol = mul(body, 0.62);
  for (const sd of [-1, 1]) {
    const ex = sd * eg.x, z1 = zR + 0.5, z0 = z1 - eg.len;
    prism(ex, eg.y, z0, z1, eg.r, eCol, dark);
    G.quad([sd * s.w * 0.7, eg.y - eg.r * 0.4, z0 + 0.3], [ex, eg.y - eg.r * 0.6, z0 + 0.3], [ex, eg.y - eg.r * 0.6, z1 - 0.4], [sd * s.w * 0.7, eg.y - eg.r * 0.4, z1 - 0.4], mul(body, 0.5));
  }
  const group = new THREE.Group();
  const std = (col, op) => new THREE.MeshStandardMaterial({ color: col, flatShading: true, roughness: 0.4, metalness: 0.4, transparent: !!op, opacity: op || 1 });
  group.add(new THREE.Mesh(G.build(), new THREE.MeshStandardMaterial({ vertexColors: true, flatShading: true, roughness: 0.45, metalness: 0.3, side: THREE.DoubleSide })));
  group.add(new THREE.Mesh(E.build(), new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.DoubleSide })));
  // ---- 操縦席 or 砲塔(飾り) ----
  const topY = s.h * 1.02 + 0.1, cz = zN + L * 0.52;
  const accHex = new THREE.Color(acc[0], acc[1], acc[2]), bodyHex = new THREE.Color(body[0] * 0.8, body[1] * 0.8, body[2] * 0.8);
  // 閉じたキャノピー(人は乗せない)。重量型は暗い色のガラスと装甲のこぶ
  {
    const heavy = s.cockpit === 'armor';
    const dome = new THREE.Mesh(new THREE.SphereGeometry(1, 7, 4, 0, Math.PI * 2, 0, Math.PI / 2), std(heavy ? 0x23406a : 0x9fdcff, heavy ? 0.78 : 0.62));
    dome.scale.set(s.w * (heavy ? 0.55 : 0.62), s.h * (heavy ? 0.7 : 0.95), L * (heavy ? 0.17 : 0.2)); dome.position.set(0, topY - 0.15, cz); group.add(dome);
    if (heavy) {
      const hump = new THREE.Mesh(new THREE.CylinderGeometry(s.w * 0.5, s.w * 0.8, 0.55, 6), std(bodyHex)); hump.position.set(0, topY + 0.15, cz + L * 0.2); group.add(hump);
      const plate = new THREE.Mesh(new THREE.CylinderGeometry(s.w * 0.36, s.w * 0.5, 0.3, 6), std(accHex)); plate.position.set(0, topY + 0.5, cz + L * 0.2); group.add(plate);
    }
    const fin = new THREE.Mesh(new THREE.ConeGeometry(0.28, 1.5, 4), std(accHex)); fin.rotation.x = Math.PI / 2 + 0.25; fin.position.set(0, topY + 0.45, zR - 0.4); group.add(fin);
  }
  // ---- ゼッケン ----
  {
    const pl = new THREE.Mesh(new THREE.PlaneGeometry(1.9, 1.9), new THREE.MeshBasicMaterial({ map: numberPlate(m.num, '#ffffff'), transparent: true, depthWrite: false }));
    pl.rotation.x = -Math.PI / 2; pl.position.set(0, s.h * 0.96 + 0.2, zN + L * 0.27); pl.scale.set(1.15, 1.15, 1); group.add(pl);
  }
  // ---- 炎 ----
  const flames = [];
  const fm = new THREE.MeshBasicMaterial({ color: m.glow, transparent: true, opacity: 0.85, blending: THREE.AdditiveBlending, depthWrite: false });
  const fg = new THREE.ConeGeometry(0.5, 1.0, 6, 1, true);
  fg.rotateX(Math.PI / 2); fg.translate(0, 0, 0.5);
  const fs = eg.r / 0.5 * 0.9;
  for (const sd of [-1, 1]) {
    const f = new THREE.Mesh(fg, fm); f.position.set(sd * eg.x, eg.y, zR + 0.55); f.scale.set(fs, fs, 1); group.add(f); flames.push(f);
  }
  group.userData.flames = flames; group.userData.len = L; group.userData.flameBase = fs;
  return group;
}

// 影(丸い暗い円)
export function makeShadow() {
  const g = new THREE.CircleGeometry(3.2, 10); g.rotateX(-Math.PI / 2);
  return new THREE.Mesh(g, new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.4, depthWrite: false }));
}
