import {CONFIG as C} from '../../settings/config/config.js';
const traveling=new WeakMap();

export function resizeResultCard(card,host,width){
 const animation=traveling.get(card);
 const box=card.getBoundingClientRect();
 const oldWidth=parseFloat(card.style.width)||width;
 const matrix=new DOMMatrixReadOnly(getComputedStyle(card).transform);
 const angle=Math.atan2(matrix.b,matrix.a)*180/Math.PI;
 const scale=Math.hypot(matrix.a,matrix.b)*oldWidth/width;
 host.style.width=width+'px';host.style.height=width*C.aspect+'px';
 card.style.width=width+'px';card.style.height=width*C.aspect+'px';
 if(!animation)return;
 const progress=animation.effect.getComputedTiming().progress;
 if(progress===null||progress>=1)return;
 const destination=host.getBoundingClientRect();
 const current=travelFrames(box,destination,angle,scale)[0];
 const frames=[{...current,offset:0}];
 if(progress>0)frames.push({...current,offset:progress});
 frames.push({transform:'translate(0px,0px) rotateZ(0deg) scale(1)',offset:1});
 // Keep the same animation/currentTime and settle at the resized host.
 animation.effect.setKeyframes(frames);
}


// Translation only: a rotated card's axis-aligned bounds are not its real size.
export function travelFrames(origin, destination, angle, scale=1) {
 const dx=origin.left+origin.width/2-destination.left-destination.width/2;
 const dy=origin.top+origin.height/2-destination.top-destination.height/2;
 // v56: both the source card and destination host use viewport coordinates.
 const localX=dx;
 const localY=dy;
 return [
  {transform:`translate(${localX}px,${localY}px) rotateZ(${angle}deg) scale(${scale})`},
  {transform:'translate(0px,0px) rotateZ(0deg) scale(1)'}
 ];
}
export async function moveToCenter(card, host, origin, sourceWidth, angle, resultWidth, gather) {
 // Reserve the final result layout so text and the center stay still during growth.
 host.style.width=resultWidth+'px';host.style.height=resultWidth*C.aspect+'px';
 card.style.width=resultWidth+'px';card.style.height=resultWidth*C.aspect+'px';
 const destination=card.getBoundingClientRect();
 card.dataset.revealPhase='travel';
 const approach=card.animate(travelFrames(origin,destination,angle,sourceWidth/resultWidth),
  {duration:C.reveal.travel,easing:'cubic-bezier(.22,.65,.3,1)',fill:'forwards'});
 traveling.set(card,approach);
 try{await Promise.all([approach.finished,gather(card,C.reveal.travel)]);}
 finally{traveling.delete(card);}
 // Position and rotation finish together in one continuous travel animation.
 // There is no separate post-arrival alignment movement.
 card.style.transform='none';
 approach.cancel();
 card.dataset.revealPhase='centered';
}
