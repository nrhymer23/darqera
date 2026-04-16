import { type NextRequest } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

// Example POST payload:
// {
//   "title": "Signal: Next-Gen LLMs",
//   "pillar": "A",
//   "content": "Full parsed article content here...",
//   "tags": ["llm", "signal"],
//   "notebookSummary": "NotebookLM parsed summary..."
// }

function unauthorized() {
  return Response.json({ error: "Unauthorized" }, { status: 401 });
}

export async function POST(request: NextRequest) {
  // Use a secret token to protect the webhook
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.ADMIN_SECRET_KEY}`) {
    return unauthorized();
  }

  if (!supabaseAdmin) {
    return Response.json({ error: "Database unavailable" }, { status: 503 });
  }

  try {
    const bodyText = await request.text();
    const payload = JSON.parse(bodyText);

    const { title, pillar, content, tags, notebookSummary } = payload;

    if (!title || !pillar || !content) {
      return Response.json(
        { error: "Missing required fields (title, pillar, content)" },
        { status: 400 }
      );
    }

    const slug = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");

    const excerpt = content.slice(0, 150).trim() + "...";

    // Append NotebookLM summary directly into the body as a highlighted block if provided
    let finalBody = content;
    if (notebookSummary) {
      finalBody = `<div class="bg-card p-4 rounded-sm border border-ghost mb-6">
        <strong class="text-xs tracking-widest uppercase text-muted mb-2 block">NotebookLM Summary</strong>
        <p class="text-secondary text-sm">${notebookSummary}</p>
      </div>
      ${content}`;
    }

    const { data, error } = await supabaseAdmin
      .from("posts")
      .insert({
        title,
        slug,
        pillar,
        excerpt,
        body: finalBody,
        status: "draft", // Always save signals as drafts for admin review
        tags: tags || ["signal"],
      })
      .select()
      .single();

    if (error) throw error;

    return Response.json({ success: true, post: data }, { status: 201 });
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
