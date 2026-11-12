// All stage sizes, counts and primary animation/material values live here.
// This is a local trial. The 20-card pool policy is NOT a production decision.
export const CONFIG = {
  breakpoint:600, aspect:2128/1240,
  counts:{shuffle:22,selection:20,visible:7,result:1},
  pool:{mode:'trial-uniform-subset',ids:[]}, // Alternative: 'explicit-ids'. Final policy pending.
  catalog:{additionalCards:[{id:"cups-page",name:"PAGE of CUPS",symbol:"♧"},{id:"wands-page",name:"PAGE of WANDS",symbol:"♧"},{id:"swords-page",name:"PAGE of SWORDS",symbol:"♧"},{id:"pentacles-page",name:"PAGE of PENTACLES",symbol:"♧"},{id:"swords-knight",name:"KNIGHT of SWORDS",symbol:"♧"}, {id:"wands-knight",name:"KNIGHT of WANDS",symbol:"♧"}, {id:"cups-knight",name:"KNIGHT of CUPS",symbol:"♧"},{id:"pentacles-knight",name:"KNIGHT of PENTACLES",symbol:"♧"}],frontImages:{"major-00":"./assets/card-fronts/major-00.png","major-01":"./assets/card-fronts/major-01.png","major-02":"./assets/card-fronts/major-02.png","major-03":"./assets/card-fronts/major-03.png","major-04":"./assets/card-fronts/major-04.png","major-05":"./assets/card-fronts/major-05.png","major-06":"./assets/card-fronts/major-06.png","major-07":"./assets/card-fronts/major-07.png","major-08":"./assets/card-fronts/major-08.png","major-09":"./assets/card-fronts/major-09.png","major-10":"./assets/card-fronts/major-10.png","major-11":"./assets/card-fronts/major-11.png","major-12":"./assets/card-fronts/major-12.png","major-13":"./assets/card-fronts/major-13.png","major-14":"./assets/card-fronts/major-14.png","major-15":"./assets/card-fronts/major-15.png","major-16":"./assets/card-fronts/major-16.png","major-17":"./assets/card-fronts/major-17.png","major-18":"./assets/card-fronts/major-18.png","major-19":"./assets/card-fronts/major-19.png","major-20":"./assets/card-fronts/major-20.png","major-21":"./assets/card-fronts/major-21.png","cups-page":"./assets/card-fronts/cups-page.png","wands-page":"./assets/card-fronts/wands-page.png","swords-page":"./assets/card-fronts/swords-page.png","pentacles-page":"./assets/card-fronts/pentacles-page.png","swords-knight":"./assets/card-fronts/swords-knight.png","wands-knight":"./assets/card-fronts/wands-knight.png","cups-knight":"./assets/card-fronts/cups-knight.png","pentacles-knight":"./assets/card-fronts/pentacles-knight.png"},requireActualFrontImages:false},
  sizes:{
    desktop:{idle:245,shuffle:164,selection:210,transition:240,result:260},
    mobile:{idle:170,shuffle:104,selection:146,transition:160,result:190}
  },
  camera:{perspective:1000},
  shuffle:{duration:3450,separate:560,radiusX:.41,radiusY:.25,nearDepth:.30,farDepth:-.27,turns:1.1,rotationY:50,rotationX:22},
  finale:{duration:3450,afterglow:280,pressure:6,waveReach:410,waveRadiusFraction:.48},
  carousel:{selectedLift:22,selectedLiftDuration:260,gap:.86,angle:18,centerDepth:70,depthStep:105,drop:32,move:260,enter:160,dragThreshold:34,dragLimit:9,clickGuard:320},
  reveal:{travel:920,pauseBeforeFlip:360,sweep:2800,sweepAlpha:.48,lift:480,focus:220,approach:430,arrival:360,flip:650,zoom:1.18,overscan:1.04,mode:'flip-after-arrival'},
  material:{radius:8,thickness:4,shadowY:5,shadowBlur:13,shadowAlpha:.18,edge:'#756f61',satinEdgeAlpha:.22},
  glow:{enabled:false,rgb:'213, 203, 245',intensity:.28,blur:16,pulseMs:3000,centerEmphasis:false,centerMultiplier:1,dragMultiplier:.35},
  vfx:{desktopDpr:1.5,mobileDpr:1,desktopParticles:150,mobileParticles:55,rgb:'238,190,103'},
  support:{maxCatalog:78,maxShuffle:78,visible:[3,5,7],result:[1]},
};
// CSS and JS share this one viewport + physical-screen classifier.
export function isCompactTouchLandscape(){
 return typeof window!=='undefined' && !!window.tarotViewportProfile?.isPhoneLandscape();
}
// On a touch tablet in landscape, size cards to the LEFT stage width.
// This does not run on desktop, tablet portrait, or rotated phones.
export function isTabletLandscape(){
 return typeof window!=='undefined' && !!window.tarotViewportProfile?.isRoomyTouchLandscape();
}
export function isTabletPortrait(){
 return typeof window !== 'undefined' &&
  !!window.matchMedia?.('(orientation:portrait) and (min-width:700px) and (hover:none) and (pointer:coarse)').matches;
}
// A compact stage must reserve genuine travel room for the ENTIRE rotated
// card, even at the front of the 3-D orbit. This is geometric, not device-named.
export function compactShuffleWidth(stageWidth,stageHeight,viewportHeight,config=CONFIG){
 const allowance=Math.max(78,(stageHeight/2-34)/1.22);
 return Math.max(78,Math.min(110,stageWidth*.30,viewportHeight*.31,allowance));
}
// Portrait and spacious-landscape tablets share one proportional card scale.
// Use the viewport's short side so rotation does not shrink the whole journey.
// Height/column limits are applied only where a visible card needs clearance.
export const isAdaptiveTablet=()=>isTabletPortrait()||isTabletLandscape();
function adaptiveTabletSize(phase,width,config){
 const vw=window.innerWidth, vh=window.innerHeight;
 const shortSide=Math.min(vw,vh);
 const ratio=Math.min(1.27,Math.max(.80,shortSide/820));
 const preferred={
  idle:Math.min(330,290*ratio),
  shuffle:Math.min(235,200*ratio),
  selection:Math.min(285,260*ratio),
  transition:Math.min(330,290*ratio),
  result:Math.min(392,355*ratio)
 }[phase];
 if(preferred===undefined)return null;
 // A taller tablet must not make the orbit occupy every unused pixel.
 if(phase==='shuffle')return Math.min(preferred,Math.max(128,width*.35));
 if(phase==='idle'){
  const stageHeight=document.getElementById('stage')?.clientHeight||vh*.64;
  return Math.min(preferred,Math.max(145,(stageHeight-35)/config.aspect));
 }
 if(phase==='selection')return Math.min(preferred,Math.max(140,width*.43));
 if(phase==='transition')return Math.min(preferred,Math.max(150,(vh-150)/config.aspect));
 // Reserve a real text area below the result card in portrait, and the title
 // and fixed action bar above/below the two-column result in landscape.
 if(isTabletPortrait())return tabletPortraitResultSize(vw,vh,config);
 const titleZone=Math.min(175,Math.max(105,vh*.19));
 const heightFit=Math.max(165,(vh-titleZone-108)/config.aspect);
 const columnFit=Math.max(165,(vw*.5-52));
 return Math.min(preferred,heightFit,columnFit);
}
// Portrait result cards use ONE continuous width path across the 700px
// layout handoff. Keep the approved phone reference (390px) and the existing
// tablet calculation (700px+) as anchors; interpolate only the bridge.
// This removes the smaller-screen / larger-card reversal without introducing
// an iPad-specific override or changing the result card on established tablets.
function portraitResultSize(vw,vh,config){
 const phonePreferred=portraitWidth(390,190,325);
 const phoneAnchor=Math.max(120,Math.min(phonePreferred,
  (Math.min(vh*.79,830)-215)/config.aspect));
 if(vw<390){
  const preferred=portraitWidth(vw,190,325);
  return Math.max(120,Math.min(preferred,
   (Math.min(vh*.79,830)-215)/config.aspect));
 }
 if(vw>=700)return Math.max(phoneAnchor,adaptiveTabletSize('result',vw,config));
 // The tablet endpoint is computed using its ORIGINAL 700px result
 // formula, independent of the active viewport classification.
 const tabletAnchor=Math.max(phoneAnchor,tabletPortraitResultSize(700,vh,config));
 const progress=(vw-390)/310;
 return phoneAnchor+(tabletAnchor-phoneAnchor)*progress;
}

