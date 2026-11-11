import {CONFIG as C,stageSize,isCompactTouchLandscape} from '../../settings/config/config.js';
import {travelPose,slotPose,stackPose,mix,smooth} from '../core/cinema-core.js';
import {FINALE_DURATION} from './finale-motion.js';
import {startMagicOrbitVFX} from '../../effects/magic-orbit-vfx.js';
const running=new WeakMap();
export const pose=(x,y,z,rot=0,ry=0,scale=1,rx=0)=>`translate(-50%,-50%) translate3d(${x}px,${y}px,${z}px) rotateZ(${rot}deg) rotateY(${ry}deg) rotateX(${rx}deg) scale(${scale})`;
export const transform=p=>pose(p.x,p.y,p.z,p.rot,p.ry,p.scale,p.rx);
const readPose=s=>{const v=[...s.matchAll(/(?:translate3d|rotateZ|rotateY|rotateX|scale)\(([^)]+)\)/g)].map(m=>m[1].split(',').map(parseFloat));return v.length===5?{x:v[0][0],y:v[0][1],z:v[0][2],rot:v[1][0],ry:v[2][0],rx:v[3][0],scale:v[4][0]}:stackPose(0,1)};
export function sampleCard(el){return readPose(el.style.transform);}
export function cardSize(stage,phase='shuffle'){const width=stageSize(phase,stage.clientWidth);stage.style.setProperty('--card-w',width+'px');stage.style.setProperty('--card-h',width*C.aspect+'px');return width;}
export async function play(el,frames,duration,easing='cubic-bezier(.2,.7,.2,1)',startTime=null,observe=null){
 running.get(el)?.cancel();const a=el.animate(frames,{duration,easing,fill:'both'});if(startTime!==null)a.startTime=startTime;
 running.set(el,a);observe?.(a);
 try{await a.finished;}catch{return false;}
 if(running.get(el)!==a)return false;
 const last=frames.at(-1);for(const k of ['transform','width','height','borderRadius'])if(last[k]!==undefined)el.style[k]=last[k];
 running.delete(el);a.cancel();return true;
}
export const animateTo=(el,to,duration=600)=>play(el,[{transform:el.style.transform||pose(0,0,0)},{transform:typeof to==='string'?to:transform(to)}],duration);
export function cancelAll(els){for(const el of els){running.delete(el);el.getAnimations({subtree:true}).forEach(a=>a.cancel());}}
export function floatLayout(els,stage){cardSize(stage);els.forEach((el,i)=>{el.hidden=false;el.style.zIndex='auto';el.style.transform=pose((i-(els.length-1)/2)*2,-8,-70-i*3,(i-(els.length-1)/2)*.7);});}
/** First screen only: preserve the thick right-hand deck edge while keeping
 * rear cards below the leading card's top edge. The next shuffle restores
 * the original floatLayout, so its choreography is unchanged. */
export function alignIdleDeck(els){
 const mid=(els.length-1)/2;
 els.forEach((el,i)=>{
  // The artwork card always paints in front of rear paper-edge layers.
  el.style.zIndex=String(els.length-i);
  const x=-mid*2+i*3.1;
  const y=-8+i*.85;
  const z=-70-i*3;
  const rotation=-mid*.7+i*.38;
  el.style.transform=pose(x,y,z,rotation);
 });
}

