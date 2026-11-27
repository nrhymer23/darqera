/** Today strip data. No source is wired yet (open decision: a small
 *  `news_items` table edited in /admin, or Tech Intel later), so this returns
 *  nothing and the strip stays hidden. */
export interface TodayItem {
  id: string;
  pillar: "D" | "A" | "R" | "Q" | "X";
  headline: string;
  sources: { url: string; name?: string }[];
  /** Set when major news was promoted to a full analysis post. */
  post_slug?: string | null;
}

export async function getTodayItems(): Promise<TodayItem[]> {
  return [];
}
