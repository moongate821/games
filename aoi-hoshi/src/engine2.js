'use strict';
/* ====================================================================
   engine2.js ― 第2章以降(全16章)を動かす土台。index.html(第1章)の後に読み込む。
   章データは src/chNN.js に  CHAPTERS[N]={...JSON...};  の形で置く(書式は 設計\70_章データ仕様.md)。
   ==================================================================== */
const CHAPTERS={};
/* ---------- 章ごとの曲 ---------- */
Object.assign(BGMS,{
  frontier:{ms:260,wave:'triangle',vol:.035,mel:[72,0,76,79,81,0,79,76,74,0,77,81,79,0,76,0,72,0,76,79,84,0,83,79,81,0,79,76,74,0,72,0],bass:[48,0,0,0,55,0,0,0,53,0,0,0,57,0,0,0,48,0,0,0,52,0,0,0,53,0,0,0,48,0,0,0]},
  space:{ms:340,wave:'sine',vol:.055,mel:[69,0,0,0,76,0,0,0,72,0,0,0,71,0,0,0,69,0,0,0,64,0,0,0,67,0,0,0,0,0,0,0],bass:[45,0,0,0,0,0,0,0,40,0,0,0,0,0,0,0,43,0,0,0,0,0,0,0,40,0,0,0,0,0,0,0]},
  empire:{ms:200,wave:'square',vol:.03,mel:[57,0,57,60,62,0,60,0,57,0,57,60,64,0,62,0,57,0,57,60,62,0,60,0,55,0,57,0,53,0,0,0],bass:[38,0,0,0,38,0,0,0,41,0,0,0,43,0,0,0,38,0,0,0,38,0,0,0,36,0,0,0,38,0,0,0]},
  ancient:{ms:300,wave:'triangle',vol:.05,mel:[64,0,67,0,71,0,69,0,66,0,64,0,62,0,0,0,64,0,67,0,72,0,71,0,69,0,66,0,64,0,0,0],bass:[40,0,0,0,0,0,0,0,43,0,0,0,0,0,0,0,38,0,0,0,0,0,0,0,40,0,0,0,0,0,0,0]},
  city:{ms:210,wave:'triangle',vol:.045,mel:[72,74,76,0,79,76,74,0,72,74,76,0,81,79,76,0,71,72,74,0,77,74,72,0,71,72,74,0,76,0,0,0],bass:[48,0,55,0,48,0,55,0,53,0,57,0,53,0,57,0,47,0,55,0,47,0,55,0,48,0,55,0,52,0,55,0]},
  earth:{ms:400,wave:'sine',vol:.06,mel:[67,0,0,0,76,0,0,0,67,0,0,0,72,0,0,0,69,0,0,0,76,0,0,0,67,0,0,0,0,0,0,0],bass:[48,0,0,0,0,0,0,0,53,0,0,0,0,0,0,0,52,0,0,0,0,0,0,0,48,0,0,0,0,0,0,0]},
  sad:{ms:450,wave:'sine',vol:.06,mel:[64,0,0,0,67,0,0,0,69,0,0,0,67,0,0,0,64,0,0,0,62,0,0,0,60,0,0,0,0,0,0,0],bass:[36,0,0,0,0,0,0,0,41,0,0,0,0,0,0,0,40,0,0,0,0,0,0,0,36,0,0,0,0,0,0,0]},
  wedding:{ms:240,wave:'triangle',vol:.05,mel:[72,0,76,79,84,0,79,76,74,0,77,81,86,0,81,77,72,0,76,79,84,0,88,0,86,0,84,0,79,0,0,0],bass:[48,0,0,52,55,0,52,0,50,0,0,53,57,0,53,0,48,0,0,52,55,0,52,0,43,0,0,47,50,0,0,0]}
});
const CHBGM={2:['village','night'],3:['village','night'],4:['night','ancient'],5:['city','space'],6:['space','space'],7:['space','space'],8:['village','empire'],9:['frontier','empire'],10:['empire','empire'],11:['empire','empire'],12:['city','night'],13:['ancient','ancient'],14:['empire','empire'],15:['empire','empire'],16:['space','space']};
const CHAR_DEFS={
  takaya:{n:'隆也',pal:'takaya',hp:[60,9],en:[20,2],str:[6,1],def:[4,.5],spd:[8,.3],wpn:[3,1.6],
    skills:[[1,'delay'],[1,'rest'],[10,'plan'],[18,'drone'],[34,'pto'],[45,'orders']]},
  kyle:{n:'カイル',pal:'kyle',hp:[80,12],en:[5,1],str:[10,2],def:[6,1],spd:[7,.3],wpn:[5,1.8],
    skills:[[1,'cover'],[1,'kyle2'],[14,'nantoka'],[24,'roar'],[38,'migi']]},
  sophia:{n:'ソフィア',pal:'sophia',hp:[55,8],en:[60,4],str:[4,.8],def:[3,.4],spd:[9,.3],wpn:[2,1.0],
    skills:[[1,'s_heal'],[4,'s_heat'],[12,'s_thunder'],[15,'s_revive'],[20,'s_healall'],[33,'s_gravity'],[43,'s_create']]},
  milia:{n:'ミリア',pal:'milia',hp:[50,7],en:[45,3],str:[5,.8],def:[3,.4],spd:[8,.3],wpn:[2,1.1],
    skills:[[1,'m_theory'],[5,'m_try'],[17,'m_wall'],[36,'m_dismantle']]},
  rain:{n:'レイン',pal:'rain',hp:[65,9],en:[30,2],str:[8,1.4],def:[5,.7],spd:[9,.3],wpn:[4,1.7],
    skills:[[1,'r_snipe'],[8,'r_suppress'],[14,'r_reality'],[22,'r_mission'],[30,'r_barrage']]},
  elna:{n:'エルナ',pal:'elna',hp:[70,10],en:[35,2],str:[9,1.6],def:[5,.7],spd:[9,.3],wpn:[4,1.8],
    skills:[[1,'e_slash'],[1,'e_noble'],[20,'e_disap'],[28,'e_order'],[40,'e_newera']]},
  valdis:{n:'ヴァルディス',pal:'valdis',hp:[80,10],en:[30,2],str:[10,1.6],def:[6,.8],spd:[8,.3],wpn:[5,1.9],
    skills:[[1,'v_strike'],[1,'v_read'],[1,'v_tactics']]}
};
const FACE_EXTRA={'ミナ':'mina','グレム':'grem','ミリア':'milia','レイン':'rain','エルナ':'elna','ヴァルディス':'valdis','神崎':'kanzaki','結美':'kanzaki',
  '父':'father','恒一':'father','母':'mother','美咲':'mother','課長':'kacho','佐伯':'saeki','ナディア':'nadia',
  'ドルガン':'dorugan','グラウス':'graus','マリナ':'marina','グラント':'grant','コンラート':'konrat','ハルトヴィヒ':'hartwig',
  'ベイン':'bain','ドーラ':'dora','ヘルガ':'helga','アルフ':'alf','レオ':'leo','グレイブ':'grave',
  '藤井':'fujii','エドガー':'edgar','ノア':'noa','オルガ':'olga','オルガ代表':'olga','グレン':'glen','グレン艦長':'glen','ヘルマン':'herman','ヘルマン博士':'herman','オズ':'oz','ベルツ':'beltz','ベルツ提督':'beltz','ダンカン':'duncan','ダンカン中佐':'duncan','ボルゴ':'borgo','ボルゴ将軍':'borgo','リーナ':'rina','少年':'boy','村の男':'vman','村の女':'vwoman','少女':'girl','隊長':'captain','海賊':'pirate','役人':'clerk','ホルム':'holm','ホルム先生':'holm','ザルク':'zark','管制官':'ctrl','作業員':'worker','艦長':'shipcap','代表':'rep','アルセア代表':'rep','ボルド代表':'rep','リンダル代表':'rep','ネメス代表':'rep','セルト代表':'rep'};
