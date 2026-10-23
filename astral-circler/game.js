const $=s=>document.querySelector(s);
const cv=$('#cv'),ctx=cv.getContext('2d');
const CS=48,COLS=18,ROWS=11;cv.width=COLS*CS;cv.height=ROWS*CS;
const TAU=Math.PI*2;
// ---------- 画像素材(img/) ----------
const IMG={};let imgLoaded=0;
const SPR={sprite:'en01',drone:'en02',reaper:'en03',splitter:'en04',golem:'en05',shielder:'en06',phantom:'en07',boss:'en08'};
const SPR_BASE={sprite:0,reaper:-Math.PI/4};
const IMG_TOTAL=STAGES.length+Object.keys(SPR).length;
function loadImg(k,src){const i=new Image();i.onload=()=>{IMG[k]=i;imgLoaded++;if(imgLoaded===IMG_TOTAL&&$('#select').style.display==='block')openSelect()};i.src=src}
STAGES.forEach((_,i)=>loadImg('bg'+i,`img/bg${String(i+1).padStart(2,'0')}.jpg`));
Object.values(SPR).forEach(v=>loadImg(v,`img/${v}.jpg`));
// ---------- 経路(ステージごとに構築) ----------
let WP,pts,segLen,total,pathCell,stage=0,pal=STAGES[0].pal;
const WPS=10;
const TUNE={hp:6,cnt:1,boss:1.25,b0:.3,b1:.12,spd:.015,atk:1,w0:.55,w1:.09,sf:.3,us:.55,uw:.45,c0:7,c1:1.2,c2:.4,m0:260,m1:45,mr:.15,thp:1.3,regen:.015,fin:.65};
function buildPath(wp){
 WP=wp;pts=WP.map(([c,r])=>({x:(c+.5)*CS,y:(r+.5)*CS}));
 segLen=[];total=0;
 for(let i=1;i<pts.length;i++){const l=Math.hypot(pts[i].x-pts[i-1].x,pts[i].y-pts[i-1].y);segLen.push(l);total+=l}
 pathCell=new Set();
 for(let i=1;i<WP.length;i++){const[a,b]=WP[i-1],[c,e]=WP[i];
  for(let x=Math.min(a,c);x<=Math.max(a,c);x++)for(let y=Math.min(b,e);y<=Math.max(b,e);y++)pathCell.add(x+','+y)}
}
function posAt(d){
 if(d<=0)return{x:pts[0].x,y:pts[0].y};
 for(let i=0;i<segLen.length;i++){
  if(d<=segLen[i]){const k=d/segLen[i];return{x:pts[i].x+(pts[i+1].x-pts[i].x)*k,y:pts[i].y+(pts[i+1].y-pts[i].y)*k}}
  d-=segLen[i];
 }
 return{x:pts[pts.length-1].x,y:pts[pts.length-1].y};
}
buildPath(STAGES[0].wp);
// ---------- 定義 ----------
const ELN={light:'光',thunder:'雷',void:'虚空',fire:'炎',ice:'氷',time:'時空'};
const TD={
 photon:{n:'フォトン・アレイ',sub:'集光陣',el:['light'],cost:60,col:'#bfe4ff',sides:3,range:3.4,desc:'単体を持続照射。当て続けるほど威力上昇。'},
 plasma:{n:'プラズマ・ノヴァ',sub:'電磁爆陣',el:['thunder'],cost:70,col:'#5ab4ff',sides:6,range:2.8,desc:'電撃が敵から敵へ跳ねて連鎖。微スタン。'},
 void:{n:'ヴォイド・シンク',sub:'重力歪陣',el:['void'],cost:80,col:'#b06bff',sides:5,range:2.6,desc:'範囲内の敵を大幅減速し、引き戻す。'},
 solar:{n:'ソーラー・フレア',sub:'熱核焔陣',el:['fire'],cost:75,col:'#ff8a3c',sides:8,range:3.0,desc:'燃焼ゾーンを設置。継続ダメージと防御低下。'},
 crystal:{n:'クリスタル・アイシス',sub:'絶対零陣',el:['ice'],cost:80,col:'#8ff0ff',sides:6,range:2.4,desc:'範囲に冷気。3回当たると完全凍結。'},
 tachyon:{n:'タキオン・バースト',sub:'時間衝陣',el:['time'],cost:90,col:'#ffd34d',sides:12,range:3.0,desc:'周期的な衝撃波で敵を押し戻す。'},
 prism:{n:'プリズム・アンプ',sub:'屈折増幅陣',el:[],cost:60,col:'#ff7ad9',sides:4,range:0,desc:'攻撃しない。隣接する陣の標的数・範囲を増やす。'}
};
const FD={
 supernova:{n:'超新星砲',from:['solar','plasma'],el:['fire','thunder'],col:'#fff0a8',col2:'#ff7a2a',sides:6,sides2:3,range:4.0,desc:'極太ビームと大爆発、跡に炎。'},
 zero:{n:'絶対零度特異点',from:['crystal','tachyon'],el:['ice','time'],col:'#9fd0ff',col2:'#ffd34d',sides:5,sides2:6,range:3.2,desc:'強烈な減速と高速凍結。'},
 kaleido:{n:'雷光万華鏡',from:['plasma','prism'],el:['thunder','light'],col:'#e08cff',col2:'#5ab4ff',sides:6,sides2:4,range:3.6,desc:'6体へ連鎖する電光を高速で放つ。'},
 chrono:{n:'時空崩落',from:['tachyon','void'],el:['time','void'],col:'#ffe08a',col2:'#b06bff',sides:12,sides2:5,range:3.6,desc:'大きく押し戻し、減速し、破砕。'},
 aurora:{n:'虹彩極光',from:['photon','prism'],el:['light'],col:'#9dffea',col2:'#ff7ad9',sides:3,sides2:4,range:3.8,desc:'5本のビームが同時に敵を焼く。'},
 helios:{n:'ヘリオス・キャノン',from:['photon','solar'],el:['light','fire'],col:'#ffffff',col2:'#ff8a3c',sides:3,sides2:8,range:3.8,desc:'直線上の全敵を貫く熱線。焼灼で防御低下。'},
 entropy:{n:'アブソリュート・エントロピー',from:['void','crystal'],el:['void','ice'],col:'#b06bff',col2:'#8ff0ff',sides:5,sides2:6,range:3.2,desc:'引き寄せて減速し、周期的に集団を即時凍結。'},
 gamma:{n:'ガンマ・ストライク',from:['plasma','photon'],el:['thunder','light'],col:'#7ad0ff',col2:'#ffffff',sides:6,sides2:3,range:3.4,desc:'撃った敵から周囲へ光の針が放射。'},
 magnetar:{n:'マグネター・ウェール',from:['void','plasma'],el:['void','thunder'],col:'#c07cff',col2:'#5ab4ff',sides:5,sides2:6,range:3.0,desc:'吸引しつつ放電。スタンと減速。'},
 cinferno:{n:'クロノ・インフェルノ',from:['solar','tachyon'],el:['fire','time'],col:'#ffb04a',col2:'#ffd34d',sides:12,sides2:8,range:3.2,desc:'範囲の敵を鈍化させ、燃焼を超加速。'},
 hyper:{n:'ハイパー・リフレクター',from:['prism','(他の陣)'],el:[],col:'#ff7ad9',col2:'#ff7ad9',sides:4,sides2:6,range:3,desc:'重ねた陣の攻撃を3方向に分裂、射程1.5倍。'},
 steam:{n:'蒸気爆縁',from:['solar','crystal'],el:['fire','ice'],col:'#ffd0b0',col2:'#8ff0ff',sides:8,sides2:6,range:3.2,desc:'先頭の敵に水蒸気爆発。'}
};
const T=tw=>tw.def||TD[tw.kind]||FD[tw.kind];
function recipe(a,b){if(a===b)return null;for(const k in FD){const f=FD[k].from;if(f.includes(a)&&f.includes(b))return k}
 if((a==='prism'&&TD[b])||(b==='prism'&&TD[a]))return'hyper';return null}
