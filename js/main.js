import {CONFIG as C,stageSize,deviceProfile} from './config.js';
import {makeCatalog,validateConfig,randomOrder,selectionPool,slotPose,visibleIndices} from './cinema-core.js';
import {backs,randomBack} from './back-config.js';import {prepareBack} from './back-loader.js';import {renderCards} from './card-view.js';
import {cardSize,floatLayout,shuffleMotion,fanMotion,animateTo,cancelAll,pose,transform} from './card-animation.js';
import {MagicVFX} from './magic-vfx.js';import {Carousel} from './carousel.js';import {prepareFront,screenTransition} from './transition.js';
const $=s=>document.querySelector(s),stage=$('#stage'),container=$('#cards'),status=$('#status'),instruction=$('#instruction'),shuffleBtn=$('#shuffleBtn'),main=$('#tarotApp'),resultView=$('#resultView');
let catalog=[],cards=[],pool=[],back=null,state='idle',carousel=null,token=0;const magic=new MagicVFX(stage);
function applySettings(){const s=document.documentElement.style;
 for(const [k,v] of Object.entries({'--perspective':C.camera.perspective+'px','--thickness':C.material.thickness+'px','--edge':C.material.edge,'--shadow-y':C.material.shadowY+'px','--shadow-blur':C.material.shadowBlur+'px','--shadow-alpha':C.material.shadowAlpha,'--satin-alpha':C.material.satinEdgeAlpha,}))s.setProperty(k,v);
}
function setState(next,label){state=next;status.textContent=label;$('#resultAgain').disabled=next!=='result';shuffleBtn.disabled=!['idle','selection','result'].includes(next);shuffleBtn.textContent=next==='selection'?'다시 섞기':'카드 섞기';}
function refreshCounter(){}
async function startShuffle(){
 if(!['idle','selection','result'].includes(state))return;
 const previous=state,current=++token,previousText=instruction.textContent;setState('preparing','카드 이미지를 준비하고 있어요…');
 let next;try{next=randomBack(back?.id);await prepareBack(next);}catch(e){setState(previous,'카드 이미지를 불러오지 못했어요. 다시 시도해 주세요.');if(previous==='result')$('#resultNotice').textContent='카드 이미지를 불러오지 못했어요. 다시 섞기를 눌러 재시도해 주세요.';instruction.textContent=previousText;return;}
 if(current!==token)return;
 carousel?.destroy();carousel=null;magic.stop();cancelAll(cards);back=next;$('#backName').textContent='· '+back.name;
 main.hidden=false;resultView.hidden=true;stage.classList.remove('selection-stage','idle-stack');cardSize(stage,'shuffle');
 cards=renderCards(container,randomOrder(catalog).slice(0,C.counts.shuffle),back);cards.forEach(c=>{c.disabled=true;c.classList.add('shuffle-surface');});floatLayout(cards,stage);
 setState('shuffling','카드를 섞고 있어요…');instruction.textContent='';magic.start(cards);
 if(!await shuffleMotion(cards,stage,name=>magic.phase(name))||current!==token){magic.stop();return;}
 pool=selectionPool(catalog);cards=renderCards(container,pool,back);cards.forEach(c=>{c.hidden=true;c.disabled=true;});
 const ids=visibleIndices(0,pool.length,C.counts.visible),opening=ids.map(i=>cards[i]);opening.forEach(c=>c.hidden=false);
 magic.cards=cards;stage.classList.add('selection-stage');
 if(!await fanMotion(opening,stage,clock=>magic.release(clock))||current!==token){magic.stop();return;}
 magic.finish();carousel=new Carousel(cards,stage,refreshCounter,choose);carousel.layout();setState('selection','카드를 한 번 누르면 선택, 다시 누르면 공개됩니다');
 instruction.textContent='';
}
async function choose(chosen){
 if(state!=='selection'||carousel?.busy||chosen.hidden)return;
 setState('revealing','선택한 카드를 준비하고 있어요…');
 try{await prepareFront(chosen.cardData);}catch(e){carousel.busy=false;carousel.layout();setState('selection',e.message);return;}
 carousel.destroy();carousel=null;cards.forEach(c=>c.disabled=true);magic.stop();magic.start([chosen]);magic.phase('focus');
 try{
  // Fade no card surface: move the selected DOM card directly into its final
  // centered host BEFORE flipping, avoiding coordinate-space changes at 90deg.
  magic.stop();
  const result=chosen;
  result.classList.remove('shuffle-surface','selectable','is-center');
  result.classList.add('result-card');result.disabled=true;
  result.setAttribute('aria-label',chosen.cardData.name);
  const rw=stageSize('result',innerWidth);
  result.style.width=rw+'px';result.style.height=rw*C.aspect+'px';
  result.style.transform='none';result.style.zIndex='auto';
  const host=$('#resultCardHost');host.replaceChildren(result);
  $('#resultName').textContent=chosen.cardData.name;
  $('#resultNotice').textContent=chosen.cardData.frontImage?'선택한 카드':'앞면 이미지 미등록 · 카드 ID가 연결된 시연 결과';
  main.hidden=true;resultView.hidden=false;
  setState('revealing','선택한 카드를 공개하고 있어요…');
  const approach=result.animate([{transform:'scale(1)'},{transform:`scale(${C.reveal.zoom||1.18})`},{transform:'scale(1)'}],
    {duration:C.reveal.approach,easing:'ease-in-out'});
  await approach.finished;
  await screenTransition(result);
  setState('result','카드가 공개됐어요');$('#resultTitle').focus();
 }catch(e){magic.stop();main.hidden=false;resultView.hidden=true;carousel=new Carousel(cards,stage,refreshCounter,choose);carousel.layout();setState('selection','전환을 완료하지 못했어요. 다시 선택해 주세요.');}
}
shuffleBtn.addEventListener('click',startShuffle);$('#resultAgain').addEventListener('click',startShuffle);
window.addEventListener('resize',()=>{if(state==='selection'&&!carousel?.busy)carousel.layout();if(state==='result'){const el=$('.result-card'),w=stageSize('result',innerWidth);el.style.width=w+'px';el.style.height=w*C.aspect+'px';}});
try{applySettings();catalog=makeCatalog();const inventory=validateConfig(C,catalog);$('#inventory').textContent=`등록 데이터 ${inventory.records}장 · 앞면 이미지 ${inventory.registeredFrontImages}장 · 뒷면 ${backs.length}종`;
 $('#poolNotice').textContent=C.pool.mode==='trial-uniform-subset'?'선택 대상은 시험용 무작위 20장입니다. 최종 구성 방식은 미확정입니다.'.replace('20',C.counts.selection):'설정된 카드 ID 목록을 선택 대상으로 사용합니다.';
 back=randomBack();setState('preparing','카드 이미지를 준비하고 있어요…');
 try{await prepareBack(back);cardSize(stage);cards=renderCards(container,randomOrder(catalog).slice(0,C.counts.shuffle),back);cards.forEach(c=>{c.disabled=true;c.classList.add('shuffle-surface');});floatLayout(cards,stage);cardSize(stage,'selection');stage.classList.add('idle-stack');$('#backName').textContent='· '+back.name;setState('idle','새로운 덱이 준비됐어요');}
 catch(e){back=null;setState('idle','카드 이미지를 불러오지 못했어요. 카드 섞기를 눌러 다시 시도해 주세요.');}
}catch(e){setState('error',e.message);status.setAttribute('role','alert');}
