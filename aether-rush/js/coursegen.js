// 開発用: コースの周回形を乱数から作り、条件(最小半径・交差なし・勾配)を満たすものだけ採用する。
// 結果は js/courses_data.js に保存して、ゲームは保存済みのデータだけを読む(実行時には使わない)。
import * as THREE from '../lib/three.module.js';
import { buildTrack, figureEight } from './course.js';
import { rng } from './geo.js';

const TAU = Math.PI * 2;

function radialPoints(spec, seed) {
  const R = rng(seed);
  const n = spec.n || 40, ks = spec.harm || [2, 3, 4, 5, 6];
  const ph = ks.map(() => R() * TAU), am = ks.map((k) => spec.amp * (0.45 + R() * 0.9) / Math.pow(k, spec.decay ?? 0.55));
  const e1 = R() * TAU, e2 = R() * TAU, e3 = R() * TAU;
  const pts = [];
  let minR = 9;
  for (let i = 0; i < n; i++) {
    const a = (i / n) * TAU;
    let r = 1;
    ks.forEach((k, j) => { r += am[j] * Math.cos(k * a + ph[j]); });
    minR = Math.min(minR, r);
    const y = (0.5 * (1 - Math.cos(a + e1)) * 0.85 + 0.28 * Math.sin(2 * a + e2) + 0.14 * Math.sin(3 * a + e3));
    pts.push([spec.ax * r * Math.cos(a), y, spec.az * r * Math.sin(a)]);
  }
  return { pts, minR };
}

function lengthOf(pts) {
  const c = new THREE.CatmullRomCurve3(pts.map((p) => new THREE.Vector3(p[0], p[1], p[2])), true, 'centripetal');
  c.arcLengthDivisions = 1500; c.updateArcLengths();
  return c.getLength();
}

const sm = (arr, k, N) => { const o = new Float32Array(N); for (let i = 0; i < N; i++) { let s = 0; for (let j = -k; j <= k; j++) s += arr[((i + j) % N + N) % N]; o[i] = s / (2 * k + 1); } return o; };

// 水平方向の曲率(1/m)
function curvature(tr) {
  const { N, ds, T } = tr, k = new Float32Array(N);
  for (let i = 0; i < N; i++) {
    const j = (i + 1) % N;
    const a = Math.hypot(T[i * 3], T[i * 3 + 2]) || 1, b = Math.hypot(T[j * 3], T[j * 3 + 2]) || 1;
    const dot = Math.max(-1, Math.min(1, (T[i * 3] * T[j * 3] + T[i * 3 + 2] * T[j * 3 + 2]) / (a * b)));
    k[i] = Math.acos(dot) / ds;
  }
  return sm(k, 3, N);
}

// mask が真の連続区間(周回をまたぐものも)
function runs(mask, N, minLen) {
  const out = [];
  let start = -1;
  for (let i = 0; i < N * 2; i++) {
    const v = mask[i % N];
    if (v && start < 0) start = i;
    if ((!v || i === N * 2 - 1) && start >= 0) {
      const len = i - start + (v && i === N * 2 - 1 ? 1 : 0);
      if (start < N && len >= minLen) out.push({ a: start, len: Math.min(len, N) });
      start = -1;
    }
  }
  // 周回をまたぐ重複を除く(同じ区間が2回出る)
  return out.filter((r, i) => !out.some((o, j) => j < i && (r.a % N) === (o.a % N)));
}

