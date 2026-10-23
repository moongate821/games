// 合成BGM(音源ファイルなし)。10曲を Web Audio で生成して流す。
// 曲は「調・進行・楽器・ドラム」のパラメーターで定義し、メロディは曲ごとの種から決まる(毎回同じ曲になる)。
const SCALES={
  major:[0,2,4,5,7,9,11],minor:[0,2,3,5,7,8,10],dorian:[0,2,3,5,7,9,10],
  lydian:[0,2,4,6,7,9,11],phrygian:[0,1,3,5,7,8,10],harmonic:[0,2,3,5,7,8,11],
  pentMinor:[0,3,5,7,10],pentMajor:[0,2,4,7,9]
};

// prog: 1小節ごとのコード根音(スケール度数)。arp: 16分音符16個ぶんのコード音の番号(-1は休み)。
export const TRACKS=[
  {id:'throne',name:'王の間',bpm:70,root:50,scale:'dorian',prog:[0,3,4,0,5,3,4,0],pad:'sawtooth',padGain:.05,arpWave:'triangle',arp:[0,-1,1,-1,2,-1,1,-1,0,-1,1,-1,2,-1,3,-1],lead:{wave:'sine',density:.35,range:[7,14],gain:.07},bass:'long',drums:'none',seed:11},
  {id:'forest',name:'ドルイドの森',bpm:64,root:57,scale:'pentMinor',prog:[0,0,2,1,0,0,3,2],pad:'sine',padGain:.08,arpWave:'sine',arp:[0,-1,-1,1,-1,-1,2,-1,-1,1,-1,-1,0,-1,-1,-1],lead:{wave:'triangle',density:.3,range:[5,11],gain:.08},bass:'long',drums:'soft',seed:23},
  {id:'sea',name:'思考の海',bpm:78,root:48,scale:'lydian',prog:[0,1,0,4,0,1,5,4],pad:'sine',padGain:.09,arpWave:'sine',arp:[0,-1,-1,-1,2,-1,-1,-1,1,-1,-1,-1,3,-1,-1,-1],lead:{wave:'sine',density:.22,range:[7,14],gain:.06},bass:'long',drums:'none',seed:37},
  {id:'galaxy',name:'銀河の盤',bpm:104,root:45,scale:'minor',prog:[0,5,2,6,0,5,3,4],pad:'sawtooth',padGain:.035,arpWave:'square',arp:[0,1,2,1,0,1,2,3,0,1,2,1,3,2,1,2],lead:{wave:'sawtooth',density:.4,range:[7,14],gain:.045},bass:'eighth',drums:'pulse',seed:41},
  {id:'eve',name:'決戦前夜',bpm:92,root:40,scale:'phrygian',prog:[0,0,1,0,0,5,1,0],pad:'sawtooth',padGain:.06,arpWave:'sawtooth',arp:[0,-1,0,-1,1,-1,0,-1,2,-1,0,-1,1,-1,0,-1],lead:{wave:'square',density:.3,range:[7,12],gain:.04},bass:'eighth',drums:'march',seed:53},
  {id:'salon',name:'月夜のサロン',bpm:84,root:53,scale:'major',prog:[1,4,0,5,1,4,0,0],pad:'triangle',padGain:.07,arpWave:'triangle',arp:[0,-1,2,-1,3,-1,2,-1,0,-1,2,-1,3,-1,1,-1],lead:{wave:'triangle',density:.45,range:[7,16],gain:.08},bass:'walk',drums:'brush',seed:67,seventh:true,swing:.14},
  {id:'castle',name:'古城の回廊',bpm:76,root:50,scale:'harmonic',prog:[0,5,3,4,0,3,4,0],pad:'square',padGain:.03,arpWave:'sawtooth',arp:[0,1,2,3,2,1,0,1,2,3,2,1,3,2,1,0],lead:{wave:'sawtooth',density:.3,range:[7,13],gain:.035},bass:'long',drums:'none',seed:71},
  {id:'snow',name:'雪の朝',bpm:60,root:55,scale:'major',prog:[0,4,5,3,0,4,3,0],pad:'sine',padGain:.07,arpWave:'triangle',arp:[0,-1,1,-1,2,-1,1,-1,3,-1,2,-1,1,-1,2,-1],lead:{wave:'sine',density:.4,range:[10,17],gain:.09,bell:true},bass:'long',drums:'none',seed:83},
  {id:'neon',name:'ネオン都市',bpm:112,root:42,scale:'minor',prog:[0,0,5,6,0,0,3,4],pad:'sawtooth',padGain:.04,arpWave:'sawtooth',arp:[0,0,2,0,1,1,2,1,0,0,2,0,3,3,2,1],lead:{wave:'square',density:.35,range:[7,14],gain:.04},bass:'drive',drums:'four',seed:97},
  {id:'fleet-battle',name:'艦隊運用 · 交戦',bpm:132,root:40,scale:'phrygian',prog:[0,0,1,0,5,5,6,4],pad:'sawtooth',padGain:.045,arpWave:'sawtooth',arp:[0,0,2,0,1,0,2,3,0,0,2,0,3,2,1,2],lead:{wave:'square',density:.42,range:[7,14],gain:.045},bass:'drive',drums:'four',seed:131},
  {id:'fleet-cruise',name:'艦隊運用 · 星間航行',bpm:96,root:45,scale:'minor',prog:[0,5,3,6,0,5,4,4],pad:'sawtooth',padGain:.04,arpWave:'triangle',arp:[0,-1,1,2,-1,1,2,3,0,-1,1,2,-1,3,2,1],lead:{wave:'triangle',density:.35,range:[7,15],gain:.06},bass:'eighth',drums:'pulse',seed:149},
  {id:'fleet-flag',name:'艦隊運用 · 旗艦の誓い',bpm:74,root:43,scale:'dorian',prog:[0,3,4,0,5,3,6,4],pad:'square',padGain:.03,arpWave:'sawtooth',arp:[0,-1,1,-1,2,-1,3,-1,2,-1,1,-1,0,-1,2,-1],lead:{wave:'sawtooth',density:.3,range:[7,13],gain:.04},bass:'long',drums:'march',seed:163},
  {id:'victory',name:'静かな勝利',bpm:88,root:48,scale:'major',prog:[0,4,5,3,0,4,3,4],pad:'triangle',padGain:.07,arpWave:'sine',arp:[0,-1,1,-1,2,-1,3,-1,2,-1,1,-1,2,-1,1,-1],lead:{wave:'triangle',density:.5,range:[7,16],gain:.08},bass:'long',drums:'soft',seed:101}
];

