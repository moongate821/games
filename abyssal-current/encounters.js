/* Deterministic encounter choreography; times are seconds from zone start. */
window.AbyssalEncounters=(()=>{
 const names=['蛇行編隊','V字編隊','交差進入','旋回離脱','待伏せ突進','海底砲台','上下挟撃','重装護衛'];
 const orders=[[0,1,2,4,5,3,6,7],[1,5,0,6,4,7,2,3],[2,0,3,5,7,4,1,6]];
 function plan(stage,duration,ids){
  const events=[],waves=[];let time=.45;
  for(let wave=0;time<duration-5;wave++){
   const kind=orders[stage%3][(wave+Math.floor(stage/3))%8],count=kind===5?4:kind===7?5:kind===4?3:kind===1?7:6;
   const base=155+((wave*73+stage*37)%210),group=wave;
   waves.push({time:time-.8,name:names[kind],kind,base,group});
   for(let slot=0;slot<count;slot++){
    let id=ids[(wave+Math.floor(slot/3))%ids.length];
    if(kind===5)id=[5,7,14][(stage+slot)%3];
    if(kind===7&&slot===0)id=8;
    events.push({time:time+slot*(kind===1?.1:.28),kind,slot,count,base,group,id});
   }
   time+=kind===7?5.2:4.0;
  }
  return {events,waves};
 }
 function pose(e,age,stage){
  const q=e.entry,s=q.slot,k=q.kind,base=q.base,speed=145+stage*3,a=Math.max(0,age);
  let x=1030-a*speed,y=base;
  if(k===0)y=base+Math.sin(a*2.1-s*.45)*58;
  if(k===1){x+=Math.abs(s-(q.count-1)/2)*35;y=270+(s-(q.count-1)/2)*42;}
  if(k===2){y=s%2?415-a*57:105+a*57;}
  if(k===3){x=a<2?1030-a*140:750-(a-2)*185;y=base+Math.sin(Math.min(a,4)*1.2)*100;}
  if(k===4){x=a<1.6?1030-a*175:a<2.6?750:750-(a-2.6)*390;y=base+(s-1)*48;}
  if(k===5){x=1030-a*100;y=448;}
  if(k===6)y=s%2?360+Math.sin(a*1.5)*35:145-Math.sin(a*1.5)*35;
  if(k===7){x=1030-a*(s===0?95:130);y=s===0?270:270+(s%2?1:-1)*(45+Math.floor(s/2)*37);}
  return {x,y:Math.max(90,Math.min(448,y))};
 }
 return {plan,pose,names};
})();
