import { getPosts } from "@/lib/posts";
import PostCard from "@/components/PostCard";
import type { Metadata } from "next";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "Quantum",
  description:
    "Quantum computing, cryptography, quantum supremacy, and what post-classical computing means for the world.",
  openGraph: {
    title: "Quantum — DARQ Era",
    description:
      "Signal-driven coverage of quantum computing, cryptography, and post-classical computing.",
    url: "https://darqera.com/q",
  },
};

export default async function QuantumPage() {
  const posts = await getPosts("Q");

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
      <div className="mb-10">
        <p
          className="text-[10px] font-semibold tracking-widest uppercase mb-3"
          style={{ color: "#00f0ff" }}
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
          <span style={{ color: "#00f0ff" }}>Q</span> — Quantum
        </h1>
        <p
          className="text-sm max-w-lg leading-relaxed"
          style={{ color: "var(--text-secondary)" }}
        >
          Quantum computing, cryptography, quantum supremacy, and what
          post-classical computing means for the world.
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
