import { getPosts } from "@/lib/posts";
import PostCard from "@/components/PostCard";

export const revalidate = 60;

export default async function RealityPage() {
  const posts = await getPosts("R");

  return (
    <div className="max-w-6xl mx-auto px-6 py-12">
      <div className="mb-10">
        <p className="text-[10px] font-semibold tracking-widest uppercase text-[#fff3f9] mb-3">
          Pillar
        </p>
        <h1
          className="font-[family-name:var(--font-space-grotesk)] font-bold text-4xl text-[#e5e2e1] mb-2"
          style={{ letterSpacing: "-0.02em" }}
        >
          <span style={{ color: "#fff3f9" }}>R</span> — Reality
        </h1>
        <p className="text-[#8a8a8a] text-sm max-w-lg leading-relaxed">
          Extended reality, augmented reality, virtual worlds, and the
          intersection of digital and physical experience.
        </p>
      </div>

      {posts.length === 0 ? (
        <div className="py-24 text-center">
          <p className="text-[#8a8a8a] text-sm">No posts yet. Coming soon.</p>
        </div>
      ) : (
        posts.map((post) => <PostCard key={post.id} post={post} />)
      )}
    </div>
  );
}
