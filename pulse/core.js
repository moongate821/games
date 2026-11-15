'use strict';
(() => {
  const LEAD = 2.5, WINDOW = .16;
  const TIMING={easy:{perfect:.045,great:.09,good:.15,release:.09},normal:{perfect:.03,great:.065,good:.11,release:.065},hard:{perfect:.02,great:.045,good:.08,release:.045}};
  const weights = {perfect:1,great:.75,good:.4,miss:0};
  const gradeFor = (delta,timing={perfect:.045,great:.09}) => Math.abs(delta) <= timing.perfect + 1e-8 ? 'perfect' : Math.abs(delta) <= timing.great + 1e-8 ? 'great' : 'good';
  function buildChart(track, difficulty='normal', mirror=false,lanes=8) {
    if(![4,6,8].includes(lanes))throw new RangeError('Choose 4, 6 or 8 lanes');
    const notes=[], busy=Array(lanes).fill(-1);
    const gap={easy:.48,normal:.25,hard:.115}[difficulty];
    const threshold={easy:.32,normal:.15,hard:.055}[difficulty];
    const pattern=lanes===4?[0,2,1,3,1,2,0,3,2,1,3,0,1,3,2,0]:lanes===6?[0,3,1,4,2,5,1,4,0,5,2,3,1,5,2,4]:[0,4,2,6,1,5,3,7,2,5,0,7,3,4,1,6];
    let last=-10, index=0;
    for(const attack of track.onsets) {
      if(attack.time-last<gap || attack.strength<threshold)continue;
      const lane=pattern[index%16];
      let chosen=-1;
      for(let k=0;k<lanes;k++){const candidate=(lane+k)%lanes;if(busy[candidate]<attack.time){chosen=candidate;break;}}
      if(chosen<0)continue;
      const hold=index%({easy:17,normal:13,hard:11}[difficulty])===9;
      const duration=hold ? Math.min(60/track.bpm*(difficulty==='easy'?1:2),track.duration-.7-attack.time) : 0;
      const end=duration>.3 ? attack.time+duration : attack.time;
      notes.push({time:LEAD+attack.time,end:LEAD+end,lane:mirror?lanes-1-chosen:chosen,strength:attack.strength});
      busy[chosen]=end+.12;
      if(difficulty!=='easy' && index%(difficulty==='hard'?5:13)===4) {
        const chord=(chosen+lanes/2)%lanes;
        if(busy[chord]<attack.time){notes.push({time:LEAD+attack.time,end:LEAD+attack.time,lane:mirror?lanes-1-chord:chord,strength:attack.strength});busy[chord]=attack.time+.12;}
      }
      index++;last=attack.time;
    }
    return notes.sort((a,b)=>a.time-b.time||a.lane-b.lane);
  }
  class Session {
    constructor(notes,onJudge=()=>{},onHead=()=>{},options={}) {
      if(options.difficulty&&!TIMING[options.difficulty])throw new RangeError('Unknown difficulty');
      this.lanes=[4,6,8].includes(options.lanes)?options.lanes:8;
      this.timing=options.difficulty?{...TIMING[options.difficulty]}:{perfect:.045,great:.09,good:WINDOW,release:.09};
      this.notes=notes.map((n,i)=>({...n,id:i,state:'pending'}));
      this.held=Array(this.lanes).fill(false);this.counts={perfect:0,great:0,good:0,miss:0};
      this.combo=0;this.maxCombo=0;this.earned=0;this.groove=40;this.errors=[];this.history=[{time:0,value:40}];
      this.onJudge=onJudge;this.onHead=onHead;this.time=0;
    }
    get judged(){return Object.values(this.counts).reduce((a,b)=>a+b,0);}
    get score(){return this.notes.length ? Math.round(this.earned/this.notes.length*1000000) : 0;}
    get accuracy(){return this.judged ? this.earned/this.judged*100 : 100;}
    get finished(){return this.judged===this.notes.length;}
    settle(note,grade,delta=0) {
      if(note.state==='done')return;
      note.state='done';note.grade=grade;this.counts[grade]++;this.earned+=weights[grade];
      if(grade==='miss'){this.combo=0;this.groove=Math.max(0,this.groove-7);}
      else {this.combo++;this.maxCombo=Math.max(this.combo,this.maxCombo);this.groove=Math.min(100,this.groove+1.4*weights[grade]);this.errors.push(delta*1000);}
      this.history.push({time:this.time,value:this.groove});this.onJudge({note,grade,delta,combo:this.combo});
    }
    update(time) {
      this.time=time;
      for(const note of this.notes) {
        if(note.state==='pending'&&time-note.time>this.timing.good+1e-8)this.settle(note,'miss');
        else if(note.state==='holding'&&time>=note.end) this.settle(note,this.held[note.lane]?note.headGrade:'miss',note.delta);
      }
    }
    press(lane,time) {
      if(!Number.isInteger(lane)||lane<0||lane>=this.lanes)return null;
      this.update(time);
      if(this.held[lane])return null;
      this.held[lane]=true;
      let best=null;
      for(const n of this.notes)if(n.lane===lane&&n.state==='pending'&&Math.abs(n.time-time)<=this.timing.good+1e-8&&(!best||Math.abs(n.time-time)<Math.abs(best.time-time)))best=n;
      if(!best)return null;
      const delta=time-best.time,grade=gradeFor(delta,this.timing);
      if(best.end>best.time){best.state='holding';best.headGrade=grade;best.delta=delta;this.onHead({note:best,grade,delta});}
      else this.settle(best,grade,delta);
      return best;
    }
    release(lane,time) {
      if(!Number.isInteger(lane)||lane<0||lane>=this.lanes)return;
      this.update(time);this.held[lane]=false;
      for(const n of this.notes)if(n.lane===lane&&n.state==='holding')this.settle(n,time>=n.end-this.timing.release?n.headGrade:'miss',n.delta);
    }
    releaseAll(time) {for(let lane=0;lane<this.lanes;lane++)this.release(lane,time);}
    autoplay(time) {
      // Consume notes in time order, preserving heads even after a delayed frame.
      for(const n of this.notes)if(n.state==='pending'&&n.time<=time){this.update(n.time);this.held[n.lane]=false;this.press(n.lane,n.time);if(n.end===n.time)this.held[n.lane]=false;}
      this.update(time);
      for(let lane=0;lane<this.lanes;lane++)if(!this.notes.some(n=>n.lane===lane&&n.state==='holding'))this.held[lane]=false;
    }
  }
  function parseLrc(text) {
    const result=[];let offset=0;
    const tag=text.match(/\[offset:([+-]?\d+)\]/i);if(tag)offset=Number(tag[1])/1000;
    for(const line of text.split(/\r?\n/)){
      const timestamps=[...line.matchAll(/\[(\d+):(\d{2}(?:\.\d{1,3})?)\]/g)];
      const words=line.replace(/\[[^\]]*\]/g,'').trim();
      for(const stamp of timestamps)if(words)result.push({time:Math.max(0,Number(stamp[1])*60+Number(stamp[2])+offset),text:words});
    }
    return result.sort((a,b)=>a.time-b.time);
  }
  globalThis.PulseCore={LEAD,WINDOW,TIMING,buildChart,Session,parseLrc,gradeFor};
})();
