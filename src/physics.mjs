/**
 * Classic H5 source-parameter-inspired physics, authored independently.
 *
 * Original current APK mechanics recovered from source:
 *  FPS = 50, gravity velocity +=50 per update, clamp 2250 px/s,
 *  vertical delta = velocity * dt / 1.2;
 *  horizontal compression reduces |deltaX| by 45 * dt per update.
 *
 * Real browsers render with variable rAF dt. This integrator scales 50/tick
 * into dt and uses an exponential horizontal ratio with the same 20ms result,
 * avoiding different motion at 60/120Hz. Source parameters are factual,
 * this browser discretization/contact bounce is clean-room approximation.
 */
export const ORIGINAL_FPS=50;
export const ORIGINAL_DT=1/ORIGINAL_FPS;
export const ORIGINAL_ACCEL_PER_TICK=50;
export const ORIGINAL_VELOCITY_CAP=2250;
export const ORIGINAL_HORIZONTAL_FACTOR=45;
const decayRate=-Math.log(1-ORIGINAL_HORIZONTAL_FACTOR*ORIGINAL_DT)/ORIGINAL_DT;

export function makePieceMotion(dx,dy){
  if(!Number.isFinite(dx)||!Number.isFinite(dy)||dy<0)
    throw new RangeError('Expected finite forward/downward piece displacement');
  return {x:0,y:0,v:0,targetX:dx,targetY:dy,landed:dy===0,done:dx===0&&dy===0,
    elapsed:0,contactElapsed:0};
}
export function stepPieceMotion(s,dt){
  if(s.done)return s;
  const step=Math.max(0,Math.min(dt,.05));
  s.elapsed+=step;
  if(!s.landed){
    s.v=Math.min(ORIGINAL_VELOCITY_CAP,s.v+ORIGINAL_ACCEL_PER_TICK*(step/ORIGINAL_DT));
    s.y=Math.min(s.targetY,s.y+s.v*step/1.2);
    if(s.y>=s.targetY-.015){
      s.y=s.targetY;s.landed=true;s.contactElapsed=0;
    }
  }else{
    s.contactElapsed+=step;
    // Same original source horizontal fraction at exactly 1/FPS (90%).
    s.x+=(s.targetX-s.x)*(1-Math.exp(-decayRate*step));
    if(Math.abs(s.targetX-s.x)<.12)s.x=s.targetX;
  }
  if(s.landed&&s.x===s.targetX)s.done=true;
  return s;
}
export function simulatePiece(dx,dy,{step=ORIGINAL_DT,maxSeconds=5}={}){
  const s=makePieceMotion(dx,dy),trace=[{t:0,x:0,y:0,v:0}];
  const n=Math.ceil(maxSeconds/step);
  for(let i=0;i<n&&!s.done;i++){
    stepPieceMotion(s,step);
    trace.push({t:+((i+1)*step).toFixed(4),x:s.x,y:s.y,v:s.v});
  }
  return {state:s,trace};
}
