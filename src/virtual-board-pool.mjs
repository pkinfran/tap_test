/** Independent finite virtual pools for each original APK difficulty tier.
 *
 * The counts are source-derived, but slot indices and board contents are
 * entirely synthetic and MUST NOT be described as original BoardLib IDs.
 * Each tier draws every virtual slot once before starting a fresh permutation.
 * Constant-size state per tier, no original records, no giant shuffled arrays.
 */
import {ORIGINAL_LIBRARY_DISTRIBUTION} from './original-distribution.mjs';
export const VIRTUAL_POOL_COUNTS=Object.freeze(Object.fromEntries(
  Object.entries(ORIGINAL_LIBRARY_DISTRIBUTION).map(([tier,stats])=>[tier,stats.count])
));
export function emptyVirtualDrawCounts(){
  return Object.fromEntries(Object.keys(VIRTUAL_POOL_COUNTS).map(tier=>[tier,0]));
}
function hash32(value){
  let x=value>>>0;
  x^=x>>>16;x=Math.imul(x,0x7feb352d);x^=x>>>15;
  x=Math.imul(x,0x846ca68b);x^=x>>>16;
  return x>>>0;
}
function coprime(a,b){
  let x=a,y=b;
  while(y){const next=x%y;x=y;y=next;}
  return x===1;
}
export function virtualPoolSlot(tier,drawOrdinal,seed=1){
  const n=VIRTUAL_POOL_COUNTS[tier];
  if(!n||!Number.isSafeInteger(drawOrdinal)||drawOrdinal<0||drawOrdinal>1e9||
     !Number.isInteger(seed))throw new Error('Invalid synthetic virtual pool draw');
  const cycle=Math.floor(drawOrdinal/n),pos=drawOrdinal%n;
  const tierNo=tier.charCodeAt(0)-65;
  const mix=hash32((seed^Math.imul(tierNo+1,0x9e3779b1)^
    Math.imul(cycle+1,0x85ebca6b))>>>0);
  const start=mix%n;
  let stride=(hash32(mix^0x51ed270b)%(n-1))+1;
  while(!coprime(stride,n))stride=(stride%n)+1;
  // A full coprime affine permutation consumes each identity exactly once.
  return {tier,slot:(start+pos*stride)%n,cycle,capacity:n};
}
export function virtualPoolBoardSeed(sessionSeed,tier,slot){
  const n=VIRTUAL_POOL_COUNTS[tier];
  if(!n||!Number.isInteger(slot)||slot<0||slot>=n)throw new Error('Invalid virtual slot');
  const tierNo=tier.charCodeAt(0)-65;
  return hash32((sessionSeed ^ Math.imul(tierNo+1,0x27d4eb2d) ^
    Math.imul(slot+1,0x9e3779b1))>>>0)||1;
}
