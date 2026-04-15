import { type NextRequest } from "next/server";
import { supabase } from "@/lib/supabase";

// Simple in-memory rate limiting (IP + slug → last viewed timestamp)
const viewCache = new Map<string, number>();
const COOLDOWN_MS = 60 * 1000; // 1 minute per IP per slug

export async function POST(request: NextRequest) {
  try {
    const { slug } = await request.json();

    if (!slug || typeof slug !== "string") {
      return Response.json({ error: "Missing slug" }, { status: 400 });
    }

    if (!supabase) {
      return Response.json({ error: "Database unavailable" }, { status: 503 });
    }

    // Rate limit by IP + slug
    const ip = request.headers.get("x-forwarded-for") ?? "unknown";
    const cacheKey = `${ip}:${slug}`;
    const lastView = viewCache.get(cacheKey);
    const now = Date.now();

    if (lastView && now - lastView < COOLDOWN_MS) {
      // Already counted recently — return current count without incrementing
      const { data } = await supabase
        .from("posts")
        .select("view_count")
        .eq("slug", slug)
        .single();

      return Response.json({ view_count: data?.view_count ?? 0 });
    }

    // Increment view count
    const { data, error } = await supabase.rpc("increment_view_count", {
      post_slug: slug,
    });

    if (error) {
      // Fallback: try direct update if RPC doesn't exist
      const { data: post } = await supabase
        .from("posts")
        .select("view_count")
        .eq("slug", slug)
        .single();

      if (post) {
        const newCount = (post.view_count ?? 0) + 1;
        await supabase
          .from("posts")
          .update({ view_count: newCount })
          .eq("slug", slug);

        viewCache.set(cacheKey, now);
        return Response.json({ view_count: newCount });
      }

      return Response.json({ error: "Post not found" }, { status: 404 });
    }

    viewCache.set(cacheKey, now);
    return Response.json({ view_count: data });
  } catch {
    return Response.json({ error: "Internal error" }, { status: 500 });
  }
}
