/** 30 Days of DARQ (Dec 1–30, 2026). Day N = Dec N. Titles + planned pillars
 *  come from the vault's 30-Day Content Schedule; published days use the
 *  real post (series_day) instead. */
import type { CoverPillar } from "./cover";

export const SERIES_START = "2026-12-01";
export const SERIES_TZ = "America/Chicago";

export const SERIES_PLAN: { title: string; pillar: CoverPillar }[] = [
  { title: "What is the DARQ Era?", pillar: "X" },
  { title: "How D, A, R and Q connect", pillar: "X" },
  { title: "Decentralization: what it actually means", pillar: "D" },
  { title: "AI in 2026: agents, reasoning models, and where we actually are", pillar: "A" },
  { title: "Reality redefined: spatial computing and what XR is now", pillar: "R" },
  { title: "Quantum computing: where we are", pillar: "Q" },
  { title: "Week 1 recap: the DARQ landscape at a glance", pillar: "X" },
  { title: "Blockchain beyond Bitcoin", pillar: "D" },
  { title: "DeFi: what worked, what didn't", pillar: "D" },
  { title: "Decentralized social media", pillar: "D" },
  { title: "DAOs and how they work", pillar: "D" },
  { title: "Decentralized identity", pillar: "D" },
  { title: "The decentralized web in practice", pillar: "D" },
  { title: "Week 2 recap", pillar: "X" },
  { title: "AI agents", pillar: "A" },
  { title: "Multimodal AI", pillar: "A" },
  { title: "AI and the workforce", pillar: "A" },
  { title: "Spatial computing 101", pillar: "R" },
  { title: "AR in the real world", pillar: "R" },
  { title: "AI + Reality", pillar: "X" },
  { title: "Week 3 recap", pillar: "X" },
  { title: "Quantum computing: state of the field", pillar: "Q" },
  { title: "Quantum vs classical", pillar: "Q" },
  { title: "Quantum and cryptography", pillar: "Q" },
  { title: "Post-quantum cryptography", pillar: "Q" },
  { title: "AI + Quantum", pillar: "X" },
  { title: "Decentralization + AI", pillar: "X" },
  { title: "The full DARQ stack", pillar: "X" },
  { title: "DARQ in policy", pillar: "X" },
  { title: "What's next", pillar: "X" },
];

export const YEAR_END_REVIEWS = [
  { title: "2026 in Reality", date: "Sat Dec 12" },
  { title: "2026 in Quantum", date: "Sat Dec 19" },
  { title: "2026 in Decentralization", date: "Sat Dec 26" },
  { title: "2026 in AI", date: "Thu Dec 31" },
];

/** Today's series day (1–30) in Central time, 0 before the series, 31 after. */
export function seriesToday(now: Date = new Date()): number {
  const ymd = new Intl.DateTimeFormat("en-CA", {
    timeZone: SERIES_TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
  const days = Math.round((Date.parse(ymd) - Date.parse(SERIES_START)) / 86400e3) + 1;
  return Math.max(0, Math.min(31, days));
}
