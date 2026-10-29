// One scalar drives both the pressure wave radius and every card's opening pose.
export const FINALE_DURATION = 1040;
export const clamp01 = t => Math.max(0, Math.min(1,t));
export function pressureProgress(t) {
  t=clamp01(t);
  if(t===0||t===1)return t;
  const u=t*t*(3-2*t), k=6;
  return (1-Math.exp(-k*u)*(1+k*u))/(1-Math.exp(-k)*(1+k));
}
export function waveRadius(progress,width,count=9) {
  const cw=Math.max(65,Math.min(112,width*.18));
  const reach=Math.min(width*.48,410);
  return 14+(Math.max(cw*.8,reach)-14)*progress;
}

// Match the exact linear interpolation between the 81 WAAPI keyframes.
export function samplePressure(t) {
  const n=clamp01(t)*80,i=Math.min(79,Math.floor(n));
  const a=pressureProgress(i/80),b=pressureProgress((i+1)/80);
  return a+(b-a)*(n-i);
}
