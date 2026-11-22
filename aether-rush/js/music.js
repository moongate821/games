// BGMの曲表(6.音楽 の Gemini 制作曲から選んだ12曲。素材制作\make_music.py が assets/music/bgm_NN.mp3 を作る)
export const TRACKS = [
  { file: 'assets/music/bgm_00.mp3', title: 'ナイトレーサー・ハート', genre: 'EUROBEAT' },
  { file: 'assets/music/bgm_01.mp3', title: 'ネオン・ライン・ブレイカー', genre: 'EDM' },
  { file: 'assets/music/bgm_02.mp3', title: 'スパークリング・ハイウェイ', genre: 'EUROBEAT' },
  { file: 'assets/music/bgm_03.mp3', title: 'ターミナル・ベロシティ', genre: 'EDM' },
  { file: 'assets/music/bgm_04.mp3', title: 'ギャラクシー・ターボ', genre: 'EUROBEAT' },
  { file: 'assets/music/bgm_05.mp3', title: 'スターダスト・ドライブ', genre: 'EDM' },
  { file: 'assets/music/bgm_06.mp3', title: 'ムーンライト・グランプリ', genre: 'EUROBEAT' },
  { file: 'assets/music/bgm_07.mp3', title: 'サイレン・ブラスト', genre: 'EDM' },
  { file: 'assets/music/bgm_08.mp3', title: 'エターナル・スピードスター', genre: 'EUROBEAT' },
  { file: 'assets/music/bgm_09.mp3', title: 'ソニック・ブルーム', genre: 'EDM' },
  { file: 'assets/music/bgm_10.mp3', title: 'ファイナル・ラップ・ガール', genre: 'EUROBEAT' },
  { file: 'assets/music/bgm_11.mp3', title: 'オーロラ・オーバードライブ', genre: 'EDM' },
];
// コースの雰囲気ごとの曲の候補(都市=速くて派手、峡谷=ターボ系、氷=きらめく系)。最終コース(20番)だけ「ファイナル・ラップ・ガール」
const POOL = { city: [1, 2, 3, 7, 9], canyon: [4, 6, 8, 10, 0], ice: [11, 5, 6, 9, 2] };
export function trackFor(ci, style) {
  if (ci === 19) return TRACKS[10];
  const p = POOL[style] || POOL.city;
  return TRACKS[p[ci % p.length]];
}
export const MENU_TRACK = TRACKS[0];
