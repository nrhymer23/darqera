export type SignalLevel = 1 | 2 | 3;

/** Three booleans (bottom->top filled) for an adoption-curve level. Clamps 1..3. */
export function signalBars(level: number): [boolean, boolean, boolean] {
  const n = Math.max(1, Math.min(3, Math.round(level)));
  return [n >= 1, n >= 2, n >= 3];
}

/** Until posts carry an adoption-stage field, default to 2 (emerging). */
export const DEFAULT_SIGNAL: SignalLevel = 2;
