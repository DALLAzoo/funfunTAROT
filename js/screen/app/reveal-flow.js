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
 const revealTop=stage.getBoundingClientRect().top;
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
  resultView.style.setProperty('--reveal-top',Math.max(0,revealTop)+'px');
  host.style.setProperty('--result-width',rw+'px');
  const reading = $('#resultReading');
  reading.textContent = chosen.cardData.id === 'major-00' ? `새로운 길을 앞두고 모든 것을 미리 알 수는 없습니다. 어디로 이어질지 알 수 없는 길이라도 직접 걸어 보아야 비로소 알게 되는 것들이 있지요. 지금은 익숙한 생각과 정해진 방식에서 벗어나 조금 더 자유롭게 움직여 보세요. 남들이 정해 놓은 기준이나 앞으로의 결과에 지나치게 얽매이지 말고 자신이 가고 싶은 방향을 바라보세요. 처음부터 완벽한 계획이나 확실한 답을 가지고 출발해야 하는 것은 아닙니다. 때로는 새로운 경험 자체가 그동안 알지 못했던 세상을 보여 주기도 합니다. 지금은 모든 가능성을 미리 판단하고 제한하기보다 열린 마음으로 새로운 길에 발을 내디뎌 보세요.` : '';
  reading.hidden = !reading.textContent;
  main.hidden=true;resultView.hidden=false;
  setState('revealing','선택한 카드를 공개하고 있어요…');
  await moveToCenter(result,host,origin,sourceWidth,angle,rw,
    (card,duration)=>revealMagic.orbit(card,duration));
  await new Promise(resolve=>setTimeout(resolve,C.reveal.pauseBeforeFlip));
  await screenTransition(result);
  revealMagic.stars(result);
  setState('result','카드가 공개됐어요');$('#resultAgain').focus({preventScroll:true});
 }catch(e){magic.stop();main.hidden=false;resultView.hidden=true;ctx.carousel=new Carousel(ctx.cards,stage,refreshCounter,ctx.choose);ctx.carousel.layout();setState('selection','전환을 완료하지 못했어요. 다시 선택해 주세요.');}
}
