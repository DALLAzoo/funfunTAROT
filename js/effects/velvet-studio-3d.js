/**
 * In-between Shift | Velvet Studio real WebGL2 card shuffle.
 * Single-purpose renderer. It owns ONLY the temporary shuffle canvas.
 * It never creates clickable cards, reading text or replacement buttons.
 * After rendering it restores the original DOM deck and leaves the existing
 * fanMotion, Carousel, chooseFlow and card sizing in complete control.
 */
const PI=Math.PI;
const smooth=t=>{t=Math.max(0,Math.min(1,t));return t*t*(3-2*t);};
const lerp=(a,b,t)=>a+(b-a)*t;
const hash=a=>Math.sin(a*127.1+39.3)*43758.5453%1;
const identity=()=>new Float32Array([1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1]);
function multiply(a,b){const m=new Float32Array(16);for(let c=0;c<4;c++)for(let r=0;r<4;r++)for(let k=0;k<4;k++)m[c*4+r]+=a[k*4+r]*b[c*4+k];return m;}
function translate(x,y,z){const a=identity();a[12]=x;a[13]=y;a[14]=z;return a;}
function rotateX(t){const a=identity(),c=Math.cos(t),s=Math.sin(t);a[5]=c;a[6]=s;a[9]=-s;a[10]=c;return a;}
function rotateY(t){const a=identity(),c=Math.cos(t),s=Math.sin(t);a[0]=c;a[2]=-s;a[8]=s;a[10]=c;return a;}
function rotateZ(t){const a=identity(),c=Math.cos(t),s=Math.sin(t);a[0]=c;a[1]=s;a[4]=-s;a[5]=c;return a;}
function perspective(fov,aspect,near,far){const a=new Float32Array(16),f=1/Math.tan(fov/2);a[0]=f/aspect;a[5]=f;a[10]=(far+near)/(near-far);a[11]=-1;a[14]=2*far*near/(near-far);return a;}
function camera(distance){const a=identity();a[14]=-distance;return a;}
function pose(x=0,y=0,z=0,rz=0,ry=0,rx=0){return {x,y,z,rz,ry,rx};}
function interpolate(a,b,t){return pose(lerp(a.x,b.x,t),lerp(a.y,b.y,t),lerp(a.z,b.z,t),lerp(a.rz,b.rz,t),lerp(a.ry,b.ry,t),lerp(a.rx,b.rx,t));}
function backImageUrl(input){if(!input)return null;const m=String(input).match(/url\(\s*['"]?([^'")]+)['"]?\s*\)/);return m?.[1]||null;}
async function getArtwork(url){if(!url)throw Error('No original card back configured');const image=new Image();image.decoding='async';image.src=url;await new Promise((resolve,reject)=>{if(image.complete&&image.naturalWidth){resolve();return;}image.onload=resolve;image.onerror=()=>reject(Error('Original card back was not loaded'));});if(image.decode)await image.decode().catch(()=>{});return image;}
function compile(gl,type,src){const sh=gl.createShader(type);gl.shaderSource(sh,src);gl.compileShader(sh);if(!gl.getShaderParameter(sh,gl.COMPILE_STATUS))throw Error(gl.getShaderInfoLog(sh));return sh;}
function program(gl){
 const vertex=`#version 300 es
 precision highp float;
 layout(location=0) in vec3 pos;
 layout(location=1) in vec2 uv;
 layout(location=2) in vec3 nor;
 uniform mat4 projection,view,model;
 out vec2 vUV;out vec3 vN;out vec3 vP;
 void main(){vec4 w=model*vec4(pos,1.);vP=w.xyz;vUV=uv;vN=normalize(mat3(model)*nor);gl_Position=projection*view*w;}`;
 const fragment=`#version 300 es
 precision highp float;
 in vec2 vUV;in vec3 vN;in vec3 vP;
 uniform sampler2D artwork;
 uniform int kind;
 uniform float time,opacity;
 uniform vec3 light;
 out vec4 color;
 float cornerMask(vec2 p){vec2 q=abs(p-.5)-vec2(.442,.466);return length(max(q,vec2(0.)))-.057;}
 void main(){
  if(kind==1){
    if(cornerMask(vUV)>.0)discard;
    vec3 base=texture(artwork,vUV).rgb;
    vec3 N=normalize(vN),L=normalize(light-vP),V=vec3(0.,0.,1.);
    float direct=max(dot(N,L),0.);
    float sheen=pow(max(dot(reflect(-L,N),V),0.),36.);
    vec3 material=base*(.85+.20*direct)+vec3(.8,.62,.42)*sheen*.14;
    color=vec4(material,opacity);
  }else{
    vec3 N=normalize(vN),L=normalize(light-vP);
    float lit=max(dot(N,L),0.);
    float edgePaper=.62+.10*sin(vP.y*140.);
    color=vec4(vec3(.44,.33,.24)*edgePaper*(.62+.48*lit)+vec3(.26,.18,.09)*pow(lit,12.),opacity);
  }
 }`;
 const p=gl.createProgram(),v=compile(gl,gl.VERTEX_SHADER,vertex),f=compile(gl,gl.FRAGMENT_SHADER,fragment);
 gl.attachShader(p,v);gl.attachShader(p,f);gl.linkProgram(p);gl.deleteShader(v);gl.deleteShader(f);
 if(!gl.getProgramParameter(p,gl.LINK_STATUS))throw Error(gl.getProgramInfoLog(p));return p;
}
function geometry(gl){
 const w=.9,h=.9*2128/1240,d=.037,v=[];
 const add=(p,uv,n)=>v.push(...p,...uv,...n);
 const quad=(a,b,c,e,normal,ua=[0,0],ub=[1,0],uc=[1,1],ud=[0,1])=>{add(a,ua,normal);add(b,ub,normal);add(c,uc,normal);add(a,ua,normal);add(c,uc,normal);add(e,ud,normal);};
 // Two textured faces; during shuffle BOTH are original card-back artwork.
 quad([-w,-h,d],[w,-h,d],[w,h,d],[-w,h,d],[0,0,1]);
 quad([w,-h,-d],[-w,-h,-d],[-w,h,-d],[w,h,-d],[0,0,-1],[0,0],[1,0],[1,1],[0,1]);
 const faceCount=v.length/8;
 // Four thin paper-and-gilded edges.
 quad([w,-h,d],[w,-h,-d],[w,h,-d],[w,h,d],[1,0,0]);
 quad([-w,-h,-d],[-w,-h,d],[-w,h,d],[-w,h,-d],[-1,0,0]);
 quad([-w,h,d],[w,h,d],[w,h,-d],[-w,h,-d],[0,1,0]);
 quad([-w,-h,-d],[w,-h,-d],[w,-h,d],[-w,-h,d],[0,-1,0]);
 const vao=gl.createVertexArray(),buffer=gl.createBuffer();gl.bindVertexArray(vao);gl.bindBuffer(gl.ARRAY_BUFFER,buffer);
 gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(v),gl.STATIC_DRAW);
 for(const [i,n,offset] of [[0,3,0],[1,2,12],[2,3,20]]){gl.enableVertexAttribArray(i);gl.vertexAttribPointer(i,n,gl.FLOAT,false,32,offset);}
 gl.bindVertexArray(null);return {vao,buffer,faceCount,count:v.length/8};
}
function texture(gl,image){const t=gl.createTexture();gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D,t);
 gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,true);
 gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,image);
 gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);
 gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
 gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR_MIPMAP_LINEAR);
 gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);
 gl.generateMipmap(gl.TEXTURE_2D);gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,false);return t;
}
function hero(j,n){const m=n===3,c=j-(n-1)/2,x=c*(m?1.64:1.87);
 const ys=m?[-.20,.42,-.15]:[-.32,.14,.39,.07,-.32];
 const zs=m?[.68,1.05,.68]:[.62,.84,1.1,.86,.62];
 return pose(x,ys[j],zs[j],c*(m?.07:.09),-c*.09,.04);
}
function tucked(i,mobile){const s=i%2?-1:1,k=Math.floor(i/2);return pose(s*(mobile?1.44:2.64)+s*k*.003,-2.28+k*.007,-1.25-k*.07,s*.05,s*.08,0);}
function mate(j,n){if(n===3)return j===0?2:j===2?0:-1;return j===0?1:j===1?0:j===3?4:j===4?3:-1;}
function flying(j,n,t){const start=hero(j,n),other=mate(j,n);if(other<0)return {...start,y:start.y-.25*Math.sin(PI*t),ry:.08*Math.sin(2*PI*t)};
 const end=hero(other,n),pass=Math.sin(PI*t),upper=j<other;
 return {x:lerp(start.x,end.x,t),y:lerp(start.y,end.y,t)+pass*(upper?.87:-.87),
 z:lerp(start.z,end.z,t)+pass*(upper?1.32:-1.13),rz:lerp(start.rz,end.rz,t)+pass*(upper?-.13:.12),
 ry:lerp(start.ry,end.ry,t)+pass*(upper?.19:-.19),rx:.04+pass*(upper?.12:.16)};
}
function flightPose(i,j,geo,t){const {n,mobile}=geo;
 if(j<0){const base=tucked(i,mobile);const drift=Math.sin(t*PI)*.12;return pose(base.x+Math.sign(base.x)*drift,base.y+drift,base.z,base.rz,base.ry,0);}
 const a=smooth(Math.min(1,t/.17));let first=interpolate(pose(0,0,-.08-i*.008,0,0,0),hero(j,n),a);
 if(t>.17 && t<.77){const q=smooth((t-.17)/.6);first=flying(j,n,q);}
 else if(t>=.77){first=flying(j,n,1);}
 const settle=smooth((t-.77)/.23),stack=pose(0,-.11,0+(i%4)*.002,0,0,0);
 return interpolate(first,stack,settle);
}
const sleep=ms=>new Promise(r=>setTimeout(r,ms));