function planPads(tr, spec, R) {
  const N = tr.N, kap = curvature(tr);
  const used = new Uint8Array(N);
  const block = (a, len, margin = 6) => { for (let k = -margin; k < len + margin; k++) used[((a + k) % N + N) % N] = 1; };
  const free = (a, len, margin = 3) => { for (let k = -margin; k < len + margin; k++) if (used[((a + k) % N + N) % N]) return false; return true; };
  block(N - 100, 100, 0); block(0, 14, 0); // スタートの並び
  const straight = new Uint8Array(N), gentle = new Uint8Array(N), mid = new Uint8Array(N);
  for (let i = 0; i < N; i++) { straight[i] = kap[i] < 1 / 1300 ? 1 : 0; gentle[i] = kap[i] < 1 / 800 ? 1 : 0; mid[i] = (kap[i] >= 1 / 1300 && kap[i] < 1 / 330) ? 1 : 0; }
  const pads = [], gaps = [];
  const hw = tr.halfW;
  // ジャンプ: 長い直線の途中にギャップ
  let sr = runs(straight, N, 62).sort((a, b) => b.len - a.len);
  for (const r of sr) {
    if (gaps.length >= spec.nGap) break;
    const g = 10 + Math.floor(R() * 4), gi = (r.a + 36) % N;
    if (r.len < 36 + g + 10 || !free((gi - 18 + N) % N, g + 28, 2)) continue;
    gaps.push({ at: +(gi / N).toFixed(6), len: g });
    block((gi - 18 + N) % N, g + 28, 4);
  }
  // 回復ゾーン: 直線の中ほど
  sr = runs(gentle, N, 46).sort((a, b) => b.len - a.len);
  let nr = 0;
  for (const r of sr) {
    if (nr >= (spec.nRec ?? 1)) break;
    const a = (r.a + Math.floor((r.len - 34) / 2)) % N;
    if (r.len < 46 || !free(a, 34)) continue;
    pads.push({ at: +(a / N).toFixed(6), len: 34, l: [-hw, hw], type: 'recover' }); block(a, 34); nr++;
  }
  // ブースト: 直線の出口に
  sr = runs(gentle, N, 20).sort((a, b) => b.len - a.len);
  let nb = 0;
  for (const r of sr) {
    for (const off of [4, Math.floor(r.len / 2)]) {
      if (nb >= spec.nBoost) break;
      if (off > 4 && r.len < 70) continue;
      const a = (r.a + off) % N;
      if (!free(a, 5)) continue;
      const w = nb % 2 ? 14 : 22;
      pads.push({ at: +(a / N).toFixed(6), len: 5, l: [-w, w], type: 'boost' }); block(a, 5); nb++;
    }
  }
  // 滑る路面: 中くらいのカーブの手前〜途中、足りなければ直線
  const slipOk = new Uint8Array(N); for (let i = 0; i < N; i++) slipOk[i] = kap[i] < 1 / 650 ? 1 : 0; // きついカーブの中には置かない
  const cand = runs(slipOk, N, 40).sort(() => R() - 0.5);
  let ns = 0;
  for (const r of cand) {
    if (ns >= spec.nSlip) break;
    const len = Math.min(r.len - 4, 38 + Math.floor(R() * 20));
    const a = (r.a + 2) % N;
    if (len < 34 || !free(a, len)) continue;
    pads.push({ at: +(a / N).toFixed(6), len, l: [-hw, hw], type: 'slip' }); block(a, len, 8); ns++;
  }
  // 直線が足りないコースは、ゆるいカーブの中にも置く
  if (nr < (spec.nRec ?? 1)) {
    for (const r of runs(mid, N, 36).sort((a, b) => b.len - a.len)) {
      if (nr >= (spec.nRec ?? 1)) break;
      const a = (r.a + 2) % N;
      if (!free(a, 30)) continue;
      pads.push({ at: +(a / N).toFixed(6), len: 30, l: [-hw, hw], type: 'recover' }); block(a, 30); nr++;
    }
  }
  return { pads, gaps, got: { gap: gaps.length, boost: nb, slip: ns, rec: nr } };
}

export function makeCourse(spec, maxTry = 700) {
  const hw = spec.halfW || 32;
  const why = {};
  const no = (k) => { why[k] = (why[k] || 0) + 1; };
  for (let t = 0; t < maxTry; t++) {
    const seed = spec.seed * 7919 + t;
    let pts;
    if (spec.kind === 'eight') {
      const R = rng(seed);
      pts = figureEight(spec.cx * (0.92 + R() * 0.16), spec.r * (0.92 + R() * 0.16), spec.bridge);
      pts = pts.map((p) => [p[0], p[1], p[2]]);
    } else {
      const rp = radialPoints(spec, seed);
      if (rp.minR < 0.38) { no('thin'); continue; }
      const sq = spec.elev * 3.5;
      const len0 = lengthOf(rp.pts.map((p) => [p[0], p[1] * sq, p[2]])), k = spec.len / len0;
      pts = rp.pts.map((p) => [p[0] * k, p[1] * k * sq, p[2] * k]);
    }
    const round = pts.map((p) => [Math.round(p[0]), Math.round(p[1]), Math.round(p[2])]);
    const draft = { points: round, halfW: hw, pal: {}, gaps: [], pads: [] };
    let tr = buildTrack(draft);
    const st = tr.stats;
    const ok = st.minRadius >= spec.minR && (!spec.tight || st.minRadius <= spec.minR * 1.4) && st.maxSlopeDeg <= (spec.maxSlope || 13) && st.minVerticalRadius >= (spec.minVR || 480) &&
      (spec.kind === 'eight' ? st.crossingClearance >= 70 : st.crossingClearance > 1e8) && Math.abs(tr.length - spec.len) < spec.len * 0.2;
    if (!ok) { if (st.minRadius < spec.minR) no('radius'); else if (st.maxSlopeDeg > (spec.maxSlope || 13)) no('slope'); else if (st.minVerticalRadius < (spec.minVR || 480)) no('vert'); else if (!(spec.kind === 'eight' ? st.crossingClearance >= 70 : st.crossingClearance > 1e8)) no('cross'); else if (st.minRadius > spec.minR * 1.4) no('loose'); else no('len'); continue; }
    // 一番長い直線の真ん中にスタートを置く
    const kap = curvature(tr), straight = new Uint8Array(tr.N);
    for (let i = 0; i < tr.N; i++) straight[i] = kap[i] < 1 / 1700 ? 1 : 0;
    const sr = runs(straight, tr.N, 40).sort((a, b) => b.len - a.len);
    if (!sr.length) { no('nostraight'); continue; }
    const startShift = (sr[0].a + Math.floor(sr[0].len * 0.65)) % tr.N; // スタートの手前に直線が残るように後ろ寄り
    draft.startShift = startShift;
    tr = buildTrack(draft);
    const R = rng(seed + 17);
    const plan = planPads(tr, spec, R);
    if (plan.gaps.length < spec.nGap) { no('gap'); continue; } // ジャンプが置けない形は捨てる
    const def = { id: spec.id, name: spec.name, jp: spec.jp, desc: spec.desc, style: spec.style, pal: spec.pal, laps: 3, halfW: hw, seed: spec.seed + 100, points: round, startShift, pads: plan.pads, gaps: plan.gaps };
    return { def, tries: t + 1, stats: tr.stats, got: plan.got };
  }
  return { fail: why };
}
