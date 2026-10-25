// 艦隊運用モードの演出と効果音。画面全体に重ねたキャンバスに描く(平面表示・立体表示どちらでも、マスの位置から描ける)。
// バリヤーは、よく使われる「縁が明るいフレネルの輪郭+うすい六角の網目+被弾点から広がる波紋」の3層で描く。
const COL={w:[255,196,90],b:[90,190,255]};   // 白=星冠帝国軍(琥珀) 黒=地球星域防衛軍(青)
let cv,g,fx=[],running=false,seOn=localStorage.getItem('threeLayerChess.fleetSe')!=='off',AC,master;
const pending=new Set();

export function initFleetFx(){
  if(cv)return;
  cv=document.createElement('canvas');cv.className='fleet-fx';cv.setAttribute('aria-hidden','true');
  document.body.append(cv);g=cv.getContext('2d');
  const size=()=>{const d=Math.min(2,devicePixelRatio||1),W=document.documentElement.clientWidth,H=innerHeight;cv.width=W*d;cv.height=H*d;g.setTransform(d,0,0,d,0,0);};
  size();addEventListener('resize',size);
}
export const fleetSe=()=>seOn;
export function setFleetSe(on){seOn=on;localStorage.setItem('threeLayerChess.fleetSe',on?'on':'off');}
export function clearFleetFx(){
  fx=[];
  for(const timer of pending)clearTimeout(timer);
  pending.clear();
  if(g)g.clearRect(0,0,innerWidth,innerHeight);
}

// ---------- 効果音(Web Audio で合成) ----------
function ac(){
  if(!AC){AC=new (window.AudioContext||window.webkitAudioContext)();master=AC.createGain();master.gain.value=.6;
    const comp=AC.createDynamicsCompressor();master.connect(comp);comp.connect(AC.destination);}
  if(AC.state==='suspended')AC.resume();return AC;
}
function osc(type,f0,f1,dur,vol,delay=0){
  const a=ac(),t=a.currentTime+delay,o=a.createOscillator(),gn=a.createGain();
  o.type=type;o.frequency.setValueAtTime(f0,t);o.frequency.exponentialRampToValueAtTime(Math.max(20,f1),t+dur);
  gn.gain.setValueAtTime(vol,t);gn.gain.exponentialRampToValueAtTime(.0001,t+dur);o.connect(gn);gn.connect(master);o.start(t);o.stop(t+dur+.02);
}
function noise(dur,vol,fType,f0,f1,delay=0){
  const a=ac(),t=a.currentTime+delay,len=Math.ceil(a.sampleRate*dur),buf=a.createBuffer(1,len,a.sampleRate),d=buf.getChannelData(0);
  for(let i=0;i<len;i++)d[i]=Math.random()*2-1;
  const s=a.createBufferSource();s.buffer=buf;const f=a.createBiquadFilter();f.type=fType;f.frequency.setValueAtTime(f0,t);f.frequency.exponentialRampToValueAtTime(Math.max(30,f1),t+dur);
  const gn=a.createGain();gn.gain.setValueAtTime(vol,t);gn.gain.exponentialRampToValueAtTime(.0001,t+dur);s.connect(f);f.connect(gn);gn.connect(master);s.start(t);s.stop(t+dur+.02);
}
const SE={
  beam(){osc('sawtooth',1500,180,.28,.12);osc('square',900,120,.22,.05);noise(.2,.06,'highpass',4000,1500);},
  heavy(){osc('sawtooth',420,60,.55,.18);osc('sine',90,40,.6,.25);noise(.5,.12,'lowpass',2400,200);},
  missile(){noise(.5,.12,'bandpass',600,2600);osc('triangle',300,900,.45,.05);},
  fighter(){for(let i=0;i<5;i++){osc('square',1200+i*90,700,.08,.035,i*.06);}},
  move(){osc('sine',160,240,.25,.06);noise(.25,.03,'lowpass',800,300);},
  repair(){osc('sine',390,780,.55,.1);osc('triangle',520,1040,.6,.07,.12);},
  shield(){osc('sine',1320,1250,.5,.12);osc('sine',1985,1900,.45,.07);osc('triangle',660,640,.6,.06);noise(.25,.05,'highpass',5000,3000);},
  crack(){osc('sine',880,300,.4,.12);noise(.35,.1,'bandpass',3000,800);osc('sawtooth',220,110,.3,.05);},
  boom(){noise(1.2,.35,'lowpass',3000,60);osc('sine',120,28,1.1,.4);osc('sawtooth',90,30,.8,.12);},
  flag(){SE.boom();noise(2.2,.3,'lowpass',1800,40,.25);osc('sine',70,22,2,.4,.2);
    [523,659,784,1046].forEach((f,i)=>osc('triangle',f,f,.9,.06,.9+i*.18));}
};
export function playSe(name){if(!seOn)return;try{SE[name]?.();}catch{}}

