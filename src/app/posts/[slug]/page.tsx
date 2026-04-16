import { getPostBySlug } from "@/lib/posts";
import { PILLAR_META } from "@/types/post";
import { getReadingTime } from "@/lib/readingTime";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import RelatedPosts from "@/components/RelatedPosts";
import NewsletterCapture from "@/components/NewsletterCapture";
import ViewCounter from "@/components/ViewCounter";

export const revalidate = 60;

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPostBySlug(slug);

  if (!post) {
    return { title: "Post Not Found" };
  }

  const pillar = PILLAR_META[post.pillar];

  return {
    title: post.title,
    description: post.excerpt,
    openGraph: {
      title: post.title,
      description: post.excerpt,
      url: `https://darqera.com/posts/${post.slug}`,
      type: "article",
      publishedTime: post.published_at,
      tags: post.tags,
      section: pillar.full,
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: post.excerpt,
    },
  };
}

export default async function PostPage({ params }: Props) {
  const { slug } = await params;
  const post = await getPostBySlug(slug);

  if (!post) notFound();

  const pillar = PILLAR_META[post.pillar];
  const date = new Date(post.published_at).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
  const readMin = getReadingTime(post.body);

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
      {/* Back */}
      <Link
        href={pillar.href}
        className="inline-flex items-center gap-2 text-[11px] font-semibold tracking-widest uppercase mb-8 transition-opacity hover:opacity-70"
        style={{ color: pillar.color }}
      >
        ← {pillar.full}
      </Link>

      {/* Header */}
      <header className="mb-10">
        <span
          className="inline-block text-[10px] font-semibold tracking-widest uppercase mb-4 px-2 py-0.5 rounded-[0.125rem]"
          style={{
            color: pillar.color,
            backgroundColor: `${pillar.color}14`,
          }}
        >
          {pillar.full}
        </span>

        <h1
          className="font-[family-name:var(--font-space-grotesk)] font-bold text-[clamp(1.75rem,4vw,2.75rem)] leading-[1.1] mb-4"
          style={{
            color: "var(--text-primary)",
            letterSpacing: "-0.02em",
          }}
        >
          {post.title}
        </h1>

        <p
          className="text-base leading-relaxed mb-4"
          style={{ color: "var(--text-secondary)" }}
        >
          {post.excerpt}
        </p>

        {/* Date + Reading time + Views */}
        <div
          className="flex items-center gap-2 text-[11px] tracking-wide"
          style={{ color: "var(--text-muted)" }}
        >
          <time>{date}</time>
          <span>·</span>
          <span>{readMin} min read</span>
          <span>·</span>
          <ViewCounter slug={slug} initialCount={post.view_count ?? 0} />
        </div>

        {/* Divider */}
        <div
          className="mt-8 h-[2px] w-12 rounded-full"
          style={{ backgroundColor: pillar.color }}
        />
      </header>

      {/* Body */}
      <article>
        <div
          className="whitespace-pre-wrap text-base leading-8"
          style={{ color: "var(--text-secondary)" }}
          dangerouslySetInnerHTML={{ __html: post.body }}
        />
      </article>

      {/* Tags */}
      {post.tags?.length > 0 && (
        <div className="mt-12 flex flex-wrap gap-2">
          {post.tags.map((tag) => (
            <Link
              key={tag}
              href={`/tags/${encodeURIComponent(tag)}`}
              className="text-[10px] font-semibold tracking-widest uppercase px-2 py-1 rounded-[0.125rem] transition-opacity hover:opacity-70"
              style={{
                color: "var(--text-muted)",
                backgroundColor: "var(--bg-card)",
              }}
            >
              #{tag}
            </Link>
          ))}
        </div>
      )}

      {/* Related Posts */}
      <RelatedPosts currentSlug={slug} pillar={post.pillar} />

      {/* Newsletter */}
      <NewsletterCapture />
    </div>
  );
}
