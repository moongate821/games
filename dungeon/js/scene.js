// 画面(キャンバス)の描画: 街の背景とNPC、ダンジョンの一人称視点の廊下、戦闘の敵、効果、ミニマップ。
// 廊下の描き方は Windows 版(ScenePanel.DrawCorridor)と同じ考え方(手前から3マス分を、奥ほど小さく・暗く)。
'use strict';

const Scene = {
    canvas: null, ctx: null, W: 1280, H: 720,
    dirty: true, enemyRects: [],
    enemyAnim: new Map(),   // 敵ごとの短い演出(被弾・撃破・逃走・怯え)。2026-10-02(戦闘の見直し)
    eventObj: null,        // 出来事の物体(宝箱を開けた、など)。次の操作まで表示
};

function requestRedraw() { Scene.dirty = true; }

function initScene() {
    Scene.canvas = document.getElementById('scene');
    Scene.ctx = Scene.canvas.getContext('2d');
    const loop = ts => {
        const s = G.snap;
        const animating = !!G.fx || (s && (s.state === 'Dungeon' || s.state === 'Battle'));
        const lively = Scene.enemyAnim.size > 0;   // 敵の演出中は、なめらかに(約30コマ/秒)
        if (Scene.dirty || lively || (animating && ts - (Scene.last || 0) > 100)) {
            Scene.last = ts;
            Scene.dirty = false;
            drawScene(ts);
        }
        requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
    Scene.canvas.addEventListener('pointerdown', onScenePointer);
}

function onScenePointer(e) {
    const r = Scene.canvas.getBoundingClientRect();
    // object-fit: contain の余白を除いた位置に直す
    const k = Math.min(r.width / Scene.W, r.height / Scene.H);
    const ox = (r.width - Scene.W * k) / 2, oy = (r.height - Scene.H * k) / 2;
    const x = (e.clientX - r.left - ox) / k, y = (e.clientY - r.top - oy) / k;
    const s = G.snap;
    if (s && s.state === 'Battle') {
        for (const en of Scene.enemyRects) {
            if (x >= en.x && x <= en.x + en.w && y >= en.y && y <= en.y + en.h) {
                act('target', { i: en.i });
                return;
            }
        }
    }
}

// ---------- 色 ----------
const BG_DARK = [6, 5, 6];
function mix(c, f, bg = BG_DARK) {
    return `rgb(${Math.round(bg[0] + (c[0] - bg[0]) * f)},${Math.round(bg[1] + (c[1] - bg[1]) * f)},${Math.round(bg[2] + (c[2] - bg[2]) * f)})`;
}

function quad(ctx, color, pts) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(pts[0][0], pts[0][1]);
    for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
    ctx.closePath();
    ctx.fill();
}

// 敵の演出を始める。kind: hit(被弾で揺れて光る)/ defeat(光って沈みながら消える)/ flee(走り去る)/ scared(怯えて震える)
const ENEMY_ANIM_MS = { hit: 320, defeat: 750, flee: 700, scared: 950 };
function enemyAnim(enemy, kind) {
    if (G.settings && G.settings.effects === 'off') return;
    Scene.enemyAnim.set(enemy, { kind, t0: performance.now() });
    requestRedraw();
}
function enemyAnimState(enemy) {
    const a = Scene.enemyAnim.get(enemy);
    if (!a) return null;
    const t = (performance.now() - a.t0) / ENEMY_ANIM_MS[a.kind];
    if (t >= 1 && a.kind !== 'flee') { Scene.enemyAnim.delete(enemy); return null; }
    return { kind: a.kind, t: Math.min(t, 1) };
}

const lerp2 = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
const darkAlpha = fade => Math.max(0, Math.min(235, 60 + (1 - fade) * 220)) / 255;

// ---------- メイン ----------
function drawScene(ts) {
    const { ctx, W, H } = Scene;
    const s = G.snap;
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = '#060306';
    ctx.fillRect(0, 0, W, H);
    Scene.enemyRects = [];
    if (!s || s.state !== 'Battle') Scene.enemyAnim.clear();
    if (!s || s.state === 'Title') return;

    if (s.state === 'Town') {
        drawTown(ctx, W, H);
    } else if ((s.state === 'Dungeon' || s.state === 'Battle') && s.dungeon) {
        drawCorridor(ctx, W, H, s.dungeon.corridor, s.dungeon.floor >= 6 ? 'wall_cave' : 'wall_dungeon', s.dungeon.layer, s.dungeon.layerBase);
        if (s.dungeon.night) drawNight(ctx, W, H);
        if (s.state === 'Battle') {
            ctx.fillStyle = 'rgba(8,3,10,0.45)';
            ctx.fillRect(0, 0, W, H);
            drawEnemies(ctx, W, H, s.battle);
            // 味方への演出は、冒険者の欄(左上のカード)に出す。ここは敵だけ
        } else {
            drawCenterObject(ctx, W, H, s);
            drawMinimap(ctx, W, H, s.dungeon);
        }
        drawBanner(ctx, W, H, s);
    } else if (s.state === 'GameOver') {
        ctx.fillStyle = '#0a0308';
        ctx.fillRect(0, 0, W, H);
        ctx.fillStyle = '#e0475b';
        ctx.font = 'bold 84px "Hiragino Sans","Yu Gothic UI",sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(T('力尽きた…'), W / 2, H / 2);
        ctx.textAlign = 'start';
    }
    drawEffect(ctx, W, H, ts);
    drawVignette(ctx, W, H);
}

// ---------- 街 ----------
function townBackgroundCode() {
    const f = G.facility;
    if (!f) return 'TOWN_001';
    const map = { WeaponShop: 'TOWN_002', Inn: 'TOWN_003', Temple: 'TOWN_004', Blacksmith: 'TOWN_005', MasterShop: 'TOWN_005', Guild: 'TOWN_006', ArmorShop: 'TOWN_007', GeneralShop: 'TOWN_008', Appraisal: 'TOWN_009', Warehouse: 'TOWN_010', TrainingHall: 'TOWN_011' };
    if (f.type === 'Casino') return A.bg('TOWN_012') ? 'TOWN_012' : 'TOWN_008';   // 専用の背景ができるまでは雑貨屋の背景
    if (f.type === 'Arena') return A.bg('TOWN_013') ? 'TOWN_013' : 'TOWN_011';
    return map[f.type] || 'TOWN_001';
}

