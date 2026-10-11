import {ClassicGame,N,COLORS,groups,countRemaining,groupAt,target,SOURCE_TIMING,clone,boardSignature} from './core.mjs';
import {evaluateBoard,ORIGINAL_LARGEST_FIRST} from './difficulty.mjs';
import {motionPlan} from './motion.mjs';
import {beginClearEffect,beginRefreshEffect} from './effects.mjs';
import {saveToStorage,loadFromStorage,clearStorage,getLocalRecord,updateLocalRecord} from './session.mjs';
import {scoreChaseStep,cheerFor,SyntheticClassicAudio} from './feedback.mjs';

const $=id=>document.getElementById(id);
const formats=n=>n===null?'待核实':Number(n).toLocaleString('zh-CN');
const modules={
 board:['M01','棋盘生成验证','10×10、五色、种子重放与连块结构；当前为原创合成棋盘，未使用原 APK 的 BoardLib 记录。'],
 touch:['M02','触控与消除验证','支持单击直接消除或首次选择、二次确认。对照原 APK 实机的4邻域连块和5n²规则。'],
 motion:['M03','消除与运动验证','以70ms逐颗销毁节拍表示事件；下落与左收列数据正确，物理曲线仍是视觉近似。'],
 hud:['M04','HUD 计分验证','显示跨关累计分、关卡目标、进度、分数飞字及状态反馈。'],
 props:['M05','道具交互验证','锤子单颗+5、刷新重排、蜡笔指定染色。用调试库存，未复现支付/广告流程。'],
 stage:['M06','关卡结果验证','清盘与无解结算；已恢复的累计目标曲线支持全关卡段，结算视觉仍在对照。'],
 revive:['M07','失败与复活验证','同关普通复活回退进入分，超级复活保留本关分。按钮为免费测试路径，不模拟原 APK 实际扣币。'],
 conditional:['M08','条件活动（待研究）','降落伞、神秘礼物等独立条件机制未启用，防止混入基础 Classic。'],
 integration:['M09','集成与回归验证','跨模块状态均在当前 H5 工程可重放；未通过原 APK 美术与动效 1:1 验收。']
};
let game;
let visual=null,clearMask=new Map(),toolMode=null,paintCell=null;
let currentEffect=null;
let generation=0,lastAction='等待操作',log=[];
let selectedModule='board';
let cachedDifficultySignature=null,cachedDifficultyMetrics=null;
let locked=false;
let visualScore=0,visualTargetScore=0,lastHudUpdate=0,hudFrame=0,lastHudFrameAt=null;
let hintTimer=null;
let activityPreviewTimer=null;
let pendingEndConfirm=false;
let cheerTimer=null;
const synthAudio=new SyntheticClassicAudio();
// First physical board interaction unlocks WebAudio under browser autoplay rules.
synthAudio.setEnabled(true);
function chaseScore(t){
  hudFrame=0;if(!game)return;
  const elapsedMs=lastHudFrameAt===null?20:Math.max(0,t-lastHudFrameAt);
  lastHudFrameAt=t;
  visualScore=scoreChaseStep(visualScore,visualTargetScore,elapsedMs);
  if(t-lastHudUpdate>100||visualScore===visualTargetScore){
    $('score-number').textContent=formats(Math.floor(visualScore));
    lastHudUpdate=t;
  }
  if(visualScore!==visualTargetScore)hudFrame=requestAnimationFrame(chaseScore);
  else lastHudFrameAt=null;
}
function triggerChase(){if(!hudFrame){lastHudFrameAt=null;hudFrame=requestAnimationFrame(chaseScore);}}
function hideCheer(){
  if(cheerTimer!==null){clearTimeout(cheerTimer);cheerTimer=null;}
  const el=$('cheer');
  el.hidden=true;el.classList.remove('show');
}
function showCheer(n){
  const text=cheerFor(n);if(!text)return;
  // Consecutive clears can produce overlapping encouragement. Cancel the
  // previous hide callback or it could hide a newer, larger cheer midway.
  hideCheer();
  const el=$('cheer');el.textContent=text;el.hidden=false;
  void el.offsetWidth;el.classList.add('show');
  synthAudio.cheer(n);
  cheerTimer=setTimeout(()=>{cheerTimer=null;hideCheer();},2750);
}


