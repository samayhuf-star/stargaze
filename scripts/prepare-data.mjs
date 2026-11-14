// Builds src/data/sky-data.json from the d3-celestial data (BSD licensed, Olaf Frohn).
// Run: node scripts/prepare-data.mjs
import { createRequire } from 'node:module';
import { writeFileSync } from 'node:fs';
const require = createRequire(import.meta.url);
const dir = 'node_modules/d3-celestial/data/';
const load = (f) => require('../' + dir + f);

const raDeg = (lon) => +(((lon % 360) + 360) % 360).toFixed(3);
const r3 = (n) => +n.toFixed(3);

const names = [];
const nameIdx = new Map();
const starNames = load('starnames.json');
const stars = load('stars.6.json')
  .features.filter((f) => f.properties.mag <= 5.5)
  .sort((a, b) => a.properties.mag - b.properties.mag)
  .map((f) => {
    const [lon, lat] = f.geometry.coordinates;
    const nm = starNames[String(f.id)]?.name || '';
    let idx = -1;
    if (nm) {
      if (!nameIdx.has(nm)) {
        nameIdx.set(nm, names.length);
        names.push(nm);
      }
      idx = nameIdx.get(nm);
    }
    const bv = parseFloat(f.properties.bv);
    return [raDeg(lon), r3(lat), +f.properties.mag.toFixed(2), Number.isFinite(bv) ? +bv.toFixed(2) : 0.6, idx];
  });

const cons = load('constellations.json').features;
const lines = load('constellations.lines.json').features;
const lineMap = new Map(lines.map((f) => [f.id, f.geometry.coordinates]));
const constellations = cons.map((f) => ({
  id: f.id,
  name: f.properties.en || f.properties.name,
  center: [raDeg(f.geometry.coordinates[0]), r3(f.geometry.coordinates[1])],
  segs: (lineMap.get(f.id) || []).map((seg) => seg.map(([lon, lat]) => [raDeg(lon), r3(lat)])),
}));

const dsos = load('messier.json').features.map((f) => [
  f.properties.name,
  f.properties.alt || '',
  raDeg(f.geometry.coordinates[0]),
  r3(f.geometry.coordinates[1]),
  f.properties.mag ?? 9,
  f.properties.type || '',
]);

writeFileSync('src/data/sky-data.json', JSON.stringify({ names, stars, constellations, dsos }));
console.log({ stars: stars.length, names: names.length, constellations: constellations.length, dsos: dsos.length });
