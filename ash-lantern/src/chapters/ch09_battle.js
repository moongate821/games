'use strict';
// 第9章「海底の灯台」 battle: 敵・技・仲間・装備・道具・台帳(UI・戦闘担当)。
// tools/balance_sim.py --emit が生成する。数値は balance_sim.py の表を直して再生成する。
registerChapter({
  id: 'c9',
  enemies: {
    "deep_fish": {"name": "深海魚", "img": "enemy_deep_fish", "fallback": "enemy_slime", "mhp": 154, "atk": 29, "def": 7, "spd": 10, "size": 230, "pattern": ["n", "n", "n"]},
    "deep_keeper": {"name": "灯台の守り手", "img": "enemy_deep_keeper", "fallback": "enemy_crab", "mhp": 945, "atk": 44, "def": 9, "spd": 9, "size": 440, "pattern": ["n", "n", "tele", "strong"]}
  },
  skills: {
    "heal_max": {"name": "ヒール・極", "mp": 8, "target": "ally", "kind": "heal", "power": 70, "lv": 8},
    "noah_storm": {"name": "砂塵のまなざし", "mp": 8, "target": "allEnemies", "kind": "magic", "power": 18, "lv": 8}
  },
  items: {
    "sea_tonic": {"name": "潮風の滋養薬", "desc": "海底の遺跡の水草で作った薬。HPを95回復する。", "hp": 95}
  },
  gear: {
    "tide_blade": {"name": "潮鳴りの剣", "slot": "w", "atk": 15, "desc": "海底の遺跡で見つかった剣。刃が水に濡れたように光る。"},
    "tide_mail": {"name": "潮風の胴着", "slot": "a", "def": 11, "desc": "海底の遺跡の鎧。潮の匂いがする。"},
    "noah_blade": {"name": "ノアの双刃", "slot": "w", "atk": 14, "only": ["noah"], "desc": "自分で選び直した、ノアの新しい刃。"}
  },
  assets: [
    {"id": "enemy.deep_fish", "kind": "enemy", "file": "img/enemy_deep_fish.png", "spec": "横230px・透明・発光する魚。身構え差分なし", "status": "調整中", "fallback": "enemy_slime", "priority": "中", "owner": "Codex", "note": "第9章 海底遺跡"},
    {"id": "enemy.deep_keeper", "kind": "enemy", "file": "img/enemy_deep_keeper.png", "spec": "横440px・透明・海底の灯台の守護者。身構え差分あり", "status": "調整中", "fallback": "enemy_crab", "priority": "高", "owner": "Codex", "note": "第9章 ボス。通常画像を接続、身構え差分は未制作"}
  ]
});
