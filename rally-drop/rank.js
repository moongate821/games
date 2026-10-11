// ランキング・称号・マーク。記録はこのブラウザの localStorage にだけ保存(外には送らない)。
(() => {
const DG = window.DG, TAU = Math.PI * 2;
const KEY = 'smokechain_v1';

// ---------- 称号(得点の段階) ----------
const TIERS = {
  smokechain: [
    { min: 0, name: '見習いドライバー' }, { min: 3000, name: '街道ドライバー' }, { min: 10000, name: '煙幕使い' }, { min: 26000, name: '玉突きの名手' },
    { min: 60000, name: '連鎖ライダー' }, { min: 130000, name: 'ギガ・ハンター' }, { min: 280000, name: '伝説の走り屋' },
  ],
};
const GAME_NAME = { smokechain: 'RALLY DROP SURVIVORS' };

// ---------- 実績(称号の脇につくマーク) ----------
function feats(game, P) {
  const f = [], st = P.stat || {};
  if (P.maxChain >= 8) f.push({ icon: '🌈', name: '連鎖の神' }); else if (P.maxChain >= 6) f.push({ icon: '🔥', name: '大連鎖の魔術師' }); else if (P.maxChain >= 4) f.push({ icon: '⚡', name: '連鎖の名手' });
  if ((st.crashes || 0) >= 20) f.push({ icon: '💥', name: '玉突きの名手' }); else if ((st.crashes || 0) >= 6) f.push({ icon: '💫', name: '玉突き事故' });
  if ((st.sblasts || 0) >= 3) f.push({ icon: '🚩', name: 'S旗の使い手' });
  if ((st.floor || 1) >= 4) f.push({ icon: '👑', name: 'ギガ・レッド撃破' }); else if ((st.floor || 1) >= 2) f.push({ icon: '🏁', name: '階層クリア' });
  if ((st.kills || 0) >= 150) f.push({ icon: '🚗', name: '敵の群れを一掃' });
  if (P.sent >= 30) f.push({ icon: '⚔️', name: '攻撃の名人' });
  if (P.placed >= 100) f.push({ icon: '🏃', name: '持久の人' });
  return f;
}
function tierOf(game, score) { const T = TIERS[game]; let t = 0; for (let i = 0; i < T.length; i++) if (score >= T[i].min) t = i; return t; }
function award(game, P) {
  const tier = tierOf(game, P.score), T = TIERS[game];
  return { game, tier, title: T[tier].name, next: T[tier + 1] || null, feats: feats(game, P) };
}

// ---------- 保存 ----------
function blank() { return { rank: { smokechain: [] }, stats: { best: { smokechain: -1 }, games: { smokechain: 0 }, cpuWins: [0, 0, 0], vs: 0 }, name: 'PLAYER' }; }
let DB = (() => { try { const d = JSON.parse(localStorage.getItem(KEY)); if (d && d.rank && d.stats) return Object.assign(blank(), d); } catch (e) {} return blank(); })();
function save() { try { localStorage.setItem(KEY, JSON.stringify(DB)); } catch (e) {} }

// score が何位に入るか(入らなければ 0)。上位10位まで
function qualifies(game, score) {
  if (score <= 0) return 0;
  const list = DB.rank[game]; let pos = 1; for (const r of list) if (r.score >= score) pos++;
  return pos <= 10 ? pos : 0;
}
function addRecord(game, rec) {
  const list = DB.rank[game]; let i = 0; while (i < list.length && list[i].score >= rec.score) i++;
  list.splice(i, 0, rec); DB.rank[game] = list.slice(0, 10); DB.name = rec.name; save(); return i + 1;
}
// 1回のプレイの終わりに呼ぶ。新しい最高称号なら true
function noteGame(game, tier) {
  DB.stats.games[game]++; const up = tier > DB.stats.best[game]; if (up) DB.stats.best[game] = tier; save(); return up;
}
function noteVs(cpuLevel) { if (cpuLevel == null) DB.stats.vs++; else DB.stats.cpuWins[cpuLevel]++; save(); }
function bestTitle() {
  let g = null, t = -1; for (const k of ['smokechain']) if (DB.stats.best[k] > t) { t = DB.stats.best[k]; g = k; }
  return t < 0 ? null : { game: g, tier: t, title: TIERS[g][t].name };
}
function clearAll() { DB = blank(); save(); }

// ---------- マーク(メダル) ----------
const PAL = [['#e0ac78', '#8a5a2e'], ['#eef1f7', '#8a93a8'], ['#fff0a0', '#c8962a'], ['#a8f5e2', '#2a9a86'], ['#b8d4ff', '#3a5fc4'], ['#e4c2ff', '#7a3fc4']];
function emblem(ctx, game, tier, size, t) {
  const R = DG[game], i = Math.min(tier, 6);
  const cell = { c: [0, 1, 2, 3, 5, 4, 7][i], oy: 0, clr: 0, hp: 1, maxhp: 1 };
  R.drawCell(ctx, cell, -size / 2, -size / 2, size, 1, t || 0, tier);
}
function star(ctx, x, y, r, rot) { ctx.beginPath(); for (let i = 0; i < 10; i++) { const a = rot + i * Math.PI / 5 - Math.PI / 2, rr = i % 2 ? r * .45 : r; ctx.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); } ctx.closePath(); ctx.fill(); }
// ゲームごとの絵柄 × 称号の段階(0〜6)でできあがるメダル
function drawBadge(ctx, game, tier, x, y, r, t) {
  t = t || 0; ctx.save(); ctx.translate(x, y);
  if (r >= 16) {   // リボン
    ctx.fillStyle = game === 'terrarium' ? '#ff8aa8' : '#7a8aff';
    for (const s of [-1, 1]) { ctx.beginPath(); ctx.moveTo(s * r * .15, r * .6); ctx.lineTo(s * r * .75, r * .6); ctx.lineTo(s * r * .6, r * 1.45); ctx.lineTo(s * r * .4, r * 1.2); ctx.lineTo(s * r * .15, r * 1.45); ctx.closePath(); ctx.fill(); }
  }
  if (tier >= 4) {   // きらめき
    const n = 4 + (tier - 4) * 2; ctx.fillStyle = 'rgba(255,255,255,.9)';
    for (let i = 0; i < n; i++) { const a = t * .8 + i * TAU / n, d = r * 1.28 + Math.sin(t * 3 + i) * r * .06; star(ctx, Math.cos(a) * d, Math.sin(a) * d, r * .13, a); }
  }
  const pal = PAL[Math.min(tier, 5)], g = ctx.createRadialGradient(-r * .3, -r * .4, r * .1, 0, 0, r * 1.05); g.addColorStop(0, pal[0]); g.addColorStop(1, pal[1]);
  ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, r, 0, TAU); ctx.fill();
  ctx.strokeStyle = tier >= 6 ? `hsl(${(t * 120) % 360},100%,65%)` : 'rgba(255,255,255,.85)';
  ctx.lineWidth = Math.max(2, r * .12); ctx.stroke();
  ctx.fillStyle = game === 'terrarium' ? 'rgba(235,255,225,.9)' : 'rgba(30,20,80,.85)'; ctx.beginPath(); ctx.arc(0, 0, r * .72, 0, TAU); ctx.fill();
  emblem(ctx, game, tier, r * 1.15, t);
  if (tier >= 6) {   // 王冠
    ctx.fillStyle = '#ffd34d'; ctx.strokeStyle = '#a8761a'; ctx.lineWidth = Math.max(1, r * .05);
    ctx.beginPath(); ctx.moveTo(-r * .5, -r * .95); ctx.lineTo(-r * .55, -r * 1.45); ctx.lineTo(-r * .2, -r * 1.15); ctx.lineTo(0, -r * 1.55); ctx.lineTo(r * .2, -r * 1.15); ctx.lineTo(r * .55, -r * 1.45); ctx.lineTo(r * .5, -r * .95); ctx.closePath(); ctx.fill(); ctx.stroke();
  }
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
  DG.text(ctx, win ? 'WIN!' : P.result === 'lose' ? 'LOSE' : 'GAME OVER', cx, 126, 38, win ? '#ffe36b' : '#fff', 'center', { stroke: '#000', sw: 6 });
  DG.text(ctx, `SCORE ${P.score}`, cx, 156, 20, '#fff', 'center', { stroke: '#000', sw: 4 });
  drawBadge(ctx, A.game, A.tier, cx, 232, 44, t);
  if (P.newTitle) DG.text(ctx, '★ 新しい称号! ★', cx, 304, 14, '#ffe36b', 'center', { stroke: '#000', sw: 4 });
  DG.text(ctx, A.title, cx, 332, 24, '#fff', 'center', { stroke: '#000', sw: 5 });
  if (A.next) DG.text(ctx, `次の称号まで あと ${A.next.min - P.score}`, cx, 352, 12, '#cfe', 'center', { stroke: '#000', sw: 3 });
  A.feats.slice(0, 4).forEach((f, i) => chip(ctx, f, cx - 100, 368 + i * 29, 200));
  if (P.rankPos) DG.text(ctx, `ランキング ${P.rankPos}位!`, cx, 506, 20, '#ffd34d', 'center', { stroke: '#000', sw: 5 });
  if (entry) {
    DG.text(ctx, 'なまえ', cx, 532, 12, '#cfe', 'center', { stroke: '#000', sw: 3 });
    ctx.fillStyle = 'rgba(0,0,0,.6)'; DG.rr(ctx, cx - 90, 538, 180, 30, 8); ctx.fill();
    DG.text(ctx, entry.name + (Math.floor(t * 2) % 2 ? '_' : ''), cx, 560, 18, '#fff', 'center');
    DG.text(ctx, 'タイプして Enter で決定', cx, 584, 11, '#cfe', 'center', { stroke: '#000', sw: 3 });
  }
}

