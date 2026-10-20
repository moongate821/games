(() => {
  'use strict';
  const C=window.ABYSSAL_CONTENT,R=window.AbyssalPuppets;
  const canvas=document.getElementById('game'),g=canvas.getContext('2d'),overlay=document.getElementById('overlay'),panel=document.getElementById('panel');
  const W=960,H=540,TAU=Math.PI*2,keys=new Set(),rand=(a,b)=>a+Math.random()*(b-a),clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
  const dist=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
  let state='loading',world=null,t=0,last=0,weapon=0,selectedStage=0,galleryKind='enemies',galleryPage=0,muted=false,serial=0,assetReport;
  let autoFire=false;
  let best=0;try{best=Number(localStorage.getItem('abyssal-v2-best'))||0;}catch{}
  const weaponBar=document.getElementById('weaponBar');
  weaponBar.innerHTML=C.weapons.map(w=>`<button data-weapon="${w.id}" title="${w.description}"><small>${(w.id+1)%10}</small>${w.name}</button>`).join('');
  weaponBar.addEventListener('click',e=>{const b=e.target.closest('[data-weapon]');if(b)selectWeapon(+b.dataset.weapon);});
  function selectWeapon(id){weapon=(id+10)%10;weaponBar.querySelectorAll('button').forEach((b,i)=>{b.classList.toggle('selected',i===weapon);b.setAttribute('aria-pressed',String(i===weapon));});if(world)world.player.fire=0;}
  selectWeapon(0);
  const show=html=>{panel.innerHTML=html;overlay.classList.remove('hidden');};
  const hide=()=>overlay.classList.add('hidden');
  addEventListener('pointerdown',()=>AbyssalAudio.unlock());
  addEventListener('keydown',()=>AbyssalAudio.unlock());
  function sound(freq,duration=.08,type='sine',volume=.035){if(!muted)AbyssalAudio.unlock()?.ping(freq,duration,type,volume);}
  function attackSound(id){if(!muted)AbyssalAudio.unlock()?.attack(id,world?.player.level||1);}
  function title(){state='title';show(`<div class="kicker">TWELVE SEAS EXPEDITION</div><h2>ABYSSAL <span>CURRENT</span></h2><p class="jp">深海機兵 ― 十二海域</p><div class="feature"><span>12面 / 12ボス</span><span>敵20種の行動</span><span>攻撃10種</span><span>関節アニメーション</span></div><p>機械海獣の中枢を破壊せよ。<br>連続撃破でスコア倍率UP。ゲージ満タンで特殊攻撃！<br>武器は出撃中も自由に切り替えられます。</p><div class="menuButtons"><button class="primary" data-action="campaign">第1海域から出撃</button><button data-action="missions">海域・武器を選ぶ</button><button data-action="gallery">動く機体図鑑</button></div>${assetReport?.missing.length?'<p class="small">素材制作中：一部の機体・背景は仮素材です。図鑑で確認できます。</p>':''}`);}
  function missions(){state='missions';show(`<div class="kicker">MISSION SELECT</div><h2>海域を<span>選択</span></h2><div class="missionGrid">${C.stages.map(s=>`<button data-stage="${s.id}" class="${selectedStage===s.id?'selected':''}"><b>${String(s.id+1).padStart(2,'0')}</b> ${s.name}</button>`).join('')}</div><p>装備：<strong style="color:${C.weapons[weapon].color}">${C.weapons[weapon].name}</strong> — 画面下のボタンで変更</p><div class="menuButtons"><button class="primary" data-action="practice">この海域から出撃</button><button data-action="boss">この海域のボスと戦う</button><button data-action="title">戻る</button></div>`);}
  function gallery(){state='gallery';hide();document.getElementById('galleryControls').hidden=false;updateGalleryControls();}
  function updateGalleryControls(){document.getElementById('galleryControls').innerHTML=`<button data-gkind="enemies" class="${galleryKind==='enemies'?'selected':''}">小型敵20種</button><button data-gkind="bosses" class="${galleryKind==='bosses'?'selected':''}">ボス12種</button><button data-gkind="player" class="${galleryKind==='player'?'selected':''}">自機</button><button data-gkind="stages" class="${galleryKind==='stages'?'selected':''}">背景12面</button><button data-gpage="-1">◀</button><button data-gpage="1">▶</button><button data-action="title">戻る</button>`;}
  const galleryControls=document.createElement('div');galleryControls.id='galleryControls';galleryControls.className='galleryControls';galleryControls.hidden=true;canvas.parentElement.insertAdjacentElement('afterend',galleryControls);
  document.addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;
    if(b.dataset.stage!==undefined){selectedStage=+b.dataset.stage;missions();}
    if(b.dataset.gkind){galleryKind=b.dataset.gkind;galleryPage=0;updateGalleryControls();}
    if(b.dataset.gpage){const len=galleryKind==='enemies'?4:galleryKind==='bosses'?4:galleryKind==='stages'?12:1;galleryPage=(galleryPage+Number(b.dataset.gpage)+len)%len;}
    if(b.dataset.action){const a=b.dataset.action;galleryControls.hidden=true;
      if(a==='title')title();if(a==='missions')missions();if(a==='gallery')gallery();if(a==='campaign')start(0);if(a==='practice')start(selectedStage);if(a==='boss')start(selectedStage,true);if(a==='resume')pause();if(a==='restart')start(world.startStage,world.bossOnly);if(a==='next')nextStage();}
  });
  function start(stage,bossOnly=false){
    world={stage,startStage:stage,bossOnly,elapsed:0,scroll:0,score:0,spawn:1.2,kills:0,sequence:0,uid:0,chain:0,chainTimer:0,bestChain:0,burst:0,energy:35,boss:null,bossSpawned:false,clear:0,shake:0,flash:0,
      enemies:[],shots:[],hostile:[],particles:[],effects:[],pickups:[],debris:[],player:{x:125,y:270,r:11,hp:4,maxHP:4,lives:3,inv:2,fire:0,bomb:0,level:1,tilt:0}};
    world.plan=AbyssalEncounters.plan(stage,C.stages[stage].duration,C.stages[stage].enemies);world.eventIndex=0;world.waveIndex=0;world.groups={};world.notice=null;
    state='playing';hide();galleryControls.hidden=true;keys.clear();if(bossOnly)spawnBoss();sound(520,.18,'triangle');
  }
  function nextStage(){if(world.stage===11||world.bossOnly){finish(true);return;}const p=world.player,score=world.score,lives=p.lives,hp=Math.min(4,p.hp+1),level=p.level,energy=world.energy,startStage=world.startStage;start(world.stage+1);world.startStage=startStage;world.score=score;world.player.lives=lives;world.player.hp=hp;world.player.level=level;world.energy=energy;}
  function finish(won){state=won?'victory':'gameover';best=Math.max(best,world.score);try{localStorage.setItem('abyssal-v2-best',best);}catch{}show(`<div class="kicker">${won?'MISSION COMPLETE':'SIGNAL LOST'}</div><h2>${won?'海域<span>制圧</span>':'GAME <span>OVER</span>'}</h2><p>SCORE ${world.score.toLocaleString()} / BEST ${best.toLocaleString()}</p><div class="menuButtons"><button class="primary" data-action="restart">もう一度出撃</button><button data-action="missions">海域を選択</button><button data-action="title">タイトル</button></div>`);}
  function pause(){if(state==='playing'){state='paused';keys.clear();show('<div class="kicker">SYSTEM HOLD</div><h2>PAUSED</h2><div class="menuButtons"><button class="primary" data-action="resume">再開する</button><button data-action="title">タイトルへ戻る</button></div>');}else if(state==='paused'){state='playing';hide();last=performance.now();}}
  document.getElementById('pauseButton').onclick=pause;
  document.getElementById('soundButton').onclick=e=>{const engine=AbyssalAudio.get();if(engine?.ctx.state==='suspended'){muted=false;AbyssalAudio.unlock();}else muted=!muted;e.currentTarget.textContent=muted?'♪ OFF':'♪ ON';};
  document.getElementById('autoButton').onclick=e=>{autoFire=!autoFire;e.currentTarget.textContent=autoFire?'連射 ON':'連射 OFF';e.currentTarget.setAttribute('aria-pressed',String(autoFire));};
  document.getElementById('burstTouch').onclick=activateBurst;
  document.getElementById('fullscreenButton').onclick=()=>{const el=document.querySelector('.shell');if(document.fullscreenElement)document.exitFullscreen?.();else el.requestFullscreen?.().catch(()=>{});};
  document.getElementById('weaponTouch').onclick=()=>selectWeapon(weapon+1);
  addEventListener('keydown',e=>{if(['Space','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.code))e.preventDefault();keys.add(e.code);if(e.repeat)return;
    if(e.code==='KeyP'||e.code==='Escape'){if(state==='gallery'){galleryControls.hidden=true;title();}else pause();}
    if(e.code==='KeyC')activateBurst();
    if(e.code==='KeyQ')selectWeapon(weapon-1);if(e.code==='KeyE')selectWeapon(weapon+1);if(/^Digit[0-9]$/.test(e.code))selectWeapon((+e.code.slice(5)+9)%10);
    if(e.code==='Enter'){if(state==='title')start(0);else if(state==='paused')pause();else if(state==='clear')nextStage();else if(state==='gameover'||state==='victory')start(world.startStage,world.bossOnly);}
  });
  addEventListener('keyup',e=>keys.delete(e.code));addEventListener('blur',()=>{keys.clear();if(state==='playing')pause();});
  document.querySelectorAll('[data-key]').forEach(b=>{b.addEventListener('pointerdown',e=>{e.preventDefault();b.setPointerCapture(e.pointerId);keys.add(b.dataset.key);});for(const event of ['pointerup','pointercancel','lostpointercapture'])b.addEventListener(event,()=>keys.delete(b.dataset.key));});
  const padKeys=new Set();
  const held=code=>keys.has(code)||padKeys.has(code);
  let padPrevious=[],padIndex=null,padMenuDirection=0,padMenuNext=0;
  const padStatus=document.createElement('p');padStatus.className='gamepadHelp';
  padStatus.textContent='コントローラー：接続後にボタンを押してください';
  document.querySelector('.help').after(padStatus);
  function pollGamepad(now){
    padKeys.clear();
    const pads=navigator.getGamepads?Array.from(navigator.getGamepads()):[];
    const pad=pads.find(p=>p&&p.index===padIndex)||pads.find(p=>p&&p.connected);
    if(!pad){if(padIndex!==null&&state==='playing')pause();padIndex=null;padPrevious=[];padStatus.textContent='コントローラー：接続後にボタンを押してください';return;}
    if(pad.index!==padIndex){padIndex=pad.index;padPrevious=[];}
    padStatus.textContent='コントローラー接続中：左スティック / 十字キー 移動・下ボタン 攻撃 / 決定・右ボタン ボム / 戻る・LB/RB 武器・LT 特殊攻撃・START 停止';
    const buttons=pad.buttons.map(b=>b.pressed||b.value>.5),pressed=i=>buttons[i]&&!padPrevious[i];
    if(!document.hasFocus()){padPrevious=buttons;return;}
    const x=pad.axes[0]||0,y=pad.axes[1]||0;
    const left=buttons[14]||x<-.25,right=buttons[15]||x>.25,up=buttons[12]||y<-.25,down=buttons[13]||y>.25;
    if(state==='playing'){
      if(left)padKeys.add('ArrowLeft');if(right)padKeys.add('ArrowRight');if(up)padKeys.add('ArrowUp');if(down)padKeys.add('ArrowDown');
      if(buttons[0]||buttons[2]||buttons[7])padKeys.add('Space');if(buttons[1]||buttons[3])padKeys.add('KeyX');
      if(pressed(6))activateBurst();
      if(buttons[10])padKeys.add('ShiftLeft');
      if(pressed(4))selectWeapon(weapon-1);if(pressed(5))selectWeapon(weapon+1);
      if(pressed(9)){padKeys.clear();pause();}
    }else{
      if(pressed(9)){if(state==='paused')pause();else if(state==='title')start(0);}
      else if(pressed(1)){if(state==='paused')pause();else if(state==='missions'||state==='gallery'){galleryControls.hidden=true;title();}}
      else{
        const container=state==='gallery'?galleryControls:panel;
        const choices=Array.from(container.querySelectorAll('button')).filter(b=>!b.disabled&&b.getClientRects().length);
        const direction=down||right?1:up||left?-1:0;
        if(direction&&(direction!==padMenuDirection||now>=padMenuNext)&&choices.length){
          let index=choices.indexOf(document.activeElement);index=index<0?(direction>0?0:choices.length-1):(index+direction+choices.length)%choices.length;
          choices[index].focus({preventScroll:true});padMenuNext=now+(direction!==padMenuDirection?350:150);
        }
        padMenuDirection=direction;
        if(pressed(0)&&choices.length)(choices.includes(document.activeElement)?document.activeElement:choices[0]).click();
      }
    }
    padPrevious=buttons;
  }
  function particles(x,y,color,n=10,size=1){for(let i=0;i<n;i++){const a=rand(0,TAU),s=rand(25,160)*size;world.particles.push({x,y,vx:Math.cos(a)*s,vy:Math.sin(a)*s,life:rand(.25,.8),max:.8,color,size:rand(1.5,4)*size});}}
  const living=()=>[...world.enemies,...(world.boss&&!world.boss.dead?[world.boss]:[])].filter(e=>!e.dead);
  const nearest=(x,y,range=Infinity)=>living().filter(e=>Math.hypot(e.x-x,e.y-y)<range).sort((a,b)=>Math.hypot(a.x-x,a.y-y)-Math.hypot(b.x-x,b.y-y))[0];
  function damage(e,amount,x=e.x,y=e.y){if(e.dead)return;e.hp-=amount;e.flash=.16;particles(x,y,'#ffcc85',2);if(e.hp>0)return;
    e.dead=true;world.kills++;world.chain++;world.chainTimer=3.6;world.bestChain=Math.max(world.bestChain,world.chain);world.energy=clamp(world.energy+(e.isBoss?30:7),0,100);world.score+=(e.isBoss?3500+(world.stage*400):e.def.score)*Math.min(4,1+Math.floor(world.chain/5));particles(e.x,e.y,e.isBoss?'#ffac67':'#75ecdf',e.isBoss?65:15,e.isBoss?2:1);sound(e.isBoss?80:150,e.isBoss?.7:.08,'sawtooth',.045);
    if(e.entry){const group=e.entry.group;world.groups[group]=(world.groups[group]||0)+1;if(world.groups[group]===e.entry.count){world.score+=800;world.notice={name:'編隊撃破 +800',until:world.elapsed+1.6};world.pickups.push({x:clamp(e.x,80,870),y:e.y,type:'power',life:9});}}
    for(let col=0;col<4;col++)detach(e,col);
    if(e.isBoss){world.clear=3;world.hostile=[];world.shake=12;}
    else if(world.kills%7===0)world.pickups.push({x:e.x,y:e.y,type:world.kills%14===0?'armor':'power',life:9});
  }
  function detach(e,col){world.debris.push({img:R.part(e.def.sheet,e.def.row,col),x:e.x,y:e.y,vx:rand(-100,90),vy:rand(-100,40),a:rand(-1,1),spin:rand(-3,3),life:1.8,size:e.def.size*(col===0?.55:.3)});}
  function hitPlayer(){const p=world.player;if(p.inv>0||state!=='playing')return;p.hp--;world.chain=0;world.chainTimer=0;p.inv=1.8;world.shake=6;particles(p.x,p.y,'#ffad80',20);sound(90,.2,'sawtooth');if(p.hp<=0){p.lives--;if(p.lives<=0){finish(false);return;}p.hp=p.maxHP;p.level=Math.max(1,p.level-1);p.inv=3;p.x=125;p.y=270;}}
  function shot(x,y,vx,vy,extra={}){world.shots.push({id:++serial,x,y,ox:x,oy:y,vx,vy,t:0,life:2,r:4,damage:1,kind:weapon,level:world.player.level,color:C.weapons[weapon].color,hit:new Set(),...extra});}
  function fire(){const p=world.player,w=C.weapons[weapon],x=p.x+30,y=p.y,scale=1+(p.level-1)*.2;p.fire=w.cooldown;
    const add=(vx,vy,extra={})=>shot(x,y,vx,vy,{damage:scale,...extra});
    if(weapon===0){add(720,0);if(p.level>=3){shot(x,y-9,700,0,{damage:.6,color:w.color});shot(x,y+9,700,0,{damage:.6,color:w.color});}}
    if(weapon===1)for(let i=-2;i<=2;i++)add(Math.cos(i*.19)*580,Math.sin(i*.19)*580,{damage:.7*scale});
    if(weapon===2)add(1300,0,{damage:.6*scale,pierce:true,r:6,life:.85,length:90});
    if(weapon===3){add(280,-75,{homing:true,damage:3*scale,r:5,life:3});shot(x,y+10,280,75,{homing:true,damage:3*scale,r:5,life:3,color:w.color});}
    if(weapon===4)add(500,0,{wave:true,pierce:true,damage:1.8*scale,r:12,life:2.2});
    if(weapon===5)for(let i=0;i<2;i++)add(650,0,{helix:true,phase:i*Math.PI,damage:1.1*scale,r:5});
    if(weapon===6)for(let i=-4;i<=4;i++)add(Math.cos(i*.12)*rand(470,700),Math.sin(i*.12)*650,{damage:2*scale,life:.55,r:5});
    if(weapon===7)add(90,0,{mine:true,life:1.5,damage:9*scale,r:10});
    if(weapon===8){let from={x,y},used=new Set();for(let n=0;n<4;n++){let target=living().filter(e=>!used.has(e)&&dist(e,from)<(n?190:360)).sort((a,b)=>dist(a,from)-dist(b,from))[0];if(!target)break;used.add(target);world.effects.push({kind:'lightning',x:from.x,y:from.y,tx:target.x,ty:target.y,life:.16,max:.16,color:w.color});damage(target,(4-n*.7)*scale);from={x:target.x,y:target.y};}if(!used.size)add(500,0,{damage:2,r:7});}
    if(weapon===9){for(let i=0;i<3;i++){const a=t*2+i*TAU/3;shot(p.x+Math.cos(a)*40,p.y+Math.sin(a)*35,610,Math.sin(a)*45,{damage:1.1*scale,color:w.color});}}
    attackSound(weapon);
  }
  function activateBurst(){
    if(state!=='playing'||world.energy<100||world.burst>0)return false;
    world.energy=0;world.burst=2.2;world.player.inv=Math.max(world.player.inv,.7);world.shake=8;
    world.notice={name:'OVERDRIVE — 弾を貫け！',until:world.elapsed+1.8};
    particles(world.player.x+25,world.player.y,'#99ffff',30,1.5);
    if(!muted)AbyssalAudio.unlock()?.overdrive(world.player.level);
    return true;
  }
  function bomb(){const p=world.player;p.bomb=.8;shot(p.x+15,p.y+12,260,140,{kind:10,color:'#ffd18b',r:7,damage:8,life:1.8,gravity:170,bomb:true});attackSound(10);}
  function explode(s){if(s.exploded)return;s.exploded=true;s.dead=true;const radius=s.mine?105:80;world.effects.push({kind:'ring',x:s.x,y:s.y,r:radius,life:.35,max:.35,color:s.color});particles(s.x,s.y,s.color,20);for(const e of living())if(dist(s,e)<radius+e.r)damage(e,s.damage);if(!muted)AbyssalAudio.unlock()?.explosion(world.player.level);}
  function spawnEnemy(entry){const def=C.enemies[entry.id],pose=AbyssalEncounters.pose({entry},0,world.stage);world.enemies.push({id:++serial,def,entry,...pose,base:pose.y,r:def.size*.27,hp:def.hp*(1+world.stage*.04),maxHP:def.hp,t:0,fire:entry.kind===4?1.8:1.2+entry.slot*.13,flash:0,dead:false,volley:0,warning:null});}
  function enemyAttack(e){
    const a=e.warning.angle,x=e.x-18,y=e.y,k=e.entry.kind,speed=145+world.stage*3;
    const emit=(angle,v=speed,r=5,extra={})=>hostile(x,y,angle,v,r,extra);
    if(k===0||k===2){emit(a);if(world.stage>5)emit(a,.8*speed);}
    if(k===1){for(let i=-1;i<=1;i++)emit(Math.PI+i*.22,speed,5,{color:'#ffa56d'});}
    if(k===3){for(let i=-1;i<=1;i++)emit(a+i*.24,125,6,{color:'#e7a8ff',curve:i*.28});}
    if(k===4){emit(a,250,5,{color:'#ffdc76'});emit(a,175,5,{color:'#ffdc76'});}
    if(k===5){for(let i=-1;i<=1;i++)emit(a+i*.25,165,8,{color:'#80efdf',breakable:true,gravity:30});}
    if(k===6){emit(Math.PI,speed,5,{wave:true,base:y,color:'#e7a8ff'});}
    if(k===7){if(e.entry.slot===0){for(let i=-2;i<=2;i++)emit(Math.PI+i*.2,125,9,{color:'#80efdf',breakable:true});}else emit(a,170);}
    e.warning=null;e.volley++;e.fire=2.6+e.entry.slot*.14;
  }
  function hostile(x,y,angle,speed=180,r=5,extra={}){world.hostile.push({x,y,vx:Math.cos(angle)*speed,vy:Math.sin(angle)*speed,r,life:7,t:0,color:'#ff9a90',...extra});}
  function aim(x,y){return Math.atan2(world.player.y-y,world.player.x-x);}
  function spawnBoss(){const def=C.bosses[world.stage];world.bossSpawned=true;world.boss={id:++serial,isBoss:true,def,x:W+160,y:270,base:270,r:def.size*.25,hp:def.hp,maxHP:def.hp,t:0,fire:2.5,phase:1,flash:0,dead:false,broken:[],partHP:[Infinity,50,45,45],attack:0,warning:null};world.enemies=[];world.hostile=[];sound(130,.4,'sawtooth',.03);}
  function bossAttack(b){const id=b.def.id,x=b.x-b.def.size*.3,y=b.y,a=aim(x,y),phase=b.phase,n=4+phase;
    const fan=(count,spread,speed=170,angle=a)=>{for(let i=0;i<count;i++)hostile(x,y,angle+(i-(count-1)/2)*spread,speed);};
    const cycle=b.attack%3;
    if(cycle===1){
      const gap=135+((id*43+Math.floor(b.attack/3)*79)%260);
      for(let yy=100;yy<=440;yy+=28)if(Math.abs(yy-gap)>50)hostile(x,yy,Math.PI,120+phase*15,7,{color:'#80efdf',breakable:true});
    }else if(cycle===2){
      const count=9+phase*2;
      for(let i=0;i<count;i++)hostile(x,y,Math.PI+(i-(count-1)/2)*.19,110,5,{curve:(id%2?1:-1)*.13,color:'#e7a8ff'});
    }else switch(id){
      case 0:fan(3+phase,.16);break;
      case 1:for(let i=0;i<2;i++)for(let j=0;j<4;j++)hostile(x,y+(i?55:-55),Math.PI+(j-1.5)*.15,210,5);break;
      case 2:for(let i=0;i<10+phase*2;i++)hostile(b.x,b.y,i*TAU/(10+phase*2)+b.t*.2,130);break;
      case 3:fan(n,.11,145);for(let i=0;i<3;i++)hostile(x,y,Math.PI+rand(-.7,.7),120,9,{gravity:90});break;
      case 4:for(let i=-1;i<=1;i++)hostile(x,y+i*45,Math.PI,185,6,{wave:true,base:y+i*45});break;
      case 5:fan(7,.21,150,Math.PI);break;
      case 6:for(let i=0;i<5;i++)hostile(rand(300,920),65,Math.PI/2,120+phase*20,6);break;
      case 7:b.warning={y:clamp(world.player.y,120,420),timer:.85};fan(3,.3,130);break;
      case 8:fan(5,.15,240);break;
      case 9:for(let i=0;i<6;i++)hostile(x,y+(i-2.5)*25,Math.PI,150+phase*20,9);break;
      case 10:for(let i=0;i<7;i++)hostile(x,y,Math.PI+(i-3)*.17,150,6,{homing:i%3===0});break;
      case 11:fan(5+phase,.18,200);for(let i=0;i<8;i++)hostile(b.x,b.y,i*TAU/8+b.t,120);if(b.attack%3===0)b.warning={y:world.player.y,timer:1};break;
    }
    if(phase>1&&!b.broken.includes(2))hostile(x,b.y-50,a-.15,210);
    if(phase>2&&!b.broken.includes(3))hostile(x,b.y+50,a+.15,210);
    b.attack++;b.fire=cycle===2?2.8:Math.max(1.4,2.1-phase*.12+b.broken.length*.12);
  }
  function update(dt){
    if(state!=='playing'||!world)return;
    const p=world.player,z=C.stages[world.stage];world.elapsed+=dt;world.scroll+=dt*60;world.shake=Math.max(0,world.shake-dt*25);p.inv=Math.max(0,p.inv-dt);p.fire-=dt;p.bomb-=dt;
    const moveSpeed=held('ShiftLeft')||held('ShiftRight')?140:280;
    let dx=(held('ArrowRight')||held('KeyD')?1:0)-(held('ArrowLeft')||held('KeyA')?1:0),dy=(held('ArrowDown')||held('KeyS')?1:0)-(held('ArrowUp')||held('KeyW')?1:0);const len=Math.hypot(dx,dy)||1;
    p.x=clamp(p.x+dx/len*dt*moveSpeed,35,W-45);p.y=clamp(p.y+dy/len*dt*moveSpeed,82,H-72);p.tilt+=(dy*.12-p.tilt)*Math.min(1,dt*9);
    if((autoFire||held('Space')||held('KeyZ'))&&p.fire<=0)fire();if(held('KeyX')&&p.bomb<=0)bomb();
    world.chainTimer=Math.max(0,world.chainTimer-dt);if(!world.chainTimer)world.chain=0;
    if(world.burst>0){world.burst=Math.max(0,world.burst-dt);for(const e of living())if(e.x>p.x&&Math.abs(e.y-p.y)<e.r+30)damage(e,32*dt*(1+(p.level-1)*.2));
      for(const s of world.hostile)if(s.x>p.x&&Math.abs(s.y-p.y)<s.r+34){s.dead=true;particles(s.x,s.y,'#aaffff',2);world.score+=10;}}
    if(!world.bossSpawned){
      while(world.waveIndex<world.plan.waves.length&&world.elapsed>=world.plan.waves[world.waveIndex].time){const wave=world.plan.waves[world.waveIndex++];world.notice={...wave,until:world.elapsed+1.4};}
      while(world.eventIndex<world.plan.events.length&&world.elapsed>=world.plan.events[world.eventIndex].time)spawnEnemy(world.plan.events[world.eventIndex++]);
    }
    if(!world.bossSpawned&&world.elapsed>=z.duration)spawnBoss();
    for(const e of world.enemies){if(e.dead)continue;e.t+=dt;e.fire-=dt;e.flash=Math.max(0,e.flash-dt);const m=e.def.mode;let speed=e.def.speed;
      const pose=AbyssalEncounters.pose(e,e.t,world.stage);e.x=pose.x;e.y=pose.y;
      if(e.entry.kind===5)e.y=seabed(e.x,world.scroll)-e.def.size*.25;
      // Lock aim at the start of the warning: moving after the cue evades the shot.
      if(e.warning){e.warning.timer-=dt;if(e.warning.timer<=0&&e.x>p.x+65)enemyAttack(e);else if(e.warning.timer<=0){e.warning=null;e.fire=1;}}
      else if(e.fire<=0&&e.x<900&&e.x>p.x+100&&e.t>1){e.warning={angle:aim(e.x,e.y),timer:.65};}
      if(dist(e,p)<e.r+p.r)hitPlayer();
    }
    const b=world.boss;
    if(b&&!b.dead){b.t+=dt;b.flash=Math.max(0,b.flash-dt);b.phase=b.hp/b.maxHP<.3?3:b.hp/b.maxHP<.65?2:1;b.x+=((b.x>W-170)?-120:0)*dt;b.y=270+Math.sin(b.t*(.7+b.def.id%3*.25))*([80,110,60][b.def.id%3]);
      if(b.def.id===8&&b.x<=W-170)b.x=W-190-Math.max(0,Math.sin(b.t*.8))*150;
      if(b.t>3){b.fire-=dt;if(b.fire<=0)bossAttack(b);}
      if(b.warning){b.warning.timer-=dt;if(b.warning.timer<=0){world.effects.push({kind:'beam',x:0,y:b.warning.y,tx:b.x,life:.48,max:.48,color:'#ff655e'});b.warning=null;}}
      if(dist(b,p)<b.r+p.r)hitPlayer();
    }
    for(const s of world.shots){if(s.dead)continue;s.t+=dt;s.life-=dt;
      if(s.homing){const target=nearest(s.x,s.y);if(target){let a=Math.atan2(target.y-s.y,target.x-s.x);s.vx+=(Math.cos(a)*410-s.vx)*Math.min(1,dt*4);s.vy+=(Math.sin(a)*410-s.vy)*Math.min(1,dt*4);}}
      if(s.gravity)s.vy+=s.gravity*dt;s.x+=s.vx*dt;s.y+=s.vy*dt;
      if(s.wave)s.y=s.oy+Math.sin(s.t*8)*45;if(s.helix)s.y=s.oy+Math.sin(s.t*13+s.phase)*26;
      if(s.mine&&(s.life<=0||living().some(e=>dist(e,s)<e.r+65))){explode(s);continue;}
      if(s.bomb&&(s.life<=0||s.y>470)){explode(s);continue;}
      for(const e of living()){if(s.hit.has(e.id))continue;
        if(e.isBoss){const ns=R.transforms(R.nodes('boss',e.def.id,t));for(let k=1;k<4;k++){if(e.broken.includes(k))continue;const target={x:e.x+ns[k].x*e.def.size,y:e.y+ns[k].y*e.def.size};if(dist(s,target)<25+s.r&&!s.hit.has(`${e.id}:${k}`)){e.partHP[k]-=s.damage;s.hit.add(`${e.id}:${k}`);if(e.partHP[k]<=0){e.broken.push(k);detach(e,k);world.score+=500;particles(target.x,target.y,'#ffc883',15);}if(!s.pierce)s.dead=true;break;}}}
        if(s.dead)break;
        if(dist(s,e)<e.r+s.r){if(s.bomb){explode(s);break;}damage(e,s.damage,s.x,s.y);s.hit.add(e.id);if(!s.pierce){s.dead=true;break;}}
      }
    }
    for(const s of world.hostile){if(s.dead)continue;s.life-=dt;s.t+=dt;if(s.curve){const a=s.curve*dt,vx=s.vx;s.vx=vx*Math.cos(a)-s.vy*Math.sin(a);s.vy=vx*Math.sin(a)+s.vy*Math.cos(a);}if(s.breakable){for(const shot of world.shots){if(!shot.dead&&dist(shot,s)<shot.r+s.r+2){s.dead=true;if(!shot.pierce)shot.dead=true;world.score+=20;world.energy=clamp(world.energy+1,0,100);particles(s.x,s.y,'#80efdf',3);break;}}if(s.dead)continue;}if(s.gravity)s.vy+=s.gravity*dt;if(s.homing&&s.t<1.5){const a=aim(s.x,s.y);s.vx+=(Math.cos(a)*180-s.vx)*dt;s.vy+=(Math.sin(a)*180-s.vy)*dt;}s.x+=s.vx*dt;s.y+=s.vy*dt;if(s.wave)s.y=s.base+Math.sin(s.t*5)*45;if(dist(s,p)<s.r+p.r){s.dead=true;hitPlayer();}}
    for(const e of world.effects){e.life-=dt;if(e.kind==='beam'&&p.x<e.tx&&Math.abs(p.y-e.y)<12)hitPlayer();}
    for(const v of world.particles){v.life-=dt;v.x+=v.vx*dt;v.y+=v.vy*dt;v.vx*=.98;v.vy*=.98;}
    for(const v of world.debris){v.life-=dt;v.x+=v.vx*dt;v.y+=v.vy*dt;v.vy+=100*dt;v.a+=v.spin*dt;}
    for(const v of world.pickups){v.life-=dt;const reach=dist(v,p);if(reach<135){v.x+=(p.x-v.x)*dt*4;v.y+=(p.y-v.y)*dt*4;}else v.x-=45*dt;if(dist(v,p)<25){v.life=0;if(v.type==='armor'){p.hp=Math.min(4,p.hp+1);sound(800,.14);}else{const old=p.level;p.level=Math.min(3,p.level+1);if(p.level>old&&!muted)AbyssalAudio.unlock()?.upgrade(p.level);else sound(800,.14);}world.score+=200;}}
    world.enemies=world.enemies.filter(e=>!e.dead&&e.x>-120);world.shots=world.shots.filter(s=>!s.dead&&s.life>0&&s.x<W+180&&s.y>20&&s.y<H);world.hostile=world.hostile.filter(s=>!s.dead&&s.life>0&&s.x>-30&&s.x<W+50&&s.y>40&&s.y<H-40);
    for(const name of ['effects','particles','debris','pickups'])world[name]=world[name].filter(v=>v.life>0);
    if(world.clear>0){world.clear-=dt;if(world.clear<=0){if(world.stage===11||world.bossOnly)finish(true);else{state='clear';show(`<div class="kicker">ZONE ${world.stage+1} CLEARED</div><h2>海域<span>制圧</span></h2><p>次の海域：${C.stages[world.stage+1].name}</p><button class="primary" data-action="next">次の海域へ Enter</button>`);}}}
  }
  const text=(s,x,y,size=14,color='#e2fbff',align='left')=>{g.fillStyle=color;g.font=`bold ${size}px Consolas,"Yu Gothic",sans-serif`;g.textAlign=align;g.fillText(s,x,y);g.textAlign='left';};
  const circle=(x,y,r,color)=>{g.fillStyle=color;g.beginPath();g.arc(x,y,Math.max(0,r),0,TAU);g.fill();};
  function line(x,y,tx,ty,color,width=2){g.strokeStyle=color;g.lineWidth=width;g.beginPath();g.moveTo(x,y);g.lineTo(tx,ty);g.stroke();}
  // Terrain, props and ground enemies share a scrolling seabed coordinate.
  const seabed=(x,scroll)=>470+Math.sin((x+scroll*.9)*.007)*5+Math.sin((x+scroll*.9)*.019)*2;
  function contactShadow(x,y,width,opacity=.55){
    g.save();g.translate(x,y);g.scale(width,6);
    const shade=g.createRadialGradient(0,0,0,0,0,1);shade.addColorStop(0,`rgba(0,8,14,${opacity})`);shade.addColorStop(1,'rgba(0,8,14,0)');
    g.fillStyle=shade;g.fillRect(-1,-1,2,2);g.restore();
  }
  function terrain(scroll,front=false,stage=world?.stage??selectedStage){
    const z=C.stages[stage];
    g.beginPath();g.moveTo(-10,H);
    for(let x=-10;x<=W+10;x+=10)g.lineTo(x,seabed(x,scroll)+(front?20:0));
    g.lineTo(W+10,H);g.closePath();
    const soil=g.createLinearGradient(0,460,0,H);soil.addColorStop(0,front?'#17363b':'#25494b');soil.addColorStop(1,'#03131e');g.fillStyle=soil;g.fill();
    for(let i=0;i<150;i++){
      const x=((i*73.31-scroll*.9)%(W+30)+W+30)%(W+30)-15,y=seabed(x,scroll)+3+(i*17%45);
      if(front&&y<seabed(x,scroll)+22)continue;
      g.fillStyle=i%3===0?'#041c29':z.color+'26';g.beginPath();g.ellipse(x,y,1+i%5,.5+i%2,0,0,TAU);g.fill();
    }
  }
  function scenery(stage,scroll,front=false){
    const z=C.stages[stage],spacing=front?347:253,speed=front?.9:.9;
    // Fixed world indices keep silhouettes and scale continuous at wrap boundaries.
    const first=Math.floor(scroll*speed/spacing)-1;
    for(let i=first;i<first+7;i++){
      const n=((i%17)+17)%17,x=i*spacing-scroll*speed+Math.sin(i*9)*42;
      const size=front?100+n%3*17:92+n%4*15,y=seabed(x,scroll)+(front?34:8),col=n%3===0?1:0;
      contactShadow(x,y-2,size*.46,.7);
      g.save();g.filter=front?'brightness(0.62) saturate(0.7)':'brightness(0.78) saturate(0.75)';
      R.prop(g,z.props,z.propRow,col,x,y,size,t+i);g.restore();
      // Sediment covers the hard cutout edge and plant root.
      g.fillStyle=front?'#17363b':'#25494b';g.beginPath();g.ellipse(x,y-1,size*(col?.10:.32),3.5,0,0,TAU);g.fill();
      contactShadow(x,y-1,size*(col?.16:.4),.65);
    }
  }
  function water(stage,scroll){
    const z=C.stages[stage];
    g.fillStyle=z.color+'09';g.fillRect(0,50,W,H-90);
    const fog=g.createLinearGradient(0,350,0,505);fog.addColorStop(0,'#113c4600');fog.addColorStop(1,'#10303965');g.fillStyle=fog;g.fillRect(0,350,W,155);
    for(let i=0;i<36;i++){
      const x=((i*119-scroll*.34)%W+W)%W,y=60+((i*47-t*(2+i%3))%430+430)%430;
      circle(x,y,.5+i%3*.35,'#bcdfda30');
    }
  }
  const backgroundCache=new Map();
  function background(stage,scroll){const z=C.stages[stage],im=R.part(z.sheet,z.row);g.fillStyle='#041724';g.fillRect(0,0,W,H);
    if(im){let painted=backgroundCache.get(stage);if(!painted){painted=document.createElement('canvas');painted.width=im.width;const top=stage<3?Math.round(im.height*.18):0;painted.height=im.height-top;const cx=painted.getContext('2d');cx.filter='saturate(0.72) brightness(0.68)';cx.drawImage(im,0,top,im.width,im.height-top,0,0,painted.width,painted.height);backgroundCache.set(stage,painted);}
      const span=Math.max(W,painted.width*(H/painted.height)),offset=(scroll*.3)%(span*2);for(let i=-1;i<3;i++){const x=i*span-offset;if(x>W||x+span<0)continue;g.save();g.translate(x,0);if(i%2){g.translate(span,0);g.scale(-1,1);}g.drawImage(painted,0,0,span,H);g.restore();}}

    const haze=g.createLinearGradient(0,50,0,H);haze.addColorStop(0,'#163e4940');haze.addColorStop(.65,'#10343c50');haze.addColorStop(1,'#071e2ad9');g.fillStyle=haze;g.fillRect(0,0,W,H);
    terrain(scroll,false,stage);scenery(stage,scroll);
  }
  function drawShot(s){AbyssalProjectiles.player(g,s,t);}
  function drawWorld(){const p=world.player,b=world.boss;
    if(world.notice&&world.notice.until>world.elapsed){text(world.notice.name, W-28,102,14,'#a8eee3','right');}
    for(const e of world.enemies)if(e.warning){const a=e.warning.angle;g.save();g.setLineDash([6,9]);line(e.x-18,e.y,e.x-18+Math.cos(a)*200,e.y+Math.sin(a)*200,'#ffd48d75',1);g.restore();g.strokeStyle='#ffda94';g.lineWidth=2;g.beginPath();g.arc(e.x-18,e.y,10+(1-e.warning.timer/.65)*12,0,TAU);g.stroke();}
    if(b&&!b.dead&&b.t>3&&b.fire<.7){g.strokeStyle='#ffbd76';g.lineWidth=2;g.beginPath();g.arc(b.x-b.def.size*.3,b.y,20+(1-b.fire/.7)*17,0,TAU);g.stroke();}
    for(const e of world.enemies){if(['ground','turret'].includes(e.def.mode))contactShadow(e.x,seabed(e.x,world.scroll),e.def.size*.4);R.draw(g,e.def,e.x,e.y,e.def.size,t+e.id*.7,'enemy',{flash:e.flash,tilt:e.def.mode==='spin'?Math.sin(e.t)*.3:0});}
    if(b&&!b.dead){R.draw(g,b.def,b.x,b.y,b.def.size,t,'boss',{broken:b.broken,flash:b.flash,activity:b.phase*.2});
      if(b.warning){line(0,b.warning.y,b.x,b.warning.y,'#ff8479a0',2);text('WARNING • 熱線',b.x-120,b.warning.y-12,13,'#ffb49c','right');}
      g.fillStyle='#041824dd';g.fillRect(240,56,480,22);g.fillStyle=C.stages[world.stage].color;g.fillRect(243,72,474*Math.max(0,b.hp/b.maxHP),4);text(`${b.def.name}  /  PHASE ${b.phase}`,480,68,12,'#ffe1bb','center');
    }
    if(world.burst>0){g.save();g.globalCompositeOperation='lighter';const x=p.x+25,y=p.y,fade=Math.min(1,world.burst*3);g.globalAlpha=fade;line(x,y,W,y,'#32cee733',78);line(x,y,W,y,'#56f2f988',52);line(x,y,W,y,'#eaffff',17);for(let i=0;i<3;i++){g.strokeStyle=i%2?'#99ffff':'#7bbfff';g.lineWidth=2;g.beginPath();for(let q=x;q<=W;q+=12){const yy=y+Math.sin(q*.035-t*19+i*2)*22;q===x?g.moveTo(q,yy):g.lineTo(q,yy);}g.stroke();}g.restore();}
    for(const s of world.shots)drawShot(s);for(const s of world.hostile)AbyssalProjectiles.enemy(g,s,t);
    for(const e of world.effects){g.globalAlpha=clamp(e.life/e.max,0,1);if(e.kind==='ring'){g.strokeStyle=e.color;g.lineWidth=4;g.beginPath();g.arc(e.x,e.y,e.r*(1-e.life/e.max),0,TAU);g.stroke();}if(e.kind==='lightning'){for(let i=0;i<6;i++){const x=e.x+(e.tx-e.x)*i/6,y=e.y+(e.ty-e.y)*i/6;line(x,y,x+(e.tx-e.x)/6,e.y+(e.ty-e.y)*(i+1)/6+rand(-10,10),e.color,3);}}if(e.kind==='beam'){line(e.x,e.y,e.tx,e.y,e.color,24);line(e.x,e.y,e.tx,e.y,'#ffe5b4',7);}g.globalAlpha=1;}
    if(p.inv<=0||Math.floor(t*14)%2){R.draw(g,{id:0},p.x,p.y,90,t,'player',{activity:held('Space')?1:0,tilt:p.tilt});circle(p.x-32,p.y,5+Math.sin(t*40)*2,'#ffbd7da0');if(p.inv>0){g.strokeStyle='#8bffff80';g.lineWidth=2;g.beginPath();g.arc(p.x,p.y,35,0,TAU);g.stroke();}}
    if(weapon===9)for(let i=0;i<3;i++){let a=t*2+i*TAU/3;R.draw(g,{id:0},p.x+Math.cos(a)*40,p.y+Math.sin(a)*35,26,t+i,'player');}
    for(const v of world.debris){g.save();g.globalAlpha=clamp(v.life,0,1);g.translate(v.x,v.y);g.rotate(v.a);R.image(g,v.img,v.size,v.size);g.restore();}
    for(const v of world.particles){g.globalAlpha=clamp(v.life/v.max,0,1);circle(v.x,v.y,v.size,v.color);}g.globalAlpha=1;
    for(const v of world.pickups){circle(v.x,v.y,13,v.type==='armor'?'#346c86':'#724539');text(v.type==='armor'?'A':'P',v.x,v.y+5,15,'#fff5bf','center');}
    scenery(world.stage,world.scroll,true);terrain(world.scroll,true);water(world.stage,world.scroll);
    if(held('ShiftLeft')||held('ShiftRight')){g.strokeStyle='#fff';g.lineWidth=1;g.beginPath();g.arc(p.x,p.y,p.r,0,TAU);g.stroke();circle(p.x,p.y,2,'#fff');}
    hud();
  }
  function hud(){const p=world.player,z=C.stages[world.stage],w=C.weapons[weapon];g.fillStyle='#031725eb';g.fillRect(0,0,W,50);g.fillRect(0,H-40,W,40);text('SCORE',18,19,10,'#79b3bd');text(String(world.score).padStart(8,'0'),18,39,18);text(`${String(world.stage+1).padStart(2,'0')} / 12  ${z.en}`,W/2,31,15,z.color,'center');text(`BEST ${best}`,W-18,29,12,'#a7cdd2','right');text(`LIVES ${p.lives}`,18,H-15,13);text('ARMOR',120,H-15,11,'#86b7c0');for(let i=0;i<4;i++){g.fillStyle=i<p.hp?'#78e4dd':'#284651';g.fillRect(172+i*15,H-25,11,14);}text(`${w.en}  Lv.${p.level}`,280,H-15,14,w.color);text('Q / E : WEAPON',W-18,H-15,11,'#8ab9c6','right');
    if(world.chain>1){text(`${world.chain} CHAIN ×${Math.min(4,1+Math.floor(world.chain/5))}`,164,22,12,'#ffdc9e');g.fillStyle='#f3cb75';g.fillRect(164,31,95*world.chainTimer/3.6,3);}
    const ready=world.energy>=100;g.fillStyle='#163f50';g.fillRect(535,H-25,130,11);g.fillStyle=ready?'#baffee':'#42bdcf';g.fillRect(535,H-25,130*world.energy/100,11);text(world.burst>0?'OVERDRIVE':ready?'C / LT : READY':`DRIVE ${Math.floor(world.energy)}%`,600,H-29,10,ready?'#d5ffcf':'#8bcbd4','center');
    const burstButton=document.getElementById('burstTouch');burstButton.disabled=!ready||world.burst>0;burstButton.classList.toggle('ready',ready);
    if(world.boss&&!world.boss.dead&&world.boss.t<2.7){text('WARNING — 巨大機影接近',W/2,155,22,'#ffc68a','center');text(world.boss.def.jp,W/2,185,17,'#fff0d1','center');}
    if(world.elapsed<2&&!world.bossOnly){text(`ZONE ${world.stage+1}`,W/2,180,14,z.color,'center');text(z.name,W/2,220,30,'#ecffff','center');}
    if(!world.bossSpawned){g.fillStyle=z.color+'66';g.fillRect(0,48,W*Math.min(1,world.elapsed/z.duration),2);}
  }
  function drawGallery(){g.fillStyle='#071b2c';g.fillRect(0,0,W,H);text('機体図鑑 / 可動部品プレビュー',30,36,20);text('ヒレ・尾・腕が独立した回転軸で動きます',30,61,12,'#86b9c5');
    if(galleryKind==='stages'){const s=C.stages[galleryPage];background(s.id,t*60);scenery(s.id,t*60,true);terrain(t*60,true,s.id);water(s.id,t*60);g.fillStyle='#031725dd';g.fillRect(0,0,W,80);text(`${s.id+1} / 12 — ${s.name}`,30,32,22,s.color);text(R.missing.includes(s.sheet)?'背景画像・専用パーツ：Gemini生成待ち（仮背景）':'専用背景',30,60,13,'#e4c08e');return;}
    const defs=galleryKind==='enemies'?C.enemies.slice(galleryPage*5,galleryPage*5+5):galleryKind==='bosses'?C.bosses.slice(galleryPage*3,galleryPage*3+3):[{id:0,name:'ABYSSAL INTERCEPTOR',sheet:'playerRig',row:0}];
    const n=defs.length,cell=W/n;
    defs.forEach((d,i)=>{const x=cell*(i+.5),size=galleryKind==='enemies'?145:galleryKind==='bosses'?230:300;g.strokeStyle='#33708366';g.strokeRect(i*cell+10,85,cell-20,380);R.draw(g,d,x,250,size,t,galleryKind==='player'?'player':galleryKind==='bosses'?'boss':'enemy');text(`${String(d.id+1).padStart(2,'0')}`,x,115,13,'#62ced6','center');text(d.name,x,410,n>3?11:13,'#d7f6f7','center');text(R.missing.includes(d.sheet)?'仮素材 / 専用画像は生成待ち':'専用分解パーツ',x,437,10,R.missing.includes(d.sheet)?'#deb081':'#82dbc6','center');});text(`PAGE ${galleryPage+1}`,W-25,510,13,'#92b5bf','right');
  }
  function draw(){g.save();if(state==='gallery')drawGallery();else{background(world?.stage??selectedStage,world?.scroll??t*30);if(world&&['playing','paused','clear','victory','gameover'].includes(state)){if(world.shake)g.translate(rand(-world.shake,world.shake),rand(-world.shake,world.shake));drawWorld();}else if(state!=='loading'){R.draw(g,{id:0},170,270,140,t,'player');R.draw(g,C.enemies[0],800,290,170,t,'enemy');}}g.restore();}
  function frame(now){const dt=Math.min(.033,(now-last)/1000||0);last=now;pollGamepad(now);if(state!=='paused')t+=dt;update(dt);AbyssalAudio.get()?.tick(state,world?.stage||0,world?.player.level||1,!!world?.boss&&!world.boss.dead,muted);draw();requestAnimationFrame(frame);}
  show('<div class="kicker">INITIALIZING</div><h2>素材を読込中</h2>');
  R.load(C.sheets).then(report=>{assetReport=report;title();}).catch(error=>{show('<h2>読み込みエラー</h2><p>画像データを再構築してください。</p>');console.error(error);});
  // Read-only diagnostics support content and gameplay verification.
  window.abyssalStatus=()=>({state,stage:world?.stage,weapon,player:world?{...world.player}:null,enemies:world?.enemies.length,shots:world?.shots.length,hostile:world?.hostile.length,effects:world?.effects.length,combat:world?{chain:world.chain,bestChain:world.bestChain,energy:world.energy,burst:world.burst}:null,finite:world?[...world.enemies,...world.shots,...world.hostile].every(e=>Number.isFinite(e.x)&&Number.isFinite(e.y)&&Number.isFinite(e.r)):true,boss:world?.boss?{name:world.boss.def.name,hp:world.boss.hp,broken:[...world.boss.broken]}:null,encounter:{spawned:world?.eventIndex,waves:world?.waveIndex,notice:world?.notice?.name,warnings:world?.enemies.filter(e=>e.warning).length,breakable:world?.hostile.filter(s=>s.breakable).length},audio:AbyssalAudio.get()?.status(),gamepad:{connected:padIndex!==null,index:padIndex},content:{enemies:C.enemies.length,bosses:C.bosses.length,stages:C.stages.length,weapons:C.weapons.length},assets:assetReport});
  requestAnimationFrame(frame);
})();
