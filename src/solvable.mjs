/**
 * Copyright-safe constructive Classic opening boards.
 *
 * Each step inserts a new monochrome, isolated vertical group into one
 * bottom-packed column. Reversing the steps uses ONLY ordinary connected
 * group clears and gravity/left-column compression. This produces an explicit
 * replayable perfect-clear witness without using APK BoardLib records.
 *
 * Guarantee: at least ONE path on the untouched opening board. Arbitrary
 * player choices / prop usage can destroy that path; no mid-game promise.
 */
const WIDTH=10;
const STYLE={
  A:[[2,3,5],[3,3,4],[4,6],[2,2,6]],
  B:[[2,2,3,3],[2,3,5],[2,2,2,2,2]],
  C:[[2,2,3,3],[2,3,5],[2,2,2,2,2]],
  D:[[2,2,2,2,2],[2,2,3,3],[2,2,2,4]],
  E:[[2,2,2,2,2],[2,2,3,3]],
  F:[[2,2,2,2,2]],
  G:[[2,2,2,2,2],[2,2,3,3]],
  H:[[2,2,2,2,2]],
  I:[[2,8],[4,6],[5,5],[2,3,5]]
};
function shuffled(parts,rng){
  const arr=parts.slice();
  for(let i=arr.length-1;i>0;i--){
    const j=Math.floor(rng()*(i+1));[arr[i],arr[j]]=[arr[j],arr[i]];
  }
  return arr;
}
function attempt(rng,tier,pairsOnly=false){
  const pool=pairsOnly?[[2,2,2,2,2]]:(STYLE[tier]||STYLE.B);
  const pending=Array.from({length:WIDTH},()=>{
    const parts=pool[Math.floor(rng()*pool.length)];
    return shuffled(parts,rng);
  });
  const columns=[],insertions=[];
  while(insertions.reduce((n,x)=>n+x.size,0)<WIDTH*WIDTH){
    const eligible=[];
    const maxCol=Math.min(WIDTH-1,columns.length);
    for(let c=0;c<=maxCol;c++){
      if(!pending[c].length)continue;
      const size=pending[c][0],height=columns[c]?.length||0;
      if(height+size>WIDTH)continue;
      eligible.push({c,size,height});
    }
    if(!eligible.length)return null;
    // Favor growing the right edge before columns become crowded. The RNG
    // controls column selection, insertion depth and color independently.
    const available=shuffled(eligible,rng).sort((a,b)=>
      (b.c===columns.length?1:0)-(a.c===columns.length?1:0));
    let choice=null;
    for(const {c,size,height} of available){
      const cuts=shuffled(Array.from({length:height+1},(_,i)=>i),rng);
      for(const cut of cuts){
        const blocked=new Set();
        const current=columns[c]||[];
        if(cut>0)blocked.add(current[cut-1]);
        if(cut<height)blocked.add(current[cut]);
        for(const neighbor of [columns[c-1],columns[c+1]]){
          if(!neighbor)continue;
          for(let level=cut;level<cut+size;level++){
            if(level<neighbor.length)blocked.add(neighbor[level]);
          }
        }
        const colors=shuffled([0,1,2,3,4].filter(v=>!blocked.has(v)),rng);
        if(colors.length){choice={c,size,cut,color:colors[0]};break;}
      }
      if(choice)break;
    }
    if(!choice)return null;
    const {c,size,cut,color}=choice;
    if(c===columns.length)columns.push([]);
    columns[c].splice(cut,0,...Array(size).fill(color));
    pending[c].shift();
    insertions.push({row:WIDTH-size-cut,col:c,size,color});
  }
  if(columns.length!==WIDTH||columns.some(col=>col.length!==WIDTH))return null;
  const board=Array.from({length:WIDTH},(_,r)=>
    Array.from({length:WIDTH},(_,c)=>columns[c][WIDTH-1-r]));
  return {board,witness:insertions.reverse()};
}
/** Return a full board AND a strictly legal perfect-clear path or throw.
 * Bounded retries; pair-only fallback preserves correctness if a tier-specific
 * arrangement gets boxed in. No unverified "random board is solvable" claim.
 */
export function certifiedOpening(rng,tier='B'){
  for(let attemptNo=0;attemptNo<8;attemptNo++){
    const result=attempt(rng,tier,attemptNo>=5);
    if(result)return result;
  }
  throw new Error('Unable to construct certified opening board');
}
