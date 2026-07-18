# Darqera Rich-Text Editor Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace Darqera Admin's raw post-body textarea with a safe visual Tiptap editor that supports standard formatting and authenticated Supabase image uploads while preserving HTML compatibility.

**Architecture:** A focused client editor owns Tiptap state and reports HTML through the existing post form. The posts API sanitizes that HTML at the persistence boundary. A separate authenticated multipart endpoint validates images and uploads them through the existing server-only Supabase client to a migration-managed public bucket.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, Tiptap, sanitize-html, Supabase Storage, Vitest, Testing Library, Tailwind CSS 4

## Global Constraints

- Keep `posts.body` as the canonical HTML representation; do not migrate existing posts.
- Accept JPEG, PNG, WebP, and GIF images up to 10 MB.
- Require non-empty alt text before inserting an uploaded image.
- Keep the Supabase service-role key server-only and require the existing admin key for uploads.
- Preserve paragraphs, headings 1–3, inline emphasis, lists, blockquotes, safe links, text alignment, and safe images.
- Remove scripts, event handlers, embeds, and unsafe URL schemes before persistence.
- Do not redesign fields outside the post body editor.
- Use test-driven development and commit each task independently.

---

## File Structure

- `src/lib/postHtml.ts`: single server-safe HTML sanitization contract.
- `src/lib/postHtml.test.ts`: sanitizer allow/deny behavior.
- `src/lib/postImages.ts`: file validation, collision-resistant paths, and Supabase upload.
- `src/lib/postImages.test.ts`: image validation and storage behavior.
- `src/app/api/admin/uploads/images/route.ts`: authenticated multipart HTTP boundary.
- `src/app/api/admin/uploads/images/route.test.ts`: route authentication and response behavior.
- `src/components/admin/editor/EditorToolbar.tsx`: formatting buttons and active states only.
- `src/components/admin/editor/ImageUploadDialog.tsx`: file/alt input and upload lifecycle.
- `src/components/admin/editor/RichTextEditor.tsx`: Tiptap lifecycle, HTML synchronization, source mode, and child composition.
- `src/components/admin/editor/RichTextEditor.test.tsx`: visual HTML loading, commands, synchronization, and mode switching.
- `src/components/admin/editor/ImageUploadDialog.test.tsx`: required alt text, upload success, and recoverable errors.
- `src/components/admin/PostEditorForm.test.tsx`: admin form regression coverage through the extracted form boundary.
- `src/components/admin/PostEditorForm.tsx`: existing create/edit fields moved from the large page, with `RichTextEditor` replacing only Body.
- `src/app/admin/page.tsx`: compose `PostEditorForm` and retain page-level authentication, tabs, post list, research, and metrics.
- `src/app/api/admin/posts/route.test.ts`: persistence-boundary sanitization tests.
- `src/app/api/admin/posts/route.ts`: sanitize create/update bodies before Supabase writes.
- `src/app/globals.css`: editor prose, toolbar, selection, and image styles scoped under `.admin-rich-editor`.
- `supabase/migrations/0006_post_images_bucket.sql`: idempotent public bucket and public-read policy.
- `package.json` and `package-lock.json`: Tiptap and sanitizer dependencies.

---

### Task 1: Add the HTML Safety Contract

**Files:**
- Create: `src/lib/postHtml.ts`
- Create: `src/lib/postHtml.test.ts`
- Modify: `package.json`
- Modify: `package-lock.json`

**Interfaces:**
- Produces: `sanitizePostHtml(input: string): string`
- Consumed by: the posts API in Task 5 and source-mode normalization in Task 3 through the server save boundary.

- [ ] **Step 1: Install the sanitizer dependency**

Run:

```bash
npm install sanitize-html
npm install --save-dev @types/sanitize-html
```

Expected: `package.json` lists both packages and the lockfile changes without peer-dependency errors.

- [ ] **Step 2: Write failing sanitizer tests**

