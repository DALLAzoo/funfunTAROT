import {CONFIG as C,stageSize} from '../../settings/config/config.js';
import {prepareFront,screenTransition} from '../../motion/reveal/transition.js';
import {moveToCenter} from '../../motion/reveal/center-motion.js';
import {Carousel} from '../../motion/selection/carousel.js';
export async function chooseFlow(ctx,chosen){
 const {stage,container,instruction,main,resultView,magic,revealMagic,$,setState,getState,refreshCounter}=ctx;
 if(getState()!=='selection'||ctx.carousel?.busy||chosen.hidden)return;
 setState('revealing','선택한 카드를 준비하고 있어요…');
 try{await prepareFront(chosen.cardData);}catch(e){ctx.carousel.busy=false;ctx.carousel.layout();setState('selection',e.message);return;}
 // Finish the 22px pick lift before sampling its final on-screen pose.
 await Promise.all(chosen.getAnimations().map(a=>a.finished.catch(()=>{})));
 const origin=chosen.getBoundingClientRect();
 const sourceWidth=chosen.offsetWidth;
 const matrix=new DOMMatrixReadOnly(getComputedStyle(chosen).transform);
 const angle=Math.atan2(matrix.b,matrix.a)*180/Math.PI;
 ctx.carousel.destroy();ctx.carousel=null;ctx.cards.forEach(c=>c.disabled=true);magic.stop();
 try{
  // Fade no card surface: move the selected DOM card directly into its final
  // centered host BEFORE flipping, avoiding coordinate-space changes at 90deg.
  magic.stop();
  const result=chosen;
  // Preserve the chosen card's gold aura through its reveal.
  result.classList.add('is-picked');
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
  await moveToCenter(result,host,origin,sourceWidth,angle,rw,
    (card,duration)=>revealMagic.gather(card,duration));
  await new Promise(resolve=>setTimeout(resolve,C.reveal.pauseBeforeFlip));
  await screenTransition(result);
  revealMagic.sweep(result);
  setState('result','카드가 공개됐어요');$('#resultTitle').focus();
 }catch(e){magic.stop();main.hidden=false;resultView.hidden=true;ctx.carousel=new Carousel(ctx.cards,stage,refreshCounter,ctx.choose);ctx.carousel.layout();setState('selection','전환을 완료하지 못했어요. 다시 선택해 주세요.');}
}
