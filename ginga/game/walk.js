/* 通しテスト: 結末ごとに「場面.選択肢」を順にたどると、その結末に着くはず(tools/validate.html が使う)。 */
(function () {
  const toHome = "school.quiet print.finish";
  const toBridge = toHome + " home.talk home.milk dairy.later street.bridge";
  const toTrain = toBridge + " bridge.ignore hill.lie";
  const toTrain2 = toTrain + " train.swan swan.river pliocene.back";
  const toChildren = toTrain2 + " train.ticket train.conductor conductor.show";
  const trip = (b) => toBridge + " " + b + " hill.lie train.ticket train.swan swan.river pliocene.back train.bird birdcatcher.kind train.conductor conductor.show children.south sasori.listen cross.go coalsack.promise farewell.search";
  const full = trip("bridge.ignore");
  window.GAME_WALK = {
    e_true: full + " wake.run dairy2.milk dairy2.river riverbank.doctor road_home.run",
    h_library: "school.library",
    h_mother: toHome + " home.stay",
    h_festival: toBridge.replace(" street.bridge", "") + " street.lantern",
    h_starchart: toBridge.replace(" street.bridge", "") + " street.chart",
    h_window: toTrain + " train.window window.flower",
    h_swan: toTrain + " train.swan swan.pray",
    h_bird: toTrain2 + " train.bird birdcatcher.candy",
    h_observatory: toTrain2 + " train.observatory observatory.watch",
    h_children: toChildren + " children.sing",
    h_lighthouse: toChildren + " children.keeper2",
    h_cross: toChildren + " children.south sasori.listen cross.light",
    h_zanelli: trip("bridge.forgive") + " wake.run dairy2.milk dairy2.river riverbank.doctor road_home.zanelli",
    n_print: "school.quiet print.late",
    n_dairy: toHome + " home.milk dairy.barn",
    n_hill: toBridge + " bridge.ignore hill.home",
    n_fossil: toTrain + " train.swan swan.river pliocene.stay",
    n_conductor: toTrain2 + " train.conductor conductor.off",
    n_cross: toChildren + " children.south sasori.listen cross.off",
    n_home: full + " wake.run dairy2.home",
    n_river: full + " wake.run dairy2.milk dairy2.river riverbank.crowd",
    b_zanelli: toBridge + " bridge.hit",
    b_ticket: toTrain2 + " train.conductor conductor.none",
    b_bird: toTrain2 + " train.bird birdcatcher.cold",
    b_apple: toChildren + " children.apple children.greedy",
    b_dark: toChildren + " children.south sasori.close",
    b_coalsack: toChildren + " children.south sasori.listen cross.go coalsack.peek",
    b_lonely: toChildren + " children.south sasori.listen cross.go coalsack.promise farewell.cry",
    b_milk: full + " wake.run dairy2.river riverbank.doctor road_home.run2",
    l_school: "school.window school.window school.window2",
    l_print: "school.quiet print.type print.type print.type2",
    l_window: toTrain + " train.window window.count window.count window.count2",
    l_pliocene: toTrain + " train.swan swan.river pliocene.dig pliocene.dig pliocene.dig2",
    l_birds: toTrain2 + " train.bird birdcatcher.help birdcatcher.help birdcatcher.help2",
    l_sasori: toChildren + " children.south sasori.stare sasori.stare sasori.stare2",
    s_dairy: toHome + " home.milk dairy.wait",
    s_swan: toTrain + " train.swan swan.clock",
    s_observatory: toTrain2 + " train.observatory observatory.stay",
    s_coalsack: toChildren + " children.south sasori.listen cross.go coalsack.stare",
    s_hill: full + " wake.sit"
  };
})();
