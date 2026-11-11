/* A single responsive mode switch shared by layout CSS and animation code.
   A small tablet window is not a small physical screen. No device model names. */
(() => {
  const query = matchMedia('(orientation:landscape) and (max-height:559px) and (max-width:1100px) and (hover:none) and (pointer:coarse)');
  const largeTouchQuery = matchMedia('(orientation:landscape) and (min-width:760px) and (hover:none) and (pointer:coarse)');
  const shortSide = () => Math.min(screen.width || innerWidth, screen.height || innerHeight);
  const isPhoneLandscape = () => query.matches && shortSide() <= 600;
  const isRoomyTouchLandscape = () => largeTouchQuery.matches && shortSide() > 600;
  const refresh = () => {
    document.documentElement.classList.toggle('phone-landscape', isPhoneLandscape());
    document.documentElement.classList.toggle('roomy-touch-landscape', isRoomyTouchLandscape());
  };
  window.tarotViewportProfile = { isPhoneLandscape, isRoomyTouchLandscape, refresh };
  refresh();
  query.addEventListener?.('change', refresh);
  largeTouchQuery.addEventListener?.('change', refresh);
  addEventListener('resize', refresh, {passive:true});
  addEventListener('orientationchange', refresh, {passive:true});
})();
