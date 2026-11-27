import Image from "next/image";
import type { Post } from "@/types/post";
import { coverSvg } from "@/lib/cover";

interface PostCoverProps {
  post: Pick<Post, "slug" | "pillar" | "title" | "cover_image" | "cover_alt"> &
    Partial<Pick<Post, "series_day" | "kind" | "cross_pillar">>;
  /** `sizes` hint for responsive loading. */
  sizes: string;
  priority?: boolean;
  /** Hide the DARQERA wordmark (small thumbnails). */
  label?: boolean;
}

/**
 * A post's cover: the uploaded image when there is one, otherwise the
 * generated A2 type card for its pillar (same drawing as the OG image).
 * Fills its positioned parent.
 */
export default function PostCover({ post, sizes, priority = false, label = true }: PostCoverProps) {
  if (post.cover_image) {
    return (
      <Image
        src={post.cover_image}
        alt={post.cover_alt || post.title}
        fill
        sizes={sizes}
        priority={priority}
        className="object-cover"
      />
    );
  }
  return (
    <div
      className="cover-art"
      // coverSvg escapes all post text it embeds.
      dangerouslySetInnerHTML={{ __html: coverSvg(post, { label }) }}
    />
  );
}