function switchScene(mode,{silent=false}={}){
  hideCheer();
  // Scene geometry and cell rectangles change between play/lab. Settle
  // the already-committed operation, including stage-enter timers, before
  // switching layout so no stale lock or orphaned animation survives.
  settlePresentationOnSuspend();
  const play=mode==='play';
  document.body.classList.toggle('mode-play',play);
  document.body.classList.toggle('mode-lab',!play);
  document.querySelector('.game-pane').classList.toggle('play-scene',play);
  document.querySelector('.game-pane').classList.toggle('original-scene',!play&&$('layout-mode').value==='original');
  $('scene-menu').hidden=true;
  $('scene-help-panel').hidden=true;
  $('scene-hall').hidden=true;
  synthAudio.setMusicPaused(document.hidden);
  document.title=play?'星夜消消 · H5 原创玩法复刻（非原 APK）':'经典点消 H5 复刻实验室 · 非原 APK';
  const labels=document.querySelectorAll('.score-display .metric-name');
  labels[0].textContent=play?'关卡:':'关卡';
  labels[1].textContent=play?'当前':'当前累计得分';
  labels[2].textContent=play?'目标:':'本关目标';
  if(game&&!silent)record('view-change',{view:play?'gameplay':'workbench'});
  if(game)render();
}
function setMenu(open){
  // Pause the presentation at its already-committed model outcome. A menu
  // opened mid-clear must never reveal half-hidden sprites on resume or
  // keep the board locked while the player thinks gameplay is paused.
  if(open)settlePresentationOnSuspend();
  $('scene-menu').hidden=!open;
  synthAudio.setMusicPaused(open||!$('scene-hall').hidden||document.hidden);
  if(!open)$('scene-help-panel').hidden=true;
  if(open&&document.body.classList.contains('mode-play')){
    $('scene-resume').focus();
  }else if(!open&&document.body.classList.contains('mode-play')){
    $('scene-back').focus();
  }
}

function closeHall(){
  $('scene-hall').hidden=true;
  synthAudio.setMusicPaused(document.hidden);
  $('hall-help-text').hidden=true;
  $('hall-help').setAttribute('aria-expanded','false');
  $('scene-back').focus();
}
function openHall(){
  // The live model is authoritative: immediately finish any cosmetic
  // motion, save it, and display a separate independent H5 lobby.
  settlePresentationOnSuspend();
  switchScene('play',{silent:true});
  $('hall-stage').textContent='第 '+game.stage+' 关';
  $('hall-score').textContent=formats(game.score);
  try{$('hall-best').textContent=formats(getLocalRecord(localStorage));}
  catch{$('hall-best').textContent=formats(game.score);}
  $('scene-menu').hidden=true;
  $('scene-hall').hidden=false;
  synthAudio.setMusicPaused(true);
  record('enter-independent-hall',{stage:game.stage,score:game.score});
  $('hall-continue').focus();
}
function settlePresentationOnSuspend(){
  if(!game)return;
  clearHint();
  clearActivityPreview();
  const boardWrap=document.querySelector('.board-wrap');
  const inStageEntry=boardWrap.classList.contains('entering')||
    boardWrap.classList.contains('dropping')||!$('stage-entry').hidden;
  const hadEffect=Boolean(currentEffect);
  if(hadEffect){currentEffect.cancel();currentEffect=null;}
  if(hadEffect||inStageEntry||locked){
    // The actual model state was committed at the input boundary. Only visual
    // presentation is discarded: no second award, no revived consumed prop.
    generation++;
    visual=null;locked=false;clearMask.clear();
    boardWrap.classList.remove('entering','dropping');
    $('stage-entry').hidden=true;
    hideCheer();
    $('float-score').classList.remove('show');
    visualScore=game.score;visualTargetScore=game.score;
    if(hudFrame)cancelAnimationFrame(hudFrame);
    hudFrame=0;lastHudFrameAt=null;
    render();
    record('presentation-settled-for-background',{clearEffect:hadEffect,stageTransition:inStageEntry});
  }
  saveSession();
}
document.addEventListener('visibilitychange',()=>{
  synthAudio.setMusicPaused(document.hidden||!$('scene-menu').hidden||!$('scene-hall').hidden);
  if(document.hidden)settlePresentationOnSuspend();
  else if(game&&game.phase==='ready'&&!locked)scheduleHint();
});
window.addEventListener('pagehide',settlePresentationOnSuspend);

