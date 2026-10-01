"use client";

import { useState } from "react";

type CoverImageFieldProps = {
  adminKey: string;
  image: string;
  alt: string;
  onImage(value: string): void;
  onAlt(value: string): void;
};

const labelClass = "block text-[10px] font-semibold tracking-widest uppercase mb-2";
const inputStyle = {
  backgroundColor: "var(--bg-card)",
  color: "var(--text-primary)",
  border: "1px solid var(--border-ghost)",
};

export function CoverImageField({ adminKey, image, alt, onImage, onAlt }: CoverImageFieldProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  async function handleFile(file: File | undefined) {
    if (!file) return;
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
      const result = (await response.json().catch(() => ({}))) as {
        image?: { url?: string };
        error?: string;
      };
      if (!response.ok || !result.image?.url) {
        setError(result.error || "Image upload failed. Please try again.");
        return;
      }
      onImage(result.image.url);
    } catch {
      setError("Image upload failed. Please try again.");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div>
      <label htmlFor="admin-cover" className={labelClass} style={{ color: "var(--text-muted)" }}>
        Cover image (optional)
      </label>
      {image ? (
        <div className="flex flex-col gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element -- admin preview of an arbitrary uploaded URL */}
          <img src={image} alt={alt} className="w-full max-h-56 object-cover rounded-md" />
          <input
            type="text"
            value={alt}
            onChange={(event) => onAlt(event.target.value)}
            placeholder="Describe the image (required for accessibility)"
            aria-label="Cover image description"
            required
            className="w-full px-4 py-2.5 text-sm rounded-[0.125rem] outline-none placeholder:opacity-40"
            style={inputStyle}
          />
          <button
            type="button"
            onClick={() => {
              onImage("");
              onAlt("");
            }}
            className="self-start text-xs underline"
            style={{ color: "var(--text-muted)" }}
          >
            Remove cover image
          </button>
        </div>
      ) : (
        <input
          id="admin-cover"
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          disabled={uploading}
          onChange={(event) => handleFile(event.target.files?.[0])}
          className="w-full text-sm"
          style={{ color: "var(--text-muted)" }}
        />
      )}
      {uploading && (
        <p className="text-xs mt-2" style={{ color: "var(--text-muted)" }}>
          Uploading…
        </p>
      )}
      {error && (
        <p role="alert" className="text-xs mt-2" style={{ color: "#ff6b6b" }}>
          {error}
        </p>
      )}
      <p className="text-xs mt-2" style={{ color: "var(--text-muted)" }}>
        Wide images work best (16:9, at least 1600px). Without one, the post uses generative art for its pillar.
      </p>
    </div>
  );
}
