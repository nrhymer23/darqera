import Link from "next/link";
import { getPosts } from "@/lib/posts";
import { PILLAR_META, type Pillar } from "@/types/post";
import FeedCard from "@/components/FeedCard";
import PostCover from "@/components/PostCover";
import NewsletterCapture from "@/components/NewsletterCapture";

export const revalidate = 60;

const PILLAR_COPY: Record<Pillar, string> = {
  D: "Who owns the network, the identity, and the audience.",
  A: "Models, agents, and the tools quietly replacing steps of work.",
  R: "XR and spatial computing. Screens are disappearing, attention isn't.",
  Q: "Quantum hardware and algorithms, and what breaks when they work.",
};

const PILLARS: Pillar[] = ["D", "A", "R", "Q"];

const METHOD = [
  {
    step: "01",
    title: "Track",
    body: "We follow primary sources across all four pillars and report what changed in the last 24 hours.",
  },
  {
    step: "02",
    title: "Verify",
    body: "Every story is checked against primary sources before it goes live.",
  },
  {
    step: "03",
    title: "Explain",
    body: "What happened, why it matters, and the real shift underneath it. Opinion comes after the facts.",
  },
];

export default async function HomePage() {
  const posts = await getPosts();
  const [featured, ...rest] = posts;

  const counts = PILLARS.reduce(
    (acc, p) => ({ ...acc, [p]: posts.filter((x) => x.pillar === p).length }),
    {} as Record<Pillar, number>,
  );

  return (
    <>
      {/* Hero: compact, with the product visible right away */}
      <section className="atmos-field">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-16 sm:pt-24 pb-12 sm:pb-16 grid gap-12 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <div>
          <p
            className="text-[11px] font-semibold tracking-[0.18em] uppercase mb-4"
            style={{ color: "var(--brand-cyan)" }}
          >
            Tech news & analysis
          </p>
          <h1
            className="hero-title font-[family-name:var(--font-space-grotesk)] font-bold text-[clamp(2.5rem,7vw,4.5rem)] leading-[1.05] tracking-[-0.025em] mb-5"
            style={{ color: "var(--text-primary)" }}
          >
            The DARQ Era
            <br />
            <span style={{ color: "var(--brand-cyan)" }}>is already here.</span>
          </h1>
          <p
            className="text-lg leading-relaxed max-w-[52ch] mb-8"
            style={{ color: "var(--text-secondary)" }}
          >
            Decentralization, AI, Reality, and Quantum, covered from a
            builder&apos;s perspective. Short reads on what changed today and
            why it matters.
          </p>

          <div className="flex flex-wrap items-center gap-3 mb-10">
            {featured && (
              <Link
                href={`/posts/${featured.slug}`}
                className="inline-flex items-center rounded-md px-5 py-2.5 text-sm font-semibold transition-opacity hover:opacity-90"
                style={{
                  background: "var(--brand-cyan)",
                  color: "var(--text-inverse)",
                }}
              >
                Read the latest
              </Link>
            )}
            <a
              href="#subscribe"
              className="inline-flex items-center rounded-md px-5 py-2.5 text-sm font-semibold transition-colors"
              style={{
                color: "var(--text-primary)",
                border: "1px solid var(--border-ghost)",
              }}
            >
              Get DARQ drops
            </a>
          </div>

          {/* Pillar chips with live counts */}
          <ul className="flex flex-wrap gap-2.5" aria-label="Pillars">
            {PILLARS.map((p) => (
              <li key={p}>
                <Link
                  href={PILLAR_META[p].href}
                  className="inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-xs font-semibold tracking-wide transition-colors hover:bg-[var(--bg-card-hover)]"
                  style={{
                    color: `var(--pillar-${p.toLowerCase()})`,
                    border: "1px solid var(--border-ghost)",
                  }}
                >
                  <span>{p}</span>
                  <span style={{ color: "var(--text-muted)" }}>
                    {PILLAR_META[p].full}
                  </span>
                  <span style={{ color: "var(--text-muted)" }}>
                    {counts[p]}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
          </div>

          {/* Hero visual: the newest post's cover (or pillar art) */}
          {featured && (
            <Link
              href={`/posts/${featured.slug}`}
              className="group relative block aspect-[4/3] overflow-hidden rounded-2xl"
              style={{
                border: "1px solid var(--border-ghost)",
                ["--pillar" as string]: `var(--pillar-${featured.pillar.toLowerCase()})`,
              }}
            >
              <PostCover
                post={featured}
                sizes="(min-width: 1024px) 480px, 100vw"
                priority
              />
              <div
                className="absolute inset-x-0 bottom-0 p-5 pt-16"
                style={{
                  background:
                    "linear-gradient(180deg, transparent, rgba(0,0,0,0.78))",
                }}
              >
                <span
                  className="text-[10px] font-semibold tracking-widest uppercase"
                  style={{ color: `var(--pillar-${featured.pillar.toLowerCase()})` }}
                >
                  {PILLAR_META[featured.pillar].full}
                </span>
                <p className="font-[family-name:var(--font-space-grotesk)] font-semibold text-lg leading-snug text-white mt-1 group-hover:underline underline-offset-4">
                  {featured.title}
                </p>
              </div>
            </Link>
          )}
        </div>
      </section>

      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        {/* Latest */}
        <section className="pt-12 sm:pt-16" aria-labelledby="latest-heading">
          <SectionHeader id="latest-heading" label="Latest" />
          {posts.length === 0 ? (
            <div className="py-20 text-center">
              <p
                className="text-sm tracking-wide"
                style={{ color: "var(--text-muted)" }}
              >
                First posts dropping soon.
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-6">
              {featured && <FeedCard post={featured} featured />}
              {rest.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {rest.map((post) => (
                    <FeedCard key={post.id} post={post} />
                  ))}
                </div>
              )}
            </div>
          )}
        </section>

        {/* Browse by pillar */}
        <section className="pt-16 sm:pt-20" aria-labelledby="pillars-heading">
          <SectionHeader id="pillars-heading" label="Browse by pillar" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {PILLARS.map((p) => {
              const color = `var(--pillar-${p.toLowerCase()})`;
              return (
                <Link
                  key={p}
                  href={PILLAR_META[p].href}
                  className="feed-card group p-6"
                  style={{ borderTop: `2px solid ${color}` }}
                >
                  <span
                    className="font-[family-name:var(--font-space-grotesk)] font-bold text-5xl leading-none mb-5"
                    style={{ color }}
                  >
                    {p}
                  </span>
                  <h3
                    className="font-[family-name:var(--font-space-grotesk)] font-semibold text-lg mb-2"
                    style={{ color: "var(--text-primary)" }}
                  >
                    {PILLAR_META[p].full}
                  </h3>
                  <p
                    className="text-sm leading-relaxed mb-5"
                    style={{ color: "var(--text-muted)" }}
                  >
                    {PILLAR_COPY[p]}
                  </p>
                  <span
                    className="mt-auto text-[11px] font-semibold tracking-[0.14em] uppercase"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    {counts[p]} {counts[p] === 1 ? "post" : "posts"} →
                  </span>
                </Link>
              );
            })}
          </div>
        </section>

        {/* How it works */}
        <section className="pt-16 sm:pt-20" aria-labelledby="method-heading">
          <SectionHeader id="method-heading" label="How we cover it" />
          <ol className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {METHOD.map((m) => (
              <li
                key={m.step}
                className="pt-5"
                style={{ borderTop: "1px solid var(--border-ghost)" }}
              >
                <span
                  className="text-[11px] font-semibold tracking-[0.18em]"
                  style={{ color: "var(--brand-cyan)" }}
                >
                  {m.step}
                </span>
                <h3
                  className="font-[family-name:var(--font-space-grotesk)] font-semibold text-xl mt-2 mb-2"
                  style={{ color: "var(--text-primary)" }}
                >
                  {m.title}
                </h3>
                <p
                  className="text-sm leading-relaxed max-w-[38ch]"
                  style={{ color: "var(--text-muted)" }}
                >
                  {m.body}
                </p>
              </li>
            ))}
          </ol>
        </section>

        <div id="subscribe" className="scroll-mt-24 pb-4">
          <NewsletterCapture />
        </div>
      </div>
    </>
  );
}

function SectionHeader({ id, label }: { id: string; label: string }) {
  return (
    <div className="flex items-center gap-4 mb-6">
      <h2
        id={id}
        className="text-[11px] font-semibold tracking-[0.18em] uppercase whitespace-nowrap"
        style={{ color: "var(--text-muted)" }}
      >
        {label}
      </h2>
      <span
        className="h-px flex-1"
        style={{ background: "var(--border-ghost)" }}
        aria-hidden="true"
      />
    </div>
  );
}
