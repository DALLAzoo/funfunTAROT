import {CONFIG as C,stageSize} from './config.js';
import {demoCards} from './card-data.js';
export const mod=(n,m)=>((n%m)+m)%m;
export function makeCatalog(config=C){
 const items=[...demoCards.map(([name,symbol],i)=>({id:`major-${String(i).padStart(2,'0')}`,name,symbol})),...config.catalog.additionalCards];
 return items.map(c=>({...c,frontImage:config.catalog.frontImages[c.id]||null}));
}
export function validateConfig(c,catalog){
 const fail=m=>{throw new Error(m)};
 if(!catalog.length||catalog.length>c.support.maxCatalog)fail('카드 데이터는 1~78장 범위로 등록해 주세요.');
 if(new Set(catalog.map(x=>x.id)).size!==catalog.length||catalog.some(x=>!x.id||!x.name))fail('카드 ID가 중복되었거나 이름이 비어 있습니다.');
 for(const key of ['shuffle','selection','visible','result'])if(!Number.isInteger(c.counts[key])||c.counts[key]<1)fail('카드 장수는 양의 정수여야 합니다.');
 if(c.counts.shuffle>Math.min(catalog.length,c.support.maxShuffle)||c.counts.selection>catalog.length)fail('등록된 카드 데이터보다 많은 장수를 요청했습니다.');
 if(!c.support.visible.includes(c.counts.visible)||c.counts.visible>c.counts.selection)fail('동시 표시 수는 3장, 5장 또는 7장이며 선택 대상 수 이하여야 합니다.');
 if(!c.support.result.includes(c.counts.result))fail('이번 시험본의 결과 공개는 1장을 지원합니다.');
 if(!['trial-uniform-subset','explicit-ids'].includes(c.pool.mode))fail('선택 대상 구성 방식을 확인해 주세요.');
 if(c.pool.mode==='explicit-ids'&&(c.pool.ids.length!==c.counts.selection||new Set(c.pool.ids).size!==c.pool.ids.length||c.pool.ids.some(id=>!catalog.some(x=>x.id===id))))fail('선택 카드 ID 목록과 선택 장수가 일치하지 않습니다.');
 if(c.catalog.requireActualFrontImages&&catalog.some(x=>!x.frontImage))fail('실제 앞면 이미지가 미등록된 카드가 있습니다.');
 for(const sizes of Object.values(c.sizes))for(const v of Object.values(sizes))if(!Number.isFinite(v)||v<40||v>700)fail('카드 크기는 40~700px 범위로 설정해 주세요.');
 for(const group of ['shuffle','finale','carousel','reveal','material','glow','vfx','camera'])for(const [key,v] of Object.entries(c[group]))if(typeof v==='number'&&!Number.isFinite(v))fail(`${group}.${key} 설정이 올바르지 않습니다.`);
 if(c.camera.perspective<600||c.camera.perspective>2400||c.shuffle.nearDepth<=0||c.shuffle.nearDepth>=.7||c.shuffle.farDepth>=0||c.shuffle.farDepth<-.8)fail('카메라 원근감 또는 깊이 설정이 지원 범위를 벗어났습니다.');
 for(const t of [c.shuffle.duration,c.shuffle.separate,c.finale.duration,c.carousel.move,c.carousel.enter,c.reveal.lift,c.reveal.approach,c.reveal.arrival,c.reveal.flip])if(t<100||t>15000)fail('동작 시간은 100~15000ms 범위로 설정해 주세요.');
 if(c.reveal.overscan<1||!['flip-after-arrival','front-on-arrival'].includes(c.reveal.mode))fail('화면 전환 설정을 확인해 주세요.');
 if(!Number.isFinite(c.aspect)||c.aspect<1||c.aspect>2.5)fail('카드 비율은 1~2.5 범위로 설정해 주세요.');
 for(const [key,min,max] of [['radiusX',.1,.8],['radiusY',.05,.5],['turns',.2,3]])if(c.shuffle[key]<min||c.shuffle[key]>max)fail('셔플 이동 범위가 지원 범위를 벗어났습니다.');
 if(c.material.thickness<0||c.material.thickness>6||c.glow.intensity<0||c.glow.intensity>1||c.glow.pulseMs<500||c.glow.pulseMs>15000)fail('두께 또는 테두리 발광 설정을 확인해 주세요.');
 if(Object.entries(c.catalog.frontImages).some(([id,url])=>!catalog.some(x=>x.id===id)||(url!==null&&typeof url!=='string')))fail('앞면 이미지의 카드 ID 또는 경로가 올바르지 않습니다.');
 return {records:catalog.length,registeredFrontImages:catalog.filter(x=>x.frontImage).length};
}
export function randomOrder(items,rng=Math.random){const a=[...items];for(let i=a.length-1;i>0;i--){const j=Math.floor(rng()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;}
export function selectionPool(catalog,c=C,rng=Math.random){return c.pool.mode==='explicit-ids'?c.pool.ids.map(id=>catalog.find(x=>x.id===id)):randomOrder(catalog,rng).slice(0,c.counts.selection);}
export const smooth=t=>{t=Math.max(0,Math.min(1,t));return t*t*(3-2*t)};
export const mix=(a,b,t)=>Object.fromEntries(Object.keys(a).map(k=>[k,a[k]+(b[k]-a[k])*t]));
export function slotPose(offset,width,c=C){
 const size=stageSize('selection',width,c),r=(c.counts.visible-1)/2,normalized=offset/r;
 const angle=c.carousel.angle*Math.PI/180,edgeZ=c.carousel.centerDepth-c.carousel.depthStep;
 const projection=c.camera.perspective/(c.camera.perspective-edgeZ);
 const halfEdge=(size*Math.cos(angle)+size*c.aspect*Math.sin(angle))/2*projection;
 const gap=Math.max(0,Math.min(size*c.carousel.gap,(width/2-halfEdge-8)/(r*projection)));
 return {x:offset*gap,y:Math.abs(normalized)*c.carousel.drop,z:c.carousel.centerDepth-Math.abs(normalized)*c.carousel.depthStep,rot:normalized*c.carousel.angle,ry:0,rx:0,scale:1};
}
export function visibleIndices(index,count,visible){const r=(visible-1)/2;return Array.from({length:visible},(_,i)=>mod(index+i-r,count));}
export function stackPose(i,count){return {x:0,y:-8,z:-Math.abs(i-(count-1)/2)*3,rot:0,ry:0,rx:0,scale:1};}
export function travelPose(index,t,width,height,count,c=C){
 const k=index%Math.ceil(count/2),side=index<Math.ceil(count/2)?1:-1;
 const phase=k*2.399963,dir=k%3===1?-1:1;
 const a=phase+dir*t*Math.PI*2*(c.shuffle.turns+(k%4)*.075);
 const radius=.66+(k%5)*.075;
 const x=side*Math.cos(a)*width*c.shuffle.radiusX*radius;
 const y=side*(Math.sin(a)*Math.cos(k*.37)*height*c.shuffle.radiusY+Math.cos(a)*height*.065);
 const middle=(c.shuffle.nearDepth+c.shuffle.farDepth)/2*c.camera.perspective;
 const depth=(c.shuffle.nearDepth-c.shuffle.farDepth)/2*c.camera.perspective;
 return {x,y:y-12,z:middle+side*Math.sin(a)*depth,rot:side*Math.sin(a*.8+k)*25,ry:side*Math.cos(a)*c.shuffle.rotationY,rx:side*Math.sin(a+k*.2)*c.shuffle.rotationX,scale:1};
}
export function coverScale(vw,vh,cw,ch,overscan=C.reveal.overscan){return Math.max(vw/cw,vh/ch)*overscan;}
