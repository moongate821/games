export const LEVELS = ['下段', '中央', '上段'];
export const TYPES = { k: 'キング', q: 'クイーン', r: 'ルーク', b: 'ビショップ', n: 'ナイト', p: 'ポーン' };
const axes = [-1, 0, 1];
const vectors = [];
for (const dx of axes) for (const dy of axes) for (const dz of axes) {
  if (dx || dy || dz) vectors.push([dx, dy, dz]);
}
const rookDirs = vectors.filter(v => v.filter(Boolean).length === 1);
const bishopDirs = vectors.filter(v => v.filter(Boolean).length === 2);
const queenDirs = vectors;
const knightDirs = [];
for (let a = 0; a < 3; a++) for (let b = 0; b < 3; b++) {
  if (a === b) continue;
  for (const s of [-1, 1]) for (const t of [-1, 1]) {
    const v = [0, 0, 0]; v[a] = 2 * s; v[b] = t;
    knightDirs.push(v);
  }
}
export const id = (x, y, z) => z * 64 + y * 8 + x;
export const coord = i => ({ x: i % 8, y: Math.floor(i / 8) % 8, z: Math.floor(i / 64) });
export const valid = (x, y, z) => z >= 0 && z <= 2 && x >= 0 && x < 8 && y >= 0 && y < 8 && (z === 1 || (x >= 1 && x <= 6 && y >= 1 && y <= 6));
export const side = p => p === '.' ? null : p === p.toUpperCase() ? 'w' : 'b';
export const opponent = s => s === 'w' ? 'b' : 'w';
export const label = i => { const {x,y,z}=coord(i); return `${['下','中','上'][z]}:${'abcdefgh'[x]}${y+1}`; };

export function initial() {
  const board = Array(192).fill('.');
  for (let x = 0; x < 8; x++) {
    board[id(x, 0, 1)] = 'RNBQKBNR'[x];
    board[id(x, 1, 1)] = 'P';
    board[id(x, 6, 1)] = 'p';
    board[id(x, 7, 1)] = 'rnbqkbnr'[x];
  }
  const state = { board, turn: 'w', castle: 'KQkq', ep: -1, halfmove: 0, fullmove: 1, result: null, repetition: {} };
  state.repetition[key(state)] = 1;
  return state;
}
export function key(s) {
  let ep=s.ep;
  if(ep>=0){
    const c=coord(ep), d=s.turn==='w'?1:-1, pawn=s.turn==='w'?'P':'p';
    const possible=[-1,1].some(dx=>{
      const x=c.x+dx,y=c.y-d;
      if(!valid(x,y,c.z)||s.board[id(x,y,c.z)]!==pawn)return false;
      return !inCheck(applyRaw(s,{from:id(x,y,c.z),to:ep,enPassant:true}),s.turn);
    });
    if(!possible)ep=-1;
  }
  return `${s.board.join('')}|${s.turn}|${s.castle}|${ep}`;
}

