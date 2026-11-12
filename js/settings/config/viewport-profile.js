/* AD4: three layout families chosen from available viewport geometry. */
(() => {
  const touchLandscape=matchMedia('(orientation:landscape) and (hover:none) and (pointer:coarse)');
  const isPhoneLandscape=()=>touchLandscape.matches &&
    (innerHeight<=600 || (innerWidth<=960 && innerWidth/innerHeight<=1.32));
  const isRoomyTouchLandscape=()=>touchLandscape.matches && !isPhoneLandscape();
  const refresh=()=>{
    const phone=isPhoneLandscape();
    document.documentElement.classList.toggle('phone-landscape',phone);
    document.documentElement.classList.toggle('roomy-touch-landscape',isRoomyTouchLandscape());
  };
  window.tarotViewportProfile={isPhoneLandscape,isRoomyTouchLandscape,refresh};
  refresh();
  touchLandscape.addEventListener?.('change',refresh);
  addEventListener('resize',refresh,{passive:true});
  addEventListener('orientationchange',refresh,{passive:true});
})();
