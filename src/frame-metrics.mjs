/**
 * Browser animation health diagnostic, not a claim of Android hardware FPS.
 * Main-thread rAF intervals include Playwright runner/CI scheduling overhead.
 */
export function frameStats(deltas){
  const samples=deltas.filter(ms=>Number.isFinite(ms)&&ms>0);
  if(!samples.length)return {frames:0,meanMs:null,p50Ms:null,p95Ms:null,longFrames:0};
  const ordered=[...samples].sort((a,b)=>a-b);
  const q=p=>ordered[Math.min(ordered.length-1,Math.floor((ordered.length-1)*p))];
  const mean=samples.reduce((a,b)=>a+b,0)/samples.length;
  return {frames:samples.length,meanMs:+mean.toFixed(2),p50Ms:+q(.5).toFixed(2),
    p95Ms:+q(.95).toFixed(2),longFrames:samples.filter(x=>x>50).length,
    estimatedFps:+(1000/mean).toFixed(1)};
}
