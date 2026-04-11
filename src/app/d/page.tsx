import { getPosts } from "@/lib/posts";
import PostCard from "@/components/PostCard";
import type { Metadata } from "next";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "Decentralized",
  description:
    "Decentralized networks, protocols, DeFi, DAOs, and the shift toward distributed infrastructure.",
  openGraph: {
    title: "Decentralized — DARQ Era",
    description:
      "Signal-driven coverage of decentralized networks, protocols, DeFi, and DAOs.",
    url: "https://darqera.com/d",
  },
};

export default async function DecentralizedPage() {
  const posts = await getPosts("D");

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
      <div className="mb-10">
        <p
          className="text-[10px] font-semibold tracking-widest uppercase mb-3"
          style={{ color: "#dbfcff" }}
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
          <span style={{ color: "#dbfcff" }}>D</span> — Decentralized
        </h1>
        <p
          className="text-sm max-w-lg leading-relaxed"
          style={{ color: "var(--text-secondary)" }}
        >
          Decentralized networks, protocols, DeFi, DAOs, and the shift toward
          distributed infrastructure.
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
