// Experimental fantasy mode: chess-like movement, three shields per unit,
// one dragonfire and one summon per side, and healing circles on the outer boards.
import {coord,id,valid,side,opponent,label,vectors} from './engine.js?v=20261024f';
import {fleetInitial,fleetMoves} from './fleet.js?v=20261025a';

export const FANTASY_NAME={k:'王',q:'ドラゴン',r:'勇者',b:'魔法使い',n:'召喚士',p:'精霊'};
export const FANTASY_FACTION={w:'光の王国',b:'影の王国'};
// Mirror symmetry across the players' ranks and the upper/lower boards.
export const MAGIC_CIRCLES=[id(3,3,1),id(3,4,1),id(4,3,2),id(4,4,0)];
const circles=new Set(MAGIC_CIRCLES);
export const CIRCLE_WIN_STREAK=3;
export const FANTASY_JUDGE_QUIET=60, FANTASY_JUDGE_TOTAL=100;
export const MANA_SURGE_TURN=40;
const VALUE={k:500,q:900,r:500,b:330,n:300,p:100};

export function fantasyInitial(){
  const base=fleetInitial(false);
  return {...base,fleet:false,fantasy:true,powers:{w:{fire:1,summon:1},b:{fire:1,summon:1}},circleStreak:{w:0,b:0}};
}
export const circlesHeld=(s,who)=>MAGIC_CIRCLES.filter(at=>side(s.board[at])===who).length;

export function fantasyMoves(s,who=s.turn){
  const moves=[];
  for(const m of fleetMoves(s,who)){
    if(m.order)continue;
    if(!m.attack||s.fullmove<MANA_SURGE_TURN){moves.push(m);continue;}
    const boosted={...m,damage:2,hit:s.hp[m.to]>2,sink:s.hp[m.to]<=2,surge:true};
    const last=who==='w'?7:0;
    if(boosted.sink&&!m.promotion&&s.board[m.from].toLowerCase()==='p'&&coord(m.to).y===last){
      for(const promotion of ['q','r','b','n'])moves.push({...boosted,promotion});
    }else moves.push(boosted);
  }
  if(s.powers[who].fire){
    for(const m of moves.slice()){
      if(!m.attack||!['q','b'].includes(s.board[m.from].toLowerCase()))continue;
      moves.push({...m,spell:'fire',damage:2,hit:s.hp[m.to]>2,sink:s.hp[m.to]<=2});
    }
  }
  if(s.powers[who].summon){
    for(let from=0;from<192;from++){
      const p=s.board[from];if(side(p)!==who||p.toLowerCase()!=='n')continue;
      const c=coord(from);
      for(const [dx,dy,dz] of vectors){
        const x=c.x+dx,y=c.y+dy,z=c.z+dz;
        if(valid(x,y,z)&&s.board[id(x,y,z)]==='.')moves.push({from,to:id(x,y,z),spell:'summon'});
      }
    }
  }
  return moves;
}

