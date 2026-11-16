'use strict';
(()=>{
 const courses=[
  {id:'relay',title:'はじめての軌道',description:'4レーン・EASY。3曲すべてGROOVE70%以上でクリア。',lanes:4,difficulty:'easy',focus:'normal',tracks:['challenge-01','challenge-03','challenge-21']},
  {id:'hold',title:'HOLDの星座',description:'6レーン・NORMAL。長押し中心の3区間をつなごう。',lanes:6,difficulty:'normal',focus:'hold',tracks:['track-01','challenge-16','challenge-21']},
  {id:'alternate',title:'交互連打オーバードライブ',description:'8レーン・EXPERT。左右交互の連打に挑戦。',lanes:8,difficulty:'hard',focus:'alternate',tracks:['challenge-06','challenge-04','challenge-20']}
 ];
 function section(track,time){let found={time:0,kind:'verse'};for(const s of track.stageSections||[])if(s.time<=time)found=s;else break;return found;}
 function chartKey(track,lanes,difficulty,mirror){return `${track.id}/${lanes}key/${difficulty}/${mirror?'mirror':'normal'}${track.arrangement?'/'+track.arrangement.version:''}`;}
 function medals(record){return [{id:'clear',label:'初クリア',earned:!!record?.cleared},{id:'accuracy',label:'精度90%',earned:(record?.accuracy||0)>=90},{id:'combo',label:'ノーミス',earned:!!record?.fullCombo}];}
 function windowNotes(notes,start,end){return notes.filter(n=>n.time>=PulseCore.LEAD+start-1e-8&&n.end<=PulseCore.LEAD+end+1e-8);}
 function focusChart(track,lanes,focus){
  if(!['hold','alternate'].includes(focus))throw Error('Unknown course focus');
  const result=[],busy=Array(lanes).fill(-1),beat=60/track.bpm;let last=-10,index=0;
  for(const attack of track.onsets){
   const gap=focus==='hold'?.65:section(track,attack.time).kind==='chorus'?.14:.19;
   if(attack.time-last<gap||attack.strength<.22||attack.time>track.duration-.8)continue;
   const hand=index%2,step=Math.floor(index/2)%(lanes/2),lane=hand?lanes-1-step:step;
   if(busy[lane]>=attack.time)continue;
   const length=focus==='hold'&&index%3!==2?Math.min(.95,Math.max(.48,beat*1.5)):0;
   const end=Math.min(track.duration-.3,attack.time+length);result.push({time:PulseCore.LEAD+attack.time,end:PulseCore.LEAD+end,lane,strength:attack.strength});busy[lane]=end+.08;index++;last=attack.time;
  }return result;
 }
 function weakestWindow(misses,duration){
  if(!misses.length)return {start:Math.min(10,Math.max(0,duration-15)),end:Math.min(25,duration)};
  let best=misses[0],count=0;for(const time of misses){const n=misses.filter(v=>v>=time-3&&v<=time+12).length;if(n>count){best=time;count=n;}}
  const start=Math.max(0,Math.min(duration-5,best-3));return {start,end:Math.min(duration,start+15)};
 }
 function aggregate(stages){const notes=stages.reduce((n,s)=>n+s.notes,0),earned=stages.reduce((n,s)=>n+s.earned,0);return {notes,accuracy:notes?earned/notes*100:0,cleared:stages.length===3&&stages.every(s=>s.cleared),fullCombo:stages.length===3&&stages.every(s=>s.cleared&&s.miss===0)};}
 globalThis.PulseAdventureCore={courses,section,chartKey,medals,windowNotes,focusChart,weakestWindow,aggregate};
})();
