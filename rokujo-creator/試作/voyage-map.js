'use strict';
(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory();else root.RokujoVoyageMap=factory();})(globalThis,()=>{
 // 相対位置だけを示す航路図。原作の海岸線・距離・世界地図を確定しない。
 function project(s){
  const trip=s.trips.find(t=>['trial','maresia'].includes(t.route));
  if(!trip)return {route:null,stage:'moored',heading:'north',progress:0,fraction:0,ships:0,moored:s.fleet.ships,total:0,remaining:0,legacy:false};
  const route=s.routes.find(r=>r.id===trip.route),total=trip.total||Math.max(trip.remaining,route.turns),elapsed=total-trip.remaining,outward=Math.ceil(total/2);
  const fraction=elapsed<=outward?elapsed/outward:trip.remaining/(total-outward);
  const stage=elapsed===0?'departing':elapsed<outward?'outbound':elapsed===outward?'surveying':'returning';
  const ships=trip.ships||(trip.route==='trial'?1:s.fleet.ships);
  return {route:trip.route,stage,heading:elapsed<outward?'west':elapsed===outward?'north':'east',progress:elapsed/total,fraction,ships,moored:s.fleet.ships-ships,total,remaining:trip.remaining,legacy:!trip.total};
 }
 function create(host){
  host.innerHTML='<h4>船団の航路図</h4><label>眺める航路<select data-voyage-route></select></label><svg class="voyage-chart" viewBox="0 0 640 320" role="img" aria-label="船団の航路と現在地"><rect width="640" height="320" rx="12" fill="#183f4c"/><g stroke="#47737a" stroke-width="1" opacity=".45"><path d="M0 80H640M0 160H640M0 240H640M80 0V320M240 0V320M400 0V320M560 0V320"/></g><path d="M640 0H593L606 60L582 105L597 160L580 220L599 270L590 320H640Z" fill="#bcab7b"/><path data-route-line fill="none" stroke="#e5c48b" stroke-width="2" stroke-dasharray="6 7"/><g fill="#fff0cc" font-size="15" font-family="sans-serif"><text x="24" y="30">西 ←</text><text x="568" y="30">北 ↑</text><text x="490" y="284">アルカディア</text><text x="500" y="305">西方の港</text><text data-route-label x="28" y="305"></text></g><circle cx="540" cy="160" r="7" fill="#e5c48b"/><circle data-destination cx="104" cy="160" r="7" fill="#e5c48b"/><g data-voyage-ships></g></svg><p data-voyage-status role="status"></p><p class="muted">航路の位置は相対的な目安です。海岸線や距離の実測図ではありません。一刻進めると航海が進み、備蓄不足では待機します。地図を眺めるだけでは時間は進みません。</p>';
  const select=host.querySelector('select'),svg=host.querySelector('svg'),group=host.querySelector('[data-voyage-ships]'),ns='http://www.w3.org/2000/svg';
  let selected='trial';const markers=[];
  for(let i=0;i<5;i++){
   const marker=document.createElementNS(ns,'g'),turn=document.createElementNS(ns,'g'),fallback=document.createElementNS(ns,'path'),img=document.createElementNS(ns,'image');
   marker.classList.add('voyage-marker');fallback.setAttribute('d','M0 -18L9 12L0 7L-9 12Z');fallback.setAttribute('fill','#ffdfa1');
   img.setAttribute('href','../画像/props/prop.ship.ocean.map_token.v1.png');img.setAttribute('x',String(-627*64/1254));img.setAttribute('y',String(-626*64/1254));img.setAttribute('width','64');img.setAttribute('height','64');img.setAttribute('aria-hidden','true');img.onload=()=>fallback.setAttribute('visibility','hidden');img.onerror=()=>{img.setAttribute('visibility','hidden');fallback.setAttribute('visibility','visible');};
   turn.append(fallback,img);marker.append(turn);group.append(marker);markers.push({marker,turn});
  }
  let last=null;select.onchange=()=>{selected=select.value;if(last)render(last);};
  function render(s){
   last=s;const routes=s.routes.filter(r=>r.mode==='ocean'),v=project(s);host.hidden=!routes.length;if(host.hidden)return;
   if(!routes.some(r=>r.id===selected))selected=routes[0].id;if(v.route)selected=v.route;
   select.replaceChildren(...routes.map(r=>{const o=document.createElement('option');o.value=r.id;o.textContent=r.title;return o;}));select.value=selected;select.disabled=!!v.route;
   const trial=selected==='trial',end=trial?280:104,active=!!v.route,f=active?v.fraction:0,px=540+(end-540)*f;
   host.querySelector('[data-route-line]').setAttribute('d',`M540 160H${end}`);host.querySelector('[data-destination]').setAttribute('cx',end);
   host.querySelector('[data-route-label]').textContent=trial?'試験海域（折り返し）':'セレスへの連絡点';
   markers.forEach(({marker,turn},i)=>{marker.style.display=i<s.fleet.ships?'':'none';const moving=active&&i<v.ships,index=moving?i:i-v.ships,y=160+(index-((moving?v.ships:v.moored)-1)/2)*40;marker.style.transform=`translate(${moving?px:540}px, ${y}px)`;turn.setAttribute('transform','rotate('+({north:0,east:90,west:270}[moving?v.heading:'north'])+')');marker.dataset.sailing=String(moving);});
   const stages={departing:'出港',outbound:'往路',surveying:'目的地での調査',returning:'復路',moored:'停泊'};
   const text=active?`${stages[v.stage]} · ${v.ships}隻 · ${v.heading==='west'?'西へ':v.heading==='east'?'東の港へ':'調査中'} · 帰還まで ${v.remaining}刻`:`停泊 ${s.fleet.ships}隻 · 航路を選んで探索を出すと航行を見守れます。`;
   host.querySelector('[data-voyage-status]').textContent=text+(v.legacy?'（以前の記録のため位置は推定）':'');svg.setAttribute('aria-label',text);host.dataset.stage=v.stage;host.dataset.heading=v.heading;host.dataset.fraction=String(f);host.dataset.ships=String(v.ships);host.dataset.route=v.route||'';
  }
  return {render};
 }
 return Object.freeze({project,create});
});
