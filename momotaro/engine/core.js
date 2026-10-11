/*
 * StoryBook Engine ― core.js(画面に依存しない中核)
 *
 * 分岐つき絵本ゲームの「状態・条件・遷移」だけを持つ。DOM に触れないので、
 * ブラウザの UI(ui.js)と、到達性の検査(tools/validate.html)の両方から同じものを使う。
 * 別のゲームを作るときも、このファイルは変えずに game データだけ差し替える。
 *
 * ── game データの形 ─────────────────────────────
 * game = {
 *   id, title, start: "場面ID",
 *   items:   { id: { name, prop, desc } },
 *   endingKinds: { kind: { name, color } },
 *   scenes:  { 場面ID: scene }
 * }
 * scene = {
 *   zone, title, art: {bg, deco:[[prop,x,y,scale,flip]]},
 *   pages: [ "文" | { text, when } , ... ],      // めくるページ。when で2回目以降の文を変えられる
 *   enter: { gives, takes, sets, clears, inc },  // 入った瞬間の効果
 *   options: [ option ... ],
 *   ending: { kind, name, no?, hint }            // 結末の場面
 * }
 * option = {
 *   id?, label,
 *   at: [prop,x,y,scale,flip],   // あれば「絵の中の物」。なければ文字の選択肢
 *   next: "場面ID",              // あれば移動。なければ 取る(gives)/見る
 *   when: "条件",                // 見える条件
 *   requires: "条件", locked: "満たさないときの一言",
 *   gives, takes, sets, clears, inc,  // 効果(文字列 or 配列)
 *   loop: true,                  // counters.loops を増やす
 *   msg: "ふせんに出す一言", once: true/false
 * }
 *
 * ── 条件の書き方 ─────────────────────────────
 *   has:key   flag:small   visits:river>=3   n:loops>=4   endings>=10
 *   先頭に ! で否定。&& で且つ、|| で または(|| のほうが弱い)。
 */
