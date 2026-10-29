import {CONFIG as C} from './config.js';
import {slotPose,visibleIndices,mod} from './cinema-core.js';
import {animateTo,transform,cardSize} from './card-animation.js';
export class Carousel {
 constructor(cards,stage,onIndex,onChoose){
  this.cards=cards;this.stage=stage;this.index=0;this.busy=false;this.onIndex=onIndex;this.onChoose=onChoose;this.lastDrag=-Infinity;
  this.abort=new AbortController();const options={signal:this.abort.signal};
  cards.forEach(c=>c.addEventListener('click',()=>{if(!this.busy&&performance.now()-this.lastDrag>C.carousel.clickGuard)onChoose(c);},options));
  stage.addEventListener('pointerdown',e=>this.down(e),options);stage.addEventListener('pointermove',e=>this.move(e),options);
  stage.addEventListener('pointerup',e=>this.up(e),options);stage.addEventListener('pointercancel',()=>this.cancel(),options);
  stage.addEventListener('keydown',e=>{if(e.key==='ArrowLeft'||e.key==='ArrowRight'){e.preventDefault();this.step(e.key==='ArrowRight'?1:-1)}},options);
 }
 get visible(){return visibleIndices(this.index,this.cards.length,C.counts.visible).map(i=>this.cards[i]);}
 offset(i){const ids=visibleIndices(this.index,this.cards.length,C.counts.visible);return ids.indexOf(i)-(C.counts.visible-1)/2;}
 layout(fraction=0){
  cardSize(this.stage,'selection');const ids=visibleIndices(this.index,this.cards.length,C.counts.visible),r=(C.counts.visible-1)/2;
  this.cards.forEach((c,i)=>{const j=ids.indexOf(i);c.hidden=j<0;c.disabled=j<0;c.classList.toggle('selectable',j>=0);c.classList.toggle('is-center',i===this.index);
   if(j>=0){c.style.width='';c.style.height='';c.style.transform=transform(slotPose(j-r+fraction,this.stage.clientWidth));c.setAttribute('aria-label',j===r?'가운데 카드 선택':j<r?'왼쪽 카드 선택':'오른쪽 카드 선택');}
  });this.onIndex(this.index);
 }
 async step(direction,fraction=0){
  if(this.busy)return;this.busy=true;this.stage.classList.add('is-dragging');
  const old=this.visible,r=(C.counts.visible-1)/2;
  const outgoing=direction===1?old[0]:old.at(-1);
  await Promise.all(old.map((c,j)=>{
   const p=slotPose(j-r-direction,this.stage.clientWidth);
   if(c===outgoing){p.x=-direction*(this.stage.clientWidth/2+parseFloat(getComputedStyle(c).width));p.z=-160;}
   return animateTo(c,p,C.carousel.move);
  }));
  if(this.destroyed)return;
  outgoing.hidden=true;this.index=mod(this.index+direction,this.cards.length);
  const fresh=this.visible,incoming=direction===1?fresh.at(-1):fresh[0],target=slotPose(direction*r,this.stage.clientWidth);
  incoming.hidden=false;incoming.disabled=false;incoming.classList.add('selectable');incoming.style.width='';incoming.style.height='';
  incoming.style.transform=transform({...target,x:direction*(this.stage.clientWidth/2+parseFloat(getComputedStyle(incoming).width)),z:-160});
  await animateTo(incoming,target,C.carousel.enter);
  if(this.destroyed)return;
  this.busy=false;this.stage.classList.remove('is-dragging');this.layout();
 }
 down(e){if(this.busy||!e.target.closest('.tarot-card')||e.button!==0)return;this.pointer={id:e.pointerId,x:e.clientX,y:e.clientY,dragged:false};}
 move(e){if(!this.pointer||e.pointerId!==this.pointer.id)return;const dx=e.clientX-this.pointer.x,dy=e.clientY-this.pointer.y;if(!this.pointer.dragged&&Math.abs(dy)>Math.abs(dx)&&Math.abs(dy)>10){this.cancel();return;}
  if(Math.abs(dx)>8){this.pointer.dragged=true;this.stage.setPointerCapture(e.pointerId);this.stage.classList.add('is-dragging');const gap=Math.abs(slotPose(1,this.stage.clientWidth).x);this.layout(Math.max(-C.carousel.dragLimit,Math.min(C.carousel.dragLimit,dx/gap)));}
 }
 up(e){if(!this.pointer||e.pointerId!==this.pointer.id)return;const p=this.pointer,dx=e.clientX-p.x;this.pointer=null;this.stage.classList.remove('is-dragging');
  if(p.dragged){this.lastDrag=performance.now();e.preventDefault();if(Math.abs(dx)>=C.carousel.dragThreshold)this.step(dx<0?1:-1);else this.layout();}
 }
 cancel(){this.pointer=null;this.stage.classList.remove('is-dragging');if(!this.busy)this.layout();}
 destroy(){this.destroyed=true;this.abort.abort();this.pointer=null;this.busy=true;this.stage.classList.remove('is-dragging');}
}
