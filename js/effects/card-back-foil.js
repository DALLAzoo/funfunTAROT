/* AD1 v22 — move a bright, gold-mask-only metallic highlight.
 * The original picture is never moved, recolored, or replaced.
 * The idle top card and a chosen/hovered fan card are the only targets.
 */
export function installCardBackFoil(stage=document.getElementById('stage')) {
 if(!stage)return () => {};
 let active=null,latest=null,frame=0,dead=false;
 const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
 const live=()=>stage.classList.contains('idle-stack') ||
  (stage.classList.contains('selection-stage') &&
   !stage.classList.contains('orbit-opening') &&
   !stage.classList.contains('is-dragging'));
 const reset=card=>{
  if(!card)return;
  card.classList.remove('ad1-foil-active');
  for(const key of ['--ad1-foil-x','--ad1-foil-y','--ad1-foil-sweep'])card.style.removeProperty(key);
 };
 const target=e=>{
  if(stage.classList.contains('idle-stack'))return stage.querySelector('.shuffle-surface:first-child');
  if(!stage.classList.contains('selection-stage'))return null;
  const hit=e.target instanceof Element?e.target.closest('.tarot-card.selectable:not([hidden])'):null;
  if(hit)return hit;
  return stage.querySelector('.tarot-card.is-picked.selectable:not([hidden])');
 };
 function paint(){
  frame=0;if(dead||!latest)return;
  const p=latest;latest=null;
  if(!live()){reset(active);active=null;return;}
  const card=target(p);
  if(card!==active){reset(active);active=card;}
  if(!card)return;
  const b=card.getBoundingClientRect();if(b.width<1||b.height<1)return;
  const x=clamp((p.clientX-b.left)/b.width,0,1),y=clamp((p.clientY-b.top)/b.height,0,1);
  card.style.setProperty('--ad1-foil-sweep',(x*100).toFixed(1)+'%');
  card.style.setProperty('--ad1-foil-x',(20+x*60).toFixed(1)+'%');
  card.style.setProperty('--ad1-foil-y',(18+y*64).toFixed(1)+'%');
  card.classList.add('ad1-foil-active');
 }
 function move(e){
  if(!live())return;
  latest={clientX:e.clientX,clientY:e.clientY,target:e.target};
  if(!frame)frame=requestAnimationFrame(paint);
 }
 function leave(e){
  if(e.type==='pointerleave'&&e.pointerType==='touch')return;
  if(frame)cancelAnimationFrame(frame);frame=0;latest=null;
  reset(active);active=null;
 }
 function touchEnd(e){
  /* Let the reflective spot linger after a tap; release it after a swipe. */
  if(e.pointerType==='touch'&&stage.classList.contains('is-dragging'))leave(e);
 }
 stage.addEventListener('pointermove',move,{passive:true});
 stage.addEventListener('pointerdown',move,{passive:true});
 stage.addEventListener('pointerleave',leave,{passive:true});
 stage.addEventListener('pointercancel',leave,{passive:true});
 stage.addEventListener('pointerup',touchEnd,{passive:true});
 return ()=>{
  dead=true;leave({type:'dispose',pointerType:'mouse'});
  stage.removeEventListener('pointermove',move);
  stage.removeEventListener('pointerdown',move);
  stage.removeEventListener('pointerleave',leave);
  stage.removeEventListener('pointercancel',leave);
  stage.removeEventListener('pointerup',touchEnd);
 };
}
