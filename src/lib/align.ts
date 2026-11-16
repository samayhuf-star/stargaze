/**
 * Sky Align: pure logic for correcting compass and tilt error against a known bright object.
 *
 * The user centres a bright target (Moon, planet or first-magnitude star) in the reticle and taps
 * Lock. The difference between where the sensors say the phone points and where the target really
 * is becomes an offset applied to every later reading.
 */

export type Direction = { az: number; alt: number };
export type AlignCandidate = Direction & { id: string; name: string; kind: string; mag: number };
export type Alignment = { azOffset: number; altOffset: number; targetName: string; at: number };
export type AccuracyState = 'unaligned' | 'locked' | 'good' | 'drifting';

const D2R = Math.PI / 180;

/** Signed smallest difference a - b in degrees, in (-180, 180]. */
export function azDiff(a: number, b: number): number {
  const d = (((a - b) % 360) + 540) % 360 - 180;
  return d === -180 ? 180 : d;
}

/** Great-circle separation between two horizon directions, in degrees. */
export function separation(a: Direction, b: Direction): number {
  const s =
    Math.sin(a.alt * D2R) * Math.sin(b.alt * D2R) +
    Math.cos(a.alt * D2R) * Math.cos(b.alt * D2R) * Math.cos((a.az - b.az) * D2R);
  return Math.acos(Math.max(-1, Math.min(1, s))) / D2R;
}

/** Brightness cut-off for stars that are easy to recognise without help. */
export const ALIGN_STAR_MAG = 1.5;
/** How far the sensors may be off and still be matched to a target. */
export const ALIGN_MAX_SEPARATION = 35;
/** Targets this close to the horizon or zenith give poor azimuth corrections. */
export const ALIGN_MIN_ALT = 8;
export const ALIGN_MAX_ALT = 80;

/** True for objects bright and unambiguous enough to align on. The Sun is never offered. */
export function isAlignCandidate(o: AlignCandidate): boolean {
  if (o.alt < ALIGN_MIN_ALT || o.alt > ALIGN_MAX_ALT) return false;
  if (o.kind === 'moon') return true;
  if (o.kind === 'planet') return o.mag <= 1.5;
  if (o.kind === 'star') return o.mag <= ALIGN_STAR_MAG;
  return false;
}

/** Nearest usable target to where the phone currently points, or null if none is close enough. */
export function findAlignTarget(objects: AlignCandidate[], view: Direction): AlignCandidate | null {
  let best: AlignCandidate | null = null;
  let bestSep = ALIGN_MAX_SEPARATION;
  for (const o of objects) {
    if (!isAlignCandidate(o)) continue;
    const sep = separation(o, view);
    if (sep < bestSep) {
      best = o;
      bestSep = sep;
    }
  }
  return best;
}

/**
 * Offsets that make the raw sensor direction land on the target.
 * `raw` must be the uncorrected reading (no earlier alignment applied).
 */
export function computeAlignment(raw: Direction, target: AlignCandidate, now: number): Alignment {
  return {
    azOffset: azDiff(target.az, raw.az),
    altOffset: Math.max(-30, Math.min(30, target.alt - raw.alt)),
    targetName: target.name,
    at: now,
  };
}

/** Applies an alignment to a raw sensor direction. */
export function applyAlignment(raw: Direction, a: Alignment | null): Direction {
  if (!a) return raw;
  return {
    az: (((raw.az + a.azOffset) % 360) + 360) % 360,
    alt: Math.max(-90, Math.min(90, raw.alt + a.altOffset)),
  };
}

export const LOCKED_FOR_MS = 15 * 60 * 1000;
export const GOOD_FOR_MS = 60 * 60 * 1000;

/**
 * What the accuracy meter shows. Compass accuracy is the platform's 0..3 calibration level.
 * An alignment ages because magnetic interference changes as the user moves around.
 */
export function accuracyState(a: Alignment | null, compassAccuracy: number, now: number): AccuracyState {
  if (!a) return 'unaligned';
  const age = now - a.at;
  if (age < 0) return 'good';
  if (compassAccuracy < 1) return 'drifting';
  if (age <= LOCKED_FOR_MS && compassAccuracy >= 2) return 'locked';
  if (age <= GOOD_FOR_MS) return 'good';
  return 'drifting';
}

/** Meter fill 0..1 for each state. */
export function accuracyFill(s: AccuracyState): number {
  return s === 'locked' ? 1 : s === 'good' ? 0.7 : s === 'drifting' ? 0.35 : 0.15;
}

export function accuracyLabel(s: AccuracyState): string {
  return s === 'locked' ? 'Locked' : s === 'good' ? 'Good' : s === 'drifting' ? 'Drifting, align again' : 'Not aligned';
}
