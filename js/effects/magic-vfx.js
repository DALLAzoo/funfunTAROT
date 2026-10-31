import {CONFIG as C} from '../settings/config/config.js';
import {cardCloud,goldLines} from './gold-lines.js';
// Body-owned fixed Canvas cannot be covered by cards advancing in stage 3D space.
export class MagicVFX {
 constructor(stage){
  this.stage=stage;this.active=false;this.trails=[];this.name='off';
  this.canvas=document.createElement('canvas');this.canvas.className='magic-canvas magic-front';this.canvas.setAttribute('aria-hidden','true');document.body.append(this.canvas);
  this.ctx=this.canvas.getContext('2d');this.resizeObserver=new ResizeObserver(()=>this.resize());this.resizeObserver.observe(stage);
  window.addEventListener('resize',()=>this.resize());window.addEventListener('scroll',()=>this.resize(),{passive:true});
  document.addEventListener('visibilitychange',()=>{this.last=performance.now();this.trails=[];});this.resize();
 }
 resize(){
  const b=this.stage.getBoundingClientRect();this.bounds=b;this.w=b.width;this.h=b.height;
  Object.assign(this.canvas.style,{left:b.left+'px',top:b.top+'px',width:b.width+'px',height:b.height+'px'});
  this.dpr=Math.min(devicePixelRatio||1,this.w<C.breakpoint?C.vfx.mobileDpr:C.vfx.desktopDpr);
  this.canvas.width=Math.round(this.w*this.dpr);this.canvas.height=Math.round(this.h*this.dpr);this.ctx?.setTransform(this.dpr,0,0,this.dpr,0,0);this.trails=[];
 }
 phase(name){this.name=name;this.phaseAt=performance.now();this.canvas.dataset.phase=name;}
 idle(cards){this.start(cards,'idle');}
 start(cards,phase='charge'){
  // Continue the same clock and canvas through idle -> shuffle; never add a layer.
  this.cards=cards;this.trails=[];this.resize();this.phase(phase);
  if(this.active)return;this.active=true;this.last=performance.now();this.frame=requestAnimationFrame(t=>this.draw(t));
 }
 release(clock){this.waveClock=clock;this.phase('release');this.trails=[];}
 finish(){this.phase('fade');}
 stop(){this.active=false;cancelAnimationFrame(this.frame);this.trails=[];this.phase('off');this.ctx?.clearRect(0,0,this.w,this.h);}
 draw(now){
  if(!this.active)return;
  const ctx=this.ctx;if(!ctx){this.stop();return;}
  const age=(now-this.phaseAt)/1000,fade=this.name==='fade'?Math.max(0,1-age/(C.finale.afterglow/1000)):1;
  if(this.name==='fade'&&!fade){this.stop();return;}
  ctx.clearRect(0,0,this.w,this.h);
  const box=cardCloud(this.cards,this.bounds);this.canvas.dataset.center=box?`${box.cx.toFixed(2)},${box.cy.toFixed(2)}`:'';
  const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
  const envelope=box&&this.name!=='idle'?{...box,width:Math.min(box.width,this.w*.72),height:Math.min(box.height,this.h*.78)}:box;
  goldLines(ctx,envelope,reduced?0:now/1000,fade*(this.name==='idle'?.78:1),3);
  if(this.name!=='idle'&&!reduced){
   this.cards.forEach((card,i)=>{
    if(card.hidden||i%4)return;
    const r=card.getBoundingClientRect(),p={x:r.left-this.bounds.left+r.width*.7,y:r.top-this.bounds.top+r.height*.62,time:now};
    const hist=this.trails[i]||(this.trails[i]=[]);hist.push(p);while(hist.length>28||hist.length&&now-hist[0].time>450)hist.shift();
    if(hist.length<3)return;
    ctx.save();ctx.lineWidth=.9;ctx.lineCap='round';ctx.strokeStyle=`rgba(243,191,96,${fade*.55})`;ctx.beginPath();
    hist.forEach((v,j)=>{if(!j)ctx.moveTo(v.x,v.y);else{const prev=hist[j-1];ctx.quadraticCurveTo(prev.x,prev.y,(prev.x+v.x)/2,(prev.y+v.y)/2);}});ctx.stroke();ctx.restore();
   });
   if(box)for(let i=0;i<(this.w<C.breakpoint?14:24);i++){
    const a=i*2.399963+now*.00022,r=.42+(i%7)*.07;
    ctx.fillStyle=`rgba(255,217,144,${fade*(.28+.22*Math.sin(now*.0017+i)**2)})`;ctx.beginPath();ctx.arc(box.cx+Math.cos(a)*box.width*r*.6,box.cy+Math.sin(a)*box.height*r*.55,i%5? .65:1,0,Math.PI*2);ctx.fill();
   }
  }
  this.frame=requestAnimationFrame(t=>this.draw(t));
 }
}
