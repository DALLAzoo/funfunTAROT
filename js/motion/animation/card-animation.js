import {CONFIG as C,stageSize} from '../../settings/config/config.js';
import {travelPose,slotPose,stackPose,mix,smooth} from '../core/cinema-core.js';
import {FINALE_DURATION} from './finale-motion.js';
import {startAnimeFanVFX} from '../../effects/anime-fan-vfx.js';
const running=new WeakMap(),samples=new WeakMap();
export const pose=(x,y,z,rot=0,ry=0,scale=1,rx=0)=>`translate(-50%,-50%) translate3d(${x}px,${y}px,${z}px) rotateZ(${rot}deg) rotateY(${ry}deg) rotateX(${rx}deg) scale(${scale})`;
export const transform=p=>pose(p.x,p.y,p.z,p.rot,p.ry,p.scale,p.rx);
const readPose=s=>{const v=[...s.matchAll(/(?:translate3d|rotateZ|rotateY|rotateX|scale)\(([^)]+)\)/g)].map(m=>m[1].split(',').map(parseFloat));return v.length===5?{x:v[0][0],y:v[0][1],z:v[0][2],rot:v[1][0],ry:v[2][0],rx:v[3][0],scale:v[4][0]}:stackPose(0,1)};
export function sampleCard(el){const tr=samples.get(el);if(!tr)return readPose(el.style.transform);const n=Math.max(0,Math.min(1,tr.animation.effect.getComputedTiming().progress??0))*(tr.poses.length-1),i=Math.min(tr.poses.length-2,Math.floor(n));return mix(tr.poses[i],tr.poses[i+1],n-i);}
export function cardSize(stage,phase='shuffle'){const width=stageSize(phase,stage.clientWidth);stage.style.setProperty('--card-w',width+'px');stage.style.setProperty('--card-h',width*C.aspect+'px');return width;}
export async function play(el,frames,duration,easing='cubic-bezier(.2,.7,.2,1)',startTime=null,observe=null){
 running.get(el)?.cancel();const a=el.animate(frames,{duration,easing,fill:'both'});if(startTime!==null)a.startTime=startTime;
 running.set(el,a);if(frames.every(f=>f.transform))samples.set(el,{animation:a,poses:frames.map(f=>readPose(f.transform))});observe?.(a);
 try{await a.finished;}catch{return false;}
 if(running.get(el)!==a)return false;
 const last=frames.at(-1);for(const k of ['transform','width','height','borderRadius'])if(last[k]!==undefined)el.style[k]=last[k];
 running.delete(el);samples.delete(el);a.cancel();return true;
}
export const animateTo=(el,to,duration=600)=>play(el,[{transform:el.style.transform||pose(0,0,0)},{transform:typeof to==='string'?to:transform(to)}],duration);
export function cancelAll(els){for(const el of els){running.delete(el);samples.delete(el);el.getAnimations({subtree:true}).forEach(a=>a.cancel());}}
export function floatLayout(els,stage){cardSize(stage);els.forEach((el,i)=>{el.hidden=false;el.style.zIndex='auto';el.style.transform=pose((i-(els.length-1)/2)*2,-8,-70-i*3,(i-(els.length-1)/2)*.7);});}
// A fixed, smoothly blended depth lane per card avoids sudden frame-by-frame
// repulsion (which caused the revision-4 stutter). It improves visual ordering,
// but does not claim to implement full rigid-body collision detection.
function shuffleLanePose(i,t,w,h,count){
 const p=travelPose(i,t,w,h,count);
 const lane=((i*7)%count-(count-1)/2)*7.5;
 const envelope=Math.sin(Math.PI*Math.max(0,Math.min(1,t)))**2;
 return {...p,z:p.z+lane*envelope};
}
// The airborne orbit stays untouched. Only the final gathering uses a
// continuous, staggered landing: cards approach the deck from the viewer side
// and settle in order rather than cutting through the finished stack.
function gatherPose(i,t,w,h,count){
 const start=.78, finish=.985;
 const order=i; // Stable stacking order, no mid-flight repulsion.
 const begin=start+order*.004;
 const end=finish-(count-1-order)*.001;
 const origin=shuffleLanePose(i,1,w,h,count), target=stackPose(i,count);
 if(t<=begin)return origin;
 const u=smooth((t-begin)/(end-begin));
 const p=mix(origin,target,u);
 // Lift in depth while traveling inward; fades to zero at both ends.
 // A card near the stack approaches from the front rather than behind it.
 const lift=Math.sin(Math.PI*u)*Math.max(125,stageSize('shuffle',w)*1.2);
 return {...p,z:p.z+lift};
}
export async function shuffleMotion(els,stage,phase=()=>{}){
 stage.classList.add('glow-shuffle-lite');
 const w=stage.clientWidth,h=stage.clientHeight,count=els.length;phase('charge');
 if(!(await Promise.all(els.map((el,i)=>animateTo(el,travelPose(i,0,w,h,count),C.shuffle.separate)))).every(Boolean)){stage.classList.remove('glow-shuffle-lite');return false;}
 phase('vortex');
 const result=await Promise.all(els.map((el,i)=>{
  const frames=[];
  for(let n=0;n<=100;n++){
   const t=n/100;
   const p=t<.78?shuffleLanePose(i,smooth(t/.78),w,h,count):gatherPose(i,t,w,h,count);
   frames.push({offset:t,transform:transform(p)});
  }
  return play(el,frames,C.shuffle.duration,'linear');
 }));stage.classList.remove('glow-shuffle-lite');return result.every(Boolean);
}
/*
 * In-between Shift — fan reveal motion study (5 s).
 * Only the opening move is changed. The exact slotPose() target, card dimensions,
 * card data, selection handlers and reveal pipeline are untouched.
 * Composition: charge -> left-to-right arc -> fan lock -> golden afterglow.
 */
