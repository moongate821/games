// ---------- PWAシェルと画面遷移。シミュレーション本体は sketch.js / starmap.js / hexbattle.js 側 ----------
const appEl = id => document.getElementById(id);
let installPrompt = null, uiStamp = '', helpReturn = 'title';

// ---------- 尊師の兵法(2026-09-29追加): タイトル画面に孫子『兵法』の一節を1つ、毎回ランダムに掲げる ----------
const SUNTZU_QUOTES = [
  '彼を知り己を知れば、百戦して殆うからず ― 孫子・謀攻篇',
  '兵は拙速を聞くも、未だ巧の久しきを睹ざるなり ― 孫子・作戦篇',
  '勝兵は先ず勝ちて而る後に戦いを求め、敗兵は先ず戦いて而る後に勝ちを求む ― 孫子・軍形篇',
  '其の疾きこと風の如く、其の徐かなること林の如く、侵掠すること火の如く、動かざること山の如し ― 孫子・軍争篇',
  '戦わずして人の兵を屈するは、善の善なる者なり ― 孫子・謀攻篇',
  '善く戦う者は、人を致して人に致されず ― 孫子・虚実篇',
  '兵とは詭道なり ― 孫子・計篇',
  '上兵は謀を伐つ ― 孫子・謀攻篇',
];
appEl('quote-line').textContent = '「' + SUNTZU_QUOTES[Math.floor(Math.random() * SUNTZU_QUOTES.length)] + '」';

function togglePause(force) {
  if (state !== 'play') return;
  const next = typeof force === 'boolean' ? force : !paused;
  if (paused === next) return;
  paused = next; if (paused) clearInputState();
  if (paused) { if (SND.context && SND.context.state === 'running') SND.context.suspend().catch(() => {}); } else SND.resume();
  syncAppUI(true);
}
function syncAppUI(force) {
  const modal = !appEl('help-screen').hidden || !appEl('install-screen').hidden;
  const stamp = [state, paused, modal].join('|');
  if (!force && stamp === uiStamp) return;
  uiStamp = stamp;
  appEl('title-screen').hidden = state !== 'title';
  appEl('pause-screen').hidden = !paused || modal;
  appEl('toolbar').hidden = state !== 'play' || paused || modal || (GAME && GAME.phase === 'campaignEnd');
  appEl('continue-button').hidden = !saveData;
  document.body.dataset.state = state; document.body.dataset.paused = String(paused);
}
function openHelp() {
  helpReturn = state === 'play' ? 'pause' : 'title';
  if (state === 'play') togglePause(true);
  appEl('help-screen').hidden = false; appEl('pause-screen').hidden = true;
}
appEl('launch-button').addEventListener('click', () => { SND.resume(); startGame(); syncAppUI(true); appEl('launch-button').blur(); });
appEl('continue-button').addEventListener('click', () => { SND.resume(); continueGame(); syncAppUI(true); appEl('continue-button').blur(); });
appEl('gallery-button').addEventListener('click', () => { openGallery(); appEl('gallery-button').blur(); });
appEl('sandbox-button').addEventListener('click', () => { startSandbox(); appEl('sandbox-button').blur(); });
appEl('story-button').addEventListener('click', () => { startStoryMode(); appEl('story-button').blur(); });
appEl('mission-button').addEventListener('click', () => { openMissionSelect(); appEl('mission-button').blur(); });
appEl('pause-button').addEventListener('click', () => togglePause(true));
appEl('resume-button').addEventListener('click', () => { togglePause(false); appEl('resume-button').blur(); });
appEl('help-button').addEventListener('click', openHelp);
appEl('pause-help').addEventListener('click', openHelp);
appEl('close-help').addEventListener('click', () => { appEl('help-screen').hidden = true; syncAppUI(true); appEl(helpReturn === 'pause' ? 'resume-button' : 'help-button').focus(); });
for (const k of ['sfx', 'bgm']) appEl(k + '-volume').addEventListener('input', e => { SND.setVol(k, +e.target.value); saveSoundSettings(); });
function saveSoundSettings() { try { localStorage.setItem('sh_sound', JSON.stringify({ sfx: +appEl('sfx-volume').value, bgm: +appEl('bgm-volume').value })); } catch (_) {} }
try {
  const s = JSON.parse(localStorage.getItem('sh_sound') || 'null');
  if (s) for (const k of ['sfx', 'bgm']) if (Number.isFinite(s[k])) { const v = Math.max(0, Math.min(1, s[k])); SND.setVol(k, v); appEl(k + '-volume').value = v; }
} catch (_) {}
document.addEventListener('visibilitychange', () => { if (document.hidden && state === 'play') togglePause(true); });
window.addEventListener('blur', () => { if (state === 'play') togglePause(true); });
window.addEventListener('beforeinstallprompt', e => { e.preventDefault(); installPrompt = e; });
appEl('install-button').addEventListener('click', async () => {
  if (installPrompt) { const p = installPrompt; installPrompt = null; await p.prompt(); }
  else { appEl('install-screen').hidden = false; if (location.protocol === 'file:') appEl('install-note').textContent = 'このローカルファイルはブラウザで遊べます。ホーム画面への追加とオフライン保存には、HTTPSで公開したURLを開いてください。'; }
});
appEl('close-install').addEventListener('click', () => { appEl('install-screen').hidden = true; appEl('install-button').focus(); });
if (!new URLSearchParams(location.search).has('dev') && 'serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost' || location.hostname === '127.0.0.1')) {
  navigator.serviceWorker.register('./sw.js').then(async () => { await navigator.serviceWorker.ready; appEl('offline-status').textContent = 'OFFLINE READY'; }).catch(() => { appEl('offline-status').textContent = 'ONLINE MODE'; });
} else appEl('offline-status').textContent = location.protocol === 'file:' ? 'LOCAL EDITION' : 'ONLINE MODE';
