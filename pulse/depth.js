'use strict';
// Rendering only: every lane, note and ribbon shares one projection. Audio and
// judgment stay in song seconds; touch pads remain ordinary full-size buttons.
globalThis.PulseDepth=(()=>{
 const rainbow=['#ff98da','#c8a4ff','#83dfff','#8df1d5','#dcff83','#ffd38f'];
 const reduced=globalThis.matchMedia?.('(prefers-reduced-motion: reduce)')||{matches:false};
 let cached=null;
 function makeView(width,height,padHeight,lanes,speed=1){
  const line=Math.max(25,height-padHeight-17),horizon=Math.max(8,Math.min(68,line*.17)),distance=Math.max(12,line-horizon),ahead=2.2/Math.max(.3,speed),far=.075;
  function point(u,phase){const q=Math.pow(Math.max(0,phase),1.35),scale=far+(1-far)*q;return {x:width/2+(u-.5)*width*scale,y:horizon+distance*q,scale};}
  const phase=delta=>1-delta/ahead;
  function note(lane,delta){const p=phase(delta),center=point((lane+.5)/lanes,p);return {...center,phase:p,width:width/lanes*center.scale};}
  return {width,height,padHeight,lanes,line,horizon,distance,ahead,point,phase,note};
 }
 function polygon(c,points){c.beginPath();points.forEach((p,i)=>i?c.lineTo(p.x,p.y):c.moveTo(p.x,p.y));c.closePath();}
 function strip(c,v,left,right,front=1,back=0){polygon(c,[v.point(left,back),v.point(right,back),v.point(right,front),v.point(left,front)]);}
 function background(c,v,t,app,power,pulse,prefs){
  const {width:w,line,horizon,distance,point}=v;
  // Theme effects stay behind the instrument and remain visible at its sides.
  globalThis.PulseAdventure?.stage(c,w,v.height,line,t,app,{...prefs,effects:power>0},v);
  const portal=c.createRadialGradient(w/2,horizon,1,w/2,horizon,Math.max(25,w*.17));
  portal.addColorStop(0,power?'#cfbfff70':'#a9b5d020');portal.addColorStop(.18,'#8174cf28');portal.addColorStop(1,'#13132300');c.fillStyle=portal;c.fillRect(0,0,w,Math.min(line,horizon+w*.19));
  if(power){
   c.save();c.globalCompositeOperation='lighter';
   // Starlight streams and comet trails run outside the lane boundaries.
   for(let side=0;side<2;side++)for(let i=0;i<16;i++){
    const phase=(Math.max(0,t)*(.10+i*.003)+i*.153)%1,p=point(side,phase),edge=(side?1:-1)*(10+Math.pow(phase,1.1)*w*(.07+(i%3)*.035));
    const old=Math.max(0,phase-.16),tail=point(side,old),oldEdge=(side?1:-1)*(10+Math.pow(old,1.1)*w*(.07+(i%3)*.035));
    const color=rainbow[(i+side*2)%6],g=c.createLinearGradient(tail.x+oldEdge,tail.y,p.x+edge,p.y);g.addColorStop(0,color+'00');g.addColorStop(1,color+'ee');c.globalAlpha=power*Math.sin(phase*Math.PI)*.85;c.strokeStyle=g;c.lineWidth=i%4===0?2.2:1.1;c.beginPath();c.moveTo(tail.x+oldEdge,tail.y);c.quadraticCurveTo((tail.x+p.x+oldEdge+edge)/2,p.y-25,p.x+edge,p.y);c.stroke();c.fillStyle=color;c.fillRect(p.x+edge-1,p.y-1,3,3);if(i%5===0){const r=2+phase*3;c.beginPath();c.moveTo(p.x+edge-r,p.y);c.lineTo(p.x+edge+r,p.y);c.moveTo(p.x+edge,p.y-r);c.lineTo(p.x+edge,p.y+r);c.stroke();}
   }
   for(let i=0;i<7;i++){const age=(Math.max(0,t)*.14+i/7)%1,r=8+age*age*w*.26;c.globalAlpha=(1-age)*power*(.12+pulse*.1);c.strokeStyle=rainbow[i%6];c.lineWidth=1;c.beginPath();c.ellipse(w/2,horizon,r,r*.42,0,0,Math.PI*2);c.stroke();}
   c.restore();
  }
  // An opaque tapered runway keeps the bright surroundings off the note cores.
  strip(c,v,0,1,1.045,0);c.fillStyle='#090e1bf2';c.fill();
  for(let lane=0;lane<v.lanes;lane++){
   strip(c,v,lane/v.lanes,(lane+1)/v.lanes,1.045,0);c.fillStyle=lane%2?'#12172b99':'#151e2b88';c.fill();
  }
  for(let lane=0;lane<=v.lanes;lane++){
   const a=point(lane/v.lanes,0),b=point(lane/v.lanes,1.045),outer=lane===0||lane===v.lanes;c.strokeStyle=outer?'#d4d0ffe0':lane===v.lanes/2?'#b6b9e46b':'#8092bf48';c.lineWidth=outer?1.6:1;c.shadowColor='#b6a3ff';c.shadowBlur=outer?power*10:0;c.beginPath();c.moveTo(a.x,a.y);c.lineTo(b.x,b.y);c.stroke();c.shadowBlur=0;
  }
  // Crossbars shrink with exactly the same perspective as the notes.
  for(let i=0;i<9;i++){
   const p=power?((i/9+Math.max(0,t)*.055)%1):i/9,a=point(0,p),b=point(1,p);c.strokeStyle='#8f9cc31c';c.lineWidth=.5+p*.5;c.beginPath();c.moveTo(a.x,a.y);c.lineTo(b.x,b.y);c.stroke();
  }
  c.fillStyle='#d3cdff';c.globalAlpha=.45;c.fillRect(w/2-2,horizon-2,4,2);c.globalAlpha=1;
  if(power){
   c.save();c.beginPath();c.rect(0,0,w,horizon+2);c.clip();c.globalCompositeOperation='lighter';const radius=Math.max(20,Math.min(70,w*.09)),halo=c.createRadialGradient(w/2,horizon-5,0,w/2,horizon-5,radius);halo.addColorStop(0,'#fff8ffa6');halo.addColorStop(.08,'#efdaff99');halo.addColorStop(.35,'#c58bff55');halo.addColorStop(1,'#8b9eff00');c.globalAlpha=power*(.65+pulse*.2);c.fillStyle=halo;c.fillRect(w/2-radius,horizon-radius-5,radius*2,radius*2);c.strokeStyle='#ebd9ff';c.lineWidth=1;for(let i=0;i<4;i++){c.beginPath();c.ellipse(w/2,horizon,12+i*radius*.24,6+i*radius*.14,0,Math.PI,Math.PI*2);c.stroke();}c.restore();
  }
 }
 function laneLight(c,v,lane,t,app,power,color){
  const holding=!!app.game.held[lane],age=t-app.flashes[lane];if(!holding&&(age<0||age>.4))return;
  const fade=holding?.65:Math.pow(1-age/.4,2),g=c.createLinearGradient(0,v.line,0,v.point(.5,.55).y);g.addColorStop(0,color+'80');g.addColorStop(1,color+'00');
  c.save();c.globalAlpha=power?fade*power:.13;strip(c,v,(lane+.07)/v.lanes,(lane+.93)/v.lanes,1,.52);c.fillStyle=g;c.fill();
  if(power){
   c.globalCompositeOperation='lighter';c.lineWidth=holding?1.5:1;c.strokeStyle=color;
   for(let braid=0;braid<2;braid++){c.beginPath();for(let i=0;i<=24;i++){const p=1-i/24*.43,pos=v.point((lane+.5)/v.lanes,p),x=pos.x+Math.sin(t*8+i*.6+lane+braid*Math.PI)*v.width/v.lanes*pos.scale*.19;i?c.lineTo(x,pos.y):c.moveTo(x,pos.y);}c.stroke();}
  }c.restore();
 }
 function noteBody(c,v,n,visualTime,power,colors){
  const delta=n.time-visualTime,p=n.state==='holding'?1:v.phase(delta);if(n.state==='done'||p<0||v.phase(n.end-visualTime)>1.12||p>1.2)return;
  const u=(n.lane+.5)/v.lanes,color=colors[n.lane],center=v.point(u,p),left=(n.lane+.12)/v.lanes,right=(n.lane+.88)/v.lanes;
  if(power){
   const tail=Math.max(0,p-.23),far=v.point(u,tail),g=c.createLinearGradient(0,far.y,0,Math.max(far.y+1,center.y));g.addColorStop(0,color+'00');g.addColorStop(1,color+'60');c.fillStyle=g;c.globalAlpha=power*.65;strip(c,v,(n.lane+.23)/v.lanes,(n.lane+.77)/v.lanes,p,tail);c.fill();c.globalAlpha=1;
  }
  if(n.end>n.time){
   const tail=Math.max(0,v.phase(n.end-visualTime)),far=v.point(u,tail),g=c.createLinearGradient(0,far.y,0,Math.max(far.y+1,center.y));g.addColorStop(0,color+'95');g.addColorStop(1,color+(n.state==='holding'?'aa':'3d'));strip(c,v,(n.lane+.28)/v.lanes,(n.lane+.72)/v.lanes,p,tail);c.fillStyle=g;c.fill();c.strokeStyle=color+'99';c.lineWidth=1;c.stroke();
   const span=Math.min(.055,3.33/v.distance);strip(c,v,left,right,tail+span,Math.max(0,tail-span));c.fillStyle=color;c.fill();
  }
  const span=Math.min(.055,3.33/v.distance);strip(c,v,left,right,p+span,Math.max(0,p-span));
  c.shadowColor=color;c.shadowBlur=power?3+power*10*center.scale:0;c.fillStyle=color;c.fill();c.shadowBlur=0;
  const shine=v.point(left,p-span*.45),end=v.point(right,p-span*.45);c.strokeStyle='#ffffffdd';c.lineWidth=Math.max(.6,center.scale*1.2);c.beginPath();c.moveTo(shine.x,shine.y);c.lineTo(end.x,end.y);c.stroke();
 }
 function hits(c,v,t,app,power){
  if(!power)return;c.save();c.globalCompositeOperation='lighter';
  const lw=v.width/v.lanes;
  for(const b of app.bursts){const age=t-b.time;if(age<0||age>.95)continue;const k=age/.95,pos=v.point((b.lane+.5)/v.lanes,1),fade=Math.pow(1-k,1.5);c.globalAlpha=fade*power;
   for(let ring=0;ring<3;ring++){const r=4+k*(lw*(ring?1.3:1)+ring*16);c.strokeStyle=rainbow[(ring+b.lane)%6];c.lineWidth=ring?1:2;c.beginPath();c.ellipse(pos.x,pos.y,r,r*.28,0,0,Math.PI*2);c.stroke();}
   const count=v.width<600?16:25;
   for(let i=0;i<count;i++){const angle=i/count*Math.PI*2+b.seed*.41,speed=25+(i*37%85),dx=Math.cos(angle)*speed,dy=-Math.abs(Math.sin(angle))*speed*1.65,px=pos.x+dx*k,py=pos.y+dy*k+45*k*k,color=rainbow[(i+b.lane)%6],tail=Math.max(0,k-.12);c.strokeStyle=color;c.fillStyle=color;c.lineWidth=i%5===0?1.8:1;c.beginPath();c.moveTo(pos.x+dx*tail,pos.y+dy*tail+45*tail*tail);c.lineTo(px,py);c.stroke();
    if(i%5===0){const r=2+(1-k)*2;c.beginPath();c.moveTo(px,py-r*1.5);c.lineTo(px+r,py);c.lineTo(px,py+r*1.5);c.lineTo(px-r,py);c.closePath();c.fill();}else c.fillRect(px-1,py-1,2,2);
   }
   if(age<.17){const glow=c.createRadialGradient(pos.x,pos.y,1,pos.x,pos.y,lw*.8);glow.addColorStop(0,'#ffffffbb');glow.addColorStop(.3,b.color+'77');glow.addColorStop(1,b.color+'00');c.globalAlpha=power*(1-age/.17);c.fillStyle=glow;c.fillRect(pos.x-lw,pos.y-lw,lw*2,lw*2);}
   if(b.milestone){c.globalAlpha=power*fade*.7;c.strokeStyle=rainbow[b.lane%6];c.lineWidth=2;c.beginPath();c.ellipse(v.width/2,v.line,30+k*v.width*.85,8+k*v.distance*.25,0,0,Math.PI*2);c.stroke();}
  }c.restore();
 }
 function hud(c,v,t,app,prefs){
  const compact=v.line<200,comboX=compact?v.width*.18:v.width/2,comboY=compact?Math.max(27,v.horizon+v.distance*.35):v.horizon+v.distance*.46,g=app.game;
  c.textAlign='center';
  if(g.combo>1){c.font=`350 ${compact?26:Math.max(30,Math.min(55,v.width*.085))}px Segoe UI`;c.shadowColor='#080c18';c.shadowBlur=7;c.fillStyle='#f1f3f8';c.fillText(g.combo,comboX,comboY);c.shadowBlur=0;c.font=compact?'6px Segoe UI':'8px Segoe UI';c.fillStyle='#c0c8dc';c.fillText('C O M B O',comboX,comboY+(compact?12:18));}
  const j=app.judgment;if(!j||t-j.time>=.65)return;const x=compact?v.width*.68:v.width/2,y=compact?Math.max(28,v.horizon+v.distance*.35):Math.max(v.horizon+35,v.line-51);
  c.globalAlpha=Math.min(1,(.65-(t-j.time))*4);c.fillStyle=j.grade==='miss'?'#ff9db8':j.grade==='great'?'#c5a9ff':'#dfff8d';c.font=`650 ${compact?17:Math.max(17,Math.min(27,v.width*.049))}px Segoe UI`;c.shadowColor='#080c18';c.shadowBlur=6;c.fillText(j.grade.toUpperCase()+(j.hold?' / HOLD':''),x,y);c.shadowBlur=0;
  if(prefs.timingDetails&&j.grade!=='miss'){c.font=compact?'8px Segoe UI':'10px Segoe UI';c.fillStyle='#c2cae0';c.fillText(`${Math.abs(j.delta)<.015?'JUST':j.delta<0?'FAST':'SLOW'} ${j.delta>0?'+':''}${Math.round(j.delta*1000)} ms`,x,y+17);}c.globalAlpha=1;
 }
 function draw(c,{w,h,padHeight,time:t,visualTime,app,prefs,colors}){
  const key=[w,h,padHeight,app.lanes,prefs.speed].join('/');if(cached?.key!==key)cached={key,view:makeView(w,h,padHeight,app.lanes,prefs.speed)};const v=cached.view;
  const power=prefs.effects&&!reduced.matches?Math.max(0,Math.min(1,prefs.fxIntensity/100)):0,beat=60/app.track.bpm,pulse=power?Math.exp(-((Math.max(0,t-2.5)%beat)/beat)*5):0;
  c.save();c.beginPath();c.rect(0,0,w,h-padHeight);c.clip();background(c,v,t,app,power,pulse,prefs);
  for(let lane=0;lane<app.lanes;lane++)laneLight(c,v,lane,t,app,power,colors[lane]);
  const visible=app.game.notes.filter(n=>n.state!=='done'&&(n.state==='holding'||n.time-visualTime<=v.ahead)&&n.end-visualTime>=-.2).sort((a,b)=>b.time-a.time);
  for(const note of visible)noteBody(c,v,note,visualTime,power,colors);
  // The exact hit plane stays directly above the unchanged touch pads.
  c.shadowColor='#d5eaff';c.shadowBlur=power?9+pulse*8:0;c.strokeStyle='#efffec';c.lineWidth=1.7;c.beginPath();c.moveTo(0,v.line);c.lineTo(w,v.line);c.stroke();c.shadowBlur=0;
  app.bursts=app.bursts.filter(b=>t-b.time<1.2);hits(c,v,t,app,power);hud(c,v,t,app,prefs);c.restore();
 }
 return {makeView,draw};
})();
