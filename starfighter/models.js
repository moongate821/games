// NEON FRONTIER / procedural aerospace detail. All meshes are built once.
// Close-range detail has its own LOD; hit targets and the original AI remain stable.
function buildFighterDetails(s, faction, cat) {
  const m = new MB(), L = s.bodyLength, W = s.wingSize;
  if (cat === 'drone') {
    const r = L * .28;
    m.cylz(0, 0, r, r * .34, r * .18, r * .35, 6);
    return {v:m.v,f:m.f};
  }
  if (faction === 'empire' || faction === 'machine') {
    // Faceted canopy, split spine, sensor nose and inset radiator slats.
    m.frustum(0,L*.105,L*.16,L*.12,L*.07,L*.055,L*.025,L*.25);
    m.frustum(0,-L*.06,L*.42,L*.07,L*.045,1,1,L*.23);
    for (const sd of [-1,1]) {
      const x = sd * L * .17;
      m.frustum(x,0,-L*.17,L*.12,L*.10,L*.055,L*.055,L*.46);
      m.cylz(x,0,-L*.43,L*.062,L*.055,L*.065,8);
      m.cylz(x,0,-L*.47,L*.05,L*.035,L*.04,8);
      for (let i=0;i<3;i++) m.box(x,L*.056,-L*(.07+i*.055),L*.09,1.4,L*.02);
      m.cylz(sd*L*.29,-L*.015,L*.16,2.4,1.6,L*.31,5);
    }
    if (cat === 'carrier') {
      for (const sd of [-1,1]) {
        m.box(sd*L*.24,-L*.075,-L*.13,L*.12,L*.08,L*.25);
        for(let i=0;i<3;i++) m.cylz(sd*L*.24+(i-1)*L*.03,-L*.08,L*.005,L*.012,L*.009,L*.045,5);
      }
    }
  } else if (faction === 'bio') {
    for (let i=0;i<4;i++) {
      const z=L*(.22-i*.14), r=L*(.08+.035*Math.sin(i+1));
      m.cylz(0,0,z,r*1.25,r,L*.025,6);
    }
    mirrorPoly(m,[[L*.06,L*.38],[L*.20,L*.70],[L*.15,L*.3]],-L*.025,L*.025);
  } else if (faction === 'ancient') {
    for(const sd of [-1,1]) {
      m.frustum(sd*L*.25,0,-L*.1,L*.04,L*.05,L*.015,L*.02,L*.6);
      m.prism(sd*L*.25,0,0,L*.08,L*.055,2,6);
    }
    m.cylz(0,0,L*.36,L*.08,L*.055,L*.04,8);
  } else {
    for(let i=0;i<4;i++) {
      const sd=i%2?-1:1, z=L*(.22-i*.14);
      m.frustum(sd*L*(.22+.03*i),L*.05*(i-1),z,L*.04,L*.10,1,1,L*.25,sd*.45);
    }
  }
  return {v:m.v,f:m.f};
}
function buildCapitalDetails(cls, faction, L, W, d, towerTop, zb, engines, boss) {
  const m = new MB(), lights = [], hw = z => profHW(d.prof,z);
  const seg = (a,b,normal=[0,1,0],color='ice') => lights.push({a,b,normal,color});
  // Individually beveled armor tiles leave readable seams along the deck.
  const count = cls === 'titan' ? 9 : cls === 'dread' ? 8 : 6;
  for (let i=0;i<count;i++) {
    const z=L*(.27-i*.085), w=hw(z);
    if(w<42) continue;
    for(const sd of [-1,1]) {
      const x=sd*w*.72;
      m.frustum(x,d.y+4,z,w*.29,8,w*.22,5,L*.052);
      m.box(sd*w*.25,d.y+2,z,Math.max(8,w*.13),4,L*.055);
      if(i%2===0) {
        m.box(sd*w*.94,d.y-12,z,12,28,L*.09);
        seg([x,d.y+10,z-L*.02],[x,d.y+10,z+L*.02],[0,1,0],i%3?'ice':'amber');
      }
    }
  }
  // Recessed heat exchangers and engine collars on the stern.
  for(const sd of [-1,1]) {
    const x=sd*W*.35,z=-L*.34;
    m.box(x,d.y+8,z,W*.25,12,L*.13);
    for(let i=0;i<5;i++)m.box(x,d.y+16,z+L*(i-2)*.024,W*.23,3,5);
  }
  engines.forEach(([x,y,z])=>{m.cylz(x,y,z+22,47,39,24,10);m.cylz(x,y,z+7,39,30,12,10);});
  // Keel armor and side ribs remain visible when flying underneath a capital ship.
  for(let i=0;i<7;i++) {
    const z=L*(.30-i*.105),w=Math.max(40,hw(z));
    m.frustum(0,-91,z,w*.68,18,w*.50,10,L*.064);
    for(const sd of [-1,1]) {
      m.frustum(sd*w*.8,-35,z,10,60,7,42,L*.055);
      seg([sd*w*.8,-49,z-L*.017],[sd*w*.8,-49,z+L*.017],[sd,0,0],i%2?'ice':'amber');
    }
  }
  // Command superstructure: split masts, phased-array radar, armored neck.
  m.frustum(0,towerTop-20,zb,110,44,80,30,112);
  for(const sd of [-1,1]) {
    m.box(sd*46,towerTop+29,zb-12,4,64,4);
    m.box(sd*46,towerTop+57,zb-12,29,12,4,sd*.3);
    for(let k=0;k<4;k++)seg([sd*(12+k*9),towerTop+2,zb+58],[sd*(17+k*9),towerTop+2,zb+58],[0,0,1],'ice');
  }
  if(cls==='carrier') {
    // Open-looking hangar throats and two long illuminated launch rails.
    for(const sd of [-1,1]) {
      const x=sd*W*.8,z=L*.302;
      m.box(x,-57,z,W*.33,7,45).box(x,18,z,W*.33,7,45);
      for(const k of [-1,1])m.box(x+k*W*.165,-20,z,7,75,45);
      for(let i=0;i<4;i++)seg([x-W*.12,-44+i*15,z+24],[x+W*.12,-44+i*15,z+24],[0,0,1],i===0?'amber':'ice');
      seg([sd*W*.10,d.y+8,-L*.06],[sd*W*.10,d.y+8,L*.31],[0,1,0],'amber');
    }
  } else if(cls==='battle'||cls==='dread'||cls==='titan') {
    // A twin spinal accelerator differentiates gunships from carriers.
    for(const sd of [-1,1]) {
      m.frustum(sd*28,d.y+20,L*.20,22,22,12,12,L*.21);
      m.box(sd*28,d.y+31,L*.17,5,3,L*.14);
      seg([sd*28,d.y+34,L*.11],[sd*28,d.y+34,L*.23],[0,1,0],'amber');
    }
  }
  if(faction==='machine') {
    for(const sd of [-1,1])for(let i=0;i<3;i++)m.frustum(sd*W*.62,-20,L*(.26-i*.24),40,62,28,38,L*.12);
  } else if(faction==='bio') {
    for(let i=0;i<5;i++){const r=W*(.48-.045*Math.abs(i-2));m.cylz(0,-12,L*(.26-i*.14),r,r*.94,14,8);}
  } else if(faction==='ancient') {
    for(const sd of [-1,1])m.frustum(sd*W*1.3,20,-L*.10,20,40,5,12,L*.40);
  } else if(faction==='void') {
    for(const sd of [-1,1])for(let i=0;i<3;i++)m.frustum(sd*W*(.7+i*.2),W*(.1+i*.1),-L*.20,30,65,2,2,L*.3,sd*.2*i);
  }
  return {mesh:{v:m.v,f:m.f},lights,lines:buildDetailLines(cls,faction,L,W,d,towerTop,zb,engines,boss)};
}
function drawCapitalAccents(ship,z) {
  if (!ship.alive || ship.wt > 0 || !ship.design || !ship.design.detail || z > (lite?3500:6200)*ship.S) return;
  const view=ship.toLocalDir(vsub(cam.p,ship.p));
  noFill();
  for(const s of ship.design.detail.lights) {
    if(dot(view,s.normal)<0)continue;
    const a=projW(ship.toWorld(vmul(s.a,ship.S))),b=projW(ship.toWorld(vmul(s.b,ship.S)));if(!a||!b)continue;
    neon(s.color==='amber'?[255,192,94]:ship.ally?[124,255,182]:[135,234,255],210,lite?0:5,1.5);
    line(a[0],a[1],b[0],b[1]);
  }
  noGlow();
  if (!lite && ship.design.detail.lines) drawDetailLines(ship, z, vnorm(view));
}
// ---------- 精密なワイヤーフレーム: 甲板のパネル割り・窓・肋材・トラス・エンジンの輪(線だけ。近づくほど濃く出る) ----------
function buildDetailLines(cls, faction, L, W, d, towerTop, zb, engines, boss) {
  const G = [], hw = z => profHW(d.prof, z), y0 = d.y, k = boss ? 2 : cls === 'cruiser' ? 0.6 : cls === 'carrier' ? 1.1 : 1;
  const grp = (n, c) => { const g = { n, c, pl: [] }; G.push(g); return g; };
  // 甲板のパネル割り(横の継ぎ目と、縦の継ぎ目)
  const top = grp([0, 1, 0], 'hull');
  for (let z = L * .40; z > -L * .46; z -= L * .02 / k) { const w = hw(z); if (w >= 30) top.pl.push([[-w * .97, y0 + 7, z], [w * .97, y0 + 7, z]]); }
  for (const f of [-.88, -.66, -.44, -.22, .22, .44, .66, .88]) {
    let pl = [];
    for (let z = L * .40; z > -L * .46; z -= L * .03) { const w = hw(z); if (w < 30) { if (pl.length > 1) top.pl.push(pl); pl = []; continue; } pl.push([w * f, y0 + 7, z]); }
    if (pl.length > 1) top.pl.push(pl);
  }
  // 舷側の窓(3段)
  for (const sd of [-1, 1]) {
    const g = grp([sd, 0, 0], 'win');
    for (const yr of [y0 - 14, y0 - 34, y0 - 54]) for (let z = L * .38; z > -L * .42; z -= L * .026 / k) { const w = hw(z); if (w >= 30) g.pl.push([[sd * (w * 1.12 + 8), yr, z], [sd * (w * 1.12 + 8), yr, z - L * .012]]); }
  }
  // 船底の継ぎ目
  const bel = grp([0, -1, 0], 'hull');
  for (let z = L * .40; z > -L * .44; z -= L * .04 / k) { const w = Math.max(hw(z), 40); bel.pl.push([[-w * .8, -96, z], [w * .8, -96, z]]); }
  for (const f of [-.5, -.25, 0, .25, .5]) { const pl = []; for (let z = L * .40; z > -L * .44; z -= L * .05) pl.push([Math.max(hw(z), 40) * f * 1.6, -96, z]); bel.pl.push(pl); }
  // 船首のシェブロン
  const bow = grp([0, .4, 1], 'acc');
  for (let i = 0; i < 6; i++) { const z = L * (.16 + i * .045), w = Math.max(hw(z), 24); bow.pl.push([[-w * .9, y0 + 8, z], [0, y0 + 8, z + L * .03], [w * .9, y0 + 8, z]]); }
  // 艦橋の窓
  for (const sd of [-1, 1]) {
    const g = grp([sd, 0, 0], 'win'), hb = Math.max(hw(zb), 40) * .55;
    for (let r = 0; r < 4; r++) { const y = y0 + 48 + r * 14; if (y > towerTop + 10) break; for (let i = 0; i < 6; i++) g.pl.push([[sd * hb, y, zb - 60 + i * 20], [sd * hb, y, zb - 52 + i * 20]]); }
  }
  // エンジンの二重の輪
  const eng = grp([0, 0, -1], 'acc');
  for (const [x, y, z] of engines) for (const r of [52, 30]) { const pl = []; for (let i = 0; i <= 12; i++) { const a = i / 12 * TWO_PI; pl.push([x + Math.cos(a) * r, y + Math.sin(a) * r, z - 4]); } eng.pl.push(pl); }
  // 肋材(船体の断面の枠)。4つの面に分けて、手前側だけ描く
  const ribs = [[0, 1, 0, Math.PI / 2], [1, 0, 0, 0], [0, -1, 0, Math.PI * 1.5], [-1, 0, 0, Math.PI]].map(q => ({ g: grp([q[0], q[1], q[2]], 'hull'), c: q[3] }));
  const nR = Math.round(8 * k), cy = (y0 - 90) / 2, ry = (y0 + 90) / 2 + 12;
  for (let i = 0; i < nR; i++) {
    const z = L * (.36 - i * .74 / nR), w = Math.max(hw(z), 50) * 1.25 + 30;
    for (const r of ribs) { const pl = []; for (let j = 0; j <= 12; j++) { const th = r.c + (j / 12 - .5) * Math.PI / 2; pl.push([Math.cos(th) * w, cy + Math.sin(th) * ry, z]); } r.g.pl.push(pl); }
  }
  // ボス専用: 舷側のトラス(ジグザグの桁)
  if (boss) for (const sd of [-1, 1]) {
    const g = grp([sd, 0, 0], 'acc'), up = [], dn = [], zz = [];
    for (let z = L * .38, j = 0; z > -L * .42; z -= L * .022, j++) { const w = Math.max(hw(z), 40) * 1.14 + 10; up.push([sd * w, y0 - 6, z]); dn.push([sd * w, y0 - 46, z]); zz.push([sd * w, j % 2 ? y0 - 6 : y0 - 46, z]); }
    g.pl.push(up, dn, zz);
  }
  return G;
}
function projShipPt(ship, l) {
  const S = ship.S, b = ship.basis, x = l[0] * S, y = l[1] * S, z = l[2] * S, p = ship.p;
  return projW([p[0] + b.r[0] * x + b.u[0] * y + b.f[0] * z, p[1] + b.r[1] * x + b.u[1] * y + b.f[1] * z, p[2] + b.r[2] * x + b.u[2] * y + b.f[2] * z]);
}
function drawDetailLines(ship, z, view) {
  const fade = Math.max(0, Math.min(1, 1.15 - z / (5600 * ship.S))); if (fade <= 0.03) return;
  const ctx = drawingContext, base = ship.col.rgb; ctx.shadowBlur = 0; ctx.lineWidth = 1; ctx.lineJoin = 'round';
  for (const g of ship.design.detail.lines) {
    if (dot(view, g.n) < 0.02) continue;
    const rgb = g.c === 'win' ? [255, 208, 128] : g.c === 'acc' ? [140, 232, 255] : base;
    ctx.strokeStyle = `rgba(${rgb[0] | 0},${rgb[1] | 0},${rgb[2] | 0},${(g.c === 'hull' ? 0.62 : 0.9) * fade})`;
    ctx.beginPath();
    for (const pl of g.pl) {
      let on = false;
      for (const pt of pl) { const q = projShipPt(ship, pt); if (!q) { on = false; continue; } if (on) ctx.lineTo(q[0], q[1]); else { ctx.moveTo(q[0], q[1]); on = true; } }
    }
    ctx.stroke();
  }
}
// ---------- ボス・中ボスの核: 細かい球、内側の核、回るリング ----------
function subdivideMesh(m) {   // 三角形を4つに割って、球へ押し出す(元の頂点の番号は、そのまま)
  const v = m.v.map(p => p.slice()), f = [], cache = {};
  const mid = (a, b) => { const k = a < b ? a + '_' + b : b + '_' + a; if (cache[k] === undefined) { const p = vadd(m.v[a], m.v[b]); v.push(vmul(p, 1 / vlen(p))); cache[k] = v.length - 1; } return cache[k]; };
  for (const [a, b, c] of m.f) { const ab = mid(a, b), bc = mid(b, c), ca = mid(c, a); f.push([a, ab, ca], [b, bc, ab], [c, ca, bc], [ab, bc, ca]); }
  return { v, f };
}
function fineIcosa() { return M.icosaFine || (M.icosaFine = subdivideMesh(M.icosa)); }
function ringMesh(r, n, h, dd) { const m = new MB(); for (let i = 0; i < n; i++) { const a = i / n * TWO_PI; m.box(Math.cos(a) * r, 0, Math.sin(a) * r, TWO_PI * r / n * 1.04, h, dd, -a - Math.PI / 2, 0); } return { v: m.v, f: m.f }; }
function polyExtraFaces(ship, out) {
  const R = 520 * ship.S, t = frameCount * 0.012 + ship.yaw, col = ship.col;
  pushFaces(out, worldToCamAll(bakeMesh(M.icosa, ship.p, basisYP(-t * 1.6, 0.6 + t * 0.3, 0), R * 0.42)), M.icosa.f, col);   // 内側の核(逆に回る)
  M.ringA = M.ringA || ringMesh(1, 30, 0.03, 0.03);
  pushFaces(out, worldToCamAll(bakeMesh(M.ringA, ship.p, basisYP(t * 0.5, 1.1, 0), R * 1.14)), M.ringA.f, col);
  pushFaces(out, worldToCamAll(bakeMesh(M.ringA, ship.p, basisYP(-t * 0.35, 0.4, 0), R * 1.3)), M.ringA.f, col);
}
// New swept airframes retain distinct faction design languages.
FAC_BUILD.empire = function(m,s,rng) {
  const L=s.bodyLength,wx=L*(.40+.12*s.wingSize);
  m.frustum(0,0,-L*.05,L*.24,L*.16,L*.09,L*.07,L*.72);
  m.frustum(0,0,L*.43,L*.09,L*.07,1,2,L*.26);
  mirrorPoly(m,[[L*.06,L*.24],[wx,-L*.26],[wx*.86,-L*.38],[L*.10,-L*.20]],-3,2);
  mirrorPoly(m,[[L*.07,-L*.2],[L*.28,-L*.43],[L*.18,-L*.5],[L*.05,-L*.39]],2,5);
  for(const sd of [-1,1])m.box(sd*L*.17,L*.11,-L*.27,3,L*.22,L*.22,sd*.2);
  engineRow(m,2,L,L*.17,L*.055);
};
FAC_BUILD.machine = function(m,s,rng) {
  const L=s.bodyLength,wx=L*.44*s.wingSize;
  m.frustum(0,0,0,L*.18,L*.15,L*.055,L*.06,L*.92);
  mirrorPoly(m,[[L*.04,L*.2],[wx,L*.08],[wx*.82,-L*.35],[L*.05,-L*.22]],-3,3);
  for(const sd of [-1,1])m.frustum(sd*wx*.85,0,0,L*.085,L*.09,L*.02,L*.04,L*.67);
  engineRow(m,2,L,L*.12,L*.055);
};
function loftHull(m,stations) {
  const v=[],f=[];
  for(const [z,w,y0,y1] of stations) {
    const cut=(y1-y0)*.22;
    v.push([-w*.78,y1,z],[w*.78,y1,z],[w,y1-cut,z],[w*.78,y0+cut,z],[w*.46,y0,z],[-w*.46,y0,z],[-w*.78,y0+cut,z],[-w,y1-cut,z]);
  }
  for(let j=0;j<stations.length-1;j++)for(let i=0;i<8;i++)f.push([j*8+i,j*8+(i+1)%8,(j+1)*8+(i+1)%8,(j+1)*8+i]);
  f.push([7,6,5,4,3,2,1,0]);f.push(Array.from({length:8},(_,i)=>(stations.length-1)*8+i));
  m.put(v,f,0,0,0,0,0);
}
FAC_HULL.empire=function(m,L,W,rng,cls) {
  const k=.92+rng()*.12;
  loftHull(m,[[L*.55,8,-24,0],[L*.33,W*.38,-54,8],[L*.09,W*.78,-85,14],[-L*.12,W*k,-104,17],[-L*.34,W*.94,-90,14],[-L*.5,W*.68,-64,10]]);
  loftHull(m,[[L*.35,5,10,60],[-L*.1,W*.64,10,60],[-L*.32,W*.57,8,60],[-L*.44,W*.46,8,60]]);
  m.frustum(0,-96,-L*.04,W*.20,24,W*.10,12,L*.72);
  if(cls==='carrier') {
    for(const sd of [-1,1])m.frustum(sd*W*.73,-12,L*.17,W*.23,58,W*.15,32,L*.57);
  } else for(const sd of [-1,1])m.frustum(sd*W*.15,-12,L*.39,25,28,12,15,L*.24);
  return {y:60,prof:[[L*.35,0],[-L*.1,W*.64],[-L*.44,W*.46]],zs:-L*.5};
};
FAC_HULL.machine=function(m,L,W,rng) {
  loftHull(m,[[L*.52,20,-28,18],[L*.3,W*.32,-50,30],[-L*.4,W*.32,-50,30],[-L*.49,W*.25,-26,22]]);
  for(let i=0;i<4;i++)for(const sd of [-1,1]) {
    const z=L*(.3-i*.22);
    m.frustum(sd*W*.48,-12,z,W*.40,85,W*.32,55,L*.15);
    m.box(sd*W*.48,33,z,W*.30,6,L*.11);
  }
  for(const sd of [-1,1])m.frustum(sd*W*.82,-4,-L*.12,60,42,25,22,L*.64);
  return {y:35,prof:[[L*.37,W*.28],[-L*.39,W*.28]],zs:-L*.48};
};