const mtof=m=>440*2**((m-69)/12);
function rng(seed){let s=seed>>>0||1;return()=>{s^=s<<13;s>>>=0;s^=s>>>17;s^=s<<5;s>>>=0;return s/4294967296;};}
function scaleNote(track,degree,base=track.root){
  const sc=SCALES[track.scale],n=sc.length,oct=Math.floor(degree/n),idx=((degree%n)+n)%n;
  return base+sc[idx]+oct*12;
}
function chordNotes(track,rootDegree){
  const notes=[0,2,4].map(d=>scaleNote(track,rootDegree+d));
  if(track.seventh)notes.push(scaleNote(track,rootDegree+6));else notes.push(scaleNote(track,rootDegree+7));
  return notes;
}

let noiseBuffer=null;
function getNoise(ctx){
  if(noiseBuffer&&noiseBuffer.sampleRate===ctx.sampleRate)return noiseBuffer;
  const buf=ctx.createBuffer(1,ctx.sampleRate,ctx.sampleRate),d=buf.getChannelData(0),r=rng(7);
  for(let i=0;i<d.length;i++)d[i]=r()*2-1;
  return noiseBuffer=buf;
}

function tone(ctx,out,{freq,t,dur,wave='sine',gain=.1,attack=.01,release=.2,cutoff=0,detune=0}){
  const osc=ctx.createOscillator(),amp=ctx.createGain();
  osc.type=wave;osc.frequency.value=freq;osc.detune.value=detune;
  let node=osc;
  if(cutoff){const f=ctx.createBiquadFilter();f.type='lowpass';f.frequency.value=cutoff;osc.connect(f);node=f;}
  node.connect(amp);amp.connect(out);
  const end=t+dur;
  amp.gain.setValueAtTime(0.0001,t);
  amp.gain.linearRampToValueAtTime(gain,t+attack);
  amp.gain.setValueAtTime(gain,Math.max(t+attack,end-release*.2));
  amp.gain.exponentialRampToValueAtTime(0.0001,end+release);
  osc.start(t);osc.stop(end+release+.05);
}
function noiseHit(ctx,out,{t,dur,gain,type='highpass',freq=6000}){
  const src=ctx.createBufferSource(),f=ctx.createBiquadFilter(),amp=ctx.createGain();
  src.buffer=getNoise(ctx);src.loop=true;f.type=type;f.frequency.value=freq;
  src.connect(f);f.connect(amp);amp.connect(out);
  amp.gain.setValueAtTime(gain,t);amp.gain.exponentialRampToValueAtTime(0.0001,t+dur);
  src.start(t,Math.random()*.5);src.stop(t+dur+.02);
}
function kick(ctx,out,t,gain=.3){
  const osc=ctx.createOscillator(),amp=ctx.createGain();
  osc.frequency.setValueAtTime(130,t);osc.frequency.exponentialRampToValueAtTime(42,t+.12);
  osc.connect(amp);amp.connect(out);
  amp.gain.setValueAtTime(gain,t);amp.gain.exponentialRampToValueAtTime(0.0001,t+.28);
  osc.start(t);osc.stop(t+.3);
}

