import {CONFIG as C,stageSize} from './config.js';
import {slotPose,mod} from './cinema-core.js';
import {transform,cardSize} from './card-animation.js';
export class Carousel {
 constructor(cards,stage,onIndex,onChoose){
  this.cards=cards;this.stage=stage;this.index=0;this.busy=false;this.onIndex=onIndex;this.onChoose=onChoose;
  this.pointer=null;this.lastDrag=-Infinity;this.offset=0;this.selectedCard=null;this.abort=new AbortController();
  const opt={signal:this.abort.signal};
  // Resolve taps from the fan slots, not the overlapping card elements.
  // The outer two cards may be partly covered or outside the stage bounds.
  stage.addEventListener('click',e=>this.clickSlot(e),opt);
  // Keyboard activation of a focused card keeps its original target.
  cards.forEach((card,i)=>card.addEventListener('click',e=>{
   if(e.detail!==0)return;
   if(!this.busy&&!this.pointer&&Math.abs(this.distance(i))<=(C.counts.visible-1)/2)this.tap(card);
  },opt));
  stage.addEventListener('pointerdown',e=>this.down(e),opt);
  window.addEventListener('pointermove',e=>this.move(e),opt);
  window.addEventListener('pointerup',e=>this.up(e),opt);
  window.addEventListener('pointercancel',e=>{if(this.pointer?.id===e.pointerId)this.cancel();},opt);
  stage.addEventListener('keydown',e=>{if(e.key==='ArrowLeft'||e.key==='ArrowRight'){e.preventDefault();this.step(e.key==='ArrowRight'?1:-1)}},opt);
  this.aura=document.createElement('div');this.aura.className='selection-backlight';this.aura.setAttribute('aria-hidden','true');stage.prepend(this.aura);
 }
 clickSlot(e){
  if(this.busy||this.pointer||performance.now()-this.lastDrag<=C.carousel.clickGuard)return;
  if(e.target.closest('button:not(.tarot-card)'))return;
  // Keyboard-generated clicks are handled on the focused card above.
  if(e.detail===0)return;
  const bounds=this.stage.getBoundingClientRect(),w=this.stage.clientWidth;
  const x=e.clientX-bounds.left-w/2,y=e.clientY-bounds.top-bounds.height/2;
  const radius=(C.counts.visible-1)/2,cardW=stageSize('selection',w),cardH=cardW*C.aspect;
  const slots=[];
  for(let d=-radius;d<=radius;d++){
   const pose=slotPose(d+this.offset,w);
   slots.push({d,x:pose.x,y:pose.y});
  }
  // Ignore clicks outside the card fan's vertical and horizontal reach.
  const nearest=slots.reduce((best,slot)=>Math.abs(x-slot.x)<Math.abs(x-best.x)?slot:best);
  if(Math.abs(y-nearest.y)>cardH*.55||
     x<slots[0].x-cardW*.5||x>slots[slots.length-1].x+cardW*.5)return;
  const index=mod(this.index+nearest.d,this.cards.length),card=this.cards[index];
  if(!card.hidden&&!card.disabled)this.tap(card);
 }
 tap(card){
  if(this.selectedCard===card){this.onChoose(card);return;}
  const old=this.selectedCard;
  this.selectedCard=card;
  this.layout();
  // Animate the newly picked card from its resting position to its raised pose.
  // The layout already owns the final transform, so no persistent animation
  // can fight subsequent drag/snap updates.
  const index=this.cards.indexOf(card);
  const off=this.distance(index)+this.offset;
  const resting=slotPose(off,this.stage.clientWidth);
  const raised={...resting,y:resting.y-22};
  card.getAnimations().forEach(animation=>animation.cancel());
  card.animate([
   {transform:transform({...resting,scale:1,z:0,ry:0,rx:0})},
   {transform:transform({...raised,scale:1,z:0,ry:0,rx:0})}
  ],{duration:260,easing:'cubic-bezier(.2,.75,.25,1)'});
  if(old&&old!==card)old.getAnimations().forEach(animation=>animation.cancel());
 }
 confirm(){if(this.selectedCard&&!this.selectedCard.hidden&&!this.busy)this.onChoose(this.selectedCard);}
 distance(i){const n=this.cards.length;let d=mod(i-this.index,n);if(d>n/2)d-=n;return d;}
 get visible(){return this.cards.filter((_,i)=>Math.abs(this.distance(i))<=(C.counts.visible-1)/2);}
 layout(fraction=this.offset){
  cardSize(this.stage,'selection');const w=this.stage.clientWidth, radius=(C.counts.visible-1)/2, edge=radius+1;
  this.cards.forEach((card,i)=>{
   const off=this.distance(i)+fraction,a=Math.abs(off);
   // Keep entering/leaving cards mounted while the adjacent fan masks them.
   // No opacity animation: reveal by geometric clipping under the neighbour.
   const show=a<edge,selectable=a<=radius+.001;
   if(card.hidden===show)card.hidden=!show;
   if(card.disabled===selectable)card.disabled=!selectable;
   card.classList.toggle('selectable',selectable);
   card.classList.toggle('is-center',a<.5);
   card.classList.toggle('is-picked',card===this.selectedCard);
   if(show){
    const fixedSize=stageSize('selection',w);
    card.style.width=fixedSize+'px';card.style.height=fixedSize*C.aspect+'px';
    const cardPose=slotPose(off,w);
    if(card===this.selectedCard)cardPose.y-=22;
    card.style.transform=transform({...cardPose,scale:1,z:0,ry:0,rx:0});
    // A card outside the seven slots slides out from behind its neighbour.
    // Clip its inner edge instead of fading its entire face.
    const covered=Math.max(0,Math.min(1,a-radius));
    const cut=(covered*100).toFixed(3)+'%';
    card.style.clipPath=covered? (off<0?`inset(0 ${cut} 0 0)`:`inset(0 0 0 ${cut})`) : 'none';
    card.style.opacity='1';
    card.style.zIndex=String(card===this.selectedCard?200:100-Math.round(a*20));
   }
  });
  this.updateGlow();this.onIndex(this.index);
 }
 updateGlow(){ /* Soft stationary backlight; no tracing line. */ }
 down(e){if(this.busy||e.button!==0||e.target.closest('button:not(.tarot-card)'))return;this.pointer={id:e.pointerId,x:e.clientX,y:e.clientY,dragged:false,offset:0};
 }
 move(e){const p=this.pointer;if(!p||e.pointerId!==p.id)return;const dx=e.clientX-p.x,dy=e.clientY-p.y;
  if(!p.dragged&&Math.abs(dy)>Math.abs(dx)&&Math.abs(dy)>12){this.cancel();return;}
  if(Math.abs(dx)>5){if(!p.dragged){p.dragged=true;this.stage.classList.add('is-dragging');
     // Capture only after drag begins; capturing on pointerdown steals card clicks.
     if(this.stage.setPointerCapture)try{this.stage.setPointerCapture(e.pointerId);}catch(_){}}
   const gap=Math.max(45,Math.abs(slotPose(1,this.stage.clientWidth).x));this.offset=Math.max(-C.carousel.dragLimit,Math.min(C.carousel.dragLimit,dx/gap));if(!this.raf)this.raf=requestAnimationFrame(()=>{this.raf=0;this.layout();});e.preventDefault();}
 }
 up(e){const p=this.pointer;if(!p||e.pointerId!==p.id)return;this.pointer=null;this.releasePointer(e.pointerId);if(p.dragged){this.lastDrag=performance.now();e.preventDefault();const shift=Math.round(-this.offset);this.snap(shift);}else this.stage.classList.remove('is-dragging');}
 async snap(shift){if(this.busy)return;this.busy=true;const start=this.offset,end=-shift,duration=Math.max(160,C.carousel.move);const begin=performance.now();
  await new Promise(resolve=>{const frame=t=>{if(this.destroyed){resolve();return;}const q=Math.min(1,(t-begin)/duration),ease=1-Math.pow(1-q,3);this.offset=start+(end-start)*ease;this.layout();if(q<1)requestAnimationFrame(frame);else resolve();};requestAnimationFrame(frame);});
  if(this.destroyed)return;this.index=mod(this.index+shift,this.cards.length);this.selectedCard=null;this.offset=0;this.busy=false;this.stage.classList.remove('is-dragging');this.layout();
 }
 step(direction){if(this.busy||this.pointer)return;this.offset=0;this.snap(direction);}
 releasePointer(id){if(this.stage.hasPointerCapture?.(id))try{this.stage.releasePointerCapture(id);}catch(_){}}
 cancel(){if(this.pointer)this.releasePointer(this.pointer.id);this.pointer=null;this.offset=0;this.stage.classList.remove('is-dragging');if(!this.busy)this.layout();}
 destroy(){if(this.pointer)this.releasePointer(this.pointer.id);if(this.raf)cancelAnimationFrame(this.raf);this.destroyed=true;this.abort.abort();this.pointer=null;this.busy=true;this.aura.remove();this.stage.classList.remove('is-dragging');}
}
