/** In-between Shift v5 — optical-depth stage. No per-card bounding boxes,
 * no intervals, no JS animation loop. Only one pointer RAF while moving.
 * The user can turn motion on even when Windows asks to reduce motion.
 */
const stage = document.getElementById('stage');
if (stage && !stage.querySelector('.stage-depth')) {
  const layer = document.createElement('div');
  layer.className = 'stage-depth';
  layer.setAttribute('aria-hidden','true');
  for (const name of ['distance','middle','keylight','vignette']) {
    const div = document.createElement('div');
    div.className = `stage-depth__${name}`;
    layer.appendChild(div);
  }
  stage.prepend(layer);
  const key = 'inbetween-stage-depth-motion-v5'; // Do not inherit old trial toggle state.
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  let userChoice = null;
  try {const saved = localStorage.getItem(key); if(saved==='on'||saved==='off') userChoice=saved;} catch (_) {}
  const toggle = document.createElement('button');
  toggle.type='button';
  toggle.className='stage-depth-motion-toggle';
  toggle.setAttribute('aria-label','공간 모션 설정');
  stage.append(toggle);
  let on=false;
  let pointerFrame=0;
  let bounds=null;
  let px=0,py=0;
  const apply=()=>{
    pointerFrame=0;
    layer.style.setProperty('--scene-deep-x',`${(-px*.30).toFixed(1)}px`);
    layer.style.setProperty('--scene-deep-y',`${(-py*.23).toFixed(1)}px`);
    layer.style.setProperty('--scene-mid-x',`${(px*.45).toFixed(1)}px`);
    layer.style.setProperty('--scene-mid-y',`${(py*.27).toFixed(1)}px`);
    layer.style.setProperty('--scene-light-x',`${(px*.62).toFixed(1)}px`);
  };
  const schedule=()=>{if(!pointerFrame)pointerFrame=requestAnimationFrame(apply);};
  const reset=()=>{px=py=0;schedule();};
  function setMode(){
    on=userChoice===null?!reduce.matches:userChoice==='on';
    document.documentElement.dataset.spaceMotion=on?'on':'off';
    toggle.textContent=on?'공간 모션 끄기':'공간 모션 켜기';
    toggle.setAttribute('aria-pressed',String(on));
    if(!on)reset();
  }
  toggle.addEventListener('click',()=>{
    userChoice=on?'off':'on';
    try{localStorage.setItem(key,userChoice);}catch(_){}
    setMode();
  });
  if(reduce.addEventListener)reduce.addEventListener('change',setMode);
  else reduce.addListener(setMode);
  stage.addEventListener('pointerenter',()=>{bounds=stage.getBoundingClientRect();},{passive:true});
  stage.addEventListener('pointermove',e=>{
    if(!on || (e.pointerType && e.pointerType!=='mouse'))return;
    const b=bounds||(bounds=stage.getBoundingClientRect());
    if(!b.width||!b.height)return;
    px=Math.max(-1,Math.min(1,(e.clientX-b.left)/b.width*2-1))*55;
    py=Math.max(-1,Math.min(1,(e.clientY-b.top)/b.height*2-1))*32;
    schedule();
  },{passive:true});
  stage.addEventListener('pointerleave',()=>{bounds=null;reset();},{passive:true});
  window.addEventListener('resize',()=>{bounds=null;},{passive:true});
  window.addEventListener('scroll',()=>{bounds=null;},{passive:true});
  window.addEventListener('pagehide',()=>{if(pointerFrame)cancelAnimationFrame(pointerFrame);},{once:true});
  setMode();
}
