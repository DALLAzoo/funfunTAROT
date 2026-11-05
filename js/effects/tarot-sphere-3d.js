/**
 * In-between Shift — Tarot Sphere / shuffle-only WebGL2 layer.
 * The existing DOM card deck, original Carousel and original reveal/reading UI
 * remain untouched. A single original GitHub card-back image supplies the
 * full-resolution WebGL texture for every face. No generated card graphics.
 *
 * The temporary WebGL canvas accepts drag/touch to spin; it is destroyed
 * before the original fanMotion is called. No external JS dependencies.
 */
const PI=Math.PI;
const clamp=(v,a,b)=>Math.min(b,Math.max(a,v));
const smooth=t=>{t=clamp(t,0,1);return t*t*(3-2*t);};
const mix=(a,b,t)=>a+(b-a)*t;
const M4=()=>new Float32Array([1,0,0,0, 0,1,0,0, 0,0,1,0, 0,0,0,1]);
function matMul(a,b){const m=new Float32Array(16);for(let c=0;c<4;c++)for(let r=0;r<4;r++)for(let k=0;k<4;k++)m[c*4+r]+=a[k*4+r]*b[c*4+k];return m;}
function matRotateX(t){const m=M4(),c=Math.cos(t),s=Math.sin(t);m[5]=c;m[6]=s;m[9]=-s;m[10]=c;return m;}
function matRotateY(t){const m=M4(),c=Math.cos(t),s=Math.sin(t);m[0]=c;m[2]=-s;m[8]=s;m[10]=c;return m;}
function matPerspective(fov,aspect,near,far){const m=new Float32Array(16),f=1/Math.tan(fov/2);m[0]=f/aspect;m[5]=f;m[10]=(far+near)/(near-far);m[11]=-1;m[14]=2*far*near/(near-far);return m;}
function normalize(p){const d=Math.hypot(...p)||1;return p.map(v=>v/d);}
function cross(a,b){return [a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];}
function basis(normal,pos,tilt){
 const n=normalize(normal),upHint=Math.abs(n[1])>.985?[0,0,1]:[0,1,0];
 let right=normalize(cross(upHint,n)),up=normalize(cross(n,right));
 if(tilt){const c=Math.cos(tilt),s=Math.sin(tilt),r=right;right=[r[0]*c+up[0]*s,r[1]*c+up[1]*s,r[2]*c+up[2]*s];up=[up[0]*c-r[0]*s,up[1]*c-r[1]*s,up[2]*c-r[2]*s];}
 return new Float32Array([right[0],right[1],right[2],0,up[0],up[1],up[2],0,n[0],n[1],n[2],0,pos[0],pos[1],pos[2],1]);
}
function backImageUrl(css){if(!css)return null;const s=String(css).trim(),match=s.match(/^url\(["']?(.+?)["']?\)$/);return match?.[1]||null;}
async function loadOriginalBack(url){if(!url)throw Error('Registered card back path missing');return await new Promise((resolve,reject)=>{const image=new Image();image.decoding='async';image.onload=()=>resolve(image);image.onerror=()=>reject(Error('Registered card back could not be loaded'));image.src=url;});}
function shader(gl,type,src){const x=gl.createShader(type);gl.shaderSource(x,src);gl.compileShader(x);if(!gl.getShaderParameter(x,gl.COMPILE_STATUS))throw Error(gl.getShaderInfoLog(x));return x;}
function createProgram(gl){
 const vs=`#version 300 es
 precision highp float;
 layout(location=0) in vec3 position;layout(location=1) in vec2 texcoord;layout(location=2) in vec3 normal;
 uniform mat4 model,view,projection;out vec2 uv;out vec3 nrm;out vec3 world;
 void main(){vec4 w=model*vec4(position,1.);uv=texcoord;nrm=normalize(mat3(model)*normal);world=w.xyz;gl_Position=projection*view*w;}`;
 const fs=`#version 300 es
 precision highp float;
 in vec2 uv;in vec3 nrm;in vec3 world;
 uniform sampler2D cardBack;uniform int material;uniform vec3 warmLight,coolLight;uniform float alpha;
 out vec4 frag;
 float roundedMask(vec2 p){vec2 q=abs(p-.5)-vec2(.445,.469);return length(max(q,vec2(0.)))-.053;}
 void main(){
   vec3 N=normalize(nrm),L1=normalize(warmLight-world),L2=normalize(coolLight-world);
   float diffuse1=max(dot(N,L1),0.),diffuse2=max(dot(N,L2),0.);
   if(material==1){
     if(roundedMask(uv)>0.)discard;
     vec3 base=texture(cardBack,uv).rgb;
     // High art fidelity: no blur overlay or strong color tint on printed art.
     float spec=pow(max(dot(reflect(-L1,N),vec3(0.,0.,1.)),0.),56.);
     vec3 light=base*(.91+.12*diffuse1+.035*diffuse2)+vec3(.77,.59,.33)*spec*.095;
     frag=vec4(light,alpha);
   }else{
     float ink=.62+.07*sin(world.y*120.);
     vec3 gold=vec3(.47,.36,.23)*ink*(.78+.32*diffuse1)+vec3(.24,.14,.05)*diffuse1;
     frag=vec4(gold,alpha);
   }
 }`;
 const p=gl.createProgram(),v=shader(gl,gl.VERTEX_SHADER,vs),f=shader(gl,gl.FRAGMENT_SHADER,fs);
 gl.attachShader(p,v);gl.attachShader(p,f);gl.linkProgram(p);gl.deleteShader(v);gl.deleteShader(f);
 if(!gl.getProgramParameter(p,gl.LINK_STATUS))throw Error(gl.getProgramInfoLog(p));return p;
}
function createCardMesh(gl){
 // World card ratio matches CONFIG.aspect=2128/1240; original size remains in DOM.
 const w=.90,h=w*2128/1240,thick=.032,arr=[];
 const v=(pos,uv,n)=>arr.push(...pos,...uv,...n);
 const quad=(a,b,c,d,n)=>{v(a,[0,0],n);v(b,[1,0],n);v(c,[1,1],n);v(a,[0,0],n);v(c,[1,1],n);v(d,[0,1],n);};
 quad([-w,-h,thick],[w,-h,thick],[w,h,thick],[-w,h,thick],[0,0,1]);
 quad([w,-h,-thick],[-w,-h,-thick],[-w,h,-thick],[w,h,-thick],[0,0,-1]);
 const frontCount=arr.length/8;
 quad([w,-h,thick],[w,-h,-thick],[w,h,-thick],[w,h,thick],[1,0,0]);
 quad([-w,-h,-thick],[-w,-h,thick],[-w,h,thick],[-w,h,-thick],[-1,0,0]);
 quad([-w,h,thick],[w,h,thick],[w,h,-thick],[-w,h,-thick],[0,1,0]);
 quad([-w,-h,-thick],[w,-h,-thick],[w,-h,thick],[-w,-h,thick],[0,-1,0]);
 const vao=gl.createVertexArray(),buffer=gl.createBuffer();gl.bindVertexArray(vao);gl.bindBuffer(gl.ARRAY_BUFFER,buffer);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(arr),gl.STATIC_DRAW);
 for(const [i,sz,offset] of [[0,3,0],[1,2,12],[2,3,20]]){gl.enableVertexAttribArray(i);gl.vertexAttribPointer(i,sz,gl.FLOAT,false,32,offset);}gl.bindVertexArray(null);
 return {vao,buffer,frontCount,count:arr.length/8};
}
function originalTexture(gl,image){
 const max=gl.getParameter(gl.MAX_TEXTURE_SIZE);
 if(image.naturalWidth>max||image.naturalHeight>max)throw Error('Original texture exceeds device GPU limit');
 const t=gl.createTexture();gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D,t);gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,true);
 gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,image);
 gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
 gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR_MIPMAP_LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);
 gl.generateMipmap(gl.TEXTURE_2D);
 const ext=gl.getExtension('EXT_texture_filter_anisotropic')||gl.getExtension('WEBKIT_EXT_texture_filter_anisotropic');
 if(ext)gl.texParameterf(gl.TEXTURE_2D,ext.TEXTURE_MAX_ANISOTROPY_EXT,Math.min(8,gl.getParameter(ext.MAX_TEXTURE_MAX_ANISOTROPY_EXT)));
 gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,false);return t;
}
function fibonacciCards(count){
 const golden=PI*(3-Math.sqrt(5));
 return Array.from({length:count},(_,i)=>{
   const y=1-2*(i+.5)/count,r=Math.sqrt(Math.max(0,1-y*y));
   const phase=i*golden+Math.sin(i*1.77)*.05; // controlled organic variation
   const normal=normalize([Math.cos(phase)*r,y,Math.sin(phase)*r]);
   return {normal,tilt:Math.sin(i*2.91)*.11};
 });
}
const waitFrame=()=>new Promise(resolve=>requestAnimationFrame(resolve));

