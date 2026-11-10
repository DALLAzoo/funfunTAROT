// All stage sizes, counts and primary animation/material values live here.
// This is a local trial. The 20-card pool policy is NOT a production decision.
export const CONFIG = {
  breakpoint:600, aspect:2128/1240,
  counts:{shuffle:22,selection:20,visible:7,result:1},
  pool:{mode:'trial-uniform-subset',ids:[]}, // Alternative: 'explicit-ids'. Final policy pending.
  catalog:{additionalCards:[{id:"cups-page",name:"PAGE of CUPS",symbol:"♧"},{id:"wands-page",name:"PAGE of WANDS",symbol:"♧"},{id:"swords-page",name:"PAGE of SWORDS",symbol:"♧"},{id:"pentacles-page",name:"PAGE of PENTACLES",symbol:"♧"},{id:"swords-knight",name:"KNIGHT of SWORDS",symbol:"♧"}, {id:"wands-knight",name:"KNIGHT of WANDS",symbol:"♧"}, {id:"cups-knight",name:"KNIGHT of CUPS",symbol:"♧"},{id:"pentacles-knight",name:"KNIGHT of PENTACLES",symbol:"♧"}],frontImages:{"major-00":"./assets/card-fronts/major-00.png","major-01":"./assets/card-fronts/major-01.png","major-02":"./assets/card-fronts/major-02.png","major-03":"./assets/card-fronts/major-03.png","major-04":"./assets/card-fronts/major-04.png","major-05":"./assets/card-fronts/major-05.png","major-06":"./assets/card-fronts/major-06.png","major-07":"./assets/card-fronts/major-07.png","major-08":"./assets/card-fronts/major-08.png","major-09":"./assets/card-fronts/major-09.png","major-10":"./assets/card-fronts/major-10.png","major-11":"./assets/card-fronts/major-11.png","major-12":"./assets/card-fronts/major-12.png","major-13":"./assets/card-fronts/major-13.png","major-14":"./assets/card-fronts/major-14.png","major-15":"./assets/card-fronts/major-15.png","major-16":"./assets/card-fronts/major-16.png","major-17":"./assets/card-fronts/major-17.png","major-18":"./assets/card-fronts/major-18.png","major-19":"./assets/card-fronts/major-19.png","major-20":"./assets/card-fronts/major-20.png","major-21":"./assets/card-fronts/major-21.png","cups-page":"./assets/card-fronts/cups-page.png","wands-page":"./assets/card-fronts/wands-page.png","swords-page":"./assets/card-fronts/swords-page.png","pentacles-page":"./assets/card-fronts/pentacles-page.png","swords-knight":"./assets/card-fronts/swords-knight.png","wands-knight":"./assets/card-fronts/wands-knight.png","cups-knight":"./assets/card-fronts/cups-knight.png","pentacles-knight":"./assets/card-fronts/pentacles-knight.png"},requireActualFrontImages:false},
  sizes:{
    desktop:{shuffle:164,selection:210,transition:240,result:260},
    mobile:{shuffle:104,selection:146,transition:160,result:190}
  },
  camera:{perspective:1000},
  shuffle:{duration:3800,separate:560,radiusX:.41,radiusY:.25,nearDepth:.30,farDepth:-.27,turns:1.1,rotationY:50,rotationX:22},
  finale:{duration:3800,afterglow:280,pressure:6,waveReach:410,waveRadiusFraction:.48},
  carousel:{selectedLift:22,selectedLiftDuration:260,gap:.86,angle:18,centerDepth:70,depthStep:105,drop:32,move:260,enter:160,dragThreshold:34,dragLimit:9,clickGuard:320},
  reveal:{travel:920,pauseBeforeFlip:360,sweep:2800,sweepAlpha:.48,lift:480,focus:220,approach:430,arrival:360,flip:650,zoom:1.18,overscan:1.04,mode:'flip-after-arrival'},
  material:{radius:8,thickness:4,shadowY:5,shadowBlur:13,shadowAlpha:.18,edge:'#756f61',satinEdgeAlpha:.22},
  glow:{enabled:false,rgb:'213, 203, 245',intensity:.28,blur:16,pulseMs:3000,centerEmphasis:false,centerMultiplier:1,dragMultiplier:.35},
  vfx:{desktopDpr:1.5,mobileDpr:1,desktopParticles:150,mobileParticles:55,rgb:'238,190,103'},
  support:{maxCatalog:78,maxShuffle:78,visible:[3,5,7],result:[1]},
};
// The compact landscape profile follows viewport geometry, not device names.
// All existing portrait and desktop profiles remain independent.
let compactLandscapeQuery=null;
export function isCompactTouchLandscape(){
 if (typeof window==='undefined') return false;
 // Reuse the live MediaQueryList during animation sampling.
 compactLandscapeQuery ||= window.matchMedia?.('(orientation:landscape) and (max-height:559px) and (max-width:1100px) and (hover:none) and (pointer:coarse)');
 return !!compactLandscapeQuery?.matches;
}
// On a touch tablet in landscape, size cards to the LEFT stage width.
// This does not run on desktop, tablet portrait, or rotated phones.
export function isTabletLandscape(){
 return typeof window !== 'undefined' &&
  !!window.matchMedia?.('(orientation:landscape) and (min-width:760px) and (min-height:560px) and (hover:none) and (pointer:coarse)').matches;
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
export function stageSize(phase,width,config=CONFIG){
 // v60: one shared landscape scale follows available stage width AND screen height.
 // Topology remains the approved phone-left-controls-right or tablet-centered layout.
 const phoneLandscape=isCompactTouchLandscape();
 const effectiveWidth=phoneLandscape?Math.min(width,window.innerHeight):width;
 if (phoneLandscape) {
   const h=window.innerHeight;
   // Fit the COMPLETE card (including angled outer fan cards and their drop)
   // inside the actual stage height. The CSS shares the same viewport anchor.
   const stageHeight=document.getElementById('stage')?.clientHeight || Math.max(140,h*.76);
   const angle=23*Math.PI/180;
   const projectedFanHalf=config.aspect/2*Math.cos(angle)+.5*Math.sin(angle);
   const fanLimit=Math.max(78,(stageHeight/2-41)/projectedFanHalf);
   const idleLimit=compactShuffleWidth(width,stageHeight,h,config);
   if (phase==='shuffle') return idleLimit;
   if (phase==='selection') return Math.max(78,Math.min(134,width*.32,fanLimit));
   if (phase==='result') return Math.max(90,Math.min(166,width*.47,(h-116)/config.aspect));
   if (phase==='transition') return Math.max(85,Math.min(166,width*.45,(h-116)/config.aspect));
 }
 if (isTouchPortrait()) {
   const vw=window.innerWidth, vh=window.innerHeight;
   if (phase==='shuffle') return portraitWidth(vw,104,164);
   if (phase==='selection') return portraitWidth(vw,146,210);
   if (phase==='transition') return portraitWidth(vw,160,240);
   if (phase==='result') {
     const preferred=portraitWidth(vw,190,325);
     // Budget for the unchanged top title, a readable scroll pane and buttons.
     // Short portrait screens may go below the preferred minimum rather than clip.
     const anchor=Math.min(vh*.79,830);
     const reserve=(vw>=700?165:145)+(vw>=700?120:70);
     return Math.max(120,Math.min(preferred,(anchor-reserve)/config.aspect));
   }
 }
 if (isTabletLandscape()) {
   if (phase==='result') {
     // Larger tablet card, bounded by the real usable height above fixed controls.
     const titleZone=Math.min(175,Math.max(105,window.innerHeight*.19));
     return Math.min(345,Math.max(145,
       Math.min(width*.32,(window.innerHeight-titleZone-112)/config.aspect)));
   }
   if (phase==='selection') return Math.max(150,
     Math.min(255,width*.27,window.innerHeight*.31));
   if (phase==='shuffle') return Math.max(110,
     Math.min(185,width*.21,window.innerHeight*.24));
 }
 if (phase==='result' && isTabletPortrait()) {
   // Keep the existing tablet portrait layout, enlarge only its card.
   const tabletWidth=width<900?Math.min(325,width*.42):Math.min(350,width*.35);
   const heightCap=(window.innerHeight-365)/config.aspect;
   return Math.min(tabletWidth,Math.max(170,heightCap));
 }
 return config.sizes[effectiveWidth<config.breakpoint?'mobile':'desktop'][phase];
}
