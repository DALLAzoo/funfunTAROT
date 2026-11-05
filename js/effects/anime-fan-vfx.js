/* Single golden animation slash during fan opening only.
 * Card images, card lighting masks, selection targets and DOM structure are untouched.
 */
const PI=Math.PI;
const clamp=x=>Math.max(0,Math.min(1,x));
const ease=x=>{x=clamp(x);return x*x*(3-2*x);};

export function startAnimeFanVFX(stage,cards,duration){
 const canvas=document.createElement('canvas');
 canvas.className='anime-fan-slash';
 canvas.setAttribute('aria-hidden','true');
 stage.append(canvas);
 stage.classList.add('anime-fan-active');
 const ctx=canvas.getContext('2d',{alpha:true});
 if(!ctx){canvas.remove();stage.classList.remove('anime-fan-active');return {stop(){}};}
 let w=0,h=0,dpr=1,stopped=false,frame=0,last=-Infinity;
 const initial=performance.now();
 const small=stage.clientWidth<600;
 function resize(){
   w=stage.clientWidth;h=stage.clientHeight;
   dpr=Math.min(devicePixelRatio||1,small?1.2:1.5);
   canvas.width=Math.max(1,Math.round(w*dpr));
   canvas.height=Math.max(1,Math.round(h*dpr));
   ctx.setTransform(dpr,0,0,dpr,0,0);
 }
 resize();
 const observer=new ResizeObserver(resize);observer.observe(stage);
 // One graceful arc just above the card tops. Geometry scales with actual card dimensions.
 function point(t){
  const cw=cards[(cards.length-1)>>1]?.offsetWidth||Math.min(w*.35,210);
  const ch=cards[(cards.length-1)>>1]?.offsetHeight||cw*1.716;
  const cx=w*.5, cy=h*.5;
  const reach=Math.min(w*.47,Math.max(80,cw*1.62));
  const p0={x:cx-reach,y:cy-ch*.50+Math.min(43,ch*.17)};
  const p1={x:cx,y:cy-ch*.50-Math.min(47,ch*.16)};
  const p2={x:cx+reach,y:p0.y};
  return {x:(1-t)**2*p0.x+2*(1-t)*t*p1.x+t*t*p2.x,
          y:(1-t)**2*p0.y+2*(1-t)*t*p1.y+t*t*p2.y};
 }
 function draw(now){
  if(stopped)return;
  frame=requestAnimationFrame(draw);
  if(now-last<(small?1000/30:1000/50))return;
  last=now;
  ctx.clearRect(0,0,w,h);
  const t=clamp((now-initial)/duration);
  // A single arc: begins as the fan settles, disappears before selection starts.
  const slash=clamp((t-.60)/.20);
  if(t>=.60&&t<.88){
   const head=ease(slash),tail=Math.max(0,head-.22);
   const fade=1-ease((t-.79)/.09);
   if(fade>.005){
    const a=point(tail),b=point(head);
    const gradient=ctx.createLinearGradient(a.x,a.y,b.x,b.y);
    gradient.addColorStop(0,'rgba(231,168,70,0)');
    gradient.addColorStop(.48,`rgba(247,192,102,${fade*.58})`);
    gradient.addColorStop(.85,`rgba(255,235,177,${fade*.95})`);
    gradient.addColorStop(1,`rgba(255,255,236,${fade})`);
    ctx.save();ctx.globalCompositeOperation='lighter';
    ctx.beginPath();
    for(let i=0;i<=20;i++){
     const p=point(tail+(head-tail)*i/20);
     if(i===0)ctx.moveTo(p.x,p.y);else ctx.lineTo(p.x,p.y);
    }
    ctx.lineCap='round';ctx.lineJoin='round';
    ctx.strokeStyle=gradient;ctx.shadowColor='rgba(242,175,81,.8)';
    ctx.shadowBlur=small?11:17;ctx.lineWidth=small?4:5;ctx.globalAlpha=fade*.50;ctx.stroke();
    ctx.globalAlpha=1;ctx.shadowBlur=6;ctx.lineWidth=1.4;ctx.stroke();
    const p=point(head),glow=ctx.createRadialGradient(p.x,p.y,0,p.x,p.y,small?9:13);
    glow.addColorStop(0,`rgba(255,255,235,${fade})`);
    glow.addColorStop(.24,`rgba(255,230,165,${fade*.67})`);
    glow.addColorStop(1,'rgba(255,205,113,0)');
    ctx.fillStyle=glow;const r=small?9:13;ctx.fillRect(p.x-r,p.y-r,r*2,r*2);
    ctx.restore();
   }
  }
  if(t>=1)stop();
 }
 frame=requestAnimationFrame(draw);
 function stop(){
  if(stopped)return;
  stopped=true;cancelAnimationFrame(frame);observer.disconnect();canvas.remove();stage.classList.remove('anime-fan-active');
 }
 return {stop};
}