Create `src/lib/postHtml.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { sanitizePostHtml } from "./postHtml";

describe("sanitizePostHtml", () => {
  it("preserves the editor's supported semantic HTML", () => {
    const input = '<h2 style="text-align:center">Signal</h2><p><strong>Bold</strong> <u>underlined</u></p><ul><li>One</li></ul><blockquote>Quote</blockquote>';
    expect(sanitizePostHtml(input)).toContain('<h2 style="text-align:center">Signal</h2>');
    expect(sanitizePostHtml(input)).toContain("<u>underlined</u>");
    expect(sanitizePostHtml(input)).toContain("<blockquote>Quote</blockquote>");
  });

  it("keeps safe links and accessible public images", () => {
    const input = '<p><a href="https://example.com" target="_blank">Source</a></p><img src="https://cdn.example.com/post.webp" alt="Quantum processor" />';
    const output = sanitizePostHtml(input);
    expect(output).toContain('href="https://example.com"');
    expect(output).toContain('rel="noopener noreferrer"');
    expect(output).toContain('alt="Quantum processor"');
  });

  it("removes scripts, handlers, embeds, unsafe URLs, and images without alt text", () => {
    const input = '<script>alert(1)</script><p onclick="steal()">Safe</p><iframe src="https://bad.test"></iframe><a href="javascript:alert(1)">Bad</a><img src="https://cdn.example.com/no-alt.png">';
    const output = sanitizePostHtml(input);
    expect(output).toBe("<p>Safe</p><a>Bad</a>");
  });
});
```

- [ ] **Step 3: Run the tests and confirm the missing module failure**

Run: `npm test -- --run src/lib/postHtml.test.ts`

Expected: FAIL because `./postHtml` does not exist.

- [ ] **Step 4: Implement the sanitizer**

Create `src/lib/postHtml.ts` with `sanitize-html` configured to allow:

```ts
import sanitizeHtml from "sanitize-html";

const allowedTags = [
  "p", "br", "h1", "h2", "h3", "strong", "b", "em", "i", "u", "s",
  "ul", "ol", "li", "blockquote", "a", "img",
];

export function sanitizePostHtml(input: string): string {
  return sanitizeHtml(input, {
    allowedTags,
    allowedAttributes: {
      a: ["href", "target", "rel"],
      img: ["src", "alt", "title"],
      p: ["style"], h1: ["style"], h2: ["style"], h3: ["style"],
    },
    allowedStyles: {
      "*": { "text-align": [/^left$/, /^center$/, /^right$/] },
    },
    allowedSchemes: ["http", "https"],
    allowedSchemesByTag: { img: ["https"], a: ["http", "https", "mailto"] },
    transformTags: {
      a: (_tag, attrs) => ({
        tagName: "a",
        attribs: {
          ...attrs,
          ...(attrs.target === "_blank" ? { rel: "noopener noreferrer" } : {}),
        },
      }),
    },
    exclusiveFilter: (frame) => frame.tag === "img" && !frame.attribs.alt?.trim(),
  });
}
```

- [ ] **Step 5: Verify and commit**

Run:

```bash
npm test -- --run src/lib/postHtml.test.ts
npm run lint
```

Expected: 3 tests pass and lint exits 0.

Commit:

```bash
git add package.json package-lock.json src/lib/postHtml.ts src/lib/postHtml.test.ts
git commit -m "feat: sanitize post editor html"
```

---

### Task 2: Add Authenticated Post Image Storage

**Files:**
- Create: `src/lib/postImages.ts`
- Create: `src/lib/postImages.test.ts`
- Create: `src/app/api/admin/uploads/images/route.ts`
- Create: `src/app/api/admin/uploads/images/route.test.ts`
- Create: `supabase/migrations/0006_post_images_bucket.sql`

**Interfaces:**
- Produces: `validatePostImage(file: File): void`
- Produces: `uploadPostImage(file: File): Promise<{ url: string; path: string }>`
- Produces: `POST /api/admin/uploads/images`, multipart field `file`, response `{ image: { url, path } }`.
- Consumed by: `ImageUploadDialog` in Task 4.

