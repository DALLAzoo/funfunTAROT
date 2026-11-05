/* In-between Shift — CINEMA 01 / high-detail hybrid 3D stage.
 * Environment: original high-resolution cinematic rendering with photographic depth.
 * Cards: real WebGL2 3D geometry, shared stage camera and moving key/fill lights.
 * The image environment is a pre-rendered 2.5D plate, NOT a live 3D rock mesh.
 * No external runtime libraries. Website's original deck textures load by URL when online.
 */
(()=>{'use strict';
const $=id=>document.getElementById(id), canvas=$('view'), stage=$('stageWrap');
const gl=canvas.getContext('webgl2',{antialias:true,alpha:true,premultipliedAlpha:false,powerPreference:'high-performance'});
if(!gl){$('unavailable').hidden=false;$('sceneLabel').textContent='WEBGL2 미지원';$('shuffle').disabled=true;return;}
const PI=Math.PI, TAU=2*PI;
const clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v)),smooth=t=>{t=clamp(t);return t*t*(3-2*t);},mix=(a,b,t)=>a+(b-a)*t;
function seeded(n){let a=n>>>0;return()=>{a=(a+0x6D2B79F5)|0;let t=Math.imul(a^(a>>>15),1|a);t^=t+Math.imul(t^(t>>>7),61|t);return ((t^(t>>>14))>>>0)/4294967296;};}
const rng=seeded(90174);
const vec={sub:(a,b)=>a.map((v,i)=>v-b[i]),cross:(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]],norm:a=>{const n=Math.hypot(...a)||1;return a.map(v=>v/n)},dot:(a,b)=>a.reduce((s,v,i)=>s+v*b[i],0)};
const I=()=>new Float32Array([1,0,0,0, 0,1,0,0, 0,0,1,0, 0,0,0,1]);
function mul(a,b){const o=new Float32Array(16);for(let c=0;c<4;c++)for(let r=0;r<4;r++){o[c*4+r]=0;for(let k=0;k<4;k++)o[c*4+r]+=a[k*4+r]*b[c*4+k];}return o;}
function T(x,y,z){const o=I();o[12]=x;o[13]=y;o[14]=z;return o;}
function Rx(a){const o=I(),c=Math.cos(a),s=Math.sin(a);o[5]=c;o[6]=s;o[9]=-s;o[10]=c;return o;}
function Ry(a){const o=I(),c=Math.cos(a),s=Math.sin(a);o[0]=c;o[2]=-s;o[8]=s;o[10]=c;return o;}
function Rz(a){const o=I(),c=Math.cos(a),s=Math.sin(a);o[0]=c;o[1]=s;o[4]=-s;o[5]=c;return o;}
function perspective(fov,aspect,near,far){const f=1/Math.tan(fov/2),m=new Float32Array(16);m[0]=f/aspect;m[5]=f;m[10]=(far+near)/(near-far);m[11]=-1;m[14]=2*far*near/(near-far);return m;}
function lookAt(eye,at,up=[0,1,0]){const z=vec.norm(vec.sub(eye,at)),x=vec.norm(vec.cross(up,z)),y=vec.cross(z,x),m=I();m[0]=x[0];m[1]=y[0];m[2]=z[0];m[4]=x[1];m[5]=y[1];m[6]=z[1];m[8]=x[2];m[9]=y[2];m[10]=z[2];m[12]=-vec.dot(x,eye);m[13]=-vec.dot(y,eye);m[14]=-vec.dot(z,eye);return m;}
function model(p){const rot=mul(Ry(p.ry||0),mul(Rx(p.rx||0),Rz(p.rz||0)));return mul(T(p.x||0,p.y||0,p.z||0),rot);}
const VS=`#version 300 es
precision highp float; precision highp int;
layout(location=0) in vec3 aP; layout(location=1) in vec3 aN;
layout(location=2) in vec2 aUV;layout(location=3) in vec3 aC;
uniform mat4 uP,uV,uM; uniform int uKind;
out vec3 vWorld,vNormal,vColor;out vec2 vUV;out float vDepth;
void main(){vec4 q=uM*vec4(aP,1.);vWorld=q.xyz;vNormal=normalize(mat3(uM)*aN);vColor=aC;vUV=aUV;vDepth=-(uV*q).z;gl_Position=uP*uV*q;
if(uKind==5)gl_PointSize=clamp(5.0*(7.0/max(3.0,vDepth)),1.0,6.0);
}`;
const FS=`#version 300 es
precision highp float; precision highp int;
in vec3 vWorld,vNormal,vColor;in vec2 vUV;in float vDepth;
out vec4 frag;uniform sampler2D uTex; uniform vec3 uLight,uEye;
uniform float uTime,uFade,uLightPower,uBeamShift;uniform int uKind;
float h(vec3 p){return fract(sin(dot(p,vec3(31.91,47.37,11.17)))*43758.5453);}
float n3(vec3 p){vec3 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);float a=h(i),b=h(i+vec3(1,0,0)),c=h(i+vec3(0,1,0)),d=h(i+vec3(1,1,0)),e=h(i+vec3(0,0,1)),f1=h(i+vec3(1,0,1)),g=h(i+vec3(0,1,1)),k=h(i+vec3(1,1,1));return mix(mix(mix(a,b,f.x),mix(c,d,f.x),f.y),mix(mix(e,f1,f.x),mix(g,k,f.x),f.y),f.z);}
void main(){
if(uKind==4){
 float r=length((vUV-.5)*vec2(1.12,1.4));
 vec3 base=mix(vec3(.026,.055,.078),vec3(.005,.014,.023),smoothstep(.12,.81,r));
 base+=vec3(.043,.065,.059)*exp(-pow((vUV.x-.52)*3.0,2.))*exp(-pow((vUV.y-.45)*3.5,2.));
 frag=vec4(base,1.);return;}
if(uKind==3){
 float dx=abs(vUV.x-.5);
 float axial=exp(-dx*dx*22.0);
 float edge=smoothstep(.04,.28,vUV.y)*(1.-smoothstep(.79,1.,vUV.y));
 float shimmer=.85+.15*sin(uTime*.47+vUV.y*5.+uBeamShift);
 float a=axial*edge*shimmer*uFade;
 frag=vec4(vec3(1.0,.88,.63)*a*1.3,a*.50);return;}
if(uKind==6){
 float d=length((vUV-.5)*vec2(1.,1.7));
 float a=exp(-d*d*12.)*uFade;
 frag=vec4(vec3(.89,.73,.48)*a,a*.26);return;}
if(uKind==5){
 float d=length(gl_PointCoord-.5);float a=(1.-smoothstep(.08,.5,d))*uFade*(.18+.28*vColor.r);
 frag=vec4(.89,.79,.59,a);return;}
 vec3 N=normalize(vNormal),L=normalize(uLight-vWorld),V=normalize(uEye-vWorld),H=normalize(L+V);
 float ndl=max(dot(N,L),0.),spec=pow(max(dot(N,H),0.),uKind==1?58.:uKind==2?39.:16.);
 float dist=length(uLight-vWorld),decay=1.0/(1.+.018*dist*dist);
 float spot=smoothstep(-.38,.44,dot(normalize(vWorld-uLight),normalize(vec3(.17,-1.,-.27))));
 float key=ndl*decay*(.48+spot*.52)*uLightPower;
 float cool=max(dot(N,normalize(vec3(-.85,.22,-.45))),0.)*.13;
 if(uKind==0){
   float grain=n3(vWorld*5.3)*.15;
   float strata=n3(vec3(vWorld.x*3.6,vWorld.y*9.7,vWorld.z*3.7));
   float crevice=smoothstep(.12,.33,strata);
   vec3 rock=vColor*(.14+key*1.12+cool+grain)*mix(.65,1.2,crevice);
   rock+=vec3(.25,.21,.15)*spec*.21;
   float fog=clamp((vDepth-6.)/14.,0.,.64);
   rock=mix(rock,vec3(.044,.09,.109),fog);
   frag=vec4(rock,1.);return;
 }
 if(uKind==1){
   vec3 art=texture(uTex,vUV).rgb;
   float lambert=clamp(.96+.8*key+cool, .66,1.58);
   vec3 tint=mix(art,art*vec3(1.15,1.06,.89),clamp(key,0.,.4));
   float metallicPrint=smoothstep(.065,.30,art.r-art.b)*smoothstep(.15,.52,art.r);
   float fresnel=pow(1.-max(dot(N,V),0.),3.0);
   vec3 outc=tint*lambert+vec3(1.,.85,.55)*spec*(.14+.88*metallicPrint)*uLightPower+vec3(.36,.29,.20)*fresnel*.17;
   float highlight=pow(max(dot(N,H),0.),12.)*.17*uLightPower;
   outc+=vec3(.85,.76,.56)*highlight;
   frag=vec4(outc,uFade);return;
 }
 vec3 edge=vec3(.41,.31,.16)*(.52+key*.92)+vec3(1.0,.8,.49)*spec*.45*uLightPower;
 edge+=vec3(.15,.10,.045)*sin(vWorld.y*100.)*.14;
 frag=vec4(edge,uFade);
}`;
function shader(t,src){const s=gl.createShader(t);gl.shaderSource(s,src);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw Error(gl.getShaderInfoLog(s));return s;}
const pr=gl.createProgram();gl.attachShader(pr,shader(gl.VERTEX_SHADER,VS));gl.attachShader(pr,shader(gl.FRAGMENT_SHADER,FS));gl.linkProgram(pr);if(!gl.getProgramParameter(pr,gl.LINK_STATUS))throw Error(gl.getProgramInfoLog(pr));gl.useProgram(pr);
const uni={};for(const k of ['uP','uV','uM','uKind','uLight','uEye','uTime','uFade','uLightPower','uBeamShift','uTex'])uni[k]=gl.getUniformLocation(pr,k);
function mesh(vertices){const a=new Float32Array(vertices),vao=gl.createVertexArray(),buf=gl.createBuffer();gl.bindVertexArray(vao);gl.bindBuffer(gl.ARRAY_BUFFER,buf);gl.bufferData(gl.ARRAY_BUFFER,a,gl.STATIC_DRAW);for(let i=0,off=0;i<4;i++){const sizes=[3,3,2,3];gl.enableVertexAttribArray(i);gl.vertexAttribPointer(i,sizes[i],gl.FLOAT,false,44,off);off+=sizes[i]*4;}gl.bindVertexArray(null);return {vao,count:a.length/11};}
function vertex(v,p,n,uv,c){v.push(...p,...n,...uv,...c);}
function tri(out,a,b,c,color,uvA=[0,0],uvB=[1,0],uvC=[.5,1]){const n=vec.norm(vec.cross(vec.sub(b,a),vec.sub(c,a)));vertex(out,a,n,uvA,color);vertex(out,b,n,uvB,color);vertex(out,c,n,uvC,color);}
function quad(out,a,b,c,d,color=[1,1,1]){tri(out,a,b,c,color,[0,0],[1,0],[1,1]);tri(out,a,c,d,color,[0,0],[1,1],[0,1]);}
// The high-detail stone environment is a pre-rendered image plate, not a
// procedural polygon cave. No unused rock mesh is uploaded to the GPU.
function makeCardMeshes(){const back=[],front=[],edges=[],w=.87,h=1.47,d=.038;
 quad(back,[-w,-h,d],[w,-h,d],[w,h,d],[-w,h,d]);
 quad(front,[w,-h,-d],[-w,-h,-d],[-w,h,-d],[w,h,-d]);
 const sideCol=[.62,.50,.32];
 quad(edges,[w,-h,d],[w,-h,-d],[w,h,-d],[w,h,d],sideCol);
 quad(edges,[-w,-h,-d],[-w,-h,d],[-w,h,d],[-w,h,-d],sideCol);
 quad(edges,[-w,h,d],[w,h,d],[w,h,-d],[-w,h,-d],sideCol);
 quad(edges,[-w,-h,-d],[w,-h,-d],[w,-h,d],[-w,-h,d],sideCol);
 return [mesh(back),mesh(front),mesh(edges)];}
