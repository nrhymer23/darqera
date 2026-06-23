import { getPosts } from "@/lib/posts";
import PostCard from "@/components/PostCard";
import NewsletterCapture from "@/components/NewsletterCapture";

export const revalidate = 60;

export default async function HomePage() {
  const posts = await getPosts();

  return (
    <>
      {/* Full-bleed atmospheric hero */}
      <section className="atmos-field">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-16 sm:py-24">
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
      </section>

      {/* Feed */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
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
          <div>
            {posts.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
        )}

        <NewsletterCapture />
      </div>
    </>
  );
}
