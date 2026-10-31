import {CONFIG as C,stageSize} from '../../settings/config/config.js';
import {randomOrder,selectionPool,visibleIndices} from '../../motion/core/cinema-core.js';
import {randomBack} from '../../settings/data/back-config.js';
import {prepareBack} from '../assets/back-loader.js';
import {renderCards} from '../cards/card-view.js';
import {cardSize,floatLayout,shuffleMotion,fanMotion,cancelAll} from '../../motion/animation/card-animation.js';
import {Carousel} from '../../motion/selection/carousel.js';
export async function startShuffleFlow(ctx){
 const {stage,container,instruction,main,resultView,magic,revealMagic,$,setState,getState,refreshCounter}=ctx;
 if(!['idle','selection','result'].includes(getState()))return;
 const previous=getState(),current=++ctx.token,previousText=instruction.textContent;setState('preparing','카드 이미지를 준비하고 있어요…');
 let next;try{next=randomBack(ctx.back?.id);await prepareBack(next);}catch(e){setState(previous,'카드 이미지를 불러오지 못했어요. 다시 시도해 주세요.');if(previous==='result')$('#resultNotice').textContent='카드 이미지를 불러오지 못했어요. 다시 섞기를 눌러 재시도해 주세요.';instruction.textContent=previousText;return;}
 if(current!==ctx.token)return;
 ctx.carousel?.destroy();ctx.carousel=null;magic.stop();revealMagic.stop();cancelAll(ctx.cards);ctx.back=next;$('#backName').textContent='· '+ctx.back.name;
 $('#resultCardHost').replaceChildren();
 $('#resultCardHost').style.removeProperty('width');$('#resultCardHost').style.removeProperty('height');
 main.hidden=false;resultView.hidden=true;stage.classList.remove('selection-stage','idle-stack');cardSize(stage,'shuffle');
 ctx.cards=renderCards(container,randomOrder(ctx.catalog).slice(0,C.counts.shuffle),ctx.back);ctx.cards.forEach(c=>{c.disabled=true;c.classList.add('shuffle-surface');});floatLayout(ctx.cards,stage);
 setState('shuffling','카드를 섞고 있어요…');instruction.textContent='';magic.start(ctx.cards);
 if(!await shuffleMotion(ctx.cards,stage,name=>magic.phase(name))||current!==ctx.token){magic.stop();return;}
 ctx.pool=selectionPool(ctx.catalog);ctx.cards=renderCards(container,ctx.pool,ctx.back);ctx.cards.forEach(c=>{c.hidden=true;c.disabled=true;});
 const ids=visibleIndices(0,ctx.pool.length,C.counts.visible),opening=ids.map(i=>ctx.cards[i]);opening.forEach(c=>c.hidden=false);
 magic.cards=ctx.cards;stage.classList.add('selection-stage');
 if(!await fanMotion(opening,stage,clock=>magic.release(clock))||current!==ctx.token){magic.stop();return;}
 magic.finish();ctx.carousel=new Carousel(ctx.cards,stage,refreshCounter,ctx.choose);ctx.carousel.layout();setState('selection','카드를 한 번 누르면 선택, 다시 누르면 공개됩니다');
 instruction.textContent='';
}
