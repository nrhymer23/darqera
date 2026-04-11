import { getPosts } from "@/lib/posts";
import PostCard from "@/components/PostCard";

export const revalidate = 60;

export default async function HomePage() {
  const posts = await getPosts();

  return (
    <div className="max-w-6xl mx-auto px-6 py-12">
      {/* Hero */}
      <div className="mb-12">
        <p className="text-[10px] font-semibold tracking-widest uppercase text-[#00f0ff] mb-3">
          Signal Feed
        </p>
        <h1
          className="font-[family-name:var(--font-space-grotesk)] font-bold text-[clamp(2.5rem,6vw,4rem)] leading-[1.05] tracking-tight text-[#e5e2e1] mb-4"
          style={{ letterSpacing: "-0.02em" }}
        >
          The DARQ Era
          <br />
          <span className="text-[#00f0ff]">is already here.</span>
        </h1>
        <p className="text-[#8a8a8a] text-base max-w-xl leading-relaxed">
          Signal-driven coverage of Decentralization, AI, Reality, and Quantum
          Computing — written from a builder&apos;s perspective.
        </p>
      </div>

      {/* Feed */}
      {posts.length === 0 ? (
        <div className="py-24 text-center">
          <p className="text-[#8a8a8a] text-sm tracking-wide">
            Signal incoming. First posts dropping soon.
          </p>
        </div>
      ) : (
        <div className="divide-y-0">
          {posts.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
        </div>
      )}
    </div>
  );
}
