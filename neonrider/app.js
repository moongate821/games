// app.js — PWA の外枠(タイトル・一時停止・設定・インストール)と入力のリセット。ゲーム本体は game.js
const appEl = id => document.getElementById(id);
let helpReturn = 'title', installPrompt = null, uiStamp = '';
function clearFlightInput() {
  pulse.up = pulse.down = pulse.slide = false; for (const pl of PLAYERS) pl.pulse = { up: false, down: false, slide: false };
  stickId = null; stickOrg = null; stickPos = null; touchPrev = {}; touchHeld = {};
  // p5 が押しっぱなしのキーを覚えているので、離したことにする(フォーカスが外れても、射撃が止まらなくならないように)
  for (const code of [32, 37, 38, 39, 40, 16, 66, 67, 87, 83, 65, 68, 70, 71, 82, 75, 76, 74]) window.dispatchEvent(new KeyboardEvent('keyup', { keyCode: code, which: code, bubbles: true }));
}
function togglePause(force) {
  if (state !== 'play') return;
  const next = typeof force === 'boolean' ? force : !paused;
  if (paused === next) return;
  paused = next; clearFlightInput();
  if (paused) { drawScene(); if (SND.context && SND.context.state === 'running') SND.context.suspend().catch(() => {}); }
  else { SND.resume(); appEl('pause-screen').hidden = true; }
  syncAppUI(true);
}
function syncAppUI(force) {
  const modal = !appEl('help-screen').hidden || !appEl('install-screen').hidden;
  const stamp = [state, paused, lite, modal, TRANS, hiddenUnlocked].join('|');
  if (!force && stamp === uiStamp) return;
  uiStamp = stamp;
  appEl('title-screen').hidden = state !== 'title';
  appEl('garage-ui').hidden = state !== 'select' && state !== 'course';
  appEl('two-button').hidden = !TWO_P_OK;
  appEl('pause-screen').hidden = !paused || modal;
  appEl('toolbar').hidden = state !== 'play' || paused || modal || TWO();
  appEl('continue-button').hidden = true;
  appEl('lite-setting').checked = lite;
  appEl('trans-button').textContent = '変速: ' + (TRANS === 'MT' ? 'MT(クラッチ)' : 'AT(自動)');
  document.body.dataset.state = state; document.body.dataset.mode = mode; document.body.dataset.paused = String(paused);
}
function openHelp() {
  helpReturn = state === 'play' ? 'pause' : 'title';
  if (state === 'play') togglePause(true);
  appEl('help-screen').hidden = false; appEl('pause-screen').hidden = true;
}
function toTitle() { paused = false; state = 'title'; SND.resume(); titleDemo(); SND.setBgm('title'); syncAppUI(true); }
appEl('launch-button').addEventListener('click', () => { openSelect('1p'); appEl('launch-button').blur(); });
appEl('two-button').addEventListener('click', () => { if (TWO_P_OK) openSelect('2p'); appEl('two-button').blur(); });
appEl('trans-button').addEventListener('click', () => { setTrans(TRANS === 'MT' ? 'AT' : 'MT'); syncAppUI(true); });
appEl('pause-button').addEventListener('click', () => togglePause(true));
appEl('resume-button').addEventListener('click', () => { togglePause(false); appEl('resume-button').blur(); });
appEl('quit-button').addEventListener('click', () => { toTitle(); });
appEl('help-button').addEventListener('click', openHelp);
appEl('garage-button').addEventListener('click', () => { openSelect('view'); appEl('garage-button').blur(); });
appEl('garage-exit').addEventListener('click', () => exitSelect());
appEl('pause-help').addEventListener('click', openHelp);
appEl('close-help').addEventListener('click', () => { appEl('help-screen').hidden = true; syncAppUI(true); appEl(helpReturn === 'pause' ? 'resume-button' : 'help-button').focus(); });
appEl('lite-setting').addEventListener('change', e => { lite = e.target.checked; DRAW_N = lite ? 150 : TWO() ? 180 : 240; fpsN = 0; fpsAvg = 16.7; saveSettings(); });
for (const k of ['sfx', 'bgm']) appEl(k + '-volume').addEventListener('input', e => { SND.setVol(k, +e.target.value); saveSettings(); });
function saveSettings() { try { localStorage.setItem('nr_settings', JSON.stringify({ lite, trans: TRANS, sfx: +appEl('sfx-volume').value, bgm: +appEl('bgm-volume').value })); } catch (_) {} }
try {
  const st = JSON.parse(localStorage.getItem('nr_settings') || 'null');
  if (st) {
    if (typeof st.lite === 'boolean') { lite = st.lite; if (lite) DRAW_N = 150; }
    if (st.trans === 'MT' || st.trans === 'AT') TRANS = st.trans; else if (isTouchDev) TRANS = 'AT';
    for (const k of ['sfx', 'bgm']) if (Number.isFinite(st[k])) { const v = Math.max(0, Math.min(1, st[k])); SND.setVol(k, v); appEl(k + '-volume').value = v; }
  } else if (isTouchDev) TRANS = 'AT';   // タッチ端末は、最初は AT
} catch (_) {}
document.addEventListener('visibilitychange', () => { if (document.hidden) { if (state === 'play') togglePause(true); if (SND.context) SND.context.suspend().catch(() => {}); } });
window.addEventListener('blur', () => { if (state === 'play') togglePause(true); });
window.addEventListener('beforeinstallprompt', e => { e.preventDefault(); installPrompt = e; });
appEl('install-button').addEventListener('click', async () => {
  if (installPrompt) { const prompt = installPrompt; installPrompt = null; await prompt.prompt(); }
  else { appEl('install-screen').hidden = false; if (location.protocol === 'file:') appEl('install-note').textContent = 'このローカルファイルは、ブラウザでそのまま遊べます。ホーム画面への追加とオフライン保存には、同じLANのサーバー(同梱の起動用ファイル)から開いてください。'; }
});
appEl('close-install').addEventListener('click', () => { appEl('install-screen').hidden = true; appEl('install-button').focus(); });
if (!new URLSearchParams(location.search).has('dev') && 'serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost' || location.hostname === '127.0.0.1')) {
  navigator.serviceWorker.register('./sw.js').then(async () => { await navigator.serviceWorker.ready; appEl('offline-status').textContent = 'OFFLINE READY'; }).catch(() => { appEl('offline-status').textContent = 'ONLINE MODE'; });
} else appEl('offline-status').textContent = location.protocol === 'file:' ? 'LOCAL EDITION' : 'ONLINE MODE';
