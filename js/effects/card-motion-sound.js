/* v39 — quiet card-surface foley. No meteor sound. No change to card choreography.
   Web Audio starts only after a user gesture; a failure never blocks the cards. */
const urls = {
  shuffle: new URL('../../assets/audio/card-shuffle.mp3', import.meta.url).href,
  fan: new URL('../../assets/audio/card-fan.mp3', import.meta.url).href,
  drag: new URL('../../assets/audio/card-drag.mp3', import.meta.url).href,
  pick: new URL('../../assets/audio/card-pick.mp3', import.meta.url).href,
  travel: new URL('../../assets/audio/card-travel.mp3', import.meta.url).href,
  flip: new URL('../../assets/audio/card-flip.mp3', import.meta.url).href
};
const AudioCtx = window.AudioContext || window.webkitAudioContext;
let context = null;
let master = null;
let generation = 0;
let dragWanted = false;
let dragVoice = null;
const voices = new Set();
const decoded = new Map();
const decodes = new Map();
// Fetch small audio data early, without creating an audio context or playing sound.
const downloads = new Map(Object.entries(urls).map(([name, url]) => [name,
  fetch(url).then(r => {if (!r.ok) throw new Error('missing card audio');return r.arrayBuffer();}).catch(() => null)
]));
function setup() {
  if (!AudioCtx) return false;
  if (!context) {
    try {
      context = new AudioCtx();
      master = context.createGain();
      master.gain.value = 0.85;
      master.connect(context.destination);
    } catch (_) {return false;}
  }
  if (context.state === 'suspended') context.resume().catch(() => {});
  return true;
}
function unlock(event) {
  if (event?.type === 'keydown' && !['Enter',' ','ArrowLeft','ArrowRight'].includes(event.key)) return;
  if (!setup()) return;
  for (const name of Object.keys(urls)) getBuffer(name).catch(() => {});
}
document.addEventListener('pointerdown', unlock, {capture:true,passive:true});
document.addEventListener('keydown', unlock, {capture:true});
async function getBuffer(name) {
  if (decoded.has(name)) return decoded.get(name);
  if (!setup() || !downloads.has(name)) return null;
  if (!decodes.has(name)) decodes.set(name,
    downloads.get(name).then(bytes => bytes ? context.decodeAudioData(bytes.slice(0)) : null)
      .then(buffer => {if (buffer) decoded.set(name, buffer);return buffer;})
      .catch(() => null)
  );
  return decodes.get(name);
}
function disconnectVoice(voice) {
  voices.delete(voice);
  if (dragVoice === voice) dragVoice = null;
  try {voice.source.disconnect();voice.gain.disconnect();} catch (_) {}
}
function fadeOutVoice(voice, seconds = .07) {
  if (!context || !voice) return;
  const now = context.currentTime;
  try {
    voice.gain.gain.cancelScheduledValues(now);
    voice.gain.gain.setValueAtTime(voice.gain.gain.value, now);
    voice.gain.gain.linearRampToValueAtTime(0, now + seconds);
    voice.source.stop(now + seconds + .01);
  } catch (_) {}
}
function makeVoice(buffer, volume, loop = false) {
  if (!context || context.state !== 'running' || !master) return null;
  const source = context.createBufferSource();
  const gain = context.createGain();
  source.buffer = buffer;
  source.loop = loop;
  gain.gain.value = Math.max(0,Math.min(.65,volume));
  source.connect(gain);gain.connect(master);
  const voice = {source, gain};
  voices.add(voice);
  source.onended = () => disconnectVoice(voice);
  return voice;
}
async function play(name, options = {}) {
  const at = performance.now(), token = generation;
  const buffer = await getBuffer(name);
  if (!buffer || token !== generation || document.hidden || performance.now()-at > 650) return;
  const voice = makeVoice(buffer, options.volume ?? .34);
  if (!voice) return;
  if (options.durationMs) voice.source.playbackRate.value = Math.max(.7, Math.min(1.4, buffer.duration/(options.durationMs/1000)));
  try {voice.source.start();} catch (_) {disconnectVoice(voice);}
}
async function startDrag() {
  if (dragWanted) return;
  dragWanted = true;
  const token = generation;
  const buffer = await getBuffer('drag');
  if (!dragWanted || token !== generation || !buffer || document.hidden || dragVoice) return;
  const voice = makeVoice(buffer,.01,true);
  if (!voice) return;
  dragVoice = voice;
  const now = context.currentTime;
  voice.gain.gain.setValueAtTime(.01,now);
  voice.gain.gain.linearRampToValueAtTime(.14,now+.07);
  try {voice.source.start();} catch (_) {dragVoice = null;disconnectVoice(voice);}
}
function dragMove(distance = 5) {
  if (!dragVoice || !context) return;
  const now = context.currentTime;
  const level = Math.min(.24, .08 + Math.min(40,Math.abs(distance))*.004);
  dragVoice.gain.gain.setTargetAtTime(level, now, .08);
}
function stopDrag() {
  dragWanted = false;
  if (dragVoice) {
    fadeOutVoice(dragVoice,.08);
    dragVoice = null;
  }
}
function stopMotion() {
  generation++;
  dragWanted = false;
  for (const voice of voices) fadeOutVoice(voice,.06);
  dragVoice = null;
}
document.addEventListener('visibilitychange',()=>{if(document.hidden)stopMotion();});
window.addEventListener('pagehide',stopMotion);
export const cardSounds = {play, startDrag, dragMove, stopDrag, stopMotion};
