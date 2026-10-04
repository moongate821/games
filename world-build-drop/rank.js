// ランキング・称号・マーク・図鑑。記録はこのブラウザの localStorage にだけ保存(外には送らない)。
(() => {
const DG = window.DG, TAU = Math.PI * 2, SERIF = DG.Art.SERIF;
const KEY = 'wbd_v1';

// ---------- 称号(得点の段階) ----------
const TIERS = [
  { min: 0, name: '見習い編纂者' }, { min: 600, name: '駆け出しの作家' }, { min: 2000, name: '一人前の編集者' }, { min: 5000, name: '物語の紡ぎ手' },
  { min: 12000, name: '世界の編纂者' }, { min: 30000, name: '伝説の語り部' }, { min: 80000, name: 'アカシックの賢者' },
];
const EMBLEM = ['字', '詩', '章', '巻', '界', '創', '神'];      // メダルに刻む一字(段階ごと)

function feats(P) {
  const f = [], st = P.stat || {}, ch = (st.chapters || []).length;
  if (ch >= 8) f.push({ icon: '📚', name: '全章制覇' }); else if (ch >= 5) f.push({ icon: '✒️', name: '長編作家' }); else if (ch >= 3) f.push({ icon: '📖', name: '三章の書き手' }); else if (ch >= 1) f.push({ icon: '🔖', name: '初めての一章' });
  if (P.maxChain >= 8) f.push({ icon: '🌈', name: '連鎖の神' }); else if (P.maxChain >= 6) f.push({ icon: '🔥', name: '大連鎖の魔術師' }); else if (P.maxChain >= 4) f.push({ icon: '⚡', name: '連鎖の名手' });
  if (codexCount() >= 25) f.push({ icon: '🧠', name: '博識' });
  if ((st.lv || 0) >= 2 && ch >= 3) f.push({ icon: '⏰', name: '締切の鬼' });
  if (P.sent >= 30) f.push({ icon: '⚔️', name: '攻撃の名人' });
  if (P.placed >= 100) f.push({ icon: '🏃', name: '持久の人' });
  return f;
}
function tierOf(score) { let t = 0; for (let i = 0; i < TIERS.length; i++) if (score >= TIERS[i].min) t = i; return t; }
function award(game, P) { const tier = tierOf(P.score); return { game, tier, title: TIERS[tier].name, next: TIERS[tier + 1] || null, feats: feats(P) }; }

// ---------- 保存 ----------
function blank() { return { rank: { worldbuild: [] }, stats: { best: { worldbuild: -1 }, games: { worldbuild: 0 }, cpuWins: [0, 0, 0], vs: 0 }, codex: {}, name: 'EDITOR' }; }
let DB = (() => { try { const d = JSON.parse(localStorage.getItem(KEY)); if (d && d.rank && d.stats) return Object.assign(blank(), d); } catch (e) {} return blank(); })();
function save() { try { localStorage.setItem(KEY, JSON.stringify(DB)); } catch (e) {} }
function qualifies(game, score) { if (score <= 0) return 0; let pos = 1; for (const r of DB.rank[game]) if (r.score >= score) pos++; return pos <= 10 ? pos : 0; }
function addRecord(game, rec) { const list = DB.rank[game]; let i = 0; while (i < list.length && list[i].score >= rec.score) i++; list.splice(i, 0, rec); DB.rank[game] = list.slice(0, 10); DB.name = rec.name; save(); return i + 1; }
function noteGame(game, tier) { DB.stats.games[game]++; const up = tier > DB.stats.best[game]; if (up) DB.stats.best[game] = tier; save(); return up; }
function noteVs(cpuLevel) { if (cpuLevel == null) DB.stats.vs++; else DB.stats.cpuWins[cpuLevel]++; save(); }
function bestTitle() { const t = DB.stats.best.worldbuild; return t < 0 ? null : { game: 'worldbuild', tier: t, title: TIERS[t].name }; }
function discover(name) { if (DB.codex[name]) return false; DB.codex[name] = 1; save(); return true; }
function codexCount() { return Object.keys(DB.codex).filter(k => k.slice(0, 2) !== 'K:').length; }      // 言葉の図鑑(四字熟語は別ページ)
function kanjiCount() { return Object.keys(DB.codex).filter(k => k.slice(0, 2) === 'K:').length; }
let codexPage = 0;
function clearAll() { DB = blank(); save(); }

// ---------- マーク(メダル): 段階ごとに一字を刻んだ、言葉のタイル入り ----------
const PAL = [['#e0ac78', '#8a5a2e'], ['#eef1f7', '#8a93a8'], ['#fff0a0', '#c8962a'], ['#a8f5e2', '#2a9a86'], ['#b8d4ff', '#3a5fc4'], ['#e4c2ff', '#7a3fc4']];
function star(ctx, x, y, r, rot) { ctx.beginPath(); for (let i = 0; i < 10; i++) { const a = rot + i * Math.PI / 5 - Math.PI / 2, rr = i % 2 ? r * .45 : r; ctx.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); } ctx.closePath(); ctx.fill(); }
function drawBadge(ctx, game, tier, x, y, r, t) {
  t = t || 0; ctx.save(); ctx.translate(x, y);
  if (r >= 16) { ctx.fillStyle = '#7a8aff'; for (const s of [-1, 1]) { ctx.beginPath(); ctx.moveTo(s * r * .15, r * .6); ctx.lineTo(s * r * .75, r * .6); ctx.lineTo(s * r * .6, r * 1.45); ctx.lineTo(s * r * .4, r * 1.2); ctx.lineTo(s * r * .15, r * 1.45); ctx.closePath(); ctx.fill(); } }
  if (tier >= 4) { const n = 4 + (tier - 4) * 2; ctx.fillStyle = 'rgba(255,255,255,.9)'; for (let i = 0; i < n; i++) { const a = t * .8 + i * TAU / n, d = r * 1.28 + Math.sin(t * 3 + i) * r * .06; star(ctx, Math.cos(a) * d, Math.sin(a) * d, r * .13, a); } }
  const pal = PAL[Math.min(tier, 5)], g = ctx.createRadialGradient(-r * .3, -r * .4, r * .1, 0, 0, r * 1.05); g.addColorStop(0, pal[0]); g.addColorStop(1, pal[1]);
  ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, r, 0, TAU); ctx.fill();
  ctx.strokeStyle = tier >= 6 ? `hsl(${(t * 120) % 360},100%,65%)` : 'rgba(255,255,255,.85)'; ctx.lineWidth = Math.max(2, r * .12); ctx.stroke();
  ctx.fillStyle = 'rgba(20,24,70,.88)'; ctx.beginPath(); ctx.arc(0, 0, r * .72, 0, TAU); ctx.fill();
  const sz = r * 1.12; DG.worldbuild.drawCell(ctx, DG.worldbuild.sampleCell(EMBLEM[Math.min(tier, 6)], Math.min(tier, 3)), -sz / 2, -sz / 2, sz, 1, t);
  if (tier >= 6) { ctx.fillStyle = '#ffd34d'; ctx.strokeStyle = '#a8761a'; ctx.lineWidth = Math.max(1, r * .05); ctx.beginPath(); ctx.moveTo(-r * .5, -r * .95); ctx.lineTo(-r * .55, -r * 1.45); ctx.lineTo(-r * .2, -r * 1.15); ctx.lineTo(0, -r * 1.55); ctx.lineTo(r * .2, -r * 1.15); ctx.lineTo(r * .55, -r * 1.45); ctx.lineTo(r * .5, -r * .95); ctx.closePath(); ctx.fill(); ctx.stroke(); }
  ctx.restore();
}
function chip(ctx, f, x, y, w) {
  ctx.fillStyle = 'rgba(255,255,255,.16)'; DG.rr(ctx, x, y, w, 24, 12); ctx.fill();
  ctx.font = '15px "Segoe UI Emoji","Apple Color Emoji",sans-serif'; ctx.textAlign = 'left'; ctx.textBaseline = 'middle'; ctx.fillStyle = '#fff'; ctx.fillText(f.icon, x + 8, y + 13);
  DG.text(ctx, f.name, x + 30, y + 17, 13, '#fff');
}

