// Shared silent golden sparkles. All positions are in local canvas coordinates.
const TAU=Math.PI*2;
const fract=x=>x-Math.floor(x);
const rand=x=>fract(Math.sin(x*127.1+19.19)*43758.5453);
function sparkle(ctx,x,y,r,strength){
 if(strength<.015)return;
 const halo=ctx.createRadialGradient(x,y,0,x,y,r);
 halo.addColorStop(0,`rgba(255,249,222,${Math.min(.95,strength*.95)})`);
 halo.addColorStop(.12,`rgba(255,222,147,${strength*.62})`);
 halo.addColorStop(.43,`rgba(245,174,72,${strength*.19})`);
 halo.addColorStop(1,'rgba(245,174,72,0)');
 ctx.fillStyle=halo;ctx.beginPath();ctx.arc(x,y,r,0,TAU);ctx.fill();
 ctx.fillStyle=`rgba(255,249,225,${Math.min(1,strength)})`;
 ctx.beginPath();ctx.arc(x,y,.55+strength*.85,0,TAU);ctx.fill();
 if(strength>.5){ctx.strokeStyle=`rgba(255,230,165,${(strength-.5)*.35})`;ctx.lineWidth=.65;
 ctx.beginPath();ctx.moveTo(x-r*.28,y);ctx.lineTo(x+r*.28,y);ctx.moveTo(x,y-r*.28);ctx.lineTo(x,y+r*.28);ctx.stroke();}
}
// Distinct idle, shuffle, fan and travel distributions; no orbiting lines.
export function drawSparkleField(ctx,box,now,phase,alpha,width,height,reduced=false){
 if(!box||alpha<=0)return;
 const idle=phase==='idle',fan=phase==='selection',travel=phase==='travel';
 const count=idle?(width>=700?38:23):fan?(width>=700?23:16):travel?15:(width>=700?30:20);
 const time=now/1000;
 const areaW=idle?Math.min(width*.86,box.width*3.4+240):fan?box.width*1.05:travel?box.width*1.3:Math.min(width*.84,box.width*1.35+95);
 const areaH=idle?Math.min(height*.85,box.height*2.2+170):fan?box.height*1.1:travel?box.height*1.35:Math.min(height*.8,box.height*1.4+85);
 ctx.save();ctx.globalCompositeOperation='lighter';
 for(let i=0;i<count;i++){
  const life=idle?3.3+rand(i+3)*2.5:fan?2.6+rand(i+3)*1.8:1.3+rand(i+3)*1.4;
  const offset=rand(i+77)*life,cycle=(time+offset)/life,part=fract(cycle);
  // One strong silent 'ding' peak, with a soft tail.
  const pulse=Math.exp(-Math.pow((part-.31)/.105,2));
  const tail=Math.max(0,1-part)*.13;
  const intensity=(pulse*.95+tail)*alpha*(.65+rand(i+19)*.35);
  if(intensity<.018)continue;
  const drift=reduced?0:time*(idle?.012:fan?.007:.023);
  const px=rand(i*3+11),py=rand(i*3+12);
  const x=box.cx+(px-.5)*areaW+Math.sin(drift+i*2.7)*(idle?12:5);
  const y=box.cy+(py-.5)*areaH+Math.cos(drift*.8+i*3.1)*(idle?9:4);
  if(x<0||y<0||x>width||y>height)continue;
  sparkle(ctx,x,y,(idle?12:9)+rand(i+33)*(idle?15:12),intensity);
 }
 ctx.restore();
}
