'use strict';
// 第7章「残された席」 battle: 敵・技・仲間・装備・道具・台帳(UI・戦闘担当)。
// tools/balance_sim.py --emit が生成する。数値は balance_sim.py の表を直して再生成する。
registerChapter({
  id: 'c7',
  skills: {
    "gardo_teaching": {"name": "ガルドの教え", "mp": 0, "once": true, "target": "allEnemies", "kind": "magic", "power": 30, "lv": 7}
  },
  items: {
    "funeral_bread": {"name": "送りのパン", "desc": "葬送の席で配られた甘いパン。HPを80回復する。", "hp": 80}
  },
  gear: {
    "mourning_coat": {"name": "喪の黒外套", "slot": "a", "def": 9, "desc": "葬送の席のために仕立てた黒い外套。"},
    "seat_ribbon": {"name": "空席のリボン", "slot": "c", "def": 2, "spd": 1, "desc": "空けた席の椅子に結んだ、細いリボン。"}
  }
});
