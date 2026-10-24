/* 霧の灯台 run.js  ひと夜ラン/日替わりの夜の進行管理。DOM非依存(Nodeで動く)。 */
(function (root) {
'use strict';
function factory(DATA) {
  var RELICS = [
    { id: 'P01', name: '灯芯の祈り', desc: '灯火台の光半径+0.2', tags: ['光'], mods: { lightT1: 0.2 } },
    { id: 'P02', name: '双子星', desc: '相性が成り立つ距離+0.5マス', tags: ['相性'], mods: { synRAdd: 0.5 } },
    { id: 'P03', name: '古い蝋', desc: '維持費-1(全ライト、最低1)', tags: ['経済'], mods: { upkeepMinus: 1 } },
    { id: 'P04', name: '渡り鳥', desc: '飛行敵への被ダメージ+20%', tags: ['対空'], mods: { airMul: 1.2 } },
    { id: 'P05', name: '満ち潮', desc: '光から出ても0.5秒長く見え続ける', tags: ['情報'], mods: { afterAdd: 0.5 } },
    { id: 'P06', name: 'ひと灯り+', desc: 'ポウのひと灯りの再充電-10秒', tags: ['手動'], mods: { flashCdMinus: 10 } },
    { id: 'P07', name: '鐘の音', desc: '3波ごとに全敵が3秒ゆっくりになる', tags: ['保険'], mods: { bellEvery: 3 } },
    { id: 'P08', name: '母の手紙', desc: '夜の始めに灯台HP+2', tags: ['回復'], mods: { startHp: 2 } },
    { id: 'P09', name: '銛の誓い', desc: '銛台の最初の1射がダメージ2倍', tags: ['銛'], mods: { t2First: 1 } },
    { id: 'P10', name: '氷の記憶', desc: '氷灯の減速が1秒長く続く', tags: ['氷'], mods: { slowDurAdd: 1 } },
    { id: 'P11', name: '油の泉', desc: '夜の始めに油+30', tags: ['経済'], mods: { startOil: 30 } },
    { id: 'P12', name: '小さな勇気', desc: '灯台HP5以下で全塔の攻撃+15%', tags: ['逆転'], mods: { braveAtk: 1 } },
    { id: 'P13', name: '風の守り', desc: '全ライトの光半径+6%', tags: ['光'], mods: { lightAllMul: 1.06 }, unlock: 60 },
    { id: 'P14', name: '帰り道の油', desc: '撃破の油+10%', tags: ['経済'], mods: { oilMul: 1.1 }, unlock: 60 },
    { id: 'P15', name: '星拾いの網', desc: '流れ星が4秒長く残り、回収時の油+6', tags: ['回収'], mods: { pickupDurAdd: 4, starOilAdd: 6 } },
    { id: 'P16', name: '潮時の鐘', desc: '早呼びの油+5。次の波を早く呼ぶほど得', tags: ['進行'], mods: { earlyOilAdd: 5 } },
    { id: 'P17', name: '連鎖の種', desc: '5連続撃破ごとのボーナス油+3', tags: ['連鎖'], mods: { comboOilAdd: 3 } },
    { id: 'P18', name: '漂流瓶の火', desc: '宝箱の攻撃強化が35秒続き、効果が強くなる', tags: ['回収'], mods: { chestDurAdd: 15, chestDmgAdd: 0.1 } }
  ];
  var RULES = [
    { id: 'D1', name: '光のうすい夜', desc: '光半径×0.9・撃破油+15%', mods: { lightAllMul: 0.9, oilMul: 1.15 } },
    { id: 'D2', name: '維持費の夜', desc: '維持費が1.5倍', mods: { upkeepMul: 1.5 } },
    { id: 'D3', name: '三つの灯りの夜', desc: '使える灯りは灯火台・銛台・霧笛砲・油汲み', banned: ['T4', 'T5', 'T6', 'T8'], mods: {} },
    { id: 'D4', name: '鏡のない夜', desc: '反射鏡と大レンズは使えない', banned: ['T6', 'T8'], mods: {} },
    { id: 'D5', name: 'ひと灯りの夜', desc: 'ひと灯りの再充電が半分(23秒)', mods: { flashCdMinus: 22 } },
    { id: 'D6', name: '氷と雷の夜', desc: '霧笛砲と油汲みは使えない', banned: ['T3', 'T7'], mods: {} }
  ];
  var BANDS = [[1, 2, 3], [4, 5, 6], [7, 8, 9], [10, 11, 12]];
  var HPRUN = [1.0, 1.0, 0.65, 0.6];
  var NIGHTS = 4, HEAL = 3, SKIP_OIL = 20, MAX_RELICS = 4;
  function mulberry32(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; var t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
  function relic(id) { for (var i = 0; i < RELICS.length; i++) if (RELICS[i].id === id) return RELICS[i]; return null; }
  function aggregate(list) {
    var m = {}; list.forEach(function (mods) { for (var k in mods) {
      if (k === 'airMul' || k === 'lightAllMul' || k === 'oilMul' || k === 'upkeepMul') m[k] = (m[k] || 1) * mods[k];
      else if (k === 'bellEvery') m[k] = m[k] ? Math.min(m[k], mods[k]) : mods[k];
      else m[k] = (m[k] || 0) + mods[k];
    } }); return m;
  }
  function create(seed, o) {
    o = o || {}; var rule = o.rule || null, rng = mulberry32((seed ^ 0x77) | 0), banned;
    if (rule && rule.banned) banned = rule.banned.slice(); else { var pool = ['T3', 'T5', 'T6', 'T7', 'T8']; banned = o.noBan ? [] : [pool[Math.floor(rng() * pool.length)]]; }
    return { seed: seed, night: 0, hp: 20, relics: [], rule: rule, banned: banned, carryOil: 0, nights: [], kills: 0, over: false, win: false, returnedMeta: o.returned || 0, daily: !!o.daily, flashes: 0 };
  }
  function mods(run) { var l = run.relics.map(function (id) { return relic(id).mods; }); if (run.rule) l.push(run.rule.mods || {}); return aggregate(l); }
  function waveIdx(N) { var a = [0, 1, Math.floor(N / 2), Math.floor(N * 0.75), N - 1], out = []; a.forEach(function (i) { if (i >= 0 && i < N && out.indexOf(i) < 0) out.push(i); }); return out.sort(function (x, y) { return x - y; }); }
  function choices(run) { return BANDS[Math.min(run.night, NIGHTS - 1)].slice(); }
  function gameOpts(run, stageId) {
    var st = DATA.STAGES[stageId - 1], m = mods(run), pct = Math.min(5, Math.floor(run.returnedMeta / 100));
    return { seed: ((run.seed * 131 + run.night * 17 + stageId) & 0x7fffffff) || 1, waveIdx: waveIdx(st.waves.length), hp0: Math.min(20, run.hp + (m.startHp || 0)),
      oil0: Math.round((st.oil + (m.startOil || 0) + run.carryOil) * (1 + pct / 100)), mods: m, banned: run.banned, adapt: true, run: true, blockN: run.night >= 2 ? 2 : 1, hpRun: HPRUN[Math.min(run.night, NIGHTS - 1)] };
  }
  function offer(run) {
    var pool = RELICS.filter(function (r) { return (!r.unlock || run.returnedMeta >= r.unlock) && run.relics.indexOf(r.id) < 0; });
    var rng = mulberry32((run.seed ^ ((run.night + 1) * 0x9E37)) | 0), out = []; while (out.length < 3 && pool.length) { var k = Math.floor(rng() * pool.length); out.push(pool[k].id); pool.splice(k, 1); } return out;
  }
  function finishNight(run, stageId, g) {
    var win = g.phase === 'WIN', res = { stage: stageId, win: win, hp: g.base.hp, leaks: g.stats.leaks, kills: g.stats.kills, flashes: g.stats.flashes || 0 };
    run.kills += g.stats.kills; run.flashes += res.flashes; run.nights.push(res); run.carryOil = 0;
    if (win) { run.hp = Math.min(20, g.base.hp + HEAL); run.night++; if (run.night >= NIGHTS) { run.over = true; run.win = true; } } else { run.over = true; run.win = false; }
    return res;
  }
  function pick(run, id) { if (id === 'skip') { run.carryOil += SKIP_OIL; return; } if (run.relics.length < MAX_RELICS) run.relics.push(id); else run.relics.shift(), run.relics.push(id); }
  function score(run) { var cleared = run.nights.filter(function (n) { return n.win; }).length; return cleared * 1000 + run.hp * 20 + run.kills; }
  function emoji(run) { var s = run.nights.map(function (n) { return n.win ? (n.leaks ? '🌫' : '🕯') : '💧'; }).join(''); for (var i = run.nights.length; i < NIGHTS; i++) s += '▫'; return s; }
  function jstDate(ms) { var d = new Date(ms + 9 * 3600 * 1000); return { y: d.getUTCFullYear(), m: d.getUTCMonth() + 1, d: d.getUTCDate() }; }
  function dailySeed(ms) { var j = jstDate(ms); return j.y * 10000 + j.m * 100 + j.d; }
  function dailyRule(seed) { return RULES[seed % RULES.length]; }
  function shareText(run, label) {
    var cleared = run.nights.filter(function (n) { return n.win; }).length;
    return '霧の灯台 ' + label + '\n' + (run.win ? '夜明けまで帰り着いた' : (cleared + 1) + '夜目で霧に迷った') + ' / 灯台HP ' + run.hp + ' / 帰った迷子 ' + run.kills + '\n' + emoji(run) + '\n祈り: ' + (run.relics.map(function (id) { return relic(id).name; }).join('・') || 'なし') + ' #霧の灯台';
  }
  return { RELICS: RELICS, RULES: RULES, BANDS: BANDS, HPRUN: HPRUN, NIGHTS: NIGHTS, relic: relic, create: create, mods: mods, choices: choices, gameOpts: gameOpts, offer: offer, finishNight: finishNight, pick: pick, score: score, emoji: emoji, dailySeed: dailySeed, dailyRule: dailyRule, jstDate: jstDate, shareText: shareText, aggregate: aggregate, waveIdx: waveIdx, mulberry32: mulberry32 };
}
if (typeof module !== 'undefined' && module.exports) module.exports = factory;
else { root.Fog = root.Fog || {}; root.Fog.Run = factory(root.Fog.DATA); }
})(typeof window !== 'undefined' ? window : this);
