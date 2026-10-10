/**
 * Original-informed, asset-free board quality evaluator.
 *
 * Reference summary numbers originate in docs/BOARD_DIFFICULTY_QUANT.md:
 * 93,457 APK BoardLib records for opening geometry; up to 300 sampled original
 * boards per library for largest-first full-run outcomes (I/H all).
 * No original boards or decompiled algorithms are embedded or distributed.
 *
 * IMPORTANT: largest-first is a deterministic comparison POLICY, not an
 * optimal player, and the original source does not promise perfect clearing.
 */
import {groups,removeCells,groupScore,bonus,countRemaining,boardProfile,
  LIBRARY_PROFILES,weightsFor,LIBRARY_LARGEST_FIRST,largestFirstOutcome} from './core.mjs';

export const ORIGINAL_LIBRARY_COUNTS=Object.freeze({
  A:1855,B:9858,C:15153,D:33560,E:25568,F:3460,G:3887,H:73,I:43
});
export const ORIGINAL_LARGEST_FIRST=LIBRARY_LARGEST_FIRST;
export const ORIGINAL_OVER_SCORE_PRESSURE=Object.freeze([
  {label:'0-100',overScore:50,maxGroup:7.23,isolated:39.88,potential:1108.25,
    clearScore:1672.98,remaining:17.72},
  {label:'101-250',overScore:175,maxGroup:7.05,isolated:41.58,potential:1061.79,
    clearScore:1600.58,remaining:19.85},
  {label:'251-400',overScore:320,maxGroup:6.66,isolated:43.75,potential:988.37,
    clearScore:1514.00,remaining:21.95},
  {label:'401-800',overScore:550,maxGroup:6.54,isolated:44.24,potential:968.43,
    clearScore:1494.83,remaining:22.30},
  {label:'801-1000',overScore:900,maxGroup:6.02,isolated:47.14,potential:874.34,
    clearScore:1386.87,remaining:24.93},
  {label:'1001-1200',overScore:1100,maxGroup:5.72,isolated:49.12,potential:816.55,
    clearScore:1319.00,remaining:26.86},
  {label:'>1200',overScore:1400,maxGroup:5.49,isolated:50.82,potential:770.13,
    clearScore:1259.27,remaining:28.58},
  {label:'revive',revive:true,maxGroup:7.89,isolated:37.50,potential:1220.57,
    clearScore:1802.95,remaining:15.70}
]);

/** Strictly follow same group/score/gravity rules used by actual H5 gameplay. */
export function rollout(board,{policy='largest',seed=1}={}){
  if(!['largest','smallest','random'].includes(policy))throw new Error('Unknown strategy');
  if(policy==='largest')return largestFirstOutcome(board);
  let b=board.map(row=>row.slice()),clearScore=0,moves=0;
  let state=(seed>>>0)||1;
  while(moves<50){
    const legal=groups(b);
    if(!legal.length)break;
    let chosen;
    if(policy==='random'){
      state^=state<<13;state^=state>>>17;state^=state<<5;
      chosen=legal[(state>>>0)%legal.length];
    }else{
      // Reuse scan-order tie-breaking across all tiers. This is a
      // deterministic evaluation policy, NOT a source claim.
      chosen=legal.reduce((best,g)=>best===null||
        (policy==='largest'?g.length>best.length:g.length<best.length)?g:best,null);
    }
    clearScore+=groupScore(chosen.length);
    b=removeCells(b,chosen);moves++;
  }
  if(moves===50&&groups(b).length)throw new Error('Rollout exceeds safe bound');
  const remaining=countRemaining(b);
  return {clearScore,remaining,bonus:bonus(remaining),totalScore:clearScore+bonus(remaining),moves};
}
export function evaluateBoard(board){
  const structure=boardProfile(board);
  return {...structure,largest:rollout(board,{policy:'largest'})};
}
export function percentError(actual,reference){
  if(reference===0)return actual===0?0:null;
  return 100*(actual-reference)/reference;
}
export function weightedReference(weights){
  const entries=Object.entries(weights);
  const denominator=entries.reduce((sum,[,weight])=>sum+weight,0);
  const keys=['maxGroup','isolated','potential','clearScore','remaining'];
  const result={};
  for(const key of keys)result[key]=entries.reduce((sum,[tier,weight])=>{
    const ref=key==='isolated'?100-LIBRARY_PROFILES[tier].removable:
      (key in LIBRARY_PROFILES[tier]?LIBRARY_PROFILES[tier][key]:ORIGINAL_LARGEST_FIRST[tier][key]);
    return sum+weight*ref;
  },0)/denominator;
  return result;
}
export function assessOriginalPressure(){
  return ORIGINAL_OVER_SCORE_PRESSURE.map(({label,overScore=0,revive=false,...expected})=>{
    const predicted=weightedReference(weightsFor({stage:7,overScore,revive}));
    const errors=Object.fromEntries(Object.keys(expected).map(key=>[key,
      Number(percentError(predicted[key],expected[key]).toFixed(2))]));
    return {label,expected,predicted,errors};
  });
}