// ---------- 描画 ----------
function center(el){const r=el.getBoundingClientRect();return{x:r.left+r.width/2,y:r.top+r.height/2,w:Math.max(18,Math.min(r.width,r.height*1.4))};}
function loop(){
  running=true;g.clearRect(0,0,innerWidth,innerHeight);const now=performance.now();
  fx=fx.filter(e=>now<e.t0+e.dur);
  for(const e of fx){const k=(now-e.t0)/e.dur;if(k>=0)e.draw(k,now);}
  if(fx.length)requestAnimationFrame(loop);else{running=false;g.clearRect(0,0,innerWidth,innerHeight);}
}
function add(e,delay=0){e.t0=performance.now()+delay;fx.push(e);if(!running)requestAnimationFrame(loop);}
const rgba=(c,a)=>`rgba(${c[0]},${c[1]},${c[2]},${Math.max(0,a)})`;

function glowLine(a,b,c,width,alpha){
  g.save();g.globalCompositeOperation='lighter';g.lineCap='round';
  for(const [w,al] of [[width*4,.12],[width*2,.3],[width,.9]]){g.strokeStyle=rgba(c,al*alpha);g.lineWidth=w;g.beginPath();g.moveTo(a.x,a.y);g.lineTo(b.x,b.y);g.stroke();}
  g.strokeStyle=`rgba(255,255,255,${.9*alpha})`;g.lineWidth=Math.max(1,width*.35);g.beginPath();g.moveTo(a.x,a.y);g.lineTo(b.x,b.y);g.stroke();g.restore();
}
function flash(p,r,c,a){g.save();g.globalCompositeOperation='lighter';const gr=g.createRadialGradient(p.x,p.y,0,p.x,p.y,r);gr.addColorStop(0,`rgba(255,255,255,${a})`);gr.addColorStop(.35,rgba(c,a*.8));gr.addColorStop(1,rgba(c,0));g.fillStyle=gr;g.beginPath();g.arc(p.x,p.y,r,0,7);g.fill();g.restore();}

