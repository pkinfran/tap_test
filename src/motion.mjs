import {N,emptyBoard} from './core.mjs';
/**
 * Recover where every surviving unique piece travels. Color identity alone
 * cannot match old/new tiles when identical colors repeat.
 * Vertical compression precedes left shift of newly empty columns.
 */
export function motionPlan(board,removedCells){
  const removed=new Set(removedCells.map(([r,c])=>r*N+c));
  const sourceCols=[];
  for(let c=0;c<N;c++){
    const survivors=[];
    for(let r=N-1;r>=0;r--)if(board[r][c]!==null&&!removed.has(r*N+c)){
      survivors.push({sourceRow:r,sourceCol:c,color:board[r][c]});
    }
    if(survivors.length)sourceCols.push(survivors);
  }
  const after=emptyBoard(),placements=[];
  for(let toCol=0;toCol<sourceCols.length;toCol++){
    sourceCols[toCol].forEach((piece,index)=>{
      const toRow=N-1-index;
      after[toRow][toCol]=piece.color;
      placements.push({...piece,toRow,toCol,
        dropRows:toRow-piece.sourceRow,shiftCols:piece.sourceCol-toCol});
    });
  }
  return {after,placements,
    dropMax:Math.max(0,...placements.map(p=>p.dropRows)),
    shiftMax:Math.max(0,...placements.map(p=>p.shiftCols)),
    moved:placements.filter(p=>p.dropRows||p.shiftCols).length
  };
}
/** Single-clock, original-sample-informed unlock budget, NOT source-exact physics. */
export const REAL_CLEAR_SAMPLES_MS={
  2:[913],3:[910,689,861],4:[1067,952],5:[1159,1247,1157],8:[1495]
};
export function unlockBudgetMs(groupSize,plan){
  const observed=REAL_CLEAR_SAMPLES_MS[groupSize];
  const sample=observed?
    observed.reduce((a,b)=>a+b,0)/observed.length:
    580+110*groupSize;
  // Observed times are source APK single-clock touch -> input unlock. The
  // extra travel allowance below is explicitly an H5 animation preference,
  // NOT a newly measured Cocos frame timing.
  const travel=Math.min(160,plan.dropMax*12+plan.shiftMax*14);
  return Math.max(900,Math.round(sample+55+travel*.48));
}
/**
 * Clear choreography built from measured n2/n3/n4/n5/n8 ORIGINAL input-unlock
 * intervals; timeline is CLEAN-ROOM, not a frame-for-frame APK capture.
 * No fullscreen tint, opacity mask or destructive board replacement mid-flight.
 */
export function clearChoreography(groupSize,plan,{reducedMotion=false}={}){
  const n=Math.max(1,Math.trunc(groupSize));
  const observed=unlockBudgetMs(n,plan);
  if(reducedMotion)return {
    totalMs:Math.max(130,Math.round(observed*.23)),
    delays:Array.from({length:n},()=>0),burstMs:80,fallStartMs:0,
    motionMs:90,settleMs:40,clearIntervalMs:0
  };
  // Original code dispatches each destroy at ~70 ms; for very large groups
  // preserve exactly that cadence and extend total time so all pieces finish.
  const delays=Array.from({length:n},(_,i)=>i*70);
  const last=delays.at(-1);
  const burstMs=235;
  const fallStartMs=Math.max(205,last-42);
  const settleMs=100;
  // The last destroyed tile launches its own local 650ms score flight.
  // Do not discard the parent FX layer before that final HUD trajectory lands;
  // this mattered at n20+ where the original short-group budget was too small.
  // This is H5 authored feedback, not a claim of original n20 native timing.
  const totalMs=Math.max(observed,last+burstMs+320,fallStartMs+520,last+650);
  const motionMs=totalMs-fallStartMs-settleMs;
  return {totalMs,delays,burstMs,fallStartMs,motionMs,settleMs,clearIntervalMs:70};
}
