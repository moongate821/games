/* テキスト型RPG エンジン
 * 物語は data.js(window.GAME_DATA)に持たせ、ここはルールと画面だけを扱う。
 * 仕様: ../資料/データ仕様.md
 */
(function () {
  'use strict';
  const D = window.GAME_DATA;
  const SAVE_KEY = 'textrpg_save_v1';
  const META_KEY = 'textrpg_meta_v1';
  const INV_MAX = 8;

  const $out = document.getElementById('out');
  const $status = document.getElementById('status');
  let $promptIn = document.getElementById('prompt-in');
  let $promptPath = document.getElementById('prompt-path');
  document.getElementById('bar-title').textContent = D.title + (D.subtitle ? ' ― ' + D.subtitle : '');
  document.title = D.title;

  const byId = (list, id) => (list || []).find(x => x.id === id);
  const arr = v => (v == null ? [] : Array.isArray(v) ? v : [v]);
  const stName = k => (D.stats && D.stats[k]) || k;

  // ---------- 保存 ----------
  function store(key, val) { try { if (val == null) localStorage.removeItem(key); else localStorage.setItem(key, JSON.stringify(val)); } catch (e) { } }
  function load(key) { try { const s = localStorage.getItem(key); return s ? JSON.parse(s) : null; } catch (e) { return null; } }
  let M = load(META_KEY) || {};
  M.flags = M.flags || {}; M.endings = M.endings || {};
  M.deaths = M.deaths || 0; M.runs = M.runs || 0; M.best = M.best || 0;
  const saveMeta = () => store(META_KEY, M);
  let S = null;
  const save = () => { if (S && !S.over) store(SAVE_KEY, S); };

  // 周回をまたぐ記録の総数(data から集計)
  const ALL_META = (() => {
    const set = new Set();
    (function walk(o) {
      if (!o || typeof o !== 'object') return;
      if (o.fx && o.fx.meta) arr(o.fx.meta).forEach(m => set.add(m));
      Object.values(o).forEach(walk);
    })(D);
    (D.endings || []).forEach(e => e.meta && set.add(e.meta));
    (D.enemies || []).forEach(e => arr(e.meta).forEach(m => set.add(m)));
    if (D.deathMeta) set.add(D.deathMeta);
    if (D.deathMetaFloor) D.floors.forEach((f, i) => set.add(D.deathMetaFloor + (i + 1)));
    return set;
  })();

  // ---------- 乱数(セーブに種を持たせ、読み直しで出目が変わらないようにする) ----------
  function rng() {
    if (!S) return Math.random();
    let t = (S.seed = (S.seed + 0x6D2B79F5) >>> 0);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }
  const d6 = () => 1 + Math.floor(rng() * 6);
  const pick = a => a[Math.floor(rng() * a.length)];
  function chance(stat, target) { // P(2D6+stat >= target)
    let n = 0;
    for (let a = 1; a <= 6; a++) for (let b = 1; b <= 6; b++) if (a + b + stat >= target) n++;
    return Math.round(n / 36 * 100);
  }

  // ---------- 音(PCスピーカー風) ----------
  let actx = null;
  function beep(freq, ms, vol) {
    if (M.mute) return;
    try {
      actx = actx || new (window.AudioContext || window.webkitAudioContext)();
      const o = actx.createOscillator(), g = actx.createGain();
      o.type = 'square'; o.frequency.value = freq;
      g.gain.value = vol || 0.03;
      o.connect(g); g.connect(actx.destination);
      o.start(); o.stop(actx.currentTime + ms / 1000);
    } catch (e) { }
  }
  const sfx = {
    key: () => beep(660, 25),
    ok: () => { beep(880, 60); setTimeout(() => beep(1320, 80), 70); },
    ng: () => beep(140, 180, 0.05),
    hit: () => beep(90, 120, 0.06),
    meta: () => [523, 659, 784, 1047].forEach((f, i) => setTimeout(() => beep(f, 90), i * 90)),
    die: () => [392, 330, 262, 196].forEach((f, i) => setTimeout(() => beep(f, 260, 0.05), i * 260)),
  };

  // ---------- 出力(1文字ずつ打つ。キーで早送り) ----------
  const queue = [];
  let timer = null;
  let keymap = {};
  let current = null; // 持ち物画面から戻る先

  function cls() { flushSilent(); $out.innerHTML = ''; }
  function print(text, c) {
    String(text == null ? '' : text).split('\n').forEach(line => {
      const el = document.createElement('div');
      el.className = 'ln ' + (c || '');
      $out.appendChild(el);
      queue.push({ el, text: line, pos: 0 });
    });
    pump();
  }
  function later(fn) { queue.push({ fn }); pump(); }
  function pump() { if (!timer) timer = setInterval(step, 16); }
  const SPEEDS = [3, 9, 99999];            // 文字の速さ: 普通 / 速い / 一瞬
  const SPEED_NAME = ['普通', '速い', '一瞬'];
  function step() {
    let budget = SPEEDS[M.speed || 0];
    while (queue.length && budget > 0) {
      const q = queue[0];
      if (q.fn) { queue.shift(); q.fn(); continue; }
      const n = Math.min(budget, q.text.length - q.pos);
      q.el.textContent += q.text.substr(q.pos, n);
      q.pos += n; budget -= n;
      if (q.pos >= q.text.length) queue.shift();
    }
    $out.scrollTop = $out.scrollHeight;
    if (!queue.length) { clearInterval(timer); timer = null; }
  }
  function flush() {
    let guard = 0;
    while (queue.length && guard++ < 5000) {
      const q = queue.shift();
      if (q.fn) q.fn(); else q.el.textContent = q.text;
    }
    $out.scrollTop = $out.scrollHeight;
  }
  function flushSilent() { queue.length = 0; if (timer) { clearInterval(timer); timer = null; } }

  // opts: [{label, fn, c, disabled, key}]
  let optEls = [], sel = -1;
  function setSel(i) {
    optEls.forEach(e => e.classList.remove('sel'));
    sel = i;
    if (optEls[i]) { optEls[i].classList.add('sel'); optEls[i].scrollIntoView({ block: 'nearest' }); }
  }
  function menu(opts, extra) {
    later(() => {
      keymap = {}; optEls = []; sel = -1;
      let i = 1;
      print('');
      opts.forEach(o => {
        const k = o.key || String(i++);
        const el = document.createElement('div');
        el.className = 'ln opt ' + (o.disabled ? 'd' : (o.c || ''));
        const key = document.createElement('span');
        key.className = 'k';
        key.textContent = k;
        el.appendChild(key);
        el.appendChild(document.createTextNode(' ' + o.label));
        $out.appendChild(el);
        if (!o.disabled && o.fn) {
          keymap[k] = o.fn;
          const idx = optEls.length;
          optEls.push(el);
          el.onclick = () => choose(k);
          el.onmouseenter = () => setSel(idx);
        }
      });
      Object.assign(keymap, extra || {});
      $promptIn.textContent = '';
      $out.scrollTop = $out.scrollHeight;
      updateStatus();
    });
  }
  function choose(k) {
    if (queue.length) { flush(); return; }
    const fn = keymap[k];
    if (!fn) return;
    keymap = {}; optEls = []; sel = -1;
    sfx.key();
    $promptIn.textContent = k;
    print('C:\\> ' + k, 'd');
    fn();
  }
  function note(t) { const el = document.createElement('div'); el.className = 'ln d'; el.textContent = t; $out.appendChild(el); $out.scrollTop = $out.scrollHeight; }
  function setFs(d) {
    M.fs = Math.max(0.8, Math.min(1.6, Math.round(((M.fs || 1) + d) * 10) / 10));
    document.documentElement.style.setProperty('--fs', M.fs);
    saveMeta();
  }
  if (M.fs) document.documentElement.style.setProperty('--fs', M.fs);

  // どの画面でも使える命令(I 持ち物 / K 知識 / Q 照会 / H 遊び方)
  const inRun = () => S && !S.over;
  function canCmd() { return Object.keys(keymap).length > 0 && !inputMode && (!inRun() || !!current); }
  function overlay(fn) {
    const back = inRun() && current ? current : title;
    keymap = {}; optEls = [];
    sfx.key();
    cls();
    fn(() => { cls(); back(); });
  }
  const GLOBAL = {
    I: () => { if (!inRun()) return false; if (S.combat) { keymap = {}; return inventory(true); } keymap = {}; inventory(); },
    K: () => overlay(knowledge),
    Q: () => { if (!inRun() || S.combat) return false; overlay(terminal); },
    H: () => overlay(help),
  };
  function handleKey(k) {
    if (inputMode) return false;
    if (queue.length) { flush(); return true; }
    if (k === 'ArrowUp' || k === 'ArrowDown') {
      if (optEls.length) setSel(sel < 0 ? (k === 'ArrowUp' ? optEls.length - 1 : 0) : (sel + (k === 'ArrowUp' ? -1 : 1) + optEls.length) % optEls.length);
      return true;
    }
    if (k === 'Enter') { if (optEls[sel]) optEls[sel].click(); return true; }
    if (k.length !== 1) return false;
    k = k.toUpperCase();
    if (keymap[k]) { choose(k); return true; }
    if (k === 'M') { M.mute = !M.mute; saveMeta(); note(M.mute ? '[音: 切]' : '[音: 入]'); return true; }
    if (k === 'S') { M.speed = ((M.speed || 0) + 1) % 3; saveMeta(); note('[文字の速さ: ' + SPEED_NAME[M.speed] + ']'); return true; }
    if (k === '+' || k === ';' || k === '=') { setFs(0.1); return true; }
    if (k === '-') { setFs(-0.1); return true; }
    if (GLOBAL[k] && canCmd()) { if (GLOBAL[k]() !== false) return true; }
    return false;
  }
  document.addEventListener('keydown', ev => {
    if (ev.ctrlKey || ev.metaKey || ev.altKey) return;
    if (handleKey(ev.key)) ev.preventDefault();
  });
  $out.addEventListener('click', () => { if (queue.length) flush(); });
  document.querySelectorAll('#foot [data-k]').forEach(b => b.addEventListener('click', ev => { ev.preventDefault(); handleKey(b.dataset.k); }));

  // ---------- 状態表示 ----------
  let inputMode = false;
  function wpn() { return Math.max(0, ...S.inv.map(i => byId(D.items, i)).filter(x => x && x.kind === 'weapon').map(x => x.value)); }
  function arm() { return Math.max(0, ...S.inv.map(i => byId(D.items, i)).filter(x => x && x.kind === 'armor').map(x => x.value)); }
  function knownCount() { return [...ALL_META].filter(m => M.flags[m]).length; }
  function updateStatus() {
    if (!S || S.over) { $status.innerHTML = `<span class="st d">死亡 ${M.deaths} 回</span><span class="st d">知識 ${knownCount()}/${ALL_META.size}</span>`; $promptPath.textContent = 'C:\\>'; return; }
    const F = D.floors[S.floor];
    const bar = (n, max, c) => {
      const w = 6, f = Math.max(0, Math.min(w, Math.ceil(n / max * w)));
      return `<span class="bar ${c}">${'■'.repeat(f)}</span><span class="bar d">${'□'.repeat(w - f)}</span>`;
    };
    const num = (n, warn, c) => `<span class="${n <= warn ? 'low' : (c || 'w')}">${n}</span>`;
    const st = Object.keys(D.stats).map(k => stName(k) + '<span class="w">' + S.stats[k] + '</span>').join(' ');
    const hpc = S.hp <= S.maxhp / 3 ? 'r' : 'g';
    $status.innerHTML =
      `<div><span class="st c">${F ? F.name : ''}</span><span class="st">部屋 ${Math.min(S.room, F ? F.rooms : 0)}/${F ? F.rooms : 0}</span><span class="st d">${S.className}</span></div>` +
      `<div><span class="st">体力${bar(S.hp, S.maxhp, hpc)}${num(S.hp, Math.floor(S.maxhp / 3))}/${S.maxhp}</span>` +
      `<span class="st">精神${bar(S.sp, S.maxsp, 'm')}${num(S.sp, 3)}/${S.maxsp}</span></div>` +
      `<div><span class="st">灯り ${num(S.light, 3)}</span><span class="st">食料 ${num(S.food, 1)}</span><span class="st">運 ${num(S.luck, 0)}</span><span class="st">金 ${num(S.gold, -1, 'y')}</span>` +
      `<span class="st">${st}</span><span class="st">武器+${wpn()} 防具${arm()}</span><span class="st">持ち物 ${S.inv.length}/${INV_MAX}</span>` +
      (S.sp <= 0 ? '<span class="st m">《錯乱》</span>' : '') + (S.light <= 0 ? '<span class="st r">《暗闇》</span>' : '') +
      (S.food <= 0 ? '<span class="st r">《飢え》</span>' : '') + '</div>';
    $promptPath.textContent = 'C:\\B' + (S.floor + 1) + '>';
  }

  // ---------- 条件 ----------
  function meets(r) {
    if (!r) return true;
    if (r.flag && !arr(r.flag).every(f => S.flags[f])) return false;
    if (r.noflag && arr(r.noflag).some(f => S.flags[f])) return false;
    if (r.meta && !arr(r.meta).every(f => M.flags[f])) return false;
    if (r.nometa && arr(r.nometa).some(f => M.flags[f])) return false;
    if (r.item && !arr(r.item).every(i => S.inv.includes(i))) return false;
    if (r.noitem && arr(r.noitem).some(i => S.inv.includes(i))) return false;
    if (r.gold && S.gold < r.gold) return false;
    return true;
  }

  // ---------- 効果 ----------
  function addItem(id) {
    const it = byId(D.items, id);
    if (!it) return;
    if (S.inv.length >= INV_MAX) { print(`(持ちきれない。${it.name}を置いていった)`, 'd'); return; }
    S.inv.push(id);
    print(`《${it.name}》を手に入れた。`, 'c');
  }
  function loseItem(id) {
    const i = S.inv.indexOf(id);
    if (i < 0) return;
    S.inv.splice(i, 1);
    const it = byId(D.items, id);
    print(`《${it ? it.name : id}》を失った。`, 'r');
  }
  function gainMeta(m) {
    arr(m).forEach(f => {
      if (M.flags[f]) return;
      M.flags[f] = true; saveMeta();
      later(sfx.meta);
      print(`【記録】新たな知識が刻まれた。(知識 ${knownCount()}/${ALL_META.size})`, 'y');
    });
  }
  const LABEL = { hp: '体力', sp: '精神', light: '灯り', food: '食料', luck: '運', gold: '金', maxhp: '最大体力' };
  function applyFx(fx) {
    fx = fx || {};
    const parts = [];
    ['maxhp', 'hp', 'sp', 'light', 'food', 'luck', 'gold'].forEach(k => {
      if (!fx[k]) return;
      S[k] = S[k] + fx[k];
      if (k === 'maxhp') { S.maxhp = Math.max(1, S.maxhp); S.hp = Math.min(S.hp, S.maxhp); }
      if (k === 'hp') S.hp = Math.min(S.hp, S.maxhp);
      if (k === 'sp') S.sp = Math.max(0, Math.min(S.sp, S.maxsp));
      if (['light', 'food', 'luck', 'gold'].includes(k)) S[k] = Math.max(0, S[k]);
      parts.push(`${LABEL[k]} ${fx[k] > 0 ? '+' : ''}${fx[k]}`);
    });
    if (fx.stat) Object.entries(fx.stat).forEach(([k, n]) => { S.stats[k] = Math.max(0, (S.stats[k] || 0) + n); parts.push(`${stName(k)} ${n > 0 ? '+' : ''}${n}`); });
    if (parts.length) {
      const bad = ['hp', 'sp', 'light', 'food', 'luck', 'gold', 'maxhp'].some(k => fx[k] < 0);
      print('  ' + parts.join('  '), bad ? 'r' : 'g');
      later(bad ? sfx.hit : sfx.ok);
    }
    arr(fx.lose).forEach(loseItem);
    arr(fx.item).forEach(addItem);
    arr(fx.flag).forEach(f => { S.flags[f] = true; });
    if (fx.meta) gainMeta(fx.meta);
    if (fx.skipRooms) S.room = Math.min(D.floors[S.floor].rooms, S.room + fx.skipRooms);
  }
  // 効果のあとの行き先
  function after(fx) {
    fx = fx || {};
    if (fx.death) return die(fx.death);
    if (S.hp <= 0) return die(S.lastHurt || '傷が深すぎた');
    if (fx.ending) return ending(fx.ending);
    if (fx.fight) return startCombat(fx.fight, { next: fx.next || null });
    if (fx.next) return runEvent(fx.next, true);
    return null;
  }

  // ---------- 画面: タイトル ----------
  function boot() {
    cls();
    print('MEMORY TEST : 640K OK', 'd');
    print('C:\\> ' + (D.exe || 'RPG.EXE'), 'd');
    print('');
    title(true);
  }
  function title(keep) {
    S = load(SAVE_KEY);
    const hasSave = !!S;
    if (S) S = null;
    keymap = {};
    if (keep !== true) cls();
    const rule = '＝'.repeat([...D.title].length + 4);
    print(rule, 'c');
    print('　　' + D.title, 'big');
    print(rule, 'c');
    if (D.subtitle) print('  ' + D.subtitle, 'd');
    print('');
    if (M.deaths || M.runs) print(`  死亡 ${M.deaths} 回 / 最深 第${M.best}層 / 知識 ${knownCount()}/${ALL_META.size}`, 'd');
    menu([
      { label: hasSave ? '続きから' : '新しく潜る', fn: hasSave ? resume : newGame, c: 'w' },
      hasSave ? { label: '新しく潜る(今の続きは消える)', fn: newGame } : { label: '続きから', disabled: true },
      { label: '知識の目録', fn: () => overlay(knowledge) },
      { label: '記録と書架', fn: records },
      { label: '遊び方', fn: () => overlay(help) },
    ]);
    current = null;
    updateStatus();
  }

  function help(back) {
    cls();
    print('■ 遊び方', 'w');
    print([
      '数字キーか、行をタップして選ぶ。↑↓とEnterでも選べる。',
      '文字が流れている間は、何かキー(タップ)で早送り。',
      '',
      '【どこでも使える命令】(下の帯のボタンでも可)',
      '　I 持ち物 / K 知識の目録 / Q 照会端末',
      '　S 文字の速さ / M 音 / ＋− 文字の大きさ',
      '',
      '・部屋を進むたび、食料と灯りが1ずつ減る。',
      '　食料が尽きると体力が削れ、灯りが尽きると',
      '　扉の先が見えなくなる。',
      '・判定は 2D6+能力値 が目標以上で成功。',
      '　成功率は選択肢に出る。失敗したら「運」を',
      '　払って振り直せる。赤い判定は振り直せない。',
      '・精神が0になると錯乱し、選んだものと違う',
      '　行動をとることがある。戦闘では体力が削れる。',
      '・敵の行動は決まった順番で繰り返す。予兆を読め。',
      '　一度見た行動は記録され、次から先読みできる。',
      '・照会端末には、書庫で見た言葉を打ちこめる。',
      '　灯りを1使う。何が返ってくるかは、打つまで分からない。',
      '・死ねばすべて失う。だが、知ったことは記録に残る。',
      '　死んだ階層には、前のあなたの本が残る。',
    ].join('\n'));
    menu([{ label: '戻る', fn: back, key: '0' }]);
  }

  // 知識の目録: 周回をまたいで残った記録
  function knowledge(back) {
    print('■ 知識の目録', 'w');
    print(`  ${knownCount()}/${ALL_META.size} を知っている。`, 'y');
    print('');
    const info = D.metaInfo || {};
    [...ALL_META].filter(m => M.flags[m]).forEach(m => print('■ ' + (info[m] || m), 'c'));
    const unknown = ALL_META.size - knownCount();
    if (unknown) print(`□ まだ知らないことが、${unknown} ある。`, 'd');
    const seen = Object.keys(M.seen || {});
    if (seen.length) {
      print('');
      print('■ 読み切った相手', 'w');
      D.enemies.forEach(e => {
        const s = (M.seen || {})[e.id];
        if (!s) return;
        const n = e.pattern.filter((p, i) => s[i]).length;
        print(`  ${e.name}  ${n}/${e.pattern.length}手${n === e.pattern.length ? ' (全部)' : ''}`, n === e.pattern.length ? 'g' : '');
      });
    }
    menu([{ label: '戻る', fn: back, key: '0' }]);
  }

  // 照会端末: 言葉を打ちこむ(data の queries)
  const norm = s => String(s || '').normalize('NFKC').replace(/[\s「」『』"'“”、。]/g, '')
    .replace(/[ァ-ヶ]/g, c => String.fromCharCode(c.charCodeAt(0) - 0x60)).toUpperCase();
  function ask(label, cb) {
    inputMode = true;
    const $p = document.getElementById('prompt');
    const keep = $p.innerHTML;
    $p.innerHTML = '';
    const lab = document.createElement('span'); lab.textContent = label;
    const inp = document.createElement('input');
    inp.id = 'cmd'; inp.autocomplete = 'off'; inp.spellcheck = false; inp.maxLength = 24;
    $p.appendChild(lab); $p.appendChild(inp);
    const done = v => { inputMode = false; $p.innerHTML = keep; rebindPrompt(); cb(v); };
    inp.addEventListener('keydown', ev => {
      ev.stopPropagation();
      if (ev.key === 'Enter') { ev.preventDefault(); done(inp.value); }
      if (ev.key === 'Escape') { ev.preventDefault(); done(null); }
    });
    setTimeout(() => inp.focus(), 0);
  }
  function rebindPrompt() {
    // ask() が書き換えた行の要素を取り直す
    $promptIn = document.getElementById('prompt-in');
    $promptPath = document.getElementById('prompt-path');
  }
  function terminal(back) {
    print('━━━━ 照会端末 ━━━━', 'g');
    print('> 照会語を入力してください。(灯り1)', 'g');
    print('> 空のまま Enter で終了。', 'd');
    later(() => {
      if (S.light <= 0) { print('画面を読むだけの灯りがない。', 'r'); return menu([{ label: '戻る', fn: back, key: '0' }]); }
      ask('照会> ', v => {
        const w = norm(v);
        if (!w) return back();
        print('> 照会: ' + v.trim(), 'w');
        const free = ['HELP', '?', 'へるぷ', 'CLS'];
        if (!free.includes(w)) { S.light = Math.max(0, S.light - 1); }
        if (w === 'CLS') { cls(); return terminal(back); }
        const q = (D.queries || []).find(x => arr(x.words).some(t => norm(t) === w));
        const r = q && (q.answers || []).find(a => meets(a.need));
        if (!r) {
          print('> 該当なし。', 'g'); later(sfx.ng);
        } else {
          const txt = String(r.text).replace(/\{deaths\}/g, M.deaths).replace(/\{runs\}/g, M.runs).replace(/\{know\}/g, knownCount());
          print(txt, 'g');
          const key = '__q_' + (arr(q.words)[0]) + '_' + q.answers.indexOf(r);
          if (r.fx && !S.flags[key]) { S.flags[key] = true; applyFx(r.fx); }
          later(sfx.ok);
        }
        save();
        menu([{ label: 'もう一度照会する', fn: () => { cls(); terminal(back); } }, { label: '戻る', fn: back, key: '0' }]);
      });
    });
  }

  // 記録と書架(死んだ自分たちの本)
  function records() {
    cls();
    print('■ 記録', 'w');
    print(`  潜った回数 ${M.runs}  死亡 ${M.deaths}  最深 第${M.best}層`);
    print(`  知識 ${knownCount()}/${ALL_META.size}`, 'y');
    const ends = (D.endings || []).map(e => (M.endings[e.id] ? '■ ' + e.name : '□ ？？？')).join('\n  ');
    print('  結末:\n  ' + ends);
    const shelf = (M.shelf || []).slice(-10).reverse();
    if (shelf.length) {
      print('');
      print('■ 書架(新しい順)', 'w');
      shelf.forEach(b => print(`  第${b.n}刷  ${b.cls}  第${b.floor}層  ${b.cause}`, 'br'));
    }
    menu([
      { label: '記録を書き出す(コピー用)', fn: exportSave },
      { label: '記録を読み込む', fn: importSave },
      { label: '記録をすべて消す', fn: wipe, c: 'r' },
      { label: '戻る', fn: title, key: '0' },
    ]);
  }
  function exportSave() {
    const code = btoa(unescape(encodeURIComponent(JSON.stringify({ M, S: load(SAVE_KEY) }))));
    try { navigator.clipboard && navigator.clipboard.writeText(code); } catch (e) { }
    print('次の文字列を控えておくこと(クリップボードにも写した):', 'w');
    print(code, 'd');
    menu([{ label: '戻る', fn: records, key: '0' }]);
  }
  function importSave() {
    const code = window.prompt('書き出した文字列を貼り付け:');
    if (!code) return records();
    try {
      const o = JSON.parse(decodeURIComponent(escape(atob(code.trim()))));
      M = o.M; saveMeta(); store(SAVE_KEY, o.S || null);
      print('読み込んだ。', 'g');
    } catch (e) { print('読めなかった。', 'r'); }
    menu([{ label: '戻る', fn: records, key: '0' }]);
  }
  function wipe() {
    const a = window.prompt('すべての記録を消す。消すなら YES と入力:');
    if (a === 'YES') { store(META_KEY, null); store(SAVE_KEY, null); M = { flags: {}, endings: {}, deaths: 0, runs: 0, best: 0 }; print('消去した。', 'r'); }
    menu([{ label: '戻る', fn: title, key: '0' }]);
  }

  // ---------- 開始 ----------
  function newGame() {
    store(SAVE_KEY, null);
    cls();
    // intro の各行は文字列か {"text":..,"meta":..}(その記録がある時だけ出す)/{"text":..,"nometa":..}(無い時だけ)
    (D.intro || []).forEach(l => {
      if (typeof l === 'string') return print(l);
      if (l.meta && !M.flags[l.meta]) return;
      if (l.nometa && M.flags[l.nometa]) return;
      print(l.text, l.c || '');
    });
    print('');
    print('■ 何者として潜るか', 'w');
    const opts = D.classes.map(c => {
      const open = !c.unlock || M.flags[c.unlock];
      return open
        ? { label: `${c.name}  ` + Object.keys(D.stats).map(k => stName(k) + c.stats[k]).join(' ') + `  体${c.hp} 精${c.sp} 運${c.luck}`, fn: () => confirmClass(c) }
        : { label: '？？？(まだ知らない)', disabled: true };
    });
    opts.push({ label: '戻る', fn: title, key: '0' });
    menu(opts);
  }
  function confirmClass(c) {
    print('');
    print(c.desc, 'w');
    const items = c.items.map(i => (byId(D.items, i) || {}).name).filter(Boolean).join('、');
    print(`持ち物: ${items || 'なし'}  灯り${c.light} 食料${c.food} 金${c.gold}`, 'd');
    menu([{ label: 'この者で潜る', fn: () => startRun(c) }, { label: '選び直す', fn: newGame, key: '0' }]);
  }
  function startRun(c) {
    S = {
      seed: (Math.random() * 4294967296) >>> 0,
      cls: c.id, className: c.name,
      hp: c.hp, maxhp: c.hp, sp: c.sp, maxsp: c.sp, luck: c.luck,
      light: c.light, food: c.food, gold: c.gold,
      stats: Object.assign({}, c.stats), inv: c.items.slice(0, INV_MAX),
      flags: {}, used: {}, floor: 0, room: 0, rooms: 0, doors: null, at: null, combat: null, shop: null,
    };
    M.runs++; saveMeta();
    enterFloor();
  }
  function resume() {
    S = load(SAVE_KEY);
    if (!S) return title();
    const at = S.at || {};
    if (S.combat) { cls(); return combatTurn(); }
    if (at.t === 'event') return runEvent(at.id);
    if (at.t === 'shop') return shopScreen();
    if (at.t === 'after') return afterRoom();
    if (at.t === 'boss') return bossScreen();
    if (at.t === 'remains') return remains();
    if (at.t === 'floor') return enterFloor();
    return doorScreen();
  }

  // ---------- 階層と扉 ----------
  function enterFloor() {
    const F = D.floors[S.floor];
    S.room = 0; S.doors = null; S.at = { t: 'floor' };
    M.best = Math.max(M.best, S.floor + 1); saveMeta();
    save();
    cls();
    print('━━━━ ' + F.name + ' ━━━━', 'c');
    print('');
    print(F.intro || '');
    current = enterFloor;
    menu([{ label: '進む', fn: doorScreen }], { I: () => inventory() });
  }

  const KIND = { fight: '気配', shop: '灯り', rest: '静けさ', treasure: 'きらめき', omen: '不穏' };
  const FIGHT_DOORS = ['何かの息づかい。', '床に、新しい引っかき傷。', '低い唸り声。'];
  function genDoors() {
    const F = D.floors[S.floor];
    const evs = (F.pool || []).map(id => byId(D.events, id))
      .filter(e => e && !(e.once && S.used[e.id]) && meets(e.require));
    // pin:"last" のイベントは、その層の最後の部屋に必ず単独で出る(それ以外の部屋には出ない)
    const last = S.room === F.rooms - 1;
    const pinned = evs.filter(e => e.pin === 'last');
    if (last && pinned.length) return [{ t: 'event', id: pinned[0].id }];
    const pool = evs.filter(e => e.pin !== 'last')
      .map(e => ({ t: 'event', id: e.id, w: e.weight || 1 }));
    if ((F.enemies || []).length) pool.push({ t: 'fight', id: pick(F.enemies), w: 3, door: pick(F.fightDoors || FIGHT_DOORS) });
    // 前の周に死んだ階層には、前のあなたの本が出る(1周に1回)
    const L = M.lastDeath;
    if (L && L.floor === S.floor && !S.flags.__remains) pool.push({ t: 'remains', w: 8 });
    const n = Math.min(pool.length, rng() < 0.5 ? 2 : 3);
    const out = [];
    while (out.length < n && pool.length) {
      const tot = pool.reduce((a, b) => a + b.w, 0);
      let r = rng() * tot, i = 0;
      for (; i < pool.length; i++) { r -= pool[i].w; if (r <= 0) break; }
      out.push(pool.splice(Math.min(i, pool.length - 1), 1)[0]);
    }
    return out;
  }
  function doorLabel(d) {
    if (S.light <= 0) return '[？？？] ……暗くて何も見えない';
    if (d.t === 'fight') return `[${KIND.fight}] ${d.door}`;
    if (d.t === 'remains') return `[背表紙] ${REM().door}`;
    const e = byId(D.events, d.id);
    return `[${KIND[e.kind] || '扉'}] ${e.door || '……'}`;
  }
  function doorScreen() {
    const F = D.floors[S.floor];
    if (S.room >= F.rooms) return bossScreen();
    if (!S.doors) S.doors = genDoors();
    S.at = { t: 'door' };
    save();
    cls();
    const left = F.rooms - S.room;
    print(`― 部屋 ${S.room + 1}/${F.rooms} ―　` + (left === 1 ? 'この先に、階層の主の気配。' : `主まで、あと${left}部屋。`), left === 1 ? 'r' : 'd');
    if (S.food <= 1 || S.light <= 2) print(`(${[S.food <= 1 ? '食料が尽きかけている' : '', S.light <= 2 ? '灯りが細い' : ''].filter(Boolean).join('。')}。I で持ち物を使える)`, 'y');
    print('扉が並んでいる。');
    current = doorScreen;
    menu(S.doors.map(d => ({ label: doorLabel(d), fn: () => openDoor(d) })), { I: () => inventory() });
  }
  function openDoor(d) {
    S.doors = null;
    S.room++; S.rooms++;
    cls();
    // 時が進む
    if (S.food > 0) S.food--; else { S.hp -= 2; S.lastHurt = '飢えて動けなくなった'; print('腹が鳴る。体力 -2', 'r'); }
    if (S.light > 0) { S.light--; if (S.light === 0) print('灯りが、ふっと消えた。', 'r'); }
    if (S.hp <= 0) return die(S.lastHurt);
    if (d.t === 'fight') return startCombat(d.id, {});
    if (d.t === 'remains') return remains();
    runEvent(d.id, true);
  }

  // 前のあなたの本
  const REM = () => Object.assign({
    door: '真新しい背表紙。',
    text: '棚に、一冊だけ新しい本がある。\n背表紙に「{cls}」の文字。\n頁の端が、まだ湿っている。\n――前のあなただ。\n最後の頁には、こう書いてある。\n「{cause}」',
    take: '頁の間から、前のあなたの持ち物がこぼれ落ちた。',
    leave: 'あなたは、本を棚に戻した。\n次のあなたのために。',
  }, D.remains || {});
  function remains() {
    const L = M.lastDeath, R = REM();
    S.flags.__remains = true;
    S.at = { t: 'remains' };
    save();
    if (!L) return afterRoom();
    print(R.text.replace('{cls}', L.cls).replace('{cause}', L.cause), 'br');
    current = null;
    const goods = (L.items || []).filter(id => byId(D.items, id));
    menu([
      goods.length ? { label: `持ち物を拾う(${goods.slice(0, 2).map(i => byId(D.items, i).name).join('、')})`, fn: () => {
        print(''); print(R.take, 'w');
        goods.slice(0, 2).forEach(addItem);
        M.lastDeath = null; saveMeta();
        afterRoom();
      } } : { label: '持ち物は、何も残っていない', disabled: true },
      { label: '棚に戻す', fn: () => { print(''); print(R.leave, 'w'); applyFx({ luck: 1 }); afterRoom(); } },
    ]);
  }

  // ---------- イベント ----------
  // keep: 画面を消さずに続ける(直前の文を残す)
  function runEvent(id, keep) {
    const ev = byId(D.events, id);
    if (!ev) { print('(イベント ' + id + ' が見つからない)', 'r'); return afterRoom(); }
    if (ev.once) S.used[id] = true;
    S.at = { t: 'event', id };
    save();
    if (keep) print(''); else cls();
    print(ev.text || '');
    current = () => runEvent(id);
    const shown = (ev.choices || []).filter(c => meets(c.need) || c.hidden === false);
    if (!shown.length) {
      if (ev.kind === 'shop') return later(() => shopScreen(true));
      return afterRoom();
    }
    let opts = shown.map(c => {
      if (!meets(c.need)) return { label: c.label + '(何かが足りない)', disabled: true };
      let label = c.label;
      let col = '';
      if (c.check) {
        const p = chance(S.stats[c.check.stat] || 0, c.check.target);
        label += `〔${stName(c.check.stat)}${c.check.target}・${p}%〕`;
        col = c.check.red ? 'r' : 'w';
      }
      return { label, c: col, fn: () => resolve(ev, c) };
    });
    // 錯乱: 二つの選択肢の中身が入れ替わる
    const live = opts.map((o, i) => (o.fn ? i : -1)).filter(i => i >= 0);
    if (S.sp <= 0 && live.length >= 2) {
      const a = live.splice(Math.floor(rng() * live.length), 1)[0];
      const b = pick(live);
      const t = opts[a].fn; opts[a].fn = opts[b].fn; opts[b].fn = t;
      print('(頭の中で、誰かの声が混線している)', 'm');
    }
    menu(opts);
  }

  function resolve(ev, c) {
    if (!c.check) return outcome(ev, c.ok);
    const stat = S.stats[c.check.stat] || 0;
    const roll = () => {
      const a = d6(), b = d6(), tot = a + b + stat;
      const ok = tot >= c.check.target;
      print(`判定 ${stName(c.check.stat)}: [${a}][${b}] +${stat} = ${tot}  目標${c.check.target} … ${ok ? '成功' : '失敗'}`, ok ? 'g' : 'r');
      later(ok ? sfx.ok : sfx.ng);
      if (ok) return outcome(ev, c.ok);
      if (!c.check.red && S.luck > 0) {
        current = null; // 振り直しの最中は、他の画面へ逃げられないようにする
        return menu([
          { label: `運を使って振り直す(運 ${S.luck}→${S.luck - 1})`, c: 'y', fn: () => { S.luck--; roll(); } },
          { label: '受け入れる', fn: () => outcome(ev, c.ng) },
        ]);
      }
      outcome(ev, c.ng);
    };
    roll();
  }
  function outcome(ev, res) {
    res = res || {};
    print('');
    if (res.text) print(res.text, 'w');
    applyFx(res.fx);
    if (res.fx && res.fx.hp < 0) S.lastHurt = ev.deathCause || res.fx.cause || 'その部屋で力尽きた';
    if (after(res.fx) !== null) return;
    if (ev.kind === 'shop') return later(() => shopScreen(true));
    afterRoom();
  }
  function afterRoom() {
    if (S.hp <= 0) return die(S.lastHurt || '力尽きた');
    S.at = { t: 'after' };
    save();
    current = afterRoom;
    menu([{ label: '先へ進む', fn: doorScreen }], { I: () => inventory() });
  }

  // ---------- 店 ----------
  function shopScreen(fresh) {
    if (fresh || !S.shop) {
      const F = D.floors[S.floor] || {};
      const goods = F.shop ? F.shop.map(id => byId(D.items, id)).filter(Boolean)
        : D.items.filter(i => i.price > 0 && i.kind !== 'key');
      const stock = [];
      while (stock.length < Math.min(4, goods.length)) { const g = pick(goods); if (!stock.includes(g.id)) stock.push(g.id); }
      S.shop = stock;
    }
    S.at = { t: 'shop' };
    save();
    print('');
    print(`■ 品書き  (所持金 ${S.gold})`, 'y');
    current = () => { cls(); shopScreen(); };
    menu(S.shop.map(id => {
      const it = byId(D.items, id);
      return { label: `${it.name}  ${it.price}金 ― ${it.desc}`, disabled: S.gold < it.price, fn: () => buy(it) };
    }).concat([{ label: '立ち去る', key: '0', fn: () => { S.shop = null; afterRoom(); } }]), { I: () => inventory() });
  }
  function buy(it) {
    if (S.inv.length >= INV_MAX) { print('もう持てない。', 'r'); return shopScreen(); }
    S.gold -= it.price;
    S.shop.splice(S.shop.indexOf(it.id), 1);
    addItem(it.id);
    shopScreen();
  }

  // ---------- 持ち物 ----------
  const USE = { light: 'light', food: 'food', heal: 'hp', calm: 'sp' };
  function inventory(inCombat) {
    const back = current || doorScreen;
    print('');
    print('■ 持ち物', 'w');
    if (!S.inv.length) print('  何も持っていない。', 'd');
    const opts = S.inv.map((id, idx) => {
      const it = byId(D.items, id) || { name: id, desc: '' };
      const usable = !!USE[it.kind];
      return { label: `${it.name}${usable ? '' : '(使えない)'} ― ${it.desc}`, c: usable ? '' : 'd', fn: () => useItem(idx, inCombat, back) };
    });
    opts.push({ label: '戻る', key: '0', fn: inCombat ? combatTurn : back });
    menu(opts);
  }
  function useItem(idx, inCombat, back) {
    const it = byId(D.items, S.inv[idx]);
    if (!it || !USE[it.kind]) { print('それは今、使い道がない。', 'd'); return inventory(inCombat); }
    S.inv.splice(idx, 1);
    print(`《${it.name}》を使った。`, 'c');
    applyFx({ [USE[it.kind]]: it.value });
    save();
    if (inCombat) return enemyAct(false);
    menu([{ label: '戻る', key: '0', fn: back }]);
  }

  // ---------- 戦闘 ----------
  function startCombat(id, opt) {
    const e = byId(D.enemies, id);
    if (!e) { print('(敵 ' + id + ' が見つからない)', 'r'); return afterRoom(); }
    S.combat = { id, hp: e.hp, idx: 0, boss: !!opt.boss, next: opt.next || null };
    save();
    print('');
    print(`▼ ${e.name} が現れた。`, 'r');
    if (e.desc) print(e.desc);
    combatTurn();
  }
  function combatTurn() {
    const C = S.combat, e = byId(D.enemies, C.id);
    const p = e.pattern[C.idx % e.pattern.length];
    save();
    current = () => { cls(); if (S.combat) combatTurn(); else afterRoom(); };
    // 戦闘が長引いても画面が流れすぎないよう、古い行を間引く
    while ($out.children.length > 16) $out.removeChild($out.firstChild);
    print('');
    const eb = Math.max(0, Math.ceil(Math.max(0, C.hp) / e.hp * 10));
    print(`${e.name}  ${'■'.repeat(eb)}${'□'.repeat(10 - eb)} ${Math.max(0, C.hp)}/${e.hp}`, 'r');
    print(`予兆: ${p.tell}`, 'y');
    // 前の周までに見た行動は、記録から先読みできる
    const seen = (M.seen || {})[e.id] || [];
    const n1 = (C.idx + 1) % e.pattern.length, n2 = (C.idx + 2) % e.pattern.length;
    if (seen[n1]) print(`記録 次　: ${e.pattern[n1].tell}`, 'c');
    if (seen[n1] && seen[n2] && e.pattern.length > 2) print(`記録 その次: ${e.pattern[n2].tell}`, 'c');
    if (!seen.length) print('(記録にない相手だ)', 'd');
    const flee = e.flee >= 99 ? null : chance(S.stats.dex || 0, e.flee);
    menu([
      { label: '攻撃', fn: () => act('attack') },
      { label: '防御', fn: () => act('guard') },
      { label: '道具', fn: () => inventory(true) },
      flee === null ? { label: '逃走(逃げ場はない)', disabled: true } : { label: `逃走〔${stName('dex')}${e.flee}・${flee}%〕`, fn: () => act('flee') },
    ]);
  }
  function act(kind) {
    const C = S.combat, e = byId(D.enemies, C.id);
    const p = e.pattern[C.idx % e.pattern.length];
    if (kind === 'attack') {
      const a = d6(), b = d6();
      let dmg;
      if (a + b === 2) { dmg = 0; print(`[${a}][${b}] 空を切った。`, 'r'); }
      else {
        dmg = Math.max(1, a + b + S.stats.str + wpn() - 8 - (e.def || 0));
        if (a + b === 12) dmg *= 2;
        if (p.intent === 'guard') dmg = Math.max(1, Math.floor(dmg / 2));
        print(`[${a}][${b}] ${a + b === 12 ? '会心の一撃。' : ''}${e.name}に ${dmg} の傷。${p.intent === 'guard' ? '(守りに阻まれた)' : ''}`, 'w');
        later(sfx.hit);
      }
      C.hp -= dmg;
      if (C.hp <= 0) return win();
      return enemyAct(false);
    }
    if (kind === 'guard') { print('身を固めた。', 'w'); return enemyAct(true); }
    if (kind === 'flee') {
      const a = d6(), b = d6(), tot = a + b + (S.stats.dex || 0);
      if (tot >= e.flee) {
        print(`[${a}][${b}] 逃げ切った。`, 'g');
        S.combat = null;
        return afterRoom();
      }
      print(`[${a}][${b}] 回り込まれた。`, 'r');
      return enemyAct(false);
    }
  }
  function enemyAct(guarding) {
    const C = S.combat, e = byId(D.enemies, C.id);
    const p = e.pattern[C.idx % e.pattern.length];
    M.seen = M.seen || {};
    (M.seen[e.id] = M.seen[e.id] || [])[C.idx % e.pattern.length] = 1;
    saveMeta();
    C.idx = (C.idx + 1) % e.pattern.length;
    let d = p.dmg || 0;
    const cause = `${e.name}に倒された`;
    switch (p.intent) {
      case 'attack':
        d = Math.max(0, d - arm()); if (guarding) d = Math.floor(d / 2); else d = Math.max(1, d);
        S.hp -= d; S.lastHurt = cause;
        print(`${e.name}の攻撃。体力 -${d}`, 'r'); later(sfx.hit); break;
      case 'heavy':
        d = Math.max(0, d - arm()); if (guarding) d = Math.floor(d / 4);
        S.hp -= d; S.lastHurt = cause;
        print(`${e.name}の渾身の一撃。体力 -${d}${guarding ? '(受け流した)' : ''}`, 'r'); later(sfx.hit); break;
      case 'mind': {
        // 精神が尽きている分は体力に通る
        if (guarding) d = Math.floor(d / 2);
        const over = Math.max(0, d - S.sp);
        const was = S.sp;
        S.sp = Math.max(0, S.sp - d);
        print(`意識が削れる。精神 -${d - over}${was > 0 && S.sp === 0 ? '  ……何かが壊れた。' : ''}`, 'm');
        if (over) { S.hp -= over; S.lastHurt = cause; print(`空いた心に、痛みが流れこむ。体力 -${over}`, 'r'); later(sfx.hit); }
        break;
      }
      case 'drain':
        if (guarding) d = Math.floor(d / 2);
        S.light = Math.max(0, S.light - d);
        print(`灯りが喰われる。灯り -${d}`, 'r'); break;
      case 'steal':
        d = Math.min(S.gold, d); S.gold -= d;
        print(`懐を探られた。金 -${d}`, 'r'); break;
      default:
        print(`${e.name}は身構えている。`, 'd');
    }
    if (S.hp <= 0) return die(cause);
    combatTurn();
  }
  function win() {
    const C = S.combat, e = byId(D.enemies, C.id);
    S.combat = null;
    current = null;
    print('');
    print(e.defeat || `${e.name}は動かなくなった。`, 'w');
    later(sfx.ok);
    if (e.gold) { S.gold += e.gold; print(`  金 +${e.gold}`, 'y'); }
    arr(e.loot).forEach(addItem);
    if (e.flag) arr(e.flag).forEach(f => { S.flags[f] = true; });
    if (e.meta) gainMeta(e.meta);
    if (C.boss) return afterBoss();
    if (C.next) return runEvent(C.next, true);
    afterRoom();
  }

  // ---------- ボス ----------
  function bossScreen() {
    const F = D.floors[S.floor];
    S.at = { t: 'boss' };
    save();
    cls();
    print(F.bossIntro || '', 'w');
    current = bossScreen;
    menu([{ label: '挑む', fn: () => startCombat(F.boss, { boss: true }) }], { I: () => inventory() });
  }
  function afterBoss() {
    const F = D.floors[S.floor];
    if (F.bossOutro) { print(''); print(F.bossOutro); }
    S.floor++;
    if (S.floor >= D.floors.length) return endingCheck();
    S.at = { t: 'floor' };
    save();
    const stairs = () => menu([{ label: '下へ降りる', fn: enterFloor }], { I: () => inventory() });
    current = () => { cls(); print('階段が、下へ続いている。'); stairs(); };
    stairs();
  }

  // ---------- 結末と死 ----------
  function endingCheck() {
    const e = (D.endings || []).find(x => !x.cond ||
      (arr(x.cond.flags).every(f => S.flags[f]) && arr(x.cond.metas).every(f => M.flags[f])));
    ending(e ? e.id : null);
  }
  function ending(id) {
    const e = byId(D.endings, id) || { id: 'none', name: '終わり', text: '……' };
    S.over = true;
    store(SAVE_KEY, null);
    M.endings[e.id] = true;
    saveMeta();
    menu([{ label: '……', fn: () => {
      cls();
      print('━━━━ ' + e.name + ' ━━━━', 'y');
      print('');
      print(e.text);
      print('');
      print('  ― 完 ―', 'w');
      if (e.meta) gainMeta(e.meta);
      menu([{ label: 'タイトルへ', fn: title }]);
    } }]);
  }
  function die(cause) {
    S.over = true;
    store(SAVE_KEY, null);
    M.deaths++;
    // 書架に並べ、次の周のために持ち物を本に挟んでおく
    M.shelf = (M.shelf || []).concat([{ n: M.deaths, cls: S.className, floor: Math.min(S.floor + 1, D.floors.length), cause: cause || '不明' }]).slice(-50);
    M.lastDeath = { floor: Math.min(S.floor, D.floors.length - 1), cls: S.className, cause: cause || '不明',
      items: S.inv.filter(id => { const it = byId(D.items, id); return it && it.kind !== 'key'; }) };
    saveMeta();
    later(() => { sfx.die(); });
    print('');
    print('＊＊＊　あなたは死んだ　＊＊＊', 'r');
    print('');
    // 死んだこと自体を記録に残す(data の deathMeta / deathMetaFloor で指定)
    if (D.deathMeta) gainMeta(D.deathMeta);
    if (D.deathMetaFloor) gainMeta(D.deathMetaFloor + Math.min(S.floor + 1, D.floors.length));
    print('死因: ' + (cause || '不明'), 'w');
    if ((D.deathTexts || []).length) print(pick(D.deathTexts));
    print(`到達: ${D.floors[Math.min(S.floor, D.floors.length - 1)].name}  通った部屋 ${S.rooms}`, 'd');
    print('');
    if ((D.hints || []).length) print('「' + D.hints[Math.floor(Math.random() * D.hints.length)] + '」', 'c');
    print('');
    print(`あなたは第${M.deaths}刷として、書架に並んだ。`, 'br');
    if (M.lastDeath.items.length) print('持ち物は、本の頁に挟まれた。次のあなたが拾えるかもしれない。', 'd');
    print('');
    print('Abort, Retry, Fail?', 'w');
    menu([
      { label: 'Retry  もう一度潜る', key: 'R', fn: newGame },
      { label: 'Abort  タイトルへ', key: 'A', fn: title },
      { label: 'Fail   記録を見る', key: 'F', fn: records },
    ]);
    updateStatus();
  }

  // 公開サイトの共通ボタン(⌂ホーム・⛶全画面。左上に固定)がある時は、上の帯に余白をとる
  [300, 1200, 3000].forEach(ms => setTimeout(() => { if (document.getElementById('shl-home')) document.body.classList.add('shell'); }, ms));

  // 検証用(ブラウザの開発ツールから呼ぶ)
  window.GAME = { get S() { return S; }, get M() { return M; }, chance };
  boot();
})();
