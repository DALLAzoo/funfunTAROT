import {CONFIG as C} from '../../settings/config/config.js';
// Front images are requested only after a user selects a card. A pending request
// is reused by the second tap, preventing two concurrent image downloads.
const frontRequests = new WeakMap();
export function prepareFront(data,card){
 if(!data.frontImage) return Promise.resolve();
 if(!card) return Promise.reject(new Error('선택한 카드가 없습니다.'));
 const image=card.querySelector('.card-front img');
 if(!image) return Promise.reject(new Error('카드 앞면을 표시하지 못했어요.'));
 const cached=frontRequests.get(card);
 if(cached) return cached;
 const url=image.dataset.frontSrc || new URL(data.frontImage,document.baseURI).href;
 const promise=new Promise((resolve,reject)=>{
  const clean=()=>{image.removeEventListener('load',ready);image.removeEventListener('error',fail);};
  const fail=()=>{clean();reject(new Error('앞면 이미지 로딩 실패'));};
  const ready=()=>{
   clean();
   if(!image.naturalWidth){fail();return;}
   if(image.decode) image.decode().then(resolve,fail);
   else resolve();
  };
  image.addEventListener('load',ready);
  image.addEventListener('error',fail);
  image.src=url;
 }).catch(error=>{
  frontRequests.delete(card);
  image.removeAttribute('src');
  throw error;
 });
 frontRequests.set(card,promise);
 return promise;
}
export async function screenTransition(card){
 // A single element, in its final centered host, rotates exactly once.
 // No scene swap at the 90-degree edge, masks, curtains, or opacity animations.
 const inner=card.querySelector('.card-inner');
 inner.getAnimations().forEach(a=>a.cancel());
 inner.style.transform='rotateY(0deg)';
 const duration=C.reveal.flip;
 const animation=inner.animate([{transform:'rotateY(0deg)'},{transform:'rotateY(180deg)'}],
  {duration,easing:'cubic-bezier(.25,.1,.25,1)',fill:'forwards'});
 await animation.finished;
 inner.style.transform='rotateY(180deg)';
 animation.cancel();
 card.classList.add('is-revealed');
 card.querySelector('.card-front').setAttribute('aria-hidden','false');
 card.querySelector('.card-back').setAttribute('aria-hidden','true');
}
