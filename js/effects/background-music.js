/* AD1 v35 — single-track BGM, optional user-triggered playback.
   No autoplay, no changes to existing card/shuffle/dropdown logic. */
const audio = document.getElementById('bgmAudio');
const button = document.getElementById('bgmToggle');
const label = document.getElementById('bgmLabel');

if (audio && button && label) {
  const targetVolume = 0.18;
  let enabled = false;
  let fadeId = 0;
  let operation = 0;
  audio.volume = 0;

  function updateButton(isOn) {
    button.setAttribute('aria-pressed', String(isOn));
    button.setAttribute('aria-label', isOn ? '배경음 끄기' : '배경음 켜기');
    button.title = isOn ? '배경음 끄기' : '배경음 켜기';
    label.textContent = isOn ? '음악 끄기' : '음악 켜기';
  }

  function fadeVolume(to, duration, done) {
    if (fadeId) cancelAnimationFrame(fadeId);
    fadeId = 0;
    const from = audio.volume;
    const begin = performance.now();
    function frame(now) {
      const progress = Math.min(1,(now-begin)/duration);
      const eased = 1-Math.pow(1-progress,2);
      audio.volume = Math.max(0,Math.min(1,from + (to-from)*eased));
      if (progress < 1) fadeId = requestAnimationFrame(frame);
      else {fadeId=0; if (done) done();}
    }
    fadeId = requestAnimationFrame(frame);
  }

  button.addEventListener('click', () => {
    operation += 1;
    const thisOperation = operation;
    if (enabled) {
      enabled = false;
      updateButton(false);
      fadeVolume(0,380,() => {
        if (thisOperation === operation && !enabled) audio.pause();
      });
      return;
    }

    enabled = true;
    updateButton(true);
    if (fadeId) {cancelAnimationFrame(fadeId);fadeId=0;}
    // Call play() inside the user's click to satisfy mobile autoplay policies.
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
      });
    } else {
      fadeVolume(targetVolume,650);
    }
  });

  audio.addEventListener('error', () => {
    operation += 1;
    enabled = false;
    if (fadeId) {cancelAnimationFrame(fadeId);fadeId=0;}
    audio.pause();
    audio.volume = 0;
    updateButton(false);
  });
  updateButton(false);
}
