'use strict';
// 第10章「空を渡る船」 battle: 敵・技・仲間・装備・道具・台帳(UI・戦闘担当)。
// tools/balance_sim.py --emit が生成する。数値は balance_sim.py の表を直して再生成する。
registerChapter({
  id: 'c10',
  enemies: {
    "sky_gull": {"name": "空ガモメ", "img": "enemy_sky_gull", "fallback": "enemy_bat", "mhp": 123, "atk": 32, "def": 7, "spd": 14, "size": 200, "pattern": ["n", "n", "n"]},
    "isle_golem": {"name": "浮島の石人形", "img": "enemy_isle_golem", "fallback": "enemy_golem", "mhp": 216, "atk": 33, "def": 11, "spd": 6, "size": 280, "pattern": ["n", "n", "tele", "strong"]}
  },
  skills: {
    "rain_max": {"name": "あめのうた・大", "mp": 10, "target": "allEnemies", "kind": "magic", "power": 24, "lv": 9}
  },
  items: {
    "sky_honey": {"name": "空蜂の蜜", "desc": "浮島の蜂の蜜。HPを110回復する。", "hp": 110}
  },
  gear: {
    "sky_feather": {"name": "空鳥の羽飾り", "slot": "c", "spd": 4, "desc": "浮島に落ちていた大きな羽。身が軽くなる。"},
    "isle_plate": {"name": "浮島の鎧石", "slot": "a", "def": 12, "desc": "浮島の石を削って作った軽い鎧。"}
  },
  assets: [
    {"id": "enemy.sky_gull", "kind": "enemy", "file": "img/enemy_sky_gull.png", "spec": "横200px・透明・大きな海鳥。身構え差分なし", "status": "調整中", "fallback": "enemy_bat", "priority": "中", "owner": "Codex", "note": "第10章 浮島"},
    {"id": "enemy.isle_golem", "kind": "enemy", "file": "img/enemy_isle_golem.png", "spec": "横280px・透明・浮島の石人形。身構え差分あり", "status": "調整中", "fallback": "enemy_golem", "priority": "中", "owner": "Codex", "note": "第10章 浮島(強めの通常敵)"}
  ]
});
