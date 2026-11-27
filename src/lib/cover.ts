/**
 * DARQ cover system (A2 "Daybook"). One 1200×630 drawing per post, seeded by
 * slug: the in-post cover, feed thumbnail and OG card all use it.
 * Pattern = meaning: D mesh of equal nodes (no hub) · A token rows with
 * attention weights · R floor plane to a horizon · Q two interfering wave
 * sets · X (cross-pillar) all four as bands.
 * The left-side fade keeps the title area calm (a plain gradient overlay,
 * not a mask, so Satori/resvg renders it the same as browsers).
 * Covers stay dark in both site themes on purpose (they are the OG image).
 */
import type { Pillar, Post } from "@/types/post";

export type CoverPillar = Pillar | "X";

export const COVER_W = 1200;
export const COVER_H = 630;
const BG = "#121314";

export const COVER_PILLARS: Record<CoverPillar, { name: string; c: string }> = {
  D: { name: "Decentralization", c: "#3DD6A8" },
  A: { name: "AI", c: "#C4EE3A" },
  R: { name: "Reality", c: "#FF5C93" },
  Q: { name: "Quantum", c: "#A98BFF" },
  X: { name: "All four pillars", c: "#00E1EE" },
};

type CoverPost = Pick<Post, "slug" | "title" | "pillar"> &
  Partial<Pick<Post, "series_day" | "kind" | "cross_pillar">>;

export function coverPillar(post: CoverPost): CoverPillar {
  return post.cross_pillar ? "X" : post.pillar;
}

export function coverKicker(post: CoverPost): string {
  const p = COVER_PILLARS[coverPillar(post)];
  const lead =
    post.kind === "news"
      ? "NEWS ANALYSIS"
      : post.series_day
        ? `DAY ${String(post.series_day).padStart(2, "0")} / 30`
        : "DARQ ERA";
  return `${lead}  ·  ${p.name.toUpperCase()}`;
}