/** Resolves true only when full 3D shuffle and original-DOM handoff succeed.
 * Returns false on unavailable WebGL or missing original card image.
 */
export async function runVelvet3DShuffle({stage,cards,phase,backUrl,sizePx,duration,finishPose}) {
 if(!cards?.length||!stage||!window.WebGL2RenderingContext)return false;
 let canvas=null,gl=null,p=null,g=null,tex=null,raf=0,resize=null,visible=false;
 try {
  const artwork=await getArtwork(backImageUrl(backUrl));
  // Keep image full resolution: original texture pixels are uploaded unchanged.
  canvas=document.createElement('canvas');canvas.className='velvet-studio-webgl';canvas.setAttribute('aria-hidden','true');
  gl=canvas.getContext('webgl2',{alpha:true,antialias:true,depth:true,premultipliedAlpha:false,powerPreference:'high-performance'});
  if(!gl)return false;
  p=program(gl);g=geometry(gl);tex=texture(gl,artwork);
  stage.append(canvas);
  const uniforms={};for(const key of ['projection','view','model','artwork','kind','time','opacity','light'])uniforms[key]=gl.getUniformLocation(p,key);
  gl.useProgram(p);gl.uniform1i(uniforms.artwork,0);
  gl.enable(gl.DEPTH_TEST);gl.depthFunc(gl.LEQUAL);gl.disable(gl.CULL_FACE);
  const mobile=stage.clientWidth<600,n=mobile?3:5;
  const indices=Array.from({length:n},(_,j)=>Math.floor((j+.5)*cards.length/n));
  const heroIndex=new Map(indices.map((id,j)=>[id,j]));
  const geo={n,mobile};
  const eyeZ=1.0+(1.8*stage.clientHeight)/(2*Math.tan(48*PI/360)*sizePx);
  const start=performance.now(),total=Math.max(2600,duration||4600);
  let phaseSet=false,settleSet=false,progress=0,previousDraw=-Infinity;
  resize=()=>{const b=canvas.getBoundingClientRect(),dpr=Math.min(devicePixelRatio||1,mobile?1.0:1.25);
    canvas.width=Math.round(b.width*dpr);canvas.height=Math.round(b.height*dpr);gl.viewport(0,0,canvas.width,canvas.height);};
  resize();window.addEventListener('resize',resize,{passive:true});
  stage.classList.add('velvet-3d-running');stage.dataset.velvet3d='running';visible=true;
  phase('charge');
  const tick=now=>{
   progress=Math.min(1,(now-start)/total);
   // Mobile GPUs render fewer frames without slowing the elapsed animation.
   if(progress<1&&now-previousDraw<(mobile?30:19)){raf=requestAnimationFrame(tick);return;}
   previousDraw=now;
   if(!phaseSet&&progress>.17){phase('vortex');phaseSet=true;}
   if(!settleSet&&progress>.83){phase('settle');settleSet=true;}
   gl.viewport(0,0,canvas.width,canvas.height);gl.clearColor(0,0,0,0);gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);
   gl.useProgram(p);gl.bindVertexArray(g.vao);gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D,tex);
   gl.uniformMatrix4fv(uniforms.projection,false,perspective(48*PI/180,canvas.width/Math.max(1,canvas.height),.1,120));
   gl.uniformMatrix4fv(uniforms.view,false,camera(eyeZ));
   gl.uniform3f(uniforms.light,-1.5+Math.sin(now*.0006)*.3,3.8,eyeZ*.64);
   gl.uniform1f(uniforms.time,now*.001);
   // Featured cards remain at 100% native card width: no mini-card scaling.
   const q=progress<.88?progress/.88:1,fade=1-smooth((progress-.91)/.09);
   for(let i=0;i<cards.length;i++){
     const j=heroIndex.has(i)?heroIndex.get(i):-1;
     const st=flightPose(i,j,geo,q),front=j>=0;
     const matrix=multiply(translate(st.x,st.y,st.z),multiply(rotateY(st.ry),multiply(rotateX(st.rx),rotateZ(st.rz))));
     gl.uniformMatrix4fv(uniforms.model,false,matrix);
     gl.uniform1f(uniforms.opacity,(front?1:.56)*fade);
     gl.uniform1i(uniforms.kind,1);gl.drawArrays(gl.TRIANGLES,0,g.faceCount);
     gl.uniform1i(uniforms.kind,2);gl.drawArrays(gl.TRIANGLES,g.faceCount,g.count-g.faceCount);
   }
   if(progress<1)raf=requestAnimationFrame(tick);
  };
  raf=requestAnimationFrame(tick);
  // Wait for the real 3D motion, then return to the original card DOM stack.
  await sleep(total+25);
  cancelAnimationFrame(raf);raf=0;
  cards.forEach(finishPose);
  canvas.classList.add('is-leaving');
  await sleep(210);
  stage.classList.remove('velvet-3d-running');stage.dataset.velvet3d='complete';
  return true;
 } catch(error) {
  console.warn('Velvet 3D shuffle unavailable; original shuffle will be used.',error);
  stage.dataset.velvet3d='fallback';return false;
 } finally {
  if(raf)cancelAnimationFrame(raf);
  if(resize)window.removeEventListener('resize',resize);
  stage.classList.remove('velvet-3d-running');
  if(canvas)canvas.remove();
  try{if(gl){if(tex)gl.deleteTexture(tex);if(g){gl.deleteBuffer(g.buffer);gl.deleteVertexArray(g.vao);}if(p)gl.deleteProgram(p);gl.getExtension('WEBGL_lose_context')?.loseContext();}}catch(_){}
 }
}
