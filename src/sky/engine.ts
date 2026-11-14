import * as Astronomy from 'astronomy-engine';
import type { Observer, SkyData, SkyObject, Vec3 } from './types';

const D2R = Math.PI / 180;
const R2D = 180 / Math.PI;

export const norm360 = (d: number) => ((d % 360) + 360) % 360;

/** Greenwich apparent sidereal time in degrees. */
export function gastDegrees(date: Date): number {
  return norm360(Astronomy.SiderealTime(date) * 15);
}

/**
 * Approximate precession of J2000 coordinates to the date (good to a few arc-seconds
 * within a few decades of J2000, far below what is visible on a phone screen).
 */
export function precessToDate(raDeg: number, decDeg: number, years: number): [number, number] {
  const ra = raDeg * D2R;
  const dec = decDeg * D2R;
  const dRa = ((3.07496 + 1.33621 * Math.sin(ra) * Math.tan(dec)) * years) / 240; // seconds of time -> deg
  const dDec = (20.0431 * Math.cos(ra) * years) / 3600; // arc-seconds -> deg
  return [norm360(raDeg + dRa), decDeg + dDec];
}

export function horizonFromEquatorial(
  raDeg: number,
  decDeg: number,
  gast: number,
  obs: Observer,
): { alt: number; az: number } {
  const H = (gast + obs.lon - raDeg) * D2R;
  const dec = decDeg * D2R;
  const lat = obs.lat * D2R;
  const sinAlt = Math.sin(dec) * Math.sin(lat) + Math.cos(dec) * Math.cos(lat) * Math.cos(H);
  const alt = Math.asin(Math.max(-1, Math.min(1, sinAlt)));
  const az = Math.atan2(-Math.cos(dec) * Math.sin(H), Math.sin(dec) * Math.cos(lat) - Math.cos(dec) * Math.sin(lat) * Math.cos(H));
  return { alt: alt * R2D, az: norm360(az * R2D) };
}

export function toVec(alt: number, az: number): Vec3 {
  const a = alt * D2R;
  const z = az * D2R;
  return [Math.cos(a) * Math.sin(z), Math.cos(a) * Math.cos(z), Math.sin(a)];
}

/** Rough star colour from B-V colour index. */
export function bvColor(bv: number): string {
  if (bv < 0) return '#9bb8ff';
  if (bv < 0.3) return '#cad8ff';
  if (bv < 0.6) return '#f4f1ff';
  if (bv < 0.9) return '#fff1d0';
  if (bv < 1.4) return '#ffd2a1';
  return '#ffb27a';
}

export type StarPos = { idx: number; alt: number; az: number; v: Vec3 };

/** Positions of all catalogue stars for a moment and place. */
export function computeStars(data: SkyData, date: Date, obs: Observer): StarPos[] {
  const gast = gastDegrees(date);
  const years = (date.getTime() - Date.UTC(2000, 0, 1, 12)) / (365.25 * 86400000);
  const out: StarPos[] = new Array(data.stars.length);
  for (let i = 0; i < data.stars.length; i++) {
    const s = data.stars[i];
    const [ra, dec] = precessToDate(s[0], s[1], years);
    const { alt, az } = horizonFromEquatorial(ra, dec, gast, obs);
    out[i] = { idx: i, alt, az, v: toVec(alt, az) };
  }
  return out;
}

export function computeConstellationPoint(
  ra: number,
  dec: number,
  gast: number,
  years: number,
  obs: Observer,
): Vec3 {
  const [r, d] = precessToDate(ra, dec, years);
  const { alt, az } = horizonFromEquatorial(r, d, gast, obs);
  return toVec(alt, az);
}

const PLANETS: { body: Astronomy.Body; name: string; color: string }[] = [
  { body: Astronomy.Body.Mercury, name: 'Mercury', color: '#c9c3b8' },
  { body: Astronomy.Body.Venus, name: 'Venus', color: '#fff3c4' },
  { body: Astronomy.Body.Mars, name: 'Mars', color: '#ff8a5c' },
  { body: Astronomy.Body.Jupiter, name: 'Jupiter', color: '#ffe3b3' },
  { body: Astronomy.Body.Saturn, name: 'Saturn', color: '#ead9a0' },
  { body: Astronomy.Body.Uranus, name: 'Uranus', color: '#a8f0f0' },
  { body: Astronomy.Body.Neptune, name: 'Neptune', color: '#8fb0ff' },
];

