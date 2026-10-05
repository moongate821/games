/* 通しテスト: 結末ごとに「場面.選択肢」を順にたどると、その結末に着くはず(tools/validate.html が使う)。 */
(function () {
  const toLoss = "hill.loss";
  const toTown = toLoss + " loss.diary loss.go";
  const toRuins = toTown + " town.ruins";
  const toMountain = toRuins + " ruins.yui ruins.north";
  const getCompass = " mountain.compass";
  const toObs2 = toMountain + getCompass + " mountain.north";
  const toObs3 = toObs2 + " obs2.pin obs2.north";
  const toKyokai = toObs3 + " obs3.refuse obs3.gate";
  const toTree = toKyokai + " kyokai.tree";
  const toSpring = toTree + " tree.journey";
  const toStarsea = toSpring + " spring.sea";
  const toRing = toStarsea + " starsea.ring";
  window.GAME_WALK = {
    e_true: toRing + " ring.true",
    h_festival: "hill.festival",
    h_library: "hill.library",
    h_inn: toTown + " town.inn",
    h_oldman: toMountain + " mountain.flute",
    h_snow: toMountain + getCompass + " mountain.fire",
    h_guard: toRuins + " ruins.yui ruins.guard",
    h_shadow: toObs3 + " obs3.listen",
    h_yui: toKyokai + " kyokai.hug",
    h_stars: toTree + " tree.stars",
    h_aira: toSpring + " spring.aira",
    h_regulus: toStarsea + " starsea.regulus",
    h_eve: toRing + " ring.eve",
    n_village: "hill.village",
    n_diary: toLoss + " loss.diary loss.read",
    n_market: toTown + " town.market",
    n_ruins: toRuins + " ruins.back",
    n_pass: toMountain + " mountain.turn",
    n_tree: toTree + " tree.home",
    n_home: toSpring + " spring.home",
    n_asteru: toRing + " ring.asteru",
    b_thief: toTown + " town.thief",
    b_guard: toRuins + " ruins.charge",
    b_blizzard: toMountain + " mountain.storm",
    b_collapse: toObs2 + " obs2.chase",
    b_shadow: toObs3 + " obs3.cut",
    b_tree: toTree + " tree.touch",
    b_beast: toStarsea + " starsea.beast",
    b_core: toRing + " ring.core",
    l_count: "hill.count hill.count hill.count2",
    l_stone: toRuins + " ruins.stone ruins.stone ruins.stone2",
    l_snow: toMountain + " mountain.snow mountain.snow mountain.snow2",
    l_corridor: toObs2 + " obs2.corridor obs2.corridor obs2.corridor2",
    l_orbit: toStarsea + " starsea.orbit starsea.orbit starsea.orbit2",
    l_ring: toRing + " ring.loop ring.loop ring.loop2",
    s_white: "hill.white",
    s_grief: toLoss + " loss.stand",
    s_dark: toRuins + " ruins.dark",
    s_door: toObs3 + " obs3.door",
    s_drift: toStarsea + " starsea.drift"
  };
})();
