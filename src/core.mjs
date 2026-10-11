import {certifiedOpening} from './solvable.mjs';
import {ORIGINAL_LIBRARY_DISTRIBUTION,sourceQuantile} from './original-distribution.mjs';
import {emptyVirtualDrawCounts,virtualPoolSlot,virtualPoolBoardSeed} from './virtual-board-pool.mjs';
/**
 * Classic clean-room implementation core.
 *
 * Evidence boundary: 10x10 / 5-color 4-way groups / 5*n*n score /
 * residual bonus / cumulative targets are source-confirmed.
 * BoardLib is proprietary and NOT embedded here. The weighted synthetic
 * generator mimics relative difficulty but is explicitly NOT exact BoardLib.
 */
export const N=10;
export const COLORS=['red','green','blue','orange','violet'];
export const TARGETS=[0,1000,2500,4500,7000,9000,11500,13530,15590,17680,19800,21950,24130,26340,28580,30850,33150,35480,37840,40230,42650];
export const MAX_BONUS=2000;
export const GROUP_BASE_SCORE=5;
export const SOURCE_TIMING={fps:50,staggerMs:70,jumpMs:160,hintMs:5000};
/**
 * Target summary statistics measured from the ORIGINAL decoded 93,457-board
 * library. These scalar targets are used to generate entirely new boards,
 * not to reproduce or embed any original proprietary source records.
 */
export const LIBRARY_PROFILES={
  A:{maxGroup:8.59,removable:64.45,potential:1330.35,join:0.11,avoid:0},
  B:{maxGroup:7.20,removable:60.55,potential:1110.78,join:0.025,avoid:0},
  C:{maxGroup:7.06,removable:58.07,potential:1056.76,join:0.010,avoid:0.030},
  D:{maxGroup:6.38,removable:55.12,potential:941.25,join:0,avoid:0.080},
  E:{maxGroup:5.82,removable:51.66,potential:834.93,join:0,avoid:0.130},
  F:{maxGroup:5.00,removable:45.94,potential:677.32,join:0,avoid:0.220},
  G:{maxGroup:5.52,removable:56.97,potential:878.67,join:0,avoid:0.085},
  H:{maxGroup:4.33,removable:39.84,potential:547.12,join:0,avoid:0.330},
  I:{maxGroup:11.30,removable:68.14,potential:1693.49,join:0.175,avoid:0}
};
/** [DATA-SIMULATED] Fixed-largest-play means on ORIGINAL APK library samples.
 * Not an optimal-solver score; samples are capped at 300 per tier in source
 * study docs/BOARD_DIFFICULTY_QUANT.md. */