function segDist(px,py,ax,ay,bx,by){const dx=bx-ax,dy=by-ay,l=dx*dx+dy*dy||1;let t=((px-ax)*dx+(py-ay)*dy)/l;t=Math.max(0,Math.min(1,t));return Math.hypot(px-(ax+dx*t),py-(ay+dy*t))}
const ED={
 sprite:{n:'グリッチ・ダスト',hp:34,spd:78,r:8,weak:['thunder'],res:[],mana:3,col:'#ff5c8a',sides:3},
 drone:{n:'エーテル・スウォーム',hp:90,spd:52,r:10,weak:['fire','thunder'],res:[],mana:5,col:'#ff9a5c',sides:4,regen:5},
 reaper:{n:'タキオン・ライダー',hp:120,spd:96,r:9,weak:['ice'],res:[],mana:6,col:'#ffe45c',sides:3},
 splitter:{n:'アノマリー・ポッド',hp:170,spd:50,r:11,weak:['thunder'],res:['light'],mana:7,col:'#7cff9a',sides:0},
 golem:{n:'クアッド・ゴーレム',hp:420,spd:30,r:15,weak:['fire'],res:['thunder'],mana:12,col:'#c07cff',sides:4},
 shielder:{n:'ヌル・シールド',hp:260,spd:44,r:12,weak:['void'],res:['light'],mana:10,col:'#7cd8ff',sides:6,regen:10},
 phantom:{n:'フェーズ・ストーカー',hp:200,spd:62,r:11,weak:['void'],res:['time'],mana:9,col:'#e0e0ff',sides:0},
 boss:{n:'崩壊特異点 オメガ・ノイズ',hp:4000,spd:24,r:26,weak:['time'],res:[],mana:150,col:'#ff3355',sides:8}
};
// 敵の攻撃(陣を壊しに来る)
ED.sprite.atk={kind:'shot',cd:3.2,range:2,dmg:4};
ED.drone.atk={kind:'shot',cd:2.2,range:3.4,dmg:10};
ED.splitter.atk={kind:'shot',cd:3,range:2.6,dmg:7};
ED.shielder.atk={kind:'shot',cd:3.4,range:3,dmg:9};
ED.reaper.atk={kind:'shot',cd:1.6,range:2.6,dmg:8};
ED.golem.atk={kind:'slam',cd:3.6,range:2,dmg:34};
ED.phantom.atk={kind:'drain',range:3.2,dmg:15};
ED.boss.atk={kind:'volley',cd:2.8,range:9,dmg:22,n:5};
// ---------- 状態 ----------
let mana=220,hp=20,wave=0,gt=0,speed=1,over=true,shake=0,sel=null,picked=null,mouse={c:-1,r:-1};
let shots=[],paused=false;
let curSrc=null,inBurst=false,ovl=0,barrier=0,linkCut=0;
let towers=[],enemies=[],zones=[],parts=[],fx=[],queue=[],cleared=true;
const sk={nova:{cd:0,max:70},surge:{cd:0,max:50},stasis:{cd:0,max:45},harvest:{cd:0,max:40},barrier:{cd:0,max:60}};
const stars=Array.from({length:90},()=>({x:Math.random()*cv.width,y:Math.random()*cv.height,s:Math.random()*1.5+.3,p:Math.random()*6}));
// ---------- 音 ----------
const sndLast={};
function snd(name,f,d=.1,type='sine',v=.04,slide=0){
 const now=performance.now();if(sndLast[name]&&now-sndLast[name]<80)return;sndLast[name]=now;
 const AC=BGM.ctx();if(!AC)return;
 try{const o=AC.createOscillator(),g=AC.createGain(),t=AC.currentTime;
  o.type=type;o.frequency.setValueAtTime(f,t);if(slide)o.frequency.exponentialRampToValueAtTime(Math.max(30,f+slide),t+d);
  g.gain.setValueAtTime(v,t);g.gain.exponentialRampToValueAtTime(.0001,t+d);o.connect(g);g.connect(BGM.sfxBus());o.start();o.stop(t+d)}catch(e){}
}
// ---------- 描画部品 ----------
function poly(c,n,r,rot){c.beginPath();for(let i=0;i<n;i++){const a=rot+i*TAU/n,x=Math.cos(a)*r,y=Math.sin(a)*r;i?c.lineTo(x,y):c.moveTo(x,y)}c.closePath()}
function drawMagic(c,x,y,R,col,t,o={}){
 const sides=o.sides||6,lv=o.lv||1,fused=!!o.fused,col2=o.col2||col,flash=o.flash||0,alpha=o.alpha==null?1:o.alpha;
 c.save();c.translate(x,y);c.globalCompositeOperation='lighter';
 c.globalAlpha=alpha*(.55+flash*.45);
 const g=c.createRadialGradient(0,0,0,0,0,R*1.6);g.addColorStop(0,col+'99');g.addColorStop(1,col+'00');
 c.fillStyle=g;c.beginPath();c.arc(0,0,R*1.6*(1+flash*.35),0,TAU);c.fill();
 c.globalAlpha=alpha;c.strokeStyle=col;
 c.lineWidth=2;c.beginPath();c.arc(0,0,R,0,TAU);c.stroke();
 c.globalAlpha=alpha*.3;c.lineWidth=6;c.stroke();c.globalAlpha=alpha;
 c.lineWidth=1.5;c.setLineDash([5,4]);c.lineDashOffset=-t*22;c.beginPath();c.arc(0,0,R*.88,0,TAU);c.stroke();c.setLineDash([]);
 c.lineWidth=1.6;poly(c,sides,R*.8,t*.9);c.stroke();poly(c,sides,R*.8,t*.9+Math.PI/sides);c.stroke();
 const nt=12+lv*3;c.lineWidth=1.5;
 for(let i=0;i<nt;i++){const a=i/nt*TAU-t*.35,l=i%3===0?7:3.5;c.beginPath();c.moveTo(Math.cos(a)*R*.94,Math.sin(a)*R*.94);c.lineTo(Math.cos(a)*(R*.94+l),Math.sin(a)*(R*.94+l));c.stroke()}
 c.strokeStyle=fused?col2:col;poly(c,fused?(o.sides2||5):sides+1,R*.46,-t*1.4);c.stroke();
 c.beginPath();c.arc(0,0,R*.28,0,TAU);c.stroke();
 for(let k=1;k<lv;k++){c.globalAlpha=alpha*.7;c.setLineDash([2,6]);c.lineDashOffset=t*30*k;c.beginPath();c.arc(0,0,R*(1.1+k*.12),0,TAU);c.stroke();c.setLineDash([])}
 if(fused){c.globalAlpha=alpha;c.strokeStyle=col2;c.lineWidth=2;const s2=o.sides2||6;poly(c,s2,R*1.2,-t*.5);c.stroke();poly(c,s2,R*1.2,-t*.5+Math.PI/s2);c.stroke();
  c.lineWidth=1;c.setLineDash([3,5]);c.lineDashOffset=t*25;c.beginPath();c.arc(0,0,R*1.38,0,TAU);c.stroke();c.setLineDash([])}
 c.fillStyle='#fff';c.globalAlpha=alpha*.9;c.beginPath();c.arc(0,0,R*.1+flash*3,0,TAU);c.fill();
 c.restore();
}
function beam(c,x1,y1,x2,y2,col,w,a=1){
 c.save();c.globalCompositeOperation='lighter';c.lineCap='round';
 c.strokeStyle=col;c.globalAlpha=.14*a;c.lineWidth=w*3.2;c.beginPath();c.moveTo(x1,y1);c.lineTo(x2,y2);c.stroke();
 c.globalAlpha=.4*a;c.lineWidth=w*1.5;c.stroke();
 c.strokeStyle='#fff';c.globalAlpha=.95*a;c.lineWidth=w*.5;c.stroke();c.restore();
}
function addFx(life,draw){fx.push({life,max:life,draw})}
function ring(x,y,r0,r1,col,life,w=3){addFx(life,(c,k)=>{c.save();c.globalCompositeOperation='lighter';c.globalAlpha=1-k;c.strokeStyle=col;c.lineWidth=w*(1-k)+1;c.beginPath();c.arc(x,y,r0+(r1-r0)*Math.sin(k*Math.PI/2),0,TAU);c.stroke();c.restore()})}
function bolt(a,b,col,life=.25){
 const n=7,p=[{x:a.x,y:a.y}];
 for(let i=1;i<n;i++){const k=i/n;p.push({x:a.x+(b.x-a.x)*k+(Math.random()-.5)*18,y:a.y+(b.y-a.y)*k+(Math.random()-.5)*18})}
 p.push({x:b.x,y:b.y});
 addFx(life,(c,k)=>{c.save();c.globalCompositeOperation='lighter';c.lineJoin='round';
  for(const[w,al,cl]of[[6,.2,col],[3,.5,col],[1.2,1,'#fff']]){c.strokeStyle=cl;c.globalAlpha=(1-k)*al;c.lineWidth=w;c.beginPath();p.forEach((q,i)=>i?c.lineTo(q.x,q.y):c.moveTo(q.x,q.y));c.stroke()}c.restore()});
}
function burst(x,y,col,n=10,sp=120,life=.5,size=2.5){for(let i=0;i<n;i++){const a=Math.random()*TAU,s=Math.random()*sp;parts.push({x,y,vx:Math.cos(a)*s,vy:Math.sin(a)*s,life:life*(.5+Math.random()*.6),max:life,col,size:size*(.5+Math.random())})}}
// ---------- 戦闘 ----------
function lvMul(tw){return 1+.6*(tw.lv-1)}
function dmg(e,a,els){
 if(e.dead)return;const D=ED[e.type];let m=1;
 if(els&&els.length){let weak=els.some(x=>D.weak.includes(x));if(weak)m=1.5;else if(els.every(x=>D.res.includes(x)))m=.6}
 if(e.vuln>0)m*=1.25;
 if(e.guard&&e.type!=='shielder')m*=.75;
 e.hp-=a*m;e.hit=.12;if(e.hp<=0)kill(e);
}
function kill(e){
 if(e.dead)return;e.dead=true;const D=ED[e.type];mana+=D.mana*(1+(e.sc-1)*TUNE.mr);
 for(const k in sk)sk[k].cd=Math.max(0,sk[k].cd-.6);
 burst(e.x,e.y,D.col,e.type==='boss'?80:12,e.type==='boss'?320:130,.6);
 ring(e.x,e.y,4,e.type==='boss'?120:26,D.col,.4,2);
 snd('kill',320+Math.random()*120,.08,'triangle',.025,-200);
 if(e.type==='splitter'){for(const t of towers)if(Math.hypot(t.x-e.x,t.y-e.y)<CS*2.5){t.dis=3;ring(t.x,t.y,4,36,'#7cff9a',.5,3);hurt(t,15)}}
 if(curSrc&&!inBurst)chainBurst(curSrc);
 if(e.type==='boss'){BGM.boss(enemies.some(x=>x.type==='boss'&&!x.dead));shake=Math.max(shake,18);snd('boss',90,.8,'sawtooth',.08,-50)}
}
// ---------- 連鎖コンボ(段階演出・最大級フィナーレ) ----------
const CH=[8,20,36,60],COMBO_WIN=3,FINALE_CD=12;
const LV_COL=['#9fd0ff','#7affc8','#ffd34d','#ff9a3c','#ff4fd8'],LV_TXT=['','CHAIN!','SUPER CHAIN!!','ULTRA CHAIN!!!','MAXIMUM CHAIN!!!!'];
let combo=0,comboT=0,comboLv=0,comboPop=0,finaleCd=0;
function tone(type,f,delay,dur,v,endF){const A=BGM.ctx();if(!A)return;
 try{const o=A.createOscillator(),g=A.createGain(),t=A.currentTime+delay;o.type=type;o.frequency.setValueAtTime(f,t);if(endF)o.frequency.exponentialRampToValueAtTime(endF,t+dur);
  g.gain.setValueAtTime(v,t);g.gain.exponentialRampToValueAtTime(.0001,t+dur);o.connect(g);g.connect(BGM.sfxBus());o.start(t);o.stop(t+dur+.02)}catch(e){}}
