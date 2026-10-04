// ゲームの窓口(C#の WebGame)を呼ぶ。ゲームのルールはすべてC#側(Windows版と同じ GameSession)にある。
'use strict';

window.G = {
    snap: null,            // 直近の状態(C#の Snapshot)
    facility: null,        // 街で入っている施設(id, type, name)。無ければ null
    log: [],               // ログ(新しいものが後ろ)
    settings: { effects: 'normal', sound: true, autoStop: 35, haptics: true, vibrate: true, msgSpeed: 2, bgm: 2, lang: 'ja' },
    musicOverride: null,   // 画面が決めたBGM(キャラ作成・物語など)
    busy: false,           // メッセージを1つずつ表示している間は true(操作を受け付けない)
    hasSave: false,
    fx: null,              // 画面に重ねる効果 { name, onParty, t0 }
    hostReady: false,
};

let resolveHost;
G.hostPromise = new Promise(r => { resolveHost = r; });
window.gameHostReady = () => { G.hostReady = true; resolveHost(); };   // C#の起動が終わったら、C#から呼ばれる

const SAVE_KEY = 'dungeon_slot1';

function storedSave() {
    try { return localStorage.getItem(SAVE_KEY); } catch (_) { return null; }
}

function initHost() {
    const raw = DotNet.invokeMethod('Game.Web', 'Init', storedSave());
    const res = JSON.parse(raw);
    G.snap = res.snap;
    G.hasSave = !!(res.data && res.data.hasSave);
    return res;
}

// 命令を1つ実行する。戻り値は { ok, msg, snap, data, save }。状態(G.snap)は自動で更新され、セーブが更新されたら端末に保存する。
function api(cmd, args) {
    const raw = DotNet.invokeMethod('Game.Web', 'Call', cmd, args ? JSON.stringify(args) : null);
    const res = JSON.parse(raw);
    if (res.snap) G.snap = res.snap;
    if (res.save) {
        try { localStorage.setItem(SAVE_KEY, res.save); G.hasSave = true; } catch (_) { toast('この端末では、セーブを保存できませんでした(プライベートブラウズなど)'); }
    }
    return res;
}

// ログに追加する(メッセージが空なら何もしない)。効果音・効果・振動の合図もここで出す。
function logMessage(msg) {
    if (!msg) return;
    G.log.push(msg);
    if (G.log.length > 200) G.log.splice(0, G.log.length - 200);
    if (typeof onLogMessage === 'function') onLogMessage(msg);
}

// メッセージを、1つずつ見せる単位(1つの行動とその結果)に分ける。
function splitMessage(message) {
    if (!message || !message.trim()) return [];
    const marked = message.replace(/(宝箱を開けた!|を倒した!|が作動した!|が落ちていた!|階へ入った\(.*?\)。)/g, '$1\n');
    return marked.split(/\n|(?<=[。!)])\s+/).map(p => p.trim()).filter(p => p.length > 0);
}

const MSG_DELAYS = [0, 300, 600, 1000];   // 一瞬・はやい・ふつう・ゆっくり(ミリ秒)

// 命令を実行して、メッセージをログへ出し、画面を更新する。
// 攻撃・宝箱など、出来事が複数あるときは、1つずつ間を置いて見せる(表示中は操作を受け付けない。画面のHPや敵の絵は、最後にまとめて更新する)。
function act(cmd, args) {
    if (G.busy) return null;
    const before = G.snap;
    const res = api(cmd, args);
    const segs = splitMessage(res.msg);
    const speed = G.settings.msgSpeed ?? 2;
    if (speed === 0 || segs.length <= 1 || !res.snap) {
        logMessage(res.msg);
        if (typeof refresh === 'function') refresh();
        return res;
    }
    playSegments(segs, before, res.snap, speed);
    return res;
}

