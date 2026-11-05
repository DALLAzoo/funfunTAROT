(()=>{
/**
 * In-between Shift — popup diorama v2 — living miniature landscapes on three real card surfaces.
 * Independent transparent WebGL2 scene. Never changes a card DOM node,
 * text, button, card texture, card size, fan geometry or reveal timing.
 * Objects are real shaded triangle meshes, not images placed on a backdrop.
 */
const $=q=>document.querySelector(q);
const stage=$('#stage');
if(stage) init(stage);

function init(stage){
 const canvas=document.createElement('canvas');
 canvas.className='cardworld-canvas';
 canvas.setAttribute('aria-hidden','true');
 stage.append(canvas);
 const gl=canvas.getContext('webgl2',{alpha:true,antialias:true,depth:true,premultipliedAlpha:false,preserveDrawingBuffer:false,powerPreference:'high-performance'});
 if(!gl){canvas.remove();return;}
 const PI=Math.PI;
 const sin=Math.sin,cos=Math.cos,abs=Math.abs;
 const clamp=(v,a=0,b=1)=>Math.min(b,Math.max(a,v));
 const ease=t=>{t=clamp(t);return t*t*(3-2*t);};
 const v3=(x,y,z)=>[x,y,z];
 function unit(a){const l=Math.hypot(...a)||1;return a.map(v=>v/l);}
 function compile(type,src){const s=gl.createShader(type);gl.shaderSource(s,src);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw Error(gl.getShaderInfoLog(s));return s;}
 const vert=`#version 300 es
 precision highp float;
 layout(location=0) in vec3 aPosition;
 layout(location=1) in vec3 aNormal;
 layout(location=2) in vec4 iM0;
 layout(location=3) in vec4 iM1;
 layout(location=4) in vec4 iM2;
 layout(location=5) in vec4 iM3;
 layout(location=6) in vec3 iColor;
 layout(location=7) in float iAlpha;
 layout(location=8) in float iShine;
 uniform mat4 uMatrix;
 out vec3 vN;
 out vec3 vColor;
 out float vAlpha;
 out float vShine;
 void main(){mat4 m=mat4(iM0,iM1,iM2,iM3);
 vN=normalize(mat3(m)*aNormal);vColor=iColor;
 vAlpha=iAlpha;vShine=iShine;gl_Position=uMatrix*m*vec4(aPosition,1.0);}`;
 const frag=`#version 300 es
 precision highp float;
 in vec3 vN;
 in vec3 vColor;
 in float vAlpha;
 in float vShine;
 uniform vec3 uLight;
 out vec4 pixel;
 void main(){vec3 N=normalize(vN);float diff=max(dot(N,normalize(uLight)),0.0);
 float reflection=pow(max(dot(reflect(-normalize(uLight),N),vec3(0.,0.,1.)),0.0),24.);
 vec3 col=vColor*(0.52+diff*.58)+vColor*vShine*.30+vec3(1.,.84,.51)*reflection*vShine*.38;
 pixel=vec4(col,vAlpha);}`;
 let program;
 try{
  const v=compile(gl.VERTEX_SHADER,vert),f=compile(gl.FRAGMENT_SHADER,frag);
  program=gl.createProgram();gl.attachShader(program,v);gl.attachShader(program,f);gl.linkProgram(program);
  gl.deleteShader(v);gl.deleteShader(f);
  if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw Error(gl.getProgramInfoLog(program));
 }catch(e){console.warn('cardworld WebGL unavailable',e);canvas.remove();return;}
 gl.useProgram(program);
 const loc={matrix:gl.getUniformLocation(program,'uMatrix'),light:gl.getUniformLocation(program,'uLight')};
 gl.uniform3f(loc.light,-.30,.87,.55);
 const M=()=>new Float32Array([1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1]);
 const mul=(a,b)=>{const o=new Float32Array(16);for(let c=0;c<4;c++)for(let r=0;r<4;r++)for(let k=0;k<4;k++)o[c*4+r]+=a[k*4+r]*b[c*4+k];return o;};
 const translate=(x,y,z)=>{const m=M();m[12]=x;m[13]=y;m[14]=z;return m;};
 const scale=(x,y,z)=>{const m=M();m[0]=x;m[5]=y;m[10]=z;return m;};
 const rotX=a=>{const m=M(),c=cos(a),s=sin(a);m[5]=c;m[6]=s;m[9]=-s;m[10]=c;return m;};
 const rotY=a=>{const m=M(),c=cos(a),s=sin(a);m[0]=c;m[2]=-s;m[8]=s;m[10]=c;return m;};
 const rotZ=a=>{const m=M(),c=cos(a),s=sin(a);m[0]=c;m[1]=s;m[4]=-s;m[5]=c;return m;};
 function ortho(w,h){const m=M();m[0]=2/w;m[5]=2/h;m[10]=-.0015;return m;}
 let VP=M();
 function mesh(vertices){
  const vao=gl.createVertexArray(),buffer=gl.createBuffer(),instances=gl.createBuffer();
  gl.bindVertexArray(vao);
  gl.bindBuffer(gl.ARRAY_BUFFER,buffer);
  gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(vertices),gl.STATIC_DRAW);
  gl.enableVertexAttribArray(0);gl.vertexAttribPointer(0,3,gl.FLOAT,false,24,0);
  gl.enableVertexAttribArray(1);gl.vertexAttribPointer(1,3,gl.FLOAT,false,24,12);
  gl.bindBuffer(gl.ARRAY_BUFFER,instances);
  gl.bufferData(gl.ARRAY_BUFFER,21*4*512,gl.DYNAMIC_DRAW);
  for(let i=0;i<4;i++){gl.enableVertexAttribArray(2+i);gl.vertexAttribPointer(2+i,4,gl.FLOAT,false,84,i*16);gl.vertexAttribDivisor(2+i,1);}
  gl.enableVertexAttribArray(6);gl.vertexAttribPointer(6,3,gl.FLOAT,false,84,64);gl.vertexAttribDivisor(6,1);
  gl.enableVertexAttribArray(7);gl.vertexAttribPointer(7,1,gl.FLOAT,false,84,76);gl.vertexAttribDivisor(7,1);
  gl.enableVertexAttribArray(8);gl.vertexAttribPointer(8,1,gl.FLOAT,false,84,80);gl.vertexAttribDivisor(8,1);
  gl.bindVertexArray(null);
  return {vao,count:vertices.length/6,instances,data:[]};
 }
 function sphere(){const v=[];const lat=14,lon=20;const p=(t,r)=>[sin(t)*cos(r),cos(t),sin(t)*sin(r)];const tri=(a,b,c)=>{for(const d of [a,b,c])v.push(...d,...d);};for(let a=0;a<lat;a++)for(let b=0;b<lon;b++){const t=a*PI/lat,T=(a+1)*PI/lat,r=b*2*PI/lon,R=(b+1)*2*PI/lon,A=p(t,r),B=p(T,r),C=p(T,R),D=p(t,R);tri(A,B,C);tri(A,C,D);}return mesh(v);}
 function cylinder(top=1,bottom=1){const v=[],s=14;const pos=(r,y,a)=>[r*cos(a),y,r*sin(a)];for(let i=0;i<s;i++){const a=i*2*PI/s,b=(i+1)*2*PI/s,A=pos(bottom,-.5,a),B=pos(bottom,-.5,b),C=pos(top,.5,b),D=pos(top,.5,a);const n=a=>[cos(a),.15,sin(a)];for(const [p,q,nrm] of [[A,A,n(a)],[B,B,n(b)],[C,C,n(b)],[A,A,n(a)],[C,C,n(b)],[D,D,n(a)]])v.push(...p,...nrm);for(const p of [[0,.5,0],D,C])v.push(...p,0,1,0);for(const p of [[0,-.5,0],B,A])v.push(...p,0,-1,0);}return mesh(v);}
 function ring(){const v=[],s=48,r=.79;for(let i=0;i<s;i++){const a=i*2*PI/s,b=(i+1)*2*PI/s;const p=(theta,r)=>[r*cos(theta),0,r*sin(theta)];for(const q of [p(a,1),p(b,1),p(b,r),p(a,1),p(b,r),p(a,r)])v.push(...q,0,1,0);}return mesh(v);}
 function crescent(){const v=[],n=40;const r1=.72,r2=1;for(let i=0;i<n;i++){let a=(-.7+(i/n)*1.40)*PI,b=(-.7+((i+1)/n)*1.40)*PI;const p=(a,r,z)=>[cos(a)*r,sin(a)*r,z];for(const [a0,b0,c0,norm] of [[p(a,r1,0),p(a,r2,0),p(b,r2,0),[0,0,1]],[p(a,r1,0),p(b,r2,0),p(b,r1,0),[0,0,1]],[p(a,r1,-.22),p(b,r2,-.22),p(a,r2,-.22),[0,0,-1]],[p(a,r1,-.22),p(b,r1,-.22),p(b,r2,-.22),[0,0,-1]]])for(const q of [a0,b0,c0])v.push(...q,...norm);}return mesh(v);}
 function star(){const v=[],p=[0,0,1],r=.35;const tri=(a,b,c)=>{let n=unit([(b[1]-a[1])*(c[2]-a[2])-(b[2]-a[2])*(c[1]-a[1]),(b[2]-a[2])*(c[0]-a[0])-(b[0]-a[0])*(c[2]-a[2]),(b[0]-a[0])*(c[1]-a[1])-(b[1]-a[1])*(c[0]-a[0])]);for(const e of [a,b,c])v.push(...e,...n);};for(let i=0;i<8;i++){const a=PI/2+i*PI/4,b=a+PI/4,ra=i%2?r:1,rb=(i+1)%2?r:1;tri(p,[cos(a)*ra,sin(a)*ra,0],[cos(b)*rb,sin(b)*rb,0]);}return mesh(v);}
 const shapes={sphere:sphere(),cylinder:cylinder(),cone:cylinder(0.06,1),ring:ring(),crescent:crescent(),star:star()};
 const colors={grass:[.25,.43,.23],moss:[.20,.30,.19],grassLight:[.41,.59,.31],deep:[.12,.24,.16],wood:[.34,.23,.15],woodLight:[.54,.35,.19],leaf:[.13,.36,.24],leaf2:[.29,.53,.29],leaf3:[.49,.65,.32],pink:[.92,.49,.55],cream:[.98,.86,.63],white:[.98,.92,.81],gold:[1.,.78,.34],blue:[.12,.45,.62],water:[.23,.65,.75],stone:[.53,.55,.47],bunny:[.87,.81,.72],brown:[.61,.43,.29],deer:[.64,.35,.19],dark:[.13,.16,.13],lilac:[.66,.57,.84],light:[.99,.9,.59],waterDeep:[.075,.29,.33],waterFoam:[.65,.89,.88],leafDark:[.105,.27,.17],earth:[.28,.23,.16],blush:[.98,.63,.63],furLight:[.86,.68,.49]};
 const draw=(type,x,y,z,sx,sy,sz,color,params={})=>{
  const obj=shapes[type];if(!obj||sx<=0||sy<=0||sz<=0)return;
  let m=translate(x,y,z);
  if(params.rz)m=mul(m,rotZ(params.rz));
  if(params.ry)m=mul(m,rotY(params.ry));
  if(params.rx)m=mul(m,rotX(params.rx));
  m=mul(m,scale(sx,sy,sz));
  obj.data.push(...m,...color,params.alpha??1,params.shine??0);
 };
 function flush(){
  for(const obj of Object.values(shapes)){
   const count=obj.data.length/21;if(!count)continue;
   gl.bindVertexArray(obj.vao);gl.bindBuffer(gl.ARRAY_BUFFER,obj.instances);
   gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(obj.data),gl.DYNAMIC_DRAW);
   gl.drawArraysInstanced(gl.TRIANGLES,0,obj.count,count);
   obj.data=[];
  }
 }
 // Per-diorama placement. All parts stay in an actual 3-D local coordinate system.
 let bx=0,by=0,bz=0,zoom=1,groupTilt=0;
 function part(type,x,y,z,sx,sy,sz,c,p={}){
  const px=x*zoom,py=y*zoom,co=cos(groupTilt),si=sin(groupTilt);
  draw(type,bx+px*co-py*si,by+px*si+py*co,bz+z*zoom,
    sx*zoom,sy*zoom,sz*zoom,c,{...p,rz:(p.rz||0)+groupTilt});
 }
 // A branch is a tapered, tilted piece of real geometry, not a billboard.
 function branch(x1,y1,z1,x2,y2,z2,thickness,color){
  const dx=x2-x1,dy=y2-y1,dz=z2-z1,mag=Math.hypot(dx,dy,dz);
  if(mag<.1)return;
  // Orient cylinder local +Y along line via Z/X Euler.
  const rz=-Math.atan2(dx,dy),rx=Math.atan2(dz,Math.hypot(dx,dy));
  part('cylinder',(x1+x2)/2,(y1+y2)/2,(z1+z2)/2,thickness,mag,thickness,color,{rz,rx});
 }
 function foliage(x,y,z,w,h,d,t,g,col=colors.leaf2,seed=0){
  const sway=sin(t*.45+seed*.73)*1.1*g;
  part('sphere',x+sway,y,z,w*g,h*g,d*g,col,{shine:.02,rz:sin(seed)*.18});
  // Fine leaves around crown silhouette, arranged at several depths.
  for(let j=0;j<9;j++){
   const a=j*2.399+seed,zz=sin(a*1.7)*d*.67,xx=cos(a)*w*.80,yy=sin(a)*h*.74;
   part('sphere',x+xx+sway,y+yy,z+zz,(2.7+(j%3))*g,(4.3+j%3)*g,1.65*g,
     j%3===0?colors.leaf3:j%3===1?col:colors.leaf,{rz:a*.27,ry:a*.13});
  }
 }
 function grass(t,g){
  for(let i=0;i<32;i++){
   const a=i*2.39996,r=14+(i%6)*5.9,x=cos(a)*r,z=sin(a)*r*.66;
   const h=(5+(i*11)%12)*g;
   const sway=sin(t*.95+i*1.8)*.15;
   part('cone',x,h*.48,z,1.0,h,1.1,i%4?colors.grassLight:colors.leaf2,{rz:sway});
   if(i%4===0)part('cone',x+2,h*.36,z+2,.7,h*.8,.8,colors.grass,{rz:-.21+sway});
  }
 }
 function dais(t,g,style='forest'){
  // Thin earthen cross-section looks rooted in the card instead of a floating plate.
  const c=style==='water'?colors.moss:style==='sky'?colors.deep:colors.earth;
  part('sphere',0,-6*g,0,53*g,6*g,29*g,c);
  part('sphere',0,-3*g,0,52*g,3.4*g,28*g,colors.earth);
  part('sphere',0,-.5*g,0,51.5*g,2*g,28*g,style==='sky'?colors.leafDark:colors.moss);
  // Soil and roots connect the miniature to the card surface, not to the background.
  for(let i=0;i<7;i++){
   const a=i*2.399,x=cos(a)*37,z=sin(a)*18;
   part('cone',x,-7*g,z,2*g,12*g,2*g,colors.wood,{rz:sin(a)*.23});
  }
  grass(t,g);
 }
 function tree(x,z,h,t,g,leafVariant=0){
  const s=ease(g),H=h*s,drift=sin(t*.6+x*.16)*.025;
  if(!s)return;
  const trunk=[x,-.5,z],joint=[x+2,H*.51,z+1],top=[x+4+sin(t*.5+x)*1.2,H*.93,z];
  branch(...trunk,...joint,3.8*s,colors.wood);
  branch(...joint,...top,2.6*s,colors.woodLight);
  // Branches are tapered natural structures, foliage is multi-lobed.
  for(let j=0;j<5;j++){
   const a=(j*2.4)+(leafVariant*.6),yy=H*(.58+(j%3)*.12);
   const ex=x+cos(a)*(12+(j%2)*4)*s,ez=z+sin(a)*10*s;
   branch(x+2,yy*.79,z,ex,yy+5*s,ez,1.6*s,colors.wood);
   foliage(ex,yy+7*s,ez,6.8*s,6.7*s,5.0*s,t,s,
      (j+leafVariant)%3===0?colors.leaf3:j%3===1?colors.leaf2:colors.leaf,j+leafVariant*6);
  }
  foliage(top[0],H*.92,top[2],11*s,11*s,9*s,t,s,
    leafVariant?colors.leaf3:colors.leaf2,leafVariant+8);
 }
 function flower(x,z,t,g,c=colors.pink,delay=0){
  const s=ease((g-delay)/(1-delay));if(!s)return;
  const height=11+(abs(x)%8),sw=sin(t*.92+x*.2)*1.25;
  branch(x,0,z,x+sw,height*s,z+.5,1*s,colors.leaf2);
  for(let l=0;l<2;l++){
   const yy=height*s*(.38+l*.19),side=l%2?1:-1;
   part('sphere',x+sw*.5+side*4,yy,z+2,4.8*s,1.7*s,1.2*s,colors.leaf3,{rz:side*.48});
  }
  const bloom=ease((g-delay-.13)/.64);if(!bloom)return;
  for(let i=0;i<6;i++){
   const a=i*PI/3;
   part('sphere',x+sw+cos(a)*3.1*bloom,height*s+sin(a)*3.6*bloom,z+1.5,
    3.0*bloom,4.3*bloom,1.7*bloom,c,{rz:a-PI/2,shine:.07});
  }
  part('sphere',x+sw,height*s,z+2,2.7*bloom,2.7*bloom,2.7*bloom,colors.gold,{shine:.3});
 }
 function bunny(t,g){
  const s=ease((g-.52)/.38);if(!s)return;
  const jump=Math.pow(Math.max(0,sin(t*1.4+.2)),12)*4.6*s,lean=.10*sin(t*1.4);
  const x=22,y=10+jump,z=7;
  part('sphere',x,y,z,11.5*s,7.3*s,6.4*s,colors.bunny,{rz:lean});
  part('sphere',x-8,y+5.8*s,z+1,6.4*s,6.1*s,5.8*s,colors.bunny);
  // Two soft ears have separate movement and pink inner material.
  for(let e=0;e<2;e++){
   const ex=x-10+e*6,wobble=sin(t*.5+e)*.12;
   part('sphere',ex,y+16*s,z-2,2.15*s,10.8*s,2.7*s,colors.bunny,{rz:(e?-.16:.16)+wobble});
   part('sphere',ex-.05,y+16.6*s,z+0.5,1.08*s,7.6*s,1.1*s,colors.blush,{rz:(e?-.16:.16)+wobble});
  }
  part('sphere',x+11,y+1,z+1,5*s,5*s,5*s,colors.white);
  for(const side of [-1,1])part('sphere',x+(side===1?7:-6),y-5.5*s,z+side*3,5*s,2.0*s,3*s,colors.bunny);
  part('sphere',x-11,y+6.2*s,z+5.9*s,1.25*s,1.25*s,1.25*s,colors.dark);
  part('sphere',x-14,y+2.8*s,z+5.1*s,1.0*s,.75*s,1.0*s,colors.blush);
 }
 function deer(t,g){
  const s=ease((g-.53)/.38);if(!s)return;
  const x=22,z=5,dip=.5+.5*sin(t*.75),headDrop=dip*9;
  // Distinct slimmer neck, spotted back, tiny hoofs, relaxed drinking pose.
  part('sphere',x,24*s,z,15.7*s,8.8*s,6.8*s,colors.deer,{rz:-.05});
  part('sphere',x+4,17*s,z+3,12*s,3.5*s,4.9*s,colors.furLight);
  for(const dx of [-9,9])for(const dz of [-4.5,4.5]){
   const bend=(dx>0?1:-1)*sin(t*.24)*.7;
   branch(x+dx,19*s,z+dz,x+dx+bend,2*s,z+dz+.5,1.75*s,colors.woodLight);
   part('sphere',x+dx+bend,1.4*s,z+dz+.7,2.4*s,1.7*s,2.6*s,colors.dark);
  }
  const nx=x-13,ny=25*s-headDrop*.20;
  branch(x-10,27*s,z-1,nx-5,35*s-headDrop, z,4.0*s,colors.deer);
  part('sphere',nx-9,38*s-headDrop,z+1,8.0*s,4.4*s,4.2*s,colors.deer,{rz:-.25});
  part('sphere',nx-14,35*s-headDrop,z+3,5*s,2.4*s,3.3*s,colors.furLight);
  for(const sign of [-1,1]){
   part('sphere',nx-8+sign*3.7,43*s-headDrop,z-1.1,3.7*s,2.9*s,2.2*s,colors.deer,{rz:sign*.55});
   part('sphere',nx-8+sign*3.7,43*s-headDrop,z+0.8,2.1*s,1.5*s,.7*s,colors.blush,{rz:sign*.55});
  }
  part('sphere',nx-11,39*s-headDrop,z+4.0,1.0*s,1.0*s,1.1*s,colors.dark);
  part('sphere',nx-18,34*s-headDrop,z+5.4,1.1*s,.9*s,.9*s,colors.dark);
  part('sphere',x+16,27*s,z-3,3*s,3*s,3*s,colors.furLight);
  for(let i=0;i<9;i++){
   const xx=x-10+(i%5)*4.2,zz=z+(i%2?3.7:5.1);
   part('sphere',xx,30.6*s+(i%3)*.7,zz,1.5*s,1.2*s,.8*s,colors.cream);
  }
 }
 function pond(t,g){
  const s=ease((g-.14)/.48);if(!s)return;
  part('sphere',-13,3*s,8,31*s,4.1*s,20*s,colors.stone);
  part('sphere',-13,6*s,10,30*s,3.0*s,19*s,colors.waterDeep,{shine:.9});
  part('sphere',-13,9*s,10,27*s,1.5*s,17*s,colors.water,{alpha:.91,shine:1});
  for(let j=0;j<3;j++){
   const r=.5+j*.26+Math.sin(t*1.5+j*.9)*.025;
   part('ring',-13,11*s+j*.12,10,28*s*r,.30*s,18*s*r,j===0?colors.waterFoam:colors.water,{alpha:.27+j*.08,shine:.8});
  }
  for(let i=0;i<13;i++){
   const a=i*2.399,rx=30*cos(a),rz=18*sin(a);
   part('sphere',-13+rx,7.8*s,10+rz,2.6*s+(i%3)*.75*s,2.1*s,2.6*s, i%4===0?colors.moss:colors.stone);
  }
 }
 function leftWorld(t,g){
  dais(t,g);
  tree(-25,-10,57,t,ease((g-.06)/.70));
  tree(11,-18,39,t,ease((g-.18)/.72),1);
  flower(-39,13,t,g,colors.pink,.13);
  flower(-19,22,t,g,colors.lilac,.20);
  flower(7,23,t,g,colors.cream,.31);
  flower(33,8,t,g,colors.pink,.34);
  flower(-2,-5,t,g,colors.blush,.26);
  bunny(t,g);
 }
 function centerWorld(t,g){
  dais(t,g,'water');pond(t,g);
  tree(-42,-16,44,t,ease((g-.09)/.62),1);
  flower(-40,17,t,g,colors.pink,.15);
  flower(-30,20,t,g,colors.cream,.21);
  flower(12,24,t,g,colors.pink,.18);
  deer(t,g);
 }
 function rightWorld(t,g){
  dais(t,g,'sky');
  for(let i=0;i<6;i++)flower(-40+i*16,i%2?14:21,t,g,i%2?colors.lilac:colors.cream,.12+i*.06);
  const s=ease((g-.16)/.72),cycle=sin(t*.27);
  const sy=57+9*cycle,my=66-8*cycle;
  part('sphere',-17,sy*s,-3,10*s,10*s,6*s,colors.gold,{shine:1});
  for(let i=0;i<10;i++){
   const a=i*2*PI/10+t*.09;
   part('cone',-17+cos(a)*16*s,sy*s+sin(a)*16*s,-4,1.2*s,6*s,1.0*s,colors.gold,{rz:a-PI/2,shine:.8});
  }
  part('crescent',21,my*s,-5,12*s,12*s,4*s,colors.cream,{rz:-.2+sin(t*.17)*.09,shine:.67});
  for(let i=0;i<10;i++){
   const a=i*2.4,r=25+(i%3)*12,xx=sin(a)*r,yy=45+cos(a)*23;
   const pulse=.72+.28*sin(t*1.2+i*1.7);
   part('star',xx,yy*s,-4+i%3,1.8*s*pulse,1.8*s*pulse,1.8*s*pulse,i%2?colors.gold:colors.white,{shine:.74});
  }
 }
 let active=false,epoch=0,lastFrame=0,ticket=0;
 let anchors=null;
 const frames=(now)=>{
  ticket=0;
  if(!active)return;
  const main=$('#tarotApp');
  if(!stage.classList.contains('selection-stage')||main?.hidden){stop();return;}
  const center=stage.querySelector('.tarot-card.is-center.selectable');
  const visible=[...stage.querySelectorAll('.tarot-card.selectable')];
  if(!center||visible.length<3){stop();return;}
  // Budget 30-40fps for the decoration without slowing selection gestures.
  if(now-lastFrame<52){ticket=requestAnimationFrame(frames);return;}
  lastFrame=now;
  const b=stage.getBoundingClientRect();
  const dpr=Math.min(devicePixelRatio||1,innerWidth<650?1.15:1.5);
  const w=Math.floor(Math.max(1,b.width*dpr)),h=Math.floor(Math.max(1,b.height*dpr));
  if(canvas.width!==w||canvas.height!==h){canvas.width=w;canvas.height=h;gl.viewport(0,0,w,h);}
  const cr=center.getBoundingClientRect();const cx=cr.left+cr.width/2;
  const left=visible.filter(c=>{const r=c.getBoundingClientRect();return r.left+r.width/2<cx-8;}).sort((a,b)=>{const ra=a.getBoundingClientRect(),rb=b.getBoundingClientRect();return rb.left+rb.width/2-(ra.left+ra.width/2);})[0];
  const right=visible.filter(c=>{const r=c.getBoundingClientRect();return r.left+r.width/2>cx+8;}).sort((a,b)=>{const ra=a.getBoundingClientRect(),rb=b.getBoundingClientRect();return ra.left+ra.width/2-(rb.left+rb.width/2);})[0];
  if(!left||!right){ticket=requestAnimationFrame(frames);return;}
  gl.enable(gl.DEPTH_TEST);gl.depthFunc(gl.LEQUAL);gl.enable(gl.BLEND);gl.blendFunc(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA);
  gl.clearColor(0,0,0,0);gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);
  // Orthographic studio camera angled down onto three-dimensional objects.
  VP=mul(ortho(b.width,b.height),rotX(-.43));gl.uniformMatrix4fv(loc.matrix,false,VP);
  const t=(now-epoch)/1000,g=ease(t/2.65),mobile=b.width<650;
  const targets=[left,center,right];
  if(!anchors)anchors=[null,null,null];
  targets.forEach((card,j)=>{
   const r=card.getBoundingClientRect();
   const x=r.left+r.width/2-b.left-b.width/2;
   const top=r.top-b.top, y=b.height/2-(top+r.height*(j===1?.32:.35));
   const target={x,y:y/Math.cos(.43)};
   const old=anchors[j];
   anchors[j]=old?{x:old.x+(target.x-old.x)*.22,y:old.y+(target.y-old.y)*.22}:target;
   bx=anchors[j].x;by=anchors[j].y;bz=0;
   const angle=card.style.transform.match(/rotateZ\((-?[0-9.]+)deg\)/);
   groupTilt=angle?Number(angle[1])*PI/180:0;
   zoom=mobile?1.00:1.45;
   // Slight lift and illumination for the user's actual selected card.
   const selected=card.classList.contains('is-picked');
   const grow=ease((t-(j===1?.12:j===0?.32:.48))/2.0);
   if(grow<=0)return;
   if(selected){part('sphere',0,-7,0,62*grow,4*grow,38*grow,colors.gold,{alpha:.30,shine:.75});}
   if(j===0)leftWorld(t,grow);
   if(j===1)centerWorld(t,grow);
   if(j===2)rightWorld(t,grow);
  });
  flush();
  // Attributes for QA: no new visible page text.
  canvas.dataset.world='active';
  canvas.dataset.objects='left-center-right';canvas.dataset.version='v2';
  ticket=requestAnimationFrame(frames);
 };
 function start(){if(active)return;active=true;epoch=performance.now();lastFrame=0;anchors=null;canvas.classList.add('is-active');ticket=requestAnimationFrame(frames);}
 function stop(){if(!active)return;active=false;cancelAnimationFrame(ticket);canvas.classList.remove('is-active');canvas.dataset.world='inactive';anchors=null;gl.clearColor(0,0,0,0);gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);}
 // Existing fanMotion sets .selectable only after the fan is ready, so we do
 // not need to replace shuffle-flow, Carousel, choice handlers or result UI.
 setInterval(()=>{
  const main=$('#tarotApp');
  const ready=stage.classList.contains('selection-stage')&&!!stage.querySelector('.tarot-card.is-center.selectable')&&!main?.hidden;
  if(ready&&!active)start();else if(!ready&&active)stop();
 },180);
 document.addEventListener('visibilitychange',()=>{if(document.hidden)stop();});
}

})();