for(const k in FACE_EXTRA)FACEOF[k]='f_'+FACE_EXTRA[k];
/* ---------- 追加の画像 ---------- */
(function(){
  const files={};
  ['pirate1','pirate2','pirate3','reactor','guardian','driller'].forEach(k=>files[k]='en_'+k);
  for(let i=1;i<=20;i++)files['xb_'+i]='xb_'+i;files.xe_10='xe_10';
  ['corvette','frigate','flagship','pirate_ship','imp_cruiser','imp_battleship'].forEach(k=>files['ship_'+k]='ship_'+k);
  ['wasteland','reactor','desert','space','empire','tokyo','timewarp','ancientfactory','pirateship','bridge','frontier_twilight'].forEach(k=>files['bg_'+k]='bg_'+k);
  files.ev_reunion='ev_reunion';files.ev_wedding='ev_wedding';
  Object.keys(FACE_EXTRA).forEach(k=>{const v=FACE_EXTRA[k];files['f_'+v]='face_'+v});
  for(const k in files){if(IMGS[k])continue;const i=new Image();i.onload=()=>{IMGS[k]=i};i.src='素材/game/'+files[k]+'.png'}
  {const i=new Image();i.onload=()=>{IMGS.chars3=i};i.src='素材/game/chars3.png'}
  {const i=new Image();i.onload=()=>{const c=document.createElement('canvas');c.width=64;c.height=43;const g=c.getContext('2d');g.imageSmoothingEnabled=true;g.drawImage(i,0,0,64,43);IMGS.snowwolf=c};i.src='素材/game/en_snowwolf.png'}
  Object.assign(SPRM,{"officer":{"row":0,"n":{"down":6,"left":6,"right":6,"up":6},"atlas":"chars3"},"imp":{"row":1,"n":{"down":8,"left":8,"right":8,"up":8},"atlas":"chars3"},"merchant":{"row":2,"n":{"down":8,"left":8,"right":8,"up":8},"atlas":"chars3"},"engineer":{"row":3,"n":{"down":9,"left":9,"right":9,"up":9},"atlas":"chars3"},"kachoS":{"row":4,"n":{"down":8,"left":8,"right":8,"up":8},"atlas":"chars3"}});
  SPRMAP.kacho='kachoS';delete SPRF.kacho;
  Object.assign(SPRMAP,{officer:'officer',imp:'imp',merchant:'merchant',engineer:'engineer'});
  const t2=IMGS.tiles2;
})();
/* ---------- 地面タイル(第2弾) ---------- */
const TEX2={g:0,a:1,n:2,i:3,e:4,h:5,q:6,z:7,u:8};
SOLID.add('Y');
const _tile=tile;
tile=function(ch,x,y,tx,ty){
  if(TEX2[ch]!==undefined&&IMGS.tiles2){ctx.drawImage(IMGS.tiles2,TEX2[ch]*48+(tx%3)*16,(ty%3)*16,16,16,x,y,16,16);return}
  if(ch==='Y'){const m=curMap();return tile(m&&m.ground?m.ground:'G',x,y,tx,ty)}
  return _tile(ch,x,y,tx,ty);
};
const _thing=thing;
thing=function(kind,x,y){
  if(kind==='chest'){if(!drawObj('crate',x+8,y+16))rect(x+2,y+6,12,9,'#a07030');return}
  if(kind==='save'){rect(x+3,y+4,10,10,'#2a3a5a');rect(x+4,y+5,8,6,'#6aa0ff');rect(x+6,y+12,4,2,'#889');if((frame>>5)&1)rect(x+5,y+6,6,1,'#cfe');return}
  return _thing(kind,x,y);
};
/* ---------- 敵の図鑑(章レベルで数値が決まる) ---------- */
// t=強さ(1=雑魚の小, 2.2=雑魚, 4=強い雑魚, 7=エリート)、boss=ボス倍率。look=見た目(img:画像名, f:色変え, s:拡大, r:右向きの絵なら1)
const LOOKS={};
function defEnemy(id,n,t,look,o){ENEMIES[id]=Object.assign({n,t,look,note:'',k:look.img,spd:7,boss:false},o||{})}
// 生き物
defEnemy('sandlizard','砂漠トカゲ',2.2,{img:'lizard',f:'saturate(1.4) brightness(1.1)',s:1.1});
defEnemy('wolf','雪原オオカミ',2.4,{img:'snowwolf',r:1,s:.9});
defEnemy('bigrat','大ネズミ',2,{img:'rat',s:1.5,f:'sepia(.6)'});
defEnemy('whitefang','白牙(群れの長)',9,{img:'snowwolf',r:1,s:1.5},{boss:true,spd:9});
// 宙賊・民間
defEnemy('pirate1','宙賊の下っ端',2,{img:'pirate1'});
defEnemy('pirate2','宙賊の銃手',2.4,{img:'pirate2'});
defEnemy('pirate3','宙賊の切り込み隊長',9,{img:'pirate3'},{boss:true});
defEnemy('pirate_vet','宙賊の古参',4.2,{img:'pirate3',s:.8});
defEnemy('raider','荒くれ者',2.6,{img:'pirate1',f:'hue-rotate(40deg) saturate(1.3)',s:1.1});
defEnemy('pirateking','海賊王ドルガン',12,{img:'pirate3',f:'saturate(1.2) brightness(.8)',s:1.4},{boss:true});
// 機械
defEnemy('drone','暴走ドローン',2,{img:'xe_10',s:1.5},{});
defEnemy('guardbot','警備ボット',2.8,{img:'xb_1',s:.42});
defEnemy('reactor','配電施設の制御機',10,{img:'reactor'},{boss:true});
defEnemy('guardian','遺跡の番人ガーディアン',8,{img:'guardian'},{boss:true});
defEnemy('driller','暴走採掘機',12,{img:'driller'},{boss:true});
defEnemy('ancientbot','古代の守護兵',3,{img:'xb_18',s:.42});
defEnemy('ancientguard','古代の衛兵',4,{img:'guardian',f:'brightness(1.1)',s:.75});
defEnemy('mechpriest','機械神教団の司祭',5,{img:'pirate3',f:'hue-rotate(250deg) saturate(.9)',s:.85});
defEnemy('cultist','機械神教団の信者',2.6,{img:'pirate1',f:'hue-rotate(250deg)'});
defEnemy('mechmonk','機械化僧兵',4,{img:'guardian',f:'hue-rotate(250deg)',s:.8});
defEnemy('ancientdef','古代管理防衛機構',22,{img:'xb_20',s:.85},{boss:true});
defEnemy('rampage','暴走機兵',14,{img:'xb_15',s:.85},{boss:true});
// 帝国・軍閥
defEnemy('soldier','帝国歩兵',2.6,{img:'pirate2',f:'grayscale(.5) brightness(.7) hue-rotate(200deg)'});
defEnemy('trooper','帝国突撃兵',3.4,{img:'pirate1',f:'grayscale(.5) brightness(.6) hue-rotate(200deg)'});
defEnemy('mecharmor','機動装甲兵',5,{img:'xb_19',s:.42,f:'grayscale(.6) brightness(.85)'});
defEnemy('scout','帝国の偵察兵',2.4,{img:'pirate2',f:'grayscale(.6) brightness(.9) sepia(.6)'});
defEnemy('knight','帝国近衛騎士',9,{img:'pirate3',f:'grayscale(.6) brightness(.6) hue-rotate(200deg)',s:1},{boss:true});
defEnemy('grant','グラント将軍',16,{img:'pirate3',f:'grayscale(.5) brightness(.5) hue-rotate(200deg)',s:1.3},{boss:true});
defEnemy('warlord','軍閥兵',3.6,{img:'pirate2',f:'hue-rotate(320deg) saturate(1.2) brightness(.8)'});
defEnemy('warlordheavy','軍閥の重機兵',5.5,{img:'xb_19',s:.5});
defEnemy('warlordflag','軍閥連合の旗艦の守り',24,{img:'xb_13',s:.9},{boss:true});
defEnemy('graus','グラウス総督',20,{img:'pirate3',f:'hue-rotate(300deg) brightness(.45)',s:1.45},{boss:true});
defEnemy('fortcore','要塞中枢',34,{img:'xb_7',s:.85},{boss:true});
// 時空
defEnemy('echo','時空の残響',3.4,{img:'pirate1',f:'invert(1) hue-rotate(120deg)',s:1});
// 時空の敵は反応炉の流用ではなく、時計の姿として描く。
(function(){
  const c=document.createElement('canvas');c.width=56;c.height=56;const g=c.getContext('2d');
  const R=(x,y,w,h,color)=>{g.fillStyle=color;g.fillRect(x,y,w,h)};
  R(14,3,28,3,'#28344e');R(8,6,40,3,'#28344e');R(5,9,46,38,'#28344e');R(8,47,40,3,'#28344e');R(14,50,28,3,'#28344e');
  R(9,9,38,38,'#7389a5');R(12,7,32,42,'#a9c1d0');R(8,13,40,30,'#a9c1d0');R(13,12,30,32,'#e1e5d9');R(11,16,34,24,'#e1e5d9');
  for(const [x,y] of [[27,13],[27,40],[12,27],[41,27],[17,17],[37,17],[17,37],[37,37]])R(x,y,3,3,'#48516b');
  R(26,17,3,12,'#25364c');R(27,26,11,3,'#25364c');R(25,25,5,5,'#c79555');R(4,24,3,8,'#6cc9de');R(49,24,3,8,'#6cc9de');
  IMGS.clockface=c;
})();
defEnemy('clock','止まった時計',3,{img:'clockface',s:.75});
defEnemy('lostgate','迷子のゲート',32,{img:'xb_14',s:.85},{boss:true});
// 艦隊戦
defEnemy('ship_pirate','宙賊船',3.4,{img:'ship_pirate_ship',r:1,s:1},{fleet:true});
defEnemy('ship_pirateboss','宙賊の旗艦',12,{img:'xb_8',s:.9},{boss:true,fleet:true});
defEnemy('ship_imp','帝国巡洋艦',5,{img:'ship_imp_cruiser',r:1},{fleet:true});
defEnemy('ship_impbig','帝国戦艦',16,{img:'ship_imp_battleship',r:1,s:1.3},{boss:true,fleet:true});
defEnemy('ship_warlord','軍閥の旗艦',24,{img:'xb_17',s:.95},{boss:true,fleet:true});
// 道中の追加敵(弾幕突撃戦闘機の絵を流用)
defEnemy('mechbee','機械蜂',2.4,{img:'xb_2',s:.42});
defEnemy('goldserpent','黄金の機械蛇',3.4,{img:'xb_4',s:.42});
defEnemy('gearserpent','鋼鉄の大蛇',4.2,{img:'xb_12',s:.45});
defEnemy('warcrab','砲装蟹',4.6,{img:'xb_9',s:.45});
defEnemy('cybdragon','機竜',6,{img:'xb_16',s:.5});
defEnemy('rift','時空の肉塊',4.4,{img:'xb_10',s:.45});
defEnemy('voidsquid','漂流砲イカ',3.6,{img:'xb_11',s:.45});
/* ---------- 画像の色変え・拡大(初回だけ作って使い回す) ---------- */
const LOOKC={};
function lookImg(look){
  const base=IMGS[look.img];if(!base)return null;
  if(!look.f&&!look.s)return base;
  const key=look.img+'|'+(look.f||'')+'|'+(look.s||1);
  if(LOOKC[key])return LOOKC[key];
  const s=look.s||1,c=document.createElement('canvas');c.width=Math.max(1,Math.round(base.width*s));c.height=Math.max(1,Math.round(base.height*s));
  const g=c.getContext('2d');g.imageSmoothingEnabled=false;
  try{if(look.f)g.filter=look.f}catch(e){}
  g.drawImage(base,0,0,c.width,c.height);LOOKC[key]=c;return c;
}
function drawEnemyU(e,cx,cy,flash,t){
  const def=ENEMIES[e.key];
  if(!def||!def.look||!IMGS[def.look.img]){return drawEnemy(e.k,cx,cy,flash,t)}
  const im=lookImg(def.look);if(!im)return;
  const b=Math.sin(t/12)*1.5;ctx.save();
  if(flash>0)ctx.filter='brightness(4)';
  if(def.look.r){ctx.drawImage(im,(cx-im.width/2)|0,(cy-im.height/2+b)|0)}
  else{ctx.translate(cx|0,0);ctx.scale(-1,1);ctx.drawImage(im,(-im.width/2)|0,(cy-im.height/2+b)|0)}
  ctx.restore();
}
const _drawEnemyField=drawEnemyField;
drawEnemyField=function(o,x,y){
  const def=ENEMIES[o.kind];
  if(def&&def.look&&IMGS[def.look.img]){
    const im=lookImg(def.look),w=o.boss?Math.min(46,im.width*.5):Math.max(14,Math.min(26,im.width*.45)),h=Math.round(im.height*w/im.width);
    ctx.save();ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high';
    ctx.fillStyle='rgba(0,0,0,.25)';ctx.fillRect(x+1,y+14,w,2);ctx.drawImage(im,x,y+16-h,w,h);ctx.restore();return;
  }
  return _drawEnemyField(o,x,y);
};
/* ---------- 仲間のデータ(章のレベルで能力が決まる) ---------- */
function mkMember(id,L){
  const d=CHAR_DEFS[id];const u={id,name:d.n,pal:d.pal,lv:L,exp:0,skills:[]};
  setLevel(u,L);u.hp=u.mhp;u.en=u.men;return u;
}
function setLevel(u,L){
  const d=CHAR_DEFS[u.id],g=(p)=>Math.round(p[0]+p[1]*(L-1));
  u.lv=L;u.mhp=g(d.hp);u.men=g(d.en);u.str=g(d.str);u.def=g(d.def);u.spd=g(d.spd);u.wpn=Math.round(d.wpn[0]+d.wpn[1]*L);
  u.skills=d.skills.filter(s=>s[0]<=L).map(s=>s[1]);
}
function gainExp(u,e){
  u.exp+=e;const ups=[];
  while(u.exp>=expNeed(u.lv)){
    u.exp-=expNeed(u.lv);const L=u.lv+1;const oh=u.mhp;setLevel(u,L);u.hp=Math.min(u.mhp,u.hp+(u.mhp-oh));ups.push(L);
  }
  return ups;
}
function activeParty(){return F.party.slice(0,4)}
/* ---------- 敵の作成(章レベルでスケール) ---------- */
function curL(){return F.ch>=2&&CHAPTERS[F.ch]?CHAPTERS[F.ch].lv:3}
function mkEnemy(key,i){
  const e=ENEMIES[key];const old=e.hp!==undefined&&!(F.ch>=2);
  let hp,atk,def,exp;
  if(old){hp=e.hp;atk=e.atk;def=e.def;exp=e.exp}
  else{
    const L=curL(),sc=.5+.5*L/3,t=e.t,bm=e.boss?1:1;
    hp=Math.round(30*sc*t*(e.boss?1.2:1));atk=Math.round(9*sc*(.45+.25*Math.min(t,6))*(1+.02*(L-9))*(e.boss?1.15:1));def=Math.round(1.5*sc*Math.min(t,3));
    exp=Math.round(expNeed(L)/(e.boss?3:16)*Math.max(.6,Math.min(1.6,t/2.2)));
  }
  return{name:e.n,key,hp,mhp:hp,atk,def,spd:old?(e.spd||7):Math.round(7+.27*(curL()-1)+(e.boss?1.5:0)),exp,k:e.k,gauge:Math.random()*40,side:'e',alive:true,idx:i,analyzed:false,flash:0,eat:0,fed:false,cx:0,cy:0,sleep:0,weak:0,boss:!!e.boss};
}
/* ---------- 技 ---------- */
function magDmg(u,e,pow){return Math.max(1,Math.round((pow*(8+2.2*u.lv)+u.men*.15-e.def*.8)*rnd(.9,1.1)*(u.bAtk>0?1.3:1)*fm().atk))}
async function hitMag(u,e,pow,label){
  bflash(label.includes('熱')?'rgba(255,130,40,.40)':label.includes('放電')?'rgba(190,220,255,.50)':label.includes('重力')?'rgba(140,60,200,.45)':label.includes('創造')?'rgba(255,255,255,.65)':'rgba(120,200,255,.30)');
  const d=magDmg(u,e,pow);se('hit');e.hp=Math.max(0,e.hp-d);e.flash=8;fx(e.cx,e.cy-20,''+d,'#9cf');bmsg(label,60);await sleep(28);
  if(e.hp<=0){e.alive=false;e.flash=0;bmsg(e.name+'を たおした!',60);await sleep(26)}
  else await bossCheck(e);
}
async function bossCheck(e){
  if(e.key==='boss'&&e.hp<=e.mhp*.3){bmsg('腹ペコ大トカゲは 後ずさりして 山へ 逃げていく……',90);B.result='bossflee';e.alive=false;await sleep(40)}
}
async function useSk(u,k,fn){return await fn(u)}
function skill(id,n,en,d,run){SK[id]={n,en,d,run}}
const sleepE=async(e,t)=>{e.sleep=t};
function allE(){return B.enemies.filter(e=>e.alive)}
skill('plan','段取り',4,'味方1人の行動ゲージを満タンにする。',async u=>{const t=await pickAlly(true);if(t<0)return false;u.en-=4;const a=B.party[t];a.gauge=100;bmsg('「段取りだ」 '+a.name+'が すぐに動ける!',80);se('ok');await sleep(40);return true});
skill('drone','自動会議押し付けドローン',6,'分身ドローンに会議を任せ、味方全員のゲージを大きく進める。',async u=>{u.en-=6;B.party.forEach(p=>{if(p.hp>0)p.gauge=Math.min(100,p.gauge+55)});bmsg('ドローンが 会議を引き受けた! みんなが 動きやすい!',90);se('ok');await sleep(50);return true});
skill('pto','有給申請',10,'味方全体のHPを4割回復し、疲労をなくす。',async u=>{u.en-=10;F.fatigue=0;B.party.forEach(p=>{if(p.hp>0){const h=Math.round(p.mhp*.4);p.hp=Math.min(p.mhp,p.hp+h);fx(p.cx,p.cy-10,'+'+h,'#7f7')}});se('heal');bmsg('「有給申請」 全員が 休めた!',80);await sleep(50);return true});
skill('orders','総指揮',20,'味方全員が すぐ動ける。',async u=>{u.en-=20;B.party.forEach(p=>{if(p.hp>0)p.gauge=100});bmsg('「総指揮」 全員が 動く!',80);se('ok');await sleep(40);return true});
skill('nantoka','なんとかなる',3,'自分のHPを4割回復する。',async u=>{u.en-=3;const h=Math.round(u.mhp*.4);u.hp=Math.min(u.mhp,u.hp+h);fx(u.cx,u.cy-10,'+'+h,'#7f7');se('heal');bmsg('「なんとかなる」',70);await sleep(40);return true});
skill('roar','治安局の号令',6,'敵全体の攻撃力を下げる。',async u=>{u.en-=6;allE().forEach(e=>e.weak=3);bmsg('「治安局の号令!」 敵が ひるんだ!',80);se('ok');await sleep(50);return true});
skill('migi','右腕の一撃',8,'力任せの強烈な一撃(3倍)。',async u=>{const t=await pickTarget();if(t<0)return false;u.en-=8;await hitEnemy(u,B.enemies[t],3,'「右腕の一撃!」');return true});
skill('s_heal','治療ナノ',3,'味方1人のHPを回復する。',async u=>{const t=await pickAlly();if(t<0)return false;u.en-=3;const a=B.party[t],h=Math.round((12+3*u.lv));a.hp=Math.min(a.mhp,a.hp+h);fx(a.cx,a.cy-10,'+'+h,'#7f7');se('heal');bmsg('ソフィアの 治療ナノ!',70);await sleep(40);return true});
skill('s_heat','熱演算',4,'敵1体に熱の攻撃。',async u=>{const t=await pickTarget();if(t<0)return false;u.en-=4;await hitMag(u,B.enemies[t],2,'ソフィアの 熱演算!');return true});
skill('s_thunder','放電演算',6,'敵全体に雷の攻撃。',async u=>{u.en-=6;bmsg('ソフィアの 放電演算!',60);for(const e of allE())await hitMag(u,e,1.2,'放電演算!');return true});
skill('s_revive','再起動',15,'倒れた味方1人を蘇生する(HP半分)。',async u=>{const t=await pickDead();if(t<0)return false;u.en-=15;const a=B.party[t];a.hp=Math.round(a.mhp/2);a.alive=true;a.gauge=0;se('heal');fx(a.cx,a.cy-10,'再起動','#7f7');bmsg('ソフィアの 再起動!',80);await sleep(50);return true});
skill('s_healall','治療ナノ・群',10,'味方全体のHPを回復する。',async u=>{u.en-=10;const h=Math.round(20+4*u.lv);B.party.forEach(a=>{if(a.hp>0){a.hp=Math.min(a.mhp,a.hp+h);fx(a.cx,a.cy-10,'+'+h,'#7f7')}});se('heal');bmsg('治療ナノ・群!',70);await sleep(40);return true});
skill('s_gravity','重力演算',14,'敵全体に重力の攻撃。動きも遅くなる。',async u=>{u.en-=14;bmsg('ソフィアの 重力演算!',60);for(const e of allE()){await hitMag(u,e,2,'重力演算!');if(e.alive)e.gauge=Math.max(-30,e.gauge-50)}return true});
skill('s_create','創造権限',40,'創造神システムの権限で放つ最強の一撃。',async u=>{const t=await pickTarget();if(t<0)return false;u.en-=40;await hitMag(u,B.enemies[t],5.5,'「創造権限」 ソフィアの 最大の力!');return true});
skill('m_theory','理論上可能です!',4,'威力はランダム。大成功も、爆発もある。',async u=>{u.en-=4;const r=Math.random();
  if(r<.25){const d=Math.round(u.mhp*.2);u.hp=Math.max(1,u.hp-d);u.flash=8;fx(u.cx,u.cy-10,''+d,'#f88');se('hit');bmsg('「あっ」 爆発した!',70);await sleep(40);return true}
  if(r<.75){const t=await pickTarget();if(t<0){u.en+=4;return false}await hitMag(u,B.enemies[t],2.4,'「理論上可能です!」');return true}
  bmsg('「大成功です!」',60);for(const e of allE())await hitMag(u,e,2.8,'大成功!');return true});