export const LIBRARY_LARGEST_FIRST={
  A:{clearScore:1919.8,remaining:14.41,bonus:281.5},
  B:{clearScore:1686.1,remaining:16.99,bonus:150.1},
  C:{clearScore:1586.9,remaining:20.41,bonus:39.0},
  D:{clearScore:1463.7,remaining:22.85,bonus:27.5},
  E:{clearScore:1350.7,remaining:26.05,bonus:26.8},
  F:{clearScore:1139.8,remaining:31.69,bonus:5.5},
  G:{clearScore:1467.2,remaining:17.96,bonus:154.1},
  H:{clearScore:915.1,remaining:40.55,bonus:0},
  I:{clearScore:2330.2,remaining:11.67,bonus:338.6}
};
export const BOARD_MODEL='CLEAN_ROOM_SYNTHETIC_NOT_ORIGINAL_BOARDLIB';
export const clone=b=>b.map(row=>[...row]);
export const emptyBoard=()=>Array.from({length:N},()=>Array(N).fill(null));
export function rng32(seed=1){
  let s=(Number(seed)>>>0)||0x6d2b79f5;
  return ()=>{s^=s<<13;s^=s>>>17;s^=s<<5;return (s>>>0)/4294967296;};
}
export function randomInt(rng,n){return Math.floor(rng()*n);}
export function target(stage){
  if(stage>=1&&stage<TARGETS.length)return TARGETS[stage];
  if(stage>=10&&stage<=79){
    // Verified quadratic cumulative target formula from original disassembly:
    // stage 10 target 19800, per-stage increment 2120 + 30*(stage-10).
    const n=stage-10;
    return 19800+2120*n+15*n*(n+1);
  }
  if(stage>=80)return 238530+(stage-79)*3000;
  return null;
}
export function weightsFor({stage=1,overScore=0,revive=false}={}){
  if(revive)return {A:50,B:50};
  if(stage<=6)return {A:5,B:70,C:25}; // Clean-room provisional selection only.
  if(overScore<=100)return {A:5,B:70,C:25};
  if(overScore<=250)return {B:20,C:75,D:5};
  if(overScore<=400)return {C:50,D:40,E:10};
  if(overScore<=800)return {B:5,C:30,D:50,E:15};
  if(overScore<=1000)return {B:5,D:50,E:20,F:19,G:1};
  if(overScore<=1200)return {B:2,D:22,E:46,F:30};
  return {B:2,C:5,E:43,F:48,H:2};
}
export function weightedPick(weights,rng){
  const entries=Object.entries(weights);
  const total=entries.reduce((v,[,w])=>v+w,0);
  let p=rng()*total;
  for(const [key,weight] of entries){p-=weight;if(p<0)return key;}
  return entries.at(-1)[0];
}
export function groupAt(board,row,col){
  if(!Number.isInteger(row)||!Number.isInteger(col)||row<0||row>=N||col<0||col>=N)return [];
  const wanted=board[row][col];if(wanted===null||wanted===undefined)return [];
  const seen=new Set([row*N+col]);const stack=[[row,col]],out=[];
  while(stack.length){
    const [r,c]=stack.pop();out.push([r,c]);
    for(const [dr,dc] of [[-1,0],[1,0],[0,-1],[0,1]]){
      const rr=r+dr,cc=c+dc,idx=rr*N+cc;
      if(rr>=0&&rr<N&&cc>=0&&cc<N&&!seen.has(idx)&&board[rr][cc]===wanted){
        seen.add(idx);stack.push([rr,cc]);
      }
    }
  }
  return out;
}
export function groups(board){
  const visited=new Set(),found=[];
  for(let r=0;r<N;r++)for(let c=0;c<N;c++){
    if(board[r][c]===null||visited.has(r*N+c))continue;
    const g=groupAt(board,r,c);
    for(const [rr,cc] of g)visited.add(rr*N+cc);
    if(g.length>=2)found.push(g);
  }
  return found;
}
export function countRemaining(board){
  let total=0;for(const row of board)for(const cell of row)if(cell!==null)total++;
  return total;
}
export function bonus(remaining){return Math.max(0,MAX_BONUS-20*remaining*remaining);}
export function groupScore(n){return GROUP_BASE_SCORE*n*n;}
export function marginalScore(i){return GROUP_BASE_SCORE*(2*i+1);}
export function collapse(board){
  const cols=[];
  for(let c=0;c<N;c++){
    const keep=[];
    for(let r=N-1;r>=0;r--)if(board[r][c]!==null)keep.push(board[r][c]);
    if(keep.length)cols.push(keep);
  }
  const next=emptyBoard();
  for(let c=0;c<cols.length;c++)for(let i=0;i<cols[c].length;i++)next[N-1-i][c]=cols[c][i];
  return next;
}
export function removeCells(board,cells){
  const b=clone(board);
  for(const [r,c] of cells)b[r][c]=null;
  return collapse(b);
}
export function boardProfile(board){
  const found=groups(board);const removable=found.reduce((n,g)=>n+g.length,0);
  const maxGroup=found.reduce((n,g)=>Math.max(n,g.length),0);
  const potential=found.reduce((n,g)=>n+groupScore(g.length),0);
  return {maxGroup,removable,isolated:countRemaining(board)-removable,potential};
}
/** Same deterministic greedy baseline used in the original-board study.
 * Tie: first connected component in row-major scan order, not a solver. */