function bodyHorizon(body: Astronomy.Body, date: Date, ob: Astronomy.Observer) {
  const eq = Astronomy.Equator(body, date, ob, true, true);
  const hor = Astronomy.Horizon(date, ob, eq.ra, eq.dec, 'normal');
  return { alt: hor.altitude, az: hor.azimuth };
}

export function moonPhaseName(phaseDeg: number): string {
  const p = norm360(phaseDeg);
  if (p < 22.5 || p >= 337.5) return 'New Moon';
  if (p < 67.5) return 'Waxing Crescent';
  if (p < 112.5) return 'First Quarter';
  if (p < 157.5) return 'Waxing Gibbous';
  if (p < 202.5) return 'Full Moon';
  if (p < 247.5) return 'Waning Gibbous';
  if (p < 292.5) return 'Last Quarter';
  return 'Waning Crescent';
}

/** Sun, Moon and planets for a moment and place. */
export function computeSolarSystem(date: Date, obs: Observer): SkyObject[] {
  const ob = new Astronomy.Observer(obs.lat, obs.lon, 0);
  const out: SkyObject[] = [];

  const sun = bodyHorizon(Astronomy.Body.Sun, date, ob);
  out.push({ kind: 'sun', id: 'Sun', name: 'Sun', mag: -26.7, ...sun, v: toVec(sun.alt, sun.az), color: '#ffd84a' });

  const moon = bodyHorizon(Astronomy.Body.Moon, date, ob);
  const phase = Astronomy.MoonPhase(date);
  const illum = Astronomy.Illumination(Astronomy.Body.Moon, date);
  out.push({
    kind: 'moon',
    id: 'Moon',
    name: 'Moon',
    mag: illum.mag,
    ...moon,
    v: toVec(moon.alt, moon.az),
    color: '#f2f2e8',
    detail: `${moonPhaseName(phase)} · ${Math.round(illum.phase_fraction * 100)}% lit`,
  });

  for (const p of PLANETS) {
    const pos = bodyHorizon(p.body, date, ob);
    const ill = Astronomy.Illumination(p.body, date);
    out.push({ kind: 'planet', id: p.name, name: p.name, mag: ill.mag, ...pos, v: toVec(pos.alt, pos.az), color: p.color });
  }
  return out;
}

export function computeDsos(data: SkyData, date: Date, obs: Observer): SkyObject[] {
  const gast = gastDegrees(date);
  const years = (date.getTime() - Date.UTC(2000, 0, 1, 12)) / (365.25 * 86400000);
  return data.dsos.map(([id, alt, ra, dec, mag, type]) => {
    const [r, d] = precessToDate(ra, dec, years);
    const h = horizonFromEquatorial(r, d, gast, obs);
    return {
      kind: 'dso' as const,
      id,
      name: alt ? `${id} · ${alt}` : id,
      mag,
      alt: h.alt,
      az: h.az,
      v: toVec(h.alt, h.az),
      color: '#7fd1ff',
      detail: type,
    };
  });
}

export type BodyEvents = { name: string; riseUtc: Date | null; setUtc: Date | null; alt: number; mag: number };

/** Rise and set times (next 24 h) plus current altitude for the "Tonight" planner. */
export function tonightPlanner(date: Date, obs: Observer): BodyEvents[] {
  const ob = new Astronomy.Observer(obs.lat, obs.lon, 0);
  const bodies = [
    { body: Astronomy.Body.Moon, name: 'Moon' },
    ...PLANETS.map((p) => ({ body: p.body, name: p.name })),
  ];
  return bodies.map(({ body, name }) => {
    const rise = Astronomy.SearchRiseSet(body, ob, +1, date, 1);
    const set = Astronomy.SearchRiseSet(body, ob, -1, date, 1);
    const pos = bodyHorizon(body, date, ob);
    return {
      name,
      riseUtc: rise ? rise.date : null,
      setUtc: set ? set.date : null,
      alt: pos.alt,
      mag: Astronomy.Illumination(body, date).mag,
    };
  });
}

/** Naked-eye limiting magnitude factor for rendering: bigger dot for brighter stars. */
export function starRadius(mag: number): number {
  return Math.max(0.7, 3.6 - 0.62 * mag);
}
