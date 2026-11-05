/*
 * Anime-style card-fan motion accents.
 * Two short-lived 2D canvases: a ritual aperture behind the cards and
 * card-following comet trails in front. No card art / hit target is touched.
 * Canvas resolution is deliberately bounded; artwork stays full-resolution DOM.
 */
const PI=Math.PI;
const clamp=t=>Math.max(0,Math.min(1,t));
const smooth=t=>{t=clamp(t);return t*t*(3-2*t);};
const rng=i=>{const x=Math.sin(i*97.427+13.71)*43758.5453;return x-Math.floor(x);};

export function startAnimeFanVFX(stage,cards,duration){
 const back=document.createElement('canvas'),front=document.createElement('canvas');
 back.className='anime-fan-rear';front.className='anime-fan-front';
 back.setAttribute('aria-hidden','true');front.setAttribute('aria-hidden','true');
 stage.insertBefore(back,stage.firstChild);stage.append(front);
 const b=back.getContext('2d',{alpha:true});
 const f=front.getContext('2d',{alpha:true});
 if(!b||!f){back.remove();front.remove();return {stop(){}};}
 let stopped=false,frame=0,w=0,h=0,dpr=1,lastFrame=-Infinity,at=performance.now();
 let bounds=null;
 const tracks=cards.map(()=>[]);
 const small=stage.clientWidth<600;
 const fps=small?30:45;
 const dust=Array.from({length:small?35:64},(_,i)=>({
   angle:PI*2*rng(i+2),radius:.22+.78*rng(i+53),
   phase:rng(i+101),size:.5+1.65*rng(i+121),drift:.3+rng(i+302)
 }));
 function resize(){
   bounds=stage.getBoundingClientRect();w=bounds.width;h=bounds.height;
   dpr=Math.min(devicePixelRatio||1,small?1.15:1.45);
   for(const cv of [back,front]){
     cv.width=Math.max(1,Math.round(w*dpr));cv.height=Math.max(1,Math.round(h*dpr));
   }
   b.setTransform(dpr,0,0,dpr,0,0);f.setTransform(dpr,0,0,dpr,0,0);
 }
 resize();
 const resizeObserver=new ResizeObserver(resize);resizeObserver.observe(stage);
 function ring(ctx,x,y,r,opacity,t){
   ctx.save();ctx.translate(x,y);ctx.scale(1,.34);
   ctx.strokeStyle=`rgba(244,201,119,${opacity})`;
   ctx.lineWidth=1.4;ctx.shadowColor='rgba(247,195,91,.95)';ctx.shadowBlur=11;
   ctx.beginPath();ctx.arc(0,0,r,0,2*PI);ctx.stroke();
   ctx.shadowBlur=0;ctx.strokeStyle=`rgba(255,242,207,${opacity*.85})`;
   for(let k=0;k<16;k++){
     const a=k*PI/8+t*.34;
     const d=r*(k%4===0?.83:.94);
     ctx.beginPath();ctx.moveTo(Math.cos(a)*d,Math.sin(a)*d);
     ctx.lineTo(Math.cos(a)*(r+ (k%4===0?9:4)),Math.sin(a)*(r+(k%4===0?9:4)));
     ctx.stroke();
   }
   ctx.restore();
 }
 function drawRear(t){
   b.clearRect(0,0,w,h);
   const cx=w/2,cy=h/2-8;
   // Charge before movement. The circle gives the cards a dramatic launch cue.
   const charge=smooth(t/.17)*(1-smooth((t-.28)/.22));
   if(charge>.008){
     const radius=45+65*smooth(t/.26);
     ring(b,cx,cy,radius,charge*.67,t*3);
     ring(b,cx,cy,radius*.68,charge*.33,-t*5);
   }
   // Anime speed-line fan burst, behind the real artwork, timed with card motion.
   const spread=smooth((t-.2)/.36)*(1-smooth((t-.73)/.22));
   if(spread>.008){
     b.save();b.globalCompositeOperation='lighter';
     for(let i=0;i<13;i++){
       const angle=PI*1.09+i/12*PI*.82;
       const reach=Math.min(w*.52,440)*(0.56+spread*.39);
       const x=cx+Math.cos(angle)*reach, y=cy+Math.sin(angle)*reach*.44;
       b.beginPath();b.moveTo(cx,cy);b.quadraticCurveTo(cx+(x-cx)*.5,cy-95,x,y);
       b.strokeStyle=`rgba(245,195,112,${spread*(i%3===0?.14:.075)})`;
       b.lineWidth=i%3===0?2.2:1;
       b.stroke();
     }
     b.restore();
   }
   // Short locking pulse under the finished seven-card fan.
   const lock=smooth((t-.73)/.045)*(1-smooth((t-.82)/.16));
   if(lock>.003){
      ring(b,cx,cy,95+290*smooth((t-.73)/.22),lock*.44,t*2);
   }
 }
 function drawFront(t){
   f.clearRect(0,0,w,h);
   const traceAlpha=smooth((t-.16)/.10)*(1-smooth((t-.78)/.18));
   const cy=h/2;
   f.save();f.globalCompositeOperation='lighter';
   for(let i=0;i<cards.length;i++){
     const r=cards[i].getBoundingClientRect();
     const x=r.left+r.width/2-bounds.left,y=r.top+r.height/2-bounds.top;
     const list=tracks[i];
     if(t<.93){list.push({x,y});if(list.length>13)list.shift();}
     if(traceAlpha>.004&&list.length>2){
       f.beginPath();
       for(let j=0;j<list.length;j++){
         const pt=list[j];if(j===0)f.moveTo(pt.x,pt.y);else f.lineTo(pt.x,pt.y);
       }
       f.strokeStyle=`rgba(249,198,112,${traceAlpha*.28})`;
       f.shadowColor='rgba(255,196,81,.95)';f.shadowBlur=19;f.lineWidth=8;f.stroke();
       f.shadowBlur=6;f.lineWidth=2.1;
       f.strokeStyle=`rgba(255,242,203,${traceAlpha*.82})`;
       f.stroke();
       // The glint travels at the card's leading edge, not over its picture.
       const speed=Math.hypot(x-(list.at(-3)?.x||x),y-(list.at(-3)?.y||y));
       if(speed>1.7){
         const ex=x+(i-(cards.length-1)/2<0?-1:1)*Math.min(55,r.width*.28);
         const ey=y-r.height*.34;
         const grad=f.createRadialGradient(ex,ey,0,ex,ey,13);
         grad.addColorStop(0,`rgba(255,251,224,${traceAlpha*.75})`);
         grad.addColorStop(.3,`rgba(255,208,115,${traceAlpha*.45})`);
         grad.addColorStop(1,'rgba(255,208,115,0)');
         f.fillStyle=grad;f.fillRect(ex-13,ey-13,26,26);
       }
     }
   }
   f.shadowBlur=0;
   // Tiny sparkling motes; no stock overlays, no card pixel resampling.
   const dustAlpha=smooth((t-.12)/.12)*(1-smooth((t-.88)/.12));
   if(dustAlpha>.008){
     const base=Math.min(w*.48,470);
     for(let i=0;i<dust.length;i++){
       const a=dust[i],angle=a.angle+t*a.drift*2.2;
       const radius=base*a.radius;
       const x=w*.5+Math.cos(angle)*radius;
       const y=cy-35+Math.sin(angle)*radius*.47-25*t*a.drift;
       const twinkle=.45+.55*Math.sin((t*17+a.phase*PI*2))**2;
       const alpha=dustAlpha*twinkle*.73;
       f.fillStyle=`rgba(253,225,161,${alpha})`;
       f.beginPath();f.arc(x,y,a.size,0,PI*2);f.fill();
       if(i%8===0){
         f.strokeStyle=`rgba(255,238,184,${alpha*.56})`;f.lineWidth=.8;
         f.beginPath();f.moveTo(x-5,y);f.lineTo(x+5,y);f.moveTo(x,y-5);f.lineTo(x,y+5);f.stroke();
       }
     }
   }
   f.restore();
 }
 function tick(now){
   if(stopped)return;
   frame=requestAnimationFrame(tick);
   if(now-lastFrame<1000/fps)return;
   lastFrame=now;
   const t=clamp((now-at)/duration);
   drawRear(t);drawFront(t);
   if(t>=1)stop();
 }
 frame=requestAnimationFrame(tick);
 function stop(){
   if(stopped)return;stopped=true;
   cancelAnimationFrame(frame);resizeObserver.disconnect();back.remove();front.remove();
 }
 return {stop};
}
