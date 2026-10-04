// カジノのスロットの演出(2026-10-01)。ルールと結果はC#(CasinoGames.SlotRound)が決め、ここは絵と音で見せるだけ。
// 昔の実機の演出: ペカ(ランプ点灯)・リール遅れ・消灯・フリーズ・逆回転・虹(プレミアム)・テンパイ音・7揃いの役物(王冠)。
// 今どきのスマスロ風の演出: 押し順ナビ・前兆のステップアップ予告+セリフ予告・群予告・カットイン・連続演出(バトル)・
//   チャンスアップの色(白<青<緑<赤<金<虹)・7揃いの上乗せ特化ゾーン(枚数がカウントアップ)。
'use strict';

// C#の CasinoGames.SlotSymbols の並びと同じ(0=7, 1=BAR, 2=ベル, 3=スイカ, 4=さくらんぼ, 5=レモン)
const SLOT_FACE = ['7', 'BAR', '🔔', '🍉', '🍒', '🍋'];
const SLOT_CLS = ['s7', 'sbar', 'sbell', 'smelon', 'scherry', 'slemon'];
const SLOT_KIND = ['SYM_7', 'SYM_BAR', 'SYM_BELL', 'SYM_MELON', 'SYM_CHERRY', 'SYM_LEMON'];
let SLOT_IMG_OK = null;   // 絵が読めなかったら false(文字・絵文字の表示に切り替える)
const SLOT_COLOR = { White: '#e8e8e8', Blue: '#4aa8ff', Green: '#5fe07a', Red: '#ff4a4a', Gold: '#ffd040', Rainbow: 'rainbow' };
const SLOT_COLOR_NAME = { White: '白', Blue: '青', Green: '緑', Red: '赤', Gold: '金', Rainbow: '虹' };
const SLOT_SWARM = ['👹', '🐉', '💀', '👻', '🦇'];
const SLOT_NAVI = ['①', '②', '③'];

const slotSleep = ms => new Promise(r => setTimeout(r, ms));

// 1回まわす。賭けが成立しなかったとき(コイン不足など)は、メッセージだけ出す。
async function slotFlow() {
    if (G.busy) return;
    const res = api('casinoSlot');
    const d = res.data;
    if (!d) { logMessage(res.msg); refresh(); return; }
    await playSlot(d, res.msg);
    logMessage(res.msg);
    refresh();
}

