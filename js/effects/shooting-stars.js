/* AD1 v18 — randomized meteor groups, sometimes crossing in front of cards.
 * Background and foreground are lightweight, pointer-transparent DOM layers.
 * No carousel, shuffle, star-sparkle, or card-surface code is changed.
 * Requested motion plays at the same speed with prefers-reduced-motion on/off.
 */
const rootIds = ['tarotApp', 'resultView'];
const roots = rootIds.map(id => document.getElementById(id)).filter(Boolean);

if (roots.length) {
  const layers = roots.map(root => {
    const back = document.createElement('div');
    back.className = 'ad1-meteor-sky ad1-meteor-sky--back';
    back.setAttribute('aria-hidden', 'true');
    const front = document.createElement('div');
    front.className = 'ad1-meteor-sky ad1-meteor-sky--front';
    front.setAttribute('aria-hidden', 'true');
    root.prepend(back, front);
    return {root,back,front};
  });

  const random = (min,max) => min + Math.random()*(max-min);
  const randomInt = (min,max) => Math.floor(random(min,max+1));
  const clamp = (n,min,max) => Math.max(min,Math.min(max,n));
  const pending = new Set();
  const active = new Set();
  let nextBurst = null, disposed = false;

  const visibleLayer = () => layers.find(({root}) =>
    !root.hidden && window.getComputedStyle(root).display !== 'none') || null;

  function clearActive() {
    for (const entry of active) {
      entry.animation.cancel();
      entry.element.remove();
    }
    active.clear();
  }
  function clearPending() {
    if (nextBurst !== null) clearTimeout(nextBurst);
    nextBurst = null;
    for (const timer of pending) clearTimeout(timer);
    pending.clear();
  }

  function shoot(isFront = false) {
    if (disposed || document.hidden) return;
    const layersNow = visibleLayer();
    if (!layersNow) return;
    const vw = window.innerWidth, vh = window.innerHeight;
    if (vw < 1 || vh < 1) return;

    const rightward = Math.random() < .78;
    const dx = (rightward ? 1 : -1) * Math.min(vw * .40, random(110, 225));
    const dy = Math.min(vh * .32, random(80, 165));
    let x, y;
    if (isFront) {
      // Choose a trajectory through the central card area, not the buttons.
      const target = layersNow.root.querySelector('#resultCardHost') ||
                     layersNow.root.querySelector('#stage');
      const rect = target?.getBoundingClientRect();
      const anchorX = rect ? rect.left + rect.width*random(.42,.58) : vw*.50;
      const anchorY = rect ? rect.top + rect.height*random(.43,.59) : vh*.45;
      x = clamp(anchorX - dx*random(.30,.70), 8, vw-15);
      y = clamp(anchorY - dy*random(.30,.70), 8, vh-15);
    } else {
      x = rightward ? random(vw*.06,vw*.73) : random(vw*.27,vw*.90);
      y = random(vh*.06,vh*.67);
    }
    const sky = isFront ? layersNow.front : layersNow.back;
    const duration = random(720,1200);
    const length = Math.min(vw*.33,random(isFront?42:48,isFront?80:94));
    const alpha = random(isFront?.36:.41,isFront?.60:.74);
    const angle = Math.atan2(dy,dx)*180/Math.PI;
    const element = document.createElement('span');
    element.className = 'ad1-meteor';
    element.style.left = `${x}px`;
    element.style.top = `${y}px`;
    element.style.setProperty('--meteor-length',`${length}px`);
    sky.append(element);
    const animation = element.animate([
      {offset:0,opacity:0,transform:`translate3d(0,0,0) rotate(${angle}deg)`},
      {offset:.19,opacity:alpha,transform:`translate3d(${dx*.19}px,${dy*.19}px,0) rotate(${angle}deg)`},
      {offset:.70,opacity:alpha*.84,transform:`translate3d(${dx*.70}px,${dy*.70}px,0) rotate(${angle}deg)`},
      {offset:1,opacity:0,transform:`translate3d(${dx}px,${dy}px,0) rotate(${angle}deg)`}
    ],{duration,easing:'linear',fill:'both'});
    const entry = {element,animation};
    active.add(entry);
    animation.finished.then(() => {
      active.delete(entry);
      element.remove();
    }).catch(() => {
      active.delete(entry);
      element.remove();
    });
  }

  function burst() {
    if (disposed || document.hidden) return;
    // One, two, or three meteors per event. Occasionally two appear nearly together.
    const dice = Math.random();
    const count = dice < .30 ? 1 : dice < .76 ? 2 : 3;
    for (let i=0; i<count; i++) {
      const delay = i===0 ? 0 : randomInt(80,430);
      const foreground = Math.random() < .24;
      if (delay === 0) shoot(foreground);
      else {
        const id = setTimeout(() => {
          pending.delete(id);
          shoot(foreground);
        }, delay);
        pending.add(id);
      }
    }
  }

  function schedule(first=false) {
    if (disposed || document.hidden) return;
    if (nextBurst !== null) clearTimeout(nextBurst);
    // More activity than v16/v17, but never a continuous meteor shower.
    nextBurst = setTimeout(() => {
      nextBurst = null;
      burst();
      schedule();
    },first ? randomInt(2200,4800) : randomInt(6500,11500));
  }

  document.addEventListener('visibilitychange',() => {
    if (document.hidden) {clearPending();clearActive();}
    else schedule(true);
  });
  window.addEventListener('pagehide',() => {
    disposed = true;
    clearPending();
    clearActive();
  },{once:true});
  schedule(true);
}
