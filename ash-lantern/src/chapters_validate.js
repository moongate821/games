'use strict';
/* 章データの検証: 問題の一覧を返す(空 = 問題なし)。__g.validate() と tools/chapter_check.html から呼ぶ。 */
function validateChapters() {
  const out = [], add = s => out.push(s);
  const stageOk = s => STAGES.includes(s);
  const condOk = (c, where) => {
    if (!c) return;
    for (const term of c.split('&')) {
      const t = term.trim().replace(/^!/, '');
      for (const a of t.split('|')) {
        const i = a.indexOf(':'), k = a.slice(0, i), v = a.slice(i + 1);
        if (!['flag', 'st', 'ge'].includes(k) || !v) add(`${where}: 条件の書き方が不正 "${c}"`);
        else if ((k === 'st' || k === 'ge') && !stageOk(v)) add(`${where}: 条件の段階が無い "${v}"`);
      }
    }
  };
  const pointOk = (at, mid, where) => {
    if (typeof at === 'string') {
      const i = at.indexOf('@'), m = i < 0 ? mid : at.slice(0, i), nm = i < 0 ? at : at.slice(i + 1);
      if (!MAPS[m]) { add(`${where}: マップが無い "${m}"`); return null; }
      if (!(MAPS[m].points || {})[nm]) { add(`${where}: 名前付きの場所が無い "${at}"`); return null; }
      return MAPS[m].points[nm];
    }
    if (!Array.isArray(at) || at.length < 2) { add(`${where}: 座標の書き方が不正`); return null; }
    const m = MAPS[mid];
    if (m) { const w = m.tiles[0].length, h = m.tiles.length; if (at[0] < 0 || at[1] < 0 || at[0] >= w || at[1] >= h) add(`${where}: 座標が範囲外 (${at[0]},${at[1]})`); }
    return at;
  };
  const KNOWN = ['s', 'n', 'flag', 'sfx', 'toast', 'recall', 'sleep', 'fadein', 'hook', 'card', 'bgm', 'tint', 'heal', 'walk', 'actor', 'levelup', 'bg', 'pic', 'end', 'end_game', 'stage', 'give', 'gear', 'equip', 'join', 'leave', 'battle', 'goto', 'ask', 'if'];
  const walk = (script, name) => {
    if (!Array.isArray(script)) { add(`台本 ${name}: 配列ではない`); return; }
    for (const op of script) {
      if (!Array.isArray(op)) { add(`台本 ${name}: 命令が配列ではない`); continue; }
      const k = op[0], w = `台本 ${name} [${k}]`;
      if (!KNOWN.includes(k)) add(`${w}: 不明な命令`);
      else if (k === 's' && (op.length < 3 || !op[2])) add(`${w}: 台詞が空`);
      else if (k === 'if') { condOk(op[1], w); walk(op[2] || [], name); if (op[3]) walk(op[3], name); }
      else if (k === 'stage' && !stageOk(op[1])) add(`${w}: 段階が無い "${op[1]}"`);
      else if (k === 'battle') { if (!Array.isArray(op[1]) || !op[1].length || op[1].length > 3) add(`${w}: 敵は1〜3体`); else op[1].forEach(e => { if (!ENEMIES[e]) add(`${w}: 敵が無い "${e}"`); }); }
      else if (k === 'goto') { if (!MAPS[op[1]]) add(`${w}: マップが無い "${op[1]}"`); else pointOk(op[2], op[1], w); }
      else if (k === 'join') { if (!ALLIES[op[1]]) add(`${w}: 仲間が無い "${op[1]}"`); }
      else if (k === 'gear' || k === 'equip') { const id = k === 'gear' ? op[1] : op[3]; if (!GEAR[id]) add(`${w}: 装備が無い "${id}"`); }
      else if (k === 'give') { if (!ITEMS[op[1]]) add(`${w}: 道具が無い "${op[1]}"`); }
      else if (k === 'ask') { if (!Array.isArray(op[3]) || !Array.isArray(op[4]) || op[3].length !== op[4].length) add(`${w}: 選択肢と台本の数が合わない`); else op[4].forEach(b => walk(b, name)); }
      else if (k === 'actor' && op[1] === 'add' && op[2] && op[2].story && !STORY[op[2].story]) add(`${w}: 台本が無い "${op[2].story}"`);
    }
  };
  for (const [name, sc] of Object.entries(STORY)) walk(sc, name);
  for (const id of Object.keys(MAPS)) {
    const m = MAPS[id], w = m.tiles[0].length;
    if (!m.tiles.every(r => r.length === w)) add(`マップ ${id}: 行の長さが揃っていない`);
    if (!(m.points || {}).start && !['V', 'W', 'K'].includes(id)) add(`マップ ${id}: points.start が無い`);
    for (const [nm, p] of Object.entries(m.points || {})) pointOk(p, id, `マップ ${id} 点 ${nm}`);
  }
  for (const z of CHREG.zones) { const w = `ゾーン(${z.map}${JSON.stringify(z.at)})`; if (!MAPS[z.map]) add(`${w}: マップが無い`); else pointOk(z.at, z.map, w); if (!STORY[z.story]) add(`${w}: 台本が無い "${z.story}"`); condOk(z.cond, w); }
  for (const z of CHREG.inters) { const w = `調べる所(${z.map}${JSON.stringify(z.at)})`; if (!MAPS[z.map]) add(`${w}: マップが無い`); else pointOk(z.at, z.map, w); if (!STORY[z.story]) add(`${w}: 台本が無い "${z.story}"`); }
  for (const z of CHREG.warps) { const w = `出入口(${z.map}${JSON.stringify(z.at)})`; if (!MAPS[z.map]) add(`${w}: マップが無い`); else pointOk(z.at, z.map, w); if (!MAPS[z.to]) add(`${w}: 行き先マップが無い "${z.to}"`); else pointOk(z.to_at, z.to, w + ' 行き先'); condOk(z.cond, w); }
  for (const a of CHREG.actors) { const w = `人物 ${a.id}(${a.map})`; if (!MAPS[a.map]) add(`${w}: マップが無い`); else pointOk(a.at, a.map, w); if (a.story && !STORY[a.story]) add(`${w}: 台本が無い "${a.story}"`); condOk(a.when, w); if (!a.img) add(`${w}: img が無い`); }
  for (const [id, e] of Object.entries(ENEMIES)) for (const k of ['name', 'img', 'mhp', 'atk', 'def', 'spd', 'size', 'pattern']) if (e[k] == null) add(`敵 ${id}: ${k} が無い`);
  for (const [id, a] of Object.entries(ALLIES)) { for (const k of ['name', 'mhp', 'atk', 'def', 'spd', 'skills']) if (a[k] == null) add(`仲間 ${id}: ${k} が無い`); for (const s of a.skills || []) if (!SKILLS[s]) add(`仲間 ${id}: 技が無い "${s}"`); }
  for (const s of STAGES) if (!OBJECTIVE[s]) add(`段階 ${s}: 目的(objectives)が無い`);
  const ids = new Set();
  for (const a of CHREG.ledger) {
    if (!a.id || !/^[a-z]+\.[a-z0-9_]+$/.test(a.id)) add(`台帳: id の形式が不正 "${a.id}"`); else if (ids.has(a.id)) add(`台帳: id が重複 "${a.id}"`);
    ids.add(a.id);
    if (!['未制作', '仮', '調整中', '確認済み'].includes(a.status)) add(`台帳 ${a.id}: status が不正 "${a.status}"`);
  }
  return out;
}

