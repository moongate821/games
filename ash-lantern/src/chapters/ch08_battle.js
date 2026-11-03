'use strict';
// 第8章「砂の観測所」 battle: 敵・技・仲間・装備・道具・台帳(UI・戦闘担当)。
// tools/balance_sim.py --emit が生成する。数値は balance_sim.py の表を直して再生成する。
registerChapter({
  id: 'c8',
  enemies: {
    "sand_wraith": {"name": "砂の亡霊", "img": "enemy_sand_wraith", "fallback": "enemy_wolf", "mhp": 126, "atk": 28, "def": 5, "spd": 11, "size": 220, "pattern": ["n", "n", "n"]},
    "observatory_guard": {"name": "観測所の守護機", "img": "enemy_observatory_guard", "fallback": "enemy_guard", "mhp": 800, "atk": 40, "def": 9, "spd": 10, "size": 420, "pattern": ["n", "n", "tele", "strong"]}
  },
  skills: {
    "light_max": {"name": "ひかり・極", "mp": 5, "target": "enemy", "kind": "magic", "power": 36, "lv": 7},
    "serena_bolt": {"name": "雷火の針", "mp": 4, "target": "enemy", "kind": "magic", "power": 34},
    "serena_mend": {"name": "調律修復", "mp": 6, "target": "ally", "kind": "heal", "power": 55},
    "serena_pulse": {"name": "共鳴波", "mp": 8, "target": "allEnemies", "kind": "magic", "power": 22}
  },
  items: {
    "star_ether": {"name": "星砂の魔力薬", "desc": "観測所の星砂から作った薬。MPを24回復する。", "mp": 24}
  },
  gear: {
    "sand_goggles": {"name": "砂よけの眼鏡", "slot": "c", "spd": 3, "desc": "観測所の職員用。細かな砂塵を防ぐ。"},
    "moon_staff": {"name": "月影の杖", "slot": "w", "atk": 7, "only": ["mira"], "desc": "観測所の記録室に飾られていた杖。"},
    "serena_rod": {"name": "セレナの調律棒", "slot": "w", "atk": 5, "only": ["serena"], "desc": "機械の声を聞く細い棒。"}
  },
  allies: {
    "serena": {"name": "セレナ", "mhp": 38, "mmp": 20, "atk": 5, "def": 3, "spd": 8, "skills": ["serena_bolt", "serena_mend", "serena_pulse"], "portrait": "battle_serena", "learn": {"10": ["serena_arc"], "11": ["serena_mend2"], "12": ["serena_burst"]}}
  },
  assets: [
    {"id": "enemy.sand_wraith", "kind": "enemy", "file": "img/enemy_sand_wraith.png", "spec": "横220px・透明・砂でできた人影。身構え差分なし", "status": "調整中", "fallback": "enemy_wolf", "priority": "中", "owner": "Codex", "note": "第8章 観測所"},
    {"id": "enemy.observatory_guard", "kind": "enemy", "file": "img/enemy_observatory_guard.png", "spec": "横420px・透明・星見台を守る機械。身構え差分あり", "status": "調整中", "fallback": "enemy_guard", "priority": "高", "owner": "Codex", "note": "第8章 ボス。通常画像を接続、身構え差分は未制作"}
  ]
});
