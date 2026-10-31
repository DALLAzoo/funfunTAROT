import {CONFIG as C} from '../settings/config/config.js';
// A permanent overlay, retained when the result card changes.
export class RevealVFX {
 constructor(host){this.host=host;this.canvas=document.createElement('canvas');this.canvas.className='reveal-magic';this.canvas.setAttribute('aria-hidden','true');document.body.append(this.canvas);this.ctx=this.canvas.getContext('2d');this.frame=0;this.active=false;}
 stop(){this.active=false;cancelAnimationFrame(this.frame);this.resolve?.();this.resolve=null;this.ctx?.clearRect(0,0,this.canvas.width,this.canvas.height);}
 sweep(card,duration=C.reveal.sweep){
  this.stop();if(matchMedia('(prefers-reduced-motion: reduce)').matches||!this.ctx)return;
  this.active=true;const canvas=this.canvas,ctx=this.ctx,bounds=canvas.getBoundingClientRect();
  const dpr=Math.min(devicePixelRatio||1,2);canvas.width=Math.round(bounds.width*dpr);canvas.height=Math.round(bounds.height*dpr);ctx.setTransform(dpr,0,0,dpr,0,0);
  const start=performance.now();
  const draw=now=>{
   if(!this.active)return;const t=Math.min(1,(now-start)/duration),box=card.getBoundingClientRect();
   const x=box.left-bounds.left+5,y=box.top-bounds.top+5,w=box.width-10,h=box.height-10;
   ctx.clearRect(0,0,bounds.width,bounds.height);ctx.save();ctx.beginPath();ctx.roundRect(x,y,w,h,5);ctx.clip();
   const cx=x-w*.5+t*w*2,cy=y+h*.48,r=w*.72;
   ctx.translate(cx,cy);ctx.scale(1,h/w*1.3);
   const glow=ctx.createRadialGradient(0,0,0,0,0,r);
   const a=Math.sin(Math.PI*t)*C.reveal.sweepAlpha;glow.addColorStop(0,`rgba(255,191,57,${a})`);glow.addColorStop(.45,`rgba(247,195,89,${a*.6})`);glow.addColorStop(1,'rgba(243,180,61,0)');
   ctx.fillStyle=glow;ctx.fillRect(-r,-r,r*2,r*2);ctx.restore();
   if(t<1)this.frame=requestAnimationFrame(draw);else this.stop();
  };this.frame=requestAnimationFrame(draw);
 }
 async gather(card,duration=C.reveal.travel){
  this.stop();if(matchMedia('(prefers-reduced-motion: reduce)').matches)return;
  if(!this.canvas.isConnected)document.body.append(this.canvas);
  const ctx=this.ctx;if(!ctx)return;
  this.active=true;
  const bounds=this.canvas.getBoundingClientRect(),dpr=Math.min(devicePixelRatio||1,2);
  this.canvas.width=Math.round(bounds.width*dpr);this.canvas.height=Math.round(bounds.height*dpr);
  ctx.setTransform(dpr,0,0,dpr,0,0);
  const w=bounds.width,h=bounds.height,count=innerWidth<600?30:52;
  const particles=Array.from({length:count},(_,i)=>({a:i*2.399963,r:.7+(i%7)*.06,size:.8+(i%4)*.22}));
  const start=performance.now();
  await new Promise(resolve=>{
   this.resolve=resolve;
   const draw=now=>{
    if(!this.active){resolve();return;}
    const t=Math.min(1,(now-start)/duration),ease=1-Math.pow(1-t,2);
    // Measure the animated card each frame: the attraction point follows its journey.
    const box=card.getBoundingClientRect(),cx=box.left-bounds.left+box.width/2,cy=box.top-bounds.top+box.height/2;
    ctx.clearRect(0,0,w,h);ctx.globalCompositeOperation='source-over';
    for(const p of particles){
     const a=p.a+t*.7,r=Math.max(box.width,box.height)*p.r*(1-ease)+12;
     const x=cx+Math.cos(a)*r,y=cy+Math.sin(a)*r*.72;
     const alpha=Math.sin(Math.PI*t)*.85;
     const glow=ctx.createRadialGradient(x,y,0,x,y,5);
     glow.addColorStop(0,`rgba(255,211,112,${alpha})`);glow.addColorStop(1,'rgba(225,151,40,0)');
     ctx.fillStyle=glow;ctx.fillRect(x-5,y-5,10,10);
     ctx.fillStyle=`rgba(255,220,139,${alpha})`;ctx.beginPath();ctx.arc(x,y,p.size,0,Math.PI*2);ctx.fill();
    }
    if(t<1)this.frame=requestAnimationFrame(draw);else{ctx.clearRect(0,0,w,h);this.active=false;this.resolve=null;resolve();}
   };this.frame=requestAnimationFrame(draw);
  });
 }
}
