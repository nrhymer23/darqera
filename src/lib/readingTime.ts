/**
 * Calculate estimated reading time for a post body.
 * Strips HTML tags, counts words, divides by 238 WPM (Medium's standard).
 * Returns minutes as an integer (minimum 1).
 */
export function getReadingTime(text: string): number {
  // Strip HTML tags
  const stripped = text.replace(/<[^>]*>/g, "");
  // Split on whitespace and filter empty strings
  const words = stripped.split(/\s+/).filter(Boolean);
  const minutes = Math.ceil(words.length / 238);
  return Math.max(1, minutes);
}
