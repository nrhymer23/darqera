import { type NextRequest } from "next/server";
import { checkAdminAuth, unauthorized } from "@/lib/adminAuth";
import { uploadPostImage } from "@/lib/postImages";

const VALIDATION_ERRORS = new Set([
  "Choose a JPEG, PNG, WebP, or GIF image.",
  "Images must be 10 MB or smaller.",
]);

export async function POST(request: NextRequest) {
  if (!checkAdminAuth(request)) return unauthorized();

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return Response.json({ error: "A multipart image file is required." }, { status: 400 });
  }

  const file = form.get("file");
  if (!(file instanceof File)) {
    return Response.json({ error: "A multipart image file is required." }, { status: 400 });
  }

  try {
    const image = await uploadPostImage(file);
    return Response.json({ image }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Image upload failed.";
    if (VALIDATION_ERRORS.has(message)) {
      return Response.json({ error: message }, { status: 400 });
    }
    if (message === "Image storage is unavailable.") {
      return Response.json({ error: message }, { status: 503 });
    }
    return Response.json({ error: "Image upload failed." }, { status: 500 });
  }
}
