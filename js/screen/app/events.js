import {CONFIG as C, stageSize, updateResponsiveDesignMetrics} from '../../settings/config/config.js';

import {cardSize,floatLayout,alignIdleDeck,refreshMotion} from '../../motion/animation/card-animation.js';

import {resizeResultCard} from '../../motion/reveal/center-motion.js';

/** Register navigation, selection, shuffle and responsive layout handlers. */
export function bindEvents({ctx, $, shuffleBtn, startShuffle, getState}) {
  $('#prevBtn').addEventListener('click', () => {
    if (getState() === 'selection') ctx.carousel?.step(-1);
  });
  $('#nextBtn').addEventListener('click', () => {
    if (getState() === 'selection') ctx.carousel?.step(1);
  });
  $('#selectBtn').addEventListener('click', () => {
    ctx.carousel?.confirm();
  });
  shuffleBtn.addEventListener('click', startShuffle);
  $('#resultAgain').addEventListener('click', startShuffle);
  const dropdown = $('#readingDropdown');
  const options = $('#readingOptions');
  const menuHint = document.createElement('span');
  menuHint.className = 'ad2-menu-hint ad2-guide-disc';
  menuHint.setAttribute('aria-hidden', 'true');
  menuHint.innerHTML = '<svg class="ad2-guide-icon ad2-guide-icon--down" viewBox="0 0 24 24" focusable="false"><path d="m9 18 6-6-6-6"/></svg>';
  dropdown.parentElement.append(menuHint);
  ctx.menuHintRequested = false;
  ctx.updateMenuHint = () => {
    // Once requested, keep the cue visible until an option is actually selected.
    // On touch landscape, the menu opens above the button: lift the cue above
    // the opened list so it remains visible without covering any option.
    const visible = !ctx.readingSelection &&
      ctx.getState() === 'selection' && !dropdown.disabled;
    const menuOpen = visible && !options.hidden;
    if (menuOpen) {
      menuHint.style.setProperty('--ad2-menu-open-height', options.getBoundingClientRect().height + 'px');
    }
    menuHint.classList.toggle('is-menu-open', menuOpen);
    menuHint.classList.toggle('is-visible', visible);
  };
  ctx.showMenuHint = () => {
    ctx.menuHintRequested = true;
    ctx.updateMenuHint();
  };
  dropdown.addEventListener('click', () => {
    if (dropdown.disabled) return;
    const open = options.hidden;
    options.hidden = !open;
    dropdown.setAttribute('aria-expanded', String(open));
    ctx.updateMenuHint();
  });
  options.querySelectorAll('.reading-option').forEach(option => {
    option.addEventListener('click', () => {
      // The user's choice is explicit and persists through further shuffles.
      ctx.readingSelection = option.textContent.trim();
      $('#resultSelectionTitle').textContent = ctx.readingSelection;
      dropdown.textContent = ctx.readingSelection;
      options.querySelectorAll('.reading-option').forEach(other => {
        other.setAttribute('aria-selected', String(other === option));
      });
      options.hidden = true;
      dropdown.setAttribute('aria-expanded', 'false');
      ctx.menuHintRequested = false;
      ctx.updateMenuHint();
      // The fan may already have a picked card. Reflect its real next action.
      if (ctx.getState() === 'selection') {
        const hasPicked = Boolean(ctx.carousel?.selectedCard);
        ctx.setState('selection', hasPicked
          ? '선택한 카드를 다시 누르면 공개됩니다.'
          : '카드를 한 번 누르면 선택, 다시 누르면 공개됩니다');
      }
      try { dropdown.focus({preventScroll:true}); } catch (_) { dropdown.focus(); }
    });
  });
  document.addEventListener('click', e => {
    if (!dropdown.parentElement.contains(e.target)) {
      options.hidden = true;
      dropdown.setAttribute('aria-expanded', 'false');
      ctx.updateMenuHint();
    }
  });
  dropdown.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
      options.hidden = true;
      dropdown.setAttribute('aria-expanded', 'false');
      ctx.updateMenuHint();
    }
  });

  // One scheduled update after viewport, input-profile, font or actual stage
  // geometry changes. No temporary DOM replica or competing resize writer.
  let pending=0,lastGeometry='';
  const update=()=>{
    pending=0;
    window.tarotViewportProfile?.refresh?.();
    updateResponsiveDesignMetrics();
    ctx.measureStageBoundary?.();
    const view=$('#resultView'),heading=$('#resultSelectionTitle');
    const actions=ctx.main.querySelector('.controls .actions');
    const key=[innerWidth,innerHeight,ctx.stage.clientWidth,ctx.stage.clientHeight,
      actions.offsetWidth,actions.offsetHeight,heading?.offsetHeight,
      document.documentElement.className,getState(),view.hidden].join('|');
    if(key===lastGeometry)return;
    lastGeometry=key;
    const state=getState();
    if(state==='idle' && ctx.cards.length){
      floatLayout(ctx.cards,ctx.stage);cardSize(ctx.stage,'idle');alignIdleDeck(ctx.cards);
    }else if(state==='selection'){
      // layout() also works during a snap; it keeps the current fractional slot.
      ctx.carousel?.layout();
    }else if(state==='shuffling'){
      cardSize(ctx.stage,ctx.stage.classList.contains('orbit-opening')?'selection':'shuffle');
      refreshMotion(ctx.cards);
    }
    if((state==='revealing'||state==='result') && !view.hidden){
      const card=$('.result-card'),host=$('#resultCardHost');
      if(card && host){
        const width=stageSize('result',innerWidth);
        view.style.setProperty('--result-width',width+'px');
        view.style.setProperty('--result-height',width*C.aspect+'px');
        resizeResultCard(card,host,width);
      }
    }
    ctx.updateMenuHint?.();
  };
  const schedule=()=>{if(!pending)pending=requestAnimationFrame(update);};
  window.addEventListener('resize',schedule,{passive:true});
  window.addEventListener('orientationchange',schedule,{passive:true});
  window.visualViewport?.addEventListener('resize',schedule,{passive:true});
  window.matchMedia('(hover:none) and (pointer:coarse)').addEventListener?.('change',schedule);
  const observer=new ResizeObserver(schedule);
  observer.observe(ctx.stage);
  observer.observe(ctx.main.querySelector('.controls .actions'));
  observer.observe($('#sharedIntro'));
  document.fonts?.ready.then(schedule);
  ctx.refreshResponsiveLayout=schedule;
}