// ---------- 戦闘機・艦載機・ドローンの精密なワイヤーフレーム(線だけ。近づくと現れる) ----------
function buildFighterLines(s, faction, cat) {
  const G = [], L = s.bodyLength, E = s.engineCount, grp = (n, c) => { const g = { n, c, pl: [] }; G.push(g); return g; };
  const ring = (cx, cy, cz, r, n = 10) => { const pl = []; for (let i = 0; i <= n; i++) { const a = i / n * TWO_PI; pl.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r, cz]); } return pl; };
  if (cat === 'drone') {   // ドローン: 胴体を囲む輪と、十字のフレーム
    const r = L * .4, g = grp([0, 0, 0], 'hull');
    g.pl.push(ring(0, 0, 0, r * 1.15, 12), ring(0, 0, r * .45, r * .8, 10), ring(0, 0, -r * .45, r * .8, 10));
    g.pl.push([[-r * 1.3, 0, 0], [r * 1.3, 0, 0]], [[0, -r * 1.3, 0], [0, r * 1.3, 0]], [[0, 0, -r * 1.3], [0, 0, r * 1.3]]);
    return G;
  }
  const wx = L * (faction === 'machine' ? .44 : .40 + .12 * s.wingSize) * (faction === 'machine' ? s.wingSize : 1), top = grp([0, 1, 0], 'hull'), bot = grp([0, -1, 0], 'hull'), acc = grp([0, 0, -1], 'acc');
  // 背骨の継ぎ目と、胴体の輪(上面)
  top.pl.push([[0, L * .10, -L * .44], [0, L * .10, L * .38]]);
  for (let k = -3; k <= 4; k++) { const z = L * k * .09; top.pl.push([[-L * .085, L * .08, z], [-L * .045, L * .105, z], [L * .045, L * .105, z], [L * .085, L * .08, z]]); }
  // 主翼のリブ(前縁から後縁へ。上下の面)
  for (const sd of [-1, 1]) for (let j = 1; j <= 6; j++) {
    const x = sd * (L * .10 + (wx - L * .10) * j / 7), zf = L * .16 - Math.abs(x) * .55, zb = -L * .16 - Math.abs(x) * .42;
    top.pl.push([[x, L * .018, zf], [x, L * .018, zb]]); bot.pl.push([[x, -L * .018, zf], [x, -L * .018, zb]]);
  }
  // 主翼の縁と、翼端灯
  for (const sd of [-1, 1]) { top.pl.push([[sd * L * .10, L * .02, L * .16 - L * .055], [sd * wx, L * .02, L * .16 - wx * .55], [sd * wx * .9, L * .02, -L * .16 - wx * .42]]); }
  // 機首のセンサー線と、コックピットの枠
  top.pl.push([[-L * .03, L * .07, L * .40], [0, L * .10, L * .48], [L * .03, L * .07, L * .40]]);
  top.pl.push([[-L * .05, L * .10, L * .08], [-L * .035, L * .13, L * .20], [L * .035, L * .13, L * .20], [L * .05, L * .10, L * .08]]);
  // エンジンの輪(後方)
  for (let i = 0; i < E; i++) { const x = E === 1 ? 0 : (i / (E - 1) - .5) * L * .34; acc.pl.push(ring(x, 0, -L * .5 - 4, L * .058, 10), ring(x, 0, -L * .5 - 4, L * .034, 8)); }
  // 空母機: 腹の格納扉と、ミサイルポッドの線
  if (cat === 'carrier') {
    bot.pl.push([[-L * .08, -L * .07, -L * .10], [L * .08, -L * .07, -L * .10], [L * .08, -L * .07, L * .30], [-L * .08, -L * .07, L * .30], [-L * .08, -L * .07, -L * .10]]);
    for (let k = 0; k < 5; k++) bot.pl.push([[-L * .08, -L * .07, -L * .10 + k * L * .08], [L * .08, -L * .07, -L * .10 + k * L * .08]]);
  }
  return G;
}
function projFighterPt(f, b, l) { const p = f.p; return projW([p[0] + b.r[0] * l[0] + b.u[0] * l[1] + b.f[0] * l[2], p[1] + b.r[1] * l[0] + b.u[1] * l[1] + b.f[1] * l[2], p[2] + b.r[2] * l[0] + b.u[2] * l[1] + b.f[2] * l[2]]); }
let lineFighters = new Set();
function pickLineFighters() {   // 細かい線は、近い8機だけ(描画を軽く保つ)
  lineFighters = new Set(); if (lite) return;
  const c = []; for (const f of fighters) { const d = vlen(vsub(f.p, cam.p)); if (d < 1100 && !f.cloaked && !(f.wt > 0)) c.push([d, f]); }
  c.sort((a, b) => a[0] - b[0]); for (let i = 0; i < Math.min(8, c.length); i++) lineFighters.add(c[i][1]);
}
function drawFighterLines(f, z) {
  if (!lineFighters.has(f) || !f.design || !f.design.detail || !f.design.detail.lines || z > 1500) return;
  const b = basisDir(vnorm(f.v), f.roll), view = vnorm(vsub(cam.p, f.p)), lv = [dot(view, b.r), dot(view, b.u), dot(view, b.f)], fade = Math.max(0, Math.min(1, 1.25 - z / 1500)), base = f.col.rgb;
  const ctx = drawingContext; ctx.shadowBlur = 0; ctx.lineWidth = 1; ctx.lineJoin = 'round';
  for (const g of f.design.detail.lines) {
    if (dot(lv, g.n) < 0.02 && !(g.n[0] === 0 && g.n[1] === 0 && g.n[2] === 0)) continue;
    const rgb = g.c === 'acc' ? [255, 190, 110] : base;
    ctx.strokeStyle = `rgba(${rgb[0] | 0},${rgb[1] | 0},${rgb[2] | 0},${(g.c === 'hull' ? 0.6 : 0.85) * fade})`; ctx.beginPath();
    for (const pl of g.pl) { let on = false; for (const pt of pl) { const q = projFighterPt(f, b, pt); if (!q) { on = false; continue; } if (on) ctx.lineTo(q[0], q[1]); else { ctx.moveTo(q[0], q[1]); on = true; } } }
    ctx.stroke();
  }
}