// Layout classification stays at 700px, but the result sizing endpoint is
// geometric and can be evaluated on either side of that classification.
function tabletPortraitResultSize(vw,vh,config){
 const ratio=Math.min(1.27,Math.max(.80,vw/820));
 const preferred=Math.min(392,355*ratio);
 const reserved=Math.max(310,Math.min(470,vh*.35));
 const heightFit=Math.max(165,(vh-reserved)/config.aspect);
 const narrowPressure=Math.max(0,Math.min(1,(820-vw)/76));
 const shortPressure=Math.max(0,Math.min(1,(1240-vh)/90));
 const compactPressure=narrowPressure*shortPressure;
 const balancedHeightLimit=compactPressure>0
  ? vh*(.55-.12*compactPressure)/config.aspect : Infinity;
 return Math.min(preferred,heightFit,balancedHeightLimit);
}
export const deviceProfile=width=>width<CONFIG.breakpoint?'mobile':'desktop';
// Shared portrait scale: 390x844 -> phone reference; 820x1180 -> large portrait reference.
// Screen width determines the preferred size, available height can only reduce it.
export function isTouchPortrait(){
 return typeof window !== 'undefined' &&
  !!window.matchMedia?.('(orientation:portrait) and (hover:none) and (pointer:coarse)').matches;
}
const portraitWidth=(value,min,max)=>
 Math.min(max,Math.max(min,min+(Math.min(820,Math.max(390,value))-390)*(max-min)/430));
