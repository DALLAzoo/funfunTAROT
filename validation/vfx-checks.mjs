import fs from 'node:fs';import vm from 'node:vm';import assert from 'node:assert/strict';
const calls=[];let time=0,raf=0;
const draw=new Proxy({createRadialGradient:()=>({addColorStop(){}})},{get:(o,k)=>o[k]??((...args)=>calls.push([k,...args]))});
const ctx=vm.createContext({performance:{now:()=>time},matchMedia:()=>({matches:false}),devicePixelRatio:3,ResizeObserver:class{observe(){}},document:{createElement:()=>({setAttribute(){},getContext:()=>draw}),addEventListener(){}},requestAnimationFrame:()=>++raf,cancelAnimationFrame(){}});
const source=fs.readFileSync(new URL('../js/magic-vfx.js',import.meta.url),'utf8');
const mod=new vm.SourceTextModule(source,{context:ctx});await mod.link(()=>new vm.SyntheticModule(['sampleCard'],function(){this.setExport('sampleCard',card=>card.p)},{context:ctx}));await mod.evaluate();
const magic=new mod.namespace.MagicVFX({clientWidth:360,clientHeight:480,append(){}});
assert.equal(magic.dpr,1.25);assert.equal(magic.limit,100);
const cards=Array.from({length:22},()=>({hidden:false,p:{x:0,y:0,z:0}}));magic.start(cards);magic.draw(16);magic.phase('vortex');
for(let n=1;n<90;n++){time=n*16;cards.forEach((c,i)=>{c.p.x=Math.sin(n/8+i)*90;c.p.z=Math.cos(n/8+i)*100;});magic.draw(time);assert.ok(magic.particles.length<=100);}
assert.ok(calls.some(c=>c[0]==='lineTo'));assert.ok(magic.particles.length>0);
time=1500;magic.finish();magic.draw(2100);assert.equal(magic.active,false);assert.equal(magic.particles.length,0);assert.equal(magic.trails.length,0);
console.log('PASS mobile DPR cap, particle cap, card-driven trails, fade completion, cleanup');
