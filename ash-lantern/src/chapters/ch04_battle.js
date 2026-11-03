'use strict';
// 第4章「白い城の命令」 battle: 敵・技・仲間・装備・道具・台帳(UI・戦闘担当)。
// tools/balance_sim.py --emit が生成する。数値は balance_sim.py の表を直して再生成する。
registerChapter({
  id: 'c4',
  enemies: {
    "royal_guard": {"name": "王都の衛兵", "img": "enemy_royal_guard", "fallback": "enemy_guard", "mhp": 77, "atk": 16, "def": 4, "spd": 9, "size": 230, "pattern": ["n", "n", "n"]},
    "chaser": {"name": "追跡機", "img": "enemy_chaser", "fallback": "enemy_guard", "mhp": 63, "atk": 17, "def": 3, "spd": 13, "size": 210, "pattern": ["n", "n", "n"]},
    "chaser_prime": {"name": "追跡機・長", "img": "enemy_chaser_prime", "fallback": "enemy_guard", "mhp": 552, "atk": 30, "def": 5, "spd": 11, "size": 400, "pattern": ["n", "n", "tele", "strong"]}
  },
  skills: {
    "heal_plus": {"name": "ヒール・強", "mp": 6, "target": "ally", "kind": "heal", "power": 45, "lv": 4},
    "gardo_guard": {"name": "兵士の手当", "mp": 5, "target": "ally", "kind": "heal", "power": 35, "lv": 3}
  },
  items: {
    "mist_ether": {"name": "霧の魔力薬", "desc": "白い城の薬師が調合した。MPを14回復する。", "mp": 14}
  },
  gear: {
    "guard_saber": {"name": "衛兵のサーベル", "slot": "w", "atk": 8, "desc": "王都の衛兵が使う細身の剣。手入れが行き届いている。"},
    "silver_staff": {"name": "銀の細杖", "slot": "w", "atk": 4, "only": ["mira"], "desc": "先に小さな銀の灯をつけた杖。"},
    "gardo_hammer": {"name": "ガルドの戦槌", "slot": "w", "atk": 7, "only": ["gardo"], "desc": "兵士時代の戦槌。握りが擦り切れている。"}
  },
  assets: [
    {"id": "enemy.royal_guard", "kind": "enemy", "file": "img/enemy_royal_guard.png", "spec": "横230px・透明・白い鎧の兵。身構え差分なし", "status": "調整中", "fallback": "enemy_guard", "priority": "中", "owner": "Codex", "note": "第4章 王都"},
    {"id": "enemy.chaser", "kind": "enemy", "file": "img/enemy_chaser.png", "spec": "横210px・透明・細身の追跡機。身構え差分なし", "status": "調整中", "fallback": "enemy_guard", "priority": "中", "owner": "Codex", "note": "第4章 脱出路"},
    {"id": "enemy.chaser_prime", "kind": "enemy", "file": "img/enemy_chaser_prime.png", "spec": "横400px・透明・大型の追跡機。身構え差分(光る)あり", "status": "調整中", "fallback": "enemy_guard", "priority": "高", "owner": "Codex", "note": "第4章 ボス。通常画像を接続、身構え差分は未制作"}
  ]
});
