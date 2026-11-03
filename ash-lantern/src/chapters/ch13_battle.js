'use strict';
// 第13章「灰の冠」 battle: 敵・技・仲間・装備・道具・台帳(UI・戦闘担当)。
// tools/balance_sim.py --emit が生成する。数値は balance_sim.py の表を直して再生成する。
registerChapter({
  id: 'c13',
  enemies: {
    "ash_shade": {"name": "灰の影", "img": "enemy_ash_shade", "fallback": "enemy_wolf", "mhp": 196, "atk": 41, "def": 11, "spd": 12, "size": 230, "pattern": ["n", "n", "n"]},
    "ash_crown": {"name": "灰の冠", "img": "enemy_ash_crown", "fallback": "enemy_golem", "mhp": 1400, "atk": 66, "def": 13, "spd": 11, "size": 460, "pattern": ["n", "tele", "strong", "n", "n", "tele", "strong", "n"]}
  },
  skills: {
    "heal_ex": {"name": "ヒール・暁", "mp": 9, "target": "ally", "kind": "heal", "power": 100, "lv": 12},
    "noah_all": {"name": "風読みの舞", "mp": 10, "target": "allEnemies", "kind": "magic", "power": 30, "lv": 12},
    "serena_burst": {"name": "共鳴暴走", "mp": 11, "target": "allEnemies", "kind": "magic", "power": 34, "lv": 12}
  },
  items: {
    "ash_remedy": {"name": "灰払いの薬", "desc": "灰の冠に挑む前の特別な薬。HPを145回復する。", "hp": 145}
  },
  gear: {
    "ash_edge": {"name": "灰払いの剣", "slot": "w", "atk": 21, "desc": "灰を断ち切る刃。持つ手が温かくなる。"},
    "dawn_staff": {"name": "暁の杖", "slot": "w", "atk": 13, "only": ["mira"], "desc": "夜明けの色を宿した杖。"},
    "crown_plate": {"name": "冠の欠片の胸当て", "slot": "a", "def": 16, "desc": "灰の冠の欠片を固めた胸当て。冷たい。"}
  },
  assets: [
    {"id": "enemy.ash_shade", "kind": "enemy", "file": "img/enemy_ash_shade.png", "spec": "横230px・透明・灰色の人影。身構え差分なし", "status": "調整中", "fallback": "enemy_wolf", "priority": "中", "owner": "Codex", "note": "第13章 灰の冠の中枢"},
    {"id": "enemy.ash_crown", "kind": "enemy", "file": "img/enemy_ash_crown.png", "spec": "横460px・透明・灰の冠そのもの。身構え差分(冠が輝く)あり", "status": "調整中", "fallback": "enemy_golem", "priority": "高", "owner": "Codex", "note": "第13章 最終ボス。通常画像を接続、身構え差分は未制作"}
  ]
});
