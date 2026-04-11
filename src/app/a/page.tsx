import { getPosts } from "@/lib/posts";
import PostCard from "@/components/PostCard";
import type { Metadata } from "next";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "Artificial Intelligence",
  description:
    "Autonomous systems, large language models, AI infrastructure, and the real-world impact of machine intelligence.",
  openGraph: {
    title: "Artificial Intelligence — DARQ Era",
    description:
      "Signal-driven coverage of autonomous systems, LLMs, AI infrastructure.",
    url: "https://darqera.com/a",
  },
};

export default async function AIPage() {
  const posts = await getPosts("A");

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
      <div className="mb-10">
        <p
          className="text-[10px] font-semibold tracking-widest uppercase mb-3"
          style={{ color: "#a7ffb3" }}
        >
          Pillar
        </p>
        <h1
          className="font-[family-name:var(--font-space-grotesk)] font-bold text-3xl sm:text-4xl mb-2"
          style={{
            color: "var(--text-primary)",
            letterSpacing: "-0.02em",
          }}
        >
          <span style={{ color: "#a7ffb3" }}>A</span> — Artificial Intelligence
        </h1>
        <p
          className="text-sm max-w-lg leading-relaxed"
          style={{ color: "var(--text-secondary)" }}
        >
          Autonomous systems, large language models, AI infrastructure, and the
          real-world impact of machine intelligence.
        </p>
      </div>

      {posts.length === 0 ? (
        <div className="py-24 text-center">
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>
            No posts yet. Coming soon.
          </p>
        </div>
      ) : (
        posts.map((post) => <PostCard key={post.id} post={post} />)
      )}
    </div>
  );
}
