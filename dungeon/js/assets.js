// 画像の読み込み(読み込み中はnullを返し、読み込めたら画面を描き直す)。無い画像は null のまま。
'use strict';

const IMG = { cache: new Map() };

function image(path) {
    let e = IMG.cache.get(path);
    if (e) return e.ok ? e.img : null;
    const img = new Image();
    e = { img, ok: false, failed: false };
    img.onload = () => { e.ok = true; if (typeof requestRedraw === 'function') requestRedraw(); };
    img.onerror = () => { e.failed = true; };
    img.decoding = 'async';
    img.src = path;
    IMG.cache.set(path, e);
    return null;
}

const A = {
    // 裏ボス(101 終焉竜ニヒル・102 虚空の守護騎士)の絵は、ダンジョン素材(SECRETの2枚)として届く。
    // 2026-10-02: 裏ボスも、原画(高解像度)の img/monster/{id}.webp を使う(以前は、128角のダンジョン素材)
    monster: id => image(`img/monster/${id}.webp`),
    bg: code => image(`img/bg/${code}.webp`),
    npc: id => image(`img/npc/${id}.webp`),
    obj: name => image(`img/obj/${name}.webp`),
    fx: name => image(`img/fx/${name}.webp`),
    party: job => image(`img/party/${job}.webp`),
    ui: name => image(`img/ui/${name}.webp`),
    mg: kind => image(`img/mg/${kind}.webp`),   // ミニゲーム素材(魔法陣の絵など)
    // 2026-09-30追加(ユーザー指定「各階層の壁や松明などを色々そろえたい」): 階層ごとのダンジョン素材。
    // その階層の絵がまだ無ければ、404で failed になって null が返り続けるだけ(呼び出し側がフォールバックする)。
    dgn: (layer, kind) => image(`img/dgn/${layer}_${kind}.webp`),
    item: id => image(`img/item/${id}.webp`),
    itemUrl: id => `img/item/${id}.webp`,
    uiUrl: name => `img/ui/${name}.webp`,
    faceUrl: url => url,
};

// 起動時に、最初の画面で使う画像を先に読んでおく
function preloadCore() {
    ['bg/TOWN_001', 'ui/wall_dungeon', 'ui/wall_cave', 'obj/宝箱_閉', 'obj/下り階段'].forEach(p => image(`img/${p}.webp`));
    for (let i = 1; i <= 10; i++) image(`img/face/race_${i}.webp`);
    ['MAGIC_RING', 'MAGIC_STAR', 'MAGIC_GLOW'].forEach(k => image(`img/mg/${k}.webp`));
}
