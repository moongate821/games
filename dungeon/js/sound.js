// 効果音(Web Audioで合成するチップチューン風)と、振動。iOSは、最初の操作(touchend / click)で音を有効にする必要がある。
'use strict';

const SND = {
    ctx: null,
    master: null,
    unlock() {
        try {
            if (!this.ctx) {
                const AC = window.AudioContext || window.webkitAudioContext;
                if (!AC) return;
                this.ctx = new AC();
                this.master = this.ctx.createGain();
                this.master.gain.value = 0.5;
                this.master.connect(this.ctx.destination);
            }
            if (this.ctx.state !== 'running' && !this.unlocking) this.unlocking = this.ctx.resume().then(() => updateMusic()).catch(() => {}).finally(() => { this.unlocking = null; });
            else if (this.ctx.state === 'running') updateMusic();
            // iOS: 無音の1サンプルを鳴らして、音を有効にする
            const b = this.ctx.createBuffer(1, 1, 22050), src = this.ctx.createBufferSource();
            src.buffer = b; src.connect(this.ctx.destination); src.start(0);
        } catch (_) { /* 音が使えない環境でも、ゲームは進める */ }
    },
    tone(freq, dur, type = 'square', vol = 0.18, slideTo = null, delay = 0) {
        if (!G.settings.sound || !this.ctx || this.ctx.state !== 'running') return;
        const t0 = this.ctx.currentTime + delay;
        const o = this.ctx.createOscillator(), g = this.ctx.createGain();
        o.type = type;
        o.frequency.setValueAtTime(freq, t0);
        if (slideTo) o.frequency.exponentialRampToValueAtTime(Math.max(20, slideTo), t0 + dur);
        g.gain.setValueAtTime(0.0001, t0);
        g.gain.exponentialRampToValueAtTime(vol, t0 + 0.01);
        g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
        o.connect(g); g.connect(this.master);
        o.start(t0); o.stop(t0 + dur + 0.02);
    },
    noise(dur, vol = 0.2, delay = 0, hp = 800) {
        if (!G.settings.sound || !this.ctx || this.ctx.state !== 'running') return;
        const t0 = this.ctx.currentTime + delay, n = Math.floor(this.ctx.sampleRate * dur);
        const buf = this.ctx.createBuffer(1, n, this.ctx.sampleRate), d = buf.getChannelData(0);
        for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / n);
        const s = this.ctx.createBufferSource(), g = this.ctx.createGain(), f = this.ctx.createBiquadFilter();
        f.type = 'highpass'; f.frequency.value = hp;
        s.buffer = buf; g.gain.value = vol;
        s.connect(f); f.connect(g); g.connect(this.master); s.start(t0);
    },
    play(name) {
        switch (name) {
            case 'step': this.noise(0.05, 0.05, 0, 300); break;
            case 'hit': this.noise(0.12, 0.22); this.tone(180, 0.1, 'square', 0.15, 80); break;
            case 'crit': this.noise(0.18, 0.3); this.tone(660, 0.15, 'square', 0.18, 220); this.tone(990, 0.1, 'square', 0.12, 330, 0.05); break;
            case 'hurt': this.tone(220, 0.22, 'sawtooth', 0.2, 60); this.noise(0.1, 0.18); break;
            case 'win': [523, 659, 784, 1047].forEach((f, i) => this.tone(f, 0.12, 'square', 0.15, null, i * 0.09)); break;
            case 'levelup': [523, 659, 784, 1047, 1319].forEach((f, i) => this.tone(f, 0.16, 'triangle', 0.2, null, i * 0.1)); break;
            case 'chest': [392, 523, 659, 784].forEach((f, i) => this.tone(f, 0.14, 'square', 0.14, null, i * 0.07)); break;
            case 'item': this.tone(880, 0.08, 'square', 0.14); this.tone(1320, 0.12, 'square', 0.14, null, 0.07); break;
            case 'trap': this.tone(300, 0.3, 'sawtooth', 0.2, 60); this.noise(0.25, 0.25); break;
            case 'flee': this.tone(520, 0.08, 'square', 0.12, 1040); this.tone(700, 0.08, 'square', 0.1, 1400, 0.07); this.noise(0.18, 0.12, 0.05, 1500); break;   // 魔物が逃げ出す: 駆け去る音
            case 'scared': this.tone(440, 0.12, 'triangle', 0.14, 330); this.tone(392, 0.16, 'triangle', 0.12, 294, 0.1); break;                              // 怯えている: 弱々しい音
            case 'gameover': [392, 349, 311, 262].forEach((f, i) => this.tone(f, 0.35, 'triangle', 0.22, null, i * 0.28)); break;
            case 'ui': this.tone(660, 0.05, 'square', 0.08); break;
            case 'heal': [523, 659, 784].forEach((f, i) => this.tone(f, 0.12, 'sine', 0.2, null, i * 0.08)); break;
            case 'magic': this.tone(300, 0.35, 'sawtooth', 0.14, 1200); break;
            // スロットの演出(2026-10-01): リールの回転・停止・テンパイ・ペカ・消灯・フリーズ明け・ファンファーレ
            case 'reelstart': this.noise(0.25, 0.12, 0, 400); this.tone(200, 0.3, 'sawtooth', 0.08, 600); break;
            case 'reelstop': this.noise(0.05, 0.16, 0, 500); this.tone(140, 0.07, 'square', 0.16, 80); break;
            case 'tempai': [880, 1175, 880, 1175, 880, 1175].forEach((f, i) => this.tone(f, 0.09, 'square', 0.12, null, i * 0.1)); break;
            case 'pika': this.tone(1568, 0.1, 'sine', 0.2); this.tone(2093, 0.25, 'sine', 0.2, null, 0.08); break;
            case 'dim': this.tone(400, 0.4, 'triangle', 0.14, 70); break;
            case 'freezeend': this.noise(0.15, 0.3); [262, 392, 523, 784].forEach((f, i) => this.tone(f, 0.1, 'square', 0.16, null, 0.1 + i * 0.06)); break;
            case 'fanfare': [523, 523, 523, 659, 784, 659, 784, 1047, 1319, 1047, 1319, 1568].forEach((f, i) => this.tone(f, 0.16, 'square', 0.15, null, i * 0.11)); break;
            case 'stairs': [330, 294, 262].forEach((f, i) => this.tone(f, 0.12, 'triangle', 0.2, null, i * 0.1)); break;
        }
    },
};

