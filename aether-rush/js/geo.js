// 小さなポリゴンビルダー: 三角形・四角形を溜めて、フラットシェーディング用のジオメトリにする
import * as THREE from '../lib/three.module.js';

export class GeoB {
  constructor() { this.pos = []; this.col = []; this.uv = []; this.hasUV = false; }
  tri(a, b, c, col, uvs) {
    const p = this.pos, k = this.col;
    p.push(a[0], a[1], a[2], b[0], b[1], b[2], c[0], c[1], c[2]);
    k.push(col[0], col[1], col[2], col[0], col[1], col[2], col[0], col[1], col[2]);
    if (uvs) { this.hasUV = true; this.uv.push(...uvs); } else this.uv.push(0, 0, 0, 0, 0, 0);
  }
  quad(a, b, c, d, col, uvs) {
    if (uvs) {
      this.tri(a, b, c, col, [uvs[0], uvs[1], uvs[2], uvs[3], uvs[4], uvs[5]]);
      this.tri(a, c, d, col, [uvs[0], uvs[1], uvs[4], uvs[5], uvs[6], uvs[7]]);
    } else { this.tri(a, b, c, col); this.tri(a, c, d, col); }
  }
  // 軸に沿った箱(底面中心 cx,cy,cz、幅w 高さh 奥行d)。面ごとに明るさを変えて「ポリゴンの角」を見せる
  box(cx, cy, cz, w, h, d, col, opt = {}) {
    const x0 = cx - w / 2, x1 = cx + w / 2, y0 = cy, y1 = cy + h, z0 = cz - d / 2, z1 = cz + d / 2;
    const sc = (f) => [col[0] * f, col[1] * f, col[2] * f];
    const tile = opt.tile || 0; // 窓テクスチャの繰り返し基準(m)
    const U = (a) => (tile ? a / tile : 0);
    const uvQuad = (aw, ah) => tile ? [0, 0, U(aw), 0, U(aw), U(ah), 0, U(ah)] : null;
    // +Z, -Z, +X, -X, 上
    this.quad([x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1], sc(0.95), uvQuad(w, h));
    this.quad([x1, y0, z0], [x0, y0, z0], [x0, y1, z0], [x1, y1, z0], sc(0.7), uvQuad(w, h));
    this.quad([x1, y0, z1], [x1, y0, z0], [x1, y1, z0], [x1, y1, z1], sc(0.82), uvQuad(d, h));
    this.quad([x0, y0, z0], [x0, y0, z1], [x0, y1, z1], [x0, y1, z0], sc(0.6), uvQuad(d, h));
    this.quad([x0, y1, z1], [x1, y1, z1], [x1, y1, z0], [x0, y1, z0], sc(1.15), tile ? [0, 0, 0, 0, 0, 0, 0, 0] : null);
  }
  // 錐(n角形)。底面中心 cx,cy,cz 半径r 高さh、頂点を少しずらせる
  cone(cx, cy, cz, r, h, n, col, opt = {}) {
    const tx = cx + (opt.tx || 0), tz = cz + (opt.tz || 0), ty = cy + h;
    const rot = opt.rot || 0, sq = opt.sq || 1;
    for (let i = 0; i < n; i++) {
      const a0 = rot + (i / n) * Math.PI * 2, a1 = rot + ((i + 1) / n) * Math.PI * 2;
      const p0 = [cx + Math.cos(a0) * r, cy, cz + Math.sin(a0) * r * sq];
      const p1 = [cx + Math.cos(a1) * r, cy, cz + Math.sin(a1) * r * sq];
      const f = 0.65 + 0.4 * (0.5 + 0.5 * Math.cos((a0 + a1) / 2 - 0.9));
      this.tri(p0, [tx, ty, tz], p1, [col[0] * f, col[1] * f, col[2] * f]);
    }
  }
  build() {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(this.pos, 3));
    g.setAttribute('color', new THREE.Float32BufferAttribute(this.col, 3));
    if (this.hasUV) g.setAttribute('uv', new THREE.Float32BufferAttribute(this.uv, 2));
    g.computeVertexNormals();
    g.computeBoundingSphere();
    return g;
  }
}

export function rgb(hex) { const c = new THREE.Color(hex); return [c.r, c.g, c.b]; }
export function mul(c, f) { return [c[0] * f, c[1] * f, c[2] * f]; }
export function mix(a, b, t) { return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t]; }

export function rng(seed) {
  let s = seed >>> 0;
  return () => { s = (s + 0x6D2B79F5) >>> 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