function drawCover(ctx, img, W, H) {
    const k = Math.max(W / img.width, H / img.height);
    const w = img.width * k, h = img.height * k;
    ctx.drawImage(img, (W - w) / 2, (H - h) / 2, w, h);
}

function drawTown(ctx, W, H) {
    const bg = A.bg(townBackgroundCode()) || A.bg('TOWN_001');
    if (bg) drawCover(ctx, bg, W, H);
    const f = G.facility;
    if (!f || !f.npcId) return;
    const npc = A.npc(f.npcId);
    if (npc) {
        const h = H * 0.98, w = npc.width * (h / npc.height);
        ctx.drawImage(npc, W * 0.20, H - h + 6, w, h);
    }
    // 吹き出しと名前
    if (f.speech) {
        const bx = W * 0.5, by = H * 0.5, bw = W * 0.44, bh = 150;
        roundRect(ctx, bx, by, bw, bh, 18, 'rgba(38,10,36,0.86)', '#c9a24d', 2);
        ctx.fillStyle = '#f4ecd6';
        ctx.font = 'bold 27px "Hiragino Sans","Yu Gothic UI",sans-serif';
        wrapText(ctx, f.speech, bx + 22, by + 44, bw - 44, 36);
    }
    if (f.npcName) {
        roundRect(ctx, W * 0.03, H - 74, 320, 52, 14, 'rgba(38,10,36,0.9)', '#c9a24d', 2);
        ctx.fillStyle = '#f2d38a';
        ctx.font = 'italic bold 30px "Hiragino Sans","Yu Gothic UI",sans-serif';
        ctx.fillText(T(f.npcName), W * 0.03 + 22, H - 38);
    }
}

function roundRect(ctx, x, y, w, h, r, fill, stroke, lw) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
    if (fill) { ctx.fillStyle = fill; ctx.fill(); }
    if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = lw || 1; ctx.stroke(); }
}

function wrapText(ctx, text, x, y, maxW, lh) {
    text = T(text);
    // 日本語は1文字ずつ、英語は単語ごとに折り返す
    const tokens = /[\u3040-\u30ff\u4e00-\u9fff]/.test(text) ? [...text] : text.split(/(?<=[ \n])/);
    let line = '';
    for (const tok of tokens) {
        const nl = tok.endsWith('\n');
        const part = nl ? tok.slice(0, -1) : tok;
        if (tok === '\n') { ctx.fillText(line, x, y); line = ''; y += lh; continue; }
        const t = line + part;
        if (ctx.measureText(t.trimEnd()).width > maxW && line) { ctx.fillText(line.trimEnd(), x, y); line = part; y += lh; } else line = t;
        if (nl) { ctx.fillText(line.trimEnd(), x, y); line = ''; y += lh; }
    }
    ctx.fillText(line.trimEnd(), x, y);
}

// ---------- ダンジョンの廊下 ----------
// 2026-09-30(深層の見た目バリエーション): layer(階ごとの変化形。例ABYSS_4B)に素材が無ければ、
// layerBase(基本の見た目。例ABYSS_4)にフォールバックする。
function dgn(layer, layerBase, kind) {
    return (layer && A.dgn(layer, kind)) || (layerBase && layerBase !== layer && A.dgn(layerBase, kind));
}

