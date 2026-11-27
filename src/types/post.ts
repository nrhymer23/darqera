export type Pillar = "D" | "A" | "R" | "Q";

export interface Post {
  id: string;
  title: string;
  slug: string;
  pillar: Pillar;
  excerpt: string;
  body: string;
  published_at: string;
  status: "draft" | "published";
  tags: string[];
  view_count?: number;
  /** Adoption-curve stage set by the signal pipeline: 1 early, 2 emerging, 3 shifting. */
  signal_strength?: number | null;
  /** Optional cover image URL; null falls back to generative pillar art. */
  cover_image?: string | null;
  cover_alt?: string | null;
  /** A2: day number in the 30-day series (1–30); null for non-series posts. */
  series_day?: number | null;
  /** A2: series day, major-news analysis, or standalone feature. */
  kind?: "series" | "news" | "feature" | null;
  /** A2: post spans all four pillars (DARQ treatment); `pillar` stays its home pillar. */
  cross_pillar?: boolean | null;
  updated_at?: string | null;
}

export const PILLAR_META: Record<
  Pillar,
  { label: string; full: string; color: string; href: string }
> = {
  D: {
    label: "D",
    full: "Decentralization",
    color: "#3DD6A8",
    href: "/d",
  },
  A: {
    label: "A",
    full: "Artificial Intelligence",
    color: "#C4EE3A",
    href: "/a",
  },
  R: {
    label: "R",
    full: "Reality",
    color: "#FF5C93",
    href: "/r",
  },
  Q: {
    label: "Q",
    full: "Quantum",
    color: "#A98BFF",
    href: "/q",
  },
};
