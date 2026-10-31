import {CONFIG as C, stageSize} from '../../settings/config/config.js';

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

  window.addEventListener('resize', () => {
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
    }
  });
}
