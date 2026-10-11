/* 通しテスト: 結末ごとに「場面.選択肢」を順にたどると、その結末に着くはず(tools/validate.html が使う)。 */
(function () {
  const toStreet = "open.town";
  const quest = toStreet + " street.farm farm.egg farm.back street.sea sea.salt sea.back street.forest forest.herb forest.back";
  const toEve = quest + " street.evening";
  const plainEve = toStreet + " street.farm farm.back street.evening";
  const toParty = toEve + " evening.cook cook.full";
  window.GAME_WALK = {
    e_true: toParty + " party.share",
    h_cake: "open.kitchen kitchen.cake",
    h_stall: "open.kitchen kitchen.bento",
    h_cats: toStreet + " street.cats",
    h_tora: toStreet + " street.fish fishshop.help",
    h_chicks: toStreet + " street.farm farm.egg farm.chicks",
    h_mermaid: toStreet + " street.sea sea.mermaid",
    h_tanuki: toStreet + " street.forest forest.party",
    h_dragon: plainEve + " evening.dragon dragon.ice",
    h_ghost: plainEve + " evening.ghost ghost.smell",
    h_space: plainEve + " evening.alien alien.ufo",
    h_roof: toParty + " party.roof",
    h_parade: toParty + " party.parade",
    n_book: toStreet + " street.books",
    n_tuna: toStreet + " street.fish fishshop.tuna",
    n_cow: toStreet + " street.farm farm.cow",
    n_boat: toStreet + " street.sea sea.boat",
    n_plain: plainEve + " evening.plain",
    n_volcano: plainEve + " evening.dragon dragon.volcano",
    n_catfood: plainEve + " evening.alien alien.catfood",
    n_tired: toParty + " party.tired",
    b_fire: "open.kitchen kitchen.fire",
    b_fish: toStreet + " street.fish fishshop.eat",
    b_chase: toStreet + " street.farm farm.chase",
    b_sea: toStreet + " street.sea sea.jump",
    b_mushroom: toStreet + " street.forest forest.mushroom",
    b_dragon: plainEve + " evening.dragon dragon.spicy",
    b_burnt: toEve + " evening.cook cook.hurry",
    b_eat: toEve + " evening.cook cook.eat",
    l_recipe: "open.book open.book open.book2",
    l_taste: "open.kitchen kitchen.taste kitchen.taste kitchen.taste2",
    l_dance: toStreet + " street.farm farm.dance farm.dance farm.dance2",
    l_wave: toStreet + " street.sea sea.wave sea.wave sea.wave2",
    l_moon: toStreet + " street.forest forest.moon forest.moon forest.moon2",
    l_order: plainEve + " evening.alien alien.order alien.order alien.order2",
    s_nap: "open.nap",
    s_freezer: toStreet + " street.fish fishshop.freezer",
    s_lost: toStreet + " street.forest forest.deep",
    s_closed: plainEve + " evening.close",
    s_cupboard: plainEve + " evening.ghost ghost.hide"
  };
})();
