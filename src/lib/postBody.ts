/** A2 fixed daily-post shape. Writers use these as h2/h3 headings; the page
 *  styles them server-side (CSS can't target heading text). */
export const BEATS = [
  "what's happening",
  "what happened",
  "what it means",
  "why it matters",
  "where the pillars meet",
  "what to watch",
  "sources",
] as const;

const UNCONFIRMED = "not confirmed yet";

const norm = (s: string) =>
  s
    .replace(/<[^>]+>/g, "")
    .replace(/&#39;|&rsquo;|’/g, "'")
    .replace(/&amp;/g, "&")
    .trim()
    .toLowerCase();

/** Turn beat headings into labeled beat markers and wrap the
 *  "Not confirmed yet" section in a dashed callout. Unknown headings pass
 *  through untouched, so older posts render as before. */
export function wrapBeats(html: string): string {
  // 1) "Not confirmed yet" section → callout (heading + content up to next h2/h3)
  let out = html.replace(
    /<h([23])[^>]*>([\s\S]*?)<\/h\1>([\s\S]*?)(?=<h[23][\s>]|$)/gi,
    (match, _lvl, inner, rest) =>
      norm(inner) === UNCONFIRMED
        ? `<aside class="beat-unconfirmed"><p class="beat-h">Not confirmed yet</p>${rest}</aside>`
        : match,
  );
  // 2) numbered beat headings
  let n = 0;
  out = out.replace(/<h([23])([^>]*)>([\s\S]*?)<\/h\1>/gi, (match, lvl, attrs, inner) => {
    if (!(BEATS as readonly string[]).includes(norm(inner))) return match;
    n += 1;
    const num = String(n).padStart(2, "0");
    return `<h${lvl}${attrs} class="beat-h"><span class="beat-n">${num}</span> ${inner}</h${lvl}>`;
  });
  return out;
}

/** @deprecated kept for older call sites; beats now cover "Why it matters". */
export const wrapWhyItMatters = wrapBeats;
