'use strict';
(()=>{
 const A=PulseAdventureCore,lastRuns=stored('pulse-last-runs-v1',{}),practicePrefs=stored('pulse-practice-v1',{}),courseRecords=stored('pulse-courses-v1',{});
 let activeCourse=null,missCursor=0,practiceSummary='',sceneKey='';const reducedMotion=matchMedia('(prefers-reduced-motion: reduce)');
 const fmtTime=s=>`${Math.floor(s/60)}:${String(Math.floor(s%60)).padStart(2,'0')}`;
 function dialog(id,title,content){const d=document.createElement('dialog');d.id=id;d.className='adventure-dialog';d.innerHTML=`<div class="modal-head"><h2>${title}</h2><button class="icon-button" aria-label="閉じる">×</button></div>${content}`;d.querySelector('.icon-button').addEventListener('click',()=>d.close());document.body.append(d);return d;}
 function button(text,fn,className='secondary'){const b=document.createElement('button');b.textContent=text;b.className=className;b.addEventListener('click',fn);return b;}
 const hub=document.createElement('div');hub.className='adventure-hub';hub.append(button('◎ 区間練習',()=>openPractice()),button('▷ 3曲チャレンジ',()=>openCourses()),button('✦ 達成メダル',()=>openMedals()));document.querySelector('.collection').insertBefore(hub,document.querySelector('.search-box'));
 const medalStrip=document.createElement('div');medalStrip.id='selectedMedals';medalStrip.className='medal-strip';document.querySelector('.personal-best').after(medalStrip);
 const arrangementNote=document.createElement('p');arrangementNote.id='arrangementNote';arrangementNote.className='arrangement-note';medalStrip.after(arrangementNote);
 const medalDialog=dialog('medalDialog','達成メダル','<p id="medalMode" class="muted"></p><p id="medalTotal" class="medal-total"></p><div id="medalCollection" class="medal-collection"></div><p class="small muted">通常プレイで獲得。練習・コース・オート観賞は通常曲のメダルに含めません。</p>');
 const practiceDialog=dialog('practiceDialog','苦手なところから、もう一度。',`<p id="practiceSong" class="practice-song"></p><p class="small muted">区間・速度を選んで練習。通常プレイの記録とメダルは変わりません。</p><div class="practice-fields"><label>開始（秒）<input id="practiceFrom" type="number" min="0" step="0.1"></label><label>終了（秒）<input id="practiceTo" type="number" min="2" step="0.1"></label><label>再生速度<select id="practiceRate"><option value="0.5">0.50×</option><option value="0.75">0.75×</option><option value="1">1.00×</option></select></label><label class="practice-loop"><input id="practiceLoop" type="checkbox" checked>区間を繰り返す</label></div><p class="small muted">低速再生では音程も下がります。ノーツ速度の設定とは別です。</p><p id="practiceMissInfo" class="small"></p><canvas id="missTimeline" width="720" height="100" aria-label="直前の通常プレイのミス位置。タップした位置の前後を練習できます。"></canvas><div class="practice-miss-actions"><button id="missPrev" class="secondary">‹ 前のミス</button><button id="missWeakest" class="secondary">ミスが多い区間</button><button id="missNext" class="secondary">次のミス ›</button></div><p id="practiceStatus" aria-live="polite"></p><button id="practiceStart" class="primary">この区間を練習 <span>記録対象外</span></button>`);
 const courseDialog=dialog('courseDialog','3曲チャレンジ','<p class="small muted">各45秒×3曲。3区間すべてGROOVE70%以上でコースクリア。通常曲とは別の記録です。</p><div id="courseCards" class="course-cards"></div>');
 const resultPanel=document.createElement('section');resultPanel.id='adventureResult';resultPanel.className='adventure-result';resultPanel.hidden=true;document.querySelector('.graph-label').before(resultPanel);
 const exit=button('練習を終了',()=>goHome(),'practice-exit');exit.id='practiceExit';exit.hidden=true;document.querySelector('.lyric-strip').prepend(exit);
 function badges(container,record){container.replaceChildren();for(const medal of A.medals(record)){const span=document.createElement('span');span.className='medal'+(medal.earned?' earned':'');span.textContent=(medal.earned?'✦ ':'○ ')+medal.label;span.setAttribute('aria-label',medal.label+(medal.earned?' 獲得済み':' 未獲得'));container.append(span);}}
 function refresh(){
  badges(medalStrip,records[recordKey()]);arrangementNote.hidden=!app.track.arrangement;
  if(app.track.arrangement){const legacy=`${app.track.id}/${app.lanes}key/${app.difficulty}/${preferences.mirror?'mirror':'normal'}`,old=records[legacy];arrangementNote.textContent='フレーズ調整版：サビと長押しを見直しました。'+(old?`旧譜面の記録も保持：${old.score}点 / ${old.accuracy.toFixed(2)}%。`:'');}
  document.querySelectorAll('.track-row').forEach(row=>{const title=row.querySelector('.track-meta strong')?.textContent,t=tracks.find(t=>t.title===title);if(!t)return;const earned=A.medals(records[A.chartKey(t,app.lanes,app.difficulty,preferences.mirror)]).filter(m=>m.earned).length;if(earned){const label=document.createElement('span');label.className='row-medals';label.textContent='✦'.repeat(earned);row.querySelector('.row-arrow').before(label);}});
 }
 window.addEventListener('pulse:selection',refresh);
 function openMedals(){
  $('medalMode').textContent=`${app.lanes} KEY / ${difficultyNames[app.difficulty]}${preferences.mirror?' / MIRROR':''}`;const collection=$('medalCollection');collection.replaceChildren();let count=0;
  for(const track of tracks){const record=records[A.chartKey(track,app.lanes,app.difficulty,preferences.mirror)],row=document.createElement('div'),name=button(track.title,()=>{medalDialog.close();app.track=track;renderSelection();});row.className='medal-collection-row';row.append(name);const list=document.createElement('div');list.className='medal-strip';badges(list,record);row.append(list);collection.append(row);count+=A.medals(record).filter(m=>m.earned).length;}
  $('medalTotal').textContent=`このモードで ${count} / ${tracks.length*3} メダル`;medalDialog.showModal();
 }
 function missList(){return lastRuns[recordKey()]?.misses||[];}
 function range(){return {start:Number($('practiceFrom').value),end:Number($('practiceTo').value)};}
 function setRange(start,end){$('practiceFrom').value=Math.max(0,start).toFixed(1);$('practiceTo').value=Math.min(app.track.duration,end).toFixed(1);updatePractice();}
 function drawMisses(){
  const c=$('missTimeline'),p=c.getContext('2d'),w=c.width,h=c.height,{start,end}=range();p.clearRect(0,0,w,h);p.fillStyle='#0b1425';p.fillRect(0,0,w,h);p.fillStyle='#ad9aff22';p.fillRect(start/app.track.duration*w,0,(end-start)/app.track.duration*w,h);
  p.strokeStyle='#788ba033';for(let i=0;i<5;i++){p.beginPath();p.moveTo(i*w/4,0);p.lineTo(i*w/4,h-20);p.stroke();}p.fillStyle='#ff9bb7';for(const time of missList())p.fillRect(time/app.track.duration*w,15,3,h-40);p.fillStyle='#b6c8df';p.font='18px sans-serif';p.fillText('0:00',5,h-3);p.textAlign='right';p.fillText(fmtTime(app.track.duration),w-5,h-3);p.textAlign='left';
 }
 function updatePractice(){const {start,end}=range(),valid=Number.isFinite(start)&&Number.isFinite(end)&&start>=0&&end<=app.track.duration+.01&&end-start>=2;const notes=valid?A.windowNotes(Core.buildChart(app.track,app.difficulty,preferences.mirror,app.lanes),start,end).length:0;$('practiceStart').disabled=!valid||!notes;$('practiceStatus').textContent=!valid?'2秒以上の区間を、曲の長さの範囲で選んでください。':!notes?'この区間にはノーツがありません。区間を広げてください。':`${fmtTime(start)}〜${fmtTime(end)} / ${notes} NOTES / 再生時間 約${Math.ceil((end-start)/Number($('practiceRate').value))}秒`;drawMisses();}
 function openPractice(){
  $('practiceSong').textContent=`${app.track.title} / ${app.lanes} KEY / ${difficultyNames[app.difficulty]}`;const saved=practicePrefs[app.track.id],last=lastRuns[recordKey()];missCursor=0;
  $('practiceFrom').max=String(app.track.duration-2);$('practiceTo').max=String(app.track.duration);$('practiceRate').value=String(saved?.rate||.75);$('practiceLoop').checked=saved?.loop!==false;
  $('practiceMissInfo').textContent=last?`直前の通常プレイ：精度${last.accuracy.toFixed(2)}% / MISS ${last.misses.length}。赤い印がミス位置です。`:'通常プレイ後に、ここでミスした位置を振り返れます。';
  for(const id of ['missPrev','missNext','missWeakest'])$(id).disabled=!missList().length;
  const chosen=saved&&saved.end<=app.track.duration?saved:last?.misses.length?A.weakestWindow(last.misses,app.track.duration):{start:0,end:Math.min(30,app.track.duration)};setRange(chosen.start,chosen.end);practiceDialog.showModal();
 }
 for(const id of ['practiceFrom','practiceTo','practiceRate'])$(id).addEventListener('input',updatePractice);
 $('missTimeline').addEventListener('click',e=>{const box=e.currentTarget.getBoundingClientRect(),t=(e.clientX-box.x)/box.width*app.track.duration;setRange(Math.max(0,t-3),Math.min(app.track.duration,t+12));});
 function chooseMiss(direction){const misses=missList();if(!misses.length)return;missCursor=(missCursor+direction+misses.length)%misses.length;const t=misses[missCursor];setRange(Math.max(0,t-3),Math.min(app.track.duration,t+12));}
 $('missPrev').addEventListener('click',()=>chooseMiss(-1));$('missNext').addEventListener('click',()=>chooseMiss(1));$('missWeakest').addEventListener('click',()=>{const r=A.weakestWindow(missList(),app.track.duration);setRange(r.start,r.end);});
 $('practiceStart').addEventListener('click',()=>{updatePractice();if($('practiceStart').disabled)return;const {start:from,end}=range(),rate=Number($('practiceRate').value),loop=$('practiceLoop').checked;practicePrefs[app.track.id]={start:from,end,rate,loop};save('pulse-practice-v1',practicePrefs);practiceDialog.close();start(false,{mode:'practice',start:from,end,rate,loop});});
 function openCourses(){
  const cards=$('courseCards');cards.replaceChildren();for(const course of A.courses){const card=document.createElement('section'),title=document.createElement('h3'),description=document.createElement('p'),best=document.createElement('p');title.textContent=course.title;description.textContent=course.description;const record=courseRecords[course.id+'/v1'];best.className='small muted';best.textContent=record?`${record.cleared?'✦ COURSE CLEAR':'挑戦記録'} / ベスト精度 ${record.accuracy.toFixed(2)}%${record.fullCombo?' / ALL NO MISS':''}`:'まだ挑戦していません';const names=document.createElement('p');names.className='course-song-names';names.textContent=course.tracks.map(id=>tracks.find(t=>t.id===id)?.title).join(' → ');card.append(title,description,names,best,button('このコースに挑戦',()=>{courseDialog.close();beginCourse(course);},'primary'));cards.append(card);}courseDialog.showModal();
 }
 function beginCourse(course){const original=activeCourse?.original||{track:app.track,lanes:app.lanes,difficulty:app.difficulty};activeCourse={course,index:0,stages:[],original};launchStage();}
 function launchStage(){const c=activeCourse;if(!c)return;app.track=tracks.find(t=>t.id===c.course.tracks[c.index]);app.lanes=c.course.lanes;app.difficulty=c.course.difficulty;renderPads();renderSelection();start(false,{mode:'course',courseId:c.course.id,courseIndex:c.index,focus:c.course.focus,start:12,end:57,rate:1});}
 function normalResult(g){const entry={at:Date.now(),accuracy:g.accuracy,notes:g.notes.length,misses:g.notes.filter(n=>n.grade==='miss').map(n=>Number((n.time-Core.LEAD).toFixed(3))).slice(0,2000)};lastRuns[recordKey()]=entry;const entries=Object.entries(lastRuns).sort((a,b)=>b[1].at-a[1].at);for(const [key] of entries.slice(48))delete lastRuns[key];if(!save('pulse-last-runs-v1',lastRuns))toast('ミス位置を保存できませんでした。');}
 function onResult(g,run){
  exit.hidden=true;resultPanel.replaceChildren();resultPanel.hidden=false;$('retryButton').innerHTML='RETRY <span>もう一度プレイ ↗</span>';
  if(run.mode==='course'&&activeCourse&&activeCourse.course.id===run.courseId){
   const c=activeCourse,heading=document.createElement('h3');heading.textContent=`${c.course.title} / ${c.index+1}曲目`;resultPanel.append(heading);
   if(app.auto){const text=document.createElement('p');text.textContent='AUTO観賞はコースの記録に含めません。';resultPanel.append(text);return;}
   c.stages[c.index]={notes:g.notes.length,earned:g.earned,cleared:g.finished&&g.groove>=70,miss:g.counts.miss};
   const progress=document.createElement('p');progress.textContent=c.course.tracks.map((_,i)=>c.stages[i]?(c.stages[i].cleared?'● CLEAR':'○ 未クリア'):'○ NEXT').join('  →  ');resultPanel.append(progress);$('retryButton').innerHTML='RESTART <span>コースを最初から</span>';
   if(c.index<2){resultPanel.append(button('次の曲へ →',()=>{c.index++;launchStage();},'primary'));}
   else{const total=A.aggregate(c.stages),label=document.createElement('p');label.className='course-complete';label.textContent=`${total.cleared?'COURSE CLEAR!':'コース完走・再挑戦しよう'} / 総合精度 ${total.accuracy.toFixed(2)}%${total.fullCombo?' / ALL NO MISS':''}`;resultPanel.append(label);const key=c.course.id+'/v1',old=courseRecords[key];courseRecords[key]={accuracy:Math.max(old?.accuracy||0,total.accuracy),cleared:!!old?.cleared||total.cleared,fullCombo:!!old?.fullCombo||total.fullCombo,plays:(old?.plays||0)+1};if(!save('pulse-courses-v1',courseRecords))toast('コースの記録を保存できませんでした。');}
   if($('finishLabel')&&!$('finishCelebration').hidden)$('finishLabel').textContent=g.counts.miss===0?'COURSE STAGE / NO MISS':`COURSE ${c.index+1}/3`;
  }else if(run.mode==='practice'){const text=document.createElement('p');text.textContent=practiceSummary+' 通常プレイの記録には保存されません。';resultPanel.append(text,button('区間を変えて練習',()=>openPractice()));}
  else{const list=document.createElement('div');list.className='medal-strip';badges(list,records[recordKey()]);const label=document.createElement('p'),remaining=A.medals(records[recordKey()]).filter(m=>!m.earned);label.textContent=app.auto?'オートで覚えたら、自分の指で挑戦してみよう。':remaining.length?'次の目標：'+remaining[0].label:'この譜面のメダルをすべて獲得！';resultPanel.append(list,label,button('苦手な区間を練習する',()=>openPractice()));}
 }
 function onHome(){exit.hidden=true;resultPanel.hidden=true;if(activeCourse){const original=activeCourse.original;activeCourse=null;app.track=original.track;app.lanes=original.lanes;app.difficulty=original.difficulty;renderPads();}}
 const themes={sakura:{label:'桜の舞台',a:'#ff9bc9',b:'#c7a6ff'},neon:{label:'NEON CITY',a:'#79edff',b:'#d09aff'},storm:{label:'雷光の舞台',a:'#a3aaff',b:'#f4c780'},orbit:{label:'ORBITAL SKY',a:'#cfff85',b:'#a5bfff'}};
 function stage(ctx,w,h,line,t,state,prefs,geometry=null){
  const songTime=Math.max(0,t-Core.LEAD),s=A.section(state.track,songTime),theme=themes[state.track.stageTheme]||themes.orbit,key=state.track.id+'/'+s.time;
  const phase={intro:'INTRO',verse:'VERSE',build:'BUILD',chorus:'サビ',peak:'PEAK',break:'INTERLUDE',outro:'FINALE'}[s.kind]||'VERSE',run=state.run||{};
  if(sceneKey!==key){sceneKey=key;document.querySelector('.field').style.setProperty('--scene-a',theme.a+'24');document.querySelector('.field').style.setProperty('--scene-b',theme.b+'14');$('stageStatus').textContent=`${theme.label} / ${phase} · ${run.mode==='practice'?`練習${run.iteration}回目・記録なし`:run.mode==='course'?`COURSE ${run.courseIndex+1}/3`:state.auto?'AUTO・記録なし':'FEEL THE ORBIT'}`;}
  if(!prefs.effects||reducedMotion.matches)return;
  const intensity=prefs.fxIntensity/100,peak=['chorus','peak'].includes(s.kind),power=(peak?1:.5)*intensity,beat=60/state.track.bpm,pulse=Math.exp(-((songTime%beat)/beat)*5);ctx.save();ctx.globalAlpha=.1+power*.2;ctx.lineWidth=1;
  if(state.track.stageTheme==='sakura'){
   for(let i=0;i<23;i++){const x=(i*137+Math.sin(songTime*.35+i)*28+w)%w,y=(songTime*(12+power*10)+i*91)%(line+70)-35;ctx.save();ctx.translate(x,y);ctx.rotate(songTime*.55+i);ctx.fillStyle=i%2?theme.a:theme.b;ctx.beginPath();ctx.moveTo(0,-5);ctx.bezierCurveTo(8,-4,8,4,0,8);ctx.bezierCurveTo(-6,3,-6,-2,0,-5);ctx.fill();ctx.restore();}
  }else if(state.track.stageTheme==='neon'){
   ctx.strokeStyle=theme.a;for(let i=0;i<9;i++){const u=(i-4)/4+.5,a=geometry?geometry.point(u,0):{x:w/2+(i-4)*12,y:0},b=geometry?geometry.point(u,1):{x:(i-4)*w/5+w/2,y:line};ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.stroke();}ctx.strokeStyle=theme.b;for(let i=0;i<7;i++){const phase=(songTime*.08+i/7)%1,a=geometry?geometry.point(-.45,phase):{x:0,y:phase*line},b=geometry?geometry.point(1.45,phase):{x:w,y:phase*line};ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.stroke();}
  }else if(state.track.stageTheme==='storm'){
   for(let side=0;side<2;side++){ctx.strokeStyle=side?theme.a:theme.b;ctx.lineWidth=peak?2:1;ctx.beginPath();for(let i=0;i<14;i++){const x=(side?w-12:12)+Math.sin(i*2.2+songTime*3)*(4+pulse*7),y=i/13*line;i?ctx.lineTo(x,y):ctx.moveTo(x,y);}ctx.stroke();}
  }else{
   for(let i=0;i<22;i++){const angle=i*2.4+songTime*.15,x=w/2+Math.cos(angle)*(w*.25+i%4*12),y=line*.45+Math.sin(angle)*line*.32;ctx.fillStyle=i%2?theme.a:theme.b;ctx.fillRect(x,y,1.5+pulse,1.5+pulse);}
  }
  if(peak){ctx.strokeStyle=theme.a;ctx.globalAlpha=power*pulse*.32;ctx.lineWidth=2;ctx.beginPath();ctx.ellipse(w/2,line*.5,w*(.25+pulse*.15),line*.3,Math.sin(songTime*.3)*.2,0,Math.PI*2);ctx.stroke();}
  ctx.restore();
 }
 globalThis.PulseAdventure={openPractice,openCourses,openMedals,onNormalResult:normalResult,onPractice(g,run){practiceSummary=`${run.iteration}回目：精度${g.accuracy.toFixed(2)}% / MISS ${g.counts.miss}。`;},onResult,onHome,stage,onStart(run){sceneKey='';resultPanel.hidden=true;exit.hidden=run.mode!=='practice';},retry(){if(activeCourse&&app.run?.mode==='course'){beginCourse(activeCourse.course);return true;}return false;}};
 refresh();
})();
