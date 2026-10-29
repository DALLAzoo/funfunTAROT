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
  stage.addEventListener('pointermove',e=>this.move(e),opt);
  stage.addEventListener('pointerup',e=>this.up(e),opt);
  stage.addEventListener('pointercancel',()=>this.cancel(),opt);
  stage.addEventListener('keydown',e=>{if(e.key==='ArrowLeft'||e.key==='ArrowRight'){e.preventDefault();this.step(e.key==='ArrowRight'?1:-1)}},opt);
  this.glow=document.createElementNS('http://www.w3.org/2000/svg','svg');this.glow.classList.add('group-glow');this.glow.setAttribute('aria-hidden','true');
  this.path=document.createElementNS('http://www.w3.org/2000/svg','path');this.path.setAttribute('class','group-glow-path');this.path.setAttribute('pathLength','100');this.glow.append(this.path);stage.append(this.glow);
 }
 distance(i){const n=this.cards.length;let d=mod(i-this.index,n);if(d>n/2)d-=n;return d;}
 get visible(){return this.cards.filter((_,i)=>Math.abs(this.distance(i))<=1);}
 layout(fraction=this.offset){
  cardSize(this.stage,'selection');const w=this.stage.clientWidth,n=this.cards.length;
  this.cards.forEach((card,i)=>{
   const off=this.distance(i)+fraction,show=Math.abs(off)<2.6;
   card.hidden=!show;card.disabled=Math.abs(off)>1.3;card.classList.toggle('selectable',Math.abs(off)<=1.3);
   card.classList.toggle('is-center',Math.abs(off)<.5);
   if(show){const pos=slotPose(off,w);if(Math.abs(off)>1){pos.x+=Math.sign(off)*(Math.abs(off)-1)*stageSize('selection',w)*1.2;pos.z-=Math.max(0,Math.abs(off)-1)*100;}
    card.style.transform=transform(pos);card.style.zIndex=String(100-Math.round(Math.abs(off)*20));}
  });
  this.updateGlow();this.onIndex(this.index);
 }
 updateGlow(){
  const w=this.stage.clientWidth,h=this.stage.clientHeight;
  this.glow.setAttribute('viewBox',`0 0 ${w} ${h}`);
  // The visible three cards form ONE traced silhouette, not three separate glows.
  const pts=[];const cw=stageSize('selection',w),ch=cw*C.aspect;
  for(let i=0;i<this.cards.length;i++){
   const d=this.distance(i)+this.offset;if(Math.abs(d)>1.08)continue;
   const pos=slotPose(d,w),scale=C.camera.perspective/(C.camera.perspective-pos.z);
   const a=pos.rot*Math.PI/180,cos=Math.cos(a),sin=Math.sin(a),cx=w/2+pos.x*scale,cy=h/2+pos.y*scale;
   for(const [x,y] of [[-cw/2,-ch/2],[cw/2,-ch/2],[cw/2,ch/2],[-cw/2,ch/2]])pts.push([cx+(x*cos-y*sin)*scale,cy+(x*sin+y*cos)*scale]);
  }
  if(pts.length<3){this.path.setAttribute('d','');return;}
  pts.sort((a,b)=>a[0]-b[0]||a[1]-b[1]);const cross=(a,b,c)=>(b[0]-a[0])*(c[1]-a[1])-(b[1]-a[1])*(c[0]-a[0]);const low=[],up=[];
  for(const pt of pts){while(low.length>=2&&cross(low.at(-2),low.at(-1),pt)<=0)low.pop();low.push(pt);}
  for(const pt of [...pts].reverse()){while(up.length>=2&&cross(up.at(-2),up.at(-1),pt)<=0)up.pop();up.push(pt);}
  const hull=[...low.slice(0,-1),...up.slice(0,-1)];this.path.setAttribute('d',hull.map((p,i)=>`${i?'L':'M'}${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(' ')+' Z');
 }
 down(e){if(this.busy||e.button!==0||!e.target.closest('.tarot-card'))return;this.pointer={id:e.pointerId,x:e.clientX,y:e.clientY,dragged:false,offset:0};}
 move(e){const p=this.pointer;if(!p||e.pointerId!==p.id)return;const dx=e.clientX-p.x,dy=e.clientY-p.y;
  if(!p.dragged&&Math.abs(dy)>Math.abs(dx)&&Math.abs(dy)>12){this.cancel();return;}
  if(Math.abs(dx)>5){if(!p.dragged){p.dragged=true;this.stage.setPointerCapture(e.pointerId);this.stage.classList.add('is-dragging');}
   const gap=Math.max(45,Math.abs(slotPose(1,this.stage.clientWidth).x));this.offset=Math.max(-C.carousel.dragLimit,Math.min(C.carousel.dragLimit,dx/gap));this.layout();e.preventDefault();}
 }
 up(e){const p=this.pointer;if(!p||e.pointerId!==p.id)return;this.pointer=null;if(p.dragged){this.lastDrag=performance.now();e.preventDefault();const shift=Math.round(-this.offset);this.snap(shift);}else this.stage.classList.remove('is-dragging');}
 async snap(shift){if(this.busy)return;this.busy=true;const start=this.offset,end=-shift,duration=Math.max(160,C.carousel.move);const begin=performance.now();
  await new Promise(resolve=>{const frame=t=>{if(this.destroyed){resolve();return;}const q=Math.min(1,(t-begin)/duration),ease=1-Math.pow(1-q,3);this.offset=start+(end-start)*ease;this.layout();if(q<1)requestAnimationFrame(frame);else resolve();};requestAnimationFrame(frame);});
  if(this.destroyed)return;this.index=mod(this.index+shift,this.cards.length);this.offset=0;this.busy=false;this.stage.classList.remove('is-dragging');this.layout();
 }
 step(direction){if(this.busy||this.pointer)return;this.offset=0;this.snap(direction);}
 cancel(){this.pointer=null;this.offset=0;this.stage.classList.remove('is-dragging');if(!this.busy)this.layout();}
 destroy(){this.destroyed=true;this.abort.abort();this.pointer=null;this.busy=true;this.glow.remove();this.stage.classList.remove('is-dragging');}
}
