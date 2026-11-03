'use strict';
// 第11章「王の子守歌」 battle: 敵・技・仲間・装備・道具・台帳(UI・戦闘担当)。
// tools/balance_sim.py --emit が生成する。数値は balance_sim.py の表を直して再生成する。
registerChapter({
  id: 'c11',
  enemies: {
    "royal_guard_elite": {"name": "近衛の機械兵", "img": "enemy_royal_guard_elite", "fallback": "enemy_guard", "mhp": 185, "atk": 36, "def": 11, "spd": 10, "size": 240, "pattern": ["n", "n", "tele", "strong"]},
    "rogue_device": {"name": "暴走装置", "img": "enemy_rogue_device", "fallback": "enemy_golem", "mhp": 1100, "atk": 64, "def": 11, "spd": 10, "size": 440, "pattern": ["n", "n", "tele", "strong"]}
  },
  skills: {
    "noah_cut": {"name": "羅針の一閃", "mp": 6, "target": "enemy", "kind": "magic", "power": 42, "lv": 10},
    "serena_arc": {"name": "断線の弧", "mp": 6, "target": "enemy", "kind": "magic", "power": 48, "lv": 10}
  },
  items: {
    "royal_cordial": {"name": "王宮の気付け薬", "desc": "王宮の薬棚にあった薬。HPを125回復する。", "hp": 125}
  },
  gear: {
    "royal_blade": {"name": "王家の剣", "slot": "w", "atk": 18, "desc": "王宮の武具庫に残っていた剣。装飾は外されている。"},
    "star_staff": {"name": "星守の杖", "slot": "w", "atk": 10, "only": ["mira"], "desc": "星を見る人の杖。"},
    "serena_rod2": {"name": "調律棒・改", "slot": "w", "atk": 8, "only": ["serena"], "desc": "セレナ自身が組み直した調律棒。"}
  },
  assets: [
    {"id": "enemy.royal_guard_elite", "kind": "enemy", "file": "img/enemy_royal_guard_elite.png", "spec": "横240px・透明・金縁の鎧の機械兵。身構え差分あり", "status": "調整中", "fallback": "enemy_guard", "priority": "中", "owner": "Codex", "note": "第11章(第4章の royal_guard とは強さが違うため別ID。台本は第11章でこちらを使う提案)"},
    {"id": "enemy.rogue_device", "kind": "enemy", "file": "img/enemy_rogue_device.png", "spec": "横440px・透明・歯車と配線の塊。身構え差分(回転が速くなる)あり", "status": "調整中", "fallback": "enemy_golem", "priority": "高", "owner": "Codex", "note": "第11章 ボス"}
  ]
});