let localSaveAvailable=true;
function saveSession(){
  if(!game)return false;
  try{
    if(!game.debugSession)updateLocalRecord(game.score,localStorage);
    saveToStorage(game,localStorage);
    localSaveAvailable=true;
    return true;
  }catch{
    localSaveAvailable=false;
    $('menu-save-status').textContent='本地存档不可用；关闭页面将丢失本局进度';
    return false;
  }
}
function updateSessionLabels(){
  const button=$('scene-toggle-tap');
  button.textContent=game.twoTap?'触控：双击确认':'触控：单击消除';
  if(!localSaveAvailable){
    $('menu-save-status').textContent='本地存档不可用；关闭页面将丢失本局进度';
    return;
  }
  try{$('menu-save-status').textContent='本机最高 '+formats(getLocalRecord(localStorage))+' 分 · 本地自动存档';}
  catch{
    localSaveAvailable=false;
    $('menu-save-status').textContent='本地存档不可用；关闭页面将丢失本局进度';
  }
}
function clearActivityPreview(){
  if(activityPreviewTimer!==null){clearTimeout(activityPreviewTimer);activityPreviewTimer=null;}
  $('activity-layer').hidden=true;
}
function showActivityPreview(){
  if(locked||game.phase!=='ready'){message('请先结束当前动作，再查看条件事件。');return;}
  clearActivityPreview();
  $('activity-layer').hidden=false;
  record('conditional-parachute-preview',{testOnly:true,sourceGate:'stage>=2,calm,40%,once-per-stage',reward:'none'});
  message('M08 条件活动外观演示。实际原 APK 只有满足条件才可能出现；本演示不发放金币或 BUFF。');
  activityPreviewTimer=setTimeout(()=>clearActivityPreview(),8500);
}
function clearHint(){
  if(hintTimer!==null){clearTimeout(hintTimer);hintTimer=null;}
  document.querySelectorAll('#board > .cell.hint').forEach(el=>el.classList.remove('hint'));
}
function scheduleHint(){
  clearHint();
  if(document.hidden||locked||!game||game.phase!=='ready')return;
  hintTimer=setTimeout(()=>{
    hintTimer=null;
    if(locked||game.phase!=='ready'||game.selected)return;
    const found=groups(game.board);
    if(!found.length)return;
    // The original APK has a 5-second idle hint gate, but the group preference
    // is a clean-room approximation, not a claimed source-exact selector.
    const group=found.reduce((a,b)=>b.length>a.length?b:a,found[0]);
    for(const [r,c] of group){
      const el=document.querySelector('#board > [data-row="'+r+'"][data-col="'+c+'"]');
      el?.classList.add('hint');
    }
  },SOURCE_TIMING.hintMs);
}

