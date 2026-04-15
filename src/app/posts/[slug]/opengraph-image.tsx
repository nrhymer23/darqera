import { ImageResponse } from "next/og";
import { getPostBySlug } from "@/lib/posts";
import { PILLAR_META } from "@/types/post";

export const alt = "DARQ Era Post";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

const PILLAR_COLORS: Record<string, string> = {
  D: "#dbfcff",
  A: "#a7ffb3",
  R: "#fff3f9",
  Q: "#00f0ff",
};

export default async function Image({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = await getPostBySlug(slug);

  if (!post) {
    return new ImageResponse(
      (
        <div
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "#131313",
            color: "#e5e2e1",
            fontSize: 48,
            fontWeight: 700,
          }}
        >
          DARQ ERA
        </div>
      ),
      { ...size }
    );
  }

  const pillarColor = PILLAR_COLORS[post.pillar] ?? "#00f0ff";
  const pillarMeta = PILLAR_META[post.pillar];

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          backgroundColor: "#131313",
          padding: "60px",
          position: "relative",
        }}
      >
        {/* Left accent bar */}
        <div
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            bottom: 0,
            width: "6px",
            backgroundColor: pillarColor,
          }}
        />

        {/* Top: Pillar tag */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            marginBottom: "32px",
          }}
        >
          <div
            style={{
              fontSize: 14,
              fontWeight: 600,
              letterSpacing: "0.15em",
              textTransform: "uppercase",
              color: pillarColor,
              backgroundColor: `${pillarColor}20`,
              padding: "6px 14px",
              borderRadius: "2px",
            }}
          >
            {pillarMeta.full}
          </div>
        </div>

        {/* Title */}
        <div
          style={{
            display: "flex",
            flex: 1,
            alignItems: "flex-start",
          }}
        >
          <div
            style={{
              fontSize: post.title.length > 80 ? 36 : post.title.length > 50 ? 44 : 52,
              fontWeight: 700,
              color: "#e5e2e1",
              lineHeight: 1.15,
              letterSpacing: "-0.02em",
              maxWidth: "90%",
              overflow: "hidden",
            }}
          >
            {post.title}
          </div>
        </div>

        {/* Bottom: Branding + date */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-end",
          }}
        >
          <div
            style={{
              fontSize: 14,
              color: "#8a8a8a",
              letterSpacing: "0.05em",
            }}
          >
            {new Date(post.published_at).toLocaleDateString("en-US", {
              month: "long",
              day: "numeric",
              year: "numeric",
            })}
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "baseline",
              gap: "2px",
            }}
          >
            <span
              style={{
                fontSize: 24,
                fontWeight: 700,
                color: "#00f0ff",
                letterSpacing: "-0.02em",
              }}
            >
              DARQ
            </span>
            <span
              style={{
                fontSize: 24,
                fontWeight: 700,
                color: "#e5e2e1",
                letterSpacing: "-0.02em",
              }}
            >
              ERA
            </span>
          </div>
        </div>
      </div>
    ),
    { ...size }
  );
}