// A rotated phone keeps portrait sizing for all phases, including the final card.
// Stage width is already narrow because the portrait shell stays narrow.
function calculatePreferredStageSize(phase,width,config=CONFIG){
 // v60: one shared landscape scale follows available stage width AND screen height.
 // Topology remains the approved phone-left-controls-right or tablet-centered layout.
 const phoneLandscape=isCompactTouchLandscape();
 const effectiveWidth=phoneLandscape?Math.min(width,window.innerHeight):width;
 // Result geometry is continuous through the phone/tablet portrait split.
 // The existing portrait flex layout and result positioning are unchanged.
 if(isTouchPortrait() && phase==='result')
  return portraitResultSize(window.innerWidth,window.innerHeight,config);
 if (phoneLandscape) {
   const h=window.innerHeight;
   // Fit the COMPLETE card (including angled outer fan cards and their drop)
   // inside the actual stage height. The CSS shares the same viewport anchor.
   const stageHeight=document.getElementById('stage')?.clientHeight || Math.max(140,h*.76);
   const angle=23*Math.PI/180;
   const projectedFanHalf=config.aspect/2*Math.cos(angle)+.5*Math.sin(angle);
   // Preserve the original fan geometry. Use a smaller safety inset only for
   // the shorter phone landscape stage so fan cards are readable at center.
   const fanLimit=Math.max(78,(stageHeight/2-30)/projectedFanHalf);
   // Keep the opening deck and first shuffle at the user-approved fan card
   // size on phone landscape.  No changes to the shuffle/orbit choreography,
   // animation keyframes, or the later 3-D perspective motion.
   if (phase==='idle' || phase==='shuffle' || phase==='selection')
     return Math.max(78,Math.min(150,width*.37,fanLimit));
   if (phase==='result') return Math.max(90,Math.min(166,width*.47,(h-116)/config.aspect));
   if (phase==='transition') return Math.max(85,Math.min(166,width*.45,(h-116)/config.aspect));
 }
 // Tablet phase sizes are calculated together, before phone portrait and
 // older tablet fallbacks. Phone landscape continues to use its own branch.
 if(isAdaptiveTablet()) {
   const adaptive=adaptiveTabletSize(phase,width,config);
   if(adaptive!==null)return adaptive;
 }
 if (isTouchPortrait()) {
   const vw=window.innerWidth, vh=window.innerHeight;
   if (phase==='idle') return Math.min(245,Math.max(170,101.98+vw*.1744));
   if (phase==='shuffle') return portraitWidth(vw,104,164);
   if (phase==='selection') return portraitWidth(vw,146,210);
   if (phase==='transition') return portraitWidth(vw,160,240);
 }
 return config.sizes[effectiveWidth<config.breakpoint?'mobile':'desktop'][phase];
}

