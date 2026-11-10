// Reading continuation cue: visual-only, no change to reading layout or text.
export function initReadingScrollCue() {
  const view = document.getElementById('resultView');
  const reading = document.getElementById('resultReading');
  if (!view || !reading) return;

  const cue = document.createElement('span');
  cue.className = 'ad2-reading-scroll-cue ad2-guide-disc';
  cue.setAttribute('aria-hidden', 'true');
  cue.innerHTML = '<svg class="ad2-guide-icon ad2-guide-icon--down" viewBox="0 0 24 24" focusable="false"><path d="m9 18 6-6-6-6"/></svg>';
  document.body.append(cue);

  let raf = 0;
  const update = () => {
    raf = 0;
    const active = !view.hidden && view.classList.contains('is-revealed') &&
      !reading.hidden && reading.textContent.trim() !== '';
    const r = active ? reading.getBoundingClientRect() : null;
    const hasMore = active && r.width > 30 && r.height > 30 &&
      reading.scrollHeight > reading.clientHeight + 3 &&
      reading.scrollTop + reading.clientHeight < reading.scrollHeight - 4;
    if (hasMore) {
      // Keep the indicator inside the reading's bottom-right border, even on narrow phones.
      cue.style.left = `${Math.min(window.innerWidth - 26, Math.max(2, r.right - 25))}px`;
      cue.style.top = `${Math.min(window.innerHeight - 26, Math.max(2, r.bottom - 25))}px`;
    }
    cue.classList.toggle('is-visible', Boolean(hasMore));
  };
  const schedule = () => {
    if (!raf) raf = requestAnimationFrame(update);
  };
  reading.addEventListener('scroll', schedule, {passive: true});
  window.addEventListener('resize', schedule, {passive: true});
  window.addEventListener('orientationchange', schedule, {passive: true});
  const observer = new MutationObserver(schedule);
  observer.observe(view, {attributes: true, attributeFilter: ['class', 'hidden']});
  observer.observe(reading, {childList: true, characterData: true, subtree: true, attributes: true, attributeFilter: ['hidden']});
  if ('ResizeObserver' in window) {
    const sizeObserver = new ResizeObserver(schedule);
    sizeObserver.observe(reading);
    sizeObserver.observe(view);
  }
  schedule();
}
