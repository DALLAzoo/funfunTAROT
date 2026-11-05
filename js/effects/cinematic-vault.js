import {sampleCard} from '../motion/animation/card-animation.js';
/* In-between Shift — scene study 01, original scenic art and motion.
   The deck, card art and the application state machine are untouched. */
const stage = document.getElementById('stage');
if (stage && !stage.querySelector('.cinema-vault__world')) {
  stage.classList.add('cinema-vault');
  const scene = document.createElement('div');
  scene.className = 'cinema-vault__world';
  scene.setAttribute('aria-hidden','true');
  scene.innerHTML = `
    <div class="cinema-vault__depth"></div>
    <svg class="cinema-vault__rocks" viewBox="0 0 1200 700" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <defs>
        <linearGradient id="cinema-rock-left" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stop-color="#060f19"/>
          <stop offset=".55" stop-color="#182b38"/>
          <stop offset="1" stop-color="#0e1d29"/>
        </linearGradient>
        <linearGradient id="cinema-rock-right" x1="1" y1="0" x2="0" y2="0">
          <stop offset="0" stop-color="#071019"/>
          <stop offset=".65" stop-color="#243341"/>
          <stop offset="1" stop-color="#101f2c"/>
        </linearGradient>
        <linearGradient id="cinema-rock-back" x1="0" y1="1" x2="0" y2="0">
          <stop offset="0" stop-color="#172a35"/><stop offset="1" stop-color="#0b1a25"/>
        </linearGradient>
      </defs>
      <path d="M0 475 L66 429 105 455 155 417 203 476 290 463 350 507 405 476 454 542 550 534 630 566 765 543 837 511 934 536 1018 450 1091 471 1135 415 1200 448 1200 700 0 700 Z" fill="url(#cinema-rock-back)" opacity=".72"/>
      <path d="M0 0 L148 0 182 109 134 186 218 289 158 398 214 497 116 600 0 673 Z" fill="url(#cinema-rock-left)"/>
      <path d="M0 0 L148 0 182 109 105 223 137 334 44 395 0 430 Z" fill="#273b47" opacity=".50"/>
      <path d="M104 223 L218 289 158 398 214 497 116 600 152 451 98 398 Z" fill="#42505a" opacity=".21"/>
      <path d="M1200 0 L1051 0 1012 95 1066 177 990 285 1033 384 954 492 1082 602 1200 659 Z" fill="url(#cinema-rock-right)"/>
      <path d="M1200 0 L1051 0 1012 95 1094 215 1045 321 1139 391 1200 425 Z" fill="#314554" opacity=".41"/>
      <path d="M1094 215 L990 285 1033 384 954 492 1082 602 1044 457 1102 403 Z" fill="#5f6a6b" opacity=".14"/>
      <g stroke="#81939b" stroke-width="2" fill="none" opacity=".18">
        <path d="M145 0 L173 112 116 233 180 307 141 389 178 486"/>
        <path d="M1057 0 L1030 98 1086 217 1010 293 1051 382 991 471"/>
      </g>
    </svg>
    <div class="cinema-vault__shaft"></div>
    <div class="cinema-vault__halo"></div>
    <div class="cinema-vault__haze cinema-vault__haze--rear"></div>
    <div class="cinema-vault__haze cinema-vault__haze--near"></div>
    <div class="cinema-vault__particles"></div>
    <div class="cinema-vault__archlight"></div>
    <div class="cinema-vault__beam cinema-vault__beam--wide"></div>
    <div class="cinema-vault__beam cinema-vault__beam--core"></div>
    <div class="cinema-vault__bounce"></div>
    <div class="cinema-vault__light-dust"></div>
    <div class="cinema-vault__shade"></div>`;
  // Insert beneath existing 3D card stage, never intercept pointer events.
  stage.prepend(scene);
  // Explicit user selection wins over OS preference for this scene only.
  // OS reduced-motion starts in a static state, while keeping the scene visible.
  const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
  let override = null;
  let enabled = false;
  let raf = 0;
  let targetX = 0, targetY = 0;
  let rect = null;
  const toggle = document.createElement('button');
  toggle.type='button';toggle.className='cinema-vault__toggle';
  toggle.setAttribute('aria-label','영화적 공간 모션 전환');
  stage.append(toggle);
  function paint(){
    raf=0;
    stage.style.setProperty('--scene-mx',`${targetX.toFixed(1)}px`);
    stage.style.setProperty('--scene-my',`${targetY.toFixed(1)}px`);
  }
  function schedule(){if(!raf)raf=requestAnimationFrame(paint);}
  let refreshCardLighting=()=>{};
  function sync(){
    enabled=override===null ? !preference.matches : override;
    document.documentElement.dataset.cinemaMotion = enabled?'on':'off';
    toggle.textContent=enabled?'장면 모션 끄기':'장면 모션 켜기';
    toggle.setAttribute('aria-pressed',String(enabled));
    if(!enabled){targetX=targetY=0;schedule();}
    refreshCardLighting();
  }
  toggle.addEventListener('click',()=>{override=!enabled;sync();});
  if(preference.addEventListener)preference.addEventListener('change',()=>{if(override===null)sync();});
  else preference.addListener(()=>{if(override===null)sync();});
  stage.addEventListener('pointerenter',()=>{rect=stage.getBoundingClientRect();},{passive:true});
  stage.addEventListener('pointermove',(ev)=>{
    if(!enabled || (ev.pointerType && ev.pointerType!=='mouse'))return;
    const r=rect||(rect=stage.getBoundingClientRect());
    if(!r.width||!r.height)return;
    targetX=Math.max(-1,Math.min(1,(ev.clientX-r.left)/r.width*2-1))*34;
    targetY=Math.max(-1,Math.min(1,(ev.clientY-r.top)/r.height*2-1))*20;
    schedule();
  },{passive:true});
  stage.addEventListener('pointerleave',()=>{rect=null;targetX=targetY=0;schedule();},{passive:true});
  window.addEventListener('resize',()=>{rect=null;},{passive:true});
  window.addEventListener('pagehide',()=>{if(raf)cancelAnimationFrame(raf);},{once:true});
  refreshCardLighting=initCardLighting(stage, () => enabled);
  sync();
}

