// 艦隊運用モードのルール。三次元チェスの動きはそのまま、駒を銀河覇権の艦隊にして「攻撃」で戦う。
//  ・敵の艦のマスへ動くと「攻撃」。1回の攻撃でバリヤー(防御)が1枚はがれる。防御は3枚。
//  ・3回目の攻撃で撃沈。撃沈した手だけ、攻撃した艦がそのマスへ進む(途中の攻撃では位置は動かない)。
//  ・キングは「旗艦」。防御3枚(FLAG_HP)を3回の攻撃ではがされると撃沈され、その側の負け。
//  ・チェック・チェックメイト・キャスリング・アンパッサンはなし。
import {coord,id,valid,side,opponent,label,vectors,rookDirs,bishopDirs,knightDirs} from './engine.js?v=20261024d';

export const SHIP_HP=3, FLAG_HP=3;
// 駒 → 艦種(銀河覇権の艦種ID)。白=星冠帝国軍(empire)、黒=地球星域防衛軍(republic)
export const SHIP={k:'DN',q:'PL',r:'BB',b:'CV',n:'TB',p:'FR'};
export const SHIP_NAME={k:'旗艦(超弩級艦)',q:'惑星型戦闘艦',r:'戦艦',b:'空母',n:'雷撃艇',p:'護衛艦'};
export const FACTION={w:'empire',b:'republic'};
export const FACTION_NAME={w:'星冠帝国軍',b:'地球星域防衛軍'};
const hpOf=t=>t==='k'?FLAG_HP:SHIP_HP;
const ROMAN={k:'DN',q:'PL',r:'BB',b:'CV',n:'TB',p:'FR'};

export function fleetInitial(){
  const board=Array(192).fill('.'),hp=Array(192).fill(0);
  const put=(x,y,p)=>{const i=id(x,y,1);board[i]=p;hp[i]=hpOf(p.toLowerCase());};
  for(let x=0;x<8;x++){
    put(x,0,'RNBQKBNR'[x]);put(x,1,'P');put(x,6,'p');put(x,7,'rnbqkbnr'[x]);
  }
  return {board,hp,turn:'w',castle:'',ep:-1,halfmove:0,fullmove:1,result:null,repetition:{},fleet:true,last:null,sunk:{w:0,b:0},hits:{w:0,b:0}};
}

