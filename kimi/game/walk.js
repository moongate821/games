/* 通しテスト: 結末ごとに「場面.選択肢」を順にたどると、その結末に着くはず(tools/validate.html が使う)。 */
(function () {
  const toTown = "rain.pray classroom.apology";
  const getGlass = " town.shop shop.box shop.back";
  const getUsagi = " town.fireworks fireworks.usagi fireworks.back";
  const toConsult = toTown + " town.clinic clinic.note clinic.go";
  const toCampus = toConsult + " consult.show consult.leave";
  const toDorm = toCampus + " campus.dorm";
  const toMeeting = toDorm + " dorm.evidence dorm.meeting";
  const toEve = toMeeting + " meeting.next";
  const toFinale = toEve + " eve.note eve.go";
  window.GAME_WALK = {
    e_true: toTown + getGlass + getUsagi + " town.clinic clinic.note clinic.go consult.show consult.leave campus.dorm dorm.evidence dorm.meeting meeting.next eve.note eve.go finale.true",
    h_apology: "rain.pray classroom.hanky",
    h_dinner: toTown + " town.dinner",
    h_shop: toTown + " town.shop shop.photo",
    h_song: toTown + " town.music music.listen",
    h_fireworks: toTown + " town.fireworks fireworks.watch",
    h_consult: toConsult + " consult.show consult.report",
    h_cherry: toCampus + " campus.cherry",
    h_company: toCampus + " campus.company",
    h_dorm: toDorm + " dorm.call",
    h_meeting: toMeeting + " meeting.evidence",
    h_kotone: toMeeting + " meeting.kotone",
    h_dance: toFinale + " finale.dance",
    n_silent: "rain.pray classroom.silent",
    n_walk: toTown + " town.walk",
    n_dusk: toTown + " town.music music.dusk",
    n_wait: toTown + " town.clinic clinic.wait",
    n_consult: toConsult + " consult.show consult.soft",
    n_campus: toCampus + " campus.quiet",
    n_dorm: toDorm + " dorm.silent",
    n_finale: toFinale + " finale.silent",
    b_quarrel: "rain.pray classroom.quarrel",
    b_overwork: toTown + " town.shop shop.overwork",
    b_late: toTown + " town.clinic clinic.watch",
    b_anzai: toConsult + " consult.rage",
    b_pendant: toCampus + " campus.pendant",
    b_dorm: toDorm + " dorm.blame",
    b_meeting: toMeeting + " meeting.fist",
    b_storm: toFinale + " finale.storm",
    l_rain: "rain.again rain.again rain.again2",
    l_town: toTown + " town.loop town.loop town.loop2",
    l_song: toTown + " town.music music.again music.again music.again2",
    l_campus: toCampus + " campus.walk campus.walk campus.walk2",
    l_eve: toEve + " eve.rewrite eve.rewrite eve.rewrite2",
    l_finale: toFinale + " finale.wait",
    s_rain: "rain.sit",
    s_clinic: toTown + " town.clinic clinic.name",
    s_fireworks: toTown + " town.fireworks fireworks.lost",
    s_dorm: toDorm + " dorm.wall",
    s_eve: toEve + " eve.sleepless"
  };
})();
