import {CONFIG as C} from '../settings/config/config.js';
import {cardCloud} from './gold-lines.js';
import {startScreenSparkles} from './sparkle-field.js';
import {samplePressure,waveRadius} from '../motion/animation/finale-motion.js';
// Body-owned fixed Canvas cannot be covered by cards advancing in stage 3D space.
export class MagicVFX {
 constructor(stage){
  this.stage=stage;this.active=false;this.trails=[];this.name='off';
  startScreenSparkles(); // Single viewport-fixed effect across every stage, including result.
  this.canvas=document.createElement('canvas');this.canvas.className='magic-canvas magic-front';this.canvas.setAttribute('aria-hidden','true');document.body.append(this.canvas);
  this.ctx=this.canvas.getContext('2d');
  // Restore the original rear-layer light during shuffle and fan opening.
  this.rearCanvas=document.createElement('canvas');this.rearCanvas.className='magic-canvas magic-rear';this.rearCanvas.setAttribute('aria-hidden','true');stage.append(this.rearCanvas);this.rearCtx=this.rearCanvas.getContext('2d');this.resizeObserver=new ResizeObserver(()=>this.resize());this.resizeObserver.observe(stage);
  window.addEventListener('resize',()=>this.resize());window.addEventListener('scroll',()=>this.resize(),{passive:true});
  document.addEventListener('visibilitychange',()=>{this.last=performance.now();this.trails=[];});this.resize();
 }
 resize(){
  const b=this.stage.getBoundingClientRect();this.bounds=b;this.w=b.width;this.h=b.height;
  Object.assign(this.canvas.style,{left:b.left+'px',top:b.top+'px',width:b.width+'px',height:b.height+'px'});
  this.dpr=Math.min(devicePixelRatio||1,this.w<C.breakpoint?C.vfx.mobileDpr:C.vfx.desktopDpr);
  this.canvas.width=Math.round(this.w*this.dpr);this.canvas.height=Math.round(this.h*this.dpr);this.ctx?.setTransform(this.dpr,0,0,this.dpr,0,0);
  this.rearCanvas.width=Math.round(this.w*this.dpr);this.rearCanvas.height=Math.round(this.h*this.dpr);this.rearCtx?.setTransform(this.dpr,0,0,this.dpr,0,0);this.trails=[];
 }
 phase(name){this.name=name;this.phaseAt=performance.now();this.canvas.dataset.phase=name;}
 // The idle deck is static. Its visible gold lighting is handled by CSS,
 // and screen sparkles run in their own canvas. The MagicVFX frame loop only
 // clears blank canvases and measures all cards during idle, so leave it off
 // until the user actually starts a shuffle.
 idle(cards){
  this.stop();
  this.cards=cards;
  this.phase('idle');
 }
 start(cards,phase='charge'){
  // Continue the same clock and canvas through idle -> shuffle; never add a layer.
  this.cards=cards;this.trails=[];this.resize();this.phase(phase);
  if(this.active)return;this.active=true;this.last=performance.now();this.frame=requestAnimationFrame(t=>this.draw(t));
 }
 release(clock){this.waveClock=clock;this.phase('release');this.trails=[];}
 finish(){this.phase('fade');}
 stop(){this.active=false;cancelAnimationFrame(this.frame);this.trails=[];this.phase('off');this.ctx?.clearRect(0,0,this.w,this.h);this.rearCtx?.clearRect(0,0,this.w,this.h);this.waveClock=null;}
 draw(now){
  if(!this.active)return;
  const ctx=this.ctx;if(!ctx){this.stop();return;}
  const age=(now-this.phaseAt)/1000,fade=this.name==='fade'?Math.max(0,1-age/(C.finale.afterglow/1000)):1;
  if(this.name==='fade'&&!fade){this.stop();return;}
  ctx.clearRect(0,0,this.w,this.h);
  this.drawRear(now,age,fade);
  const box=cardCloud(this.cards,this.bounds);this.canvas.dataset.center=box?`${box.cx.toFixed(2)},${box.cy.toFixed(2)}`:'';
  // Screen sparkles run on their own fixed canvas; never follow cards or drag.
  this.frame=requestAnimationFrame(t=>this.draw(t));
 }
 // Rear light is separate from the new front orbit, so cards can pass in front of it.
 drawRear(now,age,fade){
  const ctx=this.rearCtx;if(!ctx)return;
  ctx.clearRect(0,0,this.w,this.h);
  if(this.name==='idle'||this.name==='off')return;
  const vortex=this.name==='vortex';
  const condense=vortex?Math.max(0,Math.min(1,(age-C.shuffle.duration*.78/1000)/(C.shuffle.duration*.22/1000))):0;
  const radius=Math.min(this.w*.42,310);
  const energy=this.name==='charge'?Math.min(1,age/(C.shuffle.separate/1000)):vortex?1:Math.max(0,1-age/.75);
  ctx.save();ctx.globalCompositeOperation='lighter';
  if(this.name==='charge'||vortex){
   for(const [r,alpha,rotation] of [[radius*(1-condense*.83),.52,now*.0004],[radius*.8*(1-condense*.8),.24,-now*.0007]]){
    ctx.save();ctx.translate(this.w/2,this.h/2-8);ctx.scale(1,.34);ctx.rotate(rotation);
    ctx.strokeStyle=`rgba(237,195,111,${alpha*energy*fade})`;ctx.lineWidth=1.4;
    ctx.beginPath();ctx.ellipse(0,0,r,r,0,0,Math.PI*2);ctx.stroke();
    for(let i=0;i<12;i++){const a=i*Math.PI/6;ctx.beginPath();ctx.moveTo(Math.cos(a)*(r-5),Math.sin(a)*(r-5));ctx.lineTo(Math.cos(a)*(r+5),Math.sin(a)*(r+5));ctx.stroke();}
    ctx.restore();
   }
   if(condense>0){const r=Math.max(66,Math.min(130,this.w*.18));const g=ctx.createRadialGradient(this.w/2,this.h/2-8,0,this.w/2,this.h/2-8,r);
    g.addColorStop(0,`rgba(250,205,126,${condense*.65*fade})`);g.addColorStop(1,'rgba(222,170,82,0)');ctx.fillStyle=g;ctx.fillRect(this.w/2-r,this.h/2-8-r,r*2,r*2);}
  }
  if((this.name==='release'||this.name==='fade')&&this.waveClock){
   const t=Math.max(0,Math.min(1,this.waveClock.progress()));
   const q=samplePressure(t),r=waveRadius(q,this.waveClock.width,this.waveClock.count);
   const intensity=Math.pow(1-t,1.4)*fade,cx=this.w/2,cy=this.h/2-8;
   for(const [width,alpha,rr] of [[22,.11,r],[7,.30,r],[1.8,.95,r],[1,.25,r*.88]]){
    ctx.strokeStyle=`rgba(${C.vfx.rgb},${intensity*alpha})`;ctx.lineWidth=width;
    ctx.beginPath();ctx.arc(cx,cy,rr,0,Math.PI*2);ctx.stroke();
   }
  }
  ctx.restore();
 }
}