- [ ] **Step 1: Write failing image-service tests**

Create tests that mock `@/lib/supabaseAdmin` and verify:

```ts
it("rejects unsupported files and files above 10 MB", () => {
  expect(() => validatePostImage(new File(["x"], "note.txt", { type: "text/plain" }))).toThrow("JPEG, PNG, WebP, or GIF");
  expect(() => validatePostImage(new File([new Uint8Array(10 * 1024 * 1024 + 1)], "large.png", { type: "image/png" }))).toThrow("10 MB");
});

it("uploads to post-images with a collision-resistant safe path", async () => {
  upload.mockResolvedValue({ error: null });
  getPublicUrl.mockReturnValue({ data: { publicUrl: "https://cdn.test/post-images/2026/07/id.webp" } });
  const result = await uploadPostImage(new File(["image"], "My Image.webp", { type: "image/webp" }));
  expect(from).toHaveBeenCalledWith("post-images");
  expect(upload).toHaveBeenCalledWith(expect.stringMatching(/^\d{4}\/\d{2}\/[a-f0-9-]+\.webp$/), expect.any(File), expect.objectContaining({ contentType: "image/webp", upsert: false }));
  expect(result.url).toMatch(/^https:\/\//);
});
```

- [ ] **Step 2: Run the service test and verify failure**

Run: `npm test -- --run src/lib/postImages.test.ts`

Expected: FAIL because `postImages.ts` is missing.

- [ ] **Step 3: Implement image validation and upload**

Implement constants and functions in `src/lib/postImages.ts`:

```ts
export const POST_IMAGE_MAX_BYTES = 10 * 1024 * 1024;
export const POST_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);

export function validatePostImage(file: File) {
  if (!POST_IMAGE_TYPES.has(file.type)) throw new Error("Choose a JPEG, PNG, WebP, or GIF image.");
  if (file.size > POST_IMAGE_MAX_BYTES) throw new Error("Images must be 10 MB or smaller.");
}
```

`uploadPostImage` must require `supabaseAdmin`, derive the extension from the validated MIME type rather than the user filename, generate `${year}/${month}/${crypto.randomUUID()}.${extension}`, upload with `cacheControl: "31536000"` and `upsert: false`, then return `getPublicUrl(path).data.publicUrl` and the path. Throw `"Image storage is unavailable."` when the server client is absent and `"Image upload failed."` without exposing Supabase internals when upload returns an error.

- [ ] **Step 4: Write failing route tests**

Create `src/app/api/admin/uploads/images/route.test.ts` covering:

```ts
it("rejects requests without the admin key", async () => {
  const response = await POST(new NextRequest("http://localhost/api/admin/uploads/images", { method: "POST" }));
  expect(response.status).toBe(401);
});

it("requires a multipart file", async () => {
  const form = new FormData();
  const response = await POST(authenticatedRequest(form));
  expect(response.status).toBe(400);
});

it("returns the uploaded public image", async () => {
  uploadPostImage.mockResolvedValue({ url: "https://cdn.test/image.webp", path: "2026/07/id.webp" });
  const form = new FormData();
  form.set("file", new File(["image"], "image.webp", { type: "image/webp" }));
  const response = await POST(authenticatedRequest(form));
  expect(response.status).toBe(201);
  expect(await response.json()).toEqual({ image: { url: "https://cdn.test/image.webp", path: "2026/07/id.webp" } });
});
```

Mock `uploadPostImage` so route tests do not contact Supabase. Set `ADMIN_SECRET_KEY` in `beforeEach` and construct `authenticatedRequest` with `x-admin-key` but no manual content-type header, allowing `FormData` to set its boundary.

- [ ] **Step 5: Implement the upload route**

In `route.ts`, call `checkAdminAuth` before parsing the body. Read `await request.formData()`, require `form.get("file") instanceof File`, call `uploadPostImage`, and return status 201. Map known validation messages to 400, storage unavailability to 503, and all other safe upload failures to 500.

- [ ] **Step 6: Add the storage migration**

