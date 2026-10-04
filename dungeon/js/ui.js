// 画面の部品: パーティ・持ち物などの表示、ダイアログ(選ぶ・確認・メッセージ)。DOMを作る小さな関数 h() を使う。
'use strict';

const $ = id => document.getElementById(id);

// h('div', {class:'row', onclick: fn}, 子要素や文字...) でDOMを作る
function h(tag, attrs, ...children) {
    const e = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs || {})) {
        if (v === undefined || v === null || v === false) continue;
        if (k === 'class') e.className = v;
        else if (k.startsWith('on') && typeof v === 'function') e.addEventListener(k.slice(2), v);
        else if (k === 'html') e.innerHTML = v;
        else e.setAttribute(k, v === true ? '' : (k === 'title' || k === 'placeholder' || k === 'aria-label') ? T(String(v)) : v);
    }
    for (const c of children.flat()) {
        if (c === null || c === undefined || c === false) continue;
        e.append(c.nodeType ? c : document.createTextNode(T(String(c))));
    }
    return e;
}

const icon = name => h('img', { class: 'ic', src: A.uiUrl(name), alt: '' });
const itemIcon = id => h('img', { class: 'ic', src: A.itemUrl(id), alt: '', onerror: e => { e.target.style.visibility = 'hidden'; } });

// ---------- ダイアログ ----------
const Modal = { stack: [], };

// 1つのダイアログを開く。戻り値のPromiseは、閉じたときに、押したボタンの value で解決する(Escなら null)。
function dialog({ title, body, buttons, wide, className }) {
    return new Promise(resolve => {
        const entry = { resolve, title, body, buttons, wide, className };
        Modal.stack.push(entry);
        renderModal();
    });
}

function closeDialog(value) {
    const entry = Modal.stack.pop();
    renderModal();
    if (entry) entry.resolve(value === undefined ? null : value);
}

function closeAllDialogs() {
    while (Modal.stack.length) { const e = Modal.stack.pop(); e.resolve(null); }
    renderModal();
}

// ダイアログが開いた直後の短い間は、クリック(コントローラーの決定を含む)を受け付けない。前の決定の連打が、次のダイアログを勝手に決めるのを防ぐ
Modal.guardUntil = 0;
Modal.lastTop = null;
document.addEventListener('click', e => {
    if (performance.now() < Modal.guardUntil && e.target.closest && e.target.closest('#modal')) { e.stopPropagation(); e.preventDefault(); }
}, true);

function renderModal() {
    const top = Modal.stack[Modal.stack.length - 1];
    if (top && top !== Modal.lastTop) Modal.guardUntil = performance.now() + 400;
    Modal.lastTop = top || null;
    const root = $('modal');
    if (!top) { root.hidden = true; document.body.classList.remove('modal-open'); requestFocusReset(); return; }
    root.hidden = false;
    document.body.classList.add('modal-open');
    $('dialog').style.width = top.wide ? 'min(96vw, 980px)' : '';
    $('dialog-title').textContent = T(top.title || '');
    $('dialog-title').hidden = !top.title;
    const body = $('dialog-body');
    body.replaceChildren();
    const content = typeof top.body === 'function' ? top.body() : top.body;
    if (content) body.append(content.nodeType ? content : document.createTextNode(String(content)));
    const bar = $('dialog-buttons');
    bar.replaceChildren();
    for (const b of top.buttons || []) {
        const btn = h('button', { class: b.cls || '', disabled: b.disabled, onclick: () => { SND.play('ui'); if (b.onClick) b.onClick(); else closeDialog(b.value); } }, b.text);
        bar.append(btn);
    }
    requestFocusReset();
}

// 中身を作り直す(選択の状態が変わったときなど)
function updateModal() { renderModal(); }

function messageBox(title, text, okText = '閉じる') {
    return dialog({ title, body: h('div', { class: 'msg' }, text), buttons: [{ text: okText, value: true, cls: 'primary' }] });
}

async function confirmBox(title, text, yes = 'はい', no = 'いいえ') {
    const r = await dialog({ title, body: h('div', { class: 'msg' }, text), buttons: [{ text: no, value: false }, { text: yes, value: true, cls: 'primary' }] });
    return r === true;
}

