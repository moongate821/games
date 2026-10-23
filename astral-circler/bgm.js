// 手続き生成BGM(20曲)。音源ファイルなし。WebAudioでオーケストラを模して演奏する
// 弦楽(チェロ/ヴィオラ/ヴァイオリン/コントラバス)・金管・木管(フルート)・ハープ・合唱・鐘・ティンパニ・スネア・シンバル
const BGM=(()=>{
 const MODES={minor:[0,2,3,5,7,8,10],dorian:[0,2,3,5,7,9,10],phryg:[0,1,3,5,7,8,10],lydian:[0,2,4,6,7,9,11],harm:[0,2,3,5,7,8,11],pent:[0,3,5,7,10],whole:[0,2,4,6,8,10],mixo:[0,2,4,5,7,9,10],loc:[0,1,3,5,6,8,10],hira:[0,2,3,7,8]};
 const PROG=[[0,5,3,4],[0,3,4,3],[0,2,5,4],[0,4,5,2]];
 // n:曲名 root:基音(MIDI) mode:音階 bpm 打楽器(0静/1穏/2壮大/3行進/4太鼓) prog:進行 sty:編成
 const T=(n,root,mode,bpm,drum,prog,sty)=>({n,root,mode,bpm,drum,prog,sty});
 const TR=[
  T('回路庭園の朝',57,'pent',88,1,0,'harp'),
  T('ネオン雨の記憶',62,'dorian',104,3,1,'ost'),
  T('結晶砂漠を渡る風',59,'lydian',80,0,2,'choir'),
  T('虚空の海図',55,'whole',70,0,3,'choir'),
  T('溶岩工廠のリズム',52,'phryg',128,2,1,'brass'),
  T('凍てつく天文台',64,'minor',76,1,0,'winds'),
  T('歯車は夜も回る',60,'mixo',112,3,2,'ost'),
  T('菌糸の夜森',57,'dorian',84,1,3,'winds'),
  T('重力の墓場',50,'loc',96,4,1,'ost'),
  T('紫電の嵐原',54,'harm',138,2,0,'brass'),
  T('水晶の聖堂',65,'lydian',72,0,2,'choir'),
  T('逆さまの都',58,'minor',108,3,3,'ost'),
  T('光の海溝',61,'pent',90,1,1,'harp'),
  T('錆びた衛星軌道',53,'mixo',100,4,0,'brass'),
  T('極光の平原',62,'lydian',78,1,2,'winds'),
  T('砂時計の谷',56,'hira',86,4,3,'harp'),
  T('情報の大瀑布',60,'dorian',132,2,1,'ost'),
  T('沈黙の深淵',47,'phryg',64,0,0,'choir'),
  T('星喰いの門',51,'harm',118,3,2,'brass'),
  T('崩壊特異点',55,'harm',144,2,3,'full')
 ];
 let an0=null,an1=null;
 let ac=null,master,mus,sfx,noise,timer=null,cur=null,step=0,nextT=0,arpA=[],arpB=[],mel=[],vol=.5,muted=false,bossOn=false;
 const mtof=m=>440*Math.pow(2,(m-69)/12);
 function init(){
  if(ac){if(ac.state==='suspended')ac.resume();return ac}
  ac=new(window.AudioContext||window.webkitAudioContext)();
  master=ac.createGain();master.gain.value=.9;
  // 音割れ防止のリミッター(出力は必ずここを通す)と、音量を測るための分析ノード
  const lim=ac.createDynamicsCompressor();lim.threshold.value=-8;lim.knee.value=6;lim.ratio.value=12;lim.attack.value=.003;lim.release.value=.2;
  an0=ac.createAnalyser();an0.fftSize=2048;an1=ac.createAnalyser();an1.fftSize=2048;
  master.connect(an0);master.connect(lim);lim.connect(ac.destination);lim.connect(an1);
  mus=ac.createGain();mus.gain.value=0;sfx=ac.createGain();sfx.gain.value=1;sfx.connect(master);
  // 大きなホール風リバーブ
  const len=ac.sampleRate*3.8,ir=ac.createBuffer(2,len,ac.sampleRate);
  for(let ch=0;ch<2;ch++){const d=ir.getChannelData(ch);for(let i=0;i<len;i++)d[i]=(Math.random()*2-1)*Math.pow(1-i/len,2.2)}
  const cv=ac.createConvolver();cv.buffer=ir;const wet=ac.createGain();wet.gain.value=.42;
  mus.connect(master);mus.connect(wet);wet.connect(cv);cv.connect(master);
  noise=ac.createBuffer(1,ac.sampleRate,ac.sampleRate);const nd=noise.getChannelData(0);for(let i=0;i<nd.length;i++)nd[i]=Math.random()*2-1;
  return ac;
 }
 // ---- 基本部品 ----
 function osc(type,f,t,tot,det){const o=ac.createOscillator();o.type=type;o.frequency.value=f;if(det)o.detune.value=det;o.start(t);o.stop(t+tot);return o}
 function envGain(t,a,dur,rel,v){const g=ac.createGain();a=Math.min(a,dur);g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(v,t+a);g.gain.setValueAtTime(v,t+dur);g.gain.exponentialRampToValueAtTime(.0001,t+dur+rel);return g}
 function lfoTo(param,rate,depth,t,tot,delay){const l=ac.createOscillator(),g=ac.createGain();l.frequency.value=rate;g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(depth,t+delay+.3);l.connect(g);g.connect(param);l.start(t);l.stop(t+tot)}
 function nz(t,d,v,type,freq,loop){const s=ac.createBufferSource();s.buffer=noise;s.loop=!!loop;const f=ac.createBiquadFilter();f.type=type;f.frequency.value=freq;const g=ac.createGain();g.gain.setValueAtTime(v,t);g.gain.exponentialRampToValueAtTime(.001,t+d);s.connect(f);f.connect(g);g.connect(mus);s.start(t);s.stop(t+d+.02)}
 // ---- 楽器 ----
 function strings(f,t,dur,v,o){o=o||{};
  const rel=o.rel||.7,tot=dur+rel+.05,g=envGain(t,o.att||.4,dur,rel,v),lp=ac.createBiquadFilter();
  lp.type='lowpass';lp.frequency.value=Math.min(f*5,o.cut||3500);lp.Q.value=.4;
  [-9,0,9].forEach(d=>{const x=osc('sawtooth',f,t,tot,d);lfoTo(x.detune,5.2+Math.random()*.7,7,t,tot,.25);x.connect(lp)});
  lp.connect(g);g.connect(mus);
 }
 function brass(f,t,dur,v,o){o=o||{};
  const rel=o.rel||.25,a=o.att||.07,tot=dur+rel+.05,g=envGain(t,a,dur,rel,v),lp=ac.createBiquadFilter();
  lp.type='lowpass';lp.Q.value=1.2;lp.frequency.setValueAtTime(f*1.5,t);lp.frequency.linearRampToValueAtTime(Math.min(f*7,5000),t+a+.12);
  [['sawtooth',0,1],['sawtooth',6,1],['square',-5,.4]].forEach(([ty,d,k])=>{const x=osc(ty,f,t,tot,d),gg=ac.createGain();gg.gain.value=k;x.connect(gg);gg.connect(lp)});
  lp.connect(g);g.connect(mus);
 }
 function flute(f,t,dur,v){
  const rel=.2,tot=dur+rel+.05,g=envGain(t,.06,dur,rel,v);
  const x=osc('sine',f,t,tot),y=osc('triangle',f*2,t,tot),yg=ac.createGain();yg.gain.value=.25;y.connect(yg);yg.connect(g);x.connect(g);lfoTo(x.detune,5,9,t,tot,.2);
  const s=ac.createBufferSource();s.buffer=noise;const bp=ac.createBiquadFilter();bp.type='bandpass';bp.frequency.value=f*2;bp.Q.value=1.5;
  const ng=ac.createGain();ng.gain.setValueAtTime(v*.5,t);ng.gain.exponentialRampToValueAtTime(.001,t+.12);s.connect(bp);bp.connect(ng);ng.connect(mus);s.start(t);s.stop(t+.15);
  g.connect(mus);
 }
 function choir(f,t,dur,v){
  const rel=.9,tot=dur+rel+.05,g=envGain(t,.6,dur,rel,v),sum=ac.createGain();
  [[800,.7],[1250,.5],[2600,.2]].forEach(([fq,k])=>{const b=ac.createBiquadFilter();b.type='bandpass';b.frequency.value=fq;b.Q.value=5;const gg=ac.createGain();gg.gain.value=k;sum.connect(b);b.connect(gg);gg.connect(g)});
  [-7,0,7].forEach(d=>{const x=osc('sawtooth',f,t,tot,d);lfoTo(x.detune,4.8,10,t,tot,.4);x.connect(sum)});
  g.connect(mus);
 }
 function harp(f,t,v){
  const g=ac.createGain();g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(v,t+.004);g.gain.exponentialRampToValueAtTime(.0001,t+1.1);
  const x=osc('triangle',f,t,1.2),y=osc('sine',f*2,t,.5),yg=ac.createGain();yg.gain.value=.3;y.connect(yg);yg.connect(g);x.connect(g);g.connect(mus);
 }
 function bell(f,t,v){[[1,1],[2.76,.5],[5.4,.25]].forEach(([m,a],i)=>{const g=ac.createGain();g.gain.setValueAtTime(v*a,t);g.gain.exponentialRampToValueAtTime(.0001,t+1.4/(1+i*.6));const x=osc('sine',f*m,t,1.5);x.connect(g);g.connect(mus)})}
 function timpani(t,f,v){const o=ac.createOscillator(),g=ac.createGain();o.type='sine';o.frequency.setValueAtTime(f*1.5,t);o.frequency.exponentialRampToValueAtTime(f,t+.09);g.gain.setValueAtTime(v,t);g.gain.exponentialRampToValueAtTime(.001,t+.7);o.connect(g);g.connect(mus);o.start(t);o.stop(t+.75);nz(t,.06,v*.4,'lowpass',500)}
 function snare(t,v){nz(t,.14,v,'bandpass',2200);nz(t,.05,v*.5,'highpass',5000)}
 function cymbal(t,dur,v){const s=ac.createBufferSource();s.buffer=noise;s.loop=true;const f=ac.createBiquadFilter();f.type='highpass';f.frequency.value=5500;const g=ac.createGain();
  g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(v,t+dur);g.gain.exponentialRampToValueAtTime(.0001,t+dur+1);s.connect(f);f.connect(g);g.connect(mus);s.start(t);s.stop(t+dur+1.05)}
 function build(i){
  let s=i*9973+7;const r=()=>{s=(s*16807)%2147483647;return s/2147483647};
  const P=TR[i],dens=P.bpm>=110?.7:.5;arpA=[];arpB=[];
  for(let k=0;k<16;k++){const x=r();arpA.push(k%4===0||x<dens*.8);arpB.push(k%2===0||x<Math.min(1,dens+.3))}
  mel=[];let d=3;for(let k=0;k<64;k++){if(k%2===0&&r()<.42){d=Math.max(0,Math.min(9,d+Math.round((r()-.5)*4)));mel.push(d)}else mel.push(-1)}
 }
 function sched(i,t){
  const P=cur,sc=MODES[P.mode],n=sc.length,bar=Math.floor(i/16),pos=i%16,ch=PROG[P.prog][bar%4];
  const deg=d=>P.root+sc[((d%n)+n)%n]+12*Math.floor(d/n);
  const stepT=60/P.bpm/4,sty=P.sty,B=bossOn,fast=P.bpm>=105,ds=B&&P.drum<2?2:P.drum;
  // 弦のコード(全小節)
  if(pos===0){const dur=stepT*15.5;
   strings(mtof(deg(ch)-12),t,dur,.05,{cut:900});
   strings(mtof(deg(ch+2)),t,dur,.034);
   strings(mtof(deg(ch+4)+12),t,dur,.03);
   if(sty==='choir'||sty==='full')choir(mtof(deg(ch+4)),t,dur,.045);
   if(sty==='brass'||sty==='full'||B){brass(mtof(deg(ch)),t,stepT*6,.035);brass(mtof(deg(ch+4)),t,stepT*6,.03)}
   if(bar%4===0&&(P.mode==='pent'||P.mode==='hira'||P.mode==='lydian'))bell(mtof(deg(ch+4)+24),t,.03);
  }
  // コントラバス
  if(pos===0||pos===8)strings(mtof(deg(ch)-24),t,stepT*7.5,.07,{cut:300,att:.05,rel:.2});
  // 弦の刻み(スピッカート)
  if((sty==='ost'||B||(fast&&sty!=='choir'))&&pos%2===0){const tone=ch+[0,2,4,2][(pos/2)%4];strings(mtof(deg(tone)+12),t,stepT*1.6,.028,{att:.01,rel:.08,cut:2600})}
  // ハープのアルペジオ
  if((sty==='harp'||sty==='winds'||sty==='choir')&&(B?arpB:arpA)[pos])harp(mtof(deg(ch+[0,2,4,7,4,2][i%6])+12),t,.05);
  // 旋律
  if(bar%2===1||B){const m=mel[i%64];if(m>=0){
   if(sty==='winds')flute(mtof(deg(m)+24),t,stepT*3.5,.05);
   else if(sty==='brass')brass(mtof(deg(m)+12),t,stepT*3,.04);
   else if(sty==='choir')choir(mtof(deg(m)+12),t,stepT*5,.04);
   else if(sty==='full'){brass(mtof(deg(m)+12),t,stepT*3,.035);strings(mtof(deg(m)+24),t,stepT*3,.03,{att:.03})}
   else strings(mtof(deg(m)+24),t,stepT*3.5,.032,{att:.05,cut:4000});
  }}
  // 打楽器
  const tim=mtof(deg(0)-12),tim5=mtof(deg(4)-12);
  if(ds===0){if(pos===0&&bar%4===0)timpani(t,tim,.12);if(pos===0&&bar%8===0)cymbal(t,2.4,.05)}
  else if(ds===1){if(pos===0)timpani(t,tim,.18);if(pos===8&&bar%2)timpani(t,tim5,.1)}
  else if(ds===2){if(pos%4===0)timpani(t,pos%8===0?tim:tim5,.22);if(bar%4===3&&pos>=8&&pos%2===0)snare(t,.14);if(pos===0&&bar%2===0)cymbal(t,.9,.06);if(pos===4||pos===12)snare(t,.08)}
  else if(ds===3){if(pos===0||pos===8)timpani(t,tim,.2);if(pos===4||pos===12)snare(t,.15);if(pos===14)snare(t,.07)}
  else if(ds===4){if([0,3,6,8,11,14].includes(pos))timpani(t,pos%6===0?tim:tim5*.9,.2)}
 }
 function tick(){
  if(!cur||!ac)return;
  if(nextT<ac.currentTime-.4)nextT=ac.currentTime+.05;
  while(nextT<ac.currentTime+.2){sched(step,nextT);nextT+=60/cur.bpm/4;step++}
 }
 function start(i){
  if(!init())return;cur=TR[i];build(i);step=0;bossOn=false;nextT=ac.currentTime+.15;
  mus.gain.cancelScheduledValues(ac.currentTime);mus.gain.setValueAtTime(0,ac.currentTime);mus.gain.linearRampToValueAtTime(muted?0:vol,ac.currentTime+2);
  if(timer)clearInterval(timer);timer=setInterval(tick,25);
  const el=document.getElementById('trk');if(el)el.textContent='♪ '+cur.n;
 }
 function stop(){
  if(timer){clearInterval(timer);timer=null}cur=null;
  if(ac){mus.gain.cancelScheduledValues(ac.currentTime);mus.gain.setTargetAtTime(0,ac.currentTime,.2)}
  const el=document.getElementById('trk');if(el)el.textContent='♪ ―';
 }
 return{
  init,start,stop,TR,
  boss(b){bossOn=!!b},
  duck(sec){if(!ac||!cur)return;const g=mus.gain,t=ac.currentTime;g.cancelScheduledValues(t);g.setValueAtTime(g.value,t);g.linearRampToValueAtTime(muted?0:vol*.25,t+.1);g.linearRampToValueAtTime(muted?0:vol,t+sec)},
  setVol(v){vol=v;if(ac&&!muted)mus.gain.setTargetAtTime(vol,ac.currentTime,.05)},
  toggleMute(){muted=!muted;if(ac)mus.gain.setTargetAtTime(muted?0:vol,ac.currentTime,.05);return muted},
  ctx(){return ac},sfxBus(){return sfx},
  // 開発用:出力の音量(dBFS)。pre=リミッター前、post=最終出力
  level(){const f=n=>{const b=new Float32Array(n.fftSize);n.getFloatTimeDomainData(b);let q=0,p=0;for(const v of b){q+=v*v;const w=Math.abs(v);if(w>p)p=w}return{rms:20*Math.log10(Math.sqrt(q/b.length)+1e-9),peak:20*Math.log10(p+1e-9)}};return ac&&an0?{pre:f(an0),post:f(an1)}:null}
 };
})();
