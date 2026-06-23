/** Wrap a "Why it matters" section (its heading + following content up to the
 *  next h2/h3) in a styled <aside> so it gets the signature cyan-border treatment.
 *  CSS can't target heading text, so this runs server-side on the post HTML.
 *  No-op if no such heading exists. */
export function wrapWhyItMatters(html: string): string {
  return html.replace(
    /<h[23][^>]*>\s*why it matters\s*<\/h[23]>([\s\S]*?)(?=<h[23][\s>]|$)/i,
    '<aside class="why-it-matters"><p class="wim-label">Why it matters</p>$1</aside>',
  );
}
