import { type NextRequest } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { checkAdminAuth, unauthorized } from "@/lib/adminAuth";
import { sanitizePostHtml } from "@/lib/postHtml";

/**
 * GET /api/admin/posts — list all posts (including drafts)
 */
export async function GET(request: NextRequest) {
  if (!checkAdminAuth(request)) return unauthorized();
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
  if (!checkAdminAuth(request)) return unauthorized();
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
    body: sanitizePostHtml(typeof postBody === "string" ? postBody : ""),
    status: status || "draft",
    tags: tags || [],
  }).select().single();

  if (error)
    return Response.json({ error: error.message }, { status: 500 });

  return Response.json({ post: data }, { status: 201 });
}

/**
 * PATCH /api/admin/posts — update an existing post
 * Expects JSON body: { id: string, ...fields }
 * Publishing a draft stamps published_at so the feed orders by real publish time.
 */
export async function PATCH(request: NextRequest) {
  if (!checkAdminAuth(request)) return unauthorized();
  if (!supabaseAdmin)
    return Response.json({ error: "Database unavailable" }, { status: 503 });

  const body = await request.json();
  const { id, title, slug, pillar, excerpt, body: postBody, status, tags } = body;

  if (!id) {
    return Response.json({ error: "Post ID is required" }, { status: 400 });
  }

  const updates: Record<string, unknown> = {};
  if (title !== undefined) updates.title = title;
  if (slug !== undefined) updates.slug = slug;
  if (pillar !== undefined) updates.pillar = pillar;
  if (excerpt !== undefined) updates.excerpt = excerpt;
  if (postBody !== undefined) {
    updates.body = sanitizePostHtml(typeof postBody === "string" ? postBody : "");
  }
  if (tags !== undefined) updates.tags = tags;

  if (status !== undefined) {
    updates.status = status;
    if (status === "published") {
      const { data: existing } = await supabaseAdmin
        .from("posts")
        .select("status")
        .eq("id", id)
        .single();
      if (existing?.status !== "published") {
        updates.published_at = new Date().toISOString();
      }
    }
  }

  if (Object.keys(updates).length === 0) {
    return Response.json({ error: "No fields to update" }, { status: 400 });
  }

  const { data, error } = await supabaseAdmin
    .from("posts")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error)
    return Response.json({ error: error.message }, { status: 500 });

  return Response.json({ post: data });
}

/**
 * DELETE /api/admin/posts — delete a post by ID
 * Expects JSON body: { id: string }
 */
export async function DELETE(request: NextRequest) {
  if (!checkAdminAuth(request)) return unauthorized();
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
