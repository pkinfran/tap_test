import {clearChoreography} from './motion.mjs';
import {makePieceMotion,stepPieceMotion} from './physics.mjs';

/**
 * Standalone, non-obscuring Classic clear choreography.
 * No opaque/translucent sheet, screen tint, or entire-board fade.
 * Pieces that must move are rendered as compositor-animated ghosts until
 * their new logical positions become visible together at real board settle.
 * Artwork and effects are independently authored for this H5 recreation.
 */
export function beginClearEffect(board,result,motion,{
  reducedMotion=false,onPop=()=>{},onLand=()=>{},onDone=()=>{}
}={}){
  const timing=clearChoreography(result.removed.length,motion,{reducedMotion});
  const timers=[],animations=[],sources=[];
  let physicsFrame=0,pollFrame=0;let physicsPlaying=false;let physicsFinished=false;
  let landSoundFired=false;
  const layer=document.createElement('div');
  layer.className='fx-layer';layer.dataset.testid='clear-effects';
  layer.setAttribute('aria-hidden','true');
  const boardRect=board.getBoundingClientRect();
  // Keep all 100 original board cells intact; only visually hide moved pieces.
  const lookup=(r,c)=>board.querySelector(':scope > [data-row="'+r+'"][data-col="'+c+'"]');
  const oldRects=new Map();
  const lookupRect=(r,c)=>{
    const key=r*10+c;
    if(!oldRects.has(key)){
      const el=lookup(r,c);
      if(el)oldRects.set(key,el.getBoundingClientRect());
    }
    return oldRects.get(key);
  };
  const oldPositions=new Map();
  const removed=result.removed.map((p,i)=>({...p,delay:timing.delays[i]}));
  const activeKeys=new Set(removed.map(({row,col})=>row*10+col));
  const moving=motion.placements.filter(p=>p.dropRows||p.shiftCols);
  for(const p of moving)activeKeys.add(p.sourceRow*10+p.sourceCol);

  for(const key of activeKeys){
    const r=Math.floor(key/10),c=key%10;
    const el=lookup(r,c),rect=lookupRect(r,c);
    if(!el||!rect)continue;
    const ghost=el.cloneNode(true);
    ghost.removeAttribute('id');ghost.removeAttribute('data-testid');
    ghost.removeAttribute('role');ghost.setAttribute('aria-hidden','true');
    // Pointer-events none + tabIndex -1; disabled would trigger global opacity:.5
    // and make surviving tiles look like an unwanted gray veil.
    ghost.disabled=false;ghost.tabIndex=-1;
    ghost.classList.remove('selected','disappear');
    ghost.classList.add('fx-tile');
    ghost.style.left=(rect.left-boardRect.left)+'px';
    ghost.style.top=(rect.top-boardRect.top)+'px';
    ghost.style.width=rect.width+'px';ghost.style.height=rect.height+'px';
    ghost.style.margin='0';
    layer.append(ghost);
    oldPositions.set(key,{el,ghost,rect});
  }
  board.append(layer);
  for(const {el} of oldPositions.values()){
    sources.push(el);el.style.visibility='hidden';
  }
  let cancelled=false;
  function schedule(fn,delay){
    const t=setTimeout(()=>{if(!cancelled)fn();},delay);timers.push(t);
  }
  function play(el,keyframes,options){
    if(!el||typeof el.animate!=='function')return;
    const animation=el.animate(keyframes,{fill:'forwards',...options});
    animations.push(animation);
  }
  function shardBurst(p,rect){
    if(reducedMotion||!rect)return;
    const centerX=rect.left-boardRect.left+rect.width/2;
    const centerY=rect.top-boardRect.top+rect.height/2;
    // Deliberately subtle, local sparks; no fullscreen flash or mask.
    const colors={red:'#ff8bab',green:'#9fff80',blue:'#a3eaff',
      orange:'#ffe78a',violet:'#dbb7ff'};
    const colorName=['red','green','blue','orange','violet'][p.color]||'blue';
    const amount=4;
    for(let i=0;i<amount;i++){
      const chip=document.createElement('span');
      chip.className='fx-shard';
      const angle=(i*2.39996)+(p.row*1.1+p.col*.3);
      const distance=rect.width*(.35+(i%3)*.15);
      chip.style.left=centerX+'px';chip.style.top=centerY+'px';
      chip.style.backgroundColor=colors[colorName];
      layer.append(chip);
      play(chip,[
        {transform:'translate3d(-50%,-50%,0) scale(.3) rotate(0deg)',opacity:.95},
        {transform:'translate3d(calc(-50% + '+Math.cos(angle)*distance+'px),calc(-50% + '+Math.sin(angle)*distance+'px),0) scale(.18) rotate('+(75+i*48)+'deg)',opacity:0}
      ],{duration:310+i*30,easing:'cubic-bezier(.08,.65,.39,1)'});
      schedule(()=>chip.remove(),470);
    }
  }
  function tinyPoints(p,index,rect){
    if(reducedMotion||!rect)return;
    const n=removed.length;
    if(n>14&&index%3!==0)return;
    if(n>8&&index%2!==0)return;
    const score=document.createElement('span');
    score.className='fx-point';
    score.textContent='+'+(5*(2*index+1));
    score.style.left=(rect.left-boardRect.left+rect.width/2)+'px';
    score.style.top=(rect.top-boardRect.top+rect.height*.2)+'px';
    layer.append(score);
    play(score,[
      {transform:'translate3d(-50%,4px,0) scale(.72)',opacity:0,offset:0},
      {transform:'translate3d(-50%,-7px,0) scale(1.06)',opacity:.94,offset:.22},
      {transform:'translate3d(-50%,-28px,0) scale(.9)',opacity:0,offset:1}
    ],{duration:630,easing:'cubic-bezier(.16,.64,.28,1)'});
    schedule(()=>score.remove(),690);
  }
  for(const p of removed){
    const entry=oldPositions.get(p.row*10+p.col);
    if(!entry)continue;
    schedule(()=>{
      onPop(p);
      tinyPoints(p,removed.indexOf(p),entry.rect);
      if(!reducedMotion){
        play(entry.ghost,[
          {transform:'translate3d(0,0,0) scale(1)',opacity:1,offset:0},
          {transform:'translate3d(0,-2px,0) scale(1.12)',opacity:1,offset:.24},
          {transform:'translate3d(0,-5px,0) scale(.25) rotate(28deg)',opacity:0,offset:1}
        ],{duration:timing.burstMs,easing:'cubic-bezier(.23,.7,.28,1)'});
        shardBurst(p,entry.rect);
      }else{
        entry.ghost.style.opacity='0';
      }
      schedule(()=>entry.ghost.remove(),timing.burstMs+15);
    },p.delay);
  }
  function fireLandOnce(){
    if(!landSoundFired&&!cancelled){landSoundFired=true;onLand();}
  }
  // One shared high-resolution motion clock updates every piece independently.
  // Unlike WAAPI equal-duration tracks this uses the source-recovered
  // 50Hz acceleration, 2250 speed cap, and distance-proportional left closure.
  const tracks=[];
  for(const p of moving){
    const source=oldPositions.get(p.sourceRow*10+p.sourceCol);
    const destination=lookupRect(p.toRow,p.toCol);
    if(!source||!destination)continue;
    const dx=destination.left-source.rect.left,dy=destination.top-source.rect.top;
    const startOffset=p.dropRows>0
      ?Math.min(75,Math.max(0,(9-p.sourceRow)*7+(p.sourceCol%3)*5))
      :0;
    tracks.push({ghost:source.ghost,state:makePieceMotion(dx,Math.max(0,dy)),
      delayMs:startOffset,started:false,done:false,contactAt:null});
  }
  schedule(()=>{
    if(reducedMotion){
      for(const track of tracks){
        const s=track.state;
        track.ghost.style.transform='translate3d('+s.targetX+'px,'+s.targetY+'px,0)';
      }
      if(tracks.some(t=>t.state.targetY>0))fireLandOnce();
      physicsFinished=true;
      return;
    }
    physicsPlaying=true;
    let oldStamp=null,elapsedMs=0;
    function tick(stamp){
      if(cancelled)return;
      // Play the 50Hz-derived motion with modest visual time dilation: the
      // unscaled integrator remains tested independently; actual rAF carries
      // the smooth motion, without WAAPI/cell position jumps or a board mask.
      const dt=oldStamp===null?1/60:Math.min(.05,Math.max(0,(stamp-oldStamp)/1000));
      oldStamp=stamp;elapsedMs+=dt*1000;
      let complete=0;
      for(const track of tracks){
        if(elapsedMs<track.delayMs)continue;
        track.started=true;
        const wasLanded=track.state.landed;
        const s=stepPieceMotion(track.state,dt*.84);
        if(!wasLanded&&s.landed&&s.targetY>0)fireLandOnce();
        if(s.done)complete++;
        const isContact=s.landed&&s.contactElapsed<.14&&s.targetY>0;
        const compression=isContact?Math.sin(s.contactElapsed/.14*Math.PI)*.068:0;
        track.ghost.style.transform='translate3d('+
          s.x.toFixed(2)+'px,'+s.y.toFixed(2)+'px,0) scale('+
          (1+compression).toFixed(3)+','+(1-compression*.8).toFixed(3)+')';
      }
      // Nothing can remain flying indefinitely in a suspended tab.
      if(complete<tracks.length&&elapsedMs<3500)
        physicsFrame=requestAnimationFrame(tick);
      else{physicsFinished=true;physicsPlaying=false;physicsFrame=0;}
    }
    if(!tracks.length){physicsFinished=true;physicsPlaying=false;}
    else physicsFrame=requestAnimationFrame(tick);
  },timing.fallStartMs);
  schedule(()=>{
    if(cancelled)return;
    if(!physicsFinished&&tracks.length){
      // Let actual falling finish instead of snapping the board at budget end.
      const deadline=performance.now()+2400;
      const poll=()=>{
        if(cancelled)return;
        if(physicsFinished||performance.now()>=deadline)onDone();
        else pollFrame=requestAnimationFrame(poll);
      };
      poll();
    }else onDone();
  },timing.totalMs);
  return {
    ...timing,
    get active(){return !cancelled;},
    cancel(){
      if(cancelled)return;
      cancelled=true;
      for(const t of timers)clearTimeout(t);
      if(physicsFrame)cancelAnimationFrame(physicsFrame);
      if(pollFrame)cancelAnimationFrame(pollFrame);
      physicsPlaying=false;
      for(const a of animations)a.cancel();
      for(const el of sources)el.style.visibility='';
      layer.remove();
    }
  };
}

