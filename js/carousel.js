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
  stage.addEventListener('keydown',e=>{if(e.key==='ArrowLeft'||e.key==='ArrowRight'){e.preventDefault();this.step(e.key==='ArrowRight'?1:-1)}},opt);
  this.aura=document.createElement('div');this.aura.className='selection-backlight';this.aura.setAttribute('aria-hidden','true');stage.prepend(this.aura);
 }
 tap(card){
  if(this.selectedCard===card){this.onChoose(card);return;}
  this.selectedCard=card;
  this.layout();
 }
 confirm(){if(this.selectedCard&&!this.selectedCard.hidden&&!this.busy)this.onChoose(this.selectedCard);}
 distance(i){const n=this.cards.length;let d=mod(i-this.index,n);if(d>n/2)d-=n;return d;}
 get visible(){return this.cards.filter((_,i)=>Math.abs(this.distance(i))<=(C.counts.visible-1)/2);}
 layout(fraction=this.offset){
  cardSize(this.stage,'selection');const w=this.stage.clientWidth, radius=(C.counts.visible-1)/2, edge=radius+1.15;
  this.cards.forEach((card,i)=>{
   const off=this.distance(i)+fraction,a=Math.abs(off);
   // Keep an entering card mounted before it reaches the edge, avoiding pop-in.
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
    // Fade only the extra entering card, never any of the seven main slots.
    card.style.opacity=String(a<=radius?1:Math.max(0,Math.min(1,(edge-a)/1.15)));
    card.style.zIndex=String(card===this.selectedCard?200:100-Math.round(a*20));
   }
  });
  this.updateGlow();this.onIndex(this.index);
 }
 updateGlow(){ /* Soft stationary backlight; no tracing line. */ }
 down(e){if(this.busy||e.button!==0||e.target.closest('button:not(.tarot-card)'))return;this.pointer={id:e.pointerId,x:e.clientX,y:e.clientY,dragged:false,offset:0};}
 move(e){const p=this.pointer;if(!p||e.pointerId!==p.id)return;const dx=e.clientX-p.x,dy=e.clientY-p.y;
  if(!p.dragged&&Math.abs(dy)>Math.abs(dx)&&Math.abs(dy)>12){this.cancel();return;}
  if(Math.abs(dx)>5){if(!p.dragged){p.dragged=true;this.stage.classList.add('is-dragging');}
   const gap=Math.max(45,Math.abs(slotPose(1,this.stage.clientWidth).x));this.offset=Math.max(-C.carousel.dragLimit,Math.min(C.carousel.dragLimit,dx/gap));if(!this.raf)this.raf=requestAnimationFrame(()=>{this.raf=0;this.layout();});e.preventDefault();}
 }
 up(e){const p=this.pointer;if(!p||e.pointerId!==p.id)return;this.pointer=null;if(p.dragged){this.lastDrag=performance.now();e.preventDefault();const shift=Math.round(-this.offset);this.snap(shift);}else this.stage.classList.remove('is-dragging');}
 async snap(shift){if(this.busy)return;this.busy=true;const start=this.offset,end=-shift,duration=Math.max(160,C.carousel.move);const begin=performance.now();
  await new Promise(resolve=>{const frame=t=>{if(this.destroyed){resolve();return;}const q=Math.min(1,(t-begin)/duration),ease=1-Math.pow(1-q,3);this.offset=start+(end-start)*ease;this.layout();if(q<1)requestAnimationFrame(frame);else resolve();};requestAnimationFrame(frame);});
  if(this.destroyed)return;this.index=mod(this.index+shift,this.cards.length);this.selectedCard=null;this.offset=0;this.busy=false;this.stage.classList.remove('is-dragging');this.layout();
 }
 step(direction){if(this.busy||this.pointer)return;this.offset=0;this.snap(direction);}
 cancel(){this.pointer=null;this.offset=0;this.stage.classList.remove('is-dragging');if(!this.busy)this.layout();}
 destroy(){if(this.raf)cancelAnimationFrame(this.raf);this.destroyed=true;this.abort.abort();this.pointer=null;this.busy=true;this.aura.remove();this.stage.classList.remove('is-dragging');}
}
