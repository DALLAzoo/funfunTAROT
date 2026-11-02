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
 // The consultation title is an independent display, not a dropdown DOM child.
 const heading=$('#resultSelectionTitle');
 const intro=$('#sharedIntro');
 const introTop=intro.getBoundingClientRect().top;
 // Capture the actual shuffle-screen button position before changing screens.
 const shuffleActions=main.querySelector('.controls .actions');
 const shuffleActionsBottom=shuffleActions.getBoundingClientRect().bottom;
 heading.textContent=ctx.readingSelection || '조언 - 당신을 위한';
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
  resultView.classList.remove('is-final','is-revealed');
  // The final card anchor is measured from the displayed heading after reveal view opens.
  resultView.style.setProperty('--reveal-top','125px');
  resultView.style.setProperty('--result-width',rw+'px');
  resultView.style.setProperty('--result-height',rw*C.aspect+'px');
  host.style.setProperty('--result-width',rw+'px');
  const reading = $('#resultReading');
  reading.textContent = chosen.cardData.id === 'major-00' ? `새로운 길을 앞두고 모든 것을 미리 알 수는 없습니다. 어디로 이어질지 알 수 없는 길이라도 직접 걸어 보아야 비로소 알게 되는 것들이 있지요. 지금은 익숙한 생각과 정해진 방식에서 벗어나 조금 더 자유롭게 움직여 보세요. 남들이 정해 놓은 기준이나 앞으로의 결과에 지나치게 얽매이지 말고 자신이 가고 싶은 방향을 바라보세요. 처음부터 완벽한 계획이나 확실한 답을 가지고 출발해야 하는 것은 아닙니다. 때로는 새로운 경험 자체가 그동안 알지 못했던 세상을 보여 주기도 합니다. 지금은 모든 가능성을 미리 판단하고 제한하기보다 열린 마음으로 새로운 길에 발을 내디뎌 보세요.` : chosen.cardData.id === 'major-01' ? `같은 도구를 가지고 있어도 누가 어떻게 사용하느냐에 따라 만들어 내는 결과는 달라집니다. 당신이 가진 지식과 경험, 지금까지 익혀 온 능력들을 한번 돌아보세요. 무엇을 할 수 있는지 아는 것도 중요하지만, 그 능력을 언제, 어디에, 어떻게 사용하는지도 중요합니다. 지금 마주한 상황을 살펴보고 무엇이 필요한지 알아보세요. 이미 가진 능력으로 충분한지, 새롭게 익히거나 준비할 것은 없는지 생각해 보는 것도 좋겠습니다. 때로는 더 많은 것을 갖추는 것보다 가진 것을 알맞게 활용하는 일이 더 큰 차이를 만들어 냅니다. 당신의 능력이 필요한 곳을 찾아 그 힘을 제대로 발휘해 보세요.` : chosen.cardData.id === 'major-02' ? `흔들리지 않는 판단에는 그 판단을 뒷받침하는 기준이 있습니다. 무엇이 옳고 그른지, 무엇을 받아들이고 받아들이지 않을지 분명하게 구분할 수 있어야 하지요. 지금 마주한 일을 감정이나 순간의 분위기보다 분명한 기준으로 바라보세요. 어떤 근거로 판단하고 있는지, 그 기준이 일관되게 적용되고 있는지 차분히 살펴보세요. 한번 세운 기준을 상황이 달라질 때마다 쉽게 바꿀 필요는 없습니다. 때로는 변화에 맞춰 움직이는 것보다 자신이 옳다고 판단한 것을 흔들림 없이 지켜 나가는 일이 중요합니다. 지금은 이성적으로 판단하고, 분명하게 세운 기준을 굳건히 유지해 보세요.` : '';
  reading.hidden = !reading.textContent;
  resultView.style.setProperty('--heading-top',Math.round(introTop)+'px');
  resultView.insertBefore(intro,host);
  main.hidden=true;resultView.hidden=false;
  // Match the result buttons to the shuffle buttons on narrow screens.
  // Measure relative to the result container, not an assumed viewport inset.
  resultView.style.setProperty('--mobile-actions-bottom',
    Math.max(0,Math.round(resultView.getBoundingClientRect().bottom-shuffleActionsBottom))+'px');
  const titleBottom=heading.getBoundingClientRect().bottom;
  const viewTop=resultView.getBoundingClientRect().top;
  resultView.style.setProperty('--reveal-top',Math.round(titleBottom-viewTop+12)+'px');
  setState('revealing','선택한 카드를 공개하고 있어요…');
  await moveToCenter(result,host,origin,sourceWidth,angle,rw,
    (card,duration)=>revealMagic.orbit(card,duration));
  await new Promise(resolve=>setTimeout(resolve,C.reveal.pauseBeforeFlip));
  // At the start of the front reveal, animate the entire card host from
  // the central travel destination to the exact original stage top edge.
  const before=host.getBoundingClientRect();
  resultView.classList.add('is-final');
  const after=host.getBoundingClientRect();
  const shift=host.animate([
   {transform:`translate(${before.left-after.left}px,${before.top-after.top}px)`},
   {transform:'translate(0px,0px)'}
  ],{duration:C.reveal.flip,easing:'cubic-bezier(.22,.68,.22,1)'});
  await Promise.all([screenTransition(result),shift.finished]);
  revealMagic.stars(result);
  resultView.classList.add('is-revealed');
  setState('result','카드가 공개됐어요');$('#resultAgain').focus({preventScroll:true});
 }catch(e){const intro=$('#sharedIntro');if(intro.parentElement===resultView){main.insertBefore(intro,stage);}$('#resultSelectionTitle').textContent='마음이 끌리는 카드를 선택하세요';magic.stop();resultView.classList.remove('is-final','is-revealed');main.hidden=false;resultView.hidden=true;ctx.carousel=new Carousel(ctx.cards,stage,refreshCounter,ctx.choose);ctx.carousel.layout();setState('selection','전환을 완료하지 못했어요. 다시 선택해 주세요.');}
}
