'use strict';
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.RokujoDeck=api;})(globalThis,()=>{
 const areas={
  main:{floor:[[398,481],[578,350],[985,388],[1355,411],[1451,465],[1360,521],[1180,585],[1010,587],[470,532]],blocks:[[[611,504],[651,386],[923,430],[882,542]],[[495,434],[574,434],[579,471],[500,474]],[[1062,490],[1147,490],[1155,530],[1063,530]],[[1228,472],[1311,472],[1315,530],[1226,529]],[[1205,396],[1296,396],[1298,438],[1200,436]]]},
  stern:{floor:[[76,250],[282,211],[464,260],[453,300],[282,353],[95,300]],blocks:[[[101,222],[259,206],[285,249],[228,292],[107,272]],[[306,258],[371,258],[373,307],[309,308]]]},
  cabin:{floor:[[96,330],[1548,330],[1580,792],[1040,792],[1010,846],[680,846],[660,792],[104,792]],blocks:[[[90,330],[425,330],[362,579],[282,720],[104,765]],[[1103,330],[1518,330],[1518,530],[1103,530]]]}
 };
 const names={main:'主甲板',stern:'船尾甲板',cabin:'船室'},initial=()=>({area:'main',x:594,y:523,direction:'down'});
 function inside(x,y,poly){let on=false;for(let i=0,j=poly.length-1;i<poly.length;j=i++){const a=poly[i],b=poly[j];if((a[1]>y)!==(b[1]>y)&&x<(b[0]-a[0])*(y-a[1])/(b[1]-a[1])+a[0])on=!on;}return on;}
 function walkable(area,x,y){const a=areas[area];return !!a&&[[0,0],[-7,0],[7,0],[0,-4],[0,4]].every(([dx,dy])=>inside(x+dx,y+dy,a.floor)&&!a.blocks.some(p=>inside(x+dx,y+dy,p)));}
 function move(p,distance,direction){if(!Number.isFinite(distance)||distance<0||distance>120||!['left','right','up','down'].includes(direction))throw Error('歩行の指定を確認してください。');const n={...p,direction},delta={left:[-1,0],right:[1,0],up:[0,-1],down:[0,1]}[direction];for(let v=0;v<distance;v+=2){const step=Math.min(2,distance-v),x=n.x+delta[0]*step,y=n.y+delta[1]*step;if(!walkable(n.area,x,y))break;n.x=x;n.y=y;}return n;}
 function nearby(p){if(p.area==='main'&&Math.hypot(p.x-412,p.y-488)<37)return 'stairsUp';if(p.area==='stern'&&Math.hypot(p.x-302,p.y-332)<35)return 'stairsDown';if(p.area==='main'&&Math.hypot(p.x-456,p.y-464)<35)return 'enter';if(p.area==='cabin'&&Math.hypot(p.x-835,p.y-803)<52)return 'exit';return null;}
 function interact(p){const action=nearby(p);const targets={stairsUp:{area:'stern',x:295,y:328,direction:'up'},stairsDown:{area:'main',x:416,y:488,direction:'down'},enter:{area:'cabin',x:835,y:775,direction:'up'},exit:{area:'main',x:456,y:478,direction:'down'}};return action?{...targets[action]}:{...p};}
 function create({getState}){
  const dialog=document.createElement('dialog');dialog.id='deckDialog';dialog.innerHTML='<h2>外洋船を歩いて観察</h2><p>矢印キー、または下の方向ボタンで歩きます。扉と階段は近づいて「調べる」で移動できます。船の構造を確かめる見学図で、現在の航海とは別に歩けます。見学では航海の刻や物資は消費しません。</p><div class="deck-viewport"><canvas id="deckCanvas" width="1672" height="941" tabindex="0" aria-label="甲板の観測位置。矢印キーで歩く、Enterで調べる"></canvas></div><p id="deckPosition" role="status"></p><div class="deck-controls"><button data-deck-move="left">← 西</button><button data-deck-move="up">↑ 奥</button><button data-deck-move="down">↓ 手前</button><button data-deck-move="right">→ 東</button><button id="deckInteract">調べる</button><button id="deckClose">手帖へ戻る</button></div>';document.body.append(dialog);
  const canvas=dialog.querySelector('canvas'),ctx=canvas.getContext('2d'),label=dialog.querySelector('#deckPosition'),button=dialog.querySelector('#deckInteract');
  let pos=initial(),pressed=null,timer=null,column=1,imagesReady=false;
  const deck=new Image(),cabin=new Image(),actor=new Image(),walk=globalThis.RokujoWalkData;
  const imageError=()=>{imagesReady=false;stop();label.textContent='景色の画像を読み込めません。手帖へ戻ってから開き直してください。';canvas.hidden=true;button.disabled=true;};
  const paint=()=>{if(!dialog.open||!imagesReady)return;canvas.hidden=false;ctx.clearRect(0,0,1672,941);const bg=pos.area==='cabin'?cabin:deck;ctx.drawImage(bg,0,0,1672,941);
   ctx.fillStyle='#1e1a1366';ctx.beginPath();ctx.ellipse(pos.x,pos.y+1,12,5,0,0,Math.PI*2);ctx.fill();
   if(actor.naturalWidth){const row=walk.directions.indexOf(pos.direction),f=walk.frames[row*3+column],height=pos.area==='cabin'?140:pos.area==='stern'?65:77,scale=height/walk.rowHeights[row];ctx.drawImage(actor,f.sx,f.sy,f.width,f.height,pos.x-f.anchorX*scale,pos.y-f.anchorY*scale,f.width*scale,f.height*scale);}else{ctx.fillStyle='#ffe2a3';ctx.beginPath();ctx.arc(pos.x,pos.y-12,9,0,Math.PI*2);ctx.fill();}
   // 船尾の手すりと前面を人物より手前に戻す。足元通行領域とは別の描画順。
   if(pos.area==='stern'){ctx.save();ctx.beginPath();ctx.moveTo(47,292);ctx.lineTo(276,343);ctx.lineTo(477,274);ctx.lineTo(480,326);ctx.lineTo(279,392);ctx.lineTo(45,335);ctx.closePath();ctx.clip();ctx.drawImage(deck,0,0,1672,941);ctx.restore();}
   if(pos.area==='main'){for(const [front,poly] of [[450,[[512,0],[552,0],[579,470],[499,470]]],[510,[[1082,0],[1115,0],[1152,530],[1060,530]]]])if(pos.y<front){ctx.save();ctx.beginPath();poly.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));ctx.closePath();ctx.clip();ctx.drawImage(deck,0,0,1672,941);ctx.restore();}}
   const near=nearby(pos);label.textContent=names[pos.area]+' · '+({stairsUp:'階段を上がれます',stairsDown:'階段を下りられます',enter:'船室の扉が目の前です',exit:'甲板への出口です'}[near]||'手すりと荷物を避けて歩きます');button.disabled=!near;canvas.dataset.area=pos.area;canvas.dataset.x=String(pos.x);canvas.dataset.y=String(pos.y);canvas.dataset.direction=pos.direction;canvas.dataset.frame=String(column);const view=canvas.parentElement;view.scrollLeft=Math.max(0,pos.x*canvas.clientWidth/1672-view.clientWidth/2);
  };
  function stop(){pressed=null;clearTimeout(timer);timer=null;column=1;paint();}
  function active(){return dialog.open&&!document.hidden&&!canvas.hidden&&!document.querySelector('dialog[open]:not(#deckDialog)');}
  function go(direction){if(!active())return;const old=pos;pos=move(pos,8,direction);column=old.x===pos.x&&old.y===pos.y?1:(column+1)%3;paint();const view=canvas.parentElement;view.scrollLeft=Math.max(0,pos.x*canvas.clientWidth/1672-view.clientWidth/2);}
  function start(direction){stop();if(!active())return;pressed=direction;go(direction);const repeat=()=>{if(!pressed||!active())return stop();go(pressed);timer=setTimeout(repeat,70);};timer=setTimeout(repeat,130);}
  canvas.addEventListener('keydown',e=>{const d={ArrowLeft:'left',ArrowRight:'right',ArrowUp:'up',ArrowDown:'down'}[e.key];if(d){e.preventDefault();if(!e.repeat)start(d);}if(e.key==='Enter'){e.preventDefault();stop();pos=interact(pos);paint();}});canvas.addEventListener('keyup',stop);canvas.addEventListener('blur',stop);document.addEventListener('visibilitychange',stop);window.addEventListener('blur',stop);
  for(const b of dialog.querySelectorAll('[data-deck-move]')){b.onpointerdown=e=>{e.preventDefault();b.setPointerCapture(e.pointerId);start(b.dataset.deckMove);};b.onpointerup=stop;b.onpointercancel=stop;b.onkeydown=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();go(b.dataset.deckMove);}};}
  button.onclick=()=>{stop();pos=interact(pos);paint();};dialog.querySelector('#deckClose').onclick=()=>dialog.close();dialog.addEventListener('close',stop);dialog.addEventListener('cancel',stop);
  deck.onerror=cabin.onerror=imageError;actor.onerror=paint;actor.onload=paint;actor.src=walk.file;
  function open(){const s=getState();if(!s?.development?.fleet?.ships||s.narrative.step<115)return;stop();pos=initial();dialog.showModal();imagesReady=false;canvas.hidden=true;label.textContent='船の景色を読み込み中…';button.disabled=true;
   let loaded=0;const ready=()=>{if(++loaded===2){imagesReady=true;paint();canvas.focus();}};deck.onload=cabin.onload=ready;deck.src='../画像/concept/concept.ship.ocean.deck.v1.png';cabin.src='../画像/concept/concept.ship.ocean.cabin.v1.png';
  }
  return {open};
 }
 return Object.freeze({areas,initial,walkable,move,nearby,interact,create});
});
