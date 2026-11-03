'use strict';
// 第6章「風の谷の約束」 battle: 敵・技・仲間・装備・道具・台帳(UI・戦闘担当)。
// tools/balance_sim.py --emit が生成する。数値は balance_sim.py の表を直して再生成する。
registerChapter({
  id: 'c6',
  enemies: {
    "wind_wisp": {"name": "風の残り火", "img": "enemy_wind_wisp", "fallback": "enemy_bat", "mhp": 78, "atk": 22, "def": 4, "spd": 13, "size": 190, "pattern": ["n", "n", "n"]},
    "furnace_guardian": {"name": "炉の番人", "img": "enemy_furnace_guardian", "fallback": "enemy_golem", "mhp": 552, "atk": 47, "def": 7, "spd": 9, "size": 440, "pattern": ["n", "tele", "strong", "n", "n", "tele", "strong"]}
  },
  skills: {
    "noah_hook": {"name": "巻き上げ", "mp": 5, "target": "enemy", "kind": "magic", "power": 28, "lv": 5}
  },
  items: {
    "wind_herb": {"name": "谷風の薬草", "desc": "風の谷の薬草。HPを70回復する。", "hp": 70}
  },
  gear: {
    "wind_blade": {"name": "風切りの短剣", "slot": "w", "atk": 11, "desc": "谷の風を受けて鳴る刃。"},
    "furnace_pin": {"name": "炉番のピン", "slot": "c", "def": 2, "desc": "大型炉の整備士がつける留め具。熱に強い。"},
    "noah_hook": {"name": "ノアの鉤縄", "slot": "w", "atk": 10, "only": ["noah"], "desc": "先に小さな鉤をつけた長い縄。振り回すと風が鳴る。"}
  },
  assets: [
    {"id": "enemy.wind_wisp", "kind": "enemy", "file": "img/enemy_wind_wisp.png", "spec": "横190px・透明・青白い炎。身構え差分なし", "status": "調整中", "fallback": "enemy_bat", "priority": "中", "owner": "Codex", "note": "第6章 谷"},
    {"id": "enemy.furnace_guardian", "kind": "enemy", "file": "img/enemy_furnace_guardian.png", "spec": "横440px・透明・大型の守護機。身構え差分(胸の火が増す)あり", "status": "調整中", "fallback": "enemy_golem", "priority": "高", "owner": "Codex", "note": "第6章 ボス。通常画像を接続、身構え差分は未制作"}
  ]
});
