/* 霧の灯台 data.js  定義データのみ。単位: 距離=マス(タイル) 時間=秒 */
(function (root) {
'use strict';
var W = 24, H = 13.5;

/* ---------------- タワー ---------------- */
// lv[i]: i=0..3  up=そのレベルに至る費用(lv0は設置費)
var TOWERS = {
  T1: { id: 'T1', name: '灯火台', role: '基本のライト', cost: 60, unlock: 1, light: true, air: true, color: '#ffc77a',
    desc: '祖母が磨いてきた小さなランタン。強く燃えるほど、遠くまで迷いの顔を映し出す。',
    special: 'Lv3「灯芯」: この塔の光の中では、照らされの効果が強化される(被ダメ+25%、速度-15%)。',
    lv: [
      { upkeep: 2, up: 60, atk: 6, range: 2.2, iv: 0.80, light: 2.2 },
      { upkeep: 3, up: 50, atk: 9, range: 2.5, iv: 0.75, light: 2.5 },
      { upkeep: 4, up: 90, atk: 14, range: 2.8, iv: 0.70, light: 2.8 },
      { upkeep: 5, up: 150, atk: 22, range: 3.2, iv: 0.60, light: 3.2, strong: true }],
    lv3b: { up: 150, atk: 18, range: 3.6, iv: 0.60, light: 4.0, upkeep: 5 }, branch: ['灯芯','広灯','照らされ強化(被ダメ+25%・速度-15%)','光半径4.0・射程3.6。攻撃は18に下がる'] },
  T2: { id: 'T2', name: '銛台', role: '単体高火力', cost: 90, unlock: 1, light: false, air: true, color: '#a9c4e8',
    desc: '古い捕鯨用の銛を改造した台座。霧の中では撃てないが、光が当たったものは決して外さない。',
    special: '固定軽減(濡れ鎧・潮の巨兵・ボスの装甲)を無視する。Lv3は貫通(射線上の2体まで)。',
    lv: [
      { up: 90, atk: 40, range: 4.5, iv: 2.00 },
      { up: 70, atk: 60, range: 4.8, iv: 1.90 },
      { up: 120, atk: 90, range: 5.2, iv: 1.80 },
      { up: 200, atk: 140, range: 5.6, iv: 1.60, pierce: 2 }],
    lv3b: { up: 200, atk: 190, range: 5.6, iv: 1.60, shieldPierce: true }, branch: ['貫通','徹甲','攻撃140・射線上の2体まで貫通','攻撃190。貫通なし。シールドへの半減を無効'] },
  T3: { id: 'T3', name: '霧笛砲', role: '範囲攻撃(地上のみ)', cost: 120, unlock: 2, light: false, air: false, color: '#6fe3b8',
    desc: '港で霧を払うために使われていた大きな笛。鳴らすと、群れがまとめて「はっ」として足を止める。',
    special: '範囲内の全員に与える。地上のみ。Lv3は0.3秒のスタン(巨兵とボスには無効)。',
    lv: [
      { up: 120, atk: 25, range: 3.5, iv: 2.50, blast: 1.2 },
      { up: 90, atk: 38, range: 3.7, iv: 2.40, blast: 1.3 },
      { up: 150, atk: 55, range: 4.0, iv: 2.20, blast: 1.5 },
      { up: 240, atk: 85, range: 4.3, iv: 2.00, blast: 1.8, stun: 0.3 }],
    lv3b: { up: 240, atk: 85, range: 4.3, iv: 1.40, blast: 1.4 }, branch: ['スタン','連鳴','爆風1.8・0.3秒スタン','間隔1.4秒・爆風1.4。スタンなし'] },
  T4: { id: 'T4', name: '氷灯', role: '減速', cost: 100, unlock: 3, light: true, air: true, color: '#8fd8ff',
    desc: '凍える夜に灯るあおい炎。迷いたちは懐かしい冬の匂いを思い出して、足取りがゆっくりになる。',
    special: '命中した敵を2秒間減速(重複せず強い方)。Lv3は15%の確率で1秒間凍結。',
    lv: [
      { upkeep: 3, up: 100, atk: 3, range: 3.0, iv: 1.00, light: 2.5, slow: 0.25 },
      { upkeep: 4, up: 70, atk: 5, range: 3.0, iv: 1.00, light: 2.8, slow: 0.30 },
      { upkeep: 5, up: 110, atk: 8, range: 3.3, iv: 1.00, light: 3.1, slow: 0.38 },
      { upkeep: 6, up: 180, atk: 12, range: 3.5, iv: 0.90, light: 3.5, slow: 0.45, freeze: 0.15 }],
    lv3b: { up: 180, atk: 12, range: 3.5, iv: 0.90, light: 3.5, slow: 0.55, slowDur: 3, upkeep: 6 }, branch: ['凍結','深冷','減速45%・15%で1秒凍結','減速55%・持続3秒。凍結なし'] },
  T5: { id: 'T5', name: '雷灯', role: '連鎖攻撃', cost: 140, unlock: 7, light: true, air: true, color: '#d2c0ff',
    desc: '嵐の夜に空から借りた光。ぱちぱちと跳ねる稲妻が、近くの迷いに次々と飛び移る。',
    special: '連鎖(ホップごとダメージ×0.7、連鎖距離1.5)。鐘守りの亡霊の光のシールドには2倍。',
    lv: [
      { upkeep: 4, up: 140, atk: 18, range: 3.0, iv: 1.40, light: 2.2, chain: 3 },
      { upkeep: 5, up: 100, atk: 26, range: 3.2, iv: 1.40, light: 2.4, chain: 3 },
      { upkeep: 6, up: 160, atk: 38, range: 3.4, iv: 1.30, light: 2.6, chain: 4 },
      { upkeep: 8, up: 260, atk: 55, range: 3.6, iv: 1.20, light: 3.0, chain: 5 }],
    lv3b: { up: 260, atk: 70, range: 3.6, iv: 1.00, light: 3.0, chain: 3, upkeep: 8 }, branch: ['連鎖5','迅雷','連鎖5・攻撃55','攻撃70・連鎖3・間隔1.0'] },
  T6: { id: 'T6', name: '反射鏡', role: '光を広げる補助', cost: 80, unlock: 5, light: false, air: false, support: true, color: '#cfeeff',
    desc: 'ポウのお気に入り。磨かれた鏡が光を受け取り、まわりの灯りをもう少しだけ遠くへ届けてくれる。',
    special: '向き(8方向)の扇形の内側にあるライトの光半径を加算(×1.5、合計上限+2.0)。鏡の扇に別の鏡が入ると長さ+0.6。Lv3は扇内のタワーの攻撃力+10%。',
    lv: [
      { up: 80, infl: 3.0, add: 0.5, cone: 40 },
      { up: 60, infl: 3.2, add: 0.8, cone: 45 },
      { up: 100, infl: 3.5, add: 1.1, cone: 50 },
      { up: 160, infl: 4.0, add: 1.5, cone: 55, buff: 0.10 }] },
  T7: { id: 'T7', name: '油汲み', role: '経済', cost: 100, unlock: 4, light: false, air: false, support: true, color: '#ffb84a',
    desc: '光の粒が沈んでたまった油溜まりから、そっと油を汲み上げる古い手押しポンプ。',
    special: '波が始まるときに自動で油を入手する。1ステージに最大3基。',
    lv: [
      { up: 100, income: 20 },
      { up: 80, income: 32 },
      { up: 130, income: 48 },
      { up: 200, income: 70 }] },
  T8: { id: 'T8', name: '大レンズ', role: '貫く光線', cost: 220, unlock: 9, light: true, air: true, beam: true, color: '#ffe08a',
    desc: '灯台の頂にあった巨大なレンズの破片。回転するたびに、光が一本の道になって霧を貫く。',
    special: '光線は毎秒60度で回転し、0.25秒ごとに長さ内の全員にダメージ。Lv3は光線上の敵に照らされの強化。',
    lv: [
      { upkeep: 6, up: 220, atk: 12, beamLen: 5.0, light: 4.0 },
      { upkeep: 8, up: 150, atk: 16, beamLen: 5.5, light: 4.4 },
      { upkeep: 10, up: 240, atk: 22, beamLen: 6.0, light: 4.8 },
      { upkeep: 13, up: 380, atk: 32, beamLen: 6.5, light: 5.5, strong: true }] }
};
(function () { for (var k in TOWERS) { var t = TOWERS[k], tot = 0; for (var i = 0; i < 4; i++) { tot += t.lv[i].up; t.lv[i].total = tot; } } })();
var TOWER_ORDER = ['T1', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'T8'];

/* ---------------- 敵 ---------------- */
var ENEMIES = {
  E01: { id: 'E01', name: '迷い火', hp: 30, speed: 1.0, oil: 3, leak: 1, res: 0, armor: 0, fog: '低', desc: '霧の中にふわりと浮かぶ、小さな青い火。道を探してゆらゆらと歩く。光を当てると、ちょっとだけほっとした顔になる。', trait: '特になし。光に弱い。' },
  E02: { id: 'E02', name: 'さまよい漁師', hp: 60, speed: 0.8, oil: 5, leak: 1, res: 0, armor: 0, fog: '低', desc: '夜の海に出たまま、港が見つからなくなった漁師の影。かごにはまだ魚が入っている。声をかけると、はい、と小さく答える。', trait: '特になし。数が出る基本の敵。' },
  E03: { id: 'E03', name: '霧の子', hp: 20, speed: 1.8, oil: 3, leak: 1, res: 0, armor: 0, fog: '中', gap: 0.6, desc: '霧から生まれたこどもの影。じっとしていられず、いつも走っている。光に当たると、くすぐったそうに笑う。', trait: '非常に速い。群れで出る。' },
  E04: { id: 'E04', name: '濡れ鎧', hp: 160, speed: 0.6, oil: 10, leak: 2, res: 0.25, armor: 4, fog: '中', desc: '海に沈んだ兵士の鎧。重くて遅いが、とても頑丈。中身はからっぽで、ただ帰る家の名前だけを呟いている。', trait: '固定軽減4。銛台が有効。' },
  E05: { id: 'E05', name: '霧ぐらげ', hp: 90, speed: 0.9, oil: 6, leak: 1, res: 0.5, armor: 0, fog: '高', desc: '霧に溶けてふわふわ漂うクラゲ。光が少し苦手で、強い光ほどゆっくり引き返したがる。', trait: '光耐性50%。氷灯などの減速が有効。' },
  E06: { id: 'E06', name: '影鴉', hp: 70, speed: 1.5, oil: 6, leak: 1, res: 0, armor: 0, fog: '中', flying: true, afterimage: 0.5, desc: '霧の上を飛ぶ鴉の影。道がなくても、灯台の明かりだけはまっすぐ見つけられる。', trait: '飛行。霧笛砲は当たらない。残像0.5秒。' },
  E07: { id: 'E07', name: '灯消し', hp: 110, speed: 0.8, oil: 8, leak: 2, res: 0.25, armor: 0, fog: '中', desc: '古い蝋燭の精。灯りが好きすぎて、近くの灯りをそっと包んでしまう。悪気はまったくない。', trait: '半径2マス内のライトの光半径を30%小さくする。' },
  E08: { id: 'E08', name: '潮喰い', hp: 220, speed: 0.7, oil: 12, leak: 2, res: 0.25, armor: 0, fog: '高', desc: '暗がりの潮だまりに棲む大きな魚。光の外ではすぐに元気になるが、光に当たると眠そうにする。', trait: '照らされていない間、毎秒最大HPの3%を回復。' },
  E09: { id: 'E09', name: '割れ人形', hp: 140, speed: 0.8, oil: 8, leak: 1, res: 0, armor: 0, fog: '中', desc: '船乗りの子の宝物だった人形。割れ目から小さな火がこぼれ、二つの迷い火になって寄り添う。', trait: 'HP半分以下で2体の迷い火に分裂。' },
  E10: { id: 'E10', name: '渦走り', hp: 120, speed: 1.0, oil: 8, leak: 1, res: 0, armor: 0, fog: '中', desc: '渦潮を乗りこなしていた小さなイルカの影。急に明るくなると、びっくりして駆け出してしまう。', trait: '初めて照らされたとき2秒間速度+60%。' },
  E11: { id: 'E11', name: '鐘守りの亡霊', hp: 250, speed: 0.7, oil: 14, leak: 3, res: 0.25, armor: 0, fog: '高', shield: 100, desc: '鐘楼で最後まで鐘を鳴らしていた人。光の布をまとい、ひとりで夜を守ろうとしている。', trait: '光のシールド100。銛台・霧笛砲は半減、雷灯・大レンズは2倍。' },
  E12: { id: 'E12', name: '嵐の使い', hp: 180, speed: 0.8, oil: 12, leak: 2, res: 0.25, armor: 0, fog: '高', desc: '嵐を連れて歩く若い風の精。仲間の背中を押して走らせるのが得意だが、本人は少し寂しがり。', trait: '周囲2マスの味方の速度+30%。' },
  E13: { id: 'E13', name: '潮の巨兵', hp: 900, speed: 0.4, oil: 60, leak: 5, res: 0.40, armor: 6, fog: '高', stunImmune: true, desc: '大潮の夜に沈んだ見張り番。山のように大きく、足音で地面が揺れる。守りたかった人の名前を、ずっと探している。', trait: '固定軽減6。スタン無効。エリート。' }
};
var BOSSES = {
  B1: { id: 'B1', name: '霧の番人', hp: 800, speed: 0.45, armor: 3, oil: 80, leak: 10, res: 0.30, boss: true,
    desc: '岩礁に昔から立っている番人。迷いたちが灯台に近づきすぎないよう見張っているつもりだが、霧が濃すぎて、光まで隠してしまう。',
    trait: '「霧の外套」25秒ごとに全ライトの光半径-1.0(6秒間)。', intro: '「ここは通せない…霧が晴れたら、みんなどこへ行く…?」', outro: '「…ああ、見える。灯台の光だ。まだ、あったんだな。」' },
  B2: { id: 'B2', name: '難破船長ベルガー', hp: 2400, speed: 0.40, armor: 5, oil: 160, leak: 15, res: 0.30, boss: true,
    desc: '最後の航海で、灯台の光を見つけられなかった船長。今も船員を呼び集めようとして、霧の中に声を響かせている。',
    trait: '「呼び声」8秒ごとに迷い火2体。HP半分以下で速度-15%・装甲+2。', intro: '「灯りが…灯りが見えなかったんだ。あの夜、私は…」', outro: '「見えたよ。あれが港の灯りだ。みんな、帰ろう。」' },
  B3: { id: 'B3', name: '大潮の巨人ダイダ', hp: 2400, speed: 0.35, armor: 6, oil: 260, leak: 20, res: 0.40, boss: true,
    desc: '満潮に引き込まれた島の見張り番たちが、ひとつに固まってできた巨人。守るべき島をもう一度守りたくて、霧の中を歩いている。',
    trait: '「潮のうねり」20秒ごとに全敵が4秒間速度+40%。照らされていない間、毎秒最大HPの1%回復。', intro: '「島は…まだ、ここにあるか…?」', outro: '「ある…ちゃんと、ある。ありがとう。」' },
  B4: { id: 'B4', name: '忘れ鯨ナミダ', hp: 1900, speed: 0.30, armor: 6, oil: 500, leak: 20, res: 0.40, boss: true,
    desc: '百年前、灯台の灯が一晩だけ消えた夜に、迷子の船たちを背に乗せたまま帰り道を見失った大きな鯨。流れ続ける涙が、この海の霧になった。',
    trait: '第1形態(HP1900): 10秒ごとに全ライト光半径-0.5(最大-0.8)、15秒ごとに迷い火×5。第2形態(HP1800): 霧の子12体を送り返すと再び現れ、2つ以上のライトに同時に照らされているとき本来のダメージ(1つだけなら半分、光なしは無効)。',
    intro: '「ごめんね…ごめんね…みんなを、おうちに帰してあげられなくて…」', intro2: '「まだ…泣いていてもいい? 灯りが…あんまり、あたたかいから。」', outro: '「ありがとう…やっと、道が見える。」' }
};

/* ---------------- ステージ ---------------- */
function WV(s) { // "E01x3+E02x1" -> [{id,n}]
  return s.split('+').map(function (p) { var a = p.split('x'); return { id: a[0], n: +a[1] }; });
}
var STAGE_SRC = [
  { name: 'はじまりの夜', len: 22, slotsN: 11, oil: 150, hp: 1.0, oilM: 1.0, upkeepMul: 0, pal: 'std',
    paths: [{ id: 'A', pts: [[0, 4], [7, 4], [7, 10], [16, 10]] }],
    waves: ['E01x2', 'E01x2', 'E01x2', 'E01x3', 'E01x3', 'E02x1+E01x2'],
    gimmick: '濃霧度1.0(チュートリアル)' },
  { name: '桟橋の灯', len: 26, slotsN: 14, oil: 170, hp: 1.0, oilM: 1.0, upkeepMul: 0, pal: 'moon', sel: 'alt',
    paths: [{ id: 'A', pts: [[5, 0], [5, 5], [12, 5], [12, 10], [21, 10]] }, { id: 'B', pts: [[0, 8], [6, 8], [6, 12], [9, 12], [9, 10], [12, 10], [21, 10]] }],
    waves: ['E01x1+E03x1', 'E03x2', 'E03x2', 'E03x2+E01x1', 'E03x2+E01x1', 'E01x1+E03x2', 'E01x2+E03x2', 'E02x1+E03x3'],
    gimmick: '合流路。2つの入口から交互に敵が出る。' },
  { name: '霧の浅瀬', len: 28, slotsN: 14, oil: 180, hp: 1.15, oilM: 1.1, upkeepMul: 0.5, pal: 'std', fogWaves: { 4: 0.8, 7: 0.8 },
    paths: [{ id: 'A', pts: [[0, 3], [10, 3], [10, 8], [16, 8], [16, 11], [20, 11]] }],
    waves: ['E02x1+E03x2', 'E03x3', 'E03x3', 'E03x4', 'E03x4', 'E05x1+E03x3', 'E05x1+E03x3', 'E05x1+E03x6'],
    gimmick: '濃霧の波。第4・7波は光半径が20%小さくなる。' },
  { name: '番人の岩礁', len: 30, slotsN: 16, oil: 200, hp: 1.3, oilM: 1.2, upkeepMul: 0.7, special: [[12.5, 4.5, 'rock'], [12.5, 8.5, 'rock'], [8.5, 4.5, 'rock'], [15.5, 1.5, 'rock']], pal: 'std',
    paths: [{ id: 'A', pts: [[0, 10], [14, 10], [14, 3], [7, 3], [7, 5]] }],
    waves: ['E01x3', 'E01x3', 'E01x3', 'E01x4', 'E01x4', 'E01x4', 'E01x4', 'E01x5', 'E04x1+E01x4', 'E01x3+B1x1'],
    gimmick: '岩礁スロット2つは光半径+0.5。ボスは25秒ごとに全ライトの光半径-1.0(6秒間)。' },
  { name: '沈んだ港', len: 32, slotsN: 18, oil: 220, hp: 1.4, oilM: 1.3, upkeepMul: 0.8, special: [[5.5, 1.5, 'sky'], [11.5, 2.5, 'sky'], [17, 2.5, 'sky']], pal: 'moon', air: [0, 1],
    paths: [{ id: 'A', pts: [[0, 12.5], [10, 12.5], [10, 4], [23, 4]] }],

    waves: ['E03x3', 'E03x3', 'E03x3', 'E06x1+E03x3', 'E03x4', 'E03x4', 'E03x6', 'E03x7', 'E06x1+E03x5', 'E06x1+E03x7'],
    gimmick: '飛行ルートの直線上にスロット2つが並ぶ。' },
  { name: '鐘の丘', len: 34, slotsN: 18, oil: 240, hp: 1.3, oilM: 1.4, upkeepMul: 0.9, special: [[1, 3.5, 'sky'], [2, 5, 'sky'], [3, 7, 'sky']], pal: 'std', air: [0, 1], bell: true,
    paths: [{ id: 'A', pts: [[0, 2], [15, 2], [15, 9.5], [4, 9.5]] }],
    waves: ['E01x4', 'E02x2+E01x2', 'E02x1+E01x3', 'E07x1+E01x4', 'E07x1+E01x4', 'E06x1+E01x4', 'E06x1+E01x4', 'E04x1+E01x5', 'E04x1+E01x5', 'E01x8+E02x1', 'E01x8+E02x2', 'E02x3+E07x1+E06x1+E01x2'],
    gimmick: '古い鐘: 1波に1回、40油で鳴らすと全敵の速度が30%落ちる(5秒間)。' },
  { name: '分かれ潮', len: 34, slotsN: 20, oil: 260, hp: 1.65, oilM: 1.5, upkeepMul: 1, special: [[2, 5.2, 'prime'], [2, 8.8, 'prime'], [5.5, 7, 'prime']], pal: 'moon', sel: 'alt',
    paths: [{ id: 'L', pts: [[0, 7], [4, 7], [4, 1], [20, 1], [20, 7], [21.5, 7]] }, { id: 'R', pts: [[0, 7], [4, 7], [4, 11], [17, 11], [17, 7], [21.5, 7]] }],

    waves: ['E03x4', 'E03x5', 'E03x5', 'E03x6', 'E03x6', 'E07x1+E03x4', 'E07x1+E03x4', 'E04x1+E03x5', 'E04x1+E03x6', 'E08x1+E03x6', 'E08x1+E03x8', 'E03x17+E07x1'],
    gimmick: '分かれ潮。敵は50%ずつ左右に分かれる。分岐前の特等席スロットがある。' },
  { name: '難破船の墓場', len: 36, slotsN: 20, oil: 280, hp: 1.85, oilM: 1.6, upkeepMul: 1, special: [[3, 6.5, 'wreck'], [4.5, 3.5, 'wreck'], [2, 3.5, 'wreck'], [7.5, 10, 'wreck'], [10.5, 10, 'wreck']], pal: 'std',
    paths: [{ id: 'A', pts: [[0, 2], [6, 2], [6, 5], [1.5, 5], [1.5, 8.5], [9, 8.5], [9, 11.5], [17, 11.5]] }],
    waves: ['E01x4', 'E02x2+E01x2', 'E02x1+E01x3', 'E09x1+E01x4', 'E09x1+E01x4', 'E01x7', 'E01x8', 'E04x1+E01x4+E02x1', 'E04x1+E01x5+E02x1', 'E01x11+E02x2', 'E01x13+E02x2', 'E02x2+E01x5+B2x1'],
    gimmick: '沈没船スロット3つ(光半径+1.0。ただし油汲みは置けない)。' },
  { name: '嵐の岬', len: 36, slotsN: 22, oil: 300, hp: 1.55, oilM: 1.7, upkeepMul: 1, special: [[3, 4.5, 'sky'], [5.5, 6, 'sky'], [8.5, 8, 'sky']], pal: 'storm', air: [0, 1.5], storm: [4, 8, 12],
    paths: [{ id: 'A', pts: [[0, 3], [20, 3], [20, 10.5], [11.5, 10.5]] }],
    waves: ['E03x5', 'E10x1+E03x4', 'E10x1+E03x4', 'E03x6', 'E03x6', 'E06x1+E03x5', 'E06x2+E03x4', 'E09x1+E03x6', 'E09x1+E03x7', 'E03x10+E10x1', 'E03x12+E10x1', 'E10x2+E06x1+E03x6', 'E10x2+E12x1+E06x1+E03x4', 'E12x1+E06x2+E03x12'],
    gimmick: '嵐。第4・8・12波は敵速度+20%、光半径-10%、撃破油+30%。' },
  { name: '巨人の潮路', len: 38, slotsN: 22, oil: 320, hp: 1.75, oilM: 1.8, upkeepMul: 1, pal: 'std', tide: true,
    paths: [{ id: 'L', pts: [[0, 2.5], [17, 2.5], [17, 6], [5, 6], [5, 10], [6.5, 10]] }, { id: 'S', pts: [[23.5, 9], [17, 9], [17, 6], [5, 6], [5, 10], [6.5, 10]] }],
    waves: ['E01x5', 'E04x1+E01x4', 'E04x1+E01x4', 'E01x7', 'E01x7', 'E10x2+E01x4', 'E10x3+E01x3', 'E01x8+E04x1', 'E01x15', 'E01x13+E13x1', 'E01x16+E04x1', 'E04x2+E08x1+E10x1+E01x4', 'E04x1+E13x1+E08x1+E10x1+E01x6', 'E08x1+E10x1+E01x4+B3x1'],
    gimmick: '干潮。偶数波は近道が開き(経路-30%)、撃破油+15%。' },
  { name: '月のない夜', len: 38, slotsN: 22, oil: 340, hp: 2.0, oilM: 1.9, upkeepMul: 1, pal: 'dark', newMoon: true,
    paths: [{ id: 'A', pts: [[0, 3.5], [5, 3.5], [5, 10.5], [11, 10.5], [11, 3.5], [17, 3.5], [17, 10.5]] }],
    waves: ['E01x5', 'E01x5', 'E01x5', 'E07x1+E01x5', 'E07x1+E01x5', 'E12x1+E01x5', 'E12x1+E09x1+E01x4', 'E09x2+E01x5', 'E09x2+E01x5', 'E01x16', 'E01x11+E11x1', 'E11x1+E07x1+E01x10', 'E11x1+E07x2+E01x9', 'E07x4+E12x1+E09x1+E01x3', 'E07x4+E12x1+E09x1+E01x7'],
    gimmick: '新月。全ライトの光半径×0.85。代わりに全タワーの攻撃力+10%。' },
  { name: '霧の主', len: 40, slotsN: 24, oil: 460, hp: 1.45, oilM: 2.0, upkeepMul: 1, special: [[19.5, 1.5, 'sky'], [16, 1.5, 'sky'], [10.5, 4.5, 'sky']], pal: 'dawn', air: [23.5, 1], deepen: true,
    paths: [{ id: 'A', pts: [[0, 12], [19, 12], [19, 3], [8, 3], [8, 4]] }],
    waves: ['E03x6', 'E03x7', 'E03x7', 'E08x1+E03x6', 'E08x1+E03x6', 'E08x1+E03x6', 'E08x1+E03x6', 'E12x1+E06x2+E03x5', 'E12x1+E06x2+E03x5', 'E06x3+E03x10', 'E06x3+E03x14', 'E03x19+E11x1', 'E03x24+E11x1', 'E11x2+E03x18', 'E11x2+E03x23', 'E08x1+E06x1+E03x24+B4x1'],
    gimmick: '忘れ霧の深まり。波ごとに光半径-1.5%(最大-22%)。最終決戦。' }
];

/* ---------------- 文章 ---------------- */
var STORY = {
  intro: [
    [['ポウ', '今夜は霧が出るよ。灯りを置いて、迷子たちを帰してあげよう。']],
    [['ポウ', '桟橋の向こうからも来てる! 二つの道があるね。']],
    [['ポウ', '浅瀬は霧が濃いよ。光が小さくなる波があるから気をつけて!']],
    [['ナギ', '…誰か、岩の上にいる。'], ['ポウ', '霧の番人だ。ずっとひとりで見張ってたんだよ。']],
    [['ポウ', '空を飛ぶ影が見える! 地面の道とは違うよ!']],
    [['ポウ', '丘の鐘…まだ鳴るかな? 鳴らすと、みんなゆっくりになるよ。']],
    [['ナギ', '道が二つに分かれてる…どっちに来るの?'], ['ポウ', '半分ずつ、かな。']],
    [['ポウ', '船長だ…お願い、ひどいことしないで…'], ['ナギ', 'しない。ちゃんと送るよ。']],
    [['ポウ', '嵐が来る…風の子が友達を連れてくるよ!']],
    [['ポウ', 'ナギ、足音が…すごく大きい。'], ['ナギ', '大丈夫。光があるから。']],
    [['ナギ', '月がない…こんなに暗いんだ。'], ['ポウ', 'ぼくも光るよ! ナギの隣で。']],
    [['ミオの手紙', 'ナギへ。最後まで灯りを絶やさないで。あなたの光は、ちゃんと海に届いている。']]
  ],
  outro: [
    [['ナギ', '…ほっとした顔だった。'], ['ポウ', 'そうだよ。迷いは悪いやつじゃないんだ。']],
    [['ナギ', 'ふたつの道が、ひとつになるところ…そこが大事みたい。']],
    [['ナギ', '濃い霧でも、光があれば見えるんだ。']],
    [['ナギ', 'ありがとう、番人さん。もう休んでいいんだよ。']],
    [['ナギ', '鴉は迷わないのに、どうして来るんだろう。'], ['ポウ', '灯りが好きなんだよ、きっと。']],
    [['ナギ', '古い鐘の音、あたたかかった。']],
    [['ナギ', 'どちらの道も、きっと家につながってる。']],
    [['ナギ', '船長さんの顔、笑ってた。'], ['ポウ', '港が見えたんだね。']],
    [['ナギ', '寂しかったんだね。また来てもいいよ。']],
    [['ナギ', '大きくても、泣いていた。']],
    [['ナギ', '暗い夜でも、灯りは灯せる。']],
    [['ナギ', 'ありがとう、ナミダ。朝が来るよ。']]
  ],
  clearLines: ['やったね!', '今夜も灯台は無事だ!', 'みんな、おうちに帰れたかな。', '光が届いてよかった。', 'ナギの灯り、日に日に強くなってる気がする!'],
  loseLines: ['大丈夫、灯りはまた灯せる。もう一回やってみよう。', '今夜はだめだった…でも、朝までまだあるよ。', 'みんな、まだ待ってるよ。'],
  waveLines: ['霧の向こうから、足音が聞こえる…', 'また誰かが帰り道を探している。', '灯りを絶やさないで。', '波の音が、少し近くなった。', 'ポウが小さく震えている。'],
  lastWave: 'これが最後の波。みんな、帰ろう。',
  diary: [
    '祖母の字で書かれている。「霧の夜は、光を絶やさないこと。それだけ守ればいい。」',
    '桟橋に、古い漁師の帽子が一つ落ちていた。持ち主はまだ見つかっていない。',
    '浅瀬の霧は濃い。ぐらげは光を嫌うが、ほんの少し照らしてやればいい。',
    '番人は岩礁にずっと立っていた。ひとりで、ずっと。',
    '沈んだ港の鐘が、一度だけ鳴った。ポウが「しーっ」と言った。',
    '鐘の丘に、昔の灯台守が置いた古い鐘があった。ひとつだけ、まだ鳴る。',
    '潮が分かれるところでは、迷いたちはどちらの道も選べずに立ち止まる。',
    'ベルガー船長の名前は、祖母の古い日誌にもあった。「最後に見送れなかった船」と。',
    '嵐の使いは、友達がほしくて仲間を連れてくる。祖母がそう書いていた。',
    '巨人の足音で、灯台が少しだけ揺れた。ポウが震えていた。わたしも少し、こわかった。',
    '新月の夜は、光がいちばん遠くまで届かない。だから、いちばん大切に灯す。',
    '朝が来た。霧のない海は、思っていたよりずっと広かった。'
  ],
  letters: { 6: 'ナギへ。灯台は順調?腰が治ったら、ふたりでお茶をしましょう。', 12: 'ナギへ。ポウは元気かしら。あの子はおしゃべりだけど、とてもやさしいのよ。', 24: 'ナギへ。霧のことを調べました。霧の正体は、悲しみではないと思うの。', 36: 'ナギへ。あなたは立派な灯台守です。灯台は、あなたの灯りで輝いています。' },
  terms: [
    ['忘れ霧', '帰れなかった人たちの気持ちが海の上に残り、霧になったもの。濃い夜ほど、迷いたちがよく歩く。'],
    ['迷い', '忘れ霧の中をさまよう、帰り道を探す気持ちのかたち。悪いものではない。'],
    ['光半径', 'ライトが照らせる円の大きさ。大きいほど、霧の中の迷いを見つけやすい。'],
    ['照らされ', '光に当たった迷いは、少しだけ安心してゆっくりになり、帰り道を思い出しやすくなる。'],
    ['油', '送り返された気持ちがやさしい光の粒になって、灯台に戻ってきたもの。'],
    ['灯台守', '灯台を預かり、夜通し灯りを守る人。ナギの祖母もそうだった。'],
    ['ポウ', '灯台に住む小さな灯りの精。自分でも何歳か覚えていない。'],
    ['相性', '近く(2.3マス以内)に置いた塔どうしが、お互いを助け合うこと。照準・凍てつく鐘・霜雷・ともし火・汲み置きの5種類がある。'],
    ['維持費・休灯', 'ライトを灯し続けるための油。波が始まるたびに支払う。油が足りないとその波のあいだ灯りが消える。「休灯」で自分から休ませることもできる。'],
    ['対策札', '次の波の予告を見て選ぶ、1回きりの工夫。霧払い・足止め・一点集中などがある。'],
    ['潮門', '複数の道があるステージで、次の波の敵がどの道を通るか選ぶしくみ。片側に集めると撃破油が1割増える。'],
    ['鏡の向き', '反射鏡は8方向の扇形に光を届ける。扇の外のライトには効かない。'],
    ['強化の分岐', 'Lv2の灯火台・銛台・霧笛砲・氷灯・雷灯は、Lv3で2つの道から選べる。'],
    ['みおつくし灯台', 'アカリ島の岬に立つ灯台。「みおつくし」とは、船に水路を教える目印のこと。']
  ],
  gallery: [
    ['ナギ', '14歳。見習い灯台守。口数は少ないが、責任感が強い。祖母から灯台を預かったばかり。'],
    ['ミオ', 'ナギの祖母。先代の灯台守。腰を痛めて本島で療養中。手紙とメモで孫を支えている。'],
    ['ポウ', '灯台に住む小さな灯りの精。おしゃべりでおっちょこちょい。ナギの相棒。'],
    ['ナミダ', '霧の主。昔、灯台の光を頼りに回遊していた大きな鯨。流れ続ける涙が霧になった。']
  ],
  tutorial: [
    ['光る四角をタップして、灯りを置く場所を選ぼう。', 'slot'],
    ['灯火台を置こう。光の輪の中だけ、霧の中が見えるよ。', 'buildT1'],
    ['「はじめる」を押してね。', 'start'],
    ['光に入ると見えて、ゆっくりになるよ。', 'lit'],
    ['送り返すと油がふえる。灯りを強化してみよう。', 'upgrade']
  ],
  hints: {
    flash: 'ポウ「見えなくなった敵は「ひと灯り」で一瞬だけ照らせるよ。ボタンを押して、盤面をタップ。45秒ごとに使えるよ。」',
    card: 'ポウ「波の前に「対策札」を1枚選べるよ。右上の予告パネルを開いてね。選ばなくてもいいよ。」',
    syn: 'ポウ「近く(2.3マス)に置いた塔どうしは「相性」で助け合うよ。置く前に点線で見えるよ!」',
    route: 'ポウ「潮門は、波の前に敵の通り道を選べるよ。片方に集めると油が1割ふえるけど、守りも片側に寄せてね!」',
    s2: 'ポウ「霧笛砲は、まとまった迷いを一度に静かにさせるよ。でも空を飛ぶ鴉には当たらないから、覚えておいて!」',
    upkeep: 'ポウ「光を保つにも油がいるよ。波が始まるたびに、ライトごとに維持費がかかるんだ。今いらない灯りは「休灯」で節約できるよ。」',
    s3: 'ポウ「氷灯は、迷いを遅くしてくれるよ。ほかの塔の弾が当たる時間が増えるんだ!」',
    E05: 'ポウ「霧ぐらげは光が苦手だけど、光に溶け込んで、あまり弱くならないんだ。減速や銛台で対応してね!」',
    s4: 'ポウ「油汲みは、波が始まるたびに油をくれるよ。早く置くほど、あとで得をするんだ!」',
    B1: 'ポウ「番人は定期的に光を弱めるよ! 一つのライトに頼らず、いくつかの光を置こう!」',
    s5: 'ポウ「反射鏡は、近くの灯りの光の輪を広げてくれる。攻撃はしないけど、頼りになるよ!」',
    E06: 'ポウ「鴉は、道を通らずにまっすぐ灯台へ向かうよ。光の通り道に塔を置いて!」',
    E07: 'ポウ「灯消しは近くの光を小さくしちゃう。真っ先に銛台で送り返そう!」',
    bell: 'ポウ「丘の鐘を鳴らすと、迷いがみんなゆっくりになるよ。40油で1波に1回だけ!」',
    mirror: 'ポウ「反射鏡には向きがあるよ。扇のなかのライトだけ光が広がる。「回す」ボタンで合わせてね!」',
    branch: 'ポウ「Lv2の塔は、Lv3で2つの道から選べるよ。選ぶと変えられないから、よく考えて!」',
    s7: 'ポウ「雷灯は雷のように飛びうつる攻撃だよ。たくさんの迷いが並んでいるときに強いんだ!」',
    E08: 'ポウ「潮喰いは、暗がりで回復するよ。光を切らさないようにね!」',
    E09: 'ポウ「割れ人形は、半分になると二つに分かれるよ。範囲攻撃が頼りになるね!」',
    s9: 'ポウ「大レンズは、光線で一直線の迷いをまとめて照らすんだ。長い一本道に置いてみて!」',
    storm: 'ポウ「嵐の波は、風が速いから油もたくさん落とすよ。慌てず、氷灯で足止めしよう!」',
    tide: 'ポウ「偶数の波は、潮が引いて近道が開くよ。着くのが早いから気をつけて!」',
    E11: 'ポウ「亡霊の光のシールドには、雷灯と大レンズが効くよ。ほかの塔は力が半分になっちゃう!」',
    moon: 'ポウ「新月の夜は光が小さくなるけど、そのぶん塔の力が強くなるよ!」',
    s12: 'ポウ「ここが最後の夜だよ。ぼく、ずっときみといっしょにいるからね。」'
  },
  achievements: [
    ['A01', 'はじめの一灯', '第1面をクリア'], ['A02', '見えた!', '初めて敵を光の中で送り返す'], ['A03', '油の味', '累計1,000油を獲得'],
    ['A04', '灯台の主', '全12面をクリア'], ['A05', '星あつめ', '星の合計を36にする'], ['A06', '番人を送る', '霧の番人を送り返す'],
    ['A07', '船長を送る', '難破船長ベルガーを送り返す'], ['A08', '巨人を送る', '大潮の巨人ダイダを送り返す'], ['A09', '鯨を送る', '忘れ鯨ナミダを送り返す'],
    ['A10', '無傷の夜', 'いずれかの面を灯台HP20でクリア'], ['A11', '完全無欠', '全12面を無傷でクリア'], ['A12', '倹約家', '初期油以上の油を残してクリア'],
    ['A13', 'ポンプ職人', '1ステージで油汲みを3基Lv3にする'], ['A14', '光の演出家', '光半径の合計が20マスを超える'], ['A15', '氷の息吹', '氷灯の凍結を累計100回発動'],
    ['A16', '雷の道', '雷灯の連鎖で1回に5体を攻撃'], ['A17', '光線の通り道', '大レンズの光線で1度に10体以上を貫く'], ['A18', '早起き', '次の波を早く呼ぶを累計50回'],
    ['A19', '図鑑コンプリート', '図鑑のタワー・敵・ボスを全て記録'], ['A20', 'ポウの友達', '全ステージでポウの会話を聞く']
  ]
};

/* ---------------- バランス・定数 ---------------- */
var BALANCE = {
  DT: 1 / 60, hpLife: 20, litSlow: 0.10, litExpose: 0.15, strongSlow: 0.15, strongExpose: 0.25,
  afterimage: 1.0, minArmorFrac: 0.25, minArmorFracBoss: 0.20, sellRate: 0.7, sellFullSec: 10, earlyOil: 5,
  waveGap: 10, spawnGap: 1.0, baseLight: 1.6, pumpMax: 3, bellCost: 40, bellSlow: 0.3, bellTime: 5,
  chainDist: 1.5, chainFalloff: 0.7, beamWidth: 0.35, beamRot: Math.PI / 3, beamIv: 0.25,
  minSpeedFrac: 0.15, whaleMinusMax: 0.8, synR: 2.3, synIv: 0.9, synBlast: 1.25, synChainD: 0.4, synLight: 0.3, mirrorGain: 1.5, mirrorRelay: 0.6, routeOil: 1.1, cardAtk: 1.12, flashCd: 45, flashDur: 5, flashR: 2.5, cardOil8: 5, cardLight: 0.3, cardSlow: 0.92, cardAir: 1.25, cardRange: 0.3, whaleP1: 1900, whaleP2: 1800, whaleSingleLight: 0.5, tileSize: 40, boardW: W, boardH: H
};

/* ---------------- 幾何ユーティリティ & スロット自動生成 ---------------- */
function segDist(px, py, ax, ay, bx, by) {
  var dx = bx - ax, dy = by - ay, l2 = dx * dx + dy * dy, t = l2 ? ((px - ax) * dx + (py - ay) * dy) / l2 : 0;
  t = t < 0 ? 0 : t > 1 ? 1 : t; var qx = ax + dx * t, qy = ay + dy * t; return Math.hypot(px - qx, py - qy);
}
function pathLen(pts) { var s = 0; for (var i = 1; i < pts.length; i++) s += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]); return s; }
function sample(pts, step) {
  var out = [], i, a, b, l, n, k;
  for (i = 1; i < pts.length; i++) {
    a = pts[i - 1]; b = pts[i]; l = Math.hypot(b[0] - a[0], b[1] - a[1]); n = Math.max(1, Math.round(l / step));
    for (k = 0; k < n; k++) out.push([a[0] + (b[0] - a[0]) * k / n, a[1] + (b[1] - a[1]) * k / n, -(b[1] - a[1]) / l, (b[0] - a[0]) / l]);
  }
  out.push([pts[pts.length - 1][0], pts[pts.length - 1][1], 0, 0]); return out;
}
function genSlots(st) {
  var base = st.base, minD = 1.35, covR = 2.6, i, j, cand = [], chosen = [], paths = st.paths;
  var dense = []; paths.forEach(function (p) { dense = dense.concat(sample(p.pts, 0.25)); });
  function dPath(x, y) { var m = 99; paths.forEach(function (p) { for (var q = 1; q < p.pts.length; q++) { var d = segDist(x, y, p.pts[q - 1][0], p.pts[q - 1][1], p.pts[q][0], p.pts[q][1]); if (d < m) m = d; } }); return m; }
  function cover(x, y) { var c = 0; for (var q = 0; q < dense.length; q++) if (Math.hypot(dense[q][0] - x, dense[q][1] - y) <= covR) c++; return c * 0.25; }
  paths.forEach(function (p) {
    sample(p.pts, 0.5).forEach(function (sp) { if (!sp[2] && !sp[3]) return; [1.5, -1.5, 2.5, -2.5, 3.5, -3.5].forEach(function (o) {
      var x = Math.round((sp[0] + sp[2] * o) * 2) / 2, y = Math.round((sp[1] + sp[3] * o) * 2) / 2;
      if (x < 0.9 || x > W - 0.9 || y < 0.9 || y > H - 0.9) return;
      if (dPath(x, y) < minD) return; if (Math.hypot(x - base.x, y - base.y) < 1.2) return;
      for (var q = 0; q < cand.length; q++) if (cand[q].x === x && cand[q].y === y) return;
      cand.push({ x: x, y: y, cov: cover(x, y) });
    }); });
  });
  st.special.forEach(function (e) { chosen.push({ x: e[0], y: e[1], kind: e[2] }); });
  while (chosen.length < st.slotsN && cand.length) {
    var best = -1, bs = -1e9;
    for (i = 0; i < cand.length; i++) {
      var c = cand[i], dn = 99, ok = true;
      for (j = 0; j < chosen.length; j++) { var d = Math.hypot(c.x - chosen[j].x, c.y - chosen[j].y); if (d < 1.5) { ok = false; break; } if (d < dn) dn = d; }
      if (!ok) continue; var sc = c.cov + 0.8 * Math.min(dn, 5); if (sc > bs) { bs = sc; best = i; }
    }
    if (best < 0) break; chosen.push({ x: cand[best].x, y: cand[best].y, kind: 'land' }); cand.splice(best, 1);
  }
  return chosen.map(function (c, idx) {
    var o = { id: idx, x: c.x, y: c.y, bonus: 0, noPump: false, kind: c.kind };
    if (c.kind === 'rock') o.bonus = 0.5; if (c.kind === 'wreck') { o.bonus = 1.0; o.noPump = true; }
    return o;
  });
}
function checkSlots(stages) {
  var errs = [];
  stages.forEach(function (st) {
    if (st.slots.length !== st.slotsN) errs.push('stage' + st.id + ' 数 ' + st.slots.length + '/' + st.slotsN);
    st.slots.forEach(function (a, i) {
      if (a.x < 0.9 || a.x > W - 0.9 || a.y < 0.9 || a.y > H - 0.9) errs.push('stage' + st.id + ' slot' + i + ' 盤面外');
      var m = 99; st.paths.forEach(function (p) { for (var q = 1; q < p.pts.length; q++) m = Math.min(m, segDist(a.x, a.y, p.pts[q - 1][0], p.pts[q - 1][1], p.pts[q][0], p.pts[q][1])); });
      if (m < 1.3) errs.push('stage' + st.id + ' slot' + i + ' 道に近い ' + m.toFixed(2));
      if (Math.hypot(a.x - st.base.x, a.y - st.base.y) < 1.2) errs.push('stage' + st.id + ' slot' + i + ' 灯台に近い');
      for (var j = i + 1; j < st.slots.length; j++) if (Math.hypot(a.x - st.slots[j].x, a.y - st.slots[j].y) < 1.45) errs.push('stage' + st.id + ' slot' + i + '-' + j + ' 間隔');
    });
  });
  return errs;
}

