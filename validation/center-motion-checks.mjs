import assert from 'node:assert/strict';
import {travelFrames,moveToCenter} from '../js/motion/reveal/center-motion.js';
import {CONFIG as C} from '../js/settings/config/config.js';
for(const width of [146,210])for(const angle of [-25,-18,0,18,25]){
 const r={left:50,top:120,width:width*1.4,height:width*1.9};
 const frames=travelFrames(r,{left:300,top:200,width,height:width*C.aspect},angle);
 assert.ok(frames.every(f=>!f.transform.includes('scale')));
 assert.ok(frames.every(f=>f.transform.endsWith(`rotateZ(${angle}deg)`)));
 const recordings=[];const card={style:{},dataset:{},getBoundingClientRect:()=>({left:300,top:200,width,height:width*C.aspect}),animate:(keyframes,options)=>{recordings.push({keyframes,options,w:card.style.width});return{finished:Promise.resolve(),cancel(){}}}};
 const host={style:{}};let gathered;
 await moveToCenter(card,host,r,width,angle,width===146?190:260,async(c,d)=>{gathered=d;assert.equal(c.dataset.revealPhase,'travel');});
 assert.equal(recordings[0].w,width+'px');assert.equal(recordings[0].options.duration,C.reveal.travel);assert.equal(gathered,C.reveal.travel);
 assert.ok(!recordings[0].keyframes[0].transform.includes('scale'));
 assert.ok(/^rotateZ\(.+\) scale\([\d.]+\)$/.test(recordings[1].keyframes[0].transform));
 assert.equal(recordings[1].options.duration,C.reveal.arrival);assert.equal(card.dataset.revealPhase,'centered');
}
console.log('PASS 10 desktop/mobile × center/edge cases: translation-only travel, fixed rotation, uniform growth after arrival, gather synchronized.');
