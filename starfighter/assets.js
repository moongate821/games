// 全30アセットの仕様データ(資料/アセット定義_30.json から生成)。file:// でも読めるように、JSON ではなく JS にしてある。
const ASSET_DATA = [
 {
  "id": "01",
  "category": "UI",
  "name": "タイトル画面",
  "description": "黒背景、ネオンブルーとマゼンタのタイトルロゴ、中央に「PRESS SPACE」の点滅。"
 },
 {
  "id": "02",
  "category": "UI",
  "name": "コックピットHUD",
  "description": "画面下部に全方位レーダー。左右にシールド残量とスコアのデジタル表示。"
 },
 {
  "id": "03",
  "category": "UI",
  "name": "リザルト＆ランキング",
  "description": "ステージクリア時のスコア集計画面。グリーンのワイヤーフレーム文字。"
 },
 {
  "id": "04",
  "category": "Player",
  "name": "自機 (通常状態)",
  "description": "鋭角な三角形ベースのシアン色（水色）ワイヤーフレーム機体。後部にスラスター。"
 },
 {
  "id": "05",
  "category": "Player",
  "name": "自機 (被弾状態)",
  "description": "機体の線画が赤く点滅し、ノイズ（グリッチ）が走るエフェクト。"
 },
 {
  "id": "06",
  "category": "Enemy",
  "name": "ザコ敵機 (チェイサー)",
  "description": "菱形（ひしがた）の赤いワイヤーフレーム。自機に向かって直線的に特攻。"
 },
 {
  "id": "07",
  "category": "Enemy",
  "name": "ザコ敵機 (ガンナー)",
  "description": "六角形のオレンジ色のワイヤーフレーム。一定距離を保ち弾を撃つ。"
 },
 {
  "id": "08",
  "category": "Enemy",
  "name": "スウォーム (群れ)",
  "description": "小型の三角形が数十機の編隊を組み、波のように押し寄せる。色は紫。"
 },
 {
  "id": "09",
  "category": "Enemy",
  "name": "高速機 (インターセプター)",
  "description": "矢印（アロー）型の細長い機体。黄色いネオンカラーで高速移動。"
 },
 {
  "id": "10",
  "category": "Enemy",
  "name": "ステルス機",
  "description": "通常は透明（線が極端に細い）で、攻撃時のみマゼンタ色に発光して実体化。"
 },
 {
  "id": "11",
  "category": "Space",
  "name": "宇宙空間 (ベース)",
  "description": "背景は完全な黒。遠近感のある小さな星（白いドット）がゆっくり流れる。"
 },
 {
  "id": "12",
  "category": "Space",
  "name": "通常グリッド",
  "description": "画面奥から手前に流れるネオングリーンの水平・垂直グリッド線。"
 },
 {
  "id": "13",
  "category": "Space",
  "name": "複雑なグリッド",
  "description": "グリッドが波打つように歪み、空間の乱れを表現する特殊ステージ。"
 },
 {
  "id": "14",
  "category": "Space",
  "name": "広大な宇宙域",
  "description": "グリッドがなく、星のサイズと流れる速度の階層（パララックス）だけで奥行きを表現。"
 },
 {
  "id": "15",
  "category": "Space",
  "name": "最終惑星への接近",
  "description": "画面奥に巨大な球体（惑星）のワイヤーフレームが徐々に迫ってくる空間。"
 },
 {
  "id": "16",
  "category": "Obstacle",
  "name": "アステロイド (小)",
  "description": "不規則な多角形の岩石群。青白いワイヤーフレーム。破壊可能。"
 },
 {
  "id": "17",
  "category": "Obstacle",
  "name": "アステロイド (大)",
  "description": "画面の半分を占める巨大な多角形。破壊不可で回避が必須。"
 },
 {
  "id": "18",
  "category": "Obstacle",
  "name": "スペースデブリ",
  "description": "壊れた人工衛星や戦艦の残骸。赤とオレンジの線画で回転しながら漂う。"
 },
 {
  "id": "19",
  "category": "Obstacle",
  "name": "防衛レーザー網",
  "description": "空間を遮るように引かれた赤い直線。触れるとシールドが大幅に削れる。"
 },
 {
  "id": "20",
  "category": "Obstacle",
  "name": "トラップグリッド",
  "description": "通常のグリッドの一部が赤く発光し、その上を通過するとダメージを受ける。"
 },
 {
  "id": "21",
  "category": "Boss",
  "name": "中ボス (多面体)",
  "description": "正二十面体の巨大な赤いワイヤーフレーム。各面からレーザーを放射する。"
 },
 {
  "id": "22",
  "category": "Boss",
  "name": "防衛戦艦",
  "description": "複数のパーツ（砲台、エンジン）が組み合わさった巨大戦艦。部位破壊が可能。"
 },
 {
  "id": "23",
  "category": "Boss",
  "name": "最終惑星コア (外殻)",
  "description": "幾重にも重なる球状のシールドグリッド。特定の色（弱点）を攻撃して穴を開ける。"
 },
 {
  "id": "24",
  "category": "Boss",
  "name": "最終惑星コア (中心核)",
  "description": "激しく明滅するエネルギーの塊（複雑な多角形の集合体）。"
 },
 {
  "id": "25",
  "category": "Boss",
  "name": "コア防衛ガーディアン",
  "description": "コアの周囲を高速で旋回する、鋭利な刃物のような赤いワイヤーフレーム兵器。"
 },
 {
  "id": "26",
  "category": "Effect",
  "name": "ワープ (開始)",
  "description": "自機を中心に星々が放射状に伸び、線になって奥へ吸い込まれるエフェクト。"
 },
 {
  "id": "27",
  "category": "Effect",
  "name": "ワープ (終了)",
  "description": "画面全体が白くフラッシュし、新しい色のグリッド空間が展開される。"
 },
 {
  "id": "28",
  "category": "Effect",
  "name": "敵機の爆発",
  "description": "構成していたワイヤーフレームの線分がバラバラになり、四散するパーティクル。"
 },
 {
  "id": "29",
  "category": "Effect",
  "name": "特殊兵装 (ワイド)",
  "description": "自機から扇状に広がる、太くて眩しい青白いレーザーの線画。"
 },
 {
  "id": "30",
  "category": "Effect",
  "name": "コア大爆発 (エンディング)",
  "description": "画面全体を覆い尽くすほどの光の輪（同心円）が連続して広がる。"
 }
];

// IDやカテゴリから、アセットの仕様(要件定義)を引く
class AssetManager {
  constructor(list) { this.assets = list; }
  getAssetInfo(id) { return this.assets.find(a => a.id === id); }
  getAssetsByCategory(category) { return this.assets.filter(a => a.category === category); }
}
