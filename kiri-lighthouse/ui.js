/* 霧の灯台 ui.js  入力・HUD・画面遷移・セーブ・図鑑・チュートリアル */
(function () {
'use strict';
var Fog = window.Fog, Run = Fog.Run, D = Fog.DATA, E = Fog.Engine, R = Fog.Render, A = Fog.Audio;
var T = D.TOWERS, EN = D.ENEMIES, BO = D.BOSSES, ST = D.STORY, B = D.BALANCE, TS = B.tileSize;
function $(id) { return document.getElementById(id); }
function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
function fmt(n) { return Math.floor(n).toLocaleString('en-US'); }
function defE(id) { return EN[id] || BO[id]; }

/* ================= セーブ ================= */
var KEY = 'kiri_save_v1', storageOK = true;
function defSave() {
  var rm = false; try { rm = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) { }
  return { v: 1, stages: {}, codex: { towers: {}, enemies: {} }, settings: { bgm: 0.5, sfx: 0.7, uiScale: 1, reduce: rm, vibr: true, speedMem: true, oneTap: false, cb: false, speed: 1, fx: 1 },
    run: { returned: 0, best: 0, runs: 0, wins: 0 }, daily: { last: '', streak: 0, best: {} }, tutorialDone: false, tutStarted: false, seenHints: {}, stats: { oilTotal: 0, freezes: 0, earlyCalls: 0, plays: 0 }, ach: {}, heard: {}, letters: {} };
}
function migrate(o) { var d = defSave(); if (!o || o.v !== 1) return d; for (var k in d) if (o[k] == null) o[k] = d[k]; for (var s in d.settings) if (o.settings[s] == null) o.settings[s] = d.settings[s]; for (var t in d.stats) if (o.stats[t] == null) o.stats[t] = d.stats[t]; return o; }
function loadSave() {
  var raw = null;
  try { raw = localStorage.getItem(KEY); } catch (e) { storageOK = false; return defSave(); }
  if (!raw) return defSave();
  try { return migrate(JSON.parse(raw)); } catch (e) { try { localStorage.setItem(KEY + '.bak', raw); } catch (e2) { } return defSave(); }
}
var save = loadSave(), saveTimer = null;
function writeSave() { try { localStorage.setItem(KEY, JSON.stringify(save)); } catch (e) { storageOK = false; } }
function saveSoon() { clearTimeout(saveTimer); saveTimer = setTimeout(writeSave, 500); }
function hasProgress() { return save.tutStarted || Object.keys(save.stages).length > 0 || save.stats.plays > 0; }
function totalStars() { var n = 0; for (var k in save.stages) n += save.stages[k].stars || 0; return n; }
function unlockedStage(id) { return id === 1 || !!(save.stages[id - 1] && save.stages[id - 1].cleared); }
var S = function () { return save.settings; };

/* ================= 共通UI ================= */
var U2 = { flashArm: false, combo: 0, comboT: 0 };
var RC = null, resultTimer = null, resultFor = null, undoTimer = null;
var screen = 'title', layoutName = 'lw', G = null, U = {}, running = false, paused = false, speed = 1, acc = 0, ended = false, modalOpen = false, stageId = 0, stageOpts = {};
var toastQ = [];
function toast(msg, kind) {
  var box = $('toasts'); if (box.children.length > 3) box.removeChild(box.firstChild);
  var d = document.createElement('div'); d.className = 'toast ' + (kind || 'info'); d.textContent = msg; box.appendChild(d); setTimeout(function () { if (d.parentNode) d.parentNode.removeChild(d); }, 2200);
}
function vib(ms) { if (S().vibr && navigator.vibrate) try { navigator.vibrate(ms); } catch (e) { } }
function banner(main, sub) { var b = $('banner'); b.innerHTML = esc(main) + (sub ? '<small>' + esc(sub) + '</small>' : ''); b.classList.remove('show'); void b.offsetWidth; b.classList.add('show'); }
function modal(html, btns, o) {
  o = o || {}; modalOpen = true; var m = $('modal'), box = $('mbox'); box.innerHTML = html + '<div class="mbtns' + (o.row ? ' row' : '') + '" id="mb"></div>';
  var mb = $('mb'); (btns || []).forEach(function (b) { var e = document.createElement('button'); e.className = 'btn ' + (b.cls || ''); e.textContent = b.t; e.onclick = function () { A.sfx('click'); if (b.keep !== true) closeModal(); if (b.f) b.f(); }; mb.appendChild(e); });
  m.classList.remove('hidden'); var f = mb.querySelector('.pri'); if (f) f.focus();
}
function closeModal() { modalOpen = false; $('modal').classList.add('hidden'); $('mbox').innerHTML = ''; }
function confirmBox(msg, yes, no) { modal('<div class="body" style="text-align:center">' + msg + '</div>', [{ t: 'いいえ', cls: 'pri', f: no }, { t: 'はい', f: yes }], { row: true }); }
function show(name) {
  screen = name; ['title', 'select', 'battle', 'codex'].forEach(function (n) { $('scr-' + n).classList.toggle('on', n === name); });
  if (name === 'title') { $('t-cont').classList.toggle('dis', !hasProgress()); $('warn').textContent = storageOK ? '' : '保存できない環境です(進行は記録されません)'; }
  layout();
}

/* ================= レイアウト ================= */
function layout() {
  var w = window.innerWidth, h = window.innerHeight, L = h > w ? 'pt' : (h < 500 || w < 900) ? 'lc' : 'lw'; layoutName = L;
  document.documentElement.style.setProperty('--ui-scale', S().uiScale);
  var b = $('scr-battle'); b.classList.remove('lw', 'lc', 'pt'); b.classList.add(L);
  var sp = $('selpanel'); if (L === 'lc') { if (sp.parentNode.id !== 'boardWrap') $('boardWrap').appendChild(sp); } else if (sp.parentNode.id !== 'side') $('side').appendChild(sp);
  var sc = $('scr-select'); sc.classList.toggle('sel-wide', L !== 'pt'); sc.classList.toggle('sel-portrait', L === 'pt');
  $('scr-codex').classList.toggle('cx-portrait', L === 'pt');
  var map = $('map'); if (L === 'pt') { map.style.right = '0'; map.style.bottom = '48%'; } else { map.style.right = '360px'; map.style.bottom = '0'; }
  if (L === 'lc') map.style.right = '330px';
  var wrap = $('boardWrap'); wrap.style.height = L === 'pt' ? Math.round(w * 9 / 16) + 'px' : '';
  if (screen === 'battle') {
    var cw = wrap.clientWidth, ch = wrap.clientHeight, s = Math.min(cw / 960, ch / 540); R.resize(Math.floor(960 * s), Math.floor(540 * s));
  }
  ['titleCv', 'selCv'].forEach(function (id) { var c = $(id); c.width = Math.min(1280, w); c.height = Math.min(720, h); });
  if (screen === 'select') renderSelect();
  if (screen === 'codex') renderCodex();
}
window.addEventListener('resize', function () { layout(); });
window.addEventListener('orientationchange', function () { setTimeout(layout, 120); });

/* ================= 設定 ================= */
function applySettings() { R.setFxLevel(S().fx); A.setVolumes(S().bgm, S().sfx); document.documentElement.style.setProperty('--ui-scale', S().uiScale); }
function openSettings(back) {
  var s = S();
  var h = '<h2>設 定</h2>' +
    '<div class="setrow"><label>BGM 音量</label><input type="range" id="st-bgm" min="0" max="10" value="' + Math.round(s.bgm * 10) + '"></div>' +
    '<div class="setrow"><label>SE 音量</label><input type="range" id="st-sfx" min="0" max="10" value="' + Math.round(s.sfx * 10) + '"></div>' +
    '<div class="setrow"><label>UIの大きさ</label><select id="st-ui"><option value="0.9">小</option><option value="1">標準</option><option value="1.2">大</option></select></div>' +
    '<div class="setrow"><label>エフェクトの量</label><select id="st-fx"><option value="2">多</option><option value="1">普通</option><option value="0">少(軽い)</option></select></div>' +
    '<div class="setrow"><label>画面揺れ・点滅を軽減</label><input type="checkbox" id="st-rm"></div>' +
    '<div class="setrow"><label>振動(スマホ)</label><input type="checkbox" id="st-vb"></div>' +
    '<div class="setrow"><label>速度を記憶</label><input type="checkbox" id="st-sm"></div>' +
    '<div class="setrow"><label>1タップで建設(確認なし)</label><input type="checkbox" id="st-ot"></div>' +
    '<div class="setrow"><label>色覚配慮(射程線を高コントラストに)</label><input type="checkbox" id="st-cb"></div>';
  modal(h, [{ t: 'チュートリアルを再表示', f: function () { save.tutorialDone = false; save.tutStarted = false; saveSoon(); toast('次に第1面を始めると再表示されます'); openSettings(back); }, keep: true },
    { t: 'データ消去', f: function () { confirmBox('すべての進行を消去します。よろしいですか?', function () { confirmBox('本当に消去しますか?(元に戻せません)', function () { var st = save.settings; save = defSave(); save.settings = st; writeSave(); toast('消去しました'); if (screen === 'select') renderSelect(); show('title'); }, function () { openSettings(back); }); }, function () { openSettings(back); }); }, keep: true },
    { t: '閉じる', cls: 'pri', f: function () { writeSave(); if (back) back(); } }]);
  $('st-ui').value = String(s.uiScale); $('st-fx').value = String(s.fx); $('st-fx').onchange = function () { s.fx = +this.value; R.setFxLevel(s.fx); saveSoon(); }; $('st-rm').checked = s.reduce; $('st-vb').checked = s.vibr; $('st-sm').checked = s.speedMem; $('st-ot').checked = s.oneTap; $('st-cb').checked = s.cb;
  $('st-bgm').oninput = function () { s.bgm = this.value / 10; applySettings(); saveSoon(); };
  $('st-sfx').oninput = function () { s.sfx = this.value / 10; applySettings(); saveSoon(); }; $('st-sfx').onchange = function () { A.sfx('build'); };
  $('st-ui').onchange = function () { s.uiScale = +this.value; applySettings(); layout(); saveSoon(); };
  [['st-rm', 'reduce'], ['st-vb', 'vibr'], ['st-sm', 'speedMem'], ['st-ot', 'oneTap'], ['st-cb', 'cb']].forEach(function (p) { $(p[0]).onchange = function () { s[p[1]] = this.checked; saveSoon(); }; });
}
function openCredits() {
  modal('<h2>霧の灯台</h2><div class="body" style="text-align:center;font-size:.95em">灯台守ナギと、霧の中の迷いたちの物語。<br>光は、倒すためではなく、帰り道を示すためにある。<br><br>外部ライブラリ・外部画像なし。<br>絵と音はすべてその場で手続き生成しています。</div>', [{ t: '閉じる', cls: 'pri' }]);
}

/* ================= タイトル ================= */
$('t-cont').onclick = function () { A.resume(); A.bgmStart('menu'); if (!hasProgress()) return; goSelect(); };
$('t-new').onclick = function () {
  A.resume(); A.bgmStart('menu');
  var go = function () { var st = save.settings; save = defSave(); save.settings = st; save.tutStarted = true; writeSave(); startStage(1); };
  if (hasProgress()) confirmBox('今までの記録を消して、最初から始めますか?', go); else go();
};
$('t-codex').onclick = function () { A.resume(); A.bgmStart('menu'); codexBack = 'title'; show('codex'); renderCodex(); };
$('t-set').onclick = function () { A.resume(); openSettings(); };
$('t-credit').onclick = function () { A.resume(); openCredits(); };

/* ================= ステージ選択 ================= */
var selStage = 1, NODE_POS = [[12, 22], [34, 22], [56, 22], [78, 22], [78, 50], [56, 50], [34, 50], [12, 50], [12, 78], [34, 78], [56, 78], [78, 78]];
function goSelect() {
  show('select'); A.bgmStart('menu'); A.setMode('menu'); var last = 1; for (var i = 1; i <= 12; i++) if (unlockedStage(i)) last = i; selStage = Math.min(selStage || 1, last); if (!unlockedStage(selStage)) selStage = last; renderSelect();
}
function starStr(n) { return '<span class="stars">' + [1, 2, 3].map(function (i) { return i <= n ? '★' : '<span class="off">★</span>'; }).join('') + '</span>'; }
function renderSelect() {
  var map = $('map'), svg = $('mapsvg'), pts = [], i; $('s-stars').textContent = '★ ' + totalStars() + ' / 36';
  svg.setAttribute('viewBox', '0 0 100 100'); var path = ''; NODE_POS.forEach(function (p, k) { path += (k ? 'L' : 'M') + p[0] + ' ' + p[1] + ' '; });
  svg.innerHTML = '<path d="' + path + '" fill="none" stroke="#34507a" stroke-width="0.5" stroke-dasharray="1.5 1.5" vector-effect="non-scaling-stroke" style="stroke-width:2px"/>';
  Array.prototype.slice.call(map.querySelectorAll('.node')).forEach(function (n) { n.remove(); });
  for (i = 1; i <= 12; i++) (function (id) {
    var p = NODE_POS[id - 1], b = document.createElement('button'), ss = save.stages[id], un = unlockedStage(id);
    b.className = 'node' + (ss && ss.cleared ? ' cleared' : '') + (un ? '' : ' locked') + (id === selStage ? ' sel' : ''); b.style.left = p[0] + '%'; b.style.top = p[1] + '%';
    b.innerHTML = '<div class="c">' + id + '<small>' + (un ? (ss && ss.cleared ? '★'.repeat(ss.stars) + '☆'.repeat(3 - ss.stars) : 'NEW') : '霧') + '</small></div>';
    b.onclick = function () { A.resume(); A.sfx('click'); if (!un) { toast('前の航路を進めよう', 'warn'); return; } selStage = id; renderSelect(); };
    map.appendChild(b);
  })(i);
  renderDetail();
}
function renderDetail() {
  var st = D.STAGES[selStage - 1], ss = save.stages[selStage] || {}, d = $('detail');
  var en = st.enemyIds.map(function (id) { return '<span class="chip">' + (save.codex.enemies[id] ? esc(defE(id).name) : '???') + '</span>'; }).join('');
  var tw = st.towers.map(function (id) { return '<span class="chip">' + esc(T[id].name) + (st.newTowers.indexOf(id) >= 0 ? ' NEW' : '') + '</span>'; }).join('');
  var dawnOk = totalStars() >= 24 && ss.cleared;
  d.innerHTML = '<h3>' + selStage + '「' + esc(st.name) + '」</h3>' + (ss.cleared ? starStr(ss.stars) : '<span class="stars"><span class="off">★★★</span></span>') +
    '<div class="row">ウェーブ <b>' + st.waves.length + '</b>　スロット <b>' + st.slotsN + '</b>　初期油 <b>' + st.oil + '</b></div>' +
    '<div class="row">敵</div><div class="chips">' + en + '</div><div class="row">使える灯り</div><div class="chips">' + tw + '</div>' +
    '<div class="row">' + esc(st.gimmick) + '</div>' +
    (dawnOk ? '<div class="row"><label><input type="checkbox" id="dawnck"' + (stageOpts.dawn ? ' checked' : '') + '> 夜明けモード(濃霧なし・敵HP×0.9。星は更新しません)</label></div>' : '') +
    '<div style="margin-top:10px"><button class="btn pri big" id="go" style="width:100%">出 航</button></div>';
  var dk = $('dawnck'); if (dk) dk.onchange = function () { stageOpts.dawn = this.checked; };
  $('go').onclick = function () { A.resume(); stageOpts.dawn = dk ? dk.checked : false; startStage(selStage, { dawn: stageOpts.dawn && dawnOk }); };
}
$('s-back').onclick = function () { show('title'); };
$('s-codex').onclick = function () { codexBack = 'select'; show('codex'); renderCodex(); };
$('s-set').onclick = function () { openSettings(); };

/* ================= 戦闘: 開始 ================= */
var DT = B.DT;
function startStage(id, o) {
  o = o || {}; stageId = id; ended = false; paused = false; running = false; acc = 0;
  clearTimeout(resultTimer); resultFor = null; if (!o.run) RC = null;
  G = E.createGame(id, Object.assign({ seed: (Date.now() & 0x7fffffff) || 1, dawn: !!o.dawn }, o.gopts || {})); G.dawnMode = !!o.dawn; G.runMode = !!o.run;
  R.setStage(G.stage); R.resetFog(0.72); R.resetDawn(); A.setStageMusic(id); A.setLast(false); U2 = { flashArm: false, combo: 0, comboT: 0, hitstop: 0, slowEv: 0, slowCur: 1, heartT: 0 };
  U = { panelOpen: false, synLines: null, placing: null, selSlot: null, selTower: null, ghost: null, hiSlot: null, hoverEnemy: null, hoverSlot: null, lastSel: '' };
  speed = S().speedMem ? (S().speed || 1) : 1; $('hint').classList.remove('on'); hintQ.length = 0; Tut.on = false; $('tut').classList.remove('on');
  save.stats.plays++; save.tutStarted = true; saveSoon();
  buildPalette(); show('battle'); A.bgmStart('battle'); A.setMode('battle'); $('toasts').innerHTML = '';
  var st = G.stage; $('b-bell').style.display = st.bell ? '' : 'none'; $('b-flash').style.display = (id >= 2 || o.run) ? '' : 'none'; $('undobar').classList.remove('on'); $('resumebar').classList.remove('on'); $('combo').classList.remove('on');
  updateHud(true); updatePreview();
  save.heard[id] = 1;
  if (o.run) { running = true; setTimeout(function () { toast('第' + (RC.run.night + 1) + '夜「' + st.name + '」', 'info'); }, 200); return; }
  showDialog(st.intro, function () {
    running = true; queueStageHints(id);
    if (id === 1 && !save.tutorialDone) setTimeout(tutStart, 300);
  });
}
function showDialog(lines, done) {
  modalOpen = true;
  var h = '<div class="dlg">' + lines.map(function (l) { return '<div><span class="who">' + esc(l[0]) + '</span><div style="margin:2px 0 6px;line-height:1.6">' + esc(l[1]) + '</div></div>'; }).join('') + '</div>';
  modal(h, [{ t: 'はじめる', cls: 'pri', f: function () { done && done(); } }]);
}

/* ================= パレット/選択パネル ================= */
function buildPalette() {
  var p = $('palette'); p.innerHTML = '';
  G.stage.towers.forEach(function (id, k) {
    var d = T[id], b = document.createElement('button'); b.className = 'pal'; b.dataset.def = id;
    if (G.banned && G.banned.indexOf(id) >= 0) b.classList.add('ban');
    b.innerHTML = '<span class="key">' + (k + 1) + '</span><canvas width="96" height="96"></canvas><span class="cost">' + d.cost + '</span><span class="nm">' + esc(d.name) + '</span>';
    p.appendChild(b); var cv = b.querySelector('canvas'); R.drawTowerIcon(cv.getContext('2d'), id, 48, 58, 84, 0);
    b.onclick = function () { A.resume(); A.sfx('click'); chooseTower(id); };
  });
}
function chooseTower(id) {
  if (!G || !running) return; if (G.banned.indexOf(id) >= 0) { toast('この夜は使えない灯りです', 'warn'); A.sfx('deny'); return; }
  if (U.placing === id) { U.placing = null; refreshSel(); return; }
  U.placing = id; U.selTower = null;
  if (U.selSlot != null && G.slots[U.selSlot].tower) U.selSlot = null;
  if (U.selSlot != null && S().oneTap) { doBuild(); return; }
  refreshSel();
}
function statLine(id, L) {
  var p = [];
  if (L.atk != null) p.push('攻撃 ' + L.atk + (id === 'T8' ? '(0.25秒毎)' : ''));
  if (L.range) p.push('射程 ' + L.range);
  if (L.iv) p.push('間隔 ' + L.iv.toFixed(2) + 's');
  if (L.atk != null && L.iv) p.push('DPS ' + (L.atk / L.iv).toFixed(1)); if (id === 'T8') p.push('DPS ' + (L.atk * 4));
  if (L.light) p.push('光 ' + L.light); if (L.blast) p.push('爆風 ' + L.blast); if (L.slow) p.push('減速 ' + Math.round(L.slow * 100) + '%');
  if (L.chain) p.push('連鎖 ' + L.chain); if (L.beamLen) p.push('光線 ' + L.beamLen); if (L.income) p.push('1波 +' + L.income + '油');
  if (L.infl) p.push('扇の長さ ' + L.infl + ' / 光+' + (L.add * 1.5).toFixed(2) + (L.buff ? ' / 攻+10%' : ''));
  if (L.cone) p.push('扇' + L.cone + '°'); if (L.upkeep) p.push('維持費' + L.upkeep + '/波'); if (L.slowDur) p.push('減速' + L.slowDur + 's'); if (L.shieldPierce) p.push('盾を貫く');
  if (L.stun) p.push('スタン' + L.stun + 's'); if (L.freeze) p.push('凍結' + Math.round(L.freeze * 100) + '%'); if (L.pierce) p.push('貫通' + L.pierce + '体'); if (L.strong) p.push('照らされ強化');
  return p.join(' / ');
}
var PRIO = { first: '狙い: 灯台に近い', weak: '狙い: 弱い', strong: '狙い: 強い' };
function chips(list) { var seen = {}; return list.filter(function (x) { if (seen[x.name + x.dir]) return false; seen[x.name + x.dir] = 1; return true; }).map(function (x) { return '<span class="chip" style="border-color:' + (x.dir === 'give' ? '#ffd27a' : '#a8f0d4') + '">' + esc(x.name) + (x.dir === 'give' ? '→' : '←') + '</span>'; }).join(' '); }
function selHtml() {
  if (!G) return '';
  var tw = U.selTower, h = '';
  if (tw && G.towers.indexOf(tw) < 0) { U.selTower = tw = null; }
  if (tw) {
    var d = T[tw.def], L = E.LV(tw), up = E.upkeepOf(G, tw), sv = E.sellValue(G, tw), sl = E.synList(G, tw), cost = E.upgradeCost(tw);
    h += '<h4>' + esc(d.name) + ' <span class="num">Lv' + (tw.lv + 1) + (tw.br === 'b' ? ' B' : tw.br === 'a' ? ' A' : '') + '</span></h4><div class="st">' + statLine(tw.def, L) + '</div>';
    if (sl.length) h += '<div class="st">相性: ' + chips(sl) + '</div>';
    if (d.light) h += '<div class="st">維持費 ' + up + '/波' + (tw.off ? ' (休灯中)' : tw.auto ? ' (油切れで休灯)' : '') + (tw.upDisc ? ' 汲み置き-1' : '') + '</div>';
    if (tw.def === 'T6') h += '<div class="st">向き ' + (tw.aim * 45) + '°。扇の中のライトだけ光が広がる(○/×の印)</div>';
    h += '<div class="acts">';
    if (tw.lv === 2 && d.lv3b) h += branchBtns(tw);
    else h += tw.lv >= 3 ? '<button class="btn dis">最大</button>' : '<button class="btn pri' + (G.oil < cost ? ' dis' : '') + '" data-act="up">強化 ' + cost + '</button>';
    h += '<button class="btn" data-act="sell">売却 +' + sv + '</button>';
    if (tw.def === 'T6') h += '<button class="btn" data-act="aimL">◀ 回す</button><button class="btn" data-act="aimR">回す ▶</button>';
    if (d.light) h += '<button class="btn" data-act="dim">' + (tw.off ? '点灯' : '休灯') + '</button>';
    if (!d.support && !d.beam) h += '<button class="btn" data-act="prio">' + PRIO[tw.prio] + '</button>';
    h += '<button class="btn" data-act="close" style="flex:0 0 52px;min-width:52px">×</button></div>';
    return h;
  }
  if (U.placing) {
    var pd = T[U.placing], ok = U.selSlot != null && !G.slots[U.selSlot].tower, spv = ok ? E.synPreview(G, U.placing, G.slots[U.selSlot]) : null;
    h += '<h4>' + esc(pd.name) + ' <span class="num">' + pd.cost + '</span></h4><div class="st">' + esc(pd.desc) + '</div><div class="st">' + statLine(U.placing, pd.lv[0]) + '</div>';
    if (spv) { var n = spv.recv.length + spv.give.length; h += '<div class="st diff">ここに置くと相性 ' + n + '個 ' + chips(spv.recv.map(function (x) { return { name: x.name, dir: 'recv' }; }).concat(spv.give.map(function (x) { return { name: x.name, dir: 'give' }; }))) + '</div>'; }
    else h += '<div class="st diff">' + esc(pd.special) + '</div>';
    h += '<div class="acts">' + (ok ? '<button class="btn pri' + (G.oil < pd.cost ? ' dis' : '') + '" data-act="build">建設 ' + pd.cost + '</button>' : '<div class="st" style="flex:1;align-self:center">光っている四角をタップして置く場所を選ぶ</div>') + '<button class="btn" data-act="close" style="flex:0 0 52px;min-width:52px">×</button></div>';
    return h;
  }
  if (U.selSlot != null) return '<h4>スロット</h4><div class="st">建てる灯りを選んでください。(' + (G.slots[U.selSlot].kind === 'rock' ? '岩礁: 光+0.5' : G.slots[U.selSlot].kind === 'wreck' ? '沈没船: 光+1.0・油汲み不可' : G.slots[U.selSlot].kind === 'sky' ? '空の要所' : G.slots[U.selSlot].kind === 'prime' ? '特等席' : '通常') + ')</div><div class="acts"><button class="btn" data-act="close" style="flex:0 0 52px;min-width:52px">×</button></div>';
  if (layoutName === 'lw') return '<div class="st">灯りを選んで、光っている四角に置こう。<br>近くに置いた塔どうしは「相性」で助け合う。<br><span class="num">1-' + G.stage.towers.length + '</span>灯り / <span class="num">U</span>強化 / <span class="num">S</span>売却 / <span class="num">D</span>休灯 / <span class="num">R</span>鏡を回す<br><span class="num">N</span>次の波 / <span class="num">F</span>速度 / <span class="num">Space</span>ポーズ</div>';
  return '';
}
function branchBtns(tw) {
  var d = T[tw.def], cost = d.lv[3].up;
  return ['a', 'b'].map(function (k, i) { return '<button class="btn pri' + (G.oil < cost ? ' dis' : '') + '" data-act="up' + k.toUpperCase() + '" style="flex:1 1 45%;flex-direction:column;line-height:1.3;gap:0"><b>' + k.toUpperCase() + ' ' + esc(d.branch[i]) + ' ' + cost + '</b><span style="font-size:.78em;font-weight:400">' + esc(d.branch[2 + i]) + '</span></button>'; }).join('');
}
function refreshSel() {
  if (!G) return; var h = selHtml(), sp = $('selpanel'); sp.classList.toggle('on', !!h);
  if (h !== U.lastSel) { sp.innerHTML = h; U.lastSel = h; }
}
$('selpanel').addEventListener('click', function (ev) {
  var t = ev.target.closest('[data-act]'); if (!t || !G) return; A.resume(); A.sfx('click'); var a = t.dataset.act;
  if (a !== 'close' && a !== 'prio' && a !== 'build' && a !== 'up' && a !== 'upA' && a !== 'upB' && a !== 'sell' && viewOnly()) return;
  if (a === 'close') { U.placing = null; U.selSlot = null; U.selTower = null; }
  else if (a === 'build') doBuild();
  else if (a === 'up') doUpgrade();
  else if (a === 'upA') doUpgrade('a');
  else if (a === 'upB') doUpgrade('b');
  else if (a === 'sell') doSell();
  else if (a === 'dim' && U.selTower) E.exec(G, { c: 'dim', id: U.selTower.id, on: !U.selTower.off });
  else if (a === 'aimL' && U.selTower) E.exec(G, { c: 'aim', id: U.selTower.id, rel: -1 });
  else if (a === 'aimR' && U.selTower) E.exec(G, { c: 'aim', id: U.selTower.id, rel: 1 });
  else if (a === 'prio' && U.selTower) { var order = ['first', 'weak', 'strong']; var n = order[(order.indexOf(U.selTower.prio) + 1) % 3]; E.exec(G, { c: 'prio', id: U.selTower.id, mode: n }); }
  U.lastSel = ''; refreshSel();
});
var DENY = { oil: '油が足りない', occupied: 'ここには置けない', nopump: '沈没船のスロットには油汲みを置けない', pumpmax: '油汲みは1ステージに3基まで', locked: 'まだ使えない灯り', slot: 'ここには置けない', max: 'これ以上は強化できない', branch: 'AかBを選んでください', banned: 'この夜は使えない灯り', cd: 'ひと灯りは充電中', offer: '', locked: 'この札は変えられない', end: '', spawning: '前の波が出現中' };
function deny(r) { if (DENY[r]) toast(DENY[r], 'warn'); A.sfx('deny'); vib(30); if (r === 'oil') { var o = $('oilv'); o.classList.remove('flash'); void o.offsetWidth; o.classList.add('flash'); } }
function viewOnly() { if (paused) { toast('一時停止中は見るだけです', 'info'); return true; } return false; }
function doBuild() {
  if (!G || U.selSlot == null || !U.placing || viewOnly()) return; var def = U.placing;
  var r = E.exec(G, { c: 'build', slot: U.selSlot, def: def });
  if (!r.ok) { deny(r.reason); return; }
  var keep = false; U.placing = null; U.selSlot = null; U.selTower = null; U.hiSlot = null; U.lastSel = ''; refreshSel();
  tutEvent('build' + def);
}
function doUpgrade(br) { if (!U.selTower || viewOnly()) return; var tw = U.selTower, r = E.exec(G, { c: 'upgrade', id: tw.id, br: br }); if (!r.ok) deny(r.reason); else { tutEvent('upgrade'); if (tw.lv === 2) pushHint('branch', ST.hints.branch); showUndo(); } }
function showUndo() { var u = $('undobar'); u.classList.add('on'); clearTimeout(undoTimer); undoTimer = setTimeout(function () { u.classList.remove('on'); }, 4000); }
$('undobar').onclick = function () { if (!G || viewOnly()) return; if (E.exec(G, { c: 'undo' }).ok) { this.classList.remove('on'); U.lastSel = ''; refreshSel(); } };
function doSell() {
  var tw = U.selTower; if (!tw || viewOnly()) return; var v = E.sellValue(G, tw), wasPaused = paused;
  paused = true; confirmBox(esc(T[tw.def].name) + ' を売却しますか?<br>油 +' + v + ' 戻ります', function () { paused = wasPaused; E.exec(G, { c: 'sell', id: tw.id }); U.selTower = null; U.lastSel = ''; refreshSel(); }, function () { paused = wasPaused; });
}

/* ================= 入力 ================= */
var cv = $('game'), pdown = null;
function toBoard(ev) { var r = cv.getBoundingClientRect(); return { x: (ev.clientX - r.left) / r.width * D.W, y: (ev.clientY - r.top) / r.height * D.H }; }
cv.addEventListener('pointerdown', function (ev) { A.resume(); if (pdown) return; pdown = { id: ev.pointerId, x: ev.clientX, y: ev.clientY, t: performance.now(), type: ev.pointerType }; try { cv.setPointerCapture(ev.pointerId); } catch (e) { } ev.preventDefault(); });
cv.addEventListener('pointermove', function (ev) {
  if (!G || modalOpen) return; if (ev.pointerType === 'mouse' || ev.pointerType === 'pen') {
    var p = toBoard(ev); U.hoverSlot = null; var bd = 0.7;
    G.slots.forEach(function (s) { var d = Math.hypot(s.x - p.x, s.y - p.y); if (d < bd && !s.tower) { bd = d; U.hoverSlot = s.id; } });
    U.hoverEnemy = null; G.enemies.forEach(function (e) { if (e.alive && e.vis && Math.hypot(e.x - p.x, e.y - p.y) < 0.6) U.hoverEnemy = e; });
  }
});
cv.addEventListener('pointerleave', function () { if (U) { U.hoverSlot = null; U.hoverEnemy = null; } });
cv.addEventListener('pointerup', function (ev) {
  if (!pdown || ev.pointerId !== pdown.id) return; var d = Math.hypot(ev.clientX - pdown.x, ev.clientY - pdown.y), ty = pdown.type; pdown = null;
  if (ended && G && G.phase === 'WIN' && resultFor !== G && !modalOpen) { showResult(); return; }
  if (d > 14 || !G || modalOpen || !running) return; var p = toBoard(ev); if (U2.flashArm) { doFlash(p.x, p.y); return; } onTap(p.x, p.y, ty);
});
cv.addEventListener('pointercancel', function () { pdown = null; });
cv.addEventListener('contextmenu', function (ev) { ev.preventDefault(); if (G) { U.placing = null; U.selSlot = null; U.selTower = null; refreshSel(); } });
function doFlash(x, y) { U2.flashArm = false; $('b-flash').classList.remove('on'); if (viewOnly()) return; var r = E.exec(G, { c: 'flash', x: x, y: y }); if (!r.ok) deny(r.reason); else A.sfx('wave'); }
function onTap(x, y, ty) {
  var pkb = null, pkd = 1.5; G.pickups.forEach(function (q) { var d = Math.hypot(q.x - x, q.y - y); if (d < pkd) { pkd = d; pkb = q; } }); if (pkb) { if (!viewOnly()) E.exec(G, { c: 'pick', id: pkb.id }); return; }
  var rs = ty === 'touch' ? 0.8 : 0.7, bd, best;
  if (!U.placing) {
    best = null; bd = 1e9; G.enemies.forEach(function (e) { if (!e.alive || !e.vis) return; var d = Math.hypot(e.x - x, e.y - y - (e.flying ? 0.3 : 0)); if (d <= R.ESIZE_V[e.def] / TS + 0.35 && d < bd) { bd = d; best = e; } });
    if (best) { var df = defE(best.def); toast(df.name + '  HP ' + Math.ceil(best.hp) + '/' + Math.ceil(best.hpMax) + (best.shield > 0 ? ' (盾あり)' : '') + (best.lit ? '  照らされ' : ''), 'info'); return; }
  }
  best = null; bd = 0.8; G.towers.forEach(function (t) { var d = Math.hypot(t.x - x, t.y - 0.15 - y); if (d < bd) { bd = d; best = t; } });
  if (best && !U.placing) { U.selTower = best; U.selSlot = null; refreshSel(); return; }
  var bs = null; bd = rs; G.slots.forEach(function (s) { var d = Math.hypot(s.x - x, s.y - y); if (d < bd) { bd = d; bs = s; } });
  if (bs) {
    if (bs.tower) { U.selTower = bs.tower; U.selSlot = null; U.placing = null; refreshSel(); return; }
    if (U.placing) { if (U.selSlot === bs.id || S().oneTap) { U.selSlot = bs.id; doBuild(); return; } }
    U.selSlot = bs.id; U.selTower = null; tutEvent('slot'); refreshSel(); return;
  }
  U.selSlot = null; U.selTower = null; if (U.placing && ty !== 'mouse') U.placing = null; refreshSel();
}
window.addEventListener('keydown', function (ev) {
  if (screen !== 'battle' || !G) { return; }
  if (ev.key === 'F1' && /debug=1/.test(location.search)) { G.oil += 500; G.cheat = true; ev.preventDefault(); return; }
  if (modalOpen) { if (ev.key === 'Escape' && paused) { var bt = document.querySelector('#mbox .btn.pri'); if (bt) bt.click(); } return; }
  var k = ev.key;
  if (k === ' ' || k === 'p' || k === 'P') { ev.preventDefault(); openPause(); }
  else if (k === 'Escape') { U.placing = null; U.selSlot = null; U.selTower = null; refreshSel(); }
  else if (/^[1-8]$/.test(k)) { var id = G.stage.towers[+k - 1]; if (id) chooseTower(id); }
  else if (k === 'u' || k === 'U') doUpgrade();
  else if (k === 's' || k === 'S' || k === 'Delete') doSell();
  else if (k === 'f' || k === 'F' || k === 'Tab') { ev.preventDefault(); cycleSpeed(); }
  else if (k === 'n' || k === 'N') onWave();
  else if ((k === 'd' || k === 'D') && U.selTower && T[U.selTower.def].light) E.exec(G, { c: 'dim', id: U.selTower.id, on: !U.selTower.off });
  else if (k === 'g' || k === 'G') armFlash();
  else if ((k === 'r' || k === 'R') && U.selTower && U.selTower.def === 'T6') E.exec(G, { c: 'aim', id: U.selTower.id, rel: 1 });
});

/* ================= HUD ================= */
var hudCache = {};
function updateHud(force) {
  if (!G) return; var hp = G.base.hp, o = Math.floor(G.oil), w = G.wave + '/' + G.totalWaves;
  if (force || hudCache.hp !== hp) { $('hpv').textContent = hp + '/' + G.base.hpMax; $('hpfill').style.width = (hp / G.base.hpMax * 100) + '%'; hudCache.hp = hp; }
  if (force || hudCache.oil !== o) { var ov = $('oilv'); ov.textContent = fmt(o); if (hudCache.oil != null && o > hudCache.oil) { ov.classList.remove('bump'); void ov.offsetWidth; ov.classList.add('bump'); } hudCache.oil = o; updatePalette(); }
  if (force || hudCache.w !== w) { $('wavev').textContent = w; hudCache.w = w; }
  var lab, dis = false, wb = $('b-wave');
  if (G.phase === 'PREP') lab = 'はじめる';
  else if (G.phase === 'RUN') {
    if (G.wave >= G.totalWaves) { lab = '最後の波'; dis = true; }
    else if (G.time < G.waveInfo[G.wave].lastAt) { lab = '出現中…'; dis = true; }
    else lab = '次の波 ' + Math.max(0, Math.ceil(G.nextWaveAt - G.time)) + 's +5';
  } else { lab = '—'; dis = true; }
  if (hudCache.lab !== lab) { wb.textContent = lab; hudCache.lab = lab; } wb.classList.toggle('dis', dis);
  if (G.stage.bell) { var bb = $('b-bell'), bdis = G.phase !== 'RUN' || G.bellWave === G.wave || G.oil < B.bellCost; bb.classList.toggle('dis', bdis); bb.textContent = G.bellT > 0 ? '鐘 響' : '鐘 ' + B.bellCost; }
  Array.prototype.forEach.call($('spd').querySelectorAll('button'), function (b) { b.classList.toggle('on', +b.dataset.sp === speed); }); var fb = $('b-flash'); fb.textContent = G.flashCd > 0 ? 'ひと灯り ' + Math.ceil(G.flashCd) : 'ひと灯り'; fb.classList.toggle('cd', G.flashCd > 0); if (U2.combo >= 3 && performance.now() - U2.comboT < 1800) { var cb = $('combo'); cb.textContent = '×' + U2.combo; cb.classList.add('on'); } else $('combo').classList.remove('on'); var nu2 = E.nextUpkeep(G), uk = $('upk'); if (uk) { uk.textContent = nu2 ? '維持費 -' + nu2 : ''; uk.style.color = G.oil < nu2 ? 'var(--red)' : ''; } updatePanel();
  if (!hudCache.sel || hudCache.sel < performance.now()) { hudCache.sel = performance.now() + 200; refreshSel(); }
}
function updatePalette() {
  var ps = $('palette').children; for (var i = 0; i < ps.length; i++) { var id = ps[i].dataset.def; ps[i].classList.toggle('dim', G.oil < T[id].cost); ps[i].classList.toggle('sel', U.placing === id); }
}
var panelSig = '';
var ROUTE_LAB = { 2: { A: '北', B: '西' }, 7: { L: '上', R: '下' } };
function fogMulFor(fw) {
  var st = G.stage, m = 1; if (G.dawn) return 1;
  if (st.fogWaves && st.fogWaves[fw]) m *= st.fogWaves[fw]; if (st.storm && st.storm.indexOf(fw) >= 0) m *= 0.9; if (st.newMoon) m *= 0.85; if (st.deepen) m *= 1 - Math.min(0.22, 0.015 * fw); return m;
}
function updatePreview() { panelSig = ''; updatePanel(); }
function updatePanel() {
  var wp = $('wavepanel'); if (!G) return; var fw = G.wave + 1;
  if (fw > G.totalWaves || G.phase === 'WIN' || G.phase === 'LOSE') { wp.style.display = 'none'; return; } wp.style.display = '';
  var offKey = G.offer ? G.offer.forWave : 0; if (offKey && U.lastOffer !== offKey) { U.lastOffer = offKey; U.panelOpen = true; if (speed > 1) toast('対策札の時間です(速度を1に戻せます)', 'info'); } if (!G.offer && U.panelOpen && U.autoOpened !== G.wave && G.phase === 'RUN' && G.waveInfo[G.wave] && G.time < G.waveInfo[G.wave].lastAt) { U.autoOpened = G.wave; U.panelOpen = false; }
  var nu = E.nextUpkeep(G), sig = [fw, G.offer ? G.offer.ids.join() : '', G.pick ? G.pick.id : '', G.route, nu, G.oil < nu ? 1 : 0, speed > 1 ? 1 : 0, U.panelOpen ? 1 : 0, G.phase, layoutName].join('|');
  if (sig !== panelSig) {
    panelSig = sig; var w = G.stage.waves[fw - 1], parts = w.map(function (g) { return '<span class="chip">' + esc(save.codex.enemies[g.id] ? defE(g.id).name : '???') + '×' + g.n + '</span>'; }).join(' ');
    var badges = ''; if (w.some(function (g) { return g.id === 'E06'; })) badges += '<span class="chip" style="border-color:#b6f4ff">飛行あり</span> '; if (w.some(function (g) { return g.id[0] === 'B'; })) badges += '<span class="chip" style="border-color:#ff9fb0">ボス</span> ';
    var lm = fogMulFor(fw); if (lm < 0.999) badges += '<span class="chip" style="border-color:#ffd27a">光の大きさ×' + lm.toFixed(2) + '</span> '; if (G.stage.tide && fw % 2 === 0 && !G.dawn) badges += '<span class="chip">近道が開く</span> ';
    if (G.stage.storm && G.stage.storm.indexOf(fw) >= 0 && !G.dawn) badges += '<span class="chip">嵐: 敵が速い</span> ';
    var h = '<div class="wphead"><b>' + (fw === G.totalWaves ? '最後の波' : '第' + fw + '波') + ' の予告</b><span class="wpbarw"><i id="wpbar"></i></span>' + (speed > 1 && G.offer ? '<button class="btn sm" data-wp="spd1">x1</button>' : '') + '<button class="btn sm" data-wp="tog">' + (U.panelOpen ? '▲' : '▼') + '</button></div>';
    if (U.panelOpen) {
      h += '<div class="wpbody"><div class="chips">' + parts + '</div><div class="chips" style="margin-top:4px">' + badges + '</div>';
      h += '<div class="wpupk' + (G.oil < nu ? ' bad' : '') + '">この波の維持費 -' + nu + (G.oil < nu ? '(油が足りない: 一部が休灯)' : '') + '</div>';
      if (G.paths.length > 1 && !G.stage.tide) { var lab = ROUTE_LAB[G.stage.id] || {}, ids = G.paths.map(function (p) { return p.id; }); h += '<div class="wproute">潮門 ' + [ids[0], 'mix', ids[1]].map(function (m) { return '<button class="btn sm' + (G.route === m ? ' pri' : '') + '" data-route="' + m + '">' + (m === 'mix' ? '半々' : (lab[m] || m)) + '</button>'; }).join('') + '<span class="st"> 片側に集めると撃破油+10%</span></div>'; }
      if (G.offer) { h += '<div class="wpcards">'; G.offer.ids.forEach(function (id) { var c = D.CARDS[id], on = G.pick && G.pick.id === id && G.pick.forWave === G.offer.forWave; h += '<button class="card' + (on ? ' on' : '') + '" data-card="' + id + '"><b>' + esc(c.name) + '</b><span>' + esc(c.desc) + '</span></button>'; }); h += '</div>'; }
      else h += '<div class="st">波が出現し終わると対策札が出ます</div>';
    }
    wp.innerHTML = h;
  }
  var bar = $('wpbar'); if (bar) { var pct = 0; if (G.phase === 'RUN' && G.waveInfo[G.wave] && G.time >= G.waveInfo[G.wave].lastAt) pct = Math.max(0, (G.nextWaveAt - G.time) / B.waveGap * 100); bar.style.width = pct + '%'; }
}
$('wavepanel').addEventListener('click', function (ev) {
  if (!G) return; var t = ev.target.closest('button'); if (!t) return; A.resume(); A.sfx('click');
  if (t.dataset.wp === 'tog') { U.panelOpen = !U.panelOpen; }
  else if (t.dataset.wp === 'spd1') { speed = 1; S().speed = 1; }
  else if (t.dataset.card) { var r = E.exec(G, { c: 'card', id: t.dataset.card }); if (!r.ok) deny(r.reason); else if (G.pick && G.pick.id === t.dataset.card) tutEvent('card'); }
  else if (t.dataset.route) { E.exec(G, { c: 'route', mode: t.dataset.route }); }
  panelSig = ''; updatePanel();
});
function onWave() {
  if (!G || !running || paused || modalOpen) return; A.resume(); var wasPrep = G.phase === 'PREP'; var r = E.exec(G, { c: 'start' });
  if (!r.ok) { if (r.reason === 'spawning') toast('前の波が出現中', 'warn'); return; } if (wasPrep) tutEvent('start');
}
$('b-wave').onclick = onWave;
$('b-bell').onclick = function () { if (!G || !running || paused) return; var r = E.exec(G, { c: 'bell' }); if (!r.ok) deny(r.reason === 'used' ? 'end' : r.reason); else { toast('鐘を鳴らした。みんなゆっくりになる', 'good'); } };
function cycleSpeed() { speed = speed >= 3 ? 1 : speed + 1; S().speed = speed; saveSoon(); }
function setSpeed(n) { speed = n; S().speed = n; saveSoon(); }
Array.prototype.forEach.call($('spd').querySelectorAll('button'), function (b) { b.onclick = function () { A.resume(); setSpeed(+b.dataset.sp); }; });
function armFlash() { if (!G || !running || paused) return; if (G.flashCd > 0) { toast('ひと灯りは充電中(あと' + Math.ceil(G.flashCd) + '秒)', 'warn'); return; } U2.flashArm = !U2.flashArm; $('b-flash').classList.toggle('on', U2.flashArm); if (U2.flashArm) toast('光らせたい場所をタップ', 'info'); }
$('b-flash').onclick = function () { A.resume(); armFlash(); };
$('b-pause').onclick = function () { openPause(); };
function openPause() {
  if (!G || !running || modalOpen || ended) return; paused = true;
  var resume = function () { paused = false; $('resumebar').classList.remove('on'); };
  function openPause2() {
    modal('<h2>ポーズ</h2>', [{ t: '再 開', cls: 'pri', f: resume }, { t: '盤面を見る(見るだけ)', f: function () { $('resumebar').classList.add('on'); } },
      { t: '設 定', f: function () { openSettings(openPause2); }, keep: true },
      { t: 'やり直す', keep: true, f: function () { confirmBox('この面を最初からやり直しますか?', function () { if (G.runMode) { startStage(RC.stageId, { gopts: Run.gameOpts(RC.run, RC.stageId), run: true }); } else startStage(stageId, { dawn: G.dawnMode }); }, openPause2); } },
      { t: G.runMode ? 'ランをやめる' : '港へ戻る', keep: true, f: function () { confirmBox('戻りますか?(この面の進行は失われます)', function () { running = false; paused = false; RC = null; if (G.runMode) show('title'); else goSelect(); }, openPause2); } }]);
  }
  openPause2();
}
$('resumebar').onclick = function () { paused = false; this.classList.remove('on'); };
document.addEventListener('visibilitychange', function () { if (document.hidden && screen === 'battle' && running && !modalOpen && !ended) openPause(); });
window.addEventListener('pagehide', writeSave);

/* ================= ヒント/チュートリアル ================= */
var hintQ = [], hintCur = null, hintTimer = null;
function pushHint(key, text) { if (save.seenHints[key]) return; save.seenHints[key] = 1; saveSoon(); hintQ.push(text); if (!hintCur) nextHint(); }
function nextHint() {
  var h = $('hint'); if (Tut.on) { hintCur = null; setTimeout(nextHint, 1500); return; }
  if (!hintQ.length) { hintCur = null; h.classList.remove('on'); return; }
  hintCur = hintQ.shift(); var txt = hintCur.replace(/^ポウ「/, '').replace(/」$/, '');
  h.innerHTML = '<div class="who">ポウ</div><div class="msg">' + esc(txt) + '</div><div class="acts"><button class="btn sm" id="hint-ok">わかった</button></div>'; h.classList.add('on');
  clearTimeout(hintTimer); hintTimer = setTimeout(nextHint, 14000); $('hint-ok').onclick = function () { clearTimeout(hintTimer); nextHint(); };
}
function queueStageHints(id) {
  var m = { 2: ['s2', 'flash', 'route'], 3: ['s3', 'upkeep', 'card'], 4: ['s4', 'syn'], 5: ['s5', 'mirror'], 6: ['bell'], 7: ['s7'], 9: ['s9', 'storm'], 10: ['tide'], 11: ['moon'], 12: ['s12'] }[id] || [];
  m.forEach(function (k) { pushHint(k, ST.hints[k]); });
}
var Tut = { on: false, step: 0, t: 0 };
function tutStart() { Tut.on = true; Tut.step = 0; tutShow(); }
function tutShow() {
  var s = ST.tutorial[Tut.step], t = $('tut'); document.querySelectorAll('.hl').forEach(function (e) { e.classList.remove('hl'); }); U.hiSlot = null;
  var btn = s[1] === 'next' ? '<button class="btn sm pri" id="tut-next">つぎへ</button>' : '';
  t.innerHTML = '<div class="who">ポウ <button class="tutx" id="tut-skip" aria-label="説明を閉じる">×</button></div><div class="msg">' + esc(s[0]) + '</div>' + (btn ? '<div class="acts">' + btn + '</div>' : ''); t.classList.add('on');
  $('tut-skip').onclick = tutEnd; var n = $('tut-next'); if (n) n.onclick = function () { tutNext(); };
  var c = s[1];
  if (c === 'slot' || c === 'buildT1') U.hiSlot = bestTutSlot(0);
  if (c === 'buildT1') { var p = document.querySelector('.pal[data-def="T1"]'); if (p) p.classList.add('hl'); if (G.banned.indexOf('T1') < 0) U.placing = 'T1'; refreshSel(); }
  if (c === 'lit') setTimeout(function () { if (Tut.on && ST.tutorial[Tut.step][1] === 'lit') tutNext(); }, 7000);
  if (c === 'buildT2') { U.hiSlot = bestTutSlot(1); var q = document.querySelector('.pal[data-def="T2"]'); if (q) q.classList.add('hl'); }
  if (c === 'start') $('b-wave').classList.add('hl');
  Tut.t = performance.now();
}
function bestTutSlot(second) {
  var free = G.slots.filter(function (s) { return !s.tower; }); if (!free.length) return null;
  if (!second) return free[0].id; var tw = G.towers[0]; if (!tw) return free[0].id;
  free.sort(function (a, b) { return Math.hypot(a.x - tw.x, a.y - tw.y) - Math.hypot(b.x - tw.x, b.y - tw.y); }); return free[0].id;
}
function tutNext() { Tut.step++; if (Tut.step >= ST.tutorial.length) { tutEnd(); return; } tutShow(); }
function tutEvent(name) { if (!Tut.on) return; if (ST.tutorial[Tut.step][1] === name) tutNext(); }
function tutEnd() { Tut.on = false; $('tut').classList.remove('on'); document.querySelectorAll('.hl').forEach(function (e) { e.classList.remove('hl'); }); if (U) U.hiSlot = null; save.tutorialDone = true; saveSoon(); }

/* ================= イベント処理 ================= */
var HINT_ENEMY = { E05: 1, E06: 1, E07: 1, E08: 1, E09: 1, E11: 1, B1: 1 };
function handleEvents(evs) {
  for (var i = 0; i < evs.length; i++) {
    var e = evs[i];
    switch (e.t) {
      case 'spawn':
        var rec = save.codex.enemies[e.def]; if (!rec) { rec = save.codex.enemies[e.def] = { seen: 0, killed: 0 }; toast('図鑑に記録: ' + defE(e.def).name, 'good'); saveSoon(); } rec.seen++;
        if (HINT_ENEMY[e.def]) pushHint(e.def, ST.hints[e.def]);
        if (e.def[0] === 'B') { banner(defE(e.def).name, defE(e.def).intro); toast(defE(e.def).intro, 'warn'); }
        break;
      case 'kill': if (e.boss && S().fx > 0) { U2.hitstop = 0.15; U2.slowEv = 0.9; } var r2 = save.codex.enemies[e.def]; if (r2) r2.killed++; { var nowk = performance.now(); U2.combo = (nowk - U2.comboT < 2000) ? U2.combo + 1 : 1; U2.comboT = nowk; } break;
      case 'bossComing': { var bn = defE(e.def).name; banner('ボスが近づく…', bn); toast('3', 'warn'); setTimeout(function () { toast('2', 'warn'); }, 1000); setTimeout(function () { toast('1', 'warn'); }, 2000); break; }
      case 'bossWarn': toast(e.kind === 'roar' ? '咆哮の予兆! 近くの灯りが消える' : e.kind === 'dash' ? '突進の予兆!' : '手下を呼ぶ予兆!', 'warn'); break;
      case 'roar': vib(120); break;
      case 'surgeWarn': banner('濃霧警報!', '灯りの視界がせまくなる。ひと灯りで備えよう'); A.sfx('alarm'); break;
      case 'surgeOn': toast('濃霧: 光半径が一時的に小さい', 'warn'); break;
      case 'ambushWarn': toast('側面から迷子が来る!', 'warn'); break;
      case 'gust': toast('突風: 灯りが揺れる', 'info'); break;
      case 'picked': if (e.kind === 'chest') toast('漂流宝箱: 20秒、全塔の攻撃+15%', 'good'); break;
      case 'combo': toast('連鎖×' + e.n + '! 油+' + e.bonus, 'good'); break;
      case 'adapt': toast('敵が ' + (T[e.def] ? T[e.def].name : '') + ' に慣れてきた(ダメージ-15%)', 'warn'); break;
      case 'build': if (!save.codex.towers[e.def]) { save.codex.towers[e.def] = 1; toast('図鑑に記録: ' + T[e.def].name, 'good'); saveSoon(); } break;
      case 'wave':
        A.setLast(e.last); banner(e.last ? '最後の波' : '第' + e.n + '波', e.last ? ST.lastWave : ST.waveLines[(e.n * 7 + stageId) % ST.waveLines.length]); updatePreview();
        if (G.stage.storm && G.stage.storm.indexOf(e.n) >= 0 && !G.dawn) toast('嵐の波: 敵が速く、光が小さい。油も多く落とす', 'warn');
        if (G.stage.tide && e.n % 2 === 0 && !G.dawn) toast('干潮: 近道が開いた', 'warn');
        if (G.stage.fogWaves && G.stage.fogWaves[e.n] && !G.dawn) toast('濃霧: 光半径が小さくなる', 'warn');
        break;
      case 'upkeep': if (e.dimmed) toast('油が足りず ' + e.dimmed + '基が休灯', 'warn'); break;
      case 'waveClear': toast('波を退けた  油 +' + e.bonus, 'good'); break;
      case 'leak': vib(80); if (S().fx > 0) U2.hitstop = Math.max(U2.hitstop, 0.08); break;
      case 'reveal': tutEvent('lit'); break;
      case 'bossPhase':
        if (e.def === 'B4' && e.form === 'kids') banner('ナミダがほどけた', '霧の子たちを全員送り返そう');
        else if (e.def === 'B4') banner('ナミダが戻ってきた', BO.B4.intro2);
        else if (e.def === 'B2') toast('船長の足取りが重くなった', 'info');
        break;
      case 'oil': break;
      case 'win': case 'lose': onEnd(); break;
    }
  }
}

/* ================= 結果 ================= */
function onEnd() { if (ended) return; ended = true; U.placing = null; U.selSlot = null; U.selTower = null; U2.flashArm = false; clearTimeout(resultTimer); resultTimer = setTimeout(showResult, G.phase === 'WIN' ? 6000 : 1800); if (G.phase === 'WIN') toast('画面をタップすると結果へ', 'info'); }
function checkAch() {
  var got = [], st = save.stages, a = save.ach, g = G.stats, n;
  function ok(id, c) { if (c && !a[id]) { a[id] = 1; got.push(id); } }
  var cleared = 0, perfect = 0; for (var k in st) { if (st[k].cleared) cleared++; if (st[k].bestHp >= 20) perfect++; }
  ok('A01', !!(st[1] && st[1].cleared)); ok('A02', g.killsLit > 0); ok('A03', save.stats.oilTotal >= 1000); ok('A04', cleared >= 12); ok('A05', totalStars() >= 36);
  ok('A06', !!(st[4] && st[4].cleared)); ok('A07', !!(st[8] && st[8].cleared)); ok('A08', !!(st[10] && st[10].cleared)); ok('A09', !!(st[12] && st[12].cleared));
  ok('A10', perfect > 0); ok('A11', perfect >= 12); ok('A13', g.pumpLv3 >= 3); ok('A14', g.lightSumMax > 20); ok('A15', save.stats.freezes >= 100); ok('A16', g.maxChain >= 5);
  ok('A17', g.maxBeam >= 10); ok('A18', save.stats.earlyCalls >= 50);
  var cx = Object.keys(save.codex.towers).length + Object.keys(save.codex.enemies).length; ok('A19', cx >= 25);
  var hh = 0; for (var h in save.heard) hh++; ok('A20', hh >= 12);
  return got;
}
function showResult() {
  if (!G || resultFor === G) return; resultFor = G; clearTimeout(resultTimer); if (G.runMode) { showRunNight(); return; } var win = G.phase === 'WIN', hp = G.base.hp, stars = win ? E.stars(hp) : 0, st = G.stage, gs = G.stats, prevStars = totalStars(), cheat = !!G.cheat;
  var newAch = [], newLetters = [];
  if (!cheat) {
    save.stats.oilTotal += gs.oilEarned; save.stats.freezes += gs.freezes; save.stats.earlyCalls += gs.earlyCalls;
    if (win) {
      var rec = save.stages[st.id] || (save.stages[st.id] = { cleared: false, stars: 0, bestHp: 0, bestTime: 0 }); rec.cleared = true;
      if (!G.dawnMode) { rec.stars = Math.max(rec.stars || 0, stars); rec.bestHp = Math.max(rec.bestHp || 0, hp); }
      if (!rec.bestTime || G.time < rec.bestTime) rec.bestTime = Math.round(G.time);
    }
    newAch = checkAch();
    var ts = totalStars(); [6, 12, 24, 36].forEach(function (t) { if (prevStars < t && ts >= t && !save.letters[t]) { save.letters[t] = 1; newLetters.push(t); } });
    writeSave();
  }
  A.setMode('menu');
  var hidden = []; if (win) { if (hp >= 20) hidden.push('無傷'); if (G.oil >= st.oil) hidden.push('倹約家'); if (st.id >= 4 && !(gs.built.T7)) hidden.push('ひとり占め'); }
  var starsH = '<div class="res-stars">' + [1, 2, 3].map(function (i) { return i <= stars ? '★' : '<span class="off">★</span>'; }).join('') + '</div>';
  var body = '<h2>' + (win ? '送り返した' : '灯が消えた…') + '</h2><div style="text-align:center;color:var(--sub)">第' + st.id + '面「' + esc(st.name) + '」' + (G.dawnMode ? '(夜明けモード)' : '') + '</div>' + (win ? starsH : '') +
    '<div class="kv"><span>灯台HP<b>' + hp + '/20</b></span><span>送り返した数<b>' + gs.kills + '</b></span><span>使った油<b>' + fmt(gs.oilSpent) + '</b></span></div>';
  if (hidden.length) body += '<div style="text-align:center;color:var(--jade);font-size:.9em">' + hidden.map(function (h) { return '【' + h + '】'; }).join(' ') + '</div>';
  var qline = win ? ST.clearLines[Math.floor(Math.random() * ST.clearLines.length)] : ST.loseLines[Math.floor(Math.random() * ST.loseLines.length)];
  body += '<div class="dlg" style="margin-top:8px"><div class="who">' + (win ? 'ポウ' : 'ポウ') + '</div>' + esc(qline) + '</div>';
  if (win) { st.outro.forEach(function (l) { body += '<div class="dlg" style="min-height:0;padding:8px 12px"><div class="who">' + esc(l[0]) + '</div>' + esc(l[1]) + '</div>'; }); if (totalStars() >= 6 || true) body += '<div style="color:var(--sub);font-size:.88em;margin:6px 0">灯台日誌: ' + esc(st.diary) + '</div>'; }
  else body += '<div style="color:var(--sub);font-size:.88em;margin:6px 0">ヒント: ' + loseHint() + '</div>';
  newLetters.forEach(function (t) { body += '<div class="dlg" style="border:1px solid var(--acc)"><div class="who">ミオの手紙(星' + t + ')</div>' + esc(ST.letters[t]) + '</div>'; });
  if (newAch.length) body += '<div style="color:var(--acc);font-size:.9em;margin:6px 0">実績解除: ' + newAch.map(function (id) { return esc(ST.achievements.filter(function (x) { return x[0] === id; })[0][1]); }).join(' / ') + '</div>';
  if (cheat) body += '<div style="color:var(--red);font-size:.85em">デバッグ使用のため記録されません</div>';
  var btns = [];
  var next = win && st.id < 12;
  if (next) btns.push({ t: '次の面へ', cls: 'pri', f: function () { selStage = st.id + 1; goSelect(); setTimeout(function () { var go = $('go'); if (go) go.click(); }, 50); } });
  btns.push({ t: 'もう一度', cls: next ? '' : 'pri', f: function () { startStage(st.id, { dawn: G.dawnMode }); } });
  btns.push({ t: '海図へ', f: function () { running = false; selStage = Math.min(12, win ? st.id : st.id); goSelect(); } });
  if (win) { var stxt = '霧の灯台 第' + st.id + '面「' + st.name + '」 ' + '★'.repeat(stars) + '☆'.repeat(3 - stars) + ' 灯台HP ' + hp + '/20 帰った迷子 ' + gs.kills + ' #霧の灯台'; btns.push({ t: '結果をコピー', keep: true, f: function () { copyText(stxt); } }); btns.push({ t: '夜明けカードを保存', keep: true, f: function () { saveCard({ title: '第' + st.id + '面「' + st.name + '」', sub: '★'.repeat(stars) + '☆'.repeat(3 - stars), lines: ['灯台HP ' + hp + '/20', '帰った迷子 ' + gs.kills], pal: st.pal }); } }); }
  modal(body, btns);
  if (win && st.id === 12 && !save.ach._ending) { save.ach._ending = 1; writeSave(); }
}
function loseHint() {
  var lb = G.stats.leakBy || {}; var tips = ['光の外にいる敵は撃てない。ライトの置き場所を見直してみよう。', '銛台や霧笛砲は、ライトの光の中で真価を発揮する。'];
  if (lb.E06) tips.unshift('影鴉は道を通らず灯台へまっすぐ飛ぶ。飛行ルート付近に灯りを置こう。');
  if (lb.E03 > 3) tips.unshift('霧の子は速い。氷灯で足止めし、光を重ねよう。');
  if (stageId >= 4 && !G.stats.built.T7) tips.push('油汲みを早めに置くと、あとで得をする。');
  return tips[Math.floor(Math.random() * tips.length)];
}

/* ================= 共有・夜明けカード ================= */
function copyText(txt) {
  function fb() { var ta = document.createElement('textarea'); ta.value = txt; ta.style.cssText = 'position:fixed;left:-999px;top:0'; document.body.appendChild(ta); ta.select(); var ok = false; try { ok = document.execCommand('copy'); } catch (e) { } document.body.removeChild(ta); toast(ok ? 'コピーしました' : 'コピーできませんでした: ' + txt.split('\n')[0], ok ? 'good' : 'warn'); }
  try { if (navigator.clipboard && navigator.clipboard.writeText) { navigator.clipboard.writeText(txt).then(function () { toast('コピーしました', 'good'); }, fb); return; } } catch (e) { }
  fb();
}
function saveCard(info) {
  var cv = document.createElement('canvas'); cv.width = 720; cv.height = 405; var c = cv.getContext('2d');
  R.drawBackdrop(c, 720, 405, 2.0, 'dawn'); c.fillStyle = 'rgba(43,47,102,0.55)'; c.fillRect(0, 232, 720, 173);
  c.textAlign = 'center'; c.fillStyle = '#fbf8ff'; c.font = 'bold 30px "Hiragino Mincho ProN","Yu Mincho",serif'; c.fillText('霧の灯台  ' + info.title, 360, 272);
  c.fillStyle = '#ffc77a'; c.font = 'bold 34px sans-serif'; c.fillText(info.sub || '', 360, 316);
  c.fillStyle = '#fbf8ff'; c.font = '20px sans-serif'; (info.lines || []).forEach(function (l, i) { c.fillText(l, 360, 350 + i * 26); });
  c.fillStyle = 'rgba(255,255,255,0.8)'; c.font = '14px sans-serif'; c.textAlign = 'right'; c.fillText('#霧の灯台', 708, 396);
  try { cv.toBlob(function (b) { if (!b) { toast('画像を作れませんでした', 'warn'); return; } var a = document.createElement('a'); a.href = URL.createObjectURL(b); a.download = 'kiri-no-todai.png'; document.body.appendChild(a); a.click(); document.body.removeChild(a); setTimeout(function () { URL.revokeObjectURL(a.href); }, 2000); toast('画像を保存しました', 'good'); }, 'image/png'); } catch (e) { toast('画像を保存できませんでした', 'warn'); }
}

/* ================= ひと夜ラン / 日替わりの夜 ================= */
function startRun(daily) {
  var seed, rule = null, label, ms = Date.now();
  if (daily) { seed = Run.dailySeed(ms); rule = Run.dailyRule(seed); var j = Run.jstDate(ms); label = '日替わり ' + j.m + '/' + j.d + '「' + rule.name + '」'; }
  else { seed = (ms & 0x7fffffff) || 1; label = 'ひと夜ラン'; }
  RC = { run: Run.create(seed, { rule: rule, daily: daily, returned: save.run.returned }), label: label, daily: daily, stageId: 0 };
  A.resume(); A.bgmStart('menu'); nightChoose();
}
function relicChips(run) { return run.relics.length ? run.relics.map(function (id) { var r = Run.relic(id); return '<span class="chip" title="' + esc(r.desc) + '">' + esc(r.name) + '</span>'; }).join(' ') : '<span class="st">なし</span>'; }
function nightChoose() {
  var run = RC.run, ch = Run.choices(run);
  var h = '<h2>第' + (run.night + 1) + '夜 / ' + Run.NIGHTS + '</h2><div style="text-align:center;color:var(--sub)">' + esc(RC.label) + '</div>' +
    '<div class="kv"><span>灯台HP<b>' + run.hp + '/20</b></span><span>帰った迷子<b>' + run.kills + '</b></span></div>' +
    '<div style="margin:6px 0"><b>祈り</b> ' + relicChips(run) + '</div>' + (run.rule ? '<div style="margin:6px 0;color:var(--acc)">今日の掟: ' + esc(run.rule.desc) + '</div>' : '') +
    (run.banned.length ? '<div style="margin:6px 0;color:var(--sub)">使えない灯り: ' + run.banned.map(function (id) { return esc(T[id].name); }).join('・') + '</div>' : '') + '<div style="margin:8px 0">どの夜を渡る?</div>';
  var btns = ch.map(function (sid) { var st = D.STAGES[sid - 1]; return { t: '第' + sid + '面「' + st.name + '」' + (st.boss ? ' (ボス)' : '') + ' ' + Run.waveIdx(st.waves.length).length + '波', cls: 'pri', f: function () { RC.stageId = sid; startStage(sid, { gopts: Run.gameOpts(run, sid), run: true }); } }; });
  btns.push({ t: 'ランをやめる', f: function () { RC = null; show('title'); } });
  modal(h, btns);
}
function showRunNight() {
  var run = RC.run, sid = RC.stageId, g = G, cheat = !!g.cheat, res = Run.finishNight(run, sid, g);
  if (!cheat) { save.run.returned += g.stats.kills; save.stats.oilTotal += g.stats.oilEarned; save.stats.freezes += g.stats.freezes; writeSave(); }
  A.setMode('menu'); R.setFogTarget(0.72);
  if (!run.over) {
    var of = Run.offer(run);
    var h = '<h2>第' + run.night + '夜を越えた</h2><div class="kv"><span>灯台HP<b>' + run.hp + '/20</b></span><span>この夜に帰った迷子<b>' + res.kills + '</b></span></div><div style="margin:6px 0"><b>祈り</b> ' + relicChips(run) + '</div><div style="margin:8px 0">祈りをひとつ選ぼう(最大' + 4 + 'つ)</div>';
    var btns = of.map(function (id) { var r = Run.relic(id); return { t: r.name + ' — ' + r.desc, cls: 'pri', f: function () { Run.pick(run, id); nightChoose(); } }; });
    btns.push({ t: '見送る(次の夜の油+20)', f: function () { Run.pick(run, 'skip'); nightChoose(); } });
    modal(h, btns); return;
  }
  var win = run.win, score = Run.score(run), dateKey = String(run.seed), streakLine = '';
  save.run.runs++; if (win) save.run.wins++; if (score > save.run.best) save.run.best = score;
  if (RC.daily && !cheat) { var today = Run.dailySeed(Date.now()), y = Run.dailySeed(Date.now() - 86400000); if (save.daily.last !== String(today)) { save.daily.streak = (save.daily.last === String(y)) ? save.daily.streak + 1 : 1; save.daily.last = String(today); } var bd = save.daily.best[today]; if (!bd || score > bd.score) save.daily.best[today] = { score: score, win: win }; streakLine = '<div style="color:var(--sub);margin:4px 0">連続 ' + save.daily.streak + '日(途切れても大丈夫)</div>'; }
  if (!cheat) writeSave();
  var label = RC.label, txt = Run.shareText(run, label);
  var h2 = '<h2>' + (win ? '夜が明けた' : '霧に迷った…') + '</h2><div style="text-align:center;color:var(--sub)">' + esc(label) + '</div><div class="res-stars" style="font-size:2em">' + esc(Run.emoji(run)) + '</div>' +
    '<div class="kv"><span>灯台HP<b>' + run.hp + '/20</b></span><span>帰った迷子<b>' + run.kills + '</b></span><span>スコア<b>' + fmt(score) + '</b></span></div><div style="margin:6px 0"><b>祈り</b> ' + relicChips(run) + '</div>' + streakLine +
    '<div class="dlg"><div class="who">ポウ</div>' + esc(win ? 'みんな、おうちに帰れたね。朝が来るよ!' : 'みんな、まだ待ってるよ。もう一度、灯りを灯そう。') + '</div>' + (!cheat ? '' : '<div style="color:var(--red);font-size:.85em">デバッグ使用のため記録されません</div>') +
    '<div style="color:var(--sub);font-size:.82em;margin:4px 0">累計で帰った迷子 ' + save.run.returned + '(100ごとに開始油+1%、最大+5%。60で新しい祈りが増えます)</div>';
  modal(h2, [{ t: '結果をコピー', cls: 'pri', keep: true, f: function () { copyText(txt); } }, { t: '夜明けカードを保存', keep: true, f: function () { saveCard({ title: label, sub: Run.emoji(run), lines: ['灯台HP ' + run.hp + '/20  帰った迷子 ' + run.kills, win ? '夜が明けた' : (run.nights.length) + '夜目で霧に迷った'], pal: 'dawn' }); } },
    { t: RC.daily ? '同じ夜をもう一度' : 'もう一度', f: function () { startRun(RC.daily); } }, { t: 'タイトルへ', f: function () { RC = null; show('title'); } }]);
}
$('t-run').onclick = function () { startRun(false); };
$('t-daily').onclick = function () { startRun(true); };

/* ================= 図鑑 ================= */
var codexBack = 'title', cxTab = 'tower', cxSel = 0;
var TABS = [['tower', '灯り'], ['enemy', '怪異'], ['term', '用語'], ['diary', '日誌'], ['gallery', 'ギャラリー'], ['ach', '実績']];
$('c-back').onclick = function () { if (codexBack === 'select') goSelect(); else show('title'); };
function codexCount() { return Object.keys(save.codex.towers).length + Object.keys(save.codex.enemies).length; }
function renderCodex() {
  $('c-prog').textContent = '記録 ' + codexCount() + '/25';
  var tabs = $('cx-tabs'); tabs.innerHTML = '';
  TABS.forEach(function (t) { var b = document.createElement('button'); b.className = 'btn' + (t[0] === cxTab ? ' on' : ''); b.textContent = t[1]; b.onclick = function () { cxTab = t[0]; cxSel = 0; renderCodex(); }; tabs.appendChild(b); });
  var grid = $('cx-grid'), det = $('cx-detail'); grid.innerHTML = ''; det.innerHTML = '';
  var items = [], ts = totalStars();
  if (cxTab === 'tower') items = D.TOWER_ORDER.map(function (id) { return { id: id, name: T[id].name, known: !!save.codex.towers[id], draw: function (c) { R.drawTowerIcon(c, id, 48, 50, 76, 0); } }; });
  else if (cxTab === 'enemy') items = Object.keys(EN).concat(Object.keys(BO)).map(function (id) { return { id: id, name: defE(id).name, known: !!save.codex.enemies[id], draw: function (c) { R.drawEnemyIcon(c, id, 48, 50, 76, 1); } }; });
  else if (cxTab === 'term') items = ST.terms.map(function (t, i) { return { id: i, name: t[0], known: true, list: true }; });
  else if (cxTab === 'diary') items = ST.diary.map(function (t, i) { return { id: i, name: '第' + (i + 1) + '面', known: ts >= 6 && !!(save.stages[i + 1] && save.stages[i + 1].cleared), list: true }; });
  else if (cxTab === 'gallery') items = ST.gallery.map(function (t, i) { return { id: i, name: t[0], known: ts >= 12, list: true }; });
  else if (cxTab === 'ach') {
    det.parentNode.removeChild(det); grid.style.display = 'block';
    var h = ''; ST.achievements.forEach(function (a) { var done = save.ach[a[0]]; h += '<div class="ach' + (done ? ' done' : '') + '"><div class="mk">' + (done ? '★' : '') + '</div><div class="t"><b style="color:var(--text)">' + esc(a[1]) + '</b><br>' + esc(a[2]) + '</div></div>'; });
    h += '<div class="ach"><div class="t">星36で解放予定の「ポウの隠れ家」(試し打ちモード)は未実装です。</div></div>';
    grid.innerHTML = h; var body = $('cx-body'); if (!$('cx-detail')) { var d2 = document.createElement('div'); d2.id = 'cx-detail'; d2.style.display = 'none'; body.appendChild(d2); } return;
  }
  grid.style.display = ''; if (cxSel >= items.length) cxSel = 0;
  items.forEach(function (it, k) {
    var cell = document.createElement('button'); cell.className = 'cell' + (it.list ? ' list' : '') + (k === cxSel ? ' sel' : '') + (it.known ? '' : ' unk');
    if (it.list) cell.innerHTML = '<div class="nm" style="color:var(--text);font-size:.9em">' + (it.known ? esc(it.name) : '???') + '</div>';
    else { var c = document.createElement('canvas'); c.width = 96; c.height = 96; cell.appendChild(c); if (it.known) it.draw(c.getContext('2d')); else { var q = document.createElement('div'); q.className = 'q'; q.textContent = '?'; cell.insertBefore(q, c); c.style.display = 'none'; } var nm = document.createElement('div'); nm.className = 'nm'; nm.textContent = it.known ? it.name : '???'; cell.appendChild(nm); }
    cell.onclick = function () { A.sfx('click'); cxSel = k; renderCodex(); }; grid.appendChild(cell);
  });
  var it = items[cxSel]; if (!it) return; var h2 = '';
  if (!it.known) h2 = '<h3>???</h3><div style="color:var(--sub)">' + (cxTab === 'diary' ? (ts < 6 ? '星の合計が6になると読めるようになる。' : 'この面をクリアすると読める。') : cxTab === 'gallery' ? '星の合計が12になると見られる。' : cxTab === 'tower' ? 'はじめて設置すると記録される。' : 'はじめて出会うと記録される。') + '</div>';
  else if (cxTab === 'tower') {
    var d = T[it.id], rows = [['攻撃', function (L) { return L.atk != null ? L.atk : '-'; }], ['射程', function (L) { return L.range || '-'; }], ['間隔', function (L) { return L.iv ? L.iv.toFixed(2) : '-'; }], ['光半径', function (L) { return L.light || '-'; }]];
    if (it.id === 'T3') rows.push(['爆風', function (L) { return L.blast; }]); if (it.id === 'T4') rows.push(['減速', function (L) { return Math.round(L.slow * 100) + '%'; }]);
    if (it.id === 'T5') rows.push(['連鎖', function (L) { return L.chain; }]); if (it.id === 'T6') rows = [['影響半径', function (L) { return L.infl; }], ['光半径加算', function (L) { return '+' + L.add; }]];
    if (it.id === 'T7') rows = [['1波あたり油', function (L) { return L.income; }]]; if (it.id === 'T8') rows = [['攻撃(0.25s)', function (L) { return L.atk; }], ['光線の長さ', function (L) { return L.beamLen; }], ['光半径', function (L) { return L.light; }]];
    if (d.lv[0].upkeep) rows.push(['維持費/波', function (L) { return L.upkeep; }]); rows.push(['累計投資', function (L) { return L.total; }]);
    h2 = '<h3>' + esc(d.name) + '</h3><div style="color:var(--acc)">' + esc(d.role) + ' / 設置 ' + d.cost + ' / 第' + d.unlock + '面で解放</div><div>' + esc(d.desc) + '</div><div style="color:var(--jade);margin-top:6px">' + esc(d.special) + '</div><table class="tb"><tr><th></th><th>Lv1</th><th>Lv2</th><th>Lv3</th><th>Lv4</th></tr>' +
      rows.map(function (r) { return '<tr><td>' + r[0] + '</td>' + d.lv.map(function (L) { return '<td>' + r[1](L) + '</td>'; }).join('') + '</tr>'; }).join('') + '</table>' + codexTowerExtra(it.id);
  } else if (cxTab === 'enemy') {
    var e = defE(it.id), rec = save.codex.enemies[it.id] || { seen: 0, killed: 0 };
    h2 = '<h3>' + esc(e.name) + (e.boss ? ' <span style="font-size:.6em;color:var(--red)">ボス</span>' : '') + '</h3><div>' + esc(e.desc) + '</div><div style="color:var(--jade);margin-top:6px">' + esc(e.trait || '') + '</div>' +
      '<table class="tb"><tr><th>HP(基本)</th><th>速度</th><th>光耐性</th><th>油</th><th>漏れ</th></tr><tr><td>' + e.hp + '</td><td>' + e.speed + '</td><td>' + Math.round(e.res * 100) + '%</td><td>' + e.oil + '</td><td>' + e.leak + '</td></tr></table>' +
      '<div style="margin-top:8px;color:var(--sub)">出会った回数 ' + rec.seen + ' / 送り返した数 ' + rec.killed + (e.flying ? ' / 飛行' : '') + (e.armor ? ' / 固定軽減 ' + e.armor : '') + '</div>' + (e.outro ? '<div style="margin-top:8px;color:var(--sub)">' + esc(e.intro) + '<br>' + esc(e.outro) + '</div>' : '');
  } else if (cxTab === 'term') h2 = '<h3>' + esc(ST.terms[it.id][0]) + '</h3><div>' + esc(ST.terms[it.id][1]) + '</div>';
  else if (cxTab === 'diary') h2 = '<h3>灯台日誌 第' + (it.id + 1) + '面</h3><div>' + esc(ST.diary[it.id]) + '</div>';
  else if (cxTab === 'gallery') h2 = '<h3>' + esc(ST.gallery[it.id][0]) + '</h3><div>' + esc(ST.gallery[it.id][1]) + '</div>';
  det.innerHTML = h2;
}

function codexTowerExtra(id) {
  var d = T[id], h = '', sy = D.SYN.filter(function (x) { return x.from === id || x.recv === id || (x.recv === '*light' && d.light); });
  if (sy.length) h += '<div style="margin-top:8px"><b>相性(2.3マス以内)</b><br>' + sy.map(function (x) { return esc(x.name) + ': ' + esc((x.recv === '*light' ? '光る塔' : T[x.recv].name) + ' ← ' + T[x.from].name + '。' + x.desc); }).join('<br>') + '</div>';
  if (d.lv3b) h += '<div style="margin-top:8px"><b>Lv3の分岐</b><br>A ' + esc(d.branch[0]) + ': ' + esc(d.branch[2]) + '<br>B ' + esc(d.branch[1]) + ': ' + esc(d.branch[3]) + '</div>';
  if (id === 'T6') h += '<div style="margin-top:8px">向きを8方向から選び、扇の中のライトにだけ効く。鏡どうしをつなぐと扇が伸びる。</div>';
  if (d.light) h += '<div style="margin-top:8px;color:var(--sub)">光るタワーは波が始まるたびに維持費がかかる(第3面から)。休灯で節約できる。</div>';
  return h;
}
/* ================= メインループ ================= */
function dangerLevel() {
  if (!G || G.phase !== 'RUN') return { v: 0, near: false, lastOne: false };
  var near = false, alive = 0, lastRemain = 99; for (var i = 0; i < G.enemies.length; i++) { var e = G.enemies[i]; if (!e.alive) continue; alive++; var lim = e.boss ? 6 : 2.5; if (e.remain < lim) near = true; lastRemain = e.remain; }
  var lastOne = G.wave >= G.totalWaves && alive === 1 && G.spawnQ.length === 0 && lastRemain < 4.5;
  var low = G.base.hp <= 6, v = low ? (near ? 1 : 0.55) : (near ? 0.3 : 0); if (G.base.hp <= 3) v = Math.max(v, near ? 1 : 0.7);
  return { v: v, near: near, lastOne: lastOne, low: low };
}
var last = performance.now(), tick = 0, fpsAcc = 0, fpsN = 0;
function frame(now) {
  var real = Math.min((now - last) / 1000, 0.1); last = now; tick++;
  fpsAcc += real; fpsN++; if (fpsAcc >= 2) { if (fpsN / fpsAcc < 45 && R.state.q > 0 && screen === 'battle') { R.state.q = 0; R.state.fxCap = 60; } fpsAcc = 0; fpsN = 0; }
  try {
    if (screen === 'battle' && G) {
      var dg = dangerLevel(), fxl = S().fx;
      if (running && !paused && !modalOpen) {
        var tgtSlow = 1; if (fxl > 0) { if (dg.near && dg.low) tgtSlow = 0.6; if (dg.lastOne) tgtSlow = 0.5; if (U2.slowEv > 0) { U2.slowEv -= real; tgtSlow = Math.min(tgtSlow, 0.35); } }
        U2.slowCur += (tgtSlow - U2.slowCur) * Math.min(1, real * 6);
        if (U2.hitstop > 0) { U2.hitstop -= real; } else acc += real * speed * U2.slowCur; var n = 0;
        if (dg.v >= 0.5) { U2.heartT -= real; if (U2.heartT <= 0) { A.sfx('heart'); U2.heartT = 1.3 - 0.6 * dg.v; } }
        while (acc >= DT && n < 12) { E.step(G, DT); acc -= DT; n++; if (G.phase === 'WIN' || G.phase === 'LOSE') { acc = 0; break; } }
        if (n === 12) acc = 0;
      }
      // ゴースト
      var sid = U.selSlot != null ? U.selSlot : U.hoverSlot; U.ghost = null;
      if (U.placing && sid != null && G.slots[sid] && !G.slots[sid].tower) {
        var d = T[U.placing], sl = G.slots[sid], ok = G.oil >= d.cost && !(U.placing === 'T7' && sl.noPump);
        U.ghost = { slot: sid, def: U.placing, ok: ok, R: E.lightPreview(G, U.placing, sl, 0) };
      }
      U.synLines = null; if (U.selTower && G.towers.indexOf(U.selTower) >= 0) { var stw = U.selTower; U.synLines = E.synList(G, stw).map(function (l) { return { x1: stw.x, y1: stw.y, x2: l.x, y2: l.y, name: l.name, dir: l.dir }; }); }
      else if (U.ghost) { var gsl2 = G.slots[U.ghost.slot], spv2 = E.synPreview(G, U.ghost.def, gsl2); U.synLines = []; spv2.recv.concat(spv2.give).forEach(function (x, k) { var o = G.towers.filter(function (tt) { return tt.id === x.id; })[0]; if (o) U.synLines.push({ x1: gsl2.x, y1: gsl2.y, x2: o.x, y2: o.y, name: x.name, dir: k < spv2.recv.length ? 'recv' : 'give' }); }); }
      var ps = performance.now(); R.draw(G, U, real, { reduced: S().reduce, cb: S().cb, danger: dg.v });
      R.onEvents(G.events); A.flush(G.events); handleEvents(G.events); G.events.length = 0;
      if (G.stage.bell) R.state.bellX = G.base.x * TS, R.state.bellY = G.base.y * TS;
      updateHud(); if (!G.cheat && /debug=1/.test(location.search)) { }

    } else if (screen === 'title') {
      if (tick % 2 === 0) { var c = $('titleCv'), ctx = c.getContext('2d'); R.drawBackdrop(ctx, c.width, c.height, now / 1000, 'std'); }
    } else if (screen === 'select') {
      if (tick % 3 === 0) { var c2 = $('selCv'), x2 = c2.getContext('2d'); R.drawBackdrop(x2, c2.width, c2.height, now / 1000, D.STAGES[selStage - 1].pal); }
    }
  } catch (err) { if (!frame.warned) { frame.warned = true; console.error(err); try { toast('エラー: ' + err.message, 'warn'); } catch (e) { } } }
  requestAnimationFrame(frame);
}

/* ================= 起動 ================= */
R.init($('game')); applySettings(); show('title');
document.addEventListener('pointerdown', function () { A.resume(); }, { once: true });
requestAnimationFrame(frame);
if (/debug=1/.test(location.search)) window.__fog = { start: function (i, o) { startStage(i, o); closeModal(); running = true; }, get G() { return G; }, E: E, D: D, save: function () { return save; } };
})();
