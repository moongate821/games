'use strict';

async function showMusicRoom() {
    let tracks;
    try { tracks = await BGM.loadList(); }
    catch (_) { toast('曲の一覧を読み込めませんでした。もう一度お試しください。'); return; }
    const previous = G.musicOverride, wasPaused = G.musicPaused;
    const status = h('div', { class: 'note', 'aria-live': 'polite' }, '曲を選ぶと再生します。音量は設定のBGM音量に従います。');
    const list = h('div', { style: 'max-height:52vh;overflow-y:auto;padding:4px' });
    for (const track of tracks) list.append(h('button', {
        style: 'display:block;width:100%;text-align:left;margin:6px 0;padding:12px',
        onclick: async () => {
            SND.unlock(); G.musicPaused = false; G.musicOverride = track.key;
            status.textContent = `${T('読込中')}: ${T(track.title)}`;
            await updateMusic();
            if (G.musicOverride !== track.key || G.musicPaused) return;
            status.textContent = BGM.volume() <= 0 ? T('BGM音量が切になっています。設定で変更できます。') :
                BGM.cur === track.key ? `${T('再生中')}: ${T(track.title)}` : T('曲を再生できませんでした。もう一度お試しください。');
        },
    }, `${String(track.no).padStart(2, '0')}  ${T(track.title)} — ${T(track.place)}`));
    try {
        return await dialog({ title: '音楽室', wide: true, body: h('div', {}, status, list), buttons: [
            { text: '停止', onClick: () => { G.musicPaused = true; BGM.stop(0.15); status.textContent = T('停止中'); } },
            { text: '閉じる', value: true, cls: 'primary' },
        ] });
    } finally { G.musicOverride = previous; G.musicPaused = wasPaused; updateMusic(); }
}
