import { ImageResponse } from "next/og";
import { getPostBySlug } from "@/lib/posts";
import { COVER_H, COVER_PILLARS, COVER_W, coverArtSvg, coverKicker, coverPillar } from "@/lib/cover";

export const alt = "DARQ Era post";
export const size = { width: COVER_W, height: COVER_H };
export const contentType = "image/png";

/** Same drawing as the in-page cover (lib/cover): art as an SVG layer, type set by Satori. */
export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
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
            backgroundColor: "#121314",
            color: "#E8E5DF",
            fontSize: 64,
            fontWeight: 700,
          }}
        >
          DARQ<span style={{ color: "#00E1EE" }}>ERA</span>
        </div>
      ),
      size,
    );
  }

  const cp = coverPillar(post);
  const color = COVER_PILLARS[cp].c;
  const art = `data:image/svg+xml;base64,${Buffer.from(coverArtSvg(post)).toString("base64")}`;
  const title = post.title.length > 90 ? `${post.title.slice(0, 87)}…` : post.title;
  const fs = title.length > 48 ? 60 : 70;

  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", position: "relative", backgroundColor: "#121314" }}>
        {/* eslint-disable-next-line jsx-a11y/alt-text */}
        <img src={art} width={COVER_W} height={COVER_H} style={{ position: "absolute", top: 0, left: 0 }} />
        {cp !== "X" && (
          <div
            style={{
              position: "absolute",
              right: 30,
              bottom: -150,
              fontSize: 640,
              fontWeight: 700,
              lineHeight: 1,
              color: "rgba(18,19,20,0.55)",
              WebkitTextStroke: `3px ${color}`,
            }}
          >
            {cp}
          </div>
        )}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: COVER_W,
            height: COVER_H,
            display: "flex",
            flexDirection: "column",
            padding: "78px 72px 56px 72px",
          }}
        >
          <div style={{ fontSize: 24, letterSpacing: 3, color, display: "flex" }}>{coverKicker(post)}</div>
          <div
            style={{
              marginTop: 40,
              fontSize: fs,
              fontWeight: 600,
              lineHeight: 1.08,
              letterSpacing: -1.5,
              color: "#E8E5DF",
              maxWidth: 820,
              display: "flex",
            }}
          >
            {title}
          </div>
          <div style={{ marginTop: "auto", display: "flex", alignItems: "baseline", gap: 24 }}>
            <div style={{ fontSize: 30, fontWeight: 700, color: "#00E1EE", display: "flex" }}>
              DARQ<span style={{ color: "#E8E5DF" }}>ERA</span>
            </div>
            <div style={{ fontSize: 20, color: "#8E8B85", display: "flex" }}>darqera.com</div>
          </div>
        </div>
      </div>
    ),
    size,
  );
}