// ---------- BGM: retryable loading, race-safe transitions, bounded decoded-audio cache ----------
const BGM = {
    cur: null, want: null, src: null, gain: null, list: null, buffers: {},
    pending: null, catalogRequest: null, loads: new Map(), generation: 0,
    retryAt: 0, failedKey: null, lastError: null, maxCacheBytes: 32 * 1024 * 1024,
    volume() {
        const n = Number(G.settings.bgm ?? 2);
        return [0, 0.22, 0.42, 0.7][Number.isInteger(n) && n >= 0 && n <= 3 ? n : 2];
    },
    async loadList() {
        if (this.list) return this.list;
        if (!this.catalogRequest) this.catalogRequest = (async () => {
            const response = await fetch('audio/bgm.json');
            if (!response.ok) throw new Error('Music catalog: ' + response.status);
            const rows = await response.json();
            if (!Array.isArray(rows) || rows.some(e => !e.key || !/^[a-zA-Z0-9_]+$/.test(e.file) || !(e.seconds > 0)))
                throw new Error('Invalid music catalog');
            return this.list = rows;
        })().finally(() => { this.catalogRequest = null; });
        return this.catalogRequest;
    },
    async loadBuffer(entry, ctx) {
        if (this.buffers[entry.key]) return this.buffers[entry.key];
        if (!this.loads.has(entry.key)) this.loads.set(entry.key, (async () => {
            const response = await fetch(`audio/bgm/${entry.file}.m4a`);
            if (!response.ok) throw new Error('Music file: ' + response.status);
            const buffer = await ctx.decodeAudioData(await response.arrayBuffer());
            if (!(buffer.duration > 0)) throw new Error('Empty music file');
            return buffer;
        })().finally(() => { this.loads.delete(entry.key); }));
        return this.loads.get(entry.key);
    },
    cache(key, buffer) {
        delete this.buffers[key];
        this.buffers[key] = buffer;
        let size = Object.values(this.buffers).reduce((n, b) => n + b.length * b.numberOfChannels * 4, 0);
        for (const old of Object.keys(this.buffers)) {
            if (size <= this.maxCacheBytes) break;
            if (old === key) continue; // An oversized active song is retained alone.
            const b = this.buffers[old]; size -= b.length * b.numberOfChannels * 4;
            delete this.buffers[old];
        }
    },
    async play(key) {
        if (!key || typeof key !== 'string') { this.want = null; this.stop(); return; }
        if (this.want !== key) { this.want = key; this.generation++; this.pending = null; }
        const ctx = SND.ctx;
        if (!ctx || ctx.state !== 'running') return;
        if (document.hidden || this.volume() <= 0) { this.stop(0.15); return; }
        if (this.cur === key && this.src) {
            this.gain.gain.setTargetAtTime(this.volume(), ctx.currentTime, 0.2);
            return;
        }
        if (this.pending?.key === key) return this.pending.promise;
        if (this.failedKey === key && Date.now() < this.retryAt) return;
        const id = ++this.generation;
        const promise = (async () => {
            try {
                const entry = (await this.loadList()).find(e => e.key === key);
                if (!entry) throw new Error('Unknown music: ' + key);
                const buf = await this.loadBuffer(entry, ctx);
                if (id !== this.generation || this.want !== key || ctx.state !== 'running' || document.hidden || this.volume() <= 0) return;
                this.fadeOut(0.4);
                const src = ctx.createBufferSource(), g = ctx.createGain();
                src.buffer = buf; src.loop = entry.loop !== false;
                const extra = Math.max(0, buf.duration - entry.seconds);
                src.loopStart = Math.min(extra, 0.1);
                src.loopEnd = Math.min(buf.duration, src.loopStart + entry.seconds);
                g.gain.setValueAtTime(0.0001, ctx.currentTime);
                g.gain.exponentialRampToValueAtTime(Math.max(this.volume(), 0.001), ctx.currentTime + 0.4);
                src.connect(g); g.connect(ctx.destination);
                src.onended = () => { src.disconnect(); g.disconnect(); };
                src.start(0, src.loopStart);
                this.src = src; this.gain = g; this.cur = key;
                this.cache(key, buf);
                this.failedKey = null; this.retryAt = 0; this.lastError = null;
            } catch (error) {
                if (id === this.generation) {
                    this.failedKey = key; this.retryAt = Date.now() + 2500;
                    this.lastError = String(error.message || error);
                }
            } finally { if (this.pending?.id === id) this.pending = null; }
        })();
        this.pending = { key, id, promise };
        return promise;
    },
    fadeOut(fade = 0.4) {
        const ctx = SND.ctx, src = this.src, g = this.gain;
        this.src = null; this.gain = null; this.cur = null;
        if (!src || !ctx) return;
        try {
            g.gain.cancelScheduledValues(ctx.currentTime);
            g.gain.setValueAtTime(Math.max(g.gain.value, 0.0001), ctx.currentTime);
            g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + Math.max(0.01, fade));
            src.stop(ctx.currentTime + Math.max(0.01, fade) + 0.05);
        } catch (_) { try { src.disconnect(); g.disconnect(); } catch (_) {} }
    },
    stop(fade = 0.4) { this.generation++; this.pending = null; this.fadeOut(fade); },
};

