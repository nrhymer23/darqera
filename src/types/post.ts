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
}

export const PILLAR_META: Record<
  Pillar,
  { label: string; full: string; color: string; href: string }
> = {
  D: {
    label: "D",
    full: "Decentralized",
    color: "#dbfcff",
    href: "/d",
  },
  A: {
    label: "A",
    full: "Artificial Intelligence",
    color: "#a7ffb3",
    href: "/a",
  },
  R: {
    label: "R",
    full: "Reality",
    color: "#fff3f9",
    href: "/r",
  },
  Q: {
    label: "Q",
    full: "Quantum",
    color: "#00f0ff",
    href: "/q",
  },
};
