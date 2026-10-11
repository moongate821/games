// PWA shell and input lifecycle. The simulation stays in sketch.js.
const isShowroom = location.hash.includes('showroom');
const appEl = id => document.getElementById(id);
let helpReturn = 'title', installPrompt = null, uiStamp = '';
function clearFlightInput() {
  for (const k of Object.keys(pulse)) pulse[k] = k === 'roll' ? 0 : false;
  stickId = null; stickOrg = null; stickPos = null; touchPrev = {}; touchHeld = {};
  P.locks = []; P.pending = []; botLockPrev = false;
  lastTap['-1'] = lastTap['1'] = -1e9;
  // p5 owns held keys; send releases so focus changes cannot leave a stuck shot.
  for (const code of [32,37,38,39,40,16,88,90]) window.dispatchEvent(new KeyboardEvent('keyup', { keyCode: code, which: code, bubbles: true }));
  pulse.release = false;
}
function togglePause(force) {
  if (state !== 'play' || isShowroom) return;
  const next = typeof force === 'boolean' ? force : !paused;
  if (paused === next) return;
  paused = next; clearFlightInput();
  if (paused) { drawScene(); if (SND.context && SND.context.state === 'running') SND.context.suspend().catch(() => {}); }
  else { SND.resume(); appEl('pause-screen').hidden = true; }
  syncAppUI(true);
}
function syncAppUI(force) {
  const modal = !appEl('help-screen').hidden || !appEl('install-screen').hidden || !appEl('settings-screen').hidden;
  const stamp = [state, paused, mode, !!saveData, lite, modal].join('|');
  if (!force && stamp === uiStamp) return;
  uiStamp = stamp;
  appEl('shipyard-ui').hidden = !isShowroom;
  appEl('title-screen').hidden = state !== 'title' || isShowroom;
  appEl('pause-screen').hidden = !paused || modal;
  appEl('toolbar').hidden = state !== 'play' || paused || modal || isShowroom;
  appEl('continue-button').hidden = !saveData;
  if (saveData) appEl('continue-button').textContent = TR('続きから · ', 'Continue · ') + String(saveData.stage).padStart(2,'0');
  appEl('lite-setting').checked = lite;
  // Read-only diagnostics also make state transitions inspectable in QA.
  document.body.dataset.state = state; document.body.dataset.mode = mode; document.body.dataset.paused = String(paused);
}
function openHelp() {
  helpReturn = state === 'play' ? 'pause' : 'title';
  if (state === 'play') togglePause(true);
  appEl('help-screen').hidden = false; appEl('pause-screen').hidden = true;
}
appEl('launch-button').addEventListener('click', () => { startGame(); appEl('launch-button').blur(); });
appEl('continue-button').addEventListener('click', () => { continueGame(); syncAppUI(true); appEl('continue-button').blur(); });
appEl('pause-button').addEventListener('click', () => togglePause(true));
appEl('resume-button').addEventListener('click', () => { togglePause(false); appEl('resume-button').blur(); });
appEl('help-button').addEventListener('click', openHelp);
appEl('pause-help').addEventListener('click', openHelp);
// ---------- 設定(言語・難易度・音量・軽量表示)。タイトルと一時停止の、どちらからも開く ----------
let settingsReturn = 'title';
function openSettings() {
  settingsReturn = state === 'play' ? 'pause' : 'title';
  if (state === 'play') togglePause(true);
  appEl('settings-screen').hidden = false; appEl('pause-screen').hidden = true; refreshSettingsUI();
  const cur = appEl('diff-seg').querySelector('[aria-pressed=true]'); if (cur) cur.focus();
}
function closeSettings() { appEl('settings-screen').hidden = true; syncAppUI(true); appEl(settingsReturn === 'pause' ? 'resume-button' : 'settings-button').focus(); }
function refreshSettingsUI() {   // 言語・難易度の表示を、いまの設定に合わせる
  for (const b of appEl('lang-seg').children) b.setAttribute('aria-pressed', String(b.dataset.lang === SF.lang));
  [...appEl('diff-seg').children].forEach((b, i) => { b.textContent = TR(DIFFS[i].ja, DIFFS[i].en); b.setAttribute('aria-pressed', String(i === SF.diff)); b.dataset.d = DIFFS[i].id; });
  appEl('diff-desc').textContent = TR(DF().jaD, DF().enD); appEl('diff-stats').textContent = diffStats();
  appEl('title-status').textContent = TR('難易度 ', 'Difficulty ') + diffName() + TR('　／　言語 日本語', '  /  Language English');
}
appEl('settings-button').addEventListener('click', openSettings);
appEl('pause-settings').addEventListener('click', openSettings);
appEl('close-settings').addEventListener('click', closeSettings);
for (const b of appEl('lang-seg').children) b.addEventListener('click', () => setLang(b.dataset.lang));
[...appEl('diff-seg').children].forEach((b, i) => b.addEventListener('click', () => { setDiff(i); SND.se && SND.se('tick'); }));
window.addEventListener('keydown', e => { if (e.key === 'Escape' && !appEl('settings-screen').hidden) { closeSettings(); e.preventDefault(); } });
refreshSettingsUI();
appEl('close-help').addEventListener('click', () => { appEl('help-screen').hidden = true; syncAppUI(true); appEl(helpReturn === 'pause' ? 'resume-button' : 'help-button').focus(); });
appEl('lite-setting').addEventListener('change', e => { lite = e.target.checked; fpsN = 0; fpsAvg = 16.7; saveSettings(); });
for (const k of ['sfx','bgm']) appEl(k + '-volume').addEventListener('input', e => { SND.setVol(k, +e.target.value); saveSettings(); });
function saveSettings() { sfSave({ lite, sfx: +appEl('sfx-volume').value, bgm: +appEl('bgm-volume').value }); }   // 言語と難易度を消さないよう、混ぜて保存する(i18n.js)
try { const settings = JSON.parse(localStorage.getItem('sf_settings') || 'null'); if (settings) { if (typeof settings.lite === 'boolean') lite = settings.lite; for (const k of ['sfx','bgm']) if (Number.isFinite(settings[k])) { const v = Math.max(0, Math.min(1, settings[k])); SND.setVol(k,v); appEl(k+'-volume').value = v; } } } catch (_) {}
document.addEventListener('visibilitychange', () => { if (document.hidden) { if (state === 'play') togglePause(true); if (SND.context) SND.context.suspend().catch(()=>{}); } });
window.addEventListener('blur', () => { if (state === 'play') togglePause(true); });
window.addEventListener('beforeinstallprompt', e => { e.preventDefault(); installPrompt = e; });
appEl('install-button').addEventListener('click', async () => {
  if (installPrompt) { const prompt = installPrompt; installPrompt = null; await prompt.prompt(); }
  else { appEl('install-screen').hidden = false; if (location.protocol === 'file:') appEl('install-note').textContent = TR('このローカルファイルはブラウザで遊べます。ホーム画面への追加とオフライン保存には、HTTPSで公開したゲームURLを開いてください。', 'This local file can be played in the browser. To add it to the home screen and save it offline, open the game URL published over HTTPS.'); }
});
appEl('close-install').addEventListener('click', () => { appEl('install-screen').hidden = true; appEl('install-button').focus(); });
appEl('offline-status').textContent = TR('初回起動中', 'STARTING…');
if (!new URLSearchParams(location.search).has('dev') && 'serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost' || location.hostname === '127.0.0.1')) {
  navigator.serviceWorker.register('./sw.js').then(async () => {
    await navigator.serviceWorker.ready;
    appEl('offline-status').textContent = 'OFFLINE READY';
  }).catch(() => { appEl('offline-status').textContent = 'ONLINE MODE'; });
} else appEl('offline-status').textContent = location.protocol === 'file:' ? 'LOCAL EDITION' : 'ONLINE MODE';

function yardNavigate() {
  const f=appEl('yard-faction').value,c=appEl('yard-class').value;
  location.hash=(c==='fighter'?'gallery='+f:'ship='+f+':'+c+':1')+',showroom,still';location.reload();
}
appEl('shipyard-button').addEventListener('click',()=>{location.hash='ship=empire:carrier:1,showroom,still';location.reload();});
appEl('yard-exit').addEventListener('click',()=>{location.hash='';location.reload();});
appEl('yard-faction').addEventListener('change',yardNavigate);appEl('yard-class').addEventListener('change',yardNavigate);
if(isShowroom){const m=/ship=(\w+):(\w+)/.exec(location.hash),g=/gallery=(\w+)/.exec(location.hash);appEl('yard-faction').value=m?m[1]:g?g[1]:'empire';appEl('yard-class').value=m?m[2]:'fighter';}
