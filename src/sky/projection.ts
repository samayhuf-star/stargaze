import type { Vec3, View } from './types';

const D2R = Math.PI / 180;

export type Projector = {
  project: (v: Vec3) => { x: number; y: number; depth: number } | null;
  degPerPx: number;
};

/**
 * Gnomonic projection centred on the view direction. `fov` is the vertical field of view in degrees.
 * Returns null for points behind the camera.
 */
export function makeProjector(view: View, width: number, height: number): Projector {
  const f = toForward(view);
  // right = forward x up(0,0,1) ; handle looking straight up/down
  let r: Vec3 = [f[1], -f[0], 0];
  const rl = Math.hypot(r[0], r[1]);
  r = rl < 1e-6 ? [Math.cos(view.az * D2R), -Math.sin(view.az * D2R), 0] : [r[0] / rl, r[1] / rl, 0];
  // up' = r x f
  const u: Vec3 = [
    r[1] * f[2] - r[2] * f[1],
    r[2] * f[0] - r[0] * f[2],
    r[0] * f[1] - r[1] * f[0],
  ];
  const scale = height / 2 / Math.tan((view.fov * D2R) / 2);
  const cx = width / 2;
  const cy = height / 2;
  return {
    degPerPx: view.fov / height,
    project: (v) => {
      const depth = v[0] * f[0] + v[1] * f[1] + v[2] * f[2];
      if (depth <= 0.05) return null;
      const xs = v[0] * r[0] + v[1] * r[1] + v[2] * r[2];
      const ys = v[0] * u[0] + v[1] * u[1] + v[2] * u[2];
      return { x: cx + (xs / depth) * scale, y: cy - (ys / depth) * scale, depth };
    },
  };
}

export function toForward(view: View): Vec3 {
  const a = view.alt * D2R;
  const z = view.az * D2R;
  return [Math.cos(a) * Math.sin(z), Math.cos(a) * Math.cos(z), Math.sin(a)];
}

export function clampAlt(alt: number): number {
  return Math.max(-89, Math.min(89, alt));
}
