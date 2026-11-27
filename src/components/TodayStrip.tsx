import Link from "next/link";
import { getTodayItems } from "@/lib/today";

const v = (p: string) => `var(--${p.toLowerCase()})`;

/** Daily news lives here, never as a post. Renders nothing until there are
 *  items (data source: lib/today). */
export default async function TodayStrip() {
  const items = await getTodayItems();
  if (!items.length) return null;
  const label = new Date().toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    timeZone: "America/Chicago",
  });

  return (
    <section className="today" aria-label="Today's news">
      <div className="today__inner mono-label">
        <b>Today · {label}</b>
        {items.map((it) => (
          <span key={it.id} className="today__item">
            <i style={{ background: v(it.pillar) }} aria-hidden="true" />
            <a href={it.sources[0]?.url} target="_blank" rel="noopener noreferrer">
              {it.headline}
            </a>
            {it.sources.length > 1 && <span className="today__src"> · {it.sources.length} sources</span>}
            {it.post_slug && (
              <Link href={`/posts/${it.post_slug}`} className="today__promo">
                Our analysis →
              </Link>
            )}
          </span>
        ))}
      </div>
    </section>
  );
}
