// 20ステージ:異世界のフィールド(配色・経路・背景演出)
const LAY={
 A:[[-1,2],[14,2],[14,5],[3,5],[3,8],[17,8]],
 B:[[-1,1],[16,1],[16,9],[1,9],[1,3],[13,3],[13,7],[4,7],[4,5],[10,5]],
 C:[[-1,5],[4,5],[4,1],[8,1],[8,9],[12,9],[12,1],[16,1],[16,8],[17,8]],
 D:[[-1,9],[6,9],[6,1],[11,1],[11,9],[17,9]],
 E:[[-1,1],[8,1],[8,5],[2,5],[2,9],[14,9],[14,4],[17,4]],
 F:[[-1,5],[2,5],[2,2],[15,2],[15,8],[5,8],[5,5],[9,5]],
 G:[[-1,8],[3,8],[3,2],[7,2],[7,8],[11,8],[11,2],[15,2],[15,8],[17,8]],
 H:[[-1,3],[12,3],[12,1],[16,1],[16,6],[8,6],[8,9],[17,9]]
};
const mkWP=(b,fx,fy)=>LAY[b].map(([c,r])=>[fx?17-c:c,fy?10-r:r]);
const P=(bg,bg2,grid,path,path2,edge,line,acc,star)=>({bg,bg2,grid,path,path2,edge,line,acc,star});
function seedParts(n){let s=n*7919+13;const r=()=>{s=(s*16807)%2147483647;return s/2147483647};
 return Array.from({length:60},()=>({x:r()*864,y:r()*528,s:r(),p:r()*6.28,v:r()}))}
