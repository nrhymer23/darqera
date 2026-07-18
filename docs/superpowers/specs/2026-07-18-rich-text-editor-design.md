# Darqera Rich-Text Editor Design

**Date:** 2026-07-18
**Status:** Approved for planning

## Problem

Darqera stores post bodies as HTML and the public post page renders that HTML correctly. The admin portal currently edits the same value in a plain textarea, so existing posts display literal markup such as `<p>` tags while editing. This makes routine editorial work unnecessarily technical.

## Goal

Replace the raw body textarea with a full visual editor that loads existing HTML as formatted content and continues saving compatible HTML to `posts.body`. Add secure image uploads without changing the post schema or public rendering path.

## Editor Architecture

Use Tiptap as a dedicated client-side `RichTextEditor` component inside the existing create/edit post form. The component receives the current HTML value and reports HTML changes to the form. Post creation, post updates, status handling, and all non-body fields remain unchanged.

The editor has two modes:

1. Visual mode for normal writing and formatting.
2. HTML source mode for advanced inspection and corrections.

Switching modes preserves the current document. Existing post HTML, including Day 1's paragraph tags, opens as formatted paragraphs rather than literal markup.

## Formatting Controls

The toolbar includes:

- Paragraph and headings 1–3
- Bold, italic, underline, and strikethrough
- Left, center, and right alignment
- Bulleted and numbered lists
- Blockquotes
- Add, edit, and remove links
- Insert image
- Undo and redo
- Clear formatting
- Visual and HTML source toggle

The toolbar uses the existing dark Darqera admin language, remains visible while writing, exposes accessible labels and active states, and supports keyboard behavior supplied by Tiptap. The writing surface visually approximates the published article typography so formatting decisions are predictable.

## HTML Compatibility and Safety

The canonical database representation remains HTML in `posts.body`. No post migration is required.

Pasted content and HTML source edits are normalized to the supported document schema. The server sanitizes the body before insert or update. It preserves approved editorial markup and attributes while removing scripts, inline event handlers, embedded objects, and unsafe URL schemes.

Allowed content includes:

- Paragraphs and line breaks
- Headings 1–3
- Bold, italic, underline, and strikethrough
- Ordered and unordered lists with list items
- Blockquotes
- Safe links
- Text alignment attributes or classes emitted by the editor
- Images with safe public URLs and required alt text

The public post renderer continues consuming the stored HTML as it does today.

## Image Upload Flow

The Insert image control opens a focused dialog with:

- Local file selection
- Required alt text
- Upload progress
- Inline validation and recoverable error messages

The first version accepts JPEG, PNG, WebP, and GIF files up to 10 MB. A failed upload does not modify the document.

The browser sends multipart form data to a new protected admin endpoint. The endpoint:

1. Verifies the existing Darqera admin key.
2. Validates file presence, MIME type, and size.
3. Creates a collision-resistant storage path.
4. Uploads through the server-side Supabase client.
5. Returns the public image URL.

The endpoint never exposes the Supabase service-role key. Images live in a dedicated public `post-images` Supabase Storage bucket. A versioned Supabase migration creates the bucket and storage policies needed for public reads; writes continue exclusively through the authenticated server endpoint.

After a successful upload, the editor inserts an image node containing the returned URL and supplied alt text.

## Error Handling

- Editor initialization failure leaves the rest of the form usable and displays a clear error instead of silently losing content.
- Invalid source HTML is normalized when returning to visual mode and again on the server before persistence.
- Image validation errors identify the unsupported type, missing alt text, or exceeded size limit.
- Upload failures keep the dialog open so the user can retry.
- Post save failures retain the current editor state through the existing admin error flow.

## Component Boundaries

- `RichTextEditor`: owns Tiptap lifecycle, formatting toolbar, mode switching, and editor-to-form updates.
- `EditorToolbar`: renders controls and reflects the current selection state.
- `ImageUploadDialog`: validates user input, calls the upload endpoint, and returns an inserted image payload.
- Admin image API route: authenticates, validates, uploads, and returns a public URL.
- HTML sanitizer utility: defines the supported server-side HTML contract for create and update requests.
- Supabase migration: creates and secures the `post-images` bucket.

These units communicate through explicit props or request/response types and can be tested independently.

## Testing

Automated coverage will verify:

- Existing paragraph HTML loads as a visual document.
- Standard formatting commands generate compatible HTML.
- Editor updates propagate to the post form.
- Visual/source mode changes preserve and normalize content.
- Pasted and source HTML cannot persist unsafe markup.
- Upload authentication and file validation.
- Successful image storage and URL responses.
- Required image alt text and insertion behavior.
- Post create and edit flows continue saving the body correctly.

Full project tests, lint, and a production build must pass before integration. The Supabase migration will be dry-run before deployment, and production will be checked with an existing HTML post plus one image-upload test.

## Out of Scope

- Collaborative multi-user editing
- Comments or tracked changes
- Video, audio, or arbitrary file embeds
- Image cropping or a full media library
- Changing the public post body format away from HTML
- Reworking the rest of the post form

## Success Criteria

An admin can open Day 1 and see formatted paragraphs instead of `<p>` tags, edit with familiar formatting controls, insert an accessible uploaded image, save the post, and see equivalent safe formatting on the public page without manually editing HTML.