// ---------- ランキング画面 ----------
function drawRanking(ctx, t, W, H) {
  DG.Art.bgMenu(ctx, t, W, H);
  DG.text(ctx, '🏆 RANKING', W / 2, 62, 42, '#fff', 'center', { stroke: '#5a3a9a', sw: 9 });
  ['smokechain'].forEach((g, k) => {
    const x0 = (W - 430) / 2, w = 430, light = false;
    ctx.fillStyle = light ? 'rgba(255,255,255,.82)' : 'rgba(20,10,60,.78)'; DG.rr(ctx, x0, 96, w, 468, 22); ctx.fill();
    ctx.lineWidth = 3; ctx.strokeStyle = light ? '#8fd89a' : '#8a7aff'; ctx.stroke();
    const ink = light ? '#2c4a34' : '#e6eeff', sub = light ? '#5a7a62' : '#9db4ee';
    DG.text(ctx, GAME_NAME[g], x0 + w / 2, 126, 22, light ? '#2f7a45' : '#cfd8ff', 'center');
    const list = DB.rank[g];
    for (let i = 0; i < 10; i++) {
      const y = 140 + i * 42, r = list[i];
      if (i < 3) { ctx.fillStyle = ['#ffd34d', '#d8dde8', '#d9a066'][i]; ctx.beginPath(); ctx.arc(x0 + 30, y + 21, 14, 0, TAU); ctx.fill(); DG.text(ctx, String(i + 1), x0 + 30, y + 27, 16, '#4a3000', 'center'); }
      else DG.text(ctx, String(i + 1), x0 + 30, y + 27, 16, sub, 'center');
      if (r) {
        drawBadge(ctx, g, r.tier, x0 + 74, y + 21, 15, t);
        DG.text(ctx, r.name, x0 + 100, y + 19, 16, ink); DG.text(ctx, r.title + (r.lv ? ' ・' + r.lv : ''), x0 + 100, y + 35, 11, sub);
        DG.text(ctx, String(r.score), x0 + w - 22, y + 24, 20, ink, 'right');
        if (r.chain >= 4) DG.text(ctx, `${r.chain}連鎖`, x0 + w - 22, y + 37, 10, '#e08a00', 'right');
      } else DG.text(ctx, '---', x0 + 100, y + 27, 16, sub);
    }
  });
  const s = DB.stats;
  DG.text(ctx, `あそんだ回数 ${s.games.smokechain}`, W / 2, 594, 14, '#fff', 'center', { stroke: '#1a1a40', sw: 4 });
  DG.text(ctx, 'Esc / Enter / タップで もどる', W / 2, 622, 14, '#fff', 'center', { stroke: '#3a2a7a', sw: 4 });
}

DG.Rank = { TIERS, award, qualifies, addRecord, noteGame, noteVs, bestTitle, drawBadge, drawResult, drawRanking, clearAll, get name() { return DB.name; }, get db() { return DB; } };
})();