const STAGES=[
 {name:'星環の回路庭園',sub:'光の配線が咲く、都市の中枢',deco:'circuit',wp:mkWP('A',0,0),pal:P('#04060f','#071231','#0f1a44','#0c1440','#0a1030','#1c2c7a','#4a6cff','#5aa0ff','#9fb8ff')},
 {name:'ネオン雨の廃都',sub:'降り止まぬ紫の雨、無人の摩天楼',deco:'rain',wp:mkWP('D',0,0),pal:P('#0a0414','#1a0830','#2a1050','#220a40','#180630','#5a1a8a','#ff4fd8','#ff4fd8','#ff9af0')},
 {name:'結晶の砂漠',sub:'歌う水晶が風を砕く',deco:'crystal',wp:mkWP('C',0,0),pal:P('#020d10','#06232a','#0b3a44','#0a2a30','#061c22','#1a7a80','#4ff0e0','#4ff0e0','#aaf8f0')},
 {name:'虚空の海',sub:'重力が水になった静かな海',deco:'waves',wp:mkWP('F',0,0),pal:P('#020618','#04164a','#0a2a70','#081c5a','#06143c','#1848b0','#4a9cff','#4a9cff','#8fc0ff')},
 {name:'溶岩の工廠',sub:'地の底で炉が眠らず燃える',deco:'embers',wp:mkWP('E',0,0),pal:P('#120402','#2a0a04','#4a1608','#3a1006','#260a04','#a03a10','#ff7a2a','#ff7a2a','#ffb070')},
 {name:'氷河の天文台',sub:'凍った星図が空を映す',deco:'snow',wp:mkWP('G',0,0),pal:P('#04101a','#0a2a3e','#144a66','#0e3248','#0a2436','#3a8ab0','#bff4ff','#8fe0ff','#e0f8ff')},
 {name:'歯車の時計塔',sub:'時を刻む巨大機構の内部',deco:'gears',wp:mkWP('H',0,0),pal:P('#120d02','#2a2006','#4a3a0c','#3a2e08','#241c04','#a08020','#ffd34d','#ffd34d','#ffe9a0')},
 {name:'菌糸の夜森',sub:'胞子の灯りが道を示す',deco:'spores',wp:mkWP('A',1,1),pal:P('#020c06','#06240e','#0c4a20','#0a3418','#06240e','#1a8a40','#6aff9a','#6aff9a','#b0ffc8')},
 {name:'重力の墓場',sub:'砕けた世界の欠片が漂う',deco:'debris',wp:mkWP('D',1,1),pal:P('#0a0614','#1a1030','#2c1e56','#221648','#160e30','#5a3aa0','#b06bff','#b06bff','#d0b0ff')},
 {name:'紫電の嵐原',sub:'【ボス】雷雲を従える特異点の使い',deco:'storm',wp:mkWP('B',0,0),pal:P('#08061a','#140a38','#2a1a6a','#1c1058','#120a3c','#5a3ae0','#8f7aff','#9a8aff','#c8c0ff')},
 {name:'水晶の聖堂',sub:'光の柱が降り注ぐ祈りの間',deco:'rays',wp:mkWP('C',1,0),pal:P('#140a14','#2e1430','#5a2a5a','#44204a','#2e1432','#c06ac0','#ffc0f0','#ff9ae8','#fff0fa')},
 {name:'逆さまの都',sub:'天地が裏返った街並み',deco:'skyline',wp:mkWP('F',1,1),pal:P('#06041a','#0e0a40','#1c1470','#160e5a','#0e0a3c','#3a30c0','#7a8aff','#7a8aff','#b0b8ff')},
 {name:'光の海溝',sub:'発光生物が漂う深海の裂け目',deco:'jelly',wp:mkWP('E',1,0),pal:P('#00101a','#002a3a','#005a6a','#00384a','#00283a','#00a0b0','#40ffe8','#40f0ff','#a0fff4')},
 {name:'錆びた衛星軌道',sub:'廃棄された人工天体の環',deco:'orbit',wp:mkWP('G',0,1),pal:P('#100a08','#241610','#4a3020','#38241a','#26180e','#9a6040','#e0a070','#e8906a','#ffd0b0')},
 {name:'極光の平原',sub:'空が緑に燃える白夜',deco:'aurora',wp:mkWP('H',1,1),pal:P('#020a10','#04202a','#0a4a50','#083a40','#052a30','#20a090','#7affc8','#7affc8','#c0fff0')},
 {name:'砂時計の谷',sub:'落ちる砂が時間そのもの',deco:'sand',wp:mkWP('A',0,1),pal:P('#140c02','#2e1c06','#5a3a10','#44300c','#2e2008','#c08a20','#ffc84a','#ffc84a','#ffe8a0')},
 {name:'情報の大瀑布',sub:'数字の滝が世界を流れ落ちる',deco:'matrix',wp:mkWP('C',0,1),pal:P('#000a02','#001a06','#00481a','#003412','#00240c','#00a040','#40ff70','#40ff70','#a0ffb8')},
 {name:'沈黙の深淵',sub:'音も光も吸い込まれる底',deco:'void',wp:mkWP('F',0,1),pal:P('#03010a','#0c0426','#1c0e50','#140840','#0c0428','#4a1a90','#8a4aff','#8a4aff','#b890ff')},
 {name:'星喰いの門',sub:'すべてを呑む渦の入口',deco:'swirl',wp:mkWP('E',1,1),pal:P('#0a0000','#240408','#4a0c14','#38080e','#240408','#a01828','#ff4a5a','#ff4a5a','#ffa0a8')},
 {name:'崩壊特異点',sub:'【最終】世界の綻びの中心',deco:'glitch',wp:mkWP('B',1,1),pal:P('#08080c','#1c1020','#3a2a48','#2a1c38','#1a1024','#c0405a','#ffffff','#ff5a7a','#ffffff')}
];
STAGES.forEach((s,i)=>s.P=seedParts(i+1));
// 背景画像が明るすぎる面だけ暗幕を重ねる(0〜1)
STAGES[5].dim=.25;STAGES[14].dim=.2;STAGES[18].dim=.15;STAGES[19].dim=.5;

