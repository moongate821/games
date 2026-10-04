// 起動: WebAssembly(ゲーム本体)を読み込み、開始画面を出す。PWA(オフライン用のService Worker、ホーム画面追加)もここで登録する。
'use strict';

function setBoot(pct, note) {
    $('boot-fill').style.width = pct + '%';
    if (note) $('boot-note').textContent = T(note);
}

// 画面の高さを、モバイルのアドレスバーの分も含めて正しく使う
function fitViewport() {
    document.documentElement.style.setProperty('--vh', window.innerHeight * 0.01 + 'px');
    // 縦向きのスマホには、横向きのほうが遊びやすいと知らせる(ダンジョン・戦闘中だけ)
    const portrait = window.innerHeight > window.innerWidth;
    const s = G.snap;
    $('rotate').hidden = !(portrait && window.innerWidth < 700 && s && (s.state === 'Dungeon' || s.state === 'Battle') && !G.rotateHintDismissed);
    if (!$('rotate').hidden && !G.rotateTimer) G.rotateTimer = setTimeout(() => { G.rotateHintDismissed = true; $('rotate').hidden = true; }, 4000);
}

async function boot() {
    loadSettings();
    locLoad(); // 英語版の辞書(設定で切り替え。読めなくても日本語で遊べる)
    window.addEventListener('beforeinstallprompt', e => { e.preventDefault(); window.installPrompt = e; if (!$('title').hidden) showTitle(); });
    window.addEventListener('resize', fitViewport);
    window.addEventListener('orientationchange', () => setTimeout(fitViewport, 250));
    setBoot(10, 'ゲームを読み込んでいます…');
    try {
        await Blazor.start({
            loadBootResource: undefined,
        });
        await G.hostPromise;
    } catch (err) {
        setBoot(100, '起動できませんでした: ' + (err && err.message ? err.message : err));
        console.error(err);
        return;
    }
    setBoot(70, 'ゲームデータを準備しています…');
    initHost();
    preloadCore();
    initScene();
    initInput();
    setBoot(100, '');
    $('boot').hidden = true;
    $('app').hidden = false;
    document.documentElement.style.setProperty('--title-bg', "url('img/bg/TOWN_001.webp')");
    showTitle();
    fitViewport();
    // 状態が変わるたびに、縦向きの案内などを更新する
    const origRefresh = refresh;
    window.refresh = function () { origRefresh(); fitViewport(); };
    registerServiceWorker();
    window.__ready = true;
    const st = /selftest=(\w+)/.exec(location.hash);
    if (st) runSelfTest(st[1]);   // 確認用(#selftest=pace)
}

function registerServiceWorker() {
    // オフラインで遊べるようにする(https、または localhost のときだけ動く)
    if (!('serviceWorker' in navigator)) return;
    if (!(location.protocol === 'https:' || location.hostname === 'localhost' || location.hostname === '127.0.0.1')) return;
    if (new URLSearchParams(location.search).has('dev')) return;
    navigator.serviceWorker.register('service-worker.js').then(() => navigator.serviceWorker.ready).then(() => {
        G.offlineReady = true;
        const foot = $('title-foot');
        if (foot && !foot.textContent) foot.textContent = 'OFFLINE READY(オフラインでも遊べます)';
    }).catch(() => { /* 登録できなくても、オンラインでは遊べる */ });
}

window.addEventListener('DOMContentLoaded', boot);
