// 背景(空・地面・街/岩/氷)・門・スピード線・火花
import * as THREE from '../lib/three.module.js';
import { GeoB, rgb, mul, mix, rng } from './geo.js';
import { at } from './course.js';

function windowTexture(pal) {
  const c = document.createElement('canvas'); c.width = c.height = 128;
  const g = c.getContext('2d');
  g.fillStyle = '#10102a'; g.fillRect(0, 0, 128, 128);
  const R = rng(5), lit = ['#ffd878', '#8af0ff', '#ff9ae8', '#fff3c0'];
  for (let y = 0; y < 8; y++) for (let x = 0; x < 8; x++) {
    if (R() < 0.55) { g.fillStyle = lit[Math.floor(R() * lit.length)]; g.globalAlpha = 0.55 + R() * 0.45; g.fillRect(x * 16 + 3, y * 16 + 4, 10, 8); }
  }
  g.globalAlpha = 1;
  const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.magFilter = THREE.NearestFilter; t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

export function orientedBox(G, c, r, u, t, sx, sy, sz, col) {
  // c=底面中心、r=横、u=上、t=前(いずれも単位ベクトル)
  const P = (a, b, d) => [c[0] + r[0] * a + u[0] * b + t[0] * d, c[1] + r[1] * a + u[1] * b + t[1] * d, c[2] + r[2] * a + u[2] * b + t[2] * d];
  const x = sx / 2, z = sz / 2, y = sy;
  const p000 = P(-x, 0, -z), p100 = P(x, 0, -z), p110 = P(x, y, -z), p010 = P(-x, y, -z), p001 = P(-x, 0, z), p101 = P(x, 0, z), p111 = P(x, y, z), p011 = P(-x, y, z);
  G.quad(p001, p101, p111, p011, mul(col, 0.9)); G.quad(p100, p000, p010, p110, mul(col, 0.7));
  G.quad(p101, p100, p110, p111, mul(col, 0.8)); G.quad(p000, p001, p011, p010, mul(col, 0.6)); G.quad(p011, p111, p110, p010, mul(col, 1.1));
}

export function buildScenery(scene, tr, quality = 1) {
  const pal = tr.def.pal, style = tr.def.style, R = rng(tr.def.seed * 7 + 3);
  const group = new THREE.Group(); scene.add(group);
  const groundY = tr.minY - 90;
  scene.background = new THREE.Color(pal.fog);
  scene.fog = new THREE.Fog(pal.fog, 260, pal.fogFar);

  // 空(グラデーションの半球)
  {
    const g = new THREE.SphereGeometry(7000, 20, 14);
    const pos = g.attributes.position, col = [];
    const top = rgb(pal.skyTop), bot = rgb(pal.skyBot);
    for (let i = 0; i < pos.count; i++) { const y = pos.getY(i) / 7000, t = Math.pow(Math.max(0, Math.min(1, y * 1.15 + 0.08)), 0.7); const c = mix(bot, top, t); col.push(c[0], c[1], c[2]); }
    g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
    const m = new THREE.Mesh(g, new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.BackSide, fog: false, depthWrite: false }));
    m.renderOrder = -10; m.userData.sky = true; group.add(m);
    // 太陽(多角形の円盤)
    const sun = new THREE.Mesh(new THREE.CircleGeometry(style === 'ice' ? 380 : 620, 28), new THREE.MeshBasicMaterial({ color: pal.sun, fog: false, transparent: true, opacity: 0.92, depthWrite: false }));
    sun.position.set(-3200, style === 'ice' ? 1500 : 650, -5200); sun.lookAt(0, 0, 0); sun.userData.sky = true; sun.renderOrder = -9; group.add(sun);
    // 星
    if (style !== 'canyon') {
      const sp = []; for (let i = 0; i < 380; i++) { const a = R() * Math.PI * 2, e = 0.15 + R() * 1.3, r = 6500; sp.push(Math.cos(a) * Math.cos(e) * r, Math.sin(e) * r, Math.sin(a) * Math.cos(e) * r); }
      const sg = new THREE.BufferGeometry(); sg.setAttribute('position', new THREE.Float32BufferAttribute(sp, 3));
      const stars = new THREE.Points(sg, new THREE.PointsMaterial({ color: 0xffffff, size: 2.4, sizeAttenuation: false, fog: false, transparent: true, opacity: 0.8, depthWrite: false }));
      stars.userData.sky = true; stars.renderOrder = -9; group.add(stars);
    }
  }
  // 地面(暗い面+グリッド)
  {
    const gp = new THREE.Mesh(new THREE.PlaneGeometry(30000, 30000).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: pal.ground }));
    gp.position.set(0, groundY, 0); group.add(gp);
    const gr = new THREE.GridHelper(16000, 80, pal.grid, pal.grid); gr.position.set(0, groundY + 0.5, 0);
    gr.material.transparent = true; gr.material.opacity = 0.55; group.add(gr);
  }
  // トラックの近くかどうかの判定(水平距離)
  const near = [];
  for (let i = 0; i < tr.N; i += 3) near.push(tr.P[i * 3], tr.P[i * 3 + 2]);
  const farFromTrack = (x, z, d) => { const d2 = d * d; for (let k = 0; k < near.length; k += 2) { const dx = near[k] - x, dz = near[k + 1] - z; if (dx * dx + dz * dz < d2) return false; } return true; };
  const cx = (tr.minX + tr.maxX) / 2, cz = (tr.minZ + tr.maxZ) / 2;
  const B = new GeoB();
  const bld = pal.bld.map(rgb);
  const N = tr.N;

  if (style === 'city') {
    const n = Math.round(300 * quality);
    for (let k = 0; k < n; k++) {
      const i = Math.floor(R() * N), side = R() < 0.5 ? -1 : 1, d = 120 + Math.pow(R(), 1.6) * 1100;
      const x = tr.P[i * 3] + tr.R[i * 3] * side * d + (R() - 0.5) * 80, z = tr.P[i * 3 + 2] + tr.R[i * 3 + 2] * side * d + (R() - 0.5) * 80;
      if (!farFromTrack(x, z, 105)) continue;
      const w = 28 + R() * 70, dd = 28 + R() * 70, h = 50 + R() * 300 * (0.5 + d / 900);
      const c = mul(bld[Math.floor(R() * bld.length)], 0.55 + R() * 0.7);
      B.box(x, groundY, z, w, h + (tr.P[i * 3 + 1] - groundY) * 0.5, dd, c, { tile: 14 });
      if (R() < 0.35) B.box(x, groundY + h + (tr.P[i * 3 + 1] - groundY) * 0.5, z, w * 0.5, 22 + R() * 30, dd * 0.5, mul(c, 1.3), { tile: 14 }); // 屋上
    }
    for (let k = 0; k < Math.round(160 * quality); k++) { // 遠景
      const a = R() * Math.PI * 2, d = 2600 + R() * 3600;
      const x = cx + Math.cos(a) * d, z = cz + Math.sin(a) * d;
      const w = 70 + R() * 160, h = 200 + R() * 900;
      B.box(x, groundY, z, w, h, w * (0.7 + R() * 0.6), mul(bld[Math.floor(R() * bld.length)], 0.5 + R() * 0.5), { tile: 24 });
    }
  } else if (style === 'canyon') {
    const rock = pal.bld.map(rgb);
    for (let k = 0; k < Math.round(260 * quality); k++) {
      const i = Math.floor(R() * N), side = R() < 0.5 ? -1 : 1, d = 110 + Math.pow(R(), 1.4) * 1300;
      const x = tr.P[i * 3] + tr.R[i * 3] * side * d + (R() - 0.5) * 120, z = tr.P[i * 3 + 2] + tr.R[i * 3 + 2] * side * d + (R() - 0.5) * 120;
      if (!farFromTrack(x, z, 100)) continue;
      const r = 24 + R() * 80, h = 80 + R() * 380 * (0.4 + d / 1000);
      const c = mul(rock[Math.floor(R() * rock.length)], 0.6 + R() * 0.7);
      B.cone(x, groundY, z, r, h + (tr.P[i * 3 + 1] - groundY) * 0.4, 5 + Math.floor(R() * 3), c, { tx: (R() - 0.5) * r * 0.9, tz: (R() - 0.5) * r * 0.9, rot: R() * 6, sq: 0.7 + R() * 0.6 });
      if (R() < 0.4) B.cone(x + r * 0.7, groundY, z - r * 0.4, r * 0.55, h * 0.6, 5, mul(c, 0.85), { rot: R() * 6 });
    }
    for (let k = 0; k < 40; k++) { // 遠くの台地
      const a = R() * Math.PI * 2, d = 2800 + R() * 3200, x = cx + Math.cos(a) * d, z = cz + Math.sin(a) * d, r = 300 + R() * 500;
      B.cone(x, groundY, z, r, 250 + R() * 500, 6, mul(rock[Math.floor(R() * rock.length)], 0.6), { tx: 0, tz: 0, rot: R() });
      B.box(x, groundY + 220, z, r * 1.2, 50, r * 1.2, mul(rock[0], 0.5));
    }
  } else { // ice
    const ice = pal.bld.map(rgb);
    for (let k = 0; k < Math.round(260 * quality); k++) {
      const i = Math.floor(R() * N), side = R() < 0.5 ? -1 : 1, d = 110 + Math.pow(R(), 1.4) * 1300;
      const x = tr.P[i * 3] + tr.R[i * 3] * side * d + (R() - 0.5) * 120, z = tr.P[i * 3 + 2] + tr.R[i * 3 + 2] * side * d + (R() - 0.5) * 120;
      if (!farFromTrack(x, z, 100)) continue;
      const r = 14 + R() * 40, h = 90 + R() * 420 * (0.4 + d / 1000);
      const c = mul(ice[Math.floor(R() * ice.length)], 0.7 + R() * 0.6);
      B.cone(x, groundY, z, r, h + (tr.P[i * 3 + 1] - groundY) * 0.4, 5 + Math.floor(R() * 2), c, { tx: (R() - 0.5) * r * 0.3, tz: (R() - 0.5) * r * 0.3, rot: R() * 6 });
      if (R() < 0.5) B.cone(x + r * 1.2, groundY, z + r * 0.6, r * 0.7, h * 0.55, 5, mul(c, 1.1), { rot: R() * 6 });
    }
    for (let k = 0; k < 50; k++) { // 雪山
      const a = R() * Math.PI * 2, d = 2800 + R() * 3200, x = cx + Math.cos(a) * d, z = cz + Math.sin(a) * d, r = 400 + R() * 600;
      B.cone(x, groundY, z, r, 400 + R() * 700, 7, [0.75, 0.9, 0.95], { tx: 0, tz: 0, rot: R() });
    }
    // オーロラ(加算の帯)
    for (let k = 0; k < 3; k++) {
      const AG = new GeoB(), a0 = R() * Math.PI * 2, span = 1.1 + R() * 0.8, rad = 4200 + k * 400, hb = 1400 + k * 280;
      const seg = 28;
      for (let s = 0; s < seg; s++) {
        const t0 = s / seg, t1 = (s + 1) / seg, aa0 = a0 + t0 * span, aa1 = a0 + t1 * span;
        const y0 = hb + Math.sin(t0 * 7 + k) * 160, y1 = hb + Math.sin(t1 * 7 + k) * 160;
        const hh0 = 800 + Math.sin(t0 * 5 + k * 2) * 250, hh1 = 800 + Math.sin(t1 * 5 + k * 2) * 250;
        const cc = (t) => mix([0.1, 0.9, 0.5], [0.6, 0.2, 0.9], 0.5 + 0.5 * Math.sin(t * 6 + k));
        const c0 = cc(t0), c1 = cc(t1), dark = [0, 0, 0];
        const p = (aa, y) => [Math.cos(aa) * rad, y, Math.sin(aa) * rad]; // 空と一緒にカメラへ追従するので原点中心
        // 下が明るく上へ消える
        const g = AG; const A = p(aa0, y0), Bb = p(aa1, y1), C = p(aa1, y1 + hh1), D = p(aa0, y0 + hh0);
        const tri = (a, b, c, ca, cb, ccc) => { g.pos.push(...a, ...b, ...c); g.col.push(...ca, ...cb, ...ccc); g.uv.push(0, 0, 0, 0, 0, 0); };
        tri(A, Bb, C, mul(c0, 0.6), mul(c1, 0.6), dark); tri(A, C, D, mul(c0, 0.6), dark, dark);
      }
      const am = new THREE.Mesh(AG.build(), new THREE.MeshBasicMaterial({ vertexColors: true, blending: THREE.AdditiveBlending, transparent: true, depthWrite: false, side: THREE.DoubleSide, fog: false }));
      am.userData.sky = true; group.add(am);
    }
  }
  const geo = B.build();
  const bm = new THREE.MeshBasicMaterial({ vertexColors: true });
  if (style === 'city') bm.map = windowTexture(pal);
  const mesh = new THREE.Mesh(geo, bm); group.add(mesh);

  // 門(コースの上の発光アーチ)
  {
    const G = new GeoB(), E = new GeoB();
    const cNeon = rgb(pal.neon), cEdge = rgb(pal.edge), cw = mul(rgb(pal.wall), 1.6);
    const step = style === 'city' ? 110 : 160;
    for (let i = 30; i < N; i += step) {
      let bad = false; for (let k = -4; k <= 12; k++) { const j = (i + k + N) % N; if (tr.gap[j]) bad = true; }
      if (bad || tr.padAt[i] >= 0) continue;
      const c = [tr.P[i * 3], tr.P[i * 3 + 1], tr.P[i * 3 + 2]], r = [tr.R[i * 3], tr.R[i * 3 + 1], tr.R[i * 3 + 2]], u = [tr.U[i * 3], tr.U[i * 3 + 1], tr.U[i * 3 + 2]], t = [tr.T[i * 3], tr.T[i * 3 + 1], tr.T[i * 3 + 2]];
      const W = tr.halfW + 5.5, H = 24;
      for (const s of [-1, 1]) orientedBox(G, [c[0] + r[0] * W * s, c[1] + r[1] * W * s, c[2] + r[2] * W * s], r, u, t, 2.4, H, 2.4, cw);
      const top = [c[0] + u[0] * H, c[1] + u[1] * H, c[2] + u[2] * H];
      orientedBox(G, [top[0] - u[0] * 1.6, top[1] - u[1] * 1.6, top[2] - u[2] * 1.6], r, u, t, W * 2 + 2.4, 3.2, 2.6, cw);
      orientedBox(E, [top[0] - u[0] * 1.2, top[1] - u[1] * 1.2, top[2] - u[2] * 1.2], r, u, t, W * 2 - 2, 0.6, 2.9, i % (step * 2) < step ? cNeon : cEdge);
    }
    // スタートの門(大きめ)
    {
      const i = 0, c = [tr.P[0], tr.P[1], tr.P[2]], r = [tr.R[0], tr.R[1], tr.R[2]], u = [tr.U[0], tr.U[1], tr.U[2]], t = [tr.T[0], tr.T[1], tr.T[2]];
      const W = tr.halfW + 6, H = 30;
      for (const s of [-1, 1]) orientedBox(G, [c[0] + r[0] * W * s, c[1] + r[1] * W * s, c[2] + r[2] * W * s], r, u, t, 3.4, H, 3.4, cw);
      const top = [c[0] + u[0] * H, c[1] + u[1] * H, c[2] + u[2] * H];
      orientedBox(G, [top[0] - u[0] * 4, top[1] - u[1] * 4, top[2] - u[2] * 4], r, u, t, W * 2 + 3.4, 7, 3.6, cw);
      orientedBox(E, [top[0] - u[0] * 3.4, top[1] - u[1] * 3.4, top[2] - u[2] * 3.4], r, u, t, W * 2 - 3, 5.4, 4.0, [0.05, 0.05, 0.1]);
      orientedBox(E, [top[0] - u[0] * 3.4, top[1] - u[1] * 3.4, top[2] - u[2] * 3.4 + 0], r, u, t, W * 2 - 3, 0.5, 4.2, rgb(pal.accent));
    }
    group.add(new THREE.Mesh(G.build(), new THREE.MeshLambertMaterial({ vertexColors: true, flatShading: true })));
    group.add(new THREE.Mesh(E.build(), new THREE.MeshBasicMaterial({ vertexColors: true })));
  }
  return group;
}