/** One final size gateway after the existing layout-specific preference.
 * Only constrain cards that must remain usable at rest or in the result.
 * First-shuffle travel deliberately stays free to leave the viewport.
 * Safe margins follow the approved 4% design token rather than a device list.
 * Preserve all existing layout anchors and preferred sizes when they fit.
 */
export function stageSize(phase,width,config=CONFIG){
 const preferred=calculatePreferredStageSize(phase,width,config);
 if(typeof window==='undefined')return preferred;
 const h=window.innerHeight;
 if(phase==='selection' && !isCompactTouchLandscape()){
  const stage=document.getElementById('stage');
  if(stage?.clientHeight){
   const stageHeight=stage.clientHeight;
   const lowerInset=Math.max(0,parseFloat(stage.style.getPropertyValue('--stage-bottom-clip-inset'))||0);
   // Rotated outer card projection at the original 23-degree fan endpoint.
   // Drop=35px; inset keeps the rest fan above the existing action buttons.
   const projectedHalfFactor=(Math.sin(23*Math.PI/180)+config.aspect*Math.cos(23*Math.PI/180))/2;
   const room=stageHeight/2-lowerInset-35-stageHeight*.04;
   if(room>0)return Math.min(preferred,Math.max(78,room/projectedHalfFactor));
  }
 }
 if(phase==='result' && window.matchMedia?.('(orientation:landscape) and (hover:hover) and (pointer:fine)').matches){
  // Before the result DOM is unhidden, a short desktop viewport still needs
  // a height cap. Other orientations and touch layouts keep their preferences.
  const titleAndGap=width>=1100?130:115;
  const safeHeight=h-titleAndGap-h*.04;
  return Math.min(preferred,Math.max(95,safeHeight/config.aspect));
 }
 return preferred;
}

/** Proportional sizing tokens for existing layout owners. No CSS override layer.
 * Base dimensions represent established reference layouts, not new device classes.
 * Usable area removes the agreed 4% on each edge; readable type has a floor.
 */
export function responsiveDesignMetrics(){
 if(typeof window==='undefined')return {scale:1,buttonScale:1,arrowScale:1};
 const vw=window.innerWidth,vh=window.innerHeight;
 const touch=!!window.matchMedia?.('(hover:none) and (pointer:coarse)').matches;
 // Baselines stay independent of reported device pixel density.
 // One continuous geometry scale for all TOUCH screens, regardless of
 // the layout category chosen by CSS. The gentle area exponent preserves
 // the phone reference at 390x844, avoids a jump at 700px/600px, and is
 // non-decreasing when either viewport dimension grows.
 // Desktop retains its existing reference so PC design is not re-scaled.
 const scale=touch
  ? Math.pow((vw*vh)/(390*844),.12)
  : Math.min(vw/1366,vh/768);
 return {scale:Math.max(.84,Math.min(1.22,scale)),
  buttonScale:Math.max(.88,Math.min(1.16,scale)),
  arrowScale:Math.max(.85,Math.min(1.2,scale))};
}
export function updateResponsiveDesignMetrics(){
 if(typeof document==='undefined')return;
 const metrics=responsiveDesignMetrics();
 const root=document.documentElement.style;
 root.setProperty('--ad4-ui-scale',metrics.scale.toFixed(4));
 root.setProperty('--ad4-button-scale',metrics.buttonScale.toFixed(4));
 root.setProperty('--ad4-arrow-scale',metrics.arrowScale.toFixed(4));
}
