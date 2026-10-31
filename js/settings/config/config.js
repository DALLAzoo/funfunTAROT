// All stage sizes, counts and primary animation/material values live here.
// This is a local trial. The 20-card pool policy is NOT a production decision.
export const CONFIG = {
  breakpoint:600, aspect:2128/1240,
  counts:{shuffle:22,selection:20,visible:7,result:1},
  pool:{mode:'trial-uniform-subset',ids:[]}, // Alternative: 'explicit-ids'. Final policy pending.
  catalog:{additionalCards:[],frontImages:{},requireActualFrontImages:false},
  sizes:{
    desktop:{shuffle:164,selection:210,transition:240,result:260},
    mobile:{shuffle:104,selection:146,transition:160,result:190}
  },
  camera:{perspective:1000},
  shuffle:{duration:3800,separate:560,radiusX:.41,radiusY:.25,nearDepth:.30,farDepth:-.27,turns:1.1,rotationY:50,rotationX:22},
  finale:{duration:1040,afterglow:280,pressure:6,waveReach:410,waveRadiusFraction:.48},
  carousel:{selectedLift:22,selectedLiftDuration:260,gap:.86,angle:18,centerDepth:70,depthStep:105,drop:32,move:260,enter:160,dragThreshold:34,dragLimit:9,clickGuard:320},
  reveal:{travel:920,pauseBeforeFlip:360,sweep:2800,sweepAlpha:.48,lift:480,focus:220,approach:430,arrival:360,flip:650,zoom:1.18,overscan:1.04,mode:'flip-after-arrival'},
  material:{thickness:4,shadowY:5,shadowBlur:13,shadowAlpha:.18,edge:'#756f61',satinEdgeAlpha:.22},
  glow:{enabled:false,rgb:'213, 203, 245',intensity:.28,blur:16,pulseMs:3000,centerEmphasis:false,centerMultiplier:1,dragMultiplier:.35},
  vfx:{desktopDpr:1.5,mobileDpr:1,desktopParticles:150,mobileParticles:55,rgb:'238,190,103'},
  support:{maxCatalog:78,maxShuffle:78,visible:[3,5,7],result:[1]},
};
export const deviceProfile=width=>width<CONFIG.breakpoint?'mobile':'desktop';
export function stageSize(phase,width,config=CONFIG){return config.sizes[width<config.breakpoint?'mobile':'desktop'][phase];}