// 一覧から1つ選ぶ。items: [{id, label, sub, icon(itemId), uiIcon, price, disabled, face}]。選んだ id か null を返す。
function pickDialog(title, items, { note, okText = '選ぶ', wide } = {}) {
    if (!items.length) return Promise.resolve(null);
    let sel = 0;
    const list = h('div', { class: 'list' });
    const rows = [];
    const build = () => {
        list.replaceChildren();
        rows.length = 0;
        items.forEach((it, i) => {
            // タッチ・マウスは「1回目で選ぶ、2回目で決める」。コントローラー・キーボードは、十字キーで選んでいるので、決定1回で決める
            const row = h('div', {
                class: 'row' + (i === sel ? ' sel' : '') + (it.disabled ? ' disabled' : ''),
                onclick: () => { if (it.disabled) return; if (sel === i || Nav.usingPad) { closeDialog(it.id); } else { sel = i; build(); if (Nav.usingPad) setFocus(rows[sel]); } },
            },
                it.face ? h('img', { class: 'ic', src: it.face, alt: '' }) : it.icon ? itemIcon(it.icon) : it.uiIcon ? icon(it.uiIcon) : null,
                h('div', { class: 'grow' }, h('div', {}, it.label), it.sub ? h('div', { class: 'sub' }, it.sub) : null),
                it.price !== undefined ? h('div', { class: 'price' }, it.price + 'G') : null);
            rows.push(row);
            list.append(row);
        });
    };
    build();
    const body = h('div', {}, note ? h('div', { class: 'note', style: 'margin-bottom:6px' }, note) : null, list);
    return dialog({
        title, body: () => body, wide,
        buttons: [
            { text: 'やめる', value: null },
            { text: okText, cls: 'primary', onClick: () => { const shown = rows.findIndex(r => r.classList.contains('sel')); const it = items[shown >= 0 ? shown : sel]; if (it && !it.disabled) closeDialog(it.id); } },
        ],
    });
}

// ---------- 画面の部品 ----------
function hpClass(hp, max) { return max > 0 && hp / max < 0.3 ? 'bar hp low' : 'bar hp'; }

// 冒険者のカードに演出を出す。kind: hit=攻撃を受けた(赤い点滅・-数字・揺れ) / heal=回復 / levelup・buff=金 / guard=ぼうぎょ / act=これから行動(金の枠)
function partyFx(index, kind, amount = 0, fxName = null) {
    if (G.settings.effects === 'off') return;
    const card = document.querySelectorAll('#party .pcard')[index];
    if (!card) return;
    const ms = G.settings.effects === 'fast' ? 450 : 900;
    card.style.setProperty('--fx-ms', ms + 'ms');
    card.classList.remove('fx-hit', 'fx-heal', 'fx-guard', 'fx-act', 'fx-levelup', 'fx-buff');
    void card.offsetWidth;   // アニメーションを、最初からやり直す
    card.classList.add('fx-' + kind);
    if (amount > 0 && (kind === 'hit' || kind === 'heal')) {
        const num = h('span', { class: 'fx-num ' + kind }, (kind === 'hit' ? '-' : '+') + amount);
        card.append(num);
        setTimeout(() => num.remove(), ms);
    }
    if (fxName) {
        const img = h('img', { class: 'fx-img', src: `img/fx/${fxName}.webp`, alt: '' });
        card.append(img);
        setTimeout(() => img.remove(), ms);
    }
    setTimeout(() => card.classList.remove('fx-' + kind), ms + 50);
}

function renderParty() {
    const s = G.snap;
    const box = $('party');
    box.replaceChildren();
    if (!s || !s.party) return;
    for (const m of s.party) {
        const card = h('div', { class: 'pcard' + (m.down ? ' down' : ''), onclick: () => showSheet(m.i) },
            h('img', { src: m.face, alt: '' }),
            h('div', {},
                h('div', { class: 'nm' }, m.name, ' ', h('small', {}, `Lv${m.level} ${m.job}`), (m.i === 0 && G.snap.title) ? h('small', { class: 'title-badge' }, ` ★${G.snap.title}`) : ''),
                h('div', { class: hpClass(m.hp, m.maxHp) }, h('i', { style: `width:${m.maxHp ? Math.max(0, m.hp / m.maxHp * 100) : 0}%` }), h('span', { class: 'num' }, `HP ${m.hp}/${m.maxHp}`)),
                h('div', { class: 'bar mp' }, h('i', { style: `width:${m.maxMp ? Math.max(0, m.mp / m.maxMp * 100) : 0}%` }), h('span', { class: 'num' }, `MP ${m.mp}/${m.maxMp}`))));
        card.title = `${m.name} HP${m.hp}/${m.maxHp} MP${m.mp}/${m.maxMp}`;
        box.append(card);
    }
}

