import assert from 'node:assert/strict';import fs from 'node:fs';import crypto from 'node:crypto';
import {CONFIG as C,stageSize} from '../js/config.js';
import {makeCatalog,validateConfig,selectionPool,visibleIndices,mod,slotPose,travelPose,coverScale} from '../js/cinema-core.js';
const catalog=makeCatalog();let checks=0;const pass=s=>{checks++;console.log('PASS '+s)};
assert.deepEqual(validateConfig(C,catalog),{records:22,registeredFrontImages:0});pass('22 records, no front-image assets, independent registry count');
const copy=()=>structuredClone(C);
for(const key of ['shuffle','selection']){const c=copy();c.counts[key]=23;assert.throws(()=>validateConfig(c,catalog));}
for(const [key,value] of [['visible',4],['result',2],['shuffle',0],['selection',NaN]]){const c=copy();c.counts[key]=value;assert.throws(()=>validateConfig(c,catalog));}
let c=copy();c.camera.perspective=100;assert.throws(()=>validateConfig(c,catalog));c=copy();c.catalog.requireActualFrontImages=true;assert.throws(()=>validateConfig(c,catalog));pass('Invalid counts, unsupported visible/result counts, camera and missing required fronts rejected');
let excluded=new Set();for(let i=0;i<150;i++){const pool=selectionPool(catalog);assert.equal(pool.length,20);assert.equal(new Set(pool.map(c=>c.id)).size,20);for(const item of catalog)if(!pool.includes(item))excluded.add(item.id);}assert.equal(excluded.size,22);pass('Trial pools have unique IDs and no fixed excluded pair');
c=copy();c.pool.mode='explicit-ids';c.pool.ids=catalog.slice(0,20).map(c=>c.id);assert.equal(selectionPool(catalog,c)[0].id,catalog[0].id);c.pool.ids[1]=c.pool.ids[0];assert.throws(()=>validateConfig(c,catalog));pass('Explicit-ID pool validation and exact data references');
for(const n of [20,22,78])for(const visible of [3,5])for(let i=-2*n;i<2*n;i++){const ids=visibleIndices(i,n,visible);assert.equal(new Set(ids).size,visible);assert.ok(ids.every(x=>x>=0&&x<n));assert.equal(ids[(visible-1)/2],mod(i,n));}
assert.deepEqual(visibleIndices(0,20,3),[19,0,1]);assert.deepEqual(visibleIndices(19,20,3),[18,19,0]);pass('Infinite wrap and visible slots work at both boundaries');
c=copy();const before=['shuffle','selection','transition','result'].map(p=>stageSize(p,390,c));c.sizes.mobile.shuffle=130;assert.deepEqual(['selection','transition','result'].map(p=>stageSize(p,390,c)),before.slice(1));assert.equal(stageSize('shuffle',1363,c),C.sizes.desktop.shuffle);pass('Stage and PC/mobile sizes are independent');
for(const w of [320,360,390,738,1040])for(const n of [3,5]){c=copy();c.counts.visible=n;const poses=Array.from({length:n},(_,i)=>slotPose(i-(n-1)/2,w,c));assert.equal(poses[(n-1)/2].scale,1);assert.ok(poses.every(p=>p.scale===1&&Number.isFinite(p.x)));
 for(const p of poses){const a=p.rot*Math.PI/180,k=c.camera.perspective/(c.camera.perspective-p.z),size=stageSize('selection',w,c);const half=(size*Math.abs(Math.cos(a))+size*c.aspect*Math.abs(Math.sin(a)))/2*k;assert.ok(Math.abs(p.x*k)+half<=w/2+.01);}}
pass('Automatic 3/5-slot fan geometry, same physical card size');
let near=-Infinity,far=Infinity,minScale=Infinity,maxScale=0;
for(const w of [360,1040])for(let t=0;t<=100;t++)for(let i=0;i<22;i++){const p=travelPose(i,t/100,w,510,22);assert.ok(Object.values(p).every(Number.isFinite));assert.equal(p.scale,1);near=Math.max(near,p.z);far=Math.min(far,p.z);const apparent=C.camera.perspective/(C.camera.perspective-p.z);minScale=Math.min(minScale,apparent);maxScale=Math.max(maxScale,apparent);}
assert.ok(near>450&&far< -300&&maxScale/minScale>2);pass('Perspective creates near/far size variation without randomized scale');
for(const [vw,vh]of [[1363,936],[390,844],[320,900],[2000,700],[700,2000]])for(const cw of [160,240]){const ch=cw*C.aspect,s=coverScale(vw,vh,cw,ch);assert.ok(cw*s>=vw&&ch*s>=vh);}
pass('Viewport cover scale covers portrait, landscape and extreme ratios');
const css=fs.readFileSync(new URL('../css/tarot.css',import.meta.url),'utf8');assert.ok(!css.includes('brightness(1.2)'));assert.ok(css.includes('-webkit-tap-highlight-color:transparent'));assert.ok(css.includes(':focus-visible::after'));assert.ok(css.includes('.tarot-card:disabled{opacity:1!important}'));pass('No hover face brightness filter; transparent tap highlight; outside focus; opaque disabled cards');
console.log(checks+' groups passed; pure math/config/source checks, not a substitute for browser QA');
