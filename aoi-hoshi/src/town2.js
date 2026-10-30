'use strict';
/* ====================================================================
   town2.js ― 街の建物(家に入れる)・店・宿・そうび。engine2.js と章データの後に読み込む。
   ・街の建物は、見た目と同じ大きさだけ通れなくする(以前は見えない壁が広すぎた)。
   ・建物は4つ: 道具屋 / 武器・防具屋 / 宿 / 民家。入口を通ると中へ入れる。
   ・街の住人のうち「key でない人」は、建物の中に住んでいる。
   ・そうび: 武器・防具・装身具。店で買い、メニューの「そうび」で付け替える。
   ==================================================================== */

/* ---------- そうびのデータ ---------- */
const EQKIND={w:'武器',a:'防具',c:'装身具'};
const EQUIP={
  rod:{n:'開拓用の鉄棒',k:'w',wpn:6,price:70,ch:2,d:'打撃力+6。村で拾った、頑丈な鉄の棒。'},
  pick:{n:'強化ピッケル',k:'w',wpn:10,price:260,ch:4,d:'打撃力+10。遺跡の岩も割れる。'},
  pulse:{n:'パルスブレード',k:'w',wpn:16,price:600,ch:7,d:'打撃力+16。振動する刃で、装甲を切る。'},
  plasma:{n:'プラズマソード',k:'w',wpn:22,price:1200,ch:10,d:'打撃力+22。高熱の刃。'},
  edge:{n:'ナノエッジ',k:'w',wpn:28,price:2200,ch:13,d:'打撃力+28。ナノマシンで刃先が再生する。'},
  relic:{n:'古代の刃',k:'w',wpn:36,price:3600,ch:15,d:'打撃力+36。創造文明の遺した刃。'},
  work:{n:'作業用ジャケット',k:'a',def:3,price:50,ch:2,d:'守り+3。丈夫な作業着。'},
  vest:{n:'防護ベスト',k:'a',def:5,price:200,ch:4,d:'守り+5。衝撃を散らす。'},
  alloy:{n:'合金プレート',k:'a',def:9,price:450,ch:7,d:'守り+9。重いが、堅い。'},
  field:{n:'力場ジャケット',k:'a',def:14,price:900,ch:10,d:'守り+14。薄い力場が体を包む。'},
  nanoarm:{n:'ナノ装甲',k:'a',def:20,price:1700,ch:13,d:'守り+20。傷ついた所を自分で直す。'},
  cloak:{n:'古代の外套',k:'a',def:28,price:2800,ch:15,d:'守り+28。袖を通すと、少し眠くなる。'},
  boots:{n:'滑り止めの靴',k:'c',spd:2,price:80,ch:2,d:'素早さ+2。足元が安定する。'},
  charm:{n:'回復のお守り',k:'c',mhp:60,price:150,ch:3,d:'HP+60。母親の手編み、という触れ込み。'},
  chip:{n:'演算チップ',k:'c',men:40,price:240,ch:5,d:'EN+40。小さな補助脳。'},
  band:{n:'反応加速バンド',k:'c',spd:4,price:400,ch:8,d:'素早さ+4。神経の反応を速める。'},
  heart:{n:'補強心拍器',k:'c',mhp:150,price:900,ch:10,d:'HP+150。休まず動き続ける、はずの心臓。'},
  core:{n:'小型創造炉',k:'c',men:90,price:1600,ch:12,d:'EN+90。手のひらサイズの炉。'},
  wing:{n:'疾風の外套飾り',k:'c',spd:8,price:2000,ch:14,d:'素早さ+8。走ると、ほんとうに速い。'}
};
function effectStr(it){
  const a=[];
  if(it.wpn)a.push('打撃+'+it.wpn);if(it.def)a.push('守り+'+it.def);if(it.mhp)a.push('HP+'+it.mhp);if(it.men)a.push('EN+'+it.men);if(it.spd)a.push('素早さ+'+it.spd);
  return a.join(' ');
}
function ownTbl(){F.own=F.own||{};return F.own}
function eqCount(id){let n=0;for(const p of F.party)for(const k of ['w','a','c'])if(p.eq&&p.eq[k]===id)n++;return n}
function eqFree(id){return (ownTbl()[id]||0)-eqCount(id)}
function applyEq(u){
  const e=u.eq||{};
  for(const k of ['w','a','c']){
    const it=EQUIP[e[k]];if(!it)continue;
    u.wpn+=it.wpn||0;u.def+=it.def||0;u.mhp+=it.mhp||0;u.men+=it.men||0;u.spd+=it.spd||0;
  }
}
const _setLevelBase=setLevel;
setLevel=function(u,L){_setLevelBase(u,L);applyEq(u)};
function equipSet(u,k,id){
  u.eq=u.eq||{};u.eq[k]=id||null;
  const hp=u.hp,en=u.en;setLevel(u,u.lv);u.hp=Math.min(hp,u.mhp);u.en=Math.min(en,u.men);
}