Create `supabase/migrations/0006_post_images_bucket.sql`:

```sql
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'post-images',
  'post-images',
  true,
  10485760,
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Public can read post images" on storage.objects;
create policy "Public can read post images"
on storage.objects for select
to public
using (bucket_id = 'post-images');
```

Do not create anonymous insert/update/delete policies; server uploads use the service role.

- [ ] **Step 7: Verify and commit**

Run:

```bash
npm test -- --run src/lib/postImages.test.ts src/app/api/admin/uploads/images/route.test.ts
npm run lint
```

Expected: all focused tests pass and lint exits 0.

Commit the five new files with `git commit -m "feat: add secure post image uploads"`.

---

### Task 3: Build the Visual Editor and Toolbar

**Files:**
- Create: `src/components/admin/editor/EditorToolbar.tsx`
- Create: `src/components/admin/editor/RichTextEditor.tsx`
- Create: `src/components/admin/editor/RichTextEditor.test.tsx`
- Modify: `package.json`
- Modify: `package-lock.json`

**Interfaces:**
- Produces: `RichTextEditor({ value, onChange, adminKey }: { value: string; onChange(html: string): void; adminKey: string })`
- `EditorToolbar` consumes a Tiptap `Editor` plus `onInsertImage(): void` and `sourceMode` state.
- Consumed by: `PostEditorForm` in Task 5 and `ImageUploadDialog` in Task 4.

- [ ] **Step 1: Install Tiptap dependencies**

Run:

```bash
npm install @tiptap/react @tiptap/pm @tiptap/starter-kit @tiptap/extension-underline @tiptap/extension-link @tiptap/extension-image @tiptap/extension-text-align
```

Expected: packages and lockfile update without React peer conflicts.

- [ ] **Step 2: Write the failing editor tests**

Use jsdom and Testing Library. Verify:

```tsx
it("renders existing paragraph HTML as editable text instead of literal tags", async () => {
  render(<RichTextEditor value="<p>First paragraph.</p><p>Second paragraph.</p>" onChange={vi.fn()} adminKey="key" />);
  const editor = await screen.findByRole("textbox", { name: "Post body" });
  expect(editor).toHaveTextContent("First paragraph.");
  expect(editor).not.toHaveTextContent("<p>");
});

it("exposes standard formatting controls", async () => {
  render(<RichTextEditor value="<p>Body</p>" onChange={vi.fn()} adminKey="key" />);
  for (const name of ["Bold", "Italic", "Underline", "Strikethrough", "Bullet list", "Numbered list", "Blockquote", "Add link", "Insert image", "Undo", "Redo", "Clear formatting", "HTML source"]) {
    expect(await screen.findByRole("button", { name })).toBeInTheDocument();
  }
});

it("round-trips changes through HTML source mode", async () => {
  const onChange = vi.fn();
  render(<RichTextEditor value="<p>Original</p>" onChange={onChange} adminKey="key" />);
  fireEvent.click(await screen.findByRole("button", { name: "HTML source" }));
  fireEvent.change(screen.getByLabelText("Post body HTML"), { target: { value: "<h2>Revised</h2><p>Copy</p>" } });
  fireEvent.click(screen.getByRole("button", { name: "Visual editor" }));
  expect(await screen.findByText("Revised")).toBeInTheDocument();
  expect(onChange).toHaveBeenLastCalledWith(expect.stringContaining("<h2>Revised</h2>"));
});
```

- [ ] **Step 3: Run the editor test and verify failure**

Run: `npm test -- --run src/components/admin/editor/RichTextEditor.test.tsx`

Expected: FAIL because the editor files do not exist.

- [ ] **Step 4: Implement Tiptap lifecycle**

Configure `useEditor` with `immediatelyRender: false`, `StarterKit`, `Underline`, safe `Link`, inline `Image`, and `TextAlign.configure({ types: ["heading", "paragraph"] })`. Give `EditorContent` `role="textbox"`, `aria-label="Post body"`, and class `admin-rich-editor__content`.

