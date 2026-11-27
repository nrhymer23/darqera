import Link from "next/link";
import { getPosts } from "@/lib/posts";
import { getReadingTime } from "@/lib/readingTime";
import { PILLAR_META, type Pillar, type Post } from "@/types/post";
import { coverPillar } from "@/lib/cover";
import PostCover from "@/components/PostCover";
import NewsletterCapture from "@/components/NewsletterCapture";
import SeriesRail from "@/components/SeriesRail";
import TodayStrip from "@/components/TodayStrip";

export const revalidate = 60;

const PILLARS: { p: Pillar; name: string; copy: string }[] = [
  { p: "D", name: "Decentralization", copy: "Crypto, blockchains and what gets built on them, games included." },
  { p: "A", name: "AI", copy: "Models, agents, and the tools quietly taking over steps of work." },
  { p: "R", name: "Reality", copy: "AR, VR and spatial computing. Screens shrink, attention doesn't." },
  { p: "Q", name: "Quantum", copy: "Hardware, algorithms, and what breaks when they start working." },
];

const pv = (post: Post) => {
  const cp = coverPillar(post);
  return `var(--${cp === "X" ? "x" : cp.toLowerCase()})`;
};

function Chip({ post }: { post: Post }) {
  const cp = coverPillar(post);
  return (
    <span className="chip" style={{ color: pv(post) }}>
      {cp === "X" ? "DARQ · All four" : `${cp} · ${PILLAR_META[cp].full}`}
    </span>
  );
}

const short = (d: string) =>
  new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "America/Chicago" });

export default async function HomePage() {
  const posts = await getPosts().catch(() => [] as Post[]);
  const series = posts
    .filter((p) => typeof p.series_day === "number")
    .sort((a, b) => a.series_day! - b.series_day!);
  const [lead, ...rest] = posts;

  return (
    <>
      <TodayStrip />
      <div className="home wrap-a2">
        <div className="home__top">
          {lead ? (
            <article className="lead">
              <Link href={`/posts/${lead.slug}`} className="lead__cover" aria-hidden="true" tabIndex={-1}>
                <PostCover post={lead} sizes="(min-width: 1200px) 760px, 100vw" priority />
              </Link>
              <div className="home__kick">
                {lead.kind === "news" && <span className="chip chip--filled">Major news</span>}
                <Chip post={lead} />
                {lead.series_day && <span className="mono-label">Day {lead.series_day} of 30</span>}
              </div>
              <h1 className="lead__h">
                <Link href={`/posts/${lead.slug}`}>{lead.title}</Link>
              </h1>
              {lead.excerpt && <p className="lead__dek">{lead.excerpt}</p>}
              <p className="mono-label lead__meta">
                {new Date(lead.published_at).toLocaleDateString("en-US", {
                  weekday: "short",
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}{" "}
                · {getReadingTime(lead.body)} min read · by <span className="sig">Noel Rhymer</span>
              </p>
            </article>
          ) : (
            <article className="lead">
              <h1 className="lead__h">Decentralization, AI, Reality and Quantum, and the places they meet.</h1>
              <p className="lead__dek">30 Days of DARQ starts Tuesday, December 1.</p>
            </article>
          )}
          <SeriesRail series={series} />
        </div>

        {rest.length > 0 && (
          <section aria-labelledby="latest-h">
            <h2 id="latest-h" className="sec-h mono-label">
              Latest
            </h2>
            <div>
              {rest.map((post) => (
                <article key={post.id} className={`row ${post.kind === "news" ? "row--news" : ""}`}>
                  <p className="row__when mono-label">
                    <b>{short(post.published_at)}</b>
                    {post.kind === "news" ? "News" : post.series_day ? `Day ${post.series_day}` : "Feature"} ·{" "}
                    {getReadingTime(post.body)} min
                  </p>
                  <div>
                    <div className="home__kick row__kick">
                      {post.kind === "news" && <span className="chip chip--filled">Major news</span>}
                      <Chip post={post} />
                    </div>
                    <h3 className="row__h">
                      <Link href={`/posts/${post.slug}`}>{post.title}</Link>
                    </h3>
                    {post.excerpt && <p className="row__dek">{post.excerpt}</p>}
                  </div>
                  <Link href={`/posts/${post.slug}`} className="row__thumb" aria-hidden="true" tabIndex={-1}>
                    <PostCover post={post} sizes="200px" label={false} />
                  </Link>
                </article>
              ))}
            </div>
          </section>
        )}

        <nav className="pillars" aria-label="Pillars">
          {PILLARS.map(({ p, name, copy }) => (
            <Link key={p} href={PILLAR_META[p].href} style={{ "--pc": `var(--${p.toLowerCase()})` } as React.CSSProperties}>
              <span className="pillars__L">{p}</span>
              <h3>{name}</h3>
              <p>{copy}</p>
            </Link>
          ))}
        </nav>
      </div>
      <NewsletterCapture variant="band" />
    </>
  );
}
