'use strict';
(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory();else root.RokujoDevelopment=factory();})(globalThis,()=>{
 const X=typeof module==='object'&&module.exports?require('./development-systems.js'):globalThis.RokujoDevelopmentSystems;
 const copy=x=>JSON.parse(JSON.stringify(x)),int=(v,a=0,b=100000)=>Number.isInteger(v)&&v>=a&&v<=b;
 const resources={wood:'木材',stone:'石材',ore:'鉱石',goods:'加工品',food:'食料',water:'水',coin:'交易貨'};
 const facilities={home:{title:'住居',cost:{wood:8,stone:4},turns:3},farm:{title:'共同農園',cost:{wood:6,stone:2},turns:2},well:{title:'井戸',cost:{wood:4,stone:6},turns:2},lumber:{title:'製材場',cost:{wood:8,stone:4},turns:3},quarry:{title:'採石場',cost:{wood:6,stone:6},turns:3},mine:{title:'鉱石採掘場',cost:{wood:10,stone:8},turns:4},forge:{title:'加工工房',cost:{wood:12,stone:8,ore:4},turns:4},market:{title:'交易所',cost:{wood:10,stone:8},turns:3},dock:{title:'船着場',cost:{wood:12,stone:4},turns:3},warehouse:{title:'倉庫',cost:{wood:14,stone:10},turns:3,unlock:109},shipyard:{title:'造船所',cost:{wood:20,stone:12,goods:4},turns:5,unlock:109}};
 // 段階の数字は「その場面を読み終えた次の段階」。読む前に名前を先出ししない。
 const labels={...resources,steel:'結晶鋼'};
 const ship={title:'第一世代外洋船',cost:{wood:30,goods:10,steel:4},turns:6,unlock:110,max:5};
 const policies={balanced:'暮らしと生産',welfare:'暮らしの備え',industry:'生産の拡張'};
 const routes={forest:{title:'森の民との交易路',turns:3,mode:'land',cost:{food:4,water:4},reward:{wood:6},unlock:67},river:{title:'蒼流河の連絡航路',turns:4,mode:'boat',cost:{food:6,water:6},reward:{coin:8},unlock:67},beast:{title:'獣人の集落への道',turns:5,mode:'land',cost:{food:8,water:8},reward:{ore:4},unlock:81},dwald:{title:'地下王国ドワルドとの交易路',turns:6,mode:'land',cost:{food:10,water:10,goods:2},reward:{steel:2,ore:4},unlock:102},trial:{title:'西方大海の試験航海',turns:7,mode:'ocean',cost:{food:12,water:12},reward:{},unlock:112,firstNote:'試験航海から帰還。目印のない海では、方向を保つことが難しいと分かりました。'},maresia:{title:'マレシア王国セレスへの航路',turns:12,fastTurns:9,fastFrom:127,mode:'ocean',needs:'trial',cost:{food:20,water:20,goods:6},reward:{coin:40,goods:4},unlock:126}};
 function routeTurns(r,phase){return r.fastFrom&&phase>=r.fastFrom?r.fastTurns:r.turns;}
 function fleetOf(d){return d.fleet||{ships:0,building:null};}
 function marketCap(d){return d.buildings.some(b=>b.kind==='warehouse')?30:20;}
 const initialBuildings=[{kind:'home',x:3,y:2},{kind:'farm',x:8,y:4},{kind:'well',x:6,y:2}];
 // The river is traversable only at the bridge. The whole image is never walkable.
 function terrain(x,y){if(!int(x,0,11)||!int(y,0,7))return 'outside';if(x===10)return y===3?'bridge':'water';if(y===3||x===6&&y!==2||x===7&&(y===1||y===2))return 'road';return 'land';}
 function neighbors(x,y){return [[x-1,y],[x+1,y],[x,y-1],[x,y+1]].filter(([a,b])=>terrain(a,b)!=='outside');}
 function walkable(x,y){return ['road','bridge'].includes(terrain(x,y));}
 function path(from,to){if(!from||!to||!walkable(from.x,from.y)||!walkable(to.x,to.y))return null;const q=[[{...from}]],seen=new Set([from.x+','+from.y]);while(q.length){const p=q.shift(),a=p.at(-1);if(a.x===to.x&&a.y===to.y)return p;for(const [x,y] of neighbors(a.x,a.y))if(walkable(x,y)&&!seen.has(x+','+y)){seen.add(x+','+y);q.push([...p,{x,y}]);}}return null;}
 function initial(){return {version:1,turn:0,stock:{wood:24,stone:18,ore:8,goods:4,food:30,water:30,coin:30},population:12,buildings:copy(initialBuildings),projects:[],nextId:1,policy:'balanced',trips:[],visited:[],marketUsed:{},notes:[],observer:{x:6,y:3,direction:'down'}};}
 function validate(d,phase,through){
  if(d===undefined)return true;
  if(!d||d.version!==1||!int(d.turn,0,1000000)||!int(d.population,1,200)||!int(d.nextId,1,1000000)||!Object.hasOwn(policies,d.policy)||!d.stock||!Object.keys(resources).every(k=>int(d.stock[k])))return false;
  if(!Array.isArray(d.buildings)||d.buildings.length>40||!Array.isArray(d.projects)||d.projects.length>3)return false;
  const occupied=new Set();for(const b of [...d.buildings,...d.projects]){if(!b||!Object.hasOwn(facilities,b.kind)||terrain(b.x,b.y)!=='land'||!neighbors(b.x,b.y).some(([x,y])=>walkable(x,y)))return false;const id=b.x+','+b.y;if(['dock','shipyard'].includes(b.kind)&&b.x!==9&&b.x!==11)return false;if(occupied.has(id))return false;occupied.add(id);}
  if(!d.projects.every(p=>int(p.id,1,d.nextId-1)&&int(p.progress,0,facilities[p.kind].turns-1))||new Set(d.projects.map(p=>p.id)).size!==d.projects.length)return false;
  if(d.population>Math.min(200,d.buildings.filter(b=>b.kind==='home').length*16))return false;
  if(!initialBuildings.every(b=>d.buildings.some(x=>x.kind===b.kind&&x.x===b.x&&x.y===b.y)))return false;
  if(!Array.isArray(d.trips)||d.trips.length>1||!d.trips.every(t=>t&&Object.hasOwn(routes,t.route)&&int(t.remaining,1,routes[t.route].turns)&&(routes[t.route].mode!=='ocean'||fleetOf(d).ships>=1)&&(t.total===undefined||routes[t.route].mode==='ocean'&&int(t.total,3,routes[t.route].turns)&&t.remaining<=t.total)&&(t.ships===undefined||routes[t.route].mode==='ocean'&&int(t.ships,1,fleetOf(d).ships)&&(t.route!=='trial'||t.ships===1))))return false;
  if(!Array.isArray(d.visited)||new Set(d.visited).size!==d.visited.length||!d.visited.every(k=>Object.hasOwn(routes,k)))return false;
  if(!d.marketUsed||typeof d.marketUsed!=='object'||Array.isArray(d.marketUsed)||!Object.entries(d.marketUsed).every(([k,v])=>Object.hasOwn(resources,k)&&k!=='coin'&&int(v,0,marketCap(d))))return false;
  if(d.steel!==undefined&&!int(d.steel))return false;
  if(d.fleet!==undefined&&(!d.fleet||typeof d.fleet!=='object'||Object.keys(d.fleet).length!==2||!int(d.fleet.ships,0,ship.max)||!(d.fleet.building===null||int(d.fleet.building,0,ship.turns-1))||d.fleet.building!==null&&(d.fleet.ships>=ship.max||!d.buildings.some(b=>b.kind==='shipyard'))))return false;
  if(d.buildings.some(b=>b.kind==='shipyard')&&!(d.buildings.some(b=>b.kind==='dock')&&d.buildings.some(b=>b.kind==='warehouse')))return false;
  if(phase!==undefined){
   if([...d.buildings,...d.projects].some(b=>(facilities[b.kind].unlock||0)>phase))return false;
   if([...d.trips.map(t=>t.route),...d.visited].some(k=>routes[k].unlock>phase))return false;
   if(d.fleet!==undefined&&phase<ship.unlock)return false;
   if(d.steel!==undefined&&phase<routes.dwald.unlock)return false;
  }
  if(!Array.isArray(d.notes)||d.notes.length>30||!d.notes.every(x=>typeof x==='string'&&x.length<300))return false;
  if(!X.validate(d,phase,through))return false;
  return d.observer&&walkable(d.observer.x,d.observer.y)&&['left','right','up','down'].includes(d.observer.direction);
 }
 function checked(d){if(!validate(d)||!d)throw Error('街区の記録を確認できません。');}
 function count(d,k){return d.buildings.filter(x=>x.kind===k).length;}
 function note(d,t){d.notes.unshift(t);d.notes=d.notes.slice(0,30);}
 function have(d,k){return k==='steel'?(d.steel||0):d.stock[k];}
 function gain(d,k,v){if(k==='steel')d.steel=Math.min(100000,(d.steel||0)+v);else d.stock[k]=Math.min(100000,d.stock[k]+v);}
 function afford(d,cost){return Object.entries(cost).every(([k,v])=>have(d,k)>=v);}
 function pay(d,cost){if(!afford(d,cost))throw Error('必要な物資が足りません。');for(const [k,v] of Object.entries(cost)){if(k==='steel')d.steel-=v;else d.stock[k]-=v;}}
 function prices(d,key){if(!Object.hasOwn(resources,key)||key==='coin')throw Error('この品物は取引できません。');const base={wood:4,stone:5,ore:8,goods:12,food:3,water:2}[key],scarcity=d.stock[key]<10?2:d.stock[key]>60?-1:0,buy=base+scarcity;return {buy,sell:Math.max(1,buy-2),available:marketCap(d)-(d.marketUsed[key]||0)};}
 function buildReason(d,kind,x,y,phase=67){if(!Object.hasOwn(facilities,kind))return 'この施設はありません。';if((facilities[kind].unlock||0)>phase)return 'この施設はまだ知られていません。';if(d.projects.length>=3)return '建設計画は三件までです。';if(terrain(x,y)!=='land')return '道・橋・水辺には建設できません。';if(!neighbors(x,y).some(([a,b])=>walkable(a,b)))return '道に接した候補地を選んでください。';if([...d.buildings,...d.projects].some(b=>b.x===x&&b.y===y))return 'この場所は使用中です。';if(kind==='dock'&&x!==9&&x!==11)return '船着場は運河の岸に計画します。';if(kind==='shipyard'&&x!==9&&x!==11)return '造船所は運河の岸に計画します。';if(kind==='shipyard'&&!(d.buildings.some(b=>b.kind==='dock')&&d.buildings.some(b=>b.kind==='warehouse')))return '造船所には、完成した船着場と倉庫が必要です。';if(!afford(d,facilities[kind].cost))return '必要な物資が足りません。';return '';}
 function tick(input){checked(input);if(input.turn>=1000000)throw Error('街区の観察刻の上限です。');const d=copy(input);d.turn++;d.marketUsed={};
  const consumption=Math.max(1,Math.ceil(d.population/4)),foodBefore=d.stock.food,waterBefore=d.stock.water;
  gain(d,'food',count(d,'farm')*(d.policy==='welfare'?8:6));gain(d,'water',count(d,'well')*6);
  const enough=d.stock.food>=consumption&&d.stock.water>=consumption;d.stock.food=Math.max(0,d.stock.food-consumption);d.stock.water=Math.max(0,d.stock.water-consumption);
  const rate=d.policy==='industry'?4:3;gain(d,'wood',count(d,'lumber')*rate);gain(d,'stone',count(d,'quarry')*2);gain(d,'ore',count(d,'mine'));
  for(let i=0;i<count(d,'forge');i++)if(d.stock.wood>=2&&d.stock.ore>=2){d.stock.wood-=2;d.stock.ore-=2;gain(d,'goods',2);}
  gain(d,'coin',count(d,'market'));
  if(!enough)note(d,'備蓄が不足。新しい建設と人口の増加は停止しています。農園・井戸・交易で立て直せます。');
  if(enough&&(!d.operations||d.operations.tension<70)&&d.projects.length){const p=d.projects[0];p.progress++;if(p.progress===facilities[p.kind].turns){d.buildings.push({kind:p.kind,x:p.x,y:p.y});d.projects.shift();note(d,facilities[p.kind].title+'が完成。働き始めるのは次の観察刻です。');}}
  if(enough&&d.fleet&&d.fleet.building!==null&&count(d,'shipyard')){d.fleet.building++;if(d.fleet.building===ship.turns){d.fleet.ships++;d.fleet.building=null;note(d,ship.title+'が完成。'+d.fleet.ships+'隻目が桟橋につながれました。');}}
  if(enough&&foodBefore>=10&&waterBefore>=10&&d.turn%5===0&&d.population<Math.min(200,count(d,'home')*16)&&count(d,'farm')*6>=Math.ceil((d.population+1)/4)&&count(d,'well')*6>=Math.ceil((d.population+1)/4)){d.population++;note(d,'暮らしの備えと住まいが整い、街区の住民が一人増えました。');}
  if(enough)for(const trip of d.trips){trip.remaining--;if(trip.remaining===0){X.returned(d,trip);for(const [k,v] of Object.entries(routes[trip.route].reward))gain(d,k,v);const first=!d.visited.includes(trip.route);if(first)d.visited.push(trip.route);note(d,first&&routes[trip.route].firstNote?routes[trip.route].firstNote:routes[trip.route].title+'から帰還。持ち帰った物資を記録しました。');}}
  X.tick(d,enough);
  d.trips=d.trips.filter(t=>t.remaining>0);checked(d);return d;
 }
 function command(input,op,p={},phase=67,through=42){const d=input?copy(input):initial();checked(d);
  if(op==='start'){if(input)throw Error('街区の観察は始まっています。');note(d,'住民が育てる街区の観察を始めました。');}
  else if(op==='plan'){const reason=buildReason(d,p.kind,p.x,p.y,phase);if(reason)throw Error(reason);pay(d,facilities[p.kind].cost);d.projects.push({id:d.nextId++,kind:p.kind,x:p.x,y:p.y,progress:0});note(d,facilities[p.kind].title+'の建設案を住民の計画へ記録しました。');}
  else if(op==='cancel'){const i=d.projects.findIndex(x=>x.id===p.id);if(i<0)throw Error('その建設計画はありません。');const b=d.projects[i];for(const [k,v] of Object.entries(facilities[b.kind].cost))gain(d,k,b.progress===0?v:Math.floor(v/2));d.projects.splice(i,1);note(d,'建設を取り下げました。未着工は全額、着工後は半分の物資が戻ります。');}
  else if(op==='policy'){if(!Object.hasOwn(policies,p.id))throw Error('この方針はありません。');if(d.policy===p.id)throw Error('既に選んでいる方針です。');d.policy=p.id;note(d,'住民会議で重視する案：'+policies[p.id]+'。');}
  else if(op==='trade'){if(!count(d,'market'))throw Error('交易所の完成が必要です。');if(!int(p.quantity,1,20)||!['buy','sell'].includes(p.side))throw Error('売買の数量を確認してください。');const q=prices(d,p.key),n=p.quantity;if(p.side==='buy'){if(n>q.available)throw Error('この刻の商人の在庫が足りません。');if(d.stock[p.key]+n>100000)throw Error('備蓄の上限です。');pay(d,{coin:q.buy*n});gain(d,p.key,n);d.marketUsed[p.key]=(d.marketUsed[p.key]||0)+n;}else{if(d.stock[p.key]<n)throw Error('売る品物が足りません。');if(d.stock.coin+q.sell*n>100000)throw Error('交易貨の上限です。');d.stock[p.key]-=n;gain(d,'coin',q.sell*n);}note(d,resources[p.key]+'を'+n+(p.side==='buy'?'購入':'売却')+'しました。');}
  else if(op==='travel'){const r=routes[p.route];if(!r||phase<r.unlock)throw Error('この行き先はまだ知られていません。');if(d.trips.length)throw Error('調査隊の帰還を待ってください。');if(r.mode==='boat'&&!count(d,'dock'))throw Error('航路の出発には船着場が必要です。');if(r.mode==='ocean'&&fleetOf(d).ships<1)throw Error('外洋の航路には、完成した外洋船が必要です。');if(r.needs&&!d.visited.includes(r.needs))throw Error('まず'+routes[r.needs].title+'を見届けてください。');const plan=X.itinerary(d,p.route,routeTurns(r,phase),r.cost);pay(d,plan.cost);d.trips.push({route:p.route,remaining:plan.turns,...(plan.specialists?{specialists:plan.specialists}:{}),...(r.mode==='ocean'?{total:plan.turns,ships:p.route==='trial'?1:fleetOf(d).ships}:{})});note(d,r.title+'へ出発しました。');}
  else if(op==='ship'){if(phase<ship.unlock)throw Error('外洋船はまだ知られていません。');if(!count(d,'shipyard'))throw Error('造船所の完成が必要です。');const f=fleetOf(d);if(f.building!==null)throw Error('建造中の船の完成を待ってください。');if(f.ships>=ship.max)throw Error('船団は五隻までです。');pay(d,ship.cost);d.fleet={ships:f.ships,building:0};note(d,ship.title+'の建造案を、造船所の計画へ記録しました。');}
  else if(op.startsWith('ops.'))X.command(d,op.slice(4),p,phase,through);
  else if(op==='move'){if(!['left','right','up','down'].includes(p.direction))throw Error('移動方向を確認してください。');const delta={left:[-1,0],right:[1,0],up:[0,-1],down:[0,1]}[p.direction],x=d.observer.x+delta[0],y=d.observer.y+delta[1];if(!walkable(x,y))throw Error('道と橋を通って移動してください。');d.observer={x,y,direction:p.direction};}
  else throw Error('この街区操作はありません。');checked(d);return d;
 }
 function status(input,phase=67,through=42){const d=input?copy(input):initial();checked(d);return {active:!!input,...d,phase,operations:X.status(d,phase,through),labels:copy(labels),steel:d.steel||0,steelKnown:phase>=routes.dwald.unlock,fleet:copy(fleetOf(d)),ship:phase>=ship.unlock?copy(ship):null,marketCap:marketCap(d),capacity:Math.min(200,count(d,'home')*16),facilities:Object.fromEntries(Object.entries(copy(facilities)).filter(([,f])=>(f.unlock||0)<=phase)),policies:copy(policies),resources:copy(resources),market:count(d,'market')>0,prices:Object.fromEntries(Object.keys(resources).filter(k=>k!=='coin').map(k=>[k,prices(d,k)])),routes:Object.entries(routes).filter(([,r])=>phase>=r.unlock).map(([id,r])=>({id,...copy(r),turns:X.itinerary(d,id,routeTurns(r,phase),r.cost).turns,cost:X.itinerary(d,id,routeTurns(r,phase),r.cost).cost,blocked:r.mode==='boat'&&!count(d,'dock')?'船着場が必要':r.mode==='ocean'&&fleetOf(d).ships<1?'外洋船が必要':r.needs&&!d.visited.includes(r.needs)?'試験航海が先':''}))};}
 return Object.freeze({initial,validate,tick,command,status,terrain,path,walkable,buildReason,ship:copy(ship)});
});
