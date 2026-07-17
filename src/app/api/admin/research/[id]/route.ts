import { type NextRequest } from "next/server";

import { checkAdminAuth, unauthorized } from "@/lib/adminAuth";
import { researchErrorResponse } from "@/lib/research/http";
import { getPacketDetail } from "@/lib/research/store";

export async function GET(
  request: NextRequest,
  context: RouteContext<"/api/admin/research/[id]">,
) {
  if (!checkAdminAuth(request)) return unauthorized();
  const { id } = await context.params;
  try {
    return Response.json({ packet: await getPacketDetail(id) });
  } catch (error) {
    return researchErrorResponse(error);
  }
}
