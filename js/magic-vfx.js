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
    this.dpr=Math.min(devicePixelRatio||1,this.w<600?1.25:1.5);
    this.limit=this.w<600?100:180;
    for(const {canvas,ctx} of this.layers){canvas.width=Math.round(this.w*this.dpr);canvas.height=Math.round(this.h*this.dpr);ctx?.setTransform(this.dpr,0,0,this.dpr,0,0);}
    this.trails=[];
  }
  phase(name){this.name=name;this.phaseAt=performance.now();}
  start(cards){
    this.stop();this.cards=cards;this.active=true;this.last=performance.now();this.phase('charge');
    this.frame=requestAnimationFrame(t=>this.draw(t));
  }
  finish(){this.phase('fade');}
  stop(){
    this.active=false;cancelAnimationFrame(this.frame);this.particles=[];this.trails=[];
    for(const {ctx} of this.layers)ctx?.clearRect(0,0,this.w,this.h);
  }
  project(p){const k=1100/(1100-p.z);return {x:this.w/2+p.x*k,y:this.h/2+p.y*k,z:p.z};}
  ring(ctx,r,alpha,rotation=0){
    if(!ctx||alpha<=0)return;
    ctx.save();ctx.translate(this.w/2,this.h/2-8);ctx.scale(1,.34);ctx.rotate(rotation);
    ctx.strokeStyle=`rgba(194,233,213,${alpha})`;ctx.lineWidth=1.4;
    ctx.beginPath();ctx.ellipse(0,0,r,r,0,0,Math.PI*2);ctx.stroke();
    for(let i=0;i<12;i++){const a=i*Math.PI/6;ctx.beginPath();ctx.moveTo(Math.cos(a)*(r-5),Math.sin(a)*(r-5));ctx.lineTo(Math.cos(a)*(r+5),Math.sin(a)*(r+5));ctx.stroke();}
    ctx.restore();
  }
  draw(now){
    if(!this.active)return;
    const dt=Math.min(.05,Math.max(0,(now-this.last)/1000));this.last=now;
    const age=(now-this.phaseAt)/1000;
    if(this.name==='fade'&&age>.55){this.stop();return;}
    const fade=this.name==='fade'?Math.max(0,1-age/.55):1;
    const vortex=this.name==='vortex';
    // The last 24% of the existing 2.6 s path is deceleration onto the stack.
    const condense=vortex?Math.max(0,Math.min(1,(age-1.976)/.624)):0;
    const release=this.name==='release';
    const rear=this.layers[0].ctx,front=this.layers[1].ctx;
    for(const {ctx} of this.layers){if(ctx){ctx.clearRect(0,0,this.w,this.h);ctx.globalCompositeOperation='lighter';}}
    if(!rear||!front){this.stop();return;}
    const radius=Math.min(this.w*.42,310);
    const energy=this.name==='charge'?Math.min(1,age/.56):vortex?1:Math.max(0,1-age/.75);
    this.ring(rear,radius*(1-condense*.83),.52*energy*fade,now*.0004);
    this.ring(rear,radius*.8*(1-condense*.8),.24*energy*fade,-now*.0007);
    if(condense>0){
      const g=rear.createRadialGradient(this.w/2,this.h/2-8,0,this.w/2,this.h/2-8,50);
      g.addColorStop(0,`rgba(220,247,227,${condense*.65*fade})`);g.addColorStop(1,'rgba(160,220,189,0)');rear.fillStyle=g;rear.fillRect(this.w/2-50,this.h/2-58,100,100);
    }
    if(release&&age<.65){
      this.ring(front,12+age*radius*3.2,(1-age/.65)*.65,0);
      // Brief directional impact, never a full-screen flash or card filter.
      front.strokeStyle=`rgba(229,246,221,${Math.max(0,1-age/.18)*.65})`;
      for(let i=0;i<8;i++){const a=i*Math.PI/4;front.beginPath();front.moveTo(this.w/2+Math.cos(a)*20,this.h/2-8+Math.sin(a)*9);front.lineTo(this.w/2+Math.cos(a)*radius*.65,this.h/2-8+Math.sin(a)*radius*.22);front.stroke();}
    }
    this.cards.forEach((card,i)=>{
      if(card.hidden)return;
      const p=sampleCard(card);if(!p)return;
      const point=this.project(p);const history=this.trails[i]||(this.trails[i]=[]);
      if(this.name==='charge'&&!this.reduced){
        const a=i*Math.PI*2/22+now*.0006;
        const sx=this.w/2+Math.cos(a)*radius,sy=this.h/2-8+Math.sin(a)*radius*.34;
        rear.strokeStyle=`rgba(176,225,201,${.18*energy})`;rear.lineWidth=.8;
        rear.beginPath();rear.moveTo(sx,sy);rear.quadraticCurveTo(this.w/2,this.h/2-60,point.x,point.y);rear.stroke();
      }
      const prev=history.at(-1);const speed=prev?Math.hypot(point.x-prev.x,point.y-prev.y)/Math.max(dt,.001):0;
      history.push({...point,time:now});while(history.length>9||history.length&&now-history[0].time>150)history.shift();
      if(!this.reduced&&speed>45&&this.name!=='fade'){
        const ctx=p.z>0?front:rear;
        ctx.lineWidth=Math.min(3.2, 1+speed/400);ctx.strokeStyle=`rgba(160,218,192,${Math.min(.65,speed/1000)*fade})`;
        ctx.beginPath();history.forEach((v,j)=>j?ctx.lineTo(v.x,v.y):ctx.moveTo(v.x,v.y));ctx.stroke();
        if(this.particles.length<this.limit&&prev&&dt>0){
          // Sparks inherit the card's velocity; no unrelated random screen emitter.
          this.particles.push({x:point.x,y:point.y,z:p.z,vx:(point.x-prev.x)/dt*.12,vy:(point.y-prev.y)/dt*.12,life:.22,max:.22});
        }
      }
    });
    for(let i=this.particles.length-1;i>=0;i--){
      const p=this.particles[i];p.life-=dt;if(p.life<=0){this.particles.splice(i,1);continue;}
      p.x+=p.vx*dt;p.y+=p.vy*dt;const ctx=p.z>0?front:rear;
      ctx.fillStyle=`rgba(227,239,203,${p.life/p.max*.7*fade})`;ctx.fillRect(p.x,p.y,1.5,1.5);
    }
    this.frame=requestAnimationFrame(t=>this.draw(t));
  }
}
