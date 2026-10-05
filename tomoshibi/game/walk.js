/* 通しテスト: 結末ごとに「場面.選択肢」を順にたどると、その結末に着くはず(tools/validate.html が使う)。 */
(function () {
  const toStairs = "lamp.lantern lamp.storm storm.down";
  const toShore = toStairs + " stairs.door";
  const toCliff = toShore + " shore.bottle shore.crab crab.shell crab.back shore.cliff";
  const toHarbor = toCliff + " cliff.whistle";
  const ready = toHarbor + " harbor.market market.fish market.back harbor.cat cat.feed harbor.pier pier.light harbor.oil oilshop.oil oilshop.back";
  const toFog = ready + " harbor.sea";
  const toBell = toFog + " fog.ship ship.guide";
  const toCapes = toBell + " bell.ring seals.ask";
  const toHosp = toCapes + " capes.share slope.go";
  const toTruth = toHosp + " hospital.window window.letter";
  window.GAME_WALK = {
    e_true: toTruth + " truth.together homeward.home",
    h_storm: "lamp.storm storm.boat",
    h_room: toStairs + " stairs.room room.blanket",
    h_crab: toShore + " shore.crab crab.moon",
    h_cliff: toShore + " shore.cliff cliff.sunset",
    h_market: toHarbor + " harbor.market market.play",
    h_cat: toHarbor + " harbor.cat cat.sun",
    h_nagi: toHarbor + " harbor.pier pier.dawn",
    h_ship: toFog + " fog.ship ship.song",
    h_jelly: toBell + " bell.jelly",
    h_seal: toBell + " bell.ring seals.swim",
    h_choir: toCapes + " capes.sing",
    h_window: toHosp + " hospital.window window.sleep",
    n_small: "lamp.storm storm.small",
    n_market: toHarbor + " harbor.market market.crowd",
    n_oil: toHarbor + " harbor.oil oilshop.help",
    n_slope: toCapes + " capes.share slope.stay",
    n_ship: toFog + " fog.ship ship.sail",
    n_hospital: toHosp + " hospital.nurse2",
    n_window: toTruth + " truth.stay",
    n_return: toHarbor + " harbor.market market.fish market.back harbor.cat cat.feed harbor.oil oilshop.oil oilshop.back harbor.slope slope.go hospital.window window.letter truth.together homeward.home2",
    b_dark: "lamp.dark",
    b_storm: "lamp.storm storm.away",
    b_fall: toShore + " shore.cliff cliff.jump",
    b_cat: toHarbor + " harbor.cat cat.play",
    b_sold: toHarbor + " harbor.oil oilshop.shelf",
    b_out: toCapes + " capes.out",
    b_shy: toHosp + " hospital.window window.shy",
    b_alarm: toHosp + " hospital.door",
    l_beam: "lamp.shine lamp.shine lamp.shine2",
    l_tide: toShore + " shore.tide shore.tide shore.tide2",
    l_streetlamp: toHarbor + " harbor.lamp harbor.lamp harbor.lamp2",
    l_pier: toHarbor + " harbor.pier pier.watch pier.watch pier.watch2",
    l_fog: toFog + " fog.shine fog.shine fog.shine2",
    l_seal: toBell + " bell.ring seals.roll seals.roll seals.roll2",
    s_room: toStairs + " stairs.room room.chair",
    s_crab: toShore + " shore.crab crab.hole",
    s_ship: toFog + " fog.ship ship.stay",
    s_bell: toBell + " bell.sleep",
    s_bench: toHosp + " hospital.bench"
  };
})();