/* ---------- そうびのアイコン(コードで描いたドット絵) ---------- */
(function(){
  const mk=(draw)=>{const c=document.createElement('canvas');c.width=16;c.height=16;const g=c.getContext('2d');g.imageSmoothingEnabled=false;
    const R=(x,y,w,h,col)=>{g.fillStyle=col;g.fillRect(x,y,w,h)};draw(R);return c};
  const O='#1a1a2a';
  const blade=(R,b,h)=>{R(7,0,2,1,O);R(6,1,4,9,O);R(7,1,2,9,b);R(7,1,1,8,h);R(4,10,8,2,O);R(5,10,6,1,'#c8a040');R(7,12,2,4,O);R(7,12,2,3,'#7a4a2a')};
  const armor=(R,b,h)=>{R(3,2,10,1,O);R(2,3,12,10,O);R(3,3,10,9,b);R(3,3,10,3,h);R(7,3,2,9,'rgba(0,0,0,.2)');R(1,4,2,5,O);R(13,4,2,5,O);R(2,5,1,3,b);R(13,5,1,3,b);R(5,13,6,2,O)};
  const wp={rod:['#8a8a98','#e0e0ea'],pick:['#9aa0ae','#f0f0fa'],pulse:['#58c8f0','#d8f4ff'],plasma:['#f08a38','#ffe0a8'],edge:['#58f0c0','#d8fff0'],relic:['#f0e070','#fffbd0']};
  for(const id in wp)IMGS['ic_'+id]=mk(R=>blade(R,wp[id][0],wp[id][1]));
  const ar={work:['#8a7a5a','#b8a880'],vest:['#6a8aa8','#98b8d0'],alloy:['#8a8a98','#c0c0cc'],field:['#58a8f0','#a8d8ff'],nanoarm:['#58f0a8','#b8ffe0'],cloak:['#c8a8f0','#e8d8ff']};
  for(const id in ar)IMGS['ic_'+id]=mk(R=>armor(R,ar[id][0],ar[id][1]));
  IMGS.ic_boots=mk(R=>{R(4,3,5,9,O);R(5,3,3,8,'#7a5a3a');R(4,11,9,4,O);R(5,11,8,3,'#5a3e22');R(5,4,3,1,'#c8a070')});
  IMGS.ic_charm=mk(R=>{R(7,1,2,3,'#c82a2a');R(4,4,8,10,O);R(5,5,6,8,'#e8a0a0');R(7,6,2,6,'#fff');R(5,8,6,2,'#fff')});
  IMGS.ic_chip=mk(R=>{R(3,3,10,10,O);R(4,4,8,8,'#2a7a4a');R(6,6,4,4,'#a8f0c8');R(2,5,1,2,'#c8c8d0');R(2,9,1,2,'#c8c8d0');R(13,5,1,2,'#c8c8d0');R(13,9,1,2,'#c8c8d0')});
  IMGS.ic_band=mk(R=>{R(2,5,12,6,O);R(3,6,10,4,'#3a6ad0');R(5,7,6,2,'#a8c8ff');R(2,11,12,1,'rgba(0,0,0,.2)')});
  IMGS.ic_heart=mk(R=>{R(3,3,4,3,O);R(9,3,4,3,O);R(2,5,12,5,O);R(4,10,8,2,O);R(6,12,4,2,O);R(3,4,4,2,'#e03a4a');R(9,4,4,2,'#e03a4a');R(3,6,10,4,'#e03a4a');R(5,10,6,1,'#e03a4a');R(4,5,2,1,'#ff9aa8')});
  IMGS.ic_core=mk(R=>{R(4,2,8,12,O);R(5,3,6,10,'#4a9af0');R(6,5,4,6,'#c8e8ff');R(7,7,2,2,'#fff')});
  IMGS.ic_wing=mk(R=>{R(2,5,12,6,O);R(3,6,10,4,'#a0e8d8');R(4,7,8,2,'#fff');R(1,8,2,2,'#a0e8d8');R(13,8,2,2,'#a0e8d8')});
})();

/* ---------- 顔(店の人) ---------- */
Object.assign(FACEOF,{'店主':'f_vman','女将':'f_vwoman','整備士':'f_worker','係員':'f_ctrl'});