async function playSlot(d, msg) {
    const sp = { fast: false, done: false };
    const show = d.show || { stopOrder: [0, 1, 2], stepUp: 0, stepColors: [], zone: [] };
    const mk = (tag, cls, txt) => { const e = document.createElement(tag); if (cls) e.className = cls; if (txt !== undefined) e.textContent = txt; return e; };
    const root = mk('div', 'slot-root');
    const box = mk('div', 'slot-box');
    { const c = betChip(d.bet); if (c) box.append(c); }   // いまの賭け金のチップ(Codex納品の絵)
    // スロット機械: Codexの絵(img/mg/MACHINE_FRAME.webp 1280x1440)の窓に合わせて、リール・ランプ・表示を重ねる。
    // 位置は、絵の中の座標(1280x1440)を%にしたもの。機械は 8:9 の箱で、その中に絶対位置で並べる。
    const machine = mk('div', 'slot-machine');
    const frameImg = mk('img', 'm-frame'); frameImg.alt = ''; frameImg.draggable = false; frameImg.src = 'img/mg/MACHINE_FRAME.webp';
    const REEL_X = [220, 506, 794], REEL_W = [266, 268, 266];
    const pos = (el, x, y, w, h) => { el.style.left = (x / 12.8) + '%'; el.style.top = (y / 14.4) + '%'; el.style.width = (w / 12.8) + '%'; if (h) el.style.height = (h / 14.4) + '%'; return el; };
    // GO!GO!ランプ: Codexの絵(img/mg/LAMP_*.webp)があれば絵で、読めなければ文字と色で代用する(機械の上の表示窓に置く)
    const lamp = mk('div', 'slot-lamp withimg');
    const lampImg = mk('img', 'lamp-img');
    lampImg.alt = 'GO!GO!'; lampImg.draggable = false; lampImg.src = 'img/mg/LAMP_OFF.webp';
    lampImg.onerror = () => { lamp.classList.remove('withimg'); lampImg.remove(); lamp.textContent = 'GO!GO!'; };
    lamp.append(lampImg);
    pos(lamp, 430, 174, 417, 138);
    const navi = mk('div', 'slot-navi');
    const steps = mk('div', 'slot-steps');
    for (let i = 0; i < 4; i++) { const st = mk('div', 'step'); st.append(mk('i', '', String(i + 1))); steps.append(st); }
    pos(steps, 380, 128, 520, 40);
    const say = pos(mk('div', 'slot-say', ''), 150, 1215, 980, 70);
    const banner = pos(mk('div', 'slot-banner', ''), 150, 1090, 980, 120);
    const win = machine;
    const reels = [0, 1, 2].map(i => {
        const r = pos(mk('div', 'slot-reel'), REEL_X[i], 400, REEL_W[i], 502);
        const cells = [mk('div', 'cell'), mk('div', 'cell mid'), mk('div', 'cell')];
        cells.forEach(c => r.append(c));
        machine.append(r);
        const n = pos(mk('span', '', ''), REEL_X[i], 322, REEL_W[i], 70);
        navi.append(n);
        return { el: r, cells, spinning: false };
    });
    machine.append(frameImg);
    const payline = pos(mk('img', 'm-payline'), 220, 650 - 16, 839, 32);
    payline.alt = ''; payline.draggable = false; payline.src = 'img/mg/PAYLINE.webp';
    machine.append(payline, lamp, steps, navi, banner, say);
    const result = mk('div', 'slot-result', '');
    const btns = mk('div', 'slot-btns');
    const fx = mk('div', 'slot-fx');
    box.append(machine, result, btns);
    root.append(box, fx);
    document.body.append(root);
    root.addEventListener('click', e => { if (!sp.done && !e.target.closest('button')) sp.fast = true; });   // 画面をタップすると、演出を早送り
    const wait = ms => slotSleep(sp.fast ? Math.min(ms, 60) : ms);
    const rnd = () => (SLOT_FACE.length * Math.random()) | 0;
    // 絵柄: Codexの絵(img/mg/SYM_*.webp)があれば絵で、無ければ文字・絵文字で出す
    const setCell = (cell, idx) => {
        const base = cell.className.split(' ').filter(c => c === 'cell' || c === 'mid').join(' ');
        if (cell.dataset.idx === String(idx)) return;
        cell.dataset.idx = idx;
        if (SLOT_IMG_OK !== false) {
            const img = document.createElement('img');
            img.className = 'sym'; img.alt = SLOT_FACE[idx]; img.draggable = false;
            img.src = `img/mg/${SLOT_KIND[idx]}.webp`;
            img.onerror = () => { SLOT_IMG_OK = false; cell.replaceChildren(); cell.textContent = SLOT_FACE[idx]; cell.className = base + ' ' + SLOT_CLS[idx]; };
            cell.className = base + ' withimg';
            cell.replaceChildren(img);
        } else {
            cell.textContent = SLOT_FACE[idx];
            cell.className = base + ' ' + SLOT_CLS[idx];
        }
    };
    reels.forEach(r => r.cells.forEach(c => setCell(c, rnd())));
    const spinTimer = setInterval(() => reels.forEach(r => { if (r.spinning) r.cells.forEach(c => setCell(c, rnd())); }), 70);
    const cues = d.cues || [];
    const has = c => cues.includes(c);
    const rainbow = has('Rainbow');
    const lampOn = () => { lamp.classList.add('on'); if (rainbow) lamp.classList.add('rainbow'); lampImg.src = `img/mg/${rainbow ? 'LAMP_RAINBOW' : 'LAMP_ON'}.webp`; SND.play('pika'); slotVibrate(30); };
    const sayBanner = t => { banner.textContent = t; banner.classList.remove('pop'); void banner.offsetWidth; banner.classList.add('pop'); };
    const colorStyle = (el, c) => { el.classList.toggle('rainbow-bg', c === 'Rainbow'); el.style.background = c === 'Rainbow' ? '' : (SLOT_COLOR[c] || ''); };
    // カットインの帯は、色ごとの絵(2026-10-02 Codex納品)。絵が読めなければ、従来の色の帯
    const bandStyle = (el, c) => { el.classList.remove('rainbow-bg'); el.style.background = 'none'; el.classList.add('band'); el.style.backgroundImage = `url(img/mg/BAND_${String(c).toUpperCase()}.webp)`; if (['Blue', 'Red', 'Green'].includes(c)) el.classList.add('lightText'); };

    // ---- 押し順ナビ: 停止する順番を、リールの上に表示する(今どきのスマスロの押し順ナビ)
    const order = show.stopOrder || [0, 1, 2];
    order.forEach((reelIdx, n) => { const im = mk('img', ''); im.alt = SLOT_NAVI[n]; im.draggable = false; im.src = `img/mg/NAVI_${n + 1}.webp`; im.onerror = () => { navi.children[reelIdx].textContent = SLOT_NAVI[n]; }; navi.children[reelIdx].replaceChildren(im); });

    // ---- レバーON
    SND.play('reelstart');
    reels.forEach(r => { r.spinning = true; r.el.classList.add('spin'); });
    // ペカ(ランプ点灯)のタイミングは、レバーON・第1停止・第3停止のどれか(実機の先告知・後告知にならう)
    const lampAt = has('GoGoLamp') || rainbow ? ['lever', 'first', 'last'][(Math.random() * 3) | 0] : null;
    if (lampAt === 'lever') { await wait(250); lampOn(); }

    if (has('Freeze')) {                 // フリーズ: 全リールが固まって、静まり返る
        await wait(500);
        reels.forEach(r => { r.spinning = false; r.el.classList.remove('spin'); });
        root.classList.add('freeze');
        sayBanner('…………');
        await wait(1600);
        root.classList.remove('freeze');
        SND.play('freezeend');
        sayBanner(rainbow ? 'RAINBOW!!' : 'FREEZE!');
        reels.forEach(r => { r.spinning = true; r.el.classList.add('spin'); });
        await wait(500);
    }
    if (has('Reverse')) {                // 逆回転
        sayBanner('REVERSE!');
        reels.forEach(r => r.el.classList.add('rev'));
        SND.play('magic');
        await wait(1000);
        reels.forEach(r => r.el.classList.remove('rev'));
    }
    if (has('Blackout')) {               // 消灯: リールのバックライトが消える
        box.classList.add('dark');
        SND.play('dim');
    }
    await wait(700);

    // ---- 前兆: ステップアップ予告(段ごとに色が付く)+セリフ予告
    if (show.stepUp > 0) {
        for (let i = 0; i < show.stepUp; i++) {
            const c = show.stepColors[i] || 'White';
            const pill = steps.children[i];
            pill.classList.add('lit'); colorStyle(pill.firstChild, c);
            SND.play(c === 'White' ? 'ui' : 'pika');
            await wait(520);
        }
        if (show.line) { say.textContent = `「${show.line}」`; say.classList.remove('pop'); void say.offsetWidth; say.classList.add('pop'); }
        await wait(700);
    }
    // ---- 群予告: 魔物の群れが、画面いっぱいを走り抜ける(大きな魔物の絵)
    if (show.swarm) {
        sayBanner('SWARM!');
        await slotSwarm(fx, wait);
    }
    // ---- カットイン
    if (show.cutIn) {
        const ci = mk('div', 'slot-cutin', '');
        const name = (G.snap && G.snap.party && G.snap.party.length ? G.snap.party[(Math.random() * G.snap.party.length) | 0].name : '冒険者');
        ci.append(mk('div', 'who', name), mk('div', 'word', show.cutInText));
        bandStyle(ci, show.cutIn);
        fx.append(ci);
        SND.play(show.cutIn === 'Rainbow' || show.cutIn === 'Gold' ? 'fanfare' : 'crit');
        slotVibrate(show.cutIn === 'Rainbow' ? [40, 30, 40, 30, 80] : 30);
        await wait(1500);
        ci.remove();
    }
    // ---- 連続演出(バトル): ダンジョンと同じ戦闘画面で戦う。勝てば7揃いの告知
    if (show.foe) {
        await slotBattle(root, show, wait);
    }

    const stop = async (i, extra = 0) => {
        if (extra) await wait(extra);
        const r = reels[i];
        r.spinning = false; r.el.classList.remove('spin');
        setCell(r.cells[1], d.reels[i]); setCell(r.cells[0], rnd()); setCell(r.cells[2], rnd());
        navi.children[i].textContent = '';
        r.el.classList.add('stopped'); setTimeout(() => r.el.classList.remove('stopped'), 200);
        SND.play('reelstop'); slotVibrate(10);
    };
    await stop(order[0]);
    if (!has('Delay')) box.classList.remove('dark');
    if (lampAt === 'first') lampOn();
    await stop(order[1], 480);
    // テンパイ(先に止めた2つが同じ絵): 最後のリールの停止が遅れ、テンパイ音が鳴る
    const tempai = d.reels[order[0]] === d.reels[order[1]];
    if (tempai) {
        root.classList.add('tempai'); SND.play('tempai'); sayBanner(d.reels[order[0]] === 0 ? '7 TENPAI!' : 'TENPAI…');
        if (d.reels[order[0]] === 0) { const t = document.createElement('img'); t.className = 'slot-tenpai'; t.alt = ''; t.draggable = false; t.src = 'img/mg/LOGO_TEMPAI_EN.webp'; t.onerror = () => t.remove(); fx.append(t); setTimeout(() => t.remove(), 1800); }
    }
    let extra = 520;
    if (tempai) extra += 900;
    if (has('Delay')) { extra += 1100; sayBanner('DELAY…!?'); }
    await stop(order[2], extra);
    root.classList.remove('tempai');
    box.classList.remove('dark');
    if (lampAt === 'last') { await wait(300); lampOn(); }

    // ---- 結果
    clearInterval(spinTimer);
    await wait(250);
    if (d.tripleSeven) {
        sayBanner('BIG BONUS!!');
        { const logo = document.createElement('img'); logo.className = 'slot-biglogo'; logo.alt = ''; logo.draggable = false; logo.src = 'img/mg/LOGO_BIG_BONUS.webp'; logo.onerror = () => logo.remove(); fx.append(logo); setTimeout(() => logo.remove(), 2600); }
        win.classList.add('flash-big');
        yakumono(fx);
        SND.play('fanfare'); slotVibrate([60, 40, 60, 40, 120]);
        await wait(2000);
        await playZone(fx, show.zone || [], d.payout, wait, sayBanner);
    } else if (d.triple) {
        sayBanner('JACKPOT!');
        win.classList.add('flash');
        coinRain(fx, 14); SND.play('win'); slotVibrate(40);
        await wait(1200);
    } else if (d.pair) {
        sayBanner('CHANCE…');
        win.classList.add('flash');
        SND.play('item');
        await wait(500);
    } else {
        sayBanner(show.foe || show.cutIn || cues.length ? 'FAKE…MISS' : 'MISS');
        SND.play('hurt');
        await wait(300);
    }
    sp.done = true;
    result.textContent = msg;
    return new Promise(resolve => {
        const again = mk('button', 'abtn primary', 'もう一度'), close = mk('button', 'abtn', 'とじる');
        again.onclick = () => { root.remove(); resolve(); setTimeout(slotFlow, 0); };
        close.onclick = () => { root.remove(); resolve(); };
        btns.append(again, close);
        again.focus();
    });
}