// 1小節ぶんの音を t0 から予約する。barIndex は曲の頭からの小節番号。
export function scheduleBar(ctx,out,track,barIndex,t0){
  const beat=60/track.bpm,step=beat/4,bar=beat*4;
  const rootDeg=track.prog[barIndex%track.prog.length];
  const chord=chordNotes(track,rootDeg);
  const swingAt=i=>t0+i*step+((i%2)?(track.swing||0)*step:0);

  // パッド: 4音を小節いっぱい。
  for(const [i,n] of chord.entries()){
    for(const det of [-6,6])tone(ctx,out,{freq:mtof(n+(i===0?0:12)),t:t0,dur:bar,wave:track.pad,gain:track.padGain/2,attack:bar*.25,release:bar*.3,cutoff:track.pad==='sine'||track.pad==='triangle'?2400:1400,detune:det});
  }

  // アルペジオ
  const arpG=track.arpWave==='sawtooth'||track.arpWave==='square'?.035:.06;
  for(let i=0;i<16;i++){
    const k=track.arp[i];if(k<0)continue;
    const note=chord[k%chord.length]+12*(1+Math.floor(k/chord.length));
    tone(ctx,out,{freq:mtof(note),t:swingAt(i),dur:step*1.6,wave:track.arpWave,gain:arpG,attack:.005,release:step*2,cutoff:track.arpWave==='sine'||track.arpWave==='triangle'?0:3200});
  }

  // ベース
  const bassBase=track.root-12;
  const bn=scaleNote(track,rootDeg,bassBase);
  if(track.bass==='long'){
    tone(ctx,out,{freq:mtof(bn),t:t0,dur:bar*.95,wave:'sine',gain:.16,attack:.03,release:.3});
  }else if(track.bass==='eighth'||track.bass==='drive'){
    for(let i=0;i<8;i++){
      const oct=track.bass==='drive'&&i%4===3?12:0;
      tone(ctx,out,{freq:mtof(bn+oct),t:t0+i*step*2,dur:step*1.7,wave:track.bass==='drive'?'sawtooth':'triangle',gain:track.bass==='drive'?.075:.13,attack:.005,release:.08,cutoff:track.bass==='drive'?700:0});
    }
  }else if(track.bass==='walk'){
    const walk=[0,2,4,2];
    for(let i=0;i<4;i++)tone(ctx,out,{freq:mtof(scaleNote(track,rootDeg+walk[i],bassBase)),t:t0+i*beat+(i%2?0:0),dur:beat*.9,wave:'triangle',gain:.15,attack:.01,release:.12});
  }

  // メロディ(曲・小節ごとに固定の種)
  const r=rng(track.seed*977+barIndex*131+1),L=track.lead,sc=SCALES[track.scale];
  let deg=rootDeg+Math.floor((L.range[0]+L.range[1])/2)-7+(barIndex%2?2:0);
  const stepsLead=[0,2,4,6,8,10,12,14];
  for(const i of stepsLead){
    if(r()>L.density)continue;
    deg+=Math.round((r()-.5)*4);
    deg=Math.max(L.range[0]-7+rootDeg%2,Math.min(L.range[1]-7+4,deg));
    const note=scaleNote(track,deg+7);
    const len=(r()<.4?3:2)*step;
    tone(ctx,out,{freq:mtof(note),t:swingAt(i),dur:len,wave:L.wave,gain:L.gain,attack:L.bell?.002:.02,release:L.bell?.9:.35,cutoff:L.wave==='sine'||L.wave==='triangle'?0:2600});
    if(L.bell)tone(ctx,out,{freq:mtof(note+12),t:swingAt(i),dur:len,wave:'sine',gain:L.gain*.3,attack:.002,release:.5});
  }

  // ドラム
  const d=track.drums;
  for(let i=0;i<16;i++){
    const t=swingAt(i);
    if(d==='soft'){
      if(i===0||i===8)kick(ctx,out,t,.13);
      if(i%4===2)noiseHit(ctx,out,{t,dur:.05,gain:.025});
    }else if(d==='pulse'){
      if(i%4===0)kick(ctx,out,t,.22);
      if(i===4||i===12)noiseHit(ctx,out,{t,dur:.12,gain:.08,type:'bandpass',freq:1800});
      if(i%2===1)noiseHit(ctx,out,{t,dur:.04,gain:.03});
    }else if(d==='march'){
      if(i%8===0)kick(ctx,out,t,.26);
      if(i%4===0&&i%8!==0)noiseHit(ctx,out,{t,dur:.1,gain:.07,type:'bandpass',freq:2200});
      if(i===14)noiseHit(ctx,out,{t,dur:.07,gain:.05,type:'bandpass',freq:2200});
    }else if(d==='brush'){
      if(i%4===0)noiseHit(ctx,out,{t,dur:.14,gain:.03,type:'bandpass',freq:4500});
      if(i%8===6)noiseHit(ctx,out,{t,dur:.06,gain:.03,type:'highpass',freq:7000});
    }else if(d==='four'){
      if(i%4===0)kick(ctx,out,t,.26);
      if(i%4===2)noiseHit(ctx,out,{t,dur:.05,gain:.045});
      if(i===4||i===12)noiseHit(ctx,out,{t,dur:.14,gain:.09,type:'bandpass',freq:1900});
    }
  }
  return bar;
}