(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory();
  else root.BookCore = factory();
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";

  const OPS = {
    ">=": (a, b) => a >= b, "<=": (a, b) => a <= b, ">": (a, b) => a > b,
    "<": (a, b) => a < b, "==": (a, b) => a === b
  };
  const ATOM = /^(!?)(has|flag|visits|n):([A-Za-z0-9_]+)(?:(>=|<=|==|>|<)(\d+))?$/;
  const ENDS = /^(!?)endings(>=|<=|==|>|<)(\d+)$/;

  const arr = (x) => (x == null ? [] : Array.isArray(x) ? x : [x]);
  const clone = (x) => JSON.parse(JSON.stringify(x));
  const fastState = (st) => ({ scene: st.scene, visits: Object.assign({}, st.visits), items: st.items.slice(), flags: Object.assign({}, st.flags), counters: Object.assign({}, st.counters), done: Object.assign({}, st.done) });

  function newState(game) {
    return { scene: game.start, visits: {}, items: [], flags: {}, counters: {}, done: {} };
  }

  function atom(tok, st, ctx) {
    let m = ENDS.exec(tok);
    if (m) return (m[1] ? !OPS[m[2]](ctx.endings || 0, +m[3]) : OPS[m[2]](ctx.endings || 0, +m[3]));
    m = ATOM.exec(tok);
    if (!m) throw new Error("条件の書き方が読めません: " + tok);
    const [, neg, kind, name, op, num] = m;
    if (ctx.relax && (kind === "visits" || kind === "n")) return true; // 探索用: 回数の条件は「いつか満たせる」とみなす
    if (ctx.optimistic && neg) return true;                            // 探索用: 「〜を持っていない」は、いつか満たせるとみなす
    let r;
    if (kind === "has") r = st.items.includes(name);
    else if (kind === "flag") r = !!st.flags[name];
    else {
      const v = kind === "visits" ? (st.visits[name] || 0) : (st.counters[name] || 0);
      r = op ? OPS[op](v, +num) : v > 0;
    }
    return neg ? !r : r;
  }

  function test(expr, st, ctx) {
    if (!expr) return true;
    ctx = ctx || {};
    return expr.split("||").some((orPart) =>
      orPart.split("&&").every((a) => atom(a.trim(), st, ctx)));
  }

  function applyEffects(st, o) {
    arr(o.gives).forEach((i) => { if (!st.items.includes(i)) st.items.push(i); });
    arr(o.takes).forEach((i) => { const k = st.items.indexOf(i); if (k >= 0) st.items.splice(k, 1); });
    arr(o.sets).forEach((f) => { st.flags[f] = 1; });
    arr(o.clears).forEach((f) => { delete st.flags[f]; });
    arr(o.inc).forEach((c) => { st.counters[c] = (st.counters[c] || 0) + 1; });
  }

  const kindOf = (o) => (o.next ? "go" : (arr(o.gives).length ? "take" : "look"));

  // 見えている選択肢(絵の物と文字の両方)。enabled は requires を満たすか。
  function options(game, st, ctx) {
    const sc = game.scenes[st.scene];
    const out = [];
    (sc.options || []).forEach((o, i) => {
      const id = o.id || String(i);
      const key = st.scene + "." + id;
      const kind = kindOf(o);
      if (!test(o.when, st, ctx)) return;
      if (st.done[key] && (kind === "take" || o.once)) return;
      out.push({ id, key, kind, opt: o, enabled: test(o.requires, st, ctx) });
    });
    return out;
  }

  // いま見えるページ(when を評価した文の配列)
  function pages(game, st, ctx) {
    const sc = game.scenes[st.scene];
    return (sc.pages || []).filter((p) => (typeof p === "string") || test(p.when, st, ctx))
      .map((p) => (typeof p === "string" ? p : p.text));
  }

  function enter(game, st, id) {
    const sc = game.scenes[id];
    if (!sc) throw new Error("存在しない場面です: " + id);
    st.scene = id;
    st.visits[id] = (st.visits[id] || 0) + 1;
    if (sc.enter) applyEffects(st, sc.enter);
  }

  // 選択肢を実行する(st を書き換える)。履歴の保存は呼び出し側(ui/validate)の仕事。
  function act(game, st, entry) {
    const o = entry.opt;
    if (!entry.enabled) return { kind: "locked", msg: o.locked || "いまは、うまくいかないようだ。" };
    if (o.next) {
      applyEffects(st, o);
      if (o.loop) st.counters.loops = (st.counters.loops || 0) + 1;
      enter(game, st, o.next);
      return { kind: "go", msg: o.msg || "" };
    }
    applyEffects(st, o);
    if (entry.kind === "take" || o.once) st.done[entry.key] = 1;
    return { kind: entry.kind, msg: o.msg || "" };
  }

  // 状態を判別する短い文字列(到達性の検査用)。訪問回数は「3回以上」を同一視する。
  // 条件の中で数えられている場面・カウンタだけを、必要な上限つきで覚える(状態の爆発を防ぐ)。
  function refs(game) {
    const r = { visits: {}, counters: {}, flags: {} };
    const scan = (expr) => {
      if (!expr) return;
      expr.split(/\|\||&&/).forEach((t) => {
        const m = ATOM.exec(t.trim());
        if (m && m[2] === "flag") r.flags[m[3]] = 1;
        if (m && (m[2] === "visits" || m[2] === "n")) {
          const bag = m[2] === "visits" ? r.visits : r.counters;
          bag[m[3]] = Math.max(bag[m[3]] || 1, (+m[5] || 1) + 1);
        }
      });
    };
    Object.keys(game.scenes).forEach((id) => {
      const sc = game.scenes[id];
      (sc.options || []).forEach((o) => { scan(o.when); scan(o.requires); });
      (sc.pages || []).forEach((p) => { if (typeof p !== "string") scan(p.when); });
    });
    return r;
  }

  function stateKey(st, rf) {
    const vs = rf ? Object.keys(rf.visits) : Object.keys(st.visits);
    const cs = rf ? Object.keys(rf.counters) : Object.keys(st.counters);
    const v = vs.sort().map((k) => k + ":" + Math.min(st.visits[k] || 0, rf ? rf.visits[k] : 3)).join(",");
    const c = cs.sort().map((k) => k + ":" + Math.min(st.counters[k] || 0, rf ? rf.counters[k] : 4)).join(",");
    const fl = rf ? Object.keys(st.flags).filter((f) => rf.flags[f]) : Object.keys(st.flags);
    return [st.scene, st.items.slice().sort().join("+"), fl.sort().join("+"),
      Object.keys(st.done).sort().join("+"), v, c].join("|");
  }

  // ゲーム定義の静的な点検(参照切れなど)。問題の文字列の配列を返す。
  function lint(game) {
    const bad = [];
    const ids = Object.keys(game.scenes);
    if (!game.scenes[game.start]) bad.push("start の場面がありません: " + game.start);
    const used = new Set([game.start]);
    ids.forEach((id) => {
      const sc = game.scenes[id];
      const pagesOk = sc.pages && sc.pages.length;
      if (!pagesOk) bad.push(id + ": pages がありません");
      if (sc.ending) {
        if (sc.options && sc.options.length) bad.push(id + ": 結末なのに options があります");
        if (!game.endingKinds[sc.ending.kind]) bad.push(id + ": 結末の種類が不明 " + sc.ending.kind);
      } else {
        if (!sc.options || !sc.options.length) bad.push(id + ": 結末でないのに options がありません");
      }
      const seen = new Set();
      (sc.options || []).forEach((o, i) => {
        const oid = o.id || String(i);
        if (seen.has(oid)) bad.push(id + ": 選択肢IDが重複 " + oid);
        seen.add(oid);
        if (!o.label) bad.push(id + "." + oid + ": label がありません");
        if (o.next) {
          if (!game.scenes[o.next]) bad.push(id + "." + oid + ": 行き先がありません " + o.next);
          used.add(o.next);
        }
        [o.when, o.requires].forEach((e) => { try { test(e, newState(game), {}); } catch (x) { bad.push(id + "." + oid + ": " + x.message); } });
        arr(o.gives).concat(arr(o.takes)).forEach((it) => { if (!game.items[it]) bad.push(id + "." + oid + ": 持ち物の定義がありません " + it); });
      });
      (sc.pages || []).forEach((p) => { if (typeof p !== "string") { try { test(p.when, newState(game), {}); } catch (x) { bad.push(id + ": " + x.message); } } });
    });
    ids.forEach((id) => { if (!used.has(id)) bad.push(id + ": どこからも行けません(リンクなし)"); });
    return bad;
  }

  // 全ての状態を幅優先で探索し、到達できる場面・結末・行き止まりを調べる。
  function exploreExact(game, limit) {
    limit = limit || 400000;
    // 回数(visits/n)の条件は無視して、持ち物とフラグの組み合わせだけを全部たどる(状態の爆発を避ける)
    const relax = true;
    const start = newState(game);
    enter(game, start, game.start);
    const seen = new Map();
    const reach = {};
    const deadEnds = [];
    const rf = refs(game);
    if (relax) { rf.visits = {}; rf.counters = {}; }
    const q = [start];
    seen.set(stateKey(start, rf), 1);
    let n = 0;
    while (q.length && n < limit) {
      const st = q.shift(); n++;
      reach[st.scene] = (reach[st.scene] || 0) + 1;
      const sc = game.scenes[st.scene];
      if (sc.ending) continue;
      const ctx = { endings: 0, relax };
      const opts = options(game, st, ctx).filter((e) => e.enabled);
      const moves = opts.filter((e) => e.opt.next || e.kind === "take" || (arr(e.opt.sets).length && !st.flags[arr(e.opt.sets)[0]]));
      if (!opts.some((e) => e.opt.next)) {
        // 移動できる選択肢が一つもない場面(取る・見るだけでは前に進めない)
        const afterTakes = fastState(st);
        let progress = true;
        while (progress) {
          progress = false;
          options(game, afterTakes, ctx).filter((e) => e.enabled && !e.opt.next).forEach((e) => {
            const before = JSON.stringify(afterTakes);
            act(game, afterTakes, e);
            if (JSON.stringify(afterTakes) !== before) progress = true;
          });
        }
        if (!options(game, afterTakes, ctx).some((e) => e.enabled && e.opt.next)) deadEnds.push(stateKey(st, rf));
      }
      moves.forEach((e) => {
        const nx = fastState(st);
        act(game, nx, e);
        const k = stateKey(nx, rf);
        if (!seen.has(k)) { seen.set(k, 1); q.push(nx); }
      });
    }
    return { states: seen.size, explored: n, truncated: q.length > 0, reach, deadEnds };
  }

  // 軽い到達性解析: 持ち物とフラグは「一度手に入れたら残る」と見なして、行ける場面を数える。
  // 「持っていない」「回数」の条件は、いつか満たせると見なす(甘い見積もり)。
  // → ここで「行けない」と出た場面は、本当に行けない。「行ける」は、実際に通して確かめる(tools/validate.html の通しテスト)。
  function explore(game) {
    const K = { items: new Set(), flags: new Set() };
    const R = new Set([game.start]);
    const ctx = { relax: true, optimistic: true };
    const pseudo = () => ({ items: [...K.items], flags: Object.fromEntries([...K.flags].map((f) => [f, 1])), visits: {}, counters: {}, done: {} });
    const add = (o) => {
      let ch = false;
      arr(o.gives).forEach((i) => { if (!K.items.has(i)) { K.items.add(i); ch = true; } });
      arr(o.sets).forEach((f) => { if (!K.flags.has(f)) { K.flags.add(f); ch = true; } });
      return ch;
    };
    let changed = true;
    while (changed) {
      changed = false;
      for (const id of [...R]) {
        const sc = game.scenes[id];
        if (sc.enter && add(sc.enter)) changed = true;
        if (sc.ending) continue;
        (sc.options || []).forEach((o) => {
          const ps = pseudo();
          if (!test(o.when, ps, ctx) || !test(o.requires, ps, ctx)) return;
          if (add(o)) changed = true;
          if (o.next && !R.has(o.next)) { R.add(o.next); changed = true; }
        });
      }
    }
    const ps = pseudo();
    const reach = {}; R.forEach((id) => { reach[id] = 1; });
    const deadEnds = [];
    R.forEach((id) => {
      const sc = game.scenes[id];
      if (sc.ending) return;
      if (!(sc.options || []).some((o) => o.next && test(o.when, ps, ctx) && test(o.requires, ps, ctx))) deadEnds.push(id);
    });
    return { states: K.items.size + "個の持ち物 / " + K.flags.size + "個のフラグ", reach, deadEnds, truncated: false };
  }

  // 実行時の「エンジン」(履歴・結末記録つき)。ui.js が使う。
  function createEngine(game) {
    Object.keys(game.scenes).forEach((id) => { game.scenes[id].id = id; });
    const eng = {
      game, state: null, history: [], endings: {},
      ctx() { return { endings: Object.keys(eng.endings).length }; },
      scene() { return game.scenes[eng.state.scene]; },
      pages() { return pages(game, eng.state, eng.ctx()); },
      options() { return options(game, eng.state, eng.ctx()); },
      test(expr) { return test(expr, eng.state, eng.ctx()); },
      start() { eng.state = newState(game); eng.history = []; return eng._arrive(game.start); },
      _arrive(id, entered) {
        if (!entered) enter(game, eng.state, id);
        const sc = game.scenes[id];
        let isNew = false;
        if (sc.ending && !eng.endings[id]) { eng.endings[id] = Date.now(); isNew = true; }
        return { scene: sc, isNew };
      },
      choose(entryId) {
        const entry = eng.options().find((e) => e.id === entryId);
        if (!entry) return { kind: "none" };
        if (entry.enabled && entry.opt.next) eng.history.push(clone(eng.state));
        const res = act(game, eng.state, entry);
        if (res.kind === "go") { const a = eng._arrive(eng.state.scene, true); res.isNew = a.isNew; }
        return res;
      },
      canBack() { return eng.history.length > 0; },
      back() { if (!eng.history.length) return false; eng.state = eng.history.pop(); return true; },
      serialize() { return JSON.stringify({ state: eng.state, history: eng.history.slice(-300) }); },
      load(json) {
        try {
          const d = JSON.parse(json);
          if (!d || !d.state || !game.scenes[d.state.scene]) return false;
          eng.state = d.state; eng.history = (d.history || []).filter((h) => game.scenes[h.scene]);
          return true;
        } catch (e) { return false; }
      }
    };
    return eng;
  }

  return { newState, test, applyEffects, options, pages, enter, act, stateKey, lint, explore, exploreExact, createEngine, kindOf, clone, arr };
});
