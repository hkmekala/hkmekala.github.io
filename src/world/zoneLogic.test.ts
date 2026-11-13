import { describe, expect, it } from 'vitest';
import { angleDelta, clampAxis, findActiveZone, seededRandom } from './zoneLogic';
import { allTech, jobsNewestFirst, zones } from '../data/site';

const areas = [
  { id: 'a', x: 0, z: 0, radius: 5 },
  { id: 'b', x: 8, z: 0, radius: 5 },
];

describe('findActiveZone', () => {
  it('returns null in open ground', () => {
    expect(findActiveZone({ x: 40, z: 40 }, areas)).toBeNull();
  });

  it('returns the zone that contains the point', () => {
    expect(findActiveZone({ x: 1, z: 1 }, areas)?.id).toBe('a');
  });

  it('picks the nearest zone when two overlap', () => {
    expect(findActiveZone({ x: 4.5, z: 0 }, areas)?.id).toBe('b');
    expect(findActiveZone({ x: 3.5, z: 0 }, areas)?.id).toBe('a');
  });

  it('counts the edge of the circle as inside', () => {
    expect(findActiveZone({ x: -5, z: 0 }, areas)?.id).toBe('a');
  });

  it('handles an empty list', () => {
    expect(findActiveZone({ x: 0, z: 0 }, [])).toBeNull();
  });
});

describe('clampAxis', () => {
  it('leaves small inputs alone', () => {
    expect(clampAxis(0.3, -0.4)).toEqual({ x: 0.3, z: -0.4 });
  });

  it('normalises diagonals to length 1', () => {
    const v = clampAxis(1, 1);
    expect(Math.hypot(v.x, v.z)).toBeCloseTo(1);
  });
});

describe('seededRandom', () => {
  it('is repeatable and stays in [0, 1)', () => {
    const a = seededRandom(7);
    const b = seededRandom(7);
    for (let i = 0; i < 50; i++) {
      const value = a();
      expect(value).toBe(b());
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThan(1);
    }
  });
});

describe('angleDelta', () => {
  it('takes the short way round', () => {
    expect(angleDelta(0.1, -0.1)).toBeCloseTo(-0.2);
    expect(angleDelta(Math.PI - 0.1, -Math.PI + 0.1)).toBeCloseTo(0.2);
  });
});

describe('site data', () => {
  it('maps every job in config.json to a zone', () => {
    expect(jobsNewestFirst).toHaveLength(7);
    expect(jobsNewestFirst[0]?.title).toBe('KeenAi Global');
    expect(jobsNewestFirst[6]?.title).toBe('Infovity');
  });

  it('starts at the intro and ends at contact', () => {
    expect(zones[0]?.kind).toBe('start');
    expect(zones[zones.length - 1]?.kind).toBe('contact');
  });

  it('keeps zones far enough apart that they never overlap', () => {
    for (const a of zones) {
      for (const b of zones) {
        if (a.id === b.id) continue;
        expect(Math.hypot(a.x - b.x, a.z - b.z)).toBeGreaterThan(a.radius + b.radius);
      }
    }
  });

  it('has unique ids and a de-duplicated tech list', () => {
    expect(new Set(zones.map((z) => z.id)).size).toBe(zones.length);
    expect(new Set(allTech).size).toBe(allTech.length);
    expect(allTech.length).toBeGreaterThan(20);
  });
});