const FACILITY_MUSIC = { Guild: 'guild', Inn: 'inn', Temple: 'temple', Blacksmith: 'smith', TrainingHall: 'smith', Casino: 'battle2', Arena: 'foe' };
function playMusicCue(key, milliseconds = 3500) {
    G.musicCue = { key, until: Date.now() + milliseconds, state: G.snap?.state, facility: G.facility?.id };
    updateMusic();
}
function updateMusic() {
    if (document.hidden) { BGM.stop(0.1); return; }
    if (G.musicPaused) { BGM.stop(0.1); return; }
    let key = G.musicOverride;
    if (G.snap?.state === 'GameOver') { key = 'gameover'; G.musicCue = null; }
    if (!key) {
        const titleShown = document.getElementById('title') && !document.getElementById('title').hidden;
        if (titleShown || !G.snap || G.snap.state === 'Title') key = 'title';
        else if (G.snap.music === 'arena') key = 'arena';
        else if (G.snap.state === 'Town' && G.facility) key = FACILITY_MUSIC[G.facility.type] || 'shop';
        else key = G.snap.music || 'town';
        const cue = G.musicCue;
        if (cue && (cue.until <= Date.now() || cue.state !== G.snap?.state || cue.facility !== G.facility?.id || ['Battle', 'GameOver', 'Title'].includes(G.snap?.state) || key === 'ending')) G.musicCue = null;
        else if (cue) key = cue.key;
    } else G.musicCue = null;
    return BGM.play(key);
}
setInterval(() => { if (!G.busy) updateMusic(); }, 700);
document.addEventListener('visibilitychange', () => {
    if (document.hidden) { BGM.stop(0.1); return; }
    const ctx = SND.ctx;
    if (ctx?.state === 'suspended') ctx.resume().then(() => updateMusic()).catch(() => {});
    else updateMusic();
});
window.addEventListener('pagehide', () => BGM.stop(0.1));