/* ---------- メニュー: そうび ---------- */
async function menuEquip(){
  while(true){
    const m=await pickMenu(F.party.map(p=>({label:p.name,right:'打撃'+p.wpn+' 守り'+p.def})),{x:8,y:30,w:190,title:'だれの そうび?',rows:7});
    if(m<0)return;
    const u=F.party[m];
    while(true){
      const slots=['w','a','c'];
      const items=slots.map(k=>{const it=EQUIP[(u.eq||{})[k]];return{icon:it?'ic_'+(u.eq[k]):null,label:EQKIND[k]+'  '+(it?it.n:'なし')}});
      const s=await pickMenu(items,{x:8,y:30,w:232,title:u.name+' 打撃'+u.wpn+' 守り'+u.def+' 素早さ'+u.spd+' HP'+u.mhp,rows:4});
      if(s<0)break;
      const k=slots[s];
      const ids=Object.keys(EQUIP).filter(id=>EQUIP[id].k===k&&(eqFree(id)>0||(u.eq&&u.eq[k]===id)));
      const list=[{label:'はずす'}].concat(ids.map(id=>({icon:'ic_'+id,label:EQUIP[id].n,right:(u.eq&&u.eq[k]===id)?'そうび中':effectStr(EQUIP[id])})));
      if(list.length===1){await say('',['この種類の そうびは 持っていない。街の 武器・防具屋で 買える。'])}
      const c=await pickMenu(list,{x:8,y:30,w:232,title:EQKIND[k],rows:6,foot:i=>i>0?EQUIP[ids[i-1]].d:'そうびを はずす。'});
      if(c<0)continue;
      equipSet(u,k,c===0?null:ids[c-1]);se('ok');
    }
  }
}
menuStatus=async function(){
  for(const p of F.party){
    const e=p.eq||{};
    await say(p.name,['Lv'+p.lv+'  HP '+p.hp+'/'+p.mhp+'  EN '+p.en+'/'+p.men,'打撃'+p.wpn+' 力'+p.str+' 守り'+p.def+' 素早さ'+p.spd,
      '武器: '+(EQUIP[e.w]?EQUIP[e.w].n:'なし')+'  防具: '+(EQUIP[e.a]?EQUIP[e.a].n:'なし'),
      '装身具: '+(EQUIP[e.c]?EQUIP[e.c].n:'なし'),
      '技: '+(p.skills.map(k=>SK[k]?SK[k].n:k).join('、')||'なし')+'  疲労 '+(F.fatigue|0)+'/100']);
  }
};
fieldMenu=async function(){
  if(G.busy)return;
  G.busy=true;
  try{
    while(true){
      const many=F.party.length>4,eqOn=F.ch>=2;
      const items=[{label:'アイテム'},{label:'そうび',disabled:!eqOn},{label:'ステータス'},{label:'ネットスーパー',disabled:!F.flags.netsuper},{label:'ならびかえ',disabled:!many},{label:'めあて'},{label:'セーブ'},{label:'とじる'}];
      const c=await pickMenu(items,{x:8,y:8,w:120,cancel:true,rows:8});
      if(c<0||c===7)break;
      if(c===0)await menuItems();
      if(c===1)await menuEquip();
      if(c===2)await menuStatus();
      if(c===3)await shopMenu();
      if(c===4)await menuOrder();
      if(c===5){
        const lines=[G.hint||(F.ch>=2?(CHAPTERS[F.ch]||{}).goal:'')||'めあては とくにない。'];
        const ch=CHAPTERS[F.ch];
        if(ch&&F.cs&&!F.cs.gate){
          const remaining=ch.npcs.filter((npc,i)=>npc.key&&!F.cs.talked[i]).map(npc=>npc.name||'住人');
          if(remaining.length)lines.push('まだ話していない人: '+remaining.join('、'));
        }else if(ch&&F.cs&&F.cs.gate&&G.mapId==='C'+F.ch+'T')lines.push('街の東から 先へ進もう。');
        await say('',lines);
      }
      if(c===6)await saveDialog();
    }
  }finally{G.busy=false}
};

