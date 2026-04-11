import { getPostBySlug } from "@/lib/posts";
import { PILLAR_META } from "@/types/post";
import Link from "next/link";
import { notFound } from "next/navigation";

export const revalidate = 60;

interface Props {
  params: Promise<{ slug: string }>;
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

  return (
    <div className="max-w-3xl mx-auto px-6 py-12">
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
          className="font-[family-name:var(--font-space-grotesk)] font-bold text-[clamp(1.75rem,4vw,2.75rem)] leading-[1.1] text-[#e5e2e1] mb-4"
          style={{ letterSpacing: "-0.02em" }}
        >
          {post.title}
        </h1>

        <p className="text-[#8a8a8a] text-base leading-relaxed mb-4">
          {post.excerpt}
        </p>

        <time className="text-[11px] text-[#8a8a8a] tracking-wide">{date}</time>

        {/* Divider */}
        <div
          className="mt-8 h-[2px] w-12 rounded-full"
          style={{ backgroundColor: pillar.color }}
        />
      </header>

      {/* Body */}
      <article className="prose prose-invert max-w-none text-[#e5e2e1] leading-relaxed">
        <div
          className="whitespace-pre-wrap text-base leading-8 text-[#c8c5c4]"
          dangerouslySetInnerHTML={{ __html: post.body }}
        />
      </article>

      {/* Tags */}
      {post.tags?.length > 0 && (
        <div className="mt-12 flex flex-wrap gap-2">
          {post.tags.map((tag) => (
            <span
              key={tag}
              className="text-[10px] font-semibold tracking-widest uppercase px-2 py-1 rounded-[0.125rem] text-[#8a8a8a]"
              style={{ backgroundColor: "#1c1b1b" }}
            >
              {tag}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
