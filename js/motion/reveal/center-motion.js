import {CONFIG as C} from '../../settings/config/config.js';

// Translation only: a rotated card's axis-aligned bounds are not its real size.
export function travelFrames(origin, destination, angle, scale=1) {
 const dx=origin.left+origin.width/2-destination.left-destination.width/2;
 const dy=origin.top+origin.height/2-destination.top-destination.height/2;
 return [
  {transform:`translate(${dx}px,${dy}px) rotateZ(${angle}deg) scale(${scale})`},
  {transform:`translate(0px,0px) rotateZ(${angle}deg) scale(1)`}
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
 // Commit the arrival pose before cancelling the travel animation to avoid a snap.
 card.style.transform=`rotateZ(${angle}deg)`;
 approach.cancel();
 card.dataset.revealPhase='arrival';
 // Keep the card at its final size. Finish with a restrained rotation only,
 // so the arrival feels deliberate without an elastic scale pulse.
 const settle=card.animate([
  {offset:0,transform:`rotateZ(${angle}deg)`},
  {offset:1,transform:'rotateZ(0deg)'}
 ],{duration:Math.max(280,Math.min(C.reveal.arrival,420)),easing:'cubic-bezier(.16,1,.3,1)',fill:'forwards'});
 await settle.finished;
 card.style.transform='none';settle.cancel();card.dataset.revealPhase='centered';
}
