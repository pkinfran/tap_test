/** Classic feedback envelope; behavior verified, synthesis is ORIGINAL. */
export const CHEER_THRESHOLDS=[[14,'帅呆了!'],[11,'太棒了!'],[8,'酷!'],[6,'好!']];
export function cheerFor(n){
  return CHEER_THRESHOLDS.find(([min])=>n>=min)?.[1]||null;
}
export function sfxTier(n){return n>=20?20:n>=10?10:n>=5?5:0;}
export function popAudioAllowed(now,lastAt,windowMs=100){
  return Number.isFinite(now)&&now-lastAt>=windowMs;
}

// APK updates its HUD toward the target by 0.04 per ~20ms game tick.
 // Use an equivalent elapsed-time exponential factor in the H5 display:
 // 50/60/120Hz screens then chase at the same real-time speed.
export function scoreChaseStep(shown,target,elapsedMs=20){
  const delta=target-shown;
  if(Math.abs(delta)<.7)return target;
  const dt=Math.max(0,Math.min(100,Number.isFinite(elapsedMs)?elapsedMs:20));
  const fraction=dt===20 ? 0.04 : 1-Math.pow(.96,dt/20);
  const amount=Math.max(Math.abs(delta)*fraction,.05*dt/20);
  const next=shown+Math.sign(delta)*amount;
  return delta>0?Math.min(next,target):Math.max(next,target);
}


// Original independent melody in a calm pentatonic scale, generated at runtime.
// No APK music transcription, samples, downloaded files or external libraries.
export const MUSIC_STEPS=[62,65,69,72,69,65,64,67,69,74,69,67,62,64,65,69,
  67,69,72,76,72,69,65,67,69,65,64,62,57,62,64,65];
