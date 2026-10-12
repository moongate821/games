// 通しテスト: 選択肢idの列を再生して、最後の場面と時計を確かめる。 node tools/check.js walk
const HEAD = "river:ledger river:pen river:rabbit hole:watch hole:down fall:orange fall:down hall:eatN hall:key hall:drinkL hall:drinkN hall:door tears:float";
const TO_TEA = "caucus:prize dodo_prize:a5 dodo_right:on caucus:house rabbit_house:fan rabbit_house:gloves rabbit_house:attic rabbit_attic:give rabbit_attic:down rabbit_house:out2 crossroads:left";
const TEA_T1 = "tea:seats tea_seats:s6 tea_seat_ok:on tea:raven tea_raven:r1 tea_raven_ok:on tea:hatter hatter_time:open watch_inside:on";
const QUEEN = "tea:leave crossroads:mid croquet:count croquet_count:n45 croquet_count_ok:on croquet:hoop croquet_hoop:h1 croquet_hoop_ok:on croquet:queen queen_talk:yes queen_yes:on";
const MAZE = "croquet:maze maze:enter m1:wing m2:wing m3:ear m4:wing m5:ear m6:ear maze_center:door secret_garden:read secret_letter:on secret_garden:out maze_center:out maze:back";
const COURT = "croquet:court court:led court_ledger:on court:wit court_wit:q court_wit_ok:on court:verse court_verse:v1 court_verse_ok:on court:say";
const WOOD = "caucus:wood crossroads:mid";
const QUEEN_M = "croquet:count croquet_count:n45 croquet_count_ok:on croquet:hoop croquet_hoop:h1 croquet_hoop_ok:on croquet:queen queen_talk:yes queen_yes:on";
const TESTIFY = "croquet:court court:say";
const LOOP = Array(36).fill("caucus:wood crossroads:back").join(" ");
const R = {
  e_true: [HEAD, TO_TEA, TEA_T1, QUEEN, MAZE, COURT, "court_testify:queen court_accuse:fA court_win:on six:on six_talk:c x_six_end:take"],
  h_audit: [HEAD, WOOD, QUEEN_M, "croquet:court court:led court_ledger:on court:wit court_wit:q court_wit_ok:on court:verse court_verse:v1 court_verse_ok:on court:say court_testify:queen court_accuse:fB h_audit"].map(x=>x.replace(" h_audit","")),
  b_verdict: [HEAD, WOOD, QUEEN_M, TESTIFY, "court_testify:queen court_accuse:fD"],
  b_verdict2: [HEAD, WOOD, "croquet:court court:say court_testify:noperm x_court_noperm:go"],
  n_jury: [HEAD, WOOD, QUEEN_M, TESTIFY, "court_testify:knave court_agree:ok"],
  n_blank: [HEAD, WOOD, QUEEN_M, TESTIFY, "court_testify:silent x_court_silent:ok"],
  b_lie: [HEAD, WOOD, QUEEN_M, TESTIFY, "court_testify:lie x_court_lie:write"],
  b_card: [HEAD, WOOD, QUEEN_M.replace("croquet:queen queen_talk:yes queen_yes:on", ""), "croquet:queen queen_talk:no x_queen_no:again"],
  b_card2: [HEAD, WOOD, QUEEN_M, TESTIFY, "court_testify:no x_queen_no:again"],
  n_late: [HEAD, LOOP, "caucus:wood bell:run x_bell_run:run"],
  h_tea: [HEAD, TO_TEA, TEA_T1, "tea:wind tea:tell x_tea_tell:tell"],
  s_tea: [HEAD, TO_TEA, "tea:stay x_tea_stay:stay"],
  l_tea: [HEAD, TO_TEA, "tea:cup tea:cup tea:cup tea:cup2 x_tea_cup:drink"],
  h_cat: [HEAD, WOOD.replace("crossroads:mid", ""), "crossroads:right duchess:cat cheshire:ask cheshire_q:angry cheshire_ok:on duchess:cat cheshire:follow x_cat_follow:go"],
  h_garden: [HEAD, WOOD, "croquet:maze maze:enter m1:wing m2:wing m3:ear m4:wing m5:ear m6:ear maze_center:door secret_garden:read secret_letter:on secret_garden:stay x_garden_stay:stay"],
  b_pepper: [HEAD, WOOD.replace("crossroads:mid", ""), "crossroads:right duchess:kplain kitchen_pep:out duchess:kplain kitchen_pep:sneeze"],
  b_poison: [HEAD, "caucus:house rabbit_house:bottle house_bottle:drink"],
  s_hall: ["river:ledger river:rabbit hole:down fall:down hall:drinkN hall:giveup hall_giveup:stay"],
  s_maze: [HEAD, WOOD, "croquet:maze maze:enter m1:ear maze_wrong:back maze:enter m1:ear maze_wrong:back maze:giveup x_maze_giveup:stay"],
  l_river: ["river:wait river:wait river:wait2 x_river_wait:stay"]
};
module.exports = function (C, g) {
  const run = (name, parts) => {
    const eng = C.createEngine(g); eng.start();
    const steps = parts.join(" ").split(/\s+/).filter(Boolean);
    for (const st of steps) {
      const [sc, id] = st.split(":");
      if (eng.state.scene !== sc) { console.log("FAIL", name, "scene is", eng.state.scene, "expected", sc, "at", st); return false; }
      const r = eng.choose(id);
      if (r.kind === "none") { console.log("FAIL", name, "no option", st, "visible:", eng.options().map(o => o.id).join(",")); return false; }
      if (r.kind === "locked") { console.log("FAIL", name, "locked", st, r.msg); return false; }
    }
    const end = g.scenes[eng.state.scene].ending;
    console.log((end ? "OK  " : "..  ") + name, "->", eng.state.scene, "tick", eng.state.counters.tick, "pf", eng.state.counters.pf);
    return eng;
  };
  Object.keys(R).forEach(k => { if (R[k].join("").trim() && process.argv[3] !== "x") run(k, R[k]); });
  module.exports.run = run;
};
