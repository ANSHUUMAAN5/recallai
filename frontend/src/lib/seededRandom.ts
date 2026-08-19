// Small deterministic PRNG (mulberry32) so generated layouts are
// identical between the static export's build-time render and
// client hydration — Math.random() would differ between the two
// and trigger a hydration mismatch.
export function createSeededRandom(seed: number) {
  let state = seed;

  return function random() {
    state |= 0;
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