// メッセージの内容から、効果音・エフェクト・振動を決める(Windows版の PlaySfxForMessage / TryPlayEffect と同じ対応)
function onLogMessage(message) {
    const has = (...w) => w.some(x => message.includes(x));
    // --- 効果音
    if (has('力尽きた')) SND.play('gameover');
    else if (has('レベルアップ')) SND.play('levelup');
    else if (has('を倒した')) SND.play('win');
    else if (has('怯えている')) SND.play('scared');
    else if (has('は逃げ出した') && !has('パーティ', '盗んで', '奪って')) SND.play('flee');
    else if (has('会心の一撃')) SND.play('crit');
    else if (has('罠が発動', 'が作動した')) SND.play('trap');
    else if (has('宝箱を開けた', '伝説の装備')) SND.play('chest');
    else if (has('の反撃')) SND.play('hurt');
    else if (has('回復した', 'HP+')) SND.play('heal');
    else if (has('を手に入れた', '買い取った', '購入した')) SND.play('item');
    else if (has('階へ入った')) SND.play('stairs');
    else if (has('強敵に捕まった', 'こちらに気づいた')) SND.play('crit');
    else if (has('盗んで逃げ出した', '盗んだ!')) SND.play('trap');
    else if (has('隠し扉を見つけた', '鍵を開けた', '鍵をこじ開けた', '小さな鍵')) SND.play('chest');
    else if (has('夜になった')) SND.play('magic');
    else if (has('ダメージ')) SND.play('hit');
    // --- 振動(コントローラー・iPhone以外のスマホ)
    if (has('の反撃', '罠が発動', 'が作動した')) rumble(0.8, 0.5, 200);
    if (has('力尽きた')) rumble(1, 1, 600);
    if (has('を倒した')) rumble(0.3, 0.4, 120);
    if (has('強敵に捕まった', '盗んで逃げ出した')) rumble(0.9, 0.6, 260);
    // --- エフェクト
    const s = G.snap;
    const inBattle = s && s.state === 'Battle';
    // 味方に関係する演出(被弾・回復・レベルアップ・ぼうぎょ・行動)は、冒険者のカードへ
    const pf = partyFxFor(message);
    if (pf) partyFx(pf.index, pf.kind, pf.amount, { hit: '攻撃ヒット', heal: '回復', levelup: 'レベルアップ', buff: 'バフ' }[pf.kind] || null);
    const table = [
        [() => has('レベルアップ'), 'レベルアップ', true],
        [() => has('宝箱を開けた'), '宝箱取得', false],
        [() => has('蘇生の儀式が成功'), '魔法陣', false],
        [() => has('地雷が爆発', '罠[爆発]'), '爆発', false],
        [() => has('メテオ', 'エクスプロージョン', '爆裂', 'フレア', '全体'), '連鎖爆発', false],
        [() => has('テレポートの罠', '罠[テレポーター]'), 'ワープ', false],
        [() => has('毒の罠', '毒を受けた'), '毒', true],
        [() => has('呪いをかけてきた'), '闇', true],
        [() => has('ホーリー', '聖なる', 'ターンアンデッド'), '聖', false],
        [() => has('ファイア', '炎'), '炎', false],
        [() => has('アイス', '氷'), '氷', false],
        [() => has('サンダー', '雷', 'ライトニング'), '雷', false],
        [() => has('ヒール', '回復した'), '回復', true],
        [() => has('上昇', 'プロテクト', '強化'), 'バフ', true],
        [() => has('低下', '弱体'), 'デバフ', false],
        [() => has('盗んで逃げ出した', '盗んだ!'), 'デバフ', false],
        [() => has('隠し扉を見つけた', '鍵を開けた', '鍵をこじ開けた'), '光柱_金', false],
        [() => has('夜になった'), '闇', false],
        [() => has('会心の一撃'), '攻撃ヒット', false],
        [() => has('の反撃!') && has('ダメージ'), '攻撃ヒット', true],
        [() => inBattle && has('のダメージ(残りHP'), '斬撃', false],
    ];
    for (const [test, name, onParty] of table) {
        if (test()) {
            if (onParty) {   // 味方側の演出。上で決められなかったときは、主人公のカードへ
                if (!pf) partyFx(0, { '回復': 'heal', 'バフ': 'buff', 'レベルアップ': 'levelup' }[name] || 'hit', 0, name === '毒' || name === '闇' ? '攻撃ヒット' : name);
            } else playEffect(name, false);
            break;
        }
    }
    // 出来事の物体(宝箱を開けた、など)
    Scene.eventObj = has('宝箱を開けた') ? '宝箱_開' : has('泉を見つけた') ? '回復の泉' : null;
}

