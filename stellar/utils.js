// ---------- STELLAR HEGEMONY ― 銀河覇権: 汎用ロジック ----------
// ロジック破壊禁止(資料.txt 6章): toCube/hexDist/computeSupply/ダメージ計算式はここに集約し、
// 呼び出し側から挙動を変えたい場合も、この関数のシグネチャと結果の意味は保つこと。

// ヘックス座標(Odd-Q, 縦オフセット) → キューブ座標
function toCube(col, row) {
  const x = col;
  const z = row - (col - (col & 1)) / 2;
  const y = -x - z;
  return { x, y, z };
}
function hexDist(a, b) {
  const ca = toCube(a.col, a.row), cb = toCube(b.col, b.row);
  return Math.max(Math.abs(ca.x - cb.x), Math.abs(ca.y - cb.y), Math.abs(ca.z - cb.z));
}
// Odd-Q隣接6方向(0=右,1=右上,2=左上,3=左,4=左下,5=右下)。列の偶奇でオフセットが変わる。
const HEX_DIR_EVEN = [[1, 0], [1, -1], [0, -1], [-1, 0], [0, 1], [1, 1]];
const HEX_DIR_ODD = [[1, 1], [1, 0], [0, -1], [-1, 1], [0, 1], [-1, 0]];
function hexNeighbor(col, row, dir) {
  const t = (col & 1) ? HEX_DIR_ODD : HEX_DIR_EVEN;
  const [dc, dr] = t[dir];
  return { col: col + dc, row: row + dr };
}
function hexNeighbors(col, row) {
  const out = [];
  for (let d = 0; d < 6; d++) out.push(hexNeighbor(col, row, d));
  return out;
}
function inBoard(col, row, w, h) { return col >= 0 && col < w && row >= 0 && row < h; }

// 補給率(BFS): 自軍の後方エッジ(homeCols: 自陣側の列集合)から、障害物(blocked)を避けて到達距離を測り、
// 到達不能なら0%、距離0で100%、1マスごとに20%ずつ減衰(0%が下限)。
function computeSupply(pos, homeCols, blocked, w, h) {
  const key = (c, r) => c + ',' + r;
  const blockedSet = blocked instanceof Set ? blocked : new Set((blocked || []).map(p => key(p.col, p.row)));
  const start = [];
  for (let r = 0; r < h; r++) for (const c of homeCols) if (inBoard(c, r, w, h) && !blockedSet.has(key(c, r))) start.push({ col: c, row: r, d: 0 });
  const visited = new Set(start.map(s => key(s.col, s.row)));
  const queue = [...start];
  let dist = null;
  while (queue.length) {
    const cur = queue.shift();
    if (cur.col === pos.col && cur.row === pos.row) { dist = cur.d; break; }
    for (const n of hexNeighbors(cur.col, cur.row)) {
      const k = key(n.col, n.row);
      if (!inBoard(n.col, n.row, w, h) || visited.has(k) || blockedSet.has(k)) continue;
      visited.add(k); queue.push({ col: n.col, row: n.row, d: cur.d + 1 });
    }
  }
  if (dist === null) return 0;
  return Math.max(0, 100 - dist * 20);
}

// 提督特性による武器倍率。amp: 2026-09-29(5回目)追加。指揮巡洋艦(CC)が艦隊内にいる間、
// 提督の特性による増減量そのものを底上げする(例: genius通常+12% → amp=1.5で+18%)。
// 1未満に減らすことは想定していない(常時1以上を渡す前提)。
function traitWeaponMul(traits, weapon, amp) {
  amp = amp || 1;
  let m = 1;
  if (!traits) return m;
  for (const t of traits) {
    if (t === 'genius') m *= 1 + 0.12 * amp;
    if (t === 'aggressive' && weapon === 'atk') m *= 1 + 0.18 * amp;
    if (t === 'ace' && (weapon === 'fighter' || weapon === 'intercept')) m *= 1 + 0.35 * amp;
    if (t === 'missileer' && weapon === 'missile') m *= 1 + 0.30 * amp;
    if (t === 'siege' && weapon === 'siege') m *= 1 + 0.20 * amp;
  }
  return m;
}
function traitDefenseMul(traits, amp) {
  amp = amp || 1;
  let m = 1;
  if (!traits) return m;
  for (const t of traits) {
    if (t === 'aggressive') m *= 1 + 0.10 * amp;   // 防御-10% => 被害+10%(ampで悪化幅も広がる)
    if (t === 'defensive') m *= 1 - 0.18 * amp;    // 被害-18%
  }
  return m;
}

// 陣形補正込みの実効攻撃力・防御倍率
function formAtkMul(formId) { return 1 + (FORMS[formId] ? FORMS[formId].atk : 0); }
function formDefMul(formId) { return 1 - (FORMS[formId] ? FORMS[formId].def : 0); }
function formEvade(formId) { return FORMS[formId] ? FORMS[formId].evade : 0; }
function formMoveMod(formId) { return FORMS[formId] ? FORMS[formId].move : 0; }

// ダメージ計算式: shieldPierce(0=ビームのようにシールドで全減衰、1=ミサイル・雷撃のようにシールド完全無視、
// 0〜1の間=電磁投射砲のような部分貫通)を武器定義(WEAPON_DEFS)から渡す。
// facing: 'front' | 'side' | 'back'
// defMul(陣形・特性による被ダメージ倍率、1未満で軽減)は、シールド減衰の「後」に一律で掛ける。
function computeDamage({ weapon, power, facing = 'front', shield = 0, shieldPierce = 0, atkMul = 1, defMul = 1 }) {
  const facingMul = DAMAGE.facing[facing] || 1.0;
  let raw = power * atkMul * facingMul;
  const effShield = (facing === 'back' ? shield * DAMAGE.backShieldMul : shield) * (1 - shieldPierce);
  raw = Math.max(0, raw - effShield);
  raw *= defMul;
  return Math.max(0, Math.round(raw));
}
// 回避判定(艦の迎撃力・陣形回避を考慮)。evadeBase=0の武器(ビーム・電磁投射砲)は常にfalse。
function missileEvaded(target, formId, evadeBase = 0.35) {
  if (evadeBase <= 0) return false;
  const evade = Math.min(0.85, evadeBase + (target.intercept || 0) / 1000 + formEvade(formId));
  return Math.random() < evade;
}

if (typeof module !== 'undefined') module.exports = {
  toCube, hexDist, hexNeighbor, hexNeighbors, inBoard, computeSupply,
  traitWeaponMul, traitDefenseMul, formAtkMul, formDefMul, formEvade, formMoveMod,
  computeDamage, missileEvaded,
};
