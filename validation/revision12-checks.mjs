import assert from 'node:assert/strict';
import {slotPose,visibleIndices} from '../js/cinema-core.js';
import {Carousel} from '../js/carousel.js';
const widths=[390,600,1040];
for(const width of widths){
 const poses=Array.from({length:7},(_,i)=>slotPose(i-3,width));
 assert.equal(new Set(poses.map(p=>p.scale)).size,1);
 assert.equal(new Set(poses.map(p=>p.z)).size,1);
 assert.ok(poses[0].x<poses[1].x&&poses[1].x<poses[2].x&&poses[2].x<0&&poses[4].x>0);
 assert.equal(poses[3].x,0);
}
assert.deepEqual(visibleIndices(0,20,7),[17,18,19,0,1,2,3]);
const classes=()=>({values:new Set(),toggle(k,v){v?this.values.add(k):this.values.delete(k)},add(k){this.values.add(k)},remove(k){this.values.delete(k)}});
globalThis.window={addEventListener(){}};
globalThis.document={createElement:()=>({setAttribute(){},remove(){}})};
globalThis.requestAnimationFrame=f=>setTimeout(()=>f(performance.now()),0);
globalThis.cancelAnimationFrame=clearTimeout;
const stage={clientWidth:390,style:{setProperty(){}},classList:classes(),addEventListener(){},prepend(){}};
const cards=Array.from({length:20},()=>({hidden:true,disabled:true,style:{},classList:classes(),addEventListener(){}}));
let picked=null;const carousel=new Carousel(cards,stage,()=>{},c=>picked=c);
carousel.layout();assert.equal(cards.filter(c=>!c.hidden).length,7);
assert.equal(carousel.visible.length,7);
assert.equal(cards.filter(c=>c.classList.values.has('selectable')).length,7);
for(let i=0;i<20;i++){
 await carousel.step(1);
 assert.equal(cards.filter(c=>!c.hidden).length,7);
 assert.equal(cards.filter(c=>c.classList.values.has('selectable')).length,7);
}
assert.equal(carousel.index,0);
carousel.destroy();
console.log('PASS: 7-card geometry across 390/600/1040, consistent scale/depth, opening index, 20-card navigation and touch eligibility');
