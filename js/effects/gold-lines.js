// Animated fine gold strands. Coordinates are local to the MagicVFX canvas.
// Cache geometry for 100ms. MagicVFX previously read every card rectangle
// on every rendered frame even though this is only a stage-center indicator.
let recent={cards:null,origin:null,at:-Infinity,box:null};
export function cardCloud(cards, origin={left:0,top:0}) {
 const now=performance.now();
 if(cards===recent.cards && origin===recent.origin && now-recent.at<100)return recent.box;
 const boxes=cards.filter(c=>!c.hidden).map(c=>c.getBoundingClientRect()).filter(b=>b.width&&b.height);
 if(!boxes.length){recent={cards,origin,at:now,box:null};return null;}
 const left=Math.min(...boxes.map(b=>b.left)),right=Math.max(...boxes.map(b=>b.right));
 const top=Math.min(...boxes.map(b=>b.top)),bottom=Math.max(...boxes.map(b=>b.bottom));
 const box={cx:(left+right)/2-origin.left,cy:(top+bottom)/2-origin.top,width:right-left,height:bottom-top};
 recent={cards,origin,at:now,box};return box;
}
export function goldLines(ctx,box,seconds,alpha=1,count=3){
 if(!box||alpha<=0)return;
 const rx=box.width*.57+16,ry=box.height*.56+16;
 ctx.save();ctx.lineCap='round';ctx.lineJoin='round';
 ctx.shadowColor='rgba(240,182,66,.5)';ctx.shadowBlur=3;
 for(let j=0;j<count;j++){
  const direction=j===1?-1:1;
  const speed=[2.25,1.82,2.63][j%3];
  const head=seconds*speed*direction+j*2.094;
  const span=[.92,1.18,.76][j%3],segments=36;
  const rxx=rx*(1+j*.045),ryy=ry*(.87+j*.09);
  const point=t=>[box.cx+Math.cos(t)*rxx,box.cy+Math.sin(t)*ryy+Math.sin(t*2+j)*8];
  for(let k=0;k<segments;k++){
   const t0=head-direction*span*(1-k/segments),t1=head-direction*span*(1-(k+1)/segments);
   const p=point(t0),m=point((t0+t1)/2),q=point(t1);
   const progress=(k+.5)/segments;
   const taper=Math.sin(Math.PI*progress)**1.1;
   const depth=.42+.58*(.5+.5*Math.sin((t0+t1)/2));
   const flicker=.88+.12*Math.sin(seconds*(3.1+j*.7)+j);
   ctx.strokeStyle=`rgba(246,197,107,${Math.min(1,alpha*taper*depth*flicker*(.92-j*.11))})`;
   ctx.lineWidth=.85+j*.12;
   ctx.beginPath();ctx.moveTo(...p);ctx.quadraticCurveTo(...m,...q);ctx.stroke();
  }
  const p=point(head);
  ctx.fillStyle=`rgba(255,218,151,${alpha*.48})`;
  ctx.beginPath();ctx.arc(p[0],p[1],.8,0,Math.PI*2);ctx.fill();
 }
 ctx.restore();
}