function drawCorridor(ctx, W, H, corridor, wallName, layer, layerBase) {
    const bg = BG_DARK;
    ctx.fillStyle = `rgb(${bg[0]},${bg[1]},${bg[2]})`;
    ctx.fillRect(0, 0, W, H);
    if (!corridor || !corridor.length) return;
    // 2026-09-30追加(ユーザー指定「各階層の壁や松明などを色々そろえたい」): その階層専用の絵があれば使い、
    // 無ければ従来の共通素材(壁2種・扉/階段1種、床と天井は色だけ)にフォールバックする。
    const layerWall = dgn(layer, layerBase, 'WALL') || A.ui(wallName);
    const layerFloor = dgn(layer, layerBase, 'FLOOR');
    const layerCeil = dgn(layer, layerBase, 'CEIL');
    const torchFrame = Math.floor(performance.now() / 450) % 2 === 0 ? 'TORCH_A' : 'TORCH_B';
    const layerTorch = dgn(layer, layerBase, torchFrame) || dgn(layer, layerBase, 'TORCH_A');
    const layerDoor = dgn(layer, layerBase, 'DOOR');
    const layerLocked = dgn(layer, layerBase, 'DOOR_LOCKED');
    const layerPillar = dgn(layer, layerBase, 'PILLAR');
    const layerArch = dgn(layer, layerBase, 'ARCH');
    const tex = layerWall;
    const wallBase = [104, 86, 68], frontBase = [92, 76, 60], floorBase = [70, 60, 52], ceilBase = [40, 33, 30];
    const maxDepth = Math.max(corridor.length, 1) + 1;
    const rects = [];
    for (let i = 0; i <= maxDepth; i++) {
        const ratio = Math.pow(0.62, i), w = Math.floor(W * ratio), h = Math.floor(H * ratio);
        rects.push({ l: Math.floor((W - w) / 2), t: Math.floor((H - h) / 2), r: Math.floor((W - w) / 2) + w, b: Math.floor((H - h) / 2) + h, w, h });
    }
    const sprites = [];
    let stopped = false;
    for (let depth = 0; depth < corridor.length; depth++) {
        const o = rects[depth], n = rects[depth + 1], cell = corridor[depth];
        const fade = Math.max(1 - depth * 0.30, 0.25);
        const lit = cell.visited;   // 一度通ったマスは、床・天井を明るく
        if (layerCeil) {
            drawFloorCeilTexture(ctx, o, n, true, layerCeil);
            quad(ctx, `rgba(4,3,6,${darkAlpha(fade) * (lit ? 0.35 : 0.75)})`, [[o.l, o.t], [o.r, o.t], [n.r, n.t], [n.l, n.t]]);
        } else {
            quad(ctx, lit ? mix([104, 90, 78], fade) : mix(ceilBase, fade), [[o.l, o.t], [o.r, o.t], [n.r, n.t], [n.l, n.t]]);
        }
        if (layerFloor) {
            drawFloorCeilTexture(ctx, o, n, false, layerFloor);
            quad(ctx, `rgba(4,3,6,${darkAlpha(fade) * (lit ? 0.3 : 0.7)})`, [[o.l, o.b], [o.r, o.b], [n.r, n.b], [n.l, n.b]]);
        } else {
            quad(ctx, lit ? mix([150, 128, 104], fade) : mix(floorBase, fade), [[o.l, o.b], [o.r, o.b], [n.r, n.b], [n.l, n.b]]);
        }
        if (lit) quad(ctx, `rgba(255,200,120,${(46 * fade) / 255})`, [[o.l, o.b], [o.r, o.b], [n.r, n.b], [n.l, n.b]]);
        if (!layerFloor) drawFloorStones(ctx, o, n, fade);
        drawSideWall(ctx, o, n, true, cell.left, mix(wallBase, fade), fade, tex);
        drawSideWall(ctx, o, n, false, cell.right, mix(wallBase, fade), fade, tex);
        drawFloorContactShadow(ctx, o, n);
        // 2026-09-30追加(通路の見た目案2): 奥行きの区切りごとに角の柱を、1段おきに天井のアーチを重ねる。
        drawPillar(ctx, o, true, layerPillar, fade);
        drawPillar(ctx, o, false, layerPillar, fade);
        if (depth % 2 === 1) drawArch(ctx, o, layerArch, fade);
        if (depth === 1 && cell.left) drawTorch(ctx, o, n, true, layerTorch, fade);
        else if (depth === 1 && cell.right) drawTorch(ctx, o, n, false, layerTorch, fade);
        if (cell.feature === 'door') {   // 閉じた扉: 通路をふさぎ、向こうは見えない
            const door = layerDoor || A.obj('扉_木');
            if (door) ctx.drawImage(door, n.l, n.t, n.w, n.h);
            else { ctx.fillStyle = mix([96, 62, 34], fade); ctx.fillRect(n.l, n.t, n.w, n.h); }
            ctx.fillStyle = `rgba(4,3,3,${darkAlpha(fade) * 0.6})`;
            ctx.fillRect(n.l, n.t, n.w, n.h);
            stopped = true;
            break;
        }
        if (cell.feature) sprites.push({ depth, feature: cell.feature, fade });
        if (cell.front && cell.frontFeature === 'locked' && (layerLocked || A.obj('扉_鍵付き'))) {   // 鍵のかかった扉
            if (tex) ctx.drawImage(tex, n.l, n.t, n.w, n.h);
            ctx.drawImage(layerLocked || A.obj('扉_鍵付き'), n.l, n.t, n.w, n.h);
            ctx.fillStyle = `rgba(4,3,3,${darkAlpha(fade) * 0.6})`;
            ctx.fillRect(n.l, n.t, n.w, n.h);
            stopped = true;
            break;
        }
        if (cell.front) {
            if (tex) {
                ctx.drawImage(tex, n.l, n.t, n.w, n.h);
                ctx.fillStyle = `rgba(4,3,3,${darkAlpha(fade)})`;
                ctx.fillRect(n.l, n.t, n.w, n.h);
            } else {
                ctx.fillStyle = mix(frontBase, fade);
                ctx.fillRect(n.l, n.t, n.w, n.h);
                drawBricks(ctx, n, fade);
            }
            stopped = true;
            break;
        }
    }
    if (!stopped) {   // いちばん奥。黒一色は何も描いていない背景の上に塗るため壁に見える(2026-09-30)。
        // 天井・床と同じ暗さの色をまず続けて塗り、その上に縁が透明なもやを重ねて霧の奥へ消える見た目にする。
        const last = rects[corridor.length];
        const farFade = Math.max(1 - corridor.length * 0.30, 0.25);
        const midY = (last.t + last.b) / 2;
        ctx.fillStyle = mix(ceilBase, farFade);
        ctx.fillRect(last.l, last.t, last.w, midY - last.t);
        ctx.fillStyle = mix(floorBase, farFade);
        ctx.fillRect(last.l, midY, last.w, last.b - midY);
        const cx = (last.l + last.r) / 2, cy = (last.t + last.b) / 2;
        const r = Math.max(last.w, last.h) / 2;
        const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
        grad.addColorStop(0, 'rgba(3,3,4,0.75)');
        grad.addColorStop(1, 'rgba(3,3,4,0)');
        ctx.fillStyle = grad;
        ctx.fillRect(last.l, last.t, last.w, last.h);
    }
    drawFeatureSprites(ctx, W, sprites, rects, layer, layerBase);
}

// 通路の先にいる強敵: 赤いもやの中に、モンスターの姿を描く
function drawFoe(ctx, W, id, o, n, fade) {
    const cellW = (o.w + n.w) / 2, h = (o.h + n.h) / 2 * 0.8;
    const yFloor = (o.b + n.b) / 2 + (o.b - n.b) * 0.15;
    const pulse = 0.75 + 0.25 * Math.sin(performance.now() / 180);
    const g = ctx.createRadialGradient(W / 2, yFloor - h * 0.5, 4, W / 2, yFloor - h * 0.5, cellW * 0.5);
    g.addColorStop(0, `rgba(230,30,30,${0.6 * pulse * Math.max(fade, 0.5)})`);
    g.addColorStop(1, 'rgba(120,0,0,0)');
    ctx.fillStyle = g;
    ctx.fillRect(W / 2 - cellW * 0.5, yFloor - h * 1.1, cellW, h * 1.2);
    const img = A.monster(id);
    if (!img) return;
    let w = img.width * (h / img.height);
    if (w > cellW * 0.8) w = cellW * 0.8;
    const dh = img.height * (w / img.width);
    ctx.globalAlpha = Math.max(fade, 0.7);
    ctx.filter = 'sepia(0.3) saturate(1.4) hue-rotate(-20deg)';
    ctx.drawImage(img, (W - w) / 2, yFloor - dh, w, dh);
    ctx.filter = 'none';
    ctx.globalAlpha = 1;
}

