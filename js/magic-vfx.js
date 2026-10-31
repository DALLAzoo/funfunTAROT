import {CONFIG as C} from './config.js';
import {samplePressure, waveRadius} from './finale-motion.js';
import {sampleCard} from './card-animation.js';
// Canvas light lives outside the preserve-3d tree. Card transforms remain WAAPI-owned.
export class MagicVFX {
  constructor(stage) {
    this.stage=stage; this.active=false; this.particles=[]; this.trails=[];
    this.reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
    this.layers=['rear','front'].map(name=>{
      const c=document.createElement('canvas'); c.className=`magic-canvas magic-${name}`;
      c.setAttribute('aria-hidden','true'); stage.append(c);
      return {canvas:c,ctx:c.getContext('2d')};
    });
    this.resizeObserver=new ResizeObserver(()=>this.resize());this.resizeObserver.observe(stage);
    document.addEventListener('visibilitychange',()=>{this.last=performance.now();this.trails=[];});
    this.resize();
  }
  resize(){
    this.w=this.stage.clientWidth;this.h=this.stage.clientHeight;
    this.dpr=Math.min(devicePixelRatio||1,this.w<C.breakpoint?C.vfx.mobileDpr:C.vfx.desktopDpr);
    this.limit=this.w<C.breakpoint?C.vfx.mobileParticles:C.vfx.desktopParticles;
    for(const {canvas,ctx} of this.layers){canvas.width=Math.round(this.w*this.dpr);canvas.height=Math.round(this.h*this.dpr);ctx?.setTransform(this.dpr,0,0,this.dpr,0,0);}
    this.trails=[];
  }
  phase(name){this.name=name;this.phaseAt=performance.now();}
  start(cards){
    this.stop();this.cards=cards;this.active=true;this.last=performance.now();this.phase('charge');
    this.frame=requestAnimationFrame(t=>this.draw(t));
  }
  release(clock){this.waveClock=clock;this.trails=[];this.phase('release');}
  finish(){this.phase('fade');}
  stop(){
    this.active=false;cancelAnimationFrame(this.frame);this.particles=[];this.trails=[];this.waveClock=null;
    for(const {ctx} of this.layers)ctx?.clearRect(0,0,this.w,this.h);
  }
  project(p){const k=C.camera.perspective/(C.camera.perspective-p.z);return {x:this.w/2+p.x*k,y:this.h/2+p.y*k,z:p.z};}
  ring(ctx,r,alpha,rotation=0){
    if(!ctx||alpha<=0)return;
    ctx.save();ctx.translate(this.w/2,this.h/2-8);ctx.scale(1,.34);ctx.rotate(rotation);
    ctx.strokeStyle=`rgba(237,195,111,${alpha})`;ctx.lineWidth=1.4;
    ctx.beginPath();ctx.ellipse(0,0,r,r,0,0,Math.PI*2);ctx.stroke();
    for(let i=0;i<12;i++){const a=i*Math.PI/6;ctx.beginPath();ctx.moveTo(Math.cos(a)*(r-5),Math.sin(a)*(r-5));ctx.lineTo(Math.cos(a)*(r+5),Math.sin(a)*(r+5));ctx.stroke();}
    ctx.restore();
  }
  drawWave(rear,front,fade){
    const t=Math.max(0,Math.min(1,this.waveClock.progress()));
    const q=samplePressure(t),r=waveRadius(q,this.waveClock.width,this.waveClock.count);
    const cx=this.w/2,cy=this.h/2-8;
    const intensity=Math.pow(1-t,1.4)*fade;
    // A broad energy shoulder, sharp pressure edge and a trailing secondary rim.
    for(const [width,alpha,rr] of [[22,.11,r],[7,.30,r],[1.8,.95,r],[1,.25,r*.88]]){
      rear.strokeStyle=`rgba(${C.vfx.rgb},${intensity*alpha})`;rear.lineWidth=width;
      rear.beginPath();rear.arc(cx,cy,rr,0,Math.PI*2);rear.stroke();
    }
    if(!this.reduced){
      // Short arcs reach beyond the opaque card edges; no card opacity/filter change.
      front.strokeStyle=`rgba(255,225,164,${intensity*.7})`;front.lineWidth=1.2;
      for(let i=0;i<8;i++){
        const a=i*Math.PI/4+.15;
        front.beginPath();front.arc(cx,cy,r,a,a+.13);front.stroke();
      }
      const count=Math.min(this.w<C.breakpoint?16:24,Math.max(0,this.limit-this.particles.length));
      const sparkle=Math.max(0,1-t/.85)*fade;
      front.fillStyle=`rgba(255,218,145,${sparkle*.8})`;
      for(let i=0;i<count;i++){
        const a=i*2.399963,rr=r+(8+(i%4)*5)*q;
        front.fillRect(cx+Math.cos(a)*rr,cy+Math.sin(a)*rr,1.4,1.4);
      }
    }
    // Energy follows the same nine moving poses, then extinguishes as they settle.
    if(q>.65){
      const glow=(1-q)*2*fade;
      rear.strokeStyle=`rgba(235,190,104,${glow})`;rear.lineWidth=1;
      for(const card of this.cards){
        if(card.hidden)continue;
        const p=sampleCard(card);if(!p)continue;const point=this.project(p);
        rear.beginPath();rear.arc(point.x,point.y,9+(1-q)*25,0,Math.PI*2);rear.stroke();
      }
    }
  }
  draw(now){
    if(!this.active)return;
    const dt=Math.min(.05,Math.max(0,(now-this.last)/1000));this.last=now;
    const age=(now-this.phaseAt)/1000;
    if(this.name==='fade'&&age>C.finale.afterglow/1000){this.stop();return;}
    const fade=this.name==='fade'?Math.max(0,1-age/(C.finale.afterglow/1000)):1;
    const vortex=this.name==='vortex';
    // Existing orbit-to-stack interval, followed by the short still pose.
    const condense=vortex?Math.max(0,Math.min(1,(age-C.shuffle.duration*.78/1000)/(C.shuffle.duration*.22/1000))):0;
    const release=this.name==='release'||(this.name==='fade'&&this.waveClock);
    const rear=this.layers[0].ctx,front=this.layers[1].ctx;
    for(const {ctx} of this.layers){if(ctx){ctx.clearRect(0,0,this.w,this.h);ctx.globalCompositeOperation='lighter';}}
    if(!rear||!front){this.stop();return;}
    const radius=Math.min(this.w*.42,310);
    const energy=this.name==='charge'?Math.min(1,age/(C.shuffle.separate/1000)):vortex?1:Math.max(0,1-age/.75);
    if(this.name!=='focus')this.ring(rear,radius*(1-condense*.83),.85*energy*fade,now*.0004);
    if(this.name!=='focus')this.ring(rear,radius*.8*(1-condense*.8),.48*energy*fade,-now*.0007);
    if(condense>0){
      const coreRadius=Math.max(66,Math.min(130,this.w*.18));
      const g=rear.createRadialGradient(this.w/2,this.h/2-8,0,this.w/2,this.h/2-8,coreRadius);
      g.addColorStop(0,`rgba(250,205,126,${condense*.65*fade})`);g.addColorStop(1,'rgba(222,170,82,0)');rear.fillStyle=g;rear.fillRect(this.w/2-coreRadius,this.h/2-8-coreRadius,coreRadius*2,coreRadius*2);
    }
    // During gathering, the magic streams inward with the cards.
    if(condense>0&&!this.reduced){
      const cx=this.w/2,cy=this.h/2-8;
      const count=this.w<C.breakpoint?12:22;
      front.save();front.globalCompositeOperation='lighter';
      for(let j=0;j<count;j++){
        const a=j*2.399963+now*.00016;
        const r=(1-condense)*radius*(.7+(j%5)*.09)+12;
        const x=cx+Math.cos(a)*r,y=cy+Math.sin(a)*r*.55;
        const alpha=Math.sin(Math.PI*condense)*(.3+(j%3)*.15);
        front.fillStyle=`rgba(255,213,125,${alpha*fade})`;
        front.beginPath();front.arc(x,y,j%4===0?1.8:1,0,Math.PI*2);front.fill();
      }
      front.restore();
    }
    if(release&&this.waveClock)this.drawWave(rear,front,fade);
    if(this.name==='focus'){
      const chosen=this.cards[0];
      if(chosen){
        const rect=chosen.getBoundingClientRect(),bounds=this.stage.getBoundingClientRect();
        const cx=rect.left-bounds.left+rect.width/2,cy=rect.top-bounds.top+rect.height/2;
        const duration=C.reveal.approach/1000,progress=Math.min(1,age/duration);
        const eased=1-Math.pow(1-progress,2);
        const envelope=Math.sin(Math.PI*progress);
        front.save();front.globalCompositeOperation='lighter';
        const count=this.w<C.breakpoint?22:34;
        const outer=Math.min(this.w*.30,175);
        for(let i=0;i<count;i++){
          const angle=i*2.399963;
          const startR=outer*(.72+(i%7)*.045);
          const r=startR*(1-eased)+(8+i%6)*eased;
          const x=cx+Math.cos(angle)*r,y=cy+Math.sin(angle)*r*.77;
          const alpha=(.12+.46*envelope)*(i%4===0?1:.72);
          front.fillStyle=`rgba(255,215,135,${alpha})`;
          front.beginPath();front.arc(x,y,i%7===0?1.65:0.85,0,Math.PI*2);front.fill();
          if(i%6===0){
            front.strokeStyle=`rgba(255,226,163,${alpha*.42})`;
            front.lineWidth=.55;
            front.beginPath();front.moveTo(x-3,y);front.lineTo(x+3,y);front.moveTo(x,y-3);front.lineTo(x,y+3);front.stroke();
          }
        }
        const glow=front.createRadialGradient(cx,cy,0,cx,cy,35);
        glow.addColorStop(0,`rgba(255,201,112,${.16*envelope})`);
        glow.addColorStop(1,'rgba(255,201,112,0)');
        front.fillStyle=glow;front.fillRect(cx-35,cy-35,70,70);
        front.restore();
      }
    }
    this.cards.forEach((card,i)=>{
      if(card.hidden)return;
      const p=sampleCard(card);if(!p)return;
      const point=this.project(p);const history=this.trails[i]||(this.trails[i]=[]);
      if(this.name==='charge'&&!this.reduced){
        const a=i*Math.PI*2/22+now*.0006;
        const sx=this.w/2+Math.cos(a)*radius,sy=this.h/2-8+Math.sin(a)*radius*.34;
        rear.strokeStyle=`rgba(230,181,99,${.18*energy})`;rear.lineWidth=.8;
        rear.beginPath();rear.moveTo(sx,sy);rear.quadraticCurveTo(this.w/2,this.h/2-60,point.x,point.y);rear.stroke();
      }
      const prev=history.at(-1);const speed=prev?Math.hypot(point.x-prev.x,point.y-prev.y)/Math.max(dt,.001):0;
      history.push({...point,time:now});while(history.length>9||history.length&&now-history[0].time>150)history.shift();
      if(!this.reduced&&speed>20&&this.name!=='fade'){
        const ctx=p.z>0?front:rear;
        ctx.lineWidth=Math.min(3.2, 1+speed/400);ctx.strokeStyle=`rgba(246,197,107,${Math.min(.65,speed/1000)*fade})`;
        ctx.beginPath();history.forEach((v,j)=>j?ctx.lineTo(v.x,v.y):ctx.moveTo(v.x,v.y));ctx.stroke();
        if(this.particles.length<this.limit&&prev&&dt>0){
          // Sparks inherit the card's velocity; no unrelated random screen emitter.
          this.particles.push({x:point.x,y:point.y,z:p.z,vx:(point.x-prev.x)/dt*.12,vy:(point.y-prev.y)/dt*.12,life:.42,max:.42});
        }
      }
    });
    for(let i=this.particles.length-1;i>=0;i--){
      const p=this.particles[i];p.life-=dt;if(p.life<=0){this.particles.splice(i,1);continue;}
      p.x+=p.vx*dt;p.y+=p.vy*dt;const ctx=p.z>0?front:rear;
      ctx.fillStyle=`rgba(255,225,153,${p.life/p.max*.95*fade})`;ctx.fillRect(p.x,p.y,1.5,1.5);
    }
    this.frame=requestAnimationFrame(t=>this.draw(t));
  }
}
