import * as Astronomy from 'astronomy-engine';
import data from '../src/data/sky-data.json';
import { precessToDate, horizonFromEquatorial, gastDegrees, computeStars, computeSolarSystem, tonightPlanner, toVec } from '../src/sky/engine';
import { makeProjector } from '../src/sky/projection';
import type { SkyData } from '../src/sky/types';

const sky = data as unknown as SkyData;
let failed = 0;
const ok = (name: string, cond: boolean, info = '') => {
  console.log(`${cond ? 'PASS' : 'FAIL'}  ${name} ${info}`);
  if (!cond) failed++;
};

// 1. Precession vs astronomy-engine (Sirius, J2000 -> 2026-11-14)
const date = new Date('2026-11-14T16:00:00Z');
const t = Astronomy.MakeTime(date);
const rot = Astronomy.Rotation_EQJ_EQD(t);
const sirius = { ra: 101.2875, dec: -16.7161 };
const vec = Astronomy.VectorFromSphere(new Astronomy.Spherical(sirius.dec, sirius.ra, 1), t);
const eq = Astronomy.EquatorFromVector(Astronomy.RotateVector(rot, vec));
const [pra, pdec] = precessToDate(sirius.ra, sirius.dec, (date.getTime() - Date.UTC(2000, 0, 1, 12)) / (365.25 * 86400000));
ok('precession RA within 0.03 deg', Math.abs(pra - eq.ra * 15) < 0.03, `mine=${pra.toFixed(4)} ref=${(eq.ra * 15).toFixed(4)}`);
ok('precession Dec within 0.03 deg', Math.abs(pdec - eq.dec) < 0.03, `mine=${pdec.toFixed(4)} ref=${eq.dec.toFixed(4)}`);

// 2. Horizon conversion vs astronomy-engine for Sirius from Delhi
const obs = { lat: 28.6139, lon: 77.209 };
const mine = horizonFromEquatorial(pra, pdec, gastDegrees(date), obs);
const ref = Astronomy.Horizon(date, new Astronomy.Observer(obs.lat, obs.lon, 0), eq.ra, eq.dec);
ok('altitude within 0.05 deg of astronomy-engine', Math.abs(mine.alt - ref.altitude) < 0.05, `mine=${mine.alt.toFixed(3)} ref=${ref.altitude.toFixed(3)}`);
const dAz = Math.abs(((mine.az - ref.azimuth + 540) % 360) - 180);
ok('azimuth within 0.05 deg of astronomy-engine', dAz < 0.05, `mine=${mine.az.toFixed(3)} ref=${ref.azimuth.toFixed(3)}`);

// 3. Polaris altitude ~ latitude
const stars = computeStars(sky, date, obs);
const polarisIdx = sky.stars.findIndex((s) => Math.abs(s[1] - 89.26) < 0.1 && s[2] < 2.5);
ok('Polaris found in catalogue', polarisIdx >= 0);
ok('Polaris altitude ~ latitude (+-1.5)', Math.abs(stars[polarisIdx].alt - obs.lat) < 1.5, `alt=${stars[polarisIdx].alt.toFixed(2)}`);
ok('Polaris azimuth ~ north', Math.min(stars[polarisIdx].az, 360 - stars[polarisIdx].az) < 3, `az=${stars[polarisIdx].az.toFixed(2)}`);

// 4. Named bright stars present
const nameOf = (i: number) => (sky.stars[i][4] >= 0 ? sky.names[sky.stars[i][4]] : '');
for (const n of ['Sirius', 'Vega', 'Betelgeuse', 'Arcturus', 'Canopus']) ok(`catalogue has ${n}`, sky.stars.some((_, i) => nameOf(i) === n));

// 5. Solar system sanity
const ss = computeSolarSystem(date, obs);
const sun = ss.find((o) => o.id === 'Sun')!;
ok('Sun below horizon at 21:30 IST Delhi', sun.alt < -10, `alt=${sun.alt.toFixed(1)}`);
let peak = -90;
for (let m = 0; m < 180; m++) {
  const sun2 = computeSolarSystem(new Date(Date.UTC(2026, 5, 21, 6, 0) + m * 60000), { lat: 23.4, lon: 77 }).find((o) => o.id === 'Sun')!;
  peak = Math.max(peak, sun2.alt);
}
ok('Sun reaches ~zenith at solstice noon on the tropic', peak > 89, `peak alt=${peak.toFixed(2)}`);
ok('7 planets + Sun + Moon returned', ss.length === 9);
console.log('Moon:', ss.find((o) => o.id === 'Moon')!.detail);
console.log('Planets now:', ss.filter((o) => o.kind === 'planet').map((p) => `${p.name} alt=${p.alt.toFixed(0)}`).join(', '));

// 6. Tonight planner
const planner = tonightPlanner(date, obs);
ok('planner has 8 bodies', planner.length === 8);

// 7. Projection: object at centre projects to centre; object 10 deg right is right of centre
const view = { az: 120, alt: 35, fov: 60 };
const p = makeProjector(view, 400, 800);
const c = p.project(toVec(35, 120))!;
ok('view centre maps to screen centre', Math.abs(c.x - 200) < 1e-6 && Math.abs(c.y - 400) < 1e-6);
const r = p.project(toVec(35, 130))!;
ok('larger azimuth appears to the right', r.x > 200, `x=${r.x.toFixed(1)}`);
const up = p.project(toVec(45, 120))!;
ok('higher altitude appears above centre', up.y < 400, `y=${up.y.toFixed(1)}`);
ok('object behind camera is culled', p.project(toVec(-35, 300)) === null);
const edge = p.project(toVec(35 + 30, 120))!;
ok('half-FOV up lands at top edge', Math.abs(edge.y - 0) < 1, `y=${edge.y.toFixed(1)}`);

// 8. Perf
const t0 = Date.now();
for (let i = 0; i < 20; i++) computeStars(sky, new Date(date.getTime() + i * 60000), obs);
console.log(`computeStars: ${((Date.now() - t0) / 20).toFixed(1)} ms per full-catalogue update`);

console.log(failed ? `\n${failed} FAILED` : '\nall passed');
process.exit(failed ? 1 : 0);