// 夜: 画面の周りから暗くし、全体を青みがからせる
function drawNight(ctx, W, H) {
    ctx.fillStyle = 'rgba(10,20,70,0.28)';
    ctx.fillRect(0, 0, W, H);
    const g = ctx.createRadialGradient(W / 2, H * 0.55, Math.min(W, H) * 0.18, W / 2, H * 0.55, Math.max(W, H) * 0.7);
    g.addColorStop(0, 'rgba(0,0,8,0)');
    g.addColorStop(1, 'rgba(0,0,8,0.9)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
}

// 通路の先の床にある物(階段・宝箱・泉・宿屋・道具屋)を、遠いほうから順に描く
function drawFeatureSprites(ctx, W, sprites, rects, layer, layerBase) {
    for (let i = sprites.length - 1; i >= 0; i--) {
        const { depth, feature, fade } = sprites[i];
        const o = rects[depth], n = rects[depth + 1];
        if (feature.startsWith('foe:')) { drawFoe(ctx, W, +feature.slice(4), o, n, fade); continue; }
        const sign = feature === 'inn' || feature === 'shop';
        const small = feature === 'item';   // 床に落ちている道具(小さな袋のアイコン)
        // 2026-10-02: 全階層共通のCodexの絵(落ちている袋・旅の宿屋の主人・行商人)。無ければ従来のアイコン
        const artKind = { item: 'ITEM_BAG', inn: 'INN_KEEPER', shop: 'PEDDLER' }[feature];
        const art = artKind ? A.dgn('COMMON', artKind) : null;
        const standing = !!art && sign;   // 人の絵は、看板ではなく、床に立たせる
        const img = art || (small ? A.ui('icon_item') : sign ? A.ui(feature === 'inn' ? 'icon_inn' : 'icon_general_store')
            : feature === 'stairs' ? (dgn(layer, layerBase, 'STAIRS') || A.obj('下り階段'))
            : A.obj({ chest: '宝箱_閉', spring: '回復の泉' }[feature]));
        if (!img) continue;
        const cellW = (o.w + n.w) / 2;
        const w = cellW * (small ? (art ? 0.26 : 0.18) : standing ? 0.42 : sign ? 0.32 : 0.55);
        let h = img.height * (w / img.width);
        if (feature === 'stairs') h *= 0.7;   // 床にあるように、少しつぶす
        const yFloor = (o.b + n.b) / 2 + (o.b - n.b) * 0.15;
        const y = sign && !standing ? yFloor - h * 1.5 : yFloor - h;

        // 2026-09-30(Codexの提案・案1): 階段・宝箱が床に浮いて見えないよう、足元に薄い影を落として接地感を出す。
        if (feature === 'stairs' || feature === 'chest') {
            const shadowW = w * (feature === 'stairs' ? 0.9 : 0.7), shadowH = shadowW * 0.28;
            ctx.save();
            ctx.translate(W / 2, yFloor);
            ctx.scale(1, shadowH / shadowW);
            const sg = ctx.createRadialGradient(0, 0, 0, 0, 0, shadowW / 2);
            sg.addColorStop(0, `rgba(4,3,3,${0.55 * Math.max(fade, 0.5)})`);
            sg.addColorStop(1, 'rgba(4,3,3,0)');
            ctx.fillStyle = sg;
            ctx.fillRect(-shadowW / 2, -shadowW / 2, shadowW, shadowW);
            ctx.restore();
        }

        ctx.globalAlpha = Math.max(fade, 0.65);
        ctx.drawImage(img, (W - w) / 2, y, w, h);
        ctx.globalAlpha = 1;
    }
}

function drawFloorStones(ctx, o, n, fade) {
    ctx.strokeStyle = mix([30, 24, 20], fade);
    ctx.lineWidth = 1.5;
    for (let i = 1; i < 4; i++) {
        const t = i / 4;
        const a = lerp2([o.l, o.b], [n.l, n.b], t), b = lerp2([o.r, o.b], [n.r, n.b], t);
        ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.stroke();
    }
    for (let i = 1; i < 4; i++) {
        const t = i / 4;
        const a = lerp2([o.l, o.b], [o.r, o.b], t), b = lerp2([n.l, n.b], [n.r, n.b], t);
        ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.stroke();
    }
}

// 2026-09-30(Codexの提案・案1): 床と左右の壁が接する所に薄い影を入れ、「壁が床に立っている」接地感を出す。
function drawFloorContactShadow(ctx, o, n) {
    const edgeOuter = o.w * 0.09, edgeInner = n.w * 0.09;
    function strip(ox, ix, dir) {
        const g = ctx.createLinearGradient(ox, 0, ox + edgeOuter * dir, 0);
        g.addColorStop(0, 'rgba(4,3,3,0.33)');
        g.addColorStop(1, 'rgba(4,3,3,0)');
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.moveTo(ox, o.b);
        ctx.lineTo(ox + edgeOuter * dir, o.b);
        ctx.lineTo(ix + edgeInner * dir, n.b);
        ctx.lineTo(ix, n.b);
        ctx.closePath();
        ctx.fill();
    }
    strip(o.l, n.l, 1);
    strip(o.r, n.r, -1);
}

function drawBricks(ctx, r, fade) {
    ctx.strokeStyle = mix([28, 22, 18], fade);
    ctx.lineWidth = Math.max(r.h / 90, 1.2);
    const rows = 6;
    ctx.beginPath();
    for (let row = 0; row <= rows; row++) { const y = r.t + r.h * row / rows; ctx.moveTo(r.l, y); ctx.lineTo(r.r, y); }
    for (let row = 0; row < rows; row++) {
        const y1 = r.t + r.h * row / rows, y2 = r.t + r.h * (row + 1) / rows, off = row % 2 === 0 ? 0 : 0.5;
        for (let col = 0; col < 4; col++) {
            const x = r.l + r.w * (col + off) / 4;
            if (x > r.l + 1 && x < r.r - 1) { ctx.moveTo(x, y1); ctx.lineTo(x, y2); }
        }
    }
    ctx.stroke();
}

function drawSideWall(ctx, o, n, isLeft, blocked, wallColor, fade, tex) {
    const o1 = isLeft ? [o.l, o.t] : [o.r, o.t], o2 = isLeft ? [o.l, o.b] : [o.r, o.b];
    const i1 = isLeft ? [n.l, n.t] : [n.r, n.t], i2 = isLeft ? [n.l, n.b] : [n.r, n.b];
    if (!blocked) {   // 横道: 奥の暗がりだけ描く
        quad(ctx, mix([14, 11, 10], fade), [o1, i1, i2, o2]);
        return;
    }
    if (tex) {   // 壁の絵を、奥行き方向の細い縦の帯に分けて貼る(手前が高く奥が低い台形)
        const steps = Math.max(1, Math.abs(Math.round(i1[0] - o1[0])));
        const tw = tex.width, th = tex.height;
        for (let s = 0; s < steps; s++) {
            const t0 = s / steps, t1 = (s + 1) / steps;
            const xa = o1[0] + (i1[0] - o1[0]) * t0, xb = o1[0] + (i1[0] - o1[0]) * t1;
            const top = o1[1] + (i1[1] - o1[1]) * t0, bottom = o2[1] + (i2[1] - o2[1]) * t0;
            const srcX = t0 * (tw - 1), srcW = Math.max(1, tw / steps);
            ctx.drawImage(tex, srcX, 0, srcW, th, Math.min(xa, xb), top, Math.abs(xb - xa) + 1, bottom - top);
        }
        quad(ctx, `rgba(4,3,3,${darkAlpha(fade)})`, [o1, i1, i2, o2]);
        ctx.strokeStyle = 'rgba(10,8,6,0.8)'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(i1[0], i1[1]); ctx.lineTo(i2[0], i2[1]); ctx.stroke();
        return;
    }
    quad(ctx, wallColor, [o1, i1, i2, o2]);
    ctx.strokeStyle = mix([28, 22, 18], fade); ctx.lineWidth = 1.6;
    ctx.beginPath();
    for (let row = 0; row <= 6; row++) { const t = row / 6, a = lerp2(o1, o2, t), b = lerp2(i1, i2, t); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); }
    ctx.moveTo(i1[0], i1[1]); ctx.lineTo(i2[0], i2[1]);
    ctx.stroke();
}

