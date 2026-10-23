import {LEVELS,TYPES,id,coord,valid,side,initial,legalMoves,play,inCheck,canClaimDraw,moveText} from './engine.js?v=20261024f';
import {chooseBotMove} from './ai.js?v=20261024f';
import {initPieceModels,syncPieceModels,setPieceTheme} from './piece-models.js?v=20261024f';
import {TRACKS,getSaved,initBgm,setBgm,setBgmVolume,bgmStatusText} from './bgm.js?v=20261024f';
import {fleetInitial,fleetMoves,fleetPlay,fleetMoveText,chooseFleetMove,flagshipHp,SHIP_NAME,FACTION_NAME,FLAG_HP} from './fleet.js?v=20261024f';
import {initFleetFx,playMoveFx,fleetSe,setFleetSe} from './fleet-fx.js?v=20261024f';
import {wireModel} from './fleet-models.js?v=20261024f';

const glyph={k:'♚',q:'♛',r:'♜',b:'♝',n:'♞',p:'♟'};
const els=Object.fromEntries(['boards','newGame','undo','mode','difficulty','difficultyWrap','toggleAuto','theme','themePreview','themeTitle','themeDescription','themeSource','showMoves','moveToggleState','claimDraw','status','detail','gameTime','moveNo','captureNo','checkNo','captureWhite','captureBlack','history','copyLog','promotionDialog','promotionChoices','view2d','view3d','viewer','viewport','world','cameraInfo','topView','resetView','layerFocus','layerFocusWrap','focusNotice','focusMessage','showAllLayers','bgmSelect','bgmVolume','gameMode','fleetSe','seWrap','rulesChess','rulesFleet','captureLabel','checkLabel','capturedTitle','capturedWhiteLabel','capturedBlackLabel'].map(x=>[x,document.getElementById(x)]));
// ---- ゲームモード(三次元チェス / 艦隊運用モード) ----
let fleetMode=localStorage.getItem('threeLayerChess.gameMode')==='fleet';
const RULES={
  chess:{initial,legalMoves,play,inCheck,canClaimDraw,moveText},
  fleet:{initial:fleetInitial,legalMoves:s=>fleetMoves(s),play:fleetPlay,inCheck:()=>false,canClaimDraw:()=>false,moveText:fleetMoveText}
};
const R=()=>RULES[fleetMode?'fleet':'chess'];
const FLEET_CLASS={k:'DN',q:'PL',r:'BB',b:'CV',n:'TB',p:'FR'};
const iconCache=new Map();
// 銀河覇権のワイヤーフレーム艦を、平面表示用の小さな画像にする(真上から少し手前に傾けて見る。艦首は真っ直ぐ相手側: 白は上、黒は下)
function shipIcon(kind,who){
  const key=kind+who;if(iconCache.has(key))return iconCache.get(key);
  const m=wireModel(FLEET_CLASS[kind],who==='w'?'empire':'republic'),S=96,c=document.createElement('canvas');c.width=c.height=S;
  const g=c.getContext('2d'),k=kind==='p'||kind==='n'?80:kind==='q'?72:92,dir=who==='w'?-1:1;
  const pr=([x,y,z])=>[S/2-x*k*dir,S/2+z*k*.92*dir-y*k*.35];
  const P=m.v.map(pr),col=who==='w'?['#ffc45a','#fff2c8']:['#5ab8ff','#d6f6ff'];
  g.lineCap='round';
  for(const [list,cl,w,blur] of [[m.e,col[0],1.4,0],[m.acc,col[1],1.6,6]]){g.strokeStyle=cl;g.lineWidth=w;g.shadowColor=cl;g.shadowBlur=blur;g.beginPath();for(const [a,b] of list){g.moveTo(...P[a]);g.lineTo(...P[b]);}g.stroke();}
  const url=c.toDataURL();iconCache.set(key,url);return url;
}
function pieceBody(el,p,index,s){
  const who=side(p),type=p.toLowerCase();
  if(!fleetMode){el.textContent=glyph[type];return;}
  el.classList.add('ship');el.textContent='';
  const img=document.createElement('img');img.src=shipIcon(type,who);img.alt='';el.append(img);
  el.title=`${FACTION_NAME[who]} ${SHIP_NAME[type]} 防御 ${s.hp[index]}`;
}
function hpPips(cell,p,index,s){
  if(!fleetMode||p==='.')return;
  const max=p.toLowerCase()==='k'?FLAG_HP:3,hp=s.hp[index],box=document.createElement('span');
  box.className=`hp-pips ${side(p)==='w'?'white':'black'}${p.toLowerCase()==='k'?' flag':''}`;box.setAttribute('aria-label',`防御 ${hp}/${max}`);
  for(let i=0;i<max;i++){const d=document.createElement('i');if(i>=hp)d.className='lost';box.append(d);}
  cell.append(box);
}
function cellEl(index){return viewMode==='3d'?els.world.querySelector(`.cell3d[data-index="${index}"]`):els.boards.querySelector(`.square[data-index="${index}"]`);}
let states=[R().initial()], log=[], selected=-1, lastMove=null, thinking=false, botTimer=null,botWorker=null,botRun=0;
let clockStartedAt=null, elapsedMs=0;
let autoPaused=false;
let showLegalMoves=localStorage.getItem('threeLayerChess.showMoves')!=='off';
const THEMES={
  druid:{preview:'assets/celtic-pieces-lite/preview-fit.png',alt:'MeshyのCeltic King Chess',title:'Celtic Chess · ドルイドの森',desc:'木彫り風のケルトの駒。盤はルーン石板(Meshy・CC0)の石肌を苔むした森の緑に染め、縁は石板の岩肌と灯りにしました。',href:'https://www.meshy.ai/ja/3d-models/Celtic-King-Chess-019a2147-62cc-747c-90bd-b81086ae0a5f',link:'Meshyのキングを見る ↗'},
  standard:{preview:'assets/standard-pieces/preview-fit.png',alt:'MeshyのMinimalist White Chess Set。6種類の分離したチェス駒',title:'Standard Chess · 標準',desc:'Meshyの6駒セットを個別に分離・軽量化。象牙色と濃い木色の駒、木製風の盤です。',href:'https://www.meshy.ai/ja/3d-models/Minimalist-White-Chess-Set-019fc403-f6d7-7f86-a265-d3946b0ca4f8',link:'Meshyの駒セットを見る ↗'},
  lattice:{preview:'assets/lattice-pieces/preview-fit.png',alt:'MeshyのOrnate Lattice Chess Set',title:'Ornate Lattice · クラシック象牙',desc:'透かし彫りの象牙色の駒(Meshy・CC0)。盤は同じくMeshyの木製チェス盤(CC0)の木目から作りました。',href:'https://www.meshy.ai/ja/3d-models/Ornate-Lattice-Chess-Set-019f956e-602d-7b92-a72d-32301282c2fe',link:'Meshyの駒セットを見る ↗'},
  crown:{preview:'assets/crown-pieces/preview-fit.png',alt:'MeshyのCrown Jewels Chess Set',title:'Crown Jewels · 王宮の宝石',desc:'金と宝石をあしらった駒(Meshy・CC0)。盤は銀の飾り枠つきの大理石の盤(Meshy・CC0)から質感を取りました。',href:'https://www.meshy.ai/ja/3d-models/Crown-Jewels-Chess-Set-019f6dc3-8fd1-7f81-8c97-e1f58cd713ed',link:'Meshyの駒セットを見る ↗'}
};
let pieceTheme=THEMES[localStorage.getItem('threeLayerChess.theme')]?localStorage.getItem('threeLayerChess.theme'):'druid';
let viewMode='2d', camera={tilt:58,yaw:-30,zoom:1}, drag=null;
const current=()=>states.at(-1);
const humanTurn=()=>els.mode.value==='human'||(els.mode.value==='bot'&&current().turn==='w');
const botTurn=()=>els.mode.value==='auto'||(els.mode.value==='bot'&&current().turn==='b');
function updateClock(){
  const ms=elapsedMs+(clockStartedAt===null?0:Date.now()-clockStartedAt);
  const total=Math.floor(ms/1000),hours=Math.floor(total/3600),minutes=Math.floor(total/60)%60,seconds=total%60;
  els.gameTime.textContent=`${hours?`${hours}:`:''}${String(minutes).padStart(2,'0')}:${String(seconds).padStart(2,'0')}`;
  els.gameTime.dateTime=`PT${total}S`;
}
function stopClock(){if(clockStartedAt!==null){elapsedMs+=Date.now()-clockStartedAt;clockStartedAt=null;}updateClock();}