function message(s){$('game-message').textContent=s;}
function record(label,detail={}){
  const event={time:new Date().toISOString(),label,stage:game.stage,score:game.score,
    seed:game.seed,...detail};
  log.unshift(event);
  if(log.length>80)log.pop();
  $('event-count').textContent=log.length+' EVENTS';
  $('event-log').replaceChildren(...log.slice(0,8).map((item)=>{
    const li=document.createElement('li');
    li.textContent=String(item.label)+' · 关'+item.stage+' · 分'+item.score;
    return li;
  }));
}
function reset(){
  pendingEndConfirm=false;
  clearActivityPreview();
  if(currentEffect){currentEffect.cancel();currentEffect=null;}
  generation++;locked=false;visual=null;clearMask.clear();toolMode=null;paintCell=null;
  // Reset invalidates stage-entry timers; also clear presentation classes
  // immediately. Otherwise the discarded transition leaves the new board
  // permanently invisible under .board-wrap.entering.
  document.querySelector('.board-wrap').classList.remove('entering','dropping');
  $('stage-entry').hidden=true;
  $('float-score').classList.remove('show');
  const val=Number($('seed-input').value),seed=Number.isFinite(val)&&val>0?Math.floor(val):20261008;
  $('seed-input').value=String(seed);
  game=new ClassicGame({seed,twoTap:$('tap-mode').value==='double',tierOverride:$('tier-override').value||null});
  try{clearStorage(localStorage);}catch{}
  visualScore=game.score;visualTargetScore=game.score;if(hudFrame)cancelAnimationFrame(hudFrame);hudFrame=0;lastHudFrameAt=null;
  hideCheer();
  log=[];lastAction='新棋盘';record('new-board',{boardOrigin:game.boardOrigin,tier:game.tier});
  message('原创随机棋盘：难度参考原 APK 各档统计，当前棋盘不保证全消。');updateSessionLabels();saveSession();render();
}
function selectedCells(){
  if(!game.selected)return new Set();
  for(const g of groups(game.board)){
    const key=g.map(([r,c])=>r*N+c).sort((a,b)=>a-b).join(',');
    if(key===game.selected)return new Set(g.map(([r,c])=>r*N+c));
  }
  return new Set();
}
function renderBoard(){
  const current=visual||game.board;const highlight=selectedCells();
  const frag=document.createDocumentFragment();
  for(let r=0;r<N;r++)for(let c=0;c<N;c++){
    const idx=r*N+c,v=current[r][c];const cell=document.createElement('button');
    cell.type='button';cell.className='cell'+(v===null?' empty':'')+(highlight.has(idx)?' selected':'');
    cell.setAttribute('role','gridcell');cell.setAttribute('aria-label',v===null?('第'+(r+1)+'行第'+(c+1)+'列空格'):('第'+(r+1)+'行第'+(c+1)+'列'+COLORS[v]+'星星'));
    cell.dataset.row=String(r);cell.dataset.col=String(c);cell.dataset.testid='cell-'+r+'-'+c;
    cell.style.setProperty('--entry-delay',(((9-r)*.015+c*.007).toFixed(3))+'s');
    if(v!==null){
      cell.dataset.color=COLORS[v];
      const star=document.createElement('span');star.className='legacy-star';star.textContent='★';cell.append(star);
      const emblem=document.createElement('span');emblem.className='star-emblem';
      const core=document.createElement('span');core.className='star-emblem-inner';
      emblem.append(core);cell.append(emblem);
    }else cell.disabled=true;
    if(locked)cell.setAttribute('aria-disabled','true'); // handler blocks input, not visibility
    frag.append(cell);
  }
  $('board').replaceChildren(frag);
}
function beginStageEnter(result){
  if(!result?.ok){render();return;}
  const token=++generation;
  locked=true;toolMode=null;clearMask.clear();visual=null;
  const boardWrap=document.querySelector('.board-wrap');
  const layer=$('stage-entry');
  $('stage-entry-title').textContent='第 '+game.stage+' 关';
  $('stage-entry-target').textContent='目标 '+formats(target(game.stage))+' 分';
  boardWrap.classList.add('entering');layer.hidden=false;
  record('stage-enter-3s',{stage:game.stage,stageEnterMs:3000,source:'FGUI 72frames/24fps'});
  render();
  setTimeout(()=>{
    if(token!==generation)return;
    layer.hidden=true;boardWrap.classList.remove('entering');
    boardWrap.classList.add('dropping');render();
  },3000);
  setTimeout(()=>{
    if(token!==generation)return;
    boardWrap.classList.remove('dropping');locked=false;
    record('stage-board-settled',{stage:game.stage,entryMs:3000,approxBoardMs:1450});
    message('已进入第 '+game.stage+' 关。原 APK 新盘落下约1.2–1.3秒，此处仅是时间参考的近似动画。');
    render();
  },4450);
}
function renderOverlay(){
  const overlay=$('overlay');
  overlay.replaceChildren();overlay.hidden=true;
  overlay.removeAttribute('data-phase');
  if(locked)return;
  const phase=game.phase;
  if(pendingEndConfirm&&phase==='failure'){
    overlay.hidden=false;
    overlay.classList.add('record-confirm');
    const heading=document.createElement('h3');heading.textContent='确定结束本局？';
    const para=document.createElement('p');
    para.textContent='第 '+game.stage+' 关 · 已得 '+formats(game.score)+' 分。结束后可以重新开局，本浏览器不会提交任何排行榜成绩。';
    const buttons=document.createElement('div');buttons.className='overlay-actions';
    for(const [label,action] of [
      ['继续考虑',()=>{pendingEndConfirm=false;render();}],
      ['确认退出',()=>{pendingEndConfirm=false;const out=game.abandon();saveSession();record('abandon-game-confirmed',out);render();}]
    ]){
      const b=document.createElement('button');b.type='button';b.textContent=label;b.addEventListener('click',action);buttons.append(b);
    }
    overlay.append(heading,para,buttons);return;
  }
  overlay.classList.remove('record-confirm');
  if(!['rescue','failure','pass','unsupported-stage','ended'].includes(phase))return;
  overlay.hidden=false;overlay.dataset.phase=phase;
  const icon=document.createElement('div');icon.className='overlay-ornament';
  icon.textContent=phase==='pass'?'✦':'✧';overlay.append(icon);
  if(phase==='pass'){
    // Independent award animation based on the source's five flying markers
    // and ~.833s overall window; NEVER uses the APK's original art.
    const constellation=document.createElement('div');
    constellation.className='reward-constellation';
    constellation.setAttribute('aria-hidden','true');
    for(let i=0;i<5;i++){
      const star=document.createElement('span');
      star.className='reward-star';star.textContent='✦';
      star.style.setProperty('--reward-index',String(i));
      constellation.append(star);
    }
    overlay.append(constellation);
  }
  const headline=document.createElement('h3');
  headline.textContent=phase==='pass'?'关卡完成':phase==='rescue'?'还有一次机会':phase==='ended'?'本局结束':'关卡未达标';
  overlay.append(headline);
  const caption=document.createElement('p');
  const currentTarget=target(game.stage);
  caption.textContent=phase==='pass'
    ?'当前累计 '+formats(game.score)+' 分 · 目标 '+formats(currentTarget)+' 分'
    :phase==='rescue'?'距离本关目标很近：可以免费试验一次刷新救场。'
    :'当前累计 '+formats(game.score)+' 分 · 目标 '+formats(currentTarget)+' 分';
  overlay.append(caption);
  const settle=game.lastSettlement;
  if(settle&&['pass','failure','rescue','ended'].includes(phase)){
    const stats=document.createElement('div');stats.className='result-stats';
    const rest=document.createElement('span');rest.textContent='剩余 '+settle.remain+' 颗';stats.append(rest);
    const reward=document.createElement('strong');reward.textContent='残局奖励 +'+formats(settle.bonus);stats.append(reward);
    if(settle.remain===0){
      const perfect=document.createElement('b');perfect.className='perfect-flash';
      perfect.textContent='✦ 完美清盘 ✦';stats.append(perfect);
    }
    overlay.append(stats);
  }
  const actions=document.createElement('div');actions.className='overlay-actions';
  const consumer=document.body.classList.contains('mode-play');
  function action(label,handler){
    const b=document.createElement('button');b.type='button';b.textContent=label;
    b.addEventListener('click',handler);actions.append(b);
  }
  if(phase==='pass'){
    action('下一关 →',()=>{
      const result=game.advance();saveSession();record('advance-stage',result);
      if(result.ok)beginStageEnter(result);
      else{message('目标信息未取得，无法进入下一关。');render();}
    });
    if(!consumer)action('重开演示',reset);
  }else if(phase==='rescue'){
    action(consumer?'试一次救场（本地练习）':'刷新救场（测试）',()=>{
      const result=game.rescue();saveSession();record('rescue',result);
      message('救场只在本浏览器使用原创随机盘，不代表原 APK 道具收费流程。');render();
    });
    action('放弃救场',()=>{game.rejectRescue();saveSession();record('reject-rescue');render();});
  }else if(phase==='failure'){
    action(consumer?'普通复活（本地练习）':'普通复活（测试）',()=>{
      const result=game.revive();saveSession();record('normal-revive',result);
      message('普通复活：本关得分回退至入场值，换一张独立生成的较易棋盘。');render();
    });
    if(!consumer)action('超级复活（测试）',()=>{
      const result=game.revive(true);saveSession();record('super-revive',result);
      message('超级复活保留本关已得分；原 APK 收费与广告条件尚未证实。');render();
    });
    action(consumer?'放弃本局':'结束本局',()=>{
      pendingEndConfirm=true;
      record('ask-abandon-confirmation',{source:'original-highscore-protection-is-conditional'});
      render();
    });
    if(!consumer)action('重新开始',reset);
  }else if(phase==='ended'){
    action('再来一局',reset);
    action(consumer?'返回游戏大厅':'返回实验室',
      ()=>consumer?openHall():switchScene('lab'));
  }else action(consumer?'再来一局':'重开演示',reset);
  if(consumer&&['failure','rescue'].includes(phase)){
    const explanation=document.createElement('p');
    explanation.className='practice-disclaimer';
    explanation.textContent='独立 H5 练习流程 · 不消耗金币、不播放广告';
    overlay.append(explanation);
  }
  overlay.append(actions);
}
function render(){
  const s=game.status(),gg=groups(game.board),max=gg.reduce((a,g)=>Math.max(a,g.length),0);
  const inPlay=document.body.classList.contains('mode-play');
  $('stage-number').textContent=inPlay?String(s.stage):String(s.stage).padStart(2,'0');
  $('score-number').textContent=formats(Math.floor(visualScore));$('target-number').textContent=inPlay?String(s.target):formats(s.target);
  if(!locked)visualTargetScore=game.score;
  if(visualScore!==visualTargetScore)triggerChase();
  $('progress-fill').style.width=(s.target?Math.max(0,Math.min(100,100*s.score/s.target)):0)+'%';
  $('board-status').textContent=s.remaining+' / 100 格';
  $('move-status').textContent=lastAction;
  $('group-status').textContent='合法连块 '+s.legalGroups;
  $('stat-remaining').textContent=s.remaining;
  $('stat-groups').textContent=s.legalGroups;
  $('stat-largest').textContent=max||'—';
  $('stat-tier').textContent=s.tier;
  $('stat-history').textContent=new Set(game.recentBoardSignatures).size+' / '+game.recentBoardSignatures.length;
  $('stat-solvable').textContent=s.certifiedOpening?'初盘有全消路线':'当前盘无全消保证';
  // Cheap memoized single-board metric; avoid rerunning whole-game rollouts
  // while the browser is animating or the HUD is chasing score.
  if(!inPlay){
    const signature=boardSignature(game.board);
    if(signature!==cachedDifficultySignature){
      cachedDifficultySignature=signature;
      cachedDifficultyMetrics=evaluateBoard(game.board);
    }
    const ref=ORIGINAL_LARGEST_FIRST[s.tier];
    $('stat-rollout-score').textContent=formats(cachedDifficultyMetrics.largest.clearScore);
    $('stat-original-score').textContent=ref?formats(ref.clearScore.toFixed(1)):'—';
    $('stat-rollout-remain').textContent=String(cachedDifficultyMetrics.largest.remaining);
    $('stat-original-remain').textContent=ref?String(ref.remaining):'—';
  }

  $('stat-state').textContent=locked?'animation':s.phase;
  const isBusy=locked||game.phase!=='ready';
  $('phase-chip').textContent=locked?'ANIMATING · 交互锁定':s.phase.toUpperCase()+(isBusy?' · 状态转换':' · 可操作');
  $('phase-chip').classList.toggle('busy',isBusy);
  for(const type of ['hammer','refresh','crayon']){
    $(type+'-count').textContent='×'+s.props[type];
    document.querySelector('[data-tool="'+type+'"]').classList.toggle('active',toolMode===type);
    document.querySelector('[data-tool="'+type+'"]').disabled=locked||game.phase!=='ready'||s.props[type]===0;
  }
  updateSessionLabels();
  $('tap-mode').value=game.twoTap?'double':'single';
  renderBoard();renderOverlay();scheduleHint();
}
function floatScore(n,cells=[]){
  const el=$('float-score');
  const wrap=document.querySelector('.board-wrap'),bounds=wrap.getBoundingClientRect();
  if(cells.length&&bounds.width&&bounds.height){
    const centers=cells.map(p=>document.querySelector('#board > [data-row="'+p.row+'"][data-col="'+p.col+'"]')?.getBoundingClientRect()).filter(Boolean);
    if(centers.length){
      const x=centers.reduce((s,b)=>s+b.left+b.width/2,0)/centers.length-bounds.left;
      const y=centers.reduce((s,b)=>s+b.top+b.height/2,0)/centers.length-bounds.top;
      el.style.left=Math.max(18,Math.min(82,100*x/bounds.width))+'%';
      el.style.top=Math.max(18,Math.min(80,100*y/bounds.height))+'%';
    }
  }
  el.textContent='+'+formats(n);el.classList.remove('show');
  void el.offsetWidth;el.classList.add('show');
}
function animateMove(result){
  if(!result.ok)return;
  // The game model has already committed the board, score, inventory, and
  // any stage settlement at the input boundary. Persist that irreversible
  // state BEFORE the first animation frame, so reload/background closure
  // cannot replay a consumed group or mint its score a second time.
  saveSession();
  lastAction=result.kind==='hammer'?'锤子 +5':result.kind==='clear'?result.removed.length+' 连消 +'+result.gained:result.kind;
  if(!result.removed||!result.removed.length){record(result.kind);render();return;}
  if(currentEffect){currentEffect.cancel();currentEffect=null;}
  const token=++generation;
  locked=true;toolMode=null;visual=result.before;clearMask.clear();
  const physics=motionPlan(result.before,result.removed.map(p=>[p.row,p.col]));
  render(); // Keep the old board in place throughout the animation.
  const reduced=window.matchMedia?.('(prefers-reduced-motion: reduce)').matches||false;
  currentEffect=beginClearEffect($('board'),result,physics,{
    reducedMotion:reduced,
    onPop:(piece)=>{
      if(token!==generation)return;
      const i=result.removed.findIndex(p=>p.row===piece.row&&p.col===piece.col);
      const perPiece=result.kind==='hammer'?5:5*(2*i+1);
      visualTargetScore=Math.min(game.score,visualTargetScore+perPiece);
      triggerChase();
      // Consumer mode has the independent group score flying to the HUD.
      // Do not overlay the same total twice; retain the lab's static callout
      // and the single hammer's one-off feedback.
      if(i===result.removed.length-1&&result.gained&&
         (result.kind!=='clear'||!document.body.classList.contains('mode-play')))
        floatScore(result.gained,result.removed);
      synthAudio.pop(result.removed.length,i);
    },
    onLand:()=>{if(token===generation)synthAudio.land();},
    onDone:()=>{
      if(token!==generation)return;
      const done=currentEffect;
      currentEffect=null;
      if(done)done.cancel();
      visual=null;locked=false;clearMask.clear();visualTargetScore=game.score;
      saveSession();
      record('board-stable',{remaining:countRemaining(game.board),phase:game.phase});
      render();
      if(result.settlement)message('残局奖励 +'+result.settlement.bonus+'，当前状态：'+result.settlement.outcome);
      else message(result.removed.length+' 颗星星消除，+'+result.gained+' 分。');
    }
  });
  const fx=currentEffect;
  if(cheerFor(result.removed.length)){
    setTimeout(()=>{if(token===generation)showCheer(result.removed.length);},fx.delays.at(-1));
  }
  if(navigator.vibrate){try{navigator.vibrate(12);}catch{}}
  record('clear-animation-start',{
    kind:result.kind,size:result.removed.length,scoreDelta:result.gained,
    totalBudgetMs:fx.totalMs,moveStartMs:fx.fallStartMs,motionMs:fx.motionMs,
    movedPieces:physics.moved,maxDrop:physics.dropMax,maxShift:physics.shiftMax,
    renderMode:'local-only tile ghosts + small shards; NO screen or board mask',
    fidelity:'clean-room acceleration approximating measured original n2/3/4/5/8 internal game-clock'
  });
}

