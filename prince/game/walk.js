/* 通しテスト: 結末ごとに「場面.選択肢」を順にたどると、その結末に着くはず(tools/validate.html が使う)。 */
(function () {
  const toSpace = "planet.rose rose.go depart.kind birds.string";
  const toEarth = toSpace + " space.geo geo.talk space.earth";
  const toGarden = toEarth + " desert.walk flower3.where mountain.down";
  const toSecret = toGarden + " garden.cry fox.wait fox.wait fox.friend";
  const toRail = toSecret + " secret.listen";
  const toPilot = toRail + " rail.merchant merchant.walk";
  const toWell = toPilot + " pilot.box pilot.muzzle pilot.well";
  window.GAME_WALK = {
    e_true: toWell + " well.drink wall.ask",
    h_sunset44: "planet.rose rose.dome rose.screen rose.back planet.sunset sunset.together",
    h_rose: "planet.rose rose.dome rose.screen rose.go depart.stay",
    h_birds: "planet.rose rose.go depart.kind birds.south",
    h_king: toSpace + " space.king king.sunset",
    h_lamplighter: toSpace + " space.lamp lamp.slow",
    h_geographer: toSpace + " space.geo geo.map",
    h_echo: toEarth + " desert.walk flower3.where mountain.echo mountain.friend",
    h_garden: toRail + " rail.garden garden.talk",
    h_fox: toSecret + " secret.stay",
    h_rail: toRail + " rail.kids",
    h_pilot: toPilot + " pilot.engine",
    h_well: toPilot + " pilot.well well.dawn",
    n_volcano: "planet.volcano volcano.daily",
    n_stay: "planet.rose rose.go depart.stay2",
    n_vain: toSpace + " space.vain vain.fan",
    n_drunk: toSpace + " space.drunk drunk.sit",
    n_business: toSpace + " space.business business.bank",
    n_flower: toEarth + " desert.walk flower3.stay",
    n_pill: toPilot.replace(" merchant.walk", "") + " merchant.pill",
    n_pilotstay: toPilot + " pilot.well well.drink wall.stay",
    b_quarrel: "planet.rose rose.quarrel",
    b_baobab: "planet.baobab baobab.later planet.baobab baobab.leave",
    b_lost: "planet.rose rose.go depart.silent birds.letgo",
    b_drunk: toSpace + " space.drunk drunk.drink",
    b_snake: toEarth + " desert.snake snake.now",
    b_forget: toGarden + " garden.plain",
    b_thirst: toPilot + " pilot.well well.alone",
    b_sheep: toPilot + " pilot.box pilot.well well.drink wall.nomuzzle",
    l_sunset: "planet.sunset sunset.move sunset.move sunset.move sunset.move2",
    l_vain: toSpace + " space.vain vain.clap vain.clap vain.clap2",
    l_count: toSpace + " space.business business.count business.count business.count2",
    l_lamp: toSpace + " space.lamp lamp.light lamp.light lamp.light2",
    l_echo: toEarth + " desert.walk flower3.where mountain.echo mountain.echo mountain.echo2",
    l_train: toRail + " rail.watch rail.watch rail.watch2",
    s_volcano: "planet.volcano volcano.clean planet.volcano volcano.clean planet.volcano volcano.keep",
    s_king: toSpace + " space.king king.servant",
    s_geo: toSpace + " space.geo geo.wait",
    s_desert: toEarth + " desert.snake snake.listen desert.sleep",
    s_mountain: toEarth + " desert.walk flower3.where mountain.echo mountain.echo mountain.top"
  };
})();
