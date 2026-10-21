/* Original Canvas silhouettes. Bright cores show collision centers; trails are decorative. */
window.AbyssalProjectiles=(()=>{
 const TAU=Math.PI*2;
 function polygon(g,points,fill,stroke){g.beginPath();points.forEach(([x,y],i)=>i?g.lineTo(x,y):g.moveTo(x,y));g.closePath();if(fill){g.fillStyle=fill;g.fill();}if(stroke){g.strokeStyle=stroke;g.stroke();}}
 function line(g,x,y,tx,ty,color,width){g.strokeStyle=color;g.lineWidth=width;g.beginPath();g.moveTo(x,y);g.lineTo(tx,ty);g.stroke();}
 function ring(g,r,color,width=2){g.strokeStyle=color;g.lineWidth=width;g.beginPath();g.arc(0,0,r,0,TAU);g.stroke();}
 function player(g,s,time){
  const c=s.color,l=s.level||1,r=s.r,k=s.kind;
  g.save();g.translate(s.x,s.y);g.rotate(Math.atan2(s.vy,s.vx));g.shadowColor=c;g.shadowBlur=5+l*2;g.lineWidth=1.5;
  if(k===2){
   polygon(g,[[-76,-r],[6,-r*.65],[12,0],[6,r*.65],[-76,r]],c+'55',c);
   line(g,-75,0,10,0,'#edffff',2+l*.5);
   if(l>1)for(const y of [-r,r])line(g,-70,y,0,y,c,1);
  }else if(s.mine||k===7){
   g.rotate(time*2);polygon(g,Array.from({length:12},(_,i)=>{const a=i*TAU/12,rr=i%2?r*.7:r*1.25;return [Math.cos(a)*rr,Math.sin(a)*rr];}),'#332619',c);ring(g,r*.55,c);ring(g,2,'#fff4ce');
  }else if(s.wave||k===4){
   g.strokeStyle=c;g.lineWidth=3;g.beginPath();g.ellipse(-4,0,12,r*1.45,-0,-1.3,1.3);g.stroke();
   g.strokeStyle='#efdbff';g.lineWidth=1.5;g.beginPath();g.ellipse(0,0,8,r,0,-1.3,1.3);g.stroke();
   if(l>=2){g.globalAlpha=.5;g.beginPath();g.ellipse(-12,0,10,r*1.55,0,-1.3,1.3);g.stroke();}
  }else if(s.homing||s.bomb||k===3||k===10){
   polygon(g,[[-10,-r],[-2,-r],[9,0],[-2,r],[-10,r]],'#e6f4ef',c);
   polygon(g,[[-8,-r],[-15,-r-4],[-12,0],[-15,r+4],[-8,r]],c);
   polygon(g,[[-12,-3],[-24-l*4-Math.sin(time*40)*4,0],[-12,3]],'#ffb45d');
   line(g,-4,0,4,0,c,2);
  }else if(k===1){
   polygon(g,[[8,0],[-3,-r-1],[-13,-r],[-6,0],[-13,r],[-3,r+1]],c,'#fff3cf');
  }else if(k===5){
   g.rotate(time*5+(s.phase||0));polygon(g,[[r+3,0],[0,-r],[-r-3,0],[0,r]],c,'#e4ffe8');
   ring(g,r+3,c+'70',1);
  }else if(k===6){
   polygon(g,[[r+4,0],[-r,-r*.7],[-r*.4,0],[-r,r*.7]],c,'#fff0d8');
  }else if(k===8){
   polygon(g,[[11,0],[0,-r],[-4,-2],[-12,0],[-1,r],[3,2]],'#dcf6ff',c);
  }else if(k===9){
   g.scale(1.35,.7);ring(g,r+1,c,2);line(g,-8,0,4,0,'#fff3ff',1.5);
  }else{
   polygon(g,[[11,0],[3,-r],[-13,-r*.55],[-20,0],[-13,r*.55],[3,r]],c+'b0',c);
   line(g,-13,0,7,0,'#e9ffff',2);
  }
  if(l>=3&&!s.mine){g.globalAlpha=.6;line(g,-23,-r-3,-10,-r-3,c,1);line(g,-23,r+3,-10,r+3,c,1);}
  g.restore();
 }
 function enemy(g,s,time){
  const c=s.color,r=s.r;g.save();g.translate(s.x,s.y);g.rotate(Math.atan2(s.vy,s.vx));g.shadowColor=c;g.shadowBlur=4;g.lineWidth=1.5;
  if(s.breakable){
   g.rotate(Math.PI/4);polygon(g,[[-r,-r],[r,-r],[r,r],[-r,r]],'#123f39','#a4ffde');
   line(g,-r,-r,r,r,c,1);line(g,r,-r,-r,r,c,1);
  }else if(s.homing){
   polygon(g,[[r+4,0],[-r,-r],[-r*.4,0],[-r,r]],c,'#ffe8d8');
   line(g,-r,0,-r-8,0,c+'70',2);
  }else if(s.wave||s.curve){
   g.strokeStyle=c;g.lineWidth=2.5;g.beginPath();g.arc(-2,0,r+2,-1.4,1.4);g.stroke();if(s.wave){g.lineWidth=1.5;g.beginPath();g.arc(-6,0,r+3,-1.4,1.4);g.stroke();}
   polygon(g,[[r,0],[0,-r*.65],[-r,0],[0,r*.65]],c+'90');
  }else if(Math.hypot(s.vx,s.vy)>200){
   polygon(g,[[r+6,0],[-r,-r*.6],[-r*.4,0],[-r,r*.6]],c,'#ffe9a5');
  }else{
   polygon(g,[[r+2,0],[0,-r],[-r-2,0],[0,r]],c,'#ffecd9');
  }
  // The solid center remains visible against both bright and dark scenery.
  g.shadowBlur=0;g.fillStyle='#fff7e5';g.beginPath();g.arc(0,0,Math.max(1.3,r*.28),0,TAU);g.fill();g.restore();
 }
 function pickup(g,v,time){
  const weapon=v.type==='weapon',armor=v.type==='armor',speed=v.type==='speed',c=speed?'#efb2ff':weapon?'#ffd278':armor?'#77dbff':'#8dffcf',bob=0;
  g.save();g.translate(v.x,v.y+bob);g.shadowColor=c;g.shadowBlur=12;
  g.save();g.rotate(time*(weapon?1.5:-.8));g.strokeStyle=c+'66';g.lineWidth=1;g.beginPath();g.arc(0,0,22,.15,2.3);g.arc(0,0,22,3.3,5.4);g.stroke();g.restore();
  if(weapon){
   polygon(g,[[-20,-5],[-11,-12],[11,-12],[20,-5],[20,5],[11,12],[-11,12],[-20,5]],'#453324',c);
   polygon(g,[[-12,-6],[-7,-18],[-2,-9],[2,-9],[7,-18],[12,-6],[12,6],[7,18],[2,9],[-2,9],[-7,18],[-12,6]],'#153e4c',c);
   polygon(g,[[10,0],[0,-7],[-10,0],[0,7]],'#fff0b9',c);
  }else if(speed){
   polygon(g,[[-18,-13],[8,-13],[20,0],[8,13],[-18,13],[-8,0]],'#44285c',c);
   for(let x=-8;x<=4;x+=12)polygon(g,[[x,-8],[x+9,0],[x,8],[x+3,0]],'#fff0ff',c);
  }else if(armor){
   polygon(g,[[-13,-14],[13,-14],[14,3],[8,14],[0,19],[-8,14],[-14,3]],'#173a59',c);
   polygon(g,[[-8,-8],[8,-8],[8,3],[0,12],[-8,3]],'#56c4e5','#d9ffff');line(g,-5,0,5,0,'#fff',3);line(g,0,-5,0,5,'#fff',3);
  }else{
   polygon(g,[[0,-19],[11,-8],[14,6],[0,19],[-14,6],[-11,-8]],'#184d44',c);
   polygon(g,[[0,-14],[7,0],[0,14],[-7,0]],'#c5ffe4','#fff');line(g,-10,-7,10,7,c,1);line(g,10,-7,-10,7,c,1);
  }
  g.shadowBlur=0;g.fillStyle=c;g.font='bold 9px Consolas,"Yu Gothic",sans-serif';g.textAlign='center';g.fillText(speed?'SPEED UP':weapon?'NEW WEAPON':armor?'ARMOR':'POWER UP',0,34);g.restore();
 }
 return {player,enemy,pickup};
})();