On Tiptap `onUpdate`, call `onChange(editor.getHTML())`. When `value` changes because a different post is selected, compare it with `editor.getHTML()` before calling `editor.commands.setContent(value, { emitUpdate: false })` so parent rerenders do not reset the cursor.

Source mode owns a temporary `sourceValue`. Entering copies `editor.getHTML()`. Leaving calls `editor.commands.setContent(sourceValue, { emitUpdate: true })`; Tiptap's schema removes unsupported nodes. Render a textarea labeled `Post body HTML` only in source mode.

- [ ] **Step 5: Implement the toolbar**

Use semantic `<button type="button">` controls with `aria-label`, `aria-pressed` for toggles, disabled undo/redo states, and `onMouseDown={(event) => event.preventDefault()}` where needed to preserve selection.

Formatting commands must be:

```ts
editor.chain().focus().toggleBold().run()
editor.chain().focus().toggleItalic().run()
editor.chain().focus().toggleUnderline().run()
editor.chain().focus().toggleStrike().run()
editor.chain().focus().toggleBulletList().run()
editor.chain().focus().toggleOrderedList().run()
editor.chain().focus().toggleBlockquote().run()
editor.chain().focus().setTextAlign("left" | "center" | "right").run()
editor.chain().focus().clearNodes().unsetAllMarks().run()
editor.chain().focus().undo().run()
editor.chain().focus().redo().run()
```

Use a labeled select for Paragraph, Heading 1, Heading 2, and Heading 3. For links, prompt through a small inline popover rather than `window.prompt`; submit a trimmed `http`, `https`, or `mailto` URL to `setLink`, and offer `unsetLink` when the selection already has a link.

- [ ] **Step 6: Verify and commit**

Run:

```bash
npm test -- --run src/components/admin/editor/RichTextEditor.test.tsx
npm run lint
```

Expected: focused editor tests pass and lint exits 0.

Commit editor files and dependency files with `git commit -m "feat: add visual post editor"`.

---

### Task 4: Add Accessible Image Insertion

**Files:**
- Create: `src/components/admin/editor/ImageUploadDialog.tsx`
- Create: `src/components/admin/editor/ImageUploadDialog.test.tsx`
- Modify: `src/components/admin/editor/RichTextEditor.tsx`
- Modify: `src/components/admin/editor/RichTextEditor.test.tsx`

**Interfaces:**
- Produces: `ImageUploadDialog({ open, adminKey, onClose, onInsert }: { open: boolean; adminKey: string; onClose(): void; onInsert(image: { src: string; alt: string }): void })`
- Calls: `POST /api/admin/uploads/images` with multipart `file` and `x-admin-key`.
- `RichTextEditor` inserts via `editor.chain().focus().setImage({ src, alt }).run()`.

- [ ] **Step 1: Write failing dialog tests**

Cover these exact behaviors:

```tsx
it("requires both an image and alt text", async () => {
  render(<ImageUploadDialog open adminKey="key" onClose={vi.fn()} onInsert={vi.fn()} />);
  fireEvent.click(screen.getByRole("button", { name: "Upload and insert" }));
  expect(screen.getByRole("alert")).toHaveTextContent("Choose an image and describe it");
  expect(fetch).not.toHaveBeenCalled();
});

it("uploads with the admin key and inserts the returned URL", async () => {
  vi.mocked(fetch).mockResolvedValue(new Response(JSON.stringify({ image: { url: "https://cdn.test/image.webp", path: "2026/07/id.webp" } }), { status: 201 }));
  const onInsert = vi.fn();
  render(<ImageUploadDialog open adminKey="key" onClose={vi.fn()} onInsert={onInsert} />);
  fireEvent.change(screen.getByLabelText("Image file"), { target: { files: [new File(["image"], "image.webp", { type: "image/webp" })] } });
  fireEvent.change(screen.getByLabelText("Alt text"), { target: { value: "A quantum processor" } });
  fireEvent.click(screen.getByRole("button", { name: "Upload and insert" }));
  await waitFor(() => expect(onInsert).toHaveBeenCalledWith({ src: "https://cdn.test/image.webp", alt: "A quantum processor" }));
  expect(vi.mocked(fetch).mock.calls[0][1]?.headers).toMatchObject({ "x-admin-key": "key" });
});
```