skill('m_try','試してみましょう!',3,'敵1体を眠らせる(2ターン)。',async u=>{const t=await pickTarget();if(t<0)return false;u.en-=3;const e=B.enemies[t];if(e.boss&&Math.random()<.5){bmsg('ボスには 効かなかった!',70)}else{e.sleep=2;bmsg('「試してみましょう!」 '+e.name+'は 眠った!',80)}se('ok');await sleep(40);return true});
skill('m_wall','建設ドローン',8,'3ターン、味方全体の守りが上がる。',async u=>{u.en-=8;B.party.forEach(p=>p.bDef=3);bmsg('建設ドローンが 壁を作った!',80);se('ok');await sleep(50);return true});
skill('m_dismantle','高出力作業ドローン',15,'敵1体に高出力の攻撃。',async u=>{const t=await pickTarget();if(t<0)return false;u.en-=15;await hitMag(u,B.enemies[t],4.2,'作業ドローンの 高出力攻撃!');return true});
skill('r_snipe','狙撃',2,'必中の強い一撃。',async u=>{const t=await pickTarget();if(t<0)return false;u.en-=2;await hitEnemy(u,B.enemies[t],1.9,'レインの 狙撃!');return true});
skill('r_suppress','制圧射撃',5,'敵全体を撃つ。',async u=>{u.en-=5;bmsg('レインの 制圧射撃!',60);for(const e of allE())await hitEnemy(u,e,1.1,'制圧射撃!');return true});
skill('r_reality','現実を見ましょう',4,'敵1体の攻撃力を3ターン下げる。',async u=>{const t=await pickTarget();if(t<0)return false;u.en-=4;B.enemies[t].weak=3;bmsg('「現実を見ましょう」',70);se('ok');await sleep(40);return true});
skill('r_mission','任務ですので',6,'味方全体の攻撃力が3ターン上がる。',async u=>{u.en-=6;B.party.forEach(p=>p.bAtk=3);bmsg('「任務ですので」 全員の攻撃が 上がった!',80);se('ok');await sleep(50);return true});
skill('r_barrage','艦砲支援',12,'敵全体に大ダメージ。',async u=>{u.en-=12;bmsg('艦砲支援!',60);for(const e of allE())await hitEnemy(u,e,2.0,'艦砲が 降り注ぐ!');return true});
skill('e_slash','帝国剣術・一閃',2,'鋭い一撃。',async u=>{const t=await pickTarget();if(t<0)return false;u.en-=2;await hitEnemy(u,B.enemies[t],1.8,'エルナの 一閃!');return true});
skill('e_noble','帝国貴族として',5,'3ターン、味方全体の守りが上がる。',async u=>{u.en-=5;B.party.forEach(p=>p.bDef=3);bmsg('「帝国貴族として」 守りが 上がった!',80);se('ok');await sleep(50);return true});
skill('e_disap','見損ないました',4,'敵1体の攻撃力を大きく下げる。',async u=>{const t=await pickTarget();if(t<0)return false;u.en-=4;B.enemies[t].weak=4;bmsg('「見損ないました」',70);se('ok');await sleep(40);return true});
skill('e_order','皇女の号令',10,'味方全体の攻撃力が3ターン上がる。',async u=>{u.en-=10;B.party.forEach(p=>p.bAtk=3);bmsg('「皇女の号令!」',80);se('ok');await sleep(50);return true});
skill('e_newera','新しい時代の剣',14,'光の大技(4倍)。',async u=>{const t=await pickTarget();if(t<0)return false;u.en-=14;await hitEnemy(u,B.enemies[t],4,'「新しい時代の剣!」');return true});
skill('v_strike','元帥の一撃',3,'重い一撃。',async u=>{const t=await pickTarget();if(t<0)return false;u.en-=3;await hitEnemy(u,B.enemies[t],2.2,'ヴァルディスの 一撃!');return true});
skill('v_read','義眼の読み',0,'敵1体の動きを読み、弱点と体力を見る。',async u=>{const t=await pickTarget();if(t<0)return false;const e=B.enemies[t];e.analyzed=true;await say('ヴァルディス',['実に興味深い。','その動きは、'+e.name+'の体力 '+e.hp+' ほど。']);return true});
skill('v_tactics','用兵',6,'味方全体の攻撃が上がり、敵が遅れる。',async u=>{u.en-=6;B.party.forEach(p=>p.bAtk=3);allE().forEach(e=>e.gauge=Math.max(-20,e.gauge-30));bmsg('「それが人間だ」',80);se('ok');await sleep(50);return true});
pickTarget=async function(title){
  const es=B.enemies.map(e=>({label:e.name+(e.analyzed&&e.alive?' HP'+e.hp:''),disabled:!e.alive}));
  B.targetMenu=true;
  try{return await pickMenu(es,{x:4,y:136,w:160,title:title||'だれに?'})}
  finally{B.targetMenu=false}
};
async function pickDead(){
  const ps=B.party.map(p=>({label:p.name,right:p.hp<=0?'倒れている':'',disabled:p.hp>0}));
  if(!ps.some(p=>!p.disabled)){await say('',['倒れている仲間は いない。']);return -1}
  return pickMenu(ps,{x:4,y:136,w:150,title:'だれを?'});
}
async function pickAlly(includeAll){
  const ps=B.party.map(p=>({label:p.name,right:p.hp+'/'+p.mhp,disabled:p.hp<=0}));
  return pickMenu(ps,{x:4,y:136,w:150,title:'だれに?'});
}
/* ---------- 戦闘(全面書き直し: 最大4人、バフ、眠り、艦隊戦) ---------- */
const FORM={none:{n:'通常',atk:1,def:1,aoe:1},spindle:{n:'紡錘陣',atk:1.3,def:1.2,aoe:1},circle:{n:'方円陣',atk:.9,def:.75,aoe:1},scatter:{n:'疎開陣',atk:1,def:.9,aoe:.5}};
function fm(){return (B&&B.fleet&&FORM[B.form||'none'])||FORM.none}
function calcDmg(u,e,mult){
  let d=(u.str*2+(u.wpn||0))*(u.side==='p'?curFatMult()*fm().atk:1)*(u.bAtk>0?1.3:1)-e.def*1.5;
  return Math.max(1,Math.round(d*mult*rnd(.9,1.1)));
}
async function hitEnemy(u,e,mult,label){
  const d=calcDmg(u,e,mult);
  se('hit');e.hp=Math.max(0,e.hp-d);e.flash=8;fx(e.cx,e.cy-20,''+d);bmsg(label,60);
  await sleep(28);
  if(e.hp<=0){e.alive=false;e.flash=0;bmsg(e.name+'を たおした!',60);await sleep(26)}
  else await bossCheck(e);
}
async function enemyTurn(e){
  if(e.eat>0){e.eat--;bmsg(e.name+'は むしゃむしゃ 食べている……',70);await sleep(50);if(e.eat===0&&e.key==='boss')bmsg('満腹で 力が 抜けたようだ。',70);return}
  if(e.sleep>0){e.sleep--;bmsg(e.name+'は 眠っている……',60);await sleep(40);return}
  const ps=aliveP();if(!ps.length)return;
  const def=ENEMIES[e.key];
  let r=Math.random(),act='bite';
  if(e.key==='boss'){act=r<.5?'bite':r<.8?'charge':'howl'}
  else if(e.key==='lizard'){act=r<.7?'bite':'bite2'}
  else if(e.boss){act=r<.55?'bite':r<.8?'charge':'bite2'}
  else if(ps.length>1&&r<.15)act='charge';
  if(act==='howl'){bmsg('ぐぅぅ…… おなかがすいた! と言いたげだ。',80);await sleep(60);return}
  const wk=e.weak>0?.7:1;if(e.weak>0)e.weak--;
  const verb=def&&def.fleet?['砲撃!','主砲を 放つ!','ミサイルを 発射!']:['こうげき!','襲いかかる!','なぐりかかる!'];
  if(act==='charge'){
    bmsg(e.name+'の 全体攻撃!',70);await sleep(25);
    for(const p of ps){await dmgParty(e,p,.7*wk,true)}
    return;
  }
  let t=ps[Math.random()*ps.length|0];
  if(t.cover&&t.cover.hp>0&&t.cover!==t){t=t.cover;bmsg(t.name+'が かばった!',40);await sleep(20)}
  bmsg(e.name+'の '+(act==='bite2'?'強烈な一撃!':verb[Math.random()*verb.length|0]),60);await sleep(25);
  await dmgParty(e,t,(act==='bite2'?1.3:1)*wk);
}
async function dmgParty(e,p,mult,area=false){
  let d=Math.max(1,Math.round((e.atk*1.2-p.def*(p.bDef>0?1.5:1))*mult*rnd(.9,1.1)*fm().def*(area?fm().aoe:1)));
  se('hit');p.hp=Math.max(0,p.hp-d);p.flash=8;fx(p.cx,p.cy-12,''+d,'#f88');
  await sleep(24);
  if(p.hp<=0){bmsg(p.name+'は 倒れた……',70);se('no');await sleep(36);p.gauge=0}
}
function endTurn(u){if(u.bAtk>0)u.bAtk--;if(u.bDef>0)u.bDef--}
async function battle(spec){
  G.mode='battle';G.busy=true;
  const party=activeParty().map(p=>Object.assign(p,{gauge:Math.random()*35,side:'p',alive:p.hp>0,flash:0,cover:null,cx:0,cy:0,bAtk:0,bDef:0}));
  const enemies=spec.enemies.map(mkEnemy);
  // ボス級の随伴敵は主役より一段弱くし、複数ボスの長期戦を避ける。
  if(spec.boss&&F.ch>=2)enemies.slice(1).filter(e=>e.boss).forEach(e=>{e.mhp=Math.max(1,Math.round(e.mhp*.3));e.hp=e.mhp;e.atk=Math.max(1,Math.round(e.atk*.65))});
  const boss=!!spec.boss||enemies.some(e=>e.boss);
  B={party,enemies,msg:'',msgT:0,fx:[],bg:spec.bg||'grass',boss,fleet:!!spec.fleet||enemies.every(e=>ENEMIES[e.key].fleet),buys:0,t:0,result:null,bgmSave:bgmName,fed:0,flee:spec.flee};
  enemies.forEach((e,i)=>{
    if(enemies.length===1){e.cx=70;e.cy=boss?74:78}
    else{e.cx=40+i*50;e.cy=70+(i%2)*14}
    if(B.fleet&&enemies.length>1){e.cx=44+i*56;e.cy=60+(i%2)*26}
  });
  party.forEach((p,i)=>{p.cx=188+(i%2)*26;p.cy=44+i*22});
  bgm(boss?'boss':'battle');se('warp');
  await fadeTo(1,'#fff',.14);await sleep(2);G.mode='battle';await fadeTo(0,null,.12);
  bmsg(spec.msg||(boss?enemies[0].name+'が 立ちふさがった!':enemies.map(e=>e.name).join('と ')+'が あらわれた!'),90);
  await sleep(40);
  while(true){
    let actor=null;
    while(!actor){
      await nextFrame();B.t++;
      if(B.msgT>0)B.msgT--;
      for(const u of party.concat(enemies)){
        if(!u.alive||u.hp<=0)continue;
        const mult=u.side==='p'?curFatMult():1;
        u.gauge+=u.spd*0.075*mult;
        if(u.flash>0)u.flash--;
        if(u.gauge>=100&&!actor)actor=u;
      }
      for(const e of enemies)if(e.flash>0&&!e.alive)e.flash--;
      B.fx=B.fx.filter(f=>--f.life>0);
    }
    actor.gauge=0;
    if(actor.side==='p'){await playerTurn(actor);endTurn(actor)}else await enemyTurn(actor);
    if(B.result)break;
    if(enemies.every(e=>!e.alive)){B.result='win';break}
    if(party.every(p=>p.hp<=0)){B.result='lose';break}
  }
  const r=B.result;
  if(r==='win'||r==='bossflee'){
    bgm('');se('win');await sleep(20);
    const gain=enemies.reduce((s,e)=>s+(r==='bossflee'&&e.hp>0?e.exp:(e.alive?0:e.exp)),0);
    const cr=Math.round(gain/12)+enemies.length*2;
    F.fatigue=Math.min(100,F.fatigue+3);F.credits+=cr;
    await say('',[(r==='bossflee'?'腹ペコ大トカゲは 山の奥へ 逃げていった。':'戦いに 勝った!'),'経験値 '+gain+'  クレジット +'+cr]);
    for(const p of party){
      if(p.hp<=0)p.hp=1;
      const ups=gainExp(p,gain);
      if(ups.length){se('lvup');await say('',[p.name+' は レベル '+ups[ups.length-1]+' に 上がった!'+(CHAR_DEFS[p.id]&&CHAR_DEFS[p.id].skills.some(s=>s[0]===ups[ups.length-1])?'\n新しい技を 覚えた!':'')]);}
    }
  }else if(r==='lose'){
    await fadeTo(1,'#000',.05);G.mode='field';
    await say('',['全滅してしまった……','(お金も持ち物も減らない。街で目を覚ます)']);
    F.party.forEach(p=>{p.hp=p.mhp;p.en=p.men});
    G.mode='field';
    await loseReturn();
    await fadeTo(0,null,.06);
  }else if(r==='flee'){se('warp')}
  G.mode='field';B=null;
  if(r!=='lose'){bgm(bgmName==='boss'||bgmName==='battle'?'':bgmName)}
  G.busy=true;
  return r;
}
async function loseReturn(){
  if(F.ch>=2){const m=MAPS['C'+F.ch+'T'];if(m){await setMap(m.id,m.spawn[0],m.spawn[1],'down',true);bgm(CHAPTERS[F.ch].bgm||'village');return}}
  await setMap('VIL',5,4,'down',true);
}
async function playerTurn(u){
  while(true){
    const cmds=[{id:'atk',label:B.fleet?'砲撃':'たたかう'},{id:'skill',label:'わざ',disabled:!u.skills.length},{id:'shop',label:'ネット注文',disabled:!F.flags.netsuper},{id:'item',label:'どうぐ'},{id:'ana',label:'分析',disabled:!F.flags.sophiaMet}];
    if(B.fleet)cmds.push({id:'form',label:'陣形'});
    cmds.push({id:'run',label:'にげる',disabled:B.boss});
    const c=cmds[await pickMenu(cmds,{x:4,y:B.fleet?80:96,w:96,title:u.name,cancel:false,rows:cmds.length})].id;
    if(c==='atk'){const t=await pickTarget();if(t<0)continue;await attack(u,B.enemies[t]);return}
    if(c==='skill'){
      const sk=u.skills.map(k=>({label:SK[k].n,right:SK[k].en?'EN'+SK[k].en:'',disabled:u.en<SK[k].en}));
      const s2=await pickMenu(sk,{x:4,y:136,w:150,title:'わざ',rows:4,foot:i=>SK[u.skills[i]].d});
      if(s2<0)continue;
      const done=await SK[u.skills[s2]].run(u);if(done)return;continue;
    }
    if(c==='shop'){const ok=await battleShop(u);if(ok)return;continue}
    if(c==='item'){const ok=await battleItem(u);if(ok)return;continue}
    if(c==='form'){
      const fs=['spindle','circle','scatter','none'];
      const lab={spindle:'紡錘陣  攻撃↑ 守り↓',circle:'方円陣  守り↑ 攻撃↓',scatter:'疎開陣  全体攻撃に強い',none:'通常の陣形'};
      const f=await pickMenu(fs.map(k=>({label:lab[k],disabled:(B.form||'none')===k})),{x:4,y:96,w:200,title:'陣形(いま: '+FORM[B.form||'none'].n+')',foot:i=>''});
      if(f<0)continue;
      B.form=fs[f];bmsg('艦隊は '+FORM[B.form].n+' に 陣形を組んだ!',80);se('ok');await sleep(50);return;
    }
    if(c==='ana'){
      const t=await pickTarget('分析');if(t<0)continue;
      const e=B.enemies[t];e.analyzed=true;se('ok');
      const tip=e.key==='boss'?'ひどく飢えています。肉を投げれば、食べている間は動きません。':(ENEMIES[e.key].note||'計算上、特別な弱点はありません。');
      await say('ソフィア',['分析します。','計算上、'+e.name+'の HPは '+e.hp+'。',tip]);return;
    }
    if(c==='run'){
      if(Math.random()<.75){bmsg('うまく 逃げきれた!',60);await sleep(40);B.result='flee';return}
      bmsg('逃げられなかった!',60);await sleep(40);return;
    }
  }
}
/* ---------- アイテム(章ごとに解禁) ---------- */
Object.assign(ITEMS,{
  bento:{n:'大盛り弁当',price:12,use:'hp',v:200,max:6,ch:3,d:'HP200回復。ボリューム満点。'},
  revive:{n:'蘇生薬',price:30,use:'revive',v:.5,max:3,ch:3,d:'倒れた仲間をHP半分で復活させる。'},
  nano:{n:'医療ナノカプセル',price:40,use:'hp',v:500,max:5,ch:6,d:'HP500回復。'},
  boost:{n:'ENブースト',price:25,use:'en',v:120,fat:8,max:3,ch:7,d:'EN120回復。'},
  revive2:{n:'蘇生ナノ(高級)',price:90,use:'revive',v:1,max:3,ch:9,d:'倒れた仲間をHP全開で復活させる。'},
  nano2:{n:'再生ナノカプセル',price:90,use:'hp',v:1200,max:5,ch:11,d:'HP1200回復。'},
  nano3:{n:'創造の雫',price:200,use:'hp',v:3000,max:4,ch:14,d:'HP3000回復。'}
});
function shopKeys(){return Object.keys(ITEMS).filter(k=>(ITEMS[k].ch||0)<=(F.ch||1))}
const _resetStock=resetStock;
resetStock=function(){for(const k in ITEMS)F.stock[k]=ITEMS[k].max};
async function battleShop(u){
  if(B.buys>=3){await say('ソフィア',['戦闘中の注文は 3回までです。']);return false}
  const keys=shopKeys();
  const it=keys.map(k=>({icon:'ic_'+k,label:ITEMS[k].n,right:priceFight(ITEMS[k].price)+'c ×'+(F.stock[k]??0),disabled:(F.stock[k]??0)<=0||F.credits<priceFight(ITEMS[k].price)}));
  const s=await pickMenu(it,{x:4,y:100,w:190,title:'ネットスーパー(戦闘手数料2割増) '+F.credits+'c',rows:5,foot:i=>ITEMS[keys[i]].d});
  if(s<0)return false;
  const k=keys[s];const ok=await useItemBattle(u,k,true);
  if(ok){F.credits-=priceFight(ITEMS[k].price);F.stock[k]--;B.buys++;se('buy')}
  return ok;
}
async function battleItem(u){
  const keys=Object.keys(ITEMS).filter(k=>(F.bag[k]||0)>0);
  if(!keys.length){await say('',['持っている物が ない。']);return false}
  const s=await pickMenu(keys.map(k=>({icon:'ic_'+k,label:ITEMS[k].n,right:'×'+F.bag[k]})),{x:4,y:100,w:170,title:'どうぐ',rows:5,foot:i=>ITEMS[keys[i]].d});
  if(s<0)return false;
  const ok=await useItemBattle(u,keys[s],false);
  if(ok)F.bag[keys[s]]--;
  return ok;
}
async function useItemBattle(u,k,drone){
  const it=ITEMS[k];
  if(it.use==='meat'){
    const t=await pickTarget('投げる相手');if(t<0)return false;const e=B.enemies[t];
    if(drone){bmsg('空間から 骨付き肉が 現れた!',70);se('warp');await sleep(40)}
    bmsg('骨付き肉を '+e.name+'に 投げた!',70);await sleep(30);
    if(['boss','lizard','rat','wolf','whitefang','bigrat','sandlizard'].includes(e.key)){
      e.eat=e.boss?2:1;if(e.key==='boss'&&!e.fed){e.fed=true;e.atk=Math.round(e.atk*.65)}
      bmsg(e.name+'は 夢中で 食べている……',80);await sleep(50);
    }else{bmsg('……なにも 起きなかった。',60);await sleep(40)}
    return true;
  }
  if(it.use==='revive'){
    const t=await pickDead();if(t<0)return false;const a=B.party[t];
    if(drone){bmsg(it.n+'が 空間から 現れた!',70);se('warp');await sleep(40)}
    a.hp=Math.round(a.mhp*it.v);a.alive=true;a.gauge=0;se('heal');fx(a.cx,a.cy-10,'復活','#7f7');bmsg(a.name+'は 復活した!',70);await sleep(50);return true;
  }
  const t=await pickAlly();if(t<0)return false;const a=B.party[t];
  if(drone){bmsg(it.n+'が 空間から 現れた!',70);se('warp');await sleep(40)}
  if(it.use==='hp'){const h=Math.min(a.mhp-a.hp,it.v);a.hp+=h;fx(a.cx,a.cy-10,'+'+h,'#7f7');se('heal')}
  if(it.use==='en'){const h=Math.min(a.men-a.en,it.v);a.en+=h;fx(a.cx,a.cy-10,'+'+h,'#8cf');se('heal')}
  if(it.fat)F.fatigue=Math.max(0,Math.min(100,F.fatigue+it.fat));
  bmsg(a.name+'は '+it.n+'を 使った。',70);await sleep(50);return true;
}
async function shopMenu(forced){
  while(true){
    const keys=shopKeys();
    const it=keys.map(k=>({icon:'ic_'+k,label:ITEMS[k].n,right:ITEMS[k].price+'c 残'+(F.stock[k]??0),disabled:(F.stock[k]??0)<=0||F.credits<ITEMS[k].price||(forced&&k!==forced)}));
    const s=await pickMenu(it,{x:8,y:30,w:220,title:'ネットスーパー  所持 '+F.credits+'c',rows:6,cancel:!forced,foot:i=>ITEMS[keys[i]].d});
    if(s<0)return;
    const k=keys[s];F.credits-=ITEMS[k].price;F.stock[k]--;F.bag[k]=(F.bag[k]||0)+1;se('buy');se('warp');
    await sleep(20);toast(ITEMS[k].n+'が 空間から 現れた。');
    if(forced)return;
  }
}
async function menuItems(){
  while(true){
    const keys=Object.keys(ITEMS).filter(k=>(F.bag[k]||0)>0);
    if(!keys.length){await say('',['持っている物は ない。']);return}
    const s=await pickMenu(keys.map(k=>({icon:'ic_'+k,label:ITEMS[k].n,right:'×'+F.bag[k]})),{x:8,y:30,w:170,title:'アイテム',rows:6,foot:i=>ITEMS[keys[i]].d});
    if(s<0)return;
    const it=ITEMS[keys[s]];
    if(it.use==='meat'){await say('',['戦闘で 投げる物だ。']);continue}
    const t=await pickMenu(F.party.map(p=>({label:p.name,right:p.hp+'/'+p.mhp})),{x:60,y:60,w:150,title:'だれに?'});
    if(t<0)continue;
    const a=F.party[t];
    if(it.use==='revive'){if(a.hp>0){await say('',['倒れていない。']);continue}a.hp=Math.round(a.mhp*it.v)}
    else if(a.hp<=0){await say('',['倒れている。蘇生薬が 要る。']);continue}
    if(it.use==='hp')a.hp=Math.min(a.mhp,a.hp+it.v);
    if(it.use==='en')a.en=Math.min(a.men,a.en+it.v);
    if(it.fat)F.fatigue=Math.max(0,Math.min(100,F.fatigue+it.fat));
    F.bag[keys[s]]--;se('heal');
  }
}
async function menuStatus(){
  for(const p of F.party){
    await say(p.name,['Lv'+p.lv+'  HP '+p.hp+'/'+p.mhp+'  EN '+p.en+'/'+p.men,'力'+p.str+' 守り'+p.def+' 素早さ'+p.spd,'技: '+(p.skills.map(k=>SK[k]?SK[k].n:k).join('、')||'なし'),'疲労 '+(F.fatigue|0)+'/100']);
  }
}
/* ---------- 戦闘画面の追加描画(艦隊戦: 旗艦を右に) ---------- */
const _drawBattle=drawBattle;
function bflash(c){if(B)B.fl={c,t:10}}
function drawFleetLayer(){
  const t=B.t;
  // 味方: 旗艦+護衛艦(残りHPに応じて数が減る=損害)
  const avg=B.party.reduce((a,p)=>a+Math.max(0,p.hp)/p.mhp,0)/Math.max(1,B.party.length);
  const n=Math.max(1,Math.ceil(7*avg));
  const kinds=['ship_corvette','ship_frigate','ship_corvette','ship_frigate','ship_corvette','ship_frigate','ship_corvette'];
  const fm0=B.form||'none';
  const fx0=fm0==='spindle'?-14:fm0==='scatter'?18:0;
  for(let i=0;i<n;i++){
    const im=IMGS[kinds[i]];if(!im)continue;
    const a=i/(n)*6.28+t/90;
    const ox=fm0==='scatter'?Math.cos(a)*44:(fm0==='spindle'?-i*12:Math.cos(a)*(18+i*4));
    const oy=fm0==='scatter'?Math.sin(a)*30:(fm0==='spindle'?(i%2?7:-7)*(1+i*.2):Math.sin(a)*(14+i*2));
    const w=26,h=im.height*w/im.width;
    ctx.save();ctx.translate(186+ox+fx0,76+oy+Math.sin(t/12+i)*1.5);ctx.scale(-1,1);ctx.drawImage(im,-w/2,-h/2,w,h);ctx.restore();
  }
  const fl=IMGS.ship_flagship;
  if(fl){const w=70,h=fl.height*w/fl.width;ctx.save();ctx.translate(206+fx0*.4,76+Math.sin(t/14)*1.5);ctx.scale(-1,1);ctx.drawImage(fl,-w/2,-h/2,w,h);ctx.restore()}
  // 敵: 残りHPに応じた随伴艦
  for(const e of B.enemies){
    if(!e.alive)continue;const def=ENEMIES[e.key];const im=def&&def.look&&IMGS[def.look.img];if(!im)continue;
    const m=Math.max(0,Math.min(7,Math.ceil(6*e.hp/e.mhp)));
    for(let i=0;i<m;i++){
      const a=i/m*6.28-t/110,w=22,h=im.height*w/im.width;
      ctx.save();ctx.globalAlpha=.9;ctx.drawImage(im,e.cx+Math.cos(a)*(34+(i%2)*8)-w/2,e.cy+Math.sin(a)*26-h/2+Math.sin(t/13+i)*1.5,w,h);ctx.restore();
    }
  }
  // ビーム
  if(B.beams>0){
    B.beams--;
    for(let i=0;i<5;i++){
      const e=B.enemies.filter(x=>x.alive)[Math.floor(rnd(0,99))%Math.max(1,B.enemies.filter(x=>x.alive).length)];if(!e)break;
      const sx=170+rnd(-20,30),sy=60+rnd(-20,30),ex=e.cx+rnd(-20,20),ey=e.cy+rnd(-16,16);
      ctx.strokeStyle=['#7fffd4','#ffe080','#ff8080'][i%3];ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(sx,sy);ctx.lineTo(ex,ey);ctx.stroke();
    }
  }
}
const _se=se;
se=function(n){_se(n);if(B&&B.fleet&&n==='hit')B.beams=8;if(B){if(n==='heal')bflash('rgba(120,255,160,.30)');if(n==='hit')B.shake=5;if(n==='lvup')bflash('rgba(255,240,150,.30)')}};
drawBattle=function(){
  if(B&&B.shake>0){ctx.save();ctx.translate(Math.round((Math.random()-.5)*B.shake),Math.round((Math.random()-.5)*B.shake));B.shake--;_drawBattle();ctx.restore()}
  else _drawBattle();
  if(B&&B.fleet)drawFleetLayer();
  if(B&&B.targetMenu&&UI&&B.enemies[UI.sel]){
    const e=B.enemies[UI.sel];
    txt('▼',Math.max(2,Math.min(W-14,e.cx-5)),Math.max(4,e.cy-35+((frame>>4)%2)),'#ffe08a',false);
  }
  if(B&&B.fl&&B.fl.t>0){ctx.globalAlpha=Math.min(1,B.fl.t/10);rect(0,0,W,138,B.fl.c);ctx.globalAlpha=1;B.fl.t--}
};
/* ====================================================================
   章の進行
   ==================================================================== */
