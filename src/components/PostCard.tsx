import Link from "next/link";
import type { Post } from "@/types/post";
import { PILLAR_META } from "@/types/post";

interface PostCardProps {
  post: Post;
}

export default function PostCard({ post }: PostCardProps) {
  const pillar = PILLAR_META[post.pillar];
  const date = new Date(post.published_at).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return (
    <Link href={`/posts/${post.slug}`} className="group block">
      <article
        className="relative flex gap-4 py-6 transition-colors"
        style={{
          borderBottom: "1px solid var(--border-ghost)",
        }}
      >
        {/* Signal Bar */}
        <div
          className="absolute left-0 top-6 bottom-6 w-[2px] rounded-full"
          style={{ backgroundColor: pillar.color }}
        />

        <div className="pl-5 flex-1 min-w-0">
          {/* Pillar tag */}
          <span
            className="inline-block text-[10px] font-semibold tracking-widest uppercase mb-2 px-2 py-0.5 rounded-[0.125rem]"
            style={{
              color: pillar.color,
              backgroundColor: `${pillar.color}14`,
            }}
          >
            {pillar.full}
          </span>

          {/* Title */}
          <h2
            className="font-[family-name:var(--font-space-grotesk)] font-semibold text-base leading-snug mb-2 group-hover:opacity-80 transition-opacity line-clamp-2"
            style={{ color: "var(--text-primary)" }}
          >
            {post.title}
          </h2>

          {/* Excerpt */}
          <p
            className="text-sm leading-relaxed line-clamp-2 mb-3"
            style={{ color: "var(--text-muted)" }}
          >
            {post.excerpt}
          </p>

          {/* Date */}
          <time
            className="text-[11px] tracking-wide"
            style={{ color: "var(--text-muted)" }}
          >
            {date}
          </time>
        </div>
      </article>
    </Link>
  );
}
