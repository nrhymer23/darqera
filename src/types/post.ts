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
}

export const PILLAR_META: Record<
  Pillar,
  { label: string; full: string; color: string; href: string }
> = {
  D: {
    label: "D",
    full: "Decentralized",
    color: "#00e5c4",
    href: "/d",
  },
  A: {
    label: "A",
    full: "Artificial Intelligence",
    color: "#39ff8c",
    href: "/a",
  },
  R: {
    label: "R",
    full: "Reality",
    color: "#ff3d8a",
    href: "/r",
  },
  Q: {
    label: "Q",
    full: "Quantum",
    color: "#b366ff",
    href: "/q",
  },
};
