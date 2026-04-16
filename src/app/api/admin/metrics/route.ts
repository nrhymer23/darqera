import { type NextRequest } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

function unauthorized() {
  return Response.json({ error: "Unauthorized" }, { status: 401 });
}

function checkAuth(request: NextRequest): boolean {
  const adminKey = process.env.ADMIN_SECRET_KEY;
  if (!adminKey) return false;
  const provided = request.headers.get("x-admin-key") || request.cookies.get("admin_session")?.value;
  return provided === adminKey;
}

export async function GET(request: NextRequest) {
  if (!checkAuth(request)) return unauthorized();
  if (!supabaseAdmin)
    return Response.json({ error: "Database unavailable" }, { status: 503 });

  try {
    // 1. Total Posts (published vs drafts)
    const { data: posts, error: postsError } = await supabaseAdmin
      .from("posts")
      .select("status, view_count");

    if (postsError) throw postsError;

    let publishedCount = 0;
    let draftCount = 0;
    let totalViews = 0;

    posts?.forEach((post) => {
      if (post.status === "published") publishedCount++;
      if (post.status === "draft") draftCount++;
      if (post.view_count) totalViews += post.view_count;
    });

    // 2. Total Subscribers
    const { count: subscribersCount, error: subError } = await supabaseAdmin
      .from("subscribers")
      .select("*", { count: "exact", head: true });

    if (subError) throw subError;

    return Response.json({
      metrics: {
        publishedPosts: publishedCount,
        draftPosts: draftCount,
        totalViews,
        subscribers: subscribersCount ?? 0,
      },
    });
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
