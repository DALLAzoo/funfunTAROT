import {CONFIG as C,stageSize} from './config.js';
import {slotPose,mod} from './cinema-core.js';
import {transform,cardSize} from './card-animation.js';
export class Carousel {
 constructor(cards,stage,onIndex,onChoose){
  this.cards=cards;this.stage=stage;this.index=0;this.busy=false;this.onIndex=onIndex;this.onChoose=onChoose;
  this.pointer=null;this.lastDrag=-Infinity;this.offset=0;this.selectedCard=null;this.abort=new AbortController();
  const opt={signal:this.abort.signal};
  cards.forEach((card,i)=>card.addEventListener('click',()=>{if(!this.busy&&!this.pointer&&performance.now()-this.lastDrag>C.carousel.clickGuard&&Math.abs(this.distance(i))<=(C.counts.visible-1)/2)this.tap(card);},opt));
  stage.addEventListener('pointerdown',e=>this.down(e),opt);
  window.addEventListener('pointermove',e=>this.move(e),opt);
  window.addEventListener('pointerup',e=>this.up(e),opt);
  window.addEventListener('pointercancel',e=>{if(this.pointer?.id===e.pointerId)this.cancel();},opt);



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
  cardSize(this.stage,'selection');const w=this.stage.clientWidth, radius=(C.counts.visible-1)/2, edge=radius+1.15;
  this.cards.forEach((card,i)=>{
   const off=this.distance(i)+fraction,a=Math.abs(off);
   // Keep an entering card mounted before it reaches the edge, avoiding pop-in.
   // Keep the entering/leaving edge card mounted across drag start and
   // snap completion. Its opacity tapers to zero before it is hidden.
   const show=a<=radius+.001||(Math.abs(fraction)>.001&&a<edge),selectable=a<=radius+.001;
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
    // Fade only the extra entering card, never the five main slots.
    card.style.opacity=String(a<=radius?1:Math.max(0,Math.min(1,(edge-a)/1.15)));
    card.style.zIndex=String(card===this.selectedCard?200:100-Math.round(a*20));
   }
  });
  this.onIndex(this.index);
 }
 down(e){if(this.busy||this.pointer||e.button!==0||e.target.closest('button:not(.tarot-card)'))return;
  this.pointer={id:e.pointerId,x:e.clientX,y:e.clientY,dragged:false,ending:false};
  // Window listeners track the gesture without retargeting card clicks.
 }
 move(e){const p=this.pointer;if(!p||e.pointerId!==p.id||this.busy)return;
  const dx=e.clientX-p.x,dy=e.clientY-p.y;
  if(!p.dragged&&Math.abs(dy)>Math.abs(dx)&&Math.abs(dy)>12){this.cancel();return;}
  if(Math.abs(dx)<=5&&!p.dragged)return;
  if(!p.dragged){p.dragged=true;this.stage.classList.add('is-dragging');
}
  const gap=Math.max(45,Math.abs(slotPose(1,this.stage.clientWidth).x));
  let movement=dx/gap;
  // Rebase by whole slots while dragging: never clamp or jump at the edge.
  const whole=Math.trunc(movement);
  if(whole!==0){this.index=mod(this.index-whole,this.cards.length);p.x+=whole*gap;movement-=whole;}
  this.offset=movement;
  if(!this.raf)this.raf=requestAnimationFrame(()=>{this.raf=0;if(!this.destroyed)this.layout();});
  e.preventDefault();
 }
 up(e){const p=this.pointer;if(!p||e.pointerId!==p.id)return;
  p.ending=true;this.pointer=null;this.releasePointer(e.pointerId);
  if(p.dragged){this.lastDrag=performance.now();e.preventDefault();this.snap(Math.round(-this.offset));}
  else this.stage.classList.remove('is-dragging');
 }
 async snap(shift){if(this.busy)return;this.busy=true;
  if(this.raf){cancelAnimationFrame(this.raf);this.raf=0;}
  const start=this.offset,end=-shift,duration=Math.max(160,C.carousel.move),begin=performance.now();
  await new Promise(resolve=>{const frame=t=>{if(this.destroyed){resolve();return;}
   const q=Math.min(1,(t-begin)/duration),ease=1-Math.pow(1-q,3);
   this.offset=start+(end-start)*ease;this.layout();
   if(q<1)requestAnimationFrame(frame);else resolve();};requestAnimationFrame(frame);});
  if(this.destroyed)return;
  this.index=mod(this.index+shift,this.cards.length);this.selectedCard=null;
  this.offset=0;this.busy=false;this.stage.classList.remove('is-dragging');this.layout();
 }
 step(direction){if(this.busy||this.pointer)return;this.offset=0;return this.snap(direction);}
 releasePointer(id){if(this.stage.hasPointerCapture?.(id))try{this.stage.releasePointerCapture(id);}catch(_){}}
 cancel(){if(this.pointer)this.releasePointer(this.pointer.id);this.pointer=null;this.offset=0;this.stage.classList.remove('is-dragging');if(!this.busy)this.layout();}
 destroy(){if(this.pointer)this.releasePointer(this.pointer.id);if(this.raf)cancelAnimationFrame(this.raf);this.destroyed=true;this.abort.abort();this.pointer=null;this.busy=true;this.stage.classList.remove('is-dragging');}
}
