import Link from "next/link";
import type { Post } from "@/types/post";
import { coverPillar, type CoverPillar } from "@/lib/cover";
import { SERIES_PLAN, YEAR_END_REVIEWS, seriesToday } from "@/lib/series";

const v = (p: CoverPillar) => `var(--${p === "X" ? "x" : p.toLowerCase()})`;

/** The A2 signature: a grid of the month. Published days fill with their
 *  pillar color; unpublished days show the planned pillar as a dot. */
export default function SeriesRail({ series }: { series: Post[] }) {
  const byDay = new Map(series.map((p) => [p.series_day!, p]));
  const today = seriesToday();
  const latest = series.length ? Math.max(...series.map((p) => p.series_day!)) : 0;
  const shown = Math.max(latest, Math.min(today, 30));
  const nextDay = Math.min(Math.max(today, latest) + 1, 30);
  const next = latest < 30 ? SERIES_PLAN[nextDay - 1] : null;
  const weeks = [0, 1, 2, 3, 4].map((w) => Array.from({ length: 7 }, (_, d) => w * 7 + d + 1).filter((n) => n <= 30));

  return (
    <aside className="rail" id="series" aria-labelledby="rail-h">
      <h2 id="rail-h" className="rail__h">30 Days of DARQ</h2>
      <p className="rail__sub mono-label">
        {shown > 0 ? `Day ${shown} of 30 · ` : "Starts Tue Dec 1 · "}Dec 1 – Dec 30
      </p>
      <div
        className="rail__prog"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={30}
        aria-valuenow={series.length}
        aria-label="Days published"
      >
        <i style={{ width: `${(series.length / 30) * 100}%` }} />
      </div>
      <div className="rail__weeks">
        {weeks.map((days, w) => (
          <div className="rail__week" key={w}>
            <span className="mono-label rail__wk" aria-hidden="true">
              W{w + 1}
            </span>
            {days.map((n) => {
              const post = byDay.get(n);
              const pc = post ? coverPillar(post) : SERIES_PLAN[n - 1].pillar;
              const style = { "--pc": v(pc), "--i": n } as React.CSSProperties;
              const cls = `cell ${post ? "live" : ""} ${n === today ? "now" : ""}`;
              return post ? (
                <Link
                  key={n}
                  href={`/posts/${post.slug}`}
                  className={cls}
                  style={style}
                  aria-label={`Day ${n}: ${post.title}`}
                >
                  {n}
                </Link>
              ) : (
                <span key={n} className={cls} style={style} aria-label={`Day ${n}: ${SERIES_PLAN[n - 1].title} (coming)`}>
                  {n}
                </span>
              );
            })}
          </div>
        ))}
      </div>
      <div className="rail__legend mono-label" aria-hidden="true">
        {(["D", "A", "R", "Q", "X"] as const).map((p) => (
          <span key={p}>
            <i style={{ background: v(p) }} />
            {p === "X" ? "All four" : p}
          </span>
        ))}
      </div>
      {next && (
        <div className="rail__next">
          <span className="mono-label">
            {today === 0 ? "First up · Tue Dec 1" : `Next · Dec ${nextDay}`} · Day {nextDay}
          </span>
          <p>{next.title}</p>
        </div>
      )}
      <ul className="rail__reviews" aria-label="Year-end reviews">
        {YEAR_END_REVIEWS.map((r) => (
          <li key={r.title}>
            <span>{r.title}</span>
            <span className="mono-label">{r.date}</span>
          </li>
        ))}
      </ul>
    </aside>
  );
}
