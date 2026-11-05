import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
const root=path.resolve(process.argv[2]||'tarot-3d-trial');
let checks=0;const pass=name=>{checks++;console.log('PASS '+name)};
const ctx=vm.createContext({console,URL});const cache=new Map();
async function load(name){if(cache.has(name))return cache.get(name);const m=new vm.SourceTextModule(fs.readFileSync(path.join(root,'js',name),'utf8'),{context:ctx});cache.set(name,m);await m.link(s=>load(path.basename(s)));return m;}
const motion=await load('card-animation.js');await motion.evaluate();const a=motion.namespace;const g=cache.get('shuffle-paths.js').namespace;
assert.equal(g.SELECTION_COUNT,9);pass('Selection count is 9');
for(const [w,h]of [[290,340],[330,340],[360,480],[738,520],[1040,610]]){
 const m=g.metrics(w,h);let minZ=Infinity,maxZ=-Infinity;
 for(let i=0;i<22;i++)for(let n=0;n<=100;n++){
  const p=g.orbitPose(i,n/100,m);assert.ok(Object.values(p).every(Number.isFinite));minZ=Math.min(minZ,p.z);maxZ=Math.max(maxZ,p.z);
 }
 assert.ok(minZ<-100&&maxZ>100);
 const stack=Array.from({length:9},(_,i)=>g.stackPose(i));const fan=Array.from({length:9},(_,i)=>g.fanPose(i,9,w));
 assert.equal(stack.indexOf(stack.reduce((a,b)=>a.z>b.z?a:b)),4);assert.equal(fan.indexOf(fan.reduce((a,b)=>a.z>b.z?a:b)),4);
 assert.ok(fan[4].y<fan[0].y&&fan[4].y<fan[8].y);
 // Project the four card corners with the same scale/rotation/perspective.
 const cardW=Math.max(65,Math.min(112,w*.18)),cardH=cardW*1.58;
 for(const p of fan)for(const sx of [-1,1])for(const sy of [-1,1]){
  const rad=p.rot*Math.PI/180;const x=sx*cardW/2*p.scale,y=sy*cardH/2*p.scale;
  const px=(p.x+x*Math.cos(rad)-y*Math.sin(rad))*1100/(1100-p.z);
  const py=(p.y+x*Math.sin(rad)+y*Math.cos(rad))*1100/(1100-p.z);
  assert.ok(Math.abs(px)<=w/2,`fan clips horizontally ${w}`);assert.ok(Math.abs(py)<=h/2,`fan clips vertically ${w}`);
 }
}
pass('5 stage sizes: finite paths, near/far depth, fan bounds and arch orientation');
for(const [w,h] of [[290,340],[330,340],[360,480],[738,520],[1040,610]]){
 const cw=Math.max(65,Math.min(112,w*.18));
 for(let i=0;i<22;i++)for(let n=0;n<=100;n++){
  const p=g.orbitPose(i,n/100,g.metrics(w,h));
  for(const sx of [-1,1])for(const sy of [-1,1]){
   let x=sx*cw/2*p.scale,y=sy*cw*1.58/2*p.scale,z=0;
   const rx=p.rx*Math.PI/180,ry=p.ry*Math.PI/180,rz=p.rot*Math.PI/180;
   [y,z]=[y*Math.cos(rx),y*Math.sin(rx)];
   [x,z]=[x*Math.cos(ry)+z*Math.sin(ry),-x*Math.sin(ry)+z*Math.cos(ry)];
   [x,y]=[x*Math.cos(rz)-y*Math.sin(rz),x*Math.sin(rz)+y*Math.cos(rz)];
   const f=1100/(1100-z-p.z);
   assert.ok(Math.abs((x+p.x)*f)<=w/2,'orbit horizontal bounds');
   assert.ok(Math.abs((y+p.y)*f)<=h/2,'orbit vertical bounds');
  }
 }
}
pass('Projected orbit corners stay within 5 PC/mobile stage sizes');

