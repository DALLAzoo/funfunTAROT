import {CONFIG as C} from '../settings/config/config.js';
import {cardCloud,goldLines} from './gold-lines.js';
export class RevealVFX {
 constructor(host){
  this.host=host;this.canvas=document.createElement('canvas');this.canvas.className='reveal-magic';this.canvas.setAttribute('aria-hidden','true');document.body.append(this.canvas);this.ctx=this.canvas.getContext('2d');this.frame=0;this.active=false;
  window.addEventListener('resize',()=>this.resize());this.resize();
 }
 resize(){const b=this.canvas.getBoundingClientRect();this.bounds=b;const d=Math.min(devicePixelRatio||1,2);this.canvas.width=Math.round(b.width*d);this.canvas.height=Math.round(b.height*d);this.ctx?.setTransform(d,0,0,d,0,0);}
 stop(){this.active=false;cancelAnimationFrame(this.frame);this.resolve?.();this.resolve=null;this.canvas.dataset.phase='off';this.ctx?.clearRect(0,0,this.bounds.width,this.bounds.height);}
 async orbit(card,duration=C.reveal.travel){
  this.stop();this.resize();if(!this.ctx)return;
  this.active=true;this.canvas.dataset.phase='orbit';const start=performance.now();
  await new Promise(resolve=>{this.resolve=resolve;const draw=now=>{
   if(!this.active){resolve();return;}
   const t=Math.min(1,(now-start)/duration),box=cardCloud([card],this.bounds);
   this.ctx.clearRect(0,0,this.bounds.width,this.bounds.height);
   const alpha=Math.sin(Math.min(1,t/.12)*Math.PI/2)*Math.pow(1-t, .65);
   goldLines(this.ctx,box,now/1000,alpha,3);
   if(t<1)this.frame=requestAnimationFrame(draw);else{this.stop();}
  };this.frame=requestAnimationFrame(draw);});
 }
 stars(card){
  this.stop();this.resize();if(!this.ctx)return;
  this.active=true;this.canvas.dataset.phase='stars';
  const spots=Array.from({length:4},(_,i)=>this.newStar(performance.now()-i*570));
  const draw=now=>{
   if(!this.active||!card.isConnected){this.stop();return;}
   const ctx=this.ctx,b=card.getBoundingClientRect(),x=b.left-this.bounds.left,y=b.top-this.bounds.top,w=b.width,h=b.height;
   ctx.clearRect(0,0,this.bounds.width,this.bounds.height);ctx.save();ctx.beginPath();ctx.roundRect(x+5,y+5,w-10,h-10,Math.max(2,C.material.radius-3));ctx.clip();
   let visible=0;
   for(let i=0;i<spots.length;i++){
    let p=spots[i],t=(now-p.start)/p.life;if(t>=1){spots[i]=p=this.newStar(now);t=0;}
    const alpha=Math.sin(Math.PI*Math.max(0,t))**2*.9;if(alpha>.03)visible++;
    const sx=x+w*p.x,sy=y+h*p.y,r=p.size;
    ctx.fillStyle=`rgba(218,149,37,${alpha})`;ctx.shadowColor='rgba(248,190,69,.55)';ctx.shadowBlur=3;
    ctx.beginPath();ctx.arc(sx,sy,p.cross?1:1.6,0,Math.PI*2);ctx.fill();
    if(p.cross){ctx.strokeStyle=`rgba(232,168,49,${alpha})`;ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(sx-r,sy);ctx.lineTo(sx+r,sy);ctx.moveTo(sx,sy-r);ctx.lineTo(sx,sy+r);ctx.stroke();}
   }
   ctx.restore();this.canvas.dataset.starCount=String(visible);this.frame=requestAnimationFrame(draw);
  };this.frame=requestAnimationFrame(draw);
 }
 newStar(start){return{start,life:1800+Math.random()*1600,x:.12+Math.random()*.76,y:.1+Math.random()*.8,size:3+Math.random()*2.2,cross:Math.random()<.6};}
}
