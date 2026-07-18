import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const POST_IMAGE_MAX_BYTES = 10 * 1024 * 1024;
export const POST_IMAGE_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);

const EXTENSIONS: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
};

export function validatePostImage(file: File): void {
  if (!POST_IMAGE_TYPES.has(file.type)) {
    throw new Error("Choose a JPEG, PNG, WebP, or GIF image.");
  }
  if (file.size > POST_IMAGE_MAX_BYTES) {
    throw new Error("Images must be 10 MB or smaller.");
  }
}

export async function uploadPostImage(
  file: File,
): Promise<{ url: string; path: string }> {
  validatePostImage(file);
  if (!supabaseAdmin) throw new Error("Image storage is unavailable.");

  const now = new Date();
  const year = now.getUTCFullYear();
  const month = String(now.getUTCMonth() + 1).padStart(2, "0");
  const path = `${year}/${month}/${crypto.randomUUID()}.${EXTENSIONS[file.type]}`;
  const bucket = supabaseAdmin.storage.from("post-images");
  const { error } = await bucket.upload(path, file, {
    cacheControl: "31536000",
    contentType: file.type,
    upsert: false,
  });

  if (error) throw new Error("Image upload failed.");

  return {
    url: bucket.getPublicUrl(path).data.publicUrl,
    path,
  };
}
