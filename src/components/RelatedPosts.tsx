import { getRelatedPosts } from "@/lib/posts";
import { PILLAR_META } from "@/types/post";
import type { Pillar } from "@/types/post";
import Link from "next/link";
import { getReadingTime } from "@/lib/readingTime";

interface RelatedPostsProps {
  currentSlug: string;
  pillar: Pillar;
}

export default async function RelatedPosts({
  currentSlug,
  pillar,
}: RelatedPostsProps) {
  const posts = await getRelatedPosts(pillar, currentSlug, 3);

  if (posts.length === 0) return null;

  const meta = PILLAR_META[pillar];

  return (
    <section className="mt-16">
      {/* Section header */}
      <div className="mb-6">
        <p
          className="text-[10px] font-semibold tracking-widest uppercase mb-2"
          style={{ color: meta.color }}
        >
          Keep reading
        </p>
        <h3
          className="font-[family-name:var(--font-space-grotesk)] font-bold text-lg"
          style={{ color: "var(--text-primary)", letterSpacing: "-0.02em" }}
        >
          More from {meta.full}
        </h3>
      </div>

      {/* Related post cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        {posts.map((post) => {
          const date = new Date(post.published_at).toLocaleDateString(
            "en-US",
            { month: "short", day: "numeric" }
          );
          const readMin = getReadingTime(post.body);

          return (
            <Link
              key={post.id}
              href={`/posts/${post.slug}`}
              className="group block relative py-5 px-5 rounded-[0.125rem] transition-colors"
              style={{
                backgroundColor: "var(--bg-card)",
                border: "1px solid var(--border-ghost)",
              }}
              onMouseEnter={undefined}
            >
              {/* Signal bar */}
              <div
                className="absolute left-0 top-5 bottom-5 w-[2px] rounded-full"
                style={{ backgroundColor: meta.color }}
              />

              <span
                className="inline-block text-[10px] font-semibold tracking-widest uppercase mb-2 px-2 py-0.5 rounded-[0.125rem]"
                style={{
                  color: meta.color,
                  backgroundColor: `${meta.color}14`,
                }}
              >
                {meta.full}
              </span>

              <h4
                className="font-[family-name:var(--font-space-grotesk)] font-semibold text-sm leading-snug mb-3 group-hover:opacity-80 transition-opacity line-clamp-2"
                style={{ color: "var(--text-primary)" }}
              >
                {post.title}
              </h4>

              <p
                className="text-[11px] tracking-wide"
                style={{ color: "var(--text-muted)" }}
              >
                {date} · {readMin} min read
              </p>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
