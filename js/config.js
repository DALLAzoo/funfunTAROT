// All stage sizes, counts and primary animation/material values live here.
// This is a local trial. The 20-card pool policy is NOT a production decision.
export const CONFIG = {
  breakpoint:600, aspect:1.58,
  counts:{shuffle:22,selection:20,visible:3,result:1},
  pool:{mode:'trial-uniform-subset',ids:[]}, // Alternative: 'explicit-ids'. Final policy pending.
  catalog:{additionalCards:[],frontImages:{},requireActualFrontImages:false},
  sizes:{
    desktop:{shuffle:164,selection:210,transition:240,result:260},
    mobile:{shuffle:104,selection:146,transition:160,result:190}
  },
  camera:{perspective:1000},
  shuffle:{duration:3800,separate:560,radiusX:.46,radiusY:.27,nearDepth:.48,farDepth:-.34,turns:1.1,rotationY:50,rotationX:22},
  finale:{duration:1040,afterglow:280,pressure:6,waveReach:410,waveRadiusFraction:.48},
  carousel:{gap:.86,angle:18,centerDepth:70,depthStep:105,drop:32,move:260,enter:160,dragThreshold:34,dragLimit:.85,clickGuard:320},
  reveal:{lift:600,focus:280,approach:760,arrival:760,flip:720,overscan:1.04,mode:'flip-after-arrival'},
  material:{thickness:2.2,shadowY:16,shadowBlur:30,shadowAlpha:.48,edge:'#756f61',satinEdgeAlpha:.22},
  glow:{enabled:true,rgb:'213, 203, 245',intensity:.28,blur:16,pulseMs:3000,centerEmphasis:true,centerMultiplier:1.55,dragMultiplier:.35},
  vfx:{desktopDpr:1.5,mobileDpr:1.25,desktopParticles:180,mobileParticles:100,rgb:'189,231,204'},
  support:{maxCatalog:78,maxShuffle:78,visible:[3,5],result:[1]},
};
export const deviceProfile=width=>width<CONFIG.breakpoint?'mobile':'desktop';
export function stageSize(phase,width,config=CONFIG){return config.sizes[width<config.breakpoint?'mobile':'desktop'][phase];}
