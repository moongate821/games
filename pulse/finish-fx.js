'use strict';
(()=>{
  const themes={
    full:{title:'CONGRATULATIONS!',label:'FULL COMBO / NO MISS',colors:['#ff8bd5','#c6a5ff','#8aeaff','#dcff83','#ffdb83','#ffffff'],power:3},
    great:{title:'GREAT SESSION',label:'ACCURACY 90%+',colors:['#ffd783','#c5a3ff','#fff1bd'],power:2},
    nice:{title:'NICE SESSION',label:'ACCURACY 80%+',colors:['#8beaff','#d9ff91','#b5e2ff'],power:1}
  };
  function tier({notes,judged,miss,accuracy}){
    if(!Number.isFinite(notes)||notes<=0||judged!==notes)return 'none';
    if(miss===0)return 'full';
    if(accuracy>=90)return 'great';
    if(accuracy>=80)return 'nice';
    return 'none';
  }
  const result=document.getElementById('resultScreen'),banner=document.createElement('section');
  banner.id='finishCelebration';banner.className='finish-celebration';banner.hidden=true;banner.setAttribute('aria-label','演奏終了のお祝い');
  banner.innerHTML='<p id="finishDemo" class="finish-demo"></p><h2 id="finishTitle"></h2><p id="finishLabel" class="finish-label"></p>';
  result.insertBefore(banner,result.querySelector('.result-heading'));
  const canvas=document.createElement('canvas');canvas.id='finishCanvas';canvas.setAttribute('aria-hidden','true');canvas.className='finish-canvas';result.prepend(canvas);
  const ctx=canvas.getContext('2d');let frameId=0,generation=0,particles=[],bursts=[],width=0,height=0,started=0,theme=null,power=0;
  const reduced=()=>matchMedia('(prefers-reduced-motion: reduce)').matches;
  function stop(){cancelAnimationFrame(frameId);frameId=0;particles=[];bursts=[];canvas.dataset.particles='0';ctx.clearRect(0,0,canvas.width,canvas.height);}
  function size(){const rect=result.getBoundingClientRect(),dpr=Math.min(1.5,devicePixelRatio||1);width=rect.width;height=rect.height;canvas.width=Math.round(width*dpr);canvas.height=Math.round(height*dpr);ctx.setTransform(dpr,0,0,dpr,0,0);}
  function launch(x,y,amount,time,random){
    for(let i=0;i<amount;i++){
      const angle=i/amount*Math.PI*2+random()*.2,speed=45+random()*(110+theme.power*40);
      particles.push({x:x*width,y,vx:Math.cos(angle)*speed,vy:Math.sin(angle)*speed-35,life:1.3+random()*1.6,born:time,color:theme.colors[i%theme.colors.length],radius:.8+random()*2.1,spin:random()*Math.PI,star:i%9===0,shard:i%7===0});
    }
  }
  function start(detail){
    stop();generation++;const level=tier(detail);result.dataset.finishTier=level;banner.hidden=level==='none';canvas.hidden=level==='none';
    if(level==='none')return;
    theme=themes[level];document.getElementById('finishTitle').textContent=theme.title;document.getElementById('finishLabel').textContent=theme.label;
    document.getElementById('finishDemo').textContent=detail.auto?'AUTO DEMO / オート観賞・記録なし':'';
    power=Math.max(0,Math.min(1,Number(preferences.fxIntensity)/100));const animate=preferences.effects&&!reduced()&&power>0;
    banner.classList.remove('finish-enter');if(animate){void banner.offsetWidth;banner.classList.add('finish-enter');}
    if(!animate)return;
    size();started=performance.now();let seed=314159+generation*711,last=0;
    const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
    const count=level==='full'?7:level==='great'?4:2;
    const centerY=banner.offsetTop+banner.offsetHeight*.52;
    bursts=Array.from({length:count},(_,i)=>({at:i*(level==='full'?.44:.6),x:i===0?.5:.15+random()*.7,y:centerY+(random()-.5)*95,done:false,count:Math.round((level==='full'?(i===0?150:78):i===0?80:40)*power)}));
    const token=generation;
    function frame(now){
      if(token!==generation||app.screen!=='result'){stop();return;}
      if(!preferences.effects||reduced()){stop();banner.classList.remove('finish-enter');return;}
      const t=(now-started)/1000,dt=Math.min(.05,Math.max(0,t-last));last=t;ctx.clearRect(0,0,width,height);
      for(const b of bursts)if(!b.done&&t>=b.at){b.done=true;launch(b.x,b.y,b.count,t,random);}
      ctx.save();ctx.globalCompositeOperation='lighter';
      if(level==='full'&&t<3.5){
        const flare=Math.sin(Math.min(1,t/3.5)*Math.PI)*power,glow=ctx.createRadialGradient(width/2,centerY,5,width/2,centerY,width*.48);
        glow.addColorStop(0,'#dcafff28');glow.addColorStop(.5,'#8adfff12');glow.addColorStop(1,'transparent');ctx.globalAlpha=flare;ctx.fillStyle=glow;ctx.fillRect(0,centerY-width*.48,width,width*.96);
        for(let i=0;i<9;i++){const angle=i/9*Math.PI*2+t*.12,x=width/2+Math.cos(angle)*(70+t*40),y=centerY+Math.sin(angle)*(35+t*15),r=3+Math.sin(i+1)*2+flare*3;
          ctx.globalAlpha=flare*.8;ctx.fillStyle=theme.colors[i%6];ctx.shadowColor=theme.colors[i%6];ctx.shadowBlur=12;ctx.beginPath();ctx.moveTo(x,y-r*2);ctx.lineTo(x+r,y);ctx.lineTo(x,y+r*2);ctx.lineTo(x-r,y);ctx.closePath();ctx.fill();
        }ctx.shadowBlur=0;
      }
      // Large expanding rainbow shockwaves, with no full-screen flash.
      for(let i=0;i<theme.power*2;i++){
        const age=t-i*.22;if(age<0||age>2.6)continue;
        ctx.globalAlpha=Math.max(0,1-age/2.6)*.48*power;ctx.strokeStyle=theme.colors[i%theme.colors.length];ctx.lineWidth=1.5;
        ctx.beginPath();ctx.ellipse(width/2,centerY,15+age*width*.48,8+age*70,Math.sin(i)*.23,0,Math.PI*2);ctx.stroke();
      }
      // Twin fountains travel up the outside edges, clear of the result text.
      if(t<3.8)for(let side=0;side<2;side++)for(let i=0;i<theme.power*7;i++){
        const phase=(t*.7+i*.137)%1,x=(side?width-12:12)+(side?-1:1)*Math.sin(phase*Math.PI)*24,y=height-80-phase*(height-90);
        ctx.globalAlpha=Math.sin(phase*Math.PI)*.6*power;ctx.strokeStyle=theme.colors[(i+side)%theme.colors.length];ctx.lineWidth=1+i%2;
        ctx.beginPath();ctx.moveTo(x,y+15);ctx.quadraticCurveTo(x+(side?-9:9),y+5,x,y);ctx.stroke();
      }
      particles=particles.filter(p=>t-p.born<p.life);
      for(const p of particles){
        const age=t-p.born,fade=Math.sin(Math.min(1,age/p.life)*Math.PI);p.x+=p.vx*dt;p.y+=p.vy*dt;p.vy+=48*dt;
        ctx.globalAlpha=fade*.85;ctx.strokeStyle=p.color;ctx.fillStyle=p.color;ctx.lineWidth=p.radius*.6;
        ctx.beginPath();ctx.moveTo(p.x-p.vx*.035,p.y-p.vy*.035);ctx.lineTo(p.x,p.y);ctx.stroke();
        if(p.star){const r=p.radius*2.8;ctx.beginPath();ctx.moveTo(p.x-r,p.y);ctx.lineTo(p.x+r,p.y);ctx.moveTo(p.x,p.y-r);ctx.lineTo(p.x,p.y+r);ctx.stroke();}
        else if(p.shard){ctx.save();ctx.translate(p.x,p.y);ctx.rotate(p.spin+age);ctx.fillRect(-p.radius,-p.radius*.4,p.radius*3,p.radius);ctx.restore();}
        else {ctx.beginPath();ctx.arc(p.x,p.y,p.radius,0,Math.PI*2);ctx.fill();}
      }
      // A few long bright comets finish the full-combo crescendo.
      if(level==='full'&&t<3.4)for(let i=0;i<5;i++){
        const phase=(t*.52+i*.21)%1,x=width*(phase*1.4-.2),y=centerY-65+Math.sin(phase*Math.PI)*125+i*9;
        ctx.globalAlpha=Math.sin(phase*Math.PI)*.7*power;const trail=ctx.createLinearGradient(x-90,y+24,x,y);trail.addColorStop(0,'transparent');trail.addColorStop(1,theme.colors[i%6]);ctx.strokeStyle=trail;ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(x-90,y+24);ctx.quadraticCurveTo(x-35,y+18,x,y);ctx.stroke();
      }
      ctx.restore();canvas.dataset.particles=String(particles.length);
      if(t<6.2)frameId=requestAnimationFrame(frame);else{stop();canvas.dataset.particles='0';}
    }
    frameId=requestAnimationFrame(frame);
  }
  window.PulseFinishFX={tier,start,stop};window.addEventListener('pulse:finish',event=>start(event.detail));
  window.addEventListener('resize',()=>{if(frameId)size();});
})();
