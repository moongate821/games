import {advance,coord,id,inCheck,legalMoves,side} from './engine.js';

const value={p:100,n:315,b:330,r:500,q:900,k:0};
const MATE=100000;

function evaluateClassic(s){
  let score=0;
  for(let i=0;i<s.board.length;i++){
    const piece=s.board[i];if(piece==='.')continue;
    const who=side(piece),c=coord(i),type=piece.toLowerCase();
    const center=(3.5-Math.abs(c.x-3.5))+(3.5-Math.abs(c.y-3.5));
    let worth=value[type];
    if(type==='p')worth+=(who==='b'?7-c.y:c.y)*7+center*2;
    if(type==='n'||type==='b')worth+=center*7+((who==='b'?c.y<7:c.y>0)?8:0);
    if(type==='r'||type==='q')worth+=center*2;
    if(type!=='p'&&type!=='k'&&c.z!==1)worth+=12;
    if(type==='k'&&s.fullmove<14)worth-=center*12;
    score+=(who==='b'?1:-1)*worth;
  }
  if(s.fullmove<=8){
    if(s.board[64+7*8+3]!=='q')score-=30;
    if(s.board[64+3]!=='Q')score+=30;
  }
  return score;
}

function evaluateDeep(s){
  let score=0,majorMaterial=0;
  const pieces=[];
  for(let i=0;i<s.board.length;i++){
    const p=s.board[i];if(p==='.')continue;
    pieces.push({p,who:side(p),c:coord(i)});
    if(!'pk'.includes(p.toLowerCase()))majorMaterial+=value[p.toLowerCase()];
  }
  const phase=Math.min(1,majorMaterial/4200);
  for(const {p,who,c} of pieces){
    const type=p.toLowerCase(),center=(3.5-Math.abs(c.x-3.5))+(3.5-Math.abs(c.y-3.5));
    let worth=value[type];
    if(type==='p')worth+=(who==='b'?7-c.y:c.y)*7+center*2;
    if(type==='n'||type==='b')worth+=center*7+((who==='b'?c.y<7:c.y>0)?8:0);
    if(type==='r'||type==='q')worth+=center*2;
    if(type!=='p'&&type!=='k'&&c.z!==1)worth+=12;
    if(type==='k'){
      worth-=phase*(center*10+(c.z!==1?22:0));
      const home=who==='b'?7:0,forward=who==='b'?-1:1,pawn=who==='b'?'p':'P';
      if(c.y===home&&(c.x===2||c.x===6))worth+=phase*18;
      if(c.y+forward>=0&&c.y+forward<8){
        for(let x=Math.max(0,c.x-1);x<=Math.min(7,c.x+1);x++){
          if(s.board[id(x,c.y+forward,c.z)]===pawn)worth+=phase*7;
        }
      }
      for(const enemy of pieces){
        if(enemy.who===who||enemy.p.toLowerCase()==='p'||enemy.p.toLowerCase()==='k')continue;
        const distance=Math.max(Math.abs(enemy.c.x-c.x),Math.abs(enemy.c.y-c.y),Math.abs(enemy.c.z-c.z));
        if(distance<=2)worth-=phase*(enemy.p.toLowerCase()==='q'?15:9);
      }
    }
    score+=(who==='b'?1:-1)*worth;
  }
  return score;
}

function terminalOrStatic(s){
  if(inCheck(s,s.turn)&&!legalMoves(s).length)return s.turn==='w'?MATE:-MATE;
  return evaluateDeep(s);
}

function search(s,depth,alpha,beta){
  if(depth===0)return terminalOrStatic(s);
  const moves=legalMoves(s);
  if(!moves.length)return inCheck(s,s.turn)?(s.turn==='w'?MATE:-MATE):0;
  const maximizing=s.turn==='b';
  const ordered=moves.map(move=>({move,next:advance(s,move)}));
  for(const item of ordered)item.estimate=evaluateDeep(item.next);
  ordered.sort((a,b)=>maximizing?b.estimate-a.estimate:a.estimate-b.estimate);
  // 3半手探索で応手の幅を保ちつつ、深い枝の計算を抑える。
  const width=depth===2?16:10;
  let best=maximizing?-Infinity:Infinity;
  for(const {next} of ordered.slice(0,width)){
    const score=search(next,depth-1,alpha,beta);
    best=maximizing?Math.max(best,score):Math.min(best,score);
    if(maximizing)alpha=Math.max(alpha,best);else beta=Math.min(beta,best);
    if(beta<=alpha)break;
  }
  return best;
}

export function chooseBotMove(s,difficulty='strong'){
  const candidates=legalMoves(s);
  const maximizing=s.turn==='b';
  let best=maximizing?-Infinity:Infinity,chosen=candidates[0];
  for(const move of candidates){
    const after=advance(s,move);
    let score;
    if(difficulty==='deep')score=search(after,2,maximizing?best:-Infinity,maximizing?Infinity:best);
    else{
      const replies=legalMoves(after);
      if(!replies.length)score=inCheck(after,after.turn)?(maximizing?MATE:-MATE):0;
      else if(difficulty==='easy')score=evaluateClassic(after);
      else{
        let worst=maximizing?Infinity:-Infinity;
        for(const reply of replies){
          const v=evaluateClassic(advance(after,reply));
          worst=maximizing?Math.min(worst,v):Math.max(worst,v);
        }
        score=worst*.85+evaluateClassic(after)*.15;
        if(inCheck(after,after.turn))score+=maximizing?12:-12;
      }
    }
    score+=(maximizing?1:-1)*Math.random()*.05;
    if(maximizing?score>best:score<best){best=score;chosen=move;}
  }
  if(chosen?.promotion){
    chosen=candidates.find(m=>m.from===chosen.from&&m.to===chosen.to&&m.promotion==='q')||chosen;
  }
  return chosen;
}