// ---- スピード線(カメラに付ける) ----
export class SpeedLines {
  constructor(camera) {
    this.n = 140;
    const pos = new Float32Array(this.n * 6);
    this.seed = [];
    for (let i = 0; i < this.n; i++) this.seed.push({ a: Math.random() * Math.PI * 2, r: 5 + Math.random() * 22, z: -Math.random() * 120 });
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    this.mat = new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, fog: false });
    this.mesh = new THREE.LineSegments(g, this.mat); this.mesh.frustumCulled = false; this.mesh.renderOrder = 20;
    camera.add(this.mesh);
  }
  update(dt, speedRatio, boosting) {
    const a = this.mesh.geometry.attributes.position.array;
    const v = 80 + speedRatio * 520 + (boosting ? 380 : 0), len = 2 + speedRatio * 14 + (boosting ? 16 : 0);
    for (let i = 0; i < this.n; i++) {
      const s = this.seed[i];
      s.z += v * dt;
      if (s.z > -2) { s.z = -90 - Math.random() * 90; s.a = Math.random() * Math.PI * 2; s.r = 6 + Math.random() * 24; }
      const x = Math.cos(s.a) * s.r, y = Math.sin(s.a) * s.r * 0.6;
      a[i * 6] = x; a[i * 6 + 1] = y; a[i * 6 + 2] = s.z;
      a[i * 6 + 3] = x; a[i * 6 + 4] = y; a[i * 6 + 5] = s.z - len;
    }
    this.mesh.geometry.attributes.position.needsUpdate = true;
    this.mat.opacity = Math.max(0, Math.min(0.55, (speedRatio - 0.35) * 0.9 + (boosting ? 0.2 : 0)));
    this.mat.color.set(boosting ? 0x9affff : 0xffffff);
  }
}

