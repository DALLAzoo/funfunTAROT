/**
 * One lower stage boundary for every non-phone-landscape layout.
 * Cut the card stage exactly 10px above the real (possibly fixed) buttons,
 * without moving the stage, cards or controls. Phone landscape is unclipped.
 * Measuring on layout/viewport changes avoids device-specific pixel rules.
 */
export function setupStageBoundary(stage, actions, app){
  let scheduled=false;
  const measure=()=>{
    scheduled=false;
    if(document.documentElement.classList.contains('phone-landscape')){
      stage.style.removeProperty('--stage-bottom-clip-inset');
      return;
    }
    const stageRect=stage.getBoundingClientRect();
    const actionsRect=actions.getBoundingClientRect();
    if(!stageRect.height || !actionsRect.height)return;
    const inset=stageRect.bottom-(actionsRect.top-10);
    stage.style.setProperty('--stage-bottom-clip-inset',`${Math.round(inset*100)/100}px`);
  };
  const refresh=()=>{
    if(scheduled)return;
    scheduled=true;
    requestAnimationFrame(measure);
  };
  const observer=new ResizeObserver(refresh);
  observer.observe(stage);
  observer.observe(actions);
  observer.observe(app);
  observer.observe(app.querySelector('.controls'));
  window.addEventListener('resize',refresh,{passive:true});
  window.addEventListener('orientationchange',refresh,{passive:true});
  window.visualViewport?.addEventListener('resize',refresh,{passive:true});
  document.fonts?.ready.then(refresh);
  refresh();
  return measure;
}