/* ---------- 店 ---------- */
async function itemShop(){
  while(true){
    const keys=shopKeys().filter(k=>ITEMS[k].use!=='meat');
    const price=k=>Math.ceil(ITEMS[k].price*1.15);
    F.cs=F.cs||{};const bought=F.cs.shopBought=F.cs.shopBought||{};
    const left=k=>Math.max(0,(ITEMS[k].max||5)-(bought[k]||0));
    const it=keys.map(k=>({icon:'ic_'+k,label:ITEMS[k].n,right:price(k)+'c  残'+left(k),disabled:F.credits<price(k)||left(k)<=0}));
    const s=await pickMenu(it,{x:8,y:30,w:226,title:'道具屋  所持 '+F.credits+'c',rows:6,foot:i=>ITEMS[keys[i]].d});
    if(s<0)return;
    const k=keys[s];F.credits-=price(k);bought[k]=(bought[k]||0)+1;F.bag[k]=(F.bag[k]||0)+1;se('buy');toast(ITEMS[k].n+'を 買った。');
  }
}
async function askWhoEquip(id){
  const it=EQUIP[id];
  const list=F.party.map(p=>({label:p.name,right:(EQUIP[(p.eq||{})[it.k]]||{n:'なし'}).n}));
  list.push({label:'あとで'});
  const w=await pickMenu(list,{x:8,y:30,w:226,title:it.n+' を だれに そうびする?',rows:7});
  if(w<0||w>=F.party.length)return;
  equipSet(F.party[w],it.k,id);se('ok');toast(F.party[w].name+'が '+it.n+'を そうびした。');
}
async function equipShop(){
  while(true){
    const c=await pickMenu([{label:'買う'},{label:'売る'},{label:'そうびを 変える'},{label:'やめる'}],{x:8,y:30,w:130,title:'武器・防具屋  '+F.credits+'c',rows:4});
    if(c<0||c===3)return;
    if(c===2){await menuEquip();continue}
    if(c===0){
      while(true){
        const ids=Object.keys(EQUIP).filter(id=>EQUIP[id].ch<=F.ch);
        const it=ids.map(id=>({icon:'ic_'+id,label:EQUIP[id].n,right:EQUIP[id].price+'c  持'+(ownTbl()[id]||0),disabled:F.credits<EQUIP[id].price}));
        const s=await pickMenu(it,{x:8,y:30,w:236,title:'買う  所持 '+F.credits+'c',rows:6,foot:i=>EQKIND[EQUIP[ids[i]].k]+'  '+EQUIP[ids[i]].d});
        if(s<0)break;
        const id=ids[s];F.credits-=EQUIP[id].price;ownTbl()[id]=(ownTbl()[id]||0)+1;se('buy');
        await askWhoEquip(id);
      }
    }else{
      while(true){
        const ids=Object.keys(EQUIP).filter(id=>eqFree(id)>0);
        if(!ids.length){await say('店主',['売れる物は ないな。そうび中の物は、先に はずしてくれ。']);break}
        const it=ids.map(id=>({icon:'ic_'+id,label:EQUIP[id].n,right:Math.floor(EQUIP[id].price/2)+'c  持'+eqFree(id)}));
        const s=await pickMenu(it,{x:8,y:30,w:236,title:'売る  所持 '+F.credits+'c',rows:6,foot:i=>'売値は 買値の半分。'});
        if(s<0)break;
        const id=ids[s];ownTbl()[id]--;F.credits+=Math.floor(EQUIP[id].price/2);se('buy');
      }
    }
  }
}
async function innStay(who){who=who||'女将';
  const cost=(F.ch||1)>=12?0:10;
  const c=await ask(who,[cost?'いらっしゃい。一晩 '+cost+'クレジット。':'いらっしゃい。連邦の市民は、一晩 無料だよ。','ぐっすり眠れば、体力も 疲れも 元どおりだよ。'],['泊まる','やめておく']);
  if(c!==0)return;
  if(F.credits<cost){await say(who,['おや、お金が たりないね。また おいで。']);return}
  F.credits-=cost;
  await fadeTo(1,'#000',.06);
  F.party.forEach(p=>{p.hp=p.mhp;p.en=p.men});F.fatigue=0;try{resetStock()}catch(e){}se('heal');
  await sleep(40);await fadeTo(0,null,.06);
  await say(who,['おはよう。……いい顔に なったじゃないか。']);
}