/* Real card-linked reflections during existing v6 shuffle.
   Sample existing WAAPI poses on foreground cards only, at <=24 Hz.
   No geometry reads, no new 3D paths and no writes to card transforms. */
function initCardLighting(stage, isSceneMoving){
  const clamp=(v,min,max)=>Math.max(min,Math.min(max,v));
  let raf=0,previous=0,active=false;
  const cards=stage.querySelector('#cards');
  if(!cards)return;
  const clear=()=>{
    for(const el of cards.querySelectorAll('.cinema-shuffle__hero')){
      el.style.removeProperty('--cinema-spec-x');
      el.style.removeProperty('--cinema-spec-power');
      el.style.removeProperty('--cinema-edge-light');
    }
  };
  function tick(time){
    raf=0;
    if(!stage.isConnected)return;
    const shuffling=stage.classList.contains('cinematic-shuffle');
    if(!shuffling||!isSceneMoving()){
      if(active){active=false;clear();}
      return;
    }
    active=true;
    if(time-previous>=42){
      previous=time;
      const width=Math.max(1,stage.clientWidth);
      for(const el of cards.querySelectorAll('.cinema-shuffle__hero')){
        const p=sampleCard(el);
        if(!p)continue;
        // A single overhead key light in world space. Card tilt changes the
        // point and strength of reflection on the rotating *actual face*.
        const lateral=clamp(p.x/(width*.44),-1,1);
        const x=clamp(49-p.ry*1.42-lateral*21,16,84);
        const angular=Math.cos(p.ry*Math.PI/180)*Math.cos(p.rx*Math.PI/180);
        const power=clamp(.34+Math.max(0,angular)*.27-Math.abs(lateral)*.10,.18,.67);
        const edge=clamp(.35+angular*.35-Math.abs(lateral)*.14,.18,.76);
        el.style.setProperty('--cinema-spec-x',x.toFixed(1)+'%');
        el.style.setProperty('--cinema-spec-power',power.toFixed(3));
        el.style.setProperty('--cinema-edge-light',edge.toFixed(3));
      }
    }
    raf=requestAnimationFrame(tick);
  }
  function schedule(){
    if(raf)return;
    if(stage.classList.contains('cinematic-shuffle')&&isSceneMoving())raf=requestAnimationFrame(tick);
    else if(active){active=false;clear();}
  }
  // Existing v6 toggles 'cinematic-shuffle' and hero classes; watch only these changes.
  const observer=new MutationObserver(schedule);
  observer.observe(stage,{attributes:true,attributeFilter:['class','data-cinema-state'],childList:true,subtree:true});
  window.addEventListener('pagehide',()=>{observer.disconnect();cancelAnimationFrame(raf);},{once:true});
  schedule();
  return schedule;
}
