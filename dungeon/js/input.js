// 入力: キーボード、ゲームパッド(コントローラー)、タッチ(十字ボタン・スワイプ)。
// ゲームパッドの読み方は、1980s GALAXY SHOOTER の readGamepad(Gamepad API、標準マッピング)と同じ。
// ダイアログや、ボタンの並ぶ画面では、十字キー・スティックで項目を選び(フォーカス移動)、Aで決定、Bで戻る。
'use strict';

const Nav = { cur: null, reset: true, usingPad: false };

function requestFocusReset() { Nav.reset = true; }

function visible(el) { const r = el.getBoundingClientRect(); return r.width > 0 && r.height > 0 && getComputedStyle(el).visibility !== 'hidden'; }

// いま、十字キーで選べる項目
function navElements() {
    const modalOpen = !$('modal').hidden;
    let root;
    if (modalOpen) root = $('modal');
    else if (!$('title').hidden) root = $('title');
    else root = $('main');
    let els;
    if (!modalOpen && root === $('main')) {
        els = [...$('actions').querySelectorAll('button:not(:disabled)'), ...(G.snap && G.snap.state === 'Dungeon' ? [] : []), $('btn-menu')];
    } else {
        els = [...root.querySelectorAll('button:not(:disabled), .row:not(.disabled), .chip:not(.disabled), input')];
    }
    return els.filter(visible);
}

function setFocus(el) {
    if (Nav.cur) Nav.cur.classList.remove('focus');
    Nav.cur = el;
    // 一覧の行にフォーカスが来たら、見た目の選択(sel)も移す
    if (el && el.classList.contains('row') && el.parentElement) {
        for (const r of el.parentElement.children) r.classList.toggle('sel', r === el);
    }
    if (el && Nav.usingPad) { el.classList.add('focus'); el.scrollIntoView({ block: 'nearest', inline: 'nearest' }); }
}

function resetFocusIfNeeded() {
    if (!Nav.reset) return;
    Nav.reset = false;
    const els = navElements();
    if (!els.length) { setFocus(null); return; }
    const keep = Nav.cur && els.includes(Nav.cur) ? Nav.cur : null;
    setFocus(keep || els.find(e => e.classList.contains('primary') || e.classList.contains('sel')) || els[0]);
}

function navMove(dir) {
    Nav.usingPad = true;
    const els = navElements();
    if (!els.length) return;
    if (!Nav.cur || !els.includes(Nav.cur)) { setFocus(els[0]); return; }
    const c = Nav.cur.getBoundingClientRect(), cx = c.left + c.width / 2, cy = c.top + c.height / 2;
    let best = null, bestScore = Infinity;
    for (const el of els) {
        if (el === Nav.cur) continue;
        const r = el.getBoundingClientRect(), x = r.left + r.width / 2, y = r.top + r.height / 2;
        const dx = x - cx, dy = y - cy;
        const along = dir === 'up' ? -dy : dir === 'down' ? dy : dir === 'left' ? -dx : dx;
        if (along <= 4) continue;
        const perp = dir === 'up' || dir === 'down' ? Math.abs(dx) : Math.abs(dy);
        const score = along + perp * 2.2;
        if (score < bestScore) { bestScore = score; best = el; }
    }
    if (best) setFocus(best);
    SND.play('ui');
}

function navPress() {
    Nav.usingPad = true;
    const el = Nav.cur && document.body.contains(Nav.cur) ? Nav.cur : null;
    if (!el) { resetFocusIfNeeded(); return; }
    if (el.tagName === 'INPUT') { el.focus(); return; }
    el.click();
}

function goBack() {
    if (Modal.stack.length) { closeDialog(null); return; }
    if (G.facility) { leaveFacility(); return; }
    if (G.snap && G.snap.state !== 'Title') showMenu();
}

// ---------- ダンジョンの操作(まとめ) ----------
function dungeonMode() { return G.snap && G.snap.state === 'Dungeon' && !Modal.stack.length && !$('main').hidden; }

const DIR_CMD = { up: 'fwd', left: 'left', right: 'right', down: 'around' };