/* ---------- 街(建物に入れる) ---------- */
const BLD={house:{sc:1.1,w:4,h:2,door:1},tent:{sc:2,w:3,h:1,door:1},tower:{sc:1.6,w:2,h:2,door:0},img:{sc:1,w:4,h:2,door:1}};
// 建物の絵(Geminiで作成。素材\変換.py → 素材\gameld_*.png)。無ければ、家・テント・塔の絵にもどる
['item','equip','inn','home'].forEach(nm=>['','_sf'].forEach(s=>{const i=new Image();i.onload=()=>{IMGS['bld_'+nm+s]=i};i.src='素材/game/bld_'+nm+s+'.png'}));
const _drawObjBase=drawObj;
drawObj=function(nm,cx,by,sc){
  if(nm==='officedesk'){
    rect(cx-8,by-9,16,7,'#353d4e');rect(cx-8,by-11,16,3,'#8c99a9');rect(cx-7,by-10,14,1,'#b6c3d1');
    rect(cx-4,by-17,8,6,'#202939');rect(cx-3,by-16,6,4,'#81aaca');rect(cx-1,by-11,2,1,'#b8c2c7');
    rect(cx-3,by-2,6,2,'#252d3b');return true;
  }
  if(nm==='officeplant'){
    rect(cx-3,by-5,6,5,'#91725a');rect(cx-2,by-6,4,2,'#745740');rect(cx-1,by-13,2,8,'#34543d');
    rect(cx-6,by-15,5,4,'#427e54');rect(cx+1,by-18,5,5,'#538f60');rect(cx-4,by-21,5,6,'#69a76c');return true;
  }
  if(nm==='officecabinet'){
    rect(cx-7,by-16,14,16,'#536171');rect(cx-6,by-15,12,14,'#8996a4');rect(cx-6,by-10,12,1,'#465464');rect(cx-2,by-13,4,1,'#d3dbe0');rect(cx-2,by-8,4,1,'#d3dbe0');return true;
  }
  const im=IMGS[nm];
  if(im&&nm.indexOf('bld_')===0){ctx.drawImage(im,Math.round(cx-im.width/2),Math.round(by-im.height));return true}
  return _drawObjBase(nm,cx,by,sc);
};
function slotArt(ch,i){
  const st=ch.style,sf=(st==='city'||st==='ship'||st==='empire'||st==='factory'||st==='cave'),nm=BKIND[i];
  if((st==='sand'||st==='ruin')&&nm==='home')return{k:'tent',b:BLD.tent};
  const key='bld_'+nm+(sf?'_sf':'');
  if(IMGS[key])return{k:key,b:BLD.img};
  const k=bldKind(ch,i);return{k,b:BLD[k]};
}
const SLOT_RECTS=[[3,2],[14,2],[3,12],[15,12]];     // 建物を置く4つの区画(6×3)
const SLOTS2=[[7,7],[10,11],[15,7],[19,10],[8,5],[20,7],[9,12],[13,13],[22,12],[21,5]];
const BKIND=['item','equip','inn','home'];
const BNAME={item:'道具屋',equip:'武器・防具屋',inn:'宿',home:'民家'};
function bldKind(ch,i){
  const b=ch.buildings&&ch.buildings[i];if(BLD[b])return b;
  const st=ch.style;
  if(st==='sand'||st==='ruin')return 'tent';
  if(st==='city'||st==='ship'||st==='empire'||st==='factory'||st==='cave')return 'tower';
  return 'house';
}
const HOME_TALK={
  grass:['この村の水は、日に日に減っている。みんな、口には出さないけどね。'],
  sand:['砂の街でも、朝の井戸端は にぎやかだ。'],
  snow:['雪の季節は、こうして家に こもるに限る。'],
  default:['いつも 外は にぎやかだが、家の中は 静かでいい。','お疲れさま。休むのも 仕事のうちだよ。']
};
function genHouse(n,ch,i,kind,door,residents){
  const id='C'+n+'H'+i,W=12,H=9,st=STYLES[ch.style]||STYLES.grass;
  const floor=(st.indoor||ch.style==='ruin')?'f':'F';
  const m=mkMap(id,W,H,floor,undefined,(m,g)=>{
    m.indoor=true;m.chapter=n;m.ground=floor;
    R(g,0,0,W,2,'W');R(g,0,H-1,W,1,'W');R(g,0,0,1,H,'W');R(g,W-1,0,1,H,'W');
    g[0][2]='X';g[0][9]='X';g[H-1][6]='D';
    if(kind==='item'||kind==='equip'||kind==='inn'){R(g,3,3,3,1,'k');R(g,7,3,3,1,'k')}
    if(kind==='item'){g[6][1]='o';g[6][10]='o';g[5][10]='o'}
    if(kind==='equip'){g[6][1]='K';g[6][10]='K';g[2][10]='o'}
    if(kind==='inn'){g[2][2]='B';g[2][3]='B';g[2][9]='B';g[2][10]='B'}
    if(kind==='home'){g[2][2]='B';g[2][3]='B';g[6][8]='k';g[6][9]='k';g[1][10]='M'}
  });
  for(let y=0;y<H;y++)for(let x=0;x<W;x++){
    if(m.g[y][x]==='k')m.decos.push({k:'table',x:x+.5,y:y+1,sc:.8});
    else if(m.g[y][x]==='o')m.decos.push({k:'crate',x:x+.5,y:y+1});
  }
  const shelf=x=>m.decos.push({k:'shelf',x:x+.5,y:2});
  if(kind==='item'){[4,5,8,9].forEach(shelf)}
  if(kind==='equip'){[3,5,8].forEach(shelf)}
  if(kind==='home'){shelf(5);shelf(6)}
  const keeper={item:['店主','merchant'],equip:['整備士','engineer'],inn:[st.indoor?'係員':'女将','villf']}[kind];
  if(keeper){npc(m,{id:'keeper',x:6,y:3,spr:keeper[1],dir:'down',run:async()=>{
    if(kind==='item'){
      await say('店主',['いらっしゃい。空から届く品ほど 安くはないが、','顔を見て 選べる店だ。']);
      const c=await ask('店主',['何に する?'],['買う','やめる']);if(c===0)await itemShop();
    }else if(kind==='equip'){
      await say('整備士',['武器と 防具の 店だ。','体に合う物を 選んでくれ。']);
      await equipShop();
    }else await innStay(keeper[0]);
  }})}
  // 住人(街の key でない人たち)
  const spots=[[3,5],[8,4],[5,6],[4,4],[7,5],[2,5]];
  residents.forEach((r,j)=>{
    const s=spots[j%spots.length];
    npc(m,{id:'n'+r.idx,x:s[0],y:s[1],spr:r.spr,dir:'down',run:async()=>cTalk(n,r.idx)});
  });
  if(kind==='home'&&!residents.length){
    const lines=st.indoor?['居住区画の灯りは、時間になると少し落ちる。眠るには ちょうどいい。','お疲れさま。休むのも 仕事のうちだ。']:(HOME_TALK[ch.style]||HOME_TALK.default);
    npc(m,{id:'res',x:5,y:5,spr:'villf',dir:'down',run:async()=>{for(const l of lines)await say('住人',[l])}});
  }
  m.trig.push({x:6,y:7,run:async()=>{toast(BNAME[kind]||'')}});
  m.warps.push({x:6,y:H-1,to:'C'+n+'T',tx:door[0],ty:door[1]+1,dir:'down'});
  return m;
}
genTown=function(n,ch){
  const st=STYLES[ch.style]||STYLES.grass,W=26,H=18;
  const slots=SLOT_RECTS.map((r,i)=>{
    const art=slotArt(ch,i),kind=art.k,b=art.b;
    const shift=(n%3===0&&i<2)?(i===0?1:-1):0;
    const bx=r[0]+((6-b.w)>>1)+shift,by=r[1]+3-b.h;
    return{kind,b,bx,by,door:[bx+b.door,by+b.h-1]};
  });
  const m=mkMap('C'+n+'T',W,H,st.ground,(CHBGM[n]||[])[0]||ch.bgm||'village',(m,g)=>{
    m.ground=st.ground;m.indoor=st.indoor;m.chapter=n;
    R(g,0,0,W,1,st.wall);R(g,0,H-1,W,1,st.wall);R(g,0,0,1,H,st.wall);R(g,W-1,0,1,H,st.wall);
    // 地形に合わせて少しずつ曲がる道。中心と東出口は必ずつなぐ。
    for(let x=1;x<W-1;x++){
      const bend=x<7?1:x>18?-1:0;
      const y=(x>=21?8:8+bend);
      R(g,x,y,1,2,st.path);
    }
    for(let y=1;y<H-1;y++){
      const x=y<5?10:y>12?12:11;
      R(g,x,y,2,1,st.path);
    }
    // 曲がり角と広場は、斜めに広げて自然に接続する。
    [[6,8],[7,10],[18,7],[19,9],[10,5],[12,12],[11,8],[12,9]].forEach(([x,y])=>{g[y][x]=st.path});
    g[8][W-1]=st.path;g[9][W-1]=st.path;
    m.path=st.path;
    m.spawn=[12,10];m.gate=[W-2,8];
  });
  const kinds=st.kinds;
  // 建物: 見た目の足もとと同じ大きさだけ通れない。入口(ドア)は通れて、中へ入る。
  let bi=0;
  slots.forEach((s,i)=>{
    m.decos.push({k:s.kind,x:s.bx+s.b.w/2,y:s.by+s.b.h,sc:s.b.sc});
    for(let y=s.by;y<s.by+s.b.h;y++)for(let x=s.bx;x<s.bx+s.b.w;x++){
      if(x===s.door[0]&&y===s.door[1])continue;
      m.objs.push({id:'blk'+(bi++),type:'block',x,y,solid:true});
    }
    m.warps.push({x:s.door[0],y:s.door[1],to:'C'+n+'H'+i,tx:6,ty:7,dir:'up'});
  });
  // 外周は規則的な並木にせず、木や岩の間隔と高さを変える。
  if(kinds.length){
    for(let x=1;x<W-1;x++){
      if(hash(n*31+x,1)>.43)m.decos.push({k:kinds[Math.floor(hash(x,n)*kinds.length)],x:x+.5,y:.85,sc:.78+hash(x,n+4)*.42});
      if(hash(n*19+x,2)>.38)m.decos.push({k:kinds[Math.floor(hash(x,n+3)*kinds.length)],x:x+.5,y:H-.05,sc:.8+hash(x,n+5)*.4});
    }
    for(let y=2;y<H-2;y++)if(hash(y,n+7)>.6){
      m.decos.push({k:kinds[Math.floor(hash(y,n)*kinds.length)],x:.45,y:y+1,sc:.8+hash(y,n+2)*.35});
      if(y<7||y>10)m.decos.push({k:kinds[Math.floor(hash(y,n+1)*kinds.length)],x:W-.45,y:y+1,sc:.8+hash(y,n+6)*.35});
    }
  }
  for(let y=1;y<H-1;y++){if(y!==8&&y!==9)m.g[y][W-1]=st.wall}
  thingObj(m,{id:'term',x:13,y:6,spr:'save',run:async()=>cTerminal()});
  // 住人: key の人は外、そうでない人は建物の中(民家→宿→武器屋→道具屋の順)
  const VARI={villm:['villm','v3','v5','guard'],villf:['villf','v2','v4','mother']};
  const inside=[[],[],[],[]],order=[3,2,1,0],usedSlot=new Set();let inN=0;
  (ch.npcs||[]).forEach((nd,i)=>{
    let spr0=nd.spr||'villm';const nm=nd.name||'';
    if(/商|ボルゴ|グレイブ|行商/.test(nm))spr0='merchant';
    else if(/ベイン|レオ|アルフ|研究|技術|作業員|エンジニア|ホルム|教授|博士|技師/.test(nm))spr0='engineer';
    else if(/提督|将校|軍人|司令|大佐|少佐|中佐|大尉/.test(nm))spr0='officer';
    else if(spr0==='guard'||/兵|隊長|艦長|役人|見張り|警備|番人/.test(nm))spr0='imp';
    const sprV=VARI[spr0]?VARI[spr0][(i+n)%4]:spr0;
    if(nd.key||nd.outside){
      let si=nd.slot!==undefined?nd.slot%SLOTS2.length:-1;
      if(si<0||usedSlot.has(si)){si=0;while(usedSlot.has(si)&&si<SLOTS2.length-1)si++}
      usedSlot.add(si);const s=SLOTS2[si];
      npc(m,{id:'n'+i,x:nd.x!==undefined?nd.x:s[0],y:nd.y!==undefined?nd.y:s[1],spr:sprV,dir:nd.dir||'down',run:async()=>cTalk(n,i)});
    }else{
      inside[order[inN++%4]].push({idx:i,spr:sprV});
    }
  });
  // 屋外が寂しくならないように、屋内の人が2人以上いる建物からは1人を外に出す
  inside.forEach((arr,bi2)=>{if(arr.length>1){const r=arr.pop();let si=0;while(usedSlot.has(si)&&si<SLOTS2.length-1)si++;usedSlot.add(si);const s=SLOTS2[si];npc(m,{id:'n'+r.idx,x:s[0],y:s[1],spr:r.spr,dir:'down',run:async()=>cTalk(n,r.idx)})}});
  // 小さな植え込みは道路・出入口・住人を避けて配置する。
  if(!st.indoor&&kinds.length){
    for(const [x,y] of [[2,5],[23,3],[2,15],[23,14]]){
      if(m.g[y][x]===st.path||m.objs.some(o=>Math.abs(o.x-x)+Math.abs(o.y-y)<2)||m.warps.some(w=>Math.abs(w.x-x)+Math.abs(w.y-y)<3))continue;
      m.decos.push({k:kinds[Math.floor(hash(x+n,y)*kinds.length)],x:x+.5,y:y+1,sc:.72});
      m.objs.push({id:'landscape'+x+'_'+y,type:'block',x,y,solid:true});
    }
  }
  slots.forEach((s,i)=>genHouse(n,ch,i,BKIND[i],s.door,inside[i]));
  m.warps.push({x:W-1,y:8,to:'C'+n+'D',tx:2,ty:0,dir:'right',cond:()=>!!F.cs.gate,msg:'まだ やるべきことがある。'});
  m.warps.push({x:W-1,y:9,to:'C'+n+'D',tx:2,ty:0,dir:'right',cond:()=>!!F.cs.gate,msg:'まだ やるべきことがある。'});
  return m;
};