// 役物: 7揃いで、天井から金色の王冠(Codexの絵 CROWN)が降りてきて、後光(CROWN_RAYS)が回り、コインがあふれる
function yakumono(fx) {
    const rays = document.createElement('img');
    rays.className = 'slot-rays'; rays.alt = ''; rays.draggable = false; rays.src = 'img/mg/CROWN_RAYS.webp';
    rays.onerror = () => rays.remove();
    fx.append(rays);
    const crown = document.createElement('div');
    crown.className = 'slot-crown';
    const img = document.createElement('img');
    img.alt = ''; img.draggable = false; img.src = 'img/mg/CROWN.webp';
    img.onerror = () => { crown.textContent = '👑'; };
    crown.append(img);
    fx.append(crown);
    coinRain(fx, 40);
    setTimeout(() => { crown.remove(); rays.remove(); }, 3200);
}

// 上乗せ特化ゾーン: 7が揃うたびに枚数が上乗せされ、合計がカウントアップする(中身は決まった配当を、細かく見せているだけ)
async function playZone(fx, zone, total, wait, sayBanner) {
    if (!zone.length) return;
    const panel = document.createElement('div');
    panel.className = 'slot-zone art';   // 絵の枠(MG_ZONE_PANEL)。読めなくても、CSSの枠で表示
    const head = document.createElement('div'); head.className = 'zhead'; head.textContent = 'BONUS ZONE';
    { const lg = document.createElement('img'); lg.className = 'zlogo'; lg.alt = 'BONUS ZONE'; lg.src = 'img/mg/LOGO_ZONE_EN.webp'; lg.onload = () => { head.textContent = ''; head.append(lg); }; }
    const sum = document.createElement('div'); sum.className = 'zsum'; sum.textContent = '+0枚';
    const add = document.createElement('div'); add.className = 'zadd';
    const burst = document.createElement('img'); burst.className = 'zburst'; burst.alt = ''; burst.draggable = false; burst.src = 'img/mg/ZONE_BURST.webp'; burst.onerror = () => burst.remove();
    panel.append(burst, head, sum, add);
    fx.append(panel);
    const pile = document.createElement('img');
    pile.className = 'slot-pile'; pile.alt = ''; pile.draggable = false; pile.src = 'img/mg/COIN_PILE.webp'; pile.onerror = () => pile.remove();
    fx.append(pile);
    let acc = 0;
    for (const n of zone) {
        await wait(520);
        acc += n;
        add.textContent = `UP! +${n}`;
        add.classList.remove('pop'); void add.offsetWidth; add.classList.add('pop');
        burst.classList.remove('boom'); void burst.offsetWidth; burst.classList.add('boom');
        sum.textContent = `+${acc}枚`;
        SND.play('pika'); coinRain(fx, 6); slotVibrate(20);
    }
    sum.textContent = `+${total}枚`;
    await wait(900);
    panel.remove();
    pile.remove();
    sayBanner(`+${total} WIN!`);
}

