/**
 * GoGo body-language gestures.
 * Single sprite + CSS motion — keep face identity, express intent with movement.
 */

export const GOGO_POSES = {
  idle: 'idle',
  walk: 'walk',
  walkto: 'walkto',
  wave: 'wave',
  welcome: 'welcome',
  speak: 'speak',
  think: 'think',
  point: 'point',
  bye: 'bye',
  nod: 'nod',
};

export const GOGO_POSE_CLASS = {
  idle: 'gogo-pose-idle',
  walk: 'gogo-pose-walk-in',
  walkto: 'gogo-pose-walk-to',
  wave: 'gogo-pose-wave',
  welcome: 'gogo-pose-welcome',
  speak: 'gogo-pose-speak',
  think: 'gogo-pose-think',
  point: 'gogo-pose-point',
  bye: 'gogo-pose-bye',
  nod: 'gogo-pose-nod',
  offstage: 'gogo-pose-offstage',
};

/** How long a one-shot gesture should hold before returning to idle (ms). */
export const GOGO_POSE_HOLD_MS = {
  wave: 1600,
  welcome: 1800,
  bye: 1400,
  nod: 900,
  point: 2800,
  think: 0, // held until cleared
  speak: 0, // held while speaking
  walk: 1000,
  walkto: 1200,
};

export function poseClassFor({ entered, listening, speaking, pose }) {
  if (!entered) return GOGO_POSE_CLASS.offstage;
  if (listening) return GOGO_POSE_CLASS.think;
  if (speaking && pose !== 'point' && pose !== 'walkto') return GOGO_POSE_CLASS.speak;
  return GOGO_POSE_CLASS[pose] || GOGO_POSE_CLASS.idle;
}
