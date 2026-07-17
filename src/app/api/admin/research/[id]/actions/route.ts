import { type NextRequest } from "next/server";

import { checkAdminAuth, unauthorized } from "@/lib/adminAuth";
import { performPacketAction } from "@/lib/research/actions";
import { parsePacketAction, researchErrorResponse } from "@/lib/research/http";

export async function POST(
  request: NextRequest,
  context: RouteContext<"/api/admin/research/[id]/actions">,
) {
  if (!checkAdminAuth(request)) return unauthorized();
  const { id } = await context.params;
  try {
    const body = await request.json();
    const action = parsePacketAction(
      id,
      body,
      "darqera",
      request.headers.get("x-admin-actor") || "darqera-admin",
    );
    return Response.json({ result: await performPacketAction(action) });
  } catch (error) {
    return researchErrorResponse(error);
  }
}