function coinRain(fx, n) {
    n *= 3;                           // 粒の数は3倍、色は虹色(2026-10-02)
    for (let i = 0; i < n; i++) {
        const c = document.createElement('div');
        c.className = 'slot-coin';
        c.style.left = (Math.random() * 100) + '%';
        const dur = 1.2 + Math.random() * 1.2;
        c.style.animationDelay = (Math.random() * 1.2) + 's, 0s, -' + (Math.random() * 3) + 's';
        c.style.animationDuration = dur + 's, .4s, 1.6s';
        fx.append(c);
        setTimeout(() => c.remove(), 3600);
    }
}

function slotVibrate(p) { try { if (navigator.vibrate) navigator.vibrate(p); } catch (_) { /* 振動できなくても続ける */ } }


// ---------- 群予告: 画面いっぱいに、大きな魔物が走り抜ける(2026-10-02) ----------
const SWARM_IDS = [1, 21, 31, 51, 61, 76, 89, 11, 45, 86, 8, 63];

const slotEl = (tag, cls, txt) => { const e = document.createElement(tag); if (cls) e.className = cls; if (txt !== undefined) e.textContent = txt; return e; };

async function slotSwarm(fx, wait) {
    // 半分の大きさの魔物が、ばらけて長めに画面を駆け抜ける(密集度は低め)(canvasで描く。奥ほど小さく、手前ほど大きい)
    const layer = slotEl('div', 'slot-swarm-layer');
    const cv = slotEl('canvas', 'slot-swarm-canvas');
    layer.append(cv, slotEl('div', 'slot-swarm-title', 'SWARM!'));
    fx.append(layer);
    const W = cv.width = layer.clientWidth || window.innerWidth, H = cv.height = layer.clientHeight || window.innerHeight;
    const ctx = cv.getContext('2d'); ctx.imageSmoothingEnabled = false;
    // 2026-10-02: Codexの群予告用の魔物5点(192角の小さな絵)。読めなかったとき(canvasに描けないとき)は、描かれないだけ
    const imgs = ['GOBLIN', 'BAT', 'GHOST', 'SKULL', 'DRAGON'].map(k => { const im = new Image(); im.src = `img/mg/${k}.webp`; return im; });
    const crowd = [];
    for (let i = 0; i < 160; i++) {
        const row = Math.random();
        const h = H * (0.2 + row * 0.15);
        const speed = W * (0.6 + Math.random() * 0.15);      // 1秒あたりの移動距離
        crowd.push({ im: imgs[Math.floor(Math.random() * imgs.length)], h, bottom: H * (0.42 + row * 0.58), speed, x0: -h - Math.random() * 3.0 * speed });
    }
    crowd.sort((a, b) => a.bottom - b.bottom);
    SND.play('crit'); slotVibrate([40, 30, 40, 30, 60]);
    const t0 = performance.now();
    let alive = true;
    const draw = () => {
        if (!alive) return;
        const t = (performance.now() - t0) / 1000;
        ctx.clearRect(0, 0, W, H);
        for (const c of crowd) {
            const x = c.x0 + c.speed * t;
            if (x > W || !c.im.naturalWidth) continue;
            const w = c.im.naturalWidth * c.h / c.im.naturalHeight;
            if (x < -w) continue;
            ctx.drawImage(c.im, x, c.bottom - c.h - Math.sin(x / 40) * 4, w, c.h);
        }
        requestAnimationFrame(draw);
    };
    draw();
    await wait(4600);
    alive = false;
    layer.remove();
}

