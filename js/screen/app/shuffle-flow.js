import {CONFIG as C,stageSize} from '../../settings/config/config.js';
import {randomOrder,selectionPool,visibleIndices} from '../../motion/core/cinema-core.js';
import {randomBack} from '../../settings/data/back-config.js';
import {prepareBack} from '../assets/back-loader.js';
import {renderCards} from '../cards/card-view.js';
import {cardSize,floatLayout,shuffleMotion,fanMotion,cancelAll} from '../../motion/animation/card-animation.js';
import {Carousel} from '../../motion/selection/carousel.js';
// A short swipe cue after the FIRST completed fan opening on this page.
// Remove it on pointer input or after the animation; the cue never catches taps.
function showFanSwipeHint(ctx){
 if(ctx.fanHintShown || !ctx.carousel)return;
 ctx.fanHintShown=true;
 const stage=ctx.stage;
 const hint=document.createElement('div');
 hint.className='fan-swipe-hint';
 hint.setAttribute('aria-hidden','true');
 hint.innerHTML='<span>←</span><span>→</span>';
 const visible=ctx.carousel.visible.filter(card=>!card.hidden);
 const stageBox=stage.getBoundingClientRect();
 const firstTop=Math.min(...visible.map(card=>card.getBoundingClientRect().top));
 const top=Number.isFinite(firstTop)?firstTop-stageBox.top-37:stage.clientHeight*.18;
 hint.style.top=Math.max(5,Math.min(stage.clientHeight-30,top))+'px';
 stage.append(hint);
 let timeout;
 const cleanup=()=>{clearTimeout(timeout);stage.removeEventListener('pointerdown',cleanup);hint.remove();if(ctx.removeFanSwipeHint===cleanup)ctx.removeFanSwipeHint=null;};
 ctx.removeFanSwipeHint=cleanup;
 stage.addEventListener('pointerdown',cleanup,{once:true});
 timeout=setTimeout(cleanup,1850);
}
export async function startShuffleFlow(ctx){
 const {stage,container,instruction,main,resultView,magic,revealMagic,$,setState,getState,refreshCounter}=ctx;
 if(!['idle','selection','result'].includes(getState()))return;
 const previous=getState(),current=++ctx.token,previousText=instruction.textContent;ctx.errorNotice.hide();setState('preparing','카드 이미지를 준비하고 있어요…');
 // The first shuffle must use the back already shown in the idle deck.
 // Subsequent reshuffles keep the existing random-back behavior.
 let next;try{next=(previous==='idle' && ctx.back) ? ctx.back : randomBack(ctx.back?.id);await prepareBack(next);}catch(e){setState(previous,'카드 이미지를 불러오지 못했어요. 다시 시도해 주세요.');ctx.errorNotice.show('카드 뒷면 이미지를 불러오지 못했어요.',()=>startShuffleFlow(ctx));instruction.textContent=previousText;return;}
 if(current!==ctx.token)return;
 ctx.removeFanSwipeHint?.();ctx.carousel?.destroy();ctx.carousel=null;magic.stop();revealMagic.stop();cancelAll(ctx.cards);ctx.back=next;$('#backName').textContent='· '+ctx.back.name;
 const intro=$('#sharedIntro');
 if(intro.parentElement===resultView) main.insertBefore(intro,stage);
 $('#resultSelectionTitle').textContent='어떤 메시지가 기다릴까요?';
 $('#resultCardHost').replaceChildren();
 $('#resultCardHost').style.removeProperty('width');$('#resultCardHost').style.removeProperty('height');
 resultView.classList.remove('is-final','is-revealed');main.hidden=false;resultView.hidden=true;stage.classList.remove('selection-stage','idle-stack');cardSize(stage,'shuffle');
 ctx.cards=renderCards(container,randomOrder(ctx.catalog).slice(0,C.counts.shuffle),ctx.back);ctx.cards.forEach(c=>{c.disabled=true;c.classList.add('shuffle-surface');});floatLayout(ctx.cards,stage);

 // AD1 v15: prepare the next fan off-DOM before starting the shuffle.
 // At the handoff do not generate 20 buttons / assign 20 images on the
 // animation-critical frame. The choreography, timings, sizes stay untouched.
 const preparedPool=selectionPool(ctx.catalog);
 const waitingHost=document.createElement('div');
 const preparedCards=renderCards(waitingHost,preparedPool,ctx.back);
 preparedCards.forEach(c=>{c.hidden=true;c.disabled=true;});

 if(current!==ctx.token)return;
 setState('shuffling','카드를 섞고 있어요…');instruction.textContent='';magic.start(ctx.cards);
 if(!await shuffleMotion(ctx.cards,stage,name=>{
  magic.phase(name);
 })||current!==ctx.token){magic.stop();return;}
 ctx.pool=preparedPool;ctx.cards=preparedCards;
 container.replaceChildren(...preparedCards);
 const ids=visibleIndices(0,ctx.pool.length,C.counts.visible),opening=ids.map(i=>ctx.cards[i]);opening.forEach(c=>c.hidden=false);
 magic.cards=ctx.cards;stage.classList.add('selection-stage');
 if(current!==ctx.token)return;
 if(!await fanMotion(opening,stage,clock=>{
  magic.release(clock);
 })||current!==ctx.token){magic.stop();return;}
 magic.finish();ctx.carousel=new Carousel(ctx.cards,stage,refreshCounter,ctx.choose);ctx.carousel.layout();setState('selection','카드를 한 번 누르면 선택, 다시 누르면 공개됩니다');
 showFanSwipeHint(ctx);
 instruction.textContent='';
}
