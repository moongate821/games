/* ヒント(メニューの💡)。使うと時間が3すすむ。scenes のどこにいても、その謎のヒントが出る。 */
window.GAME.hints = [
  { scenes: ["hall"], text: "大きくなって鍵を取り、小さくなって扉へ。薬もケーキも、それぞれ2口まで。順番を、あたまの中で組み立てて。" },
  { scenes: ["crossroads", "crossroads_signs"], text: "三枚のうち本当は一枚だけ。「この一枚が本当なら」と一枚ずつ仮定して、残りの二枚が嘘になるか、道が一通りに決まるかを確かめて。" },
  { scenes: ["caterpillar", "cq1", "cq2", "cq3", "cat_angry"], text: "持ち物を、もう一度、よく見て。帳簿(川岸)の差額の欄と、懐中時計の裏蓋の刻みが、答えになる。" },
  { scenes: ["mushroom"], text: "札は三枚とも嘘。イモムシの助言は「赤い傘は何かを起こす」。赤は「何も起きない」ではないし、札の「伸びる」でもない。残りを考えて。" },
  { scenes: ["pigeon", "pigeon_wrong"], text: "「卵を食べるものは蛇」でも、「卵を食べるものは、みな蛇」とは限らない。逆は、いつも正しいとは限らない。" },
  { scenes: ["cheshire", "cheshire_q", "cheshire_wrong"], text: "猫は犬の逆。犬は怒ると唸り、喜ぶと尾を振る。では、猫が尾を振っているのは?" },
  { scenes: ["dodo_prize", "dodo_wrong"], text: "十七個を、六人で、同じ数ずつ分ける。配りきったあとに、残るのは?" },
  { scenes: ["tea_seats", "tea_seat_wrong"], text: "三杯で、全員が三つ進む。帽子屋は一番から四番へ。その「ひとつ手前」は三番。三つ戻した席が、最初の席。" },
  { scenes: ["tea_raven", "tea_raven_wrong"], text: "答えは、ことばの裏にある。「書きつけるもの」と、もうひとつの意味。どちらも、とても平べったい。" },
  { scenes: ["tea_dormouse", "tea_dm_wrong"], text: "「ま」ではじまる四つ。空にあるもの、壁にあるもの、道に迷った子、眠るときに頭をのせるもの。" },
  { scenes: ["tea", "hatter_time"], text: "席・カラス・ヤマネのうち、二つ解けば、帽子屋が時計を見てくれる。裏蓋の小さな穴には、細い柄のものを。" },
  { scenes: ["croquet", "croquet_count", "croquet_count_wrong"], text: "一列目は一人、二列目は二人、……九列目は九人。足すと?" },
  { scenes: ["croquet_hoop", "croquet_hoop_wrong"], text: "条件を、ひとつずつ使って、並びを消していく。「青は緑のすぐ前」が決め手。" },
  { scenes: ["queen_talk", "queen_hmm"], text: "女王に、「いいえ」と言ってはいけない。ほめるか、はぐらかすか。" },
  { scenes: ["school", "school_lesson", "school_lesson_wrong"], text: "順番に、ひとつずつ。7から3を引く。それを2倍に。それを4で割る。" },
  { scenes: ["school_dance", "school_dance_wrong"], text: "Eは最後。BCは続けて、Bが先。AはBより前。Dは先頭でなく、Cの隣でもない。条件を全部。" },
  { scenes: ["maze", "m1", "m2", "m3", "m4", "m5", "m6", "maze_wrong"], text: "穴の途中の地図の言葉を思い出して。鳩と猫は、チェシャ猫が教えてくれた「翼」と「耳」のこと。メモ帳に、書いておけば。(白いキノコで背が伸びれば、上から見える)" },
  { scenes: ["court", "court_ledger", "court_wit", "court_wit_wrong", "court_verse", "court_verse_wrong", "court_shelf"], text: "四つの証拠のうち三つがそろえば、女王を告発できる。帳簿の数字、証人の嘘つきさがし、詩の頭文字、棚(体が大きければ届く)。" },
  { scenes: ["court_testify", "court_accuse"], text: "女王の庭で「許し」をもらっていないと、口を開いた途端に首が飛ぶ。真の結末には、時計の紙片と庭の手紙も要る。" },
  { scenes: ["six_talk", "six_a", "six_b"], text: "「ごめんなさい」を繰り返すより、庭の手紙に書いてあったことを、言葉に。" }
];
