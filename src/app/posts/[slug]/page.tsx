import { getPostBySlug, getSeriesPosts } from "@/lib/posts";
import { PILLAR_META } from "@/types/post";
import { getReadingTime } from "@/lib/readingTime";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import RelatedPosts from "@/components/RelatedPosts";
import NewsletterCapture from "@/components/NewsletterCapture";
import ViewCounter from "@/components/ViewCounter";
import PostCover from "@/components/PostCover";
import SeriesNav from "@/components/SeriesNav";
import { wrapBeats } from "@/lib/postBody";
import { coverPillar } from "@/lib/cover";

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
      authors: ["Noel Rhymer"],
      ...(post.updated_at ? { modifiedTime: post.updated_at } : {}),
      ...(post.cover_image ? { images: [{ url: post.cover_image, alt: post.cover_alt || post.title }] } : {}),
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: post.excerpt,
      ...(post.cover_image ? { images: [post.cover_image] } : {}),
    },
  };
}

export default async function PostPage({ params }: Props) {
  const { slug } = await params;
  const post = await getPostBySlug(slug);

  if (!post) notFound();

  const pillar = PILLAR_META[post.pillar];
  const cp = coverPillar(post);
  const pc = `var(--${cp === "X" ? "x" : cp.toLowerCase()})`;
  const fmt = (d: string) =>
    new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  const date = fmt(post.published_at);
  const updated =
    post.updated_at && new Date(post.updated_at).getTime() - new Date(post.published_at).getTime() > 3600e3
      ? fmt(post.updated_at)
      : null;
  const readMin = getReadingTime(post.body);
  const day = post.series_day ?? null;
  const series = day ? await getSeriesPosts() : [];
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.excerpt,
    datePublished: post.published_at,
    ...(post.updated_at ? { dateModified: post.updated_at } : {}),
    author: { "@type": "Person", name: "Noel Rhymer", url: "https://darqera.com/about" },
    publisher: { "@type": "Organization", name: "DARQ Era", url: "https://darqera.com" },
    mainEntityOfPage: `https://darqera.com/posts/${post.slug}`,
    image: `https://darqera.com/posts/${post.slug}/opengraph-image`,
    articleSection: pillar.full,
  };

  return (
    <div className="post-a2" style={{ "--pc": pc } as React.CSSProperties}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
      />
      {day && (
        <div className="series-bar" aria-hidden="true">
          <i style={{ width: `${(day / 30) * 100}%` }} />
        </div>
      )}
      <header className="post-a2__col post-a2__header">
        <div className="post-a2__kick">
          {post.kind === "news" && <span className="chip chip--filled">Major news</span>}
          {cp === "X" ? (
            <span className="chip" style={{ color: "var(--x)" }}>
              DARQ · All four
            </span>
          ) : (
            <Link href={pillar.href} className="chip" style={{ color: pc }}>
              {pillar.label} · {pillar.full}
            </Link>
          )}
          {day && <span className="mono-label">Day {day} of 30</span>}
        </div>
        <h1 className="post-a2__h1">{post.title}</h1>
        {post.excerpt && <p className="post-a2__dek">{post.excerpt}</p>}
        <div className="post-a2__byline">
          <div className="post-a2__author">
            <span className="grule" aria-hidden="true" />
            <span className="gtag">Written by</span>
            <Link href="/about" className="sig">
              Noel Rhymer
            </Link>
          </div>
          <p className="mono-label post-a2__meta">
            <time dateTime={post.published_at}>{date}</time> · {readMin} min read
            {updated && (
              <>
                {" "}· Updated <time dateTime={post.updated_at!}>{updated}</time>
              </>
            )}
          </p>
        </div>
      </header>

      <figure className="post-a2__cover">
        <div className="post-a2__frame">
          <PostCover post={post} sizes="(min-width: 928px) 880px, 100vw" priority />
        </div>
      </figure>

      <article className="post-a2__col">
        <div className="post-body" dangerouslySetInnerHTML={{ __html: wrapBeats(post.body) }} />

        {post.tags?.length > 0 && (
          <div className="post-a2__tags">
            {post.tags.map((tag) => (
              <Link key={tag} href={`/tags/${encodeURIComponent(tag)}`} className="mono-label">
                #{tag}
              </Link>
            ))}
          </div>
        )}

        {day && <SeriesNav current={day} series={series} />}
        <NewsletterCapture />
        <RelatedPosts currentSlug={slug} pillar={post.pillar} />
      </article>
      <ViewCounter slug={slug} initialCount={post.view_count ?? 0} hidden />
    </div>
  );
}
