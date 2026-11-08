/* v38 — existing single-track BGM + movable music-note button.
   Short click toggles BGM with fade; dragging only repositions the icon. */
const audio = document.getElementById('bgmAudio');
const button = document.getElementById('bgmToggle');
const label = document.getElementById('bgmLabel');
const control = button?.closest('.ad1-bgm-control');

if (audio && button && label && control) {
  const targetVolume = 0.18;
  const EDGE = 10;
  const SIZE = 44;
  const HINT_DURATION = 1500;
  const STORAGE_KEY = 'ad1-bgm-note-position-v38';
  let enabled = false;
  let fadeId = 0;
  let operation = 0;
  let hintTimer = 0;
  let drag = null;
  let suppressNextClick = false;
  let position = null;
  audio.volume = 0;

  const clamp = (v, min, max) => Math.min(Math.max(v,min),Math.max(min,max));
  function insideViewport(x,y) {
    return {
      x: clamp(x,EDGE,window.innerWidth-SIZE-EDGE),
      y: clamp(y,EDGE,window.innerHeight-SIZE-EDGE)
    };
  }
  function chooseExpansionSide() {
    if (!position) return;
    button.dataset.expandSide = position.x + 126 + EDGE > window.innerWidth ? 'left' : 'right';
  }
  function setPosition(x,y) {
    position = insideViewport(x,y);
    control.style.left = `${position.x}px`;
    control.style.top = `${position.y}px`;
    control.style.right = 'auto';
    control.style.bottom = 'auto';
    chooseExpansionSide();
  }
  function savePosition() {
    if (!position) return;
    try {
      localStorage.setItem(STORAGE_KEY,JSON.stringify({
        x: position.x/Math.max(1,window.innerWidth-SIZE),
        y: position.y/Math.max(1,window.innerHeight-SIZE)
      }));
    } catch (_) { /* private browsing can disallow storage */ }
  }
  function initializePosition() {
    const rect = control.getBoundingClientRect();
    let x = rect.left, y = rect.top;
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
      if (saved && Number.isFinite(saved.x) && Number.isFinite(saved.y)) {
        x = saved.x*Math.max(1,window.innerWidth-SIZE);
        y = saved.y*Math.max(1,window.innerHeight-SIZE);
      }
    } catch (_) { /* use original lower-left position */ }
    setPosition(x,y);
  }

  function updateButton(isOn) {
    button.setAttribute('aria-pressed',String(isOn));
    button.setAttribute('aria-label',isOn ? '배경음 끄기 (끌어서 위치 이동)' : '배경음 켜기 (끌어서 위치 이동)');
    button.title = (isOn ? '배경음 끄기' : '배경음 켜기') + ' · 드래그하여 이동';
  }
  function showHint(message) {
    clearTimeout(hintTimer);
    label.textContent = message;
    chooseExpansionSide();
    button.classList.add('is-expanded');
    hintTimer = window.setTimeout(() => button.classList.remove('is-expanded'),HINT_DURATION);
  }
  function fadeVolume(to,duration,done) {
    if (fadeId) cancelAnimationFrame(fadeId);
    fadeId = 0;
    const from = audio.volume;
    const begin = performance.now();
    function frame(now) {
      const p = Math.min(1,(now-begin)/duration);
      const eased = 1-Math.pow(1-p,2);
      audio.volume = clamp(from+(to-from)*eased,0,1);
      if (p<1) fadeId=requestAnimationFrame(frame);
      else {fadeId=0;if(done)done();}
    }
    fadeId=requestAnimationFrame(frame);
  }
  function toggleMusic() {
    operation += 1;
    const thisOperation = operation;
    if (enabled) {
      enabled = false;
      updateButton(false);
      showHint('음악 끄기');
      fadeVolume(0,380,() => {
        if (thisOperation === operation && !enabled) audio.pause();
      });
      return;
    }
    enabled = true;
    updateButton(true);
    showHint('음악 켜기');
    if (fadeId) {cancelAnimationFrame(fadeId);fadeId=0;}
    // Must happen in the click handler to satisfy mobile audio activation rules.
    const attempt = audio.play();
    if (attempt && typeof attempt.then === 'function') {
      attempt.then(() => {
        if (thisOperation === operation && enabled) fadeVolume(targetVolume,650);
      }).catch(() => {
        if (thisOperation !== operation) return;
        enabled = false;
        audio.pause();
        audio.volume = 0;
        updateButton(false);
        showHint('재생 실패');
      });
    } else {
      fadeVolume(targetVolume,650);
    }
  }

  button.addEventListener('pointerdown',(event) => {
    if (event.button !== 0 || drag) return;
    suppressNextClick = false;
    drag = {
      id: event.pointerId, x: event.clientX, y: event.clientY,
      ox: position.x, oy: position.y, moved: false
    };
    try { button.setPointerCapture(event.pointerId); } catch (_) {}
  });
  button.addEventListener('pointermove',(event) => {
    if (!drag || event.pointerId !== drag.id) return;
    const dx=event.clientX-drag.x, dy=event.clientY-drag.y;
    if (!drag.moved && Math.hypot(dx,dy) < 7) return;
    if (!drag.moved) {
      drag.moved = true;
      suppressNextClick = true;
      clearTimeout(hintTimer);
      button.classList.remove('is-expanded');
      button.classList.add('is-dragging');
    }
    setPosition(drag.ox+dx,drag.oy+dy);
  });
  function releaseDrag(event) {
    if (!drag || event.pointerId !== drag.id) return;
    const moved = drag.moved;
    drag = null;
    button.classList.remove('is-dragging');
    if (moved) savePosition();
    try { if(button.hasPointerCapture(event.pointerId))button.releasePointerCapture(event.pointerId); } catch (_) {}
  }
  button.addEventListener('pointerup',releaseDrag);
  button.addEventListener('pointercancel',releaseDrag);
  button.addEventListener('click',(event) => {
    if (suppressNextClick) {
      event.preventDefault();
      event.stopPropagation();
      suppressNextClick = false;
      return;
    }
    toggleMusic();
  });
  window.addEventListener('resize',() => {
    if (position) {setPosition(position.x,position.y);savePosition();}
  },{passive:true});

  audio.addEventListener('error',() => {
    operation += 1;
    enabled = false;
    if (fadeId) {cancelAnimationFrame(fadeId);fadeId=0;}
    audio.pause();
    audio.volume = 0;
    updateButton(false);
    showHint('재생 실패');
  });
  initializePosition();
  updateButton(false);
}
