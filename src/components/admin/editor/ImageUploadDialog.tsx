"use client";

import { useEffect, useRef, useState } from "react";

type ImageUploadDialogProps = {
  open: boolean;
  adminKey: string;
  onClose(): void;
  onInsert(image: { src: string; alt: string }): void;
};

type UploadResponse = {
  image?: { url?: string };
  error?: string;
};

const defaultUploadError = "Image upload failed. Please try again.";

export function ImageUploadDialog({
  open,
  adminKey,
  onClose,
  onInsert,
}: ImageUploadDialogProps) {
  const [file, setFile] = useState<File | null>(null);
  const [alt, setAlt] = useState("");
  const [error, setError] = useState("");
  const [uploading, setUploading] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);
  const dialog = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const returnFocus = document.activeElement instanceof HTMLElement
      ? document.activeElement
      : null;
    setFile(null);
    setAlt("");
    setError("");
    setUploading(false);
    if (fileInput.current) fileInput.current.value = "";
    fileInput.current?.focus();
    return () => returnFocus?.focus();
  }, [open]);

  if (!open) return null;

  const reset = () => {
    setFile(null);
    setAlt("");
    setError("");
    if (fileInput.current) fileInput.current.value = "";
  };

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const description = alt.trim();
    if (!file || !description) {
      setError("Choose an image and describe it");
      return;
    }

    setUploading(true);
    setError("");
    try {
      const body = new FormData();
      body.append("file", file);
      const response = await fetch("/api/admin/uploads/images", {
        method: "POST",
        headers: { "x-admin-key": adminKey },
        body,
      });
      const result = (await response.json().catch(() => ({}))) as UploadResponse;
      if (!response.ok || !result.image?.url) {
        setError(result.error || defaultUploadError);
        return;
      }

      const imageUrl = new URL(result.image.url);
      if (imageUrl.protocol !== "https:") {
        setError(defaultUploadError);
        return;
      }

      onInsert({ src: result.image.url, alt: description });
      reset();
    } catch {
      setError(defaultUploadError);
    } finally {
      setUploading(false);
    }
  };

  const handleDialogKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Escape") {
      event.preventDefault();
      if (!uploading) onClose();
      return;
    }
    if (event.key !== "Tab") return;

    const focusable = Array.from(
      dialog.current?.querySelectorAll<HTMLElement>(
        'input:not([disabled]), button:not([disabled]), [tabindex]:not([tabindex="-1"])',
      ) ?? [],
    );
    if (!focusable.length) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  };

  return (
    <div
      ref={dialog}
      className="admin-rich-editor__image-dialog"
      role="dialog"
      aria-modal="true"
      aria-labelledby="image-upload-title"
      onKeyDown={handleDialogKeyDown}
    >
      <form onSubmit={submit}>
        <h2 id="image-upload-title">Insert image</h2>
        <label>
          Image file
          <input
            ref={fileInput}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            disabled={uploading}
            onChange={(event) => setFile(event.target.files?.[0] ?? null)}
          />
        </label>
        <label>
          Alt text
          <input
            type="text"
            value={alt}
            disabled={uploading}
            onChange={(event) => setAlt(event.target.value)}
          />
        </label>
        {error && <p role="alert">{error}</p>}
        <button type="button" disabled={uploading} onClick={onClose}>
          Cancel
        </button>
        <button type="submit" disabled={uploading}>
          {uploading ? "Uploading…" : "Upload and insert"}
        </button>
      </form>
    </div>
  );
}
