'use strict';
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.RokujoDevelopmentSystems=api;})(globalThis,()=>{
 const clone=x=>JSON.parse(JSON.stringify(x)),integer=(x,a=0,b=100000)=>Number.isInteger(x)&&x>=a&&x<=b;
 const roles={scout:'斥候',herbalist:'薬師',engineer:'技師',scholar:'学者'};
 const lessons={clouds:'雲と天候の記録',tides:'潮の流れ',stars:'星と方角',birds:'鳥と陸地の兆し'},order=Object.keys(lessons);
 const studies={heat:'炉の温度不足',fuel:'燃料を増やす案',structure:'炉の構造と熱の逃げ',forge:'炉の構造を見直す',trade:'交易の議案',education:'教育の議案',resources:'資源の議案',forest:'森林保全の議案'};
 const cases={learning:{title:'工房の子が研究院で学びたい',article:'2',note:'学ぶ意志を持つ人に知識を開く。'},credit:{title:'共同開発の功績を一人だけのものにしてよいか',article:'3',note:'携わった発明者の功績を記録する。'},safety:{title:'物資不足のとき弱い立場の住民を後回しにしてよいか',article:'4',note:'困っている住民を守る案を優先する。'}};
 const routes={forest:{title:'森の民',unlock:67,turns:3},river:{title:'蒼流河',unlock:67,turns:4},beast:{title:'獣人の集落',unlock:81,turns:5},dwald:{title:'ドワルド',unlock:102,turns:6},maresia:{title:'マレシア・セレス',unlock:126,turns:9},rivaria:{title:'漂流都市リヴァリア',unlock:127,novelUnlock:46,turns:9},whitecity:{title:'神の庭・白都',unlock:127,novelUnlock:65,turns:12}};
 const empty=()=>({version:1,team:[],knowledge:[],lesson:null,studies:[],workers:{food:0,water:0,industry:0,research:0},tension:0,resolved:[],shipments:[],depots:{},steelMaking:false,crystals:0});
 const unique=(xs,allowed,max)=>Array.isArray(xs)&&xs.length<=max&&new Set(xs).size===xs.length&&xs.every(x=>Object.hasOwn(allowed,x));
 function validate(d,phase,through){const o=d.operations;if(d.trips.some(t=>t.specialists!==undefined&&!unique(t.specialists,roles,2)))return false;if(o===undefined)return !d.trips.some(t=>t.specialists!==undefined);
  if(!o||!integer(o.crystals)||o.version!==1||!unique(o.team,roles,2)||!unique(o.knowledge,lessons,4)||o.knowledge.some((x,i)=>x!==order[i])||!unique(o.studies,studies,9)||!unique(o.resolved,cases,3)||!integer(o.tension,0,100)||typeof o.steelMaking!=='boolean')return false;
  if(!o.workers||Object.keys(o.workers).sort().join(',')!=='food,industry,research,water'||!Object.values(o.workers).every(v=>integer(v,0,200))||Object.values(o.workers).reduce((a,b)=>a+b,0)>d.population)return false;
  if(o.lesson!==null&&(!o.lesson||o.lesson.id!==order[o.knowledge.length]||!integer(o.lesson.remaining,1,3)))return false;
  if(o.studies.includes('forge')&&!['heat','fuel','structure'].every(x=>o.studies.includes(x)))return false;
  if(o.steelMaking&&(!o.studies.includes('forge')||!d.buildings.some(b=>b.kind==='forge')))return false;
  if(!o.depots||typeof o.depots!=='object'||Array.isArray(o.depots)||!Object.entries(o.depots).every(([k,v])=>Object.hasOwn(routes,k)&&v&&typeof v==='object'&&!Array.isArray(v)&&Object.entries(v).every(([key,n])=>['wood','stone','ore','goods','food','water','coin','steel'].includes(key)&&integer(n))))return false;
  if(!Array.isArray(o.shipments)||o.shipments.length>3||!o.shipments.every(t=>t&&Object.hasOwn(routes,t.route)&&['out','in'].includes(t.side)&&['wood','stone','ore','goods','food','water','steel'].includes(t.key)&&integer(t.quantity,1,20)&&integer(t.remaining,1,routes[t.route].turns)))return false;
  if(d.trips.some(t=>t.specialists!==undefined&&!unique(t.specialists,roles,2)))return false;
  if(phase!==undefined&&(o.crystals>0&&phase<102||o.team.length&&phase<114||(o.knowledge.length||o.lesson)&&phase<124||o.studies.some(id=>['heat','fuel','structure','forge'].includes(id)&&phase<100)||o.studies.some(id=>['trade','education','resources','forest'].includes(id)&&phase<107)||o.shipments.some(t=>phase<routes[t.route].unlock)||Object.keys(o.depots).some(id=>phase<routes[id].unlock)))return false;
  if(through!==undefined&&[...o.shipments.map(t=>t.route),...Object.keys(o.depots)].some(id=>(routes[id].novelUnlock||0)>through))return false;
  return true;
 }
 function pay(d,c){if(!Object.entries(c).every(([k,n])=>(k==='steel'?d.steel||0:d.stock[k])>=n))throw Error('必要な物資が足りません。');for(const [k,n] of Object.entries(c)){if(k==='steel')d.steel-=n;else d.stock[k]-=n;}}
 function gain(d,k,n){if(k==='steel')d.steel=Math.min(100000,(d.steel||0)+n);else d.stock[k]=Math.min(100000,d.stock[k]+n);}
 function note(d,t){d.notes.unshift(t);d.notes=d.notes.slice(0,30);}
 function command(d,op,p,phase,through=42){const o=clone(d.operations||empty());d.operations=o;
  if(op==='team'){if(phase<114)throw Error('探査隊の結成を読んでから役割を決められます。');if(d.trips.length)throw Error('出発済みの隊の帰還を待ってください。');if(!unique(p.roles,roles,2))throw Error('重点となる専門役を二種類まで選んでください。');o.team=[...p.roles];note(d,'探査隊の重点役割：'+(o.team.map(x=>roles[x]).join('・')||'標準の編成')+'。');}
  else if(op==='lesson'){if(phase<124)throw Error('海の知識の交流を読んでから研究できます。');if(o.lesson)throw Error('今の研究が終わるまで待ってください。');const id=order[o.knowledge.length];if(!id)throw Error('四つの基礎研究は完了しています。');pay(d,{goods:2,coin:2});o.lesson={id,remaining:3};note(d,lessons[id]+'の共同研究を始めました。');}
  else if(op==='study'){const id=p.id;if(!Object.hasOwn(studies,id)||phase<(['heat','fuel','structure','forge'].includes(id)?100:107))throw Error('この記録はまだ観察できません。');if(o.studies.includes(id))throw Error('この記録は整理済みです。');if(id==='forge'&&!['heat','fuel','structure'].every(x=>o.studies.includes(x)))throw Error('温度・燃料案・構造の三点を先に確かめてください。');o.studies.push(id);note(d,studies[id]+'を観察記録へ整理しました。');}
  else if(op==='workers'){const w=p.workers;if(!w||Object.keys(w).sort().join(',')!=='food,industry,research,water'||!Object.values(w).every(v=>integer(v,0,200))||Object.values(w).reduce((a,b)=>a+b,0)>d.population)throw Error('共同作業の人数は住民の範囲で配分してください。');o.workers=clone(w);note(d,'共同作業の配分を更新しました。');}
  else if(op==='resolve'){const c=cases[p.id];if(!c||o.resolved.includes(p.id))throw Error('この議案はありません、または解決済みです。');if(p.article!==c.article)throw Error('その条文との関係をもう一度考えてください。');pay(d,{coin:2});o.resolved.push(p.id);o.tension=Math.max(0,o.tension-15);note(d,c.title+'：'+c.note);}
  else if(op==='steel'){if(!o.studies.includes('forge')||!d.buildings.some(b=>b.kind==='forge'))throw Error('炉の構造の観察と完成した加工工房が必要です。');o.steelMaking=!o.steelMaking;note(d,'結晶鋼の共同試作を'+(o.steelMaking?'開始':'停止')+'。原料は輸入した発光結晶2・加工品1で一刻に地金1です。');}
  else if(op==='shipment'){const r=routes[p.route],limit=['trade','education','resources','forest'].every(x=>o.studies.includes(x))?3:1;if(!r||phase<r.unlock||(r.novelUnlock||0)>through)throw Error('この物流先はまだ知られていません。');if(!d.buildings.some(b=>b.kind==='warehouse'))throw Error('物流には完成した倉庫が必要です。');if(o.shipments.length>=limit)throw Error('輸送中の便が戻るのを待ってください。');if(!['out','in'].includes(p.side)||!['wood','stone','ore','goods','food','water','steel'].includes(p.key)||!integer(p.quantity,1,20))throw Error('輸送の品物と数量を確認してください。');if(['river','maresia','rivaria','whitecity'].includes(p.route)&&!d.buildings.some(b=>b.kind==='dock'))throw Error('水上輸送には完成した船着場が必要です。');if(['maresia','rivaria','whitecity'].includes(p.route)&&(!(d.fleet?.ships>=1)||!d.visited.includes('maresia')))throw Error('セレスから帰還した外洋船が必要です。');
   const depot=o.depots[p.route]||{};if(p.side==='in'&&(depot[p.key]||0)<p.quantity)throw Error('相手側の共同倉庫にその数量はありません。');pay(d,{coin:2,water:1,...(p.side==='out'?{[p.key]:p.quantity+(p.key==='water'?1:0)}:{})});if(p.side==='in')depot[p.key]-=p.quantity;o.depots[p.route]=depot;o.shipments.push({route:p.route,side:p.side,key:p.key,quantity:p.quantity,remaining:r.turns});note(d,r.title+'との共同輸送を出しました。');
  }else throw Error('この共同作業はありません。');
 }
 function itinerary(d,id,turns,cost){const o=d.operations;if(!o)return {turns,cost:clone(cost),specialists:null};const c=clone(cost),team=o.team;
  if(team.includes('herbalist'))c.food=Math.max(1,(c.food||0)-3);if(team.includes('engineer'))c.water=Math.max(1,(c.water||0)-3);
  if(['trial','maresia'].includes(id)){if(o.knowledge.includes('clouds'))c.food=Math.max(1,c.food-2);if(o.knowledge.includes('tides'))turns--;if(o.knowledge.includes('stars'))turns--;}
  else if(team.includes('scout')&&['forest','beast','dwald'].includes(id))turns--;
  return {turns:Math.max(['trial','maresia'].includes(id)?3:1,turns),cost:c,specialists:[...team]};
 }
 function tick(d,enough){const o=d.operations;if(!o)return;const w=o.workers;
  if(enough){if(d.buildings.some(b=>b.kind==='farm'))gain(d,'food',Math.floor(w.food/4));if(d.buildings.some(b=>b.kind==='well'))gain(d,'water',Math.floor(w.water/4));if(d.buildings.some(b=>b.kind==='forge')&&w.industry>=4&&d.stock.ore&&d.stock.wood){d.stock.ore--;d.stock.wood--;gain(d,'goods',1);}if(o.lesson){o.lesson.remaining=Math.max(0,o.lesson.remaining-1-(w.research>=4&&d.turn%2===0?1:0));if(!o.lesson.remaining){o.knowledge.push(o.lesson.id);note(d,lessons[o.lesson.id]+'の研究が完了しました。');o.lesson=null;}}if(o.steelMaking&&o.crystals>=2&&d.stock.goods>=1){o.crystals-=2;d.stock.goods--;gain(d,'steel',1);}}
  o.tension=Math.max(0,Math.min(100,o.tension+(enough?-1:5)));
  if(enough)for(const t of o.shipments){t.remaining--;if(t.remaining===0){if(t.side==='in')gain(d,t.key,t.quantity);else{const depot=o.depots[t.route];depot[t.key]=Math.min(100000,(depot[t.key]||0)+t.quantity);}note(d,routes[t.route].title+'への共同輸送が到着しました。');}}
  o.shipments=o.shipments.filter(t=>t.remaining>0);
 }
 function returned(d,t){if(!d.operations||!t.specialists)return;if(t.route==='dwald')d.operations.crystals=Math.min(100000,d.operations.crystals+2);if(t.specialists.includes('scout'))gain(d,'wood',2);if(t.specialists.includes('scholar')){gain(d,'goods',1);note(d,'学者が航路と現地の観察記録を整理しました。');}if(['trial','maresia'].includes(t.route)&&d.operations.knowledge.includes('birds'))gain(d,'goods',1);}
 function status(d,phase,through=42){const o=clone(d.operations||empty());return {...o,roles:clone(roles),lessons:clone(lessons),studiesAvailable:clone(studies),cases:clone(cases),routes:Object.entries(routes).filter(([,v])=>v.unlock<=phase&&(v.novelUnlock||0)<=through).map(([id,v])=>({id,...v})),active:!!d.operations};}
 return Object.freeze({empty,validate,command,itinerary,tick,returned,status});
});
