// redesign.js — 資料の4機を、車輪・外装・操縦席が分かれた新しい立体として組み直す。
// 既存の走行性能や操作は変えず、プレイヤー・AI・遠景の見た目だけを差し替える。
function bikePanel(m, side, pts, k) {
  const q = m.v.length;
  for (const [x, y, z] of pts) addV(m, side * x, y, z);
  m.f.push({ i: side > 0 ? pts.map((_, i) => q + i) : pts.map((_, i) => q + pts.length - 1 - i), k });
}
function wheelAccent(m, z, cy, r, halfW, n, glow) {
  for (const side of [-1, 1]) {
    const x = side * (halfW + 4), first = m.v.length;
    for (let i = 0; i < n; i++) {
      const a = i * Math.PI * 2 / n;
      addV(m, x, cy + Math.sin(a) * r, z + Math.cos(a) * r);
    }
    for (let i = 0; i < n; i++) m.l.push([first + i, first + (i + 1) % n, glow ? 'glow' : 'chrome']);
  }
}
function sculptKAI() {
  const m = Mesh();
  addWheel(m, 0, 107, -252, 107, 104, 18, false, true, 'body');
  addWheel(m, 0, 101, 277, 101, 94, 18, false, true, 'body');
  wheelAccent(m, -252, 107, 78, 52, 18, true);
  wheelAccent(m, 277, 101, 73, 47, 18, true);
  // 露出した前輪・くびれたシート・大きな後輪カバー。
  addLoft(m, [[-320, 82], [-230, 128], [-105, 118], [65, 119], [253, 110], [300, 80], [210, 56], [-275, 56]], [94, 104, 98, 110, 92, 72, 65, 82], 0, 'under');
  addLoft(m, [[-388, 118], [-357, 204], [-294, 246], [-204, 236], [-134, 182], [-156, 120]], [84, 156, 174, 180, 140, 100], 0, 'body');
  addLoft(m, [[10, 123], [72, 220], [170, 267], [271, 250], [355, 202], [380, 139], [303, 124], [180, 132]], [118, 166, 186, 168, 120, 72, 90, 116], 0, 'body');
  addLoft(m, [[-130, 181], [-90, 197], [25, 195], [62, 171]], [112, 120, 126, 118], 0, 'seat');
  addLoft(m, [[116, 254], [152, 309], [235, 327], [287, 252]], [108, 120, 114, 98], 0, 'glass2');
  for (const side of [-1, 1]) {
    bikePanel(m, side, [[89, 143, 55], [96, 176, 103], [104, 188, 198], [92, 140, 178]], 'under');
    bikePanel(m, side, [[94, 177, 215], [88, 189, 273], [67, 153, 328], [83, 143, 246]], 'decal2');
    bikePanel(m, side, [[84, 161, -330], [93, 182, -278], [89, 162, -221], [83, 151, -273]], 'under');
    addLine(m, [side * 89, 185, -356], [side * 115, 185, -340], 'tail');
    addLine(m, [side * 86, 149, -143], [side * 103, 138, 80], 'chrome');
    addLine(m, [side * 46, 101, 210], [side * 54, 132, 310], 'chrome');
    addLine(m, [side * 72, 267, 174], [side * 57, 298, 237], 'chrome');
    addBlob(m, side * 71, 155, -156, 14, 12, 34, 'chrome', 2, 8);
  }
  // ランプとライダー。低い着座姿勢を車体から明確に分離。
  bikePanel(m, 1, [[-78, 187, -370], [78, 187, -370], [68, 213, -368], [-68, 213, -368]], 'tail');
  bikePanel(m, 1, [[-52, 190, 363], [52, 190, 363], [48, 206, 361], [-48, 206, 361]], 'head');
  addLoft(m, [[-152, 188], [-112, 254], [12, 275], [98, 229]], [86, 112, 107, 74], 0, 'jacket');
  addBlob(m, 0, 290, 93, 38, 40, 40, 'jacket', 4, 12);
  addBlob(m, 0, 294, 124, 31, 17, 12, 'visor', 2, 10);
  for (const side of [-1, 1]) {
    addLine(m, [side * 42, 270, 34], [side * 86, 240, 174], 'jacket');
    addLine(m, [side * 48, 216, -92], [side * 94, 164, -206], 'jeans');
    addLine(m, [side * 94, 164, -206], [side * 90, 120, -276], 'jeans');
  }
  return m;
}
function sculptARC() {
  const m = Mesh();
  addRingWheel(m, 0, 143, -263, 143, 98, 76, 24);
  addRingWheel(m, 0, 143, 257, 143, 98, 76, 24);
  // 2つの大きな光輪の間に、くびれた黒い単一フレームを吊る。
  addLoft(m, [[-316, 124], [-241, 201], [-124, 219], [25, 194], [171, 222], [277, 205], [337, 146], [252, 93], [-252, 94]], [76, 116, 126, 98, 130, 112, 60, 70, 70], 0, 'body');
  addLoft(m, [[-130, 209], [-48, 265], [81, 261], [173, 223]], [70, 92, 92, 74], 0, 'glass2');
  for (const side of [-1, 1]) {
    bikePanel(m, side, [[64, 142, -181], [77, 171, -70], [72, 164, 132], [53, 135, 185]], 'under');
    addLine(m, [side * 63, 209, -244], [side * 57, 214, 245], 'glow');
    addLine(m, [side * 80, 140, -143], [side * 76, 145, 161], 'glow');
    addLine(m, [side * 42, 130, -314], [side * 41, 145, 312], 'chrome');
    addLoft(m, [[-116, 118], [-75, 143], [75, 143], [119, 118]], 20, side * 88, 'chrome');
  }
  addBlob(m, 0, 257, -74, 42, 25, 78, 'jacket', 3, 10);
  addBlob(m, 0, 278, 46, 32, 30, 37, 'helmet', 3, 10);
  addBlob(m, 0, 278, 76, 27, 11, 11, 'visor', 2, 8);
  bikePanel(m, 1, [[-50, 166, -328], [50, 166, -328], [43, 184, -326], [-43, 184, -326]], 'tail');
  addBlob(m, 0, 166, 339, 13, 10, 6, 'head', 2, 8);
  return m;
}
function sculptNST() {
  const m = Mesh();
  addWheel(m, 0, 113, -263, 113, 142, 16, false, true);
  addWheel(m, 0, 109, 271, 109, 134, 16, false, true);
  wheelAccent(m, -263, 113, 92, 71, 16, true);
  wheelAccent(m, 271, 109, 87, 67, 16, true);
  // Ducati Diavel 型の広い肩と開口部を、角張った装甲に置き換える。
  addLoft(m, [[-295, 92], [-195, 131], [64, 125], [278, 115], [295, 76], [-270, 69]], [125, 152, 166, 128, 92, 96], 0, 'under');
  addLoft(m, [[-103, 171], [-63, 257], [97, 285], [198, 242], [205, 166], [104, 142]], [144, 172, 196, 194, 170, 154], 0, 'body');
  addLoft(m, [[197, 139], [221, 255], [306, 262], [371, 190], [353, 124]], [164, 178, 150, 92, 114], 0, 'body');
  addLoft(m, [[-345, 144], [-329, 227], [-218, 238], [-166, 160]], [122, 154, 166, 134], 0, 'body');
  addLoft(m, [[-172, 197], [-138, 220], [-36, 221], [-13, 190]], [118, 136, 137, 126], 0, 'seat');
  for (const side of [-1, 1]) {
    bikePanel(m, side, [[96, 159, -39], [105, 214, 18], [107, 207, 100], [87, 151, 144]], 'under');
    addCylZ(m, side * 75, 302, -333, -120, 46, 12, 'under');
    addLine(m, [side * 115, 248, -291], [side * 115, 244, 118], 'glow');
    addLine(m, [side * 106, 157, -56], [side * 104, 160, 236], 'chrome');
    addLine(m, [side * 90, 111, 111], [side * 102, 179, 297], 'chrome');
    addBox(m, side * 86, 140, -89, 22, 45, 153, 'chrome');
  }
  bikePanel(m, 1, [[-76, 185, -356], [76, 185, -356], [70, 209, -353], [-70, 209, -353]], 'tail');
  bikePanel(m, 1, [[-61, 218, 367], [61, 218, 367], [55, 234, 365], [-55, 234, 365]], 'head');
  addLoft(m, [[-186, 203], [-125, 288], [-16, 316], [40, 243]], [94, 128, 110, 88], 0, 'jacket');
  addBlob(m, 0, 343, -38, 42, 42, 42, 'helmet', 4, 12);
  addBlob(m, 0, 345, -6, 32, 14, 12, 'visor', 2, 10);
  for (const side of [-1, 1]) {
    addLine(m, [side * 57, 291, -57], [side * 92, 265, 152], 'jacket');
    addLine(m, [side * 51, 232, -120], [side * 99, 145, -55], 'jeans');
  }
  return m;
}
function sculptNGT() {
  const m = Mesh(), lift = 67;
  const stations = [[-429, 75, 112, 18], [-367, 62, 149, 83], [-250, 57, 174, 111], [-106, 60, 199, 122], [42, 66, 208, 117], [176, 74, 175, 107], [305, 83, 136, 78], [410, 95, 106, 10]];
  stationBody(m, stations, [-145, 196], 14, 35, 0.37);
  for (const v of m.v) v[1] += lift;
  // 薄い翼のようなサイドポッドと、後部の磁気スラスター。
  for (const side of [-1, 1]) {
    addLoft(m, [[-345, 119], [-260, 148], [135, 144], [297, 103], [225, 90], [-269, 95]], [30, 42, 45, 30, 24, 28], side * 112, 'body');
    bikePanel(m, side, [[126, 162, -258], [144, 179, -97], [151, 159, 146], [119, 144, 269]], 'under');
    addLine(m, [side * 130, 157, -325], [side * 139, 163, 256], 'glow');
    addLine(m, [side * 73, 224, -182], [side * 62, 256, 123], 'chrome');
    addCylZ(m, side * 74, 127, -425, -335, 33, 12, 'under');
    addLine(m, [side * 93, 169, -390], [side * 124, 180, -334], 'glow');
    bikePanel(m, side, [[96, 180, -352], [129, 211, -400], [112, 153, -404]], 'body');
  }
  for (const z of [-230, 213]) {
    bikePanel(m, 1, [[-94, 61, z - 57], [94, 61, z - 57], [94, 61, z + 57], [-94, 61, z + 57]], 'repulsor');
  }
  bikePanel(m, 1, [[-83, 177, -430], [83, 177, -430], [78, 193, -427], [-78, 193, -427]], 'tail');
  bikePanel(m, 1, [[-29, 164, 406], [29, 164, 406], [23, 176, 404], [-23, 176, 404]], 'head');
  return m;
}
function cloneBike(src) {
  return { v: src.v.map(v => v.slice()), f: src.f.map(f => ({ i: f.i.slice(), k: f.k })), l: src.l.map(l => l.slice()) };
}
function rivalVersion(src, id) {
  const m = cloneBike(src);
  if (src.meshy) return m;   // Meshy版は形がちがうので、旧モデル用の後付けフィンは付けない
  for (const side of [-1, 1]) {
    const z = id === 'ngt' ? -394 : -330, y = id === 'nst' ? 252 : 203;
    bikePanel(m, side, [[89, y, z + 100], [142, y + 45, z - 14], [95, y + 4, z - 43]], 'fin');
    addLine(m, [side * 91, y, z + 75], [side * 139, y + 42, z - 10], 'glow');
  }
  return m;
}
function distantVersion(id) {
  const m = Mesh();
  if (id === 'ngt') {
    addLoft(m, [[-355, 125], [-245, 209], [70, 220], [344, 137], [372, 94], [-308, 90]], [114, 160, 180, 90, 44, 94], 0, 'body');
    addLoft(m, [[-100, 216], [0, 265], [183, 235], [218, 203]], [86, 105, 95, 76], 0, 'visor');
  } else {
    const ring = id === 'arc';
    if (ring) { addRingWheel(m, 0, 125, -225, 125, 90, 48, 10); addRingWheel(m, 0, 125, 225, 125, 90, 48, 10); }
    else { addWheel(m, 0, 95, -230, 95, 84, 8, false, true, id === 'kai' ? 'body' : 'hub'); addWheel(m, 0, 95, 245, 95, 84, 8, false, true, id === 'kai' ? 'body' : 'hub'); }
    addLoft(m, [[-327, 131], [-290, 206], [-165, 214], [-38, 166], [95, id === 'nst' ? 257 : 220], [292, 215], [346, 141], [290, 105], [-275, 98]], [70, 110, 132, 105, id === 'nst' ? 170 : 124, 122, 65, 68, 70], 0, 'body');
    addBlob(m, 0, id === 'nst' ? 336 : 259, -17, 31, 34, 36, id === 'kai' ? 'jacket' : 'helmet', 2, 8);
  }
  bikePanel(m, 1, [[-61, 158, -350], [61, 158, -350], [55, 180, -347], [-55, 180, -347]], 'tail');
  return m;
}
function initRedesignMeshes() {
  // Blenderで作成した4台の軽量メッシュを、ゲームの描画座標に変換して組み込む。
  // データが読み込めない環境でも、元の手描きモデルでプレイ可能にする。
  const B = typeof BLENDER_GAME_MESHES === 'undefined' ? null : BLENDER_GAME_MESHES;
  // 2026-10-07: Meshy の3Dモデルから作った軽量メッシュ(meshy_bike_meshes.js)。**標準では使わない**(1,800面への間引きだけでは、Blender版より形が荒れるため)。?meshy=1 を付けたときだけ使う
  const M = typeof MESHY_BIKE_MESHES === 'undefined' || !/[?&]meshy=1/.test(location.search) ? null : MESHY_BIKE_MESHES;
  const pick = (id, sculpt) => { if (M && M[id] && M[id].v.length) { M[id].meshy = true; return M[id]; } return B && B[id] && B[id].v.length ? B[id] : sculpt(); };
  MESH.kai = pick('kai', sculptKAI); MESH.player = MESH.kai;
  MESH.arc = pick('arc', sculptARC);
  MESH.nst = pick('nst', sculptNST);
  MESH.ngt = pick('ngt', sculptNGT);
  MESH.kmi = cloneBike(MESH.kai);
  for (const side of [-1, 1]) {
    bikePanel(MESH.kmi, side, [[95, 199, -265], [179, 278, -381], [111, 168, -355]], 'fin');
    addLine(MESH.kmi, [side * 114, 210, -284], [side * 172, 273, -375], 'glow');
  }
  for (const id of ['kai', 'arc', 'nst', 'ngt']) {
    MESH['rival_' + id] = rivalVersion(MESH[id], id);
    MESH['distant_' + id] = distantVersion(id);
  }
}
