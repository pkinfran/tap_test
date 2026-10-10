/**
 * Conditional original Classic parachute *research gate*.
 * No ads, currency, accounts, or rewarded item fulfillment.
 * The exact stage/account eligibility remains product-specific; this model
 * covers only recovered parameters, not a claim of complete APK parity.
 */
export const APPEARANCE_PROBABILITY=.4;
export const REWARD_WEIGHTS={scoreBuff:20,endBuff:20,currency:60};
export const DAILY_CAPS={scoreBuff:5,endBuff:5,currency:3};
export function parachuteCheck({
  stage,calm=false,alreadyChecked=false,activeMatchingBuff=false,
  rolls={appearance:1,reward:0},claimedToday={}
}={}){
  if(!Number.isInteger(stage)||stage<2)return {eligible:false,reason:'stage'};
  if(!calm)return {eligible:false,reason:'board-moving'};
  if(alreadyChecked)return {eligible:false,reason:'stage-already-checked'};
  if(activeMatchingBuff)return {eligible:false,reason:'active-buff'};
  if(!(rolls.appearance>=0&&rolls.appearance<APPEARANCE_PROBABILITY))
    return {eligible:true,appears:false};
  const types=Object.keys(REWARD_WEIGHTS).filter(t=>
    (claimedToday[t]||0)<DAILY_CAPS[t]);
  if(!types.length)return {eligible:true,appears:false,reason:'daily-caps'};
  const total=types.reduce((a,t)=>a+REWARD_WEIGHTS[t],0);
  let x=Math.max(0,Math.min(.9999999,rolls.reward))*total;
  let item=types.at(-1);
  for(const t of types){x-=REWARD_WEIGHTS[t];if(x<0){item=t;break;}}
  return {eligible:true,appears:true,kind:item,
    testOnly:true,entitlement:'NO_ACTUAL_REWARD_OR_AD'};
}
