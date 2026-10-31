import {CONFIG as C,stageSize} from '../../settings/config/config.js';
// One scalar drives both the pressure wave radius and every card's opening pose.
export const FINALE_DURATION = C.finale.duration;
export const clamp01 = t => Math.max(0, Math.min(1,t));
export function pressureProgress(t) {
  t=clamp01(t);
  if(t===0||t===1)return t;
  const u=t*t*(3-2*t), k=C.finale.pressure;
  return (1-Math.exp(-k*u)*(1+k*u))/(1-Math.exp(-k)*(1+k));
}
export function waveRadius(progress,width,count=C.counts.visible) {
  const cw=stageSize('selection',width);
  const reach=Math.min(width*C.finale.waveRadiusFraction,C.finale.waveReach);
  return 14+(Math.max(cw*.8,reach)-14)*progress;
}

// Match the exact linear interpolation between the 81 WAAPI keyframes.
export function samplePressure(t) {
  const n=clamp01(t)*80,i=Math.min(79,Math.floor(n));
  const a=pressureProgress(i/80),b=pressureProgress((i+1)/80);
  return a+(b-a)*(n-i);
}
