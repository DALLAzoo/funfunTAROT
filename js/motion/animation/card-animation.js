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

/* Two-packet, ordered riffle choreography.
   - The deck splits into two cohesive stacks rather than 22 crossing orbits.
   - Just ONE card moves at a time during the interleave, avoiding midair
     card-to-card flight intersections and reducing simultaneous GPU animations.
   - Existing stackPose and fanMotion contracts remain unchanged.
   This is directed choreography, not a full physics/collision simulation. */
export async function shuffleMotion(els,stage,phase=()=>{}){
 const count=els.length;
 if(!count)return true;
 const w=stage.clientWidth, size=stageSize('shuffle',w);
 const splitX=Math.min(w*.31,size*1.30);
 const from=new Array(count);
 stage.classList.add('glow-shuffle-lite','cinematic-riffle');
 phase('charge');
 try{
  const split=await Promise.all(els.map((el,i)=>{
   const side=i%2===0?-1:1;
   const pileIndex=Math.floor(i/2);
   const at={x:side*splitX+(i%3-1)*1.1,y:-6+(pileIndex%3)*.75,
             z:-pileIndex*2.5,rot:side*5.5,ry:side*5,rx:0,scale:1};
   from[i]=at;
   el.style.zIndex=String(30+pileIndex);
   return animateTo(el,at,C.shuffle.separate);
  }));
  if(!split.every(Boolean))return false;
  phase('vortex');
  const left=[],right=[];
  for(let i=count-1;i>=0;i--)(i%2===0?left:right).push(i);
  const order=[];
  while(left.length||right.length){if(left.length)order.push(left.shift());if(right.length)order.push(right.shift());}
  const eachDuration=Math.max(90,C.shuffle.duration/count);
  for(let k=0;k<order.length;k++){
   const index=order[k], el=els[index], start=from[index], target=stackPose(index,count);
   const mid={...mix(start,target,.47),y:-44,z:Math.max(90,size*.55)+k*.10,
              rot:start.rot*.38,ry:start.ry*.35,rx:0,scale:1.03};
   el.style.zIndex=String(100+k);
   const ok=await play(el,[{offset:0,transform:transform(start)},
     {offset:.46,transform:transform(mid)},
     {offset:1,transform:transform(target)}],eachDuration,'cubic-bezier(.3,.1,.45,1)');
   if(!ok)return false;
  }
  return true;
 } finally {stage.classList.remove('glow-shuffle-lite','cinematic-riffle');}
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
