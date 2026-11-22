ここに差し替え用のドット絵(透明PNG)を入れる。
1. PNG をこのフォルダに置く(背景は透明。向きは「左向き」=敵・ボス、右向き=自機)
2. sprites.json に 名前 を足す:  { "boss_1": { "file": "assets/boss1.png", "w": 96 } }   w=ゲーム内での横幅(ドット)
名前の一覧: player, bit, drone, swoop, turret, ringer, carrier, boss_1 〜 boss_20
名前が無い・ファイルが読めないときは、コードで描いた仮の形が出る(ゲームは止まらない)。
