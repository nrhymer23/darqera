"use client";

import { useState, useEffect, type FormEvent } from "react";
import type { Post, Pillar } from "@/types/post";
import { PILLAR_META } from "@/types/post";
import { ResearchQueue } from "@/components/admin/ResearchQueue";
import { PostEditorForm } from "@/components/admin/PostEditorForm";

type Tab = "research" | "posts" | "create" | "metrics";

interface Metrics {
  publishedPosts: number;
  draftPosts: number;
  totalViews: number;
  subscribers: number;
}

export default function AdminPage() {
  const [adminKey, setAdminKey] = useState("");
  const [authenticated, setAuthenticated] = useState(false);
  const [keyInput, setKeyInput] = useState("");

  const [tab, setTab] = useState<Tab>("research");
  const [posts, setPosts] = useState<Post[]>([]);
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Form state
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [pillar, setPillar] = useState<Pillar>("A");
  const [excerpt, setExcerpt] = useState("");
  const [body, setBody] = useState("");
  const [status, setStatus] = useState<"draft" | "published">("draft");
  const [tags, setTags] = useState("");

  // Delete confirmation
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // Editing an existing post (null = creating new)
  const [editingId, setEditingId] = useState<string | null>(null);

  // Load key from session
  useEffect(() => {
    const stored = sessionStorage.getItem("darqera-admin-key");
    if (stored) {
      setAdminKey(stored);
      setAuthenticated(true);
    }
  }, []);

  // Fetch posts when authenticated
  useEffect(() => {
    if (authenticated) {
      fetchPosts();
      fetchMetrics();
    }
  }, [authenticated]); // eslint-disable-line react-hooks/exhaustive-deps

  const headers = () => ({
    "Content-Type": "application/json",
    "x-admin-key": adminKey,
  });

  async function fetchPosts() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin/posts", { headers: headers() });
      if (res.status === 401) {
        setAuthenticated(false);
        sessionStorage.removeItem("darqera-admin-key");
        setError("Invalid admin key.");
        return;
      }
      const data = await res.json();
      setPosts(data.posts || []);
    } catch {
      setError("Failed to fetch posts.");
    } finally {
      setLoading(false);
    }
  }

  async function fetchMetrics() {
    try {
      const res = await fetch("/api/admin/metrics", { headers: headers() });
      if (res.ok) {
        const data = await res.json();
        setMetrics(data.metrics);
      }
    } catch {
      console.error("Failed to fetch metrics");
    }
  }

  function handleAuth(e: FormEvent) {
    e.preventDefault();
    if (!keyInput.trim()) return;
    setAdminKey(keyInput.trim());
    sessionStorage.setItem("darqera-admin-key", keyInput.trim());
    setAuthenticated(true);
    setKeyInput("");
  }

  // Auto-generate slug from title
  function handleTitleChange(val: string) {
    setTitle(val);
    setSlug(
      val
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "")
    );
  }

  function resetForm() {
    setTitle("");
    setSlug("");
    setExcerpt("");
    setBody("");
    setTags("");
    setStatus("draft");
    setEditingId(null);
  }

  function startEdit(post: Post) {
    setEditingId(post.id);
    setTitle(post.title);
    setSlug(post.slug);
    setPillar(post.pillar);
    setExcerpt(post.excerpt || "");
    setBody(post.body || "");
    setStatus(post.status);
    setTags((post.tags || []).join(", "));
    setError("");
    setSuccess("");
    setTab("create");
  }

  async function handleSave(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    const editing = editingId !== null;

    try {
      const res = await fetch("/api/admin/posts", {
        method: editing ? "PATCH" : "POST",
        headers: headers(),
        body: JSON.stringify({
          ...(editing ? { id: editingId } : {}),
          title,
          slug,
          pillar,
          excerpt,
          body,
          status,
          tags: tags
            .split(",")
            .map((t) => t.trim())
            .filter(Boolean),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || `Failed to ${editing ? "update" : "create"} post.`);
        return;
      }

      setSuccess(
        `Post "${data.post.title}" ${editing ? "updated" : "created"} successfully.`
      );
      resetForm();
      fetchPosts();
      setTab("posts");
    } catch {
      setError(`Failed to ${editing ? "update" : "create"} post.`);
    } finally {
      setLoading(false);
    }
  }

  async function handlePublishToggle(post: Post) {
    setLoading(true);
    setError("");
    setSuccess("");

    const nextStatus = post.status === "published" ? "draft" : "published";

    try {
      const res = await fetch("/api/admin/posts", {
        method: "PATCH",
        headers: headers(),
        body: JSON.stringify({ id: post.id, status: nextStatus }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to update status.");
        return;
      }

      setSuccess(
        nextStatus === "published"
          ? `"${post.title}" is live.`
          : `"${post.title}" unpublished.`
      );
      fetchPosts();
      fetchMetrics();
    } catch {
      setError("Failed to update status.");
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: string) {
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const res = await fetch("/api/admin/posts", {
        method: "DELETE",
        headers: headers(),
        body: JSON.stringify({ id }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to delete post.");
        return;
      }

      setSuccess("Post deleted.");
      setDeleteId(null);
      fetchPosts();
    } catch {
      setError("Failed to delete post.");
    } finally {
      setLoading(false);
    }
  }

  // ──────────────────────────────
  // Auth Gate
  // ──────────────────────────────
  if (!authenticated) {
    return (
      <div className="max-w-md mx-auto px-4 py-24">
        <h1
          className="font-[family-name:var(--font-space-grotesk)] font-bold text-2xl mb-6"
          style={{ color: "var(--text-primary)", letterSpacing: "-0.02em" }}
        >
          Admin Access
        </h1>
        <form onSubmit={handleAuth} className="flex gap-2">
          <input
            type="password"
            placeholder="Admin key"
            value={keyInput}
            onChange={(e) => setKeyInput(e.target.value)}
            id="admin-key-input"
            className="flex-1 px-4 py-2.5 text-sm rounded-[0.125rem] outline-none"
            style={{
              backgroundColor: "var(--bg-card)",
              color: "var(--text-primary)",
              border: "1px solid var(--border-ghost)",
            }}
          />
          <button
            type="submit"
            id="admin-key-submit"
            className="px-5 py-2.5 text-sm font-semibold tracking-wide rounded-[0.125rem]"
            style={{ backgroundColor: "#00f0ff", color: "#0e0e0e" }}
          >
            Enter
          </button>
        </form>
        {error && (
          <p className="mt-3 text-xs" style={{ color: "#ff6b6b" }}>
            {error}
          </p>
        )}
      </div>
    );
  }

  // ──────────────────────────────
  // Admin Dashboard
  // ──────────────────────────────
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <p
            className="text-[10px] font-semibold tracking-widest uppercase mb-2"
            style={{ color: "#00f0ff" }}
          >
            Admin
          </p>
          <h1
            className="font-[family-name:var(--font-space-grotesk)] font-bold text-2xl"
            style={{ color: "var(--text-primary)", letterSpacing: "-0.02em" }}
          >
            Editorial Control Room
          </h1>
        </div>
        <button
          onClick={() => {
            sessionStorage.removeItem("darqera-admin-key");
            setAuthenticated(false);
            setAdminKey("");
          }}
          id="admin-logout"
          className="text-xs tracking-wide px-3 py-1.5 rounded-[0.125rem] transition-opacity hover:opacity-70"
          style={{
            color: "var(--text-muted)",
            border: "1px solid var(--border-ghost)",
          }}
        >
          Sign Out
        </button>
      </div>

      {/* Tabs */}
      <div
        className="flex gap-1 mb-8 p-1 rounded-[0.125rem]"
        style={{ backgroundColor: "var(--bg-secondary)" }}
      >
        {(["research", "posts", "create", "metrics"] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => {
              setTab(t);
              setError("");
              setSuccess("");
            }}
            id={`admin-tab-${t}`}
            className="flex-1 py-2 text-sm font-medium tracking-wide rounded-[0.125rem] transition-colors"
            style={{
              backgroundColor:
                tab === t ? "var(--bg-card)" : "transparent",
              color:
                tab === t ? "var(--text-primary)" : "var(--text-muted)",
            }}
          >
            {t === "research"
              ? "Research"
              : t === "posts"
              ? "All Posts"
              : t === "create"
              ? editingId
                ? "Edit Post"
                : "Create Post"
              : "Metrics"}
          </button>
        ))}
      </div>

      {/* Feedback */}
      {error && (
        <div
          className="mb-4 px-4 py-3 text-sm rounded-[0.125rem]"
          style={{
            backgroundColor: "rgba(255, 107, 107, 0.1)",
            color: "#ff6b6b",
            border: "1px solid rgba(255, 107, 107, 0.2)",
          }}
        >
          {error}
        </div>
      )}
      {success && (
        <div
          className="mb-4 px-4 py-3 text-sm rounded-[0.125rem]"
          style={{
            backgroundColor: "rgba(0, 240, 255, 0.08)",
            color: "#00f0ff",
            border: "1px solid rgba(0, 240, 255, 0.15)",
          }}
        >
          {success}
        </div>
      )}

      {tab === "research" && <ResearchQueue adminKey={adminKey} />}

      {/* ──── Metrics Dashboard ──── */}
      {tab === "metrics" && metrics && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="p-4 rounded-[0.125rem]" style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-ghost)" }}>
            <p className="text-[10px] font-semibold tracking-widest uppercase mb-2" style={{ color: "var(--text-muted)" }}>Published Posts</p>
            <p className="text-3xl font-[family-name:var(--font-space-grotesk)]" style={{ color: "var(--text-primary)" }}>{metrics.publishedPosts}</p>
          </div>
          <div className="p-4 rounded-[0.125rem]" style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-ghost)" }}>
            <p className="text-[10px] font-semibold tracking-widest uppercase mb-2" style={{ color: "var(--text-muted)" }}>Drafts</p>
            <p className="text-3xl font-[family-name:var(--font-space-grotesk)]" style={{ color: "var(--text-primary)" }}>{metrics.draftPosts}</p>
          </div>
          <div className="p-4 rounded-[0.125rem]" style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-ghost)" }}>
            <p className="text-[10px] font-semibold tracking-widest uppercase mb-2" style={{ color: "var(--text-muted)" }}>Total Views</p>
            <p className="text-3xl font-[family-name:var(--font-space-grotesk)]" style={{ color: "var(--text-primary)" }}>{metrics.totalViews.toLocaleString()}</p>
          </div>
          <div className="p-4 rounded-[0.125rem]" style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-ghost)" }}>
            <p className="text-[10px] font-semibold tracking-widest uppercase mb-2" style={{ color: "var(--text-muted)" }}>Subscribers</p>
            <p className="text-3xl font-[family-name:var(--font-space-grotesk)]" style={{ color: "#00f0ff" }}>{metrics.subscribers}</p>
          </div>
        </div>
      )}

      {/* ──── Posts List ──── */}
      {tab === "posts" && (
        <div>
          {loading && posts.length === 0 ? (
            <p
              className="py-12 text-center text-sm"
              style={{ color: "var(--text-muted)" }}
            >
              Loading...
            </p>
          ) : posts.length === 0 ? (
            <p
              className="py-12 text-center text-sm"
              style={{ color: "var(--text-muted)" }}
            >
              No posts yet.
            </p>
          ) : (
            <div className="flex flex-col gap-2">
              {posts.map((post) => {
                const pillarMeta = PILLAR_META[post.pillar];
                const date = new Date(post.published_at).toLocaleDateString(
                  "en-US",
                  { month: "short", day: "numeric", year: "numeric" }
                );

                return (
                  <div
                    key={post.id}
                    className="relative flex items-start gap-4 p-4 rounded-[0.125rem]"
                    style={{
                      backgroundColor: "var(--bg-card)",
                      border: "1px solid var(--border-ghost)",
                    }}
                  >
                    {/* Signal bar */}
                    <div
                      className="absolute left-0 top-4 bottom-4 w-[2px] rounded-full"
                      style={{ backgroundColor: pillarMeta.color }}
                    />

                    <div className="pl-3 flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span
                          className="text-[10px] font-semibold tracking-widest uppercase px-1.5 py-0.5 rounded-[0.125rem]"
                          style={{
                            color: pillarMeta.color,
                            backgroundColor: `${pillarMeta.color}14`,
                          }}
                        >
                          {pillarMeta.label}
                        </span>
                        <span
                          className="text-[10px] font-semibold tracking-widest uppercase px-1.5 py-0.5 rounded-[0.125rem]"
                          style={{
                            color:
                              post.status === "published"
                                ? "#a7ffb3"
                                : "var(--text-muted)",
                            backgroundColor:
                              post.status === "published"
                                ? "rgba(167, 255, 179, 0.1)"
                                : "var(--bg-secondary)",
                          }}
                        >
                          {post.status}
                        </span>
                      </div>
                      <h3
                        className="font-[family-name:var(--font-space-grotesk)] font-semibold text-sm leading-snug mb-1"
                        style={{ color: "var(--text-primary)" }}
                      >
                        {post.title}
                      </h3>
                      <p
                        className="text-[11px] tracking-wide"
                        style={{ color: "var(--text-muted)" }}
                      >
                        {date} · /{post.slug}
                        {post.view_count != null && post.view_count > 0 && (
                          <> · {post.view_count.toLocaleString()} views</>
                        )}
                      </p>
                    </div>

                    {/* Actions: publish/unpublish, edit, delete */}
                    {deleteId === post.id ? (
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={() => handleDelete(post.id)}
                          disabled={loading}
                          className="text-[11px] font-semibold tracking-wide px-3 py-1.5 rounded-[0.125rem]"
                          style={{
                            backgroundColor: "rgba(255, 107, 107, 0.15)",
                            color: "#ff6b6b",
                          }}
                        >
                          Confirm
                        </button>
                        <button
                          onClick={() => setDeleteId(null)}
                          className="text-[11px] tracking-wide px-3 py-1.5 rounded-[0.125rem]"
                          style={{
                            color: "var(--text-muted)",
                            border: "1px solid var(--border-ghost)",
                          }}
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={() => handlePublishToggle(post)}
                          disabled={loading}
                          id={`admin-publish-${post.slug}`}
                          className="text-[11px] font-semibold tracking-wide px-3 py-1.5 rounded-[0.125rem] transition-opacity hover:opacity-80"
                          style={
                            post.status === "published"
                              ? {
                                  color: "var(--text-muted)",
                                  border: "1px solid var(--border-ghost)",
                                }
                              : {
                                  backgroundColor: "#00f0ff",
                                  color: "#0e0e0e",
                                }
                          }
                        >
                          {post.status === "published" ? "Unpublish" : "Publish"}
                        </button>
                        <button
                          onClick={() => startEdit(post)}
                          id={`admin-edit-${post.slug}`}
                          className="text-[11px] tracking-wide px-3 py-1.5 rounded-[0.125rem] transition-opacity hover:opacity-70"
                          style={{
                            color: "var(--text-secondary)",
                            border: "1px solid var(--border-ghost)",
                          }}
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => setDeleteId(post.id)}
                          className="text-[11px] tracking-wide px-3 py-1.5 rounded-[0.125rem] transition-opacity hover:opacity-70"
                          style={{
                            color: "#ff6b6b",
                            border: "1px solid rgba(255, 107, 107, 0.2)",
                          }}
                        >
                          Delete
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ──── Create / Edit Post Form ──── */}
      {tab === "create" && (
        <PostEditorForm
          title={title}
          handleTitleChange={handleTitleChange}
          slug={slug}
          setSlug={setSlug}
          pillar={pillar}
          setPillar={setPillar}
          excerpt={excerpt}
          setExcerpt={setExcerpt}
          body={body}
          setBody={setBody}
          status={status}
          setStatus={setStatus}
          tags={tags}
          setTags={setTags}
          adminKey={adminKey}
          loading={loading}
          editingId={editingId}
          handleSave={handleSave}
          resetForm={resetForm}
          showPosts={() => setTab("posts")}
        />
      )}
    </div>
  );
}