const STYLES={
  grass:{ground:'G',path:'d',wall:'Y',kinds:['tree','fir'],bld:'house',indoor:false},
  sand:{ground:'a',path:'d',wall:'Y',kinds:['cactus','rock','deadtree'],bld:'tent',indoor:false},
  snow:{ground:'n',path:'i',wall:'Y',kinds:['snowfir','icecrystal'],bld:'house',indoor:false},
  city:{ground:'e',path:'z',wall:'Y',kinds:['tree','tower'],bld:'tower',indoor:false},
  ship:{ground:'h',path:'u',wall:'W',kinds:['generator'],bld:'generator',indoor:true},
  empire:{ground:'q',path:'u',wall:'W',kinds:['generator'],bld:'tower',indoor:true},
  road:{ground:'z',path:'e',wall:'Y',kinds:['tree','tower'],bld:'house',indoor:false},
  ruin:{ground:'S',path:'S',wall:'r',kinds:[],bld:'stele',indoor:false},
  cave:{ground:'U',path:'U',wall:'#',kinds:[],bld:'pillar',indoor:true},
  forest:{ground:'m',path:'d',wall:'Y',kinds:['tree','fir'],bld:'tree',indoor:false},
  factory:{ground:'h',path:'h',wall:'W',kinds:['generator'],bld:'generator',indoor:true}
};
function rngSeed(s){let a=s*9301+49297;return()=>{a=(a*9301+49297)%233280;return a/233280}}
function decosFor(m,kinds){
  for(let y=0;y<m.h;y++)for(let x=0;x<m.w;x++){
    if(m.g[y][x]==='Y'&&kinds.length){const k=kinds[Math.floor(hash(x*3,y*7)*kinds.length)];m.decos.push({k,x:x+.5,y:y+1})}
  }
}
const SLOTS=[[6,8],[10,11],[15,7],[18,11],[8,5],[20,7],[4,12],[13,13],[22,12],[16,5]];
function genTown(n,ch){
  const st=STYLES[ch.style]||STYLES.grass,W=26,H=18;
  const m=mkMap('C'+n+'T',W,H,st.ground,(CHBGM[n]||[])[0]||ch.bgm||'village',(m,g)=>{
    m.ground=st.ground;m.indoor=st.indoor;m.chapter=n;
    R(g,0,0,W,1,st.wall);R(g,0,H-1,W,1,st.wall);R(g,0,0,1,H,st.wall);R(g,W-1,0,1,H,st.wall);
    R(g,2,8,W-3,2,st.path);R(g,11,2,2,H-3,st.path);
    // 建物(通れない)
    const B2=[[3,2,6,3],[14,2,6,3],[3,12,6,3],[15,12,6,3]];
    B2.forEach(b=>{R(g,b[0],b[1],b[2],b[3],'Y')});
    // 出入口(東)
    g[8][W-1]=st.path;g[9][W-1]=st.path;
    m.spawn=[12,10];m.gate=[W-2,8];
  });
  const kinds=st.kinds;
  [[3,2,6,3],[14,2,6,3],[3,12,6,3],[15,12,6,3]].forEach((b,i)=>{
    const k=(ch.buildings&&ch.buildings[i])||st.bld;m.decos.push({k,x:b[0]+b[2]/2,y:b[1]+b[3],sc:1.15});
  });
  // 外周の飾り
  for(let x=1;x<W-1;x+=2){for(const y of [0]){if(m.g[y][x]==='Y'&&kinds.length)m.decos.push({k:kinds[x%kinds.length],x:x+.5,y:y+1})}}
  for(let x=1;x<W-1;x+=2){if(kinds.length)m.decos.push({k:kinds[(x+1)%kinds.length],x:x+.5,y:H})}
  for(let y=1;y<H-1;y+=2){if(kinds.length){m.decos.push({k:kinds[y%kinds.length],x:.5,y:y+1});m.decos.push({k:kinds[(y+1)%kinds.length],x:W-.5,y:y+1})}}
  // 通れない外周のうち出入口以外を壁にする
  for(let y=1;y<H-1;y++){if(y!==8&&y!==9)m.g[y][W-1]=st.wall}
  // 家具: セーブ端末
  const term=thingObj(m,{id:'term',x:13,y:6,spr:'save',run:async()=>cTerminal()});
  // 住人
  (ch.npcs||[]).forEach((nd,i)=>{
    const s=SLOTS[(nd.slot!==undefined?nd.slot:i)%SLOTS.length];
    const VARI={villm:['villm','v3','v5','guard'],villf:['villf','v2','v4','mother']};
    let spr0=nd.spr||'villm';
    const nm=nd.name||'';
    if(/商|ボルゴ|グレイブ|行商/.test(nm))spr0='merchant';
    else if(/ベイン|レオ|アルフ|研究|技術|作業員|エンジニア|ホルム|教授|博士|技師/.test(nm))spr0='engineer';
    else if(/提督|将校|軍人|司令|大佐|少佐|中佐|大尉/.test(nm))spr0='officer';
    else if(spr0==='guard'||/兵|隊長|艦長|役人|見張り|警備|番人/.test(nm))spr0='imp';
    const sprV=VARI[spr0]?VARI[spr0][(i+n)%4]:spr0;
    npc(m,{id:'n'+i,x:nd.x!==undefined?nd.x:s[0],y:nd.y!==undefined?nd.y:s[1],spr:sprV,dir:nd.dir||'down',run:async()=>cTalk(n,i)});
  });
  m.warps.push({x:W-1,y:8,to:'C'+n+'D',tx:2,ty:0,dir:'right',cond:()=>!!F.cs.gate,msg:'まだ やるべきことがある。'});
  m.warps.push({x:W-1,y:9,to:'C'+n+'D',tx:2,ty:0,dir:'right',cond:()=>!!F.cs.gate,msg:'まだ やるべきことがある。'});
  return m;
}
function genDungeon(n,ch){
  const d=ch.dungeon||{},sz={S:[34,22],M:[42,26],L:[50,30]}[d.size||'M'],W=sz[0],H=sz[1];
  const st=STYLES[ch.dstyle||ch.style]||STYLES.cave,rng=rngSeed(n*17+3);
  const floor=(ch.dfloor)||st.ground,wall=(ch.dwall)||st.wall;
  const rooms=[];
  const m=mkMap('C'+n+'D',W,H,wall,(CHBGM[n]||[])[1]||ch.dbgm||'night',(m,g)=>{
    m.ground=floor;m.indoor=st.indoor&&wall!=='Y';m.chapter=n;
    let tries=0;
    while(rooms.length<8&&tries++<200){
      const w=5+Math.floor(rng()*4),h=4+Math.floor(rng()*3),x=2+Math.floor(rng()*(W-w-4)),y=2+Math.floor(rng()*(H-h-4));
      if(rooms.some(r=>x<r.x+r.w+2&&x+w+2>r.x&&y<r.y+r.h+2&&y+h+2>r.y))continue;
      rooms.push({x,y,w,h});
    }
    rooms.sort((a,b)=>a.x-b.x);
    rooms.forEach(r=>R(g,r.x,r.y,r.w,r.h,floor));
    for(let i=1;i<rooms.length;i++){
      const a=rooms[i-1],b=rooms[i],ax=a.x+(a.w>>1),ay=a.y+(a.h>>1),bx=b.x+(b.w>>1),by=b.y+(b.h>>1);
      R(g,Math.min(ax,bx),ay,Math.abs(bx-ax)+1,1,floor);R(g,bx,Math.min(ay,by),1,Math.abs(by-ay)+1,floor);
    }
  });
  if(wall==='Y'&&st.kinds.length)decosFor(m,st.kinds.length?st.kinds:[]);
  const r0=rooms[0],rl=rooms[rooms.length-1];
  // 入口(街へ戻る)
  const sx=r0.x+1,sy=r0.y+(r0.h>>1);
  m.spawn=[sx,sy];
  MAPS['C'+n+'T'].warps.filter(w=>w.to==='C'+n+'D').forEach(w=>{w.tx=sx;w.ty=sy;w.dir='right'});
  m.warps.push({x:r0.x,y:sy,to:'C'+n+'T',tx:MAPS['C'+n+'T'].gate[0]-1,ty:8,dir:'left'});
  m.g[sy][r0.x]=floor;
  thingObj(m,{id:'dsave',x:r0.x+r0.w-2,y:r0.y+1,spr:'save',run:async()=>cTerminal()});
  // 敵
  const names=(d.enemies&&d.enemies.length?d.enemies:['rat']);const cnt=d.count||8;
  const spots=[];rooms.slice(1,-1).forEach(r=>{for(let i=0;i<2;i++)spots.push([r.x+1+Math.floor(rng()*(r.w-2)),r.y+1+Math.floor(rng()*(r.h-2))])});
  spots.slice(0,cnt).forEach((p,i)=>{
    const k=names[Math.floor(rng()*names.length)],k2=names[Math.floor(rng()*names.length)];
    const list=rng()<.5?[k]:[k,k2];
    m.objs.push({id:'e'+i,type:'enemy',kind:k,x:p[0],y:p[1],hx:p[0],hy:p[1],cd:0,spec:{enemies:list,bg:ch.bg||'bg_wasteland'}});
  });
  // 宝箱
  (d.chests||[]).forEach((c,i)=>{
    const r=rooms[1+((i*2+1)%Math.max(1,rooms.length-2))]||rooms[1];
    // 通路を塞がない場所を選ぶ。敵・端末・入口・イベント地点との重複も避ける。
    const midRoom=rooms[Math.floor(rooms.length/2)];
    const reserved=[[sx,sy],[r0.x,sy],[rl.x+(rl.w>>1)+1,rl.y+(rl.h>>1)],[midRoom.x+(midRoom.w>>1),midRoom.y+(midRoom.h>>1)]];
    const reachable=(block)=>{
      const seen=new Set(),q=[[sx,sy]];
      for(let j=0;j<q.length;j++){
        const [x,y]=q[j],key=x+','+y;
        if(seen.has(key)||(block&&x===block[0]&&y===block[1])||solidAt(m,x,y))continue;
        seen.add(key);for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]])q.push([x+dx,y+dy]);
      }
      return seen;
    };
    const before=reachable(null),candidates=[[r.x+r.w-2,r.y+r.h-1]];
    for(let y=r.y;y<r.y+r.h;y++)for(let x=r.x;x<r.x+r.w;x++)candidates.push([x,y]);
    const pos=candidates.find(([x,y])=>before.has(x+','+y)&&!objAt(m,x,y)&&!reserved.some(p=>p[0]===x&&p[1]===y)&&reachable([x,y]).size===before.size-1);
    const [cx,cy]=pos||candidates[0];
    const chest=thingObj(m,{id:'chest'+i,x:cx,y:cy,spr:'chest',vis:()=>!F.cs['chest'+i],run:async()=>{
      F.cs['chest'+i]=true;se('lvup');
      if(typeof c==='number'){F.credits+=c;await say('',['宝箱だ! '+c+'クレジット を 見つけた。'])}
      else{F.bag[c]=(F.bag[c]||0)+1;await say('',['宝箱だ! '+(ITEMS[c]?ITEMS[c].n:c)+' を 手に入れた。'])}
    }});
    if(!pos)chest.solid=false;
  });
  // 中間イベント
  if(d.mid&&d.mid.length){
    const rm=rooms[Math.floor(rooms.length/2)];
    m.trig.push({x:rm.x+(rm.w>>1),y:rm.y+(rm.h>>1),cond:()=>!F.cs.mid,run:async()=>{F.cs.mid=true;await runScene(d.mid)}});
  }
  // ボス
  const bd=d.boss||{};
  m.objs.push({id:'bossobj',type:'enemy',kind:bd.key||'boss',x:rl.x+(rl.w>>1)+1,y:rl.y+(rl.h>>1),hx:0,hy:0,cd:0,boss:true,still:true,vis:()=>!F.cs.bossDone,
    spec:{enemies:[bd.key||'boss'].concat(bd.minions||[]),bg:bd.bg||ch.bg||'bg_wasteland',boss:true,msg:bd.msg}});
  m.bossRoom=rl;
  return m;
}
/* ---------- 場面(台本)の再生 ---------- */
function sceneCond(c){
  c=String(c||'');
  if(c[0]==='!')return !sceneCond(c.slice(1));
  const m=c.match(/^([^=<>]+)=(\d+)$/);
  if(m)return (F.flags[m[1]]||0)===+m[2];
  return !!F.flags[c];
}
async function runScene(steps){
  for(const s of (steps||[])){
    if(typeof s==='string'){await say('',[s]);continue}
    const op=s[0];
    if(op==='say')await say(s[1],[s.slice(2).join('▼')]);
    else if(op==='ask'){
      // ["ask",名前,問い,[選択肢...],[選択肢ごとの場面(省略可)],"記録名(省略可)",正解の番号(省略可)]
      // 正解の番号を付けると、ほかを選んだときは場面を見せてから、もう一度たずねる。
      const chs=s[3]||['はい'];
      let idx;
      do{
        idx=await ask(s[1],[s[2]||'どうする?'],chs);
        if(s[5])F.flags['c_'+s[5]]=idx+1;
        const br=s[4]&&s[4][idx];if(br&&br.length)await runScene(br);
      }while(s[6]!==undefined&&s[6]!==null&&idx!==s[6]);
    }
    else if(op==='if'){
      // ["if","条件",[真の場面],[偽の場面(省略可)]] 条件: 名前 / !名前 / 名前=番号(選択肢は1から数える。c_記録名)
      await runScene(sceneCond(s[1])?s[2]:s[3]);
    }
    else if(op==='bgm')bgm(s[1]);
    else if(op==='fade'){if(s[1]==='in')await fadeTo(0,s[2]||null,.05);else await fadeTo(1,s[2]||'#000',.05)}
    else if(op==='pic'){await showPic(s[1])}
    else if(op==='join')await joinMember(s[1]);
    else if(op==='leave'){F.party=F.party.filter(p=>p.id!==s[1]);toast((CHAR_DEFS[s[1]]?CHAR_DEFS[s[1]].n:s[1])+'が 隊を離れた')}
    else if(op==='give'){F.bag[s[1]]=(F.bag[s[1]]||0)+(s[2]||1);se('lvup');await say('',[(ITEMS[s[1]]?ITEMS[s[1]].n:s[1])+(s[2]>1?' ×'+s[2]:'')+' を 手に入れた。'])}
    else if(op==='credits'){F.credits+=s[1];toast('クレジット +'+s[1])}
    else if(op==='flag')F.flags[s[1]]=(s.length>2?s[2]:true);
    else if(op==='title')await titleCard(s[1],s[2]);
    else if(op==='wait')await sleep(s[1]||30);
    else if(op==='toast')toast(s[1]);
    else if(op==='heal'){F.party.forEach(p=>{p.hp=p.mhp;p.en=p.men});F.fatigue=0;se('heal')}
    else if(op==='se')se(s[1]);
  }
}
async function joinMember(id){
  if(F.party.some(p=>p.id===id))return;
  const ch=CHAPTERS[F.ch]||{lv:5};const u=mkMember(id,ch.lv);F.party.push(u);se('lvup');
  await say('',[CHAR_DEFS[id].n+'が 仲間に 加わった!']);
}
async function showPic(key){
  const im=IMGS[key];if(!im)return;
  G.overlay=()=>{rect(0,0,W,H,'#000');ctx.drawImage(im,0,40,256,144)};
  await fadeTo(0,null,.1);await sleep(30);
  let n=0;while(!isOk()||n<60){await nextFrame();n++}
  G.overlay=null;
}
async function titleCard(a,b){
  await fadeTo(1,'#000',.06);
  G.overlay=()=>{rect(0,0,W,H,'#05061a');const s1=a||'',s2=b||'';txt(s1,(W-tw(s1))/2,88,'#ffe08a');if(s2)txt(s2,(W-tw(s2))/2,112,'#9cf')};
  await sleep(110);G.overlay=null;await fadeTo(0,null,.06);
}
/* ---------- 章の開始・街・ダンジョン・ボス ---------- */
async function beginChapter(n){
  const ch=CHAPTERS[n];if(!ch){return}
  G.busy=true;
  F.ch=n;F.stage=100;F.cs={gate:false,talked:{},mid:false,bossDone:false,dead:[]};
  F.flags.netsuper=true;
  // パーティの整備: 章レベルまで引き上げ、全回復
  (ch.party||[]).forEach(id=>{if(!F.party.some(p=>p.id===id))F.party.push(mkMember(id,ch.lv))});
  F.party.forEach(p=>{if(p.lv<ch.lv){setLevel(p,ch.lv);p.exp=0}p.hp=p.mhp;p.en=p.men});
  resetStock();F.fatigue=Math.max(0,F.fatigue-20);
  buildChapterMaps(n);
  await fadeTo(1,'#000',.05);
  G.mode='field';G.night=0;G.dusk=0;
  await titleCard('第'+n+'章  '+ch.title,(ch.year||'')+(ch.sub?'  '+ch.sub:''));
  const T=MAPS['C'+n+'T'];
  await setMap(T.id,T.spawn[0],T.spawn[1],'down',true);
  bgm((CHBGM[n]||[])[0]||ch.bgm||'village');
  await fadeTo(0,null,.05);
  G.busy=true;
  await runScene(ch.intro);
  G.hint=ch.goal||'';
  G.busy=false;
  saveGame();
}
function buildChapterMaps(n){
  const ch=CHAPTERS[n];
  genTown(n,ch);genDungeon(n,ch);
}
async function cTerminal(){
  const c=await ask('',['公衆端末だ。'],['セーブ','有給を取る(全回復)','ネットスーパー','やめる']);
  if(c===0)await saveDialog();
  else if(c===1)await takePTO();
  else if(c===2)await shopMenu();
}
async function cTalk(n,i){
  const ch=CHAPTERS[n],nd=ch.npcs[i];
  const t=F.cs.talked;
  const after=F.cs.gate&&nd.after;
  const lines=after?nd.after:(nd.lines||['……']);
  const nm=nd.name||'';
  for(const ln of lines){
    if(Array.isArray(ln))await runScene([ln]);else await say(nm,[ln]);
  }
  if(nd.key&&!t[i]){
    t[i]=true;
    const keys=ch.npcs.map((x,k)=>x.key?k:-1).filter(k=>k>=0);
    if(keys.every(k=>t[k])&&!F.cs.gate){
      F.cs.gate=true;await runScene((ch.gate&&ch.gate.scene)||[]);toast('街の東から 先へ進める。');G.hint=(ch.dungeon&&ch.dungeon.goal)||G.hint;
    }
  }
}
const _encounter=encounter;
encounter=async function(o){
  if(F.ch<2||!CHAPTERS[F.ch])return _encounter(o);
  const ch=CHAPTERS[F.ch],bd=(ch.dungeon&&ch.dungeon.boss)||{};
  if(o.boss&&bd.intro)await runScene(bd.intro);
  const r=await battle(o.spec);
  if(r==='win'||r==='bossflee'){
    o.dead=true;F.cs.dead.push(o.id);
    if(o.boss){F.cs.bossDone=true;await finishChapter()}
  }else if(r==='flee'){o.cd=120}else if(r==='lose'){o.cd=120}
  if(G.mode==='field'&&CHAPTERS[F.ch]){
    const track=G.mapId==='C'+F.ch+'D'?1:0;
    bgm((CHBGM[F.ch]||[])[track]||CHAPTERS[F.ch].bgm||'village');
  }
};
async function finishChapter(){
  const n=F.ch,ch=CHAPTERS[n],bd=(ch.dungeon&&ch.dungeon.boss)||{};
  G.busy=true;
  await runScene(bd.outro);
  await runScene(ch.outro);
  F.credits+=ch.reward||0;
  F.party.forEach(p=>{p.hp=p.mhp;p.en=p.men});
  if(CHAPTERS[n+1]){
    await titleCard('第'+n+'章  完','つづく');
    await beginChapter(n+1);
  }else{
    await endingCredits();
  }
}
async function endingCredits(){
  await fadeTo(1,'#000',.04);bgm('end');
  const L=['ああ、青い星地球へ','','脚本・設計・制作','AIと一緒に','','原作 ああ、青い星地球へ(全300話)','','そして、今日も働きたくない。','','おわり'];
  let t=0;G.mode='end2';
  G.overlay=()=>{rect(0,0,W,H,'#05061a');for(let i=0;i<40;i++){rect(hash(i,3)*W,hash(i,4)*H,1,1,((frame/20+i)%6)<3?'#fff':'#889')}
    L.forEach((s,i)=>{const y=H-t/1.2+i*18;if(y>-12&&y<H)txt(s,(W-tw(s))/2,y,i===0?'#ffe08a':'#cfd8ff')})};
  await fadeTo(0,null,.04);
  while(t<L.length*18*1.2+H*1.2+120){await nextFrame();t++}
  await sleep(60);
  G.overlay=null;G.mode='field';
  await fadeTo(1,'#000',.04);
  await titleLoop();
}
/* ---------- 表示の追加(目標の表示) ---------- */
const _drawField=drawField;
drawField=function(){
  _drawField();
  const officeHint=F&&G.mapId==='OFFICE'?['左奥の 自席の端末を調べよう','中央奥の 書類を片付けよう','佐伯に 話しかけよう','左手前の 自席に戻ろう'][Math.min(F.pro,3)]:'';
  const hint=officeHint||(F&&F.ch>=2?G.hint:'');
  if(hint&&!D&&!UI&&!G.toast&&G.mode==='field'){rect(0,208,W,16,'rgba(0,0,20,.75)');let h=hint;while(tw(h)>W-12&&h.length>4)h=h.slice(0,-2);if(h!==hint)h+='…';txt(h,6,210,'#cfe',false);}
};
/* ---------- セーブ/ロード(章の状態を含める) ---------- */
const _loadGame=loadGame;
loadGame=function(){
  const ok=_loadGame();
  if(ok&&F&&F.ch>=2&&CHAPTERS[F.ch]){
    buildChapterMaps(F.ch);
    const s=JSON.parse(localStorage.getItem('aoihoshi_save1'));
    G.mapId=s.map;
    for(const id of (F.cs.dead||[])){for(const k of ['C'+F.ch+'D']){const o=MAPS[k].objs.find(o=>o.id===id);if(o)o.dead=true}}
    bgm(CHAPTERS[F.ch].bgm||'village');
    G.hint=F.cs.gate?((CHAPTERS[F.ch].dungeon&&CHAPTERS[F.ch].dungeon.goal)||CHAPTERS[F.ch].goal||''):(CHAPTERS[F.ch].goal||'');
  }
  return ok;
};
const _applyTime=applyTime;
applyTime=function(){if(F&&F.ch>=2){G.night=0;G.dusk=0;return}return _applyTime()};
const _setMapBgm=null;
/* ---------- 第1章の終わり → 第2章へ ---------- */
const _chapterEnd=chapterEnd;
chapterEnd=async function(){
  if(CHAPTERS[2]){
    await fadeTo(1,'#000',.03);G.mode='end';G.night=0;bgm('end');await fadeTo(0,null,.03);G.busy=true;G.endT=0;
    while(!isOk()||G.endT<120){await nextFrame();G.endT++}
    await sleep(2);await fadeTo(1,'#000',.04);G.mode='field';
    await beginChapter(2);return;
  }
  return _chapterEnd();
};

