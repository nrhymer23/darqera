import Link from "next/link";
import type { Post } from "@/types/post";
import { coverPillar } from "@/lib/cover";

type SeriesPost = Pick<Post, "slug" | "title" | "pillar" | "series_day" | "cross_pillar">;

const pillarVar = (p: SeriesPost) => {
  const cp = coverPillar(p);
  return `var(--${cp === "X" ? "x" : cp.toLowerCase()})`;
};

/** 30 ticks (published days fill with their pillar color) + previous/next. */
export default function SeriesNav({ current, series }: { current: number; series: SeriesPost[] }) {
  const byDay = new Map(series.map((p) => [p.series_day!, p]));
  const prev = byDay.get(current - 1);
  const next = byDay.get(current + 1);

  return (
    <nav className="series-nav" aria-label="30 Days of DARQ">
      <div className="series-nav__head mono-label">
        <span>
          30 Days of DARQ · Day {current} of 30
        </span>
        <Link href="/#series">See all 30 days</Link>
      </div>
      <div className="series-nav__ticks" aria-hidden="true">
        {Array.from({ length: 30 }, (_, i) => {
          const p = byDay.get(i + 1);
          return (
            <i
              key={i}
              className={`${p ? "live" : ""} ${i + 1 === current ? "now" : ""}`}
              style={p ? ({ "--pc": pillarVar(p) } as React.CSSProperties) : undefined}
            />
          );
        })}
      </div>
      <div className="series-nav__pn">
        {prev ? (
          <Link href={`/posts/${prev.slug}`}>
            <span className="mono-label">← Day {current - 1}</span>
            <b>{prev.title}</b>
          </Link>
        ) : (
          <div>
            <span className="mono-label">Start here</span>
            <b>This is where the series begins.</b>
          </div>
        )}
        {next ? (
          <Link href={`/posts/${next.slug}`}>
            <span className="mono-label">Day {current + 1} →</span>
            <b>{next.title}</b>
          </Link>
        ) : (
          <div>
            <span className="mono-label">Day {Math.min(current + 1, 30)} →</span>
            <b>{current < 30 ? "Drops tomorrow morning." : "That's the series."}</b>
          </div>
        )}
      </div>
    </nav>
  );
}
