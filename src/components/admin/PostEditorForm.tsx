"use client";

import type { Dispatch, FormEventHandler, SetStateAction } from "react";

import { RichTextEditor } from "@/components/admin/editor/RichTextEditor";
import { PILLAR_META, type Pillar } from "@/types/post";

type PostStatus = "draft" | "published";

type PostEditorFormProps = {
  title: string;
  handleTitleChange(value: string): void;
  slug: string;
  setSlug: Dispatch<SetStateAction<string>>;
  pillar: Pillar;
  setPillar: Dispatch<SetStateAction<Pillar>>;
  excerpt: string;
  setExcerpt: Dispatch<SetStateAction<string>>;
  body: string;
  setBody: Dispatch<SetStateAction<string>>;
  status: PostStatus;
  setStatus: Dispatch<SetStateAction<PostStatus>>;
  tags: string;
  setTags: Dispatch<SetStateAction<string>>;
  adminKey: string;
  loading: boolean;
  editingId: string | null;
  handleSave: FormEventHandler<HTMLFormElement>;
  resetForm(): void;
  showPosts(): void;
};

export function PostEditorForm({
  title,
  handleTitleChange,
  slug,
  setSlug,
  pillar,
  setPillar,
  excerpt,
  setExcerpt,
  body,
  setBody,
  status,
  setStatus,
  tags,
  setTags,
  adminKey,
  loading,
  editingId,
  handleSave,
  resetForm,
  showPosts,
}: PostEditorFormProps) {
  return (
    <form onSubmit={handleSave} className="flex flex-col gap-5">
      <div>
        <label htmlFor="admin-title" className="block text-[10px] font-semibold tracking-widest uppercase mb-2" style={{ color: "var(--text-muted)" }}>
          Title
        </label>
        <input id="admin-title" type="text" required value={title} onChange={(event) => handleTitleChange(event.target.value)} className="w-full px-4 py-2.5 text-sm rounded-[0.125rem] outline-none" style={{ backgroundColor: "var(--bg-card)", color: "var(--text-primary)", border: "1px solid var(--border-ghost)" }} />
      </div>

      <div>
        <label htmlFor="admin-slug" className="block text-[10px] font-semibold tracking-widest uppercase mb-2" style={{ color: "var(--text-muted)" }}>
          Slug
        </label>
        <input id="admin-slug" type="text" value={slug} onChange={(event) => setSlug(event.target.value)} placeholder="auto-generated from title" className="w-full px-4 py-2.5 text-sm rounded-[0.125rem] outline-none placeholder:opacity-40" style={{ backgroundColor: "var(--bg-card)", color: "var(--text-primary)", border: "1px solid var(--border-ghost)" }} />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="admin-pillar" className="block text-[10px] font-semibold tracking-widest uppercase mb-2" style={{ color: "var(--text-muted)" }}>
            Pillar
          </label>
          <select id="admin-pillar" value={pillar} onChange={(event) => setPillar(event.target.value as Pillar)} className="w-full px-4 py-2.5 text-sm rounded-[0.125rem] outline-none" style={{ backgroundColor: "var(--bg-card)", color: "var(--text-primary)", border: "1px solid var(--border-ghost)" }}>
            {(Object.keys(PILLAR_META) as Pillar[]).map((value) => (
              <option key={value} value={value}>{value} — {PILLAR_META[value].full}</option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="admin-status" className="block text-[10px] font-semibold tracking-widest uppercase mb-2" style={{ color: "var(--text-muted)" }}>
            Status
          </label>
          <select id="admin-status" value={status} onChange={(event) => setStatus(event.target.value as PostStatus)} className="w-full px-4 py-2.5 text-sm rounded-[0.125rem] outline-none" style={{ backgroundColor: "var(--bg-card)", color: "var(--text-primary)", border: "1px solid var(--border-ghost)" }}>
            <option value="draft">Draft</option>
            <option value="published">Published</option>
          </select>
        </div>
      </div>

      <div>
        <label htmlFor="admin-excerpt" className="block text-[10px] font-semibold tracking-widest uppercase mb-2" style={{ color: "var(--text-muted)" }}>
          Excerpt
        </label>
        <textarea id="admin-excerpt" rows={2} value={excerpt} onChange={(event) => setExcerpt(event.target.value)} placeholder="One sentence summary" className="w-full px-4 py-2.5 text-sm rounded-[0.125rem] outline-none resize-y placeholder:opacity-40" style={{ backgroundColor: "var(--bg-card)", color: "var(--text-primary)", border: "1px solid var(--border-ghost)" }} />
      </div>

      <div>
        <label htmlFor="admin-post-body" className="block text-[10px] font-semibold tracking-widest uppercase mb-2" style={{ color: "var(--text-muted)" }}>
          Body
        </label>
        <RichTextEditor value={body} onChange={setBody} adminKey={adminKey} />
      </div>

      <div>
        <label htmlFor="admin-tags" className="block text-[10px] font-semibold tracking-widest uppercase mb-2" style={{ color: "var(--text-muted)" }}>
          Tags (comma-separated)
        </label>
        <input id="admin-tags" type="text" value={tags} onChange={(event) => setTags(event.target.value)} placeholder="ai, llm, infrastructure" className="w-full px-4 py-2.5 text-sm rounded-[0.125rem] outline-none placeholder:opacity-40" style={{ backgroundColor: "var(--bg-card)", color: "var(--text-primary)", border: "1px solid var(--border-ghost)" }} />
      </div>

      <button type="submit" disabled={loading} id="admin-create-submit" className="btn-glow w-full py-3 text-sm font-semibold tracking-wide rounded-[0.125rem] transition-all" style={{ backgroundColor: "#00f0ff", color: "#0e0e0e", opacity: loading ? 0.6 : 1 }}>
        {loading ? "Saving..." : editingId ? "Save Changes" : "Create Post"}
      </button>

      {editingId && (
        <button type="button" onClick={() => { resetForm(); showPosts(); }} className="w-full py-2.5 text-sm tracking-wide rounded-[0.125rem] transition-opacity hover:opacity-70" style={{ color: "var(--text-muted)", border: "1px solid var(--border-ghost)" }}>
          Cancel Edit
        </button>
      )}
    </form>
  );
}