// ---------- 連続演出: ダンジョンと同じ戦闘画面(背景・大きな魔物・冒険者カード・攻撃エフェクト・ダメージ数字・メッセージ)で戦う ----------
const FOE_IDS = { 'ゴブリンキング': 10, 'リッチ': 29, '炎竜': 89, '奈落の王ゼロス': 100 };

async function slotBattle(root, show, wait) {
    const foeId = FOE_IDS[show.foe] || 1;
    const win = !!show.battleWin;
    const scene = slotEl('div', 'slot-bscene');
    // 挑む冒険者は、ランダムで1〜4人(人数は台本で決まる。多いほど、勝ちやすい台本)
    const everyone = (G.snap && G.snap.party ? G.snap.party : []);
    const count = Math.max(1, Math.min(show.allies || 4, everyone.length));
    const pickIdx = everyone.map((m, i) => i).sort(() => Math.random() - 0.5).slice(0, count).sort((a, b) => a - b);
    const party = pickIdx.map(i => everyone[i]).map(m => ({ name: m.name, face: m.face, level: m.level, job: m.job, hp: m.hp, maxHp: Math.max(m.maxHp, 1), down: false }));
    const cards = slotEl('div', 'bs-party');
    const cardEls = party.map(m => {
        const bar = slotEl('div', 'bar hp'); const fill = slotEl('i'); fill.style.width = (m.hp / m.maxHp * 100) + '%'; bar.append(fill);
        const num = slotEl('span', 'num', `HP ${m.hp}/${m.maxHp}`); bar.append(num);
        const nm = slotEl('div', 'nm', m.name + ' '); nm.append(slotEl('small', '', `Lv${m.level} ${m.job}`));
        const face = slotEl('img'); face.src = m.face; face.alt = '';
        const info = slotEl('div'); info.append(nm, bar);
        const card = slotEl('div', 'pcard'); card.append(face, info);
        cards.append(card);
        return { card, fill, num, bar };
    });
    const enemyBox = slotEl('div', 'bs-enemy-box');
    const enemy = slotEl('img', 'bs-enemy'); enemy.alt = ''; enemy.draggable = false; enemy.src = `img/monster/${foeId}.webp`;
    const ename = slotEl('div', 'bs-ename', show.foe);
    const ebar = slotEl('div', 'bs-ebar'); const efill = slotEl('i'); ebar.append(efill);
    { const frame = slotEl('img', 'bs-ebar-frame'); frame.alt = ''; frame.src = 'img/mg/HPBAR_FRAME.webp'; frame.onerror = () => frame.remove(); ebar.append(frame); }
    enemyBox.append(enemy, ename, ebar);
    const layer = slotEl('div', 'bs-fx');
    const msg = slotEl('div', 'bs-msg', '');
    scene.append(cards, enemyBox, layer, msg);
    root.append(scene);
    SND.play('tempai');
    { const vs = slotEl('img', 'bs-vs'); vs.alt = 'VS'; vs.src = 'img/mg/VS.webp'; vs.onerror = () => vs.remove(); scene.append(vs); setTimeout(() => vs.remove(), 900); }   // 戦闘の始まり: VSの絵(2026-10-02)
    const say = t => { msg.textContent = t; };
    const popFx = (name, x, y, size) => {
        const im = slotEl('img', 'bs-fxpic'); im.alt = ''; im.src = `img/fx/${name}.webp`;
        im.style.left = x + 'px'; im.style.top = y + 'px'; im.style.width = size + 'px';
        im.onerror = () => im.remove(); layer.append(im); setTimeout(() => im.remove(), 700);
    };
    const popNum = (text, x, y, cls) => {
        const n = slotEl('div', 'bs-num ' + (cls || ''), text); n.style.left = x + 'px'; n.style.top = y + 'px';
        layer.append(n); setTimeout(() => n.remove(), 1000);
    };
    const center = el => { const b = el.getBoundingClientRect(); return [b.left + b.width / 2, b.top + b.height / 2, b.width, b.height]; };
    const setHp = (i, hp) => {
        const m = party[i]; m.hp = Math.max(0, hp);
        cardEls[i].fill.style.width = (m.hp / m.maxHp * 100) + '%'; cardEls[i].num.textContent = `HP ${Math.round(m.hp)}/${m.maxHp}`;
        cardEls[i].bar.className = m.hp / m.maxHp < 0.3 ? 'bar hp low' : 'bar hp';
        if (m.hp <= 0) { m.down = true; cardEls[i].card.classList.add('down'); }
    };
    let enemyHp = 100;
    const lvl = Math.max(...party.map(m => m.level), 1);
    await wait(900);
    say(`${show.foe}が現れた!`);
    await wait(900);
    say(`冒険者${party.length}人で挑む!`);
    await wait(800);
    const rounds = 2;
    const specialRound = show.special && show.foe === '炎竜' ? ((Math.random() * 2) | 0) : -1;
    const hits = rounds * Math.max(party.length, 1);
    const endHp = win ? 22 : 45;
    const step = (100 - endHp) / hits;
    for (let r = 0; r < rounds; r++) {
        for (let i = 0; i < party.length; i++) {
            if (party[i].down) continue;
            say(`${party[i].name}の攻撃!`);
            const [ex, ey, ew] = center(enemy);
            popFx(i === 1 ? '炎' : '斬撃', ex, ey, Math.max(220, ew * 0.8));
            const dmg = Math.round(lvl * (12 + Math.random() * 10));
            popNum(String(dmg), ex + (Math.random() - 0.5) * ew * 0.4, ey - 30, '');
            SND.play('hit'); enemy.classList.remove('shake'); void enemy.offsetWidth; enemy.classList.add('shake');
            enemyHp = Math.max(enemyHp - step, 0); efill.style.width = enemyHp + '%';
            await wait(340);
        }
        // 魔物の反撃
        const alive = party.map((m, i) => i).filter(i => !party[i].down);
        if (!alive.length) break;
        if (r === specialRound) {
            // 炎竜の必殺技: 出たら、その場で全滅(1ラウンドに約3%の渋い設定)
            say('炎竜の必殺技! 煉獄の業火!!');
            SND.play('crit'); slotVibrate([60, 30, 90]);
            const [ex, ey, ew] = center(enemy);
            popFx('炎', ex, ey, Math.max(420, ew * 1.4));
            alive.forEach(i => { const [cx, cy] = center(cardEls[i].card); popFx('炎', cx, cy, 200); popNum('-' + party[i].maxHp, cx, cy - 10, 'hurt'); cardEls[i].card.classList.add('fx-hit'); setHp(i, 0); });
            await wait(1500);
            break;
        }
        const t = alive[(Math.random() * alive.length) | 0];
        say(`${show.foe}の反撃!`);
        const [cx, cy] = center(cardEls[t].card);
        popFx(show.foe === '炎竜' ? '炎' : '攻撃ヒット', cx, cy, 180);
        popNum('-' + Math.round(lvl * (6 + Math.random() * 6)), cx, cy - 10, 'hurt');
        SND.play('hurt'); slotVibrate(25);
        cardEls[t].card.classList.remove('fx-hit'); void cardEls[t].card.offsetWidth; cardEls[t].card.classList.add('fx-hit');
        setHp(t, party[t].hp - party[t].maxHp * (win ? 0.12 : 0.22));
        await wait(800);
    }
    await wait(300);
    if (win) {
        say(`${show.foe}を倒した!`);
        const [ex, ey, ew] = center(enemy);
        popFx('斬撃', ex, ey, ew); popFx('爆発', ex, ey, ew * 0.9);
        efill.style.width = '0%'; enemy.classList.add('defeated'); SND.play('win');
        { const v = slotEl('div', 'bs-verdict win', ''); const im = slotEl('img', 'bs-verdict-img'); im.alt = '勝利!'; im.src = 'img/mg/WIN.webp'; im.onerror = () => { v.textContent = '勝利!'; im.remove(); }; v.append(im); scene.append(v); }
    } else {
        say(specialRound >= 0 ? '炎竜の必殺技で、パーティは焼き尽くされた……' : 'パーティは、力尽きた……');
        party.forEach((m, i) => setHp(i, 0));
        SND.play('gameover');
        { const v = slotEl('div', 'bs-verdict lose', ''); const im = slotEl('img', 'bs-verdict-img'); im.alt = '敗北…'; im.src = 'img/mg/LOSE.webp'; im.onerror = () => { v.textContent = '敗北…'; im.remove(); }; v.append(im); scene.append(v); }
    }

    await wait(1700);
    scene.remove();
}


