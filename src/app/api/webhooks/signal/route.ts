import { type NextRequest } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { checkAdminAuth, unauthorized } from "@/lib/adminAuth";

// Example POST payload (pipeline → blog):
// {
//   "title": "Signal: Next-Gen LLMs",
//   "pillar": "A",
//   "content": "Full draft content (markdown or HTML)...",
//   "tags": ["llm", "signal"],
//   "notebookSummary": "Optional summary shown in a highlighted block",
//   "signalStrength": 2,              // optional, 1-3 (cluster consensus)
//   "sources": ["https://..."],        // optional, rendered as a Sources list
//   "snapshotId": "uuid",              // preferred, approval idempotency key
//   "clusterId": "ai:topic-slug"       // legacy compatibility key
// }

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export async function POST(request: NextRequest) {
  if (!checkAdminAuth(request)) return unauthorized();

  if (!supabaseAdmin) {
    return Response.json({ error: "Database unavailable" }, { status: 503 });
  }

  try {
    const payload = await request.json();
    const {
      title, pillar, content, tags, notebookSummary, signalStrength, sources,
      clusterId, snapshotId,
    } = payload;

    if (!title || !pillar || !content) {
      return Response.json(
        { error: "Missing required fields (title, pillar, content)" },
        { status: 400 }
      );
    }

    if (!snapshotId && !clusterId) {
      return Response.json(
        { error: "Missing required identifier (snapshotId or clusterId)" },
        { status: 400 },
      );
    }

    // New approvals dedupe by immutable snapshot. Cluster tags remain available
    // for records produced by the legacy drafting path.
    const idempotencyTag = snapshotId
      ? `snapshot:${snapshotId}`
      : `cluster:${clusterId}`;
    if (idempotencyTag) {
      const { data: existing } = await supabaseAdmin
        .from("posts")
        .select("id, slug")
        .contains("tags", [idempotencyTag])
        .maybeSingle();
      if (existing) {
        return Response.json(
          {
            success: true,
            status: "draft",
            published: false,
            post: existing,
            url: `/admin?post=${existing.id}`,
            duplicate: true,
          },
          { status: 200 }
        );
      }
    }

    const excerpt = content.replace(/<[^>]+>/g, "").slice(0, 150).trim() + "...";

    let finalBody = content;
    if (notebookSummary) {
      finalBody = `<div class="bg-card p-4 rounded-sm border border-ghost mb-6">
        <strong class="text-xs tracking-widest uppercase text-muted mb-2 block">Summary</strong>
        <p class="text-secondary text-sm">${escapeHtml(String(notebookSummary))}</p>
      </div>
      ${content}`;
    }
    if (Array.isArray(sources) && sources.length > 0) {
      const items = sources
        .filter((s: unknown): s is string => typeof s === "string")
        .map((s: string) => {
          const safe = escapeHtml(s);
          return `<li><a href="${safe}" rel="noopener noreferrer" target="_blank">${safe}</a></li>`;
        })
        .join("\n");
      finalBody = `${finalBody}\n<h2>Sources</h2>\n<ul>${items}</ul>`;
    }

    const strength =
      typeof signalStrength === "number" && signalStrength >= 1 && signalStrength <= 3
        ? Math.round(signalStrength)
        : null;

    const finalTags: string[] = Array.isArray(tags) && tags.length ? [...tags] : ["signal"];
    if (clusterId) finalTags.push(`cluster:${clusterId}`);
    if (snapshotId) finalTags.push(`snapshot:${snapshotId}`);

    const insertPost = (slug: string) =>
      supabaseAdmin!
        .from("posts")
        .insert({
          title,
          slug,
          pillar,
          excerpt,
          body: finalBody,
          status: "draft", // Always save signals as drafts for admin review
          tags: finalTags,
          signal_strength: strength,
        })
        .select()
        .single();

    const baseSlug = slugify(title);
    let { data, error } = await insertPost(baseSlug);

    // Unique-slug collision → retry once with a date suffix instead of 500ing.
    if (error && error.code === "23505") {
      const suffix = new Date().toISOString().slice(0, 10);
      ({ data, error } = await insertPost(`${baseSlug}-${suffix}`));
    }

    if (error) throw error;

    return Response.json({
      success: true,
      status: "draft",
      published: false,
      post: data,
      url: `/admin?post=${data.id}`,
      duplicate: false,
    }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal error";
    return Response.json({ error: message }, { status: 500 });
  }
}
