/*
 * StoryBook Engine ― ui.js(見開きの絵本UI)
 *
 * 左ページ=挿絵(SVG。絵の中の物をさわって選ぶ)、右ページ=文章と選択肢。
 * ページはめくる。ポケット(持ち物)・結末の本棚・設定・しおり(戻る)つき。
 * game.art = { w, h, defs(), bg(name), prop(name) } を渡すと、絵を描ける。
 */
(function (root) {
  "use strict";
  const Core = root.BookCore;

  function h(tag, attrs, ...kids) {
    const el = document.createElement(tag);
    if (attrs) for (const k in attrs) {
      const v = attrs[k];
      if (v == null || v === false) continue;
      if (k === "class") el.className = v;
      else if (k === "html") el.innerHTML = v;
      else if (k.startsWith("on")) el.addEventListener(k.slice(2), v);
      else el.setAttribute(k, v === true ? "" : v);
    }
    kids.flat().forEach((c) => { if (c != null && c !== false) el.append(c.nodeType ? c : document.createTextNode(c)); });
    return el;
  }
  // 手描きふうに、線を少しだけゆらす
  const WC = '<filter id="sb-wc" x="-10%" y="-10%" width="120%" height="120%"><feTurbulence type="fractalNoise" baseFrequency="0.028" numOctaves="3" seed="4" result="w1"/><feDisplacementMap in="SourceGraphic" in2="w1" scale="7" result="d1"/><feTurbulence type="fractalNoise" baseFrequency="0.045" numOctaves="2" seed="11" result="w2"/><feDisplacementMap in="SourceGraphic" in2="w2" scale="4" result="d2"/><feComponentTransfer in="d2" result="d2b"><feFuncA type="linear" slope=".55"/></feComponentTransfer><feMerge result="mm"><feMergeNode in="d2b"/><feMergeNode in="d1"/></feMerge><feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="8" result="g"/><feColorMatrix in="g" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  3.4 0 0 0 -0.52" result="m"/><feComposite in="mm" in2="m" operator="in"/></filter>';
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

  function mount(game, rootEl) {
    const art = game.art;
    const eng = Core.createEngine(game);
    const K = (s) => game.id + ":" + s;
    const store = {
      get(k, d) { try { const v = localStorage.getItem(K(k)); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
      set(k, v) { try { localStorage.setItem(K(k), JSON.stringify(v)); } catch (e) { /* 保存できなくても遊べる */ } }
    };
    eng.endings = store.get("endings", {});
    const settings = Object.assign({ size: 1, labels: false, sparkle: true, sound: true, music: 0.7, sfx: 0.8, idleFx: true, cameo: true }, store.get("settings", {}));
    const audio = (game.audio && root.BookAudio) ? root.BookAudio.create(game) : null;
    if (audio) { audio.on = !!settings.sound; audio.music = settings.music; audio.sfxVol = settings.sfx; }
    const snd = (n) => { if (audio) audio.sfx(n); };
    const saveSettings = () => store.set("settings", settings);

    const endingIds = Object.keys(game.scenes).filter((id) => game.scenes[id].ending);
    const endingNo = (id) => endingIds.indexOf(id) + 1;
    const reduceMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let pageIdx = 0;
    let busy = false;
    let lastArtKey = "";
    let ui = {};

    // ── 骨組み ─────────────────────────────
    rootEl.replaceChildren();
    rootEl.classList.add("sb-root");
    ui.cover = h("div", { class: "sb-cover", id: "sb-cover" });
    ui.book = h("div", { class: "sb-book", hidden: true },
      h("div", { class: "sb-spine", "aria-hidden": "true" }),
      ui.left = h("section", { class: "sb-page sb-left", "aria-label": "挿絵" },
        ui.stage = h("div", { class: "sb-stage", "aria-hidden": "true" }),
        ui.artwrap = h("div", { class: "sb-artwrap" },
          ui.fxBehind = h("div", { class: "sb-fxbox behind", "aria-hidden": "true" }),
          ui.artFrame = h("div", { class: "sb-art" }, ui.svgHost = h("div", { class: "sb-svghost" }), ui.ambLayer = h("div", { class: "sb-fxlayer", "aria-hidden": "true" }), ui.fxLayer = h("div", { class: "sb-fxlayer", "aria-hidden": "true" })),
          ui.frameOrn = h("div", { class: "sb-frameorn", "aria-hidden": "true" }),
          ui.fxFront = h("div", { class: "sb-fxbox front", "aria-hidden": "true" })),
        ui.caption = h("p", { class: "sb-caption" }),
        ui.pocket = h("div", { class: "sb-pocket", "aria-label": "ポケットの中身" }),
        ui.note = h("div", { class: "sb-note", role: "status", "aria-live": "polite" })),
      ui.right = h("section", { class: "sb-page sb-right", "aria-label": "本文" },
        h("header", { class: "sb-runner" }, ui.zone = h("span"), ui.folio = h("span")),
        ui.body = h("div", { class: "sb-body" }),
        h("footer", { class: "sb-turn" },
          ui.prev = h("button", { class: "sb-turnbtn", type: "button", onclick: () => prevPage() }, "◂ まえ"),
          ui.dots = h("span", { class: "sb-dots", "aria-hidden": "true" }),
          ui.next = h("button", { class: "sb-turnbtn sb-next", type: "button", onclick: () => nextPage() }, "めくる ▸"))),
      ui.curl = h("button", { class: "sb-curl", type: "button", "aria-label": "つぎのページへ", onclick: () => nextPage() }));
    ui.menuBtn = h("button", { class: "sb-menubtn", type: "button", "aria-label": "しおりメニュー", onclick: () => toggleMenu() }, "🔖");
    ui.soundBtn = audio ? h("button", { class: "sb-menubtn sb-soundbtn", type: "button", "aria-label": "音のオンオフ", onclick: () => { settings.sound = !settings.sound; saveSettings(); audio.unlock(); audio.setOn(settings.sound); ui.soundBtn.textContent = settings.sound ? "🔊" : "🔇"; } }, settings.sound ? "🔊" : "🔇") : null;
    ui.menu = h("div", { class: "sb-menu", hidden: true });
    ui.modal = h("div", { class: "sb-modal", hidden: true });
    rootEl.insertAdjacentHTML("beforeend", `<svg width="0" height="0" style="position:absolute" aria-hidden="true"><defs>${WC}</defs></svg>`);
    rootEl.append(ui.cover, ui.book, ui.menuBtn, ...(ui.soundBtn ? [ui.soundBtn] : []), ui.menu, ui.modal);
    applySettings();
    if (audio) {
      const unlock = () => { audio.unlock(); window.removeEventListener("pointerdown", unlock, true); window.removeEventListener("keydown", unlock, true); };
      window.addEventListener("pointerdown", unlock, true); window.addEventListener("keydown", unlock, true);
    }

    ["pointerdown", "keydown", "wheel", "touchstart"].forEach((t) => window.addEventListener(t, (ev) => {
      if (ev.target && ev.target.closest && ev.target.closest(".sb-char")) return;
      idleReset(false);
    }, true));

    function applySettings() {
      rootEl.style.setProperty("--fs", String(settings.size));
      rootEl.classList.toggle("labels-on", !!settings.labels);
      rootEl.classList.toggle("sparkle-on", !!settings.sparkle);
    }

    // ── 表紙 ─────────────────────────────
    function showCover() {
      const hasSave = !!localStorage.getItem(K("save"));
      const got = Object.keys(eng.endings).length;
      ui.book.hidden = true; ui.cover.hidden = false; ui.menuBtn.hidden = true;
      document.title = game.title;
      if (audio) audio.cover();
      ui.cover.replaceChildren(
        h("div", { class: "sb-cover-card" },
          h("p", { class: "sb-cover-eyebrow" }, game.eyebrow || ""),
          h("h1", { class: "sb-cover-title" }, game.title),
          h("p", { class: "sb-cover-sub" }, game.subtitle || ""),
          h("div", { class: "sb-cover-art", html: art.cover ? art.cover() : "" }),
          h("div", { class: "sb-cover-buttons" },
            h("button", { class: "sb-btn primary", type: "button", onclick: () => newGame() }, "はじめから読む"),
            hasSave ? h("button", { class: "sb-btn", type: "button", onclick: () => continueGame() }, "つづきから読む") : null,
            h("button", { class: "sb-btn", type: "button", onclick: () => openShelf() }, `結末の本棚  ${got} / ${endingIds.length}`),
            h("button", { class: "sb-btn ghost", type: "button", onclick: () => openSettings() }, "せってい")),
          h("p", { class: "sb-cover-foot" }, game.credit || "")));
    }
    function newGame() { eng.start(); persist(); openBook(); }
    function continueGame() {
      if (!eng.load(localStorage.getItem(K("save")))) eng.start();
      openBook();
    }
    function openBook() {
      ui.cover.hidden = true; ui.book.hidden = false; ui.menuBtn.hidden = false;
      pageIdx = 0; lastArtKey = "";
      render(true);
    }
    function persist() { try { localStorage.setItem(K("save"), eng.serialize()); } catch (e) { /* 無視 */ } store.set("endings", eng.endings); }

    // ── 描画 ─────────────────────────────
    function sceneArt() {
      const sc = eng.scene();
      return Object.assign({ bg: "river", deco: [] }, typeof sc.art === "string" ? { bg: sc.art } : sc.art);
    }
    function propG(spec, extra) {
      const [p, x, y, s, flip] = spec;
      const sc = s == null ? 1 : s;
      return `<g class="sb-prop ${extra || ""}" transform="translate(${x} ${y}) scale(${flip ? -sc : sc} ${sc})">${art.prop(p)}</g>`;
    }
    // ── 動くもの(別の小さな層。transform と opacity だけで動かす) ─────────────
    const NS = "http://www.w3.org/2000/svg";
    const boxCache = {};
    function propBox(name) {
      if (boxCache[name]) return boxCache[name];
      const svg = document.createElementNS(NS, "svg");
      svg.setAttribute("width", "0"); svg.setAttribute("height", "0");
      svg.style.cssText = "position:absolute;left:-9999px;top:0;visibility:hidden";
      svg.innerHTML = `<g>${art.prop(name)}</g>`;
      document.body.appendChild(svg);
      let bb = { x: -20, y: -40, width: 40, height: 40 };
      try { bb = bboxNoFill(svg.firstChild); } catch (e) { /* 無視 */ }
      document.body.removeChild(svg);
      const pad = 6;
      return (boxCache[name] = { x: bb.x - pad, y: bb.y - pad, w: Math.max(8, bb.width + pad * 2), h: Math.max(8, bb.height + pad * 2) });
    }
    // 子ども描き風の絵は、はみ出す塗り(.kf)を除いて大きさを測る
    function bboxNoFill(el) {
      const fills = el.querySelectorAll(".kf");
      fills.forEach((f) => { f.style.display = "none"; });
      let bb;
      try { bb = el.getBBox(); } finally { fills.forEach((f) => { f.style.display = ""; }); }
      return bb;
    }
    function fxSvg(name, b) {
      return `<svg viewBox="${b.x} ${b.y} ${b.w} ${b.h}" style="overflow:visible"><g filter="url(#sb-wc)">${art.prop(name)}</g></svg>`;
    }
    function animStyle(o) {
      let st = "";
      if (o.d) st += `animation-duration:${o.d}s;`;
      if (o.delay != null) st += `animation-delay:${-Math.abs(o.delay)}s;`;
      if (o.dx) st += `--dx:${o.dx};`;
      if (o.dy) st += `--dy:${o.dy};`;
      return st;
    }
    // 絵の座標(art.w × art.h)で置く
    function worldFx(name, o) {
      const b = propBox(name), s = o.s == null ? 1 : o.s;
      const el = h("div", { class: "sb-fx" + (o.a ? " fx-" + o.a : "") + (o.flap ? " flap" : "") });
      el.innerHTML = fxSvg(name, b);
      el.style.cssText = `left:${(o.x + b.x * s) / art.w * 100}%;top:${(o.y + b.y * s) / art.h * 100}%;width:${b.w * s / art.w * 100}%;height:${b.h * s / art.h * 100}%;` + animStyle(o);
      if (o.flip) el.firstChild.style.transform = "scaleX(-1)";
      if (o.hs) el.dataset.hs = o.hs;
      return el;
    }
    // css で置く(枠・ページのまわり)
    function cssFx(spec) {
      const mk = (name, cls, extra) => {
        const el = h("div", { class: "sb-fx" + cls + (spec.flap ? " flap" : "") });
        el.innerHTML = fxSvg(name, propBox(name));
        el.style.cssText = extra;
        return el;
      };
      if (spec.type === "peek") {
        const box = h("div", { class: "sb-peekbox", style: spec.css });
        const bh = parseFloat((/height:([\d.]+)px/.exec(spec.css) || [0, 60])[1]);
        const el = mk(spec.p, " fx-peek", `left:0;top:0;width:100%;--bh:${bh}px;` + animStyle(spec));
        box.append(el); return box;
      }
      if (spec.type === "orbit") {
        const box = h("div", { class: "sb-orbit", style: `${spec.css};--r:${spec.r}px;` + animStyle({ d: spec.d, delay: spec.delay }) });
        const el = mk(spec.p, "", `left:var(--r);top:0;width:${spec.w}px;`);
        box.append(el); return box;
      }
      return mk(spec.p, spec.a ? " fx-" + spec.a : "", spec.css + ";" + animStyle(spec));
    }
    function buildStage() {
      const st = art.stage; if (!st) return;
      if (st.frameImage) ui.frameOrn.style.borderImageSource = `url("${st.frameImage}")`;
      if (st.wallpaper) { ui.stage.style.backgroundImage = `url("${st.wallpaper}")`; rootEl.style.setProperty("--wall", `url("${st.wallpaper}")`); }
      (st.page || []).forEach((sp) => ui.stage.append(cssFx(sp)));
      (st.frame || []).forEach((sp) => (sp.type === "peek" || sp.z !== "front" ? ui.fxBehind : ui.fxFront).append(cssFx(sp)));
    }

    // ── 枠の演出: まちがえると模様が落ちて、正解のときは模様が光る ─────────────
    const rnd = (a, b) => a + Math.random() * (b - a);
    function edgePos() {
      const side = Math.floor(Math.random() * 4), t = rnd(4, 96);
      if (side === 0) return `left:${t}%;top:-8px`;
      if (side === 1) return `left:${t}%;top:calc(100% - 10px)`;
      if (side === 2) return `left:-10px;top:${t}%`;
      return `left:calc(100% - 10px);top:${t}%`;
    }
    function burst(props, n, a, d) {
      for (let i = 0; i < n; i++) {
        const dur = d * rnd(0.8, 1.3), p = props[i % props.length];
        const el = cssFx({ p, css: `${edgePos()};width:${Math.round(rnd(14, 24))}px;--rot:${Math.round(rnd(-320, 320))}deg`, a, d: dur, dx: `${Math.round(rnd(-160, 160))}%`, dy: `${Math.round(rnd(1500, 3600))}%` });
        ui.fxFront.append(el);
        setTimeout(() => el.remove(), (dur + 0.6) * 1000);
      }
    }
    function frameFx(kind) {
      const orn = ui.frameOrn;
      const again = (c, ms) => { orn.classList.remove(c); void orn.offsetWidth; orn.classList.add(c); setTimeout(() => orn.classList.remove(c), ms); };
      if (kind === "glow") { again("glow", 2200); burst(["sparklestar"], 9, "pop", 1.5); snd("glow"); }
      else if (kind === "fall") { burst(["petal", "leaf", "flower2", "heart"], 16, "drop", 1.9); setTimeout(() => orn.classList.add("withered"), 500); snd("wilt"); }
      else if (kind === "wrong") { again("shake", 700); burst(["petal", "leaf"], 4, "drop", 1.3); }
      else if (kind === "spin") { again("spin", 2600); }
    }
    const isProgress = (o) => Core.arr(o.gives).length > 0 || Core.arr(o.sets).length > 0;

    // ── 特別なキャラクター: ときどき顔を出して、ヒントや世間話を吹き出しで言う ─────────────
    const cam = game.cameos || null;
    let arrivals = 0, lastCam = -99, camTimer = 0, camLeave = 0, camWrap = null;
    const camSeen = {};
    function hideCameo(instant) {
      clearTimeout(camTimer); clearTimeout(camLeave);
      if (!camWrap) return;
      const w = camWrap; camWrap = null;
      if (instant) { w.remove(); return; }
      w.classList.add("out"); setTimeout(() => w.remove(), 450);
    }
    function showCameo(c, line) {
      hideCameo(true);
      const w = h("div", { class: "sb-cameo " + (c.kind || "chat"), role: "note" });
      const names = c.group || [c.p];
      const chars = h("div", { class: "sb-camchars" });
      names.forEach((n, i) => {
        const el = h("div", { class: "sb-fx sb-camchar" });
        el.innerHTML = fxSvg(n, propBox(n));
        el.style.width = (c.w || (names.length > 1 ? 46 : 62)) + "px";
        el.style.animationDelay = (-i * 0.4) + "s";
        chars.append(el);
      });
      const b = h("div", { class: "sb-bubble" }, c.name ? h("b", null, c.name + "：") : null, h("span", null, line));
      w.append(b, chars);
      w.addEventListener("click", () => hideCameo());
      ui.left.append(w);
      camWrap = w; lastCam = arrivals; camSeen[c.id] = (camSeen[c.id] || 0) + 1;
      snd("pop");
      camLeave = setTimeout(() => hideCameo(), 4300 + line.length * 130);
    }
    function chooseCameo(sc) {
      if (!cam) return null;
      const ending = !!sc.ending, gap = cam.gap == null ? 3 : cam.gap;
      for (const c of cam.list) {
        if (c.kinds) { if (!ending || !c.kinds.includes(sc.ending.kind)) continue; } else if (ending) continue;
        if (c.scenes && !c.scenes.includes(sc.id)) continue;
        if (c.zone && sc.zone !== c.zone) continue;
        if (c.once && camSeen[c.id]) continue;
        if (!eng.test(c.when)) continue;
        if (!c.always && arrivals - lastCam < gap) continue;
        if (c.always || Math.random() < (c.chance == null ? 0.2 : c.chance)) return c;
      }
      return null;
    }
    function scheduleCameo(sc) {
      hideCameo(true); clearTimeout(camTimer);
      camTimer = setTimeout(() => {
        if (settings.cameo === false || eng.scene() !== sc || !ui.modal.hidden || ui.book.hidden) return;
        const c = chooseCameo(sc);
        if (c) showCameo(c, c.lines[Math.floor(Math.random() * c.lines.length)]);
      }, sc.ending ? 2400 : 1800);
    }
    function afterRender(sc) {
      arrivals++;
      idleReset(true);
      ui.frameOrn.classList.remove("withered");
      if (sc.ending) {
        const k = sc.ending.kind;
        setTimeout(() => frameFx(k === "bad" || k === "stuck" ? "fall" : k === "loop" ? "spin" : "glow"), 900);
      }
      scheduleCameo(sc);
    }


    // ── しばらく考えていると、文字が浮いて光り、虫に変わる。さわると、もとの位置にもどる ─────────────
    const CHARRE = /[一-龥ぁ-んァ-ヶー々]/;
    const idleCfg = Object.assign({ t1: 25, t2: 45, t3: 70 }, game.idle || {});
    const BUGS = ["ladybug", "bee", "butterfly", "snail", "firefly"];
    let idleTimers = [], floaters = [];
    function restoreChar(f, instant) {
      if (f.done) return;
      f.done = true;
      const finish = () => {
        f.el.remove();
        if (f.gone && f.gone.parentNode) { const par = f.gone.parentNode; f.gone.replaceWith(document.createTextNode(f.gone.textContent)); par.normalize(); }
      };
      if (instant) { finish(); return; }
      f.el.style.animation = "none";
      if (f.bug) { f.inner.innerHTML = ""; f.inner.textContent = f.ch; f.inner.style.width = ""; f.el.classList.remove("bug"); }
      const cur = f.inner.getBoundingClientRect(), home = f.el.getBoundingClientRect();
      const dx = cur.left - home.left, dy = cur.top - home.top;
      f.inner.style.animation = "none";
      f.inner.style.transform = `translate(${dx}px,${dy}px)`;
      void f.inner.offsetWidth;
      f.inner.style.transition = "transform .5s cubic-bezier(.3,1.4,.5,1)";
      f.inner.style.transform = "translate(0,0) rotate(0)";
      f.el.classList.add("home");
      snd("pop");
      setTimeout(finish, 580);
    }
    function clearFloaters(instant) { const fs = floaters; floaters = []; fs.forEach((f) => restoreChar(f, instant)); }
    function floatVars(f, wide) {
      const pr = ui.right.getBoundingClientRect(), hr = f.home;
      const minX = -(hr.left - pr.left) + 10, maxX = pr.right - hr.right - 10;
      const rx = (a) => Math.max(minX, Math.min(maxX, a));
      const w = wide ? 130 : 36, up = wide ? 90 : 60, dn = wide ? 70 : 14;
      const st = f.el.style;
      st.setProperty("--x1", rx(rnd(-w, w)) + "px"); st.setProperty("--y1", rnd(-up, dn) + "px"); st.setProperty("--r1", rnd(-25, 25) + "deg");
      st.setProperty("--x2", rx(rnd(-w, w)) + "px"); st.setProperty("--y2", rnd(-up, dn) + "px"); st.setProperty("--r2", rnd(-25, 25) + "deg");
      st.setProperty("--t", (wide ? rnd(5, 9) : rnd(3, 6)) + "s");
    }
    function bugify(f) {
      if (f.bug || f.done) return;
      f.bug = true;
      const name = BUGS[Math.floor(Math.random() * BUGS.length)];
      f.inner.innerHTML = fxSvg(name, propBox(name));
      f.inner.style.width = Math.round(f.home.height * 1.15) + "px";
      f.el.classList.add("bug");
      floatVars(f, true);
      snd("pop");
    }
    function liftChars(n) {
      if (ui.book.hidden || !ui.modal.hidden || busy) return [];
      const rr = ui.right.getBoundingClientRect(), br = ui.body.getBoundingClientRect();
      const cands = [];
      ui.body.querySelectorAll(".sb-text p").forEach((p) => {
        const tw = document.createTreeWalker(p, NodeFilter.SHOW_TEXT);
        let node;
        while ((node = tw.nextNode())) { const t = node.nodeValue; for (let i = 0; i < t.length; i++) if (CHARRE.test(t[i])) cands.push({ node, i }); }
      });
      for (let i = cands.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [cands[i], cands[j]] = [cands[j], cands[i]]; }
      const chosen = [];
      for (const c of cands) {
        if (chosen.length >= n) break;
        const r = document.createRange(); r.setStart(c.node, c.i); r.setEnd(c.node, c.i + 1);
        const rc = r.getBoundingClientRect();
        if (!rc.width || rc.top < br.top + 4 || rc.bottom > br.bottom - 4) continue;
        chosen.push({ c, rc });
      }
      const byNode = new Map();
      chosen.forEach((x) => { if (!byNode.has(x.c.node)) byNode.set(x.c.node, []); byNode.get(x.c.node).push(x); });
      const made = [];
      byNode.forEach((arr0, node) => {
        arr0.sort((a, b) => b.c.i - a.c.i).forEach(({ c, rc }) => {
          const ch = node.nodeValue[c.i], par = node.parentElement, cs = getComputedStyle(par);
          const r = document.createRange(); r.setStart(node, c.i); r.setEnd(node, c.i + 1);
          const gone = document.createElement("span"); gone.className = "sb-gone";
          try { r.surroundContents(gone); } catch (e) { return; }
          const inner = h("span", { class: "in" }, ch);
          const el = h("div", { class: "sb-char", "aria-hidden": "true", style: `left:${rc.left - rr.left}px;top:${rc.top - rr.top}px;width:${rc.width}px;height:${rc.height}px;font-size:${cs.fontSize};` }, inner);
          const f = { el, inner, gone, ch, home: rc, bug: false, done: false };
          floatVars(f, false);
          el.addEventListener("pointerenter", () => restoreChar(f));
          el.addEventListener("pointerdown", (ev) => { ev.preventDefault(); restoreChar(f); });
          ui.right.append(el);
          floaters.push(f); made.push(f);
        });
      });
      if (made.length) snd("glow");
      return made;
    }
    function idleStage(stage) {
      if (settings.idleFx === false || ui.book.hidden || !ui.modal.hidden || busy || reduceMotion()) return;
      if (stage === 1) liftChars(10);
      else if (stage === 2) { liftChars(10); floaters.filter((f) => !f.bug).slice(0, 6).forEach(bugify); }
      else { liftChars(12); floaters.filter((f) => !f.bug).slice(0, 8).forEach(bugify); }
    }
    function idleReset(instant) {
      idleTimers.forEach(clearTimeout); idleTimers = [];
      clearFloaters(!!instant);
      if (ui.book.hidden) return;
      idleTimers.push(setTimeout(() => idleStage(1), idleCfg.t1 * 1000), setTimeout(() => idleStage(2), idleCfg.t2 * 1000), setTimeout(() => idleStage(3), idleCfg.t3 * 1000));
    }
    let ambKey = "";
    function buildAmbient(bg) {
      if (bg === ambKey) return;
      ambKey = bg; ui.ambLayer.replaceChildren();
      if (art.ambient) art.ambient(bg).forEach((o) => ui.ambLayer.append(worldFx(o.p, o)));
    }

    function renderArt(force) {
      const a = sceneArt();
      const entries = eng.options().filter((e) => e.opt.at);
      const key = eng.state.scene + "|" + entries.map((e) => e.id).join(",") + "|" + eng.state.items.join(",") + "|" + (readyHotspots() ? 1 : 0);
      if (!force && key === lastArtKey) return;
      lastArtKey = key;
      const mot = art.motion || {};
      const deco = (a.deco || []).filter((d) => !mot[d[0]]).map((d) => propG(d)).join("");
      const hs = entries.map((e) => {
        const at = e.opt.at;
        const sc = at[3] == null ? 1 : at[3];
        return `<g class="sb-hs${e.enabled ? "" : " is-locked"}${mot[at[0]] ? " has-actor" : ""}" data-id="${esc(e.id)}" tabindex="0" role="button" aria-label="${esc(e.opt.label)}">` +
          `<g class="sb-hsbody" filter="url(#sb-wc)">${propG(at)}</g>` +
          `<rect class="sb-hit" fill="transparent"/>` +
          `<g class="sb-tag"><rect rx="7"/><text>${esc(e.opt.label)}</text></g></g>`;
      }).join("");
      ui.svgHost.innerHTML = `<svg viewBox="0 0 ${art.w} ${art.h}" class="sb-svg" role="img" aria-label="${esc(eng.scene().title)}の挿絵" preserveAspectRatio="xMidYMid meet">` +
        `<defs>${WC}${art.defs ? art.defs() : ""}</defs><g class="sb-world" filter="url(#sb-wc)">${art.bg(a.bg, eng.state)}${deco}</g><g class="sb-hotspots">${hs}</g></svg>`;
      const svg = ui.svgHost.querySelector("svg");
      ui.fxLayer.replaceChildren();
      buildAmbient(a.bg);
      (a.deco || []).filter((d) => mot[d[0]]).forEach((d, i) => ui.fxLayer.append(worldFx(d[0], { x: d[1], y: d[2], s: d[3], flip: d[4], a: mot[d[0]], d: 3 + (i % 3) * 0.7, delay: i * 0.9 })));
      svg.querySelectorAll(".sb-hs").forEach((g, i) => {
        const bb = bboxNoFill(g.querySelector(".sb-hsbody"));
        const hit = g.querySelector(".sb-hit");
        hit.setAttribute("x", bb.x - 6); hit.setAttribute("y", bb.y - 6);
        hit.setAttribute("width", bb.width + 12); hit.setAttribute("height", bb.height + 12);
        const hsEntry = entries.find((e) => e.id === g.dataset.id);
        const at = hsEntry && hsEntry.opt.at;
        if (settings.sparkle) ui.fxLayer.append(worldFx("sparklestar", { x: bb.x + bb.width - 2, y: bb.y + 18, s: 0.7, a: "twinkle", d: 2.4 + (i % 3) * 0.5, delay: i * 0.45 }));
        if (at && mot[at[0]]) ui.fxLayer.append(worldFx(at[0], { x: at[1], y: at[2], s: at[3] == null ? 1 : at[3], flip: at[4], a: mot[at[0]], d: 3 + (i % 3) * 0.6, delay: i * 0.7, hs: g.dataset.id }));
        const tag = g.querySelector(".sb-tag"), t = tag.querySelector("text"), r = tag.querySelector("rect");
        const w = Math.max(40, t.getComputedTextLength() + 18);
        const tx = Math.min(Math.max(bb.x + bb.width / 2, w / 2 + 6), art.w - w / 2 - 6);
        const below = bb.y + bb.height + 36 < art.h;
        const ty = below ? bb.y + bb.height + 8 : bb.y - 30;
        r.setAttribute("x", tx - w / 2); r.setAttribute("y", ty); r.setAttribute("width", w); r.setAttribute("height", 24);
        t.setAttribute("x", tx); t.setAttribute("y", ty + 16);
      });
      svg.addEventListener("click", (ev) => {
        const g = ev.target.closest(".sb-hs"); if (g) pick(g.dataset.id);
      });
      const hot = (ev, on) => {
        const g = ev.target.closest && ev.target.closest(".sb-hs"); if (!g) return;
        ui.fxLayer.querySelectorAll(`.sb-fx[data-hs="${CSS.escape(g.dataset.id)}"]`).forEach((n) => n.classList.toggle("hot", on));
      };
      svg.addEventListener("mouseover", (ev) => hot(ev, true));
      svg.addEventListener("mouseout", (ev) => hot(ev, false));
      svg.addEventListener("keydown", (ev) => {
        if (ev.key !== "Enter" && ev.key !== " ") return;
        const g = ev.target.closest(".sb-hs"); if (g) { ev.preventDefault(); pick(g.dataset.id); }
      });
    }
    function readyHotspots() { return pageIdx >= pgs.length - 1; }

    function renderPocket() {
      ui.pocket.replaceChildren(h("span", { class: "sb-pocket-label" }, "ポケット"));
      eng.state.items.forEach((id) => {
        const it = game.items[id]; if (!it) return;
        const slot = h("span", { class: "sb-slot", tabindex: "0", title: it.name, "aria-label": it.name + (it.desc ? "。" + it.desc : "") });
        slot.innerHTML = `<svg viewBox="-50 -60 100 70"><g transform="translate(0 0)">${art.prop(it.prop)}</g></svg><span class="sb-slot-name">${esc(it.name)}</span>`;
        ui.pocket.append(slot);
        const svg = slot.querySelector("svg"), g = svg.firstChild, bb = g.getBBox();
        const m = 6, side = Math.max(bb.width, bb.height) + m * 2;
        svg.setAttribute("viewBox", `${bb.x + bb.width / 2 - side / 2} ${bb.y + bb.height / 2 - side / 2} ${side} ${side}`);
      });
      ui.pocket.hidden = false;
    }

    // ── 文章を、実際のページの大きさに合わせて自動でページ分けする ─────────────
    let pgs = [{ first: true, items: [] }];
    let pgsKey = "";
    const sentences = (t) => {
      const raw = t.match(/[^。！？]*[。！？]+[」』）)]?|[^。！？]+$/g) || [t];
      const out = [];
      let buf = "";
      raw.forEach((x) => {
        buf += x;
        const open = (buf.match(/\*\*/g) || []).length % 2 || (buf.match(/==/g) || []).length % 2;
        if (!open) { out.push(buf); buf = ""; }
      });
      if (buf) out.push(buf);
      return out;
    };

    function headNodes(sc, first) {
      const z = (game.zones && game.zones[sc.zone]) || {};
      const kids = [];
      if (first) {
        if (sc.ending) {
          const kd = game.endingKinds[sc.ending.kind];
          kids.push(h("p", { class: "sb-ribbon", style: `--rc:${kd.color}` }, kd.name));
        } else if (z.kicker) kids.push(h("p", { class: "sb-kicker" }, z.kicker));
        kids.push(h("h2", { class: "sb-title" }, sc.ending ? sc.ending.name : sc.title));
      } else kids.push(h("p", { class: "sb-orn", "aria-hidden": "true" }, "❦"));
      return kids;
    }
    // 文中の印: **大事な文**(色つき) と ==いちばん大事な文==(虹色)
    function rich(t) {
      const out = [];
      t.split(/(\*\*[^*]+?\*\*|==[^=]+?==)/).forEach((seg) => {
        if (!seg) return;
        if (seg.startsWith("**")) out.push(h("span", { class: "sb-em" }, seg.slice(2, -2)));
        else if (seg.startsWith("==")) out.push(h("span", { class: "sb-rainbow" }, seg.slice(2, -2)));
        else out.push(seg);
      });
      return out;
    }
    const textNode = (items) => h("div", { class: "sb-text" }, items.map((it) => h("p", { class: it.cont ? "cont" : null }, rich(it.t))));

    function paginate() {
      const sc = eng.scene();
      const paras = eng.pages().join("\n").split("\n").filter(Boolean);
      const m = ui.body.cloneNode(false);
      m.className = "sb-body sb-measure";
      m.style.cssText = "position:absolute;visibility:hidden;pointer-events:none;left:0;top:0;height:auto;overflow:visible;width:" + ui.body.clientWidth + "px";
      ui.right.append(m);
      const avail = ui.body.clientHeight;
      const mk = (first, items, withChoices) => {
        m.replaceChildren(...headNodes(sc, first), textNode(items), ...(withChoices ? [h("div", { class: "sb-choices" }, choiceNodes())] : []));
        return m.scrollHeight;
      };
      const out = [];
      const queue = paras.map((t) => ({ t, cont: false }));
      let first = true;
      let guard = 0;
      while (queue.length && guard++ < 200) {
        const cur = [];
        while (queue.length) {
          const it = queue[0];
          cur.push(it);
          if (mk(first, cur, false) <= avail) { queue.shift(); continue; }
          cur.pop();
          const ss = sentences(it.t);
          let n = 0;
          for (let i = 0; i < ss.length; i++) {
            cur.push({ t: ss.slice(0, i + 1).join(""), cont: it.cont });
            const fits = mk(first, cur, false) <= avail;
            cur.pop();
            if (!fits) break;
            n = i + 1;
          }
          if (n === 0 && !cur.length) n = 1;
          if (n > 0) {
            cur.push({ t: ss.slice(0, n).join(""), cont: it.cont });
            const rest = ss.slice(n).join("");
            if (rest) queue[0] = { t: rest, cont: true }; else queue.shift();
          }
          break;
        }
        out.push({ first, items: cur });
        first = false;
      }
      if (!out.length) out.push({ first: true, items: [] });
      // 最後のページに選択肢が入らなければ、さいごの段落(なければ文)を次のページへ送る
      let last = out[out.length - 1];
      let g2 = 0;
      while (mk(last.first, last.items, true) > avail && g2++ < 20) {
        let moved;
        if (last.items.length > 1) moved = last.items.pop();
        else {
          const ss = sentences(last.items[0].t);
          if (ss.length < 2) break;
          last.items[0] = { t: ss.slice(0, -1).join(""), cont: last.items[0].cont };
          moved = { t: ss[ss.length - 1], cont: true };
        }
        last = { first: false, items: [moved] };
        out.push(last);
      }
      m.remove();
      return out;
    }

    function layout(force) {
      const sc = eng.scene();
      const key = [sc.id, eng.pages().length, eng.pages().join("").length, eng.options().map((e) => e.id).join(","), settings.size, ui.body.clientWidth, ui.body.clientHeight].join("|");
      if (!force && key === pgsKey) return;
      pgsKey = key;
      pgs = paginate();
      if (pageIdx > pgs.length - 1) pageIdx = pgs.length - 1;
    }

    function renderText() {
      clearFloaters(true);
      layout();
      const sc = eng.scene();
      const last = pageIdx >= pgs.length - 1;
      const z = (game.zones && game.zones[sc.zone]) || {};
      ui.left.style.setProperty("--hue", ((game.zones && game.zones[sc.zone] && game.zones[sc.zone].hue) || 0) + "deg");
      ui.right.style.setProperty("--accent", z.color || (sc.ending && game.endingKinds[sc.ending.kind].color) || "#8a6a3a");
      ui.zone.textContent = sc.ending ? "― 結末 ―" : (z.name || "");
      ui.caption.textContent = sc.ending ? "― " + sc.ending.name + " ―" : "挿絵 ― " + sc.title;
      ui.folio.textContent = sc.ending ? `No. ${String(endingNo(sc.id)).padStart(2, "0")} / ${endingIds.length}` : `${pageIdx + 1} / ${pgs.length}`;
      const pg = pgs[pageIdx];
      const kids = [...headNodes(sc, pg.first), textNode(pg.items)];
      if (last) kids.push(h("div", { class: "sb-choices" }, choiceNodes()));
      ui.body.replaceChildren(...kids);
      ui.body.scrollTop = 0;
      ui.prev.disabled = pageIdx === 0;
      ui.next.hidden = last;
      ui.curl.hidden = last;
      ui.dots.textContent = pgs.length > 1 ? pgs.map((_, i) => (i === pageIdx ? "●" : "○")).join(" ") : "";
      ui.right.classList.toggle("is-last", last);
    }

    function choiceNodes() {
      const sc = eng.scene();
      const out = [];
      if (sc.ending) {
        const fresh = lastIsNew;
        const got = Object.keys(eng.endings).length;
        out.push(h("p", { class: "sb-endmark" + (fresh ? " is-new" : "") },
          fresh ? `✦ はじめて出会った結末です(${got} / ${endingIds.length})` : `✦ もう一度、出会った結末です(${got} / ${endingIds.length})`));
        if (eng.canBack()) out.push(h("button", { class: "sb-choice", type: "button", onclick: () => doBack() }, h("span", { class: "sb-bullet" }, "☞"), "ひとつ前の分かれ道へもどる"));
        out.push(h("button", { class: "sb-choice", type: "button", onclick: () => doRestart() }, h("span", { class: "sb-bullet" }, "☞"), "はじめから読みなおす"));
        out.push(h("button", { class: "sb-choice", type: "button", onclick: () => openShelf() }, h("span", { class: "sb-bullet" }, "☞"), "結末の本棚をひらく"));
        return out;
      }
      const entries = eng.options();
      const texts = entries.filter((e) => !e.opt.at);
      const objs = entries.filter((e) => e.opt.at);
      texts.forEach((e) => {
        out.push(h("button", { class: "sb-choice" + (e.enabled ? "" : " is-locked"), type: "button", onclick: () => pick(e.id) },
          h("span", { class: "sb-bullet" }, e.enabled ? "☞" : "✕"), e.opt.label));
      });
      if (objs.length) out.push(h("p", { class: "sb-hinttext" }, texts.length ? "絵の中のものも、えらべます。" : "絵の中のものを、さわってみましょう。"));
      return out;
    }

    let lastIsNew = false;
    function render(fresh) {
      const sc = eng.scene();
      document.title = (sc.ending ? sc.ending.name : sc.title) + " | " + game.title;
      layout(true);
      renderArt(true);
      renderPocket();
      renderText();
      if (audio) audio.scene(sc, lastIsNew);
      afterRender(sc);
    }

    // ── ページをめくる ─────────────────────────────
    function turn(update, dir) {
      if (busy) return;
      busy = true;
      idleReset(true);
      snd("page");
      const instant = reduceMotion();
      if (instant) { update(); busy = false; return; }
      if (dir === "prev") {
        ui.right.classList.add("fade");
        setTimeout(() => { update(); ui.right.classList.remove("fade"); busy = false; }, 140);
        return;
      }
      const leaf = h("div", { class: "sb-leaf" }, h("div", { class: "sb-face front" }), h("div", { class: "sb-face back" }));
      const snap = h("div", { class: "sb-snap" });
      [...ui.right.children].forEach((c) => { if (!c.classList.contains("sb-leaf")) snap.append(c.cloneNode(true)); });
      leaf.firstChild.append(snap);
      ui.right.append(leaf);
      update();
      void leaf.offsetWidth;
      leaf.classList.add("go");
      const done = () => { leaf.remove(); busy = false; };
      leaf.addEventListener("animationend", done, { once: true });
      setTimeout(() => { if (busy) done(); }, 1200);
    }

    function nextPage() {
      if (pageIdx >= pgs.length - 1) return;
      turn(() => { pageIdx++; renderText(); renderArt(false); }, "next");
    }
    function prevPage() {
      if (pageIdx <= 0) return;
      turn(() => { pageIdx--; renderText(); renderArt(false); }, "prev");
    }

    // ── 選ぶ ─────────────────────────────
    function pick(id) {
      if (busy) return;
      const entry = eng.options().find((e) => e.id === id);
      if (!entry) return;
      if (!readyHotspots() && entry.opt.at) { toast("ページをさいごまで めくってから えらんでね。"); return; }
      const before = eng.state.items.slice();
      if (entry.enabled && entry.opt.next) {
        let res;
        turn(() => {
          res = eng.choose(id);
          lastIsNew = !!res.isNew;
          pageIdx = 0; render();
          persist();
          if (res.msg) toast(res.msg);
          if (isProgress(entry.opt)) setTimeout(() => frameFx("glow"), 800);
        }, "next");
        return;
      }
      const res = eng.choose(id);
      if (res.kind === "locked") { snd("locked"); toast(res.msg); shake(id); frameFx("wrong"); return; }
      snd(res.kind === "take" ? "item" : "pick");
      const got = eng.state.items.filter((i) => !before.includes(i));
      const lost = before.filter((i) => !eng.state.items.includes(i));
      let msg = res.msg;
      if (!msg && got.length) msg = got.map((i) => `「${game.items[i].name}」をポケットに入れました。`).join(" ");
      if (!msg && lost.length) msg = lost.map((i) => `「${game.items[i].name}」をわたしました。`).join(" ");
      if (msg) toast(msg);
      if (res.kind === "take" || isProgress(entry.opt)) frameFx("glow");
      layout(); lastArtKey = ""; renderArt(true); renderPocket(); renderText(); persist();
    }
    function shake(id) {
      const g = ui.artFrame.querySelector(`.sb-hs[data-id="${CSS.escape(id)}"]`);
      if (g) { g.classList.remove("shake"); void g.getBoundingClientRect(); g.classList.add("shake"); }
    }
    let noteTimer = 0;
    function toast(msg) {
      ui.note.textContent = msg;
      ui.note.classList.remove("show"); void ui.note.offsetWidth; ui.note.classList.add("show");
      clearTimeout(noteTimer);
      noteTimer = setTimeout(() => ui.note.classList.remove("show"), 4200);
    }
    function doBack() {
      if (!eng.canBack()) return;
      turn(() => { eng.back(); lastIsNew = false; pageIdx = 0; render(); persist(); }, "prev");
    }
    function doRestart() {
      turn(() => { eng.start(); lastIsNew = false; pageIdx = 0; render(); persist(); }, "next");
    }

    // ── メニュー・本棚・設定 ─────────────────────────────
    function toggleMenu(force) {
      const open = force != null ? force : ui.menu.hidden;
      ui.menu.hidden = !open;
      if (!open) return;
      ui.menu.replaceChildren(
        h("button", { type: "button", disabled: !eng.canBack(), onclick: () => { toggleMenu(false); doBack(); } }, "↩ ひとつ前の分かれ道へ"),
        h("button", { type: "button", onclick: () => { toggleMenu(false); doRestart(); } }, "⟲ はじめから"),
        h("button", { type: "button", onclick: () => { toggleMenu(false); openShelf(); } }, "📚 結末の本棚"),
        h("button", { type: "button", onclick: () => { toggleMenu(false); openSettings(); } }, "⚙ せってい"),
        h("button", { type: "button", onclick: () => { toggleMenu(false); persist(); showCover(); } }, "📖 表紙へ"));
    }
    function closeModal() { ui.modal.hidden = true; ui.modal.replaceChildren(); }
    function modal(title, content, wide) {
      ui.modal.hidden = false;
      ui.modal.replaceChildren(h("div", { class: "sb-modal-bg", onclick: closeModal }),
        h("div", { class: "sb-modal-card" + (wide ? " wide" : ""), role: "dialog", "aria-label": title },
          h("div", { class: "sb-modal-head" }, h("h3", null, title), h("button", { type: "button", class: "sb-x", "aria-label": "閉じる", onclick: closeModal }, "✕")),
          h("div", { class: "sb-modal-body" }, content)));
    }
    function openShelf() {
      const got = Object.keys(eng.endings).length;
      const kinds = Object.keys(game.endingKinds);
      const sections = kinds.map((k) => {
        const kd = game.endingKinds[k];
        const ids = endingIds.filter((id) => game.scenes[id].ending.kind === k);
        const have = ids.filter((id) => eng.endings[id]).length;
        return h("section", { class: "sb-shelf-sec", style: `--rc:${kd.color}` },
          h("h4", null, h("span", { class: "sb-chip" }, kd.name), h("span", { class: "sb-count" }, `${have} / ${ids.length}`)),
          h("ol", null, ids.map((id) => {
            const e = game.scenes[id].ending, has = !!eng.endings[id];
            return h("li", { class: has ? "got" : "lock" },
              h("span", { class: "no" }, String(endingNo(id)).padStart(2, "0")),
              h("span", { class: "nm" }, has ? e.name : "？？？？？"),
              h("span", { class: "ht" }, has ? (e.summary || "") : (e.hint ? "ヒント: " + e.hint : "")));
          })));
      });
      modal("結末の本棚", [
        h("p", { class: "sb-shelf-lead" }, `これまでに ${got} / ${endingIds.length} の午後に出会いました。`),
        h("div", { class: "sb-bar", "aria-hidden": "true" }, h("i", { style: `width:${Math.round(got / endingIds.length * 100)}%` })),
        ...sections], true);
    }
    function openSettings() {
      const sizeBtn = (v, t) => h("button", { type: "button", class: "sb-seg" + (settings.size === v ? " on" : ""), onclick: () => { settings.size = v; saveSettings(); applySettings(); openSettings(); } }, t);
      const tog = (key, t) => h("label", { class: "sb-toggle" }, h("input", { type: "checkbox", checked: !!settings[key], onchange: (ev) => { settings[key] = ev.target.checked; saveSettings(); applySettings(); if (key === "sound" && audio) { audio.unlock(); audio.setOn(settings.sound); if (ui.soundBtn) ui.soundBtn.textContent = settings.sound ? "🔊" : "🔇"; } } }), t);
      modal("せってい", [
        h("div", { class: "sb-set" }, h("b", null, "もじの大きさ"), h("div", null, sizeBtn(0.9, "小"), sizeBtn(1, "ふつう"), sizeBtn(1.15, "大"), sizeBtn(1.3, "とても大"))),
        h("div", { class: "sb-set" }, tog("labels", "絵の中のものの名前を、いつも出す")),
        h("div", { class: "sb-set" }, tog("sparkle", "さわれるものに、きらきらを付ける")),
        h("div", { class: "sb-set" }, tog("idleFx", "しばらく考えていると、文字が浮かんで虫になる")),
        h("div", { class: "sb-set" }, tog("cameo", "ときどき、特別なキャラクターが、ひとこと言いに来る")),
        ...(audio ? [
          h("div", { class: "sb-set" }, tog("sound", "音を出す(BGMと効果音)")),
          h("div", { class: "sb-set" }, h("b", null, "BGMの大きさ"), h("input", { type: "range", min: "0", max: "100", value: String(Math.round(settings.music * 100)), oninput: (ev) => { settings.music = ev.target.value / 100; saveSettings(); audio.setMusic(settings.music); } })),
          h("div", { class: "sb-set" }, h("b", null, "効果音の大きさ"), h("input", { type: "range", min: "0", max: "100", value: String(Math.round(settings.sfx * 100)), oninput: (ev) => { settings.sfx = ev.target.value / 100; saveSettings(); audio.setSfx(settings.sfx); }, onchange: () => snd("pick") }))
        ] : []),
        h("div", { class: "sb-set" }, h("button", { type: "button", class: "sb-btn ghost", onclick: () => {
          if (confirm("読み進めた記録と、集めた結末をすべて消します。よろしいですか?")) {
            eng.endings = {}; try { localStorage.removeItem(K("save")); localStorage.removeItem(K("endings")); } catch (e) { /* 無視 */ }
            closeModal(); showCover();
          }
        } }, "記録をぜんぶ消す"))]);
    }

    document.addEventListener("keydown", (ev) => {
      if (ev.key === "Escape") { if (!ui.modal.hidden) closeModal(); else if (!ui.menu.hidden) toggleMenu(false); return; }
      if (ui.book.hidden || !ui.modal.hidden) return;
      if (ev.key === "ArrowRight") nextPage();
      else if (ev.key === "ArrowLeft") prevPage();
    });

    // 検証・撮影用の入口: #scene=ID&items=a,b&flags=x,y&page=1
    function hashStart() {
      const m = /^#(.+)$/.exec(location.hash); if (!m) return false;
      const q = new URLSearchParams(m[1]);
      if (!q.get("scene") || !game.scenes[q.get("scene")]) return false;
      eng.start(); eng.state.visits = {};
      (q.get("items") || "").split(",").filter(Boolean).forEach((i) => eng.state.items.push(i));
      (q.get("flags") || "").split(",").filter(Boolean).forEach((f) => { eng.state.flags[f] = 1; });
      (q.get("visits") || "").split(",").filter(Boolean).forEach((p) => { const [k, v] = p.split(":"); eng.state.visits[k] = +v; });
      eng.state.scene = q.get("scene");
      eng.state.visits[eng.state.scene] = eng.state.visits[eng.state.scene] || 1;
      const sc = game.scenes[eng.state.scene];
      lastIsNew = !!(sc.ending);
      ui.cover.hidden = true; ui.book.hidden = false; ui.menuBtn.hidden = false;
      pageIdx = +q.get("page") || 0;
      render();
      pageIdx = Math.min(pageIdx, pgs.length - 1);
      renderText(); renderArt(false);
      return true;
    }

    buildStage();
    let rz = 0;
    window.addEventListener("resize", () => {
      clearTimeout(rz);
      rz = setTimeout(() => { if (ui.book.hidden) return; const old = pgsKey; layout(true); if (old !== pgsKey) { renderText(); renderArt(false); } }, 200);
    });
    if (!hashStart()) showCover();
    // 撮影・検査用: 好きな場面へ(ページをめくって)移る
    function jump(id, o) {
      o = o || {};
      turn(() => {
        eng.state.scene = id;
        eng.state.visits[id] = (eng.state.visits[id] || 0) + 1;
        (o.items || []).forEach((i) => { if (!eng.state.items.includes(i)) eng.state.items.push(i); });
        (o.flags || []).forEach((f) => { eng.state.flags[f] = 1; });
        const a = eng._arrive(id, true);
        lastIsNew = !!a.isNew; pageIdx = 0; render(); persist();
      }, "next");
    }
    root.__book = { eng, game, pick, nextPage, render, openShelf, audio, jump, closeModal, frameFx, liftChars, idleStage, clearFloaters, hideCameo, cameo: (id, i) => { const c = cam && cam.list.find((x) => x.id === id); if (c) showCameo(c, c.lines[i || 0]); }, pageInfo: () => [pageIdx, pgs.length] };
    return root.__book;
  }

  root.BookUI = { mount };
})(typeof self !== "undefined" ? self : this);