/* ---------- メニュー(ならびかえ・目標の確認) ---------- */
fieldMenu=async function(){
  if(G.busy)return;
  G.busy=true;
  try{
    while(true){
      const many=F.party.length>4;
      const items=[{label:'アイテム'},{label:'ステータス'},{label:'ネットスーパー',disabled:!F.flags.netsuper},{label:'ならびかえ',disabled:!many},{label:'めあて'},{label:'セーブ'},{label:'とじる'}];
      const c=await pickMenu(items,{x:8,y:8,w:120,cancel:true,rows:7});
      if(c<0||c===6)break;
      if(c===0)await menuItems();
      if(c===1)await menuStatus();
      if(c===2)await shopMenu();
      if(c===3)await menuOrder();
      if(c===4){
        const lines=[G.hint||(F.ch>=2?(CHAPTERS[F.ch]||{}).goal:'')||'めあては とくにない。'];
        const ch=CHAPTERS[F.ch];
        if(ch&&F.cs&&!F.cs.gate){
          const remaining=ch.npcs.filter((npc,i)=>npc.key&&!F.cs.talked[i]).map(npc=>npc.name||'住人');
          if(remaining.length)lines.push('まだ話していない人: '+remaining.join('、'));
        }else if(ch&&F.cs&&F.cs.gate&&G.mapId==='C'+F.ch+'T')lines.push('街の東から 先へ進もう。');
        await say('',lines);
      }
      if(c===5)await saveDialog();
    }
  }finally{G.busy=false}
};
async function menuOrder(){
  while(true){
    const items=F.party.map((p,i)=>({label:(i<4?'◆ ':'  ')+p.name,right:'Lv'+p.lv}));
    const a=await pickMenu(items,{x:8,y:30,w:160,title:'入れ替える仲間(◆=戦う4人)',cancel:true,rows:7});
    if(a<0)return;
    const b=await pickMenu(items,{x:60,y:60,w:160,title:'だれと?',cancel:true,rows:7});
    if(b<0||a===b)continue;
    if(F.party[a].id==='takaya'||F.party[b].id==='takaya'){if((a<4)!==(b<4)){await say('',['隆也は 外せない。']);continue}}
    const t=F.party[a];F.party[a]=F.party[b];F.party[b]=t;se('ok');
  }
}