function openPalette(row,col){
  if(locked)return;
  paintCell=[row,col];
  const box=$('overlay');box.hidden=false;box.replaceChildren();
  const h=document.createElement('h3');h.textContent='给这颗星星换色';box.append(h);
  const p=document.createElement('p');p.textContent='选择目标颜色（工作台调试库存 ×'+game.props.crayon+'）';box.append(p);
  const actions=document.createElement('div');actions.className='overlay-actions';
  COLORS.forEach((color,id)=>{
    const b=document.createElement('button');b.textContent=['红','绿','蓝','橙','紫'][id]+' ★';
    b.dataset.color=color;
    b.onclick=()=>{const result=game.crayon(row,col,id);paintCell=null;toolMode=null;
      if(result.ok)saveSession();
      record('crayon',{row,col,color,ok:result.ok});
      message(result.ok?'蜡笔改色完成。':'蜡笔目标无效。');render();};
    actions.append(b);
  });
  const cancel=document.createElement('button');cancel.textContent='取消';
  cancel.onclick=()=>{paintCell=null;toolMode=null;render();};actions.append(cancel);box.append(actions);
}
function onBoardClick(event){
  clearHint();
  const button=event.target.closest('.cell');if(!button||locked||game.phase!=='ready')return;
  synthAudio.unlock();
  const r=Number(button.dataset.row),c=Number(button.dataset.col);
  if(toolMode==='hammer'){
    const res=game.hammer(r,c);if(!res.ok){message('不能在这个位置使用锤子。');return;}
    animateMove(res);return;
  }
  if(toolMode==='crayon'){openPalette(r,c);return;}
  const chosen=game.choose(r,c);
  if(chosen.reason==='selected'){
    const n=chosen.cells.length;message('已选中 '+n+' 连块，再点击同一连块确认。');lastAction='选中 '+n+' 连块';
    render();return;
  }
  if(!chosen.ok){message(chosen.reason==='single'?'单颗星星不能直接消除。':'棋盘正在结算。');return;}
  animateMove(chosen);
}
function setModule(k){
  selectedModule=k;const [id,title,description]=modules[k];
  $('module-index').textContent=id;$('inspector-title').textContent=title;
  $('inspector-description').textContent=description;
  document.querySelectorAll('.module').forEach(button=>button.classList.toggle('is-active',button.dataset.module===k));
  message(id+' · '+description);
}
function onTool(event){
  clearHint();
  if(locked||game.phase!=='ready')return;
  const type=event.currentTarget.dataset.tool;
  if(type==='refresh'){
    const before=clone(game.board);
    const result=game.refresh();
    if(result.ok){
      // Same write-ahead rule as a clear: refresh has already consumed a prop.
      saveSession();
      const token=++generation;locked=true;toolMode=null;lastAction='刷新重排';
      visual=before;render();
      currentEffect=beginRefreshEffect($('board'),before,game.board,{
        reducedMotion:window.matchMedia?.('(prefers-reduced-motion: reduce)').matches,
        onDone:()=>{
          if(token!==generation)return;
          const fx=currentEffect;currentEffect=null;if(fx)fx.cancel();
          visual=null;locked=false;saveSession();
          record('refresh-complete',{remaining:countRemaining(game.board)});
          message('刷新完成。现存星星已重新排列，并保留至少一组可消连块。');
          render();
        }
      });
      record('refresh-start',{remaining:countRemaining(game.board),visual:'colored piece continuity with no mask'});
    }
    return;
  }
  toolMode=toolMode===type?null:type;
  message(toolMode==='hammer'?'选择一颗要敲掉的星星。':toolMode==='crayon'?'选择要染色的星星。':'已退出道具选择。');
  render();
}

