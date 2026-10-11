/* 通しテスト: 結末ごとに「場面.選択肢」を順にたどると、その結末に着くはず(tools/validate.html が使う)。 */
(function () {
  const toVillage = "river.pick house.knife";
  const toKitchen = toVillage + " village.elder elder.listen village.decide";
  const toRoad = toKitchen + " kitchen.take gate.hata gate.seed gate.go";
  const all3 = toRoad + " road.dog dog.share road.monkey monkey.share road.pheasant pheasant.share";
  const toPort = all3 + " road.sea bridge.peace";
  const toBeach = toPort + " port.boat sea.guide";
  const toHall = toBeach + " beach.gate gate_oni.knock";
  const toTalkReady = toBeach + " beach.field field.look field.plant field.child child_oni.share field.back beach.gate gate_oni.knock hall.boss boss.talk";
  const dogOnly = toRoad + " road.dog dog.share road.sea bridge.cross";
  window.GAME_WALK = {
    e_true: toTalkReady + " talk.together festival.invite",
    h_home: toKitchen + " kitchen.take gate.stay",
    h_sumo: toVillage + " village.sumo village.sumo2",
    h_kaki: toRoad + " road.monkey monkey.kaki",
    h_sky: toRoad + " road.pheasant pheasant.sky",
    h_tengu: toRoad + " road.forest forest.fly",
    h_picnic: all3 + " road.sea bridge.picnic",
    h_sunrise: toBeach + " beach.sunrise",
    h_child: toBeach + " beach.field field.child child_oni.hide",
    h_return: toBeach + " beach.gate gate_oni.climb cave.return",
    h_drum: toHall + " hall.drum",
    h_classic: toHall + " hall.boss boss.fight",
    h_island: toTalkReady + " talk.together festival.stay",
    n_river: "river.flow",
    n_village: toVillage + " village.elder elder.angry village.stay",
    n_dog: toRoad + " road.dog dog.home",
    n_inn: toRoad + " road.inn inn.help",
    n_port: toPort + " port.fish",
    n_tengu: toRoad + " road.forest forest.tengu",
    n_sea: toPort + " port.boat sea.cloud storm.back",
    n_half: toHall + " hall.boss boss.talk talk.half",
    b_dango: toKitchen + " kitchen.eat",
    b_proud: toPort + " port.proud",
    b_storm: toPort + " port.boat sea.cloud storm.shout",
    b_child: toBeach + " beach.field field.child child_oni.shoo",
    b_greedy: toBeach + " beach.gate gate_oni.climb cave.grab",
    b_alone: dogOnly + " port.boat sea.cloud storm.hold beach.gate gate_oni.knock hall.boss boss.fight2",
    b_war: toHall + " hall.boss boss.talk talk.refuse",
    b_trap: toBeach + " beach.gate gate_oni.break",
    l_river: "river.wash river.wash river.wash2",
    l_dango: toKitchen + " kitchen.pound kitchen.pound kitchen.pound2",
    l_face: toRoad + " road.monkey monkey.face monkey.face monkey.face2",
    l_bridge: toRoad + " road.dog dog.share road.monkey monkey.share road.sea bridge.watch bridge.watch bridge.watch2",
    l_waves: toPort + " port.boat sea.row sea.row sea.row2",
    l_feast: toHall + " hall.feast hall.feast hall.feast2",
    s_house: "river.pick house.display",
    s_inn: toRoad + " road.inn inn.nap",
    s_forest: toRoad + " road.forest forest.back road.forest forest.deep",
    s_gate: toBeach + " beach.gate gate_oni.wait gate_oni.wait gate_oni.wait2",
    s_cave: toBeach + " beach.gate gate_oni.climb cave.count"
  };
})();
