/* Presentation-only arrival paths. Every note settles before the earliest valid tap. */
(function(root){
 'use strict';
 const APPROACH=1.65,SETTLE=.30,SIZES=Object.freeze([.82,1,1.18,1.36]);
 const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
 function radius(n,base){return clamp(base*SIZES[n.id%4],22,48);}
 function sample(n,time,w,h,enabled=true){
  const target={x:n.x*w,y:n.y*h},delta=n.time-time;
  const u=clamp((APPROACH-delta)/(APPROACH-SETTLE),0,1),kind=['comet','spiral','swoop'][n.id%3];
  if(!enabled)return {...target,angle:0,progress:1,arrived:true,kind};
  const turn=(n.id%2?1:-1),fade=(1-u)**2,ease=1-fade;
  if(delta<=SETTLE)return {...target,angle:time*2.4+turn*Math.PI*3,progress:1,arrived:true,kind};
  const reach=Math.min(w,h)*.20,startX=clamp(target.x+turn*reach,24,w-24),startY=-36;
  let x=startX+(target.x-startX)*ease,y=startY+(target.y-startY)*ease;
  if(kind==='spiral'){const a=u*Math.PI*4*turn;x+=Math.sin(a)*reach*fade;y+=(Math.cos(a)-1)*reach*.22*fade;}
  if(kind==='swoop'){x+=Math.sin(u*Math.PI)*reach*turn*fade;y-=Math.sin(u*Math.PI)*reach*.22*fade;}
  return {x,y,angle:time*2.4+turn*(1-fade)*Math.PI*3,progress:u,arrived:delta<=SETTLE,kind};
 }
 const api=Object.freeze({APPROACH,SETTLE,SIZES,radius,sample});
 root.AstraNoteMotion=api;if(typeof module!=='undefined')module.exports=api;
})(globalThis);
