import { timingSafeEqual } from "crypto";
import { type NextRequest } from "next/server";

/**
 * Shared admin auth for API routes. Accepts either transport:
 *   x-admin-key: <key>            (admin UI)
 *   Authorization: Bearer <key>   (pipeline webhook)
 */
export function checkAdminAuth(request: NextRequest): boolean {
  const adminKey = process.env.ADMIN_SECRET_KEY;
  if (!adminKey) return false;

  const bearer = request.headers.get("authorization");
  const provided =
    request.headers.get("x-admin-key") ??
    (bearer?.startsWith("Bearer ") ? bearer.slice(7) : null);
  if (!provided) return false;

  const a = Buffer.from(provided);
  const b = Buffer.from(adminKey);
  return a.length === b.length && timingSafeEqual(a, b);
}

export function unauthorized() {
  return Response.json({ error: "Unauthorized" }, { status: 401 });
}
