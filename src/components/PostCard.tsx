import Link from "next/link";
import type { Post } from "@/types/post";
import { PILLAR_META } from "@/types/post";
import { getReadingTime } from "@/lib/readingTime";
import SignalStrength from "@/components/SignalStrength";
import { DEFAULT_SIGNAL } from "@/lib/signal";

interface PostCardProps {
  post: Post;
}

export default function PostCard({ post }: PostCardProps) {
  const pillar = PILLAR_META[post.pillar];
  const pillarVar = `var(--pillar-${post.pillar.toLowerCase()})`;
  const date = new Date(post.published_at).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
  const readMin = getReadingTime(post.body);

  return (
    <Link href={`/posts/${post.slug}`} className="group block">
      <article
        className="flex gap-4 py-6 transition-transform duration-150 group-hover:-translate-y-px"
        style={{ borderBottom: "1px solid var(--border-ghost)" }}
      >
        {/* Signal Strength */}
        <div className="pt-1.5 shrink-0">
          <SignalStrength level={DEFAULT_SIGNAL} />
        </div>

        <div className="flex-1 min-w-0">
          {/* Meta line: pillar tag + reading time */}
          <div className="flex items-center gap-2.5 mb-2">
            <span
              className="inline-block text-[10px] font-semibold tracking-widest uppercase px-2 py-0.5 rounded-[0.125rem]"
              style={{ color: pillarVar, border: `1px solid ${pillarVar}` }}
            >
              {pillar.full}
            </span>
            <span
              className="text-[11px] tracking-wide"
              style={{ color: "var(--text-muted)" }}
            >
              {readMin} min read
            </span>
          </div>

          {/* Title */}
          <h2 className="font-[family-name:var(--font-space-grotesk)] font-semibold text-lg leading-snug mb-2 line-clamp-2 text-[color:var(--text-primary)] group-hover:text-[color:var(--brand-cyan)] transition-colors">
            {post.title}
          </h2>

          {/* Excerpt */}
          <p
            className="text-sm leading-relaxed line-clamp-2 mb-3"
            style={{ color: "var(--text-muted)" }}
          >
            {post.excerpt}
          </p>

          {/* Date + Views */}
          <div
            className="flex items-center gap-2 text-[11px] tracking-wide"
            style={{ color: "var(--text-muted)" }}
          >
            <time>{date}</time>
            {post.view_count != null && post.view_count > 0 && (
              <>
                <span>·</span>
                <span>{post.view_count.toLocaleString()} views</span>
              </>
            )}
          </div>
        </div>
      </article>
    </Link>
  );
}
