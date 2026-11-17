/* Original kinetic typography. Line times are estimated ASR alignment;
   glyph entrance delays are visual choreography, not word-level transcription. */
(function(root){
 'use strict';
 const clamp=(x,a,b)=>Math.max(a,Math.min(b,x)),ease=x=>1-(1-clamp(x,0,1))**3;
 function hash(text){let n=2166136261;for(const c of text)n=Math.imul(n^c.codePointAt(0),16777619);return n>>>0;}
 function groups(text){
  const words=text.trim().split(/\s+/).filter(Boolean),rows=[];
  for(const word of words){const chars=Array.from(word);while(chars.length)rows.push(chars.splice(0,9).join(''));}
  if(rows.length===1&&Array.from(rows[0]).length>6){const cs=Array.from(rows[0]),m=Math.ceil(cs.length/2);return[cs.slice(0,m).join(''),cs.slice(m).join('')];}
  if(rows.length>3){const cs=Array.from(words.join('')),size=Math.ceil(cs.length/3);return[cs.slice(0,size).join(''),cs.slice(size,size*2).join(''),cs.slice(size*2).join('')].filter(Boolean);}
  return rows;
 }
 function profile(track,energy){
  const genre=track.genre||'',bpm=track.bpm||140;
  if(/ボカロ|グリッチ|ハード|ロック|ユーロ/.test(genre)&&energy>.36)return'pulse';
  if(bpm<135||/ピアノ|ノルディック|ソウル/.test(genre))return'float';
  return energy>.64?'pulse':'orbit';
 }
 class AstraTypography{
  constructor(){this.reset();}
  reset(){this.active=null;this.ghosts=[];this.fragments=[];this.time=0;this.lastTime=null;this.charge=0;this.energy=0;this.beat=0;this.lastPositions=[];this.dissolves=0;this.hits=0;this.enabled=true;this.streak=0;}
  clear(){this.active=null;this.ghosts=[];this.fragments=[];this.lastPositions=[];this.lastTime=null;this.charge=0;this.beat=0;}
  create(line,track,energy){
   const seed=hash(track.id+':'+line.time+':'+line.text),kind=profile(track,energy);
   return{key:line.time+':'+line.text,text:line.text,start:line.time,end:line.end,rows:groups(line.text),kind,seed,angle:(seed%2?1:-1)*(kind==='float'?.065:.13),hue:kind==='pulse'?275:kind==='float'?185:215,fade:0};
  }
  shatter(phrase){
   const positions=this.lastPositions.length?this.lastPositions:Array.from(phrase.text).filter(c=>c.trim()).map((char,i)=>({char,x:.18+(i%9)*.07,y:.42+Math.floor(i/9)*.1,size:36,font:'36px serif'}));
   positions.slice(0,48).forEach((g,i)=>{const a=i*2.39996;this.fragments.push({...g,age:0,life:1.05+(i%4)*.13,vx:Math.cos(a)*.08+.04,vy:-.09-Math.sin(a)*.07,spin:(i%2?1:-1)*(.2+i%3),hue:phrase.hue+i*13});});
   if(this.fragments.length>144)this.fragments.splice(0,this.fragments.length-144);this.dissolves++;
  }
  hit(value){if(!this.enabled||!['PERFECT','GREAT','GOOD'].includes(value))return;this.hits++;this.charge=Math.min(1,this.charge+(value==='PERFECT'?.85:value==='GREAT'?.4:.16));}
  update(dt,{enabled,songTime,line,track,energy=0,beat=0,streak=0}){
   this.enabled=enabled;if(!enabled){this.clear();return;}
   if(dt<=0)return;
   const seeking=this.lastTime!==null&&(songTime<this.lastTime-.08||Math.abs(songTime-this.lastTime)>1.0);
   if(seeking){this.active=null;this.ghosts=[];this.fragments=[];this.lastPositions=[];}
   this.lastTime=songTime;this.time=songTime;this.streak=streak;
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
   const rows=p.rows,count=rows.length,size=Math.min(w*.18,h*.16,94),baseY=count===1?.45:.38-Math.max(0,count-2)*.04,result=[];
   rows.forEach((row,j)=>{
    const chars=Array.from(row),weights=chars.map(c=>c.codePointAt(0)<128?.52:1),total=weights.reduce((a,b)=>a+b,0),fontSize=Math.min(size*(j===count-1?1.17:1),w*.87/(total+.18)),step=fontSize/w;
    let cursor=.5-total*step/2;
    const weight=p.kind==='pulse'?'700':'400',font=p.kind==='float'||(p.kind==='orbit'&&j%2===0)?'"Yu Mincho","Hiragino Mincho ProN",serif':'"Yu Gothic UI","Hiragino Sans",sans-serif';
    chars.forEach((char,i)=>{const advance=weights[i]*step;result.push({char,x:cursor+advance/2,y:baseY+j*size*1.22/h,size:fontSize,font:weight+' '+fontSize+'px '+font,fontFamily:font,weight,index:result.length,row:j,rowIndex:i});cursor+=advance;});
   });return result;
  }
  drawPhrase(ctx,p,w,h,ghost=false){
   const age=this.time-p.start,duration=Math.max(.2,p.end-p.start),progress=clamp(age/duration,0,1),positions=this.glyphs(p,w,h);
   if(!ghost)this.lastPositions=[];
   const first=positions[0],angle=p.angle*(p.kind==='float'?.6:1),intensity=Math.min(.56,.32+this.energy*.08+this.charge*.12+Math.min(this.streak,32)*.0018);
   ctx.save();ctx.translate(w*.5,h*.48);ctx.rotate(angle);ctx.translate(-w*.5,-h*.48);
   // Fine geometric accents give the phrase a visual rhythm while preserving space around notes.
   ctx.globalAlpha=(ghost?1-p.fade/.75:Math.min(1,age*4))*intensity*.65;ctx.strokeStyle=`hsl(${p.hue+40},85%,75%)`;ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(w*.15,h*(first?.y||.4)+Math.min(w*.18,h*.16)*.75);ctx.lineTo(w*(.25+.6*ease(age*2)),h*(first?.y||.4)+Math.min(w*.18,h*.16)*.75);ctx.stroke();
   for(const g of positions){
    const entrance=ease((age-g.row*.10-g.rowIndex*.022)/.42),exit=ghost?1-p.fade/.75:1;
    const y=g.y*h+(1-entrance)*(p.kind==='pulse'?30:18)+progress*h*.045+(ghost?p.fade*h*.1:0),x=g.x*w;
    const pulse=1+this.beat*(p.kind==='float'?.035:.085)+this.charge*.035;
    if(!ghost){const dx=x-w*.5,dy=y-h*.48;this.lastPositions.push({...g,x:(w*.5+Math.cos(angle)*dx-Math.sin(angle)*dy)/w,y:(h*.48+Math.sin(angle)*dx+Math.cos(angle)*dy)/h});}
    const hue=p.hue+g.row*58+(p.kind==='pulse'?g.rowIndex*5:0)+Math.min(this.streak,32);
    ctx.save();ctx.translate(x,y);if(p.kind==='pulse')ctx.rotate(Math.sin(this.time*2+g.index)*.012*this.beat);ctx.scale(pulse*entrance,pulse*entrance);
    ctx.font=g.font;ctx.textAlign='center';ctx.textBaseline='middle';ctx.globalAlpha=clamp(entrance*exit*intensity,0,1);ctx.fillStyle=`hsl(${hue},90%,80%)`;ctx.shadowColor=`hsl(${hue},100%,70%)`;ctx.shadowBlur=this.charge>0?12:5;
    if(p.kind==='pulse'&&this.beat>.3){ctx.save();ctx.globalAlpha*=.24;ctx.fillText(g.char,-4,2);ctx.fillText(g.char,4,-2);ctx.restore();}
    ctx.fillText(g.char,0,0);ctx.restore();
   }
   ctx.restore();
  }
  draw(ctx,w,h){
   if(!this.enabled)return;
   ctx.save();
   for(const p of this.ghosts)this.drawPhrase(ctx,p,w,h,true);
   if(this.active)this.drawPhrase(ctx,this.active,w,h);
   for(const p of this.fragments){
    const u=p.age/p.life,x=p.x*w,y=p.y*h;ctx.save();ctx.translate(x,y);ctx.rotate(p.spin*p.age);ctx.globalAlpha=(1-u)*.65;ctx.fillStyle=`hsl(${p.hue},95%,82%)`;
    if(u<.52){ctx.font=p.font;ctx.textAlign='center';ctx.textBaseline='middle';ctx.scale(1-u*.8,1-u*.8);ctx.fillText(p.char,0,0);}else{const r=2.5*(1-u)+1;ctx.beginPath();ctx.moveTo(0,-r*2);ctx.lineTo(r*.4,-r*.4);ctx.lineTo(r*2,0);ctx.lineTo(r*.4,r*.4);ctx.lineTo(0,r*2);ctx.lineTo(-r*.4,r*.4);ctx.lineTo(-r*2,0);ctx.lineTo(-r*.4,-r*.4);ctx.closePath();ctx.fill();}ctx.restore();
   }
   ctx.restore();
  }
  get stats(){return{active:this.active?.text||null,profile:this.active?.kind||null,rows:this.active?.rows.length||0,fragments:this.fragments.length,dissolves:this.dissolves,hits:this.hits,charge:this.charge,energy:this.energy,beat:this.beat,time:this.time,enabled:this.enabled};}
 }
 root.AstraTypography=AstraTypography;if(typeof module!=='undefined')module.exports=AstraTypography;
})(globalThis);
