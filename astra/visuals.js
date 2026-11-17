/* Decorative layer only. Gestures never add score or change chart timing. */
(function(root){
 'use strict';
 const Typography=root.AstraTypography||(typeof require==='function'?require('./typography.js'):null);
 class AstraVisuals{
  constructor(){this.reset();}
  reset(){this.typography=new Typography();this.clock=0;this.lastPress=null;this.lyrics=[];this.meteors=[];this.planets=[];this.dust=[];this.waves=[];this.lyricKey='';this.lyricSerial=0;this.lastLyric=-10;this.nextMeteor=0;this.nextPlanet=.4;this.emit=0;this.doubleCount=0;this.presses=0;this.heldEmissions=0;this.enabled=true;}
  clear(){this.typography.clear();this.lyrics=[];this.meteors=[];this.planets=[];this.dust=[];this.waves=[];this.lastPress=null;}
  press(p,stamp,w,h){
   if(!this.enabled)return false;
   const double=!!(this.lastPress&&stamp-this.lastPress.stamp>35&&stamp-this.lastPress.stamp<330&&Math.hypot(p.x-this.lastPress.x*w,p.y-this.lastPress.y*h)<80);
   this.lastPress=double?null:{x:p.x/w,y:p.y/h,stamp};this.presses++;if(double)this.doubleCount++;
   this.explode(p.x/w,p.y/h,double?88:30,double?310:180,double?290:180);
   this.waves.push({x:p.x/w,y:p.y/h,age:0,double,hue:double?295:175});if(this.waves.length>24)this.waves.shift();
   if(double){this.meteors.push({x:p.x/w-.12,y:p.y/h-.18,vx:.22,vy:.34,age:0,life:2.1,hue:300});}
   if(this.meteors.length>12)this.meteors.splice(0,this.meteors.length-12);return double;
  }
  explode(x,y,count,speed,hue){
   for(let i=0;i<count;i++){const a=i*2.39996+Math.random()*.25,v=.2+Math.random()*.8;this.dust.push({x,y,vx:Math.cos(a)*speed*v,vy:Math.sin(a)*speed*v,age:0,life:.45+Math.random()*.65,size:1+Math.random()*3,hue:hue+i*360/count});}
   if(this.dust.length>320)this.dust.splice(0,this.dust.length-320);
  }
  update(dt,{enabled,w,h,pointer,line,streak=0,beat=0,songTime=this.clock,track={id:'',genre:'',bpm:140},energy=0}){
   this.enabled=enabled;this.typography.update(dt,{enabled,songTime,line,track,energy,beat,streak});
   if(!enabled){this.clear();return;}
   this.clock+=dt;this.beat=beat;this.streak=streak;
   // Freeze all decorative motion when paused, as well as the audio clock.
   if(dt<=0)return;
   const key=line?line.time+':'+line.text:'notes';
   if(!line&&(key!==this.lyricKey||this.clock-this.lastLyric>2.3)){
    this.lyricKey=key;this.lastLyric=this.clock;const index=this.lyricSerial++;
    this.lyrics.push({text:line?line.text:['♪　♫　✧','✧　♩　♪'][index%2],x:.18+(index*.237)% .64,y:-.12,age:0,life:8,angle:(index%2?1:-1)*(.13+index%3*.11),size:34+(index%4)*18,hue:(index*61+175)%360,vx:(index%2?-.015:.022),vy:.10+(index%3)*.018,font:index%3});
    if(this.lyrics.length>3)this.lyrics.shift();
   }
   if(this.clock>=this.nextMeteor){this.nextMeteor=this.clock+1.8;this.meteors.push({x:-.18+Math.random()*.95,y:-.16,vx:.16+Math.random()*.16,vy:.28+Math.random()*.18,age:0,life:4.3,hue:160+Math.random()*140});}
   if(this.clock>=this.nextPlanet){this.nextPlanet=this.clock+10;this.planets.push({x:.15+Math.random()*.7,y:-.08,age:0,life:13,r:.065+Math.random()*.04,hue:190+Math.random()*140,angle:Math.random()-.5});}
   if(pointer.down){this.emit+=dt;while(this.emit>.04){this.emit-=.04;this.heldEmissions++;this.explode(pointer.x/w,pointer.y/h,2,38,170+this.clock*80);}}else this.emit=0;
   for(const p of this.lyrics){p.age+=dt;p.x+=p.vx*dt;p.y+=p.vy*dt;}
   for(const p of this.meteors){p.age+=dt;p.x+=p.vx*dt;p.y+=p.vy*dt;}
   for(const p of this.planets){p.age+=dt;p.y+=.095*dt;p.x+=Math.sin(this.clock*.3)*dt*.008;}
   for(const p of this.dust){p.age+=dt;p.x+=p.vx*dt/w;p.y+=p.vy*dt/h;p.vy+=32*dt;}
   for(const p of this.waves)p.age+=dt;
   this.lyrics=this.lyrics.filter(p=>p.age<p.life);this.meteors=this.meteors.filter(p=>p.age<p.life&&p.y<1.35).slice(-12);this.planets=this.planets.filter(p=>p.age<p.life);this.dust=this.dust.filter(p=>p.age<p.life);this.waves=this.waves.filter(p=>p.age<1.05);
  }
  background(ctx,w,h){
   if(!this.enabled)return;ctx.save();
   const mist=ctx.createRadialGradient(w*.5,h*.5,0,w*.5,h*.5,Math.min(w,h)*.47);mist.addColorStop(0,'#8059db18');mist.addColorStop(.5,'#357dc91b');mist.addColorStop(1,'#00000000');ctx.fillStyle=mist;ctx.fillRect(0,0,w,h);
   for(const p of this.planets){
    const r=p.r*Math.min(w,h),x=p.x*w,y=p.y*h;ctx.save();ctx.translate(x,y);ctx.rotate(p.angle);ctx.globalAlpha=.58;
    const g=ctx.createRadialGradient(-r*.3,-r*.4,r*.05,0,0,r);g.addColorStop(0,`hsl(${p.hue},80%,78%)`);g.addColorStop(.5,`hsl(${p.hue},62%,38%)`);g.addColorStop(1,'#101729');ctx.fillStyle=g;ctx.beginPath();ctx.arc(0,0,r,0,Math.PI*2);ctx.fill();
    ctx.strokeStyle=`hsla(${p.hue+50},90%,80%,.75)`;ctx.lineWidth=3;ctx.beginPath();ctx.ellipse(0,0,r*1.8,r*.4,-.25,0,Math.PI*2);ctx.stroke();ctx.restore();
   }
   for(const p of this.meteors){
    const x=p.x*w,y=p.y*h,dx=p.vx*w*.55,dy=p.vy*h*.55;const g=ctx.createLinearGradient(x-dx,y-dy,x,y);g.addColorStop(0,'#00000000');g.addColorStop(.7,`hsla(${p.hue},90%,70%,.25)`);g.addColorStop(1,'#e6fff9');ctx.strokeStyle=g;ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(x-dx,y-dy);ctx.lineTo(x,y);ctx.stroke();ctx.fillStyle='#eefff9';ctx.shadowColor=`hsl(${p.hue},95%,75%)`;ctx.shadowBlur=15;ctx.beginPath();ctx.arc(x,y,2.4,0,Math.PI*2);ctx.fill();ctx.shadowBlur=0;
   }
   this.typography.draw(ctx,w,h);
   for(const p of this.lyrics){
    ctx.save();ctx.translate(p.x*w,p.y*h);ctx.rotate(p.angle);const pulse=1+this.beat*.12+Math.min(this.streak,32)*.002;ctx.scale(pulse,pulse);ctx.globalAlpha=Math.min(.34,p.age*.3,(p.life-p.age)*.24);ctx.fillStyle=`hsl(${p.hue+this.clock*9},90%,80%)`;ctx.textAlign='center';ctx.textBaseline='middle';ctx.font=`${p.font===2?'italic ':''}${p.font===1?'700':'400'} ${Math.min(p.size,w*.16)}px ${p.font===0?'"Yu Mincho",serif':'"Yu Gothic UI",sans-serif'}`;ctx.shadowColor=ctx.fillStyle;ctx.shadowBlur=8;ctx.fillText(p.text,0,0,w*.94);ctx.restore();
   }
   ctx.restore();
  }
  foreground(ctx,w,h){
   if(!this.enabled)return;ctx.save();ctx.globalCompositeOperation='lighter';
   for(const p of this.waves){const life=1-p.age/1.05,x=p.x*w,y=p.y*h,r=16+p.age*(p.double?270:170);ctx.globalAlpha=life*.9;const glow=ctx.createRadialGradient(x,y,0,x,y,Math.max(1,65*life));glow.addColorStop(0,"#ffffffb0");glow.addColorStop(.2,`hsla(${p.hue},100%,80%,.55)`);glow.addColorStop(1,"#00000000");ctx.fillStyle=glow;ctx.fillRect(x-65,y-65,130,130);ctx.strokeStyle=`hsl(${p.hue+p.age*180},100%,75%)`;ctx.lineWidth=p.double?4:2;ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.stroke();if(p.double){ctx.lineWidth=1;ctx.beginPath();ctx.arc(x,y,r*.68,0,Math.PI*2);ctx.stroke();for(let i=0;i<8;i++){const a=i*Math.PI/4+p.age;ctx.beginPath();ctx.moveTo(x+Math.cos(a)*r*.6,y+Math.sin(a)*r*.6);ctx.lineTo(x+Math.cos(a)*(r+25),y+Math.sin(a)*(r+25));ctx.stroke();}}}
   for(const p of this.dust){ctx.globalAlpha=(1-p.age/p.life)*.9;ctx.fillStyle=`hsl(${p.hue},95%,78%)`;const x=p.x*w,y=p.y*h;ctx.fillRect(x-p.size*.5,y-p.size*.5,p.size,p.size);}
   ctx.restore();
  }
  get stats(){return{presses:this.presses,doubleTaps:this.doubleCount,heldEmissions:this.heldEmissions,lyrics:this.lyrics.length+(this.typography.active?1:0),lyricTexts:[...this.lyrics.map(p=>p.text),...(this.typography.active?[this.typography.active.text]:[])],typography:this.typography.stats,meteors:this.meteors.length,planets:this.planets.length,dust:this.dust.length,waves:this.waves.length,clock:this.clock,enabled:this.enabled};}
 }
 root.AstraVisuals=AstraVisuals;if(typeof module!=='undefined')module.exports=AstraVisuals;
})(globalThis);