// ---------- 丁半・ハイ&ロー: 結果を絵で見せる(2026-10-02。Codexの絵: サイコロ・カップ・カード) ----------
const CARD_NAME = c => ({ 1: 'A', 11: 'J', 12: 'Q', 13: 'K' }[c] || String(c));

function betChip(bet) {
    if (!bet) return null;
    const w = slotEl('div', 'bet-chip');
    const im = slotEl('img'); im.alt = ''; im.src = `img/mg/CHIP_${bet}.webp`; im.onerror = () => w.remove();
    w.append(im, slotEl('span', '', 'BET'));
    return w;
}

function casinoTable(title, bet) {
    const root = slotEl('div', 'casino-table');
    const box = slotEl('div', 'ct-box');
    { const c = betChip(bet); if (c) box.append(c); }
    box.append(slotEl('div', 'ct-title', title));
    const stage = slotEl('div', 'ct-stage');
    box.append(stage);
    const result = slotEl('div', 'ct-result', '');
    box.append(result);
    root.append(box);
    document.body.append(root);
    let closed = false;
    const close = () => { if (!closed) { closed = true; root.remove(); } };
    root.addEventListener('pointerdown', close);
    return { stage, result, close, isClosed: () => closed };
}

async function diceFlow(odd) {
    if (G.busy) return;
    const res = api('casinoHanChou', { odd });
    const d = res.data;
    if (!d) { logMessage(res.msg); refresh(); return; }
    const t = casinoTable(odd ? '半(奇数)に賭けた' : '丁(偶数)に賭けた', d.bet);
    const cup = slotEl('img', 'ct-cup'); cup.alt = ''; cup.src = 'img/mg/DICE_CUP.webp'; cup.onerror = () => cup.remove();
    const dice = [d.d1, d.d2].map(() => { const im = slotEl('img', 'ct-die'); im.alt = ''; im.style.visibility = 'hidden'; return im; });
    t.stage.append(...dice, cup);
    const face = (im, n) => { im.src = `img/mg/DICE_${n}.webp`; };
    SND.play('reelstart'); slotVibrate(20);
    cup.classList.add('shake');
    await slotSleep(900);
    cup.classList.remove('shake'); cup.classList.add('lift');
    dice.forEach(im => { im.style.visibility = 'visible'; im.classList.add('roll'); });
    for (let i = 0; i < 9 && !t.isClosed(); i++) { dice.forEach(im => face(im, 1 + ((Math.random() * 6) | 0))); SND.play('step'); await slotSleep(90); }
    face(dice[0], d.d1); face(dice[1], d.d2);
    dice.forEach(im => im.classList.remove('roll'));
    const sum = d.d1 + d.d2, isOdd = sum % 2 === 1, won = isOdd === !!odd;
    t.result.textContent = `${d.d1} + ${d.d2} = ${sum} → ${isOdd ? '半' : '丁'}  ${won ? 'WIN!' : 'LOSE…'}`;
    t.result.classList.add(won ? 'win' : 'lose');
    SND.play(won ? 'win' : 'hurt');
    await slotSleep(1300);
    t.close();
    logMessage(res.msg);
    refresh();
}

