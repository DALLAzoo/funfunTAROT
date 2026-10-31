// Independent decorative layer: never changes card transforms, hit targets or faces.
export class RevealVFX {
 constructor(host){this.host=host;this.canvas=document.createElement('canvas');this.canvas.className='reveal-magic';this.canvas.setAttribute('aria-hidden','true');host.append(this.canvas);this.ctx=this.canvas.getContext('2d');this.frame=0;this.active=false;}
 stop(){this.active=false;cancelAnimationFrame(this.frame);this.ctx?.clearRect(0,0,this.canvas.width,this.canvas.height);}
 async gather(card,duration=700){
  this.stop();if(matchMedia('(prefers-reduced-motion: reduce)').matches)return;
  this.active=true;const bounds=this.canvas.getBoundingClientRect();const dpr=Math.min(devicePixelRatio||1,2);
  this.canvas.width=Math.round(bounds.width*dpr);this.canvas.height=Math.round(bounds.height*dpr);
  const ctx=this.ctx;ctx.setTransform(dpr,0,0,dpr,0,0);
  const w=bounds.width,h=bounds.height,cx=w/2,cy=h/2;
  const count=innerWidth<600?30:52;
  const particles=Array.from({length:count},(_,i)=>{const a=i*2.399963+0.25;const r=Math.max(w,h)*(.5+.15*(i%5)/5);return {a,r,size:.6+(i%4)*.24,phase:(i%7)/7};});
  const start=performance.now();
  await new Promise(resolve=>{
   const draw=now=>{
    if(!this.active){resolve();return;}
    const t=Math.min(1,(now-start)/duration),ease=t*t*(3-2*t);
    ctx.clearRect(0,0,w,h);ctx.globalCompositeOperation='lighter';
    for(const p of particles){
     const r=p.r*(1-ease)+14*ease;
     const a=p.a+t*.55;
     const x=cx+Math.cos(a)*r,y=cy+Math.sin(a)*r*.62;
     const alpha=Math.sin(Math.PI*t)*(.23+.16*p.phase);
     const glow=ctx.createRadialGradient(x,y,0,x,y,4.5);
     glow.addColorStop(0,`rgba(255,227,155,${alpha})`);glow.addColorStop(1,'rgba(241,171,75,0)');
     ctx.fillStyle=glow;ctx.beginPath();ctx.arc(x,y,4.5,0,Math.PI*2);ctx.fill();
     ctx.fillStyle=`rgba(255,238,190,${alpha*.85})`;ctx.beginPath();ctx.arc(x,y,p.size,0,Math.PI*2);ctx.fill();
    }
    if(t<1)this.frame=requestAnimationFrame(draw);else{ctx.clearRect(0,0,w,h);this.active=false;resolve();}
   };this.frame=requestAnimationFrame(draw);
  });
 }
}
