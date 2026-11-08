/* AD1 v28 — a prominent but restrained 900ms gold confirmation after taps.
 * Only three existing buttons are targeted. No button event is cancelled,
 * delayed or stopped; shuffle, dropdown and reveal handlers work as before.
 */
const ids = new Set(['shuffleBtn','resultAgain','readingDropdown']);
const timers = new WeakMap();
const held = new Map();

function targetButton(node) {
  if (!(node instanceof Element)) return null;
  const button = node.closest('button');
  return button && ids.has(button.id) ? button : null;
}
function press(button) {
  if (!button || button.disabled) return;
  const old = timers.get(button);
  if (old) clearTimeout(old);
  button.classList.remove('ad1-gold-hit--linger');
  button.classList.add('ad1-gold-hit--down');
}
function release(button) {
  if (!button || !button.classList.contains('ad1-gold-hit--down')) return;
  button.classList.remove('ad1-gold-hit--down', 'ad1-gold-hit--linger');
  // Restart the gold sweep on successive clicks, even when close together.
  void button.offsetWidth;
  button.classList.add('ad1-gold-hit--linger');
  const timer = setTimeout(() => {
    button.classList.remove('ad1-gold-hit--linger');
    timers.delete(button);
  }, 900);
  timers.set(button,timer);
}

document.addEventListener('pointerdown',e => {
  if (e.button!==0) return;
  const button=targetButton(e.target);
  if (!button || button.disabled) return;
  press(button);
  held.set(e.pointerId,button);
},true);
for(const event of ['pointerup','pointercancel']) {
  document.addEventListener(event,e => {
    const button=held.get(e.pointerId);
    if (!button) return;
    held.delete(e.pointerId);
    release(button);
  },true);
}
document.addEventListener('keydown',e => {
  if (e.repeat || (e.key!=='Enter' && e.key!==' ')) return;
  press(targetButton(e.target));
},true);
document.addEventListener('keyup',e => {
  if (e.key!=='Enter' && e.key!==' ') return;
  release(targetButton(e.target));
},true);
// Covers accessibility clicks and programmatic activation as well.
document.addEventListener('click',e => {
  const button=targetButton(e.target);
  if (!button || button.disabled) return;
  if (button.classList.contains('ad1-gold-hit--down')) {
    release(button);
  } else if (!button.classList.contains('ad1-gold-hit--linger')) {
    press(button);
    release(button);
  }
},true);
