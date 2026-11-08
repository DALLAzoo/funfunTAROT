/* AD1 v21 - optional pointer/touch response for the ORIGINAL tarot back art.
   Updates at most one card's masked foil; never moves the actual image/card.
   Avoids DOM churn, physics engines, sensor permissions and long-running loops. */
export function installCardBackFoil(stage=document.getElementById('stage')) {
  if (!stage) return () => {};
  let active=null;
  let targetPoint=null;
  let frame=0;
  let dead=false;
  const clamp=(x,low,high)=>Math.max(low,Math.min(high,x));
  const eligible=()=>stage.classList.contains('idle-stack') ||
    (stage.classList.contains('selection-stage') &&
     !stage.classList.contains('orbit-opening') &&
     !stage.classList.contains('is-dragging'));
  const reset=card=>{
    if(!card)return;
    card.classList.remove('ad1-foil-active');
    for(const name of ['--ad1-foil-x','--ad1-foil-y','--ad1-foil-shadow-x','--ad1-foil-shadow-y'])
      card.style.removeProperty(name);
  };
  function chosenCard(e){
    if(stage.classList.contains('idle-stack'))
      return stage.querySelector('.shuffle-surface:first-child');
    if(!stage.classList.contains('selection-stage'))return null;
    const underPointer=e.target instanceof Element ? e.target.closest('.tarot-card.selectable') : null;
    if(underPointer && !underPointer.hidden)return underPointer;
    const picked=stage.querySelector('.tarot-card.is-picked:not([hidden])');
    return picked && picked.classList.contains('selectable') ? picked : null;
  }
  function render(){
    frame=0;
    if(dead||!targetPoint)return;
    const {x,y,eventTarget}=targetPoint;
    targetPoint=null;
    if(!eligible()){if(active){reset(active);active=null;}return;}
    const card=chosenCard({target:eventTarget});
    if(card!==active){reset(active);active=card;}
    if(!active)return;
    const r=active.getBoundingClientRect();
    if(!r.width||!r.height)return;
    // A few percent of apparent foil motion is enough to read as depth.
    const px=clamp((x-r.left)/r.width,0,1);
    const py=clamp((y-r.top)/r.height,0,1);
    const hx=38+px*26,hy=33+py*27;
    const sx=100-hx,sy=100-hy;
    active.style.setProperty('--ad1-foil-x',hx.toFixed(1)+'%');
    active.style.setProperty('--ad1-foil-y',hy.toFixed(1)+'%');
    active.style.setProperty('--ad1-foil-shadow-x',sx.toFixed(1)+'%');
    active.style.setProperty('--ad1-foil-shadow-y',sy.toFixed(1)+'%');
    active.classList.add('ad1-foil-active');
  }
  function move(e){
    if(!eligible())return;
    // Only act on genuine pointer motion; this does not prevent drag/click.
    targetPoint={x:e.clientX,y:e.clientY,eventTarget:e.target};
    if(!frame)frame=requestAnimationFrame(render);
  }
  function leave(e){
    // Touch pointers leave the screen on every tap. Retain the last gentle
    // foil response after release; mouse pointers reset upon leaving.
    if(e?.type==='pointerleave' && e.pointerType==='touch')return;
    if(frame)cancelAnimationFrame(frame);
    frame=0;targetPoint=null;reset(active);active=null;
  }
  stage.addEventListener('pointermove',move,{passive:true});
  stage.addEventListener('pointerdown',move,{passive:true});
  stage.addEventListener('pointerleave',leave,{passive:true});
  stage.addEventListener('pointercancel',leave,{passive:true});
  function endTouch(e){if(e.pointerType==='touch'&&stage.classList.contains('is-dragging'))leave();}
  stage.addEventListener('pointerup',endTouch,{passive:true});
  return ()=>{dead=true;leave();stage.removeEventListener('pointermove',move);stage.removeEventListener('pointerdown',move);stage.removeEventListener('pointerleave',leave);stage.removeEventListener('pointercancel',leave);stage.removeEventListener('pointerup',endTouch);};
}