async function hiloFlow(high) {
    if (G.busy) return;
    const res = api('casinoHighLow', { high });
    const d = res.data;
    if (!d) { logMessage(res.msg); refresh(); return; }
    const t = casinoTable(high ? 'HIGH(次は大きい)に賭けた' : 'LOW(次は小さい)に賭けた', d.bet);
    const suitOf = c => '♠♥♦♣'[(c * 7 + 2) % 4];
    const card = (rank, back) => {
        const w = slotEl('div', 'ct-card' + (back ? ' back' : ''));
        const img = slotEl('img'); img.alt = ''; img.src = back ? 'img/mg/CARD_BACK.webp' : 'img/mg/CARD_FRAME.webp'; w.append(img);
        if (!back) {
            const s = suitOf(rank), red = s === '♥' || s === '♦';
            w.append(slotEl('div', 'rank' + (red ? ' red' : ''), CARD_NAME(rank)), slotEl('div', 'suit' + (red ? ' red' : ''), s));
        }
        return w;
    };
    const left = card(d.current, false);
    const right = card(d.next, true);
    t.stage.append(left, right);
    SND.play('step');
    await slotSleep(800);
    if (!t.isClosed()) {
        right.classList.add('flip');
        await slotSleep(260);
        const face = card(d.next, false);
        right.replaceWith(face); face.classList.add('flipin');
    }
    const won = high ? d.next > d.current : d.next < d.current;
    t.result.textContent = d.next === d.current ? 'SAME…  LOSE' : (won ? 'WIN!' : 'LOSE…');
    t.result.classList.add(won ? 'win' : 'lose');
    SND.play(won ? 'win' : 'hurt');
    await slotSleep(1300);
    t.close();
    logMessage(res.msg);
    refresh();
}