for(let i=0;i<22;i++){
 const m=g.metrics(330,340);const lift=g.liftPose(i,m),orbitStart=g.orbitPose(i,0,m),orbitEnd=g.orbitPose(i,1,m),stack=g.stackPose(i);
 assert.deepEqual({...g.mixPose(lift,orbitStart,0)},{...lift});
 for(const [p,q]of [[g.mixPose(lift,orbitStart,1),orbitStart],[g.mixPose(orbitEnd,stack,1),stack]])for(const k of Object.keys(q))assert.ok(Math.abs(p[k]-q[k])<1e-9);
}
pass('Lift/orbit/stack mathematical endpoints join without position reset');
let calls=[];class Card{
 constructor(){this.style={};this.hidden=false;this.animations=[];this.inner=new CardInner();}
 animate(frames,options){const an={playState:'finished',finished:Promise.resolve(),cancel(){this.playState='idle'}};this.animations.push(an);calls.push({card:this,frames,options});return an;}
 getAnimations(){return this.animations}querySelector(){return this.inner}
}
class CardInner{constructor(){this.style={}}animate(){return{finished:Promise.resolve(),cancel(){}}}}
const stage={clientWidth:330,clientHeight:340,style:{setProperty(){}}};const cards=Array.from({length:22},()=>new Card());
a.floatLayout(cards,stage);assert.ok(await a.shuffleMotion(cards,stage));assert.equal(calls.length,44);assert.equal(new Set(calls.map(c=>c.card)).size,22);pass('All 22 cards participate in lift and curved shuffle');
const t=p=>a.pose(p.x,p.y,p.z,p.rot,p.ry,p.scale,p.rx);
cards.forEach((card,i)=>assert.equal(card.style.transform,t(g.stackPose(i))));pass('WAAPI end keyframes committed exactly to stack inline transforms');
const nine=cards.slice(0,9);const before=nine.map(c=>c.style.transform);calls=[];assert.ok(await a.fanMotion(nine,stage));assert.equal(calls.length,9);calls.forEach((c,i)=>assert.equal(c.frames[0].transform,before[i]));pass('9 fan animations start exactly at previous stack poses');
const final=nine.map(c=>c.style.transform);a.fanLayout(nine,stage);assert.deepEqual(nine.map(c=>c.style.transform),final);pass('Fan completion relayout is identical at unchanged viewport');
assert.ok(await a.revealMotion(nine,nine[4],stage));assert.equal(nine[4].inner.style.transform,'rotateY(180deg)');pass('Reveal reaches 180 degrees without changing faces');
let reject;const cancelled=new Card();cancelled.style.transform='original';cancelled.animate=function(){const an={finished:new Promise((_,r)=>{reject=r}),cancel(){reject(new Error('cancel'))}};this.animations.push(an);return an};const pending=a.animateTo(cancelled,'target');a.cancelAll([cancelled]);assert.equal(await pending,false);assert.equal(cancelled.style.transform,'original');pass('Cancelled WAAPI cannot commit a stale target');
const data=await load('card-data.js');await data.evaluate();let sets=new Set();for(let n=0;n<50;n++){const d=data.namespace.shuffledDeck();assert.equal(d.length,22);assert.equal(new Set(d.map(c=>c[0])).size,22);sets.add(d.slice(0,9).map(c=>c[0]).join('|'));}assert.ok(sets.size>1);pass('22 unique majors retained; fresh random 9-card subsets');
let resolveSync;
const syncCard={style:{transform:a.pose(0,0,0)},animate(){return {effect:{getComputedTiming:()=>({progress:.25})},finished:new Promise(r=>resolveSync=r),cancel(){}}}};
const syncTask=a.animateTo(syncCard,a.pose(100,40,80));
assert.equal(a.sampleCard(syncCard).x,25);assert.equal(a.sampleCard(syncCard).z,20);
resolveSync();await syncTask;assert.equal(a.sampleCard(syncCard).x,100);
pass('VFX samples WAAPI progress and final committed pose without layout reads');
// Controller state test: animation module mocked, real updated main.js evaluated.
const el={};for(const id of ['stage','cards','status','backName','instruction','shuffleBtn','resetBtn'])el[id]={textContent:'',hidden:false,disabled:false,addEventListener(n,fn){this[n]=fn}};
let visible=[],rendered=[],pendingBack=[],shuffleCount=0,fanCount=0,chosenCount=0,resize;
const mocks={
 './magic-vfx.js':{MagicVFX:class {start(){} stop(){} phase(){} finish(){}}},
 './shuffle-paths.js':{SELECTION_COUNT:9},'./back-loader.js':{prepareBack:()=>new Promise((resolve,reject)=>pendingBack.push({resolve,reject}))},
 './back-config.js':{randomBack:()=>({id:'back',name:'back',url:'back.png'})},'./card-data.js':{shuffledDeck:()=>Array.from({length:22},(_,i)=>['card'+i,'*'])},
 './card-view.js':{renderCards:()=>{rendered=Array.from({length:22},()=>({hidden:false,disabled:false,style:{},classList:{toggle(){}},addEventListener(n,f){this[n]=f}}));return rendered}},
 './card-animation.js':{cardSize(){},floatLayout(){},cancelAll(){},shuffleMotion:async cards=>{shuffleCount=cards.length;return true},fanMotion:async cards=>{visible=cards;fanCount=cards.length;return true},fanLayout(){},revealMotion:async cards=>{chosenCount=cards.length;return true}}
};
const context=vm.createContext({document:{querySelector:s=>el[s.slice(1)]},window:{addEventListener(n,f){if(n==='resize')resize=f}}});const main=new vm.SourceTextModule(fs.readFileSync(path.join(root,'js/main.js'),'utf8'),{context});await main.link(s=>new vm.SyntheticModule(Object.keys(mocks[s]),function(){for(const[k,v]of Object.entries(mocks[s]))this.setExport(k,v)},{context}));await main.evaluate();
const tick=async()=>{for(let i=0;i<12;i++)await Promise.resolve()};pendingBack.shift().resolve();await tick();const old=rendered;const sh=el.shuffleBtn.click();await tick();assert.equal(rendered,old);assert.equal(el.shuffleBtn.disabled,true);pendingBack.shift().resolve();await sh;assert.equal(shuffleCount,22);assert.equal(fanCount,9);assert.equal(rendered.filter(c=>!c.hidden).length,9);assert.equal(rendered.filter(c=>!c.disabled).length,9);pass('Controller keeps deck during load, shuffles 22, enables only 9 visible cards');
await rendered[12].click();assert.equal(chosenCount,0);await visible[4].click();assert.equal(chosenCount,9);assert.equal(el.resetBtn.hidden,false);pass('Hidden cards cannot select; visible choice reveals and enables reset');
let sh2=el.shuffleBtn.click();await tick();pendingBack.shift().reject(new Error('load'));await sh2;assert.equal(el.resetBtn.hidden,false);assert.equal(el.shuffleBtn.disabled,false);pass('Loading failure restores revealed state and controls');
console.log(`${checks} checks passed; numeric and mocked-state tests only, not browser visual verification.`);
