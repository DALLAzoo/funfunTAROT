import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {CONFIG as C} from '../js/settings/config/config.js';
import {makeCatalog,validateConfig,selectionPool,visibleIndices,slotPose} from '../js/motion/core/cinema-core.js';
const root=path.resolve(import.meta.dirname,'..');
function walk(dir){return fs.readdirSync(dir,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(path.join(dir,e.name)):[path.join(dir,e.name)]);}
let imports=0;
for(const f of walk(path.join(root,'js')).filter(f=>f.endsWith('.js'))){for(const [,rel] of fs.readFileSync(f,'utf8').matchAll(/from\s*['"]([^'"]+)['"]/g)){assert.ok(fs.existsSync(path.resolve(path.dirname(f),rel)),`${f}: ${rel}`);imports++;}}
const cat=makeCatalog();validateConfig(C,cat);assert.equal(selectionPool(cat).length,20);
assert.equal(C.carousel.selectedLift,22);assert.equal(C.carousel.selectedLiftDuration,260);assert.equal(C.reveal.travel,920);assert.equal(C.reveal.pauseBeforeFlip,360);assert.equal(C.reveal.sweep,2800);assert.equal(C.reveal.sweepAlpha,.48);
for(const w of [320,360,390,600,1040])for(let i=0;i<20;i++){const ids=visibleIndices(i,20,7);assert.equal(new Set(ids).size,7);for(let off=-3;off<=3;off++){const pose=slotPose(off,w);assert.ok(Number.isFinite(pose.x)&&Number.isFinite(pose.y));}}
console.log(JSON.stringify({pass:true,imports,catalog:cat.length,selectedLift:C.carousel.selectedLift,travel:C.reveal.travel,checkedWidths:[320,360,390,600,1040]},null,2));