const [cardBackFace,cardFrontFace,cardEdges]=makeCardMeshes();
const beamBuf=[];function beamQuad(cx,cy,topW,botW,z,height){quad(beamBuf,[cx-topW/2,cy,z],[cx+topW/2,cy,z],[cx+botW/2,cy-height,z], [cx-botW/2,cy-height,z]);}
beamQuad(-1.45,4.8,.3,5.3,-4,8.0);const beam1=mesh(beamBuf);
const beamBuf2=[];quad(beamBuf2,[-1.25,5.,-2.2],[-.60,5.,-2.2],[2.7,-3.4,-2.2],[-3.95,-3.4,-2.2]);const beam2=mesh(beamBuf2);
const glowBuf=[];quad(glowBuf,[-4,1.5,-5],[3,1.5,-5],[3,6.5,-5],[-4,6.5,-5]);const glow=mesh(glowBuf);
const points=[];for(let i=0;i<85;i++){vertex(points,[(rng()-.5)*10,(rng()-.5)*6,-.5-rng()*7],[0,0,1],[0,0],[rng(),.85,.55]);}const dust=mesh(points);
function makeTextureCanvas(){const c=document.createElement('canvas');c.width=512;c.height=868;const ctx=c.getContext('2d'),w=c.width,h=c.height;
 const bg=ctx.createLinearGradient(0,0,w,h);bg.addColorStop(0,'#173b3a');bg.addColorStop(.45,'#071c24');bg.addColorStop(1,'#25453e');ctx.fillStyle=bg;ctx.fillRect(0,0,w,h);
 const r=seeded(33);for(let i=0;i<22000;i++){ctx.fillStyle=r()>.5?'#e6dbaa':'#000';ctx.globalAlpha=r()*.075;const x=r()*w,y=r()*h;ctx.fillRect(x,y,1,1);}ctx.globalAlpha=1;
 const color='#e0b77b';ctx.strokeStyle=color;ctx.lineWidth=5;ctx.strokeRect(24,24,w-48,h-48);ctx.lineWidth=1.5;ctx.strokeRect(35,35,w-70,h-70);ctx.strokeStyle='#cfb68070';ctx.strokeRect(46,46,w-92,h-92);
 ctx.save();ctx.translate(w/2,h/2);ctx.strokeStyle='#d9b781';ctx.lineWidth=2.1;
 for(let i=0;i<3;i++){ctx.beginPath();ctx.ellipse(0,0,145-i*20,201-i*30,0,0,TAU);ctx.stroke();}
 for(let i=0;i<12;i++){const a=i*TAU/12;ctx.beginPath();ctx.moveTo(Math.cos(a)*145,Math.sin(a)*145);ctx.lineTo(Math.cos(a+TAU/6)*125,Math.sin(a+TAU/6)*125);ctx.stroke();}
 for(let i=0;i<8;i++){const a=TAU*i/8;ctx.beginPath();ctx.moveTo(Math.cos(a)*8,Math.sin(a)*8);ctx.lineTo(Math.cos(a)*137,Math.sin(a)*185);ctx.stroke();}
 ctx.rotate(PI/4);ctx.lineWidth=5;ctx.strokeRect(-63,-63,126,126);ctx.lineWidth=1.5;ctx.strokeRect(-80,-80,160,160);ctx.rotate(-PI/4);
 ctx.beginPath();ctx.ellipse(0,0,65,29,0,0,TAU);ctx.stroke();ctx.fillStyle='#e9c993';ctx.beginPath();ctx.arc(0,0,21,0,TAU);ctx.fill();ctx.fillStyle='#112b2d';ctx.beginPath();ctx.arc(0,0,8,0,TAU);ctx.fill();ctx.restore();
 // No text or logo is drawn on the fallback card back.
 for(let xx of [90,w-90])for(let yy of [160,h-160]){ctx.save();ctx.translate(xx,yy);ctx.rotate(PI/4);ctx.strokeStyle='#bda474';ctx.lineWidth=2;ctx.strokeRect(-12,-12,24,24);ctx.restore();}
 return c;}