export function largestFirstOutcome(board){
  let b=clone(board),clearScore=0,moves=0;
  while(moves<50){
    const gg=groups(b);if(!gg.length)break;
    const chosen=gg.reduce((best,g)=>best===null||g.length>best.length?g:best,null);
    clearScore+=groupScore(chosen.length);
    b=removeCells(b,chosen);moves++;
  }
  const remaining=countRemaining(b);
  return {clearScore,remaining,bonus:bonus(remaining),
    totalScore:clearScore+bonus(remaining),moves};
}
function generateCandidate(rng,profile){
  const board=emptyBoard();
  for(let r=0;r<N;r++)for(let c=0;c<N;c++){
    const neighbors=[];
    if(c>0)neighbors.push(board[r][c-1]);
    if(r>0)neighbors.push(board[r-1][c]);
    let v=randomInt(rng,COLORS.length);
    if(neighbors.length&&rng()<profile.join){
      v=neighbors[randomInt(rng,neighbors.length)];
    }else if(neighbors.length&&rng()<profile.avoid){
      const allowed=[0,1,2,3,4].filter(color=>!neighbors.includes(color));
      if(allowed.length)v=allowed[randomInt(rng,allowed.length)];
    }
    board[r][c]=v;
  }
  return board;
}
/** Short-horizon identity for independently generated colored board layouts.
 * This is not the original APK's proprietary BoardLib ID. */
export function boardSignature(board){
  return board.map(row=>row.map(v=>v===null?'_':String(v)).join('')).join('');
}
export const RECENT_BOARD_LIMIT=8;

/** This samples original tier *distributional reference quantiles* rather than
 * forcing every candidate close to the tier's single mean. The marginals stay
 * uniform in percentile rank while the 50-65% shared rank induces realistic
 * positive max-group/potential and negative isolated correlation. Original
 * per-board records are never bundled. More precise original joint-bin fitting
 * remains a separate analysis gate. */
function sampledOriginalTarget(tier,rng){
  const src=ORIGINAL_LIBRARY_DISTRIBUTION[tier];
  const rank=rng();
  const isoRank=rng()<0.5?1-rank:rng();
  const potentialRank=rng()<0.65?rank:rng();
  const maxGroup=Math.round(sourceQuantile(src.opening.maxGroup,rank));
  const isolated=Math.round(sourceQuantile(src.opening.isolated,isoRank));
  const potential=Math.round(sourceQuantile(src.opening.potential,potentialRank));
  const largestFirst={
    clearScore:sourceQuantile(src.largestFirst.clearScore,potentialRank),
    remaining:sourceQuantile(src.largestFirst.remaining,1-potentialRank)
  };
  return {maxGroup,isolated,potential,largestFirst,
    sourcePercentiles:{rank:+rank.toFixed(5),isoRank:+isoRank.toFixed(5),
      potentialRank:+potentialRank.toFixed(5)}};
}

