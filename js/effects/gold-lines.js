// Shared fine gold strokes, in the caller's local screen coordinates.
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
  const start=seconds*(.55+j*.07)+j*2.12;
  // Short smoothly faded sections avoid a closed, frame-like ring.
  for(let k=0;k<28;k++){
   const a=start+k*.085,b=a+.09;
   const point=t=>[box.cx+Math.cos(t)*rx*(1+j*.045),box.cy+Math.sin(t)*ry*(.87+j*.09)+Math.sin(t*2+j)*8];
   const p=point(a),q=point((a+b)/2),r=point(b);
   const fade=Math.sin(Math.PI*(k+.5)/28)**.7;
   ctx.strokeStyle=`rgba(246,197,107,${alpha*fade*(.62-j*.08)})`;ctx.lineWidth=.85+j*.12;
   ctx.beginPath();ctx.moveTo(...p);ctx.quadraticCurveTo(...q,...r);ctx.stroke();
  }
 }
 ctx.restore();
}
