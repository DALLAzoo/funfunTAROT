import {CONFIG as C} from '../../settings/config/config.js';

// Translation only: a rotated card's axis-aligned bounds are not its real size.
export function travelFrames(origin, destination, angle) {
 const dx=origin.left+origin.width/2-destination.left-destination.width/2;
 const dy=origin.top+origin.height/2-destination.top-destination.height/2;
 return [
  {transform:`translate(${dx}px,${dy}px) rotateZ(${angle}deg)`},
  {transform:`translate(0px,0px) rotateZ(${angle}deg)`}
 ];
}
export async function moveToCenter(card, host, origin, sourceWidth, angle, resultWidth, gather) {
 // Reserve the final result layout so text and the center stay still during growth.
 host.style.width=resultWidth+'px';host.style.height=resultWidth*C.aspect+'px';
 card.style.width=sourceWidth+'px';card.style.height=sourceWidth*C.aspect+'px';
 const destination=card.getBoundingClientRect();
 card.dataset.revealPhase='travel';
 const approach=card.animate(travelFrames(origin,destination,angle),
  {duration:C.reveal.travel,easing:'cubic-bezier(.22,.65,.3,1)',fill:'forwards'});
 await Promise.all([approach.finished,gather(card,C.reveal.travel)]);
 // Keep the same visible size while switching to the final layout dimensions.
 card.dataset.revealPhase='arrival';
 card.style.width=resultWidth+'px';card.style.height=resultWidth*C.aspect+'px';
 const scale=sourceWidth/resultWidth;
 const settle=card.animate([
  {transform:`rotateZ(${angle}deg) scale(${scale})`},
  {transform:'rotateZ(0deg) scale(1)'}
 ],{duration:C.reveal.arrival,easing:'cubic-bezier(.22,.65,.3,1)',fill:'forwards'});
 approach.cancel();
 await settle.finished;
 card.style.transform='none';settle.cancel();card.dataset.revealPhase='centered';
}