async function playSegments(segs, before, after, speed) {
    G.busy = true;
    document.body.classList.add('busy');
    G.snap = JSON.parse(JSON.stringify(before));   // 表示中は、行動の前の状態から、メッセージに合わせて少しずつ変える
    if (typeof requestRedraw === 'function') requestRedraw();
    const delay = Math.min(MSG_DELAYS[speed], 14000 / Math.max(segs.length, 1));
    try {
        for (let i = 0; i < segs.length; i++) {
            applyHpFromMessage(segs[i], G.snap);
            logMessage(segs[i]);
            if (typeof renderLog === 'function') renderLog();
            const extra = segs[i].includes('レベルアップ') || segs[i].includes('倒した') ? delay / 2 : 0;
            await new Promise(r => setTimeout(r, delay + extra));
        }
    } finally {
        G.snap = after;
        G.busy = false;
        document.body.classList.remove('busy');
        if (typeof refresh === 'function') refresh();
    }
}

// 2026-09-26追加(ユーザー指定「戦闘中にダメージを受けてもリアルタイムに減らない」): メッセージを1つ見せるたびに、
// その中の「(残りHP 23/30)」「レベルアップ!→Lv2(HP62」から、冒険者と敵のHPをその場で書き換える(誰のHPかは、数字の直前の名前で決める)。
function applyHpFromMessage(text, snap) {
    if (!snap || !snap.party) return;
    const party = snap.party, enemies = (snap.battle && snap.battle.enemies) || [];
    const ownerBefore = pos => {
        let best = null, bestPos = -1, bestLen = 0;
        const consider = (name, ref) => {
            if (!name) return;
            const p = text.lastIndexOf(name, Math.max(pos - 1, 0));
            if (p < 0 || p + name.length > pos) return;
            if (p > bestPos || (p === bestPos && name.length > bestLen)) { best = ref; bestPos = p; bestLen = name.length; }
        };
        party.forEach(m => consider(m.name, { m }));
        enemies.forEach(e => consider(e.name, { e }));
        return best;
    };
    const setEnemyHp = (name, hp) => {
        const c = enemies.filter(e => e.name === name && e.hp >= hp).sort((a, b) => (a.hp - hp) - (b.hp - hp))[0];
        if (c) {
            if (typeof enemyAnim === 'function' && hp < c.hp) enemyAnim(c, hp <= 0 ? 'defeat' : 'hit');   // 被弾で揺れる・倒すと消える
            c.hp = hp;
        }
    };
    let changed = false;
    for (const m of text.matchAll(/(?:残りHP|\(HP)(\d+)\/(\d+)/g)) {
        const o = ownerBefore(m.index);
        if (!o) continue;
        if (o.m) { o.m.hp = +m[1]; o.m.maxHp = +m[2]; o.m.down = o.m.hp <= 0; }
        else setEnemyHp(o.e.name, +m[1]);
        changed = true;
    }
    const lv = /レベルアップ!→Lv(\d+)\(HP(\d+)/.exec(text);
    if (lv) {
        const o = ownerBefore(lv.index);
        const m = o && o.m ? o.m : party[0];
        m.level = +lv[1]; m.hp = m.maxHp = +lv[2];
        changed = true;
    }
    // 逃げ出す・怯える敵の演出(盗んで逃げるときも)
    for (const [word, kind] of [['怯えている', 'scared'], ['逃げ出した', 'flee']]) {
        const w = text.indexOf(word);
        if (w > 0 && !(kind === 'flee' && text.includes('パーティ'))) { const o = ownerBefore(w); if (o && o.e && typeof enemyAnim === 'function') enemyAnim(o.e, kind); }
    }
    const k = text.indexOf('を倒した');
    if (k > 0) { const o = ownerBefore(k); if (o && o.e) { setEnemyHp(o.e.name, 0); changed = true; } }
    if (changed) {
        if (typeof updatePartyBars === 'function') updatePartyBars();
        if (typeof requestRedraw === 'function') requestRedraw();
    }
}

function toast(text, ms = 2200) {
    const el = document.getElementById('toast');
    if (!el) return;
    el.textContent = T(text);
    el.hidden = false;
    clearTimeout(toast._t);
    toast._t = setTimeout(() => { el.hidden = true; }, ms);
}
