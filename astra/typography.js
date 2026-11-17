/* Original kinetic typography. Line times are estimated ASR alignment;
   glyph entrance delays are visual choreography, not word-level transcription. */
(function(root){
 'use strict';
 const Sync=root.AstraLyricSync||(typeof require==='function'?require('./lyric-sync.js'):null);
 const clamp=(x,a,b)=>Math.max(a,Math.min(b,x)),ease=x=>1-(1-clamp(x,0,1))**3;
 function hash(text){let n=2166136261;for(const c of text)n=Math.imul(n^c.codePointAt(0),16777619);return n>>>0;}
 function groups(text){
  const words=text.trim().split(/\s+/).filter(Boolean),rows=[];
  for(const word of words){const chars=Array.from(word);while(chars.length)rows.push(chars.splice(0,9).join(''));}
  if(rows.length===1&&Array.from(rows[0]).length>6){const cs=Array.from(rows[0]),m=Math.ceil(cs.length/2);return[cs.slice(0,m).join(''),cs.slice(m).join('')];}
  if(rows.length>3){const cs=Array.from(words.join('')),size=Math.ceil(cs.length/3);return[cs.slice(0,size).join(''),cs.slice(size,size*2).join(''),cs.slice(size*2).join('')].filter(Boolean);}
  return rows;
 }
 function route(t){const pts=[[.39,.23],[.61,.37],[.39,.53],[.61,.68]],q=clamp(t,0,.9999)*3,i=Math.floor(q),u=q-i,v=u*u*(3-2*u),a=pts[i],b=pts[i+1];return{x:a[0]+(b[0]-a[0])*v,y:a[1]+(b[1]-a[1])*v};}
 function profile(track,energy){
  const genre=track.genre||'',bpm=track.bpm||140;
  if(/ボカロ|グリッチ|ハード|ロック|ユーロ/.test(genre)&&energy>.36)return'pulse';
  if(bpm<135||/ピアノ|ノルディック|ソウル/.test(genre))return'float';
  return energy>.64?'pulse':'orbit';
 }
 class AstraTypography{
  constructor(){this.reset();}
  reset(){this.active=null;this.ghosts=[];this.fragments=[];this.time=0;this.lastTime=null;this.charge=0;this.energy=0;this.beat=0;this.lastPositions=[];this.dissolves=0;this.hits=0;this.enabled=true;this.streak=0;this.motion='auto';}
  clear(){this.active=null;this.ghosts=[];this.fragments=[];this.lastPositions=[];this.lastTime=null;this.charge=0;this.beat=0;}
  create(line,track,energy){
   const seed=hash(track.id+':'+line.time+':'+line.text),kind=profile(track,energy),automaticShape=['wave','cylinder','zigzag','comet'][seed%4];
   return{automaticShape,shape:this.motion==='auto'?automaticShape:this.motion,key:line.time+':'+line.text,text:line.text,start:line.time,end:line.end,rows:groups(line.text),kind,seed,angle:(seed%2?1:-1)*(kind==='float'?.065:.13),hue:kind==='pulse'?275:kind==='float'?185:215,words:line.words||[],fade:0};
  }
  shatter(phrase){
   const positions=this.lastPositions.length?this.lastPositions:Array.from(phrase.text).filter(c=>c.trim()).map((char,i)=>({char,x:.18+(i%9)*.07,y:.42+Math.floor(i/9)*.1,size:36,font:'36px serif'}));
   positions.slice(0,48).forEach((g,i)=>{const a=-.3+(i%7)*.1;this.fragments.push({...g,age:0,life:.85+(i%4)*.1,vx:Math.cos(a)*(.10+(i%5)*.009),vy:.04+Math.sin(a)*.035,spin:(i%2?1:-1)*.18,hue:phrase.hue+(i%3)*20});});
   if(this.fragments.length>96)this.fragments.splice(0,this.fragments.length-96);this.dissolves++;
  }
  hit(value){if(!this.enabled||!['PERFECT','GREAT','GOOD'].includes(value))return;this.hits++;this.charge=Math.min(1,this.charge+(value==='PERFECT'?.85:value==='GREAT'?.4:.16));}
  update(dt,{enabled,songTime,line,track,energy=0,beat=0,streak=0,motion='auto'}){
   this.enabled=enabled;if(!enabled){this.clear();return;}
   if(dt<=0)return;
   const seeking=this.lastTime!==null&&(songTime<this.lastTime-.08||Math.abs(songTime-this.lastTime)>1.0);
   if(seeking){this.active=null;this.ghosts=[];this.fragments=[];this.lastPositions=[];}
   this.lastTime=songTime;this.time=songTime;this.streak=streak;this.motion=['wave','cylinder','zigzag','comet'].includes(motion)?motion:'auto';if(this.active)this.active.shape=this.motion==='auto'?this.active.automaticShape:this.motion;
   this.energy+=(clamp(energy,0,1)-this.energy)*Math.min(1,dt*5);this.beat=Math.max(beat,this.beat-dt*5);this.charge=Math.max(0,this.charge-dt*1.7);
   const key=line?line.time+':'+line.text:null;
   if(this.active&&this.active.key!==key){
    if(!seeking){this.shatter(this.active);this.ghosts.push({...this.active,fade:0});if(this.ghosts.length>2)this.ghosts.shift();}
    this.active=null;this.lastPositions=[];
   }
   if(line&&!this.active)this.active=this.create(line,track,this.energy);
   for(const g of this.ghosts)g.fade+=dt;
   this.ghosts=this.ghosts.filter(g=>g.fade<.75);
   for(const p of this.fragments){p.age+=dt;p.x+=p.vx*dt;p.y+=p.vy*dt;p.vy+=.065*dt;}
   this.fragments=this.fragments.filter(p=>p.age<p.life);
  }
  glyphs(p,w,h){
   const rows=p.rows,count=rows.length,size=Math.min(w*.18,h*.16,94),baseY=count===1?.34:.27-Math.max(0,count-2)*.035,result=[];
   rows.forEach((row,j)=>{
    const chars=Array.from(row),weights=chars.map(c=>c.codePointAt(0)<128?.52:1),total=weights.reduce((a,b)=>a+b,0),fontSize=Math.min(size*(j===count-1?1.17:1),w*.87/(total+.18)),step=fontSize/w;
    let cursor=.5-total*step/2;
    const weight=p.kind==='pulse'?'700':'400',font=p.kind==='float'||(p.kind==='orbit'&&j%2===0)?'"Yu Mincho","Hiragino Mincho ProN",serif':'"Yu Gothic UI","Hiragino Sans",sans-serif';
    chars.forEach((char,i)=>{const advance=weights[i]*step;result.push({char,x:cursor+advance/2,y:baseY+j*size*1.18/h,size:fontSize,font:weight+' '+fontSize+'px '+font,fontFamily:font,weight,index:result.length,row:j,rowIndex:i});cursor+=advance;});
   });
   const progress=clamp((this.time-p.start)/Math.max(.2,p.end-p.start),0,1);
   for(const g of result){g.scaleX=1;g.scaleY=1;g.depth=1;g.rotation=0;if(p.shape==='cylinder'){const theta=(this.time-p.start)*.53-.5+g.row*1.05,z=Math.cos(theta),depth=.69+.23*z;g.x=.5+Math.sin(theta)*.14+(g.x-.5)*depth*.83;g.y+=Math.sin(theta)*.015;g.scaleX=depth*.83*(.65+.35*Math.abs(z));g.scaleY=depth*.9;g.depth=.38+.62*Math.max(0,z);}else if(p.shape==='zigzag'){const q=route(progress*.45);g.x=.5+(q.x-.5)*.55+(g.row%2?.055:-.055)+(g.x-.5)*.72;g.y=q.y+g.row*Math.min(.16,size*1.26/h);g.scaleX=.78;g.scaleY=.78;g.rotation=g.row%2?.045:-.045;}else if(p.shape==='comet'){g.x+=(Math.sin(progress*Math.PI)*.018);}}
   return result;
  }
  drawPhrase(ctx,p,w,h,ghost=false){
   const age=this.time-p.start,duration=Math.max(.2,p.end-p.start),progress=clamp(age/duration,0,1),positions=this.glyphs(p,w,h);
   if(!ghost)this.lastPositions=[];
   const first=positions[0],angle=p.angle*(p.kind==='float'?.45:.7),intensity=Math.min(.57,.35+this.energy*.06+this.charge*.1+Math.min(this.streak,32)*.0015);
   const direction=p.seed%2?1:-1,drift=direction*Math.sin(progress*Math.PI)*w*.035,flow=progress*h*.12+(ghost?p.fade*h*.13:0),scale=1+this.beat*.018+this.charge*.012;
   const pivotX=w*.5+drift,pivotY=h*.45+flow,arrival=.72+.28*ease(age/.16),exit=ghost?Math.max(0,1-p.fade/.75)*.24:1;
   ctx.save();ctx.translate(pivotX,pivotY);ctx.rotate(angle);ctx.scale(scale,scale);ctx.translate(-w*.5,-h*.45);
   if(p.shape==='cylinder'){ctx.save();ctx.globalAlpha=exit*intensity*.21;ctx.strokeStyle='#b1cce5';ctx.lineWidth=.8;const top=h*.2,bottom=h*(.35+Math.min(2,p.rows.length)*.14);for(const y of [top,bottom]){ctx.beginPath();ctx.ellipse(w*.5,y,w*.28,h*.032,0,0,Math.PI*2);ctx.stroke();}for(const x of [.22,.78]){ctx.beginPath();ctx.moveTo(w*x,top);ctx.lineTo(w*x,bottom);ctx.stroke();}ctx.restore();}else if(p.shape==='zigzag'){ctx.save();ctx.globalAlpha=exit*intensity*.18;ctx.strokeStyle='#b6dae6';ctx.lineWidth=1;ctx.setLineDash([2,8]);ctx.beginPath();for(let i=0;i<=42;i++){const q=route(i/42);i?ctx.lineTo(q.x*w,q.y*h):ctx.moveTo(q.x*w,q.y*h);}ctx.stroke();ctx.restore();}
   ctx.globalAlpha=arrival*exit*intensity*.5;ctx.strokeStyle=`hsl(${p.hue+35},70%,75%)`;ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(w*.17,h*(first?.y||.3)+Math.min(w*.18,h*.16)*.7);ctx.lineTo(w*(.25+.57*ease(age*2)),h*(first?.y||.3)+Math.min(w*.18,h*.16)*.7);ctx.stroke();
   for(const g of positions){
    const x=g.x*w,y=g.y*h,word=Sync.wordAt(p.words,g.index,this.time),vocal=word?Math.sin(Math.PI*clamp((this.time-word.time)/Math.max(.04,word.end-word.time),0,1)):0;
    if(!ghost){const dx=(x-w*.5)*scale,dy=(y-h*.45)*scale;this.lastPositions.push({...g,x:(pivotX+Math.cos(angle)*dx-Math.sin(angle)*dy)/w,y:(pivotY+Math.sin(angle)*dx+Math.cos(angle)*dy)/h});}
    const hue=p.hue+g.row*45;
    ctx.save();ctx.translate(x,y);ctx.rotate(g.rotation);ctx.scale(g.scaleX,g.scaleY);ctx.font=g.font;ctx.textAlign='center';ctx.textBaseline='middle';ctx.globalAlpha=clamp(arrival*exit*(intensity+vocal*.23)*g.depth,0,1);ctx.fillStyle=word?'#f5efff':`hsl(${hue},70%,80%)`;ctx.shadowColor=`hsl(${hue},90%,75%)`;ctx.shadowBlur=word?12:this.charge>.2?8:2;ctx.fillText(g.char,0,0);ctx.restore();
   }
   if(p.shape==='comet'&&!ghost&&positions.length){let index=progress*(positions.length-1);const words=p.words,word=words.find(w=>this.time>=w.time&&this.time<w.end);if(word)index=word.glyphStart+clamp((this.time-word.time)/(word.end-word.time),0,1)*Math.max(0,word.glyphEnd-word.glyphStart-1);else if(words.length){const next=words.find(w=>w.time>this.time),before=[...words].reverse().find(w=>w.end<=this.time);if(before&&next)index=before.glyphEnd-1+ease((this.time-before.end)/Math.max(.04,next.time-before.end))*(next.glyphStart-before.glyphEnd+1);else index=before?before.glyphEnd-1:words[0].glyphStart;}const lo=Math.floor(clamp(index,0,positions.length-1)),hi=Math.min(positions.length-1,lo+1),u=index-lo,a=positions[lo],b=positions[hi],x=(a.x+(b.x-a.x)*u)*w+12,y=(a.y+(b.y-a.y)*u)*h+10,tail=positions[Math.max(0,lo-2)],tx=tail.x*w-20,ty=tail.y*h+12;ctx.save();ctx.globalAlpha=.8;const glow=ctx.createLinearGradient(tx,ty,x,y);glow.addColorStop(0,'#96dfff00');glow.addColorStop(.7,'#bda8ff88');glow.addColorStop(1,'#efffff');ctx.strokeStyle=glow;ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(tx,ty);ctx.quadraticCurveTo((tx+x)*.5,(ty+y)*.5+10,x,y);ctx.stroke();ctx.shadowColor='#b3ebff';ctx.shadowBlur=12;ctx.fillStyle='#f0fffd';ctx.beginPath();ctx.moveTo(x,y-6);ctx.lineTo(x+2,y-2);ctx.lineTo(x+6,y);ctx.lineTo(x+2,y+2);ctx.lineTo(x,y+6);ctx.lineTo(x-2,y+2);ctx.lineTo(x-6,y);ctx.lineTo(x-2,y-2);ctx.closePath();ctx.fill();ctx.restore();}
   ctx.restore();
  }
  draw(ctx,w,h){
   if(!this.enabled)return;
   ctx.save();
   for(const p of this.ghosts)this.drawPhrase(ctx,p,w,h,true);
   if(this.active)this.drawPhrase(ctx,this.active,w,h);
   for(const p of this.fragments){
    const u=p.age/p.life,x=p.x*w,y=p.y*h;ctx.save();ctx.translate(x,y);ctx.rotate(p.spin*p.age);ctx.globalAlpha=(1-u)*.48;ctx.fillStyle=`hsl(${p.hue},95%,82%)`;
    if(u<.3){ctx.font=p.font;ctx.textAlign='center';ctx.textBaseline='middle';ctx.scale(1-u*.8,1-u*.8);ctx.fillText(p.char,0,0);}else{const r=2.5*(1-u)+1;ctx.beginPath();ctx.moveTo(0,-r*2);ctx.lineTo(r*.4,-r*.4);ctx.lineTo(r*2,0);ctx.lineTo(r*.4,r*.4);ctx.lineTo(0,r*2);ctx.lineTo(-r*.4,r*.4);ctx.lineTo(-r*2,0);ctx.lineTo(-r*.4,-r*.4);ctx.closePath();ctx.fill();}ctx.restore();
   }
   ctx.restore();
  }
  get stats(){return{active:this.active?.text||null,profile:this.active?.kind||null,shape:this.active?.shape||null,rows:this.active?.rows.length||0,wordAnchors:this.active?.words.length||0,fragments:this.fragments.length,dissolves:this.dissolves,hits:this.hits,charge:this.charge,energy:this.energy,beat:this.beat,time:this.time,enabled:this.enabled};}
 }
 root.AstraTypography=AstraTypography;if(typeof module!=='undefined')module.exports=AstraTypography;
})(globalThis);
