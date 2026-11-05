import {CONFIG as C, stageSize} from '../../settings/config/config.js';
import {slotPose, stackPose, mix, smooth} from '../core/cinema-core.js';
import {FINALE_DURATION, pressureProgress} from './finale-motion.js';

// Kept compatible with the existing In-between Shift app: carousel, reveal,
// cancellation, fan, card sizing and chosen-card transition use these exports.
const running = new WeakMap(), samples = new WeakMap();
export const pose = (x,y,z,rot=0,ry=0,scale=1,rx=0) =>
  `translate(-50%,-50%) translate3d(${x}px,${y}px,${z}px) rotateZ(${rot}deg) rotateY(${ry}deg) rotateX(${rx}deg) scale(${scale})`;
export const transform = p => pose(p.x,p.y,p.z,p.rot,p.ry,p.scale,p.rx);
const readPose = s => {
  const v = [...s.matchAll(/(?:translate3d|rotateZ|rotateY|rotateX|scale)\(([^)]+)\)/g)]
    .map(m => m[1].split(',').map(parseFloat));
  return v.length === 5
    ? {x:v[0][0],y:v[0][1],z:v[0][2],rot:v[1][0],ry:v[2][0],rx:v[3][0],scale:v[4][0]}
    : stackPose(0,1);
};
export function sampleCard(el) {
  const tr=samples.get(el);
  if (!tr) return readPose(el.style.transform);
  const n=Math.max(0,Math.min(1,tr.animation.effect.getComputedTiming().progress ?? 0))*(tr.poses.length-1);
  const i=Math.min(tr.poses.length-2,Math.floor(n));
  return mix(tr.poses[i],tr.poses[i+1],n-i);
}
export function cardSize(stage,phase='shuffle') {
  const width=stageSize(phase,stage.clientWidth);
  stage.style.setProperty('--card-w',width+'px');
  stage.style.setProperty('--card-h',width*C.aspect+'px');
  return width;
}
export async function play(el,frames,duration,easing='cubic-bezier(.2,.7,.2,1)',startTime=null,observe=null) {
  running.get(el)?.cancel();
  const a=el.animate(frames,{duration,easing,fill:'both'});
  if(startTime!==null)a.startTime=startTime;
  running.set(el,a);
  if(frames.every(f=>f.transform))samples.set(el,{animation:a,poses:frames.map(f=>readPose(f.transform))});
  observe?.(a);
  try {await a.finished;}catch{return false;}
  if(running.get(el)!==a)return false;
  const last=frames.at(-1);
  for(const k of ['transform','width','height','borderRadius'])if(last[k]!==undefined)el.style[k]=last[k];
  running.delete(el);samples.delete(el);a.cancel();
  return true;
}
export const animateTo=(el,to,duration=600)=>play(el,[
  {transform:el.style.transform||pose(0,0,0)},
  {transform:typeof to==='string'?to:transform(to)}
],duration);
export function cancelAll(els) {
  for(const el of els){running.delete(el);samples.delete(el);el.getAnimations({subtree:true}).forEach(a=>a.cancel());}
}
export function floatLayout(els,stage) {
  cardSize(stage);
  els.forEach((el,i)=>{
    el.hidden=false;el.style.zIndex='auto';
    el.style.transform=pose((i-(els.length-1)/2)*2,-8,-70-i*3,(i-(els.length-1)/2)*.7);
  });
}