const fanClamp=t=>Math.min(1,Math.max(0,t));
const fanEase=t=>1-(1-fanClamp(t))**3;
function fanAnimePose(i,count,t,from,to){
 const off=i-(count-1)/2,side=Math.sign(off),weight=1-Math.abs(off)/((count-1)/2||1);
 // Deliberately stagger the seven cards, like successive animation cels.
 const begin=.18+i*.046;
 const moveDuration=.375;
 const u=fanClamp((t-begin)/moveDuration);
 const q=fanEase(u);
 const arc=Math.sin(Math.PI*u);
 const current=mix(from,to,q);
 current.y-=arc*(22+weight*22);
 current.z+=arc*(64+weight*36);
 current.rot+=arc*side*-14;
 current.ry+=arc*side*19;
 current.rx-=arc*12;
 current.scale+=arc*.065;
 return current;
}
export async function fanMotion(els,stage,onStart=()=>{}){
 const width=stage.clientWidth;
 const fromSize=stageSize('shuffle',width),toSize=stageSize('selection',width);
 cardSize(stage,'selection');
 const duration=window.matchMedia?.('(prefers-reduced-motion: reduce)').matches?900:FINALE_DURATION;
 const start=stage.ownerDocument.timeline.currentTime;
 let leader,done=false;
 const clock={duration,width,count:els.length,progress:()=>done?1:(leader?.effect.getComputedTiming().progress??0)};
 const fx=duration===FINALE_DURATION?startAnimeFanVFX(stage,els,duration):null;
 try{
  const result=await Promise.all(els.map((el,i)=>{
   const off=i-(els.length-1)/2;
   const from={...stackPose(i,els.length),scale:fromSize/toSize};
   const to=slotPose(off,width);
   el.style.width=toSize+'px';el.style.height=toSize*C.aspect+'px';
   el.style.transform=transform(from);
   el.style.zIndex=String(100-Math.round(Math.abs(off)*20));
   el.style.opacity='1';
   const frames=[];
   if(duration===FINALE_DURATION){
    for(let n=0;n<=125;n++){
     const t=n/125;
     frames.push({offset:t,transform:transform(fanAnimePose(i,els.length,t,from,to))});
    }
   }else{
    frames.push({offset:0,transform:transform(from)},{offset:1,transform:transform(to)});
   }
   return play(el,frames,duration,duration===FINALE_DURATION?'linear':'ease-out',start,i===0?a=>{leader=a;onStart(clock)}:null);
  }));
  done=true;
  return result.every(Boolean);
 }finally{fx?.stop();}
}
