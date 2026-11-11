import {CONFIG as C, stageSize, isCompactTouchLandscape,isAdaptiveTablet} from '../../settings/config/config.js';

import {cardSize,floatLayout,alignIdleDeck} from '../../motion/animation/card-animation.js';

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
    const visible = ctx.menuHintRequested && !ctx.readingSelection &&
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

  window.addEventListener('resize', () => {
    if (getState() === 'idle' && ctx.cards.length) {
      floatLayout(ctx.cards, ctx.stage);cardSize(ctx.stage,(isCompactTouchLandscape()||isAdaptiveTablet())?'idle':'selection');alignIdleDeck(ctx.cards);
    }
    if (getState() === 'selection' && !ctx.carousel?.busy) {
      ctx.carousel.layout();
    }
    if (getState() === 'result') {
      const el = $('.result-card');
      const w = stageSize('result', innerWidth);
      el.style.width = w + 'px';
      el.style.height = w * C.aspect + 'px';
      const host = $('#resultCardHost');
      host.style.width = w + 'px';host.style.height = w * C.aspect + 'px';
      host.style.removeProperty('--result-width');
      $('#resultView').style.setProperty('--result-width',w+'px');
      $('#resultView').style.setProperty('--result-height',w*C.aspect+'px');
      // Recalculate the selection-screen button anchor after tablet resize/rotation.
      // A layout-only replica preserves the original first-screen placement while
      // #tarotApp is hidden and its shared heading lives inside #resultView.
      const touchPortrait=window.matchMedia?.(
        '(orientation:portrait) and (hover:none) and (pointer:coarse)'
      ).matches;
      if (touchPortrait) {
        const original=$('#tarotApp');
        const replica=document.createElement('main');
        replica.className=original.className;
        replica.style.cssText='position:absolute;left:0;top:0;width:100%;visibility:hidden;pointer-events:none;z-index:-1;';
        const intro=$('#sharedIntro').cloneNode(true);
        const title=intro.querySelector('h1');
        if (title) title.textContent='어떤 메시지가 기다릴까요?';
        replica.append(intro);
        const stage=document.createElement('section');stage.className=$('#stage').className;
        replica.append(stage);
        replica.append(original.querySelector('.controls').cloneNode(true));
        document.body.append(replica);
        const action=replica.querySelector('.controls .actions').getBoundingClientRect();
        replica.remove();
        const sourceActionTop=Math.round(
          Math.max(8,Math.min(innerHeight-action.height-8,action.top)));
        const view=$('#resultView');
        view.style.setProperty('--portrait-actions-top',sourceActionTop+'px');
        if (window.matchMedia('(min-width:700px)').matches) {
          view.style.setProperty('--tablet-actions-top',sourceActionTop+'px');
        }
      }
      const heading = $('#resultSelectionTitle');
      if (heading) {
        $('#resultView').style.setProperty('--reveal-top',Math.round(
          heading.getBoundingClientRect().bottom-$('#resultView').getBoundingClientRect().top+
          (window.matchMedia?.('(min-width:700px) and (min-height:550px) and (hover:none) and (pointer:coarse)').matches?24:12))+'px');
      }
    }
  });
}
