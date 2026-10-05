/* 通しテスト: 結末ごとに「場面.選択肢」を順にたどると、その結末に着くはず(tools/validate.html が使う)。 */
(function () {
  const base = "funeral.study study.box study.drawer";
  const toSchool = base + " study.school";
  const toCherry = toSchool + " school.cherry";
  const toVillage = toCherry + " cherry.gate";
  const toHermit = toVillage + " village.hermit";
  const toShrine = toHermit + " hermitage.ki hermitage.shrine";
  const toSato = toShrine + " shrine.memoir shrine.sato";
  const getTegami = " sato.library library.tegami library.back";
  const getNote = " sato.canyon canyon.cave canyon.back";
  window.GAME_WALK = {
    e_true: toSato + getTegami + getNote + " sato.origin origin.true",
    h_miso: "funeral.miso",
    h_debt: "funeral.study study.drawer study.debt",
    h_picnic: toCherry + " cherry.picnic",
    h_festival: toVillage + " village.festival",
    h_rescue: toVillage + " village.rescue",
    h_flow: toHermit + " hermitage.ki hermitage.flow",
    h_kuroj: toShrine + " shrine.kuroj",
    h_mio: toSato + " sato.mio",
    h_empress: toSato + " sato.mirror mirror.wave",
    h_yukino: toSato + " sato.library library.tegami library.yukino",
    h_soma: toSato + " sato.canyon canyon.cave canyon.soma",
    h_tenmei: toSato + getNote + " sato.origin origin.tenmei",
    n_stay: "funeral.stay",
    n_friend: toSchool + " school.friend",
    n_return: toCherry + " cherry.return",
    n_farm: toVillage + " village.farm",
    n_scholar: toShrine + " shrine.read",
    n_mirror: toSato + " sato.mirror mirror.leave",
    n_canyon: toSato + " sato.canyon canyon.turn",
    n_sayo: toSato + " sato.origin origin.sayo",
    b_loan: "funeral.loan",
    b_fall: toCherry + " cherry.fall",
    b_bandit: toVillage + " village.bandit",
    b_exhaust: toHermit + " hermitage.ki hermitage.run",
    b_shrine: toShrine + " shrine.see",
    b_trap: toSato + " sato.library library.trap",
    b_canyon: toSato + " sato.canyon canyon.fight",
    b_doubt: toSato + " sato.origin origin.doubt",
    l_dream: "funeral.dream funeral.dream funeral.dream2",
    l_pendant: "funeral.study study.box study.touch study.touch study.touch2",
    l_sakura: toCherry + " cherry.round cherry.round cherry.round2",
    l_swing: toHermit + " hermitage.swing hermitage.swing hermitage.swing2",
    l_mirror: toSato + " sato.mirror mirror.watch mirror.watch mirror.watch2",
    l_records: toSato + " sato.library library.read library.read library.read2",
    s_sleep: "funeral.sleep",
    s_closet: "funeral.study study.closet",
    s_mist: toCherry + " cherry.mist",
    s_well: toSato + " sato.well",
    s_gate: toSato + " sato.origin origin.gate"
  };
})();
