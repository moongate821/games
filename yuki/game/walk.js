/* 通しテスト: 結末ごとに「場面.選択肢」を順にたどると、その結末に着くはず(tools/validate.html が使う)。 */
(function () {
  const toWin = "birth.fall";
  const toGarden = toWin + " window.tap";
  const toForest = toGarden + " garden.forest";
  const quest = toForest + " forest.lake lake.bell lake.back forest.owl owl.bulb owl.back forest.pass pass.ask";
  const toThaw = quest + " forest.home";
  const toStar = toThaw + " thaw.star";
  const toLast = toStar + " star.wish";
  const plainThaw = toForest + " forest.home";
  window.GAME_WALK = {
    e_true: toLast + " lastnight.plant morning.flower",
    h_frost: toWin + " window.frost",
    h_rabbit: toGarden + " garden.rabbit",
    h_mitten: toGarden + " garden.mitten garden.play",
    h_snowman: toGarden + " garden.village village.heart",
    h_bear: toForest + " forest.bear bear.song",
    h_fish: toForest + " forest.lake lake.fish",
    h_owl: toForest + " forest.owl owl.dawn",
    h_dance: toForest + " forest.pass pass.dance",
    h_hut: toForest + " forest.hut hut.story",
    h_swallow: plainThaw + " thaw.swallow swallow.listen",
    h_star: plainThaw + " thaw.star star.teach",
    h_talk: plainThaw + " thaw.star star.wish lastnight.talk",
    n_village: toGarden + " garden.village village.watch",
    n_forest: "birth.forest forest.stay",
    n_bear: toForest + " forest.bear bear.sleep",
    n_lake: toForest + " forest.lake lake.melt",
    n_wind: toForest + " forest.pass pass.go",
    n_river: plainThaw + " thaw.river",
    n_south: plainThaw + " thaw.swallow swallow.south",
    n_goodbye: plainThaw + " thaw.star star.wish lastnight.goodbye",
    b_warm: toWin + " window.inside",
    b_snowball: toGarden + " garden.village village.fight",
    b_bear: toForest + " forest.bear bear.wake",
    b_crack: toForest + " forest.lake lake.thin",
    b_wind: toForest + " forest.pass pass.resist",
    b_melt: toForest + " forest.hut hut.fire",
    b_run: plainThaw + " thaw.star star.wish lastnight.run",
    b_pick: toLast + " lastnight.plant morning.pick",
    l_flake: "birth.count birth.count birth.count2",
    l_window: toWin + " window.watch window.watch window.watch2",
    l_skate: toForest + " forest.lake lake.skate lake.skate lake.skate2",
    l_stars: toForest + " forest.owl owl.stars owl.stars owl.stars2",
    l_stream: plainThaw + " thaw.stones thaw.stones thaw.stones2",
    l_wish: plainThaw + " thaw.star star.wishes star.wishes star.wishes2",
    s_drift: "birth.drift",
    s_dream: toForest + " forest.bear bear.dream",
    s_blizzard: toForest + " forest.lake lake.back forest.blizzard",
    s_hut: toForest + " forest.hut hut.watch",
    s_hill: plainThaw + " thaw.star star.hide"
  };
})();