Add a third test returning status 500 and verify the dialog remains open with the server's safe error and an enabled retry button.

- [ ] **Step 2: Run tests and verify failure**

Run: `npm test -- --run src/components/admin/editor/ImageUploadDialog.test.tsx`

Expected: FAIL because the dialog is missing.

- [ ] **Step 3: Implement the dialog**

Use a native dialog-style overlay with `role="dialog"`, `aria-modal="true"`, a visible title, file input restricted by `accept="image/jpeg,image/png,image/webp,image/gif"`, alt-text input, Cancel, and Upload and insert. Do not set a multipart content-type header manually. Disable fields and actions while uploading; label the busy action `Uploading…`.

Reset file, alt text, and error after successful insertion or when reopened. Preserve them after failure. Do not log the admin key or server response body.

- [ ] **Step 4: Wire the dialog into Tiptap**

The toolbar's Insert image button opens the dialog. `onInsert` runs:

```ts
editor.chain().focus().setImage({ src: image.src, alt: image.alt }).run();
setImageDialogOpen(false);
```

Extend the editor test to insert an image through a mocked upload and assert `onChange` receives HTML containing the safe `src` and `alt`.

- [ ] **Step 5: Verify and commit**

Run:

```bash
npm test -- --run src/components/admin/editor/ImageUploadDialog.test.tsx src/components/admin/editor/RichTextEditor.test.tsx
npm run lint
```

Expected: all focused tests pass and lint exits 0.

Commit with `git commit -m "feat: insert accessible post images"`.

---

### Task 5: Integrate the Editor and Sanitize Post Writes

**Files:**
- Create: `src/components/admin/PostEditorForm.tsx`
- Create: `src/components/admin/PostEditorForm.test.tsx`
- Create: `src/app/api/admin/posts/route.test.ts`
- Modify: `src/app/admin/page.tsx`
- Modify: `src/app/api/admin/posts/route.ts`

**Interfaces:**
- `PostEditorForm` consumes the existing form values, setters, `adminKey`, `loading`, editing state, and save handler from AdminPage.
- The posts route consumes `sanitizePostHtml(postBody)` before insert/update.

- [ ] **Step 1: Write failing posts-route sanitizer tests**

Mock `supabaseAdmin` with the existing fluent-query pattern. Verify POST and PATCH both pass sanitized bodies into Supabase:

```ts
expect(insert).toHaveBeenCalledWith(expect.objectContaining({
  body: "<p>Safe</p>",
}));
expect(update).toHaveBeenCalledWith(expect.objectContaining({
  body: '<p><img src="https://cdn.test/image.webp" alt="Description" /></p>',
}));
```

Use inputs containing `<script>`, `onclick`, and a safe image to prove the boundary behavior. Also keep required-title/pillar and missing-id regression cases.

- [ ] **Step 2: Run the route test and verify failure**

Run: `npm test -- --run src/app/api/admin/posts/route.test.ts`

Expected: FAIL because the route currently forwards raw `postBody`.

- [ ] **Step 3: Sanitize POST and PATCH bodies**

Import `sanitizePostHtml`. Change only body assignments:

```ts
body: sanitizePostHtml(typeof postBody === "string" ? postBody : ""),
```

and:

```ts
if (postBody !== undefined) {
  updates.body = sanitizePostHtml(typeof postBody === "string" ? postBody : "");
}
```

Do not alter webhook ingestion in this task; webhook-created posts already flow through a separate trusted pipeline contract and need a separate migration decision if its markup expands later.

- [ ] **Step 4: Extract and test the post form**

Move the existing create/edit form markup into `PostEditorForm.tsx` without changing labels, field behavior, submit behavior, or layout outside Body. Give it explicit typed props. Replace the Body textarea with:

