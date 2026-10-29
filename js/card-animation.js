import {SELECTION_COUNT, metrics, liftPose, orbitPose, stackPose, fanPose, mixPose, smooth} from './shuffle-paths.js';
const ease = 'cubic-bezier(.2,.7,.2,1)';
const running = new WeakMap();
const samples = new WeakMap();
function readPose(value) {
  const n=[...value.matchAll(/(?:translate3d|rotateZ|rotateY|rotateX|scale)\(([^)]+)\)/g)].map(m=>m[1].split(',').map(parseFloat));
  return n.length===5?{x:n[0][0],y:n[0][1],z:n[0][2],rot:n[1][0],ry:n[2][0],rx:n[3][0],scale:n[4][0]}:null;
}
export function sampleCard(el) {
  const track=samples.get(el);
  if(!track)return readPose(el.style.transform);
  const progress=track.animation.effect.getComputedTiming().progress;
  const t=Math.max(0,Math.min(1,progress??0))*(track.poses.length-1);
  const i=Math.min(track.poses.length-2,Math.floor(t));
  return mixPose(track.poses[i],track.poses[i+1],t-i);
}
export function cardSize(stage) {
  const w = Math.max(65, Math.min(112, stage.clientWidth * .18));
  stage.style.setProperty('--card-w', `${w}px`);
  stage.style.setProperty('--card-h', `${w * 1.58}px`);
  return w;
}
export function pose(x,y,z,rot=0,ry=0,scale=1,rx=0) {
  return `translate(-50%,-50%) translate3d(${x}px,${y}px,${z}px) rotateZ(${rot}deg) rotateY(${ry}deg) rotateX(${rx}deg) scale(${scale})`;
}
const transform = p => pose(p.x,p.y,p.z,p.rot,p.ry,p.scale,p.rx);
async function play(el, frames, duration, delay=0, easing=ease) {
  const previous = running.get(el);
  if (previous) previous.cancel();
  const animation = el.animate(frames, {duration,delay,easing,fill:'both'});
  running.set(el, animation);
  samples.set(el,{animation,poses:frames.map(f=>readPose(f.transform))});
  try { await animation.finished; }
  catch { return false; }
  if (running.get(el) !== animation) return false;
  // Commit exactly the last keyframe before removing the WAAPI effect.
  el.style.transform = frames[frames.length - 1].transform;
  running.delete(el);
  samples.delete(el);
  animation.cancel();
  return true;
}
export function animateTo(el,to,duration=650,delay=0) {
  return play(el,[{transform:el.style.transform || pose(0,0,0)},{transform:to}],duration,delay);
}
export function cancelAll(els) {
  els.forEach(el=>{
    running.delete(el);
  samples.delete(el);
    el.getAnimations({subtree:true}).forEach(a=>a.cancel());
  });
}
export function floatLayout(els,stage) {
  const width=stage.clientWidth,height=stage.clientHeight;
  els.forEach((el,i)=>{
    const a=i*2.39996,r=Math.sqrt((i+.5)/els.length);
    el.hidden=false;
    el.style.zIndex='auto'; // Z depth governs occlusion, without a fan-time order switch.
    el.style.transform=pose(Math.cos(a)*width*.30*r,Math.sin(a)*height*.24*r,Math.sin(i*2.4)*90,(i*37)%80-40,Math.cos(i)*28,.72+.2*(i%4)/3);
  });
}
export async function shuffleMotion(els,stage,phase=()=>{}) {
  phase("charge");
  const m=metrics(stage.clientWidth,stage.clientHeight);
  const lifted=await Promise.all(els.map((el,i)=>animateTo(el,transform(liftPose(i,m)),560)));
  if(lifted.some(value=>!value))return false;
  // One continuous sampled trajectory: blend onto the orbit, cross in 3 groups,
  // then decelerate onto the stack. No separate phase resets or timeout gaps.
  phase("vortex");
  const results=await Promise.all(els.map((el,i)=>{
    const frames=[];
    for(let sample=0;sample<=80;sample++){
      const t=sample/80;
      let p;
      if(t<.16)p=mixPose(liftPose(i,m),orbitPose(i,0,m),smooth(t/.16));
      else if(t<.76)p=orbitPose(i,smooth((t-.16)/.60),m);
      else p=mixPose(orbitPose(i,1,m),stackPose(i,Math.min(SELECTION_COUNT,els.length)),smooth(Math.min(1,(t-.76)/.20)));
      frames.push({offset:t,transform:transform(p)});
    }
    return play(el,frames,2600,0,'linear');
  }));
  return results.every(Boolean);
}
export function fanLayout(els,stage) {
  cardSize(stage);
  els.forEach((el,i)=>{el.style.transform=transform(fanPose(i,els.length,stage.clientWidth));});
}
export async function fanMotion(els,stage) {
  cardSize(stage);
  const results=await Promise.all(els.map((el,i)=>animateTo(el,transform(fanPose(i,els.length,stage.clientWidth)),780,i*14)));
  return results.every(Boolean);
}
export async function revealMotion(els,chosen,stage) {
  const width=stage.clientWidth;
  const results=await Promise.all(els.map((el,i)=>el===chosen
    ?animateTo(el,pose(0,-12,180,0,0,1.28),700)
    :animateTo(el,pose((i%2?1:-1)*width*.85,150,-140,0,0,.7),500)));
  if(results.some(value=>!value))return false;
  const inner=chosen.querySelector('.card-inner');
  const a=inner.animate([{transform:'rotateY(0deg)'},{transform:'rotateY(180deg)'}],{duration:900,easing:ease,fill:'both'});
  try{await a.finished;}catch{return false;}
  inner.style.transform='rotateY(180deg)';
  a.cancel();
  return true;
}
