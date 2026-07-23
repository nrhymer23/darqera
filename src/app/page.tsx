import { getPosts } from "@/lib/posts";
import FeedCard from "@/components/FeedCard";
import NewsletterCapture from "@/components/NewsletterCapture";

export const revalidate = 60;

export default async function HomePage() {
  const posts = await getPosts();
  const [featured, ...rest] = posts;

  return (
    <>
      {/* Atmospheric hero — sized so the feed sits just under the fold */}
      <section className="atmos-field flex flex-col justify-center min-h-[72vh]">
        <div className="max-w-6xl w-full mx-auto px-4 sm:px-6 py-14 sm:py-20">
          <p
            className="text-[11px] font-semibold tracking-[0.18em] uppercase mb-4"
            style={{ color: "var(--brand-cyan)" }}
          >
            Signal Feed
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
            className="text-lg leading-relaxed max-w-[48ch]"
            style={{ color: "var(--text-secondary)" }}
          >
            Signal-driven coverage of Decentralization, AI, Reality, and Quantum
            Computing — written from a builder&apos;s perspective.
          </p>
        </div>

        {/* Scroll cue — keeps the first signal visible at the fold */}
        <div className="max-w-6xl w-full mx-auto px-4 sm:px-6 pb-6">
          <div
            className="signal-divider pt-5"
            style={{ borderTop: "1px solid var(--border-ghost)" }}
          >
            <span
              className="text-[11px] font-semibold tracking-[0.18em] uppercase"
              style={{ color: "var(--text-muted)" }}
            >
              Latest signal
            </span>
            <span className="rule" />
            <span className="arrow text-sm" aria-hidden="true">
              ↓
            </span>
          </div>
        </div>
      </section>

      {/* Feed */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
        {posts.length === 0 ? (
          <div className="py-24 text-center">
            <p
              className="text-sm tracking-wide"
              style={{ color: "var(--text-muted)" }}
            >
              Signal incoming. First posts dropping soon.
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

        <NewsletterCapture />
      </div>
    </>
  );
}
