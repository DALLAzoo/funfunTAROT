/** In-between Shift — independent spatial atmosphere layer.
 * No changes to shuffle, fan, selection, reveal, or card art.
 * Uses on-screen card rectangles, so the shadow follows Web Animations as well.
 */
const stage = document.getElementById('stage');
const cardsHost = document.getElementById('cards');
if (stage && cardsHost && !stage.querySelector('.stage-depth')) {
  const layer = document.createElement('div');
  layer.className = 'stage-depth';
  layer.setAttribute('aria-hidden','true');
  for (const part of ['distance','beams','air','floor','horizon','deck-shadow','floor-glint','focus-shadow']) {
    const child = document.createElement('div');
    child.className = `stage-depth__${part}`;
    layer.appendChild(child);
  }
  stage.prepend(layer);

  // Mild mouse parallax on desktop. Touch dragging still belongs to the carousel.
  let pointerFrame = 0;
  let nextX = 0;
  let nextY = 0;
  const applyPointer = () => {
    pointerFrame = 0;
    const vars = {
      '--space-far-x': -nextX*.30, '--space-far-y': -nextY*.25,
      '--space-beam-x': -nextX*.10, '--space-beam-y': -nextY*.08,
      '--space-air-x': nextX*.38, '--space-air-y': nextY*.20,
      '--space-floor-x': nextX*.10
    };
    for (const [name,value] of Object.entries(vars))
      layer.style.setProperty(name,`${value.toFixed(1)}px`);
  };
  stage.addEventListener('pointermove',event => {
    if (event.pointerType && event.pointerType !== 'mouse') return;
    const r=stage.getBoundingClientRect();
    if (!r.width || !r.height) return;
    nextX = ((event.clientX-r.left)/r.width-.5)*22;
    nextY = ((event.clientY-r.top)/r.height-.5)*14;
    if (!pointerFrame) pointerFrame=requestAnimationFrame(applyPointer);
  },{passive:true});
  stage.addEventListener('pointerleave',()=>{
    nextX=0;nextY=0;
    if (!pointerFrame)pointerFrame=requestAnimationFrame(applyPointer);
  });

  // Sample a few times per second to avoid competing with the existing 3D render.
  // The deck silhouette is a soft shadow, not a real-time duplicate of card art.
  function update() {
    if (document.hidden || !stage.isConnected || !stage.getClientRects().length) return;
    const sr=stage.getBoundingClientRect();
    if(sr.width<10||sr.height<10)return;
    const visible=[...cardsHost.querySelectorAll('.tarot-card')]
      .filter(c=>!c.hidden && c.getClientRects().length);
    if(!visible.length)return;
    let left=Infinity,right=-Infinity,selected=null,nearWidth=0;
    for(const c of visible){
      const b=c.getBoundingClientRect();
      if(!b.width||!b.height)continue;
      left=Math.min(left,b.left);right=Math.max(right,b.right);
      nearWidth=Math.max(nearWidth,b.width);
      if(c.classList.contains('is-picked'))selected=b;
    }
    if(!Number.isFinite(left))return;
    const center=(left+right)/2-sr.left;
    const spread=Math.max(nearWidth*1.12,Math.min(sr.width*.94,(right-left)*.86));
    const active=stage.classList.contains('selection-stage');
    const shuffling=!active && !stage.classList.contains('idle-stack');
    layer.style.setProperty('--space-group-x',`${center.toFixed(1)}px`);
    layer.style.setProperty('--space-shadow-width',`${spread.toFixed(1)}px`);
    layer.style.setProperty('--space-shadow-alpha',shuffling?'.39':'.55');
    if(selected)layer.style.setProperty('--space-focus-x',`${(selected.left+selected.width/2-sr.left).toFixed(1)}px`);
    stage.classList.toggle('has-depth-choice',Boolean(selected&&active));
  }
  update();
  const timer=window.setInterval(update,85);
  window.addEventListener('pagehide',()=>{
    clearInterval(timer);
    if(pointerFrame)cancelAnimationFrame(pointerFrame);
  },{once:true});
}