// ---------- 結果画面(盤の上に重ねる) ----------
function drawResult(ctx, P, cx, t, entry) {
  const A = P.award; if (!A) return;
  const win = P.result === 'win';
  DG.text(ctx, win ? 'WIN!' : P.result === 'lose' ? 'LOSE' : 'GAME OVER', cx, 116, 36, win ? '#ffe36b' : '#fff', 'center', { stroke: '#000', sw: 6 });
  DG.text(ctx, `SCORE ${P.score}`, cx, 144, 19, '#fff', 'center', { stroke: '#000', sw: 4 });
  drawBadge(ctx, A.game, A.tier, cx, 214, 40, t);
  if (P.newTitle) DG.text(ctx, '★ 新しい称号! ★', cx, 280, 13, '#ffe36b', 'center', { stroke: '#000', sw: 4 });
  DG.text(ctx, A.title, cx, 306, 23, '#fff', 'center', { stroke: '#000', sw: 5, font: SERIF });
  if (A.next) DG.text(ctx, `次の称号まで あと ${A.next.min - P.score}`, cx, 324, 12, '#cfe', 'center', { stroke: '#000', sw: 3 });
  A.feats.slice(0, 3).forEach((f, i) => chip(ctx, f, cx - 100, 336 + i * 28, 200));
  // 物語のあらすじ(完成した章)
  const ch = (P.stat && P.stat.chapters) || [];
  DG.text(ctx, '物語のあらすじ', cx, 438, 12, '#e8d9b0', 'center', { stroke: '#000', sw: 3, font: SERIF });
  if (!ch.length) DG.text(ctx, '(まだ一章も書けなかった)', cx, 458, 12, '#cbbf9a', 'center', { stroke: '#000', sw: 3, font: SERIF });
  ch.slice(0, 3).forEach((c, i) => DG.text(ctx, `第${i + 1}章『${c}』`, cx, 458 + i * 16, 13, '#fff3d0', 'center', { stroke: '#000', sw: 3, font: SERIF, maxW: 240 }));
  if (ch.length > 3) DG.text(ctx, `… +${ch.length - 3}`, cx + 100, 506, 12, '#e8d9b0', 'center', { stroke: '#000', sw: 3 });
  if (P.rankPos) DG.text(ctx, `ランキング ${P.rankPos}位!`, cx, 520, 18, '#ffd34d', 'center', { stroke: '#000', sw: 5 });
  if (entry) {
    DG.text(ctx, 'なまえ', cx, 540, 11, '#cfe', 'center', { stroke: '#000', sw: 3 });
    ctx.fillStyle = 'rgba(0,0,0,.6)'; DG.rr(ctx, cx - 90, 545, 180, 28, 8); ctx.fill();
    DG.text(ctx, entry.name + (Math.floor(t * 2) % 2 ? '_' : ''), cx, 565, 17, '#fff', 'center');
    DG.text(ctx, 'タイプして Enter で決定', cx, 588, 10, '#cfe', 'center', { stroke: '#000', sw: 3 });
  }
}

