import { type NextRequest } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { postTweet } from "@/lib/twitter";

function unauthorized() {
  return Response.json({ error: "Unauthorized" }, { status: 401 });
}

function checkAuth(request: NextRequest): boolean {
  const adminKey = process.env.ADMIN_SECRET_KEY;
  if (!adminKey) return false;
  const provided = request.headers.get("x-admin-key");
  return provided === adminKey;
}

/**
 * GET /api/admin/posts — list all posts (including drafts)
 */
export async function GET(request: NextRequest) {
  if (!checkAuth(request)) return unauthorized();
  if (!supabaseAdmin)
    return Response.json({ error: "Database unavailable" }, { status: 503 });

  const { data, error } = await supabaseAdmin
    .from("posts")
    .select("*")
    .order("published_at", { ascending: false });

  if (error)
    return Response.json({ error: error.message }, { status: 500 });

  return Response.json({ posts: data });
}

/**
 * POST /api/admin/posts — create a new post
 */
export async function POST(request: NextRequest) {
  if (!checkAuth(request)) return unauthorized();
  if (!supabaseAdmin)
    return Response.json({ error: "Database unavailable" }, { status: 503 });

  const body = await request.json();
  const { title, slug, pillar, excerpt, body: postBody, status, tags } = body;

  // Validate required fields
  if (!title || !pillar) {
    return Response.json(
      { error: "Title and pillar are required" },
      { status: 400 }
    );
  }

  // Auto-generate slug if not provided
  const finalSlug =
    slug ||
    title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");

  const { data, error } = await supabaseAdmin.from("posts").insert({
    title,
    slug: finalSlug,
    pillar,
    excerpt: excerpt || "",
    body: postBody || "",
    status: status || "draft",
    tags: tags || [],
  }).select().single();

  if (error)
    return Response.json({ error: error.message }, { status: 500 });

  // Auto-share to Twitter if published
  if (data.status === "published") {
    // Fire and forget
    postTweet(data.title, data.slug, data.excerpt).catch(err => {
      console.error("Async tweet error:", err);
    });
  }

  return Response.json({ post: data }, { status: 201 });
}

/**
 * DELETE /api/admin/posts — delete a post by ID
 * Expects JSON body: { id: string }
 */
export async function DELETE(request: NextRequest) {
  if (!checkAuth(request)) return unauthorized();
  if (!supabaseAdmin)
    return Response.json({ error: "Database unavailable" }, { status: 503 });

  const { id } = await request.json();

  if (!id) {
    return Response.json({ error: "Post ID is required" }, { status: 400 });
  }

  const { error } = await supabaseAdmin.from("posts").delete().eq("id", id);

  if (error)
    return Response.json({ error: error.message }, { status: 500 });

  return Response.json({ success: true });
}
