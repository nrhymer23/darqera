import type { MetadataRoute } from "next";
import { getPosts } from "@/lib/posts";
import { SITE_URL } from "@/lib/site";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const posts = await getPosts();

  const staticPages: MetadataRoute.Sitemap = [
    { url: SITE_URL, changeFrequency: "daily", priority: 1 },
    { url: `${SITE_URL}/archive`, changeFrequency: "daily", priority: 0.8 },
    { url: `${SITE_URL}/about`, changeFrequency: "monthly", priority: 0.5 },
    ...(["d", "a", "r", "q"] as const).map((p) => ({
      url: `${SITE_URL}/${p}`,
      changeFrequency: "daily" as const,
      priority: 0.7,
    })),
  ];

  const postPages: MetadataRoute.Sitemap = posts.map((post) => ({
    url: `${SITE_URL}/posts/${post.slug}`,
    lastModified: new Date(post.published_at),
    changeFrequency: "weekly",
    priority: 0.9,
  }));

  return [...staticPages, ...postPages];
}
