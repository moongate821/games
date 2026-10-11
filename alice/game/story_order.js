/* 並べなおし: 補筆(x1〜x3)を差しこんだ結果、時間の流れが前後したページを、正しい順に直す。
 * ページは「書き出しの文字」で探す(番号は補筆で変わるため)。見つからなければエラーにして気づけるようにする。 */
(function () {
  "use strict";
  const S = window.ALICE_GAME.scenes;
  const key = (p) => (typeof p === "string" ? p : p.text).replace(/\s+/g, "");
  const find = (id, start) => {
    const i = S[id].pages.findIndex((p) => key(p).startsWith(start));
    if (i < 0) throw new Error("並べなおし: ページが見つかりません " + id + " 「" + start + "」");
    return i;
  };
  // 指定のページを、いちばん最後へ
  const toEnd = (id, start) => { const ps = S[id].pages; ps.push(ps.splice(find(id, start), 1)[0]); };
  // 指定のページを、別のページの手前へ
  const before = (id, start, target) => { const ps = S[id].pages; const p = ps.splice(find(id, start), 1)[0]; ps.splice(find(id, target), 0, p); };

  // 場面
  before("caucus", "ドードー鳥は、地面に描いた", "三十分もたつと");

  // 結末: 後日談・夜の場面を、いちばん最後へ
  toEnd("e_true", "帰り道、アリスは、ふと");
  toEnd("h_knave", "その夜、ハートの国じゅう");
  toEnd("h_queen", "夕方、アリスは、赤いバラ");
  toEnd("h_dodo", "川岸に着くと");
  toEnd("h_mouse", "川岸の草に");
  toEnd("h_butterfly", "蝶が、空を、ひとめぐり");
  toEnd("h_baby", "その夜、ベッドに");
  toEnd("h_hatter", "歌が終わると");
  toEnd("h_tea", "その夜、お茶会の三人");
  toEnd("h_garden", "夜になっても、ランプ");
  toEnd("n_nap", "その夜、アリスは");
  toEnd("n_crown", "お姉さんは、花冠を");
  toEnd("n_dry", "立ちあがって、アリスは");
  before("n_walk", "アリスは、振りかえりました", "村の入口には");
  toEnd("n_soup", "帰り道、アリスの手のひら");
  toEnd("n_croquet", "帰り道、庭のはずれ");
  toEnd("b_big", "そのまま、何日");
  toEnd("b_roof", "夜、アリスの頭の上");
  before("b_tiny", "アリの巣は、暗くて", "アリの巣の奥は");
  before("b_serpent", "それから、アリスは、森のはずれ", "洞穴のなかは");
  toEnd("b_pepper", "ある日、くしゃみは");
  toEnd("b_card", "ある夜、トランプの束");
  toEnd("b_servant", "ある朝、アリスは");
  toEnd("s_keyhole", "鍵穴の向こうの、白い猫");
  toEnd("s_maze", "夜が、きました");
  toEnd("s_maze", "迷路の壁は");
  before("s_court", "やがて、法廷の", "法廷の夜は");
})();
