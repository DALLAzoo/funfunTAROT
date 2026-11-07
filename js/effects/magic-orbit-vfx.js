/* In-between Shift — transient astral orbit VFX.
   Pure canvas overlay, synchronized to the existing seven-card WAAPI clock.
   No card faces, selection controls or images are changed. */
const clamp=t=>Math.max(0,Math.min(1,t));
const ease=t=>{t=clamp(t);return t*t*(3-2*t);};
const envelope=(t,a,b,c,d)=>ease((t-a)/(b-a))*(1-ease((t-c)/(d-c)));
const TAU=Math.PI*2;
function spherePoint(i,n,t,w,h){
 const ang=-Math.PI/2+i*TAU/n+Math.PI*1.03*ease((t-.49)/.22);
 const rx=Math.min(250,w*.28,Math.max(64,(w-Math.min(w*.24,180)-22)/2));
 const ry=Math.min(84,h*.15);
 const z=Math.sin(ang+.45)*Math.min(156,w*.29+40);
 const perspective=1000/(1000-z);
 return {x:w/2+Math.cos(ang)*rx*perspective,y:h/2+(Math.sin(ang)*ry-9)*perspective};
}
function glow(ctx,x,y,r,alpha,rgb='237,202,141'){
 if(alpha<=.004)return;
 const gradient=ctx.createRadialGradient(x,y,0,x,y,r);
 gradient.addColorStop(0,`rgba(255,251,229,${alpha})`);
 gradient.addColorStop(.20,`rgba(${rgb},${alpha*.45})`);
 gradient.addColorStop(1,`rgba(${rgb},0)`);
 ctx.fillStyle=gradient;ctx.fillRect(x-r,y-r,r*2,r*2);
}
function curve(ctx,cx,cy,rx,ry,rotation,start,end){
 ctx.beginPath();ctx.ellipse(cx,cy,rx,ry,rotation,start,end);
}
export function startMagicOrbitVFX(stage,clock){
 const canvas=stage.ownerDocument.createElement('canvas');
 canvas.className='magic-orbit-vfx';canvas.setAttribute('aria-hidden','true');
 stage.append(canvas);stage.classList.add('magic-orbit-active');
 const ctx=canvas.getContext('2d',{alpha:true,desynchronized:true});
 if(!ctx){canvas.remove();stage.classList.remove('magic-orbit-active');return {stop(){}};}
 let w=0,h=0,dpr=1,raf=0,dead=false,last=0;
 const mobile=stage.clientWidth<600;
 function resize(){
  w=stage.clientWidth;h=stage.clientHeight;
  dpr=Math.min(window.devicePixelRatio||1,mobile?1.25:1.6);
  canvas.width=Math.max(1,Math.round(w*dpr));canvas.height=Math.max(1,Math.round(h*dpr));
  ctx.setTransform(dpr,0,0,dpr,0,0);
 }
 resize();
 const ro=typeof ResizeObserver==='function'?new ResizeObserver(resize):null;
 ro?.observe(stage);
 const seeds=Array.from({length:mobile?27:45},(_,i)=>({
  theta:(i*.61803398875%1)*TAU,
  radius:.27+.73*((i*41%97)/97),
  speed:.30+(i%7)*.105,
  size:.65+(i%5)*.31,
  phase:(i*17%37)/37
 }));
 function paint(now){
  if(dead)return;
  raf=requestAnimationFrame(paint);
  if(now-last<(mobile?1000/30:1000/45))return;
  last=now;
  const t=clamp(clock.progress());
  ctx.clearRect(0,0,w,h);
  if(t<=0||t>=.99)return;
  const cx=w/2,cy=h/2-8;
  const power=envelope(t,.055,.20,.68,.85);
  const r=Math.min(w*.31,245),rh=Math.min(h*.19,101);
  ctx.save();ctx.globalCompositeOperation='lighter';
  // A quiet charging halo glows behind the stair rise.
  const charge=envelope(t,.07,.23,.37,.50);
  if(charge>.01){
   glow(ctx,cx,cy,Math.min(165,w*.26),charge*.21,'175,205,192');
   for(let j=0;j<2;j++){
    const rr=24+j*16+ease((t-.08)/.39)*(r*.43);
    curve(ctx,cx,cy,rr,rr*.49,-.22,0,TAU);
    ctx.strokeStyle=`rgba(211,229,197,${charge*(j===0?.25:.13)})`;
    ctx.lineWidth=1.2;ctx.stroke();
   }
  }
  // Thin orbit arc portions, not a permanent large magic-circle decoration.
  const ring=envelope(t,.28,.41,.68,.81);
  if(ring>.004){
   for(let j=0;j<3;j++){
    const phase=t*5+j*TAU/3;
    curve(ctx,cx,cy,r,rh,-.09,phase,phase+(.55+j*.10));
    ctx.lineCap='round';ctx.lineWidth=j===0?1.8:1;
    ctx.shadowColor='rgba(219,193,137,.5)';ctx.shadowBlur=j===0?12:6;
    ctx.strokeStyle=`rgba(${j===1?'167,228,220':'253,219,158'},${ring*(j===0?.7:.42)})`;
    ctx.stroke();
   }
   ctx.shadowBlur=0;
   // Card-following luminous ribbons; heads correspond to actual orbit timing.
   const cardCount=clock.count||7;
   for(let i=0;i<cardCount;i++){
    const head=spherePoint(i,cardCount,t,w,h);
    const trailAlpha=ring*(i%2?.45:.65);
    const p0=spherePoint(i,cardCount,Math.max(.49,t-.064),w,h);
    const g=ctx.createLinearGradient(p0.x,p0.y,head.x,head.y);
    g.addColorStop(0,'rgba(243,191,107,0)');
    g.addColorStop(1,`rgba(255,232,181,${trailAlpha})`);
    ctx.beginPath();
    for(let k=0;k<=12;k++){
     const p=spherePoint(i,cardCount,Math.max(.49,t-.064)+(.064)*k/12,w,h);
     if(!k)ctx.moveTo(p.x,p.y);else ctx.lineTo(p.x,p.y);
    }
    ctx.lineWidth=1.4;ctx.strokeStyle=g;ctx.stroke();
    glow(ctx,head.x,head.y,10,ring*.33);
   }
  }
  // Floating motes flow toward the orbit, with no permanent decorative shapes.
  if(power>.008){
   for(const p of seeds){
    const a=p.theta+t*p.speed*TAU;
    const pulse=.45+.55*Math.sin((t*3+p.phase)*TAU)**2;
    const x=cx+Math.cos(a)*r*p.radius;
    const y=cy+Math.sin(a)*rh*p.radius-16*(1-ease((t-.08)/.5));
    const alpha=power*pulse*.5;
    glow(ctx,x,y,p.size*5,alpha*.28,p.phase>.5?'165,215,198':'238,196,122');
    ctx.beginPath();ctx.arc(x,y,p.size,0,TAU);
    ctx.fillStyle=`rgba(255,236,195,${alpha})`;ctx.fill();
   }
  }
  // Gathered energy releases outward exactly as the orbit turns into the fan.
  const blast=envelope(t,.68,.725,.83,.94);
  if(blast>.006){
   const u=ease((t-.68)/.22);
   const xRadius=18+(Math.min(w*.42,340)-18)*u;
   curve(ctx,cx,cy,xRadius,xRadius*.40,-.09,0,TAU);
   ctx.strokeStyle=`rgba(255,226,156,${blast*.52})`;
   ctx.shadowColor='rgba(255,213,138,.7)';ctx.shadowBlur=18;
   ctx.lineWidth=2.5-1.4*u;ctx.stroke();ctx.shadowBlur=0;
   glow(ctx,cx,cy,Math.min(170,w*.29),blast*.22);
   for(let i=0;i<20;i++){
    const a=i*TAU/20+Math.sin(i)*.08;
    const rr=(26+Math.min(w*.43,330)*u)*(0.8+.2*((i*7%13)/13));
    const x=cx+Math.cos(a)*rr,y=cy+Math.sin(a)*rr*.42;
    glow(ctx,x,y,8*(1-u)+3,blast*.45);
   }
  }
  ctx.restore();
 }
 raf=requestAnimationFrame(paint);
 function stop(){if(dead)return;dead=true;cancelAnimationFrame(raf);ro?.disconnect();canvas.remove();stage.classList.remove('magic-orbit-active');}
 return {stop};
}