function drawBoards(){
  const s=current(), moves=!showLegalMoves||selected<0?[]:R().legalMoves(s).filter(m=>m.from===selected);
  els.boards.replaceChildren();
  for(const z of [1,2,0]){
    const card=document.createElement('section'); card.className='layer-card';
    const heading=document.createElement('div');heading.className='layer-title';heading.innerHTML=`<h2>${LEVELS[z]}</h2><span>${z===1?'8 × 8 · 主戦場':'6 × 6 · 周辺戦場'}</span>`;
    const board=document.createElement('div');board.className='chessboard';board.setAttribute('role','grid');board.setAttribute('aria-label',LEVELS[z]);
    for(let y=7;y>=0;y--)for(let x=0;x<8;x++){
      const sq=document.createElement('button');sq.type='button';sq.dataset.index=id(x,y,z);sq.className=`square ${(x+y)%2?'light':'dark'}`;
      const index=id(x,y,z),p=s.board[index], here=moves.filter(m=>m.to===index), name=`${LEVELS[z]} ${'abcdefgh'[x]}${y+1}`;
      sq.setAttribute('aria-label',`${name}${p!=='.'?' '+(side(p)==='w'?'白':'黒')+TYPES[p.toLowerCase()]:''}${here.length?' 移動可能':''}`);
      if(!valid(x,y,z)){sq.classList.add('void');sq.disabled=true;}
      else{
        if(selected===index)sq.classList.add('selected');
        if(lastMove && (lastMove.from===index||lastMove.to===index))sq.classList.add('last');
        if(here.length)sq.classList.add(p!=='.'||here[0].enPassant?'capture':'move');
        sq.addEventListener('click',()=>onSquare(index));
        if(p!=='.'){
          const piece=document.createElement('span');piece.className=`piece ${side(p)==='w'?'white':'black'}`;piece.dataset.piece=p.toLowerCase();pieceBody(piece,p,index,s);sq.append(piece);hpPips(sq,p,index,s);
        }
        if(z===1){const label=document.createElement('small');label.className='coord';label.textContent=`${'abcdefgh'[x]}${y+1}`;sq.append(label);}
      }
      board.append(sq);
    }
    card.append(heading,board);els.boards.append(card);
  }
}
function cameraUpdate(){
  els.world.style.setProperty('--tilt',`${camera.tilt}deg`);
  els.world.style.setProperty('--yaw',`${camera.yaw}deg`);
  els.world.style.setProperty('--zoom',camera.zoom);
  els.cameraInfo.textContent=`傾き ${Math.round(camera.tilt)}° · 回転 ${Math.round(camera.yaw)}° · 倍率 100%`;
  syncPieceModels(camera);
}
function applyTheme(){
  document.body.dataset.theme=pieceTheme;
  els.theme.value=pieceTheme;
  const t=THEMES[pieceTheme];
  els.themePreview.src=t.preview;els.themePreview.alt=t.alt;els.themeTitle.textContent=t.title;
  els.themeDescription.textContent=t.desc;els.themeSource.href=t.href;els.themeSource.textContent=t.link;
  setPieceTheme(fleetMode?'fleet':pieceTheme);
}
function draw3D(){
  const s=current(), moves=!showLegalMoves||selected<0?[]:R().legalMoves(s).filter(m=>m.from===selected);
  const focus=els.layerFocus.value;
  els.focusNotice.hidden=focus==='all';
  if(focus!=='all')els.focusMessage.textContent=`${LEVELS[Number(focus)]}のみ表示中。ほかの2段は非表示です。`;
  els.world.replaceChildren();
  for(const z of [0,1,2]){
    if(els.layerFocus.value!=='all'&&Number(els.layerFocus.value)!==z)continue;
    const plane=document.createElement('div');plane.className='plane';plane.dataset.level=z;
    const badge=document.createElement('span');badge.className='plane-label';badge.textContent=LEVELS[z];plane.append(badge);
    const base=document.createElement('div');base.className='slab-bottom';base.setAttribute('aria-hidden','true');plane.append(base);
    for(const edge of ['front','back','left','right']){
      const side=document.createElement('div');side.className=`slab-side ${edge}`;side.setAttribute('aria-hidden','true');plane.append(side);
    }
    for(let y=7;y>=0;y--)for(let x=0;x<8;x++){
      const index=id(x,y,z),p=s.board[index],here=moves.filter(m=>m.to===index);
      const cell=document.createElement('button');cell.type='button';cell.className=`cell3d ${(x+y)%2?'light':'dark'}`;
      cell.dataset.index=index;
      cell.setAttribute('aria-label',`${LEVELS[z]} ${'abcdefgh'[x]}${y+1}${p!=='.'?' '+(side(p)==='w'?'白':'黒')+TYPES[p.toLowerCase()]:''}`);
      if(!valid(x,y,z)){cell.classList.add('void');cell.disabled=true;}
      else{
        if(index===selected)cell.classList.add('selected');
        if(lastMove&&(lastMove.from===index||lastMove.to===index))cell.classList.add('last');
        if(here.length)cell.classList.add(p!=='.'||here[0].enPassant?'capture':'move');
        cell.addEventListener('click',e=>{if(e.detail===0)onSquare(index);});
        if(p!=='.'){
          const piece=document.createElement('span');piece.className=`piece3d ${side(p)==='w'?'white':'black'}`;piece.dataset.piece=p.toLowerCase();pieceBody(piece,p,index,s);cell.append(piece);hpPips(cell,p,index,s);
        }
      }
      plane.append(cell);
    }
    els.world.append(plane);
  }
  cameraUpdate();
}
function showView(mode){
  viewMode=mode;els.boards.hidden=mode==='3d';els.viewer.hidden=mode==='2d';
  els.view2d.classList.toggle('active',mode==='2d');els.view3d.classList.toggle('active',mode==='3d');
  els.view2d.setAttribute('aria-pressed',mode==='2d');els.view3d.setAttribute('aria-pressed',mode==='3d');
  els.topView.hidden=mode==='2d';els.resetView.hidden=mode==='2d';els.layerFocusWrap.hidden=mode==='2d';
  if(mode==='3d')draw3D();
}
function render(){
  const s=current(), check=R().inCheck(s,s.turn), who=fleetMode?FACTION_NAME[s.turn]:s.turn==='w'?'白':'黒';
  updateClock();
  els.status.textContent=s.result||`${who}の手番${check?' · チェック':''}`;
  if(fleetMode&&!s.result){const pip=n=>'●'.repeat(n)+'○'.repeat(FLAG_HP-n);els.status.textContent+=`  旗艦 帝国${pip(flagshipHp(s,'w'))} 共和${pip(flagshipHp(s,'b'))}`;}
  els.detail.textContent=s.result?'対局終了。新しい対局を始めるか、1手戻せます。':els.mode.value==='auto'&&autoPaused?'AI同士の対局を一時停止しています。':thinking?`${who}AIが考えています…`:selected>=0?(showLegalMoves?'青いマスを選ぶと移動します。':'移動先表示はOFFです。移動先のマスを選んでください。'):`${who}の駒を選択してください。`;
  els.showMoves.checked=showLegalMoves;
  els.moveToggleState.textContent=showLegalMoves?'ON':'OFF';
  els.moveNo.textContent=s.fullmove;
  els.captureNo.textContent=log.filter(x=>x.capture).length;
  for(const [team,container] of [['w',els.captureWhite],['b',els.captureBlack]]){
    const taken=log.filter(x=>x.side===team&&x.captured).map(x=>x.captured);
    container.replaceChildren();
    if(!taken.length){container.textContent='なし';continue;}
    for(const type of taken){
      const piece=document.createElement('span');piece.className=`captured-piece ${team==='w'?'black':'white'}`;
      if(fleetMode){const img=document.createElement('img');img.src=shipIcon(type.toLowerCase(),team==='w'?'b':'w');img.alt='';piece.classList.add('ship');piece.append(img);piece.title=SHIP_NAME[type.toLowerCase()];}else{piece.textContent=glyph[type.toLowerCase()];piece.title=TYPES[type.toLowerCase()];}
      container.append(piece);
    }
  }
  els.checkNo.textContent=log.filter(x=>x.check).length;
  els.undo.disabled=states.length<=1;
  els.claimDraw.hidden=!!s.result||!R().canClaimDraw(s)||!humanTurn();
  els.difficultyWrap.hidden=els.mode.value==='human';
  els.toggleAuto.hidden=els.mode.value!=='auto';
  els.toggleAuto.disabled=!!s.result;
  els.toggleAuto.textContent=autoPaused?'再開':'一時停止';
  els.history.replaceChildren();
  if(!log.length){const li=document.createElement('li');li.className='empty';li.textContent='対局が始まるとここに表示されます。';els.history.append(li);}
  else for(const entry of log){const li=document.createElement('li');li.textContent=`${entry.side==='w'?'白':'黒'} ${entry.text}${entry.check&&!fleetMode?' ＋':''}`;els.history.append(li);}
  els.history.scrollTop=els.history.scrollHeight;
  if(viewMode==='3d')draw3D();else drawBoards();
}
function commit(m){
  if(clockStartedAt===null)clockStartedAt=Date.now();
  const s=current(), notation=R().moveText(s,m);
  let captured=m.enPassant?'p':s.board[m.to].toLowerCase();
  const n=R().play(s,m);
  if(fleetMode){
    if(!n.last.sink)captured='.';
    playMoveFx(n.last,cellEl(m.from),cellEl(m.to));
  }
  states.push(n);log.push({side:s.turn,text:notation,capture:captured!=='.',captured:captured==='.'?null:captured,check:fleetMode?!!m.attack:inCheck(n,n.turn)});
  if(n.result)stopClock();
  lastMove=m;selected=-1;thinking=false;render();
  if(botTurn()&&!n.result)scheduleBot();
}
function onSquare(index){
  const s=current();if(s.result||thinking||!humanTurn())return;
  if(selected>=0){
    const options=R().legalMoves(s).filter(m=>m.from===selected&&m.to===index);
    if(options.length){
      if(options.some(m=>m.promotion)){choosePromotion(options);return;}
      commit(options[0]);return;
    }
  }
  selected=side(s.board[index])===s.turn?index:-1;render();
}
function choosePromotion(options){
  els.promotionChoices.replaceChildren();
  for(const type of ['q','r','b','n']){
    const button=document.createElement('button');button.type='button';button.textContent=fleetMode?SHIP_NAME[type]:TYPES[type];
    button.addEventListener('click',()=>{els.promotionDialog.close();commit(options.find(m=>m.promotion===type));});
    els.promotionChoices.append(button);
  }
  els.promotionDialog.showModal();
}
function scheduleBot(){
  if(!botTurn()||current().result||autoPaused)return;
  const run=++botRun;
  const turn=current().turn;
  thinking=true;render();
  botTimer=setTimeout(()=>{
    botTimer=null;
    if(current().turn!==turn||current().result||run!==botRun||!botTurn()||autoPaused)return;
    if(fleetMode){const m=chooseFleetMove(current(),els.difficulty.value==='easy'?'easy':'strong');if(m)commit(m);return;}
    try{
      const worker=new Worker(new URL('./bot-worker.js',import.meta.url),{type:'module'});
      botWorker=worker;
      worker.onmessage=event=>{
        if(run!==botRun)return;
        worker.terminate();botWorker=null;
        if(current().turn===turn&&!current().result&&botTurn()&&!autoPaused&&event.data)commit(event.data);
      };
      worker.onerror=()=>{
        if(run!==botRun)return;
        worker.terminate();botWorker=null;
        const m=chooseBotMove(current(),els.difficulty.value);
        if(m)commit(m);
      };
      worker.postMessage({state:current(),difficulty:els.difficulty.value});
    }catch{
      const m=chooseBotMove(current(),els.difficulty.value);
      if(m)commit(m);
    }
  },fleetMode?1100:300);
}
function cancelBot(){
  if(botTimer)clearTimeout(botTimer);
  botTimer=null;
  if(botWorker){botWorker.terminate();botWorker=null;}
  botRun++;thinking=false;
}
function reset(){cancelBot();states=[R().initial()];log=[];selected=-1;lastMove=null;clockStartedAt=null;elapsedMs=0;autoPaused=false;render();if(botTurn())scheduleBot();}
els.newGame.addEventListener('click',reset);
els.mode.addEventListener('change',reset);
els.theme.addEventListener('change',()=>{pieceTheme=els.theme.value;localStorage.setItem('threeLayerChess.theme',pieceTheme);applyTheme();render();});
els.toggleAuto.addEventListener('click',()=>{
  if(els.mode.value!=='auto'||current().result)return;
  if(autoPaused){autoPaused=false;if(states.length>1)clockStartedAt=Date.now();render();scheduleBot();}
  else{autoPaused=true;cancelBot();stopClock();render();}
});
els.showMoves.addEventListener('change',()=>{showLegalMoves=els.showMoves.checked;localStorage.setItem('threeLayerChess.showMoves',showLegalMoves?'on':'off');render();});
els.view2d.addEventListener('click',()=>showView('2d'));
els.view3d.addEventListener('click',()=>showView('3d'));
els.layerFocus.addEventListener('change',draw3D);
els.showAllLayers.addEventListener('click',()=>{els.layerFocus.value='all';draw3D();});
els.topView.addEventListener('click',()=>{camera={tilt:0,yaw:0,zoom:1};cameraUpdate();});
els.resetView.addEventListener('click',()=>{camera={tilt:58,yaw:-30,zoom:1};els.layerFocus.value='all';draw3D();});
els.viewport.addEventListener('pointerdown',e=>{if(e.button!==0)return;drag={id:e.pointerId,x:e.clientX,y:e.clientY,moved:false};});
els.viewport.addEventListener('pointermove',e=>{
  if(!drag||drag.id!==e.pointerId)return;
  const dx=e.clientX-drag.x,dy=e.clientY-drag.y;
  if(!drag.moved&&Math.hypot(dx,dy)>4){drag.moved=true;els.viewport.setPointerCapture(e.pointerId);}
  if(drag.moved){camera.yaw+=dx*.4;camera.tilt=Math.max(0,Math.min(85,camera.tilt-dy*.35));drag.x=e.clientX;drag.y=e.clientY;cameraUpdate();}
});
els.viewport.addEventListener('pointerup',e=>{
  if(drag&&!drag.moved){
    let nearest=e.target.closest('.cell3d:not(.void)');
    if(!nearest){
      let distance=Infinity;
      for(const cell of els.world.querySelectorAll('.cell3d:not(.void)')){
        const r=cell.getBoundingClientRect(),dx=e.clientX-(r.left+r.right)/2,dy=e.clientY-(r.top+r.bottom)/2;
        if(Math.abs(dx)>r.width*.65||Math.abs(dy)>r.height*.65)continue;
        const d=dx*dx+dy*dy;
        if(d<distance){distance=d;nearest=cell;}
      }
    }
    if(nearest)onSquare(Number(nearest.dataset.index));
  }
  drag=null;
});
els.viewport.addEventListener('pointercancel',()=>{drag=null;});
els.undo.addEventListener('click',()=>{
  cancelBot();
  if(els.mode.value==='auto'){autoPaused=true;stopClock();}
  if(states.length<=1)return;
  const claimedDraw=states.length===log.length+2;
  const count=claimedDraw?1:els.mode.value==='bot'&&current().turn==='w'&&states.length>=3?2:1;
  for(let i=0;i<count;i++){states.pop();if(!claimedDraw)log.pop();}
  if(clockStartedAt===null&&states.length>1&&els.mode.value!=='auto')clockStartedAt=Date.now();
  if(states.length===1){clockStartedAt=null;elapsedMs=0;}
  lastMove=null;selected=-1;render();
  if(botTurn())scheduleBot();
});
els.claimDraw.addEventListener('click',()=>{if(!R().canClaimDraw(current()))return;const s={...current(),result:'引き分け（申告）'};states.push(s);selected=-1;stopClock();render();});
els.copyLog.addEventListener('click',async()=>{try{await navigator.clipboard.writeText(log.map((x,i)=>`${i+1}. ${x.side==='w'?'白':'黒'} ${x.text}`).join('\n'));els.copyLog.textContent='コピーしました';setTimeout(()=>els.copyLog.textContent='コピー',1800);}catch{els.copyLog.textContent='コピー不可';}});
setInterval(updateClock,1000);
window.addEventListener('piece-models-ready',()=>syncPieceModels(camera));
window.addEventListener('piece-models-resize',()=>syncPieceModels(camera));
initPieceModels(els.viewport,els.viewer);
initFleetFx();
function applyMode(){
  document.body.dataset.mode=fleetMode?'fleet':'chess';
  els.gameMode.value=fleetMode?'fleet':'chess';
  els.theme.disabled=fleetMode;els.seWrap.hidden=!fleetMode;els.fleetSe.checked=fleetSe();
  els.rulesChess.hidden=fleetMode;els.rulesFleet.hidden=!fleetMode;
  els.captureLabel.textContent=fleetMode?'撃沈':'取った駒';els.checkLabel.textContent=fleetMode?'攻撃':'チェック';
  els.capturedTitle.textContent=fleetMode?'撃沈した艦':'取った駒';
  els.capturedWhiteLabel.textContent=fleetMode?'星冠帝国軍(白)が撃沈':'白が取った駒';
  els.capturedBlackLabel.textContent=fleetMode?'地球星域防衛軍(黒)が撃沈':'黒が取った駒';
  const lg=document.querySelector('.legend');if(lg)lg.innerHTML=fleetMode?'<i class="mark move"></i>移動先 <i class="mark capture"></i>攻撃できる艦 <i class="mark selected"></i>選択中':'<i class="mark move"></i>移動先 <i class="mark capture"></i>取れる駒 <i class="mark selected"></i>選択中';
  setPieceTheme(fleetMode?'fleet':pieceTheme);
}
els.gameMode.addEventListener('change',()=>{
  fleetMode=els.gameMode.value==='fleet';localStorage.setItem('threeLayerChess.gameMode',fleetMode?'fleet':'chess');
  applyMode();
  if(els.bgmSelect.value!=='off'){const want=fleetMode?'fleet-battle':'forest';els.bgmSelect.value=want;setBgm(want);}
  reset();
});
els.fleetSe.addEventListener('change',()=>setFleetSe(els.fleetSe.checked));
applyTheme();
applyMode();
render();

{
  const saved=getSaved();
  els.bgmSelect.innerHTML=`<option value="off">無音</option>`+TRACKS.map((t,i)=>`<option value="${t.id}">${i+1}. ${t.name}</option>`).join('');
  els.bgmSelect.value=saved.track;els.bgmVolume.value=Math.round(saved.volume*100);
  initBgm(saved);
  const showStatus=()=>{document.getElementById('bgmStatus').textContent=bgmStatusText();};
  setInterval(showStatus,500);showStatus();
  els.bgmSelect.addEventListener('change',()=>setBgm(els.bgmSelect.value));
  els.bgmVolume.addEventListener('input',()=>setBgmVolume(els.bgmVolume.value/100));
}
