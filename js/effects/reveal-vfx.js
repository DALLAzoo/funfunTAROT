import {CONFIG as C} from '../settings/config/config.js';
import {cardCloud} from './gold-lines.js';
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
   // Ambient sparkles are viewport-fixed and continue independently.
   if(t<1)this.frame=requestAnimationFrame(draw);else{this.stop();}
  };this.frame=requestAnimationFrame(draw);});
 }
 stars(card){
  this.stop();this.resize();if(!this.ctx)return;
  this.active=true;this.canvas.dataset.phase='stars';
  const spots=Array.from({length:4},(_,i)=>this.newStar(performance.now()-i*650));
  const draw=now=>{
   if(!this.active||!card.isConnected){this.stop();return;}
   const ctx=this.ctx,b=card.getBoundingClientRect(),x=b.left-this.bounds.left,y=b.top-this.bounds.top,w=b.width,h=b.height;
   ctx.clearRect(0,0,this.bounds.width,this.bounds.height);
   ctx.save();ctx.beginPath();ctx.roundRect(x+5,y+5,Math.max(0,w-10),Math.max(0,h-10),Math.max(2,C.material.radius-3));ctx.clip();
   let visible=0;
   for(let i=0;i<spots.length;i++){
    let p=spots[i],t=(now-p.start)/p.life;
    if(t>=1){spots[i]=p=this.newStar(now);t=0;}
    if(t<0)continue;
    // A brief, bright pulse followed by a lingering soft golden afterglow.
    const rise=Math.min(1,t/.22),pulse=Math.exp(-Math.pow((t-.34)/.095,2));
    const fade=Math.pow(Math.max(0,1-t),1.35);
    const intensity=Math.min(1,(rise*.26+pulse*.9)*fade*1.6);
    if(intensity<.015)continue;
    visible++;
    const sx=x+w*p.x,sy=y+h*p.y;
    const radius=p.size*(3.2+pulse*2.5);
    const halo=ctx.createRadialGradient(sx,sy,0,sx,sy,radius);
    halo.addColorStop(0,`rgba(255,246,204,${intensity*.78})`);
    halo.addColorStop(.13,`rgba(255,213,113,${intensity*.42})`);
    halo.addColorStop(.48,`rgba(244,169,59,${intensity*.16})`);
    halo.addColorStop(1,'rgba(234,152,45,0)');
    ctx.fillStyle=halo;ctx.beginPath();ctx.arc(sx,sy,radius,0,Math.PI*2);ctx.fill();
    ctx.fillStyle=`rgba(255,248,213,${intensity*.92})`;
    ctx.beginPath();ctx.arc(sx,sy,.65+pulse*.9,0,Math.PI*2);ctx.fill();
    // Keep the cross barely visible; the diffuse halo is the main effect.
    ctx.strokeStyle=`rgba(255,224,150,${intensity*.18})`;
    ctx.lineWidth=.6;ctx.beginPath();
    ctx.moveTo(sx-p.size*.65,sy);ctx.lineTo(sx+p.size*.65,sy);
    ctx.moveTo(sx,sy-p.size*.65);ctx.lineTo(sx,sy+p.size*.65);ctx.stroke();
   }
   ctx.restore();this.canvas.dataset.starCount=String(visible);this.frame=requestAnimationFrame(draw);
  };this.frame=requestAnimationFrame(draw);
 }
 newStar(start){return{start,life:2100+Math.random()*1200,x:.12+Math.random()*.76,y:.1+Math.random()*.8,size:4.5+Math.random()*2.5};}
}