// 攻撃の弾道(艦種ごとに違う)
function weapon(kind,a,b,c,dur){
  const dx=b.x-a.x,dy=b.y-a.y,len=Math.hypot(dx,dy)||1,nx=-dy/len,ny=dx/len;
  if(kind==='n'){   // 雷撃艇: 曲がって飛ぶ魚雷2本
    for(const s of [-1,1])add({dur,draw(k){const t=Math.min(1,k*1.15),bend=Math.sin(t*Math.PI)*len*.22*s;
      const p={x:a.x+dx*t+nx*bend,y:a.y+dy*t+ny*bend};
      for(let i=1;i<8;i++){const tt=Math.max(0,t-i*.025),bb=Math.sin(tt*Math.PI)*len*.22*s;flash({x:a.x+dx*tt+nx*bb,y:a.y+dy*tt+ny*bb},6-i*.6,c,.5-i*.05);}
      flash(p,10,c,.9);}});
    return;
  }
  if(kind==='b'){   // 空母: 艦載機の編隊
    for(let i=0;i<7;i++)add({dur,draw(k){const t=Math.min(1,k*1.2-i*.03);if(t<=0)return;const w=Math.sin(t*Math.PI)*(i-3)*7;
      const p={x:a.x+dx*t+nx*w,y:a.y+dy*t+ny*w},ang=Math.atan2(dy,dx);
      g.save();g.translate(p.x,p.y);g.rotate(ang);g.fillStyle=rgba(c,.95);g.beginPath();g.moveTo(6,0);g.lineTo(-4,-4);g.lineTo(-2,0);g.lineTo(-4,4);g.closePath();g.fill();g.restore();
      if(t>.85)glowLine(p,b,c,1.2,(1-t)*5);}});
    return;
  }
  const heavy=kind==='q'||kind==='k',beams=kind==='k'?3:kind==='r'?2:1,width=kind==='q'?9:kind==='k'?5:kind==='r'?4:2.5;
  for(let i=0;i<beams;i++){const off=(i-(beams-1)/2)*6;
    add({dur:dur*.7,draw(k){const grow=Math.min(1,k*3),fade=1-Math.max(0,(k-.45)/.55);
      const a2={x:a.x+nx*off,y:a.y+ny*off},b2={x:a.x+dx*grow+nx*off*(1-grow),y:a.y+dy*grow+ny*off*(1-grow)};
      glowLine(a2,b2,c,width,fade);flash(a2,width*3,c,fade*.8);}},i*70);
  }
  if(heavy)add({dur:dur*.6,draw(k){g.save();g.strokeStyle=rgba(c,(1-k)*.8);g.lineWidth=3;g.beginPath();g.arc(a.x,a.y,10+k*40,0,7);g.stroke();g.restore();}});
}
// バリヤー: フレネルの縁+六角の網目+被弾点からの波紋。残り防御が少ないほど赤く、ひびが入る
function barrier(p,from,c,left,dur){
  const r=p.w*.62,hitAng=Math.atan2(from.y-p.y,from.x-p.x),hx=p.x+Math.cos(hitAng)*r,hy=p.y+Math.sin(hitAng)*r;
  const sc=left>=2?c:left===1?[255,90,80]:c;
  add({dur,draw(k){
    const a=k<.15?k/.15:1-(k-.15)/.85;
    g.save();g.beginPath();g.arc(p.x,p.y,r,0,7);g.clip();
    // うすい六角の網目
    g.strokeStyle=rgba(sc,.35*a);g.lineWidth=1;const hs=r/3.2;
    for(let yy=-r;yy<r+hs;yy+=hs*1.5)for(let xx=-r;xx<r+hs;xx+=hs*1.732){const ox=((yy/(hs*1.5))&1)?hs*.866:0;
      g.beginPath();for(let j=0;j<6;j++){const t=j*Math.PI/3+Math.PI/6,X=p.x+xx+ox+Math.cos(t)*hs*.95,Y=p.y+yy+Math.sin(t)*hs*.95;j?g.lineTo(X,Y):g.moveTo(X,Y);}g.closePath();g.stroke();}
    // 被弾点から広がる波紋
    for(let i=0;i<3;i++){const rr=(k*1.6-i*.18)*r*2;if(rr<=0)continue;g.strokeStyle=rgba([255,255,255],a*(1-rr/(r*2.2))*.9);g.lineWidth=2.5;g.beginPath();g.arc(hx,hy,rr,0,7);g.stroke();}
    g.restore();
    // フレネルの縁(外周ほど明るい)
    const gr=g.createRadialGradient(p.x,p.y,r*.55,p.x,p.y,r);gr.addColorStop(0,rgba(sc,0));gr.addColorStop(.8,rgba(sc,.18*a));gr.addColorStop(1,rgba(sc,.85*a));
    g.save();g.globalCompositeOperation='lighter';g.fillStyle=gr;g.beginPath();g.arc(p.x,p.y,r,0,7);g.fill();g.restore();
    flash({x:hx,y:hy},r*.7*(1-k*.6),[255,255,255],a);
    if(left<=1){g.save();g.strokeStyle=rgba([255,220,220],a);g.lineWidth=1.5;g.beginPath();   // ひび
      for(let i=0;i<5;i++){let x=hx,y=hy,t=hitAng+Math.PI+(i-2)*.45;g.moveTo(x,y);for(let s=0;s<3;s++){t+=(Math.sin(i*7+s*3)*.6);x+=Math.cos(t)*r*.28;y+=Math.sin(t)*r*.28;g.lineTo(x,y);}}g.stroke();g.restore();}
  }});
}
function explosion(p,c,big){
  const n=big?70:36,parts=[...Array(n)].map((_,i)=>{const a=Math.random()*7,s=(big?2.6:1.6)*(.3+Math.random());return{a,s,len:Math.random()<.3?10:3};});
  add({dur:big?1800:1100,draw(k){
    const R=p.w*(big?2.2:1.2);
    flash(p,R*(.4+k*.8),[255,170,60],(1-k)*1.1);
    g.save();g.strokeStyle=rgba(c,(1-k)*.9);g.lineWidth=4*(1-k)+1;g.beginPath();g.arc(p.x,p.y,R*k*1.4,0,7);g.stroke();
    if(big){g.strokeStyle=rgba([255,255,255],(1-k)*.7);g.beginPath();g.ellipse(p.x,p.y,R*k*2.2,R*k*.55,0,0,7);g.stroke();}
    g.globalCompositeOperation='lighter';
    for(const q of parts){const d=q.s*k*R*1.3,x=p.x+Math.cos(q.a)*d,y=p.y+Math.sin(q.a)*d;
      g.strokeStyle=k<.4?`rgba(255,240,200,${1-k})`:rgba([255,120,40],1-k);g.lineWidth=q.len>5?1.5:3;
      g.beginPath();g.moveTo(x,y);g.lineTo(x-Math.cos(q.a)*q.len*(1-k),y-Math.sin(q.a)*q.len*(1-k));g.stroke();}
    g.restore();}});
}
function shake(px){const el=document.querySelector('.shell');el?.animate([{transform:'translate(0,0)'},{transform:`translate(${px}px,${-px/2}px)`},{transform:`translate(${-px}px,${px/2}px)`},{transform:'translate(0,0)'}],{duration:320,iterations:2});}
function banner(text,c){
  add({dur:2600,draw(k){const a=k<.1?k/.1:k>.75?(1-k)/.25:1;g.save();g.textAlign='center';g.font='900 46px "Yu Gothic",sans-serif';
    g.fillStyle=rgba([0,0,0],.55*a);g.fillRect(0,innerHeight/2-50,innerWidth,90);g.shadowColor=rgba(c,1);g.shadowBlur=24;g.fillStyle=`rgba(255,255,255,${a})`;g.fillText(text,innerWidth/2,innerHeight/2+12);g.restore();}});
}