// 再生制御
const SAVE_TRACK='threeLayerChess.bgm',SAVE_VOL='threeLayerChess.bgmVolume';
let ctx=null,master=null,reverbSend=null,timer=null,nextTime=0,barIndex=0,current=null,volume=.5,wanted='off',started=false;

function buildReverb(){
  const len=ctx.sampleRate*2.2,buf=ctx.createBuffer(2,len,ctx.sampleRate),r=rng(5);
  for(let c=0;c<2;c++){const d=buf.getChannelData(c);for(let i=0;i<len;i++)d[i]=(r()*2-1)*Math.pow(1-i/len,2.6);}
  const conv=ctx.createConvolver();conv.buffer=buf;return conv;
}
function ensureContext(){
  if(ctx)return;
  const AC=window.AudioContext||window.webkitAudioContext;
  if(!AC)return;
  ctx=new AC();
  master=ctx.createGain();master.gain.value=volume;
  const comp=ctx.createDynamicsCompressor();comp.threshold.value=-14;comp.ratio.value=4;
  master.connect(comp);comp.connect(ctx.destination);
  reverbSend=ctx.createGain();reverbSend.gain.value=.5;
  const rev=buildReverb(),wet=ctx.createGain();wet.gain.value=.35;
  reverbSend.connect(rev);rev.connect(wet);wet.connect(master);
  const dry=ctx.createGain();dry.gain.value=.9;dry.connect(master);
  // 曲の音は dry と reverbSend の両方へ
  bus=ctx.createGain();bus.connect(dry);bus.connect(reverbSend);
}
let bus=null;

function tick(){
  if(!ctx||!current)return;
  // 0.6秒先まで予約する。
  while(nextTime<ctx.currentTime+.6){
    nextTime+=scheduleBar(ctx,bus,current,barIndex,nextTime);
    barIndex++;
  }
}
function stopPlayback(){
  clearInterval(timer);timer=null;
  if(ctx&&bus){
    // 鳴っている音をすばやく消す: 現在の bus を切り離して新しい bus を作る
    const old=bus;
    try{old.disconnect();}catch{}
    const dry=ctx.createGain();dry.connect(master);
    bus=ctx.createGain();bus.connect(dry);bus.connect(reverbSend);
  }
}
function startPlayback(track){
  idleStopped=false;lastActive=Date.now();
  try{channel?.postMessage({from:pageId});}catch{}
  ensureContext();
  if(!ctx)return;
  if(ctx.state==='suspended')ctx.resume().catch(()=>{});
  stopPlayback();
  current=track;barIndex=0;nextTime=ctx.currentTime+.15;
  tick();timer=setInterval(tick,120);
}