function slide(s,from,dirs,who,out){
  const c=coord(from);
  for(const [dx,dy,dz] of dirs){
    let x=c.x+dx,y=c.y+dy,z=c.z+dz;
    while(valid(x,y,z)){
      const to=id(x,y,z),t=s.board[to];
      if(side(t)===who)break;
      out.push({from,to});
      if(t!=='.')break;
      x+=dx;y+=dy;z+=dz;
    }
  }
}
function raw(s,who){
  const out=[];
  for(let from=0;from<192;from++){
    const p=s.board[from];if(side(p)!==who)continue;
    const c=coord(from),type=p.toLowerCase();
    if(type==='r')slide(s,from,rookDirs,who,out);
    else if(type==='b')slide(s,from,bishopDirs,who,out);
    else if(type==='q')slide(s,from,vectors,who,out);
    else if(type==='n'||type==='k'){
      for(const [dx,dy,dz] of type==='n'?knightDirs:vectors){
        const x=c.x+dx,y=c.y+dy,z=c.z+dz;
        if(valid(x,y,z)&&side(s.board[id(x,y,z)])!==who)out.push({from,to:id(x,y,z)});
      }
    }else{
      const d=who==='w'?1:-1,home=who==='w'?1:6;
      if(valid(c.x,c.y+d,c.z)&&s.board[id(c.x,c.y+d,c.z)]==='.'){
        out.push({from,to:id(c.x,c.y+d,c.z)});
        if(c.y===home&&s.board[id(c.x,c.y+2*d,c.z)]==='.')out.push({from,to:id(c.x,c.y+2*d,c.z)});
      }
      for(const dx of [-1,1]){
        if(!valid(c.x+dx,c.y+d,c.z))continue;
        const to=id(c.x+dx,c.y+d,c.z);
        if(side(s.board[to])===opponent(who))out.push({from,to});
      }
    }
  }
  return out;
}
export function fleetMoves(s,who=s.turn){
  const out=[],last=who==='w'?7:0;
  for(const m of raw(s,who)){
    const target=s.board[m.to];
    if(target!=='.'){
      if(s.hp[m.to]>1){out.push({...m,attack:true,hit:true});continue;}   // 防御が残る → 位置は動かない
      m.attack=true;m.sink=true;
    }
    if(s.board[m.from].toLowerCase()==='p'&&coord(m.to).y===last){
      for(const promotion of ['q','r','b','n'])out.push({...m,promotion});
    }else out.push(m);
  }
  return out;
}
export function fleetPlay(s,m){
  const n={...s,board:s.board.slice(),hp:s.hp.slice(),sunk:{...s.sunk},hits:{...s.hits},repetition:{}};
  const p=n.board[m.from],who=side(p),target=n.board[m.to];
  const info={from:m.from,to:m.to,attacker:p,target,who,attack:!!m.attack,hit:!!m.hit,sink:false,hpBefore:target!=='.'?s.hp[m.to]:0,hpAfter:0};
  if(m.attack){
    n.hits[who]++;
    n.hp[m.to]--;info.hpAfter=n.hp[m.to];
    if(n.hp[m.to]<=0){
      info.sink=true;n.sunk[who]++;n.board[m.to]='.';n.hp[m.to]=0;
    }
  }
  if(!m.hit){   // 通常の移動 or 撃沈した手 → 攻撃した艦が進む
    const h=n.hp[m.from];
    n.board[m.from]='.';n.hp[m.from]=0;
    n.board[m.to]=m.promotion?(who==='w'?m.promotion.toUpperCase():m.promotion):p;n.hp[m.to]=h;
  }
  n.halfmove=m.attack||p.toLowerCase()==='p'?0:s.halfmove+1;
  n.fullmove=s.fullmove+(who==='b'?1:0);
  n.turn=opponent(who);n.ep=-1;n.last=info;
  if(info.sink&&target.toLowerCase()==='k')n.result=`${FACTION_NAME[who]}の勝ち（旗艦撃沈）`;
  else if(!fleetMoves(n).length)n.result='引き分け（動ける艦がない）';
  else if(n.halfmove>=150)n.result='引き分け（150手動きなし）';
  return n;
}
export function fleetMoveText(s,m){
  const p=s.board[m.from].toLowerCase();
  const name=SHIP_NAME[p];
  if(!m.attack)return `${name} ${label(m.from)}→${label(m.to)}${m.promotion?` 改装→${SHIP_NAME[m.promotion]}`:''}`;
  const t=s.board[m.to].toLowerCase(),left=s.hp[m.to]-1;
  return `${name} ${label(m.from)}が ${SHIP_NAME[t]} ${label(m.to)}を攻撃 ${left>0?`(防御残り${left})`:'→撃沈'}`;
}
export function flagshipHp(s,who){
  const i=s.board.indexOf(who==='w'?'K':'k');return i<0?0:s.hp[i];
}

// ---- AI(1手読み+相手の最善の返し) ----
const VAL={p:100,n:300,b:330,r:500,q:900,k:2500};
function evalFleet(s){   // 黒が有利なら正
  let score=0;
  for(let i=0;i<192;i++){
    const p=s.board[i];if(p==='.')continue;
    const t=p.toLowerCase(),who=side(p),c=coord(i);
    let worth=VAL[t]*(s.hp[i]/hpOf(t));
    if(t==='k'&&s.hp[i]<hpOf(t))worth-=(hpOf(t)-s.hp[i])*250;   // 旗艦が削られると大きく減点
    const center=(3.5-Math.abs(c.x-3.5))+(3.5-Math.abs(c.y-3.5));
    if(t!=='k')worth+=center*3+(t==='p'?(who==='b'?7-c.y:c.y)*6:0);
    score+=(who==='b'?1:-1)*worth;
  }
  score+=(s.hits.b-s.hits.w)*18;
  return score;
}
export function chooseFleetMove(s,difficulty='strong'){
  const moves=fleetMoves(s);if(!moves.length)return null;
  const max=s.turn==='b';let best=max?-Infinity:Infinity,pick=moves[0];
  for(const m of moves){
    const a=fleetPlay(s,m);let score;
    if(a.result)score=a.result.includes('勝ち')?(max?1e6:-1e6):0;
    else if(difficulty==='easy')score=evalFleet(a);
    else{
      let worst=max?Infinity:-Infinity;
      for(const r of fleetMoves(a)){
        const b=fleetPlay(a,r);
        const v=b.result?(b.result.includes('勝ち')?(max?-1e6:1e6):0):evalFleet(b);
        worst=max?Math.min(worst,v):Math.max(worst,v);
      }
      score=worst*.85+evalFleet(a)*.15;
    }
    score+=(max?1:-1)*Math.random()*.05;
    if(max?score>best:score<best){best=score;pick=m;}
  }
  if(pick.promotion)pick=moves.find(m=>m.from===pick.from&&m.to===pick.to&&m.promotion==='q')||pick;
  return pick;
}
