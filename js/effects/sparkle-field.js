// Persistent viewport-fixed golden glints; never attached to the stage or cards.
const TAU=Math.PI*2;
const fract=n=>n-Math.floor(n);
const rand=n=>fract(Math.sin(n*127.1+19.19)*43758.5453);
let started=false;
export function startScreenSparkles(){
 if(started)return;started=true;
 const canvas=document.createElement('canvas');canvas.className='screen-sparkle-field';
 canvas.setAttribute('aria-hidden','true');
 Object.assign(canvas.style,{position:'fixed',left:'0',top:'0',width:'100vw',height:'100vh',zIndex:'9',pointerEvents:'none',contain:'strict'});
 document.body.append(canvas);
 const ctx=canvas.getContext('2d');if(!ctx)return;
 let w=0,h=0,dpr=1;
 const resize=()=>{w=window.innerWidth;h=window.innerHeight;dpr=Math.min(window.devicePixelRatio||1,2);
  canvas.width=Math.round(w*dpr);canvas.height=Math.round(h*dpr);ctx.setTransform(dpr,0,0,dpr,0,0);};
 window.addEventListener('resize',resize,{passive:true});resize();
 const draw=now=>{
  ctx.clearRect(0,0,w,h);
  if(!document.hidden){
   const seconds=now/1000,area=w*h,count=Math.max(16,Math.min(55,Math.round(area/22000)));
   ctx.save();ctx.globalCompositeOperation='lighter';
   for(let i=0;i<count;i++){
    const life=2.8+rand(i+17)*3.4;
    const cycle=(seconds+rand(i+71)*life)/life;
    const pulse=fract(cycle);
    const flash=Math.exp(-Math.pow((pulse-.32)/.085,2));
    const tail=Math.max(0,1-pulse)*.09;
    const a=(flash*.86+tail)*(.6+rand(i+39)*.4);
    if(a<.025)continue;
    // Positions are constant within the viewport, independent of card transforms and drag.
    const x=(.035+rand(i*5+11)*.93)*w;
    const y=(.05+rand(i*5+12)*.9)*h;
    const r=11+rand(i+43)*17;
    const g=ctx.createRadialGradient(x,y,0,x,y,r);
    g.addColorStop(0,`rgba(255,250,222,${a*.93})`);
    g.addColorStop(.12,`rgba(255,222,143,${a*.61})`);
    g.addColorStop(.44,`rgba(243,174,72,${a*.19})`);
    g.addColorStop(1,'rgba(243,174,72,0)');
    ctx.fillStyle=g;ctx.beginPath();ctx.arc(x,y,r,0,TAU);ctx.fill();
    ctx.fillStyle=`rgba(255,252,230,${Math.min(1,a)})`;
    ctx.beginPath();ctx.arc(x,y,.6+a*.85,0,TAU);ctx.fill();
    if(a>.55){ctx.strokeStyle=`rgba(255,230,165,${(a-.55)*.25})`;ctx.lineWidth=.6;
      ctx.beginPath();ctx.moveTo(x-r*.2,y);ctx.lineTo(x+r*.2,y);ctx.moveTo(x,y-r*.2);ctx.lineTo(x,y+r*.2);ctx.stroke();}
   }
   ctx.restore();
  }
  requestAnimationFrame(draw);
 };
 requestAnimationFrame(draw);
}