export function getSaved(){
  let track='forest',vol=.5;
  try{
    const s=localStorage.getItem(SAVE_TRACK);if(s==='off'||TRACKS.some(t=>t.id===s))track=s;
    const v=parseFloat(localStorage.getItem(SAVE_VOL));if(v>=0&&v<=1)vol=v;
  }catch{}
  return {track,volume:vol};
}
export function setBgm(id){
  wanted=id;
  try{localStorage.setItem(SAVE_TRACK,id);}catch{}
  if(id==='off'){stopPlayback();current=null;return;}
  // 曲の選択そのものが操作なので、ここから鳴らせる
  started=true;
  startPlayback(TRACKS.find(t=>t.id===id));
}
export function setBgmVolume(v){
  volume=Math.max(0,Math.min(1,v));
  try{localStorage.setItem(SAVE_VOL,String(volume));}catch{}
  if(master)master.gain.setTargetAtTime(volume,ctx.currentTime,.05);
}
// 最初のクリック・キー操作で再生を始める(自動再生の制限への対応)
const EVENTS=['pointerdown','mousedown','click','touchstart','touchend','keydown'];
export function initBgm({track,volume:v}){
  volume=v;wanted=track;
  // 操作のたびに確認し、まだ鳴っていなければ始める(止まっていたら再開する)
  const begin=()=>{
    if(wanted==='off')return;
    started=true;
    if(!current||!ctx)startPlayback(TRACKS.find(t=>t.id===wanted));
    else if(ctx.state!=='running'&&!document.hidden){idleStopped=false;lastActive=Date.now();ctx.resume().catch(()=>{});}
  };
  for(const ev of EVENTS)addEventListener(ev,begin,true);
  // 画面を消した・タブを切り替えた・最小化した・ほかのアプリに移ったときは音を止める
  let blurTimer=null;
  const pause=()=>{clearTimeout(blurTimer);if(ctx&&ctx.state==='running')ctx.suspend().catch(()=>{});};
  const resume=()=>{clearTimeout(blurTimer);if(ctx&&wanted!=='off'&&!document.hidden&&ctx.state!=='running')ctx.resume().catch(()=>{});};
  document.addEventListener('visibilitychange',()=>{if(document.hidden)pause();else resume();});
  addEventListener('pagehide',pause);
  addEventListener('pageshow',resume);
  addEventListener('blur',()=>{clearTimeout(blurTimer);blurTimer=setTimeout(pause,3000);});
  addEventListener('focus',resume);
  document.addEventListener('freeze',pause);
  // イベントが届かない場合の保険: 1秒ごとに画面の状態を見る
  setInterval(()=>{
    if(document.hidden||!document.hasFocus()&&Date.now()-lastFocus>3000)pause();
    // 操作が3分ないときも止める(画面を消した・離席したとき)
    if(Date.now()-lastActive>IDLE_MS&&ctx&&ctx.state==='running'){idleStopped=true;pause();}
  },1000);
  for(const ev of ['pointermove','pointerdown','keydown','touchstart','wheel'])addEventListener(ev,()=>{lastActive=Date.now();},true);
  addEventListener('focus',()=>{lastFocus=Date.now();});
  // 同じ音を鳴らすページが複数開いていたら、新しいほうだけ鳴らす
  if('BroadcastChannel' in window){
    channel=new BroadcastChannel('threeLayerChess.bgm');
    channel.onmessage=event=>{if(event.data?.from!==pageId)pause();};
  }
}
const IDLE_MS=3*60*1000,pageId=Math.random().toString(36).slice(2);
let lastActive=Date.now(),lastFocus=Date.now(),idleStopped=false,channel=null;
export function bgmState(){return {started,wanted,ctxState:ctx?.state,current:current?.id,volume};}
// 動作確認用: マスター出力の音量(0〜1)を返す。
export function bgmLevel(){
  if(!ctx)return -1;
  if(!bgmLevel.node){bgmLevel.node=ctx.createAnalyser();bgmLevel.node.fftSize=2048;master.connect(bgmLevel.node);bgmLevel.buf=new Float32Array(2048);}
  bgmLevel.node.getFloatTimeDomainData(bgmLevel.buf);
  let s=0;for(const x of bgmLevel.buf)s+=x*x;return Math.sqrt(s/bgmLevel.buf.length);
}

export function bgmStatusText(){
  if(wanted==='off')return '';
  if(!ctx)return '♪ 画面をクリックすると始まります';
  if(ctx.state==='running')return '♪ 再生中';
  return idleStopped?'♪ 操作がないため止めました。クリックで再開':'♪ 音が止まっています。画面をクリックしてください';
}
