/* 通しテスト: 結末ごとに「場面.選択肢」を順にたどると、その結末に着くはず(tools/validate.html が使う)。 */
(function () {
  const quest = "yard.kitchen kitchen.cake kitchen.back yard.attic attic.map attic.back yard.hill hill.catch hill.back";
  const toLaunch = quest + " yard.launch";
  const fuelOnly = "yard.hill hill.catch hill.back yard.launch";
  const toSpace = toLaunch + " launch.go sky.up";
  const plainSpace = fuelOnly + " launch.go sky.up";
  const toMoon = toSpace + " space.moon";
  const noCakeMoon = "yard.attic attic.map attic.back " + fuelOnly + " launch.go sky.up space.moon";
  window.GAME_WALK = {
    e_true: toMoon + " moon.rabbit rabbit.sing",
    h_dango: "yard.kitchen kitchen.dango",
    h_telescope: "yard.attic attic.telescope",
    h_firefly: "yard.hill hill.firefly",
    h_letter: "yard.hill hill.letter",
    h_cloud: fuelOnly + " launch.go sky.cloud",
    h_plane: fuelOnly + " launch.go sky.plane",
    h_satellite: plainSpace + " space.sate",
    h_astronaut: plainSpace + " space.station station.walk",
    h_candy: plainSpace + " space.candy candy.party",
    h_earth: toMoon + " moon.earth",
    h_mochi: noCakeMoon + " moon.mochi",
    h_moondance: toMoon + " moon.rabbit rabbit.dance",
    n_tomorrow: "yard.kitchen kitchen.tomorrow",
    n_diary: "yard.attic attic.diary",
    n_yard: fuelOnly + " launch.scared",
    n_geese: fuelOnly + " launch.go sky.geese",
    n_station: plainSpace + " space.station station.tour",
    n_shop: plainSpace + " space.candy candy.shop",
    n_quick: toMoon + " moon.rabbit rabbit.quick",
    n_stay: toMoon + " moon.rabbit rabbit.stay",
    b_cream: "yard.kitchen kitchen.cream",
    b_dust: "yard.attic attic.dust",
    b_roll: "yard.hill hill.roll",
    b_spin: fuelOnly + " launch.boost",
    b_thunder: fuelOnly + " launch.go sky.thunder",
    b_junk: plainSpace + " space.station station.junk",
    b_candy: plainSpace + " space.candy candy.eat",
    b_crater: toMoon + " moon.crater",
    l_paint: "yard.paint yard.paint2 yard.paint3",
    l_costume: "yard.attic attic.costume attic.costume2 attic.costume3",
    l_wish: "yard.hill hill.wish hill.wish2 hill.wish3",
    l_count: fuelOnly + " launch.count launch.count2 launch.count3",
    l_comet: plainSpace + " space.comet space.comet2 space.comet3",
    l_hop: toMoon + " moon.hop moon.hop2 moon.hop3",
    s_box: "yard.box",
    s_attic: "yard.attic attic.map attic.dark",
    s_sleep: fuelOnly + " launch.sleep",
    s_fog: fuelOnly + " launch.go sky.fog",
    s_drift: plainSpace + " space.drift"
  };
})();
