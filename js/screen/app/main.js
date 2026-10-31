import {setStateUI, refreshCounterUI} from './ui-state.js';
import {startShuffleFlow} from './shuffle-flow.js';
import {chooseFlow} from './reveal-flow.js';
import {MagicVFX} from '../../effects/magic-vfx.js';
import {RevealVFX} from '../../effects/reveal-vfx.js';
import {bindEvents} from './events.js';
import {initializeApp} from './bootstrap.js';

const $ = selector => document.querySelector(selector);
const stage = $('#stage');
const container = $('#cards');
const status = $('#status');
const instruction = $('#instruction');
const shuffleBtn = $('#shuffleBtn');
const main = $('#tarotApp');
const resultView = $('#resultView');

// Single shared state object passed to shuffle, selection and reveal flows.
const ctx = {catalog: [], cards: [], pool: [], back: null, carousel: null, token: 0};
const uiContext = {status, shuffleBtn, $, state: 'idle'};
const getState = () => uiContext.state;
const setState = (next, label) => setStateUI(uiContext, next, label);
const refreshCounter = index => refreshCounterUI($, ctx.pool, index);

const magic = new MagicVFX(stage);
const revealMagic = new RevealVFX($('#resultCardHost'));
Object.assign(ctx, {
  stage, container, instruction, main, resultView,
  magic, revealMagic, $, setState, getState, refreshCounter
});

const startShuffle = () => startShuffleFlow(ctx);
ctx.choose = chosen => chooseFlow(ctx, chosen);

bindEvents({ctx, $, shuffleBtn, startShuffle, getState});
await initializeApp({ctx, $, stage, container, status, setState});
