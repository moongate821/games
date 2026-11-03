'use strict';
// 第2章「塩の街道と元兵士」 battle: 敵・技・仲間・装備・道具・台帳(UI・戦闘担当)。
// tools/balance_sim.py --emit が生成する。数値は balance_sim.py の表を直して再生成する。
registerChapter({
  id: 'c2',
  enemies: {
    "salt_bandit": {"name": "塩賊", "img": "enemy_salt_bandit", "fallback": "enemy_guard", "mhp": 42, "atk": 12, "def": 2, "spd": 9, "size": 220, "pattern": ["n", "n", "n"]},
    "sand_beast": {"name": "砂喰らい", "img": "enemy_sand_beast", "fallback": "enemy_crab", "mhp": 55, "atk": 11, "def": 2, "spd": 8, "size": 250, "pattern": ["n", "n", "tele", "strong"]},
    "bandit_chief": {"name": "塩賊の頭目", "img": "enemy_bandit_chief", "fallback": "enemy_guard", "mhp": 237, "atk": 22, "def": 4, "spd": 9, "size": 380, "pattern": ["n", "n", "tele", "strong"]}
  },
  skills: {
    "gardo_bash": {"name": "盾打ち", "mp": 3, "target": "enemy", "kind": "magic", "power": 12},
    "gardo_patch": {"name": "応急手当", "mp": 3, "target": "ally", "kind": "heal", "power": 20}
  },
  items: {
    "caravan_ration": {"name": "隊商の携行食", "desc": "干し肉と砂糖菓子。HPを35回復する。", "hp": 35}
  },
  gear: {
    "salt_knife": {"name": "塩晶のナイフ", "slot": "w", "atk": 5, "desc": "塩の街道の露店で買える薄刃。軽くて切れ味がいい。"},
    "caravan_coat": {"name": "隊商の外套", "slot": "a", "def": 4, "desc": "砂よけの厚い外套。風を通さない。"},
    "gardo_axe": {"name": "ガルドの手斧", "slot": "w", "atk": 4, "only": ["gardo"], "desc": "薪割り用の手斧。兵士の頃の癖で、重心が揃えてある。"}
  },
  allies: {
    "gardo": {"name": "ガルド", "mhp": 70, "mmp": 8, "atk": 8, "def": 6, "spd": 6, "skills": ["gardo_bash", "gardo_patch"], "portrait": "battle_gardo", "learn": {"3": ["gardo_guard"], "4": ["gardo_quake"]}}
  },
  assets: [
    {"id": "enemy.salt_bandit", "kind": "enemy", "file": "img/enemy_salt_bandit.png", "spec": "横220px・透明・左向きの荷車襲撃者。身構え差分なし", "status": "調整中", "fallback": "enemy_guard", "priority": "中", "owner": "Codex", "note": "第2章 街道の盗賊(通常)。通常画像を接続"},
    {"id": "enemy.sand_beast", "kind": "enemy", "file": "img/enemy_sand_beast.png", "spec": "横250px・透明・砂色の四足獣。身構え差分(体を沈める)あり", "status": "調整中", "fallback": "enemy_crab", "priority": "中", "owner": "Codex", "note": "第2章 街道の獣。通常画像を接続、身構え差分は未制作"},
    {"id": "enemy.bandit_chief", "kind": "enemy", "file": "img/enemy_bandit_chief.png", "spec": "横380px・透明・大柄な人物。身構え差分(武器を構える)あり", "status": "調整中", "fallback": "enemy_guard", "priority": "高", "owner": "Codex", "note": "第2章 ボス。通常画像を接続、身構え差分は未制作"},
    {"id": "ui.target_arrow", "kind": "ui", "file": "img/ui_target_arrow.png", "spec": "48×48・透明・下向き三角(金色)。上下にゆれる前提で1枚。対象選択で敵や味方の頭上に出す", "status": "調整中", "fallback": "", "priority": "高", "owner": "Codex", "note": "全章の対象選択"},
    {"id": "ui.status_icons", "kind": "ui", "file": "img/ui_status_icons.png", "spec": "横6コマ×縦1行・1コマ32×32・透明。毒・眠り・暗闇・攻撃低下・防御低下・防御中の順", "status": "調整中", "fallback": "", "priority": "中", "owner": "Codex", "note": "状態異常を実装したとき。名前の横に出す"},
    {"id": "ui.boss_frame", "kind": "ui", "file": "img/ui_boss_frame.png", "spec": "540×72・透明・金縁の細長い枠(ボスのHPバー用。中央が抜けている)", "status": "調整中", "fallback": "", "priority": "中", "owner": "Codex", "note": "ボス戦の画面上部"},
    {"id": "ui.boss_nameplate", "kind": "ui", "file": "img/ui_boss_nameplate.png", "spec": "360×48・透明・ボス名の札", "status": "調整中", "fallback": "", "priority": "低", "owner": "Codex", "note": "ボス登場の演出"},
    {"id": "ui.turn_order", "kind": "ui", "file": "img/ui_turn_order.png", "spec": "64×64・透明・行動順の顔アイコン枠(味方=金/敵=赤の2色)", "status": "調整中", "fallback": "", "priority": "低", "owner": "Codex", "note": "行動順の表示(提案)"},
    {"id": "ui.cmd_icons", "kind": "ui", "file": "img/ui_cmd_icons.png", "spec": "横5コマ×縦1行・1コマ32×32・透明。攻撃・技・防御・道具・逃げるの順", "status": "調整中", "fallback": "", "priority": "中", "owner": "Codex", "note": "コマンドメニュー"},
    {"id": "ui.mp_gauge", "kind": "ui", "file": "img/ui_mp_gauge.png", "spec": "268×16・透明・MPバーの枠(青)。HPバー枠とそろえる", "status": "調整中", "fallback": "", "priority": "低", "owner": "Codex", "note": "戦闘と各メニュー"},
    {"id": "fx.hit", "kind": "fx", "file": "img/fx_hit.png", "spec": "横4コマ×1行・1コマ128×128・透明・白い斬撃の火花", "status": "調整中", "fallback": "", "priority": "高", "owner": "Codex", "note": "通常攻撃のヒット"},
    {"id": "fx.light", "kind": "fx", "file": "img/fx_light.png", "spec": "横6コマ×1行・1コマ192×192・透明・光の柱(ひかり系)", "status": "調整中", "fallback": "", "priority": "高", "owner": "Codex", "note": "ミラのひかり系"},
    {"id": "fx.heal", "kind": "fx", "file": "img/fx_heal.png", "spec": "横6コマ×1行・1コマ160×160・透明・緑の光が昇る(ヒール・回復薬)", "status": "調整中", "fallback": "", "priority": "高", "owner": "Codex", "note": "回復全般"},
    {"id": "fx.rain", "kind": "fx", "file": "img/fx_rain.png", "spec": "横6コマ×1行・1コマ256×256・透明・青い雨粒(あめのうた系。敵全体にかける)", "status": "調整中", "fallback": "", "priority": "高", "owner": "Codex", "note": "全体技"},
    {"id": "fx.guard", "kind": "fx", "file": "img/fx_guard.png", "spec": "横4コマ×1行・1コマ160×160・透明・半透明の盾の光", "status": "調整中", "fallback": "", "priority": "中", "owner": "Codex", "note": "防御"},
    {"id": "fx.enemy_strong", "kind": "fx", "file": "img/fx_enemy_strong.png", "spec": "横5コマ×1行・1コマ256×256・透明・赤い爪痕(強攻撃)", "status": "調整中", "fallback": "", "priority": "中", "owner": "Codex", "note": "敵の強攻撃"},
    {"id": "fx.status_poison", "kind": "fx", "file": "img/fx_status_poison.png", "spec": "横4コマ×1行・1コマ96×96・透明・紫の泡", "status": "調整中", "fallback": "", "priority": "低", "owner": "Codex", "note": "状態異常:毒(実装時)"},
    {"id": "fx.status_sleep", "kind": "fx", "file": "img/fx_status_sleep.png", "spec": "横4コマ×1行・1コマ96×96・透明・Zの文字が昇る", "status": "調整中", "fallback": "", "priority": "低", "owner": "Codex", "note": "状態異常:眠り(実装時)"},
    {"id": "fx.boss_appear", "kind": "fx", "file": "img/fx_boss_appear.png", "spec": "960×540・透明・画面全体の暗転と光のすじ(ボス登場の一瞬)", "status": "調整中", "fallback": "", "priority": "低", "owner": "Codex", "note": "ボス戦の導入"},
    {"id": "fx.limit_teaching", "kind": "fx", "file": "img/fx_limit_teaching.png", "spec": "横8コマ×1行・1コマ320×320・透明・金色の光と手の影(ガルドの教え)", "status": "調整中", "fallback": "", "priority": "中", "owner": "Codex", "note": "第7章以降の連携技"},
    {"id": "fx.ash_burst", "kind": "fx", "file": "img/fx_ash_burst.png", "spec": "横6コマ×1行・1コマ320×320・透明・灰色の爆発(灰の冠戦)", "status": "調整中", "fallback": "", "priority": "低", "owner": "Codex", "note": "第13章"},
    {"id": "battle.mira_cast", "kind": "battle", "file": "img/battle_mira_cast.png", "spec": "高さ約180px・透明・杖を掲げるポーズ(技を使うとき)。足元が画像下端", "status": "調整中", "fallback": "", "priority": "高", "owner": "Codex", "note": "ミラの技"},
    {"id": "battle.gardo_cast", "kind": "battle", "file": "img/battle_gardo_cast.png", "spec": "高さ約180px・透明・盾を構えるポーズ", "status": "調整中", "fallback": "", "priority": "中", "owner": "Codex", "note": "ガルドの技"},
    {"id": "battle.noah_cast", "kind": "battle", "file": "img/battle_noah_cast.png", "spec": "高さ約180px・透明・縄を投げるポーズ", "status": "調整中", "fallback": "", "priority": "中", "owner": "Codex", "note": "ノアの技"},
    {"id": "battle.serena_cast", "kind": "battle", "file": "img/battle_serena_cast.png", "spec": "高さ約180px・透明・手をかざすポーズ", "status": "調整中", "fallback": "", "priority": "中", "owner": "Codex", "note": "セレナの技"},
    {"id": "battle.allen_attack", "kind": "battle", "file": "img/battle_allen_attack.png", "spec": "高さ約180px・透明・剣を振り下ろす姿(後ろ姿)", "status": "調整中", "fallback": "", "priority": "中", "owner": "Codex", "note": "アレンの攻撃(今は歩行画像の流用)"},
    {"id": "enemy.bridge_beast_pose", "kind": "enemy", "file": "img/enemy_crab_pose.png", "spec": "横440px・透明・橋の灰獣の身構え(既存の enemy_crab と同じ寸法)", "status": "調整中", "fallback": "", "priority": "中", "owner": "Codex", "note": "第1章ボスの身構え差分"},
    {"id": "enemy.ash_wolf_pose", "kind": "enemy", "file": "img/enemy_wolf_pose.png", "spec": "横359px・透明・灰狼の身構え(既存の enemy_wolf と同じ寸法)", "status": "調整中", "fallback": "", "priority": "低", "owner": "Codex", "note": "序章の身構え差分(今は光と拡大で代用)"}
  ]
});
