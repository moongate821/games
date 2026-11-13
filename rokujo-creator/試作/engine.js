'use strict';
(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory(require('./storydata.js'),require('./development.js'),require('./continuation.js'),require('./campaign.js'),require('./civilization.js'));else root.RokujoEngine=factory(root.RokujoStory,root.RokujoDevelopment,root.RokujoContinuation,root.RokujoCampaign,root.RokujoCivilization);})(globalThis,(N,D,C,P,V)=>{
 const clone=value=>JSON.parse(JSON.stringify(value));
 const clamp=(v,min,max)=>Math.max(min,Math.min(max,v));
 const integer=(v,min,max)=>Number.isInteger(v)&&v>=min&&v<=max;
 const text=v=>typeof v==='string'&&v.length<2000;
 const config=Object.freeze({waterConsumption:8,foodConsumption:6,foodProduction:9,dryFoodProduction:2,irrigationProduction:20,minimum:15,supportCost:2,waterGain:20,supportRecovery:1,maxSupport:6,warning:25,emergencyTicks:3,conditionalTicks:3,irrigationTicks:2});
 const titles=['最初の夜','翌朝の危機','論理の種','人の手による発見','暮らしへつながる'];
 function add(s,kind,title,body){s.chronicle.unshift({id:`record.${s.revision}.${s.chronicle.length}`,tick:s.world.tick,kind,title,text:body});}
 function event(s,id,kind,title,body,details={}){
  if(s.story.effectsApplied.includes(id))return;
  s.story.effectsApplied.push(id);s.story.queued.push({id,kind,title,text:body,...details});
  const priority={emergency:0,crisis:1,story:2,discovery:3,life:4};
  s.story.queued.sort((a,b)=>priority[a.kind]-priority[b.kind]);add(s,kind,title,body);
 }
 function snapshot(s){const c=clone(s);c.checkpoint=null;return c;}
 function makeCheckpoint(s){s.checkpoint=snapshot(s);}
 function create(){return {
  schemaVersion:2,revision:0,world:{worldId:'world.arcadia',chapterId:'chapter.opening',eraId:'era.seed',tick:0,stage:0},
  resources:{water:36,food:42,support:6},tutorial:{rescue:false,rain:false,light:false},supportUsedTick:-1,
  knowledge:[],research:{conditional:0,irrigation:0},facilities:{irrigationCompletedTick:null},
  people:{aria:{personId:'person.aria',lifeId:'life.aria.early',active:true},galdo:{personId:'person.galdo',lifeId:'life.galdo.early'}},
  narrative:{version:1,step:0,eternalProgress:0,eternalCompletedTick:null,circuitProgress:0,circuitCompletedTick:null},
  planning:{links:[]},contact:{drawn:[]},expedition:{filed:[]},academy:{seen:[]},survey:{measured:[]},municipal:{observed:[],completedTick:null},industry:{batchProgress:0,batchCompletedTick:null,heard:[]},
  lifeLedger:[{lifeId:'life.aria.early',status:'current',memories:[]}],
  story:{queued:[],read:[],effectsApplied:[],pageOffsets:{},journal:[]},crisis:{waterZero:0,foodZero:0,waterCritical:false,foodCritical:false,emergency:false},
  chronicle:[{id:'record.start',tick:0,kind:'story',title:'最初の夜',text:'小さな村にダニが迫っている。ピンセットで、目の前の命を助けよう。'}],checkpoint:null
 };}
 function validateCore(s,nested=false){
  if(!s||s.schemaVersion!==2||!integer(s.revision,0,10000000))return false;
  if(!s.world||s.world.worldId!=='world.arcadia'||!['chapter.opening','chapter.arcadia_origins'].includes(s.world.chapterId)||!['era.seed','era.first_city','era.return','era.research','era.eternal_lights','era.networked','era.industrial','era.planned_city','era.shared_knowledge','era.common_promise','era.inheritance','era.exploration','era.known_world','era.river_crossing','era.first_contact','era.dialogue','era.common_calendar','era.community','era.genesis_plan','era.third_contact','era.hunter_friendship','era.ocean_exploration','era.underground','era.dwald_diplomacy','era.crystal_technology','era.four_civilizations','era.harbor_building','era.ocean_ships','era.great_voyage','era.western_continent','era.maresia_exchange','era.navigation_school'].includes(s.world.eraId)||!integer(s.world.tick,0,1000000)||!integer(s.world.stage,0,4))return false;
  if(!s.resources||!integer(s.resources.water,0,100)||!integer(s.resources.food,0,100)||!integer(s.resources.support,0,6)||!integer(s.supportUsedTick,-1,s.world.tick))return false;
  if(!s.tutorial||!['rescue','rain','light'].every(k=>typeof s.tutorial[k]==='boolean'))return false;
  if(!Array.isArray(s.knowledge)||s.knowledge.length>1||!s.knowledge.every(k=>k==='knowledge.if_else'))return false;
  if(!s.research||!integer(s.research.conditional,0,3)||!integer(s.research.irrigation,0,2))return false;
  if(!s.facilities||(s.facilities.irrigationCompletedTick!==null&&!integer(s.facilities.irrigationCompletedTick,0,s.world.tick)))return false;
  if(!s.narrative||s.narrative.version!==1||!integer(s.narrative.step,0,N.chapters.length-1)||!integer(s.narrative.eternalProgress,0,3))return false;
  const arc=s.narrative.step;
  if(!s.academy||!Array.isArray(s.academy.seen)||s.academy.seen.length>5||new Set(s.academy.seen).size!==s.academy.seen.length||!s.academy.seen.every(id=>N.inventions.some(x=>x.id===id)))return false;
  if(!s.survey||!Array.isArray(s.survey.measured)||s.survey.measured.length>4||new Set(s.survey.measured).size!==s.survey.measured.length||!s.survey.measured.every(id=>N.surveyRoutes.some(x=>x.id===id)))return false;
  if(arc<27&&s.academy.seen.length||arc>=28&&s.academy.seen.length!==5||arc<30&&s.survey.measured.length||arc>=31&&s.survey.measured.length!==4)return false;
  if(!s.industry||!integer(s.industry.batchProgress,0,3)||!Array.isArray(s.industry.heard)||s.industry.heard.length>3||new Set(s.industry.heard).size!==s.industry.heard.length||!s.industry.heard.every(id=>N.socialVoices.some(x=>x.id===id)))return false;
  if(arc<21&&s.industry.batchProgress||arc>=22&&s.industry.batchProgress!==3||arc<24&&s.industry.heard.length||arc>=25&&s.industry.heard.length!==3)return false;
  if(s.industry.batchProgress===3?!integer(s.industry.batchCompletedTick,0,s.world.tick):s.industry.batchCompletedTick!==null)return false;
  if(!s.municipal||!Array.isArray(s.municipal.observed)||s.municipal.observed.length>5||new Set(s.municipal.observed).size!==s.municipal.observed.length||!s.municipal.observed.every(id=>N.networkItems.some(x=>x.id===id)))return false;
  if(arc<15&&s.municipal.observed.length||arc>=16&&s.municipal.observed.length!==5)return false;
  if(s.municipal.observed.length===5?!integer(s.municipal.completedTick,0,s.world.tick):s.municipal.completedTick!==null)return false;
  if(!integer(s.narrative.circuitProgress,0,3)||arc<12&&s.narrative.circuitProgress!==0||arc>=13&&s.narrative.circuitProgress!==3)return false;
  if(s.narrative.circuitProgress===3?!integer(s.narrative.circuitCompletedTick,0,s.world.tick):s.narrative.circuitCompletedTick!==null)return false;
  if(arc>0&&s.world.stage!==4||arc===0&&s.world.eraId!=='era.seed')return false;
  if(arc<6&&s.narrative.eternalProgress!==0||arc>=7&&s.narrative.eternalProgress!==3)return false;
  if(s.narrative.eternalProgress===3?!integer(s.narrative.eternalCompletedTick,0,s.world.tick):s.narrative.eternalCompletedTick!==null)return false;
  if(!s.people||s.people.aria?.personId!=='person.aria'||s.people.aria?.lifeId!==(arc>=3?'life.aria.return':'life.aria.early')||s.people.aria?.active!==(arc!==2)||s.people.galdo?.personId!=='person.galdo'||s.people.galdo?.lifeId!=='life.galdo.early')return false;
  if(!Array.isArray(s.lifeLedger)||s.lifeLedger.length!==(arc>=3?2:1))return false;
  if(!s.lifeLedger.every(l=>l&&['life.aria.early','life.aria.return'].includes(l.lifeId)&&['current','remembered'].includes(l.status)&&Array.isArray(l.memories)&&l.memories.length<=20&&l.memories.every(text)))return false;
  if(s.lifeLedger[0].lifeId!=='life.aria.early'||s.lifeLedger[0].status!==(arc>=2?'remembered':'current'))return false;
  if(arc>=3&&(s.lifeLedger[1].lifeId!=='life.aria.return'||s.lifeLedger[1].status!=='current'))return false;
  if(!s.expedition||!Array.isArray(s.expedition.filed)||s.expedition.filed.length>3||new Set(s.expedition.filed).size!==s.expedition.filed.length||!s.expedition.filed.every(id=>N.expeditionRecords.some(x=>x.id===id)))return false;
  if(arc<43&&s.expedition.filed.length||arc>=44&&s.expedition.filed.length!==3)return false;
  if(!s.contact||!Array.isArray(s.contact.drawn)||s.contact.drawn.length>4||new Set(s.contact.drawn).size!==s.contact.drawn.length||!s.contact.drawn.every(id=>N.contactSymbols.some(x=>x.id===id)))return false;
  if(arc<49&&s.contact.drawn.length||arc>=50&&s.contact.drawn.length!==4)return false;
  if(!s.planning||!Array.isArray(s.planning.links)||s.planning.links.length>6||new Set(s.planning.links).size!==s.planning.links.length||!s.planning.links.every(id=>N.planLinks.some(x=>x.id===id))||arc<67&&s.planning.links.length)return false;
  if(!D.validate(s.development,arc,Math.max(s.continuation?.readThrough||42,s.campaign?.completed||42))||s.development&&(s.development.turn>s.world.tick||arc<67||!s.story?.read?.includes('story.arcadia.genesis_model')))return false;
  const stage=s.world.stage;
  if(stage>=1&&(!s.tutorial.rescue||!s.tutorial.rain))return false;
  if(stage>=2&&!s.tutorial.light)return false;
  if(stage===0&&(s.tutorial.rain||s.tutorial.light||s.knowledge.length||s.research.conditional||s.research.irrigation))return false;
  if(stage===1&&(s.tutorial.light||s.knowledge.length||s.research.conditional||s.research.irrigation))return false;
  if(stage>=3&&(s.research.conditional!==3||!s.knowledge.length))return false;
  if(stage===2&&(s.research.conditional===3||s.research.irrigation))return false;
  if(stage===3&&(s.research.irrigation===2||s.facilities.irrigationCompletedTick!==null))return false;
  if(stage===4&&(s.research.irrigation!==2||s.facilities.irrigationCompletedTick===null))return false;
  if(s.research.conditional>0&&!s.knowledge.length)return false;
  if(!s.story||!['read','effectsApplied'].every(k=>Array.isArray(s.story[k])&&s.story[k].length<=5000&&s.story[k].every(text)&&new Set(s.story[k]).size===s.story[k].length))return false;
  if(arc>0&&(s.world.chapterId!=='chapter.arcadia_origins'||s.world.eraId!==N.chapters[arc].eraId))return false;
  for(let i=1;i<=arc;i++)if(!s.story.effectsApplied.includes(N.chapters[i].id))return false;
  if((s.municipal.observed.length===5)!==s.story.effectsApplied.includes(N.networkDiscovery.id))return false;
  if((s.industry.batchProgress===3)!==s.story.effectsApplied.includes(N.batchDiscovery.id))return false;
  if((s.academy.seen.length===5)!==s.story.effectsApplied.includes(N.academyDiscovery.id))return false;
  if((s.survey.measured.length===4)!==s.story.effectsApplied.includes(N.surveyDiscovery.id))return false;
  if((s.expedition.filed.length===3)!==s.story.effectsApplied.includes(N.expeditionDiscovery.id))return false;
  if((s.contact.drawn.length===4)!==s.story.effectsApplied.includes(N.contactReply.id))return false;
  if(!Array.isArray(s.story.queued)||s.story.queued.length>50||!s.story.queued.every(e=>e&&text(e.id)&&['emergency','crisis','story','discovery','life'].includes(e.kind)&&text(e.title)&&text(e.text)&&s.story.effectsApplied.includes(e.id)&&!s.story.read.includes(e.id)))return false;
  if(new Set(s.story.queued.map(e=>e.id)).size!==s.story.queued.length)return false;
  const paged=e=>e.pages===undefined||(Array.isArray(e.pages)&&e.pages.length>=1&&e.pages.length<=8&&e.pages.every(p=>p&&text(p.text)&&N.scenes.includes(p.scene))&&integer(e.sourceEpisode,1,42));
  if(!s.story.queued.every(paged)||!s.story.pageOffsets||typeof s.story.pageOffsets!=='object'||Array.isArray(s.story.pageOffsets))return false;
  if(!Array.isArray(s.story.journal)||s.story.journal.length>5000||!s.story.journal.every(e=>e&&text(e.id)&&text(e.title)&&paged(e)&&Array.isArray(e.pages)&&s.story.read.includes(e.id)))return false;
  if(new Set(s.story.journal.map(e=>e.id)).size!==s.story.journal.length)return false;
  for(const [id,offset] of Object.entries(s.story.pageOffsets)){const e=s.story.queued.find(e=>e.id===id)||s.story.journal.find(e=>e.id===id);if(!e||!integer(offset,0,(e.pages?.length||1)-1))return false;}
  if(!s.crisis||!['waterZero','foodZero'].every(k=>integer(s.crisis[k],0,1000000))||!['waterCritical','foodCritical','emergency'].every(k=>typeof s.crisis[k]==='boolean'))return false;
  if(!Array.isArray(s.chronicle)||s.chronicle.length>5000||!s.chronicle.every(e=>e&&text(e.id)&&text(e.kind)&&text(e.title)&&text(e.text)&&integer(e.tick,0,s.world.tick)))return false;
  if(!V.validate(s.civilization)||!C.validate(s.continuation,s)||!P.validate(s.campaign,s))return false;
  if(nested)return s.checkpoint===null;
  return s.checkpoint===null||validateCore(s.checkpoint,true);
 }
 function assert(s){if(!validateCore(s))throw Error('記録の内容を確認できません。');}
 function ready(s){return !(s.narrative.step===49&&s.contact.drawn.length<4)&&!(s.narrative.step===43&&s.expedition.filed.length<3)&&!(s.narrative.step===27&&s.academy.seen.length<5)&&!(s.narrative.step===30&&s.survey.measured.length<4)&&!(s.narrative.step===24&&s.industry.heard.length<3)&&!(s.narrative.step===15&&s.municipal.observed.length<5)&&s.world.stage>=2&&!s.story.queued.length&&!s.crisis.emergency&&s.world.tick<1000000;}
 function actionInfo(s,id){
  const labels={rescue:'ピンセット',rain:'最初の一滴',light:'デスクライト',seed:'知識の紙片',water:'水を補う'};
  if(!labels[id])return {enabled:false,reason:'この道具はありません。'};
  let reason='';const stage=s.world.stage;
  if(s.story.queued.length||s.crisis.emergency)reason='まず、今の出来事を確かめてください。';
  else if(id==='rescue'&&(stage!==0||s.tutorial.rescue))reason='最初のダニは取り除かれています。';
  else if(id==='rain'&&(stage!==0||!s.tutorial.rescue||s.tutorial.rain))reason='ピンセットの救助後に使う、最初の雨です。';
  else if(id==='light'&&stage!==1)reason='翌朝の危機で使う道具です。';
  else if(['seed','water'].includes(id)){
   if(stage<2)reason='先に村の危機を乗り越えましょう。';
   else if(id==='seed'&&s.knowledge.length)reason='If / Else の紙片は、すでに届いています。';
   else if(id==='water'&&s.resources.water===100)reason='水の備蓄は満ちています。';
   else if(s.supportUsedTick===s.world.tick)reason='この刻の支援は済んでいます。次の刻に使えます。';
   else if(s.resources.support<2)reason=`余力が足りません（必要2／現在${s.resources.support}）。`;
  }
  const cost=['seed','water'].includes(id)?2:0;
  const waterGain=id==='water'?Math.min(20,100-s.resources.water):id==='rain'?66-s.resources.water:0;
  return {id,title:labels[id],enabled:!reason,reason,cost,waterGain,target:id==='seed'?'神殿の祭壇':id==='water'||id==='rain'?'アルカディアの畑と備蓄':'村に迫るダニ',usesSupportSlot:cost>0};
 }
 function applyAction(s,id,expectedRevision=s.revision){
  assert(s);if(expectedRevision!==s.revision)throw Error('状況が変わりました。効果を確認し直してください。');
  const info=actionInfo(s,id);if(!info.enabled)throw Error(info.reason);
  const n=clone(s);n.revision++;
  if(id==='rescue'){n.tutorial.rescue=true;n.lifeLedger[0].memories.push('ダニとの戦い');add(n,'story','銀の柱','ピンセットがダニを取り除いた。村の人々が空を見上げる。');}
  if(id==='rain'){n.tutorial.rain=true;n.resources.water=66;n.world.stage=1;n.lifeLedger[0].memories.push('最初の雨');add(n,'life','最初の一滴','畑に雨が届いた。ソウタが夜を過ごす間にも、箱庭の時間は流れていく。次は翌朝の危機。');}
  if(id==='light'){
   n.tutorial.light=true;n.world.stage=2;add(n,'story','人々の抵抗','光で止まったダニへ、アリアたちが投石した。人々自身が危機を乗り越えた。');makeCheckpoint(n);
  }
  if(id==='seed'){n.knowledge.push('knowledge.if_else');n.lifeLedger[0].memories.push('神託の紙片');add(n,'research','論理の種','If / Else の紙片を渡した。ガルドが自分の手で、その意味を探し始める。');}
  if(id==='water'){n.resources.water+=info.waterGain;add(n,'life','水を届ける',`水の備蓄を${info.waterGain}補った。研究の発見は住民の試行を待つ。`);}
  if(info.cost){n.resources.support-=info.cost;n.supportUsedTick=n.world.tick;}
  assert(n);return n;
 }
 function forecast(s){
  const irrigated=s.facilities.irrigationCompletedTick!==null;
  const waterProduction=irrigated?20:0;
  const water=clamp(s.resources.water+waterProduction-8,0,100);
  const foodProduction=water>=15?9:2;
  return {water,food:clamp(s.resources.food+foodProduction-6,0,100),waterProduction,waterConsumption:8,foodProduction,foodConsumption:6,support:Math.min(6,s.resources.support+1)};
 }
 function researchStatus(s){
  const reasons=[];
  if(!s.knowledge.length)reasons.push('神殿へ知識の紙片がまだ届いていません。');
  if(s.resources.water<15)reasons.push('水の備蓄が15未満です。');
  if(s.resources.food<15)reasons.push('食料の備蓄が15未満です。');
  if(s.world.stage<2)reasons.push('まず村の危機を乗り越えましょう。');
  return {reasons,conditional:s.research.conditional,irrigation:s.research.irrigation,complete:s.world.stage===4};
 }
 function step(s){
  assert(s);if(!ready(s))throw Error('今の出来事を確かめてから、時を進めてください。');
  const n=clone(s);n.revision++;n.world.tick++;const f=forecast(s);
  n.resources.water=f.water;n.resources.food=f.food;
  const canResearch=n.resources.water>=15&&n.resources.food>=15&&n.knowledge.length;
  if(canResearch&&n.world.stage===2){
   n.research.conditional++;
   if(n.research.conditional<3)add(n,'research','ガルドの試行',n.research.conditional===1?'文字ではなく、考え方ではないか。ガルドが疑問を持つ。':'火の術式を試す。まだ目に見える変化はない。');
   else {n.world.stage=3;n.lifeLedger[0].memories.push('ガルドの条件術式');event(n,'discovery.conditional_magic','discovery','消えた火が、ふたたび灯る','ガルドが条件術式を見出した。与えられたのは完成した魔法ではなく、考える道具だった。次は暮らしへの応用を見守ろう。');}
  }else if(canResearch&&n.world.stage===3){
   n.research.irrigation++;
   if(n.research.irrigation===1)add(n,'research','水門への応用','住民たちが条件術式を水門に応用する試みを始めた。');
   else {n.world.stage=4;n.facilities.irrigationCompletedTick=n.world.tick;event(n,'life.irrigation','life','水を待つ畑から、水を運ぶ畑へ','乾けば水門が開き、潤えば閉じる。自動灌漑が完成した。次の刻から水の生産が加わる。まず水路が働く暮らしを一刻見届け、町の続きを見守ろう。');}
  }
  if(canResearch&&n.narrative.step===6&&n.narrative.eternalProgress<3){
   n.narrative.eternalProgress++;
   if(n.narrative.eternalProgress<3)add(n,'research','永遠の灯の試行',n.narrative.eternalProgress===1?'試作品の光が消える。失敗を記録し、研究院は次の構造を試す。':'アリアが差し入れを持って訪れる。弟子たちと、もう一度組み直す。');
   else {n.narrative.eternalCompletedTick=n.world.tick;const e=N.lampDiscovery;event(n,e.id,e.kind,e.title,e.pages[0].text,{sourceEpisode:e.sourceEpisode,pages:clone(e.pages)});}
  }
  if(canResearch&&n.narrative.step===12&&n.narrative.circuitProgress<3){
   n.narrative.circuitProgress++;
   if(n.narrative.circuitProgress<3)add(n,'research','魔導回路の試行',n.narrative.circuitProgress===1?'部品の構成を見直す。命令・動力・結果が、まだ安定してつながらない。':'弟子が細い金属線を持ち込む。ガルドは、部品を結ぶ方法を考える。');
   else{n.narrative.circuitCompletedTick=n.world.tick;const e=N.circuitDiscovery;event(n,e.id,e.kind,e.title,e.pages[0].text,{sourceEpisode:e.sourceEpisode,pages:clone(e.pages)});}
  }
  if(canResearch&&n.narrative.step===21&&n.industry.batchProgress<3){
   n.industry.batchProgress++;
   if(n.industry.batchProgress<3)add(n,'research','工房の最初の生産',n.industry.batchProgress===1?'一個の灯が組み上がる。職人たちが、工程を分担し始める。':'検査と組立をつなぎ、同じ灯が二十個へ増える。次の人へ渡す仕組みが整っていく。');
   else{n.industry.batchCompletedTick=n.world.tick;const e=N.batchDiscovery;event(n,e.id,e.kind,e.title,e.pages[0].text,{sourceEpisode:e.sourceEpisode,pages:clone(e.pages)});}
  }
  for(const key of ['water','food']){
   n.crisis[key+'Zero']=n.resources[key]===0?n.crisis[key+'Zero']+1:0;
   const critical=n.resources[key]<15;
   if(critical&&!s.crisis[key+'Critical'])event(n,`crisis.${key}.${n.world.tick}`,'crisis',key==='water'?'水の備蓄が不足している':'食料の備蓄が不足している',key==='water'?'研究は水が15以上へ回復するまで止まる。余力を使って水を補おう。進捗は失われない。':'研究は食料が15以上へ回復するまで止まる。水を保てば食料は毎刻3増える。進捗は失われない。');
   n.crisis[key+'Critical']=critical;
  }
  if(n.crisis.waterZero>=3||n.crisis.foodZero>=3){n.crisis.emergency=true;event(n,`emergency.${n.world.tick}`,'emergency','一度立ち止まり、対策を考えよう','備蓄の不足が続いた。手動の記録はそのままに、安定していた時点へ戻れる。重要人物の死亡やセーブの削除は起きない。');}
  if(n.development)n.development=D.tick(n.development);
  n.resources.support=f.support;
  if(n.resources.water>=25&&n.resources.food>=25&&n.resources.support>=2&&!n.story.queued.length&&!n.crisis.emergency)makeCheckpoint(n);
  assert(n);return n;
 }
 function turnPage(s,id,delta=1){assert(s);const e=s.story.queued[0];if(e?.id!==id||!e.pages||![-1,1].includes(delta))throw Error('このページは変更できません。');const current=s.story.pageOffsets[id]||0,target=current+delta;if(target<0||target>=e.pages.length)throw Error('ページの端です。');const n=clone(s);n.revision++;n.story.pageOffsets[id]=target;assert(n);return n;}
 function acknowledge(s,id){assert(s);const e=s.story.queued[0];if(e?.id!==id)throw Error('この出来事は確認済みです。');if(e.pages&&(s.story.pageOffsets[id]||0)<e.pages.length-1)throw Error('物語にはまだ続きがあります。');const n=clone(s);n.revision++;n.story.queued.shift();n.story.read.push(id);if(e.pages)n.story.journal.push(clone(e));assert(n);return n;}
 function storyNextInfo(s){
  const index=s.narrative.step,next=N.chapters[index+1];let reason='';
  if(!next)reason='第42話までの区間を読了しました。先の物語は制作中です。';
  else if(s.world.stage<4)reason='まず条件術式と水路を見届けましょう。';
  else if(s.story.queued.length||s.crisis.emergency)reason='今の出来事を確かめてください。';
  else if(index===0&&s.world.tick<=s.facilities.irrigationCompletedTick)reason='水路が働く次の一刻を、まず見届けましょう。';
  else if(index===6&&s.narrative.eternalProgress<3)reason='研究院の試行を見守り、赤い灯の発見を待ちましょう。';
  else if(index===12&&s.narrative.circuitProgress<3)reason='研究院の三段階の試行を見守り、接続の成功を待ちましょう。';
  else if(index===15&&s.municipal.observed.length<5)reason='起動式の五つの働きを見届けましょう。';
  else if(index===21&&s.industry.batchProgress<3)reason='工房の最初の生産を三段階で見届けましょう。';
  else if(index===24&&s.industry.heard.length<3)reason='変化の中の三つの立場に耳を傾けましょう。';
  else if(index===27&&s.academy.seen.length<5)reason='若い発明家たちの五つの展示を見届けましょう。';
  else if(index===30&&s.survey.measured.length<4)reason='測量図の四つの区間を、二点ずつ選んで確かめましょう。';
  else if(index===43&&s.expedition.filed.length<3)reason='探査の三つの資料を、内容に対応する記録へ整理しましょう。';
  else if(index===49&&s.contact.drawn.length<4)reason='最初の対話で描いた四つの絵を、紙片へ記録しましょう。';
  else if(s.resources.water<15||s.resources.food<15)reason='暮らしの不足を先に立て直しましょう。';
  return {enabled:!reason,reason,title:next?.label||'第42話まで読了',elapsed:next?.elapsed||'',nextIndex:index+1};
 }
 function advanceStory(s,expectedRevision=s.revision){
  assert(s);const info=storyNextInfo(s);if(expectedRevision!==s.revision)throw Error('状況が変わりました。確認し直してください。');if(!info.enabled)throw Error(info.reason);
  const n=clone(s),d=N.chapters[info.nextIndex];n.revision++;n.narrative.step=info.nextIndex;n.world.chapterId='chapter.arcadia_origins';n.world.eraId=d.eraId;
  if(n.narrative.step===2){n.people.aria.active=false;n.lifeLedger[0].status='remembered';n.lifeLedger[0].memories=['最初の雨','ダニとの戦い','神託の紙片','ガルドの条件術式'];}
  if(n.narrative.step===3){n.people.aria.active=true;n.people.aria.lifeId='life.aria.return';n.lifeLedger.push({lifeId:'life.aria.return',status:'current',memories:[...n.lifeLedger[0].memories]});}
  event(n,d.id,'story',d.title,d.pages[0].text,{sourceEpisode:d.sourceEpisode,pages:clone(d.pages)});makeCheckpoint(n);assert(n);return n;
 }
 function networkStatus(s){
  const observed=s.municipal.observed,complete=observed.length===5;
  return {available:s.narrative.step>=15,complete,enabled:s.narrative.step===15&&!s.story.queued.length&&!s.crisis.emergency&&!complete,items:N.networkItems.map(x=>({...x,observed:observed.includes(x.id)}))};
 }
 function observeNetwork(s,id,expectedRevision=s.revision){
  assert(s);if(expectedRevision!==s.revision)throw Error('状況が変わりました。もう一度確かめてください。');
  const status=networkStatus(s),item=status.items.find(x=>x.id===id);
  if(!status.enabled||!item||item.observed)throw Error('今はこの設備を見届けられません。');
  const n=clone(s);n.revision++;n.municipal.observed.push(id);add(n,'discovery',item.title+'を見届ける',item.text);
  if(n.municipal.observed.length===5){n.municipal.completedTick=n.world.tick;const e=N.networkDiscovery;event(n,e.id,e.kind,e.title,e.pages[0].text,{sourceEpisode:e.sourceEpisode,pages:clone(e.pages)});}
  makeCheckpoint(n);assert(n);return n;
 }
 function industryStatus(s){return {available:s.narrative.step>=21,progress:s.industry.batchProgress,representativeCount:[0,1,20,50][s.industry.batchProgress],complete:s.industry.batchProgress===3};}
 function voiceStatus(s){return {available:s.narrative.step>=24,enabled:s.narrative.step===24&&!s.story.queued.length&&!s.crisis.emergency&&s.industry.heard.length<3,items:N.socialVoices.map(x=>({...x,heard:s.industry.heard.includes(x.id)}))};}
 function hearVoice(s,id,expectedRevision=s.revision){
  assert(s);if(expectedRevision!==s.revision)throw Error('状況が変わりました。もう一度確かめてください。');const status=voiceStatus(s),item=status.items.find(x=>x.id===id);
  if(!status.enabled||!item||item.heard)throw Error('今はこの声を聞き残せません。');const n=clone(s);n.revision++;n.industry.heard.push(id);add(n,'life',item.title,item.text);makeCheckpoint(n);assert(n);return n;
 }
 function academyStatus(s){return {available:s.narrative.step>=27,enabled:s.narrative.step===27&&!s.story.queued.length&&!s.crisis.emergency&&s.academy.seen.length<5,items:N.inventions.map(x=>({...x,seen:s.academy.seen.includes(x.id)}))};}
 function inspectInvention(s,id,expectedRevision=s.revision){
  assert(s);if(expectedRevision!==s.revision)throw Error('状況が変わりました。もう一度確かめてください。');const status=academyStatus(s),item=status.items.find(x=>x.id===id);if(!status.enabled||!item||item.seen)throw Error('今はこの展示を見届けられません。');
  const n=clone(s);n.revision++;n.academy.seen.push(id);add(n,'discovery',item.title+'の展示',item.text);if(n.academy.seen.length===5){const e=N.academyDiscovery;event(n,e.id,e.kind,e.title,e.pages[0].text,{sourceEpisode:e.sourceEpisode,pages:clone(e.pages)});}makeCheckpoint(n);assert(n);return n;
 }
 function surveyStatus(s){return {available:s.narrative.step>=30,enabled:s.narrative.step===30&&!s.story.queued.length&&!s.crisis.emergency&&s.survey.measured.length<4,points:clone(N.surveyPoints),routes:N.surveyRoutes.map(x=>{const a=N.surveyPoints.find(p=>p.id===x.from),b=N.surveyPoints.find(p=>p.id===x.to);return {...x,units:Math.round(Math.hypot(a.x-b.x,a.y-b.y)),measured:s.survey.measured.includes(x.id)};})};}
 function measureRoute(s,from,to,expectedRevision=s.revision){
  assert(s);if(expectedRevision!==s.revision)throw Error('状況が変わりました。もう一度確かめてください。');const status=surveyStatus(s),route=status.routes.find(x=>(x.from===from&&x.to===to)||(x.from===to&&x.to===from));if(!status.enabled)throw Error('今は測量を見届けられません。');if(!route)throw Error('図にある対象区間の二点を選んでください。');if(route.measured)throw Error('その区間は測量済みです。');
  const n=clone(s);n.revision++;n.survey.measured.push(route.id);add(n,'research',route.title+'を測量',`測量図で${route.units}目盛りの区間を確かめた。`);if(n.survey.measured.length===4){const e=N.surveyDiscovery;event(n,e.id,e.kind,e.title,e.pages[0].text,{sourceEpisode:e.sourceEpisode,pages:clone(e.pages)});}makeCheckpoint(n);assert(n);return n;
 }
 function expeditionStatus(s){return {available:s.narrative.step>=43,enabled:s.narrative.step===43&&!s.story.queued.length&&!s.crisis.emergency&&s.expedition.filed.length<3,records:N.expeditionRecords.map(x=>({...x,filed:s.expedition.filed.includes(x.id)})),categories:clone(N.archiveCategories)};}
 function fileExpedition(s,id,category,expectedRevision=s.revision){
  assert(s);if(expectedRevision!==s.revision)throw Error('状況が変わりました。もう一度確かめてください。');const status=expeditionStatus(s),item=status.records.find(x=>x.id===id);
  if(!status.enabled||!item||item.filed)throw Error('今はその資料を整理できません。');if(!status.categories.some(x=>x.id===category))throw Error('記録の種類を選んでください。');if(item.category!==category)throw Error(item.hint);
  const n=clone(s);n.revision++;n.expedition.filed.push(id);add(n,'research',item.title+'を整理',item.text);if(n.expedition.filed.length===3){const e=N.expeditionDiscovery;event(n,e.id,e.kind,e.title,e.pages[0].text,{sourceEpisode:e.sourceEpisode,pages:clone(e.pages)});}makeCheckpoint(n);assert(n);return n;
 }
 function contactStatus(s){return {available:s.narrative.step>=49,enabled:s.narrative.step===49&&!s.story.queued.length&&!s.crisis.emergency&&s.contact.drawn.length<4,symbols:N.contactSymbols.map(x=>({...x,drawn:s.contact.drawn.includes(x.id)})),replied:s.story.read.includes(N.contactReply.id)};}
 function drawContact(s,id,expectedRevision=s.revision){
  assert(s);if(expectedRevision!==s.revision)throw Error('状況が変わりました。もう一度確かめてください。');const status=contactStatus(s),item=status.symbols.find(x=>x.id===id);if(!status.enabled||!item||item.drawn)throw Error('今はその絵を記録できません。');
  const n=clone(s);n.revision++;n.contact.drawn.push(id);add(n,'life',item.title+'を紙片に描く',item.text);if(n.contact.drawn.length===4){const e=N.contactReply;event(n,e.id,e.kind,e.title,e.pages[0].text,{sourceEpisode:e.sourceEpisode,pages:clone(e.pages)});}makeCheckpoint(n);assert(n);return n;
 }
 function civicStatus(s){
  const known=x=>s.narrative.step>=x.minStep&&s.story.read.includes(x.readId),calendar=N.civicRecords.filter(known),community=s.narrative.step>=61&&s.story.read.includes('story.arcadia.community_resolution'),established=s.narrative.step>=57&&s.story.read.includes('story.arcadia.common_calendar'),thirdYear=s.narrative.step>=59&&s.story.read.includes('story.arcadia.community_question');
  if(s.campaign)for(const n of s.campaign.history){const r=P.row(n);calendar.push({id:'campaign.'+n,title:'第'+n+'話 '+r.title,sourceEpisode:n,label:r.eraEvidence||'原作本文の経過を参照',elapsed:'回想を含む、原作の提示順での記録。',detail:r.cards[2].text});}
  return {available:s.narrative.step>=56,calendarEstablished:established,communityEstablished:community,dateLabel:s.campaign?'原作 第'+s.campaign.episode+'話の場面（年号・回想は本文の表記を参照）':s.narrative.step>=127&&s.story.read.includes('story.arcadia.vanished_ships')?'神暦十五年（第42話の表記）':s.narrative.step>=125&&s.story.read.includes('story.arcadia.midterm_report')?'神暦十五年（第41話の表記）':s.narrative.step>=122&&s.story.read.includes('story.arcadia.maresia')?'神暦十四年（第40話の表記）':s.narrative.step>=120&&s.story.read.includes('story.arcadia.city_beyond_sea')?'神暦十四年（第39話の表記）':s.narrative.step>=117&&s.story.read.includes('story.arcadia.open_sea')?'神暦十四年（第38話の表記）':s.narrative.step>=114&&s.story.read.includes('story.arcadia.eve_of_departure')?'神暦十三年（第37話の表記）':s.narrative.step>=111&&s.story.read.includes('story.arcadia.trial_return')?'神暦十三年（第36話の表記）':s.narrative.step>=108&&s.story.read.includes('story.arcadia.harbor_construction')?'神暦十二年（第35話の表記）':s.narrative.step>=106&&s.story.read.includes('story.arcadia.four_accord')?'神暦十一年（第34話の表記）':s.narrative.step>=104&&s.story.read.includes('story.arcadia.steel_shortage')?'神暦十一年（第33話の表記）':s.narrative.step>=101&&s.story.read.includes('story.arcadia.exchange_pact')?'神暦十年（第32話の表記）':s.narrative.step>=97&&s.story.read.includes('story.arcadia.four_way_banquet')?'神暦十年（第31話の表記）':s.narrative.step>=93&&s.story.read.includes('story.arcadia.dwal_contact')?'神暦十年（第30話の表記）':s.narrative.step>=86&&s.story.read.includes('story.arcadia.western_ocean')?'神暦九年（第29話の表記）':s.narrative.step>=79&&s.story.read.includes('story.arcadia.rooga_return')?'神暦八年（第28話の表記）':s.narrative.step>=69&&s.story.read.includes('story.arcadia.western_people')?'神暦七年（第26話の表記）':s.narrative.step>=64&&s.story.read.includes('story.arcadia.logistics_report')?'神暦六年（第25話の表記）':thirdYear?'神暦三年（第24話の表記）':established?'共通暦が定められた時点':'暦の統一を議論中',records:clone(calendar),milestones:clone(N.civicMilestones.filter(known))};
 }
 function planningStatus(s){
  const active=new Set(s.planning.links),remaining=Object.fromEntries(N.planLinks.map(x=>[x.id,active.has(x.id)?x.capacity:0])),used=Object.fromEntries(N.planLinks.map(x=>[x.id,0]));
  const flows=N.planFlows.map(f=>{let sent=0;while(sent<f.need){const queue=[f.a],seen=new Set(queue),parent={};while(queue.length&&!seen.has(f.b)){const from=queue.shift();for(const e of N.planLinks){if(remaining[e.id]<=0||f.roadOnly&&e.mode!=='road')continue;const to=e.a===from?e.b:e.b===from?e.a:null;if(!to||seen.has(to))continue;seen.add(to);parent[to]={from,id:e.id};queue.push(to);}}if(!seen.has(f.b))break;const path=[];for(let at=f.b;at!==f.a;at=parent[at].from)path.push(parent[at].id);const amount=Math.min(f.need-sent,...path.map(id=>remaining[id]));for(const id of path){remaining[id]-=amount;used[id]+=amount;}sent+=amount;}return {...f,sent,shortfall:f.need-sent};});
  return {available:s.narrative.step>=67&&s.story.read.includes('story.arcadia.genesis_model'),enabled:s.narrative.step>=67&&s.story.read.includes('story.arcadia.genesis_model')&&!s.story.queued.length&&!s.crisis.emergency,nodes:clone(N.planNodes),links:N.planLinks.map(e=>({...e,connected:active.has(e.id),used:used[e.id]})),flows,total:flows.reduce((n,f)=>n+f.sent,0),need:flows.reduce((n,f)=>n+f.need,0),complete:flows.every(f=>!f.shortfall)};
 }
 function togglePlanLink(s,id,expectedRevision=s.revision){assert(s);if(expectedRevision!==s.revision)throw Error('状況が変わりました。もう一度確かめてください。');const p=planningStatus(s);if(!p.enabled||!N.planLinks.some(x=>x.id===id))throw Error('今はその模型の接続を変えられません。');const n=clone(s);n.revision++;n.planning.links=n.planning.links.includes(id)?n.planning.links.filter(x=>x!==id):[...n.planning.links,id];makeCheckpoint(n);assert(n);return n;}
 function resetPlanning(s,expectedRevision=s.revision){assert(s);if(expectedRevision!==s.revision||!planningStatus(s).enabled||!s.planning.links.length)throw Error('今は模型を戻せません。');const n=clone(s);n.revision++;n.planning.links=[];makeCheckpoint(n);assert(n);return n;}
 function encounterStatus(s){const known=(step,id)=>s.narrative.step>=step&&s.story.read.includes('story.arcadia.'+id),defenseKnown=known(76,'north_aftermath'),kingKnown=known(77,'hunter_king_story'),kingSeen=known(79,'rooga_return'),friendshipKnown=known(81,'three_peoples_pact');return {available:defenseKnown,defenseKnown,kingKnown,kingSeen,friendshipKnown,defense:defenseKnown?{enemyCount:'三十以上',duration:'約一時間',deaths:0,severeInjuries:'数名'}:null};}
 function upgrade(old){
  if(!old||old.schemaVersion!==2)return old;const n=clone(old);
  if(!n.narrative)n.narrative={version:1,step:0,eternalProgress:0,eternalCompletedTick:null,circuitProgress:0,circuitCompletedTick:null};
  if(n.narrative.circuitProgress===undefined)n.narrative.circuitProgress=0;
  if(n.narrative.circuitCompletedTick===undefined)n.narrative.circuitCompletedTick=null;
  if(!n.planning)n.planning={links:[]};
  if(!n.contact)n.contact={drawn:[]};
  if(!n.expedition)n.expedition={filed:[]};
  if(!n.academy)n.academy={seen:[]};
  if(!n.survey)n.survey={measured:[]};
  if(!n.industry)n.industry={batchProgress:0,batchCompletedTick:null,heard:[]};
  if(!n.municipal)n.municipal={observed:[],completedTick:null};
  if(!n.lifeLedger)n.lifeLedger=[{lifeId:'life.aria.early',status:'current',memories:[n.tutorial?.rescue?'ダニとの戦い':null,n.tutorial?.rain?'最初の雨':null,n.knowledge?.length?'神託の紙片':null,n.research?.conditional===3?'ガルドの条件術式':null].filter(Boolean)}];
  if(n.people?.aria&&typeof n.people.aria.active!=='boolean')n.people.aria.active=true;
  if(n.story){if(!n.story.pageOffsets)n.story.pageOffsets={};if(!n.story.journal)n.story.journal=[];}
  if(n.checkpoint)n.checkpoint=upgrade(n.checkpoint);return n;
 }
 function campaignCommand(s,op,p={},expectedRevision=s.revision){assert(s);if(expectedRevision!==s.revision)throw Error('状況が変わりました。');if(s.narrative.step<127||!s.story.read.includes('story.arcadia.vanished_ships')||s.story.queued.length||s.crisis.emergency)throw Error('第42話と現在の出来事を読み終えてください。');const n=clone(s);if(['bridgeOut','bridgeBack'].includes(op)){if(!n.development||!['wood','ore','goods','steel','food','water'].includes(p.item)||!integer(p.quantity,1,20))throw Error('街区と物資の数量を確認してください。');n.campaign=P.command(n.campaign,'open');const depot=n.campaign.depots.home,stock=n.development.stock,have=p.item==='steel'?n.development.steel||0:stock[p.item];if(op==='bridgeOut'){if(have<p.quantity||depot[p.item]+p.quantity>P.capacity(n.campaign,'home',p.item))throw Error('街区の備蓄または本部の上限を確認してください。');if(p.item==='steel')n.development.steel=have-p.quantity;else stock[p.item]-=p.quantity;depot[p.item]+=p.quantity;}else{if(depot[p.item]<p.quantity||have+p.quantity>100000)throw Error('本部の備蓄または街区の上限を確認してください。');depot[p.item]-=p.quantity;if(p.item==='steel')n.development.steel=have+p.quantity;else stock[p.item]+=p.quantity;}}else n.campaign=P.command(n.campaign,op,p);n.revision++;makeCheckpoint(n);assert(n);return n;}
 function continueOriginal(s,op,expectedRevision=s.revision){assert(s);if(expectedRevision!==s.revision)throw Error('状況が変わりました。');const n=clone(s);C.command(n,op);n.revision++;makeCheckpoint(n);assert(n);return n;}
 function developmentStatus(s){return {available:s.narrative.step>=67&&s.story.read.includes('story.arcadia.genesis_model'),enabled:s.narrative.step>=67&&s.story.read.includes('story.arcadia.genesis_model')&&!s.story.queued.length&&!s.crisis.emergency,...D.status(s.development,s.narrative.step,Math.max(s.continuation?.readThrough||42,s.campaign?.completed||42))};}
 function develop(s,op,params={},expectedRevision=s.revision){assert(s);if(expectedRevision!==s.revision)throw Error('状況が変わりました。確認し直してください。');if(!developmentStatus(s).enabled)throw Error('都市計画の発表と、今の出来事を確かめてください。');if(!s.development&&op!=='start')throw Error('街区の観察を始めてください。');const n=clone(s);n.development=D.command(s.development,op,params,s.narrative.step,Math.max(s.continuation?.readThrough||42,s.campaign?.completed||42));n.revision++;if(n.resources.water>=25&&n.resources.food>=25&&n.resources.support>=2)makeCheckpoint(n);assert(n);return n;}
 function restoreCheckpoint(s){assert(s);if(!s.checkpoint)throw Error('安定した記録がありません。手動の記録から再開してください。');const n=clone(s.checkpoint);n.revision=s.revision+1;n.checkpoint=clone(s.checkpoint);add(n,'life','対策を考え直す',`観察刻${s.world.tick}から、安定していた${n.world.tick}刻へ戻った。手動の記録は変更していない。`);assert(n);return n;}
 function validLegacy(s){
  if(!s||s.version!==1)return false;
  for(const [k,min,max] of [['tick',0,100000],['phase',0,4],['research',0,3],['irrigation',0,2],['energy',0,6],['water',0,100],['food',0,100]])if(!integer(s[k],min,max))return false;
  if(!['rescue','rain','light','seed'].every(k=>typeof s[k]==='boolean')||!Array.isArray(s.logs)||s.logs.length>60||!s.logs.every(text))return false;
  if(s.phase>=1&&(!s.rescue||!s.rain)||s.phase>=2&&!s.light||s.phase>=3&&(!s.seed||s.research!==3)||s.phase===4&&s.irrigation!==2)return false;
  if(s.phase===0&&(s.rain||s.light||s.seed||s.research||s.irrigation)||s.phase<3&&s.irrigation||s.phase===2&&s.research===3)return false;
  return true;
 }
 function migrate(s){
  if(!validLegacy(s))throw Error('旧版の記録を読み込めません。');
  const n=create();n.world.tick=s.tick;n.world.stage=s.phase;n.resources={water:s.water,food:s.food,support:s.energy};n.tutorial={rescue:s.rescue,rain:s.rain,light:s.light};
  n.knowledge=s.seed?['knowledge.if_else']:[];n.research={conditional:s.research,irrigation:s.irrigation};
  n.lifeLedger[0].memories=[s.rescue?'ダニとの戦い':null,s.rain?'最初の雨':null,s.seed?'神託の紙片':null,s.research===3?'ガルドの条件術式':null].filter(Boolean);
  n.facilities.irrigationCompletedTick=s.phase===4?Math.max(0,s.tick-1):null;
  n.chronicle=s.logs.map((t,i)=>({id:`legacy.${i}`,tick:s.tick,kind:'legacy',title:'旧試作の記録',text:t}));
  if(s.phase>=3)n.story.effectsApplied.push('discovery.conditional_magic');
  if(s.phase===4)n.story.effectsApplied.push('life.irrigation');
  n.story.read=[...n.story.effectsApplied];
  if(s.phase>=2){const base=create();base.tutorial={rescue:true,rain:true,light:true};base.world.stage=2;base.resources.water=66;makeCheckpoint(base);n.checkpoint=base.checkpoint;}
  assert(n);return n;
 }
 function civilizationCommand(s,op,p={},expectedRevision=s.revision){assert(s);if(expectedRevision!==s.revision)throw Error('状況が変わりました。');const n=clone(s);if(op==='start'&&!n.civilization){if(p.seed!==undefined&&!integer(p.seed,0,4294967295))throw Error('世界の種は0〜4294967295の整数です。');n.civilization=V.initial(p.seed);}else n.civilization=V.command(n.civilization,op,p);n.revision++;makeCheckpoint(n);assert(n);return n;}
 return Object.freeze({config,create,civilizationCommand,campaignCommand,continueOriginal,developmentStatus,develop,validate:validateCore,applyAction,actionInfo,forecast,researchStatus,step,ready,turnPage,acknowledge,storyNextInfo,advanceStory,networkStatus,observeNetwork,industryStatus,voiceStatus,hearVoice,academyStatus,inspectInvention,surveyStatus,measureRoute,expeditionStatus,fileExpedition,contactStatus,drawContact,civicStatus,encounterStatus,planningStatus,togglePlanLink,resetPlanning,upgrade,restoreCheckpoint,migrate,titles,clone});
});
