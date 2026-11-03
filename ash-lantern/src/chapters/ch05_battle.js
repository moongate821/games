'use strict';
// 第5章「雨の鉱山」 battle: 敵・技・仲間・装備・道具・台帳(UI・戦闘担当)。
// tools/balance_sim.py --emit が生成する。数値は balance_sim.py の表を直して再生成する。
registerChapter({
  id: 'c5',
  enemies: {
    "mine_bat": {"name": "坑道コウモリ", "img": "enemy_mine_bat", "fallback": "enemy_bat", "mhp": 67, "atk": 19, "def": 3, "spd": 13, "size": 190, "pattern": ["n", "n", "n"]},
    "moss_golem": {"name": "苔の坑道人形", "img": "enemy_moss_golem", "fallback": "enemy_golem", "mhp": 109, "atk": 19, "def": 5, "spd": 6, "size": 260, "pattern": ["n", "n", "tele", "strong"]},
    "mine_warden": {"name": "鉱山の番人", "img": "enemy_mine_warden", "fallback": "enemy_golem", "mhp": 360, "atk": 40, "def": 6, "spd": 8, "size": 380, "pattern": ["n", "n", "tele", "strong"]}
  },
  skills: {
    "rain_plus": {"name": "あめのうた・響", "mp": 8, "target": "allEnemies", "kind": "magic", "power": 15, "lv": 5},
    "gardo_quake": {"name": "地鳴らし", "mp": 6, "target": "allEnemies", "kind": "magic", "power": 14, "lv": 4}
  },
  items: {
    "miner_tonic": {"name": "坑夫の滋養薬", "desc": "雨の鉱山で配られる苦い薬。HPを60回復する。", "hp": 60}
  },
  gear: {
    "miner_plate": {"name": "坑夫の胸当て", "slot": "a", "def": 7, "desc": "落盤から身を守る厚い胸当て。重いが頼りになる。"},
    "gardo_mantle": {"name": "ガルドの古い肩当て", "slot": "a", "def": 8, "only": ["gardo"], "desc": "王都兵のものだった肩当て。紋章は削られている。"}
  },
  assets: [
    {"id": "enemy.mine_bat", "kind": "enemy", "file": "img/enemy_mine_bat.png", "spec": "横190px・透明・灰色のコウモリ。身構え差分なし", "status": "調整中", "fallback": "enemy_bat", "priority": "中", "owner": "Codex", "note": "第5章 坑道(既存の cave_bat は第1章の強さのまま。第5章では mine_bat を使う提案)"},
    {"id": "enemy.moss_golem", "kind": "enemy", "file": "img/enemy_moss_golem.png", "spec": "横260px・透明・苔むした石人形。身構え差分あり", "status": "調整中", "fallback": "enemy_golem", "priority": "中", "owner": "Codex", "note": "第5章 坑道"},
    {"id": "enemy.mine_warden", "kind": "enemy", "file": "img/enemy_mine_warden.png", "spec": "横380px・透明・巨大な掘削機械。身構え差分あり", "status": "調整中", "fallback": "enemy_golem", "priority": "中", "owner": "Codex", "note": "第5章 中ボス"}
  ]
});