// Compact landscape uses the ORIGINAL PC/portrait shuffle pose and rotation.
// Only its translation/depth distances are scaled ONCE to fit the shorter
// viewport.  No packets, new choreography, discrete position clamps, or
// per-frame layout reads.  All non-compact profiles retain the old branch.
function compactShuffleRoom(stage,w,h){
 const cw=stageSize('shuffle',w);
 const halfCardX=cw*.86+8;               // rotated card and gold glow
 const halfCardY=cw*C.aspect*.58+8;
 const maxX=Math.max(12,w/2-halfCardX-12);
 const maxY=Math.max(12,h/2-halfCardY-12);
 const orbitX=w*C.shuffle.radiusX*.96;
 const orbitY=h*(C.shuffle.radiusY+.065);
 return {
  xScale:Math.min(1,maxX/Math.max(1,orbitX)),
  yScale:Math.min(1,maxY/Math.max(1,orbitY)),
  zScale:Math.max(.52,Math.min(.70,h/500))
 };
}
function originalShufflePose(i,t,w,h,count,compact,room){
 // This is exactly the existing PC/portrait authored orbit.  Its angular
 // path, per-card phase, 3D rotations and order are preserved.
 const p=travelPose(i,t,w,h,count,C,false);
 const lane=((i*7)%count-(count-1)/2)*7.5;
 const envelope=Math.sin(Math.PI*Math.max(0,Math.min(1,t)))**2;
 const z=p.z+lane*envelope;
 if(!compact)return {...p,z};
 return {...p,
  x:p.x*room.xScale,
  y:(p.y+12)*room.yScale-12,
  z:z*room.zScale
 };
}
// The original gathering path lands at the same left-side stack position.
function gatherPose(i,t,w,h,count,compact,portraitLift,room){
 const start=.78, finish=.985;
 const order=i;
 const begin=start+order*(compact?.0014:.004);
 const end=finish-(count-1-order)*.001;
 const origin=originalShufflePose(i,1,w,h,count,compact,room), target=stackPose(i,count);
 if(t<=begin)return origin;
 const u=smooth((t-begin)/(end-begin));
 const p=mix(origin,target,u);
 const lift=Math.sin(Math.PI*u)*(compact?Math.min(45,h*.12):portraitLift);
 return {...p,z:p.z+lift};
}
export async function shuffleMotion(els,stage,phase=()=>{}){
 stage.classList.add('glow-shuffle-lite');
 const w=stage.clientWidth,h=stage.clientHeight,count=els.length;
 const compact=isCompactTouchLandscape();
 const room=compact?compactShuffleRoom(stage,w,h):null;
 const portraitLift=compact?0:Math.max(125,stageSize('shuffle',w)*1.2);
 phase('charge');
 // First frame and orbit share the very same original pose family.
 if(!(await Promise.all(els.map((el,i)=>animateTo(el,originalShufflePose(i,0,w,h,count,compact,room),C.shuffle.separate)))).every(Boolean)){stage.classList.remove('glow-shuffle-lite');return false;}
 phase('vortex');
 const result=await Promise.all(els.map((el,i)=>{
  const frames=[];
  const steps=100; // restore original curve sampling on compact landscape
  for(let n=0;n<=steps;n++){
   const t=n/steps;
   const p=t<.78?originalShufflePose(i,smooth(t/.78),w,h,count,compact,room):gatherPose(i,t,w,h,count,compact,portraitLift,room);
   frames.push({offset:t,transform:transform(p)});
  }
  return play(el,frames,C.shuffle.duration,'linear');
 }));stage.classList.remove('glow-shuffle-lite');return result.every(Boolean);
}
/*
 * In-between Shift — spatial stair/orbit opening (v7).
 * Stage 1: the deck separates into a stepped 3D stack.
 * Stage 2: those same seven cards rise into a rotating elliptical orbit.
 * Stage 3: each card lands precisely on the existing slotPose target.
 * No replacement images, card effects, selection handlers or reading logic.
 */
