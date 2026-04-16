import { getPostsByTag } from "@/lib/posts";
import PostCard from "@/components/PostCard";
import type { Metadata } from "next";

export const revalidate = 60;

type Props = {
  params: Promise<{ tag: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { tag } = await params;
  return {
    title: `Posts tagged "${tag}"`,
    description: `DARQ Era tech editorial posts for ${tag}.`,
    openGraph: {
      title: `Posts tagged "${tag}" — DARQ Era`,
      description: `Signal-driven coverage tagged with ${tag}.`,
      url: `https://darqera.com/tags/${tag}`,
    },
  };
}

export default async function TagPage({ params }: Props) {
  const { tag } = await params;
  const posts = await getPostsByTag(tag);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
      <div className="mb-10">
        <p
          className="text-[10px] font-semibold tracking-widest uppercase mb-3"
          style={{ color: "var(--text-muted)" }}
        >
          Tag
        </p>
        <h1
          className="font-[family-name:var(--font-space-grotesk)] font-bold text-3xl sm:text-4xl mb-2"
          style={{
            color: "var(--text-primary)",
            letterSpacing: "-0.02em",
          }}
        >
          #{tag}
        </h1>
        <p
          className="text-sm max-w-lg leading-relaxed"
          style={{ color: "var(--text-secondary)" }}
        >
          {posts.length} {posts.length === 1 ? "post" : "posts"} matching this tag.
        </p>
      </div>

      {posts.length === 0 ? (
        <div className="py-24 text-center">
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>
            No posts found for this tag.
          </p>
        </div>
      ) : (
        posts.map((post) => <PostCard key={post.id} post={post} />)
      )}
    </div>
  );
}