let currentTex=null;
function updateTex(source){if(!currentTex)currentTex=gl.createTexture();gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D,currentTex);gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,true);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,source);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR_MIPMAP_LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);gl.generateMipmap(gl.TEXTURE_2D);gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,false);}
updateTex(makeTextureCanvas());
const remote=new Image();remote.crossOrigin='anonymous';remote.onerror=()=>{console.info('Original deck texture unavailable offline; use the sample or upload your own card back.');};remote.onload=()=>{try{updateTex(remote);$('sceneLabel').textContent='ORIGINAL DECK · 3D';}catch(e){console.warn('texture:',e.message)}};
// The original back remains in its existing public site; network is optional.
remote.src='https://dallazoo.github.io/funfunTAROT/assets/card-backs/back-01.webp';
$('textureInput').addEventListener('change',e=>{const file=e.target.files?.[0];if(!file)return;const url=URL.createObjectURL(file);const img=new Image();img.onload=()=>{updateTex(img);URL.revokeObjectURL(url);$('state').textContent='내 카드 뒷면 적용 완료';};img.onerror=()=>URL.revokeObjectURL(url);img.src=url;});
const SOURCE_ROOT='https://dallazoo.github.io/funfunTAROT/';
const ALL_CARD_IDS=[...Array.from({length:22},(_,n)=>`major-${String(n).padStart(2,'0')}`),
 'cups-page','wands-page','swords-page','pentacles-page',
 'swords-knight','wands-knight','cups-knight','pentacles-knight'];
