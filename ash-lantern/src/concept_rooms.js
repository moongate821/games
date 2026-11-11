'use strict';
// Floor outlines measured against the approved art, rather than its rectangle.
const CONCEPT_ROOMS={C5_TUNNEL:{image:'bg_mine_tunnel_concept'},SHOP_ITEM:{image:'bg_shop_supplies_v2',counter:[480,318,580,143,450]},SHOP_WEAPON:{image:'bg_shop_forge_v2'}};
(function(){
 IMG_LIST.push('bg_shop_supplies_v2.png','bg_shop_forge_v2.png');
 function inside(x,y,p){let yes=false;for(let i=0,j=p.length-1;i<p.length;j=i++){const a=p[i],b=p[j];if((a[1]>y)!==(b[1]>y)&&x<(b[0]-a[0])*(y-a[1])/(b[1]-a[1])+a[0])yes=!yes;}return yes;}
 const mine=MAPS.C5_TUNNEL,outline=[[650,160],[860,160],[1000,260],[1080,450],[1390,620],[1200,710],[1180,850],[1080,970],[1100,1030],[450,1030],[420,780],[250,700],[90,650],[300,570],[400,400],[580,250]];
 mine.tiles=Array.from({length:14},(_,y)=>Array.from({length:22},(_,x)=>inside((x+.5)*1536/22,(y+1)*1024/14,outline)?'o':'x').join(''));
 mine.tiles[13]=mine.tiles[13].slice(0,11)+'d'+mine.tiles[13].slice(12);
 mine.points={start:[11,12],deep:[11,3],trapped:[14,6]};
 LAYOUT.C5_TUNNEL={doorX:11,windows:[],furn:[{x:4,y:3,w:3,h:3,say:'鉱石を詰めた木箱。'},{x:2,y:6,w:2,h:2,say:'鉱石を運ぶトロッコ。'},{x:7,y:4,w:1,h:1,say:'道具をしまう樽。'},{x:16,y:5,w:3,h:2,say:'崩れた坑木と岩が通路をふさいでいる。'}]};
 function room(id,door,furn,keeper){
  const rows=Array.from({length:12},()=>Array(18).fill('x'));
  for(let y=5;y<=9;y++)for(let x=2;x<=16;x++)rows[y][x]='o';
  for(let y=10;y<=11;y++)for(let x=door-1;x<=door+1;x++)rows[y][x]='o';rows[11][door]='d';
  MAPS[id].tiles=rows.map(r=>r.join(''));MAPS[id].points={start:[door,10],keeper};LAYOUT[id]={windows:[],doorX:door,furn};
  for(const z of CHREG.warps){if(z.map===id)z.at=[door,11];if(z.to===id)z.to_at=id+'@start';}
 }
 room('SHOP_ITEM',8,[{x:6,y:4,w:7,h:1,shop:'item'},{x:3,y:5,w:4,h:3,say:'回復薬や旅道具の見本が並ぶ。'},{x:11,y:5,w:3,h:3,say:'地図と羅針盤を並べた陳列台。'},{x:2,y:8,w:2,h:2,say:'仕入れた荷物と樽。'},{x:15,y:8,w:2,h:2,say:'出発を待つ旅の荷物。'}],[8,3]);
 room('SHOP_WEAPON',10,[{x:3,y:4,w:4,h:2,say:'赤々と燃える鍛冶炉。'},{x:4,y:6,w:2,h:1,say:'使い込まれた金床。'},{x:8,y:5,w:1,h:2,say:'熱した鉄を冷やす水桶。'},{x:3,y:7,w:4,h:3,say:'武具の図面と道具を置いた作業台。'},{x:13,y:8,w:4,h:2,say:'鍛造用の鉱石と炭。'},{x:12,y:5,w:4,h:1,shop:'w'}],[6,6]);
})();