/* CINEMA 01 — Floating choreography / v6
   The 22 DOM cards remain in the deck. Five (desktop) or three (mobile)
   cards take the foreground; other cards form two intentionally layered,
   subdued packets behind them. No shrinking of hero cards to ~0.57 scale.
   Adjacent heroes exchange positions using separate vertical and depth
   passes, rather than running around a common circular track.
   This is a staged piece of choreography, NOT continuous rigid-body physics.
*/
const PI=Math.PI;
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const smoothSegment=(t,a,b)=>smooth(clamp((t-a)/(b-a),0,1));
function layoutFor(count,stage,size){
  const w=stage.clientWidth,h=stage.clientHeight;
  const mobile=w<600;
  const heroes=Math.min(count,mobile?3:5);
  const indices=Array.from({length:heroes},(_,j)=>
    Math.min(count-1,Math.floor((j+.5)*count/heroes)));
  const heroMap=new Map(indices.map((id,k)=>[id,k]));
  // Keep foreground cards large; fit their slots into the available width.
  const gap=Math.min(size*(mobile?1.14:1.03),(w-24)/heroes);
  return {w,h,size,count,mobile,heroes,indices,heroMap,gap};
}
function heroAt(j,geo){
  const center=j-(geo.heroes-1)/2;
  // This is a suspended spatial composition, not a row of cards or a fan.
  const heights=geo.mobile?[-43,-79,25]:[-38,34,-60,25,-48];
  const depths=geo.mobile?[102,132,96]:[87,120,126,112,83];
  const zrot=geo.mobile?[-11,-1,10]:[-13,8,-3,-7,12];
  return {x:center*geo.gap,
    y:heights[j]??0,z:depths[j]??100,
    rot:zrot[j]??0,ry:-center*5,rx:3.5,scale:1};
}
function packetAt(i,geo){
  const left=i%2===0;
  const depthRank=Math.floor(i/2);
  const side=left?-1:1;
  return {x:side*geo.size*.79+side*(depthRank%3)*1.15,
    y:geo.size*.64+(depthRank%4)*.7,
    z:-222-depthRank*3.1,
    rot:side*4.3,ry:side*4,rx:0,scale:1};
}
function pairMate(j,n){
  // Desktop: 0<->1 and 3<->4; center card remains a visual anchor.
  // Mobile: side cards 0<->2 pass on DIFFERENT depth / height lanes.
  if(n===3) return j===0?2:j===2?0:-1;
  if(n===5) return j===0?1:j===1?0:j===3?4:j===4?3:-1;
  return j%2===0?j+1<n?j+1:-1:j-1;
}
function heroFlight(j,t,geo){
  const home=heroAt(j,geo),mate=pairMate(j,geo.heroes);
  const delay=geo.heroes===5?([.045,.045,.10,.16,.16][j]??.05):.055;
  const u=smoothSegment(t,delay,delay+(geo.heroes===5?.50:.59));
  const center=j-(geo.heroes-1)/2;
  if(mate<0){ // Featured center stays still enough to anchor the viewer's eye.
    const lift=Math.sin(PI*u);
    return {...home,x:home.x+Math.sin(u*PI*2)*geo.size*.075,
      y:home.y-lift*geo.size*.18,
      z:home.z+lift*21,
      ry:Math.sin(2*PI*u)*7,rot:home.rot+Math.sin(PI*u)*3};
  }
  const end=heroAt(mate,geo);
  const passing= Math.sin(PI*u);
  const forward=j<mate; // Distinct corridors at the crossover.
  const clearance=geo.mobile?170:130;
  return {
    x:home.x+(end.x-home.x)*u,
    y:home.y+(end.y-home.y)*u+passing*(forward?-geo.size*.43:geo.size*.32),
    z:home.z+passing*(forward?clearance:-clearance),
    rot:home.rot+(end.rot-home.rot)*u+passing*(forward?-11:9),
    ry:home.ry+(end.ry-home.ry)*u+passing*(forward?13:-12),
    rx:3.5+passing*(forward?-0.5:6),
    scale:1
  };
}
function heroMotion(j,i,t,geo){
  const flight=heroFlight(j,Math.min(t,.68),geo);
  const begin=.69+(j%3)*.025,end=.96;
  const u=smoothSegment(t,begin,end);
  if(t<=begin)return flight;
  const target=stackPose(i,geo.count);
  const blended=mix(flight,target,u);
  // Card approaches the deck from above, with a small consistent height arc.
  blended.y-=Math.sin(PI*u)*geo.size*.14;
  blended.z+=Math.sin(PI*u)*geo.size*.26;
  return blended;
}
function packetMotion(i,t,geo){
  const home=packetAt(i,geo);
  const s=smoothSegment(t,.12,.62),q=Math.sin(PI*s);
  const side=i%2===0?-1:1;
  const mid={...home,x:home.x+side*geo.size*.12*q,
    y:home.y-q*geo.size*.08,z:home.z+q*14,
    rot:home.rot+side*q*2};
  const begin=.70+(i%5)*.014,end=.975;
  if(t<=begin)return mid;
  const u=smoothSegment(t,begin,end);
  return mix(mid,stackPose(i,geo.count),u);
}