function rayAttacks(s, from, dirs, target) {
  const c = coord(from);
  for (const [dx,dy,dz] of dirs) {
    let x=c.x+dx, y=c.y+dy, z=c.z+dz;
    while (valid(x,y,z)) {
      const to=id(x,y,z);
      if (to === target) return true;
      if (s.board[to] !== '.') break;
      x+=dx; y+=dy; z+=dz;
    }
  }
  return false;
}
export function attacked(s, target, by) {
  const t=coord(target);
  for (let from=0; from<192; from++) {
    const p=s.board[from]; if (side(p)!==by) continue;
    const c=coord(from), dx=t.x-c.x, dy=t.y-c.y, dz=t.z-c.z;
    switch(p.toLowerCase()) {
      case 'p': if (dz===0 && dy===(by==='w'?1:-1) && Math.abs(dx)===1) return true; break;
      case 'n': if ([Math.abs(dx),Math.abs(dy),Math.abs(dz)].sort((a,b)=>a-b).join('')==='012') return true; break;
      case 'k': if (Math.max(Math.abs(dx),Math.abs(dy),Math.abs(dz))===1) return true; break;
      case 'r': if (rayAttacks(s,from,rookDirs,target)) return true; break;
      case 'b': if (rayAttacks(s,from,bishopDirs,target)) return true; break;
      case 'q': if (rayAttacks(s,from,queenDirs,target)) return true; break;
    }
  }
  return false;
}
export function inCheck(s, who) {
  const king=s.board.indexOf(who==='w'?'K':'k');
  return king<0 || attacked(s,king,opponent(who));
}
function pushes(s, from, dirs, out) {
  const c=coord(from), who=side(s.board[from]);
  for (const [dx,dy,dz] of dirs) {
    let x=c.x+dx,y=c.y+dy,z=c.z+dz;
    while(valid(x,y,z)) {
      const to=id(x,y,z), target=s.board[to];
      if(side(target)===who) break;
      if(target.toLowerCase()!=='k') out.push({from,to});
      if(target!=='.') break;
      x+=dx;y+=dy;z+=dz;
    }
  }
}
function pseudo(s, who) {
  const out=[];
  for(let from=0;from<192;from++) {
    const p=s.board[from]; if(side(p)!==who) continue;
    const c=coord(from), type=p.toLowerCase();
    if(type==='r'||type==='b'||type==='q') pushes(s,from,type==='r'?rookDirs:type==='b'?bishopDirs:queenDirs,out);
    if(type==='n'||type==='k') {
      for(const [dx,dy,dz] of type==='n'?knightDirs:vectors) {
        const x=c.x+dx,y=c.y+dy,z=c.z+dz;
        if(!valid(x,y,z)) continue;
        const to=id(x,y,z);
        if(side(s.board[to])!==who && s.board[to].toLowerCase()!=='k') out.push({from,to});
      }
    }
    if(type==='p') {
      const d=who==='w'?1:-1, home=who==='w'?1:6, last=who==='w'?7:0;
      const add=(to,extra={}) => { if(coord(to).y===last) for(const promotion of ['q','r','b','n']) out.push({from,to,promotion,...extra}); else out.push({from,to,...extra}); };
      if(valid(c.x,c.y+d,c.z) && s.board[id(c.x,c.y+d,c.z)]==='.') {
        add(id(c.x,c.y+d,c.z));
        if(c.y===home && s.board[id(c.x,c.y+2*d,c.z)]==='.') add(id(c.x,c.y+2*d,c.z));
      }
      for(const dx of [-1,1]) {
        if(!valid(c.x+dx,c.y+d,c.z)) continue;
        const to=id(c.x+dx,c.y+d,c.z);
        if(side(s.board[to])===opponent(who) && s.board[to].toLowerCase()!=='k') add(to);
        if(to===s.ep) add(to,{enPassant:true});
      }
    }
  }
  const y=who==='w'?0:7, king=id(4,y,1), enemy=opponent(who);
  if(s.board[king]===(who==='w'?'K':'k') && !inCheck(s,who)) {
    for(const [right,rookX,through,dest] of (who==='w'?[['K',7,[5,6],6],['Q',0,[3,2],2]]:[['k',7,[5,6],6],['q',0,[3,2],2]])) {
      if(!s.castle.includes(right) || s.board[id(rookX,y,1)]!==(who==='w'?'R':'r')) continue;
      const between=rookX===7?[5,6]:[1,2,3];
      if(between.some(x=>s.board[id(x,y,1)]!=='.')) continue;
      const crossing={...s,board:s.board.slice()};
      crossing.board[king]='.';
      crossing.board[id(through[0],y,1)]=s.board[king];
      if(attacked(crossing,id(through[0],y,1),enemy)) continue;
      out.push({from:king,to:id(dest,y,1),castle:true});
    }
  }
  return out;
}
function applyRaw(s,m) {
  const n={...s,board:s.board.slice(),repetition:s.repetition};
  const p=n.board[m.from], target=n.board[m.to], who=side(p), c=coord(m.from), d=coord(m.to);
  n.board[m.from]='.'; n.board[m.to]=m.promotion?(who==='w'?m.promotion.toUpperCase():m.promotion):p;
  if(m.enPassant) n.board[id(d.x,c.y,c.z)]='.';
  if(m.castle) {
    const rookFrom=id(d.x===6?7:0,c.y,1),rookTo=id(d.x===6?5:3,c.y,1);
    n.board[rookTo]=n.board[rookFrom]; n.board[rookFrom]='.';
  }
  if(p==='K') n.castle=n.castle.replace(/[KQ]/g,'');
  if(p==='k') n.castle=n.castle.replace(/[kq]/g,'');
  if(p==='R' && c.z===1 && c.y===0) n.castle=n.castle.replace(c.x===0?'Q':c.x===7?'K':'','');
  if(p==='r' && c.z===1 && c.y===7) n.castle=n.castle.replace(c.x===0?'q':c.x===7?'k':'','');
  if(m.from===id(0,0,1)||m.to===id(0,0,1)) n.castle=n.castle.replace('Q','');
  if(m.from===id(7,0,1)||m.to===id(7,0,1)) n.castle=n.castle.replace('K','');
  if(m.from===id(0,7,1)||m.to===id(0,7,1)) n.castle=n.castle.replace('q','');
  if(m.from===id(7,7,1)||m.to===id(7,7,1)) n.castle=n.castle.replace('k','');
  n.ep= p.toLowerCase()==='p' && Math.abs(d.y-c.y)===2 ? id(c.x,(c.y+d.y)/2,c.z) : -1;
  n.halfmove=p.toLowerCase()==='p'||target!=='.'||m.enPassant?0:s.halfmove+1;
  n.fullmove=s.fullmove+(who==='b'?1:0);
  n.turn=opponent(who);
  return n;
}
export const advance = (s,m) => applyRaw(s,m);
export function legalMoves(s,who=s.turn) {
  return pseudo(s,who).filter(m=>!inCheck(applyRaw(s,m),who));
}
export function play(s,m) {
  const n=applyRaw(s,m);
  n.repetition={...s.repetition};
  const k=key(n); n.repetition[k]=(n.repetition[k]||0)+1;
  const moves=legalMoves(n);
  if(!moves.length) n.result=inCheck(n,n.turn)?`${s.turn}の勝ち（チェックメイト）`:'引き分け（ステイルメイト）';
  else if(n.board.every(p=>p==='.'||p.toLowerCase()==='k')) n.result='引き分け（キングのみ）';
  else if(n.repetition[k]>=5) n.result='引き分け（同一局面5回）';
  else if(n.halfmove>=150) n.result='引き分け（75手ルール）';
  return n;
}
export function canClaimDraw(s) { return (s.repetition[key(s)]||0)>=3 || s.halfmove>=100; }
export function moveText(s,m) {
  const p=s.board[m.from];
  if(m.castle) return coord(m.to).x===6?'O-O':'O-O-O';
  return `${TYPES[p.toLowerCase()]} ${label(m.from)}→${label(m.to)}${s.board[m.to]!=='.'||m.enPassant?' ×':''}${m.promotion?'='+TYPES[m.promotion]:''}`;
}
export {vectors,rookDirs,bishopDirs,knightDirs};
