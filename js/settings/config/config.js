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
// AD4 — single viewport-space size gateway.
// Three composition families are chosen by available geometry; NO device model
// dimensions are needed. Reference measurements describe the approved designs,
// not device-specific overrides. X/Y use independent fractions of real viewport.
export function isCompactTouchLandscape(){
 return typeof window!=='undefined' && !!window.tarotViewportProfile?.isPhoneLandscape();
}
export function isTabletLandscape(){
 return typeof window!=='undefined' && !!window.tarotViewportProfile?.isRoomyTouchLandscape();
}
export function isTouchPortrait(){
 return typeof window!=='undefined' && !!window.matchMedia?.('(orientation:portrait) and (hover:none) and (pointer:coarse)').matches;
}
export function isTabletPortrait(){
 // Kept for unchanged motion callers. It describes an available-space range,
 // not a separate source of size numbers.
 return isTouchPortrait() && window.innerWidth >= 700;
}
export const isAdaptiveTablet=()=>isTabletPortrait()||isTabletLandscape();
export const deviceProfile=width=>width<CONFIG.breakpoint?'mobile':'desktop';
export function compactShuffleWidth(stageWidth,stageHeight,viewportHeight,config=CONFIG){
 const allowance=Math.max(78,(stageHeight/2-34)/1.22);
 return Math.max(78,Math.min(110,stageWidth*.30,viewportHeight*.31,allowance));
}
const REF={
 portrait:{width:390,height:844,sizes:{idle:170,shuffle:104,selection:146,transition:160,result:190}},
 compact:{width:844,height:390,sizes:{idle:105,shuffle:105,selection:105,transition:155,result:155}},
 roomy:{width:1366,height:768,sizes:CONFIG.sizes.desktop}
};
const clamp=(n,a,b)=>Math.min(b,Math.max(a,n));
function viewportFamily(){
 if(typeof window==='undefined')return 'roomy';
 if(window.matchMedia?.('(orientation:portrait)').matches)return 'portrait';
 if(isCompactTouchLandscape())return 'compact';
 return 'roomy';
}
export function viewportSpace(){
 if(typeof window==='undefined')return {family:'roomy',width:1366,height:768,scale:1,inline:1256.72,block:706.56};
 const width=window.innerWidth,height=window.innerHeight,family=viewportFamily(),ref=REF[family];
 const inline=width*.92,block=height*.92;
 // Two independent axes: aspect-ratio differences become extra free background
 // space rather than making cards or sibling panels grow together incorrectly.
 const scale=Math.min(inline/(ref.width*.92),block/(ref.height*.92));
 return {family,width,height,inline,block,scale};
}
function portraitCardSize(phase,space,config){
 const {width,height,scale}=space;
 const preferred=REF.portrait.sizes[phase]*scale;
 // Protect real space for the intro, reading text, actions and gaps.
 // The fractions are common for ALL portrait viewports, not breakpoints.
 const occupied=space.block*(phase==='result'?.39:.18);
 const heightFit=Math.max(65,(space.block-occupied)/config.aspect);
 const widthFit=space.inline*(phase==='result'?.70:.48);
 return Math.min(preferred,heightFit,widthFit);
}
function compactCardSize(phase,space,config){
 const stage=document.getElementById('stage');
 const stageW=stage?.clientWidth || space.width*.47;
 const stageH=stage?.clientHeight || space.height*.68;
 const preferred=REF.compact.sizes[phase]*space.scale;
 const result=phase==='result'||phase==='transition';
 const columnWidth=space.inline*.5;
 // AD5 phone-landscape result only: make the revealed card use the available
 // 4%-inset height, ending on the unchanged fixed action bar's bottom line.
 // Tablets, foldable inner displays, portrait, PC and earlier phases retain
 // the original card sizing gateway.
 if(phase==='result' && space.width<=1000 && space.height<=500 &&
    space.width/space.height>=1.5){
  const gap=clamp(space.width*.017,8,18);
  const leftColumn=(space.inline-gap)*.425;
  return Math.max(64,Math.min(space.block/config.aspect,leftColumn*.88));
 }
 if(result)return Math.min(preferred,columnWidth*.80,Math.max(64,(space.block-95*space.scale)/config.aspect));
 if(phase==='selection'){
  const theta=23*Math.PI/180;
  const projection=(Math.sin(theta)+config.aspect*Math.cos(theta))/2;
  const available=Math.max(78,(stageH/2-24)/projection);
  return Math.min(preferred,stageW*.4,available);
 }
 return Math.min(preferred,stageW*.4,Math.max(78,(stageH-16)/config.aspect));
}
function roomyCardSize(phase,space,config){
 const desktop=!(window.matchMedia?.('(hover:none) and (pointer:coarse)').matches);
 if(desktop){
  // Preserve the desktop's original phase sizing and geometry.
  return config.sizes.desktop[phase];
 }
 const preferred=REF.roomy.sizes[phase]*space.scale;
 const columnWidth=(space.inline-clamp(space.width*.02,8,30))/2;
 if(phase==='result'||phase==='transition'){
  const pcColumn=(REF.roomy.width*.92-clamp(REF.roomy.width*.02,8,30))/2;
  const relativeCard=columnWidth*(REF.roomy.sizes[phase]/pcColumn);
  const heightFit=Math.max(68,(space.block-space.block*.25)/config.aspect);
  return Math.min(preferred,relativeCard,heightFit);
 }
 return Math.min(preferred,Math.max(75,(space.block-space.block*.22)/config.aspect));
}
export function stageSize(phase,width,config=CONFIG){
 const space=viewportSpace();
 if(space.family==='portrait'){
  const preferred=portraitCardSize(phase,space,config);
  // The settled fan may have a wider outer-card projection than a single card.
  // Do not clamp the FIRST SHUFFLE travel; it intentionally leaves the viewport.
  if(phase==='selection'){
   const stage=document.getElementById('stage');
   if(stage?.clientHeight){
    const theta=23*Math.PI/180;
    const projection=(Math.sin(theta)+config.aspect*Math.cos(theta))/2;
    const lowerInset=Math.max(0,parseFloat(stage.style.getPropertyValue('--stage-bottom-clip-inset'))||0);
    const room=stage.clientHeight/2-lowerInset-35-stage.clientHeight*.04;
    if(room>0)return Math.min(preferred,Math.max(65,room/projection));
   }
  }
  return preferred;
 }
 if(space.family==='compact')return compactCardSize(phase,space,config);
 const size=roomyCardSize(phase,space,config);
 if(phase==='result'){
  // Existing desktop short-height overflow guard, shared with roomy tablets.
  const heightFit=Math.max(95,(space.block-130)/config.aspect);
  return Math.min(size,heightFit);
 }
 return size;
}
export function responsiveDesignMetrics(){
 const {family,scale,width,height}=viewportSpace();
 if(family==='portrait'){
  // One smartphone design, two actual viewport axes. X controls horizontal
  // widths/margins; Y controls heights/spacing and undistorted text sizes.
  // No tablet cutoffs or independent button/font caps.
  const x=width/REF.portrait.width;
  const y=height/REF.portrait.height;
  return {scale:y,buttonScale:y,arrowScale:y,portraitX:x,portraitY:y};
 }
 if(family==='roomy' && !window.matchMedia?.('(hover:none) and (pointer:coarse)').matches){
  // Keep the established PC typography as reference.
  return {scale:1,buttonScale:1,arrowScale:1};
 }
 return {scale:clamp(scale,.78,2),buttonScale:clamp(scale,.78,1.85),arrowScale:clamp(scale,.78,1.8)};
}
export function updateResponsiveDesignMetrics(){
 if(typeof document==='undefined')return;
 const metrics=responsiveDesignMetrics();
 const root=document.documentElement.style;
 root.setProperty('--ad4-ui-scale',metrics.scale.toFixed(6));
 root.setProperty('--ad4-button-scale',metrics.buttonScale.toFixed(6));
 root.setProperty('--ad4-arrow-scale',metrics.arrowScale.toFixed(6));
 if(metrics.portraitX!==undefined){
  root.setProperty('--ad4-portrait-x',metrics.portraitX.toFixed(6));
  root.setProperty('--ad4-portrait-y',metrics.portraitY.toFixed(6));
 }else{
  root.removeProperty('--ad4-portrait-x');
  root.removeProperty('--ad4-portrait-y');
 }
}
