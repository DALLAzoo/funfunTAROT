// Fine orbiting gold trails, drawn in the caller's local screen coordinates.
export function cardCloud(cards, origin={left:0,top:0}) {
 const boxes=cards.filter(c=>!c.hidden).map(c=>c.getBoundingClientRect()).filter(b=>b.width&&b.height);
 if(!boxes.length)return null;
 const left=Math.min(...boxes.map(b=>b.left)),right=Math.max(...boxes.map(b=>b.right));
 const top=Math.min(...boxes.map(b=>b.top)),bottom=Math.max(...boxes.map(b=>b.bottom));
 return {cx:(left+right)/2-origin.left,cy:(top+bottom)/2-origin.top,width:right-left,height:bottom-top};
}
export function goldLines(ctx, box, seconds, alpha=1, count=3) {
 if(!box||alpha<=0)return;
 const rx=box.width*.57+16,ry=box.height*.56+16;
 ctx.save();ctx.lineCap='round';ctx.lineJoin='round';ctx.shadowColor='rgba(240,182,66,.5)';ctx.shadowBlur=3;
 for(let j=0;j<count;j++){
  // A short trail has a visible moving head; the former long, uniform arcs looked stationary.
  const direction=j===1?-1:1;
  const head=seconds*(1.35+j*.23)*direction+j*2.12;
  const span=1.12+j*.13,segments=30;
  const point=t=>[box.cx+Math.cos(t)*rx*(1+j*.045),box.cy+Math.sin(t)*ry*(.87+j*.09)+Math.sin(t*2+j)*8];
  for(let k=0;k<segments;k++){
   const t0=head-direction*span*(1-k/segments),t1=head-direction*span*(1-(k+1)/segments);
   const p=point(t0),q=point((t0+t1)/2),r=point(t1);
   const progress=(k+.5)/segments;
   // Fade at both ends and subtly brighten the near half of each orbit.
   const taper=Math.sin(Math.PI*progress)**.75;
   const depth=.65+.35*Math.max(0,Math.sin((t0+t1)/2));
   ctx.strokeStyle=`rgba(246,197,107,${alpha*taper*depth*(.78-j*.1)})`;
   ctx.lineWidth=.85+j*.12;
   ctx.beginPath();ctx.moveTo(...p);ctx.quadraticCurveTo(...q,...r);ctx.stroke();
  }
 }
 ctx.restore();
}