$('switch-play').addEventListener('click',()=>switchScene('play'));
$('switch-lab').addEventListener('click',()=>switchScene('lab'));
$('scene-back').addEventListener('click',()=>setMenu(true));
$('scene-resume').addEventListener('click',()=>setMenu(false));
$('scene-reset').addEventListener('click',()=>{reset();setMenu(false);});
$('scene-home').addEventListener('click',openHall);
$('hall-continue').addEventListener('click',closeHall);
$('hall-new').addEventListener('click',()=>{reset();closeHall();});
$('hall-help').addEventListener('click',()=>{
  const visible=$('hall-help-text').hidden;
  $('hall-help-text').hidden=!visible;
  $('hall-help').setAttribute('aria-expanded',String(visible));
});
$('scene-open-lab').addEventListener('click',()=>switchScene('lab'));
$('scene-help').addEventListener('click',()=>{$('scene-help-panel').hidden=!$('scene-help-panel').hidden;});
$('scene-toggle-tap').addEventListener('click',()=>{
  if(locked)return;
  game.twoTap=!game.twoTap;game.selected=null;
  record('touch-mode',{twoTap:game.twoTap});
  saveSession();render();
});
$('scene-toggle-audio').addEventListener('click',()=>{
  const checked=!$('audio-enabled').checked;
  $('audio-enabled').checked=checked;
  $('audio-enabled').dispatchEvent(new Event('change'));
  $('scene-toggle-audio').textContent=checked?'关闭音效':'开启音效';
});
document.addEventListener('keydown',event=>{
  if(event.key!=='Escape'||!document.body.classList.contains('mode-play'))return;
  if(!$('scene-hall').hidden){closeHall();return;}
  if(!$('scene-menu').hidden)setMenu(false);
  else setMenu(true);
});