/* ---------- 地図の名前(めあて・ヒント用) ---------- */
// 建物の中では、疲労ゲージなどはそのまま。夜の暗さも無し。

/* ---------- フィールドの敵は、近づく主人公のほうを向く ---------- */
drawEnemyField=function(o,x,y){
  const def=ENEMIES[o.kind];
  if(def&&def.look&&IMGS[def.look.img]){
    const im=lookImg(def.look),w=o.boss?Math.min(46,im.width*.5):Math.max(14,Math.min(26,im.width*.45)),h=Math.round(im.height*w/im.width);
    const faceRight=G.P.x>=o.x;                       // 絵は左向きが基本。主人公が右にいれば反転して右向きにする
    const flip=def.look.r?!faceRight:faceRight;
    ctx.save();ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high';
    ctx.fillStyle='rgba(0,0,0,.25)';ctx.fillRect(x+1,y+14,w,2);
    if(flip){ctx.translate(x+w,0);ctx.scale(-1,1);ctx.drawImage(im,0,y+16-h,w,h)}
    else ctx.drawImage(im,x,y+16-h,w,h);
    ctx.restore();return;
  }
  return _drawEnemyField(o,x,y);
};

/* ---------- 街路の角を丸め、地形との境目をなじませる ---------- */
const _townTile=tile;
tile=function(ch,x,y,tx,ty){
  const m=G.mode==='field'&&curMap();
  if(m&&m.id==='OFFICE'&&ch==='L'){
    _townTile(ch,x,y,tx,ty);
    if(ty>=5&&ty<=6){rect(x,y,16,16,'rgba(24,48,78,.22)');rect(x,y+15,16,1,'rgba(155,185,205,.20)')}
    return;
  }
  if(!m||!/^C\d+T$/.test(m.id)||!m.path||m.path===m.ground)return _townTile(ch,x,y,tx,ty);
  const isRoad=(dx,dy)=>m.g[ty+dy]&&m.g[ty+dy][tx+dx]===m.path;
  // 隣接する道の内側にも小さな曲線を入れ、交差点の切り欠きを丸める。
  if(ch===m.ground){
    _townTile(ch,x,y,tx,ty);
    const corners=[[0,0,-1,-1],[16,0,1,-1],[16,16,1,1],[0,16,-1,1]];
    for(const [px,py,dx,dy] of corners)if(isRoad(dx,0)&&isRoad(0,dy)){
      const sx=dx<0?1:-1,sy=dy<0?1:-1,r=8;
      ctx.save();ctx.beginPath();ctx.moveTo(x+px,y+py);ctx.lineTo(x+px+sx*r,y+py);
      ctx.quadraticCurveTo(x+px,y+py,x+px,y+py+sy*r);ctx.closePath();ctx.clip();_townTile(m.path,x,y,tx,ty);ctx.restore();
    }
    return;
  }
  if(ch!==m.path)return _townTile(ch,x,y,tx,ty);
  const tl=!isRoad(0,-1)&&!isRoad(-1,0),tr=!isRoad(0,-1)&&!isRoad(1,0);
  const br=!isRoad(0,1)&&!isRoad(1,0),bl=!isRoad(0,1)&&!isRoad(-1,0);
  if(!(tl||tr||br||bl))return _townTile(ch,x,y,tx,ty);
  _townTile(m.ground,x,y,tx,ty);
  const r=9;ctx.save();ctx.beginPath();ctx.moveTo(x+(tl?r:0),y);
  ctx.lineTo(x+16-(tr?r:0),y);if(tr)ctx.quadraticCurveTo(x+16,y,x+16,y+r);
  ctx.lineTo(x+16,y+16-(br?r:0));if(br)ctx.quadraticCurveTo(x+16,y+16,x+16-r,y+16);
  ctx.lineTo(x+(bl?r:0),y+16);if(bl)ctx.quadraticCurveTo(x,y+16,x,y+16-r);
  ctx.lineTo(x,y+(tl?r:0));if(tl)ctx.quadraticCurveTo(x,y,x+r,y);
  ctx.closePath();ctx.clip();_townTile(ch,x,y,tx,ty);ctx.restore();
};

/* ---------- 古いセーブ位置が新しい建物に重なった場合の復帰 ---------- */
const _townLoadGame=loadGame;
loadGame=function(n){
  const ok=_townLoadGame(n);if(!ok)return false;
  const m=curMap(),P=G.P;
  if(!m||!solidAt(m,P.x,P.y))return true;
  const q=[[P.x,P.y]],seen=new Set();
  for(let i=0;i<q.length;i++){
    const [x,y]=q[i],key=x+','+y;if(seen.has(key)||x<0||y<0||x>=m.w||y>=m.h)continue;seen.add(key);
    if(!solidAt(m,x,y)&&!m.warps.some(w=>w.x===x&&w.y===y)){
      P.x=x;P.y=y;P.tx=x;P.ty=y;P.px=x*TS;P.py=y*TS;P.moving=0;
      toast('安全な場所から 再開しました。');return true;
    }
    for(const [dx,dy] of [[0,1],[-1,0],[1,0],[0,-1]])q.push([x+dx,y+dy]);
  }
  return true;
};