function rng(seed: number) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function hash(s: string): number {
  let h = 2166136261;
  for (const ch of s) {
    h ^= ch.charCodeAt(0);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

const f = (n: number) => n.toFixed(1);

function pattern(
  p: CoverPillar,
  col: string,
  x0: number,
  y0: number,
  w: number,
  h: number,
  r: () => number,
  op: number,
  idBase: string,
): string {
  let s = "";
  if (p === "D") {
    const g = 64;
    const cols = Math.ceil(w / g) + 1;
    const rows = Math.ceil(h / g) + 1;
    const pts: [number, number][] = [];
    for (let j = 0; j < rows; j++)
      for (let i = 0; i < cols; i++)
        pts.push([x0 + i * g + (r() - 0.5) * 22, y0 + j * g + (r() - 0.5) * 22]);
    const at = (i: number, j: number) => pts[j * cols + i];
    const line = (a: [number, number], b: [number, number]) =>
      `<line x1="${f(a[0])}" y1="${f(a[1])}" x2="${f(b[0])}" y2="${f(b[1])}"/>`;
    for (let j = 0; j < rows; j++)
      for (let i = 0; i < cols; i++) {
        const a = at(i, j);
        if (i < cols - 1 && r() > 0.28) s += line(a, at(i + 1, j));
        if (j < rows - 1 && r() > 0.28) s += line(a, at(i, j + 1));
        if (i < cols - 1 && j < rows - 1 && r() > 0.82) s += line(a, at(i + 1, j + 1));
      }
    s =
      `<g stroke="${col}" stroke-width="1.5" opacity="${op * 0.7}">${s}</g>` +
      `<g fill="${col}" opacity="${op}">` +
      pts.map((q) => `<circle cx="${f(q[0])}" cy="${f(q[1])}" r="4"/>`).join("") +
      "</g>";
  } else if (p === "A") {
    let g = "";
    for (let y = y0 + 10; y < y0 + h; y += 26) {
      let x = x0 + r() * 40;
      while (x < x0 + w) {
        const bw = 18 + r() * 110;
        g += `<rect x="${f(x)}" y="${y}" width="${f(bw)}" height="14" rx="2" opacity="${(0.12 + r() * 0.88).toFixed(2)}"/>`;
        x += bw + 8;
      }
    }
    s = `<g fill="${col}" opacity="${op}">${g}</g>`;
  } else if (p === "R") {
    const vx = x0 + w * 0.55;
    const vy = y0 + h * 0.34;
    let g = `<line x1="${x0}" y1="${f(vy)}" x2="${x0 + w}" y2="${f(vy)}" stroke-width="2"/>`;
    for (let x = x0 - w; x <= x0 + w * 2; x += 70)
      g += `<line x1="${f(vx)}" y1="${f(vy)}" x2="${x}" y2="${y0 + h}"/>`;
    for (let k = 1; k < 12; k++) {
      const y = vy + (y0 + h - vy) * Math.pow(k / 11, 2.1);
      g += `<line x1="${x0}" y1="${f(y)}" x2="${x0 + w}" y2="${f(y)}"/>`;
    }
    s = `<g stroke="${col}" stroke-width="1.4" opacity="${op}">${g}</g>`;
  } else if (p === "Q") {
    const c1 = [x0 + w * 0.35, y0 + h * 0.45];
    const c2 = [x0 + w * 0.68, y0 + h * 0.58];
    let g = "";
    for (let k = 1; k < 26; k++)
      g += `<circle cx="${f(c1[0])}" cy="${f(c1[1])}" r="${k * 20}"/><circle cx="${f(c2[0])}" cy="${f(c2[1])}" r="${k * 20}"/>`;
    s = `<g fill="none" stroke="${col}" stroke-width="1.6" opacity="${op * 0.75}">${g}</g>`;
  } else {
    const bw = w / 4;
    (["D", "A", "R", "Q"] as const).forEach((q, i) => {
      const cid = `${idBase}x${i}`;
      s +=
        `<clipPath id="${cid}"><rect x="${x0 + i * bw}" y="${y0}" width="${bw - 14}" height="${h}"/></clipPath>` +
        `<g clip-path="url(#${cid})">` +
        pattern(q, COVER_PILLARS[q].c, x0 + i * bw, y0, bw - 14, h, r, op, cid) +
        "</g>";
    });
  }
  return s;
}

/** Background art only (no text): field, tint, masked pattern, pillar bar.
 *  Used by the OG image, which sets its type with Satori on top. */
export function coverArtSvg(post: CoverPost): string {
  const p = coverPillar(post);
  const P = COVER_PILLARS[p];
  const id = `c${hash(post.slug)}`;
  const r = rng(hash(post.slug || post.title));
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${COVER_W} ${COVER_H}" width="${COVER_W}" height="${COVER_H}">` +
    `<defs><linearGradient id="${id}f" x1="0" x2="1"><stop offset="0" stop-color="${BG}" stop-opacity=".9"/><stop offset=".42" stop-color="${BG}" stop-opacity=".62"/><stop offset=".72" stop-color="${BG}" stop-opacity="0"/></linearGradient></defs>` +
    `<rect width="${COVER_W}" height="${COVER_H}" fill="${BG}"/>` +
    `<rect width="${COVER_W}" height="${COVER_H}" fill="${P.c}" opacity=".07"/>` +
    pattern(p, P.c, 0, 0, COVER_W, COVER_H, r, 0.55, id) +
    `<rect width="${COVER_W}" height="${COVER_H}" fill="url(#${id}f)"/>` +
    `<rect x="0" y="0" width="8" height="${COVER_H}" fill="${P.c}"/>` +
    `</svg>`
  );
}

function wrapWords(text: string, n: number): string[] {
  const out: string[] = [];
  let line = "";
  for (const word of text.split(/\s+/)) {
    if ((line + " " + word).trim().length > n && line) {
      out.push(line);
      line = word;
    } else line = (line + " " + word).trim();
  }
  if (line) out.push(line);
  return out;
}

/** Full cover with type, for inline use in pages. Fonts come from the page
 *  (CSS vars set by next/font), so type matches the site. */
export function coverSvg(post: CoverPost, opts: { label?: boolean } = {}): string {
  const p = coverPillar(post);
  const P = COVER_PILLARS[p];
  const id = `c${hash(post.slug)}`;
  const r = rng(hash(post.slug || post.title));
  const lines = wrapWords(post.title, 24).slice(0, 4);
  const fs = lines.length > 2 ? 60 : 70;
  const display = `style="font-family:var(--font-space-grotesk),Helvetica,Arial,sans-serif"`;
  const mono = `style="font-family:var(--font-geist-mono),Menlo,monospace"`;
  const letter =
    p === "X"
      ? (["D", "A", "R", "Q"] as const)
          .map(
            (q, i) =>
              `<text x="${640 + i * 140}" y="600" ${display} font-weight="700" font-size="230" fill="${BG}" stroke="${COVER_PILLARS[q].c}" stroke-width="2.5">${q}</text>`,
          )
          .join("")
      : `<text x="${COVER_W - 30}" y="${COVER_H + 95}" text-anchor="end" ${display} font-weight="700" font-size="640" fill="${BG}" fill-opacity=".55" stroke="${P.c}" stroke-width="3">${p}</text>`;
  const label =
    opts.label === false
      ? ""
      : `<text x="72" y="566" ${display} font-weight="700" font-size="30" fill="#00E1EE">DARQ<tspan fill="#E8E5DF">ERA</tspan></text>` +
        `<text x="250" y="566" ${mono} font-size="20" fill="#8E8B85">darqera.com</text>`;
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${COVER_W} ${COVER_H}" role="img" aria-label="Cover: ${esc(post.title)}" preserveAspectRatio="xMidYMid slice">` +
    `<defs><linearGradient id="${id}f" x1="0" x2="1"><stop offset="0" stop-color="${BG}" stop-opacity=".9"/><stop offset=".42" stop-color="${BG}" stop-opacity=".62"/><stop offset=".72" stop-color="${BG}" stop-opacity="0"/></linearGradient></defs>` +
    `<rect width="${COVER_W}" height="${COVER_H}" fill="${BG}"/>` +
    `<rect width="${COVER_W}" height="${COVER_H}" fill="${P.c}" opacity=".07"/>` +
    pattern(p, P.c, 0, 0, COVER_W, COVER_H, r, 0.55, id) +
    `<rect width="${COVER_W}" height="${COVER_H}" fill="url(#${id}f)"/>` +
    letter +
    `<rect x="0" y="0" width="8" height="${COVER_H}" fill="${P.c}"/>` +
    `<text x="72" y="104" ${mono} font-size="24" letter-spacing="3" fill="${P.c}">${esc(coverKicker(post))}</text>` +
    lines
      .map(
        (l, i) =>
          `<text x="70" y="${200 + i * fs * 1.08}" ${display} font-weight="600" font-size="${fs}" letter-spacing="-1.5" fill="#E8E5DF">${esc(l)}</text>`,
      )
      .join("") +
    label +
    `</svg>`
  );
}