// 冒険者カードのHP・MPのバーだけを書き換える(カードを作り直さないので、被弾などの演出は消えない)
function updatePartyBars() {
    const s = G.snap;
    if (!s || !s.party) return;
    document.querySelectorAll('#party .pcard').forEach((card, i) => {
        const m = s.party[i];
        if (!m) return;
        const hp = card.querySelector('.bar.hp'), hpBar = hp && hp.querySelector('i'), mpBar = card.querySelector('.bar.mp i');
        if (hp) hp.className = hpClass(m.hp, m.maxHp);
        if (hpBar) hpBar.style.width = `${m.maxHp ? Math.max(0, m.hp / m.maxHp * 100) : 0}%`;
        if (mpBar) mpBar.style.width = `${m.maxMp ? Math.max(0, m.mp / m.maxMp * 100) : 0}%`;
        const hpNum = card.querySelector('.bar.hp .num'), mpNum = card.querySelector('.bar.mp .num');
        if (hpNum) hpNum.textContent = `HP ${m.hp}/${m.maxHp}`;
        if (mpNum) mpNum.textContent = `MP ${m.mp}/${m.maxMp}`;
        card.classList.toggle('down', !!m.down || m.hp <= 0);
        const small = card.querySelector('.nm small');
        if (small) small.textContent = T(`Lv${m.level} ${m.job}`);
        card.title = `${m.name} HP${m.hp}/${m.maxHp} MP${m.mp}/${m.maxMp}`;
    });
}

function renderResource() {
    const s = G.snap;
    const box = $('resource');
    box.replaceChildren();
    if (!s) return;
    const place = s.state === 'Town' ? (G.facility ? G.facility.name : 'ルミナス街') : s.dungeon ? `${s.dungeon.name} ${s.dungeon.floor}階` : '';
    box.append(h('span', {}, place), h('span', {}, '💰', h('b', {}, s.gold + 'G')), h('span', {}, '🍞', h('b', {}, s.satiety)));
    if (s.hell) box.append(h('span', { class: 'hell-badge', title: 'ヘルモード(敵が強い・全滅の代償が重い。経験値とゴールド1.5倍)' }, '🔥', h('b', {}, 'HELL')));
    const d = s.dungeon;
    if (d && s.state !== 'Town') {
        box.append(h('span', { class: d.night ? 'night' : '', title: d.night ? `夜明けまで${d.dayChangeIn}歩` : `夜まで${d.dayChangeIn}歩` }, d.night ? '🌙' : '☀', h('b', {}, d.night ? '夜' : '昼')));
        if (d.keys > 0) box.append(h('span', { title: '小さな鍵' }, '🗝', h('b', {}, d.keys)));
    }
}

function renderLog() {
    const last = G.log.slice(-3);
    $('log-text').textContent = T(last.join('\n')) || '';
    $('log').style.display = last.length ? '' : 'none';
}

function showFullLog() {
    dialog({
        title: 'ログ', wide: true,
        body: () => { const box = h('div', { class: 'msg' }, T(G.log.slice(-60).join('\n\n'))); setTimeout(() => { box.parentElement && (box.parentElement.scrollTop = 1e9); }, 0); return box; },
        buttons: [{ text: '閉じる', value: true, cls: 'primary' }],
    });
}

function renderActions() {
    const s = G.snap;
    const box = $('actions');
    box.replaceChildren();
    box.className = s && s.state === 'Town' ? 'town' : '';
    if (!s || s.state === 'Title') return;
    for (const a of buildActions()) {
        const btn = h('button', { class: 'abtn' + (a.cls ? ' ' + a.cls : ''), disabled: a.disabled, onclick: () => { SND.unlock(); SND.play('ui'); a.onClick(); } },
            a.icon ? icon(a.icon) : null, a.img ? h('img', { class: 'ic', src: a.img, alt: '' }) : null, a.itemIcon ? itemIcon(a.itemIcon) : null,
            h('span', {}, a.label, a.sub ? h('small', {}, a.sub) : null));
        if (a.onHover) { btn.addEventListener('pointerenter', a.onHover); btn.addEventListener('focus', a.onHover); }
        box.append(btn);
    }
}

function renderDpad() {
    const s = G.snap;
    $('dpad').hidden = !(s && s.state === 'Dungeon');
}

// 画面全体を、いまの状態(G.snap)に合わせて描き直す
function refresh() {
    const s = G.snap;
    const inGame = s && s.state !== 'Title';
    if (s && s.state !== 'Town') G.facility = null;
    $('title').hidden = !!inGame;
    $('main').hidden = !inGame;
    if (inGame) {
        renderParty(); renderResource(); renderLog(); renderDpad(); renderActions();
    }
    if (typeof updateMusic === 'function') updateMusic();
    requestRedraw();
    requestFocusReset();
}
