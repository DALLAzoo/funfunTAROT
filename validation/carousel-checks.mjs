import assert from 'node:assert/strict';import fs from 'node:fs';import vm from 'node:vm';
let now=1000,choice=null;const context=vm.createContext({AbortController,performance:{now:()=>now},getComputedStyle:()=>({width:'210px'})});const cache=new Map();
async function load(name){if(cache.has(name))return cache.get(name);const m=new vm.SourceTextModule(fs.readFileSync(new URL('../js/'+name,import.meta.url),'utf8'),{context});cache.set(name,m);await m.link(s=>load(s.slice(2)));return m;}
const mod=await load('carousel.js');await mod.evaluate();const {Carousel}=mod.namespace;
const classes=()=>({values:new Set(),toggle(k,v){v?this.values.add(k):this.values.delete(k)},add(k){this.values.add(k)},remove(k){this.values.delete(k)}});
const stage={clientWidth:1040,style:{setProperty(){}},classList:classes(),events:{},addEventListener(n,f){this.events[n]=f},setPointerCapture(){}};
const cards=Array.from({length:20},(_,i)=>({id:'card'+i,hidden:true,disabled:true,style:{},classList:classes(),events:{},addEventListener(n,f){this.events[n]=f},setAttribute(){},animate(frames){
 assert.ok(cards.filter(c=>!c.hidden).length<=3);return{finished:Promise.resolve(),effect:{getComputedTiming:()=>({progress:1})},cancel(){}};
}}));
const carousel=new Carousel(cards,stage,()=>{},c=>choice=c.id);carousel.layout();assert.equal(cards.filter(c=>!c.hidden).length,3);
for(let i=0;i<20;i++){assert.equal(carousel.index,i);await carousel.step(1);assert.equal(cards.filter(c=>!c.hidden).length,3);}
assert.equal(carousel.index,0);await carousel.step(-1);assert.equal(carousel.index,19);await carousel.step(1);assert.equal(carousel.index,0);
console.log('PASS actual carousel implementation: full 20-card round-trip, both wrap boundaries, at most 3 shown');
carousel.down({target:{closest:()=>cards[0]},button:0,pointerId:1,clientX:500,clientY:300});carousel.move({pointerId:1,clientX:400,clientY:302});carousel.up({pointerId:1,clientX:400,preventDefault(){}});await new Promise(setImmediate);
cards[carousel.index].events.click();assert.equal(choice,null);now+=500;cards[carousel.index].events.click();assert.equal(choice,cards[carousel.index].id);
console.log('PASS drag commits navigation; synthesized click suppressed; deliberate later click keeps data ID');
const pending=carousel.step(1);carousel.destroy();await pending;assert.ok(carousel.destroyed);console.log('PASS destroyed carousel cannot finish a stale layout after a new shuffle');
