// Screen-space spell effects for both board views. The board remains clickable.
const COLORS={k:'#ffe594',q:'#ff763d',r:'#dcecff',b:'#b787ff',n:'#80f3d3',p:'#a5e9ff'};
let canvas,ctx,effects=[],active=false;

export function initFantasyFx(){
  if(canvas)return;
  canvas=document.createElement('canvas');canvas.className='fantasy-fx';canvas.setAttribute('aria-hidden','true');document.body.append(canvas);
  ctx=canvas.getContext('2d');
  const resize=()=>{const scale=Math.min(devicePixelRatio||1,2);canvas.width=document.documentElement.clientWidth*scale;canvas.height=innerHeight*scale;ctx.setTransform(scale,0,0,scale,0,0);};
  resize();addEventListener('resize',resize);
}
export function clearFantasyFx(){effects=[];if(ctx)ctx.clearRect(0,0,innerWidth,innerHeight);}
function center(el){const r=el.getBoundingClientRect();return{x:(r.left+r.right)/2,y:(r.top+r.bottom)/2,r:Math.max(14,Math.min(r.width,r.height)/2)};}
function add(duration,draw){effects.push({start:performance.now(),duration,draw});if(!active)requestAnimationFrame(frame);}
function frame(time){
  active=true;ctx.clearRect(0,0,innerWidth,innerHeight);
  effects=effects.filter(effect=>time<effect.start+effect.duration);
  for(const effect of effects)effect.draw(Math.max(0,Math.min(1,(time-effect.start)/effect.duration)));
  if(effects.length)requestAnimationFrame(frame);else active=false;
}
function ring(p,r,color,alpha,width=3){ctx.save();ctx.strokeStyle=color;ctx.globalAlpha=Math.max(0,alpha);ctx.lineWidth=width;ctx.shadowColor=color;ctx.shadowBlur=18;ctx.beginPath();ctx.arc(p.x,p.y,r,0,Math.PI*2);ctx.stroke();ctx.restore();}
function beam(a,b,color,alpha,width=3){ctx.save();ctx.strokeStyle=color;ctx.globalAlpha=Math.max(0,alpha);ctx.lineWidth=width;ctx.lineCap='round';ctx.shadowColor=color;ctx.shadowBlur=22;ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.stroke();ctx.restore();}
function sigil(p,color,alpha,spin=0){
  ctx.save();ctx.translate(p.x,p.y);ctx.rotate(spin);ctx.globalAlpha=Math.max(0,alpha);ctx.strokeStyle=color;ctx.lineWidth=2;ctx.shadowColor=color;ctx.shadowBlur=15;
  for(const radius of [p.r*.7,p.r*1.15]){ctx.beginPath();ctx.arc(0,0,radius,0,Math.PI*2);ctx.stroke();}
  for(let i=0;i<6;i++){const angle=i*Math.PI/3;ctx.beginPath();ctx.moveTo(Math.cos(angle)*p.r*.7,Math.sin(angle)*p.r*.7);ctx.lineTo(Math.cos(angle)*p.r*1.15,Math.sin(angle)*p.r*1.15);ctx.stroke();}
  ctx.restore();
}

export function playFantasyFx(info,fromEl,toEl,splashEls=[]){
  if(!canvas||!fromEl||!toEl)return;
  const a=center(fromEl),b=center(toEl),kind=info.attacker.toLowerCase(),color=COLORS[kind];
  if(info.spell==='summon'){
    add(1300,k=>{sigil(b,'#81ffe4',1-k,k*Math.PI*2);ring(b,b.r*(.3+k*1.6),'#c8fff3',1-k,4);});
    return;
  }
  if(info.spell==='fire'){
    add(1250,k=>{
      const progress=Math.min(1,k*2.3),point={x:a.x+(b.x-a.x)*progress,y:a.y+(b.y-a.y)*progress};
      beam(a,point,'#ff6b28',1-k,9);beam(a,point,'#ffe390',1-k,3);
      if(k>.3){ring(b,b.r*(k-.3)*2.8,'#ff9e39',1-k,7);sigil(b,'#ff5128',(1-k)*.8,k);}
      for(const el of splashEls){if(!el)return;const p=center(el);ring(p,p.r*(.2+k), '#ffad6b',1-k,3);}
    });
    return;
  }
  if(info.attack){
    add(1000,k=>{
      const progress=Math.min(1,k*2.4),point={x:a.x+(b.x-a.x)*progress,y:a.y+(b.y-a.y)*progress};
      if(kind==='r'){
        beam(a,point,color,1-k,5);beam({x:a.x-8,y:a.y+8},{x:point.x+8,y:point.y-8},'#ffffff',1-k,2);
      }else if(kind==='b'||kind==='n'){
        sigil(a,color,1-k,k*3);beam(a,point,color,1-k,4);
      }else if(kind==='p'){
        for(const offset of [-7,7])beam({x:a.x+offset,y:a.y},{x:point.x+offset*.3,y:point.y},color,1-k,2);
      }else{
        ring(a,a.r*(.4+k),color,1-k,4);beam(a,point,color,1-k,kind==='q'?7:4);
      }
      if(k>.3)ring(b,b.r*(k-.3)*1.5,info.sink?'#ff7565':'#bcd9ff',1-k,info.sink?6:3);
    });
  }else{
    add(info.circle?1050:550,k=>{
      beam(a,{x:a.x+(b.x-a.x)*k,y:a.y+(b.y-a.y)*k},color,(1-k)*.6,2);
      if(info.circle){sigil(b,'#8affd4',1-k,k*2);ring(b,b.r*(.4+k),'#c9ffe9',1-k,3);}
    });
  }
}
