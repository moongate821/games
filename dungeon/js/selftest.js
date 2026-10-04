// 確認用: URLの末尾に #selftest=pace を付けて開くと、自動で操作して、結果のJSONを <title> に入れる(画面なしのChromeで確認できる)。
// 1980s GALAXY SHOOTER の #demo と同じ考え方。普段の遊びには影響しない。
'use strict';

async function runSelfTest(kind) {
    const sleep = ms => new Promise(r => setTimeout(r, ms));
    const result = { kind, ok: true };
    try {
        if (kind === 'bgm') {
            SND.unlock(); await sleep(500);
            const seen = [];
            const note = async label => { await sleep(1800); seen.push(label + '=' + BGM.cur + (BGM.src ? '(再生中)' : '')); };
            await note('タイトル');
            act('newDefault'); await note('街');
            const g = G.facilityList ? null : null;
            act('enterDungeon', { id: 1 }); await note('洞窟1階');
            act('devSteps', { n: 139 }); act('devEncounter', { ids: [1] }); await note('戦闘');
            act('autoBattle', { stop: 0 }); await note('戦闘後');
            act('devSteps', { n: 150 }); refresh(); await note('夜');
            act('devEncounter', { ids: [9] }); await note('ボス');
            result.seen = seen;
            result.buffers = Object.entries(BGM.buffers).map(([k, b]) => k + ':' + b.duration.toFixed(3) + '/' + BGM.list.find(e => e.key === k).seconds);
            result.ctx = SND.ctx && SND.ctx.state;
        }
        if (kind === 'hp') {
            act('newDefault'); act('enterDungeon', { id: 1 });
            G.settings.msgSpeed = 2;
            act('devEncounter', { ids: [2, 4] });
            const before = JSON.stringify(G.snap.party.map(m => m.hp)) + JSON.stringify(G.snap.battle.enemies.map(e => e.hp));
            const res = act('round', { commands: [] });
            const samples = [];
            while (G.busy) {
                samples.push(JSON.stringify(G.snap.party.map(m => m.hp)) + JSON.stringify(G.snap.battle ? G.snap.battle.enemies.map(e => e.hp) : []) + '|bars:' + [...document.querySelectorAll('#party .bar.hp i')].map(i => i.style.width).join(','));
                await sleep(150);
            }
            result.before = before;
            result.distinctDuringPlayback = [...new Set(samples)];
            result.after = JSON.stringify(G.snap.party.map(m => m.hp)) + JSON.stringify(G.snap.battle ? G.snap.battle.enemies.map(e => e.hp) : []);
            result.msg = res.msg;
        }
        if (kind === 'chestpad') {
            act('newDefault');
            G.settings.msgSpeed = 0;
            act('enterDungeon', { id: 1 });
            let n = 0;
            while (n < 20000 && !(G.snap.state === 'Dungeon' && G.snap.dungeon.pendingChest)) {
                if (G.snap.state === 'Battle') { act('autoBattle', { stop: 0 }); n++; continue; }
                if (G.snap.state !== 'Dungeon') { act('newDefault'); act('enterDungeon', { id: 1 }); }
                const r = Math.random();
                act(r < 0.7 ? 'fwd' : r < 0.85 ? 'left' : 'right');
                n++;
            }
            // コントローラーの操作をまねる: A(決定) → 十字キー下 → A
            Nav.usingPad = true;
            primaryDungeonAction();
            await sleep(100);
            resetFocusIfNeeded();
            result.opened = document.getElementById('dialog-title').textContent;
            result.focus0 = Nav.cur && Nav.cur.textContent;
            await sleep(450);
            navMove('down');
            result.focus1 = Nav.cur && Nav.cur.textContent;
            navPress();
            await sleep(100);
            result.dialogOpenAfterPress = Modal.stack.length;
            result.log = G.log.slice(-1);
            // もう一度: 調べる(いちばん上)をAで
            primaryDungeonAction(); await sleep(500); resetFocusIfNeeded();
            result.focus2 = Nav.cur && Nav.cur.textContent;
            navPress(); await sleep(100);
            result.log2 = G.log.slice(-1);
        }
        if (kind === 'chest') {
            act('newDefault');
            G.settings.msgSpeed = 0;
            act('enterDungeon', { id: 1 });
            let n = 0;
            while (n < 20000 && !(G.snap.state === 'Dungeon' && G.snap.dungeon.pendingChest)) {
                if (G.snap.state === 'Battle') { act('autoBattle', { stop: 0 }); n++; continue; }
                if (G.snap.state !== 'Dungeon') { act('newDefault'); act('enterDungeon', { id: 1 }); }
                const r = Math.random();
                act(r < 0.7 ? 'fwd' : r < 0.85 ? 'left' : 'right');
                n++;
            }
            result.steps = n;
            result.pending = G.snap.state === 'Dungeon' && G.snap.dungeon.pendingChest;
            primaryDungeonAction();
            await sleep(50);
            result.dialogTitle = document.getElementById('dialog-title').textContent;
            result.rows = [...document.querySelectorAll('#dialog-body .row')].map(r => r.textContent);
            // 開いた直後の決定は無視される
            const okBtn = [...document.querySelectorAll('#dialog-buttons button')].pop();
            okBtn.click();
            result.stillOpenAtOnce = Modal.stack.length;
            await sleep(500);
            okBtn.click();
            await sleep(50);
            result.afterOk = Modal.stack.length;
            result.log = G.log.slice(-2);
        }
        if (kind === 'dq') {
            act('newDefault');
            G.settings.msgSpeed = 2;
            act('enterDungeon', { id: 1 });
            G.settings.msgSpeed = 0;
            let n = 0;
            while (G.snap.state === 'Dungeon' && n < 4000) {
                const r = Math.random();
                act(r < 0.7 ? 'fwd' : r < 0.85 ? 'left' : 'right');
                if (G.snap.dungeon && G.snap.dungeon.pendingChest) act('abandon');
                n++;
            }
            result.state = G.snap.state;
            G.settings.msgSpeed = 2;
            result.buttons = [...document.querySelectorAll('#actions button')].map(b => b.textContent);
            const cmds = [{ member: 0, kind: 'Attack', enemy: 0 }, { member: 1, kind: 'Defend' }, { member: 2, kind: 'Attack', enemy: 0 }, { member: 3, kind: 'Attack', enemy: 0 }];
            const res = act('round', { commands: cmds });
            result.msg = res.msg;
            const seen = { classes: new Set(), nums: [], imgs: 0 };
            while (G.busy) {
                document.querySelectorAll('#party .pcard').forEach((c, i) => c.classList.forEach(k => { if (k.startsWith('fx-')) seen.classes.add(i + ':' + k); }));
                document.querySelectorAll('.fx-num').forEach(e => seen.nums.push(e.textContent));
                seen.imgs = Math.max(seen.imgs, document.querySelectorAll('.fx-img').length);
                await sleep(60);
            }
            result.partyFxClasses = [...seen.classes];
            result.floatNumbers = [...new Set(seen.nums)];
            result.maxFxImages = seen.imgs;
            result.after = G.snap.state;
        }
        if (kind === 'pace') {
            act('newDefault');
            // 戦闘になるまで、ダンジョンを歩く
            G.settings.msgSpeed = 0;
            act('enterDungeon', { id: 1 });
            let n = 0;
            while (G.snap.state === 'Dungeon' && n < 4000) {
                const r = Math.random();
                act(r < 0.7 ? 'fwd' : r < 0.85 ? 'left' : 'right');
                if (G.snap.dungeon && G.snap.dungeon.pendingChest) act('abandon');
                n++;
            }
            result.walked = n;
            result.state = G.snap.state;
            // 戦闘の1ラウンドを、速さを変えて実行し、表示の間隔を測る
            const speeds = [3, 2, 1, 0];
            result.rounds = [];
            for (const sp of speeds) {
                if (G.snap.state !== 'Battle') break;
                G.settings.msgSpeed = sp;
                const logBefore = G.log.length;
                const t0 = performance.now();
                const stamps = [];
                const origLog = window.logMessage;
                window.logMessage = m => { stamps.push(Math.round(performance.now() - t0)); origLog(m); };
                const res = act('attack');
                const segs = splitMessage(res.msg);
                let busySeen = G.busy;
                while (G.busy) { await sleep(20); }
                window.logMessage = origLog;
                result.rounds.push({ speed: sp, segments: segs.length, busyDuringPlay: busySeen, totalMs: Math.round(performance.now() - t0), lines: G.log.length - logBefore, firstStamps: stamps.slice(0, 6) });
                // 入力が受け付けられないことの確認
            }
            // 宝箱の分割(宝箱を開けた!/中身)
            result.chestSplit = splitMessage('宝箱の罠[毒針]が作動した!鈴木に5ダメージ。 宝箱を開けた!14Gと[銅貨]を手に入れた。');
        }
    } catch (e) {
        result.ok = false;
        result.error = String(e && e.stack || e);
    }
    document.title = 'SELFTEST:' + JSON.stringify(result);
}