// ---------- ランキング画面 ----------
function drawRanking(ctx, t, W, H) {
  DG.Art.bgMenu(ctx, t, W, H);
  DG.text(ctx, '🏆 RANKING', W / 2, 62, 42, '#f3e6c4', 'center', { stroke: '#0a1030', sw: 9, font: SERIF });
  const x0 = 130, w = 700; ctx.fillStyle = 'rgba(240,229,200,.93)'; DG.rr(ctx, x0, 88, w, 470, 22); ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = '#a89060'; ctx.stroke();
  const list = DB.rank.worldbuild, ink = '#3a2a1a', sub = '#7a6040';
  for (let i = 0; i < 10; i++) {
    const y = 100 + i * 45, r = list[i];
    if (i < 3) { ctx.fillStyle = ['#ffd34d', '#d8dde8', '#d9a066'][i]; ctx.beginPath(); ctx.arc(x0 + 40, y + 22, 15, 0, TAU); ctx.fill(); DG.text(ctx, String(i + 1), x0 + 40, y + 28, 17, '#4a3000', 'center'); }
    else DG.text(ctx, String(i + 1), x0 + 40, y + 28, 17, sub, 'center');
    if (r) {
      drawBadge(ctx, 'worldbuild', r.tier, x0 + 92, y + 22, 16, t);
      DG.text(ctx, r.name, x0 + 124, y + 20, 17, ink, 'left', { font: SERIF }); DG.text(ctx, r.title + (r.lv ? ' ・' + r.lv : ''), x0 + 124, y + 37, 12, sub, 'left', { font: SERIF });
      DG.text(ctx, String(r.score), x0 + w - 30, y + 26, 21, ink, 'right', { font: SERIF });
      if (r.chapters) DG.text(ctx, `📖 ${r.chapters}`, x0 + w - 150, y + 26, 14, '#a02828', 'right');
      if (r.chain >= 4) DG.text(ctx, `${r.chain}連鎖`, x0 + w - 30, y + 40, 10, '#e08a00', 'right');
    } else DG.text(ctx, '---', x0 + 124, y + 28, 17, sub, 'left');
  }
  const s = DB.stats;
  DG.text(ctx, `あそんだ回数 ${s.games.worldbuild}    CPU撃破  よわい ${s.cpuWins[0]}  ふつう ${s.cpuWins[1]}  つよい ${s.cpuWins[2]}    ふたり対戦 ${s.vs}回`, W / 2, 592, 14, '#fff', 'center', { stroke: '#101840', sw: 4 });
  DG.text(ctx, 'Esc / Enter / タップで もどる', W / 2, 620, 14, '#fff', 'center', { stroke: '#101840', sw: 4 });
}