export function fantasyPlay(s,m){
  const n={...s,board:s.board.slice(),hp:s.hp.slice(),hits:{...s.hits},sunk:{...s.sunk},powers:{w:{...s.powers.w},b:{...s.powers.b}},circleStreak:{...s.circleStreak},repetition:{}};
  const p=n.board[m.from],who=side(p),target=n.board[m.to];
  const info={from:m.from,to:m.to,attacker:p,target,who,spell:m.spell||'normal',attack:!!m.attack,hit:!!m.hit,sink:false,surge:!!m.surge&&m.spell!=='fire',hpBefore:target==='.'?0:s.hp[m.to],hpAfter:0,splash:[],circle:false,disrupted:false};
  if(m.spell==='summon'){
    n.powers[who].summon=0;
    n.board[m.to]=who==='w'?'P':'p';n.hp[m.to]=3;
    n.halfmove=0;
  }else{
    if(m.spell==='fire')n.powers[who].fire=0;
    if(m.attack){
      n.hits[who]++;
      n.hp[m.to]-=m.damage||1;info.hpAfter=Math.max(0,n.hp[m.to]);
      if(n.hp[m.to]<=0){
        info.sink=true;n.sunk[who]++;n.board[m.to]='.';n.hp[m.to]=0;
      }
    }
    if(!m.hit){
      const health=n.hp[m.from];n.board[m.from]='.';n.hp[m.from]=0;
      n.board[m.to]=m.promotion?(who==='w'?m.promotion.toUpperCase():m.promotion):p;n.hp[m.to]=health;
      if(circles.has(m.to)){
        info.circle=true;
        n.hp[m.to]=Math.min(3,n.hp[m.to]+1);
      }
    }
    if(m.spell==='fire'){
      const c=coord(m.to);
      for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){
        const x=c.x+dx,y=c.y+dy;
        if(!valid(x,y,c.z))continue;
        const at=id(x,y,c.z),victim=n.board[at];
        if(side(victim)!==opponent(who)||victim.toLowerCase()==='k'||n.hp[at]<=1)continue;
        n.hp[at]--;info.splash.push(at);
      }
    }
    n.halfmove=m.attack||p.toLowerCase()==='p'?0:s.halfmove+1;
  }
  n.fullmove=s.fullmove+(who==='b'?1:0);n.turn=opponent(who);n.ep=-1;n.last=info;
  if(info.attack&&(circles.has(m.to)||info.splash.some(at=>circles.has(at)))){
    info.disrupted=n.circleStreak[opponent(who)]>0;
    n.circleStreak[opponent(who)]=0;
  }
  for(const team of ['w','b'])if(circlesHeld(n,team)<2)n.circleStreak[team]=0;
  if(circlesHeld(n,who)>=2)n.circleStreak[who]++;
  if(info.sink&&target.toLowerCase()==='k')n.result=`${FANTASY_FACTION[who]}の勝ち（王を倒した）`;
  else if(n.circleStreak[who]>=CIRCLE_WIN_STREAK)n.result=`${FANTASY_FACTION[who]}の勝ち（魔法陣を支配）`;
  else if(!fantasyMoves(n).length)n.result='引き分け（動ける仲間がいない）';
  else if(n.halfmove>=FANTASY_JUDGE_QUIET||n.fullmove>FANTASY_JUDGE_TOTAL){
    const w=fantasyPower(n,'w'),b=fantasyPower(n,'b'),why=n.halfmove>=FANTASY_JUDGE_QUIET?'攻撃なし30往復':'100往復';
    n.result=Math.abs(w-b)<50?`引き分け（${why}・戦力互角）`:`${FANTASY_FACTION[w>b?'w':'b']}の判定勝ち（${why}）`;
  }
  return n;
}

export function fantasyMoveText(s,m){
  const name=FANTASY_NAME[s.board[m.from].toLowerCase()];
  if(m.spell==='summon')return `${name} ${label(m.from)}から ${label(m.to)}へ精霊を召喚`;
  if(m.spell==='fire')return `${name}の竜炎 ${label(m.from)}→${label(m.to)}${s.hp[m.to]<=2?' 撃破':''}${circles.has(m.to)&&s.circleStreak[opponent(s.turn)]>0?' · 支配を妨害':''}`;
  if(m.attack)return `${m.surge?'魔力奔流 ':''}${name} ${label(m.from)}が ${FANTASY_NAME[s.board[m.to].toLowerCase()]} ${label(m.to)}を攻撃${s.hp[m.to]<=(m.damage||1)?' →撃破':''}${m.promotion?` 覚醒→${FANTASY_NAME[m.promotion]}`:''}${circles.has(m.to)&&s.circleStreak[opponent(s.turn)]>0?' · 支配を妨害':''}`;
  return `${name} ${label(m.from)}→${label(m.to)}${m.promotion?` 覚醒→${FANTASY_NAME[m.promotion]}`:''}${circles.has(m.to)?' 魔法陣':''}`;
}

