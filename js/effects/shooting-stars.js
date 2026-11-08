/* AD1 v30 — all meteor groups travel upper-right to lower-left; longer tails + random cosmic palette.
 * Based on v19. All group members share EXACTLY the same travel angle, while
 * their size, distance, start point, brightness, and speed can differ.
 * Far and near are BEHIND the cards. Some meteors cross IN FRONT.
 * Layers are pointer-transparent; no changes to shuffle/carousel/reveal.
 * No reduced-motion override: user-approved animations retain their timing.
 */
const rootIds = ['tarotApp', 'resultView'];
const roots = rootIds.map(id => document.getElementById(id)).filter(Boolean);

if (roots.length) {
  const layers = roots.map(root => {
    function layer(depth) {
      const el = document.createElement('div');
      el.className = `ad1-meteor-sky ad1-meteor-sky--${depth}`;
      el.setAttribute('aria-hidden', 'true');
      return el;
    }
    const far = layer('far');
    const near = layer('near');
    const front = layer('front');
    root.prepend(far, near, front);
    return {root,far,near,front};
  });

  const random = (min,max) => min + Math.random() * (max-min);
  const randomInt = (min,max) => Math.floor(random(min,max+1));
  const clamp = (n,min,max) => Math.max(min,Math.min(max,n));
  const pending = new Set();
  const active = new Set();
  let nextBurst = null;
  let disposed = false;
  let groupIndex = 0;
  const meteorPalettes = ['teal','purple','amber','gold'];

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

  // One fixed travel direction for ALL groups: upper-right to lower-left.
  // 145 degrees means dx < 0 and dy > 0. Cluster members still vary in
  // starting point, depth, speed, length and launch delay, not direction.
  function chooseAngle() {
    return 145 * Math.PI / 180;
  }

  function chooseCenter(layer, vw, vh) {
    const cardArea = layer.root.querySelector('#stage') ||
                     layer.root.querySelector('#resultCardHost');
    const area = cardArea?.getBoundingClientRect();
    // Sometimes the entire group crosses the card area. Otherwise it comes
    // from another region of the sky, instead of always following the deck.
    if (area && Math.random() < .42) {
      return {
        x: clamp(area.left + area.width*random(.40,.60),vw*.18,vw*.82),
        y: clamp(area.top + area.height*random(.38,.61),vh*.20,vh*.79)
      };
    }
    return {x:random(vw*.22,vw*.78),y:random(vh*.23,vh*.71)};
  }

  function shoot(group, depth, index) {
    if (disposed || document.hidden) return;
    const layer = visibleLayer();
    if (!layer) return;
    const vw = window.innerWidth, vh = window.innerHeight;
    if (vw < 1 || vh < 1) return;

    // Depth: far travels less, appears thinner and lasts longer;
    // foreground appears slightly larger and moves quicker.
    const specs = {
      far:   {distance:[160,240],duration:[1600,2180],length:[80,130], alpha:[.37,.57]},
      near:  {distance:[205,300],duration:[1340,1840],length:[110,170],alpha:[.50,.76]},
      front: {distance:[240,355],duration:[1140,1580],length:[140,215],alpha:[.54,.78]}
    };
    const spec = specs[depth];
    const distance = Math.min(Math.hypot(vw,vh)*.56,random(...spec.distance));
    const dx = Math.cos(group.angle)*distance;
    const dy = Math.sin(group.angle)*distance;
    // Same group center, staggered starting positions: like a loose cluster,
    // not unrelated shooting stars from several random directions.
    const lateral = (index-(group.count-1)/2)*random(18,37);
    const jitter = random(-17,17);
    const perpX = -Math.sin(group.angle)*(lateral+jitter);
    const perpY = Math.cos(group.angle)*(lateral+jitter);
    const ahead = random(-30,30);
    const x = clamp(group.center.x - dx*.5 + perpX + Math.cos(group.angle)*ahead, -35, vw+25);
    const y = clamp(group.center.y - dy*.5 + perpY + Math.sin(group.angle)*ahead, -35, vh+25);

    const palette = meteorPalettes[randomInt(0, meteorPalettes.length-1)];
    const element = document.createElement('span');
    element.className = `ad1-meteor ad1-meteor--${depth} ad1-meteor--${palette}`;
    element.dataset.meteorGroup = String(group.id);
    element.dataset.meteorAngle = group.angle.toFixed(6);
    element.dataset.meteorDepth = depth;
    element.style.left = `${x}px`;
    element.style.top = `${y}px`;
    element.style.setProperty('--meteor-length',`${Math.min(vw*.36,random(...spec.length))}px`);
    layer[depth].append(element);

    const alpha = random(...spec.alpha);
    const duration = random(...spec.duration);
    const angleDegrees = group.angle*180/Math.PI;
    const animation = element.animate([
      {offset:0,opacity:0,transform:`translate3d(0,0,0) rotate(${angleDegrees}deg)`},
      {offset:.15,opacity:alpha,transform:`translate3d(${dx*.15}px,${dy*.15}px,0) rotate(${angleDegrees}deg)`},
      {offset:.73,opacity:alpha*.86,transform:`translate3d(${dx*.73}px,${dy*.73}px,0) rotate(${angleDegrees}deg)`},
      {offset:1,opacity:0,transform:`translate3d(${dx}px,${dy}px,0) rotate(${angleDegrees}deg)`}
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
    const layer = visibleLayer();
    if (!layer) return;
    const dice = Math.random();
    const count = dice < .15 ? 2 : dice < .53 ? 3 : dice < .86 ? 4 : 5;
    const group = {
      id: ++groupIndex,
      count,
      angle: chooseAngle(),
      center: chooseCenter(layer,window.innerWidth,window.innerHeight)
    };
    const stagger = randomInt(85,165);
    for (let i=0; i<count; i++) {
      // All share one group angle, including those passing in front. Colors can differ per meteor.
      const diceDepth = Math.random();
      const depth = diceDepth < .24 ? 'front' : diceDepth < .56 ? 'near' : 'far';
      const delay = i===0 ? 0 : i*stagger + randomInt(0,38);
      if (delay === 0) shoot(group,depth,i);
      else {
        const id = setTimeout(() => {
          pending.delete(id);
          shoot(group,depth,i);
        },delay);
        pending.add(id);
      }
    }
  }

  function schedule(first=false) {
    if (disposed || document.hidden) return;
    if (nextBurst !== null) clearTimeout(nextBurst);
    nextBurst = setTimeout(() => {
      nextBurst = null;
      burst();
      schedule();
    }, first ? randomInt(950,1900) : randomInt(3800,6500));
  }

  // Desktop-only subtle parallax. The card stage NEVER moves; only the
  // pointer-transparent distant/near/foreground sky layers shift slightly.
  // Avoid pointer-driven work during card dragging or on touch devices.
  let frame = 0, mouseX = 0, mouseY = 0;
  function updateParallax() {
    frame = 0;
    for (const layer of layers) {
      layer.far.style.transform = `translate3d(${(mouseX*3).toFixed(2)}px,${(mouseY*2).toFixed(2)}px,0)`;
      layer.near.style.transform = `translate3d(${(mouseX*7).toFixed(2)}px,${(mouseY*5).toFixed(2)}px,0)`;
      layer.front.style.transform = `translate3d(${(mouseX*11).toFixed(2)}px,${(mouseY*8).toFixed(2)}px,0)`;
    }
  }
  function onPointerMove(e) {
    if (disposed || e.pointerType === 'touch' || window.innerWidth < 700 ||
        document.getElementById('stage')?.classList.contains('is-dragging')) return;
    mouseX = clamp(e.clientX/Math.max(1,window.innerWidth)*2-1,-1,1);
    mouseY = clamp(e.clientY/Math.max(1,window.innerHeight)*2-1,-1,1);
    if (!frame) frame = requestAnimationFrame(updateParallax);
  }
  window.addEventListener('pointermove',onPointerMove,{passive:true});

  document.addEventListener('visibilitychange',() => {
    if (document.hidden) {clearPending();clearActive();}
    else schedule(true);
  });
  window.addEventListener('pagehide',() => {
    disposed = true;
    clearPending();
    clearActive();
    if (frame) cancelAnimationFrame(frame);
    window.removeEventListener('pointermove',onPointerMove);
  },{once:true});
  schedule(true);
}
