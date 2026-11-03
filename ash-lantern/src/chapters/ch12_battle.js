'use strict';
// 第12章「灰の海へ」 battle: 敵・技・仲間・装備・道具・台帳(UI・戦闘担当)。
// tools/balance_sim.py --emit が生成する。数値は balance_sim.py の表を直して再生成する。
registerChapter({
  id: 'c12',
  enemies: {
    "ash_beast": {"name": "灰の獣", "img": "enemy_ash_beast", "fallback": "enemy_wolf", "mhp": 255, "atk": 36, "def": 12, "spd": 10, "size": 330, "pattern": ["n", "n", "tele", "strong"]}
  },
  skills: {
    "light_ex": {"name": "ひかり・暁", "mp": 6, "target": "enemy", "kind": "magic", "power": 52, "lv": 11},
    "serena_mend2": {"name": "全体調律", "mp": 8, "target": "ally", "kind": "heal", "power": 90, "lv": 11}
  },
  items: {
    "big_ether": {"name": "大きな魔力薬", "desc": "灰の海へ向かう前に仲間で作った薬。MPを32回復する。", "mp": 32}
  },
  gear: {
    "sky_cloak": {"name": "空の外套", "slot": "a", "def": 14, "desc": "風を逃がす薄い外套。灰の海の風にも耐える。"},
    "ash_ward": {"name": "灰除けのお守り", "slot": "c", "def": 3, "spd": 1, "desc": "仲間みんなで作った、灰除けの小さなお守り。"},
    "compass_gun": {"name": "ノアの羅針銃", "slot": "w", "atk": 18, "only": ["noah"], "desc": "古い羅針盤を組み込んだ短い筒。"}
  },
  assets: [
    {"id": "enemy.ash_beast", "kind": "enemy", "file": "img/enemy_ash_beast.png", "spec": "横330px・透明・灰をまとった獣。身構え差分あり", "status": "調整中", "fallback": "enemy_wolf", "priority": "中", "owner": "Codex", "note": "第12章 灰の海(強めの通常敵)"}
  ]
});