let nzBuf=null;
function noiseHit(delay,dur,v,f0,f1){const A=BGM.ctx();if(!A)return;
 try{if(!nzBuf){nzBuf=A.createBuffer(1,A.sampleRate,A.sampleRate);const d=nzBuf.getChannelData(0);for(let i=0;i<d.length;i++)d[i]=Math.random()*2-1}
  const s=A.createBufferSource(),f=A.createBiquadFilter(),g=A.createGain(),t=A.currentTime+delay;s.buffer=nzBuf;f.type='lowpass';f.frequency.setValueAtTime(f0,t);f.frequency.exponentialRampToValueAtTime(f1,t+dur);
  g.gain.setValueAtTime(v,t);g.gain.exponentialRampToValueAtTime(.0001,t+dur);s.connect(f);f.connect(g);g.connect(BGM.sfxBus());s.start(t);s.stop(t+dur+.02)}catch(e){}}
function chime(n){const pen=[0,2,4,7,9],m=69+pen[n%5]+12*Math.min(3,Math.floor(n/5)),f=440*Math.pow(2,(m-69)/12);
 tone('triangle',f,0,.28,.03+.006*comboLv);if(comboLv>=2)tone('sine',f*2,0,.22,.018);if(comboLv>=3)tone('square',f/2,0,.12,.012)}
function fanfare(lv){const base=[261.6,329.6,392,523.3,659.3,784,1046.5];
 for(let i=0;i<lv*2+2;i++)tone('sawtooth',base[i%7]*(i>6?2:1),i*.06,.4,.035,base[i%7]*(i>6?2:1)*1.01);
 noiseHit(0,.5,.12*lv,3000+lv*1500,300)}