// メッセージから、味方(冒険者のカード)に出す演出を決める。戻り値は { index, kind, amount } か null(Windows版の PartyFxFor と同じ)
function partyFxFor(message) {
    const party = (G.snap && G.snap.party) || [];
    const firstMember = (from = 0) => {
        let best = -1, bestPos = Infinity;
        party.forEach((m, i) => { const pos = message.indexOf(m.name, from); if (pos >= 0 && pos < bestPos) { best = i; bestPos = pos; } });
        return best;
    };
    const num = re => { const m = re.exec(message); return m ? parseInt(m[1], 10) : 0; };
    const counter = message.indexOf('の反撃!');
    if (counter >= 0 && message.includes('ダメージ')) { const v = firstMember(counter); if (v >= 0) return { index: v, kind: 'hit', amount: num(/(\d+)ダメージ/) }; }
    if (message.includes('身を守っている')) { const g = firstMember(); if (g >= 0) return { index: g, kind: 'guard', amount: 0 }; }
    if (message.includes('レベルアップ')) { const w = firstMember(); return { index: w >= 0 ? w : 0, kind: 'levelup', amount: 0 }; }
    if (message.includes('を使った。') && message.includes('HP+')) { const w = firstMember(); return { index: w >= 0 ? w : 0, kind: 'heal', amount: num(/HP\+(\d+)/) }; }
    if (message.includes('回復した') || (message.includes('でHP') && message.includes('回復'))) {
        let w = firstMember(message.indexOf('で') + 1); if (w < 0) w = firstMember();
        return { index: w >= 0 ? w : 0, kind: 'heal', amount: num(/(\d+)回復/) };
    }
    const atk = message.indexOf('の攻撃!');
    if (atk > 0) { const a = firstMember(); if (a >= 0 && message.indexOf(party[a].name) < atk) return { index: a, kind: 'act', amount: 0 }; }
    return null;
}

// コントローラーの振動(対応する機器だけ)。スマホは navigator.vibrate(iPhoneのSafariは非対応)
let rumbleLast = 0;
function rumble(strong, weak, ms) {
    if (!G.settings.haptics) return;
    const now = performance.now();
    if (now - rumbleLast < 60) return;
    rumbleLast = now;
    try {
        const pad = (navigator.getGamepads ? Array.from(navigator.getGamepads()) : []).find(p => p && p.connected);
        if (pad && pad.vibrationActuator && pad.vibrationActuator.playEffect) {
            pad.vibrationActuator.playEffect('dual-rumble', { duration: ms, strongMagnitude: strong, weakMagnitude: weak });
        } else if (G.settings.vibrate && navigator.vibrate) {
            navigator.vibrate(Math.round(ms / 2));
        }
    } catch (_) { /* 振動できない機器では、何もしない */ }
}
