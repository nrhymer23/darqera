import type { Metadata } from "next";
import { getPosts } from "@/lib/posts";
import PostCard from "@/components/PostCard";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "Archive",
  description: "Every DARQ Era post, newest first.",
};

export default async function ArchivePage() {
  const posts = await getPosts();

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
      <p
        className="text-[11px] font-semibold tracking-[0.18em] uppercase mb-4"
        style={{ color: "var(--brand-cyan)" }}
      >
        Archive
      </p>
      <h1
        className="font-[family-name:var(--font-space-grotesk)] font-bold text-[clamp(2rem,5vw,3rem)] leading-[1.1] tracking-[-0.025em] mb-2"
        style={{ color: "var(--text-primary)" }}
      >
        Every signal, on record.
      </h1>
      <p className="text-sm mb-8" style={{ color: "var(--text-muted)" }}>
        {posts.length} {posts.length === 1 ? "post" : "posts"} · newest first
      </p>

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
