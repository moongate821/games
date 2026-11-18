/* ASTRA: one-pointer constellation rhythm. Music time is the only gameplay clock. */
(()=>{
 'use strict';
 const $=id=>document.getElementById(id),C=AstraCore,M=AstraNoteMotion,tracks=ASTRA_LIBRARY;
 const visuals=new AstraVisuals();let currentLine=null,currentBeat=0,currentEnergy=0,onsetIndex=-1,lastMusicTime=-1,chapter=0,gestureHintUntil=0;
 const canvas=$('sky'),ctx=canvas.getContext('2d'),audio=new Audio();audio.preload='metadata';
 let chosen=tracks[0],mode='normal',filter='all',session=null,state='home',token=0;
 let w=1,h=1,particles=[],rings=[],links=[],lastHit=null,lastFrame=performance.now(),pointer={down:false,x:-1,y:-1,id:null},activeTrace=null;
 let records={},storageAvailable=true,finished=false,lyricText='',reduced=matchMedia('(prefers-reduced-motion: reduce)');
 const key='astra-records-v1',sigils=['✧','✦','⋆','✺','✵','✧'];
 try{records=JSON.parse(localStorage.getItem(key)||'{}');if(!records||Array.isArray(records)||typeof records!=='object')records={};$('offset').value=Math.max(-300,Math.min(300,Number(localStorage.getItem('astra-offset'))||0));$('fx').checked=!reduced.matches&&localStorage.getItem('astra-fx')!=='off';const savedMotion=localStorage.getItem('astra-motion');if(['auto','wave','cylinder','zigzag','comet'].includes(savedMotion))$('motionSelect').value=savedMotion;}catch{storageAvailable=false;}
 const offset=()=>Math.max(-300,Math.min(300,Number($('offset').value)||0))/1000;
 const now=()=>audio.currentTime-offset();
 const fx=()=>$('fx').checked&&!reduced.matches;
 function toast(text){$('toast').textContent=text;$('toast').classList.add('visible');setTimeout(()=>$('toast').classList.remove('visible'),5000);}
 function musicPulse(t){const ons=chosen.onsets;if(lastMusicTime<0||t<lastMusicTime||t-lastMusicTime>1){let lo=0,hi=ons.length;while(lo<hi){const m=(lo+hi)>>>1;if(ons[m].time<=t)lo=m+1;else hi=m;}onsetIndex=lo-1;}while(onsetIndex+1<ons.length&&ons[onsetIndex+1].time<=t)onsetIndex++;lastMusicTime=t;const last=ons[onsetIndex];let sum=0,count=0;for(let i=onsetIndex;i>=0&&t-ons[i].time<1.5&&count<16;i--){sum+=ons[i].strength;count++;}return{beat:last?Math.max(0,1-(t-last.time)/.18):0,energy:Math.min(1,count?sum/count*1.4:0)};}
 function duration(s){return `${Math.floor(s/60)}:${String(Math.floor(s%60)).padStart(2,'0')}`;}
 function recordId(){return chosen.id+':'+mode;}
 function refresh(){
  const shown=tracks.filter(t=>(filter==='all'||t.category===filter)&&t.title.toLowerCase().includes(($('songSearch').value||'').trim().toLowerCase()));if(shown.length&&!shown.some(t=>t.id===chosen.id))chosen=shown[0];$('songCount').textContent=shown.length+' / '+tracks.length+' TRACKS';$('songSelect').replaceChildren();for(const t of shown){const option=document.createElement('option');option.value=t.id;option.textContent=t.title+' · '+duration(t.duration);$('songSelect').append(option);}$('songSelect').value=chosen.id;for(const id of ['start','demo','lyricsOpen','songSelect'])$(id).disabled=!shown.length;const scroll=$('songList').scrollTop;$('songList').replaceChildren();
  shown.forEach((t,i)=>{const b=document.createElement('button');b.className='song'+(chosen.id===t.id?' active':'');b.setAttribute('aria-pressed',chosen.id===t.id?'true':'false');const icon=document.createElement('span');icon.className='sigil';icon.textContent=sigils[i%sigils.length];const body=document.createElement('span');const title=document.createElement('strong');title.textContent=t.title;const meta=document.createElement('small');meta.textContent=t.category+' · '+duration(t.duration)+' · '+t.origin;body.append(title,meta);const score=document.createElement('span');score.className='record';const r=records[t.id+':'+mode];score.textContent=r?(r.full?'✧ 完成':Math.round(r.accuracy)+'%'):'↗';b.append(icon,body,score);b.onclick=()=>{chosen=t;refresh();};$('songList').append(b);});
  $('songList').scrollTop=scroll;$('chosenTitle').textContent=shown.length?chosen.title:'曲が見つかりません';
  const notes=C.chart(chosen,mode);$('chosenMeta').textContent=`${chosen.category} · ${duration(chosen.duration)} · ${notes.length} STARS / ${notes.filter(n=>n.type==='trace').length} TRACE`;const record=records[recordId()];$('bestRecord').textContent=record?'BEST '+record.accuracy.toFixed(1)+'% · '+record.maxCombo+' COMBO'+(record.full?' · ✧ 星座完成':''):'まだ見ぬ星座を、この一曲で。';if(!shown.length){$('chosenMeta').textContent='ジャンルや検索語を変えてください。';$('bestRecord').textContent='';}
 }
 function resize(){const r=canvas.getBoundingClientRect();if(!r.width||!r.height)return;const ow=w,oh=h;w=r.width;h=r.height;if(ow>1&&oh>1){const points=new Set(links.flatMap(l=>[l.a,l.b]));if(lastHit)points.add(lastHit);for(const p of [...points,...particles,...rings]){p.x*=w/ow;p.y*=h/oh;}}const d=Math.min(devicePixelRatio||1,2);canvas.width=Math.round(w*d);canvas.height=Math.round(h*d);ctx.setTransform(d,0,0,d,0,0);}
 new ResizeObserver(resize).observe($('arena'));
 function xy(p){return{x:p.x*w,y:p.y*h};}
 function radius(){return Math.max(25,Math.min(35,Math.min(w,h)*.065));}
 function noteRadius(n){return M.radius(n,radius());}
 function notePose(n,time){return M.sample(n,time,w,h,fx());}
 function dist(a,b){return Math.hypot(a.x-b.x,a.y-b.y);}
 function showDialog(id){if(!$(id).open)$(id).showModal();}
 function closeDialogs(){document.querySelectorAll('dialog[open]').forEach(d=>d.close());}
 async function start(auto=false){
  closeDialogs();const myToken=++token;audio.pause();session=new C.Session(chosen,mode,auto);activeTrace=null;particles=[];rings=[];links=[];lastHit=null;finished=false;pointer.down=false;pointer.id=null;lyricText='';currentLine=null;currentBeat=0;currentEnergy=0;onsetIndex=-1;lastMusicTime=-1;chapter=0;visuals.reset();visuals.enabled=fx();$('chapterFlash').textContent='';$('journeyPercent').textContent='0%';$('journeyStage').textContent='第1章 / 星の入口';$('nextAction').textContent='NEXT / 輪が重なったらタップ';state='loading';$('loading').hidden=false;$('home').hidden=true;$('play').hidden=false;document.body.classList.add('playing');
  $('playTitle').textContent=chosen.title;$('playMode').textContent='ASTRA / '+C.MODES[mode].label+(auto?' / AUTO 観賞':' / TAP + TRACE');$('statusLabel').textContent=auto?'AUTO / 記録には保存しません':'DRAW YOUR CONSTELLATION';$('judgment').textContent='';$('combo').textContent='';$('comboLabel').textContent='';$('playHint').textContent='輪が重なる瞬間にタップ / 流星は押したままなぞる';$('lyric').textContent='♪';resize();audio.src=chosen.src;audio.currentTime=0;
  try{await audio.play();if(myToken!==token)return;state='playing';$('loading').hidden=true;}catch(e){if(myToken!==token)return;home();toast('音楽を読み込めませんでした。接続を確認して、もう一度開始してください。');console.warn('Audio start',e.name);}
 }
 function home(){++token;audio.pause();audio.removeAttribute('src');audio.load();state='home';activeTrace=null;pointer.down=false;pointer.id=null;closeDialogs();$('loading').hidden=true;$('home').hidden=false;$('play').hidden=true;document.body.classList.remove('playing','high-glow');refresh();}
 function pause(){if(state!=='playing')return;state='paused';audio.pause();pointer.down=false;pointer.id=null;showDialog('pauseDialog');}
 async function resume(){if(state!=='paused')return;try{await audio.play();$('pauseDialog').close();state='playing';}catch{toast('続けるボタンをもう一度押してください。');}}
 function burst(p,value,extra=false){
  if(!fx()||value==='MISS')return;
  const tier=Math.min(4,Math.floor(session.streak/8)),count=extra?(typeof extra==='number'?extra:120):value==='PERFECT'?54+tier*18:22;
  rings.push({...p,life:1,age:0,hue:session.streak*21,perfect:value==='PERFECT',tier});
  for(let i=0;i<count;i++){const a=Math.random()*Math.PI*2,v=40+Math.random()*(100+tier*35);particles.push({...p,vx:Math.cos(a)*v,vy:Math.sin(a)*v,life:.5+Math.random()*.8,max:1.3,hue:i*360/count+session.streak*19,size:1+Math.random()*2.4});}
  if(particles.length>550)particles.splice(0,particles.length-550);if(rings.length>24)rings.splice(0,rings.length-24);
 }
 function judge(n,value){if(!session.judge(n,value))return;const p=xy(n.type==='trace'?C.position(n,n.end):n);
  if(value!=='MISS'){if(lastHit)links.push({a:lastHit,b:p,time:now()});lastHit=p;if(links.length>12)links.shift();}
  else lastHit=null;
  burst(p,value);visuals.typography.hit(value);$('judgment').textContent=value;$('judgment').style.color=value==='MISS'?'#c998af':value==='PERFECT'?'#fff1d3':'#99e6df';$('judgment').classList.remove('pop');void $('judgment').offsetWidth;$('judgment').classList.add('pop');
  $('combo').textContent=session.combo>=2?session.combo:'';$('comboLabel').textContent=session.combo>=2?'STARS CONNECTED':'';
 }
 function point(e){const r=canvas.getBoundingClientRect();return{x:e.clientX-r.left,y:e.clientY-r.top};}
 canvas.addEventListener('pointerdown',e=>{
  if(state!=='playing'||session.auto||pointer.down)return;e.preventDefault();const p=point(e);pointer={...p,down:true,id:e.pointerId};canvas.setPointerCapture(e.pointerId);
  visuals.enabled=fx();const double=visuals.press(p,performance.now(),w,h);if(double){gestureHintUntil=performance.now()+1200;$('playHint').textContent='DOUBLE TAP / 虹の光が広がる';}
  const time=now();
  if(activeTrace){return;}
  const n=session.notes.filter(n=>!n.done&&!n.started&&Math.abs(n.time-time)<=C.MODES[mode].window&&dist(p,xy(n))<=Math.max(34,noteRadius(n)*1.55)).sort((a,b)=>Math.abs(a.time-time)-Math.abs(b.time-time))[0];
  if(!n)return;
  const value=C.grade(time-n.time,mode);
  if(n.type==='trace'){n.started=true;n.head=value;n.covered=0;activeTrace=n;burst(xy(n),value);visuals.typography.hit(value);$('playHint').textContent='押したまま、動く星を追いかけよう';}
  else judge(n,value);
 });
 canvas.addEventListener('pointermove',e=>{if(pointer.id!==e.pointerId)return;Object.assign(pointer,point(e));});
 function release(e){if(e.pointerId===pointer.id){pointer.down=false;pointer.id=null;}}
 canvas.addEventListener('pointerup',release);canvas.addEventListener('pointercancel',release);canvas.addEventListener('lostpointercapture',release);
 function update(time,dt){
  if(session.auto){for(const n of session.notes){if(!n.done&&time>=n.end)judge(n,'PERFECT');}}
  else{
   if(activeTrace){const n=activeTrace,lo=Math.max(n.time,time-dt),hi=Math.min(time,n.end),span=Math.max(0,hi-lo);
    if(pointer.down&&dist(pointer,xy(C.position(n,(lo+hi)/2)))<=noteRadius(n)*1.8)n.covered+=span;
    if(time>=n.end){judge(n,C.traceGrade(n.covered/(n.end-n.time),n.head));activeTrace=null;$('playHint').textContent='輪が重なる瞬間にタップ / 流星は押したままなぞる';}
   }
   for(const n of session.notes)if(!n.done&&!n.started&&time>n.time+C.MODES[mode].window)judge(n,'MISS');
  }
  $('score').textContent=String(session.score).padStart(7,'0');$('accuracy').textContent=session.accuracy.toFixed(2)+'%';$('remaining').textContent=duration(Math.max(0,chosen.duration-audio.currentTime));$('progress').style.width=Math.min(100,audio.currentTime/chosen.duration*100)+'%';
  const line=AstraLyricSync.lineAt(chosen.lyricTiming||[],audio.currentTime);
  currentLine=line;const text=line?line.text:'♪';$('lyric').classList.toggle('instrumental',!line);if(text!==lyricText){lyricText=text;$('lyric').textContent=text;}
  $('lyricLabel').textContent=line?'LYRICS / ESTIMATED TIMING':'MUSIC / 星をつないで';
  const pulse=musicPulse(audio.currentTime),beat=pulse.beat;currentBeat=beat;currentEnergy=pulse.energy;
  const percent=Math.min(100,Math.max(0,100*audio.currentTime/chosen.duration)),next=session.notes.find(n=>!n.done);$('journeyPercent').textContent=Math.floor(percent)+'%';$('starProgress').textContent=session.judged+' / '+session.notes.length+' STARS';$('remaining').textContent=duration(audio.currentTime)+' / '+duration(chosen.duration);document.querySelector('.progress').setAttribute('aria-valuenow',Math.floor(percent));
  const phase=percent>=90?3:percent>=66?2:percent>=33?1:0,phases=['第1章 / 星の入口','第2章 / 光の航路','第3章 / 天の川へ','FINALE / 星座の完成へ'];$('journeyStage').textContent=phases[phase];if(phase>chapter){chapter=phase;if(fx()){$('chapterFlash').textContent=phases[phase];$('chapterFlash').classList.remove('reveal');void $('chapterFlash').offsetWidth;$('chapterFlash').classList.add('reveal');visuals.explode(.5,.14,65,110,200+phase*55);}}
  $('nextAction').textContent=activeTrace?'TRACE #'+(activeTrace.id+1)+' / 動く光を追って':next?'NEXT #'+(next.id+1)+' / '+(next.type==='trace'?'押したまま、流星をなぞる':'輪が重なったらタップ'):'FINALE / もうすぐ星座完成';$('nextAction').classList.toggle('tracing',!!activeTrace);if(!activeTrace&&performance.now()>gestureHintUntil)$('playHint').textContent='輪が重なる瞬間にタップ / 流星は押したままなぞる';
  $('lyric').classList.toggle('spark',session.streak>=3&&fx());$('lyric').style.transform=fx()&&!line?`scale(${1+beat*.025})`:'none';
  $('lyric').style.color='';
 }
 function finish(){
  if(finished||!session)return;finished=true;audio.pause();for(const n of session.notes)if(!n.done)judge(n,'MISS');state='result';pointer.down=false;pointer.id=null;activeTrace=null;
  $('journeyPercent').textContent='100%';$('progress').style.width='100%';document.querySelector('.progress').setAttribute('aria-valuenow','100');$('starProgress').textContent=session.judged+' / '+session.notes.length+' STARS';$('nextAction').textContent='演奏終了 / あなたの星座';
  const s=session,full=s.counts.MISS===0;document.body.classList.toggle('high-glow',fx()&&s.accuracy>=80);
  $('resultMode').textContent=C.MODES[mode].label+(s.auto?' / AUTO 観賞':' / YOUR CONSTELLATION');$('resultRank').textContent=s.rank;$('resultArt').textContent=full?'✺':s.accuracy>=90?'✵':s.accuracy>=80?'✧':'⋆';$('resultTitle').textContent=chosen.title;$('resultCelebration').textContent=full?'CONGRATULATIONS / すべての星がつながった':s.accuracy>=90?'夜空いっぱいのオーロラを、あなたに。':s.accuracy>=80?'光のかけらが、星座になった。':'次の一音で、もっと遠くへ。';$('resultScore').textContent=String(s.score).padStart(7,'0');$('resultStats').innerHTML=`<span>精度 <b>${s.accuracy.toFixed(2)}%</b></span><span>最大コンボ <b>${s.maxCombo}</b></span>`;
  for(const [k,v]of Object.entries(s.counts)){const el=document.createElement('span');el.textContent=k+' ';const b=document.createElement('b');b.textContent=v;el.append(b);$('resultStats').append(el);}
  if(s.auto)$('recordNote').textContent='AUTO観賞 / 自己ベストには保存しません';
  else{const old=records[recordId()],best=!old||s.score>old.score;
   records[recordId()]={score:best?s.score:old.score,accuracy:best?s.accuracy:old.accuracy,full:full||Boolean(old?.full),maxCombo:Math.max(s.maxCombo,old?.maxCombo||0)};
   try{localStorage.setItem(key,JSON.stringify(records));$('recordNote').textContent=best?'NEW BEST / この端末に記録しました':'この端末にプレイ記録を保存しました';}catch{storageAvailable=false;$('recordNote').textContent='保存容量またはブラウザー設定により記録を保存できませんでした';}
  }
  const celebration=full?120:s.accuracy>=90?75:s.accuracy>=80?40:12;burst({x:w*.3,y:h*.3},'PERFECT',celebration);burst({x:w*.7,y:h*.45},'PERFECT',celebration);showDialog('result');
 }
 function circle(x,y,r,color,width=1){ctx.beginPath();ctx.arc(x,y,Math.max(0,r),0,Math.PI*2);ctx.strokeStyle=color;ctx.lineWidth=width;ctx.stroke();}
 function star(x,y,r,color,rotation=0){ctx.beginPath();for(let i=0;i<8;i++){const a=i*Math.PI/4-Math.PI/2+rotation,rad=i%2?r*.24:r;const px=x+Math.cos(a)*rad,py=y+Math.sin(a)*rad;i?ctx.lineTo(px,py):ctx.moveTo(px,py);}ctx.closePath();ctx.fillStyle=color;ctx.fill();}
 function arrival(n,p,time,r,alpha){
  if(!fx())return;
  const target=xy(n),hue=175+(n.id%4)*42;
  ctx.save();ctx.globalAlpha=alpha;
  if(!p.arrived){
   circle(target.x,target.y,r,`hsla(${hue},85%,83%,.28)`,1);circle(target.x,target.y,3,'#fff0c980',1);
   ctx.setLineDash([2,8]);ctx.strokeStyle=`hsla(${hue},90%,80%,.18)`;ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(p.x,p.y);ctx.lineTo(target.x,target.y);ctx.stroke();ctx.setLineDash([]);
   for(let i=11;i>=1;i--){
    const q=notePose(n,time-i*.032),after=notePose(n,time-(i-1)*.032);
    ctx.globalAlpha=alpha*(1-i/12)*.68;ctx.strokeStyle=`hsl(${hue+i*6},95%,80%)`;ctx.lineWidth=Math.max(1,r*.26*(1-i/12));ctx.lineCap='round';ctx.beginPath();ctx.moveTo(q.x,q.y);ctx.lineTo(after.x,after.y);ctx.stroke();
    if(i%3===0)star(q.x,q.y,Math.max(1,4-i*.23),'#e4faff',p.angle+i);
   }
  }
  ctx.globalAlpha=alpha*.9;ctx.shadowColor=`hsl(${hue},100%,77%)`;ctx.shadowBlur=14;
  for(let i=0;i<2;i++){const a=p.angle+i*Math.PI,orbit=r+8;star(p.x+Math.cos(a)*orbit,p.y+Math.sin(a)*orbit,4.5,i?'#fff0bc':'#b9ffff',a);}
  ctx.translate(p.x,p.y);ctx.rotate(p.angle);ctx.strokeStyle=`hsla(${hue},95%,83%,.8)`;ctx.lineWidth=2;
  ctx.beginPath();ctx.arc(0,0,r+8,.1,1.2);ctx.arc(0,0,r+8,Math.PI+.1,Math.PI+1.2);ctx.stroke();ctx.restore();
 }
 function curve(n){const a=xy(n),b=xy({x:n.cx,y:n.cy}),c=xy({x:n.tx,y:n.ty});ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.quadraticCurveTo(b.x,b.y,c.x,c.y);}
 function draw(time,dt){
  ctx.clearRect(0,0,w,h);const r=radius();visuals.update(dt,{enabled:fx(),w,h,pointer:state==='playing'?pointer:{down:false},line:currentLine,streak:session?.streak||0,beat:currentBeat,energy:currentEnergy,songTime:audio.currentTime,track:chosen,motion:$('motionSelect').value});visuals.background(ctx,w,h);
  ctx.save();ctx.globalAlpha=.28;circle(w*.5,h*.51,Math.min(w,h)*.46,'#e9c78b28');circle(w*.5,h*.51,Math.min(w,h)*.32,'#e9c78b16');ctx.restore();
  for(let i=0;i<55;i++){const x=((i*137.57)%997)/997*w,y=((i*297.17)%991)/991*h;ctx.globalAlpha=.2+.3*Math.sin(i+time*.5)**2;star(x,y,i%7===0?3:1.2,'#c9e4ec');}ctx.globalAlpha=1;
  for(const l of links){const alpha=Math.max(.035,.26-(time-l.time)*.018);const g=ctx.createLinearGradient(l.a.x,l.a.y,l.b.x,l.b.y);g.addColorStop(0,`rgba(233,199,139,${alpha})`);g.addColorStop(1,`rgba(153,230,223,${alpha})`);ctx.strokeStyle=g;ctx.lineWidth=fx()?1.5:1;ctx.beginPath();ctx.moveTo(l.a.x,l.a.y);ctx.lineTo(l.b.x,l.b.y);ctx.stroke();star(l.a.x,l.a.y,3,'#e9c78b80');star(l.b.x,l.b.y,4,'#99e6df90');}
  const next=session?.notes.find(n=>!n.done);
  if(next&&!next.started&&next.time-time<1.65){const p=notePose(next,time),r=noteRadius(next);ctx.save();ctx.strokeStyle='#ffe6ae99';ctx.lineWidth=1.5;if(lastHit){ctx.setLineDash([3,8]);ctx.beginPath();ctx.moveTo(lastHit.x,lastHit.y);ctx.lineTo(p.x,p.y);ctx.stroke();ctx.setLineDash([]);const u=fx()?(Math.max(0,time)*.7)%1:1;star(lastHit.x+(p.x-lastHit.x)*u,lastHit.y+(p.y-lastHit.y)*u,5,'#fff1bf');}ctx.fillStyle='#ffe6ae';ctx.font='bold 9px sans-serif';ctx.textAlign='center';ctx.fillText('▼ NEXT',p.x,Math.max(w>h?42:68,p.y-r*2.6-10));ctx.restore();}
  const notes=session?session.notes.filter(n=>!n.done&&n.time-time<1.65&&(n.end>=time-.25||n.started)):[];
  for(const n of [...notes].reverse()){
   const p=notePose(n,time),r=noteRadius(n),delta=n.time-time,alpha=Math.max(0,Math.min(1,(1.65-delta)*2));ctx.globalAlpha=alpha;
   if(n.type==='trace'){
    ctx.setLineDash([4,7]);curve(n);ctx.strokeStyle='#a4e7e399';ctx.lineWidth=2;ctx.stroke();ctx.setLineDash([]);
    if(n===next){for(const u of [.3,.6,.85]){const q=xy(C.position(n,n.time+(n.end-n.time)*u)),after=xy(C.position(n,n.time+(n.end-n.time)*Math.min(1,u+.02)));ctx.save();ctx.translate(q.x,q.y);ctx.rotate(Math.atan2(after.y-q.y,after.x-q.x));ctx.strokeStyle='#c5fff4';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(-5,-5);ctx.lineTo(1,0);ctx.lineTo(-5,5);ctx.stroke();ctx.restore();}}
    const end=xy({x:n.tx,y:n.ty});star(end.x,end.y,9,'#a4e7e3a0');
   }
   if(!n.started&&!(session.auto&&time>n.time)){
    arrival(n,p,time,r,alpha);
    const glow=ctx.createRadialGradient(p.x,p.y,0,p.x,p.y,r*2.2);glow.addColorStop(0,n.type==='trace'?'#99e6df25':'#e9c78b28');glow.addColorStop(1,'#00000000');ctx.fillStyle=glow;ctx.fillRect(p.x-r*2.2,p.y-r*2.2,r*4.4,r*4.4);
    if(n===next){ctx.save();ctx.shadowColor='#ffe9ab';ctx.shadowBlur=fx()?24:0;circle(p.x,p.y,r+4,'#fff1b8',2);ctx.restore();}
    if(n===next){const core=ctx.createRadialGradient(p.x-r*.2,p.y-r*.2,0,p.x,p.y,r);core.addColorStop(0,'#fff9e7');core.addColorStop(.76,'#ffe6ae');core.addColorStop(1,'#bd9758');ctx.fillStyle=core;}else ctx.fillStyle='#0b1428e8';ctx.beginPath();ctx.arc(p.x,p.y,r,0,Math.PI*2);ctx.fill();circle(p.x,p.y,r,n.type==='trace'?'#99e6df':'#e9c78b',1.5);
    const approach=r+Math.max(0,Math.min(1,delta/1.65))*r*1.9;circle(p.x,p.y,approach,n.type==='trace'?'#99e6df90':'#e9c78b90',delta<.15?3:1.2);
    ctx.fillStyle=n===next?'#172032':'#f3eddf';ctx.font=`${Math.round(r*.7)}px Georgia`;ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(String(n.id+1),p.x,p.y);
    ctx.font='8px sans-serif';ctx.fillStyle=n.type==='trace'?'#99e6df':'#98a7bd';ctx.fillText(n.type==='trace'?'TRACE':'TAP',p.x,p.y+r+13);
   }
   if((n.started||session.auto)&&time>=n.time&&time<=n.end&&n.type==='trace'){
    const pos=xy(C.position(n,time));ctx.save();ctx.shadowColor='#99e6df';ctx.shadowBlur=fx()?25:0;star(pos.x,pos.y,r*.75,'#fff9dc',fx()?time*3:0);circle(pos.x,pos.y,r*1.4,'#99e6df80');ctx.restore();
    if(fx()){for(let i=1;i<=12;i++){const q=xy(C.position(n,time-i*.025));ctx.globalAlpha=alpha*(1-i/13)*.7;star(q.x,q.y,10-i*.55,`hsl(${160+i*16},90%,80%)`);}}
   }
   ctx.globalAlpha=1;
  }
  if(fx()){
   for(const e of rings){e.age+=dt;e.life-=dt*1.7;if(e.life<=0)continue;ctx.globalAlpha=e.life;const rr=20+e.age*(110+e.tier*25);circle(e.x,e.y,rr,`hsl(${e.hue},95%,80%)`,2);if(e.perfect){circle(e.x,e.y,rr*.68,'#fff7de',3);ctx.save();ctx.shadowColor='#ffe8b4';ctx.shadowBlur=22;star(e.x,e.y,Math.max(0,30*(1-e.age)), '#ffffff');ctx.restore();for(let i=0;i<6;i++){const a=i*Math.PI/3+e.age;star(e.x+Math.cos(a)*rr,e.y+Math.sin(a)*rr,5,`hsl(${e.hue+i*60},100%,85%)`);}}}
   for(const p of particles){p.life-=dt;p.x+=p.vx*dt;p.y+=p.vy*dt;p.vy+=12*dt;ctx.globalAlpha=Math.max(0,p.life/p.max);star(p.x,p.y,p.size,`hsl(${p.hue},85%,82%)`);}
   particles=particles.filter(p=>p.life>0);rings=rings.filter(e=>e.life>0);ctx.globalAlpha=1;
  }else{particles=[];rings=[];}
  visuals.foreground(ctx,w,h);
 }
 function frame(stamp){const dt=Math.min(.1,(stamp-lastFrame)/1000);lastFrame=stamp;if(['playing','paused','result','loading'].includes(state)){const t=now();if(state==='playing')update(t,dt);draw(t,state==='paused'?0:dt);}requestAnimationFrame(frame);}requestAnimationFrame(frame);
 $('start').onclick=()=>start(false);$('demo').onclick=()=>start(true);$('pause').onclick=pause;$('resume').onclick=resume;$('retry').onclick=()=>start(session?.auto||false);$('leave').onclick=home;$('back').onclick=home;$('again').onclick=()=>start(session.auto);$('cancelLoad').onclick=home;
 $('helpOpen').onclick=()=>showDialog('help');$('lyricsOpen').onclick=()=>{$('lyricsTitle').textContent=chosen.title;$('fullLyrics').textContent=chosen.lyrics;const sync=chosen.lyricSyncSummary;$('syncSummary').textContent=sync?'歌詞表示：'+sync.alignedLines+' / '+sync.authoredLines+'行を音源と照合（時刻は推定）。照合できない区間には音符を流します。':'';showDialog('lyricsDialog');};
 document.querySelectorAll('[data-close]').forEach(b=>b.onclick=()=>$(b.dataset.close).close());
 $('genreSelect').onchange=()=>{filter=$('genreSelect').value;refresh();};
 $('difficultySelect').onchange=()=>{mode=$('difficultySelect').value;refresh();};
 $('songSelect').onchange=()=>{chosen=tracks.find(t=>t.id===$('songSelect').value)||chosen;refresh();};
 $('motionSelect').onchange=()=>{try{localStorage.setItem('astra-motion',$('motionSelect').value);}catch{}};
 $('songSearch').addEventListener('input',refresh);$('libraryFold').addEventListener('toggle',()=>{if(!$('libraryFold').open&&$('songSearch').value){$('songSearch').value='';refresh();}});
 $('offset').onchange=()=>{$('offset').value=Math.round(offset()*1000);try{localStorage.setItem('astra-offset',$('offset').value);}catch{}};
 $('fx').onchange=()=>{try{localStorage.setItem('astra-fx',$('fx').checked?'on':'off');}catch{}};
 document.addEventListener('visibilitychange',()=>{if(document.hidden)pause();});window.addEventListener('pagehide',pause);
 document.addEventListener('keydown',e=>{if(['INPUT','TEXTAREA','SELECT','SUMMARY'].includes(e.target.tagName))return;if(e.code==='Space'||e.code==='Escape'){if(state==='playing'){e.preventDefault();pause();}else if(state==='paused'){e.preventDefault();resume();}}});
 $('pauseDialog').addEventListener('cancel',e=>{e.preventDefault();resume();});$('result').addEventListener('cancel',e=>{e.preventDefault();home();});
 audio.addEventListener('ended',()=>{if(state==='playing')finish();});audio.addEventListener('error',()=>{if(state==='playing'||state==='paused'){home();toast('音楽の読み込みが中断されました。もう一度お試しください。');}});
 // Read-only runtime inspection for reproducible QA; no input automation is shipped.
 Object.defineProperty(globalThis,'ASTRA_DEBUG',{get:()=>({state,session,track:chosen,mode,time:now(),width:w,height:h,activeTrace,pointer,storageAvailable,visuals:visuals.stats})});
 refresh();
})();