function bigCircle(c,cx,cy,R,t,a){
 const cols=['#ffe9a0',pal.acc,'#ffffff'];
 c.save();c.translate(cx,cy);c.globalAlpha=a;c.lineJoin='round';
 [[1,7,0],[.93,3,1],[.78,5,0],[.45,4,1],[.2,6,2]].forEach(([f,w,ci])=>{c.strokeStyle=cols[ci];c.lineWidth=w;c.beginPath();c.arc(0,0,R*f,0,TAU);c.stroke()});
 c.setLineDash([16,12]);c.lineDashOffset=-t*90;c.lineWidth=3;c.strokeStyle=cols[1];c.beginPath();c.arc(0,0,R*.86,0,TAU);c.stroke();c.setLineDash([]);
 [[6,.8,.5],[8,.64,-.7],[12,.52,.9],[3,.36,-1.3]].forEach(([n,f,sp],i)=>{c.strokeStyle=cols[i%3];c.lineWidth=3;poly(c,n,R*f,t*sp);c.stroke();poly(c,n,R*f,t*sp+Math.PI/n);c.stroke()});
 for(let i=0;i<72;i++){const ang=i/72*TAU+t*.2,l=i%6===0?R*.07:R*.035;c.strokeStyle=cols[0];c.lineWidth=i%6===0?3:1.5;c.beginPath();c.moveTo(Math.cos(ang)*R,Math.sin(ang)*R);c.lineTo(Math.cos(ang)*(R-l),Math.sin(ang)*(R-l));c.stroke()}
 const gl='ᚠᚢᚦᚨᚱᚲᚷᚹᚺᚾᛁᛃᛇᛈᛉᛊᛏᛒᛖᛗᛚᛜᛞᛟ';c.fillStyle=cols[0];c.font=`${Math.round(R*.075)}px "Segoe UI Historic","Segoe UI Symbol",serif`;c.textAlign='center';c.textBaseline='middle';
 for(let i=0;i<24;i++){c.save();c.rotate(i/24*TAU-t*.35);c.fillText(gl[i],0,-R*.86);c.restore()}
 c.lineWidth=2;c.strokeStyle=cols[1];for(let i=0;i<24;i++){const ang=i/24*TAU+t*.5;c.beginPath();c.moveTo(Math.cos(ang)*R*.2,Math.sin(ang)*R*.2);c.lineTo(Math.cos(ang)*R*.45,Math.sin(ang)*R*.45);c.stroke()}
 const g=c.createRadialGradient(0,0,0,0,0,R*.3);g.addColorStop(0,'#ffffffee');g.addColorStop(.4,cols[0]+'88');g.addColorStop(1,cols[0]+'00');c.fillStyle=g;c.beginPath();c.arc(0,0,R*.3,0,TAU);c.fill();
 c.restore();
}
function finale(){
 finaleCd=FINALE_CD;if(codexAdd('c:4'))setTimeout(()=>codexNew('c:4'),3200);const W=cv.width,H=cv.height,cx=W/2,cy=H/2,Rm=Math.max(W,H)*.52;
 shake=Math.max(shake,34);
 tone('sine',90,0,1.5,.55,28);tone('sawtooth',110,0,.8,.05,1760);noiseHit(0,1.8,.5,7000,180);
 [220,277.2,329.6,440,554.4,659.3].forEach((f,i)=>tone('sawtooth',f,.15+i*.05,2.2,.035,f*1.02));
 tone('triangle',880,.9,1.6,.05,1760);BGM.duck(3);
 addFx(3.8,(c,k)=>{
  const t=k*3.8,g=Math.min(1,t/.8),e=1-Math.pow(1-g,3),fade=t>2.8?Math.max(0,1-(t-2.8)):1;
  c.save();c.globalCompositeOperation='lighter';
  if(t<.4){c.globalAlpha=(1-t/.4)*.95;c.fillStyle='#fff';c.fillRect(0,0,W,H)}
  c.globalAlpha=.22*fade*Math.min(1,t*3);c.fillStyle=pal.acc;c.fillRect(0,0,W,H);
  for(let i=0;i<16;i++){const ang=i/16*TAU+t*.4;c.globalAlpha=.35*fade*e;c.strokeStyle=i%2?'#ffe9a0':pal.acc;c.lineWidth=14;c.beginPath();c.moveTo(cx,cy);c.lineTo(cx+Math.cos(ang)*Rm*1.6,cy+Math.sin(ang)*Rm*1.6);c.stroke()}
  bigCircle(c,cx,cy,Rm*e,t,fade);
  bigCircle(c,cx,cy,Rm*.55*e,-t*1.4,fade*.9);
  for(let r=0;r<3;r++){const q=(t*.9-r*.35);if(q>0&&q<1.2){c.globalAlpha=(1-q/1.2)*fade;c.strokeStyle='#fff';c.lineWidth=8*(1-q/1.2)+1;c.beginPath();c.arc(cx,cy,q*Rm*1.5,0,TAU);c.stroke()}}
  if(t>.3&&t<1){c.globalAlpha=Math.min(1,(t-.3)*3)*fade;c.fillStyle='#fff';c.font='900 64px sans-serif';c.textAlign='center';c.textBaseline='middle';c.shadowColor='#ffd34d';c.shadowBlur=30;c.fillText('MAXIMUM CHAIN',cx,H-70)}
  c.restore()});
 timers.push({at:gt+.6,fn:()=>{
  for(const e of enemies){dmg(e,400+e.max*(e.type==='boss'?.12:.4),[]);e.stun=Math.max(e.stun,3);burst(e.x,e.y,'#ffe9a0',14,260,.9,3.5)}
  for(const t of towers){t.flash=1;ring(t.x,t.y,4,CS*2.5,'#fff',.7,5)}
  mana+=150;msg('MAXIMUM CHAIN!  魔力+150');shake=Math.max(shake,26)}});
 combo=0;comboLv=0;
}
function levelUp(lv){
 const W=cv.width,H=cv.height,col=LV_COL[lv];fanfare(lv);if(codexAdd('c:'+lv))setTimeout(()=>codexNew('c:'+lv),900);shake=Math.max(shake,4+lv*3);
 for(const t of towers){ring(t.x,t.y,6,CS*(1.5+lv*.7),col,.6,4);if(lv>=2)ring(t.x,t.y,3,CS*(1+lv*.5),'#fff',.45,2)}
 addFx(1.3,(c,k)=>{c.save();c.globalAlpha=1-Math.pow(k,3);const sc=1+(1-Math.min(1,k*5))*.6;c.translate(W/2,H*.26);c.scale(sc,sc);
  c.font=`900 ${34+lv*6}px sans-serif`;c.textAlign='center';c.textBaseline='middle';c.fillStyle=col;c.shadowColor=col;c.shadowBlur=24;c.fillText(LV_TXT[lv],0,0);c.restore()});
}
function addCombo(x,y){
 combo++;comboT=0;comboPop=1;chime(combo);
 const lv=combo>=CH[3]?4:combo>=CH[2]?3:combo>=CH[1]?2:combo>=CH[0]?1:0;
 if(lv>comboLv&&lv<4){comboLv=lv;levelUp(lv)}
 if(comboLv>=2)ring(x,y,6,CS*(1+comboLv*.5),LV_COL[comboLv],.5,3);
 if(comboLv>=3&&towers.length&&enemies.length&&Math.random()<.6)bolt(towers[Math.floor(Math.random()*towers.length)],enemies[Math.floor(Math.random()*enemies.length)],'#ffe9a0',.3);
 if(lv>=4&&finaleCd<=0)finale();
}
function drawCombo(c,t){
 const W=cv.width,H=cv.height;
 if(comboLv>=2){const g=c.createRadialGradient(W/2,H/2,H*.35,W/2,H/2,H*.9);g.addColorStop(0,'#0000');g.addColorStop(1,LV_COL[comboLv]+(comboLv>=3?'55':'33'));c.save();c.globalCompositeOperation='lighter';c.globalAlpha=.7+.3*Math.sin(t*8);c.fillStyle=g;c.fillRect(0,0,W,H);c.restore()}
 if(combo<2)return;
 const col=LV_COL[comboLv],sc=1+comboPop*.45;
 c.save();c.translate(W-90,70);c.scale(sc,sc);c.textAlign='center';c.textBaseline='middle';c.shadowColor=col;c.shadowBlur=18;
 c.fillStyle='#fff';c.font='700 15px sans-serif';c.fillText('CHAIN',0,-34);
 c.fillStyle=col;c.font=`900 ${46+comboLv*5}px sans-serif`;c.fillText(String(combo),0,0);
 c.restore();
 c.save();const bw=150,bx=W-90-bw/2,by=108;c.fillStyle='#0008';c.fillRect(bx,by,bw,6);c.fillStyle=col;c.fillRect(bx,by,bw*Math.min(1,combo/CH[3]),6);
 c.fillStyle='#fff6';c.fillRect(bx,by+8,bw*Math.max(0,1-comboT/(COMBO_WIN+comboLv*.2)),2);c.restore();
}
let timers=[];
function chainBurst(origin){
 const seen=new Set([origin]);let q=[{t:origin,d:0}];
 while(q.length){const{t,d}=q.shift();if(d>4)break;
  timers.push({at:gt+d*.08,fn:()=>{inBurst=true;addCombo(t.x,t.y);const D=T(t);ring(t.x,t.y,4,CS*1.3,D.col,.4,3);
   for(const e of inRange(t.x,t.y,CS*1.3))dmg(e,12*Math.pow(.85,d),D.el);inBurst=false}});
  for(const n of t.links)if(!seen.has(n)){seen.add(n);q.push({t:n,d:d+1})}}
}
const towerMax=tw=>Math.round((tw.fused?170:100)*TUNE.thp*(1+.4*(tw.lv-1)));
function refreshHp(tw){const m=towerMax(tw);tw.hp=Math.min(m,tw.hp+(m-tw.maxHp));tw.maxHp=m}
function nearestTower(x,y,r){let b=null,bd=r*r;for(const t of towers){const d=(t.x-x)**2+(t.y-y)**2;if(d<bd){bd=d;b=t}}return b}
function hurt(tw,a,quiet){
 if(!towers.includes(tw))return;
 tw.hp-=a;tw.lastHit=gt;tw.flash=Math.max(tw.flash,.6);
 if(!quiet){burst(tw.x,tw.y,'#ff5060',6,100,.4,2.5);snd('thit',160,.12,'square',.03,-60)}
 if(tw.hp<=0)breakTower(tw);
}
function breakTower(tw){
 const D=T(tw);towers=towers.filter(t=>t!==tw);if(picked===tw)picked=null;
 ring(tw.x,tw.y,4,CS*2.6,'#ff3355',.7,7);ring(tw.x,tw.y,3,CS*1.6,'#fff',.5,4);burst(tw.x,tw.y,D.col,50,260,.9,3.5);burst(tw.x,tw.y,'#ff3355',24,200,.7,3);
 shake=Math.max(shake,12);snd('tbreak',140,.5,'sawtooth',.07,-110);
 relink();info();msg(`${D.n} が破壊された!`);
}
function enemyAttack(e,A,dt){
 const sc=(1+(e.sc-1)*.15)*TUNE.atk,col=ED[e.type].col;
 if(A.kind==='drain'){const t=nearestTower(e.x,e.y,A.range*CS);e.drainT=t;if(t)hurt(t,A.dmg*sc*dt,true);return}
 e.ac-=dt;if(e.ac>0)return;
 const t=nearestTower(e.x,e.y,A.range*CS);if(!t){e.ac=.3;return}
 e.ac=A.cd;
 if(A.kind==='shot')shots.push({x:e.x,y:e.y,t,dmg:A.dmg*sc,col,sp:260});
 else if(A.kind==='slam'){ring(e.x,e.y,6,A.range*CS,col,.5,6);ring(e.x,e.y,3,A.range*CS*.6,'#fff',.3,3);shake=Math.max(shake,3);snd('slam',90,.25,'square',.05,-40);
  for(const tw of towers.slice())if(Math.hypot(tw.x-e.x,tw.y-e.y)<=A.range*CS)hurt(tw,A.dmg*sc)}
 else if(A.kind==='volley'){for(let i=0;i<A.n;i++){const tt=towers[Math.floor(Math.random()*towers.length)];shots.push({x:e.x,y:e.y,t:tt,dmg:A.dmg*sc,col:'#ff3355',sp:300})}snd('volley',200,.3,'sawtooth',.05,-120)}
}
function updShots(dt){
 for(const s of shots){
  if(!towers.includes(s.t)){s.dead=true;continue}
  const dx=s.t.x-s.x,dy=s.t.y-s.y,d=Math.hypot(dx,dy),st=s.sp*dt;
  if(d<=st+8){hurt(s.t,s.dmg);s.dead=true;continue}
  s.x+=dx/d*st;s.y+=dy/d*st;parts.push({x:s.x,y:s.y,vx:0,vy:0,life:.25,max:.25,col:s.col,size:3});
 }
 shots=shots.filter(s=>!s.dead);
}
function repair(){
 if(!picked)return;const m=picked.maxHp;if(picked.hp>=m)return msg('耐久は満タンです');
 const cost=Math.ceil((T(picked).cost||80)*.3);if(mana<cost)return msg(`修理には魔力${cost}が必要`);
 mana-=cost;picked.hp=m;ring(picked.x,picked.y,4,CS*1.6,'#7cff9a',.6,4);burst(picked.x,picked.y,'#7cff9a',16,120,.6);snd('rep',700,.3,'triangle',.04,500);info();msg(`${T(picked).n} を修理 -${cost}`);
}
function spawn(type,sc,d=0){
 const D=ED[type];const e={type,sc,d,hp:D.hp*sc,max:D.hp*sc,x:0,y:0,slowT:0,slowA:0,freeze:0,stun:0,vuln:0,stacks:0,hit:0,dead:false,bt:5,ph:Math.random()*6,ac:Math.random()*2,drainT:null};
 const p=posAt(d);e.x=p.x;e.y=p.y;enemies.push(e);if(type==='boss')BGM.boss(true);return e;
}
function inRange(x,y,r){const r2=r*r;return enemies.filter(e=>!e.dead&&(e.x-x)**2+(e.y-y)**2<=r2)}
function targets(tw,n){return inRange(tw.x,tw.y,tw.R).sort((a,b)=>b.d-a.d).slice(0,n)}
function relink(){
 for(const t of towers){t.links=linkCut>0?[]:towers.filter(o=>o!==t&&Math.abs(o.c-t.c)<=1&&Math.abs(o.r-t.r)<=1);
  t.prism=(t.kind==='prism'?0:t.links.filter(o=>o.kind==='prism').length)+(t.kind==='hyper'?1:0);
  t.mul=1+.15*Math.min(4,t.links.length)}
}
function pulse(tw,depth){
 for(const nb of tw.links){
  const ax=tw.x,ay=tw.y,bx=nb.x,by=nb.y;
  addFx(.3,(c,k)=>{c.save();c.globalCompositeOperation='lighter';c.strokeStyle=T(tw).col;c.globalAlpha=(1-k)*.9;c.lineWidth=2.5;
   const x=ax+(bx-ax)*k,y=ay+(by-ay)*k;c.beginPath();c.moveTo(ax+(bx-ax)*Math.max(0,k-.35),ay+(by-ay)*Math.max(0,k-.35));c.lineTo(x,y);c.stroke();
   c.fillStyle='#fff';c.beginPath();c.arc(x,y,3,0,TAU);c.fill();c.restore()});
  nb.flash=Math.min(1,nb.flash+.5);
  if(depth<3&&nb.kind!=='prism'&&nb.cd>0.2&&Math.random()<.22){nb.cd=0;nb.chain=depth+1;nb.flash=1;addCombo(nb.x,nb.y)}
 }
}
function fired(tw){tw.flash=1;pulse(tw,tw.chain||0);tw.chain=0}
function explode(x,y,r,a,els,col,vuln){
 for(const e of inRange(x,y,r)){dmg(e,a,els);if(vuln)e.vuln=Math.max(e.vuln,2)}
 ring(x,y,6,r,col,.45,5);ring(x,y,3,r*.6,'#fff',.3,3);burst(x,y,col,26,200,.6,3);shake=Math.max(shake,5);
}
function updTower(tw,dt){
 const D=T(tw);tw.rot+=dt;tw.flash=Math.max(0,tw.flash-dt*2.5);
 tw.R=D.range*CS*(1+.08*(tw.lv-1))*(1+.12*tw.prism)*(tw.kind==='hyper'?1.5:1);
 const kind=tw.kind==='hyper'?tw.sub:tw.kind;
 if(tw.dis>0){tw.dis-=dt;return}
 if(D.range===0)return;
 const boost=ovl>0?2:1,mul=tw.mul*lvMul(tw)*boost,ex=2*tw.prism,els=D.el;
 const per=(p,f)=>{tw.cd-=dt*tw.mul*boost;if(tw.cd>0)return;const ts=f();if(ts){tw.cd=p;fired(tw)}else tw.cd=0};
 switch(kind){
 case'photon':{
  const ts=targets(tw,1+tw.prism);
  if(ts.length){tw.ramp=Math.min(tw.ramp+dt,4);tw.beam=ts;for(const e of ts)dmg(e,24*(1+tw.ramp*.6)*mul*dt,els);
   tw.cd-=dt;if(tw.cd<=0){tw.cd=1;tw.flash=1;pulse(tw,99)}snd('ph',520,.05,'sine',.012)}
  else{tw.ramp=0;tw.beam=null}break}
 case'plasma':per(1.1,()=>{
  const f=targets(tw,1)[0];if(!f)return false;
  const hit=new Set([f]);let cur=f;dmg(f,16*mul,els);f.stun=.25;
  for(let i=0,n=2+tw.lv+ex;i<n;i++){const nx=inRange(cur.x,cur.y,CS*2.2).filter(e=>!hit.has(e))[0];if(!nx)break;bolt(cur,nx,D.col);hit.add(nx);dmg(nx,16*mul,els);nx.stun=.25;cur=nx}
  bolt({x:tw.x,y:tw.y},f,D.col);snd('pl',700,.12,'sawtooth',.02,-400);return true});break;
 case'void':{
  for(const e of inRange(tw.x,tw.y,tw.R)){e.slowT=.25;e.slowA=Math.max(e.slowA,.55+.05*tw.lv);e.d=Math.max(0,e.d-16*dt);dmg(e,5*mul*dt,els)}
  tw.cd-=dt;if(tw.cd<=0){tw.cd=1.4;ring(tw.x,tw.y,tw.R,8,D.col,.8,2)}break}
 case'solar':per(2.6,()=>{
  const ts=targets(tw,1+tw.prism);if(!ts.length)return false;
  for(const e of ts)zones.push({x:e.x,y:e.y,r:CS*1.1,t:3,dps:16*mul,col:D.col,els});
  snd('so',200,.2,'sawtooth',.03,-80);return true});break;
 case'crystal':per(2,()=>{
  const ts=inRange(tw.x,tw.y,tw.R);if(!ts.length)return false;
  for(const e of ts){dmg(e,9*mul,els);e.stacks++;e.slowT=1;e.slowA=Math.max(e.slowA,.3);if(e.stacks>=3){e.freeze=1.4;e.stacks=0;burst(e.x,e.y,'#bff8ff',10,90,.5)}}
  ring(tw.x,tw.y,8,tw.R,D.col,.5,4);snd('cr',1300,.15,'triangle',.025,-500);return true});break;
 case'tachyon':per(4,()=>{
  const ts=inRange(tw.x,tw.y,tw.R);if(!ts.length)return false;
  for(const e of ts){e.d=Math.max(0,e.d-90*(1+.2*(tw.lv-1)));dmg(e,12*mul,els)}
  ring(tw.x,tw.y,8,tw.R,D.col,.7,6);ring(tw.x,tw.y,4,tw.R*.7,'#fff',.5,3);snd('ta',150,.3,'square',.04,-60);return true});break;
 case'supernova':per(3.2,()=>{
  const ts=targets(tw,1+tw.prism);if(!ts.length)return false;
  for(const e of ts){const b=tw,ex_=e.x,ey=e.y;addFx(.3,(c,k)=>beam(c,b.x,b.y,ex_,ey,D.col,10*(1-k),1-k));
   explode(e.x,e.y,CS*1.8,130*mul,els,D.col2,true);zones.push({x:e.x,y:e.y,r:CS*1.2,t:2,dps:20*mul,col:D.col2,els})}
  snd('sn',110,.4,'sawtooth',.06,-60);return true});break;
 case'zero':{
  for(const e of inRange(tw.x,tw.y,tw.R)){e.slowT=.25;e.slowA=.7;dmg(e,12*mul*dt,els);e.stk=(e.stk||0)+dt;if(e.stk>=.7){e.stk=0;e.stacks++;if(e.stacks>=3){e.freeze=1.6;e.stacks=0;burst(e.x,e.y,'#bff8ff',10,90,.5)}}}
  tw.cd-=dt;if(tw.cd<=0){tw.cd=1;ring(tw.x,tw.y,tw.R,6,D.col,.9,3);pulse(tw,99)}break}
 case'kaleido':per(.8,()=>{
  const f=targets(tw,1)[0];if(!f)return false;
  const hit=new Set([f]);let cur=f;dmg(f,22*mul,els);bolt({x:tw.x,y:tw.y},f,D.col2);
  for(let i=0,n=5+ex;i<n;i++){const nx=inRange(cur.x,cur.y,CS*2.6).filter(e=>!hit.has(e))[0];if(!nx)break;bolt(cur,nx,i%2?D.col:D.col2);hit.add(nx);dmg(nx,22*mul,els);cur=nx}
  snd('ka',900,.1,'sawtooth',.02,-500);return true});break;
 case'chrono':per(3,()=>{
  const ts=inRange(tw.x,tw.y,tw.R);if(!ts.length)return false;
  for(const e of ts){e.d=Math.max(0,e.d-150);dmg(e,30*mul,els);e.slowT=2;e.slowA=Math.max(e.slowA,.5)}
  ring(tw.x,tw.y,8,tw.R,D.col,.8,8);ring(tw.x,tw.y,4,tw.R*.8,D.col2,.6,4);shake=Math.max(shake,4);snd('ch',120,.4,'square',.05,-70);return true});break;
 case'aurora':{
  const ts=targets(tw,5+ex);
  if(ts.length){tw.beam=ts;for(const e of ts)dmg(e,26*mul*dt,els);tw.cd-=dt;if(tw.cd<=0){tw.cd=1;tw.flash=1;pulse(tw,99)}snd('au',640,.05,'sine',.012)}else tw.beam=null;break}
 case'helios':per(3,()=>{
  const f=targets(tw,1)[0];if(!f)return false;
  const L=tw.R*1.3,a=Math.atan2(f.y-tw.y,f.x-tw.x),bx=tw.x+Math.cos(a)*L,by=tw.y+Math.sin(a)*L;
  for(const e of enemies)if(!e.dead&&segDist(e.x,e.y,tw.x,tw.y,bx,by)<CS*.55){dmg(e,70*mul,els);e.vuln=Math.max(e.vuln,3);zones.push({x:e.x,y:e.y,r:CS*.7,t:2,dps:14*mul,col:D.col2,els});burst(e.x,e.y,D.col2,10,140,.5)}
  const sx=tw.x,sy=tw.y;addFx(.45,(c,k)=>beam(c,sx,sy,bx,by,'#ffb04a',14*(1-k),1-k));shake=Math.max(shake,6);snd('he',90,.45,'sawtooth',.07,-40);return true});break;
 case'entropy':{
  for(const e of inRange(tw.x,tw.y,tw.R)){e.slowT=.25;e.slowA=Math.max(e.slowA,.6);e.d=Math.max(0,e.d-14*dt);dmg(e,6*mul*dt,els)}
  per(4,()=>{const ts=inRange(tw.x,tw.y,tw.R);if(!ts.length)return false;
   for(const e of ts){e.freeze=2;dmg(e,70*mul,['ice']);burst(e.x,e.y,'#bff8ff',12,120,.6)}
   ring(tw.x,tw.y,tw.R,6,D.col,.6,8);ring(tw.x,tw.y,tw.R*.6,3,D.col2,.5,5);shake=Math.max(shake,6);snd('en',1600,.5,'triangle',.05,-1300);return true});break}
 case'gamma':per(1,()=>{
  const f=targets(tw,1+tw.prism)[0];if(!f)return false;
  dmg(f,30*mul,els);bolt({x:tw.x,y:tw.y},f,D.col2,.2);
  const near=inRange(f.x,f.y,CS*2.2).filter(e=>e!==f).slice(0,6+ex);
  for(const e of near){dmg(e,20*mul,els);const a={x:f.x,y:f.y};addFx(.25,(c,k)=>beam(c,a.x,a.y,e.x,e.y,D.col,1.6,1-k))}
  ring(f.x,f.y,4,CS*2.2,D.col,.35,3);snd('ga',1000,.1,'sawtooth',.02,-600);return true});break;
 case'magnetar':{
  for(const e of inRange(tw.x,tw.y,tw.R)){e.slowT=.25;e.slowA=Math.max(e.slowA,.6);e.d=Math.max(0,e.d-22*dt);dmg(e,6*mul*dt,els)}
  per(.5,()=>{const ts=inRange(tw.x,tw.y,tw.R);if(!ts.length)return false;
   for(let i=0;i<1+tw.prism;i++){const e=ts[Math.floor(Math.random()*ts.length)];bolt({x:tw.x,y:tw.y},e,D.col2);dmg(e,14*mul,['thunder']);e.stun=.4}
   snd('mg',500,.1,'sawtooth',.02,-300);return true});break}
 case'cinferno':{
  for(const e of inRange(tw.x,tw.y,tw.R)){e.slowT=.25;e.slowA=Math.max(e.slowA,.5);e.vuln=Math.max(e.vuln,.5);dmg(e,30*mul*dt,els)}
  tw.cd-=dt;if(tw.cd<=0){tw.cd=1.2;tw.flash=1;ring(tw.x,tw.y,8,tw.R,D.col,.8,4);pulse(tw,99)}break}
 case'steam':per(2.5,()=>{
  const f=targets(tw,1)[0];if(!f)return false;
  explode(f.x,f.y,CS*2.2,95*mul,els,D.col,true);for(const e of inRange(f.x,f.y,CS*2.2)){e.stacks++;e.slowT=1.5;e.slowA=Math.max(e.slowA,.35)}
  snd('st',180,.3,'sawtooth',.05,-80);return true});break;
 }
}
function updEnemy(e,dt){
 const D=ED[e.type];e.hit=Math.max(0,e.hit-dt);e.vuln=Math.max(0,e.vuln-dt);e.slowT=Math.max(0,e.slowT-dt);if(e.slowT<=0)e.slowA=0;
 e.freeze=Math.max(0,e.freeze-dt);e.stun=Math.max(0,e.stun-dt);
 if(D.regen)e.hp=Math.min(e.max,e.hp+D.regen*dt);
 let v=D.spd*(1+Math.min(.3,stage*TUNE.spd));if(e.slowT>0)v*=1-e.slowA;if(e.freeze>0||e.stun>0)v=0;
 e.d+=v*dt;const p=posAt(e.d);e.x=p.x;e.y=p.y;
 if(D.atk&&e.freeze<=0&&e.stun<=0&&towers.length)enemyAttack(e,D.atk,dt);else e.drainT=null;
 if(e.type==='boss'){e.bt-=dt;if(e.bt<=0){e.bt=6;let best=null,bd=1e9;for(const t of towers){const q=Math.hypot(t.x-e.x,t.y-e.y);if(q<bd&&q<CS*6){bd=q;best=t}}
  linkCut=4;for(const t of towers)t.links=[];for(let i=0;i<4;i++)spawn('sprite',e.sc*.5,Math.max(0,e.d-i*16));snd('cut',200,.3,'square',.05,-100);
  if(best){best.dis=3.5;const tx=best.x,ty=best.y,ex=e.x,ey=e.y;bolt({x:ex,y:ey},{x:tx,y:ty},'#ff3355',.5);ring(tx,ty,4,40,'#ff3355',.6,4)}}}
 if(e.d>=total&&barrier>0){barrier--;e.d=Math.max(0,e.d-260);e.stun=1;ring(pts[pts.length-1].x,pts[pts.length-1].y,10,110,'#7cd8ff',.6,6);snd('bar',800,.2,'triangle',.05,-400);return}
 if(e.d>=total){e.dead=true;hp-=e.type==='boss'?10:1;shake=Math.max(shake,10);ring(pts[pts.length-1].x,pts[pts.length-1].y,10,90,'#ff3355',.5,5);snd('hurt',100,.3,'sawtooth',.07,-50);if(hp<=0)end(false)}
}
// ---------- ウェーブ ----------
function startWave(){
 if(over||wave>=WPS)return;wave++;cleared=false;
 const sc=(TUNE.w0+TUNE.w1*wave)*(1+TUNE.sf*stage)*TUNE.hp*(stage===19?TUNE.fin:1),u=stage*TUNE.us+wave*TUNE.uw;
 const pool=['sprite'];if(u>=1.5)pool.push('drone');if(u>=2.5)pool.push('reaper');if(u>=4)pool.push('golem');if(u>=5)pool.push('splitter');if(u>=6.5)pool.push('shielder');if(u>=8)pool.push('phantom');
 const cnt=Math.round((TUNE.c0+wave*TUNE.c1+stage*TUNE.c2)*TUNE.cnt),gap=Math.max(.55,1.1-stage*.015-wave*.01);
 for(let i=0;i<cnt;i++)queue.push({t:gt+i*gap,type:pool[Math.floor(Math.random()*pool.length)],sc});
 const bs=(TUNE.b0+stage*TUNE.b1)*TUNE.boss;
 if(wave===WPS)queue.push({t:gt+cnt*gap+2,type:'boss',sc:bs});
 else if(wave===5&&stage>=2)queue.push({t:gt+cnt*gap+2,type:'boss',sc:bs*.45});
 queue.sort((a,b)=>a.t-b.t);
 msg(`WAVE ${wave} 開始`+(wave===WPS||(wave===5&&stage>=2)?'  ボス出現!':''));snd('wave',440,.4,'triangle',.05,440);
}
// ---------- ステージ・進行 ----------
function cleared_get(){try{return JSON.parse(localStorage.getItem('asc_clear')||'[]')}catch(e){return[]}}
function cleared_add(i){try{const a=cleared_get();if(!a.includes(i)){a.push(i);localStorage.setItem('asc_clear',JSON.stringify(a))}}catch(e){}}
function loadStage(i){
 stage=i;const S=STAGES[i];pal=S.pal;buildPath(S.wp);
 mana=TUNE.m0+i*TUNE.m1;hp=20;wave=0;gt=0;over=false;shake=0;sel=null;picked=null;curSrc=null;inBurst=false;ovl=0;barrier=0;linkCut=0;timers=[];shots=[];combo=0;comboLv=0;finaleCd=0;
 towers=[];enemies=[];zones=[];parts=[];fx=[];queue=[];cleared=true;
 for(const k in sk)sk[k].cd=0;
 document.documentElement.style.setProperty('--ac',pal.acc);
 document.body.style.background=`radial-gradient(ellipse at 50% -10%,${pal.bg2} 0%,${pal.bg} 70%)`;
 $('#stname').textContent=`STAGE ${i+1}  ${S.name}`;$('#stsub').textContent=S.sub;
 document.querySelectorAll('.card').forEach(el=>el.classList.remove('on'));
 $('#select').style.display='none';$('#over').style.display='none';
 BGM.init();BGM.start(i);info();msg(`STAGE ${i+1}  ${S.name}`);
}
function openSelect(){
 over=true;BGM.stop();$('#over').style.display='none';
 const done=cleared_get();
 const g=$('#sgrid');g.innerHTML='';
 STAGES.forEach((S,i)=>{
  const el=document.createElement('div');el.className='st';el.style.setProperty('--c',S.pal.acc);
  el.innerHTML=`<canvas width="210" height="128"></canvas><div><b>STAGE ${i+1}  ${S.name}</b><small>${S.sub}</small><em>♪ ${BGM.TR[i].n}</em></div>${done.includes(i)?'<span class="ck">✔ CLEAR</span>':''}`;
  const c=el.querySelector('canvas').getContext('2d'),k=210/(COLS*CS);
  const bg=c.createLinearGradient(0,0,0,128);bg.addColorStop(0,S.pal.bg);bg.addColorStop(1,S.pal.bg2);c.fillStyle=bg;c.fillRect(0,0,210,128);
  const TB=IMG['bg'+i];if(TB)c.drawImage(TB,0,0,210,128);else{c.save();c.scale(k,k);drawDeco(c,3.3,S.deco,S.pal,COLS*CS,ROWS*CS,S.P);c.restore()}
  c.strokeStyle=S.pal.edge;c.lineWidth=9;c.lineJoin='round';c.beginPath();S.wp.forEach(([cc,r],j)=>{const x=(cc+.5)*CS*k,y=(r+.5)*CS*k;j?c.lineTo(x,y):c.moveTo(x,y)});c.stroke();
  c.strokeStyle=S.pal.line;c.lineWidth=1.5;c.setLineDash([4,4]);c.stroke();c.setLineDash([]);
  el.onclick=()=>loadStage(i);g.appendChild(el);
 });
 $('#select').style.display='block';
}
function end(win){
 over=true;BGM.boss(false);const last=stage>=STAGES.length-1,box=$('#obtns');box.innerHTML='';
 if(win)cleared_add(stage);
 $('#overtxt').textContent=win?(last?'全ステージ制覇!  世界は救われた':`STAGE ${stage+1} クリア!`):'中枢環が崩壊した…';
 const add=(t,f)=>{const b=document.createElement('button');b.textContent=t;b.onclick=f;box.appendChild(b)};
 if(win&&!last)add('次のステージへ',()=>loadStage(stage+1));
 add('もう一度',()=>loadStage(stage));add('ステージ選択',openSelect);
 $('#over').style.display='flex';
}
$('#selbtn').onclick=openSelect;
$('#vol').oninput=e=>BGM.setVol(e.target.value/100*.8);
$('#mute').onclick=()=>{$('#mute').textContent=BGM.toggleMute()?'音 OFF':'音 ON'};
BGM.setVol(.4);
// ---------- スキル ----------
function useSkill(k){
 const s=sk[k];if(over||s.cd>0)return;s.cd=s.max;
 const W=cv.width,H=cv.height,core=pts[pts.length-1];
 if(k==='nova'){
  shake=Math.max(shake,22);snd('big',60,1.2,'sawtooth',.09,-20);
  addFx(1.6,(c,t)=>{c.save();c.globalCompositeOperation='lighter';
   const g=Math.min(1,t*3);c.globalAlpha=(1-t)*.8;c.strokeStyle='#ffe9a0';
   for(let i=0;i<4;i++){c.lineWidth=2+i;c.save();c.translate(W/2,H/2);c.rotate(t*(i%2?-1:1)*2);poly(c,[3,5,6,8][i],Math.min(W,H)*(.25+i*.12)*g,0);c.stroke();c.restore()}
   c.beginPath();c.arc(W/2,H/2,Math.max(W,H)*t*.9,0,TAU);c.lineWidth=14*(1-t);c.stroke();
   c.globalAlpha=Math.max(0,.5-t)*1.2;c.fillStyle='#fff';c.fillRect(0,0,W,H);c.restore()});
  setTimeout(()=>{for(const e of enemies){dmg(e,300,[]);e.stun=Math.max(e.stun,5);burst(e.x,e.y,'#ffe9a0',8,160,.6)}},450);
  msg('超新星崩壊!');
 }else if(k==='surge'){
  ovl=10;for(const t of towers){ring(t.x,t.y,4,70,'#ffd34d',.8,4);t.flash=1}
  addFx(.8,(c,t)=>{c.save();c.globalCompositeOperation='lighter';c.globalAlpha=(1-t)*.2;c.fillStyle='#ffd34d';c.fillRect(0,0,W,H);c.restore()});
  snd('surge',300,.6,'sawtooth',.06,900);msg('回路過駆動 10秒:全陣の速度2倍');
 }else if(k==='stasis'){
  for(const e of enemies){e.freeze=5;burst(e.x,e.y,'#bff8ff',6,60,.8)}
  for(const t of towers)ring(t.x,t.y,4,60,'#bff8ff',.8,3);
  addFx(.8,(c,t)=>{c.save();c.globalCompositeOperation='lighter';c.globalAlpha=(1-t)*.25;c.fillStyle='#8ff0ff';c.fillRect(0,0,W,H);c.restore()});
  snd('fz',1500,.6,'triangle',.05,-1000);msg('時間停止 5秒');
 }else if(k==='harvest'){
  let n=0;for(const e of enemies){if(Math.hypot(e.x-core.x,e.y-core.y)<CS*5&&e.type!=='boss'){mana+=e.max*.12;n++;e.dead=true;burst(e.x,e.y,'#7cff9a',16,200,.8);
   const ex=e.x,ey=e.y;addFx(.5,(c,k2)=>{c.save();c.globalCompositeOperation='lighter';c.globalAlpha=1-k2;c.fillStyle='#7cff9a';c.beginPath();c.arc(ex+(core.x-ex)*k2,ey+(core.y-ey)*k2,4,0,TAU);c.fill();c.restore()})}}
  ring(core.x,core.y,10,CS*5,'#7cff9a',.7,6);snd('hv',400,.5,'sine',.05,400);msg(`魔力還元 ${n}体`);
 }else{
  barrier=3;ring(core.x,core.y,10,110,'#7cd8ff',.8,6);snd('bar',800,.3,'triangle',.05,-300);msg('位相偏向膜 3体まで無効化');
 }
}
// ---------- 入力 ----------
function towerAt(c,r){return towers.find(t=>t.c===c&&t.r===r)}
function cellAt(e){const b=cv.getBoundingClientRect(),x=(e.clientX-b.left)*cv.width/b.width,y=(e.clientY-b.top)*cv.height/b.height;return{c:Math.floor(x/CS),r:Math.floor(y/CS)}}
cv.addEventListener('mousemove',e=>{mouse=cellAt(e)});
cv.addEventListener('mouseleave',()=>{mouse={c:-1,r:-1}});
cv.addEventListener('contextmenu',e=>{e.preventDefault();pick(null)});
cv.addEventListener('click',e=>{
 if(over)return;const{c,r}=cellAt(e);if(c<0||r<0||c>=COLS||r>=ROWS)return;
 const tw=towerAt(c,r);
 if(sel){
  const D=TD[sel];
  if(!tw){
   if(pathCell.has(c+','+r))return msg('敵の通り道には置けません');
   if(mana<D.cost)return msg('魔力が足りません');
   mana-=D.cost;const t={c,r,x:(c+.5)*CS,y:(r+.5)*CS,kind:sel,lv:1,fused:false,cd:0,rot:Math.random()*6,flash:1,links:[],prism:0,mul:1,ramp:0,dis:0,R:0,chain:0,beam:null,hp:Math.round(100*TUNE.thp),maxHp:Math.round(100*TUNE.thp)};
   towers.push(t);if(codexAdd('b:'+sel))codexNew('b:'+sel);relink();ring(t.x,t.y,4,50,D.col,.5,4);burst(t.x,t.y,D.col,16,120,.6);snd('put',600,.2,'triangle',.05,600);
  }else if(tw.fused)msg('合成済みの陣は強化できません');
  else if(tw.kind===sel){
   if(tw.lv>=3)return msg('これ以上強化できません');if(mana<D.cost)return msg('魔力が足りません');
   mana-=D.cost;tw.lv++;tw.flash=1;refreshHp(tw);ring(tw.x,tw.y,4,70,D.col,.6,5);burst(tw.x,tw.y,D.col,24,160,.7);snd('lv',700,.3,'triangle',.05,700);msg(`${D.n} Lv${tw.lv}`);
  }else{
   const f=recipe(tw.kind,sel);if(!f)return msg('この組み合わせは合成できません');if(mana<D.cost)return msg('魔力が足りません');
   mana-=D.cost;if(f==='hyper'){tw.sub=tw.kind==='prism'?sel:tw.kind;tw.def={...FD.hyper,col:TD[tw.sub].col,el:TD[tw.sub].el,range:TD[tw.sub].range,sides:TD[tw.sub].sides}}
   tw.kind=f;const F=T(tw);tw.fused=true;tw.lv=1;tw.flash=1;tw.cd=0;refreshHp(tw);
   ring(tw.x,tw.y,4,120,F.col,.8,8);ring(tw.x,tw.y,4,80,F.col2,.6,5);burst(tw.x,tw.y,F.col,50,260,.9,3.5);burst(tw.x,tw.y,F.col2,30,200,.9,3);shake=Math.max(shake,9);
   snd('fuse',200,.7,'sawtooth',.07,900);msg(`合成!  ${F.n}`+(tw.sub?`(${TD[tw.sub].n})`:''));
   {const ck=f==='hyper'?'f:hyper:'+tw.sub:'f:'+f;if(codexAdd(ck))setTimeout(()=>codexNew(ck),300)}
  }
  relink();info();
 }else{picked=tw||null;info()}
});
function pick(k){sel=sel===k?null:k;picked=null;document.querySelectorAll('.card').forEach(el=>el.classList.toggle('on',el.dataset.k===sel));info()}
function sell(){if(!picked)return;const D=T(picked);const v=Math.floor((D.cost||80)*.6*picked.lv);mana+=v;ring(picked.x,picked.y,4,40,'#fff',.4,3);towers=towers.filter(t=>t!==picked);picked=null;relink();info();msg(`売却 +${v}`)}
window.addEventListener('keydown',e=>{
 if(e.code==='Space'){e.preventDefault();startWave()}
 else if(e.key>='1'&&e.key<='7')pick(Object.keys(TD)[e.key-1]);
 else if(e.key==='Escape')pick(null);
 else if(e.key==='s'||e.key==='S')sell();
 else if(e.key==='f'||e.key==='F')repair();
 else if(e.key==='q'||e.key==='Q')useSkill('nova');
 else if(e.key==='w'||e.key==='W')useSkill('surge');
 else if(e.key==='e'||e.key==='E')useSkill('stasis');
 else if(e.key==='r'||e.key==='R')useSkill('harvest');
 else if(e.key==='t'||e.key==='T')useSkill('barrier');
});
$('#go').onclick=startWave;
$('#spd').onclick=()=>{speed=speed%3+1;$('#spd').textContent='速度 ×'+speed};
// ---------- UI ----------
const cardEls=[];
Object.keys(TD).forEach((k,i)=>{
 const D=TD[k],el=document.createElement('div');el.className='card';el.dataset.k=k;
 el.innerHTML=`<canvas width="112" height="112"></canvas><b>${i+1} ${D.n}</b><small>${D.sub}・魔力${D.cost}</small>`;
 el.onclick=()=>pick(k);$('#cards').appendChild(el);cardEls.push({k,c:el.querySelector('canvas').getContext('2d')});
});
[['nova','超新星崩壊 [Q]'],['surge','回路過駆動 [W]'],['stasis','時間停止 [E]'],['harvest','魔力還元 [R]'],['barrier','位相偏向膜 [T]']].forEach(([k,n])=>{
 const b=document.createElement('button');b.className='sk';b.innerHTML=`<i></i><span>${n}</span>`;b.onclick=()=>useSkill(k);b.dataset.k=k;$('#skills').appendChild(b)});
