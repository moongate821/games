(function(root){
  'use strict';
  const MODES={easy:{label:'EASY',gap:.93,window:.22,perfect:.105,trace:.95},normal:{label:'NORMAL',gap:.62,window:.17,perfect:.075,trace:.85},hard:{label:'EXPERT',gap:.38,window:.13,perfect:.05,trace:.72}};
  const anchors=[[.22,.28],[.53,.20],[.79,.32],[.76,.69],[.47,.80],[.21,.65],[.50,.48]];
  function chart(track,mode='normal'){
    const cfg=MODES[mode];if(!cfg)throw Error('Unknown mode');
    let seed=[...track.id].reduce((a,c)=>a+c.charCodeAt(0),17),last=-3,prev=0,blocked=-3;
    const rand=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};
    const notes=[];
    for(const onset of track.onsets){
      const time=onset.time;
      if(time<2.6||time>track.duration-1.7||time-last<cfg.gap||time<blocked)continue;
      // One action at a time: every trace reserves its complete time interval.
      const choice=(prev+1+Math.floor(rand()*(mode==='easy'?2:5)))%anchors.length;
      let [x,y]=anchors[choice]; const [px,py]=anchors[prev];
      if(mode==='easy'){x=px+(x-px)*.68;y=py+(y-py)*.68;}
      const trace=notes.length%8===5;
      const end=time+(trace?cfg.trace:0),dest=anchors[(choice+2)%anchors.length];
      notes.push({id:notes.length,time,end,x,y,tx:dest[0],ty:dest[1],cx:.5+(rand()-.5)*.3,cy:.5+(rand()-.5)*.3,type:trace?'trace':'tap'});
      prev=choice;last=time;blocked=end+cfg.gap;
    }
    return notes;
  }
  function position(n,time){if(n.type!=='trace')return {x:n.x,y:n.y};const u=Math.max(0,Math.min(1,(time-n.time)/(n.end-n.time))),v=1-u;return{x:v*v*n.x+2*v*u*n.cx+u*u*n.tx,y:v*v*n.y+2*v*u*n.cy+u*u*n.ty};}
  function grade(delta,mode){const c=MODES[mode],d=Math.abs(delta);return d<=c.perfect?'PERFECT':d<=c.window*.78?'GREAT':d<=c.window?'GOOD':'MISS';}
  function traceGrade(coverage,head){return coverage>=.9&&head==='PERFECT'?'PERFECT':coverage>=.72?'GREAT':coverage>=.5?'GOOD':'MISS';}
  class Session{
    constructor(track,mode,auto=false){this.notes=chart(track,mode);this.mode=mode;this.auto=auto;this.combo=0;this.maxCombo=0;this.streak=0;this.points=0;this.counts={PERFECT:0,GREAT:0,GOOD:0,MISS:0};this.judged=0;}
    judge(n,value){if(n.done)return false;n.done=true;n.grade=value;this.counts[value]++;this.judged++;this.points+=({PERFECT:1,GREAT:.8,GOOD:.5,MISS:0})[value];this.combo=value==='MISS'?0:this.combo+1;this.streak=value==='PERFECT'?this.streak+1:0;this.maxCombo=Math.max(this.maxCombo,this.combo);return true;}
    get accuracy(){return this.judged?100*this.points/this.judged:100;}
    get score(){return Math.round(1000000*this.points/Math.max(1,this.notes.length));}
    get rank(){return this.counts.MISS===0&&this.judged===this.notes.length?'FULL CONSTELLATION':this.accuracy>=90?'AURORA':this.accuracy>=80?'STARDUST':'NEXT ORBIT';}
  }
  const api={MODES,chart,position,grade,traceGrade,Session};root.AstraCore=api;if(typeof module!=='undefined')module.exports=api;
})(globalThis);