```tsx
<RichTextEditor value={body} onChange={setBody} adminKey={adminKey} />
```

In `PostEditorForm.test.tsx`, mock `RichTextEditor` as a textarea that calls `onChange`. Verify an existing body is supplied, an editor change reaches the form state, and submitting passes the updated HTML to the supplied save handler. This isolates AdminPage from Tiptap internals.

- [ ] **Step 5: Compose the extracted form in AdminPage**

Replace only the `tab === "create"` form block with `PostEditorForm`, passing the existing state, setters, `handleTitleChange`, `handleSave`, `editingId`, `loading`, and `adminKey`. Keep `startEdit`, `resetForm`, and API request construction unchanged.

- [ ] **Step 6: Verify and commit**

Run:

```bash
npm test -- --run src/app/api/admin/posts/route.test.ts src/components/admin/PostEditorForm.test.tsx
npm test -- --run
npm run lint
```

Expected: all focused and full tests pass and lint exits 0.

Commit with `git commit -m "feat: integrate rich text post editing"`.

---

### Task 6: Apply Darqera Editor Styling and Complete Verification

**Files:**
- Modify: `src/app/globals.css`
- Modify: `src/components/admin/editor/EditorToolbar.tsx`
- Modify: `src/components/admin/editor/RichTextEditor.tsx`
- Modify: `src/components/admin/editor/ImageUploadDialog.tsx`

**Interfaces:**
- No new public interface; visual changes remain scoped beneath `.admin-rich-editor` and `.admin-image-dialog`.

- [ ] **Step 1: Add scoped editorial styles**

Add CSS for:

- A sticky, wrapping toolbar with a solid admin-card background and visible bottom border.
- Clear active, hover, focus-visible, and disabled states using existing CSS variables.
- A minimum 28rem writing surface with responsive padding.
- Published-like paragraph spacing, heading hierarchy, lists, blockquotes, links, and image sizing.
- Selected Tiptap nodes using `.ProseMirror-selectednode`.
- A monospaced source textarea with the same minimum height.
- A responsive dialog that fits narrow screens and preserves keyboard focus visibility.

Do not introduce a new color system. Use `--bg-card`, `--bg-secondary`, `--text-primary`, `--text-secondary`, `--text-muted`, `--border-ghost`, and `--brand-cyan`.

- [ ] **Step 2: Verify keyboard and accessible states in component tests**

Extend tests to assert toolbar buttons have accessible names, active formatting uses `aria-pressed`, the dialog has `aria-modal="true"`, and disabled upload/undo actions expose their state. Do not assert implementation-only class names.

- [ ] **Step 3: Run the complete local verification gate**

Run:

```bash
npm test -- --run
npm run lint
npm run build
git diff --check
git status --short
```

Expected: all tests pass, lint and build exit 0, no whitespace errors, and only intended files are modified.

- [ ] **Step 4: Commit final polish**

```bash
git add src/app/globals.css src/components/admin/editor
git commit -m "style: polish the Darqera post editor"
```

- [ ] **Step 5: Prepare deployment without applying it automatically**

Run `npx supabase db push --dry-run` from the linked Darqera repository and confirm the output names only `0006_post_images_bucket.sql`. Fetch the Git remote and confirm there are no remote-only commits. Report both results before requesting permission to push or deploy.

- [ ] **Step 6: Production acceptance after authorized deployment**

After the user authorizes push/deploy:

1. Apply the single Supabase migration.
2. Push the verified branch and wait for a READY Vercel deployment.
3. Open Day 1 in Admin and confirm the body shows formatted paragraphs, not literal `<p>` tags.
4. Make a harmless draft-only formatting change, save it, reopen the draft, and confirm it persists.
5. Upload one WebP or PNG with alt text into a draft, confirm it renders, then remove it from the draft if it was only a test asset.
6. Confirm a request to the upload endpoint without an admin key returns 401.

Do not publish or modify the live Day 1 post's published content as part of acceptance testing.
