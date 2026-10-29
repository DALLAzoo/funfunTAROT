import assert from 'node:assert/strict';
import fs from 'node:fs';import vm from 'node:vm';
import {pressureProgress,samplePressure,waveRadius,FINALE_DURATION} from '../js/finale-motion.js';
import {orbitPose,metrics} from '../js/shuffle-paths.js';
for(const width of [290,330,360,738,1040]){
 const m=metrics(width,480);
 for(let n=0;n<=120;n++){
  const poses=Array.from({length:22},(_,i)=>orbitPose(i,n/120,m));
  for(const axis of ['x','y','z']){
   const average=poses.reduce((sum,p)=>sum+p[axis],0)/22;
   assert.ok(Math.abs(average-(axis==='y'?-18:0))<1e-10);
  }
  assert.equal(new Set(poses.map(p=>[p.x,p.y,p.z].join(','))).size,22);
 }
}
console.log('PASS 22 separate trajectories; stable world-space deck centroid at 5 widths × 121 times');
let previous=-1;
for(let n=0;n<=1000;n++){
 const q=samplePressure(n/1000);assert.ok(q>=previous&&q>=0&&q<=1);previous=q;
 const i=Math.min(79,Math.floor(n/1000*80)),f=n/1000*80-i;
 assert.equal(q,pressureProgress(i/80)+(pressureProgress((i+1)/80)-pressureProgress(i/80))*f);
 assert.ok(Number.isFinite(waveRadius(q,360)));
}
assert.equal(samplePressure(0),0);assert.equal(samplePressure(1),1);
assert.ok(pressureProgress(.0001)<1e-6);assert.ok(1-pressureProgress(.9999)<1e-6);
console.log('PASS wave pressure matches exact WAAPI interpolation; monotonic expansion and resting endpoints');
// Actual motion module, with a controlled WAAPI clock.
const context=vm.createContext({});const cache=new Map();
async function load(name){if(cache.has(name))return cache.get(name);const mod=new vm.SourceTextModule(fs.readFileSync(new URL('../js/'+name,import.meta.url),'utf8'),{context});cache.set(name,mod);await mod.link(s=>load(s.slice(2)));return mod;}
const motion=await load('card-animation.js');await motion.evaluate();const a=motion.namespace;
const cards=Array.from({length:9},(_,i)=>({style:{transform:a.pose(0,-8,-Math.abs(i-4)*2)},animate(frames,options){
 this.frames=frames;this.options=options;this.animation={effect:{getComputedTiming:()=>({progress:.35})},finished:Promise.resolve(),cancel(){}};return this.animation;
}}));
let clock;
const task=a.fanMotion(cards,{clientWidth:360,ownerDocument:{timeline:{currentTime:12345}},style:{setProperty(){}}},c=>clock=c);
assert.equal(clock.progress(),.35);assert.equal(clock.duration,FINALE_DURATION);
for(const c of cards){assert.equal(c.animation.startTime,12345);assert.equal(c.options.delay,0);assert.equal(c.options.easing,'linear');assert.equal(c.options.duration,1040);}
await task;assert.equal(clock.progress(),1);
console.log('PASS nine card animations share startTime, duration, zero stagger and leader-clock progress');