$('board').addEventListener('click',onBoardClick);
$('reset-btn').addEventListener('click',reset);
$('tier-override').addEventListener('change',reset);
$('audio-enabled').addEventListener('change',event=>{
  synthAudio.setEnabled(event.target.checked);
  if(event.target.checked)synthAudio.unlock();
  $('scene-toggle-audio').textContent=event.target.checked?'关闭音效':'开启音效';
  record('synthetic-sfx-toggle',{enabled:event.target.checked});
  message(event.target.checked?'已开启原创消除音效。':'已关闭消除音效。');
});
$('music-enabled').addEventListener('change',event=>{
  synthAudio.setMusicEnabled(event.target.checked);
  if(event.target.checked)synthAudio.unlock();
  $('scene-toggle-music').textContent=event.target.checked?'关闭背景旋律':'开启背景旋律';
  record('original-melody-toggle',{enabled:event.target.checked});
  message(event.target.checked?'已开启本 H5 独立创作的背景旋律（不是原 APK 背景音乐）。':'已关闭背景旋律。');
});
$('scene-toggle-music').addEventListener('click',()=>{
  $('music-enabled').checked=!$('music-enabled').checked;
  $('music-enabled').dispatchEvent(new Event('change'));
});
$('layout-mode').addEventListener('change',event=>{
  const original=event.target.value==='original';
  document.querySelector('.game-pane').classList.toggle('original-scene',original);
  record('layout-change',{layout:original?'original-proportions':'lab'});
  message(original?'APK 几何参考：仅按实机测量摆放 720×1080 画布、680×680 棋盘与居中 HUD；当前 H5 并非原 APK。':'已切换到实验室布局。');
  render();
});
$('tap-mode').addEventListener('change',event=>{game.twoTap=event.target.value==='double';game.selected=null;record('touch-mode',{twoTap:game.twoTap});saveSession();render();});
$('debug-parachute-btn').addEventListener('click',showActivityPreview);
$('parachute-prop').addEventListener('click',()=>{
  clearActivityPreview();
  record('parachute-preview-picked',{deliveredReward:false});
  message('已触碰演示降落伞；未扣费、未观看广告、未发放实际奖励。');
});
$('debug-pass-btn').addEventListener('click',()=>{
  if(currentEffect){currentEffect.cancel();currentEffect=null;}
  generation++;visual=null;clearMask.clear();locked=false;
  const result=game.debugForcePass();saveSession();record('debug-force-pass',result);
  message('调试场景：模拟累计达标，仅供预览参照原 APK 3 秒时长的原创入场动效。');
  render();
});
$('debug-end-btn').addEventListener('click',()=>{if(currentEffect){currentEffect.cancel();currentEffect=null;}generation++;visual=null;clearMask.clear();locked=false;const r=game.debugForceEnd();saveSession();record('debug-force-end',r);message('这是 H5 调试结算按钮，不存在于原 APK。');render();});
document.querySelectorAll('.module').forEach(b=>b.addEventListener('click',()=>setModule(b.dataset.module)));
document.querySelectorAll('[data-tool]').forEach(b=>b.addEventListener('click',onTool));
$('copy-log-btn').addEventListener('click',async ()=>{
  try{await navigator.clipboard.writeText(JSON.stringify([...log].reverse(),null,2));message('已复制本地事件 JSON。');}
  catch{message('当前浏览器禁止剪贴板，请使用 HTTPS 或开发者工具获取事件日志。');}
});
let restored=false;
try{
  const snapshot=loadFromStorage(localStorage);
  if(snapshot){
    game=snapshot;restored=true;visualScore=game.score;visualTargetScore=game.score;
    $('seed-input').value=String(game.seed);
    $('tier-override').value=game.tierOverride||'';
    $('tap-mode').value=game.twoTap?'double':'single';
    record('restore-session',{source:'localStorage',stage:game.stage});
    message('已恢复当前浏览器的本地游戏进度。');
    render();
  }
}catch{}
if(!restored)reset();
switchScene(new URLSearchParams(location.search).get('view')==='lab'?'lab':'play',{silent:true});
if(new URLSearchParams(location.search).get('view')==='hall')openHall();