// ---------- 知らせの絵(2026-10-02。Codexの絵: 王者のバッジ・トロフィー・参加券・景品箱) ----------
// メッセージの内容から出す: 称号=バッジ / 連勝の景品=トロフィー / 闘技場の参加=参加券 / カジノの景品交換=景品箱
function awardsOf(msg) {
    const list = [];
    if (msg.includes('称号「闘技場の覇者」')) list.push({ kind: 'CHAMP_BADGE', title: '称号「闘技場の覇者」', sub: '20連勝を達成した、闘技場の王者の証。' });
    const prize = /(\d+)連勝の景品: ([^\n]+)/.exec(msg);
    if (prize) list.push({ kind: 'TROPHY', title: `${prize[1]}連勝!`, sub: '景品: ' + prize[2] });
    else if (msg.startsWith('闘技場に参加した')) list.push({ kind: 'TICKET', title: 'ENTRY', sub: '勝ち抜くほど、賞金と景品が増える。' });
    else { const ex = /景品\[(.+?)\]と交換した/.exec(msg); if (ex) list.push({ kind: 'PRIZE_BOX', title: '景品を手に入れた!', sub: ex[1] }); }
    return list;
}

async function awardFlow(res) {
    if (!res || !res.msg) return;
    for (const a of awardsOf(res.msg)) {
        const t = casinoTable('');
        const img = slotEl('img', 'aw-img'); img.alt = ''; img.src = `img/mg/${a.kind}.webp`; img.onerror = () => { t.close(); };
        t.stage.classList.add('award'); t.stage.append(img);
        t.result.textContent = a.title; t.result.classList.add('win');
        t.result.append(slotEl('div', 'aw-sub', a.sub));
        SND.play('fanfare'); slotVibrate(30);
        await slotSleep(2400);
        t.close();
    }
}
