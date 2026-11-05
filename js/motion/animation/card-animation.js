import {CONFIG as C,stageSize} from '../../settings/config/config.js';
import {slotPose,stackPose,mix,smooth} from '../core/cinema-core.js';
import {FINALE_DURATION,pressureProgress} from './finale-motion.js';
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

/* In-between Shift v5 — cinematic orbital shuffle, not an interleaved riffle.
   Three depth-separated orbital lanes. Cards in the same lane maintain their
   angular order (no passing); landing is staggered above the stack.
   This is art-directed motion, not a physics-based collision solver. */
const PI = Math.PI;
function orbitPose(i,count,t,w,h,size){
 const lane=i%3,rank=Math.floor(i/3);
 const lanes=[Math.ceil(count/3),Math.ceil((count-1)/3),Math.floor(count/3)];
 const slots=lanes[lane];
 const angle0=-PI*.55+2*PI*rank/slots+lane*.21;
 const spins=[1.12,-.98,1.06], angle=angle0+2*PI*spins[lane]*smooth(t);
 const mobile=w<600;
 const rx=Math.min(w*(mobile?.31:.31),mobile?155:345)*[1,.77,.55][lane];
 const ry=Math.min(h*.31,mobile?112:185)*[1,.80,.62][lane];
 const depth=[110,-80,-240][lane];
 return {
  x:Math.cos(angle)*rx,
  y:Math.sin(angle)*ry-10,
  z:depth+Math.sin(angle)*12,
  rot:Math.sin(angle)*11,
  ry:Math.cos(angle)*16,
  rx:Math.sin(angle)*7,
  scale:mobile?.53:.57
 };
}
function landingPose(i,count,t,w,h,size){
 const endOrbit=orbitPose(i,count,1,w,h,size);
 const begin=.68+i*.0085;
 const end=Math.min(.996,begin+.125);
 if(t<=begin)return endOrbit;
 const u=smooth((t-begin)/(end-begin));
 const target=stackPose(i,count);
 const p=mix(endOrbit,target,u);
 // Approach the pile from the viewer's side, instead of slicing through it.
 p.z+=Math.sin(PI*u)*Math.min(170,size*.95);
 return p;
}
export async function shuffleMotion(els,stage,phase=()=>{}){
 const count=els.length;
 if(!count)return true;
 const w=stage.clientWidth,h=stage.clientHeight,size=stageSize('shuffle',w);
 stage.classList.add('glow-shuffle-lite');
 phase('charge');
 try {
  const launched=await Promise.all(els.map((el,i)=>{
   el.style.zIndex=String(100+i);
   return play(el,[
    {transform:el.style.transform||transform(stackPose(i,count))},
    {transform:transform(orbitPose(i,count,0,w,h,size))}
   ],C.shuffle.separate,'cubic-bezier(.2,.62,.22,1)');
  }));
  if(!launched.every(Boolean))return false;
  phase('vortex');
  const steps=42; // 43 compositor keyframes per card rather than 101.
  const result=await Promise.all(els.map((el,i)=>{
   const frames=[];
   for(let k=0;k<=steps;k++){
    const t=k/steps;
    const p=t<=.68?orbitPose(i,count,t/.68,w,h,size):landingPose(i,count,t,w,h,size);
    frames.push({offset:t,transform:transform(p)});
   }
   return play(el,frames,C.shuffle.duration,'linear');
  }));
  return result.every(Boolean);
 } finally {stage.classList.remove('glow-shuffle-lite');}
}
export async function fanMotion(els,stage,onStart=()=>{}){
 const fromSize=stageSize('shuffle',stage.clientWidth),toSize=stageSize('selection',stage.clientWidth);
 cardSize(stage,'selection');
 const start=stage.ownerDocument.timeline.currentTime;let leader,done=false;
 const clock={duration:FINALE_DURATION,width:stage.clientWidth,count:els.length,progress:()=>done?1:(leader?.effect.getComputedTiming().progress??0)};
 const result=await Promise.all(els.map((el,i)=>{
  const off=i-(els.length-1)/2,from=stackPose(i,els.length),to=slotPose(off,stage.clientWidth),frames=[];
  const initial={...from,scale:fromSize/toSize};
  el.style.width=toSize+'px';el.style.height=toSize*C.aspect+'px';
  el.style.transform=transform(initial);
  el.style.zIndex=String(100-Math.round(Math.abs(off)*20));
  el.style.opacity='1';
  for(let n=0;n<=60;n++){const t=n/60,q=pressureProgress(t);frames.push({offset:t,transform:transform(mix(initial,to,q))});}
  return play(el,frames,FINALE_DURATION,'linear',start,i===0?a=>{leader=a;onStart(clock)}:null);
 }));done=true;return result.every(Boolean);
}
