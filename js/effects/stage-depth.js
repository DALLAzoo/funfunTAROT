/** Cinematic stage v4. No interval, card-geometry sampling, full-stage blur or continuous JS paint loop.
 * The stage is intentionally a floating, floorless dark space.
 * Motion preference applies to THIS atmospheric layer only; users can override it on-page.
 */
const stage = document.getElementById('stage');
if (stage && !stage.querySelector('.stage-depth')) {
  const backdrop = document.createElement('div');
  backdrop.className = 'stage-depth';
  backdrop.setAttribute('aria-hidden', 'true');
  for (const name of ['distance','keylight','edge-vignette']) {
    const el = document.createElement('div');
    el.className = `stage-depth__${name}`;
    backdrop.appendChild(el);
  }
  stage.prepend(backdrop);

  const motionPref = window.matchMedia('(prefers-reduced-motion: reduce)');
  const storageKey = 'inbetween-stage-depth-motion';
  let chosen = null;
  try { const v = localStorage.getItem(storageKey); if (v==='on'||v==='off') chosen=v; } catch (_) {}
  const control = document.createElement('button');
  control.className = 'stage-depth-motion-toggle';
  control.type = 'button';
  control.setAttribute('aria-label','공간 움직임 설정');
  stage.appendChild(control);
  let enabled = false;
  let pointerRaf = 0;
  let cachedBounds = null;
  let pointerX = 0, pointerY = 0;
  function applyPointer() {
    pointerRaf = 0;
    backdrop.style.setProperty('--scene-far-x', `${(-pointerX*.24).toFixed(1)}px`);
    backdrop.style.setProperty('--scene-far-y', `${(-pointerY*.17).toFixed(1)}px`);
    backdrop.style.setProperty('--scene-light-x', `${(pointerX*.38).toFixed(1)}px`);
  }
  function schedulePointer(){if(!pointerRaf)pointerRaf=requestAnimationFrame(applyPointer);}
  function resetPointer(){pointerX=pointerY=0;schedulePointer();}
  function updateMotionState() {
    enabled = chosen === null ? !motionPref.matches : chosen === 'on';
    document.documentElement.dataset.spaceMotion = enabled ? 'on' : 'off';
    control.textContent = enabled ? '공간 모션 끄기' : '공간 모션 켜기';
    control.setAttribute('aria-pressed',String(enabled));
    if (!enabled) resetPointer();
  }
  control.addEventListener('click',()=>{
    chosen = enabled?'off':'on';
    try{localStorage.setItem(storageKey,chosen);}catch(_){}
    updateMotionState();
  });
  if(motionPref.addEventListener)motionPref.addEventListener('change',updateMotionState);
  else motionPref.addListener(updateMotionState);
  stage.addEventListener('pointerenter',()=>{cachedBounds=stage.getBoundingClientRect();},{passive:true});
  stage.addEventListener('pointermove',(event)=>{
    if(!enabled || (event.pointerType && event.pointerType!=='mouse'))return;
    const b=cachedBounds || (cachedBounds=stage.getBoundingClientRect());
    if(b.width<1||b.height<1)return;
    pointerX = Math.max(-1,Math.min(1,2*(event.clientX-b.left)/b.width-1))*40;
    pointerY = Math.max(-1,Math.min(1,2*(event.clientY-b.top)/b.height-1))*24;
    schedulePointer();
  },{passive:true});
  stage.addEventListener('pointerleave',()=>{cachedBounds=null;resetPointer();},{passive:true});
  window.addEventListener('resize',()=>{cachedBounds=null;},{passive:true});
  window.addEventListener('scroll',()=>{cachedBounds=null;},{passive:true});
  window.addEventListener('pagehide',()=>{if(pointerRaf)cancelAnimationFrame(pointerRaf);},{once:true});
  updateMotionState();
}