// ---- 背景演出 ----
function drawDeco(c,t,type,pal,W,H,Q){
 c.save();c.globalCompositeOperation='lighter';const col=pal.line,acc=pal.acc;
 const R=i=>Q[i%Q.length];
 switch(type){
 case'circuit':
  c.strokeStyle=col;c.lineWidth=1;
  for(let i=0;i<14;i++){const q=R(i);c.globalAlpha=.07;c.beginPath();c.moveTo(q.x,0);c.lineTo(q.x,H);c.stroke();c.beginPath();c.moveTo(0,q.y);c.lineTo(W,q.y);c.stroke();
   c.globalAlpha=.6;c.fillStyle=col;const y=(t*(40+q.v*60)+q.y)%H;c.fillRect(q.x-1.5,y,3,3);const x=(t*(40+q.s*60)+q.x)%W;c.fillRect(x,q.y-1.5,3,3)}break;
 case'rain':
  c.strokeStyle=col;c.lineWidth=1;
  for(let i=0;i<55;i++){const q=R(i),x=q.x,y=(t*(260+q.v*220)+q.y*3)%(H+60)-30;c.globalAlpha=.12+.25*q.s;c.beginPath();c.moveTo(x,y);c.lineTo(x-5,y+22);c.stroke()}
  c.globalAlpha=.05;c.fillStyle=acc;for(let i=0;i<9;i++){const q=R(i);c.fillRect(q.x,H-30-q.v*160,18+q.s*30,H)}break;
 case'crystal':
  for(let i=0;i<16;i++){const q=R(i),h=40+q.v*130,w=14+q.s*26;c.globalAlpha=.1+.05*Math.sin(t*1.5+q.p);c.fillStyle=col;c.beginPath();c.moveTo(q.x-w,H);c.lineTo(q.x,H-h);c.lineTo(q.x+w,H);c.fill();
   c.globalAlpha=.3;c.strokeStyle=acc;c.stroke();
   const g=(Math.sin(t*2+q.p)+1)/2;c.globalAlpha=g*.7;c.fillStyle='#fff';c.fillRect(q.x-1,H-h-1,3,3)}break;
 case'waves':
  c.strokeStyle=col;c.lineWidth=1.5;
  for(let k=0;k<6;k++){c.globalAlpha=.07+.02*k;c.beginPath();for(let x=0;x<=W;x+=16){const y=H*(.12+k*.15)+Math.sin(x*.012+t*(.5+k*.15)+k)*16;x?c.lineTo(x,y):c.moveTo(x,y)}c.stroke()}
  c.fillStyle=col;for(let i=0;i<24;i++){const q=R(i);c.globalAlpha=.25;const y=H-((t*(16+q.v*30)+q.y)%H);c.beginPath();c.arc(q.x+Math.sin(t+q.p)*8,y,1.5+q.s*3,0,TAU);c.stroke()}break;
 case'embers':{
  const g=c.createLinearGradient(0,H,0,H*.45);g.addColorStop(0,col+'55');g.addColorStop(1,col+'00');c.fillStyle=g;c.globalAlpha=.8+.2*Math.sin(t*2);c.fillRect(0,H*.45,W,H*.55);
  c.fillStyle=col;for(let i=0;i<50;i++){const q=R(i),y=H-((t*(20+q.v*60)+q.y)%H);c.globalAlpha=.7*(y/H);c.fillRect(q.x+Math.sin(t+q.p)*12,y,2+q.s*2,2+q.s*2)}break}
 case'snow':
  c.fillStyle=col;
  for(let i=0;i<60;i++){const q=R(i),y=(t*(15+q.v*35)+q.y)%H;c.globalAlpha=.25+.4*q.s;c.beginPath();c.arc(q.x+Math.sin(t*.6+q.p)*14,y,1+q.s*2.2,0,TAU);c.fill()}
  c.strokeStyle=acc;c.globalAlpha=.05;for(let i=0;i<4;i++){c.beginPath();c.arc(W*.2*(i+1),0,H*.9,0,TAU);c.stroke()}break;
 case'gears':
  c.strokeStyle=col;c.lineWidth=2;
  for(let i=0;i<7;i++){const q=R(i),r=40+q.v*70;c.save();c.translate(q.x,q.y);c.globalAlpha=.09;poly(c,14,r,t*(i%2?.25:-.25)+q.p);c.stroke();c.beginPath();c.arc(0,0,r*.6,0,TAU);c.stroke();poly(c,6,r*.25,-t*.4);c.stroke();c.restore()}break;
 case'spores':
  c.fillStyle=col;
  for(let i=0;i<42;i++){const q=R(i),x=q.x+Math.sin(t*.3+q.p)*22,y=q.y+Math.cos(t*.25+q.p)*16,a=.5+.5*Math.sin(t*1.6+q.p);
   c.globalAlpha=.06*a;c.beginPath();c.arc(x,y,12+q.s*10,0,TAU);c.fill();c.globalAlpha=.5*a;c.beginPath();c.arc(x,y,1.6+q.s*2,0,TAU);c.fill()}break;
 case'debris':
  c.strokeStyle=col;c.lineWidth=1.5;
  for(let i=0;i<16;i++){const q=R(i),x=(q.x+t*(q.v-.5)*30+W)%W,y=q.y+Math.sin(t*.4+q.p)*16;c.save();c.translate(x,y);c.globalAlpha=.16;poly(c,3+(i%4),8+q.s*22,t*(q.v-.5)+q.p);c.stroke();c.restore()}break;
 case'storm':{
  const g=c.createLinearGradient(0,0,0,H*.5);g.addColorStop(0,col+'44');g.addColorStop(1,col+'00');c.fillStyle=g;c.globalAlpha=.7;c.fillRect(0,0,W,H*.5);
  const k=Math.floor(t/3),ph=t%3;
  if(ph<.18){const rs=n=>{const v=Math.sin((k*17+n)*12.9898)*43758.5453;return v-Math.floor(v)};
   let x=rs(1)*W,y=0;c.strokeStyle='#fff';c.lineWidth=2;c.globalAlpha=(1-ph/.18)*.9;c.beginPath();c.moveTo(x,y);
   for(let n=2;n<12;n++){x+=(rs(n)-.5)*70;y+=H/11;c.lineTo(x,y)}c.stroke();c.globalAlpha=(1-ph/.18)*.12;c.fillStyle=col;c.fillRect(0,0,W,H)}break}
 case'rays':
  for(let i=0;i<6;i++){const x=i*W/5+Math.sin(t*.2+i)*40;c.globalAlpha=.05+.04*Math.sin(t*.7+i);c.fillStyle=col;c.beginPath();c.moveTo(x,0);c.lineTo(x+70,0);c.lineTo(x-160,H);c.lineTo(x-230,H);c.fill()}
  c.fillStyle=col;for(let i=0;i<24;i++){const q=R(i);c.globalAlpha=.3*(.5+.5*Math.sin(t*2+q.p));c.fillRect(q.x,q.y,2,2)}break;
 case'skyline':
  for(let i=0;i<22;i++){const q=R(i),w=W/22,h=40+q.v*150,x=i*w;c.globalAlpha=.07;c.fillStyle=col;c.fillRect(x+2,0,w-4,h);
   c.globalAlpha=.25;c.fillStyle=acc;for(let y=10;y<h-6;y+=16){if(Math.sin(i*7+y+Math.floor(t*.5))>.2)c.fillRect(x+6,y,4,4)}}break;
 case'jelly':
  c.strokeStyle=col;c.lineWidth=1.5;
  for(let i=0;i<9;i++){const q=R(i),x=q.x+Math.sin(t*.3+q.p)*20,y=q.y+Math.sin(t*.5+q.p)*22,r=12+q.s*14*(1+.15*Math.sin(t*2+q.p));
   c.globalAlpha=.3;c.beginPath();c.arc(x,y,r,Math.PI,TAU);c.closePath();c.stroke();c.globalAlpha=.12;c.fillStyle=col;c.fill();
   c.globalAlpha=.2;for(let k=-2;k<=2;k++){c.beginPath();c.moveTo(x+k*r/3,y);c.quadraticCurveTo(x+k*r/3+Math.sin(t*2+k+q.p)*5,y+r,x+k*r/3,y+r*1.8);c.stroke()}}break;
 case'orbit':{
  const cx=W*.72,cy=H*.42;c.strokeStyle=col;c.lineWidth=1.5;
  for(let k=0;k<3;k++){c.save();c.translate(cx,cy);c.rotate(t*.04*(k+1)+k);c.globalAlpha=.1;c.beginPath();c.ellipse(0,0,140+k*70,50+k*22,0,0,TAU);c.stroke();
   c.globalAlpha=.7;c.fillStyle=col;c.beginPath();c.arc(Math.cos(t*(.5-k*.1))*(140+k*70),Math.sin(t*(.5-k*.1))*(50+k*22),4,0,TAU);c.fill();c.restore()}
  const g=c.createRadialGradient(cx,cy,0,cx,cy,60);g.addColorStop(0,col+'55');g.addColorStop(1,col+'00');c.globalAlpha=.8;c.fillStyle=g;c.beginPath();c.arc(cx,cy,60,0,TAU);c.fill();break}
 case'aurora':
  c.lineWidth=20;
  for(let k=0;k<5;k++){c.strokeStyle=k%2?acc:col;c.globalAlpha=.05+.02*Math.sin(t*.5+k);c.beginPath();for(let x=0;x<=W;x+=14){const y=H*.18+k*26+Math.sin(x*.01+t*.3+k)*34+Math.sin(x*.025-t*.5)*10;x?c.lineTo(x,y):c.moveTo(x,y)}c.stroke()}break;
 case'sand':
  c.strokeStyle=col;c.lineWidth=1;
  for(let i=0;i<50;i++){const q=R(i),y=(t*(60+q.v*90)+q.y)%H;c.globalAlpha=.2+.3*q.s;c.beginPath();c.moveTo(q.x,y);c.lineTo(q.x,y+6+q.s*8);c.stroke()}
  c.globalAlpha=.07;c.lineWidth=2;c.beginPath();c.moveTo(W/2-120,40);c.lineTo(W/2+120,40);c.lineTo(W/2,H/2);c.lineTo(W/2+120,H-40);c.lineTo(W/2-120,H-40);c.lineTo(W/2,H/2);c.closePath();c.stroke();break;
 case'matrix':{
  c.font='13px monospace';c.fillStyle=col;const ch='ｱｲｳｴｵｶｷｸｹｺｻｼｽｾｿ01';
  for(let i=0;i<26;i++){const q=R(i),x=i*W/26+4,y0=(t*(50+q.v*70)+q.y*4)%(H+240)-120;for(let k=0;k<7;k++){c.globalAlpha=(1-k/7)*.4;c.fillText(ch[(i*3+k+Math.floor(t*3+q.p))%ch.length],x,y0-k*14)}}break}
 case'void':
  c.strokeStyle=col;c.lineWidth=1.5;
  for(let k=0;k<5;k++){const r=(t*28+k*70)%350;c.globalAlpha=(1-r/350)*.18;c.beginPath();c.ellipse(W/2,H/2,r*1.3,r*.8,0,0,TAU);c.stroke()}
  c.fillStyle=col;for(let i=0;i<20;i++){const q=R(i);c.globalAlpha=.12+.2*Math.sin(t+q.p);c.beginPath();c.arc(q.x,q.y,2+q.s*3,0,TAU);c.fill()}break;
 case'swirl':
  c.fillStyle=col;
  for(let a=0;a<4;a++)for(let j=0;j<70;j++){const ang=a*1.571+j*.17+t*.25,rad=10+j*5.2;c.globalAlpha=.35*(1-j/70);c.fillRect(W/2+Math.cos(ang)*rad*1.3,H/2+Math.sin(ang)*rad*.8,2,2)}
  c.globalCompositeOperation='source-over';c.globalAlpha=.9;c.fillStyle='#000';c.beginPath();c.ellipse(W/2,H/2,34,22,0,0,TAU);c.fill();break;
 case'glitch':{
  const k=Math.floor(t*8),rs=n=>{const v=Math.sin((k*31+n)*12.9898)*43758.5453;return v-Math.floor(v)};
  for(let i=0;i<9;i++){c.globalAlpha=.09+.1*rs(i+50);c.fillStyle=['#ff3355','#ffffff','#33e0ff'][i%3];c.fillRect(rs(i)*W,rs(i+10)*H,30+rs(i+20)*220,2+rs(i+30)*8)}
  c.fillStyle=col;c.globalAlpha=.03;for(let y=0;y<H;y+=4)c.fillRect(0,y,W,1);break}
 }
 c.restore();
}
