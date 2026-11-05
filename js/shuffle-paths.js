// Compatibility exports; current motion reads config.js and cinema-core.js.
import {CONFIG as C} from './config.js';
import {travelPose,slotPose,stackPose,smooth,mix} from './cinema-core.js';
export const SELECTION_COUNT=C.counts.selection;
export const metrics=(width,height)=>({width,height});
export const orbitPose=(i,t,m)=>travelPose(i,t,m.width,m.height,C.counts.shuffle);
export const liftPose=(i,m)=>orbitPose(i,0,m);
export const fanPose=(i,count,width)=>slotPose(i-(count-1)/2,width);
export {stackPose,smooth,mix as mixPose};
