import {ClassicGame,N,COLORS,countRemaining,target,groups,boardSignature,RECENT_BOARD_LIMIT} from './core.mjs';

export const SAVE_KEY='starry-classic-cleanroom-v1';
const VERSION=1;
const validUInt=v=>Number.isSafeInteger(v)&&v>=0;
function validBoard(board){
  return Array.isArray(board)&&board.length===N&&board.every(row=>Array.isArray(row)&&row.length===N&&row.every(c=>c===null||(Number.isInteger(c)&&c>=0&&c<COLORS.length)));
}
export function snapshot(game){
  const s=game.status();
  return {version:VERSION,kind:'independent-cleanroom-classic',
    savedAt:new Date().toISOString(),
    seed:game.seed,stage:game.stage,score:game.score,
    stageEntryScore:game.stageEntryScore,previousTarget:game.previousTarget,
    tierOverride:game.tierOverride??null,tier:game.tier,board:game.board.map(row=>row.slice()),
    recentBoardSignatures:[...game.recentBoardSignatures],
    turn:game.turn,phase:game.phase,revived:game.revived,rescued:game.rescued,
    twoTap:game.twoTap,debugSession:Boolean(game.debugSession),
    certifiedOpening:Boolean(game.certifiedOpening),certifiedBoards:Boolean(game.certifiedBoards),props:{...game.props},
    lastSettlement:game.lastSettlement?{...game.lastSettlement}:null};
}
export function restore(data){
  if(!data||data.version!==VERSION||data.kind!=='independent-cleanroom-classic')
    throw new Error('Unknown save version');
  if(!validUInt(data.seed)||data.seed<1||data.seed>0xffffffff||!validUInt(data.stage)||data.stage<1||data.stage>9999||
    !validUInt(data.score)||!validUInt(data.stageEntryScore)||data.stageEntryScore>data.score||
    !validUInt(data.turn)||!validBoard(data.board))
    throw new Error('Invalid saved board or score');
  if(!['ready','rescue','failure','pass','ended'].includes(data.phase))throw new Error('Unsupported save state');
  if(!data.props||!['hammer','refresh','crayon'].every(k=>validUInt(data.props[k])&&data.props[k]<=100))
    throw new Error('Invalid prop inventory');
  if(data.tierOverride!==null&&data.tierOverride!==undefined&&
    !['A','B','C','D','E','F','G','H','I'].includes(data.tierOverride))throw new Error('Invalid tier');
  // Optional field is backward compatible with V1 saves made before deduplication.
  // A signature is 100 independent 0-4 color indices, never an original BoardLib ID.
  if(data.recentBoardSignatures!==undefined &&
    (!Array.isArray(data.recentBoardSignatures)||data.recentBoardSignatures.length>RECENT_BOARD_LIMIT||
     !data.recentBoardSignatures.every(s=>typeof s==='string'&&/^[0-4_]{100}$/.test(s))))
    throw new Error('Invalid recent board signatures');
  // Board content is independent synthetic state, never the original APK data.
  const game=new ClassicGame({seed:data.seed,stage:data.stage,score:data.score,
    board:data.board,twoTap:Boolean(data.twoTap),tierOverride:data.tierOverride??null,
    certifiedBoards:data.certifiedBoards===true});
  game.stageEntryScore=data.stageEntryScore;
  game.previousTarget=Number.isSafeInteger(data.previousTarget)&&data.previousTarget>=0?
    data.previousTarget:(target(game.stage-1)||0);
  game.turn=data.turn;game.phase=data.phase;game.revived=Boolean(data.revived);
  game.rescued=Boolean(data.rescued);game.props={...data.props};
  game.recentBoardSignatures=data.recentBoardSignatures?.length?
    [...data.recentBoardSignatures]:[boardSignature(game.board)];
  // Reconstructing with a forced board is only for restoring the exact
  // user state: it must not recategorize the generated A-I difficulty tier
  // as "debug" or make saved games falsely appear manually injected.
  const legalTiers=['A','B','C','D','E','F','G','H','I'];
  game.tier=legalTiers.includes(data.tier)?data.tier:
    (legalTiers.includes(data.tierOverride)?data.tierOverride:'saved');
  game.boardOrigin='CLEAN_ROOM_SAVED_SESSION';
  game.debugSession=data.debugSession===true;
  // Backward-compatible optional proof provenance. Never infer a proof for
  // legacy/mutated saves, even if their color layout appears playable.
  game.certifiedOpening=data.certifiedOpening===true&&game.phase==='ready';
  if(data.lastSettlement){
    const x=data.lastSettlement;
    if(!validUInt(x.remain)||x.remain>100||!validUInt(x.bonus)||x.bonus>2000)
      throw new Error('Invalid saved settlement');
    game.lastSettlement={remain:x.remain,bonus:x.bonus,outcome:String(x.outcome||data.phase),debug:Boolean(x.debug)};
  }
  if(game.phase==='ready'&&!groups(game.board).length)
    throw new Error('Ready state has no available moves');
  return game;
}
export function saveToStorage(game,storage){
  const value=JSON.stringify(snapshot(game));
  if(value.length>18000)throw new Error('Unexpected save size');
  storage.setItem(SAVE_KEY,value);
  return true;
}
export function loadFromStorage(storage){
  try{
    const str=storage.getItem(SAVE_KEY);
    if(!str)return null;
    if(str.length>18000)throw new Error('Save too large');
    return restore(JSON.parse(str));
  }catch{return null;}
}
export function clearStorage(storage){storage.removeItem(SAVE_KEY);}

export const RECORD_KEY='starry-classic-cleanroom-highscore-v1';
export function getLocalRecord(storage){
  try{
    const n=Number(storage.getItem(RECORD_KEY));
    return validUInt(n)?n:0;
  }catch{return 0;}
}
export function updateLocalRecord(score,storage){
  if(!validUInt(score))return 0;
  const existing=getLocalRecord(storage),best=Math.max(existing,score);
  try{storage.setItem(RECORD_KEY,String(best));}catch{}
  return best;
}
