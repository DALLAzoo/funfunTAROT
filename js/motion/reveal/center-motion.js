import {CONFIG as C} from '../../settings/config/config.js';

// Translation only: a rotated card's axis-aligned bounds are not its real size.
export function travelFrames(origin, destination, angle, scale=1) {
 const dx=origin.left+origin.width/2-destination.left-destination.width/2;
 const dy=origin.top+origin.height/2-destination.top-destination.height/2;
 return [
  {transform:`translate(${dx}px,${dy}px) rotateZ(${angle}deg) scale(${scale})`},
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
 await Promise.all([approach.finished,gather(card,C.reveal.travel)]);
 // Position and rotation finish together in one continuous travel animation.
 // There is no separate post-arrival alignment movement.
 card.style.transform='none';
 approach.cancel();
 card.dataset.revealPhase='centered';
}
