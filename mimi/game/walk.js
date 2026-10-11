/* 通しテスト: 結末ごとに「場面.選択肢」を順にたどると、その結末に着くはず(tools/validate.html が使う)。 */
(function () {
  const toRoom = "closet.crawl";
  const ribbon = toRoom + " room.hana hana_room.ribbon hana_room.back";
  const toStreet = ribbon + " room.door door.address door.mail";
  const toStation = toStreet + " rainstreet.umbrella rainstreet.station";
  const toShop = toStation + " station.tie station.shop";
  const fixed = toShop + " shop.sew shop.key shop.bird bird.wind";
  const toCross = fixed + " shop.out";
  const toRiver = toCross + " crossing.tracks";
  const toTown = toRiver + " river.boat boat.down";
  const plainShop = toShop;
  window.GAME_WALK = {
    e_true: toTown + " newtown.school school.window newtown.address gate.knock",
    h_song: "closet.song",
    h_lines: toRoom + " room.hana hana_room.lines",
    h_umbrella: toStreet + " rainstreet.umbrella rainstreet.snail",
    h_soldier: toStation + " station.tie station.march",
    h_patch: plainShop + " shop.tea",
    h_bird: plainShop + " shop.bird bird.sing",
    h_shelf: plainShop + " shop.shelf shelf.party",
    h_cats: plainShop + " shop.alley alley.cats",
    h_train: toCross + " crossing.kids",
    h_firefly: toRiver + " river.firefly",
    h_moon: toRiver + " river.boat boat.moon",
    h_view: toTown + " newtown.view",
    n_window: toRoom + " room.hana hana_room.window",
    n_family: toRoom + " room.door door.wait",
    n_king: toStation + " station.king",
    n_shop: plainShop + " shop.shelf shelf.sign",
    n_river: toRiver + " river.sleep",
    n_sea: toRiver + " river.boat boat.sea",
    n_school: toTown + " newtown.school school.kid",
    n_reunion: toShop + " shop.out crossing.tracks river.boat boat.down newtown.address gate.knock2",
    b_dust: toRoom + " room.sleep",
    b_rain: toRoom + " room.door door.mail rainstreet.run",
    b_truck: toStation + " station.truck",
    b_crow: toStation + " station.crow",
    b_sold: plainShop + " shop.shelf shelf.tag",
    b_dog: plainShop + " shop.alley alley.dog",
    b_sink: toRiver + " river.boat boat.rock",
    b_shy: toTown + " newtown.address gate.back",
    l_rain: toStreet + " rainstreet.walk rainstreet.walk rainstreet.walk2",
    l_patch: plainShop + " shop.sew shop.resew shop.resew shop.resew2",
    l_wind: plainShop + " shop.bird bird.spin bird.spin bird.spin2",
    l_train: toCross + " crossing.wait crossing.wait crossing.wait2",
    l_boat: toRiver + " river.boat boat.whirl boat.whirl boat.whirl2",
    l_lost: toTown + " newtown.wander newtown.wander newtown.wander2",
    s_closet: "closet.wait closet.wait closet.wait2",
    s_shelf: plainShop + " shop.shelf shelf.sleep",
    s_crossing: toCross + " crossing.under",
    s_sandbox: toTown + " newtown.school school.sand",
    s_gate: toTown + " newtown.address gate.wait"
  };
})();
