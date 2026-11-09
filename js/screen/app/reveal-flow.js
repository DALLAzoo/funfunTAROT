import {CONFIG as C,stageSize} from '../../settings/config/config.js';
import {prepareFront,screenTransition} from '../../motion/reveal/transition.js';
import {moveToCenter} from '../../motion/reveal/center-motion.js';
import {Carousel} from '../../motion/selection/carousel.js';
export async function chooseFlow(ctx,chosen){
 const {stage,container,instruction,main,resultView,magic,revealMagic,$,setState,getState,refreshCounter}=ctx;
 if(getState()!=='selection'||ctx.carousel?.busy||chosen.hidden)return;
 // Lock the fan immediately on the second tap, before awaiting the front image.
 const selectingCarousel=ctx.carousel;
 selectingCarousel.busy=true;
 ctx.errorNotice.hide();
 setState('revealing','선택한 카드를 준비하고 있어요…');
 try{await prepareFront(chosen.cardData,chosen);}catch(e){selectingCarousel.busy=false;selectingCarousel.layout();setState('selection',e.message);ctx.errorNotice.show('앞면 이미지를 불러오지 못했어요.',()=>chooseFlow(ctx,chosen));return;}
 // Finish the 22px pick lift before sampling its final on-screen pose.
 await Promise.all(chosen.getAnimations().map(a=>a.finished.catch(()=>{})));
 // The consultation title is an independent display, not a dropdown DOM child.
 const heading=$('#resultSelectionTitle');
 const intro=$('#sharedIntro');
 const introTop=intro.getBoundingClientRect().top;
 // Record this viewport anchor for the mobile portrait fallback; the CSS keeps
 // landscape controls fixed in the identical position on both screens.
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
  reading.textContent = chosen.cardData.id === 'major-00' ? `새로운 길을 앞두고 모든 것을 미리 알 수는 없습니다. 어디로 이어질지 알 수 없는 길이라도 직접 걸어 보아야 비로소 알게 되는 것들이 있지요. 지금은 익숙한 생각과 정해진 방식에서 벗어나 조금 더 자유롭게 움직여 보세요. 남들이 정해 놓은 기준이나 앞으로의 결과에 지나치게 얽매이지 말고 자신이 가고 싶은 방향을 바라보세요. 처음부터 완벽한 계획이나 확실한 답을 가지고 출발해야 하는 것은 아닙니다. 때로는 새로운 경험 자체가 그동안 알지 못했던 세상을 보여 주기도 합니다. 지금은 모든 가능성을 미리 판단하고 제한하기보다 열린 마음으로 새로운 길에 발을 내디뎌 보세요.` : chosen.cardData.id === 'major-01' ? `같은 도구를 가지고 있어도 누가 어떻게 사용하느냐에 따라 만들어 내는 결과는 달라집니다. 당신이 가진 지식과 경험, 지금까지 익혀 온 능력들을 한번 돌아보세요. 무엇을 할 수 있는지 아는 것도 중요하지만, 그 능력을 언제, 어디에, 어떻게 사용하는지도 중요합니다. 지금 마주한 상황을 살펴보고 무엇이 필요한지 알아보세요. 이미 가진 능력으로 충분한지, 새롭게 익히거나 준비할 것은 없는지 생각해 보는 것도 좋겠습니다. 때로는 더 많은 것을 갖추는 것보다 가진 것을 알맞게 활용하는 일이 더 큰 차이를 만들어 냅니다. 당신의 능력이 필요한 곳을 찾아 그 힘을 제대로 발휘해 보세요.` : chosen.cardData.id === 'major-02' ? `흔들리지 않는 판단에는 그 판단을 뒷받침하는 기준이 있습니다. 무엇이 옳고 그른지, 무엇을 받아들이고 받아들이지 않을지 분명하게 구분할 수 있어야 하지요. 지금 마주한 일을 감정이나 순간의 분위기보다 분명한 기준으로 바라보세요. 어떤 근거로 판단하고 있는지, 그 기준이 일관되게 적용되고 있는지 차분히 살펴보세요. 한번 세운 기준을 상황이 달라질 때마다 쉽게 바꿀 필요는 없습니다. 때로는 변화에 맞춰 움직이는 것보다 자신이 옳다고 판단한 것을 흔들림 없이 지켜 나가는 일이 중요합니다. 지금은 이성적으로 판단하고, 분명하게 세운 기준을 굳건히 유지해 보세요.` : chosen.cardData.id === 'major-03' ? `당신에게 다가오는 것들을 조금 더 편안한 마음으로 받아들여 보세요. 지금은 무언가를 서둘러 이루기보다, 자연스럽게 자라날 수 있도록 시간과 마음을 들여도 좋습니다. 당신이 가진 것, 당신 곁에 머무는 것들에 조금 더 관심을 기울여 보세요. 작은 가능성도 정성껏 돌보면 풍성한 결실로 이어질 수 있습니다. 무언가를 키우고, 성장시키고, 소중한 것을 지켜 내는 일에 당신의 에너지를 사용해 보세요. 지금은 더 멀리 나아가는 것보다 품고 있는 것을 풍요롭게 만드는 시간이 필요할지도 모릅니다.` : chosen.cardData.id === 'major-04' ? `당신이 원하는 방향이 있다면, 이제는 스스로 앞장서 보세요. 지금까지 쌓아 온 경험과 판단을 믿고, 어떻게 이끌어 갈지 결정해도 좋습니다. 누군가가 먼저 움직이기를 기다리기보다 당신이 뜻을 세우고 그 뜻에 따라 행동해 보세요. 때로는 흔들리지 않는 태도와 단호한 결정이 필요합니다. 당신이 선택한 일이라면 그에 따르는 책임도 기꺼이 받아들이세요. 지금은 자신의 뜻을 분명히 하고, 그 뜻을 현실로 만들어 가세요.` : chosen.cardData.id === 'major-05' ? `사람마다 생각이 다르고, 세상을 바라보는 기준도 다릅니다. 서로 다른 생각이 만났을 때 누가 옳고 그른지를 가리기보다 먼저 이해하고 존중하는 마음을 가져 보세요. 자신이 오랫동안 지켜 온 가치와 믿음은 쉽게 흔들리지 않아도 좋습니다. 다만 그 기준을 다른 사람에게 강요할 필요는 없습니다. 때로는 상대의 마음을 헤아리고, 서로의 차이를 품어 주는 태도가 어떤 말이나 행동보다 더 큰 힘을 발휘하기도 합니다. 지금은 무언가를 억지로 바꾸거나 앞으로 나아가려고 애쓰기보다 소중하게 여기는 가치를 지키면서 주변과 조화를 이루어 보세요. 강한 힘으로 이끄는 것만이 사람을 움직이는 방법은 아닙니다. 존중과 포용으로 서로의 마음이 어우러질 수 있도록 당신의 마음을 넓혀 보세요.` : chosen.cardData.id === 'major-06' ? `눈앞에 보이는 모습과 그 안에 담긴 마음이 언제나 같은 것은 아닙니다. 마음이 끌려 움직일 때도 있고, 깊이 생각하지 않았지만 뜻밖의 경험을 하게 될 때도 있지요. 그 자체가 반드시 좋거나 나쁜 것은 아닙니다. 다만 지금은 겉으로 드러난 모습만으로 모든 것을 판단하지 마세요. 어떤 마음이 담겨 있는지, 무엇을 기대하고 있는지, 그 행동이 자신에게 어떤 의미인지 한번 살펴보세요. 깊은 의미를 원한다면 그에 맞는 마음이 있는지 확인하고, 가벼운 경험을 원한다면 그것 역시 스스로 알고 선택하세요. 중요한 것은 눈앞에 보이는 것과 그 안에 실제로 담긴 것을 혼동하지 않는 것입니다.` : chosen.cardData.id === 'major-07' ? `앞으로 나아가야 할 때는 망설임보다 움직이는 힘이 필요합니다. 방향을 정했다면 생각에만 머무르지 말고 직접 행동으로 옮겨 보세요. 전차는 빠르게 달리고, 한번 지나온 길을 그대로 되돌아가지 않습니다. 그만큼 앞으로 나아가는 힘이 강하지만 그 움직임에는 책임도 따르지요. 지금은 자신의 추진력을 믿고 적극적으로 일을 진행해 보세요. 다만 속도를 내기 전에 어디로 향하고 있는지, 되돌리기 어려운 결정은 없는지 분명하게 확인하세요. 충분히 판단했다면 더 이상 머뭇거리지 말고 힘 있게 앞으로 나아가세요.` : chosen.cardData.id === 'major-08' ? `같은 일을 하더라도 얼마나 큰 힘을 쏟느냐에 따라 그 영향은 달라집니다. 작은 힘으로는 움직이지 않던 것도 강한 힘이 더해지면 크게 달라질 수 있지요. 지금은 자신이 가진 힘을 충분히 발휘해 보세요. 마음먹은 일에 더 큰 힘을 싣고, 필요한 곳에 자신의 능력과 에너지를 적극적으로 사용해 보세요. 다만 강한 힘은 좋은 것뿐 아니라 좋지 않은 것까지 더 크게 만들기도 합니다. 무엇에 힘을 쏟고 있는지 살펴보고, 키우고 싶은 것에 그 힘을 집중해 보세요. 지금은 자신의 힘을 작게 여기기보다 그 힘이 만들어 낼 변화를 생각하며 힘 있게 움직여 보세요.` : chosen.cardData.id === 'major-09' ? `빛나는 능력을 가졌다고 해서 언제나 그 능력을 드러내야 하는 것은 아닙니다. 때로는 앞에 나서지 않고 자신의 자리에서 조용히 지내는 것도 하나의 선택이 될 수 있지요. 지금은 무언가를 크게 바꾸거나 새로운 움직임을 만들기보다 이미 가지고 있는 것을 지켜 보세요. 자신이 쌓아 온 경험과 능력을 믿고, 굳이 모든 일에 나서거나 그 힘을 증명하려 애쓰지 않아도 됩니다. 그렇다고 아무것도 하지 말라는 뜻은 아닙니다. 자신이 해야 할 일은 꾸준히 하면서 소중하게 유지해 온 것들이 흔들리지 않도록 지켜 주세요. 지금은 더 멀리 나아가는 것보다 자신의 자리와 현재의 상태를 조용하고 굳건하게 지켜 보세요.` : chosen.cardData.id === 'major-10' ? `언제나 같은 지점에 머물 수는 없듯, 상황도 끊임없이 변해 갑니다. 잘 풀리는 때가 있는가 하면 뜻대로 되지 않는 때도 찾아오지요. 중요한 것은 언제나 좋은 상황에 있는 것이 아니라 지금이 어떤 시기인지 알아보는 것입니다. 바람이 불어오는 방향을 살피듯 상황이 어떻게 움직이는지 살펴보세요. 기회가 무르익었다면 그 흐름을 활용하고, 여건이 달라졌다면 방법도 달리해 보세요. 흐름은 멈추지 않습니다. 그 안에서 무엇을 준비하고 어떻게 움직일지 당신만의 방법을 찾아보세요.` : chosen.cardData.id === 'major-11' ? `무엇이 옳고 그른지, 무엇을 받아들이고 선택할지는 사람마다 기준이 다릅니다. 같은 상황을 바라보더라도 서로 다른 판단을 내릴 수 있지요. 지금 당신이 중요하게 여기는 기준은 무엇인가요? 그 기준이 어디에서 비롯되었는지, 왜 자신에게 옳다고 여겨지는지 한번 살펴보세요. 스스로 납득할 수 있는 기준을 세웠다면 이제는 분명하게 판단하고 그 판단에 따라 행동해 보세요. 기준이 뚜렷해야 무엇을 받아들이고 무엇을 거절할지도 결정할 수 있습니다.` : chosen.cardData.id === 'major-12' ? `모두가 같은 세상을 바라보더라도
그 안에서 발견하는 것은
저마다 다를 수 있습니다.
누군가에게는 당연한 것이
다른 사람에게는 낯설게 보이고,
아무도 주목하지 않았던 곳에서
새로운 생각이 떠오르기도 하지요.
지금 마주한 상황을
익숙한 방식으로만 바라보지 마세요.
다른 시선에서 살펴보면
미처 발견하지 못했던 모습이나
새로운 가능성이 보일 수도 있습니다.
남들이 생각하는 방식과 다르다고 해서
자신만의 생각을 쉽게 버릴 필요는 없습니다.
그 차이에서 새로운 아이디어가 나오고,
누구도 떠올리지 못했던
독창적인 해결책이 만들어지기도 합니다.
지금은 익숙한 답을 반복하기보다
새로운 시각으로 바라보고,
당신만의 생각을 펼쳐 보세요.` : chosen.cardData.id === 'major-13' ? `모든 것에는 시작이 있듯
언젠가는 끝도 찾아옵니다.
오랫동안 이어져 온 일도,
소중하게 간직했던 것도
영원히 같은 모습으로 남을 수는 없지요.
때로는 끝을 받아들이는 일이
새로운 시작을 준비하는 것보다
더 어려울 수 있습니다.
하지만 끝나야 할 것을
억지로 붙잡는다고 해서
그 시간이 계속되는 것은 아닙니다.
지금 마주한 일에서
무엇을 마무리해야 하는지,
무엇을 더 이상 이어 가지 않아도 되는지
살펴보세요.
끝낼 때가 되었다면
미련 때문에 결정을 미루지 마세요.
모든 끝에 새로운 시작이
기다리고 있는 것은 아닙니다.
그저 하나의 일이
그 자리에서 끝나는 것일 수도 있지요.
지금은 그 끝을 인정하고
마무리해야 할 것을
분명하게 마무리해 보세요.` : chosen.cardData.id === 'major-14' ? `무엇이든 지나치게 많거나
부족하면 균형이 흐트러지기 마련입니다.
어느 한쪽에 치우쳐 있다면
그 차이를 조금씩 조절해 보세요.
너무 앞서 나가고 있다면 속도를 늦추고,
부족한 부분이 있다면 채워 가면서
서로 어울릴 수 있는 상태를 만들어 보세요.
서로 다른 것들도
적절하게 어우러지면
하나의 조화로운 모습을 이룰 수 있습니다.
지금은 무언가를 더 강하게 밀어붙이거나
한쪽을 완전히 버리기보다
각각의 상태를 살펴보고
알맞게 맞추어 가는 것이 중요합니다.
과한 것은 덜어 내고,
부족한 것은 채우면서
흐트러진 균형을 바로잡아 보세요.
지금 필요한 것은
어느 한쪽으로 치우치는 선택이 아니라
서로 조화를 이루도록
상태를 조절하는 것입니다.` : chosen.cardData.id === 'major-15' ? `무언가에 강하게 끌리는 데에는
그만한 이유가 있을 것입니다.
눈앞에 보이는 것이 매력적이고,
실제로 얻을 만한 가치가 있다면
쉽게 마음을 떼기 어렵겠지요.
하지만 가치 있는 것을 얻는다고 해서
그 결과가 반드시
자신에게 좋은 것은 아닙니다.
지금 당신을 강하게 끌어당기는 것이
무엇인지 살펴보세요.
그것을 통해 무엇을 얻을 수 있는지,
그 대신 무엇을 내주어야 하는지,
마지막에는 무엇이 남을지
생각해 보세요.
당장의 만족이나 성과에 이끌려
그 뒤에 따라올 결과까지
놓치지는 마세요.
처음에는 달콤했던 것이
나중에는 자신을 힘들게 만드는
원인이 될 수도 있습니다.
지금은 눈앞의 매력만 바라보기보다
그 끝에 남을 결과까지 살펴보고
무엇을 선택할지 판단해 보세요.` : chosen.cardData.id === 'major-16' ? `하늘 높이 솟아오른 탑은
언제까지나 그 자리에 서 있을 것처럼 보입니다.
하지만 어느 날 갑자기 내리친 번개가 
보이지 않던 균열을 파고들어
굳건한 줄 알았던 것들을 한순간에 산산조각 냅니다.
오랫동안 쌓아온 것이라도
단 한 번의 충격으로 무너질 수 있고,
한번 부서진 것은 이전의 모습으로 되돌릴 수 없습니다.
지금까지 아무 일도 없었다는 이유로
앞으로도 모든 것이 괜찮을 것이라 여기기 보다
그동안 대수롭지 않게 넘겼던 일이나
당연하게 믿어왔던 것들을 한 번 돌아보세요.
지금은 무언가를 더 높이 쌓아 올리기보다
이미 이루어 놓은 것들을 살피고,
지키는 데 마음을 두는 것이 좋겠습니다.
아무리 단단해 보이는 탑이라도
예고 없이 무너질 수 있다는 사실을 기억하세요.` : chosen.cardData.id === 'major-17' ? `밤하늘에 흩어져 있는 별들은 저마다 다른 자리에서 빛나고 있습니다.
하나의 별만 바라보면 그저 작은 빛일 뿐이지만,
여러 별을 이어 보면 하나의 별자리가 나타납니다.
당신도 이와 다르지 않습니다.
지금은 서로 관계없어 보이는 경험이나 만남,
작은 기회와 가능성에도 관심을 가져보세요.
각각은 별다른 의미가 없어 보여도
서로 연결되면서 전혀 다른 그림을 만들어 낼 수 있습니다.
하나의 가능성만 바라보기보다
주변에 펼쳐진 여러 가능성을 함께 살펴보세요.
그동안 쌓아온 경험이 새로운 기회와 이어지기도 하고,
서로 다른 생각들이 만나 뜻밖의 방향을 보여주기도 합니다.
별 하나로는 볼 수 없었던 모습이
여러 별이 모였을 때 비로소 드러나듯,
당신의 삶에서도 새로운 그림이 나타날 수 있습니다.
지금은 흩어져 있는 가능성들을 발견하고,
그것들을 연결해 당신만의 별자리를 그려볼 때입니다.` : chosen.cardData.id === 'major-18' ? `어두운 밤길을 달빛에 의지해 걸으면
발밑은 조금씩 알아 볼 수 있지만,
빛이 닿지 않는 저 너머에는 무엇이 기다리고 있는지 알 수 없습니다.
때로는 익숙한 나무의 그림자조차 낯선 형상으로 보이고, 
멀리서 들려오는 작은 소리 하나에도 수많은 상상이 피어나지요.
하지만 어둠 속에서 느껴지는 모든 것이 진실은 아니죠..
당신의 지금도 이와 비슷합니다
지금 알고 있는 것이
전체의 모습은 아닐 수 있습니다.
보이는 부분과 아직 알지 못하는 부분을
구분해서 살펴보세요.
모르는 것이 있다는 사실은
새로운 세상에 대한 궁금증과
설렘을 만들어 주기도 합니다.
상상했던 모습이 실제로 어떨지는
그곳에 다가가 보아야
조금씩 알게 되겠지요.
새로운 환경에 들어선다면
그곳에 이미 자리 잡은 방식과
익숙하지 않은 규칙들도
하나씩 알아가 보세요.
지금은 모든 것을 확실하게
판단하려 하기보다
보이는 만큼 이해하고,
새롭게 알게 되는 것들을 통해
조금씩 시야를 넓혀 보세요.
시간이 흐르고 더 많은 빛이 스며들면, 
낯설게 보였던 풍경도 조금씩 본래의 모습을 드러낼 것입니다.` : chosen.cardData.id === 'major-19' ? `찬란한 햇살이 세상을 비추면
어둠에 가려져 있던 풍경도 선명하게 모습을 드러내고,
따스한 빛을 머금은 생명들은 저마다의 빛깔로 피어납니다.
태양은 어느 한 곳에만 머물지 않고
세상 곳곳에 빛과 온기를 전합니다.
그 빛 아래에서는 작은 새싹도 자라나고,
활짝 피어난 꽃들도 제 아름다움을 드러내지요.
지금은 당신이 지닌 밝은 에너지와 능력을
아낌없이 펼쳐 보일 때입니다.
자신이 잘하는 일에는 더욱 힘을 실어주고,
마음이 이끄는 일에는 기쁜 마음으로 다가가 보세요.
당신의 활기와 열정은
스스로의 성장을 이끌 뿐 아니라
주변에도 따뜻한 생기를 전할 것입니다.
기쁨이 찾아온다면 마음껏 웃고,
좋은 결실을 얻었다면 그 순간을 충분히 즐기세요.
햇살 아래 피어난 꽃이
자신의 아름다움을 감출 이유가 없듯,
당신에게 찾아온 행복과 성취도
있는 그대로 빛나게 두세요.
지금은 삶이 건네는 밝고 풍요로운 순간을
온 마음으로 누릴 때입니다.` : chosen.cardData.id === 'major-20' ? `깊이 잠든 세상에 나팔 소리가 울려 퍼지면,
고요했던 풍경에도 새로운 움직임이 시작됩니다.
오랫동안 굳게 닫혀 있던 문이 열리고,
멈춰 있던 시간 속에도 다시 생기가 깃들지요.
살아가다 보면 우리의 의지나 노력만으로는
만들어 낼 수 없는 순간들이 찾아옵니다.
뜻밖의 소식이 새로운 길을 열기도 하고,
우연히 찾아온 만남이 삶의 방향을 바꾸기도 합니다.
지금은 당신에게 다가오는 변화와 기회에
마음을 열어둘 때입니다.
그것이 바라던 모습과 다르더라도
그 안에 어떤 가능성이 담겨 있는지 살펴보세요.
세상을 깨우는 나팔 소리처럼,
어떤 기회는 준비된 사람만을 기다리지 않고
예고 없이 찾아오기도 합니다.
모든 순간을 자신의 뜻대로 움직일 필요는 없습니다.
때로는 삶이 건네는 뜻밖의 선물을
기꺼이 받아들이는 것만으로도
새로운 이야기가 시작되니까요.
당신에게 울려 퍼지는 새로운 부름을 맞이하고,
그 안에서 펼쳐질 가능성을 열린 마음으로 받아들이세요.` : chosen.cardData.id === 'major-21' ? `한 그루의 나무가 세상의 전부였던 애벌레는
마침내 나비가 되어 드넓은 하늘을 날아오릅니다.
이제 그 앞에는 저마다 다른 빛깔과 향기를 품은 꽃들이 피어나고,
어디에서든 원하는 꽃의 달콤한 꿀을 맛볼 수 있습니다.
같은 존재이지만 살아가는 세상은 달라졌습니다.
한때는 닿을 수 없었던 곳까지, 이제는 자유롭게 오갈 수 있습니다.
당신 역시 지나온 모든 과정을 거쳐
마침내 새로운 차원의 세계에 도달했습니다.
그동안 쌓아온 경험과 능력은
당신이 이룬 완성의 일부가 되었고,
이제 그 성취가 선사하는 풍요로움을 누릴 때입니다.
눈앞에 펼쳐진 수많은 가능성 가운데
당신이 진정 원하는 것을 자유롭게 선택하세요.
이미 이룬 결실을 충분히 즐겨도 좋고,
더 넓은 세계에서 새로운 기쁨을 찾아도 좋습니다.
어느 쪽이든 그 선택은 당신의 것입니다.
당신이 완성한 세계 안에서
이제는 원하는 삶의 풍경을 마음껏 펼쳐보세요.` : chosen.cardData.id === 'cups-page' ? `마음이 원하는 것을 분명히 알게 되면, 세상은 그 마음을 중심으로 조금씩 달라 보이기 시작합니다. 좋아하는 것에는 이유가 생기고, 바라는 것에는 저마다의 의미가 깃들지요. 하지만 마음이 정해졌다고 해서 세상까지 같은 방향으로 움직이는 것은 아닙니다. 때로는 너무 확고한 생각이 다른 가능성을 보지 못하게 하기도 합니다. 자신이 원하는 것을 소중히 간직하세요. 다만 그 마음이 세상의 전부가 되지는 않도록, 아직 알지 못하는 이야기에도 귀를 기울여 보세요.` : chosen.cardData.id === 'wands-page' ? `하고 싶은 일이 있어도 마음처럼 움직일 수 없는 순간이 있습니다. 간절히 바라는 마음이 있어도 언제나 원하는 때에 기회가 찾아오는 것은 아니지요. 하지만 아직 기회가 없다는 이유로 자신이 잘할 수 있는 것까지 잊지는 마세요. 지금 할 수 있는 작은 일부터 시작해 보세요. 자신이 잘하는 것은 더욱 갈고닦고, 부족한 것은 하나씩 채워가세요. 기다림이 그저 흘러가는 시간이 아니라 스스로를 준비하는 시간이 되도록 말입니다. 언젠가 움직일 기회가 찾아왔을 때, 오랫동안 품어온 바람을 자신의 행동으로 이어갈 수 있도록요.` : chosen.cardData.id === 'swords-page' ? `원하는 대로만 할 수 없는 상황에서 자신이 가진 능력만으로 충분할지 두려워지기도 합니다. 내려놓기에는 책임이 남아 있고, 붙잡고 있기에는 두려움이 앞서지요. 하지만 견디고 있다는 이유만으로 그 무게가 가벼워지는 것은 아닙니다. 두려움을 부끄러워하지 마세요. 그것은 때로 자신이 감당해야 할 일이 얼마나 큰지를 알고 있다는 뜻이기도 합니다. 지금은 무리하게 강해지려 하기보다 자신이 감당할 수 있는 만큼을 알아가세요. 모든 무게를 견디는 사람이 아니라, 그 무게를 다룰 줄 아는 사람이 되어야 합니다.` : chosen.cardData.id === 'pentacles-page' ? `무언가를 얻어도 기쁨보다 망설임이 먼저 찾아오기도 합니다 내게 주어진 것이 얼마나 귀한지, 정말 나의 몫이 되어도 되는 것인지 알 수 없기 때문이지요. 가치를 알지 못하면 소중한 것도 평범하게 지나칠 수 있고, 뜻밖의 행운마저 부담이 되기도 합니다. 그러니 서둘러 붙잡지도, 두려워서 밀어내지도 마세요. 지금은 눈앞에 주어진 것이 어떤 의미를 지니는지 알아갈 시간입니다. 무언가를 얻는 일만큼이나 그 가치를 알아보는 일도 중요하니까요.` : chosen.cardData.id === 'swords-knight' ? `지금 당신에게 필요한 것은 자신의 생각과 뜻을 분명히 하고, 그에 맞는 행동을 실천하는 자세입니다. 자신이 이루고자 하는 일에 순수한 마음으로 임하세요. 그 일을 위해 무엇이 필요한지 살펴보고, 자신의 목적에 도움이 되는 것을 선택하세요. 필요하지 않은 것에는 힘을 나누기보다 정말 중요한 일에 자신의 능력을 기울이세요. 전하고 싶은 생각이 있다면 상대가 이해할 수 있도록 분명하게 표현하고, 스스로 선택한 일이 있다면 그 선택을 행동으로 보여주세요. 당신에게는 무엇을 선택할지 판단하고, 자신이 선택한 바를 향해 힘차게 나아갈 능력이 있습니다. 어떤 결과가 기다리고 있는지는 아직 알 수 없더라도, 지금 자신이 할 수 있는 일에는 마음을 다해 임하세요. 당신의 생각과 말, 행동이 하나의 뜻을 향해 나아가도록 자신의 능력을 믿고 적극적으로 실천하세요.` : chosen.cardData.id === 'wands-knight' ? `지금 당신에게 필요한 것은 마음속에 품은 열정을 실제 행동으로 옮기는 것입니다. 무언가를 해보고 싶은 마음이 있다면 그 마음을 행동으로 표현해 보세요. 직접 나서서 시도하고, 자신이 가진 힘과 에너지를 아낌없이 발휘하세요. 생각하고 계획하는 것만큼 직접 움직이며 경험하는 일에도 소중한 가치가 있습니다. 당신이 먼저 행동함으로써 새로운 일이 시작될 수도 있고, 그 움직임이 또 다른 변화를 만들어 낼 수도 있습니다. 하고 싶은 말이 있다면 적극적으로 표현하고, 해보고 싶은 일이 있다면 직접 부딪쳐 보세요. 때로는 한 사람의 힘찬 움직임이 주변에 새로운 활기를 불어넣기도 합니다. 불꽃이 자신의 빛과 열기를 내뿜듯, 당신 안에 있는 열정을 마음껏 펼쳐 보세요. 지금은 자신의 행동력을 믿고, 하고 싶은 일을 적극적으로 실천할 때입니다.` : chosen.cardData.id === 'cups-knight' ? `지금 당신에게 필요한 것은 자신이 이루고자 하는 일에 깊은 관심을 기울이고, 그 일을 위해 충분히 생각하고 준비하는 것입니다. 마음에 두고 있는 일이 있다면 그 일이 어떻게 이루어지면 좋을지, 무엇을 알아야 하고 어떤 준비가 필요한지 차근차근 살펴보세요. 눈앞의 일뿐 아니라 앞으로 펼쳐질 여러 상황도 헤아려 보세요. 어떤 방법이 도움이 될지, 무엇을 먼저 준비하면 좋을지 생각하며 자신만의 계획을 세워 보세요. 하나의 일에 진지하게 관심을 기울이다 보면 더 많은 것을 알게 되고, 그동안 보이지 않았던 방법도 발견하게 됩니다. 그렇게 쌓은 지식과 생각을 자신이 이루고자 하는 일을 위해 활용하세요. 직접 움직이는 것만이 행동은 아닙니다. 방법을 찾고, 계획을 세우고, 필요한 것을 준비하는 시간도 목적을 향해 나아가는 과정입니다. 한 걸음 앞을 내다보는 생각이 다음 걸음을 위한 길을 밝혀 주듯, 지금은 자신의 마음과 지혜를 기울여 앞으로의 일을 차분히 준비하세요.` : chosen.cardData.id === 'pentacles-knight' ? `지금 당신에게 필요한 것은 자신이 가진 능력의 가치를 알고, 그 능력을 자신에게 이로운 곳에 사용하는 것입니다. 무언가를 잘할 수 있다는 것은 당신이 가진 소중한 재능입니다. 그 재능을 어디에 발휘할지, 어떤 일에 시간과 노력을 기울일지는 스스로 선택할 수 있습니다. 자신이 참여하려는 일이 어떤 이익과 결실을 가져다주는지, 생활의 안정과 안전에도 도움이 되는지 현실적으로 살펴보세요. 자신에게 가치 있는 일이라면 기꺼이 나서서 능력을 발휘하고, 노력한 만큼의 대가도 당당하게 바라세요. 좋은 뜻을 위해 애쓰는 일도 의미 있지만, 자신의 삶을 돌보고 실질적인 이익을 얻는 일에도 충분한 가치가 있습니다. 때로는 자신에게 무엇이 남는지 살피는 일이 앞으로의 삶을 더욱 단단하게 만들어 줍니다. 당신의 시간과 재능이 당신에게도 값진 결실로 돌아올 수 있도록, 지금은 자신의 이익과 안정을 생각하며 능력을 발휘할 곳을 선택하세요.` : '';
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
  const tabletCardGap=window.matchMedia?.('(min-width:700px) and (min-height:550px) and (hover:none) and (pointer:coarse)').matches?24:12;
  resultView.style.setProperty('--reveal-top',Math.round(titleBottom-viewTop+tabletCardGap)+'px');
  setState('revealing','선택한 카드를 공개하고 있어요…');
  await moveToCenter(result,host,origin,sourceWidth,angle,rw,
    (card,duration)=>revealMagic.orbit(card,duration));
  await new Promise(resolve=>setTimeout(resolve,C.reveal.pauseBeforeFlip));
  // At the start of the front reveal, animate the entire card host from
  // the central travel destination to the exact original stage top edge.
  const before=host.getBoundingClientRect();
  resultView.classList.add('is-final');
  const after=host.getBoundingClientRect();
  const physicalDx=before.left-after.left,physicalDy=before.top-after.top;
  const shift=host.animate([
   {transform:`translate(${physicalDx}px,${physicalDy}px)`},
   {transform:'translate(0px,0px)'}
  ],{duration:C.reveal.flip,easing:'cubic-bezier(.22,.68,.22,1)'});
  await Promise.all([screenTransition(result),shift.finished]);
  revealMagic.stars(result);
  resultView.classList.add('is-revealed');
  setState('result','카드가 공개됐어요');$('#resultAgain').focus({preventScroll:true});
 }catch(e){const intro=$('#sharedIntro');if(intro.parentElement===resultView){main.insertBefore(intro,stage);}$('#resultSelectionTitle').textContent='마음이 끌리는 카드를 선택하세요';magic.stop();resultView.classList.remove('is-final','is-revealed');main.hidden=false;resultView.hidden=true;ctx.carousel=new Carousel(ctx.cards,stage,refreshCounter,ctx.choose);ctx.carousel.layout();setState('selection','전환을 완료하지 못했어요. 다시 선택해 주세요.');}
}