/**
 * WebGL sphere, then original DOM stack. Returns false if WebGL is unavailable.
 * No card-selection, reveal, button, reading, result or CSS layout replacement.
 */
export async function runTarotSphereShuffle({stage,cards,phase,backUrl,finishPose,duration=8800}){
 if(!stage||!cards?.length||!window.WebGL2RenderingContext)return false;
 let canvas=null,gl=null,p=null,mesh=null,tex=null,raf=0,onResize=null,cleanupPointer=()=>{},contextLost=false;
 try{
   const artwork=await loadOriginalBack(backImageUrl(backUrl));
   canvas=document.createElement('canvas');canvas.className='tarot-sphere-webgl';canvas.setAttribute('aria-label','3D 카드 구체: 드래그하거나 손가락으로 돌리기');
   canvas.style.touchAction='none';
   gl=canvas.getContext('webgl2',{alpha:true,antialias:true,depth:true,premultipliedAlpha:false,powerPreference:'high-performance'});
   if(!gl)return false;
   p=createProgram(gl);mesh=createCardMesh(gl);tex=originalTexture(gl,artwork);
   stage.append(canvas);
   const uniforms={};for(const key of ['projection','view','model','cardBack','material','warmLight','coolLight','alpha'])uniforms[key]=gl.getUniformLocation(p,key);
   gl.useProgram(p);gl.uniform1i(uniforms.cardBack,0);
   gl.enable(gl.DEPTH_TEST);gl.depthFunc(gl.LEQUAL);gl.disable(gl.CULL_FACE);
   gl.enable(gl.BLEND);gl.blendFunc(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA);
   const points=fibonacciCards(cards.length),mobile=stage.clientWidth<600;
   const radius=mobile?2.90:3.55,eye=mobile?17.4:16.2;
   const view=M4();view[14]=-eye;
   let rotY=.4,rotX=-.11,velocityY=.00015,velocityX=0,dragCount=0;
   let active=null,changeEndAt=0,rendered=0,lastFrame=performance.now(),lastDraw=-Infinity;
   const pointerDown=e=>{if(e.button!==undefined&&e.button!==0)return;active={id:e.pointerId,x:e.clientX,y:e.clientY,t:performance.now()};velocityY=0;velocityX=0;try{canvas.setPointerCapture?.(e.pointerId);}catch(_){};};
   const pointerMove=e=>{if(!active||active.id!==e.pointerId)return;const dx=e.clientX-active.x,dy=e.clientY-active.y;const dt=Math.max(12,performance.now()-active.t);
     if(Math.abs(dx)+Math.abs(dy)>0){rotY+=dx*.007;rotX=clamp(rotX+dy*.0043,-1.12,1.12);velocityY=clamp(dx*.007/dt,-.012,.012);velocityX=clamp(dy*.0043/dt,-.007,.007);dragCount++;stage.dataset.sphereDragCount=String(dragCount);}
     active.x=e.clientX;active.y=e.clientY;active.t=performance.now();e.preventDefault();};
   const pointerUp=e=>{if(active?.id!==e.pointerId)return;active=null;try{canvas.releasePointerCapture?.(e.pointerId);}catch(_){}changeEndAt=Math.max(changeEndAt,performance.now()+1700);};
   canvas.addEventListener('pointerdown',pointerDown);canvas.addEventListener('pointermove',pointerMove);canvas.addEventListener('pointerup',pointerUp);canvas.addEventListener('pointercancel',pointerUp);
   cleanupPointer=()=>{canvas.removeEventListener('pointerdown',pointerDown);canvas.removeEventListener('pointermove',pointerMove);canvas.removeEventListener('pointerup',pointerUp);canvas.removeEventListener('pointercancel',pointerUp);};
   canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();contextLost=true;},{once:true});
   onResize=()=>{const box=canvas.getBoundingClientRect(),small=box.width<600,dpr=Math.min(devicePixelRatio||1,small?1.6:2.0);
     const w=Math.max(1,Math.round(box.width*dpr)),h=Math.max(1,Math.round(box.height*dpr));
     if(canvas.width!==w||canvas.height!==h){canvas.width=w;canvas.height=h;}gl.viewport(0,0,canvas.width,canvas.height);};
   onResize();window.addEventListener('resize',onResize,{passive:true});
   stage.classList.add('tarot-sphere-running');stage.dataset.sphereState='assembling';stage.dataset.sphereTexture='original';
   phase('charge');
   const start=performance.now(),span=Math.max(6500,duration),hardEnd=start+span+3700;
   let ended=false,lastPhase='charge';
   await new Promise((resolve,reject)=>{
     const tick=now=>{
       if(contextLost){reject(Error('WebGL context lost'));return;}
       const dt=Math.min(45,Math.max(1,now-lastFrame));lastFrame=now;
       const goal=start+span;
       let end=goal;
       if(active)end=Math.min(hardEnd,Math.max(goal,now+1100));
       else if(changeEndAt>now)end=Math.min(hardEnd,Math.max(goal,changeEndAt));
       // End stage begins only when the rotation interaction is over.
       const visibleEnd=Math.max(goal,end),remaining=visibleEnd-now;
       const elapsed=now-start,build=smooth(elapsed/1650);
       const ending=remaining<1250?smooth((1250-remaining)/1250):0;
       
       if(ending>0&&lastPhase!=='settle'){phase('settle');lastPhase='settle';stage.dataset.sphereState='settling';}
       else if(build>.98&&lastPhase==='charge'){phase('vortex');lastPhase='vortex';stage.dataset.sphereState='interactive';}
       if(!active){rotY+=velocityY*dt+dt*.000115*(1-ending);rotX=clamp(rotX+velocityX*dt,-1.12,1.12);velocityY*=Math.pow(.985,dt/16);velocityX*=Math.pow(.98,dt/16);}
       // A complete card sphere remains interactively rotatable until collapse.
       const growth=build*(1-ending),fade=1-smooth((ending-.63)/.37);
       const mGroup=matMul(matRotateY(rotY),matRotateX(rotX));
       if(now-lastDraw>=(mobile?25:16) || rendered===0 || ending>.97){lastDraw=now;
         gl.viewport(0,0,canvas.width,canvas.height);gl.clearColor(0,0,0,0);gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);
         gl.useProgram(p);gl.bindVertexArray(mesh.vao);gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D,tex);
         gl.uniformMatrix4fv(uniforms.projection,false,matPerspective((mobile?52:48)*PI/180,canvas.width/Math.max(1,canvas.height),.1,100));
         gl.uniformMatrix4fv(uniforms.view,false,view);
         gl.uniform3f(uniforms.warmLight,Math.sin(now*.00048)*4,4.5,8.5);
         gl.uniform3f(uniforms.coolLight,-3.5,-.9,4.2);
         gl.uniform1f(uniforms.alpha,fade);
         for(let i=0;i<cards.length;i++){
           const pt=points[i],pos=pt.normal.map(v=>v*radius*growth);
           const n=normalize(pt.normal.map((v,k)=>mix(k===2?1:0,v,build)));
           const cardMat=basis(n,pos,pt.tilt*growth);
           gl.uniformMatrix4fv(uniforms.model,false,matMul(mGroup,cardMat));
           gl.uniform1i(uniforms.material,1);gl.drawArrays(gl.TRIANGLES,0,mesh.frontCount);
           gl.uniform1i(uniforms.material,2);gl.drawArrays(gl.TRIANGLES,mesh.frontCount,mesh.count-mesh.frontCount);
         }
         rendered++;
         stage.dataset.sphereRenderedFrames=String(rendered);
       }
       if(remaining<=0){ended=true;resolve();return;}
       raf=requestAnimationFrame(tick);
     };
     raf=requestAnimationFrame(tick);
   });
   if(!ended)return false;
   cards.forEach(finishPose);
   canvas.classList.add('is-leaving');await waitFrame();
   stage.dataset.sphereState='complete';return true;
 }catch(e){console.warn('3D Tarot Sphere unavailable; original shuffle will run.',e);stage.dataset.sphereState='fallback';return false;
 }finally{
   if(raf)cancelAnimationFrame(raf);cleanupPointer();
   if(onResize)window.removeEventListener('resize',onResize);
   stage.classList.remove('tarot-sphere-running');
   if(canvas)canvas.remove();
   try{if(gl){if(tex)gl.deleteTexture(tex);if(mesh){gl.deleteBuffer(mesh.buffer);gl.deleteVertexArray(mesh.vao);}if(p)gl.deleteProgram(p);gl.getExtension('WEBGL_lose_context')?.loseContext();}}catch(_){}
 }
}
