'use strict';
// 第3章「地図にない港」 battle: 敵・技・仲間・装備・道具・台帳(UI・戦闘担当)。
// tools/balance_sim.py --emit が生成する。数値は balance_sim.py の表を直して再生成する。
registerChapter({
  id: 'c3',
  enemies: {
    "dock_rat": {"name": "港ネズミ", "img": "enemy_dock_rat", "fallback": "enemy_wolf", "mhp": 45, "atk": 14, "def": 2, "spd": 12, "size": 200, "pattern": ["n", "n", "n"]},
    "warehouse_guard": {"name": "倉庫番の機械兵", "img": "enemy_warehouse_guard", "fallback": "enemy_guard", "mhp": 67, "atk": 14, "def": 3, "spd": 7, "size": 230, "pattern": ["n", "n", "tele", "strong"]},
    "crate_golem": {"name": "木箱のゴーレム", "img": "enemy_crate_golem", "fallback": "enemy_golem", "mhp": 315, "atk": 33, "def": 5, "spd": 6, "size": 400, "pattern": ["n", "n", "tele", "strong"]}
  },
  skills: {
    "light_plus": {"name": "ひかり・強", "mp": 4, "target": "enemy", "kind": "magic", "power": 24, "lv": 3},
    "noah_throw": {"name": "ひっかけ縄", "mp": 3, "target": "enemy", "kind": "magic", "power": 14},
    "noah_trap": {"name": "足止めの罠", "mp": 5, "target": "allEnemies", "kind": "magic", "power": 9}
  },
  items: {
    "gardo_stew": {"name": "ガルドの煮込み", "desc": "港の市場で、ガルドが教えてくれた煮込み。HPを45回復する。", "hp": 45}
  },
  gear: {
    "dock_jacket": {"name": "港の作業上着", "slot": "a", "def": 5, "desc": "荷役の男たちが着る厚い上着。縫い目が太い。"},
    "compass_charm": {"name": "ノアの羅針盤", "slot": "c", "spd": 3, "desc": "針が少しだけ北からずれている。足取りが軽くなる気がする。"},
    "noah_dagger": {"name": "ノアの短剣", "slot": "w", "atk": 6, "only": ["noah"], "desc": "荷ほどき用の細い刃。速さで押す人向け。"}
  },
  allies: {
    "noah": {"name": "ノア", "mhp": 40, "mmp": 8, "atk": 9, "def": 3, "spd": 14, "skills": ["noah_throw", "noah_trap"], "portrait": "battle_noah", "learn": {"5": ["noah_hook"], "8": ["noah_storm"], "10": ["noah_cut"], "12": ["noah_all"]}}
  },
  assets: [
    {"id": "enemy.dock_rat", "kind": "enemy", "file": "img/enemy_dock_rat.png", "spec": "横200px・透明・大きなネズミ。身構え差分なし", "status": "調整中", "fallback": "enemy_wolf", "priority": "中", "owner": "Codex", "note": "第3章 倉庫・港(通常)。通常画像を接続"},
    {"id": "enemy.warehouse_guard", "kind": "enemy", "file": "img/enemy_warehouse_guard.png", "spec": "横230px・透明・小型の機械兵。身構え差分(赤い光)あり", "status": "調整中", "fallback": "enemy_guard", "priority": "中", "owner": "Codex", "note": "第3章 夜の倉庫"},
    {"id": "enemy.crate_golem", "kind": "enemy", "file": "img/enemy_crate_golem.png", "spec": "横400px・透明・木箱を積んだ人形。身構え差分(箱が開く)あり", "status": "調整中", "fallback": "enemy_golem", "priority": "高", "owner": "Codex", "note": "第3章 ボス。通常画像を接続、身構え差分は未制作"}
  ]
});