export function syntheticBoard({seed=1,stage=1,overScore=0,revive=false,tierOverride=null,avoidSignatures=[],guaranteed=false,
  virtualDrawCounts=null,virtualPoolSeed=seed}={}){
  let rng=rng32(seed);
  const weights=weightsFor({stage,overScore,revive});
  const tier=(tierOverride&&LIBRARY_PROFILES[tierOverride])?tierOverride:weightedPick(weights,rng),wanted=LIBRARY_PROFILES[tier];
  // Clean-room virtual slot identity: original selectors avoid reused BoardLib
  // entries until a tier is exhausted. The H5 reuses that rule but creates
  // independent layouts keyed by synthetic slots (no APK records).
  let selectedVirtualSlot=null;
  if(!guaranteed&&virtualDrawCounts!==null){
    const ordinal=virtualDrawCounts[tier]??0;
    selectedVirtualSlot=virtualPoolSlot(tier,ordinal,virtualPoolSeed);
    rng=rng32(virtualPoolBoardSeed(virtualPoolSeed,tier,selectedVirtualSlot.slot));
  }
  const source=ORIGINAL_LIBRARY_DISTRIBUTION[tier];
  const drawn=guaranteed?null:sampledOriginalTarget(tier,rng);
  const wantedOpening=drawn||{
    maxGroup:wanted.maxGroup,isolated:100-wanted.removable,potential:wanted.potential};
  // Adapt procedural raw candidates to the sampled source percentile. High
  // max-group / low-isolation target needs more joins; the opposite needs
  // more avoidance. This recovers source tails without shipping its records.
  const pressure=guaranteed?0:Math.max(-3,Math.min(3,
    0.7*(wantedOpening.maxGroup-source.opening.maxGroup.mean)/
       Math.max(1,source.opening.maxGroup.stdev)
    -0.45*(wantedOpening.isolated-source.opening.isolated.mean)/
       Math.max(1,source.opening.isolated.stdev)));
  const tuned={...wanted,join:Math.max(0,Math.min(0.5,wanted.join+0.023*pressure)),
    avoid:Math.max(0,Math.min(0.7,wanted.avoid-0.029*pressure))};
  const recent=new Set(Array.isArray(avoidSignatures)?avoidSignatures.slice(-RECENT_BOARD_LIMIT):[]);
  const candidates=[],duplicateCandidates=[];
  // Each opening draws an original-fitted distributional target; the
  // independent 10x10 color records are generated from scratch.
  const candidateCount=guaranteed?12:32;
  for(let i=0;i<candidateCount;i++){
    const generated=guaranteed?certifiedOpening(rng,tier):
      {board:generateCandidate(rng,tuned),witness:null};
    const stats=boardProfile(generated.board);
    if(!stats.maxGroup)continue;
    // The full original APK extraction also established coarse joint
    // max-group × isolated histograms. Discourage impossible bin pairs that
    // do not occur in any original record; still create independent layouts.
    const jointKey='max'+Math.min(Math.floor(stats.maxGroup/3),6)+
      ':iso'+Math.min(Math.floor(stats.isolated/10),9);
    const jointSupport=(source.jointHistogram3x10[jointKey]||0)>0;
    const boundaryPenalty=Math.max(0,source.opening.isolated.min-stats.isolated,
      stats.isolated-source.opening.isolated.max,
      source.opening.maxGroup.min-stats.maxGroup,
      stats.maxGroup-source.opening.maxGroup.max)*0.7;
    const structureCost=2*Math.abs(stats.maxGroup-wantedOpening.maxGroup)
      +Math.abs(stats.isolated-wantedOpening.isolated)*0.27
      +Math.abs(stats.potential-wantedOpening.potential)*0.008
      +(tier==='I'?0:((jointSupport?0:8)+boundaryPenalty)); // I has only 43 source records: never fit tiny joint bins as hard support
    const entry={generated,structureCost};
    (recent.has(boardSignature(generated.board))?duplicateCandidates:candidates).push(entry);
  }
  const available=candidates.length?candidates:duplicateCandidates;
  if(!available.length)throw new Error('No legal board candidates');
  available.sort((a,b)=>a.structureCost-b.structureCost);
  let selected=available[0].generated;
  if(!guaranteed){
    const reference=drawn.largestFirst;
    // Fit the source full-play *range* too; fitting each outcome to the old
    // single mean would once again remove exciting and unusually hard tails.
    // Strategy reference is sample-based and deliberately softly weighted.
    let cost=Infinity;
    // Prefer measured distributional opening shape over aggressive tail
    // fitting: I-tier original-p90 gate caught regression with 10/0.66.
    // Preserve the last original-distribution-CI verified weighting.
    for(const entry of available.slice(0,8)){
      const play=largestFirstOutcome(entry.generated.board);
      const score=entry.structureCost+
        Math.abs(play.remaining-reference.remaining)*0.24+
        Math.abs(play.clearScore-reference.clearScore)*0.0013;
      if(score<cost){cost=score;selected=entry.generated;}
    }
  }
  if(!guaranteed&&!groups(selected.board).length)selected.board[0][1]=selected.board[0][0];
  return {board:selected.board,tier,weights,seed,model:BOARD_MODEL,
    guaranteedOpening:guaranteed,witness:selected.witness,
    virtualPoolSlot:selectedVirtualSlot,
    distributionalTarget:drawn,
    profile:boardProfile(selected.board),targetProfile:{
      maxGroup:wanted.maxGroup,removable:wanted.removable,potential:wanted.potential
    }};
}
export class ClassicGame{
  constructor({seed=20261008,stage=1,score=0,board=null,twoTap=false,tierOverride=null,certifiedBoards=false}={}){
    this.certifiedBoards=certifiedBoards===true;
    this.seed=(Number(seed)>>>0)||1;this.stage=stage;this.score=score;
    this.stageEntryScore=score;this.previousTarget=target(stage-1)||0;
    this.actions=[];this.turn=0;this.twoTap=twoTap;this.selected=null;
    this.tierOverride=tierOverride;
    this.phase='ready';this.revived=false;this.rescued=false;this.message='';
    this.lastSettlement=null;
    this.debugSession=false; // only H5 developer force-end/pass marks a non-ranking session
    this.props={hammer:2,refresh:2,crayon:2};
    this.recentBoardSignatures=[];
    this.virtualPoolDrawCounts=emptyVirtualDrawCounts();
    this._generate(board);
  }
  _generate(forcedBoard=null){
    if(forcedBoard){this.board=clone(forcedBoard);this.tier='debug';this.boardOrigin='DEBUG_INJECTED';
      this.openingWitness=null;this.certifiedOpening=false;}
    else{
      const got=syntheticBoard({seed:this.seed+this.turn*2654435761,stage:this.stage,
        overScore:Math.max(0,this.score-this.previousTarget),revive:this.revived,
        tierOverride:this.tierOverride,avoidSignatures:this.recentBoardSignatures,
        guaranteed:this.certifiedBoards,
        virtualDrawCounts:this.virtualPoolDrawCounts,virtualPoolSeed:this.seed});
      if(got.virtualPoolSlot)
        this.virtualPoolDrawCounts[got.tier]++;
      this.board=got.board;this.tier=got.tier;this.boardOrigin=got.model;
      this.openingWitness=got.witness;this.certifiedOpening=got.guaranteedOpening;
    }
    const sig=boardSignature(this.board);
    this.recentBoardSignatures=[...this.recentBoardSignatures.slice(-(RECENT_BOARD_LIMIT-1)),sig];
    this.phase='ready';this.selected=null;this.lastSettlement=null;
  }
  _record(type,payload={}){this.actions.push({type,stage:this.stage,turn:this.turn,...payload});}
  status(){
    return {seed:this.seed,stage:this.stage,score:this.score,target:target(this.stage),
      stageEntryScore:this.stageEntryScore,phase:this.phase,tier:this.tier,boardOrigin:this.boardOrigin,
      remaining:countRemaining(this.board),legalGroups:groups(this.board).length,
      certifiedOpening:Boolean(this.certifiedOpening),props:{...this.props}};
  }
  choose(r,c){
    if(this.phase!=='ready')return {ok:false,reason:'locked'};
    const selected=groupAt(this.board,r,c);
    if(selected.length<2)return {ok:false,reason:'single',cells:selected};
    const key=selected.map(([a,b])=>a*N+b).sort((a,b)=>a-b).join(',');
    if(this.twoTap&&this.selected!==key){this.selected=key;return {ok:false,reason:'selected',cells:selected};}
    this.selected=null;return this.clear(selected);
  }
  clear(cells){
    if(this.phase!=='ready')return {ok:false,reason:'locked'};
    if(!Array.isArray(cells)||cells.length<2)return {ok:false,reason:'single'};
    // Public model entrypoints may be called by integrations and replay tools.
    // Reject forged/disconnected/duplicate coordinates rather than giving
    // points for colors the real user could never legitimately clear.
    if(!cells.every(p=>Array.isArray(p)&&p.length===2&&
      Number.isInteger(p[0])&&Number.isInteger(p[1])&&
      p[0]>=0&&p[0]<N&&p[1]>=0&&p[1]<N))
      return {ok:false,reason:'invalid-coordinates'};
    const canonical=groupAt(this.board,cells[0][0],cells[0][1]);
    const actual=new Set(cells.map(([r,c])=>r*N+c));
    if(canonical.length!==cells.length||actual.size!==cells.length||
      !canonical.every(([r,c])=>actual.has(r*N+c)))
      return {ok:false,reason:'invalid-group'};
    const before=clone(this.board),removed=cells.map(([r,c])=>({row:r,col:c,color:before[r][c]}));
    this.board=removeCells(before,cells);this.certifiedOpening=false;this.openingWitness=null;
    const gained=groupScore(cells.length);
    this.score+=gained;this.turn++;
    this._record('clear',{removed,gained});
    return this._afterMove({ok:true,kind:'clear',before,after:clone(this.board),removed,gained});
  }
  _afterMove(base){
    if(groups(this.board).length===0){
      const remain=countRemaining(this.board),earned=bonus(remain);
      this.score+=earned;
      this.phase=target(this.stage)!==null&&this.score>=target(this.stage)?'pass':'failure';
      if(this.phase==='failure'&&!this.rescued&&remain>12
        &&target(this.stage)!==null&&(target(this.stage)-this.score)<=800)
        this.phase='rescue';
      this.lastSettlement={remain,bonus:earned,outcome:this.phase};
      this._record('settlement',{remain,bonus:earned,outcome:this.phase});
      return {...base,settlement:{remain,bonus:earned,outcome:this.phase}};
    }
    return base;
  }
  hammer(r,c){
    if(this.phase!=='ready'||this.props.hammer<1||this.board[r]?.[c]===null||this.board[r]?.[c]===undefined)return {ok:false};
    const before=clone(this.board),removed=[{row:r,col:c,color:before[r][c]}];
    this.board=removeCells(before,[[r,c]]);this.certifiedOpening=false;this.openingWitness=null;
    this.props.hammer--;this.score+=5;this.turn++;
    this._record('hammer',{row:r,col:c});
    return this._afterMove({ok:true,kind:'hammer',before,after:clone(this.board),removed,gained:5});
  }
  refresh(){
    if(this.phase!=='ready'||this.props.refresh<1)return {ok:false};
    const b=clone(this.board);const values=b.flat().filter(v=>v!==null);
    const rng=rng32(this.seed+this.turn*1299721+997);
    for(let i=values.length-1;i>0;i--){const j=randomInt(rng,i+1);[values[i],values[j]]=[values[j],values[i]];}
    let p=0;for(let r=0;r<N;r++)for(let c=0;c<N;c++)if(b[r][c]!==null)b[r][c]=values[p++];
    if(!groups(b).length){
      // Preserve each color's inventory while guaranteeing at least one legal
      // pair whenever the remaining pool contains repeated colors.
      const occupied=[];
      for(let r=0;r<N;r++)for(let c=0;c<N;c++)if(b[r][c]!==null)occupied.push([r,c]);
      const adjacent=occupied.find(([r,c])=>(c+1<N&&b[r][c+1]!==null)||
        (r+1<N&&b[r+1][c]!==null));
      if(adjacent){
        const [r,c]=adjacent;
        const [nr,nc]=(c+1<N&&b[r][c+1]!==null)?[r,c+1]:[r+1,c];
        const peer=occupied.find(([rr,cc])=>b[rr][cc]===b[r][c]&&
          !(rr===r&&cc===c)&&!(rr===nr&&cc===nc));
        if(peer){
          const [pr,pc]=peer;
          [b[nr][nc],b[pr][pc]]=[b[pr][pc],b[nr][nc]];
        }
      }
    }
    this.board=b;this.certifiedOpening=false;this.openingWitness=null;this.selected=null;this.props.refresh--;this.turn++;this._record('refresh');
    return {ok:true,kind:'refresh',after:clone(this.board)};
  }
  crayon(r,c,color){
    if(this.phase!=='ready'||this.props.crayon<1||!Number.isInteger(color)||color<0||color>=COLORS.length
      ||this.board[r]?.[c]===null||this.board[r]?.[c]===undefined)return {ok:false};
    const old=this.board[r][c];this.board[r][c]=color;this.certifiedOpening=false;this.openingWitness=null;this.props.crayon--;this.turn++;
    this.selected=null;
    this._record('crayon',{row:r,col:c,old,color});
    // Painting the last matching pair can end a stage. Previously it left
    // phase=ready with zero legal moves, then save recovery rejected that state.
    return this._afterMove({ok:true,kind:'crayon',row:r,col:c,old,color});
  }
  revive(superRevive=false){
    if(this.phase!=='failure')return {ok:false,reason:'not-failed'};
    if(!superRevive)this.score=this.stageEntryScore;
    this.revived=true;this.turn++;this._record('revive',{superRevive,score:this.score});
    this._generate();return {ok:true,score:this.score,stage:this.stage};
  }
  rescue(){
    if(this.phase!=='rescue')return {ok:false};
    this.rescued=true;this.turn++;this._record('rescue');
    const existing=countRemaining(this.board);
    // The exact ORIGINAL refresh randomization is not reproduced.
    let next=emptyBoard(),rng=rng32(this.seed+this.turn*971);
    for(let i=0;i<existing;i++){const r=N-1-Math.floor(i/N),c=i%N;next[r][c]=randomInt(rng,5);}
    if(!groups(next).length&&existing>=2)next[N-1][1]=next[N-1][0];
    this.board=next;this.certifiedOpening=false;this.openingWitness=null;this.phase='ready';this.selected=null;this.lastSettlement=null;
    return {ok:true,remaining:existing};
  }
  rejectRescue(){if(this.phase!=='rescue')return false;this.phase='failure';if(this.lastSettlement)this.lastSettlement.outcome='failure';this._record('rejectRescue');return true;}
  advance(){
    if(this.phase!=='pass')return {ok:false};
    const from=this.stage;let next=from+1;
    while(target(next)!==null&&this.score>=target(next))next++;
    if(target(next)===null){this.phase='unsupported-stage';return {ok:false,reason:'target-unknown'};}
    this.previousTarget=target(next-1)||0;this.stage=next;this.stageEntryScore=this.score;
    this.revived=false;this.rescued=false;this.turn++;this._record('advance',{from,to:next});
    this._generate();return {ok:true,from,to:next};
  }
  abandon(){
    if(this.phase!=='failure')return {ok:false,reason:'not-failed'};
    this.phase='ended';this.selected=null;
    this._record('abandon',{score:this.score,stage:this.stage});
    return {ok:true,score:this.score,stage:this.stage};
  }
  debugForcePass(){
    if(this.phase!=='ready')return {ok:false};
    this.debugSession=true;
    const t=target(this.stage);
    if(t===null)return {ok:false,reason:'unknown-target'};
    this.score=Math.max(this.score,t);
    this.phase='pass';
    this.lastSettlement={remain:countRemaining(this.board),bonus:0,outcome:'pass',debug:true};
    this._record('debugForcePass',{phase:this.phase,target:t});
    return {ok:true,kind:'debugForcePass',outcome:this.phase};
  }
  debugForceEnd(){
    if(this.phase!=='ready')return {ok:false};
    this.debugSession=true;
    const r=countRemaining(this.board);
    this.board=emptyBoard();this.score+=bonus(r);this.phase=this.score>=target(this.stage)?'pass':'failure';
    this.lastSettlement={remain:r,bonus:bonus(r),outcome:this.phase,debug:true};
    this._record('debugForceEnd',{removed:r,phase:this.phase});
    return {ok:true,kind:'debugForceEnd',outcome:this.phase};
  }
}