// 2026-09-30追加(通路の見た目案2): 奥行きの区切りの角に柱の絵を縦に貼る。無ければ何も描かない。
function drawPillar(ctx, o, isLeft, image, fade = 1) {
    if (!image) return;
    const h = o.h * 1.03, w = image.width * (h / image.height);
    const x = (isLeft ? o.l : o.r) - w / 2, y = o.t - o.h * 0.015;
    ctx.globalAlpha = Math.max(fade, 0.55);
    ctx.drawImage(image, x, y, w, h);
    ctx.globalAlpha = 1;
}

// 2026-09-30追加(通路の見た目案2): 奥行きの区切りの天井にアーチ/梁の絵を渡す。無ければ何も描かない。
function drawArch(ctx, o, image, fade = 1) {
    if (!image) return;
    const w = o.w * 1.08, h = image.height * (w / image.width);
    const x = o.l - o.w * 0.04, y = o.t - h * 0.62;
    ctx.globalAlpha = Math.max(fade, 0.55);
    ctx.drawImage(image, x, y, w, h);
    ctx.globalAlpha = 1;
}

// 2026-09-30追加: image(その階層の松明絵)があれば、それを壁に掛けて描く。無ければ従来どおり手続き描画(丸い炎)。
function drawTorch(ctx, o, n, isLeft, image, fade = 1) {
    const x = ((isLeft ? o.l + n.l : o.r + n.r)) / 2;
    const y = (o.t + n.t) / 2 + (o.h + n.h) / 2 * 0.22;
    const glow = o.h * 0.55;
    const flick = 0.85 + 0.15 * Math.sin(performance.now() / 90 + (isLeft ? 0 : 2));

    // 2026-09-30(Codexの提案・案1): 松明の明かりを、炎の周りだけでなく足元の床にもうっすらにじませる。
    const floorGlowW = o.h * 0.95, floorGlowH = (o.b - n.b) * 2.2;
    const floorGlowY = o.b - floorGlowH * 0.32;
    ctx.save();
    ctx.translate(x, floorGlowY);
    ctx.scale(1, floorGlowH / floorGlowW);
    const fg = ctx.createRadialGradient(0, 0, 0, 0, 0, floorGlowW / 2);
    fg.addColorStop(0, `rgba(255,170,90,${0.23 * flick * Math.max(fade, 0.5)})`);
    fg.addColorStop(1, 'rgba(255,150,60,0)');
    ctx.fillStyle = fg;
    ctx.fillRect(-floorGlowW / 2, -floorGlowW / 2, floorGlowW, floorGlowW);
    ctx.restore();

    const g = ctx.createRadialGradient(x, y, 0, x, y, glow / 2);
    g.addColorStop(0, `rgba(255,170,60,${0.47 * flick * Math.max(fade, 0.5)})`);
    g.addColorStop(1, 'rgba(255,140,30,0)');
    ctx.fillStyle = g;
    ctx.fillRect(x - glow / 2, y - glow / 2, glow, glow);
    if (image) {
        const h = glow * 1.3, w = image.width * (h / image.height);
        ctx.globalAlpha = Math.max(fade, 0.6);
        ctx.drawImage(image, x - w / 2, y - h * 0.62, w, h);
        ctx.globalAlpha = 1;
        return;
    }
    const s = o.h * 0.045;
    ctx.fillStyle = 'rgb(70,44,24)'; ctx.fillRect(x - s * 0.4, y, s * 0.8, s * 3.2);
    ctx.fillStyle = 'rgb(255,200,64)'; ctx.beginPath(); ctx.ellipse(x, y - s * 0.8, s, s * 1.6, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = 'rgb(255,246,190)'; ctx.beginPath(); ctx.ellipse(x, y - s * 0.6, s * 0.5, s * 0.8, 0, 0, Math.PI * 2); ctx.fill();
}

// 2026-09-30追加: 床・天井のテクスチャを、奥へ向かう台形(遠近)に合わせて貼る(壁のdrawSideWallと同じ考え方)。
function drawFloorCeilTexture(ctx, o, n, ceiling, tex) {
    const oy = ceiling ? o.t : o.b, iy = ceiling ? n.t : n.b;
    const steps = Math.max(1, Math.round(Math.abs(iy - oy)));
    const tw = tex.width, th = tex.height;
    for (let s = 0; s < steps; s++) {
        const t0 = s / steps, t1 = (s + 1) / steps;
        const y0 = oy + (iy - oy) * t0, y1 = oy + (iy - oy) * t1;
        const left = o.l + (n.l - o.l) * t0, right = o.r + (n.r - o.r) * t0;
        const srcY = t0 * (th - 1), srcH = Math.max(1, th / steps);
        ctx.drawImage(tex, 0, srcY, tw, srcH, left, Math.min(y0, y1), right - left, Math.max(1, Math.abs(y1 - y0)));
    }
}

// ---------- 物体・バナー・ミニマップ ----------
function drawCenterObject(ctx, W, H, s) {
    const d = s.dungeon;
    const name = Scene.eventObj || (d.pendingChest ? '宝箱_閉' : d.onStairs ? '下り階段' : null);
    if (name) {
        const img = A.obj(name);
        if (img) {
            const h = H * 0.5, w = img.width * (h / img.height);
            ctx.drawImage(img, (W - w) / 2, H * 0.36, w, h);
        }
        return;
    }
    if (d.onInn || d.onShop) {
        const label = d.onInn ? '旅の宿屋' : '行商の道具屋';
        const icon = A.dgn('COMMON', d.onInn ? 'INN_KEEPER' : 'PEDDLER') || A.ui(d.onInn ? 'icon_inn' : 'icon_general_store');
        if (icon) ctx.drawImage(icon, W / 2 - 80, H * 0.42, 160, 160);
        roundRect(ctx, W / 2 - 170, H * 0.42 + 170, 340, 56, 14, 'rgba(38,10,36,0.85)', '#c9a24d', 2);
        ctx.fillStyle = '#f2d38a'; ctx.font = 'bold 30px "Hiragino Sans","Yu Gothic UI",sans-serif'; ctx.textAlign = 'center';
        ctx.fillText(T(label), W / 2, H * 0.42 + 208);
        ctx.textAlign = 'start';
    }
}

function bannerText(s) {
    const d = s.dungeon;
    if (!d) return null;
    if (d.pendingChest) return '宝箱だ!';
    if (d.onStairs) return '下り階段だ!';
    if (d.onInn) return '旅の宿屋だ!';
    if (d.onShop) return '行商の道具屋だ!';
    return null;
}

function drawBanner(ctx, W, H, s) {
    const text = s.state === 'Dungeon' ? bannerText(s) : null;
    if (!text) return;
    ctx.font = 'italic bold 44px "Hiragino Sans","Yu Gothic UI",sans-serif';
    const w = ctx.measureText(text).width + 70;
    roundRect(ctx, (W - w) / 2, 34, w, 74, 16, 'rgba(38,10,36,0.88)', '#c9a24d', 3);
    ctx.fillStyle = '#f2d38a'; ctx.textAlign = 'center';
    ctx.fillText(T(text), W / 2, 86);
    ctx.textAlign = 'start';
}

function drawMinimap(ctx, W, H, d) {
    const rows = d.minimap;
    if (!rows) return;
    const cs = 9, vw = 21, vh = 13;   // 見える範囲(マス)
    const x0 = W - vw * cs - 24, y0 = 124;
    roundRect(ctx, x0 - 6, y0 - 6, vw * cs + 12, vh * cs + 12, 8, 'rgba(26,12,24,0.78)', '#8a6a2a', 2);
    const cx = d.x, cy = d.y;
    for (let dy = -Math.floor(vh / 2); dy <= Math.floor(vh / 2); dy++) {
        for (let dx = -Math.floor(vw / 2); dx <= Math.floor(vw / 2); dx++) {
            const gx = cx + dx, gy = cy + dy;
            const ch = rows[gy] ? rows[gy][gx] : undefined;
            if (!ch || ch === ' ') continue;
            const px = x0 + (dx + Math.floor(vw / 2)) * cs, py = y0 + (dy + Math.floor(vh / 2)) * cs;
            ctx.fillStyle = MAP_COLORS[ch] || '#e8e0d0';
            ctx.fillRect(px, py, cs - 1, cs - 1);
        }
    }
    // 現在地と向き
    const px = x0 + Math.floor(vw / 2) * cs + cs / 2, py = y0 + Math.floor(vh / 2) * cs + cs / 2;
    ctx.fillStyle = '#ff8c14';
    ctx.beginPath(); ctx.arc(px, py, cs * 0.55, 0, Math.PI * 2); ctx.fill();
    // 2026-09-30(Codex提案「小地図で現在の向きを明示」): 細い線ではなく、向いている方向を指す白い三角にする
    const ang = [-Math.PI / 2, 0, Math.PI / 2, Math.PI][d.facing ?? 0];
    ctx.save(); ctx.translate(px, py); ctx.rotate(ang);
    ctx.fillStyle = '#fff'; ctx.strokeStyle = '#000'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(cs * 1.05, 0); ctx.lineTo(-cs * 0.2, -cs * 0.6); ctx.lineTo(0, 0); ctx.lineTo(-cs * 0.2, cs * 0.6); ctx.closePath();
    ctx.fill(); ctx.stroke(); ctx.restore();
}

const MAP_COLORS = { '*': '#9be07a', '#': '#786e64', '.': '#e6dcc8', '^': '#c82828', '$': '#dcaa1e', '~': '#3caad2', '<': '#466edc', '>': '#466edc', H: '#5abe5a', S: '#aa6edc', '@': '#ff8c14', F: '#ff2020', L: '#d6a01e' };

// ---------- 戦闘 ----------
function drawEnemies(ctx, W, H, battle) {
    if (!battle) return;
    const list = battle.enemies, n = list.length;
    if (!n) return;
    const areaW = W * 0.92, cellW = Math.min(420, areaW / n), base = H * 0.72, maxH = H * 0.6;
    const total = cellW * n, startX = (W - total) / 2;
    for (const k of [...Scene.enemyAnim.keys()]) if (!list.includes(k)) Scene.enemyAnim.delete(k);   // 画面の入れ替え後は、古い演出を捨てる
    list.forEach((e, i) => {
        const img = A.monster(e.id);
        const cx = startX + cellW * (i + 0.5);
        const an = enemyAnimState(e);
        if (an && an.kind === 'flee' && an.t >= 1) { Scene.enemyRects.push({ i, x: cx - cellW / 2, y: base - 20, w: cellW, h: 100 }); return; }   // 逃げたあとは、消えるのを待つだけ
        let alpha = e.hp <= 0 && e.maxHp > 0 ? 0.18 : 1;   // 倒した敵(メッセージを見せている間)は薄く
        let dw = cellW * 0.9, dh = dw;
        let ox = 0, oy = 0, squash = 1, flash = 0;
        if (an) {
            const t = an.t;
            if (an.kind === 'hit') { ox = Math.sin(t * 30) * 16 * (1 - t); flash = (1 - t) * 0.7; }
            else if (an.kind === 'defeat') { alpha = 1 - t * 0.82; squash = 1 - t * 0.3; flash = Math.max(0, 0.8 - t * 4); }
            else if (an.kind === 'flee') { const dir = cx < W / 2 ? -1 : 1; ox = dir * t * t * cellW * 1.5; oy = -Math.abs(Math.sin(t * 18)) * 18; alpha = 1 - t * 0.9; }
            else if (an.kind === 'scared') { ox = Math.sin(t * 70) * 6; }
        }
        let sx = cx - dw / 2, sy = base - dh;
        if (img) {
            const k = Math.min(cellW * 0.95 / img.width, maxH / img.height);
            dw = img.width * k; dh = img.height * k * squash;
            sx = cx - dw / 2 + ox; sy = base - dh + oy;
            ctx.globalAlpha = alpha;
            ctx.drawImage(img, sx, sy, dw, dh);
            if (flash > 0) { ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = Math.min(1, flash); ctx.drawImage(img, sx, sy, dw, dh); ctx.globalCompositeOperation = 'source-over'; }
        } else {
            ctx.globalAlpha = alpha;
            roundRect(ctx, cx - dw / 2 + ox, base - dh + oy, dw, dh, 12, '#2a1a2a', '#8a6a2a', 2);
        }
        if (an && an.kind === 'flee') {   // 足元の土煙
            ctx.fillStyle = '#d8c8a8';
            for (let p = 0; p < 5; p++) {
                const pt = Math.min(1, an.t * 1.2 + p * 0.06), px = cx + ox - (cx < W / 2 ? -1 : 1) * p * 22, py = base - 8 - p * 5;
                ctx.globalAlpha = Math.max(0, 0.5 - pt * 0.5);
                ctx.beginPath(); ctx.arc(px, py, 10 + p * 5 * pt, 0, Math.PI * 2); ctx.fill();
            }
        }
        if (an && an.kind === 'scared') {   // 冷や汗
            ctx.fillStyle = '#9fdcff';
            for (let p = 0; p < 3; p++) {
                const pt = (an.t * 2 + p * 0.33) % 1;
                ctx.globalAlpha = 1 - pt;
                ctx.beginPath(); ctx.ellipse(sx + dw * (0.3 + p * 0.2), sy + dh * 0.1 + pt * dh * 0.18, 5, 8, 0, 0, Math.PI * 2); ctx.fill();
            }
        }
        ctx.globalAlpha = an && an.kind === 'flee' ? alpha : (e.hp <= 0 && e.maxHp > 0 ? 0.18 : 1);
        // 名前とHP
        const frac = e.maxHp > 0 ? Math.max(0, e.hp / e.maxHp) : 0;
        const bw = Math.min(cellW * 0.8, 240), by = base + 12;
        ctx.font = 'bold 26px "Hiragino Sans","Yu Gothic UI",sans-serif'; ctx.textAlign = 'center';
        ctx.fillStyle = 'rgba(0,0,0,0.6)'; ctx.fillText(T(e.name), cx + 2, by + 26 + 2);
        ctx.fillStyle = i === battle.target ? '#ffe28a' : '#f4ecd6'; ctx.fillText(T(e.name), cx, by + 26);
        ctx.fillStyle = '#0a0409'; ctx.fillRect(cx - bw / 2, by + 36, bw, 14);
        ctx.fillStyle = frac < 0.3 ? '#e08a1a' : '#d0324a'; ctx.fillRect(cx - bw / 2, by + 36, bw * frac, 14);
        ctx.strokeStyle = '#000'; ctx.lineWidth = 2; ctx.strokeRect(cx - bw / 2, by + 36, bw, 14);
        ctx.textAlign = 'start';
        ctx.globalAlpha = 1;
        if (i === battle.target) {   // 選んでいる敵に、三角の印
            ctx.fillStyle = '#ffe28a';
            ctx.beginPath(); ctx.moveTo(cx - 16, base - dh - 8); ctx.lineTo(cx + 16, base - dh - 8); ctx.lineTo(cx, base - dh + 14); ctx.closePath(); ctx.fill();
        }
        Scene.enemyRects.push({ i, x: cx - cellW / 2, y: base - dh - 20, w: cellW, h: dh + 100 });
    });
}

function drawPartyBattle(ctx, W, H, s) {
    // 味方の立ち絵(右下に小さく)
    const party = s.party || [];
    const w = 120, gap = 6, x0 = W - (w + gap) * party.length - 14, y = H - 210;
    party.forEach((m, i) => {
        const img = A.party(m.job);
        if (!img) return;
        const h = img.height * (w / img.width);
        ctx.globalAlpha = m.down ? 0.4 : 1;
        ctx.drawImage(img, x0 + i * (w + gap), y + (170 - h), w, h);
        ctx.globalAlpha = 1;
    });
}

// ---------- 効果 ----------
function playEffect(name, onParty) {
    if (G.settings.effects === 'off' || !name) return;
    if (onParty) return;   // 味方側の演出は、冒険者のカードに出す(partyFx)
    G.fx = { name, onParty: false, t0: performance.now() };
    requestRedraw();
}

// 魔法演出(2026-10-01): 魔法の効果に重ねる魔法陣。二重の輪が逆向きに回り、六芒星とルーンの刻みが光って、広がりながら消える。色は魔法の種類で変わる。
const MAGIC_COLORS = {
    '炎': '#ff8232', '連鎖爆発': '#ff8232', '爆発': '#ff8232', '氷': '#78cdff', '雷': '#ffe85a', '聖': '#fff2b4', '闇': '#b060e2',
    '毒': '#96e05a', '回復': '#78e896', 'バフ': '#82cdff', 'デバフ': '#d26482', '魔法陣': '#ffffd2',
};

// 魔法陣の絵(純白)を、魔法の色に染めた物(色ごとに1回だけ作る)
const MAGIC_TINT = new Map();
function tintedMagic(kind, color) {
    const key = kind + color;
    if (MAGIC_TINT.has(key)) return MAGIC_TINT.get(key);
    const img = A.mg(kind);
    if (!img) return null;
    const c = document.createElement('canvas'); c.width = c.height = 512;
    const x = c.getContext('2d');
    x.drawImage(img, 0, 0, 512, 512);
    x.globalCompositeOperation = 'source-in'; x.fillStyle = color; x.fillRect(0, 0, 512, 512);
    MAGIC_TINT.set(key, c);
    return c;
}

// 2026-10-02: Codexの魔法陣の絵(外輪・六芒星・床の光)で描く。絵が読めていなければfalse(線で描く従来の魔法陣にする)
function drawMagicCircleArt(ctx, cx, cy, size, t, color) {
    const ring = tintedMagic('MAGIC_RING', color), star = tintedMagic('MAGIC_STAR', color), glow = tintedMagic('MAGIC_GLOW', color);
    if (!ring || !star || !glow) return false;
    const radius = Math.max(size * 0.62, 120) * (0.62 + 0.38 * Math.min(1, t * 2.2));
    const alpha = Math.max(0, Math.min(1, t < 0.15 ? t / 0.15 : 1 - (t - 0.55) / 0.45));
    const spin = t * 220 * Math.PI / 180;
    ctx.save();
    ctx.translate(cx, cy);
    ctx.scale(1, 0.42);        // 床に描いた円を、斜めから見ているように、縦につぶす
    const put = (img, w, rot, a) => { ctx.save(); ctx.rotate(rot); ctx.globalAlpha = a; ctx.drawImage(img, -w / 2, -w / 2, w, w); ctx.restore(); };
    put(glow, radius * 4.2, 0, alpha * 0.6);
    put(ring, radius * 3.45, -spin, alpha);         // 外輪(ルーン): 逆向きに回る
    put(star, radius * 3.5, spin * 0.7, alpha);     // 六芒星: 正方向に回る
    ctx.restore();
    ctx.globalAlpha = 1;
    return true;
}

function drawMagicCircle(ctx, cx, cy, size, t, color) {
    if (drawMagicCircleArt(ctx, cx, cy, size, t, color)) return;
    const radius = Math.max(size * 0.62, 120) * (0.62 + 0.38 * Math.min(1, t * 2.2));
    const alpha = Math.max(0, Math.min(1, t < 0.15 ? t / 0.15 : 1 - (t - 0.55) / 0.45));
    const squash = 0.42;     // 床に描いた円を、斜めから見ているように、縦につぶす
    const spin = t * 220 * Math.PI / 180;
    ctx.save();
    ctx.translate(cx, cy);
    ctx.scale(1, squash);
    ctx.fillStyle = color; ctx.globalAlpha = alpha / 4;
    ctx.beginPath(); ctx.arc(0, 0, radius * 1.1, 0, Math.PI * 2); ctx.fill();
    ctx.globalAlpha = alpha;
    ctx.strokeStyle = color; ctx.lineWidth = 4;
    ctx.shadowColor = color; ctx.shadowBlur = 14;
    ctx.beginPath(); ctx.arc(0, 0, radius, 0, Math.PI * 2); ctx.stroke();
    ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.arc(0, 0, radius * 0.9, 0, Math.PI * 2); ctx.stroke();
    ctx.beginPath(); ctx.arc(0, 0, radius * 0.4, 0, Math.PI * 2); ctx.stroke();
    ctx.save();                // 外側の刻み(ルーン): 逆向きに回る
    ctx.rotate(-spin);
    for (let i = 0; i < 24; i++) {
        ctx.rotate(Math.PI / 12);
        const len = i % 3 === 0 ? radius * 0.12 : radius * 0.06;
        ctx.beginPath(); ctx.moveTo(0, -radius * 0.9); ctx.lineTo(0, -radius * 0.9 + len); ctx.stroke();
    }
    ctx.restore();
    ctx.rotate(spin * 0.7);    // 六芒星: 正方向に回る
    ctx.lineWidth = 4;
    for (let k = 0; k < 2; k++) {
        ctx.beginPath();
        for (let i = 0; i < 3; i++) {
            const a = (i * 120 + k * 60) * Math.PI / 180, x = Math.sin(a) * radius * 0.78, y = -Math.cos(a) * radius * 0.78;
            if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
        }
        ctx.closePath(); ctx.stroke();
    }
    ctx.restore();
    ctx.globalAlpha = 1; ctx.shadowBlur = 0;
}

function drawEffect(ctx, W, H, ts) {
    const fx = G.fx;
    if (!fx) return;
    const dur = (G.settings.effects === 'fast' ? 375 : 750);
    const t = (performance.now() - fx.t0) / dur;
    if (t >= 1) { G.fx = null; return; }
    const img = A.fx(fx.name);
    const magic = MAGIC_COLORS[fx.name];
    if (!img && !magic) return;
    let cx = W / 2, cy = H * 0.5, size = 360;
    const s = G.snap;
    if (fx.onParty) { cx = W * 0.8; cy = H * 0.78; size = 260; }
    else if (s && s.state === 'Battle' && s.battle && Scene.enemyRects.length) {
        const r = Scene.enemyRects[Math.max(0, s.battle.target)] || Scene.enemyRects[0];
        cx = r.x + r.w / 2; cy = r.y + r.h * 0.4; size = Math.max(200, r.w * 0.9);
    }
    if (magic) drawMagicCircle(ctx, cx, cy + size * 0.12, size, t, magic);
    if (!img) return;
    const scale = 0.6 + 0.6 * Math.min(1, t * 1.4);
    ctx.globalAlpha = t < 0.15 ? t / 0.15 : Math.max(0, 1 - (t - 0.5) / 0.5);
    const k = size * scale / Math.max(img.width, img.height);
    ctx.drawImage(img, cx - img.width * k / 2, cy - img.height * k / 2, img.width * k, img.height * k);
    ctx.globalAlpha = 1;
}

function drawVignette(ctx, W, H) {
    const g = ctx.createRadialGradient(W / 2, H / 2, H * 0.45, W / 2, H / 2, H * 0.95);
    g.addColorStop(0, 'rgba(0,0,0,0)');
    g.addColorStop(1, 'rgba(0,0,0,0.5)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
}
