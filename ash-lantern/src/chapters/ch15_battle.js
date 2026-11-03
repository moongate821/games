'use strict';
// 第15章「帰り道」 battle: 敵・技・仲間・装備・道具・台帳(UI・戦闘担当)。
// tools/balance_sim.py --emit が生成する。数値は balance_sim.py の表を直して再生成する。
registerChapter({
  id: 'c15',
  items: {
    "return_soup": {"name": "帰り道のスープ", "desc": "各地の人が持たせてくれたスープ。HPを150回復する。", "hp": 150}
  },
  gear: {
    "return_scarf": {"name": "帰り道の襟巻き", "slot": "c", "def": 3, "spd": 2, "desc": "各地の人が少しずつ編み足した襟巻き。"}
  }
});
