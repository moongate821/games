// 英語版(設定で切り替え)。2026-10-02追加(ユーザー依頼)。ゲームの中身は日本語のまま動かし、画面に出す直前に T() で英語にする。
// Windows版(Game.Systems\Loc.cs)と、同じ手順。辞書は data/localization_en.json(tools\loc\build.py で作る)。
'use strict';

const LOC = { exact: {}, names: {}, terms: [], templates: [], nameRe: null, namePre: null, lits: [], cache: new Map(), loaded: false };
const LOC_JP = /[぀-ヿ一-鿿]/;

function locEnglish() { return !!(typeof G !== 'undefined' && G.settings && G.settings.lang === 'en'); }
const locHas = (o, k) => Object.prototype.hasOwnProperty.call(o, k);

async function locLoad() {
    try {
        const r = await fetch('data/localization_en.json');
        if (!r.ok) return;
        const d = await r.json();
        LOC.exact = d.exact || {}; LOC.names = d.names || {}; LOC.lits = d.lits || [];
        LOC.terms = Object.entries(d.terms || {}).sort((a, b) => b[0].length - a[0].length);
        LOC.templates = (d.templates || []).map(([re, en, key]) => [new RegExp(re, 'g'), en, key || '']);
        const keys = Object.keys(LOC.names).sort((a, b) => b.length - a.length).map(k => k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
        LOC.nameRe = keys.length ? new RegExp(keys.join('|'), 'g') : null;
        const longKeys = (d.pre || []).map(k => k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
        LOC.namePre = longKeys.length ? new RegExp(longKeys.join('|'), 'g') : null;
        LOC.cache.clear(); LOC.loaded = true;
        if (typeof refresh === 'function' && locEnglish()) refresh();
    } catch (_) { /* 辞書が読めなくても、日本語で遊べる */ }
}

function locFallback(seg) {
    let s = seg;
    if (LOC.nameRe) s = s.replace(LOC.nameRe, m => LOC.names[m]);
    if (LOC_JP.test(s)) for (const [ja, en] of LOC.terms) if (s.includes(ja)) s = s.split(ja).join(en);
    // 区切りの記号を、英語の書き方に
    return s.replace(/、/g, ', ').replace(/・/g, ' / ').replace(/。/g, '. ').replace(/[「」]/g, '"').trimEnd();
}

function locLits(s, longOnly) {
    for (const [ja, en] of LOC.lits) {
        if (!LOC_JP.test(s)) break;
        if ((ja.length >= 10) === longOnly && s.includes(ja)) s = s.split(ja).join(en);
    }
    return s;
}

function locTemplates(s) {
    for (const [re, en, key] of LOC.templates) {
        if (!LOC_JP.test(s)) break;
        if (key && !s.includes(key)) continue;
        re.lastIndex = 0;
        s = s.replace(re, (...m) => en.replace(/\$(\d)/g, (_, d) => locGroup(m[+d] || '')));
    }
    return s;
}

function locGroup(v) {
    if (!v || !LOC_JP.test(v)) return v;
    if (locHas(LOC.names, v)) return LOC.names[v];
    if (locHas(LOC.exact, v)) return LOC.exact[v];
    return locFallback(locTemplates(v));
}

function locLine(line) {
    const trimmed = line.trim();
    if (locHas(LOC.exact, trimmed)) return LOC.exact[trimmed];
    let s = locLits(line, true);    // (1)placeholderの無い、長い(具体的な)文
    s = locTemplates(s);            // (2)placeholderのある型
    s = locLits(s, false);          // (3)placeholderの無い、短めの文
    if (LOC_JP.test(s)) {
        s = s.split(/(?<=[。!?!?])\s*/).map(p => p.trim()).filter(Boolean)
            .map(p => !LOC_JP.test(p) ? p : locHas(LOC.exact, p) ? LOC.exact[p] : locHas(LOC.names, p) ? LOC.names[p] : locFallback(p)).join(' ');
    }
    s = s.replace(/([.!?])([A-Z])/g, '$1 $2');
    if (/[。、]/.test(s)) s = s.replace(/。/g, '. ').replace(/、/g, ', ').trimEnd();
    return s;
}

function locTranslate(text) {
    if (locHas(LOC.exact, text)) return LOC.exact[text];
    if (locHas(LOC.names, text)) return LOC.names[text];
    return text.split('\n').map(line => (!line || !LOC_JP.test(line)) ? line : locLine(line)).join('\n');
}

// 画面に出す文を、英語版のときだけ英語にする。日本語を含まない文・日本語版のときは、そのまま
function T(ja) {
    if (typeof ja !== 'string' || !ja || !LOC.loaded || !locEnglish() || !LOC_JP.test(ja)) return ja;
    let r = LOC.cache.get(ja);
    if (r === undefined) { r = locTranslate(ja); if (LOC.cache.size > 20000) LOC.cache.clear(); LOC.cache.set(ja, r); }
    return r;
}