export async function shuffleMotion(els,stage,phase=()=>{}){
  if(!els.length)return true;
  const geo=layoutFor(els.length,stage,stageSize('shuffle',stage.clientWidth));
  const oldClass='cinematic-shuffle';
  stage.classList.add(oldClass,'glow-shuffle-lite');
  phase('charge');
  try{
    const launched=await Promise.all(els.map((el,i)=>{
      const j=geo.heroMap.get(i),isHero=j!==undefined;
      el.classList.toggle('cinema-shuffle__hero',isHero);
      el.classList.toggle('cinema-shuffle__packet',!isHero);
      el.style.zIndex=isHero?String(300+j):String(30+i);
      const target=isHero?heroAt(j,geo):packetAt(i,geo);
      return play(el,[
        {transform:el.style.transform||transform(stackPose(i,geo.count))},
        {transform:transform(target)}
      ],Math.max(840,C.shuffle.separate),'cubic-bezier(.2,.74,.22,1)');
    }));
    if(!launched.every(Boolean))return false;
    phase('vortex');
    const startTime=stage.ownerDocument.timeline.currentTime;
    const outcomes=await Promise.all(els.map((el,i)=>{
      const j=geo.heroMap.get(i),isHero=j!==undefined;
      const frames=[];
      const steps=isHero?48:16;
      for(let k=0;k<=steps;k++){
        const t=k/steps;
        const p=isHero?heroMotion(j,i,t,geo):packetMotion(i,t,geo);
        frames.push({offset:t,transform:transform(p)});
      }
      return play(el,frames,C.shuffle.duration,'linear',startTime);
    }));
    if(!outcomes.every(Boolean))return false;
    // Hold the finished physical deck briefly before the existing fan opening.
    await new Promise(resolve=>setTimeout(resolve,270));
    return true;
  }finally{
    stage.classList.remove(oldClass,'glow-shuffle-lite');
    for(const el of els){el.classList.remove('cinema-shuffle__hero','cinema-shuffle__packet');}
  }
}

// The existing fan animation is left untouched to retain carousel/reveal flow.
export async function fanMotion(els,stage,onStart=()=>{}){
  const fromSize=stageSize('shuffle',stage.clientWidth),toSize=stageSize('selection',stage.clientWidth);
  cardSize(stage,'selection');
  const start=stage.ownerDocument.timeline.currentTime;
  let leader,done=false;
  const clock={duration:FINALE_DURATION,width:stage.clientWidth,count:els.length,
    progress:()=>done?1:(leader?.effect.getComputedTiming().progress??0)};
  const result=await Promise.all(els.map((el,i)=>{
    const off=i-(els.length-1)/2,from=stackPose(i,els.length),to=slotPose(off,stage.clientWidth),frames=[];
    const initial={...from,scale:fromSize/toSize};
    el.style.width=toSize+'px';el.style.height=toSize*C.aspect+'px';
    el.style.transform=transform(initial);
    el.style.zIndex=String(100-Math.round(Math.abs(off)*20));
    el.style.opacity='1';
    for(let n=0;n<=60;n++){
      const t=n/60,q=pressureProgress(t);
      frames.push({offset:t,transform:transform(mix(initial,to,q))});
    }
    return play(el,frames,FINALE_DURATION,'linear',start,i===0?a=>{leader=a;onStart(clock)}:null);
  }));
  done=true;
  return result.every(Boolean);
}
