"use client";

import { useState, useEffect, type FormEvent } from "react";
import type { Post, Pillar } from "@/types/post";
import { PILLAR_META } from "@/types/post";

type Tab = "posts" | "create";

export default function AdminPage() {
  const [adminKey, setAdminKey] = useState("");
  const [authenticated, setAuthenticated] = useState(false);
  const [keyInput, setKeyInput] = useState("");

  const [tab, setTab] = useState<Tab>("posts");
  const [posts, setPosts] = useState<Post[]>([]);
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
    if (authenticated) fetchPosts();
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

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const res = await fetch("/api/admin/posts", {
        method: "POST",
        headers: headers(),
        body: JSON.stringify({
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
        setError(data.error || "Failed to create post.");
        return;
      }

      setSuccess(`Post "${data.post.title}" created successfully.`);
      // Reset form
      setTitle("");
      setSlug("");
      setExcerpt("");
      setBody("");
      setTags("");
      setStatus("draft");
      // Refresh list
      fetchPosts();
      setTab("posts");
    } catch {
      setError("Failed to create post.");
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
            Post Manager
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
        {(["posts", "create"] as Tab[]).map((t) => (
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
            {t === "posts" ? "All Posts" : "Create Post"}
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

                    {/* Delete */}
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
                      <button
                        onClick={() => setDeleteId(post.id)}
                        className="shrink-0 text-[11px] tracking-wide px-3 py-1.5 rounded-[0.125rem] transition-opacity hover:opacity-70"
                        style={{
                          color: "#ff6b6b",
                          border: "1px solid rgba(255, 107, 107, 0.2)",
                        }}
                      >
                        Delete
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ──── Create Post Form ──── */}
      {tab === "create" && (
        <form onSubmit={handleCreate} className="flex flex-col gap-5">
          {/* Title */}
          <div>
            <label
              htmlFor="admin-title"
              className="block text-[10px] font-semibold tracking-widest uppercase mb-2"
              style={{ color: "var(--text-muted)" }}
            >
              Title
            </label>
            <input
              id="admin-title"
              type="text"
              required
              value={title}
              onChange={(e) => handleTitleChange(e.target.value)}
              className="w-full px-4 py-2.5 text-sm rounded-[0.125rem] outline-none"
              style={{
                backgroundColor: "var(--bg-card)",
                color: "var(--text-primary)",
                border: "1px solid var(--border-ghost)",
              }}
            />
          </div>

          {/* Slug */}
          <div>
            <label
              htmlFor="admin-slug"
              className="block text-[10px] font-semibold tracking-widest uppercase mb-2"
              style={{ color: "var(--text-muted)" }}
            >
              Slug
            </label>
            <input
              id="admin-slug"
              type="text"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              placeholder="auto-generated from title"
              className="w-full px-4 py-2.5 text-sm rounded-[0.125rem] outline-none placeholder:opacity-40"
              style={{
                backgroundColor: "var(--bg-card)",
                color: "var(--text-primary)",
                border: "1px solid var(--border-ghost)",
              }}
            />
          </div>

          {/* Pillar + Status row */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="admin-pillar"
                className="block text-[10px] font-semibold tracking-widest uppercase mb-2"
                style={{ color: "var(--text-muted)" }}
              >
                Pillar
              </label>
              <select
                id="admin-pillar"
                value={pillar}
                onChange={(e) => setPillar(e.target.value as Pillar)}
                className="w-full px-4 py-2.5 text-sm rounded-[0.125rem] outline-none"
                style={{
                  backgroundColor: "var(--bg-card)",
                  color: "var(--text-primary)",
                  border: "1px solid var(--border-ghost)",
                }}
              >
                {(Object.keys(PILLAR_META) as Pillar[]).map((p) => (
                  <option key={p} value={p}>
                    {p} — {PILLAR_META[p].full}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="admin-status"
                className="block text-[10px] font-semibold tracking-widest uppercase mb-2"
                style={{ color: "var(--text-muted)" }}
              >
                Status
              </label>
              <select
                id="admin-status"
                value={status}
                onChange={(e) =>
                  setStatus(e.target.value as "draft" | "published")
                }
                className="w-full px-4 py-2.5 text-sm rounded-[0.125rem] outline-none"
                style={{
                  backgroundColor: "var(--bg-card)",
                  color: "var(--text-primary)",
                  border: "1px solid var(--border-ghost)",
                }}
              >
                <option value="draft">Draft</option>
                <option value="published">Published</option>
              </select>
            </div>
          </div>

          {/* Excerpt */}
          <div>
            <label
              htmlFor="admin-excerpt"
              className="block text-[10px] font-semibold tracking-widest uppercase mb-2"
              style={{ color: "var(--text-muted)" }}
            >
              Excerpt
            </label>
            <textarea
              id="admin-excerpt"
              rows={2}
              value={excerpt}
              onChange={(e) => setExcerpt(e.target.value)}
              placeholder="One sentence summary"
              className="w-full px-4 py-2.5 text-sm rounded-[0.125rem] outline-none resize-y placeholder:opacity-40"
              style={{
                backgroundColor: "var(--bg-card)",
                color: "var(--text-primary)",
                border: "1px solid var(--border-ghost)",
              }}
            />
          </div>

          {/* Body */}
          <div>
            <label
              htmlFor="admin-body"
              className="block text-[10px] font-semibold tracking-widest uppercase mb-2"
              style={{ color: "var(--text-muted)" }}
            >
              Body
            </label>
            <textarea
              id="admin-body"
              rows={12}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Full post content (HTML supported)"
              className="w-full px-4 py-2.5 text-sm leading-relaxed rounded-[0.125rem] outline-none resize-y placeholder:opacity-40 font-mono"
              style={{
                backgroundColor: "var(--bg-card)",
                color: "var(--text-primary)",
                border: "1px solid var(--border-ghost)",
              }}
            />
          </div>

          {/* Tags */}
          <div>
            <label
              htmlFor="admin-tags"
              className="block text-[10px] font-semibold tracking-widest uppercase mb-2"
              style={{ color: "var(--text-muted)" }}
            >
              Tags (comma-separated)
            </label>
            <input
              id="admin-tags"
              type="text"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="ai, llm, infrastructure"
              className="w-full px-4 py-2.5 text-sm rounded-[0.125rem] outline-none placeholder:opacity-40"
              style={{
                backgroundColor: "var(--bg-card)",
                color: "var(--text-primary)",
                border: "1px solid var(--border-ghost)",
              }}
            />
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            id="admin-create-submit"
            className="w-full py-3 text-sm font-semibold tracking-wide rounded-[0.125rem] transition-all"
            style={{
              backgroundColor: "#00f0ff",
              color: "#0e0e0e",
              opacity: loading ? 0.6 : 1,
            }}
            onMouseEnter={(e) => {
              (e.target as HTMLElement).style.boxShadow =
                "0 0 24px rgba(0, 240, 255, 0.3)";
            }}
            onMouseLeave={(e) => {
              (e.target as HTMLElement).style.boxShadow = "none";
            }}
          >
            {loading ? "Creating..." : "Create Post"}
          </button>
        </form>
      )}
    </div>
  );
}