// ---------- 図鑑(Little Alchemy 風: 発見した概念とレシピ) ----------
function drawIdioms(ctx, t, W, H) {         // 図鑑 2ページ目: 四字熟語(見つけたものだけ、意味つき)
  const I = DG.KJ.IDIOMS; DG.Art.bgMenu(ctx, t, W, H);
  DG.text(ctx, '📖 ' + DG.t('四字熟語'), W / 2, 50, 32, '#f3e6c4', 'center', { stroke: '#0a1030', sw: 8, font: SERIF });
  DG.text(ctx, `${kanjiCount()} / ${I.length} 発見`, W / 2, 76, 15, '#fff', 'center', { stroke: '#101840', sw: 4 });
  ctx.fillStyle = 'rgba(12,18,56,.78)'; DG.rr(ctx, 24, 88, W - 48, 510, 18); ctx.fill();
  const COLS = 4, cw = (W - 80) / COLS, rh = 31;
  I.forEach((it, i) => {
    const c = i % COLS, r = Math.floor(i / COLS), x = 40 + c * cw, y = 112 + r * rh, known = DB.codex['K:' + it[0]];
    if (known) { DG.text(ctx, it[0], x, y, 14, '#ffd96a', 'left', { font: SERIF }); DG.text(ctx, it[1], x + 62, y, 9, '#cfe0ff', 'left', { font: SERIF, maxW: cw - 70 }); }
    else DG.text(ctx, '？？？？', x, y, 14, 'rgba(255,255,255,.28)', 'left', { font: SERIF });
  });
  DG.text(ctx, 'Esc / Enter / B / タップで もどる   ← → ページ', W / 2, 622, 14, '#fff', 'center', { stroke: '#101840', sw: 4 });
}
function drawCodex(ctx, t, W, H) {
  if (codexPage === 1 && DG.KJ) return drawIdioms(ctx, t, W, H);
  const WB = DG.WB; DG.Art.bgMenu(ctx, t, W, H);
  DG.text(ctx, '📖 ' + DG.t('図鑑'), W / 2, 50, 36, '#f3e6c4', 'center', { stroke: '#0a1030', sw: 8, font: SERIF });
  DG.text(ctx, `発見 ${codexCount()} / ${WB.ALL_WORDS.length}`, W / 2, 76, 15, '#fff', 'center', { stroke: '#101840', sw: 4 });
  ctx.fillStyle = 'rgba(12,18,56,.78)'; DG.rr(ctx, 24, 90, W - 48, 508, 18); ctx.fill();
  const COLS = 6, cw = (W - 80) / COLS, ch = 52;
  WB.ALL_WORDS.forEach((w, i) => {
    const c = i % COLS, r = Math.floor(i / COLS), x = 40 + c * cw, y = 102 + r * ch;
    const tier = WB.TIER[w], known = tier === 0 || DB.codex[w] || WB.CHAPTERS.includes(w) && DB.codex[w];
    if (known) DG.worldbuild.drawCell(ctx, DG.worldbuild.sampleCell(w, Math.min(tier, 3)), x, y, 44, 1, t);
    else { ctx.fillStyle = 'rgba(255,255,255,.08)'; DG.rr(ctx, x + 2, y + 2, 40, 40, 8); ctx.fill(); DG.text(ctx, '？', x + 22, y + 30, 20, 'rgba(255,255,255,.35)', 'center'); }
    if (known) {
      DG.text(ctx, w, x + 50, y + 17, 13, '#fff3d0', 'left', { font: SERIF, maxW: cw - 54 });
      const rec = WB.RECIPES.find(q => q[2] === w); if (rec) DG.text(ctx, `${rec[0]}+${rec[1]}`, x + 50, y + 34, 10, '#9fb8ff', 'left', { font: SERIF, maxW: cw - 54 });
    }
  });
  DG.text(ctx, 'Esc / Enter / B / タップで もどる   ← → ページ', W / 2, 622, 14, '#fff', 'center', { stroke: '#101840', sw: 4 });
}

DG.i18n.add({}, [[/^第(\d+)章『(.+)』$/, m => `Chapter ${m[1]}: "${DG.t(m[2])}"`], [/^… \+(\d+)$/, m => `… +${m[1]}`], [/^あそんだ回数 (\d+)\s+CPU撃破\s+よわい (\d+)\s+ふつう (\d+)\s+つよい (\d+)\s+ふたり対戦 (\d+)回$/, m => `Games played ${m[1]}    CPU beaten  Weak ${m[2]}  Normal ${m[3]}  Strong ${m[4]}    2P battles ${m[5]}`]]);
DG.Rank = { get codexPage() { return codexPage; }, set codexPage(v) { codexPage = v; }, kanjiCount, TIERS, award, qualifies, addRecord, noteGame, noteVs, bestTitle, discover, codexCount, drawBadge, drawResult, drawRanking, drawCodex, clearAll, get name() { return DB.name; }, get db() { return DB; } };
})();
