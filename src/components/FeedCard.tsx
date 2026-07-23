import Link from "next/link";
import type { Post } from "@/types/post";
import { PILLAR_META } from "@/types/post";
import { getReadingTime } from "@/lib/readingTime";
import SignalStrength from "@/components/SignalStrength";
import { postSignalLevel } from "@/lib/signal";
import PillarCanvas from "@/components/PillarCanvas";

interface FeedCardProps {
  post: Post;
  /** Large hero-style card for the newest signal. */
  featured?: boolean;
}

export default function FeedCard({ post, featured = false }: FeedCardProps) {
  const pillar = PILLAR_META[post.pillar];
  const pillarVar = `var(--pillar-${post.pillar.toLowerCase()})`;
  const date = new Date(post.published_at).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
  const readMin = getReadingTime(post.body);

  const PillarTag = (
    <span
      className="inline-block text-[10px] font-semibold tracking-widest uppercase px-2 py-0.5 rounded-[0.125rem]"
      style={{ color: pillarVar, border: `1px solid ${pillarVar}` }}
    >
      {pillar.full}
    </span>
  );

  return (
    <Link
      href={`/posts/${post.slug}`}
      className={`feed-card group ${featured ? "feed-card--featured" : ""}`}
    >
      <div
        className="feed-card__cover"
        style={{ ["--pillar" as string]: pillarVar }}
      >
        <PillarCanvas pillar={post.pillar} />
      </div>

      <div className="feed-card__body">
        <div className="flex items-center gap-2.5 mb-2.5">
          {PillarTag}
          <span
            className="text-[11px] tracking-wide"
            style={{ color: "var(--text-muted)" }}
          >
            {readMin} min read
          </span>
        </div>

        <h2
          className={`font-[family-name:var(--font-space-grotesk)] font-semibold leading-snug mb-2 text-[color:var(--text-primary)] group-hover:text-[color:var(--brand-cyan)] transition-colors ${
            featured
              ? "text-[clamp(1.5rem,2.6vw,2.25rem)] tracking-[-0.02em]"
              : "text-lg line-clamp-2"
          }`}
        >
          {post.title}
        </h2>

        <p
          className={`text-sm leading-relaxed mb-4 ${
            featured ? "max-w-[46ch] line-clamp-3" : "line-clamp-2"
          }`}
          style={{ color: "var(--text-muted)" }}
        >
          {post.excerpt}
        </p>

        <div className="mt-auto flex items-center gap-2.5">
          <SignalStrength level={postSignalLevel(post)} />
          <span
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
          </span>
          {featured && (
            <span
              className="ml-auto text-[13px] font-semibold hidden sm:inline"
              style={{ color: "var(--brand-cyan)" }}
            >
              Read the signal →
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
