'use strict';
/* 動作確認用(遊ぶ人は使わない)。ブラウザのコンソールから __dbg を使う。 */
Object.assign(window.__dbg,{
  async begin(n,L){if(!F){F=newGame();resetStock();F.party=[mkTakaya(),mkKyle()];F.flags.sophiaMet=true;F.flags.netsuper=true}
    if(!G.mapId){G.mode='field';await setMap('HOME',4,4,'down',true)}
    await beginChapter(n)},
  gate(){F.cs.gate=true},
  talkAll(){const ch=CHAPTERS[F.ch];ch.npcs.forEach((x,i)=>{if(x.key)F.cs.talked[i]=true});F.cs.gate=true},
  toBoss(){const m=MAPS['C'+F.ch+'D'],o=m.objs.find(o=>o.id==='bossobj');const r=m.bossRoom;G.mapId=m.id;const P=G.P;P.x=o.x-2;P.y=o.y;P.px=P.x*16;P.py=P.y*16;P.dir='right';P.moving=0},
  strong(){F.party.forEach(p=>{p.str+=400;p.wpn+=300;p.def+=100;p.mhp+=3000;p.hp=p.mhp;p.spd+=6})},
  CH:()=>CHAPTERS
});
