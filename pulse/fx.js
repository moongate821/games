'use strict';
// Additive light layers. All motion uses the audio clock so pause freezes the show.
globalThis.PulseFX=(()=>{
  const canvas=document.createElement('canvas');canvas.id='fxCanvas';canvas.setAttribute('aria-hidden','true');
  function $(id){return document.getElementById(id);}
  $('playScreen').prepend(canvas);
  const p=canvas.getContext('2d'),palette=['#d6fa70','#ad9aff','#7ae3ff','#f3abff'];
  let session=null,analyser=null,spectrum=null,energy=0;
  const amount=prefs=>prefs.effects?Math.max(0,Math.min(1,Number(prefs.fxIntensity)/100)):0;
  function audio(app){
    if(!app.context||!app.musicGain)return;
    if(analyser?.context!==app.context){analyser=app.context.createAnalyser();analyser.fftSize=256;analyser.smoothingTimeConstant=.8;spectrum=new Uint8Array(analyser.frequencyBinCount);app.musicGain.connect(analyser);}
    analyser.getByteFrequencyData(spectrum);
    let sum=0;for(let i=1;i<25;i++)sum+=spectrum[i];
    energy=energy*.78+(sum/24/255)*.22;
  }
  function frame(app,prefs,t){
    const visible=app.screen==='play',power=amount(prefs);canvas.hidden=!visible||power===0;
    if(!visible){session=null;analyser=null;spectrum=null;energy=0;return;}
    if(session!==app.game){session=app.game;energy=0;}
    if(!power)return;
    const w=innerWidth,h=innerHeight,dpr=Math.min(devicePixelRatio||1,1.5);
    if(canvas.width!==Math.round(w*dpr)||canvas.height!==Math.round(h*dpr)){canvas.width=Math.round(w*dpr);canvas.height=Math.round(h*dpr);}
    p.setTransform(dpr,0,0,dpr,0,0);p.clearRect(0,0,w,h);
    if(app.state==='playing')audio(app);
    const progress=Math.max(0,t-2.5),beat=Math.max(.42,60/app.track.bpm),pulse=t>=2.5?Math.exp(-(progress%beat)/.15):0;
    const boost=Math.min(1,app.game.combo/100),brightness=power*(.35+energy*.7+boost*.2);
    p.save();p.globalCompositeOperation='lighter';
    // Large washes brighten the margins smoothly; no full-screen white strobe.
    for(let side=0;side<2;side++){
      const x=side?w:0,y=h*.65,r=Math.max(w*.35,h*.65),g=p.createRadialGradient(x,y,0,x,y,r);
      g.addColorStop(0,(side?'#ad9aff':'#d6fa70')+Math.round((.08+pulse*.16+energy*.1)*power*255).toString(16).padStart(2,'0'));
      g.addColorStop(1,'#00000000');p.fillStyle=g;p.fillRect(0,0,w,h);
    }
    // Orbiting laser ribbons and travelling luminous heads.
    for(let i=0;i<5;i++){
      const color=palette[i%4],phase=progress*(.12+i*.016)+i*1.7;
      p.globalAlpha=brightness*(.16+pulse*.16);p.strokeStyle=color;p.lineWidth=1+i%2;
      p.beginPath();p.moveTo(-w*.1,h*(.15+i*.15));p.bezierCurveTo(w*.2,h*(.4+Math.sin(phase)*.35),w*.75,h*(.3+Math.cos(phase*.7)*.5),w*1.1,h*(.2+i*.15));p.stroke();
      const u=(progress*.16+i*.23)%1,x=w*u,y=h*(.25+i*.13)+Math.sin(u*Math.PI*2+phase)*h*.07;
      const g=p.createLinearGradient(x-95,y+20,x,y);g.addColorStop(0,color+'00');g.addColorStop(1,color+'dd');p.globalAlpha=brightness*.65;p.strokeStyle=g;p.lineWidth=2;p.beginPath();p.moveTo(x-95,y+20);p.quadraticCurveTo(x-35,y+3,x,y);p.stroke();p.fillStyle=color;p.fillRect(x-1,y-1,3,3);
    }
    // Sound-reactive equalizer at the edges, leaving note lanes unobstructed.
    const bars=w<600?14:24;
    for(let side=0;side<2;side++)for(let i=0;i<bars;i++){
      const val=spectrum?spectrum[2+i*2]/255:.1,height=5+val*h*.12,x=side?w-12-i*8:9+i*8;
      p.globalAlpha=power*(.18+val*.38);p.fillStyle=palette[side];p.fillRect(x,h-height-10,3,height);
    }
    // Milestones sweep an expanding coloured arc around the entire stage.
    for(const burst of app.bursts){if(!burst.milestone)continue;const age=t-burst.time;if(age<0||age>1.2)continue;
      p.globalAlpha=(1-age/1.2)*power*.75;p.strokeStyle=burst.color;p.lineWidth=2;const r=40+age*Math.max(w,h)*.7;
      p.beginPath();p.ellipse(w/2,h*.7,r,r*.6,0,0,Math.PI*2);p.stroke();
    }
    p.restore();
  }
  function stage(c,w,h,line,lw,speed,time,visualTime,app,prefs){
    const power=amount(prefs);if(!power)return;
    c.save();c.globalCompositeOperation='lighter';
    // Note trails stretch upwards, thinning into the darkness.
    for(const note of app.game.notes){
      if(note.state==='done')continue;
      const y=note.state==='holding'?line:line-(note.time-visualTime)*speed;
      if(y< -15||y>line+30)continue;
      const x=(note.lane+.5)*lw,color=colors[note.lane],length=Math.min(line*.45,45+speed*.23),top=y-length;
      const trail=c.createLinearGradient(0,top,0,y);trail.addColorStop(0,color+'00');trail.addColorStop(.65,color+'18');trail.addColorStop(1,color+'88');
      c.globalAlpha=power*(note.state==='holding'?.85:.65);c.fillStyle=trail;c.beginPath();c.moveTo(x-lw*.3,y);c.lineTo(x-lw*.08,top);c.lineTo(x+lw*.08,top);c.lineTo(x+lw*.3,y);c.closePath();c.fill();
      c.globalAlpha=power*.5;c.strokeStyle=trail;c.lineWidth=1;c.beginPath();c.moveTo(x-lw*.36,top);c.lineTo(x-lw*.36,y);c.moveTo(x+lw*.36,top);c.lineTo(x+lw*.36,y);c.stroke();
    }
    // Hit pillars and sustained braided light on held notes.
    for(let lane=0;lane<app.lanes;lane++){
      const holding=app.game.notes.some(n=>n.lane===lane&&n.state==='holding'),age=time-app.flashes[lane];
      if(!holding&&(age<0||age>.45))continue;
      const x=(lane+.5)*lw,color=colors[lane],fade=holding?.7:Math.pow(1-age/.45,2);
      const beam=c.createLinearGradient(0,line,0,Math.max(0,line-260));beam.addColorStop(0,color+'cc');beam.addColorStop(.35,color+'33');beam.addColorStop(1,color+'00');c.globalAlpha=power*fade;c.fillStyle=beam;
      c.fillRect(x-lw*.34,Math.max(0,line-260),lw*.68,Math.min(260,line));
      c.strokeStyle=color;c.lineWidth=holding?1.4:2;c.beginPath();
      for(let y=line;y>Math.max(0,line-230);y-=6){const px=x+Math.sin((line-y)*.045+time*8+lane)*lw*.25;y===line?c.moveTo(px,y):c.lineTo(px,y);}c.stroke();
    }
    c.restore();
  }
  function hits(c,w,line,lw,t,bursts,prefs){
    const power=amount(prefs);if(!power)return;
    c.save();c.globalCompositeOperation='lighter';
    for(const b of bursts){const age=t-b.time;if(age<0||age>.9)continue;const k=age/.9,x=(b.lane+.5)*lw,fade=Math.pow(1-k,1.5);
      c.globalAlpha=power*fade;c.strokeStyle=b.color;c.fillStyle=b.color;
      for(let ring=0;ring<3;ring++){const r=5+k*(lw*1.3+ring*20);c.lineWidth=ring?1:2;c.beginPath();c.ellipse(x,line,r,r*.38,0,0,Math.PI*2);c.stroke();}
      // Short starburst and a long fading projectile tail for each spark.
      const count=w<500?12:20;
      for(let i=0;i<count;i++){const angle=i/count*Math.PI*2+b.seed*.41,v=30+(i*37%85),dx=Math.cos(angle)*v,dy=-Math.abs(Math.sin(angle))*v*1.8;
        const px=x+dx*k,py=line+dy*k+65*k*k,tail=Math.max(0,k-.12);
        c.lineWidth=i%3===0?2:1;c.beginPath();c.moveTo(x+dx*tail,line+dy*tail+65*tail*tail);c.lineTo(px,py);c.stroke();c.fillRect(px-1,py-1,2,2);
      }
      if(age<.16){const g=c.createRadialGradient(x,line,1,x,line,lw*.8);g.addColorStop(0,'#ffffffaa');g.addColorStop(.3,b.color+'77');g.addColorStop(1,b.color+'00');c.fillStyle=g;c.globalAlpha=power*(1-age/.16);c.fillRect(x-lw,line-lw,lw*2,lw*2);}
    }
    c.restore();
  }
  return {frame,stage,hits,amount};
})();
