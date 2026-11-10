'use strict';
/* Approved concept clean plates are the scene itself. Coordinates are measured
 * in a 32 x 18 grid over the whole image; only exposed deck is walkable.
 * Keep day/night geometry identical so lighting never changes collisions. */
const CONCEPT_SHIP = {
  C10_SHIP: { image: 'bg_ship_concept_day_v2', exits: [[6,12,'港へ'],[25,9,'浮島へ']] },
  C12_DECK: { image: 'bg_ship_concept_night_v2', exits: [[6,12,'岸へ']] }
};
(function () {
  IMG_LIST.push('bg_ship_concept_day_v2.png', 'bg_ship_concept_night_v2.png');
  const inside = (x,y,p) => {
    let hit=false;
    for(let i=0,j=p.length-1;i<p.length;j=i++) {
      const a=p[i], b=p[j];
      if((a[1]>y)!==(b[1]>y) && x<(b[0]-a[0])*(y-a[1])/(b[1]-a[1])+a[0]) hit=!hit;
    }
    return hit;
  };
  const floor = [
    // Lower deck inside the curved rails, excluding the hull and cloud sea.
    [[5.5,12],[10,11.1],[17,8.9],[24,8.0],[27.2,9],[25.5,10.6],[20,12.3],[16,13.2],[13,13.5],[8,13.5],[5.5,12.9]],
    // Port stair and raised stern deck; cabin face below is not floor.
    [[24.2,8.8],[25,7.8],[25.8,6.6],[26.7,6.8],[25.4,8.9]],
    [[26,6.2],[27.3,5.4],[29.6,5.1],[31,5.7],[30.7,6.6],[28.4,7.1],[26.4,6.7]]
  ];
  // Bases of both masts, cargo, and the raised hatch. Flat rope is step-over.
  const obstacles = [[12,11],[13,11],[22,9],[9,11],[10,11],[18,10],[19,10],[20,10],[19,9],[28,5]];
  const rows=Array.from({length:18},(_,y)=>Array.from({length:32},(_,x)=>floor.some(p=>inside(x+.5,y+.85,p))?'o':'w'));
  for(const [x,y] of obstacles) rows[y][x]='w';
  // Continuous stair treads at this grid resolution.
  for(const [x,y] of [[24,8],[25,8],[25,7],[25,6],[26,6],[27,6]]) rows[y][x]='o';
  const points={start:[16,11],hold:[15,10],helm:[27,5],gangway_in:[7,12],bow_in:[24,9],rail:[16,9],noah:[16,12],serena:[23,10]};
  for(const mid of Object.keys(CONCEPT_SHIP)) {
    const m=MAPS[mid]; m.tiles=rows.map(r=>r.join('')); m.points={...points}; m.dim=null;
    // Background already contains lamps, barrels, hatch, masts and rails.
    LAYOUT[mid]={border:'none',buildings:[],lamps:[],barrels:[],signs:[],trees:[],decor:[]};
  }
  for(const a of CHREG.actors) {
    if(a.id==='c12_noah') a.at='C12_DECK@noah';
    if(a.id==='c12_serena') a.at='C12_DECK@serena';
  }
  const seen=new Set();
  CHREG.warps=CHREG.warps.filter(z=>{
    if(!CONCEPT_SHIP[z.map]) return true;
    const slot=z.map+':'+z.to;if(seen.has(slot)) return false;seen.add(slot);
    z.at=z.to==='C10_ISLES'?[25,9]:[6,12];return true;
  });
  for(const id of ['prop.ship_mast','prop.ship_wheel','tile.deck_wood'])
    ASSET_USE[id]='採用済み帆船コンセプトを一体背景として再構成（昼・夜の甲板）';
})();