// ---------- キーボード ----------
window.addEventListener('keydown', e => {
    if (e.target && e.target.tagName === 'INPUT' && e.key !== 'Escape' && e.key !== 'Enter') return;
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    SND.unlock();
    const k = e.key;
    const dirKey = { ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right' }[k];
    const wasd = { w: 'up', s: 'down', a: 'left', d: 'right', W: 'up', S: 'down', A: 'left', D: 'right' }[k];
    if (dungeonMode()) {
        const d = dirKey || wasd;
        if (d) { moveCmd(DIR_CMD[d]); e.preventDefault(); return; }
        if (k === 'Enter' || k === ' ') { primaryDungeonAction(); e.preventDefault(); return; }
        if (k === 'm' || k === 'M') { showMap(); e.preventDefault(); return; }
        if (k === 'i' || k === 'I') { useItemFlow(); e.preventDefault(); return; }
        if (k === 'Escape' || k === 'Tab') { showMenu(); e.preventDefault(); return; }
        return;
    }
    if (dirKey) { navMove(dirKey); e.preventDefault(); return; }
    if (k === 'Enter' || k === ' ') { if (e.target && e.target.tagName === 'INPUT') return; navPress(); e.preventDefault(); return; }
    if (k === 'Escape') { goBack(); e.preventDefault(); }
});

// ---------- ゲームパッド(Gamepad API。標準マッピング) ----------
const PAD = { prev: {}, held: {}, repeat: {} };

function padButtons(gp) {
    const B = i => !!(gp.buttons[i] && gp.buttons[i].pressed);
    const ax = gp.axes[0] || 0, ay = gp.axes[1] || 0;
    return {
        a: B(0), b: B(1), x: B(2), y: B(3), lb: B(4), rb: B(5), lt: B(6), rt: B(7), back: B(8), start: B(9),
        up: B(12) || ay < -0.6, down: B(13) || ay > 0.6, left: B(14) || ax < -0.6, right: B(15) || ax > 0.6,
    };
}

function pollGamepad(now) {
    const pads = navigator.getGamepads ? Array.from(navigator.getGamepads()) : [];
    const gp = pads.find(p => p && p.connected);
    if (!gp) return;
    const cur = padButtons(gp);
    const edge = k => cur[k] && !PAD.prev[k];
    // 方向は、押し続けると繰り返す(最初は0.35秒後、その後は0.13秒ごと)
    const dirFire = k => {
        if (!cur[k]) { PAD.repeat[k] = 0; return false; }
        if (!PAD.prev[k]) { PAD.repeat[k] = now + 350; return true; }
        if (now >= PAD.repeat[k]) { PAD.repeat[k] = now + 130; return true; }
        return false;
    };
    const any = Object.values(cur).some(Boolean);
    if (any) { Nav.usingPad = true; SND.unlock(); document.body.classList.add('pad'); }

    if (dungeonMode()) {
        for (const d of ['up', 'left', 'right', 'down']) if (dirFire(d)) moveCmd(DIR_CMD[d]);
        if (edge('a')) primaryDungeonAction();
        if (edge('x')) showMap();
        if (edge('y') || edge('start')) showMenu();
        if (edge('lb')) moveCmd('left');
        if (edge('rb')) moveCmd('right');
        if (edge('lt')) act('autoStairs');
        if (edge('rt')) act('investigate');
    } else {
        for (const d of ['up', 'left', 'right', 'down']) if (dirFire(d)) navMove(d);
        if (edge('a')) navPress();
        if (edge('b')) goBack();
        if (edge('start') && !Modal.stack.length && G.snap && G.snap.state !== 'Title') showMenu();
        if (edge('lb') || edge('rb')) { /* 予約: 仲間の切り替えなど */ }
    }
    PAD.prev = cur;
}

// ---------- タッチ: 十字ボタン(押し続けると繰り返す) ----------
function initTouch() {
    for (const b of document.querySelectorAll('#dpad button')) {
        let timer = null;
        const fire = () => moveCmd(DIR_CMD[b.dataset.dir]);
        b.addEventListener('pointerdown', e => {
            e.preventDefault();
            SND.unlock();
            b.setPointerCapture && b.setPointerCapture(e.pointerId);
            fire();
            if (b.dataset.dir === 'up') timer = setTimeout(function rep() { fire(); timer = setTimeout(rep, 170); }, 380);
        });
        const stop = () => { clearTimeout(timer); timer = null; };
        b.addEventListener('pointerup', stop); b.addEventListener('pointercancel', stop); b.addEventListener('pointerleave', stop);
    }

    // 画面のスワイプ: 上=前進、下=後ろを向く、左右=向きを変える
    const scene = $('scene');
    let start = null;
    scene.addEventListener('pointerdown', e => { start = { x: e.clientX, y: e.clientY, t: performance.now() }; SND.unlock(); });
    scene.addEventListener('pointerup', e => {
        if (!start) return;
        const dx = e.clientX - start.x, dy = e.clientY - start.y, dt = performance.now() - start.t;
        start = null;
        if (dt > 700 || !dungeonMode()) return;
        if (Math.max(Math.abs(dx), Math.abs(dy)) < 40) return;
        if (Math.abs(dy) > Math.abs(dx)) moveCmd(dy < 0 ? 'fwd' : 'around');
        else moveCmd(dx < 0 ? 'left' : 'right');
    });
    scene.addEventListener('pointercancel', () => { start = null; });

    // iOS: ピンチ拡大・ダブルタップ拡大を防ぐ / 最初の操作で音を有効にする
    document.addEventListener('gesturestart', e => e.preventDefault());
    let lastTouch = 0;
    document.addEventListener('touchend', e => { const now = Date.now(); if (now - lastTouch < 300) e.preventDefault(); lastTouch = now; SND.unlock(); }, { passive: false });
    for (const ev of ['click', 'pointerup']) window.addEventListener(ev, () => SND.unlock(), { passive: true });
    document.addEventListener('contextmenu', e => e.preventDefault());
}

function initInput() {
    initTouch();
    window.addEventListener('pointerdown', () => { Nav.usingPad = false; document.body.classList.remove('pad'); if (Nav.cur) Nav.cur.classList.remove('focus'); }, { passive: true });
    window.addEventListener('gamepadconnected', e => { toast('コントローラーを接続しました'); Nav.usingPad = true; rumble(0.4, 0.4, 150); requestFocusReset(); });
    window.addEventListener('gamepaddisconnected', () => toast('コントローラーが切れました'));
    const loop = now => { pollGamepad(now); resetFocusIfNeeded(); requestAnimationFrame(loop); };
    requestAnimationFrame(loop);
    $('btn-menu').addEventListener('click', () => { SND.unlock(); showMenu(); });
    $('log').addEventListener('click', showFullLog);
}
