import {setStateUI, refreshCounterUI} from './ui-state.js';
import {isCompactTouchLandscape,updateResponsiveDesignMetrics} from '../../settings/config/config.js';
import {startShuffleFlow} from './shuffle-flow.js';
import {chooseFlow} from './reveal-flow.js';
import {MagicVFX} from '../../effects/magic-vfx.js';
import {RevealVFX} from '../../effects/reveal-vfx.js';
import {bindEvents} from './events.js';
import {initializeApp} from './bootstrap.js';
import {initReadingScrollCue} from './reading-scroll-cue.js';
import {setupStageBoundary} from './stage-boundary.js';
import {createImageError} from './image-error.js';
import '../../effects/shooting-stars.js'; // AD1 v16: distant meteors, background only
import '../../effects/button-impact.js'; // AD1 v28: gold press and lingering feedback

const $ = selector => document.querySelector(selector);
const stage = $('#stage');
const container = $('#cards');
const status = $('#status');
const instruction = $('#instruction');
const shuffleBtn = $('#shuffleBtn');
const main = $('#tarotApp');
const resultView = $('#resultView');

// Single shared state object passed to shuffle, selection and reveal flows.
const ctx = {catalog: [], cards: [], pool: [], back: null, carousel: null, token: 0, errorNotice:createImageError()};
const uiContext = {status, shuffleBtn, $, state: 'idle'};
const getState = () => uiContext.state;
const setState = (next, label) => {
  // Only the short phone-landscape status panel uses compact, readable copy.
  // All other screen sizes retain the existing wording and state transitions.
  if (next === 'selection' && isCompactTouchLandscape()) {
    label = !ctx.readingSelection ? '먼저 궁금한 내용을 선택해 주세요.'
      : ctx.carousel?.selectedCard ? '선택한 카드를 다시 눌러 공개하세요.'
      : '마음이 끌리는 카드를 선택해 주세요.';
  }
  setStateUI(uiContext, next, label);
  ctx.updateMenuHint?.();
};
const refreshCounter = index => refreshCounterUI($, ctx.pool, index);

const magic = new MagicVFX(stage);
const revealMagic = new RevealVFX($('#resultCardHost'));
Object.assign(ctx, {
  stage, container, instruction, main, resultView,
  magic, revealMagic, $, setState, getState, refreshCounter
});

const startShuffle = () => startShuffleFlow(ctx);
ctx.choose = chosen => chooseFlow(ctx, chosen);

updateResponsiveDesignMetrics();
let responsiveMetricsFrame=0;
window.addEventListener('resize',()=>{
 if(responsiveMetricsFrame)cancelAnimationFrame(responsiveMetricsFrame);
 responsiveMetricsFrame=requestAnimationFrame(()=>{
  responsiveMetricsFrame=0;
  updateResponsiveDesignMetrics();
 });
},{passive:true});
bindEvents({ctx, $, shuffleBtn, startShuffle, getState});
setupStageBoundary(stage, main.querySelector('.controls .actions'), main);
initReadingScrollCue();
await initializeApp({ctx, $, stage, container, status, setState});