// ---- 火花・排気の粒 ----
export class Particles {
  constructor(scene, max = 320) {
    this.max = max; this.p = [];
    const pos = new Float32Array(max * 3), col = new Float32Array(max * 3);
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('color', new THREE.BufferAttribute(col, 3));
    const cv = document.createElement('canvas'); cv.width = cv.height = 32; const cg = cv.getContext('2d');
    const gr = cg.createRadialGradient(16, 16, 0, 16, 16, 16); gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.4, 'rgba(255,255,255,.6)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
    cg.fillStyle = gr; cg.fillRect(0, 0, 32, 32);
    this.mat = new THREE.PointsMaterial({ size: 1.0, map: new THREE.CanvasTexture(cv), vertexColors: true, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, sizeAttenuation: true });
    this.pts = new THREE.Points(g, this.mat); this.pts.frustumCulled = false; scene.add(this.pts);
    for (let i = 0; i < max; i++) this.p.push({ life: 0, x: 0, y: -1e5, z: 0, vx: 0, vy: 0, vz: 0, r: 0, g: 0, b: 0, max: 1 });
    this.cursor = 0;
  }
  emit(x, y, z, vx, vy, vz, color, life) {
    const q = this.p[this.cursor]; this.cursor = (this.cursor + 1) % this.max;
    q.x = x; q.y = y; q.z = z; q.vx = vx; q.vy = vy; q.vz = vz; q.life = q.max = life;
    const c = new THREE.Color(color); q.r = c.r; q.g = c.g; q.b = c.b;
  }
  update(dt) {
    const pa = this.pts.geometry.attributes.position.array, ca = this.pts.geometry.attributes.color.array;
    for (let i = 0; i < this.max; i++) {
      const q = this.p[i];
      if (q.life > 0) { q.life -= dt; q.x += q.vx * dt; q.y += q.vy * dt; q.z += q.vz * dt; q.vy -= 60 * dt; }
      const a = q.life > 0 ? q.life / q.max : 0;
      pa[i * 3] = q.x; pa[i * 3 + 1] = a > 0 ? q.y : -1e5; pa[i * 3 + 2] = q.z;
      ca[i * 3] = q.r * a; ca[i * 3 + 1] = q.g * a; ca[i * 3 + 2] = q.b * a;
    }
    this.pts.geometry.attributes.position.needsUpdate = true; this.pts.geometry.attributes.color.needsUpdate = true;
  }
}