const orbitClamp=t=>Math.max(0,Math.min(1,t));
const orbitEase=t=>{t=orbitClamp(t);return t*t*(3-2*t);};
function orbitStairPose(i,count,width,height,size,shortStage){
 const off=i-(count-1)/2, distance=Math.abs(off), side=Math.sign(off);
 const spread=Math.min(shortStage?22:37,width*.078), lift=Math.min(1,height/470);
 return {
  x:off*spread,y:(-26-(3-distance)*18)*lift*(shortStage?.57:1),
  z:(94-distance*49+i*.8)*(shortStage?.42:1),
  rot:off*4.4,ry:-side*(16+distance*3),rx:-9,
  scale:1
 };
}
function orbitRingPose(i,count,rotation,width,height,size,shortStage){
 const ang=-Math.PI*.5+i*Math.PI*2/count+rotation;
 // A tilted/foreshortened ring card needs space beyond its orbit center.
 // Respect the left stage bounds while keeping the existing rotation timing.
 const radiusX=shortStage
  ? Math.max(20,Math.min(250,width*.28,(width-size-22)/2,width/2-size*.86-12))
  : Math.min(250,width*.28,Math.max(64,(width-size-22)/2));
 const radiusY=Math.min(shortStage?26:84,height*(shortStage?.08:.15));
 const zDepth=Math.min(shortStage?52:156,width*.29+40);
 return {
  x:Math.cos(ang)*radiusX,
  y:Math.sin(ang)*radiusY-9,
  z:Math.sin(ang+.45)*zDepth,
  rot:Math.sin(ang)*11,
  ry:-Math.cos(ang)*29,
  rx:Math.sin(ang)*16,
  scale:1
 };
}
function orbitOpeningPose(i,count,t,from,to,width,height,size,compact){
 const off=i-(count-1)/2,side=Math.sign(off);
 const stair=orbitStairPose(i,count,width,height,size,compact);
 const orbitStart=orbitRingPose(i,count,0,width,height,size,compact);
 const orbitEnd=orbitRingPose(i,count,Math.PI*1.03,width,height,size,compact);
 // 0-0.29: a deliberately visible staircase rises out of the deck.
 if(t<.29)return mix(from,stair,orbitEase((t-.035)/.255));
 // 0.29-0.49: open the staircase into a genuine perspective ring.
 if(t<.49)return mix(stair,orbitStart,orbitEase((t-.29)/.20));
 // 0.49-0.71: the ring turns in 3D, with near and far cards at different depths.
 if(t<.71)return orbitRingPose(i,count,Math.PI*1.03*orbitEase((t-.49)/.22),width,height,size,compact);
 // 0.71-0.93: distinct cards land into the existing fan slots.
 const landStart=.71+Math.abs(off)*.014;
 const settleStart=.925+Math.abs(off)*.006;
 const hover={...to,x:to.x*1.055,y:to.y-4,z:to.z+15,rot:to.rot+side*1.3,ry:side*-3,rx:-2.5,scale:1.018};
 if(t<settleStart)return mix(orbitEnd,hover,orbitEase((t-landStart)/(settleStart-landStart)));
 // Last few frames: a tiny controlled settle, ending at exactly slotPose.
 return mix(hover,to,orbitEase((t-settleStart)/(1-settleStart)));
}
export async function fanMotion(els,stage,onStart=()=>{}){
 const width=stage.clientWidth,height=stage.clientHeight;
 const compact=isCompactTouchLandscape();
 const fromSize=stageSize('shuffle',width),toSize=stageSize('selection',width);
 cardSize(stage,'selection');
 // Explicitly use the same authored choreography for every OS motion setting.
 const duration=FINALE_DURATION;
 const start=stage.ownerDocument.timeline.currentTime;
 let leader,done=false,vfx=null;
 const clock={duration,width,count:els.length,progress:()=>done?1:(leader?.effect.getComputedTiming().progress??0)};
 stage.classList.add('orbit-opening');
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
   const frameSteps=compact?112:160;
   for(let n=0;n<=frameSteps;n++){
    const t=n/frameSteps;
    frames.push({offset:t,transform:transform(orbitOpeningPose(i,els.length,t,from,to,width,height,toSize,compact))});
   }
   return play(el,frames,duration,'linear',start,i===0?a=>{leader=a;vfx=startMagicOrbitVFX(stage,clock);onStart(clock)}:null);
  }));
  done=true;
  return result.every(Boolean);
 }finally{vfx?.stop();stage.classList.remove('orbit-opening');}
}
