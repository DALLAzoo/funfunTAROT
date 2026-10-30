import {CONFIG as C,stageSize} from './config.js';
import {slotPose,mod} from './cinema-core.js';
import {transform,cardSize} from './card-animation.js';
export class Carousel {
 constructor(cards,stage,onIndex,onChoose){
  this.cards=cards;this.stage=stage;this.index=0;this.busy=false;this.onIndex=onIndex;this.onChoose=onChoose;
  this.pointer=null;this.lastDrag=-Infinity;this.offset=0;this.abort=new AbortController();
  const opt={signal:this.abort.signal};
  cards.forEach((card,i)=>card.addEventListener('click',()=>{if(!this.busy&&!this.pointer&&performance.now()-this.lastDrag>C.carousel.clickGuard&&Math.abs(this.distance(i))<=1)this.onChoose(card);},opt));
  stage.addEventListener('pointerdown',e=>this.down(e),opt);
  window.addEventListener('pointermove',e=>this.move(e),opt);
  window.addEventListener('pointerup',e=>this.up(e),opt);
  window.addEventListener('pointercancel',e=>{if(this.pointer?.id===e.pointerId)this.cancel();},opt);
  stage.addEventListener('keydown',e=>{if(e.key==='ArrowLeft'||e.key==='ArrowRight'){e.preventDefault();this.step(e.key==='ArrowRight'?1:-1)}},opt);
  this.aura=document.createElement('div');this.aura.className='selection-backlight';this.aura.setAttribute('aria-hidden','true');stage.prepend(this.aura);
 }
 distance(i){const n=this.cards.length;let d=mod(i-this.index,n);if(d>n/2)d-=n;return d;}
 get visible(){return this.cards.filter((_,i)=>Math.abs(this.distance(i))<=1);}
 layout(fraction=this.offset){
  cardSize(this.stage,'selection');const w=this.stage.clientWidth,n=this.cards.length;
  this.cards.forEach((card,i)=>{
   const off=this.distance(i)+fraction,show=Math.abs(off)<3.15;
   card.hidden=!show;card.disabled=Math.abs(off)>1.3;card.classList.toggle('selectable',Math.abs(off)<=1.3);
   card.classList.toggle('is-center',Math.abs(off)<.5);
   if(show){
    // Ease the outer card into the fan instead of throwing its corner forward.
    const excess=Math.max(0,Math.abs(off)-1);
    const eased=excess/(1+excess*.95);
    const poseOff=Math.sign(off)*(Math.min(1,Math.abs(off))+eased);
    const pos=slotPose(poseOff,w);
    if(excess){pos.x+=Math.sign(off)*eased*stageSize('selection',w)*.38;pos.z-=eased*38;}
    card.style.transform=transform(pos);
    // Gradual reveal at the outer edge; no abrupt visibility jump.
    card.style.opacity=String(Math.max(0,Math.min(1,(3.15-Math.abs(off))/.72)));
    // Keep the incoming card behind until the outgoing card has visibly cleared.
    // A delayed, narrow overlap fade hides the corner at the depth hand-off.
    const entering=Math.abs(off)<.72 && Math.abs(this.distance(i))>=1;
    const handoff=entering?Math.max(.18,Math.min(1,(.72-Math.abs(off))/.42)):1;
    card.style.opacity=String(Number(card.style.opacity)*handoff);
    card.style.zIndex=String(100-Math.round(Math.abs(off)*20));
   }
  });
  this.updateGlow();this.onIndex(this.index);
 }
 updateGlow(){ /* Soft stationary backlight; no tracing line. */ }
 down(e){if(this.busy||e.button!==0||e.target.closest('button:not(.tarot-card)'))return;this.pointer={id:e.pointerId,x:e.clientX,y:e.clientY,dragged:false,offset:0};}
 move(e){const p=this.pointer;if(!p||e.pointerId!==p.id)return;const dx=e.clientX-p.x,dy=e.clientY-p.y;
  if(!p.dragged&&Math.abs(dy)>Math.abs(dx)&&Math.abs(dy)>12){this.cancel();return;}
  if(Math.abs(dx)>5){if(!p.dragged){p.dragged=true;this.stage.classList.add('is-dragging');}
   const gap=Math.max(45,Math.abs(slotPose(1,this.stage.clientWidth).x));this.offset=Math.max(-C.carousel.dragLimit,Math.min(C.carousel.dragLimit,dx/gap));this.layout();e.preventDefault();}
 }
 up(e){const p=this.pointer;if(!p||e.pointerId!==p.id)return;this.pointer=null;if(p.dragged){this.lastDrag=performance.now();e.preventDefault();const shift=Math.round(-this.offset);this.snap(shift);}else this.stage.classList.remove('is-dragging');}
 async snap(shift){if(this.busy)return;this.busy=true;const start=this.offset,end=-shift,duration=Math.max(160,C.carousel.move);const begin=performance.now();
  await new Promise(resolve=>{const frame=t=>{if(this.destroyed){resolve();return;}const q=Math.min(1,(t-begin)/duration),ease=1-Math.pow(1-q,3);this.offset=start+(end-start)*ease;this.layout();if(q<1)requestAnimationFrame(frame);else resolve();};requestAnimationFrame(frame);});
  if(this.destroyed)return;this.index=mod(this.index+shift,this.cards.length);this.offset=0;this.busy=false;this.stage.classList.remove('is-dragging');this.layout();
 }
 step(direction){if(this.busy||this.pointer)return;this.offset=0;this.snap(direction);}
 cancel(){this.pointer=null;this.offset=0;this.stage.classList.remove('is-dragging');if(!this.busy)this.layout();}
 destroy(){this.destroyed=true;this.abort.abort();this.pointer=null;this.busy=true;this.aura.remove();this.stage.classList.remove('is-dragging');}
}