export function fantasyPower(s,who){
  let power=0;
  for(let i=0;i<192;i++)if(side(s.board[i])===who)power+=VALUE[s.board[i].toLowerCase()]*s.hp[i]/3;
  return power;
}
export function kingHp(s,who){
  const i=s.board.indexOf(who==='w'?'K':'k');return i<0?0:s.hp[i];
}
const winnerOf=result=>result?.startsWith(FANTASY_FACTION.w)?'w':result?.startsWith(FANTASY_FACTION.b)?'b':null;
function kingFreedom(s,king,who){
  const c=coord(king);let open=0;
  for(const [dx,dy,dz] of vectors){
    const x=c.x+dx,y=c.y+dy,z=c.z+dz;
    if(valid(x,y,z)&&side(s.board[id(x,y,z)])!==who)open++;
  }
  return open;
}
function evaluate(s){
  let score=0,count=0;
  const kings={w:s.board.indexOf('K'),b:s.board.indexOf('k')};
  for(const p of s.board)if(p!=='.')count++;
  const late=Math.max(0,Math.min(1,(24-count)/18));
  for(let at=0;at<192;at++){
    const p=s.board[at];if(p==='.')continue;
    const who=side(p),type=p.toLowerCase(),c=coord(at),sign=who==='b'?1:-1;
    let worth=VALUE[type]*s.hp[at]/3;
    if(type==='k')worth-=(3-s.hp[at])*250;
    else{
      const center=(3.5-Math.abs(c.x-3.5))+(3.5-Math.abs(c.y-3.5));
      worth+=center*3+(type==='p'?(who==='b'?7-c.y:c.y)*6:0);
      const enemy=kings[opponent(who)];
      if(enemy>=0){const e=coord(enemy),distance=Math.max(Math.abs(e.x-c.x),Math.abs(e.y-c.y),Math.abs(e.z-c.z));worth+=(7-distance)*(3+28*late);}
    }
    score+=sign*worth;
  }
  for(const who of ['w','b']){
    const sign=who==='b'?1:-1;
    score+=sign*((s.powers[who].fire||0)*110+(s.powers[who].summon||0)*65);
    const held=circlesHeld(s,who),streak=s.circleStreak[who]||0;
    score+=sign*held*420;
    // A two-turn hold usually becomes an immediate win on the next move.
    // Make the one-reply AI defend it before static material matters.
    score+=sign*(streak>=2?15000:streak===1?1500:0);
    const enemy=kings[opponent(who)];
    if(enemy>=0){
      score+=sign*(26-kingFreedom(s,enemy,opponent(who)))*(2+10*late);
      if(fantasyMoves(s,who).some(m=>m.attack&&m.to===enemy))score+=sign*(40+120*late);
    }
  }
  return score;
}
export function chooseFantasyMove(s,difficulty='strong'){
  const moves=fantasyMoves(s);if(!moves.length)return null;
  const max=s.turn==='b';let best=max?-Infinity:Infinity,pick=moves[0];
  const practice=[];
  const value=position=>{
    if(!position.result)return evaluate(position);
    const winner=winnerOf(position.result);
    return winner==='b'?1e6:winner==='w'?-1e6:0;
  };
  for(const m of moves){
    const a=fantasyPlay(s,m);let score;
    if(a.result)score=value(a);
    else if(difficulty==='easy')score=evaluate(a);
    else{
      let worst=max?Infinity:-Infinity;
      for(const reply of fantasyMoves(a)){
        const b=fantasyPlay(a,reply);
        const v=value(b);
        worst=max?Math.min(worst,v):Math.max(worst,v);
      }
      score=worst*.85+evaluate(a)*.15;
    }
    if(difficulty==='easy')practice.push({move:m,score});
    else{
      score+=(max?1:-1)*Math.random()*.05;
      if(max?score>best:score<best){best=score;pick=m;}
    }
  }
  if(difficulty==='easy'){
    practice.sort((left,right)=>max?right.score-left.score:left.score-right.score);
    if(Math.abs(practice[0].score)>=900000)pick=practice[0].move;
    else{
      const chances=[.55,.25,.15,.05];let roll=Math.random();
      const choices=practice.slice(0,4);
      for(let i=0;i<choices.length;i++){
        roll-=chances[i];
        if(roll<=0||i===choices.length-1){pick=choices[i].move;break;}
      }
    }
  }
  if(pick.promotion)pick=moves.find(m=>m.from===pick.from&&m.to===pick.to&&m.spell===pick.spell&&m.promotion==='q')||pick;
  return pick;
}
