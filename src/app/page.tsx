import { getPosts } from "@/lib/posts";
import PostCard from "@/components/PostCard";

export const revalidate = 60;

export default async function HomePage() {
  const posts = await getPosts();

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
      {/* Hero */}
      <div className="mb-12">
        <p
          className="text-[10px] font-semibold tracking-widest uppercase mb-3"
          style={{ color: "#00f0ff" }}
        >
          Signal Feed
        </p>
        <h1
          className="font-[family-name:var(--font-space-grotesk)] font-bold text-[clamp(2rem,6vw,4rem)] leading-[1.05] tracking-tight mb-4"
          style={{ color: "var(--text-primary)", letterSpacing: "-0.02em" }}
        >
          The DARQ Era
          <br />
          <span style={{ color: "#00f0ff" }}>is already here.</span>
        </h1>
        <p
          className="text-base max-w-xl leading-relaxed"
          style={{ color: "var(--text-secondary)" }}
        >
          Signal-driven coverage of Decentralization, AI, Reality, and Quantum
          Computing — written from a builder&apos;s perspective.
        </p>
      </div>

      {/* Feed */}
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
    </div>
  );
}
