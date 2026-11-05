import {CONFIG as C} from '../../settings/config/config.js';
export async function prepareFront(data){
 if(!data.frontImage)return;
 await new Promise((resolve,reject)=>{const im=new Image();im.onload=()=>resolve();im.onerror=()=>reject(new Error('앞면 이미지 로딩 실패'));im.src=new URL(data.frontImage,document.baseURI).href;});
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
