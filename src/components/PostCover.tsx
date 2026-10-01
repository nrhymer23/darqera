import Image from "next/image";
import type { Post } from "@/types/post";
import PillarCanvas from "@/components/PillarCanvas";

interface PostCoverProps {
  post: Pick<Post, "pillar" | "title" | "cover_image" | "cover_alt">;
  /** `sizes` hint for responsive loading. */
  sizes: string;
  priority?: boolean;
}

/**
 * A post's cover: the uploaded image when there is one, otherwise the
 * generative art for its pillar. Fills its positioned parent.
 */
export default function PostCover({ post, sizes, priority = false }: PostCoverProps) {
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
  return <PillarCanvas pillar={post.pillar} />;
}