var STAGES = STAGE_SRC.map(function (s, i) {
  var id = i + 1;
  var st = { id: id, name: s.name, len: s.len, slotsN: s.slotsN, oil: s.oil, hpMul: s.hp, oilMul: s.oilM, pal: s.pal,
    paths: s.paths, special: s.special || [], upkeepMul: s.upkeepMul, sel: s.sel || null,
    air: s.air ? { x: s.air[0], y: s.air[1] } : null, fogWaves: s.fogWaves || null, storm: s.storm || null, tide: !!s.tide,
    newMoon: !!s.newMoon, deepen: !!s.deepen, bell: !!s.bell, gimmick: s.gimmick,
    waveBonus: 15 + 3 * id, waves: s.waves.map(WV), waveSrc: s.waves };
  var lp = s.paths[s.paths.length - 1].pts; st.base = { x: lp[lp.length - 1][0], y: lp[lp.length - 1][1] };
  st.pathLens = s.paths.map(function (p) { return Math.round(pathLen(p.pts) * 10) / 10; });
  st.slots = genSlots(st);
  var seen = {}, boss = null; st.waves.forEach(function (w) { w.forEach(function (g) { seen[g.id] = 1; if (g.id[0] === 'B') boss = g.id; }); });
  st.enemyIds = Object.keys(seen).sort(); st.boss = boss;
  st.towers = TOWER_ORDER.filter(function (t) { return TOWERS[t].unlock <= id; });
  st.newTowers = TOWER_ORDER.filter(function (t) { return TOWERS[t].unlock === id; });
  var first = {}; for (var k = 0; k < i; k++) STAGE_SRC[k].waves.join('+').split(/[+,]/).forEach(function (p) { first[p.split('x')[0]] = 1; });
  st.newEnemies = st.enemyIds.filter(function (e) { return !first[e]; });
  st.intro = STORY.intro[i]; st.outro = STORY.outro[i]; st.diary = STORY.diary[i];
  return st;
});