// 1手ぶんの演出。fromEl/toEl はマス(DOM)。info は fleetPlay が返す last。
export function playMoveFx(info,fromEl,toEl){
  if(!cv||!fromEl||!toEl)return;
  const a=center(fromEl),b=center(toEl),c=COL[info.who],tc=COL[info.who==='w'?'b':'w'],kind=info.attacker.toLowerCase();
  if(info.order==='repair'){
    playSe('repair');
    add({dur:900,draw(k){g.save();g.globalCompositeOperation='lighter';g.strokeStyle=rgba(c,(1-k)*.9);g.lineWidth=3;g.beginPath();g.arc(a.x,a.y,a.w*(.2+k*.8),0,Math.PI*2);g.stroke();g.restore();flash(a,a.w*.7,c,(1-k)*.65);}});
    return;
  }
  if(!info.attack){playSe('move');add({dur:500,draw(k){g.save();g.globalCompositeOperation='lighter';g.strokeStyle=rgba(c,(1-k)*.7);g.setLineDash([6,8]);g.lineDashOffset=-k*40;g.lineWidth=2;g.beginPath();g.moveTo(a.x,a.y);g.lineTo(b.x,b.y);g.stroke();g.restore();flash(b,a.w*.5,c,(1-k)*.6);}});return;}
  playSe(info.order==='salvo'?'heavy':kind==='n'?'missile':kind==='b'?'fighter':kind==='q'||kind==='k'?'heavy':'beam');
  weapon(kind,a,b,c,650);
  if(info.order==='salvo')add({dur:650,draw(k){if(k>.9)return;glowLine(a,b,c,4,(1-k)*.8);flash(b,18,c,(1-k)*.6);}},120);
  const impact=kind==='n'||kind==='b'?520:260;
  const timer=setTimeout(()=>{
    pending.delete(timer);
    if(info.sink){
      const flag=info.target.toLowerCase()==='k';
      playSe(flag?'flag':'boom');explosion(b,tc,flag);shake(flag?9:4);
      if(flag)banner('旗艦撃沈',c);
    }else{playSe(info.hpAfter<=1?'crack':'shield');barrier(b,a,tc,info.hpAfter,900);}
  },impact);
  pending.add(timer);
}