/* ---------- スマホ・タブレット(iPhone / iPad / Android)用の仮想パッド ---------- */
// 左=十字(なぞって方向を変えられる)、右=決定/戻る/メニュー。画面をタップでも決定。
// 縦持ち: 画面の下にパッド。横持ち: 画面の両端に半透明で重ねる。
(function(){
  const touch=('ontouchstart' in window)||(navigator.maxTouchPoints>0)||matchMedia('(pointer:coarse)').matches;
  if(!touch)return;
  const css=document.createElement('style');
  css.textContent='html,body{overscroll-behavior:none;-webkit-touch-callout:none;-webkit-user-select:none;user-select:none;-webkit-tap-highlight-color:transparent;touch-action:none;position:fixed;width:100%}'
    +'#pad{position:fixed;left:0;right:0;bottom:0;height:var(--padh,170px);display:flex;justify-content:space-between;align-items:center;padding:0 calc(14px + env(safe-area-inset-right)) env(safe-area-inset-bottom) calc(14px + env(safe-area-inset-left));box-sizing:border-box;pointer-events:none;touch-action:none;z-index:5}'
    +'#pad .g{position:relative;width:140px;height:140px;pointer-events:auto;touch-action:none;border-radius:50%;background:rgba(20,40,110,.35);border:2px solid rgba(90,120,208,.7)}'
    +'#pad .g i{position:absolute;width:40px;height:40px;line-height:40px;text-align:center;color:#e8eeff;font:700 20px sans-serif;font-style:normal;pointer-events:none;border-radius:10px}'
    +'#pad .g i.on{background:rgba(120,160,255,.55)}'
    +'#pad .r{position:relative;width:150px;height:140px;pointer-events:auto;touch-action:none}'
    +'#pad .r button{position:absolute;width:62px;height:62px;border-radius:50%;border:2px solid #5a78d0;background:rgba(20,40,110,.6);color:#e8eeff;font:700 15px sans-serif;pointer-events:auto;touch-action:none;padding:0}'
    +'#pad .r button.on{background:rgba(120,160,255,.65)}'
    +'body.land #pad{height:100%;align-items:flex-end;padding-bottom:calc(12px + env(safe-area-inset-bottom));opacity:.8}'
    +'body.land #pad .g,body.land #pad .r{margin-bottom:0}';
  document.head.appendChild(css);
  // iOSのSafari向け: ズーム禁止・ホーム画面に追加すると全画面
  const vp=document.querySelector('meta[name=viewport]');
  if(vp)vp.content='width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no,viewport-fit=cover';
  [['apple-mobile-web-app-capable','yes'],['mobile-web-app-capable','yes'],['apple-mobile-web-app-status-bar-style','black-translucent']].forEach(([n,c])=>{const m=document.createElement('meta');m.name=n;m.content=c;document.head.appendChild(m)});
  const pad=document.createElement('div');pad.id='pad';
  pad.innerHTML='<div class="g"><i data-d="ArrowUp" style="left:50px;top:6px">▲</i><i data-d="ArrowLeft" style="left:6px;top:50px">◀</i><i data-d="ArrowRight" style="left:94px;top:50px">▶</i><i data-d="ArrowDown" style="left:50px;top:94px">▼</i></div>'
    +'<div class="r"><button data-k="Enter" style="left:0;top:0;font-size:12px">メニュー</button><button data-k="x" style="left:88px;top:20px">戻る</button><button data-k="z" style="left:40px;top:72px">決定</button></div>';
  document.body.appendChild(pad);
  const held=new Set();
  const fire=(k,t)=>dispatchEvent(new KeyboardEvent(t,{key:k}));
  const setKey=(k,on)=>{if(on&&!held.has(k)){held.add(k);fire(k,'keydown')}else if(!on&&held.has(k)){held.delete(k);fire(k,'keyup')}};
  // 十字: 指の位置から方向を決める(なぞって切り替え可)
  const g=pad.querySelector('.g'),marks=[...g.querySelectorAll('i')];
  let gid=null;
  const dirOf=t=>{
    const r=g.getBoundingClientRect(),dx=t.clientX-(r.left+r.width/2),dy=t.clientY-(r.top+r.height/2);
    if(Math.hypot(dx,dy)<r.width*0.14)return null;
    return Math.abs(dx)>=Math.abs(dy)?(dx<0?'ArrowLeft':'ArrowRight'):(dy<0?'ArrowUp':'ArrowDown');
  };
  const setDir=d=>{['ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].forEach(k=>setKey(k,k===d));marks.forEach(m=>m.classList.toggle('on',m.dataset.d===d))};
  const touchOf=(e,id)=>[...e.touches].find(t=>t.identifier===id);
  g.addEventListener('touchstart',e=>{e.preventDefault();if(gid===null){const t=e.changedTouches[0];gid=t.identifier;setDir(dirOf(t))}},{passive:false});
  g.addEventListener('touchmove',e=>{e.preventDefault();const t=touchOf(e,gid);if(t)setDir(dirOf(t))},{passive:false});
  const gend=e=>{e.preventDefault();if([...e.changedTouches].some(t=>t.identifier===gid)){gid=null;setDir(null)}};
  g.addEventListener('touchend',gend,{passive:false});g.addEventListener('touchcancel',gend,{passive:false});
  // マウスでも試せるように
  let md=false;
  g.addEventListener('mousedown',e=>{md=true;setDir(dirOf(e))});addEventListener('mousemove',e=>{if(md)setDir(dirOf(e))});addEventListener('mouseup',()=>{if(md){md=false;setDir(null)}});
  // ボタン
  pad.querySelectorAll('.r button').forEach(b=>{
    const k=b.dataset.k;
    const on=e=>{e.preventDefault();setKey(k,true);b.classList.add('on')};
    const off=e=>{e.preventDefault();setKey(k,false);b.classList.remove('on')};
    b.addEventListener('touchstart',on,{passive:false});b.addEventListener('touchend',off,{passive:false});b.addEventListener('touchcancel',off,{passive:false});
    b.addEventListener('mousedown',on);b.addEventListener('mouseup',off);b.addEventListener('mouseleave',off);
  });
  // 画面(ゲーム部分)をタップ=決定
  cv.addEventListener('touchstart',e=>{e.preventDefault();setKey('z',true);setTimeout(()=>setKey('z',false),90)},{passive:false});
  // 画面サイズに合わせる(整数倍にこだわらず、できるだけ大きく)
  fit=function(){
    const land=innerWidth>innerHeight*1.15;
    document.body.classList.toggle('land',land);
    const padH=land?0:Math.min(190,Math.round(innerHeight*0.27));
    document.documentElement.style.setProperty('--padh',(land?innerHeight:padH)+'px');
    const s=Math.min(innerWidth/W,(innerHeight-padH)/H);
    cv.style.width=Math.floor(W*s)+'px';cv.style.height=Math.floor(H*s)+'px';
    cv.style.marginBottom=padH+'px';
    if(land)cv.style.marginBottom='0px';
  };
  fit();addEventListener('resize',fit);addEventListener('orientationchange',()=>setTimeout(fit,200));
  document.addEventListener('touchmove',e=>e.preventDefault(),{passive:false});
  document.addEventListener('gesturestart',e=>e.preventDefault());
  // iOSは「指を離したとき」の操作でないと音が出ない
  const wake=()=>{try{audioInit();if(AC&&AC.state!=='running')AC.resume()}catch(_){}try{SND.resume()}catch(_){}};
  addEventListener('touchend',wake,{passive:true});addEventListener('click',wake);
})();

/* ---------- セーブ枠(オート+3ファイル) ---------- */
const SLOTKEY=n=>n===0?'aoihoshi_auto':(n===1?'aoihoshi_save1':'aoihoshi_save'+n);
function slotInfo(n){try{const s=JSON.parse(localStorage.getItem(SLOTKEY(n)));if(!s)return null;const f=s.F;return{ch:f.ch||1,lv:f.party[0].lv,min:Math.round((f.time||0)/60)}}catch(e){return null}}
function slotLabel(n){const i=slotInfo(n);return i?'第'+i.ch+'章 Lv'+i.lv+' '+i.min+'分':'(からっぽ)'}
hasSave=function(){return [0,1,2,3].some(n=>!!slotInfo(n))};
saveGame=function(n){
  if(n===undefined)n=0;
  try{localStorage.setItem(SLOTKEY(n),JSON.stringify({F,map:G.mapId,x:G.P.x,y:G.P.y,dir:G.P.dir,v:2}));return true}catch(e){return false}
};
async function saveDialog(){
  const items=[1,2,3].map(n=>({label:'ファイル'+n,right:slotLabel(n)}));
  const c=await pickMenu(items,{x:16,y:60,w:224,title:'どこに セーブする?',cancel:true});
  if(c<0)return;
  const ok=saveGame(c+1);se(ok?'ok':'no');
  await say('',[ok?'ファイル'+(c+1)+'に セーブした。':'セーブできなかった。']);
}
loadGame=function(n){
  try{
    const s=JSON.parse(localStorage.getItem(SLOTKEY(n===undefined?0:n)));if(!s)return false;
    F=s.F;G.mode='field';resetMapsState();
    G.mapId=s.map;const P=G.P;P.x=s.x;P.y=s.y;P.px=s.x*TS;P.py=s.y*TS;P.dir=s.dir;P.moving=0;
    if(F.ch>=2&&CHAPTERS[F.ch]){
      buildChapterMaps(F.ch);G.mapId=s.map;
      for(const id of (F.cs.dead||[])){const o=MAPS['C'+F.ch+'D'].objs.find(o=>o.id===id);if(o)o.dead=true}
      G.hint=F.cs.gate?((CHAPTERS[F.ch].dungeon&&CHAPTERS[F.ch].dungeon.goal)||CHAPTERS[F.ch].goal||''):(CHAPTERS[F.ch].goal||'');
      bgm((CHBGM[F.ch]||[])[G.mapId==='C'+F.ch+'D'?1:0]||'village');
    }else{applyDead();applyTime()}
    G.busy=false;return true;
  }catch(e){console.error(e);return false}
};
async function loadDialog(){
  const keys=[0,1,2,3];
  const items=keys.map(n=>({label:n===0?'オートセーブ':'ファイル'+n,right:slotLabel(n),disabled:!slotInfo(n)}));
  const c=await pickMenu(items,{x:16,y:60,w:224,title:'どれを ひらく?',cancel:true});
  if(c<0)return false;
  return loadGame(keys[c]);
}
titleLoop=async function(){
  G.mode='title';bgm('title');
  while(true){
    const items=[{label:'はじめから'},{label:'つづきから',disabled:!hasSave()},{label:'操作説明'}];
    const c=await pickMenu(items,{x:84,y:154,w:88,cancel:false});
    if(c===0){newRun();return}
    if(c===1){if(await loadDialog())return}
    if(c===2){await say('',['矢印キー: 移動','Z / Space / Enter: 決定・調べる','X / Esc: 戻る','Enter: メニュー(アイテム・セーブ)','M: 音の ON/OFF','スマホ: 画面下のボタン']);}
  }
};

/* ---------- アイテムのアイコン(コードで描いたドット絵。名前と絵を合わせる) ---------- */
(function(){
  const mk=(draw)=>{const c=document.createElement('canvas');c.width=16;c.height=16;const g=c.getContext('2d');g.imageSmoothingEnabled=false;
    const R=(x,y,w,h,col)=>{g.fillStyle=col;g.fillRect(x,y,w,h)};draw(R);return c};
  const O='#1a1a2a';
  const vial=(R,body,hi,cap)=>{R(6,1,4,2,cap);R(5,3,6,1,O);R(4,4,8,10,O);R(5,4,6,9,body);R(6,5,2,6,hi);R(5,13,6,1,'rgba(0,0,0,.25)')};
  IMGS.ic_water=mk(R=>{R(6,1,4,2,'#cfd8e8');R(5,3,6,1,O);R(4,4,8,11,O);R(5,4,6,10,'#7ac0f0');R(5,4,6,3,'#bfe4ff');R(6,5,1,6,'#fff');R(5,13,6,1,'#4a90d0')});
  IMGS.ic_onigiri=mk(R=>{R(7,2,2,1,O);R(6,3,4,1,O);R(5,4,6,1,O);R(4,5,8,1,O);R(3,6,10,6,O);R(4,12,8,1,O);
    R(7,3,2,1,'#f4f4ec');R(6,4,4,1,'#f4f4ec');R(5,5,6,1,'#f4f4ec');R(4,6,8,6,'#f4f4ec');R(6,9,4,4,'#22302a');R(7,10,2,2,'#2f4a3a');R(5,7,1,1,'#c8c8c0');R(9,6,1,1,'#c8c8c0')});
  IMGS.ic_cup=mk(R=>{R(3,5,10,1,O);R(2,4,12,2,'#e8e8f0');R(3,6,10,1,O);R(4,6,8,8,O);R(4,7,8,6,'#e04a3a');R(5,7,6,2,'#f06a58');R(4,10,8,1,'#f4d040');R(6,2,1,2,'rgba(255,255,255,.8)');R(9,1,1,3,'rgba(255,255,255,.8)')});
  IMGS.ic_drink=mk(R=>{R(6,1,4,2,'#d8a020');R(5,3,6,1,O);R(4,4,8,10,O);R(5,4,6,9,'#8a4a1a');R(5,7,6,4,'#f4d050');R(7,8,2,2,'#c82a2a');R(5,4,1,3,'#b8743a')});
  IMGS.ic_meat=mk(R=>{R(2,2,3,3,'#f4f0e0');R(1,3,1,2,'#f4f0e0');R(3,4,2,2,'#f4f0e0');R(4,5,2,2,O);R(5,5,9,8,O);R(6,6,7,6,'#b8502a');R(7,7,5,3,'#d87040');R(9,8,2,2,'#f0a070');R(6,10,7,2,'#8a3a1a')});
  IMGS.ic_bento=mk(R=>{R(1,5,14,1,O);R(1,4,14,2,'#a0603a');R(1,6,14,8,O);R(2,7,12,6,'#e8c070');R(2,7,6,6,'#f4f4ec');R(3,8,4,2,'#2a6a3a');R(9,8,4,2,'#d84a3a');R(9,11,4,2,'#f4a030');R(8,7,1,6,O)});
  IMGS.ic_revive=mk(R=>{vial(R,'#4ac070','#bff0cf','#e8e8f0');R(7,6,2,6,'#fff');R(5,8,6,2,'#fff')});
  IMGS.ic_nano=mk(R=>{R(2,5,12,6,O);R(3,6,10,4,'#f4f4f8');R(8,6,5,4,'#7aa8ff');R(3,6,1,4,'#fff');R(6,7,2,2,'#f08080');R(2,11,12,1,'rgba(0,0,0,.2)')});
  IMGS.ic_boost=mk(R=>{vial(R,'#e8c020','#fff2a0','#8a8a98');R(8,6,2,3,O);R(6,8,4,2,O);R(6,10,2,3,O)});
  IMGS.ic_revive2=mk(R=>{vial(R,'#f0c040','#fff0b0','#d8a020');R(7,6,2,6,'#fff');R(5,8,6,2,'#fff');R(2,2,1,1,'#fff');R(13,3,1,1,'#fff');R(12,12,1,1,'#fff')});
  IMGS.ic_nano2=mk(R=>{R(2,5,12,6,O);R(3,6,10,4,'#e8f0ff');R(3,6,6,4,'#4a78e0');R(10,7,2,2,'#fff');R(2,11,12,1,'rgba(0,0,0,.2)');R(7,3,2,2,'#8ab0ff')});
  IMGS.ic_nano3=mk(R=>{R(5,1,6,1,O);R(3,2,10,1,O);R(2,3,12,10,O);R(3,3,10,9,'#9af0ff');R(4,4,8,7,'#e8fcff');R(6,5,4,5,'#fff');R(7,2,2,1,'#fff');R(2,13,12,1,'rgba(0,0,0,.2)')});
})();

/* ---------- 音楽: 銀河覇権の音の仕組み(SND。40曲)を使う。なければ従来の簡易BGM ---------- */
(function(){
  if(typeof SND==='undefined')return;
  const MAP={title:'title',village:'map',night:'hangar',office:'hangar',cooking:'clear',end:'ending',space:'void_a',empire:'empire_a',ancient:'ancient_a',city:'hangar',earth:'ending',sad:'gameover',wedding:'ending',battle:'*',boss:'**'};
  function fightTrack(boss){
    const n=(F&&F.ch)||1;
    if(n<=4)return boss?'boss_heavy':'bio_fleet';
    if(n<=7)return boss?'boss_heavy':'earth_fleet';
    if(n<=11)return boss?'empire_boss':'empire_fleet';
    if(n<=14)return boss?'ancient_boss':'ancient_fleet';
    if(n===15)return boss?'final_boss':'void_fleet';
    return boss?'last_boss':'void_fleet';
  }
  const _bgm=bgm;
  bgm=function(name){
    if(name==='frontier'){G.snd=null;_bgm(name);return}
    if(bgmTimer){clearInterval(bgmTimer);bgmTimer=null}
    bgmName=name;
    if(!name){G.snd=null;return}
    let t=MAP[name];
    if(t==='*')t=fightTrack(false);else if(t==='**')t=fightTrack(true);
    G.snd=t||null;
  };
  const _update=update;
  update=function(){
    _update();
    try{SND.update({bgm:G.snd,intense:!!B})}catch(e){}
    if(muted!==SND.muted)SND.toggle();
  };
  const wake=()=>{try{SND.resume()}catch(e){}};
  addEventListener('keydown',wake);addEventListener('mousedown',wake);addEventListener('touchstart',wake,{passive:true});addEventListener('touchend',wake,{passive:true});addEventListener('click',wake);
})();

/* ---------- コントローラー(ゲームパッド) ---------- */
// 十字キー/左スティック=移動、A(下のボタン)=決定、B(右のボタン)・Y=戻る、X・Start=メニュー。標準配置のパッド(Xbox/PlayStation/Switch Pro など)に対応。
(function(){
  if(!navigator.getGamepads)return;
  const held=new Set();
  const fire=(k,t)=>dispatchEvent(new KeyboardEvent(t,{key:k}));
  function setKey(k,on){
    if(on&&!held.has(k)){held.add(k);fire(k,'keydown')}
    else if(!on&&held.has(k)){held.delete(k);fire(k,'keyup')}
  }
  function poll(){
    const want=new Set();
    let any=false;
    for(const gp of navigator.getGamepads()){
      if(!gp||!gp.connected)continue;
      any=true;
      const b=i=>!!(gp.buttons[i]&&gp.buttons[i].pressed);
      const ax=gp.axes||[];
      if(b(12)||(ax[1]||0)<-.5)want.add('ArrowUp');
      if(b(13)||(ax[1]||0)>.5)want.add('ArrowDown');
      if(b(14)||(ax[0]||0)<-.5)want.add('ArrowLeft');
      if(b(15)||(ax[0]||0)>.5)want.add('ArrowRight');
      if(b(0))want.add('z');
      if(b(1)||b(3))want.add('x');
      if(b(2)||b(9))want.add('Enter');
    }
    ['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','z','x','Enter'].forEach(k=>setKey(k,want.has(k)));
    requestAnimationFrame(poll);
  }
  addEventListener('gamepadconnected',e=>{try{toast('コントローラー接続: '+(e.gamepad.id||'').slice(0,24))}catch(_){}});
  requestAnimationFrame(poll);
})();
