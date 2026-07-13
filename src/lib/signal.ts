export type SignalLevel = 1 | 2 | 3;

/** Three booleans (bottom->top filled) for an adoption-curve level. Clamps 1..3. */
export function signalBars(level: number): [boolean, boolean, boolean] {
  const n = Math.max(1, Math.min(3, Math.round(level)));
  return [n >= 1, n >= 2, n >= 3];
}

/** Fallback when a post has no adoption-stage data: 2 (emerging). */
export const DEFAULT_SIGNAL: SignalLevel = 2;

/** A post's signal level: pipeline-set signal_strength, else the default. */
export function postSignalLevel(post: { signal_strength?: number | null }): SignalLevel {
  const s = post.signal_strength;
  if (s === 1 || s === 2 || s === 3) return s;
  return DEFAULT_SIGNAL;
}
