// Pure geometry, shared by the motion module and numeric checks.
export const SELECTION_COUNT = 9; // Trial count; the full deck remains 22.
const TAU = Math.PI * 2;
export function metrics(width, height) {
  const small = width < 600;
  return {width, height, radiusX:Math.min(width * .27, 285), radiusY:Math.min(height * .15, 82), depth:small ? 140 : 230};
}
export function liftPose(index, m) {
  const group = index % 3, lane = Math.floor(index / 3) - 3.5;
  return {x:(group - 1) * m.radiusX * .85 + lane * 3,
    y:-m.radiusY * .6 + lane * 4 - (group === 1 ? 30 : 0),
    z:(group - 1) * m.depth * .65 + lane * 5,
    rot:(group - 1) * 18 + lane * 2, ry:(group - 1) * 25, rx:lane * 2, scale:.9};
}
export function orbitPose(index, progress, m) {
  const group = index % 3, lane = Math.floor(index / 3) - 3.5;
  const direction = group === 1 ? -1 : 1;
  const angle = group * TAU / 3 + direction * progress * TAU * 1.15;
  const radius = 1 + lane * .025;
  return {x:Math.cos(angle) * m.radiusX * radius + lane * 3,
    y:-18 + Math.sin(angle * 2 + group * .55) * m.radiusY + lane * 4,
    z:Math.sin(angle) * m.depth + lane * 6,
    rot:Math.sin(angle) * 30 + (group - 1) * 12,
    ry:Math.cos(angle) * 48, rx:Math.sin(angle + group) * 20, scale:.92};
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