export function musicFrequency(step){
  return 440*Math.pow(2,(MUSIC_STEPS[((step%MUSIC_STEPS.length)+MUSIC_STEPS.length)%MUSIC_STEPS.length]-69)/12);
}
/** Independent layered SFX and optional ORIGINAL background melody. */
export class SyntheticClassicAudio{
  constructor({now=()=>performance.now()}={}){this.enabled=false;this.context=null;
    this.now=now;this.lastPopAt=-Infinity;this.lastLandAt=-Infinity;
    this.musicEnabled=false;this.musicPaused=false;this.musicTimer=null;
    this.musicBus=null;this.musicStep=0;this.musicNext=0;}
  setEnabled(value){
    const enabled=Boolean(value);
    if(enabled&&!this.enabled){this.lastPopAt=-Infinity;this.lastLandAt=-Infinity;}
    this.enabled=enabled;
  }
  _ctx(){
    if(!this.enabled&&!this.musicEnabled)return null;
    const Ctx=globalThis.AudioContext||globalThis.webkitAudioContext;
    if(!Ctx)return null;
    if(!this.context)this.context=new Ctx();
    if(this.context.state==='suspended')void this.context.resume();
    return this.context;
  }
  // Browser gesture is required before WebAudio can become audible.
  unlock(){
    const ctx=this._ctx();
    if(ctx&&this.musicEnabled&&!this.musicPaused){
      // A successful user gesture resumes browser-restricted audio and starts
      // the scheduler only after the AudioContext is actually running.
      void ctx.resume().then(()=>this._musicTick()).catch(()=>{});
    }
    return ctx;
  }
  setMusicEnabled(value){
    const enabled=Boolean(value);
    if(this.musicEnabled===enabled)return;
    this.musicEnabled=enabled;
    if(enabled&&!this.musicPaused){
      this.musicStep=0;this.musicNext=0;
      this._musicTick();
    }else this._stopMusic();
  }
  setMusicPaused(paused){
    this.musicPaused=Boolean(paused);
    if(this.musicPaused)this._stopMusic();
    else if(this.musicEnabled){
      this.musicNext=0;this._musicTick();
    }
  }
  _stopMusic(){
    if(this.musicTimer!==null){clearTimeout(this.musicTimer);this.musicTimer=null;}
    if(this.musicBus&&this.context){
      this.musicBus.gain.setTargetAtTime(0,this.context.currentTime,.025);
    }
  }
  _musicNote(ctx,frequency,at,duration,volume){
    const osc=ctx.createOscillator(),gain=ctx.createGain();
    osc.type='sine';osc.frequency.setValueAtTime(frequency,at);
    const start=Math.max(at,ctx.currentTime);
    gain.gain.setValueAtTime(.00001,start);
    gain.gain.linearRampToValueAtTime(volume,start+.055);
    gain.gain.exponentialRampToValueAtTime(.00001,start+duration);
    osc.connect(gain);gain.connect(this.musicBus);
    osc.start(start);osc.stop(start+duration+.025);
  }
  _musicTick(){
    if(!this.musicEnabled||this.musicPaused)return;
    const ctx=this._ctx();
    if(!ctx||ctx.state!=='running')return; // browser may block until a tap
    if(!this.musicBus){
      this.musicBus=ctx.createGain();
      this.musicBus.gain.value=0;
      this.musicBus.connect(ctx.destination);
    }
    this.musicBus.gain.setTargetAtTime(1,ctx.currentTime,.10);
    this.musicNext=Math.max(this.musicNext,ctx.currentTime+.035);
    // Schedule slightly ahead to avoid choppy notes on 60/120Hz devices.
    while(this.musicNext<ctx.currentTime+.4){
      const step=this.musicStep++;
      this._musicNote(ctx,musicFrequency(step),this.musicNext,.55,.012);
      if(step%4===0){
        const roots=[50,53,48,55];
        const root=roots[Math.floor(step/8)%roots.length];
        this._musicNote(ctx,440*Math.pow(2,(root-69)/12),this.musicNext,1.2,.006);
      }
      this.musicNext+=.375;
    }
    if(this.musicTimer!==null)clearTimeout(this.musicTimer);
    this.musicTimer=setTimeout(()=>{this.musicTimer=null;this._musicTick();},140);
  }
  tone({f0=800,f1=300,duration=.11,volume=.035,shape='sine',delay=0}={}){
    const ctx=this._ctx();if(!ctx)return;
    const now=ctx.currentTime+delay;
    const osc=ctx.createOscillator(),gain=ctx.createGain();
    osc.type=shape;osc.frequency.setValueAtTime(f0,now);
    osc.frequency.exponentialRampToValueAtTime(Math.max(25,f1),now+duration);
    gain.gain.setValueAtTime(.0001,now);
    gain.gain.exponentialRampToValueAtTime(volume,now+.009);
    gain.gain.exponentialRampToValueAtTime(.0001,now+duration);
    osc.connect(gain);gain.connect(ctx.destination);
    osc.start(now);osc.stop(now+duration+.016);
  }
  _noiseBuffer(ctx){
    if(this.noiseBuffer&&this.noiseBuffer.sampleRate===ctx.sampleRate)return this.noiseBuffer;
    const length=Math.round(ctx.sampleRate*.12);
    const buffer=ctx.createBuffer(1,length,ctx.sampleRate);
    const a=buffer.getChannelData(0);
    let seed=0x6e81b23;
    for(let i=0;i<a.length;i++){
      seed^=seed<<13;seed^=seed>>>17;seed^=seed<<5;
      a[i]=((seed>>>0)/2147483648-1)*Math.exp(-i/length*8);
    }
    this.noiseBuffer=buffer;return buffer;
  }
  _click({duration=.075,volume=.012,frequency=2000,delay=0}={}){
    const ctx=this._ctx();if(!ctx)return;
    const now=ctx.currentTime+delay;
    const src=ctx.createBufferSource(),filter=ctx.createBiquadFilter(),gain=ctx.createGain();
    src.buffer=this._noiseBuffer(ctx);filter.type='bandpass';filter.frequency.value=frequency;
    filter.Q.value=.8;
    gain.gain.setValueAtTime(.0001,now);
    gain.gain.exponentialRampToValueAtTime(volume,now+.006);
    gain.gain.exponentialRampToValueAtTime(.0001,now+duration);
    src.connect(filter);filter.connect(gain);gain.connect(ctx.destination);
    src.start(now);src.stop(now+duration+.002);
  }
  pop(n,index=0){
    if(!this.enabled)return;
    // Source ClassicGameAudioMgr deduplicates the same pending pop SoundId
    // for about 0.1s. Approximate that timing using an independent clock;
    // individual star shards and score increments continue at ~70ms.
    const now=this.now();
    if(!popAudioAllowed(now,this.lastPopAt))return;
    this.lastPopAt=now;
    // Layered original-synthesized sound, no extracted native recordings:
    // short per-block wood/glass transient plus descending chip tone.
    const volume=Math.max(.010,.026-Math.max(0,n-10)*.0005);
    this._click({frequency:1800+180*(index%3),volume:volume*.54,duration:.065});
    this.tone({f0:750+index*19,f1:275+index*11,
      duration:.087,volume,shape:'triangle'});
    const tier=sfxTier(n);
    if(tier&&index===0){
      this.tone({f0:470+15*tier,f1:900+19*tier,
        duration:.22,volume:.034,shape:'triangle',delay:.01});
    }
  }
  land(){
    if(!this.enabled)return;
    const now=this.now();
    if(!popAudioAllowed(now,this.lastLandAt,120))return;
    this.lastLandAt=now;
    this._click({frequency:440,volume:.011,duration:.12});
    this.tone({f0:186,f1:68,duration:.115,volume:.026,shape:'triangle'});
  }
  cheer(n){
    if(!cheerFor(n))return;
    this.tone({f0:440,f1:650,duration:.16,volume:.027,shape:'triangle'});
    this.tone({f0:660,f1:990,duration:.19,volume:.023,shape:'sine',delay:.13});
  }
  dispose(){this.setMusicEnabled(false);void this.context?.close();this.context=null;this.noiseBuffer=null;this.musicBus=null;}
}
