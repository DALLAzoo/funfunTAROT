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

  // In roomy tablet / desktop landscape, share the unused background space
  // above and below the card + reading row. The fixed button position, card
  // dimensions, reading panel and all portrait / compact layouts stay intact.
  const card = view.querySelector('.result-card-host');
  const actions = view.querySelector('.result-actions');
  let rowShift = 0;
  function balanceLandscapeResult(active) {
    // The heading moves into resultView only when a card is revealed.
    const title = view.querySelector('.intro');
    const landscape = innerWidth > innerHeight;
    const tablet = document.documentElement.classList.contains('roomy-touch-landscape');
    const desktop = matchMedia('(min-width:1100px) and (hover:hover) and (pointer:fine)').matches;
    if (!active || !landscape || !(tablet || desktop) || !title || !card || !actions) {
      if (rowShift !== 0) {
        rowShift = 0;
        view.style.setProperty('--ad4-result-row-shift', '0px');
      }
      return;
    }
    const heading = title.getBoundingClientRect();
    const c = card.getBoundingClientRect();
    const r = reading.getBoundingClientRect();
    const a = actions.getBoundingClientRect();
    // Subtract the previously applied shift to recover unshifted geometry.
    const contentTop = Math.min(c.top, r.top) - rowShift;
    const contentBottom = Math.max(c.bottom, r.bottom) - rowShift;
    const above = Math.max(0, contentTop - heading.bottom);
    const below = a.top - contentBottom;
    const safeGap = Math.max(12, innerHeight * 0.025);
    const desired = Math.max(0, Math.min((below - above) / 2, below - safeGap));
    const next = Math.round(desired * 10) / 10;
    if (Math.abs(rowShift - next) > 0.15) {
      rowShift = next;
      view.style.setProperty('--ad4-result-row-shift', `${next}px`);
    }
  }

  let raf = 0;
  const update = () => {
    raf = 0;
    const active = !view.hidden && view.classList.contains('is-revealed') &&
      !reading.hidden && reading.textContent.trim() !== '';
    balanceLandscapeResult(active);
    const r = active ? reading.getBoundingClientRect() : null;
    const hasMore = active && r.width > 30 && r.height > 30 &&
      reading.scrollHeight > reading.clientHeight + 3 &&
      reading.scrollTop + reading.clientHeight < reading.scrollHeight - 4;
    if (hasMore) {
      // Keep the indicator inside the reading's bottom-right border, even on narrow phones.
      const iconSize=cue.getBoundingClientRect().width||23;
      const gap=Math.max(3,iconSize*.1);
      cue.style.left = `${Math.min(window.innerWidth - iconSize-gap, Math.max(2, r.right - iconSize-gap))}px`;
      cue.style.top = `${Math.min(window.innerHeight - iconSize-gap, Math.max(2, r.bottom - iconSize-gap))}px`;
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
