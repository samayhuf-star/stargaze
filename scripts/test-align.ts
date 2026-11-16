import {
  azDiff, separation, findAlignTarget, computeAlignment, applyAlignment, accuracyState,
  isAlignCandidate, LOCKED_FOR_MS, GOOD_FOR_MS, type AlignCandidate,
} from '../src/lib/align';

let failed = 0;
const ok = (name: string, cond: boolean, info = '') => {
  console.log(`${cond ? 'PASS' : 'FAIL'}  ${name} ${info}`);
  if (!cond) failed++;
};
const near = (a: number, b: number, e = 1e-6) => Math.abs(a - b) < e;
const c = (id: string, kind: string, mag: number, az: number, alt: number): AlignCandidate => ({ id, name: id, kind, mag, az, alt });

ok('azDiff simple', near(azDiff(30, 10), 20));
ok('azDiff wraps across north', near(azDiff(5, 355), 10));
ok('azDiff wraps negative', near(azDiff(355, 5), -10));
ok('azDiff opposite is 180', near(azDiff(180, 0), 180));
ok('separation zero for same point', near(separation({ az: 40, alt: 30 }, { az: 40, alt: 30 }), 0, 1e-4));
ok('separation along horizon', near(separation({ az: 0, alt: 0 }, { az: 90, alt: 0 }), 90, 1e-6));
ok('separation to zenith', near(separation({ az: 123, alt: 90 }, { az: 10, alt: 30 }), 60, 1e-6));

ok('Sun is never a candidate', !isAlignCandidate(c('Sun', 'sun', -26, 100, 40)));
ok('Moon is a candidate', isAlignCandidate(c('Moon', 'moon', -12, 100, 40)));
ok('faint star rejected', !isAlignCandidate(c('s', 'star', 2.5, 100, 40)));
ok('bright star accepted', isAlignCandidate(c('Sirius', 'star', -1.46, 100, 40)));
ok('faint planet rejected', !isAlignCandidate(c('Uranus', 'planet', 5.7, 100, 40)));
ok('object near horizon rejected', !isAlignCandidate(c('Moon', 'moon', -12, 100, 3)));
ok('object near zenith rejected', !isAlignCandidate(c('Moon', 'moon', -12, 100, 86)));
ok('object below horizon rejected', !isAlignCandidate(c('Moon', 'moon', -12, 100, -20)));

const sky = [c('Moon', 'moon', -12, 120, 40), c('Sirius', 'star', -1.46, 200, 30), c('Jupiter', 'planet', -2.5, 125, 44), c('dim', 'star', 4, 119, 40)];
ok('nearest usable target chosen', findAlignTarget(sky, { az: 118, alt: 39 })?.id === 'Moon');
ok('picks Jupiter when closer', findAlignTarget(sky, { az: 126, alt: 45 })?.id === 'Jupiter');
ok('none when everything is far', findAlignTarget(sky, { az: 300, alt: 20 }) === null);
ok('none for empty sky', findAlignTarget([], { az: 0, alt: 0 }) === null);

const moon = sky[0];
const a = computeAlignment({ az: 108, alt: 37 }, moon, 1000);
ok('alignment az offset', near(a.azOffset, 12));
ok('alignment alt offset', near(a.altOffset, 3));
const fixed = applyAlignment({ az: 108, alt: 37 }, a);
ok('applying alignment lands on target', near(fixed.az, 120) && near(fixed.alt, 40));
const wrap = computeAlignment({ az: 355, alt: 20 }, c('x', 'moon', -12, 8, 20), 0);
ok('alignment wraps across north', near(wrap.azOffset, 13));
ok('applied az stays in 0..360', near(applyAlignment({ az: 350, alt: 20 }, wrap).az, 3));
ok('alt offset clamped', computeAlignment({ az: 0, alt: -40 }, c('x', 'moon', -12, 0, 50), 0).altOffset === 30);
ok('applied alt clamped to 90', applyAlignment({ az: 0, alt: 80 }, { azOffset: 0, altOffset: 30, targetName: 'x', at: 0 }).alt === 90);
ok('null alignment is identity', applyAlignment({ az: 10, alt: 5 }, null).az === 10);

ok('unaligned state', accuracyState(null, 3, 0) === 'unaligned');
ok('locked just after aligning', accuracyState(a, 3, 2000) === 'locked');
ok('not locked with weak compass', accuracyState(a, 1, 2000) === 'good');
ok('drifting with no compass calibration', accuracyState(a, 0, 2000) === 'drifting');
ok('good after lock window', accuracyState(a, 3, 1000 + LOCKED_FOR_MS + 1) === 'good');
ok('drifting after an hour', accuracyState(a, 3, 1000 + GOOD_FOR_MS + 1) === 'drifting');
ok('clock moved backwards does not crash', accuracyState(a, 3, 0) === 'good');

console.log(failed === 0 ? '\nALL ALIGN TESTS PASSED' : `\n${failed} FAILED`);
process.exit(failed === 0 ? 0 : 1);