let msgT=0;function msg(s){$('#msg').textContent=s;msgT=3}
function info(){
 let h='';
 if(picked){const D=T(picked);h+=`<b>${D.n}</b>(${D.sub||'合成陣'}) Lv${picked.lv}  耐久 ${Math.ceil(picked.hp)}/${picked.maxHp}  属性:${D.el.map(x=>ELN[x]).join('・')||'支援'}  連結${picked.links.length}本 → 速度×${picked.mul.toFixed(2)}${picked.prism?` / プリズム${picked.prism}`:''}<br>${D.desc} <button onclick="sell()">売却 [S]</button> ${picked.hp<picked.maxHp?`<button onclick="repair()">修理 [F] 魔力${Math.ceil((D.cost||80)*.3)}</button>`:''}<br>`}
 else if(sel){const D=TD[sel];h+=`<b>${D.n}</b> 魔力${D.cost}  属性:${D.el.map(x=>ELN[x]).join('・')||'支援'}<br>${D.desc}<br>空きマスに設置/同じ陣に重ねてLvUP/別の陣に重ねて合成。`}
 else h+='陣を選んで設置。隣り合う陣は光の線で連結し、攻撃速度が上がり、発動が仲間へ連鎖。連結中の陣が敵を倒すとチェイン・バーストが全員から放たれます。敵も陣を攻撃してきます(壊れた陣は建て直し、傷ついた陣は選んで修理 [F])。';
 const nm=k=>TD[k]?TD[k].n.split('・')[0]:'他の陣';
 h+='<br><small>合成表: '+Object.values(FD).map(f=>`${nm(f.from[0])}+${nm(f.from[1])}=${f.n}`).join(' / ')+'</small>';
 $('#detail').innerHTML=h;
}
info();
// ---------- ループ ----------
let last=performance.now(),infoT=0;
function frame(now){
 let dt=Math.min(.05,(now-last)/1000);last=now;
 if(!over&&!paused){for(let s=0;s<speed;s++)step(dt)}
 draw(now/1000);
 msgT-=dt;if(msgT<0&&$('#msg').textContent)$('#msg').textContent='';
 infoT+=dt;if(infoT>.5){infoT=0;info()}
 $('#mana').textContent=Math.floor(mana);$('#hp').textContent=Math.max(0,hp)+(barrier?` (膜${barrier})`:'');$('#wave').textContent=wave;
 document.querySelectorAll('.sk').forEach(b=>{const s=sk[b.dataset.k];b.querySelector('i').style.width=(s.cd/s.max*100)+'%';b.disabled=s.cd>0});
 requestAnimationFrame(frame);
}
function step(dt){
 gt+=dt;for(const k in sk)sk[k].cd=Math.max(0,sk[k].cd-dt);
 while(queue.length&&queue[0].t<=gt){const q=queue.shift();spawn(q.type,q.sc)}
 ovl=Math.max(0,ovl-dt);finaleCd=Math.max(0,finaleCd-dt);comboPop=Math.max(0,comboPop-dt*4);
 if(combo>0){comboT+=dt;if(comboT>COMBO_WIN+comboLv*.2){combo=0;comboLv=0}}
if(linkCut>0){linkCut-=dt;if(linkCut<=0)relink()}
 for(const t of towers){curSrc=t;updTower(t,dt)}curSrc=null;
 for(const m of timers)if(m.at<=gt)m.fn();timers=timers.filter(m=>m.at>gt);
 for(const z of zones){z.t-=dt;for(const e of inRange(z.x,z.y,z.r)){dmg(e,z.dps*dt,z.els);e.vuln=Math.max(e.vuln,.5)}}
 zones=zones.filter(z=>z.t>0);
 for(const e of enemies)e.guard=false;
 for(const g of enemies)if(g.type==='shielder'&&!g.dead)for(const e of enemies)if(e!==g&&Math.hypot(e.x-g.x,e.y-g.y)<CS*2)e.guard=true;
 for(const e of enemies)updEnemy(e,dt);
 enemies=enemies.filter(e=>!e.dead);
 updShots(dt);
 for(const t of towers)if(t.hp<t.maxHp&&gt-(t.lastHit||-9)>3)t.hp=Math.min(t.maxHp,t.hp+t.maxHp*TUNE.regen*dt);
 for(const p of parts){p.life-=dt;p.x+=p.vx*dt;p.y+=p.vy*dt;p.vx*=.96;p.vy*=.96}
 parts=parts.filter(p=>p.life>0);
 for(const f of fx)f.life-=dt;fx=fx.filter(f=>f.life>0);
 shake=Math.max(0,shake-dt*30);
 if(wave>0&&!cleared&&!queue.length&&!enemies.length){cleared=true;if(wave>=WPS&&hp>0){end(true)}else{const b=25+wave*3+stage*2;mana+=b;for(const t of towers)t.hp=Math.min(t.maxHp,t.hp+t.maxHp*.3);msg(`WAVE ${wave} 突破  魔力+${b}  陣の耐久が少し回復`)}}
}
function draw(t){
 const c=ctx,W=cv.width,H=cv.height;c.setTransform(1,0,0,1,0,0);c.globalCompositeOperation='source-over';c.globalAlpha=1;
 const bgG=c.createLinearGradient(0,0,0,H);bgG.addColorStop(0,pal.bg);bgG.addColorStop(1,pal.bg2);c.fillStyle=bgG;c.fillRect(0,0,W,H);
 const BI=IMG['bg'+stage];if(BI){c.drawImage(BI,0,0,W,H);const dm=STAGES[stage].dim;if(dm){c.fillStyle=`rgba(0,0,0,${dm})`;c.fillRect(0,0,W,H)}}
 if(shake>0)c.translate((Math.random()-.5)*shake,(Math.random()-.5)*shake);
 if(!BI)for(const s of stars){c.globalAlpha=.3+.4*Math.sin(t*1.5+s.p);c.fillStyle=pal.star;c.fillRect(s.x,s.y,s.s,s.s)}
 drawDeco(c,t,STAGES[stage].deco,pal,W,H,STAGES[stage].P);
 c.globalAlpha=1;
 // 格子
 c.strokeStyle=pal.grid;c.lineWidth=1;c.globalAlpha=BI?.3:1;
 for(let x=0;x<=COLS;x++){c.beginPath();c.moveTo(x*CS,0);c.lineTo(x*CS,H);c.stroke()}
 for(let y=0;y<=ROWS;y++){c.beginPath();c.moveTo(0,y*CS);c.lineTo(W,y*CS);c.stroke()}
 c.globalAlpha=1;
 // 経路
 c.lineCap='round';c.lineJoin='round';
 const path=()=>{c.beginPath();pts.forEach((p,i)=>i?c.lineTo(p.x,p.y):c.moveTo(p.x,p.y))};
 c.strokeStyle=pal.path;c.lineWidth=CS*.86;path();c.stroke();
 c.strokeStyle=pal.edge;c.lineWidth=CS*.86;c.setLineDash([]);path();c.globalAlpha=.5;c.lineWidth=CS*.92;c.stroke();c.globalAlpha=1;
 c.strokeStyle=pal.path2;c.globalAlpha=BI?.78:1;c.lineWidth=CS*.8;path();c.stroke();c.globalAlpha=1;
 c.globalCompositeOperation='lighter';c.strokeStyle=pal.line;c.globalAlpha=.55;c.lineWidth=2;c.setLineDash([10,18]);c.lineDashOffset=-t*50;path();c.stroke();c.setLineDash([]);c.globalAlpha=1;c.globalCompositeOperation='source-over';
 // 中枢環
 const end_=pts[pts.length-1];drawMagic(c,end_.x+(end_.x>W-CS?-22:end_.x<CS?22:0),end_.y,30,'#ffd34d',t,{sides:8,lv:3,fused:true,col2:'#ff7a5a',sides2:4,alpha:.9});
 // 燃焼ゾーン
 for(const z of zones){c.save();c.globalCompositeOperation='lighter';c.globalAlpha=Math.min(1,z.t)*.5;drawMagic(c,z.x,z.y,z.r*.8,z.col,t*2,{sides:6,alpha:.7});c.restore()}
 // 連結線
 c.save();c.globalCompositeOperation='lighter';
 for(const tw of towers)for(const nb of tw.links)if(tw.c<nb.c||(tw.c===nb.c&&tw.r<nb.r)){c.lineCap='round';c.beginPath();c.moveTo(tw.x,tw.y);c.lineTo(nb.x,nb.y);
  c.strokeStyle=T(tw).col;c.globalAlpha=.18;c.lineWidth=7;c.stroke();c.globalAlpha=.9;c.strokeStyle='#fff';c.lineWidth=1.6;c.stroke();
  const pr=(t*.7+(tw.c*3+tw.r))%1;c.fillStyle='#fff';c.globalAlpha=1;c.beginPath();c.arc(tw.x+(nb.x-tw.x)*pr,tw.y+(nb.y-tw.y)*pr,3,0,TAU);c.fill()}
 c.restore();
 // 陣
 for(const tw of towers){
  const D=T(tw),R=tw.fused?25:20;
  if(D.range){c.save();c.globalCompositeOperation='lighter';c.globalAlpha=tw===picked?.5:.1;c.strokeStyle=D.col;c.lineWidth=1.2;c.setLineDash([6,8]);c.lineDashOffset=-t*18;c.beginPath();c.arc(tw.x,tw.y,tw.R,0,TAU);c.stroke();c.restore()}
  const hr=tw.hp/tw.maxHp;
  drawMagic(c,tw.x,tw.y,R,D.col,tw.rot,{sides:D.sides,lv:tw.lv,fused:tw.fused,col2:D.col2,sides2:D.sides2,flash:tw.flash,alpha:tw.dis>0?.25+.3*Math.random():(hr<.3?.55+.45*Math.random():1)});
  if(hr<1){c.save();c.lineWidth=3;c.lineCap='round';c.strokeStyle='#00000099';c.beginPath();c.arc(tw.x,tw.y,R+8,0,TAU);c.stroke();c.strokeStyle=hr>.6?'#7cff9a':hr>.3?'#ffd34d':'#ff4060';c.beginPath();c.arc(tw.x,tw.y,R+8,-Math.PI/2,-Math.PI/2+TAU*Math.max(0.02,hr));c.stroke();c.restore()}
  if(tw===picked){c.strokeStyle='#fff';c.lineWidth=1.5;c.strokeRect(tw.c*CS+2,tw.r*CS+2,CS-4,CS-4)}
  if(tw.beam)for(const e of tw.beam){if(e.dead)continue;if(tw.kind==='aurora'){const i=tw.beam.indexOf(e);beam(c,tw.x,tw.y,e.x,e.y,i%2?D.col:D.col2,3.2,.8)}else beam(c,tw.x,tw.y,e.x,e.y,D.col,2+tw.ramp*1.2)}
 }
 // 敵の攻撃
 for(const e of enemies)if(e.drainT&&towers.includes(e.drainT))beam(c,e.x,e.y,e.drainT.x,e.drainT.y,ED[e.type].col,1.6,.7);
 for(const s of shots){c.save();c.globalCompositeOperation='lighter';const g=c.createRadialGradient(s.x,s.y,0,s.x,s.y,10);g.addColorStop(0,'#fff');g.addColorStop(.35,s.col);g.addColorStop(1,s.col+'00');c.fillStyle=g;c.beginPath();c.arc(s.x,s.y,10,0,TAU);c.fill();c.restore()}
 // 敵
 for(const e of enemies){
  const D=ED[e.type],r=D.r;c.save();c.translate(e.x,e.y);
  if(e.hit>0||Math.random()<.04)c.translate((Math.random()-.5)*4,(Math.random()-.5)*4);
  c.globalCompositeOperation='lighter';
  const g=c.createRadialGradient(0,0,0,0,0,r*2);g.addColorStop(0,D.col+'66');g.addColorStop(1,D.col+'00');c.fillStyle=g;c.beginPath();c.arc(0,0,r*2,0,TAU);c.fill();
  const SI=IMG[SPR[e.type]];
  if(SI){const a0=posAt(e.d),b0=posAt(e.d+6),hd=Math.atan2(b0.y-a0.y,b0.x-a0.x),sz=r*(e.type==='boss'?5.2:4.4);
   c.save();c.rotate(e.type==='boss'?t*.25:(SPR_BASE[e.type]!==undefined?hd-SPR_BASE[e.type]:0));c.globalAlpha=e.type==='phantom'?.8+.2*Math.sin(t*6+e.ph):1;c.drawImage(SI,-sz/2,-sz/2,sz,sz);c.restore();
   if(e.freeze>0){c.fillStyle='#bff8ff44';c.beginPath();c.arc(0,0,r+3,0,TAU);c.fill()}}
  else{
  c.strokeStyle=e.freeze>0?'#bff8ff':D.col;c.fillStyle=(e.freeze>0?'#bff8ff':D.col)+'55';c.lineWidth=2;
  if(D.sides){poly(c,D.sides,r,t*(e.type==='boss'?.8:1.5)+e.ph)}else{c.beginPath();c.arc(0,0,r,0,TAU)}
  c.fill();c.stroke();
  if(e.type==='boss'){c.lineWidth=1.5;poly(c,8,r*1.4,-t);c.stroke();poly(c,4,r*.7,t*2);c.stroke()}
  if(e.type==='splitter'||e.type==='phantom'){c.beginPath();c.arc(0,0,r*.5,0,TAU);c.stroke()}
  }
  if(e.guard){c.strokeStyle='#7cd8ff';c.globalAlpha=.6;c.beginPath();c.arc(0,0,r+7,0,TAU);c.stroke();c.globalAlpha=1}
  if(e.vuln>0){c.strokeStyle='#ff8a3c';c.beginPath();c.arc(0,0,r+4,0,TAU);c.stroke()}
  c.restore();
  const w=Math.max(16,r*2);c.fillStyle='#000a';c.fillRect(e.x-w/2,e.y-r-9,w,3);c.fillStyle=D.col;c.fillRect(e.x-w/2,e.y-r-9,w*Math.max(0,e.hp/e.max),3);
 }
 // 粒子
 c.save();c.globalCompositeOperation='lighter';
 for(const p of parts){c.globalAlpha=Math.max(0,p.life/p.max);c.fillStyle=p.col;c.fillRect(p.x-p.size/2,p.y-p.size/2,p.size,p.size)}
 c.restore();
 for(const f of fx)f.draw(c,1-f.life/f.max);
 drawCombo(c,t);
 // ゴースト
 if(sel&&mouse.c>=0&&mouse.c<COLS&&mouse.r>=0&&mouse.r<ROWS){
  const tw=towerAt(mouse.c,mouse.r),D=TD[sel];let ok,txt='';
  if(!tw)ok=!pathCell.has(mouse.c+','+mouse.r)&&mana>=D.cost;
  else if(tw.fused)ok=false;
  else if(tw.kind===sel){ok=tw.lv<3&&mana>=D.cost;txt='Lv UP'}
  else{const f=recipe(tw.kind,sel);ok=!!f&&mana>=D.cost;txt=f?'合成: '+FD[f].n:'合成不可'}
  const x=(mouse.c+.5)*CS,y=(mouse.r+.5)*CS;
  c.save();c.globalAlpha=.55;drawMagic(c,x,y,20,ok?D.col:'#ff4060',t*1.5,{sides:D.sides});
  c.globalCompositeOperation='lighter';c.strokeStyle=ok?D.col:'#ff4060';c.globalAlpha=.4;c.setLineDash([6,8]);c.beginPath();c.arc(x,y,D.range*CS,0,TAU);c.stroke();
  c.restore();
  if(txt){c.fillStyle='#fff';c.font='bold 14px sans-serif';c.textAlign='center';c.fillText(txt,x,y-30)}
 }
 // カードのアイコン
 for(const{k,c:cc}of cardEls){const D=TD[k];cc.clearRect(0,0,112,112);drawMagic(cc,56,56,38,D.col,t*(.6+TD[k].sides*.05),{sides:D.sides})}
}
requestAnimationFrame(frame);
openSelect();
