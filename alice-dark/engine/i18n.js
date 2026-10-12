/*
 * StoryBook Engine ― i18n.js(日本語/英語)。2026-10-12、大人の激ムズ版で追加。
 * - 言語は localStorage の "alice_dark:lang"("ja"/"en")。表紙のボタンで切りかえる(ページを読みこみなおす)。
 * - 画面のことば(ボタンなど)は T() の辞書で英語にする。物語の文は、game/en_*.js の「上書き」で英語にする。
 *     window.GAME_EN = { title, subtitle, eyebrow, credit, items:{id:{name,desc}}, zones:{id:{name}}, endingKinds:{k:{name}},
 *                        scenes:{ id:{ title, pages:[文,...], options:{ optId:{label,locked,msg} }, ending:{name,hint,summary} } } }
 *   pages は、元の pages 配列と同じ並び(when は元のまま)。足りないところは日本語のまま出る(検査で数える)。
 */
(function (root) {
  "use strict";
  const KEY = "alice_dark:lang";
  let lang = "ja";
  try { lang = localStorage.getItem(KEY) || (/^en/i.test(navigator.language || "") ? "en" : "ja"); } catch (e) { /* 無視 */ }
  if (/[?&]lang=(ja|en)\b/.test(location.search)) lang = RegExp.$1;
  try { document.documentElement.setAttribute("lang", lang); } catch (e) { /* 無視 */ }

  const D = {
    "めくる ▸": "Turn ▸", "◂ まえ": "◂ Back", "🔊 よむ": "🔊 Read", "このページを、こえで よみあげる": "Read this page aloud",
    "ランク": "Rank", "ポケット": "Pocket", "ポケットの中身": "What is in your pocket", "挿絵": "Illustration", "挿絵 ― ": "Illustration — ",
    "― 結末 ―": "— An Ending —", "はじめから読む": "Begin", "つづきから読む": "Continue", "せってい": "Settings",
    "↩ ひとつ前の分かれ道へ": "↩ Back to the last fork", "⟲ はじめから": "⟲ Start over", "⚙ せってい": "⚙ Settings",
    "📖 表紙へ": "📖 Cover", "📚 結末の本棚": "📚 Shelf of Endings", "📝 メモ": "📝 Notes", "しおりメニュー": "Bookmark menu",
    "つぎのページへ": "Next page", "閉じる": "Close", "音のオンオフ": "Sound on/off", "音を出す(BGMと効果音)": "Sound (music and effects)",
    "BGMの大きさ": "Music volume", "効果音の大きさ": "Effects volume", "もじの大きさ": "Text size",
    "小": "S", "ふつう": "M", "大": "L", "とても大": "XL", "ゆっくり": "Slow", "はやい": "Fast", "よみあげの はやさ": "Reading speed",
    "さわれるものに、きらきらを付ける": "Sparkle on things you can touch",
    "絵の中のものの名前を、いつも出す": "Always show the names of things in the picture (a hint)",
    "しばらく考えていると、文字が浮かんで虫になる": "If you think too long, letters float up and turn into bugs",
    "ときどき、特別なキャラクターが、ひとこと言いに来る": "Now and then a special character drops by to say a word",
    "記録をぜんぶ消す": "Erase all progress", "読み進めた記録と、集めた結末をすべて消します。よろしいですか?": "This erases your progress and all the endings you have found. Are you sure?",
    "ここで、お話が おわります": "The tale ends here", "すすむ": "Go on", "やめておく": "Never mind",
    "この ブラウザでは、よみあげが つかえません。": "Read-aloud is not available in this browser.",
    "ページをさいごまで めくってから えらんでね。": "Turn to the last page before you choose.",
    "結末の本棚": "Shelf of Endings", "結末の本棚をひらく": "Open the shelf of endings", "ひとつ前の分かれ道へもどる": "Go back to the last fork",
    "はじめから読みなおす": "Read again from the beginning", "本文": "Text",
    "絵の中のものも、えらべます。": "You can choose things in the picture, too.", "絵の中のものを、さわってみましょう。": "Try touching things in the picture.",
    "いまは、うまくいかないようだ。": "That doesn't seem to work right now.",
    "メモ": "Notes", "メモ帳": "Notebook", "ここに、気づいたことを、書いておけます(この端末に保存されます)。": "Write down what you notice. (Saved on this device.)",
    "English": "English", "日本語": "日本語", "言語 / Language": "Language / 言語",
    "時刻": "Time", "午後": "PM ", "ヒント: ": "Hint: "
  };
  const P = [
    [/^結末の本棚\s+(\d+) \/ (\d+)$/, (m) => `Shelf of Endings  ${m[1]} / ${m[2]}`],
    [/^✦ はじめて出会った結末です\((\d+) \/ (\d+)\)$/, (m) => `✦ A new ending! (${m[1]} / ${m[2]})`],
    [/^✦ もう一度、出会った結末です\((\d+) \/ (\d+)\)$/, (m) => `✦ An ending you have met before. (${m[1]} / ${m[2]})`],
    [/^これまでに (\d+) \/ (\d+) の午後に出会いました。$/, (m) => `Afternoons met so far: ${m[1]} / ${m[2]}.`],
    [/^「(.*)」を えらぶと、この お話は ここで おわります。すすみますか\?$/, (m) => `If you choose "${m[1]}", the tale ends here. Go on?`],
    [/^「(.*)」をポケットに入れました。$/, (m) => `You put "${m[1]}" in your pocket.`],
    [/^「(.*)」をわたしました。$/, (m) => `You handed over "${m[1]}".`],
    [/^No\. (\d+) \/ (\d+)$/, (m) => `No. ${m[1]} / ${m[2]}`]
  ];
  function T(s) {
    if (lang !== "en" || typeof s !== "string") return s;
    if (Object.prototype.hasOwnProperty.call(D, s)) return D[s];
    for (let i = 0; i < P.length; i++) { const m = P[i][0].exec(s); if (m) return P[i][1](m); }
    return s;
  }
  function setLang(l) { try { localStorage.setItem(KEY, l); } catch (e) { /* 無視 */ } const u = new URL(location.href); u.searchParams.delete("lang"); location.href = u.toString(); }

  // 物語の英語を、game に重ねる(game を書きかえる)。保存の名前も分ける。
  function applyOverlay(game, en) {
    if (lang !== "en" || !en) return { missing: [] };
    const missing = [];
    ["title", "subtitle", "eyebrow", "credit"].forEach((k) => { if (en[k] != null) game[k] = en[k]; });
    game.id = game.id + "-en";
    Object.keys(en.items || {}).forEach((id) => { if (game.items[id]) Object.assign(game.items[id], en.items[id]); });
    Object.keys(en.zones || {}).forEach((id) => { if (game.zones[id]) Object.assign(game.zones[id], en.zones[id]); });
    Object.keys(en.endingKinds || {}).forEach((id) => { if (game.endingKinds[id]) Object.assign(game.endingKinds[id], en.endingKinds[id]); });
    if (en.clock && game.clock) Object.assign(game.clock, en.clock);
    Object.keys(game.scenes).forEach((id) => {
      const sc = game.scenes[id], o = (en.scenes || {})[id];
      if (!o) { missing.push(id); return; }
      if (o.title != null) sc.title = o.title; else missing.push(id + ".title");
      if (sc.pages) sc.pages = sc.pages.map((p, i) => {
        const t = (o.pages || [])[i];
        if (t == null) { missing.push(id + ".pages[" + i + "]"); return p; }
        return typeof p === "string" ? t : Object.assign({}, p, { text: t });
      });
      (sc.options || []).forEach((op, i) => {
        const oid = op.id || String(i), t = (o.options || {})[oid];
        if (!t) { missing.push(id + "." + oid); return; }
        if (t.label != null) op.label = t.label;
        if (t.locked != null) op.locked = t.locked;
        if (t.msg != null) op.msg = t.msg;
      });
      if (sc.ending) { if (o.ending) Object.assign(sc.ending, o.ending); else missing.push(id + ".ending"); }
    });
    return { missing };
  }
  root.BookI18n = { lang, T, setLang, applyOverlay };
})(typeof self !== "undefined" ? self : this);