/* 台帳の素材が、ゲームの表示側(人物・敵・仲間・建物・タイル・小物)から参照されているか。参照されていない物は「ファイルを置いても表示されない」。 */
function ledgerUse() {
  const used = new Set();
  const add = n => { if (n) used.add(String(n).replace(/^.*\//, '').replace(/\.\w+$/, '')); };
  for (const a of CHREG.actors) { add(a.img); add(a.sheet); }
  for (const e of Object.values(ENEMIES)) add(e.img);
  for (const a of Object.values(ALLIES)) { add(a.portrait); add(a.sprite); }
  for (const L of Object.values(LAYOUT)) {
    for (const b of L.buildings || []) { add(b.img); add(b.art); }
    for (const d of L.decor || []) add(d.img);
    for (const f of L.furn || []) add(f.img);
  }
  for (const m of Object.values(MAPS)) for (const v of Object.values(m.tileArt || {})) add(v);
  for (const sc of Object.values(STORY)) (function w(s) { for (const op of s || []) { if (op[0] === 'actor' && op[1] === 'add' && op[2]) { add(op[2].img); add(op[2].sheet); } else if (op[0] === 'if') { w(op[2]); w(op[3]); } else if (op[0] === 'ask') (op[4] || []).forEach(w); } })(sc);
  const rows = CHREG.ledger.map(a => ({ id: a.id, kind: a.kind, connected: !!a.file && (used.has(a.file.replace(/^.*\//, '').replace(/\.\w+$/, '')) || (typeof ASSET_USE !== 'undefined' && !!ASSET_USE[a.id])) }));
  return { connected: rows.filter(r => r.connected).length, total: rows.length, unconnected: rows.filter(r => !r.connected).map(r => r.id) };
}
