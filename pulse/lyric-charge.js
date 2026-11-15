'use strict';
// Only completed chart judgments advance this chain; a HOLD head never counts twice.
globalThis.PulseLyricCharge=class {
  constructor(){this.reset();}
  reset(){this.streak=0;this.level=0;this.grade='';this.lastHit=-Infinity;this.lastUpgrade=-Infinity;this.hitPower=0;}
  judge(grade,time,head=false){
    if(head)return false;
    this.grade=grade;
    if(grade==='perfect'){
      const previous=this.level;this.streak++;
      this.level=this.streak>=32?6:this.streak>=16?5:this.streak>=8?4:this.streak>=3?3:2;
      if(this.level>previous&&this.level>=3)this.lastUpgrade=time;
      this.lastHit=time;this.hitPower=1;
    }else if(grade==='great'){
      this.streak=0;this.level=1;this.lastHit=time;this.hitPower=.55;
    }else {this.streak=0;this.level=0;this.hitPower=0;}
    return grade==='perfect'||grade==='great';
  }
  pulse(time){return Math.exp(-Math.max(0,time-this.lastHit)/.22)*this.hitPower;}
};

globalThis.PulseLyricGlow=class {
  constructor(panel){
    this.panel=panel;this.charge=new PulseLyricCharge();this.session=null;this.charges=[];this.cursor=0;this.pending=[];this.particles=[];this.sequence=0;
    this.badge=document.createElement('span');this.badge.id='lyricChargeBadge';this.badge.className='lyric-charge-badge';
    panel.querySelector('.lyric-meta').insertBefore(this.badge,panel.querySelector('.lyric-controls'));
    this.canvas=document.createElement('canvas');this.canvas.className='lyric-charge-particles';this.canvas.setAttribute('aria-hidden','true');panel.append(this.canvas);this.ctx=this.canvas.getContext('2d');
    window.addEventListener('pulse:judgment',e=>{
      const hit=e.detail;if(!hit?.session)return;this.bind(hit.session);
      const success=this.charge.judge(hit.grade,hit.time,hit.head);
      if(!success||hit.head)return;
      this.pending.push({...hit,level:this.charge.level});this.pending=this.pending.slice(-16);
    });
  }
  bind(session){
    if(this.session===session)return;
    this.session=session;this.charge.reset();this.pending=[];this.particles=[];this.sequence=0;this.resetLine();
  }
  resetLine(){this.charges=[];this.cursor=0;}
  render({session,now,progress,glyphs,settings,prefs,beat=.5,songTime=now}){
    this.bind(session);
    const power=prefs.effects?Math.max(0,Math.min(1,prefs.fxIntensity/100)):0;
    const level=this.charge.level,pulse=settings.motion?this.charge.pulse(now)*power:0;
    this.panel.dataset.charge=String(power>0?level:0);
    this.panel.dataset.lyricColor=settings.color;
    this.panel.dataset.prism=String(settings.color==='auto'&&level>=3&&power>0);
    this.panel.style.setProperty('--charge-power',(level/6*power).toFixed(3));
    this.panel.style.setProperty('--judge-pulse',pulse.toFixed(3));
    const upgrade=settings.motion?Math.exp(-Math.max(0,now-this.charge.lastUpgrade)/.4)*power:0;
    this.panel.style.setProperty('--upgrade-pulse',upgrade.toFixed(3));
    this.badge.textContent=level>=2?`PERFECT ×${this.charge.streak} / ${level===6?'MAX':'光 Lv'+level}`:level===1?'GREAT / 光 Lv1':'光 Lv0 / READY';
    this.badge.dataset.grade=this.charge.grade;
    const bounds=this.panel.getBoundingClientRect();
    for(const hit of this.pending){
      if(!glyphs.length||now-hit.time>.8)continue;
      this.cursor=Math.min(glyphs.length-1,Math.max(this.cursor,Math.floor(progress*glyphs.length)));
      const count=hit.grade==='great'?1:hit.level>=4?3:2;
      const target=Math.min(glyphs.length-1,this.cursor);
      for(let j=0;j<count;j++){
        const index=Math.min(glyphs.length-1,this.cursor+j);
        this.charges[index]=Math.max(this.charges[index]||0,hit.level);
      }
      this.cursor=Math.min(glyphs.length,this.cursor+count);
      if(!settings.motion||power===0||hit.level<2)continue;
      const rect=glyphs[target].getBoundingClientRect(),x=rect.x+rect.width*.5-bounds.x,y=rect.y+rect.height*.65-bounds.y;
      const sparks=hit.level>=5?24:hit.level>=3?14:5;
      for(let j=0;j<sparks;j++){
        const angle=(j/sparks)*Math.PI*2+this.sequence*.71,speed=22+(j*17%55)+hit.level*6;
        this.particles.push({x,y,vx:Math.cos(angle)*speed,vy:Math.sin(angle)*speed*.7-30,time:hit.time,color:hit.level>=3?['#ff78a8','#ffb66e','#ffe985','#a8ff88','#78f3e4','#85b9ff','#c49aff'][j%7]:hit.grade==='perfect'?'#e9ffb5':'#c2b1ff',life:.65+hit.level*.06});
      }
      this.sequence++;
    }
    this.pending=[];this.particles=this.particles.filter(p=>now-p.time<p.life).slice(-96);
    glyphs.forEach((glyph,i)=>{
      const charge=this.charges[i]||0;
      glyph.classList.toggle('charged',charge>0);
      glyph.style.setProperty('--glyph-charge',(Math.min(charge,level)/6*power).toFixed(3));
      const rainbow=['#ff86bb','#ffc07c','#fff08c','#b1ff95','#88fff1','#92c0ff','#caa3ff'];
      glyph.style.setProperty('--glyph-tint',rainbow[(i+Math.floor(Math.max(0,songTime)/beat))%7]);
    });
    this.canvas.hidden=!settings.motion||power===0;
    if(this.canvas.hidden){this.particles=[];return;}
    const w=this.panel.clientWidth,h=this.panel.clientHeight,dpr=Math.min(1.5,devicePixelRatio||1),c=this.ctx;
    if(this.canvas.width!==Math.round(w*dpr)||this.canvas.height!==Math.round(h*dpr)){this.canvas.width=Math.round(w*dpr);this.canvas.height=Math.round(h*dpr);}
    c.setTransform(dpr,0,0,dpr,0,0);c.clearRect(0,0,w,h);c.save();c.globalCompositeOperation='lighter';
    for(const p of this.particles){const age=Math.max(0,now-p.time),fade=1-age/p.life,x=p.x+p.vx*age,y=p.y+p.vy*age+22*age*age;
      c.globalAlpha=fade*power;c.strokeStyle=p.color;c.fillStyle=p.color;c.lineWidth=1;
      c.beginPath();c.moveTo(x-p.vx*.055,y-p.vy*.055);c.lineTo(x,y);c.stroke();c.fillRect(x-1,y-1,2,2);
    }
    // Higher chains leave a wide travelling light ribbon behind the words.
    if(level>=4){const x=(now*.4%1)*(w+140)-70,g=c.createLinearGradient(x-65,0,x+65,0);g.addColorStop(0,'#c2b1ff00');g.addColorStop(.5,'#dcff8333');g.addColorStop(1,'#8ee9f400');c.globalAlpha=power*(.2+pulse*.5);c.fillStyle=g;c.fillRect(x-65,h*.32,130,h*.4);}
    if(level>=3){
      const rainbow=['#ff78a8','#ffb66e','#ffe985','#a8ff88','#78f3e4','#85b9ff','#c49aff'],density=w<500?16:32;
      // Rainbow embers continually rise from the words; higher tiers add stars and tails.
      for(let i=0;i<density;i++){
        const phase=(now*(.3+i%3*.08)+i*.618)%1,x=(i+.5)/density*w+Math.sin(now*1.3+i)*14,y=h*.91-phase*h*.78;
        c.globalAlpha=Math.sin(phase*Math.PI)*power*(.25+level*.065);c.strokeStyle=rainbow[i%7];c.fillStyle=rainbow[i%7];
        c.lineWidth=1;c.beginPath();c.moveTo(x-3,y+8);c.quadraticCurveTo(x+Math.sin(now*3+i)*5,y+4,x,y);c.stroke();
        if(level>=5&&i%3===0){const r=2+pulse*1.5;c.beginPath();c.moveTo(x-r,y);c.lineTo(x+r,y);c.moveTo(x,y-r);c.lineTo(x,y+r);c.stroke();}else c.fillRect(x,y,1.5,1.5);
      }
      // Coloured elliptical light orbits sit behind the text rather than over the lanes.
      for(let ring=0;ring<(level>=5?3:1);ring++){
        c.globalAlpha=power*(.09+pulse*.13+upgrade*.2);c.strokeStyle=rainbow[(ring+Math.floor(now/beat))%7];c.lineWidth=1;
        c.beginPath();c.ellipse(w/2,h*.56,w*(.25+ring*.07),h*(.25+ring*.05),Math.sin(now*.7+ring)*.07,0,Math.PI*2);c.stroke();
      }
      if(level>=5){
        // Branching lightning crawls along the top and bottom of the lyric panel.
        for(let edge=0;edge<2;edge++){
          c.globalAlpha=power*(.16+pulse*.35);c.strokeStyle=rainbow[(edge*3+Math.floor(now/beat))%7];c.lineWidth=1;c.beginPath();
          for(let i=0;i<=24;i++){const x=i/24*w,y=(edge?h-8:8)+Math.sin(i*2.7+now*8)*(3+pulse*5);i?c.lineTo(x,y):c.moveTo(x,y);}c.stroke();
        }
      }
      if(upgrade>.01){
        const age=Math.max(0,now-this.charge.lastUpgrade);
        for(let i=0;i<28;i++){const angle=i/28*Math.PI*2+now*.2,r=18+age*150,x=w/2+Math.cos(angle)*r*2,y=h*.55+Math.sin(angle)*r*.45;
          c.globalAlpha=upgrade*.7;c.strokeStyle=rainbow[i%7];c.lineWidth=i%3?1:2;c.beginPath();c.moveTo(x,y);c.lineTo(x+Math.cos(angle)*24,y+Math.sin(angle)*10);c.stroke();}
      }
    }
    c.restore();
  }
};