/**
 * Independent visual-only refresh sequence. Matches every colored tile to a
 * new same-colored destination, never modifies the model and never paints a
 * translucent board-wide mask. Refresh gameplay validity is in core.mjs.
 */
export function beginRefreshEffect(board,before,after,{reducedMotion=false,onDone=()=>{}}={}){
  const timers=[],animations=[],sources=[];
  const layer=document.createElement('div');layer.className='fx-layer fx-refresh-layer';
  layer.dataset.testid='refresh-effects';layer.setAttribute('aria-hidden','true');
  const boardRect=board.getBoundingClientRect();
  const oldByColor=[[],[],[],[],[]],targetByColor=[[],[],[],[],[]];
  for(let r=0;r<10;r++)for(let c=0;c<10;c++){
    if(before[r][c]!==null)oldByColor[before[r][c]].push({r,c});
    if(after[r][c]!==null)targetByColor[after[r][c]].push({r,c});
  }
  let cancelled=false;
  const getCell=(r,c)=>board.querySelector(':scope > [data-row="'+r+'"][data-col="'+c+'"]');
  board.append(layer);
  const movements=[];
  for(let color=0;color<5;color++){
    // Greedy distance pairing is an animation-only approximation, not
    // original APK's random reshuffle algorithm or copyrighted artwork.
    const remaining=[...targetByColor[color]];
    for(const src of oldByColor[color]){
      const cell=getCell(src.r,src.c);if(!cell)continue;
      const rect=cell.getBoundingClientRect();
      const ghost=cell.cloneNode(true);ghost.removeAttribute('data-testid');
      ghost.removeAttribute('role');ghost.tabIndex=-1;ghost.classList.add('fx-tile');
      ghost.style.left=(rect.left-boardRect.left)+'px';ghost.style.top=(rect.top-boardRect.top)+'px';
      ghost.style.width=rect.width+'px';ghost.style.height=rect.height+'px';
      ghost.style.margin='0';layer.append(ghost);sources.push(cell);cell.style.visibility='hidden';
      let candidate=-1,best=Infinity;
      for(let i=0;i<remaining.length;i++){
        const p=remaining[i],cost=(src.r-p.r)**2+(src.c-p.c)**2;
        if(cost<best){best=cost;candidate=i;}
      }
      if(candidate<0){ghost.style.opacity='0';continue;}
      const dst=remaining.splice(candidate,1)[0],dest=getCell(dst.r,dst.c).getBoundingClientRect();
      movements.push({ghost,dx:dest.left-rect.left,dy:dest.top-rect.top,from:src});
    }
  }
  const delay=130,duration=reducedMotion?40:470;
  const timer=setTimeout(()=>{
    if(cancelled)return;
    for(const m of movements){
      if(reducedMotion){m.ghost.style.transform='translate3d('+m.dx+'px,'+m.dy+'px,0)';continue;}
      const a=m.ghost.animate([
        {transform:'translate3d(0,0,0) rotate(0deg) scale(1)',opacity:1},
        {transform:'translate3d('+(m.dx*.72)+'px,'+(m.dy*.72)+'px,0) rotate('+(m.from.c%2?6:-6)+'deg) scale(.9)',opacity:.92,offset:.7},
        {transform:'translate3d('+m.dx+'px,'+m.dy+'px,0) rotate(0deg) scale(1)',opacity:1}
      ],{duration,easing:'cubic-bezier(.19,.6,.2,1)',fill:'forwards'});
      animations.push(a);
    }
  },delay);timers.push(timer);
  timers.push(setTimeout(()=>{if(!cancelled)onDone();},delay+duration+30));
  return {durationMs:delay+duration+30,moved:movements.length,
    cancel(){
      if(cancelled)return;
      cancelled=true;for(const t of timers)clearTimeout(t);
      for(const a of animations)a.cancel();
      for(const source of sources)source.style.visibility='';
      layer.remove();
    }};
}
