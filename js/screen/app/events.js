import {CONFIG as C, stageSize} from '../../settings/config/config.js';

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
  dropdown.addEventListener('click', () => {
    if (dropdown.disabled) return;
    const open = options.hidden;
    options.hidden = !open;
    dropdown.setAttribute('aria-expanded', String(open));
  });
  options.querySelector('.reading-option').addEventListener('click', () => {
    // Share the selected value, not the dropdown element, with the title.
    ctx.readingSelection = '조언 - 당신을 위한';
    const resultTitle = $('#resultSelectionTitle');
    if (resultTitle) resultTitle.textContent = ctx.readingSelection;
    dropdown.firstChild.textContent = '조언 - 당신을 위한 ';
    options.hidden = true;
    dropdown.setAttribute('aria-expanded', 'false');
    // Focus restoration must not scroll the page after a menu selection.
    try { dropdown.focus({preventScroll:true}); } catch (_) { dropdown.focus(); }
  });
  document.addEventListener('click', e => {
    if (!dropdown.parentElement.contains(e.target)) {
      options.hidden = true;
      dropdown.setAttribute('aria-expanded', 'false');
    }
  });
  dropdown.addEventListener('keydown', e => {
    if (e.key === 'Escape') { options.hidden = true; dropdown.setAttribute('aria-expanded', 'false'); }
  });

  window.addEventListener('resize', () => {
    if (getState() === 'idle' && ctx.cards.length) {
      floatLayout(ctx.cards, ctx.stage);cardSize(ctx.stage,'selection');alignIdleDeck(ctx.cards);
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
      $('#resultView').style.setProperty('--result-width',w+'px');
      $('#resultView').style.setProperty('--result-height',w*C.aspect+'px');
      const heading = $('#resultSelectionTitle');
      if (heading) {
        $('#resultView').style.setProperty('--reveal-top',Math.round(
          heading.getBoundingClientRect().bottom-$('#resultView').getBoundingClientRect().top+
          (window.matchMedia?.('(min-width:700px) and (min-height:550px) and (hover:none) and (pointer:coarse)').matches?24:12))+'px');
      }
    }
  });
}
