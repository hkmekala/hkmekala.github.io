/** Pure helpers for the world. No three.js in here, so they are easy to test. */

export interface Point {
  x: number;
  z: number;
}

export interface ZoneArea extends Point {
  id: string;
  radius: number;
}

/** The closest zone whose circle contains the point, or null when in open ground. */
export function findActiveZone<T extends ZoneArea>(p: Point, zones: readonly T[]): T | null {
  let best: T | null = null;
  let bestDist = Infinity;
  for (const zone of zones) {
    const dist = Math.hypot(p.x - zone.x, p.z - zone.z);
    if (dist <= zone.radius && dist < bestDist) {
      best = zone;
      bestDist = dist;
    }
  }
  return best;
}

/** Keeps a stick/keyboard direction inside the unit circle so diagonals are not faster. */
export function clampAxis(x: number, z: number): Point {
  const len = Math.hypot(x, z);
  if (len <= 1) return { x, z };
  return { x: x / len, z: z / len };
}

/** Small seeded random generator so the world looks the same on every visit. */
export function seededRandom(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Shortest signed turn from angle `from` to angle `to`, in radians. */
export function angleDelta(from: number, to: number): number {
  const twoPi = Math.PI * 2;
  const diff = (((to - from) % twoPi) + twoPi) % twoPi;
  return diff > Math.PI ? diff - twoPi : diff;
}
