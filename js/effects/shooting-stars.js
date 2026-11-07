/* AD1 v16 — one faint meteor at a random location every 12–20 seconds.
   CSS + WAAPI transform/opacity only; never touches card, carousel, or VFX clocks. */
const hosts = ['tarotApp', 'resultView']
  .map(id => document.getElementById(id))
  .filter(Boolean);

if (hosts.length) {
  const skies = hosts.map(host => {
    const layer = document.createElement('div');
    layer.className = 'ad1-meteor-sky';
    layer.setAttribute('aria-hidden', 'true');
    host.prepend(layer);
    return layer;
  });
  let timer = null;
  let stopped = false;
  const live = new Set();
  const random = (min,max) => min + Math.random() * (max-min);

  function releaseAll() {
    for (const {element,animation} of live) {
      animation.cancel(); element.remove();
    }
    live.clear();
  }

  function shoot() {
    if (stopped || document.hidden) return;
    const vw = window.innerWidth, vh = window.innerHeight;
    const rightward = Math.random() < .78;
    const dx = (rightward ? 1 : -1) * Math.min(vw*.23,random(85,190));
    const dy = Math.min(vh*.21,random(80,150));
    const x = rightward ? random(vw*.08,vw*.67) : random(vw*.29,vw*.89);
    const y = random(vh*.06,vh*.56);
    const angle = Math.atan2(dy,dx)*180/Math.PI;
    const duration = random(700,1200);
    const alpha = random(.44,.72);
    const length = random(42,82);
    for (const sky of skies) {
      const element = document.createElement('span');
      element.className = 'ad1-meteor';
      element.style.left = `${x}px`;
      element.style.top = `${y}px`;
      element.style.setProperty('--meteor-length',`${length}px`);
      sky.append(element);
      const animation=element.animate([
        {offset:0, opacity:0,transform:`translate3d(0,0,0) rotate(${angle}deg)`},
        {offset:.2,opacity:alpha,transform:`translate3d(${dx*.20}px,${dy*.20}px,0) rotate(${angle}deg)`},
        {offset:.72,opacity:alpha*.8,transform:`translate3d(${dx*.72}px,${dy*.72}px,0) rotate(${angle}deg)`},
        {offset:1,opacity:0,transform:`translate3d(${dx}px,${dy}px,0) rotate(${angle}deg)`}
      ], {duration,easing:'linear',fill:'both'});
      const item={element,animation};live.add(item);
      animation.finished.then(() => {live.delete(item);element.remove();}).catch(() => {});
    }
  }

  function schedule() {
    if (timer!==null) clearTimeout(timer);
    timer=null;
    if (stopped || document.hidden) return;
    timer=setTimeout(() => {
      timer=null;
      shoot();
      schedule();
    },random(12000,20000));
  }
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {if(timer!==null)clearTimeout(timer);timer=null;releaseAll();}
    else schedule();
  });
  window.addEventListener('pagehide', () => {
    stopped=true;if(timer!==null)clearTimeout(timer);releaseAll();
  },{once:true});
  schedule();
}