let deckIds=[];
function randomDeck(){
 const all=ALL_CARD_IDS.slice();
 for(let i=all.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[all[i],all[j]]=[all[j],all[i]];}
 deckIds=all.slice(0,22);
}
randomDeck();
let userReadings=null;
// Read the exact text already entered in the live In-between Shift site.
// Parsing is data-only: the remote JavaScript is NEVER evaluated or executed.
function parseOriginalReadings(source){
 const found=new Map();
 const re=/chosen\.cardData\.id\s*===\s*'([^']+)'\s*\?\s*`([\s\S]*?)`\s*:/g;
 for(const m of source.matchAll(re))found.set(m[1],m[2]);
 if(found.size<30)throw new Error('기존 상담 문구 전체를 확인하지 못했습니다.');
 return found;
}
const readingsPromise=fetch(SOURCE_ROOT+'js/screen/app/reveal-flow.js')
 .then(r=>{if(!r.ok)throw new Error('상담 문구 HTTP '+r.status);return r.text();})
 .then(parseOriginalReadings)
 .then(r=>(userReadings=r,r))
 .catch(e=>{console.warn('기존 상담 문구를 읽지 못했습니다:',e);return null;});
let frontTexture=null;
function uploadFront(source){
 if(!frontTexture)frontTexture=gl.createTexture();
 gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D,frontTexture);
 gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,true);
 gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,source);
 gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);
 gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
 gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR_MIPMAP_LINEAR);
 gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);
 gl.generateMipmap(gl.TEXTURE_2D);
 gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,false);
}
function loadFrontImage(cardId){return new Promise((resolve,reject)=>{
 const img=new Image();img.crossOrigin='anonymous';
 img.onload=()=>{try{uploadFront(img);resolve(true);}catch(err){reject(err);}};
 img.onerror=()=>reject(new Error('선택 카드 앞면 이미지를 불러올 수 없습니다.'));
 img.src=SOURCE_ROOT+'assets/card-fronts/'+encodeURIComponent(cardId)+'.png';
});}
let revealMode='none',revealStarted=0,revealIndex=-1,revealCardId=null,revealText='';
function resetReveal(){
 revealMode='none';revealStarted=0;revealIndex=-1;revealCardId=null;revealText='';
 $('resultView').hidden=true;$('resultReading').textContent='';
 $('resultSelectionTitle').textContent='마음이 끌리는 카드를 선택하세요';
 $('shuffle').hidden=false;$('resultAgain').hidden=true;
 $('readingDropdown').hidden=false;$('readingOptions').hidden=true;
}
async function revealSelected(i){
 if(revealMode!=='none'||!ready())return;
 revealMode='loading';revealIndex=i;revealCardId=deckIds[i];
 stage.classList.remove('fan-ready');
 try{
  const [_,texts]=await Promise.all([loadFrontImage(revealCardId),readingsPromise]);
  if(!texts||!texts.has(revealCardId))throw new Error('이미 입력된 상담 문구를 불러오지 못했습니다.');
  revealText=texts.get(revealCardId);
  revealMode='flipping';revealStarted=performance.now();
  $('shuffle').hidden=true;$('readingDropdown').hidden=true;
 }catch(err){
  console.warn(err);revealMode='none';revealIndex=-1;
  stage.classList.add('fan-ready');
  // Do not replace the user's existing reading with newly authored advice.
  $('resultReading').textContent=err.message;
  $('resultView').hidden=false;
 }
}
const actorCount=22;let mobile=false,heroes=5,heroIds=[],heroMap=new Map();
function layout(){mobile=stage.clientWidth<650;heroes=mobile?3:5;heroIds=Array.from({length:heroes},(_,j)=>Math.floor((j+.5)*actorCount/heroes));heroMap=new Map(heroIds.map((id,j)=>[id,j]));}
layout();
const initial=i=>({x:0,y:-.45,z:.2+i*.003,rz:0,ry:0,rx:0});
function hero(j){const center=j-(heroes-1)/2;const xs=mobile?1.72:1.85;return {x:center*xs,y:(mobile?[.03,.60,-.20]:[-.25,.24,.55,.15,-.3])[j],z:(mobile?[1.1,1.5,1.05]:[1.05,1.55,1.78,1.45,1.05])[j],rz:(mobile?[-.13,.04,.13]:[-.20,.10,-.03,-.1,.20])[j],ry:-center*.07,rx:.055};}
function packet(i){const side=i%2===0?-1:1,row=Math.floor(i/2);return {x:side*(mobile?1.88:2.75)+side*(row%2)*.006,y:-2.45+(row%3)*.005,z:-1.35-row*.035,rz:side*.11,ry:side*.10,rx:0};}
function mPose(a,b,t){const o={};for(const k of ['x','y','z','rz','rx','ry'])o[k]=mix(a[k]||0,b[k]||0,t);return o;}
function mate(j){if(heroes===3)return j===0?2:j===2?0:-1;return j===0?1:j===1?0:j===3?4:j===4?3:-1;}
function flying(j,phase){const a=hero(j),m=mate(j),u=smooth(clamp((phase-.05)/(heroes===5?.72:.76)));if(m<0)return {...a,y:a.y+Math.sin(u*PI)*.3,z:a.z+Math.sin(u*PI)*.35,ry:a.ry+Math.sin(u*TAU)*.08};const b=hero(m),forward=j<m,p=Math.sin(u*PI);return {...mPose(a,b,u),y:mix(a.y,b.y,u)+(forward?.73:-.55)*p,z:mix(a.z,b.z,u)+(forward?1.45:-1.45)*p,rz:mix(a.rz,b.rz,u)+(forward?-.16:.17)*p,ry:mix(a.ry,b.ry,u)+(forward?.23:-.23)*p,rx:.055+(forward?-.03:.10)*p};}
function packetFlight(i,phase){const a=packet(i),s=smooth(clamp(phase/.82)),u=Math.sin(s*PI);return {...a,x:a.x+(i%2===0?-.18:.18)*u,y:a.y+.18*u,z:a.z+.13*u,ry:a.ry+.05*u};}
function fanPose(j){const center=j-3;const xs=mobile?.68:.96;return {x:center*xs,y:-.15-.13*Math.abs(center)+.28*Math.abs(center/3)**2,z:.8+.02*(3-Math.abs(center)),rz:center*(mobile?-.11:-.12),ry:0,rx:0};}
// A 22-card circular selection fan: the original v8 only displayed cards 0..6.
// focusIndex and gestureOffset are updated by pointer/keyboard input below.
let focusIndex=3,gestureOffset=0,pickedIndex=-1,confirmedIndex=-1;
const circular=(n,count)=>((n%count)+count)%count;
const wrappedDistance=(i,center)=>circular(i-center+actorCount/2,actorCount)-actorCount/2;
const visibleOffset=i=>wrappedDistance(i,focusIndex+gestureOffset);
function selectedFanPose(i,offset){
 const p=fanPose(offset+3);
 if(i===pickedIndex && Math.abs(offset)<.55){p.y+=.36;p.z+=.50;}
 return p;
}
function poseFor(i,seconds){const j=heroMap.get(i),h=j!==undefined,first=initial(i);
 if(seconds<=0)return {p:first,alpha:1};
 if(seconds<1.04){const t=smooth(seconds/1.04);return {p:mPose(first,h?hero(j):packet(i),t),alpha:1};}
 if(seconds<3.85){const t=(seconds-1.04)/2.81;return {p:h?flying(j,t):packetFlight(i,t),alpha:1};}
 if(seconds<5.02){const t=smooth((seconds-3.85)/1.17);const a=h?flying(j,1):packetFlight(i,1),b=initial(i);const p=mPose(a,b,t);p.y+=Math.sin(t*PI)*.16;p.z+=Math.sin(t*PI)*.35;return {p,alpha:1};}
 if(seconds<5.32)return {p:first,alpha:1};
 const t=smooth(clamp((seconds-5.32)/1.06));
 // Transition the initial seven cards to the new interactive carousel.
 // Later all 22 cards can travel through the same seven visible slots.
 const off=visibleOffset(i),abs=Math.abs(off);
 if(abs<3.85){
   const edgeFade=clamp((3.85-abs)/.40,0,1);
   return {p:mPose(first,selectedFanPose(i,off),t),alpha:(1-t)+t*edgeFade};
 }
 return {p:first,alpha:1-t};
}
let running=false,start=0,clock=0,paused=false,hoverX=0,hoverY=0,activeX=0,activeY=0,last=0;
let shaderReady=true;
let currentV=I(),currentP=I();
function dimensions(){const rect=canvas.getBoundingClientRect(),scale=Math.min(window.devicePixelRatio||1,mobile?1.15:1.35);const w=Math.max(1,Math.round(rect.width*scale)),h=Math.max(1,Math.round(rect.height*scale));if(canvas.width!==w||canvas.height!==h){canvas.width=w;canvas.height=h;gl.viewport(0,0,w,h);}return {w,h};}
function drawMesh(m,kind,pos=I(),alpha=1){gl.uniform1i(uni.uKind,kind);gl.uniformMatrix4fv(uni.uM,false,pos);gl.uniform1f(uni.uFade,alpha);gl.bindVertexArray(m.vao);gl.drawArrays(kind===5?gl.POINTS:gl.TRIANGLES,0,m.count);}
function render(now){if(document.hidden){last=now;requestAnimationFrame(render);return;}const dt=Math.min(.05,Math.max(0,(now-last)/1000));last=now;const {w,h}=dimensions();if(running){clock=clamp((now-start)/1000,0,6.38);if(clock>=6.38){running=false;$('shuffle').disabled=false;$('shuffle').textContent='다시 섞기';$('state').textContent='카드 선택 가능 · 드래그 / 터치';$('phaseText').textContent='좌우로 밀어 카드를 이동하고, 눌러 선택하세요';$('phaseCount').textContent='4 / 22';stage.classList.add('fan-ready');}}else if(clock===0){};
 const t=clock;
 if(running){const names=t<1.04?['카드가 공중으로 떠오릅니다','01 / 05']:t<3.85?['공간 속에서 서로 다른 길로 교차합니다','02 / 05']:t<5.02?['카드가 하나의 덱으로 모입니다','03 / 05']:t<5.32?['고요한 순간','04 / 05']:['카드를 펼칩니다','05 / 05'];$('phaseText').textContent=names[0];$('phaseCount').textContent=names[1];}
 if(!paused){activeX+=(hoverX-activeX)*Math.min(1,dt*2.4);activeY+=(hoverY-activeY)*Math.min(1,dt*2.4);}else{activeX+=(0-activeX)*Math.min(1,dt*4);activeY+=(0-activeY)*Math.min(1,dt*4);}
 const forward=running?Math.sin(clamp(t/5)*PI)*.25:0;
 const eye=[activeX*.29, .38+activeY*.16, mobile?10.1-forward:9.15-forward],target=[activeX*.055,.1,-1.9];
 const light=[-.9+(paused?0:Math.sin(now*.00046)*1.35)+activeX*.48,6.3,4.5];
 const v=lookAt(eye,target),p=perspective((mobile?50:48)*PI/180,w/h,.1,70);
 currentV=v;currentP=p;
 gl.enable(gl.DEPTH_TEST);gl.depthFunc(gl.LEQUAL);gl.depthMask(true);gl.disable(gl.BLEND);gl.clearColor(0,0,0,0);gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);
 gl.useProgram(pr);gl.uniformMatrix4fv(uni.uP,false,p);gl.uniformMatrix4fv(uni.uV,false,v);gl.uniform3fv(uni.uLight,light);gl.uniform3fv(uni.uEye,eye);gl.uniform1f(uni.uTime,now/1000);gl.uniform1f(uni.uLightPower,paused?1.1:2.25);gl.uniform1f(uni.uBeamShift,activeX);
 gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D,currentTex);gl.uniform1i(uni.uTex,0);
 /* Scenic plate is behind this transparent WebGL canvas. */
 gl.enable(gl.BLEND);gl.blendFunc(gl.SRC_ALPHA,gl.ONE);gl.depthMask(false);
 drawMesh(glow,6,I(),paused?.42:1.1);drawMesh(beam1,3,I(),paused?.27:1.15);drawMesh(beam2,3,I(),paused?.17:.72);drawMesh(dust,5,I(),paused?.21:.72);
 gl.depthMask(true);gl.blendFunc(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA);
 const actorFrames=[];
 if(revealMode==='flipping'||revealMode==='result'){
  const secs=(now-revealStarted)/1000;
  const centerMove=smooth(clamp(secs/.82));
  const flip=smooth(clamp((secs-.63)/.78));
  const from=selectedFanPose(revealIndex,visibleOffset(revealIndex));
  const to={x:0,y:.2,z:mobile?4.1:3.9,rz:0,ry:PI,rx:0};
  const card=mPose(from,to,centerMove);
  card.ry=PI*flip;
  actorFrames.push({p:card,alpha:1,index:revealIndex,selected:true});
  if(revealMode==='flipping'&&secs>=1.6){
   revealMode='result';
   $('resultSelectionTitle').textContent='조언 - 당신을 위한';
   $('resultReading').textContent=revealText;
   $('resultView').hidden=false;
   $('resultAgain').hidden=false;
   $('readingDropdown').hidden=false;
  }
 }else{
  for(let i=0;i<actorCount;i++){
   const a=poseFor(i,t);
   if(a.alpha<.005)continue;
   actorFrames.push({...a,index:i});
  }
 }
 // With depth testing the 3D cards occlude one another, not merely a CSS z-index.
 for(const a of actorFrames){const mm=model(a.p);if(a.alpha<.99){gl.enable(gl.BLEND);gl.depthMask(false);}else{gl.disable(gl.BLEND);gl.depthMask(true);}drawMesh(cardEdges,2,mm,a.alpha);
  gl.bindTexture(gl.TEXTURE_2D,currentTex);
  drawMesh(cardBackFace,1,mm,a.alpha);
  gl.bindTexture(gl.TEXTURE_2D,a.selected&&frontTexture?frontTexture:currentTex);
  drawMesh(cardFrontFace,1,mm,a.alpha);}
 gl.depthMask(true);gl.disable(gl.BLEND);gl.bindVertexArray(null);
 requestAnimationFrame(render);
}
const pointer=event=>{if(paused||dragging)return;const r=stage.getBoundingClientRect();hoverX=clamp((event.clientX-r.left)/r.width*2-1,-1,1);hoverY=-clamp((event.clientY-r.top)/r.height*2-1,-1,1);stage.style.setProperty('--pan-x',`${(hoverX*16).toFixed(1)}px`);stage.style.setProperty('--pan-y',`${(hoverY*13).toFixed(1)}px`);};
// Project a card center to the display to distinguish clicking a card from
// clicking empty scenery; this is not an HTML overlay pretending to be a card.
function projectWorld(pt){
 const a=[pt.x,pt.y,pt.z,1];
 const byMat=(mat,v)=>Array.from({length:4},(_,row)=>mat[row]*v[0]+mat[4+row]*v[1]+mat[8+row]*v[2]+mat[12+row]*v[3]);
 const clip=byMat(currentP,byMat(currentV,a));
 if(clip[3]<=.1)return null;
 const r=canvas.getBoundingClientRect();
 return {x:r.left+(clip[0]/clip[3]+1)*r.width*.5,
         y:r.top+(1-clip[1]/clip[3])*r.height*.5,
         pixelsPerUnit:Math.abs(currentP[5]*r.height/(2*clip[3]))};
}
function hitCard(clientX,clientY){
 let best=-1,score=Infinity;
 for(let i=0;i<actorCount;i++){
   const offset=visibleOffset(i);
   if(Math.abs(offset)>3.42)continue;
   const screen=projectWorld(selectedFanPose(i,offset));
   if(!screen)continue;
   const wx=screen.pixelsPerUnit*.87,hy=screen.pixelsPerUnit*1.47;
   const dx=Math.abs(clientX-screen.x)/Math.max(24,wx),dy=Math.abs(clientY-screen.y)/Math.max(36,hy);
   // The generous rectangle uses the real card dimensions in screen pixels.
   if(dx>.98||dy>.94)continue;
   const s=dx*dx+dy*dy+Math.abs(offset)*.0001;
   if(s<score){score=s;best=i;}
 }
 return best;
}
let gesture=null,dragging=false;
const ready=()=>clock>=6.38&&!running&&revealMode==='none';
const gestureStep=()=>Math.max(mobile?43:55,Math.min(92,stage.clientWidth*(mobile?.145:.065)));
function setFocus(index){focusIndex=circular(index,actorCount);pickedIndex=-1;confirmedIndex=-1;gestureOffset=0;
 $('state').textContent=`${focusIndex+1}번째 카드 · 선택하려면 누르세요`;
 $('phaseCount').textContent=`${focusIndex+1} / ${actorCount}`;
 $('phaseText').textContent='가운데 카드를 한 번 누르면 선택됩니다';
}
function chooseCard(i){
 if(i<0)return;
 if(i!==focusIndex){setFocus(i);return;}
 if(pickedIndex===i){confirmedIndex=i;revealSelected(i);return;}
 pickedIndex=i;confirmedIndex=-1;
 $('state').textContent=`${i+1}번째 카드 선택됨`;
 $('phaseText').textContent='한 번 더 누르면 선택을 확인합니다';
}
stage.addEventListener('pointerdown',e=>{
 if(!ready()||e.button!==undefined&&e.button!==0||e.target.closest('button'))return;
 gesture={id:e.pointerId,x:e.clientX,y:e.clientY,origin:focusIndex,moved:false};
 dragging=false;
 try{stage.setPointerCapture(e.pointerId);}catch(_){}
},{passive:true});
stage.addEventListener('pointermove',e=>{
 if(gesture&&gesture.id===e.pointerId&&ready()){
   const dx=e.clientX-gesture.x,dy=e.clientY-gesture.y;
   if(!gesture.moved&&Math.abs(dx)>9&&Math.abs(dx)>Math.abs(dy)*.65)gesture.moved=true;
   if(gesture.moved){dragging=true;gestureOffset=clamp(-dx/gestureStep(),-6,6);
     $('phaseText').textContent='카드를 밀어 이동 중';e.preventDefault();}
   return;
 }
 pointer(e);
},{passive:false});
function finishGesture(e,cancelled=false){
 if(!gesture||gesture.id!==e.pointerId)return;
 const g=gesture;gesture=null;
 const dx=e.clientX-g.x;
 if(g.moved&&!cancelled){
  let delta=Math.round(-dx/gestureStep());
  if(delta===0&&Math.abs(dx)>24)delta=dx<0?1:-1;
  setFocus(g.origin+clamp(delta,-6,6));
 }else if(!cancelled&&ready()){
  const index=hitCard(e.clientX,e.clientY);chooseCard(index);
 }
 gestureOffset=0;dragging=false;
 try{if(stage.hasPointerCapture(e.pointerId))stage.releasePointerCapture(e.pointerId);}catch(_){}
}
stage.addEventListener('pointerup',e=>finishGesture(e));
stage.addEventListener('pointercancel',e=>finishGesture(e,true));
stage.addEventListener('lostpointercapture',()=>{if(gesture){gesture=null;gestureOffset=0;dragging=false;}});
stage.addEventListener('pointerleave',()=>{if(dragging)return;hoverX=hoverY=0;stage.style.setProperty('--pan-x','0px');stage.style.setProperty('--pan-y','0px');},{passive:true});
stage.tabIndex=0;stage.setAttribute('aria-label','3D 타로 셔플. 펼침 후 좌우 방향키로 이동하고 Enter로 선택하세요.');
stage.addEventListener('keydown',e=>{
 if(!ready())return;
 if(e.key==='ArrowRight'){e.preventDefault();setFocus(focusIndex+1);}
 if(e.key==='ArrowLeft'){e.preventDefault();setFocus(focusIndex-1);}
 if(e.key==='Enter'||e.key===' '){e.preventDefault();chooseCard(focusIndex);}
});
$('sceneToggle').addEventListener('click',()=>{paused=!paused;document.documentElement.dataset.sceneMotion=paused?'off':'on';$('sceneToggle').textContent=paused?'공간·조명 움직임 켜기':'공간·조명 움직임 끄기';$('sceneToggle').setAttribute('aria-pressed',String(!paused));if(paused){stage.style.setProperty('--pan-x','0px');stage.style.setProperty('--pan-y','0px');}});
function beginShuffle(){if(running)return;resetReveal();randomDeck();remote.src=SOURCE_ROOT+'assets/card-backs/back-0'+(1+Math.floor(Math.random()*8))+'.webp';clock=0;start=performance.now();running=true;focusIndex=3;gestureOffset=0;pickedIndex=-1;confirmedIndex=-1;gesture=null;dragging=false;stage.classList.remove('fan-ready');$('shuffle').disabled=true;$('shuffle').textContent='셔플 진행 중';$('state').textContent='3D 셔플 진행 중';$('phaseText').textContent='카드가 공중으로 떠오릅니다';}
$('shuffle').addEventListener('click',beginShuffle);
$('resultAgain').addEventListener('click',beginShuffle);
$('readingDropdown').addEventListener('click',()=>{
 const menu=$('readingOptions');menu.hidden=!menu.hidden;
 $('readingDropdown').setAttribute('aria-expanded',String(!menu.hidden));
});
$('readingOptions').querySelector('button').addEventListener('click',()=>{
 $('readingOptions').hidden=true;$('readingDropdown').setAttribute('aria-expanded','false');
});
let prevMobile=mobile;new ResizeObserver(()=>{const m=stage.clientWidth<650;if(m!==prevMobile){layout();prevMobile=m;}}).observe(stage);
document.documentElement.dataset.sceneMotion='on';
$('sceneLabel').textContent='LIVE 3D CARDS + CINEMATIC SCENE';
requestAnimationFrame(render);
})();
