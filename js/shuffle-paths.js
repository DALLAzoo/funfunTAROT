// Pure geometry, shared by the motion module and numeric checks.
export const SELECTION_COUNT = 9; // Trial count; the full deck remains 22.
const TAU = Math.PI * 2;
export function metrics(width, height) {
  const small = width < 600;
  return {width, height, radiusX:Math.min(width * .27, 285), radiusY:Math.min(height * .15, 82), depth:small ? 140 : 230};
}
// Eleven pairs have distinct phases, radii, speeds and tilted orbital planes.
// Opposite partners keep the deck centroid steady: no repeated whole-deck hop.
export function liftPose(index,m) {
  const p=orbitPose(index,0,m);
  return {...p,x:p.x*.72,y:-18+(p.y+18)*.72,z:p.z*.72,rot:p.rot*.7,ry:p.ry*.7,rx:p.rx*.7};
}
export function orbitPose(index,progress,m) {
  const k=index%11,side=index<11?1:-1;
  const direction=k%3===1?-1:1;
  const a=k*2.399963+direction*progress*TAU*(1.05+(k%4)*.07);
  const radius=.68+(k%5)*.065,tilt=(k-5)*.12;
  const x=Math.cos(a)*m.radiusX*radius;
  const y=Math.sin(a)*m.radiusY*.72*Math.cos(tilt)+Math.cos(a)*m.radiusY*.30*Math.sin(tilt);
  const z=Math.sin(a)*m.depth*(.80+(k%3)*.08);
  return {x:side*x,y:-18+side*y,z:side*z,
    rot:side*(Math.sin(a)*23+(k-5)*2),ry:side*Math.cos(a)*44,
    rx:side*Math.sin(a+tilt)*18,scale:.92};
}
export function stackPose(index, count = SELECTION_COUNT) {
  const t = count === 1 ? 0 : index / (count - 1) * 2 - 1;
  // The middle selection card is already nearest, before the fan opens.
  const z = index < count ? -Math.abs(t) * 8 : -30 - (index - count) * 1.2;
  return {x:0, y:-8, z, rot:0, ry:0, rx:0, scale:1};
}
export function fanPose(index, count, width) {
  const t = count === 1 ? 0 : index / (count - 1) * 2 - 1;
  const cardWidth = Math.max(65, Math.min(112, width * .18));
  const angle = 27 * Math.PI / 180;
  const edgeHalf = .92 * (cardWidth * Math.cos(angle) + cardWidth * 1.58 * Math.sin(angle)) / 2;
  const spread = Math.max(0, Math.min(width * .76, 710, width - 2 * (edgeHalf + 8)));
  return {x:t * spread * .5, y:23 + t * t * 37,
    z:(1 - t * t) * 45, rot:t * 27, ry:0, rx:0, scale:.92};
}
export function mixPose(a, b, t) {
  if (t <= 0) return {...a};
  if (t >= 1) return {...b};
  return Object.fromEntries(Object.keys(a).map(key=>[key, a[key] + (b[key] - a[key]) * t]));
}
export function smooth(t) { return t * t * (3 - 2 * t); }
