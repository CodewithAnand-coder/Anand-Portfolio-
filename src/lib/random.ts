/**
 * Deterministic pseudo-randomness.
 *
 * Every procedural layout in the 3D world (node graphs, particle clouds, panel
 * placement) is generated from a fixed seed. Using Math.random would make the
 * scene reshuffle on every remount, which reads as a bug: the visitor scrolls
 * away from the skills ecosystem, comes back, and the whole constellation has
 * moved. Seeded generation keeps the world stable while staying organic.
 */
export function mulberry32(seed: number) {
  let a = seed >>> 0;
  return function next() {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export type Random = ReturnType<typeof mulberry32>;

/** Uniform float in [min, max). */
export function range(random: Random, min: number, max: number) {
  return min + random() * (max - min);
}