/* 05改修後の難度調整値(sim.js autotune.js の結果): [敵HP倍率, ボスHP倍率] */
var TUNE = { 2: [2.0, 1.7], 3: [1.15, 1], 4: [2.08, 1.0], 5: [1.67, 1.18], 6: [1.64, 1.19], 7: [1.35, 0.89], 8: [2.42, 0.96], 9: [1.0, 1.0], 10: [2.43, 1.11], 11: [2.0, 0.8], 12: [2.48, 1.11] };
STAGES.forEach(function (st) { var t = TUNE[st.id]; if (t) { st.hpMul = t[0]; st.bossMul = t[1]; } });
var SYN = [
  { bit: 1, recv: 'T2', from: 'T1', name: '照準', desc: '銛台の攻撃間隔×0.9(連射+11%)' },
  { bit: 2, recv: 'T3', from: 'T4', name: '凍てつく鐘', desc: '減速中の敵への爆風ダメージ×1.25' },
  { bit: 4, recv: 'T5', from: 'T4', name: '霜雷', desc: '連鎖数+1・連鎖距離+0.4' },
  { bit: 8, recv: 'T1', from: 'T1', name: 'ともし火', desc: '光半径+0.3' },
  { bit: 16, recv: '*light', from: 'T7', name: '汲み置き', desc: '維持費-1(最低1)' }
];
var CARDS = {
  C1: { name: '霧払い', desc: '全ライトの光半径+0.3', min: 3 },
  C2: { name: '足止め', desc: '全敵の速度×0.92', min: 1 },
  C3: { name: '一点集中', desc: '銛台・雷灯の攻撃×1.12', min: 1 },
  C4: { name: '群れ払い', desc: '霧笛砲・大レンズの攻撃×1.12(爆風+0.15)', min: 2 },
  C5: { name: '空見の灯', desc: '飛行敵への被ダメ×1.25・灯火台/氷灯の射程+0.3', min: 5 },
  C6: { name: '節油の夜', desc: '次の波の維持費が0', min: 3 },
  C7: { name: '恵みの油', desc: '撃破油×1.3(敵HP×1.1)', min: 3 },
  C8: { name: '備え', desc: 'すぐ油+5', min: 1 }
};
var DATA = { SYN: SYN, CARDS: CARDS, checkSlots: checkSlots, W: W, H: H, TOWERS: TOWERS, TOWER_ORDER: TOWER_ORDER, ENEMIES: ENEMIES, BOSSES: BOSSES, STAGES: STAGES, STORY: STORY, BALANCE: BALANCE,
  geom: { segDist: segDist, pathLen: pathLen, sample: sample },
  PALETTES: {
    std: { sky0: '#3b3f8f', sky1: '#8e86d6', sea0: '#4f6fc2', sea1: '#3c56a8', sea2: '#7fa4e6', wave: '#b5ccff', fog: '#c4cff5', fogD: '#8f9fd8', cloud: '#e8e0ff', acc: '#ffc4b5', land: '#5b66ae' },
    moon: { sky0: '#3a4f9a', sky1: '#8fb2e8', sea0: '#4f84c8', sea1: '#3c68ae', sea2: '#86c0ef', wave: '#cbe6ff', fog: '#d4e4fa', fogD: '#9bb4dc', cloud: '#f1f6ff', acc: '#fff3b0', land: '#5a76b4' },
    storm: { sky0: '#2e3270', sky1: '#6a6fb4', sea0: '#3f58a0', sea1: '#2f4688', sea2: '#6a86c8', wave: '#9fb2ec', fog: '#aab4dc', fogD: '#7480b4', cloud: '#c9c6ec', acc: '#d7c6ff', land: '#4c5498' },
    dark: { sky0: '#262a64', sky1: '#565c9e', sea0: '#364a90', sea1: '#283878', sea2: '#5870b4', wave: '#8a9ede', fog: '#9aa3d2', fogD: '#646ea8', cloud: '#b4b4e0', acc: '#c4b6ff', land: '#444c92' },
    dawn: { sky0: '#6a63b4', sky1: '#ffb9b0', sea0: '#6a8ad0', sea1: '#5072b8', sea2: '#9fb4ee', wave: '#ffd8cf', fog: '#ecd7ee', fogD: '#c4a8cc', cloud: '#fff0ec', acc: '#ffe3a0', land: '#7a74bc' }
  }
};
if (typeof module !== 'undefined' && module.exports) module.exports = DATA;
else { root.Fog = root.Fog || {}; root.Fog.DATA = DATA; }
})(typeof window !== 'undefined' ? window : this);
