/* Original adaptive synth score. No external tracks or network dependency. */
window.AbyssalAudio=(()=>{
 function create(ctx){
  const master=ctx.createGain(),music=ctx.createGain(),fx=ctx.createGain(),limiter=ctx.createDynamicsCompressor();
  master.gain.value=.65;music.gain.value=.65;fx.gain.value=.75;
  limiter.threshold.value=-16;limiter.knee.value=12;limiter.ratio.value=8;limiter.attack.value=.003;limiter.release.value=.18;
  music.connect(master);fx.connect(master);master.connect(limiter);limiter.connect(ctx.destination);
  const delay=ctx.createDelay(.5),echo=ctx.createGain();delay.delayTime.value=.19;echo.gain.value=.18;delay.connect(echo);echo.connect(music);
  const noise=ctx.createBuffer(1,ctx.sampleRate,ctx.sampleRate);let seed=9271;
  const data=noise.getChannelData(0);for(let i=0;i<data.length;i++){seed=(seed*1664525+1013904223)>>>0;data[i]=seed/2147483648-1;}
  let voices=0,next=0,step=0,active=false,lastFx=-1;
  const hz=n=>440*Math.pow(2,(n-69)/12);
  function tone(at,freq,duration,volume=.1,type='sawtooth',bus=music,end=freq,pan=0,wet=false){
   if(voices>120&&!(ctx instanceof OfflineAudioContext))return;voices++;
   const o=ctx.createOscillator(),v=ctx.createGain(),p=ctx.createStereoPanner();o.type=type;p.pan.value=pan;
   o.frequency.setValueAtTime(Math.max(20,freq),at);o.frequency.exponentialRampToValueAtTime(Math.max(20,end),at+duration);
   v.gain.setValueAtTime(0,at);v.gain.linearRampToValueAtTime(volume,at+.006);v.gain.exponentialRampToValueAtTime(.0001,at+duration);
   o.connect(v);v.connect(p);p.connect(bus);if(wet)p.connect(delay);
   o.start(at);o.stop(at+duration+.01);o.onended=()=>{o.disconnect();v.disconnect();p.disconnect();voices--;};
  }
  function hiss(at,duration,volume,cutoff=6000,bus=music,pan=0){
   if(voices>120&&!(ctx instanceof OfflineAudioContext))return;voices++;
   const o=ctx.createBufferSource(),v=ctx.createGain(),f=ctx.createBiquadFilter(),p=ctx.createStereoPanner();o.buffer=noise;f.type='bandpass';f.frequency.value=cutoff;f.Q.value=.6;p.pan.value=pan;
   v.gain.setValueAtTime(0,at);v.gain.linearRampToValueAtTime(volume,at+.004);v.gain.exponentialRampToValueAtTime(.0001,at+duration);
   o.connect(f);f.connect(v);v.connect(p);p.connect(bus);o.start(at);o.stop(at+duration);o.onended=()=>{o.disconnect();f.disconnect();v.disconnect();p.disconnect();voices--;};
  }
  function sequence(at,s,stage=0,level=1,boss=false){
   const phase=boss===true?1:Number(boss)||0,bpm=phase?158+phase*12:148+(stage%3)*4,unit=60/bpm/4,bar=Math.floor(s/16),beat=s%16;
   const roots=[0,-3,-5,-2],root=40+[0,2,-2,5][Math.floor(stage/3)%4]+roots[bar%4];
   // Kick, backbeat snare, offbeat cymbal and fills.
   if(beat%4===0||(boss&&beat===14))tone(at,145,.16,.48,'sine',music,42);
   if(beat===4||beat===12){hiss(at,.15,.26,2200);tone(at,180,.09,.16,'triangle',music,85);}
   if(beat%2===0||level>=3)hiss(at,.035,beat%4===2?.10:.045,8500,music,beat%4===2?.4:-.4);
   if(bar%4===3&&beat>=14)hiss(at,.07,.13,3000);
   if(beat===0&&bar%4===0)hiss(at,.65,.12,7000);
   const bass=root+(beat%8===6?12:0);if(beat%2===0)tone(at,hz(bass),unit*1.7,.16,'sawtooth',music,hz(bass),-.12);
   const melodies=[[12,15,19,22,19,15,10,14],[12,19,24,22,19,17,15,10],[12,12,19,15,22,19,24,22],[19,17,15,12,10,14,17,22]];
   const melody=melodies[(stage+Math.floor(bar/4))%4],note=root+12+melody[Math.floor(beat/2)];
   if(beat%2===0){tone(at,hz(note),unit*1.8,.075,'square',music,hz(note),.15,true);if(level>=2)tone(at,hz(note+7),unit*1.7,.032,'triangle',music,hz(note+7),-.45,true);}
   if(level>=3||boss){const arp=[0,7,12,15][beat%4];tone(at,hz(root+24+arp),unit*.8,.045,'triangle',music,hz(root+24+arp),beat%2?.65:-.65,true);}
   if(phase>=2&&beat%2===1)tone(at,hz(root+12),unit*.7,.055,'sawtooth',music,hz(root+12),-.3);
   if(phase===3&&beat%4===2){tone(at,160,.12,.28,'sine',music,40);hiss(at,.08,.08,4500);}
   if(beat%8===0)for(const n of [0,7,12])tone(at,hz(root+12+n),unit*7,.024,'sawtooth',music,hz(root+12+n),n===0?-.6:.6);
   return unit;
  }
  function tick(state,stage,level,boss,muted){
   const now=ctx.currentTime,playing=state==='playing'&&!muted;
   master.gain.setTargetAtTime(playing?.65:0,now,.035);
   if(!playing){active=false;next=now;return;}
   if(ctx.state!=='running')return;
   if(!active){next=now+.02;active=true;}
   if(next<now-.2)next=now+.02;
   while(next<now+.12){next+=sequence(next,step++,stage,level,boss);}
  }
  function attack(id,level=1,at=ctx.currentTime){
   if(at-lastFx<.035)return;lastFx=at;
   const base=[720,420,1400,240,330,680,110,180,1100,830,100][id]||440;
   const dur=[.09,.14,.16,.2,.22,.14,.2,.25,.18,.16,.5][id]||.12;
   const type=id===2||id===8?'sawtooth':id===6||id===10?'triangle':'square';
   tone(at,base,dur,.075,type,fx,base*(id===4?1.8:.25));
   if([3,6,7,10].includes(id))hiss(at,dur,.22,id===10?450:1800,fx);
   if(level>=2)tone(at+.018,base*1.5,dur*.9,.045,'sawtooth',fx,base*.4,-.4);
   if(level>=3){tone(at+.035,base*2,dur,.04,'triangle',fx,base*.6,.5);hiss(at,.09,.045,5000,fx,.35);}
   if(level>=4)tone(at+.05,base*3,dur,.035,'square',fx,base,.2);
   if(id>=6||id===3){tone(at,65+level*10,.2,.13,'sine',fx,28);}
  }
  function explosion(level=1,at=ctx.currentTime){tone(at,120,.5,.3,'sine',fx,25);hiss(at,.4+level*.1,.26,650,fx);if(level>=2)hiss(at+.07,.3,.12,2300,fx,-.5);if(level>=3)tone(at+.1,310,.32,.08,'sawtooth',fx,40,.5);}
  function overdrive(level=1,at=ctx.currentTime){
   explosion(level,at);for(let i=0;i<8;i++){tone(at+i*.12,165+i*28,.32,.09,'sawtooth',fx,330+i*40,i%2?.5:-.5);hiss(at+i*.13,.12,.06,2000+i*400,fx);}for(const n of [0,7,12])tone(at+.08,hz(57+n),1.2,.045,'triangle',fx,hz(69+n));
  }
  function upgrade(level,at=ctx.currentTime){[0,4,7,12,19].slice(0,level+2).forEach((n,i)=>tone(at+i*.065,hz(72+n),.25,.13,'triangle',fx,hz(72+n),i%2?.4:-.4));}
  function ping(freq,duration,type,volume){tone(ctx.currentTime,freq,duration,volume,type,fx,Math.max(35,freq*.5));}
  return {ctx,tick,attack,explosion,overdrive,upgrade,ping,sequence,status:()=>({voices,step,active,state:ctx.state})};
 }
 let engine=null;
 function unlock(){try{engine ||= create(new (window.AudioContext||window.webkitAudioContext)());if(engine.ctx.state==='suspended')engine.ctx.resume().catch(()=>{});}catch{}return engine;}
 return {create,unlock,get:()=>engine};
})();
